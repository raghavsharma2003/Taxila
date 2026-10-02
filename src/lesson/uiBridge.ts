// uiBridge: the small additive surface the child lesson UI needs from the runtime, without changing it.
// Injected through RuntimeDeps (useLesson(bridge.deps)), so LessonRuntime, TextLink and VoiceLink are
// untouched. It adds three things:
//   1. the /api/lesson/end response (the runtime discards it): the end-of-lesson screen reads `ended`;
//   2. the "phir se" teacher-audio ring buffer (PRODUCT-DESIGN §3.11): the last 3 teacher turns, ≤ 60 s and
//      ≤ 2 MB, TEACHER AUDIO ONLY (child audio is never buffered). Text lane: the /api/tts blobs it already
//      fetched. Voice lane: a MediaRecorder on the remote stream, one clip per teacher turn;
//   3. a replay player with its own level meter (the stage's mouth follows it while a replay plays).
import type { LessonStartRequest, RealtimeTokenResponse, TtsRequest, TurnRequest } from "../../shared/contracts.ts";
import { fetchSpeech, httpLessonApi, type LessonApi } from "./api.ts";
import { createLevelAnalyser, LevelMeter } from "./level.ts";
import type { TeacherLink } from "./link.ts";
import { defaultLinkFactory, type LinkFactory, type RuntimeDeps } from "./runtime.ts";
import { Store } from "./store.ts";
import { TextLink } from "./textLink.ts";

export interface EndResult {
  lessonId: string;
  summary: string | null;
  parentNote: string | null;
  alreadyEnded?: boolean;
}

export interface UiBridgeState {
  /** The last /api/lesson/end answer (null until a lesson has ended through end()). */
  ended: EndResult | null;
  /** A replay is playing (the UI shows SPEAKING; the mic tap stops it). */
  replaying: boolean;
  /** Clips in the ring buffer. */
  buffered: number;
}

interface Clip {
  blob: Blob;
  ms: number;
}

const MAX_CLIPS = 3;
const MAX_MS = 60_000;
const MAX_BYTES = 2 * 1024 * 1024;

export class UiBridge {
  readonly store = new Store<UiBridgeState>({ ended: null, replaying: false, buffered: 0 });
  /** Level of a replay, for lip-sync while one plays (the link's teacher meter is silent then). */
  readonly replayLevel = new LevelMeter();
  readonly deps: RuntimeDeps;

  private clips: Clip[] = [];
  private link: TeacherLink | null = null;
  private recorder: MediaRecorder | null = null;
  private recChunks: Blob[] = [];
  private recStarted = 0;
  private unlisten: (() => void) | null = null;
  private player: HTMLAudioElement | null = null;
  private playerCtx: AudioContext | null = null;
  private playerUrl: string | null = null;

  constructor(base: LessonApi = httpLessonApi) {
    const api: LessonApi = {
      start: (req: LessonStartRequest) => base.start(req),
      turn: (req: TurnRequest) => base.turn(req),
      realtimeToken: (lessonId: string): Promise<RealtimeTokenResponse> => base.realtimeToken(lessonId),
      end: async (lessonId: string) => {
        const res = (await base.end(lessonId)) as Partial<EndResult> | null;
        this.store.set({ ended: { lessonId, summary: res?.summary ?? null, parentNote: res?.parentNote ?? null, alreadyEnded: res?.alreadyEnded } });
        return res;
      },
      endBeacon: base.endBeacon,
    };
    const createLink: LinkFactory = (mode, ctx) => {
      this.detachLink();
      this.clips = [];
      this.store.set({ buffered: 0, ended: null });
      const link =
        mode === "text"
          ? new TextLink({ lessonId: ctx.lessonId, levels: ctx.levels, speech: this.cachingSpeech })
          : defaultLinkFactory(mode, ctx);
      this.link = link;
      if (mode === "voice") this.unlisten = link.on((e) => this.onVoiceEvent(e.type));
      return link;
    };
    this.deps = { api, createLink };
  }

  get state(): UiBridgeState {
    return this.store.get();
  }

  /**
   * Replay her last turn exactly (first tap), or slower (second tap within 10 s: time-stretched with pitch
   * preserved, never pitch-shifted; the Director's REPEAT-SLOW move replaces this when it exists).
   * Returns false when nothing is buffered.
   */
  replay(slower = false): boolean {
    const clip = this.clips.at(-1);
    if (!clip) return false;
    this.stopReplay();
    const audio = this.ensurePlayer();
    this.playerUrl = URL.createObjectURL(clip.blob);
    audio.src = this.playerUrl;
    audio.preservesPitch = true;
    audio.playbackRate = slower ? 0.8 : 1;
    audio.onended = audio.onerror = () => this.stopReplay();
    void this.playerCtx?.resume().catch(() => {});
    this.store.set({ replaying: true });
    audio.play().catch(() => this.stopReplay());
    return true;
  }

  stopReplay(): void {
    if (this.player) {
      this.player.onended = this.player.onerror = null;
      this.player.pause();
      this.player.removeAttribute("src");
    }
    if (this.playerUrl) URL.revokeObjectURL(this.playerUrl);
    this.playerUrl = null;
    if (this.state.replaying) this.store.set({ replaying: false });
  }

  dispose(): void {
    this.stopReplay();
    this.detachLink();
    this.replayLevel.detach();
    void this.playerCtx?.close().catch(() => {});
    this.playerCtx = null;
    this.player = null;
  }

  // ───────────── ring buffer ─────────────

  private cachingSpeech = async (req: TtsRequest, signal: AbortSignal): Promise<Blob> => {
    const blob = await fetchSpeech(req, signal);
    this.push({ blob, ms: 0 });
    return blob;
  };

  private push(clip: Clip): void {
    this.clips.push(clip);
    while (
      this.clips.length > MAX_CLIPS ||
      (this.clips.length > 1 &&
        (this.clips.reduce((n, c) => n + c.blob.size, 0) > MAX_BYTES || this.clips.reduce((n, c) => n + c.ms, 0) > MAX_MS))
    ) {
      this.clips.shift();
    }
    this.store.set({ buffered: this.clips.length });
  }

  /** Voice lane: record the remote stream from her first audio frame to the end of the turn. */
  private onVoiceEvent(type: string): void {
    if (type === "teacher_audio_start") this.startRecording();
    else if (type === "teacher_audio_end" || type === "teacher_interrupted") this.stopRecording();
    else if (type === "child_speech_start") this.stopReplay();
  }

  private startRecording(): void {
    if (typeof MediaRecorder === "undefined" || this.recorder) return;
    // VoiceLink keeps its <audio> private; its srcObject is the remote stream (read-only use here).
    const stream = (this.link as unknown as { audioEl?: HTMLAudioElement | null })?.audioEl?.srcObject;
    if (!(stream instanceof MediaStream) || !stream.getAudioTracks().length) return;
    try {
      const rec = new MediaRecorder(stream);
      this.recChunks = [];
      this.recStarted = Date.now();
      rec.ondataavailable = (e) => {
        if (e.data.size) this.recChunks.push(e.data);
      };
      rec.onstop = () => {
        const ms = Date.now() - this.recStarted;
        if (this.recChunks.length && ms > 300) this.push({ blob: new Blob(this.recChunks, { type: rec.mimeType }), ms });
        this.recChunks = [];
      };
      rec.start();
      this.recorder = rec;
    } catch {
      this.recorder = null;
    }
  }

  private stopRecording(): void {
    const rec = this.recorder;
    this.recorder = null;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  private detachLink(): void {
    this.stopRecording();
    this.unlisten?.();
    this.unlisten = null;
    this.link = null;
  }

  private ensurePlayer(): HTMLAudioElement {
    if (this.player) return this.player;
    const audio = new Audio();
    this.player = audio;
    try {
      this.playerCtx = new AudioContext();
      const src = this.playerCtx.createMediaElementSource(audio);
      src.connect(this.playerCtx.destination);
      this.replayLevel.attach(createLevelAnalyser(this.playerCtx, src));
    } catch {
      this.playerCtx = null; // plays without lip-sync
    }
    return audio;
  }
}
