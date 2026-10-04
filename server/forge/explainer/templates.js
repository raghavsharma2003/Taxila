// explainer@1 / diagram templates (W2-B #2, #3): rungs 4-5 of the Studio fallback ladder (LIVE-STUDIO §3.12). A
// template call is DATA (which template, a few numbers, a few short labels); this file turns it into a timed
// WhiteboardScript (shared/studio.ts) drawn by our renderer (src/modules/whiteboard/**). Every number, position, part
// count, carry and label box is computed HERE, never by a model (explainer-dsl's rule: "geometry/arithmetic computed in
// code, never by the LLM"), and labels are drawn by code on top (never baked into a picture).
//
//   maths:    fraction-parts@1, combine-count@1, number-line-hop@1, column-op@1, place-value@1, equal-groups@1
//   diagrams: flow@1, cycle@1, compare@1, parts@1, label@1 (a vetted sketch: plant, flower, leaf, insect)
//
// expand(call, { band, lessonId, scriptId }) → { ok, script, facts, errors }: the script is normalised STRICTLY and
// linted (shared/whiteboard.js lintScript: inside the board, no overlapping text), so a template that cannot lay out
// its data fails here, before a child sees it, and the ladder steps down.
import { normalizeScript, lintScript, textBox, textProblem } from "../../../shared/whiteboard.js";

export const BOARD = { w: 400, h: 300 };
export const TEMPLATES = ["fraction-parts@1", "combine-count@1", "number-line-hop@1", "column-op@1", "place-value@1", "equal-groups@1",
  "flow@1", "cycle@1", "compare@1", "parts@1", "label@1"];
/** The StudioFacts kind each template is (what the Brain reads as "what is on screen"). */
export const KIND_OF = { "flow@1": "diagram", "cycle@1": "diagram", "compare@1": "diagram", "parts@1": "diagram", "label@1": "diagram" };
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

function combineCount(c, tl) {
  const { a, b } = c;
  const op = c.op === "take_away" ? "take_away" : "add";
  if (!isInt(a, 0, 10) || !isInt(b, 0, 10) || (op === "take_away" && b > a)) return { error: "count_range" };
  const result = op === "add" ? a + b : a - b;
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
  tl.add({ id: "eq", op: "numwork", at: [120, 220], layout: "equation", rows: [[String(a), sign, String(b), "=", String(result)]], weight: 2 }, 1100, { gap: 350 });
  tl.add({ op: "highlight", target: "eq", style: "underline", ink: "mark" }, 500, { gap: 200 });
  return { facts: { first: a, second: b, operation: op === "add" ? "add" : "take away", result } };
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
  const eq = [String(start), ...hops.flatMap((h) => [h > 0 ? "+" : "-", String(Math.abs(h))]), "=", String(pos)];
  tl.add({ id: "eq", op: "numwork", at: [60, 250], layout: "equation", rows: [eq], weight: 2 }, 1000, { gap: 300 });
  return { facts: { start, hops: hops.map((h) => (h > 0 ? `+${h}` : `${h}`)).join(" "), end: pos } };
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
    if (dr[j].trim()) tl.add({ id: `r${j}`, op: "text", at: [colX(j), rowY[2]], text: dr[j], size: "l", ink: "accent" }, 300, { gap: 220 });
  }
  return { facts: { first: a, second: b, operation: op === "add" ? "add" : "subtract", result: r, carries: receives.size } };
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
  tl.add({ id: "eq", op: "numwork", at: [110, 240], layout: "equation", rows: [[String(groups), "×", String(each), "=", String(groups * each)]], weight: 2 }, 1000, { gap: 300 });
  return { facts: { groups, each, total: groups * each } };
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

const BUILD = {
  "fraction-parts@1": fractionParts, "combine-count@1": combineCount, "number-line-hop@1": numberLineHop, "column-op@1": columnOp,
  "place-value@1": placeValue, "equal-groups@1": equalGroups, "flow@1": flow, "cycle@1": cycle, "compare@1": compare, "parts@1": parts, "label@1": label,
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
  const raw = script(call, tl.ops, tl.t, facts, { lessonId, scriptId });
  const n = normalizeScript(raw, { strict: true });
  if (!n.ok) return { ok: false, script: null, facts: null, errors: n.errors.slice(0, 6) };
  const lint = lintScript(n.script);
  if (lint.length) return { ok: false, script: null, facts: null, errors: lint.slice(0, 6).map((i) => `${i.check}:${i.id}`) };
  return { ok: true, script: n.script, facts: n.script.facts, errors: [] };
}
