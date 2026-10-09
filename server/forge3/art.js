// forge3 art direction (round 3, stream forge): the look of a live-built piece is chosen by code, varied across lessons and
// subjects, and never a model's choice.
//
// Measured before (docs/design/round3/forge/audit, taxila.dev 2026-10-09): 12/12 visual asks drew the same green
// chalkboard (board.ground "chalk"), and every Studio v2 engine paints a near-black ground; the Desk around them is cream.
// The whiteboard renderer already has three grounds with designed palettes (src/modules/whiteboard/palette.ts: chalk,
// paper, grid); the play stream's pieces have four art directions (shared/play.ts ARTS, picked by pickArt). This file picks
// among them by rule:
//   - the subject's fit first (maths number and geometry work on grid paper or the chalkboard; EVS / science / SST on paper),
//   - classes 4-5 prefer light grounds (the play stream's band rule),
//   - one ground per LESSON (every board of a worked example looks the same), varied ACROSS lessons by the lesson id,
//   - a "continue" board keeps the ground of the board it continues (it draws on the same board).
// (shared/play.ts is the play stream's file: it is loaded lazily, so the board path in server/studio/seam.js never depends on it)

export const BOARD_GROUNDS = Object.freeze(["chalk", "paper", "grid"]);

/** "c6-maths-ch07-t01" → { classLevel: 6, subject: "maths" } */
export function topicParts(topicId) {
  const m = /^c(\d+)-([a-z]+)-/.exec(String(topicId ?? ""));
  return m ? { classLevel: Number(m[1]), subject: m[2] } : { classLevel: null, subject: null };
}

const PREF = {
  maths: ["grid", "chalk", "paper"],
  science: ["paper", "grid", "chalk"],
  evs: ["paper", "grid", "chalk"],
  sst: ["paper", "chalk", "grid"],
  english: ["paper", "chalk", "grid"],
  hindi: ["paper", "chalk", "grid"],
};
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/**
 * The ground for a lesson's boards. PURE.
 * @param {{ topicId?: string, lessonId?: string, lastGround?: string | null }} o  lastGround: the child's previous lesson's ground (when known)
 */
export function boardGroundFor({ topicId, lessonId, lastGround = null } = {}) {
  const { classLevel, subject } = topicParts(topicId);
  let pref = [...(PREF[subject] ?? ["paper", "grid", "chalk"])];
  if (classLevel != null && classLevel <= 5) pref = [...pref.filter((g) => g !== "chalk"), "chalk"];
  // the first two preferences alternate across lessons (variety), never the child's last one when another fits
  const pick = pref.slice(0, 2);
  const i = hash(lessonId ?? topicId ?? "") % pick.length;
  let g = pick[i];
  if (lastGround && g === lastGround) g = pick[(i + 1) % pick.length];
  return g;
}

/**
 * Dress a board script with its lesson's ground (a "continue" board keeps the ground of the board it continues).
 * Returns a new script; never changes ops, timing or facts.
 */
export function dressBoard(script, { ground, prevGround = null } = {}) {
  if (!script?.board) return script;
  const g = script.mode === "continue" && prevGround ? prevGround : ground;
  if (!BOARD_GROUNDS.includes(g) || script.board.ground === g) return script;
  return { ...script, board: { ...script.board, ground: g } };
}

/** A play piece's art direction (shared/play.ts pickArt, with the lesson's last art for rotation). null when unknown. */
export async function playArtFor({ family, topicId, childArt = null, lastArt = null, topicArts = null }) {
  const { classLevel, subject } = topicParts(topicId);
  const subj = subject === "maths" ? "maths" : subject === "evs" ? "evs" : "science";
  try {
    const { pickArt, FAMILY_ARTS } = await import("../../shared/play.ts");
    if (!FAMILY_ARTS?.[family]) return null;
    return pickArt({ family, subject: subj, topicId, classLevel: classLevel ?? 6, topicArts: topicArts ?? undefined, childArt, lastArt });
  } catch { return null; }
}
