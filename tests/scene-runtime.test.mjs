// scene@1 frame runtime vs the normative validator (docs/research/content/genui-scene-dsl.mjs): the frame's
// typed ports of EXPR@1 and the layout pass must give the validator's answers, or a scene the server passed
// could grade or draw differently on the phone. Also: the frame's structural check accepts every validated
// template and refuses markup, unknown kinds and broken expressions.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as REF from "../docs/research/content/genui-scene-dsl.mjs";
import { evalExpr, parseExpr } from "../src/modules/frame/scene/expr.ts";
import { layout } from "../src/modules/frame/scene/layout.ts";
import { checkScene } from "../src/modules/frame/scene/structure.ts";
import { draggablesOf, envOf, initialRT, probeOutcome, correctOption, correctOrder, goalsMet, accepts } from "../src/modules/frame/scene/runtime.ts";
import { corpus } from "./fixtures/scene-corpus.mjs";

const C = corpus();
const scenes = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, v.scene ?? v]));

test("EXPR@1 port: same AST and same values as the validator on 40 expressions", () => {
  const vals = { a: 3, b: 4.5, pick: "o2", s: true, angle: 45 };
  const state = { count: () => 2, has: () => true, at: () => "z1", order: () => "a,b,c" };
  const exprs = ["a + b * 2", "a ^ 2 ^ 2", "-a + 1", "!s || a > 2", "a >= 3 && b <= 4.5", "pick == 'o2'", "pick != 'o1'", "round(b, 0)", "clamp(a * 10, 0, 25)",
    "2 / tand(angle)", "sind(30) * 2", "sqrt(16) + abs(-3)", "a % 2", "a == 3.0000000001", "min(a, b, 1)", "max(a, b)", "floor(b) + ceil(b)", "lerp(0, 10, 0.25)",
    "a > 2 ? b : 0", "s ? 'yes' : 'no'", "count(z1) == 2", "has(z1, cow)", "at(cow) == 'z1'", "order(steps) == 'a,b,c'", "count(z1, item) + 1", "(a + b) * (a - b)",
    "atand(1)", "PI > 3", "true && !false", "a < 3", "a <= 3", "b > 4.5", "b >= 4.5", "2 / tand(45) > 2", "cosd(60) == 0.5", "1e2 + 1", ".5 + .5", "a - -1", "!(a > b)", "a * b / a"];
  for (const src of exprs) {
    assert.deepEqual(parseExpr(src), REF.parseExpr(src), `AST of ${src}`);
    assert.deepEqual(evalExpr(parseExpr(src), { vals, state }), REF.evalExpr(REF.parseExpr(src), { vals, state }), `value of ${src}`);
  }
  for (const bad of ["a +", "foo(1)", "'open", "a ? b", "1 $ 2", "x".repeat(161)]) {
    assert.throws(() => parseExpr(bad), `frame refuses ${bad.slice(0, 20)}`);
    assert.throws(() => REF.parseExpr(bad), `validator refuses ${bad.slice(0, 20)}`);
  }
});

test("layout port: every node box and repeat instance matches the validator on every template", () => {
  for (const [name, scene] of Object.entries(scenes)) {
    const env = { vals: Object.fromEntries(scene.vars.map((v) => [v.id, v.init])), state: { count: () => 0, has: () => false, at: () => "", order: () => "" } };
    for (const d of scene.derive) env.vals[d.id] = REF.evalExpr(REF.parseExpr(d.expr), env);
    const mine = layout(scene, env);
    const ref = REF.layout(scene, env);
    for (const [id, b] of ref.boxes) assert.deepEqual(mine.boxes.get(id), b, `${name}: box ${id}`);
    assert.deepEqual(mine.instances.map((q) => [q.id, q.box]), ref.instances.map((q) => [q.id, q.box]), `${name}: instances`);
  }
});

test("structure check: accepts all 7 validated templates, refuses tampering", () => {
  for (const [name, scene] of Object.entries(scenes)) assert.deepEqual(checkScene(scene).errors, [], name);
  const s = scenes["compare-choice@1"];
  const bad = (f) => { const x = structuredClone(s); f(x); return checkScene(x).errors; };
  assert.ok(bad((x) => (x.nodes[0].kind = "script")).length, "unknown kind");
  assert.ok(bad((x) => (x.meta.title.en = "<img src=x onerror=1>")).length, "markup in a string");
  assert.ok(bad((x) => (x.probe.correct = "pick == ")).length, "broken expression");
  assert.ok(bad((x) => x.nodes.push(...Array.from({ length: 80 }, (_, i) => ({ kind: "rect", id: `r${i}`, w: 1, h: 1 })))).length, "too many nodes");
  assert.ok(bad((x) => (x.dsl = "scene@9")).length, "wrong dsl");
  assert.ok(bad((x) => { delete x.probe; x.goals = []; }).length, "no goal or probe");
  assert.ok(checkScene("nope").errors.length && checkScene(null).errors.length);
});

test("runtime verdicts: solved states grade right, trap states carry their misconception, reveal finds the key", () => {
  // compare-choice: the probe is pick == 'right'
  const cc = scenes["compare-choice@1"];
  const drs = draggablesOf(cc);
  const rt = initialRT(cc, drs);
  assert.equal(probeOutcome(cc, envOf(cc, { ...rt, vals: { pick: "right" } }, drs)).correct, true);
  assert.deepEqual(probeOutcome(cc, envOf(cc, { ...rt, vals: { pick: "left" } }, drs)), { correct: false, misc: "MC.COUNT.SPREAD" });
  assert.equal(correctOption(cc, rt, drs, "ch"), "right");
  // sequence-steps: reveal finds the one correct order out of 24
  const sq = scenes["sequence-steps@1"];
  const sd = draggablesOf(sq);
  const srt = initialRT(sq, sd);
  assert.deepEqual(correctOrder(sq, srt, sd, "steps"), ["s_a", "s_b", "s_c", "s_d"]);
  assert.equal(probeOutcome(sq, envOf(sq, { ...srt, order: { steps: ["s_d", "s_c", "s_b", "s_a"] } }, sd)).misc, "MC.SEQ.REVERSED");
  // sort-bins: placements → has()/count() agree with the validator's own solver state model
  const sb = scenes["sort-bins@1"];
  const bd = draggablesOf(sb);
  const placed = { ...initialRT(sb, bd), place: { cow: "living", tree: "living", ball: "nonliving", book: "nonliving" } };
  const env = envOf(sb, placed, bd);
  assert.equal(probeOutcome(sb, env).correct, true);
  assert.deepEqual(goalsMet(sb, env), ["all_placed"]);
  const wrong = envOf(sb, { ...placed, place: { ...placed.place, ball: "living" } }, bd);
  assert.deepEqual(probeOutcome(sb, wrong), { correct: false, misc: "MC.LIVING.MOVES" });
  // the validator's solver agrees the probe is reachable and the trap never co-holds with correct
  const v = REF.lint(sb);
  assert.ok(v.ok && v.stats.probe.found);
  // count-group: zone caps and accepts
  const cg = scenes["count-group@1"];
  const cd = draggablesOf(cg);
  assert.equal(cd.length, 6, "6 mango instances are draggable");
  assert.ok(accepts(cg, initialRT(cg, cd), cd, cd[0], "g1"));
  const full = { ...initialRT(cg, cd), place: Object.fromEntries(cd.map((d, i) => [d.id, `g${(i % 2) + 1}`])) };
  assert.deepEqual(goalsMet(cg, envOf(cg, full, cd)), ["equal_groups"]);
  // slider-explore derive: shadow = 2 / tand(angle)
  const se = scenes["slider-explore@1"];
  const e20 = envOf(se, { ...initialRT(se, []), vals: { angle: 20 } }, []);
  assert.ok(Math.abs(e20.vals.shadow - 2 / Math.tan((20 * Math.PI) / 180)) < 1e-12);
  assert.deepEqual(goalsMet(se, envOf(se, { ...initialRT(se, []), vals: { angle: 80 } }, [])), ["target"]);
  // Forge choice-card: the code-derived correct id is the one reveal marks
  const ch = C["choice-card@1"];
  const cr = initialRT(ch.scene, []);
  assert.equal(correctOption(ch.scene, cr, [], "ch"), ch.correctId);
});
