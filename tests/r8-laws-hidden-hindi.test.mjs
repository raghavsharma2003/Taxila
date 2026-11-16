// Laws ruling to Games, 2026-11-16 (RULINGS-2026-11-15.md, "your status file's two questions" 1): the hidden key-word lists
// of badlaav, jaanch, rang, aakash and yantra/roshni carry Devanagari entries, so the Hindi run of law 2 catches a word key
// and not only numbers and idea words. Every served level of those families: its hidden list holds a Devanagari word.
import { test } from "node:test";
import assert from "node:assert/strict";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";
import { hiddenOf } from "../server/play/react.js";

const DEVANAGARI = /[ऀ-ॿ]/;
const word = (e) => e.family === "yantra" ? e.mode === "roshni" : ["badlaav", "jaanch", "rang", "aakash"].includes(e.family);

test("the science word keys are hidden in Hindi script too (laws ruling 2026-11-16)", () => {
  const goals = new Set();
  for (const e of coverage().entries.filter(word)) for (const fade of [1, 2, 3]) {
    const level = currentLevel({ childId: "c1", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hi", mis: {}, n: 0, seed: seedOf("c1", entryKey(e), fade), recent: [], hist: null }, e);
    if (!level) continue;
    const h = hiddenOf(level), goal = `${level.family}/${level.mode}/${level.params?.goal}`;
    assert.ok(h.some((w) => DEVANAGARI.test(String(w))), `${goal} (${level.levelId}): no Devanagari word in its hidden list`);
    assert.ok(h.some((w) => /[a-z]/i.test(String(w))), `${goal}: the Latin words stay`);
    goals.add(goal);
  }
  assert.ok(goals.size >= 15, `${goals.size} goals checked: ${[...goals].join(", ")}`);
});
