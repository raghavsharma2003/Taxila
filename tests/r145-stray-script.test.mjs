// census 14.5 (6c45a7ea t26): ONE token in another script made a whole readable spoken turn no evidence (lowAsr). A stray
// token, under a quarter of the letter tokens with 3+ readable words left, is dropped; the readable rest is the turn, and
// classify() still runs the model distress read on it (the unreadable path's backup). Mostly-foreign turns stay unreadable.
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyFast } from "../server/director/classify.js";

const NONE = { mode: "none", misconceptions: [] };
test("one stray Bengali token in a readable turn: the readable rest is classified, marked stray", () => {
  const r = classifyFast({ target: NONE, childText: "मुझे लगता है जवाब बारह होगा আমি", asrConfidence: 0.9, typed: false });
  assert.notEqual(r.lowAsr, true);
  assert.equal(r.stray, true);
  assert.doesNotMatch(r.text, /আমি/);
});
test("a mostly-foreign or a short turn stays unreadable (ask again, the model read on the rest)", () => {
  for (const t of ["बासठ そうです先生。", "আমি জানি না ঠিক", "haan আমি", "theek hai আমি"]) {
    const r = classifyFast({ target: NONE, childText: t, asrConfidence: 0.9, typed: false });
    assert.equal(r.lowAsr, true, t);
    assert.equal(r.unreadable, true, t);
  }
});
test("the predicate still reads the whole turn first: a disclosure next to a stray token is distress", () => {
  const r = classifyFast({ target: NONE, childText: "papa mujhe roz maarte hain আমি", asrConfidence: 0.9, typed: false });
  assert.equal(r.result?.source, "predicate");
  assert.equal(r.result?.flags?.distress, true);
});
test("the stray branch runs once: a re-read already marked _stray is never re-entered (main's depth guard)", () => {
  const r = classifyFast({ target: NONE, childText: "मुझे लगता है जवाब बारह होगा আমি", asrConfidence: 0.9, typed: false, _stray: true });
  assert.equal(r.lowAsr, true);
  assert.notEqual(r.stray, true);
});
