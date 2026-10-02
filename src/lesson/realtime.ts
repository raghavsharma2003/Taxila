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

// Error codes that are expected side effects of racing the server (cancelling a response that just
// finished, deleting an item it already dropped, committing an empty push-to-talk buffer).
const BENIGN_ERRORS = new Set([
  "response_cancel_not_active",
  "item_not_found",
  "conversation_item_not_found",
  "input_audio_buffer_commit_empty",
]);

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The turn_detection the session was minted with, so push-to-talk can restore it. */
export function turnDetectionFrom(session: unknown): Record<string, unknown> {
  const td = obj(obj(obj(session).audio).input).turn_detection;
  return td && typeof td === "object" ? (td as Json) : DEFAULT_TURN_DETECTION;
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
}

export class RealtimeProtocol {
  /** Teacher audio is playing on the client (output_audio_buffer.started → stopped/cleared). */
  teacherAudio = false;
  private ledger = new ConversationLedger();
  private speechStarts = new Map<string, number>(); // input item id → onset time
  private childText = new Map<string, string>(); // input item id → streaming transcript
  private responses = new Map<string, ResponseRecord>();
  private activeResponse: string | null = null;
  private lastResponse: string | null = null;
  private interrupted = new Set<string>();
  private talkStartedAt: number | null = null;
  private readonly send: (event: Json) => void;
  private readonly emit: (event: LinkEvent) => void;
  private readonly keep: number;
  private readonly now: () => number;

  constructor(opts: RealtimeProtocolOptions) {
    this.send = opts.send;
    this.emit = opts.emit;
    this.keep = opts.keepMessages ?? KEEP_MESSAGES;
    this.now = opts.now ?? Date.now;
  }

  get responding(): boolean {
    return this.activeResponse !== null;
  }

  // ───────────── client → server ─────────────

  applyInstructions(instructions: string): void {
    this.send({ type: "session.update", session: { type: "realtime", instructions } });
  }

  /** null disables server VAD (push-to-talk). */
  setTurnDetection(td: Record<string, unknown> | null): void {
    this.send({ type: "session.update", session: { type: "realtime", audio: { input: { turn_detection: td } } } });
  }

  requestResponse(): void {
    this.send({ type: "response.create" });
  }

  /** A typed/tapped child turn: cut the teacher off if needed, add the text, ask for a reply. */
  sendUserText(text: string): void {
    this.interrupt();
    this.send({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } });
    this.send({ type: "response.create" });
  }

  /** Push-to-talk press: drop audio buffered while the button was up, remember when the turn began. */
  beginTalk(): void {
    this.interrupt();
    this.talkStartedAt = this.now();
    this.send({ type: "input_audio_buffer.clear" });
  }

  /** Push-to-talk release. */
  endTalk(): void {
    this.send({ type: "input_audio_buffer.commit" });
    this.send({ type: "response.create" });
  }

  /** Stop the teacher: cancel generation and flush audio already queued for playback (WebRTC only). */
  interrupt(): void {
    const id = this.activeResponse ?? this.lastResponse;
    if (this.activeResponse) this.send({ type: "response.cancel" });
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
        if (code && BENIGN_ERRORS.has(code)) return;
        this.emit({ type: "error", message: str(err.message) || "realtime error", code, fatal: false });
        return;
      }
      default:
        return; // session.*, rate_limits.updated, response.output_item.*, *.delta for audio bytes, ...
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
      const why = str(obj(obj(response.status_details).error).message);
      this.emit({ type: "error", message: why || "the teacher could not answer", fatal: false });
    }
    this.responses.delete(id);
    this.interrupted.delete(id);
    if (this.activeResponse === id) this.activeResponse = null;
    this.emit({ type: "response_done", responseId: id, status });
    this.prune();
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
