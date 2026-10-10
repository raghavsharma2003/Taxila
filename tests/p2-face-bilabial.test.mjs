// Round 4 (Asha lamp1): the text-side bilabial seals in src/face-puppet/visemes.ts (addBilabials, called by
// resolveVisemes). Pure, no audio: the cases are the measured line's own words and Azure events (2026-10-10).
import test from "node:test";
import assert from "node:assert/strict";
import { addBilabials, resolveVisemes } from "../src/face-puppet/visemes.ts";

test("a b / p / m word with no viseme 21 gets one at its start; a word Azure already sealed is left alone", () => {
  const V = [{ ms: 960, id: 21 }, { ms: 1000, id: 21 }, { ms: 1080, id: 11 }, { ms: 4200, id: 15 }, { ms: 4240, id: 1 }, { ms: 4400, id: 4 }, { ms: 7080, id: 1 }, { ms: 7120, id: 19 }];
  const W = [{ ms: 990, durMs: 400, text: "mazedaar" }, { ms: 4150, durMs: 240, text: "baarah" }, { ms: 4390, durMs: 240, text: "pencil" }, { ms: 7110, durMs: 320, text: "batao" }];
  const out = addBilabials(V, W);
  const seals = out.filter((v) => v.id === 21).map((v) => v.ms);
  assert.deepEqual(seals, [960, 1000, 4130, 4370, 7095], "mazedaar untouched; baarah, pencil at start - 20; batao 15 ms after the event before it");
  assert.equal(out.length, V.length + 3);
  for (let i = 1; i < out.length; i++) assert.ok(out[i].ms >= out[i - 1].ms, "sorted");
});

test("word-internal bb / mm, Devanagari onsets, and the cases that must NOT get a seal", () => {
  const W = [{ ms: 5070, durMs: 240, text: "dabbon" }, { ms: 6000, durMs: 200, text: "बस" }, { ms: 6950, durMs: 160, text: "phir" }, { ms: 8000, durMs: 200, text: "Socho," }];
  const out = addBilabials([{ ms: 5120, id: 1 }, { ms: 5160, id: 19 }, { ms: 6950, id: 17 }], W);
  const seals = out.filter((v) => v.id === 21).map((v) => v.ms);
  assert.deepEqual(seals, [Math.round(5070 + 240 * (3 / 6)), 5980], "dabbon's bb at its share; बस at its start; phir (ph) and socho get none");
  assert.deepEqual(addBilabials([{ ms: 0, id: 0 }], []), [{ ms: 0, id: 0 }], "no words: nothing to read");
});

test("resolveVisemes carries the added seal as a full PP target", () => {
  const track = resolveVisemes([{ ms: 4200, id: 15 }, { ms: 4240, id: 1 }], [{ ms: 4150, durMs: 240, text: "baarah" }]);
  const pp = track.find((e) => e.id === 21);
  assert.ok(pp && pp.ms === 4130 && pp.target.v === "viseme_PP" && pp.target.w === 1);
});
