// r8 Games (docs/design/round8/games-engine-needs.md §2): kon/name, c6-maths-ch02-t02. Three lettered rays from a vertex, two
// ends joined: five angles. say: the lit angle is named by tapping three letters; find: the arc a shown name denotes is
// tapped. Proof suite: every generated level validates, solves, is shortcut-free (reading the letters across the screen, or
// taking the widest arc, never passes); an INDEPENDENT checker (its own geometry: the angle at the middle letter between the
// rays to the outer two) agrees with every verdict; ABC = CBA; vertex-name lands on its own misconception and lights the angle
// the name really denotes (dashed when it is not one of the figure's); random taps never solve a wrong name; the evidence
// carries the name, vertexOk and armsOk; the coverage entries serve; the picker's speed bar is CPU time.
import { test } from "node:test";
import assert from "node:assert/strict";
import { konLogic } from "../src/play/families/kon/kon.logic.ts";
import { points, corners, nameOf, nameEvidence, segments, arcHit, arcTargets } from "../src/play/families/kon/kon.name.ts";
import { pickLevels, env } from "../src/play/core/pick.ts";
import { CHANCE_WEIGHT, GAME_WEIGHT } from "../shared/play.ts";
import { gradeActs } from "../server/play/grade.js";
import coverage from "../data/play/coverage.json" with { type: "json" };
import WORDS from "../data/play/engine-words.json" with { type: "json" };
import { cpuNow } from "./_cpu-ms.mjs";

const MIS = { "vertex-name": "k-vn" };
const req = (goal, seed, fade = 1) => ({ family: "kon", mode: "name", goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade, mis: {}, misMap: MIS, grammar: {}, recent: [], seed });
const levels = (goal, fades = [1, 2, 3], seeds = [1, 7, 42, 99]) => fades.flatMap((f) => seeds.flatMap((sd) => konLogic.generate(req(goal, sd, f)).map((c) => konLogic.validate(c.level))));
const run = (level, acts) => { let s = konLogic.init(level); const ms = []; acts.forEach((a, i) => { const r = konLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); }); return { s, ms }; };
const say = (t) => [...t.map((at) => ({ kind: "letter", at })), { kind: "commit" }];

// ── the independent checker: which drawn angle (vertex point, the two points on its arms) a name means, by plain geometry
const ang = (P, a, v, b) => {
  const u = [P[a][0] - P[v][0], P[a][1] - P[v][1]], w = [P[b][0] - P[v][0], P[b][1] - P[v][1]];
  return (Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w))) * 180) / Math.PI;
};
/** the figure's angles from its drawn segments alone: at each point, every two segments meeting there */
function drawnAngles(p) {
  const out = [];
  const seg = segments(p);
  for (let v = 0; v < 4; v++) {
    const nb = seg.filter(([i, j]) => i === v || j === v).map(([i, j]) => (i === v ? j : i));
    for (let x = 0; x < nb.length; x++) for (let y = x + 1; y < nb.length; y++) out.push({ v, set: new Set([nb[x], nb[y]]) });
  }
  return out;
}
/** does name t (point indices) name the angle `want` {v, set}? middle = vertex, outer two = its arms, either order */
const names = (t, want) => t[1] === want.v && t[0] !== t[2] && want.set.has(t[0]) && want.set.has(t[2]);

for (const goal of ["say", "find"]) {
  test(`kon/name/${goal}: every generated level validates, solves, is shortcut-free; the checker agrees; vertex-name shows on its own`, () => {
    let n = 0, mals = 0, dashed = 0;
    for (const level of levels(goal)) {
      assert.ok(level, "validates"); assert.equal(level.mode, "name");
      n++;
      const p = level.params, D = drawnAngles(p);
      assert.equal(D.length, 5, "five angles drawn");
      const want = corners(p)[p.ask];
      assert.ok(D.some((d) => d.v === want.v && d.set.has(want.a) && d.set.has(want.b)), "the asked angle is drawn");
      const sol = konLogic.solve(level), r = run(level, sol);
      assert.ok(r.s.done, `${level.levelId} solves`);
      assert.equal(konLogic.shortcut(level), null, `${level.levelId} has a shortcut`);
      if (goal === "say") {
        const t = sol.slice(0, 3).map((a) => a.at);
        assert.ok(names(t, { v: want.v, set: new Set([want.a, want.b]) }), "the checker: the solver's name names the lit angle");
        // ABC = CBA
        assert.ok(run(level, say([t[2], t[1], t[0]])).s.done, "the other way round is the same name");
        // reading the three letters left to right / top to bottom never names it
        const P = points(p);
        for (const ax of [0, 1]) { const o = [...t].sort((i, j) => (ax ? P[j][1] - P[i][1] : P[i][0] - P[j][0])); assert.ok(!names(o, { v: want.v, set: new Set([want.a, want.b]) }), `${level.levelId}: reading across passes`); }
      } else {
        const k = sol[0].at;
        assert.equal(k, p.ask);
        // the widest arc is never the answer
        const P = points(p), sizes = corners(p).map((c) => ang(P, c.a, c.v, c.b));
        assert.notEqual(sizes.indexOf(Math.max(...sizes)), p.ask);
      }
      assert.equal(konLogic.grade(level, env(sol)).evidence[0].weight, goal === "find" ? CHANCE_WEIGHT : GAME_WEIGHT);
      const m = konLogic.malActs(level, "vertex-name");
      if (!m) continue;
      mals++;
      const mr = run(level, m);
      assert.ok(!mr.s.done);
      const named = mr.ms.filter((x) => x.kind === "misconception_consequence");
      assert.equal(named.length, 1); assert.equal(named[0].misconceptionId, "vertex-name");
      assert.equal(named[0].facts.vertex_ok, "no");
      if (goal === "say") {
        // the name she gave denotes the angle at its middle letter: drawn (solid) or not one of the five (dashed)
        const t = m.slice(0, 3).map((a) => a.at), isDrawn = D.some((d) => names(t, d));
        assert.equal(named[0].facts.shown, isDrawn ? "figure" : "dashed");
        if (!isDrawn) dashed++;
        assert.equal(named[0].facts.arms_ok, "no");
      } else {
        // her pick is the angle at the shown name's first or last letter, a drawn one
        const shown = nameOf(want, p.ord), picked = corners(p)[m[0].at];
        assert.ok(picked.v === shown[0] || picked.v === shown[2]);
      }
      const g = konLogic.grade(level, env(m), { final: true });
      // round 8 law 3 (ruling kon/name 2): in find one tap among the corners names nothing (kept at chance weight as chanceMis); a
      // three-tap name in say names it
      assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, goal === "say" ? "k-vn" : undefined); assert.equal(g.evidence[0].chanceMis, goal === "say" ? undefined : "k-vn");
    }
    assert.ok(n >= 20, `only ${n} levels`);
    assert.ok(mals >= n / 2, `vertex-name applied on ${mals} of ${n}`);
    if (goal === "say") assert.ok(dashed > 0, "some vertex-first names denote an angle the figure does not draw (dashed)");
  });
}

test("kon/name: ≥ 3000 random taps; a solve is always a name the checker accepts; the law never throws", () => {
  let seed = 31, acts = 0, solved = 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
  for (const goal of ["say", "find"]) for (const level of levels(goal, [1, 2], [3, 5, 8, 13]).slice(0, 40)) {
    const want = corners(level.params)[level.params.ask], W = { v: want.v, set: new Set([want.a, want.b]) };
    for (let rep = 0; rep < 6; rep++) {
      let s = konLogic.init(level);
      for (let i = 0; i < 14 && !s.done; i++) {
        const r = rnd();
        const a = goal === "say" ? (r < 0.65 ? { kind: "letter", at: Math.floor(rnd() * 5) - (rnd() < 0.05 ? 3 : 0) } : r < 0.85 ? { kind: "commit", ...(rnd() < 0.3 ? { solved: true } : {}) } : r < 0.93 ? { kind: "clear" } : { kind: "undo" })
          : r < 0.8 ? { kind: "arc", at: Math.floor(rnd() * 6), ...(rnd() < 0.2 ? { correct: true } : {}) } : { kind: "undo" };
        const before = s;
        s = konLogic.apply(level, s, a, i + 1).state;
        acts++;
        if (s.done && !before.done) {
          solved++;
          if (goal === "say") assert.ok(names(s.nm.said, W), `${level.levelId}: solved with ${s.nm.said}`);
          else assert.equal(s.nm.picked, level.params.ask);
        }
      }
    }
  }
  assert.ok(acts >= 3000, `only ${acts} acts`);
  assert.ok(solved > 0);
});

test("kon/name: taps out of turn are refused; tampered params are refused", () => {
  const level = levels("say", [1], [5])[0];
  let s = konLogic.init(level);
  assert.equal(konLogic.apply(level, s, { kind: "commit" }, 1).refused, "three_first");
  assert.equal(konLogic.apply(level, s, { kind: "letter", at: 7 }, 1).refused, "bad_letter");
  assert.equal(konLogic.apply(level, s, { kind: "arc", at: 1 }, 1).refused, "unknown_act");
  for (const i of [0, 1, 2]) s = konLogic.apply(level, s, { kind: "letter", at: i }, i + 1).state;
  assert.equal(konLogic.apply(level, s, { kind: "letter", at: 3 }, 4).refused, "three_already");
  const f = levels("find", [1], [5])[0];
  assert.equal(konLogic.apply(f, konLogic.init(f), { kind: "arc", at: 9 }, 1).refused, "bad_arc");
  const base = { v: "play@1", levelId: "x", family: "kon", mode: "name", topicId: "t", skillId: "t-s1", fade: 1, targets: [], mal: {}, slip: null, seed: 1 };
  const ok = { ...level.params };
  for (const params of [{ ...ok, lets: "OOAB" }, { ...ok, lets: "OAB" }, { ...ok, lets: "OABZ" }, { ...ok, ask: 7 }, { ...ok, tri: 4 }, { ...ok, h2: ok.h1, ln2: ok.ln1 * 0.5 }])
    assert.equal(konLogic.validate({ ...base, goal: params.goal, params }), null, JSON.stringify(params));
});

test("kon/name evidence: the name she gave, vertexOk, armsOk; the grade's facts carry them", () => {
  const level = levels("say", [2], [7])[0], p = level.params, c = corners(p)[p.ask];
  const wrong = say([c.v, c.a, c.b]);
  const r = run(level, wrong);
  assert.deepEqual(nameEvidence(p, r.s.nm), { name: [c.v, c.a, c.b].map((i) => p.lets[i]).join(""), vertexOk: false, armsOk: false });
  const right = run(level, say([c.b, c.v, c.a]));
  assert.deepEqual(nameEvidence(p, right.s.nm), { name: [c.b, c.v, c.a].map((i) => p.lets[i]).join(""), vertexOk: true, armsOk: true });
  const g = gradeActs(level, env([...wrong, { kind: "clear" }, ...say([c.a, c.v, c.b])]), { final: true });
  assert.equal(g.grade.verdict, "solved");
  assert.equal(g.grade.evidence[0].misconceptionId, "k-vn");
  assert.equal(g.trail.firstTry, false);
  assert.equal(g.grade.facts.said, [c.a, c.v, c.b].map((i) => p.lets[i]).join(""));
  assert.equal(g.grade.facts.vertex_ok, "yes"); assert.equal(g.grade.facts.arms_ok, "yes");
  const gw = gradeActs(level, env(wrong), { final: true });
  assert.equal(gw.grade.facts.vertex_ok, "no"); assert.equal(gw.grade.facts.arms_ok, "no");
});

test("kon/name: no goal line or button states the answer or the rule (where the vertex goes); every language has every line", () => {
  for (const key of ["kon.goal.say", "kon.goal.find", "kon.clear", "kon.name"]) for (const lang of ["hinglish", "en", "hi"]) {
    const l = WORDS.words[key]?.[lang];
    assert.ok(l, `${key} ${lang}`);
    assert.doesNotMatch(l, /middle|beech|बीच|vertex|shirsh|शीर्ष|order|kram|क्रम/i, `${key} ${lang}: ${l}`);
    // no number word either: how many letters a name has is part of the rule (judge packet, "teen aksharon")
    assert.doesNotMatch(l, /\b(one|two|three|ek|teen|tin)\b|एक|तीन/i, `${key} ${lang}: ${l}`);
    if (lang === "hi") assert.match(l, /[ऀ-ॿ]/);
  }
});

test("kon/name/find: a tap is on the nearest arc; every arc has its own touch disc ≥ 48 board px across, and no two overlap", () => {
  let n = 0;
  for (const level of levels("find")) {
    const p = level.params, T = arcTargets(p);
    T.forEach((t, k) => {
      assert.ok(t && t.side >= 48, `${level.levelId}: arc ${k} has no 48 px disc`);
      // the whole disc is on arc k (its rim sampled finely)
      for (let i = 0; i < 48; i++) for (const f of [1, 0.6, 0.25]) {
        const a = (2 * Math.PI * i) / 48;
        assert.equal(arcHit(p, t.x + (f * t.side * Math.cos(a)) / 2, t.y + (f * t.side * Math.sin(a)) / 2), k, `${level.levelId}: disc ${k}`);
      }
    });
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) assert.ok(Math.hypot(T[i].x - T[j].x, T[i].y - T[j].y) >= (T[i].side + T[j].side) / 2, `${level.levelId}: discs ${i} and ${j} overlap`);
    // the tap on each arc's own middle is that arc; the solver's arc is the asked one
    assert.equal(run(level, [{ kind: "arc", at: p.ask }]).s.done, true);
    n++;
  }
  assert.ok(n >= 20, `${n} find levels`);
});

test("kon/name/say: one-letter undo takes back her last letter (beside Mita do, which clears all three)", () => {
  const level = levels("say", [1], [7])[0];
  const r = run(level, [{ kind: "letter", at: 1 }, { kind: "letter", at: 0 }, { kind: "letter", at: 2 }, { kind: "undo" }]);
  assert.deepEqual(r.s.nm.taps, [1, 0]);
  const r2 = run(level, [{ kind: "letter", at: 1 }, { kind: "undo" }, { kind: "undo" }]);
  assert.deepEqual(r2.s.nm.taps, []);
});

test("kon/name: every coverage entry serves a level as the play server would, with vertex-name mapped", async () => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  const mine = coverage.entries.filter((e) => e.family === "kon" && e.mode === "name");
  assert.deepEqual(mine.map((e) => e.goal).sort(), ["find", "say"]);
  for (const entry of mine) {
    assert.equal(entry.topicId, "c6-maths-ch02-t02");
    assert.deepEqual(entry.misMap, { "vertex-name": "c6-maths-ch02-t02-m-vertex-name" });
    for (let n = 0; n < 4; n++) {
      const key = entryKey(entry);
      const s = { childId: `t-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
        mis: {}, pL: undefined, n: 0, seed: seedOf(`t-${n}`, key, 0), door: "garam", recent: [], hist: null };
      const lv = currentLevel(s, entry);
      assert.ok(lv, `${entry.goal} served nothing`);
      assert.equal(lv.params.goal, entry.goal);
      assert.ok(lv.proof.discriminates.includes("c6-maths-ch02-t02-m-vertex-name"));
    }
  }
});

test("kon/name: the picker's work per level is within its bar (p95 ≤ 50 ms of CPU time)", () => {
  const cpu = [];
  for (const goal of ["say", "find"]) for (let k = 0; k < 15; k++) {
    const t0 = cpuNow();
    assert.ok(pickLevels(konLogic, req(goal, 700 + k, 1 + (k % 3)))?.garam);
    cpu.push(cpuNow() - t0);
  }
  cpu.sort((a, b) => a - b);
  assert.ok(cpu[Math.floor(cpu.length * 0.95)] <= 50, `p95 ${cpu[Math.floor(cpu.length * 0.95)].toFixed(1)} ms CPU`);
});
