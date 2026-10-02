// A small on-device energy VAD for the cascade lane. It is NOT the turn detector — Azure's server VAD
// (threshold 0.6, 900 ms silence) owns endpointing. This one exists for the two things a network round trip
// is too slow for:
//   1. barge-in: the child starts talking over the teacher → "onset" ducks her voice (~90 ms of voiced
//      energy), and "sustain" (~120 ms, still loud) pauses her — both before the server's speech_started
//      arrives (~200-500 ms after onset), which then confirms (or, if it never comes, she resumes);
//   2. a diagnostic count of push-to-talk presses it never heard (it no longer gates the upload: a soft child
//      under AGC may never clear its threshold, and ASR decides what was said).
// The decision logic is pure (frames of RMS in, onset/offset out) so it is tested in Node; `MicVad` polls an
// AnalyserNode on a timer (not rAF: a background tab throttles rAF, and the floor must still hear).

export interface VadOptions {
  /** Onset needs the level this many dB above the running noise floor. */
  onsetDb?: number;
  /** ...for this long (ms) — a cough or a click is shorter. */
  onsetMs?: number;
  /** Offset after this long below (floor + offsetDb). */
  offsetMs?: number;
  offsetDb?: number;
  /** Absolute floor: nothing quieter than this (dBFS) is speech, however quiet the room. */
  minDb?: number;
  /** "sustain" once per utterance when the level has stayed loud this long (ms) without a break. */
  sustainMs?: number;
}

const DEFAULTS: Required<VadOptions> = { onsetDb: 14, onsetMs: 90, offsetMs: 400, offsetDb: 8, minDb: -52, sustainMs: 120 };

export type VadEvent = "onset" | "sustain" | "offset" | null;

export class EnergyVad {
  readonly opts: Required<VadOptions>;
  /** Running noise floor estimate (dBFS). */
  floorDb = -60;
  speaking = false;
  private above = 0;
  private below = 0;
  /** Consecutive loud ms (in either state) and whether this utterance already sent "sustain". */
  private run = 0;
  private sustained = false;

  constructor(opts: VadOptions = {}) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  /** One frame: its RMS (linear 0..1) and length in ms. Returns an edge, or null. */
  push(rms: number, frameMs: number): VadEvent {
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;
    const o = this.opts;
    // The floor follows quiet frames quickly and loud ones very slowly, so speech does not become "noise".
    if (!this.speaking) this.floorDb += (db - this.floorDb) * (db < this.floorDb ? 0.3 : 0.01);
    this.floorDb = Math.max(-90, Math.min(-25, this.floorDb));
    const loud = db >= Math.max(o.minDb, this.floorDb + o.onsetDb);
    const quiet = db < Math.max(o.minDb, this.floorDb + o.offsetDb);
    this.run = loud ? this.run + frameMs : 0;
    if (!this.speaking) {
      this.above = loud ? this.above + frameMs : 0;
      if (this.above >= o.onsetMs) {
        this.speaking = true;
        this.sustained = false;
        this.below = 0;
        return "onset";
      }
      return null;
    }
    if (!this.sustained && this.run >= o.sustainMs) {
      this.sustained = true;
      return "sustain";
    }
    this.below = quiet ? this.below + frameMs : 0;
    if (this.below >= o.offsetMs) {
      this.speaking = false;
      this.above = 0;
      return "offset";
    }
    return null;
  }

  reset(): void {
    this.speaking = false;
    this.sustained = false;
    this.above = this.below = this.run = 0;
  }
}

export function rmsOf(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / (buf.length || 1));
}

/** Browser: an EnergyVad fed from an analyser on the mic, every `frameMs`. */
export class MicVad {
  readonly vad: EnergyVad;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly buf: Float32Array<ArrayBuffer>;
  private readonly analyser: AnalyserNode;
  private readonly onEdge: (e: "onset" | "sustain" | "offset", at: number) => void;
  private readonly frameMs: number;

  // No constructor parameter properties: Node strips these types on import, and only erasable syntax strips.
  constructor(analyser: AnalyserNode, onEdge: (e: "onset" | "sustain" | "offset", at: number) => void, opts: VadOptions = {}, frameMs = 20) {
    this.analyser = analyser;
    this.onEdge = onEdge;
    this.frameMs = frameMs;
    this.vad = new EnergyVad(opts);
    this.buf = new Float32Array(analyser.fftSize);
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.analyser.getFloatTimeDomainData(this.buf);
      const e = this.vad.push(rmsOf(this.buf), this.frameMs);
      if (e) this.onEdge(e, Date.now());
    }, this.frameMs);
  }

  get speaking(): boolean {
    return this.vad.speaking;
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.vad.reset();
  }
}
