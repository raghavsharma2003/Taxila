// Kon · place: where the protractor's printed numbers stand (the outer scale and the inner one), in screen px about the
// protractor's centre, and where its lines run. One pure module for the view (kon.place.view.ts draws exactly these) and
// for the layout check (tests/r8-games-kon-layout.test.mjs computes the same boxes headlessly on every generated level,
// every turn).
//
// The hold of 2026-11-11 (kon/place): at 360 px after "Rakh do" the inner 80 and 100 ran together ("80100"). A number a
// child reads wrongly is a fail, so the lettering keeps every two scale numbers at least SCALE_GAP px apart:
//   - the outer numbers stand 13 px beyond the rim (0 and 180 a little inside, off the base line);
//   - an inner number hugs its long tick: its box's near side sits INNER_PAD px inside the tick's end, whatever its width
//     and the turn; the inner 0 and 180 lie along the base, lifted just clear of the base line (an arm runs along it).
// Judging round 3 (kon/place ruling 3): a number is never left out of one scale alone (she saw the outer number alone at
// a tick on the levels where the inner scale is the right one). Where two numbers would still come closer than SCALE_GAP:
//   1. a clashing number MOVES ALONG ITS OWN TICK (an inner number inward, at most INNER_SLIDE px; an outer one outward, at
//      most OUTER_SLIDE px), the least move that parts the pair without bringing it against another;
//   2. only where no move parts them, BOTH numbers at that tick (the outer and the inner) are left out together, the ends
//      0, 90 and 180 never.
// At 360 × 640, fade 1, the protractor flat: the inner 100 moves 15 px in along its tick, and every number prints; at 1366
// nothing moves. While she turns the loose protractor a number can slide or a pair come and go; placed, it is still. The
// digits stay digits and the size stays at the text floor; what moves or is left out depends on the size and the turn,
// never on the level's key (law 2).
import { KNOB_AT, PR } from "./kon.place.ts";
import { freeSpot, type Avoid, type Box } from "./kon.spot.ts";

/** the least room between two scale numbers' boxes (CSS px). A number's box is its advance width (the figures' side
 *  bearings included, so the ink gap is a little more) by its figure height: digits have no ascender or descender, so the
 *  text audit's 1.2 × px line box would call two numbers that stand diagonally 6 px apart "touching" */
export const SCALE_GAP = 4;
/** an outer number's centre stands this far beyond the rim (px) */
export const OUTER_OUT = 13;
/** an inner number's box keeps this far inside the end of its long tick (px) */
export const INNER_PAD = 2;
/** how far a clashing number may slide along its tick (px): an inner one inward, an outer one outward (the board keeps room
 *  for a few px beyond the outer numbers) */
export const INNER_SLIDE = 22, OUTER_SLIDE = 4;
/** a figure's height, as a share of the font px (Geist Mono's figures are 0.71 em; a little over, so a box holds its ink) */
export const INK_H = 0.74;

export type Measure = (s: string, px: number) => number;
/** Geist Mono's advance is 0.6 em for every figure: the headless width (the browser check compares it with the real one) */
export const monoMeasure: Measure = (s, px) => s.length * px * 0.6;

export interface ScaleLabel { a: number; ring: "outer" | "inner"; s: string; x: number; y: number; w: number; h: number; /** px moved along its tick */ slide: number }
/** what the lettering changes at this size and turn: the ticks whose two numbers are both left out (`inner` and `outer`
 *  always list the same ticks, judging round 3), and how far a number slides along its tick (by `${ring[0]}${a}`) */
export interface ScaleOmit { inner: number[]; outer: number[]; slide?: Record<string, number> }
export interface ScaleOpts {
  /** the protractor's turn (degrees, y up) and its radius in screen px */
  rot: number; R: number;
  /** its radius in board px (the small size protractor's ticks and end nudges scale with it) */
  rad0: number;
  /** a number every `every` degrees; the font px */
  every: number; fs: number;
  measure: Measure;
  /** the numbers left out and the slides (scaleOmit) */
  omit?: ScaleOmit;
}

const RAD = (d: number) => (d * Math.PI) / 180;
/** the long tick's length (px), as the view draws it */
export const longTick = (rad0: number) => 10 * Math.min(1, rad0 / PR + 0.2);
const lid = (ring: "outer" | "inner", a: number) => `${ring[0]}${a}`;

/** every printed number's centre and box (screen px, absolute: the centre is at cx, cy) */
export function scaleLabels(o: ScaleOpts, cx = 0, cy = 0): ScaleLabel[] {
  const out: ScaleLabel[] = [], k = o.rad0 === PR ? 1 : 1.4, h = o.fs * INK_H;
  const omitI = new Set(o.omit?.inner ?? []), omitO = new Set(o.omit?.outer ?? []), sl = o.omit?.slide ?? {};
  for (let a = 0; a <= 180; a += o.every) {
    if (!omitO.has(a)) {
      // the outer 0 and 180 sit a little inside the half-disc, off the base line (an arm runs along it)
      const s = String(a), w = o.measure(s, o.fs), phi = RAD(o.rot + a + (a === 0 ? 5 : a === 180 ? -5 : 0) * k), d = sl[lid("outer", a)] ?? 0, r = o.R + OUTER_OUT + d;
      out.push({ a, ring: "outer", s, x: cx + Math.cos(phi) * r, y: cy - Math.sin(phi) * r, w, h, slide: d });
    }
    // both scales numbered alike (90 is one number on both)
    if (a === 90 || omitI.has(a)) continue;
    const s = String(180 - a), w = o.measure(s, o.fs), d = sl[lid("inner", a)] ?? 0;
    // the half-extent of the number's box along a screen direction (y up)
    const ext = (dd: number) => (Math.abs(Math.cos(RAD(dd))) * w) / 2 + (Math.abs(Math.sin(RAD(dd))) * h) / 2;
    if (a === 0 || a === 180) {
      // the inner 180 and 0: along the base, hugging the end tick, and lifted just clear of the base line (an arm runs
      // along it): its box's lower side sits INNER_PAD over the line, whatever the turn; it slides inward along the base
      const b = o.rot + a, n = o.rot + 90, u = o.R - longTick(o.rad0) - INNER_PAD - ext(b) - d, v = ext(n) + INNER_PAD;
      const x = Math.cos(RAD(b)) * u + Math.cos(RAD(n)) * v, y = Math.sin(RAD(b)) * u + Math.sin(RAD(n)) * v;
      out.push({ a, ring: "inner", s, x: cx + x, y: cy - y, w, h, slide: d });
      continue;
    }
    // its near side hugs the long tick, on the tick's own radius (less its slide inward)
    const phi = o.rot + a, r = o.R - longTick(o.rad0) - INNER_PAD - ext(phi) - d;
    out.push({ a, ring: "inner", s, x: cx + Math.cos(RAD(phi)) * r, y: cy - Math.sin(RAD(phi)) * r, w, h, slide: d });
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

const isEnd = (a: number) => a === 0 || a === 90 || a === 180;
/** the turning handle: a ring of KNOB_RING px about the point KNOB_AT × R up the protractor's 90 (as the view draws it) */
export const KNOB_RING = 16;
function onKnob(l: ScaleLabel, R: number, rot: number): boolean {
  const kx = Math.cos(RAD(rot + 90)) * KNOB_AT * R, ky = -Math.sin(RAD(rot + 90)) * KNOB_AT * R, r = KNOB_RING + 1.5 + SCALE_GAP;
  const dx = Math.max(Math.abs(l.x - kx) - l.w / 2, 0), dy = Math.max(Math.abs(l.y - ky) - l.h / 2, 0);
  return Math.hypot(dx, dy) < r;
}
/** one protractor's slides with these ticks left out: the least slides that part every pair, or the tick to leave out */
function settle(base: Omit<ScaleOpts, "omit">, drop: number[]): { slide: Record<string, number>; need: number | null; stuck: boolean } {
  const slide: Record<string, number> = {};
  const labels = (sl: Record<string, number>) => scaleLabels({ ...base, omit: { inner: drop, outer: drop, slide: sl } });
  for (let it = 0; it < 40; it++) {
    const C = scaleClashes(labels(slide));
    if (!C.length) return { slide, need: null, stuck: false };
    const [p, q] = C[0];
    // the least slide of either number of the first pair that parts it and leaves fewer clashes (inner numbers first)
    let best: { id: string; d: number } | null = null;
    for (const l of [p, q].sort((x, y) => (x.ring === y.ring ? 0 : x.ring === "inner" ? -1 : 1))) {
      const id = lid(l.ring, l.a), max = l.ring === "inner" ? INNER_SLIDE : OUTER_SLIDE, d0 = slide[id] ?? 0;
      for (let d = d0 + 1; d <= max; d++) {
        const L = labels({ ...slide, [id]: d }), C2 = scaleClashes(L);
        // a sliding number never runs onto the turning handle's ring (the loose protractor's; kept placed too, so a number
        // does not jump when she presses "Rakh do")
        const me = L.find((x) => lid(x.ring, x.a) === id);
        if (me && base.rad0 === PR && onKnob(me, base.R, base.rot)) break;
        const still = C2.some(([x, y]) => (lid(x.ring, x.a) === lid(p.ring, p.a) && lid(y.ring, y.a) === lid(q.ring, q.a)) || (lid(x.ring, x.a) === lid(q.ring, q.a) && lid(y.ring, y.a) === lid(p.ring, p.a)));
        if (!still && C2.length < C.length) { if (!best || d - d0 < best.d) best = { id, d: d - d0 }; break; }
      }
    }
    if (best) { slide[best.id] = (slide[best.id] ?? 0) + best.d; continue; }
    // no slide parts them: both numbers at one tick go (the one nearer the top: a gap far from 90 is counted across)
    const ticks = [p, q].filter((l) => !isEnd(l.a)).map((l) => l.a).sort((x, y) => Math.abs(x - 90) - Math.abs(y - 90));
    return { slide, need: ticks[0] ?? null, stuck: !ticks.length };
  }
  return { slide, need: null, stuck: true };
}

const cachedFor = new Map<string, ScaleOmit[]>();
/** What the lettering changes at this size and turn (whole degrees: every turn she can give it): nothing unless two numbers
 *  would come closer than SCALE_GAP; then the least slides along the ticks, and only where no slide parts a pair, both numbers
 *  at a tick left out together (never the ends 0, 90 and 180, never one scale alone). `radii`: every protractor that must
 *  print the same numbers (size: the big one and the small one, always upright): a tick left out on one is left out on all;
 *  the slides are each protractor's own, so `slide` is the one for radii[0] (scaleOmitFor gives each one's). */
export function scaleOmit(radii: { R: number; rad0: number }[], every: number, fs: number, measure: Measure, rot = 0): ScaleOmit {
  return scaleOmitFor(radii, every, fs, measure, rot)[0];
}
/** scaleOmit for each protractor of `radii` (the same ticks left out, each with its own slides) */
export function scaleOmitFor(radii: { R: number; rad0: number }[], every: number, fs: number, measure: Measure, rot = 0): ScaleOmit[] {
  const turn = ((Math.round(rot) % 360) + 360) % 360;
  const key = `${radii.map((r) => `${r.R.toFixed(2)}/${r.rad0}`).join(",")}|${every}|${fs}|${measure("180", fs).toFixed(2)}|${turn}`;
  const hit = cachedFor.get(key);
  if (hit) return hit;
  const drop: number[] = [];
  let res: ReturnType<typeof settle>[] = [];
  for (let round = 0; round < 12; round++) {
    res = radii.map(({ R, rad0 }) => settle({ rot: turn, R, rad0, every, fs, measure }, drop));
    const need = res.map((r) => r.need).find((n) => n !== null);
    if (need === undefined || need === null || drop.includes(need)) break;
    drop.push(need);
  }
  const ticks = [...drop].sort((p, q) => p - q);
  const out = res.map((r) => ({ inner: ticks, outer: ticks, slide: r.slide }));
  if (cachedFor.size > 2048) cachedFor.clear();
  cachedFor.set(key, out);
  return out;
}

export type Pt = [number, number];
export interface ProtLine { kind: "rim" | "edge" | "base" | "tick" | "mark"; a: Pt; b: Pt; /** a tick's place on the outer scale */ deg?: number }
/** Every line of a protractor, in screen px (y down) about its centre (cx, cy): the rim (as chords every 5°), the strip's
 *  two sides and its bottom edge, the base line, the ticks (every 5°, long every 10°) and the centre mark (9 px into the
 *  half-disc). The view draws the base, the ticks and the mark from these; the letters A, B and O keep clear of all of them
 *  (judging round 3, kon/place ruling 2: the bottom edge struck through O on the placed screens). */
export function protractorLines(cx: number, cy: number, R: number, depth: number, rot: number, rad0 = PR): ProtLine[] {
  const at = (deg: number, r: number): Pt => [cx + Math.cos(RAD(rot + deg)) * r, cy - Math.sin(RAD(rot + deg)) * r];
  const dn = (p: Pt): Pt => [p[0] + Math.cos(RAD(rot - 90)) * depth, p[1] - Math.sin(RAD(rot - 90)) * depth];
  const out: ProtLine[] = [];
  for (let a = 0; a < 180; a += 5) out.push({ kind: "rim", a: at(a, R), b: at(a + 5, R) });
  const e0 = at(0, R), e180 = at(180, R);
  out.push({ kind: "edge", a: e180, b: dn(e180) }, { kind: "edge", a: dn(e180), b: dn(e0) }, { kind: "edge", a: dn(e0), b: e0 });
  out.push({ kind: "base", a: e180, b: e0 });
  for (let a = 0; a <= 180; a += 5) { const len = a % 10 === 0 ? longTick(rad0) : longTick(rad0) / 2; out.push({ kind: "tick", a: at(a, R), b: at(a, R - len), deg: a }); }
  out.push({ kind: "mark", a: [cx, cy], b: [cx + Math.cos(RAD(rot + 90)) * 9, cy - Math.sin(RAD(rot + 90)) * 9] });
  return out;
}

/** a figure letter's font px, and its ink box's height (capitals: about the figures' height) */
export const LETTER_PX = 16;
/** candidate centres round a point, by how far they turn from heading `from` (screen radians, y down) first and only then
 *  by distance: a letter keeps to its own side of the point (O away from the angle's opening) and steps further out
 *  before it swings round into the angle */
export function fan(o: Pt, radii: number[], from: number, step = 15): Pt[] {
  const out: Pt[] = [];
  for (let dev = 0; dev <= 180; dev += step) for (const sgn of dev === 0 || dev === 180 ? [1] : [1, -1]) {
    const a = from + (sgn * dev * Math.PI) / 180;
    for (const r of radii) out.push([o[0] + r * Math.cos(a), o[1] + r * Math.sin(a)]);
  }
  return out;
}
/** Where a figure letter (A, B, O) stands: the first spot of fan(o, radii, from) whose ink box (w × h) keeps SCALE_GAP px
 *  from every line and box in `avoid` (the protractor's lines, the arms and her lines, the scale numbers, the dots and the
 *  ring) and stays inside `bounds`; null when none does. Judging round 3 (kon/place ruling 2): O is visible in every pose
 *  and play-out and never on a line of the protractor. */
export function letterSpot(o: Pt, from: number, radii: number[], w: number, h: number, avoid: Avoid, bounds: Box): Pt | null {
  return freeSpot(fan(o, radii, from), w, h, avoid, bounds, SCALE_GAP);
}
/** a scale number's box (for the letters to keep clear of) */
export const numberBox = (l: ScaleLabel): Box => ({ x: l.x - l.w / 2, y: l.y - l.h / 2, w: l.w, h: l.h });
