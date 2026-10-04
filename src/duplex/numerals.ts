/**
 * Cross-script number reading for the duplex engine's expected-answer grammar (ARCHITECTURE.md v2 §2.5.1).
 * Pure, synchronous, browser-safe, erasable TypeScript (Node type stripping runs it in the evals).
 *
 * Scope: the values a class 4-7 child says in Hindi (Devanagari, the way our STT spells Hindi), English and romanised
 * Hindi: integers 0-999 (Hindi 0-100 are irregular words, so the full table is here), fractions ("तीन बटा चार", "3/4",
 * "three by four", "आधा", "तीन चौथाई"), decimals ("दो दशमलव पाँच", "two point five", "2.5").
 * It reads SHAPE only. It never compares a value with a key (verdict-blind timing, `duplex-verdict-blind-timing`).
 *
 * Normalisation follows the signals convention (`rj-sig-strip-combining-marks`): NFC, nukta dropped, chandrabindu folded
 * to anusvara, lowercase. Combining marks are kept.
 */

const HI_0_100 = [
  "शून्य", "एक", "दो", "तीन", "चार", "पांच", "छह", "सात", "आठ", "नौ", "दस",
  "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस", "बीस",
  "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस", "तीस",
  "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अडतीस", "उनतालीस", "चालीस",
  "इकतालीस", "बयालीस", "तैंतालीस", "चवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अडतालीस", "उनचास", "पचास",
  "इक्यावन", "बावन", "तिरपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ", "साठ",
  "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सडसठ", "अडसठ", "उनहत्तर", "सत्तर",
  "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उन्यासी", "अस्सी",
  "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी", "नब्बे",
  "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे", "सौ",
];
/** Spelling variants our STT and children produce (normalised form). */
const HI_VARIANTS: Record<string, number> = {
  "छः": 6, "छे": 6, "छ": 6, "पाच": 5, "नो": 9, "ग्यारा": 11, "बारा": 12, "तेरा": 13, "पंद्रा": 15, "सोला": 16, "सतरह": 17,
  "अट्ठारह": 18, "उन्निस": 19, "बाइस": 22, "तेइस": 23, "सत्ताइस": 27, "अट्ठाइस": 28, "पैतीस": 35, "छतीस": 36, "चौतीस": 34,
  "चौवालीस": 44, "बावान": 52, "चौसठ": 64, "पैसठ": 65, "निन्नानवे": 99, "निन्यानबे": 99, "नब्बें": 90,
};
const EN_0_19 = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const ROMAN_HI: Record<string, number> = {
  shunya: 0, ek: 1, teen: 3, tin: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, chhah: 6, cheh: 6, saat: 7, sat: 7,
  aath: 8, ath: 8, nau: 9, das: 10, gyarah: 11, barah: 12, baara: 12, terah: 13, chaudah: 14, pandrah: 15, solah: 16,
  satrah: 17, atharah: 18, unnees: 19, bees: 20, pachees: 25, pachchees: 25, tees: 30, chalis: 40, chaalis: 40,
  pachas: 50, pachaas: 50, chhappan: 56, saath: 60, sattar: 70, assi: 80, nabbe: 90, sau: 100,
};

const UNITS_WORD = new Map<string, number>();
HI_0_100.forEach((w, i) => UNITS_WORD.set(w, i));
for (const [w, v] of Object.entries(HI_VARIANTS)) UNITS_WORD.set(w, v);
EN_0_19.forEach((w, i) => UNITS_WORD.set(w, i));
for (const [w, v] of Object.entries(EN_TENS)) UNITS_WORD.set(w, v);
for (const [w, v] of Object.entries(ROMAN_HI)) UNITS_WORD.set(w, v);
UNITS_WORD.set("hundred", 100);

/** Words that are ALSO common non-number words: a value only when they stand alone or in a number construction. */
const WEAK = new Set(["एक", "ek", "one", "do", "sat", "tin", "ath", "नो", "छ", "char"]);
const HUNDRED = new Set(["सौ", "hundred", "sau"]);
const THOUSAND = new Set(["हजार", "thousand", "hazaar", "hazar"]);
/** Fraction joiners: "तीन बटा चार", "three by four", "three upon four", "three over four". */
export const FRACTION_JOIN = new Set(["बटा", "बटे", "by", "upon", "over", "bata", "bate", "batta"]);
export const DECIMAL_JOIN = new Set(["दशमलव", "point", "dashamlav", "dashmalav", "पॉइंट", "पोइंट"]);
const QUARTER = new Set(["चौथाई", "quarter", "quarters", "chauthai"]);
const HALF = new Set(["आधा", "आधी", "half", "aadha", "adha"]);
/** A Hindi verb stem in "-ने" before "दो" makes "दो" the imperative "let/give", not 2 ("सोचने दो", "करने दो"). */
const NE_STEM = /^[ऀ-ॿ]+ने$/u;

export type ValueKind = "integer" | "fraction" | "decimal";
export interface ValueSpan {
  /** Normalised value: "62", "3/4", "2.5". */
  v: string;
  kind: ValueKind;
  /** Token index range [start, end] inclusive in the normalised token list. */
  start: number;
  end: number;
  /** The value could still grow with the next word ("sixty" → "sixty two", "दो सौ" → "दो सौ बीस"). */
  open: boolean;
}

/** NFC, nukta dropped, chandrabindu → anusvara, lowercase, punctuation → space; glued "बटाचार" split; "sixty-two" split. */
export function normText(t: string): string {
  return String(t ?? "")
    .normalize("NFC")
    .replace(/़/g, "")
    .replace(/ँ/g, "ं")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/(\d)\s*\/\s*(\d)/g, "$1/$2")
    .replace(/(\d)\.(\d)/g, "$1․$2") // protect a decimal point from the punctuation pass
    .replace(/[?？।॥.,!;:…"“”‘’()–—-]+/gu, " ")
    .replace(/․/g, ".")
    .replace(/(बटा|बटे)(?=[ऀ-ॿ])/gu, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(t: string): string[] {
  const s = normText(t);
  return s ? s.split(" ") : [];
}

const isDigitInt = (w: string): boolean => /^\d{1,7}$/.test(w);
const isDigitFrac = (w: string): boolean => /^\d{1,4}\/\d{1,4}$/.test(w);
const isDigitDec = (w: string): boolean => /^\d{1,6}\.\d{1,4}$/.test(w);

/** Read an integer starting at token i (Hindi/English/romanised words or digits, with सौ/hundred/हजार compounds). */
function readInt(toks: string[], i: number): { v: number; end: number; open: boolean } | null {
  const w = toks[i];
  if (w === undefined) return null;
  if (isDigitInt(w)) return { v: Number(w), end: i, open: false };
  if (!UNITS_WORD.has(w)) return null;
  let v = UNITS_WORD.get(w)!;
  let end = i;
  let open = false;
  // English compound: "sixty two"
  if (EN_TENS[w] !== undefined) {
    const nx = toks[i + 1];
    const u = nx !== undefined ? EN_0_19.indexOf(nx) : -1;
    if (u >= 1 && u <= 9) { v += u; end = i + 1; } else open = true; // "sixty" alone may still become "sixty-two"
  }
  // hundreds / thousands: "दो सौ बीस", "one hundred twenty", a bare "सौ"
  const nx = toks[end + 1];
  if (HUNDRED.has(w)) { v = 100; open = true; }
  else if (nx !== undefined && HUNDRED.has(nx)) { v = v * 100; end += 1; open = true; }
  else if (nx !== undefined && THOUSAND.has(nx)) { v = v * 1000; end += 1; open = true; }
  if (open && (HUNDRED.has(toks[end]) || THOUSAND.has(toks[end]))) {
    const rest = readInt(toks, end + 1);
    if (rest && !HUNDRED.has(toks[end + 1]) && rest.v < 100) { v += rest.v; end = rest.end; open = rest.open; }
  }
  return { v, end, open };
}

/**
 * Values in reading order. `open` marks a value that may still grow with the next word (prefix-ambiguous).
 * A weak word ("एक", "one", romanised "do") counts only alone, or inside a number construction.
 */
export function valuesOf(toksIn: string[] | string): ValueSpan[] {
  const toks = typeof toksIn === "string" ? tokens(toksIn) : toksIn;
  const out: ValueSpan[] = [];
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i];
    if (isDigitFrac(w)) { out.push({ v: w, kind: "fraction", start: i, end: i, open: false }); continue; }
    if (isDigitDec(w)) { out.push({ v: w, kind: "decimal", start: i, end: i, open: false }); continue; }
    if (HALF.has(w)) { out.push({ v: "1/2", kind: "fraction", start: i, end: i, open: false }); continue; }
    if (w === "दो" && i > 0 && NE_STEM.test(toks[i - 1])) continue;
    const a = readInt(toks, i);
    if (!a) continue;
    const j = a.end;
    const nx = toks[j + 1];
    // fraction: a बटा b
    if (nx !== undefined && FRACTION_JOIN.has(nx)) {
      const b = readInt(toks, j + 2);
      if (b) { out.push({ v: `${a.v}/${b.v}`, kind: "fraction", start: i, end: b.end, open: b.open }); i = b.end; continue; }
      // "तीन बटा" with no denominator yet: an integer that is still growing
      out.push({ v: String(a.v), kind: "integer", start: i, end: j + 1, open: true });
      i = j + 1;
      continue;
    }
    // "तीन चौथाई" = 3/4
    if (nx !== undefined && QUARTER.has(nx)) { out.push({ v: `${a.v}/4`, kind: "fraction", start: i, end: j + 1, open: false }); i = j + 1; continue; }
    // decimal: a दशमलव b
    if (nx !== undefined && DECIMAL_JOIN.has(nx)) {
      const b = readInt(toks, j + 2);
      if (b) { out.push({ v: `${a.v}.${b.v}`, kind: "decimal", start: i, end: b.end, open: false }); i = b.end; continue; }
      out.push({ v: String(a.v), kind: "integer", start: i, end: j + 1, open: true });
      i = j + 1;
      continue;
    }
    if (WEAK.has(w) && j === i) {
      const alone = toks.length === 1;
      const prev = toks[i - 1];
      const afterAnswer = prev === "है" || prev === "hai" || prev === "is" || prev === "answer" || prev === "उत्तर";
      if (!alone && !afterAnswer) continue;
    }
    out.push({ v: String(a.v), kind: "integer", start: i, end: j, open: a.open });
    i = j;
  }
  return out;
}
