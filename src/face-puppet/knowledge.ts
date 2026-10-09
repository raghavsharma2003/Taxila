// Round 3, stream relational-human: the face reacting to the child's KNOWLEDGE STATE — never to an emotion.
// docs/design/round3/relational-human/RESEARCH.md §5.
//
// Microsoft AI Code of Conduct (restriction 12 as this project reads it, ct-no-voice-emotion-inference): no emotional state
// is inferred from the child's voice or face. What the face may react to is where the child is in the WORK, read from the
// floor (who has the turn, how long the silence is) and from the turn boundaries — never from prosody, never from the
// verdict (design-v2-face-verdict-neutral): every rule here fires before any verdict exists, or ignores it by type.
//
//   K1 heard       the child's turn just ended (listening → thinking): one small receipt nod, then the thinking glance.
//                  A listener's "got it" (Ward & Tsukahara 2000 on listener responses; Gonzales et al. 2025: a behavioural
//                  filler — body first — improved perceived response time and humanlikeness, n = 24 adults). The same
//                  nod after a right and a wrong answer: the verdict does not exist yet.
//   K2 echoing     her acknowledgement is sounding (the child's answer said back): the face stays THINKING (gaze aversion
//                  while she considers: Andrist et al. HRI 2014 — aversions read as thinking and held the floor, n = 30);
//                  it is not her turn starting, and an armed affect never fires on it.
//   K3 working     it is the child's turn and they are silent (working it out): after WORK_LOOK_AFTER_S she looks at the
//                  work, briefly, then back — joint attention on the task instead of a stare (wait time: Rowe 1974/1986, the
//                  pause after a question is the child's thinking time); at most WORK_LOOKS_MAX per wait.
// Pure: a small state machine over (face state, time); the driver applies what it returns.
import type { FaceState } from "../avatar/behaviour.ts";

export const RECEIPT_NOD_DEG = 2.2;
export const WORK_LOOK_AFTER_S = 2.5;
export const WORK_LOOK_EVERY_S = 5;
export const WORK_LOOK_HOLD_S = 1.1;
export const WORK_LOOKS_MAX = 3;
/** Where "the work" is from her eyes when the page gives no element: a little down and to her right (the tray side). */
export const WORK_LOOK = { yaw: -7, pitch: 7 } as const;

export type KnowledgeAct =
  | { op: "nod"; peakDeg: number; why: "K1 heard" }
  | { op: "look"; yaw: number; pitch: number; holdS: number; why: "K3 working" };

export class KnowledgeFace {
  private state: FaceState = "idle";
  private since = 0;
  private looks = 0;
  private lastLook = -Infinity;
  /** K2: her acknowledgement is sounding. */
  echoing = false;
  /** K2: the lip driver's own release tail after the echo ends (s, frame clock): still the echo, not her turn. */
  echoTailUntil = -Infinity;
  /** The echo's release tail (the lip driver keeps "speaking" a few frames after the last sample). */
  static readonly ECHO_TAIL_S = 0.45;
  /** Bounded log (tests, the stage's debug read-out). */
  readonly log: string[] = [];

  private note(s: string): void {
    this.log.push(s);
    if (this.log.length > 100) this.log.splice(0, 30);
  }

  /** The face state for this frame (after K2: the driver passes the state it actually shows). */
  step(state: FaceState, t: number, o: { calm: boolean; reduced: boolean }): KnowledgeAct[] {
    const out: KnowledgeAct[] = [];
    if (state !== this.state) {
      const was = this.state;
      this.state = state;
      this.since = t;
      this.looks = 0;
      // K1: the child's turn ended and she is considering it (never in a safety turn: a still, attentive face)
      if (state === "thinking" && was === "listening" && !o.calm) { out.push({ op: "nod", peakDeg: RECEIPT_NOD_DEG * (o.reduced ? 0.4 : 1), why: "K1 heard" }); this.note(`${t.toFixed(2)} K1 nod`); }
      return out;
    }
    // K3: their turn, silence, working it out
    if (state === "your_turn" && !o.calm && !o.reduced && this.looks < WORK_LOOKS_MAX && t - this.since >= WORK_LOOK_AFTER_S && t - this.lastLook >= WORK_LOOK_EVERY_S) {
      this.looks++;
      this.lastLook = t;
      out.push({ op: "look", yaw: WORK_LOOK.yaw, pitch: WORK_LOOK.pitch, holdS: WORK_LOOK_HOLD_S, why: "K3 working" });
      this.note(`${t.toFixed(2)} K3 look ${this.looks}`);
    }
    return out;
  }
}
