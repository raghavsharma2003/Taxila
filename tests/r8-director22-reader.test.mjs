// dc-r8-director22 R: the reader is measured (the rule-based child writes what it meant; readerAgrees compares it with the walk's reading
// on every row — 37 disagreements on the dry matrix before the fix, 0 after), and what a child's line can be is decided by what she last
// asked, in one place (brain/turn.js readByAsked).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readByAsked } from "../server/brain/turn.js";
import { intentOf } from "../evals/child-sim/reactive.mjs";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const kitWith = (answer) => ({ topicId: "t", items: [{ id: "i1", answer, kind: "practice" }] });
const st = (extra = {}) => ({ activeItemId: "i1", ctx: { interests: ["cricket"] }, ...extra });

test("the child's intent is written from what it chose to say", () => {
  assert.equal(intentOf({ kind: "right", text: "3" }), "right");
  assert.equal(intentOf({ kind: "wrong", text: "4" }), "miss");
  assert.equal(intentOf({ kind: "dontknow", event: "dontknow", text: "samajh nahi aaya" }), "clarify");
  assert.equal(intentOf({ kind: "dontknow", event: "dontknow", text: "pata nahi, aap batao" }), "give_up");
  assert.equal(intentOf({ kind: "ack", text: "haan, samajh aaya" }), "yes");
  assert.equal(intentOf({ kind: "event", event: "returned", text: "bowling karna" }), "aside_reply");
  assert.equal(intentOf({ kind: "leave", text: "thak gayi, bye" }), "stop");
});

test("'haan, samajh aaya' is a yes, never a wrong answer to a card whose key is a number", () => {
  const c = readByAsked(st(), { outcome: "incorrect", confidence: 0.6, flags: {} }, "haan, samajh aaya", kitWith("3"));
  assert.equal(c.outcome, "no_evidence");
  // (a yes/no card's "haan" is still graded)
  assert.equal(readByAsked(st(), { outcome: "incorrect", confidence: 0.9, flags: {} }, "haan", kitWith("nahi")).outcome, "incorrect");
});

test("a stop in code's words is a stop whether or not the model flagged it", () => {
  assert.equal(readByAsked(st(), { outcome: "no_evidence", flags: {} }, "ab main jaati hoon, bye", kitWith("3")).flags.wantsToStop, true);
  // (an aside with no request is the walk's to read — state.js step0 — and readerAgrees reads it the same way)
  assert.equal(readByAsked(st(), { outcome: "no_evidence", flags: {} }, "kal maine cricket khela, sixer maara", kitWith("3")).request, undefined);
});

test("while the teach-back is open a line is its answer or a non-answer: no request is read from it", () => {
  const c = readByAsked(st({ phase: "teachback" }), { outcome: "no_evidence", flags: {}, request: { type: "easier" } }, "maine pehle chhota wala socha, phir bada", kitWith("3"));
  assert.equal(c.request, undefined);
});

test("readerAgrees is gated, and flags a misread on a row", () => {
  assert.ok(!PENDING.has("readerAgrees"));
  const flag = PREDICATES.readerAgrees("L", { who: "teacher", text: "Yeh jawab sahi nahi hai." }, 1, { prevIntent: "yes", prevRead: "incorrect", prevFlags: [], prevChild: "haan, samajh aaya" });
  assert.match(flag, /meant yes/);
  assert.equal(PREDICATES.readerAgrees("L", { who: "teacher", text: "Achha." }, 1, { prevIntent: "yes", prevRead: "no_evidence", prevFlags: [], prevChild: "haan" }), null);
});
