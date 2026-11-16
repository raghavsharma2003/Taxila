// Audit STUDIO-05 (2026-11-10): the beat card's progress dots stopped moving from the 9th board — eight dots drawn, all
// "done", none "now". src/studio/beatDots.ts is what StudioStage draws.
import { test } from "node:test";
import assert from "node:assert/strict";
import { beatDots, BEAT_DOTS_MAX } from "../src/studio/beatDots.ts";

test("beat dots: at most 8, the last always now, the rest done — the 9th board and later too", () => {
  assert.deepEqual(beatDots(1), ["is-now"]);
  assert.deepEqual(beatDots(3), ["is-done", "is-done", "is-now"]);
  for (const n of [8, 9, 12, 40]) {
    const d = beatDots(n);
    assert.equal(d.length, BEAT_DOTS_MAX, `n=${n}`);
    assert.equal(d.filter((c) => c === "is-now").length, 1, `n=${n}: one dot is now`);
    assert.equal(d.at(-1), "is-now", `n=${n}`);
  }
});
