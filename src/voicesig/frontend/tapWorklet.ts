// The ONE AudioWorklet tap of the shared front-end (SPEC §2.2): processor "taxila-tap2", numberOfInputs 2.
//   input 0 = P, the existing processed capture (AEC/NS/AGC on): STT's track, f0, VAD, the encoder.
//   input 1 = R, an optional second getUserMedia track with AGC and NS off (SPEC §2.1): RMS only.
// The audio thread does ONLY anti-alias + decimate to 16 kHz on both inputs and posts 20 ms chunks {t, p, r?}; analysis
// stays off the audio thread (the inherited "CPU contention on mid-range Android" failure class). Same filter and
// interpolation as src/voice/featureWorklet.ts, so P samples here equal the samples that worklet would have produced.
// Nothing here talks to the network.

declare const sampleRate: number;
declare const currentTime: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}
declare function registerProcessor(name: string, ctor: new () => AudioWorkletProcessor): void;

const OUT_RATE = 16_000;
const CHUNK = 320; // 20 ms at 16 kHz

/** One decimator per input (state must not be shared between P and R). */
class Decimator {
  private readonly ratio = sampleRate / OUT_RATE;
  private readonly a = 1 - Math.exp((-2 * Math.PI * 5000) / sampleRate);
  private lp1 = 0;
  private lp2 = 0;
  private prev = 0;
  private count = 0;
  private next = 0;

  /** Append decimated samples of `ch` to `sink(y, inputIndex)`. */
  run(ch: Float32Array, sink: (y: number, i: number) => void): void {
    for (let i = 0; i < ch.length; i++) {
      this.lp1 += this.a * (ch[i] - this.lp1);
      this.lp2 += this.a * (this.lp1 - this.lp2);
      const y = this.lp2;
      while (this.next <= this.count) {
        const frac = this.next - (this.count - 1);
        sink(this.prev + (y - this.prev) * frac, i);
        this.next += this.ratio;
      }
      this.prev = y;
      this.count++;
    }
  }
}

class Tap2 extends AudioWorkletProcessor {
  private readonly dp = new Decimator();
  private dr = new Decimator();
  private p = new Float32Array(CHUNK);
  private np = 0;
  /** R FIFO: both decimators start together at the same ratio, so the k-th R sample is the k-th P sample's twin. */
  private readonly rq = new Float32Array(CHUNK * 8);
  private rw = 0;
  private rr = 0;
  private rSeen = false;
  /** Chunks whose R part is incomplete (R joined mid-chunk): sent without r. */
  private rSkip = 0;
  private chunkAt = 0;
  private alive = true;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => {
      if (e.data === "stop") this.alive = false;
    };
  }

  process(inputs: Float32Array[][]): boolean {
    const P = inputs[0]?.[0];
    const R = inputs[1]?.[0];
    if (!P) return this.alive;
    // R is decimated in lock-step with P (same render quantum, same rate), so chunk k of R covers chunk k of P.
    if (R && R.length === P.length) {
      if (!this.rSeen) {
        // R joins mid-chunk: pad its FIFO to P's position in the chunk, and do not send that first, partial chunk.
        this.dr = new Decimator();
        this.rw = this.rr = 0;
        for (let k = 0; k < this.np; k++) this.rq[this.rw++] = 0;
        this.rSkip = 1;
      }
      this.rSeen = true;
      this.dr.run(R, (y) => { this.rq[this.rw++ % this.rq.length] = y; });
    } else if (this.rSeen) {
      // R went away (track ended): drop the FIFO; a returning R restarts aligned only with a fresh decimator.
      this.rSeen = false;
      this.rw = this.rr = 0;
    }
    this.dp.run(P, (y, i) => {
      if (this.np === 0) this.chunkAt = currentTime + i / sampleRate;
      this.p[this.np++] = y;
      if (this.np === CHUNK) {
        const msg: { t: number; p: Float32Array; r?: Float32Array } = { t: this.chunkAt, p: this.p };
        const transfer: ArrayBuffer[] = [this.p.buffer as ArrayBuffer];
        if (this.rSeen && this.rw - this.rr >= CHUNK) {
          const r = new Float32Array(CHUNK);
          for (let k = 0; k < CHUNK; k++) r[k] = this.rq[this.rr++ % this.rq.length];
          if (this.rSkip > 0) this.rSkip--;
          else {
            msg.r = r;
            transfer.push(r.buffer as ArrayBuffer);
          }
        }
        this.port.postMessage(msg, transfer);
        this.p = new Float32Array(CHUNK);
        this.np = 0;
      }
    });
    return this.alive;
  }
}

registerProcessor("taxila-tap2", Tap2);

export {};
