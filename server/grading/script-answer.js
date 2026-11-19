// 048 (script cards hear the answer the way a child says it; docs/patches/to-brain/048-script-cards-hear-hindi-as-spoken.md).
// The script-card grader's normal form: a reply, a key, an accept form or a listed wrong answer becomes one sequence of tokens
// in which
//   - every number is read by THE reader (server/grading/spoken-number.js) in both scripts and in English words, and written
//     as a value token: "#2", "#1500", a fraction keeps its numerator and denominator ("#1/4": 2/8 is NOT 1/4; the card's
//     forms decide that, not arithmetic), a mixed number or a decimal is its value ("#1.75");
//   - `do` is two only where it can be a number (beside another number word, first, or after hai / toh / sirf ...), never
//     the verb ("bata do", "jod do");
//   - the equal words of both scripts meet (after = baad = बाद, same = equal = barabar = बराबर, yes = haan = हाँ), fillers
//     and hedges go, units are a kind of their own;
//   - operators are kept as operators (G7: a sum is not a bag of numbers), a denial is kept where it stands (G7: "nahi,
//     right angle hai" is not "right angle nahi hai"), and numbers keep their order (G7: "4/9, 4/7, 4/5" is not its reverse).
// PURE. No model, no network.
import { numberPhrases, spokenNumber, READER_TABLES as T } from "./spoken-number.js";

const DEVA = /[ऀ-ॿ]/;
const fold = (w) => (DEVA.test(w) ? T.devKey(w) : w);

// the equal words, both scripts (classify.js v4 W4 WORD_SAME, and 048 G2's Devanagari list with and without nukta / candrabindu)
const SAME0 = { after: "baad", before: "pehle", between: "beech", bich: "beech", bigger: "bada", larger: "bada", greater: "bada", badi: "bada", bade: "bada",
  smaller: "chhota", chhoti: "chhota", chhote: "chhota", less: "chhota", more: "zyada", jyada: "zyada", zyaada: "zyada", jyaada: "zyada", equal: "barabar",
  same: "barabar", yes: "haan", no: "nahi", nahin: "nahi", nhi: "nahi", han: "haan", ha: "haan", haa: "haan", piche: "peeche", pichhe: "peeche",
  "हाँ": "haan", "हां": "haan", "नहीं": "nahi", "नही": "nahi", "बराबर": "barabar", "बड़ा": "bada", "बड़ी": "bada", "बड़े": "bada", "छोटा": "chhota", "छोटी": "chhota",
  "छोटे": "chhota", "ज़्यादा": "zyada", "ज़्यादा": "zyada", "कम": "kam", "पहले": "pehle", "बाद": "baad", "बीच": "beech", "आगे": "aage", "पीछे": "peeche",
  "गलत": "galat", "ग़लत": "galat", "दोनों": "dono", "दोनो": "dono", "सब": "sab", "सभी": "sabhi" };
const SAME = new Map(Object.entries(SAME0).map(([k, v]) => [fold(k), v]));
// fillers and hedges (classify.js WORD_FILL, the hedge heads of hedgeCore, and their Devanagari forms)
const FILL = new Set(["ke", "ki", "ka", "se", "mein", "me", "par", "pe", "hai", "hain", "the", "a", "an", "of", "is", "it", "its", "to", "and", "aur", "wala", "wali",
  "wale", "waala", "waali", "waale", "na", "toh", "to", "mujhe", "lagta", "lagti", "shayad", "shaayad", "maybe", "i", "think", "guess", "ji", "bilkul",
  "hoga", "hogi", "honge", "sirf", "bas", "just", "only", "answer", "jawab", "javab", "hmm", "umm", "achha", "acha",
  "के", "की", "का", "से", "में", "मे", "पर", "पे", "है", "हैं", "वाला", "वाली", "वाले", "ना", "तो", "और", "मुझे", "लगता", "लगती", "शायद", "जी", "बिल्कुल",
  "बिलकुल", "होगा", "होगी", "होंगे", "सिर्फ़", "सिर्फ", "बस", "जवाब"].map(fold));
const NEG = new Set(["nahi", "not", "galat", "wrong", "isn't", "isnt", "nope"]);
// G8: "dono barabar" is "barabar"
const ALL_WORDS = new Set(["dono", "donon", "both", "sab", "sabhi", "all"]);
const UNIT0 = { cm: "cm", centimetre: "cm", centimetres: "cm", centimeter: "cm", centimeters: "cm", "सेंटीमीटर": "cm", mm: "mm", millimetre: "mm", millimeter: "mm",
  m: "m", metre: "m", metres: "m", meter: "m", meters: "m", "मीटर": "m", km: "km", kilometre: "km", kilometres: "km", kilometer: "km", kilometers: "km",
  "किलोमीटर": "km", kg: "kg", kilo: "kg", kilogram: "kg", kilograms: "kg", "किलो": "kg", "किलोग्राम": "kg", g: "g", gm: "g", gram: "g", grams: "g", "ग्राम": "g",
  l: "l", litre: "l", litres: "l", liter: "l", liters: "l", "लीटर": "l", ml: "ml", rs: "rs", rupees: "rs", rupee: "rs", rupaye: "rs", "रुपये": "rs", "रुपए": "rs" };
const UNIT = new Map(Object.entries(UNIT0).map(([k, v]) => [fold(k), v]));
const SHORT_UNIT = new Set(["m", "g", "l"]);   // a unit only right after a number
// operators (G7): + − × ÷ =, in symbols and words, both scripts
const OP0 = { "+": "+", plus: "+", jod: "+", jodo: "+", jodna: "+", jodenge: "+", "जोड़": "+", "जोड़ो": "+", "प्लस": "+",
  "×": "×", "*": "×", guna: "×", gunaa: "×", times: "×", into: "×", multiply: "×", multiplied: "×", "गुणा": "×", "गुना": "×", "टाइम्स": "×",
  "÷": "÷", bhaag: "÷", bhag: "÷", divide: "÷", divided: "÷", "भाग": "÷",
  ghata: "-", ghatao: "-", ghatana: "-", "घटा": "-", "घटाओ": "-", "माइनस": "-", "=": "=", equals: "=" };
const OP = new Map(Object.entries(OP0).map(([k, v]) => [fold(k), v]));
// words before which a Latin "do" / "das" / "saath" ... is a number ("mujhe lagta hai do", "sirf do")
const LEAD = new Set(["hai", "hain", "toh", "to", "sirf", "bas", "shayad", "shaayad", "lagta", "ji", "haan", "ki", "answer", "jawab", "is", "hoga"]);
// Latin verb stems a "do" after is the verb ("bata do", "jod do"), as the reader's DO_VERB_STEMS for दो
const DO_VERBS = new Set(["bata", "samjha", "dikha", "suna", "kar", "de", "likh", "bol", "sikha", "bana", "jod", "ghata", "laga", "rakh", "hata", "nikal",
  "kaat", "baant", "chun", "gin", "padh", "dikhao", "batao", "chhod", "bhej", "bhaag", "bhag", "guna"]);
const DO_VERBS_DEV = new Set([...T.doVerbStems, "जोड़", "घटा", "लगा", "रख", "हटा", "निकाल", "काट", "बाँट", "गिन", "पढ़", "भाग", "गुणा"].map(fold));
const SCALE = new Set(Object.keys(T.scale).map(fold));
const OVER = new Set([...T.over].map(fold));
const DEN = new Map(Object.entries(T.den).map(([k, v]) => [fold(k), v]));
const PREFIX = new Set(Object.keys(T.prefix));
const WEAK = new Set([...T.weak].filter((w) => w !== "no"));
const HALF = new Set(["half", "aadha", "adha", "aadhi", "आधा", "आधी"].map(fold)), QUARTER = new Set(["quarter", "pav", "paav", "पाव"].map(fold));

const TOK = /\d+(?:st|nd|rd|th)(?![\p{L}])|\d+(?:\.\d+)?|[\p{L}\p{M}]+(?:'[\p{L}]+)?|[+\-×*÷=/,]/gu;
const isInt = (t) => /^\d+$/.test(t);
const numTok = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(6)));

/** One whole number from a run of words, or null. */
function single(words) {
  const ph = numberPhrases(words.join(" "));
  return ph && ph.length === 1 && Number.isInteger(ph[0]) && ph[0] >= 0 ? ph[0] : null;
}

/** The value tokens of a run of number words (null: not readable, the words stay words). */
function readRun(run) {
  const ws = run.map((x) => x.t);
  if (ws.length === 1 && HALF.has(fold(ws[0]))) return ["1/2"];
  if (ws.length === 1 && QUARTER.has(fold(ws[0]))) return ["1/4"];
  const o = run.findIndex((x, i) => x.c === "over" && i > 0 && i < run.length - 1);
  if (o > 0) {
    const a = single(ws.slice(0, o)), b = single(ws.slice(o + 1));
    if (a != null && b) return [`${a}/${b}`];
  }
  const last = run.at(-1);
  if (run.length >= 2 && last.c === "den") {
    const a = single(ws.slice(0, -1));
    if (a != null) return [`${a}/${DEN.get(fold(last.t))}`];
  }
  const ph = numberPhrases(ws.join(" "), { split: true });
  return ph && ph.length ? ph.map(numTok) : null;
}

/** The items of a text: numbers read, operators found, words as written (lower case). */
function items(raw) {
  const s = String(raw ?? "").toLowerCase().normalize("NFC").replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
    .replace(/[−–—]/g, "-").replace(/(\d),(?=\d{2,3}(?!\d))/g, "$1").replace(/₹/g, " ");
  const toks = s.match(TOK) ?? [];
  // digit fractions ("3/4", "3 by 4", "3 bata 4") and mixed numbers ("1 3/4")
  const a = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i], n1 = toks[i + 1], n2 = toks[i + 2];
    // "6-6 cm" (written with no space, the same number twice) is Hindi's "6 each", never 6 − 6
    if (isInt(t) && n1 === "-" && n2 === t && new RegExp(`(?:^|[^\\d])${t}-${t}(?!\\d)`).test(s)) { a.push({ k: "num", v: t, int: true }, { k: "raw", t: "each" }); i += 2; continue; }
    if (isInt(t) && n1 && (n1 === "/" || OVER.has(fold(n1))) && n2 && isInt(n2) && +n2) { a.push({ k: "num", v: `${+t}/${+n2}`, frac: [+t, +n2] }); i += 2; continue; }
    if (/^\d+(?:\.\d+)?$/.test(t)) { a.push({ k: "num", v: numTok(Number(t)), int: isInt(t) }); continue; }
    a.push({ k: "raw", t });
  }
  for (let i = 0; i + 1 < a.length; i++) {
    if (a[i].k === "num" && a[i].int && a[i + 1].k === "num" && a[i + 1].frac) {
      const [n, d] = a[i + 1].frac;
      a.splice(i, 2, { k: "num", v: numTok(Number(a[i].v) + n / d) });
    }
  }
  // word classes
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    if (x.k !== "raw") continue;
    const t = x.t, f = fold(t), prev = a[i - 1];
    if (t === "x" && prev?.k === "num" && a[i + 1]?.k === "num") { x.k = "op"; x.v = "×"; continue; }
    if (OP.has(f)) {
      x.k = "op"; x.v = OP.get(f);
      if ((t === "divided" || t === "multiplied") && a[i + 1]?.t === "by") a.splice(i + 1, 1);
      continue;
    }
    if (t === "-" || t === "minus") { x.k = "sign"; continue; }
    if (SCALE.has(f)) { x.c = "scale"; continue; }
    if (OVER.has(f)) { x.c = "over"; continue; }
    if (DEN.has(f) && !HALF.has(f) && !QUARTER.has(f)) { x.c = "den"; continue; }
    if (PREFIX.has(t)) { x.c = "prefix"; continue; }
    if (t === "point") { x.c = "point"; continue; }
    if (t === "दो" && prev?.k === "raw" && DO_VERBS_DEV.has(fold(prev.t))) { x.verb = true; continue; }
    if (WEAK.has(t)) { x.c = "weak"; continue; }
    if (spokenNumber(t) != null) x.c = "n";
    else if (HALF.has(f) || QUARTER.has(f)) x.c = "n";
  }
  // a weak word ("do", "das", "saath", "tees", "bees") is a number beside a number, first, or after a lead word
  const isN = (y) => y && (y.k === "num" || y.c === "n" || y.c === "prefix");
  const firstContent = a.findIndex((y) => !(y.k === "raw" && !y.c && FILL.has(fold(y.t))));
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    if (x.c !== "weak") continue;
    const prev = a[i - 1], next = a[i + 1];
    const verb = prev && (prev.k === "op" || (prev.k === "raw" && !prev.c && DO_VERBS.has(prev.t)));
    // ("do guna" is twice: a "do" right before an operator is the number; one right after it is the verb, "bhaag do")
    const beside = isN(prev) || isN(next) || (next && (next.c === "scale" || next.c === "den" || next.k === "op")) || prev?.c === "scale"
      || ((prev?.c === "over" || (prev?.k === "raw" && /^(?:aur|and)$/.test(prev.t))) && isN(a[i - 2]));
    x.c = !verb && (beside || i === firstContent || (prev && prev.k === "raw" && LEAD.has(prev.t))) ? "n" : null;
    // (a "do" that is no number is the verb: "bata do", "bhaag do"; it says nothing about the answer)
    if (!x.c && x.t === "do") x.verb = true;
  }
  // runs of number words → value tokens
  const out = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const starts = x.k === "raw" && (x.c === "n" || (x.c === "prefix" && a[i + 1] && (a[i + 1].c === "n" || a[i + 1].k === "num")));
    if (!starts && !(x.k === "num" && x.int && a[i + 1]?.k === "raw" && (a[i + 1].c === "scale" || a[i + 1].c === "den" || a[i + 1].c === "over"))) { out.push(x); continue; }
    let j = i;
    const inRun = (y) => y && ((y.k === "raw" && y.c && y.c !== "weak") || (y.k === "num" && y.int));
    while (inRun(a[j + 1])) j++;
    while (j > i && ["over", "point", "prefix"].includes(a[j].c)) j--;
    const run = a.slice(i, j + 1).map((y) => (y.k === "num" ? { t: y.v, c: "n" } : y));
    const vals = readRun(run);
    if (vals) { for (const v of vals) out.push({ k: "num", v }); i = j; continue; }
    out.push(x);
  }
  // signs: "-3", "minus 3" (after a number, an operator)
  const res = [];
  for (let i = 0; i < out.length; i++) {
    const x = out[i];
    if (x.k === "sign") {
      const prev = res.at(-1), next = out[i + 1];
      if (prev?.k === "num" && next?.k === "num") { res.push({ k: "op", v: "-" }); continue; }
      if (next?.k === "num") { res.push({ k: "num", v: `-${next.v}` }); i++; continue; }
      continue;
    }
    res.push(x);
  }
  // "30 ko 6 se bhaag" is 30 ÷ 6 (G7: the order is part of it)
  for (let i = 0; i + 4 < res.length; i++) {
    const [A, ko, B, se, op] = res.slice(i, i + 5);
    if (A.k === "num" && ko.k === "raw" && /^(?:ko|mein|me|को|में)$/.test(ko.t) && B.k === "num" && se.k === "raw" && /^(?:se|से)$/.test(se.t) && op.k === "op") res.splice(i, 5, A, op, B);
  }
  return res;
}

/**
 * The normal form of a text. @returns {{ seq: {k: string, t: string}[], nums: string[], words: string[], units: string[],
 * neg: boolean, ops: boolean, deva: boolean }}
 */
export function canon(raw) {
  const it = items(raw);
  let seq = [];
  it.forEach((x, i) => {
    if (x.k === "num") { seq.push({ k: "num", t: `#${x.v}` }); return; }
    if (x.k === "op") { seq.push({ k: "op", t: x.v }); return; }
    const t = x.t;
    if (!t || t === "," || t === "/" || t === "-" || x.verb) return;
    const f0 = fold(t), f = SAME.get(f0) ?? f0;
    if (UNIT.has(f0) && (!SHORT_UNIT.has(f0) || it[i - 1]?.k === "num")) { seq.push({ k: "unit", t: UNIT.get(f0) }); return; }
    // (a denial keeps its word: "galat nahi" — not wrong — is never "galat")
    if (NEG.has(f)) { seq.push({ k: "neg", t: f === "galat" || f === "wrong" ? "galat" : "nahi" }); return; }
    if ((f === "na" || f === fold("ना")) && !seq.length) { seq.push({ k: "neg", t: "nahi" }); return; }
    if (FILL.has(f)) return;
    seq.push({ k: "w", t: f });
  });
  if (seq.some((x) => x.t === "barabar")) seq = seq.filter((x) => !(x.k === "w" && ALL_WORDS.has(x.t)));
  seq = seq.filter((x, i) => !(i > 0 && x.t === "haan" && seq[i - 1].t === x.t));
  return {
    seq, nums: seq.filter((x) => x.k === "num").map((x) => x.t), words: seq.filter((x) => x.k === "w").map((x) => x.t),
    units: [...new Set(seq.filter((x) => x.k === "unit").map((x) => x.t))], neg: seq.some((x) => x.k === "neg"), ops: seq.some((x) => x.k === "op"),
    deva: DEVA.test(String(raw ?? "")),
  };
}

const setEq = (a, b) => { const A = new Set(a), B = new Set(b); if (A.size !== B.size) return false; for (const x of A) if (!B.has(x)) return false; return true; };
const join = (s) => s.map((x) => x.t).join(" ");

/** G7: the same expression — the same operators and the same numbers the same number of times; order free only under + and ×. */
function sameExpr(A, B) {
  const segs = (s) => { const out = [[]]; for (const x of s) if (x.k === "op" && x.t === "=") out.push([]); else if (x.k === "num" || x.k === "op") out.at(-1).push(x); return out; };
  const a = segs(A), b = segs(B);
  if (a.length !== b.length) return false;
  return a.every((sa, i) => {
    const sb = b[i];
    const opsA = sa.filter((x) => x.k === "op").map((x) => x.t), opsB = sb.filter((x) => x.k === "op").map((x) => x.t);
    const one = (o) => o.length && o.every((x) => x === o[0]) && (o[0] === "+" || o[0] === "×");
    const alt = (s) => s.every((x, j) => (j % 2 === 0 ? x.k === "num" : x.k === "op")) && s.length % 2 === 1;
    if (one(opsA) && one(opsB) && opsA[0] === opsB[0] && alt(sa) && alt(sb)) {
      const na = sa.filter((x) => x.k === "num").map((x) => x.t).sort(), nb = sb.filter((x) => x.k === "num").map((x) => x.t).sort();
      return na.join(" ") === nb.join(" ");
    }
    return join(sa) === join(sb);
  });
}

/** Are two normal forms the same answer? (exact in what decides it, free in fillers and equal words) */
export function sameAnswer(a, b) {
  if (!a?.seq.length || !b?.seq.length) return false;
  if (a.units.length && b.units.length && !setEq(a.units, b.units)) return false;
  const A = a.seq.filter((x) => x.k !== "unit"), B = b.seq.filter((x) => x.k !== "unit");
  if (!A.length || !B.length) return false;
  if (a.ops || b.ops) return a.ops && b.ops && setEq(a.words, b.words) && sameExpr(A, B);
  // a denial is the same only where it stands in the same place (G7)
  if (a.neg || b.neg) return join(A) === join(B);
  // the words as a set; the numbers in their order (G7: a list of values is ordered)
  return setEq(a.words, b.words) && a.nums.join(" ") === b.nums.join(" ");
}

/** A form that is one number (with a unit at most): its value token, else null. */
export const numberOf = (c) => (c && c.nums.length === 1 && !c.words.length && !c.ops && !c.neg ? c.nums[0] : null);

/** Words beside a lone number that change what the reply says about it ("25 se kam", "8 ke baad", "3 ya 4"). */
export const RISK = new Set(["bada", "chhota", "zyada", "kam", "pehle", "baad", "beech", "aage", "peeche", "upar", "neeche", "than", "ya", "or", "या", "baaki",
  "total", "kul", "har", "barabar", "dono", "pehla", "doosra", "aakhri", "last", "first", "second"].map(fold));

/** wrongIfMis as a list (G8: a string or a list of strings). */
export const wrongList = (w) => (Array.isArray(w) ? w : w != null ? [w] : []).map((x) => String(x ?? "").trim()).filter(Boolean);

/**
 * The options a prompt offers ("…: 1/8 ya 1/10?", "Kaun aage hai, 9/5 ya 9/10?"), or [] when it offers none it can split.
 * @param {string} prompt @returns {string[]}
 */
export function optionsIn(prompt) {
  const qs = String(prompt ?? "").split(/[?？]/).map((s) => s.trim()).filter(Boolean);
  const q = [...qs].reverse().find((s) => /\s(?:ya|or|या)\s/i.test(s));
  if (!q) return [];
  const colon = q.includes(":");
  let body = colon ? q.slice(q.lastIndexOf(":") + 1) : q;
  body = body.split(/[.!।]\s/).at(-1);
  const parts = body.split(/\s*,?\s+(?:ya\s+phir|ya|or|या)\s+/i).map((s) => s.replace(/^[\s,]+|[\s,]+$/g, "")).filter(Boolean);
  if (parts.length < 2 || parts.length > 4) return [];
  if (!colon) {
    // no colon: the first option is the first part's tail, as long as the last option
    const n = parts.at(-1).split(/\s+/).length, w = parts[0].split(/\s+/);
    parts[0] = w.slice(-n).join(" ");
  }
  return parts;
}

/**
 * G3: the one option a reply names, its shared noun dropped ("12 wali" for "12 wali patti" against "8 wali patti"): the
 * reply holds every token that sets that option apart and none that sets another apart, and nothing beyond the option's own
 * tokens. Only when exactly one option qualifies. @returns {number} the option's index, or -1
 */
export function pickOption(reply, opts) {
  if (!reply?.seq.length || reply.neg || reply.ops || opts.length < 2) return -1;
  const sets = opts.map((o) => new Set(o.seq.map((x) => x.t)));
  const R = new Set(reply.seq.map((x) => x.t));
  const apart = sets.map((s, i) => [...s].filter((t) => sets.every((o, j) => j === i || !o.has(t))));
  if (apart.some((d) => !d.length)) return -1;
  const hits = sets.map((s, i) => i).filter((i) => apart[i].every((t) => R.has(t)) && apart.every((d, j) => j === i || !d.some((t) => R.has(t)))
    && [...R].every((t) => sets[i].has(t)));
  return hits.length === 1 ? hits[0] : -1;
}
