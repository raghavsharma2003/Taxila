// The TeacherLink seam: how the lesson runtime talks to "the teacher's mouth and ears".
// VoiceLink (WebRTC realtime) and TextLink (typed turns + TTS) implement the same interface, so the
// runtime, the status machine and the UI never branch on transport except where the product differs
// (in text mode the Director writes the reply; in voice mode the realtime model does).
import type { UiDirectives } from "../../shared/contracts.ts";
import type { LevelMeter } from "./level.ts";

export type LessonMode = "voice" | "text";
export type TeacherStatus = NonNullable<UiDirectives["status"]>;
/**
 * "stalled": the transport says it is down (ICE "disconnected") but the call has not been rebuilt; it often heals by itself,
 * so nothing the link holds is discarded. "reconnecting": the call is being rebuilt with a fresh session (its
 * conversation is gone).
 */
export type LinkConnection = "idle" | "connecting" | "connected" | "stalled" | "reconnecting" | "closed" | "failed";
export type ResponseStatus = "completed" | "cancelled" | "failed" | "incomplete";

/** Everything a link reports. Times are epoch ms on the client clock. */
export type LinkEvent =
  | { type: "connection"; state: LinkConnection }
  /** Child started talking (VAD onset or push-to-talk press). */
  | { type: "child_speech_start"; at: number; itemId?: string }
  /** Child stopped talking (VAD end or push-to-talk release). */
  | { type: "child_speech_end"; at: number }
  /** A push-to-talk press carried no audio (an accidental tap): no reply is coming. */
  | { type: "child_silent" }
  /** Streaming ASR text for a child utterance (captions only, never evidence). */
  | { type: "child_partial"; itemId: string; text: string }
  /** A finished child turn. text "" + asrConfidence 0 means "the child spoke but ASR failed". */
  | { type: "child_final"; text: string; startedAt: number; typed: boolean; itemId?: string; asrConfidence?: number; chipId?: string; duplex?: import("../../shared/contracts.ts").TurnRequest["duplex"];
    /** ship5 fixer (B3): the duplex engine merged this turn with a revoked commit whose words were `text` */
    revokeOf?: { turnId: number; text: string } }
  | { type: "response_start"; responseId: string; at: number }
  | { type: "teacher_delta"; responseId: string; delta: string }
  /** Authoritative text of one teacher turn (emitted once per response, possibly partial if cut off). */
  | { type: "teacher_done"; responseId: string; text: string }
  | { type: "teacher_audio_start" }
  | { type: "teacher_audio_end" }
  /** The child cut the teacher off (barge-in, push-to-talk press, or typing over her). */
  | { type: "teacher_interrupted"; responseId?: string }
  | { type: "response_done"; responseId: string; status: ResponseStatus }
  | { type: "error"; message: string; fatal: boolean; code?: string }
  /** The realtime model's reply was blocked by the content filter (response.done "incomplete", reason content_filter).
   *  count 1: the protocol asked for ONE fresh reply; count 2: that fresh reply was blocked too (the runtime fails closed). */
  | { type: "reply_filtered"; responseId: string; count: 1 | 2 };

export interface LinkLevels {
  /** The child's microphone (voice mode only; stays 0 in text mode). */
  mic: LevelMeter;
  /** The teacher's audio output, for lip-sync. */
  teacher: LevelMeter;
}

/**
 * A voice link's microphone, for on-device voice features (src/voice/features.ts): the same MediaStream and
 * AudioContext the link already captured, so no second getUserMedia or context. Audio stays on the device.
 * teacherEnd says where the link's teacher_audio_end comes from: "local" = this device's playback ended
 * (cascade lane), "remote" = the server's buffer stopped (realtime lane; re-timed from the teacher meter).
 */
export interface MicTap {
  stream: MediaStream;
  ctx: AudioContext;
  teacherEnd: "local" | "remote";
}

/** A Director-written teacher line (text lane): its words, and the stored turn /api/tts may speak. */
export interface TeacherReply {
  text: string;
  seq?: number;
}

export interface TeacherLink {
  readonly mode: LessonMode;
  readonly levels: LinkLevels;
  on(fn: (e: LinkEvent) => void): () => void;
  /** Resolves when the link can carry a turn (voice: data channel open). */
  connect(): Promise<void>;
  /** Apply the Director's compiled instructions verbatim (the client never composes instructions). */
  applyInstructions(instructions: string): void;
  /** A typed or tapped child turn. Emits child_final; in voice mode the realtime teacher also answers it. */
  sendChild(text: string, opts?: { chipId?: string }): void;
  /**
   * Give the teacher the floor. Voice: response.create from the current instructions (reply is ignored,
   * the voice model writes its own words). Text: show reply and speak it (only a stored turn is spoken).
   */
  promptTeacher(reply?: TeacherReply): void;
  /** Stop the teacher mid-turn. */
  interrupt(): void;
  /** Push-to-talk (voice only; no-ops in text mode). */
  setPushToTalk(on: boolean): void;
  talkStart(): void;
  talkEnd(): void;
  close(): void;
  /** Voice links once connected: the mic for on-device voice features (null before connect / after close). */
  micTap?(): MicTap | null;
  /**
   * Realtime lane (W2-D #2): the Director's pace knob (TurnResponse.pace) → server VAD end-of-turn silence, clamped to
   * 900-1200 ms (the knob only adds time on top of the minted base). Absent on text lanes (the cascade's endpointing is the client VAD's).
   */
  setPace?(pace: { waitNudgeSec: number; endpointSilenceMs: number }): void;
  /**
   * Realtime lane A (W2-D #3, HUMAN-VOICE B6): the delivery note for the next reply, inserted just before the last line
   * (the compiler's turn-shape rule) of the instructions
   * the link applies (null clears it). `apply` re-sends the current instructions with it now; false waits for the next
   * applyInstructions (so a turn that also carries instructions sends one session.update, not two).
   */
  setDelivery?(line: string | null, apply: boolean): void;
}
