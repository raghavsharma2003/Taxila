// A "which is bigger" across different kinds of quantity is a pedagogy bug, never a question (prod 2026-10-03: a hook
// asked whether 45,000 fans or 4,500 km was bigger). Cheap code predicate for the reply guards: within ONE question
// sentence (it carries a "?") that compares, two quantities whose kinds differ, where at least one is a MEASURE (a distance, mass, volume, time,
// money, temperature, percent). Two counts of different things ("12 boys or 10 girls") are a fair comparison and
// pass; the same dimension in two units ("1 km or 900 m") is a real conversion question and passes. Pure.

const DIM = [
  ["length", /^(km|kms|kilomet(?:er|re)s?|m|met(?:er|re)s?|cm|mm|centimet(?:er|re)s?|millimet(?:er|re)s?|miles?|feet|foot|ft|inch(?:es)?)$/],
  ["mass", /^(kg|kgs|kilos?|kilograms?|g|gm|gms|grams?|tonnes?|tons?|quintals?)$/],
  ["volume", /^(l|litres?|liters?|ml|millilit(?:er|re)s?)$/],
  ["time", /^(s|sec|secs|seconds?|min|mins|minutes?|hrs?|hours?|ghant[ae]|din|days?|weeks?|hafte?|months?|mahin[ae]|years?|saal|baras)$/],
  ["money", /^(rs|rupees?|rupaye|rupaiye|rupay|rupiya|paise|paisa|₹)$/],
  ["temperature", /^(°c|°f|degrees?|digri)$/],
  ["percent", /^(%|percent|pratishat)$/],
  ["area", /^(sq|square|hectares?|acres?|bigha)$/],
];
const MULTIPLIER = /^(lakh|lakhs|crore|crores|hazaa?r|thousand|million|billion|sau|hundred)$/;
/** Words after a number that are not what it counts (connectives, particles, operators). */
const NOT_A_KIND = new Set(["aur", "and", "or", "ya", "se", "ka", "ki", "ke", "ko", "mein", "me", "is", "are", "hai", "hain", "tha", "the", "to", "toh",
  "of", "in", "on", "at", "par", "pe", "wala", "wali", "wale", "times", "guna", "baar", "bar", "x", "plus", "minus", "jod", "ghata", "kitna", "kitne", "kitni"]);
const COMPARE = /\b(bigger|larger|greater|more|less|fewer|smaller|longer|shorter|heavier|lighter|higher|lower|bada|badi|bade|baddi|zyada|zyaada|jyada|kam|chhota|chhoti|chhote|lamba|lambi|bhaari|halka)\b|(बड़ा|बड़ी|ज़्यादा|ज्यादा|कम|छोटा|छोटी)/i;

/** The kind of the quantity a number token measures: a dimension name, `count:<noun>`, or null (no kind said). */
function kindAfter(words, i, prefix) {
  if (prefix === "₹" || /^(rs\.?|₹)$/i.test(prefix ?? "")) return "money";
  let j = i + 1;
  while (j < words.length && MULTIPLIER.test(words[j])) j++;
  const w = (words[j] ?? "").replace(/[.,;:!?)"']+$/, "").toLowerCase();
  if (!w || NOT_A_KIND.has(w) || /^\d/.test(w)) return null;
  for (const [name, re] of DIM) if (re.test(w)) return name;
  if (!/^[\p{L}]+$/u.test(w)) return null;
  return `count:${w.replace(/(es|s)$/, "")}`;
}

/**
 * Quantities in one sentence: [{ value, kind }] (kind null when the number names no kind).
 * Numbers may carry Indian or international grouping commas, decimals, a % or a unit glued on ("4500km", "45%").
 */
export function quantitiesIn(sentence) {
  const t = String(sentence).replace(/(\d)(%|km|kg|cm|mm|ml|m|g|l)\b/gi, "$1 $2").replace(/₹\s*/g, "₹ ");
  const words = t.split(/\s+/).filter(Boolean);
  const out = [];
  words.forEach((w, i) => {
    const m = w.match(/^(₹)?(\d[\d,]*(?:\.\d+)?)/);
    if (!m) return;
    out.push({ value: Number(m[2].replace(/,/g, "")), kind: kindAfter(words, i, m[1] ?? words[i - 1]) });
  });
  return out;
}

const isMeasure = (k) => !!k && !k.startsWith("count:");

/**
 * The first sentence of `text` that compares quantities of different kinds, or null.
 * @param {string} text
 * @returns {{ sentence: string, kinds: string[] } | null}
 */
export function mixedUnitComparison(text) {
  const sentences = String(text ?? "").match(/[^.!?।]+[.!?।]*/g) ?? [];
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (!/[?？]/.test(sentence) || !COMPARE.test(sentence)) continue;
    // The quantities may be set up just before the question ("45,000 fans … 4,500 km. Which is bigger?"): a question
    // that names fewer than two kinds itself reads the two sentences before it.
    const own = quantitiesIn(sentence).map((q) => q.kind).filter(Boolean);
    const scope = new Set(own).size >= 2 ? [sentence] : sentences.slice(Math.max(0, i - 2), i + 1);
    const kinds = [...new Set(scope.flatMap((x) => quantitiesIn(x).map((q) => q.kind)).filter(Boolean))];
    if (kinds.length < 2 || !kinds.some(isMeasure)) continue;
    const dims = new Set(kinds.map((k) => (isMeasure(k) ? k : "count")));
    if (dims.size >= 2) return { sentence: scope.join("").trim(), kinds };
  }
  return null;
}

/** `text` without its mixed-unit comparison sentences (what is left of a turn after a rewrite still compared them). */
export function withoutMixedUnits(text) {
  let t = String(text);
  for (let n = 0; n < 4; n++) {
    const hit = mixedUnitComparison(t);
    if (!hit) break;
    // drop the comparing question itself (the setup sentences may stay: they are true statements)
    const q = (hit.sentence.match(/[^.!?।]+[.!?।]*/g) ?? []).at(-1);
    t = t.replace(q, "").replace(/\s{2,}/g, " ").trim();
  }
  return t;
}
