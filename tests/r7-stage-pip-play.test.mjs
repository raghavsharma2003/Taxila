// round 7 (C1, main's decision after C2 Games found it): the PiP rule never costs a game its box. A play piece keeps its
// whole fit (>= play's MIN_BOX 300 x 440 at p360, p412, l1366, or it mounts the text twin); the corner the PiP covers goes
// to the play view as --pip-keep-w / -h. Boards keep the lift / fit rule.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boxFor, insetFor, pipKeepFor } from "../src/studio/stageBox.ts";
import { MIN_BOX } from "../src/play/core/box.ts";

const contract = JSON.parse(readFileSync(new URL("../server/forge3/certs/box-contract.json", import.meta.url), "utf8")).stageFirst.bands.b3;
// a slot, and her PiP in it (the contract's pipZone: a square, inset from the bottom-right), as StudioStage sees them
const slots = [
  ["p360 (Games' measured tray)", { w: 324, h: 528 }, { w: 89, inset: 8 }],
  ["p360", contract.p360.play.box, contract.p360.pipZone],
  ["p412", contract.p412.play.box, contract.p412.pipZone],
  ["l1366", contract.l1366.play.box, contract.l1366.pipZone],
];
const pipIn = (avail, z) => (z ? { x: avail.w - z.inset - z.w, y: avail.h - z.inset - z.w, w: z.w, h: z.w } : null);
const playDesign = (avail) => ({ w: Math.max(1, Math.floor(avail.w - 2 * insetFor(avail.w))), h: Math.max(1, Math.floor(avail.h - 2 * insetFor(avail.w))) });

for (const [name, avail, z] of slots) {
  test(`${name}: a play box stays >= MIN_BOX with the PiP in the slot, and the corner it covers is handed to the game`, () => {
    const pip = pipIn(avail, z);
    const box = boxFor(avail, playDesign(avail), 0, pip, { keepWhole: true });
    assert.ok(box.w >= MIN_BOX.w && box.h >= MIN_BOX.h, `${box.w} x ${box.h} >= ${MIN_BOX.w} x ${MIN_BOX.h}`);
    const keep = pipKeepFor(box, pip);
    if (pip) {
      assert.ok(keep && keep.w >= pip.w && keep.h >= pip.h && keep.w < box.w && keep.h < box.h, JSON.stringify(keep));
    } else assert.equal(keep, null, "no PiP in the slot: nothing to keep clear");
  });
}

test("a board is still lifted clear of the PiP (or fitted above it): its box never meets the PiP", () => {
  const avail = contract.p412.play.box, pip = pipIn(avail, contract.p412.pipZone);
  const box = boxFor(avail, { w: 400, h: 600 }, 0, pip);
  assert.ok(box.y + box.h <= pip.y, `board bottom ${box.y + box.h} <= PiP top ${pip.y}`);
  assert.equal(pipKeepFor(box, pip), null);
  // the same design as a play piece would have been left where it was, under the PiP's corner
  assert.notEqual(pipKeepFor(boxFor(avail, { w: 400, h: 600 }, 0, pip, { keepWhole: true }), pip), null);
});
