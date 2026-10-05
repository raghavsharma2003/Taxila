// RS-7: Roman Hinglish → Devanagari before TTS (server/voice/translit) and the voice switch (server/voice/voice-switch.js).
import test from "node:test";
import assert from "node:assert/strict";
import { toDevanagari, analyze, devanagariOn, safetyText } from "../server/voice/translit/index.js";
import { NUMBER_WORDS, cardinalOf } from "../server/voice/translit/numbers.js";
import { romanToDeva } from "../server/voice/translit/rules.js";
import { WORDS } from "../server/voice/spoken-lexicon.js";
import { VOICE_CHOICES, voiceChoice, styleFor, spokenFor, documentFor, spokenText } from "../server/voice/voice-switch.js";

const T = (s, o = {}) => toDevanagari(s, { force: true, mode: "hinglish", ...o });
const ON = { TAXILA_VOICE_DEVANAGARI: "1" };

test("the v4 probe line: every Hindi number word goes to Devanagari, English stays Latin", () => {
  const out = T("Sattaais aur paintees. Pehle tens jodte hain, bees aur tees, pachaas. Phir saat aur paanch, baarah. Toh total hua baasath!");
  assert.equal(out, "सत्ताईस और पैंतीस. पहले tens जोड़ते हैं, बीस और तीस, पचास. फिर सात और पाँच, बारह. तो total हुआ बासठ!");
});

test("every cardinal 1-99 has at least one Roman spelling mapping to spoken-lexicon's Devanagari (except ambiguous do/saath)", () => {
  const covered = new Set(Object.values(NUMBER_WORDS).map(cardinalOf).filter((n) => n >= 0));
  const missing = [];
  for (let n = 1; n < 100; n++) if (!covered.has(n) && n !== 2 && n !== 20 && n !== 60) missing.push(n);
  assert.deepEqual(missing, []);
  assert.equal(NUMBER_WORDS.paintees, WORDS.hi.below100[35]);
});

test("number context decides ambiguous number spellings", () => {
  assert.equal(T("Numerals mein likhiye: chaubees hazaar teen sau saath."), "Numerals में लिखिए: चौबीस हज़ार तीन सौ साठ.");
  assert.equal(T("Aap mere saath chaliye."), "आप मेरे साथ चलिए.");
  assert.match(T("Do sau aur do sau kitne hue?"), /^दो सौ और दो सौ कितने हुए\?$/);
});

test("English sentences, English lane and the flag-off path are byte-identical", () => {
  assert.equal(T("Let us do this together, is that okay?"), "Let us do this together, is that okay?");
  assert.equal(toDevanagari("Aap ready hain?", { force: true, mode: "english" }), "Aap ready hain?");
  assert.equal(toDevanagari("Aap ready hain?", { mode: "hinglish", env: {} }), "Aap ready hain?");
  assert.equal(devanagariOn({}), false);
  assert.equal(devanagariOn(ON), true);
  assert.equal(toDevanagari("Aap ready hain?", { mode: "hinglish", env: ON }), "आप ready हैं?");
});

test("safety floor: helpline, identity and safety-register text is never touched", () => {
  const help = "Aapne jo bataya, woh zaroori hai. Childline 1098 ya Tele-MANAS 14416 pe call kariye.";
  assert.equal(T(help), help);
  const spokenHelp = "Childline one zero nine eight pe abhi call kariye.";
  assert.equal(T(spokenHelp), spokenHelp);
  const ident = "Main insaan nahi hoon, main ek AI teacher hoon.";
  assert.equal(T(ident), ident);
  assert.equal(T("Kisi bade ko abhi bataiye.", { register: "safety" }), "Kisi bade ko abhi bataiye.");
  assert.equal(T("Kisi bade ko abhi bataiye.", { moment: { safety: true } }), "Kisi bade ko abhi bataiye.");
  // the predicate runs on the WRITTEN text: digits spoken out cannot slip past it
  assert.equal(T("Childline pe call kariye: one zero nine eight.", { written: "Childline 1098 pe call kariye." }), "Childline pe call kariye: one zero nine eight.");
  assert.equal(safetyText("Aaj fractions karenge."), false);
});

test("names stay Latin, capitalised Hindi function words still convert", () => {
  assert.equal(T("Theek hai Aarav, Bittu ko samjhaiye."), "ठीक है Aarav, Bittu को समझाइए.");
  assert.equal(T("Bahut badhiya, Diya ne kaha."), "बहुत बढ़िया, Diya ने कहा.");
});

test("ambiguous words follow the sentence; ki is the conjunction after a verb", () => {
  assert.equal(T("Main ek sawaal poochhti hoon."), "मैं एक सवाल पूछती हूँ.");
  assert.equal(T("Aapko kaise pata chala ki paani ke teen forms hain?"), "आपको कैसे पता चला कि पानी के तीन forms हैं?");
  assert.equal(T("Paani ki teen forms."), "पानी की तीन forms.");
});

test("rule fallback is only for Hindi-looking unknown words", () => {
  assert.equal(romanToDeva("paintees"), "पैंतीस");
  assert.equal(romanToDeva("pandrah"), "पंद्रह");
  const kinds = Object.fromEntries(analyze("Aap chemical reaction dekhiye, baaltiyon mein.").map((a) => [a.w, a.kind]));
  assert.equal(kinds.chemical, "keep");
  assert.equal(kinds.reaction, "keep");
});

test("output only replaces word spans: punctuation, spacing and digits are preserved", () => {
  const s = "Aap,  ek-ek   karke — 3 cheezein  likhiye!";
  const out = T(s);
  assert.equal(out.replace(/[ऀ-ॿ]+/g, "X"), "X,  X-X   X — 3 X  X!");
});

test("fast enough for the hot path: < 1 ms per reply", () => {
  const s = "Aarav, cricket pitch ko 6 equal parts mein baantiye. Sochiye, pehla mark start se kitni door hoga? Bittu ko baad mein aap samjhayenge.";
  T(s);
  const t0 = performance.now();
  for (let i = 0; i < 500; i++) T(s);
  assert.ok((performance.now() - t0) / 500 < 1, "mean > 1 ms");
});

// ───────────── voice switch ─────────────

test("voice switch: unset changes nothing; unknown ignored; Preview Priya refused without the override", () => {
  assert.equal(voiceChoice({}), null);
  assert.equal(voiceChoice({ TAXILA_TEACHER_VOICE: "nova" }), null);
  assert.equal(voiceChoice({ TAXILA_TEACHER_VOICE: "priya" }), null);
  assert.equal(voiceChoice({ TAXILA_TEACHER_VOICE: "priya", TAXILA_ALLOW_PREVIEW_VOICE: "1" }).voice, "hi-IN-Priya:MAI-Voice-2.1");
  assert.equal(voiceChoice({ TAXILA_TEACHER_VOICE: "Diya" }).voice, "en-IN-Diya:DragonHDLatestNeural");
  assert.equal(voiceChoice({ TAXILA_TEACHER_VOICE: "marin" }).engine, "oai");
});

test("voice switch: styleFor maps each choice onto the existing pipeline style", () => {
  const base = { voice: "marin", instructions: "", version: "s1", spoken: { mode: "hinglish" } };
  assert.equal(styleFor(null, base), base);
  const d = styleFor(VOICE_CHOICES.diya, base, ON);
  assert.deepEqual([d.engine, d.dhd.voice, d.dhd.baseRate, d.spoken.devanagari], ["dhd", "en-IN-Diya:DragonHDLatestNeural", -35, true]);
  const p = styleFor(VOICE_CHOICES.priya, base, {});
  assert.deepEqual([p.engine, p.dhd.compiler, p.spoken.devanagari], ["dhd", "mai", undefined]);
  const m = styleFor(VOICE_CHOICES.marin, { ...base, engine: "dhd", dhd: { voice: "x", baseRate: 0 } }, ON);
  assert.equal(m.engine, undefined);
  assert.equal(m.voice, "marin");
  assert.equal(m.spoken.devanagari, true);
  assert.equal(styleFor(VOICE_CHOICES.marin, base, {}).spoken.devanagari, undefined);
  assert.notEqual(d.version, base.version);
});

test("voice switch: documents per engine, the step applied only where the row says so and the flag is on", () => {
  const w = "Sochiye, teen aur paanch kitne hue?";
  const sp = { mode: "hinglish", ageBand: "10-15" };
  const d = documentFor(VOICE_CHOICES.diya, w, sp, { env: ON });
  assert.match(d.ssml, /<prosody rate="-35%"><lang xml:lang="hi-IN">सोचिए, तीन और पाँच कितने हुए<\/lang>\?<\/prosody>/);
  const dOff = documentFor(VOICE_CHOICES.diya, w, sp, { env: {} });
  assert.match(dOff.ssml, /Sochiye, teen aur paanch kitne hue\?/);
  const p = documentFor(VOICE_CHOICES.priya, w, sp, { env: ON });
  assert.match(p.ssml, /xml:lang="hi-IN"><voice name="hi-IN-Priya:MAI-Voice-2.1">/);
  assert.doesNotMatch(p.ssml, /prosody/);
  const m = documentFor(VOICE_CHOICES.marin, w, sp, { env: ON });
  assert.deepEqual(m, { engine: "oai", input: "सोचिए, तीन और पाँच कितने हुए?", voice: "marin" });
  assert.deepEqual(documentFor(VOICE_CHOICES.marin, w, sp, { env: {} }), { engine: "oai", input: w, voice: "marin" });
  assert.equal(spokenFor(VOICE_CHOICES.diya, sp, {}), sp);
  assert.equal(spokenText(VOICE_CHOICES.diya, "Childline 1098 pe call kariye.", sp, { env: ON }), "Childline one zero nine eight pe call kariye.");
});

// review rs7 (2026-10-05): two defects found adversarially, pinned here.
test("'ek saath' / 'do saath' is 'together' (साथ), never 'one sixty'; scale-word context still makes साठ", () => {
  assert.equal(T("Chalo sab ek saath bolte hain."), "चलो सब एक साथ बोलते हैं.");
  assert.equal(T("Ek saath do kaam mat karo."), "एक साथ दो काम मत करो.");
  assert.equal(T("Bees log ek saath aaye."), "बीस लोग एक साथ आए.");
  assert.equal(T("Teen sau saath din hote hain?"), "तीन सौ साठ दिन होते हैं?");
});

test("identity sentences the shared IDENTITY regex misses stay byte-identical; the rest of the reply still converts", () => {
  assert.equal(T("Main Asha, tumhari AI teacher hoon. Teen sau saath din."), "Main Asha, tumhari AI teacher hoon. तीन सौ साठ दिन.");
  for (const s of ["Nahi, main AI teacher hoon.", "Main robot nahi, par insaan bhi nahi hoon."]) assert.equal(T(s), s);
  assert.equal(T("Kya tum real ho? Nahi, main AI teacher hoon."), "क्या तुम real हो? Nahi, main AI teacher hoon.");
});
