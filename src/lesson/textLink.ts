// Text mode (sandbox, e2e, accessibility, no-mic rooms): the child types or taps, the Director writes the
// teacher's reply (TurnResponse.teacherReply), and this link shows it and speaks it.
// Speech (smooth G4, BUILD-PLAN W1-A item 10): STREAMED through /api/voice/tts-stream + PcmStreamPlayer, the cascade
// lane's path, which /turn prewarms for text lessons too (decision cascade-tts-prewarm): first audio in ~0.1-0.4 s of
// the turn response instead of the whole-mp3 /api/tts call (1.6-2.1 s measured). /api/tts stays as the fallback (no
// WebAudio, or a stream that never sounded) and for "Hear" replays. Both speak only a teacher turn the server stored for
// this lesson (by seq), in the teacher's voice, so the link never sends free text to be spoken.
// Same TeacherLink surface as VoiceLink, including the teacher level meter for lip-sync.
import type { TtsRequest } from "../../shared/contracts.ts";
import { fetchSpeech } from "./api.ts";
import { fetchSpeechStream, PcmStreamPlayer, type SpeechStreamFetch, type StreamPlayback } from "./ttsStream.ts";
import type { LinkEvent, LinkLevels, TeacherLink, TeacherReply } from "./link.ts";
import { createLevelAnalyser } from "./level.ts";
import { Emitter } from "./store.ts";

type Speech = (req: TtsRequest, signal: AbortSignal) => Promise<Blob>;

/** Audio that has not reported its length this long after it was loaded is given up on. */
const LOAD_TIMEOUT_MS = 15_000;
/** Past the clip's own length, a reply whose `ended` never fired (a stall) is ended as completed. */
const END_SLACK_MS = 3_000;
/** Upper bound for a reply of unknown length (the reply guard caps a turn at 40 words, ~20 s spoken). */
const MAX_REPLY_MS = 45_000;

export interface TextLinkOptions {
  lessonId: string;
  levels: LinkLevels;
  /** The whole-clip fallback; injectable for tests; defaults to POST /api/tts. */
  speech?: Speech;
  /** The streamed path (preferred whenever WebAudio exists); defaults to POST /api/voice/tts-stream. */
  stream?: SpeechStreamFetch;
}

export class TextLink implements TeacherLink {
  readonly mode = "text" as const;
  readonly levels: LinkLevels;
  private readonly lessonId: string;
  private readonly speech: Speech;
  private readonly events = new Emitter<LinkEvent>();
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private readonly stream: SpeechStreamFetch;
  private player: PcmStreamPlayer | null = null;
  private playback: StreamPlayback | null = null;
  private seq = 0;
  /** The reply being fetched or played; null when the teacher is quiet. */
  private current: { id: string; abort: AbortController; url: string | null; playing: boolean; timer?: ReturnType<typeof setTimeout> } | null = null;

  constructor(opts: TextLinkOptions) {
    this.lessonId = opts.lessonId;
    this.levels = opts.levels;
    this.speech = opts.speech ?? fetchSpeech;
    this.stream = opts.stream ?? fetchSpeechStream;
  }

  on(fn: (e: LinkEvent) => void): () => void {
    return this.events.on(fn);
  }

  async connect(): Promise<void> {
    this.audio = new Audio();
    this.audio.preload = "auto";
    try {
      // Routing the element through WebAudio gives the same analyser API as the voice call. Once an
      // element has a MediaElementSource its sound only reaches the speakers through the graph.
      this.ctx = new AudioContext();
      const src = this.ctx.createMediaElementSource(this.audio);
      // One analyser for both paths: the clip element and the PCM stream player feed the same gain node.
      const mix = this.ctx.createGain();
      src.connect(mix);
      mix.connect(this.ctx.destination);
      this.player = new PcmStreamPlayer(this.ctx, mix);
      this.levels.teacher.attach(createLevelAnalyser(this.ctx, mix));
    } catch (err) {
      console.warn("text link: no WebAudio, lip-sync level unavailable", err);
      this.ctx = null;
    }
    this.events.emit({ type: "connection", state: "connected" });
  }

  /** The Director already used these to write the reply; nothing to apply on this transport. */
  applyInstructions(): void {}

  sendChild(text: string, opts: { chipId?: string } = {}): void {
    void this.ctx?.resume().catch(() => {}); // called inside the child's tap or submit: a user activation
    this.interrupt();
    this.events.emit({ type: "child_final", text, startedAt: Date.now(), typed: true, chipId: opts.chipId });
  }

  promptTeacher(reply?: TeacherReply): void {
    const text = reply?.text.trim();
    if (!text) return;
    this.stop("cancelled", false);
    const id = `text-${++this.seq}`;
    const abort = new AbortController();
    this.current = { id, abort, url: null, playing: false };
    this.events.emit({ type: "response_start", responseId: id, at: Date.now() });
    // The caption appears at once; speech follows when the audio arrives.
    this.events.emit({ type: "teacher_delta", responseId: id, delta: text });
    this.events.emit({ type: "teacher_done", responseId: id, text });
    // A context that is not running yet (no user activation on a cold load) would hold a streamed reply silent and
    // unfinished forever; the clip element plays (silently) through it and ends, so the turn still completes.
    if (this.player && this.ctx?.state === "running" && reply?.seq !== undefined) this.playStream(id, reply.seq, abort.signal);
    else void this.play(id, reply?.seq, abort.signal);
  }

  /**
   * The streamed path: the first sentence sounds on its first bytes. A stream that fails before any audio sounded falls
   * back to the whole clip (/api/tts) once; one that fails mid-reply ends the reply (the words are on screen).
   */
  private playStream(id: string, seq: number, signal: AbortSignal): void {
    const player = this.player!;
    void this.ctx?.resume().catch(() => {});
    // the player marks the whiteboard's line anchor and times the clause onsets on its own clock (ttsStream.ts)
    const req = { lessonId: this.lessonId, seq };
    const playback = player.play((sig, sink) => this.stream(req, sig, sink), { req });
    this.playback = playback;
    let sounded = false;
    playback.started.then(() => {
      if (this.current?.id !== id || this.playback !== playback) return;
      sounded = true;
      this.current.playing = true;
      this.events.emit({ type: "teacher_audio_start" });
    }, () => {});
    void playback.ended.then((status) => {
      if (this.current?.id !== id || this.playback !== playback) return;
      this.playback = null;
      if (status === "failed" && !sounded && !signal.aborted) {
        void this.play(id, seq, signal); // the whole clip instead
        return;
      }
      if (status === "failed") this.events.emit({ type: "error", message: "the teacher's voice is unavailable; showing text only", fatal: false, code: "tts_failed" });
      this.stop(status === "stopped" ? "cancelled" : status, false);
    });
  }

  interrupt(): void {
    this.stop("cancelled", true);
  }

  setPushToTalk(): void {}
  talkStart(): void {}
  talkEnd(): void {}

  close(): void {
    this.stop("cancelled", false);
    this.levels.teacher.detach();
    this.player?.stop();
    this.player = null;
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.audio = null;
    this.events.emit({ type: "connection", state: "closed" });
    this.events.clear();
  }

  private async play(id: string, seq: number | undefined, signal: AbortSignal): Promise<void> {
    const audio = this.audio;
    try {
      if (seq === undefined) throw new Error("reply has no stored turn to speak");
      const blob = await this.speech({ lessonId: this.lessonId, seq }, signal);
      if (this.current?.id !== id || !audio) return;
      const url = URL.createObjectURL(blob);
      this.current.url = url;
      audio.src = url;
      audio.onplaying = () => {
        if (this.current?.id !== id || this.current.playing) return;
        this.current.playing = true;
        this.events.emit({ type: "teacher_audio_start" });
      };
      audio.onended = () => {
        if (this.current?.id === id) this.stop("completed", false);
      };
      // A playback error after play() resolved would otherwise leave the status on "speaking" for the rest of the
      // lesson. NOT "abort": setting a new src on an element whose last clip played fires "abort" for the OLD
      // resource as a queued task, after these handlers are set, so every second reply was failed on arrival
      // (measured on the shipped route, tests/e2e-design-b1-route.mjs: the floor stuck in "thinking"). A load
      // that really dies is caught by the error event or the stall timer below.
      audio.onerror = () => {
        if (this.current?.id === id) this.stop("failed", false);
      };
      audio.onabort = null;
      // A stall fires no event that ends the clip, so a timer does: the clip's length plus slack.
      const arm = (ms: number, status: "completed" | "failed") => {
        const cur = this.current;
        if (cur?.id !== id) return;
        clearTimeout(cur.timer);
        cur.timer = setTimeout(() => {
          if (this.current?.id === id) this.stop(status, false);
        }, ms);
      };
      audio.onloadedmetadata = () => {
        // Some engines report Infinity for a streamed MP3 blob: fall back to the longest reply we allow.
        arm(Number.isFinite(audio.duration) ? audio.duration * 1000 + END_SLACK_MS : MAX_REPLY_MS, "completed");
      };
      arm(LOAD_TIMEOUT_MS, "failed");
      // Never wait on resume(): without a user activation (iOS, Android WebView) it can stay pending
      // forever and the turn would stick on "thinking". A context still suspended here plays silently
      // (the element sounds only through the graph) while the reply is on screen; sendChild() resumes it
      // inside the child's own tap, which is the activation those platforms require.
      void this.ctx?.resume().catch(() => {});
      await audio.play();
    } catch (err) {
      if (signal.aborted || this.current?.id !== id) return;
      // Speech is an enhancement here: the reply is already on screen, so the turn still completes.
      this.events.emit({ type: "error", message: "the teacher's voice is unavailable; showing text only", fatal: false, code: "tts_failed" });
      console.warn("text link: speech failed", err);
      this.stop("failed", false);
    }
  }

  /** End the current reply (if any) and report how it ended. */
  private stop(status: "completed" | "cancelled" | "failed", byChild: boolean): void {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    cur.abort.abort();
    clearTimeout(cur.timer);
    if (this.playback) {
      const pb = this.playback;
      this.playback = null;
      pb.stop();
    }
    if (this.audio) {
      this.audio.onplaying = this.audio.onended = this.audio.onerror = this.audio.onabort = this.audio.onloadedmetadata = null;
      this.audio.pause();
      this.audio.removeAttribute("src");
    }
    if (cur.url) URL.revokeObjectURL(cur.url);
    if (byChild && cur.playing) this.events.emit({ type: "teacher_interrupted", responseId: cur.id });
    if (cur.playing) this.events.emit({ type: "teacher_audio_end" });
    this.events.emit({ type: "response_done", responseId: cur.id, status });
  }
}
