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
import { points, labelPoints, corners, nameOf, nameEvidence, nameFaint, segments, arcHit, arcTargets, ARC_R, DRAW_R, drawR, dashR, sayMalSize, noCrossing, generateName, WIDE, TRI_PAIRS } from "../src/play/families/kon/kon.name.ts";
import { pickLevels, env } from "../src/play/core/pick.ts";
import { CHANCE_WEIGHT, GAME_WEIGHT, namingOn } from "../shared/play.ts";
import { gradeActs } from "../server/play/grade.js";
import coverage from "../data/play/coverage.json" with { type: "json" };
import WORDS from "../data/play/engine-words.json" with { type: "json" };
import { cpuNow } from "./_cpu-ms.mjs";

const MIS = { "vertex-name": "k-vn" };
const req = (goal, seed, fade = 1, recent = []) => ({ family: "kon", mode: "name", goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade, mis: {}, misMap: MIS, grammar: {}, recent, seed });
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
/** the orders a child reading the screen like text might give three points (written here, not from the law): two points
 *  within 22 board px in height are one row (read along it either way), else the higher first or the lower first; the same
 *  by columns, within 16 px in width */
function readings(three, Q) {
  const out = [];
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((o) => o.map((k) => three[k]));
  for (const [ax, tol] of [[1, 22], [0, 16]]) for (const along of [1, -1]) for (const across of [1, -1]) {
    // a permutation fits when every pair is in an order this reading allows
    const before = (i, j) => (Math.abs(Q[i][ax] - Q[j][ax]) <= tol ? along * (Q[i][1 - ax] - Q[j][1 - ax]) * (ax === 1 ? 1 : -1) <= 0 : across * (Q[i][ax] - Q[j][ax]) * (ax === 1 ? -1 : 1) <= 0);
    for (const o of perms) if (before(o[0], o[1]) && before(o[1], o[2]) && before(o[0], o[2])) out.push(o);
  }
  return out;
}

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
      // evening ruling kon/name 1 (both goals): reading the asked angle's letters off the screen like text (by rows, letters
      // within a letter's height one row; or by columns, within a letter's width one column; either way round) never puts
      // the vertex in the middle, by the points or by where the letters are drawn
      // (night ruling kon/name 2: find's wide arc is a key too, and the one key exempt: it is over 90°, and the vertex of any
      // angle over 90° lies between its arms' ends by rows or by columns; reading across finds the key there, 1 level in 5)
      if (!(goal === "find" && p.ask === WIDE)) for (const Q of [points(p), labelPoints(p)]) for (const o of readings([want.a, want.v, want.b], Q)) assert.notEqual(o[1], want.v, `${level.levelId}: read across as ${o.map((i) => p.lets[i]).join("")}`);
      if (goal === "say") {
        const t = sol.slice(0, 3).map((a) => a.at);
        assert.ok(names(t, { v: want.v, set: new Set([want.a, want.b]) }), "the checker: the solver's name names the lit angle");
        // ABC = CBA
        assert.ok(run(level, say([t[2], t[1], t[0]])).s.done, "the other way round is the same name");
      } else {
        const k = sol[0].at;
        assert.equal(k, p.ask);
        // (the widest arc may be the answer: night ruling kon/name 2 spreads the keys over all five)
      }
      // (gate 2: a faint solve, the first fade-1 level with O at the vertex, enters at chance weight too)
      assert.equal(konLogic.grade(level, env(sol)).evidence[0].weight, goal === "find" || nameFaint(p, level.fade) ? CHANCE_WEIGHT : GAME_WEIGHT);
      const m = konLogic.malActs(level, "vertex-name");
      if (!m) continue;
      mals++;
      const mr = run(level, m);
      assert.ok(!mr.s.done);
      if (goal === "find") {
        // judging round 2 (law 3): the first-letter pick plays out its signature, but one tap among five names nothing: the
        // grade keeps it at chance weight as chanceMis (find is a oneDecision goal), nothing on her record
        // (evening ruling kon/name 3: the moment's facts say nothing about the vertex: no sign, no vertex_ok / arms_ok)
        const last = mr.ms.at(-1);
        assert.equal(last.kind, "misconception_consequence"); assert.equal(last.misconceptionId, "vertex-name");
        for (const k of ["sign", "vertex_ok", "arms_ok"]) assert.equal(last.facts[k], undefined, k);
        const shown = nameOf(want, p.ord), picked = corners(p)[m[0].at];
        assert.ok(picked.v === shown[0] || picked.v === shown[2]);
        const ev = konLogic.grade(level, env(m), { final: true }).evidence[0];
        assert.equal(ev.misconceptionId, undefined, "nothing on her record from one tap"); assert.equal(ev.chanceMis, "k-vn"); assert.equal(ev.weight, CHANCE_WEIGHT);
        // any other wrong arc is no sign
        const other = [0, 1, 2, 3, 4].find((k) => k !== p.ask && k !== m[0].at);
        assert.equal(run(level, [{ kind: "arc", at: other }]).ms.at(-1).facts.sign, undefined);
        continue;
      }
      const named = mr.ms.filter((x) => x.kind === "misconception_consequence");
      assert.equal(named.length, 1); assert.equal(named[0].misconceptionId, "vertex-name");
      // (gate 2: a say name is a pick too: the moment says nothing about the vertex)
      for (const k of ["sign", "vertex_ok", "arms_ok"]) assert.equal(named[0].facts[k], undefined, k);
      if (goal === "say") {
        // the name she gave denotes the angle at its middle letter: drawn (solid) or not one of the five (dashed)
        const t = m.slice(0, 3).map((a) => a.at), isDrawn = D.some((d) => names(t, d));
        assert.equal(named[0].facts.shown, isDrawn ? "figure" : "dashed");
        if (!isDrawn) dashed++;
      }
      const g = konLogic.grade(level, env(m), { final: true });
      // round 8 law 3: one pick names nothing (kept at chance weight as chanceMis): find's tap among five arcs, and (gate 2)
      // say's three-tap name, which three random taps give 1 time in 6
      assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, undefined); assert.equal(g.evidence[0].chanceMis, "k-vn");
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

test("kon/name evidence: the name she gave, vertexOk, armsOk; the grade's facts carry her name only (gate 2: a say name is a pick)", () => {
  const level = levels("say", [2], [7])[0], p = level.params, c = corners(p)[p.ask];
  const wrong = say([c.v, c.a, c.b]);
  const r = run(level, wrong);
  assert.deepEqual(nameEvidence(p, r.s.nm), { name: [c.v, c.a, c.b].map((i) => p.lets[i]).join(""), vertexOk: false, armsOk: false });
  const right = run(level, say([c.b, c.v, c.a]));
  assert.deepEqual(nameEvidence(p, right.s.nm), { name: [c.b, c.v, c.a].map((i) => p.lets[i]).join(""), vertexOk: true, armsOk: true });
  const g = gradeActs(level, env([...wrong, { kind: "clear" }, ...say([c.a, c.v, c.b])]), { final: true });
  assert.equal(g.grade.verdict, "solved");
  assert.equal(g.grade.evidence[0].misconceptionId, undefined); assert.equal(g.grade.evidence[0].chanceMis, "k-vn");
  assert.equal(g.trail.firstTry, false);
  assert.equal(g.grade.facts.said, [c.a, c.v, c.b].map((i) => p.lets[i]).join(""));
  const gw = gradeActs(level, env(wrong), { final: true });
  for (const x of [g, gw]) for (const k of ["vertex_ok", "arms_ok"]) assert.equal(x.grade.facts[k], undefined, k);
  assert.equal(gw.grade.facts.said, [c.v, c.a, c.b].map((i) => p.lets[i]).join(""));
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

test("kon/name: every coverage entry serves a level as the play server would, with vertex-name mapped (find's at chance weight)", async () => {
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
      // (find: a key whose first-letter reading is not drawn, the wide arc or the angle at the vertex outside the triangle,
      // shows no mix-up; night ruling kon/name 2 serves those keys too)
      if (konLogic.malActs(lv, "vertex-name")) assert.ok(lv.proof.discriminates.includes("c6-maths-ch02-t02-m-vertex-name"));
      else assert.equal(lv.params.goal, "find", "every say level shows vertex-name");
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

test("judging round 2: the figure (arcs at the vertex at different radii, no line across a ray, never O with Q, a long enough dashed arc)", () => {
  // the two arcs at the vertex between neighbouring rays are drawn at different radii, and each drawn arc lies in its own
  // tap band (a tap on what she sees is a tap on that arc)
  assert.notEqual(DRAW_R[0], DRAW_R[1]);
  assert.ok(Math.abs(DRAW_R[0] - DRAW_R[1]) >= 12, "a visible gap where they meet");
  let n = 0, dashedSay = 0;
  for (const goal of ["say", "find"]) for (const level of levels(goal)) {
    const p = level.params, P = points(p);
    assert.ok(noCrossing(p), `${level.levelId}: the joined pair crosses a ray`);
    assert.ok(!(p.lets.includes("O") && p.lets.includes("Q")), `${level.levelId}: O and Q together (${p.lets})`);
    if (goal === "find") corners(p).forEach((c, k) => {
      const v = P[c.v], ha = Math.atan2(P[c.a][1] - v[1], P[c.a][0] - v[0]), hb = Math.atan2(P[c.b][1] - v[1], P[c.b][0] - v[0]);
      let d = hb - ha; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      for (let f = 0.08; f <= 0.92; f += 0.04) { const a = ha + d * f; assert.equal(arcHit(p, v[0] + drawR(p, k) * Math.cos(a), v[1] + drawR(p, k) * Math.sin(a)), k, `${level.levelId}: drawn arc ${k} at ${f.toFixed(2)}`); }
    });
    if (goal === "say") { const m = sayMalSize(p); if (m !== null) { dashedSay++; assert.ok(m >= 20, `${level.levelId}: dashed ${m}°`); assert.ok((dashR(m) * m * Math.PI) / 180 >= 23.9, `${level.levelId}: dashed arc too short`); } }
    n++;
  }
  assert.ok(n >= 40 && dashedSay > 0, `${n} / ${dashedSay}`);
  assert.deepEqual(ARC_R.slice(3), [24, 24]);
});

test("judging round 2: at fade 1 the vertex is O in her first level only; later levels at fade 1 never put O at the vertex", () => {
  for (const goal of ["say", "find"]) for (const seed of [1, 7, 42, 99, 123]) {
    const first = konLogic.generate(req(goal, seed, 1)), later = konLogic.generate(req(goal, seed, 1, ["name:say:0:50:50:0:0"]));
    assert.ok(first.length && later.length);
    assert.ok(first.every((c) => c.level.params.lets[0] === "O"), `${goal} ${seed}: first level vertex`);
    assert.ok(later.every((c) => c.level.params.lets[0] !== "O"), `${goal} ${seed}: a later level's vertex is O`);
  }
  // fade 2 and up: any letter, never O with Q
  let r = 5; const rnd = () => ((r = (r * 1103515245 + 12345) >>> 0) / 2 ** 32);
  assert.ok(generateName("say", rnd, 2, false).some((x) => x.params.lets[0] !== "O"));
});

test("evening ruling kon/name 2: find keys at the vertex (the centre point) as well as at the triangle corners, as served", async () => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  const entry = coverage.entries.find((e) => e.family === "kon" && e.mode === "name" && e.goal === "find"), key = entryKey(entry);
  const at = { vertex: 0, corner: 0 };
  for (const fade of [1, 2, 3]) for (let n = 0; n < 16; n++) {
    const lv = currentLevel({ childId: `k-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: 6, fade, lang: "hinglish", childArt: null, lastArt: null, mis: {}, pL: undefined, n: 0, seed: seedOf(`k-${n}`, key, 0), door: "garam", recent: [], hist: null }, entry);
    at[corners(lv.params)[lv.params.ask].v === 0 ? "vertex" : "corner"]++;
  }
  assert.ok(at.vertex >= 6 && at.corner >= 6, JSON.stringify(at));
});

test("evening ruling kon/name 3: after one find tap nothing about vertex-name reaches the teacher's view; it surfaces on the repeat", async () => {
  const { routes, playDeps } = await import("../server/play/routes.js");
  const { verifyEvidence, verifySeam } = await import("../server/play/evidence.js");
  const { playFactsRow } = await import("../shared/play.ts");
  const res = () => { const r = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { r.headers[k] = v; }, end(x) { r.body = x ? JSON.parse(x) : null; } }; return r; };
  const CHILD = "00000000-0000-4000-8000-0000000000a7", LES = "22222222-2222-4222-8222-222222222222", KIT = "c6-maths-ch02-t02-m-vertex-name";
  const saved = { ...playDeps };
  const about = /vertex|sign=|mal=|misconception=|chance/i;
  try {
    playDeps.requireChild = async (_req, id) => ({ guardian: { id: "g" }, child: { id, class_level: 6, first_name: "Riya", language_pref: "hinglish" } });
    playDeps.q = async () => [];
    playDeps.writeHome = async () => ({ written: true, n: 0 });
    const st = res();
    await routes["POST /api/play/start"]({}, st, { childId: CHILD, skillId: "c6-maths-ch02-t02-s1", goal: "find", lessonId: LES });
    assert.equal(st.statusCode, 200);
    let lv = st.body.level, sid0 = st.body.sessionId;
    assert.equal(lv.params.goal, "find");
    // (night ruling kon/name 2: a key whose first-letter reading is not drawn is served too; the next such level is taken)
    for (let k = 0; k < 12 && !konLogic.malActs(lv, "vertex-name"); k++) {
      const nx = res();
      await routes["POST /api/play/next"]({}, nx, { sessionId: sid0, door: "garam" });
      assert.equal(nx.statusCode, 200);
      lv = nx.body.level; sid0 = nx.body.sessionId;
    }
    const tap = konLogic.malActs(lv, "vertex-name");
    assert.ok(tap, "a level whose first-letter reading is drawn");
    // the tap itself (mid-level post): no seam row reaches the lesson
    const mid = res();
    await routes["POST /api/play/act"]({}, mid, { sessionId: sid0, levelId: lv.levelId, acts: env(tap) });
    assert.equal(mid.statusCode, 200); assert.equal(mid.body.seamToken, undefined, "no seam from one tap");
    // the level closed on that tap: the evidence rows, the trail and the level_end row say nothing about it
    const end = res();
    await routes["POST /api/play/act"]({}, end, { sessionId: sid0, levelId: lv.levelId, acts: env(tap), final: true });
    const ev = verifyEvidence(end.body.evidenceToken, { childId: CHILD, lessonId: LES });
    assert.ok(ev && ev.rows.length);
    for (const r of ev.rows) { assert.equal(r.misconceptionId, undefined); assert.equal(r.chanceMis, undefined, "no chanceMis in the lesson's rows"); }
    assert.deepEqual(ev.trail.mal, [], "no mal-rule in the trail");
    const seam = verifySeam(end.body.seamToken, { childId: CHILD, lessonId: LES });
    assert.ok(seam, "a level_end row");
    assert.doesNotMatch(JSON.stringify(seam), about, "the level_end row says nothing about the vertex");
    assert.doesNotMatch(playFactsRow(end.body.grade.facts), about);
    // the repeat: the next level (other letters) and the same first-letter tap: named, in the rows and the trail
    let sid = end.body.sessionId;
    const first = lv;
    for (let k = 0; k < 6; k++) {
      const nx = res();
      await routes["POST /api/play/next"]({}, nx, { sessionId: sid, door: "garam" });
      assert.equal(nx.statusCode, 200);
      lv = nx.body.level; sid = nx.body.sessionId;
      if (lv.params.goal === "find" && konLogic.malActs(lv, "vertex-name") && lv.params.lets !== first.params.lets) break;
    }
    const again = res();
    await routes["POST /api/play/act"]({}, again, { sessionId: sid, levelId: lv.levelId, acts: env(konLogic.malActs(lv, "vertex-name")), final: true });
    const ev2 = verifyEvidence(again.body.evidenceToken, { childId: CHILD, lessonId: LES });
    // dc-r8-game-gate-play-then-evidence: kon/name runs with naming off until gate 2, so even the repeat names nothing.
    // With naming on, a second sighting names nothing either (gate 2 per session: the third, within the session's first
    // four levels; tests/r8-games-kon-name-gate2.test.mjs plays that rule)
    if (namingOn("kon", "name")) {
      assert.equal(ev2.rows[0].misconceptionId, undefined, "a second sighting names nothing (three are needed)");
      assert.deepEqual(ev2.trail.mal, [], "nor is it in the trail");
    } else {
      assert.equal(ev2.rows[0].misconceptionId, undefined, "naming off: not named even on the repeat");
      assert.deepEqual(ev2.trail.mal, [], "nor in the trail");
    }
  } finally { Object.assign(playDeps, saved); }
});

test("law 3 (central): a find first-letter pick is named only when it repeats on levels with other letters (gate 2 per session: the third)", async () => {
  const { nameOnRepeat, surfaceOf, surfacesDiffer } = await import("../server/play/levels.js");
  const ls = levels("find").filter((l) => konLogic.malActs(l, "vertex-name"));
  const apart = (x, y) => surfacesDiffer(surfaceOf(x), surfaceOf(y));
  const a = ls[0], b = ls.find((l) => apart(l, a)), c = ls.find((l) => apart(l, a) && apart(l, b)), same = { ...a, params: { ...a.params, ask: a.params.ask } };
  assert.ok(b && c);
  const rows = (l) => konLogic.grade(l, env(konLogic.malActs(l, "vertex-name")), { final: true }).evidence;
  const s1 = { chance: [{ mis: "k-vn", surface: surfaceOf(a) }] }, s2 = { chance: [...s1.chance, { mis: "k-vn", surface: surfaceOf(b) }] };
  assert.equal(nameOnRepeat(rows(b), s1, b)[0].misconceptionId, undefined, "the second: not named");
  assert.equal(nameOnRepeat(rows(c), s2, c)[0].misconceptionId, "k-vn", "the third, other figures and letters: named");
  assert.equal(nameOnRepeat(rows(same), s2, same)[0].misconceptionId, undefined, "the same letters: not named");
});

test("night ruling kon/name 1: no two angles of a figure are within 8° of each other in size, and its three rays differ in length (every generated level, both goals; the checker's own geometry)", () => {
  let n = 0;
  for (const goal of ["say", "find"]) for (const level of levels(goal, [1, 2, 3], [1, 7, 42, 99, 123, 2026])) {
    const p = level.params, P = points(p);
    // the five angles the figure draws, from its segments alone (drawnAngles), sized by plain geometry
    const sizes = drawnAngles(p).map((d) => { const [a, b] = [...d.set]; return ang(P, a, d.v, b); });
    assert.equal(sizes.length, 5);
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) assert.ok(Math.abs(sizes[i] - sizes[j]) >= 8, `${level.levelId}: angles ${sizes[i].toFixed(1)}° and ${sizes[j].toFixed(1)}°`);
    // the joined pair's triangle is not isosceles: its two rays from the vertex differ (and the third ray is its own length)
    const L = [1, 2, 3].map((i) => Math.hypot(P[i][0] - P[0][0], P[i][1] - P[0][1]));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(Math.abs(L[i] - L[j]) >= 10, `${level.levelId}: rays ${L[i].toFixed(0)} and ${L[j].toFixed(0)}`);
    // so find's "≠" row is true either way: her arc's angle is a different size from the asked one
    if (goal === "find") for (let k = 0; k < 5; k++) if (k !== p.ask) {
      const c = corners(p)[k], w = corners(p)[p.ask];
      assert.ok(Math.abs(ang(P, c.a, c.v, c.b) - ang(P, w.a, w.v, w.b)) >= 8);
    }
    n++;
  }
  assert.ok(n >= 150, `${n} levels`);
});

test("night ruling kon/name 2: find keys are spread evenly over all five arcs (the wide one included), over the generator and as served; no rule that ignores the name beats 1 in 5", () => {
  // the generator, over many seeds, fades and first / later levels: the key arc per request (every candidate a request
  // offers has the same key, so the picker cannot tilt it)
  const by = [0, 0, 0, 0, 0], role = { inside: 0, outside: 0, wide: 0, corner: 0 };
  let reqs = 0, empty = 0;
  for (let seed = 1; seed <= 400; seed++) for (const fade of [1, 2, 3]) {
    let r = seed * 2654435761 % 4294967296 + fade;
    const rnd = () => ((r = (r * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const out = generateName("find", rnd, fade, seed % 2 === 0);
    reqs++;
    if (!out.length) { empty++; continue; }
    assert.equal(new Set(out.map((o) => o.params.ask)).size, 1, "one key arc per request");
    assert.equal(new Set(out.map((o) => o.params.tri)).size, 1, "one joined pair per request");
    const p = out[0].params, [x, y] = TRI_PAIRS[p.tri];
    by[p.ask]++;
    role[p.ask === WIDE ? "wide" : p.ask >= 3 ? "corner" : corners(p)[p.ask].a === x && corners(p)[p.ask].b === y ? "inside" : "outside"]++;
  }
  const n = reqs - empty;
  assert.ok(empty <= reqs * 0.01, `${empty} of ${reqs} requests made no level`);
  // each arc 1 time in 5 (within 3 points of 20 % over 1200 requests: about 2.7 standard deviations)
  for (let k = 0; k < 5; k++) assert.ok(Math.abs(by[k] / n - 0.2) <= 0.03, `arc ${k}: ${by[k]} of ${n} (${by.join(", ")})`);
  // by role: the angle at the vertex inside the triangle, the one outside it, the wide one, each 1 in 5; the corners 2 in 5
  for (const k of ["inside", "outside", "wide"]) assert.ok(Math.abs(role[k] / n - 0.2) <= 0.03, `${k}: ${JSON.stringify(role)}`);
  assert.ok(Math.abs(role.corner / n - 0.4) <= 0.04, JSON.stringify(role));

  // as served (the picker on each request): the same spread, and a first tap by any rule that does not read the name wins
  // about 1 time in 5: a corner (the two small arcs), an arc inside the triangle, the widest (each picked at random within
  // its set: the chance of a win is the share of the set that is the key). By size rank the floor is higher: an asked angle
  // at the vertex is under 65° (so reading across never finds it) and the wide one is always the largest, so no key but a
  // corner over 75° can be the second largest; "the smallest angle" then wins about 1 in 4 at best (4/15 with the second
  // largest never the key). Measured here and stated in the judges' packet
  const served = [0, 0, 0, 0, 0], rule = { smallest: 0, widest: 0, small3: 0, inside: 0, corner: 0 };
  let m = 0;
  for (let k = 0; k < 300; k++) {
    const lv = pickLevels(konLogic, req("find", 9000 + k, 1 + (k % 3)))?.garam;
    assert.ok(lv, `request ${k} served nothing`);
    const p = lv.params, P = points(p), C = corners(p), sz = C.map((c) => ang(P, c.a, c.v, c.b)), order = sz.map((_, i) => i).sort((a, b) => sz[a] - sz[b]);
    const [x, y] = TRI_PAIRS[p.tri], ins = C.map((c, i) => i >= 3 || (c.a === x && c.b === y));
    served[p.ask]++; m++;
    rule.smallest += order[0] === p.ask ? 1 : 0;
    rule.widest += order[4] === p.ask ? 1 : 0;
    rule.small3 += order.slice(0, 3).includes(p.ask) ? 1 / 3 : 0;
    rule.inside += ins[p.ask] ? 1 / ins.filter(Boolean).length : 0;
    rule.corner += p.ask >= 3 ? 1 / 2 : 0;
  }
  for (let k = 0; k < 5; k++) assert.ok(Math.abs(served[k] / m - 0.2) <= 0.05, `served arc ${k}: ${served.join(", ")}`);
  if (process.env.DBG) console.log(JSON.stringify(Object.fromEntries(Object.entries(rule).map(([k, v]) => [k, +(v / m).toFixed(3)]))), served.join(","));
  for (const k of ["corner", "inside", "widest"]) assert.ok(rule[k] / m <= 0.24, `"${k}" wins ${(rule[k] / m).toFixed(3)} of first taps`);
  for (const k of ["smallest", "small3"]) assert.ok(rule[k] / m <= 0.3, `"${k}" wins ${(rule[k] / m).toFixed(3)} of first taps`);
  // and the first tap is weighted at chance (1 in 5 among five arcs; find is a one-decision goal)
  assert.ok(konLogic.oneDecision.includes("find"));
});
