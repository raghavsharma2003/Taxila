// r4-khand · the Nazariya law (src/play/families/nazariya). For every mode and goal: generated levels are solvable, the
// solver's acts grade solved and clean, shortcut-free, and each mapped mal-rule's acts produce its own signature. Then the
// TRUTH battery: ≥ 2,000 acts per mode (random, mal-rule and solver acts mixed), checked against an ORACLE written here
// without the family's law (its own projections, counts, fences, reflections): the law may say "done" only when the
// oracle agrees, a grade's verdict always equals the oracle's reading of the end state, and the first committed decision
// (the evidence) is correct exactly when the oracle says the build at that moment met the goal. Pure; no DB, no network.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels, env } from "../src/play/core/pick.ts";
import { replayAll } from "../src/play/core/replay.ts";
import { mulberry32 } from "../src/play/core/rng.ts";
import { sanitizeActs } from "../shared/play.ts";

const CASES = [
  { mode: "views", goals: ["build3", "same"], grammars: [{}, { views: ["top"] }, { views: ["front"] }] },
  { mode: "array", goals: ["fill", "turn"], grammars: [{}] },
  { mode: "floor", goals: ["area", "perimeter", "max", "min"], grammars: [{}] },
  { mode: "powers", goals: ["square", "cube"], grammars: [{}] },
  { mode: "mirror", goals: ["complete"], grammars: [{ axes: ["x"] }, { axes: ["z"] }] },
];
const reqOf = (logic, mode, goal, seed, fade, grammar, classLevel = 5) => ({
  family: "nazariya", mode, topicId: "c0-test", skillId: "c0-test-s1", classLevel, fade, goal, mis: {},
  misMap: Object.fromEntries(logic.malRules.map((r) => [r, `kit:${r}`])), grammar, recent: [], seed,
});
function levelsOf(c, n) {
  const logic = LOGIC[`nazariya/${c.mode}`], out = [];
  for (let i = 0, seed = 7; out.length < n && i < n * 4; i++, seed++) {
    const goal = c.goals[i % c.goals.length], g = c.grammars[i % c.grammars.length], fade = [1, 2, 3][i % 3], cls = [4, 5, 6, 7][i % 4];
    const r = pickLevels(logic, reqOf(logic, c.mode, goal, seed, fade, g, cls));
    if (r) { out.push(r.garam); if (r.teekha) out.push(r.teekha); }
  }
  return out.slice(0, n);
}

// ───────────────────────────── the oracle (independent of the law) ─────────────────────────────
const H = (p, h, x, z) => h[z * p.w + x];
function projections(p, h) {
  const top = [], front = [], side = [];
  for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) top.push(H(p, h, x, z) > 0 ? 1 : 0);
  for (let x = 0; x < p.w; x++) { let m = 0; for (let z = 0; z < p.d; z++) m = Math.max(m, H(p, h, x, z)); front.push(m); }
  for (let z = 0; z < p.d; z++) { let m = 0; for (let x = 0; x < p.w; x++) m = Math.max(m, H(p, h, x, z)); side.push(m); }
  return { top, front, side };
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/** cells the child built on (open columns above the scenery) */
const childCells = (p, h) => { const c = []; for (let i = 0; i < h.length; i++) if (!p.lock[i] && h[i] > p.base[i]) c.push(i); return c; };
function rectOf(p, h) {
  const cells = childCells(p, h);
  if (!cells.length) return null;
  const xs = cells.map((i) => i % p.w), zs = cells.map((i) => Math.floor(i / p.w)), hs = cells.map((i) => h[i] - p.base[i]);
  const a = Math.max(...xs) - Math.min(...xs) + 1, b = Math.max(...zs) - Math.min(...zs) + 1;
  return a * b === cells.length && hs.every((v) => v === hs[0]) ? { a, b, hgt: hs[0] } : null;
}
function fence(p, h) {
  let area = 0, per = 0;
  const on = (x, z) => x >= 0 && z >= 0 && x < p.w && z < p.d && H(p, h, x, z) > 0;
  for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) if (on(x, z)) { area++; per += [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !on(x + dx, z + dz)).length; }
  return { area, per };
}
function oneShape(p, h) {
  const cells = new Set(childCells(p, h)); if (!cells.size) return false;
  const first = [...cells][0], seen = new Set([first]), st = [first];
  while (st.length) { const i = st.pop(); for (const j of [i - 1, i + 1, i - p.w, i + p.w]) { if (!cells.has(j) || seen.has(j)) continue; if (Math.abs((j % p.w) - (i % p.w)) > 1) continue; seen.add(j); st.push(j); } }
  return seen.size === cells.size;
}
const ORACLE = {
  views(level, s) {
    const p = level.params, v = projections(p, s.h);
    if (p.goal === "build3") return eq(v.top, p.top) && eq(v.front, p.front) && eq(v.side, p.side);
    const a = projections(p, p.shown);
    return eq(v[p.view], a[p.view]) && !eq(s.h, p.shown);
  },
  array(level, s) {
    const p = level.params, q = p.pit;
    let all = true; for (let z = q.z0; z < q.z0 + q.r; z++) for (let x = q.x0; x < q.x0 + q.c; x++) if (H(p, s.h, x, z) !== 1) all = false;
    if (p.goal === "turn") return all && s.predicted === true;
    return all && s.named === p.r * p.c;
  },
  floor(level, s) {
    const p = level.params, f = fence(p, s.h), r = rectOf(p, s.h);
    if (p.goal === "area") return f.area === p.n && oneShape(p, s.h);
    if (!r || r.hgt !== 1) return false;
    if (p.goal === "perimeter") return f.per === p.n;
    const all = []; for (let a = 1; a <= p.w; a++) for (let b = 1; b <= p.d; b++) all.push([a, b]);
    if (p.goal === "max") return f.per === p.n && f.area === Math.max(...all.filter(([a, b]) => 2 * a + 2 * b === p.n).map(([a, b]) => a * b));
    return f.area === p.n && f.per === Math.min(...all.filter(([a, b]) => a * b === p.n).map(([a, b]) => 2 * a + 2 * b));
  },
  powers(level, s) {
    const p = level.params, r = rectOf(p, s.h), side = p.k + 1, n = p.goal === "square" ? side ** 2 : side ** 3;
    return !!r && r.a === side && r.b === side && r.hgt === (p.goal === "square" ? 1 : side) && s.named === n;
  },
  mirror(level, s) {
    const p = level.params;
    for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) {
      const i = z * p.w + x; if (p.lock[i]) continue;
      // the reflection of this open column, worked out here: the given column it mirrors (if any)
      const sx = p.axis === "x" ? 2 * p.m - 1 - x : x, sz = p.axis === "z" ? 2 * p.m - 1 - z : z;
      const want = sx >= 0 && sz >= 0 && sx < p.w && sz < p.d ? p.given[sz * p.w + sx] : 0;
      if (s.h[i] !== want) return false;
    }
    return true;
  },
};

/** A random act shaped from the level (some deliberately bad), plus the law's own solver / mal-rule acts. */
function randomAct(level, s, rnd) {
  const p = level.params, rx = () => Math.floor(rnd() * (p.w + 2)) - 1, rz = () => Math.floor(rnd() * (p.d + 2)) - 1, u = rnd();
  if (u < 0.32) return { kind: "place", x: rx(), z: rz() };
  if (u < 0.44) return { kind: "remove", x: rx(), z: rz() };
  if (u < 0.56) return { kind: "layer", x0: rx(), z0: rz(), x1: rx(), z1: rz() };
  if (u < 0.62) return { kind: "clear", x0: rx(), z0: rz(), x1: rx(), z1: rz() };
  if (u < 0.74) {
    const key = level.mode === "array" ? p.r * p.c : level.mode === "powers" ? (p.goal === "square" ? (p.k + 1) ** 2 : (p.k + 1) ** 3) : 10;
    const opts = [key, key + 1, key - 1, Math.floor(rnd() * 80), level.mode === "array" ? p.r + p.c : 2 * (p.k ?? 1)];
    return { kind: "name", n: opts[Math.floor(rnd() * opts.length)] };
  }
  if (u < 0.8) return { kind: "predict", same: rnd() < 0.5 };
  if (u < 0.92) return { kind: "check" };
  if (u < 0.96) return { kind: "undo" };
  return [{ kind: "zap" }, { kind: "place", x: "a", z: 1 }, { kind: "layer", x0: 0 }, { kind: "name", n: -4 }, null][Math.floor(rnd() * 5)];
}

describe("r4-khand nazariya: levels are proven", () => {
  for (const c of CASES) {
    it(`${c.mode}: solvable, solver clean, shortcut-free, each mapped mal-rule shows its own signature; generator p95 ≤ 50 ms`, () => {
      const logic = LOGIC[`nazariya/${c.mode}`], ms = [];
      const lv = levelsOf(c, 36);
      assert.ok(lv.length >= 24, `only ${lv.length} levels`);
      for (const level of lv) {
        assert.ok(logic.validate(level), `${level.levelId} fails its own validate`);
        const sol = logic.solve(level);
        const g = logic.grade(level, env(sol));
        assert.equal(g.verdict, "solved", `${level.levelId} solver not solved`);
        assert.ok(g.clean);
        assert.equal(g.evidence[0]?.outcome, "correct");
        assert.equal(logic.shortcut(level), null);
        assert.ok(ORACLE[c.mode](level, replayAll(logic, level, env(sol)).state), `${level.levelId}: oracle disagrees with the solver`);
        for (const kitId of level.proof.discriminates) {
          const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId);
          const mg = logic.grade(level, env(logic.malActs(level, mal)));
          assert.equal(mg.evidence[0]?.misconceptionId, kitId, `${level.levelId} ${mal}`);
          assert.equal(mg.evidence[0]?.outcome, "incorrect");
        }
      }
      for (let i = 0; i < 40; i++) {
        const goal = c.goals[i % c.goals.length];
        const r = pickLevels(logic, reqOf(logic, c.mode, goal, 900 + i, [1, 2, 3][i % 3], c.grammars[i % c.grammars.length]));
        if (r) ms.push(r.ms);
      }
      ms.sort((a, b) => a - b);
      assert.ok(ms[Math.floor(0.95 * (ms.length - 1))] <= 50, `generator p95 ${ms[Math.floor(0.95 * (ms.length - 1))]} ms`);
    });
  }
});

describe("r4-khand nazariya: randomised truth battery (0 wrong grades over ≥ 2,000 acts per mode)", () => {
  for (const c of CASES) {
    it(`${c.mode}: goal met ⇔ the oracle; grade verdict = the oracle's end state; first evidence right ⇔ the oracle at that act`, () => {
      const logic = LOGIC[`nazariya/${c.mode}`], rnd = mulberry32(4242);
      let acts = 0, wrong = 0, graded = 0, levelsN = 0; const tally = { solved: 0, incorrect: 0, partial: 0, mis: 0 };
      const lv = levelsOf(c, 60);
      for (let rep = 0; acts < 5000 && rep < 30; rep++) for (const level of lv) {
        if (acts >= 5000) break;
        levelsN++;
        const sol = logic.solve(level) ?? [], mals = Object.keys(level.mal).map((m) => logic.malActs(level, m)).filter(Boolean);
        const pool = [sol, ...mals];
        let s = logic.init(level), si = 0, script = rnd() < 0.4 ? sol : pool[Math.floor(rnd() * pool.length)];
        const log = [];
        const mix = rnd() < 0.3 ? 1 : rnd(), n = Math.round(script.length * (1 + mix)) + Math.floor(rnd() * 12);
        let firstDecision = null;
        for (let k = 0; k < n && !s.done; k++) {
          const a = rnd() < mix && si < script.length ? script[si++] : randomAct(level, s, rnd);
          const before = s;
          let r;
          assert.doesNotThrow(() => { r = logic.apply(level, s, a, k + 1); }, `throws on ${JSON.stringify(a)}`);
          s = r.state; acts++;
          log.push({ seq: k + 1, t: 0, via: "touch", act: a });
          // the law says done only when the oracle agrees
          if (s.done && !ORACLE[c.mode](level, s)) wrong++;
          if (!before.done && !s.done && a && a.kind === "check" && ORACLE[c.mode](level, s)) wrong++;   // a met goal never refused at its check
          const decisive = r.moments.find((m) => ["misconception_consequence", "near_miss", "solved"].includes(m.kind)) || (["mismatch", "wrong_count", "wrong_prediction"].includes(r.refused) ? { kind: "refusal" } : null);
          if (decisive && !firstDecision) firstDecision = { kind: decisive.kind, okNow: ORACLE[c.mode](level, s) };
        }
        // the server's grade of the same log, through the sanitiser, must read the end state as the oracle does
        const g = logic.grade(level, sanitizeActs(log));
        graded++;
        const end = replayAll(logic, level, sanitizeActs(log)).state;
        if ((g.verdict === "solved") !== (end.done && ORACLE[c.mode](level, end))) wrong++;
        const ev = g.evidence[0];
        if (g.verdict === "solved") tally.solved++; if (ev?.outcome === "incorrect") tally.incorrect++; if (ev?.outcome === "partial") tally.partial++; if (ev?.misconceptionId) tally.mis++;
        if (firstDecision && ev) {
          if ((ev.outcome === "correct") !== (firstDecision.kind === "solved")) wrong++;
          if (ev.outcome === "correct" && !firstDecision.okNow) wrong++;
          if (firstDecision.kind === "solved" !== firstDecision.okNow) wrong++;
        }
      }
      if (process.env.KHAND_TALLY) console.log(c.mode, acts, graded, JSON.stringify(tally));
      // the battery must exercise every branch: solves, wrong commits, near misses where the mode has them, misconceptions
      assert.ok(tally.solved >= 20 && tally.incorrect >= 20 && tally.mis >= 10, JSON.stringify(tally));
      assert.ok(acts >= 2000, `only ${acts} acts`);
      assert.equal(wrong, 0, `${wrong} wrong grades over ${acts} acts / ${graded} graded logs (${levelsN} level plays)`);
    });
  }
});

describe("r4-khand nazariya: the device cannot write the level or the verdict", () => {
  const level = levelsOf(CASES[3], 2)[0];
  const logic = LOGIC["nazariya/powers"];
  it("a tampered plot (moved scenery, an unlocked shown cube, a mismatched k) fails validate", () => {
    assert.ok(logic.validate(level));
    const p = level.params;
    assert.equal(logic.validate({ ...level, params: { ...p, lock: p.lock.map(() => 0) } }), null);
    assert.equal(logic.validate({ ...level, params: { ...p, k: p.k + 1 } }), null);
    assert.equal(logic.validate({ ...level, params: { ...p, base: p.base.map((v, i) => (i === 0 ? 5 : v)) } }), null);
    assert.equal(logic.validate({ ...level, family: "nishana" }), null);
  });
  it("claim fields are stripped and change nothing: a claimed solve with no acts is ungraded", () => {
    const forged = [{ seq: 1, t: 0, act: { kind: "check", correct: true, solved: true, verdict: "solved" } }];
    const g = logic.grade(level, sanitizeActs(forged));
    assert.notEqual(g.verdict, "solved");
    assert.equal(logic.grade(level, sanitizeActs([])).verdict, "ungraded");
  });
  it("an act log replayed onto another level grades by that level's own law", () => {
    const other = levelsOf(CASES[3], 6).find((l) => l.levelId !== level.levelId && (l.params.goal !== level.params.goal || l.params.k !== level.params.k));
    const g = logic.grade(other, env(logic.solve(level)));
    assert.notEqual(g.verdict, "solved");
  });
  it("views: inconsistent target views are refused (no build could show them)", () => {
    const v = levelsOf(CASES[0], 4).find((l) => l.params.goal === "build3");
    const p = v.params;
    assert.equal(LOGIC["nazariya/views"].validate({ ...v, params: { ...p, front: p.front.map((x) => x + 1) } }), null);
  });
  it("array: the pit and the paving cannot be swapped by the device", () => {
    const a = levelsOf(CASES[1], 2)[0], p = a.params;
    assert.equal(LOGIC["nazariya/array"].validate({ ...a, params: { ...p, lock: p.lock.map(() => 0) } }), null);
    assert.equal(LOGIC["nazariya/array"].validate({ ...a, params: { ...p, r: p.r + 1 } }), null);
  });
  it("mirror: the given half cannot sit on the open side or on the outer edge", () => {
    const m = levelsOf(CASES[4], 2)[0], p = m.params, g = [...p.given];
    const i = g.findIndex((v) => v); g[i] = 0; g[p.axis === "x" ? p.w - 1 : (p.d - 1) * p.w] = 1;
    assert.equal(LOGIC["nazariya/mirror"].validate({ ...m, params: { ...p, given: g } }), null);
  });
});
