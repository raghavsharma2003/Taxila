// ship5 fixer (2026-10-06): the safety-side regressions not covered by the review's own failing tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety } from "../server/director/safety.js";
import { withSeamUi } from "../server/brain/rows.js";

test("review note 2: sexual content sent, shown or said to the child is a disclosure by predicate; asking about it is not", () => {
  for (const t of ["ek aadmi ne mujhe sex wali photo bheji", "someone sent me nude pics", "koi mujhe phone pe gandi baatein bolta hai", "ek aadmi ne mujhe nangi photo dikhayi"]) {
    assert.deepEqual(scanSafety(t), { distress: true, kind: "abuse" }, t);
  }
  for (const t of ["sex education kya hota hai", "mujhe sex ke baare mein batao", "maine gandi baat boli sorry", "naked eye se dikhai deta hai", "nanga parbat dikhaya map mein", "the boy showed me his drawing"]) {
    assert.equal(scanSafety(t).distress, false, t);
  }
});

test("B1 (TA8 structural): a safeguarding turn's ui carries calm_steady whatever the relational directive said", () => {
  const happy = { ui: { teacherAffect: { display: "delight", intensity: 2 } } };
  assert.deepEqual(withSeamUi({ tray: "none" }, happy, { safety: true }).teacherAffect, { display: "calm_steady", intensity: 1 });
  assert.deepEqual(withSeamUi({ tray: "none" }, null, { safety: true }).teacherAffect, { display: "calm_steady", intensity: 1 });
  assert.deepEqual(withSeamUi({ tray: "none" }, happy).teacherAffect, { display: "delight", intensity: 2 });
});
