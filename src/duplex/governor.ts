/**
 * THE GOVERNOR (ARCHITECTURE.md v2 §2.7): code, one copy, and every engine (stage A rules, stage B trained, a baseline)
 * runs behind it. An engine PROPOSES; the governor DISPOSES. It owns the floor state machine (FloorPhase) and applies the
 * vetoes no model can override, first match wins, each writing its reason code and keeping the engine's `proposed` action:
 *
 *   G1  safety, sticky       distress → safety_attend; her audio yields; only HOLD / REACT calm_attend / the safeguard
 *                            (child silent, pC >= 0.6 or 1.5 s) / CUT_IN safety (self_harm, held pause >= 1.5 s); drafts
 *                            and warm audio quarantined
 *   G2  safety barrier       no audio act before the predicate has seen text covering the audio the engine decided on
 *   G3  hold request         "ruko / ek minute / soch raha hoon" → hold_requested until the child voices again; only the face,
 *                            a check-in look at 8 s and an offer (CUT_IN hold_offer) at 15 s
 *   G4  phase legality       the action must be legal in the phase
 *   G5  lexical horizon      no SPEAK / CUT_IN while > 120 ms of child voice is unseen by the words (unless a fresh acoustic
 *                            estimate >= 0.8 vouches for it)
 *   G6  closed CUT_IN list   safety, word_search_cue, off_task_drift, question_to_her, hold_offer — each with its condition,
 *                            a micro-pause >= 200 ms, never over child voice, behind the cutIn flag (safety and the hold
 *                            offer are floor policy, not a flag)
 *   G7  verdict stability    fast mouth, late verdict: a closed-answer SPEAK carries verdictNotBefore = last value end + 1.2 s;
 *                            a child onset before her verdict word REVOKES (yield, merge, re-plan)
 *   G8  rate and legality    nod >= 3 s apart; "mm" >= 12 s and only with the audio flag; haan/acchha chit-chat only with the
 *                            lexical flag; no backchannel in a closed answer, a hold or safety; REACT changes >= 500 ms apart
 *   G9  WT1 protection       after her question and before any child speech, only the P4 ladder speaks
 *   G10 backstops            the engine stays unsure AND silence >= the context backstop → SPEAK backstop_silence; an engine
 *                            fault → stage A rules; a stage A fault → today's patient 900 ms silence policy (fail patient)
 *   G11 her floor            child voice >= 1 s over her, or the words say stop / repair / a turn → YIELD
 *
 * Deterministic for a given tick sequence. Erasable TypeScript.
 */
import type {
  ActionDetail, DuplexEngine, EngineAction, EngineDecision, EngineFlags, EngineId, EngineTick, FloorPhase, Ms, ReasonCode,
  SpeakReason,
} from "./engine.ts";
import {
  BACKSTOP_HOLD_PH, BACKSTOP_HOLD_STRETCH, CONTEXT, CUT_IN, FALLBACK, HOLD, HORIZON_ACOUSTIC_P, HORIZON_MS, OVERLAP, RATE,
  REVOCABLE_MS, SAFETY, VERDICT, ACOUSTIC_FRESH_MS, FIRST_TEXT_P90,
} from "./config.ts";
import { exchangeOf, holdProfile } from "./engineRules.ts";
import { overlapKind } from "./turnPolicy.ts";

export type GovernorEvent =
  | { kind: "phase"; from: FloorPhase; to: FloorPhase; at: Ms }
  /** A new child turn (epoch). carryFrom: the overlap onset whose words fold into it (a barge-in). */
  | { kind: "turn_begin"; at: Ms; carryFrom: Ms | null; turnSeq: number }
  | { kind: "quarantine"; at: Ms; safetyKind: string | null }
  | { kind: "revoke"; at: Ms }
  /** A resumable yield turned out to be a continuer (or nothing): she resumes from heardUpTo. */
  | { kind: "resume"; at: Ms }
  | { kind: "fallback"; to: "rules" | "silence"; at: Ms; error: string };

/** What the streams tell the governor between ticks (it owns the phase, so it hears these first). */
export type Observation =
  | { kind: "her_start"; t: Ms; utteranceId: string }
  | { kind: "her_end"; t: Ms; utteranceId: string; handsOver: boolean; childVoicing: boolean }
  | { kind: "her_stopped"; t: Ms }
  /** The verdict-bearing part of her reply started playing (the voice actuator reports it). */
  | { kind: "her_verdict"; t: Ms }
  | { kind: "child_onset"; t: Ms; at: Ms }
  /** A new Director context with no audio of hers in front of it (the very first item, a module turn). */
  | { kind: "context"; t: Ms; handsOver: boolean };

export interface Governed {
  decision: EngineDecision;
  phase: FloorPhase;
  phaseSince: Ms;
  events: GovernorEvent[];
}

export const GOVERNOR_ID: EngineId = { id: "governor", stage: "A", version: "2026-10-04.1" };

const CUT_IN_LIST = new Set(["safety", "word_search_cue", "off_task_drift", "question_to_her", "hold_offer"]);
const CHILD_FLOOR = new Set<FloorPhase>(["handover", "child_turn", "hold_requested", "safety_attend", "idle"]);
const HER_FLOOR = new Set<FloorPhase>(["her_turn", "overlap"]);
const LEGAL: Record<FloorPhase, Set<EngineAction>> = {
  her_turn: new Set(["KEEP_TALKING", "YIELD", "REACT"]),
  overlap: new Set(["KEEP_TALKING", "YIELD", "REACT"]),
  committed: new Set(["HOLD", "REACT", "YIELD"]),
  handover: new Set(["SPEAK", "HOLD", "BACKCHANNEL", "REACT", "CUT_IN"]),
  child_turn: new Set(["SPEAK", "HOLD", "BACKCHANNEL", "REACT", "CUT_IN"]),
  hold_requested: new Set(["HOLD", "REACT", "CUT_IN"]),
  safety_attend: new Set(["SPEAK", "HOLD", "REACT", "CUT_IN", "YIELD"]),
  idle: new Set(["SPEAK", "HOLD", "BACKCHANNEL", "REACT", "CUT_IN"]),
};
/** No reply should wait longer than this for her first sound; then the floor returns (TTS failed, the host never said). */
const COMMITTED_MAX_MS = 6000;
/** After a resumable yield, no words at all for this long (and little voice) → she resumes (NO_TEXT_RESUME_MS, M-D2 p90 + 300). [T] */
const NO_TEXT_RESUME_MS = 1600;

interface Spoke {
  at: Ms;
  reason: string;
  safeguard: boolean;
  verdictNotBefore: Ms | null;
  herStartAt: Ms | null;
  verdictPlayed: boolean;
}

export class Governor {
  phase: FloorPhase = "idle";
  phaseSince: Ms = 0;
  turnSeq = 0;
  /** Time of the last audible / visible act of each kind (rate limits). The host copies it into every tick. */
  lastActs: Partial<Record<"nod" | "mm" | "haan" | "acchha" | "react" | "speak" | "cut_in", Ms>> = {};
  lastGoverned: { action: EngineAction; detail?: ActionDetail; at: Ms } | null = null;
  private flags: EngineFlags;
  private fallback: DuplexEngine | null;
  private spoke: Spoke | null = null;
  private yielded: { at: Ms; resumable: boolean; onsetAt: Ms } | null = null;
  private overlapOnsetAt: Ms | null = null;
  private pendingRevoke = false;
  private pendingSafeguardDefer = false;
  private pose: string | null = null;
  private quarantined = false;
  private childSpoke = false;
  /** The transcript a hold was granted on (G3 grants once per text). */
  private holdGrantedHash: string | null = null;
  /** The onset of an overlap that was judged a continuer: its words fold into the turn if a later read yields (fold-in). */
  private carryOnsetAt: Ms | null = null;
  private events: GovernorEvent[] = [];
  /** baseline arms (silence-640, cascade-900) keep only G1/G2/G4: they are measured as they are, safety floor included. */
  private readonly mode: "full" | "baseline";

  constructor(opts: { flags: EngineFlags; fallback?: DuplexEngine | null; mode?: "full" | "baseline" }) {
    this.flags = opts.flags;
    this.fallback = opts.fallback ?? null;
    this.mode = opts.mode ?? "full";
  }

  private go(to: FloorPhase, at: Ms): void {
    if (to === this.phase) return;
    this.events.push({ kind: "phase", from: this.phase, to, at });
    this.phase = to;
    this.phaseSince = at;
  }

  private beginTurn(at: Ms, carryFrom: Ms | null): void {
    this.turnSeq++;
    this.childSpoke = carryFrom !== null;
    this.quarantined = false;
    this.holdGrantedHash = null;
    this.events.push({ kind: "turn_begin", at, carryFrom, turnSeq: this.turnSeq });
  }

  /** Stream observations, applied before the next tick is built. Returns the events they caused. */
  observe(o: Observation): GovernorEvent[] {
    this.events = [];
    switch (o.kind) {
      case "her_start":
        this.carryOnsetAt = null;
        if (this.phase === "committed" && this.spoke) this.spoke.herStartAt = o.t;
        if (this.phase !== "her_turn" && this.phase !== "overlap") this.go("her_turn", o.t);
        break;
      case "her_verdict":
        if (this.spoke) this.spoke.verdictPlayed = true;
        break;
      case "her_end": {
        const wasSafeguard = !!this.spoke?.safeguard;
        this.spoke = null;
        this.yielded = null;
        const carry = this.carryOnsetAt;
        this.carryOnsetAt = null;
        if (!HER_FLOOR.has(this.phase)) break;
        if (this.phase === "overlap" || o.childVoicing) {
          // she finished while the child was already talking: the overlap words are the child's next turn (fold-in)
          this.beginTurn(o.t, this.overlapOnsetAt ?? o.t);
          this.go("child_turn", o.t);
        } else if (carry !== null && (o.handsOver || wasSafeguard)) {
          // M-D7 i17: a short "छप्पन" over her question read as a continuer and she finished; its words land after her
          // hand-over. They are the child's answer: carry them into the new turn instead of starting WT1 on an answered question
          this.beginTurn(o.t, carry);
          this.go("child_turn", o.t);
        } else {
          this.beginTurn(o.t, null);
          this.go(o.handsOver || wasSafeguard ? "handover" : "idle", o.t);
        }
        this.overlapOnsetAt = null;
        break;
      }
      case "her_stopped":
        break;
      case "child_onset":
        this.childSpoke = true;
        // the safeguard never plays over the child (M-D7 j05: decided in a 1.2 s pause, the child resumed 16 ms before its
        // first sound): defer it to the next pause instead of talking over them
        if ((this.phase === "committed" || this.phase === "her_turn") && this.spoke?.safeguard) this.pendingSafeguardDefer = true;
        else if (this.phase === "committed") this.pendingRevoke = true;
        else if (this.phase === "her_turn" && this.spoke && !this.spoke.safeguard && this.revocable(o.at)) this.pendingRevoke = true;
        else if (this.phase === "her_turn") { this.overlapOnsetAt = o.at; this.go("overlap", o.t); }
        else if (this.phase === "handover" || this.phase === "idle" || this.phase === "hold_requested") this.go("child_turn", o.t);
        break;
      case "context":
        if (!HER_FLOOR.has(this.phase) && this.phase !== "committed") {
          this.beginTurn(o.t, null);
          this.go(o.handsOver ? "handover" : "idle", o.t);
        }
        break;
    }
    return this.events;
  }

  /** A child onset before her verdict word (or within REVOCABLE_MS of her first sound on an open reply) revokes the commit. */
  private revocable(at: Ms): boolean {
    const s = this.spoke;
    if (!s) return false;
    if (s.verdictNotBefore !== null) return !s.verdictPlayed;
    return s.herStartAt === null || at <= s.herStartAt + REVOCABLE_MS;
  }

  /** One tick: the engine proposes, the governor disposes. */
  decide(tick: EngineTick, engine: DuplexEngine): Governed {
    this.events = [];
    const t = tick.t;
    let d: EngineDecision;
    try {
      d = engine.tick(tick);
    } catch (e) {
      this.events.push({ kind: "fallback", to: this.fallback ? "rules" : "silence", at: t, error: String((e as Error)?.message ?? e).slice(0, 120) });
      try {
        if (!this.fallback) throw new Error("no fallback engine");
        d = this.fallback.tick(tick);
        d = { ...d, reasons: ["fallback_rules", ...d.reasons] };
      } catch (e2) {
        if (this.fallback) this.events.push({ kind: "fallback", to: "silence", at: t, error: String((e2 as Error)?.message ?? e2).slice(0, 120) });
        d = silencePolicy(tick);
      }
    }
    const g = this.dispose(tick, { ...d, proposed: d.proposed ?? d.action, reasons: [...d.reasons] });
    this.lastGoverned = { action: g.action, detail: g.detail, at: t };
    return { decision: g, phase: this.phase, phaseSince: this.phaseSince, events: this.events };
  }

  private dispose(tick: EngineTick, d: EngineDecision): EngineDecision {
    const t = tick.t, c = tick.child, m = tick.markers, ph = this.phase;
    const veto = (action: EngineAction, code: ReasonCode, detail?: ActionDetail): EngineDecision => {
      d = { ...d, action, detail, reasons: [code, ...d.reasons.filter((r) => r !== code)] };
      return d;
    };
    const audioAct = (x: EngineDecision) => x.action === "SPEAK" || x.action === "CUT_IN" || (x.action === "BACKCHANNEL" && x.detail?.action === "BACKCHANNEL" && x.detail.kind !== "nod");
    const sil = c.silenceRunMs;
    const herAudible = HER_FLOOR.has(ph);

    // ── G1 SAFETY (sticky) ──
    if (tick.safety.distress) {
      if (!this.quarantined) { this.quarantined = true; this.events.push({ kind: "quarantine", at: t, safetyKind: tick.safety.kind }); }
      const speakingSafeguard = !!this.spoke?.safeguard && (ph === "committed" || herAudible);
      if (speakingSafeguard && this.pendingSafeguardDefer) {
        this.pendingSafeguardDefer = false;
        veto("YIELD", "veto_safety", { action: "YIELD", reason: "safety", atWordBoundary: true, resumable: false });
        this.spoke = null;
        this.go("safety_attend", t);
        return this.finish(tick, d);
      }
      this.pendingSafeguardDefer = false;
      if (!speakingSafeguard) {
        if (herAudible || ph === "committed") {
          veto("YIELD", "veto_safety", { action: "YIELD", reason: "safety", atWordBoundary: true, resumable: false });
          this.spoke = null;
          this.go("safety_attend", t);
          return this.finish(tick, d);
        }
        if (ph !== "safety_attend") this.go("safety_attend", t);
        const silent = !c.voicing && sil !== null;
        const legal = d.action === "HOLD" || (d.action === "REACT" && d.detail?.action === "REACT" && d.detail.kind === "calm_attend")
          || (d.action === "SPEAK" && d.detail?.action === "SPEAK" && d.detail.reason === "safeguard" && silent && (d.pComplete >= SAFETY.speakPc || (sil ?? 0) >= SAFETY.silenceMs))
          || (d.action === "CUT_IN" && d.detail?.action === "CUT_IN" && d.detail.reason === "safety" && tick.safety.kind === "self_harm" && silent && (sil ?? 0) >= SAFETY.silenceMs);
        if (!legal) {
          // the safeguard at a transition point even if the engine did not propose it (code policy, not a model's)
          if (silent && ((sil ?? 0) >= SAFETY.silenceMs || d.pComplete >= SAFETY.speakPc)) veto("SPEAK", "veto_safety", { action: "SPEAK", reason: "safeguard", firstSound: "safeguard", verdictNotBefore: null });
          else veto("REACT", "veto_safety", { action: "REACT", kind: "calm_attend" });
        }
      } else if (d.action !== "KEEP_TALKING" && d.action !== "YIELD") veto("KEEP_TALKING", "veto_safety");
    }

    // ── G7 (revoke half): the child resumed before her verdict word → yield, merge the fragments, re-plan ──
    if (this.pendingRevoke && !tick.safety.distress) {
      this.pendingRevoke = false;
      if (ph === "committed" || ph === "her_turn") {
        veto("YIELD", "repaired", { action: "YIELD", reason: "revoke", atWordBoundary: true, resumable: false });
        this.events.push({ kind: "revoke", at: t });
        this.spoke = null;
        this.go("child_turn", t);
        return this.finish(tick, d);
      }
    }
    this.pendingRevoke = false;

    // ── G2 SAFETY BARRIER: the predicate must have seen text covering the audio the engine used ──
    if (audioAct(d) && !(d.detail?.action === "SPEAK" && d.detail.reason === "safeguard")) {
      const cov = tick.transcript.coverageEndMs;
      if (cov !== null && (tick.safety.checkedThroughMs === null || tick.safety.checkedThroughMs < cov)) veto("HOLD", "veto_safety_unchecked", { action: "HOLD", reason: "safety_listen" });
    }

    // ── G3 HOLD REQUEST ──
    // granted only on words that describe the child's LATEST audio (M-D7 h01: a stale "एक मिनट" re-granted the hold after the
    // child had already resumed with the answer, and the turn never ended), and never twice for the same words
    const holdFresh = tick.transcript.unseenVoicedMs <= HORIZON_MS && tick.transcript.textHash !== this.holdGrantedHash;
    if (this.mode === "full" && m.holdRequest && holdFresh && (ph === "child_turn" || ph === "idle") && !c.voicing && !tick.safety.distress) {
      this.holdGrantedHash = tick.transcript.textHash;
      this.go("hold_requested", t);
    }
    // the child resumed and the words no longer end on a hold request: the floor is theirs again (no voice onset needed)
    if (this.phase === "hold_requested" && !m.holdRequest && tick.transcript.textHash !== this.holdGrantedHash && tick.transcript.unseenVoicedMs <= HORIZON_MS) this.go("child_turn", t);
    if (this.phase === "hold_requested") {
      const quiet = sil ?? t - this.phaseSince;
      if (d.action === "SPEAK" || (d.action === "CUT_IN" && !(d.detail?.action === "CUT_IN" && d.detail.reason === "hold_offer" && quiet >= HOLD.offerMs)) || d.action === "BACKCHANNEL") {
        veto("REACT", "veto_hold_request", { action: "REACT", kind: quiet >= HOLD.checkinMs ? "checkin_look" : "hold_pose" });
      }
    }

    // ── G4 PHASE LEGALITY ──
    if (!LEGAL[this.phase].has(d.action)) {
      const def: EngineAction = HER_FLOOR.has(this.phase) ? "KEEP_TALKING" : "HOLD";
      veto(def, "veto_phase", def === "HOLD" ? { action: "HOLD", reason: "uncertain" } : undefined);
    }

    // ── G11 HER FLOOR: sustained child voice over her, or words that say stop / repair / a turn ──
    if (HER_FLOOR.has(this.phase) && d.action === "KEEP_TALKING" && tick.overlap) {
      const o = tick.overlap;
      const target = o.targetSpeaker === null || o.targetSpeaker >= 0.5;
      if (target && o.echoLikelihood < 0.7 && c.voicing && c.voicedRunMs >= OVERLAP.forceYieldMs) {
        veto("YIELD", "sustained_voice", { action: "YIELD", reason: "barge_in", atWordBoundary: true, resumable: true });
      } else if (o.lexicalKind === "stop" || o.lexicalKind === "repair" || o.lexicalKind === "answer" || o.lexicalKind === "turn") {
        const reason = o.lexicalKind === "stop" ? "stop_request" : o.lexicalKind === "repair" ? "repair_request" : o.lexicalKind === "answer" ? "answer_to_her_question" : "barge_in";
        veto("YIELD", o.lexicalKind === "stop" ? "stop_request" : o.lexicalKind === "repair" ? "repeat_request" : "child_voicing", { action: "YIELD", reason, atWordBoundary: true, resumable: false });
      }
    }

    if (this.mode === "full") {
      // ── G5 LEXICAL HORIZON ──
      const ac = tick.estimates.acoustic;
      const vouched = !!ac && t - ac.atMs <= ACOUSTIC_FRESH_MS && ac.pComplete >= HORIZON_ACOUSTIC_P;
      const unseen = tick.transcript.unseenVoicedMs > HORIZON_MS && !vouched;
      const hard = (sil ?? 0) >= this.backstopMs(tick) + 2000;
      if ((d.action === "SPEAK" || d.action === "CUT_IN") && unseen && !hard) veto("HOLD", "veto_horizon", { action: "HOLD", reason: "lexical_horizon" });

      // ── G6 CLOSED CUT_IN LIST ──
      if (d.action === "CUT_IN") {
        const r = d.detail?.action === "CUT_IN" ? d.detail.reason : "";
        const policy = r === "safety" || r === "hold_offer";
        const ok = CUT_IN_LIST.has(r) && (policy || this.flags.cutIn) && !c.voicing && (sil ?? 0) >= CUT_IN.microPauseMs && this.cutInCondition(tick, r);
        if (!ok) veto("HOLD", "veto_cutin_policy", { action: "HOLD", reason: "uncertain" });
      }

      // ── G9 WT1 PROTECTION ──
      if (this.phase === "handover" && !this.childSpoke && c.firstOnsetAt === null) {
        if ((d.action === "SPEAK" && !(d.detail?.action === "SPEAK" && d.detail.reason === "wt1_nudge")) || d.action === "CUT_IN") veto("HOLD", "veto_wt1_protected", { action: "HOLD", reason: "wt1_protected" });
      }

      // ── G8 RATE AND LEGALITY of listening acts ──
      if (d.action === "BACKCHANNEL" && d.detail?.action === "BACKCHANNEL") {
        const k = d.detail.kind;
        const closed = tick.context.exchange === "closed_answer";
        const forbidden = closed || this.phase === "hold_requested" || this.phase === "safety_attend" || tick.safety.distress
          || (k === "mm" && (!this.flags.audioBackchannel || !tick.context.allowAudioBackchannel))
          || ((k === "haan" || k === "acchha") && (exchangeOf(tick) !== "chit_chat" || !this.flags.lexicalBackchannel || !tick.context.allowLexicalBackchannel));
        const last = this.lastActs[k];
        const gap = k === "nod" ? RATE.nodMs : RATE.mmMs;
        if (forbidden) veto("HOLD", "veto_lexical_backchannel", { action: "HOLD", reason: "uncertain" });
        else if (last !== undefined && t - last < gap) veto("HOLD", "veto_rate_limit", { action: "HOLD", reason: "uncertain" });
      }
      if (d.action === "REACT" && d.detail?.action === "REACT") {
        if (d.detail.kind === this.pose) d = { ...d, action: "HOLD", detail: { action: "HOLD", reason: c.voicing ? "child_speaking" : "uncertain" } };
        else if (this.lastActs.react !== undefined && t - this.lastActs.react < RATE.reactChangeMs) veto("HOLD", "veto_rate_limit", { action: "HOLD", reason: "uncertain" });
      }

      // ── G10 BACKSTOP: the engine stayed unsure; silence decides only now ──
      if ((this.phase === "child_turn" || (this.phase === "idle" && this.childSpoke)) && !tick.safety.distress && !m.holdRequest
        && (d.action === "HOLD" || d.action === "REACT" || d.action === "BACKCHANNEL") && !c.voicing && sil !== null) {
        const bs = this.backstopMs(tick);
        if (sil >= bs) {
          const text = tick.transcript.text;
          const hardEnough = sil >= bs + 2000;
          if ((text && (!unseen || hardEnough)) || (!text && hardEnough && c.turnVoicedMs >= 300)) {
            const closed = tick.context.exchange === "closed_answer";
            // a repair still open (or no words): a verdict-free prompt, never an uptake of the abandoned value (law 3;
            // TaxilaFDB train: "आठ पैर … नहीं नहीं [छह dropped by the STT] पैर" got a verdict on 8 from the backstop, 3/40)
            const fs = m.repairOpen || !text ? "prompt" : closed && m.values.length ? "uptake" : "body";
            veto("SPEAK", "backstop", { action: "SPEAK", reason: "backstop_silence", firstSound: fs, verdictNotBefore: null });
          }
        }
      }
      // after a resumable yield: a continuer (or nothing) → she resumes from heardUpTo
      if (this.yielded && this.phase === "child_turn" && !c.voicing) {
        const text = tick.transcript.text;
        const kind = text ? overlapKind(text, { askedYesNo: tick.her.lastAct === "asked_yes_no" }) : null;
        // no words yet: wait until the source's first text would have landed for that onset (M-D7 i08: a 1.6 s rule resumed
        // over a "रुको" whose words arrive ~1.7-2.0 s after onset on D4), then resume
        const firstText = FIRST_TEXT_P90[tick.transcript.source] ?? FIRST_TEXT_P90.other;
        const noTextLong = !text && (sil ?? 0) >= 300 && t - this.yielded.onsetAt >= Math.max(NO_TEXT_RESUME_MS, firstText + 300) && c.turnVoicedMs < 600;
        if ((kind === "continuer" && (sil ?? 0) >= 200) || noTextLong) {
          this.events.push({ kind: "resume", at: t });
          this.yielded = null;
          this.go("her_turn", t);
          d = { ...d, action: "KEEP_TALKING", detail: { action: "KEEP_TALKING", reason: "continuer", unduck: true }, reasons: ["short_burst", ...d.reasons] };
          return this.finish(tick, d);
        }
        if (text && kind !== "continuer") this.yielded = null;
      }
    }

    // ── G7 (stamp half): a closed-answer SPEAK carries its verdict gate ──
    if (d.action === "SPEAK" && d.detail?.action === "SPEAK" && d.detail.firstSound === "prompt" && m.repairOpen) d = { ...d, detail: { ...d.detail, verdictNotBefore: null } };
    else if (d.action === "SPEAK" && d.detail?.action === "SPEAK" && d.detail.reason !== "safeguard" && tick.context.exchange === "closed_answer" && m.lastValueAgeMs !== null && m.values.length) {
      const vnb = t - m.lastValueAgeMs + VERDICT.delayMs;
      if (d.detail.verdictNotBefore === null || d.detail.verdictNotBefore < vnb) d = { ...d, detail: { ...d.detail, verdictNotBefore: vnb } };
    }
    return this.finish(tick, d);
  }

  /** The context's silence backstop (G10), stretched while the child plainly holds the floor. */
  private backstopMs(tick: EngineTick): number {
    const ex = exchangeOf(tick);
    const { p50, p90 } = holdProfile(tick);
    const base = CONTEXT[ex].backstopMs(p50, p90, tick.markers.values.length > 0);
    return base * (this.stretch(tick) ? BACKSTOP_HOLD_STRETCH : 1);
  }

  private stretch(tick: EngineTick): boolean {
    const m = tick.markers;
    // pHoldWanted as the engine judged it last tick (the governed decision), or the lexical hold signals directly
    const ph = this.lastGovernedPH ?? 0;
    return ph >= BACKSTOP_HOLD_PH || m.fillerTail || m.openTail || m.projection || m.wordSearch || m.repairOpen;
  }

  private lastGovernedPH: number | null = null;

  /** Each listed CUT_IN reason's own condition (§3.4). */
  private cutInCondition(tick: EngineTick, r: string): boolean {
    const m = tick.markers, sil = tick.child.silenceRunMs ?? 0;
    switch (r) {
      case "safety": return tick.safety.distress && tick.safety.kind === "self_harm" && sil >= SAFETY.silenceMs;
      case "hold_offer": return this.phase === "hold_requested" && sil >= HOLD.offerMs;
      case "word_search_cue": return m.wordSearch && tick.context.cutIn.wordSearchCue === "offer" && sil >= CUT_IN.wordSearchSilenceMs;
      case "off_task_drift": {
        const lim = tick.context.cutIn.offTaskMs ?? (tick.context.band === "B2" ? CUT_IN.offTaskB2 : CUT_IN.offTaskB3);
        return m.offTaskMs >= lim && sil >= CUT_IN.offTaskPauseMs && !m.openTail && !tick.safety.distress && this.phase !== "hold_requested";
      }
      case "question_to_her": return m.asks && m.questionComplete;
      default: return false;
    }
  }

  /** Phase transitions and bookkeeping that follow the governed action. */
  private finish(tick: EngineTick, d: EngineDecision): EngineDecision {
    const t = tick.t;
    this.lastGovernedPH = d.pHoldWanted;
    const det = d.detail;
    if (d.action === "SPEAK" || d.action === "CUT_IN") {
      const safeguard = (det?.action === "SPEAK" && det.reason === "safeguard") || (det?.action === "CUT_IN" && det.reason === "safety");
      this.spoke = { at: t, reason: det?.action === "SPEAK" ? det.reason : det?.action === "CUT_IN" ? det.reason : "turn_end", safeguard,
        verdictNotBefore: det?.action === "SPEAK" ? det.verdictNotBefore : null, herStartAt: null, verdictPlayed: false };
      this.yielded = null;
      this.lastActs[d.action === "SPEAK" ? "speak" : "cut_in"] = t;
      this.go("committed", t);
    } else if (d.action === "YIELD" && det?.action === "YIELD") {
      if (det.reason === "revoke" || det.reason === "safety") { /* phase already set */ }
      else {
        this.spoke = null;
        const onset = this.overlapOnsetAt ?? this.carryOnsetAt ?? t;
        this.yielded = det.resumable ? { at: t, resumable: true, onsetAt: onset } : null;
        this.beginTurn(t, onset);
        this.overlapOnsetAt = null;
        this.carryOnsetAt = null;
        this.go(det.reason === "stop_request" ? "hold_requested" : "child_turn", t);
      }
    } else if (d.action === "KEEP_TALKING" && this.phase === "overlap" && det?.action === "KEEP_TALKING" && det.reason !== "too_short" && !tick.child.voicing) {
      // M-D7 i16: a short "बारह" over her read as a continuer, then its words said fold-in; keep the onset for that yield
      this.carryOnsetAt = this.overlapOnsetAt;
      this.overlapOnsetAt = null;
      this.go("her_turn", t);
    } else if (d.action === "BACKCHANNEL" && det?.action === "BACKCHANNEL") {
      this.lastActs[det.kind] = t;
    } else if (d.action === "REACT" && det?.action === "REACT") {
      this.pose = det.kind;
      this.lastActs.react = t;
    }
    if (this.phase === "committed" && t - this.phaseSince > COMMITTED_MAX_MS) { this.spoke = null; this.go("child_turn", t); }
    return d;
  }
}

/** Today's patient policy, the last fallback (fail patient, never rude): 900 ms of silence after words, or a yield after 1 s of voice. */
export function silencePolicy(tick: EngineTick): EngineDecision {
  const c = tick.child;
  const base = { confidence: 0.5, pComplete: 0.5, pHoldWanted: 0.5, reasons: ["fallback_silence"] as ReasonCode[], engine: { id: "silence-900", stage: "A" as const, version: "1" } };
  if (tick.phase === "her_turn" || tick.phase === "overlap") {
    if (c.voicing && c.voicedRunMs >= OVERLAP.forceYieldMs) return { ...base, action: "YIELD", detail: { action: "YIELD", reason: "barge_in", atWordBoundary: true, resumable: true }, proposed: "YIELD" };
    return { ...base, action: "KEEP_TALKING", proposed: "KEEP_TALKING" };
  }
  if (!c.voicing && (c.silenceRunMs ?? 0) >= FALLBACK.silenceMs && tick.transcript.text) {
    const reason: SpeakReason = tick.safety.distress ? "safeguard" : "backstop_silence";
    return { ...base, action: "SPEAK", detail: { action: "SPEAK", reason, firstSound: reason === "safeguard" ? "safeguard" : "body", verdictNotBefore: null }, proposed: "SPEAK" };
  }
  return { ...base, action: "HOLD", detail: { action: "HOLD", reason: "uncertain" }, proposed: "HOLD" };
}

/** Is this phase the child's floor (she is silent)? */
export const isChildFloor = (p: FloorPhase): boolean => CHILD_FLOOR.has(p);
