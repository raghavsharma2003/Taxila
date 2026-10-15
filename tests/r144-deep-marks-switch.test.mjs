// 14.4 measurement switch (4A, main's deep-kind audit task): TAXILA_KIT_DEEP_MARKS=1 loads the audit's marked items as
// deep: false; off (the default) leaves every kit as authored. npm test runs files in one process, so this test never sets
// the environment: it flips the loader's own switch around one normalizeKit call (no kit cache involved) and puts it back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeKit, _deepMarksForTests } from "../server/content/kits.js";
import { plainEvidence } from "../server/director/items.js";

const RAW = JSON.parse(readFileSync(new URL("../data/kits/c4-maths.json", import.meta.url), "utf8")).topics.find((t) => t.topicId === "c4-maths-ch05-t01");
const MARKS = new Set(JSON.parse(readFileSync(new URL("../data/kits/deep-marks-2026-10-15.json", import.meta.url), "utf8")).items);
const load = (on) => { _deepMarksForTests(on); try { return normalizeKit(structuredClone(RAW), { topicId: RAW.topicId, verified: true }); } finally { _deepMarksForTests(null); } };

test("the switch on: the audit's marked items load as plain evidence, every other item as authored; off: none", () => {
  assert.equal(MARKS.size, 1927);
  const on = load(true);
  for (const it of on.items) assert.equal(plainEvidence(it), MARKS.has(it.id), it.id);
  assert.ok(on.items.some((it) => plainEvidence(it)), "this kit has at least one marked item");
  assert.ok(!load(false).items.some((it) => plainEvidence(it)), "off: no item is marked");
});
