// toSpoken() (server/voice/spoken.js): written teacher text → the TTS input, per mode × school medium × band.
// Built from the G1 notation probe's 53 items (docs/research/voice/notation-probe-2026-10-02/items.mjs): the
// renderer must reproduce the hand-authored spoken form `s` of every item in every mode, except the named
// convention differences in DIFFERS (each with its reason). Then: helplines digit by digit in every cell, plain
// text byte-identical, the classes the probe did not cover, and the wiring (only the TTS input changes).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEMS } from "../docs/research/voice/notation-probe-2026-10-02/items.mjs";
import { toSpoken, cellFor, spokenSafetyNumbers, spokenOptsForChild, SAFETY_NUMBERS, RENDERER_VERSION } from "../server/voice/spoken.js";
import { HELPLINES } from "../server/compiler/floor.js";
import { speakChunk, setCacheStore, ttsInput, speechStyle } from "../server/voice/speech.js";
import { splitSentences } from "../server/voice/sentences.js";
import { prewarm, take, __test as prewarmTest } from "../server/voice/prewarm.js";
import { styleForChild } from "../server/routes/voice.js";

/** The probe's cells: en = English mode/English medium; hl = Hinglish/English medium; hi = Hindi/Hindi medium. Class 6 → 10-15. */
const PROBE = { en: { mode: "english", schoolMedium: "english", ageBand: "10-15" },
  hl: { mode: "hinglish", schoolMedium: "english", ageBand: "10-15" }, hi: { mode: "hindi", schoolMedium: "hindi", ageBand: "10-15" } };
const EN = PROBE.en, HL = PROBE.hl, HI = PROBE.hi;
const HLH = { mode: "hinglish", schoolMedium: "hindi", ageBand: "10-15" };
const HIE = { mode: "hindi", schoolMedium: "english", ageBand: "10-15" };
const band69 = (o) => ({ ...o, ageBand: "6-9" });

/**
 * Where the rule table deliberately differs from the probe's hand-authored form. Every entry is a convention
 * call (spoken-notation §2.3), never a misread: the value survives in both.
 */
const DIFFERS = {
  // §2.3 row "mixed number": hi·hindi uses और (NCERT "दो और दो-तिहाई"); the probe author wrote पूर्णांक.
  "F3.hi": "दो और एक बटा तीन को भिन्न के रूप में लिखो।",
  // A variable keeps its case: "a" is a variable, not a sentence start.
  "E3.hl": "a squared b cubed ko expand karo.",
  // The table says "squared" for m/s² in every English-word cell; the probe's hl wrote "square".
  "U7.hl": "g lagbhag nine point eight metre per second squared hota hai.",
  // English unit plural is by value; the rule table does not parse adjectival use ("500 ml bottles").
  "U6.en": "How many five hundred millilitres bottles make two litres?",
  "K6.en": "Find the perimeter of a four centimetres square.",
  // No "and" inside a whole number: "and" is reserved for mixed numbers (two and one upon three).
  "C2.en": "A cycle costs one thousand two hundred fifty rupees. Is that more than one thousand rupees?",
  // The written item had no full stop; the renderer adds no punctuation.
  "L2.hi": "यह संख्या पढ़ो: तीन करोड़ पैंतालीस लाख सड़सठ हज़ार आठ सौ नब्बे",
  // §2.3 row "times table": the chant is band 6-9; at 10-15 it is the operator reading (chant tested below).
  "T1.en": "Say it with me: seven times eight equals fifty-six.",
  "T1.hl": "Mere saath bolo: seven into eight equals fifty-six.",
  "T1.hi": "मेरे साथ बोलो: सात गुणा आठ बराबर छप्पन",
  "T2.en": "The nine table: nine times one equals nine, nine times two equals eighteen, nine times three equals twenty-seven.",
  "T2.hl": "Nine ka table: nine into one equals nine, nine into two equals eighteen, nine into three equals twenty-seven.",
  "T2.hi": "नौ का पहाड़ा: नौ गुणा एक बराबर नौ, नौ गुणा दो बराबर अठारह, नौ गुणा तीन बराबर सत्ताईस",
  // The renderer reads symbols; it does not rewrite the sentence around them (the authored forms did).
  "TM1.hi": "विद्यालय पौने चार बजे पर समाप्त होता है। घड़ी बनाओ।",
  "G1.en": "If angle A B C equals ninety degrees, what kind of angle is it?",
  "G1.hl": "Agar angle A B C equals ninety degree hai, toh ye kaunsa angle hai?",
  "G1.hi": "यदि कोण ए बी सी बराबर नब्बे अंश है, तो यह कौन-सा कोण है?",
  "G2.en": "We take pi is approximately twenty-two upon seven.",
  "G2.hl": "Hum pi approximately twenty-two upon seven lete hain.",
  "G2.hi": "हम पाई लगभग बाईस बटा सात लेते हैं।",
  // A plain word is never touched (the probe's hyphen was a pronunciation experiment, not notation).
  "K1.en": "What does a leaf need for photosynthesis?",
  "K1.hl": "Photosynthesis ke liye patti ko kya chahiye?",
};

// ── 1. the probe's 53 items × 3 modes (159 cases) ──────────────────────────────────────────────────────────
for (const it of ITEMS) {
  for (const m of ["en", "hl", "hi"]) {
    const want = DIFFERS[`${it.id}.${m}`] ?? it.s[m];
    test(`probe ${it.id} (${it.cls}) ${m}: ${it.w[m]}`, () => {
      assert.equal(toSpoken(it.w[m], PROBE[m]), want);
    });
  }
}

test("the DIFFERS list only names real probe cells, and stays small", () => {
  for (const k of Object.keys(DIFFERS)) {
    const [id, m] = k.split(".");
    assert.ok(ITEMS.some((i) => i.id === id) && PROBE[m], k);
  }
  assert.ok(Object.keys(DIFFERS).length <= 25, "a growing list means the renderer drifted from the authored forms");
});

// ── 2. helplines: digit by digit in every cell, matched exactly first ──────────────────────────────────────
const CELLS = [
  ["english·english", EN, "one zero nine eight", "one four four one six"],
  ["hinglish·english", HL, "one zero nine eight", "one four four one six"],
  ["hinglish·hindi", HLH, "एक शून्य नौ आठ", "एक चार चार एक छह"],
  ["hindi·hindi", HI, "एक शून्य नौ आठ", "एक चार चार एक छह"],
  ["hindi·english", HIE, "one zero nine eight", "one four four one six"],
  ["english·hindi (mode wins)", { mode: "english", schoolMedium: "hindi" }, "one zero nine eight", "one four four one six"],
];
for (const [name, o, cl, tm] of CELLS) {
  for (const band of ["6-9", "10-15"]) {
    test(`helplines ${name} ${band}: Childline and Tele-MANAS digit by digit`, () => {
      const s = toSpoken("Childline 1098 ya Tele-MANAS 14416 pe call karo.", { ...o, ageBand: band });
      assert.equal(s, `Childline ${cl} ya Tele-MANAS ${tm} pe call karo.`);
    });
  }
}

test("the safety set is the floor's HELPLINES data, not a copy", () => {
  assert.deepEqual(SAFETY_NUMBERS, HELPLINES.map((h) => h.number));
  assert.ok(SAFETY_NUMBERS.includes("1098") && SAFETY_NUMBERS.includes("14416"));
});

test("helplines: a predicate, not a heuristic: digit by digit even inside maths and next to punctuation", () => {
  assert.equal(toSpoken("1098 + 2 = ?", EN), "one zero nine eight + two = ?", "the helpline is never the cardinal one thousand ninety-eight");
  assert.equal(toSpoken("(1098)", HI), "(एक शून्य नौ आठ)");
  assert.equal(toSpoken("Childline: 1098.", HI), "Childline: एक शून्य नौ आठ.");
  assert.equal(toSpoken("चाइल्डलाइन १०९८ पर कॉल करो।", HI), "चाइल्डलाइन एक शून्य नौ आठ पर कॉल करो।", "Devanagari digits too");
});

test("helplines: only the exact number; a longer number that contains it is a number", () => {
  assert.equal(toSpoken("10985 trees", EN), "Ten thousand nine hundred eighty-five trees");
  assert.equal(toSpoken("1,098 trees", EN), "One thousand ninety-eight trees");
  assert.equal(toSpoken("10.98 kg", EN), "Ten point nine eight kilograms");
});

test("spokenSafetyNumbers: only the helplines change; the rest of a prompt keeps its notation", () => {
  assert.equal(spokenSafetyNumbers("Childline 1098, class 6, 3/4", { mode: "hindi" }), "Childline एक शून्य नौ आठ, class 6, 3/4");
  assert.equal(spokenSafetyNumbers("Tele-MANAS 14416", { mode: "english" }), "Tele-MANAS one four four one six");
});

test("phone-like numbers: mobile, +91, toll-free and a number after call/dial are digit by digit", () => {
  assert.equal(toSpoken("9876543210", EN), "nine eight seven six five four three two one zero");
  assert.equal(toSpoken("+91 98765 43210", HI), "धन नौ एक नौ आठ सात छह पाँच चार तीन दो एक शून्य");
  assert.equal(toSpoken("Toll-free 1800-11-4000", EN), "Toll-free one eight zero zero one one four zero zero zero");
  assert.equal(toSpoken("Emergency? Call 112.", EN), "Emergency? Call one one two.");
  assert.equal(toSpoken("call 2 friends", EN), "call two friends", "one digit is not a number to dial");
});

// ── 3. identity: text with no notation is byte-identical ───────────────────────────────────────────────────
for (const [name, s] of [
  ["Hinglish", "Shabash! Bilkul sahi. Ab ek aur try karte hain?"],
  ["Devanagari", "बहुत बढ़िया! अब अगला सवाल सुनो।"],
  ["English with odd spacing", "  Well done -- you got it!  \n Next one?"],
  ["negative controls In/He/As/AI/IIT", "In He As AI IIT: these stay words."],
  ["Tele-MANAS without a number", "Tele-MANAS is free, 24 hours."],
  ["quotes and brackets", "\"Didi\" (teacher) said: 'try again'"],
  ["emoji and dashes", "Great job 🎉 — keep going…"],
  ["empty", ""],
]) {
  test(`identity: ${name}`, () => {
    const s2 = name === "Tele-MANAS without a number" ? "Tele-MANAS is free, all day." : s;
    for (const o of [EN, HL, HLH, HI, HIE]) assert.equal(toSpoken(s2, o), s2);
  });
}
test("identity: a non-string is stringified, never thrown on", () => {
  assert.equal(toSpoken(undefined, EN), "");
  assert.equal(toSpoken(null, HI), "");
});

// ── 4. classes and conventions beyond the probe ────────────────────────────────────────────────────────────
const CASES = [
  // Indian place value; international grouping only when written that way and ≥ 1,000,000
  ["45,000 en", "45,000", EN, "Forty-five thousand"],
  ["62,314 hl", "62,314 log", HL, "Sixty-two thousand three hundred fourteen log"],
  ["62,314 hi", "62,314 लोग", HI, "बासठ हज़ार तीन सौ चौदह लोग"],
  ["1,00,000 vs 100,000", "1,00,000 = 100,000", EN, "One lakh equals one lakh"],
  ["10,00,000 hi", "10,00,000", HI, "दस लाख"],
  ["1,00,00,000", "1,00,00,000", EN, "One crore"],
  ["100 crore", "1,00,00,00,000", EN, "One hundred crore"],
  ["ungrouped 2500000", "2500000", HL, "Twenty-five lakh"],
  ["international 1,000,000", "1,000,000", EN, "One million"],
  ["international hi", "4,500,000", HI, "चार मिलियन पाँच सौ हज़ार"],
  ["a comma list is a list", "1,234,56", EN, "One, two hundred thirty-four, fifty-six"],
  ["leading zero", "007", EN, "Zero zero seven"],
  // decimals digit by digit
  ["0.05 mg (the NCERT medication example)", "0.05 mg", EN, "Zero point zero five milligrams"],
  ["70.5 hi", "70.5", HI, "सत्तर दशमलव पाँच"],
  ["hl·hindi decimal", "3.75 ko round karo", HLH, "तीन दशमलव सात पाँच ko round karo"],
  // fractions by band
  ["3/4 band 6-9 en", "3/4 of the roti", band69(EN), "Three quarters of the roti"],
  ["3/4 band 6-9 hi", "रोटी का 3/4", band69(HI), "रोटी का तीन-चौथाई"],
  ["1/2 band 6-9 hl", "1/2 glass", band69(HL), "One half glass"],
  ["3/4 band 10-15 hi", "3/4", HI, "तीन बटा चार"],
  ["2/3 band 6-9 stays operator", "2/3", band69(EN), "Two upon three"],
  ["mixed half band 6-9", "2 1/2 roti", band69(EN), "Two and a half roti"],
  ["mixed half band 6-9 hi", "2 1/2 रोटी", band69(HI), "दो और आधा रोटी"],
  ["vulgar ¾", "¾ glass", band69(HL), "Three quarters glass"],
  ["vulgar 1½ hi 10-15", "1½", HI, "एक और एक बटा दो"],
  ["x/4", "x/4 = 3", EN, "x upon four equals three"],
  ["a date is not a fraction", "12/05", EN, "Twelve upon five"],
  // currency
  ["₹25.50 en", "₹25.50", EN, "Twenty-five rupees fifty paise"],
  ["₹25.50 hi", "₹25.50", HI, "पच्चीस रुपये पचास पैसे"],
  ["₹25.50 hl·hindi", "₹25.50 ka pen", HLH, "पच्चीस रुपये पचास पैसे ka pen"],
  ["₹0.50", "₹0.50", EN, "Fifty paise"],
  ["₹1", "₹1", HI, "एक रुपया"],
  ["₹12.5", "₹12.5", EN, "Twelve rupees fifty paise"],
  ["Rs. 5", "Rs. 5 ka", HL, "Five rupees ka"],
  ["₹2 lakh", "₹2 lakh", EN, "Two lakh rupees"],
  ["₹45/-", "₹45/-", HI, "पैंतालीस रुपये"],
  ["₹40/kg", "₹40/kg", EN, "Forty rupees per kilogram"],
  // percent, operators, inequalities
  ["%", "50% bacche", HL, "Fifty percent bacche"],
  ["× ÷ =", "12 ÷ 3 × 2 = 8", EN, "Twelve divided by three times two equals eight"],
  ["hi < >", "3 < 5", HI, "तीन, पाँच से छोटा"],
  ["en ≤ ≥ ≠", "5 ≤ 7 and 3 ≠ 4", EN, "Five is less than or equal to seven and three is not equal to four"],
  ["x as times", "3 x 4 = 12", HL, "Three into four equals twelve"],
  ["unspaced minus in maths", "Solve x-3=5", EN, "Solve x minus three equals five"],
  ["minus with bracket", "4 + (−2) = 2", HI, "चार धन ऋण दो बराबर दो"],
  // negatives, degrees, units
  ["negative temperature hi", "−3 °C", HI, "ऋण तीन डिग्री सेल्सियस"],
  ["angle", "90°", EN, "Ninety degrees"],
  ["one unit singular", "1 cm aur 1 kg", EN, "One centimetre aur one kilogram"],
  ["km/h hi", "60 km/h", HI, "साठ किलोमीटर प्रति घंटा"],
  ["m² hl", "25 m²", HL, "Twenty-five square metre"],
  ["Devanagari unit abbreviation", "5 सेमी", HI, "पाँच सेंटीमीटर"],
  ["sq cm", "4 sq cm", EN, "Four square centimetres"],
  // powers and roots
  ["caret negative power", "10^-2", EN, "Ten raised to the power minus two"],
  ["n² hi", "n² + 1", HI, "n का वर्ग धन एक"],
  ["root of variable", "√x", HL, "x ka square root"],
  // years, times, ordinals, ranges, decades
  ["year with cue", "In 1947 India became free.", EN, "In nineteen forty-seven India became free."],
  ["year hi", "सन् 1857 में", HI, "सन् अठारह सौ सत्तावन में"],
  ["year 2026 is the cardinal", "in 2026", EN, "in two thousand twenty-six"],
  ["no cue: a quantity", "1947 trees", EN, "One thousand nine hundred forty-seven trees"],
  ["decade", "the 1990s", EN, "the nineteen nineties"],
  ["time hi :15", "1:15", HI, "सवा एक बजे"],
  ["time hi :30 special", "2:30", HI, "ढाई बजे"],
  ["time hi :30", "4:30", HI, "साढ़े चार बजे"],
  ["time hi :00 with बजे already there", "7:00 baje", HI, "सात baje"],
  ["time en :05", "6:05", EN, "Six oh five"],
  ["time en :00", "9:00", EN, "Nine o'clock"],
  ["ratio cue beats time", "ratio 12:30", EN, "ratio twelve is to thirty"],
  ["ordinals en", "the 21st, 3rd and 12th", EN, "the twenty-first, third and twelfth"],
  ["ordinal hi", "6th", HI, "छठा"],
  ["Hindi ordinal suffix attaches", "5वीं कक्षा", HI, "पाँचवीं कक्षा"],
  ["range", "Class 6-8", EN, "Class six to eight"],
  ["range hi en dash", "2–3 मिनट", HI, "दो से तीन मिनट"],
  // chant, band 6-9
  ["chant en 6-9", "7 × 8 = 56", band69(EN), "Seven eights are fifty-six"],
  ["chant hi 6-9", "9 × 2 = 18", band69(HI), "नौ दूनी अठारह"],
  ["not a table fact: no chant", "7 × 8 = 54", band69(EN), "Seven times eight equals fifty-four"],
  // formulae and negative controls
  ["H2SO4", "H2SO4", EN, "H two S O four"],
  ["C6H12O6 hi", "C6H12O6", HI, "सी सिक्स एच ट्वेल्व ओ सिक्स"],
  ["A4 is not a formula", "A4 sheet", EN, "A four sheet"],
  ["NaCl has no count: left alone", "NaCl", EN, "NaCl"],
  ["Step 1:", "Step 1: add 2 and 3.", EN, "Step one: add two and three."],
  ["COVID-19 hyphen is not a minus", "COVID-19", EN, "COVID-nineteen"],
];
for (const [name, input, o, want] of CASES) test(`class: ${name}`, () => assert.equal(toSpoken(input, o), want));

test("one convention per item: no Hindi number word in an English-word cell, none of English's in a Hindi one", () => {
  const deva = /[ऀ-ॿ]/;
  const enNum = /\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|lakh|crore|point|upon|minus|plus)\b/i;
  for (const it of ITEMS) {
    if (it.cls === "chem-formula") continue;
    const en = toSpoken(it.w.hl, HL);
    const hi = toSpoken(it.w.hi, HI);
    assert.ok(!deva.test(en), `${it.id} hl has Devanagari: ${en}`);
    assert.ok(!enNum.test(hi.replace(/[a-zA-Z]\b/g, "")), `${it.id} hi has an English number word: ${hi}`);
  }
});

test("cells: mode × medium resolution, 'other' → english, default medium per mode", () => {
  assert.equal(cellFor({ mode: "hindi" }).words, "hi");
  assert.equal(cellFor({ mode: "hindi", schoolMedium: "other" }).words, "en");
  assert.equal(cellFor({ mode: "hinglish" }).words, "en");
  assert.equal(cellFor({ mode: "hinglish", schoolMedium: "hindi" }).words, "hi");
  assert.equal(cellFor({ mode: "hl" }).frame, "hl");
  assert.equal(cellFor({}).mode, "hinglish");
  assert.ok(RENDERER_VERSION.startsWith("sp"));
});

test("spokenOptsForChild: language_pref, school_medium and a band from the class", () => {
  assert.deepEqual(spokenOptsForChild({ language_pref: "hindi", school_medium: "hindi", class_level: 3 }), { mode: "hindi", schoolMedium: "hindi", ageBand: "6-9" });
  assert.deepEqual(spokenOptsForChild({ language_pref: "english", school_medium: "english", class_level: 7 }), { mode: "english", schoolMedium: "english", ageBand: "10-15" });
  assert.equal(spokenOptsForChild({ class_level: 7 }, "6-9").ageBand, "6-9", "the lesson's band wins");
});

// ── 5. wiring: only the TTS input changes ──────────────────────────────────────────────────────────────────
function stubSpeechFetch() {
  const orig = globalThis.fetch;
  const inputs = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    inputs.push(body.input);
    return new Response(new TextEncoder().encode("pcm"), { status: 200, headers: { "content-type": "audio/pcm" } });
  };
  return { inputs, restore: () => { globalThis.fetch = orig; } };
}
const drain = async (job) => { for await (const _ of job.read()); };

test("speakChunk sends the spoken form to the speech model; the cache is keyed by what was said", async () => {
  process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.invalid/openai/v1";
  process.env.AZURE_OPENAI_API_KEY ||= "test-key";
  const keys = [];
  setCacheStore({ get: async (k) => { keys.push(k); return null; }, put: async () => {} });
  const f = stubSpeechFetch();
  try {
    const style = speechStyle({ id: "asha" }, "marin", { mode: "hindi", schoolMedium: "hindi", ageBand: "6-9" });
    await drain(speakChunk("Childline 1098.", style));
    await drain(speakChunk("Ek pen ₹12.50 ka hai, aur 3/4 roti bachi.", style));
    assert.deepEqual(f.inputs, ["Childline एक शून्य नौ आठ.", "Ek pen बारह रुपये पचास पैसे ka hai, aur तीन-चौथाई roti bachi."]);
    assert.equal(keys.length, 1, "the short helpline line was looked up in the cache once");
    const plain = speechStyle({ id: "asha" }, "marin");
    assert.equal(ttsInput("Childline 1098.", plain), "Childline one zero nine eight.", "no cell → the Hinglish default, still digit by digit");
  } finally {
    f.restore();
    setCacheStore({ get: async () => null, put: async () => {} });
  }
});

test("TAXILA_TTS_SPOKEN=0 sends the written text (the A/B switch)", () => {
  process.env.TAXILA_TTS_SPOKEN = "0";
  try { assert.equal(ttsInput("₹12.50", { spoken: HI }), "₹12.50"); }
  finally { delete process.env.TAXILA_TTS_SPOKEN; }
});

test("styleForChild carries the child's spoken cell, so /turn's prewarm and tts-stream render the same way", () => {
  const style = styleForChild({ teacher_id: "asha", class_level: 4, language_pref: "hindi", school_medium: "hindi" });
  assert.deepEqual(style.spoken, { mode: "hindi", schoolMedium: "hindi", ageBand: "6-9" });
  assert.equal(ttsInput("1098", style), "एक शून्य नौ आठ");
  assert.equal(styleForChild({ teacher_id: "asha", class_level: 8, language_pref: "hindi" }, "6-9").spoken.ageBand, "6-9");
});

test("prewarm keeps the WRITTEN sentences (captions) and speaks the spoken ones", async () => {
  process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.invalid/openai/v1";
  process.env.AZURE_OPENAI_API_KEY ||= "test-key";
  setCacheStore({ get: async () => null, put: async () => {} });
  const f = stubSpeechFetch();
  try {
    const text = "Bahut accha! Ab batao, 45,000 mein kitne hazaar hain? Aur Childline 1098 yaad rakhna.";
    const style = styleForChild({ teacher_id: "asha", class_level: 7, language_pref: "hinglish", school_medium: "english" });
    assert.ok(prewarm({ lessonId: "00000000-0000-0000-0000-000000000001", seq: 3, text, tokenHash: "h", guardianId: "g", style }));
    const e = take("00000000-0000-0000-0000-000000000001", 3, "h");
    assert.deepEqual(e.parts, splitSentences(text), "the parts are the written text");
    e.startUpTo(e.parts.length);
    for (const j of e.jobs) await drain(j);
    assert.ok(f.inputs.some((s) => s.includes("forty-five thousand")) && f.inputs.some((s) => s.includes("one zero nine eight")), f.inputs.join(" | "));
    assert.ok(f.inputs.every((s) => !/\d/.test(s)), "no numeral reached the voice");
  } finally {
    f.restore();
    prewarmTest.clear();
    setCacheStore({ get: async () => null, put: async () => {} });
  }
});
