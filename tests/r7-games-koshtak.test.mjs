// r7 Games, Koshtak · expressions (tray walls between terms and a counter that works each tray, then joins them; one lid to
// make a value; a bracket opened as jumps on a number line; like terms put into bins that close into one term). Pure law
// checks: every generated level validates, its solver solves it, no idea-free set-up wins (shortcut null); an INDEPENDENT
// checker (its own tokenizer and recursive-descent parser for + − × and brackets, its own tray counter, its own copy of the
// set-up fed every act the law accepted; none of the law's helpers) agrees with the law over random play; each mal-rule's
// acts land on its OWN misconception moment; tampered params are refused; a claim in an act never decides; the generator
// is fast; and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { koshtakLogic, KOSHTAK_MAL, malSetup } from "../src/play/families/koshtak/koshtak.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const L = koshtakLogic;
const ALL = Object.fromEntries(KOSHTAK_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "koshtak", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["tray", "terms", { len: [3, 5] }],
  ["tray", "terms", { len: [5, 5] }],
  ["tray", "lid", { len: [3, 4] }],
  ["tray", "open", { len: [3, 5] }],
  ["bin", "like", { kinds: [2, 3], cards: [4, 6] }],
  ["bin", "like", { kinds: [3, 3], cards: [6, 7] }],
];
const EXPECT = { terms: ["left-to-right"], lid: ["left-to-right"], open: ["minus-first-only"], like: ["unlike-combine", "lone-letter"] };
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (its own parser; none of the law's code) ─────────────────────────────
/** tokens of an expression string: numbers, + - * ( ) (the minus and times signs read in either spelling) */
function tokens(src) {
  const out = [];
  for (const m of src.replace(/−/g, "-").replace(/×/g, "*").matchAll(/\d+|[-+*()]/g)) out.push(m[0]);
  return out;
}
/** recursive descent: expr := term (('+' | '-') term)* ; term := atom ('*' atom)* ; atom := number | '(' expr ')' */
function parse(src) {
  const t = tokens(src); let i = 0;
  const atom = () => { const x = t[i++]; if (x === "(") { const v = expr(); assert.equal(t[i++], ")"); return v; } assert.match(x, /^\d+$/); return Number(x); };
  const term = () => { let v = atom(); while (t[i] === "*") { i++; v *= atom(); } return v; };
  const expr = () => { let v = term(); while (t[i] === "+" || t[i] === "-") { const o = t[i++]; const r = term(); v = o === "+" ? v + r : v - r; } return v; };
  const v = expr(); assert.equal(i, t.length, `parsed all of ${src}`);
  return v;
}
const SIGN = { "+": "+", "−": "-", "×": "*" };
const rowSrc = (n, ops) => n.map((x, i) => (i ? `${SIGN[ops[i - 1]]} ${x}` : String(x))).join(" ");
/** the tray counter by hand: each tray strictly left to right, then the trays joined left to right */
function counter(n, ops, walls) {
  const ws = [...walls].sort((a, b) => a - b), trays = []; let at = 0;
  for (const g of ws) { trays.push([at, g]); at = g + 1; }
  trays.push([at, n.length - 1]);
  const go = (a, o, b) => (o === "+" ? a + b : o === "−" ? a - b : a * b);
  const val = trays.map(([a, b]) => { let v = n[a]; for (let i = a + 1; i <= b; i++) v = go(v, ops[i - 1], n[i]); return v; });
  let v = val[0];
  for (let k = 1; k < trays.length; k++) v = go(v, ops[trays[k][0] - 1], val[k]);
  return v;
}
/** like: a term's value for letter values (each letter of its letter part multiplied in) */
const tval = (t, vals) => t.c * t.v.split("").reduce((m, ch) => m * vals[ch], 1);
/** the checker's own copy of the set-up, fed every act the law accepted (undo pops its own stack) */
function checker(p) {
  const st = { walls: new Set(), lid: null, flips: new Set(), where: p.cards.map(() => -1) }, stack = [];
  const snap = () => ({ walls: new Set(st.walls), lid: st.lid && [...st.lid], flips: new Set(st.flips), where: [...st.where] });
  return {
    st,
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push(snap());
      if (a.kind === "wall") { if (st.walls.has(a.at)) st.walls.delete(a.at); else st.walls.add(a.at); }
      if (a.kind === "flip") { if (st.flips.has(a.at)) st.flips.delete(a.at); else st.flips.add(a.at); }
      if (a.kind === "lid") { const l = [Math.min(a.from, a.to), Math.max(a.from, a.to)]; st.lid = st.lid && st.lid[0] === l[0] && st.lid[1] === l[1] ? null : l; }
      if (a.kind === "bin") st.where[a.card] = a.to;
    },
  };
}
/** does this set-up meet the task? read from the params' plain meaning */
function verdict(p, st) {
  if (p.goal === "terms") return counter(p.n, p.ops, [...st.walls]) === parse(rowSrc(p.n, p.ops));
  if (p.goal === "lid") {
    const src = p.n.map((x, i) => `${i ? `${SIGN[p.ops[i - 1]]} ` : ""}${st.lid && i === st.lid[0] ? "(" : ""}${x}${st.lid && i === st.lid[1] ? ")" : ""}`).join(" ");
    return parse(src) === p.target;
  }
  if (p.goal === "open") {
    const bracketed = p.n.map((x, i) => `${i ? `${SIGN[p.ops[i - 1]]} ` : ""}${i === p.br[0] ? "(" : ""}${x}${i === p.br[1] ? ")" : ""}`).join(" ");
    const opened = p.n.map((x, i) => (i ? `${st.flips.has(i - 1) ? (p.ops[i - 1] === "+" ? "-" : "+") : SIGN[p.ops[i - 1]]} ${x}` : String(x))).join(" ");
    return parse(opened) === parse(bracketed);
  }
  // like: every card in a bin; each bin one letter part; no letter part in two bins; the shelf worth the belt for any letters
  if (st.where.some((b) => b < 0)) return false;
  const bins = new Map();
  p.cards.forEach((t, i) => { const k = st.where[i]; if (!bins.has(k)) bins.set(k, new Set()); bins.get(k).add(t.v); });
  const parts = [...bins.values()];
  if (parts.some((s) => s.size !== 1)) return false;
  if (new Set(parts.map((s) => [...s][0])).size !== parts.length) return false;
  for (let r = 0; r < 3; r++) {
    const vals = Object.fromEntries("abkmnpqxy".split("").map((ch, i) => [ch, 2 + ((i * 7 + r * 5) % 11)]));
    const shelf = parts.map((s) => { const v = [...s][0]; return p.cards.filter((t) => t.v === v).reduce((x, t) => x + tval(t, vals), 0); }).reduce((x, y) => x + y, 0);
    if (shelf !== p.cards.reduce((x, t) => x + tval(t, vals), 0)) return false;
  }
  return true;
}
const replayCheck = (level, acts) => { const k = checker(level.params); let s = L.init(level); for (const a of acts) { const r = L.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return { s, ok: verdict(level.params, k.st) }; };

test("koshtak: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("koshtak"));
  assert.deepEqual([...MODES.koshtak], ["tray", "bin"]);
  assert.ok(FAMILY_ARTS.koshtak.length === 4);
  for (const m of MODES.koshtak) {
    assert.equal(LOGIC[`koshtak/${m}`], L);
    const v = playActOf("koshtak", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

for (const [mode, goal, grammar] of CASES) {
  test(`koshtak/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
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
      for (const mal of KOSHTAK_MAL) {
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

test("koshtak: mal-rule signatures are the beliefs (strictly left to right; the minus on the first number only; unlike terms in one bin; lone letters as nothing)", () => {
  const l2r = (n, ops) => n.slice(1).reduce((v, x, i) => (ops[i] === "+" ? v + x : ops[i] === "−" ? v - x : v * x), n[0]);
  for (const c of levelsOf("tray", "terms", {})) {
    const p = L.validate(c.level).params, m = malSetup(p, "left-to-right");
    assert.deepEqual(m.walls, p.ops.map((_, i) => i), "one tray per number");
    assert.equal(counter(p.n, p.ops, m.walls), l2r(p.n, p.ops));
    assert.notEqual(l2r(p.n, p.ops), parse(rowSrc(p.n, p.ops)), "only where left to right differs");
  }
  for (const c of levelsOf("tray", "lid", {})) {
    const p = L.validate(c.level).params, m = malSetup(p, "left-to-right");
    if (m) { assert.equal(m.lid, null); assert.equal(l2r(p.n, p.ops), p.target, "the row read left to right makes the value: no lid needed"); }
    else assert.notEqual(l2r(p.n, p.ops), p.target);
  }
  for (const c of levelsOf("tray", "open", {})) {
    const p = L.validate(c.level).params, m = malSetup(p, "minus-first-only");
    assert.deepEqual(m.flips, [], "the bracket dropped, the signs as written");
    assert.equal(p.ops[p.br[0] - 1], "−");
  }
  for (const c of levelsOf("bin", "like", {})) {
    const p = L.validate(c.level).params;
    const u = malSetup(p, "unlike-combine");
    assert.ok(new Set(p.cards.filter((t, i) => u.where[i] === 0).map((t) => t.v)).size >= 2, "two letter kinds in one bin");
    const lo = malSetup(p, "lone-letter");
    if (lo) p.cards.forEach((t, i) => assert.equal(lo.where[i] < 0, t.v !== "" && Math.abs(t.c) === 1, "exactly the lone letters left out"));
    else assert.ok(!p.cards.some((t) => t.v !== "" && Math.abs(t.c) === 1));
  }
});

test("koshtak: no idea-free set-up wins (no walls, every wall, walls at the × only; no lid; no jump or every jump turned; one bin, a bin per card)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const level = L.validate(c.level), p = level.params;
    if (goal === "terms") {
      assert.ok(!replayCheck(level, [{ kind: "run" }]).ok, `${c.signature}: no walls`);
      assert.ok(!replayCheck(level, [...p.ops.map((_, at) => ({ kind: "wall", at })), { kind: "run" }]).ok, `${c.signature}: every wall`);
    }
    if (goal === "lid") assert.ok(!run(level, [{ kind: "run" }]).s.done, `${c.signature}: no lid`);
    if (goal === "open") {
      assert.ok(!run(level, [{ kind: "run" }]).s.done, `${c.signature}: nothing turned`);
      assert.ok(!replayCheck(level, [...p.ops.map((_, at) => ({ kind: "flip", at })), { kind: "run" }]).ok, `${c.signature}: every jump turned`);
    }
    if (goal === "like") {
      assert.ok(!replayCheck(level, [...p.cards.map((_, card) => ({ kind: "bin", card, to: 0 })), { kind: "run" }]).ok, `${c.signature}: one bin`);
    }
  }
});

test("koshtak: the law's rules (a wall toggles; one lid, the same again lifts it, never the whole row; a jump turns; a card moves between bins and back; run needs a card binned; a change starts a fresh run)", () => {
  const terms = L.validate(L.generate(req("tray", "terms", 11))[0].level), T = terms.params;
  let s = L.init(terms);
  const ap = (lv, a) => { const r = L.apply(lv, s, a, 1); s = r.state; return r.refused; };
  ap(terms, { kind: "wall", at: 0 }); assert.deepEqual(s.walls, [0]);
  ap(terms, { kind: "wall", at: 0 }); assert.deepEqual(s.walls, [], "a wall snapped again is lifted");
  for (const bad of [{ kind: "wall", at: -1 }, { kind: "wall", at: T.ops.length }, { kind: "wall", at: 0.5 }]) assert.equal(ap(terms, bad), "bad_gap");
  assert.equal(ap(terms, { kind: "lid", from: 0, to: 1 }), "no_lid");
  assert.equal(ap(terms, { kind: "flip", at: 0 }), "no_jump");
  assert.equal(ap(terms, { kind: "bin", card: 0, to: 0 }), "no_bin");
  ap(terms, { kind: "run" }); assert.ok(s.ended && !s.done);
  assert.equal(ap(terms, { kind: "run" }), "change_first");
  ap(terms, { kind: "wall", at: 0 }); assert.ok(!s.ended, "a change starts a fresh run");
  assert.deepEqual(hiddenOf(terms), [String(parse(rowSrc(T.n, T.ops)))], "the teacher never says the row's worth first");

  const lid = L.validate(L.generate(req("tray", "lid", 4))[0].level), D = lid.params;
  s = L.init(lid);
  assert.equal(ap(lid, { kind: "lid", from: 0, to: D.n.length - 1 }), "bad_lid", "never the whole row");
  assert.equal(ap(lid, { kind: "lid", from: 1, to: 1 }), "bad_lid", "a lid covers two numbers at least");
  ap(lid, { kind: "lid", from: 1, to: 0 }); assert.deepEqual(s.lid, [0, 1]);
  ap(lid, { kind: "lid", from: 0, to: 1 }); assert.equal(s.lid, null, "the same lid again lifts it");
  s = L.init(lid);
  for (const a of L.solve(lid)) assert.equal(ap(lid, a), undefined);
  assert.ok(s.done);
  assert.equal(ap(lid, { kind: "lid", from: 0, to: 1 }), "level_over");

  const open = L.validate(L.generate(req("tray", "open", 4))[0].level);
  s = L.init(open);
  ap(open, { kind: "flip", at: 0 }); assert.deepEqual(s.flips, [0]);
  ap(open, { kind: "flip", at: 0 }); assert.deepEqual(s.flips, []);
  assert.equal(ap(open, { kind: "wall", at: 0 }), "no_wall");
  const [hv, hrow] = hiddenOf(open);
  assert.equal(Number(hv), parse(open.params.n.map((x, i) => `${i ? `${SIGN[open.params.ops[i - 1]]} ` : ""}${i === open.params.br[0] ? "(" : ""}${x}${i === open.params.br[1] ? ")" : ""}`).join(" ")));
  assert.equal(parse(hrow), Number(hv), "the opened row is worth the bracketed one");

  const like = L.validate(L.generate(req("bin", "like", 4))[0].level), K = like.params;
  s = L.init(like);
  assert.equal(ap(like, { kind: "run" }), "bin_first");
  ap(like, { kind: "bin", card: 0, to: 2 }); assert.equal(s.where[0], 2);
  assert.equal(ap(like, { kind: "bin", card: 0, to: 2 }), "same_bin");
  ap(like, { kind: "bin", card: 0, to: -1 }); assert.equal(s.where[0], -1, "a card goes back on the belt");
  for (const bad of [{ kind: "bin", card: K.cards.length, to: 0 }, { kind: "bin", card: 0, to: 9 }, { kind: "bin", card: 0, to: -2 }]) assert.equal(ap(like, bad), "bad_bin");
  s = L.init(like);
  for (const a of L.solve(like)) assert.equal(ap(like, a), undefined);
  assert.ok(s.done);
  // the hidden simplest form is worth the belt for any letters
  const [form] = hiddenOf(like);
  assert.ok(form && form.length > 1);
});

test("koshtak: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}) => L.generate(req(mode, goal, 6, { grammar }))[0].level;
  const terms = g("tray", "terms"), lid = g("tray", "lid"), open = g("tray", "open"), like = g("bin", "like");
  for (const lv of [terms, lid, open, like]) assert.ok(L.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [terms, { n: [3, 4] , ops: ["×"] }], [terms, { ops: terms.params.ops.map(() => "+") }], [terms, { ops: terms.params.ops.map(() => "×") }], [terms, { n: terms.params.n.map(() => 1.5) }],
    [terms, { target: 4 }], [terms, { face: 4 }], [terms, { goal: "like" }], [terms, { n: [2, 3, 4, 5, 6, 7], ops: ["+", "×", "+", "×", "+"] }], [terms, { n: [1, 2, 3], ops: ["×", "−"] }],
    [lid, { target: lid.params.target + 1000 }], [lid, { target: -1 }], [lid, { n: [2, 3, 4, 5, 6], ops: ["+", "×", "+", "×"] }], [lid, { br: [1, 2] }],
    [open, { br: [0, 1] }], [open, { ops: open.params.ops.map(() => "+") }], [open, { br: null }], [open, { ops: open.params.ops.map((o, i) => (i === 0 ? "×" : o)) }],
    [like, { cards: like.params.cards.slice(0, 2) }], [like, { cards: like.params.cards.map((t) => ({ ...t, v: "x" })) }], [like, { cards: like.params.cards.map((t, i) => (i ? t : { ...t, c: -t.c })) }],
    [like, { cards: like.params.cards.map((t, i) => (i ? t : { ...t, v: "zz" })) }], [like, { n: [1, 2, 3] }],
  ]) assert.equal(L.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch)}`);
  assert.equal(L.validate({ ...terms, mode: "bin" }), null, "a goal belongs to its mode");
  assert.equal(L.validate({ ...like, params: null }), null);
  // a level two lids could make, or one whose minus is not before the bracket, is never valid
  assert.equal(L.validate(bad(lid, { n: [2, 2, 2], ops: ["+", "+"], target: 6 })), null);
  assert.equal(L.validate(bad(open, { n: [50, 10, 5], ops: ["+", "−"], br: [1, 2] })), null);
});

test("koshtak: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = L.validate(L.generate(req("tray", "terms", 4))[0].level);
  const forged = L.grade(level, sanitizeActs(env([...level.params.ops.map((_, at) => ({ kind: "wall", at, correct: true })), { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved");
  const ok = L.grade(level, env(L.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "run" }, ...L.solve(level)];
  const g = L.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(L.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per case: the law never throws; whenever a run ends the law's verdict equals the checker's on the
// checker's OWN copy of the set-up (fed every act the law accepted); the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`koshtak/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws; generator work bounded (counted, not timed)`, () => {
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
        const len = Math.max(p.n.length, 3);
        for (let i = 0; i < 90 && !s.done; i++) {
          const r = rnd(), x = rnd();
          const a = pursue && r < 0.7 && k < sol.length ? sol[k++]
            : r < 0.18 ? { kind: "wall", at: Math.floor(x * len) - (rnd() < 0.1 ? 1 : 0), ...(rnd() < 0.2 ? { correct: true } : {}) }
            : r < 0.3 ? { kind: "lid", from: Math.floor(x * len), to: Math.floor(rnd() * len) }
            : r < 0.45 ? { kind: "flip", at: Math.floor(x * len) }
            : r < 0.65 ? { kind: "bin", card: Math.floor(x * 8), to: Math.floor(rnd() * 6) - 1 }
            : r < 0.88 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = L.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, verdict(p, chk.st), `${level.levelId}: law and checker disagree (${JSON.stringify({ ...chk.st, walls: [...chk.st.walls], flips: [...chk.st.flips] })})`);
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

test("koshtak: every word the view shows exists in all three languages; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/koshtak/koshtak.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(koshtak\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = ["terms", "lid", "open", "like"].map((g) => `koshtak.goal.${g}`).concat(["walk", "close", "count"].map((x) => `koshtak.${x}`));
  assert.ok(used.length >= 5);
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/koshtak/koshtak.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every koshtak coverage entry serves a proven level at every fade (levelsFor and currentLevel); the
// solver's acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const KE = () => coverage().entries.filter((e) => e.family === "koshtak");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("koshtak coverage: the four authored entries, mapped to real kit misconceptions; the two expression topics are koshtak's now", () => {
  assert.deepEqual(KE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), ["c7-maths-ch02-t02|tray|terms", "c7-maths-ch02-t02|tray|lid", "c7-maths-ch02-t02|tray|open", "c7-maths-ch04-t02|bin|like"]);
  const kits = readFileSync(`${ROOT}data/kits/c7-maths.json`, "utf8");
  const ids = new Set([...kits.matchAll(/"(c7-maths-ch\d+-t\d+-m-[a-z0-9-]+)"/g)].map((m) => m[1]));
  for (const e of KE()) { assert.ok(Object.keys(e.misMap).length >= 1, e.topicId); for (const kit of Object.values(e.misMap)) { assert.ok(kit.startsWith(`${e.topicId}-m-`), kit); assert.ok(ids.has(kit), `${kit} is a verified kit id`); } }
  for (const sk of ["c7-maths-ch02-t02-s1", "c7-maths-ch02-t02-s2", "c7-maths-ch02-t02-s3", "c7-maths-ch04-t02-s2"]) { assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "koshtak", sk); }
  // no honest mechanic: these stay with the net
  for (const sk of ["c7-maths-ch02-t02-s4", "c7-maths-ch04-t02-s1", "c7-maths-ch04-t02-s3"]) assert.notEqual(entryFor({ skillId: sk })?.family, "koshtak", sk);
});

for (const e of KE()) for (const fade of [1, 2, 3]) {
  test(`koshtak server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "koshtak" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
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
