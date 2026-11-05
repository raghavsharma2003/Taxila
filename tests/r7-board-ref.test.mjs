// Round 7 (main, dc-r7-teaching-scripts): the board-ref vocabulary a lesson script's explain beat names. Every listed
// template renders from its example; an unknown or out-of-range ref is refused with its reason; `{ auto: true }` is the
// code's own pick; certifyBoardRef runs the full whiteboard gate against the beat's line.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BOARD_REFS, resolveBoardRef, certifyBoardRef } from "../server/forge/explainer/board-ref.js";

const kit = JSON.parse(fs.readFileSync("data/kits/c5-maths.json", "utf8")).topics.find((t) => t.topicId === "c5-maths-ch02-t01");

test("board refs: every template in the vocabulary renders from its own example", () => {
  assert.ok(Object.keys(BOARD_REFS).length >= 20);
  for (const [template, d] of Object.entries(BOARD_REFS)) {
    const r = resolveBoardRef({ template, ...d.example });
    assert.ok(r.ok, `${template}: ${r.why}`);
  }
});

test("board refs: unknown and out-of-range refs are refused with a reason; withhold 'item' hides the result", () => {
  assert.match(resolveBoardRef({ template: "volcano@9" }).why, /unknown_template/);
  assert.equal(resolveBoardRef({ template: "fraction-line@1", den: 40 }).ok, false);
  assert.equal(resolveBoardRef(null).ok, false);
  assert.equal(resolveBoardRef({ template: "equal-groups@1", groups: 3, each: 4, withhold: "item" }).call.hideResult, true);
  assert.deepEqual(resolveBoardRef({ auto: true }, { kit }).call, { template: "fraction-line@1", den: 5, target: [2, 5], show: true });
});

test("board refs: certify runs the full gate (the line must say what the board shows)", async () => {
  const ok = await certifyBoardRef({ template: "fraction-line@1", den: 5, target: [2, 5], show: true }, { kit, line: kit.workedExample.steps.join(" ") });
  assert.equal(ok.ok, true, JSON.stringify(ok.failed));
  const item = kit.items.find((i) => i.id.endsWith("-i03"));
  const leak = await certifyBoardRef({ template: "fraction-line@1", den: 5, target: [3, 5], show: true }, { kit, item, line: item.prompt_en });
  assert.equal(leak.ok, false, "a ref that places the asked fraction is refused");
  assert.ok(leak.failed.includes("W9.no_reveal"));
});

test("board-first preselect builds the board a scripted beat names (intent.boardRef), else the code's own pick", async () => {
  const BF = await import("../server/stagecraft/board-first.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const k6 = kitFromFile(getTopic("c6-maths-ch06-t01"));
  const ask = (id, boardRef) => ({ intent: { intentId: id, lessonId: id.split(":wb:")[0], kind: "whiteboard", beat: "explain", style: { band: "B3" }, ...(boardRef ? { boardRef } : {}) },
    line: { lessonId: id.split(":wb:")[0], text: "" }, mode: "fresh", kit: { topicId: k6.topicId, content: [k6.expectations[0]] } });
  const ref = { template: "measured@1", shape: "rect", w: 50, h: 30, unit: "m", trace: true };
  const p = BF.preselect(ask("sref1:wb:1", ref), { kit: k6 });
  assert.equal(p?.by, "script", JSON.stringify(p && { by: p.by, template: p.template }));
  assert.equal(p.template, "measured@1");
  // (gated like any board: a side that is some item's answer is written "?" until her line says it)
  assert.match(JSON.stringify(p.facts), /m/);
  // Brain's nested form is the same ref
  assert.equal(resolveBoardRef({ template: "measured@1", params: { shape: "rect", w: 50, h: 30, unit: "m" } }).ok, true);
  // a ref that cannot render falls back to the code's pick (never no board because of a bad ref)
  const before = BF.scriptRefStats().failed;
  const q = BF.preselect(ask("sref2:wb:1", { template: "measured@1", shape: "rect", w: -1, h: 3, unit: "m" }), { kit: k6 });
  assert.equal(BF.scriptRefStats().failed, before + 1);
  assert.notEqual(q?.by, "script");
});

test("W4 reads a list's commas as separators, a thousands comma as part of the number (Learning: '7, 3, 3, 3')", async () => {
  const { numbersIn } = await import("../server/studio/qa/whiteboard.js");
  const n = [...numbersIn("7, 3, 3, 3 and 45,000 and 1,00,000")];
  for (const v of ["7", "3", "45000", "100000"]) assert.ok(n.includes(v), v);
  assert.ok(!n.some((v) => v.includes(",")));
});

test("director4 S1/S2: a scripted explain step gets its board even as a 'continue' ask, with every authored number shown", async () => {
  const BF = await import("../server/stagecraft/board-first.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const ask = (t, ref, kind, n) => { const kit = kitFromFile(getTopic(t)); const it = kit.items[0];
    return [{ intent: { intentId: `d4-${n}:wb:1`, lessonId: `d4-${n}`, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: { scriptId: "s", beatId: `e${n}`, kind } },
      line: { lessonId: `d4-${n}`, text: "" }, mode: "continue", kit: { topicId: t, content: [], item: { id: it.id, prompt_en: it.prompt_en } } }, kit]; };
  const pick = (...a) => { const [q, kit] = ask(...a); return BF.preselect(q, { kit }); };
  const c5 = pick("c5-maths-ch02-t01", { template: "fraction-line@1", params: { den: 2, from: 0, to: 1, marks: [{ num: 1, label: "1/2" }] } }, "explain", 1);
  assert.equal(c5?.by, "script", "S1: Brain's one 'explain' beat id made steps 2-3 'continue': no board at all");
  assert.deepEqual(c5.screen, { template: "fraction-line@1", shape: "number line", numbers: ["0", "1", "1/2"], labels: ["1/2"] });
  const tri = pick("c6-maths-ch06-t01", { template: "measured@1", params: { shape: "triangle", unit: "cm", sides: [4, 5, 6], trace: true } }, "explain", 2);
  assert.equal(tri?.by, "script");
  assert.ok(["4", "5", "6"].every((v) => tri.screen.numbers.includes(v)), `S2: no '? cm' (${JSON.stringify(tri.screen)})`);
  assert.equal(tri.screen.shape, "triangle");
  const pent = pick("c6-maths-ch06-t01", { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [4, 5, 3, 6, 2] } }, "worked", 3);
  assert.deepEqual(pent.screen.numbers, ["4", "5", "3", "6", "2"]);
  // a check beat still withholds: the named mark is "?"
  const chk = pick("c5-maths-ch02-t01", { template: "fraction-line@1", params: { den: 3, from: 0, to: 1, mark: 1 } }, "check", 4);
  assert.ok(!chk.screen.numbers.includes("1/3"));
  // certify: a ref whose board leaves the line's measures off fails
  const bare = await certifyBoardRef({ template: "shape@1", shape: "pentagon" }, { line: "Ek paanch bhujaon wali kyaari: 4 m, 5 m, 3 m, 6 m, 2 m." });
  assert.ok(bare.failed.some((f) => f.startsWith("line_measures_not_on_board")));
});
