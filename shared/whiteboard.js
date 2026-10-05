// The whiteboard drawing script, as CODE (W2-B; owner 2026-10-04 whiteboard-by-drawing-script-2026-10-04). The TYPES
// are shared/studio.ts (WhiteboardScript, WbOp, WHITEBOARD_LIMITS: W2-H's contract file); this file is the ONE
// implementation every side shares, plain JS so the server, the frame, the app and the tests import it without a build:
//
//   normalizeScript(raw, { strict })  → { ok, script, errors, fixes }   bounds, limits, ids, targets, text shape
//   lintScript(script)                → issue[]                          the render-check's layout checks (overlap, edges)
//   scriptTokens(script)              → string[]                         every token drawn (the gate: drawn ⊆ reply ∪ kit)
//   scriptFacts(script, base)         → StudioFacts                      what is on the board, as values (the Brain's row)
//   opProgress(op, t) / erasedAt(...) → the timeline the renderer draws (ms from the anchor)
//   opGeometry(op, script)            → hand-drawn SVG path(s), text cells, a box: what is drawn, computed once
//
// Who uses it: the whiteboard renderer (src/modules/whiteboard/**: the Studio stage's `whiteboard` kind AND the frame's
// explainer@1 engine), the explainer / diagram templates (server/forge/explainer/**: rungs 4-5 of the Studio ladder),
// and W2-F's whiteboard archetype gate (the same normalise + lint + tokens, so the planner and the renderer can never
// disagree about what a script means). Pure: no DOM, no I/O, deterministic (the hand-drawn jitter is seeded by op id).

export const LIMITS = Object.freeze({ maxOps: 120, maxPointsPerStroke: 240, maxTextChars: 24, maxDurationMs: 60_000, minBoard: 100, maxBoard: 2000,
  maxNumRows: 8, maxNumCols: 12, maxCellChars: 6 });
export const OPS = Object.freeze(["stroke", "line", "arrow", "rect", "circle", "ellipse", "polygon", "sector", "text", "label", "numwork", "highlight", "erase"]);
export const INKS = Object.freeze(["chalk", "accent", "ink", "mark", "good", "soft"]);
export const GROUNDS = Object.freeze(["chalk", "paper", "grid"]);
export const NUM_LAYOUTS = Object.freeze(["column_add", "column_sub", "column_mul", "long_div", "fraction", "equation", "number_line"]);
/** Board-unit font sizes of the three text sizes; a cell of numwork is size m. */
export const TEXT_SIZE = Object.freeze({ s: 18, m: 24, l: 34 });
/** Average glyph advance as a share of the font size (a handwriting face; measured loosely, used for boxes only). */
const ADVANCE = 0.58;

const isNum = (n) => typeof n === "number" && Number.isFinite(n);
const ID_RE = /^[A-Za-z0-9_.:-]{1,32}$/;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round1 = (v) => Math.round(v * 10) / 10;

/** Text the board may carry: a label, a number or a short term, never narration (≤ 24 chars, no markup, one line). */
export function textProblem(t) {
  if (typeof t !== "string") return "not_text";
  const s = t.trim();
  if (!s) return "empty";
  if ([...s].length > LIMITS.maxTextChars) return "too_long";
  if (/[<>{}`]|[\u0000-\u001f\u007f]/.test(s)) return "markup";
  if (/https?:|www\.|@[a-z]/i.test(s)) return "link";
  // sentence-shaped: ends like a sentence and has a verb-sized span of words (labels may end with "?" only as a probe mark)
  if (s.split(/\s+/).length >= 5 && /[.!]$/.test(s)) return "sentence";
  return null;
}

/** A text's box in board units (centre-anchored when align is middle). */
export function textBox(text, size = "m", at = [0, 0], align = "middle") {
  const fs = TEXT_SIZE[size] ?? TEXT_SIZE.m;
  const w = Math.max(fs * 0.6, [...String(text)].length * fs * ADVANCE);
  const h = fs * 1.2;
  const x = align === "start" ? at[0] : align === "end" ? at[0] - w : at[0] - w / 2;
  return { x, y: at[1] - h * 0.75, w, h };
}

// ───────────────────────────── normalise ─────────────────────────────

/**
 * Validate and normalise a script. Lenient (default): out-of-board points are clamped, bad ops dropped, timings repaired
 * (each a `fix`); a script with nothing drawable left, or a broken envelope, is not ok. Strict (the gate): every fix is
 * an error, so a planner is told exactly what it got wrong. `clauses`: keep clause anchors (only with onsets to apply).
 * `priorIds`: the ids of the board a "continue" script draws on (valid targets).
 * @returns {{ ok: boolean, script: any | null, errors: string[], fixes: string[] }}
 */
export function normalizeScript(raw, { strict = false, clauses = false, priorIds = null } = {}) {
  const errors = [], fixes = [];
  const fix = (m) => (strict ? errors : fixes).push(m);
  if (!raw || typeof raw !== "object") return { ok: false, script: null, errors: ["not_an_object"], fixes };
  if (raw.v !== 1) errors.push("version");
  const b = raw.board ?? {};
  const bw = isNum(b.w) ? b.w : NaN, bh = isNum(b.h) ? b.h : NaN;
  if (!(bw >= LIMITS.minBoard && bw <= LIMITS.maxBoard && bh >= LIMITS.minBoard && bh <= LIMITS.maxBoard)) errors.push("board_size");
  const ground = GROUNDS.includes(b.ground) ? b.ground : (fix("board_ground"), "chalk");
  if (!Array.isArray(raw.ops)) errors.push("ops_not_array");
  if (errors.length) return { ok: false, script: null, errors, fixes };
  const board = { w: bw, h: bh, ground };
  const P = (p, where) => {
    if (!Array.isArray(p) || p.length !== 2 || !isNum(p[0]) || !isNum(p[1])) return null;
    const q = [clamp(p[0], 0, bw), clamp(p[1], 0, bh)];
    if (q[0] !== p[0] || q[1] !== p[1]) fix(`${where}:clamped`);
    return [round1(q[0]), round1(q[1])];
  };
  const ops = [];
  // a "continue" script may point at the board it draws on (highlight / erase / label an earlier op): those ids count
  // as seen targets, never as this script's own ids
  const prior = new Set(priorIds ?? []);
  const seen = new Set();
  const isTarget = (id) => seen.has(id) || prior.has(id);
  const list = raw.ops.slice(0, LIMITS.maxOps);
  if (raw.ops.length > LIMITS.maxOps) fix(`ops_over_${LIMITS.maxOps}`);
  for (const [i, o] of list.entries()) {
    const where = `op${i}`;
    const bad = (m) => { fix(`${where}:${m}`); };
    if (!o || typeof o !== "object" || !OPS.includes(o.op)) { bad("unknown_op"); continue; }
    if (typeof o.id !== "string" || !ID_RE.test(o.id) || seen.has(o.id)) { bad("id"); continue; }
    let s = isNum(o.startMs) ? o.startMs : NaN, e = isNum(o.endMs) ? o.endMs : NaN;
    if (!(s >= 0)) { bad("startMs"); continue; }
    if (!(e >= s)) { bad("endMs"); e = s; }
    if (e > LIMITS.maxDurationMs) { bad("over_duration"); e = LIMITS.maxDurationMs; s = Math.min(s, e); }
    const base = { id: o.id, op: o.op, startMs: Math.round(s), endMs: Math.round(e) };
    // `clause` makes an op's times relative to that clause's onset in her line. Only a caller that HAS the onsets (the
    // renderer given clauseOnsets) keeps it; otherwise strict refuses it and lenient drops it, so the gate and the
    // renderer can never disagree about when an op draws (W2-B fixer, major 1).
    if (o.clause !== undefined) {
      if (clauses && Number.isInteger(o.clause) && o.clause >= 0 && o.clause < 64) base.clause = o.clause;
      else bad(clauses ? "clause" : "clause_unsupported");
    }
    if (o.ink !== undefined) { if (INKS.includes(o.ink)) base.ink = o.ink; else bad("ink"); }
    if (o.weight !== undefined) { if ([1, 2, 3].includes(o.weight)) base.weight = o.weight; else bad("weight"); }
    const fill = (k = "fill") => (o[k] === undefined ? {} : INKS.includes(o[k]) ? { [k]: o[k] } : (bad(k), {}));
    let op = null;
    switch (o.op) {
      case "stroke":
      case "polygon": {
        const pts = Array.isArray(o.points) ? o.points.slice(0, LIMITS.maxPointsPerStroke).map((p, j) => P(p, `${where}.p${j}`)).filter(Boolean) : [];
        if (Array.isArray(o.points) && o.points.length > LIMITS.maxPointsPerStroke) bad("too_many_points");
        if (pts.length < (o.op === "polygon" ? 3 : 2)) { bad("points"); break; }
        op = { ...base, points: pts, ...(o.op === "polygon" ? fill() : {}) };
        break;
      }
      case "line":
      case "arrow": {
        const from = P(o.from, `${where}.from`), to = P(o.to, `${where}.to`);
        if (!from || !to) { bad("endpoints"); break; }
        op = { ...base, from, to };
        if (o.op === "line" && o.dashed === true) op.dashed = true;
        if (o.op === "arrow") {
          if (isNum(o.bend)) op.bend = clamp(o.bend, -1, 1);
          if (o.head === "both") op.head = "both";
        }
        break;
      }
      case "rect": {
        const at = P(o.at, `${where}.at`);
        if (!at || !isNum(o.w) || !isNum(o.h) || o.w <= 0 || o.h <= 0) { bad("rect"); break; }
        const w = Math.min(o.w, bw - at[0]), h = Math.min(o.h, bh - at[1]);
        if (w !== o.w || h !== o.h) bad("rect:clamped");
        if (w <= 0 || h <= 0) { bad("rect_empty"); break; }
        op = { ...base, at, w: round1(w), h: round1(h), ...fill(), ...(isNum(o.round) && o.round > 0 ? { round: Math.min(o.round, Math.min(w, h) / 2) } : {}) };
        break;
      }
      case "circle":
      case "sector": {
        const c = P(o.c, `${where}.c`);
        if (!c || !isNum(o.r) || o.r <= 0) { bad("circle"); break; }
        const r = Math.min(o.r, c[0], c[1], bw - c[0], bh - c[1]);
        if (r !== o.r) bad("radius:clamped");
        if (r < 2) { bad("radius_tiny"); break; }
        op = { ...base, c, r: round1(r), ...fill() };
        if (o.op === "sector") {
          if (!isNum(o.fromDeg) || !isNum(o.toDeg) || o.toDeg <= o.fromDeg || o.toDeg - o.fromDeg > 360) { bad("sector_angles"); op = null; break; }
          op.fromDeg = o.fromDeg; op.toDeg = o.toDeg;
        }
        break;
      }
      case "ellipse": {
        const c = P(o.c, `${where}.c`);
        if (!c || !isNum(o.rx) || !isNum(o.ry) || o.rx <= 0 || o.ry <= 0) { bad("ellipse"); break; }
        const rx = Math.min(o.rx, c[0], bw - c[0]), ry = Math.min(o.ry, c[1], bh - c[1]);
        if (rx !== o.rx || ry !== o.ry) bad("radius:clamped");
        if (rx < 2 || ry < 2) { bad("radius_tiny"); break; }
        op = { ...base, c, rx: round1(rx), ry: round1(ry), ...fill() };
        break;
      }
      case "text":
      case "label": {
        const at = P(o.at, `${where}.at`);
        const tp = textProblem(o.text);
        if (!at || tp) { bad(`text_${tp ?? "at"}`); break; }
        op = { ...base, at, text: o.text.trim() };
        if (o.op === "text") {
          op.size = ["s", "m", "l"].includes(o.size) ? o.size : (bad("size"), "m");
          if (["start", "middle", "end"].includes(o.align)) op.align = o.align;
        } else {
          if (o.to !== undefined) { const to = P(o.to, `${where}.to`); if (to) op.to = to; else bad("label_to"); }
          if (typeof o.target === "string") { if (isTarget(o.target)) op.target = o.target; else bad("label_target"); }
        }
        break;
      }
      case "numwork": {
        const at = P(o.at, `${where}.at`);
        if (!at || !NUM_LAYOUTS.includes(o.layout) || !Array.isArray(o.rows) || !o.rows.length) { bad("numwork"); break; }
        const rows = o.rows.slice(0, LIMITS.maxNumRows).map((r) => (Array.isArray(r) ? r.slice(0, LIMITS.maxNumCols).map((c) => String(c ?? "").trim().slice(0, LIMITS.maxCellChars)) : []));
        if (rows.some((r) => r.some((c) => /[<>{}`]/.test(c)))) { bad("numwork_markup"); break; }
        op = { ...base, at, layout: o.layout, rows };
        if (Array.isArray(o.marks)) {
          op.marks = o.marks.filter((m) => m && Number.isInteger(m.row) && Number.isInteger(m.col) && ["carry", "borrow", "circle", "tick"].includes(m.kind)).slice(0, 24)
            .map((m) => ({ row: m.row, col: m.col, kind: m.kind }));
        }
        if (o.layout === "number_line") {
          if (!Array.isArray(o.range) || !isNum(o.range[0]) || !isNum(o.range[1]) || o.range[1] <= o.range[0]) { bad("number_line_range"); op = null; break; }
          op.range = [o.range[0], o.range[1]];
        }
        break;
      }
      case "highlight":
      case "erase": {
        if (typeof o.target !== "string" || !isTarget(o.target)) { bad("target"); break; }
        op = { ...base, target: o.target };
        if (o.op === "highlight") op.style = ["circle", "underline", "pulse"].includes(o.style) ? o.style : (bad("style"), "circle");
        break;
      }
    }
    if (op) { ops.push(op); seen.add(op.id); }
  }
  if (!ops.length) errors.push("nothing_to_draw");
  const lastEnd = ops.reduce((m, o) => Math.max(m, o.endMs), 0);
  let durationMs = isNum(raw.durationMs) ? raw.durationMs : lastEnd;
  if (durationMs < lastEnd) { fix("duration_short"); durationMs = lastEnd; }
  if (durationMs > LIMITS.maxDurationMs) { fix("duration_long"); durationMs = LIMITS.maxDurationMs; }
  // Stable order by start time: the renderer draws in this order (later ops paint over earlier ones).
  const sorted = ops.map((o, i) => [o, i]).sort((a, b) => a[0].startMs - b[0].startMs || a[1] - b[1]).map(([o]) => o);
  const line = raw.line && typeof raw.line === "object" && typeof raw.line.lessonId === "string"
    ? { lessonId: raw.line.lessonId.slice(0, 64), ...(Number.isInteger(raw.line.teacherReplySeq) ? { teacherReplySeq: raw.line.teacherReplySeq } : {}) } : { lessonId: "" };
  const script = { v: 1, scriptId: typeof raw.scriptId === "string" ? raw.scriptId.slice(0, 64) : "wb", line, anchor: "line_audio_start", board,
    mode: raw.mode === "continue" ? "continue" : "fresh", durationMs: Math.round(durationMs), ops: sorted };
  if (raw.facts && typeof raw.facts === "object" && raw.facts.onScreen && typeof raw.facts.onScreen === "object") script.facts = cleanFacts(raw.facts);
  return { ok: errors.length === 0, script: errors.length && !ops.length ? null : script, errors, fixes };
}

function cleanFacts(f) {
  const onScreen = {};
  for (const [k, v] of Object.entries(f.onScreen).slice(0, 12)) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,23}$/.test(k)) continue;
    if (isNum(v)) onScreen[k] = v;
    else if (typeof v === "string" && v.length <= 40 && !/[<>{}\n]/.test(v)) onScreen[k] = v;
  }
  return { kind: typeof f.kind === "string" ? f.kind : "diagram", archetype: typeof f.archetype === "string" ? f.archetype.slice(0, 40) : "whiteboard",
    onScreen, ...(Number.isInteger(f.step) ? { step: f.step } : {}), ...(typeof f.itemId === "string" ? { itemId: f.itemId } : {}) };
}

// ───────────────────────────── timeline ─────────────────────────────

/** 0..1: how much of `op` is drawn at `t` ms from the anchor. An instant op (endMs = startMs) is all or nothing. */
export function opProgress(op, t) {
  if (t < op.startMs) return 0;
  if (op.endMs <= op.startMs) return 1;
  return clamp((t - op.startMs) / (op.endMs - op.startMs), 0, 1);
}
/** The erase ops of a script by target id (an op is faded out over its eraser's span). */
export function erasers(script) {
  const m = new Map();
  for (const o of script.ops) if (o.op === "erase") m.set(o.target, o);
  return m;
}
/** 1 = fully visible, 0 = erased, for an op at `t` given the script's erasers. */
export function visibleShare(op, t, er) {
  const e = er.get(op.id);
  return e ? 1 - opProgress(e, t) : 1;
}
/** Times at which something new starts drawing (for a "step" count: what the Brain reads as the board's progress). */
export function stepsAt(script, t) {
  return script.ops.filter((o) => o.op !== "erase" && o.op !== "highlight" && o.startMs <= t).length;
}

// ───────────────────────────── tokens and facts ─────────────────────────────

// letters WITH combining marks (\p{M}): without it a Devanagari word splits at every matra / virama (W2-B fixer)
const TOKEN_RE = /[\p{L}\p{M}\p{N}]+(?:[./:][\p{N}]+)*/gu;
/** Every token the board writes (text, labels, number work cells), lower-cased: the gate checks these ⊆ reply ∪ kit. */
export function scriptTokens(script) {
  const out = [];
  for (const o of script?.ops ?? []) {
    const texts = o.op === "text" || o.op === "label" ? [o.text] : o.op === "numwork" ? o.rows.flat() : [];
    for (const t of texts) for (const m of String(t).toLowerCase().matchAll(TOKEN_RE)) out.push(m[0]);
  }
  return out;
}
/** The numbers the board shows (numwork cells, numeric labels), for the "her numbers = the screen's numbers" check. */
export function scriptNumbers(script) {
  const out = [];
  for (const tok of scriptTokens(script)) if (/^\d+(?:[./]\d+)?$/.test(tok)) out.push(tok);
  return [...new Set(out)];
}

/**
 * The board as values (LIVE-STUDIO §10 StudioFacts, the shape W2-B's moduleFacts shares): the script's own facts when it
 * carries them (a template knows what it drew: whole 4 parts, shaded 3), else the drawn labels and numbers.
 */
export function scriptFacts(script, base = {}) {
  if (script?.facts?.onScreen) return { ...script.facts, ...base, onScreen: { ...script.facts.onScreen } };
  const onScreen = {};
  const labels = (script?.ops ?? []).filter((o) => o.op === "label" || o.op === "text").map((o) => o.text).slice(0, 6);
  if (labels.length) onScreen.labels = labels.join(" | ").slice(0, 40);
  const nums = scriptNumbers(script ?? { ops: [] });
  if (nums.length) onScreen.numbers = nums.slice(0, 8).join(" ");
  return { kind: "diagram", archetype: "whiteboard", onScreen, ...base };
}

// ───────────────────────────── geometry (hand-drawn) ─────────────────────────────

/** Deterministic PRNG from a string (FNV-1a → mulberry32): the same op wobbles the same way on every device. */
export function seeded(str) {
  let h = 2166136261 >>> 0;
  for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f1 = (n) => (Math.round(n * 10) / 10).toString();
/** A slightly wobbly line from a to b as a quadratic segment (a hand never draws ruler-straight). */
function wobbleSeg(a, b, rnd, amp) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const off = (rnd() - 0.5) * 2 * Math.min(amp, len * 0.04);
  const mx = (a[0] + b[0]) / 2 - (dy / len) * off, my = (a[1] + b[1]) / 2 + (dx / len) * off;
  return `Q${f1(mx)},${f1(my)} ${f1(b[0])},${f1(b[1])}`;
}
function polyPath(pts, rnd, amp, close = false) {
  const j = (p) => [p[0] + (rnd() - 0.5) * amp * 0.4, p[1] + (rnd() - 0.5) * amp * 0.4];
  const q = pts.map(j);
  let d = `M${f1(q[0][0])},${f1(q[0][1])}`;
  for (let i = 1; i < q.length; i++) d += " " + wobbleSeg(q[i - 1], q[i], rnd, amp);
  if (close) d += " " + wobbleSeg(q[q.length - 1], [q[0][0] + (rnd() - 0.5) * amp * 0.3, q[0][1] + (rnd() - 0.5) * amp * 0.3], rnd, amp);
  return d;
}
/** A hand-drawn ellipse: one closed loop with a little overshoot, as a path (so it draws on). */
function loopPath(cx, cy, rx, ry, rnd, amp, from = 0, to = 360) {
  const n = Math.max(12, Math.min(48, Math.round((Math.max(rx, ry) * Math.PI * 2 * (to - from)) / 360 / 12)));
  const start = ((from - 90) * Math.PI) / 180, span = ((to - from) * Math.PI) / 180;
  const full = to - from >= 360;
  const over = full ? 0.08 + rnd() * 0.06 : 0;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = start + (span * (1 + over) * i) / n;
    const w = 1 + (rnd() - 0.5) * (amp / Math.max(rx, ry, 1)) * 0.6;
    pts.push([cx + rx * w * Math.cos(a), cy + ry * w * Math.sin(a)]);
  }
  // a smooth hand loop: quadratic segments through the midpoints (no visible corners at any size)
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${f1(pts[i][0])},${f1(pts[i][1])} ${f1(mx)},${f1(my)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${f1(last[0])},${f1(last[1])}`;
}
const arrowHead = (from, to, size) => {
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const l = [to[0] - size * Math.cos(a - 0.45), to[1] - size * Math.sin(a - 0.45)];
  const r = [to[0] - size * Math.cos(a + 0.45), to[1] - size * Math.sin(a + 0.45)];
  return `M${f1(l[0])},${f1(l[1])} L${f1(to[0])},${f1(to[1])} L${f1(r[0])},${f1(r[1])}`;
};
const bbox = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

/**
 * What an op draws: `paths` (each drawn on along its length, in order), `texts` (written on, char by char), `fill`
 * (a closed shape's fill path, faded in once its outline is mostly drawn) and its `box` (board units). Highlight and erase
 * resolve their target's box through `byId`.
 * @returns {{ paths: string[], texts: { x: number, y: number, text: string, size: number, align: string, small?: boolean }[], fill?: string, box: { x: number, y: number, w: number, h: number } }}
 */
export function opGeometry(op, byId = new Map()) {
  const rnd = seeded(op.id);
  const amp = 2.2 * (op.weight ?? 2);
  switch (op.op) {
    case "stroke": return { paths: [polyPath(op.points, rnd, amp * 0.5)], texts: [], box: bbox(op.points) };
    case "polygon": { const d = polyPath(op.points, rnd, amp, true); return { paths: [d], texts: [], fill: op.fill ? `${d} Z` : undefined, box: bbox(op.points) }; }
    case "line": return { paths: [polyPath([op.from, op.to], rnd, amp)], texts: [], box: bbox([op.from, op.to]) };
    case "arrow": {
      const bend = op.bend ?? 0;
      const mx = (op.from[0] + op.to[0]) / 2, my = (op.from[1] + op.to[1]) / 2;
      const dx = op.to[0] - op.from[0], dy = op.to[1] - op.from[1];
      const len = Math.hypot(dx, dy) || 1;
      const ctl = [mx - (dy / len) * bend * len * 0.5, my + (dx / len) * bend * len * 0.5];
      const shaft = bend ? `M${f1(op.from[0])},${f1(op.from[1])} Q${f1(ctl[0])},${f1(ctl[1])} ${f1(op.to[0])},${f1(op.to[1])}` : polyPath([op.from, op.to], rnd, amp);
      const size = Math.min(16, Math.max(8, len * 0.18));
      const paths = [shaft, arrowHead(bend ? ctl : op.from, op.to, size)];
      if (op.head === "both") paths.push(arrowHead(bend ? ctl : op.to, op.from, size));
      return { paths, texts: [], box: bbox([op.from, op.to, ...(bend ? [ctl] : [])]) };
    }
    case "rect": {
      const { at: [x, y], w, h } = op;
      const d = polyPath([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], rnd, amp, true);
      return { paths: [d], texts: [], fill: op.fill ? `M${f1(x)},${f1(y)} h${f1(w)} v${f1(h)} h${f1(-w)} Z` : undefined, box: { x, y, w, h } };
    }
    case "circle": {
      const [cx, cy] = op.c;
      const d = loopPath(cx, cy, op.r, op.r, rnd, amp);
      return { paths: [d], texts: [], fill: op.fill ? `M${f1(cx - op.r)},${f1(cy)} a${f1(op.r)},${f1(op.r)} 0 1,0 ${f1(2 * op.r)},0 a${f1(op.r)},${f1(op.r)} 0 1,0 ${f1(-2 * op.r)},0 Z` : undefined,
        box: { x: cx - op.r, y: cy - op.r, w: 2 * op.r, h: 2 * op.r } };
    }
    case "ellipse": {
      const [cx, cy] = op.c;
      const d = loopPath(cx, cy, op.rx, op.ry, rnd, amp);
      return { paths: [d], texts: [], fill: op.fill ? `M${f1(cx - op.rx)},${f1(cy)} a${f1(op.rx)},${f1(op.ry)} 0 1,0 ${f1(2 * op.rx)},0 a${f1(op.rx)},${f1(op.ry)} 0 1,0 ${f1(-2 * op.rx)},0 Z` : undefined,
        box: { x: cx - op.rx, y: cy - op.ry, w: 2 * op.rx, h: 2 * op.ry } };
    }
    case "sector": {
      const [cx, cy] = op.c;
      const pt = (deg) => [cx + op.r * Math.sin((deg * Math.PI) / 180), cy - op.r * Math.cos((deg * Math.PI) / 180)];
      const a = pt(op.fromDeg), b = pt(op.toDeg);
      const large = op.toDeg - op.fromDeg > 180 ? 1 : 0;
      const outline = `M${f1(cx)},${f1(cy)} L${f1(a[0])},${f1(a[1])} A${f1(op.r)},${f1(op.r)} 0 ${large},1 ${f1(b[0])},${f1(b[1])} Z`;
      return { paths: [outline], texts: [], fill: op.fill ? outline : undefined, box: { x: cx - op.r, y: cy - op.r, w: 2 * op.r, h: 2 * op.r } };
    }
    case "text": {
      const size = TEXT_SIZE[op.size] ?? TEXT_SIZE.m, align = op.align ?? "middle";
      return { paths: [], texts: [{ x: op.at[0], y: op.at[1], text: op.text, size, align }], box: textBox(op.text, op.size, op.at, align) };
    }
    case "label": {
      const size = TEXT_SIZE.s;
      const to = op.to ?? (op.target && byId.get(op.target) ? centreOf(opGeometry(byId.get(op.target), byId).box) : null);
      const box = textBox(op.text, "s", op.at, "middle");
      const paths = [];
      if (to) {
        // the leader leaves the label's box edge nearest the point, and stops just short of it
        const from = [clamp(to[0], box.x, box.x + box.w), to[1] < box.y ? box.y - 2 : to[1] > box.y + box.h ? box.y + box.h + 2 : clamp(to[1], box.y, box.y + box.h)];
        const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
        if (len > 8) paths.push(polyPath([from, [to[0] - (dx / len) * 4, to[1] - (dy / len) * 4]], rnd, amp * 0.6));
      }
      return { paths, texts: [{ x: op.at[0], y: op.at[1], text: op.text, size, align: "middle" }], box };
    }
    case "numwork": return numworkGeometry(op, rnd, amp);
    case "highlight": {
      const t = byId.get(op.target);
      const b = t ? opGeometry(t, byId).box : { x: 0, y: 0, w: 0, h: 0 };
      if (op.style === "underline") return { paths: [polyPath([[b.x - 4, b.y + b.h + 6], [b.x + b.w + 4, b.y + b.h + 6]], rnd, amp)], texts: [], box: b };
      if (op.style === "pulse") return { paths: [], texts: [], box: b };
      return { paths: [loopPath(b.x + b.w / 2, b.y + b.h / 2, b.w / 2 + 12, b.h / 2 + 10, rnd, amp)], texts: [], box: { x: b.x - 12, y: b.y - 10, w: b.w + 24, h: b.h + 20 } };
    }
    case "erase": {
      const t = byId.get(op.target);
      return { paths: [], texts: [], box: t ? opGeometry(t, byId).box : { x: 0, y: 0, w: 0, h: 0 } };
    }
  }
  return { paths: [], texts: [], box: { x: 0, y: 0, w: 0, h: 0 } };
}
const centreOf = (b) => [b.x + b.w / 2, b.y + b.h / 2];

/** Number work laid out by code: right-aligned columns, the rule above the result, carries above their column. */
function numworkGeometry(op, rnd, amp) {
  const fs = TEXT_SIZE.m, cw = fs * 0.9, rh = fs * 1.45;
  const [x0, y0] = op.at;
  const texts = [], paths = [];
  const rows = op.rows;
  if (op.layout === "column_add" || op.layout === "column_sub" || op.layout === "column_mul") {
    // rows[0..n-2]: operands (an optional sign cell first on the last operand); rows[n-1]: the result
    const width = Math.max(...rows.map((r) => r.filter((c) => !/^[+\-−×x]$/.test(c)).length));
    const right = x0 + (width + 1) * cw;
    rows.forEach((r, i) => {
      const sign = r.length && /^[+\-−×x]$/.test(r[0]) ? r[0] : null;
      const cells = sign ? r.slice(1) : r;
      const y = y0 + i * rh + (i === rows.length - 1 ? rh * 0.25 : 0);
      cells.forEach((c, j) => texts.push({ x: right - (cells.length - j - 0.5) * cw, y, text: c, size: fs, align: "middle" }));
      if (sign) texts.push({ x: x0 + cw * 0.3, y, text: sign, size: fs, align: "middle" });
    });
    const ry = y0 + (rows.length - 1.6) * rh + rh * 0.35;
    if (rows.length > 1) paths.push(polyPath([[x0, ry], [right + cw * 0.2, ry]], rnd, amp * 0.5));
    for (const m of op.marks ?? []) {
      const r = rows[m.row];
      if (!r) continue;
      const sign = r.length && /^[+\-−×x]$/.test(r[0]);
      const n = r.length - (sign ? 1 : 0);
      const cx = right - (n - (m.col - (sign ? 1 : 0)) - 0.5) * cw, cy = y0 + m.row * rh;
      if (m.kind === "circle") paths.push(loopPath(cx, cy - fs * 0.35, cw * 0.55, fs * 0.6, rnd, amp));
      else if (m.kind === "tick") paths.push(`M${f1(cx + cw * 0.4)},${f1(cy - fs * 0.3)} l6,7 l12,-16`);
    }
    const carries = (op.marks ?? []).filter((m) => m.kind === "carry" || m.kind === "borrow");
    for (const m of carries) {
      const r = rows[m.row];
      if (!r || !r[m.col]) continue;
      // a carry is written small, above the column it carries into (its cell holds the digit)
      texts.push({ x: right - (r.length - m.col - 0.5) * cw, y: y0 - rh * 0.55, text: r[m.col], size: fs * 0.62, align: "middle", small: true });
    }
    return { paths, texts, box: { x: x0, y: y0 - rh, w: right - x0 + cw, h: rows.length * rh + rh * 0.6 } };
  }
  if (op.layout === "fraction") {
    // rows[0]: numerators and operators, rows[1]: denominators (blank under an operator); a bar under each fraction
    const top = rows[0] ?? [], bot = rows[1] ?? [];
    const n = Math.max(top.length, bot.length);
    for (let j = 0; j < n; j++) {
      const cx = x0 + (j + 0.5) * cw * 1.6;
      const t = top[j] ?? "", b = bot[j] ?? "";
      if (b) {
        texts.push({ x: cx, y: y0, text: t, size: fs, align: "middle" });
        texts.push({ x: cx, y: y0 + rh, text: b, size: fs, align: "middle" });
        paths.push(polyPath([[cx - cw * 0.6, y0 + rh * 0.3], [cx + cw * 0.6, y0 + rh * 0.3]], rnd, amp * 0.4));
      } else if (t) texts.push({ x: cx, y: y0 + rh * 0.5, text: t, size: fs, align: "middle" });
    }
    return { paths, texts, box: { x: x0, y: y0 - rh, w: n * cw * 1.6, h: rh * 2.4 } };
  }
  if (op.layout === "number_line") {
    const [a, b] = op.range;
    const W = Math.max(160, (rows[0]?.length ?? 6) * cw * 2.2);
    const xOf = (v) => x0 + 12 + ((v - a) / (b - a)) * (W - 24);
    paths.push(polyPath([[x0, y0], [x0 + W, y0]], rnd, amp * 0.4));
    const span = b - a, step = span <= 20 ? 1 : span <= 100 ? 10 : Math.pow(10, Math.floor(Math.log10(span)) - 1) * 5;
    let ticks = 0;
    for (let v = Math.ceil(a / step) * step; v <= b + 1e-9 && ticks < 41; v += step, ticks++) paths.push(`M${f1(xOf(v))},${f1(y0 - 7)} L${f1(xOf(v))},${f1(y0 + 7)}`);
    for (const c of rows[0] ?? []) {
      const v = Number(c);
      if (Number.isFinite(v) && v >= a && v <= b) texts.push({ x: xOf(v), y: y0 + rh * 0.95, text: c, size: fs * 0.8, align: "middle" });
    }
    return { paths, texts, box: { x: x0, y: y0 - 10, w: W, h: rh * 1.3 } };
  }
  // equation / long_div: one row per line, left-aligned tokens (long_div: rows[0] = [divisor, dividend], below = steps)
  rows.forEach((r, i) => {
    const line = r.join(" ");
    texts.push({ x: x0, y: y0 + i * rh, text: line, size: fs, align: "start" });
  });
  if (op.layout === "long_div" && rows[0]?.length >= 2) {
    const dv = textBox(rows[0][0] + " ", "m", [x0, y0], "start");
    paths.push(polyPath([[dv.x + dv.w, y0 + 6], [dv.x + dv.w, y0 - fs], [dv.x + dv.w + Math.max(40, rows[0][1].length * fs * ADVANCE + 12), y0 - fs]], rnd, amp * 0.4));
  }
  const w = Math.max(...rows.map((r) => textBox(r.join(" "), "m", [x0, y0], "start").w), 20);
  return { paths, texts, box: { x: x0, y: y0 - rh * 0.8, w, h: rows.length * rh } };
}

// ───────────────────────────── lint (the strict render-check's layout half) ─────────────────────────────

/**
 * Layout checks the renderer cannot fix by clamping: text running off the board, and two texts that overlap at the same
 * moment. Returns [] for a clean board. Used by the template render-check (evals/forge-explainer.mjs, tests) and W2-F's
 * whiteboard archetype gate.
 */
export function lintScript(script) {
  const issues = [];
  const byId = new Map(script.ops.map((o) => [o.id, o]));
  const er = erasers(script);
  const { w: BW, h: BH } = script.board;
  const textOps = [];
  for (const o of script.ops) {
    const g = opGeometry(o, byId);
    const b = g.box;
    if (b.x < -2 || b.y < -2 || b.x + b.w > BW + 2 || b.y + b.h > BH + 2) issues.push({ id: o.id, check: "inside_board", detail: b });
    if (o.op === "text" || o.op === "label" || o.op === "numwork") textOps.push({ o, b });
  }
  for (let i = 0; i < textOps.length; i++) {
    for (let j = i + 1; j < textOps.length; j++) {
      const A = textOps[i], B = textOps[j];
      // only texts that are on the board at the same time (neither erased before the other appears)
      const aGone = er.get(A.o.id)?.endMs ?? Infinity, bGone = er.get(B.o.id)?.endMs ?? Infinity;
      if (aGone <= B.o.startMs || bGone <= A.o.startMs) continue;
      const ix = Math.min(A.b.x + A.b.w, B.b.x + B.b.w) - Math.max(A.b.x, B.b.x);
      const iy = Math.min(A.b.y + A.b.h, B.b.y + B.b.h) - Math.max(A.b.y, B.b.y);
      if (ix > 3 && iy > 3) issues.push({ id: `${A.o.id}+${B.o.id}`, check: "text_overlap", detail: { ix: Math.round(ix), iy: Math.round(iy) } });
    }
  }
  return issues;
}
