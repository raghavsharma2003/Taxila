// Round 4 · stream 2 (content): "half ka half" (the owner's review 2026-10-10: a class 7 child asked "animation dikha sakte
// ho, half ka half kaise hota hai" and got a still 3/5 roti). fraction-of@1 draws a/b OF c/d as an area model while she
// speaks; codePick reads it from numerals or words; the board passes the full gate against her line and the tray gate at
// the 360 phone. No browser, no model.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { expand } from "../server/forge/explainer/templates.js";
import { codePick, fractionOfIn } from "../server/forge/explainer/pick.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";
import { certifyForTray } from "../server/forge3/tray-gate.js";
import { claimsNotDrawn, fractionsDisagree } from "../server/studio/qa/semantics.js";

describe("r4 content: fraction-of@1 (half ka half)", () => {
  it("reads a fraction of a fraction from numerals and from words, never from one fraction", () => {
    assert.deepEqual(fractionOfIn("Find 3/5 of 2/3 of the field"), { a: 3, b: 5, c: 2, d: 3 });
    assert.deepEqual(fractionOfIn("1/2 × 1/4 kitna hoga?"), { a: 1, b: 2, c: 1, d: 4 });
    assert.deepEqual(fractionOfIn("half ka half kaise hota hai"), { a: 1, b: 2, c: 1, d: 2 });
    assert.deepEqual(fractionOfIn("what is half of a quarter"), { a: 1, b: 2, c: 1, d: 4 });
    assert.equal(fractionOfIn("3/5 of the class"), null);
    assert.equal(fractionOfIn("7/9 of 2/3"), null, "denominators past 6 are not drawn as cells");
    const kit = { topicId: "c7-maths-ch02-t02", items: [], workedExample: { problem: "Find 1/2 of 3/4." } };
    assert.deepEqual(codePick({ kit }), { template: "fraction-of@1", a: 1, b: 2, c: 3, d: 4 });
  });
  it("draws the whole, the inner fraction, the outer fraction inside it, then the product, in that order", () => {
    const r = expand({ template: "fraction-of@1", a: 3, b: 5, c: 2, d: 3 });
    assert.ok(r.ok, r.errors.join(","));
    const ops = r.script.ops;
    const at = (id) => ops.find((o) => o.id === id).startMs;
    assert.ok(at("whole") < at("c0") && at("c1") < at("inner") && at("inner") < at("r0") && at("r2") < at("outer") && at("outer") < at("eq"));
    assert.equal(ops.filter((o) => /^c\d$/.test(o.id)).length, 2, "2 of the 3 columns");
    assert.equal(ops.filter((o) => /^r\d$/.test(o.id)).length, 3, "3 of the 5 rows");
    assert.deepEqual(ops.find((o) => o.id === "eq").rows[0], ["3/5", "×", "2/3", "=", "6/15"]);
    assert.equal(r.facts.onScreen.result, "6/15");
    assert.ok(r.script.durationMs > 5000, "it draws over time (an animation, not a still)");
    const hidden = expand({ template: "fraction-of@1", a: 1, b: 2, c: 1, d: 2, hideResult: true });
    assert.ok(hidden.ok && hidden.script.ops.find((o) => o.id === "eq").rows[0].includes("?"));
  });
  it("passes the gate against her line and is legible at every judged size", () => {
    const r = expand({ template: "fraction-of@1", a: 1, b: 2, c: 1, d: 2 }, { lessonId: "L" });
    const line = "Dekho, pehle poore ka 1/2 shade karte hain, phir us 1/2 ka 1/2 lete hain: 4 chhote hisson mein se 1, yaani 1/4.";
    const g = gateWhiteboard(r.script, { reply: line, speechMs: 6000 });
    assert.ok(g.pass, g.checks.filter((c) => !c.pass).map((c) => `${c.id} ${JSON.stringify(c.detail ?? "")}`).join("; "));
    assert.deepEqual(claimsNotDrawn(line, r.script.ops), []);
    assert.deepEqual(fractionsDisagree(line, r.script.ops), []);
    for (const vp of ["p360", "p412", "l1366"]) {
      assert.ok(certifyForTray({ kind: "whiteboard", script: r.script }, { vp }).ok, vp);
      assert.ok(certifyForTray({ kind: "whiteboard", script: r.script }, { vp, young: true }).ok, `${vp} young`);
    }
  });
});
