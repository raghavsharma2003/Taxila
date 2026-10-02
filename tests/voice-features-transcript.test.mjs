// Transcript-side voice features: Hinglish fillers, repetitions vs grammatical reduplication,
// self-corrections, and WCPM token alignment.
import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenize, transcriptStats, alignReading, readingFluency, readingForm, wordsMatch } from "../src/voice/transcript.ts";

test("tokenize: lowercase, punctuation flags, cut-off fragments, Devanagari kept", () => {
  const t = tokenize("Umm, th- three… मतलब तीन!");
  assert.deepEqual(t.map((x) => x.w), ["umm", "th", "three", "मतलब", "तीन"]);
  assert.deepEqual(t.map((x) => x.punctAfter), [true, true, true, false, true]);
  assert.equal(t[1].fragment, true);
});

test("pure fillers always count, elongations included", () => {
  const s = transcriptStats("ummm hmm the answer is uhh five");
  assert.equal(s.fillerCount, 3);
  assert.equal(s.words, 4);
  assert.equal(s.disfluencyPer100Words, 75);
});

test("discourse fillers count only where they behave like fillers", () => {
  assert.equal(transcriptStats("haan").fillerCount, 0, "a bare haan is an answer");
  assert.equal(transcriptStats("haan, paanch").fillerCount, 1, "haan before a pause, then the answer");
  assert.equal(transcriptStats("woh wala bada hai").fillerCount, 0, "woh as 'that' is content");
  assert.equal(transcriptStats("umm woh matlab paanch").fillerCount, 3, "a filler run counts every member");
  assert.equal(transcriptStats("iska matlab kya hai").fillerCount, 0, "matlab as 'meaning' is content");
  assert.equal(transcriptStats("उम्म वो तीन").fillerCount, 2, "Devanagari fillers");
});

test("repetitions count; Hindi reduplication and number lists do not", () => {
  assert.equal(transcriptStats("the the answer is five").repetitionCount, 1);
  assert.equal(transcriptStats("jaldi jaldi karo").repetitionCount, 0);
  assert.equal(transcriptStats("kya kya laaye").repetitionCount, 0);
  assert.equal(transcriptStats("is the is the answer").repetitionCount, 1, "two-word repetition");
  assert.equal(transcriptStats("th- three").repetitionCount, 1, "part-word repetition");
  assert.equal(transcriptStats("2 2 4").repetitionCount, 0);
});

test("self-corrections: retractions, correction phrases, cut-off then a different word", () => {
  assert.equal(transcriptStats("five, nahi, six").selfCorrectionCount, 1);
  assert.equal(transcriptStats("seven nahi nahi eight").selfCorrectionCount, 1);
  assert.equal(transcriptStats("it is red i mean blue").selfCorrectionCount, 1);
  assert.equal(transcriptStats("thr- four").selfCorrectionCount, 1);
  assert.equal(transcriptStats("nahi").selfCorrectionCount, 0, "a bare 'no' is an answer");
  assert.equal(transcriptStats("nahi, mujhe nahi pata").selfCorrectionCount, 0, "utterance-initial no is not a retraction");
  assert.equal(transcriptStats("seven nahi nahi eight").repetitionCount, 0, "a correction is not also a repetition");
});

test("empty transcript", () => {
  assert.deepEqual(transcriptStats(""), { words: 0, fillerCount: 0, repetitionCount: 0, selfCorrectionCount: 0, disfluencyPer100Words: 0 });
});

test("reading forms: number words and Devanagari digits unify", () => {
  assert.equal(readingForm("teen"), "3");
  assert.equal(readingForm("three"), "3");
  assert.equal(readingForm("३"), "3");
  assert.equal(readingForm("तीन"), "3");
  assert.ok(wordsMatch("nahin", "nahi"));
  assert.ok(!wordsMatch("aam", "am"), "short words must match exactly");
});

test("WCPM alignment: substitution, omission, insertion", () => {
  const T = "the cat sat on the mat";
  assert.deepEqual(
    { c: alignReading(T, "the cat sat on the mat").wordsCorrect, a: alignReading(T, "the cat sat on the mat").attempted }, { c: 6, a: 6 });
  assert.equal(alignReading(T, "the cat sit on the mat").wordsCorrect, 5, "substitution");
  assert.equal(alignReading(T, "the cat on the mat").wordsCorrect, 5, "omission");
  assert.equal(alignReading(T, "the umm big cat sat on the the mat").wordsCorrect, 6, "insertions and fillers are free");
  const early = alignReading(T, "the cat sat");
  assert.equal(early.wordsCorrect, 3);
  assert.equal(early.attempted, 3, "stopping early is not charged for unread words");
  assert.equal(alignReading(T, "").wordsCorrect, 0);
});

test("WCPM: a self-corrected word counts as correct; Hinglish + digits", () => {
  const T = "Meena ke paas 3 seb hain";
  const a = alignReading(T, "Meena ke paas do, nahi, teen seb hain");
  assert.equal(a.wordsCorrect, 6);
  const rf = readingFluency(T, "Meena ke paas teen seb hain", 3000);
  assert.equal(rf.wcpm, 120);
  assert.equal(rf.readAccuracy, 1);
  assert.equal(readingFluency(T, "Meena", 600).wcpm, undefined, "under a second is not a reading");
});
