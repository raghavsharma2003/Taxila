// Main on director21 (item 2): the bugs, each with a check that fails on director21's rows or code before its fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRun } from "../evals/hybrid-side-by-side/check-run.mjs";
import { GAVE_FORMS } from "../server/brain/say.js";
import { joinable } from "../server/director/script.js";

const RUN = new URL("./fixtures/eval-results/director21", import.meta.url).pathname;
const FLAGS = checkRun(RUN);
const rowsOf = (p) => FLAGS.filter((x) => x.predicate === p).map((x) => `${x.lesson} ${x.row}`);

test("R2: her aside reply is said once — the re-renders on c4 offtopic 38, c5-t02 stuck 46, 48 are flagged", () => {
  for (const r of ["offtopic-c4-ch05-t01 38", "stuck-c5-ch02-t02 46", "stuck-c5-ch02-t02 48"]) assert.ok(rowsOf("asideReplyOnce").includes(r), r);
  // (the reply on the turn after her return question is the reply itself)
  assert.ok(!rowsOf("asideReplyOnce").includes("offtopic-c4-ch05-t01 36"));
});

test("J1: a card back from earlier with code's frame, never the script's backTo, is flagged", () => {
  assert.ok(rowsOf("backToJoint").includes("steering-c5-ch02-t01 22"));
});

test("the screen's buttons are never named aloud (c4 steering 66, c5-t02 offtopic 72)", () => {
  for (const r of ["steering-c4-ch05-t01 66", "offtopic-c5-ch02-t02 72"]) assert.ok(rowsOf("uiWords").includes(r), r);
});

test("a key that is itself a verdict word takes the frame without 'sahi' (c5-t01 steady: 'sahi jawab: sahi nahi')", () => {
  for (const f of GAVE_FORMS.hinglish.yesNo) {
    const t = f("sahi nahi", ", kyunki wahi poora 11 mein bata");
    assert.ok(!/sahi jawab: sahi nahi/i.test(t), t);
  }
  assert.match(GAVE_FORMS.hinglish.yesNo[0]("Gopi ke paas", ""), /sahi jawab: Gopi/);
});

test("a name keeps its capital after 'kyunki' (c5-t02: 'kyunki farhan ka bar')", () => {
  assert.equal(joinable("Farhan ka bar 7 hisson mein kata hai", { lower: true }), "Farhan ka bar 7 hisson mein kata hai");
  assert.equal(joinable("Dono patti barabar lambi hain", { lower: true }), "dono patti barabar lambi hain");
});
