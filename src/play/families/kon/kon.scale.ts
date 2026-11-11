// Kon · place: where the protractor's printed numbers stand (the outer scale and the inner one), in screen px about the
// protractor's centre. One pure function for the view (kon.place.view.ts draws exactly these) and for the layout check
// (tests/r8-games-kon-layout.test.mjs computes the same boxes headlessly on every generated level, every turn).
//
// The hold of 2026-11-11 (kon/place): at 360 px after "Rakh do" the inner 80 and 100 ran together ("80100"). A number a
// child reads wrongly is a fail, so the lettering now keeps every two scale numbers at least SCALE_GAP px apart:
//   - the outer numbers stand where they did (13 px beyond the rim; 0 and 180 a little inside, off the base line);
//   - an inner number hugs its long tick: its box's near side sits INNER_PAD px inside the tick's end, whatever its width
//     and the turn (the crowded top gains about 5 px of radius over the old fixed R − 24); the inner 0 and 180 lie along
//     the base, lifted just clear of the base line (an arm runs along it);
//   - if two numbers would still come closer than SCALE_GAP at this size and turn, the fewest numbers that part every such
//     pair are left out (inner before outer, nearest the top first; the ends 0, 90 and 180 always print). At 360 × 640,
//     fade 1, the protractor flat: the inner 100 only (the inner 80 and the outer 100 and 80 still print at those ticks);
//     at 1366 nothing is left out. While she turns the loose protractor a number can come and go; placed, it is still.
// The digits stay digits and the size stays at the text floor; what is left out depends on the size and the turn, never
// on the level's key (law 2).
import { PR } from "./kon.place.ts";

/** the least room between two scale numbers' boxes (CSS px). A number's box is its advance width (the figures' side
 *  bearings included, so the ink gap is a little more) by its figure height: digits have no ascender or descender, so the
 *  text audit's 1.2 × px line box would call two numbers that stand diagonally 6 px apart "touching" */
export const SCALE_GAP = 4;
/** an outer number's centre stands this far beyond the rim (px) */
export const OUTER_OUT = 13;
/** an inner number's box keeps this far inside the end of its long tick (px) */
export const INNER_PAD = 2;
/** a figure's height, as a share of the font px (Geist Mono's figures are 0.71 em; a little over, so a box holds its ink) */
export const INK_H = 0.74;

export type Measure = (s: string, px: number) => number;
/** Geist Mono's advance is 0.6 em for every figure: the headless width (the browser check compares it with the real one) */
export const monoMeasure: Measure = (s, px) => s.length * px * 0.6;

export interface ScaleLabel { a: number; ring: "outer" | "inner"; s: string; x: number; y: number; w: number; h: number }
export interface ScaleOpts {
  /** the protractor's turn (degrees, y up) and its radius in screen px */
  rot: number; R: number;
  /** its radius in board px (the small size protractor's ticks and end nudges scale with it) */
  rad0: number;
  /** a number every `every` degrees; the font px */
  every: number; fs: number;
  measure: Measure;
  /** the numbers left out (scaleOmit), by their position a on the outer scale */
  omit?: { inner: number[]; outer: number[] };
}

const RAD = (d: number) => (d * Math.PI) / 180;
/** the long tick's length (px), as the view draws it */
export const longTick = (rad0: number) => 10 * Math.min(1, rad0 / PR + 0.2);

/** every printed number's centre and box (screen px, absolute: the centre is at cx, cy) */
export function scaleLabels(o: ScaleOpts, cx = 0, cy = 0): ScaleLabel[] {
  const out: ScaleLabel[] = [], k = o.rad0 === PR ? 1 : 1.4, h = o.fs * INK_H;
  const omitI = new Set(o.omit?.inner ?? []), omitO = new Set(o.omit?.outer ?? []);
  for (let a = 0; a <= 180; a += o.every) {
    if (!omitO.has(a)) {
      // the outer 0 and 180 sit a little inside the half-disc, off the base line (an arm runs along it)
      const s = String(a), w = o.measure(s, o.fs), phi = RAD(o.rot + a + (a === 0 ? 5 : a === 180 ? -5 : 0) * k), r = o.R + OUTER_OUT;
      out.push({ a, ring: "outer", s, x: cx + Math.cos(phi) * r, y: cy - Math.sin(phi) * r, w, h });
    }
    // both scales numbered alike (90 is one number on both)
    if (a === 90 || omitI.has(a)) continue;
    const s = String(180 - a), w = o.measure(s, o.fs);
    // the half-extent of the number's box along a screen direction (y up)
    const ext = (d: number) => (Math.abs(Math.cos(RAD(d))) * w) / 2 + (Math.abs(Math.sin(RAD(d))) * h) / 2;
    if (a === 0 || a === 180) {
      // the inner 180 and 0: along the base, hugging the end tick, and lifted just clear of the base line (an arm runs
      // along it): its box's lower side sits INNER_PAD over the line, whatever the turn
      const b = o.rot + a, n = o.rot + 90, u = o.R - longTick(o.rad0) - INNER_PAD - ext(b), v = ext(n) + INNER_PAD;
      const x = Math.cos(RAD(b)) * u + Math.cos(RAD(n)) * v, y = Math.sin(RAD(b)) * u + Math.sin(RAD(n)) * v;
      out.push({ a, ring: "inner", s, x: cx + x, y: cy - y, w, h });
      continue;
    }
    // its near side hugs the long tick, on the tick's own radius
    const phi = o.rot + a, r = o.R - longTick(o.rad0) - INNER_PAD - ext(phi);
    out.push({ a, ring: "inner", s, x: cx + Math.cos(RAD(phi)) * r, y: cy - Math.sin(RAD(phi)) * r, w, h });
  }
  return out;
}

/** the room between two labels' boxes (px; negative when they overlap): the larger of the two axis gaps */
export function labelGap(p: ScaleLabel, q: ScaleLabel): number {
  const gx = Math.abs(p.x - q.x) - (p.w + q.w) / 2, gy = Math.abs(p.y - q.y) - (p.h + q.h) / 2;
  return Math.max(gx, gy);
}
/** every pair of labels closer than `gap` px */
export function scaleClashes(L: ScaleLabel[], gap = SCALE_GAP): [ScaleLabel, ScaleLabel, number][] {
  const out: [ScaleLabel, ScaleLabel, number][] = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const g = labelGap(L[i], L[j]); if (g < gap) out.push([L[i], L[j], g]); }
  return out;
}

const cache = new Map<string, { inner: number[]; outer: number[] }>();
/** The numbers this protractor leaves out at this size and turn (whole degrees: every turn she can give it): none unless
 *  two would come closer than SCALE_GAP; then the fewest numbers that part every such pair (inner ones before outer ones,
 *  then the ones nearest the top; the ends 0, 90 and 180 always print). Leaving a number out never moves another, so the
 *  clashes are known up front and the smallest cover is found by trying the sets in order of size (a handful of numbers).
 *  `radii`: every protractor that must print the same numbers (size: the big one and the small one, always upright). */
export function scaleOmit(radii: { R: number; rad0: number }[], every: number, fs: number, measure: Measure, rot = 0): { inner: number[]; outer: number[] } {
  const turn = ((Math.round(rot) % 360) + 360) % 360;
  const key = `${radii.map((r) => `${r.R.toFixed(2)}/${r.rad0}`).join(",")}|${every}|${fs}|${measure("180", fs).toFixed(2)}|${turn}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const id = (l: ScaleLabel) => `${l.ring[0]}${l.a}`, end = (l: ScaleLabel) => l.a === 0 || l.a === 180 || l.a === 90;
  const edges: [string | null, string | null][] = [], cand = new Map<string, ScaleLabel>();
  for (const { R, rad0 } of radii) for (const [p, q] of scaleClashes(scaleLabels({ rot: turn, R, rad0, every, fs, measure }))) {
    const e: [string | null, string | null] = [end(p) ? null : id(p), end(q) ? null : id(q)];
    if (!e[0] && !e[1]) continue;   // only ends: nothing to leave out (the layout check refuses it)
    edges.push(e);
    for (const l of [p, q]) if (!end(l)) cand.set(id(l), l);
  }
  const C = [...cand.values()];
  const cost = (set: ScaleLabel[]) => set.reduce((s, l) => s + (l.ring === "outer" ? 1000 : 0) + Math.abs(l.a - 90), 0);
  let best: ScaleLabel[] = [];
  if (edges.length) {
    best = C;
    const n = Math.min(C.length, 16);
    let bestN = C.length;
    for (let m = 1; m < 1 << n; m++) {
      const set = C.filter((_, i) => (m >> i) & 1);
      if (set.length > bestN) continue;
      const ids = new Set(set.map(id));
      if (!edges.every(([a, b]) => (a && ids.has(a)) || (b && ids.has(b)))) continue;
      // fewer first; then inner before outer, and nearest the top (a drop far from 90 leaves a gap she counts across)
      if (set.length < bestN || cost(set) < cost(best)) { best = set; bestN = set.length; }
    }
  }
  const omit = { inner: best.filter((l) => l.ring === "inner").map((l) => l.a).sort((p, q) => p - q), outer: best.filter((l) => l.ring === "outer").map((l) => l.a).sort((p, q) => p - q) };
  if (cache.size > 2048) cache.clear();
  cache.set(key, omit);
  return omit;
}
