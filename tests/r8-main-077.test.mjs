// main, integration 77 (dc-r8-director24 M): the model's joins are asked for only with TAXILA_MODEL_JOINS=on. A live read of c6 × 4
// children on the merged tree found 23 of 40 drafted joins falling back and one false join said ("Ab pitch ke chaaron kinaaron ka
// kul naap nikaalo" before a triangular flower bed). Off, the seam pass says its authored forms.
import { test } from "node:test";
import assert from "node:assert/strict";
import { modelJoinsOn, joinNoteOf } from "../server/brain/say.js";
import { joinProblem } from "../server/brain/seams.js";

test("the model's joins are off unless TAXILA_MODEL_JOINS=on", () => {
  const was = process.env.TAXILA_MODEL_JOINS;
  try {
    delete process.env.TAXILA_MODEL_JOINS;
    assert.equal(modelJoinsOn(), false);
    process.env.TAXILA_MODEL_JOINS = "on";
    assert.equal(modelJoinsOn(), true);
    process.env.TAXILA_MODEL_JOINS = "off";
    assert.equal(modelJoinsOn(), false);
  } finally { if (was === undefined) delete process.env.TAXILA_MODEL_JOINS; else process.env.TAXILA_MODEL_JOINS = was; }
});

test("the join note is still built for the kinds a turn wants (the switch is at the call, not in the note)", () => {
  assert.match(joinNoteOf(["backTo"], "hinglish"), /JOIN <kind>/);
  assert.equal(joinNoteOf([], "hinglish"), null);
});

test("the false join of the live read passes today's check: the check is what to tighten (to-brain 038)", { todo: "joinProblem: a number word, an order to the child, a word of her aside" }, () => {
  assert.ok(joinProblem("Ab pitch ke chaaron kinaaron ka kul naap nikaalo"), "a join that tells the child what to work out is refused");
});
