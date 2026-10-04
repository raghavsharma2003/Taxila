// Pure protocol layer for the Azure/OpenAI realtime GA session (WebRTC data channel "oai-events").
// It maps server events → LinkEvents, builds client events, and prunes conversation context. No DOM, no
// transport: VoiceLink owns the peer connection and feeds this class raw events, which keeps the
// protocol testable in Node (tests/client-runtime.test.mjs).
import type { LinkEvent, ResponseStatus } from "./link.ts";
import { ConversationLedger } from "./ledger.ts";

/** context/decisions.md#voice-turn-config — used when the token's session does not carry its own. */
export const DEFAULT_TURN_DETECTION: Record<string, unknown> = {
  type: "server_vad",
  threshold: 0.6,
  prefix_padding_ms: 300,
  silence_duration_ms: 900,
  create_response: true,
  interrupt_response: true,
};

/** Messages kept in the realtime context after each response (≈3 exchanges). */
export const KEEP_MESSAGES = 6;

/**
 * A response.create held back while a cancelled response finishes is sent when its response.done arrives,
 * or after this long if it never does (a lost event must not leave the teacher silent).
 */
export const CREATE_AFTER_CANCEL_MS = 1_500;
/** Resends of a response.create the server refused because a response was still active. */
const CREATE_RETRIES = 3;

// Error codes that are expected side effects of racing the server (cancelling a response that just
// finished, deleting an item it already dropped, committing an empty push-to-talk buffer).
const BENIGN_ERRORS = new Set([
  "response_cancel_not_active",
  "item_not_found",
  "conversation_item_not_found",
  "input_audio_buffer_commit_empty",
]);

/**
 * A realtime refusal for quota (BUILD-PLAN W2-D #1): the lesson moves to the cascade lane instead of leaving the child
 * with a teacher who stops answering. Azure answers a rate-limited response as response.done status "failed" with
 * status_details.error.code "inference_rate_limit_exceeded" (RELATIONAL-OS P2: 66/168 at 3-wide), or as an `error`
 * event with a rate_limit code. Twin of server/voice/realtimeSession.js isQuotaError.
 */
export function isRateLimit(err: unknown): boolean {
  const e = err && typeof err === "object" ? (err as Record<string, unknown>) : {};
  const text = `${typeof e.code === "string" ? e.code : ""} ${typeof e.type === "string" ? e.type : ""} ${typeof e.message === "string" ? e.message : ""}`;
  return /rate[_ ]?limit|too many (requests|tokens)|quota/i.test(text);
}

/** The link error code the runtime reads as "move this lesson to the cascade lane". */
export const RATE_LIMITED = "rate_limited";

/** Server VAD end-of-turn silence bounds for the pace knob (twin of server/voice/realtimeSession.js). */
export const ENDPOINT_MIN_MS = 600;
export const ENDPOINT_MAX_MS = 1200;

/** TurnResponse.pace → server VAD silence (ms), clamped to 600-1200; null when the knob is missing. */
export function endpointSilenceOf(pace: { endpointSilenceMs?: number } | null | undefined): number | null {
  const ms = Number(pace?.endpointSilenceMs);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.round(Math.min(ENDPOINT_MAX_MS, Math.max(ENDPOINT_MIN_MS, ms)));
}

/** The minted turn detection with the pace knob's silence (server VAD only; anything else is returned as is). */
export function withEndpointSilence(td: Record<string, unknown>, silenceMs: number | null): Record<string, unknown> {
  if (silenceMs === null || td.type !== "server_vad") return td;
  return { ...td, silence_duration_ms: silenceMs };
}

/** One `rate_limits.updated` entry (logged; the soak and the console read them). */
export interface RateLimit { name: string; limit?: number; remaining?: number; resetSeconds?: number }

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The turn_detection the session was minted with, so push-to-talk can restore it. */
export function turnDetectionFrom(session: unknown): Record<string, unknown> {
  const td = obj(obj(obj(session).audio).input).turn_detection;
  return td && typeof td === "object" ? (td as Json) : DEFAULT_TURN_DETECTION;
}

/**
 * The whole audio.input the session was minted with (transcription, noise reduction, turn detection).
 * A push-to-talk toggle re-sends all of it with only turn_detection swapped: if the server replaces
 * audio.input rather than merging it, a partial update would silently drop transcription — and with it
 * every child transcript and Director turn.
 */
export function audioInputFrom(session: unknown): Record<string, unknown> {
  return { ...obj(obj(obj(session).audio).input) };
}

/** Mean per-token probability from transcription logprobs (present only if the session asked for them). */
export function confidenceFromLogprobs(logprobs: unknown): number | undefined {
  if (!Array.isArray(logprobs) || !logprobs.length) return undefined;
  const lps = logprobs.map((l) => obj(l).logprob).filter((v): v is number => typeof v === "number");
  if (!lps.length) return undefined;
  return Math.exp(lps.reduce((a, b) => a + b, 0) / lps.length);
}

/** Text of a response.done payload (audio transcripts, or text parts in text modality). */
export function transcriptOf(response: unknown): string {
  const out = obj(response).output;
  if (!Array.isArray(out)) return "";
  return out
    .flatMap((o) => (Array.isArray(obj(o).content) ? (obj(o).content as unknown[]) : []))
    .map((c) => str(obj(c).transcript) || str(obj(c).text))
    .filter(Boolean)
    .join(" ")
    .trim();
}

interface ResponseRecord {
  deltas: string;
  parts: string[]; // finished transcript parts (one per audio content part)
}

export interface RealtimeProtocolOptions {
  send: (event: Json) => void;
  emit: (event: LinkEvent) => void;
  keepMessages?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export class RealtimeProtocol {
  /** Teacher audio is playing on the client (output_audio_buffer.started → stopped/cleared). */
  teacherAudio = false;
  /** The newest `rate_limits.updated` (requests / tokens remaining), for the console and the soak. */
  rateLimits: RateLimit[] = [];
  /** Responses the server refused for quota in this session. */
  rateLimited = 0;
  private ledger = new ConversationLedger();
  private speechStarts = new Map<string, number>(); // input item id → onset time
  private childText = new Map<string, string>(); // input item id → streaming transcript
  private responses = new Map<string, ResponseRecord>();
  private activeResponse: string | null = null;
  private lastResponse: string | null = null;
  private interrupted = new Set<string>();
  private talkStartedAt: number | null = null;
  /** A push-to-talk commit was sent and its reply is requested only once the server confirms it. */
  private pttCommitPending = false;
  /**
   * The response we sent response.cancel for, until its response.done. A response.create sent before then
   * is refused (conversation_already_has_active_response) — on the safeguard path that would be a
   * hand-off never spoken — so it waits in `pendingCreate`.
   */
  private cancelling: string | null = null;
  private pendingCreate = false;
  private createTimer: unknown = null;
  private createRetries = 0;
  private readonly send: (event: Json) => void;
  private readonly emit: (event: LinkEvent) => void;
  private readonly keep: number;
  private readonly now: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (handle: unknown) => void;

  constructor(opts: RealtimeProtocolOptions) {
    this.send = opts.send;
    this.emit = opts.emit;
    this.keep = opts.keepMessages ?? KEEP_MESSAGES;
    this.now = opts.now ?? Date.now;
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  }

  get responding(): boolean {
    return this.activeResponse !== null;
  }

  // ───────────── client → server ─────────────

  applyInstructions(instructions: string): void {
    this.send({ type: "session.update", session: { type: "realtime", instructions } });
  }

  /** null disables server VAD (push-to-talk). `input` is the rest of audio.input (see audioInputFrom). */
  setTurnDetection(td: Record<string, unknown> | null, input: Record<string, unknown> = {}): void {
    if (td) this.pttCommitPending = false; // server VAD commits (and answers) on its own from here
    this.send({ type: "session.update", session: { type: "realtime", audio: { input: { ...input, turn_detection: td } } } });
  }

  /** Ask for a teacher turn; held until a response being cancelled has finished. */
  requestResponse(): void {
    this.createRetries = 0;
    if (this.cancelling) this.holdCreate();
    else this.send({ type: "response.create" });
  }

  /** A typed/tapped child turn: cut the teacher off if needed, add the text, ask for a reply. */
  sendUserText(text: string): void {
    this.interrupt();
    this.send({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } });
    this.requestResponse();
  }

  /** Push-to-talk press: drop audio buffered while the button was up, remember when the turn began. */
  beginTalk(): void {
    this.interrupt();
    this.talkStartedAt = this.now();
    this.send({ type: "input_audio_buffer.clear" });
  }

  /**
   * Push-to-talk release: commit, and ask for a reply only when the server confirms the commit. An
   * accidental tap (likely for a 6-year-old) commits an empty buffer, gets no reply, and is reported as
   * child_silent so nobody waits for one.
   */
  endTalk(): void {
    this.pttCommitPending = true;
    this.send({ type: "input_audio_buffer.commit" });
  }

  /** Stop the teacher: cancel generation and flush audio already queued for playback (WebRTC only). */
  interrupt(): void {
    const id = this.activeResponse ?? this.lastResponse;
    if (this.activeResponse) {
      this.send({ type: "response.cancel" });
      this.cancelling = this.activeResponse;
    }
    if (this.teacherAudio) this.send({ type: "output_audio_buffer.clear" });
    if (id && (this.activeResponse || this.teacherAudio)) this.markInterrupted(id);
  }

  /** Forget all session state (a reconnect opens a fresh realtime session with an empty conversation). */
  reset(): void {
    if (this.teacherAudio) this.emit({ type: "teacher_audio_end" });
    this.teacherAudio = false;
    this.ledger.clear();
    this.speechStarts.clear();
    this.childText.clear();
    this.responses.clear();
    this.interrupted.clear();
    this.activeResponse = null;
    this.lastResponse = null;
    this.talkStartedAt = null;
    this.pttCommitPending = false;
    this.cancelling = null;
    this.pendingCreate = false;
    this.createRetries = 0;
    this.clearCreateTimer();
  }

  // ───────────── server → client ─────────────

  handle(raw: unknown): void {
    const e = obj(raw);
    const type = str(e.type);
    switch (type) {
      case "input_audio_buffer.speech_started": {
        const at = this.now();
        const itemId = str(e.item_id) || undefined;
        if (itemId) this.speechStarts.set(itemId, at);
        this.emit({ type: "child_speech_start", at, itemId });
        // Server VAD cancels the response itself (interrupt_response: true); we only record the cut.
        const id = this.activeResponse ?? this.lastResponse;
        if (id && this.teacherAudio) this.markInterrupted(id);
        return;
      }
      case "input_audio_buffer.speech_stopped":
        this.emit({ type: "child_speech_end", at: this.now() });
        return;
      case "input_audio_buffer.committed": {
        // Push-to-talk turns have no speech_started; date them from the button press.
        const itemId = str(e.item_id);
        if (itemId && !this.speechStarts.has(itemId)) this.speechStarts.set(itemId, this.talkStartedAt ?? this.now());
        this.talkStartedAt = null;
        if (this.pttCommitPending) {
          this.pttCommitPending = false;
          this.requestResponse();
        }
        return;
      }
      case "conversation.item.added":
      case "conversation.item.created": {
        const item = obj(e.item);
        const id = str(item.id);
        if (!id) return;
        const prev = e.previous_item_id === null ? null : str(e.previous_item_id) || undefined;
        this.ledger.add({ id, type: str(item.type) || "message", role: str(item.role) || undefined }, prev);
        return;
      }
      case "conversation.item.deleted":
        this.ledger.remove(str(e.item_id));
        return;
      case "conversation.item.input_audio_transcription.delta": {
        const itemId = str(e.item_id);
        const text = (this.childText.get(itemId) ?? "") + str(e.delta);
        this.childText.set(itemId, text);
        this.emit({ type: "child_partial", itemId, text });
        return;
      }
      case "conversation.item.input_audio_transcription.completed":
        this.finishChild(str(e.item_id), str(e.transcript).trim(), confidenceFromLogprobs(e.logprobs));
        return;
      case "conversation.item.input_audio_transcription.failed":
        this.finishChild(str(e.item_id), "", 0);
        return;
      case "response.created": {
        const id = str(obj(e.response).id);
        if (!id) return;
        this.activeResponse = id;
        this.lastResponse = id;
        this.responses.set(id, { deltas: "", parts: [] });
        this.emit({ type: "response_start", responseId: id, at: this.now() });
        return;
      }
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta":
      case "response.output_text.delta": {
        const id = str(e.response_id);
        const r = this.responses.get(id);
        const delta = str(e.delta);
        if (!r || !delta) return;
        r.deltas += delta;
        this.emit({ type: "teacher_delta", responseId: id, delta });
        return;
      }
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done":
      case "response.output_text.done": {
        const r = this.responses.get(str(e.response_id));
        const text = str(e.transcript) || str(e.text);
        if (r && text) r.parts.push(text.trim());
        return;
      }
      case "output_audio_buffer.started":
        if (!this.teacherAudio) {
          this.teacherAudio = true;
          this.emit({ type: "teacher_audio_start" });
        }
        return;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        if (this.teacherAudio) {
          this.teacherAudio = false;
          this.emit({ type: "teacher_audio_end" });
        }
        return;
      case "response.done":
        this.finishResponse(obj(e.response));
        return;
      case "error": {
        const err = obj(e.error);
        const code = str(err.code) || undefined;
        if (code === "input_audio_buffer_commit_empty" && this.pttCommitPending) {
          this.pttCommitPending = false;
          this.emit({ type: "child_silent" });
          return;
        }
        if (code === "conversation_already_has_active_response" && this.createRetries < CREATE_RETRIES) {
          // Our response.create raced a response the server still holds (one being cancelled, or one
          // server VAD started that we have not heard about yet): ask again once it is done.
          this.createRetries++;
          this.holdCreate();
          return;
        }
        if (code && BENIGN_ERRORS.has(code)) return;
        if (isRateLimit(err)) {
          this.rateLimited++;
          this.emit({ type: "error", message: "the realtime lane is full", code: RATE_LIMITED, fatal: false });
          return;
        }
        this.emit({ type: "error", message: str(err.message) || "realtime error", code, fatal: false });
        return;
      }
      case "rate_limits.updated": {
        const list = Array.isArray(e.rate_limits) ? (e.rate_limits as unknown[]) : [];
        this.rateLimits = list.map((r) => {
          const o = obj(r);
          const num = (v: unknown) => (typeof v === "number" ? v : undefined);
          return { name: str(o.name), limit: num(o.limit), remaining: num(o.remaining), resetSeconds: num(o.reset_seconds) };
        });
        const low = this.rateLimits.find((r) => r.limit && r.remaining !== undefined && r.remaining / r.limit < 0.1);
        if (low) console.info(`realtime: ${low.name} ${low.remaining}/${low.limit} left (resets in ${low.resetSeconds ?? "?"} s)`);
        return;
      }
      default:
        return; // session.*, response.output_item.*, *.delta for audio bytes, ...
    }
  }

  private finishChild(itemId: string, text: string, asrConfidence: number | undefined): void {
    const startedAt = this.speechStarts.get(itemId) ?? this.now();
    this.speechStarts.delete(itemId);
    this.childText.delete(itemId);
    this.emit({ type: "child_final", text, startedAt, typed: false, itemId: itemId || undefined, asrConfidence });
  }

  private finishResponse(response: Json): void {
    const id = str(response.id);
    const r = this.responses.get(id);
    const text = r?.parts.length ? r.parts.join(" ") : transcriptOf(response) || (r?.deltas ?? "").trim();
    if (text) this.emit({ type: "teacher_done", responseId: id, text });
    const status = (["completed", "cancelled", "failed", "incomplete"].includes(str(response.status))
      ? str(response.status)
      : "completed") as ResponseStatus;
    if (status === "failed") {
      const err = obj(obj(response.status_details).error);
      if (isRateLimit(err)) {
        this.rateLimited++;
        this.emit({ type: "error", message: "the realtime lane is full", code: RATE_LIMITED, fatal: false });
      } else {
        this.emit({ type: "error", message: str(err.message) || "the teacher could not answer", fatal: false });
      }
    }
    this.responses.delete(id);
    this.interrupted.delete(id);
    if (this.activeResponse === id) this.activeResponse = null;
    if (this.cancelling === id) this.cancelling = null;
    this.emit({ type: "response_done", responseId: id, status });
    this.prune();
    if (this.pendingCreate && !this.cancelling) this.flushCreate();
  }

  /** Send the held response.create on the next response.done, or after CREATE_AFTER_CANCEL_MS. */
  private holdCreate(): void {
    this.pendingCreate = true;
    this.clearCreateTimer();
    this.createTimer = this.setTimer(() => {
      this.createTimer = null;
      this.cancelling = null; // its response.done never came; the server has long finished the cancel
      if (this.pendingCreate) this.flushCreate();
    }, CREATE_AFTER_CANCEL_MS);
  }

  private flushCreate(): void {
    this.pendingCreate = false;
    this.clearCreateTimer();
    this.send({ type: "response.create" });
  }

  private clearCreateTimer(): void {
    if (this.createTimer !== null) this.clearTimer(this.createTimer);
    this.createTimer = null;
  }

  private markInterrupted(id: string): void {
    if (this.interrupted.has(id)) return;
    this.interrupted.add(id);
    this.emit({ type: "teacher_interrupted", responseId: id });
  }

  /** Delete every message but the newest `keep` (runs after each response.done). */
  private prune(): void {
    for (const id of this.ledger.excess(this.keep)) {
      this.send({ type: "conversation.item.delete", item_id: id });
      this.ledger.remove(id);
    }
  }
}
