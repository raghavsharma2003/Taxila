// r7 Games, Paheli · number puzzles (bags loaded onto a boat by parity, number tiles on a magic grid, digit tiles on a
// letter sum, a reverse-and-add start; nothing ever runs on a clock). Pure law checks: every generated level validates, its
// solver solves it, no idea-free set-up wins (shortcut null); an INDEPENDENT checker (plain JS: it pairs the counters of
// every loaded bag one by one, adds the 8 lines of the grid from its own index list, builds each number of the letter sum
// digit by digit, reverses a number through its decimal string; none of the law's helpers) agrees with the law over random
// play; each mal-rule's acts land on its OWN misconception moment; tampered params are refused; a claim in an act never
// decides; the generator is fast; and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { paheliLogic, PAHELI_MAL, malSetup, magicSum } from "../src/play/families/paheli/paheli.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const ALL = Object.fromEntries(PAHELI_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "paheli", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = paheliLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = paheliLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["pairs", "load", { ks: [2] }],
  ["pairs", "load", { ks: [3, 5] }],
  ["pairs", "trays", { ks: [2, 3] }],
  ["magic", "square", {}],
  ["magic", "shift", { sets: [[2, 1], [3, 1], [11, 1], [2, 2], [1, 2]] }],
  ["cipher", "letters", { forms: ["2+2=3", "rev", "2+2=2", "3+3=4"] }],
  ["mirror", "reach", {}],
];
const EXPECT = (goal, g) => ({ load: g.ks?.includes(2) ? ["two-odds"] : ["odd-count"], trays: ["like-sum"], square: ["rows", "rows-cols"], shift: ["rows", "rows-cols"],
  letters: ["ignore-carry", "big-carry"], reach: [] })[goal];
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of paheliLogic.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (none of the law's code) ─────────────────────────────
/** a bag's or tray's counters, counted one by one (a tray: a rows of b) */
function countersOf(it) { let n = 0; for (let r = 0; r < it.a; r++) for (let c = 0; c < it.b; c++) n++; return n; }
/** the 8 lines of a 3 × 3 grid, written out by hand */
const MY_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
/** a letter row's number, built digit by digit */
function numberOf(row, dig) { let n = 0; for (const ch of row) n = n * 10 + dig[ch]; return n; }
const revStr = (n) => Number([...String(n)].reverse().join(""));
const palStr = (n) => String(n) === [...String(n)].reverse().join("");
/** the checker's own copy of the set-up, fed every act the law accepted (undo pops its own stack) */
function checker(p) {
  const letters = [...new Set(p.rows.join(""))].sort();
  const st = { on: [], cells: p.given.length ? [...p.given] : [], dig: Object.fromEntries(letters.map((l) => [l, p.known.find((k) => k.l === l)?.d ?? -1])), start: 0 }, stack = [];
  return {
    st,
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push(JSON.parse(JSON.stringify(st)));
      if (a.kind === "load") st.on = st.on.includes(a.i) ? st.on.filter((j) => j !== a.i) : [...st.on, a.i];
      if (a.kind === "put") {
        const from = st.cells.indexOf(a.v);
        if (a.cell < 0) st.cells[from] = 0;
        else { const there = st.cells[a.cell]; if (from >= 0) st.cells[from] = there; st.cells[a.cell] = a.v; }
      }
      if (a.kind === "digit") { for (const l of letters) if (a.d >= 0 && st.dig[l] === a.d) st.dig[l] = -1; st.dig[a.l] = a.d; }
      if (a.kind === "start") st.start = a.n;
    },
  };
}
/** does this set-up meet the task? read from the params' plain meaning */
function verdict(p, st) {
  if (p.goal === "load" || p.goal === "trays") {
    if (st.on.length !== p.k) return false;
    let total = 0;
    for (const i of st.on) total += countersOf(p.items[i]);
    return total === p.T;
  }
  if (p.goal === "square" || p.goal === "shift") {
    if (st.cells.some((v) => !v)) return false;
    const sums = MY_LINES.map(([a, b, c]) => st.cells[a] + st.cells[b] + st.cells[c]);
    return sums.every((x) => x === sums[0]);
  }
  if (p.goal === "letters") {
    const ls = Object.keys(st.dig), ds = ls.map((l) => st.dig[l]);
    if (ds.some((d) => d < 0) || new Set(ds).size !== ds.length) return false;
    if (p.rows.some((r) => r.length > 1 && st.dig[r[0]] === 0)) return false;
    return numberOf(p.rows[0], st.dig) + numberOf(p.rows[1], st.dig) === numberOf(p.rows[2], st.dig);
  }
  if (!st.start || palStr(st.start)) return false;
  let n = st.start;
  for (let k = 0; k < 8; k++) { n += revStr(n); if (palStr(n)) return n === p.P; }
  return false;
}
const replayCheck = (level, acts) => { const k = checker(level.params); let s = paheliLogic.init(level); for (const a of acts) { const r = paheliLogic.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return { s, ok: verdict(level.params, k.st) }; };

test("paheli: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("paheli"));
  assert.deepEqual([...MODES.paheli], ["pairs", "magic", "cipher", "mirror"]);
  assert.ok(FAMILY_ARTS.paheli.length === 4);
  for (const m of MODES.paheli) {
    assert.equal(LOGIC[`paheli/${m}`], paheliLogic);
    const v = playActOf("paheli", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

for (const [mode, goal, grammar] of CASES) {
  test(`paheli/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = paheliLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(paheliLogic.shortcut(level), null, `${c.signature} shortcut`);
      const sol = paheliLogic.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol).ok, `${c.signature}: the checker disagrees with the solver`);
      for (const mal of PAHELI_MAL) {
        const acts = paheliLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts).ok, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = paheliLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of EXPECT(goal, grammar)) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("paheli: mal-rule signatures are the beliefs (two odd bags, an odd count of odd bags, trays read by the sum rules, rows only, rows and columns, carries dropped, a carry of 2)", () => {
  for (const [goal, ks] of [["load", [2]], ["load", [3, 5]]]) for (const c of levelsOf("pairs", goal, { ks })) {
    const p = paheliLogic.validate(c.level).params;
    for (const mal of ["two-odds", "odd-count"]) {
      const m = malSetup(p, mal);
      if (!m) continue;
      assert.equal(m.on.length, p.k);
      assert.ok(m.on.every((i) => countersOf(p.items[i]) % 2 === 1), `${mal}: every bag odd`);
      if (mal === "two-odds") assert.ok(p.k === 2 && p.T % 2 === 1); else assert.ok(p.k % 2 === 1 && p.k >= 3 && p.T % 2 === 0);
    }
  }
  for (const c of levelsOf("pairs", "trays", { ks: [2, 3] })) {
    const p = paheliLogic.validate(c.level).params, m = malSetup(p, "like-sum");
    if (!m) continue;
    const read = m.on.reduce((t, i) => t + (p.items[i].a + p.items[i].b) % 2, 0);
    assert.equal(read % 2, p.T % 2, "the sum rules' reading fits T");
    assert.notEqual(m.on.reduce((t, i) => t + countersOf(p.items[i]), 0), p.T);
  }
  for (const c of [...levelsOf("magic", "square", {}), ...levelsOf("magic", "shift", {})]) {
    const p = paheliLogic.validate(c.level).params, S = p.set.reduce((a, b) => a + b, 0) / 3;
    assert.equal(magicSum(p.set), S);
    const r = malSetup(p, "rows"), rc = malSetup(p, "rows-cols");
    const sums = (cells) => MY_LINES.map(([a, b, d]) => cells[a] + cells[b] + cells[d]);
    if (r) { const s = sums(r.cells); assert.ok(s.slice(0, 3).every((x) => x === S) && !s.slice(3, 6).every((x) => x === S)); }
    if (rc) { const s = sums(rc.cells); assert.ok(s.slice(0, 6).every((x) => x === S) && !s.slice(6).every((x) => x === S)); }
  }
  for (const c of levelsOf("cipher", "letters", { forms: ["2+2=3", "rev", "2+2=2", "3+3=4"] })) {
    const p = paheliLogic.validate(c.level).params, [a, b, r] = p.rows;
    const ic = malSetup(p, "ignore-carry");
    if (ic) {
      // each column alone writes its letter (no carry in); the top column's spill is the extra digit
      const n = Math.max(a.length, b.length);
      for (let col = 0; col < n; col++) {
        const d = (row) => (col < row.length ? ic.dig[row[row.length - 1 - col]] : 0);
        assert.equal((d(a) + d(b)) % 10, ic.dig[r[r.length - 1 - col]]);
      }
    }
    const bc = malSetup(p, "big-carry");
    if (bc) { assert.ok(r.length > Math.max(a.length, b.length)); assert.equal(bc.dig[r[0]], 2); }
  }
});

test("paheli: no idea-free set-up wins (the first / biggest bags, the tiles in order, the digits in turn, an easy start)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const level = paheliLogic.validate(c.level), p = level.params;
    if (goal === "load" || goal === "trays") {
      const idx = p.items.map((_, i) => i), byVal = [...idx].sort((x, y) => countersOf(p.items[x]) - countersOf(p.items[y]));
      for (const on of [idx.slice(0, p.k), byVal.slice(0, p.k), byVal.slice(-p.k)]) assert.ok(!replayCheck(level, [...on.map((i) => ({ kind: "load", i })), { kind: "run" }]).ok, `${c.signature} ${on}`);
    }
    if (goal === "square" || goal === "shift") {
      const free = p.set.filter((v) => !p.given.includes(v));
      let j = 0;
      const acts = p.given.map((v, cell) => (v ? null : { kind: "put", v: free[j++], cell })).filter(Boolean);
      assert.ok(!replayCheck(level, [...acts, { kind: "run" }]).ok, `${c.signature}: the tiles in order`);
    }
    if (goal === "reach") for (const n of [10, 12, 21, 98]) assert.ok(!replayCheck(level, [{ kind: "start", n }, { kind: "run" }]).ok, `${c.signature} ${n}`);
  }
});

test("paheli: the law's rules (the boat's seats, a given cell, each digit once, the wheels; run needs a full set-up; a change starts a fresh run)", () => {
  const load = paheliLogic.validate(paheliLogic.generate(req("pairs", "load", 11, { grammar: { ks: [2] } }))[0].level);
  let s = paheliLogic.init(load);
  const ap = (lv, a) => { const r = paheliLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  assert.equal(ap(load, { kind: "run" }), "fill_seats");
  assert.equal(ap(load, { kind: "load", i: 99 }), "bad_bag");
  assert.equal(ap(load, { kind: "put", v: 1, cell: 0 }), "no_grid");
  ap(load, { kind: "load", i: 0 }); ap(load, { kind: "load", i: 1 });
  assert.equal(ap(load, { kind: "load", i: 2 }), "boat_full");
  ap(load, { kind: "load", i: 1 }); assert.deepEqual(s.on, [0], "a loaded bag tapped again comes off");
  const sol = paheliLogic.solve(load).filter((a) => a.kind === "load").map((a) => a.i);
  s = paheliLogic.init(load);
  for (const i of [0, 1, 2, 3].filter((i) => !sol.includes(i)).slice(0, 2)) ap(load, { kind: "load", i });
  ap(load, { kind: "run" }); assert.ok(s.ended && !s.done);
  assert.equal(ap(load, { kind: "run" }), "change_first");
  s = paheliLogic.init(load);
  for (const i of sol) ap(load, { kind: "load", i });
  assert.equal(ap(load, { kind: "run" }), undefined); assert.ok(s.done);
  assert.equal(ap(load, { kind: "load", i: 0 }), "level_over");

  const sq = paheliLogic.validate(paheliLogic.generate(req("magic", "square", 4, { fade: 2 }))[0].level), p = sq.params;
  s = paheliLogic.init(sq);
  const g = p.given.findIndex((v) => v), e = p.given.findIndex((v) => !v), free = p.set.filter((v) => !p.given.includes(v));
  assert.equal(ap(sq, { kind: "put", v: free[0], cell: g }), "given");
  assert.equal(ap(sq, { kind: "put", v: p.given[g], cell: e }), "bad_tile");
  assert.equal(ap(sq, { kind: "run" }), "fill_grid");
  ap(sq, { kind: "put", v: free[0], cell: e }); ap(sq, { kind: "put", v: free[1], cell: e });
  assert.equal(s.cells[e], free[1]); assert.ok(!s.cells.includes(free[0]), "a tile put on a filled cell sends the old one back");
  const e2 = p.given.findIndex((v, i) => !v && i !== e);
  ap(sq, { kind: "put", v: free[0], cell: e2 }); ap(sq, { kind: "put", v: free[0], cell: e });
  assert.equal(s.cells[e], free[0]); assert.equal(s.cells[e2], free[1], "two placed tiles swap");
  ap(sq, { kind: "put", v: free[0], cell: -1 }); assert.equal(s.cells[e], 0, "back to the tray");
  assert.deepEqual(hiddenOf(sq), [String(magicSum(p.set)), String(p.set[4])], "the teacher never says the magic sum or the centre");

  const ci = paheliLogic.validate(paheliLogic.generate(req("cipher", "letters", 6, { grammar: { forms: ["2+2=3"] }, fade: 3 }))[0].level), cp = ci.params;
  s = paheliLogic.init(ci);
  const letters = [...new Set(cp.rows.join(""))].sort(), open = letters.filter((l) => !cp.known.some((k) => k.l === l));
  const freeD = [...Array(10).keys()].filter((d) => !cp.known.some((k) => k.d === d));
  if (cp.known.length) assert.equal(ap(ci, { kind: "digit", l: cp.known[0].l, d: freeD[0] }), "given");
  if (cp.known.length) assert.equal(ap(ci, { kind: "digit", l: open[0], d: cp.known[0].d }), "given");
  assert.equal(ap(ci, { kind: "digit", l: "Z", d: 1 }), "bad_letter");
  assert.equal(ap(ci, { kind: "run" }), "set_letters");
  if (open.length > 1) {
    ap(ci, { kind: "digit", l: open[0], d: freeD[0] }); ap(ci, { kind: "digit", l: open[1], d: freeD[0] });
    assert.equal(s.dig[letters.indexOf(open[0])], -1, "a digit tile moves to the new letter");
  }

  const re = paheliLogic.validate(paheliLogic.generate(req("mirror", "reach", 3))[0].level);
  s = paheliLogic.init(re);
  assert.equal(ap(re, { kind: "run" }), "set_start");
  assert.equal(ap(re, { kind: "start", n: 9 }), "off_wheels");
  assert.equal(ap(re, { kind: "start", n: 100 }), "off_wheels");
  ap(re, { kind: "start", n: 44 });
  assert.equal(ap(re, { kind: "run" }), "already_palindrome");
});

test("paheli: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}, fade = 2) => paheliLogic.generate(req(mode, goal, 6, { grammar, fade }))[0].level;
  const load = g("pairs", "load", { ks: [3] }), trays = g("pairs", "trays"), sq = g("magic", "square"), sh = g("magic", "shift"), le = g("cipher", "letters", { forms: ["2+2=3"] }), re = g("mirror", "reach");
  for (const lv of [load, trays, sq, sh, le, re]) assert.ok(paheliLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [load, { k: 9 }], [load, { k: 1 }], [load, { T: 10000 }], [load, { items: load.params.items.slice(0, 3) }], [load, { items: [{ a: 3, b: 2 }, ...load.params.items.slice(1)] }], [load, { P: 121 }], [load, { look: 4 }], [load, { goal: "trays" }],
    [trays, { items: [{ a: 1, b: 7 }, ...trays.params.items.slice(1)] }], [trays, { items: [trays.params.items[0], ...trays.params.items.slice(0, -1)] }],
    [sq, { set: sh.params.set }], [sq, { given: Array(9).fill(0) }], [sq, { given: [9, 9, 0, 0, 0, 0, 0, 0, 0] }], [sq, { given: [0, 0, 0, 0, 5, 0, 0, 0, 1] }], [sq, { rows: ["AB", "BA", "CC"] }],
    [sh, { set: [1, 2, 3, 4, 5, 6, 7, 8, 9] }], [sh, { set: [2, 3, 4, 5, 6, 7, 8, 9, 11] }],
    [le, { rows: ["AB", "CD"] }], [le, { rows: ["ab", "cd", "efg"] }], [le, { known: [] , look: 1 }], [le, { known: [{ l: "Z", d: 1 }] }], [le, { rows: ["AB", "AB", "AB"] }], [le, { T: 3 }],
    [re, { P: 123 }], [re, { P: 1001 }], [re, { P: 1.5 }], [re, { k: 2 }],
  ]) assert.equal(paheliLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  assert.equal(paheliLogic.validate({ ...load, mode: "magic" }), null, "a goal belongs to its mode");
  assert.equal(paheliLogic.validate({ ...load, params: null }), null);
});

test("paheli: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = paheliLogic.validate(paheliLogic.generate(req("cipher", "letters", 4, { grammar: { forms: ["2+2=3"] } }))[0].level);
  const forged = paheliLogic.grade(level, sanitizeActs(env([{ kind: "run", solved: true, verdict: "solved", correct: true }])));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = paheliLogic.grade(level, env(paheliLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const sq = paheliLogic.validate(paheliLogic.generate(req("magic", "square", 4))[0].level), sol = paheliLogic.solve(sq);
  const puts = sol.filter((a) => a.kind === "put");
  // two placed tiles swapped: a wrong grid first, then the solution
  const wrong = [...puts, { kind: "put", v: puts[0].v, cell: puts[1].cell }, { kind: "run" }, ...sol];
  const g = paheliLogic.grade(sq, env(wrong));
  assert.equal(g.verdict, "solved"); assert.notEqual(g.evidence[0].outcome, "correct");
  assert.deepEqual(paheliLogic.grade(sq, env(wrong)), g);
});

// ≥ 2000 random acts per case: the law never throws; whenever a run ends the law's verdict equals the checker's on the
// checker's OWN copy of the set-up (fed every act the law accepted); the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`paheli/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws; generator p95 ≤ 50 ms`, () => {
    let seed = 17, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let gi = 0; gi < 40; gi++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); cands = paheliLogic.generate(req(mode, goal, 100 + gi, { grammar, fade: 1 + (gi % 3) })); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 4)) {
        const level = paheliLogic.validate(c.level), p = level.params, sol = paheliLogic.solve(level);
        const letters = [...new Set(p.rows.join(""))].sort();
        let s = paheliLogic.init(level), k = 0;
        const chk = checker(p), pursue = rnd() < 0.4;
        for (let i = 0; i < 60 && !s.done; i++) {
          const r = rnd(), x = rnd();
          let a;
          if (pursue && r < 0.6 && k < sol.length) a = sol[k++];
          else if (r < 0.55) {
            a = goal === "load" || goal === "trays" ? { kind: "load", i: Math.floor(x * (p.items.length + 1)) }
              : goal === "square" || goal === "shift" ? (() => {
                // mostly a loose tile onto an empty cell, so grids fill and runs happen; sometimes anything at all
                const loose = p.set.filter((v) => !s.cells.includes(v)), empty = s.cells.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
                if (loose.length && empty.length && rnd() < 0.75) return { kind: "put", v: loose[Math.floor(x * loose.length)], cell: empty[Math.floor(rnd() * empty.length)] };
                return { kind: "put", v: p.set[Math.floor(x * 9)] + (rnd() < 0.05 ? 1 : 0), cell: Math.floor(rnd() * 10) - 1 };
              })()
              : goal === "letters" ? { kind: "digit", l: letters[Math.floor(x * letters.length)] ?? "A", d: Math.floor(rnd() * 11) - 1 }
              : { kind: "start", n: 8 + Math.floor(x * 94) };
            if (rnd() < 0.2) a.correct = true;
          } else a = r < 0.85 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = paheliLogic.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, verdict(p, chk.st), `${level.levelId}: law and checker disagree (${JSON.stringify(chk.st)})`);
          }
          s = out.state;
        }
        if (paheliLogic.goalMet(level, s)) { solved++; assert.ok(verdict(p, chk.st)); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

test("paheli: every word the view shows exists in all three languages; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/paheli/paheli.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(paheli\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = ["load", "trays", "square", "shift", "letters", "reach"].map((g) => `paheli.goal.${g}`).concat(["paheli.sail", "paheli.addlines", "paheli.addup", "paheli.flip", "paheli.again"]);
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/paheli/paheli.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every paheli coverage entry serves a proven level at every fade (levelsFor and currentLevel); the
// solver's acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const PA = () => coverage().entries.filter((e) => e.family === "paheli");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("paheli coverage: the six authored entries, mapped to real kit misconceptions; the four puzzle topics are paheli's now", () => {
  assert.deepEqual(PA().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c7-maths-ch06-t01|pairs|load", "c7-maths-ch06-t01|pairs|trays", "c7-maths-ch06-t02|magic|square", "c7-maths-ch06-t02|magic|shift",
    "c7-maths-ch06-t04|cipher|letters", "c6-maths-ch03-t02|mirror|reach"]);
  for (const e of PA()) for (const kit of Object.values(e.misMap)) assert.ok(kit.startsWith(`${e.topicId}-m-`), kit);
  for (const sk of ["c7-maths-ch06-t01-s1", "c7-maths-ch06-t01-s2", "c7-maths-ch06-t01-s3", "c7-maths-ch06-t02-s1", "c7-maths-ch06-t02-s2", "c7-maths-ch06-t02-s3",
    "c7-maths-ch06-t04-s1", "c7-maths-ch06-t04-s2", "c7-maths-ch06-t04-s3", "c6-maths-ch03-t02-s2"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "paheli", sk);
  }
});

for (const e of PA()) for (const fade of [1, 2, 3]) {
  test(`paheli server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "paheli" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.look, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(paheliLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && paheliLogic.malActs(level, m));
        const mg = gradeActs(level, env(paheliLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}
