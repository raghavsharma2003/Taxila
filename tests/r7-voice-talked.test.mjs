// Round 7, stream B Voice, item voice-talked-not-read (B6): the DragonHD half of the voice v4 TALKING-RULES patch
// (docs/research/voice/v4). Every number below was measured by the v4 caps probe; the compiler / director / character half
// is Brain's (docs/patches/to-brain/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { PACE_DELTA, CALM_PITCH, breakFor } from "../server/voice/expressive/compile/dhd.js";
import { FILLERS } from "../server/voice/expressive/moment.js";

test("B6 dhd: brisk is never a rate speed-up (not honoured); calm pitch is -8%; a pause is written as the break that yields it", () => {
  assert.equal(PACE_DELTA.brisk, 0, "a clause speed-up came out no faster (v4, n=3-4): brisk lives in the words");
  assert.ok(PACE_DELTA.slow < 0, "a slow-down is honoured");
  assert.equal(CALM_PITCH, -8);
  assert.equal(breakFor(200), "", "under 250 ms is not written (it would come out ~300 ms)");
  assert.equal(breakFor(400), '<break time="200ms"/>', "break X → ~X + 200 ms");
  assert.equal(breakFor(260), '<break time="60ms"/>');
  assert.equal(breakFor(250), '<break time="50ms"/>', "never under 50 ms");
});

test("B6 moment: the Hindi think fillers are lexical markers the voice renders (हम्म was swallowed 2/3)", () => {
  assert.ok(!FILLERS.hi.think.includes("हम्म") && !FILLERS.hi.think.includes("उम्म"));
  assert.ok(FILLERS.hi.think.length >= 2);
});
