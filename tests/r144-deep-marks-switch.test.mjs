// 14.4 measurement switch (4A, main's deep-kind audit task): TAXILA_KIT_DEEP_MARKS=1 loads the audit's marked items as
// deep: false; off (the default, every other test file) leaves every kit as authored. Set before the kit loader is imported.
process.env.TAXILA_KIT_DEEP_MARKS = "1";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { plainEvidence } = await import("../server/director/items.js");

test("the switch on: the audit's marked items load as plain evidence, every other item as authored", () => {
  const marks = new Set(JSON.parse(readFileSync(new URL("../data/kits/deep-marks-2026-10-15.json", import.meta.url), "utf8")).items);
  assert.equal(marks.size, 1927);
  const kit = kitFromFile(getTopic("c4-maths-ch05-t01"));
  for (const it of kit.items) assert.equal(plainEvidence(it), marks.has(it.id), it.id);
  assert.ok(kit.items.some((it) => plainEvidence(it)), "this kit has at least one marked item");
});
