// engines-v1 review fixes (2026-10-03): grading binds only real answers, unbound mounts never carry an itemId,
// the module command step remounts instead of mixing params, predict intent survives adaptation, unbound
// fallbacks use the item's values, and the logic fixes (product entry, given pieces, south-India shadows).
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractValues, moduleCommands, planEngine } from "../shared/engine-catalog.js";
import * as MD from "../src/modules/frame/engines/multiplyDivide.logic.ts";
import * as PV from "../src/modules/frame/engines/placeValue.logic.ts";
import * as SKY from "../src/modules/frame/engines/sky.logic.ts";
import * as DG from "../src/modules/frame/engines/dataGraphs.logic.ts";
import * as NL from "../src/modules/frame/engines/numberLine.logic.ts";

const kitOf = (hint, topicId = "c4-maths-x") => ({ topicId, formats: { engineHints: [hint] } });
const item = (id, prompt_en, answer) => ({ id, prompt_en, answer, skillId: "s1" });

test("array plans grade the typed product, never the copied dimensions", () => {
  const p = planEngine({ kit: kitOf("array-builder"), item: item("i1", "What is 7 × 8?", "56") });
  assert.deepEqual([p.engine, p.params.mode, p.params.ask, p.bindItem], ["multiply-divide@1", "array", "product", true]);
  const c = MD.normalize(p.params);
  assert.equal(MD.arrayCorrect(c, 7, 8), true, "building 7×8 is possible …");
  assert.equal(MD.productCorrect(c, ""), false, "… but grades nothing without the total");
  assert.equal(MD.productCorrect(c, "54"), false);
  assert.equal(MD.productCorrect(c, "56"), true);
  const w = planEngine({ kit: kitOf("array-builder"), item: item("i2", "Eggs come in trays of 6. How many eggs are in 3 trays?", "18") });
  assert.equal(w.params.showExpr, false, "a word problem's expression is not shown");
  assert.equal(MD.normalize(w.params).showExpr, false);
});

test("share plans never bind (one each always reaches the fair share)", () => {
  const p = planEngine({ kit: kitOf("sharing-plates"), item: item("i3", "Share 12 mangoes equally among 4 children. How many each?", "3") });
  assert.equal(p.params.mode, "share");
  assert.equal(p.bindItem, false);
  assert.equal(p.itemId, null);
  assert.equal("itemId" in p.params, false);
  assert.equal(p.goal, undefined);
});

test("place-value: given pieces → read mode with counts (the numeral is never shown)", () => {
  const p = planEngine({ kit: kitOf("place-value-blocks", "c1-maths-x"), item: item("i4", "4 tens and 6 ones. Write the number.", "46") });
  assert.deepEqual([p.params.mode, p.params.counts, p.bindItem, p.params.value], ["read", [6, 4], true, undefined]);
  const c = PV.normalize(p.params);
  assert.equal(c.value, 46);
  assert.equal(PV.readCorrect(c, "46"), true);
  assert.equal(PV.readCorrect(c, "406"), false);
  const odd = PV.normalize({ mode: "read", counts: [14, 3] });
  assert.equal(odd.value, 44, "3 tens 14 ones");
  assert.equal(PV.normalize({ mode: "read", counts: [30] }).issues.length, 1, "a place holds at most 19 pieces");
});

test("planEngine: itemId and goal only when bound; predict kept apart from the engine's mode", () => {
  const kit = kitOf("number-line");
  const bound = planEngine({ kit, item: item("i5", "Round 3620 to the nearest 100.", "3600"), mode: "predict" });
  assert.equal(bound.bindItem, true);
  assert.equal(bound.params.mode, "place", "the engine's own mode");
  assert.equal(bound.params.predict, true, "the Director's predict intent");
  assert.equal(bound.predict, true, "→ awaitingReveal");
  assert.equal(bound.params.itemId, "i5");
  assert.equal(bound.itemId, "i5");
  assert.equal(bound.goal, "item:i5");
  assert.equal(NL.normalize(bound.params).hideAnswer, true);
  const already = planEngine({ kit, item: item("i6", "Round 3400 to the nearest 100.", "3400") });
  assert.equal(already.bindItem, false, "the marker would start on the answer");
  const zero = planEngine({ kit: kitOf("number-line-jumps"), item: item("i7", "On the number line, 5 − 5 = ?", "0") });
  assert.equal(zero.bindItem, false, "a landing on the line's end is unbound");
});

test("unbound fallback: the item's values reach the engine, or nothing mounts", () => {
  const p = planEngine({ kit: kitOf("place-value-chart"), item: item("i8", "How do we read 3,52,108 aloud?", "because of its place") });
  assert.equal(p.bindItem, false);
  assert.deepEqual(p.params.numbers, [352108]);
  assert.equal(PV.normalize(p.params).value, 352108, "not the demo 345");
  assert.equal(planEngine({ kit: kitOf("bar-graph-builder"), item: item("i9", "Why do we draw bars the same width?", "fair") }), null, "data-graphs has no data: no demo A/B/C mount");
  assert.equal(planEngine({ kit: kitOf("number-line-jumps"), item: item("i10", "What is a number line for?", "x") }), null);
  assert.deepEqual(extractValues("1,23,456 and 7/8 and 2.5"), { fractions: [[7, 8]], numbers: [123456, 2.5] });
  const sky = planEngine({ kit: kitOf("shadow_stick_sim", "c6-science-x"), item: item("i11", "Why is a shadow long in the evening?", "low Sun"), mode: "predict" });
  assert.equal(sky.engine, "sky@1", "science sims mount without item values");
  assert.equal(sky.params.predict, true);
});

test("moduleCommands: set_param only for the same engine, mode, keys, goal and binding; else remount", () => {
  const kit = kitOf("number-line");
  const a = planEngine({ kit, item: item("a", "Round 3620 to the nearest 100.", "3600") });
  const b = planEngine({ kit, item: item("b", "Round 4870 to the nearest 100.", "4900") });
  const first = moduleCommands(null, a, "m1");
  assert.deepEqual(first.cmds.map((c) => c.op), ["mount"]);
  assert.equal(first.cmds[0].goal, "item:a");
  assert.equal(first.module.itemId, "a");
  const next = moduleCommands(first.module, b, "m2");
  assert.deepEqual(next.cmds.map((c) => c.op), ["unmount", "mount"], "a new bound goal remounts (set_param cannot change init.goal)");
  assert.equal(next.module.itemId, "b");
  // an unbound plan on the same engine must not inherit the mounted item's id
  const u = planEngine({ kit, item: item("c", "Which is nearer to 3620: 3600 or 3700? Explain.", "3600, it is 20 away") });
  const step = moduleCommands(next.module, u, "m3");
  assert.equal(step.module.itemId, null);
  assert.ok(step.cmds.some((c) => c.op === "mount"));
  // same engine, same keys, same (no) goal, both unbound → set_param for the changed values only
  const u2 = { ...u, params: { ...u.params, numbers: [3700, 3600] } };
  const same = moduleCommands(step.module, u2, "m4");
  assert.deepEqual(same.cmds, [{ op: "set_param", moduleId: "m3", name: "numbers", value: [3700, 3600] }]);
  assert.equal(same.module.id, "m3");
  // a key that disappears (stale target / question) forces a remount
  const { numbers, ...fewer } = u.params;
  assert.deepEqual(moduleCommands(step.module, { ...u, params: fewer }, "m5").cmds.map((c) => c.op), ["unmount", "mount"]);
});

test("sky@1: the noon shadow points south where the Sun is north of the observer", () => {
  const chennaiJune = { latitude: 13.1, dayOfYear: 172 }; // declination ≈ 23.4° > 13.1°
  const delhiJune = { latitude: 28.6, dayOfYear: 172 };
  const chennaiMarch = { latitude: 13.1, dayOfYear: 80 };
  assert.equal(SKY.shadowDirection(12, chennaiJune), "south");
  assert.equal(SKY.shadowDirection(12, delhiJune), "north");
  assert.equal(SKY.shadowDirection(12, chennaiMarch), "north");
  assert.equal(SKY.shadowDirection(9, chennaiJune), "south-west");
  assert.equal(SKY.shadowDirection(15, chennaiJune), "south-east");
  assert.equal(SKY.shadowDirection(9), "north-west", "default observer unchanged");
});

test("data-graphs: the catalogue's readability rule matches the bar view's gridline step", () => {
  const catalogStep = (top) => [1, 2, 5, 10, 20, 25, 50, 100].find((m) => top / m <= 10) ?? 100;
  for (let top = 5; top <= 1000; top += 7) assert.equal(DG.gridStep(Math.max(5, top), 1), catalogStep(Math.max(5, top)), `top ${top}`);
  const p = planEngine({ kit: kitOf("bar-graph-builder"), item: item("i12", "Votes: Mango 37, Apple 12, Guava 20. How many more chose Mango than Apple?", "25") });
  assert.equal(p.bindItem, false, "37 sits between gridlines of 5: unreadable off the bars");
});
