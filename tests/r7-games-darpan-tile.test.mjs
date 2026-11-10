// r7 Games, Darpan · tile (r7 tilings2: c7-maths-ch14-t02). Copies of a tile laid round one point until the corner closes.
// Pure law checks: every generated level validates, its solver solves it, no idea-free set-up wins (shortcut null); an
// INDEPENDENT checker (a regular polygon's corner from (n − 2) × 180 ÷ n, an uneven tile's corners as given, plain sums; and,
// for the drawing, each copy's corner measured off its own drawn points) agrees with the law over random play; each mal-rule
// lands on its OWN misconception; tampered params are refused; a claim never decides; the generator is fast; the picker
// serves real variety; and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tileLogic, TILE_MAL, malSetup, rosette, floorOf, edgeToEdge, solution } from "../src/play/families/darpan/tile.logic.ts";
import { darpanLogic } from "../src/play/families/darpan/darpan.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, MODES } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = tileLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = tileLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["close", { ns: [3, 4, 5, 6, 8, 9, 10, 12] }, ["gap-ok"]],
  ["alone", { ns: [3, 4, 5, 6, 8, 9, 10, 12] }, ["any-regular"]],
  ["any", { shapes: ["tri", "quad"] }, ["only-regular"]],
];
const mapOf = (mals) => Object.fromEntries(mals.map((m) => [m, `k-${m}`]));
const req = (goal, seed, o = {}) => ({ family: "darpan", mode: "tile", goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: {}, grammar: {}, recent: [], seed, ...o });
const levelsOf = (goal, grammar, mals, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of tileLogic.generate(req(goal, seed, { grammar, fade, misMap: mapOf(mals) }))) out.push(c);
  return out;
};

// ───────────────────────────── THE ORACLE (independent of the law's code) ─────────────────────────────
/** a corner's angle: a regular n-gon's from (n − 2) × 180 ÷ n; an uneven tile's as given */
const cornerDeg = (tile, c) => (tile.n ? ((tile.n - 2) * 180) / tile.n : tile.ang[c]);
const oracleSum = (p, put) => p.laid.reduce((s, n) => s + ((n - 2) * 180) / n, 0) + put.reduce((s, q) => s + cornerDeg(p.tray[q.t], q.c), 0);
function oracle(p, put) {
  if (!put.length) return false;
  if (p.goal !== "close" && new Set(put.map((q) => q.t)).size > 1) return false;
  return Math.abs(oracleSum(p, put) - 360) < 1e-9;
}
/** the corner at (0, 0) of a drawn copy, measured off its points (degrees between its two edges at the point) */
function drawnCorner(pts) {
  const n = pts.length, a = pts[1], b = pts[n - 1];
  assert.ok(Math.hypot(pts[0][0], pts[0][1]) < 1e-9, "a copy's corner sits on the point");
  const d = Math.abs(Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1])) * 180 / Math.PI;
  return d;
}

test("darpan/tile: registered (MODES, logic, a verb that never chooses); the mirror and turn worlds keep their own logic", () => {
  assert.deepEqual([...MODES.darpan], ["mirror", "turn", "tile"]);
  assert.equal(LOGIC["darpan/tile"], tileLogic);
  assert.equal(LOGIC["darpan/mirror"], darpanLogic);
  const v = playActOf("darpan", "tile");
  assert.ok(v && v.hi && v.en && v.act !== "choose");
  const data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).darpan;
  assert.ok(data.tile.act && data.tile.hi && data.tile.en);
});

for (const [goal, grammar, mals] of CASES) {
  test(`darpan/tile/${goal}: every level validates, solves, is shortcut-free; the oracle agrees; the drawing's corners are the law's; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(goal, grammar, mals);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = tileLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, "tile"); assert.equal(level.params.goal, goal);
      assert.equal(tileLogic.shortcut(level), null, `${c.signature} shortcut`);
      const solved = run(level, tileLogic.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(oracle(level.params, solved.s.put), `${c.signature}: the oracle disagrees with the solver`);
      // what is drawn is what is added: each copy's corner at the point, measured off its points, is the oracle's angle
      for (const r of rosette(level.params, solved.s.put)) assert.ok(Math.abs(drawnCorner(r.pts) - (r.laid ? r.ang : cornerDeg(level.params.tray[r.t], r.c))) < 1e-6, c.signature);
      for (const mal of TILE_MAL) {
        const acts = tileLogic.malActs(level, mal);
        if (!mals.includes(mal)) { assert.equal(acts, null, `${c.signature}: ${mal} is not this goal's`); continue; }
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: laid legally, then missed`);
        assert.ok(!r.s.done && !oracle(level.params, r.s.put), `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = tileLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of mals) assert.ok(seen.has(m), `${goal}: mal-rule ${m} never discriminated`);
  });
}

test("darpan/tile: mal-rule signatures are the beliefs (a small gap or overlap is fine; any regular tile floors; only regular tiles floor)", () => {
  for (const [goal, grammar, mals] of CASES) for (const c of levelsOf(goal, grammar, mals, [3, 5])) {
    const p = tileLogic.validate(c.level).params;
    const g = malSetup(p, "gap-ok", mals);
    if (g) { const miss = 360 - oracleSum(p, g); assert.ok(Math.abs(miss) >= 5 && Math.abs(miss) <= 30, `${c.signature}: gap-ok leaves ${miss}°`); }
    const a = malSetup(p, "any-regular", mals);
    if (a) {
      const t = p.tray[a[0].t];
      assert.ok(t.n && 360 % (((t.n - 2) * 180) / t.n) !== 0, "a regular tile that does not floor");
      assert.ok(a.every((q) => q.t === a[0].t));
      assert.equal(a.length, Math.round(360 / (((t.n - 2) * 180) / t.n)), "as many as come nearest a full turn");
    }
    const o = malSetup(p, "only-regular", mals);
    if (o) { assert.ok(p.tray[o[0].t].n, "the regular tile, not the uneven one"); assert.ok(o.every((q) => q.t === o[0].t)); }
  }
});

test("darpan/tile: no idea-free set-up wins (one of each tray tile, any one kind laid until round, the first tile, four of the first, a triangle's corners once each, its biggest or smallest corner until round)", () => {
  const until = (p, piece) => { const out = []; while (oracleSum(p, out) < 360 && out.length < 12) out.push(piece); return out; };
  for (const [goal, grammar, mals] of CASES) for (const c of levelsOf(goal, grammar, mals, [3, 5])) {
    const p = tileLogic.validate(c.level).params;
    if (goal === "close") {
      assert.ok(!oracle(p, p.tray.map((_, t) => ({ t, c: 0 }))), `${c.signature}: one of each`);
      p.tray.forEach((_, t) => assert.ok(!oracle(p, until(p, { t, c: 0 })), `${c.signature}: tile ${t} until round`));
    } else if (goal === "alone") {
      assert.ok(!oracle(p, until(p, { t: 0, c: 0 })) && !oracle(p, Array(4).fill({ t: 0, c: 0 })), c.signature);
      assert.equal(p.tray.filter((t) => 360 % (((t.n - 2) * 180) / t.n) === 0).length, 1, "exactly one tile floors on its own");
    } else {
      const r = p.tray.findIndex((t) => t.n), u = 1 - r, ang = p.tray[u].ang;
      assert.ok(!oracle(p, until(p, { t: r, c: 0 })));
      for (const k of [ang.indexOf(Math.max(...ang)), ang.indexOf(Math.min(...ang))]) assert.ok(!oracle(p, until(p, { t: u, c: k })));
      if (ang.length === 3) assert.ok(!oracle(p, [0, 1, 2].map((k) => ({ t: u, c: k }))), "a triangle's corners make 180°, half a turn");
    }
  }
});

test("darpan/tile: the laws by hand (pentagons leave 36°, four squares close, 3.12.12 and 4.6.12 close, a scalene triangle closes with each corner twice, a four-sided tile with each corner once)", () => {
  const base = { v: "play@1", levelId: "t", family: "darpan", mode: "tile", topicId: "t", skillId: "t-s1", fade: 1, targets: [], context: "darpan", seed: 1, proof: {} };
  const lv = (params, mal = {}) => tileLogic.validate({ ...base, goal: params.goal, params, mal });
  const lay = (level, list) => run(level, [...list.map(([t, c]) => (c === undefined ? { kind: "lay", t } : { kind: "lay", t, c })), { kind: "run" }]);
  const alone = lv({ goal: "alone", labels: 1, tray: [{ n: 5 }, { n: 4 }, { n: 8 }], laid: [], tilt: 0 }, mapOf(["any-regular"]));
  assert.ok(alone);
  const pent = lay(alone, [[0], [0], [0]]);
  assert.ok(!pent.s.done);
  assert.equal(pent.ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "any-regular", "three pentagons: 324°, a 36° gap");
  const five = run(alone, Array(5).fill({ kind: "lay", t: 0 }));
  assert.deepEqual(five.refused, ["round"], "a fourth pentagon runs over (432°); a fifth is refused, the corner is already round");
  assert.equal(five.s.put.length, 4);
  assert.ok(lay(alone, [[1], [1], [1], [1]]).s.done, "four squares: 360°");
  assert.deepEqual(run(alone, [{ kind: "lay", t: 1 }, { kind: "lay", t: 0 }]).refused, ["one_kind"], "one kind of tile on its own");
  const close = lv({ goal: "close", labels: 1, tray: [{ n: 3 }, { n: 4 }, { n: 12 }], laid: [12], tilt: 0 }, mapOf(["gap-ok"]));
  assert.ok(close);
  assert.ok(lay(close, [[0], [2]]).s.done, "12 + 3 + 12: 150 + 60 + 150");
  assert.ok(!lay(close, [[1], [1]]).s.done, "two squares leave a 30° gap");
  assert.equal(lay(close, [[1], [1]]).ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "gap-ok");
  const mixed = lv({ goal: "close", labels: 1, tray: [{ n: 4 }, { n: 6 }, { n: 8 }], laid: [12], tilt: 0 });
  assert.ok(mixed && lay(mixed, [[0], [1]]).s.done, "4.6.12");
  const tri = lv({ goal: "any", labels: 1, tray: [{ ang: [47, 44, 89] }, { n: 5 }], laid: [], tilt: 0 }, mapOf(["only-regular"]));
  assert.ok(tri);
  assert.ok(lay(tri, [[0, 0], [0, 2], [0, 1], [0, 0], [0, 2], [0, 1]]).s.done, "each corner twice, edge to edge");
  assert.ok(lay(tri, [[0, 0], [0, 0], [0, 1], [0, 1], [0, 2], [0, 2]]).s.done, "each corner twice in any order: the corner still closes");
  assert.ok(edgeToEdge(tri.params, [0, 2, 1, 0, 2, 1].map((c) => ({ t: 0, c }))) && !edgeToEdge(tri.params, [0, 0, 1, 1, 2, 2].map((c) => ({ t: 0, c }))), "the floor is drawn only from copies edge to edge");
  assert.equal(lay(tri, [[1], [1], [1]]).ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "only-regular");
  const quad = lv({ goal: "any", labels: 1, tray: [{ n: 8 }, { ang: [97, 64, 118, 81], s: [6, 5] }], laid: [], tilt: 15 });
  assert.ok(quad && lay(quad, [[1, 0], [1, 3], [1, 2], [1, 1]]).s.done, "a four-sided tile: each corner once");
});

test("darpan/tile: the floor a closed corner repeats into holds the solver's own copies (half-turns on each side's middle)", () => {
  for (const [goal, grammar, mals] of CASES.filter(([g]) => g !== "close")) for (const c of levelsOf(goal, grammar, mals, [2, 9]).slice(0, 30)) {
    const p = tileLogic.validate(c.level).params, put = solution(p), ro = rosette(p, put);
    assert.ok(edgeToEdge(p, put), c.signature);
    const ctr = (pts) => pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]);
    const fl = floorOf(ro[0].pts, 8).map(ctr);
    for (const r of ro) { const [x, y] = ctr(r.pts); assert.ok(fl.some(([u, v]) => Math.hypot(u - x, v - y) < 1e-6), `${c.signature}: a copy off the floor`); }
  }
});

test("darpan/tile: the law's rules (a tile from the tray, a corner it has, one kind where asked, nothing past a full turn, a go needs tiles and a change; a copy can be lifted)", () => {
  const level = tileLogic.validate(tileLogic.generate(req("alone", 3))[0].level);
  let s = tileLogic.init(level);
  const ap = (a) => { const r = tileLogic.apply(level, s, a, 1); s = r.state; return r.refused; };
  assert.equal(ap({ kind: "run" }), "tiles_first");
  assert.equal(ap({ kind: "lay", t: 5 }), "no_tile");
  assert.equal(ap({ kind: "lay", t: 0, c: 1 }), "no_corner");
  assert.equal(ap({ kind: "lay", t: "x" }), "no_tile");
  assert.equal(ap({ kind: "lift", j: 0 }), "no_copy");
  assert.equal(ap({ kind: "lay", t: 0 }), undefined);
  assert.equal(ap({ kind: "lay", t: 1 }), "one_kind");
  assert.equal(ap({ kind: "run" }), "missed");
  assert.equal(ap({ kind: "run" }), "change_first");
  assert.equal(ap({ kind: "lift", j: 0 }), undefined);
  assert.deepEqual(s.put, []);
  assert.equal(ap({ kind: "undo" }), undefined);
  assert.equal(s.put.length, 1, "undo puts the lifted copy back");
  assert.equal(ap({ kind: "mark" }), "unknown_act");
});

test("darpan/tile: tampered params are refused", () => {
  const g = (goal, grammar = {}) => tileLogic.generate(req(goal, 6, { grammar }))[0].level;
  const close = g("close"), alone = g("alone"), tri = g("any", { shapes: ["tri"] }), quad = g("any", { shapes: ["quad"] });
  for (const lv of [close, alone, tri, quad]) assert.ok(tileLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  const u = (lv) => lv.params.tray.findIndex((t) => t.ang);
  const withTray = (lv, i, t) => bad(lv, { tray: lv.params.tray.map((x, j) => (j === i ? t : x)) });
  for (const [lv, patch] of [
    [close, { laid: [] }], [close, { laid: [7] }], [close, { tray: [{ n: 4 }] }], [close, { tilt: 7 }], [close, { tilt: 360 }], [close, { goal: "turn" }], [close, { tray: [{ n: 4 }, { n: 4 }, { n: 6 }] }],
    [close, { tray: [{ n: 4 }, { ang: [47, 44, 89] }] }], [close, { laid: [3, 3, 3, 3, 3] }],
    [alone, { tray: [{ n: 3 }, { n: 4 }, { n: 5 }] }], [alone, { tray: [{ n: 5 }, { n: 8 }, { n: 10 }] }], [alone, { laid: [4] }], [alone, { tray: [{ n: 3, x: 1 }, { n: 5 }, { n: 8 }] }],
    [tri, { tray: [{ n: 6 }, ...tri.params.tray.filter((t) => t.ang)] }], [tri, { tray: tri.params.tray.filter((t) => t.ang) }],
  ]) assert.equal(tileLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  for (const t of [{ ang: [60, 60, 60] }, { ang: [45, 45, 90] }, { ang: [50, 60, 71] }, { ang: [30, 70, 80] }, { ang: [70, 70, 40] }, { ang: [47, 44, 89], s: [3, 3] }, { ang: [40, 70, 70] }])
    assert.equal(tileLogic.validate(withTray(tri, u(tri), t)), null, `uneven ${JSON.stringify(t)}`);
  for (const t of [{ ang: [90, 90, 90, 90], s: [4, 4] }, { ang: [97, 64, 118, 81] }, { ang: [97, 64, 118, 81], s: [9, 4] }, { ang: [100, 80, 100, 80], s: [4, 4] }])
    assert.equal(tileLogic.validate(withTray(quad, u(quad), t)), null, `uneven ${JSON.stringify(t)}`);
  assert.equal(tileLogic.validate({ ...close, mode: "mirror" }), null, "a goal belongs to its mode");
  assert.equal(tileLogic.validate({ ...close, params: null }), null);
});

test("darpan/tile: a claim in an act never decides; the first go decides the evidence; grade replays", () => {
  for (const [goal, grammar, mals] of CASES) {
    const level = tileLogic.validate(tileLogic.generate(req(goal, 4, { grammar, misMap: mapOf(mals) }))[0].level);
    const forged = tileLogic.grade(level, env([{ kind: "run", solved: true, correct: true, verdict: "solved" }]));
    assert.notEqual(forged.verdict, "solved");
    const ok = tileLogic.grade(level, env(tileLogic.solve(level)));
    assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
    const mal = tileLogic.malActs(level, mals[0]);
    const back = mal.filter((a) => a.kind !== "run").map(() => ({ kind: "undo" }));
    const wrong = [...mal, ...back, ...tileLogic.solve(level)];
    const g = tileLogic.grade(level, env(wrong));
    assert.equal(g.evidence[0].outcome, "incorrect", `${goal}: the first go decides`);
    assert.equal(g.verdict, "solved", "a child who recovers still solves the level");
    assert.deepEqual(tileLogic.grade(level, env(wrong)), g);
  }
});

for (const [goal, grammar, mals] of CASES) {
  test(`darpan/tile/${goal}: ≥ 2000 random acts; the go's verdict ⇔ the independent oracle; never throws; generator work bounded (counted, not timed)`, () => {
    let seed = 31, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const candCounts = []; // candidates per generate/pick: a count, not a clock (tests/_work.mjs)
    for (let gi = 0; gi < 40; gi++) {
      let cands = [];
      cands = tileLogic.generate(req(goal, 100 + gi, { grammar, misMap: mapOf(mals) }));
      candCounts.push(cands.length);
      for (const c of cands.slice(0, 3)) {
        const level = tileLogic.validate(c.level), p = level.params, sol = tileLogic.solve(level);
        let s = tileLogic.init(level), k = 0;
        const pursue = rnd() < 0.45;
        for (let i = 0; i < 60 && !s.done; i++) {
          const r = rnd(), t = Math.floor(rnd() * p.tray.length);
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.5 ? { kind: "lay", t: rnd() < 0.9 ? t : 9, c: Math.floor(rnd() * (p.tray[t].ang?.length ?? 1)) }
              : r < 0.6 ? { kind: "lift", j: Math.floor(rnd() * 4) }
                : r < 0.85 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true, correct: true } : {}) } : { kind: "undo" };
          const before = s, out = tileLogic.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "run" && out.state.ended && !before.ended) { judged++; assert.equal(out.state.done, oracle(p, before.put), `${level.levelId}: law and oracle disagree on ${JSON.stringify(before.put)}`); }
          s = out.state;
        }
        if (tileLogic.goalMet(level, s)) { solved++; assert.ok(oracle(p, s.put)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(Math.max(...candCounts) <= 48, `${Math.max(...candCounts)} candidates per call (measured 2026-11-10: 16; bound is 3x)`);
  });
}

// the play server: every tile coverage entry serves a proven level at every fade (levelsFor and currentLevel); the solver's
// acts grade solved through the server; a claim never solves; a discriminated mal-rule folds its kit id
const TE = () => coverage().entries.filter((e) => e.family === "darpan" && e.mode === "tile");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("darpan/tile coverage: three entries for c7-maths-ch14-t02, mapped to its real kit misconceptions; every skill of the topic admitted to darpan", () => {
  assert.deepEqual(TE().map((e) => `${e.topicId}|${e.goal}|${Object.values(e.misMap).join(",")}`), [
    "c7-maths-ch14-t02|close|c7-maths-ch14-t02-m-gap-ok", "c7-maths-ch14-t02|alone|c7-maths-ch14-t02-m-any-regular", "c7-maths-ch14-t02|any|c7-maths-ch14-t02-m-only-regular"]);
  const kit = JSON.parse(readFileSync(`${ROOT}data/kits/c7-maths.json`, "utf8")).topics.find((t) => t.topicId === "c7-maths-ch14-t02");
  for (const e of TE()) for (const id of Object.values(e.misMap)) assert.ok(kit.misconceptions.some((m) => m.id === id), id);
  for (const sk of ["c7-maths-ch14-t02-s1", "c7-maths-ch14-t02-s2", "c7-maths-ch14-t02-s3"]) { assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "darpan", sk); }
});

for (const e of coverage().entries.filter((x) => x.family === "darpan" && x.mode === "tile")) for (const fade of [1, 2, 3]) {
  test(`darpan/tile server ${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; the mal-rule folds its kit id; hidden values`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "darpan" && cur.mode === "tile" && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.labels, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      assert.deepEqual(level.proof.discriminates, Object.values(e.misMap));
      const g = gradeActs(level, env(tileLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const [mal, kitId] of Object.entries(level.mal)) {
        const mg = gradeActs(level, env(tileLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}

test("darpan/tile: the picker serves real variety across children (never one favourite shape)", () => {
  const kind = (lv) => { const p = lv.params; return p.goal === "alone" ? p.tray.find((t) => [3, 4, 6].includes(t.n)).n : p.goal === "any" ? p.tray.find((t) => t.ang).ang.length : `${p.laid.join(".")}+${solution(p).map((q) => p.tray[q.t].n).join(".")}`; };
  for (const e of TE()) for (const fade of [1, 2, 3]) {
    const sigs = new Set(), kinds = new Set();
    for (let i = 0; i < 30; i++) { const lv = currentLevel(sessionOf(e, { fade, childId: `v${i}`, seed: seedOf(`v${i}`, entryKey(e), 0) }), e); sigs.add(lv.sig); kinds.add(kind(lv)); }
    assert.ok(sigs.size >= 20, `${e.goal} fade ${fade}: ${sigs.size} distinct levels for 30 children`);
    assert.ok(kinds.size >= (e.goal === "close" ? 4 : e.goal === "alone" ? 3 : 2), `${e.goal} fade ${fade}: kinds ${[...kinds].join(" ")}`);
  }
});

test("darpan/tile: engine words sit before vakya's, every key the view uses exists in all three languages; no clock, no randomness, no colour literal", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/darpan/tile.view.ts`, "utf8");
  const used = [...view.matchAll(/"(darpan\.[a-zA-Z.]+)"/g)].map((m) => m[1]);
  const dyn = [...[3, 4, 5, 6, 8, 9, 10, 12].map((n) => `darpan.tile.n${n}`), "darpan.goal.close", "darpan.goal.alone", "darpan.goal.any"];
  assert.ok(used.length >= 7);
  for (const k of [...used, ...dyn]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/darpan/tile.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
