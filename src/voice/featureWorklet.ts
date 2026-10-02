// AudioWorklet tap for voice features. It does the minimum on the audio thread — anti-alias, decimate to
// 16 kHz, post 20 ms chunks — because analysis work on the audio thread is the inherited CPU-contention
// failure class on mid-range Android (src/lesson/level.ts). Pitch and statistics run on the main thread
// (src/voice/dsp.ts). Samples go to the page only; nothing here talks to the network.
//
// Loaded by src/voice/features.ts via `?worker&url`, so Vite bundles it as a standalone module.

declare const sampleRate: number;
declare const currentTime: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}
declare function registerProcessor(name: string, ctor: new () => AudioWorkletProcessor): void;

const OUT_RATE = 16_000;
const CHUNK = 320; // 20 ms at 16 kHz

class FeatureTap extends AudioWorkletProcessor {
  private readonly ratio = sampleRate / OUT_RATE;
  /** Two cascaded one-pole low-passes at ~5 kHz: crude, but f0 and energy need nothing above 4 kHz. */
  private readonly a = 1 - Math.exp((-2 * Math.PI * 5000) / sampleRate);
  private lp1 = 0;
  private lp2 = 0;
  private prev = 0;
  /** Input samples consumed so far, and the input-index time of the next output sample. */
  private count = 0;
  private next = 0;
  private buf = new Float32Array(CHUNK);
  private n = 0;
  private chunkAt = 0;
  private alive = true;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => {
      if (e.data === "stop") this.alive = false;
    };
  }

  process(inputs: Float32Array[][]): boolean {
    const ch = inputs[0]?.[0];
    if (!ch) return this.alive;
    for (let i = 0; i < ch.length; i++) {
      this.lp1 += this.a * (ch[i] - this.lp1);
      this.lp2 += this.a * (this.lp1 - this.lp2);
      const y = this.lp2;
      while (this.next <= this.count) {
        // Linear interpolation between the previous input sample (count − 1) and this one (count).
        const frac = this.next - (this.count - 1);
        if (this.n === 0) this.chunkAt = currentTime + i / sampleRate;
        this.buf[this.n++] = this.prev + (y - this.prev) * frac;
        this.next += this.ratio;
        if (this.n === CHUNK) {
          this.port.postMessage({ t: this.chunkAt, x: this.buf }, [this.buf.buffer]);
          this.buf = new Float32Array(CHUNK);
          this.n = 0;
        }
      }
      this.prev = y;
      this.count++;
    }
    return this.alive;
  }
}

registerProcessor("taxila-feature-tap", FeatureTap);

export {};
