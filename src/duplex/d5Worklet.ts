// LANE D5 capture (2026-10-11): processor "taxila-d5-stereo", numberOfInputs 2.
//   input 0 = the lesson mic (the same processed capture the D4 call sends)
//   input 1 = her PLAYED audio: CascadeLink's player output (after the duck / pause), i.e. what the speaker actually played
// The audio thread only anti-aliases, decimates both to 16 kHz in lock-step (same render quantum, same ratio, so sample k
// of one is sample k of the other) and posts 20 ms chunks of INTERLEAVED PCM16 (ch0 mic, ch1 played): exactly the stereo
// frame Voice Live's Live-Reference echo canceller wants (server/duplex/voicelive.js, D5_FRAME_BYTES = 1280).
// Same filter and interpolation as src/voicesig/frontend/tapWorklet.ts. Nothing here talks to the network.

declare const sampleRate: number;
declare const currentTime: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}
declare function registerProcessor(name: string, ctor: new () => AudioWorkletProcessor): void;

const OUT_RATE = 16_000;
const CHUNK = 320; // 20 ms at 16 kHz

/** Two channels through one decimator: identical filters and one sample clock, so the two never drift apart. */
class StereoDecimator {
  private readonly ratio = sampleRate / OUT_RATE;
  private readonly a = 1 - Math.exp((-2 * Math.PI * 5000) / sampleRate);
  private m1 = 0;
  private m2 = 0;
  private h1 = 0;
  private h2 = 0;
  private pm = 0;
  private ph = 0;
  private count = 0;
  private next = 0;

  run(M: Float32Array | null, H: Float32Array | null, n: number, sink: (m: number, h: number, i: number) => void): void {
    for (let i = 0; i < n; i++) {
      this.m1 += this.a * ((M ? M[i] : 0) - this.m1);
      this.m2 += this.a * (this.m1 - this.m2);
      this.h1 += this.a * ((H ? H[i] : 0) - this.h1);
      this.h2 += this.a * (this.h1 - this.h2);
      while (this.next <= this.count) {
        const frac = this.next - (this.count - 1);
        sink(this.pm + (this.m2 - this.pm) * frac, this.ph + (this.h2 - this.ph) * frac, i);
        this.next += this.ratio;
      }
      this.pm = this.m2;
      this.ph = this.h2;
      this.count++;
    }
  }
}

const s16 = (v: number): number => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));

class D5Stereo extends AudioWorkletProcessor {
  private readonly dec = new StereoDecimator();
  private out = new Int16Array(CHUNK * 2);
  private k = 0;
  private chunkAt = 0;
  private alive = true;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => {
      if (e.data === "stop") this.alive = false;
    };
  }

  process(inputs: Float32Array[][]): boolean {
    const M = inputs[0]?.[0] ?? null;
    const H = inputs[1]?.[0] ?? null;
    const n = M?.length ?? H?.length ?? 128;
    this.dec.run(M && M.length === n ? M : null, H && H.length === n ? H : null, n, (m, h, i) => {
      if (this.k === 0) this.chunkAt = currentTime + i / sampleRate;
      this.out[this.k * 2] = s16(m);
      this.out[this.k * 2 + 1] = s16(h);
      if (++this.k === CHUNK) {
        this.port.postMessage({ t: this.chunkAt, pcm: this.out.buffer }, [this.out.buffer]);
        this.out = new Int16Array(CHUNK * 2);
        this.k = 0;
      }
    });
    return this.alive;
  }
}

registerProcessor("taxila-d5-stereo", D5Stereo);

export {};
