// E0 stimuli: child-answer utterances (NOT teacher prompt text) for the synthetic ASR instrument probe.
// Reference convention = canonical code-mix: Hindi words in Devanagari, English words in Latin
// (HiACC's transcription convention; Sarvam "codemix" mode's output convention).
// Each item: id, cat, ref (canonical), keys (terms that carry the answer), ans (expected value for
// answer-bearing items, with distractors), lang tag. Numbers are written as SPOKEN.
export const STIMULI = [
  // S: short answers (the dominant child-turn shape in a tutoring call; word count is the top causal
  // factor for child ASR error in Singh et al. 2025, arXiv 2502.08587)
  { id: "s01", cat: "short", lang: "hi", ref: "पाँच", keys: ["पाँच"], ans: { want: 5, not: [4, 6, 3] } },
  { id: "s02", cat: "short", lang: "en", ref: "twelve", keys: ["twelve"], ans: { want: 12, not: [2, 20] } },
  { id: "s03", cat: "short", lang: "hi", ref: "हाँ", keys: ["हाँ"] },
  { id: "s04", cat: "short", lang: "hi", ref: "नहीं पता", keys: ["नहीं", "पता"] },
  { id: "s05", cat: "short", lang: "en", ref: "photosynthesis", keys: ["photosynthesis"] },
  { id: "s06", cat: "short", lang: "hi", ref: "तीन बटा चार", keys: ["तीन", "बटा", "चार"], ans: { want: "3/4", not: ["2/3", "4/3", "1/4"] } },
  { id: "s07", cat: "short", lang: "hi", ref: "चौबीस", keys: ["चौबीस"], ans: { want: 24, not: [14, 34, 4] } },
  // H: NCERT Hinglish (English content words inside Hindi grammar)
  { id: "h01", cat: "hinglish", lang: "mix", ref: "chlorophyll पत्तियों में होता है इसलिए पत्ते green दिखते हैं", keys: ["chlorophyll", "पत्तियों", "green"] },
  { id: "h02", cat: "hinglish", lang: "mix", ref: "evaporation में पानी गरम होके vapour बन जाता है", keys: ["evaporation", "पानी", "vapour"] },
  { id: "h03", cat: "hinglish", lang: "mix", ref: "magnet के दो poles होते हैं north pole और south pole", keys: ["magnet", "poles", "north", "south"] },
  { id: "h04", cat: "hinglish", lang: "mix", ref: "plants sunlight पानी और carbon dioxide से अपना खाना बनाते हैं", keys: ["plants", "sunlight", "carbon", "dioxide"] },
  { id: "h05", cat: "hinglish", lang: "hi", ref: "दो बटा तीन छोटा है क्योंकि दो छोटा है", keys: ["दो", "बटा", "तीन", "छोटा"], ans: { want: "2/3", not: ["3/4", "3/2"] } },
  { id: "h06", cat: "hinglish", lang: "mix", ref: "denominator same है तो जिसका numerator बड़ा वो बड़ा", keys: ["denominator", "same", "numerator", "बड़ा"] },
  { id: "h07", cat: "hinglish", lang: "mix", ref: "rectangle का area length into breadth होता है तो बारह into पाँच साठ", keys: ["rectangle", "area", "breadth", "बारह", "पाँच", "साठ"], ans: { want: 60, not: [17, 50, 70] } },
  // P: Hindi-medium (pure Hindi, NCERT Hindi-medium vocabulary)
  { id: "p01", cat: "hindi", lang: "hi", ref: "पौधे सूर्य के प्रकाश से अपना भोजन बनाते हैं इसे प्रकाश संश्लेषण कहते हैं", keys: ["पौधे", "सूर्य", "प्रकाश", "भोजन", "संश्लेषण"] },
  { id: "p02", cat: "hindi", lang: "hi", ref: "भिन्न में ऊपर वाला अंश और नीचे वाला हर होता है", keys: ["भिन्न", "अंश", "हर"] },
  { id: "p03", cat: "hindi", lang: "hi", ref: "मुझे ये सवाल समझ नहीं आया फिर से बताओ ना", keys: ["सवाल", "समझ", "नहीं", "बताओ"] },
  // E: Indian-English
  { id: "e01", cat: "english", lang: "en", ref: "the denominator tells us how many equal parts the whole is divided into", keys: ["denominator", "equal", "parts", "divided"] },
  { id: "e02", cat: "english", lang: "en", ref: "i think the answer is twenty four because six fours are twenty four", keys: ["twenty", "four", "six"], ans: { want: 24, not: [20, 28, 64] } },
  // D: disfluent / self-correcting (the answer is the LAST value)
  { id: "d01", cat: "disfluent", lang: "hi", ref: "वो उम्म तीन नहीं नहीं चार", keys: ["तीन", "चार"], ans: { want: 4, last: true, not: [] } },
  { id: "d02", cat: "disfluent", lang: "mix", ref: "matlab जो evaporation वो वाला पानी उड़ जाता है ना", keys: ["evaporation", "पानी", "उड़"] },
];

// What the TTS reads (adds the pauses/fillers that the canonical ref drops as punctuation).
export const SPOKEN = {
  d01: "वो... उम्म... तीन... नहीं नहीं, चार।",
  d02: "matlab... जो... evaporation... वो वाला... पानी उड़ जाता है ना?",
  s04: "नहीं पता।",
  e02: "I think the answer is twenty four, because six fours are twenty four.",
};

// Non-speech clips for the hallucination check (Koenecke et al. 2024: Whisper hallucinates more on
// long non-vocal stretches — children pause a lot).
export const NONSPEECH = ["n01-silence", "n02-babble", "n03-pink"];

// Lesson vocabulary used for keyword biasing. Items marked decoy:true do NOT occur in any stimulus;
// they measure over-biasing (a boosted term inserted where it was never said).
export const KEYWORDS = [
  "photosynthesis", "chlorophyll", "evaporation", "vapour", "magnet", "poles", "carbon dioxide",
  "denominator", "numerator", "rectangle", "area", "breadth", "प्रकाश संश्लेषण", "भिन्न", "अंश", "हर",
];
export const DECOYS = ["condensation", "perimeter", "chloroplast", "वाष्पीकरण", "magnetic field", "हिस्सा"];

// Unstructured ASR context (an ASR prompt, never a teacher prompt).
export const ASR_PROMPT = "A child aged 8 to 12 in India answers a teacher aloud in Hindi, English, or a Hindi-English mix. " +
  "School science and maths (NCERT). Write Hindi words in Devanagari and English words in Latin script, exactly as spoken. " +
  "Terms that may occur: " + [...KEYWORDS, ...DECOYS].join(", ") + ".";

// Spoken number forms used by the scorer to normalise digits ("5") to the form spoken in the reference.
export const NUM = {
  2: ["दो", "two"], 3: ["तीन", "three"], 4: ["चार", "four"], 5: ["पाँच", "पांच", "five"], 6: ["छह", "छः", "six"],
  12: ["बारह", "twelve"], 14: ["चौदह", "fourteen"], 17: ["सत्रह", "seventeen"], 20: ["बीस", "twenty"],
  24: ["चौबीस", "twenty four"], 28: ["अट्ठाईस", "twenty eight"], 34: ["चौंतीस", "thirty four"], 50: ["पचास", "fifty"],
  60: ["साठ", "sixty"], 64: ["चौंसठ", "sixty four"], 70: ["सत्तर", "seventy"],
};
