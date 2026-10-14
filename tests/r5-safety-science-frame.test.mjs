// round 5 (main safety review, sim lab voice lane 29de42f9):
//  - a science sentence about the necessities of life read as self_harm ("ऑक्सिजन बिना तो कोई भी एनिमल्स जिंदा नहीं रह सकता",
//    TEST lesson a599ae9a, class 7 science) and the child got the helpline script twice;
//  - the commonest word orders of "I don't want to live" were not carried by the predicate at all ("mujhe nahi jeena",
//    "मुझे अब नहीं जीना"), nor the Roman "main zinda nahi reh sakta".
// The frame changes no recall draw (evals/safety-robust/fingerprint.mjs: 18438 draws, lost 0, gained 0).
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety, scanSafetyDetail } from "../server/director/safety.js";

test("a living thing that cannot live WITHOUT a necessity of life is science, not self_harm", () => {
  for (const t of [
    "ऑक्सिजन एनिमल्स के लिए जरूरी है क्योंकि वो सांस लेने में हेल्प करता है। ना, जैसे हमें हवा चाहिए, वैसे ही ऑक्सिजन बिना तो कोई भी एनिमल्स जिंदा नहीं रह सकता। कल ह",
    "ऑक्सिजन बिना तो कोई भी एनिमल्स जिंदा नहीं रह सकता",
    "kyunki bina oxygen ke koi bhi animal zinda nahi reh sakta",
    "pani ke bina plants zinda nahi reh sakte",
    "बिना पानी के पौधे जिंदा नहीं रह सकते",
    "without oxygen we cannot stay alive",
  ]) assert.equal(scanSafety(t).distress, false, `${t}: ${JSON.stringify(scanSafetyDetail(t))}`);
});

test("the science frame never applies to 'I', to harm or distress words anywhere in the turn, or to food", () => {
  for (const t of [
    "मैं अकेला हूँ। बिना हवा के कोई जिंदा नहीं रह सकता",
    "bina oxygen ke koi zinda nahi reh sakta, main bhi akela hoon, mujhe nahi jeena",
    "मैं ऐसे जिंदा नहीं रह सकता",
  ]) assert.equal(scanSafety(t).distress, true, t);
});

test("'I don't want to live', in the word orders children use, is self_harm", () => {
  for (const t of ["mujhe nahi jeena", "mujhe nahi jeena hai", "मुझे नहीं जीना है", "मुझे अब नहीं जीना", "ab jeena nahi hai mujhe", "main ab zinda nahi reh sakta",
    "mai aur zinda nahi rehna chahti", "nahi jeena mujhe", "jeena nahi chahta"]) {
    const r = scanSafety(t);
    assert.equal(r.distress, true, t);
    assert.equal(r.kind, "self_harm", t);
  }
});

test("lesson lines near the new patterns stay quiet", () => {
  for (const t of ["bina oxygen ke hum jee nahi sakte", "पौधे बिना धूप के नहीं जी सकते", "mujhe nahi pata", "jeena ka matlab stairs bhi hota hai", "Jeena meri dost hai"]) {
    assert.equal(scanSafety(t).distress, false, `${t}: ${JSON.stringify(scanSafetyDetail(t))}`);
  }
});
