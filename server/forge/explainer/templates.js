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
import { normalizeScript, lintScript, textBox, textProblem } from "../../../shared/whiteboard.js";

export const BOARD = { w: 400, h: 300 };
export const TEMPLATES = ["fraction-parts@1", "fraction-of@1", "combine-count@1", "number-line-hop@1", "column-op@1", "place-value@1", "equal-groups@1",
  "flow@1", "cycle@1", "compare@1", "parts@1", "label@1", "angle@1", "shape@1", "symmetry@1", "area-grid@1", "bar-chart@1"];
/** The StudioFacts kind each template is (what the Brain reads as "what is on screen"). */
export const KIND_OF = { "flow@1": "diagram", "cycle@1": "diagram", "compare@1": "diagram", "parts@1": "diagram", "label@1": "diagram",
  "angle@1": "diagram", "shape@1": "diagram", "symmetry@1": "diagram", "bar-chart@1": "diagram" };
export const SKETCHES = ["plant", "flower", "leaf", "insect"];

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
    tl.add({ op: "text", at: [200, 175], text: `${parts} equal parts`, size: "s", ink: "soft" }, 500);
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
  tl.add({ id: "frac", op: "numwork", at: [fx - 14, fy], layout: "fraction", rows: [[String(shade)], [String(parts)]], ink: "accent", weight: 2 }, 800, { gap: 300 });
  if (shade > 0) tl.add({ op: "highlight", target: "frac", style: "circle", ink: "mark" }, 600, { gap: 300 });
  return { facts };
}

/**
 * round 4 content: the rectangle her line describes as a grid ("5 columns aur 3 rows", "15 equal parts, unmein 6
 * marked"): rows x cols equal cells, the first `shade` filled, row by row. The column and row counts are written (her
 * own givens); the cell total and the fraction only when her line does not ask for them. Measured: 4 board slots on a
 * local production run (2026-10-10) failed while she pointed at such a rectangle, because no template drew it.
 */
function shadeGrid(c, tl) {
  const { rows, cols } = c;
  const shade = c.shade ?? 0;
  if (!isInt(rows, 1, 6) || !isInt(cols, 1, 10) || rows * cols < 2 || !isInt(shade, 0, rows * cols)) return { error: "grid_range" };
  const cell = Math.min(300 / cols, 170 / rows, 56);
  const W = cols * cell, H = rows * cell, x0 = 200 - W / 2, y0 = 52 + (170 - H) / 2;
  tl.add({ id: "whole", op: "rect", at: [x0, y0], w: W, h: H, weight: 2 }, 800);
  let k = 0;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const on = k++ < shade;
    tl.add({ id: `g${r}_${q}`, op: "rect", at: [x0 + q * cell + 2, y0 + r * cell + 2], w: cell - 4, h: cell - 4, weight: 1,
      ...(on ? { fill: "accent", ink: "accent" } : { ink: "soft" }) }, on ? 200 : 90, { gap: on ? 60 : 20 });
  }
  // the labels only when her line named the columns and rows (a grid laid out for "15 equal parts" invents neither)
  if (c.labels !== false && cols > 1) tl.add({ op: "text", at: [200, y0 - 16], text: `${cols} columns`, size: "s", ink: "soft" }, 400, { gap: 200 });
  if (c.labels !== false && rows > 1) tl.add({ op: "text", at: [200, y0 + H + 18], text: `${rows} rows`, size: "s", ink: "soft" }, 400, { gap: 120 });
  const total = rows * cols;
  if (!c.hideResult && shade > 0) tl.add({ id: "frac", op: "numwork", at: [186, y0 + H + 40], layout: "fraction", rows: [[String(shade)], [String(total)]], ink: "accent", weight: 2 }, 700, { gap: 300 });
  return { facts: { rows, cols, cells: c.hideResult ? "? (child works it out)" : total, shaded: shade } };
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
  for (let i = 0; i < cn; i++) tl.add({ id: `c${i}`, op: "rect", at: [x0 + i * cw + 3, y0 + 3], w: cw - 6, h: H - 6, fill: "soft", ink: "accent", weight: 1 }, 320, { gap: 100 });
  tl.add({ id: "inner", op: "text", at: [x0 + (cn * cw) / 2, y0 - 16], text: `${cn}/${d}`, size: "m", ink: "accent" }, 380, { gap: 160 });
  // step 2: the outer fraction a/b of that part, row by row inside the shaded columns
  tl.pause(400);
  for (let j = 1; j < b; j++) tl.add({ op: "line", from: [x0, y0 + j * rh], to: [x0 + W, y0 + j * rh], weight: 1, ink: "soft" }, 220, { gap: 50 });
  for (let j = 0; j < a; j++) tl.add({ id: `r${j}`, op: "rect", at: [x0 + 5, y0 + j * rh + 5], w: cn * cw - 10, h: rh - 10, fill: "accent", ink: "mark", weight: 1 }, 380, { gap: 140 });
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
    tl.add({ op: "text", at: [200, 85], text: "+", size: "l" }, 300);
    for (let i = 0; i < b; i++) tl.add(dot(i, 245, 70, `b${i}`, "good"), 160, { gap: 70 });
  } else {
    // take away: cross out the last b dots, one by one
    for (let i = a - b; i < a; i++) {
      const x = 110 + (i % 5) * 30, y = 70 + Math.floor(i / 5) * 30;
      tl.add({ op: "line", from: [x - 12, y - 12], to: [x + 12, y + 12], ink: "mark", weight: 2 }, 220, { gap: 120 });
    }
  }
  const sign = op === "add" ? "+" : "-";
  tl.add({ id: "eq", op: "numwork", at: [120, 220], layout: "equation", rows: [[String(a), sign, String(b), "=", res]], weight: 2 }, 1100, { gap: 350 });
  tl.add({ op: "highlight", target: "eq", style: "underline", ink: "mark" }, 500, { gap: 200 });
  return { facts: { first: a, second: b, operation: op === "add" ? "add" : "take away", result: c.hideResult ? "? (child works it out)" : result } };
}

function numberLineHop(c, tl) {
  const { start, hops } = c;
  if (!isInt(start, -20, 100) || !Array.isArray(hops) || hops.length < 1 || hops.length > 4 || !hops.every((h) => isInt(h, -20, 20) && h !== 0)) return { error: "hops_range" };
  let pos = start;
  const ends = hops.map((h) => (pos += h));
  const all = [start, ...ends];
  const lo = Math.min(...all), hi = Math.max(...all);
  const span = Math.max(4, hi - lo);
  const a = lo - Math.max(1, Math.round(span * 0.1)), b = a + span + 2 * Math.max(1, Math.round(span * 0.1));
  if (b - a > 40) return { error: "line_too_long" };
  const x0 = 30, W = 340, y = 170;
  const xOf = (v) => x0 + 12 + ((v - a) / (b - a)) * (W - 24);
  const labels = [...new Set([a, ...all, b])].sort((p, q) => p - q).map(String);
  tl.add({ op: "numwork", at: [x0, y], layout: "number_line", rows: [labels], range: [a, b], weight: 2 }, 1100);
  tl.add({ op: "circle", c: [xOf(start), y], r: 7, fill: "accent", ink: "accent" }, 300);
  all.slice(1).forEach((e, i) => {
    const from = xOf(all[i]), to = xOf(e);
    tl.add({ op: "arrow", from: [from, y - 10], to: [to, y - 10], bend: hops[i] > 0 ? -0.6 : 0.6, ink: "accent" }, 800, { gap: 220 });
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
  for (let j = width - 1; j >= 0; j--) {
    if (receives.has(j)) tl.add({ op: "text", at: [colX(j), 55], text: op === "add" ? "1" : "-1", size: "s", ink: "mark" }, 260, { gap: 200 });
    // hideResult: each answer cell is "?" (the column method shown, the digits left to the child)
    if (dr[j].trim()) tl.add({ id: `r${j}`, op: "text", at: [colX(j), rowY[2]], text: c.hideResult ? "?" : dr[j], size: "l", ink: "accent" }, 300, { gap: 220 });
  }
  return { facts: { first: a, second: b, operation: op === "add" ? "add" : "subtract", result: c.hideResult ? "? (child works it out)" : r, carries: receives.size } };
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
  digits.forEach((d, i) => tl.add({ id: `d${i}`, op: "text", at: [x0 + i * cw + (cw - 4) / 2, y0 + 62], text: d, size: "l", ink: "accent" }, 300, { gap: 220 }));
  // the Indian grouping, written under the boxes
  const indian = value.toLocaleString("en-IN");
  tl.add({ id: "num", op: "text", at: [200, 230], text: indian, size: "l" }, 900, { gap: 300 });
  return { facts: { number: indian, digits: n, places: PLACES.slice(0, n).reverse().join(" ") } };
}

function equalGroups(c, tl) {
  const { groups, each } = c;
  if (!isInt(groups, 2, 6) || !isInt(each, 1, 8)) return { error: "groups_range" };
  const gw = 340 / groups;
  for (let g = 0; g < groups; g++) {
    const gx = 30 + g * gw;
    tl.add({ op: "ellipse", c: [gx + gw / 2, 110], rx: gw / 2 - 6, ry: 62, weight: 1 }, 380, { gap: 120 });
    for (let i = 0; i < each; i++) {
      const cols = each > 4 ? 2 : 1;
      const x = gx + gw / 2 + (cols === 2 ? (i % 2 ? 9 : -9) : 0), y = 110 - ((Math.ceil(each / cols) - 1) * 13) / 2 + Math.floor(i / cols) * 13;
      tl.add({ op: "circle", c: [x, y], r: 5, fill: "accent", ink: "accent", weight: 1 }, 110, { gap: 40 });
    }
  }
  tl.add({ id: "eq", op: "numwork", at: [110, 240], layout: "equation", rows: [[String(groups), "×", String(each), "=", c.hideResult ? "?" : String(groups * each)]], weight: 2 }, 1000, { gap: 300 });
  return { facts: { groups, each, total: c.hideResult ? "? (child works it out)" : groups * each } };
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

function flow(c, tl) {
  const steps = c.steps;
  if (!Array.isArray(steps) || steps.length < 2 || steps.length > 6 || !steps.every(fitsLabel)) return { error: "steps" };
  const n = steps.length;
  // Layout, first that fits every label: one row left to right (≤ 3 steps); one column top to bottom (≤ 3); two columns
  // read top to bottom, then the next column (4-6). Boxes are sized to the board, never to the text.
  const rowW = 340 / n - 18;
  const layout = n <= 3 && steps.every((t) => canFit(t, rowW - 10)) ? "row" : n <= 3 ? "col" : "two";
  const perCol = layout === "two" ? Math.ceil(n / 2) : n;
  const bw = layout === "row" ? rowW : layout === "col" ? 240 : 160;
  const bh = layout === "row" ? 64 : Math.min(58, 250 / perCol - 18);
  const pos = steps.map((_, i) => layout === "row" ? [30 + i * (bw + 18) + bw / 2, 150]
    : [layout === "col" ? 200 : i < perCol ? 105 : 295, 30 + bh / 2 + (i % perCol) * ((270 - bh) / Math.max(1, perCol - 1))]);
  for (let i = 0; i < n; i++) {
    const [x, y] = pos[i];
    if (i > 0) {
      const [px, py] = pos[i - 1];
      const sameRow = Math.abs(py - y) < 1, sameCol = Math.abs(px - x) < 1;
      const from = sameRow ? [px + bw / 2 + 3, py] : sameCol ? [px, py + bh / 2 + 3] : [px + bw / 2 + 3, py];
      const to = sameRow ? [x - bw / 2 - 3, y] : sameCol ? [x, y - bh / 2 - 3] : [x - bw / 2 - 3, y];
      tl.add({ op: "arrow", from, to, ink: "accent", ...(sameRow || sameCol ? {} : { bend: 0.2 }) }, 450, { gap: 160 });
    }
    tl.add({ id: `b${i}`, op: "rect", at: [x - bw / 2, y - bh / 2], w: bw, h: bh, round: 10, weight: 2 }, 420, { gap: 80 });
    if (!writeFit(tl, steps[i], x, y + 2, bw - 10, {}, { id: `t${i}` })) return { error: `label_too_wide:${i}` };
  }
  return { facts: Object.fromEntries([["steps", n], ...steps.map((s, i) => [`step${i + 1}`, s])]) };
}

function cycle(c, tl) {
  const stages = c.stages;
  if (!Array.isArray(stages) || stages.length < 3 || stages.length > 6 || !stages.every(fitsLabel)) return { error: "stages" };
  const n = stages.length, cx = 200, cy = 152, rx = n <= 4 ? 130 : 128, ry = 100;
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
  }
  if (c.centre && fitsLabel(c.centre)) {
    const size = sizeFor(c.centre, 150);
    if (size) tl.add({ op: "text", at: [cx, cy], text: c.centre, size, ink: "soft" }, 500, { gap: 200 });
  }
  tl.add({ op: "highlight", target: "t0", style: "circle", ink: "mark" }, 600, { gap: 300 });
  return { facts: Object.fromEntries([["stages", n], ...stages.map((s, i) => [`stage${i + 1}`, s])]) };
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
  return { facts: { left: left.title, right: right.title, rows, ...Object.fromEntries(left.items.map((t, r) => [`left${r + 1}`, t])), ...Object.fromEntries(right.items.map((t, r) => [`right${r + 1}`, t])) } };
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
    strokes: [
      { op: "line", from: [200, 268], to: [200, 120], weight: 3, ink: "good" },                              // stem
      { op: "stroke", points: [[200, 268], [182, 285], [168, 292]], ink: "soft" },                          // roots
      { op: "stroke", points: [[200, 268], [214, 287], [230, 294]], ink: "soft" },
      { op: "stroke", points: [[200, 270], [198, 292]], ink: "soft" },
      { op: "ellipse", c: [172, 180], rx: 26, ry: 11, fill: "good", ink: "good" },                         // leaves
      { op: "ellipse", c: [228, 150], rx: 26, ry: 11, fill: "good", ink: "good" },
      { op: "circle", c: [200, 104], r: 18, fill: "accent", ink: "accent" },                               // flower
      { op: "line", from: [120, 262], to: [280, 262], ink: "soft", weight: 1 },                            // soil line
    ],
    anchors: { flower: [200, 104], leaf: [228, 150], stem: [200, 215], root: [200, 285], soil: [140, 262], fruit: [172, 180] },
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
    if (textBox(l.text, "s").w > 112) throw new Error("label_too_wide");
    tl.add({ id: `l_${l.anchor}`, op: "label", at: [x, Math.min(285, y)], text: l.text, to: sk.anchors[l.anchor], ink: "accent" }, 700, { gap: 220 });
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
  if (list.length < 1 || list.length > 3 || !list.every((a) => a && isInt(a.deg, 10, 180) && (a.name === undefined || fitsLabel(a.name)))) return { error: "angles" };
  const n = list.length, colW = 400 / n, Lbase = n === 1 ? 150 : n === 2 ? 110 : 82;
  const facts = { angles: n };
  list.forEach((a, i) => {
    const th = rad(a.deg);
    // the arms are as long as the column allows for this opening (an obtuse angle spans more than its arm)
    const L = Math.min(Lbase, (colW - 14) / (Math.max(1, Math.cos(th)) - Math.min(0, Math.cos(th))));
    const xs = [0, L, L * Math.cos(th)], minX = Math.min(...xs), maxX = Math.max(...xs);
    const vx = i * colW + colW / 2 - (minX + maxX) / 2, vy = n === 1 ? 215 : 205;
    tl.add({ id: `h${i}`, op: "line", from: [vx, vy], to: [vx + L, vy], weight: 2 }, 520, { gap: i ? 260 : 120 });
    tl.add({ id: `r${i}`, op: "line", from: [vx, vy], to: [vx + L * Math.cos(th), vy - L * Math.sin(th)], weight: 2 }, 520, { gap: 90 });
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
  return { facts };
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
  for (const k of ["name", "side", "corner", "centre", "radius", "diameter"]) if (c[k] !== undefined && !fitsLabel(c[k])) return { error: `label_${k}` };
  const names = Array.isArray(c.names) ? c.names : [];
  if (names.some((x) => !fitsLabel(x))) return { error: "names" };
  if (c.shape === "circle") {
    if (copies !== 1) return { error: "circle_copies" };
    const cx = 200, cy = 138, r = 100;
    tl.add({ id: "o", op: "circle", c: [cx, cy], r, weight: 2 }, 1000);
    tl.add({ id: "ctr", op: "circle", c: [cx, cy], r: 4, fill: "accent", ink: "accent", weight: 1 }, 200, { gap: 160 });
    if (c.diameter) {
      tl.add({ id: "dia", op: "line", from: [cx - r, cy], to: [cx + r, cy], ink: "good", weight: 2 }, 600, { gap: 200 });
      tl.add({ op: "text", at: [cx + 50, cy + 18], text: c.diameter, size: "s", ink: "good" }, 420, { gap: 60 });
    }
    if (c.radius) {
      const ex = cx + r * Math.cos(rad(-50)), ey = cy + r * Math.sin(rad(-50));
      tl.add({ id: "rad", op: "line", from: [cx, cy], to: [ex, ey], ink: "accent", weight: 2 }, 520, { gap: 200 });
      tl.add({ op: "text", at: [(cx + ex) / 2 + 30, (cy + ey) / 2 - 4], text: c.radius, size: "s", ink: "accent" }, 420, { gap: 60 });
    }
    if (c.centre) tl.add({ op: "label", at: [Math.max(textBox(c.centre, "s").w / 2 + 6, 62), 262], text: c.centre, to: [cx - 3, cy + 3], ink: "soft" }, 600, { gap: 200 });
    if (c.name) tl.add({ op: "text", at: [300, 270], text: c.name, size: sizeFor(c.name, 180) ?? "s", ink: "accent" }, 500, { gap: 200 });
    return { facts: { shape: c.name ?? "circle", ...(c.centre ? { centre: "marked" } : {}), ...(c.radius ? { radius: "drawn" } : {}), ...(c.diameter ? { diameter: "drawn" } : {}) } };
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
  return { facts: { shape: c.name ?? c.shape, sides: k, corners: k, ...(copies === 2 ? { copies: 2, second: "same shape, turned" } : {}) } };
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
    tl.add({ op: "arrow", from: [200 - d * u + 10, y + 16], to: [200 + d * u - 10, y + 16], bend: 0.35, ink: "mark" }, 900, { gap: 300 });
    tl.add({ op: "text", at: [200 + (d * u) / 2, y - 26], text: String(d), size: "m", ink: "soft" }, 300, { gap: 200 });
    tl.add({ id: "img", op: "circle", c: [200 + d * u, y], r: 8, fill: "good", ink: "good" }, 300, { gap: 120 });
    return { facts: { line: c.line ?? "mirror line", left: d, right: d }, ground: "grid" };
  }
  // a figure and its mirror half, drawn one half after the other
  tl.add({ id: "L", op: "stroke", points: [[200, 52], [150, 92], [118, 150], [150, 212], [200, 252]], weight: 2 }, 900, { gap: 260 });
  tl.add({ op: "circle", c: [164, 140], r: 9, fill: "accent", ink: "accent" }, 260, { gap: 80 });
  tl.add({ id: "R", op: "stroke", points: [[200, 52], [250, 92], [282, 150], [250, 212], [200, 252]], weight: 2, ink: "good" }, 900, { gap: 320 });
  tl.add({ op: "circle", c: [236, 140], r: 9, fill: "good", ink: "good" }, 260, { gap: 80 });
  return { facts: { line: c.line ?? "mirror line", halves: "match" }, ground: "grid" };
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
    if (mode === "area") for (let j = 0; j < h; j++) tl.add({ op: "rect", at: [x0 + 2, y0 + j * cell + 2], w: W - 4, h: cell - 4, fill: "accent", ink: "accent", weight: 1 }, 320, { gap: 140 });
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
  return { facts: { length: `${w}${unit}`.trim(), breadth: `${h}${unit}`.trim(), ...(mode === "area" ? { squares: grid ? (c.hideResult ? "?" : w * h) : "not drawn", area: val } : { perimeter: val }) } };
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
    if (hh >= 2) tl.add({ id: `b${i}`, op: "rect", at: [cx - bw / 2, y0 - hh], w: bw, h: hh, fill: "accent", ink: "accent", weight: 1 }, 520, { gap: 60 });
    tl.add({ id: `v${i}`, op: "text", at: [cx, y0 - hh - 13], text: String(b.value), size: "s" }, 260, { gap: 60 });
  });
  return { facts: { bars: n, scale: `steps of ${step}`, ...Object.fromEntries(bars.map((b, i) => [`bar${i + 1}`, `${b.label} ${b.value}`])) } };
}

const BUILD = {
  "fraction-parts@1": fractionParts, "fraction-of@1": fractionOf, "combine-count@1": combineCount, "number-line-hop@1": numberLineHop, "column-op@1": columnOp,
  "place-value@1": placeValue, "equal-groups@1": equalGroups, "flow@1": flow, "cycle@1": cycle, "compare@1": compare, "parts@1": parts, "label@1": label,
  "angle@1": angle, "shape@1": shape, "symmetry@1": symmetry, "area-grid@1": areaGrid, "bar-chart@1": barChart,
  // code-only (the claims board): not offered to any model, so not in TEMPLATES
  "shade-grid@1": shadeGrid,
};

/**
 * A template call → a validated, linted WhiteboardScript.
 * @param {{ template: string, [k: string]: unknown }} call
 * @param {{ band?: string, lessonId?: string, scriptId?: string }} [opts]
 * @returns {{ ok: boolean, script: any, facts: any, errors: string[] }}
 */
export function expand(call, { band = "B3", lessonId = "", scriptId } = {}) {
  const build = BUILD[call?.template];
  if (!build) return { ok: false, script: null, facts: null, errors: [`unknown_template:${call?.template}`] };
  const tl = timeline(PACE[band] ?? 1);
  let r;
  try { r = build(call, tl); } catch (e) { return { ok: false, script: null, facts: null, errors: [`build:${String(e?.message ?? e).slice(0, 60)}`] }; }
  if (r.error) return { ok: false, script: null, facts: null, errors: [r.error] };
  const facts = { kind: KIND_OF[call.template] ?? "animation", archetype: call.template, onScreen: r.facts };
  const raw = script(call, tl.ops, tl.t, facts, { lessonId, scriptId, ground: r.ground ?? "chalk" });
  const n = normalizeScript(raw, { strict: true });
  if (!n.ok) return { ok: false, script: null, facts: null, errors: n.errors.slice(0, 6) };
  const lint = lintScript(n.script);
  if (lint.length) return { ok: false, script: null, facts: null, errors: lint.slice(0, 6).map((i) => `${i.check}:${i.id}`) };
  return { ok: true, script: n.script, facts: n.script.facts, errors: [] };
}
