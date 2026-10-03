// The address register (aap / tum) the teacher uses for this child: one resolver, one deterministic transform for
// verified kit content, and one predicate for the teacher's own words (PRODUCT-DESIGN-V2 §4.10 G-REG-1; audit #7:
// a Class 8 "aap" child was greeted "tumhara… Tumhe…").
//
// Precedence (V2 §3.2 step 6 + §3.3 step 4): the child's own pick at Hello (classes 5+, where the persona sheet lets
// them choose) → the parent's controls row (child_controls.address) → the class default (aap from class 5 up, tum
// below; server/routes/parent.js defaultControls). English lessons have no aap/tum distinction: null.
//
// Kit questions are written in tum forms ("Pehle 8 odd numbers jodo"). Asked of an aap child they contradict the
// register on the very turn the child is being addressed, so the question the Director poses is converted to aap
// forms by a closed lexicon (pronouns, the imperative and future verb forms found in every kit, the copula at the end
// of a tum sentence). Keys, acceptable answers and hints are never touched. Unknown words pass through unchanged.

export const ADDRESSES = ["aap", "tum"];

/**
 * @param {{ classLevel: number, lang: string, parent?: string | null, child?: string | null }} a
 * @returns {"aap" | "tum" | null}
 */
export function resolveAddress({ classLevel, lang, parent = null, child = null }) {
  if (lang === "english") return null;
  const cl = Number(classLevel) || 1;
  if (ADDRESSES.includes(child) && cl >= 5) return child;
  if (ADDRESSES.includes(parent)) return parent;
  return cl >= 5 ? "aap" : "tum";
}

/** The move-shape note (a note, never a line she could say). null when there is nothing to say (English). */
export function registerNote(address) {
  if (address === "aap") return "address them with aap forms only (aap, aapka, aapne; verbs -iye / -enge), never tum or tu";
  if (address === "tum") return "address them with tum forms (tum, tumhara, tumne), never tu";
  return null;
}

// ── tum → aap, closed lexicon ──
const PRONOUN = {
  tum: "aap", tumhara: "aapka", tumhaara: "aapka", tumhari: "aapki", tumhaari: "aapki", tumhare: "aapke", tumhaare: "aapke",
  tumne: "aapne", tumhe: "aapko", tumhein: "aapko", tumhen: "aapko", tumko: "aapko", tumse: "aapse", tumme: "aapmein", tumpe: "aappar",
  tu: "aap", tera: "aapka", teri: "aapki", tere: "aapke", tujhe: "aapko", tujhse: "aapse",
  "तुम": "आप", "तुम्हें": "आपको", "तुम्हे": "आपको", "तुमको": "आपको", "तुम्हारा": "आपका", "तुम्हारी": "आपकी", "तुम्हारे": "आपके", "तुमने": "आपने",
  "तुमसे": "आपसे", "तू": "आप", "तुझे": "आपको", "तुझको": "आपको", "तेरा": "आपका", "तेरी": "आपकी", "तेरे": "आपके",
};
/** Imperatives seen in the kits' Hinglish prompts (data/kits/*.json prompt_hi), tum form → aap form. */
const IMPERATIVE = {
  karo: "kariye", batao: "bataiye", bataao: "bataiye", samjhao: "samjhaiye", samjhaao: "samjhaiye", lagao: "lagaiye", lagaao: "lagaiye",
  socho: "sochiye", banao: "banaiye", banaao: "banaiye", sikhao: "sikhaiye", sikhaao: "sikhaiye", likho: "likhiye", bolo: "boliye",
  nikaalo: "nikaaliye", nikalo: "nikaliye", dikhao: "dikhaiye", dikhaao: "dikhaiye", dhoondo: "dhoondhiye", dhoondho: "dhoondhiye",
  dhundho: "dhoondhiye", suno: "suniye", dekho: "dekhiye", bharo: "bhariye", rakho: "rakhiye", jodo: "jodiye", pakdo: "pakadiye",
  baanto: "baantiye", badlo: "badaliye", daalo: "daaliye", gino: "giniye", ghatao: "ghataiye", ghataao: "ghataiye", chuno: "chuniye",
  milao: "milaiye", milaao: "milaiye", sunao: "sunaiye", sunaao: "sunaiye", padho: "padhiye", chhoo: "chhuiye", chhodo: "chhodiye",
  hilao: "hilaiye", hilaao: "hilaiye", dabao: "dabaiye", kheencho: "kheenchiye", naapo: "naapiye", sudhaaro: "sudhaariye",
  ghumao: "ghumaiye", ghumaao: "ghumaiye", poochho: "poochhiye", poocho: "poochhiye", todo: "todiye", laao: "laaiye", bajao: "bajaiye",
  jaao: "jaaiye", badhao: "badhaiye", kholo: "kholiye", ruko: "rukiye", mudo: "mudiye", maano: "maaniye", tolo: "toliye", maaro: "maariye",
  uthao: "uthaiye", khelo: "kheliye", chipko: "chipkiye", girao: "giraiye", raho: "rahiye", lapeto: "lapetiye", ghoomo: "ghoomiye",
  kaho: "kahiye", baandho: "baandhiye", sujhao: "sujhaiye", gholo: "gholiye", pehchaano: "pehchaaniye", uchhalo: "uchhaliye",
  khiskao: "khiskaiye", hatao: "hataiye", ragdo: "ragadiye", soongho: "soonghiye", dubo: "duboiye", sukhaao: "sukhaiye", kaato: "kaatiye",
  dhakelo: "dhakeliye", khao: "khaiye", phaado: "phaadiye", ludhkao: "ludhkaiye", bhigo: "bhigoiye", chhaano: "chhaaniye", baitho: "baithiye",
  jalao: "jalaiye", bachao: "bachaiye", chabao: "chabaiye", phoonko: "phoonkiye", chalao: "chalaiye", pahuncho: "pahunchiye",
  chipkao: "chipkaiye", ukhaado: "ukhaadiye", tairao: "tairaiye", ghero: "gheriye", jamao: "jamaiye", latkao: "latkaiye", khodo: "khodiye",
  maango: "maangiye", karwao: "karwaiye", chalo: "chaliye", jao: "jaiye", ao: "aaiye", dho: "dhoiye", chhidko: "chhidakiye",
  dhako: "dhakiye", chakho: "chakhiye", sungho: "soonghiye", guzaaro: "guzaariye", chhedo: "chhediye", niklo: "nikliye", sako: "sakein",
  // Devanagari (the Hindi-subject kits)
  "सुनो": "सुनिए", "बोलो": "बोलिए", "करो": "कीजिए", "देखो": "देखिए", "भरो": "भरिए", "पकड़ो": "पकड़िए", "पढ़ो": "पढ़िए", "बदलो": "बदलिए",
  "बाँधो": "बाँधिए", "बांधो": "बांधिए", "सीखो": "सीखिए", "सोचो": "सोचिए", "ढूँढो": "ढूँढिए", "ढूंढो": "ढूंढिए", "चलो": "चलिए", "तोड़ो": "तोड़िए",
  "लिखो": "लिखिए", "पूछो": "पूछिए", "उठो": "उठिए", "गिनो": "गिनिए", "खींचो": "खींचिए", "जोड़ो": "जोड़िए", "रुको": "रुकिए", "छाँटो": "छाँटिए",
  "समझो": "समझिए", "चुनो": "चुनिए", "रहो": "रहिए", "खेलो": "खेलिए", "बूझो": "बूझिए", "बैठो": "बैठिए", "खोलो": "खोलिए", "पियो": "पीजिए",
  "काटो": "काटिए", "फेंको": "फेंकिए", "सको": "सकें", "सूनो": "सुनिए",
  do: null, lo: null, rao: null,
};
/** Any other "-aao" / "-ao" word of 5+ letters in the kits is a tum imperative ("failaao", "pakao"); Devanagari "-ाओ" too. */
const GENERIC_AO = (lw) => (/^[a-z]{3,}a?ao$/.test(lw) ? lw.replace(/a?ao$/, "aiye") : /^[\u0900-\u097F]+ाओ$/.test(lw) ? lw.replace(/ाओ$/, "ाइए") : null);
const FUTURE_SPECIAL = { doge: "denge", dogi: "dengi", loge: "lenge", logi: "lengi", hoge: "honge", hogi: null, karoge: "karenge", karogi: "karengi" };
/** -oge / -ogi verbs: "banaoge" → "banayenge", "chunoge" → "chunenge" (only words that are verbs in the kits). */
function future(w) {
  if (w in FUTURE_SPECIAL) return FUTURE_SPECIAL[w];
  const m = w.match(/^([a-z]{2,})(o)(ge|gi)$/);
  if (!m) return null;
  const stem = m[1];
  const end = m[3] === "ge" ? "nge" : "ngi";
  return /aa?$/.test(stem) ? `${stem}ye${end}` : `${stem}e${end}`;
}
const WORD = /[\p{L}\p{M}]+/gu;
const words = (t) => String(t ?? "").match(WORD) ?? [];
const isTumPronoun = (w) => Object.hasOwn(PRONOUN, w.toLowerCase());

const keepCase = (src, out) => (src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out);

/**
 * Kit Hinglish → aap forms. Sentence by sentence: pronouns and the listed verb forms everywhere; the copula "ho" at the
 * end of a sentence that addressed the child (a tum pronoun, or "Kya … ho?") becomes "hain".
 */
export function toAap(text) {
  const sentences = String(text ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [String(text ?? "")];
  return sentences.map((s) => {
    const addressed = words(s).some(isTumPronoun) || /^\s*(kya|क्या)(?![\p{L}\p{M}])/iu.test(s);
    let out = s.replace(WORD, (w) => {
      const lw = w.toLowerCase();
      // "do" / "lo" stay ("do" is also two; "le lo" is not addressed to anyone in particular).
      if (Object.hasOwn(PRONOUN, lw)) return keepCase(w, PRONOUN[lw]);
      if (Object.hasOwn(IMPERATIVE, lw)) return IMPERATIVE[lw] ? keepCase(w, IMPERATIVE[lw]) : w;
      if (/o(ge|gi)$/.test(lw)) { const f = future(lw); if (f) return keepCase(w, f); }
      const g = GENERIC_AO(lw);
      return g ? keepCase(w, g) : w;
    });
    if (addressed) {
      out = out.replace(/(^|[^\p{L}\p{M}])(ho)(\s*[?.!]?\s*)$/iu, (_, pre, ho, tail) => `${pre}${keepCase(ho, "hain")}${tail}`)
        .replace(/(^|[^\p{L}\p{M}])हो(\s*[?।!]?\s*)$/u, "$1हैं$2")
        .replace(/\b(rahe|sakte|chuke) ho\b/gi, "$1 hain");
    }
    return out;
  }).join("");
}

// ── the predicate on the teacher's own words ──
const AAP_FORMS = new Set(["aap", "aapka", "aapki", "aapke", "aapne", "aapko", "aapse", "आप", "आपका", "आपकी", "आपके", "आपने", "आपको", "आपसे"]);
/** "tu" in an English line ("tu" is not English) and short Hindi words that are also English stay pronouns; ok. */
const isTumMark = (w) => {
  const lw = w.toLowerCase();
  return isTumPronoun(lw) || (Object.hasOwn(IMPERATIVE, lw) && !!IMPERATIVE[lw]) || (/o(ge|gi)$/.test(lw) && !!future(lw) && lw !== "hogi")
    || !!GENERIC_AO(lw);
};

/**
 * Which register a teacher line uses toward the child: counts of tum-form and aap-form markers (pronouns, and the
 * kits' tum imperative and future verb forms). English text has none.
 */
export function registerMarks(text) {
  const ws = words(text);
  return { tum: ws.filter(isTumMark).length, aap: ws.filter((w) => AAP_FORMS.has(w.toLowerCase())).length };
}

/** G-REG-1: does the line break the child's address register? (aap child: any tum mark; tum child: an aap pronoun.) */
export function registerBroken(text, address) {
  if (!address) return false;
  const m = registerMarks(text);
  return address === "aap" ? m.tum > 0 : m.aap > 0;
}
