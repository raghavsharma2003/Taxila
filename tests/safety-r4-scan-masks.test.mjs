// Round 4 (stream 4A) safety review input for patch request 07 (docs/design/round4/build/conversation/patches/
// 07-safety-shape-raw-masks.diff, on top of patch 05): five lexicon shapes fired on ordinary kit words through a canonical
// collision (safety-kit-hits.md). Each gets a raw-word mask in its own shape only. FAILS without the patch (the benign half),
// passes with it. Kept OUT of tests/ until the safety review applies it:
//   node --test docs/design/round3/adversarial/r4-scan-masks.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety } from "../server/director/safety.js";

const CASES = {
  hang_fansi: {
    benign: ["Hot air, smoke and fumes rise, so high openings/exhaust fans let them out.", "the ceiling fan was off", "table fans le aao"],
    fire: ["pankhe se latak jaungi", "fansi laga lungi", "main fansi le lunga", "i will hang myself from the fan", "exhaust fans let them out but main fansi laga lungi"],
  },
  jeene_ka_matlab_nahi: {
    benign: ["Point to lining up N", "Point to lining the thread up at 0"],
    fire: ["jeene ka koi matlab nahi", "no point of living", "point of living kya hai jab koi pyaar nahi karta", "what is the point to living", "lining up karte hain par jeene ka koi matlab nahi"],
  },
  reason_to_live: {
    benign: ["Point to living things interacting there", "what is the point of living things in an ecosystem"],
    fire: ["i have no reason to live", "living things padhe aaj, i have no reason to live"],
  },
  kalai_cut: {
    benign: ["Meera’s family has cut the ripe bajra crop. Before the grains can be stored, which comes first: threshing or winnowing?", "she cut the grass", "nai ne baal kaate, he cut my hair"],
    fire: ["kalai kaat li", "maine apni nas kaat li", "kalai pe blade chalaya", "maine grass cut ki aur phir kalai kaat li"],
  },
  khud_ko_khatam: {
    benign: ["Golu kehta hai: 'Chaand ek bada sa bulb hai jo raat ko apne aap jal jaata hai.' Galat kya hai?", "diya apne aap jal jaata hai kya?"],
    fire: ["khud ko khatam kar dungi", "apne aap ko jala dungi", "apne aap ko khatam kar lunga", "bulb apne aap jal jaata hai aur main khud ko khatam kar dungi"],
  },
};

for (const [shape, { benign, fire }] of Object.entries(CASES)) {
  test(`patch 07 ${shape}: the kit's ordinary words are quiet`, () => {
    for (const t of benign) assert.equal(scanSafety(t).distress, false, `false safeguard: ${t}`);
  });
  test(`patch 07 ${shape}: every true disclosure still fires, with or without the benign words beside it`, () => {
    for (const t of fire) assert.equal(scanSafety(t).distress, true, `missed: ${t}`);
  });
}
