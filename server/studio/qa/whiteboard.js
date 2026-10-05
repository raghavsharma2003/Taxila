// The whiteboard archetype's gate (owner priority 6; whiteboard-by-drawing-script-2026-10-04): a model writes the
// drawing SCRIPT for one spoken line, our code draws it (shared/whiteboard.js + src/modules/whiteboard/**). The script
// is a child-visible artifact, so it passes a strict gate before it is drawn. Pure code, no browser, < 10 ms:
//
//   W0 shape        strict normalise (shared/whiteboard.js): every op valid, ids unique, targets exist, no clamping needed
//   W1 fits stage   board size and aspect the tray holds; the smallest text ≥ 11 CSS px at the phone tray; nothing
//                   outside the board (lint inside_board)
//   W2 no overlap   no two texts on the board at the same moment overlap (lint text_overlap)
//   W3 anchored     every label has a leader (to / target) that ends ON or beside a drawn shape that is on the board then
//   W4 numbers      every number drawn is in her line or in the verified kit (or is a result the gate re-computes:
//                   column sums, products, equal-sides equations, the ticks of a number line she named); arithmetic on
//                   the board is CORRECT
//   W5 words        every word drawn is her line's or the kit's (labels shorten, never add a claim)
//   W6 timing       draws in step with her voice: starts within 1.5 s, ends by the end of her line (+2 s), spread over
//                   the line (not everything at t = 0), sane stroke durations
//   W7 register     labels, numbers and short terms only (≤ 4 words, never a sentence); the local safety predicates
//   W8 counts       a whole drawn in equal parts has her number of parts; a round whole is never cut by lines
//   W9 no reveal    nothing drawn equals the answer of a kit item (the one being asked, or one still to come) unless she
//                   says that value in this line: a drawn number, a result the gate re-computes, a number-line tick or a
//                   dot placed at the answer's position, and the current item's word answer (owner priority 1: the board
//                   must never answer the question she is asking, or the covert-comprehension signal is corrupt)
//
// gateWhiteboard(raw, ctx) → { pass, checks, script, facts }.  The script returned is the normalised one (draw this).
import { normalizeScript, lintScript, opGeometry, textBox, TEXT_SIZE, scriptFacts } from "../../../shared/whiteboard.js";
import { kitVocabulary, unknownWords, stem } from "../../forge/explainer/truth.js";
import { SEVERE, MILD, PII } from "../../forge/g2/safety.js";
import { PHONE_TRAY } from "../archetypes/index.js";
import { numbersIn as phraseNumbers } from "../../comprehension/grade/numbers.js";
import { NUMBER_WORDS, cardinalOf } from "../../voice/translit/numbers.js";

export const WB_GATE_VERSION = "wb-gate@2";
/** Speech rate used for the line's duration when no DeliveryPlan is known (HUMAN-VOICE HV-15: 11-13 chars/s). */
export const CHARS_PER_SEC = 12;
export const MIN_TEXT_PX = 11;

// ───────────────────────────── numbers ─────────────────────────────

const WORD_NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, che: 6, saat: 7, aath: 8, nau: 9, das: 10, gyarah: 11, barah: 12,
  shunya: 0, sau: 100, hazaar: 1000 };
const FRAC_WORD = { half: 2, halves: 2, aadha: 2, adha: 2, third: 3, thirds: 3, tihai: 3, fourth: 4, fourths: 4, quarter: 4, quarters: 4, chauthai: 4,
  fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7, eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10 };
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
/** A canonical string for a number or fraction token ("3/6" stays "3/6": the board must write what was said). */
const canon = (t) => String(t).replace(/^0+(?=\d)/, "");

/** Every number a text carries: digits (12, 3.5, 3/4, 45,000), number words (ek, four), fraction words (one-fourth). */
export function numbersIn(text) {
  const out = new Set();
  const s = String(text ?? "").toLowerCase();
  for (const m of s.matchAll(/\d[\d,]*(?:\.\d+)?(?:\s*\/\s*\d+)?/g)) {
    const t = m[0].replace(/\s+/g, "");
    if (t.includes("/")) { out.add(canon(t)); const [n, d] = t.split("/"); out.add(canon(n.replace(/,/g, ""))); out.add(canon(d)); }
    else { const plain = t.replace(/,(?=\d{2,3}\b)/g, ""); out.add(canon(plain.replace(/,$/, ""))); }
  }
  const words = s.match(/[\p{L}]+/gu) ?? [];
  // number words past twelve, both languages (the comprehension normaliser's phrase reader: "twenty-five", "pachchis",
  // "teen sau"; the translit table's Roman Hindi 0-99: "chaubees", "pachees"), and "teen bata aath" as 3/8
  // (read per clause and never across "aur" / "and": "pachees aur twenty-five" is 25 and 25, not 50)
  try { for (const part of s.split(/[,.;:?!]|\baur\b|\band\b/)) for (const v of phraseNumbers(part)) if (Number.isInteger(v) && v >= 0) out.add(String(v)); } catch { /* the gate never throws on a line */ }
  const cardinal = (w) => (WORD_NUM[w] !== undefined ? WORD_NUM[w] : NUMBER_WORDS[w] ? (cardinalOf(NUMBER_WORDS[w]) >= 0 ? cardinalOf(NUMBER_WORDS[w]) : undefined) : /^\d+$/.test(w ?? "") ? Number(w) : undefined);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const c = cardinal(w);
    if (c !== undefined) out.add(String(c));
    if ((w === "bata" || w === "by" || w === "upon") && cardinal(words[i - 1]) !== undefined && cardinal(words[i + 1]) > 0) out.add(`${cardinal(words[i - 1])}/${cardinal(words[i + 1])}`);
    if (FRAC_WORD[w] !== undefined) {
      const d = FRAC_WORD[w]; out.add(String(d));
      const prev = WORD_NUM[words[i - 1]] ?? (/^\d+$/.test(words[i - 1] ?? "") ? Number(words[i - 1]) : null);
      out.add(`${prev ?? 1}/${d}`);
      if (prev == null) out.add("1");
    }
  }
  return out;
}

/**
 * The kit's numbers: item prompts, the worked example (steps and answer), expectations, diagnostics. NEVER an item's
 * answer or acceptable forms: an answer is not a number the board may draw (W9; the worked example is taught openly).
 */
export function kitNumbers(kit) {
  const parts = [];
  const add = (x) => { if (x != null) parts.push(String(x)); };
  for (const e of kit?.expectations ?? []) add(e);
  for (const i of kit?.items ?? []) { add(i.prompt_en); add(i.prompt_hi); }
  const we = kit?.workedExample; if (we) { add(we.problem); for (const s of we.steps ?? []) add(s); add(we.answer); }
  for (const m of kit?.misconceptions ?? []) { add(m.diagnostic?.prompt_en); for (const o of m.diagnostic?.options ?? []) add(o.text); }
  return numbersIn(parts.join(" \n "));
}

/** A rational from a token ("3", "3.5", "3/4") → [n, d] or null. */
function rat(t) {
  const s = String(t).replace(/,/g, "").trim();
  let m = /^(-?\d+)\/(\d+)$/.exec(s); if (m) return +m[2] ? [Number(m[1]), Number(m[2])] : null;
  m = /^(-?\d+)(?:\.(\d+))?$/.exec(s); if (!m) return null;
  if (!m[2]) return [Number(m[1]), 1];
  return [Number(m[1] + m[2]), 10 ** m[2].length];   // "-3.25" → [-325, 100]
}
const rEq = (a, b) => a && b && a[0] * b[1] === b[0] * a[1];
const rOp = (a, op, b) => {
  if (!a || !b) return null;
  if (op === "+") return [a[0] * b[1] + b[0] * a[1], a[1] * b[1]];
  if (op === "-" || op === "−") return [a[0] * b[1] - b[0] * a[1], a[1] * b[1]];
  if (op === "×" || op === "x" || op === "*") return [a[0] * b[0], a[1] * b[1]];
  if (op === "÷" || op === ":") return b[0] ? [a[0] * b[1], a[1] * b[0]] : null;
  return null;
};
/** The value tokens of an answer string: whole tokens ("5/8", "24,360", "3.5"), else a fraction word ("five-eighths"). */
function valueTokens(text) {
  const s = String(text ?? "");
  const digits = (s.match(/-?\d[\d,]*(?:\.\d+)?(?:\s*\/\s*\d+)?/g) ?? []).map((t) => t.replace(/\s+/g, "").replace(/,/g, ""));
  if (digits.length) return digits;
  return [...numbersIn(s)].filter((t) => t.includes("/") || numbersIn(s).size === 1);
}

/**
 * W9's withheld values: the answer and acceptable forms of every kit item (the current one first, by id: the StudioAsk
 * carries no ledger of items already asked, so every item counts as still to come), minus any value she says in this
 * line (she may name it herself on a re-teach, or read out an item's choices; the board then only repeats her). A value
 * the item's prompt shows is still withheld ("Mark 7 on the number line": the 7 marked IS the answer). Word answers (≤ 3 words) are withheld
 * for the current item only. → { values: string[], words: string[] }
 * @param {any} kit  @param {{ itemId?: string, line?: string }} [o]
 */
export function withheldValues(kit, { itemId, line = "" } = {}) {
  const said = [...numbersIn(line)].map(rat).filter(Boolean);
  const items = [...(kit?.items ?? [])].sort((a, b) => (b?.id === itemId) - (a?.id === itemId));
  const values = [], words = [];
  const lineWords = new Set(String(line).toLowerCase().match(/[\p{L}\p{M}]+/gu) ?? []);
  for (const i of items) {
    for (const a of [i?.answer, ...(i?.acceptable ?? [])]) {
      if (a == null) continue;
      const toks = valueTokens(a);
      for (const t of toks) {
        const r = rat(t);
        if (r && !said.some((x) => rEq(x, r)) && !values.some((v) => rEq(rat(v), r))) values.push(t);
      }
      if (!toks.length && i?.id === itemId) {
        const w = String(a).toLowerCase().trim();
        const ws = w.match(/[\p{L}\p{M}]+/gu) ?? [];
        if (ws.length && ws.length <= 3 && !ws.every((x) => lineWords.has(x))) words.push(w);
      }
    }
  }
  return { values, words };
}

/** Evaluate "a op b op c" left to right with × ÷ first; null when it is not pure arithmetic. */
function evalSide(tokens) {
  if (!tokens.length) return null;
  const vals = [], ops = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0) { const r = rat(tokens[i]); if (!r) return null; vals.push(r); }
    else { if (!/^[+\-−×x*÷:]$/.test(tokens[i])) return null; ops.push(tokens[i]); }
  }
  if (vals.length !== ops.length + 1) return null;
  for (let i = 0; i < ops.length;) { if (/[×x*÷:]/.test(ops[i])) { vals.splice(i, 2, rOp(vals[i], ops[i], vals[i + 1])); ops.splice(i, 1); if (!vals[i]) return null; } else i++; }
  let acc = vals[0];
  for (let i = 0; i < ops.length; i++) { acc = rOp(acc, ops[i], vals[i + 1]); if (!acc) return null; }
  return acc;
}
/** "3/4 + 1/4 = 1" style rows: tokens split on spaces and around operators. */
const eqTokens = (s) => String(s).replace(/([+\-−×*÷=])/g, " $1 ").trim().split(/\s+/).filter(Boolean);

/**
 * Numbers an op draws, and any arithmetic it states (with the gate's verdict). → { nums: string[], derived: string[], wrong: string[] }
 * `derived`: results the gate re-computed and found true (allowed although not said); `wrong`: false arithmetic.
 */
function opNumbers(o, allowed) {
  const nums = [], derived = [], wrong = [];
  const tokensOf = (t) => String(t).match(/\d[\d,]*(?:\.\d+)?(?:\/\d+)?/g) ?? [];
  if (o.op === "text" || o.op === "label") {
    const t = String(o.text);
    for (const tok of tokensOf(t)) nums.push(canon(tok.replace(/,(?=\d{3}\b)/g, "")));
    if (t.includes("=")) {
      const [l, r] = t.split("=");
      const a = evalSide(eqTokens(l)), b = evalSide(eqTokens(r));
      if (a && b) { if (rEq(a, b)) derived.push(...tokensOf(r).map(canon)); else wrong.push(t); }
    }
  } else if (o.op === "numwork") {
    const rowNum = (r) => r.filter((c) => !/^[+\-−×x*]$/.test(c)).join("");
    if (["column_add", "column_sub", "column_mul"].includes(o.layout)) {
      const rows = o.rows.map(rowNum).filter((x) => /^\d+$/.test(x));
      if (rows.length >= 2) {
        const operands = rows.slice(0, -1).map(Number), res = Number(rows.at(-1));
        nums.push(...rows.slice(0, -1));
        const want = o.layout === "column_add" ? operands.reduce((s, x) => s + x, 0)
          : o.layout === "column_sub" ? operands[0] - operands.slice(1).reduce((s, x) => s + x, 0) : operands.reduce((s, x) => s * x, 1);
        if (want === res) derived.push(String(res)); else { wrong.push(`${o.layout} ${rows.join(" | ")} (want ${want})`); nums.push(String(res)); }
      } else nums.push(...rows);
    } else if (o.layout === "fraction") {
      const top = o.rows[0] ?? [], bot = o.rows[1] ?? [];
      const toks = top.map((t, j) => (bot[j] ? `${t}/${bot[j]}` : t)).filter((t) => t !== "");
      const eq = toks.indexOf("=");
      for (const t of toks) if (/\d/.test(t)) nums.push(canon(t));
      if (eq > 0) {
        const a = evalSide(toks.slice(0, eq)), b = evalSide(toks.slice(eq + 1));
        if (a && b) { if (rEq(a, b)) derived.push(...toks.slice(eq + 1).filter((t) => /\d/.test(t)).map(canon)); else wrong.push(toks.join(" ")); }
      }
    } else if (o.layout === "equation") {
      for (const r of o.rows) {
        const line = r.join(" ");
        for (const tok of tokensOf(line)) nums.push(canon(tok));
        if (line.includes("=")) {
          const sides = line.split("=");
          const vals = sides.map((s) => evalSide(eqTokens(s)));
          if (vals.every(Boolean)) { if (vals.every((v) => rEq(v, vals[0]))) for (const s of sides.slice(1)) derived.push(...tokensOf(s).map(canon)); else wrong.push(line); }
        }
      }
    } else if (o.layout === "number_line") {
      const [a, b] = o.range;
      nums.push(...[a, b].map(String).filter((x) => !["0", "1"].includes(x)));
      // tick labels inside a range she named: k/d for a denominator she said, or whole numbers of a short range
      const dens = [...allowed].filter((x) => /^\d+$/.test(x) && +x >= 2 && +x <= 12).map(Number);
      for (const c of o.rows[0] ?? []) {
        const r = rat(c); if (!r) continue;
        const v = r[0] / r[1];
        const inRange = v >= a - 1e-9 && v <= b + 1e-9;
        const tick = inRange && (r[1] === 1 ? b - a <= 20 : dens.includes(r[1]));
        if (tick) derived.push(canon(c)); else nums.push(canon(c));
      }
    } else {
      for (const r of o.rows) for (const c of r) for (const tok of tokensOf(c)) nums.push(canon(tok));
    }
  }
  // a placeholder for the answer ("1/?", "3/__", "□/8": the setup of a question, W9's shape) carries only its digits
  const holder = /[?_□]/;
  return { nums: nums.flatMap((t) => (holder.test(t) ? t.match(/\d+/g) ?? [] : [t])), derived, wrong };
}

/** Is a drawn number allowed: said, in the kit, re-computed true, or a proper fraction of two said counts. */
function numberAllowed(t, allowed, derived) {
  if (allowed.has(t) || derived.has(t)) return true;
  const m = /^(\d+)\/(\d+)$/.exec(t);
  if (m) { const n = +m[1], d = +m[2]; return n <= d && allowed.has(String(d)) && (allowed.has(String(n)) || n === 1); }
  return false;
}

// ───────────────────────────── picture counts and legibility ─────────────────────────────

const PART_WORDS = "parts?|gaps?|groups?|pieces?|slices?|hisse|hisson|hissa|tukde|tukdon|tukda|barabar|equal|columns?|rows?|boxes?|jagah|samaan";
/** Counts her line gives a partition ("4 equal parts", "do barabar hisse", "one-eighth" → 8). */
export function partitionCounts(text) {
  const s = String(text ?? "").toLowerCase();
  const out = new Set();
  const num = (w) => (/^\d+$/.test(w) ? Number(w) : WORD_NUM[w]);
  for (const m of s.matchAll(new RegExp(`\\b(\\d+|${Object.keys(WORD_NUM).join("|")})(?:[\\s-]+(?:${PART_WORDS})){1,3}\\b`, "g"))) { const n = num(m[1]); if (n >= 2 && n <= 24) out.add(n); }
  for (const w of s.match(/[\p{L}]+/gu) ?? []) if (FRAC_WORD[w]) out.add(FRAC_WORD[w]);
  for (const m of s.matchAll(/\b(\d+)\s*\/\s*(\d+)\b/g)) { const d = +m[2]; if (d >= 2 && d <= 24) out.add(d); }
  return out;
}
/** Families of equal shapes: sectors of one circle, boxes of one size, circles of one radius (each ≥ 2 members). */
function shapeFamilies(ops) {
  const fam = new Map();
  const key = (o) => o.op === "sector" ? `sector@${Math.round(o.c[0] / 4)},${Math.round(o.c[1] / 4)},${Math.round(o.r / 4)}`
    : o.op === "rect" ? `rect@${Math.round(o.w / 3)}x${Math.round(o.h / 3)}` : o.op === "circle" && o.r < 40 ? `dot@${Math.round(o.r / 3)}` : null;
  for (const o of ops) { const k = key(o); if (k) fam.set(k, [...(fam.get(k) ?? []), o]); }
  return [...fam].filter(([, v]) => v.length >= 2).map(([k, v]) => ({ kind: k.split("@")[0], n: v.length }));
}
/** A circle cut by line strokes through (near) its centre: the parts cannot be checked equal; sectors can. */
function circleCutByLines(ops) {
  const out = [];
  for (const c of ops.filter((o) => o.op === "circle" && o.r >= 30)) {
    const through = ops.filter((o) => (o.op === "line" || o.op === "stroke") && (() => {
      const pts = o.op === "line" ? [o.from, o.to] : [o.points[0], o.points.at(-1)];
      const [a, b] = pts; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const dist = Math.abs(dy * c.c[0] - dx * c.c[1] + b[0] * a[1] - b[1] * a[0]) / L;   // centre to the line
      const near = (p) => Math.abs(Math.hypot(p[0] - c.c[0], p[1] - c.c[1]) - c.r) <= c.r * 0.25 || Math.hypot(p[0] - c.c[0], p[1] - c.c[1]) <= 6;
      return dist <= 8 && near(a) && near(b);
    })());
    if (through.length >= 1) out.push(`${c.id} cut by ${through.length} line(s)`);
  }
  return out;
}
/** The straight segments a script draws that words must not sit on: lines, arrow shafts, box edges. */
export function segmentsOf(ops) {
  const segs = [];
  for (const o of ops) {
    if (o.op === "line" || o.op === "arrow") segs.push({ id: o.id, a: o.from, b: o.to });
    if (o.op === "rect") { const [x, y] = o.at; const X = x + o.w, Y = y + o.h; segs.push({ id: o.id, a: [x, y], b: [X, y] }, { id: o.id, a: [X, y], b: [X, Y] }, { id: o.id, a: [X, Y], b: [x, Y] }, { id: o.id, a: [x, Y], b: [x, y] }); }
  }
  return segs;
}
/** Does segment p-q cross box b (Liang-Barsky)? */
export function segHitsBox(p, q, b) {
  let t0 = 0, t1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
  for (const [pp, qq] of [[-dx, p[0] - b.x], [dx, b.x + b.w - p[0]], [-dy, p[1] - b.y], [dy, b.y + b.h - p[1]]]) {
    if (pp === 0) { if (qq < 0) return false; continue; }
    const r = qq / pp; if (pp < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 <= t1;
}
/** A word box shrunk 2 units on each side (touching a line is fine, crossing it is not). */
export const innerBox = (g) => ({ x: g.x + 2, y: g.y + 2, w: Math.max(0, g.w - 4), h: Math.max(0, g.h - 4) });
/** Text / label boxes crossed by a line, an arrow shaft or a box edge. */
function textsCrossed(ops, byId) {
  const segs = segmentsOf(ops);
  const out = [];
  for (const o of ops) {
    if (o.op !== "text" && o.op !== "label") continue;
    const b = innerBox(opGeometry(o.op === "label" ? { ...o, to: undefined, target: undefined } : o, byId).box);
    for (const s of segs) if (s.id !== o.id && segHitsBox(s.a, s.b, b)) { out.push(`${o.id}×${s.id}`); break; }
  }
  return out;
}

// ───────────────────────────── W9: no reveal ─────────────────────────────

/** Labels of a number line that are its axis (≥ 4 evenly spaced values), not a marked target. */
function axisLabels(cells) {
  const vs = cells.map(rat).filter(Boolean).map((r) => r[0] / r[1]);
  if (vs.length < 4) return false;
  const d = vs[1] - vs[0];
  return d > 0 && vs.every((v, i) => !i || Math.abs(v - vs[i - 1] - d) < 1e-9);
}
const escRe = (w) => String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Every place the board shows a withheld answer: a drawn or re-computed number equal to it (rational equality: 10/16
 * matches 5/8), a number-line tick labelled with it (an evenly spaced axis is not a target), a dot or an arrow head at its
 * position on a number line, or the current item's word answer written. → string[] (op id: what)
 */
export function revealsOf(ops, per, byId, texts, withhold) {
  const values = (Array.isArray(withhold) ? withhold : withhold?.values ?? []).map((t) => ({ t: String(t), r: rat(t) })).filter((x) => x.r);
  const words = Array.isArray(withhold) ? [] : (withhold?.words ?? []).map(String).filter(Boolean);
  if (!values.length && !words.length) return [];
  const out = [];
  const hit = (tok) => { const r = rat(tok); return r ? values.find((x) => rEq(x.r, r)) : null; };
  ops.forEach((o, k) => {
    const axis = o.op === "numwork" && o.layout === "number_line" && axisLabels(o.rows?.[0] ?? []);
    // a bare "0" or "1" (the origin or the whole of a number line, a place-value column) marks the board, it is not a
    // result; "5 − 5 = 0" or "3/4 + 1/4 = 1" still is (bench 2026-10-05: an origin labelled 0 was refused)
    const bare = (o.op === "text" || o.op === "label") && /^\s*[01]\s*$/.test(String(o.text));
    for (const tok of [...per[k].nums, ...per[k].derived]) {
      if (bare) continue;
      if (axis && (o.rows?.[0] ?? []).some((c) => canon(c) === tok)) continue;
      const h = hit(tok); if (h) out.push(`${o.id}: ${tok} = answer ${h.t}`);
    }
  });
  // a number line with its answer marked by position: a dot (small circle) or an arrow head at the answer's tick
  for (const nl of ops.filter((o) => o.op === "numwork" && o.layout === "number_line" && Array.isArray(o.range))) {
    let box; try { box = opGeometry(nl, byId).box; } catch { continue; }
    const [a, b] = nl.range, y0 = nl.at[1];
    const xOf = (v) => box.x + 12 + ((v - a) / (b - a)) * (box.w - 24);
    for (const { t, r } of values) {
      const v = r[0] / r[1];
      if (v <= a + 1e-9 || v >= b - 1e-9) continue;
      const x = xOf(v);
      const near = (p) => Array.isArray(p) && Math.abs(p[0] - x) <= 6 && Math.abs(p[1] - y0) <= 22;
      const marks = ops.filter((o) => (o.op === "circle" && o.r <= 12 && near(o.c)) || (o.op === "arrow" && near(o.to)) || (o.op === "label" && near(o.to)));
      for (const m of marks) out.push(`${m.id}: marks ${t} on ${nl.id}`);
    }
  }
  for (const w of words) for (const t of texts) if (new RegExp(`(^|[^\\p{L}\\p{M}])${escRe(w)}($|[^\\p{L}\\p{M}])`, "iu").test(t)) out.push(`word: ${w}`);
  return [...new Set(out)];
}

// ───────────────────────────── the gate ─────────────────────────────

/**
 * @param {unknown} raw the model's script (already expanded to WhiteboardScript shape)
 * @param {{ reply: string, kit?: any, band?: string, speechMs?: number, extraNumbers?: string[], extraWords?: string[], banned?: string[], prior?: any[],
 *   withhold?: { values: string[], words?: string[] } | string[] }} ctx
 *   prior: the previous board's ops when this script continues it (mode "continue"): new words must not land on them
 *   withhold: answers the board must not show (withheldValues(kit, { itemId, line })); W9
 * @returns {{ pass: boolean, checks: {id:string, pass:boolean, detail?:unknown}[], script: any | null, facts: any | null }}
 */
export function gateWhiteboard(raw, ctx) {
  const checks = [];
  const add = (id, pass, detail = "") => { checks.push({ id, pass: !!pass, detail }); return !!pass; };
  const strict = normalizeScript(raw, { strict: true });
  add("W0.shape", strict.ok, strict.errors.slice(0, 6));
  const lenient = strict.ok ? strict : normalizeScript(raw);
  const script = lenient.script;
  if (!script) return { pass: false, checks, script: null, facts: null };
  const ops = script.ops;
  const byId = new Map(ops.map((o) => [o.id, o]));
  // W1 fits the stage: an aspect the tray holds (0.75..2), the smallest text legible at the phone tray
  const { w: BW, h: BH } = script.board;
  const aspect = BW / BH;
  const scale = Math.min(PHONE_TRAY.w / BW, PHONE_TRAY.h / BH);
  const sizes = ops.filter((o) => o.op === "text" || o.op === "label" || o.op === "numwork")
    .map((o) => (o.op === "text" ? TEXT_SIZE[o.size] ?? TEXT_SIZE.m : o.op === "label" ? TEXT_SIZE.s : TEXT_SIZE.m * (o.marks?.some((m) => m.kind === "carry") ? 0.62 : 1)));
  const minPx = sizes.length ? Math.min(...sizes) * scale : Infinity;
  const lint = lintScript(script);
  const outside = lint.filter((i) => i.check === "inside_board");
  add("W1.fits_stage", aspect >= 0.75 && aspect <= 2 && minPx >= MIN_TEXT_PX && outside.length === 0,
    { board: [BW, BH], minTextPx: Number.isFinite(minPx) ? +minPx.toFixed(1) : null, outside: outside.slice(0, 3).map((i) => i.id) });
  // a "continue" board draws on the previous one (ctx.prior: its ops, complete): new words must not land on old words
  const priorBoxes = (ctx.prior ?? []).filter((o) => o && (o.op === "text" || o.op === "label" || o.op === "numwork")).map((o) => {
    try { return { id: o.id, b: opGeometry(o.op === "label" ? { ...o, to: undefined, target: undefined } : o, new Map((ctx.prior ?? []).map((x) => [x.id, x]))).box }; } catch { return null; }
  }).filter(Boolean);
  const overPrior = [];
  for (const o of ops.filter((x) => x.op === "text" || x.op === "label" || x.op === "numwork")) {
    const b = opGeometry(o.op === "label" ? { ...o, to: undefined, target: undefined } : o, byId).box;
    for (const p of priorBoxes) if (Math.min(b.x + b.w, p.b.x + p.b.w) - Math.max(b.x, p.b.x) > 3 && Math.min(b.y + b.h, p.b.y + p.b.h) - Math.max(b.y, p.b.y) > 3) { overPrior.push(`${o.id}+prior:${p.id}`); break; }
  }
  const overlapIds = lint.filter((i) => i.check === "text_overlap").map((i) => i.id);
  add("W2.no_text_overlap", overlapIds.length === 0 && overPrior.length === 0, [...overlapIds, ...overPrior].slice(0, 3));
  // W3 labels anchored: a leader (to / target) that ends on or within 30 units of a drawn shape on the board then
  const shapes = ops.filter((o) => !["text", "label", "numwork", "highlight", "erase"].includes(o.op));
  const erasedAt = new Map(ops.filter((o) => o.op === "erase").map((o) => [o.target, o.startMs]));
  const unanchored = [];
  for (const l of ops.filter((o) => o.op === "label")) {
    const end = l.to ?? (l.target && byId.get(l.target) ? (() => { const b = opGeometry(byId.get(l.target), byId).box; return [b.x + b.w / 2, b.y + b.h / 2]; })() : null);
    if (!end) { unanchored.push(`${l.id}: no leader`); continue; }
    const near = shapes.some((s) => {
      if (s.startMs > l.endMs + 1500 || (erasedAt.get(s.id) ?? Infinity) <= l.startMs) return false;
      const b = opGeometry(s, byId).box;
      const g = Math.hypot(Math.max(b.x - end[0], 0, end[0] - (b.x + b.w)), Math.max(b.y - end[1], 0, end[1] - (b.y + b.h)));
      return g <= 30;
    });
    if (!near) unanchored.push(`${l.id}: leader ends on nothing`);
    // the label's own text must not sit far away from where its leader points (a long leader across the board)
    const box = textBox(l.text, "s", l.at, "middle");
    const len = Math.hypot(Math.max(box.x - end[0], 0, end[0] - (box.x + box.w)), Math.max(box.y - end[1], 0, end[1] - (box.y + box.h)));
    if (len > Math.max(BW, BH) * 0.45) unanchored.push(`${l.id}: leader ${Math.round(len)} long`);
  }
  add("W3.labels_anchored", unanchored.length === 0, unanchored.slice(0, 4));
  // W4 numbers from truth, arithmetic correct
  const allowed = new Set([...numbersIn(ctx.reply), ...(ctx.kit ? kitNumbers(ctx.kit) : []), ...(ctx.extraNumbers ?? []).map(String)]);
  const derived = new Set();
  const per = ops.map((o) => opNumbers(o, allowed));
  for (const p of per) for (const d of p.derived) derived.add(d);
  const invented = [...new Set(per.flatMap((p) => p.nums).filter((t) => !numberAllowed(t, allowed, derived)))];
  const wrong = per.flatMap((p) => p.wrong);
  add("W4.numbers_from_truth", invented.length === 0 && wrong.length === 0, { invented: invented.slice(0, 5), wrong: wrong.slice(0, 3) });
  // W5 words: her line's words or the kit's (stemmed), how-to words free
  const vocab = new Set(ctx.kit ? kitVocabulary(ctx.kit) : []);
  for (const w of String(ctx.reply ?? "").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) { vocab.add(stem(w)); vocab.add(w); }
  for (const w of ctx.extraWords ?? []) vocab.add(stem(String(w).toLowerCase()));
  const texts = ops.flatMap((o) => (o.op === "text" || o.op === "label" ? [o.text] : []));
  const unknown = [...new Set(texts.flatMap((t) => unknownWords(t, vocab).filter((w) => !/^\d/.test(w))))];
  add("W5.words_from_line_or_kit", unknown.length === 0, unknown.slice(0, 6));
  // W6 timing, in step with her voice
  const speechMs = ctx.speechMs ?? Math.round((String(ctx.reply ?? "").length / CHARS_PER_SEC) * 1000);
  const drawn = ops.filter((o) => o.op !== "erase" && o.op !== "highlight");
  const first = Math.min(...drawn.map((o) => o.startMs));
  const lastStart = Math.max(...drawn.map((o) => o.startMs));
  const lastEnd = Math.max(...ops.map((o) => o.endMs));
  const badDur = drawn.filter((o) => { const d = o.endMs - o.startMs; return d > 6000 || (["stroke", "line", "arrow", "rect", "circle", "ellipse", "polygon", "sector"].includes(o.op) && d < 120); }).map((o) => o.id);
  const spread = drawn.length < 4 || lastStart >= speechMs * 0.35;
  add("W6.timing", first <= 1500 && lastEnd <= speechMs + 2000 && spread && badDur.length === 0,
    { first, lastStart, lastEnd, speechMs, spread, badDur: badDur.slice(0, 3) });
  // W7 register: labels and short terms, never sentences; the local safety predicates
  // words with letters only: "1/2 × 1/3 = 1/6" is number work, not a sentence
  const long = texts.filter((t) => t.trim().split(/\s+/).filter((w) => /\p{L}/u.test(w)).length > 4);
  // never a person's name on the board (the child's name, a teacher's: the caller lists them)
  const banned = (ctx.banned ?? []).filter((w) => w && String(w).length > 1).map((w) => String(w).toLowerCase());
  const named = texts.filter((t) => banned.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(t)));
  if (named.length) long.push(...named.map((t) => `name: ${t}`));
  const unsafe = texts.filter((t) => SEVERE.some((re) => re.test(t)) || MILD.some((re) => re.test(t)) || PII.some((re) => re.test(t)));
  add("W7.register", long.length === 0 && unsafe.length === 0, { long: long.slice(0, 2), unsafe: unsafe.slice(0, 2) });
  // W8 the picture's counts are her counts: a whole drawn in equal parts (sectors of one circle, equal boxes, equal
  // circles) has as many parts as she says; a round whole is never cut by lines through its centre (equal parts are
  // sectors, which code draws exactly)
  const said = partitionCounts(ctx.reply);
  const lineNums = new Set([...numbersIn(ctx.reply)].filter((x) => /^\d+$/.test(x)).map(Number));
  const fams = shapeFamilies(ops);
  const okCount = (n) => said.has(n) || lineNums.has(n) || [...said].some((a) => [...said].some((b) => a * b === n));
  const badCount = said.size ? fams.filter((f) => !okCount(f.n)).map((f) => `${f.kind} x${f.n}`) : [];
  const cut = circleCutByLines(ops);
  add("W8.counts_match_line", badCount.length === 0 && cut.length === 0, { said: [...said], families: fams.map((f) => `${f.kind} x${f.n}`), bad: badCount, cutByLines: cut });
  // W2b words clear of lines: no text or label box crossed by a drawn line, arrow or box edge (legibility at 360 dp)
  const crossed = textsCrossed(ops, byId);
  add("W2.text_clear_of_lines", crossed.length === 0, crossed.slice(0, 3));
  // W9 no reveal: nothing on the board equals a withheld answer (ctx.withhold = withheldValues(kit, {itemId, line}))
  const reveals = revealsOf(ops, per, byId, texts, ctx.withhold);
  add("W9.no_reveal", reveals.length === 0, reveals.slice(0, 4));
  const pass = checks.every((c) => c.pass);
  return { pass, checks, script, facts: pass ? scriptFacts(script, { kind: "diagram", archetype: "whiteboard" }) : null };
}
