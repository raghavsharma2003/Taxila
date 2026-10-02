// On-device child voice features (decision voice-features-longitudinal): the browser glue.
//
//   const vf = new VoiceFeatures({ lessonId });
//   await vf.attach(micStream);          // whichever link is active provides the MediaStream
//   const off = vf.bindLink(link);       // teacher_audio_* + child_speech_* + child_final drive utterances
//   vf.setReadAloudTarget(item.text);    // while a read-aloud item is up (null afterwards)
//   vf.onUtterance((u) => …);            // features of each child utterance
//   vf.onScored((r) => …);               // the server's per-child z-scores + tie-breaker signals
//   …  off(); vf.detach();
//
// Privacy floor: raw audio never leaves the device and never touches storage. The worklet hands 16 kHz
// samples to this page, the page reduces them to the numbers in VoiceFeatureValues, and only those numbers
// (no transcript text) are POSTed to /api/voice/features. The frame history is a 90 s in-memory ring.
import workletUrl from "./featureWorklet.ts?worker&url";
import { FrameAnalyzer } from "./dsp.ts";
import { UtteranceTracker, type FinalTurn, type UtteranceFeatures } from "./tracker.ts";
import type { LinkEvent, TeacherLink } from "../lesson/link.ts";

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
  /** When set, each utterance is POSTed to /api/voice/features for this lesson. */
  lessonId?: string;
  /** Clock (epoch ms); injectable for tests. */
  now?: () => number;
}

export class VoiceFeatures {
  private readonly tracker = new UtteranceTracker();
  private readonly analyzer = new FrameAnalyzer();
  private readonly now: () => number;
  private readonly lessonId?: string;
  private ctx: AudioContext | null = null;
  private ownsCtx = false;
  private node: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private sink: GainNode | null = null;
  private utteranceFns = new Set<(u: UtteranceFeatures) => void>();
  private scoredFns = new Set<(r: ScoredUtterance, u: UtteranceFeatures) => void>();

  constructor(opts: VoiceFeaturesOptions = {}) {
    this.now = opts.now ?? (() => Date.now());
    this.lessonId = opts.lessonId;
  }

  /** Start analysing a microphone stream. Pass the link's AudioContext to avoid a second one on Android. */
  async attach(stream: MediaStream, ctx?: AudioContext): Promise<void> {
    this.detach();
    this.ownsCtx = !ctx;
    const c = ctx ?? new AudioContext();
    this.ctx = c;
    await c.audioWorklet.addModule(workletUrl);
    if (this.ctx !== c) return; // detached while loading
    this.source = c.createMediaStreamSource(stream);
    this.node = new AudioWorkletNode(c, "taxila-feature-tap", { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
    this.node.port.onmessage = (e: MessageEvent<{ t: number; x: Float32Array }>) => this.onChunk(e.data.t, e.data.x);
    // A worklet only runs while connected to the destination; a zero gain keeps the mic off the speakers.
    this.sink = c.createGain();
    this.sink.gain.value = 0;
    this.source.connect(this.node).connect(this.sink).connect(c.destination);
  }

  detach(): void {
    this.node?.port.postMessage("stop");
    this.node?.disconnect();
    this.source?.disconnect();
    this.sink?.disconnect();
    this.node = null;
    this.source = null;
    this.sink = null;
    if (this.ownsCtx) void this.ctx?.close().catch(() => {});
    this.ctx = null;
  }

  /** Drive utterances from a TeacherLink's events. Returns the unsubscribe. */
  bindLink(link: Pick<TeacherLink, "on">): () => void {
    return link.on((e: LinkEvent) => this.onLinkEvent(e));
  }

  onLinkEvent(e: LinkEvent): void {
    switch (e.type) {
      case "teacher_audio_start": this.tracker.teacherAudioStarted(); break;
      // Stamped on receipt: both links emit it synchronously from device playback (rule 8).
      case "teacher_audio_end": this.tracker.teacherAudioEnded(this.now()); break;
      case "child_speech_start": this.tracker.speechStart(e.at); break;
      case "child_speech_end": this.tracker.speechEnd(e.at); break;
      case "child_final": this.finalize(e); break;
    }
  }

  /** Hooks for a link that does not emit LinkEvents (the cascade lane may call these directly). */
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

  private onChunk(ctxTime: number, x: Float32Array): void {
    const c = this.ctx;
    if (!c) return;
    // Map AudioContext time to the epoch clock the link events use.
    const ts = c.getOutputTimestamp?.();
    const epoch = ts?.contextTime != null && ts.performanceTime != null
      ? performance.timeOrigin + ts.performanceTime + (ctxTime - ts.contextTime) * 1000
      : this.now() - (c.currentTime - ctxTime) * 1000;
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
      if (!res.ok) return;
      const body = (await res.json()) as { utterances?: ScoredUtterance[] };
      const r = body.utterances?.[0];
      if (r) for (const fn of [...this.scoredFns]) fn(r, u);
    } catch {
      // Features are tie-breakers: a lost utterance never disturbs the lesson.
    }
  }
}
