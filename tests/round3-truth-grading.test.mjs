// round3 truth: server/grading/corroborate.js with the ADJUDICATED parts data (data/kits-parts.json, shipped 2026-10-09).
// A half answer to a multi-part item was re-asked with no verdict (owner-1 on taxila.dev 2026-10-09, V1.1 oracle: 3 of 4
// half answers; the grok model leg: 133 of 172 two-rater partial answers abstained), because corroborate turned a partial on
// "the key's own words" into no evidence: "only the item's adjudicated parts can tell". With the parts in the data, code
// can tell. Pure (no network).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { corroborate, partsVerdict } from "../server/grading/corroborate.js";
import { targetFor } from "../server/director/classify.js";
import { getKit } from "../server/content/index.js";

const model = (outcome, extra = {}) => ({ outcome, confidence: 0.9, source: "model", flags: {}, ...extra });
async function target(itemId) {
  const kit = await getKit(itemId.replace(/-(i\d+|rl-[a-z]\d+)$/, ""), { generate: false });
  const item = kit.items.find((i) => i.id === itemId);
  return targetFor({ phase: "practice", hintLevel: 0 }, kit, { ...item, misconceptions: kit.misconceptions });
}

describe("round3 truth: a half answer on an item with adjudicated parts is partial", () => {
  test("'A: 6' for 'What comes next in each?' (parts A: 6 | B: 16): partial, whether the model said partial or incorrect", async () => {
    const t = await target("c4-maths-ch03-t02-i05");
    assert.deepEqual(t.parts, ["A: 6", "B: 16"], "fixture: the shipped parts row");
    for (const o of ["partial", "incorrect"]) {
      const r = corroborate({ target: t, text: "A: 6", result: model(o) });
      assert.equal(r.outcome, "partial", `model ${o}`);
      assert.equal(r.corroboration, `parts_some_${o}`);
    }
    assert.equal(corroborate({ target: t, text: "16", result: model("incorrect") }).outcome, "partial", "the other part alone");
  });

  test("a reply carrying every part is never a partial: it looks complete, so the model's disagreement is no evidence", async () => {
    const t = await target("c4-maths-ch03-t02-i05");
    assert.equal(partsVerdict(t, "A: 6. B: 16"), "all");
    assert.equal(corroborate({ target: t, text: "A: 6. B: 16", result: model("partial") }).outcome, "no_evidence");
  });

  test("a wrong number in a part is not that part: the model's 'incorrect' stands", async () => {
    const t = await target("c4-maths-ch03-t02-i05");
    assert.equal(corroborate({ target: t, text: "A: 6, B: 17", result: model("incorrect") }).outcome, "incorrect");
  });

  test("an area-and-perimeter item: the area part alone is partial", async () => {
    const t = await target("c5-maths-ch11-t01-i06");
    assert.equal(corroborate({ target: t, text: "Both have area 12 square units", result: model("partial") }).outcome, "partial");
  });

  test("an item with NO parts row keeps the old rule: no evidence (only adjudicated parts may decide)", async () => {
    const t = await target("c5-maths-ch07-t02-i06");
    assert.equal(t.parts, undefined, "fixture: disputed, no row");
    assert.equal(partsVerdict(t, "A doubles each time"), null);
    assert.equal(corroborate({ target: t, text: "A doubles each time", result: model("partial") }).outcome, "no_evidence");
  });

  test("a named misconception is never rewritten", async () => {
    const t = await target("c4-maths-ch03-t02-i05");
    const r = corroborate({ target: t, text: "A: 6", result: model("misconception", { misconceptionId: "m-x" }) });
    assert.equal(r.outcome, "misconception");
  });
});
