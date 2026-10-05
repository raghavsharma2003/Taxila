// The puppet's per-frame brain: the stage3d tick contract on the judged 2D rig, with the production inputs.
//   her tap → LipDriver (audio jaw / voicing, today's live path, unchanged src/avatar/lip.ts)
//   + Diya's viseme events on the player clock (track.ts) → the mouth SHAPES (and the jaw when no tap is attached)
//   → floorState (src/avatar/behaviour.ts) → ActingPolicy (policy.ts: verdict-neutral, budgets, safety) → Behaviour
//   (gaze, blinks, brows, head; unchanged) + the judged expression layer (runtime/expr.js) + nods (duplex cues, else the
//   judged mic-level Listener) → Compositor (unchanged) → rig.frame.
// Framework-free and DOM-free (the rig is passed in), so it runs headless in the evals with a fake rig.
import { LipDriver, lipKeys } from "../avatar/lip.ts";
import { Behaviour, floorState, type BandKey, type Emotion, type FaceState, type FloorStatus } from "../avatar/behaviour.ts";
import { Compositor } from "../avatar/compositor.ts";
import { windowFromLevel, type TapRead } from "../avatar/tap.ts";
import { Expressions, Listener } from "./runtime/expr.js";
import { ActingPolicy, type ActCommand } from "./policy.ts";
import { VisemeScheduler } from "./track.ts";
import { applySafetyFloor } from "./safety.ts";
import type { AvatarPose } from "../duplex/face.ts";

export interface RigLike {
  clock: number | null;
  frame(bs: Record<string, number>, head: number[], gaze: number[], lean: number, breath: number): void;
}

export interface DriverInput {
  /** performance.now() ms. */
  nowMs: number;
  tap: TapRead;
  status: FloorStatus | null;
  childLevel: number;
}

export interface DriverFrame {
  state: FaceState;
  lipSource: "visemes" | "tap" | "level" | "none";
  mouth: Record<string, number>;
  head: number[];
  gaze: number[];
  /** JS work of this frame (ms), excluding the rig. */
  workMs: number;
}

/** Duplex continuer nods: the judged Listener spring (k 110, ζ 0.62), peak-normalised impulse, ≤ 1 per 3 s (duplex-content-blind-nods). */
class NodSpring {
  x = 0;
  v = 0;
  last = -Infinity;
  nods = 0;
  kick(peakDeg: number, t: number): boolean {
    if (t - this.last < 3) return false;
    this.last = t;
    this.nods++;
    this.v += Math.max(0, Math.min(6, peakDeg)) / 0.0468;
    return true;
  }
  step(dt: number): number {
    let left = Math.min(dt, 0.1);
    while (left > 1e-6) {
      const h = Math.min(0.004, left);
      this.v += (-110 * this.x - 2 * 0.62 * Math.sqrt(110) * this.v) * h;
      this.x += this.v * h;
      left -= h;
    }
    return this.x;
  }
}

const lowpass = (cur: number, target: number, dt: number, tau: number) => cur + (1 - Math.exp(-dt / tau)) * (target - cur);

/** R6 (policy.ts): the soft-neutral mouth of a safety turn: mouthSmile 0 is the rig's "soft neutral" corners (lips.js
 *  lift(0) = 0.22 against c-front's resting warm smile 0.45 at behaviour's idle ~0.045), no cheek push, no frown (the
 *  concern frown read as sad / disappointed). Checked by eye at 0.012 first (evals/p2-face/out/look/): the corners still
 *  read as a light smile, so 0. Eased in and out over ~150 ms (no corner pop). */
export const SAFETY_NEUTRAL = { mouthSmile: 0, cheekSquint: 0 } as const;

export class PuppetDriver {
  readonly policy: ActingPolicy;
  readonly visemes = new VisemeScheduler();
  private behaviour: Behaviour;
  private comp = new Compositor(0.85);
  private exprs = new Expressions(21);
  private listener = new Listener(3);
  private nod = new NodSpring();
  private lip: LipDriver | null = null;
  private lipRate = 0;
  private win = new Float32Array(1024);
  private lastT = -1;
  private status: FloorStatus | null = null;
  private statusSince = 0;
  private spoke = false;
  private state: FaceState = "idle";
  private exprHead = [0, 0, 0];
  private exprLean = 0;
  private poseLean = 0;
  private poseLeanTarget = 0;
  private vis: Record<string, number> = {};
  private reduced: boolean;
  private calm = false;
  /** 0..1, the eased safety-neutral blend (R6). */
  private calmK = 0;
  /** Until when (s) the face needs the full frame rate: speech, a state change, an expression's ramp, a nod, a look. */
  busyUntil = 0;
  /** Eval-only: a head offset added after everything (the judge grid's ±20° turn cell). Never set by product code. */
  evalHead: [number, number, number] | null = null;
  /** Eval-only: emote a judged preset directly (the judge grid's surprise / playful cells, which no product affect maps to). */
  evalEmote(name: string, nowMs: number, variant?: number, hold = 30, intensity = 1): void {
    this.exprs.emote(name, nowMs / 1000, { hold, intensity, variant });
  }
  evalRelease(nowMs: number): void {
    this.run([{ op: "release", why: "eval" }], nowMs / 1000);
  }

  constructor(o: { band: BandKey | string; seed?: number; reducedMotion?: boolean; gentle?: boolean; smile?: number }) {
    applySafetyFloor();
    const band = (["b1", "b2", "b3", "b4"].includes(String(o.band)) ? o.band : "b2") as BandKey;
    this.reduced = !!o.reducedMotion;
    this.behaviour = new Behaviour({ band, seed: o.seed ?? 7, faceStyle: { smile: o.smile ?? 0.7 }, reducedMotion: this.reduced, gentle: o.gentle });
    this.policy = new ActingPolicy(band);
  }

  setMotion(m: { reduced?: boolean; gentle?: boolean }): void {
    if (m.reduced !== undefined) this.reduced = m.reduced;
    this.behaviour.setMotion(m);
  }

  // ───────── inputs from the page ─────────

  /** A Director affect (already verdict-blind, band-stepped and turn-gated by faceCues). */
  affect(emotion: Emotion, intensity: 1 | 2, nowMs: number): void {
    this.run(this.policy.affect(emotion, intensity, nowMs / 1000), nowMs / 1000);
  }
  /** A look at the work (faceCues gaze → angles computed by the stage from the DOM). */
  lookAt(yaw: number, pitch: number, holdS: number, reason: string): void {
    this.behaviour.lookAt(yaw, pitch, holdS, reason);
    this.busyUntil = Math.max(this.busyUntil, this.lastT + 0.6);
  }
  voiceEvent(kind: "laugh" | "breath" | "hum"): void {
    if (!this.calm) this.behaviour.voiceEvent(kind);
  }
  /** R6: the Director marked this turn a safety turn (calm_steady): neutral face for it and for her reply. */
  safetyTurn(nowMs: number): void {
    this.run(this.policy.safetyTurn(nowMs / 1000), nowMs / 1000);
  }
  /** The duplex host went away: the floor state and the mic-level Listener own the floor faces and nods again. */
  detachDuplex(nowMs: number): void {
    this.run(this.policy.detachDuplex(nowMs / 1000), nowMs / 1000);
  }
  get inSafety(): boolean {
    return this.calm;
  }
  /** A duplex pose. */
  pose(p: AvatarPose, nowMs: number): void {
    this.run(this.policy.pose(p, nowMs / 1000), nowMs / 1000);
  }
  /** A duplex continuer nod: content-blind, ≤ 1 per 3 s, never while she speaks or in safety calm. */
  nodCue(peakDeg: number, nowMs: number): boolean {
    if (this.state === "speaking" || this.calm) return false;
    const ok = this.nod.kick(peakDeg, nowMs / 1000);
    if (ok) this.busyUntil = Math.max(this.busyUntil, nowMs / 1000 + 1);
    return ok;
  }
  /** Her audio was cut (barge-in yield): the mouth closes at once. */
  cut(): void {
    this.visemes.cut();
    this.lip?.reset();
  }

  private run(cmds: ActCommand[], t: number): void {
    if (cmds.length) this.busyUntil = Math.max(this.busyUntil, t + 1.2);
    for (const c of cmds) {
      if (c.op === "emote") this.exprs.emote(c.name, t, { hold: c.hold, intensity: c.intensity, variant: c.variant });
      else if (c.op === "release") {
        const cur = this.exprs.cur;
        // R1: out within 300 ms whatever the preset's own release (0.45-0.6 s in the judged tables)
        if (cur) { cur.P = { ...cur.P, env: [cur.P.env[0], cur.P.env[1], Math.min(cur.P.env[2], 0.3)] }; this.exprs.release(t); }
      } else if (c.op === "lean") this.poseLeanTarget = c.value;
      else if (c.op === "calm") this.calm = c.on;
    }
  }

  // ───────── one frame ─────────

  frame(inp: DriverInput, rig: RigLike | null): DriverFrame {
    const w0 = performance.now();
    const t = inp.nowMs / 1000;
    const dt = this.lastT < 0 ? 1 / 60 : Math.max(0, Math.min(0.25, t - this.lastT));
    this.lastT = t;
    if (inp.status !== this.status) { this.status = inp.status; this.statusSince = t; this.spoke = false; }
    // her voice: the tap window, else a synthetic window from the meter level (src/avatar/tap.ts amplitude fallback)
    const tap = inp.tap;
    if (!this.lip || (tap.buf && tap.sampleRate !== this.lipRate)) { this.lipRate = tap.buf ? tap.sampleRate : 48000; this.lip = new LipDriver(this.lipRate); }
    if (tap.fresh) this.lip.reset();
    const src = tap.buf ? tap.buf.subarray(tap.buf.length - 1024) : windowFromLevel(tap.level, this.win);
    const lf = this.lip.step(src as Float32Array, t);
    const visOn = this.visemes.at(inp.nowMs, this.vis);
    const speakingNow = lf.speaking || visOn;
    if (speakingNow) this.spoke = this.spoke || t - this.statusSince > 0.3;
    const st = floorState({ status: inp.status, tapSpeaking: speakingNow, silenceMs: visOn ? 0 : lf.silenceMs, spokeSinceStatus: this.spoke });
    if (st !== this.state) { this.state = st; this.busyUntil = Math.max(this.busyUntil, t + 0.8); this.run(this.policy.floor(st, t), t); }
    if (speakingNow) this.busyUntil = Math.max(this.busyUntil, t + 0.4);
    this.behaviour.setState(st);
    const b = this.behaviour.update(t, { herRms: lf.rms, herVoiced: lf.voiced || visOn, childLevel: inp.childLevel });
    const beh: Record<string, number> = { ...b.bs };
    const head = [b.head[0], b.head[1], b.head[2]];
    const gaze = [b.gaze[0], b.gaze[1]];
    // nods: the duplex engine's content-blind continuers when it is attached; else the judged mic-level Listener
    if (this.policy.duplexAttached) head[0] += this.nod.step(dt) * (this.reduced ? 0.3 : 1);
    else {
      // R6: no listening nods or listening smile in a safety turn (a still, attentive face; duplex nods obey the same rule)
      const ls = this.listener.update(t, dt, st === "listening" && !this.calm, inp.childLevel);
      head[0] += ls.pitch * (this.reduced ? 0.3 : 1);
      beh.mouthSmileLeft = (beh.mouthSmileLeft ?? 0) + ls.smile;
      beh.mouthSmileRight = (beh.mouthSmileRight ?? 0) + ls.smile;
    }
    const lipL = lipKeys(lf);
    // the expression layer writes into behaviour's frame; its head/lean contribution is low-passed so a take that
    // replaces another never pops the head (the compositor already rate-limits the blendshapes)
    const h0 = [head[0], head[1], head[2]];
    this.exprs.apply(t, dt, beh, head, gaze, lipL);
    for (let i = 0; i < 3; i++) { this.exprHead[i] = lowpass(this.exprHead[i], head[i] - h0[i], dt, 0.12); head[i] = h0[i] + this.exprHead[i] * (this.reduced ? 0.3 : 1); }
    this.exprLean = lowpass(this.exprLean, this.exprs.lean, dt, 0.15);
    this.poseLean = lowpass(this.poseLean, st === "listening" || st === "your_turn" ? this.poseLeanTarget : 0, dt, 0.4);
    const bs = this.comp.compose(beh, lipL, dt);
    this.calmK = lowpass(this.calmK, this.calm ? 1 : 0, dt, 0.05);
    if (this.calmK > 0.001) {
      const k = this.calmK;
      const cap = (key: string, max: number) => { const v = bs[key] ?? 0; if (v > max) bs[key] = v + (max - v) * k; };
      cap("mouthSmileLeft", SAFETY_NEUTRAL.mouthSmile);
      cap("mouthSmileRight", SAFETY_NEUTRAL.mouthSmile);
      cap("cheekSquintLeft", SAFETY_NEUTRAL.cheekSquint);
      cap("cheekSquintRight", SAFETY_NEUTRAL.cheekSquint);
      for (const key of ["mouthFrownLeft", "mouthFrownRight", "mouthShrugLower"]) if (bs[key]) bs[key] *= 1 - k;
    }
    let lipSource: DriverFrame["lipSource"] = tap.buf ? "tap" : tap.level > 0 ? "level" : "none";
    if (visOn) {
      // visemes and tongue keys bypass the compositor's anti-snap (they are lip keys, as in the judged clip); the jaw
      // stays the audio's when a real tap is attached (its amplitude is the voice's own), else the visemes' openness
      const jaw = this.vis.jawOpen;
      for (const k in this.vis) if (k !== "jawOpen") bs[k] = this.vis[k];
      if (!tap.buf) bs.jawOpen = Math.max(bs.jawOpen ?? 0, jaw ?? 0);
      lipSource = "visemes";
    }
    if (this.evalHead) for (let i = 0; i < 3; i++) head[i] += this.evalHead[i];
    const breath = Math.sin(t * 2 * Math.PI * 0.25);
    const workMs = performance.now() - w0;
    if (rig) {
      rig.clock = t;
      rig.frame(bs, head, gaze, b.lean + this.exprLean + this.poseLean, breath);
    }
    return { state: st, lipSource, mouth: bs, head, gaze, workMs };
  }
}
