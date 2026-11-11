// dc-r7-script-walk-v6-11 C1 step 1 (main's ruling on COMPILE.md): the type table, compileScript and the hole report. No walk change:
// nothing in the walk reads the compiled map yet (step 2 is shadow mode).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { TYPE_TABLE, PART_KINDS, COLUMNS, HELP, compileScript, compiledFor, clearCompiled } from "../server/director/compile.js";

const ROOT = new URL("..", import.meta.url);
const live = readdirSync(new URL("data/lesson-scripts", ROOT)).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(new URL(`data/lesson-scripts/${f}`, ROOT), "utf8")));

test("the type table: 9 part kinds × 12 columns × 3 help states, answers on cards only", () => {
  assert.equal(PART_KINDS.length, 9);
  assert.equal(COLUMNS.length, 12);
  assert.deepEqual(HELP, ["fresh", "heard", "spent"]);
  assert.equal(TYPE_TABLE.length, 324);
  for (const x of TYPE_TABLE) if (["right", "wrong", "misconception"].includes(x.column)) assert.equal(!!x.rule, ["card", "your_step", "then_card", "check"].includes(x.kind), x.id);
});

test("every cell says only authored fields (script paths) and carries its address", () => {
  for (const s of live) {
    const c = compileScript(s);
    assert.ok(c.parts.length > 40, s.topicId);
    for (const [part, cols] of Object.entries(c.cells)) for (const [col, hs] of Object.entries(cols)) for (const [h, cell] of Object.entries(hs)) {
      assert.equal(cell.address, `${part}/${col}/${h}`);
      for (const ref of cell.say) assert.match(ref, /^skills\[\d+\]\./, `${cell.address}: ${ref}`);
      assert.ok(["end", "checkin", "card", "next", "remediation"].includes(cell.then), cell.address);
    }
    assert.deepEqual(c.doubles, [], s.topicId);
  }
});

test("a hole is a field the script lacks; a script given that field loses the hole", () => {
  const s = structuredClone(live[0]);
  const before = compileScript(s).missing.filter((m) => m.path === "skills[0].explain[0].alts[0]");
  assert.equal(before.length, 1);
  s.skills[0].explain[0].alts = [{ hi: "Doosre shabdon mein: roti ke do barabar tukde.", en: "In other words: the roti in two equal pieces." }];
  assert.equal(compileScript(s).missing.filter((m) => m.path === "skills[0].explain[0].alts[0]").length, 0);
});

test("Loop's corrections: a compressed skill opens on one check that branches; the misconception column keys per mix-up", () => {
  const s = live[0];
  const sk = s.skills[0];
  const c = compileScript(s, { compressAt: { [sk.skillId]: sk.checks[0].id } });
  const u = c.order.find((x) => x.recheck);
  assert.equal(u.unit, `${sk.skillId}:check:${sk.checks[0].id}`);
  assert.equal(u.onRight, "skip");
  assert.ok(u.onMiss.length > 3 && !u.onMiss.includes(u.unit));
  assert.ok(u.because.some((b) => b.kind === "compress_fallback"));
  const mis = c.cells[`${sk.skillId}:check:${sk.checks[0].id}`].misconception.fresh;
  assert.equal(mis.remedy.byMixup, "misconception:<id>");
  assert.match(String(mis.remedy.default), /:rem:\d+$/);
});

test("cached by kit hash and plan hash", (t) => {
  t.after(() => clearCompiled());
  const a = compiledFor(live[0], { kitHash: "k1" });
  assert.equal(compiledFor(live[0], { kitHash: "k1" }), a);
  assert.notEqual(compiledFor(live[0], { kitHash: "k2" }), a);
  assert.notEqual(compiledFor(live[0], { kitHash: "k1", plan: { compress: [live[0].skills[0].skillId] } }), a);
});
