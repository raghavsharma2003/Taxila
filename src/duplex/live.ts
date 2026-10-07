/**
 * THE LIVE DUPLEX BRIDGE (p1-duplex, 2026-10-05; INTEGRATION.md §3 "DuplexBridge"): the hands-free lesson mode. It owns one
 * EngineHost for a cascade lesson and is the ONLY thing between the live streams and the engine:
 *
 *   mic frames (20 ms, RMS + YIN f0)  ─┐
 *   her output level (20 ms)          ─┤  frame()      → host.frame / host.herEvent(level) with an online echo-coupling estimate
 *   realtime transcription events     ─┤  stt()        → host.stt (deltas, finals, speech_started/stopped on the session clock)
 *   her playback (start / end / stop) ─┤  herStart()…  → host.herEvent (word timings estimated from the text, 70 ms/char)
 *   the Director's turn ui            ─┤  herStart(ctx)→ host.context (the FORM of the expected answer, never the key)
 *   100 ms timer                      ─┘  start()      → host.timer
 *
 *   host commands → the PORT (the cascade link implements it):
 *     voice.speak / cut_in → port.commit(turn)     a final is NOT a turn; the engine commits the child's turn
 *     voice.yield          → port.pause() (resumable) | port.stop() (a real turn, a stop request, a revoke)
 *     voice.resume         → port.resume()          (and her remaining words re-enter the host as a new utterance)
 *     voice.duck / unduck  → port.duck(level)       (the reflex duck at onset, the hush at 120 ms, release)
 *     stt.commit           → port.sttCommit()       (the micro-commit probe: input_audio_buffer.commit)
 *     think.revoke         → the reply to the revoked commit is never voiced (port.dropReply)
 *     floor / face / safety→ the face puppet (src/face-puppet/duplexBridge.ts withPuppet) and port.state()
 *
 * Hands-free and full-session: there is no press / release here. Shadow mode computes everything and actuates nothing.
 * Fail patient: any engine fault or an STT quota refusal degrades to the shipped path (port.fallback) and never shows a
 * failure to the child. Content-blind telemetry only (numbers and codes; never the child's words).
 * Erasable TypeScript; pure apart from the injected port and timers (tests drive it in Node with a fake clock).
 */
import type { EngineContext, AnswerForm, ExchangeContext, FloorPhase, HerAct, Ms, ReasonCode } from "./engine.ts";
import type { Floor } from "../lesson/floor.ts";
import { EngineHost, NEUTRAL_CONTEXT, type HostCommand, type HostSttEvent, type ShadowRow } from "./host.ts";
import type { SttEvent } from "../../server/duplex/fanin.js";
import { WT1_DEFAULT } from "./config.ts";

/** What the bridge asks of the link (CascadeLink implements it; tests fake it). */
export interface DuplexPort {
  /** Her output gain (1 = full). The reflex duck (0.2), the hush (0.05), release (1). */
  duck(level: number): void;
  /** Silence her now and keep the reply (a resumable yield). false when nothing was sounding. */
  pause(): boolean;
  /** Carry on from where pause() cut her. */
  resume(): void;
  /** End her reply: the child took the floor (teacher_interrupted). */
  stop(): void;
  /** The engine committed the child's turn: the link emits child_final with it (the runtime posts the turn). */
  commit(turn: DuplexTurn): void;
  /** input_audio_buffer.commit on the transcription call (the micro-commit probe). */
  sttCommit(): void;
  /** The reply to this committed turn must never be voiced (the child went on: revoke). */
  dropReply(turnId: number): void;
  /** The engine is gone: the link restores the shipped path (server VAD 900 ms, finals are turns, tap-to-talk if wanted). */
  fallback(reason: DuplexFallbackReason): void;
  /** Floor phase changes, for the status word and the acceptance probes. */
  state?(s: DuplexStatus): void;
}

export interface DuplexTurn {
  turnId: number;
  text: string;
  startedAt: number;
  itemId?: string;
  /** "" with 0 = the child spoke and the transcript is empty (the Director's repair move). */
  asrConfidence?: number;
  /**
   * ship5 fixer (experience B3): this commit follows a REVOKE of the commit whose words were `text` (the child went on
   * before her verdict word): the engine merged the fragments, so `text` here starts with those already-sent words. The
   * runtime supersedes the revoked turn while it is still in flight, else sends only the new words (never an answer twice).
   */
  revokeOf?: { turnId: number; text: string };
  /** TurnRequest.duplex (shared/contracts.ts): hashes and codes only, never words. */
  duplex: {
    transcriptHash: string;
    safetyPending?: { kind: "self_harm" | "abuse" | "fear" | null; source: "predicate" | "model_note" | null } | null;
    cutInReason?: "safety" | "word_search_cue" | "off_task_drift" | "question_to_her" | "hold_offer" | null;
    engineSummary?: { engine: string; reasons: string[]; pComplete: number[]; decidedAfterEndMs: number | null } | null;
  };
}

export type DuplexFallbackReason = "stt_rate_limited" | "stt_unavailable" | "engine_error" | "no_frames" | "echo" | "killed";

export interface DuplexStatus {
  mode: "on" | "shadow";
  live: boolean;
  phase: FloorPhase;
  floor: Floor | null;
  /** Counters for on-device runs and the acceptance probes (no words). */
  stats: DuplexStats;
}

export interface DuplexStats {
  frames: number;
  sttEvents: number;
  commits: number;
  /** Decision gap per commit: child's last voiced frame → the SPEAK (ms). */
  gaps: number[];
  yields: number;
  /** Overlap onset → yield (ms). */
  yieldLatency: number[];
  /** Overlap onset → hush (ms). */
  hushLatency: number[];
  hushes: number;
  resumes: number;
  revokes: number;
  dropped: number;
  safety: number;
  errors: number;
}

/** The Director's turn context as the link sees it (turnModel.ts TurnContext + her line). Never the answer key. */
export interface TurnUi {
  beat?: string;
  answerForm?: string;
  handover?: string;
}

export interface DuplexLiveOptions {
  lessonId: string;
  port: DuplexPort;
  mode?: "on" | "shadow";
  /** The transcription lane (production eastus2: taxila-live-transcribe → "live_transcribe"). */
  source?: "live_transcribe" | "mai_stream" | "nemotron" | "other";
  /** The STT accepts client commits mid-stream (live_transcribe does: M-D2, n=58). */
  supportsCommit?: boolean;
  /** Wrap the host's emit (the face puppet: `withPuppet` from src/face-puppet/duplexBridge.ts). */
  wrapEmit?: (emit: (c: HostCommand) => void) => (c: HostCommand) => void;
  /** Called on detach (the puppet's `puppetDuplexDetach`). */
  onDetach?: () => void;
  /** Client clock (epoch ms). */
  now?: () => number;
  setInterval?: (fn: () => void, ms: number) => unknown;
  clearInterval?: (h: unknown) => void;
  /** The child's band (pace defaults); B3 when unknown. */
  band?: "B1" | "B2" | "B3" | "B4";
  /** Telemetry rows (numbers and codes only). */
  log?: (row: ShadowRow) => void;
  /**
   * duplex-real: the stage A semantic estimator for OPEN contexts (server/duplex/semantic.js behind a route, or a replay
   * cache in evals/duplex-real). Absent = off (today). Closed answers never call it.
   */
  semantic?: EngineHostSemantic;
}

export type EngineHostSemantic = NonNullable<ConstructorParameters<typeof EngineHost>[0]["semantic"]>;

const MS_PER_CHAR = 70;
const EXPLAINING_BEATS = new Set(["teachback", "explain", "worked_example", "contrast", "explore_question", "reflect"]);
// word edges that work for Devanagari too (JS \b is ASCII-only: "क्या\b" never matched, so no Hindi yes/no lead was read)
const YES_NO_LEAD = /^(?:क्या|kya|is|are|do|does|did|can|will|would|should|have|has)(?![\p{L}\p{M}])/iu;
const YES_NO_TAIL = /(?:(?<![\p{L}\p{M}])na|(?<![\p{L}\p{M}])ना|hai na|है ना|(?<![\p{L}\p{M}])right|(?<![\p{L}\p{M}])naa|सही|theek hai|ठीक है)\s*[?？]\s*$/iu;
const WH_WORD = /(?<![\p{L}\p{M}])(?:kitne|kitna|kaun|kya hai|कितने|कितना|कौन|क्यों|कैसे|what|which|how|why)(?![\p{L}\p{M}])/iu;

/** Her act from her own line (the Director's text; never the answer). */
export function herActOf(text: string, ui: TurnUi): HerAct {
  const t = String(text ?? "").trim();
  const q = /[?？]\s*$/.test(t) || /[?？]/.test(t.split(/[।.!]/).pop() ?? "");
  if (ui.answerForm === "choice" || ui.handover === "choice") return "asked_choice";
  if (!q && !ui.answerForm) return "explaining";
  const last = t.split(/(?<=[.!?？।])\s+/).filter(Boolean).pop() ?? t;
  if (YES_NO_TAIL.test(last) || (YES_NO_LEAD.test(last) && !WH_WORD.test(last))) return "asked_yes_no";
  if (ui.answerForm === "number" || ui.answerForm === "words") return "asked_closed";
  return "asked_open";
}

/** The form of a number answer from her question's shape (fractions, decimals, units); integer by default. Never the key. */
export function numberFormOf(herText: string): AnswerForm {
  const t = String(herText ?? "").toLowerCase();
  if (/(?:बटा|भिन्न|fraction|\bupon\b|\d\s*\/\s*\d)/u.test(t)) return "fraction";
  if (/(?:दशमलव|decimal|\bpoint\b)/u.test(t)) return "decimal";
  if (/(?:सेंटीमीटर|मीटर|किलो|ग्राम|लीटर|रुपय|डिग्री|घंटे|मिनट|\bcm\b|\bkm\b|\bkg\b|\bmetres?\b|\bmeters?\b|\brupees?\b|\bdegrees?\b|\bhours?\b|\bminutes?\b)/u.test(t)) return "number_unit";
  return "integer";
}

/** The engine context for the coming child turn (seam S6) from the turn's ui and her line: the FORM, never the key. */
export function contextFromUi(ui: TurnUi, herText: string, band: EngineContext["band"] = "B3"): EngineContext {
  let exchange: ExchangeContext = "free";
  let expected: EngineContext["expected"] = null;
  let questionType: EngineContext["questionType"] = "none";
  const act = herActOf(herText, ui);
  if (ui.answerForm === "number") { exchange = "closed_answer"; expected = { form: numberFormOf(herText), slots: 1 }; questionType = "recall"; }
  else if (ui.answerForm === "choice" || ui.handover === "choice") { exchange = "closed_answer"; expected = { form: "choice", slots: 1 }; questionType = "recall"; }
  else if (act === "asked_yes_no") { exchange = "closed_answer"; expected = { form: "yes_no", slots: 1 }; questionType = "recall"; }
  else if (ui.answerForm === "read_aloud" || (ui.beat && EXPLAINING_BEATS.has(ui.beat))) { exchange = "open_explanation"; questionType = ui.beat === "probe" ? "reasoning" : "open"; }
  else if (ui.answerForm === "words") { exchange = "closed_answer"; expected = { form: "phrase", slots: 1 }; questionType = "recall"; }
  else if (ui.beat === "probe") { exchange = "open_explanation"; questionType = "reasoning"; }
  else if (act === "asked_open") { exchange = "open_explanation"; questionType = "open"; }
  return {
    ...NEUTRAL_CONTEXT, exchange, expected, questionType, band, lang: "hinglish",
    beat: (ui.beat as EngineContext["beat"]) ?? null, wt1: WT1_DEFAULT,
    cutIn: { wordSearchCue: "never", offTaskMs: null },
  };
}

/** Does her line hand the floor to the child? (the Director's hand-over, else a question at the end). */
export function handsOverOf(text: string, ui: TurnUi): boolean {
  if (ui.handover === "chain" || ui.handover === "finish") return false;
  if (ui.handover) return true;
  return /[?？]\s*$/.test(String(text ?? "").trim()) || !!ui.answerForm;
}

/**
 * Online echo coupling (her output dB → what reaches the mic): the 30th percentile of (mic − out) over frames where she is
 * audible. Most of those frames carry only her echo (the child talks over her a small part of the time), so a low quantile
 * tracks the coupling; a child's voice only raises the upper ones. Prior −30 dB (TaxilaFDB's AEC residue, clean) until 25.
 */
export class EchoCoupling {
  private d: number[] = [];
  private readonly prior: number;
  private readonly window: number;
  constructor(prior = -30, window = 250) {
    this.prior = prior;
    this.window = window;
  }
  push(micDb: number, outDb: number | null): void {
    if (outDb === null || outDb < -60) return;
    this.d.push(Math.max(-70, Math.min(10, micDb - outDb)));
    if (this.d.length > this.window) this.d.shift();
  }
  get db(): number {
    if (this.d.length < 25) return this.prior;
    const s = [...this.d].sort((a, b) => a - b);
    return Math.max(-60, Math.min(0, s[Math.floor(0.3 * (s.length - 1))]));
  }
}

/**
 * Realtime transcription session events → host STT events on the client clock. `audio_start_ms` / `audio_end_ms` are on
 * the session's audio clock; the offset to ours is the smallest (arrival − audio time) seen (the best-case event latency),
 * so mapped times are never later than the audio was spoken.
 */
export class TranscriptionTap {
  private offset: number | null = null;
  private readonly started = new Map<string, number>();
  private readonly stopped = new Map<string, number>();
  private toClient(audioMs: unknown, arrival: number): number | undefined {
    if (typeof audioMs !== "number" || !Number.isFinite(audioMs)) return undefined;
    const o = arrival - audioMs;
    this.offset = this.offset === null ? o : Math.min(this.offset, o);
    return audioMs + this.offset;
  }
  map(raw: unknown, now: number): HostSttEvent | null {
    const e = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const itemId = typeof e.item_id === "string" ? e.item_id : "";
    switch (e.type) {
      case "input_audio_buffer.speech_started": {
        const at = this.toClient(e.audio_start_ms, now);
        if (itemId && at !== undefined) this.started.set(itemId, at);
        return itemId ? { type: "speech_started", t: now, itemId, audioStartMs: at } : null;
      }
      case "input_audio_buffer.speech_stopped": {
        const at = this.toClient(e.audio_end_ms, now);
        if (itemId && at !== undefined) this.stopped.set(itemId, at);
        return itemId ? { type: "speech_stopped", t: now, itemId, audioEndMs: at } : null;
      }
      case "conversation.item.input_audio_transcription.delta": {
        if (!itemId || typeof e.delta !== "string") return null;
        const ev: SttEvent = { type: "partial", itemId, text: e.delta, t: now, delta: true };
        const s = this.started.get(itemId);
        if (s !== undefined) ev.audioStartMs = s;
        return ev;
      }
      case "conversation.item.input_audio_transcription.completed": {
        if (!itemId) return null;
        const ev: SttEvent = { type: "final", itemId, text: typeof e.transcript === "string" ? e.transcript : "", t: now };
        const s = this.started.get(itemId), x = this.stopped.get(itemId);
        if (s !== undefined) ev.audioStartMs = s;
        if (x !== undefined) ev.audioEndMs = x;
        this.started.delete(itemId);
        this.stopped.delete(itemId);
        return ev;
      }
      default:
        return null;
    }
  }
}

/** Error codes on the transcription call that mean "no capacity": the engine steps aside for the shipped path. */
export function isQuotaError(code: string | undefined, message?: string): boolean {
  const c = String(code ?? "").toLowerCase(), m = String(message ?? "").toLowerCase();
  return /rate_limit|quota|429|too_many|capacity|server_busy|overloaded/.test(c) || /rate limit|quota|429|too many requests|capacity/.test(m);
}

interface Her { id: string; text: string; startedAt: number; heardChars: number; turnId: number | null; act: HerAct }

export class DuplexLive {
  readonly mode: "on" | "shadow";
  readonly stats: DuplexStats = { frames: 0, sttEvents: 0, commits: 0, gaps: [], yields: 0, yieldLatency: [], hushLatency: [], hushes: 0, resumes: 0, revokes: 0, dropped: 0, safety: 0, errors: 0 };
  private readonly o: DuplexLiveOptions;
  private readonly host: EngineHost;
  private readonly tap = new TranscriptionTap();
  private readonly echo = new EchoCoupling();
  private readonly now: () => number;
  private timer: unknown = null;
  private alive = false;
  private dead: DuplexFallbackReason | null = null;
  private her: Her | null = null;
  private uttSeq = 0;
  private turnSeq = 0;
  /** The turn the engine committed last, until her reply to it starts (a revoke drops that reply). */
  private pendingTurn: number | null = null;
  /** The words of each commit not yet answered, and the revoked commit the next commit merges (ship5 fixer, B3). */
  private lastCommit: { turnId: number; text: string } | null = null;
  private revoked: { turnId: number; text: string } | null = null;
  private ui: TurnUi = {};
  private overlapOnsetAt: number | null = null;
  private lastItemId: string | undefined;
  private phase: FloorPhase = "idle";
  private floor: Floor | null = null;

  constructor(o: DuplexLiveOptions) {
    this.o = o;
    this.mode = o.mode ?? "on";
    this.now = o.now ?? (() => Date.now());
    const emit = (c: HostCommand) => this.onCommand(c);
    this.host = new EngineHost({
      session: { lessonId: o.lessonId, band: o.band ?? "B3", startedAt: this.now(), flags: { shadow: this.mode === "shadow", semantic: !!o.semantic, trained: false, cutIn: false, audioBackchannel: false, lexicalBackchannel: false } },
      source: o.source ?? "live_transcribe",
      supportsCommit: o.supportsCommit ?? true,
      emit: o.wrapEmit ? o.wrapEmit(emit) : emit,
      ...(o.semantic ? { semantic: o.semantic } : {}),
    });
  }

  /** The engine is deciding (started and not fallen back). */
  get live(): boolean { return this.alive && this.dead === null; }
  get fallenBack(): DuplexFallbackReason | null { return this.dead; }
  get floorPhase(): FloorPhase { return this.phase; }

  /** Start the 100 ms timer (the engine's mini-turn clock); the very first context hands the floor over if no line plays. */
  start(): void {
    if (this.alive || this.dead) return;
    this.alive = true;
    const si = this.o.setInterval ?? ((fn: () => void, ms: number) => setInterval(fn, ms));
    this.timer = si(() => this.guard(() => this.host.timer(this.now())), 100);
    this.guard(() => this.host.context(contextFromUi(this.ui, "", this.o.band), this.now(), { handsOver: true }));
    this.pushState();
  }

  /** Stop deciding (lesson closed, or the link fell back). Idempotent. */
  stop(): void {
    if (this.timer !== null) (this.o.clearInterval ?? ((h: unknown) => clearInterval(h as ReturnType<typeof setInterval>)))(this.timer);
    this.timer = null;
    if (this.alive) {
      this.alive = false;
      try { this.o.onDetach?.(); } catch { /* the face never breaks the floor */ }
    }
  }

  /** Step aside for the shipped path (an STT quota refusal, an engine fault, echo). The child sees no failure. */
  degrade(reason: DuplexFallbackReason): void {
    if (this.dead) return;
    this.dead = reason;
    this.stop();
    this.o.log?.({ t: this.now(), cause: "timer", phase: this.phase, action: `fallback:${reason}`, proposed: "-", detail: null, reasons: ["fallback_silence"], pComplete: 0, pHoldWanted: 0, engine: "live", turnSeq: this.turnSeq });
    try { this.o.port.fallback(reason); } catch { /* the port restores what it can */ }
    this.pushState();
  }

  // ───────────────────────────── inputs ─────────────────────────────

  /** One 20 ms mic frame (linear RMS, f0 Hz or null) and her output level at the speaker (dBFS, null when silent). */
  frame(t: number, rms: number, f0: number | null, herOutDb: number | null): void {
    if (!this.live) return;
    this.stats.frames++;
    const micDb = rms > 0 ? 20 * Math.log10(rms) : -100;
    const herSounding = !!this.her && herOutDb !== null && herOutDb > -60;
    // the coupling learns from EVERY frame she is audible in: the 30th percentile already ignores the minority of frames a
    // child talks over her. p1-duplex 2026-10-06 (AMI real speech, headset bleed -10..-22 dB): gating it on "the child is
    // not voicing" never learned a strong echo path, because her own echo above the -30 dB prior read as the child voicing
    if (herSounding) this.echo.push(micDb, herOutDb);
    this.guard(() => {
      if (this.her) this.host.herEvent({ kind: "level", t, db: herOutDb === null ? null : herOutDb + this.echo.db });
      this.host.frame(t, rms, f0);
    });
  }

  /** One realtime transcription event (the link's data channel). Errors are the link's to read (isQuotaError → degrade). */
  stt(raw: unknown): void {
    if (!this.live) return;
    const ev = this.tap.map(raw, this.now());
    if (!ev) return;
    this.stats.sttEvents++;
    if (ev.type === "final" || ev.type === "partial") this.lastItemId = ev.itemId;
    this.guard(() => this.host.stt(ev));
  }

  /** duplex-real: the transcriber answered a probe with input_audio_buffer_commit_empty (see CascadeDuplex.onServerError). */
  commitEmpty(): void { if (this.live) this.guard(() => this.host.commitEmpty()); }

  /** The Director's turn ui (turnModel.ts setTurnContext carries the same fields): used at her next line. */
  setUi(ui: TurnUi): void { this.ui = { ...ui }; }

  /**
   * Her reply became audible. `turnId`: the committed child turn it answers (from TeacherReply.turnId), when known. Returns
   * false when the reply must NOT be voiced (it answers a revoked commit): the link stops it.
   */
  herStart(text: string, opts: { turnId?: number | null; resumeOf?: boolean } = {}): boolean {
    if (!this.live) return true;
    const t = this.now();
    const ui = this.ui;
    const act = opts.resumeOf && this.her ? this.her.act : herActOf(text, ui);
    const handsOver = handsOverOf(text, ui);
    const id = `h${++this.uttSeq}`;
    this.her = { id, text, startedAt: t, heardChars: 0, turnId: opts.turnId ?? null, act };
    this.pendingTurn = null;
    this.guard(() => {
      if (!opts.resumeOf) this.host.context(contextFromUi(ui, text, this.o.band), t);
      this.host.herEvent({ kind: "start", t, utteranceId: id, text, act, handsOver, msPerChar: MS_PER_CHAR });
    });
    return true;
  }

  /** Her line played to the end. */
  herEnd(): void {
    if (!this.live || !this.her) return;
    const id = this.her.id;
    this.her = null;
    this.guard(() => this.host.herEvent({ kind: "end", t: this.now(), utteranceId: id }));
  }

  /** Her line stopped before its end (a yield executed, or the link stopped it). */
  herStopped(): void {
    if (!this.live || !this.her) return;
    const id = this.her.id;
    this.guard(() => this.host.herEvent({ kind: "stopped", t: this.now(), utteranceId: id }));
  }

  /** The child typed or tapped (a screen act): the engine's screen stream. */
  screen(kind: "submit" | "choice_pick" | "type"): void {
    if (!this.live) return;
    this.guard(() => this.host.screen({ kind, at: this.now() } as Parameters<EngineHost["screen"]>[0]));
  }

  // ───────────────────────────── commands ─────────────────────────────

  private onCommand(c: HostCommand): void {
    try {
      this.handle(c);
    } catch (err) {
      this.stats.errors++;
      console.warn("duplex: a command failed", err);
    }
  }

  private handle(c: HostCommand): void {
    const port = this.o.port;
    if (c.to === "log") {
      const r = c.row;
      if (r.action === "HUSH") {
        this.stats.hushes++;
        if (this.overlapOnsetAt !== null) this.stats.hushLatency.push(Math.round(r.t - this.overlapOnsetAt));
      }
      this.o.log?.(r);
      return;
    }
    if (c.to === "floor") {
      if (c.phase === "overlap" && this.phase !== "overlap") this.overlapOnsetAt = c.t;
      this.phase = c.phase;
      this.floor = c.floor;
      this.pushState();
      return;
    }
    if (c.to === "safety") { this.stats.safety++; return; }
    if (c.to === "face" || c.to === "build") return; // the puppet took the face cues (wrapEmit); build intents: not wired
    if (this.mode === "shadow") return;
    if (c.to === "stt") { port.sttCommit(); return; }
    if (c.to === "think") {
      // the engine re-opens the revoked turn (fanin.begin(prevTurnStart)): the merged turn that follows carries the
      // revoked commit's words, whether or not her reply to it had started, so the runtime never sends them twice
      if (c.op === "revoke" && this.lastCommit) this.revoked = this.lastCommit;
      if (c.op === "revoke" && this.pendingTurn !== null) {
        this.stats.revokes++;
        this.stats.dropped++;
        port.dropReply(this.pendingTurn);
        this.pendingTurn = null;
      }
      return;
    }
    // to: voice
    switch (c.op) {
      case "duck": port.duck(c.level); return;
      case "unduck": port.duck(1); return;
      case "speak":
      case "cut_in": {
        // a nudge after her question with nothing said: the floor's own re-ask timers own silence; never a fake child turn
        if (c.op === "speak" && c.reason === "wt1_nudge") return;
        const pk = this.host.peek();
        const s = pk.safety;
        const turnId = ++this.turnSeq;
        // the decision gap: the child's last voiced frame → this decision (a SPEAK while they still voice has gap 0)
        const lastVoice = pk.voicing ? c.t : pk.lastOffsetAt;
        if (lastVoice !== null) this.stats.gaps.push(Math.max(0, Math.round(c.t - lastVoice)));
        this.stats.commits++;
        this.pendingTurn = turnId;
        const text = String(c.text ?? "").trim();
        const revokeOf = this.revoked;
        this.revoked = null;
        this.lastCommit = { turnId, text };
        port.commit({
          turnId, text, startedAt: pk.firstOnsetAt ?? c.t, itemId: this.lastItemId,
          ...(revokeOf ? { revokeOf } : {}),
          ...(text ? {} : { asrConfidence: 0 }),
          duplex: {
            transcriptHash: c.textHash,
            safetyPending: s.distress ? { kind: (s.kind as "self_harm" | "abuse" | "fear" | null) ?? null, source: (s.source as "predicate" | "model_note" | null) ?? null } : null,
            cutInReason: c.op === "cut_in" ? c.reason : null,
            engineSummary: { engine: "stage-a/live", reasons: [c.op === "speak" ? c.reason : `cut_in:${c.reason}`], pComplete: [], decidedAfterEndMs: lastVoice !== null ? Math.round(c.t - lastVoice) : null },
          },
        });
        return;
      }
      case "yield": {
        this.stats.yields++;
        if (this.overlapOnsetAt !== null) this.stats.yieldLatency.push(Math.round(c.t - this.overlapOnsetAt));
        if (this.her && c.heardUpTo) this.her.heardChars = c.heardUpTo.chars;
        if (c.resumable && c.reason !== "revoke" && c.reason !== "safety") { if (!port.pause()) port.stop(); }
        else port.stop();
        return;
      }
      case "resume": {
        this.stats.resumes++;
        const h = this.her;
        port.resume();
        if (h) {
          // her remaining words re-enter the host as a new utterance (echo subtraction and heardUpTo stay exact)
          const rest = h.text.slice(h.heardChars).trim();
          if (rest) this.herStart(rest, { turnId: h.turnId, resumeOf: true });
        }
        return;
      }
    }
  }

  private pushState(): void {
    try {
      this.o.port.state?.({ mode: this.mode, live: this.live, phase: this.phase, floor: this.floor, stats: this.stats });
    } catch { /* a status reader never breaks the floor */ }
  }

  /** Every engine call goes through here: a fault degrades to the shipped path instead of breaking the lesson. */
  private guard(fn: () => void): void {
    try {
      fn();
    } catch (err) {
      this.stats.errors++;
      console.warn("duplex: engine fault, falling back to the shipped path", err);
      this.degrade("engine_error");
    }
  }
}

export type { ReasonCode, Ms };
