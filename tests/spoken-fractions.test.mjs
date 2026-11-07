// Round 5 (main 2026-10-15): one rule set for every reader of a child's spoken number, cases written once in
// tests/fixtures/spoken-fractions.json (the grader, server/grading/spoken-number.js, tests against the same file: 4A).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { valuesOf } from "../src/duplex/numerals.ts";
import { valuesIn } from "../server/duplex/understand.js";

const { cases } = JSON.parse(fs.readFileSync(new URL("./fixtures/spoken-fractions.json", import.meta.url), "utf8"));

test("the fixture is the shared contract (≥ 30 lines, the named cases present)", () => {
  assert.ok(cases.length >= 30);
  for (const t of ["मुझे बता दो", "2 बता दो", "एक बटा दो", "तीन बटा चार", "बता दो ना दीदी"]) assert.ok(cases.some((c) => c.text === t), t);
});

for (const [name, read] of [["engine (src/duplex/numerals.ts valuesOf)", (t) => valuesOf(t).map((v) => v.v)], ["server/duplex/understand.js valuesIn", (t) => valuesIn(t).map((v) => v.v)]]) {
  test(`${name}: every shared case`, () => {
    const bad = cases.filter((c) => JSON.stringify(read(c.text)) !== JSON.stringify(c.values)).map((c) => `${c.text} → ${JSON.stringify(read(c.text))}, want ${JSON.stringify(c.values)}`);
    assert.deepEqual(bad, []);
  });
}
