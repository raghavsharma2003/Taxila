// Play: the law, the solver, the shortcut search and the grader (docs/design/round3/play/DESIGN.md §8, bars P-O4/P-O5).
// For every family/mode: generated levels are solvable (the solver's acts grade solved and clean), shortcut-free, and each
// mapped mal-rule's acts produce that misconception's signature. Then a randomised battery (≥ 2000 acts per mode, part
// random, part the solver's own acts) checks the TRUTH property with an independent verifier per family: whenever the
// law says the goal is met, the end state really is the concept done right. Pure; no DB, no network.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels, env } from "../src/play/core/pick.ts";
import { replayAll, gradeLevel } from "../src/play/core/replay.ts";
import { mulberry32 } from "../src/play/core/rng.ts";
import { gcd, lcm, isPrime } from "../src/play/core/rat.ts";
import { LABS, outcomeOf } from "../src/play/families/kyun-lab/labs.ts";
import { labHelpers } from "../src/play/families/kyun-lab/lab.logic.ts";
import { gapInfo } from "../src/play/families/nishana/line.logic.ts";

const MODES = [
  { key: "todo-jodo/atoms", goals: ["atoms", "two-trees", "hcf", "lcm"], topic: "c6-maths-ch05-t04" },
  { key: "todo-jodo/strips", goals: ["make", "equal", "compare", "unit", "add"], topic: "c6-maths-ch07-t04" },
  { key: "todo-jodo/bundles", goals: ["subtract"], topic: "c5-maths-ch04-t01" },
  { key: "taraazu/equation", goals: ["solve"], topic: "c7-maths-ch15-t02" },
  { key: "taraazu/equality", goals: ["fill"], topic: "c4-maths-ch10-t01" },
  { key: "nishana/place", goals: ["place"], topic: "c6-maths-ch07-t02", grammars: [{ forms: ["fraction"] }, { forms: ["integer"] }, { forms: ["decimal"] }, { forms: ["mixed"] }] },
  { key: "nishana/compare", goals: ["compare"], topic: "c6-maths-ch10-t02", grammars: [{ forms: ["integer"] }, { forms: ["decimal"], decimals: 3 }, { forms: ["fraction"] }] },
  { key: "nishana/place", goals: ["round"], topic: "c4-maths-ch04-t03", grammars: [{ to: [100] }, { to: [1000] }, { to: [10000], maxV: 99999 }] },
  { key: "kyun-lab/fair-test", goals: ["predict", "fair", "golu"], topic: "c6-science-ch10-t02", grammars: Object.keys(LABS).map((lab) => ({ labs: [lab] })) },
];

function req(logic, m, goal, seed, fade, grammar = {}) {
  const misMap = Object.fromEntries(logic.malRules.map((r) => [r, `kit:${r}`]));
  const [family, mode] = m.key.split("/");
  return { family, mode, topicId: m.topic, skillId: `${m.topic}-s1`, classLevel: family === "kyun-lab" ? 7 : 6, fade, goal, mis: {}, misMap, grammar, recent: [], seed };
}
function levelsOf(m, n) {
  const logic = LOGIC[m.key], out = [];
  let seed = 11;
  const gs = m.grammars ?? [{}];
  for (let i = 0; out.length < n && i < n * 6; i++) {
    const goal = m.goals[i % m.goals.length], g = gs[i % gs.length], fade = ([1, 2, 3][i % 3]);
    const r = pickLevels(logic, req(logic, m, goal, seed++, fade, g));
    if (r) { out.push(r.garam); if (r.teekha) out.push(r.teekha); }
  }
  return out.slice(0, n);
}

/** Independent checks of "the concept was done right" (written without the family's own law). */
const VERIFY = {
  atoms(level, s) {
    const p = level.params, leaves = (t) => Object.values(t.nodes).filter((x) => !x.kids);
    if (p.goal === "hcf" || p.goal === "lcm") return s.named === (p.goal === "hcf" ? gcd(p.n, p.m) : lcm(p.n, p.m)) && s.trees.every((t) => leaves(t).every((x) => isPrime(x.v)));
    const L = leaves(s.trees[0]);
    return L.every((x) => isPrime(x.v)) && L.reduce((a, x) => a * x.v, 1) === p.n && (p.goal !== "two-trees" || s.predicted !== null);
  },
  strips(level, s, last) {
    const p = level.params, amt = (b) => [b.shaded.length, b.d], eqR = ([a, b], [c, d]) => a * d === b * c;
    if (p.goal === "make") return eqR(amt(s.bars[0]), p.target);
    if (p.goal === "equal") return eqR(amt(s.bars[1]), amt(p.bars[0])) && s.bars[1].d !== p.bars[0].d;
    if (p.goal === "add") { const [a, b] = p.bars; return s.poured.length === 2 && eqR(amt(s.bars[2]), [a.shaded.length * b.d + b.shaded.length * a.d, a.d * b.d]); }
    // compare / unit: the closing choice names the bar that really holds more (cross-multiplied here, not by the law)
    const [a, b] = p.bars, l = a.shaded.length * b.d, r = b.shaded.length * a.d;
    return s.revealed && s.predicted !== null && last?.kind === "choose" && last.bar === (l > r ? 0 : l < r ? 1 : -1);
  },
  bundles(level, s) {
    const p = level.params, dig = (n) => Array.from({ length: p.places }, (_, i) => Math.floor(n / 10 ** i) % 10);
    if (level.fade === 3) { const len = String(p.a - p.b).length; return s.written.map((w, q) => w ?? (q >= len ? 0 : -1)).join() === dig(p.a - p.b).join(); }
    return s.taken.join() === dig(p.b).join() && s.cols.reduce((a, c, i) => a + c * 10 ** i, 0) === p.a - p.b;
  },
  balance(level, s) { const p = level.params; return p.goal === "fill" ? s.box === p.x : s.named === p.x; },
  line(level, s) {
    const p = level.params, val = (v) => v.num / v.den;
    const landed = p.values.every((v, k) => s.marks[k] !== null && Math.abs(s.marks[k] - val(v)) <= p.tol);
    if (p.goal === "place") return landed;
    // rounding, recomputed here: the nearer landmark, half up (written without the family's roundTo)
    if (p.goal === "round") { const v = val(p.values[0]), lo = p.lo, hi = p.hi; return landed && s.rounded === (v - lo >= hi - v ? hi : lo); }
    const a = val(p.values[0]), b = val(p.values[1]);
    return landed && s.ordered === (a < b ? 0 : a > b ? 1 : -1);
  },
  lab(level, s) {
    const p = level.params, lab = LABS[p.lab];
    if (!s.results || !s.ranDiffs) return false;
    const r = s.setups.map((x) => outcomeOf(lab, x));
    if (r[0] !== s.results[0] || r[1] !== s.results[1]) return false;
    const d = labHelpers.diffsOf(lab, s.setups);
    const truth = d.length > 1 ? "cant_tell" : r[0] !== r[1] ? d[0] : "none";
    return s.concluded === truth && (p.goal !== "fair" || d.length === 1);
  },
};
const verifierOf = (key) => (key.includes("atoms") ? VERIFY.atoms : key.includes("strips") ? VERIFY.strips : key.includes("bundles") ? VERIFY.bundles : key.startsWith("taraazu") ? VERIFY.balance : key.startsWith("nishana") ? VERIFY.line : VERIFY.lab);

/** A random act of the family's grammar, shaped from the current state (with some deliberately bad shapes). */
function randomAct(key, level, s, rnd) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const p = level.params;
  if (rnd() < 0.05) return { kind: "undo" };
  if (rnd() < 0.03) return { kind: pick(["nonsense", "split", "cut", "take"]), bogus: true };
  switch (key) {
    case "todo-jodo/atoms": {
      const leaves = s.trees.flatMap((t) => Object.values(t.nodes).filter((x) => !x.kids));
      const k = pick(["split", "split", "split", "done", "predict", "share", "name"]);
      if (k === "split") { const l = pick(leaves); return { kind: "split", node: l.id, by: pick([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13, l.v]) }; }
      if (k === "predict") return { kind: "predict", same: rnd() < 0.5 };
      if (k === "share") return { kind: "share", atom: pick(leaves).id, with: pick(leaves).id };
      if (k === "name") return { kind: "name", x: pick([1, gcd(p.n, p.m ?? p.n), lcm(p.n, p.m ?? p.n), p.n, Math.floor(rnd() * 200)]) };
      return { kind: "done" };
    }
    case "todo-jodo/strips": {
      const bar = Math.floor(rnd() * s.bars.length), b = s.bars[bar];
      const k = pick(["cut", "cut", "shade", "shade", "shade", "join", "pour", "choose", "name", "done"]);
      if (k === "cut") return { kind: "cut", bar, k: pick([2, 3, 4, 5, 6, 13]) };
      if (k === "join") return { kind: "join", bar, k: pick([2, 3]) };
      if (k === "shade") return { kind: "shade", bar, part: Math.floor(rnd() * (b.d + 1)) };
      if (k === "pour") return { kind: "pour", from: pick([0, 1, 2]), to: pick([2, 2, 1]) };
      if (k === "choose") return { kind: "choose", bar: pick([-1, 0, 1, 2]) };
      if (k === "name") return { kind: "name", bar, n: Math.floor(rnd() * 13), d: 1 + Math.floor(rnd() * 24) };
      return { kind: "done" };
    }
    case "todo-jodo/bundles": {
      const k = pick(["unbundle", "take", "take", "write", "done"]);
      const place = Math.floor(rnd() * p.places);
      if (k === "unbundle") return { kind: "unbundle", place };
      if (k === "take") return { kind: "take", place, n: 1 + Math.floor(rnd() * 9) };
      if (k === "write") return { kind: "write", place, digit: Math.floor(rnd() * 10) };
      return { kind: "done" };
    }
    case "taraazu/equation": case "taraazu/equality": {
      const k = pick(["take", "take", "take", "group", "open", "name", "drop"]);
      if (k === "take") return { kind: "take", side: pick(["L", "R"]), what: pick(["unit", "unit", "bag"]) };
      if (k === "group") return { kind: "group", k: pick([2, 3, 4]) };
      if (k === "name") return { kind: "name", x: pick([p.x, p.x + 1, Math.floor(rnd() * 20)]) };
      if (k === "drop") return { kind: "drop", n: pick([p.x, p.x - 1, Math.floor(rnd() * 30)]) };
      return { kind: "open" };
    }
    case "nishana/place": case "nishana/compare": {
      const k = pick(["place", "place", "commit", "order", ...(p.goal === "round" ? ["round", "round"] : [])]);
      const which = Math.floor(rnd() * p.values.length), v = p.values[which];
      if (k === "round") return { kind: "round", to: pick([p.lo, p.hi, p.lo + 1, 0]) };
      if (k === "place") return { kind: "place", which, x: rnd() < 0.4 ? v.num / v.den + (rnd() - 0.5) * p.tol : p.lo + rnd() * (p.hi - p.lo) };
      if (k === "order") return { kind: "order", first: pick([-1, 0, 1]) };
      return { kind: "commit" };
    }
    default: {
      const lab = LABS[p.lab];
      const k = pick(["set", "set", "predict", "run", "conclude"]);
      if (k === "set") { const f = pick(lab.factors); return { kind: "set", setup: pick([0, 1]), factor: f.id, level: pick(f.levels).id }; }
      if (k === "predict") return { kind: "predict", choice: pick(["A", "B", "same"]) };
      if (k === "conclude") return { kind: "conclude", factor: pick([...lab.factors.map((f) => f.id), "none", "cant_tell"]) };
      return { kind: "run" };
    }
  }
}

describe("play logic: generated levels are proven", () => {
  for (const m of MODES) {
    it(`${m.key}: solvable, shortcut-free, mal-rules show their signature`, () => {
      const logic = LOGIC[m.key], levels = levelsOf(m, 40);
      assert.ok(levels.length >= 20, `only ${levels.length} levels`);
      for (const level of levels) {
        const sol = logic.solve(level);
        assert.ok(sol?.length, `${level.levelId}: no solution`);
        const g = gradeLevel(logic, level, env(sol), { final: true });
        assert.equal(g.verdict, "solved", level.levelId);
        assert.equal(g.clean, true, level.levelId);
        assert.equal(logic.shortcut(level), null, `${level.levelId}: shortcut`);
        assert.ok(verifierOf(m.key)(level, replayAll(logic, level, env(sol)).state, sol[sol.length - 1]), `${level.levelId}: verifier rejects the solver's own solution`);
        for (const kitId of level.proof.discriminates) {
          const mal = Object.keys(level.mal).find((k) => level.mal[k] === kitId);
          const mg = gradeLevel(logic, level, env(logic.malActs(level, mal)), { final: true });
          assert.ok(mg.moments.some((x) => x.kind === "misconception_consequence" && x.misconceptionId === mal), `${level.levelId}: ${mal} did not show`);
          assert.equal(mg.evidence[0]?.outcome, "incorrect");
          assert.equal(mg.evidence[0]?.misconceptionId, kitId);
        }
      }
    });
  }
});

describe("play logic: randomised truth battery", () => {
  for (const m of MODES) {
    it(`${m.key}: ≥ 2000 acts; goal met ⇒ the independent verifier agrees; the law never throws`, () => {
      const logic = LOGIC[m.key], verify = verifierOf(m.key), levels = levelsOf(m, 30);
      const rnd = mulberry32(4242);
      let acts = 0, solvedRuns = 0;
      for (let pass = 0; acts < 2500 && pass < 40; pass++) for (const level of levels) for (let run = 0; run < 3; run++) {
        const sol = logic.solve(level) ?? [];
        let s = logic.init(level), si = 0, last = null;
        const mix = run === 0 ? 0.9 : run === 1 ? 0.5 : 0.15;
        for (let k = 0; k < 40 && !logic.goalMet(level, s); k++) {
          const a = rnd() < mix && si < sol.length ? sol[si++] : randomAct(m.key, level, s, rnd);
          const r = logic.apply(level, s, a, k + 1);
          assert.ok(r && r.state && Array.isArray(r.moments), "apply returned a bad shape");
          s = r.state; acts++; last = a;
        }
        if (logic.goalMet(level, s)) { solvedRuns++; assert.ok(verify(level, s, last), `${level.levelId}: law says solved, verifier disagrees ${JSON.stringify({ p: level.params, fade: level.fade, bars: s.bars, last })}`); }
      }
      assert.ok(acts >= 2000, `only ${acts} acts`);
      assert.ok(solvedRuns >= 10, `only ${solvedRuns} solved runs (the battery must reach the goal often enough to test it)`);
    });
  }
});

describe("play logic: evidence is decided by the first decisive moment", () => {
  it("a solved level after an early misconception is still incorrect evidence (no laundering by retries)", () => {
    const m = MODES.find((x) => x.key === "taraazu/equation"), logic = LOGIC[m.key];
    const level = levelsOf(m, 20).find((l) => l.proof.discriminates.length && logic.malActs(l, "one-side"));
    assert.ok(level, "no discriminating level");
    const mal = logic.malActs(level, "one-side");
    const g = gradeLevel(logic, level, env([...mal, { kind: "undo" }, { kind: "undo" }, ...logic.solve(level)]), { final: true });
    assert.equal(g.verdict, "solved");
    assert.equal(g.evidence.length, 1);
    assert.equal(g.evidence[0].outcome, "incorrect");
    assert.equal(g.evidence[0].via, "game");
    assert.equal(g.evidence[0].weight, 0.5);
  });
});

describe("play logic: the number line never states a gap it did not measure", () => {
  const third = { text: "1/3", num: 1, den: 3, form: "fraction" };
  it("an exact gap is named exactly", () => {
    assert.deepEqual(gapInfo(third, 1 / 3 + 1 / 6), { g: "1/6", exact: true });
    assert.deepEqual(gapInfo(third, 1 / 3 + 1 / 3), { g: "1/3", exact: true });
  });
  it("an inexact gap is the NEAREST simple fraction, marked not exact (0.18 on a thirds line is about 1/6, not 1/3)", () => {
    assert.deepEqual(gapInfo(third, 1 / 3 + 0.18), { g: "1/6", exact: false });
    assert.deepEqual(gapInfo(third, 1 / 3 - 0.3), { g: "1/3", exact: false });
    assert.deepEqual(gapInfo(third, 1 / 3 + 0.45), { g: "1/2", exact: false });
    const g = gapInfo(third, 1 / 3 + 0.01);
    assert.equal(g.exact, false);
    const [k, m] = g.g.split("/").map(Number);
    assert.ok(Math.abs(k / m - 0.01) <= Math.abs(1 / 12 - 0.01), g.g);
  });
});
