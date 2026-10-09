// The THINKING-PAUSE cue (round 3, voicesig → duplex): "the child stopped on a filled pause (umm / aaa / uh), so this
// silence is a pause to think, not the end of the turn". Fillers hold the floor (Clark & Fox Tree 2002; Jiang, Ekstedt &
// Skantze 2023 measured the hold effect with VAP); they are turn-initial / medial and essentially never turn-final in
// Hindi / Urdu (Jabeen & Betz 2022). The STT often drops or misspells them, so the duplex engine's LEXICAL fillerTail
// misses exactly the case that matters; this cue hears the filler itself, from the same shared front-end frames and the
// same filled-pause detector the voicesig head runs (models/voicesig/filler-gru*). Floor timing only: it is never a state
// of mind, never stored, never shown (ct-no-voice-emotion-inference, restriction 12).
//
// Contract with duplex (no file of src/duplex is edited here): the cue PUBLISHES an AcousticEstimate-shaped object
// ({ atMs, pComplete, pHoldWanted, model, computeMs }) on every 20 ms frame while the pause it read is open, and nothing
// otherwise. The engine treats an acoustic estimate as fresh for ACOUSTIC_FRESH_MS (300 ms), so the cue goes stale by
// itself within 300 ms of the child speaking again or of maxHoldMs passing. pComplete is the MEASURED P(turn end | cue
// fired) on real adult speech (evals/voicesig/r3/pauses.mjs), never a guess; it is never >= 0.5, so the cue can only ever
// argue for waiting, never vouch that a turn ended (HORIZON_ACOUSTIC_P stays out of its reach by construction).
//
// Pure logic (HoldCueCore) + a thin async driver (HoldCue) that runs the detector graph once per pause. Deterministic
// given the frames and the detector output, so the eval harness runs the exact same code as the lesson.
import { FILLER_MIN_MS } from "./frontend/gruInput.ts";
import type { AudioFrame, MicClass } from "./types.ts";

export const HOLD_CUE_VER = "vs-hold/1";

export interface HoldCueConfig {
  /** Frame probability threshold of the filler detector (the model card's operating point). */
  thr: number;
  /** A filler run is at least this long (ms of consecutive speech frames >= thr). Same floor as the head's runs. */
  minFillerMs: number;
  /** The filler run must end within this many ms of the voice offset ("…umm" + silence, not "umm, five" + silence). */
  tailGapMs: number;
  /** Silence the cue waits for before reading the pause (the bi-GRU's backward half needs a little silence). */
  readAfterMs: number;
  /** Detector window before the offset. */
  windowMs: number;
  /** The cue stops publishing this long into the pause (the governor's stretched backstop takes over). */
  maxHoldMs: number;
  /** Voiced run needed before a pause counts (a cough or a click is not a turn). */
  minVoicedMs: number;
  /** MEASURED P(turn end | cue fired); clamped below 0.5 (the cue argues for waiting only). */
  pComplete: number;
  pHoldWanted: number;
}

/**
 * Defaults. thr / pComplete are replaced from the model card and the pause eval when the cue is wired (the glue passes
 * them); these values are the round-3 measurement (evals/voicesig/results/2026-10-09/pauses-*.json).
 */
export const HOLD_CUE_DEFAULTS: HoldCueConfig = Object.freeze({
  thr: 0.44, minFillerMs: FILLER_MIN_MS, tailGapMs: 120, readAfterMs: 120, windowMs: 3000, maxHoldMs: 4000, minVoicedMs: 200,
  pComplete: 0.2, pHoldWanted: 0.8,
});

/** Routes where the detector is unusable (narrowband: event recall 0.15, precision 0.31 on the AMI capture-chain check). */
export const HOLD_CUE_OFF_MICS: ReadonlySet<MicClass> = new Set<MicClass>(["bt", "speaker_route"]);

/** The duplex-facing estimate (structurally src/duplex/engine.ts AcousticEstimate; no import, so neither owns the other). */
export interface HoldEstimate {
  atMs: number;
  pComplete: number;
  pHoldWanted: number;
  model: string;
  computeMs: number;
}

/** What the core asks its driver to do on a frame. */
export type HoldAction =
  | { kind: "none" }
  /** Run the detector over these frames' GRU inputs (indices into the core's ring snapshot) and call result(). */
  | { kind: "read"; pauseId: number; x: Float32Array; frames: number; offsetIdx: number }
  /** Publish this estimate to duplex now. */
  | { kind: "publish"; est: HoldEstimate };

interface Hop { t: number; speech: boolean; x: Float32Array }

/** Find whether a filled-pause run ends within tailGap of the window's last speech frame. Exported for tests and evals. */
export function trailingFiller(speech: ArrayLike<boolean>, p: ArrayLike<number>, offsetIdx: number, cfg: Pick<HoldCueConfig, "thr" | "minFillerMs" | "tailGapMs">, hopMs = 20): { fired: boolean; runMs: number; gapMs: number } {
  const need = Math.ceil(cfg.minFillerMs / hopMs);
  const maxGap = Math.floor(cfg.tailGapMs / hopMs);
  // walk back from the offset: the last run of speech frames with p >= thr
  let end = -1;
  for (let i = offsetIdx; i >= Math.max(0, offsetIdx - maxGap); i--) {
    if (speech[i] && p[i] >= cfg.thr) { end = i; break; }
  }
  if (end < 0) return { fired: false, runMs: 0, gapMs: 0 };
  let s = end;
  while (s - 1 >= 0 && speech[s - 1] && p[s - 1] >= cfg.thr) s--;
  const runMs = (end - s + 1) * hopMs;
  return { fired: end - s + 1 >= need, runMs, gapMs: (offsetIdx - end) * hopMs };
}

/**
 * The cue's state machine. Feed every 20 ms frame (with its GRU input vector and whether her audio is audible at the
 * device); it returns what to do. Pure: no clock, no I/O.
 */
export class HoldCueCore {
  readonly cfg: HoldCueConfig;
  private ring: Hop[] = [];
  private voicedRunMs = 0;
  private shortGapMs = 0;
  private offsetT: number | null = null;
  private pauseId = 0;
  private asked = false;
  /** null = no reading yet for this pause; true / false = the detector's answer. */
  private holding: boolean | null = null;
  private computeMs = 0;
  /** Counters for the shadow log (numbers only). */
  readonly stats = { pauses: 0, read: 0, fired: 0, published: 0 };

  constructor(cfg: Partial<HoldCueConfig> = {}) {
    const c = { ...HOLD_CUE_DEFAULTS, ...cfg };
    c.pComplete = Math.min(0.49, Math.max(0.01, c.pComplete));
    this.cfg = c;
  }

  private get ringMax(): number { return Math.ceil((this.cfg.windowMs + this.cfg.readAfterMs + 200) / 20); }

  frame(f: AudioFrame, x: Float32Array, herAudible = false): HoldAction {
    this.ring.push({ t: f.t, speech: f.speech && !herAudible, x });
    // trim in blocks (amortised O(1) per hop, not a shift of the whole window every 20 ms)
    if (this.ring.length > 2 * this.ringMax) this.ring.splice(0, this.ring.length - this.ringMax);
    if (herAudible) { this.reset(); return { kind: "none" }; }
    if (f.speech) {
      // the child is speaking: a pause that was READ is over (its estimate goes stale on its own within 300 ms) and a new
      // voiced run starts; a gap shorter than readAfterMs was a flicker inside the run, which keeps counting
      if (this.offsetT !== null) {
        const read = this.asked;
        this.offsetT = null; this.asked = false; this.holding = null;
        if (read) this.voicedRunMs = 0;
      }
      this.voicedRunMs += 20;
      this.shortGapMs = 0;
      return { kind: "none" };
    }
    if (this.offsetT === null) {
      if (this.voicedRunMs < this.cfg.minVoicedMs) {
        // too little voice so far: a click, or a run broken by a one-hop flicker; only a real silence forgets it
        this.shortGapMs += 20;
        if (this.shortGapMs >= this.cfg.readAfterMs) this.voicedRunMs = 0;
        return { kind: "none" };
      }
      this.offsetT = f.t;
      this.pauseId++;
      this.asked = false;
      this.holding = null;
    }
    const age = f.t - this.offsetT;
    if (!this.asked && age >= this.cfg.readAfterMs) {
      this.asked = true;
      this.voicedRunMs = 0;
      this.stats.pauses++;
      const from = Math.max(0, this.ring.length - Math.ceil((this.cfg.windowMs + age) / 20) - 1);
      const hops = this.ring.slice(from);
      const dim = hops[0].x.length;
      const xs = new Float32Array(hops.length * dim);
      hops.forEach((h, i) => xs.set(h.x, i * dim));
      // the offset = the last speech frame before the pause
      let offsetIdx = hops.length - 1;
      while (offsetIdx > 0 && !hops[offsetIdx].speech) offsetIdx--;
      this.snapshot = hops.map((h) => h.speech);
      this.stats.read++;
      return { kind: "read", pauseId: this.pauseId, x: xs, frames: hops.length, offsetIdx };
    }
    if (this.holding === true && age <= this.cfg.maxHoldMs) {
      this.stats.published++;
      return { kind: "publish", est: { atMs: f.t, pComplete: this.cfg.pComplete, pHoldWanted: this.cfg.pHoldWanted, model: HOLD_CUE_VER, computeMs: this.computeMs } };
    }
    return { kind: "none" };
  }

  private snapshot: boolean[] = [];

  /** The detector's per-frame probabilities for a "read" action. Late results for an old pause are ignored. */
  result(pauseId: number, p: ArrayLike<number>, offsetIdx: number, computeMs = 0): { fired: boolean; runMs: number; gapMs: number } | null {
    if (pauseId !== this.pauseId || this.offsetT === null) return null;
    const r = trailingFiller(this.snapshot, p, offsetIdx, this.cfg);
    this.holding = r.fired;
    this.computeMs = computeMs;
    if (r.fired) this.stats.fired++;
    return r;
  }

  /** Whether the open pause currently reads as a thinking pause (for logs and tests). */
  get thinking(): boolean { return this.holding === true; }

  reset(): void {
    this.offsetT = null;
    this.asked = false;
    this.holding = null;
    this.voicedRunMs = 0;
    this.shortGapMs = 0;
  }
}

export interface HoldDetector {
  /** Per-frame P(filled pause) for x [T × dim]. May be sync (evals) or async (onnxruntime-web on the device). */
  detect(x: Float32Array, T: number): Promise<Float32Array> | Float32Array;
}

/**
 * The driver the lesson glue uses: frames in, estimates out through `onEstimate`. The detector runs at most once per
 * pause, off the audio thread; a late answer for a pause that already ended is dropped. Never throws into the caller.
 */
export class HoldCue {
  readonly core: HoldCueCore;
  private readonly det: HoldDetector;
  private readonly emit: (e: HoldEstimate) => void;
  private readonly now: () => number;
  private readonly onRead?: (r: { fired: boolean; runMs: number; gapMs: number; computeMs: number }) => void;
  disabled = false;

  constructor(o: { detector: HoldDetector; onEstimate: (e: HoldEstimate) => void; cfg?: Partial<HoldCueConfig>; micClass?: MicClass; now?: () => number;
    onRead?: (r: { fired: boolean; runMs: number; gapMs: number; computeMs: number }) => void }) {
    this.core = new HoldCueCore(o.cfg);
    this.det = o.detector;
    this.emit = o.onEstimate;
    this.now = o.now ?? (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
    this.onRead = o.onRead;
    if (o.micClass && HOLD_CUE_OFF_MICS.has(o.micClass)) this.disabled = true;
  }

  frame(f: AudioFrame, x: Float32Array, herAudible = false): void {
    if (this.disabled) return;
    try {
      const a = this.core.frame(f, x, herAudible);
      if (a.kind === "publish") this.emit(a.est);
      else if (a.kind === "read") {
        const t0 = this.now();
        const done = (p: Float32Array) => {
          const ms = this.now() - t0;
          const r = this.core.result(a.pauseId, p, a.offsetIdx, ms);
          if (r) this.onRead?.({ ...r, computeMs: ms });
        };
        const out = this.det.detect(a.x, a.frames);
        if (out instanceof Float32Array) done(out);
        else out.then(done, () => {});
      }
    } catch {
      // a broken cue is no cue: duplex keeps deciding on its own evidence
      this.disabled = true;
    }
  }
}
