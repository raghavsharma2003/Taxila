// The cascade voice lane — the DEFAULT voice lane (context/decisions.md#voice-lane-cascade-default):
//   child's mic ──WebRTC──▶ Azure realtime TRANSCRIPTION session (server VAD, partial + final transcripts)
//   final transcript ──▶ POST /api/lesson/turn (the runtime does this; the Director writes the reply)
//   reply (a stored teacher turn) ──▶ POST /api/voice/tts-stream ──▶ streamed PCM ──▶ WebAudio
// Unlike the realtime lane, the Director is ON the reply path, so there is no one-turn lag: the teacher's
// words are always the Director's latest move.
//
// To the runtime this is a TEXT-LANE link (`mode = "text"`): the Director writes every reply and the link
// speaks a stored turn by seq — exactly TextLink's contract — but the child talks instead of typing.
// Barge-in: the server VAD's speech_started (or a push-to-talk press) stops the teacher synchronously; a
// local energy VAD ducks her within a frame or two before that arrives.
// Fallback: if the WebRTC transcription call cannot come up (or drops and cannot reconnect), the link turns
// into push-to-talk recording: one clip per press, uploaded to POST /api/voice/transcribe.
import type { RealtimeTokenResponse } from "../../shared/contracts.ts";
import { postJson } from "./api.ts";
import { createLevelAnalyser } from "./level.ts";
import type { LinkEvent, LinkLevels, TeacherLink, TeacherReply } from "./link.ts";
import { Emitter } from "./store.ts";
import { fetchSpeechStream, PcmStreamPlayer, type SpeechStreamFetch, type StreamPlayback } from "./ttsStream.ts";
import { MicVad } from "./vad.ts";

export type CascadeTransport = "webrtc" | "recording";

export interface TranscribeResult {
  text: string;
  asrConfidence?: number;
}

export interface CascadeLinkOptions {
  lessonId: string;
  levels: LinkLevels;
  /** Defaults to POST /api/voice/stt-token. */
  fetchToken?: (lessonId: string) => Promise<RealtimeTokenResponse>;
  /** Defaults to POST /api/voice/tts-stream. */
  speech?: SpeechStreamFetch;
  /** Push-to-talk fallback upload; defaults to POST /api/voice/transcribe. */
  transcribe?: (lessonId: string, clip: Blob) => Promise<TranscribeResult>;
  /** Duck the teacher on a local VAD onset before the server confirms the barge-in (default true). */
  localDuck?: boolean;
  maxReconnects?: number;
  /** Told when the link falls back to push-to-talk recording (the UI must then show a talk button). */
  onTransport?: (t: CascadeTransport) => void;
}

/** Per-turn latency marks (epoch ms, client clock) for dev UIs and on-device measurement. */
export interface CascadeTiming {
  speechEndAt?: number;
  finalAt?: number;
  replyAt?: number;
  firstAudioAt?: number;
}

const CHANNEL_OPEN_TIMEOUT_MS = 10_000;
/** Same tail as VoiceLink: audio reaches the server ~100-250 ms after it is spoken. */
const PTT_TAIL_MS = 300;
/** A local onset the server never confirms (a cough, the TV, echo) un-ducks after this long. */
const DUCK_RELEASE_MS = 700;
const DUCK_LEVEL = 0.2;
/** A recorded press shorter than this, or with no local speech onset, is an accidental tap. */
const MIN_CLIP_MS = 250;
const BENIGN_ERRORS = new Set(["input_audio_buffer_commit_empty", "response_cancel_not_active", "item_not_found"]);

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Mean per-token probability from transcription logprobs (absent when the model returns none). */
export function confidenceFromLogprobs(logprobs: unknown): number | undefined {
  if (!Array.isArray(logprobs) || !logprobs.length) return undefined;
  const lps = logprobs.map((l) => obj(l).logprob).filter((v): v is number => typeof v === "number");
  if (!lps.length) return undefined;
  return Math.exp(lps.reduce((a, b) => a + b, 0) / lps.length);
}

/**
 * Transcription-session events → child LinkEvents. Pure (no DOM, no transport), so tests drive it with
 * recorded server events. `onSpeechStart` is the barge-in hook.
 */
export class TranscriptionProtocol {
  private readonly emit: (e: LinkEvent) => void;
  private readonly onSpeechStart: () => void;
  private readonly now: () => number;
  private readonly starts = new Map<string, number>();
  private readonly partial = new Map<string, string>();
  /** Set by push-to-talk: the press time dates the committed item (no speech_started in that mode). */
  talkStartedAt: number | null = null;

  constructor(opts: { emit: (e: LinkEvent) => void; onSpeechStart: () => void; now?: () => number }) {
    this.emit = opts.emit;
    this.onSpeechStart = opts.onSpeechStart;
    this.now = opts.now ?? Date.now;
  }

  handle(raw: unknown): void {
    const e = obj(raw);
    const itemId = str(e.item_id);
    switch (str(e.type)) {
      case "input_audio_buffer.speech_started": {
        const at = this.now();
        if (itemId) this.starts.set(itemId, at);
        this.onSpeechStart();
        this.emit({ type: "child_speech_start", at, itemId: itemId || undefined });
        return;
      }
      case "input_audio_buffer.speech_stopped":
        this.emit({ type: "child_speech_end", at: this.now() });
        return;
      case "input_audio_buffer.committed":
        if (itemId && !this.starts.has(itemId)) this.starts.set(itemId, this.talkStartedAt ?? this.now());
        this.talkStartedAt = null;
        return;
      case "conversation.item.input_audio_transcription.delta": {
        const text = (this.partial.get(itemId) ?? "") + str(e.delta);
        this.partial.set(itemId, text);
        this.emit({ type: "child_partial", itemId, text });
        return;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const text = str(e.transcript).trim();
        const startedAt = this.take(itemId);
        // An utterance the transcriber heard as nothing (a cough, a chair) is not a turn: no reply is coming.
        if (!text) this.emit({ type: "child_silent" });
        else this.emit({ type: "child_final", text, startedAt, typed: false, itemId, asrConfidence: confidenceFromLogprobs(e.logprobs) });
        return;
      }
      case "conversation.item.input_audio_transcription.failed":
        // The child spoke and ASR failed: "" + confidence 0 asks the Director for a repair move.
        this.emit({ type: "child_final", text: "", startedAt: this.take(itemId), typed: false, itemId, asrConfidence: 0 });
        return;
      default:
        return;
    }
  }

  reset(): void {
    this.starts.clear();
    this.partial.clear();
    this.talkStartedAt = null;
  }

  private take(itemId: string): number {
    const at = this.starts.get(itemId) ?? this.now();
    this.starts.delete(itemId);
    this.partial.delete(itemId);
    return at;
  }
}

const defaultToken = (lessonId: string) => postJson<RealtimeTokenResponse>("/api/voice/stt-token", { lessonId });

async function defaultTranscribe(lessonId: string, clip: Blob): Promise<TranscribeResult> {
  const bytes = new Uint8Array(await clip.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return postJson<TranscribeResult>("/api/voice/transcribe", { lessonId, audio: btoa(bin), mime: clip.type || "audio/webm" });
}

export class CascadeLink implements TeacherLink {
  /** Text lane to the runtime: the Director writes the reply, the link speaks the stored turn. */
  readonly mode = "text" as const;
  /** What this link actually is, for UIs and the runtime's eventual `cascade` mode. */
  readonly lane = "cascade" as const;
  readonly levels: LinkLevels;
  /** Last 20 turns' latency marks. */
  readonly timings: CascadeTiming[] = [];

  private readonly lessonId: string;
  private readonly fetchToken: (lessonId: string) => Promise<RealtimeTokenResponse>;
  private readonly speech: SpeechStreamFetch;
  private readonly transcribeClip: (lessonId: string, clip: Blob) => Promise<TranscribeResult>;
  private readonly localDuck: boolean;
  private readonly maxReconnects: number;
  private readonly onTransport?: (t: CascadeTransport) => void;
  private readonly events = new Emitter<LinkEvent>();
  private readonly protocol: TranscriptionProtocol;

  private ctx: AudioContext | null = null;
  private mic: MediaStream | null = null;
  private micVad: MicVad | null = null;
  private player: PcmStreamPlayer | null = null;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioInput: Json = {};
  private transportKind: CascadeTransport = "webrtc";
  private closed = false;
  private reconnecting = false;
  private pushToTalk = false;
  private talking = false;
  private pttTail: ReturnType<typeof setTimeout> | null = null;
  private duckTimer: ReturnType<typeof setTimeout> | null = null;
  private recorder: { rec: MediaRecorder; parts: Blob[]; startedAt: number; heard: boolean } | null = null;
  private replySeq = 0;
  /** The reply being fetched or played; null when the teacher is quiet. */
  private current: { id: string; playback: StreamPlayback; playing: boolean } | null = null;
  private turn: CascadeTiming = {};

  constructor(opts: CascadeLinkOptions) {
    this.lessonId = opts.lessonId;
    this.levels = opts.levels;
    this.fetchToken = opts.fetchToken ?? defaultToken;
    this.speech = opts.speech ?? fetchSpeechStream;
    this.transcribeClip = opts.transcribe ?? defaultTranscribe;
    this.localDuck = opts.localDuck ?? true;
    this.maxReconnects = opts.maxReconnects ?? 2;
    this.onTransport = opts.onTransport;
    this.protocol = new TranscriptionProtocol({
      emit: (e) => this.onChildEvent(e),
      onSpeechStart: () => this.bargeIn(),
    });
  }

  /** "webrtc" = hands-free; "recording" = push-to-talk upload fallback. */
  get transport(): CascadeTransport {
    return this.transportKind;
  }

  on(fn: (e: LinkEvent) => void): () => void {
    return this.events.on(fn);
  }

  async connect(): Promise<void> {
    this.events.emit({ type: "connection", state: "connecting" });
    const mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (this.closed) {
      for (const t of mic.getTracks()) t.stop();
      throw new Error("the voice lesson was closed");
    }
    this.mic = mic;
    const ctx = new AudioContext();
    this.ctx = ctx;
    void ctx.resume().catch(() => {});
    const micAnalyser = createLevelAnalyser(ctx, ctx.createMediaStreamSource(mic));
    this.levels.mic.attach(micAnalyser);
    this.micVad = new MicVad(micAnalyser, (edge) => this.onLocalVad(edge));
    this.micVad.start();
    this.player = new PcmStreamPlayer(ctx, ctx.destination);
    this.levels.teacher.attach(createLevelAnalyser(ctx, this.player.output));
    try {
      await this.open();
    } catch (err) {
      if (this.closed) throw err;
      console.warn("cascade: transcription call unavailable, falling back to push-to-talk", err);
      this.teardownPeer();
      this.useRecording();
    }
    this.events.emit({ type: "connection", state: "connected" });
  }

  /** The Director already used them to write the reply; nothing to apply on this transport. */
  applyInstructions(): void {}

  sendChild(text: string, opts: { chipId?: string } = {}): void {
    void this.ctx?.resume().catch(() => {}); // inside the child's tap: a user activation
    this.interrupt();
    this.events.emit({ type: "child_final", text, startedAt: Date.now(), typed: true, chipId: opts.chipId });
  }

  promptTeacher(reply?: TeacherReply): void {
    const text = reply?.text.trim();
    if (!text) return;
    this.stopReply("cancelled", false);
    const id = `cascade-${++this.replySeq}`;
    this.turn.replyAt = Date.now();
    this.events.emit({ type: "response_start", responseId: id, at: Date.now() });
    // The caption appears at once; speech follows as the first sentence streams in.
    this.events.emit({ type: "teacher_delta", responseId: id, delta: text });
    this.events.emit({ type: "teacher_done", responseId: id, text });
    const seq = reply?.seq;
    if (seq === undefined || !this.player) {
      this.events.emit({ type: "response_done", responseId: id, status: "completed" });
      return;
    }
    void this.ctx?.resume().catch(() => {});
    const playback = this.player.play((signal) => this.speech({ lessonId: this.lessonId, seq }, signal));
    const cur = { id, playback, playing: false };
    this.current = cur;
    playback.started.then(
      (at) => {
        if (this.current !== cur) return;
        cur.playing = true;
        this.turn.firstAudioAt = at;
        this.recordTiming();
        this.events.emit({ type: "teacher_audio_start" });
      },
      () => {},
    );
    void playback.ended.then((status) => {
      if (this.current !== cur) return;
      if (status === "failed") {
        this.events.emit({ type: "error", message: "the teacher's voice is unavailable; showing text only", fatal: false });
      }
      this.stopReply(status === "stopped" ? "cancelled" : status, false);
    });
  }

  interrupt(): void {
    this.stopReply("cancelled", true);
  }

  setPushToTalk(on: boolean): void {
    if (this.transportKind === "recording") on = true; // no hands-free without the transcription call
    if (on === this.pushToTalk) return;
    this.clearPttTail();
    this.pushToTalk = on;
    this.talking = false;
    if (this.transportKind === "webrtc") {
      this.sendSession(on ? null : this.audioInput.turn_detection);
      this.setMicEnabled(!on);
    }
  }

  talkStart(): void {
    if (!this.pushToTalk || this.talking) return;
    this.clearPttTail();
    this.talking = true;
    const at = Date.now();
    void this.ctx?.resume().catch(() => {});
    this.bargeIn();
    if (this.transportKind === "webrtc") {
      this.protocol.talkStartedAt = at;
      this.setMicEnabled(true);
    } else {
      this.startRecording(at);
    }
    this.events.emit({ type: "child_speech_start", at });
  }

  talkEnd(): void {
    if (!this.talking) return;
    this.talking = false;
    const at = Date.now();
    this.turn = { speechEndAt: at };
    this.events.emit({ type: "child_speech_end", at });
    this.clearPttTail();
    this.pttTail = setTimeout(() => {
      this.pttTail = null;
      if (this.closed || this.talking) return;
      if (this.transportKind === "webrtc") {
        this.setMicEnabled(false);
        this.send({ type: "input_audio_buffer.commit" });
      } else {
        this.finishRecording();
      }
    }, PTT_TAIL_MS);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearPttTail();
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.stopReply("cancelled", false);
    this.teardownPeer();
    this.protocol.reset();
    if (this.recorder?.rec.state === "recording") this.recorder.rec.stop();
    this.recorder = null;
    this.micVad?.stop();
    this.micVad = null;
    for (const t of this.mic?.getTracks() ?? []) t.stop();
    this.mic = null;
    this.levels.mic.detach();
    this.levels.teacher.detach();
    this.player = null;
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.events.emit({ type: "connection", state: "closed" });
    this.events.clear();
  }

  // ───────────── child side ─────────────

  private onChildEvent(e: LinkEvent): void {
    if (e.type === "child_speech_end") this.turn = { speechEndAt: e.at };
    if (e.type === "child_final" || e.type === "child_silent") this.turn.finalAt = Date.now();
    this.events.emit(e);
  }

  /** The child took the floor: the teacher stops now (a reply still loading is dropped too). */
  private bargeIn(): void {
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.duckTimer = null;
    this.stopReply("cancelled", true);
  }

  private onLocalVad(edge: "onset" | "offset"): void {
    if (edge === "onset" && this.recorder) this.recorder.heard = true;
    if (!this.localDuck || edge !== "onset" || !this.current?.playing || this.pushToTalk) return;
    this.player?.duck(DUCK_LEVEL);
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      this.duckTimer = null;
      if (this.current?.playing) this.player?.duck(1);
    }, DUCK_RELEASE_MS);
  }

  // ───────────── teacher side ─────────────

  private stopReply(status: "completed" | "cancelled" | "failed", byChild: boolean): void {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    cur.playback.stop();
    if (byChild && cur.playing) this.events.emit({ type: "teacher_interrupted", responseId: cur.id });
    if (cur.playing) this.events.emit({ type: "teacher_audio_end" });
    this.events.emit({ type: "response_done", responseId: cur.id, status });
  }

  private recordTiming(): void {
    const t = this.turn;
    if (t.speechEndAt && t.firstAudioAt) {
      this.timings.push({ ...t });
      if (this.timings.length > 20) this.timings.shift();
      const d = (a?: number, b?: number) => (a && b ? `${b - a}ms` : "?");
      console.debug(`cascade turn: endpoint→final ${d(t.speechEndAt, t.finalAt)}, final→reply ${d(t.finalAt, t.replyAt)}, reply→audio ${d(t.replyAt, t.firstAudioAt)}, total ${d(t.speechEndAt, t.firstAudioAt)}`);
    }
    this.turn = {};
  }

  // ───────────── transcription call (WebRTC) ─────────────

  private async open(): Promise<void> {
    const tok = await this.fetchToken(this.lessonId);
    if (this.closed) throw new Error("the voice lesson was closed");
    this.audioInput = { ...obj(obj(obj(tok.session).audio).input) };
    const pc = new RTCPeerConnection();
    this.pc = pc;
    for (const track of this.mic!.getAudioTracks()) pc.addTrack(track, this.mic!);
    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;
    let fail: (err: Error) => void = () => {};
    const opened = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("transcription channel did not open")), CHANNEL_OPEN_TIMEOUT_MS);
      fail = (err) => {
        clearTimeout(timer);
        reject(err);
      };
      dc.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    opened.catch(() => {});
    pc.onconnectionstatechange = () => {
      if (pc.connectionState !== "failed" || this.pc !== pc) return;
      if (dc.readyState !== "open") fail(new Error("the transcription call could not connect"));
      else void this.lost();
    };
    dc.onmessage = (m) => {
      try {
        const e = JSON.parse(String(m.data));
        if (e?.type === "error") this.onServerError(e);
        else this.protocol.handle(e);
      } catch (err) {
        console.warn("cascade: bad event", err);
      }
    };
    dc.onclose = () => {
      if (this.dc === dc && !this.closed) void this.lost();
    };
    await pc.setLocalDescription(await pc.createOffer());
    const res = await fetch(`${tok.base.replace(/\/+$/, "")}/realtime/calls`, {
      method: "POST",
      body: pc.localDescription!.sdp,
      headers: { Authorization: `Bearer ${tok.token}`, "Content-Type": "application/sdp" },
    });
    if (!res.ok) throw new Error(`transcription call refused (${res.status})`);
    await pc.setRemoteDescription({ type: "answer", sdp: await res.text() });
    await opened;
    if (this.pushToTalk) this.sendSession(null);
  }

  private onServerError(e: Json): void {
    const err = obj(e.error);
    const code = str(err.code);
    if (code === "input_audio_buffer_commit_empty") {
      this.events.emit({ type: "child_silent" }); // a push-to-talk press with no audio
      return;
    }
    if (BENIGN_ERRORS.has(code)) return;
    this.events.emit({ type: "error", message: str(err.message) || "transcription error", fatal: false, code: code || undefined });
  }

  /** The call dropped mid-lesson: reconnect quietly (the teacher keeps speaking), else fall back to recording. */
  private async lost(): Promise<void> {
    if (this.closed || this.reconnecting || this.transportKind !== "webrtc") return;
    this.reconnecting = true;
    this.teardownPeer();
    this.protocol.reset();
    for (let attempt = 1; attempt <= this.maxReconnects && !this.closed; attempt++) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      try {
        await this.open();
        this.reconnecting = false;
        return;
      } catch (err) {
        console.warn("cascade: reconnect failed", err);
        this.teardownPeer();
      }
    }
    this.reconnecting = false;
    if (!this.closed) this.useRecording();
  }

  private useRecording(): void {
    this.transportKind = "recording";
    this.pushToTalk = false;
    this.setPushToTalk(true);
    this.setMicEnabled(true); // the local VAD and the mic meter still listen; nothing is sent until a press
    this.onTransport?.("recording");
    this.events.emit({ type: "error", message: "hands-free listening is unavailable; hold the button to talk", fatal: false, code: "stt_fallback_ptt" });
  }

  private sendSession(turnDetection: unknown): void {
    this.send({ type: "session.update", session: { type: "transcription", audio: { input: { ...this.audioInput, turn_detection: turnDetection ?? null } } } });
  }

  private send(event: Json): void {
    if (this.dc?.readyState === "open") this.dc.send(JSON.stringify(event));
  }

  private teardownPeer(): void {
    const { pc, dc } = this;
    this.pc = null;
    this.dc = null;
    if (dc) {
      dc.onopen = dc.onmessage = dc.onclose = null;
      dc.close();
    }
    if (pc) {
      pc.onconnectionstatechange = null;
      pc.close();
    }
  }

  // ───────────── push-to-talk recording fallback ─────────────

  private startRecording(at: number): void {
    if (!this.mic || typeof MediaRecorder === "undefined") {
      this.events.emit({ type: "error", message: "this browser cannot record; type instead", fatal: false, code: "no_recorder" });
      return;
    }
    const mime = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(this.mic, mime ? { mimeType: mime } : undefined);
    const state = { rec, parts: [] as Blob[], startedAt: at, heard: !!this.micVad?.speaking };
    rec.ondataavailable = (e) => {
      if (e.data.size) state.parts.push(e.data);
    };
    this.recorder = state;
    rec.start();
  }

  private finishRecording(): void {
    const state = this.recorder;
    this.recorder = null;
    if (!state || state.rec.state !== "recording") {
      this.events.emit({ type: "child_silent" });
      return;
    }
    state.rec.onstop = () => {
      const blob = new Blob(state.parts, { type: state.rec.mimeType || "audio/webm" });
      if (!state.heard || Date.now() - state.startedAt < MIN_CLIP_MS || blob.size < 500) {
        this.onChildEvent({ type: "child_silent" });
        return;
      }
      this.transcribeClip(this.lessonId, blob).then(
        (r) => {
          if (this.closed) return;
          if (!r.text && r.asrConfidence !== 0) this.onChildEvent({ type: "child_silent" });
          else this.onChildEvent({ type: "child_final", text: r.text, startedAt: state.startedAt, typed: false, asrConfidence: r.text ? r.asrConfidence : 0 });
        },
        (err) => {
          if (this.closed) return;
          console.warn("cascade: transcription upload failed", err);
          this.onChildEvent({ type: "child_final", text: "", startedAt: state.startedAt, typed: false, asrConfidence: 0 });
        },
      );
    };
    state.rec.stop();
  }

  private clearPttTail(): void {
    if (this.pttTail) clearTimeout(this.pttTail);
    this.pttTail = null;
  }

  private setMicEnabled(on: boolean): void {
    for (const t of this.mic?.getAudioTracks() ?? []) t.enabled = on;
  }
}

/** A factory with the runtime's LinkFactory shape for a text-lane lesson, e.g. `createLink` in RuntimeDeps. */
export function createCascadeLink(ctx: { lessonId: string; levels: LinkLevels }, opts: Partial<CascadeLinkOptions> = {}): CascadeLink {
  return new CascadeLink({ ...opts, lessonId: ctx.lessonId, levels: ctx.levels });
}
