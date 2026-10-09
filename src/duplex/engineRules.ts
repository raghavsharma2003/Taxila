/**
 * Stage A of the Continuous Conversational Engine (ARCHITECTURE.md v2 §2.5.8, §2.6, §5.1): rules over code features, plus
 * a fast Azure LLM's semantic estimate when one is fresh (open contexts only), behind the shared governor.
 *
 * Two halves, so stage B can reuse the second one unchanged:
 *   estimate(tick)        → pComplete, pHoldWanted, pBackchannel, the projected pComplete for preparation, reason codes.
 *                           The §2.5.8 combiner with the context biases of config.ts (weights [E], fitted in DX-3).
 *   decide(tick, est, m)  → one proposed action per phase + a PrepareHint (draft / warm TTS / STT probe, with hysteresis).
 *                           The governor (governor.ts) then applies the vetoes no model can override.
 *
 * What makes it continuous: nothing here waits for silence to START deciding. A complete answer of the asked form whose
 * words cover the child's audio is complete with zero silence ("62" after "27 + 35?"); silence enters only as a saturating
 * normalised term (log(1 + silence / the child's own hold p90)) and as the governor's backstop when the engine stays unsure.
 * Two explicit waits remain, both from the design, both short: a hesitant FIRST value waits ~300 ms of silence (M-B1:
 * hesitant first values were wrong 21/21), and a word / phrase answer needs prosodic finality or ~300 ms (no key to check).
 *
 * Deterministic, synchronous, ≤ 1 ms. Prosody is used for timing only. Erasable TypeScript.
 */
import type {
  ActionDetail, DuplexEngine, EngineAction, EngineContractVersion, EngineDecision, EngineId, EngineSession, EngineTick,
  ExchangeContext, FirstSound, PauseClass, PrepareHint, Prob, ReactKind, ReasonCode, SpeakReason,
} from "./engine.ts";
import {
  ACOUSTIC_FRESH_MS, BAND_PACE, BOP, CONTEXT, CUT_IN, HESITANT_VALUE_SILENCE_MS, HOLD, HORIZON_MS, PAUSE_WAIT, PHRASE_SILENCE_MS, PREPARE,
  RATE, SAFETY, SEMANTIC_DECAY_MS, VERDICT, WEAKER_LANGUAGE_STRETCH, WT1_DEFAULT,
} from "./config.ts";
import { classifyOverlap } from "./overlap.ts";

export const STAGE_A: EngineId = { id: "rules-a", stage: "A", version: "2026-10-09.r3" };
const CONTRACT: EngineContractVersion = "cce/2026-10-04";

const sig = (z: number): number => 1 / (1 + Math.exp(-z));
/** pComplete ceiling for open explanations from lexical/prosodic evidence alone (below CONTEXT.open_explanation.speakPc). [E] */
export const EXPLAIN_SENTENCE_CAP = 0.8;
const logit = (p: number): number => { const q = Math.min(0.995, Math.max(0.005, p)); return Math.log(q / (1 - q)); };

export interface Estimate {
  pComplete: Prob;
  pHoldWanted: Prob;
  /** pComplete without the horizon penalty and the voicing term: "if what is visible were the end". Drives preparation. */
  pProjected: Prob;
  pBackchannel: Prob;
  /** The context row actually used (a complete question to her switches any context to question_to_her). */
  exchange: ExchangeContext;
  holdP50: number;
  holdP90: number;
  /** Lexical evidence is about an old prefix (G5's condition) and no fresh acoustic estimate vouches for the tail. */
  horizonBlocked: boolean;
  /** A fresh acoustic estimate >= HORIZON_ACOUSTIC_P vouches for the unseen tail. */
  acousticVouches: boolean;
  reasons: ReasonCode[];
}

/** The child's own hold-pause profile (band defaults until session 3; x1.3 in the weaker language; never below the band floor under strain). */
export function holdProfile(tick: EngineTick): { p50: number; p90: number } {
  const band = BAND_PACE[tick.context.band] ?? BAND_PACE.B3;
  const own = tick.pace.holdPauseMs && tick.pace.sessions >= 3 ? tick.pace.holdPauseMs : null;
  let p50 = own ? own.p50 : band.p50, p90 = own ? own.p90 : band.p90;
  if (tick.pace.strain) { p50 = Math.max(p50, band.p50); p90 = Math.max(p90, band.p90); }
  if (tick.context.weakerLanguage) { p50 *= WEAKER_LANGUAGE_STRETCH; p90 *= WEAKER_LANGUAGE_STRETCH; }
  return { p50, p90 };
}

export function exchangeOf(tick: EngineTick): ExchangeContext {
  const m = tick.markers;
  if (m.asks && m.questionComplete) return "question_to_her";
  // duplex-real (eot-bench Hindi, real STT): after a yes/no question, "हाँ जी, …" that runs past a short yes/no is an
  // ELABORATION, read as a free turn (its waits and backstop), not the closed answer: 40/53 of those >= 500 ms thinking
  // pauses were cut on the India lane. A bare "हाँ" / "नहीं दीदी" / "हाँ समझ आया" (<= 3 words) stays a closed answer.
  if (tick.context.exchange === "closed_answer" && tick.context.expected?.form === "yes_no" && wordCount(tick.transcript.text) > YES_NO_MAX_WORDS) return "free";
  return tick.context.exchange;
}

/** The §2.5.8 combiner. Weights are the design's starting values [E]; context biases from config.ts. */
export function estimate(tick: EngineTick): Estimate {
  const m = tick.markers, c = tick.child, tr = tick.transcript, pr = c.prosody;
  const exchange = exchangeOf(tick);
  const row = CONTEXT[exchange];
  const { p50, p90 } = holdProfile(tick);
  const reasons: ReasonCode[] = [];
  const sil = c.silenceRunMs ?? 0;
  const silTerm = Math.log(1 + sil / Math.max(200, p90));
  const closed = exchange === "closed_answer" && !!tick.context.expected;
  // prosody (timing only): finality = falling f0 into the child's low tercile, falling energy, lengthening; continuation = level/rising
  const falling = pr.f0SlopeStPerS !== null && pr.f0SlopeStPerS <= -4;
  const low = pr.f0RelRange !== null && pr.f0RelRange <= 0.4;
  const eFall = pr.energySlopeDbPerS !== null && pr.energySlopeDbPerS <= -10;
  const prosodyFinal = !c.voicing && ((falling && (low || eFall)) || (falling && (pr.finalLengthening ?? 0) > 1.3));
  // a rise that closes a complete question is the question's own end, not a continuation (P7)
  const prosodyContinue = !c.voicing && !prosodyFinal && !m.questionComplete && pr.f0SlopeStPerS !== null && pr.f0SlopeStPerS > -2;
  if (prosodyFinal) reasons.push("prosody_final");
  if (prosodyContinue) reasons.push("prosody_continue");
  // the horizon: lexical evidence is about an old prefix while unseen child voice > 120 ms
  const ac = tick.estimates.acoustic;
  const acFresh = !!ac && tick.t - ac.atMs <= ACOUSTIC_FRESH_MS;
  const acousticVouches = acFresh && (ac as { pComplete: number }).pComplete >= 0.8;
  const unseen = tr.unseenVoicedMs > HORIZON_MS;
  if (unseen) reasons.push("lexical_horizon_unseen");
  // the semantic estimate: weight 0 once stale (another text), decaying over 1.5 s; open contexts only
  const sem = tick.estimates.semantic;
  let semW = 0;
  if (sem && !closed) {
    if (sem.forTextHash !== tr.textHash) reasons.push("semantic_stale");
    else semW = Math.max(0, 1 - (tick.t - sem.arrivedAt) / SEMANTIC_DECAY_MS);
  }
  const firstValueAfterHesitation = closed && m.values.length === 1 && c.pausesThisTurn >= 1;
  const screenSubmit = tick.screen.events.some((e) => e.kind === "submit" || e.kind === "choice_pick");
  const f = m.form;
  if (f === "complete") reasons.push("form_complete");
  if (f === "prefix_ambiguous") reasons.push("form_prefix_ambiguous");
  if (f === "pending") reasons.push("form_pending");
  if (f === "overfull") reasons.push("form_overfull");
  let zBase = row.bC
    + (f === "complete" ? 2.5 : 0) - (f === "prefix_ambiguous" ? 1.5 : 0) - (f === "pending" ? 3.0 : 0) - (f === "overfull" ? 3.0 : 0)
    - (firstValueAfterHesitation ? 1.0 : 0)
    + 1.2 * logit(tr.text ? m.lexP : 0.05)
    + 1.0 * semW * (sem ? logit(sem.pComplete) : 0)
    + 1.0 * (acFresh ? logit((ac as { pComplete: number }).pComplete) : 0)
    + (prosodyFinal ? 0.6 : 0) - (prosodyContinue ? 0.6 : 0)
    + row.wSil * silTerm
    + 1.5 * (m.yieldTag ? 1 : 0) + 1.5 * (m.idk ? 1 : 0) + 1.2 * (m.questionComplete ? 1 : 0) + 1.0 * (screenSubmit ? 1 : 0)
    - 3.0 * (m.repairOpen ? 1 : 0) - 2.0 * (m.holdRequest ? 1 : 0) - 1.5 * (m.openTail ? 1 : 0) - 1.5 * (m.fillerTail ? 1 : 0)
    - 1.2 * (m.projection ? 1 : 0) - 1.0 * (m.wordSearch ? 1 : 0) - 0.8 * (m.codeSwitchAtEdge ? 1 : 0);
  if (!tr.text) zBase -= 2.0;
  // unreadable newest words (another script): never complete on their own; the backstop asks again (critique 2026-10-04)
  if (m.unreadable) { zBase -= 4.0; reasons.push("transcript_unstable"); }
  // a closed question with NO value of the asked form yet: a finished-sounding clause is not an answer (completeness is
  // relative to the question). TaxilaFDB train, 2026-10-04: off-task drift chunks ("वहाँ एक बहुत बड़ा dog था") were
  // taken as turn ends in 46/192 drift pauses on the fast lane. idk / a question / a yield tag still end the turn.
  if (closed && f === "none" && !m.values.length && !m.idk && !m.questionComplete && !m.yieldTag && !m.repeatRequest) { zBase -= 1.5; reasons.push("x_closed_no_value"); }
  let zC = zBase - (unseen && !acousticVouches ? 4.0 : 0) - (c.voicing ? 2.0 : 0);
  // a finished SENTENCE is not a finished EXPLANATION (M-D7: "triangle के तीन sides होते हैं" + 1.6 s pause was cut 3/3).
  // Without a fresh semantic read, stage A is uncertain about explanation ends: cap below every open speakPc, so only the
  // semantic estimate, an idk / question / yield tag, or the governor's backstop ends a teach-back.
  const sentenceOnly = exchange === "open_explanation" && semW === 0 && !m.idk && !m.questionComplete && !m.repeatRequest && !m.yieldTag;
  if (sentenceOnly) { const cap = logit(EXPLAIN_SENTENCE_CAP); if (zC > cap) { zC = cap; reasons.push("x_explain_cap"); } }
  const zH = row.bH + 4.0 * (m.holdRequest ? 1 : 0) + 2.0 * (m.repairOpen ? 1 : 0)
    + 1.5 * Math.max(m.fillerTail ? 1 : 0, m.openTail ? 1 : 0, m.projection ? 1 : 0, m.wordSearch ? 1 : 0)
    + 1.0 * (tick.screen.busy ? 1 : 0) + 1.0 * (c.voicing ? 1 : 0)
    - 1.5 * (m.yieldTag ? 1 : 0) - 2.0 * (m.idk ? 1 : 0) - 1.0 * (m.questionComplete ? 1 : 0) - 1.0 * (f === "complete" ? 1 : 0)
    - row.wHSil * silTerm;
  if (m.holdRequest) reasons.push("hold_request");
  if (m.repairOpen) reasons.push("repair_open");
  if (m.repaired) reasons.push("repaired");
  if (m.fillerTail) reasons.push("filler_tail");
  if (m.openTail) reasons.push("open_tail");
  if (m.projection) reasons.push("projection");
  if (m.wordSearch) reasons.push("word_search");
  if (m.yieldTag) reasons.push("yield_tag");
  if (m.idk) reasons.push("idk");
  if (m.questionComplete) reasons.push("question_complete");
  if (m.codeSwitchAtEdge) reasons.push("code_switch_edge");
  if (semW > 0) reasons.push(sem && sem.pComplete >= 0.5 ? "semantic_complete" : "semantic_incomplete");
  if (acFresh) reasons.push((ac as { pComplete: number }).pComplete >= 0.5 ? "acoustic_complete" : "acoustic_incomplete");
  if (c.voicing) reasons.push("child_voicing");
  else if (c.silenceRunMs !== null) reasons.push(sil >= p50 ? "silence_long_for_child" : "silence_short_for_child");
  if (screenSubmit) reasons.push("screen_submit");
  if (tick.screen.busy) reasons.push("screen_busy");
  // a backchannel opportunity: a 200-500 ms falling dip after >= 1.5 s of child speech (content-blind)
  const dip = !c.voicing && sil >= BOP.dipMinMs && sil <= BOP.dipMaxMs && c.turnVoicedMs >= BOP.minVoicedMs;
  const bopShape = (falling || eFall) && (pr.f0RelRange === null || pr.f0RelRange <= BOP.lowRange + 0.15);
  const pBackchannel = dip && bopShape ? 0.8 : dip ? 0.35 : 0.05;
  if (pBackchannel >= 0.6) reasons.push("bop");
  return {
    pComplete: sig(zC), pHoldWanted: sig(zH), pProjected: sig(zBase), pBackchannel, exchange, holdP50: p50, holdP90: p90,
    horizonBlocked: unseen && !acousticVouches, acousticVouches, reasons,
  };
}

/** Per-session engine memory: preparation hysteresis and per-turn flags (reset on the phase changes it observes). */
export interface RulesMemory {
  draftLive: boolean;
  draftHash: string | null;
  lowSince: number | null;
  probedRunAt: number | null;
  reactedOnset: number | null;
  lastPhase: string | null;
  buildKeys: Set<string>;
  /** Round 3: the text hash of the live eager end of turn (null = none). */
  eagerHash: string | null;
}

export function newMemory(): RulesMemory {
  return { draftLive: false, draftHash: null, lowSince: null, probedRunAt: null, reactedOnset: null, lastPhase: null, buildKeys: new Set(), eagerHash: null };
}

/**
 * Round 3 (duplex): the pause class of the covered words outside a closed answer (docs/design/round3/duplex/RESEARCH.md §4).
 * Measured on 400 real Hindi turns through both real STT lanes (evals/duplex-r3, the pause table): a comma, a broken word, an
 * unclosed number and the open-tail shapes ended 0-4 turns against 10-21 thinking pauses each, while "complete-looking"
 * words (a closed sentence, a verb-final clause, a closed number) are genuinely ambiguous: 63 pauses against 267 ends, and
 * neither prosody (AUC 0.67-0.70) nor the fast semantic model (AUC 0.58) separates them in time. So the class sets the
 * WAIT, and only a hold shape buys a long one.
 */
export function pauseClass(tick: EngineTick): PauseClass {
  const m = tick.markers;
  if (m.holdRequest || m.openTail || m.fillerTail || m.projection || m.wordSearch || m.repairOpen) return "hold";
  if (m.endShape === "comma" || m.endShape === "broken") return "hold";
  if (m.idk) return "idk";
  if (m.enumerating) return "enumerating";
  if (m.questionComplete || m.repeatRequest) return "question";
  // a number with no closing mark on a lane that punctuates: the number is still being said ("मेरा नंबर है 700 …")
  if (m.endShape === "unclosed" && m.cue === "value") return "hold";
  return "complete";
}

const decision = (action: EngineAction, est: Estimate, reasons: ReasonCode[], detail: ActionDetail | undefined, id: EngineId, extra: Partial<EngineDecision> = {}): EngineDecision => ({
  action,
  confidence: action === "SPEAK" || action === "CUT_IN" ? Math.min(est.pComplete, 1 - est.pHoldWanted) : action === "HOLD" ? Math.max(1 - est.pComplete, est.pHoldWanted) : 0.7,
  pComplete: est.pComplete,
  pHoldWanted: est.pHoldWanted,
  pBackchannel: est.pBackchannel,
  reasons: [...reasons, ...est.reasons.filter((r) => !reasons.includes(r))].slice(0, 12),
  detail,
  engine: id,
  proposed: action,
  ...extra,
});

/** Preparation hints with hysteresis (§4.1): draft at projected pC >= 0.5, warm at >= 0.8, cancel below 0.35 for >= 300 ms. */
export function prepare(tick: EngineTick, est: Estimate, mem: RulesMemory, supportsProbe: boolean): PrepareHint {
  const tr = tick.transcript, c = tick.child;
  const childFloor = tick.phase === "child_turn" || tick.phase === "idle" || tick.phase === "handover";
  let draft: PrepareHint["draft"] = "none";
  let warmTts: PrepareHint["warmTts"] = "none";
  if (!childFloor || tick.safety.distress || !tr.text) {
    if (mem.draftLive && (tick.safety.distress || tick.phase === "hold_requested")) { draft = "cancel"; warmTts = "cancel"; mem.draftLive = false; mem.draftHash = null; }
  } else {
    const p = est.pProjected;
    if (p < PREPARE.cancelBelow) mem.lowSince ??= tick.t; else mem.lowSince = null;
    if (mem.draftLive && mem.lowSince !== null && tick.t - mem.lowSince >= PREPARE.cancelHoldMs) {
      draft = "cancel"; warmTts = "cancel"; mem.draftLive = false; mem.draftHash = null;
    } else if (p >= PREPARE.draftStart) {
      draft = mem.draftLive && mem.draftHash === tr.textHash ? "keep" : "start";
      mem.draftLive = true;
      mem.draftHash = tr.textHash;
      warmTts = p >= PREPARE.warmStart ? "start" : "none";
    } else if (mem.draftLive) draft = "keep";
  }
  // the MAI micro-commit probe (§2.5.4): an acoustic micro-pause >= 150 ms with falling energy, once per voiced run,
  // while the visible words do not yet cover the child's audio
  const sil = c.silenceRunMs ?? 0;
  const eFalling = c.prosody.energySlopeDbPerS === null || c.prosody.energySlopeDbPerS <= 0;
  const runKey = c.lastOffsetAt;
  let sttProbe = false;
  // energy need not fall on a rising question (M-D7 f01: the probe waited ~1.8 s for a falling slope and server VAD won)
  const pauseOk = sil >= PREPARE.probeSilenceMs && (eFalling || sil >= PREPARE.probeSilenceMs + 100);
  if (supportsProbe && childFloor && !c.voicing && pauseOk && runKey !== null && mem.probedRunAt !== runKey && tr.unseenVoicedMs > 0) {
    sttProbe = true;
    mem.probedRunAt = runKey;
  }
  // round 3: the EAGER END OF TURN. The covered words read as a finished turn → start the turn's model work on exactly these
  // words now (the floor decision still waits for PAUSE_WAIT); the child going on, or the words turning into a hold shape,
  // cancels it. Outside closed answers only (a complete closed answer commits at once anyway); never under distress.
  let eager: NonNullable<PrepareHint["eager"]> = "none";
  const eagerOk = childFloor && !c.voicing && !!tr.text && tr.unseenVoicedMs <= HORIZON_MS && !tick.safety.distress && sil >= PREPARE.probeSilenceMs
    && est.exchange !== "closed_answer";
  const pc = eagerOk ? pauseClass(tick) : null;
  if (pc !== null && pc !== "hold" && pc !== "enumerating") {
    eager = mem.eagerHash === tr.textHash ? "keep" : "start";
    mem.eagerHash = tr.textHash;
  } else if (mem.eagerHash !== null) {
    if (tick.phase === "committed") mem.eagerHash = null; // the turn took those words: nothing to cancel
    else if (c.voicing || (childFloor && !!tr.text && tr.textHash !== mem.eagerHash) || tick.safety.distress || tick.phase === "hold_requested") { eager = "cancel"; mem.eagerHash = null; }
    else eager = "keep";
  }
  // build intents from the screen (an aid request): prefetch keys only; reveals wait for a turn boundary
  let buildIntent: string | null = null;
  for (const e of tick.screen.events) {
    if (e.kind === "aid_request") {
      const k = `aid:${e.target ?? "any"}`;
      if (!mem.buildKeys.has(k)) { mem.buildKeys.add(k); buildIntent = k; }
    }
  }
  return { draft, warmTts, sttProbe, textHash: tr.textHash, buildIntent, eager };
}

/** The policy: one proposal per tick given the estimate. The governor disposes. */
export function decide(tick: EngineTick, est: Estimate, mem: RulesMemory, id: EngineId, supportsProbe: boolean): EngineDecision {
  const ph = tick.phase, c = tick.child, m = tick.markers, ctx = tick.context;
  if (mem.lastPhase !== ph) {
    if (ph === "handover" || (ph === "child_turn" && mem.lastPhase !== "committed" && mem.lastPhase !== "hold_requested")) { mem.buildKeys.clear(); }
    mem.lastPhase = ph;
  }
  const prep = prepare(tick, est, mem, supportsProbe);
  const sil = c.silenceRunMs;
  const row = CONTEXT[est.exchange];
  const extra = { prepare: prep, verdictReady: verdictReady(tick, est) };

  // ── her floor: listen while she speaks; the first 150-250 ms of overlap decide ──
  if (ph === "her_turn" || ph === "overlap") {
    if (tick.overlap) {
      const o = classifyOverlap(tick.overlap, { voicing: c.voicing, f0SlopeStPerS: c.prosody.f0SlopeStPerS }, ctx);
      const ex = { ...extra, overlapClass: o.cls, overlapP: o.p };
      if (o.decided && o.yieldReason) return decision("YIELD", est, o.codes, { action: "YIELD", reason: o.yieldReason, atWordBoundary: true, resumable: !o.lexical }, id, ex);
      if (o.decided && o.keepReason) return decision("KEEP_TALKING", est, o.codes, { action: "KEEP_TALKING", reason: o.keepReason, unduck: true }, id, ex);
      return decision("KEEP_TALKING", est, o.codes, { action: "KEEP_TALKING", reason: "too_short", unduck: false }, id, ex);
    }
    return decision("KEEP_TALKING", est, [], undefined, id, extra);
  }
  if (ph === "committed") return decision("REACT", est, [], { action: "REACT", kind: "thinking_glance" }, id, extra);

  // ── safety_attend: presence, and the safeguard at a transition point; never over the child ──
  if (ph === "safety_attend") {
    if (!c.voicing && sil !== null && (est.pComplete >= SAFETY.speakPc || sil >= SAFETY.silenceMs)) {
      return decision("SPEAK", est, [], { action: "SPEAK", reason: "safeguard", firstSound: "safeguard", verdictNotBefore: null }, id, extra);
    }
    return decision("REACT", est, [], { action: "REACT", kind: "calm_attend" }, id, extra);
  }

  // ── a granted hold: the face only; a check-in look at 8 s; an offer the child can refuse at 15 s ──
  if (ph === "hold_requested") {
    const quiet = sil ?? tick.t - tick.phaseSince;
    if (!c.voicing && quiet >= HOLD.offerMs) return decision("CUT_IN", est, ["hold_request"], { action: "CUT_IN", reason: "hold_offer" }, id, extra);
    if (!c.voicing && quiet >= HOLD.checkinMs) return decision("REACT", est, ["hold_request"], { action: "REACT", kind: "checkin_look" }, id, extra);
    return decision("REACT", est, ["hold_request"], { action: "REACT", kind: "hold_pose" }, id, extra);
  }

  // ── wait time I after her question: nothing said yet → the P4 ladder (code timer), never a repeat of the question ──
  if (ph === "handover" && c.firstOnsetAt === null && !tick.transcript.text) {
    const since = tick.t - (tick.her.handedOverAt ?? tick.phaseSince);
    const wt1 = ctx.wt1 ?? WT1_DEFAULT;
    if (since >= wt1.voiceMs) return decision("SPEAK", est, ["wt1_ladder"], { action: "SPEAK", reason: "wt1_nudge", firstSound: "prompt", verdictNotBefore: null }, id, extra);
    if (since >= wt1.faceMs) return decision("REACT", est, ["wt1_ladder"], { action: "REACT", kind: "nudge_face" }, id, extra);
    return decision("HOLD", est, [], { action: "HOLD", reason: "wt1_protected" }, id, extra);
  }

  // ── the child's floor ──
  if (c.voicing) {
    if (mem.reactedOnset !== c.lastOnsetAt && c.lastOnsetAt !== null && tick.t - c.lastOnsetAt <= 400) {
      mem.reactedOnset = c.lastOnsetAt;
      return decision("REACT", est, ["child_voicing"], { action: "REACT", kind: "listen_lean" }, id, extra);
    }
    return decision("HOLD", est, ["child_voicing"], { action: "HOLD", reason: "child_speaking" }, id, extra);
  }
  if (m.holdRequest) return decision("HOLD", est, ["hold_request"], { action: "HOLD", reason: "hold_request" }, id, extra);
  const quiet = sil ?? 0;
  // closed CUT_IN reasons (the governor checks the list, its condition and the flag again)
  if (m.wordSearch && ctx.cutIn.wordSearchCue === "offer" && quiet >= CUT_IN.wordSearchSilenceMs) {
    return decision("CUT_IN", est, ["word_search"], { action: "CUT_IN", reason: "word_search_cue" }, id, extra);
  }
  const offTaskLimit = ctx.cutIn.offTaskMs ?? (ctx.band === "B2" ? CUT_IN.offTaskB2 : CUT_IN.offTaskB3);
  if (m.offTaskMs >= offTaskLimit && quiet >= CUT_IN.offTaskPauseMs && !m.openTail) {
    return decision("CUT_IN", est, ["off_task"], { action: "CUT_IN", reason: "off_task_drift" }, id, extra);
  }
  if (m.asks && m.questionComplete && est.pHoldWanted > row.speakPh && quiet >= CUT_IN.microPauseMs) {
    return decision("CUT_IN", est, ["question_complete"], { action: "CUT_IN", reason: "question_to_her" }, id, extra);
  }
  // a turn end that calls for a reply
  const speakReason: SpeakReason | null = m.idk ? "idk_help" : m.repeatRequest ? "repair_request" : null;
  const ready = est.pComplete >= row.speakPc && est.pHoldWanted <= row.speakPh;
  const waits = extraWait(tick, est);
  if ((ready || (speakReason && !est.horizonBlocked)) && quiet >= waits) {
    const fs: FirstSound = est.exchange === "closed_answer" && m.values.length ? "uptake" : "body";
    return decision("SPEAK", est, [], { action: "SPEAK", reason: speakReason ?? "turn_end", firstSound: fs, verdictNotBefore: verdictNotBefore(tick) }, id, extra);
  }
  // listening behaviour in a pause: a content-blind nod on a backchannel opportunity; a visible "still with you"
  if (row.nods && est.pBackchannel >= 0.6 && ctx.exchange !== "closed_answer") {
    const mmOk = ctx.allowAudioBackchannel && quiet >= BOP.mmDipMinMs && c.turnVoicedMs >= RATE.mmMinVoicedMs;
    return decision("BACKCHANNEL", est, ["bop"], { action: "BACKCHANNEL", kind: mmOk ? "mm" : "nod" }, id, extra);
  }
  const kind: ReactKind | null = est.pComplete >= PREPARE.cancelBelow && quiet >= 250 ? "still_with_you" : null;
  if (kind) return decision("REACT", est, [], { action: "REACT", kind }, id, extra);
  const hold = est.horizonBlocked ? "lexical_horizon" : m.wordSearch ? "word_search" : m.repairOpen ? "repair_open" : tick.screen.busy ? "screen_busy" : quiet > 0 ? "thinking_pause" : "uncertain";
  return decision("HOLD", est, [], { action: "HOLD", reason: hold }, id, extra);
}

/** The two short explicit waits the design keeps (both after a value has been heard; neither is a gate on deciding). */
export function extraWait(tick: EngineTick, est: Estimate): number {
  const m = tick.markers, c = tick.child;
  const closed = est.exchange === "closed_answer" && !!tick.context.expected;
  if (!closed) {
    if (est.exchange === "closed_answer") return 0;
    // round 3: the word-aware end of turn: the least silence by the pause class of the covered words (PAUSE_WAIT). Before,
    // a finished question to her waited 0 ms and cut 4/9 of the >= 500 ms pauses after "…ठीक है?" / "…ना?" on real speech.
    return PAUSE_WAIT[pauseClass(tick)];
  }
  const form = tick.context.expected?.form;
  const finalProsody = est.reasons.includes("prosody_final");
  if ((form === "word" || form === "phrase") && !finalProsody) return PHRASE_SILENCE_MS;
  if (m.values.length === 1 && c.pausesThisTurn >= 1) return finalProsody ? HESITANT_VALUE_SILENCE_MS : HESITANT_VALUE_SILENCE_MS + 300;
  return 0;
}

/** A yes/no answer longer than this many words is an elaboration (exchangeOf). */
export const YES_NO_MAX_WORDS = 3;
const wordCount = (t: string): number => String(t ?? "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

/**
 * The verdict clock's anchor: the LATER of the last value's end and the child's last voiced frame. Anchoring on the value
 * word alone let a unit or tail word eat the wait ("पंद्रह | सेंटीमीटर [1.4 s] सॉरी बारह": value end + 2.0 s fell 90 ms before
 * the child's "सॉरी", so the verdict on 15 played; critique 2026-10-04, TaxilaFDB test F1.rep_marker 4/40 on the fast
 * lane). A verdict now needs VERDICT.delayMs of the child's own silence after both.
 */
export function verdictAnchor(tick: EngineTick): number | null {
  const m = tick.markers;
  if (m.lastValueAgeMs === null) return null;
  const valueEnd = tick.t - m.lastValueAgeMs;
  const lastVoice = tick.child.voicing ? tick.t : tick.child.lastOffsetAt;
  return Math.max(valueEnd, lastVoice ?? valueEnd);
}

/** G7: the earliest time a verdict word may play on a closed answer (the anchor + VERDICT.delayMs). */
export function verdictNotBefore(tick: EngineTick): number | null {
  if (tick.context.exchange !== "closed_answer" || !tick.markers.values.length || tick.markers.lastValueAgeMs === null) return null;
  return (verdictAnchor(tick) as number) + VERDICT.delayMs;
}

export function verdictReady(tick: EngineTick, est: Estimate): boolean {
  const m = tick.markers;
  const a = verdictAnchor(tick);
  return a !== null && tick.t - a >= VERDICT.delayMs && !m.repairOpen && !est.horizonBlocked && !tick.child.voicing;
}

export class RulesEngine implements DuplexEngine {
  readonly id: EngineId;
  readonly contract: EngineContractVersion = CONTRACT;
  private mem: RulesMemory = newMemory();
  private supportsProbe: boolean;

  constructor(opts: { supportsProbe?: boolean; id?: EngineId } = {}) {
    this.supportsProbe = opts.supportsProbe ?? true;
    this.id = opts.id ?? STAGE_A;
  }

  reset(_session: EngineSession): void { this.mem = newMemory(); }

  tick(input: EngineTick): EngineDecision {
    const est = estimate(input);
    return decide(input, est, this.mem, this.id, this.supportsProbe);
  }

  /** Stage B reuses the policy with its own heads in place of the combiner. */
  decideWith(input: EngineTick, est: Estimate): EngineDecision {
    return decide(input, est, this.mem, this.id, this.supportsProbe);
  }
}
