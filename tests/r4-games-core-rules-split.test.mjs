// S0.3 (round 4, games core): the play coverage rules live one file per family (server/play/tools/rules/<family>.mjs) so
// each games lane edits only its own. These checks hold the split's invariants: a fixed admission order with the four
// round-3 families first, every rule in its own family's file, no ACTS key claimed by two families, and the builder still
// producing the file on disk (build-coverage --check is the byte-level gate).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FAMILY_RULES, RULES, ACTS } from "../server/play/tools/rules/index.mjs";
import { build } from "../server/play/tools/build-coverage.mjs";

test("rules split: the four round-3 families come first, in their original order", () => {
  assert.deepEqual(FAMILY_RULES.slice(0, 4).map((m) => m.family), ["todo-jodo", "taraazu", "nishana", "kyun-lab"]);
});

test("rules split: every rule sits in its own family's file; RULES is their concatenation in file order", () => {
  for (const m of FAMILY_RULES) for (const r of m.RULES) assert.equal(r.family, m.family, `${r.topicId} ${r.family} in rules/${m.family}.mjs`);
  assert.deepEqual(RULES, FAMILY_RULES.flatMap((m) => m.RULES));
});

test("rules split: an ACTS key belongs to exactly one family, and every rule has its ACTS entry", () => {
  const owner = new Map();
  for (const m of FAMILY_RULES) for (const k of Object.keys(m.ACTS)) { assert.ok(!owner.has(k), `${k} in ${owner.get(k)} and ${m.family}`); owner.set(k, m.family); }
  for (const r of RULES) assert.ok(Array.isArray(ACTS[`${r.topicId}|${r.goal}`]), `${r.topicId}|${r.goal}`);
});

test("rules split: the builder reproduces data/play/coverage.json exactly, with no problems", () => {
  const { problems, file } = build();
  assert.deepEqual(problems, []);
  assert.equal(JSON.stringify(file, null, 1) + "\n", readFileSync(new URL("../data/play/coverage.json", import.meta.url), "utf8"));
});
