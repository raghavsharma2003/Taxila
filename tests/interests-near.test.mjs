// Round 8 K6 (docs/patches/to-learning, r8-loop): every registry interest carries `near`, the interests a lesson script's hook
// falls to when it has no slot for this one; every onboarding tile reaches a slot family the pilot scripts use, and the
// registry agrees with server/director/knows.js's table (which it replaces as the source).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { INTEREST_REGISTRY, INTEREST_IDS, TILE_IDS } from "../shared/interests.js";
import { NEAR } from "../server/director/knows.js";

test("every interest has a near list of other registry ids, the same as knows.js's", () => {
  for (const x of INTEREST_REGISTRY) {
    assert.ok(Array.isArray(x.near) && x.near.length >= 1, x.id);
    for (const n of x.near) { assert.ok(INTEREST_IDS.includes(n), `${x.id} → ${n}`); assert.notEqual(n, x.id); }
    assert.deepEqual(x.near, NEAR[x.id], x.id);
  }
});

test("every onboarding tile reaches a hook slot family the pilot scripts use", () => {
  const families = new Set(["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"]
    .flatMap((t) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${t}.json`, import.meta.url), "utf8")).skills.flatMap((sk) => sk.hook.interestSlots.map((s) => s.interest))));
  for (const id of TILE_IDS) assert.ok([id, ...INTEREST_REGISTRY.find((x) => x.id === id).near].some((x) => families.has(x)), id);
});
