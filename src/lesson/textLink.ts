// Text mode (sandbox, e2e, accessibility, no-mic rooms): the child types or taps, the Director writes the
// teacher's reply (TurnResponse.teacherReply), and this link shows it and speaks it through /api/tts.
// Same TeacherLink surface as VoiceLink, including the teacher level meter for lip-sync.
import { fetchSpeech } from "./api.ts";
import type { LinkEvent, LinkLevels, TeacherLink } from "./link.ts";
import { createLevelAnalyser } from "./level.ts";
import { Emitter } from "./store.ts";

export interface TextLinkOptions {
  voice: string;
  levels: LinkLevels;
  /** Injectable for tests; defaults to POST /api/tts. */
  speech?: (text: string, voice: string, signal: AbortSignal) => Promise<Blob>;
}

export class TextLink implements TeacherLink {
  readonly mode = "text" as const;
  readonly levels: LinkLevels;
  private readonly voice: string;
  private readonly speech: (text: string, voice: string, signal: AbortSignal) => Promise<Blob>;
  private readonly events = new Emitter<LinkEvent>();
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private seq = 0;
  /** The reply being fetched or played; null when the teacher is quiet. */
  private current: { id: string; abort: AbortController; url: string | null; playing: boolean } | null = null;

  constructor(opts: TextLinkOptions) {
    this.voice = opts.voice;
    this.levels = opts.levels;
    this.speech = opts.speech ?? fetchSpeech;
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
      src.connect(this.ctx.destination);
      this.levels.teacher.attach(createLevelAnalyser(this.ctx, src));
    } catch (err) {
      console.warn("text link: no WebAudio, lip-sync level unavailable", err);
      this.ctx = null;
    }
    this.events.emit({ type: "connection", state: "connected" });
  }

  /** The Director already used these to write the reply; nothing to apply on this transport. */
  applyInstructions(): void {}

  sendChild(text: string, opts: { chipId?: string } = {}): void {
    this.interrupt();
    this.events.emit({ type: "child_final", text, startedAt: Date.now(), typed: true, chipId: opts.chipId });
  }

  promptTeacher(replyText?: string): void {
    const text = replyText?.trim();
    if (!text) return;
    this.stop("cancelled", false);
    const id = `text-${++this.seq}`;
    const abort = new AbortController();
    this.current = { id, abort, url: null, playing: false };
    this.events.emit({ type: "response_start", responseId: id, at: Date.now() });
    // The caption appears at once; speech follows when the audio arrives.
    this.events.emit({ type: "teacher_delta", responseId: id, delta: text });
    this.events.emit({ type: "teacher_done", responseId: id, text });
    void this.play(id, text, abort.signal);
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
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.audio = null;
    this.events.emit({ type: "connection", state: "closed" });
    this.events.clear();
  }

  private async play(id: string, text: string, signal: AbortSignal): Promise<void> {
    const audio = this.audio;
    try {
      const blob = await this.speech(text, this.voice, signal);
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
      await this.ctx?.resume().catch(() => {});
      await audio.play();
    } catch (err) {
      if (signal.aborted || this.current?.id !== id) return;
      // Speech is an enhancement here: the reply is already on screen, so the turn still completes.
      this.events.emit({ type: "error", message: "the teacher's voice is unavailable; showing text only", fatal: false });
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
    if (this.audio) {
      this.audio.onplaying = this.audio.onended = null;
      this.audio.pause();
      this.audio.removeAttribute("src");
    }
    if (cur.url) URL.revokeObjectURL(cur.url);
    if (byChild && cur.playing) this.events.emit({ type: "teacher_interrupted", responseId: cur.id });
    if (cur.playing) this.events.emit({ type: "teacher_audio_end" });
    this.events.emit({ type: "response_done", responseId: cur.id, status });
  }
}
