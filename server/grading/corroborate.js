// A model's label on a keyed item is a PROPOSAL; code decides whether the child's words support it (round2 truth,
// VALUES-100 V1.1 "0 wrong grades"; inherited law: a model never grades).
//
// Why: the lesson classifier's model leg answers whatever the deterministic paths cannot decide (a sentence, a list, a
// paraphrase). On the stratified grading-truth sample it was wrong on 24 / 399 (2026-10-05), and on production owner-1
// (2026-10-06) it credited "tens first" for "25, 38, 52", "10/15 and 9/15" for "Ali is wrong: 4/9 < 3/4", and the first
// clause of a two-part key. Every one of those is checkable WITHOUT understanding the language: the answer has none of
// the key's numbers, or numbers that appear nowhere in the question, the key or any accepted answer, or almost none of a
// complete answer's content words.
//
// The rule (pure; the same words always give the same decision):
//   - "correct" stands only when ONE complete form of the answer (the key, an acceptable entry not marked partial/wrong,
//     a correct posed option) is CORROBORATED by the reply: no foreign number, no opposite decisive word, no negated key,
//     every number of the form present, and enough of the form's content words present (CORROBORATE.minCover).
//     Otherwise the turn is NO EVIDENCE (abstain: the Director re-asks / offers choices, which code grades). A credit
//     the words cannot carry is never written as a credit.
//   - "incorrect" / "misconception" / "partial" stand unless the reply looks like a complete form (KEY-LIKE: every
//     number of the form, no foreign number, no contradiction, a high cover) — then the model is disagreeing with the
//     key's own words and the turn is no evidence instead of a fail (the false_fail direction).
// What this costs: some right answers in words that share little with every listed form (a paraphrase in another
// language) earn no evidence and a re-ask. That is reported per form as "uncredited", never hidden.
import { numberPhrases } from "./spoken-number.js";

export const CORROBORATE = Object.freeze({ minCover: 0.6, keyLikeCover: 0.8 });

const STOP = new Set(("a an the is are was were be been am it its this that these those of to in on at by for with from as and or but so " +
  "because if then than there their they them he she his her we you your i my me our do does did not no yes " +
  "hai hain tha thi the ho hota hoti hote ka ki ke ko se me mein par aur ya bhi to toh hi na nahi nahin kya kyun kyunki ki " +
  "jo ek yeh ye woh wo vo is us un isme usme mujhe lagta lagti shayad mera meri answer think maybe it's its i'm im " +
  "है हैं था थी के की का को से में पर और या भी तो ही न नहीं क्या क्यों क्योंकि जो एक यह ये वह वो इस उस").split(/\s+/));
const NEG = new Set(["not", "no", "nahi", "nahin", "nhi", "na", "never", "isn't", "isnt", "aren't", "doesn't", "don't", "नहीं", "मत", "न"]);
// decisive pairs: a form that takes one side contradicts a reply that takes only the other
const SIDES = [
  [["yes", "haan", "han", "haa", "yeah", "हाँ", "हां"], ["no", "nahi", "nahin", "nhi", "nope", "नहीं"]],
  [["true", "sahi", "correct", "right", "सही"], ["false", "galat", "wrong", "incorrect", "गलत", "ग़लत"]],
  [["more", "bigger", "greater", "larger", "zyada", "jyada", "bada", "badi", "bade", "heavier", "longer", "taller", "बड़ा", "ज़्यादा", "ज्यादा"],
    ["less", "smaller", "fewer", "kam", "chhota", "chhoti", "chhote", "lighter", "shorter", "छोटा", "कम"]],
  [["before", "pehle", "earlier", "पहले"], ["after", "baad", "later", "बाद"]],
  [["odd", "vishams"], ["even", "sam"]],
  [["left", "baayein", "baaye", "bayen", "बाएँ", "बाएं"], ["right", "daayein", "daaye", "dayen", "दाएँ", "दाएं"]],
  [["up", "upar", "ऊपर"], ["down", "neeche", "niche", "नीचे"]],
  [["north", "uttar", "उत्तर"], ["south", "dakshin", "दक्षिण"]],
  [["east", "purab", "poorv", "पूर्व"], ["west", "paschim", "पश्चिम"]],
  [["clockwise"], ["anticlockwise", "anti-clockwise", "counterclockwise"]],
];

// the decisive words in Hindi / Hinglish read as their English side word for the cover too ("bada" covers "bigger")
const CANON = new Map(SIDES.flatMap((g) => g.flatMap((side) => side.map((w) => [w, side[0]]))));
// words that decide WHAT a number is (a place value, an era, a time, a unit, a counted thing): a reply that brings one the
// form does not have ("14 sides" for "14 corners", "320 CE" for "320 BCE") is not that form, and a form that has one the
// reply lacks ("320" for "320 BCE coin") is carried only when the question itself names it. Scale words (lakh, crore,
// million) are not here: they are part of the number, and the value check already decides them
const DECISIVE = new Set(("ones tens hundreds thousands tenths hundredths thousandths bce bc ce ad am pm " +
  "corners corner sides side edges edge faces face vertices vertex angles angle diagonals cm mm km kg mg ml litre litres liter liters metre metres meter meters " +
  "gram grams minute minutes hour hours second seconds day days week weeks month months year years degree degrees celsius fahrenheit rupees paise " +
  "squares square cubes cube january february march april may june july august september october november december").split(" "));
const words = (s) => String(s ?? "").toLowerCase().normalize("NFC").replace(/[’`]/g, "'").split(/[^\p{L}\p{M}\p{N}']+/u).filter(Boolean);
const stem = (w) => (w.length > 4 && /[a-z]s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w);
const content = (s) => new Set(words(s).filter((w) => (!STOP.has(w) || CANON.has(w)) && !/^\d+$/.test(w) && w.length >= 2).map((w) => CANON.get(w) ?? stem(w)));
/** Number values in a text (digits, English / Roman-Hindi / Devanagari number words), as the shared reader composes them;
 * null when a number phrase cannot be read. */
// the shared reader on the whole reply; when it cannot read it (a list said aloud: "twenty five, thirty eight, fifty two",
// where one number runs into the next), per list segment, so a list is read as its numbers, never as one wrong number
const nums = (s) => {
  const whole = numberPhrases(String(s ?? ""));
  if (whole !== null) return whole;
  const segs = String(s ?? "").split(/\s*(?:(?<!\d),|,(?!\d)|;|\baur\b|\bphir\b|\bthen\b)\s*/i).filter((x) => x.trim());
  if (segs.length < 2) return null;
  const out = [];
  for (const seg of segs) { const v = numberPhrases(seg); if (v === null) return null; out.push(...v); }
  return out;
};
/** Every number exactly as written ("16" in "16 tenths", "9" in "9 crore"): a bare number the key itself shows. */
const rawNums = (s) => (String(s ?? "").replace(/(?<=\d),(?=\d)/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
/** Roman-Hindi number words the shared reader keeps out of a lone phrase because they are also ordinary words ("do",
 * "saath"): they may CARRY a form's number (the model already read the reply as the key), never make one foreign. */
const WEAK = { do: 2, das: 10, bees: 20, tees: 30, saath: 60 };
const has = (vals, v) => vals.some((u) => Math.abs(u - v) < 1e-9);
const sideOf = (ws, group) => ({ a: group[0].some((w) => ws.has(w)), b: group[1].some((w) => ws.has(w)) });

/** The complete forms of the item's answer the label can be checked against. */
export function completeForms(target) {
  const lab = target?.alsoLabel ?? {};
  const also = (target?.also ?? []).filter((a) => a && lab[a] !== "partial" && lab[a] !== "wrong");
  const opts = (target?.options ?? []).filter((o) => o?.correct).map((o) => o.text);
  return [target?.key, ...also, ...opts].filter((x) => x != null && String(x).trim()).map(String);
}

/**
 * How well a reply supports one form. @returns {{ ok: boolean, keyLike: boolean, why: string|null, cover: number }}
 */
export function supports(form, text, allowedNums, negForms = null, prompt = "", siblingNums = null) {
  const fw = new Set(words(form)), tw = new Set(words(text));
  const fn = nums(form), tn = nums(text);
  if (tn === null) return { ok: false, keyLike: false, why: "unreadable_number", cover: 0 };
  if (tn.some((v) => !has(allowedNums, v))) return { ok: false, keyLike: false, why: "foreign_number", cover: 0 };
  const carried = [...tn, ...rawNums(text), ...words(text).filter((w) => w in WEAK).map((w) => WEAK[w])];
  const decT = [...tw].filter((w) => DECISIVE.has(w)), decF = [...fw].filter((w) => DECISIVE.has(w));
  const fnRaw = fn ?? [];
  if (fnRaw.length && decT.some((w) => !fw.has(w) && !fw.has(w.replace(/s$/, "")) && !fw.has(`${w}s`))) return { ok: false, keyLike: false, subset: false, why: "swapped_word", cover: 0 };
  const promptW = new Set(words(prompt));
  const missingDecisive = fnRaw.length > 0 && decF.some((w) => !tw.has(w) && !tw.has(w.replace(/s$/, "")) && !tw.has(`${w}s`) && !promptW.has(w) && !promptW.has(w.replace(/s$/, "")));
  for (const g of SIDES) {
    const f = sideOf(fw, g), t = sideOf(tw, g);
    if (f.a !== f.b && ((f.a && t.b && !t.a) || (f.b && t.a && !t.b))) return { ok: false, keyLike: false, why: "opposite_word", cover: 0 };
  }
  // round 2 integrated-tree fix (adversarial N1b/N1c, 2026-10-07): the opposite word is judged against EVERY complete form,
  // not this one alone — "yes they are equal, 3/4" took the other side of the sibling form "no" and still matched
  // "3/4 is bigger"; "right, 4/9 > 3/4" took the other side of "wrong". A side the forms take (and never its opposite) that
  // the reply contradicts is a contradiction of the answer, whichever form carries the number.
  // It decides the CREDIT only (keyLike / subset, the false-fail direction, are unchanged: paired replay below).
  const crossOpposite = !!negForms && SIDES.some((g) => {
    const taken = negForms.map((x) => sideOf(new Set(words(x)), g)).filter((x) => x.a !== x.b);
    if (!taken.length || !(taken.every((x) => x.a) || taken.every((x) => x.b))) return false;
    const t = sideOf(tw, g);
    return (taken[0].a && t.b && !t.a) || (taken[0].b && t.a && !t.b);
  });
  const fc = content(form), tc = content(text);
  // a negator in the reply next to the words of ANY complete form, when that form has none: "not X", "X nahi" (checked
  // over all forms, so "Largest: Jupiter. Smallest: Mercury. nahi" is negated for the shorter forms too)
  const list = words(text);
  // (a key that itself says "no" / "not" expects a negator in the reply: then this check is off)
  const all = negForms ?? [form];
  if (!all.some((g) => words(g).some((w) => NEG.has(w)))) for (const g of all) {
    const gc = content(g);
    if (list.some((w, i) => NEG.has(w) && [list[i - 1], list[i + 1], list[i + 2]].some((x) => x && gc.has(CANON.get(x) ?? stem(x))))) return { ok: false, keyLike: false, why: "negated", cover: 0 };
  }
  const fnv = fn ?? [];
  const rawF = rawNums(form);
  // every number of the form, and (two or more) in the form's order: "52, 38, 25" is not "25, 38, 52"
  const firstAt = (vals, v) => vals.findIndex((u) => Math.abs(u - v) < 1e-9);
  const distinctF = fnv.filter((v, i) => firstAt(fnv, v) === i);
  // the form's numbers as composed values, or as written ("16" for "16 tenths"): all present, in the form's order
  const inOrder = (want, got) => { const at = want.map((v) => firstAt(got, v)); return at.every((x) => x >= 0) && at.every((x, i) => i === 0 || x > at[i - 1]); };
  const distinctR = rawF.filter((v, i) => firstAt(rawF, v) === i);
  const present = distinctF.every((v) => has(carried, v)) || (distinctR.length > 0 && distinctR.every((v) => has(carried, v)));
  const numsOk = present && (inOrder(distinctF, carried) || inOrder(distinctR, carried));
  const cover = fc.size ? [...fc].filter((w) => tc.has(w)).length / fc.size : 1;
  // round 2 integrated-tree fix (adversarial N1a/N1c/N1d): a form with numbers is carried by its numbers only when the reply
  // brings no OTHER number beyond the question's ("1/3, 1/4, 3/4" lists the key's numbers, not "3/4 is bigger"; a longer form that has
  // them all, in order, still carries it), and when the side the form takes ("bigger", "no", "wrong") is in the reply or the
  // question asks it ("3/4" answers "which is bigger?", not "are they equal?" nor "Ali says 4/9 > 3/4. Check.")
  // (a number the QUESTION states may come along: "3/4 is bigger than 4/9" for "Ali says 4/9 > 3/4")
  const promptN = [...(nums(prompt) ?? []), ...rawNums(prompt)];
  // (round3 truth: siblingNums, the numbers of the item's OTHER adjudicated parts, are not extra when one part is checked)
  const extraNum = fnv.length > 0 && tn.some((v) => !has(fnv, v) && !has(rawF, v) && !has(promptN, v) && !(siblingNums && has(siblingNums, v)));
  const missingSide = fnv.length > 0 && SIDES.some((g) => {
    const f = sideOf(fw, g), t = sideOf(tw, g), q = sideOf(promptW, g);
    return f.a !== f.b && !t.a && !t.b && !(f.a ? q.a : q.b);
  });
  // a form with numbers is carried by its numbers (all, in order, nothing foreign, no contradiction); a form of words only
  // by more than half of its content words
  const ok = numsOk && !missingDecisive && !extraNum && !missingSide && !crossOpposite && (fnv.length > 0 || (fc.size > 0 && cover >= CORROBORATE.minCover) || (fc.size === 0 && fw.size > 0 && [...fw].every((w) => tw.has(w))));
  const keyLike = numsOk && cover >= CORROBORATE.keyLikeCover && (fnv.length > 0 || fc.size > 0);
  // the reply is (almost) all words of this form, numbers included and in order, nothing foreign or contradicting: it may
  // be a PART of a multi-part answer ("switch off fans" for "Any four: switch off lights and fans …") — a fail of it
  // could be a partial miss, which only the item's adjudicated parts can decide
  const tn2 = tn.filter((v) => !has(fnv, v) && !has(rawF, v)).length === 0;
  const precision = tc.size ? [...tc].filter((w) => fc.has(w)).length / tc.size : 0;
  const subset = tn2 && ((tc.size > 0 && precision >= CORROBORATE.keyLikeCover) || (tc.size === 0 && tn.length > 0))
    && (inOrder(tn.filter((v) => has(fnv, v)), fnv) || tn.length <= 1);
  return { ok, keyLike, subset, why: ok ? null : !present ? "missing_number" : !numsOk ? "number_order" : missingDecisive ? "missing_decisive" : crossOpposite ? "opposite_word" : extraNum ? "extra_number" : missingSide ? "missing_side" : "low_cover", cover };
}

/**
 * Which of the item's ADJUDICATED parts (target.parts, ≥ 2; never read off the key's punctuation) a reply carries, each
 * checked like a complete form (supports().ok: its numbers in order, no foreign number, no contradiction, enough of its
 * words). "none" | "some" | "all"; null when the item has no adjudicated parts.
 */
export function partsVerdict(target, text, allowedNums) {
  const parts = Array.isArray(target?.parts) && target.parts.length >= 2 ? target.parts.map(String) : null;
  if (!parts) return null;
  const prompt = `${target.item?.prompt_en ?? ""} ${target.item?.prompt_hi ?? ""}`;
  const allowed = allowedNums ?? [target.key, ...(target.also ?? []), target.item?.prompt_en, target.item?.prompt_hi].flatMap((s) => [...(nums(s) ?? []), ...rawNums(s)]);
  const got = parts.map((p, i) => supports(p, text, allowed, null, prompt, parts.filter((_, j) => j !== i).flatMap((q) => [...(nums(q) ?? []), ...rawNums(q)])).ok);
  return got.every(Boolean) ? "all" : got.some(Boolean) ? "some" : "none";
}

/**
 * Apply the rule to a model-labelled classification. Only an item turn the MODEL labelled is touched; every other
 * result (exact, number, chip, module, help, request, safety, error) passes through unchanged, flags included.
 * @param {{ target: any, text: string, result: any }} a
 * @returns {any} the result, with outcome possibly "no_evidence" and `corroboration` set
 */
export function corroborate({ target, text, result }) {
  if (!result || result.source !== "model" || target?.mode !== "item") return result;
  const o = result.outcome;
  if (!["correct", "incorrect", "misconception", "partial"].includes(o)) return result;
  const forms = completeForms(target);
  if (!forms.length) return result;
  const allowed = [target.key, ...(target.also ?? []), ...(target.options ?? []).map((x) => x?.text), target.item?.prompt_en, target.item?.prompt_hi]
    .flatMap((s) => [...(nums(s) ?? []), ...rawNums(s)]);
  const reads = forms.map((f) => supports(f, text, allowed, forms, `${target.item?.prompt_en ?? ""} ${target.item?.prompt_hi ?? ""}`));
  if (o === "correct") {
    if (reads.some((r) => r.ok)) return { ...result, corroboration: "supported" };
    const why = reads.map((r) => r.why).find((w) => w && w !== "low_cover") ?? reads[0]?.why ?? "low_cover";
    const { misconceptionId: _m, reason: _r, reasonMisconceptionId: _rm, ...rest } = result;
    return { ...rest, outcome: "no_evidence", corroboration: `unsupported_credit:${why}` };
  }
  if (reads.some((r) => r.keyLike)) {
    const { misconceptionId: _m, ...rest } = result;
    return { ...rest, outcome: "no_evidence", corroboration: `keylike_${o}` };
  }
  // a plain "incorrect" or "partial" (never a named misconception, which is evidence about the belief) on a reply made only
  // of the key's own words or numbers: a part of the key the model failed, or the whole of it the model called partial —
  // only the item's adjudicated parts can tell; no evidence rather than a wrong grade
  if ((o === "incorrect" || o === "partial") && reads.some((r) => r.subset)) {
    // round3 truth (owner-1 on taxila.dev 2026-10-09, V1.1 oracle: 3 of 4 half answers re-asked with no verdict, e.g. "A: 6"
    // for "What comes next in each?"; grading-truth model leg on grok: 133 of 172 two-rater partial answers abstained): when
    // the item HAS adjudicated parts (data/kits-parts.json, shipped 2026-10-09), code can tell. A reply that carries some of
    // the parts, by the same check a complete form must pass, and not all of them, is the V1.1 partial — whatever the
    // model's label of it was. A reply carrying every part stays no evidence (it looks complete; the model disagreed).
    const parts = partsVerdict(target, text, allowed);
    if (parts === "some") {
      const { misconceptionId: _m, ...rest } = result;
      return { ...rest, outcome: "partial", corroboration: `parts_some_${o}` };
    }
    return { ...result, outcome: "no_evidence", corroboration: `subset_${o}` };
  }
  return { ...result, corroboration: "not_keylike" };
}
