// r7 Games, E6 Yantra · beam: mirrors route a beam. The law traces the beam exactly (angle in = angle out); here an
// INDEPENDENT tracer (stepping along the ray in small increments, not the law's analytic intersections) checks that
// "solved" means the beam really reaches the target, over random play.
import { test } from "node:test";
import assert from "node:assert/strict";
import { beamLogic, trace, reflect } from "../src/play/families/yantra/beam.logic.ts";
import coverage from "../data/play/coverage.json" with { type: "json" };

const req = (goal, seed, extra = {}) => ({ family: "yantra", mode: "beam", goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: {}, grammar: {}, recent: [], seed, ...extra });
const run = (level, acts) => { let s = beamLogic.init(level); const ms = []; acts.forEach((a, i) => { const r = beamLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); }); return { s, ms }; };

/** a marching tracer: tiny steps; a mirror reflects when the step crosses its segment; walls, edge and target as cells / disc */
function march(p, mirrors) {
  let x = p.lamp.x + 0.5, y = p.lamp.y + 0.5, d = p.lamp.dir, last = -1;
  const h = 0.002;
  for (let i = 0; i < 400000; i++) {
    const nx = x + Math.cos((d * Math.PI) / 180) * h, ny = y - Math.sin((d * Math.PI) / 180) * h;
    if (Math.hypot(nx - p.target.x, ny - p.target.y) <= p.target.r) return true;
    if (nx <= 0 || ny <= 0 || nx >= p.cols || ny >= p.rows) return false;
    if (p.walls.some((w) => nx > w.x && nx < w.x + 1 && ny > w.y && ny < w.y + 1)) return false;
    let hitM = -1;
    mirrors.forEach((m, k) => {
      if (k === last) return;
      const cx = m.x + 0.5, cy = m.y + 0.5, ux = Math.cos((m.rot * Math.PI) / 180), uy = -Math.sin((m.rot * Math.PI) / 180);
      const side = (px, py) => (px - cx) * uy - (py - cy) * ux;
      const along = (nx - cx) * ux + (ny - cy) * uy;
      if (Math.sign(side(x, y)) !== Math.sign(side(nx, ny)) && Math.abs(along) <= 0.42) hitM = k;
    });
    if (hitM >= 0) { d = reflect(d, mirrors[hitM].rot); last = hitM; }
    else if (last >= 0) {
      const m = mirrors[last], cx = m.x + 0.5, cy = m.y + 0.5;
      if (Math.hypot(nx - cx, ny - cy) > 0.6) last = -1;      // left the mirror behind: it may be hit again later
    }
    x = nx; y = ny;
  }
  return false;
}

for (const goal of ["route", "periscope"]) {
  test(`yantra/beam ${goal}: every level validates, its solution solves, the bare lamp never does, and the generator is fast`, () => {
    const times = [];
    let n = 0;
    for (let seed = 1; seed <= 20; seed++) for (const fade of [1, 2]) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); cands = beamLogic.generate(req(goal, seed, { fade })); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      for (const c of cands) {
        const lv = beamLogic.validate(c.level);
        assert.ok(lv, c.signature);
        n++;
        const r = run(lv, beamLogic.solve(lv));
        assert.ok(r.s.done && r.ms.some((m) => m.kind === "solved"), c.signature);
        assert.equal(beamLogic.shortcut(lv), null, c.signature);
        assert.ok(!trace(lv.params, []).hit, `${c.signature}: the bare lamp`);
        assert.ok(march(lv.params, lv.params.sol), `${c.signature}: the marching tracer agrees with the solution`);
        if (goal === "periscope") { const [a, b] = lv.params.sol; assert.equal(a.rot, b.rot, "periscope mirrors are parallel"); assert.ok(lv.params.walls.length > 0); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(n > 100, `${n} levels`);
    assert.ok(times[Math.floor(times.length * 0.95)] < 50, `p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

test("yantra/beam: over random play, the law says solved ⇔ the marching tracer reaches the target", () => {
  let seed = 11, runs = 0, hits = 0, disagree = 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
  for (let g = 0; g < 30; g++) {
    const cands = beamLogic.generate(req(g % 3 === 0 ? "periscope" : "route", 200 + g, { fade: 1 + (g % 2) }));
    for (const c of cands.slice(0, 4)) {
      const lv = beamLogic.validate(c.level), p = lv.params;
      let s = beamLogic.init(lv);
      for (let i = 0; i < 30 && !s.done; i++) {
        const r = rnd();
        // bias towards the solution's cells so runs sometimes land
        const near = p.sol[Math.floor(rnd() * p.sol.length)];
        const a = r < 0.35 ? { kind: "place", part: "mirror", x: rnd() < 0.6 ? near.x : Math.floor(rnd() * p.cols), y: rnd() < 0.6 ? near.y : Math.floor(rnd() * p.rows), rot: Math.floor(rnd() * 12) * 15, ...(rnd() < 0.2 ? { correct: true } : {}) }
          : r < 0.6 && s.placed.length ? { kind: "rotate", id: s.placed[Math.floor(rnd() * s.placed.length)].id, rot: rnd() < 0.5 ? near.rot : Math.floor(rnd() * 12) * 15 }
          : r < 0.68 && s.placed.length ? { kind: "remove", id: s.placed[0].id }
          : r < 0.75 ? { kind: "undo" } : { kind: "run", ...(rnd() < 0.2 ? { solved: true } : {}) };
        const before = s;
        const out = beamLogic.apply(lv, s, a, i + 1);
        if (a.kind === "run") {
          runs++;
          const law = out.moments.some((m) => m.kind === "solved"), real = march(p, before.placed);
          if (law) hits++;
          if (law !== real) disagree++;
        }
        s = out.state;
      }
    }
  }
  assert.ok(runs > 200, `${runs} runs`);
  assert.ok(hits > 5, `${hits} hits`);
  assert.equal(disagree, 0, `${disagree} of ${runs} runs disagree with the marching tracer`);
});

test("yantra/beam: tampered levels are refused (a target the solution misses, a lamp that hits by itself, a bad step)", () => {
  const lv = beamLogic.validate(beamLogic.generate(req("route", 5))[0].level);
  const t = (params) => beamLogic.validate({ ...lv, params: { ...lv.params, ...params } });
  assert.equal(t({ target: { ...lv.params.target, x: lv.params.target.x + 1.7 } }), null);
  assert.equal(t({ step: 10 }), null);
  assert.equal(t({ sol: lv.params.sol.slice(1) }), null);
  assert.equal(t({ walls: [...lv.params.walls, { x: lv.params.sol[0].x, y: lv.params.sol[0].y }] }), null);
});

test("yantra/beam: a claim never decides; only the beam does", () => {
  const lv = beamLogic.validate(beamLogic.generate(req("route", 9))[0].level);
  const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, act }));
  const g = beamLogic.grade(lv, env([{ kind: "run", solved: true, correct: true }]));
  assert.notEqual(g.verdict, "solved");
  assert.equal(beamLogic.grade(lv, env(beamLogic.solve(lv))).verdict, "solved");
});

test("yantra/beam: a mirror edge-on to the beam blocks it (no light through glass edges)", () => {
  const p = { goal: "route", cols: 6, rows: 6, lamp: { x: 0, y: 2, dir: 0 }, target: { x: 5.5, y: 2.5, r: 0.38 }, walls: [], mirrors: 1, sol: [], step: 45 };
  assert.ok(trace(p, []).hit);
  assert.ok(!trace(p, [{ x: 3, y: 2, rot: 0 }]).hit);
});

test("yantra/beam: every coverage entry serves a level as the play server would", async () => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  const mine = coverage.entries.filter((e) => e.family === "yantra" && e.mode === "beam");
  assert.equal(mine.length, 2);
  for (const entry of mine) for (let n = 0; n < 3; n++) {
    const key = entryKey(entry);
    const s = { childId: `b-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
      mis: {}, pL: undefined, n: 0, seed: seedOf(`b-${n}`, key, 0), door: "garam", recent: [], hist: null };
    const lv = currentLevel(s, entry);
    assert.ok(lv && lv.mode === "beam" && lv.params.goal === entry.goal, entry.topicId);
  }
});
