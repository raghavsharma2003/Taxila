// Hindi number words, Roman → Devanagari (RS-7 translit). The voice v4 blocker: DragonHD Diya reads Roman "paintees" as
// "पेंटीज" (4/4 renders, TALKING-RULES §5.3) and "tees" as "टीज" under a hi-IN wrap. Every Roman spelling the Director (or a
// child-facing kit) uses for a cardinal 0-100, the scale words, ordinals and fraction words maps to ONE Devanagari form.
// The Devanagari forms are the ones spoken.js already speaks in Hindi-medium cells (spoken-lexicon.js WORDS.hi.below100),
// so the two renderers can never disagree on how a number is spelled.
//
// Ambiguous spellings that are ALSO common English or Hindi non-number words are NOT here; they live in AMBIGUOUS
// (lexicon.js) and are resolved by context: do (two / give / English "do"), bees (20 / English bees), saath (60 / "with"),
// tera (13 / "your"), no, sat, das (English surnames rare but "das" is safe enough: kept here), chhe.
import { WORDS } from "../spoken-lexicon.js";

const HI = WORDS.hi.below100;

/** index → Roman spellings seen in Hinglish writing (lowercase). */
const ROMAN = {
  0: ["shunya", "shoonya", "sunya"],
  1: ["ek"],
  3: ["teen"],
  4: ["char", "chaar", "chaar"],
  5: ["paanch", "panch", "paach", "pach"],
  6: ["chhah", "chah", "chhe", "chhai", "chheh"],
  7: ["saat"],
  8: ["aath", "aat"],
  9: ["nau"],
  10: ["das", "dus"],
  11: ["gyarah", "gyaarah", "gyara", "gyaara", "gyaarah"],
  12: ["barah", "baarah", "bara", "baara"],
  13: ["terah"],
  14: ["chaudah", "chodah", "chaudha"],
  15: ["pandrah", "pandraah", "pandra", "pundrah"],
  16: ["solah", "sola", "solaah"],
  17: ["satrah", "satra", "sattrah", "satraah"],
  18: ["atharah", "athaarah", "athara", "attharah", "athaara"],
  19: ["unnees", "unnis", "unees", "unis", "unnis"],
  21: ["ikkees", "ikkis", "ekkis"],
  22: ["baais", "bais", "baaees", "baees"],
  23: ["teis", "teyis", "teyees", "teees", "teiis"],
  24: ["chaubees", "chaubis", "chobis", "chaubis"],
  25: ["pachchees", "pachees", "pachis", "pacchis", "pachchis", "pacchees"],
  26: ["chhabbees", "chhabbis", "chabbis", "chabbees"],
  27: ["sattaais", "sattais", "sattaees", "sataais", "sattayees"],
  28: ["atthaais", "atthais", "athaais", "athais", "atthayees", "attaais"],
  29: ["untees", "untis", "unatees", "unattis"],
  30: ["tees", "tis"],
  31: ["ikattees", "iktees", "ikatis", "ikattis", "iktis"],
  32: ["battees", "battis", "batis", "battees"],
  33: ["taintees", "tetis", "taintis", "tentees", "tetees", "taitees"],
  34: ["chauntees", "chautis", "chontis", "chauntis", "chautees"],
  35: ["paintees", "paintis", "pentis", "pentees", "paitees", "paitis"],
  36: ["chhattees", "chhattis", "chattis", "chattees"],
  37: ["saintees", "saintis", "sentees", "sentis"],
  38: ["adtees", "artees", "adtis", "artis", "arteees"],
  39: ["untaalees", "untalis", "untaalis", "untalees"],
  40: ["chaalees", "chalis", "chaalis", "chalees"],
  41: ["iktaalees", "iktalis", "iktaalis", "iktalees"],
  42: ["bayaalees", "bayalis", "byalis", "bayaalis", "byaalis"],
  43: ["taintaalees", "taitaalees", "tetalis", "taitalis", "tentalis"],
  44: ["chauvaalees", "chawalis", "chauvalis", "chauwalis", "chavalis"],
  45: ["paintaalees", "paintalis", "pentalis", "paintaalis"],
  46: ["chhiyaalees", "chhiyalis", "chiyalis", "chhiyaalis"],
  47: ["saintaalees", "saintalis", "sentalis", "saintaalis"],
  48: ["adtaalees", "artalis", "adtalis", "artaalis", "adtaalis"],
  49: ["unchaas", "unchas"],
  50: ["pachaas", "pachas", "pachaas", "pachchas", "pachchaas"],
  51: ["ikyaavan", "ikyavan", "ikyaawan", "ikyawan"],
  52: ["baavan", "bavan", "baawan", "bawan"],
  53: ["tirpan", "tirepan", "tirpann"],
  54: ["chauvan", "chauwan", "chouvan"],
  55: ["pachpan"],
  56: ["chhappan", "chappan"],
  57: ["sattaavan", "sattavan", "sattawan"],
  58: ["atthaavan", "atthavan", "athavan", "atthawan"],
  59: ["unsath", "unsaath", "unsaat"],
  61: ["iksath", "iksaath"],
  62: ["baasath", "basath", "baasath", "baasaath"],
  63: ["tirsath", "tiresath", "tirsaath"],
  64: ["chausath", "chaunsath", "chausaath", "chaunsaath"],
  65: ["painsath", "painsaath", "pensath"],
  66: ["chhiyaasath", "chhiyasath", "chiyasath"],
  67: ["sadsath", "sarsath", "sadsaath", "sarsaath"],
  68: ["adsath", "arsath", "adsaath", "arsaath"],
  69: ["unhattar"],
  70: ["sattar"],
  71: ["ikhattar"],
  72: ["bahattar", "bahatar"],
  73: ["tihattar", "tihatar"],
  74: ["chauhattar", "chauhatar"],
  75: ["pachhattar", "pachattar", "pachhatar"],
  76: ["chhihattar", "chihattar"],
  77: ["sathattar", "satattar"],
  78: ["athhattar", "athattar"],
  79: ["unaasi", "unasi", "unyasi"],
  80: ["assi", "assee"],
  81: ["ikyaasi", "ikyasi"],
  82: ["bayaasi", "bayasi"],
  83: ["tiraasi", "tirasi"],
  84: ["chauraasi", "chaurasi"],
  85: ["pachaasi", "pachasi"],
  86: ["chhiyaasi", "chhiyasi", "chiyasi"],
  87: ["sattaasi", "sattasi"],
  88: ["atthaasi", "atthasi"],
  89: ["navaasi", "nawasi", "navasi"],
  90: ["nabbe", "nabbey"],
  91: ["ikyaanave", "ikyanve", "ikyaanve"],
  92: ["baanave", "banve", "baanve"],
  93: ["tiraanave", "tiranve", "tiraanve"],
  94: ["chauraanave", "chauranve", "chauraanve"],
  95: ["pachaanave", "pachanve", "pachaanve"],
  96: ["chhiyaanave", "chhiyanve", "chhiyaanve"],
  97: ["sattaanave", "sattanve", "sattaanve"],
  98: ["atthaanave", "atthanve", "atthaanve"],
  99: ["ninyaanave", "ninyanve", "ninyaanve", "ninnanve"],
};

/** Scale, ordinal, fraction and multiple words (lowercase Roman → Devanagari). */
const OTHER = {
  sau: "सौ", hazaar: "हज़ार", hazar: "हज़ार", hajaar: "हज़ार", hajar: "हज़ार", lakh: "लाख", laakh: "लाख", lakhs: "लाख",
  crore: "करोड़", karod: "करोड़", karor: "करोड़", karodh: "करोड़", arab: "अरब",
  // ordinals
  pehla: "पहला", pahla: "पहला", pehli: "पहली", pahli: "पहली", pehle: "पहले", pahle: "पहले",
  doosra: "दूसरा", dusra: "दूसरा", doosri: "दूसरी", dusri: "दूसरी", doosre: "दूसरे", dusre: "दूसरे",
  teesra: "तीसरा", tisra: "तीसरा", teesri: "तीसरी", tisri: "तीसरी", teesre: "तीसरे", tisre: "तीसरे",
  chautha: "चौथा", chauthi: "चौथी", chauthe: "चौथे", paanchva: "पाँचवाँ", paanchvan: "पाँचवाँ", paanchvi: "पाँचवीं", paanchve: "पाँचवें",
  chhatha: "छठा", chhathi: "छठी", chhathe: "छठे", saatvan: "सातवाँ", saatvi: "सातवीं", aathvan: "आठवाँ", aathvi: "आठवीं",
  nauvan: "नौवाँ", nauvi: "नौवीं", dasvan: "दसवाँ", dasvi: "दसवीं",
  // fractions and multiples
  aadha: "आधा", adha: "आधा", aadhi: "आधी", adhi: "आधी", aadhe: "आधे", adhe: "आधे",
  paune: "पौने", pauna: "पौना", sawa: "सवा", sava: "सवा", saadhe: "साढ़े", sadhe: "साढ़े", saade: "साढ़े",
  dedh: "डेढ़", derh: "डेढ़", dhaai: "ढाई", dhai: "ढाई", chauthai: "चौथाई", chothai: "चौथाई", tihai: "तिहाई", tihaai: "तिहाई",
  dugna: "दुगना", doguna: "दोगुना", dugni: "दुगनी", dugne: "दुगने", tiguna: "तिगुना", tigna: "तिगुना", chauguna: "चौगुना",
  ikai: "इकाई", dahai: "दहाई", saikda: "सैकड़ा", saikde: "सैकड़े", sainkda: "सैकड़ा",
  // number-ish counters
  dono: "दोनों", donon: "दोनों", teeno: "तीनों", teenon: "तीनों", charon: "चारों", chaaron: "चारों", paancho: "पाँचों", paanchon: "पाँचों",
};

/** Roman (lowercase) → Devanagari, for every unambiguous number word. */
export const NUMBER_WORDS = Object.freeze((() => {
  const m = {};
  for (const [i, list] of Object.entries(ROMAN)) for (const r of list) m[r] = HI[+i];
  return { ...m, ...OTHER };
})());

/** Index of the cardinal a Devanagari word spells (for the eval's number-word scorer), or -1. */
export function cardinalOf(deva) {
  return HI.indexOf(String(deva));
}
