// safety-robust (2026-10-05) seams outside server/director/safety.js. The code changes live as patches under
// evals/safety-robust/patches/ (Wave 2 owns classify.js, server/brain/** and server/duplex/**); each test here SKIPS until
// its patch is applied, then pins the behaviour:
//   01 classify: the model distress read runs on every committed child turn with words; an unreadable (other-script) turn
//      is no evidence (ask again) with the model read on the readable rest;
//   03 duplex: DuplexSlice.modelNote routes the Director's model distress read into PartialSafety (sticky, cancels drafts).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as classifyMod from "../server/director/classify.js";
import { DuplexSlice } from "../server/duplex/slice.js";

const P01 = typeof classifyMod.needsModelDistressRead === "function";
const P03 = typeof DuplexSlice.prototype.modelNote === "function";
const flags = (o = {}) => ({ dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false, ...o });

test("patch 01: the model distress read runs on bytes-decided turns that carry words", { skip: !P01 && "patch 01 not applied" }, () => {
  const r = (source, f = {}) => ({ outcome: "no_evidence", confidence: 1, source, flags: flags(f) });
  assert.equal(classifyMod.needsModelDistressRead(r("lexical"), "pata nahi"), false);            // the decision is the whole turn
  assert.equal(classifyMod.needsModelDistressRead(r("lexical"), "pata nahi, main mr jaungi"), true);
  assert.equal(classifyMod.needsModelDistressRead(r("exact"), "5"), false);
  assert.equal(classifyMod.needsModelDistressRead(r("module"), "papa maarte hain"), true);         // words rode on an activity answer
  assert.equal(classifyMod.needsModelDistressRead(r("chip"), "Choices dikhao"), false);             // a client action
  assert.equal(classifyMod.needsModelDistressRead(r("predicate", { distress: true }), "mujhe marna hai"), false); // already distress
});

test("patch 01: an unreadable spoken turn is never content (ask again); a typed one is read as typed", { skip: !P01 && "patch 01 not applied" }, () => {
  const target = { mode: "none", misconceptions: [] };
  const spoken = classifyMod.classifyFast({ target, childText: "बासठ そうです先生。", asrConfidence: 0.9, typed: false });
  assert.equal(spoken.result, null);
  assert.equal(spoken.lowAsr, true);
  assert.equal(spoken.unreadable, true);
  const typed = classifyMod.classifyFast({ target, childText: "बासठ そうです先生。", typed: true });
  assert.notEqual(typed.unreadable, true);
  // the predicate still decides first on a disclosure next to a hallucination
  const d = classifyMod.classifyFast({ target, childText: "పథే పापा मुझे मारते हैं", asrConfidence: 0.9, typed: false });
  assert.equal(d.result?.source, "predicate");
});

test("patch 03: a model distress note trips the slice's sticky safety and cancels speculation", { skip: !P03 && "patch 03 not applied" }, () => {
  const sl = new DuplexSlice({ lessonId: "L" });
  sl.handover({ t: 0 });
  sl.partial({ type: "final", itemId: "i1", text: "bas yahi", t: 100 });
  assert.equal(sl.turnSummary().safetyPending, null);
  const s = sl.modelNote("self_harm", 200);
  assert.equal(s.tripped, true);
  assert.deepEqual(sl.turnSummary().safetyPending, { kind: "self_harm", source: "model_note" });
  assert.equal(sl.modelNote("abuse", 300).tripped, false);  // sticky: the first read stands
});
