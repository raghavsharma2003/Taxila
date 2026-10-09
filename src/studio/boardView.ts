// The part of a whiteboard the stage frames (round 3, stream forge). OWNED BY forge (src/studio/**).
//
// Why (docs/design/round3/forge/audit, taxila.dev 2026-10-09): boards were drawn on a fixed 400 x 300 or 800 x 500 board
// and the stage fitted the WHOLE board into the tray, so a drawing in one corner of an empty slate showed at a fraction of
// the size it could have (the "3 equal groups" board filled 24% of its box; an 800 x 500 board's labels came out at
// 9-13 px on a 360 phone). The fix is the camera, not the drawing: the stage frames the drawn content (its union box plus a
// margin), within the board, so the same script shows larger and centred, every relation between its parts unchanged.
// (The server's whiteboard gate W1 still judges the whole board at its fixed phone tray, 11 px floor; the stage's own
// legibility work on the child's box is this frame plus boardFit.ts, and the forge3 visual QA measures the result.)
//
// Rules: never frame a "continue" board (it draws on an earlier board whose content the stage does not know); never zoom
// more than MAX_ZOOM (a one-word board does not become a poster); keep an aspect the tray holds (0.6..2.2); never crop a
// drawn op (the frame always contains every op's box plus the margin, or the whole board).
import { opGeometry } from "../../shared/whiteboard.js";

export interface BoardFrame { x: number; y: number; w: number; h: number; zoom: number; framed: boolean }
interface ScriptLike { mode?: string; board: { w: number; h: number }; ops: Array<Record<string, unknown> & { op: string; id: string }> }

export const MAX_ZOOM = 2;
const MIN_ASPECT = 0.6, MAX_ASPECT = 2.2;

/** The content box of a script's drawable ops (board units), or null when nothing is drawable. */
export function contentBox(script: ScriptLike): { x: number; y: number; w: number; h: number } | null {
  const byId = new Map(script.ops.map((o) => [o.id, o]));
  let x = Infinity, y = Infinity, X = -Infinity, Y = -Infinity;
  for (const o of script.ops) {
    if (o.op === "erase" || o.op === "highlight") continue;
    let b: { x: number; y: number; w: number; h: number } | null = null;
    try { b = (opGeometry as (o: unknown, m: unknown) => { box: { x: number; y: number; w: number; h: number } })(o, byId).box; } catch { b = null; }
    if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.y)) continue;
    x = Math.min(x, b.x); y = Math.min(y, b.y); X = Math.max(X, b.x + b.w); Y = Math.max(Y, b.y + b.h);
    // a label's leader end is part of the picture too
    const to = (o as { to?: unknown }).to;
    if (Array.isArray(to) && to.length === 2 && to.every((n) => typeof n === "number")) { x = Math.min(x, to[0]); y = Math.min(y, to[1]); X = Math.max(X, to[0]); Y = Math.max(Y, to[1]); }
  }
  return Number.isFinite(x) ? { x, y, w: Math.max(1, X - x), h: Math.max(1, Y - y) } : null;
}

/**
 * The frame the stage shows for a whiteboard script (board units). The whole board when framing does not help (content
 * already fills it, a continue board, nothing drawable).
 */
export function boardFrame(script: ScriptLike | null | undefined): BoardFrame {
  const BW = Number(script?.board?.w) || 400, BH = Number(script?.board?.h) || 300;
  const whole: BoardFrame = { x: 0, y: 0, w: BW, h: BH, zoom: 1, framed: false };
  if (!script || script.mode === "continue" || !Array.isArray(script.ops) || !script.ops.length) return whole;
  const c = contentBox(script);
  if (!c) return whole;
  // margin: room for strokes, jitter and the highlight ring (the player draws rings 8-10 units outside a box)
  const m = Math.max(14, 0.06 * Math.max(c.w, c.h));
  let x = c.x - m, y = c.y - m, w = c.w + 2 * m, h = c.h + 2 * m;
  // never zoom past MAX_ZOOM: grow around the content's centre
  const minW = BW / MAX_ZOOM, minH = BH / MAX_ZOOM;
  if (w < minW) { x -= (minW - w) / 2; w = minW; }
  if (h < minH) { y -= (minH - h) / 2; h = minH; }
  // an aspect the tray holds
  if (w / h > MAX_ASPECT) { const nh = w / MAX_ASPECT; y -= (nh - h) / 2; h = nh; }
  if (w / h < MIN_ASPECT) { const nw = h * MIN_ASPECT; x -= (nw - w) / 2; w = nw; }
  // inside the board (slide, then clip to the board)
  w = Math.min(w, BW); h = Math.min(h, BH);
  x = Math.max(0, Math.min(x, BW - w)); y = Math.max(0, Math.min(y, BH - h));
  const zoom = Math.min(BW / w, BH / h);
  // framing that gains under 8% is not worth a different composition from the drawing's own
  if (zoom < 1.08) return whole;
  const r = (n: number) => Math.round(n * 10) / 10;
  return { x: r(x), y: r(y), w: r(w), h: r(h), zoom: Math.round(zoom * 100) / 100, framed: true };
}
