// p5-interaction / V1-01r (owner-1 on prod 2026-10-05: 8/9 forged module claims accepted; one unanswerable activity): the
// server re-checks the VALUE a module answer committed against the verified key, never the frame's `correct` claim, and an
// answer it cannot re-check is never graded and never dropped silently. Needs the patches (APPLY.md).
import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { moduleAnswerOf, recheckCommitted } from "../server/director/modules.js";
import { recheckEngineAnswer, RECHECKABLE } from "../server/director/recheck.js";
import { growFits, planEngine } from "../shared/engine-catalog.js";

const SAVED = process.env.TAXILA_P5_RECHECK;
// File-scoped: a top-level hook wraps EVERY file's tests in the shared npm-test process (rj: shared-process hook leak).
describe('p5-interaction recheck', () => {
afterEach(() => { if (SAVED === undefined) delete process.env.TAXILA_P5_RECHECK; else process.env.TAXILA_P5_RECHECK = SAVED; });
const st = (engine, key, params = {}) => ({ activeItemId: "x", module: { id: "m1", engine, itemId: "x", key, params } });
const ev = (value, correct) => [{ moduleId: "m1", type: "answer", data: { value, correct } }];

test("owner-1's forged shape (a kindless { value }): the VALUE decides — wrong value + claim true is wrong; right value + claim false is right", () => {
  // the nine prod cases (owner-1 2026-10-05): value vs key with the claim correct:true
  const rows = [["place-value@1", "43", "41"], ["place-value@1", "51", "41"], ["number-line@1", "20", "18"], ["multiply-divide@1", "19", "9"], ["multiply-divide@1", "10", "9"],
    ["data-graphs@1", "31", "30"], ["patterns@1", "19", "17"], ["patterns@1", "20", "19"]];
  for (const [engine, v, key] of rows) {
    const a = moduleAnswerOf(st(engine, key), ev({ value: v }, true));
    assert.equal(a.correct, false, `${engine} ${v} vs ${key}`);
    assert.equal(a.claimMismatch, true);
  }
  assert.equal(moduleAnswerOf(st("place-value@1", "41"), ev({ value: "41" }, false)).correct, true);
  assert.equal(moduleAnswerOf(st("fractions@1", "3/4"), ev({ value: "6/8" }, false)).correct, true, "fractions by value");
});

test("the act's own kind is re-run by the engine's logic on the SERVER's params (V1-01): a written entry beside value=<key> is not the key", () => {
  assert.ok(RECHECKABLE["place-value@1"].includes("pv.write"));
  const r = recheckEngineAnswer({ engine: "multiply-divide@1", params: { mode: "groups", a: 3, b: 4 } }, { value: { kind: "md.product", value: "13" }, correct: true });
  assert.ok(r.unverifiable || r.correct === false);
  // pv.write carries value=<key> and written=<entry>: the entry is what is graded
  assert.equal(recheckCommitted({ kind: "x.unknown", written: "43", value: "41" }, "41"), false);
});

test("an answer the server cannot re-check is { unverifiable } — never the claim — and the kill switch restores HEAD", () => {
  const a = moduleAnswerOf(st("place-value@1", "41"), ev({ foo: 1 }, true));
  assert.equal(a.unverifiable, true);
  assert.equal(a.correct, undefined);
  process.env.TAXILA_P5_RECHECK = "off";
  const b = moduleAnswerOf(st("place-value@1", "41"), ev({ foo: 1 }, true));
  assert.equal(b.correct, true, "HEAD: the claim stood when nothing could be read (the defect the switch brings back)");
});

test("recheckCommitted: numbers and fractions by value, short labels by text, nothing comparable → null", () => {
  assert.equal(recheckCommitted({ value: "12.50" }, "12.5"), true);
  assert.equal(recheckCommitted({ value: "107040" }, "1,07,040"), null, "an Indian-comma key is not re-read as a bare number (rj-w2int-digits-only-pad-for-comma-keys)");
  assert.equal(recheckCommitted({ given: "A" }, "a"), true);
  assert.equal(recheckCommitted({ given: "A" }, "B"), false);
  assert.equal(recheckCommitted({ value: "12" }, "twelve"), null);
  assert.equal(recheckCommitted({}, "4"), null);
  assert.equal(recheckCommitted({ value: "4" }, ""), null);
  // a number with a short unit is that number (owner-1 local 2026-10-05: geoboard "6 square units" vs bound key "6" went ungraded)
  assert.equal(recheckCommitted({ value: "6 square units" }, "6"), true);
  assert.equal(recheckCommitted({ value: "7 square units" }, "6"), false);
  assert.equal(recheckCommitted({ value: "6" }, "6 square units"), true);
  assert.equal(recheckCommitted({ value: "5 squares and 9 squares" }, "5"), null, "not a number with a unit");
  assert.equal(moduleAnswerOf(st("geoboard@1", "6"), ev({ value: "6 square units" }, false)).correct, true, "the forged right value with claim false grades right");
});

test("patterns@1 unbound: numbers that are not a sequence never become an unanswerable grow activity (owner-1: '3 5 7 8 ? ?')", () => {
  assert.equal(growFits([3, 5, 7, 8]), false);
  for (const s of [[5, 9, 13], [4, 7, 10], [2, 4, 8, 16], [1, 4, 9, 16]]) assert.equal(growFits(s), true, s.join(","));
  const kit = { topicId: "c5-maths-ch07-t02", formats: { engineHints: ["patterns@1:grow"] }, items: [], skills: [] };
  const plan = planEngine({ kit, item: { id: "q", skillId: "s", prompt_en: "Riya has 3 red, 5 blue, 7 green and 8 yellow beads.", answer: "23" }, lang: "english" });
  assert.ok(!plan || plan.engine !== "patterns@1" || plan.bindItem, `no unbound grow from 3 5 7 8 (got ${JSON.stringify(plan?.params ?? null)})`);
});
});
