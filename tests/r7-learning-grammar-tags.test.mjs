// Round 7 F (main 2026-11-04): class 4-7 English / Hindi grammar skills carry kind "grammar" in the kits, exactly as
// scripts/kits/tag-grammar.mjs says (the title-pattern set + its hand list), so C2's build-vakya does not depend on wording.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ADD, BORDERLINE, CLASSES, SUBJECTS, grammarSkillIds, tagKit } from "../scripts/kits/tag-grammar.mjs";

const kits = CLASSES.flatMap((c) => SUBJECTS.map((s) => ({ s, kit: JSON.parse(readFileSync(new URL(`../data/kits/c${c}-${s}.json`, import.meta.url), "utf8")) })));
const skills = kits.flatMap(({ kit }) => kit.topics.flatMap((t) => t.skills));

test("the kits are tagged as tag-grammar.mjs says (run it after a kit change)", () => {
  for (const { s, kit } of kits) assert.equal(tagKit(structuredClone(kit), s).changed, 0, `c${kit.class}-${s}`);
  assert.equal(skills.filter((k) => k.kind === "grammar").length, 85);
});

test("every hand-listed id exists; borderline skills stay untagged; kind is only ever 'grammar'", () => {
  const ids = new Set(skills.map((k) => k.id));
  for (const id of [...ADD, ...BORDERLINE]) assert.ok(ids.has(id), id);
  for (const id of BORDERLINE) assert.equal(skills.find((k) => k.id === id).kind, undefined, id);
  for (const k of skills) assert.ok(k.kind === undefined || k.kind === "grammar", k.id);
});

test("c6 Hindi has grammar skills now (the title patterns found none)", () => {
  const c6hi = kits.find(({ s, kit }) => s === "hindi" && kit.class === 6);
  assert.ok(grammarSkillIds(c6hi.kit, "hindi").length >= 3);
});
