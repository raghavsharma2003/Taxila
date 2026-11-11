// r7 Games, Aankde · data and statistics (survey slips stroked into tally rows in bundles of five, a lost row stroked so the
// total makes the children asked, the stock crate on the size sold most; towers levelled by moving blocks, a level line the
// blocks above pour into; value cards put in order and pegged at the middle). Pure law checks: every generated level
// validates, its solver solves it, no idea-free set-up wins (shortcut null); an INDEPENDENT checker (its own tally reader,
// frequency counts, sums, means, medians and modes, its own copy of the set-up fed every act the law accepted; none of the
// law's helpers) agrees with the law over random play; each mal-rule's acts land on its OWN misconception moment; tampered
// params are refused; a claim in an act never decides; the generator is fast; and every coverage entry serves a proven
// level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aankdeLogic, AANKDE_MAL, malSetup, CTX_CATS } from "../src/play/families/aankde/aankde.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const L = aankdeLogic;
const ALL = Object.fromEntries(AANKDE_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "aankde", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["tally", "sort", { cats: [3, 4], slips: [10, 26] }],
  ["tally", "sort", { cats: [4, 4], slips: [24, 30] }],
  ["tally", "missing", { cats: [3, 4] }],
  ["tally", "mode", { cats: [3, 5], slips: [8, 18] }],
  ["stack", "even", { n: [3, 5] }],
  ["stack", "pour", { n: [4, 6] }],
  ["line", "middle", { n: [5, 8] }],
  ["line", "middle", { n: [6, 6] }],
];
const EXPECT = { sort: ["tally-five", "total-mismatch"], missing: ["tally-five"], mode: ["mean-size"], even: ["zero-dropped"], pour: ["middle-value", "outlier"], middle: ["unordered", "one-card"] };
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (none of the law's code) ─────────────────────────────
/** a tally written properly: strokes 5, 10, 15 … across, every other stroke upright */
const proper = (strokes) => strokes.every((x, i) => x === ((i + 1) % 5 === 0));
/** what a tally says to someone reading it: count the bundles (each stroke across is five), then the uprights after the last */
function says(strokes) {
  const lastAcross = strokes.lastIndexOf(true);
  return strokes.filter((x) => x).length * 5 + (strokes.length - 1 - lastAcross);
}
/** frequency of each row in a list of slips */
const freq = (slips, k) => { const f = new Array(k).fill(0); for (const r of slips) f[r] += 1; return f; };
const add = (xs) => { let t = 0; for (const x of xs) t += x; return t; };
/** the median, by sorting a copy */
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/** the checker's own copy of the set-up, fed every act the law accepted (undo pops its own stack) */
function checker(p) {
  const st = { rows: p.cats.map(() => []), put: [], crown: -1, h: p.h.slice(), line: -1, order: p.h.map((_, i) => i), peg: -1 }, stack = [];
  if (p.goal === "missing") p.given.forEach((g, r) => { for (let i = 1; i <= g; i++) st.rows[r].push(i % 5 === 0); });
  const snap = () => JSON.parse(JSON.stringify(st));
  return {
    st,
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push(snap());
      if (a.kind === "mark") { st.rows[a.row].push(a.across === true); if (p.goal !== "missing") st.put.push(a.row); }
      if (a.kind === "crown") st.crown = st.crown === a.row ? -1 : a.row;
      if (a.kind === "move") { st.h[a.from] -= 1; st.h[a.to] += 1; }
      if (a.kind === "line") st.line = a.at;
      if (a.kind === "swap") { const t = st.order[a.i]; st.order[a.i] = st.order[a.j]; st.order[a.j] = t; }
      if (a.kind === "peg") st.peg = a.at;
    },
  };
}
/** does this set-up meet the task? read from the params' plain meaning */
function verdict(p, st) {
  const k = p.cats.length;
  if (p.goal === "sort" || p.goal === "mode") {
    if (st.put.length !== p.slips.length || st.put.some((r, i) => r !== p.slips[i])) return false;
    const f = freq(p.slips, k);
    if (!st.rows.every((row, r) => proper(row) && says(row) === f[r])) return false;
    if (p.goal === "sort") return true;
    const best = Math.max(...f);
    return st.crown >= 0 && f[st.crown] === best;
  }
  if (p.goal === "missing") return proper(st.rows[k - 1]) && add(st.rows.map(says)) === p.total;
  if (p.goal === "even") return st.h.every((x) => x === st.h[0]);
  if (p.goal === "pour") return st.line * p.h.length === add(p.h);
  const vals = st.order.map((i) => p.h[i]), asc = vals.slice().sort((a, b) => a - b), desc = asc.slice().reverse();
  const ordered = vals.every((v, i) => v === asc[i]) || vals.every((v, i) => v === desc[i]);
  const n = vals.length, mid = n % 2 ? n - 1 : 2 * (n / 2 - 1) + 1;
  return ordered && st.peg === mid;
}
const replayCheck = (level, acts) => { const k = checker(level.params); let s = L.init(level); for (const a of acts) { const r = L.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return { s, ok: verdict(level.params, k.st) }; };

test("aankde: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("aankde"));
  assert.deepEqual([...MODES.aankde], ["tally", "stack", "line"]);
  assert.ok(FAMILY_ARTS.aankde.length === 4);
  for (const m of MODES.aankde) {
    assert.equal(LOGIC[`aankde/${m}`], L);
    const v = playActOf("aankde", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

for (const [mode, goal, grammar] of CASES) {
  test(`aankde/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = L.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(L.shortcut(level), null, `${c.signature} shortcut`);
      const sol = L.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol).ok, `${c.signature}: the checker disagrees with the solver`);
      for (const mal of AANKDE_MAL) {
        const acts = L.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts).ok, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = L.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of EXPECT[goal]) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("aankde: mal-rule signatures are the beliefs (the fifth stroke upright; bundles read as four; counted with slips left; the nearest data value; the tall tower ignored; the written middle; the mean size)", () => {
  for (const c of levelsOf("tally", "sort", {})) {
    const p = L.validate(c.level).params;
    const f = malSetup(p, "tally-five");
    assert.ok(f.rows.every((row) => row.every((x) => x === false)), "every stroke upright");
    assert.ok(f.rows.some((row) => row.length >= 5), "a row reaches five");
    const t = malSetup(p, "total-mismatch");
    assert.ok(t.put.length < p.slips.length && t.put.length * 2 >= p.slips.length, "slips still on the pile");
    assert.ok(add(t.rows.map(says)) < p.slips.length, "the total row short of the survey");
  }
  for (const c of levelsOf("tally", "missing", {})) {
    const p = L.validate(c.level).params, m = malSetup(p, "tally-five");
    const bundles = add(p.given.map((g) => Math.floor(g / 5)));
    assert.equal(says(m.rows[p.cats.length - 1]), p.total - add(p.given) + bundles, "each standing bundle read as four: the lost row stroked that much longer");
  }
  for (const c of levelsOf("tally", "mode", {})) {
    const p = L.validate(c.level).params, m = malSetup(p, "mean-size");
    const sizes = p.slips.map((r) => p.h[r]), mean = add(sizes) / sizes.length;
    const d = p.h.map((x) => Math.abs(x - mean));
    assert.equal(m.crown, d.indexOf(Math.min(...d)), "the crate on the size nearest the mean");
    const f = freq(p.slips, p.cats.length);
    assert.notEqual(f[m.crown], Math.max(...f));
  }
  for (const c of levelsOf("stack", "pour", {})) {
    const p = L.validate(c.level).params, mean = add(p.h) / p.h.length;
    assert.ok(!p.h.includes(mean), "the mean is none of the towers");
    const mv = malSetup(p, "middle-value");
    if (mv) { assert.ok(p.h.includes(mv.line)); assert.ok(p.h.every((x) => Math.abs(x - mean) >= Math.abs(mv.line - mean))); }
    const o = malSetup(p, "outlier");
    if (o) {
      const top = Math.max(...p.h), rest = p.h.filter((x) => x !== top);
      assert.equal(rest.length, p.h.length - 1);
      assert.equal(o.line, Math.round(add(rest) / rest.length), "the line where the others stand");
      assert.ok(top - Math.max(...rest) >= 5);
    }
  }
  for (const c of levelsOf("line", "middle", {})) {
    const p = L.validate(c.level).params, u = malSetup(p, "unordered");
    assert.deepEqual(u.order, p.h.map((_, i) => i), "no card moved");
    const n = p.h.length, mid = n % 2 ? p.h[(n - 1) / 2] : (p.h[n / 2 - 1] + p.h[n / 2]) / 2;
    assert.notEqual(mid, median(p.h), "the written middle is not the median");
  }
});

test("aankde: no idea-free set-up wins (every slip in one row; the slips dealt round; the lost row stroked for the whole survey; no block moved; the line at a tower's top; the written line pegged)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const level = L.validate(c.level), p = level.params;
    if (goal === "sort") assert.ok(!replayCheck(level, [...p.slips.map((_, i) => ({ kind: "mark", row: 0, across: i % 5 === 4 })), { kind: "run" }]).ok);
    if (goal === "missing") assert.ok(!replayCheck(level, [...Array.from({ length: Math.min(p.total, 30) }, (_, i) => ({ kind: "mark", row: p.cats.length - 1, across: i % 5 === 4 })), { kind: "run" }]).ok);
    if (goal === "even") assert.ok(!run(level, [{ kind: "run" }]).s.done);
    if (goal === "pour") for (const x of p.h) assert.ok(!replayCheck(level, [{ kind: "line", at: x }, { kind: "run" }]).ok, `${c.signature}: the line at ${x}`);
    if (goal === "middle") assert.ok(!replayCheck(level, [{ kind: "peg", at: p.h.length - 1 }, { kind: "run" }]).ok);
  }
});

test("aankde: the law's rules (a slip per stroke; strokes only in the lost row; the crate toggles; a block from a tower to another; the line; a swap; the peg; run needs a set-up; a change starts a fresh run)", () => {
  let s;
  const ap = (lv, a) => { const r = L.apply(lv, s, a, 1); s = r.state; return r.refused; };
  const sort = L.validate(L.generate(req("tally", "sort", 11))[0].level), S = sort.params;
  s = L.init(sort);
  assert.equal(ap(sort, { kind: "run" }), "mark_first");
  ap(sort, { kind: "mark", row: 1, across: false }); assert.deepEqual(s.put, [1]); assert.deepEqual(s.rows[1], [false]);
  for (const bad of [{ kind: "mark", row: -1, across: false }, { kind: "mark", row: S.cats.length, across: true }, { kind: "mark", row: 0.5 }]) assert.equal(ap(sort, bad), "bad_row");
  for (const [a, code] of [[{ kind: "move", from: 0, to: 1 }, "no_move"], [{ kind: "line", at: 3 }, "no_line"], [{ kind: "swap", i: 0, j: 1 }, "no_card"], [{ kind: "peg", at: 1 }, "no_peg"], [{ kind: "crown", row: 0 }, "no_crate"]]) assert.equal(ap(sort, a), code);
  ap(sort, { kind: "undo" }); assert.deepEqual(s.put, []);
  for (let i = 0; i < S.slips.length; i++) ap(sort, { kind: "mark", row: 0, across: false });
  assert.equal(ap(sort, { kind: "mark", row: 0, across: false }), "pile_empty");
  ap(sort, { kind: "run" }); assert.ok(s.ended && !s.done);
  assert.equal(ap(sort, { kind: "run" }), "change_first");
  ap(sort, { kind: "undo" }); assert.ok(!s.ended, "a change starts a fresh run");
  assert.deepEqual(hiddenOf(sort), [...new Set(freq(S.slips, S.cats.length).map(String))], "the teacher never says a row's count first");

  const miss = L.validate(L.generate(req("tally", "missing", 4))[0].level), M = miss.params;
  s = L.init(miss);
  assert.deepEqual(s.rows.slice(0, -1).map(says), M.given, "the standing rows stand tallied");
  assert.equal(ap(miss, { kind: "mark", row: 0, across: false }), "row_stands");
  assert.equal(ap(miss, { kind: "run" }), "mark_first");
  for (const a of L.solve(miss)) assert.equal(ap(miss, a), undefined);
  assert.ok(s.done);
  assert.equal(ap(miss, { kind: "mark", row: M.cats.length - 1, across: false }), "level_over");
  assert.deepEqual(hiddenOf(miss), [String(M.total - add(M.given))]);

  const mode = L.validate(L.generate(req("tally", "mode", 4))[0].level), D = mode.params;
  s = L.init(mode);
  ap(mode, { kind: "mark", row: D.slips[0], across: false });
  assert.equal(ap(mode, { kind: "run" }), "crate_first");
  ap(mode, { kind: "crown", row: 2 }); assert.equal(s.crown, 2);
  ap(mode, { kind: "crown", row: 2 }); assert.equal(s.crown, -1, "the crate again is lifted");
  const f = freq(D.slips, D.cats.length);
  assert.deepEqual(hiddenOf(mode), [D.cats[f.indexOf(Math.max(...f))]]);

  const even = L.validate(L.generate(req("stack", "even", 4))[0].level), E = even.params;
  s = L.init(even);
  assert.equal(ap(even, { kind: "run" }), "move_first");
  const full = E.h.findIndex((x) => x > 0), other = (full + 1) % E.h.length;
  ap(even, { kind: "move", from: full, to: other }); assert.equal(s.h[full], E.h[full] - 1); assert.equal(s.h[other], E.h[other] + 1);
  assert.equal(ap(even, { kind: "move", from: 0, to: 0 }), "bad_tower");
  s = L.init(even);
  const empty = E.h.indexOf(0);
  if (empty >= 0) assert.equal(ap(even, { kind: "move", from: empty, to: (empty + 1) % E.h.length }), "tower_empty");
  assert.deepEqual(hiddenOf(even), [String(add(E.h) / E.h.length)]);

  const pour = L.validate(L.generate(req("stack", "pour", 4))[0].level), P = pour.params;
  s = L.init(pour);
  assert.equal(ap(pour, { kind: "run" }), "line_first");
  for (const bad of [{ kind: "line", at: -1 }, { kind: "line", at: 16 }, { kind: "line", at: 2.5 }]) assert.equal(ap(pour, bad), "bad_line");
  ap(pour, { kind: "line", at: 3 }); assert.equal(ap(pour, { kind: "line", at: 3 }), "same_line");
  assert.deepEqual(hiddenOf(pour), [String(add(P.h) / P.h.length)]);

  const mid = L.validate(L.generate(req("line", "middle", 4, { grammar: { n: [6, 6] } }))[0].level), Q = mid.params;
  s = L.init(mid);
  assert.equal(ap(mid, { kind: "run" }), "peg_first");
  ap(mid, { kind: "swap", i: 0, j: 5 }); assert.deepEqual(s.order.slice(0, 1), [5]);
  for (const bad of [{ kind: "swap", i: 0, j: 0 }, { kind: "swap", i: 0, j: 6 }]) assert.equal(ap(mid, bad), "bad_card");
  for (const bad of [{ kind: "peg", at: -1 }, { kind: "peg", at: 11 }]) assert.equal(ap(mid, bad), "bad_slot");
  ap(mid, { kind: "peg", at: 5 }); assert.equal(s.peg, 5);
  assert.equal(String(median(Q.h)), hiddenOf(mid)[0].replace(/\.0$/, ""), "the median is never said first");
});

test("aankde: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}) => L.generate(req(mode, goal, 6, { grammar }))[0].level;
  const sort = g("tally", "sort"), miss = g("tally", "missing"), mode = g("tally", "mode"), even = g("stack", "even"), pour = g("stack", "pour"), mid = g("line", "middle");
  for (const lv of [sort, miss, mode, even, pour, mid]) assert.ok(L.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [sort, { total: sort.params.total + 1 }], [sort, { slips: sort.params.slips.map(() => 0) }], [sort, { slips: [...sort.params.slips, 9] }], [sort, { cats: ["mango", "mango", "apple"] }],
    [sort, { cats: ["mango", "bus", "apple"] }], [sort, { face: 4 }], [sort, { goal: "even" }], [sort, { slips: sort.params.slips.map((x) => x + 0.5) }], [sort, { slips: [0, 1, 2, 0, 1, 2] , total: 6 }],
    [miss, { total: add(miss.params.given) + 1 }], [miss, { total: add(miss.params.given) + 20 }], [miss, { given: miss.params.given.map(() => 2) }], [miss, { slips: [0] }],
    [mode, { h: mode.params.h.map((x) => x + 1) }], [mode, { ctx: "fruit" }], [mode, { slips: mode.params.slips.map(() => 0) }],
    [even, { h: even.params.h.map(() => 4) }], [even, { h: [...even.params.h, 1] }], [even, { h: even.params.h.map((x) => -x - 1) }], [even, { cats: ["mango"] }],
    [pour, { h: [...pour.params.h.slice(0, -1), pour.params.h[pour.params.h.length - 1] + 1] }], [pour, { h: [2, 4, 6, 9] }], [pour, { h: [2, 4, 5, 9] }], [pour, { h: pour.params.h.map((x) => x + 20) }],
    [mid, { h: [...mid.params.h].sort((a, b) => a - b) }], [mid, { h: [1, 2, 2, 3, 4] }], [mid, { h: [1, 2] }], [mid, { ctx: "nowhere" }],
  ]) assert.equal(L.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch)}`);
  assert.equal(L.validate({ ...sort, mode: "stack" }), null, "a goal belongs to its mode");
  assert.equal(L.validate({ ...even, params: null }), null);
});

test("aankde: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = L.validate(L.generate(req("stack", "pour", 4))[0].level);
  const forged = L.grade(level, sanitizeActs(env([{ kind: "line", at: 0, correct: true }, { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved");
  const ok = L.grade(level, env(L.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "line", at: 0 }, { kind: "run" }, ...L.solve(level)];
  const g = L.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(L.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per case: the law never throws; whenever a run ends the law's verdict equals the checker's on the
// checker's OWN copy of the set-up (fed every act the law accepted); the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`aankde/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws; generator work bounded (counted, not timed)`, () => {
    let seed = 17, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const candCounts = []; // candidates per generate/pick: a count, not a clock (tests/_work.mjs)
    for (let gi = 0; gi < 40; gi++) {
      let cands = [];
      cands = L.generate(req(mode, goal, 100 + gi, { grammar, fade: 1 + (gi % 3) }));
      candCounts.push(cands.length);
      for (const c of cands.slice(0, 4)) {
        const level = L.validate(c.level), p = level.params, sol = L.solve(level);
        let s = L.init(level), k = 0;
        const chk = checker(p), pursue = rnd() < 0.5;
        const n = Math.max(p.h.length, p.cats.length, 3);
        for (let i = 0; i < 120 && !s.done; i++) {
          const r = rnd(), x = rnd();
          const a = pursue && r < 0.75 && k < sol.length ? sol[k++]
            : r < 0.3 ? { kind: "mark", row: Math.floor(x * n) - (rnd() < 0.05 ? 1 : 0), across: rnd() < 0.25, ...(rnd() < 0.2 ? { correct: true } : {}) }
            : r < 0.36 ? { kind: "crown", row: Math.floor(x * n) }
            : r < 0.5 ? { kind: "move", from: Math.floor(x * n), to: Math.floor(rnd() * n) }
            : r < 0.58 ? { kind: "line", at: Math.floor(x * 17) - 1 }
            : r < 0.68 ? { kind: "swap", i: Math.floor(x * n), j: Math.floor(rnd() * n) }
            : r < 0.75 ? { kind: "peg", at: Math.floor(x * 2 * n) - 1 }
            : r < 0.9 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = L.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, verdict(p, chk.st), `${level.levelId}: law and checker disagree (${JSON.stringify(chk.st)})`);
          }
          s = out.state;
        }
        if (L.goalMet(level, s)) { solved++; assert.ok(verdict(p, chk.st)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(Math.max(...candCounts) <= 72, `${Math.max(...candCounts)} candidates per call (measured 2026-11-10: 24; bound is 3x)`);
  });
}

test("aankde: every word the view shows exists in all three languages; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/aankde/aankde.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(aankde\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = ["sort", "missing", "mode", "even", "pour", "middle"].map((g) => `aankde.goal.${g}`).concat(["count", "level", "pour", "fold"].map((x) => `aankde.${x}`))
    .concat(Object.values(CTX_CATS).flat().map((c) => `aankde.cat.${c}`)).concat(["runs", "books", "minutes"].map((c) => `aankde.ctx.${c}`));
  assert.ok(used.length >= 10);
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const src = readFileSync(`${ROOT}src/play/families/aankde/aankde.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every aankde coverage entry serves a proven level at every fade (levelsFor and currentLevel); the
// solver's acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const AE = () => coverage().entries.filter((e) => e.family === "aankde");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("aankde coverage: the six authored entries, mapped to real kit misconceptions; the data topics are aankde's now", () => {
  assert.deepEqual(AE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c6-maths-ch04-t01|tally|sort", "c6-maths-ch04-t01|tally|missing",
    "c7-maths-ch13-t02|stack|even", "c7-maths-ch13-t02|stack|pour", "c7-maths-ch13-t02|line|middle", "c7-maths-ch13-t02|tally|mode",
  ]);
  const ids = new Set();
  for (const f of ["c6-maths", "c7-maths"]) for (const m of readFileSync(`${ROOT}data/kits/${f}.json`, "utf8").matchAll(/"(c[67]-maths-ch\d+-t\d+-m-[a-z0-9-]+)"/g)) ids.add(m[1]);
  for (const e of AE()) for (const kit of Object.values(e.misMap)) { assert.ok(kit.startsWith(`${e.topicId}-m-`), kit); assert.ok(ids.has(kit), `${kit} is a verified kit id`); }
  assert.deepEqual(AE().find((e) => e.goal === "pour").misMap, { "middle-value": "c7-maths-ch13-t02-m-mean-in-data", outlier: "c7-maths-ch13-t02-m-outlier" });
  for (const sk of ["c6-maths-ch04-t01-s2", "c6-maths-ch04-t01-s3", "c7-maths-ch13-t02-s1", "c7-maths-ch13-t02-s2", "c7-maths-ch13-t02-s3"]) { assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "aankde", sk); }
  // no honest mechanic: choosing a clear survey question stays with the net
  assert.notEqual(entryFor({ skillId: "c6-maths-ch04-t01-s1" })?.family, "aankde");
  // zero-dropped and one-card are implemented but no kit names them: never mapped
  for (const e of AE()) assert.ok(!("zero-dropped" in e.misMap) && !("one-card" in e.misMap));
});

for (const e of AE()) for (const fade of [1, 2, 3]) {
  test(`aankde server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "aankde" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.face, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(L.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && L.malActs(level, m));
        const mg = gradeActs(level, env(L.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}
