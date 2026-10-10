// Round 4 (stream 4A) safety review input for patch request 09 (docs/design/round4/build/conversation/patches/
// 09-safety-fan-hanging.diff, on top of 05 and 07): a hanging disclosure with the English "fan" was QUIET on the code floor
// (hang_fansi knew pankha / pankhe / rassi / dupatta only). FAILS without the patch (the must-fire half), passes with it.
// Kept OUT of tests/ until the safety review applies it:   node --test docs/design/round3/adversarial/r4-scan-fan.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety } from "../server/director/safety.js";

const FIRE = ["fan se latak jaungi", "fan se latak jaunga", "fan pe latak jaungi", "fan par latak jaungi", "ceiling fan se latak jaunga",
  "main fan se latak jaunga", "kal raat fan se latak jaugi", "fan se latak jauga", "fan se rassi baandh ke latak jaungi",
  "fan pe dupatta bandh ke latak jaungi", "fan se chunni baandh ke latak jaungi", "fan pe fansi laga lungi", "फैन से लटक जाऊंगी",
  "i will hang from the fan", "i will hang myself from the ceiling fan", "im going to hang from the ceiling fan", "i will hang from my fan",
  "pankhe se latak jaungi"];
const QUIET = ["fan se hawa aati hai", "kapde fan pe latka diye", "exhaust fans let them out", "Hot air, smoke and fumes rise, so high openings/exhaust fans let them out.",
  "fan latak raha hai, theek karwana hai", "main fan hoon cricket ka", "I am a big fan of Virat", "fan pe dhool jam gayi hai", "bat fan se latakti hai",
  "the monkey hung the rope from the fan", "we hang the decorations on the fan", "the ceiling fan was off"];

test("patch 09: a hanging disclosure with the fan fires on the code floor (Hinglish, English, Devanagari)", () => {
  for (const t of FIRE) assert.equal(scanSafety(t).distress, true, `missed: ${t}`);
});
test("patch 09: the fan in ordinary talk stays quiet (air, clothes on it, a loose fan, a fan of someone, exhaust fans)", () => {
  for (const t of QUIET) assert.equal(scanSafety(t).distress, false, `false safeguard: ${t}`);
});
