// Yantra · the pure geometry between the beam law's board and the 3D bench (no three.js, no DOM; node --test imports it).
// The law's board: cell (x, y) has its centre at (x + 0.5, y + 0.5), y grows toward the child (down the screen), headings in
// degrees with 0 = +x and 90 = away from the child. The bench: 1 cell = 1 world unit, the board centred on the origin,
// x to the right, z toward the camera, y up. So a law point (px, py) sits at (px − cols/2, ·, py − rows/2), and a heading d
// points along (cos d, 0, −sin d), which is what a three.js rotation.y of d (radians) does to an object's local +x.
// Nothing here decides an outcome: trace() in beam.logic.ts is the law; these only place and time what it answered.
import type { BeamParams } from "../../families/yantra/beam.logic.ts";

export const BEAM_Y = 0.36;                  // the beam's height above the table top (mid-glass, under the block tops)
export const norm180 = (d: number) => ((d % 180) + 180) % 180;
export const rad = (d: number) => (d * Math.PI) / 180;

/** a law point (cell units) → the bench's x, z */
export const toWorld = (p: Pick<BeamParams, "cols" | "rows">, x: number, y: number): { x: number; z: number } => ({ x: x - p.cols / 2, z: y - p.rows / 2 });
/** the bench's x, z → a law point (cell units) */
export const toBoard = (p: Pick<BeamParams, "cols" | "rows">, x: number, z: number): { x: number; y: number } => ({ x: x + p.cols / 2, y: z + p.rows / 2 });
/** the board cell under a bench point, or null off the board */
export function cellAt(p: Pick<BeamParams, "cols" | "rows">, x: number, z: number): { x: number; y: number } | null {
  const b = toBoard(p, x, z), cx = Math.floor(b.x), cy = Math.floor(b.y);
  return cx >= 0 && cy >= 0 && cx < p.cols && cy < p.rows ? { x: cx, y: cy } : null;
}
/** the law's heading of a direction on the table (dx along x, dz toward the child) */
export const headingOf = (dx: number, dz: number) => ((Math.atan2(-dz, dx) * 180) / Math.PI + 360) % 360;

/**
 * A drag round a mirror: it started at heading `a0` (the finger's direction from the mirror's centre) with the mirror at
 * `r0`; the finger is now at heading `a`. → the mirror's heading snapped to the level's step, in [0, 180) (a mirror at r
 * and r + 180 is the same line, as the law reads it). A finger that goes once round turns the mirror once round.
 */
export function dragTurn(r0: number, a0: number, a: number, step: number): number {
  let d = a - a0;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return norm180(Math.round((r0 + d) / step) * step);
}

/**
 * The cell is one a mirror may stand on: on the board, not the lamp, not a wall, clear of the target. The same rule as
 * the law's own (beam.logic.ts cellFree), used only to choose what a tap means; the law still answers the act.
 */
export function freeCell(p: BeamParams, placed: { x: number; y: number }[], x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < p.cols && y < p.rows && !(x === p.lamp.x && y === p.lamp.y) && !p.walls.some((w) => w.x === x && w.y === y)
    && Math.hypot(x + 0.5 - p.target.x, y + 0.5 - p.target.y) > p.target.r + 0.3 && !placed.some((m) => m.x === x && m.y === y);
}

export interface BeamTimeline {
  /** segment lengths (cell units) and their running starts */
  lens: number[]; starts: number[]; total: number;
  /** seconds for the whole draw-out (a light pace: short paths are quick, long ones never drag) */
  dur: number;
}
/** How the beam is drawn out along the law's trace points: a constant speed, clamped to a duration a child can follow. */
export function beamTimeline(points: [number, number][]): BeamTimeline {
  const lens: number[] = [], starts: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) { const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]); starts.push(total); lens.push(l); total += l; }
  const dur = Math.max(0.55, Math.min(1.6, 0.25 + total * 0.085));
  return { lens, starts, total, dur };
}
/** the head's distance along the beam at time t (s) */
export const headAt = (tl: BeamTimeline, t: number) => tl.total * Math.max(0, Math.min(1, t / tl.dur));
/** the time (s) the head reaches point i (0 = the lamp) */
export const timeAt = (tl: BeamTimeline, i: number) => (i <= 0 ? 0 : i > tl.lens.length ? tl.dur : ((tl.starts[i - 1] + tl.lens[i - 1]) / (tl.total || 1)) * tl.dur);
