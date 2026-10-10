// Round 4 · stream 2 (content), v2 "draws while she talks": the beat-by-beat board's packaging (flag TAXILA_BEAT_BOARD,
// default off): typed cards, beat progress, "checkpoint ahead", a skill's first board opening on a picture. No browser,
// no model. The flag off leaves every board exactly as before (no card).
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { cardKindOf, cardFor, preferPicture, firstBoardOfSkill, beatBoardOn } from "../server/stagecraft/beat-card.js";
import { expand } from "../server/forge/explainer/templates.js";

const ops = (t, c) => expand({ template: t, ...c }).script.ops;
describe("r4 content: beat cards", () => {
  after(() => { delete process.env.TAXILA_BEAT_BOARD; });
  it("types a board by its beat and its drawing", () => {
    assert.equal(cardKindOf({ beat: "contrast", ops: [] }), "example");
    assert.equal(cardKindOf({ beat: "recap", ops: [] }), "takeaway");
    assert.equal(cardKindOf({ beat: "explain", template: "column-op@1", ops: ops("column-op@1", { a: 345, b: 278, op: "add" }) }), "steps");
    assert.equal(cardKindOf({ beat: "explain", template: "fraction-parts@1", ops: ops("fraction-parts@1", { parts: 4, shade: 3 }) }), "picture");
    assert.equal(cardKindOf({ beat: "explain", ops: [{ op: "numwork", rows: [["2", "+", "3", "=", "5"]] }] }), "formula");
  });
  it("counts beats per lesson (a continue board stays in its beat) and announces a check after steps / takeaway", () => {
    const L = {};
    const a = cardFor(L, { mode: "fresh", intent: { beat: "explain", skillId: "s1" } }, { ops: ops("fraction-parts@1", { parts: 4, shade: 1 }) });
    const b = cardFor(L, { mode: "continue", intent: { beat: "explain", skillId: "s1" } }, { ops: [] });
    const c = cardFor(L, { mode: "fresh", intent: { beat: "worked_example", skillId: "s1" } }, { ops: ops("column-op@1", { a: 12, b: 7, op: "sub" }) }, { template: "column-op@1" });
    assert.deepEqual([a.n, b.n, c.n], [1, 1, 2]);
    assert.equal(a.checkpointAhead, false);
    assert.equal(c.checkpointAhead, true);
    assert.ok(!firstBoardOfSkill(L, { intent: { skillId: "s1" } }) && firstBoardOfSkill(L, { intent: { skillId: "s2" } }));
  });
  it("a skill's first board prefers a picture candidate, otherwise keeps the order", () => {
    const steps = { template: "column-op@1", script: { ops: ops("column-op@1", { a: 12, b: 7, op: "sub" }) } };
    const pic = { template: "fraction-parts@1", script: { ops: ops("fraction-parts@1", { parts: 4, shade: 1 }) } };
    assert.deepEqual(preferPicture([steps, pic]).map((x) => x.template), ["fraction-parts@1", "column-op@1"]);
  });
  it("is off by default", () => { delete process.env.TAXILA_BEAT_BOARD; assert.equal(beatBoardOn(), false); process.env.TAXILA_BEAT_BOARD = "1"; assert.equal(beatBoardOn(), true); });
});
