// dc-r8-director25 (docs/patches/to-brain/039, Part A, "Predicates"): each help predicate is run over the director25 rows the judges named
// for it and must read non-zero there before it is trusted to read 0 on the dry matrix. director25's own check read 0 on every one of
// these rows (helpRepeats and hindiNewWords looked at her last two turns; partOnce let any request excuse a point said again; the rest
// did not exist). The rows are the run's recorded rows, under tests/fixtures/eval-results; a row number is its 0-based index in
// `director`, as the judges count.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-16-director25");
const FILE = { c4: "c4-ch05-t01", "c5-t01": "c5-ch02-t01", "c5-t02": "c5-ch02-t02", c6: "c6-ch06-t01" };
const lessonOf = (topic, child) => {
  const j = JSON.parse(readFileSync(join(RUN, `${child}-${FILE[topic]}.json`), "utf8"));
  const snap = join(RUN, "scripts", `${j.topicId}.json`);
  const script = JSON.parse(readFileSync(existsSync(snap) ? snap : join(ROOT, "data/lesson-scripts", `${j.topicId}.json`), "utf8"));
  return { rows: j.director, script };
};
const cache = new Map();
const flagsOf = (topic, child) => { const k = `${topic}|${child}`; if (!cache.has(k)) cache.set(k, lessonFlags(lessonOf(topic, child))); return cache.get(k); };
/** Every named row must carry a flag of the predicate. */
function readsOn(predicate, rows) {
  assert.ok(PREDICATES[predicate], `${predicate} exists`);
  assert.ok(!PENDING.has(predicate), `${predicate} is gated`);
  const missed = rows.filter(([topic, child, row]) => !flagsOf(topic, child).some((f) => f.predicate === predicate && f.row === row));
  assert.deepEqual(missed.map((x) => x.join(" ")), [], `${predicate} reads 0 on rows it is written for`);
}

test("helpRepeats: help that says a sentence from the said set (the point said again as help)", () => {
  readsOn("helpRepeats", [["c5-t02", "steady", 52], ["c5-t02", "offtopic", 60], ["c5-t02", "steering", 32], ["c5-t02", "stuck", 10],
    ["c4", "stuck", 10], ["c4", "offtopic", 32], ["c6", "stuck", 30]]);
});
test("hindiNewWords: a Hindi request answered with words she has said in the lesson", () => {
  readsOn("hindiNewWords", [["c5-t02", "stuck", 10], ["c4", "stuck", 10], ["c4", "offtopic", 32]]);
});
test("partOnce: a point said again as help (clause 5: c5-t02's four)", () => {
  readsOn("partOnce", [["c5-t02", "steady", 52], ["c5-t02", "offtopic", 60], ["c5-t02", "steering", 32], ["c5-t02", "stuck", 10]]);
});
test("helpLadder: help for another part, or a rung skipped while an earlier one is unsaid", () => {
  // (c5-t01 stuck 8: the point's simpler on a card whose ask.simpler is unsaid; stuck 32, steering 8: a remediation's simpler with its
  // sayAlt unsaid; c4 stuck 30: e2's simpler at the then-card's key; c4 offtopic 46: the card's hint at the point's check-in)
  readsOn("helpLadder", [["c5-t01", "stuck", 8], ["c5-t01", "stuck", 32], ["c5-t01", "steering", 8], ["c4", "stuck", 30], ["c4", "offtopic", 46]]);
});
test("helpBoard: a help wording said over a board that is not its part's", () => {
  readsOn("helpBoard", [["c4", "steady", 124], ["c4", "stuck", 30]]);
});
test("keyAnswerBoard: a key said over the posing board, not the answer board", () => {
  // (the work order's "c5-t02 steady 12" holds no key — it poses the then-card; the key over the posing board in that topic is stuck 12,
  // "Is sawaal ka sahi jawab: neeche wali patti ka hissa chhota …", which the c5-t02 judge's row means)
  // (c6 offtopic 34, named in the work order beside c5-t01's, is not this fault: c6's worked board is its own step's answer board — the
  // same figure, traced — so that key was said over its answer board; the c6 judge counted the Hindi request given the key, hindiNoKey)
  readsOn("keyAnswerBoard", [["c4", "stuck", 12], ["c5-t01", "offtopic", 34], ["c5-t02", "stuck", 12]]);
  assert.ok(!flagsOf("c5-t02", "steady").some((f) => f.predicate === "keyAnswerBoard" && f.row === 12), "steady 12 says no key");
  assert.ok(!flagsOf("c6", "offtopic").some((f) => f.predicate === "keyAnswerBoard" && f.row === 34), "c6 offtopic 34: its answer board was up");
});
test("hindiNoKey: a Hindi request given the key", () => {
  readsOn("hindiNoKey", [["c5-t01", "offtopic", 34], ["c6", "offtopic", 34]]);
});
test("giveUpAnswered: nothing said to a give-up after a key", () => {
  readsOn("giveUpAnswered", [["c5-t01", "stuck", 80], ["c5-t01", "offtopic", 62], ["c5-t01", "steering", 20], ["c5-t02", "steering", 64], ["c6", "steering", 20], ["c4", "stuck", 14]]);
});
test("giveUpVerdict: a give-up given a verdict word (c4 offtopic 24, \"Haan, kyunki\")", () => {
  readsOn("giveUpVerdict", [["c4", "offtopic", 24]]);
});
test("keyEarly: a card's key given to a give-up or a wrong answer while its ladder has a rung unsaid (items 4 and 7: no count decides)", () => {
  // (director25's rows where a count of requests or misses gave the key: stuck c5-t02 12 is the work order's key-not-over-the-answer-board
  // row, given the key with e1's pointAlt unsaid; the others are the second-request rule's and the second miss's keys)
  readsOn("keyEarly", [["c5-t02", "stuck", 12], ["c5-t02", "offtopic", 24], ["c4", "stuck", 36], ["c4", "offtopic", 30], ["c6", "steering", 16], ["c5-t01", "steering", 16]]);
});
