// The lesson's on-device voice features WITH voicesig (ship5 p3-voicesig): a drop-in VoiceFeaturesLike for
// src/lesson/runtime.ts. One mic tap (lessonTap.ts) feeds both consumers:
//   - src/voice's UtteranceTracker (the shipped per-utterance numbers + the server's pace tie-breakers), through
//     VoiceFeatures.attachFrames(): the same FrameAnalyzer frames its own worklet would have produced (test G-VS-DXEQ);
//   - the voicesig head: at each child_final it adds `kv` (KnowledgeVoice: numbers only) to the utterance, which rides on
//     TurnRequest.voiceFeatures.kv.
// Latency rule (SPEC §3.4, VS-A9): the turn is never delayed. Stage-0 kv is computed synchronously in onLinkEvent; when
// the filler detector is loaded it runs after, under HEAD_BUDGET_MS, and replaces kv on the same object only if it lands
// before the request is serialised. A late detector is simply not used for that turn.
// Fallback: any failure to attach the shared front-end (no AudioWorklet, a second front-end, a worklet that will not
// load, a server kill) leaves the lesson on the pre-voicesig path: VoiceFeatures.attachTap with its own worklet, no kv.
// Privacy: no audio and no text leave the device; kv is numbers (types.ts KnowledgeVoice).
import { acquireFrontEnd, micClassOf, type Lease } from "./lessonTap.ts";
import { VoicesigHead, detect, type FillerModel } from "./head.ts";
import { holdCueAllowed, voicesigConfig, voicesigDeviceAllows, voicesigRawTrack, type VoicesigConfig } from "./flag.ts";
import { HoldCue, type HoldCueConfig } from "./holdCue.ts";
import { publishThinkingPause } from "./holdBus.ts";
import { PilotRecorder, offerDownloads, pilotBadge, pilotCode } from "./pilotRecorder.ts";
import type { KnowledgeVoice } from "./types.ts";
import type { FrontEndCore } from "./frontend/bus.ts";
import type { LevelSource, UtteranceFeatures, VoiceFeaturesLike } from "../voice/features.ts";
import type { LinkEvent, MicTap } from "../lesson/link.ts";

/** Frames as src/voice/dsp.ts means them. */
interface FrameLike { t: number; rmsDb: number; f0: number | null; speech: boolean }
/** VoiceFeatures after patch 04 (src/voice/features.ts attachFrames). Older builds lack it → the old path. */
export type InnerFeatures = VoiceFeaturesLike & {
  attachFrames?: (tap: MicTap, teacherLevel: LevelSource | undefined, fe: { onFrame(cb: (f: FrameLike) => void): () => void }) => void;
};

/** Window around the utterance the head reads (onset pre-roll / tail), ms. Matches src/voice/tracker.ts PREROLL / POSTROLL. */
export const PREROLL_MS = 800;
export const POSTROLL_MS = 300;
/** The teacher meter at or above this counts as her audio being audible (src/voice/features.ts TEACHER_AUDIBLE). */
const TEACHER_AUDIBLE = 0.15;

export interface LessonFeaturesOptions {
  inner: InnerFeatures;
  /** Loads the filler detector (src/voicesig/ort.ts, patch 08). Absent → stage-0 measurements only. */
  loadDetector?: () => Promise<FillerModel | null>;
  /** The thinking-pause cue's measured settings from the model card (thr, pComplete). Absent → holdCue.ts defaults. */
  holdCueConfig?: Partial<HoldCueConfig>;
  /** Tests: the pilot code source (default: ?vspilot on this device) and where the finished files go. */
  pilotCode?: () => string | null;
  onPilotFiles?: (r: ReturnType<PilotRecorder["finish"]>) => void;
  config?: () => Promise<VoicesigConfig>;
  acquire?: typeof acquireFrontEnd;
  now?: () => number;
}

export type VoiceUtteranceWithKv = UtteranceFeatures & { kv?: KnowledgeVoice };

export class VoicesigLessonFeatures implements VoiceFeaturesLike {
  private readonly inner: InnerFeatures;
  private readonly o: LessonFeaturesOptions;
  private lease: Lease | null = null;
  private head: VoicesigHead | null = null;
  private teacherOff: (() => void) | null = null;
  private lastAudibleAt = -Infinity;
  private gen = 0;
  private cue: HoldCue | null = null;
  private cueOff: (() => void) | null = null;
  /** The cue's counters at the previous child_final (kv carries this turn's delta). */
  private cueSeen = { read: 0, fired: 0 };
  /** The consented pilot's recorder (pilotRecorder.ts): only with a coordinator's ?vspilot code on this device. */
  private pilot: { rec: PilotRecorder; off: () => void; badgeOff: () => void } | null = null;
  /** "shared" = one tap feeding both; "fallback" = the pre-voicesig path; null = not attached. */
  path: "shared" | "fallback" | null = null;
  /** Turns that carried kv / turns the detector upgraded in time (debug and tests). */
  readonly stats = { kv: 0, detector: 0, detectorLate: 0, fallbacks: 0 };

  constructor(o: LessonFeaturesOptions) {
    this.inner = o.inner;
    this.o = o;
  }

  async attachTap(tap: MicTap, teacherLevel?: LevelSource): Promise<void> {
    const gen = ++this.gen;
    this.release();
    const cfg = await (this.o.config ?? voicesigConfig)();
    if (gen !== this.gen) return;
    if (!voicesigDeviceAllows() || !cfg.frontend || cfg.mode === "off" || typeof this.inner.attachFrames !== "function") return this.fallback(tap, teacherLevel);
    try {
      this.teacherOff = teacherLevel?.subscribe((v) => {
        if (v >= TEACHER_AUDIBLE) { this.lastAudibleAt = (this.o.now ?? Date.now)(); this.pilot?.rec.her(this.lastAudibleAt); }
      }) ?? null;
      const lease = await (this.o.acquire ?? acquireFrontEnd)({
        ctx: tap.ctx, stream: tap.stream, raw: voicesigRawTrack(),
        herAudible: (t) => t - this.lastAudibleAt < 120,
      });
      if (gen !== this.gen) return lease.release();
      this.lease = lease;
      this.inner.attachFrames(tap, teacherLevel, lease.fe);
      const fe: FrontEndCore = lease.fe;
      fe.setMicClass(micClassOf(tap.stream.getAudioTracks()[0]));
      this.head = new VoicesigHead(fe);
      this.path = "shared";
      const code = (this.o.pilotCode ?? pilotCode)();
      if (code) {
        const rec = new PilotRecorder(code);
        this.pilot = { rec, off: fe.onChunk((t, p) => rec.chunk(t, p)), badgeOff: pilotBadge(code) };
      }
      // The detector loads after the tap is live (never before the first turn): a tiny second ORT session.
      if (cfg.detector && this.o.loadDetector) {
        void this.o.loadDetector().then((m) => {
          if (gen !== this.gen || !m) return;
          this.head?.setFiller(m);
          // Round 3: the thinking-pause cue for duplex, on the same frames and the same detector graph (one tiny session)
          if (holdCueAllowed(cfg)) this.startCue(m, micClassOf(tap.stream.getAudioTracks()[0]));
        }, () => {});
      }
    } catch (err) {
      console.warn("voicesig: shared front-end unavailable, using the previous voice-features path", err);
      this.release();
      if (gen === this.gen) await this.fallback(tap, teacherLevel);
    }
  }

  /** Feed the cue every hop (the head's GRU input vectors) and publish its estimates to duplex (holdBus.ts). */
  private startCue(m: FillerModel, micClass: ReturnType<typeof micClassOf>): void {
    try {
      const cue = new HoldCue({ detector: { detect: (x, T) => detect(m, x, T) }, onEstimate: publishThinkingPause, micClass,
        cfg: { thr: m.thr, ...(m.holdCue ?? {}), ...(this.o.holdCueConfig ?? {}) } });
      if (cue.disabled) return;
      this.cue = cue;
      this.cueSeen = { read: 0, fired: 0 };
      // the head's own per-hop GRU input (one build per hop for both consumers)
      this.cueOff = this.head?.onInput((f, x) => cue.frame(f, x, f.t - this.lastAudibleAt < 120)) ?? null;
    } catch {
      this.cue = null;
    }
  }

  private async fallback(tap: MicTap, teacherLevel?: LevelSource): Promise<void> {
    this.stats.fallbacks++;
    this.path = "fallback";
    await this.inner.attachTap(tap, teacherLevel);
  }

  onLinkEvent(e: LinkEvent): UtteranceFeatures | null {
    const u = this.inner.onLinkEvent(e) as VoiceUtteranceWithKv | null;
    if (!u || e.type !== "child_final" || !this.head) return u;
    try {
      const c = {
        fromT: u.at - PREROLL_MS,
        toT: u.at + u.features.durationMs + POSTROLL_MS,
        teacherEndAt: !u.bargeIn && typeof u.features.onsetMs === "number" ? u.at - u.features.onsetMs : null,
        words: u.features.words,
      };
      const kv0 = this.head.commitNow(c);
      if (kv0) { u.kv = kv0; this.stats.kv++; }
      // the cue's counters since the last child turn ride on kv (numbers only; the server traces vs_hold.fired)
      const hold = this.cueDelta();
      if (kv0 && hold) Object.assign(kv0.f, hold);
      this.pilot?.rec.turn(u.at, u.features.durationMs, !!u.bargeIn, kv0 ?? null);
      if (kv0 && this.head.hasDetector) {
        const head = this.head;
        void head.commit(c).then((kv1) => {
          if (kv1 && hold) Object.assign(kv1.f, hold);
          if (kv1 && kv1.q.det === 1) this.pilot?.rec.turn(u.at, u.features.durationMs, !!u.bargeIn, kv1);
          if (kv1 && kv1.q.det === 1) { u.kv = kv1; this.stats.detector++; } else this.stats.detectorLate++;
        }, () => { this.stats.detectorLate++; });
      }
    } catch {
      // kv is a tie-breaker's input: a failure never touches the utterance the runtime already has
    }
    return u;
  }

  private cueDelta(): { pausesRead: number; thinkPauses: number } | null {
    const c = this.cue?.core.stats;
    if (!c) return null;
    const d = { pausesRead: Math.min(200, c.read - this.cueSeen.read), thinkPauses: Math.min(200, c.fired - this.cueSeen.fired) };
    this.cueSeen = { read: c.read, fired: c.fired };
    return d;
  }

  setReadAloudTarget(text: string | null): void { this.inner.setReadAloudTarget(text); }

  private release(): void {
    if (this.pilot) {
      const p = this.pilot;
      this.pilot = null;
      p.off();
      p.badgeOff();
      try { const files = p.rec.finish(); (this.o.onPilotFiles ?? offerDownloads)(files); } catch { /* never touches the lesson */ }
    }
    this.cueOff?.();
    this.cueOff = null;
    this.cue = null;
    this.head?.dispose();
    this.head = null;
    this.teacherOff?.();
    this.teacherOff = null;
    this.lease?.release();
    this.lease = null;
  }

  detach(): void {
    this.gen++;
    this.release();
    this.inner.detach();
    this.path = null;
  }
}
