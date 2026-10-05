// Reply guards for the defects the live prod battery found (evals/prod-runs/2026-10-05-day0, owner-2 / owner-4), as pure
// predicates and repairs over the bytes. brain/say.js textReply runs them with its other guards (one rewrite, then a code
// repair). Inherited law: truth by predicate, not instruction.
//
//   bare     the reply is (almost) only the pinned question: what the child said got no answer (R3: 9 in 90 turns)
//   repeat   the reply repeats an earlier teacher line of this lesson (R4: 8 in 90): she sounds like a loop
//   tidy     an orphan quote mark left by a sentence cut ("” Khaali jagah…", "” What is your prediction"): owner-4 english,
//            owner-2 s1 t4 (R6.dangling); a lead sentence that re-poses the blanked question in other words before the
//            question itself (s1 t6: "Khaali jagah bhariye: 2/5 is ___ the middle. Khaali jagah bhariye: Check: …")
//   decimals sentence splitting that never cuts "0.4" into "0. 4" (s1 t5: "2/5 ko 0. 4 samajhiye")

const DOT = "․"; // one dot leader: a decimal point while sentences are split
/** Sentences of a text, never cutting a decimal point ("0.4", "2.5 cm"). PURE. */
export function sentences(text) {
  const t = String(text ?? "").replace(/(\d)\.(\d)/g, `$1${DOT}$2`);
  return (t.match(/[^.!?।？]+[.!?।？]*\s*/g) ?? []).map((x) => x.replaceAll(DOT, "."));
}

const normW = (t) => String(t ?? "").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}/]+/gu, " ").trim();
const wordList = (t) => normW(t).split(" ").filter(Boolean);
/** Jaccard similarity of two texts' word sets (the battery's own measure, tests/prod/_owner.mjs). PURE. */
export function jaccard(a, b) {
  const A = new Set(wordList(a)), B = new Set(wordList(b));
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
}

/** The reply's own words: the text with the pinned question (and its card form) taken out. PURE. */
export function ownWords(reply, ...asks) {
  let t = String(reply ?? "");
  for (const a of asks.filter(Boolean)) t = t.split(String(a)).join(" ");
  return t.replace(/\s+/g, " ").trim();
}

export const BARE_MIN_WORDS = 4;
/** Is the reply only the pinned question (fewer than BARE_MIN_WORDS words of its own)? PURE. */
export function isBare(reply, askFull, askCard) {
  if (!askFull && !askCard) return false;
  const own = ownWords(reply, askFull, askCard);
  const n = wordList(own).length;
  if (n === 0) return true;
  // the card form may be a cut of the question: what is left must not just be a piece of it
  const a = normW(askFull);
  return n < BARE_MIN_WORDS || (a && a.includes(normW(own)));
}

export const REPEAT_SIM = 0.8;
/** Does the reply repeat one of the earlier teacher lines (whole-reply Jaccard ≥ REPEAT_SIM, or identical)? PURE. */
export function repeatsEarlier(reply, earlier = []) {
  const r = normW(reply);
  if (!r) return false;
  return earlier.some((p) => p && (normW(p) === r || jaccard(p, reply) >= REPEAT_SIM));
}

const QUOTES = /["“”‘’]/g;
/**
 * The reply with the cut marks of an earlier repair removed: fragments with no letter or digit, an opening orphan quote
 * or bracket, and a closing quote with no opening one. PURE.
 */
export function tidy(text) {
  let out = sentences(text).filter((x) => /[\p{L}\p{N}]/u.test(x)).join("").replace(/\s{2,}/g, " ").trim();
  out = out.replace(/^[\s”"'’)\]»]+/, "").trim();
  // an unmatched curly quote: “ without ” (or the reverse) is dropped, with the space it leaves
  const open = (out.match(/“/g) ?? []).length, close = (out.match(/”/g) ?? []).length;
  if (open !== close) out = out.replace(/[“”]/g, "");
  const so = (out.match(/‘/g) ?? []).length, sc = (out.match(/’(?![\p{L}])/gu) ?? []).length;
  if (so !== sc) out = out.replace(/‘/g, "").replace(/’(?![\p{L}])/gu, "");
  // a straight double quote with no partner
  if (((out.match(/"/g) ?? []).length) % 2) out = out.replace(/"/g, "");
  return out.replace(/\s+([,.!?।])/g, "$1").replace(/\s{2,}/g, " ").trim();
}

/** Does a sentence re-pose a blanked question ("___") that the pinned question itself carries? PURE. */
export const reposesBlank = (sentence, askFull) => /_{2,}/.test(String(sentence)) && /_{2,}/.test(String(askFull ?? ""));

/**
 * The lead (everything said before the question) with the sentences that are the question again dropped: an exact or
 * contained copy, a ≥ 75%-overlap re-wording, or a second form of a blanked question. PURE.
 */
export function leadWithoutQuestion(lead, askFull) {
  const a = normW(askFull);
  return sentences(lead).filter((x) => {
    const n = normW(x);
    if (!n) return false;
    if (a && (a.includes(n) || n.includes(a))) return false;
    if (reposesBlank(x, askFull)) return false;
    const w = wordList(x);
    return !(a && w.length >= 4 && w.filter((v) => a.split(" ").includes(v)).length / w.length >= 0.75);
  }).join("").replace(/\s{2,}/g, " ").trim();
}
