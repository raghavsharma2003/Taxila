// On-device child voice features (decision voice-features-longitudinal): the browser glue.
//
// In a lesson the runtime (src/lesson/runtime.ts) owns one of these per voice link:
//   const vf = new VoiceFeatures();
//   await vf.attachTap(link.micTap(), link.levels.teacher);   // the link's own mic stream + AudioContext
//   const u = vf.onLinkEvent(e);       // every link event, in order; a child_final returns its features,
//                                      // which ride on that turn's POST /api/lesson/turn (TurnRequest.voiceFeatures)
//   vf.setReadAloudTarget(text);       // while a read-aloud item is up (null afterwards)
//   …  vf.detach();
// Standalone (no runtime): new VoiceFeatures({ lessonId }) + bindLink(link) POSTs each utterance to
// /api/voice/features instead.
//
// Privacy floor: raw audio never leaves the device and never touches storage. The worklet hands 16 kHz
// samples to this page, the page reduces them to the numbers in VoiceFeatureValues, and only those numbers
// (no transcript text) leave the device. The frame history is a 90 s in-memory ring.
//
// Clocks: everything here is epoch ms (Date.now()), the clock the link events use. A worklet chunk is
// stamped receipt-relative — now − (ctx.currentTime − chunk ctx time) − the mic track's input latency — so
// no second clock (performance.timeOrigin, getOutputTimestamp) is ever subtracted from Date.now(). The
// teacher's end is moved to when it reached the child's ear: + ctx.outputLatency, read live at each end
// (it changes when the child switches speaker ↔ Bluetooth, which per-child z-scores cannot absorb).
import workletUrl from "./featureWorklet.ts?worker&url";
import { FrameAnalyzer } from "./dsp.ts";
import { UtteranceTracker, type FinalTurn, type UtteranceFeatures } from "./tracker.ts";
import type { LinkEvent, MicTap, TeacherLink } from "../lesson/link.ts";

export type { UtteranceFeatures, VoiceFeatureValues, UtteranceContext } from "./tracker.ts";

/** Server reply per stored utterance (server/voice/features.js). */
export interface ScoredUtterance {
  id: number;
  reliable: boolean;
  /** Per-child z-scores (null until the child's baseline has enough reliable utterances). */
  z: Record<string, number | null>;
  signals: { slowerPace?: true; gentlerHint?: true; followUpProbe?: true };
}

export interface VoiceFeaturesOptions {
  /** When set, each utterance is POSTed to /api/voice/features for this lesson (standalone use only). */
  lessonId?: string;
  /** Clock (epoch ms); injectable for tests. */
  now?: () => number;
}

/** What the runtime needs (tests inject a fake). */
export interface VoiceFeaturesLike {
  attachTap(tap: MicTap, teacherLevel?: LevelSource): Promise<void>;
  onLinkEvent(e: LinkEvent): UtteranceFeatures | null;
  setReadAloudTarget(text: string | null): void;
  detach(): void;
}

/** A LevelMeter (src/lesson/level.ts): 0..1 per animation frame. */
export interface LevelSource {
  subscribe(fn: (v: number) => void): () => void;
}

/** The teacher meter at or above this counts as audible (≈ −52 dBFS through the meter's mapping). */
export const TEACHER_AUDIBLE = 0.15;
/** Below that this long after the server's "stopped": the teacher's audio has ended on this device. */
export const TEACHER_QUIET_MS = 150;
/** No animation frames (hidden tab): settle a pending remote end this long after it arrived. */
export const TEACHER_END_SETTLE_MS = 1_500;

export class VoiceFeatures implements VoiceFeaturesLike {
  private readonly tracker = new UtteranceTracker();
  private readonly analyzer = new FrameAnalyzer();
  private readonly now: () => number;
  private readonly lessonId?: string;
  private ctx: AudioContext | null = null;
  private ownsCtx = false;
  private node: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private sink: GainNode | null = null;
  private track: MediaStreamTrack | null = null;
  private teacherEnd: MicTap["teacherEnd"] = "local";
  private levelOff: (() => void) | null = null;
  private lastAudibleAt = -Infinity;
  private pendingEnd: { at: number; timer: ReturnType<typeof setTimeout> | null } | null = null;
  private utteranceFns = new Set<(u: UtteranceFeatures) => void>();
  /** The shared front-end's frame subscription (attachFrames), when this instance does not own a worklet. */
  private frameOff: (() => void) | null = null;
  private scoredFns = new Set<(r: ScoredUtterance, u: UtteranceFeatures) => void>();

  constructor(opts: VoiceFeaturesOptions = {}) {
    this.now = opts.now ?? (() => Date.now());
    this.lessonId = opts.lessonId;
  }

  /** Analyse a link's microphone tap. A "remote" teacher end is re-timed from the local teacher meter. */
  async attachTap(tap: MicTap, teacherLevel?: LevelSource): Promise<void> {
    await this.attach(tap.stream, tap.ctx);
    this.teacherEnd = tap.teacherEnd;
    if (tap.teacherEnd === "remote" && teacherLevel) this.levelOff = teacherLevel.subscribe((v) => this.onTeacherLevel(v));
  }

  /** Start analysing a microphone stream. Pass the link's AudioContext (one context on Android, already resumed). */
  async attach(stream: MediaStream, ctx?: AudioContext): Promise<void> {
    this.detach();
    this.ownsCtx = !ctx;
    const c = ctx ?? new AudioContext();
    this.ctx = c;
    try {
      // Outside a user gesture a fresh context starts suspended and the worklet would never run.
      if (c.state === "suspended") void c.resume().catch(() => {});
      this.track = stream.getAudioTracks()[0] ?? null;
      if (!this.track) throw new Error("voice features: the stream has no audio track");
      await c.audioWorklet.addModule(workletUrl);
      if (this.ctx !== c) return; // detached while loading
      this.source = c.createMediaStreamSource(stream);
      this.node = new AudioWorkletNode(c, "taxila-feature-tap", { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
      this.node.port.onmessage = (e: MessageEvent<{ t: number; x: Float32Array }>) => this.onChunk(e.data.t, e.data.x);
      // A worklet only runs while connected to the destination; a zero gain keeps the mic off the speakers.
      this.sink = c.createGain();
      this.sink.gain.value = 0;
      this.source.connect(this.node).connect(this.sink).connect(c.destination);
    } catch (err) {
      if (this.ctx === c) this.detach();
      throw err;
    }
  }

  /**
   * Feed from the ONE shared mic tap (src/voicesig/lessonTap.ts, G-VS-ONE) instead of this class's own worklet. The
   * front-end's frames are FrameAnalyzer frames on the same 16 kHz samples and the same epoch clock (onChunk's formula),
   * so the tracker sees what attachTap would have given it (test G-VS-DXEQ).
   */
  attachFrames(tap: MicTap, teacherLevel: LevelSource | undefined, fe: { onFrame(cb: (f: { t: number; rmsDb: number; f0: number | null; speech: boolean }) => void): () => void }): void {
    this.detach();
    this.ownsCtx = false;
    this.ctx = tap.ctx;
    this.track = tap.stream.getAudioTracks()[0] ?? null;
    this.teacherEnd = tap.teacherEnd;
    if (tap.teacherEnd === "remote" && teacherLevel) this.levelOff = teacherLevel.subscribe((v) => this.onTeacherLevel(v));
    this.frameOff = fe.onFrame((f) => this.tracker.addFrames([{ t: f.t, rmsDb: f.rmsDb, f0: f.f0, speech: f.speech }]));
  }

  detach(): void {
    this.frameOff?.();
    this.frameOff = null;
    this.node?.port.postMessage("stop");
    this.node?.disconnect();
    this.source?.disconnect();
    this.sink?.disconnect();
    this.node = null;
    this.source = null;
    this.sink = null;
    this.track = null;
    this.levelOff?.();
    this.levelOff = null;
    if (this.pendingEnd?.timer) clearTimeout(this.pendingEnd.timer);
    this.pendingEnd = null;
    if (this.ownsCtx) void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.ownsCtx = false;
  }

  /** Drive utterances from a TeacherLink's events (standalone use). Returns the unsubscribe. */
  bindLink(link: Pick<TeacherLink, "on">): () => void {
    return link.on((e: LinkEvent) => void this.onLinkEvent(e));
  }

  /** Feed one link event; a spoken child_final returns that utterance's features (null otherwise). */
  onLinkEvent(e: LinkEvent): UtteranceFeatures | null {
    switch (e.type) {
      case "teacher_audio_start":
        this.flushEnd();
        this.tracker.teacherAudioStarted();
        return null;
      case "teacher_audio_end":
        if (this.teacherEnd === "remote" && this.levelOff) this.holdEnd();
        else this.tracker.teacherAudioEnded(this.now() + this.outputLatencyMs());
        return null;
      case "child_speech_start":
        this.flushEnd();
        this.tracker.speechStart(e.at);
        return null;
      case "child_speech_end":
        this.tracker.speechEnd(e.at);
        return null;
      // A start with no words (a cough, a chair, an empty push-to-talk): drop the marks, keep the turn.
      case "child_silent":
        this.tracker.cancel();
        return null;
      case "connection":
        if (e.state === "reconnecting" || e.state === "closed" || e.state === "failed") {
          if (this.pendingEnd?.timer) clearTimeout(this.pendingEnd.timer);
          this.pendingEnd = null;
          this.tracker.resetTurn();
        }
        return null;
      case "child_final":
        this.flushEnd();
        return this.finalize(e);
      default:
        return null;
    }
  }

  /** Hooks for a link that does not emit LinkEvents. */
  teacherAudioStarted(): void { this.tracker.teacherAudioStarted(); }
  teacherAudioEnded(at = this.now()): void { this.tracker.teacherAudioEnded(at); }
  speechStart(at = this.now()): void { this.tracker.speechStart(at); }
  speechEnd(at = this.now()): void { this.tracker.speechEnd(at); }
  setReadAloudTarget(text: string | null): void { this.tracker.setReadAloudTarget(text); }

  onUtterance(fn: (u: UtteranceFeatures) => void): () => void {
    this.utteranceFns.add(fn);
    return () => this.utteranceFns.delete(fn);
  }

  onScored(fn: (r: ScoredUtterance, u: UtteranceFeatures) => void): () => void {
    this.scoredFns.add(fn);
    return () => this.scoredFns.delete(fn);
  }

  finalize(turn: FinalTurn): UtteranceFeatures | null {
    const u = this.tracker.finalize(turn, this.now());
    if (!u) return null;
    for (const fn of [...this.utteranceFns]) fn(u);
    if (this.lessonId) void this.post(u);
    return u;
  }

  // ───────────── teacher end, realtime lane ─────────────
  // output_audio_buffer.stopped is the SERVER's view; the child hears the end when the remote track goes
  // quiet here (rule 8). Hold the end until the local teacher meter has been quiet TEACHER_QUIET_MS.

  private onTeacherLevel(v: number): void {
    const t = this.now();
    if (v >= TEACHER_AUDIBLE) this.lastAudibleAt = t;
    else if (this.pendingEnd && t - this.lastAudibleAt >= TEACHER_QUIET_MS) this.flushEnd();
  }

  private holdEnd(): void {
    if (this.pendingEnd) return;
    const p: { at: number; timer: ReturnType<typeof setTimeout> | null } = { at: this.now(), timer: null };
    p.timer = setTimeout(() => { if (this.pendingEnd === p) this.flushEnd(); }, TEACHER_END_SETTLE_MS);
    this.pendingEnd = p;
  }

  private flushEnd(): void {
    const p = this.pendingEnd;
    if (!p) return;
    this.pendingEnd = null;
    if (p.timer) clearTimeout(p.timer);
    // The last audible frame, if the meter saw this turn's tail; else the server's time.
    const heard = this.lastAudibleAt > p.at - 3_000 ? this.lastAudibleAt : p.at;
    this.tracker.teacherAudioEnded(heard + this.outputLatencyMs());
  }

  private outputLatencyMs(): number {
    const c = this.ctx;
    const s = c ? (c.outputLatency || c.baseLatency || 0) : 0;
    return Number.isFinite(s) && s > 0 && s < 1 ? s * 1000 : 0;
  }

  private inputLatencyMs(): number {
    const s = (this.track?.getSettings?.() as { latency?: number } | undefined)?.latency;
    return typeof s === "number" && Number.isFinite(s) && s > 0 && s < 1 ? s * 1000 : 0;
  }

  private onChunk(ctxTime: number, x: Float32Array): void {
    const c = this.ctx;
    if (!c) return;
    const epoch = this.now() - Math.max(0, c.currentTime - ctxTime) * 1000 - this.inputLatencyMs();
    this.tracker.addFrames(this.analyzer.push(x, epoch));
  }

  private async post(u: UtteranceFeatures): Promise<void> {
    try {
      const res = await fetch("/api/voice/features", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId: this.lessonId, utterances: [u] }),
        keepalive: true,
      });
      if (!res.ok) {
        console.warn(`voice features: upload rejected (${res.status})`);
        return;
      }
      const body = (await res.json()) as { utterances?: ScoredUtterance[] };
      const r = body.utterances?.[0];
      if (r) for (const fn of [...this.scoredFns]) fn(r, u);
    } catch {
      // Features are tie-breakers: a lost utterance never disturbs the lesson.
    }
  }
}
