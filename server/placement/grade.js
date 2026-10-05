// Code grader for placement items (RS-6, CONTENT-LEVEL F2). Placement evidence enters θ only when code-graded
// (server/learner/kt/ability.js TH1), and a model never grades a child: so every placement item is numeric or a choice,
// and this file decides right/wrong from the bytes. null = censored (no parseable answer, or "I don't know").

const WORD_NUM = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, chheh: 6, saat: 7, aath: 8, nau: 9, das: 10,
  gyarah: 11, barah: 12, bees: 20, tees: 30, chalis: 40, pachas: 50, sau: 100, thousand: 1000, hazaar: 1000, hazar: 1000,
  lakh: 100000, lac: 100000,
};
const MULT = new Set([100, 1000, 100000]);
/**
 * "I don't know" in the shapes children say it (review 2026-10-05: "i do not know" used to parse as 2 via Hindi "do").
 * Shared with session.js so the grader and the IDK weighting can never disagree.
 */
export const IDK = /^(?:(?:i|mujhe|mujhko|muje)\s*)?(?:(?:really\s*)?(?:don'?t|do\s*not|dont)\s*know|idk|no\s*idea|not\s*sure|(?:pata|maloom|malum)\s*nahi+(?:\s*hai)?|nahi+\s*(?:pata|maloom|malum)(?:\s*hai)?|skip|pass|\?+)[\s.!]*$/i;

/** Clean a response: lower-case, unify dashes and quotes, drop currency, unit words are kept for the caller to ignore. */
const clean = (s) => String(s ?? "").toLowerCase().replace(/[−–—]/g, "-").replace(/[“”"'’`]/g, "").replace(/₹|rs\.?|rupees?/g, " ").trim();

/**
 * Parse one number from a response: "3,250", "3250 g", "1 3/8", "11/8", "0.6", "-4", "36 minutes", "twelve", "teen",
 * "two thousand", "do sau bees". Indian grouping (3,45,000) is accepted. Returns null when there is no number, or more than
 * one distinct number ("12 or 13", "1/2 or 3/4", "one or two": a hedge is unclear, never credited; review 2026-10-05).
 * A space is not a digit group separator: "3 250 g" is two numbers and so unclear.
 */
export function parseNumber(raw) {
  const s = clean(raw).replace(/(?<=\d),(?=\d)/g, "");
  if (!s) return null;
  const toks = s.match(/-?\d+\s+\d+\s*\/\s*\d+|-?\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?|-?\d*\.?\d+/g);
  if (toks) {
    const vals = [];
    for (const t of toks) {
      const m = t.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
      const f = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
      if (m) { const [w, n, d] = [+m[1], +m[2], +m[3]]; if (!d) return null; vals.push(w + (m[1].startsWith("-") ? -1 : 1) * n / d); }
      else if (f) { if (!+f[2]) return null; vals.push(+f[1] / +f[2]); }
      else vals.push(+t);
    }
    const distinct = vals.filter((v, i) => vals.findIndex((u) => near(u, v)) === i);
    return distinct.length === 1 && Number.isFinite(distinct[0]) ? distinct[0] : null;
  }
  return parseWords(s);
}

/** Number words, composed strictly: "twenty five", "do sau bees", "three thousand two hundred". Two bare units ("one or two"),
 * or a units word after a units word, is a hedge: null. */
function parseWords(s) {
  const words = s.split(/[\s-]+/).filter((w) => w in WORD_NUM);
  if (!words.length) return null;
  if (/\b(?:or|ya|maybe|either|shayad)\b/.test(s) && words.length > 1) return null;
  // "i do not know", "do not remember": Hindi "do" (2) inside an English refusal is not an answer.
  if (/\b(?:not|nahi|know|pata|remember|sure)\b/.test(s)) return null;
  let total = 0, cur = 0, last = null; // last: "unit" (<10 or teens), "tens", "mult"
  for (const w of words) {
    const v = WORD_NUM[w];
    if (MULT.has(v)) {
      if (v === 100) { cur = (cur || 1) * 100; }
      else { total += (cur || 1) * v; cur = 0; }
      last = "mult";
      continue;
    }
    const kind = v >= 20 && v % 10 === 0 ? "tens" : "unit";
    if (last === "unit" || (last === "tens" && kind === "tens")) return null;
    cur += v;
    last = kind;
  }
  return total + cur;
}

const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
const norm = (s) => clean(s).replace(/[^\p{L}\p{N}/.\s-]/gu, " ").replace(/\s+/g, " ").trim();

/**
 * @param {{ format: "numeric"|"mcq", answer: string, acceptable?: string[], options?: { text: string, correct: boolean }[] }} item
 * @param {string|number|{ option: number }} response  free text, a number, or { option: index } from a tapped choice
 * @param {string[]} [shownOptions]  option texts in the order the child saw them (for "B" / "2" answers)
 * @returns {boolean|null}
 */
export function gradePlacement(item, response, shownOptions) {
  if (response == null) return null;
  if (typeof response === "object" && Number.isInteger(response.option)) {
    const texts = shownOptions ?? item.options?.map((o) => o.text) ?? [];
    const picked = texts[response.option];
    if (picked == null) return null;
    return !!item.options?.find((o) => o.text === picked)?.correct;
  }
  const raw = String(response).trim();
  if (!raw || IDK.test(raw)) return null;
  if (item.format === "mcq") {
    const texts = shownOptions ?? item.options.map((o) => o.text);
    const r = norm(raw);
    // 1. The option's own words win ("a rectangle" is the option "a rectangle", not option A; "3" is the option "3", not the
    //    third option). Review 2026-10-05: letter/index used to be read first and graded those answers against the wrong option.
    const tight = (x) => clean(x).replace(/\s+/g, " ").replace(/[.!]+$/, "");
    let picked = texts.find((t) => tight(t) === tight(raw)) ?? null;
    if (!picked) { const eq = texts.filter((t) => norm(t) === r); if (eq.length === 1) picked = eq[0]; }
    // 2. A bare letter or index: "b", "B)", "option b", "2", "option 2" (also "B) obtuse").
    if (!picked) {
      const letter = r.match(/^(?:option\s*)?([a-d])(?:\s*[).:]|$)/) ?? (/^[a-d]$/.test(raw.trim().toLowerCase()) ? [null, raw.trim().toLowerCase()] : null);
      const digit = r.match(/^(?:option\s*)?([1-4])$/);
      picked = letter ? texts["abcd".indexOf(letter[1])] ?? null : digit ? texts[+digit[1] - 1] ?? null : null;
    }
    // 3. The child said more than the option, or the start of it; exactly one option must fit.
    if (!picked) {
      const hits = texts.filter((t) => { const n = norm(t); return (n.length >= 3 && new RegExp(`(?:^|\\s)${n.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?:\\s|$)`).test(r)) || (r.length >= 3 && n.startsWith(r)); });
      if (hits.length === 1) picked = hits[0];
    }
    if (!picked) return null;
    return !!item.options.find((o) => o.text === picked)?.correct;
  }
  const want = [item.answer, ...(item.acceptable ?? [])].map(parseNumber).filter((x) => x != null);
  const got = parseNumber(raw);
  if (got == null) {
    const r = norm(raw);
    return [item.answer, ...(item.acceptable ?? [])].some((a) => norm(a) === r) ? true : null;
  }
  return want.some((w) => near(got, w));
}
