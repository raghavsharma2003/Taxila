// The illustrated teacher's behaviour, as pure functions of time and inputs (no DOM). TeacherFace runs one
// animation-frame loop that calls step() and writes the result straight into SVG attributes, so React never
// re-renders per frame (inherited: rendering work stays off the audio thread and out of React).
//
// ReactionGate (PRODUCT-DESIGN §3.5, PD-G7): nothing here reads correctness. The only expressive input is
// `delight`, which the caller raises only for a Director `affect: insight | effort` tag, at one fixed
// intensity, and which this controller rate-limits to one per 5 turns. Listening nods are timed to the
// child's PAUSES (input level), never to what was said.

export type FaceState = "idle" | "listening" | "thinking" | "speaking" | "your_turn" | "delighted";
export type GazeTarget = "child" | "canvas" | "ledge" | "down-think" | "ring";
export type StageOrientation = "portrait" | "split";

export interface FaceInputs {
  state: FaceState;
  gaze: GazeTarget;
  orientation: StageOrientation;
  /** Her output level 0..1 (lip-sync on the playback clock). */
  mouthLevel: number;
  /** The child's mic level 0..1 (for pause-timed nods while listening). */
  micLevel: number;
  reducedMotion: boolean;
  /** Older bands: calmer motion, no mascot moves (§5.3): amplitudes scale down. */
  amplitude: number;
  /** Thinking for > 4 s: the "one moment" hand. */
  longThink: boolean;
}

export interface FacePose {
  /** Head group: translate (px in the 200 × 240 viewBox) and rotation (deg). */
  headX: number;
  headY: number;
  headRot: number;
  /** Body breath scale (1 ± 0.015). */
  bodyScale: number;
  /** Lean-in toward the child (YOUR TURN). */
  lean: number;
  /** Pupils offset. */
  gazeX: number;
  gazeY: number;
  /** Eyelid closure 0 (open) .. 1 (closed). */
  lid: number;
  /** Lower-lid "smile eyes" 0..1 (delight only). */
  smileEyes: number;
  /** Brow lift px (negative = up). */
  brow: number;
  /** Mouth open 0..1 and corner lift 0..1. */
  mouthOpen: number;
  smile: number;
  /** Hands: chalk to chin (thinking), "one moment" palm (long think). */
  chinHand: boolean;
  waitHand: boolean;
}

export const GAZE: Record<StageOrientation, Record<GazeTarget, [number, number]>> = {
  portrait: { child: [0, 0], canvas: [0, 3.2], ledge: [0, 2.4], "down-think": [-2.4, -3.2], ring: [0, 3.2] },
  split: { child: [0, 0], canvas: [3.4, 1.2], ledge: [3, -0.6], "down-think": [-2.4, -3.2], ring: [3.4, 1.4] },
};

/** Blink scheduler: random 2-6 s intervals, 120-160 ms closures; a state change never redraws the timer. */
export class Blinker {
  private next: number;
  private start = -1;
  private dur = 140;
  constructor(
    now: number,
    private readonly rand: () => number = Math.random,
  ) {
    this.next = now + 2000 + rand() * 4000;
  }
  lid(now: number): number {
    if (this.start < 0 && now >= this.next) {
      this.start = now;
      this.dur = 120 + this.rand() * 40;
    }
    if (this.start < 0) return 0;
    const t = (now - this.start) / this.dur;
    if (t >= 1) {
      this.start = -1;
      this.next = now + 2000 + this.rand() * 4000;
      return 0;
    }
    return t < 0.5 ? t * 2 : (1 - t) * 2;
  }
}

/**
 * Backchannel nods while the child talks: one nod when their level drops into a pause after ≥ 600 ms of
 * voice, at most one per 2.5 s. Content-blind by construction (it only sees a level).
 */
export class PauseNodder {
  private voicedSince = -1;
  private lastNod = -Infinity;
  private nodStart = -1;
  update(now: number, level: number, active: boolean): number {
    if (!active) {
      this.voicedSince = -1;
    } else if (level > 0.3) {
      if (this.voicedSince < 0) this.voicedSince = now;
    } else if (level < 0.15 && this.voicedSince >= 0) {
      if (now - this.voicedSince >= 600 && now - this.lastNod >= 2500) {
        this.nodStart = now;
        this.lastNod = now;
      }
      this.voicedSince = -1;
    }
    if (this.nodStart < 0) return 0;
    const t = (now - this.nodStart) / 450;
    if (t >= 1) {
      this.nodStart = -1;
      return 0;
    }
    return Math.sin(t * Math.PI); // 0 → 1 → 0
  }
}

/** Delight rate limit (§3.5): at most one per 5 child turns, at one fixed intensity. */
export class DelightGate {
  private lastTurn = -Infinity;
  allow(turn: number): boolean {
    if (turn - this.lastTurn < 5) return false;
    this.lastTurn = turn;
    return true;
  }
}

export const DELIGHT_MS = 1600;

/** One frame of pose from the inputs. `t` is ms since mount; `lid` and `nod` come from the schedulers. */
export function pose(i: FaceInputs, t: number, lid: number, nod: number): FacePose {
  const rm = i.reducedMotion;
  const a = i.amplitude;
  const s = i.state;
  // Idle sway: slow, tiny; halved in YOUR TURN (expectant stillness); none under reduced motion.
  const swayAmp = rm ? 0 : (s === "your_turn" ? 0.5 : 1) * a;
  const sway = Math.sin(t / 2300) * 1.4 * swayAmp;
  const bob = Math.sin(t / 1700) * 0.6 * swayAmp;
  const breath = rm ? 1 : 1 + Math.sin((t / 4000) * Math.PI * 2) * 0.012 * a;

  const target: GazeTarget = s === "thinking" ? "down-think" : s === "your_turn" ? "ring" : i.gaze;
  const [gx, gy] = GAZE[i.orientation][target];
  // Saccade-free micro drift so the eyes are never frozen.
  const drift = rm ? 0 : Math.sin(t / 900) * 0.3;

  const speaking = s === "speaking";
  const mouthOpen = speaking ? Math.min(1, i.mouthLevel * 1.15) : 0;
  const beat = speaking && i.mouthLevel > 0.72 ? -1.6 * a : 0; // prosody brow flash on loud syllables

  return {
    headX: sway * 0.6,
    headY: bob + nod * 3.2 * a,
    headRot: sway * 0.8 + (s === "thinking" ? -3 * a : 0) + (s === "listening" ? 2.2 * a : 0),
    bodyScale: breath,
    lean: s === "your_turn" && !rm ? 1 : 0,
    gazeX: gx + drift,
    gazeY: gy,
    lid: s === "delighted" ? Math.max(lid, 0.15) : lid,
    smileEyes: s === "delighted" ? 1 : 0,
    brow: s === "delighted" ? -3 * a : s === "thinking" ? -1.4 * a : s === "listening" ? -0.8 * a : beat,
    mouthOpen,
    smile: s === "delighted" ? 1 : s === "your_turn" || s === "listening" ? 0.55 : 0.4,
    chinHand: s === "thinking" && !i.longThink,
    waitHand: s === "thinking" && i.longThink,
  };
}
