// The SpokenSet rule table as DATA (docs/research/voice/spoken-notation.md §2.3, NCERT conventions §1).
// server/voice/spoken.js is the code that walks it; nothing here is prompt text and none of it is ever put in a
// prompt (recitation law). A regional language is added as one more entry in WORDS plus the CELLS that use it;
// the renderer does not change.
//
// Templates: {x} is the rendered operand, {n}/{d} numerator/denominator, {b}/{e} base/exponent, {w} whole part,
// {f} fraction part, {a}/{c} times-table operands, {r} the right operand, {h}/{m} hour/minute, {u} a unit.
// Bump RENDERER_VERSION on any change that alters an output: the TTS cache is keyed by the rendered text, and
// the version is the provenance field of a SpokenSet (`rendererVersion`).
export const RENDERER_VERSION = "sp2-2026-10-05";

// ── number words ────────────────────────────────────────────────────────────────────────────────────────────

const EN_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const EN_BELOW_100 = Array.from({ length: 100 }, (_, n) =>
  n < 20 ? EN_ONES[n] : EN_TENS[Math.floor(n / 10)] + (n % 10 ? "-" + EN_ONES[n % 10] : ""));

// Hindi 0-99 are irregular and are listed whole (standard forms; 67 = सड़सठ as in the NCERT-style probe items).
const HI_BELOW_100 = [
  "शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ",
  "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस",
  "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस",
  "तीस", "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस",
  "चालीस", "इकतालीस", "बयालीस", "तैंतालीस", "चवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास",
  "पचास", "इक्यावन", "बावन", "तिरपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ",
  "साठ", "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सड़सठ", "अड़सठ", "उनहत्तर",
  "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उन्यासी",
  "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी",
  "नब्बे", "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पंचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे",
];

/**
 * One entry per word language. `frames` override templates for a sentence frame (hl = a Hindi sentence frame
 * around English maths words, as an English-medium Hinglish child hears them).
 */
export const WORDS = {
  en: {
    below100: EN_BELOW_100,
    scale: { hundred: "hundred", thousand: "thousand", lakh: "lakh", crore: "crore", million: "million", billion: "billion" },
    point: "point",
    minus: "minus",
    ops: { plus: "plus", minus: "minus", times: "times", divide: "divided by", equals: "equals",
      lt: "is less than", gt: "is greater than", le: "is less than or equal to", ge: "is greater than or equal to",
      approx: "is approximately", ne: "is not equal to" },
    ratio: "{a} is to {c}",
    range: "{a} to {c}",
    percent: "{x} percent",
    fraction: "{n} upon {d}",                // NCERT English medium: "three upon four"
    mixed: "{w} and {f}",                    // "two and one upon three"
    // band 6-9: unit words for halves and quarters (spoken-notation §2.3)
    unitFractions: { "1/2": "one half", "1/4": "one quarter", "2/4": "two quarters", "3/4": "three quarters" },
    mixedHalf: "{w} and a half",
    vulgar: {},
    power: { 2: "{b} squared", 3: "{b} cubed", n: "{b} raised to the power {e}" },
    root: { 2: "the square root of {x}", 3: "the cube root of {x}" },
    pi: "pi",
    angle: "angle",
    triangle: "triangle",
    letters: null,                           // Latin letters are said as themselves
    formulaNumber: null,                     // formula counts use the cardinal
    rupee: { one: "rupee", many: "rupees" },
    paise: { one: "paisa", many: "paise" },
    currency: "{r} {ru}",
    currencyPaise: "{r} {ru} {p} {pa}",
    perUnit: "per",
    degreeAngle: { one: "degree", many: "degrees" },
    celsius: { one: "degree Celsius", many: "degrees Celsius" },
    fahrenheit: { one: "degree Fahrenheit", many: "degrees Fahrenheit" },
    squareUnit: "square {u}",
    cubicUnit: "cubic {u}",
    perSquare: "{u} squared",                // m/s² → metres per second squared
    unitPlural: true,
    // times-table chant (band 6-9): "seven eights are fifty-six"
    chant: "{a} {bForm} are {c}",
    chantForm: { 1: "ones", 2: "twos", 3: "threes", 4: "fours", 5: "fives", 6: "sixes", 7: "sevens", 8: "eights", 9: "nines", 10: "tens" },
    time: { oclock: "{h} o'clock", oh: "{h} oh {m}", plain: "{h} {m}" },
    decade: "{x}s",                          // the 1990s → nineteen nineties (y → ies below)
    year: { hundred: "{hi} hundred", oh: "{hi} oh {lo}", plain: "{hi} {lo}" },
    ordinal: { irregular: { one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth" } },
    frames: {
      hl: { unitPlural: false, ops: { times: "into", approx: "approximately" },
        root: { 2: "{x} ka square root", 3: "{x} ka cube root" } },
    },
  },
  hi: {
    below100: HI_BELOW_100,
    scale: { hundred: "सौ", thousand: "हज़ार", lakh: "लाख", crore: "करोड़", million: "मिलियन", billion: "बिलियन" },
    point: "दशमलव",
    minus: "ऋण",                              // NCERT ऋणात्मक; watch item: gpt-4o-mini-tts voiced ऋण unclearly 3/3 (SN §3.3)
    ops: { plus: "धन", minus: "ऋण", times: "गुणा", divide: "भाग", equals: "बराबर",
      lt: ", {r} से छोटा", gt: ", {r} से बड़ा", le: ", {r} से छोटा या बराबर", ge: ", {r} से बड़ा या बराबर",
      approx: "लगभग", ne: ", {r} के बराबर नहीं" },
    opsInfix: { lt: "छोटा है", gt: "बड़ा है", le: "छोटा या बराबर है", ge: "बड़ा या बराबर है", ne: "बराबर नहीं है" },
    ratio: "{a} अनुपात {c}",
    range: "{a} से {c}",
    percent: "{x} प्रतिशत",
    fraction: "{n} बटा {d}",                 // NCERT Hindi medium: "तीन बटा चार"
    mixed: "{w} और {f}",                     // NCERT: "दो और दो-तिहाई"
    unitFractions: { "1/2": "आधा", "1/4": "एक-चौथाई", "2/4": "दो-चौथाई", "3/4": "तीन-चौथाई" },
    mixedHalf: "{w} और आधा",
    power: { 2: "{b} का वर्ग", 3: "{b} का घन", n: "{b} की घात {e}" },
    root: { 2: "{x} का वर्गमूल", 3: "{x} का घनमूल" },
    pi: "पाई",
    angle: "कोण",
    triangle: "त्रिभुज",
    // Latin letters inside a formula or an angle name, voiced (एच टू ओ; कोण ए बी सी). Variables (x, a) stay Latin.
    letters: { A: "ए", B: "बी", C: "सी", D: "डी", E: "ई", F: "एफ़", G: "जी", H: "एच", I: "आई", J: "जे", K: "के", L: "एल",
      M: "एम", N: "एन", O: "ओ", P: "पी", Q: "क्यू", R: "आर", S: "एस", T: "टी", U: "यू", V: "वी", W: "डब्ल्यू", X: "एक्स",
      Y: "वाई", Z: "ज़ेड" },
    // Formula counts are said in English in Devanagari (एच टू ओ, SN §2.3); larger counts digit by digit.
    formulaNumber: ["ज़ीरो", "वन", "टू", "थ्री", "फ़ोर", "फ़ाइव", "सिक्स", "सेवन", "एट", "नाइन", "टेन", "इलेवन", "ट्वेल्व"],
    rupee: { one: "रुपया", many: "रुपये" },
    paise: { one: "पैसा", many: "पैसे" },
    currency: "{r} {ru}",
    currencyPaise: "{r} {ru} {p} {pa}",
    perUnit: "प्रति",
    degreeAngle: { one: "अंश", many: "अंश" },
    celsius: { one: "डिग्री सेल्सियस", many: "डिग्री सेल्सियस" },
    fahrenheit: { one: "डिग्री फ़ारेनहाइट", many: "डिग्री फ़ारेनहाइट" },
    squareUnit: "वर्ग {u}",
    cubicUnit: "घन {u}",
    perSquare: "वर्ग {u}",                   // m/s² → मीटर प्रति वर्ग सेकंड
    unitPlural: false,
    // पहाड़ा chant (band 6-9): "सात अट्ठे छप्पन"
    chant: "{a} {bForm} {c}",
    chantForm: { 1: "एकम", 2: "दूनी", 3: "तिया", 4: "चौके", 5: "पंजे", 6: "छक्के", 7: "सत्ते", 8: "अट्ठे", 9: "नामे", 10: "दहाई" },
    // Clock times: पौने चार, सवा तीन, साढ़े तीन (डेढ़ and ढाई for 1:30 and 2:30).
    time: { oclock: "{h} बजे", quarterPast: "सवा {h} बजे", half: "साढ़े {h} बजे", quarterTo: "पौने {next} बजे",
      halfSpecial: { 1: "डेढ़ बजे", 2: "ढाई बजे" }, plain: "{h} बजकर {m} मिनट",
      clockWord: "बजे", clockWords: ["बजे", "baje", "bje", "बज"] },
    decade: "{x} का दशक",
    year: { hundred: "{hi} सौ", oh: "{hi} सौ {lo}", plain: "{hi} सौ {lo}" },
    ordinal: { irregular: { 1: "पहला", 2: "दूसरा", 3: "तीसरा", 4: "चौथा", 6: "छठा" }, regular: "{x}वाँ" },
    // hl = a Hinglish child at a Hindi-medium school: Hindi number words, but the everyday operator words a Roman
    // Hinglish sentence uses ("बारह plus सात equals उन्नीस"), not the formal धन / बराबर, which read oddly inside a Roman
    // sentence for classes 4-7 (fixer 2026-10-05, w2g-hinglish-hindi-medium-operators; on the owner's HV-9 blind page).
    frames: {
      hl: { minus: "minus", ops: { plus: "plus", minus: "minus", times: "into", divide: "divided by", equals: "equals" } },
    },
  },
};

/**
 * Units after a number. key = the written token (case-sensitive), value = per word language [singular, plural].
 * Devanagari abbreviations (सेमी, किग्रा…) are what Hindi-medium books print; TTS reads them as letters.
 */
export const UNITS = {
  mm: { en: ["millimetre", "millimetres"], hi: "मिलीमीटर" },
  cm: { en: ["centimetre", "centimetres"], hi: "सेंटीमीटर" },
  m: { en: ["metre", "metres"], hi: "मीटर" },
  km: { en: ["kilometre", "kilometres"], hi: "किलोमीटर" },
  mg: { en: ["milligram", "milligrams"], hi: "मिलीग्राम" },
  g: { en: ["gram", "grams"], hi: "ग्राम" },
  kg: { en: ["kilogram", "kilograms"], hi: "किलोग्राम" },
  ml: { en: ["millilitre", "millilitres"], hi: "मिलीलीटर" },
  mL: { en: ["millilitre", "millilitres"], hi: "मिलीलीटर" },
  l: { en: ["litre", "litres"], hi: "लीटर" },
  L: { en: ["litre", "litres"], hi: "लीटर" },
  s: { en: ["second", "seconds"], hi: "सेकंड" },
  sec: { en: ["second", "seconds"], hi: "सेकंड" },
  min: { en: ["minute", "minutes"], hi: "मिनट" },
  h: { en: ["hour", "hours"], hi: "घंटा" },
  hr: { en: ["hour", "hours"], hi: "घंटा" },
  hrs: { en: ["hour", "hours"], hi: "घंटे" },
  kmph: { en: ["kilometre per hour", "kilometres per hour"], hi: "किलोमीटर प्रति घंटा" },
  "सेमी": { en: ["centimetre", "centimetres"], hi: "सेंटीमीटर" },
  "मिमी": { en: ["millimetre", "millimetres"], hi: "मिलीमीटर" },
  "मी": { en: ["metre", "metres"], hi: "मीटर" },
  "किमी": { en: ["kilometre", "kilometres"], hi: "किलोमीटर" },
  "किग्रा": { en: ["kilogram", "kilograms"], hi: "किलोग्राम" },
  "ग्रा": { en: ["gram", "grams"], hi: "ग्राम" },
  "मिग्रा": { en: ["milligram", "milligrams"], hi: "मिलीग्राम" },
  "ली": { en: ["litre", "litres"], hi: "लीटर" },
  "मिली": { en: ["millilitre", "millilitres"], hi: "मिलीलीटर" },
};
/** Units that need a space before them (attached, they are more often something else: 1990s, 4h-ago). */
export const UNITS_NEED_SPACE = new Set(["s", "h", "l"]);

/** Words after a ₹ amount that scale it: ₹2 lakh = two lakh rupees. */
export const AMOUNT_SCALES = {
  lakh: "lakh", lac: "lakh", lakhs: "lakh", crore: "crore", crores: "crore", thousand: "thousand", hazaar: "thousand", hazar: "thousand",
  "हज़ार": "thousand", "हजार": "thousand", "लाख": "lakh", "करोड़": "crore",
};
/** Written currency prefixes besides ₹ (the next token must be the amount). */
export const RUPEE_PREFIXES = new Set(["Rs", "RS", "rs", "INR", "रु", "रू"]);

/** Periodic-table symbols: a formula (H2O, CO₂, C6H12O6) must decompose into these, so In/He/As/AI/IIT stay words. */
export const ELEMENTS = new Set(("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se " +
  "Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W " +
  "Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl " +
  "Mc Lv Ts Og").split(" "));

/** Unicode vulgar fractions → [numerator, denominator]. */
export const VULGAR = { "½": [1, 2], "⅓": [1, 3], "⅔": [2, 3], "¼": [1, 4], "¾": [3, 4], "⅕": [1, 5], "⅖": [2, 5], "⅗": [3, 5],
  "⅘": [4, 5], "⅙": [1, 6], "⅚": [5, 6], "⅛": [1, 8], "⅜": [3, 8], "⅝": [5, 8], "⅞": [7, 8] };
export const SUPERSCRIPT = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
export const SUBSCRIPT = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };

// ── context cues (word lists, not sentences) ────────────────────────────────────────────────────────────────

/** A 3-6 digit number right after one of these is a number to dial: digit by digit (Call 112, dial 1800…). */
export const DIAL_CUES = ["call", "dial", "phone", "ring", "helpline", "कॉल", "फ़ोन", "फोन", "डायल"];
/** Optional word between a dial cue and the number. */
export const DIAL_LINKS = ["on", "at", "pe", "par", "per", "पर", "पे", "karo", "करो", "करें"];
/** A 1100-1999 number right after one of these (or before AD/BC/CE/ई.) is a year: nineteen forty-seven. */
export const YEAR_CUES = ["in", "since", "year", "from", "till", "until", "by", "sal", "saal", "san", "सन्", "सन", "वर्ष", "साल", "ईस्वी"];
export const YEAR_SUFFIXES = ["AD", "BC", "CE", "BCE", "ई."];
/** h:mm right after one of these is a ratio, not a clock time. */
export const RATIO_CUES = ["ratio", "anupat", "अनुपात", "is to"];

/**
 * Cells: language mode × school medium → which word language and which sentence frame.
 * spoken-notation §2.3: hl·english = English maths words in a Hindi frame; hl·hindi and hi·hindi = Hindi words
 * (Devanagari, the script the voice reads best); hi·english (rare) = English words, Hindi frame. A school medium
 * of "other" resolves to english [I]; no medium given → the mode's own default.
 */
export const CELLS = {
  "english.english": { words: "en", frame: "en" },
  "english.hindi": { words: "en", frame: "en" },
  "hinglish.english": { words: "en", frame: "hl" },
  "hinglish.hindi": { words: "hi", frame: "hl" },
  "hindi.hindi": { words: "hi", frame: "hi" },
  "hindi.english": { words: "en", frame: "hl" },
};
export const DEFAULT_MEDIUM = { english: "english", hinglish: "english", hindi: "hindi" };

// ── terms the voice misreads (owner 2026-10-04, voice-clips-off-and-numbers-normalised: "numbers and terms are
// normalised ... plus a lexicon before TTS") ─────────────────────────────────────────────────────────────────────
// Whole-token, case-sensitive written forms → per word language. Only abbreviations a TTS voice reads wrongly or as
// punctuation belong here; ordinary words never do (the voice reads them in context). Applied by spoken.js speakable().
export const TERMS = {
  "e.g.": { en: "for example", hi: "जैसे" },
  "eg.": { en: "for example", hi: "जैसे" },
  "i.e.": { en: "that is", hi: "यानी" },
  "etc.": { en: "and so on", hi: "वगैरह" },
  "vs": { en: "versus", hi: "बनाम" },
  "vs.": { en: "versus", hi: "बनाम" },
  "&": { en: "and", hi: "और" },
  "w.r.t.": { en: "with respect to", hi: "के सापेक्ष" },
  "approx.": { en: "approximately", hi: "लगभग" },
};
