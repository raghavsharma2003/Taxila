// lamp2 key scheduling: which painted key each region shows, frame by frame. Pure, DOM-free, framework-free (the evals
// and the unit tests run it headless). Rules: docs/design/round4/asha/rig2/RESEARCH.md (R7-R15).
//   mouth  Diya's 15 visemes (+ the jaw when only the tap drives) collapsed to 10 painted mouths; a key is held at least
//          HOLD_MS before the next (a bilabial seal always lands at once); swaps crossfade over FADE_MS, eased.
//   eyes   our own blink schedule (gamma intervals, ~17/min, advanced to speech pauses), each blink four held cels
//          (half, closed, closed, half); gaze is a swap to a painted look key, with hysteresis and a minimum hold.
//   brows  neutral / raised / concern from the expression layer's brow channels, slow crossfade.
//   head   rigid only: roll and yaw become a rotation within +-2 degrees about the neck and a sway of the whole figure,
//          pitch a few px of nod; breathing a sub-pixel vertical scale of the body.
// Never a warp: every pixel the child sees is a painted key or the painted front.

export type MouthKey = "rest" | "calm" | "smile" | "mbp" | "aa" | "eh" | "ee" | "oh" | "oo" | "fv" | "ltd";
export type EyeKey = "open" | "half" | "closed" | "lookL" | "lookR" | "lookUp";
export type BrowKey = "neutral" | "raised" | "concern";

/** The mouth swap crossfade (ms), under the brief's 60-90 ms cap. J1 (60 ms): 2 of 6 consecutive 15 fps frames landed mid-dissolve and the judges read the double teeth as "swimming"; P1 took 45 ms; v3 30 ms (battery.mjs sweep: 67% of lines within +-50 ms vs 57% at 45 ms, seals 132/132). */
export const FADE_MS = 30;
/** The shortest a mouth drawing stays up (ms) before the next replaces it: ~2 frames at 24 fps (anime "on twos"). */
export const HOLD_MS = 70;
/** A seal may give way sooner: the next sound's mouth must not be late. */
export const SEAL_HOLD_MS = 45;
export const EYE_FADE_MS = 45;
export const BROW_FADE_MS = 200;

/** ms the host adds to the viseme scheduler's lead (PuppetDriver.visemes.lead, track.ts EVENT_LEAD_MS) for this rig: a
 *  key switches when the next viseme's weight overtakes the last and then dissolves, so without it the painted mouth runs
 *  later than the continuous mouth the judged timing was set on (battery.mjs, 24 Diya lines). Never applied to the audio
 *  tap path. */
export const KEY_LEAD_MS = 35;

/** Drawn mouth openness per key (0 closed .. 1 the aa key), for the lip-sync offset estimator. */
export const KEY_OPENNESS: Record<MouthKey, number> = { rest: 0, calm: 0, smile: 0, mbp: 0, aa: 1, eh: 0.55, ee: 0.35, oh: 0.75, oo: 0.35, fv: 0.15, ltd: 0.3 };

/** Contract viseme -> painted mouth (RESEARCH.md §4). viseme_aa splits on its weight (Azure's schwa is aa at 0.6). */
const VIS_KEY: Record<string, MouthKey> = {
  viseme_PP: "mbp", viseme_FF: "fv", viseme_TH: "ltd", viseme_DD: "ltd", viseme_nn: "ltd", viseme_kk: "eh", viseme_CH: "ee",
  viseme_SS: "ee", viseme_RR: "eh", viseme_E: "eh", viseme_I: "ee", viseme_O: "oh", viseme_U: "oo", viseme_aa: "aa",
};

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

export interface Swap<K extends string> { a: K; b: K; k: number }

/** One region's displayed state: a key, or a crossfade from `a` to `b`. */
class Fader<K extends string> {
  a: K; b: K; t0 = -1e9; fadeMs: number; shownAt = -1e9;
  constructor(k: K, fadeMs: number) { this.a = k; this.b = k; this.fadeMs = fadeMs; }
  k(tMs: number): number { return this.fadeMs <= 0 ? 1 : smooth((tMs - this.t0) / this.fadeMs); }
  /** The key the eye sees most of right now. */
  cur(tMs: number): K { return this.k(tMs) >= 0.5 ? this.b : this.a; }
  go(to: K, tMs: number, fadeMs = this.fadeMs): void {
    if (to === this.b) return;
    // mid-fade: start the new fade from whichever key dominates (never three keys on screen)
    this.a = this.cur(tMs);
    this.b = to;
    this.fadeMs = fadeMs;
    this.t0 = tMs;
    this.shownAt = tMs;
    if (this.a === to) this.t0 = -1e9;
  }
  read(tMs: number): Swap<K> { const k = this.k(tMs); return k >= 1 ? { a: this.b, b: this.b, k: 1 } : { a: this.a, b: this.b, k }; }
}

export interface MouthInput {
  bs: Record<string, number>;
  /** True while the face is in a safety turn (calm_steady): the closed mouth is the calm neutral, never the smile. */
  calm?: boolean;
}

export interface MouthTiming { fadeMs?: number; holdMs?: number; sealHoldMs?: number }

export class MouthKeys {
  private f: Fader<MouthKey>;
  private fadeMs: number;
  private holdMs: number;
  private sealHoldMs: number;
  /** Timing overrides are for the evals (battery.mjs sweeps); the rig uses the defaults. */
  constructor(t: MouthTiming = {}) {
    this.fadeMs = t.fadeMs ?? FADE_MS; this.holdMs = t.holdMs ?? HOLD_MS; this.sealHoldMs = t.sealHoldMs ?? SEAL_HOLD_MS;
    this.f = new Fader<MouthKey>("rest", this.fadeMs);
  }
  /** Every key change, for the evals (tMs, key). */
  log: Array<[number, MouthKey]> | null = null;
  last: MouthKey = "rest";

  /** The key the inputs ask for (no timing). */
  static target(inp: MouthInput): MouthKey {
    const bs = inp.bs;
    let best = 0, key: MouthKey | null = null;
    for (const v in VIS_KEY) { const w = bs[v] ?? 0; if (w > best) { best = w; key = VIS_KEY[v]; } }
    // a bilabial at half weight already wins: the seal is the cue the eye checks first (RESEARCH R8, R10)
    if ((bs.viseme_PP ?? 0) >= 0.5) return "mbp";
    if (key && best >= 0.3) {
      if (key === "aa") return (bs.viseme_aa ?? 0) >= 0.75 ? "aa" : "eh";
      return key;
    }
    // no viseme: the jaw (the audio tap or level path) picks an open / half / slight mouth
    const jaw = bs.jawOpen ?? 0;
    // (the listening preset parts the lips at jaw ~0.13 with no voice: that stays a closed mouth)
    if (jaw >= 0.32) return "aa";
    if (jaw >= 0.2) return "eh";
    if (jaw >= 0.15) return "ltd";
    const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
    if (inp.calm) return "calm";
    return smile >= 0.3 ? "smile" : "rest";
  }

  step(tMs: number, inp: MouthInput): Swap<MouthKey> {
    const want = MouthKeys.target(inp);
    const shown = this.f.b;
    if (want !== shown) {
      const held = tMs - this.f.shownAt;
      const need = want === "mbp" ? 0 : shown === "mbp" ? this.sealHoldMs : this.holdMs;
      // a smile / calm / rest change is an expression, not speech: a slower dissolve
      const expr = (want === "smile" || shown === "smile") && !(want in SPEECH) && !(shown in SPEECH);
      if (held >= need) { this.f.go(want, tMs, expr ? 180 : this.fadeMs); this.log?.push([tMs, want]); }
    }
    this.last = this.f.cur(tMs);
    return this.f.read(tMs);
  }

  openness(tMs: number): number {
    const s = this.f.read(tMs);
    return KEY_OPENNESS[s.a] * (1 - s.k) + KEY_OPENNESS[s.b] * s.k;
  }
}
const SPEECH: Record<string, true> = { mbp: true, aa: true, eh: true, ee: true, oh: true, oo: true, fv: true, ltd: true };

/** Deterministic PRNG (mulberry32), so the evals and the clips repeat. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gamma3 = (r: () => number, mean: number) => { let s = 0; for (let i = 0; i < 3; i++) s -= Math.log(1 - r()); return (s / 3) * mean; };

/** Blink cels (ms from the blink's start): half, closed (held), half, then open. ~190 ms, closing faster than opening. */
export const BLINK_CELS: ReadonlyArray<[number, EyeKey]> = [[0, "half"], [35, "closed"], [115, "half"], [190, "open"]];
/** Mean blinks per minute by activity (RESEARCH R11: 15-20 a minute). */
export const BLINKS_PER_MIN = { speaking: 19, quiet: 16 };

export interface EyeInput {
  gaze: number[];
  speaking: boolean;
  reduced?: boolean;
}

export class EyeKeys {
  private r: () => number;
  private next = NaN;
  private start = -1e9;
  private lastEnd = -1e9;
  private gazeKey: EyeKey = "open";
  private gazeSince = -1e9;
  private f = new Fader<EyeKey>("open", EYE_FADE_MS);
  private wasSpeaking = false;
  private speakSince = 0;
  blinks: number[] = [];

  constructor(seed = 11) { this.r = rng(seed); }

  private schedule(tMs: number, speaking: boolean): void {
    const mean = 60000 / (speaking ? BLINKS_PER_MIN.speaking : BLINKS_PER_MIN.quiet);
    this.next = tMs + Math.max(900, gamma3(this.r, mean));
  }

  get blinking(): boolean { return this.start > this.lastEnd; }

  step(tMs: number, inp: EyeInput): Swap<EyeKey> {
    // the first blink 1.2-3.2 s after the face first draws
    if (Number.isNaN(this.next)) this.next = tMs + 1200 + this.r() * 2000;
    // pauses: a phrase end after >= 0.6 s of speech pulls an imminent blink forward (speakers blink at pauses)
    if (this.wasSpeaking && !inp.speaking && tMs - this.speakSince > 600 && tMs - this.lastEnd > 1200 && this.next - tMs < 2200 && this.r() < 0.75) this.next = tMs + 60;
    if (inp.speaking && !this.wasSpeaking) this.speakSince = tMs;
    this.wasSpeaking = inp.speaking;
    // gaze key, with hysteresis (in at 9 deg yaw / 7 deg up, out at 5 / 4) and a 250 ms minimum hold
    const [yaw, pitch] = [inp.gaze[0] ?? 0, inp.gaze[1] ?? 0];
    let g: EyeKey = this.gazeKey;
    const inUp = pitch >= 7, inR = yaw >= 9, inL = yaw <= -9;
    // v3 K2: a side glance wins over the upward one (every round's judges read the up-glance as "misaligned pupils")
    if (g === "open") g = inR ? "lookR" : inL ? "lookL" : inUp ? "lookUp" : "open";
    else if (g === "lookUp" && pitch < 4) g = yaw >= 9 ? "lookR" : yaw <= -9 ? "lookL" : "open";
    else if (g === "lookR" && yaw < 5) g = inUp ? "lookUp" : inL ? "lookL" : "open";
    else if (g === "lookL" && yaw > -5) g = inUp ? "lookUp" : inR ? "lookR" : "open";
    if (g !== this.gazeKey && tMs - this.gazeSince >= 250) {
      // a big gaze shift brings a blink with it often (gaze-evoked blink)
      if (!this.blinking && tMs - this.lastEnd > 900 && this.r() < 0.4) this.next = tMs;
      this.gazeKey = g; this.gazeSince = tMs;
    }
    // blinks
    if (!this.blinking && tMs >= this.next) { this.start = tMs; this.blinks.push(tMs); }
    if (this.blinking) {
      const u = tMs - this.start;
      let cel: EyeKey = "half";
      for (const [at, k] of BLINK_CELS) if (u >= at) cel = k;
      if (cel === "open") { this.lastEnd = tMs; this.schedule(tMs, inp.speaking); }
      else { this.f.go(cel, tMs, 0); return this.f.read(tMs); }
    }
    // after a blink the eyes open straight onto the gaze key (a hard cut, as the blink's own cels)
    const fromBlink = this.f.b === "half" || this.f.b === "closed";
    this.f.go(this.gazeKey, tMs, fromBlink ? 0 : EYE_FADE_MS);
    return this.f.read(tMs);
  }
}

export class BrowKeys {
  private f = new Fader<BrowKey>("neutral", BROW_FADE_MS);
  private want: BrowKey = "neutral";
  private since = -1e9;

  /** `lookingUp`: the thinking glance keeps level brows (an upward look under raised brows reads as surprise). */
  static target(bs: Record<string, number>, calm = false, lookingUp = false): BrowKey {
    const inner = bs.browInnerUp ?? 0;
    const outer = ((bs.browOuterUpLeft ?? 0) + (bs.browOuterUpRight ?? 0)) / 2;
    const down = ((bs.browDownLeft ?? 0) + (bs.browDownRight ?? 0)) / 2;
    const wide = ((bs.eyeWideLeft ?? 0) + (bs.eyeWideRight ?? 0)) / 2;
    if (calm) return "neutral";
    if (inner >= 0.3 && outer < 0.2 && inner > outer + 0.15) return "concern";
    if (down >= 0.35 && inner >= 0.15) return "concern";
    if (lookingUp) return "neutral";
    if (outer >= 0.22 || wide >= 0.3 || (inner >= 0.25 && outer >= 0.15)) return "raised";
    return "neutral";
  }
  step(tMs: number, bs: Record<string, number>, calm = false, lookingUp = false): Swap<BrowKey> {
    const w = BrowKeys.target(bs, calm, lookingUp);
    if (w !== this.want) { this.want = w; this.since = tMs; }
    // a brow change must be wanted for 120 ms (expression ramps cross the thresholds once, not back and forth)
    if (this.want !== this.f.b && tMs - this.since >= 120) this.f.go(this.want, tMs);
    return this.f.read(tMs);
  }
}

/** Rigid motion budget (RESEARCH R12, R13), native px of the front and degrees. */
// P2 (J2: the head sat on the +-2 deg clamp in listening and thinking, and the judges read the tilted painting as
// "features sliding over the collar"): half the roll, a lower cap, slower easing. P3 tried more (roll cap 1.5, a sway
// toward each glance, brow flashes at phrase onsets) and J4 read it as "proportions swim" (uncanny 2/5): reverted.
// v3 (J3-Jfinal "static"; painted turn keys could not register, evidence/v3-turnkeys-dissolve.webp): life from the body
// instead: the breath lifts the shoulders ~0.6 native px and the head rides it (0.0022 -> 0.005).
// v3 K2 (K1 Kimi 2/2: "add natural head and neck movement"): more TRANSLATION (nod, sway), which moves the painting
// without resampling it the way a roll does; the roll cap stays 1.2.
export const MOTION = { rotMaxDeg: 1.2, swayMaxPx: 3.5, nodMaxPx: 3.5, breathScale: 0.005 } as const;

export interface Pose { rot: number; sway: number; nod: number; breath: number; lean: number; drift: number }

export class HeadMotion {
  private p: Pose = { rot: 0, sway: 0, nod: 0, breath: 0, lean: 0, drift: 0 };
  private lastMs = -1;
  /** `gaze` (v3 K3): the figure leans a little toward a glance (eye-head coordination, rigid). */
  step(tMs: number, head: number[], lean: number, breath: number, reduced = false, gaze: number[] = [0, 0]): Pose {
    const dt = this.lastMs < 0 ? 16 : clamp(tMs - this.lastMs, 0, 250);
    this.lastMs = tMs;
    const m = reduced ? 0.3 : 1;
    const [pitch, yaw, roll] = [head[0] ?? 0, head[1] ?? 0, head[2] ?? 0];
    const want: Pose = {
      rot: clamp((roll * 0.3 + yaw * 0.04 + clamp(gaze[0] ?? 0, -20, 20) * 0.015) * m, -MOTION.rotMaxDeg, MOTION.rotMaxDeg),
      sway: clamp((yaw * 0.45 + clamp(gaze[0] ?? 0, -20, 20) * 0.06) * m, -MOTION.swayMaxPx, MOTION.swayMaxPx),
      nod: clamp(pitch * 0.5 * m, -MOTION.nodMaxPx, MOTION.nodMaxPx),
      breath: clamp(breath, -1, 1),
      lean: clamp(Math.tanh(lean / 0.7) * m, -1, 1),
      // v3 K3: a very slow whole-figure drift (two incommensurate sines, +-0.8 native px): a person is never pinned
      drift: 0.8 * m * (0.6 * Math.sin(tMs / 1000 * 2 * Math.PI * 0.07) + 0.4 * Math.sin(tMs / 1000 * 2 * Math.PI * 0.113 + 1.3)),
    };
    const a = 1 - Math.exp(-dt / 110);
    for (const k of Object.keys(want) as Array<keyof Pose>) this.p[k] += (want[k] - this.p[k]) * (k === "breath" ? 1 : a);
    return { ...this.p };
  }
}
