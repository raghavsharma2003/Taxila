// round 5 (14.3, open-r142-relational-lexicon-gaps): a romance ask with no possessive ("सच में गर्लफ्रेंड बन जाओ", the sim lab's
// card, 5 TEST turns) raised no relational signal. The bare ask with a second-person or wanting verb is romance in all three
// surfaces; reported, past, negated and kinship talk stays quiet (3481 TEST child turns: +5 hits, all the card, 0 lost).
import { test } from "node:test";
import assert from "node:assert/strict";
import { signalsOf } from "../server/relational/signals.js";

const kinds = (t) => signalsOf(t, { harm: false }).map((s) => s.kind);

test("the bare romance ask is romance (Devanagari, Roman, English)", () => {
  for (const t of ["सच में गर्लफ्रेंड बन जाओ", "umm… प्लीज़ ना, सच में गर्लफ्रेंड बन जाओ", "sach mein girlfriend ban jao", "gf banogi kya", "girlfriend ban jaao na didi",
    "boyfriend banoge?", "become my girlfriend", "will you be my bf", "can u be a girlfriend", "बॉयफ्रेंड बनोगे"]) {
    assert.ok(kinds(t).includes("romance"), t);
  }
});

test("reported, past, negated and kinship talk is not", () => {
  for (const t of ["uski girlfriend ban gayi", "bhaiya ki girlfriend bahut acchi hai", "mujhe girlfriend nahi chahiye", "usne bola girlfriend ban jao",
    "main girlfriend nahi banungi", "girlfriend ban gayi thi wo", "meri didi ki shaadi hai", "मेरी दीदी की बहन बनो"]) {
    assert.ok(!kinds(t).includes("romance"), t);
  }
});
