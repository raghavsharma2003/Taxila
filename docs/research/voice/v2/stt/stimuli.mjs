// stt-hinglish v2 stimuli: 30 CHILD-ANSWER utterances (test stimuli only; never teacher prompt text).
// Reference convention = canonical code-mix (Hindi words in Devanagari, English words in Latin), as E0.
// Fillers stay in `ref` (scored separately); SPOKEN adds the pauses the TTS should make.
// keys = terms that carry meaning for the learner model / grader. ans = gradable value (last:true → the
// value after a self-correction). Numbers in refs are written as SPOKEN.
export const STIMULI = [
  // M: NCERT Hinglish (English content words inside Hindi grammar), classes 3-7
  { id: "m01", cat: "hinglish", ref: "मेरे पास pizza के आठ slices थे और मैंने तीन खा लिए", keys: ["pizza", "slices", "आठ", "तीन"] },
  { id: "m02", cat: "hinglish", ref: "दो बटा चार और एक बटा दो same होते हैं ना", keys: ["बटा", "same"], ans: { want: "2/4", not: ["4/2", "2/3"] } },
  { id: "m03", cat: "hinglish", ref: "equivalent fractions मतलब value same रहती है", keys: ["equivalent", "fractions", "value", "same"] },
  { id: "m04", cat: "hinglish", ref: "numerator और denominator दोनों को दो से multiply किया", keys: ["numerator", "denominator", "multiply", "दो"] },
  { id: "m05", cat: "hinglish", ref: "photosynthesis में plants oxygen छोड़ते हैं", keys: ["photosynthesis", "plants", "oxygen"] },
  { id: "m06", cat: "hinglish", ref: "triangle के तीन sides और तीन angles होते हैं", keys: ["triangle", "sides", "angles", "तीन"] },
  { id: "m07", cat: "hinglish", ref: "मेरा answer पंद्रह आया क्योंकि पाँच into तीन पंद्रह होता है", keys: ["answer", "पंद्रह", "पाँच", "तीन"], ans: { want: 15, not: [8, 50, 18] } },
  { id: "m08", cat: "hinglish", ref: "water cycle में पहले evaporation फिर condensation होता है", keys: ["water", "cycle", "evaporation", "condensation"] },
  { id: "m09", cat: "hinglish", ref: "मुझे लगता है half pizza मतलब चार slices", keys: ["half", "pizza", "चार", "slices"], ans: { want: 4, not: [2, 8] } },
  { id: "m10", cat: "hinglish", ref: "हमारी class में बत्तीस बच्चे हैं", keys: ["class", "बत्तीस", "बच्चे"], ans: { want: 32, not: [22, 30, 42] } },
  // H: pure Hindi (Hindi-medium / class 3 register)
  { id: "h01", cat: "hindi", ref: "पृथ्वी सूर्य के चारों ओर घूमती है", keys: ["पृथ्वी", "सूर्य", "घूमती"] },
  { id: "h02", cat: "hindi", ref: "तीन बटा पाँच में तीन अंश है और पाँच हर है", keys: ["अंश", "हर", "बटा"], ans: { want: "3/5", not: ["5/3", "3/4"] } },
  { id: "h03", cat: "hindi", ref: "मेरी माँ ने मुझे सात आम दिए", keys: ["माँ", "सात", "आम"], ans: { want: 7, not: [6, 8, 70] } },
  { id: "h04", cat: "hindi", ref: "जल का वाष्पीकरण धूप से होता है", keys: ["जल", "वाष्पीकरण", "धूप"] },
  { id: "h05", cat: "hindi", ref: "सौ में से अड़तालीस घटाओ तो बावन बचते हैं", keys: ["सौ", "अड़तालीस", "बावन"], ans: { want: 52, last: true, not: [] } },
  { id: "h06", cat: "hindi", ref: "पत्तियाँ हरी होती हैं क्योंकि उनमें पर्णहरित होता है", keys: ["पत्तियाँ", "हरी", "पर्णहरित"] },
  { id: "h07", cat: "hindi", ref: "गाय हमें दूध देती है", keys: ["गाय", "दूध"] },
  { id: "h08", cat: "hindi", ref: "नौ और छह मिलाकर पंद्रह होते हैं", keys: ["नौ", "छह", "पंद्रह"], ans: { want: 15, last: true, not: [] } },
  // E: Indian English
  { id: "e01", cat: "english", ref: "the numerator is the top number and the denominator is the bottom number", keys: ["numerator", "top", "denominator", "bottom"] },
  { id: "e02", cat: "english", ref: "two by four is equal to one by two", keys: ["two", "four", "equal", "one"], ans: { want: "2/4", not: ["4/2"] } },
  { id: "e03", cat: "english", ref: "a magnet attracts iron but not plastic", keys: ["magnet", "attracts", "iron", "plastic"] },
  { id: "e04", cat: "english", ref: "seven eights are fifty six", keys: ["seven", "fifty", "six"], ans: { want: 56, last: true, not: [] } },
  { id: "e05", cat: "english", ref: "the capital of india is new delhi", keys: ["capital", "india", "delhi"] },
  { id: "e06", cat: "english", ref: "plants take in carbon dioxide and give out oxygen", keys: ["plants", "carbon", "dioxide", "oxygen"] },
  { id: "e07", cat: "english", ref: "can you say it again please i did not understand", keys: ["again", "understand"] },
  // D: hesitation / self-correction (the answer is the LAST value)
  { id: "d01", cat: "hesitant", ref: "उम्म तीन बटा आठ नहीं नहीं तीन बटा चार", keys: ["बटा", "चार"], ans: { want: "3/4", last: true, not: [] } },
  { id: "d02", cat: "hesitant", ref: "umm मतलब जो ऊपर वाला number है वो numerator", keys: ["मतलब", "number", "numerator"] },
  { id: "d03", cat: "hesitant", ref: "umm i think it is twenty one no wait twenty four", keys: ["twenty", "four"], ans: { want: 24, last: true, not: [] } },
  { id: "d04", cat: "hesitant", ref: "वो हम्म मुझे नहीं पता sorry", keys: ["नहीं", "पता", "sorry"] },
  { id: "d05", cat: "hesitant", ref: "उम्म आठ सत्ते छप्पन", keys: ["आठ", "छप्पन"], ans: { want: 56, last: true, not: [] } },
];

// What the TTS reads (pauses / fillers / natural punctuation).
export const SPOKEN = {
  m02: "दो बटा चार और एक बटा दो... same होते हैं ना?",
  m09: "मुझे लगता है... half pizza मतलब चार slices।",
  e02: "Two by four is equal to one by two.",
  e07: "Can you say it again please? I did not understand.",
  d01: "उम्म... तीन बटा आठ... नहीं नहीं, तीन बटा चार।",
  d02: "umm... मतलब... जो ऊपर वाला number है... वो numerator?",
  d03: "Umm... I think it is twenty one... no wait, twenty four.",
  d04: "वो... हम्म... मुझे नहीं पता... sorry।",
  d05: "उम्म... आठ सत्ते... छप्पन।",
};

// Fillers: removed from ref AND hyp for the filler-normalised WER (fillers are scored separately).
export const FILLERS = ["उम्म", "उम", "हम्म", "हम", "अं", "umm", "um", "uh", "hmm", "hm", "उह", "अम्म", "ummm", "उम्मम"];

// Lesson vocabulary for keyword biasing (live-tx `keywords`, Azure `PhraseListGrammar`). DECOYS occur in NO
// stimulus: inserting one = over-biasing.
export const KEYWORDS = ["numerator", "denominator", "equivalent fractions", "photosynthesis", "evaporation", "condensation",
  "triangle", "multiply", "magnet", "carbon dioxide", "oxygen", "अंश", "हर", "बटा", "वाष्पीकरण", "पर्णहरित"];
export const DECOYS = ["perimeter", "chloroplast", "decimal", "magnetic field", "हिस्सा", "सत्रह"];

// Speaker + script convention only, NO vocabulary (E0: a term list in a free-text prompt manufactures
// lesson content from silence).
export const SCRIPT_PROMPT = "A child aged 8 to 12 in India answers a teacher aloud in Hindi, English, or a Hindi-English mix. Write Hindi words in Devanagari and English words in Latin script, exactly as spoken.";

// Spoken number forms (Devanagari, English, romanised Hindi, Nastaliq) → value.
export const NUM = {
  1: ["एक", "one", "ek", "ایک"], 2: ["दो", "two", "do", "دو"], 3: ["तीन", "three", "teen", "tin", "تین"], 4: ["चार", "four", "char", "chaar", "چار"],
  5: ["पाँच", "पांच", "five", "paanch", "panch", "پانچ"], 6: ["छह", "छः", "छे", "six", "chhe", "chhah", "چھ"], 7: ["सात", "seven", "saat", "سات"],
  8: ["आठ", "eight", "aath", "آٹھ"], 9: ["नौ", "nine", "nau", "نو"], 15: ["पंद्रह", "पन्द्रह", "fifteen", "pandrah", "پندرہ"],
  21: ["इक्कीस", "twenty one", "ikkis"], 24: ["चौबीस", "twenty four", "chaubis", "chaubees"], 32: ["बत्तीस", "thirty two", "battis", "بتیس"],
  48: ["अड़तालीस", "अड़तालिस", "forty eight", "adtalis", "artalis"], 52: ["बावन", "fifty two", "bawan", "baavan", "باون"],
  56: ["छप्पन", "fifty six", "chhappan", "چھپن"], 100: ["सौ", "hundred", "one hundred", "sau", "سو"],
  // distractor values used in ans.not
  22: ["बाईस", "twenty two"], 30: ["तीस", "thirty"], 42: ["बयालीस", "forty two"], 50: ["पचास", "fifty"], 70: ["सत्तर", "seventy"],
};
