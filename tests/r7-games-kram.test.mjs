// r7 Games, Kram · growing patterns and number sequences (a tile figure grown a stage; a bag filled for a far stage that
// the run grows out of it; a step machine walked along a list and a rule machine fed the stage number; every rhythm of n
// beats laid from the shelves above; L-pieces and staircases nested into a square). Pure law checks: every generated level
// validates, its solver solves it, no idea-free set-up wins (shortcut null); an INDEPENDENT checker (its own figures and
// counts: stick-by-stick houses, pairs of points counted by a double loop, the snowflake's sides by repeated × 4, rhythms
// by brute force over S / L strings, its own turn-and-flip comparison of tile figures; its own copy of the set-up fed every
// act the law accepted; none of the law's helpers) agrees with the law over random play; each mal-rule's acts land on its
// OWN misconception moment; tampered params are refused; a claim in an act never decides; the generator is fast; and every
// coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { kramLogic, KRAM_MAL, malSetup } from "../src/play/families/kram/kram.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const ALL = Object.fromEntries(KRAM_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "kram", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = kramLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = kramLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["grow", "next", { seqs: ["square"], n: [4, 6] }, 30],
  ["grow", "next", { seqs: ["stair", "oblong", "ell", "plus"], n: [4, 6] }, 30],
  ["grow", "far", { seqs: ["houses", "sqrow", "trirow"], far: [6, 12] }, 30],
  ["grow", "far", { seqs: ["houses", "sqrow", "trirow"], far: [20, 50] }, 30],
  ["grow", "far", { seqs: ["lines"], far: [7, 12] }, 30],
  ["grow", "far", { seqs: ["koch"] }, 8],
  ["grow", "far", { seqs: ["square", "stair"], far: [8, 20] }, 30],
  ["machine", "step", { kinds: ["add", "sub", "mul", "div", "cal"] }, 30],
  ["machine", "step", { kinds: ["fig"] }, 12],
  ["machine", "rule", { far: [10, 100] }, 30],
  ["beats", "lay", { n: [3, 6] }, 12],
  ["beats", "count", { far: [6, 10] }, 12],
  ["nest", "odd", { n: [3, 6] }, 12],
  ["nest", "pair", { n: [3, 7] }, 12],
];
const EXPECT = { "next:square": ["copy", "corner", "rows-only"], "next:stair": ["copy"], "far:houses": ["times-first", "step-only"], "far:lines": ["double", "same-step"], "far:koch": ["sides-plus"],
  "far:square": ["same-step"], "step:add": ["only-increase", "first-step", "plus-one"], "step:fig": [], rule: ["recursive", "proportional"], lay: ["order-ignored"], count: ["add-one", "doubling"], odd: ["skip-start"], pair: [] };
const expectOf = (goal, g) => EXPECT[`${goal}:${(g.seqs ?? g.kinds ?? [])[0]}`] ?? EXPECT[goal] ?? [];
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of kramLogic.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (its own figures and counts, none of the law's code) ─────────────────────────────
/** stage m of a tile figure as "x,y" strings, drawn its own way */
function figure(seq, m) {
  const out = [];
  if (seq === "square") for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) out.push([c, r]);
  if (seq === "stair") for (let r = 1; r <= m; r++) for (let c = 0; c < r; c++) out.push([c, r]);
  if (seq === "oblong") for (let r = 0; r < m; r++) for (let c = 0; c < m + 1; c++) out.push([c, r]);
  if (seq === "ell") { out.push([0, 0]); for (let k = 1; k < m; k++) out.push([k, 0], [0, k]); }
  if (seq === "plus") { out.push([0, 0]); for (let k = 1; k < m; k++) out.push([k, 0], [-k, 0], [0, k], [0, -k]); }
  return out;
}
/** two figures are the same shape: some turn / flip slides one onto the other */
function sameShape(a, b) {
  if (a.length !== b.length) return false;
  const norm = (pts) => { const mx = Math.min(...pts.map((q) => q[0])), my = Math.min(...pts.map((q) => q[1])); return new Set(pts.map(([x, y]) => `${x - mx},${y - my}`)); };
  const nb = norm(b);
  let q = a;
  for (let flip = 0; flip < 2; flip++) {
    for (let turn = 0; turn < 4; turn++) {
      const na = norm(q);
      if ([...na].every((k) => nb.has(k))) return true;
      q = q.map(([x, y]) => [-y, x]);
    }
    q = q.map(([x, y]) => [x, -y]);
  }
  return false;
}
/** sticks: one house is 5 sticks (walls, floor, two roof sticks), each next one shares a wall: counted stick by stick */
function sticks(seq, m) {
  if (seq === "houses") { let n = 0; for (let i = 0; i < m; i++) n += i === 0 ? 5 : 4; return n; }
  if (seq === "sqrow") { let n = 0; for (let i = 0; i < m; i++) n += i === 0 ? 4 : 3; return n; }
  if (seq === "trirow") { let n = 0; for (let i = 0; i < m; i++) n += i === 0 ? 3 : 2; return n; }
  return null;
}
function count(seq, m) {
  const st = sticks(seq, m);
  if (st !== null) return st;
  if (seq === "square") return figure("square", m).length;
  if (seq === "stair") return figure("stair", m).length;
  if (seq === "lines") { let n = 0; for (let i = 0; i <= m; i++) for (let j = i + 1; j <= m; j++) n++; return n; }   // m + 1 points
  if (seq === "koch") { let s = 3; for (let i = 1; i < m; i++) s *= 4; return s; }
  if (seq === "virahanka") return allRhythms(m).length;
  throw new Error(seq);
}
/** every string of S (1 beat) and L (2 beats) summing to n, by brute force */
function allRhythms(n) {
  const out = [];
  for (let len = Math.ceil(n / 2); len <= n; len++) for (let mask = 0; mask < 2 ** len; mask++) {
    let s = "", b = 0;
    for (let i = 0; i < len; i++) { const L = (mask >> i) & 1; s += L ? "L" : "S"; b += L ? 2 : 1; }
    if (b === n) out.push(s);
  }
  return out;
}
const opFn = { "+": (x, v) => x + v, "-": (x, v) => x - v, x: (x, v) => x * v, "/": (x, v) => x / v };
const OPS_ORDER = ["+", "-", "x", "/"];
/** the checker's own copy of the set-up, fed every act the law accepted (undo pops its own stack) */
function checker(p, grid) {
  const st = { cells: new Set(), bag: [0, 0, 0, 0, 0], d0: 0, d1: p.goal === "step" ? 1 : 0, laid: new Set(), picked: new Set() }, stack = [];
  return {
    st,
    seedCells(cells) { for (const c of cells) st.cells.add(c); },
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push({ cells: new Set(st.cells), bag: [...st.bag], d0: st.d0, d1: st.d1, laid: new Set(st.laid), picked: new Set(st.picked) });
      if (a.kind === "cell") { const i = a.y * grid + a.x; if (st.cells.has(i)) st.cells.delete(i); else st.cells.add(i); }
      if (a.kind === "bag") st.bag[a.place] += a.by;
      if (a.kind === "dial") { if (a.which === 0) st.d0 = a.to; else st.d1 = a.to; }
      if (a.kind === "lay") { if (st.laid.has(a.r)) st.laid.delete(a.r); else st.laid.add(a.r); }
      if (a.kind === "pick") { if (st.picked.has(a.i)) st.picked.delete(a.i); else st.picked.add(a.i); }
    },
  };
}
/** does this set-up meet the task? read from the params' plain meaning */
function verdict(p, st, grid) {
  if (p.goal === "next") return sameShape([...st.cells].map((i) => [i % grid, Math.floor(i / grid)]), figure(p.seq, p.n));
  if (p.goal === "far" || p.goal === "count") return st.bag.reduce((s, c, i) => s + c * 10 ** i, 0) === count(p.seq, p.n);
  if (p.goal === "step") {
    const given = [p.a]; for (let i = 1; i < p.n; i++) given.push(opFn[p.op](given[i - 1], p.v));
    const mine = [p.a]; for (let i = 1; i < p.n; i++) mine.push(opFn[OPS_ORDER[st.d0]](mine[i - 1], st.d1));
    return given.every((x, i) => x === mine[i]);
  }
  if (p.goal === "rule") { for (let k = 1; k <= 4; k++) if (st.d0 * k + st.d1 !== p.a * k + p.b) return false; return true; }
  if (p.goal === "lay") { const all = allRhythms(p.n); return st.laid.size === all.length && all.every((r) => st.laid.has(r)); }
  const dots = [...st.picked].map((i) => (p.goal === "odd" ? 2 * i + 1 : ((i + 1) * (i + 2)) / 2)).sort((x, y) => x - y);
  if (p.goal === "odd") return dots.length === p.n && dots.every((d, i) => d === 2 * i + 1);
  // two staircases fill the square only when they are next to each other (k rows and k − 1 rows) and k = n
  return dots.length === 2 && dots[0] + dots[1] === p.n * p.n && [...st.picked].sort((x, y) => x - y)[1] === p.n - 1 && [...st.picked].sort((x, y) => x - y)[0] === p.n - 2;
}
const gridOf = (level) => { const s = kramLogic.init(level); void s; return level.params.goal === "next" ? Math.sqrt(boardSide(level)) : 0; };
// the board's side, read from the law's own start (the only thing the checker takes from it: where the board's squares are)
function boardSide(level) { const g = level.params.seq === "plus" ? 2 * level.params.n + 1 : null; if (g) return g * g; const f = figure(level.params.seq, level.params.n); const w = Math.max(...f.map((q) => q[0])) - Math.min(...f.map((q) => q[0])) + 1, h = Math.max(...f.map((q) => q[1])) - Math.min(...f.map((q) => q[1])) + 1; return (Math.max(w, h) + 2) ** 2; }
const replayCheck = (level, acts) => {
  const g = gridOf(level), k = checker(level.params, g);
  let s = kramLogic.init(level);
  if (level.params.goal === "next") k.seedCells(s.cells);
  for (const a of acts) { const r = kramLogic.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; }
  return { s, ok: verdict(level.params, k.st, g) };
};

test("kram: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("kram"));
  assert.deepEqual([...MODES.kram], ["grow", "machine", "beats", "nest"]);
  assert.ok(FAMILY_ARTS.kram.length === 4);
  for (const m of MODES.kram) {
    assert.equal(LOGIC[`kram/${m}`], kramLogic);
    const v = playActOf("kram", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

test("kram: the independent figures match the stage counts the cards show (the checker's houses, rows, squares, pairs, snowflake, rhythms)", () => {
  assert.deepEqual([1, 2, 3, 4].map((m) => count("houses", m)), [5, 9, 13, 17]);
  assert.deepEqual([1, 2, 3].map((m) => count("sqrow", m)), [4, 7, 10]);
  assert.deepEqual([1, 2, 3].map((m) => count("trirow", m)), [3, 5, 7]);
  assert.deepEqual([1, 2, 3, 4].map((m) => count("lines", m)), [1, 3, 6, 10]);
  assert.deepEqual([1, 2, 3].map((m) => count("koch", m)), [3, 12, 48]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((m) => count("virahanka", m)), [1, 2, 3, 5, 8, 13]);
  assert.deepEqual(allRhythms(3).sort(), ["LS", "SL", "SSS"]);
});

for (const [mode, goal, grammar, min] of CASES) {
  test(`kram/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length >= min, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = kramLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(kramLogic.shortcut(level), null, `${c.signature} shortcut`);
      const sol = kramLogic.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol).ok, `${c.signature}: the checker disagrees with the solver`);
      for (const mal of KRAM_MAL) {
        const acts = kramLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts).ok, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = kramLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of expectOf(goal, grammar)) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("kram: mal-rule signatures are the beliefs (N × stage 1, N × the step, the last step again, lines counted twice, + 1 a beat, doubling, + for −, the first step only, + 1 down a column, n + d, a × n from stage 1, one rhythm per mix, odd pieces not from 1)", () => {
  for (const c of levelsOf("grow", "far", { seqs: ["houses", "sqrow", "trirow"], far: [6, 50] })) {
    const p = kramLogic.validate(c.level).params;
    assert.equal(malSetup(p, "times-first").load, p.n * count(p.seq, 1));
    assert.equal(malSetup(p, "step-only").load, p.n * (count(p.seq, 2) - count(p.seq, 1)));
    assert.equal(malSetup(p, "same-step"), null, "a line pattern's last step again is the answer: never a belief here");
  }
  for (const c of levelsOf("grow", "far", { seqs: ["lines", "koch"], far: [7, 12] })) {
    const p = kramLogic.validate(c.level).params, s = p.shown;
    const ss = malSetup(p, p.seq === "koch" ? "sides-plus" : "same-step");
    assert.equal(ss.load, count(p.seq, s) + (p.n - s) * (count(p.seq, s) - count(p.seq, s - 1)));
    if (p.seq === "lines") assert.equal(malSetup(p, "double").load, 2 * count("lines", p.n));
  }
  for (const c of levelsOf("beats", "count", {})) {
    const p = kramLogic.validate(c.level).params;
    assert.equal(malSetup(p, "add-one").load, 5 + (p.n - 4));
    const d = malSetup(p, "doubling"); if (d) assert.equal(d.load, 5 * 2 ** (p.n - 4));
  }
  for (const c of levelsOf("machine", "step", {})) {
    const p = kramLogic.validate(c.level).params;
    const oi = malSetup(p, "only-increase"); if (oi) { assert.ok(p.op === "-" || p.op === "/"); assert.equal(OPS_ORDER[oi.d0], p.op === "-" ? "+" : "x"); assert.equal(oi.d1, p.v); }
    const fs = malSetup(p, "first-step"); if (fs) { const t2 = opFn[p.op](p.a, p.v); assert.equal(OPS_ORDER[fs.d0], t2 > p.a ? "+" : "-"); assert.equal(fs.d1, Math.abs(t2 - p.a)); }
    const po = malSetup(p, "plus-one"); if (po) { assert.equal(p.seq, "cal"); assert.equal(po.d1, 1); }
  }
  for (const c of levelsOf("machine", "rule", {})) {
    const p = kramLogic.validate(c.level).params;
    assert.deepEqual([malSetup(p, "recursive").d0, malSetup(p, "recursive").d1], [1, p.a]);
    const pr = malSetup(p, "proportional"); if (pr) assert.deepEqual([pr.d0, pr.d1], [p.a + p.b, 0]);
  }
  for (const c of levelsOf("beats", "lay", { n: [3, 6] })) {
    const p = kramLogic.validate(c.level).params, oi = malSetup(p, "order-ignored");
    assert.equal(oi.laid.length, Math.floor(p.n / 2) + 1);
    assert.equal(new Set(oi.laid.map((r) => [...r].sort().join(""))).size, oi.laid.length, "one rhythm per mix of S and L");
  }
  for (const c of levelsOf("nest", "odd", {})) {
    const p = kramLogic.validate(c.level).params, sk = malSetup(p, "skip-start");
    assert.deepEqual(sk.picked.map((i) => 2 * i + 1), Array.from({ length: p.n }, (_, i) => 2 * i + 3));
  }
  for (const c of levelsOf("grow", "next", { seqs: ["square"] })) {
    const p = kramLogic.validate(c.level).params, k = p.n - 1;
    assert.equal(malSetup(p, "corner").cells.length, k * k + 2 * k);
    assert.equal(malSetup(p, "rows-only").cells.length, k * k + k);
    assert.equal(malSetup(p, "copy").cells.length, k * k);
  }
});

test("kram: no idea-free set-up wins (the board filled, the last stage or the stage number in the bag, the machine as it stands, every piece picked)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const level = kramLogic.validate(c.level), p = level.params;
    if (goal === "next") { const s = kramLogic.init(level); assert.ok(!run(level, [{ kind: "run" }]).s.done, `${c.signature}: the last stage again`); void s; }
    if (goal === "far" || goal === "count") {
      for (const v of [count(p.seq, p.shown), p.n]) {
        const acts = []; for (let pl = 0; pl < 4; pl++) for (let k = 0; k < Math.floor(v / 10 ** pl) % 10; k++) acts.push({ kind: "bag", place: pl, by: 1 });
        assert.ok(!replayCheck(level, [...acts, { kind: "run" }]).ok, `${c.signature}: ${v} wins`);
      }
    }
    if (goal === "step" || goal === "rule") assert.ok(!run(level, [{ kind: "run" }]).s.done, `${c.signature}: the machine as it stands`);
    if (goal === "odd") assert.ok(!run(level, [...Array.from({ length: p.n + 2 }, (_, i) => ({ kind: "pick", i })), { kind: "run" }]).s.done);
  }
});

test("kram: the law's rules (a tile toggles; nine to a rack; dials stay in range; a rhythm must be n beats and is lifted when laid again; two staircases at most; run needs a set-up; a change starts a fresh run)", () => {
  let s;
  const ap = (lv, a) => { const r = kramLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  const next = kramLogic.validate(kramLogic.generate(req("grow", "next", 3, { grammar: { seqs: ["square"] } }))[0].level);
  s = kramLogic.init(next);
  const start = s.cells.length;
  assert.equal(start, (next.params.n - 1) ** 2, "the board starts as a copy of the last stage");
  assert.equal(ap(next, { kind: "cell", x: 0, y: 0 }), undefined); assert.equal(s.cells.length, start + 1);
  ap(next, { kind: "cell", x: 0, y: 0 }); assert.equal(s.cells.length, start, "a tile laid again is lifted");
  for (const bad of [{ kind: "cell", x: -1, y: 0 }, { kind: "cell", x: 0, y: 99 }, { kind: "cell", x: 1.5, y: 0 }]) assert.equal(ap(next, bad), "bad_cell");
  for (const bad of [{ kind: "bag", place: 0, by: 1 }, { kind: "dial", which: 0, to: 1 }, { kind: "lay", r: "SS" }, { kind: "pick", i: 0 }]) assert.notEqual(ap(next, bad), undefined);
  ap(next, { kind: "run" }); assert.ok(s.ended && !s.done);
  assert.equal(ap(next, { kind: "run" }), "change_first");
  ap(next, { kind: "cell", x: 0, y: 0 }); assert.ok(!s.ended, "a change starts a fresh run");

  const far = kramLogic.validate(kramLogic.generate(req("grow", "far", 3, { grammar: { seqs: ["houses"] } }))[0].level);
  s = kramLogic.init(far);
  assert.equal(ap(far, { kind: "run" }), "fill_first");
  assert.equal(ap(far, { kind: "bag", place: 0, by: -1 }), "rack_empty");
  for (let i = 0; i < 9; i++) ap(far, { kind: "bag", place: 0, by: 1 });
  assert.equal(ap(far, { kind: "bag", place: 0, by: 1 }), "rack_full", "nine to a rack: ten are one piece of the next place");
  assert.equal(ap(far, { kind: "bag", place: 9, by: 1 }), "bad_rack");
  assert.deepEqual(hiddenOf(far), [String(count("houses", far.params.n))], "the teacher never says the far count first");

  const step = kramLogic.validate(kramLogic.generate(req("machine", "step", 3, { grammar: { kinds: ["sub"] } }))[0].level);
  s = kramLogic.init(step);
  for (const bad of [{ kind: "dial", which: 0, to: 4 }, { kind: "dial", which: 1, to: 0 }, { kind: "dial", which: 1, to: 21 }, { kind: "dial", which: 2, to: 1 }]) assert.equal(ap(step, bad), "bad_dial");
  assert.equal(ap(step, { kind: "dial", which: 1, to: 1 }), "same_dial");
  const P = step.params, l = [P.a]; for (let i = 1; i < P.n + 2; i++) l.push(l[i - 1] - P.v);
  assert.deepEqual(hiddenOf(step).slice(0, 2), [String(l[P.n]), String(l[P.n + 1])], "the next numbers are never said first");

  const rule = kramLogic.validate(kramLogic.generate(req("machine", "rule", 3))[0].level);
  s = kramLogic.init(rule);
  assert.equal(ap(rule, { kind: "dial", which: 0, to: 13 }), "bad_dial"); assert.equal(ap(rule, { kind: "dial", which: 1, to: -11 }), "bad_dial");
  ap(rule, { kind: "dial", which: 0, to: rule.params.a }); ap(rule, { kind: "dial", which: 1, to: rule.params.b });
  assert.equal(ap(rule, { kind: "run" }), undefined); assert.ok(s.done);
  assert.equal(ap(rule, { kind: "dial", which: 0, to: 2 }), "level_over");

  const lay = kramLogic.validate(kramLogic.generate(req("beats", "lay", 3, { grammar: { n: [4, 4] } }))[0].level);
  s = kramLogic.init(lay);
  assert.equal(ap(lay, { kind: "run" }), "lay_first");
  assert.equal(ap(lay, { kind: "lay", r: "SSS" }), "not_n_beats");
  assert.equal(ap(lay, { kind: "lay", r: "SXS" }), "bad_rhythm");
  ap(lay, { kind: "lay", r: "SL S".replace(" ", "") }); assert.deepEqual(s.laid, ["SLS"]);
  ap(lay, { kind: "lay", r: "SLS" }); assert.deepEqual(s.laid, [], "a rhythm laid again is lifted");

  const pair = kramLogic.validate(kramLogic.generate(req("nest", "pair", 3))[0].level);
  s = kramLogic.init(pair);
  ap(pair, { kind: "pick", i: 0 }); ap(pair, { kind: "pick", i: 1 });
  assert.equal(ap(pair, { kind: "pick", i: 2 }), "two_only");
  assert.equal(ap(pair, { kind: "pick", i: 99 }), "bad_piece");
});

test("kram: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}) => kramLogic.generate(req(mode, goal, 6, { grammar }))[0].level;
  const next = g("grow", "next", { seqs: ["square"] }), far = g("grow", "far"), koch = g("grow", "far", { seqs: ["koch"] }), step = g("machine", "step", { kinds: ["mul"] }),
    cal = g("machine", "step", { kinds: ["cal"] }), rule = g("machine", "rule"), lay = g("beats", "lay"), count0 = g("beats", "count"), odd = g("nest", "odd");
  for (const lv of [next, far, koch, step, cal, rule, lay, count0, odd]) assert.ok(kramLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [next, { n: 9 }], [next, { n: 3 }], [next, { seq: "houses" }], [next, { shown: 2 }], [next, { face: 4 }], [next, { a: 3 }], [next, { goal: "far" }],
    [far, { n: far.params.shown + 1 }], [far, { seq: "virahanka" }], [far, { seq: "zig" }], [far, { n: 31 }], [koch, { n: 9 }], [koch, { shown: 3 }],
    [step, { v: 7 }], [step, { op: "+" }], [step, { a: 0 }], [step, { n: 7 }], [step, { b: 2 }], [cal, { v: 6 }], [cal, { a: 9 }],
    [rule, { a: 1 }], [rule, { b: 0 }], [rule, { n: 5 }], [rule, { seq: "houses" }], [rule, { shown: 3 }],
    [lay, { n: 7 }], [lay, { seq: "x" }], [count0, { seq: "houses" }], [count0, { n: 13 }], [odd, { n: 8 }], [odd, { shown: 1 }],
  ]) assert.equal(kramLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch)}`);
  assert.equal(kramLogic.validate({ ...next, mode: "machine" }), null, "a goal belongs to its mode");
  assert.equal(kramLogic.validate({ ...next, params: null }), null);
});

test("kram: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = kramLogic.validate(kramLogic.generate(req("machine", "rule", 4))[0].level);
  const forged = kramLogic.grade(level, sanitizeActs(env([{ kind: "dial", which: 0, to: 3, correct: true }, { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved", "b is never 0: a × n alone never makes the stages");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = kramLogic.grade(level, env(kramLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "run" }, ...kramLogic.solve(level)];
  const g = kramLogic.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(kramLogic.grade(level, env(wrong)), g);
  const claimOnly = kramLogic.grade(level, sanitizeActs(env([{ kind: "run", solved: true, correct: true }])));
  assert.notEqual(claimOnly.verdict, "solved");
});

// ≥ 2000 random acts per case: the law never throws; whenever a run ends the law's verdict equals the checker's on the
// checker's OWN copy of the set-up (fed every act the law accepted); the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`kram/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws; generator p95 ≤ 50 ms`, () => {
    let seed = 17, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    const RH = ["S", "L", "SS", "SL", "LS", "SSS", "SSL", "SLS", "LSS", "LL", "SSSS", "SSLS", "LSL", "LLS", "SLL", "SSSSS", "LLL", "SLSL", "SSSSSS"];
    for (let gi = 0; gi < 40; gi++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); cands = kramLogic.generate(req(mode, goal, 100 + gi, { grammar, fade: 1 + (gi % 3) })); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 4)) {
        const level = kramLogic.validate(c.level), p = level.params, sol = kramLogic.solve(level), grid = gridOf(level);
        let s = kramLogic.init(level), k = 0;
        const chk = checker(p, grid), pursue = rnd() < 0.5;
        if (goal === "next") chk.seedCells(s.cells);
        for (let i = 0; i < 90 && !s.done; i++) {
          const r = rnd(), x = rnd();
          const a = pursue && r < 0.7 && k < sol.length ? sol[k++]
            : r < 0.15 ? { kind: "cell", x: Math.floor(x * (grid + 1)), y: Math.floor(rnd() * (grid + 1)), ...(rnd() < 0.2 ? { correct: true } : {}) }
            : r < 0.3 ? { kind: "bag", place: Math.floor(x * 4), by: rnd() < 0.7 ? 1 : -1 }
            : r < 0.45 ? { kind: "dial", which: x < 0.5 ? 0 : 1, to: Math.floor(rnd() * 14) - 2 }
            : r < 0.55 ? { kind: "lay", r: RH[Math.floor(x * RH.length)] }
            : r < 0.65 ? { kind: "pick", i: Math.floor(x * 9) }
            : r < 0.88 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = kramLogic.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, verdict(p, chk.st, grid), `${level.levelId}: law and checker disagree`);
          }
          s = out.state;
        }
        if (kramLogic.goalMet(level, s)) { solved++; assert.ok(verdict(p, chk.st, grid)); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

test("kram: every word the view shows exists in all three languages; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/kram/kram.view.ts`, "utf8");
  const used = [...view.matchAll(/["`](kram\.[a-zA-Z0-9.]+)["`]/g)].map((m) => m[1]);
  const extra = ["next", "far", "step", "rule", "lay", "count", "odd", "pair"].map((g) => `kram.goal.${g}`);
  assert.ok(used.length > 10);
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/kram/kram.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every kram coverage entry serves a proven level at every fade (levelsFor and currentLevel); the solver's
// acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const KE = () => coverage().entries.filter((e) => e.family === "kram");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("kram coverage: the twelve authored entries, mapped to real kit misconceptions; seven pattern topics are kram's now", () => {
  assert.deepEqual(KE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c4-maths-ch03-t02|machine|step", "c5-maths-ch07-t02|grow|next", "c5-maths-ch07-t02|grow|far", "c5-maths-ch07-t02|machine|step", "c6-maths-ch01-t02|grow|next",
    "c6-maths-ch01-t03|nest|odd", "c6-maths-ch01-t03|nest|pair", "c6-maths-ch01-t04|grow|far", "c7-maths-ch04-t03|machine|rule", "c7-maths-ch04-t03|grow|far",
    "c7-maths-ch06-t03|beats|lay", "c7-maths-ch06-t03|beats|count"]);
  const kits = ["c4", "c5", "c6", "c7"].map((c) => readFileSync(`${ROOT}data/kits/${c}-maths.json`, "utf8")).join("");
  const ids = new Set([...kits.matchAll(/"(c[4-7]-maths-ch\d+-t\d+-m-[a-z0-9-]+)"/g)].map((m) => m[1]));
  for (const e of KE()) for (const kit of Object.values(e.misMap)) { assert.ok(kit.startsWith(`${e.topicId}-m-`), kit); assert.ok(ids.has(kit), `${kit} is a verified kit id`); }
  for (const sk of ["c4-maths-ch03-t02-s1", "c4-maths-ch03-t02-s2", "c4-maths-ch03-t02-s3", "c5-maths-ch07-t02-s1", "c5-maths-ch07-t02-s2", "c5-maths-ch07-t02-s3",
    "c6-maths-ch01-t02-s1", "c6-maths-ch01-t02-s2", "c6-maths-ch01-t03-s1", "c6-maths-ch01-t03-s2", "c6-maths-ch01-t04-s2", "c6-maths-ch01-t04-s3",
    "c7-maths-ch04-t03-s1", "c7-maths-ch04-t03-s2", "c7-maths-ch06-t03-s1", "c7-maths-ch06-t03-s2", "c7-maths-ch06-t03-s3"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "kram", sk);
  }
  // no honest mechanic: these stay with the net
  for (const sk of ["c6-maths-ch01-t02-s3", "c6-maths-ch01-t03-s3", "c6-maths-ch01-t04-s1", "c7-maths-ch04-t03-s3", "c7-maths-ch01-t03-s1"]) assert.notEqual(entryFor({ skillId: sk })?.family, "kram", sk);
});

for (const e of KE()) for (const fade of [1, 2, 3]) {
  test(`kram server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "kram" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.face, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(kramLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && kramLogic.malActs(level, m));
        const mg = gradeActs(level, env(kramLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}
