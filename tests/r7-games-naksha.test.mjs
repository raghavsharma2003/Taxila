// r7 Games, Naksha · maps and grids (a drone sent to a latitude / longitude; a rider programmed through a street grid with
// screen arrows, N / E / S / W on a map whose north may point anywhere, or forward / left / right; a truck's fuel against
// the map scale; a garden fence copied on a dot grid). Pure law checks: every generated level validates, its solver
// solves it, no idea-free set-up wins (shortcut null); an INDEPENDENT brute simulator (its own direction tables, its own
// road measure, its own fence comparison by unit segments; none of the law's helpers) agrees with the law over random
// play; each mal-rule's acts land on its OWN misconception moment; tampered params are refused; a claim in an act never
// decides; the generator is fast; and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nakshaLogic, NAKSHA_MAL, malSetup } from "../src/play/families/naksha/naksha.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const ALL = Object.fromEntries(NAKSHA_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "naksha", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 5, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = nakshaLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = nakshaLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["locate", "fix", { step: 10 }],
  ["locate", "fix", { east: true }],
  ["route", "steps", { cols: [5, 6], rows: [5, 5] }],
  ["route", "turns", { cols: [4, 5], rows: [5, 6] }],
  ["route", "compass", { cols: [5, 7], rows: [5, 6] }],
  ["scale", "fuel", { ks: [2, 5, 10], unit: "km", cap: 150 }],
  ["scale", "fuel", { ks: [4, 5, 10, 20], unit: "km", cap: 200 }],
  ["scale", "reach", { ks: [2, 3, 4, 5], unit: "m", cap: 60 }],
  ["shape", "copy", { shapes: ["rect", "L"] }],
];
const EXPECT = (goal, grammar) => ({ fix: grammar.east ? ["flip-ns"] : ["swap-latlong", "flip-ns", "flip-ew"], steps: ["order-swap", "counts-start"], turns: ["own-left-right"],
  compass: ["east-west-swap", "north-is-up"], fuel: ["map-is-real", "add-scale", "straight-line"], reach: ["map-is-real", "add-scale"], copy: ["count-dots"] })[goal];
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of nakshaLogic.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE ORACLE (independent of the law's code) ─────────────────────────────
const MOVE = { n: [0, 1], e: [1, 0], s: [0, -1], w: [-1, 0] };
const CW = { n: "e", e: "s", s: "w", w: "n" }, CCW = { n: "w", w: "s", s: "e", e: "n" };
/** a rider walked square by square: does the program end on the house without ever stepping into a pond or off the map? */
function rideOk(p, prog) {
  let x = p.start[0], y = p.start[1], face = p.heading;
  const pond = new Set(p.rocks.map(([a, b]) => `${a},${b}`));
  for (const st of prog) {
    if (st === "l") { face = CCW[face]; continue; }
    if (st === "r") { face = CW[face]; continue; }
    let d;
    if (st === "f") d = face;
    else if (p.goal === "compass") { d = st; for (let k = 0; k < ["n", "e", "s", "w"].indexOf(p.north); k++) d = CW[d]; }
    else d = st;
    x += MOVE[d][0]; y += MOVE[d][1];
    if (x < 0 || y < 0 || x >= p.cols || y >= p.rows || pond.has(`${x},${y}`)) return false;
  }
  return x === p.home[0] && y === p.home[1];
}
/** a fence as its unit lattice segments, moved to the origin (null: a slanted side or a segment walked twice) */
function segsOf(poly) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
    if (ax !== bx && ay !== by) return null;
    const n = Math.abs(bx - ax) + Math.abs(by - ay), sx = Math.sign(bx - ax), sy = Math.sign(by - ay);
    for (let k = 0; k < n; k++) { const x = ax + sx * k, y = ay + sy * k; out.push(sx ? [Math.min(x, x + sx), y, "h"] : [x, Math.min(y, y + sy), "v"]); }
  }
  const keys = out.map((s) => s.join());
  if (new Set(keys).size !== keys.length) return null;
  return out;
}
const norm = (segs) => {
  const pts = segs.flatMap(([x, y, o]) => [[x, y], o === "h" ? [x + 1, y] : [x, y + 1]]);
  const mx = Math.min(...pts.map((q) => q[0])), my = Math.min(...pts.map((q) => q[1]));
  return segs.map(([x, y, o]) => `${x - mx},${y - my},${o}`).sort().join(" ");
};
/** a quarter turn of a segment set: (x, y) → (−y, x) */
const turnSegs = (segs) => segs.map(([x, y, o]) => (o === "h" ? [-y, x, "v"] : [-y - 1, x, "h"]));
function fenceOk(model, corners) {
  if (corners.length < 3) return false;
  const a = segsOf(corners);
  if (!a || !a.length) return false;
  let b = segsOf(model);
  for (let r = 0; r < 4; r++) { if (norm(a) === norm(b)) return true; b = turnSegs(b); }
  return false;
}
function oracle(p, su) {
  switch (p.goal) {
    case "fix": return !!su.at && su.at[0] === p.target[0] && su.at[1] === p.target[1];
    case "steps": case "compass": case "turns": return rideOk(p, su.prog);
    case "fuel": { let cm = 0; for (let i = 1; i < p.road.length; i++) cm += Math.abs(p.road[i][0] - p.road[i - 1][0]) + Math.abs(p.road[i][1] - p.road[i - 1][1]); return su.value === cm * p.k; }
    case "reach": return !!su.at && su.at[0] * p.k === p.fuel;
    case "copy": return fenceOk(p.model, su.corners);
  }
  throw new Error(p.goal);
}

test("naksha: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("naksha"));
  assert.deepEqual([...MODES.naksha], ["locate", "route", "scale", "shape"]);
  assert.ok(FAMILY_ARTS.naksha.length === 4);
  for (const m of MODES.naksha) {
    assert.equal(LOGIC[`naksha/${m}`], nakshaLogic);
    const v = playActOf("naksha", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
  const data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).naksha;
  for (const m of MODES.naksha) assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json naksha/${m}`);
});

for (const [mode, goal, grammar] of CASES) {
  test(`naksha/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = nakshaLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(nakshaLogic.shortcut(level), null, `${c.signature} shortcut`);
      const sol = nakshaLogic.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(oracle(level.params, solved.s), `${c.signature}: the oracle disagrees with the solver`);
      for (const mal of NAKSHA_MAL) {
        const acts = nakshaLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !oracle(level.params, r.s), `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = nakshaLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of EXPECT(goal, grammar)) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("naksha: mal-rule signatures are the beliefs (numbers on the wrong lines, hemispheres, counts swapped, start counted, E / W, north up, my left, scale ignored / added, straight line, dots for gaps)", () => {
  for (const c of levelsOf("locate", "fix", { step: 10 })) {
    const p = nakshaLogic.validate(c.level).params, [x, y] = p.target;
    const sw = malSetup(p, "swap-latlong"); if (sw) assert.deepEqual(sw.at, [Math.sign(x) * Math.abs(y), Math.sign(y) * Math.abs(x)]);
    const ns = malSetup(p, "flip-ns"); if (ns) assert.deepEqual(ns.at, [x, -y]);
    const ew = malSetup(p, "flip-ew"); if (ew) assert.deepEqual(ew.at, [-x, y]);
  }
  for (const c of levelsOf("route", "steps", { cols: [5, 6], rows: [5, 5] })) {
    const p = nakshaLogic.validate(c.level).params, sol = nakshaLogic.solve({ ...c.level, params: p }).filter((a) => a.kind === "step").map((a) => a.dir);
    const count = (prog, d) => prog.filter((s) => s === d).length;
    const cs = malSetup(p, "counts-start");
    if (cs) for (const d of new Set(sol)) assert.ok(count(cs.prog, d) >= count(sol, d) + 1, `${c.signature}: one more ${d} per run`);
    const os = malSetup(p, "order-swap");
    if (os) { const [h, v] = [sol.find((d) => d === "e" || d === "w"), sol.find((d) => d === "n" || d === "s")]; assert.equal(count(os.prog, h), count(sol, v)); assert.equal(count(os.prog, v), count(sol, h)); }
  }
  for (const c of levelsOf("route", "compass", { cols: [5, 7], rows: [5, 6] })) {
    const p = nakshaLogic.validate(c.level).params, sol = nakshaLogic.solve({ ...c.level, params: p }).filter((a) => a.kind === "step").map((a) => a.dir);
    const ew = malSetup(p, "east-west-swap"); if (ew) assert.deepEqual(ew.prog, sol.map((d) => ({ e: "w", w: "e" })[d] ?? d));
    const nu = malSetup(p, "north-is-up"); if (nu) assert.notEqual(p.north, "n", "north-is-up shows only where north is not up");
  }
  for (const c of levelsOf("route", "turns", { cols: [4, 5], rows: [5, 6] })) {
    const p = nakshaLogic.validate(c.level).params, sol = nakshaLogic.solve({ ...c.level, params: p }).filter((a) => a.kind === "step").map((a) => a.dir);
    const m = malSetup(p, "own-left-right");
    if (!m) continue;
    // the same program but with left and right swapped on the turns made facing down the page, and only there
    let face = p.heading;
    sol.forEach((s, i) => { if (s === "l" || s === "r") { assert.equal(m.prog[i], face === "s" ? ({ l: "r", r: "l" })[s] : s); face = (s === "l" ? CCW : CW)[face]; } else assert.equal(m.prog[i], s); });
  }
  for (const c of levelsOf("scale", "fuel", { ks: [2, 5, 10], unit: "km", cap: 150 })) {
    const p = nakshaLogic.validate(c.level).params, want = nakshaLogic.solve({ ...c.level, params: p })[0].value, cm = want / p.k;
    const mr = malSetup(p, "map-is-real"); if (mr) assert.equal(mr.value, cm);   // null only where another belief gives the same fuel
    const ad = malSetup(p, "add-scale"); if (ad) assert.equal(ad.value, cm + p.k);
    const sl = malSetup(p, "straight-line");
    if (sl) { const [a, b] = [p.road[0], p.road[p.road.length - 1]]; assert.equal(sl.value, Math.hypot(b[0] - a[0], b[1] - a[1]) * p.k); assert.ok(sl.value < want); }
  }
  for (const c of levelsOf("scale", "reach", { ks: [2, 3, 4, 5], unit: "m", cap: 60 })) {
    const p = nakshaLogic.validate(c.level).params;
    const mr = malSetup(p, "map-is-real"); if (mr) assert.deepEqual(mr.at, [p.fuel, 0]);
    const ad = malSetup(p, "add-scale"); if (ad) assert.deepEqual(ad.at, [p.fuel - p.k, 0]);
  }
  for (const c of levelsOf("shape", "copy", { shapes: ["rect", "L"] })) {
    const p = nakshaLogic.validate(c.level).params, m = malSetup(p, "count-dots");
    if (!m) continue;
    assert.equal(p.model.length, 4, "count-dots only on a rectangle");
    const xs = p.model.map((q) => q[0]), ys = p.model.map((q) => q[1]), mx = m.corners.map((q) => q[0]), my = m.corners.map((q) => q[1]);
    assert.equal(Math.max(...mx) - Math.min(...mx), Math.max(...xs) - Math.min(...xs) - 1);
    assert.equal(Math.max(...my) - Math.min(...my), Math.max(...ys) - Math.min(...ys) - 1);
  }
});

test("naksha: no idea-free set-up wins (a corner of the map or the 0° crossing, one straight run, the scale's number or a full tank, the road's ends, a small square)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const p = nakshaLogic.validate(c.level).params, su = (o) => ({ at: null, prog: [], value: 0, corners: [], ...o });
    if (goal === "fix") for (const x of [p.lon[0], p.lon[1]]) for (const y of [p.lat[0], p.lat[1]]) assert.ok(!oracle(p, su({ at: [x, y] })), `${c.signature}: a corner wins`);
    if (goal === "fix") assert.ok(p.target[0] !== 0 && p.target[1] !== 0, "never on the Equator or the Prime Meridian");
    if (["steps", "compass", "turns"].includes(goal)) for (const d of goal === "turns" ? ["f"] : ["n", "e", "s", "w"]) for (let n = 1; n <= 8; n++) assert.ok(!oracle(p, su({ prog: Array(n).fill(d) })), `${c.signature}: ${n} × ${d} wins`);
    if (goal === "fuel") for (const v of [p.k, p.max]) assert.ok(!oracle(p, su({ value: v })), `${c.signature}: fuel ${v} wins`);
    if (goal === "reach") assert.ok(!oracle(p, su({ at: [1, 0] })), `${c.signature}: the first cm wins`);
    if (goal === "copy") for (const s of [1, 2]) assert.ok(!oracle(p, su({ corners: [[1, 1], [1 + s, 1], [1 + s, 1 + s], [1, 1 + s]] })), `${c.signature}: a ${s} square wins`);
  }
});

test("naksha: the law's rules (puts on the map only, steps from the goal's own buttons, a go needs a set-up and a change, the gauge, the fence's corners)", () => {
  const gen = (mode, goal, grammar = {}, seed = 11) => nakshaLogic.validate(nakshaLogic.generate(req(mode, goal, seed, { grammar }))[0].level);
  let s;
  const ap = (lv, a) => { const r = nakshaLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  const fix = gen("locate", "fix", { step: 10 }), fp = fix.params;
  s = nakshaLogic.init(fix);
  assert.equal(ap(fix, { kind: "run" }), "put_first");
  assert.equal(ap(fix, { kind: "put", x: fp.lon[0] + 5, y: 0 }), "off_map", "between two lines");
  assert.equal(ap(fix, { kind: "put", x: fp.lon[1] + 10, y: 0 }), "off_map");
  assert.equal(ap(fix, { kind: "step", dir: "n" }), "no_step");
  assert.equal(ap(fix, { kind: "put", x: fp.lon[0], y: fp.lat[0] }), undefined);
  assert.equal(ap(fix, { kind: "run" }), "missed");
  assert.equal(ap(fix, { kind: "run" }), "change_first");
  assert.equal(ap(fix, { kind: "put", x: fp.target[0], y: fp.target[1] }), undefined);
  assert.equal(ap(fix, { kind: "run" }), undefined);
  assert.ok(s.done);
  assert.equal(ap(fix, { kind: "put", x: 0, y: 0 }), "level_over");
  const steps = gen("route", "steps", { cols: [5, 6], rows: [5, 5] });
  s = nakshaLogic.init(steps);
  assert.equal(ap(steps, { kind: "run" }), "steps_first");
  assert.equal(ap(steps, { kind: "step", dir: "l" }), "no_such_step", "turns belong to the turns goal");
  assert.equal(ap(steps, { kind: "step", dir: "x" }), "no_such_step");
  for (let i = 0; i < 30; i++) ap(steps, { kind: "step", dir: "n" });
  assert.equal(ap(steps, { kind: "step", dir: "n" }), "full");
  assert.equal(ap(steps, { kind: "run" }), "missed", "off the top of the map");
  const turns = gen("route", "turns", { cols: [4, 5], rows: [5, 6] });
  s = nakshaLogic.init(turns);
  assert.equal(ap(turns, { kind: "step", dir: "e" }), "no_such_step", "a turns rider has no compass buttons");
  const fuel = gen("scale", "fuel", { ks: [5], cap: 150 });
  s = nakshaLogic.init(fuel);
  assert.equal(ap(fuel, { kind: "run" }), "fuel_first");
  assert.equal(ap(fuel, { kind: "set", value: fuel.params.max + 1 }), "off_gauge");
  assert.equal(ap(fuel, { kind: "set", value: 2.5 }), "off_gauge");
  assert.equal(ap(fuel, { kind: "put", x: 1, y: 0 }), "no_put");
  assert.equal(ap(fuel, { kind: "set", value: 7 }), undefined);
  assert.equal(ap(fuel, { kind: "set", value: 7 }), "same");
  const reach = gen("scale", "reach", { ks: [2, 3], unit: "m", cap: 60 });
  s = nakshaLogic.init(reach);
  assert.equal(ap(reach, { kind: "put", x: 0, y: 0 }), "off_road");
  assert.equal(ap(reach, { kind: "put", x: 2, y: 1 }), "off_road");
  assert.equal(ap(reach, { kind: "set", value: 3 }), "no_set");
  const copy = gen("shape", "copy");
  s = nakshaLogic.init(copy);
  assert.equal(ap(copy, { kind: "put", x: 1, y: 1 }), undefined);
  assert.equal(ap(copy, { kind: "put", x: 1, y: 1 }), "used");
  assert.equal(ap(copy, { kind: "put", x: copy.params.cols, y: 1 }), "off_map");
  assert.equal(ap(copy, { kind: "put", x: 3, y: 1 }), undefined);
  assert.equal(ap(copy, { kind: "run" }), "corners_first");
  assert.equal(ap(copy, { kind: "undo" }), undefined);
  assert.deepEqual(s.corners, [[1, 1]], "undo lifts the last corner");
  assert.deepEqual(hiddenOf(fuel), [nakshaLogic.solve(fuel)[0].value], "the teacher never says the fuel");
});

test("naksha: the route law by hand (a pond stops the rider; north arrow turned; left and right are the rider's)", () => {
  const base = { v: "play@1", levelId: "t", family: "naksha", topicId: "t", skillId: "t-s1", fade: 1, targets: [], mal: {}, context: "naksha", seed: 1, proof: {} };
  const lv = (mode, params) => nakshaLogic.validate({ ...base, mode, goal: params.goal, params });
  const steps = lv("route", { goal: "steps", labels: 1, cols: 5, rows: 5, start: [0, 0], heading: "n", home: [2, 2], rocks: [[1, 0]], north: "n" });
  assert.deepEqual(nakshaLogic.solve(steps).map((a) => a.dir ?? a.kind), ["n", "n", "e", "e", "run"], "the pond on the across-first L: up first");
  assert.deepEqual(run(steps, [{ kind: "step", dir: "e" }, { kind: "step", dir: "e" }, { kind: "step", dir: "n" }, { kind: "step", dir: "n" }, { kind: "run" }]).refused, ["missed"]);
  const comp = lv("route", { goal: "compass", labels: 1, cols: 5, rows: 5, start: [0, 0], heading: "n", home: [2, 1], rocks: [], north: "e" });
  // north points right: N moves right, E moves down, W moves up
  assert.ok(run(comp, [{ kind: "step", dir: "n" }, { kind: "step", dir: "n" }, { kind: "step", dir: "w" }, { kind: "run" }]).s.done);
  const turns = lv("route", { goal: "turns", labels: 1, cols: 5, rows: 5, start: [2, 4], heading: "s", home: [3, 2], rocks: [], north: "n" });
  // facing down the page, the rider's LEFT is the page's right
  assert.ok(run(turns, [{ kind: "step", dir: "f" }, { kind: "step", dir: "f" }, { kind: "step", dir: "l" }, { kind: "step", dir: "f" }, { kind: "run" }]).s.done);
  assert.ok(!run(turns, [{ kind: "step", dir: "f" }, { kind: "step", dir: "f" }, { kind: "step", dir: "r" }, { kind: "step", dir: "f" }, { kind: "run" }]).s.done);
  const copy = lv("shape", { goal: "copy", labels: 1, model: [[0, 0], [3, 0], [3, 2], [0, 2]], cols: 7, rows: 6 });
  assert.ok(run(copy, [[1, 1], [1, 4], [3, 4], [3, 1]].map(([x, y]) => ({ kind: "put", x, y })).concat([{ kind: "run" }])).s.done, "a 3 × 2 garden turned and drawn the other way round is the same garden");
  assert.ok(run(copy, [[1, 1], [2, 1], [4, 1], [4, 3], [1, 3]].map(([x, y]) => ({ kind: "put", x, y })).concat([{ kind: "run" }])).s.done, "a corner in the middle of a side changes nothing");
  assert.ok(!run(copy, [[1, 1], [4, 1], [4, 4], [1, 4]].map(([x, y]) => ({ kind: "put", x, y })).concat([{ kind: "run" }])).s.done);
  const L = lv("shape", { goal: "copy", labels: 1, model: [[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [0, 2]], cols: 7, rows: 6 });
  assert.ok(!run(L, [[4, 1], [1, 1], [1, 2], [3, 2], [3, 3], [4, 3]].map(([x, y]) => ({ kind: "put", x, y })).concat([{ kind: "run" }])).s.done, "a flipped L is not the plan's L");
});

test("naksha: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}) => nakshaLogic.generate(req(mode, goal, 6, { grammar }))[0].level;
  const fix = g("locate", "fix", { step: 10 }), steps = g("route", "steps"), comp = g("route", "compass"), turns = g("route", "turns"), fuel = g("scale", "fuel"), reach = g("scale", "reach", { ks: [2, 3] }), copy = g("shape", "copy");
  for (const lv of [fix, steps, comp, turns, fuel, reach, copy]) assert.ok(nakshaLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [fix, { target: [fix.params.target[0] + 5, fix.params.target[1]] }], [fix, { target: [0, fix.params.target[1]] }], [fix, { target: [fix.params.target[0], 0] }], [fix, { lat: [10, 40] }],
    [fix, { step: 7 }], [fix, { lon: [-200, 0] }], [fix, { goal: "steps" }], [fix, { target: "20S" }],
    [steps, { start: steps.params.home }], [steps, { rocks: [steps.params.home] }], [steps, { cols: 12 }], [steps, { north: "e" }], [steps, { heading: "s" }], [steps, { home: [steps.params.start[0], 0] }],
    [comp, { north: "x" }], [turns, { heading: 3 }], [steps, { home: [99, 1] }],
    [fuel, { road: [[1, 1], [3, 3]] }], [fuel, { max: 1 }], [fuel, { k: 1 }], [fuel, { unit: "mile" }], [fuel, { fuel: 30 }],
    [reach, { fuel: reach.params.fuel + 1 }], [reach, { fuel: reach.params.k }], [reach, { max: 50 }],
    [copy, { model: [[0, 0], [2, 1], [0, 2]] }], [copy, { model: [[0, 0], [2, 0], [2, 2], [0, 2]], cols: 3 }], [copy, { model: [[0, 0], [3, 0], [0, 0], [0, 2]] }],
  ]) assert.equal(nakshaLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  assert.equal(nakshaLogic.validate({ ...fix, mode: "route" }), null, "a goal belongs to its mode");
  assert.equal(nakshaLogic.validate({ ...fix, params: null }), null);
});

test("naksha: a claim in an act never decides; the first go decides the evidence; grade replays", () => {
  for (const [mode, goal, grammar] of CASES) {
    const level = nakshaLogic.validate(nakshaLogic.generate(req(mode, goal, 4, { grammar }))[0].level);
    const forged = nakshaLogic.grade(level, env([{ kind: "run", solved: true, correct: true, verdict: "solved" }]));
    assert.notEqual(forged.verdict, "solved");
    assert.notEqual(forged.evidence[0]?.outcome, "correct");
    const ok = nakshaLogic.grade(level, env(nakshaLogic.solve(level)));
    assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
    const mal = NAKSHA_MAL.map((m) => nakshaLogic.malActs(level, m)).find(Boolean);
    if (!mal) continue;
    const wrong = [...mal, { kind: "undo" }, ...nakshaLogic.solve(level)];
    const g = nakshaLogic.grade(level, env(wrong));
    assert.equal(g.evidence[0].outcome, "incorrect", `${goal}: the first go decides`);
    assert.deepEqual(nakshaLogic.grade(level, env(wrong)), g);
  }
});

// ≥ 2000 random acts per goal: the law never throws; whenever a go is judged the law's verdict equals the oracle on the
// set-up that went; a solved level always agrees with the oracle; the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`naksha/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the go's verdict ⇔ the brute oracle; never throws; generator p95 ≤ 50 ms`, () => {
    let seed = 23, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let gi = 0; gi < 40; gi++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); cands = nakshaLogic.generate(req(mode, goal, 100 + gi, { grammar })); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 4)) {
        const level = nakshaLogic.validate(c.level), p = level.params, sol = nakshaLogic.solve(level);
        let s = nakshaLogic.init(level), k = 0;
        const pursue = rnd() < 0.4;
        const randPut = () => {
          if (goal === "fix") return { kind: "put", x: p.lon[0] + p.step * Math.floor(rnd() * ((p.lon[1] - p.lon[0]) / p.step + 2)) - (rnd() < 0.1 ? 5 : 0), y: p.lat[0] + p.step * Math.floor(rnd() * ((p.lat[1] - p.lat[0]) / p.step + 2)) };
          if (goal === "reach") return { kind: "put", x: Math.floor(rnd() * 22), y: rnd() < 0.9 ? 0 : 1 };
          return { kind: "put", x: Math.floor(rnd() * 9) - 1, y: Math.floor(rnd() * 8) - 1 };
        };
        for (let i = 0; i < 60 && !s.done; i++) {
          const r = rnd();
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.3 ? randPut()
            : r < 0.55 ? { kind: "step", dir: ["n", "e", "s", "w", "f", "l", "r"][Math.floor(rnd() * 7)] }
            : r < 0.68 ? { kind: "set", value: goal === "fuel" ? (rnd() < 0.3 ? sol[0].value + Math.floor(rnd() * 3) - 1 : Math.floor(rnd() * (p.max + 5))) : 3 }
            : r < 0.88 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true, correct: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = nakshaLogic.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, oracle(p, before), `${level.levelId}: law and oracle disagree on ${JSON.stringify([before.at, before.prog, before.value, before.corners])}`);
          }
          s = out.state;
        }
        if (nakshaLogic.goalMet(level, s)) { solved++; assert.ok(oracle(p, s)); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

// the fence law against the oracle on many random corner lists (the random play above rarely closes a real shape)
test("naksha/shape: random fences, the law ⇔ the unit-segment oracle", () => {
  let seed = 5, agree = 0, wins = 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
  for (const c of levelsOf("shape", "copy", { shapes: ["rect", "L"] }, [1, 2, 3])) {
    const level = nakshaLogic.validate(c.level), p = level.params;
    const sol = nakshaLogic.solve(level).filter((a) => a.kind === "put").map((a) => [a.x, a.y]);
    for (let t = 0; t < 40; t++) {
      let corners;
      const r = rnd();
      if (r < 0.3) { const dx = Math.floor(rnd() * 3), dy = Math.floor(rnd() * 2), k = Math.floor(rnd() * sol.length); corners = [...sol.slice(k), ...sol.slice(0, k)].map(([x, y]) => [x + dx, y + dy]); if (rnd() < 0.5) corners.reverse(); }
      else if (r < 0.5) { const cx = 3, cy = 3; corners = sol.map(([x, y]) => [cx - (y - cy), cy + (x - cx)]); }
      else corners = Array.from({ length: 3 + Math.floor(rnd() * 4) }, () => [Math.floor(rnd() * p.cols), Math.floor(rnd() * p.rows)]);
      if (new Set(corners.map((q) => q.join())).size !== corners.length || corners.some(([x, y]) => x < 0 || y < 0 || x >= p.cols || y >= p.rows)) continue;
      const out = run(level, [...corners.map(([x, y]) => ({ kind: "put", x, y })), { kind: "run" }]);
      assert.equal(out.s.done, fenceOk(p.model, corners), `${c.signature}: ${JSON.stringify(corners)}`);
      agree++; if (out.s.done) wins++;
    }
  }
  assert.ok(agree > 500 && wins > 50, `agree ${agree}, wins ${wins}`);
});

// the play server: every naksha coverage entry serves a proven level at every fade (levelsFor and currentLevel); the
// solver's acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const NE = () => coverage().entries.filter((e) => e.family === "naksha");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("naksha coverage: the nine authored entries, mapped to real kit misconceptions; the map topics admitted by skill", () => {
  assert.deepEqual(NE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c4-maths-ch01-t03|shape|copy", "c4-maths-ch02-t02|route|steps", "c4-maths-ch02-t02|route|turns", "c5-maths-ch14-t01|route|compass", "c5-maths-ch14-t01|route|turns",
    "c5-maths-ch14-t02|scale|fuel", "c5-maths-ch14-t02|scale|reach", "c6-sst-ch01-t01|locate|fix", "c6-sst-ch01-t01|scale|fuel"]);
  for (const e of NE()) for (const kit of Object.values(e.misMap)) assert.ok(kit.startsWith(`${e.topicId}-m`), kit);
  for (const sk of ["c4-maths-ch01-t03-s1", "c4-maths-ch02-t02-s1", "c4-maths-ch02-t02-s2", "c4-maths-ch02-t02-s3", "c5-maths-ch14-t01-s1", "c5-maths-ch14-t01-s2",
    "c5-maths-ch14-t02-s1", "c5-maths-ch14-t02-s2", "c5-maths-ch14-t02-s3", "c6-sst-ch01-t01-s1", "c6-sst-ch01-t01-s2", "c6-sst-ch01-t01-s3"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "naksha", sk);
  }
});

test("naksha: engine words sit before vakya's (vakya's stay last), every key the view uses exists in all three languages", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/naksha/naksha.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(naksha\.[a-zA-Z.]+)"/g)].map((m) => m[1]);
  for (const k of [...used, "naksha.N", "naksha.E", "naksha.S", "naksha.W", "naksha.km", "naksha.m"]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/naksha/naksha.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

for (const e of NE()) for (const fade of [1, 2, 3]) {
  test(`naksha server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "naksha" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.labels, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(nakshaLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && nakshaLogic.malActs(level, m));
        const mg = gradeActs(level, env(nakshaLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      // the teacher never says a value the child has not produced yet (the ship's coordinates are the given, not a key)
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && (e.goal === "fix" || hidden.length > 0), "hidden values");
    }
  });
}
