// Patch 04 (docs/design/round3/play/patches/04-desk-play-mode.diff): play mode gives the game the Desk. With a play piece
// in the Studio slot the question card folds (the game's goal rail is the card) and the tray takes its height, so the play
// renderer's minimum box (src/play/PlayStudioRenderer.tsx MIN_BOX 300 × 440) is met on common phones.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { solveDesk } from "../src/child/lesson/deskLayout.ts";
import { MIN_BOX } from "../src/play/core/box.ts";

describe("Desk play mode", () => {
  for (const [w, h] of [[360, 690], [360, 800], [412, 915], [393, 760]]) for (const family of ["older", "young"]) {
    it(`${w}×${h} ${family}: card folds, the tray grows by it, the play box fits`, () => {
      const base = solveDesk({ width: w, height: h, family, geometry: "work", captionsOn: true });
      const play = solveDesk({ width: w, height: h, family, geometry: "work", captionsOn: true, play: true });
      assert.equal(play.phone.card, 0);
      assert.ok(play.phone.tray >= base.phone.tray + base.phone.card, `${play.phone.tray} vs ${base.phone.tray}+${base.phone.card}`);
      assert.ok(play.phone.dock === base.phone.dock && play.phone.top === base.phone.top, "the dock (her mic) and the top bar never shrink");
      if (h >= 690 && family === "older") assert.ok(play.phone.tray >= MIN_BOX.h, `tray ${play.phone.tray} < ${MIN_BOX.h}`);
      assert.equal(play.total, h);
    });
  }
  it("wide: the card folds and the tray takes it", () => {
    const base = solveDesk({ width: 1366, height: 768, family: "older", geometry: "work", captionsOn: true });
    const play = solveDesk({ width: 1366, height: 768, family: "older", geometry: "work", captionsOn: true, play: true });
    assert.equal(play.wide.right.card, 0);
    assert.equal(play.wide.right.tray, base.wide.right.tray + base.wide.right.card + 16);
  });
  it("face geometry is untouched (play only ever rides in the Work tray)", () => {
    const a = solveDesk({ width: 360, height: 800, family: "older", geometry: "face", captionsOn: true });
    const b = solveDesk({ width: 360, height: 800, family: "older", geometry: "face", captionsOn: true, play: true });
    assert.deepEqual(a, b);
  });
});
