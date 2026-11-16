// dc-r8-director23 R2, the reader's record: the row's column is what the walk acted on, written after every re-read; a line after the
// closing key's check-in is never graded; readerAgrees matches intent and column by name, with no equivalence table.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readByAsked } from "../server/brain/turn.js";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const kit = { topicId: "t", items: [] };

test("a line after the closing key's check-in is never graded (c5-t02 steady 141 read 'incorrect')", () => {
  const st = { phase: "teachback", teachbackScript: true, teachbackKeyed: true, ctx: {} };
  const c = readByAsked(st, { outcome: "incorrect", confidence: 0.8, flags: {}, misconceptionId: "m1" }, "pehle wale step se pata chala", kit);
  assert.equal(c.outcome, "no_evidence");
  assert.equal(c.misconceptionId, undefined);
  // (a stop is still a stop)
  assert.equal(readByAsked(st, { outcome: "no_evidence", flags: {}, request: { type: "stop" } }, "bye", kit).request?.type, "stop");
});

test("readerAgrees: intent and column match by name; only the listed pairs pass, each with its reason", () => {
  assert.ok(!PENDING.has("readerAgrees"));
  const row = (column) => ({ who: "teacher", text: "x", cell: column ? { column } : undefined });
  const ctx = (intent) => ({ prevIntent: intent, prevChild: "line" });
  assert.equal(PREDICATES.readerAgrees("L", row("give_up"), 1, ctx("give_up")), null);
  assert.equal(PREDICATES.readerAgrees("L", row("wrong"), 1, ctx("miss")), null);
  assert.equal(PREDICATES.readerAgrees("L", row(null), 1, ctx("yes")), null);
  // (director23's two patterns: a reply to her return recorded as a repeat, a give-up after a key's check-in recorded as a misconception)
  assert.match(PREDICATES.readerAgrees("L", row("repeat"), 1, ctx("aside_reply")), /meant aside_reply; the walk recorded repeat/);
  assert.match(PREDICATES.readerAgrees("L", row("misconception"), 1, ctx("give_up")), /meant give_up/);
  assert.match(PREDICATES.readerAgrees("L", row("aside"), 1, ctx("clarify")), /meant clarify/);
});

test("the column is this turn's: an answer column only on a line read as that answer (columnOfRead, gated)", () => {
  assert.ok(!PENDING.has("columnOfRead"));
  const row = { who: "teacher", text: "x", cell: { column: "misconception" } };
  assert.match(PREDICATES.columnOfRead("L", row, 1, { prevRead: "no_evidence" }), /column misconception on a line read "no_evidence"/);
  assert.equal(PREDICATES.columnOfRead("L", row, 1, { prevRead: "misconception" }), null);
  assert.equal(PREDICATES.columnOfRead("L", { ...row, cell: { column: "give_up" } }, 1, { prevRead: "no_evidence" }), null);
});
