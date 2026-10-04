/**
 * THE ENGINE HOST (ARCHITECTURE.md v2 §2.1-§2.2, §3.1, seam S10): the device-side tick loop of the Continuous
 * Conversational Engine. Hands-free and full-session: the mic is always open (owner-always-listen-full-session-2026-10-04),
 * there is no talk button, no press and no release anywhere in this module. The child can speak, interrupt or ask at
 * any time, and the engine decides on every sub-second mini-turn whether she speaks, holds, nods, reacts, yields, keeps
 * talking or cuts in.
 *
 *   streams in  ─► frame(t, rms, f0)       20 ms mic frames (the shipped featureWorklet / dsp.ts produce them)
 *                  stt(ev)                  partials, finals, speech_started / speech_stopped of the always-on STT
 *                  her(ev)                  her playback clock: start, word boundaries, verdict, end, stopped (seam S14)
 *                  screen(ev)               taps, drags, pen, submit, aid requests
 *                  context(ctx, t)          the Director's engine context at each hand-over (seam S6, form never key)
 *                  estimate(e)              async semantic / acoustic estimates (stamped)
 *                  timer(t)                 every 100 ms
 *   each tick   ─► EngineTick → engine.infer?(tick) (never awaited) → engine.tick(tick) → governor → commands
 *   commands out ─► voice (speak / cut_in / yield / resume / duck / unduck), face (pose / nod / clip), floor (shipped
 *                  8-state floor), think (handover / prepare / quarantine / revoke → the server speculator), stt (the
 *                  micro-commit probe), build (prefetch keys), safety (attend), log (one row per CHANGE: phase, action,
 *                  proposed, top reasons, probabilities; numbers only, never the child's words)
 *
 * Event ticks run immediately on voice onset/offset, partial, final, her playback, screen, estimate, context and safety;
 * the 100 ms timer bounds everything else (§2.1). Perception never stops while she speaks: frames and partials keep
 * flowing into the overlap classifier, and her own known words are subtracted from the transcript before anything reads it.
 * Shadow mode (flags.shadow) computes everything and emits only log rows. Erasable TypeScript.
 */
import type {
  CutInReason, DuplexEngine, EngineContext, EngineFlags, EngineSession, EngineTick, FirstSound, FloorPhase, HerAct, Ms,
  OverlapFeatures, PrepareHint, ReasonCode, ScreenEvent, SemanticEstimate, AcousticEstimate, SpeakReason, TickCause,
  TranscriptView, WordTiming, YieldReason, ChildPaceProfile,
} from "./engine.ts";
import type { Floor } from "../lesson/floor.ts";
import { TurnTranscript, type SttEvent } from "../../server/duplex/fanin.js";
import { EchoSubtractor } from "../../server/duplex/echo.js";
import { PartialSafety } from "../../server/duplex/partialSafety.js";
import { ChildAudioTracker } from "./audio.ts";
import { MarkerTracker } from "./markers.ts";
import { Governor, type GovernorEvent } from "./governor.ts";
import { createEngine, type AcousticSource, type FloorModel } from "./adapter.ts";
import { RulesEngine } from "./engineRules.ts";
import { faceCue, phasePose, shippedFloor, type FaceCue } from "./face.ts";
import { packFeatures } from "./features.ts";
import { tokens, valuesOf } from "./numerals.ts";
import { overlapKind } from "./turnPolicy.ts";
import { OVERLAP, WT1_DEFAULT } from "./config.ts";

export type HostCommand =
  | { to: "voice"; op: "speak"; t: Ms; reason: SpeakReason; firstSound: FirstSound; verdictNotBefore: Ms | null; text: string; textHash: string; uptake: string | null; turnSeq: number }
  | { to: "voice"; op: "cut_in"; t: Ms; reason: CutInReason; text: string; textHash: string; turnSeq: number }
  | { to: "voice"; op: "yield"; t: Ms; reason: YieldReason; atWordBoundary: boolean; resumable: boolean; heardUpTo: HeardUpTo | null }
  | { to: "voice"; op: "resume"; t: Ms }
  | { to: "voice"; op: "duck"; t: Ms; level: number }
  | { to: "voice"; op: "unduck"; t: Ms }
  | { to: "face"; t: Ms; cue: FaceCue }
  | { to: "floor"; t: Ms; phase: FloorPhase; floor: Floor }
  | { to: "think"; op: "handover"; t: Ms; turnSeq: number; itemId: string | null }
  | { to: "think"; op: "prepare"; t: Ms; hint: PrepareHint; text: string; uptake: string | null }
  | { to: "think"; op: "quarantine"; t: Ms; kind: string | null }
  | { to: "think"; op: "revoke"; t: Ms }
  | { to: "stt"; op: "commit"; t: Ms }
  | { to: "build"; t: Ms; intent: string }
  | { to: "safety"; op: "attend"; t: Ms; kind: string | null }
  | { to: "log"; row: ShadowRow };

export interface HeardUpTo { chars: number; words: number; ms: Ms }

/** One row per change of governed action or phase (no child words; numbers and closed codes only). */
export interface ShadowRow {
  t: Ms;
  cause: TickCause;
  phase: FloorPhase;
  action: string;
  proposed: string;
  detail: string | null;
  reasons: ReasonCode[];
  pComplete: number;
  pHoldWanted: number;
  engine: string;
  turnSeq: number;
  /** Consent-gated training features (features.ts, spec cce-features/1); present only when logFeatures is on. */
  features?: number[];
}

export type HerEvent =
  /** Her utterance became audible. `words` = TTS word boundaries on the session clock (seam S14), else text + msPerChar. */
  | { kind: "start"; t: Ms; utteranceId: string; text: string; act: HerAct; handsOver: boolean; msPerChar?: number; words?: WordTiming[]; outputDb?: number | null }
  /** The verdict-bearing part of the reply started playing (after the uptake). */
  | { kind: "verdict"; t: Ms }
  /** She played to the end. */
  | { kind: "end"; t: Ms; utteranceId: string }
  /** A yield executed (stopped at a word boundary or faded). */
  | { kind: "stopped"; t: Ms; utteranceId: string }
  /** Her output level changed (double-talk threshold). */
  | { kind: "level"; t: Ms; db: number | null };

export type HostSttEvent = SttEvent | { type: "speech_started"; t: Ms; itemId: string; audioStartMs?: Ms } | { type: "speech_stopped"; t: Ms; itemId: string; audioEndMs?: Ms };

export interface HostOptions {
  session: EngineSession;
  source: TranscriptView["source"];
  /** The STT accepts client commits (MAI, D4): the micro-commit probe is available. */
  supportsCommit: boolean;
  emit: (c: HostCommand) => void;
  engine?: DuplexEngine;
  model?: FloorModel | null;
  scan?: (text: string) => { distress: boolean; kind: string | null };
  semantic?: (req: { text: string; context: EngineContext; textHash: string; t: Ms }) => Promise<SemanticEstimate | null>;
  logFeatures?: boolean;
  /** Governor mode (baselines keep only G1/G2/G4). */
  governorMode?: "full" | "baseline";
  /** Compute timing only (never a decision input). */
  clock?: () => number;
}

const DEFAULT_FLAGS: EngineFlags = { shadow: false, semantic: false, trained: false, cutIn: false, audioBackchannel: false, lexicalBackchannel: false };

export const NEUTRAL_CONTEXT: EngineContext = {
  exchange: "free", expected: null, questionType: "none", beat: null, itemId: null, band: "B3", lang: "hinglish", weakerLanguage: false,
  wt1: WT1_DEFAULT, cutIn: { wordSearchCue: "never", offTaskMs: null }, allowLexicalBackchannel: false, allowAudioBackchannel: false,
};

interface Her {
  speaking: boolean;
  utteranceId: string | null;
  text: string;
  startedAt: Ms;
  words: WordTiming[];
  boundaries: Ms[];
  act: HerAct;
  handsOver: boolean;
  handedOverAt: Ms | null;
  stoppedAt: Ms | null;
  outputDb: number | null;
}

export class EngineHost {
  readonly flags: EngineFlags;
  readonly engine: DuplexEngine;
  readonly governor: Governor;
  private readonly o: HostOptions;
  private readonly audio = new ChildAudioTracker();
  private readonly echo = new EchoSubtractor();
  private readonly fanin: TurnTranscript;
  private readonly safety: PartialSafety;
  private readonly markers = new MarkerTracker();
  private ctx: EngineContext = NEUTRAL_CONTEXT;
  private pace: ChildPaceProfile;
  private her: Her = { speaking: false, utteranceId: null, text: "", startedAt: 0, words: [], boundaries: [], act: "none", handsOver: false, handedOverAt: null, stoppedAt: null, outputDb: null };
  private screenEvents: ScreenEvent[] = [];
  private screenBusy = false;
  private screenLastAt: Ms | null = null;
  private semantic: SemanticEstimate | null = null;
  private acoustic: AcousticEstimate | null = null;
  private semanticAsk: { at: Ms; words: number } = { at: -Infinity, words: 0 };
  private overlapOnset: Ms | null = null;
  private ducked = false;
  private prevTurnStart: Ms = 0;
  private lastLog: string | null = null;
  private lastPrepare: { draft: string; warm: string; hash: string } | null = null;
  private lastPose: string | null = null;
  private safeguardSpoken = false;
  private stepping = false;
  private t: Ms = 0;
  /** Counters for the harness: ticks by cause, compute time. */
  readonly stats = { ticks: 0, byCause: {} as Record<string, number>, computeMs: 0, maxComputeMs: 0 };

  constructor(o: HostOptions) {
    this.o = o;
    this.flags = { ...DEFAULT_FLAGS, ...o.session.flags };
    this.engine = o.engine ?? createEngine({ flags: this.flags, model: o.model ?? null, supportsProbe: o.supportsCommit });
    this.governor = new Governor({ flags: this.flags, fallback: this.engine instanceof RulesEngine ? null : new RulesEngine({ supportsProbe: o.supportsCommit }), mode: o.governorMode });
    this.fanin = new TurnTranscript({ source: o.source, filter: (text, meta) => this.echo.subtract(text, meta.t, this.fanin.lag.p90) });
    this.safety = new PartialSafety(o.scan ? { scan: o.scan } : {});
    this.pace = { sessions: 0, holdPauseMs: null, answerGapMs: null, speechRateSylPerS: null, fillerRatePerMin: null, source: "band_default", strain: false };
    this.engine.reset(o.session);
  }

  // ───────────────────────────── inputs ─────────────────────────────

  /** One 20 ms mic frame. */
  frame(t: Ms, rms: number, f0: number | null): void {
    this.t = t;
    const r = this.audio.push(t, rms, f0);
    if (r.edge === "onset") {
      const audible = this.her.speaking;
      if (audible) {
        // the reflex (§2.1): duck her at once; fully reversible, not an engine decision
        if (!this.ducked && !this.flags.shadow) this.o.emit({ to: "voice", op: "duck", t, level: OVERLAP.duckLevel });
        this.ducked = true;
        this.overlapOnset = r.edgeAt;
      }
      this.applyEvents(this.governor.observe({ kind: "child_onset", t, at: r.edgeAt ?? t }), t);
      this.step("voice_onset", t);
    } else if (r.edge === "offset") {
      this.step("voice_offset", t);
    } else if (this.ducked && this.her.speaking && !this.audio.voicing && (this.audio.silenceRunMs() ?? 0) >= OVERLAP.duckReleaseMs) {
      // an undecided burst that went quiet: release the duck (shipped DUCK_RELEASE_MS)
      if (!this.flags.shadow) this.o.emit({ to: "voice", op: "unduck", t });
      this.ducked = false;
    }
  }

  /** One STT event of the always-on stream. */
  stt(ev: HostSttEvent): void {
    this.t = ev.t;
    if (ev.type === "speech_started" || ev.type === "speech_stopped") return; // the device's own frames time speech
    const changed = this.fanin.push(ev);
    if (!changed) return;
    const view = this.fanin.view(ev.t, (from) => this.audio.voicedAfter(from));
    const s = this.safety.check(view.text, view.coverageEndMs, ev.t);
    this.maybeAskSemantic(view, ev.t);
    this.step(s.tripped ? "safety" : ev.type === "final" ? "final" : "partial", ev.t);
  }

  /** Her playback clock. */
  herEvent(ev: HerEvent): void {
    this.t = ev.t;
    switch (ev.kind) {
      case "start": {
        const words = ev.words?.length ? ev.words : estimateWords(ev.text, ev.t, ev.msPerChar ?? 70);
        this.her = { ...this.her, speaking: true, utteranceId: ev.utteranceId, text: ev.text, startedAt: ev.t, words, boundaries: clauseEnds(ev.text, words),
          act: ev.act, handsOver: ev.handsOver, stoppedAt: null, outputDb: ev.outputDb ?? null };
        this.echo.heard(ev.utteranceId, words);
        this.audio.setHerLevel(ev.outputDb ?? null);
        // her words open an overlap epoch: what the child says over her is read on its own (a revoke restores the turn)
        this.prevTurnStart = this.fanin.turnStart;
        this.fanin.begin(ev.t);
        this.markers.beginTurn();
        this.safety.begin(ev.t, { carry: !this.safeguardSpoken });
        this.applyEvents(this.governor.observe({ kind: "her_start", t: ev.t, utteranceId: ev.utteranceId }), ev.t);
        this.step("her_playback", ev.t);
        break;
      }
      case "verdict":
        this.applyEvents(this.governor.observe({ kind: "her_verdict", t: ev.t }), ev.t);
        break;
      case "end": {
        const wasSafeguard = this.her.act === "safeguard";
        this.her = { ...this.her, speaking: false, handedOverAt: this.her.handsOver ? ev.t : this.her.handedOverAt };
        this.audio.setHerLevel(null);
        this.ducked = false;
        if (wasSafeguard) this.safeguardSpoken = true;
        this.applyEvents(this.governor.observe({ kind: "her_end", t: ev.t, utteranceId: ev.utteranceId, handsOver: this.her.handsOver, childVoicing: this.audio.voicing }), ev.t);
        this.step("her_playback", ev.t);
        break;
      }
      case "stopped":
        this.echo.stopAt(ev.utteranceId, ev.t);
        this.her = { ...this.her, speaking: false, stoppedAt: ev.t };
        this.audio.setHerLevel(null);
        this.ducked = false;
        this.applyEvents(this.governor.observe({ kind: "her_stopped", t: ev.t }), ev.t);
        this.step("her_playback", ev.t);
        break;
      case "level":
        this.her.outputDb = ev.db;
        this.audio.setHerLevel(this.her.speaking ? ev.db : null);
        break;
    }
  }

  screen(ev: ScreenEvent): void {
    this.t = ev.at;
    this.screenEvents.push(ev);
    this.screenLastAt = ev.at;
    if (ev.kind === "drag_start" || ev.kind === "pen_down" || ev.kind === "type") this.screenBusy = true;
    if (ev.kind === "drag_end" || ev.kind === "pen_up" || ev.kind === "submit" || ev.kind === "choice_pick") this.screenBusy = false;
    this.step("screen", ev.at);
  }

  /**
   * The Director's engine context for the coming child turn (seam S6). `handsOver`: no audio of hers precedes it (the very
   * first item, a module turn); otherwise it applies when her floor-handing line ends.
   */
  context(ctx: EngineContext, t: Ms, opts: { handsOver?: boolean } = {}): void {
    this.t = t;
    this.ctx = ctx;
    if (opts.handsOver) {
      this.her.handedOverAt = t;
      this.applyEvents(this.governor.observe({ kind: "context", t, handsOver: true }), t);
    }
    this.step("context", t);
  }

  /** The child's own pace profile (voice-features-longitudinal); band defaults until session 3. */
  setPace(p: ChildPaceProfile): void { this.pace = p; }

  estimate(e: { semantic?: SemanticEstimate; acoustic?: AcousticEstimate }, t: Ms): void {
    this.t = t;
    if (e.semantic) this.semantic = e.semantic;
    if (e.acoustic) this.acoustic = e.acoustic;
    this.step("estimate", t);
  }

  timer(t: Ms): void {
    this.t = t;
    this.step("timer", t);
  }

  get phase(): FloorPhase { return this.governor.phase; }

  // ───────────────────────────── the tick ─────────────────────────────

  private maybeAskSemantic(view: TranscriptView, t: Ms): void {
    if (!this.o.semantic || !this.flags.semantic) return;
    const ex = this.ctx.exchange;
    if (ex !== "open_explanation" && ex !== "question_to_her" && ex !== "chit_chat") return;
    const words = view.stablePrefix ? view.stablePrefix.split(" ").length : 0;
    if (words - this.semanticAsk.words < 2 || t - this.semanticAsk.at < 600) return;
    this.semanticAsk = { at: t, words };
    const hash = view.textHash;
    void this.o.semantic({ text: view.stablePrefix, context: this.ctx, textHash: hash, t }).then((r) => { if (r) this.estimate({ semantic: r }, Math.max(this.t, r.arrivedAt)); }, () => {});
  }

  /** Build the tick from every stream's current state. */
  buildTick(cause: TickCause, t: Ms): EngineTick {
    const child = this.audio.snapshot();
    const transcript = this.fanin.view(t, (from) => this.audio.voicedAfter(from));
    const valueEnd = transcript.coverageEndMs ?? child.lastOffsetAt ?? t;
    const mr = this.markers.read(transcript.text, this.ctx, t, Math.min(valueEnd, t), this.semantic, child.voicing);
    const her = this.her;
    const heard = this.heardUpTo(t);
    const playedMs = her.speaking ? t - her.startedAt : her.stoppedAt !== null ? her.stoppedAt - her.startedAt : 0;
    const atClauseBoundary = her.speaking && her.boundaries.some((b) => t >= b && t - b <= OVERLAP.boundarySlotMs);
    const acoustic = ("latestAcoustic" in this.engine ? (this.engine as unknown as AcousticSource).latestAcoustic() : null) ?? this.acoustic;
    const tick: EngineTick = {
      contract: "cce/2026-10-04",
      t,
      cause,
      phase: this.governor.phase,
      phaseSince: this.governor.phaseSince,
      child,
      transcript,
      markers: mr.markers,
      her: {
        speaking: her.speaking,
        utteranceId: her.utteranceId,
        playedMs,
        totalMs: her.words.length ? her.words[her.words.length - 1].endMs - her.startedAt : null,
        heardUpTo: heard,
        atClauseBoundary,
        lastAct: her.act,
        handedOverAt: her.handedOverAt,
        recentWords: this.echo.recent(t, 0).map((x) => x.w),
        outputLevelDb: her.speaking ? her.outputDb : null,
      },
      context: this.ctx,
      pace: this.pace,
      screen: { events: this.screenEvents, busy: this.screenBusy, lastEventAt: this.screenLastAt },
      overlap: this.overlapFeatures(t, child.voicing, transcript),
      safety: this.safety.state(),
      estimates: { semantic: this.semantic, acoustic },
      last: this.governor.lastGoverned,
      lastActs: { ...this.governor.lastActs },
    };
    return tick;
  }

  private overlapFeatures(t: Ms, voicing: boolean, tr: TranscriptView): OverlapFeatures | null {
    const ph = this.governor.phase;
    if ((ph !== "overlap" && ph !== "her_turn") || this.overlapOnset === null) return null;
    if (!voicing && (this.audio.silenceRunMs() ?? 0) > 3000) return null;
    const onset = this.overlapOnset;
    const words = tr.text;
    const askedYesNo = this.her.act === "asked_yes_no";
    const echoRemoved = tr.echoRemovedTokens > 0 && !words;
    const lvl = this.audio.levelOverEchoDb();
    return {
      onsetAt: onset,
      durMs: Math.max(0, (voicing ? t + 20 : this.audio.t - (this.audio.silenceRunMs() ?? 0) + 20) - onset),
      targetSpeaker: null,
      echoLikelihood: echoRemoved ? 0.8 : lvl !== null && lvl < 3 ? 0.6 : 0.05,
      levelOverEchoDb: lvl,
      onsetF0Rel: this.audio.onsetF0Rel(),
      atHerBoundary: this.her.boundaries.some((b) => onset >= b - 100 && onset - b <= OVERLAP.boundarySlotMs),
      words,
      lexicalKind: words ? overlapKind(words, { askedYesNo }) : null,
      herAskedYesNo: askedYesNo,
    };
  }

  private heardUpTo(t: Ms): HeardUpTo | null {
    const h = this.her;
    if (!h.utteranceId || !h.words.length) return null;
    const until = h.stoppedAt ?? t;
    let words = 0, chars = 0;
    for (const w of h.words) { if (w.endMs <= until) { words++; chars += w.w.length + 1; } }
    return { chars: Math.max(0, chars - 1), words, ms: Math.max(0, until - h.startedAt) };
  }

  /** One mini-turn. */
  private step(cause: TickCause, t: Ms): void {
    if (this.stepping) return;
    this.stepping = true;
    try {
      const c0 = this.o.clock ? this.o.clock() : 0;
      const tick = this.buildTick(cause, t);
      const inf = this.engine.infer?.(tick);
      if (inf) inf.catch(() => {});
      const g = this.governor.decide(tick, this.engine);
      if (this.o.clock) {
        const ms = this.o.clock() - c0;
        this.stats.computeMs += ms;
        this.stats.maxComputeMs = Math.max(this.stats.maxComputeMs, ms);
      }
      this.stats.ticks++;
      this.stats.byCause[cause] = (this.stats.byCause[cause] ?? 0) + 1;
      this.screenEvents = [];
      this.applyEvents(g.events, t);
      this.actuate(tick, g.decision, cause);
    } finally {
      this.stepping = false;
    }
  }

  /** Governor events → bookkeeping and commands. */
  private applyEvents(events: GovernorEvent[], t: Ms): void {
    const live = !this.flags.shadow;
    for (const e of events) {
      if (e.kind === "phase") {
        if (live) {
          this.o.emit({ to: "floor", t: e.at, phase: e.to, floor: shippedFloor(e.to) });
          const pose = phasePose(e.to);
          if (pose.kind === "pose" && pose.pose !== this.lastPose) { this.lastPose = pose.pose; this.o.emit({ to: "face", t: e.at, cue: pose }); }
        }
      } else if (e.kind === "turn_begin") {
        this.fanin.begin(e.at, { carryFrom: e.carryFrom });
        this.audio.beginTurn(e.at);
        this.markers.beginTurn();
        this.safety.begin(e.at, { carry: !this.safeguardSpoken });
        if (this.safeguardSpoken) this.safeguardSpoken = false;
        this.semantic = null;
        this.lastPrepare = null;
        if (e.carryFrom === null) this.overlapOnset = null;
        if (live) this.o.emit({ to: "think", op: "handover", t: e.at, turnSeq: e.turnSeq, itemId: this.ctx.itemId });
      } else if (e.kind === "quarantine") {
        if (live) {
          this.o.emit({ to: "think", op: "quarantine", t: e.at, kind: e.safetyKind });
          this.o.emit({ to: "safety", op: "attend", t: e.at, kind: e.safetyKind });
        }
      } else if (e.kind === "revoke") {
        // the child resumed before her verdict word: merge the fragments back into one turn and re-plan (P8)
        this.fanin.begin(this.prevTurnStart);
        this.markers.beginTurn();
        this.overlapOnset = null;
        if (live) this.o.emit({ to: "think", op: "revoke", t: e.at });
      } else if (e.kind === "resume") {
        if (live) this.o.emit({ to: "voice", op: "resume", t: e.at });
        this.ducked = false;
      } else if (e.kind === "fallback") {
        this.o.emit({ to: "log", row: { t: e.at, cause: "timer", phase: this.governor.phase, action: `fallback:${e.to}`, proposed: "-", detail: e.error, reasons: [e.to === "rules" ? "fallback_rules" : "fallback_silence"], pComplete: 0, pHoldWanted: 0, engine: this.engine.id.id, turnSeq: this.governor.turnSeq } });
      }
    }
  }

  /** The governed decision → actuator commands (changes only; one-shot acts always). */
  private actuate(tick: EngineTick, d: ReturnType<Governor["decide"]>["decision"], cause: TickCause): void {
    const t = tick.t, live = !this.flags.shadow, det = d.detail;
    const key = `${this.governor.phase}|${d.action}|${det ? JSON.stringify(det) : ""}`;
    if (key !== this.lastLog || d.action === "SPEAK" || d.action === "CUT_IN" || d.action === "YIELD") {
      this.lastLog = key;
      const row: ShadowRow = { t, cause, phase: this.governor.phase, action: d.action, proposed: d.proposed ?? d.action, detail: det ? detailCode(det) : null,
        reasons: d.reasons.slice(0, 4), pComplete: round3(d.pComplete), pHoldWanted: round3(d.pHoldWanted), engine: `${d.engine.id}/${d.engine.stage}`, turnSeq: this.governor.turnSeq };
      if (this.o.logFeatures) row.features = Array.from(packFeatures(tick)).map(round3);
      this.o.emit({ to: "log", row });
    }
    if (!live) return;
    const tr = tick.transcript;
    if (d.action === "SPEAK" && det?.action === "SPEAK") {
      this.o.emit({ to: "voice", op: "speak", t, reason: det.reason, firstSound: det.firstSound, verdictNotBefore: det.verdictNotBefore, text: tr.text, textHash: tr.textHash,
        uptake: det.firstSound === "uptake" ? uptakeOf(tr.text) : null, turnSeq: this.governor.turnSeq });
    } else if (d.action === "CUT_IN" && det?.action === "CUT_IN") {
      this.o.emit({ to: "voice", op: "cut_in", t, reason: det.reason, text: tr.text, textHash: tr.textHash, turnSeq: this.governor.turnSeq });
    } else if (d.action === "YIELD" && det?.action === "YIELD") {
      this.o.emit({ to: "voice", op: "yield", t, reason: det.reason, atWordBoundary: det.atWordBoundary, resumable: det.resumable, heardUpTo: this.heardUpTo(t) });
      this.ducked = false;
    } else if (d.action === "KEEP_TALKING" && det?.action === "KEEP_TALKING" && det.unduck && this.ducked) {
      this.o.emit({ to: "voice", op: "unduck", t });
      this.ducked = false;
    } else {
      const cue = faceCue(d, this.governor.phase);
      if (cue) {
        if (cue.kind !== "pose" || cue.pose !== this.lastPose) {
          if (cue.kind === "pose") this.lastPose = cue.pose;
          this.o.emit({ to: "face", t, cue });
        }
      }
    }
    const p = d.prepare;
    if (p) {
      const changed = !this.lastPrepare || this.lastPrepare.draft !== p.draft || this.lastPrepare.warm !== p.warmTts || this.lastPrepare.hash !== p.textHash;
      if (changed && (p.draft !== "none" || p.warmTts !== "none")) {
        this.o.emit({ to: "think", op: "prepare", t, hint: p, text: tr.text, uptake: tick.context.exchange === "closed_answer" ? uptakeOf(tr.text) : null });
      }
      this.lastPrepare = { draft: p.draft, warm: p.warmTts, hash: p.textHash };
      if (p.sttProbe && this.o.supportsCommit) {
        this.fanin.commitSent(t);
        this.o.emit({ to: "stt", op: "commit", t });
      }
      if (p.buildIntent) this.o.emit({ to: "build", t, intent: p.buildIntent });
    }
  }
}

/** The uptake: the child's own last value, re-voiced verdict-free (built in code from their words; never a stock line). */
export function uptakeOf(text: string): string | null {
  const toks = tokens(text);
  const vals = valuesOf(toks);
  const last = vals[vals.length - 1];
  if (!last) return null;
  return toks.slice(last.start, last.end + 1).join(" ");
}

/** No TTS word boundaries: each word's audible span from its character position (DragonHD Hindi ~14 chars/s). [E] */
export function estimateWords(text: string, startedAt: Ms, msPerChar: number): WordTiming[] {
  const out: WordTiming[] = [];
  let pos = 0;
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    const at = text.indexOf(w, pos);
    pos = at + w.length;
    out.push({ w, startMs: startedAt + at * msPerChar, endMs: startedAt + pos * msPerChar });
  }
  return out;
}

/** Her clause-final word ends (a backchannel slot for the child opens there). */
export function clauseEnds(_text: string, words: WordTiming[]): Ms[] {
  return words.filter((w) => /[,?？।.!;:]$/.test(w.w)).map((w) => w.endMs);
}

function detailCode(det: NonNullable<EngineTick["last"]>["detail"]): string | null {
  if (!det) return null;
  switch (det.action) {
    case "SPEAK": return `speak:${det.reason}:${det.firstSound}`;
    case "HOLD": return `hold:${det.reason}`;
    case "BACKCHANNEL": return `bc:${det.kind}`;
    case "REACT": return `react:${det.kind}`;
    case "YIELD": return `yield:${det.reason}`;
    case "KEEP_TALKING": return `keep:${det.reason}`;
    case "CUT_IN": return `cut_in:${det.reason}`;
  }
}

const round3 = (x: number): number => Math.round(x * 1000) / 1000;
