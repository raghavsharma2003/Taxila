// Lay a whiteboard out FOR the box it is shown in (round 3, stream forge). OWNED BY forge (src/studio/**). Pure: no React,
// no DOM; the server's tests and the QA harness import it too.
//
// Why (docs/design/round3/forge/audit, 2026-10-09): a board is drawn in board units on a fixed board (400 x 300 templates,
// 677 x 423 number lines, 800 x 500 live and catalogue boards) and the stage SCALED the whole board into the tray. On a
// 360 phone the tray gives a board 324 px of width, so an 800-unit board's 24-unit words render at 9.7 px and a 677-unit
// number line's at 11 px: the library matrix found 381/382 catalogue boards below the 14 px floor at 360 x 800, and the
// camera (boardView.ts) only helps when the drawing sits in a corner. Shrinking the words is the defect, not a fix.
//
// The fix is how maps draw labels: the GEOMETRY scales to the box, the WORDS keep their size. The script's coordinates are
// multiplied by f (< 1) while every text keeps its s / m / l size, so on screen the words grow by 1/f relative to the
// picture; the board becomes the union of the scaled drawing and the words' boxes plus a margin (nothing is cut). A
// candidate is kept only when it is as clean as the original under the same checks the server's gate uses: no two words
// overlap (shared/whiteboard.js lintScript), every word stays inside the board, and no word is crossed by more lines than
// before. The largest f (the least change) that brings the smallest word to the floor wins; when none reaches the floor,
// the cleanest candidate with a real gain (≥ 1 px) is used and the miss is reported; when none is clean, the board is
// shown as drawn (and the visual QA counts it).
//
// A "continue" board draws on the board before it (src/modules/whiteboard/StudioWhiteboard.tsx priorFor matches boards by
// size), so a lesson's transform is decided once per (lesson, board size) by its fresh board and REUSED for every
// continue board on it (rememberTransform / transformFor below), or the two would not line up.
import { lintScript, opGeometry, TEXT_SIZE } from "../../shared/whiteboard.js";
import type { WhiteboardScript } from "../../shared/studio.ts";
import { FLOORS } from "../../shared/play.ts";

type Pt = [number, number];
type Op = Record<string, unknown> & { op: string; id: string };
interface Box { x: number; y: number; w: number; h: number }
export interface BoardTransform { f: number; dx: number; dy: number; w: number; h: number }
export interface FitResult { script: WhiteboardScript; t: BoardTransform | null; pxBefore: number | null; pxAfter: number | null; reached: boolean; why: string }

/** The floor a board's smallest word is fitted to: shared/play.ts FLOORS (14 px; 16 px for classes 4-5), never a copy. */
export const BOARD_FLOOR_PX: number = FLOORS.text;
export const BOARD_FLOOR_PX_YOUNG: number = FLOORS.textYoung;
/** The most the geometry is shrunk relative to the words (below this the picture becomes a decoration of its labels). */
export const MIN_F = 0.42;
const STEP = 0.04;
const MARGIN = 14;

const isPt = (p: unknown): p is Pt => Array.isArray(p) && p.length === 2 && typeof p[0] === "number" && typeof p[1] === "number";

/** Text sizes (board units) of every word the script draws (carries in number work are small by design and excluded). */
export function textUnits(script: { ops: Op[] }): number[] {
  const byId = new Map(script.ops.map((o) => [o.id, o]));
  const out: number[] = [];
  for (const o of script.ops) {
    if (o.op === "text") out.push(TEXT_SIZE[(o.size as "s" | "m" | "l") ?? "m"] ?? TEXT_SIZE.m);
    else if (o.op === "label") out.push(TEXT_SIZE.s);
    else if (o.op === "numwork") {
      try {
        for (const t of opGeometry(o as never, byId as never).texts) if (!t.small) out.push(t.size);
      } catch { out.push(TEXT_SIZE.m); }
    }
  }
  return out;
}

/** The smallest word's rendered px when a board of design (w, h) is fitted into box (bw, bh). null when no words. */
export function minPxAt(script: { ops: Op[] }, design: { w: number; h: number }, box: { w: number; h: number }): number | null {
  const u = textUnits(script);
  if (!u.length || !(design.w > 0) || !(design.h > 0)) return null;
  const k = Math.min(box.w / design.w, box.h / design.h);
  return Math.round(Math.min(...u) * k * 10) / 10;
}

/** Scale an op's coordinates by f and shift by (dx, dy); text sizes are untouched. */
function scaleOp(o: Op, f: number, dx: number, dy: number): Op {
  const P = (p: unknown) => (isPt(p) ? [Math.round((p[0] * f + dx) * 10) / 10, Math.round((p[1] * f + dy) * 10) / 10] as Pt : p);
  const S = (n: unknown) => (typeof n === "number" ? Math.round(n * f * 10) / 10 : n);
  const r: Op = { ...o };
  if ("at" in o) r.at = P(o.at);
  if ("to" in o) r.to = P(o.to);
  if ("from" in o) r.from = P(o.from);
  if ("c" in o) r.c = P(o.c);
  if (Array.isArray(o.points)) r.points = (o.points as unknown[]).map(P);
  if (o.op === "rect") { r.w = S(o.w); r.h = S(o.h); }
  if (o.op === "circle" || o.op === "sector") r.r = S(o.r);
  if (o.op === "ellipse") { r.rx = S(o.rx); r.ry = S(o.ry); }
  return r;
}

/** Line segments a word must not be crossed by: lines, arrow shafts, strokes, polygon and box edges. */
function segments(ops: Op[]): { id: string; a: Pt; b: Pt }[] {
  const out: { id: string; a: Pt; b: Pt }[] = [];
  const chain = (id: string, pts: Pt[], closed = false) => {
    for (let i = 1; i < pts.length; i++) out.push({ id, a: pts[i - 1], b: pts[i] });
    if (closed && pts.length > 2) out.push({ id, a: pts[pts.length - 1], b: pts[0] });
  };
  for (const o of ops) {
    if ((o.op === "line" || o.op === "arrow") && isPt(o.from) && isPt(o.to) && !o.bend) chain(o.id, [o.from, o.to]);
    else if (o.op === "stroke" && Array.isArray(o.points)) chain(o.id, (o.points as unknown[]).filter(isPt));
    else if (o.op === "polygon" && Array.isArray(o.points)) chain(o.id, (o.points as unknown[]).filter(isPt), true);
    else if (o.op === "rect" && isPt(o.at) && typeof o.w === "number" && typeof o.h === "number") {
      const [x, y] = o.at; const w = o.w, h = o.h;
      chain(o.id, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true);
    }
  }
  return out;
}
function segHitsBox(a: Pt, b: Pt, bx: Box): boolean {
  let t0 = 0, t1 = 1;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] - bx.x], [dx, bx.x + bx.w - a[0]], [-dy, a[1] - bx.y], [dy, bx.y + bx.h - a[1]]] as [number, number][]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 <= t1;
}
/** How many words a drawn line crosses (the server gate's W2 rule: touching is fine, crossing is not). */
export function crossings(ops: Op[]): number {
  const byId = new Map(ops.map((o) => [o.id, o]));
  const segs = segments(ops);
  let n = 0;
  for (const o of ops) {
    if (o.op !== "text" && o.op !== "label") continue;
    let g: Box;
    try { g = opGeometry((o.op === "label" ? { ...o, to: undefined, target: undefined } : o) as never, byId as never).box; } catch { continue; }
    const b = { x: g.x + 2, y: g.y + 2, w: Math.max(0, g.w - 4), h: Math.max(0, g.h - 4) };
    if (segs.some((s) => s.id !== o.id && segHitsBox(s.a, s.b, b))) n++;
  }
  return n;
}

/** The union box of every op (shapes, words, label leaders) in board units. */
function unionBox(ops: Op[]): Box | null {
  const byId = new Map(ops.map((o) => [o.id, o]));
  let x = Infinity, y = Infinity, X = -Infinity, Y = -Infinity;
  for (const o of ops) {
    if (o.op === "erase") continue;
    let b: Box;
    try { b = opGeometry(o as never, byId as never).box; } catch { continue; }
    if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) continue;
    // a highlight ring is drawn 8-12 units outside its target
    const pad = o.op === "highlight" ? 4 : 0;
    x = Math.min(x, b.x - pad); y = Math.min(y, b.y - pad); X = Math.max(X, b.x + b.w + pad); Y = Math.max(Y, b.y + b.h + pad);
    if (isPt(o.to)) { x = Math.min(x, o.to[0]); y = Math.min(y, o.to[1]); X = Math.max(X, o.to[0]); Y = Math.max(Y, o.to[1]); }
  }
  return Number.isFinite(x) ? { x, y, w: X - x, h: Y - y } : null;
}

/** Apply a transform to a script (geometry scaled and shifted, words kept, the board resized). */
export function applyTransform(script: WhiteboardScript, t: BoardTransform): WhiteboardScript {
  const s = script as unknown as { ops: Op[]; board: { w: number; h: number; ground?: string } };
  return { ...script, board: { ...s.board, w: t.w, h: t.h }, ops: s.ops.map((o) => scaleOp(o, t.f, t.dx, t.dy)) } as unknown as WhiteboardScript;
}

/** The transform for scale f: the scaled drawing and its words, shifted to a MARGIN from the top-left, on a board that holds them. */
function transformAt(script: WhiteboardScript, f: number): BoardTransform | null {
  const s = script as unknown as { ops: Op[]; board: { w: number; h: number } };
  const scaled = s.ops.map((o) => scaleOp(o, f, 0, 0));
  const u = unionBox(scaled);
  if (!u) return null;
  const w = Math.round(u.w + 2 * MARGIN), h = Math.round(u.h + 2 * MARGIN);
  // the whiteboard script's board limits (shared/whiteboard.js LIMITS.minBoard 100)
  if (w < 100 || h < 100) {
    const W = Math.max(100, w), H = Math.max(100, h);
    return { f, dx: Math.round(MARGIN - u.x + (W - w) / 2), dy: Math.round(MARGIN - u.y + (H - h) / 2), w: W, h: H };
  }
  return { f, dx: Math.round(MARGIN - u.x), dy: Math.round(MARGIN - u.y), w, h };
}

/**
 * Fit a FRESH board to a box. Returns the script to draw (the original when it already meets the floor, has no words, or
 * no clean candidate exists) and the transform used (to be reused by the lesson's continue boards).
 * @param design  the size the stage would show for the original (the board, or its camera frame)
 */
export function fitBoard(script: WhiteboardScript, box: { w: number; h: number }, design: { w: number; h: number }, floorPx = BOARD_FLOOR_PX): FitResult {
  const s = script as unknown as { ops: Op[]; mode?: string; board: { w: number; h: number } };
  const pxBefore = minPxAt(s, design, box);
  const same = (why: string, reached: boolean): FitResult => ({ script, t: null, pxBefore, pxAfter: pxBefore, reached, why });
  if (pxBefore == null) return same("no words", true);
  if (pxBefore >= floorPx) return same("meets the floor as drawn", true);
  if (!Array.isArray(s.ops) || !s.ops.length) return same("nothing drawn", false);
  const before = lintScript(script).filter((i) => i.check === "text_overlap").length;
  const crossBefore = crossings(s.ops);
  let best: FitResult | null = null;
  for (let f = 1 - STEP; f >= MIN_F - 1e-9; f -= STEP) {
    const t = transformAt(script, Math.round(f * 100) / 100);
    if (!t) break;
    const cand = applyTransform(script, t);
    const ops = (cand as unknown as { ops: Op[] }).ops;
    const lint = lintScript(cand);
    if (lint.some((i) => i.check === "inside_board")) continue;
    if (lint.filter((i) => i.check === "text_overlap").length > before) continue;
    if (crossings(ops) > crossBefore) continue;
    const px = minPxAt(cand as unknown as { ops: Op[] }, { w: t.w, h: t.h }, box);
    if (px == null) continue;
    if (px >= floorPx) return { script: cand, t, pxBefore, pxAfter: px, reached: true, why: `geometry x${t.f}, words kept` };
    if (!best || (best.pxAfter ?? 0) < px) best = { script: cand, t, pxBefore, pxAfter: px, reached: false, why: `geometry x${t.f}: best clean layout, below the floor` };
  }
  if (best && (best.pxAfter ?? 0) >= pxBefore + 1) return best;
  return same("no clean layout reaches the floor: shown as drawn", false);
}

// ── the lesson's transforms (continue boards reuse their fresh board's) ──
const remembered = new Map<string, BoardTransform | null>();
const keyOf = (script: WhiteboardScript) => {
  const s = script as unknown as { line?: { lessonId?: string }; board: { w: number; h: number } };
  return `${s.line?.lessonId ?? ""}|${s.board.w}x${s.board.h}`;
};
/** Remember the transform a fresh board was drawn with (null = drawn as is), for the continue boards that follow it. */
export function rememberTransform(script: WhiteboardScript, t: BoardTransform | null): void {
  remembered.set(keyOf(script), t);
  if (remembered.size > 200) remembered.delete(remembered.keys().next().value as string);
}
/** The transform a continue board must use (its fresh board's), or undefined when its fresh board was never seen here. */
export function transformFor(script: WhiteboardScript): BoardTransform | null | undefined {
  return remembered.has(keyOf(script)) ? remembered.get(keyOf(script)) ?? null : undefined;
}
export const _forgetTransforms = () => remembered.clear();
