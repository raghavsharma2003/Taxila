// AudioFrontEnd (SPEC §2.2 bus.ts): the one publish/subscribe surface over the shared tap. No consumer touches a worklet
// or an ORT session. Two layers:
//   FrontEndCore   pure (no DOM): chunks in → frames, log-mel ring, P window, encoder-pass coalescing. Node-testable.
//   attachFrontEnd browser glue: ONE "taxila-tap2" worklet with two inputs (P = the link's processed mic stream; R = an
//                  optional raw track, AGC/NS off) on the link's existing AudioContext.
// Exactly-one invariants (G-VS-ONE): one front-end per tab (attachFrontEnd refuses a second), one YIN per hop (FrameCore),
// one encoder session (Encoder.shared), one pass per turnSeq however many consumers ask.
import { FrameCore } from "./frames.ts";
import { LogMel, MEL_RING_FRAMES, type MelFrame } from "./logmel.ts";
import type { Encoder } from "./encoder.ts";
import type { AudioFrame, AudioFrontEnd, EncoderPass, FrontEndCaps, MicClass } from "../types.ts";

/** P samples kept for window(ms) (duplex EngineTick.audio, stage B) and the encoder window. */
export const P_RING_MS = 8_000;

export interface FrontEndCoreOptions {
  herAudible?: (t: number) => boolean;
  encoder?: Encoder | null;
  micClass?: MicClass;
}

export class FrontEndCore implements AudioFrontEnd {
  readonly frameCore: FrameCore;
  private readonly mel = new LogMel(1, MEL_RING_FRAMES);
  /** Recent mel frames for melNear() (the GRU input pairs each 20 ms hop with the mel frame at its centre). */
  private recentMel: MelFrame[] = [];
  private readonly frameFns = new Set<(f: AudioFrame) => void>();
  private readonly passFns = new Set<(p: EncoderPass) => void>();
  private readonly passes = new Map<number, Promise<EncoderPass | null>>();
  private readonly pRing = new Float32Array((16_000 * P_RING_MS) / 1000);
  private pWritten = 0;
  private lastT = 0;
  private readonly encoder: Encoder | null;
  private micClass: MicClass;

  constructor(o: FrontEndCoreOptions = {}) {
    this.frameCore = new FrameCore({ herAudible: o.herAudible });
    this.encoder = o.encoder ?? null;
    this.micClass = o.micClass ?? "unknown";
  }

  /** One 20 ms chunk from the worklet (P, optional R), clock already converted by the caller. */
  push(t: number, p: Float32Array, r?: Float32Array): AudioFrame[] {
    this.lastT = t + (p.length / 16_000) * 1000;
    for (let i = 0; i < p.length; i++) this.pRing[(this.pWritten + i) % this.pRing.length] = p[i];
    this.pWritten += p.length;
    for (const m of this.mel.push(p, t)) this.recentMel.push(m);
    if (this.recentMel.length > 32) this.recentMel.splice(0, this.recentMel.length - 32);
    const out = this.frameCore.push({ t, p, r });
    for (const f of out) for (const fn of [...this.frameFns]) fn(f);
    return out;
  }

  /** The log10-mel frame whose centre is within 6 ms of t (null if none is buffered). */
  melNear(t: number): Float32Array | null {
    let best: MelFrame | null = null;
    for (const m of this.recentMel) if (!best || Math.abs(m.t - t) < Math.abs(best.t - t)) best = m;
    return best && Math.abs(best.t - t) <= 6 ? best.v : null;
  }

  setMicClass(c: MicClass): void { this.micClass = c; }

  onFrame(cb: (f: AudioFrame) => void): () => void { this.frameFns.add(cb); return () => this.frameFns.delete(cb); }
  onEncoderPass(cb: (p: EncoderPass) => void): () => void { this.passFns.add(cb); return () => this.passFns.delete(cb); }

  /** Idempotent per turnSeq: duplex's candidate end and voicesig's commit for the same turn share ONE pass. */
  requestPass(turnSeq: number, endT: number): void { void this.pass(turnSeq, endT); }

  /** The pass for a turn (started on first request). Resolves null when the encoder is off for this session. */
  pass(turnSeq: number, endT = this.lastT): Promise<EncoderPass | null> {
    const have = this.passes.get(turnSeq);
    if (have) return have;
    const p = (async (): Promise<EncoderPass | null> => {
      if (!this.encoder?.available) return null;
      const frames = MEL_RING_FRAMES;
      const r = await this.encoder.pass(this.mel.whisperWindow(frames), frames);
      if (!r) return null;
      const ep: EncoderPass = { turnSeq, t: endT, windowMs: frames * 10, logits: r.logits, pooled: r.pooled, computeMs: r.computeMs, device: this.encoder.device };
      for (const fn of [...this.passFns]) fn(ep);
      return ep;
    })();
    this.passes.set(turnSeq, p);
    // Keep the last few turns only.
    if (this.passes.size > 8) this.passes.delete(this.passes.keys().next().value as number);
    return p;
  }

  window(ms: number): Float32Array | null {
    const n = Math.min(this.pRing.length, Math.round((ms / 1000) * 16_000), this.pWritten);
    if (n <= 0) return null;
    const out = new Float32Array(n);
    const start = this.pWritten - n;
    for (let i = 0; i < n; i++) out[i] = this.pRing[(start + i) % this.pRing.length];
    return out;
  }

  frames(fromT: number, toT: number): AudioFrame[] { return this.frameCore.frames(fromT, toT); }

  caps(): FrontEndCaps { return { raw: this.frameCore.rawActive, encoder: !!this.encoder?.available, micClass: this.micClass }; }
}

// ───────────── browser glue ─────────────

/** R1 (preferred): AEC on, NS and AGC off. R2 fallback: all off (her playback is then gated by herAudible). */
export const RAW_R1: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: false, autoGainControl: false };
export const RAW_R2: MediaTrackConstraints = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

/** Live front-ends in this tab (G-VS-ONE: never more than one). */
export const frontEndStats = { live: 0, worklets: 0 };

export interface AttachOptions extends FrontEndCoreOptions {
  ctx: AudioContext;
  /** The link's existing processed mic stream (P). Never re-requested here. */
  stream: MediaStream;
  /** Worklet module URL (`import url from "./tapWorklet.ts?worker&url"` at the call site). */
  workletUrl: string;
  /** Ask for the raw analysis track (flag voicesig.rawTrack, per device class after VS-M11). */
  raw?: boolean;
  /** Clock conversion for a chunk stamped in AudioContext time (the caller's, as src/voice/features.ts does). */
  toClock?: (ctxTime: number) => number;
}

export interface AttachedFrontEnd { fe: FrontEndCore; rawTrack: MediaStreamTrack | null; detach(): void }

/** Open R on the same device as P. Null when refused or not honoured: R is optional and its absence fails nothing. */
export async function openRawTrack(p: MediaStreamTrack): Promise<MediaStreamTrack | null> {
  const deviceId = p.getSettings?.().deviceId;
  for (const c of [RAW_R1, RAW_R2]) {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { ...c, ...(deviceId ? { deviceId: { exact: deviceId } } : {}) } });
      const t = s.getAudioTracks()[0];
      const got = t?.getSettings?.() as MediaTrackSettings | undefined;
      // A browser that silently keeps AGC on gives no raw track at all (intensity cues need AGC off).
      if (t && got && got.autoGainControl !== true) return t;
      t?.stop();
    } catch {
      // refused / not supported: try the next config
    }
  }
  return null;
}

export async function attachFrontEnd(o: AttachOptions): Promise<AttachedFrontEnd> {
  if (frontEndStats.live > 0) throw new Error("voicesig: a front-end is already attached in this tab (G-VS-ONE)");
  frontEndStats.live++;
  const { ctx } = o;
  const fe = new FrontEndCore(o);
  let rawTrack: MediaStreamTrack | null = null;
  const nodes: AudioNode[] = [];
  try {
    await ctx.audioWorklet.addModule(o.workletUrl);
    const node = new AudioWorkletNode(ctx, "taxila-tap2", { numberOfInputs: 2, numberOfOutputs: 1, channelCount: 1 });
    frontEndStats.worklets++;
    const toClock = o.toClock ?? ((ct: number) => ct * 1000);
    node.port.onmessage = (e: MessageEvent<{ t: number; p: Float32Array; r?: Float32Array }>) => { fe.push(toClock(e.data.t), e.data.p, e.data.r); };
    const srcP = ctx.createMediaStreamSource(o.stream);
    srcP.connect(node, 0, 0);
    nodes.push(srcP, node);
    if (o.raw) {
      const pTrack = o.stream.getAudioTracks()[0];
      rawTrack = pTrack ? await openRawTrack(pTrack) : null;
      if (rawTrack) {
        const srcR = ctx.createMediaStreamSource(new MediaStream([rawTrack]));
        srcR.connect(node, 0, 1);
        nodes.push(srcR);
      }
    }
    // A worklet runs only while connected to the destination; a zero gain keeps the mic off the speakers.
    const sink = ctx.createGain();
    sink.gain.value = 0;
    node.connect(sink).connect(ctx.destination);
    nodes.push(sink);
    let done = false;
    return {
      fe, rawTrack,
      detach() {
        if (done) return;
        done = true;
        node.port.postMessage("stop");
        for (const n of nodes) n.disconnect();
        rawTrack?.stop();
        frontEndStats.live--;
      },
    };
  } catch (err) {
    for (const n of nodes) n.disconnect();
    rawTrack?.stop();
    frontEndStats.live--;
    throw err;
  }
}
