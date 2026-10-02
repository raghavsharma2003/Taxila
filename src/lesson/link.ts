// The TeacherLink seam: how the lesson runtime talks to "the teacher's mouth and ears".
// VoiceLink (WebRTC realtime) and TextLink (typed turns + TTS) implement the same interface, so the
// runtime, the status machine and the UI never branch on transport except where the product differs
// (in text mode the Director writes the reply; in voice mode the realtime model does).
import type { UiDirectives } from "../../shared/contracts.ts";
import type { LevelMeter } from "./level.ts";

export type LessonMode = "voice" | "text";
export type TeacherStatus = NonNullable<UiDirectives["status"]>;
export type LinkConnection = "idle" | "connecting" | "connected" | "reconnecting" | "closed" | "failed";
export type ResponseStatus = "completed" | "cancelled" | "failed" | "incomplete";

/** Everything a link reports. Times are epoch ms on the client clock. */
export type LinkEvent =
  | { type: "connection"; state: LinkConnection }
  /** Child started talking (VAD onset or push-to-talk press). */
  | { type: "child_speech_start"; at: number; itemId?: string }
  /** Child stopped talking (VAD end or push-to-talk release). */
  | { type: "child_speech_end"; at: number }
  /** Streaming ASR text for a child utterance (captions only, never evidence). */
  | { type: "child_partial"; itemId: string; text: string }
  /** A finished child turn. text "" + asrConfidence 0 means "the child spoke but ASR failed". */
  | { type: "child_final"; text: string; startedAt: number; typed: boolean; itemId?: string; asrConfidence?: number; chipId?: string }
  | { type: "response_start"; responseId: string; at: number }
  | { type: "teacher_delta"; responseId: string; delta: string }
  /** Authoritative text of one teacher turn (emitted once per response, possibly partial if cut off). */
  | { type: "teacher_done"; responseId: string; text: string }
  | { type: "teacher_audio_start" }
  | { type: "teacher_audio_end" }
  /** The child cut the teacher off (barge-in, push-to-talk press, or typing over her). */
  | { type: "teacher_interrupted"; responseId?: string }
  | { type: "response_done"; responseId: string; status: ResponseStatus }
  | { type: "error"; message: string; fatal: boolean; code?: string };

export interface LinkLevels {
  /** The child's microphone (voice mode only; stays 0 in text mode). */
  mic: LevelMeter;
  /** The teacher's audio output, for lip-sync. */
  teacher: LevelMeter;
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
   * Give the teacher the floor. Voice: response.create from the current instructions (replyText is ignored,
   * the voice model writes its own words). Text: speak replyText.
   */
  promptTeacher(replyText?: string): void;
  /** Stop the teacher mid-turn. */
  interrupt(): void;
  /** Push-to-talk (voice only; no-ops in text mode). */
  setPushToTalk(on: boolean): void;
  talkStart(): void;
  talkEnd(): void;
  close(): void;
}
