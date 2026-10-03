// uiBridge: the small additive surface the child lesson UI needs from the runtime, without changing it.
// Injected through RuntimeDeps (useLesson(bridge.deps)), so LessonRuntime, TextLink and VoiceLink are
// untouched. It adds:
//   1. the /api/lesson/end response (the runtime discards it): the end-of-lesson screen reads `ended`, and
//      the §2.5.1 fields (homeState, plan, capRemaining) when the server sends them;
//   2. the "phir se" teacher-audio ring buffer (PRODUCT-DESIGN §3.11): the last 3 teacher turns, ≤ 60 s and
//      ≤ 2 MB, TEACHER AUDIO ONLY (child audio is never buffered). Text lane: the /api/tts blobs it already
//      fetched. Cascade lane (the default voice lane): the streamed PCM, copied as it arrives and wrapped as
//      WAV. Realtime lane: a MediaRecorder on the remote stream, one clip per teacher turn;
//   3. a replay player with its own level meter (the stage's mouth follows it while a replay plays);
//   4. a speech hold (pause: no new teacher audio starts while the pause sheet is up, §3.13), and a quiet
//      stop that silences her without reporting a child barge-in to the Director;
//   5. the cascade link's push-to-talk state and transport (the runtime only reports pushToTalk for the
//      realtime lane), and an EchoGuard counter: her own voice heard back as a child turn (§3.9).
import type { LessonStartRequest, LessonSummary, RealtimeTokenResponse, TtsRequest, TurnRequest } from "../../shared/contracts.ts";
import { fetchSpeech, httpLessonApi, type LessonApi } from "./api.ts";
import { createLevelAnalyser, LevelMeter } from "./level.ts";
import { CascadeLink, isEcho, type CascadeTransport } from "./cascadeLink.ts";
import type { LinkEvent, TeacherLink } from "./link.ts";
import { defaultLinkFactory, type LinkFactory, type RuntimeDeps } from "./runtime.ts";
import { Store } from "./store.ts";
import { TextLink } from "./textLink.ts";
import { fetchSpeechStream, PCM_RATE } from "./ttsStream.ts";

/** §2.5.1 home state; the client never computes it, it only carries what the server answered. */
export type HomeState = "default" | "done" | "resting";

export interface EndResult {
  lessonId: string;
  summary: string | null;
  parentNote: string | null;
  alreadyEnded?: boolean;
  /** §2.5.1 contract fields (absent until the server sends them). */
  homeState?: HomeState;
  plan?: { openLesson: string | null; window?: unknown } | null;
  capRemaining?: number;
  /** "What you did today" (PRODUCT-DESIGN-V2 §6.3.5), from the lesson's own graded turns (server lessonSummary). */
  did?: LessonSummary;
}

export interface UiBridgeState {
  /** The last /api/lesson/end answer (null until a lesson has ended through end()). */
  ended: EndResult | null;
  /** A replay is playing (the UI shows SPEAKING; the mic tap stops it). */
  replaying: boolean;
  /** Clips in the ring buffer. */
  buffered: number;
  /** Replays finished so far (a change restarts the YOUR TURN timers). */
  replays: number;
  /** The lesson's link is the cascade lane (spoken turns over a text-lane link). */
  cascade: boolean;
  /** Cascade lane: tap-to-talk is on (the link may force it, e.g. the recording fallback). */
  pushToTalk: boolean;
  /** Cascade lane: how the child is heard ("typed" = no microphone). */
  transport: CascadeTransport | null;
  /** EchoGuard: her own voice came back as a child turn this many times. */
  echoFlags: number;
}

/** Two EchoGuard flags drop open mic back to tap-to-talk for the rest of the lesson (§3.9). */
export const ECHO_DEMOTE_FLAGS = 2;

interface Clip {
  blob: Blob;
  ms: number;
}

const MAX_CLIPS = 3;
const MAX_MS = 60_000;
const MAX_BYTES = 2 * 1024 * 1024;

export class UiBridge {
  readonly store = new Store<UiBridgeState>({
    ended: null, replaying: false, buffered: 0, replays: 0, cascade: false, pushToTalk: true, transport: null, echoFlags: 0,
  });
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
  /** Tap-to-talk is the default; open mic only when the screen has a headset or a passed probe. */
  private pttWanted = true;
  private suppressInterrupt = false;
  private hold: { promise: Promise<void>; release: () => void } | null = null;
  private lastTeacherText = "";
  private teacherAudioEndAt = 0;
  private teacherSounding = false;
  private resumedEcho = 0;
  private waiting = 0;

  constructor(base: LessonApi = httpLessonApi) {
    const api: LessonApi = {
      start: (req: LessonStartRequest) => base.start(req),
      turn: (req: TurnRequest) => base.turn(req),
      realtimeToken: (lessonId: string): Promise<RealtimeTokenResponse> => base.realtimeToken(lessonId),
      end: async (lessonId: string) => {
        const res = (await base.end(lessonId)) as Partial<EndResult> | null;
        this.store.set({
          ended: {
            lessonId, summary: res?.summary ?? null, parentNote: res?.parentNote ?? null, alreadyEnded: res?.alreadyEnded,
            homeState: res?.homeState, plan: res?.plan, capRemaining: res?.capRemaining, did: res?.did,
          },
        });
        return res;
      },
      endBeacon: base.endBeacon,
    };
    const createLink: LinkFactory = (mode, ctx) => {
      this.detachLink();
      this.clips = [];
      this.resumedEcho = 0;
      this.store.set({ buffered: 0, ended: null, cascade: !!ctx.cascade, transport: null, echoFlags: 0, pushToTalk: true });
      let link: TeacherLink;
      if (ctx.cascade) {
        // The cascade lane, with its speech copied into the phir-se buffer (never swapped for a TextLink).
        const cascade = new CascadeLink({
          lessonId: ctx.lessonId,
          levels: ctx.levels,
          speech: this.cachingStream,
          onTransport: (transport) => this.store.set({ transport }),
        });
        const set = cascade.setPushToTalk.bind(cascade);
        // An own property shadows the method, so the link's own fallback (recording → tap) is seen too.
        cascade.setPushToTalk = (on: boolean) => {
          set(on);
          const now = (cascade as unknown as { pushToTalk: boolean }).pushToTalk || cascade.transport === "typed";
          if (now !== this.state.pushToTalk) this.store.set({ pushToTalk: now });
        };
        cascade.setPushToTalk(this.pttWanted);
        link = cascade;
      } else if (mode === "text") {
        link = new TextLink({ lessonId: ctx.lessonId, levels: ctx.levels, speech: this.cachingSpeech });
      } else {
        link = defaultLinkFactory(mode, ctx);
      }
      // Events pass through one filter: a quiet stop (phir se, pause) is not a child barge-in.
      const on = link.on.bind(link);
      link.on = (fn: (e: LinkEvent) => void) => on((e) => {
        if (e.type === "teacher_interrupted" && this.suppressInterrupt) return;
        fn(e);
      });
      this.link = link;
      this.unlisten = on((e) => this.onLinkEvent(mode, e));
      return link;
    };
    this.deps = { api, createLink };
  }

  get state(): UiBridgeState {
    return this.store.get();
  }

  /**
   * The screen's talk policy (true = tap-to-talk), applied to a cascade link when it is created, before it
   * connects (so the mic is never hands-free by default). Once live, runtime.setPushToTalk carries changes.
   */
  setPushToTalk(on: boolean): void {
    this.pttWanted = on;
  }

  /** Teacher turns waiting on the speech hold (pause): on continue, these play instead of a replay. */
  get speechWaiting(): number {
    return this.waiting;
  }

  /**
   * Silence her now without telling the Director the child barged in (phir se, pause): the turn ends as
   * cancelled, not as interrupted. Returns true when something was playing.
   */
  quietStop(): boolean {
    if (!this.link) return false;
    const was = this.teacherSounding;
    this.suppressInterrupt = true;
    try {
      this.link.interrupt();
    } finally {
      this.suppressInterrupt = false;
    }
    return was;
  }

  /**
   * Hold (true) or release (false) new teacher speech. While held, a Director turn that lands has its
   * caption but its audio waits; release lets it play. The safeguarding help sheet never holds.
   */
  holdSpeech(on: boolean): void {
    if (on && !this.hold) {
      let release!: () => void;
      const promise = new Promise<void>((r) => (release = r));
      this.hold = { promise, release };
    } else if (!on && this.hold) {
      const h = this.hold;
      this.hold = null;
      h.release();
    }
  }

  /**
   * Replay her last turn exactly (first tap), or slower (second tap within 10 s). INTERIM STAND-IN: the slow
   * replay is the same clip time-stretched to 0.8x with pitch preserved (never pitch-shifted). §3.11 asks for
   * a Director REPEAT-SLOW move with fewer words; that replaces this once the Director supports it.
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
    if (this.state.replaying) this.store.set((st) => ({ replaying: false, replays: st.replays + 1 }));
  }

  dispose(): void {
    this.holdSpeech(false);
    this.stopReplay();
    this.detachLink();
    this.replayLevel.detach();
    void this.playerCtx?.close().catch(() => {});
    this.playerCtx = null;
    this.player = null;
  }

  // ───────────── ring buffer ─────────────

  /** Resolves when speech may start (immediately unless held); rejects when the turn is abandoned. */
  private async waitHold(signal: AbortSignal): Promise<void> {
    if (!this.hold) return;
    this.waiting++;
    try {
      await this.waitHoldLoop(signal);
    } finally {
      this.waiting--;
    }
  }

  private async waitHoldLoop(signal: AbortSignal): Promise<void> {
    while (this.hold) {
      const h = this.hold;
      await new Promise<void>((resolve, reject) => {
        if (signal.aborted) return reject(new DOMException("aborted", "AbortError"));
        const onAbort = () => reject(new DOMException("aborted", "AbortError"));
        signal.addEventListener("abort", onAbort, { once: true });
        void h.promise.then(() => {
          signal.removeEventListener("abort", onAbort);
          resolve();
        });
      });
    }
  }

  private cachingSpeech = async (req: TtsRequest, signal: AbortSignal): Promise<Blob> => {
    await this.waitHold(signal);
    const blob = await fetchSpeech(req, signal);
    this.push({ blob, ms: 0 });
    return blob;
  };

  /** Cascade: pass the PCM stream through untouched and keep a WAV copy of what arrived. */
  private cachingStream = async (req: TtsRequest, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> => {
    await this.waitHold(signal);
    const body = await fetchSpeechStream(req, signal);
    const parts: Uint8Array[] = [];
    let kept = false;
    const keep = () => {
      if (kept) return;
      kept = true;
      const bytes = parts.reduce((n, p) => n + p.length, 0);
      const ms = (bytes / 2 / PCM_RATE) * 1000;
      if (ms > 300) this.push({ blob: wavOf(parts, bytes), ms });
    };
    // A stop mid-stream keeps what arrived (the stream runs ahead of her voice, so it covers what was heard).
    signal.addEventListener("abort", keep, { once: true });
    return body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, ctl) {
          parts.push(chunk);
          ctl.enqueue(chunk);
        },
        flush: keep,
      }),
    );
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

  private onLinkEvent(mode: string, e: LinkEvent): void {
    switch (e.type) {
      case "teacher_done":
        this.lastTeacherText = e.text;
        break;
      case "teacher_audio_start":
        this.teacherSounding = true;
        if (mode === "voice") this.startRecording();
        break;
      case "teacher_audio_end":
      case "teacher_interrupted":
        if (e.type === "teacher_audio_end") this.teacherAudioEndAt = Date.now();
        this.teacherSounding = false;
        if (mode === "voice") this.stopRecording();
        break;
      case "child_speech_start":
        this.stopReplay();
        break;
      case "child_silent": {
        // The cascade link resumed her after hearing her own voice back while paused: one EchoGuard flag.
        const stats = (this.link as { bargeStats?: { resumedEcho: number } } | null)?.bargeStats;
        if (stats && stats.resumedEcho > this.resumedEcho) {
          this.resumedEcho = stats.resumedEcho;
          this.flagEcho();
        }
        break;
      }
      case "child_final":
        // A spoken "turn" that is her own words, heard while or just after she spoke: an EchoGuard flag.
        if (!e.typed && e.text && (this.teacherSounding || Date.now() - this.teacherAudioEndAt < 2000) && isEcho(e.text, this.lastTeacherText)) {
          this.flagEcho();
        }
        break;
    }
  }

  private flagEcho(): void {
    this.store.set((st) => ({ echoFlags: st.echoFlags + 1 }));
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
    this.teacherSounding = false;
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

/** PCM16 mono at PCM_RATE → a playable WAV blob. */
function wavOf(parts: Uint8Array[], bytes: number): Blob {
  const h = new DataView(new ArrayBuffer(44));
  const str = (o: number, v: string) => [...v].forEach((c, i) => h.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  h.setUint32(4, 36 + bytes, true);
  str(8, "WAVE");
  str(12, "fmt ");
  h.setUint32(16, 16, true);
  h.setUint16(20, 1, true);
  h.setUint16(22, 1, true);
  h.setUint32(24, PCM_RATE, true);
  h.setUint32(28, PCM_RATE * 2, true);
  h.setUint16(32, 2, true);
  h.setUint16(34, 16, true);
  str(36, "data");
  h.setUint32(40, bytes, true);
  return new Blob([h.buffer, ...parts.map((p) => p.slice().buffer)], { type: "audio/wav" });
}
