// Incremental 80-bin log-mel of P (SPEC §2.2 logmel.ts): 16 kHz, 25 ms Hann window (n_fft 400), 10 ms hop, Slaney mel
// filters to 8 kHz, log10 with a 1e-10 floor. These are Whisper's feature-extractor constants, so the 8 s ring can feed the
// shared Smart Turn encoder (encoder.ts applies Whisper's per-window clamp `max(x, max−8)` and `(x+4)/4` at pass time).
// Streaming differs from Whisper's center=True STFT only in the first/last two frames of a window (reflect padding).
//
// Pure: no DOM, no clock. Also used offline by evals/voicesig/train/extract.mjs, so training features == product features.

export const MEL_RATE = 16_000;
export const N_FFT = 400;
export const MEL_HOP = 160;
export const N_MELS = 80;
export const N_BINS = N_FFT / 2 + 1;
/** Ring: 8 s of 10 ms frames (the Smart Turn window). */
export const MEL_RING_FRAMES = 800;

function hzToMel(f: number): number {
  const fsp = 200 / 3, minLogHz = 1000, minLogMel = minLogHz / fsp, logstep = Math.log(6.4) / 27;
  return f < minLogHz ? f / fsp : minLogMel + Math.log(f / minLogHz) / logstep;
}
function melToHz(m: number): number {
  const fsp = 200 / 3, minLogHz = 1000, minLogMel = minLogHz / fsp, logstep = Math.log(6.4) / 27;
  return m < minLogMel ? m * fsp : minLogHz * Math.exp(logstep * (m - minLogMel));
}

/** librosa.filters.mel(sr=16000, n_fft=400, n_mels=80, htk=False, norm="slaney"), row-major [N_MELS × N_BINS]. */
export function melFilters(): Float32Array {
  const w = new Float32Array(N_MELS * N_BINS);
  const mMin = hzToMel(0), mMax = hzToMel(MEL_RATE / 2);
  const hz = Array.from({ length: N_MELS + 2 }, (_, i) => melToHz(mMin + ((mMax - mMin) * i) / (N_MELS + 1)));
  for (let m = 0; m < N_MELS; m++) {
    const enorm = 2 / (hz[m + 2] - hz[m]);
    for (let k = 0; k < N_BINS; k++) {
      const f = (k * MEL_RATE) / N_FFT;
      const lower = (f - hz[m]) / (hz[m + 1] - hz[m]);
      const upper = (hz[m + 2] - f) / (hz[m + 2] - hz[m + 1]);
      w[m * N_BINS + k] = Math.max(0, Math.min(lower, upper)) * enorm;
    }
  }
  return w;
}

let tables: { cos: Float32Array; sin: Float32Array; win: Float32Array; mel: Float32Array; melLo: Int16Array; melHi: Int16Array } | null = null;
function getTables() {
  if (tables) return tables;
  const cos = new Float32Array(N_BINS * N_FFT), sin = new Float32Array(N_BINS * N_FFT);
  for (let k = 0; k < N_BINS; k++) for (let n = 0; n < N_FFT; n++) {
    const a = (2 * Math.PI * k * n) / N_FFT;
    cos[k * N_FFT + n] = Math.cos(a);
    sin[k * N_FFT + n] = Math.sin(a);
  }
  // Periodic Hann (torch.hann_window default).
  const win = new Float32Array(N_FFT);
  for (let n = 0; n < N_FFT; n++) win[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / N_FFT);
  const mel = melFilters();
  const melLo = new Int16Array(N_MELS), melHi = new Int16Array(N_MELS);
  for (let m = 0; m < N_MELS; m++) {
    let lo = N_BINS, hi = -1;
    for (let k = 0; k < N_BINS; k++) if (mel[m * N_BINS + k] > 0) { lo = Math.min(lo, k); hi = Math.max(hi, k); }
    melLo[m] = lo; melHi[m] = hi;
  }
  tables = { cos, sin, win, mel, melLo, melHi };
  return tables;
}

/** log10 mel spectrum of one 400-sample window (direct real DFT; ≈ 160k multiply-adds). */
export function logMelFrame(x: ArrayLike<number>, out = new Float32Array(N_MELS)): Float32Array {
  const T = getTables();
  const xw = new Float32Array(N_FFT);
  for (let n = 0; n < N_FFT; n++) xw[n] = (x[n] ?? 0) * T.win[n];
  const pow = new Float32Array(N_BINS);
  for (let k = 0; k < N_BINS; k++) {
    let re = 0, im = 0;
    const base = k * N_FFT;
    for (let n = 0; n < N_FFT; n++) { re += xw[n] * T.cos[base + n]; im -= xw[n] * T.sin[base + n]; }
    pow[k] = re * re + im * im;
  }
  for (let m = 0; m < N_MELS; m++) {
    let s = 0;
    for (let k = T.melLo[m]; k <= T.melHi[m]; k++) s += T.mel[m * N_BINS + k] * pow[k];
    out[m] = Math.log10(Math.max(s, 1e-10));
  }
  return out;
}

export interface MelFrame { t: number; v: Float32Array }

/**
 * Streaming log-mel. push() 16 kHz samples with the clock of their first sample; complete frames come back with the
 * clock of the window centre. `every` > 1 computes only every n-th frame (offline GRU extraction needs 20 ms; the
 * product ring for the encoder uses every = 1).
 */
export class LogMel {
  private buf = new Float32Array(N_FFT * 8);
  private len = 0;
  private t0 = 0;
  private idx = 0;
  private ring: MelFrame[] = [];
  private readonly every: number;
  private readonly phase: number;
  private readonly keep: number;
  /** `phase` picks which of every n frames is computed (offline: phase 1 of 2 centres mel on the 20 ms hop, ±2.5 ms). */
  constructor(every = 1, keep = MEL_RING_FRAMES, phase = 0) {
    this.every = every;
    this.keep = keep;
    this.phase = phase;
  }

  push(x: Float32Array, startMs: number): MelFrame[] {
    if (this.len === 0) this.t0 = startMs;
    else {
      const expected = this.t0 + (this.len / MEL_RATE) * 1000;
      if (Math.abs(startMs - expected) > 100) { this.len = 0; this.t0 = startMs; }
    }
    if (this.len + x.length > this.buf.length) {
      const nb = new Float32Array(Math.max(this.buf.length * 2, this.len + x.length));
      nb.set(this.buf.subarray(0, this.len));
      this.buf = nb;
    }
    this.buf.set(x, this.len);
    this.len += x.length;
    const out: MelFrame[] = [];
    let off = 0;
    while (this.len - off >= N_FFT) {
      if (this.idx++ % this.every === this.phase) {
        const f = { t: this.t0 + ((off + N_FFT / 2) / MEL_RATE) * 1000, v: logMelFrame(this.buf.subarray(off, off + N_FFT)) };
        out.push(f);
        this.ring.push(f);
      }
      off += MEL_HOP;
    }
    if (off > 0) {
      this.buf.copyWithin(0, off, this.len);
      this.len -= off;
      this.t0 += (off / MEL_RATE) * 1000;
    }
    if (this.ring.length > this.keep) this.ring.splice(0, this.ring.length - this.keep);
    return out;
  }

  /**
   * The last `frames` frames as Whisper input [N_MELS × frames] (row-major, mel-major like input_features), left-padded
   * with the window's floor, with Whisper's normalisation: x = max(x, max − 8); (x + 4) / 4.
   */
  whisperWindow(frames = MEL_RING_FRAMES): Float32Array {
    const src = this.ring.slice(-frames);
    let mx = -Infinity;
    for (const f of src) for (let m = 0; m < N_MELS; m++) if (f.v[m] > mx) mx = f.v[m];
    if (!Number.isFinite(mx)) mx = -10;
    const lo = mx - 8;
    const out = new Float32Array(N_MELS * frames).fill((lo + 4) / 4);
    const pad = frames - src.length;
    for (let j = 0; j < src.length; j++) for (let m = 0; m < N_MELS; m++) out[m * frames + pad + j] = (Math.max(src[j].v[m], lo) + 4) / 4;
    return out;
  }
}
