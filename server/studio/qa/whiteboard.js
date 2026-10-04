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
//
// gateWhiteboard(raw, ctx) → { pass, checks, script, facts }.  The script returned is the normalised one (draw this).
import { normalizeScript, lintScript, opGeometry, textBox, TEXT_SIZE, scriptFacts } from "../../../shared/whiteboard.js";
import { kitVocabulary, unknownWords, stem } from "../../forge/explainer/truth.js";
import { SEVERE, MILD, PII } from "../../forge/g2/safety.js";
import { PHONE_TRAY } from "../archetypes/index.js";

export const WB_GATE_VERSION = "wb-gate@1";
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
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (WORD_NUM[w] !== undefined) out.add(String(WORD_NUM[w]));
    if (FRAC_WORD[w] !== undefined) {
      const d = FRAC_WORD[w]; out.add(String(d));
      const prev = WORD_NUM[words[i - 1]] ?? (/^\d+$/.test(words[i - 1] ?? "") ? Number(words[i - 1]) : null);
      out.add(`${prev ?? 1}/${d}`);
      if (prev == null) out.add("1");
    }
  }
  return out;
}

/** The kit's numbers: items, answers, worked example, expectations, diagnostics. */
export function kitNumbers(kit) {
  const parts = [];
  const add = (x) => { if (x != null) parts.push(String(x)); };
  for (const e of kit?.expectations ?? []) add(e);
  for (const i of kit?.items ?? []) { add(i.prompt_en); add(i.prompt_hi); add(i.answer); for (const a of i.acceptable ?? []) add(a); }
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
  return { nums, derived, wrong };
}

/** Is a drawn number allowed: said, in the kit, re-computed true, or a proper fraction of two said counts. */
function numberAllowed(t, allowed, derived) {
  if (allowed.has(t) || derived.has(t)) return true;
  const m = /^(\d+)\/(\d+)$/.exec(t);
  if (m) { const n = +m[1], d = +m[2]; return n <= d && allowed.has(String(d)) && (allowed.has(String(n)) || n === 1); }
  return false;
}

// ───────────────────────────── the gate ─────────────────────────────

/**
 * @param {unknown} raw the model's script (already expanded to WhiteboardScript shape)
 * @param {{ reply: string, kit?: any, band?: string, speechMs?: number, extraNumbers?: string[], extraWords?: string[] }} ctx
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
  add("W2.no_text_overlap", !lint.some((i) => i.check === "text_overlap"), lint.filter((i) => i.check === "text_overlap").slice(0, 3).map((i) => i.id));
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
  const long = texts.filter((t) => t.trim().split(/\s+/).length > 4);
  const unsafe = texts.filter((t) => SEVERE.some((re) => re.test(t)) || MILD.some((re) => re.test(t)) || PII.some((re) => re.test(t)));
  add("W7.register", long.length === 0 && unsafe.length === 0, { long: long.slice(0, 2), unsafe: unsafe.slice(0, 2) });
  const pass = checks.every((c) => c.pass);
  return { pass, checks, script, facts: pass ? scriptFacts(script, { kind: "diagram", archetype: "whiteboard" }) : null };
}
