// HUMAN-VOICE B2 / B0: the content law (HV-2), the compiled-SSML leak lint (HV-1), the prompt lint, and the owner's
// rule that no digit and no "..." reach the voice (voice-clips-off-and-numbers-normalised).
import test from "node:test";
import assert from "node:assert/strict";
import { align, preserved, clausesOf, withoutFiller } from "../server/voice/expressive/align.js";
import { lintSsml, lintPromptText, leakWords } from "../server/voice/expressive/lint.js";
import { renderParts } from "../server/voice/expressive/render.js";
import { createGovernor } from "../server/voice/expressive/governor.js";
import { compileOmni } from "../server/voice/expressive/compile/omni.js";
import { compileMai } from "../server/voice/expressive/compile/mai.js";
import { compileOai } from "../server/voice/expressive/compile/oai-tts.js";
import { plainSsml } from "../server/voice/expressive/compile/dhd.js";
import { splitSentences } from "../server/voice/sentences.js";
import { speakable } from "../server/voice/spoken.js";
import { kitLines, momentsFor, REPLY_SHAPES } from "../evals/voice-expressive-corpus.mjs";
import { CHARACTERS } from "../server/compiler/characters/index.js";
import { buildLanes } from "../evals/persona-invariants.data.mjs";

const all = kitLines();
const step = Math.max(1, Math.floor(all.length / 2000));
const CORPUS = [...REPLY_SHAPES, ...all.filter((_, i) => i % step === 0).slice(0, 2000)];
const VOICES = [
  { engine: "dhd", dhd: { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 } },
  { engine: "dhd", dhd: { voice: "en-IN-Arjun:DragonHDLatestNeural", baseRate: -35 } },
  { engine: "dhd", dhd: { voice: "en-IN-Meera:DragonHDLatestNeural", baseRate: -35 } },
];

test("HV-2: aligner output minus fillers is byte-equal to the reply (modulo whitespace) on 2,000+ kit lines × every row", () => {
  let planned = 0, refused = 0;
  CORPUS.forEach((reply, i) => {
    const plan = align(reply, momentsFor(i));
    if (!plan) { refused++; return; }
    planned++;
    assert.ok(preserved(plan, reply), reply);
    // at most one inserted word, only at the start of clause 0
    plan.clauses.forEach((c, j) => { if (j > 0) assert.equal(c.filler, undefined); });
  });
  assert.ok(CORPUS.length >= 2000);
  assert.equal(refused, 0, `${refused} plans refused`);
  assert.equal(planned, CORPUS.length);
});

test("clauses never cut a TTS part, keep numbers whole, and rejoin to the part", () => {
  for (const reply of CORPUS.slice(0, 600)) {
    for (const part of splitSentences(reply)) {
      const cs = clausesOf(part);
      assert.equal(cs.join(" ").replace(/\s+/g, " "), part.replace(/\s+/g, " "));
      for (const num of part.match(/\d{1,3}(?:,\d{2,3})+/g) ?? []) assert.ok(cs.some((c) => c.includes(num)), `${num} cut in ${JSON.stringify(cs)}`);
    }
  }
  assert.deepEqual(clausesOf("Pehle 1,50,000 padho, phir 3.5 dekho."), ["Pehle 1,50,000 padho,", "phir 3.5 dekho."]);
  assert.deepEqual(clausesOf("Rs. 250 mein, Dr. Rao ne liya."), ["Rs. 250 mein,", "Dr. Rao ne liya."]);
});

test("fillers: never on a praise or correction opening, never doubled on a discourse opening, never on a negative verdict", () => {
  const m = (o) => ({ ...momentsFor(2), move: "explain", verdict: "ungraded", safety: false, teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 1 }, engagement: "engaged", ...o });
  assert.ok(align("Ek pizza ko 4 barabar hisson mein kaatte hain.", m()).clauses[0].filler);
  assert.equal(align("Shabash! Ek pizza ko 4 hisson mein kaatte hain.", m()).clauses[0].filler, undefined);
  assert.equal(align("Nahi, ek baar phir dekho.", m()).clauses[0].filler, undefined);
  assert.equal(align("Achha, ek pizza ko 4 hisson mein kaatte hain.", m()).clauses[0].filler, undefined);
  assert.equal(align("Ek pizza ko 4 hisson mein kaatte hain.", m({ verdict: "not_yet" })).clauses[0].filler, undefined);
  const en = align("Let's cut one pizza into 4 equal parts.", m({ lang: "en" }));
  assert.ok(["so", "okay"].includes(en.clauses[0].filler));
  assert.equal(withoutFiller(en.clauses[0]), "Let's cut one pizza into 4 equal parts.");
});

test("uptake prelude: a leading echo of the child's token is stripped from clause 0 and the content law still holds", () => {
  const m = { ...momentsFor(0), safety: false, move: "probe", verdict: "ungraded", teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 1 }, uptakePrelude: { text: "62" } };
  const reply = "62! Achha, ab batao tumne kaise socha?";
  const plan = align(reply, m);
  assert.deepEqual(plan.prelude, { text: "62" });
  assert.equal(plan.clauses[0].stripped, "62! ");
  assert.ok(!plan.clauses[0].text.startsWith("62"));
  const inline = align("62 bilkul, ab batao tumne kaise socha?", m);
  assert.equal(inline.clauses[0].stripped, "62 ");
  assert.ok(preserved(inline, "62 bilkul, ab batao tumne kaise socha?"));
  assert.ok(preserved(plan, reply));
  assert.equal(align("Achha, ab batao?", m).clauses[0].stripped, undefined, "no echo, nothing stripped");
});

test("HV-1: 2,000+ replies × 3 voices compile with 0 paralinguistic tags, only proven-silent markers, 0 digits, 0 '...'", () => {
  const gov = createGovernor({ now: () => 0 });
  const problems = {};
  let docs = 0;
  CORPUS.forEach((reply, i) => {
    const plan = align(reply, momentsFor(i));
    const v = VOICES[i % 3];
    const style = { ...v, voice: "marin", instructions: "", version: "t", spoken: { mode: momentsFor(i).lang === "en" ? "english" : momentsFor(i).lang === "hi" ? "hindi" : "hinglish" } };
    const r = renderParts({ lessonId: `L${i % 50}`, text: reply, style, delivery: plan, gov, log: false });
    for (const p of r.parts) {
      docs++;
      for (const b of lintSsml(p.render.ssml, "dhd")) (problems[b] ??= []).push(reply);
    }
  });
  assert.ok(docs >= 2000);
  assert.deepEqual(Object.keys(problems), [], JSON.stringify(Object.fromEntries(Object.entries(problems).map(([k, v]) => [k, v.slice(0, 3)]))));
});

test("the other compilers: omni writes native tags only where licensed; mai never a tag or bracket; oai never alters the text", () => {
  const plan = align("Haha, cold drink? Phir toh paudhe burp karte! Nahi, paudhe paani peete hain.", { ...momentsFor(0), safety: false, move: "explain", verdict: "ungraded",
    childLaughed: true, band: "B2", teacherAffect: { display: "playful", intensity: 1, cause: "child_joke", turn: 3 }, engagement: "engaged" });
  assert.equal(plan.row, "laughter");
  const omni = compileOmni(plan.clauses, { voice: "hi-IN-Diya:DragonHDOmniLatestNeural" });
  assert.match(omni, /\[laughter\]/);
  assert.deepEqual(lintSsml(omni, "omni"), []);
  const mai = compileMai(plan.clauses, { voice: "hi-IN-Priya", styles: ["cheerful", "calm"] });
  assert.ok(!/\[/.test(mai));
  assert.deepEqual(lintSsml(mai, "mai"), []);
  const o = compileOai(plan.clauses, "accent: Indian");
  assert.equal(o.text, plan.clauses.map(withoutFiller).join(" "));
  assert.match(o.instructions, /^accent: Indian\nFeeling: \w+, (low|medium|high)\. Pace: \w+\.$/);
  assert.deepEqual(lintPromptText(o.instructions), []);
});

test("lint catches what it must (negative controls)", () => {
  assert.ok(lintSsml("<speak>[laughter] haan</speak>", "dhd").includes("paralinguistic_tag"));
  assert.ok(lintSsml("<speak>[whispering] haan</speak>", "dhd").includes("unknown_marker:whispering"));
  assert.ok(lintSsml("<speak>27 aur 35</speak>", "dhd").includes("digits"));
  assert.ok(lintSsml("<speak>socho... phir</speak>", "dhd").includes("ellipsis"));
  assert.deepEqual(lintSsml(plainSsml("27 aur 35... jodo", { voice: "v", baseRate: -35 }, { mode: "hinglish" }), "dhd"), []);
  assert.ok(lintPromptText("Say [laughs] when the child jokes").length);
  assert.ok(lintPromptText("Use a <break time='300ms'/> before the answer").includes("markup_word"));
  assert.deepEqual(leakWords("तो लाफ्टर पहले tens जोड़ते हैं", "तो पहले tens जोड़ते हैं"), ["लाफ्टर"]);
  assert.deepEqual(leakWords("calm down, okay", "calm down, okay"), [], "a word in the source is not a leak");
  assert.deepEqual(leakWords("reflective twenty seven", "twenty seven"), ["reflective"]);
});

test("HV-1 (prompt half): no delivery tag, sound word or markup word in ANY compiled reply prompt, every character × lane", () => {
  let n = 0;
  for (const c of Object.values(CHARACTERS)) for (const lane of buildLanes(c)) {
    assert.deepEqual(lintPromptText(lane.text), [], lane.id);
    n++;
  }
  assert.ok(n > 50, `${n} lanes`);
});

test("speakable: no digit and no '...' ever reach the voice, on 2,000+ kit lines in every cell", () => {
  const cells = [{ mode: "hinglish" }, { mode: "hindi", schoolMedium: "hindi" }, { mode: "english" }, { mode: "hinglish", schoolMedium: "hindi" }];
  const bad = [];
  CORPUS.forEach((line, i) => {
    const s = speakable(line, cells[i % cells.length]);
    if (/[0-9०-९]/.test(s) || /\.\.\.|…/.test(s)) bad.push([line, s]);
  });
  assert.deepEqual(bad.slice(0, 5), []);
});
