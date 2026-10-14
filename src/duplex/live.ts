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
import type { EngineContext, AnswerForm, ExchangeContext, FloorPhase, HerAct, Ms, ReasonCode, AcousticEstimate } from "./engine.ts";
import type { Floor } from "../lesson/floor.ts";
import { EngineHost, NEUTRAL_CONTEXT, type HostCommand, type HostSttEvent, type ShadowRow } from "./host.ts";
import type { SttEvent } from "../../server/duplex/fanin.js";
import { WT1_DEFAULT } from "./config.ts";
import { vt } from "../voice/trace.ts";

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
  /** Round 5, half-duplex D4: true = the mic must send silence now (her voice is in the room), false = listen again. */
  micGate?(gated: boolean): void;
  /**
   * Round 3: the EAGER END OF TURN (EngineTick prepare.eager): "start" = the covered words read as a finished turn: the
   * turn's model work may start on exactly `text` now (the commit, if it comes, carries the same words); "cancel" = the
   * child went on: drop it. Optional: absent = ignored (the floor decision never depends on it).
   */
  eager?(e: { op: "start" | "cancel"; text: string; textHash: string; t: number }): void;
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
  /** Round 3: eager end-of-turn starts and cancels (the child went on after one). */
  eagerStarts?: number;
  eagerCancels?: number;
  dropped: number;
  safety: number;
  errors: number;
  /** Round 5: engine turns held because a turn was in flight or a tap was recent (one turn at a time). */
  held?: number;
  /** Round 5 half-duplex: micro-commit probes skipped (the transcriber held nothing: no commit_empty). */
  probesSkipped?: number;
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
  /** The transcription lane (production eastus2: taxila-live-transcribe → "live_transcribe"; D5: Azure Voice Live). */
  source?: "live_transcribe" | "mai_stream" | "nemotron" | "voicelive" | "other";
  /**
   * D5 (2026-10-11): whose VAD may open a burst while her line plays. "device" (default, D4): the mic frames, with the echo
   * coupling margin. "server": Voice Live's VAD, which runs AFTER its Live-Reference echo canceller; while it reports no
   * speech the engine reads a quiet frame (the room's floor), so her echo on a phone speaker cannot open a burst. With her
   * silent the device frames drive the engine as on D4 (thinking pauses and end of turn keep their 20 ms timing).
   */
  vadGate?: "device" | "server";
  /**
   * Release 14 (owner's phone lessons 3a7da0ad / 56d898ce, 2026-10-12/14: her loudspeaker voice came back through the mic,
   * was transcribed as the child, hushed and yielded her mid-line): D4 runs HALF-DUPLEX on the live lane. While her line
   * plays (and HALF_DUPLEX_TAIL_MS after it) the engine reads the room's quiet level instead of the mic, every transcription
   * item that STARTS in that window is her echo and is dropped whole (no caption, no final, no turn), and she is never
   * ducked or yielded. The child cannot talk over her on D4; D5 (Voice Live's echo canceller) is the lane that can.
   */
  halfDuplex?: boolean;
  /**
   * D5: duck her at once on a loud device burst over her line, before Voice Live confirms it (~0.6 s later); released after
   * D5_PREDUCK_RELEASE_MS if Voice Live never does. Off by default (measured in evals/duplex-2026-10/arms-d5.mjs).
   */
  preDuck?: boolean;
  /** Round 5: the half-duplex tail (ms) after her line or audible output; default HALF_DUPLEX_TAIL_MS (CascadeDuplex: adaptive). */
  halfTailMs?: number;
  /** Evals only: override the pre-duck constants (D5_PREDUCK_MARGIN_DB / _MS / _PITCH_ST) to tune them offline. */
  preDuckTune?: { marginDb?: number; ms?: number; pitchSt?: number };
  /** D5: Voice Live's VAD silence (ms) — its audio_end_ms lands this much (+ ~90 ms) after the child's true end. */
  serverVadMs?: number;
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
/** Round 5: no engine turn within this long of a tap or typed answer (the owner's "Homework" chip race), and none while it is in flight. */
export const TAP_GUARD_MS = 3000;
/** Round 5: a turn whose reply has not started this long after it went out no longer holds the floor (a lost reply). */
export const IN_FLIGHT_MAX_MS = 15000;
/** D5: her echo tail after her line ends (the room rings, the phone's output buffer drains): still gated. */
export const D5_HER_TAIL_MS = 300;
/** Release 14, D4 half-duplex: her echo tail (the phone's output buffer plus the WebRTC uplink), still gated. */
export const HALF_DUPLEX_TAIL_MS = 600;
/**
 * Release 14 (owner lesson 56d898ce: speak:backstop_silence 0.4 s after the reply to a tapped chip arrived, so two turns raced):
 * after a tap or typed answer no engine SPEAK commits until her reply to it starts, or this long if it never does.
 */
export const SCREEN_REPLY_HOLD_MS = 15000;
/** Round 5 half-duplex: her output this loud (dBFS at the player) counts as audible (the mic gate holds). */
export const HALF_AUDIBLE_DB = -60;
/** D5: device frames kept for the delayed replay, and the confirm delay assumed when Voice Live gives no audio time. */
export const D5_RING_MS = 2000;
export const D5_DEFAULT_SHIFT_MS = 600;
/**
 * D5: Voice Live's VAD edges against the child's true speech (bake-off arm e, n=122 bursts, phone path): audio_start_ms is
 * the true start − 210 ms (p10-p90 −286..−74: its prefix padding), audio_end_ms the true end + 596 ms (578..618: the 500 ms
 * silence it waits for plus ~90 ms). The replay trims both, so the engine reads the burst the child actually spoke.
 */
export const D5_VAD_START_PAD_MS = 200;
export const D5_VAD_END_PAD_MS = 590;
/** D5: a burst Voice Live opened no item for this long after it ended is unheard (its speech_started lands ~0.6 s in). */
export const D5_UNHEARD_AFTER_MS = 1000;
/** D5 pre-duck: the device burst must stand this far above her predicted echo, for this long, with a pitch. */
/**
 * Round 5, tuned offline (evals/duplex-2026-10/preduck-tune.mjs, 102 of her lines x 3 acoustic variants, IN-SAMPLE): margin
 * 6 dB / 40 ms pre-ducked her on her own echo on 6/102 owner-phone lines; 12 dB / 80 ms gives 0/102 owner, 0/102 phone,
 * 1/102 clean, with 11/12 barge-ins still pre-ducked within 500 ms of the child's onset on each.
 */
export const D5_PREDUCK_MARGIN_DB = 12;
export const D5_PREDUCK_MS = 80;
/** Round 5: a pre-duck frame's pitch must be this far (semitones) from her own output's pitch on the same hop. */
export const D5_PREDUCK_PITCH_ST = 1.5;
/** Round 5: the pre-duck goes straight to the hush level (−26 dB): her stop <= 500 ms (BRIEF.md). */
export const D5_PREDUCK_LEVEL = 0.05;
/** D5 pre-duck: Voice Live has not confirmed the burst this long after the duck → her gain comes back. */
export const D5_PREDUCK_RELEASE_MS = 900;
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
  /**
   * D5: the client time of the stream's first audio frame. Set, audio times map exactly (the server's audio clock starts
   * at that frame); unset (D4), the best-case-latency estimate below.
   */
  origin: number | null = null;
  private readonly started = new Map<string, number>();
  private readonly stopped = new Map<string, number>();
  private toClient(audioMs: unknown, arrival: number): number | undefined {
    if (typeof audioMs !== "number" || !Number.isFinite(audioMs)) return undefined;
    if (this.origin !== null) return audioMs + this.origin;
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
  readonly stats: DuplexStats = { frames: 0, sttEvents: 0, commits: 0, gaps: [], yields: 0, yieldLatency: [], hushLatency: [], hushes: 0, resumes: 0, revokes: 0, eagerStarts: 0, eagerCancels: 0, dropped: 0, safety: 0, errors: 0 };
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
  /** Round 5 half-duplex: gated until this time; the items that began while gated (dropped whole); the open real item. */
  private halfUntil = -Infinity;
  private halfGated = false;
  private openItem: string | null = null;
  /** Round 5 half-duplex: when the gate last opened, and when the transcriber last committed its buffer (client clock). */
  private halfOpenedAt = -Infinity;
  private lastServerCommitAt = -Infinity;
  /** D5: the Voice Live item whose speech is open (its speech_stopped closes the replay). */
  private serverSpeechItem: string | null = null;
  /**
   * D5: the delayed replay. Voice Live confirms speech ~0.6 s after it began, longer than a "रुको" lasts, so the frames the
   * engine reads over her line are the REAL device frames from Voice Live's own (back-dated) speech start, replayed
   * `shift` ms late until its speech end: the engine sees the child's true burst (length, level, pitch), only later.
   */
  private ring: Array<[number, number, number | null]> = [];
  private replay: { shift: number; endAt: number | null } | null = null;
  private herTailUntil = -Infinity;
  /** D5: her line was stopped or paused (the gate opens after the tail even though `her` is kept for a resume). */
  private herHalted = false;
  /** D5: the room's level when nobody speaks (10th percentile of ungated frames), fed while gated. */
  private quietDb: number[] = [];
  private preDuckRun = 0;
  private herF0s: Array<[number, number]> = [];
  private preDuckF0 = false;
  private preDuckAt: number | null = null;
  /** The engine's own last duck level (a pre-duck release never undoes it). */
  private hostDuck = 1;
  /** D5 counters (content-blind): gated frames, pre-ducks, releases, re-asks. */
  readonly d5 = { gatedFrames: 0, serverStarts: 0, preDucks: 0, preDuckReleases: 0, reasks: 0 };
  /** Release 14 half-duplex: transcription items that started over her line (her echo), dropped whole. */
  private echoItems = new Set<string>();
  /**
   * Release 14 (D5 review, confirmed): her acknowledgement clip ("छप्पन!" said back while she thinks) plays in the committed
   * phase, before any reply, so `her` is null. Its loudspeaker echo opened a burst that revoked the child's committed answer
   * and dropped her reply. The clip is now a gated window like her line (not her reply: no context, no hold release).
   */
  private ackSounding = false;
  /** Release 14: a tap or typed answer is waiting for her reply until this time (no engine SPEAK races it). */
  private screenHoldUntil = -Infinity;
  /** Release 14 counters (content-blind). */
  readonly half = { gatedFrames: 0, echoItems: 0, blockedOps: 0, heldSpeaks: 0, droppedEmpty: 0 };

  constructor(o: DuplexLiveOptions) {
    this.o = o;
    this.mode = o.mode ?? "on";
    this.now = o.now ?? (() => Date.now());
    const emit = (c: HostCommand) => this.onCommand(c);
    this.host = new EngineHost({
      session: { lessonId: o.lessonId, band: o.band ?? "B3", startedAt: this.now(), flags: { shadow: this.mode === "shadow", semantic: !!o.semantic, trained: false, cutIn: false, audioBackchannel: false, lexicalBackchannel: false } },
      source: o.source ?? "live_transcribe",
      // D5: the ear removed her echo acoustically; subtracting her words from the text only deletes the child's repeats
      ...(o.vadGate === "server" ? { echoText: false } : {}),
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
    this.timer = si(() => this.guard(() => { if (this.o.vadGate === "server") this.checkUnheard(); this.host.timer(this.now()); }), 100);
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
  frame(t: number, rms: number, f0: number | null, herOutDb: number | null, herF0: number | null = null): void {
    if (!this.live) return;
    this.stats.frames++;
    const micDb = rms > 0 ? 20 * Math.log10(rms) : -100;
    const herSounding = !!this.her && herOutDb !== null && herOutDb > -60;
    // the coupling learns from EVERY frame she is audible in: the 30th percentile already ignores the minority of frames a
    // child talks over her. p1-duplex 2026-10-06 (AMI real speech, headset bleed -10..-22 dB): gating it on "the child is
    // not voicing" never learned a strong echo path, because her own echo above the -30 dB prior read as the child voicing
    if (herSounding) this.echo.push(micDb, herOutDb);
    if (this.o.vadGate === "server") return this.gatedFrame(t, rms, f0, herOutDb, micDb, herF0);
    if (this.o.halfDuplex) {
      // release 14 + round 5: while her line plays, or her output is audible, and HALF_DUPLEX_TAIL_MS after either, the mic is
      // GATED (port.micGate: the link disables the track, so the transcriber never hears her) and the engine reads the
      // room's quiet level
      const tail = this.o.halfTailMs ?? HALF_DUPLEX_TAIL_MS;
      if ((herOutDb !== null && herOutDb > HALF_AUDIBLE_DB) || (!!this.her && !this.herHalted)) this.halfUntil = t + tail;
      const gated = t < this.halfUntil || this.herActive(t);
      if (gated !== this.halfGated) {
        this.halfGated = gated;
        if (!gated) this.halfOpenedAt = t;
        if (this.mode === "on") { try { this.o.port.micGate?.(gated); } catch { /* the link's own */ } }
        vt("duplex.half", { op: gated ? "mic_gate" : "mic_open", reason: gated ? "her_voice_audible" : "her_voice_ended_plus_tail", tailMs: tail });
      }
      if (gated) {
        this.half.gatedFrames++;
        const q = this.quietLevelDb();
        this.guard(() => {
          if (this.her) this.host.herEvent({ kind: "level", t, db: herOutDb === null ? null : herOutDb + this.echo.db });
          this.host.frame(t, Math.pow(10, q / 20), null);
        });
        return;
      }
      this.quietDb.push(micDb);
      if (this.quietDb.length > 250) this.quietDb.shift();
    }
    this.guard(() => {
      if (this.her) this.host.herEvent({ kind: "level", t, db: herOutDb === null ? null : herOutDb + this.echo.db });
      this.host.frame(t, rms, f0);
    });
  }

  /** D5: the server-VAD gate (see DuplexLiveOptions.vadGate). */
  private gatedFrame(t: number, rms: number, f0: number | null, herOutDb: number | null, micDb: number, herF0: number | null = null): void {
    this.ring.push([t, rms, f0]);
    while (this.ring.length && this.ring[0][0] < t - D5_RING_MS) this.ring.shift();
    const herActive = this.herActive(t);
    if (!herActive) {
      this.replay = null;
      this.quietDb.push(micDb);
      if (this.quietDb.length > 250) this.quietDb.shift();
      this.guard(() => this.host.frame(t, rms, f0));
      return;
    }
    const rp = this.replay;
    if (rp) {
      const at = t - rp.shift;
      if (rp.endAt === null || at <= rp.endAt) {
        // Voice Live heard the child through its echo canceller: the burst is theirs, so her level does not raise the bar
        const fr = this.ringAt(at) ?? [at, rms, f0];
        this.guard(() => {
          if (this.her) this.host.herEvent({ kind: "level", t, db: null });
          this.host.frame(t, fr[1], fr[2]);
        });
        return;
      }
      this.replay = null;
    }
    this.d5.gatedFrames++;
    if (this.o.preDuck) this.preDuckFrame(t, micDb, f0, herOutDb, herF0);
    const q = this.quietLevelDb();
    this.guard(() => {
      if (this.her) this.host.herEvent({ kind: "level", t, db: herOutDb === null ? null : herOutDb + this.echo.db });
      this.host.frame(t, Math.pow(10, q / 20), null);
    });
  }

  private ringAt(at: number): [number, number, number | null] | null {
    for (let i = this.ring.length - 1; i >= 0; i--) if (this.ring[i][0] <= at) return this.ring[i];
    return null;
  }

  private quietLevelDb(): number {
    if (this.quietDb.length < 10) return -70;
    const s = [...this.quietDb].sort((a, b) => a - b);
    return Math.min(-40, s[Math.floor(0.1 * (s.length - 1))]);
  }

  /** D5 pre-duck: a loud, pitched device burst above her predicted echo ducks her before Voice Live confirms it. */
  private preDuckFrame(t: number, micDb: number, f0: number | null, herOutDb: number | null, herF0: number | null = null): void {
    if (this.preDuckAt !== null) {
      if (t - this.preDuckAt >= D5_PREDUCK_RELEASE_MS) {
        this.preDuckAt = null;
        this.d5.preDuckReleases++;
        if (this.mode === "on") this.o.port.duck(this.hostDuck);
        vt("d5.decision", { op: "preduck_release", reason: "voicelive_silent", ms: D5_PREDUCK_RELEASE_MS });
      }
      return;
    }
    const echoDb = herOutDb === null ? -100 : herOutDb + this.echo.db;
    // round 5 (the owner's phone: a weak device AEC re-converging at each of her lines lets her echo through 10 dB above the
    // learned coupling): the level margin alone pre-ducked her on her own echo about once a second. Her echo carries HER
    // pitch; a child over her does not: a pitched frame counts only when its f0 is D5_PREDUCK_PITCH_ST away from hers.
    // her pitch over the echo path's delay (the speaker → mic path lags her output by 60-150 ms), octave-tolerant (a pitch
    // tracker on a band-limited, clipped phone echo often locks to a harmonic)
    if (herF0) this.herF0s.push([t, herF0]);
    while (this.herF0s.length && this.herF0s[0][0] < t - 200) this.herF0s.shift();
    // measured on the owner variant (bake set, echo-only frames: mic f0 vs her f0 within 200 ms): 4,448 frames at 0 st, ~30 at
    // each of ±12, a few dozen spread over ±9..11; children's frames spread −22..+18 st. So her pitch and its octaves only.
    const tune = this.o.preDuckTune ?? {};
    const pitchSt = tune.pitchSt ?? D5_PREDUCK_PITCH_ST;
    const near = (a: number, b: number): boolean => { const st = 12 * Math.log2(a / b); return [-12, 0, 12].some((k) => Math.abs(st - k) < pitchSt); };
    const notHerPitch = !!f0 && !this.herF0s.some(([, h]) => near(f0, h));
    if (micDb >= echoDb + (tune.marginDb ?? D5_PREDUCK_MARGIN_DB) && (f0 === null || notHerPitch)) {
      this.preDuckRun += 20;
      if (notHerPitch) this.preDuckF0 = true;
    } else { this.preDuckRun = 0; this.preDuckF0 = false; }
    if (this.preDuckRun >= (tune.ms ?? D5_PREDUCK_MS) && this.preDuckF0 && this.hostDuck >= 1) {
      this.preDuckAt = t;
      this.preDuckRun = 0;
      this.preDuckF0 = false;
      this.d5.preDucks++;
      if (this.mode === "on") this.o.port.duck(D5_PREDUCK_LEVEL);
      vt("d5.decision", { op: "preduck", reason: "device_burst_over_echo", overEchoDb: Math.round(micDb - echoDb) });
    }
  }

  /**
   * An acoustic model's estimate for the host's next tick (voicesig round 3: the thinking-pause cue, published on
   * src/voicesig/holdBus.ts; stamped, and stale after ACOUSTIC_FRESH_MS like any acoustic estimate).
   */
  estimate(e: { acoustic?: AcousticEstimate }, t: number): void {
    if (!this.live) return;
    this.guard(() => this.host.estimate(e, t));
  }

  /** One realtime transcription event (the link's data channel). Errors are the link's to read (isQuotaError → degrade). */
  stt(raw: unknown): void {
    if (!this.live) return;
    if (this.echoOnly(raw)) return;
    const ev = this.tap.map(raw, this.now());
    if (this.o.vadGate === "server") this.serverVad(raw, ev);
    if (!ev) return;
    this.stats.sttEvents++;
    if (ev.type === "final" || ev.type === "partial") this.lastItemId = ev.itemId;
    this.guard(() => this.host.stt(ev));
  }

  /** Her line is playing, or its echo tail has not passed (D4 half-duplex / D5 gate). */
  private herActive(t: number): boolean { return (!!this.her && !this.herHalted) || this.ackSounding || t < this.herTailUntil; }

  /** Her acknowledgement clip became audible / ended (the link's playAck). Gated like her line, plus its echo tail. */
  ackStart(): void {
    if (!this.live) return;
    this.ackSounding = true;
  }
  ackEnd(): void {
    if (!this.ackSounding) return;
    this.ackSounding = false;
    this.herTailUntil = Math.max(this.herTailUntil, this.now() + (this.o.halfDuplex ? HALF_DUPLEX_TAIL_MS : D5_HER_TAIL_MS));
  }

  /**
   * Release 14, D4 half-duplex: true when this transcription event belongs to an item that started over her line (her own
   * voice from the loudspeaker). The item is dropped whole: its partials, final or failure never reach the engine, the
   * caption or the Director. CascadeDuplex consumes the same events (isEcho).
   */
  echoOnly(raw: unknown): boolean {
    if (!this.o.halfDuplex || !this.live) return false;
    const e = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const item = typeof e.item_id === "string" ? e.item_id : null;
    if (!item) return false;
    if (e.type === "input_audio_buffer.speech_started") {
      // over her line, while her output is audible, or inside the tail after either (round 5: the mic gate's own window)
      if (!(this.herActive(this.now()) || this.halfGated || this.now() < this.halfUntil)) { this.openItem = item; return false; }
      if (!this.echoItems.has(item)) {
        this.echoItems.add(item);
        this.half.echoItems++;
        vt("duplex.half", { op: "echo_item", itemId: item, herPlaying: !!this.her && !this.herHalted });
      }
      return true;
    }
    if (this.echoItems.has(item)) {
      if (e.type === "conversation.item.input_audio_transcription.completed" || e.type === "conversation.item.input_audio_transcription.failed") this.echoItems.delete(item);
      return true;
    }
    // round 5: what the transcriber is holding (a micro-commit goes out only for that: no input_audio_buffer_commit_empty)
    if (e.type === "input_audio_buffer.committed") this.lastServerCommitAt = this.now();
    if ((e.type === "conversation.item.input_audio_transcription.completed" || e.type === "input_audio_buffer.committed") && this.openItem === item) this.openItem = null;
    return false;
  }

  /** D5: Voice Live's VAD edges open and close the gate (it hears the child after its echo canceller). */
  private serverVad(raw: unknown, ev: HostSttEvent | null): void {
    const e = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const item = typeof e.item_id === "string" ? e.item_id : null;
    const now = this.now();
    if (e.type === "input_audio_buffer.speech_started") {
      this.serverSpeechItem = item;
      this.d5.serverStarts++;
      if (this.preDuckAt !== null) this.preDuckAt = null; // confirmed: the engine's own duck / hush / yield take over
      const startAt = ev && "audioStartMs" in ev && typeof ev.audioStartMs === "number" ? ev.audioStartMs + D5_VAD_START_PAD_MS : null;
      this.serverStartAudioAt = startAt ?? now - D5_DEFAULT_SHIFT_MS;
      const shift = startAt !== null ? Math.max(0, Math.min(D5_RING_MS - 200, now - startAt)) : D5_DEFAULT_SHIFT_MS;
      this.replay = { shift, endAt: null };
      if (this.her && !this.herHalted) vt("d5.decision", { op: "server_speech", reason: "voicelive_vad_over_her", itemId: item, confirmMs: Math.round(shift) });
    } else if (e.type === "input_audio_buffer.speech_stopped") {
      if (!this.serverSpeechItem || !item || item === this.serverSpeechItem) {
        const pad = this.o.serverVadMs !== undefined ? this.o.serverVadMs + D5_VAD_END_PAD_MS - 500 : D5_VAD_END_PAD_MS;
        const endAt = ev && "audioEndMs" in ev && typeof ev.audioEndMs === "number" ? ev.audioEndMs - pad : now - (this.replay?.shift ?? 0) - pad;
        if (this.replay) this.replay.endAt = endAt;
      }
    }
  }

  /** D5: the client time of the stream's first audio frame (Voice Live's audio clock starts there); see TranscriptionTap. */
  audioOrigin(t: number | null): void { this.tap.origin = t; }

  /** duplex-real: the transcriber answered a probe with input_audio_buffer_commit_empty (see CascadeDuplex.onServerError). */
  commitEmpty(): void {
    if (!this.live) return;
    this.guard(() => this.host.commitEmpty());
    // D5: Voice Live's VAD never opened an item for a burst the device heard (a lone 250 ms "haan", BAKEOFF §2.6), so the
    // probe found nothing to transcribe and no final will ever come. Say so to the engine as an EMPTY final over the
    // burst: it can end the turn, and the empty commit is the Director's repair move (she asks again).
    if (this.o.vadGate === "server") this.unheard("probe_found_no_audio");
  }
  private unheardSeq = 0;
  /** D5: the device burst already reported unheard (once per burst). */
  private unheardFor: number | null = null;
  /** D5: the latest audio time (client clock) Voice Live opened an item at. */
  private serverStartAudioAt = -Infinity;

  /** D5: tell the engine a voiced burst reached no words (an empty final over it), once per burst. */
  private unheard(reason: string): void {
    const pk = this.host.peek();
    if (pk.firstOnsetAt === null || pk.voicing || this.unheardFor === pk.lastOffsetAt) return;
    this.unheardFor = pk.lastOffsetAt;
    const t = this.now();
    const ev: SttEvent = { type: "final", itemId: `d5-unheard-${++this.unheardSeq}`, text: "", t, audioStartMs: pk.firstOnsetAt, audioEndMs: pk.lastOffsetAt ?? t };
    vt("d5.decision", { op: "unheard_burst", reason, burstMs: pk.lastOffsetAt !== null ? Math.round(pk.lastOffsetAt - pk.firstOnsetAt) : null });
    this.guard(() => this.host.stt(ev));
  }

  /**
   * D5 (no probes: a forced commit cuts Voice Live's open item and returns it EMPTY, bake-off f1-tail-0057): a voiced burst
   * the device heard while she was silent, for which Voice Live opened no item by D5_UNHEARD_AFTER_MS after it ended, never
   * will be transcribed (its VAD missed it). The engine hears that as an empty final.
   */
  private checkUnheard(): void {
    const pk = this.host.peek();
    if (pk.firstOnsetAt === null || pk.voicing || pk.lastOffsetAt === null) return;
    if (this.now() - pk.lastOffsetAt < D5_UNHEARD_AFTER_MS || this.unheardFor === pk.lastOffsetAt) return;
    if (this.serverStartAudioAt >= pk.firstOnsetAt - D5_VAD_START_PAD_MS - 300) return; // Voice Live has (or had) an item for it
    this.unheard("no_voicelive_item");
  }

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
    this.herHalted = false;
    this.screenTurnAt = null; // her reply to the tapped answer started: that turn is answered
    this.pendingTurn = null;
    this.screenHoldUntil = -Infinity;
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
    this.herTailUntil = this.now() + (this.o.halfDuplex ? HALF_DUPLEX_TAIL_MS : D5_HER_TAIL_MS);
    this.guard(() => this.host.herEvent({ kind: "end", t: this.now(), utteranceId: id }));
  }

  /** Her line stopped before its end (a yield executed, or the link stopped it). */
  herStopped(): void {
    if (!this.live || !this.her) return;
    const id = this.her.id;
    this.herHalted = true;
    this.herTailUntil = this.now() + (this.o.halfDuplex ? HALF_DUPLEX_TAIL_MS : D5_HER_TAIL_MS);
    this.guard(() => this.host.herEvent({ kind: "stopped", t: this.now(), utteranceId: id }));
  }

  /**
   * Round 5: why a commit must wait now, or null. "turn_in_flight": the engine committed a turn and her reply to it has not
   * started; "tap_in_flight": a tapped / typed answer went to the Director and her reply has not started; "tap_recent":
   * within TAP_GUARD_MS of a tap or typed answer.
   */
  private turnHeld(t: number): string | null {
    // a reply that never comes (a network error, a dropped reply) must not freeze the floor: the hold expires
    if (this.pendingTurn !== null && this.pendingAt !== null && t - this.pendingAt < IN_FLIGHT_MAX_MS) return "turn_in_flight";
    if (this.screenTurnAt !== null) {
      if (t - this.screenTurnAt < TAP_GUARD_MS) return "tap_recent";
      if (t - this.screenTurnAt < IN_FLIGHT_MAX_MS) return "tap_in_flight";
    }
    return null;
  }
  private pendingAt: number | null = null;
  /** Round 5: a tapped / typed answer is in flight since (cleared when her next line starts). */
  private screenTurnAt: number | null = null;

  /** The child typed or tapped (a screen act): the engine's screen stream. */
  screen(kind: "submit" | "choice_pick" | "type"): void {
    if (!this.live) return;
    // a submitted answer (a chip, a typed line) is a TURN the runtime posts itself: the engine must not post another over it
    if (kind === "submit" || kind === "choice_pick") this.screenTurnAt = this.now();
    // a sent answer (not keystrokes): her reply to it is on its way, so the engine's silence backstop must not commit a
    // second turn over it (release 14)
    if (kind !== "type") this.screenHoldUntil = this.now() + SCREEN_REPLY_HOLD_MS;
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
    traceDuplex(c, this.mode);
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
    if (c.to === "stt") {
      // round 5 half-duplex: commit only what the transcriber is actually holding (no input_audio_buffer_commit_empty)
      // ...or what the device heard the child say since the gate opened that no commit has taken yet (a lone "haan" the
      // server VAD never opened an item for: the transcriber still holds that audio, so this commit is never empty)
      const pk = this.host.peek();
      const heldAudio = pk.lastOffsetAt !== null && pk.firstOnsetAt !== null && pk.firstOnsetAt >= this.halfOpenedAt && pk.lastOffsetAt > this.lastServerCommitAt;
      if (this.o.halfDuplex && this.openItem === null && !heldAudio) { this.stats.probesSkipped = (this.stats.probesSkipped ?? 0) + 1; return; }
      port.sttCommit();
      return;
    }
    if (c.to === "think") {
      // round 3: the eager end of turn (the floor decision never waits on it)
      if (c.op === "prepare" && (c.hint.eager === "start" || c.hint.eager === "cancel")) {
        if (c.hint.eager === "start") this.stats.eagerStarts = (this.stats.eagerStarts ?? 0) + 1;
        else this.stats.eagerCancels = (this.stats.eagerCancels ?? 0) + 1;
        try { port.eager?.({ op: c.hint.eager, text: String(c.text ?? "").trim(), textHash: c.hint.textHash, t: c.t }); } catch { /* never breaks the floor */ }
        return;
      }
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
    // release 14 half-duplex (D4): she is never ducked or yielded over her own line; the child talks once she is done
    if (this.o.halfDuplex && ((c.op === "duck" && c.level < 1) || c.op === "yield") && this.herActive(this.now())) {
      this.half.blockedOps++;
      vt("duplex.half", { op: "blocked", what: c.op });
      return;
    }
    // release 14 (D5 review, confirmed: a cough, the TV or her echo tail became an empty child turn and the Director taught
    // the next step over it): on half-duplex D4 an engine SPEAK with no words is never a turn. Silence belongs to the
    // floor's own re-ask timers; a mumble the ear could not read is re-asked by them too
    if (this.o.halfDuplex && c.op === "speak" && !String(c.text ?? "").trim()) {
      this.half.droppedEmpty++;
      vt("duplex.half", { op: "drop_empty_speak", reason: c.reason ?? null });
      return;
    }
    // release 14: a tapped / typed answer is waiting for her reply: no engine turn races it
    // (round 5: the safety floor is never held)
    if (c.op === "speak" && c.reason !== "safeguard" && this.now() < this.screenHoldUntil) {
      this.half.heldSpeaks++;
      vt("duplex.half", { op: "held_speak", reason: c.reason ?? null });
      return;
    }
    switch (c.op) {
      case "duck": this.hostDuck = c.level; this.preDuckAt = null; port.duck(c.level); return;
      case "unduck": this.hostDuck = 1; this.preDuckAt = null; port.duck(1); return;
      case "speak":
      case "cut_in": {
        // a nudge after her question with nothing said: the floor's own re-ask timers own silence; never a fake child turn
        if (c.op === "speak" && c.reason === "wt1_nudge") return;
        // round 5 (the owner's lesson 56d898ce): ONE TURN AT A TIME. The silence backstop fired while the child's tapped answer
        // was still in flight, and a second turn raced the first and cut her reply off. While a turn is in flight (an engine
        // commit or a tap / typed answer her reply has not started for) and for TAP_GUARD_MS after a tap, the engine's
        // turn never goes out; the child's words stay in the engine (a revoke still merges them). The safety floor is never held.
        // round 5 half-duplex: an empty turn is never the child's (the owner's empty finals became turns)
        if (this.o.halfDuplex && !String(c.text ?? "").trim() && !(c.op === "speak" && c.reason === "safeguard")) {
          vt("duplex.decision", { action: "SPEAK_HELD", reasons: ["empty_turn_half_duplex", `speak:${c.reason}`], phase: this.phase, mode: this.mode, acted: false });
          return;
        }
        const held = this.turnHeld(c.t);
        if (held && !(c.op === "speak" && c.reason === "safeguard") && !(c.op === "cut_in" && c.reason === "safety")) {
          this.stats.held = (this.stats.held ?? 0) + 1;
          vt("duplex.decision", { action: "SPEAK_HELD", reasons: [held, `speak:${c.reason}`], phase: this.phase, mode: this.mode, acted: false });
          return;
        }
        const pk = this.host.peek();
        const s = pk.safety;
        const turnId = ++this.turnSeq;
        // the decision gap: the child's last voiced frame → this decision (a SPEAK while they still voice has gap 0)
        const lastVoice = pk.voicing ? c.t : pk.lastOffsetAt;
        if (lastVoice !== null) this.stats.gaps.push(Math.max(0, Math.round(c.t - lastVoice)));
        this.stats.commits++;
        this.pendingTurn = turnId;
        this.pendingAt = c.t;
        const text = String(c.text ?? "").trim();
        const revokeOf = this.revoked;
        this.revoked = null;
        this.lastCommit = { turnId, text };
        if (!text && this.o.vadGate === "server") {
          // the child spoke and the ear returned no words (a lone 250 ms "haan" Voice Live did not hear, BAKEOFF §2.6): the
          // empty turn is the Director's repair move — she asks again; never treated as silence
          this.d5.reasks++;
          vt("d5.decision", { op: "reask", reason: "speech_without_words", turnId });
        }
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

/** r12 flight recorder: what the engine decided (also in shadow, where nothing acts), as voice events. Never throws. */
const TRACE_ACTIONS = new Set(["YIELD", "HUSH", "SPEAK", "CUT_IN"]);
function traceDuplex(c: HostCommand, mode: string): void {
  try {
    const acted = mode !== "shadow";
    if (c.to === "log") {
      const r = c.row as { action?: string; reasons?: string[]; phase?: string; detail?: unknown; t?: number };
      // ...and the continuer call (she keeps talking / resumes: the decision a "haan" over her line gets)
      if (r.action && (TRACE_ACTIONS.has(r.action) || (r.action === "KEEP_TALKING" && String(r.detail ?? "") === "keep:continuer"))) vt("duplex.decision", { action: r.action, reasons: r.reasons ?? [], phase: r.phase ?? null, detail: r.detail ?? null, mode, acted });
    } else if (c.to === "think" && c.op === "revoke") vt("bargein", { step: "engine_revoke", mode, acted });
    else if (c.to === "voice") {
      if (c.op === "yield") vt("bargein", { step: "engine_yield", reason: c.reason ?? null, resumable: !!c.resumable, mode, acted });
      else if (c.op === "resume") vt("bargein", { step: "engine_resume", mode, acted });
      else if (c.op === "duck" && c.level <= 0.06) vt("bargein", { step: "engine_hush", level: c.level, mode, acted });
      // D5 (2026-10-11): every gain change is auditable — the reflex duck at a burst's onset and its release
      else if (c.op === "duck") vt("bargein", { step: "engine_duck", level: c.level, reason: "onset_over_her", mode, acted });
      else if (c.op === "unduck") vt("bargein", { step: "engine_unduck", reason: "burst_released_or_continuer", mode, acted });
      else if (c.op === "speak" || c.op === "cut_in") vt("duplex.commit", { op: c.op, reason: c.reason ?? null, mode, acted });
    }
  } catch {
    /* the recorder never touches the floor */
  }
}
