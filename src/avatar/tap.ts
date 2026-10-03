// The teacher tap for the lip driver (AVATAR.md §2.2, §3.1). Audio-floor rules, enforced by tests/avatar-*.test.mjs:
//  - no AudioContext, no output node, no worklet, no DelayNode, no MediaElementSource/MediaStreamSource here;
//  - the ONLY node this file creates is an analysis-only AnalyserNode, hung off the existing meter's analyser
//    (an AnalyserNode passes its input through), and it is never connected onward;
//  - playback is untouched: delay the face, never the audio.
// A source without onTap (or before its link attaches) still drives the mouth from its 0..1 meter value: the
// amplitude fallback.

export interface TapSource {
  readonly value: number;
  onTap?(fn: (a: AnalyserNode | null) => void): () => void;
}

interface Slot {
  own: AnalyserNode | null;
  upstream: AnalyserNode | null;
  buf: Float32Array<ArrayBuffer> | null;
  off: () => void;
  src: TapSource;
}

export interface TapRead {
  /** Latest 2048-sample window of the loudest attached tap, or null (amplitude fallback). */
  buf: Float32Array | null;
  sampleRate: number;
  /** Seconds on the tap's AudioContext clock, or performance.now()/1000 when no tap. */
  t: number;
  /** Max meter value of all sources (0..1), for the amplitude fallback. */
  level: number;
  /** True once after a (re)attach: the caller flushes its lip ring (§3.4 reconnects). */
  fresh: boolean;
}

export class TeacherTap {
  private slots: Slot[] = [];
  private fresh = false;

  constructor(sources: TapSource[]) {
    for (const src of sources) {
      const slot: Slot = { own: null, upstream: null, buf: null, off: () => {}, src };
      if (src.onTap) slot.off = src.onTap((a) => this.attach(slot, a));
      this.slots.push(slot);
    }
  }

  private attach(slot: Slot, a: AnalyserNode | null): void {
    if (slot.own && slot.upstream) {
      try {
        slot.upstream.disconnect(slot.own);
      } catch {
        /* the old graph is gone already */
      }
    }
    slot.own = null;
    slot.upstream = null;
    slot.buf = null;
    if (!a) return;
    const own = a.context.createAnalyser();
    own.fftSize = 2048;
    own.smoothingTimeConstant = 0;
    a.connect(own); // analysis only: `own` has no outgoing connection, ever
    slot.own = own;
    slot.upstream = a;
    slot.buf = new Float32Array(own.fftSize);
    this.fresh = true;
  }

  /** Is any real tap attached (else the mouth runs on the meter value)? */
  get attached(): boolean {
    return this.slots.some((s) => s.own);
  }

  read(): TapRead {
    let best: Slot | null = null, bestE = -1;
    let level = 0;
    for (const s of this.slots) {
      level = Math.max(level, s.src.value);
      if (!s.own || !s.buf) continue;
      s.own.getFloatTimeDomainData(s.buf);
      let e = 0;
      for (let i = s.buf.length - 512; i < s.buf.length; i++) e += s.buf[i] * s.buf[i];
      if (e > bestE) {
        bestE = e;
        best = s;
      }
    }
    const fresh = this.fresh;
    this.fresh = false;
    if (!best || !best.own) return { buf: null, sampleRate: 48000, t: performance.now() / 1000, level, fresh };
    const ctx = best.own.context as BaseAudioContext;
    return { buf: best.buf, sampleRate: ctx.sampleRate, t: performance.now() / 1000, level, fresh };
  }

  dispose(): void {
    for (const s of this.slots) {
      s.off();
      this.attach(s, null);
    }
    this.slots = [];
  }
}

/**
 * Amplitude fallback: a synthetic window whose RMS reproduces a 0..1 meter level (the meter's -60…-10 dBFS map),
 * so one LipDriver handles both paths.
 */
export function windowFromLevel(level: number, out: Float32Array): Float32Array {
  const rms = level > 0 ? Math.pow(10, (level * 50 - 60) / 20) : 0;
  const amp = rms * Math.SQRT2;
  for (let i = 0; i < out.length; i++) out[i] = amp * Math.sin(i * 0.2);
  return out;
}
