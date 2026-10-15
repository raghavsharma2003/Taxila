// round 5 (14.3, QA pass 12): the chips are the child's words, in the child's language. A Hindi or Hinglish child was offered
// "Carry on" / "Stop for today" on the check-in. The ids are unchanged (the Director reads ids), and every stop label still
// reads as a stop in the child's words (relational stopKind), so a stop typed or tapped means the same.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chipLabels, initLessonState, step } from "../server/director/state.js";
import { stopKind } from "../server/relational/signals.js";
import { kit, CTX } from "./fixtures/kit.mjs";

test("labels per language; unknown falls back to English", () => {
  assert.equal(chipLabels("english").cont, "Carry on");
  assert.equal(chipLabels("hinglish").cont, "Aage padhte hain");
  assert.match(chipLabels("hindi").stop, /आज के लिए बस/);
  assert.equal(chipLabels("tamil").stop, "Stop for today");
  for (const lang of ["english", "hinglish", "hindi"]) assert.equal(stopKind(chipLabels(lang).stop), "end_request", lang);
});

test("the carried check-in offers its chips in the child's language, same ids", () => {
  const K = kit();
  for (const [lang, cont] of [["hinglish", "Aage padhte hain"], ["hindi", "आगे पढ़ते हैं"], ["english", "Carry on"]]) {
    const r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, lang }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0, carried: { kind: "self_harm" } });
    assert.deepEqual(r.ui.chips.map((c) => c.id), ["safe:continue", "safe:stop"], lang);
    assert.equal(r.ui.chips[0].label, cont, lang);
  }
});
