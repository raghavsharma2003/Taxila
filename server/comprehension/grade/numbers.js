// The shared Hindi / English number normaliser for R-KEY (COMPREHENSION-ENGINE.md §4.2): numerals (Latin and
// Devanagari, Indian commas), English number words, Roman-Hindi and Devanagari number words including the
// irregular 1-100, sau / hazaar / lakh / crore, fractions ("3/4", "three fourths", "teen bata char", aadha,
// dedh, dhai, sawa, saadhe, paune) and ₹ / units stripped. Pure. Returns numbers; the caller compares.

const EN_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
  "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const HI_1_100 = `ek do teen char paanch chhe saat aath nau das gyarah barah terah chaudah pandrah solah satrah atharah unnis bees
 ikkis baais teis chaubis pachchis chhabbis sattais atthais untis tees iktis battis taintis chautis paintis chhattis saintis adtis untalis chalis
 iktalis bayalis taintalis chavalis paintalis chhiyalis saintalis adtalis unchas pachas ikyavan bavan tirpan chauvan pachpan chhappan sattavan
 atthavan unsath saath iksath basath tirsath chausath painsath chhiyasath sadsath adsath unhattar sattar ikhattar bahattar tihattar chauhattar
 pachhattar chhihattar sathattar athhattar unasi assi ikyasi bayasi tirasi chaurasi pachasi chhiyasi sattasi athasi nawasi nabbe ikyanve banve
 tiranve chauranve pachanve chhiyanve sattanve atthanve ninyanve`.trim().split(/\s+/);
/** Common alternate Roman spellings → canonical. */
const HI_ALT = { chaar: "char", panch: "paanch", paach: "paanch", chhah: "chhe", che: "chhe", chah: "chhe", gyaarah: "gyarah", baarah: "barah",
  athaarah: "atharah", unees: "unnis", bis: "bees", pachees: "pachchis", pachchees: "pachchis", pachis: "pachchis", tis: "tees", chaalis: "chalis", pachaas: "pachas",
  pachchas: "pachas", sath: "saath", assee: "assi", nabbe: "nabbe", navve: "nabbe", nabe: "nabbe", das: "das", dus: "das", nau: "nau", no: null };
const HI_MAP = Object.fromEntries(HI_1_100.map((w, i) => [w, i + 1]));
const DEV_WORDS = { "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पांच": 5, "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10, "बीस": 20,
  "पच्चीस": 25, "तीस": 30, "चालीस": 40, "पचास": 50, "साठ": 60, "सत्तर": 70, "अस्सी": 80, "नब्बे": 90, "सौ": 100, "हज़ार": 1000, "हजार": 1000,
  "लाख": 1e5, "करोड़": 1e7, "आधा": 0.5, "डेढ़": 1.5, "ढाई": 2.5 };
const SCALES = { hundred: 100, sau: 100, thousand: 1000, hazaar: 1000, hazar: 1000, hajar: 1000, lakh: 1e5, lac: 1e5, lakhs: 1e5, crore: 1e7, karod: 1e7, million: 1e6 };
const SPECIAL = { half: 0.5, aadha: 0.5, adha: 0.5, aadhi: 0.5, dedh: 1.5, derh: 1.5, dhai: 2.5, dhaai: 2.5, quarter: 0.25, pav: 0.25, paav: 0.25 };
const ORD = { half: 2, halves: 2, third: 3, thirds: 3, fourth: 4, fourths: 4, quarter: 4, quarters: 4, fifth: 5, fifths: 5, sixth: 6, sixths: 6,
  seventh: 7, sevenths: 7, eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10, chauthai: 4, tihai: 3 };
const PREFIX_FRAC = { sawa: 0.25, saadhe: 0.5, sadhe: 0.5, saade: 0.5, paune: -0.25 };
/** Words that are numbers in Hindi but ordinary English words: only numbers when the turn is not English-only. */
const AMBIGUOUS_EN = new Set(["do", "das", "no", "saath", "tees", "bees"]);

const devDigits = (s) => s.replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)));

function wordValue(w, lang) {
  if (w in SPECIAL) return { v: SPECIAL[w], kind: "special" };
  if (EN_ONES.includes(w)) return { v: EN_ONES.indexOf(w), kind: "unit" };
  if (w in EN_TENS) return { v: EN_TENS[w], kind: "tens" };
  const c = w in HI_ALT ? HI_ALT[w] : w;
  if (c && c in HI_MAP && !(lang === "en" && AMBIGUOUS_EN.has(w))) return { v: HI_MAP[c], kind: "unit" };
  if (w in DEV_WORDS) { const v = DEV_WORDS[w]; return v >= 100 && Number.isInteger(v) && [100, 1000, 1e5, 1e7].includes(v) ? { v, kind: "scale" } : { v, kind: v % 1 ? "special" : "unit" }; }
  if (w in SCALES) return { v: SCALES[w], kind: "scale" };
  return null;
}

/**
 * Every number phrase in a child's turn, in order of appearance.
 * @param {string} text @param {{ lang?: string }} [o] lang 'en' disables Hindi words that are also English words
 * @returns {number[]}
 */
export function numbersIn(text, { lang = "mixed" } = {}) {
  let s = devDigits(String(text ?? "").toLowerCase()).replace(/₹|rs\.?|rupees?|rupaye|rupay|paise/g, " ");
  s = s.replace(/(\d),(?=\d)/g, "$1");                                   // Indian / Western commas
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:\/|by|bata|upon)\s*(\d+(?:\.\d+)?)/g, (_, a, b) => ` __F${Number(a) / Number(b)}__ `);
  s = s.replace(/(\p{L})-(?=\p{L})/gu, "$1 ").replace(/\.{2,}|\.(?!\d)/g, " ");
  const toks = s.split(/[^\p{L}\p{M}\p{N}_.\-]+/u).filter(Boolean);
  const numberish = (w) => w !== undefined && (/^\d/.test(w) || (wordValue(w, lang) && !AMBIGUOUS_EN.has(w)));
  const out = [];
  let cur = null, total = 0, pendingPrefix = 0, lastUnit = null, numer = null;
  const push = (v) => { if (numer !== null) { out.push(numer / v); numer = null; } else out.push(v); };
  const flush = () => { if (cur !== null || total) push(total + (cur ?? 0) + pendingPrefix); cur = null; total = 0; pendingPrefix = 0; lastUnit = null; };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i].replace(/^-+|-+$/g, "");
    const f = /^__F(.+)__$/.exec(t);
    if (f) { flush(); out.push(Number(f[1])); continue; }
    if (/^-?\d+(\.\d+)?$/.test(t)) {
      const n = Number(t);
      const nxt = toks[i + 1];
      if (nxt && SCALES[nxt]) { cur = (cur ?? 0) + n; continue; }
      if (cur !== null || total) flush();
      cur = n; flush(); continue;
    }
    if ((t === "bata" || t === "by" || t === "upon" || t === "over") && (cur !== null || total) && numberish(toks[i + 1])) {
      numer = total + (cur ?? 0); cur = null; total = 0; lastUnit = null; continue;
    }
    if (AMBIGUOUS_EN.has(t) && toks.length > 2 && !numberish(toks[i - 1]) && !numberish(toks[i + 1]) && !SCALES[toks[i + 1]]) {
      if (cur !== null || total) flush();
      continue;
    }
    if (t in PREFIX_FRAC) { flush(); pendingPrefix = PREFIX_FRAC[t]; continue; }
    if (t === "and" || t === "aur") { if (cur !== null || total) continue; }
    const wv = wordValue(t, lang);
    if (!wv) { if (cur !== null || total || pendingPrefix) flush(); lastUnit = null; continue; }
    // "three fourths", "teen chauthai", "one half": numerator then an ordinal denominator
    const nextOrd = toks[i + 1] && ORD[toks[i + 1]];
    if ((wv.kind === "unit" || wv.kind === "tens") && nextOrd && !(toks[i + 1] === "half" && wv.v !== 1) ) {
      flush(); out.push(wv.v / nextOrd); i++; continue;
    }
    if (wv.kind === "special") { flush(); out.push(wv.v); continue; }
    if (wv.kind === "scale") {
      const m = cur ?? (pendingPrefix ? 1 : null);
      if (m === null) total = (total || 1) * wv.v;                      // "hundred thousand", or a bare "sau"
      else total += (m + pendingPrefix) * wv.v;                           // "saadhe teen sau" = 350, "sawa sau" = 125
      cur = null; pendingPrefix = 0; lastUnit = null; continue;
    }
    if (wv.kind === "tens") { cur = (cur ?? 0) + wv.v; lastUnit = "tens"; continue; }
    if (lastUnit === "tens" && wv.v < 10) { cur += wv.v; lastUnit = "unit"; continue; }
    if (cur !== null) { flush(); }
    cur = wv.v; lastUnit = "unit";
  }
  flush();
  return out;
}

/**
 * R-KEY on numbers: the child's answer is the LAST number phrase (children self-correct: "3... nahi, 4").
 * @returns {'correct'|'wrong'|'NA'}
 */
export function matchNumber(text, key, { tol = 1e-9, relTol = 0, lang } = {}) {
  const ns = numbersIn(text, { lang });
  if (!ns.length) return "NA";
  const v = ns.at(-1), k = Number(key);
  const ok = Math.abs(v - k) <= Math.max(tol, relTol * Math.abs(k));
  return ok ? "correct" : "wrong";
}
