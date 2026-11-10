// The arena asks a question on its own: an item that is about a stored passage (kit item.passageId) is left out.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { challengeOf } from "../server/play/tools/build-arena.mjs";

test("challengeOf leaves out an item that needs its passage", () => {
  const it = { id: "x", skillId: "s", kind: "practice", prompt_en: "Where did Meenu sit?", prompt_hi: "Meenu kahaan baithi?", answer: "By the river", verified: { agrees: true }, passageId: "p1" };
  assert.deepEqual(challengeOf(it, { topicId: "t" }), { why: "needs its passage" });
});

test("no arena challenge is about a passage item", () => {
  const withPassage = new Set();
  const kits = new URL("../data/kits/", import.meta.url);
  for (const f of readdirSync(kits).filter((x) => /^c\d+-[a-z]+\.json$/.test(x))) for (const t of JSON.parse(readFileSync(new URL(f, kits), "utf8")).topics) for (const i of t.items) if (i.passageId) withPassage.add(i.id);
  const arena = new URL("../data/arena/", import.meta.url);
  const bad = [];
  for (const f of readdirSync(arena).filter((x) => /^c\d+-/.test(x))) for (const c of JSON.parse(readFileSync(new URL(f, arena), "utf8")).challenges) if (withPassage.has(c.id)) bad.push(c.id);
  assert.deepEqual(bad, []);
});
