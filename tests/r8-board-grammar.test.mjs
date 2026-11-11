// Round 8 board grammar (C1 Studio, docs/design/round8/BOARD-GRAMMAR-GAP.md items 1-6, and Learning's to-studio 006 answer
// marks): stacked fractions anywhere text goes, roles on ops (focus / slot / answer / mixup / muted) drawn by shape, the
// brace op, the legend, the mix-up marker, the relation line, the `mark` on four templates, and the greyscale predicate
// rolesByShape. Every pilot topic's board still builds and still fits the tray at p360, p412 and l1366.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normalizeScript, lintScript, textBox, fractionRuns, opGeometry, opTextSizes, scriptTokens, rolesByShape, ROLE, ROLES, MEANING_ROLES, TEXT_SIZE, stackNumeral,
} from "../shared/whiteboard.js";
import { expand, BOARD_WORDS } from "../server/forge/explainer/templates.js";
import { resolveBoardRef, refNumbersOf, BOARD_REFS } from "../server/forge/explainer/board-ref.js";
import { certifyForTray, contractBox } from "../server/forge3/tray-gate.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";
import { lineStatesKey, statesKeyAnyLang, fracSay } from "../server/forge/explainer/states-key.js";
import * as BF from "../server/stagecraft/board-first.js";
import { textUnits } from "../src/studio/boardFit.ts";

const board = (ops, h = 300) => ({ v: 1, scriptId: "t", line: { lessonId: "" }, anchor: "line_audio_start", board: { w: 400, h, ground: "chalk" }, mode: "fresh", durationMs: 4000, ops });
const T = (id, text, at, extra = {}) => ({ id, op: "text", at, text, size: "m", startMs: 0, endMs: 200, ...extra });
const ok = (call, opts) => { const x = expand(call, opts); assert.ok(x.ok, `${call.template}: ${x.errors}`); return x.script; };
const roles = (sc) => new Set(sc.ops.map((o) => o.role).filter(Boolean));

describe("item 1: a stacked fraction anywhere text goes", () => {
  it("a simple fraction (b ≤ 12) is stacked; b = 13, a decimal or a date-like run is not", () => {
    assert.ok(fractionRuns("1/4", "s"));
    assert.ok(fractionRuns("3/6 = 1/2", "s"));
    assert.ok(fractionRuns("har hissa 1/5", "s"), "inside a short label");
    assert.equal(fractionRuns("1/13", "s"), null);
    assert.equal(fractionRuns("2.5/4", "s"), null);
    assert.equal(fractionRuns("12/10/2024", "s"), null);
    assert.equal(fractionRuns("15 cm", "s"), null);
  });
  it("textBox gives the stack's real size: about twice a line's height", () => {
    const line = textBox("14", "s"), st = textBox("1/4", "s");
    assert.ok(st.h > line.h * 1.8, `${st.h} vs ${line.h}`);
    // centred on where the player writes the line (its `at` row)
    const b = textBox("1/4", "m", [100, 100]);
    assert.ok(Math.abs(b.y + b.h / 2 - 100) < 0.01);
  });
  it("the drawing: numerator, a thin rule, denominator; numwork's fraction layout uses the same drawing", () => {
    const g = opGeometry(T("a", "1/4", [100, 100]));
    assert.deepEqual(g.texts.map((t) => t.text), ["1", "4"]);
    assert.equal(g.paths.length, 1);
    assert.ok(g.widths[0] >= 1.6 && g.widths[0] < 3, "the rule is about 0.065 em, never a hairline");
    assert.ok(g.texts[0].y < 100 && g.texts[1].y > 100, "numerator over the rule, denominator under");
    const nw = opGeometry({ id: "f", op: "numwork", at: [100, 100], layout: "fraction", rows: [["1"], ["4"]], startMs: 0, endMs: 100 });
    assert.equal(nw.paths.length, 1);
    assert.ok(nw.widths[0] >= 1.6 && nw.paths[0].startsWith("M") && /L/.test(nw.paths[0]));
  });
  it("the fit and legibility predicates count the numeral's own px (never below the s size)", () => {
    const op = T("a", "1/4", [100, 100]);
    assert.deepEqual(opTextSizes(op), [stackNumeral(TEXT_SIZE.m), stackNumeral(TEXT_SIZE.m)]);
    assert.ok(stackNumeral(TEXT_SIZE.s) >= TEXT_SIZE.s);
    assert.equal(Math.min(...textUnits({ ops: [op] })), stackNumeral(TEXT_SIZE.m));
  });
  it("an equation row stacks its fractions and its box holds them", () => {
    const op = { id: "e", op: "numwork", at: [40, 200], layout: "equation", rows: [["2/3", "×", "3/5", "=", "?"]], startMs: 0, endMs: 100 };
    const g = opGeometry(op);
    assert.equal(g.paths.length, 2);
    assert.ok(g.box.y <= 200 - 22 && g.box.y + g.box.h >= 200 + 22);
  });
  it("the overlap lint sees the taller text", () => {
    const s = normalizeScript(board([T("a", "1/4", [100, 100]), T("b", "x", [100, 128], { size: "s" })]), { strict: true }).script;
    assert.ok(lintScript(s).some((i) => i.check === "text_overlap"));
  });
});

describe("item 2: roles on ops", () => {
  it("one exported constant names the roles; muted is not a meaning role", () => {
    assert.deepEqual([...ROLES].sort(), ["answer", "focus", "mixup", "muted", "slot"]);
    assert.ok(!MEANING_ROLES.includes(ROLE.muted));
  });
  it("the validator keeps a role, refuses an unknown one, a mix-up box and a slot line", () => {
    const n = normalizeScript(board([{ id: "r", op: "rect", at: [10, 10], w: 40, h: 40, fill: "accent", role: "focus", startMs: 0, endMs: 300 }]), { strict: true });
    assert.equal(n.script.ops[0].role, "focus");
    assert.ok(!normalizeScript(board([{ id: "r", op: "rect", at: [10, 10], w: 40, h: 40, role: "given", startMs: 0, endMs: 300 }]), { strict: true }).ok);
    assert.ok(!normalizeScript(board([{ id: "r", op: "rect", at: [10, 10], w: 40, h: 40, role: "mixup", startMs: 0, endMs: 300 }]), { strict: true }).ok);
    assert.ok(!normalizeScript(board([{ id: "l", op: "line", from: [10, 10], to: [90, 10], role: "slot", startMs: 0, endMs: 300 }]), { strict: true }).ok);
  });
  it("shapes belong to the role: a mix-up line is dashed, a slot box dashed; slot and answer never share a board", () => {
    const s = normalizeScript(board([{ id: "l", op: "line", from: [10, 10], to: [90, 10], role: "mixup", startMs: 0, endMs: 300 }, { id: "r", op: "rect", at: [10, 40], w: 30, h: 30, role: "slot", startMs: 0, endMs: 300 }]), { strict: true }).script;
    assert.ok(s.ops.every((o) => o.dashed === true));
    const both = normalizeScript(board([T("a", "?", [50, 50], { role: "slot" }), T("b", "4", [150, 50], { role: "answer" })]), { strict: true });
    assert.ok(!both.ok && both.errors.includes("roles_slot_and_answer"));
  });
  it("a slot's \"?\" is drawn in a dashed box, part of its own drawing (the fit and lint see it)", () => {
    const g = opGeometry(T("a", "?", [100, 100], { role: "slot" }));
    assert.equal(g.dashed[0], true);
    assert.ok(g.slotFill);
    assert.ok(g.box.w > textBox("?", "m").w + 8);
  });
  it("templates: shaded parts are focus, the cuts between unshaded parts muted, the asked \"?\" a slot", () => {
    const fp = ok({ template: "fraction-parts@1", parts: 4, shade: 1, whole: "bar" });
    assert.ok(fp.ops.filter((o) => o.op === "rect" && o.fill).every((o) => o.role === "focus"));
    assert.ok(fp.ops.some((o) => o.op === "line" && o.role === "muted"));
    const fb = ok({ template: "fraction-bars@1", bars: [{ parts: 2, shade: 1, label: "1/2" }, { parts: 4, shade: 0, label: "?" }] });
    assert.ok(fb.ops.some((o) => o.op === "text" && o.text === "?" && o.role === "slot"));
    const fl = ok({ template: "fraction-line@1", den: 4, to: 1, mark: 1 });
    assert.ok(fl.ops.some((o) => o.text === "?" && o.role === "slot"));
    const sg = ok({ template: "shade-grid@1", rows: 2, cols: 3, shade: 2, hideResult: true });
    assert.deepEqual([...roles(sg)].sort(), ["focus", "muted"]);
  });
});

describe("item 3: the brace op", () => {
  it("names a span; its label is written as its own text op (every gate reads it)", () => {
    const s = normalizeScript(board([{ id: "b", op: "brace", from: [40, 100], to: [160, 100], side: "up", label: "1/2", role: "focus", startMs: 0, endMs: 400 }]), { strict: true }).script;
    const lab = s.ops.find((o) => o.id === "b.l");
    assert.ok(lab && lab.op === "text" && lab.text === "1/2" && lab.role === "focus");
    assert.equal(s.ops.find((o) => o.id === "b").labelId, "b.l");
    assert.ok(lab.at[1] < 100 - 16, "the label sits past the apex");
    assert.ok(scriptTokens(s).includes("1/2"));
    // re-normalising a normalised script keeps it as it is (the gates normalise again)
    const again = normalizeScript(s, { strict: true });
    assert.ok(again.ok);
    assert.equal(again.script.ops.length, s.ops.length);
  });
  it("is refused when too short or its label would leave the board; overlaps a word → lint", () => {
    assert.ok(!normalizeScript(board([{ id: "b", op: "brace", from: [40, 100], to: [50, 100], startMs: 0, endMs: 400 }]), { strict: true }).ok);
    assert.ok(!normalizeScript(board([{ id: "b", op: "brace", from: [40, 10], to: [160, 10], side: "up", label: "1/2", startMs: 0, endMs: 400 }]), { strict: true }).ok);
    const s = normalizeScript(board([{ id: "b", op: "brace", from: [40, 100], to: [160, 100], side: "down", startMs: 0, endMs: 400 }, T("w", "word", [100, 106])]), { strict: true }).script;
    assert.ok(lintScript(s).some((i) => i.check === "text_overlap"));
  });
  it("fraction-parts names its shaded group with a brace, not a fraction beside it", () => {
    const s = ok({ template: "fraction-parts@1", parts: 4, shade: 2, whole: "bar" });
    const b = s.ops.find((o) => o.op === "brace");
    assert.ok(b && b.role === "focus");
    assert.equal(s.ops.find((o) => o.id === b.labelId).text, "2/4");
  });
});

describe("item 4: the legend", () => {
  it("one row per meaning role used, below the figure, ≤ 24 chars, in the board's language", () => {
    const plain = { template: "fraction-bars@1", bars: [{ parts: 2, shade: 1, label: "1/2" }, { parts: 4, shade: 0, label: "?" }] };
    const call = { ...plain, legend: true };
    const en = ok(call), hi = ok({ ...call, lang: "hi" });
    const words = (s) => s.ops.filter((o) => o.op === "text" && o.ink === "soft" && o.align === "start").map((o) => o.text);
    assert.deepEqual(words(en), ["shaded part", "your answer"]);
    assert.deepEqual(words(hi), ["rangin hissa", "tumhara jawab"]);
    const legendTop = Math.min(...en.ops.filter((o) => o.op === "text" && o.align === "start").map((o) => o.at[1]));
    assert.ok(en.ops.filter((o) => o.op === "rect" && o.role === "focus" && o.h > 20).every((o) => o.at[1] + o.h < legendTop));
    assert.ok(words(en).every((t) => [...t].length <= 24));
    assert.ok(BOARD_WORDS.includes("answer") && BOARD_WORDS.includes("jawab"), "its words are template words for the live gate");
    assert.equal(words(ok({ ...call, legend: false })).length, 0);
    assert.equal(words(ok({ template: "fraction-parts@1", parts: 4, shade: 1, whole: "bar", mixup: "4 parts make the whole", legend: false })).length, 0);
    // (main 2026-11-10: the default on every full board with 2+ meaning roles — Learning's checker takes BOARD_WORDS; a split
    // panel or picture view passes legend: false, tests/r8-held-board and r8-picture-turn)
    assert.deepEqual(words(ok(plain)), ["shaded part", "your answer"]);
    assert.equal(words(ok({ template: "fraction-bars@1", bars: [{ parts: 2, shade: 1, label: "1/2" }] })).length, 0, "one meaning role: no legend");
    assert.deepEqual(words(ok({ ...plain, mixup: "same size, more parts" })), ["shaded part", "your answer", "easy to mix up"]);
  });
  it("swatches draw each role's shape (the legend survives greyscale too)", () => {
    const s = ok({ template: "fraction-parts@1", parts: 4, shade: 2, whole: "bar", mixup: "4 quarters make the whole", relation: { lhs: "1/2", op: "×", rhs: "1/4" } });
    assert.ok(s.ops.some((o) => o.op === "rect" && o.role === "slot" && o.dashed));
    assert.ok(s.ops.some((o) => o.op === "line" && o.role === "mixup" && o.dashed));
    assert.ok(s.board.h > 300, "the board grows; nothing is cut");
  });
});

describe("item 5: the mix-up marker", () => {
  it("is a dashed mix-up line with its words, under the whole / on the gaps / on the boundary", () => {
    for (const call of [{ template: "fraction-parts@1", parts: 4, shade: 2, whole: "bar" }, { template: "fraction-parts@1", parts: 3, shade: 1, whole: "circle" },
      { template: "fraction-bars@1", bars: [{ parts: 4, shade: 1, label: "1/4" }] }, { template: "fraction-line@1", den: 4, to: 2, hop: { num: 3 } },
      { template: "measured@1", shape: "rect", w: 6, h: 4, unit: "cm" }]) {
      const s = ok({ ...call, mixup: "count the gaps" });
      const line = s.ops.find((o) => o.id === "mix");
      assert.ok(line && line.role === "mixup" && line.dashed, call.template);
      const words = s.ops.filter((o) => o.op === "text" && o.role === "mixup");
      assert.equal(words.map((o) => o.text).join(" "), "count the gaps");
      const fig = Math.max(...s.ops.filter((o) => o.op !== "text" && o.role !== "mixup" && !["highlight", "move", "follow", "erase"].includes(o.op) && !(o.op === "rect" && o.h < 20) && !(o.op === "line" && o.from[1] === o.to[1] && o.to[0] - o.from[0] <= 22)).map((o) => opGeometry(o, new Map(s.ops.map((x) => [x.id, x]))).box).map((b) => b.y + b.h));
      assert.ok(line.points[0][1] >= fig - 1, `${call.template}: the marker is under the figure`);
    }
  });
  it("never states the open card's key (in digits or in words), nor its own asked value", () => {
    const base = { template: "fraction-parts@1", parts: 4, shade: 2, whole: "bar" };
    assert.deepEqual(expand({ ...base, hideResult: true, mixup: "aadha nahi" }).errors, ["mixup_states_key"]);
    assert.deepEqual(expand({ ...base, hideResult: true, mixup: "not one half" }).errors, ["mixup_states_key"]);
    assert.deepEqual(expand({ ...base, mixup: "4 quarters make the whole" }, { keys: ["4"] }).errors, ["mixup_states_key"]);
    assert.ok(expand({ ...base, mixup: "4 quarters make the whole" }, { keys: ["2"] }).ok);
    assert.deepEqual(expand({ template: "fraction-line@1", den: 4, to: 1, mark: 1, mixup: "ek-chauthai nahi" }).errors, ["mixup_states_key"]);
    assert.deepEqual(expand({ ...base, mixup: "x".repeat(33) }).errors, ["mixup"]);
    assert.deepEqual(expand({ ...base, mixup: "what is it?" }).errors, ["mixup"]);
  });
  it("lineStatesKey moved to a pure module, re-exported by board-first unchanged", () => {
    assert.equal(BF.lineStatesKey, lineStatesKey);
    assert.equal(BF.fracSay, fracSay);
    assert.ok(statesKeyAnyLang("two quarters", ["1/2"]) && statesKeyAnyLang("a half", ["2/4"]) && !statesKeyAnyLang("four quarters", ["1/2"]));
  });
  it("the live gate (W9) refuses a mix-up marker that states a withheld key in words", () => {
    const s = normalizeScript(board([{ id: "m", op: "line", from: [40, 200], to: [200, 200], role: "mixup", startMs: 0, endMs: 300 }, T("w", "yeh aadha hai", [120, 230], { role: "mixup", size: "s" })]), { strict: true }).script;
    const g = gateWhiteboard(s, { reply: "yeh aadha hai", speechMs: 8000, withhold: { values: ["1/2"] } });
    assert.equal(g.checks.find((c) => c.id === "W9.no_reveal").pass, false);
  });
});

describe("item 6: the relation under a figure", () => {
  it("writes lhs = ? op rhs from the board's own parts, the asked term a slot, the named term in focus", () => {
    const s = ok({ template: "fraction-parts@1", parts: 4, shade: 2, whole: "bar", relation: { lhs: "1/2", op: "×", rhs: "1/4" } });
    const rel = s.ops.filter((o) => o.op === "text" && ["1/2", "=", "?", "×", "1/4"].includes(o.text) && o.at[1] > 160);
    assert.deepEqual(rel.map((o) => o.text), ["1/2", "=", "?", "×", "1/4"]);
    assert.equal(rel[2].role, "slot");
    assert.equal(rel[0].role, "focus");
    assert.ok(!s.ops.some((o) => o.op === "text" && o.text === "2" && o.at[1] > 160), "the answer (2) is never written");
  });
  it("is refused when false, not the board's own, or with nothing asked", () => {
    const base = { template: "fraction-parts@1", parts: 4, shade: 2, whole: "bar" };
    assert.deepEqual(expand({ ...base, relation: { lhs: "1/2", op: "×", rhs: "1/3" } }).errors, ["relation_not_board"]);
    assert.deepEqual(expand({ ...base, relation: { lhs: "1/4", op: "×", rhs: "1/2" } }).errors, ["relation_false"]);
    assert.deepEqual(expand({ ...base, relation: { lhs: "1/2", op: "<", rhs: "1/4" } }).errors, ["relation_slot"]);
    assert.deepEqual(expand({ ...base, relation: { lhs: "1/2", op: "=", rhs: "2/4" } }).errors, ["relation_slot"]);
    assert.ok(expand({ template: "fraction-bars@1", bars: [{ parts: 2, shade: 1, label: "1/2" }, { parts: 4, shade: 2, label: "?" }], relation: { lhs: "1/2", op: "=", rhs: "?" } }).ok);
  });
  it("its asked value is a key the mix-up never states", () => {
    assert.deepEqual(expand({ template: "fraction-parts@1", parts: 4, shade: 2, whole: "bar", relation: { lhs: "1/2", op: "×", rhs: "1/4" }, mixup: "2 quarters" }).errors, ["mixup_states_key"]);
  });
});

describe("Learning's to-studio 006: the answer mark", () => {
  const marks = [
    [{ template: "compare@1", left: { title: "Anil", items: ["₹60"] }, right: { title: "Bina", items: ["₹70"] }, mark: { side: "right" } }, "highlight"],
    [{ template: "compare@1", left: { title: "Anil", items: ["₹60"] }, right: { title: "Bina", items: ["2 pens"] }, mark: { side: "right", add: "₹85" } }, "text"],
    [{ template: "compare@1", left: { title: "Anil", items: ["a", "b"] }, right: { title: "Bina", items: ["c"] }, mark: { side: "left", item: 1 } }, "highlight"],
    [{ template: "angle@1", angles: [{ deg: 60, name: "A" }, { deg: 110, name: "B" }], mark: { index: 1, show: "bigger" } }, "highlight"],
    [{ template: "angle@1", angles: [{ deg: 35 }], mark: { index: 0, show: "deg" } }, "text"],
    [{ template: "number-line-hop@1", start: 2, hops: [3, 3], mark: { land: true } }, "text"],
    [{ template: "number-line-hop@1", start: 2, hops: [3, 3], mark: { hop: 0 } }, "text"],
    [{ template: "place-value@1", value: 2864, mark: { place: "hundreds", value: true } }, "text"],
    [{ template: "place-value@1", value: 2864, mark: { place: "tens" } }, null],
  ];
  it("each template draws its mark in the answer role, readable by shape (a ring or a tick)", () => {
    for (const [call, kind] of marks) {
      const s = ok(call);
      assert.ok(s.ops.some((o) => o.role === "answer"), call.template);
      if (kind) assert.equal(s.ops.find((o) => o.id === "mark").op, kind, JSON.stringify(call.mark));
      assert.ok(rolesByShape(s).ok, `${call.template}: ${rolesByShape(s).why}`);
      assert.ok(s.facts.onScreen.marked, "the facts row says what is marked");
      for (const vp of ["p360", "p412", "l1366"]) assert.ok(certifyForTray({ kind: "whiteboard", script: s }, { vp, box: contractBox(vp) }).ok, `${call.template} ${vp}`);
    }
  });
  it("the mark shows the value: place value's 8 → 800, the landing, the degrees, the added item", () => {
    const pv = ok(marks[7][0]);
    assert.equal(pv.ops.find((o) => o.id === "mark").text, "8 → 800");
    assert.equal(ok(marks[5][0]).ops.find((o) => o.id === "mark").text, "8");
    assert.equal(ok(marks[6][0]).ops.find((o) => o.id === "mark").text, "5");
    assert.equal(ok(marks[4][0]).ops.find((o) => o.id === "mark").text, "35°");
  });
  it("a bad mark is refused (never silently dropped)", () => {
    assert.ok(!expand({ ...marks[0][0], mark: { side: "middle" } }).ok);
    assert.ok(!expand({ ...marks[0][0], mark: { side: "right", add: "?" } }).ok);
    assert.ok(!expand({ ...marks[3][0], mark: { index: 5 } }).ok);
    assert.ok(!expand({ ...marks[5][0], hideResult: true }).ok, "an answer mark never with hideResult");
    assert.ok(!expand({ ...marks[7][0], mark: { place: "lakhs" } }).ok, "no lakhs digit in 2864");
  });
  it("numbers-shown: the mark's drawn value is an authored number", () => {
    assert.ok(refNumbersOf(resolveBoardRef(marks[7][0]).call).includes("800"));
    assert.ok(refNumbersOf(resolveBoardRef(marks[5][0]).call).includes("8"));
    assert.ok(refNumbersOf(resolveBoardRef(marks[4][0]).call).includes("35"));
    assert.ok(refNumbersOf(resolveBoardRef(marks[1][0]).call).includes("85"));
  });
  it("W9 allows the number an authored answer board's mark shows, and nothing else", () => {
    const s = ok(marks[7][0]);
    const ctx = { reply: "8 ki value 800 hai", speechMs: 9000, withhold: { values: ["800"] } };
    assert.equal(gateWhiteboard(s, { ...ctx, authoredRef: true }).checks.find((c) => c.id === "W9.no_reveal").pass, true);
    assert.equal(gateWhiteboard(s, ctx).checks.find((c) => c.id === "W9.no_reveal").pass, false, "a planner's board cannot buy a reveal with a role");
    // an answer-role op that is not the mark's value is still judged: a reveal elsewhere on the board still fails
    const t = { ...s, ops: [...s.ops, { id: "x", op: "text", at: [60, 290], text: "800", size: "s", startMs: 100, endMs: 200 }] };
    assert.equal(gateWhiteboard(t, { ...ctx, authoredRef: true }).checks.find((c) => c.id === "W9.no_reveal").pass, false);
  });
  it("BOARD_REFS documents every new param", () => {
    for (const t of ["compare@1", "angle@1", "number-line-hop@1", "place-value@1"]) assert.match(BOARD_REFS[t].params, /mark\?/);
    for (const t of ["fraction-parts@1", "fraction-bars@1", "fraction-line@1", "measured@1"]) assert.match(BOARD_REFS[t].params, /mixup\?/);
    for (const t of ["fraction-parts@1", "fraction-bars@1"]) assert.match(BOARD_REFS[t].params, /relation\?/);
  });
});

describe("rolesByShape: the meaning survives greyscale", () => {
  const rect = (id, extra) => ({ id, op: "rect", at: [20, 20], w: 60, h: 40, startMs: 0, endMs: 300, ...extra });
  it("passes a board with focus, slot and mix-up, and one with focus, answer and mix-up", () => {
    assert.deepEqual(rolesByShape(ok({ template: "fraction-parts@1", parts: 4, shade: 2, whole: "bar", mixup: "4 quarters make the whole", relation: { lhs: "1/2", op: "×", rhs: "1/4" } })), { ok: true, why: "" });
    const s = normalizeScript(board([rect("f", { fill: "accent", role: "focus" }), { id: "m", op: "line", from: [20, 100], to: [200, 100], role: "mixup", startMs: 0, endMs: 300 },
      T("a", "8", [300, 50], { role: "answer" })]), { strict: true }).script;
    assert.deepEqual(rolesByShape(s), { ok: true, why: "" });
  });
  it("fails all four roles on one board (slot and answer share a colour, so a board is posing or answering)", () => {
    const all4 = board([rect("f", { fill: "accent", role: "focus" }), { id: "m", op: "line", from: [20, 100], to: [200, 100], dashed: true, role: "mixup", startMs: 0, endMs: 300 },
      T("s", "?", [300, 50], { role: "slot" }), T("a", "8", [300, 150], { role: "answer" })]);
    assert.match(rolesByShape(all4).why, /slot_and_answer/);
  });
  it("fails two roles sharing a shape, and a role op without its shape", () => {
    // a mix-up drawn as a dashed box beside a slot: two dashed boxes
    assert.match(rolesByShape(board([T("s", "?", [300, 50], { role: "slot" }), rect("m", { dashed: true, role: "mixup" })])).why, /mixup_not_dashed-open|shares_slot/);
    // a solid slot box, an unfilled focus box, a solid mix-up line
    assert.match(rolesByShape(board([rect("s", { role: "slot" })])).why, /slot/);
    assert.match(rolesByShape(board([rect("f", { role: "focus" })])).why, /focus/);
    assert.match(rolesByShape(board([{ id: "m", op: "line", from: [20, 100], to: [200, 100], role: "mixup", startMs: 0, endMs: 300 }])).why, /mixup/);
    // an unmarked dashed line where a mix-up is present reads as a second mix-up
    assert.match(rolesByShape(board([{ id: "m", op: "line", from: [20, 100], to: [200, 100], dashed: true, role: "mixup", startMs: 0, endMs: 300 },
      { id: "x", op: "line", from: [20, 140], to: [200, 140], dashed: true, startMs: 0, endMs: 300 }])).why, /ink_shares_mixup/);
  });
});

describe("the four pilot topics' boards (board, boardRef, answerBoard)", () => {
  const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];
  const refs = [];
  for (const p of PILOTS) {
    const seen = new Set();
    const walk = (o) => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk);
      for (const [k, v] of Object.entries(o)) { if ((k === "boardRef" || k === "answerBoard" || k === "board") && v && typeof v === "object" && v.template && !seen.has(JSON.stringify(v))) { seen.add(JSON.stringify(v)); refs.push([p, v]); } walk(v); } };
    walk(JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${p}.json`, import.meta.url), "utf8")));
  }
  it("every one builds, reads by shape, and fits the tray at p360, p412 and l1366", () => {
    assert.ok(refs.length > 150, `${refs.length} refs`);
    const bad = [];
    for (const [p, ref] of refs) {
      const r = resolveBoardRef(ref);
      if (!r.ok) { bad.push(`${p} ${JSON.stringify(ref)}: ${r.why}`); continue; }
      const x = expand(r.call);
      const rs = rolesByShape(x.script);
      if (!rs.ok) bad.push(`${p} ${JSON.stringify(ref)}: roles ${rs.why}`);
      for (const vp of ["p360", "p412", "l1366"]) { const c = certifyForTray({ kind: "whiteboard", script: x.script }, { vp, box: contractBox(vp) }); if (!c.ok) bad.push(`${p} ${vp} ${JSON.stringify(ref)}: ${c.why}`); }
    }
    assert.deepEqual(bad, []);
  });
});

describe("Learning 007 (c6-ch07-t05 s3 rem2.then): a compare answer mark under a stacked mixed fraction", () => {
  it("rows are spaced by the tallest cell, so the added answer line never overlaps the stacked fraction above it", () => {
    const s = ok({ template: "compare@1", left: { title: "Pehla", items: ["1 1/4 litre"] }, right: { title: "Doosra", items: ["2 1/2 litre"] }, mark: { side: "right", add: "jawab: 3 3/4 litre" } });
    assert.equal(lintScript(s).filter((i) => i.check === "text_overlap").length, 0);
    const plain = ok({ template: "compare@1", left: { title: "Living", items: ["grow", "breathe"] }, right: { title: "Non-living", items: ["do not grow"] } });
    const ys = plain.ops.filter((o) => o.op === "text" && /^c0/.test(o.id)).map((o) => o.at[1]);
    assert.equal(ys[1] - ys[0], 52, "plain words keep the old pitch");
  });
});
