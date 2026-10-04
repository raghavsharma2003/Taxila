// The face's producer side (BUILD-PLAN W2-D #4; RELATIONAL-OS R4 face half, §7.2-7.3; TEACHER-BRAIN TB6). Pure where it
// can be, so the AT-U12 contract (the face program after a correct and after a wrong commit, on the same turn context,
// is identical) is a unit test:
//
//   UiDirectives.teacherAffect {display, intensity}   (RELATIONAL-OS appraise(): the ONLY affect producer)
//     → faceAffectOf(display, band)                   (§7.2 table: delight → excited 2, warm_pride → proud 1, ...)
//     → ReactionGate                                  (delight + warm_pride share ≤ 1 per 5 child turns; same gate as
//                                                      useDelight's DelightGate; neutral_warm is the rest pose: no cue)
//     → cue "affect" → Stage3D.arm(emotion, intensity) at her next audible onset (behaviour.ts arm()).
//   ui.studioSlot (a Studio reveal), ui.cues {demo|point}, a new ui.whiteboard  → cue "gaze" (tray | board)
//   AvatarVoiceEvent (HUMAN-VOICE HV-11 frames; none ship while clips are off) → cue "voice".
//
// The producer reads NOTHING about the verdict: no `verdict`, `pendingVerdict`, `correct`, `withHelp`, chips or item
// fields reach faceProgram(), so a right and a wrong commit cannot differ on the face (TA7, design-v2-face-verdict-
// neutral). Cues reach every live <TutorFace> on the page through one small bus (faceCues), so the Desk and the window
// layout (W2-A's files) need no new props; a face that is still loading QUEUES the newest affect and gaze (TutorFace).
import type { AvatarVoiceEvent, UiDirectives } from "../../shared/contracts.ts";
import type { Display, TeacherAffectUi } from "../../shared/relational.ts";
import type { BandKey, Emotion } from "./behaviour.ts";

export type GazeTarget = "tray" | "board" | "child";

export type FaceCue =
  /** A display for her next onset; the face maps it at its own band (faceAffectOf). */
  | { kind: "affect"; display: Display; seq: number }
  | { kind: "gaze"; target: GazeTarget; holdMs: number; reason: "studio_reveal" | "cue" | "board"; seq: number }
  | { kind: "voice"; event: AvatarVoiceEvent; seq: number };

/** RELATIONAL-OS §7.2: display → the face's emotion and intensity. null = no expression (the warm rest pose). */
const DISPLAY_FACE: Record<Display, { emotion: Emotion; intensity: 1 | 2 } | null> = {
  delight: { emotion: "excited", intensity: 2 },
  warm_pride: { emotion: "proud", intensity: 1 },
  enthusiasm: { emotion: "curious", intensity: 2 },
  gentle_concern: { emotion: "concerned", intensity: 1 },
  playful: { emotion: "warm", intensity: 2 },
  calm_curious: { emotion: "curious", intensity: 1 },
  sheepish_own: { emotion: "warm", intensity: 1 },
  neutral_warm: null,
  // TA8: in the SAFETY floor state the face is concerned at intensity 1.
  calm_steady: { emotion: "concerned", intensity: 1 },
};

/** Displays that spend the shared big-expression budget (≤ 1 per 5 child turns, RELATIONAL-OS §7.2). */
const GATED: ReadonlySet<Display> = new Set(["delight", "warm_pride"]);
/** §7.2 "Intensity by Band4": B3 one step lower on delight / playful; B4 lower again, never "cute". */
const STEP_DOWN_B3: ReadonlySet<Display> = new Set(["delight", "playful"]);

/** The face for one display at one band, or null. Pure. */
export function faceAffectOf(display: Display | undefined | null, band: BandKey | string = "b2"): { emotion: Emotion; intensity: 1 | 2 } | null {
  if (!display) return null;
  const base = DISPLAY_FACE[display];
  if (!base) return null;
  let intensity: number = base.intensity;
  if (band === "b3" && STEP_DOWN_B3.has(display)) intensity -= 1;
  if (band === "b4" && display !== "gentle_concern" && display !== "calm_steady") intensity -= 1;
  return { emotion: base.emotion, intensity: (intensity >= 2 ? 2 : 1) as 1 | 2 };
}

/** ReactionGate for the big expressions: one per 5 child turns (shared by delight and warm_pride). */
export class ReactionGate {
  private last = -Infinity;
  allow(turn: number): boolean {
    if (turn - this.last < 5) return false;
    this.last = turn;
    return true;
  }
}

/** The fields of a turn's ui the face reads. Everything else (verdicts, chips, item) is invisible to it by type. */
export type FaceUi = Pick<UiDirectives, "teacherAffect" | "studioSlot" | "cues" | "whiteboard">;

/** Pick only the face-relevant fields (so a caller cannot leak verdict fields into the program by accident). */
export function faceUiOf(ui: UiDirectives | Record<string, unknown> | null | undefined): FaceUi {
  const u = (ui ?? {}) as UiDirectives;
  return { teacherAffect: u.teacherAffect, studioSlot: u.studioSlot, cues: u.cues, whiteboard: u.whiteboard };
}

/** Slot states in which a Studio piece is on show (LIVE-STUDIO §3.1): the look happens once, at the first of these. */
const SHOWN_STATES: ReadonlySet<string> = new Set(["revealed", "in_use", "fallback_shown"]);

/** How long her eyes stay on the work before they come back to the child (a look, not a stare). */
export const GAZE_HOLD_MS = { studio_reveal: 1600, cue: 1200, board: 900 } as const;

/**
 * The per-lesson producer: one turn's face program from that turn's face fields. Deterministic for a given history,
 * and blind to the verdict by construction (it takes FaceUi). `turn` counts child turns.
 */
export class FaceProducer {
  private gate = new ReactionGate();
  private seq = 0;
  private seenSlots = new Set<string>();
  private lastBoard: string | null = null;

  program(ui: FaceUi, turn: number): FaceCue[] {
    const out: FaceCue[] = [];
    const ta: TeacherAffectUi | undefined = ui.teacherAffect;
    if (ta && typeof ta === "object") {
      if (DISPLAY_FACE[ta.display] && (!GATED.has(ta.display) || this.gate.allow(turn))) out.push({ kind: "affect", display: ta.display, seq: ++this.seq });
    }
    // Gaze: a Studio piece on show draws her eyes to the stage once per slot (on reveal, or when the ladder's fallback
    // is shown); a demo/point cue looks at its target; a new board line at the board.
    const slot = ui.studioSlot;
    const shown = !!slot && typeof slot.slotId === "string" && SHOWN_STATES.has(slot.state);
    if (shown && !this.seenSlots.has(slot!.slotId)) {
      this.seenSlots.add(slot!.slotId);
      out.push({ kind: "gaze", target: "tray", holdMs: GAZE_HOLD_MS.studio_reveal, reason: "studio_reveal", seq: ++this.seq });
    } else if (ui.cues?.program === "demo" || ui.cues?.program === "point") {
      out.push({ kind: "gaze", target: ui.cues.target === "board" ? "board" : "tray", holdMs: GAZE_HOLD_MS.cue, reason: "cue", seq: ++this.seq });
    } else {
      const wb = ui.whiteboard?.value ? JSON.stringify(ui.whiteboard.value).slice(0, 200) : null;
      if (wb && wb !== this.lastBoard) out.push({ kind: "gaze", target: "board", holdMs: GAZE_HOLD_MS.board, reason: "board", seq: ++this.seq });
    }
    if (ui.whiteboard?.value) this.lastBoard = JSON.stringify(ui.whiteboard.value).slice(0, 200);
    return out;
  }

  /** A framed-TTS avatar event (laugh / breath / hum at atMs from her first sample): passed through, never invented. */
  voice(event: AvatarVoiceEvent): FaceCue | null {
    if (!event || !["laugh", "breath", "hum"].includes(event.kind) || !(event.atMs >= 0)) return null;
    return { kind: "voice", event, seq: ++this.seq };
  }
}

// ───────────── the page's cue bus ─────────────

type Listener = (cue: FaceCue) => void;
const listeners = new Set<Listener>();

/** Every live face on the page hears every cue (there is one teacher; a second, small face mirrors her). */
export const faceCues = {
  emit(cue: FaceCue): void {
    for (const fn of [...listeners]) {
      try {
        fn(cue);
      } catch (err) {
        console.warn("face: a cue listener failed", err);
      }
    }
  },
  on(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/**
 * Screen geometry → eye direction (degrees) from the face host to a target element: + yaw = her left (the child's
 * right on screen), + pitch = up. A face looking at the child's screen tilts more than a person at a table would, so the
 * depth is one host width (a look that reads as "at the tray", clamped by behaviour.ts to the eye limits).
 */
export function gazeAngles(face: { x: number; y: number; w: number; h: number }, target: { x: number; y: number; w: number; h: number }): [number, number] {
  const fx = face.x + face.w / 2, fy = face.y + face.h * 0.42; // her eyes sit a little above the host's centre
  const tx = target.x + target.w / 2, ty = target.y + target.h / 2;
  const depth = Math.max(80, face.w);
  const yaw = (Math.atan2(tx - fx, depth) * 180) / Math.PI;
  const pitch = (-Math.atan2(ty - fy, depth) * 180) / Math.PI;
  const c = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  return [c(yaw, -25, 25), c(pitch, -25, 20)];
}

/** Where a gaze target lives in the lesson DOM (W2-A's WorkTray / Board test ids). */
export const GAZE_SELECTOR: Record<Exclude<GazeTarget, "child">, string> = {
  tray: '[data-testid="tray"]',
  board: '[data-testid="board"], [data-testid="tray"]',
};
