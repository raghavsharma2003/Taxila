// ONE reader for a number a child writes or says (VALUES-100 V1.1). Before this, five graders each had their own
// (placement/grade.js parseNumber, comprehension/grade/numbers.js numbersIn, director/classify.js norm, owner-truth
// patch 01 numericOf, forge/kitmath.js parseValue), and the grading-truth battery found each one wrong in its own way:
// "three hundred." read as 3, "ek sau pandrah" as 100, "minus 3" as 3, "-1250" as 1250, "point five" as 5, "three
// quarters" as 3 (evals/grading-truth, 2026-10-05). The rule here: return a value only when EVERY number word in the
// reply composes into exactly one number; anything unreadable or ambiguous is null (the grader abstains, a re-ask),
// never a different number.
//
// Reads: Latin and Devanagari digits; Indian (3,45,000) and international (345,000) grouping; decimals ("2.5", ".5",
// "two point five"); fractions ("3/4", "3 by 4", "3 upon 4", "teen bata chaar", "three fourths", "three quarters",
// "ek tihai", "teen chauthai"), mixed numbers ("1 1/2"), Hindi fraction words (aadha, dedh, dhai, sawa / saade / paune +
// a number); English number words (international and lakh / crore); Roman-Hindi 1-99 with common spellings, sau, hazaar,
// lakh, crore; Devanagari number words 1-100; a digit times a scale word ("3 lakh"); a sign word (minus, negative) or "-".
// Filler and unit words are ignored; a hedge ("12 ya 13"), two different numbers, or an unknown word INSIDE a number
// phrase is null. Pure.

const EN1 = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen"];
const EN10 = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const HI99 = ("ek do teen chaar paanch chhah saat aath nau das gyaarah baarah terah chaudah pandrah solah satrah athaarah unnees bees ikkees baais teis chaubees " +
  "pachchees chhabbees sattaees atthaees untees tees iktees battees taintees chauntees paintees chhattees saintees adtees untaalees chaalees iktaalees bayaalees " +
  "taintaalees chavaalees paintaalees chhiyaalees saintaalees adtaalees unchaas pachaas ikyaavan baavan tirpan chauvan pachpan chhappan sattaavan atthaavan unsath " +
  "saath iksath baasath tirsath chausath painsath chhiyaasath sadsath adsath unhattar sattar ikhattar bahattar tihattar chauhattar pachhattar chhihattar satattar " +
  "athattar unaasi assi ikyaasi bayaasi tiraasi chauraasi pachaasi chhiyaasi sattaasi athaasi navaasi nabbe ikyaanve baanve tiraanve chauraanve pachaanve " +
  "chhiyaanve sattaanve atthaanve ninyaanve").split(" ");
/** Folded spelling: doubled vowels collapse, so "chaar"/"char" and "pachaas"/"pachas" meet; other variants are listed. */
// (no aspirate folding: "saat" 7 and "saath" 60 differ only by it)
const fold = (w) => w.replace(/aa/g, "a").replace(/ee|ii/g, "i").replace(/oo|uu/g, "u").replace(/w/g, "v");
const HI = new Map();
HI99.forEach((w, i) => HI.set(fold(w), i + 1));
for (const [w, n] of Object.entries({ chhe: 6, che: 6, chah: 6, chheh: 6, chhah: 6, cheh: 6, panch: 5, paach: 5, unnis: 19, unis: 19, ikkis: 21, pachchis: 25, pachis: 25, chabbis: 26, chalis: 40, pachas: 50,
  nabbe: 90, navve: 90, sath: 60, sau: 100 })) if (!HI.has(fold(w))) HI.set(fold(w), n);
const DEV = { "शून्य": 0, "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पांच": 5, "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10, "ग्यारह": 11, "बारह": 12, "तेरह": 13,
  "चौदह": 14, "पंद्रह": 15, "सोलह": 16, "सत्रह": 17, "अठारह": 18, "उन्नीस": 19, "बीस": 20, "पच्चीस": 25, "तीस": 30, "चालीस": 40, "पचास": 50, "साठ": 60, "सत्तर": 70,
  "अस्सी": 80, "नब्बे": 90 };
const SCALE = { hundred: 100, sau: 100, "सौ": 100, thousand: 1000, hazaar: 1000, hazar: 1000, hajar: 1000, "हज़ार": 1000, "हजार": 1000, lakh: 1e5, lac: 1e5, lakhs: 1e5,
  "लाख": 1e5, crore: 1e7, karod: 1e7, crores: 1e7, "करोड़": 1e7, million: 1e6 };
const DEN = { half: 2, halves: 2, third: 3, thirds: 3, fourth: 4, fourths: 4, quarter: 4, quarters: 4, fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7,
  eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10, twelfth: 12, twelfths: 12, chauthai: 4, tihai: 3 };
const SPECIAL = { half: 0.5, aadha: 0.5, adha: 0.5, aadhi: 0.5, "आधा": 0.5, dedh: 1.5, derh: 1.5, "डेढ़": 1.5, dhai: 2.5, dhaai: 2.5, "ढाई": 2.5 };
const PREFIX = { sawa: 0.25, savva: 0.25, saade: 0.5, sade: 0.5, saadhe: 0.5, sadhe: 0.5, paune: -0.25 };
const SIGN = new Set(["minus", "negative", "ऋण"]);
const JOIN = new Set(["and", "aur"]);
const OVER = new Set(["by", "upon", "bata", "over"]);
/** "do" and "no" are English words too: a number only next to another number word. */
const WEAK = new Set(["do", "no", "das", "saath", "tees", "bees"]);

function wordNum(w) {
  if (EN1.includes(w)) return { v: EN1.indexOf(w), k: "unit" };
  if (w in EN10) return { v: EN10[w], k: "tens" };
  if (w in DEV) return { v: DEV[w], k: "unit" };
  const h = HI.get(fold(w));
  if (h != null && h !== 100) return { v: h, k: "unit", hi: true };
  return null;
}

/**
 * The one number a reply gives, or null.
 * @param {unknown} raw @returns {number | null}
 */
export function spokenNumber(raw) {
  const ph = numberPhrases(raw);
  if (!ph) return null;
  const distinct = ph.filter((v, i) => ph.findIndex((u) => Math.abs(u - v) < 1e-9) === i);
  return distinct.length === 1 ? distinct[0] : null;
}

const DISCRIM = /(?:^|[^\p{L}])(?:lakhs?|lacs?|crores?|karod|hazaa?r|thousands?|millions?|billions?|hundreds?|tens|ones|tenths?|hundredths?|thousandths?|halves|half|thirds?|quarters?|fourths?|a\.?\s?m\.?|p\.?\s?m\.?|bce|bc|ce|ad|th|st|nd|rd|century|centuries|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|apr|jun|jul|aug|sept?|oct|nov|dec|east|west|north|south|clockwise|anticlockwise|anti-clockwise|left|right|up|down|more|less|fewer|greater|smaller|before|after|full|turns?|times)(?![\p{L}])|°\s*[ewns](?![\p{L}])/iu;
/** A key that IS a number (an optional ₹ / Rs and a unit of up to three words around it): its value, else null. */
export function plainNumberKey(answer) {
  // review v1 (2026-10-05): a key whose words after the number change WHAT the number is ("8 a.m.", "320 BCE coin",
  // "4 lakh", "3 hundreds", "16 tenths", "21 June", "82.5°E") is not a plain number: the V1-02 by-value path credited
  // "8 p.m." for "8 a.m.", "320 CE" for "320 BCE", "3 tens" for "3 hundreds" and a bare "4" for "4 lakh". Those keys
  // keep today's path (exact match, then the model).
  const tail = String(answer ?? "").trim().replace(/^(?:₹|rs\.?)\s*/i, "").match(/\s*(?:[\p{L}°²³%][\p{L}°²³%.]*\s*){0,3}$/u)?.[0] ?? "";
  if (DISCRIM.test(tail)) return null;
  const s = String(answer ?? "").trim().replace(/^(?:₹|rs\.?)\s*/i, "").replace(/\s*(?:[\p{L}°²³%][\p{L}°²³%.]*\s*){0,3}$/u, "").trim();
  if (!/^-?(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d+)?$|^\d+\s*\/\s*\d+$|^\d+\s+\d+\s*\/\s*\d+$/.test(s)) return null;
  return spokenNumber(s);
}

/**
 * Every number phrase in a reply, in order (a self-correction or a hedge gives two), or null when a number phrase cannot
 * be read (an unknown word inside it, two units in a row, a zero denominator).
 * @param {unknown} raw @returns {number[] | null}
 */
export function numberPhrases(raw) {
  let s = String(raw ?? "").toLowerCase().normalize("NFC").replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
    .replace(/[−–—]/g, "-").replace(/₹|\brs\.?|\brupees?\b|\brupaye\b/g, " ")
    .replace(/(?<=\d),(?=\d)/g, "").replace(/(\p{L})-(?=\p{L})/gu, "$1 ");
  // digit fractions and mixed numbers first ("1 1/2", "3/4", "3 by 4", "3 upon 4"), then decimals
  s = s.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g, (_, w, n, d) => (+d ? ` #${+w + +n / +d}# ` : " #NaN# "))
    .replace(/(-?\d+(?:\.\d+)?)\s*(?:\/|\bby\b|\bupon\b|\bbata\b)\s*(\d+(?:\.\d+)?)/g, (_, n, d) => (+d ? ` #${+n / +d}# ` : " #NaN# "));
  const toks = s.split(/[^\p{L}\p{M}\p{N}#.\-]+/u).map((t) => t.replace(/^[.\-]+(?=\D)|[.\-]+$/g, "").replace(/^\.(?=\d)/, "0.")).filter(Boolean);
  const phrases = [];   // each: number
  let cur = null;        // { total, part, last, sign, prefix, num }
  const open = () => (cur ??= { total: 0, part: null, last: null, sign: 1, prefix: 0, num: null, words: 0 });
  const close = () => {
    if (!cur) return true;
    if (cur.part === null && !cur.total && !cur.prefix) { cur = null; return true; }
    let v = cur.total + (cur.part ?? 0) + cur.prefix;
    if (cur.num !== null) { if (!v) return false; v = cur.num / v; }
    phrases.push(cur.sign * v);
    cur = null;
    return true;
  };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i], next = toks[i + 1];
    let m;
    if ((m = /^#(.+)#$/.exec(t))) { if (!close()) return null; if (m[1] === "NaN") return null; phrases.push(Number(m[1])); continue; }
    if (/^-?\d+(?:\.\d+)?$/.test(t)) {
      const neg = t.startsWith("-");
      const v = Math.abs(Number(t));
      if (cur && cur.part === null && !cur.total && (cur.sign === -1 || cur.prefix)) { cur.part = v; if (neg) cur.sign = -1; continue; }
      if (!close()) return null;
      open(); cur.part = v; cur.last = "digits"; if (neg) cur.sign = -1;
      if (!(next && next in SCALE)) { if (!close()) return null; }
      continue;
    }
    if (SIGN.has(t) && next && (/^\d/.test(next) || wordNum(next) || next in SPECIAL)) { if (!close()) return null; open(); cur.sign = -1; continue; }
    if (t === "point" && next) {
      const digits = [];
      let j = i + 1;
      for (; j < toks.length; j++) { const w = wordNum(toks[j]); if (w && w.v <= 9 && w.k === "unit" && !w.hi) digits.push(w.v); else if (/^\d$/.test(toks[j])) digits.push(+toks[j]); else break; }
      if (!digits.length) return null;
      open();
      cur.part = (cur.part ?? 0) + Number(`0.${digits.join("")}`);
      i = j - 1; if (!close()) return null;
      continue;
    }
    if (t in PREFIX) { if (!close()) return null; open(); cur.prefix = PREFIX[t]; continue; }
    if (t in SPECIAL && !(t === "half" && cur && cur.part !== null)) { if (!close()) return null; phrases.push(SPECIAL[t]); continue; }
    if (cur && t in DEN && cur.part !== null && cur.num === null) {           // "three fourths", "teen chauthai", "one half"
      const n = cur.total + cur.part; cur = null; phrases.push(n / DEN[t]); continue;
    }
    if (cur && OVER.has(t) && cur.part !== null && next && (wordNum(next) || /^\d/.test(next))) { cur.num = cur.total + cur.part; cur.total = 0; cur.part = null; cur.last = null; continue; }
    if (t in SCALE) {
      open();
      const mult = SCALE[t];
      if (mult === 100) { cur.part = ((cur.part ?? 0) || 1) * 100 + (cur.prefix ? cur.prefix * 100 : 0); cur.prefix = 0; cur.last = "hundred"; }
      else { cur.total += (((cur.part ?? 0) || 1) + cur.prefix) * mult; cur.part = null; cur.prefix = 0; cur.last = "scale"; }
      continue;
    }
    if (JOIN.has(t) && cur && cur.part !== null) continue;                   // "one hundred and twelve"
    const w = wordNum(t);
    if (w && !(WEAK.has(t) && !cur && !(next && (next in SCALE || wordNum(next) || next in DEN || OVER.has(next))) && toks.length > 2)) {
      open();
      if (w.k === "tens") { if (cur.last === "unit" || cur.last === "tens" || cur.last === "digits") return null; cur.part = (cur.last === "hundred" ? cur.part : 0) + w.v; cur.last = "tens"; continue; }
      if (cur.last === "unit" || cur.last === "digits") return null;          // "two three", "teen chaar": not one number
      if (cur.last === "tens") { if (w.v >= 10 || w.hi) return null; cur.part += w.v; cur.last = "unit"; continue; }
      cur.part = (cur.last === "hundred" ? cur.part : 0) + w.v; cur.last = "unit";
      continue;
    }
    // any other word ends a number phrase (a unit, a filler, an object name)
    if (!close()) return null;
  }
  if (!close()) return null;
  return phrases.every(Number.isFinite) ? phrases : null;
}

/** A child's self-correction ("47/21... nahi nahi, 47/20", "5, sorry, 6"): the number after the LAST correction marker,
 * when exactly one number follows it and at least one came before; else null. */
const MARK = /(?:^|[^\p{L}])(?:nahi|nahin|nhi|no|sorry|matlab|i mean|wait)(?![\p{L}])/giu;
export function selfCorrected(raw) {
  const s = String(raw ?? "");
  let last = -1, m; MARK.lastIndex = 0;
  while ((m = MARK.exec(s))) last = m.index + m[0].length;
  if (last < 0) return null;
  const before = numberPhrases(s.slice(0, last)), after = numberPhrases(s.slice(last));
  return before?.length && after?.length === 1 ? after[0] : null;
}

// ───────────── units next to a number (review v1, 2026-10-05) ─────────────
// Grading a number key by value alone credited "5 dm" for "5 cm", "500 kg" for "500 g" and "8614 sq m" for "8614 m"
// (evals/grading-truth num-wrong:unit-swap: 183 of 183 credited on the V1-02 tree). A unit is read ONLY right after a
// number (a digit or a number word), so a stray "m" or "l" elsewhere in a sentence is never taken as a unit.
const LEN = { mm: "mm", millimetre: "mm", millimeter: "mm", cm: "cm", centimetre: "cm", centimeter: "cm", dm: "dm", decimetre: "dm",
  decimeter: "dm", m: "m", metre: "m", meter: "m", mtr: "m", km: "km", kilometre: "km", kilometer: "km" };
const OTHER = { mg: "mg", milligram: "mg", g: "g", gm: "g", gram: "g", gramme: "g", kg: "kg", kilogram: "kg", kilo: "kg", ml: "ml", millilitre: "ml",
  milliliter: "ml", l: "l", litre: "l", liter: "l", ltr: "l", s: "s", sec: "s", second: "s", min: "min", minute: "min", h: "h", hr: "h", hour: "h",
  day: "day", week: "week", month: "month", year: "year", paise: "paise", rupee: "rs", rs: "rs" };
const sing = (w) => [w, w.replace(/s$/, ""), w.replace(/es$/, "")].find((x) => x.length > 0 && (LEN[x] || OTHER[x])) ?? w;
/** Canonical units that follow a number in `raw` ("sq cm", "cm", "kg", ...), in order. */
export function unitsAfterNumbers(raw) {
  const toks = String(raw ?? "").toLowerCase().replace(/(\d)([a-z²³])/g, "$1 $2").replace(/[²]/g, " ²").replace(/[³]/g, " ³").replace(/[^\p{L}\p{N}²³.\/-]+/gu, " ").split(/\s+/).filter(Boolean);
  const out = [];
  const isNum = (t) => /\d$/.test(t) || spokenNumber(t) != null;
  for (let i = 1; i < toks.length; i++) {
    if (!isNum(toks[i - 1])) continue;
    let j = i, pre = "";
    const w0 = toks[j].replace(/\.$/, "");
    if (w0 === "sq" || w0 === "square") { pre = "sq "; j++; } else if (w0 === "cubic" || w0 === "cu") { pre = "cu "; j++; }
    const w = sing(String(toks[j] ?? "").replace(/\.$/, ""));
    const len = LEN[w], oth = OTHER[w];
    if (len) { const post = toks[j + 1] === "²" ? "sq " : toks[j + 1] === "³" ? "cu " : ""; out.push((pre || post) + len); }
    else if (oth && !pre) out.push(oth);
  }
  return out;
}

// ───────────── the words after the number (review v1, 2026-10-05) ─────────────
// A count key ("3 edges", "12 books") was graded by value alone, so "3 faces" and "3 vertices" were credited for "3 edges"
// and "5 sides" for "5 corners". Rule: every word the child says AFTER the number must be a filler or one of the key's own
// words (singular, unit-canonical); otherwise the model reads it. A bare number ("3") keeps today's credit: the question
// named the thing being counted.
const FILL = new Set(("hai hain he h ho hoga hogi honge hota hoti hote tha thi ji didi di maam mam madam sir bhaiya bhaiyya teacher only hi toh to na " +
  "haan han ha yes yeah bas ok okay is are its it answer and a an the total exactly um umm hmm uh please deg degree degrees each of " +
  // correction and denial words are not a counted thing: a denial is caught by classifyFast's `denies`, a correction by selfCorrected
  "nahi nahin nhi no not sorry matlab i mean wait").split(" "));
const TEMP = { c: "°c", celsius: "°c", centigrade: "°c", f: "°f", fahrenheit: "°f" };
const canonWord = (w) => { const x = sing(w); return LEN[x] ?? OTHER[x] ?? TEMP[x] ?? x.replace(/(?:ies)$/, "y").replace(/(?:es|s)$/, (m) => (x.length > 3 ? "" : m)); };
const wordToks = (raw) => String(raw ?? "").toLowerCase().normalize("NFC").replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
  .replace(/(\d)([a-z°²³])/g, "$1 $2").replace(/°/g, " deg ").replace(/[²]/g, " sq ").replace(/[³]/g, " cu ").replace(/[^\p{L}\p{N}.\/-]+/gu, " ")
  .split(/\s+/).map((t) => t.replace(/^[.]+|[.]+$/g, "")).filter(Boolean);
const isNumTok = (t) => /\d/.test(t) || wordNum(t) != null || t in SCALE || t in SPECIAL || t in PREFIX || t in DEN || SIGN.has(t) || t === "point" || OVER.has(t);
/** Content words after the first number in `raw`, canonical. */
function wordsAfterNumber(raw) {
  const toks = wordToks(raw);
  const i = toks.findIndex(isNumTok);
  if (i < 0) return [];
  return toks.slice(i + 1).filter((t) => !isNumTok(t) && !FILL.has(t)).map(canonWord);
}
/** Does the child's reply name only things the key names? true when nothing is said after the number. */
export function tailAgrees(key, text) {
  const kt = new Set(wordsAfterNumber(key)), ct = wordsAfterNumber(text);
  return ct.every((w) => kt.has(w));
}

// ───────────── a key that STARTS with a number but is not a plain number (review v1, 2026-10-05) ─────────────
// "8 a.m.", "9 crore downloads", "21 June": plainNumberKey refuses these (the words decide what the number is), so the
// model reads them, and the model credited "-8 a.m.", "-9 crore downloads" and a bare "21" for "21 June"
// (evals/grading-truth model leg). Two code checks the model cannot overrule:
const leadOf = (key) => String(key ?? "").trim().replace(/^(?:₹|rs\.?)\s*/i, "").match(/^(-?\d[\d,]*(?:\.\d+)?)(?![\d\/])/)?.[1] ?? null;
/** The reply's sign contradicts the key's leading number ("-8 a.m." for "8 a.m."): never the key. */
export function signConflict(key, text) {
  const lead = leadOf(key);
  if (lead == null) return false;
  const ph = numberPhrases(text);
  if (!ph || !ph.length) return false;
  const keyNeg = lead.startsWith("-");
  return keyNeg ? ph.every((v) => v > 0) : ph.some((v) => v < 0);
}
/** The reply is only the key's leading number, and the key's words decide what it is ("21" for "21 June"): the decisive
 * word, else null. A question that itself names the word ("How many hundreds...?") makes the bare number complete. */
export function bareOfDecisive(key, text, prompt = "") {
  const lead = leadOf(key);
  if (lead == null || plainNumberKey(key) != null) return null;
  const tail = String(key).trim().replace(/^(?:₹|rs\.?)\s*/i, "").slice(String(key).trim().replace(/^(?:₹|rs\.?)\s*/i, "").indexOf(lead) + lead.length);
  const m = tail.match(DISCRIM);
  if (!m) return null;
  const word = m[0].replace(/^[^\p{L}°]+/u, "").toLowerCase();
  if (wordsAfterNumber(text).length) return null;
  const v = spokenNumber(text);
  if (v == null || Math.abs(v - Number(lead.replace(/,/g, ""))) > 1e-9) return null;
  if (word.length > 2 && String(prompt).toLowerCase().includes(word.replace(/s$/, ""))) return null;
  return word;
}
