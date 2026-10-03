// KitMath (fractions subset) — exact rationals, MathValue parsing/equivalence and executable misconception
// rules (FACTORY.md §4.4 truth source #1: "KitMath/KitLaws recompute", before any kit `verified` flag).
// Pure, integer-only, no floats in any verdict. Shared by server/forge/derive.js and the G1 gate.

export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const lcm = (a, b) => (a / gcd(a, b)) * b;
/** Reduced rational; d > 0. */
export const R = (n, d) => {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`bad rational ${n}/${d}`);
  const s = d < 0 ? -1 : 1; const g = gcd(n, d);
  return { n: (s * n) / g, d: (s * d) / g };
};
export const add = (x, y) => R(x.n * y.d + y.n * x.d, x.d * y.d);
export const sub = (x, y) => R(x.n * y.d - y.n * x.d, x.d * y.d);
export const cmp = (x, y) => x.n * y.d - y.n * x.d;
export const eq = (x, y) => cmp(x, y) === 0;
export const str = (x) => (x.d === 1 ? `${x.n}` : `${x.n}/${x.d}`);
/** Unreduced n/d as written (2/4 stays 2/4): what a bar shows. */
export const raw = (n, d) => ({ n, d });

const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };

/**
 * Parse a kit answer / acceptable form into an exact value. Accepts "5/7", "5 by 7", "5 upon 7", "1 1/2" (mixed),
 * "3", "0". Anything else (words, units, sentences) → null: the caller must not treat it as a number.
 * @returns {{n:number,d:number}|null} reduced
 */
export function parseValue(s) {
  const t = String(s ?? "").trim().toLowerCase().replace(/[−–]/g, "-").replace(/\s+/g, " ").replace(/[.。]$/, "");
  let m;
  if ((m = t.match(/^(-?\d{1,4}) (\d{1,3}) ?\/ ?(\d{1,3})$/))) { const w = +m[1], n = +m[2], d = +m[3]; if (!d) return null; return R(Math.sign(w || 1) * (Math.abs(w) * d + n), d); }
  if ((m = t.match(/^(-?\d{1,4}) ?(?:\/|by|upon|over) ?(\d{1,4})$/))) return +m[2] ? R(+m[1], +m[2]) : null;
  if ((m = t.match(/^(-?\d{1,6})$/))) return R(+m[1], 1);
  if ((m = t.match(/^([a-z]+) (?:by|upon|over) ([a-z]+)$/)) && WORD_NUM[m[1]] && WORD_NUM[m[2]]) return R(WORD_NUM[m[1]], WORD_NUM[m[2]]);
  return null;
}
/** Every exact value a kit item accepts (answer + acceptable that parse). */
export function keyValues(item) {
  return [item.answer, ...(item.acceptable || [])].map(parseValue).filter(Boolean);
}

/** Fractions written in a text, unreduced and in order ("1/2 + 1/3" → [{1,2},{1,3}]). Mixed numbers excluded. */
export function fractionsIn(text) {
  const t = String(text || "").replace(/[−–]/g, "-");
  return [...t.matchAll(/(?<![\d/.])(\d{1,3})\s*\/\s*(\d{1,3})(?![\d/.])/g)]
    .filter((m) => !/\d\s+$/.test(t.slice(0, m.index)))           // "3 1/4" is a mixed number, not 1/4
    .map((m) => raw(+m[1], +m[2]));
}

/**
 * A fraction task the kit item poses, recomputed from the prompt: {op, operands (as written), key (KitMath)}.
 * op: add | sub | compare | equiv. null when the prompt is not one of these shapes (the caller then cannot use
 * KitMath truth for it and must not fill a fraction engine).
 */
export function fractionTask(item) {
  const p = String(item.prompt_en || "").replace(/[−–]/g, "-");
  if (/\d\s+\d{1,3}\s*\/\s*\d/.test(p)) return null;                                   // mixed numbers: not v1
  let m;
  if ((m = p.match(/(?<![\d/])(\d{1,3})\s*\/\s*(\d{1,3})\s*([+-])\s*(\d{1,3})\s*\/\s*(\d{1,3})(?![\d/])/))) {
    const a = raw(+m[1], +m[2]), b = raw(+m[4], +m[5]);
    if (!a.d || !b.d) return null;
    const ra = R(a.n, a.d), rb = R(b.n, b.d);
    if ((p.match(/[+-]\s*\d{1,3}\s*\/\s*\d/g) || []).length > 1) return null;           // three-term sums: not v1
    const key = m[3] === "+" ? add(ra, rb) : sub(ra, rb);
    return { op: m[3] === "+" ? "add" : "sub", operands: [a, b], key };
  }
  if ((m = p.match(/(\d{1,3})\s*\/\s*(\d{1,3})\s*=\s*(?:\?|_+|□)\s*\/\s*(\d{1,3})/))) {
    const a = raw(+m[1], +m[2]); const T = +m[3];
    if (!a.d || !T || (a.n * T) % a.d) return null;
    return { op: "equiv", operands: [a], key: R(a.n, a.d), target: raw((a.n * T) / a.d, T) };
  }
  if ((m = p.match(/(\d{1,3})\s*\/\s*(\d{1,3})\s*=\s*(\d{1,3})\s*\/\s*(?:\?|_+|□)/))) {
    const a = raw(+m[1], +m[2]); const N = +m[3];
    if (!a.n || !a.d || (N * a.d) % a.n) return null;
    return { op: "equiv", operands: [a], key: R(a.n, a.d), target: raw(N, (N * a.d) / a.n) };
  }
  const fr = fractionsIn(p);
  const asksBig = /\b(bigger|greater|larger|more)\b/i.test(p), asksSmall = /\b(smaller|less|lesser)\b/i.test(p);
  if (fr.length === 2 && asksBig !== asksSmall && /\b(which|kaun)/i.test(p) && fr.every((f) => f.d > 0)) {
    const [a, b] = fr; const c = cmp(R(a.n, a.d), R(b.n, b.d));
    if (c === 0) return { op: "compare", operands: fr, key: null, question: asksBig ? "bigger" : "smaller" };
    const pick = (asksBig ? c > 0 : c < 0) ? a : b;
    return { op: "compare", operands: fr, key: R(pick.n, pick.d), question: asksBig ? "bigger" : "smaller" };
  }
  return null;
}

// ───────────── misconception rules (executable; FACTORY.md §4.4 MiscRule) ─────────────
// A rule fires only when the kit topic lists a misconception whose id matches its pattern, so every misc id a fill
// carries is a real kit id (never invented). predicts(task) → the wrong values a child holding it would give.
export const MISC_RULES = [
  { pattern: /add-across|add-both|add-tops-and-bottoms|across/, ops: ["add", "sub"],
    predicts: (t) => { const [a, b] = t.operands; const s = t.op === "add" ? 1 : -1; const d = a.d + s * b.d; return d > 0 && a.n + s * b.n >= 0 ? [R(a.n + s * b.n, d)] : []; } },
  { pattern: /change-only-den|only-den|denominator-only/, ops: ["add", "sub"],
    predicts: (t) => { const [a, b] = t.operands; if (a.d === b.d) return []; const L = lcm(a.d, b.d); const s = t.op === "add" ? 1 : -1; return a.n + s * b.n >= 0 ? [R(a.n + s * b.n, L)] : []; } },
  { pattern: /bigger-denominator|larger-denominator|denominator-bigger|whole-number-bias|bigger-number/, ops: ["compare"],
    predicts: (t) => (t.key ? t.operands.map((f) => R(f.n, f.d)).filter((f) => !eq(f, t.key)) : []) },
  { pattern: /add-same|one-side|numerator-only|change-one/, ops: ["equiv"],
    predicts: (t) => { const a = t.operands[0], T = t.target; const out = []; if (a.n + (T.d - a.d) >= 0) out.push(R(a.n + (T.d - a.d), T.d)); out.push(R(a.n, T.d)); return out; } },
];

/**
 * Distractors with kit misconception ids, KitMath-checked: never equal to the key, deduplicated.
 * @returns {{ value: string, misc: string }[]}
 */
export function miscDistractors(task, misconceptions) {
  if (!task.key) return [];
  const out = [];
  for (const rule of MISC_RULES) {
    if (!rule.ops.includes(task.op)) continue;
    const m = misconceptions.find((x) => rule.pattern.test(x.id));
    if (!m) continue;
    for (const v of rule.predicts(task)) {
      if (eq(v, task.key) || out.some((o) => eq(parseValue(o.value), v))) continue;
      out.push({ value: str(v), misc: m.id });
    }
  }
  return out;
}

// ───────────── numbers at the KT target (generator; FACTORY.md §4.8a "clamp to the domain's edge") ─────────────
/** Deterministic [0,1) stream (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** The tested domain of fraction-bars@1 fills (engine limits: ≤ 3 bars, ≤ 12 parts each, proper fractions). */
export const BARS_DOMAIN = { maxParts: 12, maxBars: 3 };

/**
 * An isomorphic variant of an add/sub/compare task at difficulty `level` (0 easier: like denominators; 1 same;
 * 2 harder: unlike denominators with lcm ≤ 12). Key by KitMath. null when nothing fits the domain in 64 draws.
 */
export function variantTask(task, level, seed) {
  if (!["add", "sub", "compare"].includes(task.op)) return null;
  const rand = rng(seed);
  const pickDen = () => [2, 3, 4, 5, 6, 8, 10, 12][Math.floor(rand() * 8)];
  for (let i = 0; i < 64; i++) {
    const d1 = pickDen(); const d2 = level === 0 ? d1 : pickDen();
    if (level === 2 && d1 === d2) continue;
    const L = lcm(d1, d2); if (L > BARS_DOMAIN.maxParts) continue;
    const n1 = 1 + Math.floor(rand() * (d1 - 1)), n2 = 1 + Math.floor(rand() * (d2 - 1));
    const a = raw(n1, d1), b = raw(n2, d2), ra = R(n1, d1), rb = R(n2, d2);
    if (task.op === "compare") {
      const c = cmp(ra, rb); if (c === 0) continue;
      const pick = (task.question === "bigger" ? c > 0 : c < 0) ? a : b;
      return { op: "compare", operands: [a, b], key: R(pick.n, pick.d), question: task.question };
    }
    const key = task.op === "add" ? add(ra, rb) : sub(ra, rb);
    if (key.n <= 0 || cmp(key, R(1, 1)) > 0) continue;
    return { op: task.op, operands: [a, b], key };
  }
  return null;
}
