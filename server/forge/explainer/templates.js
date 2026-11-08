// explainer@1 / diagram templates (W2-B #2, #3): rungs 4-5 of the Studio fallback ladder (LIVE-STUDIO §3.12). A
// template call is DATA (which template, a few numbers, a few short labels); this file turns it into a timed
// WhiteboardScript (shared/studio.ts) drawn by our renderer (src/modules/whiteboard/**). Every number, position, part
// count, carry and label box is computed HERE, never by a model (explainer-dsl's rule: "geometry/arithmetic computed in
// code, never by the LLM"), and labels are drawn by code on top (never baked into a picture).
//
//   maths:    fraction-parts@1, fraction-of@1 (round 4 content: "half ka half", a/b of c/d as an area model), combine-count@1, number-line-hop@1, column-op@1, place-value@1, equal-groups@1
//   diagrams: flow@1, cycle@1, compare@1, parts@1, label@1 (a vetted sketch: plant, flower, leaf, insect)
//   geometry and data (W2-B fixer): angle@1, shape@1 (polygons, circle; two congruent copies), symmetry@1, area-grid@1
//     (unit squares / a scaled rectangle, area or perimeter), bar-chart@1
//
// expand(call, { band, lessonId, scriptId }) → { ok, script, facts, errors }: the script is normalised STRICTLY and
// linted (shared/whiteboard.js lintScript: inside the board, no overlapping text), so a template that cannot lay out
// its data fails here, before a child sees it, and the ladder steps down.
import { normalizeScript, lintScript, textBox, textProblem, settledScript } from "../../../shared/whiteboard.js";
import { placeNamed } from "./places.js";

const round1 = (v) => Math.round(v * 10) / 10;

export const BOARD = { w: 400, h: 300 };
export const TEMPLATES = ["fraction-parts@1", "fraction-line@1", "fraction-of@1", "combine-count@1", "number-line-hop@1", "column-op@1", "place-value@1", "equal-groups@1",
  "flow@1", "cycle@1", "compare@1", "parts@1", "label@1", "angle@1", "shape@1", "symmetry@1", "area-grid@1", "bar-chart@1", "timeline@1", "table@1", "measured@1"];
/** The StudioFacts kind each template is (what the Brain reads as "what is on screen"). */
export const KIND_OF = { "flow@1": "diagram", "cycle@1": "diagram", "compare@1": "diagram", "parts@1": "diagram", "label@1": "diagram",
  "angle@1": "diagram", "shape@1": "diagram", "symmetry@1": "diagram", "bar-chart@1": "diagram", "lines@1": "diagram", "fraction-bars@1": "diagram", "wholes@1": "diagram", "unrolled@1": "diagram", "timeline@1": "diagram", "table@1": "diagram", "measured@1": "diagram", "places@1": "diagram", "number-line-zoom@1": "diagram", "number-line-scale@1": "diagram", "fraction-line@1": "diagram" };
export const SKETCHES = ["plant", "flower", "leaf", "insect", "circuit", "cellPlant", "cellAnimal", "atom"];

/** Pace by band: a younger child gets slower strokes and longer gaps (B1/B2 ≈ 1.35x). */
const PACE = { B1: 1.4, B2: 1.3, B3: 1.0, B4: 0.9 };

const isInt = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
/** A template label: ≤ 32 chars (it may be written as two lines of ≤ 24: writeFit), and no markup / sentence shape. */
export const LABEL_MAX = 32;
const fitsLabel = (t) => typeof t === "string" && [...t.trim()].length <= LABEL_MAX
  && (!textProblem(t) || (textProblem(t) === "too_long" && t.trim().split(/\s+/).length >= 2 && !textProblem(t.slice(0, 24).trim())));

/** A timeline builder: ops appended in order, each starting after the previous (or `with` it). */
function timeline(pace) {
  const ops = [];
  let t = 0, last = 0, n = 0;
  return {
    ops,
    /** draw for `ms` (scaled by the band's pace); `gap` ms after the previous op ends; `with` starts with the previous one. */
    add(op, ms, { gap = 180, with: together = false } = {}) {
      const dur = Math.round(ms * pace);
      const start = together ? last : t + Math.round(gap * pace);
      const id = op.id ?? `o${++n}`;
      ops.push({ ...op, id, startMs: start, endMs: start + dur });
      last = start;
      t = Math.max(t, start + dur);
      return id;
    },
    pause(ms) { t += Math.round(ms * pace); },
    get t() { return t; },
  };
}

function script(call, ops, durationMs, facts, { lessonId = "", scriptId, ground = "chalk" } = {}) {
  return { v: 1, scriptId: scriptId ?? `x-${call.template}`, line: { lessonId }, anchor: "line_audio_start",
    board: { ...BOARD, ground }, mode: "fresh", durationMs: durationMs + 400, ops, facts };
}

/** A label that fits a slot `maxW` wide: size m, else s, else null (the template fails rather than overflow). */
function sizeFor(text, maxW) {
  if (textBox(text, "m").w <= maxW) return "m";
  if (textBox(text, "s").w <= maxW) return "s";
  return null;
}

/**
 * Write a label centred at (x, y) within `maxW`: one line at m or s, else split at the space nearest the middle into two
 * lines at s. Returns the op ids, or null when it cannot fit (the template then fails rather than overflow).
 */
function writeFit(tl, text, x, y, maxW, opts = {}, { id, ms = 500, gap = 40, ink, size } = {}) {
  // `size: "s"` keeps a group of labels at one size (a column of a table never mixes sizes)
  const one = size === "s" ? (textBox(text, "s").w <= maxW ? "s" : null) : sizeFor(text, maxW);
  if (one) return [tl.add({ ...(id ? { id } : {}), op: "text", at: [x, y], text, size: one, ...(ink ? { ink } : {}) }, ms, { gap, ...opts })];
  const words = text.split(/\s+/);
  if (words.length < 2) return null;
  let best = null;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(" "), b = words.slice(k).join(" ");
    const w = Math.max(textBox(a, "s").w, textBox(b, "s").w);
    if (w <= maxW && (!best || w < best.w)) best = { a, b, w };
  }
  if (!best) return null;
  return [
    tl.add({ ...(id ? { id } : {}), op: "text", at: [x, y - 12], text: best.a, size: "s", ...(ink ? { ink } : {}) }, ms * 0.6, { gap, ...opts }),
    tl.add({ op: "text", at: [x, y + 12], text: best.b, size: "s", ...(ink ? { ink } : {}) }, ms * 0.6, { gap: 0 }),
  ];
}

// ───────────────────────────── maths ─────────────────────────────

function fractionParts(c, tl) {
  const { parts, shade } = c;
  if (!isInt(parts, 2, 12) || !isInt(shade, 0, parts)) return { error: "fraction_range" };
  const whole = c.whole === "bar" ? "bar" : c.whole === "roti" ? "roti" : "circle";
  const facts = { whole, parts, shaded: shade, fraction: `${shade}/${parts}` };
  if (whole === "bar") {
    const x0 = 40, y0 = 70, W = 320, H = 70, pw = W / parts;
    tl.add({ op: "rect", at: [x0, y0], w: W, h: H, weight: 2 }, 900);
    for (let i = 1; i < parts; i++) tl.add({ op: "line", from: [x0 + i * pw, y0], to: [x0 + i * pw, y0 + H], weight: 1 }, 260, { gap: 60 });
    for (let i = 0; i < shade; i++) tl.add({ id: `s${i}`, op: "rect", at: [x0 + i * pw + 3, y0 + 3], w: pw - 6, h: H - 6, fill: "accent", ink: "accent", weight: 1 }, 380, { gap: 120 });
    // the parts count under the bar, then the fraction
    // (director11 S3: the board's own words follow the lesson's Hindi mode — "2 equal parts" stayed English over Hindi lines)
    tl.add({ op: "text", at: [200, 175], text: c.lang === "hi" ? `${parts} barabar hisse` : `${parts} equal parts`, size: "s", ink: "soft" }, 500);
  } else {
    const cx = 130, cy = 150, r = 95;
    tl.add({ op: "circle", c: [cx, cy], r, weight: 2, ...(whole === "roti" ? { fill: "soft" } : {}) }, 900);
    for (let i = 0; i < parts; i++) {
      const a = (i * 360) / parts;
      tl.add({ op: "line", from: [cx, cy], to: [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)], weight: 1 }, 220, { gap: 50 });
    }
    for (let i = 0; i < shade; i++) tl.add({ id: `s${i}`, op: "sector", c: [cx, cy], r: r - 2, fromDeg: (i * 360) / parts, toDeg: ((i + 1) * 360) / parts, fill: "accent", ink: "accent", weight: 1 }, 380, { gap: 120 });
  }
  const fx = whole === "bar" ? 200 : 310, fy = whole === "bar" ? 225 : 120;
  // round 4 content: nothing shaded writes no fraction ("0/5" is a number her line never said: W4)
  // (director11 S2: hideResult — a second view of a card that asks this fraction — writes none: the shading is the given)
  if (shade > 0 && !c.hideResult) tl.add({ id: "frac", op: "numwork", at: [fx - 14, fy], layout: "fraction", rows: [[String(shade)], [String(parts)]], ink: "accent", weight: 2 }, 800, { gap: 300 });
  if (shade > 0 && !c.hideResult) tl.add({ op: "highlight", target: "frac", style: "circle", ink: "mark" }, 600, { gap: 300 });
  if (c.hideResult) delete facts.fraction;
  return { facts, counts: { parts, shaded: shade } };
}

/**
 * round 7 (main, director3 judgement 2026-11-05): a fraction ON THE NUMBER LINE (c5 "fractions on a line": she says
 * "nishaan" and "gap", so a shaded roti contradicts her). 0 to `wholes` (1-3), each whole split into `den` equal gaps
 * (ticks at every 1/den, only the whole numbers written). Three uses, by what the item asks:
 *   show    (the worked example / an explanation) a dot hops gap by gap from 0 and lands on target a/den, which is written
 *   mark k  (the item names a mark and asks its fraction) that mark is ringed and marked "?": its fraction is never written
 *   target  (the item names a/den and asks where it goes) a/den is written above the line, no point is drawn
 */
/**
 * director8 S3′ (a picture asked for while the card's own board is up): the SAME fractions as equal wholes, one bar each,
 * stacked so their pieces compare by eye. `bars` [{ parts 1-12, shade 0-parts, label? }] (1-3): the label is the bar's
 * fraction ("1/3"), or "?" for the value the card asks (drawn unshaded: the view never answers). → counts.wholes.
 */
function fractionBars(c, tl) {
  const bars = Array.isArray(c.bars) ? c.bars : [];
  if (bars.length < 1 || bars.length > 3) return { error: "fraction_bars_count" };
  for (const b of bars) {
    if (!isInt(b?.parts, 1, 12) || !isInt(b?.shade, 0, b.parts)) return { error: "fraction_bars_range" };
    const label = b.label == null ? `${b.shade}/${b.parts}` : String(b.label);
    if (label !== "?" && (!fitsLabel(label) || textProblem(label))) return { error: "fraction_bars_label" };
    // (a "?" bar may be shaded: the shading is the given and its NAME the question — a shade-grid card's second view)
    if (label !== "?") { const m = /^(\d+)\s*\/\s*(\d+)$/.exec(label); if (!m || Number(m[1]) * b.parts !== b.shade * Number(m[2])) return { error: `fraction_bars_label_value:${label}` }; }
  }
  const x0 = 30, W = 270, H = 46, gapY = 30, top = Math.round((BOARD.h - (bars.length * H + (bars.length - 1) * gapY)) / 2);
  const wholes = [];
  bars.forEach((b, k) => {
    const y0 = top + k * (H + gapY), pw = W / b.parts, label = b.label == null ? `${b.shade}/${b.parts}` : String(b.label);
    // (paced for her explanation, as the fraction line: each bar, its cuts one by one, its shading, then its name — W6)
    // (director10: a two-bar compare is said in ~20 words, ~8 s: the cuts and shading quicken with the parts — W6 refused 7 + 7)
    const cutMs = b.parts > 6 ? 160 : 260, shadeMs = b.shade > 3 ? 260 : 420;
    tl.add({ id: `w${k}`, op: "rect", at: [x0, y0], w: W, h: H, weight: 2 }, 700, { gap: k ? 500 : 0 });
    for (let i = 1; i < b.parts; i++) tl.add({ op: "line", from: [round1(x0 + i * pw), y0], to: [round1(x0 + i * pw), y0 + H], weight: 1 }, cutMs, { gap: b.parts > 6 ? 60 : 140 });
    for (let i = 0; i < b.shade; i++) tl.add({ op: "rect", at: [round1(x0 + i * pw + 3), y0 + 3], w: round1(pw - 6), h: H - 6, fill: "accent", ink: "accent", weight: 1 }, shadeMs, { gap: b.shade > 3 ? 120 : 260 });
    tl.add({ op: "text", at: [x0 + W + 45, y0 + H / 2 + 6], text: label, size: "m", ink: label === "?" ? "mark" : "accent" }, 500, { gap: 300 });
    // (director11 S1: `ends` — the bars of a 0-1 line keep its 0 and 1, under each bar's ends)
    if (c.ends) {
      tl.add({ op: "text", at: [x0, y0 + H + 16], text: "0", size: "s", ink: "soft" }, 200, { gap: 60 });
      tl.add({ op: "text", at: [x0 + W, y0 + H + 16], text: "1", size: "s", ink: "soft" }, 200, { gap: 40 });
    }
    wholes.push({ parts: b.parts, shaded: b.shade, label });
  });
  // (one short fact per bar: the facts row keeps values of up to 40 characters)
  return { counts: { wholes }, facts: { wholes: `${wholes.length} equal bars`, ...Object.fromEntries(wholes.map((w, k) => [`bar${k + 1}`, `${w.parts} equal parts, ${w.shaded} shaded = ${w.label}`])) } };
}

/**
 * director9 P2 (main: "every picture request draws something new", c4's Cake A / Cake B compare): up to two WHOLES side by
 * side, each a circle cut into `parts` (2-12) pieces — equal, or not (`equal: false`: one half and the rest of the pieces in
 * the other half: "1 bada, 2 chhote") — `shade` pieces coloured, a short title under each. counts.wholes [{ parts, shaded,
 * label: title }]; facts say equal / not equal per whole.
 */
function wholes(c, tl) {
  const list = Array.isArray(c.wholes) ? c.wholes : [];
  if (list.length < 1 || list.length > 2) return { error: "wholes_count" };
  for (const w of list) {
    if (!isInt(w?.parts, 2, 12) || !isInt(w.shade ?? 0, 0, w.parts) || (w.title !== undefined && (!fitsLabel(String(w.title)) || textProblem(String(w.title))))) return { error: "wholes_range" };
  }
  if (c.as === "bar") return wholesAsBars(list, tl);
  const n = list.length, colW = 400 / n, r = n === 1 ? 95 : 72, cy = 128, counts = [], facts = {};
  list.forEach((w, k) => {
    const cx = round1(colW * k + colW / 2), shade = w.shade ?? 0;
    // the cuts, in degrees from 12 o'clock: equal pieces, or one half and the other half shared by the rest
    // (Learning's D1: two unequal pieces — the roti's "ek bada, ek chhota" — two thirds and one third)
    const cuts = w.equal === false ? (w.parts === 2 ? [0, 240] : [0, 180, ...Array.from({ length: w.parts - 2 }, (_, i) => 180 + (180 * (i + 1)) / (w.parts - 1))]) : Array.from({ length: w.parts }, (_, i) => (360 * i) / w.parts);
    tl.add({ id: `w${k}`, op: "circle", c: [cx, cy], r, weight: 2 }, 800, { gap: k ? 300 : 0 });
    for (const a of cuts) tl.add({ op: "line", from: [cx, cy], to: [round1(cx + r * Math.sin(rad(a))), round1(cy - r * Math.cos(rad(a)))], weight: 1 }, 220, { gap: 60 });
    const edges = [...cuts, 360];
    for (let i = 0; i < shade; i++) tl.add({ op: "sector", c: [cx, cy], r: r - 2, fromDeg: edges[i], toDeg: edges[i + 1], fill: "accent", ink: "accent", weight: 1 }, 380, { gap: 120 });
    const title = w.title !== undefined ? String(w.title) : "";
    if (title) writeFit(tl, title, cx, cy + r + 34, colW - 12, {}, { id: `t${k}`, ink: "accent", gap: 160, size: "s" });
    counts.push({ parts: w.parts, shaded: shade, label: title });
    // (director11 S2: the whole is named by the title DRAWN under it — her line said "1 wala … 2 wala" over Cake A | Cake B)
    facts[`whole${k + 1}`] = `${title ? `${title}: ` : ""}${w.parts} ${w.equal === false ? "unequal" : "equal"} parts${shade ? `, ${shade} shaded` : ""}`.slice(0, 40);
  });
  return { counts: { wholes: counts }, facts };
}

/**
 * director10 G4 (a second view of wholes@1): the same wholes as STRIPS, one under the other — equal pieces, or one half and
 * the rest of the pieces in the other half — `shade` pieces coloured, the title beside each. Counts as wholes@1.
 */
function wholesAsBars(list, tl) {
  const x0 = 30, W = 250, H = 46, gapY = 40, top = Math.round((BOARD.h - (list.length * H + (list.length - 1) * gapY)) / 2);
  const counts = [], facts = {};
  list.forEach((w, k) => {
    const y0 = top + k * (H + gapY), shade = w.shade ?? 0;
    // the cuts, as fractions of the strip: equal pieces, or one half and the other half shared by the rest
    const cuts = w.equal === false ? (w.parts === 2 ? [2 / 3] : [0.5, ...Array.from({ length: w.parts - 2 }, (_, i) => 0.5 + (0.5 * (i + 1)) / (w.parts - 1))]) : Array.from({ length: w.parts - 1 }, (_, i) => (i + 1) / w.parts);
    tl.add({ id: `w${k}`, op: "rect", at: [x0, y0], w: W, h: H, weight: 2 }, 900, { gap: k ? 900 : 0 });
    for (const f of cuts) tl.add({ op: "line", from: [round1(x0 + f * W), y0], to: [round1(x0 + f * W), y0 + H], weight: 1 }, 260, { gap: 140 });
    const edges = [0, ...cuts, 1];
    for (let i = 0; i < shade; i++) tl.add({ op: "rect", at: [round1(x0 + edges[i] * W + 3), y0 + 3], w: round1((edges[i + 1] - edges[i]) * W - 6), h: H - 6, fill: "accent", ink: "accent", weight: 1 }, 420, { gap: 260 });
    const title = w.title !== undefined ? String(w.title) : "";
    if (title) writeFit(tl, title, x0 + W + 60, y0 + H / 2 + 6, 110, {}, { id: `t${k}`, ink: "accent", gap: 300, size: "s" });
    counts.push({ parts: w.parts, shaded: shade, label: title });
    // (director11 S2: the whole is named by the title DRAWN under it — her line said "1 wala … 2 wala" over Cake A | Cake B)
    facts[`whole${k + 1}`] = `${title ? `${title}: ` : ""}${w.parts} ${w.equal === false ? "unequal" : "equal"} parts${shade ? `, ${shade} shaded` : ""}`.slice(0, 40);
  });
  return { counts: { wholes: counts }, facts: { ...facts, view: "strips" } };
}

/**
 * director10 G4 (main: measured@1's second view, "seedha karke scale par napo"): a shape's boundary UNROLLED onto a ruler —
 * its sides laid end to end on one straight line, to scale, each labelled with its length; under them a measuring line from
 * the start to the end, labelled with the total (a number, or "?" — the card's asked perimeter). unit cm | m; sides 2-8.
 * counts { sides, sideValues }.
 */
function unrolled(c, tl) {
  const unit = c.unit === "m" ? "m" : c.unit === "cm" ? "cm" : null;
  if (!unit) return { error: "unit" };
  const sides = Array.isArray(c.sides) ? c.sides.map(Number) : [];
  if (sides.length < 2 || sides.length > 8 || sides.some((v) => !(v > 0 && v <= 10000))) return { error: "unrolled_sides" };
  const num = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10));
  const total = c.total === "?" || c.total == null ? "?" : Number(c.total);
  if (total !== "?" && !(Number.isFinite(total) && Math.abs(total - sides.reduce((a, b) => a + b, 0)) < 1e-6)) return { error: "unrolled_total" };
  // (main, A1: a side whose length the live card asks is drawn, its label "?")
  const hide = new Set(Array.isArray(c.hide) ? c.hide.filter((i) => Number.isInteger(i) && i >= 0 && i < sides.length) : []);
  // (main, B: the shape itself, small, top left — "this shape, laid straight" — not to scale for a polygon)
  const fig = c.figure && typeof c.figure === "object" ? c.figure : null;
  if (fig) {
    const bx = 30, by = 14, bw = 84, bh = 58, pts = figurePoints(fig);
    if (!pts) return { error: "unrolled_figure" };
    const xsF = pts.map((p) => p[0]), ysF = pts.map((p) => p[1]);
    const k = Math.min(bw / Math.max(1e-6, Math.max(...xsF) - Math.min(...xsF)), bh / Math.max(1e-6, Math.max(...ysF) - Math.min(...ysF)));
    const P = pts.map(([px, py]) => [round1(bx + (px - Math.min(...xsF)) * k), round1(by + (py - Math.min(...ysF)) * k)]);
    if (fig.shape === "rect") tl.add({ id: "fig", op: "rect", at: P[0], w: round1(P[2][0] - P[0][0]), h: round1(P[2][1] - P[0][1]), weight: 2 }, 700);
    else tl.add({ id: "fig", op: "polygon", points: P, weight: 2 }, 700);
  }
  const x0 = 30, W = 340, y = 120, sum = sides.reduce((a, b) => a + b, 0);
  let x = x0;
  const xs = [x0];
  sides.forEach((v, i) => {
    const x1 = round1(x + (v / sum) * W);
    tl.add({ id: `s${i}`, op: "line", from: [round1(x), y], to: [x1, y], weight: 3, ink: i % 2 ? "accent" : "chalk" }, 600, { gap: i ? 300 : 0 });
    tl.add({ op: "line", from: [x1, y - 9], to: [x1, y + 9], weight: 1 }, 160, { gap: 60 });
    // (a piece too short for its label has it below the line; the next above, so neighbours never overlap)
    const lab = hide.has(i) ? "?" : `${num(v)} ${unit}`, mid = round1((x + x1) / 2), roomy = textBox(lab, "s").w + 6 <= x1 - x;
    tl.add({ op: "text", at: [mid, roomy || i % 2 === 0 ? y - 18 : y + 30], text: lab, size: "s", ...(hide.has(i) ? { ink: "mark" } : {}) }, 400, { gap: 120 });
    x = x1; xs.push(x1);
  });
  tl.add({ op: "line", from: [x0, y - 9], to: [x0, y + 9], weight: 1 }, 160, { gap: 0 });
  // the ruler: a measuring line under the pieces, start to end, and the total
  const yr = y + 62;
  tl.add({ id: "ruler", op: "arrow", from: [x0, yr], to: [round1(x), yr], weight: 1 }, 700, { gap: 300 });
  tl.add({ op: "line", from: [x0, yr - 7], to: [x0, yr + 7], weight: 1 }, 160, { gap: 0 });
  tl.add({ id: "total", op: "text", at: [round1((x0 + x) / 2), yr + 30], text: total === "?" ? "?" : `${num(total)} ${unit}`, size: "m", ink: total === "?" ? "mark" : "accent" }, 500, { gap: 300 });
  const sideValues = sides.map((v, i) => (hide.has(i) ? "?" : `${num(v)} ${unit}`));
  return { counts: { sides: sides.length, sideValues }, facts: { ...(fig ? { shape: fig.shape === "rect" ? (fig.w === fig.h ? "square" : "rectangle") : fig.shape === "triangle" ? "triangle" : `${fig.n}-sided shape` } : {}),
    sides: `${sides.length} sides laid in a straight line`, lengths: sideValues.join(", ").slice(0, 40), total: total === "?" ? "?" : `${num(total)} ${unit}` } };
}
/** The outline of an unrolled figure, unscaled (y down): a rect's corners, a triangle from its three sides, a regular n-gon. */
function figurePoints(f) {
  if (f.shape === "rect" && Number(f.w) > 0 && Number(f.h) > 0) { const w = Number(f.w), h = Number(f.h); return [[0, 0], [w, 0], [w, h], [0, h]]; }
  if (f.shape === "triangle" && Array.isArray(f.sides) && f.sides.length === 3) {
    const [a, b, cc] = f.sides.map(Number);
    if (!(a > 0 && b > 0 && cc > 0) || a + b <= cc || a + cc <= b || b + cc <= a) return null;
    const px = (a * a + cc * cc - b * b) / (2 * a), py = Math.sqrt(Math.max(0, cc * cc - px * px));
    return [[0, py], [a, py], [px, 0]];
  }
  if (f.shape === "polygon" && Number.isInteger(f.n) && f.n >= 3 && f.n <= 8) return Array.from({ length: f.n }, (_, i) => { const t = -Math.PI / 2 + (2 * Math.PI * i) / f.n; return [Math.cos(t), Math.sin(t)]; });
  return null;
}

function fractionLine(c, tl) {
  if (Array.isArray(c.dens)) return fractionLine2(c, tl);
  const den = c.den, w = c.wholes ?? c.to ?? 1;
  if (c.from != null && c.from !== 0) return { error: "fraction_line_from" };
  if (!isInt(den, 2, 12) || !isInt(w, 1, 3) || den * w > 24) return { error: "fraction_line_range" };
  const N = den * w;
  const tgt = Array.isArray(c.target) && isInt(c.target[0], 0, N) && c.target[1] === den ? c.target[0] : null;
  const mark = isInt(c.mark, 1, N) ? c.mark : null;
  if (c.show && tgt == null) return { error: "fraction_line_show" };
  // lesson scripts (Learning, dc-r7-teaching-scripts): `marks` [{ num, label? }] are points the explanation names, each
  // labelled (default num/den) — a label must be the SAME value as its point ("3/6 = 1/2", "1", "4/4 = 1"), checked;
  // `hop` { num } is the counting: one jump per 1/den from 0 to num/den
  const marks = Array.isArray(c.marks) ? c.marks : [];
  for (const m of marks) {
    if (!isInt(m?.num, 1, N)) return { error: "fraction_line_mark" };
    const label = m.label ?? `${m.num}/${den}`;
    if (!fitsLabel(label) || textProblem(label)) return { error: "fraction_line_label" };
    const vals = [...String(label).matchAll(/(\d+)\s*\/\s*(\d+)|(?<![\d/])(\d+)(?![\d/])/g)].map((x) => (x[1] ? Number(x[1]) / Number(x[2]) : Number(x[3])));
    if (!vals.length || vals.some((v) => Math.abs(v - m.num / den) > 1e-9)) return { error: `fraction_line_label_value:${label}` };
  }
  const hop = c.hop == null ? null : isInt(c.hop?.num, 1, N) ? c.hop.num : -1;
  if (hop === -1) return { error: "fraction_line_hop" };
  const x0 = 30, W = 340, y = 170;
  const X = (u) => round1(x0 + 12 + (u / w) * (W - 24));
  // (paced for her explanation: the line, then the gaps one by one, ~4-5 s before the point, so a ~12 s line keeps up — W6)
  tl.add({ id: "line", op: "numwork", at: [x0, y], layout: "number_line", rows: [Array.from({ length: w + 1 }, (_, i) => String(i))], range: [0, w], w: W, weight: 2 }, 1200);
  const tick = Math.max(90, Math.min(320, Math.round(2400 / N)));
  for (let i = 1; i < N; i++) if (i % den) tl.add({ op: "line", from: [X(i / den), y - 7], to: [X(i / den), y + 7], weight: 1 }, tick, { gap: Math.round(tick / 2) });
  const facts = { line: `0 to ${w}`, gaps: `${den} equal gaps in each whole`, each: `1/${den}` };
  // round 7 (director5 SC1): what the line DRAWS, counted (Brain's R4 reads these: "beech mein 2 marks" over 2 inner ticks)
  const lineCount = { gaps: N, ...(w > 1 ? { gapsPerWhole: den } : {}), ticks: N + 1, innerTicks: N - 1 };
  // (director8 prep: the hops the dot DRAWS are counted too — "0 se 6 hop" over a line it hops 6 times, Brain's dry-run flags)
  const counts = (pts, hops = null) => ({ lines: [lineCount], ...(pts.length ? { marks: pts } : {}), ...(hops != null ? { hops } : {}) });
  const claims = [];
  const hopTo = (n) => {
    const dot = tl.add({ op: "circle", c: [X(0), y], r: 7, fill: "accent", ink: "accent" }, 300, { gap: 200 });
    for (let k = 1; k <= n; k++) {
      const from = X((k - 1) / den), to = X(k / den);
      tl.add({ op: "arrow", from: [from, y - 10], to: [to, y - 10], bend: -0.6, ink: "accent" }, 650, { gap: k === 1 ? 400 : 150 });
      tl.add({ op: "move", target: dot, by: [round1(to - from), 0], arc: 12 }, 650, { with: true });
    }
    claims.push({ id: dot, c: [X(n / den), y] });
  };
  if (marks.length || hop != null) {
    if (hop != null) hopTo(hop);
    // labels above the line in up to three rows: a label moves up a row when it would touch its left neighbour's
    const rows = [y - 44, y - 70, y - 96], rightEdge = [-Infinity, -Infinity, -Infinity];
    const placed = [...marks].sort((p, q) => p.num - q.num).map((m) => {
      const label = String(m.label ?? `${m.num}/${den}`), x = X(m.num / den), half = textBox(label, "s").w / 2;
      const r = rightEdge.findIndex((e) => x - half >= e + 6);
      if (r >= 0) rightEdge[r] = x + half;
      return { m, label, x, half, r };
    });
    for (const p of placed) {
      if (p.r < 0) return { error: "fraction_line_marks_crowded" };
      // (a label at the board's edge is pulled in, never off it)
      const lx = Math.min(BOARD.w - 4 - p.half, Math.max(4 + p.half, p.x));
      // (a tall tick in mark ink, as on the two-denominator line: three dots read as a count of 3 against "1/8, 1/4, 1/2"
      // — W8 — and the script's board lost to the code's one-mark line, director5 c5-t01 whole-number bias)
      if (hop == null || p.m.num !== hop) tl.add({ op: "line", from: [p.x, y - 14], to: [p.x, y + 14], weight: 3, ink: "mark" }, 300, { gap: 300 });
      tl.add({ op: "line", from: [p.x, y - 12], to: [p.x, rows[p.r] + 6], weight: 1, ink: "soft" }, 200, { gap: 60 });
      tl.add({ op: "text", at: [round1(lx), rows[p.r]], text: p.label, size: "s", ink: "mark" }, 400, { gap: 60 });
    }
    const pts = [...placed.map((p) => ({ at: `${p.m.num}/${den}`, label: p.label })), ...(hop != null && !marks.some((m) => m.num === hop) ? [{ at: `${hop}/${den}`, label: "" }] : [])];
    return { claims, counts: counts(pts, hop), facts: { ...facts, ...(marks.length ? { marks: placed.map((p) => p.label).join(", ") } : {}), ...(hop != null ? { hop: `${hop}/${den}`, counted: `${hop} gaps from 0` } : {}) } };
  }
  if (c.show) {
    // the counting IS the method: one hop per gap from 0, the dot riding along; the last mark is the fraction
    hopTo(tgt);
    tl.add({ op: "text", at: [X(tgt / den), y - 44], text: `${tgt}/${den}`, size: "m", ink: "mark" }, 500, { gap: 300 });
    return { claims, counts: counts([{ at: `${tgt}/${den}`, label: `${tgt}/${den}` }], tgt), facts: { ...facts, point: `${tgt}/${den}`, counted: `${tgt} gaps from 0` } };
  }
  if (mark != null) {
    // (the mark the item NAMES is its given: a tall tick in mark ink and a "?" over it; never a dot on it, which is how a
    // board answers "where is it" — W9 reads a dot there as the answer)
    tl.add({ op: "line", from: [X(mark / den), y - 14], to: [X(mark / den), y + 14], weight: 3, ink: "mark" }, 500, { gap: 700 });
    tl.add({ op: "text", at: [X(mark / den), y - 30], text: "?", size: "l", ink: "mark" }, 400, { gap: 300 });
    // (no "each 1/den" here: for the first mark it IS the answer)
    return { claims, counts: counts([{ at: `mark ${mark}`, label: "?" }]), facts: { line: facts.line, gaps: facts.gaps, asked: `mark number ${mark} from 0`, fraction: "? (child works it out)" } };
  }
  if (tgt != null) {
    tl.add({ op: "text", at: [200, 70], text: `${tgt}/${den}`, size: "l", ink: "mark" }, 600, { gap: 900 });
    return { claims, counts: counts([]), facts: { ...facts, find: `${tgt}/${den}`, where: "? (child works it out)" } };
  }
  return { claims, counts: counts([]), facts };
}

/**
 * round 7 (Learning: comparing fractions, c5-maths-ch02-t02): TWO denominators on one line, sharing 0 and the wholes: the
 * first den's ticks and points above the line, the second's below, so "3/5 vs 3/8" is read by where each point sits.
 * `marks` [[a, den], ...] are labelled points (each on its own den's side); `target` [[a, den], ...] only writes the fractions
 * to compare (the asking form: nothing placed, "which is bigger" stays the child's).
 */
function fractionLine2(c, tl) {
  const dens = c.dens, w = c.wholes ?? c.to ?? 1;
  if (c.from != null && c.from !== 0) return { error: "fraction_line_from" };
  if (dens.length !== 2 || !dens.every((d) => isInt(d, 2, 12)) || dens[0] === dens[1] || !isInt(w, 1, 2) || dens.some((d) => d * w > 24)) return { error: "fraction_line2_range" };
  const pts = (Array.isArray(c.marks) ? c.marks : []).map((m) => (Array.isArray(m) ? m : [m?.num, m?.den]));
  const asks = (Array.isArray(c.target) ? c.target : []).map((m) => (Array.isArray(m) ? m : [m?.num, m?.den]));
  if ([...pts, ...asks].some(([a, d]) => !dens.includes(d) || !isInt(a, 1, d * w))) return { error: "fraction_line2_mark" };
  const x0 = 30, W = 340, y = 160;
  const X = (u) => round1(x0 + 12 + (u / w) * (W - 24));
  tl.add({ id: "line", op: "numwork", at: [x0, y], layout: "number_line", rows: [Array.from({ length: w + 1 }, (_, i) => String(i))], range: [0, w], w: W, weight: 2 }, 1200);
  dens.forEach((d, side) => {
    const dy = side === 0 ? -1 : 1;
    const tick = Math.max(70, Math.min(200, Math.round(1300 / (d * w))));
    for (let i = 1; i < d * w; i++) if (i % d) tl.add({ op: "line", from: [X(i / d), y], to: [X(i / d), y + dy * 12], weight: 1, ink: side ? "accent" : "chalk" }, tick, { gap: Math.round(tick / 2) });
  });
  const facts = { line: `0 to ${w}`, above: `${dens[0]} equal gaps in each whole`, below: `${dens[1]} equal gaps in each whole` };
  for (const [a, d] of pts) {
    const side = dens.indexOf(d), dy = side === 0 ? -1 : 1;
    // (a tall tick in mark ink on its own side: two dots would read as a count of 2 — W8)
    tl.add({ op: "line", from: [X(a / d), y], to: [X(a / d), y + dy * 22], weight: 3, ink: "mark" }, 300, { gap: 300 });
    // (below the line the whole numbers are written: the lower den's labels sit under them)
    tl.add({ op: "text", at: [X(a / d), y + dy * (side === 0 ? 34 : 66)], text: `${a}/${d}`, size: "m", ink: "mark" }, 400, { gap: 60 });
  }
  if (asks.length) tl.add({ op: "text", at: [200, 60], text: asks.map(([a, d]) => `${a}/${d}`).join("  vs  "), size: "l", ink: "mark" }, 600, { gap: 900 });
  const counts = { lines: dens.map((d) => ({ gaps: d * w, ...(w > 1 ? { gapsPerWhole: d } : {}), ticks: d * w + 1, innerTicks: d * w - 1 })),
    ...(pts.length ? { marks: pts.map(([a, d]) => ({ at: `${a}/${d}`, label: `${a}/${d}` })) } : {}) };
  return { claims: [], counts, facts: { ...facts, ...(pts.length ? { points: pts.map(([a, d]) => `${a}/${d}`).join(", ") } : {}), ...(asks.length ? { compare: asks.map(([a, d]) => `${a}/${d}`).join(" vs "), which: "? (child works it out)" } : {}) } };
}

/**
 * round 4 content: the rectangle her line describes as a grid ("5 columns aur 3 rows", "15 equal parts, unmein 6
 * marked"): rows x cols equal cells, the first `shade` filled, row by row. The column and row counts are written (her
 * own givens); the cell total and the fraction only when her line does not ask for them. Measured: 4 board slots on a
 * local production run (2026-10-10) failed while she pointed at such a rectangle, because no template drew it.
 */
function shadeGrid(c, tl) {
  const { rows, cols } = c;
  // `block: [r, c]`: the top-left r x c cells shaded (her "shaded hissa 2 columns aur 3 rows"); else the first `shade` cells
  const block = Array.isArray(c.block) && isInt(c.block[0], 1, rows) && isInt(c.block[1], 1, cols) ? c.block : null;
  const shade = block ? block[0] * block[1] : c.shade ?? 0;
  if (!isInt(rows, 1, 6) || !isInt(cols, 1, 10) || rows * cols < 2 || !isInt(shade, 0, rows * cols)) return { error: "grid_range" };
  // the fraction (when written) needs ~70 units under the grid: the grid gives up height for it
  const withFrac = !c.hideResult && shade > 0;
  const cell = Math.min(300 / cols, (withFrac ? 140 : 170) / rows, 56);
  const W = cols * cell, H = rows * cell, x0 = 200 - W / 2, y0 = 52 + ((withFrac ? 140 : 170) - H) / 2;
  tl.add({ id: "whole", op: "rect", at: [x0, y0], w: W, h: H, weight: 2 }, 800);
  let k = 0;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const on = block ? r < block[0] && q < block[1] : k++ < shade;
    tl.add({ id: `g${r}_${q}`, op: "rect", at: [x0 + q * cell + 2, y0 + r * cell + 2], w: cell - 4, h: cell - 4, weight: 1,
      ...(on ? { fill: "accent", ink: "accent" } : { ink: "soft" }) }, on ? 200 : 90, { gap: on ? 60 : 20 });
  }
  // the labels only when her line named the columns and rows (a grid laid out for "15 equal parts" invents neither)
  if (c.labels !== false && cols > 1) tl.add({ op: "text", at: [200, y0 - 16], text: `${cols} columns`, size: "s", ink: "soft" }, 400, { gap: 200 });
  if (c.labels !== false && rows > 1) tl.add({ op: "text", at: [200, y0 + H + 18], text: `${rows} rows`, size: "s", ink: "soft" }, 400, { gap: 120 });
  const total = rows * cols;
  if (withFrac) tl.add({ id: "frac", op: "numwork", at: [186, y0 + H + (c.labels !== false && rows > 1 ? 34 : 14)], layout: "fraction", rows: [[String(shade)], [String(total)]], ink: "accent", weight: 2 }, 700, { gap: 300 });
  return { counts: { rows, cols, parts: total, shaded: shade }, facts: { rows, cols, cells: c.hideResult ? "? (child works it out)" : total, shaded: shade } };
}

/**
 * round 4 content (the owner's review, 2026-10-10: "animation dikha sakte ho, half ka half kaise hota hai" got a static
 * 3/5 roti): a/b OF c/d drawn as the area model a class 6-7 book uses, step by step while she speaks: the whole; cut into
 * d columns, c of them shaded (c/d); the same whole cut into b rows; a of the b rows marked INSIDE the shaded part (a/b of
 * it); then the count: (a × c) of the (b × d) small parts, written as a/b × c/d = ac/bd. Every number from the call.
 */
function fractionOf(c, tl) {
  const { a, b, c: cn, d } = c;
  if (!isInt(b, 2, 6) || !isInt(a, 1, b) || !isInt(d, 2, 6) || !isInt(cn, 1, d)) return { error: "fraction_of_range" };
  const x0 = 60, y0 = 46, W = 280, H = 168, cw = W / d, rh = H / b;
  tl.add({ id: "whole", op: "rect", at: [x0, y0], w: W, h: H, weight: 2 }, 800);
  // step 1: the inner fraction c/d, column by column
  for (let i = 1; i < d; i++) tl.add({ op: "line", from: [x0 + i * cw, y0], to: [x0 + i * cw, y0 + H], weight: 1 }, 220, { gap: 50 });
  for (let i = 0; i < cn; i++) { tl.add({ id: `c${i}`, op: "rect", at: [x0 + i * cw + 3, y0 + 3], w: cw - 6, h: H - 6, fill: "soft", ink: "accent", weight: 1 }, 200, { gap: 100 }); tl.add({ op: "sweep", target: `c${i}`, dir: "down" }, 480, { gap: 0 }); }
  tl.add({ id: "inner", op: "text", at: [x0 + (cn * cw) / 2, y0 - 16], text: `${cn}/${d}`, size: "m", ink: "accent" }, 380, { gap: 160 });
  // step 2: the outer fraction a/b of that part, row by row inside the shaded columns
  tl.pause(400);
  for (let j = 1; j < b; j++) tl.add({ op: "line", from: [x0, y0 + j * rh], to: [x0 + W, y0 + j * rh], weight: 1, ink: "soft" }, 220, { gap: 50 });
  for (let j = 0; j < a; j++) { tl.add({ id: `r${j}`, op: "rect", at: [x0 + 5, y0 + j * rh + 5], w: cn * cw - 10, h: rh - 10, fill: "accent", ink: "mark", weight: 1 }, 220, { gap: 140 }); tl.add({ op: "sweep", target: `r${j}`, dir: "right" }, 520, { gap: 0 }); }
  tl.add({ id: "outer", op: "text", at: [x0 + W + 12, y0 + (a * rh) / 2], text: `${a}/${b}`, size: "m", ink: "mark", align: "start" }, 380, { gap: 160 });
  // step 3: count the small parts: a × c of b × d
  const res = c.hideResult ? "?" : `${a * cn}/${b * d}`;
  tl.pause(300);
  tl.add({ id: "eq", op: "numwork", at: [40, 262], layout: "equation", rows: [[`${a}/${b}`, "×", `${cn}/${d}`, "=", res]], weight: 2 }, 1100, { gap: 300 });
  if (!c.hideResult) tl.add({ op: "highlight", target: "eq", style: "underline", ink: "mark" }, 500, { gap: 200 });
  return { facts: { whole: "rectangle", inner: `${cn}/${d}`, outer: `${a}/${b} of it`, small_parts: b * d, marked: c.hideResult ? "?" : a * cn, result: c.hideResult ? "? (child works it out)" : res } };
}

function combineCount(c, tl) {
  const { a, b } = c;
  const op = c.op === "take_away" ? "take_away" : "add";
  if (!isInt(a, 0, 10) || !isInt(b, 0, 10) || (op === "take_away" && b > a)) return { error: "count_range" };
  const result = op === "add" ? a + b : a - b;
  // hideResult (an OPEN item's reteach): the method is drawn, the result cell is "?" (never the answer: guard.js)
  const res = c.hideResult ? "?" : String(result);
  const dot = (i, x0, y0, id, ink) => ({ id, op: "circle", c: [x0 + (i % 5) * 30, y0 + Math.floor(i / 5) * 30], r: 10, fill: ink, ink });
  for (let i = 0; i < a; i++) tl.add(dot(i, op === "add" ? 40 : 110, 70, `a${i}`, "accent"), 160, { gap: 70 });
  if (op === "add") {
    tl.add({ id: "plus", op: "text", at: [200, 85], text: "+", size: "l" }, 300);
    for (let i = 0; i < b; i++) tl.add(dot(i, 245, 70, `b${i}`, "good"), 160, { gap: 70 });
  } else {
    // take away: cross out the last b dots, one by one
    for (let i = a - b; i < a; i++) {
      const x = 110 + (i % 5) * 30, y = 70 + Math.floor(i / 5) * 30;
      tl.add({ op: "line", from: [x - 12, y - 12], to: [x + 12, y + 12], ink: "mark", weight: 2 }, 220, { gap: 120 });
    }
  }
  // round 7 (M2): adding is PUTTING TOGETHER: the second group slides over and joins the first, filling its rows of five
  const claims = [];
  if (op === "add" && b > 0) {
    tl.pause(300);
    for (let i = 0; i < b; i++) {
      const k = a + i, tx = 40 + (k % 5) * 30, ty = 70 + Math.floor(k / 5) * 30, fx = 245 + (i % 5) * 30, fy = 70 + Math.floor(i / 5) * 30;
      tl.add({ op: "move", target: `b${i}`, by: [tx - fx, ty - fy], arc: 18 }, 900, i ? { with: true } : { gap: 120 });
      claims.push({ id: `b${i}`, c: [tx, ty] });
    }
    tl.add({ op: "erase", target: "plus" }, 300, { with: true });
  }
  const sign = op === "add" ? "+" : "-";
  tl.add({ id: "eq", op: "numwork", at: [120, 220], layout: "equation", rows: [[String(a), sign, String(b), "=", res]], weight: 2 }, 1100, { gap: 350 });
  tl.add({ op: "highlight", target: "eq", style: "underline", ink: "mark" }, 500, { gap: 200 });
  return { facts: { first: a, second: b, operation: op === "add" ? "add" : "take away", result: c.hideResult ? "? (child works it out)" : result }, claims };
}

function numberLineHop(c, tl) {
  const { start, hops } = c;
  if (!isInt(start, -20, 100) || !Array.isArray(hops) || hops.length < 1 || hops.length > 4 || !hops.every((h) => isInt(h, -20, 20) && h !== 0)) return { error: "hops_range" };
  let pos = start;
  const ends = hops.map((h) => (pos += h));
  const all = [start, ...ends];
  const lo = Math.min(...all), hi = Math.max(...all);
  const span = Math.max(4, hi - lo);
  const x0 = 30, W = 340, y = 170;
  // (main / Learning, 2026-11-08: the padded ends were 1 unit from the start or the last landing, and at the player's digit
  // width "3|4" and "13|14" touched — 41 of 84 boards of start 0-20 × three equal hops of 2-5. The ends are padded
  // enough that every label has its own room — 2 units or more — and a line of counting numbers never starts below 0;
  // if no pad gives room, the ends are drawn unlabelled)
  const room = (a, b, labs) => {
    const px = (v) => ((v - a) / (b - a)) * (W - 24), wd = (t) => String(t).length * 0.6 * 19.2;
    return labs.every((t, i) => i === 0 || px(t) - px(labs[i - 1]) - (wd(t) + wd(labs[i - 1])) / 2 >= 6);
  };
  let a = null, b = null, labelEnds = true;
  for (let pad = Math.max(2, Math.round(span * 0.1)); pad <= 6 && a == null; pad++) {
    const a1 = lo >= 0 ? (lo - pad >= 0 ? lo - pad : 0) : lo - pad, b1 = Math.max(hi + pad, a1 + span + 2);
    if (b1 - a1 > 40) break;
    if (room(a1, b1, [...new Set([a1, ...all, b1])].sort((p, q) => p - q))) { a = a1; b = b1; }
  }
  if (a == null) { a = lo >= 0 ? Math.max(0, lo - 2) : lo - 2; b = Math.max(hi + 2, a + span + 2); labelEnds = false; }
  if (b - a > 40) return { error: "line_too_long" };
  const xOf = (v) => x0 + 12 + ((v - a) / (b - a)) * (W - 24);
  const labels = [...new Set([...(labelEnds ? [a, b] : []), ...all])].sort((p, q) => p - q).map(String);
  tl.add({ op: "numwork", at: [x0, y], layout: "number_line", rows: [labels], range: [a, b], w: W, weight: 2 }, 1100);
  const dot = tl.add({ op: "circle", c: [xOf(start), y], r: 7, fill: "accent", ink: "accent" }, 300);
  all.slice(1).forEach((e, i) => {
    const from = xOf(all[i]), to = xOf(e);
    tl.add({ op: "arrow", from: [from, y - 10], to: [to, y - 10], bend: hops[i] > 0 ? -0.6 : 0.6, ink: "accent" }, 800, { gap: 220 });
    // round 7 (C1 motion ops): the dot JUMPS along the hop as its arrow draws (reduced motion: it lands at once)
    tl.add({ op: "move", target: dot, by: [Math.round((to - from) * 10) / 10, 0], arc: Math.round(Math.min(50, 8 + Math.abs(to - from) * 0.25)) }, 800, { with: true });
    tl.add({ op: "text", at: [(from + to) / 2, y - 22 - Math.min(60, Math.abs(to - from) * 0.3), ], text: `${hops[i] > 0 ? "+" : "-"}${Math.abs(hops[i])}`, size: "s", ink: "accent" }, 300, { with: true });
  });
  tl.add({ op: "circle", c: [xOf(pos), y], r: 7, fill: "good", ink: "good" }, 300);
  const eq = [String(start), ...hops.flatMap((h) => [h > 0 ? "+" : "-", String(Math.abs(h))]), "=", c.hideResult ? "?" : String(pos)];
  tl.add({ id: "eq", op: "numwork", at: [60, 250], layout: "equation", rows: [eq], weight: 2 }, 1000, { gap: 300 });
  return { facts: { start, hops: hops.map((h) => (h > 0 ? `+${h}` : `${h}`)).join(" "), end: c.hideResult ? "? (child works it out)" : pos } };
}

function columnOp(c, tl) {
  const { a, b } = c;
  const op = c.op === "sub" ? "sub" : "add";
  if (!isInt(a, 0, 99999) || !isInt(b, 0, 99999) || (op === "sub" && b > a)) return { error: "column_range" };
  const r = op === "add" ? a + b : a - b;
  const width = String(Math.max(a, b, r)).length;
  const digits = (n) => String(n).padStart(width, " ").split("");
  const da = digits(a), db = digits(b), dr = digits(r);
  // carries (add) / borrows (sub), computed column by column from the right: the column that RECEIVES one
  const receives = new Set();
  let carry = 0;
  for (let j = width - 1; j >= 0; j--) {
    const x = +da[j] || 0, y = +db[j] || 0;
    if (op === "add") { carry = x + y + carry >= 10 ? 1 : 0; }
    else { carry = x - y - carry < 0 ? 1 : 0; }
    if (carry && j > 0) receives.add(j - 1);
  }
  const cw = 34, right = 200 + (width * cw) / 2, colX = (j) => right - (width - j - 0.5) * cw;
  const rowY = [95, 140, 205];
  // the two numbers, column-aligned, the sign, the rule
  da.forEach((d, j) => { if (d.trim()) tl.add({ op: "text", at: [colX(j), rowY[0]], text: d, size: "l" }, 160, { gap: 40 }); });
  db.forEach((d, j) => { if (d.trim()) tl.add({ op: "text", at: [colX(j), rowY[1]], text: d, size: "l" }, 160, { gap: 40 }); });
  tl.add({ op: "text", at: [right - (width + 0.6) * cw, rowY[1]], text: op === "add" ? "+" : "-", size: "l" }, 200);
  tl.add({ op: "line", from: [right - (width + 1.1) * cw, 170], to: [right + 8, 170], weight: 2 }, 500, { gap: 150 });
  // then the answer, right to left, each column's carry written small above its column just before that column
  const claims = [];
  for (let j = width - 1; j >= 0; j--) {
    if (op === "sub" && receives.has(j)) tl.add({ op: "text", at: [colX(j), 55], text: "-1", size: "s", ink: "mark" }, 260, { gap: 200 });
    // hideResult: each answer cell is "?" (the column method shown, the digits left to the child)
    if (dr[j].trim()) tl.add({ id: `r${j}`, op: "text", at: [colX(j), rowY[2]], text: c.hideResult ? "?" : dr[j], size: "l", ink: "accent" }, 300, { gap: 220 });
    // round 7 (M2): adding, a column that makes ten sends its 1 UP to the next column: the small 1 appears beside this
    // column's answer and rises to the top of the column on its left (ending where the still board wrote it)
    if (op === "add" && receives.has(j - 1)) {
      const id = tl.add({ op: "text", at: [colX(j) + 17, rowY[2] - 18], text: "1", size: "s", ink: "mark" }, 220, { gap: 160 });
      tl.add({ op: "move", target: id, by: [round1(colX(j - 1) - colX(j) - 17), round1(55 - (rowY[2] - 18))], arc: 10 }, 900, { gap: 80 });
      claims.push({ id, at: [colX(j - 1), 55] });
    }
  }
  return { claims, facts: { first: a, second: b, operation: op === "add" ? "add" : "subtract", result: c.hideResult ? "? (child works it out)" : r, carries: receives.size } };
}

const PLACES = ["O", "T", "H", "Th", "TTh", "L", "TL"];
function placeValue(c, tl) {
  const { value } = c;
  if (!isInt(value, 1, 9999999)) return { error: "value_range" };
  const digits = String(value).split("");
  const n = digits.length;
  const cw = Math.min(52, 320 / n), x0 = 200 - (n * cw) / 2, y0 = 80;
  digits.forEach((d, i) => {
    const place = PLACES[n - 1 - i];
    tl.add({ op: "rect", at: [x0 + i * cw, y0], w: cw - 4, h: 90, weight: 1 }, 260, { gap: 60 });
    tl.add({ op: "text", at: [x0 + i * cw + (cw - 4) / 2, y0 + 22], text: place, size: "s", ink: "soft" }, 200, { with: true });
  });
  // round 7 (M2): the number is written under the boxes digit by digit, then each digit RISES into its place box, ones
  // first (a digit's value is the place it lands in); then the Indian grouping under it
  const claims = [];
  digits.forEach((d, i) => tl.add({ id: `d${i}`, op: "text", at: [x0 + i * cw + (cw - 4) / 2, 222], text: d, size: "l", ink: "accent" }, 200, { gap: 60 }));
  for (let i = n - 1; i >= 0; i--) {
    tl.add({ op: "move", target: `d${i}`, by: [0, y0 + 62 - 222] }, 600, { gap: 160 });
    claims.push({ id: `d${i}`, at: [x0 + i * cw + (cw - 4) / 2, y0 + 62] });
  }
  const indian = value.toLocaleString("en-IN");
  tl.add({ id: "num", op: "text", at: [200, 262], text: indian, size: "l" }, 900, { gap: 300 });
  return { facts: { number: indian, digits: n, places: PLACES.slice(0, n).reverse().join(" ") }, claims };
}

/** Learning (c4 s2 e1, 2026-11-08): an optional short `title` over a groups board — "8 ka 1/2 = 4", the fraction the board
 *  shows. → its facts, or { error }. */
function groupsTitle(c, tl) {
  if (c.title === undefined) return {};
  const t = String(c.title);
  if (!fitsLabel(t) || textProblem(t)) return { error: "groups_title" };
  writeFit(tl, t, 200, 26, 360, {}, { id: "title", ink: "accent", gap: 0, size: "m" });
  return { title: t };
}
function equalGroups(c, tl) {
  if (Array.isArray(c.sizes)) return unequalGroups(c, tl);
  const { groups, each } = c;
  if (!isInt(groups, 2, 6) || !isInt(each, 1, 8)) return { error: "groups_range" };
  const head = groupsTitle(c, tl);
  if (head.error) return head;
  const gw = 340 / groups;
  // round 7 (M2): all the dots first, in one heap under the groups; then they are SHARED OUT, one group at a time, each
  // dot sliding to its place in its group (ending where the still board drew it): "equal groups" seen happening
  const N = groups * each, hc = Math.min(12, N), claims = [];
  for (let g = 0; g < groups; g++) tl.add({ op: "ellipse", c: [30 + g * gw + gw / 2, 110], rx: gw / 2 - 6, ry: 62, weight: 1 }, 300, { gap: 80 });
  const heap = (k) => [200 - ((hc - 1) * 12) / 2 + (k % hc) * 12, 188 + Math.floor(k / hc) * 11];
  for (let k = 0; k < N; k++) tl.add({ id: `g${k}`, op: "circle", c: heap(k), r: 4.5, fill: "accent", ink: "accent", weight: 1 }, 40, { gap: 10 });
  for (let g = 0; g < groups; g++) {
    const gx = 30 + g * gw;
    for (let i = 0; i < each; i++) {
      const cols = each > 4 ? 2 : 1, k = g * each + i;
      const x = gx + gw / 2 + (cols === 2 ? (i % 2 ? 9 : -9) : 0), y = 110 - ((Math.ceil(each / cols) - 1) * 13) / 2 + Math.floor(i / cols) * 13;
      const [hx, hy] = heap(k);
      tl.add({ op: "move", target: `g${k}`, by: [round1(x - hx), round1(y - hy)] }, 650, i ? { with: true } : { gap: 220 });
      claims.push({ id: `g${k}`, c: [round1(hx + round1(x - hx)), round1(hy + round1(y - hy))] });
    }
  }
  tl.add({ id: "eq", op: "numwork", at: [110, 240], layout: "equation", rows: [[String(groups), "×", String(each), "=", c.hideResult ? "?" : String(groups * each)]], weight: 2 }, 1000, { gap: 300 });
  return { counts: { groups, each }, facts: { ...head, groups, each, total: c.hideResult ? "? (child works it out)" : groups * each }, claims };
}

/**
 * Learning's D1 (c4 s2 checks[1] marbles 7, 3, 3, 3; pencils 6, 3, 3): equal-groups@1 with `sizes` [2-6 groups of 1-10] —
 * the same heap shared out into groups of THESE sizes, the groups not all the same. No equation: whether it is a fair share
 * is the card's question. counts { groups, values: the sizes }.
 */
function unequalGroups(c, tl) {
  const sizes = c.sizes;
  if (sizes.length < 2 || sizes.length > 6 || sizes.some((n) => !isInt(n, 1, 10))) return { error: "groups_sizes" };
  const head = groupsTitle(c, tl);
  if (head.error) return head;
  const groups = sizes.length, gw = 340 / groups, N = sizes.reduce((a, b) => a + b, 0), hc = Math.min(12, N), claims = [];
  for (let g = 0; g < groups; g++) tl.add({ op: "ellipse", c: [30 + g * gw + gw / 2, 110], rx: gw / 2 - 6, ry: 66, weight: 1 }, 300, { gap: 80 });
  const heap = (k) => [200 - ((hc - 1) * 12) / 2 + (k % hc) * 12, 196 + Math.floor(k / hc) * 11];
  for (let k = 0; k < N; k++) tl.add({ id: `g${k}`, op: "circle", c: heap(k), r: 4.5, fill: "accent", ink: "accent", weight: 1 }, 40, { gap: 10 });
  let k = 0;
  sizes.forEach((each, g) => {
    const gx = 30 + g * gw;
    for (let i = 0; i < each; i++, k++) {
      const cols = each > 4 ? 2 : 1;
      const x = gx + gw / 2 + (cols === 2 ? (i % 2 ? 9 : -9) : 0), y = 110 - ((Math.ceil(each / cols) - 1) * 13) / 2 + Math.floor(i / cols) * 13;
      const [hx, hy] = heap(k);
      tl.add({ op: "move", target: `g${k}`, by: [round1(x - hx), round1(y - hy)] }, 650, i ? { with: true } : { gap: 220 });
      claims.push({ id: `g${k}`, c: [round1(hx + round1(x - hx)), round1(hy + round1(y - hy))] });
    }
    // each group's own count under it
    tl.add({ op: "text", at: [round1(gx + gw / 2), 196], text: String(each), size: "s", ink: "soft" }, 300, { gap: 120 });
  });
  return { counts: { groups, values: sizes.map(String) }, facts: { ...head, groups, sizes: sizes.join(", "), total: N, equal: sizes.every((n) => n === sizes[0]) ? "yes" : "no" }, claims };
}

// ───────────────────────────── diagrams ─────────────────────────────

/** Does this label fit `maxW` on one line (m or s) or split over two lines at s? (writeFit's rule, without drawing.) */
function canFit(text, maxW) {
  if (sizeFor(text, maxW)) return true;
  const words = text.split(/\s+/);
  for (let k = 1; k < words.length; k++) if (Math.max(textBox(words.slice(0, k).join(" "), "s").w, textBox(words.slice(k).join(" "), "s").w) <= maxW) return true;
  return false;
}

/** The drawn width of a label as writeFit would lay it out in `maxW` (one line, or the wider of two), or null. */
function fitWidth(text, maxW) {
  const one = sizeFor(text, maxW);
  if (one) return textBox(text, one).w;
  const words = text.split(/\s+/);
  let best = null;
  for (let k = 1; k < words.length; k++) {
    const w = Math.max(textBox(words.slice(0, k).join(" "), "s").w, textBox(words.slice(k).join(" "), "s").w);
    if (w <= maxW && (best === null || w < best)) best = w;
  }
  return best;
}

/** A bent arrow's path as points (its quadratic curve sampled), the same curve shared/whiteboard.js draws. */
function bentLeg(a, b, bend) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const ctl = [mx - (dy / len) * bend * len * 0.5, my + (dx / len) * bend * len * 0.5];
  return [0, 0.25, 0.5, 0.75, 1].map((t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * ctl[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * ctl[1] + t * t * b[1]]);
}
/** A token that travels the legs in order (round 7, M2): it appears at the first leg's start, follows each leg, and steps
 *  straight from one leg's end to the next's start. → the claim on where it ends. */
function tour(tl, legs) {
  if (!legs.length) return [];
  const start = legs[0][0];
  const id = tl.add({ op: "circle", c: [round1(start[0]), round1(start[1])], r: 5, fill: "mark", ink: "mark", weight: 1 }, 200, { gap: 260 });
  let at = [round1(start[0]), round1(start[1])];
  for (const leg of legs) {
    const path = leg.map((q) => [round1(q[0] - at[0]), round1(q[1] - at[1])]).filter((q, i) => i || q[0] || q[1]);
    if (path.length) tl.add({ op: "follow", target: id, path }, 800, { gap: 60 });
    at = [at[0] + path.at(-1)[0], at[1] + path.at(-1)[1]];
  }
  return [{ id, c: [round1(at[0]), round1(at[1])] }];
}

function flow(c, tl) {
  const steps = c.steps;
  if (!Array.isArray(steps) || steps.length < 2 || steps.length > 6 || !steps.every(fitsLabel)) return { error: "steps" };
  const n = steps.length;
  // Layout, first that fits every label: one row left to right (≤ 3 steps); one column top to bottom (≤ 3); two columns
  // read top to bottom, then the next column (4-6). Boxes are sized to the board, never to the text. The last box ends 16
  // units above the board's bottom (QA round 5 D09: at 300 its stroke was cut at the phone stage's bottom edge).
  const rowW = 340 / n - 18;
  const layout = n <= 3 && steps.every((t) => canFit(t, rowW - 10)) ? "row" : n <= 3 ? "col" : "two";
  const perCol = layout === "two" ? Math.ceil(n / 2) : n;
  const bw = layout === "row" ? rowW : layout === "col" ? 240 : 160;
  const bh = layout === "row" ? 64 : Math.min(58, 250 / perCol - 18);
  const pos = steps.map((_, i) => layout === "row" ? [30 + i * (bw + 18) + bw / 2, 150]
    : [layout === "col" ? 200 : i < perCol ? 105 : 295, 30 + bh / 2 + (i % perCol) * ((254 - bh) / Math.max(1, perCol - 1))]);
  for (let i = 0; i < n; i++) {
    const [x, y] = pos[i];
    if (i > 0) {
      const [px, py] = pos[i - 1];
      const sameRow = Math.abs(py - y) < 1, sameCol = Math.abs(px - x) < 1;
      const from = sameRow ? [px + bw / 2 + 3, py] : sameCol ? [px, py + bh / 2 + 3] : [px + bw / 2 + 3, py];
      const to = sameRow ? [x - bw / 2 - 3, y] : sameCol ? [x, y - bh / 2 - 3] : [x - bw / 2 - 3, y];
      tl.add({ op: "arrow", from, to, ink: "accent", ...(sameRow || sameCol ? {} : { bend: 0.2 }), __step: i }, 450, { gap: 160 });
    }
    tl.add({ id: `b${i}`, op: "rect", at: [x - bw / 2, y - bh / 2], w: bw, h: bh, round: 10, weight: 2 }, 420, { gap: 80 });
    if (!writeFit(tl, steps[i], x, y + 2, bw - 10, {}, { id: `t${i}` })) return { error: `label_too_wide:${i}` };
  }
  // round 7 (M2): then the process RUNS: a token goes along every arrow in order, step to step, ending at the last step
  const legs = [];
  for (let i = 1; i < n; i++) {
    const a = tl.ops.find((o) => o.op === "arrow" && o.__step === i);
    if (a) legs.push(a.bend ? bentLeg(a.from, a.to, a.bend) : [a.from, a.to]);
  }
  for (const o of tl.ops) delete o.__step;
  const claims = tour(tl, legs);
  return { facts: Object.fromEntries([["steps", n], ...steps.map((s, i) => [`step${i + 1}`, s])]), claims };
}

function cycle(c, tl) {
  const stages = c.stages;
  if (!Array.isArray(stages) || stages.length < 3 || stages.length > 6 || !stages.every(fitsLabel)) return { error: "stages" };
  const n = stages.length, cx = 200, cy = 152, rx = n <= 4 ? 130 : 128, ry = 100, legs = [];
  const at = (i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; };
  for (let i = 0; i < n; i++) {
    const maxW = n <= 4 ? 160 : 140;
    const fw = fitWidth(stages[i], maxW);
    if (fw === null) return { error: `label_too_wide:${i}` };
    const [x0, y] = at(i);
    // keep the word on the board: its centre moves in from the edge by half its width
    const x = Math.min(400 - fw / 2 - 4, Math.max(fw / 2 + 4, x0));
    writeFit(tl, stages[i], x, y, maxW, {}, { id: `t${i}`, ms: 550, gap: 120, ink: i === 0 ? "accent" : undefined });
    const [nx0, ny] = at((i + 1) % n);
    const nxt = stages[(i + 1) % n], nh = (fitWidth(nxt, n <= 4 ? 160 : 140) ?? 0) / 2 + 4;
    const nx = Math.min(400 - nh, Math.max(nh, nx0));
    // the arrow runs between the two labels along the loop, shortened so it never touches either word
    const sx = x + (nx - x) * 0.32, sy = y + (ny - y) * 0.32, ex = x + (nx - x) * 0.68, ey = y + (ny - y) * 0.68;
    tl.add({ op: "arrow", from: [sx, sy], to: [ex, ey], bend: -0.25, ink: "accent" }, 450, { gap: 140 });
    legs.push(bentLeg([sx, sy], [ex, ey], -0.25));
  }
  if (c.centre && fitsLabel(c.centre)) {
    const size = sizeFor(c.centre, 150);
    if (size) tl.add({ op: "text", at: [cx, cy], text: c.centre, size, ink: "soft" }, 500, { gap: 200 });
  }
  tl.add({ op: "highlight", target: "t0", style: "circle", ink: "mark" }, 600, { gap: 300 });
  // round 7 (M2): then one turn of the cycle: a token travels every arrow in order, back to where it began (a cycle
  // never ends: the last stage leads to the first)
  const claims = tour(tl, legs);
  return { facts: Object.fromEntries([["stages", n], ...stages.map((s, i) => [`stage${i + 1}`, s])]), claims };
}

function compare(c, tl) {
  const { left, right } = c;
  const ok = (side) => side && fitsLabel(side.title) && Array.isArray(side.items) && side.items.length >= 1 && side.items.length <= 4 && side.items.every(fitsLabel);
  if (!ok(left) || !ok(right)) return { error: "sides" };
  const colW = 175;
  // one size for both titles and one for all the items: the table reads as a table
  const titleSize = [left, right].every((d) => sizeFor(d.title, colW - 8) === "m") ? "m" : "s";
  const itemSize = [...left.items, ...right.items].every((t) => sizeFor(t, colW - 8) === "m") ? "m" : "s";
  for (const [i, side] of [left, right].entries()) {
    const x = 20 + i * 190 + colW / 2;
    if (!writeFit(tl, side.title, x, 36, colW - 8, {}, { id: `h${i}`, ink: "accent", gap: 150, size: titleSize })) return { error: "title_too_wide" };
    tl.add({ op: "line", from: [x - colW / 2 + 8, 62], to: [x + colW / 2 - 8, 62], ink: "accent", weight: 1 }, 300, { gap: 40 });
  }
  tl.add({ op: "line", from: [200, 30], to: [200, 280], weight: 1, ink: "soft" }, 500);
  const rows = Math.max(left.items.length, right.items.length);
  for (let r = 0; r < rows; r++) {
    for (const [i, side] of [left, right].entries()) {
      const t = side.items[r];
      if (!t) continue;
      if (!writeFit(tl, t, 20 + i * 190 + colW / 2, 100 + r * 52, colW - 8, {}, { id: `c${i}${r}`, ms: 480, gap: i ? 60 : 220, size: itemSize })) return { error: `item_too_wide:${i}.${r}` };
    }
  }
  // each column as its title and its items (sim lab 4ae682b3 p29: keys "left1" / "left2" on the facts row were spoken to the
  // child as names: "Screen par left1 standing line…", "Ab left2 ko imagine karo")
  const lists = (side, items) => {
    const out = {}; let k = 0, cur = "";
    for (const t of items) {
      if (cur && cur.length + 2 + t.length > 40) { out[`${side}${k ? "More" : "Items"}`] = cur; k++; cur = ""; }
      cur = cur ? `${cur}, ${t}` : t;
    }
    if (cur && k < 2) out[`${side}${k ? "More" : "Items"}`] = cur;
    return out;
  };
  return { facts: { left: left.title, right: right.title, rows, ...lists("left", left.items), ...lists("right", right.items) } };
}

function parts(c, tl) {
  const { whole, parts: ps } = c;
  if (!fitsLabel(whole) || !Array.isArray(ps) || ps.length < 2 || ps.length > 6 || !ps.every(fitsLabel)) return { error: "parts" };
  const cx = 200, cy = 150;
  const ws = sizeFor(whole, 130);
  if (!ws) return { error: "whole_too_wide" };
  tl.add({ id: "whole", op: "ellipse", c: [cx, cy], rx: 74, ry: 32, weight: 2 }, 700);
  tl.add({ op: "text", at: [cx, cy + 2], text: whole, size: ws, ink: "accent" }, 450, { gap: 40 });
  const n = ps.length;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * (i + 0.5)) / n;
    const lx = cx + 150 * Math.cos(a), ly = cy + 112 * Math.sin(a);
    const fw = fitWidth(ps[i], 140);
    if (fw === null) return { error: `part_too_wide:${i}` };
    const half = fw / 2 + 4;
    tl.add({ op: "line", from: [cx + 78 * Math.cos(a), cy + 36 * Math.sin(a)], to: [cx + 118 * Math.cos(a), cy + 88 * Math.sin(a)], weight: 1 }, 320, { gap: 140 });
    writeFit(tl, ps[i], Math.min(400 - half, Math.max(half, lx)), Math.min(270, Math.max(30, ly)), 140, {}, { id: `p${i}`, ms: 450 });
  }
  return { facts: { whole, parts: n, ...Object.fromEntries(ps.map((p, i) => [`part${i + 1}`, p])) } };
}

/** Vetted sketches: code-drawn strokes plus named anchor points a label may point at (left / right label columns). */
const SKETCH = {
  plant: {
    // round 7 (C1 board richness): drawn as a teacher draws it: soil, roots branching under it, a curved stem, two real
    // leaves with midribs, a hanging fruit on its own stalk and a five-petal flower; every anchor ON the part it names
    strokes: [
      { op: "line", from: [128, 250], to: [272, 250], ink: "soft", weight: 2 },                             // soil
      // the ground under it, hatched as a textbook does, clear of the roots; "soil" points at the first hatch, so its
      // leader no longer runs along the soil line
      ...[136, 152, 168, 236, 252, 268].map((x) => ({ op: "line", from: [x, 253], to: [x - 8, 263], ink: "soft", weight: 1 })),
      { op: "stroke", points: [[140, 256], [134, 262]], ink: "soft", weight: 1 },
      { op: "stroke", points: [[260, 256], [254, 262]], ink: "soft", weight: 1 },
      { op: "stroke", points: [[200, 250], [199, 268], [201, 286]], ink: "chalk", weight: 2 },               // tap root
      { op: "stroke", points: [[200, 258], [186, 268], [176, 280]], ink: "chalk", weight: 1 },               // side roots
      { op: "stroke", points: [[200, 262], [214, 272], [224, 284]], ink: "chalk", weight: 1 },
      { op: "stroke", points: [[200, 250], [203, 210], [199, 160], [200, 104]], ink: "good", weight: 3 },     // stem
      { op: "polygon", points: [[201, 196], [184, 184], [164, 180], [148, 186], [164, 198], [184, 200]], fill: "good", ink: "good" }, // leaf (left)
      { op: "line", from: [199, 194], to: [154, 187], ink: "chalk", weight: 1 },                             // its midrib
      { op: "polygon", points: [[200, 164], [217, 152], [237, 148], [253, 154], [237, 166], [217, 168]], fill: "good", ink: "good" }, // leaf (right)
      { op: "line", from: [202, 162], to: [247, 155], ink: "chalk", weight: 1 },
      { op: "stroke", points: [[200, 140], [190, 144], [184, 150]], ink: "good", weight: 1 },               // fruit stalk
      { op: "circle", c: [180, 158], r: 8, fill: "mark", ink: "mark" },                                      // fruit
      { op: "circle", c: [200, 74], r: 8, fill: "accent", ink: "accent" },                                   // petals
      { op: "circle", c: [212, 83], r: 8, fill: "accent", ink: "accent" },
      { op: "circle", c: [207, 97], r: 8, fill: "accent", ink: "accent" },
      { op: "circle", c: [193, 97], r: 8, fill: "accent", ink: "accent" },
      { op: "circle", c: [188, 83], r: 8, fill: "accent", ink: "accent" },
      { op: "circle", c: [200, 87], r: 5, fill: "mark", ink: "mark" },                                       // its centre
    ],
    anchors: { flower: [212, 80], leaf: [240, 156], stem: [201, 220], root: [210, 276], soil: [128, 263], fruit: [176, 160] },
  },
  circuit: {
    // round 7 (C1 board richness): a closed circuit as a textbook draws it: a cell (long and short plate) on the left,
    // a bulb with its filament on top, a switch on the right, wires joining them; every anchor ON the part it names
    strokes: [
      { op: "line", from: [150, 110], to: [182, 110], weight: 2 },                                          // wire: top left
      { op: "line", from: [218, 110], to: [250, 110], weight: 2 },                                          // wire: top right
      { op: "line", from: [250, 110], to: [250, 166], weight: 2 },                                          // wire: right, to the switch
      { op: "line", from: [250, 206], to: [250, 230], weight: 2 },                                          // wire: right, below it
      { op: "line", from: [250, 230], to: [150, 230], weight: 2 },                                          // wire: bottom
      { op: "line", from: [150, 230], to: [150, 182], weight: 2 },                                          // wire: left, to the cell
      { op: "line", from: [150, 158], to: [150, 110], weight: 2 },
      { op: "line", from: [132, 182], to: [168, 182], weight: 3, ink: "accent" },                           // cell: long plate (+)
      { op: "line", from: [141, 170], to: [159, 170], weight: 3, ink: "accent" },                           // cell: short plate (-)
      { op: "line", from: [150, 170], to: [150, 158], weight: 2 },
      { op: "circle", c: [200, 110], r: 18, ink: "mark" },                                                  // bulb
      { op: "stroke", points: [[189, 117], [194, 103], [200, 115], [206, 103], [211, 117]], ink: "mark", weight: 1 }, // its filament
      { op: "circle", c: [250, 166], r: 3, fill: "chalk" },                                                 // switch: its two posts
      { op: "circle", c: [250, 206], r: 3, fill: "chalk" },
      { op: "line", from: [250, 206], to: [266, 172], weight: 2, ink: "good" },                             // switch: the lever
    ],
    anchors: { cell: [140, 182], bulb: [200, 96], switch: [258, 189], wire: [200, 230] },   // the cell: on its long plate
  },
  cellPlant: {
    // round 7 (C1 board richness): a plant cell as a textbook draws it: a wall, the membrane just inside it, a large
    // vacuole, the nucleus, chloroplasts in the cytoplasm; every anchor on the part it names. 156 wide, so the label
    // columns (x 58 and 342) stay clear of the wall
    strokes: [
      { op: "rect", at: [122, 70], w: 156, h: 160, weight: 3, ink: "good" },                                 // cell wall
      { op: "rect", at: [129, 77], w: 142, h: 146, weight: 1, ink: "chalk" },                                // membrane
      { op: "ellipse", c: [195, 160], rx: 40, ry: 45, fill: "soft", ink: "soft" },                            // vacuole
      { op: "circle", c: [245, 108], r: 15, fill: "accent", ink: "accent" },                                  // nucleus
      { op: "ellipse", c: [152, 98], rx: 10, ry: 6, fill: "good", ink: "good" },                              // chloroplasts
      { op: "ellipse", c: [252, 198], rx: 10, ry: 6, fill: "good", ink: "good" },
      { op: "ellipse", c: [152, 192], rx: 10, ry: 6, fill: "good", ink: "good" },
    ],
    anchors: { wall: [122, 150], membrane: [129, 214], vacuole: [195, 160], nucleus: [245, 108], chloroplast: [252, 198], cytoplasm: [258, 150] },
  },
  cellAnimal: {
    // an animal cell: a rounded membrane (no wall), cytoplasm, a nucleus with its nucleolus
    strokes: [
      { op: "ellipse", c: [200, 150], rx: 80, ry: 82, weight: 2, ink: "chalk" },                              // membrane
      { op: "circle", c: [207, 146], r: 22, fill: "accent", ink: "accent" },                                  // nucleus
      { op: "circle", c: [211, 141], r: 6, fill: "mark", ink: "mark" },                                       // nucleolus
    ],
    anchors: { membrane: [120, 150], nucleus: [214, 158], cytoplasm: [165, 190] },
  },
  atom: {
    // an atom (helium: 2 protons, 2 neutrons, 2 electrons, so it is neutral): the nucleus, one shell, two electrons on it
    strokes: [
      { op: "circle", c: [200, 150], r: 75, ink: "soft", weight: 1 },                                         // the shell
      { op: "circle", c: [200, 150], r: 20, ink: "chalk", weight: 1 },                                        // the nucleus
      { op: "circle", c: [193, 144], r: 6, fill: "accent", ink: "accent" },                                   // protons
      { op: "circle", c: [207, 156], r: 6, fill: "accent", ink: "accent" },
      { op: "circle", c: [207, 144], r: 6, fill: "chalk", ink: "chalk" },                                     // neutrons
      { op: "circle", c: [193, 156], r: 6, fill: "chalk", ink: "chalk" },
      { op: "circle", c: [253, 203], r: 5, fill: "mark", ink: "mark" },                                       // electrons, opposite on the shell
      { op: "circle", c: [147, 97], r: 5, fill: "mark", ink: "mark" },
    ],
    // anchors spread down the right column in the order they are labelled (shell, nucleus, neutron, electron), so no two
    // leaders cross; the electron's leader is the short one to the lower electron
    anchors: { proton: [193, 144], neutron: [207, 144], nucleus: [200, 130], electron: [253, 203], shell: [200, 75] },
  },
  flower: {
    strokes: [
      { op: "line", from: [200, 290], to: [200, 175], weight: 3, ink: "good" },
      { op: "ellipse", c: [160, 120], rx: 30, ry: 16, ink: "accent", fill: "accent" },
      { op: "ellipse", c: [240, 120], rx: 30, ry: 16, ink: "accent", fill: "accent" },
      { op: "ellipse", c: [200, 85], rx: 16, ry: 28, ink: "accent", fill: "accent" },
      { op: "circle", c: [200, 125], r: 15, ink: "mark", fill: "mark" },
      { op: "ellipse", c: [200, 168], rx: 30, ry: 9, ink: "good", fill: "good" },
      { op: "ellipse", c: [228, 240], rx: 24, ry: 9, ink: "good", fill: "good" },
    ],
    anchors: { petal: [160, 120], centre: [200, 125], stamen: [205, 118], pistil: [200, 130], sepal: [200, 168], stem: [200, 210], leaf: [228, 240] },
  },
  leaf: {
    strokes: [
      { op: "stroke", points: [[110, 150], [150, 100], [210, 80], [270, 95], [310, 150], [270, 205], [210, 220], [150, 200], [110, 150]], ink: "good" },
      { op: "line", from: [70, 160], to: [300, 150], ink: "good", weight: 2 },
      { op: "line", from: [170, 154], to: [205, 105], ink: "good", weight: 1 },
      { op: "line", from: [230, 152], to: [262, 108], ink: "good", weight: 1 },
      { op: "line", from: [170, 156], to: [205, 202], ink: "good", weight: 1 },
      { op: "line", from: [230, 152], to: [262, 196], ink: "good", weight: 1 },
    ],
    anchors: { blade: [250, 180], midrib: [200, 154], vein: [205, 108], stalk: [85, 159], tip: [305, 150], margin: [150, 100] },
  },
  insect: {
    strokes: [
      { op: "circle", c: [130, 150], r: 22, ink: "chalk" },
      { op: "ellipse", c: [190, 150], rx: 34, ry: 26, ink: "chalk" },
      { op: "ellipse", c: [275, 150], rx: 52, ry: 32, ink: "chalk" },
      { op: "stroke", points: [[120, 132], [100, 100], [88, 92]], ink: "chalk" },
      { op: "stroke", points: [[136, 130], [128, 96], [120, 84]], ink: "chalk" },
      { op: "line", from: [175, 172], to: [160, 215] }, { op: "line", from: [190, 176], to: [192, 222] }, { op: "line", from: [205, 172], to: [222, 215] },
      { op: "line", from: [175, 128], to: [160, 85] }, { op: "line", from: [190, 124], to: [192, 78] }, { op: "line", from: [205, 128], to: [222, 85] },
    ],
    anchors: { head: [130, 150], thorax: [190, 150], abdomen: [275, 150], antenna: [95, 98], leg: [192, 220], eye: [124, 146] },
  },
};
function label(c, tl) {
  const sk = SKETCH[c.sketch];
  if (!sk) return { error: "sketch" };
  const labels = Array.isArray(c.labels) ? c.labels.filter((l) => l && sk.anchors[l.anchor] && fitsLabel(l.text)) : [];
  if (labels.length < 2 || labels.length > 6 || new Set(labels.map((l) => l.anchor)).size !== labels.length) return { error: "labels" };
  sk.strokes.forEach((s, i) => tl.add({ ...s, id: `k${i}` }, s.op === "line" ? 280 : 520, { gap: 50 }));
  tl.pause(250);
  // labels go to the side their anchor is on, stacked, so leaders never cross the sketch's middle
  const left = labels.filter((l) => sk.anchors[l.anchor][0] < 200).sort((p, q) => sk.anchors[p.anchor][1] - sk.anchors[q.anchor][1]);
  const right = labels.filter((l) => sk.anchors[l.anchor][0] >= 200).sort((p, q) => sk.anchors[p.anchor][1] - sk.anchors[q.anchor][1]);
  const place = (list, x) => list.forEach((l, i) => {
    const y = 40 + (i * 230) / Math.max(1, list.length - 1 || 1) + (list.length === 1 ? 90 : 0);
    // a label wider than its column is moved in from the board's edge (4 units clear), never off it
    const w = textBox(l.text, "s").w;
    if (w > 120) throw new Error("label_too_wide");
    const lx = x < 200 ? Math.max(x, 4 + w / 2) : Math.min(x, 396 - w / 2);
    tl.add({ id: `l_${l.anchor}`, op: "label", at: [lx, Math.min(285, y)], text: l.text, to: sk.anchors[l.anchor], ink: "accent" }, 700, { gap: 220 });
  });
  try { place(left, 58); place(right, 342); } catch { return { error: "label_too_wide" }; }
  return { facts: { sketch: c.sketch, labels: labels.length, ...Object.fromEntries(labels.map((l, i) => [`label${i + 1}`, l.text])) } };
}


// ───────────────────────────── geometry and data (W2-B fixer, major 2) ─────────────────────────────
// Code-drawn like the number templates: every angle, vertex, cell and bar height is computed here from a few numbers and
// the kit's own words (codePick reads them from the posed item or the worked example).

const rad = (d) => (d * Math.PI) / 180;
/** An arc of radius r round (cx, cy) from 0° to `deg` (counter-clockwise, screen y down), as stroke points. */
const arcPts = (cx, cy, r, deg) => Array.from({ length: Math.max(3, Math.round(deg / 12) + 1) }, (_, k) => {
  const a = rad((deg * k) / Math.max(2, Math.round(deg / 12)));
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
});

function angle(c, tl) {
  const list = Array.isArray(c.angles) ? c.angles : [];
  if (list.length < 1 || list.length > 3 || !list.every((a) => a && isInt(a.deg, 10, 180) && (a.name === undefined || fitsLabel(a.name)) && (a.len === undefined || a.len === "short" || a.len === "long"))) return { error: "angles" };
  const n = list.length, colW = 400 / n, Lbase = n === 1 ? 150 : n === 2 ? 110 : 82;
  const facts = { angles: n }, claims = [];
  list.forEach((a, i) => {
    const th = rad(a.deg);
    // the arms are as long as the column allows for this opening (an obtuse angle spans more than its arm)
    // (Learning: "short arms, long arms, the same angle": `len` "short" draws the arms at half length; the opening is the same)
    const L = Math.min(Lbase, (colW - 14) / (Math.max(1, Math.cos(th)) - Math.min(0, Math.cos(th)))) * (a.len === "short" ? 0.5 : 1);
    const xs = [0, L, L * Math.cos(th)], minX = Math.min(...xs), maxX = Math.max(...xs);
    const vx = i * colW + colW / 2 - (minX + maxX) / 2, vy = n === 1 ? 215 : 205;
    tl.add({ id: `h${i}`, op: "line", from: [vx, vy], to: [vx + L, vy], weight: 2 }, 520, { gap: i ? 260 : 120 });
    // round 7 (M2): the second arm is drawn along the first, then TURNS open by the angle (an angle is an amount of turn);
    // it ends exactly where the still board drew it (a claim expand() checks)
    tl.add({ id: `r${i}`, op: "line", from: [vx, vy], to: [vx + L, vy], weight: 2, ink: "accent" }, 420, { gap: 90 });
    tl.add({ op: "rotate", target: `r${i}`, deg: -a.deg, about: [vx, vy] }, 700 + a.deg * 6, { gap: 120 });
    claims.push({ id: `r${i}`, to: [vx + L * Math.cos(th), vy - L * Math.sin(th)] });
    tl.add({ op: "circle", c: [vx, vy], r: 4, fill: "accent", ink: "accent", weight: 1 }, 160, { gap: 40 });
    if (a.deg === 90) tl.add({ id: `m${i}`, op: "stroke", points: [[vx + 20, vy], [vx + 20, vy - 20], [vx, vy - 20]], ink: "mark", weight: 2 }, 420, { gap: 200 });
    else tl.add({ id: `m${i}`, op: "stroke", points: arcPts(vx, vy, n === 1 ? 34 : 26, a.deg), ink: "mark", weight: 2 }, 520, { gap: 200 });
    const name = a.name ?? `${a.deg}°`;
    const nx = vx + (minX + maxX) / 2;
    if (n === 1) writeFit(tl, name, nx, 34, 380, {}, { id: `n${i}`, ink: "accent", gap: 220 });
    else writeFit(tl, name, nx, 262, colW - 8, {}, { id: `n${i}`, ink: "accent", gap: 220, size: "s" });
    facts[`angle${i + 1}`] = name;
    // one angle: its parts named in the kit's own words (arm, corner / vertex), leaders to the drawing
    if (n === 1 && c.arm && fitsLabel(c.arm)) tl.add({ op: "label", at: [vx + L * 0.72, vy + 34], text: c.arm, to: [vx + L * 0.72, vy + 4], ink: "soft" }, 520, { gap: 200 });
    if (n === 1 && c.vertex && fitsLabel(c.vertex)) tl.add({ op: "label", at: [Math.max(textBox(c.vertex, "s").w / 2 + 6, vx - 46), vy + 40], text: c.vertex, to: [vx - 3, vy + 3], ink: "soft" }, 520, { gap: 160 });
  });
  return { facts, claims };
}

/**
 * round 7 (main + Learning, c7 staged: vertically opposite angles, parallel lines): LINES, not one angle.
 *   kind "cross"    two lines crossing at a point: `deg` (20-160) between them, `ends` up to 4 letters [A, B, C, D] (line 1's
 *                   left / right ends, line 2's lower / upper ends), `point` (the crossing, "O"), `angles` [{ at 1-4, value?,
 *                   name? }]: at 1 = between B and D (deg), 2 = D-A (180-deg), 3 = A-C (deg), 4 = C-B (180-deg).
 *   kind "parallel" two parallel lines (`names` ["AB", "CD"]: two letters each, at the ends; or one name each), parallel
 *                   marks on both; `transversal` { deg 30-150, name? } crossing both, `angles` [{ at 1-8 }] (1-4 round the
 *                   upper crossing, 5-8 the lower, numbered as for a cross); `gap` (a label, "3 cm") marks the gap between
 *                   the lines at two places — the same gap.
 * A labelled angle writes its `value` in degrees (which must BE the angle drawn there), or "?" (the asked angle), or its
 * `name` ("a", "∠1"). counts.angles: the degrees written; counts.marks: every angle label [{ at: "angle 1", label }].
 */
function lines(c, tl) {
  const okLetter = (t) => typeof t === "string" && /^[A-Z][A-Z]?$/.test(t);
  const list = Array.isArray(c.angles) ? c.angles : [];
  const kind = c.kind === "parallel" ? "parallel" : c.kind === "cross" ? "cross" : null;
  if (!kind) return { error: "lines_kind" };
  const deg = kind === "cross" ? c.deg : c.transversal?.deg;
  if (kind === "cross" && !isInt(deg, 20, 160)) return { error: "lines_deg" };
  if (kind === "parallel" && c.transversal != null && !isInt(deg, 30, 150)) return { error: "lines_transversal" };
  const maxAt = kind === "cross" ? 4 : c.transversal ? 8 : 0;
  if (list.length > maxAt || list.some((a) => !a || !isInt(a.at, 1, maxAt) || (a.value !== undefined && a.value !== "?" && !isInt(a.value, 1, 179)) || (a.name !== undefined && !fitsLabel(a.name)))) return { error: "lines_angles" };
  if (new Set(list.map((a) => a.at)).size !== list.length) return { error: "lines_angles_repeat" };
  // (a written value must be the angle drawn there: 1 and 3 are `deg`, 2 and 4 its supplement)
  const trueAt = (at) => ((at - 1) % 2 === 0 ? deg : 180 - deg);
  for (const a of list) if (typeof a.value === "number" && a.value !== trueAt(a.at)) return { error: `lines_angle_value:${a.at}` };
  const facts = {}, marks = [], written = [];
  // the four rays from a crossing at (x, y): 0 right, deg up-right, 180 left, 180+deg down-left (screen y grows down)
  const ray = (x, y, a, L) => [round1(x + L * Math.cos(rad(a))), round1(y - L * Math.sin(rad(a)))];
  const arcBetween = (x, y, r, a0, a1) => { const n = Math.max(4, Math.round((a1 - a0) / 10) + 1); return Array.from({ length: n }, (_, k) => ray(x, y, a0 + ((a1 - a0) * k) / (n - 1), r)); };
  const labelAngles = (x, y, base) => {
    for (const a of list.filter((q) => q.at > base && q.at <= base + 4)) {
      const i = a.at - base, from = [0, deg, 180, 180 + deg][i - 1], to = [deg, 180, 180 + deg, 360][i - 1];
      const r = 28 + (i % 2 ? 0 : 4);
      if (Math.round(to - from) === 90) {
        const p1 = ray(x, y, from, 16), p2 = ray(x, y, to, 16), p3 = [round1(p1[0] + p2[0] - x), round1(p1[1] + p2[1] - y)];
        tl.add({ op: "stroke", points: [p1, p3, p2], ink: "mark", weight: 2 }, 360, { gap: 120 });
      } else tl.add({ op: "stroke", points: arcBetween(x, y, r, from, to), ink: "mark", weight: 2 }, 420, { gap: 140 });
      const text = a.value === "?" ? "?" : typeof a.value === "number" ? `${a.value}°` : a.name ?? "?";
      const [lx, ly] = ray(x, y, (from + to) / 2, r + 22);
      tl.add({ op: "text", at: [lx, ly + 5], text, size: "s", ink: text === "?" ? "mark" : "accent" }, 360, { gap: 80 });
      marks.push({ at: `angle ${a.at}`, label: text });
      if (typeof a.value === "number") written.push(a.value);
    }
  };
  if (kind === "cross") {
    const ends = Array.isArray(c.ends) ? c.ends : [];
    if (ends.length > 4 || ends.some((e) => !okLetter(e)) || (c.point !== undefined && !okLetter(c.point))) return { error: "lines_names" };
    const x = 200, y = 150, L = 125;
    const [A, B] = [ray(x, y, 180, L), ray(x, y, 0, L)], [C, D] = [ray(x, y, 180 + deg, L), ray(x, y, deg, L)];
    tl.add({ id: "l1", op: "line", from: A, to: B, weight: 2 }, 600);
    tl.add({ id: "l2", op: "line", from: C, to: D, weight: 2, ink: "accent" }, 600, { gap: 160 });
    tl.add({ op: "circle", c: [x, y], r: 4, fill: "accent", ink: "accent", weight: 1 }, 160, { gap: 60 });
    [[A, 180], [B, 0], [C, 180 + deg], [D, deg]].forEach(([p, a], k) => { if (ends[k]) tl.add({ op: "text", at: [round1(p[0] + 14 * Math.cos(rad(a))), round1(p[1] - 14 * Math.sin(rad(a)) + 5)], text: ends[k], size: "s" }, 220, { gap: 40 }); });
    // (the point's name inside the arcs, in the lower right angle, clear of both lines)
    if (c.point) { const [px, py] = ray(x, y, (180 + deg + 360) / 2, 16); tl.add({ op: "text", at: [px, py + 5], text: c.point, size: "s" }, 220, { gap: 40 }); }
    labelAngles(x, y, 0);
    // (no stray digits in the row her line is written from: "two lines", "first line AB" — a "2" or "line1" is a number W17
    // holds her to)
    Object.assign(facts, { lines: `two lines crossing${c.point ? ` at ${c.point}` : ""}`, ...(ends.length === 4 ? { first: `line ${ends[0]}${ends[1]}`, second: `line ${ends[2]}${ends[3]}` } : {}) });
  } else {
    const names = Array.isArray(c.names) ? c.names.slice(0, 2) : [];
    if (names.some((n) => typeof n !== "string" || !(/^[A-Z]{2}$/.test(n) || fitsLabel(n)))) return { error: "lines_names" };
    if (c.gap !== undefined && !fitsLabel(c.gap)) return { error: "lines_gap" };
    if (c.transversal?.name !== undefined && !/^[A-Z]{2}$/.test(c.transversal.name)) return { error: "lines_transversal_name" };
    const ys = [105, 205], x0 = 40, x1 = 360;
    ys.forEach((y, k) => {
      tl.add({ id: `p${k}`, op: "line", from: [x0, y], to: [x1, y], weight: 2 }, 600, { gap: k ? 160 : 0 });
      // (parallel marks: one chevron on each line, the same way)
      tl.add({ op: "stroke", points: [[292, y - 6], [300, y], [292, y + 6]], ink: "soft", weight: 2 }, 200, { gap: 40 });
      const n = names[k];
      if (n && /^[A-Z]{2}$/.test(n)) { tl.add({ op: "text", at: [x0 - 14, y + 5], text: n[0], size: "s" }, 200, { gap: 40 }); tl.add({ op: "text", at: [x1 + 14, y + 5], text: n[1], size: "s" }, 200, { gap: 40 }); }
      else if (n) tl.add({ op: "text", at: [x1 - 28, y - 12], text: n, size: "s" }, 200, { gap: 40 });
    });
    if (c.gap !== undefined) for (const gx of [80, 240]) {
      tl.add({ op: "line", from: [gx, ys[0] + 4], to: [gx, ys[1] - 4], weight: 1, ink: "soft" }, 260, { gap: 80 });
      tl.add({ op: "text", at: [gx + 30, (ys[0] + ys[1]) / 2 + 5], text: c.gap, size: "s", ink: "soft" }, 260, { gap: 40 });
    }
    if (c.transversal) {
      const dx = 50 / Math.tan(rad(deg)), I1 = [round1(200 + dx), ys[0]], I2 = [round1(200 - dx), ys[1]];
      const P = ray(I1[0], I1[1], deg, 45), Q = ray(I2[0], I2[1], 180 + deg, 45);
      tl.add({ id: "t", op: "line", from: Q, to: P, weight: 2, ink: "accent" }, 600, { gap: 160 });
      if (c.transversal.name) { tl.add({ op: "text", at: [P[0] + 10, P[1] - 4], text: c.transversal.name[0], size: "s" }, 200, { gap: 40 }); tl.add({ op: "text", at: [Q[0] - 10, Q[1] + 12], text: c.transversal.name[1], size: "s" }, 200, { gap: 40 }); }
      labelAngles(I1[0], I1[1], 0);
      labelAngles(I2[0], I2[1], 4);
    }
    Object.assign(facts, { lines: "two parallel lines", ...(names.length ? { names: names.join(", ") } : {}), ...(c.transversal ? { transversal: c.transversal.name ?? "1 line crossing both" } : {}), ...(c.gap ? { gap: `${c.gap} at two places` } : {}) });
  }
  // (the angles it WRITES: the asked "?" is no fact)
  if (written.length) facts.angles = marks.filter((m) => m.label !== "?").map((m) => m.label).join(" | ").slice(0, 40);
  return { facts, counts: { ...(written.length ? { angles: written } : {}), ...(marks.length ? { marks, labels: marks.length } : {}) } };
}

const SIDES = { triangle: 3, square: 4, rectangle: 4, quadrilateral: 4, pentagon: 5, hexagon: 6, octagon: 8, circle: 0 };
/** A shape's corners round (cx, cy), radius R, turned by `turn` degrees. */
function corners(shape, cx, cy, R, turn = 0) {
  const k = SIDES[shape];
  const base = shape === "rectangle" ? [[-1.1, -0.62], [1.1, -0.62], [1.1, 0.62], [-1.1, 0.62]].map(([x, y]) => [x * R * 0.82, y * R * 0.82])
    : shape === "quadrilateral" ? [[-0.95, -0.55], [0.75, -0.8], [1.0, 0.55], [-0.7, 0.75]].map(([x, y]) => [x * R, y * R])
    : Array.from({ length: k }, (_, i) => { const a = rad(-90 + (360 * i) / k + (shape === "square" ? 45 : 0)); return [R * Math.cos(a), R * Math.sin(a)]; });
  const t = rad(turn);
  return base.map(([x, y]) => [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)]);
}
function shape(c, tl) {
  if (!(c.shape in SIDES)) return { error: "shape" };
  const copies = c.copies === 2 ? 2 : 1;
  for (const k of ["name", "side", "corner", "centre", "radius", "diameter", "chord", "arc"]) if (c[k] !== undefined && !fitsLabel(c[k])) return { error: `label_${k}` };
  const names = Array.isArray(c.names) ? c.names : [];
  if (names.some((x) => !fitsLabel(x))) return { error: "names" };
  if (c.shape === "circle") {
    if (copies !== 1) return { error: "circle_copies" };
    const cx = 200, cy = 138, r = 100;
    tl.add({ id: "o", op: "circle", c: [cx, cy], r, weight: 2 }, 1000);
    tl.add({ id: "ctr", op: "circle", c: [cx, cy], r: 4, fill: "accent", ink: "accent", weight: 1 }, 200, { gap: 160 });
    // round 7 (Learning, c6 circles: "a circle can't show a radius or diameter"): a radius and a diameter are drawn as
    // ARROWS (a measure, not a cut: W8 refuses a round whole cut by lines through its centre), each label beside its segment,
    // never on it (W2); a chord is a line clear of the centre (it cuts nothing W8 counts); an arc is a stroke just outside the rim
    const at = (deg, rr = r) => [round1(cx + rr * Math.cos(rad(deg))), round1(cy + rr * Math.sin(rad(deg)))];
    if (c.diameter) {
      tl.add({ id: "dia", op: "arrow", from: at(180), to: at(0), ink: "good", weight: 2 }, 600, { gap: 200 });
      tl.add({ op: "text", at: [cx - 46, cy + 20], text: c.diameter, size: "s", ink: "good" }, 420, { gap: 60 });
    }
    if (c.radius) {
      const e = at(-50), hw = textBox(c.radius, "s").w / 2;
      tl.add({ id: "rad", op: "arrow", from: [cx, cy], to: e, ink: "accent", weight: 2 }, 520, { gap: 200 });
      // (beyond the radius's end, outside the rim: clear of the segment and of the circle, pulled in at the board's edge)
      tl.add({ op: "text", at: [round1(Math.min(400 - hw - 4, e[0] + hw + 10)), round1(e[1] + 4)], text: c.radius, size: "s", ink: "accent" }, 420, { gap: 60 });
    }
    if (c.chord) {
      const a = at(150), b = at(30);
      tl.add({ id: "chord", op: "line", from: a, to: b, ink: "mark", weight: 2 }, 520, { gap: 200 });
      tl.add({ op: "text", at: [cx, round1(a[1] + 22)], text: c.chord, size: "s", ink: "mark" }, 420, { gap: 60 });
    }
    if (c.arc) {
      const pts = Array.from({ length: 9 }, (_, i) => at(200 + i * 7.5, r + 9));
      tl.add({ id: "arc", op: "stroke", points: pts, ink: "accent", weight: 3 }, 600, { gap: 200 });
      const m = at(230, r + 30);
      tl.add({ op: "text", at: [Math.max(m[0], textBox(c.arc, "s").w / 2 + 6), m[1]], text: c.arc, size: "s", ink: "accent" }, 420, { gap: 60 });
    }
    if (c.centre) tl.add({ op: "label", at: [Math.max(textBox(c.centre, "s").w / 2 + 6, 62), 262], text: c.centre, to: [cx - 3, cy + 3], ink: "soft" }, 600, { gap: 200 });
    if (c.name) tl.add({ op: "text", at: [300, 270], text: c.name, size: sizeFor(c.name, 180) ?? "s", ink: "accent" }, 500, { gap: 200 });
    return { counts: { sides: 0 }, facts: { shape: c.name ?? "circle", ...(c.centre ? { centre: "marked" } : {}), ...(c.radius ? { radius: "drawn" } : {}), ...(c.diameter ? { diameter: "drawn" } : {}),
      ...(c.chord ? { chord: "drawn" } : {}), ...(c.arc ? { arc: "drawn" } : {}) } };
  }
  const R = copies === 1 ? 100 : 70;
  for (let k = 0; k < copies; k++) {
    const cx = copies === 1 ? 200 : 105 + k * 190, cy = 140;
    const pts = corners(c.shape, cx, cy, R, k ? 25 : 0);
    tl.add({ id: `p${k}`, op: "polygon", points: pts, weight: 2, ...(k ? { ink: "accent" } : {}) }, 1100, { gap: k ? 320 : 120 });
    pts.forEach((p) => tl.add({ op: "circle", c: p, r: 3.5, fill: "mark", ink: "mark", weight: 1 }, 110, { gap: 40 }));
    if (names[k]) tl.add({ op: "text", at: [cx, 268], text: names[k], size: "m", ink: k ? "accent" : undefined }, 360, { gap: 120 });
    if (copies === 1) {
      // a side and a corner named, leaders from outside the shape
      const [a, b] = [pts[0], pts[1]];
      if (c.side) {
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
        const w = textBox(c.side, "s").w / 2 + 6;
        tl.add({ op: "label", at: [Math.min(400 - w, Math.max(w, mx + (dx / d) * 52)), Math.min(285, Math.max(22, my + (dy / d) * 40))], text: c.side, to: [mx, my], ink: "soft" }, 560, { gap: 220 });
      }
      if (c.corner) {
        const v = pts[pts.length - 1], dx = v[0] - cx, dy = v[1] - cy, d = Math.hypot(dx, dy) || 1;
        const w = textBox(c.corner, "s").w / 2 + 6;
        tl.add({ op: "label", at: [Math.min(400 - w, Math.max(w, v[0] + (dx / d) * 46)), Math.min(285, Math.max(22, v[1] + (dy / d) * 34))], text: c.corner, to: v, ink: "soft" }, 560, { gap: 160 });
      }
      if (c.name) tl.add({ op: "text", at: [200, 278], text: c.name, size: sizeFor(c.name, 300) ?? "s", ink: "accent" }, 480, { gap: 200 });
    }
  }
  const k = SIDES[c.shape];
  return { counts: { sides: k, corners: k }, facts: { shape: c.name ?? c.shape, sides: k, corners: k, ...(copies === 2 ? { copies: 2, second: "same shape, turned" } : {}) } };
}

function symmetry(c, tl) {
  if (c.line !== undefined && !fitsLabel(c.line)) return { error: "line_label" };
  if (c.dot !== undefined && !isInt(c.dot, 1, 6)) return { error: "dot" };
  tl.add({ id: "fold", op: "line", from: [200, 18], to: [200, 282], dashed: true, ink: "accent", weight: 2 }, 900);
  if (c.line) tl.add({ op: "text", at: [300, 30], text: c.line, size: "s", ink: "accent" }, 480, { gap: 80 });
  if (c.dot) {
    const d = c.dot, u = 25, y = 150;
    tl.add({ id: "dot", op: "circle", c: [200 - d * u, y], r: 8, fill: "accent", ink: "accent" }, 300, { gap: 300 });
    tl.add({ op: "text", at: [200 - (d * u) / 2, y - 26], text: String(d), size: "m", ink: "soft" }, 300, { gap: 200 });
    // round 7 (M2): the image starts ON the dot and jumps across the line, as far again on the other side
    tl.add({ id: "img", op: "circle", c: [200 - d * u, y], r: 8, fill: "good", ink: "good" }, 200, { gap: 200 });
    tl.add({ op: "arrow", from: [200 - d * u + 10, y + 16], to: [200 + d * u - 10, y + 16], bend: 0.35, ink: "mark" }, 900, { gap: 120 });
    tl.add({ op: "move", target: "img", by: [2 * d * u, 0], arc: 34 }, 900, { with: true });
    tl.add({ op: "text", at: [200 + (d * u) / 2, y - 26], text: String(d), size: "m", ink: "soft" }, 300, { gap: 200 });
    return { facts: { line: c.line ?? "mirror line", left: d, right: d }, ground: "grid", claims: [{ id: "img", c: [200 + d * u, y] }] };
  }
  // a figure and its mirror half, drawn one half after the other
  tl.add({ id: "L", op: "stroke", points: [[200, 52], [150, 92], [118, 150], [150, 212], [200, 252]], weight: 2 }, 900, { gap: 260 });
  tl.add({ op: "circle", c: [164, 140], r: 9, fill: "accent", ink: "accent" }, 260, { gap: 80 });
  // round 7 (M2): the mirror half is the first half FOLDED over the line: traced on top of it, then turned over the fold
  // (a scale of -1 about the line: halfway through it lies flat along the fold)
  tl.add({ id: "R", op: "stroke", points: [[200, 52], [150, 92], [118, 150], [150, 212], [200, 252]], weight: 2, ink: "good" }, 500, { gap: 320 });
  tl.add({ id: "Rd", op: "circle", c: [164, 140], r: 9, fill: "good", ink: "good" }, 200, { gap: 40 });
  tl.add({ op: "scale", target: "R", k: [-1, 1], about: [200, 150] }, 1500, { gap: 240 });
  tl.add({ op: "move", target: "Rd", by: [72, 0], arc: 24 }, 1500, { with: true });
  return { facts: { line: c.line ?? "mirror line", halves: "match" }, ground: "grid",
    claims: [{ id: "R", points: [[200, 52], [250, 92], [282, 150], [250, 212], [200, 252]] }, { id: "Rd", c: [236, 140] }] };
}

const UNITS = ["cm", "m", "km", "mm", "units"];
function areaGrid(c, tl) {
  const { w, h } = c;
  if (!isInt(w, 1, 1000) || !isInt(h, 1, 1000)) return { error: "dims" };
  const mode = c.mode === "perimeter" ? "perimeter" : "area";
  const unit = UNITS.includes(c.unit) ? ` ${c.unit}` : "";
  const grid = w <= 12 && h <= 8;
  const cell = grid ? Math.min(260 / w, 165 / h, 34) : 0;
  const sc = grid ? cell : Math.min(260 / w, 165 / h);
  const W = Math.max(60, w * sc), H = Math.max(40, h * sc);
  const x0 = 200 - W / 2 - 20, y0 = 48 + (165 - H) / 2;
  tl.add({ id: "box", op: "rect", at: [x0, y0], w: W, h: H, weight: 2 }, 900);
  if (grid) {
    for (let i = 1; i < w; i++) tl.add({ op: "line", from: [x0 + i * cell, y0], to: [x0 + i * cell, y0 + H], weight: 1, ink: "soft" }, 160, { gap: 30 });
    for (let j = 1; j < h; j++) tl.add({ op: "line", from: [x0, y0 + j * cell], to: [x0 + W, y0 + j * cell], weight: 1, ink: "soft" }, 160, { gap: 30 });
    // round 7 (M2): area is rows of squares: each row fills from the left, one after the other
    if (mode === "area") for (let j = 0; j < h; j++) {
      const id = tl.add({ op: "rect", at: [x0 + 2, y0 + j * cell + 2], w: W - 4, h: cell - 4, fill: "accent", ink: "accent", weight: 1 }, 160, { gap: 140 });
      tl.add({ op: "sweep", target: id, dir: "right" }, 520, { gap: 0 });
    }
  }
  tl.add({ op: "text", at: [x0 + W / 2, y0 - 14], text: `${w}${unit}`, size: "s", ink: "accent" }, 360, { gap: 200 });
  tl.add({ op: "text", at: [x0 + W + 8, y0 + H / 2], text: `${h}${unit}`, size: "s", ink: "accent", align: "start" }, 360, { gap: 120 });
  if (mode === "perimeter") {
    const o = 7;
    tl.add({ op: "arrow", from: [x0 + o, y0 + o], to: [x0 + W - o, y0 + o], ink: "mark" }, 420, { gap: 220 });
    tl.add({ op: "arrow", from: [x0 + W - o, y0 + o], to: [x0 + W - o, y0 + H - o], ink: "mark" }, 360, { gap: 40 });
    tl.add({ op: "arrow", from: [x0 + W - o, y0 + H - o], to: [x0 + o, y0 + H - o], ink: "mark" }, 420, { gap: 40 });
    tl.add({ op: "arrow", from: [x0 + o, y0 + H - o], to: [x0 + o, y0 + o], ink: "mark" }, 360, { gap: 40 });
  }
  const result = mode === "area" ? w * h : 2 * (w + h);
  const res = c.hideResult ? "?" : String(result);
  const long = [String(w), "+", String(h), "+", String(w), "+", String(h), "=", res];
  // the four sides written out when they fit the board's width, else 2 × (length + breadth) in its two steps
  const row = mode === "area" ? [String(w), "×", String(h), "=", res]
    : textBox(long.join(" "), "m").w <= 350 ? long : ["2", "×", String(w + h), "=", res];
  tl.add({ id: "eq", op: "numwork", at: [30, 262], layout: "equation", rows: [row], weight: 2 }, 1100, { gap: 300 });
  const val = c.hideResult ? "? (child works it out)" : `${result}${unit}${mode === "area" && unit ? " sq" : ""}`.trim();
  return { counts: { sides: 4, corners: 4, sideValues: [`${w}${unit}`.trim(), `${h}${unit}`.trim(), `${w}${unit}`.trim(), `${h}${unit}`.trim()], ...(grid ? { rows: h, cols: w } : {}) },
    facts: { length: `${w}${unit}`.trim(), breadth: `${h}${unit}`.trim(), ...(mode === "area" ? { squares: grid ? (c.hideResult ? "?" : w * h) : "not drawn", area: val } : { perimeter: val }) } };
}

/** The smallest friendly step that draws `max` in ≤ 6 gridlines. */
function niceStep(max) {
  for (let p = 1; p <= 1e6; p *= 10) for (const m of [1, 2, 2.5, 5]) { const s = m * p; if (Number.isInteger(s) && Math.ceil(max / s) <= 6) return s; }
  return null;
}
function barChart(c, tl) {
  const bars = Array.isArray(c.bars) ? c.bars : [];
  if (bars.length < 2 || bars.length > 6 || !bars.every((b) => b && fitsLabel(b.label) && isInt(b.value, 0, 100000))) return { error: "bars" };
  const max = Math.max(...bars.map((b) => b.value));
  const step = max > 0 ? niceStep(max) : null;
  if (!step) return { error: "scale" };
  const top = Math.ceil(max / step) * step;
  const x0 = 72, y0 = 238, CH = 176, CW = 312, n = bars.length, colW = CW / n;
  tl.add({ id: "ax", op: "line", from: [x0, y0], to: [x0 + CW, y0], weight: 2 }, 500);
  tl.add({ id: "ay", op: "line", from: [x0, y0], to: [x0, y0 - CH - 10], weight: 2 }, 500, { gap: 60 });
  for (let v = 0; v <= top; v += step) {
    const y = y0 - (v / top) * CH;
    tl.add({ op: "line", from: [x0 - 5, y], to: [x0, y], weight: 1 }, 80, { gap: 20 });
    tl.add({ op: "text", at: [x0 - 9, y + 1], text: String(v), size: "s", align: "end", ink: "soft" }, 160, { with: true });
  }
  const bw = Math.min(46, colW - 16);
  bars.forEach((b, i) => {
    const cx = x0 + (i + 0.5) * colW, hh = (b.value / top) * CH;
    if (!writeFit(tl, b.label, cx, y0 + 22, colW - 4, {}, { id: `l${i}`, size: "s", gap: i ? 120 : 240 })) throw new Error("label_too_wide");
    // round 7 (M2): each bar GROWS up from the axis to its value (its fill sweeps up)
    if (hh >= 2) { tl.add({ id: `b${i}`, op: "rect", at: [cx - bw / 2, y0 - hh], w: bw, h: hh, fill: "accent", ink: "accent", weight: 1 }, 260, { gap: 60 }); tl.add({ op: "sweep", target: `b${i}`, dir: "up" }, 600, { gap: 0 }); }
    tl.add({ id: `v${i}`, op: "text", at: [cx, y0 - hh - 13], text: String(b.value), size: "s" }, 260, { gap: 60 });
  });
  return { facts: { bars: n, scale: `steps of ${step}`, ...Object.fromEntries(bars.map((b, i) => [`bar${i + 1}`, `${b.label} ${b.value}`])) } };
}

/**
 * round 7 (C1 studio-board-richness): a TRUE-SCALE timeline (timeline.js: the kit's own "label (year)" chains). Time runs
 * right along an arrow; each event is a dot at its year's true place, then its year and label, alternately above and below,
 * spread apart so no two labels touch and joined to their dot by a leader line. Events appear in time order.
 */
function timelineBoard(c, tl) {
  const ev = Array.isArray(c.events) ? c.events.filter((e) => isInt(e?.year, 100, 2100) && fitsLabel(e?.label)) : [];
  if (ev.length < 3 || ev.length > 6 || new Set(ev.map((e) => e.year)).size !== ev.length) return { error: "events" };
  ev.sort((a, b) => a.year - b.year);
  const lo = ev[0].year, hi = ev.at(-1).year;
  // one fact per event (a value is ≤ 40 chars): her line names what is on the board, year by year
  const facts = { ...Object.fromEntries(ev.map((e, i) => [`event${i + 1}`, `${e.year} ${e.label}`])), span: `${lo} to ${hi}` };
  // an event is a TICK across the axis (a dot would read as a count to W8: "3 dots" is a number, a year is not)
  const tick = (x, y, across) => tl.add({ op: "line", from: across === "v" ? [x, y - 9] : [x - 9, y], to: across === "v" ? [x, y + 9] : [x + 9, y], weight: 3, ink: "accent" }, 220, { gap: 220 });
  // spread label centres along one axis: inside [a, b], each at least its half-size + 8 from the next (forward, then back)
  const spread = (list, a, b) => {
    list.forEach((q, i) => { q.p = Math.max(q.p, a + q.h / 2, i ? list[i - 1].p + (list[i - 1].h + q.h) / 2 + 8 : -Infinity); });
    for (let i = list.length - 1; i >= 0; i--) { const q = list[i]; q.p = Math.min(q.p, b - q.h / 2, i < list.length - 1 ? list[i + 1].p - (list[i + 1].h + q.h) / 2 - 8 : Infinity); }
    return list.every((q) => q.p - q.h / 2 >= a - 0.5);
  };
  const twoLine = (t, maxW) => { const w = fitWidth(t, maxW); return w && w <= maxW ? w : null; };
  // 1. across: time runs right; labels alternate above and below, each over its year's true place where it fits
  {
    const y = 150, x0 = 44, W = 296, LW = ev.length <= 4 ? 160 : 118;   // the last tick stays clear of the arrowhead (380)
    const xOf = (yr) => x0 + ((yr - lo) / (hi - lo)) * W;
    const sides = [[], []];
    ev.forEach((e, i) => { const w = twoLine(e.label, LW); sides[i % 2].push({ e, p: xOf(e.year), h: w ?? Infinity }); });
    if (sides.every((sd) => sd.every((q) => Number.isFinite(q.h)) && spread(sd, 8, 392))) {
      tl.add({ op: "arrow", from: [24, y], to: [380, y], weight: 2 }, 700);
      const at = new Map(sides.flatMap((sd, k) => sd.map((q) => [q.e.year, { ...q, up: k === 0 }])));
      for (const e of ev) {
        const q = at.get(e.year), tx = xOf(e.year);
        tick(tx, y, "v");
        const yy = q.up ? y - 34 : y + 30, ly = q.up ? y - 78 : y + 78;
        tl.add({ op: "line", from: [tx, q.up ? y - 12 : y + 12], to: [q.p, q.up ? yy + 12 : yy - 22], weight: 1, ink: "soft" }, 220, { gap: 40 });
        tl.add({ op: "text", at: [q.p, yy], text: String(e.year), size: "s", ink: "accent" }, 260, { gap: 20 });
        if (!writeFit(tl, e.label, q.p, ly, LW, {}, { ms: 480, gap: 30, size: "s" })) return { error: "label_too_wide" };   // one size for every label
      }
      return { facts };
    }
  }
  // 2. down: time runs down a true-scale axis; each event's year and label on one row to its right (5-6 events)
  {
    const x = 56, y0 = 30, H = 240, LX = 132, LW = 400 - LX - 10;
    const yOf = (yr) => y0 + ((yr - lo) / (hi - lo)) * H;
    const rows = ev.map((e) => ({ e, p: yOf(e.year), one: textBox(e.label, "s").w <= LW }));
    for (const r of rows) { r.h = r.one ? 18 : 40; if (!r.one && !twoLine(r.e.label, LW)) return { error: "label_too_wide" }; }
    if (!spread(rows, 14, 290)) return { error: "timeline_crowded" };
    tl.add({ op: "arrow", from: [x, 12], to: [x, 292], weight: 2 }, 700);
    for (const r of rows) {
      const ty = yOf(r.e.year);
      tick(x, ty, "h");
      tl.add({ op: "line", from: [x + 12, ty], to: [x + 22, r.p], weight: 1, ink: "soft" }, 200, { gap: 40 });
      tl.add({ op: "text", at: [x + 26, r.p + 5], text: String(r.e.year), size: "s", ink: "accent", align: "start" }, 240, { gap: 20 });
      if (r.one) tl.add({ op: "text", at: [LX, r.p + 5], text: r.e.label, size: "s", align: "start" }, 420, { gap: 30 });
      else {
        const ws = r.e.label.split(/\s+/); let k = 1, best = null;
        for (; k < ws.length; k++) { const a = ws.slice(0, k).join(" "), b = ws.slice(k).join(" "); const w = Math.max(textBox(a, "s").w, textBox(b, "s").w); if (w <= LW && (!best || w < best.w)) best = { a, b, w }; }
        tl.add({ op: "text", at: [LX, r.p - 6], text: best.a, size: "s", align: "start" }, 260, { gap: 30 });
        tl.add({ op: "text", at: [LX, r.p + 16], text: best.b, size: "s", align: "start" }, 260, { gap: 0 });
      }
    }
    return { facts };
  }
}

/**
 * round 7 (C1 studio-board-richness, maps decision dc-r7-maps-no-outline): places at their TRUE latitude/longitude on a
 * labelled 5° grid with a compass, and nothing that could be read as a boundary (no outline, coastline or state shape).
 * Every place must be in the gazetteer (places.js: its coordinates and their source); the name drawn is the call's (the
 * kit's own word). The frame is the places' extent padded and snapped to 5°, one scale both ways (a degree of latitude is
 * as tall as a degree of longitude is wide), then widened in 5° steps to the board's room. The grid is edge ticks and
 * small crosses where grid lines meet, never lines a word would sit on (a cross a name needs the room of is left out).
 * Each name sits beside its pin where that is clear, else further out on a leader line; laid out first, drawn after.
 */
function placesBoard(c, tl) {
  const names = Array.isArray(c.places) ? c.places.filter((n) => fitsLabel(n)) : [];
  const pins = [];
  for (const n of names) { const p = placeNamed(n); if (p && !pins.some((q) => q.id === p.id)) pins.push({ ...p, name: n.trim() }); }
  if (pins.length < 3 || pins.length > 6) return { error: "places" };
  const TROPIC = 23.44, MERIDIAN = 82.5;
  // a named line keeps 3° of frame on each side (its name goes beside it)
  const lats = [...pins.map((p) => p.lat), ...(c.tropic ? [TROPIC - 2, TROPIC + 2] : [])], lons = [...pins.map((p) => p.lon), ...(c.meridian ? [MERIDIAN - 2, MERIDIAN + 2] : [])];
  // the frame: padded 2.5° (a name needs room beside its pin), snapped out to 5°, at least 10° each way; then widened in
  // 5° steps (10° at most, on the side the places are nearer) toward the board's room at that one scale
  const snap = (lo, hi) => { let a = Math.floor((lo - 2.5) / 5) * 5, b = Math.ceil((hi + 2.5) / 5) * 5; while (b - a < 10) { a -= 5; if (b - a < 10) b += 5; } return [a, b]; };
  let [la, lb] = snap(Math.min(...lats), Math.max(...lats)), [oa, ob] = snap(Math.min(...lons), Math.max(...lons));
  const k = Math.min(286 / (ob - oa), 236 / (lb - la));
  const grow = (a, b, lo, hi, room) => { const span = b - a; while ((b - a + 5) * k <= room && b - a + 5 <= span + 10) { if (lo - a <= b - hi) a -= 5; else b += 5; } return [a, b]; };
  [oa, ob] = grow(oa, ob, Math.min(...lons), Math.max(...lons), 286);
  [la, lb] = grow(la, lb, Math.min(...lats), Math.max(...lats), 236);
  // (with the Tropic drawn, the frame sits left so the line's name can go in the margin beside its right end)
  const w = (ob - oa) * k, h = (lb - la) * k, x0 = 54 + (c.tropic ? 0 : (286 - w) / 2), y0 = 18 + (236 - h) / 2;
  const X = (lon) => x0 + (lon - oa) * k, Y = (lat) => y0 + (lb - lat) * k;
  const box = (x, y, bw, bh) => ({ x, y, w: bw, h: bh });
  const hits = (a, b, pad = 3) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
  const inFrame = (b) => b.x > x0 + 2 && b.x + b.w < x0 + w - 2 && b.y > y0 + 2 && b.y + b.h < y0 + h - 2;
  // a segment meets a box (sampled every 2 units: leaders are short)
  const segHits = (a, b, r, pad = 2) => { const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2)); for (let i = 0; i <= n; i++) { const x = a[0] + ((b[0] - a[0]) * i) / n, y = a[1] + ((b[1] - a[1]) * i) / n; if (x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) return true; } return false; };
  // the fixed marks: edge ticks, the named lines, the pins
  const ticks = [], marks = [], segs = [];
  for (let lat = la + 5; lat < lb; lat += 5) { const y = Y(lat); ticks.push([[x0, y], [x0 + 6, y]], [[x0 + w - 6, y], [x0 + w, y]]); marks.push(box(x0, y - 1, 6, 2), box(x0 + w - 6, y - 1, 6, 2)); }
  for (let lon = oa + 5; lon < ob; lon += 5) { const x = X(lon); ticks.push([[x, y0 + h - 6], [x, y0 + h]], [[x, y0], [x, y0 + 6]]); marks.push(box(x - 1, y0 + h - 6, 2, 6), box(x - 1, y0, 2, 6)); }
  const ty = Y(TROPIC), mx = X(MERIDIAN);
  if (c.tropic) { marks.push(box(x0, ty - 1.5, w, 3)); segs.push([[x0, ty], [x0 + w, ty]]); }
  if (c.meridian) { marks.push(box(mx - 1.5, y0, 3, h)); segs.push([[mx, y0], [mx, y0 + h]]); }
  const pinBox = pins.map((p) => box(X(p.lon) - 6, Y(p.lat) - 6, 12, 12));
  marks.push(...pinBox);
  const clear = (b, except) => inFrame(b) && !marks.some((m) => m !== except && hits(b, m)) && !segs.some(([a, z]) => segHits(a, z, b));
  // the named lines' own names, inside the frame
  // (a name too long for the room either side of a crossing line breaks onto two lines: "Tropic of" / "Cancer")
  const lineText = (text, cands) => {
    const fhs = textBox("x", "s").h;
    for (const parts of [[text], text.includes(" ") ? [text.slice(0, text.lastIndexOf(" ")), text.slice(text.lastIndexOf(" ") + 1)] : null].filter(Boolean)) {
      for (const [x, y, align] of cands) {
        const up = y < (c.tropic ? ty : y0 + h / 2);   // stacked away from the line
        const rows = parts.map((t, r) => ({ t, at: [x, up ? y - (parts.length - 1 - r) * fhs : y + r * fhs] }));
        const bs = rows.map((q) => textBox(q.t, "s", q.at, align));
        const margin = x > x0 + w;   // a margin spot: on the board, outside the frame, clear of the compass
        const ok = margin ? bs.every((b) => b.x + b.w <= 396 && b.y >= 2 && b.y + b.h <= 298 && b.y > y0 + 50) : bs.every((b) => clear(b));
        if (ok) { marks.push(...bs); return { rows, align }; }
      }
    }
    return null;
  };
  const tropicAt = c.tropic ? lineText("Tropic of Cancer", [[x0 + w + 6, ty + 5, "start"], [x0 + w - 12, ty - 11, "end"], [x0 + 12, ty - 11, "start"], [x0 + w - 12, ty + 22, "end"], [x0 + 12, ty + 22, "start"], [x0 + w / 2, ty - 11, "middle"], [x0 + w / 2, ty + 22, "middle"], [x0 + w / 4, ty - 11, "start"], [x0 + w / 4, ty + 22, "start"], [x0 + (3 * w) / 4, ty - 11, "end"], [x0 + (3 * w) / 4, ty + 22, "end"]]) : null;
  // a named line whose name fits nowhere is left off (nothing is drawn yet: the board is laid out again without it)
  if (c.tropic && !tropicAt) return placesBoard({ ...c, tropic: false }, tl);
  const meridianAt = c.meridian ? lineText("82.5°E", [[mx + 7, y0 + 32, "start"], [mx - 7, y0 + 32, "end"], [mx + 7, y0 + h - 14, "start"], [mx - 7, y0 + h - 14, "end"], [mx + 7, y0 + h / 2, "start"], [mx - 7, y0 + h / 2, "end"]]) : null;
  if (c.meridian && !meridianAt) return placesBoard({ ...c, meridian: false }, tl);
  // each pin's name: beside it (no leader), else 30 or 52 units out on a leader that crosses nothing
  const placed = [];
  const fh = textBox("x", "s").h;
  pins.forEach((p, i) => {
    const [x, y] = [X(p.lon), Y(p.lat)], tw = textBox(p.name, "s").w;
    const near = [[x + 9 + tw / 2, y], [x - 9 - tw / 2, y], [x, y - 8 - fh / 2], [x, y + 8 + fh / 2]];
    const far = [];
    for (const d of [30, 52]) for (const [ux, uy] of [[1, 0], [-1, 0], [0, -1], [0, 1], [0.7, -0.7], [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]]) far.push([x + ux * (d + tw / 2), y + uy * d]);
    for (const [cx, cy] of [...near, ...far]) {
      const at = [cx, cy + fh * 0.25];                      // a label's `at` is its baseline; its box is centred on cy
      const b = textBox(p.name, "s", at, "middle");
      if (!clear(b, pinBox[i])) continue;
      const lead = Math.hypot(cx - x, cy - y) > 30;
      if (lead) {
        const from = [Math.min(Math.max(x, b.x), b.x + b.w), y < b.y ? b.y - 2 : y > b.y + b.h ? b.y + b.h + 2 : Math.min(Math.max(y, b.y), b.y + b.h)];
        if (marks.some((m) => m !== pinBox[i] && segHits(from, [x, y], m, 1))) continue;
        segs.push([from, [x, y]]);
      }
      marks.push(b);
      placed.push({ p, i, at, lead });
      return;
    }
  });
  if (placed.length < 3) return { error: `places_crowded:${placed.length}of${pins.length}` };
  // the crosses where grid lines meet, except where a name or a leader is
  const crosses = [];
  for (let lat = la + 5; lat < lb; lat += 5) for (let lon = oa + 5; lon < ob; lon += 5) {
    const r = box(X(lon) - 3, Y(lat) - 3, 6, 6);
    if (!marks.some((m) => !pinBox.includes(m) && hits(r, m, 2)) && !segs.some(([a, z]) => segHits(a, z, r))) crosses.push([X(lon), Y(lat)]);
  }
  // draw: frame, ticks, degree labels, crosses, compass, named lines, pins and names
  const latStep = 5 * k < 22 ? 10 : 5, lonStep = 5 * k < 40 ? 10 : 5;
  tl.add({ op: "rect", at: [x0, y0], w, h, weight: 1, ink: "soft" }, 500);
  for (const [a, z] of ticks) tl.add({ op: "line", from: a, to: z, weight: 1, ink: "soft" }, 50, { gap: 0 });
  // the frame's own edges are labelled too (a 10° frame still shows 3 degrees each way: an axis, not a claim); at the
  // bottom-left corner the latitude sits just above the corner and the longitude starts at it, so the two never touch
  for (let lat = la; lat <= lb; lat += 5) if (lat % latStep === 0) tl.add({ op: "text", at: [x0 - 6, Y(lat) + (lat === la ? -2 : 5)], text: `${lat}°N`, size: "s", ink: "soft", align: "end" }, 140, { gap: 10 });
  const lonLabels = []; for (let lon = oa + 5; lon <= ob; lon += 5) if (lon % lonStep === 0) lonLabels.push(lon);
  if (lonLabels.length < 3) lonLabels.unshift(oa);   // the corner only when the axis needs it (it is never crowded then: 5° ≥ 47 units)
  for (const lon of lonLabels) tl.add({ op: "text", at: [lon === oa ? x0 - 2 : X(lon), y0 + h + 17], text: `${lon}°E`, size: "s", ink: "soft", ...(lon === oa ? { align: "start" } : {}) }, 140, { gap: 10 });
  for (const [x, y] of crosses) { tl.add({ op: "line", from: [x - 3, y], to: [x + 3, y], weight: 1, ink: "soft" }, 30, { gap: 0 }); tl.add({ op: "line", from: [x, y - 3], to: [x, y + 3], weight: 1, ink: "soft" }, 30, { gap: 0 }); }
  const cx = Math.min(386, x0 + w + 26);
  tl.add({ op: "arrow", from: [cx, y0 + 44], to: [cx, y0 + 14], weight: 2 }, 300, { gap: 120 });
  tl.add({ op: "text", at: [cx, y0 + 8], text: "N", size: "s" }, 200, { gap: 20 });
  if (c.tropic) {
    tl.add({ id: "tropic", op: "line", from: [x0, ty], to: [x0 + w, ty], weight: 2, ink: "good", dashed: true }, 600, { gap: 200 });
    for (const q of tropicAt.rows) tl.add({ op: "text", at: q.at, text: q.t, size: "s", ink: "good", align: tropicAt.align }, 300, { gap: 30 });
  }
  if (c.meridian) {
    tl.add({ id: "meridian", op: "line", from: [mx, y0], to: [mx, y0 + h], weight: 2, ink: "good", dashed: true }, 600, { gap: 200 });
    for (const q of meridianAt.rows) tl.add({ op: "text", at: q.at, text: q.t, size: "s", ink: "good", align: meridianAt.align }, 300, { gap: 30 });
  }
  tl.pause(200);
  placed.sort((a, b) => a.i - b.i).forEach(({ p, at }, n) => {
    tl.add({ id: `pin${n}`, op: "circle", c: [X(p.lon), Y(p.lat)], r: 4, fill: "accent", ink: "accent" }, 260, { gap: 260 });
    tl.add({ id: `place${n}`, op: "label", at, text: p.name, to: [X(p.lon), Y(p.lat)], ink: "accent" }, 420, { gap: 30 });
  });
  const facts = Object.fromEntries(placed.map(({ p }, n) => [`place${n + 1}`, p.name]));
  const north = placed.reduce((a, b) => (b.p.lat > a.p.lat ? b : a)), south = placed.reduce((a, b) => (b.p.lat < a.p.lat ? b : a));
  return { facts: { ...facts, northmost: north.p.name, southmost: south.p.name, ...(c.tropic ? { line: "Tropic of Cancer" } : {}) } };
}

/**
 * round 7 (C1 M3, the zoom): a decimal LOCATED by zooming into the one unit it lies in, as a textbook draws it. The number
 * line a..a+2 is drawn; the unit [a, a+1] that holds the value lights up; a copy of that unit lifts off and STRETCHES into
 * the full-width line below (a scale about its left end, then a slide down: the zoom), joined to the unit by two guide
 * lines; the stretched unit gets its ten tenths, and the value is marked on it. Every label is a normal size: the zoom is
 * in the drawing, never in the text. The stretched unit ends exactly on the lower line (a claim expand() checks).
 */
/**
 * round 7 (Learning, staged c4-c5 large numbers: "4815 lies between 4000 and 5000", rounding): a number line on a big
 * scale. `from` 0-99999 to `to` (≤ 100000), ticks every `step` (2-10 intervals; fewer when the labels are long, so they
 * never touch), `marks` [{ value, label? }] (1-3): a tall tick at the value with its label — the value itself by default,
 * "?" for the asked one, or a short word ("Ram ka ghar"). counts: lines [{ gaps, ticks, innerTicks }], marks [{ at, label }].
 */
function numberLineScale(c, tl) {
  const { from, to, step } = c;
  if (!isInt(from, 0, 99999) || !isInt(to, 1, 100000) || to <= from || !isInt(step, 1, 100000) || (to - from) % step) return { error: "scale_range" };
  const N = (to - from) / step, digits = String(to).length;
  if (N < 2 || N > 10) return { error: "scale_ticks" };
  const marks = Array.isArray(c.marks) ? c.marks : [];
  if (marks.length > 3 || marks.some((m) => !isInt(m?.value, from, to) || (m.label !== undefined && m.label !== "?" && (!fitsLabel(String(m.label)) || textProblem(String(m.label)))))) return { error: "scale_marks" };
  const x0 = 30, W = 340, y = 180;
  const X = (u) => round1(x0 + 12 + ((u - from) / (to - from)) * (W - 24));
  // (App's render check, 2026-11-07: tick labels draw at 19.2 units, 11.5 a digit — "100200300…" at 0-1000 step 100, and
  // "80000100000" — so a label needs digits × 11.5 + 6 of its own; when a step is narrower, every k-th tick is labelled, both
  // ends always, and an inner label too close to the end gives way to it)
  const px = (W - 24) / N, need = (k) => [String(from + k * step).length, digits].reduce((a, b) => Math.max(a, b)) * 0.6 * 19.2 + 6;
  // (k divides N when it can, so the labelled ticks stay evenly spaced: 0, 5000, 10000 — never 0, 3000, 6000, 10000)
  const k0 = Math.max(1, Math.ceil(need(N) / px)), every = Array.from({ length: N - k0 + 1 }, (_, j) => k0 + j).find((k) => N % k === 0) ?? N;
  const shown = Array.from({ length: N + 1 }, (_, i) => i === 0 || i === N || (i % every === 0 && (N - i) * px >= need(N)));
  tl.add({ id: "line", op: "numwork", at: [x0, y], layout: "number_line", rows: [Array.from({ length: N + 1 }, (_, i) => (shown[i] ? String(from + i * step) : ""))], range: [from, to], w: W, weight: 2 }, 1200);
  // (paced for her explanation, as the fraction line: each step of the scale marked in turn, then the values — W6)
  for (let i = 1; i < N; i++) tl.add({ op: "line", from: [X(from + i * step), y - 7], to: [X(from + i * step), y + 7], weight: 1 }, 320, { gap: 160 });
  // (labels above in up to two rows: a label moves up when it would touch its left neighbour)
  const rows = [y - 46, y - 74, y - 102], right = [-Infinity, -Infinity, -Infinity], pts = [];
  for (const m of [...marks].sort((a, b) => a.value - b.value)) {
    const label = m.label === undefined ? String(m.value) : String(m.label), x = X(m.value), half = textBox(label, "s").w / 2;
    const r = right.findIndex((e) => x - half >= e + 6);
    if (r < 0) return { error: "scale_marks_crowded" };
    right[r] = x + half;
    const lx = Math.min(BOARD.w - 4 - half, Math.max(4 + half, x));
    tl.add({ op: "line", from: [x, y - 14], to: [x, y + 14], weight: 3, ink: "mark" }, 500, { gap: 700 });
    tl.add({ op: "line", from: [x, y - 12], to: [x, rows[r] + 6], weight: 1, ink: "soft" }, 300, { gap: 120 });
    tl.add({ op: "text", at: [round1(lx), rows[r]], text: label, size: "s", ink: label === "?" ? "mark" : "accent" }, 500, { gap: 120 });
    pts.push({ at: String(m.value), label });
  }
  return { counts: { lines: [{ gaps: N, ticks: N + 1, innerTicks: N - 1 }], ...(pts.length ? { marks: pts } : {}), labels: shown.filter(Boolean).length },
    facts: { line: `${from} to ${to}`, step: `every ${step}`, ...(pts.length ? { marks: pts.map((q) => (q.label === "?" ? "?" : q.label)).join(", ").slice(0, 40) } : {}) } };
}

function numberLineZoom(c, tl) {
  const v = Number(c.value);
  if (!(v > 0 && v < 10) || Math.abs(Math.round(v * 100) - v * 100) > 1e-6 || Number.isInteger(v)) return { error: "zoom_value" };
  // (4 labels on the top line and 6 on the lower one: evenly spaced, so both read as axes, not as answers — W9)
  const a = Math.floor(v), lo = a, hi = a + 3;
  const fmt = (x) => String(+x.toFixed(2));
  const y1 = 80, y2 = 212, x0 = 30, W = 340;
  const X1 = (u) => x0 + 12 + ((u - lo) / (hi - lo)) * (W - 24), X2 = (u) => x0 + 12 + (u - a) * (W - 24);
  tl.add({ id: "top", op: "numwork", at: [x0, y1], layout: "number_line", rows: [[fmt(lo), fmt(lo + 1), fmt(lo + 2), fmt(hi)]], range: [lo, hi], w: W, weight: 2 }, 900);
  tl.add({ id: "unit", op: "line", from: [X1(a), y1], to: [X1(a + 1), y1], weight: 3, ink: "accent" }, 450, { gap: 200 });
  // the zoom: the unit's copy stretches to the full width about its left end, then slides down onto the lower line
  const k = round1((X2(a + 1) - X2(a)) / (X1(a + 1) - X1(a)) * 100) / 100;
  tl.add({ id: "z", op: "line", from: [X1(a), y1], to: [X1(a + 1), y1], weight: 3, ink: "accent" }, 200, { gap: 120 });
  // (it lifts off the line first, so the stretch happens in clear space, never along the line it came from)
  const mid = Math.round((y2 - y1) / 2);
  tl.add({ op: "move", target: "z", by: [0, mid] }, 600, { gap: 120 });
  tl.add({ op: "scale", target: "z", k: [k, 1], about: [X1(a), y1 + mid] }, 1100, { gap: 80 });
  tl.add({ op: "move", target: "z", by: [round1(X2(a) - X1(a)), y2 - y1 - mid] }, 700, { gap: 60 });
  // (the guides start below the top line's labels, never through them)
  tl.add({ op: "line", from: [X1(a), y1 + 34], to: [X2(a), y2 - 8], weight: 1, ink: "soft", dashed: true }, 300, { gap: 60 });
  tl.add({ op: "line", from: [X1(a + 1), y1 + 34], to: [X2(a + 1), y2 - 8], weight: 1, ink: "soft", dashed: true }, 300, { gap: 40 });
  // the zoomed unit: its ten tenths, its ends and the value
  tl.add({ id: "bottom", op: "numwork", at: [x0, y2], layout: "number_line", rows: [[0, 2, 4, 6, 8, 10].map((t) => fmt(a + t / 10))], range: [a, a + 1], w: W, weight: 2 }, 700, { gap: 120 });
  for (let i = 1; i < 10; i++) tl.add({ op: "line", from: [X2(a + i / 10), y2 - 5], to: [X2(a + i / 10), y2 + 5], weight: 1 }, 60, { gap: 10 });
  tl.add({ id: "val", op: "circle", c: [round1(X2(v)), y2], r: 6, fill: "mark", ink: "mark" }, 300, { gap: 200 });
  tl.add({ id: "valT", op: "text", at: [round1(X2(v)), y2 - 22], text: fmt(v), size: "m", ink: "mark" }, 300, { gap: 40 });
  const claims = [{ id: "z", from: [X2(a), y2], to: [round1(X1(a) + (X1(a + 1) - X1(a)) * k + (X2(a) - X1(a))), y2] }];
  return { claims, facts: { value: fmt(v), between: `${fmt(a)} and ${fmt(a + 1)}`, tenths: "the unit split into 10 tenths" } };
}

/**
 * round 7 (C1 studio-board-richness): a table (table.js: every cell computed). 2-4 columns, 1-10 rows; the rule it comes
 * from on top, the header in accent, then the rows one by one so the pattern is seen growing.
 */
function tableBoard(c, tl) {
  const head = Array.isArray(c.head) ? c.head.map(String) : [];
  const rows = Array.isArray(c.rows) ? c.rows.map((r) => (Array.isArray(r) ? r.map(String) : [])) : [];
  const cols = head.length;
  if (cols < 2 || cols > 4 || rows.length < 1 || rows.length > 10 || rows.some((r) => r.length !== cols)) return { error: "table_shape" };
  if ([...head, ...rows.flat()].some((t) => !t || [...t].length > 10 || textProblem(t))) return { error: "table_cell" };
  const rule = typeof c.rule === "string" && fitsLabel(c.rule) ? c.rule : null;
  const top = rule ? 52 : 22, rh = Math.min(34, (286 - top) / (rows.length + 1)), cw = Math.min(110, 340 / cols);
  const x0 = 200 - (cw * cols) / 2, w = cw * cols, h = rh * (rows.length + 1);
  const size = rh >= 28 ? "m" : "s";
  if ([...head, ...rows.flat()].some((t) => textBox(t, size).w > cw - 10)) return { error: "table_cell_wide" };
  if (rule) tl.add({ op: "text", at: [200, 30], text: rule, size: "m", ink: "accent" }, 500);
  tl.add({ op: "rect", at: [x0, top], w, h, weight: 2 }, 600, { gap: 120 });
  for (let j = 1; j < cols; j++) tl.add({ op: "line", from: [x0 + j * cw, top], to: [x0 + j * cw, top + h], weight: 1 }, 220, { gap: 40 });
  tl.add({ op: "line", from: [x0, top + rh], to: [x0 + w, top + rh], weight: 2 }, 260, { gap: 40 });
  const cy = (i) => top + rh * i + rh / 2 + (size === "m" ? 7 : 5);
  head.forEach((t, j) => tl.add({ op: "text", at: [x0 + cw * (j + 0.5), cy(0)], text: t, size, ink: "accent" }, 260, { gap: j ? 20 : 120 }));
  rows.forEach((r, i) => r.forEach((t, j) => tl.add({ op: "text", at: [x0 + cw * (j + 0.5), cy(i + 1)], text: t, size }, 200, { gap: j ? 20 : 160 })));
  return { facts: { ...(rule ? { rule } : {}), ...Object.fromEntries(rows.slice(0, 10).map((r, i) => [`row${i + 1}`, r.join(" | ")])) } };
}

/**
 * round 7 (C1 studio-board-richness, geometry by constraint): a shape TO SCALE from the measures the kit states
 * (geometry.js). A rectangle / square with its two dimensions on its sides, a triangle built from its three sides (the
 * triangle inequality checked; each side's length outside its midpoint), a circle with a drawn radius "r = 5 cm".
 */
// round 7 (M2, main via Brain's S4 harness: a c6 perimeter child asked for a picture and got none): the shape's NAME in the
// kit's word over its top-left corner, and "perimeter" over its top-right when the board traces it, so a request that names
// the thing ("rectangle ki picture", "perimeter dikhao") is answered. → the facts it adds.
function nameShape(tl, c, word, b) {
  if (!c.name) return {};
  const y = Math.max(20, b.y - 16);
  tl.add({ op: "text", at: [b.x, y], text: word, size: "s", ink: "soft", align: "start" }, 300, { gap: 120 });
  const per = c.lang === "hi" ? "parimap" : "perimeter";
  if (c.trace && textBox(word, "s").w + textBox(per, "s").w + 16 <= b.w) {
    tl.add({ op: "text", at: [b.x + b.w, y], text: per, size: "s", ink: "mark", align: "end" }, 300, { gap: 60 });
    return { name: word, shows: "perimeter" };
  }
  return { name: word };
}
// the perimeter IS the walk round the boundary: a marker runs every side in turn, back to where it began (each side one
// follow, so a line naming the sides one by one lands on each) → the claim that it ends where it started
function traceBoundary(tl, corners) {
  const [s0] = corners;
  const id = tl.add({ op: "circle", c: [round1(s0[0]), round1(s0[1])], r: 6, fill: "mark", ink: "mark", weight: 1 }, 200, { gap: 260 });
  let at = [round1(s0[0]), round1(s0[1])];
  for (const q of [...corners.slice(1), s0]) {
    const d = [round1(q[0] - at[0]), round1(q[1] - at[1])];
    tl.add({ op: "follow", target: id, path: [d] }, 650, { gap: 40 });
    at = [at[0] + d[0], at[1] + d[1]];
  }
  return [{ id, c: [round1(at[0]), round1(at[1])] }];
}

/** Does a right-angled walk (R D L U per side) with these lengths come back to where it started? */
function closes(sides, walk) {
  let x = 0, y = 0;
  for (let i = 0; i < sides.length; i++) { const d = sides[i], w = walk[i]; if (w === "R") x += d; else if (w === "L") x -= d; else if (w === "D") y += d; else if (w === "U") y -= d; else return false; }
  return Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9;
}
function measuredBoard(c, tl) {
  const unit = c.unit === "m" ? "m" : c.unit === "cm" ? "cm" : null;
  if (!unit) return { error: "unit" };
  const num = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10));
  const fmt = (v) => `${num(v)} ${unit}`;
  const BW = 280, BH = 190, cx = 200, cy = 150;          // the drawing's box on the board (labels outside it)
  if (c.shape === "rect" || c.shape === "square") {
    const w = Number(c.w), h = Number(c.h);
    if (!(w > 0 && h > 0) || w / h > 8 || h / w > 8) return { error: "rect_measures" };
    // the side label needs its own width to the right of the shape: the shape is scaled into what is left
    const sideW = textBox(fmt(h), "m").w + 14;
    const k = Math.min((360 - sideW) / w, BH / h);
    const W = w * k, H = h * k, x = (400 - (W + sideW)) / 2, y = cy - H / 2;
    tl.add({ id: "shape", op: "rect", at: [x, y], w: W, h: H, weight: 2 }, 900);
    const named = nameShape(tl, c, c.shape === "square" ? "square" : "rectangle", { x, y, w: W, h: H });
    tl.add({ op: "text", at: [x + W / 2, y + H + 26], text: fmt(w), size: "m", ink: "accent" }, 400, { gap: 160 });
    tl.add({ op: "text", at: [x + W + 12, y + H / 2 + 7], text: fmt(h), size: "m", ink: "accent", align: "start" }, 400, { gap: 120 });
    const claims = c.trace ? traceBoundary(tl, [[x, y], [x + W, y], [x + W, y + H], [x, y + H]]) : [];
    return { claims, counts: { sides: 4, corners: 4, sideValues: [fmt(w), fmt(h), fmt(w), fmt(h)] }, facts: { shape: c.shape === "square" ? "square" : "rectangle", [c.shape === "square" ? "side" : "length"]: fmt(w), ...(c.shape === "square" ? {} : { breadth: fmt(h) }), ...named } };
  }
  if (c.shape === "triangle") {
    const [a, b, d] = Array.isArray(c.sides) ? c.sides.map(Number) : [];
    if (![a, b, d].every((v) => v > 0) || a + b <= d || a + d <= b || b + d <= a) return { error: "not_a_triangle" };
    // base = the longest side, the apex from the other two (law of cosines)
    const [base, s1, s2] = [a, b, d].sort((p, q) => q - p);
    const px = (base * base + s1 * s1 - s2 * s2) / (2 * base), py = Math.sqrt(Math.max(0, s1 * s1 - px * px));
    const k = Math.min(BW / base, BH / py);
    const ox = cx - (base * k) / 2, oy = cy + (py * k) / 2;
    const A = [ox, oy], B = [ox + base * k, oy], C = [ox + px * k, oy - py * k];
    tl.add({ id: "shape", op: "polygon", points: [A, B, C], weight: 2 }, 1000);
    const g = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    const label = (P, Q, len) => {
      const m = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
      const dx = m[0] - g[0], dy = m[1] - g[1], n = Math.hypot(dx, dy) || 1;
      tl.add({ op: "text", at: [m[0] + (dx / n) * 38, m[1] + (dy / n) * 38 + 7], text: fmt(len), size: "m", ink: "accent" }, 380, { gap: 140 });
    };
    label(A, B, base); label(A, C, s1); label(B, C, s2);
    const named = nameShape(tl, c, "triangle", { x: ox, y: C[1], w: base * k, h: oy - C[1] });
    const claims = c.trace ? traceBoundary(tl, [A, C, B]) : [];
    return { claims, counts: { sides: 3, corners: 3, sideValues: [base, s1, s2].map(fmt) }, facts: { shape: "triangle", sides: [base, s1, s2].map(num).join(", ") + ` ${unit}`, ...named } };
  }
  // round 7 (main, director4 S2: the c6 pentagon showed no side lengths): a polygon with its side LENGTHS written along
  // its sides (drawn regular: a shape with these lengths has no single drawing, so it is labelled, not to scale), corner
  // names outside its corners, and the perimeter walk. sides: 3-8 lengths; names (optional) one per corner.
  const POLY = { pentagon: 5, hexagon: 6, octagon: 8, quadrilateral: 4, polygon: 0 };
  if (c.shape in POLY) {
    const sides = Array.isArray(c.sides) ? c.sides.map(Number) : [];
    const n = POLY[c.shape] || sides.length;
    if (n < 3 || n > 8 || sides.length !== n || !sides.every((v) => v > 0)) return { error: "polygon_sides" };
    const names = Array.isArray(c.names) ? c.names.map(String) : [];
    if (names.length && (names.length !== n || names.some((x) => !fitsLabel(x) || [...x].length > 3))) return { error: "polygon_names" };
    // director9 (c6 "L-shape kamra", 8 contradictions: drawn as a regular hexagon): a right-angled outline is drawn TO SCALE.
    // `walk` names each side's direction (R D L U, clockwise from the top-left corner); a 6-sided shape whose sides close as
    // an L (R D L D L U: 8, 3, 5, 4, 3, 7) is one without being told. A walk that does not close is refused.
    const walk = typeof c.walk === "string" ? c.walk.toUpperCase() : n === 6 && closes(sides, "RDLDLU") ? "RDLDLU" : null;
    if (walk !== null) {
      if (walk.length !== n || !/^[RDLU]+$/.test(walk) || !closes(sides, walk)) return { error: "polygon_walk" };
      const V = [[0, 0]];
      for (let i = 0; i < n - 1; i++) { const [x, y] = V[i], d = sides[i]; V.push(walk[i] === "R" ? [x + d, y] : walk[i] === "L" ? [x - d, y] : walk[i] === "D" ? [x, y + d] : [x, y - d]); }
      const xs = V.map((v) => v[0]), ys = V.map((v) => v[1]), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
      const k = Math.min((BW - 40) / w, (BH - 20) / h), ox = cx - (w * k) / 2 - Math.min(...xs) * k, oy = cy - (h * k) / 2 - Math.min(...ys) * k;
      const P = V.map(([x, y]) => [round1(ox + x * k), round1(oy + y * k)]);
      tl.add({ id: "shape", op: "polygon", points: P, weight: 2 }, 1000);
      const boxes = [];
      const boxOf = (t, at) => { const b = textBox(t, "s"); return { x0: at[0] - b.w / 2 - 2, x1: at[0] + b.w / 2 + 2, y0: at[1] - b.h, y1: at[1] + 3 }; };
      const hits = (q) => boxes.some((b) => q.x0 < b.x1 && b.x0 < q.x1 && q.y0 < b.y1 && b.y0 < q.y1);
      // the outward normal of side i (a clockwise walk's outside is to its left)
      const normal = (i) => { const A = P[i], B = P[(i + 1) % n]; return [Math.sign(B[1] - A[1]), -Math.sign(B[0] - A[0])]; };
      for (let i = 0; i < n; i++) {
        const A = P[i], B = P[(i + 1) % n], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        const [nx, ny] = normal(i), t = fmt(sides[i]), half = textBox(t, "s").w / 2;
        const at = [round1(m[0] + nx * (half + 10)), round1(m[1] + ny * 16 + 5)];
        boxes.push(boxOf(t, at));
        tl.add({ op: "text", at, text: t, size: "s", ink: "accent" }, 320, { gap: 120 });
      }
      // a corner's name on its outward diagonal (the sum of its two sides' outward normals: into the notch at the inner
      // corner), pushed out
      // until it is clear of every side's length
      names.forEach((nm, i) => {
        const [x, y] = P[i], a = normal((i + n - 1) % n), b = normal(i);
        let d = [a[0] + b[0], a[1] + b[1]];
        if (!d[0] && !d[1]) d = a;
        let at = null;
        for (const r of [12, 20, 28, 36]) { const q = [round1(x + d[0] * r), round1(y + d[1] * r + 5)]; if (!hits(boxOf(nm, q))) { at = q; break; } }
        if (!at) return;
        boxes.push(boxOf(nm, at));
        tl.add({ op: "text", at, text: nm, size: "s", ink: "soft" }, 200, { gap: 40 });
      });
      const claims = c.trace ? traceBoundary(tl, P) : [];
      return { claims, counts: { sides: n, corners: n, sideValues: sides.map(fmt) },
        facts: { shape: `${n}-sided shape`, outline: walk === "RDLDLU" ? "L-shape, right angles" : "right angles", sides: sides.map(num).join(", ") + ` ${unit}`, ...(names.length ? { corners: names.join(" ") } : {}) } };
    }
    const P = Array.from({ length: n }, (_, i) => { const a = ((-90 + 180 / n + (360 * i) / n) * Math.PI) / 180; return [round1(cx + 92 * Math.cos(a)), round1(cy + 4 + 92 * Math.sin(a))]; });
    tl.add({ id: "shape", op: "polygon", points: P, weight: 2 }, 1000);
    for (let i = 0; i < n; i++) {
      const A = P[i], B = P[(i + 1) % n], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      const dx = m[0] - cx, dy = m[1] - cy - 4, d = Math.hypot(dx, dy) || 1;
      tl.add({ op: "text", at: [round1(m[0] + (dx / d) * 30), round1(m[1] + (dy / d) * 30 + 6)], text: fmt(sides[i]), size: "s", ink: "accent" }, 320, { gap: 120 });
    }
    names.forEach((nm, i) => { const [x, y] = P[i], dx = x - cx, dy = y - cy - 4, d = Math.hypot(dx, dy) || 1;
      tl.add({ op: "text", at: [round1(x + (dx / d) * 16), round1(y + (dy / d) * 16 + 6)], text: nm, size: "s", ink: "soft" }, 200, { gap: 40 }); });
    const claims = c.trace ? traceBoundary(tl, P) : [];
    return { claims, counts: { sides: n, corners: n, sideValues: sides.map(fmt) }, facts: { shape: c.shape === "polygon" ? `${n}-sided shape` : c.shape, sides: sides.map(num).join(", ") + ` ${unit}`, ...(names.length ? { corners: names.join(" ") } : {}) } };
  }
  if (c.shape === "circle") {
    const r = Number(c.r);
    if (!(r > 0)) return { error: "radius" };
    const R = 84;
    tl.add({ id: "shape", op: "circle", c: [cx, cy], r: R, weight: 2 }, 900);
    tl.add({ op: "circle", c: [cx, cy], r: 3, fill: "accent", ink: "accent" }, 200, { gap: 120 });
    tl.add({ op: "arrow", from: [cx, cy], to: [cx + R, cy], weight: 2, ink: "accent" }, 500, { gap: 120 });   // an arrow: a radius, not a cut (W8)
    // the label below the circle: text keeps its readable size while the drawing scales, so inside it can meet the rim
    tl.add({ op: "text", at: [cx, cy + R + 30], text: `r = ${fmt(r)}`, size: "m", ink: "accent" }, 420, { gap: 80 });
    return { counts: { sides: 0, radius: fmt(r) }, facts: { shape: "circle", radius: fmt(r) } };
  }
  return { error: "shape" };
}

const BUILD = {
  "fraction-parts@1": fractionParts, "fraction-bars@1": fractionBars, "wholes@1": wholes, "unrolled@1": unrolled, "lines@1": lines, "fraction-line@1": fractionLine, "fraction-of@1": fractionOf, "combine-count@1": combineCount, "number-line-hop@1": numberLineHop, "number-line-scale@1": numberLineScale, "column-op@1": columnOp,
  "place-value@1": placeValue, "equal-groups@1": equalGroups, "flow@1": flow, "cycle@1": cycle, "compare@1": compare, "parts@1": parts, "label@1": label,
  "angle@1": angle, "shape@1": shape, "symmetry@1": symmetry, "area-grid@1": areaGrid, "bar-chart@1": barChart, "timeline@1": timelineBoard, "table@1": tableBoard, "measured@1": measuredBoard, "places@1": placesBoard, "number-line-zoom@1": numberLineZoom,
  // code-only (the claims board): not offered to any model, so not in TEMPLATES
  "shade-grid@1": shadeGrid,
};

/**
 * A template call → a validated, linted WhiteboardScript.
 * @param {{ template: string, [k: string]: unknown }} call
 * @param {{ band?: string, lessonId?: string, scriptId?: string }} [opts]
 * @returns {{ ok: boolean, script: any, facts: any, errors: string[] }}
 */
/** The claims a settled board breaks (ids). Exported for tests as _claimsBroken. */
export function _claimsBroken(script, claims) { return claimsBroken(script, claims); }
function claimsBroken(script, claims) {
  if (!claims.length) return [];
  const end = new Map(settledScript(script).ops.map((o) => [o.id, o]));
  const same = (p, q) => Array.isArray(p) && Array.isArray(q) && Math.abs(p[0] - q[0]) <= 1 && Math.abs(p[1] - q[1]) <= 1;
  return claims.filter((cl) => {
    const o = end.get(cl.id);
    if (!o) return true;
    for (const k of ["at", "c", "from", "to"]) if (cl[k] && !same(o[k], cl[k])) return true;
    if (cl.points && (!Array.isArray(o.points) || o.points.length !== cl.points.length || o.points.some((q, i) => !same(q, cl.points[i])))) return true;
    return false;
  }).map((cl) => cl.id);
}

/**
 * round 7 (main, director6 #2: "every template emits screen.counts"): the counts of a template that does not count its own
 * drawing, from its call and its facts row — word boards included: a compare board's columns (title, how many items, and
 * the quantities its items state: "2 tukde" → { n: 2, what: "tukde" }), a flow's or cycle's steps, a timeline's events, a
 * table's rows and columns, a chart's bars and values, labels, places, hops, digits. → counts, or null.
 */
function derivedCounts(call, facts = {}) {
  // (director8 bridge rows: "8 ka 1/2 = 4" → { n: 4, what: "8 ka 1/2" }; "= 4 laddoo" → { n: 4, what: "laddoo" })
  const qty = (t) => {
    const x = String(t ?? "").trim();
    const m = x.match(/^(\d+)\s+(\p{L}[\p{L} ]{0,20}?)(?=\s*(?:[=,(]|$))/u);
    if (m) return { n: Number(m[1]), what: m[2].trim() };
    const e = x.match(/^(.{0,20}?)\s*=\s*(\d+)\s*(\p{L}[\p{L} ]{0,20})?$/u);
    return e && (e[3] || e[1]) ? { n: Number(e[2]), what: (e[3] || e[1]).trim().slice(0, 24) } : null;
  };
  const col = (side) => side && typeof side === "object" ? { title: String(side.title ?? "").slice(0, 24), items: (side.items ?? []).length,
    quantities: (side.items ?? []).map(qty).filter(Boolean) } : null;
  switch (call.template) {
    case "compare@1": { const cols = [col(call.left), col(call.right)].filter(Boolean); return cols.length ? { columns: cols } : null; }
    case "flow@1": return Number.isInteger(facts.steps) ? { steps: facts.steps } : null;
    case "cycle@1": return Number.isInteger(facts.stages) ? { steps: facts.stages } : null;
    case "timeline@1": return Array.isArray(call.events) ? { events: call.events.length } : null;
    case "table@1": return Array.isArray(call.rows) ? { rows: call.rows.length, cols: (call.head ?? call.rows[0] ?? []).length } : null;
    case "parts@1": return Number.isInteger(facts.parts) ? { parts: facts.parts } : null;
    case "label@1": return Number.isInteger(facts.labels) ? { labels: facts.labels } : null;
    case "bar-chart@1": return Array.isArray(call.bars) ? { bars: call.bars.length, values: call.bars.map((b) => `${b.label} ${b.value}`) } : null;
    case "places@1": return Array.isArray(call.places) ? { places: call.places.length } : null;
    case "angle@1": return Array.isArray(call.angles) ? { angles: call.angles.map((a) => a?.deg).filter(Number.isFinite) } : null;
    case "number-line-hop@1": return Array.isArray(call.hops) ? { hops: call.hops.length } : null;
    case "number-line-zoom@1": return { lines: [{ gaps: 10, ticks: 11, innerTicks: 9 }] };
    case "combine-count@1": return Number.isInteger(call.a) && Number.isInteger(call.b) ? { amounts: [call.a, call.b] } : null;
    case "fraction-of@1": return Number.isInteger(call.b) && Number.isInteger(call.d) ? { rows: call.b, cols: call.d, parts: call.b * call.d } : null;
    case "column-op@1": return { rows: 2 };
    case "place-value@1": return Number.isInteger(facts.digits) ? { digits: facts.digits } : null;
    case "symmetry@1": return { halves: 2 };
    default: return null;
  }
}

export function expand(call0, { band = "B3", lessonId = "", scriptId, lang = null } = {}) {
  // (director11 S3: the lesson's language — the whiteboard intent's style.lang, "hi" in Hindi mode — for the words a template writes)
  const call = lang && call0 && call0.lang == null ? { ...call0, lang } : call0;
  const build = BUILD[call?.template];
  if (!build) return { ok: false, script: null, facts: null, errors: [`unknown_template:${call?.template}`] };
  const tl = timeline(PACE[band] ?? 1);
  let r;
  try { r = build(call, tl); } catch (e) { return { ok: false, script: null, facts: null, errors: [`build:${String(e?.message ?? e).slice(0, 60)}`] }; }
  if (r.error) return { ok: false, script: null, facts: null, errors: [r.error] };
  const counts = r.counts ?? derivedCounts(call, r.facts);
  const facts = { kind: KIND_OF[call.template] ?? "animation", archetype: call.template, onScreen: r.facts, ...(counts ? { counts } : {}) };
  const raw = script(call, tl.ops, tl.t, facts, { lessonId, scriptId, ground: r.ground ?? "chalk" });
  const n = normalizeScript(raw, { strict: true });
  if (!n.ok) return { ok: false, script: null, facts: null, errors: n.errors.slice(0, 6) };
  // round 7 (M2, "the motion's end is the explained state"): every motion a template adds claims where its op ENDS — the
  // place the still board drew it (the turned arm at the angle, the carried 1 over its column, the shared-out dot in its
  // group). The settled board must agree with every claim, or the template fails (the ladder steps down).
  const bad = claimsBroken(n.script, r.claims ?? []);
  if (bad.length) return { ok: false, script: null, facts: null, errors: bad.slice(0, 6).map((id) => `motion_claim:${id}`) };
  const lint = lintScript(n.script);
  if (lint.length) return { ok: false, script: null, facts: null, errors: lint.slice(0, 6).map((i) => `${i.check}:${i.id}`) };
  return { ok: true, script: n.script, facts: n.script.facts, errors: [] };
}
