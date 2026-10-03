// The tutor's non-verbal behaviour (AVATAR.md §4, M0 subset): a typed port of
// docs/research/avatar/behaviour-proto/controller.mjs with the GR-1 fixes that M0 needs. Pure: no DOM, no three,
// seeded, so tests can run it frame by frame.
//
// M0 scope: the floor FSM (fed by floorState() below: tap VAD first, lesson status as the cross-check), gamma
// blinks with time-warp on state change, contact gaze with Andrist aversions, cognitive aversion in THINKING,
// listening tilt, YOUR TURN lean-in, accent nods on her prosody, brow flash at her onset, one armed expression.
// No random liveliness: every motion has a function. Not in M0 (M2): TurnClock yielding, module gaze targets,
// Director cue lists, the praise lexicon.
//
// Fixes carried from the reviews:
//  - TH-2 / GR-1.5: timers run on the caller's wall/audio clock (absolute seconds), never a clamped dt.
//  - GR-1.2: the head spring integrates in fixed 4 ms substeps and nod impulses are normalised so the PEAK equals
//    the requested degrees at any frame rate.
//  - GR-1.4: eye-in-head clamped to ±25° yaw / +20…−25° pitch; the remainder goes to the head (≤ 20°).
//  - §4.5: blink = max(autonomic blink, squint share), applied to BOTH lids equally (never summed, never one lid).
//  - I12: continuous mutual gaze is capped at 4 s.
//  - §6.5: reduced motion keeps blinks and lips, scales head drift and expressions ×0.3, no micro-saccades;
//    gentle face scales head and LOWER-face expression ×0.5 and never touches brows or blinks.
import { rng32 } from "../../shared/tutors.js";

export type FaceState = "idle" | "speaking" | "your_turn" | "listening" | "thinking";
export type FloorStatus = "listening" | "thinking" | "speaking" | "your_turn";
export type Emotion = "warm" | "curious" | "excited" | "concerned" | "proud";
export type BandKey = "b1" | "b2" | "b3" | "b4";

export interface BehaviourFrame {
  t: number;
  state: FaceState;
  /** Upper-face + expression ARKit weights (additive; the compositor clamps and gives lips priority). */
  bs: Record<string, number>;
  /** Head pitch (+ = chin down), yaw (+ = her left), roll, degrees. */
  head: [number, number, number];
  /** Eye-in-head yaw, pitch (+ = up), degrees, clamped. */
  gaze: [number, number];
  /** Forward lean 0..1 (YOUR TURN). */
  lean: number;
  gazeMode: "child" | "avert";
}

export interface BehaviourInput {
  /** Her tap RMS (raw full-scale). */
  herRms?: number;
  /** Her tap voicing (LipDriver.voiced). */
  herVoiced?: boolean;
  /** The child's mic level 0..1 (LevelMeter.value). */
  childLevel?: number;
}

export interface BehaviourOptions {
  band?: BandKey;
  seed?: number;
  faceStyle?: { smile?: number; headGain?: number; browGain?: number };
  reducedMotion?: boolean;
  gentle?: boolean;
}

const BLINK_PER_MIN: Record<FaceState, number> = { idle: 17, speaking: 26, your_turn: 18, listening: 18, thinking: 22 };
const BLINK_K = 3;
const BLINK_MS = { close: 70, hold: 40, open: 140 };
const BAND_SCALE: Record<BandKey, number> = { b1: 1.0, b2: 0.9, b3: 0.7, b4: 0.55 };
export const MUTUAL_GAZE_MAX_S = 4;
export const EYE_YAW_MAX = 25;
export const EYE_PITCH_UP = 20;
export const EYE_PITCH_DOWN = -25;
const SPRING_K = 120;
const SPRING_ZETA = 0.6;
const SUBSTEP = 0.004;

/** Peak displacement of the damped spring per unit initial velocity (analytic), so impulses hit the asked-for peak. */
export const SPRING_PEAK_PER_V = (() => {
  const w0 = Math.sqrt(SPRING_K), wd = w0 * Math.sqrt(1 - SPRING_ZETA ** 2);
  const tp = Math.atan(wd / (SPRING_ZETA * w0)) / wd;
  return (Math.exp(-SPRING_ZETA * w0 * tp) * Math.sin(wd * tp)) / wd;
})();

export const EMOTIONS: Record<Emotion, { bs: Record<string, number>; tilt: number; env: [number, number, number] }> = {
  warm: { bs: { mouthSmile: 0.28, cheekSquint: 0.12, eyeSquint: 0.1 }, tilt: 2, env: [600, 1500, 900] },
  curious: { bs: { browInnerUp: 0.28, browOuterUp: 0.22, mouthSmile: 0.08 }, tilt: 6, env: [350, 1800, 700] },
  excited: { bs: { mouthSmile: 0.55, cheekSquint: 0.35, eyeSquint: 0.2, browOuterUp: 0.25, eyeWide: 0.12 }, tilt: 3, env: [350, 1200, 900] },
  concerned: { bs: { browInnerUp: 0.3, browDown: 0.06, mouthPress: 0.12 }, tilt: 5, env: [700, 2500, 1200] },
  proud: { bs: { mouthSmile: 0.45, cheekSquint: 0.32, eyeSquint: 0.22 }, tilt: 3, env: [550, 1600, 1000] },
};
const LOWER_FACE = new Set(["mouthSmile", "cheekSquint", "mouthPress"]);

/** Integrate the nod spring over `dt` seconds in fixed 4 ms substeps (frame-rate independent; GR-1.2). */
export function springStep(nod: { x: number; v: number }, dt: number): void {
  const c = 2 * SPRING_ZETA * Math.sqrt(SPRING_K);
  let left = Math.min(dt, 0.25);
  while (left > 1e-6) {
    const h = Math.min(SUBSTEP, left);
    nod.v += (-SPRING_K * nod.x - c * nod.v) * h;
    nod.x += nod.v * h;
    left -= h;
  }
}

function gauss(r: () => number): number {
  let u = 0, v = 0;
  while (!u) u = r();
  while (!v) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const N = (r: () => number, [m, s]: [number, number], lo = 0.05, hi = Infinity) => Math.min(hi, Math.max(lo, m + s * gauss(r)));
function gamma(r: () => number, k: number, theta: number): number {
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do {
      x = gauss(r);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = r();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * theta;
  }
}
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);

/**
 * The face's floor state from the lesson status and her tap (§3.5, §4.1): the tap VAD is canonical for her
 * speaking; status is the hint/cross-check. Pure, so the "events suppressed" contract test can drive it.
 *  - child talking (status listening) wins: the face listens.
 *  - her voice on the tap → speaking, whatever status says (status lags the audible onset).
 *  - status "speaking" but the tap silent: keep speaking through her pauses, release after 1.2 s of silence.
 *  - status still "thinking" although she has spoken since it began (events lost) → your_turn after her offset.
 */
export function floorState(p: {
  status: FloorStatus | null;
  tapSpeaking: boolean;
  silenceMs: number;
  /** She spoke (tap) after the status last changed. */
  spokeSinceStatus: boolean;
}): FaceState {
  if (p.status === "listening") return "listening";
  if (p.tapSpeaking) return "speaking";
  if (p.status === "speaking") return p.silenceMs < 1200 ? "speaking" : "your_turn";
  if (p.status === "thinking") return p.spokeSinceStatus ? "your_turn" : "thinking";
  if (p.status === "your_turn") return "your_turn";
  return "idle";
}

export class Behaviour {
  private r: () => number;
  private scale: number;
  private smileGain: number;
  private headGain: number;
  private browGain: number;
  private reduced: boolean;
  private gentle: boolean;
  private asym: number;
  private t = -1;
  private state: FaceState = "idle";
  private stateT = 0;
  private gaze = { mode: "child" as "child" | "avert", yaw: 0, pitch: 0, until: 0, reason: "contact" };
  private contactSince = 0;
  private nextAvert = 0;
  private nextMicro = 0;
  private micro: [number, number] = [0, 0];
  private thinkAvertAt = 0;
  private blink = { next: 0, active: false, t0: 0, lastEnd: -9, mean: 3.5, queueDouble: false };
  private nod = { x: 0, v: 0 };
  private tilt = 0;
  private lean = 0;
  private leanV = 0;
  private headYaw = 0;
  private drift: [number, number, number];
  private emo: { kind: Emotion | null; I: number; t0: number; env: [number, number, number] } = { kind: null, I: 0, t0: 0, env: [1, 0, 1] };
  private armed: { emotion: Emotion; intensity: number } | null = null;
  private brow = { t0: -9, amp: 0 };
  private rms = { fast: 0, slow: 0.02, lastAccent: -9 };
  private herVoiced = false;
  private herPauseT0 = -1;
  private pauseHandled = false;
  /** Event log for tests (bounded). */
  readonly log: { t: number; type: string; detail?: string }[] = [];

  constructor(o: BehaviourOptions = {}) {
    this.r = rng32(o.seed ?? 1);
    this.scale = BAND_SCALE[o.band ?? "b2"] ?? 0.8;
    this.smileGain = o.faceStyle?.smile ?? 0.7;
    this.headGain = o.faceStyle?.headGain ?? 1;
    this.browGain = o.faceStyle?.browGain ?? 1;
    this.reduced = !!o.reducedMotion;
    this.gentle = !!o.gentle;
    this.asym = 1 + (this.r() - 0.5) * 0.12;
    this.drift = [this.r() * 99, this.r() * 99, this.r() * 99];
  }

  get faceState(): FaceState {
    return this.state;
  }

  setMotion(m: { reduced?: boolean; gentle?: boolean }): void {
    if (m.reduced !== undefined) this.reduced = m.reduced;
    if (m.gentle !== undefined) this.gentle = m.gentle;
  }

  private ev(type: string, detail?: string): void {
    this.log.push({ t: this.t, type, detail });
    if (this.log.length > 2000) this.log.splice(0, 500);
  }

  private blinkMean(): number {
    return 60 / BLINK_PER_MIN[this.state];
  }
  private scheduleBlink(): void {
    this.blink.mean = this.blinkMean();
    this.blink.next = this.t + gamma(this.r, BLINK_K, this.blink.mean / BLINK_K);
  }
  /** On a state change the pending interval is time-warped, never redrawn (redrawing halves the rate in short states). */
  private rescaleBlink(): void {
    const m = this.blinkMean(), old = this.blink.mean || m;
    if (!this.blink.active && this.blink.next > this.t) this.blink.next = this.t + (this.blink.next - this.t) * (m / old);
    this.blink.mean = m;
  }
  /** Event blinks ADVANCE an imminent scheduled blink instead of adding one. */
  private blinkNow(win = 0.6): void {
    if (this.t - this.blink.lastEnd < 0.6 || this.blink.active) return;
    if (this.blink.next - this.t > win * this.blink.mean) return;
    this.blink.next = this.t;
  }

  private look(mode: "child" | "avert", yaw: number, pitch: number, dur: number, reason: string): void {
    const big = Math.hypot(yaw - this.gaze.yaw, pitch - this.gaze.pitch) > 15;
    if (mode === "child" && this.gaze.mode !== "child") this.contactSince = this.t;
    this.gaze = { mode, yaw, pitch, until: this.t + dur, reason };
    this.ev("gaze", reason);
    if (big && this.r() < 0.6) this.blinkNow(1.0); // gaze-evoked blink
  }
  private lookChild(reason: string): void {
    this.look("child", 0, 0, 1e9, reason);
  }
  private avert(kind: "intimacy" | "floor" | "cognitive", dur: number): void {
    const r = this.r();
    const dir = kind === "cognitive" ? (r < 0.45 ? "up" : r < 0.8 ? "side" : "down") : r < 0.55 ? "side" : r < 0.8 ? "down" : "up";
    const sgn = this.r() < 0.5 ? -1 : 1;
    const [yaw, pitch] = dir === "up" ? [sgn * 4, 10] : dir === "side" ? [sgn * 12, 0] : [sgn * 3, -8];
    this.look("avert", yaw, pitch, dur, `${kind}:${dir}`);
  }

  /** Arm an expression for her next audible onset (Director affect / delight). Fires at once if she is speaking. */
  arm(emotion: Emotion, intensity: 1 | 2 = 1): void {
    if (this.state === "speaking") this.emote(emotion, intensity);
    else this.armed = { emotion, intensity };
  }

  private emote(kind: Emotion, intensity: number): void {
    // Big-expression budget lives in the caller's gate (useDelight / ReactionGate); here: band scale + cap.
    this.emo = { kind, I: (Math.min(intensity, 3) / 3) * this.scale, t0: this.t, env: EMOTIONS[kind].env };
    this.ev("emote", kind);
  }
  private release(ms: number): void {
    this.emo = { kind: this.emo.kind, I: this.emoLevel(), t0: this.t, env: [1, 0, ms] };
  }
  private emoLevel(): number {
    const { t0, env: [a, h, rel], I } = this.emo;
    const dt = (this.t - t0) * 1000;
    if (dt < a) return I * (0.5 - 0.5 * Math.cos((Math.PI * dt) / a));
    if (dt < a + h) return I;
    if (dt < a + h + rel) return I * (0.5 + 0.5 * Math.cos((Math.PI * (dt - a - h)) / rel));
    return 0;
  }

  private impulse(peakDeg: number): void {
    this.nod.v += peakDeg / SPRING_PEAK_PER_V;
  }

  setState(s: FaceState): void {
    if (s === this.state) return;
    const was = this.state;
    this.ev("state", s);
    this.state = s;
    this.stateT = this.t;
    const r = this.r;
    if (s === "speaking") {
      if (this.armed) {
        this.emote(this.armed.emotion, this.armed.intensity);
        this.armed = null;
      }
      this.brow = { t0: this.t + 0.05, amp: 0.22 }; // brow flash in the first 300 ms of a move
      if (this.gaze.mode === "avert") this.gaze.until = this.t + N(r, [0.75, 0.3], 0.2, 1.5); // re-gaze after onset
      this.nextAvert = this.t + N(r, [4.75, 1.39], 1.5);
      if (was === "listening") {
        this.release(200); // barge recovery / her reply: no held listening face
      }
    } else if (s === "your_turn") {
      this.lean = 1;
      this.lookChild("ring");
      this.nextAvert = this.t + N(r, [7.21, 1.88], 3);
    } else if (s === "listening") {
      this.lean = 0.5;
      if (was === "speaking") {
        this.release(200); // barge-in: upper face to listening, expressions released
        this.brow = { t0: this.t, amp: 0.15 };
        this.nod.v = 0;
      }
      this.lookChild("listen");
      this.nextAvert = this.t + N(r, [7.21, 1.88], 3);
    } else if (s === "thinking") {
      this.lean = 0.2;
      this.release(300); // verdict-neutral: every expression released within 300 ms
      this.thinkAvertAt = this.t + N(r, [0.3, 0.1], 0.1, 0.6);
    } else {
      this.lean = 0;
    }
    this.rescaleBlink();
  }

  /** One tick. `t` = absolute seconds on the render/audio clock. */
  update(t: number, inp: BehaviourInput = {}): BehaviourFrame {
    if (this.t < 0) {
      this.t = t;
      this.contactSince = t;
      this.scheduleBlink();
      this.nextAvert = t + 2 + this.r() * 2;
      this.nextMicro = t + 1;
    }
    const dt = Math.max(0, Math.min(0.2, t - this.t)); // integrators only; timers use t itself
    this.t = t;
    const r = this.r;
    const her = inp.herRms ?? 0;

    // Her prosody on the tap: fast/slow envelopes → accent nods and phrase-boundary blinks.
    const R = this.rms;
    R.fast += (1 - Math.exp(-dt / 0.03)) * (her - R.fast);
    if (her > 0.01) R.slow += (1 - Math.exp(-dt / 1.5)) * (her - R.slow);
    const voiced = inp.herVoiced ?? R.fast > 0.012;
    if (this.state === "speaking") {
      if (!voiced && this.herVoiced) this.herPauseT0 = t;
      if (!voiced && this.herPauseT0 > 0 && t - this.herPauseT0 > 0.15 && !this.pauseHandled) {
        this.pauseHandled = true;
        this.blinkNow(0.6);
        if (this.gaze.mode === "child" && r() < 0.35) this.avert("floor", N(r, [2.3, 1.1], 0.8, 3));
      }
      if (voiced) {
        this.pauseHandled = false;
        if (this.gaze.reason.startsWith("floor") && !this.herVoiced) this.gaze.until = t + N(r, [1.27, 0.51], 0.3, 2.5);
      }
      if (voiced && R.fast > R.slow * 1.6 && t - R.lastAccent > 0.35) {
        R.lastAccent = t;
        this.impulse(Math.min(3, (1.5 * R.fast) / R.slow / 1.6));
        if (R.fast > R.slow * 2.2 && t - this.brow.t0 > 1.2 && r() < 0.35) this.brow = { t0: t, amp: 0.18 };
      }
    }
    this.herVoiced = voiced;

    // Gaze scheduler.
    const G = this.gaze;
    if (this.state === "thinking" && this.thinkAvertAt && t >= this.thinkAvertAt) {
      this.thinkAvertAt = 0;
      this.avert("cognitive", Math.min(3.5, N(r, [3.54, 1.26], 1.0)));
    }
    if (G.mode !== "child" && t >= G.until) this.lookChild("return");
    if (this.gaze.mode === "child" && this.state !== "thinking") {
      const capped = t - this.contactSince >= MUTUAL_GAZE_MAX_S - 0.05;
      if (t >= this.nextAvert || capped) {
        if (this.state === "speaking") {
          this.avert("intimacy", N(r, [1.96, 0.32], 0.6));
          this.nextAvert = t + N(r, [4.75, 1.39], 1.5);
        } else {
          this.avert("intimacy", N(r, [1.14, 0.27], 0.5));
          this.nextAvert = t + N(r, [7.21, 1.88], 3);
        }
      }
    }
    if (!this.reduced && t >= this.nextMicro) {
      const a = N(r, [2.0, 0.6], 1.5, 3), th = r() * 2 * Math.PI;
      this.micro = [a * Math.cos(th), a * Math.sin(th) * 0.6];
      this.nextMicro = t + N(r, [1.2, 0.4], 0.4);
    }
    if (this.reduced) this.micro = [0, 0];
    const wantYaw = this.gaze.yaw + this.micro[0] * 0.5, wantPitch = this.gaze.pitch + this.micro[1] * 0.5;

    // Blinks (autonomic; kept under reduced motion and gentle face).
    const B = this.blink;
    if (!B.active && t >= B.next) {
      B.active = true;
      B.t0 = t;
      this.ev("blink");
    }
    let blinkV = 0;
    if (B.active) {
      const e = (t - B.t0) * 1000;
      blinkV = e < BLINK_MS.close ? e / BLINK_MS.close : e < BLINK_MS.close + BLINK_MS.hold ? 1 : clamp01(1 - (e - BLINK_MS.close - BLINK_MS.hold) / BLINK_MS.open);
      if (e >= BLINK_MS.close + BLINK_MS.hold + BLINK_MS.open) {
        B.active = false;
        B.lastEnd = t;
        if (!B.queueDouble && r() < 0.12) {
          B.queueDouble = true;
          B.next = t + 0.12;
        } else {
          B.queueDouble = false;
          this.scheduleBlink();
        }
      }
    }

    // Head: spring nods in fixed substeps + drift + gaze-follow + tilt + lean.
    springStep(this.nod, dt);
    const motion = this.reduced ? 0.3 : this.gentle ? 0.5 : 1;
    const L = this.emoLevel();
    const still = this.state === "your_turn" ? 0.5 : this.state === "listening" ? 0.7 : 1;
    const da = (this.state === "speaking" ? 1.5 : 1.0) * still * motion * this.headGain;
    const d = this.drift;
    const drift = [0.31, 0.23, 0.17].map((f, i) => Math.sin(2 * Math.PI * f * t + d[i]) * 0.6 + Math.sin(2 * Math.PI * f * 2.71 * t + d[i] * 1.3) * 0.4);
    const E = this.emo.kind ? EMOTIONS[this.emo.kind] : null;
    const tiltT = (this.state === "listening" ? 4 : 0) + (E && this.emo.I > 0 ? (E.tilt * L) / this.emo.I : 0);
    this.tilt += (1 - Math.exp(-dt / 0.4)) * (tiltT * motion - this.tilt);
    this.leanV += (1 - Math.exp(-dt / 0.35)) * ((this.reduced ? 0.3 : 1) * this.lean - this.leanV);

    // Eye-in-head clamp; the remainder is carried by the head (GR-1.4).
    const eyeYaw = clamp(wantYaw, -EYE_YAW_MAX, EYE_YAW_MAX), eyePitch = clamp(wantPitch, EYE_PITCH_DOWN, EYE_PITCH_UP);
    const restYaw = wantYaw - eyeYaw;
    const follow = Math.abs(eyeYaw) > 15 ? eyeYaw - Math.sign(eyeYaw) * 10 : eyeYaw * 0.3;
    this.headYaw += (1 - Math.exp(-dt / 0.25)) * (follow * motion + restYaw - this.headYaw);
    const nodScale = (this.reduced ? 0.3 : this.gentle ? 0.5 : 1) * this.scale * this.headGain;
    const head: [number, number, number] = [
      clamp(this.nod.x * nodScale + drift[0] * da - 3 * this.leanV - eyePitch * 0.2 * motion, -20, 20),
      clamp(this.headYaw + drift[1] * da, -20, 20),
      clamp(this.tilt + drift[2] * da * 0.6, -20, 20),
    ];

    // Brows: flash (rise 80 / hold to 320 / fall 200 ms). Never scaled by gentle face.
    const br = this.brow, be = (t - br.t0) * 1000;
    const flash = be < 0 ? 0 : be < 80 ? (br.amp * be) / 80 : be < 320 ? br.amp : be < 520 ? br.amp * (1 - (be - 320) / 200) : 0;
    const exprScale = this.reduced ? 0.3 : 1;
    const bs: Record<string, number> = {};
    const add = (k: string, v: number) => {
      bs[k + "Left"] = (bs[k + "Left"] ?? 0) + v * this.asym;
      bs[k + "Right"] = (bs[k + "Right"] ?? 0) + v / this.asym;
    };
    if (E) {
      for (const [k, v0] of Object.entries(E.bs)) {
        let v = v0 * L * exprScale;
        if (k === "mouthSmile") v *= this.smileGain / 0.7;
        if (this.gentle && LOWER_FACE.has(k)) v *= 0.5;
        if (k.startsWith("brow")) v *= this.browGain;
        if (k === "browInnerUp") bs.browInnerUp = (bs.browInnerUp ?? 0) + v;
        else add(k, v);
      }
    }
    // A resting warmth in the attentive states (S2 friendly rest pose; not an expression, no budget).
    const rest = this.state === "thinking" ? 0.03 : this.state === "speaking" ? 0.06 : 0.1;
    add("mouthSmile", rest * this.smileGain * (this.gentle ? 0.5 : 1));
    add("browOuterUp", flash * this.browGain);
    bs.browInnerUp = (bs.browInnerUp ?? 0) + (flash * 0.8 + (this.state === "listening" ? 0.08 : 0)) * this.browGain;
    const squint = Math.max(bs.eyeSquintLeft ?? 0, bs.eyeSquintRight ?? 0) * 0.3;
    const lid = Math.max(blinkV, squint);
    bs.eyeBlinkLeft = lid;
    bs.eyeBlinkRight = lid;
    for (const k in bs) bs[k] = clamp01(bs[k]);
    return { t, state: this.state, bs, head, gaze: [eyeYaw, eyePitch], lean: this.leanV, gazeMode: this.gaze.mode };
  }

  /** Seconds the face has been in its current state. */
  inStateFor(): number {
    return this.t - this.stateT;
  }
}
