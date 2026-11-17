// dc-r8-director25 L2 (Brain 039 Part B, predicates): each predicate that gates L2 is run over the director25 rows the judges named
// (the run is filed under tests/fixtures/eval-results/) and must read non-zero on every one of them, before it is trusted to read 0
// on the dry matrix. `returnAlone` read 0 on nine rows where four judges heard the return question said with a verdict: its old
// definition let a verdict come first. Written before the predicates were changed; the old `returnAlone` fails it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lessonFlags, PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const RUN = "2026-11-16-director25";
const DIR = new URL(`./fixtures/eval-results/hybrid-side-by-side/results/${RUN}/`, import.meta.url);
const TOPIC = { c4: "c4-ch05-t01", c5t01: "c5-ch02-t01", c5t02: "c5-ch02-t02", c6: "c6-ch06-t01" };
const lessonOf = (key) => {
  const [t, scen] = key.split("/");
  const j = JSON.parse(readFileSync(new URL(`${scen}-${TOPIC[t]}.json`, DIR), "utf8"));
  const script = JSON.parse(readFileSync(new URL(`scripts/${j.topicId}.json`, DIR), "utf8"));
  return { rows: j.director, script };
};
const cache = new Map();
const flagsOf = (key) => { if (!cache.has(key)) cache.set(key, lessonFlags(lessonOf(key))); return cache.get(key); };
/** The named rows the predicate does not flag (empty when it sees every one). */
const unseen = (predicate, rows) => Object.entries(rows).flatMap(([key, ns]) => ns.filter((n) => !flagsOf(key).some((f) => f.predicate === predicate && f.row === n)).map((n) => `${key} ${n}`));

test("returnAlone reads the nine rows where the return question was said with a verdict or a key", () => {
  assert.deepEqual(unseen("returnAlone", { "c4/steady": [38], "c4/offtopic": [42], "c4/steering": [32], "c5t01/steady": [46], "c5t01/steering": [30],
    "c5t02/steady": [38], "c5t02/offtopic": [12], "c5t02/steering": [34], "c6/steady": [46] }), []);
});

test("wrapTwoTurns reads the four one-turn wraps", () => {
  assert.deepEqual(unseen("wrapTwoTurns", { "c4/steady": [132], "c5t01/steady": [136], "c5t02/steady": [120], "c6/steady": [128] }), []);
});

test("endsOnQuestion reads the turns that left the child nothing to answer while the lesson went on", () => {
  assert.deepEqual(unseen("endsOnQuestion", { "c4/steady": [70, 76, 96, 104], "c4/offtopic": [78], "c5t02/steady": [20, 58], "c5t02/offtopic": [68], "c5t02/steering": [66],
    "c6/steady": [52, 92] }), []);
});

// (dc-r8-l2-break-at-75, main 2026-11-17: the break moved from 45 to 75 words on the dry measurement; the rows are the turns the director25
// judges named as monologue, 79 to 105 words, each holding two parts)
test("longTwoPart reads the turns over 75 words that hold a verdict and a point, or a bridge and a point", () => {
  assert.deepEqual(unseen("longTwoPart", { "c4/steady": [66, 118], "c4/offtopic": [78], "c4/steering": [66], "c5t01/steady": [88], "c5t02/steady": [20], "c6/offtopic": [42] }), []);
  // (a turn of 46 to 75 words is not flagged: c4 steady 70, 61 words, was tutoring to the judge who read it)
  assert.ok(!flagsOf("c4/steady").some((f) => f.predicate === "longTwoPart" && f.row === 70));
});

test("rewriteSentence reads the fixed 'heard' line said on a guard's rewrite path", () => {
  assert.deepEqual(unseen("rewriteSentence", { "c5t01/steady": [110], "c5t01/stuck": [62], "c5t02/offtopic": [42] }), []);
});

test("greetAuthored reads the greeting that said the model's words about the world", () => {
  assert.deepEqual(unseen("greetAuthored", { "c6/offtopic": [0] }), []);
});

test("every L2 predicate is gated: in PREDICATES and not pending (check-run fails on any of its flags)", () => {
  for (const p of ["returnAlone", "wrapTwoTurns", "endsOnQuestion", "longTwoPart", "rewriteSentence", "greetAuthored"]) {
    assert.equal(typeof PREDICATES[p], "function", p);
    assert.ok(!PENDING.has(p), `${p} is pending`);
  }
});
