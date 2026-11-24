// r7 Games, Darpan · symmetry (mirror lines laid through a figure and folded; a turntable's smallest turn and the order of
// turn symmetry). Pure law checks: every generated level validates, its solver solves it, no idea-free set-up wins (shortcut
// null); an INDEPENDENT checker (its own reflection and rotation formulas over the figure's corner points, compared as point
// sets of the same colour; none of the law's symmetry code) agrees with the law over random play; each mal-rule's acts land
// on its OWN misconception moment; tampered params are refused; a claim in an act never decides; the generator is fast;
// and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { darpanLogic, DARPAN_MAL, malSetup, figureOf, mirrorWorld } from "../src/play/families/darpan/darpan.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = darpanLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = darpanLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const FIGS = ["rect", "rhombus", "kite", "tri", "square", "pentagon", "hexagon", "octagon", "star"];
// each case carries the topic's own mal-rule map (a level names a belief only among the ones its topic maps)
const CASES = [
  ["mirror", "lines", { figs: FIGS, upright: 0.3 }, ["exactly-one", "diagonals", "equal-halves"]],
  ["mirror", "lines", { figs: FIGS, upright: 0.45 }, ["vertical-only", "diagonals", "equal-halves"]],
  ["turn", "smallest", { ns: [2, 3, 4, 6, 8], chiral: 0.4 }, ["quarter-default", "full-turn"]],
  ["turn", "order", { ns: [2, 3, 4, 6, 8], chiral: 0.5 }, ["quarter-default", "full-turn", "mirror-only"]],
  ["turn", "smallest", { ns: [2, 3, 4, 5, 6, 8], chiral: 0.4, fine: true }, ["angle-order", "full-turn"]],
  ["turn", "order", { ns: [2, 3, 4, 5, 6, 8], chiral: 0.6, fine: true }, ["full-turn", "mirror-only"]],
];
const mapOf = (mals) => Object.fromEntries(mals.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "darpan", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 5, fade: 1, mis: {}, misMap: {}, grammar: {}, recent: [], seed, ...o });
const levelsOf = (mode, goal, grammar, mals, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of darpanLogic.generate(req(mode, goal, seed, { grammar, fade, misMap: mapOf(mals) }))) out.push(c);
  return out;
};

// ───────────────────────────── THE ORACLE (independent of the law's code) ─────────────────────────────
/** the figure's corner points with their colour (a multiset) */
const pointsOf = (p) => figureOf(p).flatMap((pc) => pc.pts.map(([x, y]) => [x, y, pc.kind]));
/** do two coloured point multisets match one to one (within 1e-5)? */
function samePoints(A, B) {
  if (A.length !== B.length) return false;
  const used = new Array(B.length).fill(false);
  for (const [x, y, k] of A) {
    const j = B.findIndex(([u, v, kk], i) => !used[i] && kk === k && Math.abs(u - x) < 1e-5 && Math.abs(v - y) < 1e-5);
    if (j < 0) return false;
    used[j] = true;
  }
  return true;
}
/** reflect over the line through the origin at `deg` (degrees): the line's direction (c, s); (x, y) → (x cos 2a + y sin 2a, x sin 2a − y cos 2a) */
const mirrorOk = (P, deg) => { const t = (2 * deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t); return samePoints(P.map(([x, y, k]) => [x * c + y * s, x * s - y * c, k]), P); };
/** turn by `deg` (either way: a symmetry turned one way is one turned the other) */
const turnOk = (P, deg) => { const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t); return samePoints(P.map(([x, y, k]) => [x * c - y * s, x * s + y * c, k]), P); };
/** the oracle's own answer for a level: the lines (candidate angles) a fold lands on, the smallest turn, the stops */
function truth(p) {
  const P = pointsOf(p);
  if (p.goal === "lines") return { lines: mirrorWorld(p).cands.map((a, i) => (mirrorOk(P, a) ? i : -1)).filter((i) => i >= 0) };
  let smallest = 360;
  for (let d = 1; d <= 360; d++) if (turnOk(P, d)) { smallest = d; break; }
  const stops = [];
  for (let d = 1; d <= 360; d++) if (turnOk(P, d)) stops.push(d);
  return { smallest, stops };
}
function oracle(p, su) {
  const t = truth(p);
  if (p.goal === "lines") return su.lines.length > 0 && JSON.stringify([...su.lines].sort((a, b) => a - b)) === JSON.stringify(t.lines);
  if (p.goal === "smallest") return su.angle === t.smallest;
  return JSON.stringify([...su.marks].sort((a, b) => a - b)) === JSON.stringify(t.stops);
}

test("darpan: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("darpan"));
  assert.deepEqual([...MODES.darpan], ["mirror", "turn", "tile"]);   // r7 tilings2: tile has its own logic (tests/r7-games-darpan-tile.test.mjs)
  assert.ok(FAMILY_ARTS.darpan.length === 4);
  for (const m of MODES.darpan) {
    if (m !== "tile") assert.equal(LOGIC[`darpan/${m}`], darpanLogic);
    const v = playActOf("darpan", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
  const data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).darpan;
  for (const m of MODES.darpan) assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json darpan/${m}`);
});

for (const [mode, goal, grammar, mals] of CASES) {
  test(`darpan/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; the oracle agrees; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar, mals);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = darpanLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(darpanLogic.shortcut(level), null, `${c.signature} shortcut`);
      const sol = darpanLogic.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(oracle(level.params, solved.s), `${c.signature}: the oracle disagrees with the solver`);
      if (goal !== "lines") assert.ok(truth(level.params).smallest < 360, `${c.signature}: a figure with turn symmetry`);
      for (const mal of DARPAN_MAL) {
        const acts = darpanLogic.malActs(level, mal);
        if (!mals.includes(mal)) { assert.equal(acts, null, `${c.signature}: ${mal} is not this topic's`); continue; }
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !oracle(level.params, r.s), `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = darpanLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of mals) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("darpan: mal-rule signatures are the beliefs (one line, the upright line only, a rectangle's diagonals, equal halves, a quarter turn, the full turn / the start counted, no mirror line so no symmetry, the order as degrees)", () => {
  const all = (goal) => ({ lines: ["exactly-one", "vertical-only", "diagonals", "equal-halves"], smallest: ["quarter-default", "full-turn", "angle-order"], order: ["quarter-default", "full-turn", "mirror-only"] })[goal];
  for (const [mode, goal, grammar, mals] of CASES) for (const c of levelsOf(mode, goal, grammar, mals, [3, 5])) {
    const p = darpanLogic.validate(c.level).params, t = truth(p);
    if (goal === "lines") {
      const { cands, fig } = mirrorWorld(p), deg = (ls) => ls.map((i) => cands[i]);
      const one = malSetup(p, "exactly-one", mals); if (one) { assert.equal(one.lines.length, 1); assert.ok(t.lines.includes(one.lines[0]) && t.lines.length >= 2); }
      const vo = malSetup(p, "vertical-only", mals); if (vo) { assert.deepEqual(deg(vo.lines).map((a) => Math.round(a)), [90]); assert.ok(t.lines.length >= 2); }
      const dg = malSetup(p, "diagonals", mals);
      if (dg) {
        assert.ok(["rect", "rhombus", "square"].includes(p.fig));
        // every corner's line is laid, and every true line
        for (const [x, y] of fig[0].pts) assert.ok(deg(dg.lines).some((a) => Math.abs(((Math.atan2(y, x) * 180) / Math.PI - a + 360) % 180) < 1e-6 || Math.abs(((Math.atan2(y, x) * 180) / Math.PI - a + 360) % 180 - 180) < 1e-6));
        for (const i of t.lines) assert.ok(dg.lines.includes(i));
      }
      const eh = malSetup(p, "equal-halves", mals); if (eh) { for (const i of t.lines) assert.ok(eh.lines.includes(i)); assert.ok(eh.lines.length > t.lines.length); }
    } else {
      const P = pointsOf(p), mirrorless = !Array.from({ length: 360 }, (_, d) => d / 2).some((a) => mirrorOk(P, a));
      const q = malSetup(p, "quarter-default", mals); if (q) goal === "smallest" ? assert.equal(q.angle, 90) : assert.deepEqual(q.marks, [90, 180, 270, 360]);
      const f = malSetup(p, "full-turn", mals); if (f) goal === "smallest" ? assert.equal(f.angle, 360) : assert.deepEqual(f.marks, [0, ...t.stops]);
      const mo = malSetup(p, "mirror-only", mals); if (mo) { assert.ok(mirrorless, `${c.signature}: mirror-only only on a figure with no mirror line`); assert.deepEqual(mo.marks, [360]); }
      const ao = malSetup(p, "angle-order", mals); if (ao) { assert.ok(p.fine); assert.equal(ao.angle, t.stops.length); }
    }
    void all;
  }
});

test("darpan: no idea-free set-up wins (the upright line, the level line, both, every fold line; one press, a quarter, the full turn; marks at every quarter or at the full turn only)", () => {
  for (const [mode, goal, grammar, mals] of CASES) for (const c of levelsOf(mode, goal, grammar, mals, [3, 5])) {
    const p = darpanLogic.validate(c.level).params, t = truth(p), su = (o) => ({ lines: [], angle: 0, marks: [], ...o });
    if (goal === "lines") {
      const { cands } = mirrorWorld(p), v = cands.findIndex((a) => Math.abs(a - 90) < 1e-6), h = cands.findIndex((a) => a < 1e-6);
      for (const ls of [[v], [h], [Math.min(v, h), Math.max(v, h)], cands.map((_, i) => i)]) if (ls.every((i) => i >= 0)) assert.ok(!oracle(p, su({ lines: ls })), `${c.signature}: ${ls} wins`);
      assert.ok(t.lines.length >= 1 && t.lines.length < cands.length);
    } else if (goal === "smallest") for (const a of [1, 15, 90, 360]) assert.ok(!oracle(p, su({ angle: a })), `${c.signature}: ${a}° wins`);
    else for (const m of [[90, 180, 270, 360], [360]]) assert.ok(!oracle(p, su({ marks: m })), `${c.signature}: ${m} wins`);
  }
});

test("darpan: the law's rules (a line only where a fold can run, a turn in the dial's steps and on the dial, marks only in order, a go needs a set-up and a change)", () => {
  const gen = (mode, goal, grammar = {}, seed = 11) => darpanLogic.validate(darpanLogic.generate(req(mode, goal, seed, { grammar }))[0].level);
  let s;
  const ap = (lv, a) => { const r = darpanLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  const mir = gen("mirror", "lines", { figs: ["rect", "hexagon"] }), { cands, sym } = mirrorWorld(mir.params);
  s = darpanLogic.init(mir);
  assert.equal(ap(mir, { kind: "run" }), "lines_first");
  assert.equal(ap(mir, { kind: "turn", by: 15 }), "no_turn");
  assert.equal(ap(mir, { kind: "mark" }), "no_mark");
  const off = [...Array(180).keys()].find((d) => cands.every((a) => Math.min(Math.abs(a - d), 180 - Math.abs(a - d)) > 3));
  if (off !== undefined) assert.equal(ap(mir, { kind: "line", deg: off }), "no_fold");
  assert.equal(ap(mir, { kind: "line", deg: "x" }), "no_fold");
  const wrong = cands.findIndex((_, i) => !sym.includes(i));
  assert.equal(ap(mir, { kind: "line", deg: cands[wrong] + 180 }), undefined, "a line is a line whichever way it is drawn");
  assert.deepEqual(s.lines, [wrong]);
  assert.equal(ap(mir, { kind: "run" }), "missed");
  assert.equal(ap(mir, { kind: "run" }), "change_first");
  assert.equal(ap(mir, { kind: "line", deg: cands[wrong] }), undefined, "pressed again, the line is lifted");
  assert.deepEqual(s.lines, []);
  for (const i of sym) ap(mir, { kind: "line", deg: Math.round(cands[i] * 10) / 10 });
  assert.equal(ap(mir, { kind: "run" }), undefined);
  assert.ok(s.done);
  assert.equal(ap(mir, { kind: "line", deg: 0 }), "level_over");
  const sm = gen("turn", "smallest", { ns: [3] });
  s = darpanLogic.init(sm);
  assert.equal(ap(sm, { kind: "run" }), "turn_first");
  assert.equal(ap(sm, { kind: "turn", by: 1 }), "no_such_turn", "a class-5 dial moves in 15° steps");
  assert.equal(ap(sm, { kind: "turn", by: -15 }), "off_dial");
  assert.equal(ap(sm, { kind: "turn", by: 375 }), "off_dial");
  assert.equal(ap(sm, { kind: "mark" }), "no_mark", "marks belong to the order goal");
  assert.equal(ap(sm, { kind: "line", deg: 0 }), "no_line");
  assert.equal(ap(sm, { kind: "turn", by: 90 }), undefined);
  assert.equal(ap(sm, { kind: "undo" }), undefined);
  assert.equal(s.angle, 0, "undo turns the dial back");
  const fine = gen("turn", "smallest", { ns: [5], fine: true });
  s = darpanLogic.init(fine);
  assert.equal(ap(fine, { kind: "turn", by: 1 }), undefined, "a degree dial moves in 1° steps");
  assert.equal(ap(fine, { kind: "turn", by: 2.5 }), "no_such_turn");
  const ord = gen("turn", "order", { ns: [3] });
  s = darpanLogic.init(ord);
  assert.equal(ap(ord, { kind: "run" }), "marks_first");
  assert.equal(ap(ord, { kind: "mark" }), undefined, "the start can be marked (a belief, not a stop)");
  assert.deepEqual(s.marks, [0]);
  assert.equal(ap(ord, { kind: "mark" }), undefined);
  assert.deepEqual(s.marks, [], "marked again, the mark comes off");
  assert.deepEqual(hiddenOf(ord), [3], "the teacher never says the order");
  assert.deepEqual(hiddenOf(sm), [120, "1/3"], "nor the smallest turn");
  assert.deepEqual(hiddenOf(mir), [sym.length], "nor the count of lines");
});

test("darpan: the laws by hand (a rectangle has two lines, not its diagonals; a rhombus has its diagonals; four blades in two colours land every half turn)", () => {
  const base = { v: "play@1", levelId: "t", family: "darpan", topicId: "t", skillId: "t-s1", fade: 1, targets: [], context: "darpan", seed: 1, proof: {} };
  const lv = (mode, params, mal = {}) => darpanLogic.validate({ ...base, mode, goal: params.goal, params, mal });
  const rect = lv("mirror", { goal: "lines", labels: 1, fig: "rect", a: 4, b: 2, c: 0, motif: "none", tilt: 30 }, mapOf(["exactly-one", "diagonals", "equal-halves"]));
  const rc = mirrorWorld(rect.params).cands;
  assert.equal(rc.length, 4);
  assert.deepEqual(mirrorWorld(rect.params).sym.map((i) => Math.round(rc[i])), [30, 120], "the mid-lines, turned with the card");
  const lay = (lvl, degs) => run(lvl, [...degs.map((deg) => ({ kind: "line", deg })), { kind: "run" }]);
  assert.ok(lay(rect, [30, 120]).s.done);
  const diag = lay(rect, rc.map((a) => Math.round(a * 10) / 10));
  assert.ok(!diag.s.done, "four lines on a rectangle is a square's answer");
  assert.ok(!lay(rect, [30]).s.done, "one line is not all of them");
  assert.equal(lay(rect, [30]).ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, undefined, "the upright-nearest line here is 120°, not 30°");
  assert.equal(lay(rect, [120]).ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "exactly-one");
  const rh = lv("mirror", { goal: "lines", labels: 1, fig: "rhombus", a: 3, b: 5, c: 0, motif: "none", tilt: 15 }, mapOf(["diagonals", "equal-halves"]));
  const hc = mirrorWorld(rh.params).cands;
  assert.deepEqual(mirrorWorld(rh.params).sym.map((i) => Math.round(hc[i])), [15, 105], "a rhombus folds on its corner-to-corner lines");
  assert.equal(darpanLogic.malActs(rh, "diagonals"), null, "the diagonals belief changes nothing on a rhombus");
  assert.ok(darpanLogic.malActs(rh, "equal-halves"), "but every line through its centre halves it");
  const pin = lv("turn", { goal: "smallest", labels: 1, fig: "pinwheel", n: 4, blade: "petal", colours: [1, 2, 1, 2], a: 5, b: 0, c: 0, start: 0, fine: false });
  const turn = (lvl, by) => run(lvl, [{ kind: "turn", by }, { kind: "run" }]);
  assert.ok(!turn(pin, 90).s.done, "a quarter turn puts a red blade on a blue one");
  assert.ok(turn(pin, 180).s.done);
  const ord = lv("turn", { goal: "order", labels: 1, fig: "pinwheel", n: 6, blade: "hook", colours: [1, 2, 1, 2, 1, 2], a: 5, b: 0, c: 0, start: 0, fine: false });
  const marks = (lvl, ms) => { const acts = []; let at = 0; for (const m of ms) { if (m !== at) acts.push({ kind: "turn", by: m - at }); at = m; acts.push({ kind: "mark" }); } return run(lvl, [...acts, { kind: "run" }]); };
  assert.ok(marks(ord, [120, 240, 360]).s.done, "six hooked blades in two colours: order 3");
  assert.ok(!marks(ord, [0, 120, 240, 360]).s.done, "the start is not a stop");
  assert.ok(!marks(ord, [60, 120, 180, 240, 300, 360]).s.done, "counting blades is not counting landings");
  const par = lv("turn", { goal: "order", labels: 1, fig: "parallelogram", n: 2, blade: "petal", colours: [], a: 3, b: 2, c: 1, start: 0, fine: true }, mapOf(["full-turn", "mirror-only"]));
  assert.ok(marks(par, [180, 360]).s.done, "a parallelogram lands on itself after half a turn");
  assert.equal(marks(par, [360]).ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "mirror-only", "no fold line, so 'no symmetry'");
});

test("darpan: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}) => darpanLogic.generate(req(mode, goal, 6, { grammar }))[0].level;
  const rect = g("mirror", "lines", { figs: ["rect"] }), hex = g("mirror", "lines", { figs: ["hexagon"] }), sm = g("turn", "smallest", { ns: [3] }), ord = g("turn", "order", { ns: [6] });
  const par = darpanLogic.generate(req("turn", "order", 6, { grammar: { chiral: 1, fine: true } })).find((c) => c.level.params.fig === "parallelogram").level;
  for (const lv of [rect, hex, sm, ord, par]) assert.ok(darpanLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [rect, { a: rect.params.b }], [rect, { tilt: 7 }], [rect, { tilt: 180 }], [rect, { fig: "circle" }], [rect, { motif: "alt" }], [rect, { a: 40 }], [rect, { goal: "order" }], [rect, { a: "4" }],
    [hex, { b: 2 }], [hex, { motif: "dot" }], [hex, { a: 2 }],
    [sm, { n: 7 }], [sm, { colours: [1, 1] }], [sm, { colours: [1, 1, 9] }], [sm, { blade: "sword" }], [sm, { start: 10 }], [sm, { colours: [1, 1, 1], n: 3, a: 5, fig: "pinwheel", blade: "petal", c: 2 }],
    [ord, { colours: [1, 2, 3, 4, 5, 6] }], [ord, { n: 5, colours: [1, 1, 1, 1, 1] }],
    [par, { c: 0 }], [par, { n: 3 }], [par, { colours: [1, 2] }],
  ]) assert.equal(darpanLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  // a figure with no turn symmetry (one blade's colour differs from all the rest) is never a turn level
  assert.equal(darpanLogic.validate(bad(ord, { colours: [1, 2, 2, 2, 2, 2] })), null);
  assert.equal(darpanLogic.validate({ ...rect, mode: "turn" }), null, "a goal belongs to its mode");
  assert.equal(darpanLogic.validate({ ...rect, params: null }), null);
});

test("darpan: a claim in an act never decides; the first go decides the evidence; grade replays", () => {
  for (const [mode, goal, grammar, mals] of CASES) {
    const level = darpanLogic.validate(darpanLogic.generate(req(mode, goal, 4, { grammar, misMap: mapOf(mals) }))[0].level);
    const forged = darpanLogic.grade(level, env([{ kind: "run", solved: true, correct: true, verdict: "solved" }]));
    assert.notEqual(forged.verdict, "solved");
    assert.notEqual(forged.evidence[0]?.outcome, "correct");
    const ok = darpanLogic.grade(level, env(darpanLogic.solve(level)));
    assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
    const mal = mals.map((m) => darpanLogic.malActs(level, m)).find(Boolean);
    if (!mal) continue;
    const back = mal.filter((a) => a.kind !== "run").map(() => ({ kind: "undo" }));
    const wrong = [...mal, ...back, ...darpanLogic.solve(level)];
    const g = darpanLogic.grade(level, env(wrong));
    assert.equal(g.evidence[0].outcome, "incorrect", `${goal}: the first go decides`);
    assert.deepEqual(darpanLogic.grade(level, env(wrong)), g);
  }
});

// ≥ 2000 random acts per case: the law never throws; whenever a go is judged the law's verdict equals the oracle on the
// set-up that went; a solved level always agrees with the oracle; the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar, mals] of CASES) {
  test(`darpan/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the go's verdict ⇔ the independent oracle; never throws; generator work bounded (counted, not timed)`, () => {
    let seed = 23, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const candCounts = []; // candidates per generate/pick: a count, not a clock (tests/_work.mjs)
    for (let gi = 0; gi < 40; gi++) {
      let cands = [];
      cands = darpanLogic.generate(req(mode, goal, 100 + gi, { grammar, misMap: mapOf(mals) }));
      candCounts.push(cands.length);
      for (const c of cands.slice(0, 3)) {
        const level = darpanLogic.validate(c.level), p = level.params, sol = darpanLogic.solve(level);
        const lineDegs = goal === "lines" ? mirrorWorld(p).cands : [];
        let s = darpanLogic.init(level), k = 0;
        const pursue = rnd() < 0.4;
        for (let i = 0; i < 60 && !s.done; i++) {
          const r = rnd();
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.35 ? (goal === "lines" ? { kind: "line", deg: rnd() < 0.8 ? lineDegs[Math.floor(rnd() * lineDegs.length)] : Math.floor(rnd() * 360) } : { kind: "turn", by: (rnd() < 0.5 ? -1 : 1) * [1, 15, 30, 45, 60, 90, 120, 180][Math.floor(rnd() * 8)] })
              : r < 0.6 ? { kind: "mark" }
                : r < 0.85 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true, correct: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = darpanLogic.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, oracle(p, before), `${level.levelId}: law and oracle disagree on ${JSON.stringify([before.lines, before.angle, before.marks])}`);
          }
          s = out.state;
        }
        if (darpanLogic.goalMet(level, s)) { solved++; assert.ok(oracle(p, s)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(Math.max(...candCounts) <= 60, `${Math.max(...candCounts)} candidates per call (measured 2026-11-10: 20; bound is 3x)`);
  });
}

// the fold law against the oracle on every subset of fold lines of many figures (random play rarely lays a full set)
test("darpan/mirror: every set of fold lines on many figures, the law ⇔ the oracle", () => {
  let agree = 0, wins = 0;
  for (const c of levelsOf("mirror", "lines", { figs: FIGS, upright: 0.4 }, [], [1, 2, 3])) {
    const level = darpanLogic.validate(c.level), { cands } = mirrorWorld(level.params);
    const n = Math.min(cands.length, 8);
    for (let mask = 1; mask < 1 << n; mask++) {
      const ls = [...Array(n).keys()].filter((i) => mask & (1 << i));
      const out = run(level, [...ls.map((i) => ({ kind: "line", deg: cands[i] })), { kind: "run" }]);
      assert.equal(out.s.done, oracle(level.params, { lines: ls }), `${c.signature}: ${ls}`);
      agree++; if (out.s.done) wins++;
    }
  }
  assert.ok(agree > 2000 && wins > 50, `agree ${agree}, wins ${wins}`);
});

// the play server: every darpan coverage entry serves a proven level at every fade (levelsFor and currentLevel); the
// solver's acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const DE = () => coverage().entries.filter((e) => e.family === "darpan" && e.mode !== "tile");   // r7 tilings2: tile entries are tested in r7-games-darpan-tile
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("darpan coverage: the six authored entries, mapped to real kit misconceptions; the symmetry topics admitted by skill", () => {
  assert.deepEqual(DE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c4-maths-ch11-t01|mirror|lines", "c5-maths-ch10-t01|turn|smallest", "c5-maths-ch10-t01|turn|order", "c6-maths-ch09-t01|mirror|lines", "c6-maths-ch09-t02|turn|smallest", "c6-maths-ch09-t02|turn|order"]);
  for (const e of DE()) for (const kit of Object.values(e.misMap)) assert.ok(kit.startsWith(`${e.topicId}-m`), kit);
  for (const sk of ["c4-maths-ch11-t01-s1", "c4-maths-ch11-t01-s2", "c4-maths-ch11-t01-s3", "c5-maths-ch10-t01-s1", "c5-maths-ch10-t01-s2",
    "c6-maths-ch09-t01-s1", "c6-maths-ch09-t01-s2", "c6-maths-ch09-t02-s1", "c6-maths-ch09-t02-s2"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "darpan", sk);
  }
  // completing a figure across a mirror stays nazariya's
  assert.equal(entryFor({ skillId: "c6-maths-ch09-t01-s3" }).family, "nazariya");
});

test("darpan: engine words sit before vakya's (vakya's stay last), every key the view uses exists in all three languages", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/darpan/darpan.view.ts`, "utf8");
  const used = [...view.matchAll(/"(darpan\.[a-zA-Z.]+)"/g)].map((m) => m[1]);
  assert.ok(used.length >= 12);
  for (const k of used) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/darpan/darpan.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// r7 tilings2: the mirror and turn worlds are unchanged by the tile mode: the generator's output over every rule, seeds
// 1-30 and fades 1-3 hashes the same as before it, and the levels served to two children per entry are the same levels
test("darpan: the mirror and turn levels are pinned (generator hash and served levelIds, before the tile mode)", async () => {
  const { createHash } = await import("node:crypto");
  const { RULES } = await import("../server/play/tools/rules/darpan.mjs");
  const h = createHash("sha256"); let n = 0;
  for (const r of RULES.filter((x) => x.mode !== "tile")) for (let seed = 1; seed <= 30; seed++) for (const fade of [1, 2, 3]) {
    const misMap = Object.fromEntries(Object.entries(r.misMap).map(([k, v]) => [k, `${r.topicId}-m-${v}`]));
    for (const c of darpanLogic.generate({ family: "darpan", mode: r.mode, goal: r.goal, topicId: r.topicId, skillId: "x", classLevel: 5, fade, mis: {}, misMap, grammar: r.grammar, recent: [], seed })) { h.update(JSON.stringify([c.signature, c.difficulty, c.level])); n++; }
  }
  assert.equal(n, 10800);
  assert.equal(h.digest("hex").slice(0, 16), "bcbf413f2eb9d6c7");
  const ids = [];
  for (const e of DE()) for (const child of ["c1", "c2"]) ids.push(currentLevel(sessionOf(e, { childId: child, seed: seedOf(child, entryKey(e), 0) }), e).levelId);
  assert.deepEqual(ids, ["darpan-lines:square:4,0,0:two:0-330364004", "darpan-lines:square:4,0,0:two:0-128133950", "darpan-smallest:parallelogram:2:petal::2,2,2:45:15-600399233",
    "darpan-smallest:parallelogram:2:petal::2,3,1:15:15-174554476", "darpan-order:parallelogram:2:petal::2,1,2:45:15-631996513", "darpan-order:parallelogram:2:petal::2,2,2:90:15-430827502",
    "darpan-lines:rhombus:2,6,0:arrow:135-188056240", "darpan-lines:rhombus:5,3,0:arrow:45-787547670", "darpan-smallest:parallelogram:2:petal::4,3,1:15:1-694632511",
    "darpan-smallest:parallelogram:2:petal::3,1,2:15:1-859930138", "darpan-order:parallelogram:2:petal::2,2,1:45:1-656852485", "darpan-order:parallelogram:2:petal::2,1,1:0:1-493829646"]);
});

for (const e of DE()) for (const fade of [1, 2, 3]) {
  test(`darpan server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "darpan" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.labels, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(darpanLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && darpanLogic.malActs(level, m));
        const mg = gradeActs(level, env(darpanLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}
