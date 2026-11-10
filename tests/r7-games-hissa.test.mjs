// r7 Games, Hissa · multiplying and dividing fractions and decimals (a sheet folded across and down, the overlap tagged by
// counting; rope pieces laid on a metre track; a jug poured into full cups, the part-cup tagged as a fraction of a cup; a
// tenths grid shaded both ways and the label's point placed; digits slid past a fixed point; a bar spent twice, the second
// fold on what is left; a recipe folded into shares and laid per person). Pure law checks: every generated level validates,
// its solver solves it, no idea-free set-up wins (shortcut null); an INDEPENDENT checker (plain integer numerators and
// denominators cross-multiplied, amounts in millionths; its own copy of the set-up fed every act the law accepted; none of
// the law's helpers) agrees with the law over random play; each mal-rule's acts land on its OWN misconception moment;
// tampered params are refused; a claim in an act never decides; the generator is fast; and every coverage entry serves a
// proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hissaLogic, HISSA_MAL, malSetup } from "../src/play/families/hissa/hissa.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { CHANCE_WEIGHT, GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const ALL = Object.fromEntries(HISSA_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "hissa", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = hissaLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = hissaLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["fold", "of", { same: 1 }],
  ["fold", "of", { same: 0 }],
  ["fold", "times", {}],
  ["pour", "fit", { unit: 1 }],
  ["pour", "fit", {}],
  ["pour", "part", {}],
  ["pour", "deci", { glasses: [50] }],
  ["pour", "deci", { glasses: [25, 20, 40, 60, 75] }],
  ["grid", "mul", {}],
  ["grid", "shift", { moves: [1, 2, 3, -1, -2], form: "times" }],
  ["grid", "shift", { moves: [-1, -2, -3], form: "div" }],
  ["story", "rest", {}],
  ["story", "scale", {}],
];
const EXPECT = { "of:1": ["keep-den"], "of:0": [], times: ["whole-both", "mult-bigger"], "fit:1": ["div-smaller"], fit: ["div-smaller"], part: ["no-flip", "flip-first"],
  "deci:50": ["div-half", "scale-one"], deci: ["div-smaller", "scale-one"], mul: ["point-one"], "shift:times": ["append-zero"], "shift:div": [], rest: ["of-original"], scale: ["scale-flip"] };
const expectOf = (goal, g) => EXPECT[g.same !== undefined ? `${goal}:${g.same}` : g.unit ? `${goal}:1` : g.glasses?.length === 1 ? `${goal}:${g.glasses[0]}` : g.form ? `${goal}:${g.form}` : goal];
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of hissaLogic.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (plain integer arithmetic, none of the law's code) ─────────────────────────────
/** the checker's own copy of the set-up, fed every act the law accepted (undo pops its own stack) */
function checker() {
  const st = { f0: 1, k0: 0, f1: 1, k1: 0, on: 0, lay: 0, cups: 0, say: -1, lock: false, t0: 0, t1: 0, sh: 0, zero: false, pt: 0 }, stack = [];
  return {
    st,
    feed(a) {
      // a run the law answered frees a count the jug was testing; an undo never takes back a tested count
      if (a.kind === "run") { st.lock = false; return; }
      if (a.kind === "undo") { const keep = st.lock ? { say: st.say, lock: true } : {}; if (stack.length) Object.assign(st, stack.pop()); Object.assign(st, keep); return; }
      stack.push({ ...st });
      if (a.kind === "count") st.say = a.n;
      if (a.kind === "pour") st.lock = true;
      if (a.kind === "fold") { const keep = (k) => (a.n < 2 ? 0 : Math.min(k, a.n)); if (a.side === 0) { st.f0 = a.n; st.k0 = keep(st.k0); } else { st.f1 = a.n; st.k1 = keep(st.k1); } }
      if (a.kind === "shade") { if (a.side === 0) st.k0 = a.k; else st.k1 = a.k; }
      if (a.kind === "base") st.on = a.on;
      if (a.kind === "lay") st.lay = a.n;
      if (a.kind === "pour") st.cups += 1;
      if (a.kind === "tag") { if (a.part === 0) st.t0 = a.v; else st.t1 = a.v; }
      if (a.kind === "slide") st.sh += a.by;
      if (a.kind === "zero") st.zero = !st.zero;
      if (a.kind === "point") st.pt = a.at;
    },
  };
}
/** does this set-up meet the task? read from the params' plain meaning, cross-multiplied */
function verdict(p, st) {
  const { a, b, c, d, w } = p;
  switch (p.goal) {
    case "of": return st.f0 > 1 && st.f1 > 1 && st.k0 * b === a * st.f0 && st.k1 * d === c * st.f1 && st.t1 > 0 && st.t0 * b * d === a * c * st.t1;
    case "times": return st.lay === w && st.t1 > 0 && st.t0 * b === w * a * st.t1;
    case "fit": case "part": case "deci": {
      // the jug jn/jd litres, the cup c/d: how many cups fit is (jn·d) ÷ (jd·c); what is left over, in cups, is rem/(jd·c)
      const jn = p.goal === "fit" ? w : a, jd = p.goal === "fit" ? 1 : b;
      const whole = Math.floor((jn * d) / (jd * c)), rem = jn * d - whole * jd * c;
      if (st.cups !== whole || st.say !== whole) return false;   // the count said first is the cups that fit
      return rem === 0 ? st.t0 === 0 : st.t1 > 0 && st.t0 * jd * c === rem * st.t1;
    }
    case "mul": return st.k0 === a && st.k1 === c && st.pt === 2;
    case "shift": {
      // millionths: the chart reads a·10^(sh − b); the task asks a·10^(c − b)
      const at = (e) => (e >= 0 ? a * 10 ** e : (a * 10 ** 6) / 10 ** -e);
      return at(6 - b + st.sh) === at(6 - b + c);
    }
    case "rest": {
      // amounts in the bar's own units, times the folds (no division): the first spend and the second, on what is left
      if (st.f0 < 2 || st.f1 < 2 || st.on !== 1) return false;
      const firstOk = w * st.k0 * b === w * a * st.f0;
      const second = w * (st.f0 - st.k0) * st.k1, want2 = w * (b - a) * c;   // over f0·f1 and b·d
      return firstOk && second * b * d === want2 * st.f0 * st.f1;
    }
    case "scale": return st.lay > 0 && st.f0 > 0 && a * st.lay * c === a * d * st.f0;
  }
  return false;
}
const replayCheck = (level, acts) => { const k = checker(); let s = hissaLogic.init(level); for (const a of acts) { const r = hissaLogic.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return { s, ok: verdict(level.params, k.st) }; };

test("hissa: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("hissa"));
  assert.deepEqual([...MODES.hissa], ["fold", "pour", "grid", "story"]);
  assert.ok(FAMILY_ARTS.hissa.length === 4);
  for (const m of MODES.hissa) {
    assert.equal(LOGIC[`hissa/${m}`], hissaLogic);
    const v = playActOf("hissa", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

for (const [mode, goal, grammar] of CASES) {
  test(`hissa/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = hissaLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(hissaLogic.shortcut(level), null, `${c.signature} shortcut`);
      const sol = hissaLogic.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol).ok, `${c.signature}: the checker disagrees with the solver`);
      for (const mal of HISSA_MAL) {
        const acts = hissaLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts).ok, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = hissaLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of expectOf(goal, grammar)) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("hissa: mal-rule signatures are the beliefs (a shared bottom kept, the whole number on top and bottom, 3 × 1/4 as 12, the cups as jug × cup, ÷ as ×, the first fraction flipped, ÷ 0.5 as halving, only the glass × 10, one decimal place, a zero written at the end, the second part of the whole, the recipe scaled the wrong way)", () => {
  const val = (su) => su.cups + (su.tag[0] ? su.tag[0] / su.tag[1] : 0);
  const near = (x, y) => Math.abs(x - y) < 1e-9;
  for (const c of levelsOf("fold", "of", { same: 1 })) {
    const p = hissaLogic.validate(c.level).params, m = malSetup(p, "keep-den");
    if (m) { assert.equal(p.b, p.d); assert.deepEqual(m.tag, [p.a * p.c, p.b], "2/5 × 3/5 tagged 6/5"); }
  }
  for (const c of levelsOf("fold", "times", {})) {
    const p = hissaLogic.validate(c.level).params;
    const wb = malSetup(p, "whole-both"); if (wb) assert.deepEqual(wb.tag, [p.w * p.a, p.w * p.b]);
    const mb = malSetup(p, "mult-bigger"); if (mb) { assert.equal(p.a, 1); assert.deepEqual(mb.tag, [p.w * p.b, 1]); }
  }
  for (const c of levelsOf("pour", "fit", {})) { const p = hissaLogic.validate(c.level).params, m = malSetup(p, "div-smaller"); if (m) assert.ok(near(val(m), (p.w * p.c) / p.d)); }
  for (const c of levelsOf("pour", "part", {})) {
    const p = hissaLogic.validate(c.level).params;
    const nf = malSetup(p, "no-flip"); if (nf) assert.ok(near(val(nf), (p.a / p.b) * (p.c / p.d)), "3/4 ÷ 1/2 as 3/8");
    const ff = malSetup(p, "flip-first"); if (ff) assert.ok(near(val(ff), (p.b / p.a) * (p.c / p.d)), "2/3 ÷ 1/6 as 3/2 × 1/6");
  }
  for (const c of [...levelsOf("pour", "deci", { glasses: [50] }), ...levelsOf("pour", "deci", {})]) {
    const p = hissaLogic.validate(c.level).params, J = p.a / p.b, C = p.c / p.d;
    const dh = malSetup(p, "div-half"); if (dh) { assert.equal(C, 0.5); assert.ok(near(val(dh), J / 2), "10 ÷ 0.5 as 5"); }
    const ds = malSetup(p, "div-smaller"); if (ds) { assert.notEqual(C, 0.5); assert.ok(near(val(ds), J * C)); }
    const so = malSetup(p, "scale-one"); if (so) assert.ok(near(val(so), J / p.c), "4.8 ÷ 0.6 as 4.8 ÷ 6");
  }
  for (const c of levelsOf("grid", "mul", {})) { const p = hissaLogic.validate(c.level).params; assert.deepEqual(malSetup(p, "point-one"), { k0: p.a, k1: p.c, pt: 1 }); }
  for (const c of levelsOf("grid", "shift", { moves: [1, 2, 3], form: "times" })) assert.deepEqual(malSetup(hissaLogic.validate(c.level).params, "append-zero"), { sh: 0, zero: true });
  for (const c of levelsOf("story", "rest", {})) { const p = hissaLogic.validate(c.level).params; assert.deepEqual(malSetup(p, "of-original"), { f0: p.b, k0: p.a, on: 2, f1: p.d, k1: p.c }); }
  for (const c of levelsOf("story", "scale", {})) { const p = hissaLogic.validate(c.level).params; assert.deepEqual(malSetup(p, "scale-flip"), { f0: p.d, lay: p.c }); }
});

test("hissa: no idea-free set-up wins (a fraction tagged alone, the rope as one piece, the jug's number of cups, the point anywhere else, the digits the wrong way, both folds on the whole, one share for one)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const level = hissaLogic.validate(c.level), p = level.params;
    if (goal === "of") for (const tag of [[p.a, p.b], [p.c, p.d]]) assert.ok(!replayCheck(level, [{ kind: "fold", side: 0, n: p.b }, { kind: "shade", side: 0, k: p.a }, { kind: "fold", side: 1, n: p.d }, { kind: "shade", side: 1, k: p.c }, { kind: "tag", part: 1, v: tag[1] }, { kind: "tag", part: 0, v: tag[0] }, { kind: "run" }]).ok);
    if (goal === "times") assert.ok(!run(level, [{ kind: "lay", n: p.w }, { kind: "tag", part: 1, v: p.b }, { kind: "tag", part: 0, v: p.a }, { kind: "run" }]).s.done, "one piece's length");
    if (goal === "mul") for (const at of [1, 3]) assert.ok(!run(level, [{ kind: "shade", side: 0, k: p.a }, { kind: "shade", side: 1, k: p.c }, { kind: "point", at }, { kind: "run" }]).s.done);
    if (goal === "shift") assert.ok(!run(level, [...Array.from({ length: Math.abs(p.c) }, () => ({ kind: "slide", by: p.c > 0 ? -1 : 1 })), { kind: "run" }]).s.done, "the wrong way");
    if (goal === "scale") assert.ok(!run(level, [{ kind: "lay", n: 1 }, { kind: "run" }]).s.done, "one share for one");
    if (goal === "fit" || goal === "part" || goal === "deci") assert.ok(!run(level, [{ kind: "tag", part: 1, v: 1 }, { kind: "tag", part: 0, v: 1 }, { kind: "run" }]).s.done || false, "no cups poured");
  }
});

test("hissa: the law's rules (folds toggle shading within them; a jug pours only full cups; the second fold needs its bar; the chart keeps its digits; run needs a set-up; a change starts a fresh run)", () => {
  const of = hissaLogic.validate(hissaLogic.generate(req("fold", "of", 11))[0].level), O = of.params;
  let s = hissaLogic.init(of);
  const ap = (lv, a) => { const r = hissaLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  assert.equal(ap(of, { kind: "shade", side: 0, k: 1 }), "bad_shade", "an unfolded sheet has no strips to shade");
  assert.equal(ap(of, { kind: "run" }), "fold_first");
  ap(of, { kind: "fold", side: 0, n: O.b }); ap(of, { kind: "shade", side: 0, k: O.a });
  assert.equal(ap(of, { kind: "shade", side: 0, k: O.b + 1 }), "bad_shade");
  ap(of, { kind: "fold", side: 0, n: 1 }); assert.equal(s.k[0], 0, "refolding to fewer strips keeps the shading within them");
  ap(of, { kind: "undo" }); assert.equal(s.k[0], O.a);
  ap(of, { kind: "fold", side: 1, n: O.d }); ap(of, { kind: "shade", side: 1, k: O.c });
  assert.equal(ap(of, { kind: "run" }), "tag_first");
  for (const bad of [{ kind: "fold", side: 2, n: 3 }, { kind: "fold", side: 0, n: 13 }, { kind: "fold", side: 0, n: 0 }]) assert.equal(ap(of, bad), "bad_fold");
  for (const bad of [{ kind: "pour" }, { kind: "slide", by: 1 }, { kind: "point", at: 1 }, { kind: "base", on: 1 }, { kind: "lay", n: 2 }]) assert.ok(ap(of, bad).startsWith("no_"), bad.kind);
  ap(of, { kind: "tag", part: 1, v: 99 }); assert.equal(ap(of, { kind: "tag", part: 1, v: 100 }), "bad_tag");
  ap(of, { kind: "tag", part: 0, v: 1 }); ap(of, { kind: "run" });
  assert.ok(s.ended && !s.done);
  assert.equal(ap(of, { kind: "run" }), "change_first");
  ap(of, { kind: "tag", part: 0, v: 2 }); assert.ok(!s.ended, "a change starts a fresh run");

  const fit = hissaLogic.validate(hissaLogic.generate(req("pour", "fit", 4, { grammar: { unit: 1 } }))[0].level), F = fit.params;
  s = hissaLogic.init(fit);
  assert.equal(ap(fit, { kind: "run" }), "count_first", "the count is said before anything runs");
  assert.equal(ap(fit, { kind: "pour" }), "count_first", "and before the jug shows it");
  const n = F.w * F.d;
  assert.equal(ap(fit, { kind: "count", n: 21 }), "bad_count");
  assert.equal(ap(fit, { kind: "count", n }), undefined);
  assert.equal(ap(fit, { kind: "run" }), "pour_first");
  for (let i = 0; i < n; i++) assert.equal(ap(fit, { kind: "pour" }), undefined);
  assert.equal(ap(fit, { kind: "count", n: n + 1 }), "said", "a count the jug is testing stands until the run");
  assert.equal(ap(fit, { kind: "pour" }), "not_full", "a full cup, or none");
  assert.equal(ap(fit, { kind: "run" }), undefined); assert.ok(s.done, `${F.w} ÷ 1/${F.d} = ${n}`);
  assert.equal(ap(fit, { kind: "pour" }), "level_over");
  assert.deepEqual(hiddenOf(fit), [String(n)], "the teacher never says how many fit first");

  const rest = hissaLogic.validate(hissaLogic.generate(req("story", "rest", 4))[0].level), R = rest.params;
  s = hissaLogic.init(rest);
  assert.equal(ap(rest, { kind: "fold", side: 1, n: 2 }), "pick_first", "the second fold lies on a bar the child picked");
  for (const a of hissaLogic.solve(rest)) assert.equal(ap(rest, a), undefined);
  assert.ok(s.done);
  assert.deepEqual(hiddenOf(rest), [String((R.w * (R.b - R.a) * R.c) / (R.b * R.d))]);

  const sh = hissaLogic.validate(hissaLogic.generate(req("grid", "shift", 4, { grammar: { moves: [3], form: "times" } }))[0].level), S = sh.params;
  s = hissaLogic.init(sh);
  assert.equal(ap(sh, { kind: "run" }), "slide_first");
  let refusedOff = false;
  for (let i = 0; i < 8; i++) if (ap(sh, { kind: "slide", by: 1 }) === "off_chart") refusedOff = true;
  assert.ok(refusedOff, "a digit never leaves the chart");
  assert.equal(ap(sh, { kind: "slide", by: 2 }), "bad_slide");
  void S;
  const mul = hissaLogic.validate(hissaLogic.generate(req("grid", "mul", 4))[0].level), M = mul.params;
  s = hissaLogic.init(mul);
  assert.equal(ap(mul, { kind: "run" }), "shade_first");
  assert.equal(ap(mul, { kind: "shade", side: 0, k: 10 * Math.max(1, Math.ceil(M.a / 10)) + 1 }), "bad_shade", "the grid has only its own tenths");
  assert.equal(ap(mul, { kind: "point", at: 4 }), "bad_point");
});

test("hissa: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}) => hissaLogic.generate(req(mode, goal, 6, { grammar }))[0].level;
  const of = g("fold", "of"), times = g("fold", "times"), fit = g("pour", "fit"), part = g("pour", "part"), deci = g("pour", "deci"), mul = g("grid", "mul"), shift = g("grid", "shift"), rest = g("story", "rest"), scale = g("story", "scale");
  for (const lv of [of, times, fit, part, deci, mul, shift, rest, scale]) assert.ok(hissaLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [of, { a: 3, b: 3 }], [of, { b: 9 }], [of, { a: 1, b: 2, c: 2, d: 4 }], [of, { face: 4 }], [of, { w: 3 }], [of, { goal: "times" }], [of, { a: 1.5 }],
    [times, { w: 9 }], [times, { a: 4, b: 2 }], [times, { w: 4, a: 1, b: 2 }], [times, { c: 1 }],
    [fit, { w: 0 }], [fit, { c: 3, d: 3 }], [fit, { a: 1 }], [fit, { w: 6, c: 1, d: 8 }],
    [part, { a: 4, b: 2 }], [part, { c: 7, d: 8, a: 1, b: 2 }],
    [deci, { b: 7 }], [deci, { a: 50, b: 100 }], [deci, { c: 10, d: 10 }], [deci, { a: 49, b: 10, c: 6, d: 10 }],
    [mul, { a: 10 }], [mul, { a: 12, c: 13 }], [mul, { b: 100 }], [mul, { a: 20 }],
    [shift, { c: 0 }], [shift, { c: 4 }], [shift, { a: 120 }], [shift, { d: 1, c: 2 }], [shift, { b: 0 }],
    [rest, { w: rest.params.w + 1 }], [rest, { ctx: 2 }], [rest, { a: 5, b: 5 }],
    [scale, { c: scale.params.d }], [scale, { a: 3, b: 3 }], [scale, { ctx: 3 }], [scale, { d: 9 }],
  ]) assert.equal(hissaLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch)}`);
  assert.equal(hissaLogic.validate({ ...of, mode: "pour" }), null, "a goal belongs to its mode");
  assert.equal(hissaLogic.validate({ ...of, params: null }), null);
});

test("hissa: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = hissaLogic.validate(hissaLogic.generate(req("pour", "part", 4))[0].level);
  const forged = hissaLogic.grade(level, sanitizeActs(env([{ kind: "pour", correct: true }, { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = hissaLogic.grade(level, env(hissaLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "count", n: 9 }, { kind: "tag", part: 1, v: 7 }, { kind: "tag", part: 0, v: 1 }, { kind: "run" }, { kind: "tag", part: 1, v: 0 }, { kind: "tag", part: 0, v: 0 }, ...hissaLogic.solve(level)];
  const g = hissaLogic.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(hissaLogic.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per case: the law never throws; whenever a run ends the law's verdict equals the checker's on the
// checker's OWN copy of the set-up (fed every act the law accepted); the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`hissa/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws; generator work bounded (counted, not timed)`, () => {
    let seed = 17, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const candCounts = []; // candidates per generate/pick: a count, not a clock (tests/_work.mjs)
    for (let gi = 0; gi < 40; gi++) {
      let cands = [];
      cands = hissaLogic.generate(req(mode, goal, 100 + gi, { grammar, fade: 1 + (gi % 3) }));
      candCounts.push(cands.length);
      for (const c of cands.slice(0, 4)) {
        const level = hissaLogic.validate(c.level), p = level.params, sol = hissaLogic.solve(level);
        let s = hissaLogic.init(level), k = 0;
        const chk = checker(), pursue = rnd() < 0.5;
        for (let i = 0; i < 90 && !s.done; i++) {
          const r = rnd(), x = rnd();
          const a = pursue && r < 0.7 && k < sol.length ? sol[k++]
            : r < 0.12 ? { kind: "fold", side: x < 0.5 ? 0 : 1, n: 1 + Math.floor(rnd() * 8), ...(rnd() < 0.2 ? { correct: true } : {}) }
            : r < 0.24 ? { kind: "shade", side: x < 0.5 ? 0 : 1, k: Math.floor(rnd() * 14) }
            : r < 0.28 ? { kind: "base", on: x < 0.5 ? 1 : 2 }
            : r < 0.33 ? { kind: "lay", n: Math.floor(x * 10) }
            : r < 0.38 ? { kind: "pour" } : r < 0.43 ? { kind: "count", n: Math.floor(rnd() * 18) }
            : r < 0.55 ? { kind: "tag", part: x < 0.5 ? 0 : 1, v: Math.floor(rnd() * 30) }
            : r < 0.62 ? { kind: "slide", by: x < 0.5 ? 1 : -1 } : r < 0.64 ? { kind: "zero" } : r < 0.68 ? { kind: "point", at: Math.floor(x * 4) }
            : r < 0.9 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = hissaLogic.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, verdict(p, chk.st), `${level.levelId}: law and checker disagree (${JSON.stringify(chk.st)})`);
          }
          s = out.state;
        }
        if (hissaLogic.goalMet(level, s)) { solved++; assert.ok(verdict(p, chk.st)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(Math.max(...candCounts) <= 72, `${Math.max(...candCounts)} candidates per call (measured 2026-11-10: 24; bound is 3x)`);
  });
}

test("hissa: every word the view shows exists in all three languages; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/hissa/hissa.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(hissa\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = ["of", "times", "fit", "part", "deci", "mul", "shift", "rest0", "rest1", "scale"].map((g) => `hissa.goal.${g}`)
    .concat(["has0", "has1", "first0", "first1"].map((x) => `hissa.rest.${x}`), [0, 1, 2].map((i) => `hissa.scale.item${i}`), ["cut", "serve", "go", "read"].map((x) => `hissa.${x}`));
  assert.ok(used.length > 10);
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/hissa/hissa.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every hissa coverage entry serves a proven level at every fade (levelsFor and currentLevel); the solver's
// acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const HE = () => coverage().entries.filter((e) => e.family === "hissa");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("hissa coverage: the ten authored entries, mapped to real kit misconceptions; the five fraction / decimal × ÷ topics are hissa's now", () => {
  assert.deepEqual(HE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c7-maths-ch08-t01|fold|of", "c7-maths-ch08-t01|fold|times", "c7-maths-ch08-t02|pour|fit", "c7-maths-ch08-t02|pour|part", "c7-maths-ch08-t03|story|rest",
    "c7-maths-ch08-t03|story|scale", "c7-maths-ch12-t01|grid|mul", "c7-maths-ch12-t01|grid|shift", "c7-maths-ch12-t02|pour|deci", "c7-maths-ch12-t02|grid|shift"]);
  const kits = readFileSync(`${ROOT}data/kits/c7-maths.json`, "utf8");
  const ids = new Set([...kits.matchAll(/"(c7-maths-ch\d+-t\d+-m-[a-z0-9-]+)"/g)].map((m) => m[1]));
  for (const e of HE()) for (const kit of Object.values(e.misMap)) { assert.ok(kit.startsWith(`${e.topicId}-m-`), kit); assert.ok(ids.has(kit), `${kit} is a verified kit id`); }
  assert.equal(HE().filter((e) => Object.keys(e.misMap).length).length, 9, "every entry but ÷ 10 / 100 / 1000 maps a kit belief");
  for (const sk of ["c7-maths-ch08-t01-s1", "c7-maths-ch08-t01-s2", "c7-maths-ch08-t02-s1", "c7-maths-ch08-t02-s2", "c7-maths-ch08-t02-s3", "c7-maths-ch08-t03-s1", "c7-maths-ch08-t03-s2",
    "c7-maths-ch12-t01-s1", "c7-maths-ch12-t01-s2", "c7-maths-ch12-t02-s2", "c7-maths-ch12-t02-s3"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "hissa", sk);
  }
  // no honest mechanic: these stay with the net
  for (const sk of ["c7-maths-ch08-t01-s3", "c7-maths-ch08-t03-s3", "c7-maths-ch12-t01-s3", "c7-maths-ch12-t02-s1"]) assert.notEqual(entryFor({ skillId: sk })?.family, "hissa", sk);
});

for (const e of HE()) for (const fade of [1, 2, 3]) {
  test(`hissa server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "hissa" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.face, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(hissaLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      // grid/shift is one slide count (a lucky first tap lands it): its correct enters at the chance-adjusted weight (GAMES-03);
      // pour's count is said among 0..20 before the jug shows it and needs the part-cup too, so it keeps the game weight
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, e.goal === "shift" ? CHANCE_WEIGHT : GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && hissaLogic.malActs(level, m));
        const mg = gradeActs(level, env(hissaLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}

// games audit GAMES-08: pouring until the jug refused, then Run, won every pour level (the child never decided a count). Now
// the count is said first and graded: Run without one is refused, pouring alone never wins, a wrong count grades incorrect
// (the kit's belief where one maps), the right count wins; a count the jug has tested cannot be taken back by undo.
const POUR = () => HE().filter((e) => e.mode === "pour");
test("hissa pour (GAMES-08): pour until the jug refuses, then run, never wins on any served pour level", () => {
  assert.deepEqual(POUR().map((e) => `${e.topicId}|${e.goal}`), ["c7-maths-ch08-t02|fit", "c7-maths-ch08-t02|part", "c7-maths-ch12-t02|deci"]);
  for (const e of POUR()) for (const fade of [1, 2, 3]) for (const child of ["c1", "c2", "c3", "audit-child"]) {
    const level = currentLevel(sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) }), e);
    const acts = [...Array.from({ length: 20 }, () => ({ kind: "pour" })), { kind: "run" }];
    const r = run(level, acts);
    assert.ok(!r.s.done, `${level.levelId}: pouring alone won`);
    assert.ok(r.refused.every((c) => c === "count_first"), r.refused.join(","));
    const g = gradeActs(level, env(acts), { final: true });
    assert.notEqual(g.grade.verdict, "solved"); assert.notEqual(g.grade.evidence[0]?.outcome, "correct");
    // the audit's own replay: pour × 8, run
    assert.notEqual(gradeActs(level, env([...Array.from({ length: 8 }, () => ({ kind: "pour" })), { kind: "run" }]), { final: true }).grade.verdict, "solved");
  }
});

test("hissa pour (GAMES-08): a committed right count wins (correct, game weight); a wrong count grades incorrect, as the kit's belief where one maps", () => {
  let mapped = 0, levels = 0;
  for (const e of POUR()) for (const fade of [1, 2, 3]) for (const child of ["c1", "c2", "c3", "c4", "c5"]) {
    const level = currentLevel(sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) }), e), p = level.params;
    const sol = hissaLogic.solve(level), whole = sol.filter((a) => a.kind === "pour").length;
    assert.deepEqual(sol[0], { kind: "count", n: whole }, "the solver says the count first");
    const ok = gradeActs(level, env(sol), { final: true });
    assert.equal(ok.grade.verdict, "solved"); assert.ok(ok.grade.clean);
    assert.equal(ok.grade.evidence[0].outcome, "correct"); assert.equal(ok.grade.evidence[0].weight, GAME_WEIGHT);
    // a wrong count (the cups then poured to the brim, the right part-cup tagged): the run misses, the evidence is not correct
    for (const n of [0, 1, whole - 1, whole + 1, whole + 2, 20].filter((x) => x >= 0 && x <= 20 && x !== whole)) {
      const acts = [{ kind: "count", n }, ...sol.slice(1)];
      const r = run(level, acts);
      assert.ok(!r.s.done && r.refused.at(-1) === "missed", `${level.levelId} count ${n}`);
      const g = gradeActs(level, env(acts), { final: true });
      assert.ok(["incorrect", "partial"].includes(g.grade.evidence[0].outcome), `${level.levelId} count ${n}`);
      assert.equal(g.grade.evidence[0].weight, GAME_WEIGHT);
      // recovering after the run answered: the count may be said again, and the level solves; the evidence keeps the miss
      const back = gradeActs(level, env([...acts, { kind: "count", n: whole }, { kind: "run" }]), { final: true });
      assert.equal(back.grade.verdict, "solved", `${level.levelId} recovers`); assert.notEqual(back.grade.evidence[0].outcome, "correct");
    }
    for (const mal of Object.keys(level.mal)) {
      if (!malSetup(p, mal)) continue;
      const acts = hissaLogic.malActs(level, mal);
      assert.equal(acts[0].kind, "count", "the belief is in the count said");
      const g = gradeActs(level, env(acts), { final: true });
      assert.equal(g.grade.evidence[0].outcome, "incorrect"); assert.equal(g.grade.evidence[0].misconceptionId, level.mal[mal]);
      mapped++;
    }
    levels++;
  }
  assert.ok(mapped > 10 && levels === 45, `mapped ${mapped}, levels ${levels}`);
});

test("hissa pour (GAMES-08): a tested count stands through undo; the run frees it", () => {
  const level = hissaLogic.validate(hissaLogic.generate(req("pour", "fit", 9, { grammar: { unit: 1 } }))[0].level), p = level.params, whole = p.w * p.d;
  let s = hissaLogic.init(level);
  const ap = (a) => { const r = hissaLogic.apply(level, s, a, 1); s = r.state; return r.refused; };
  ap({ kind: "count", n: whole + 1 }); assert.equal(ap({ kind: "count", n: whole + 1 }), "same_count");
  ap({ kind: "count", n: whole + 2 }); assert.equal(s.say, whole + 2, "before any pour the count may change");
  ap({ kind: "undo" }); assert.equal(s.say, whole + 1, "and an untested count undoes like any act");
  for (let i = 0; i < whole; i++) ap({ kind: "pour" });
  assert.equal(ap({ kind: "pour" }), "not_full");
  for (let i = 0; i < whole + 3; i++) ap({ kind: "undo" });
  assert.equal(s.cups, 0); assert.equal(s.say, whole + 1, "taking the pours back never un-says the count");
  assert.equal(ap({ kind: "count", n: whole }), "said");
  for (let i = 0; i < whole; i++) ap({ kind: "pour" });
  assert.equal(ap({ kind: "run" }), "missed");
  assert.equal(ap({ kind: "count", n: whole }), undefined, "the law answered: the count may be said again");
  assert.equal(ap({ kind: "run" }), undefined); assert.ok(s.done);
  const view = readFileSync(`${ROOT}src/play/families/hissa/hissa.view.ts`, "utf8");
  assert.match(view, /kind: "count"/, "the view sends the count");
});

test("hissa grid/shift (GAMES-03): one slide count is a one-decision goal: a correct enters at CHANCE_WEIGHT, a miss at GAME_WEIGHT", () => {
  assert.deepEqual([...hissaLogic.oneDecision], ["shift"]);
  for (const e of HE().filter((x) => x.goal === "shift")) for (const fade of [1, 2, 3]) {
    const level = currentLevel(sessionOf(e, { fade }), e), p = level.params;
    const ok = hissaLogic.grade(level, env(hissaLogic.solve(level)));
    assert.equal(ok.evidence[0].outcome, "correct"); assert.equal(ok.evidence[0].weight, CHANCE_WEIGHT);
    const wrong = hissaLogic.grade(level, env([...Array.from({ length: Math.abs(p.c) }, () => ({ kind: "slide", by: p.c > 0 ? -1 : 1 })), { kind: "run" }]));
    assert.notEqual(wrong.evidence[0].outcome, "correct"); assert.equal(wrong.evidence[0].weight, GAME_WEIGHT);
  }
});
