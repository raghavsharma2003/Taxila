// What the puppet is allowed to act, and when. Pure (no DOM, no runtime import), so the rules are unit-testable.
//
// Inputs: the floor state (behaviour.ts floorState: idle / speaking / your_turn / listening / thinking), the Director's
// affect (faceCues "affect" → faceAffectOf → Emotion + intensity; the producer is verdict-blind by type), and the duplex
// engine's poses. Output: commands for the expression layer (the judged expr.js emitters).
//
// Rules (each cites its source):
//   R1 verdict-neutral: no valenced expression while she listens or thinks; entering THINKING releases every expression
//      within 300 ms (behaviour.ts, design-v2-face-verdict-neutral). The affect is ARMED and plays at her next audible
//      onset (behaviour.ts arm()), i.e. on the words that carry it, never on the child's answer.
//   R2 big-expression budget: delight (excited / proud) at most once per 30 s (avatar-behaviour-controller), on top of the
//      producer's 1-per-5-child-turns gate (faceCues ReactionGate).
//   R3 band scale on amplitude only: b1 1.0, b2 0.9, b3 0.7, b4 0.55 (avatar-behaviour-controller).
//   R4 never a sad face, a head shake, mimicry or a wink (the safety floor; safety.ts strips the wink from the tables).
//      "concerned" is the gentle-concern face (inner brows up, soft mouth), never a frown-cry.
//   R6 safety turns are NEUTRAL (ship5 p2-face, 2026-10-05): a safety turn (the Director's calm_steady display, or the
//      duplex engine's calm_steady pose / safety_attend) releases every expression, plays NO preset, drops every affect
//      (concern included) and the driver holds a soft-neutral mouth (no smile, no frown, no cheek push). Reason: the
//      judged concern face at product intensity read "warm" (a smile) 8/8 and at full read sad / disappointed to the blind
//      models (evals/face-puppet/concern-read.mjs, Review v4), so neither belongs on a child's distress turn. Without the
//      duplex engine the calm ends at her next spoken onset after a child turn with no fresh calm_steady cue.
//   R5 floor acting is not affect: the listening face, the thinking glance and the check-in look are the floor's, driven
//      by the duplex engine when it is attached, else by the floor state.
import type { Emotion, FaceState } from "../avatar/behaviour.ts";
import type { AvatarPose } from "../duplex/face.ts";

export type PresetName = "warm" | "delight" | "concern" | "thinking" | "listening" | "surprise" | "playful";

export type ActCommand =
  | { op: "emote"; name: PresetName; intensity: number; hold: number; variant?: number; why: string }
  | { op: "release"; why: string }
  | { op: "lean"; value: number; why: string }
  | { op: "calm"; on: boolean; why: string };

const BAND_SCALE: Record<string, number> = { b1: 1.0, b2: 0.9, b3: 0.7, b4: 0.55 };
export const BIG_EVERY_S = 30;
/** How long a spoken affect is held at full before it eases out (it rides one clause, then the warm rest returns). */
export const AFFECT_HOLD_S = 1.4;

const AFFECT_PRESET: Record<Emotion, { name: PresetName; big: boolean; k: number }> = {
  excited: { name: "delight", big: true, k: 1 },
  proud: { name: "delight", big: true, k: 0.7 },
  warm: { name: "warm", big: false, k: 1 },
  // curious (enthusiasm / calm_curious): the warm face with its lifted brows; the judged surprise O is not used on a
  // spoken line (it would round her mouth against the visemes)
  curious: { name: "warm", big: false, k: 0.8 },
  concerned: { name: "concern", big: false, k: 0.85 },
};

export class ActingPolicy {
  private band: string;
  private state: FaceState = "idle";
  private armed: { emotion: Emotion; intensity: 1 | 2; at: number } | null = null;
  private lastBig = -Infinity;
  private duplex = false;
  private calm = false;
  /** A calm_steady cue arrived since the child last held the floor (no duplex): her next onset keeps the calm. */
  private calmFresh = false;
  /** The preset this policy last started (null after a release): a floor change releases only VALENCED acting, never the
   *  floor's own listening / thinking face that the duplex engine may have just started. */
  private current: PresetName | null = null;
  /** Bounded log of decisions (tests, the stage's debug read-out). */
  readonly log: string[] = [];

  constructor(band: string) {
    this.band = BAND_SCALE[band] ? band : "b2";
  }

  private note(s: string): void {
    this.log.push(s);
    if (this.log.length > 200) this.log.splice(0, 50);
  }

  /** The Director asked for an affect (already verdict-blind and turn-gated upstream). Armed for her next onset. */
  affect(emotion: Emotion, intensity: 1 | 2, t: number): ActCommand[] {
    if (this.calm) { this.note(`${t.toFixed(2)} affect ${emotion} dropped: safety turn is neutral`); return []; }
    this.armed = { emotion, intensity, at: t };
    this.note(`${t.toFixed(2)} affect ${emotion}/${intensity} armed`);
    return this.state === "speaking" ? this.fireArmed(t) : [];
  }

  /** R6: the Director marked this turn a safety turn (display calm_steady): neutral now, and for her reply. */
  safetyTurn(t: number): ActCommand[] {
    this.calmFresh = true;
    this.armed = null;
    this.note(`${t.toFixed(2)} safety turn: neutral`);
    const out: ActCommand[] = [];
    if (!this.calm) { this.calm = true; out.push({ op: "calm", on: true, why: "safety turn" }); }
    this.current = null;
    out.push({ op: "release", why: "safety turn: neutral" });
    return out;
  }

  get inSafety(): boolean {
    return this.calm;
  }

  private fireArmed(t: number): ActCommand[] {
    const a = this.armed;
    this.armed = null;
    if (!a || t - a.at > 15) return []; // an affect older than one child turn is old news (TutorFace PENDING_AFFECT_MS)
    const m = AFFECT_PRESET[a.emotion];
    if (m.big) {
      if (t - this.lastBig < BIG_EVERY_S) { this.note(`${t.toFixed(2)} ${a.emotion} over the 30 s budget: warm instead`); return [this.emote("warm", 0.8, AFFECT_HOLD_S, "budget")]; }
      this.lastBig = t;
    }
    const base = a.intensity === 2 ? 1 : 0.6;
    return [this.emote(m.name, base * m.k, AFFECT_HOLD_S, `affect:${a.emotion}`)];
  }

  private emote(name: PresetName, intensity: number, hold: number, why: string, variant?: number): ActCommand {
    // R3 band scale applies to AFFECT only; the floor's own faces (listening, the thinking glance) play at the judged level
    const floorFace = why.startsWith("floor:") || why.startsWith("duplex:");
    const I = Math.max(0, Math.min(1, intensity * (floorFace ? 1 : BAND_SCALE[this.band])));
    this.note(`emote ${name} ${I.toFixed(2)} (${why})`);
    this.current = name;
    return { op: "emote", name, intensity: I, hold, variant, why };
  }

  /** The floor state changed (behaviour's floorState on the tap + status). */
  floor(state: FaceState, t: number): ActCommand[] {
    if (state === this.state) return [];
    const was = this.state;
    this.state = state;
    const out: ActCommand[] = [];
    const floorFace = this.current === "thinking" || this.current === "listening";
    const rel = (why: string): ActCommand => { this.current = null; return { op: "release", why }; };
    if (this.calm && !this.duplex) {
      // R6 without the duplex engine: the child's turn consumes the cue; her next onset with no fresh cue leaves safety
      if (state === "listening") this.calmFresh = false;
      else if (state === "speaking" && !this.calmFresh) { this.calm = false; out.push({ op: "calm", on: false, why: "left safety: a normal turn" }); }
    }
    if (this.calm) {
      // R6: in safety the floor's own faces are not played either (no listening smile, no thinking glance): neutral
      if (this.current) out.push(rel(`safety: ${state}`));
      return out;
    }
    if (state === "speaking") {
      if (this.armed) out.push(...this.fireArmed(t));
      else if (was === "listening" || was === "thinking") out.push(rel("onset"));
    } else if (state === "thinking") {
      // R1: everything valenced goes within 300 ms; the thinking glance is the floor's (the duplex engine sends its own
      // `thinking` pose; without it the floor state is the trigger). Held until the state changes.
      if (this.duplex) { if (this.current && !floorFace) out.push(rel("thinking: verdict-neutral")); }
      else out.push(rel("thinking: verdict-neutral"), this.emote("thinking", 1, 30, "floor:thinking"));
    } else if (state === "listening") {
      if (this.duplex) { if (this.current && !floorFace) out.push(rel("listening")); }
      else out.push(rel("listening"), this.emote("listening", 1, 30, "floor:listening"));
    } else if (was === "listening" || was === "thinking") out.push(rel(state));
    return out;
  }

  /** A duplex pose (src/duplex/face.ts AvatarPose). Attaching the engine hands it the floor acting (R5). */
  pose(p: AvatarPose, t: number): ActCommand[] {
    this.duplex = true;
    this.note(`${t.toFixed(2)} pose ${p}`);
    if (this.calm && p !== "calm_steady") {
      // R6: the safety calm outlives her safeguarding reply. A child-floor pose (a normal child turn: the engine sends
      // calm_steady instead while safety_attend holds) consumes the cue; her next onset without a fresh one leaves calm.
      if (p === "listening" || p === "listen_lean" || p === "your_turn" || p === "still_with_you" || p === "checkin_look") this.calmFresh = false;
      if (p === "speaking" && !this.calmFresh) {
        this.calm = false;
        return [{ op: "calm", on: false, why: "left safety: a normal turn" }, ...this.poseActs(p)];
      }
      // still in safety: no floor preset either (neutral), only the release / lean parts of the pose
      const acts = this.poseActs(p).filter((a) => a.op !== "emote");
      this.current = null;
      return acts;
    }
    return this.poseActs(p);
  }

  private poseActs(p: AvatarPose): ActCommand[] {
    const acts = this.poseActs0(p);
    if (acts.some((a) => a.op === "release") && !acts.some((a) => a.op === "emote")) this.current = null;
    return acts;
  }

  private poseActs0(p: AvatarPose): ActCommand[] {
    switch (p) {
      case "listening": return [{ op: "release", why: p }, this.emote("listening", 1, 30, "duplex:listening")];
      case "listen_lean": return [this.emote("listening", 0.9, 30, "duplex:listen_lean"), { op: "lean", value: 0.35, why: p }];
      case "still_with_you": return [{ op: "lean", value: 0.2, why: p }];
      case "thinking": return [{ op: "release", why: "thinking: verdict-neutral" }, this.emote("thinking", 1, 30, "duplex:thinking_glance")];
      case "hold_pose": return []; // the child asked her to wait: hold whatever face she has, no new motion
      case "checkin_look": return [{ op: "release", why: p }, this.emote("listening", 0.6, 1.2, "duplex:checkin")];
      case "your_turn": return [{ op: "release", why: p }, { op: "lean", value: 0.3, why: p }];
      case "calm_steady":
        // SAFETY_ATTEND (TA8): calm, steady, attentive. R6: NEUTRAL, no preset (the judged concern read as a smile at 0.35)
        this.calm = true;
        this.calmFresh = true;
        this.armed = null;
        return [{ op: "calm", on: true, why: p }, { op: "release", why: p }];
      case "speaking": return [{ op: "release", why: "speaking" }];
    }
  }

  /** The duplex host was disposed (or never really drove the face): the floor state owns the floor faces again and the
   *  mic-level Listener nods again. Any calm it set stays until the next normal turn (R6). */
  detachDuplex(t: number): ActCommand[] {
    if (!this.duplex) return [];
    this.duplex = false;
    this.note(`${t.toFixed(2)} duplex detached`);
    return [];
  }

  get faceState(): FaceState {
    return this.state;
  }
  get duplexAttached(): boolean {
    return this.duplex;
  }
}
