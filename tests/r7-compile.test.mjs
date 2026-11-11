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

test("dc-r8-second-clarify-shows-not-rewords: a second clarify shows the board and re-says; a third is clarify/spent; alts[0] optional", () => {
  const s = structuredClone(live[0]);
  const sk = s.skills[0], b = sk.explain[0];
  const second = compileScript(s).cells[`${sk.skillId}:${b.id}:point`].clarify.heard;
  assert.deepEqual(second.say, ["skills[0].explain[0].point"]);
  assert.equal(second.show, "skills[0].explain[0].board");
  assert.equal(second.then, "checkin");
  assert.equal(second.help, "spent");
  assert.ok(second.secondClarify);
  const third = compileScript(s).cells[`${sk.skillId}:${b.id}:point`].clarify.spent;
  assert.deepEqual(third.say, []);
  assert.equal(third.then, "card");
  assert.ok(third.thirdClarify);
  // a script that authors alts[0] says it in place of the same line again
  b.alts = [{ hi: "Doosre shabdon mein: roti ke do barabar tukde.", en: "In other words: the roti in two equal pieces." }];
  assert.deepEqual(compileScript(s).cells[`${sk.skillId}:${b.id}:point`].clarify.heard.say, ["skills[0].explain[0].alts[0]"]);
  assert.ok(!compileScript(live[0]).missing.some((m) => /alts\[0\]/.test(m.path)), "alts[0] is never a hole");
});

test("no hole is silent: every missing field's cells compile to a named fallback, and the field is still listed", () => {
  for (const s of live) {
    const c = compileScript(s);
    for (const cs of Object.values(c.cells)) for (const hs of Object.values(cs)) for (const cell of Object.values(hs)) assert.ok(!cell.hole, cell.address);
    assert.equal(c.fallbacks.length > 0, c.missing.length > 0, s.topicId);
  }
  // the worked problem has no simpler: its clarify re-says it and shows its board (resay_show), and the field is listed for Learning
  const s = live[0], sk = s.skills[0];
  const cell = compileScript(s).cells[`${sk.skillId}:worked:problem`].clarify.fresh;
  assert.equal(cell.fallback, "resay_show");
  assert.deepEqual(cell.say, ["skills[0].workedExample.problem"]);
  assert.ok(compileScript(s).missing.some((m) => m.path === "skills[0].workedExample.simpler"));
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
