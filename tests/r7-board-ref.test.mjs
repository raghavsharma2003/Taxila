// Round 7 (main, dc-r7-teaching-scripts): the board-ref vocabulary a lesson script's explain beat names. Every listed
// template renders from its example; an unknown or out-of-range ref is refused with its reason; `{ auto: true }` is the
// code's own pick; certifyBoardRef runs the full whiteboard gate against the beat's line.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BOARD_REFS, resolveBoardRef, certifyBoardRef } from "../server/forge/explainer/board-ref.js";

const kit = JSON.parse(fs.readFileSync("data/kits/c5-maths.json", "utf8")).topics.find((t) => t.topicId === "c5-maths-ch02-t01");

test("board refs: every template in the vocabulary renders from its own example", () => {
  assert.ok(Object.keys(BOARD_REFS).length >= 20);
  for (const [template, d] of Object.entries(BOARD_REFS)) {
    const r = resolveBoardRef({ template, ...d.example });
    assert.ok(r.ok, `${template}: ${r.why}`);
  }
});

test("board refs: unknown and out-of-range refs are refused with a reason; withhold 'item' hides the result", () => {
  assert.match(resolveBoardRef({ template: "volcano@9" }).why, /unknown_template/);
  assert.equal(resolveBoardRef({ template: "fraction-line@1", den: 40 }).ok, false);
  assert.equal(resolveBoardRef(null).ok, false);
  assert.equal(resolveBoardRef({ template: "equal-groups@1", groups: 3, each: 4, withhold: "item" }).call.hideResult, true);
  assert.deepEqual(resolveBoardRef({ auto: true }, { kit }).call, { template: "fraction-line@1", den: 5, target: [2, 5], show: true });
});

test("board refs: certify runs the full gate (the line must say what the board shows)", async () => {
  const ok = await certifyBoardRef({ template: "fraction-line@1", den: 5, target: [2, 5], show: true }, { kit, line: kit.workedExample.steps.join(" ") });
  assert.equal(ok.ok, true, JSON.stringify(ok.failed));
  const item = kit.items.find((i) => i.id.endsWith("-i03"));
  const leak = await certifyBoardRef({ template: "fraction-line@1", den: 5, target: [3, 5], show: true }, { kit, item, line: item.prompt_en });
  assert.equal(leak.ok, false, "a ref that places the asked fraction is refused");
  assert.ok(leak.failed.includes("W9.no_reveal"));
});
