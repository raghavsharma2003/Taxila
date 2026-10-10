// Round 4 stream 5: the EXTENDED bilabial rule (src/face-puppet/visemes.ts addBilabialsExtended) is lamp2's only. It seals
// a single b / m / p inside or at the end of a word that Azure and the base rule left open (tum, Ab, about); r8 keeps the
// base rule (addBilabials) until the main session judges r8's contact sheet. Measured: evals/face-puppet/lipsync-looks.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { addBilabials, addBilabialsExtended, resolveVisemes } from "../src/face-puppet/visemes.ts";
import { VisemeScheduler } from "../src/face-puppet/track.ts";

// "Ab tum about" with no 21 from Azure: Ab and tum have no word-initial bilabial, about's b is internal and single
const visemes = [{ ms: 0, id: 2 }, { ms: 120, id: 19 }, { ms: 260, id: 19 }, { ms: 330, id: 7 }, { ms: 520, id: 2 }, { ms: 640, id: 19 }];
const words = [{ ms: 0, durMs: 200, text: "Ab" }, { ms: 220, durMs: 260, text: "tum" }, { ms: 500, durMs: 300, text: "about" }];
const seals = (v) => v.filter((x) => x.id === 21).map((x) => x.ms);

test("the extended rule seals single internal / final b m p; the base rule does not", () => {
  assert.deepEqual(seals(addBilabials(visemes, words)), [], "the base rule: none of these is word-initial or a double");
  const ext = seals(addBilabialsExtended(visemes, words));
  assert.equal(ext.length, 3, `one seal per word: ${ext}`);
  assert.equal(ext[0], 0 + 200 - 45, "Ab: the final b, 45 ms before the word's end");
  assert.equal(ext[1], 220 + 260 - 45, "tum: the final m");
  assert.equal(ext[2], Math.round(500 + 300 * (1.5 / 5)), "about: the b at its letter's share of the word");
  // a word Azure already sealed is left alone
  assert.deepEqual(seals(addBilabialsExtended([...visemes, { ms: 300, id: 21 }].sort((a, b) => a.ms - b.ms), words)).filter((x) => x !== 300).length, 2);
  // ph stays Azure's
  assert.deepEqual(seals(addBilabialsExtended([{ ms: 0, id: 2 }], [{ ms: 0, durMs: 300, text: "phir" }])), []);
});

test("resolveVisemes uses the extended rule only when asked; the scheduler asks only when the stage sets it", () => {
  const n21 = (t) => t.filter((x) => x.id === 21).length;
  assert.equal(n21(resolveVisemes(visemes, words)), 0, "r8 / default: base rule");
  assert.equal(n21(resolveVisemes(visemes, words, undefined, { extendedBilabials: true })), 3);
  assert.equal(new VisemeScheduler().extendedBilabials, false, "off unless a key-rig look turns it on");
  const stage = readFileSync(new URL("../src/face-puppet/stage.ts", import.meta.url), "utf8");
  assert.match(stage, /if \(lookPack\(o\.look\)\.rig === "keys"\) \{ this\.driver\.visemes\.lead \+= KEY_LEAD_MS; this\.driver\.visemes\.extendedBilabials = true; \}/);
  assert.equal((stage.match(/extendedBilabials = true/g) ?? []).length, 1, "set in exactly one place: the key-rig look");
});
