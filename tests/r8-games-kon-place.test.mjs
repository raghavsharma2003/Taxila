// r8 Games (docs/design/round8/games-engine-needs.md §1): kon/place, c6-maths-ch02-t03. The child places a loose protractor
// (move, spin, lock), then measures ∠AOB, draws ∠AOB = θ on OA, or says which of two angles under a big and a small
// protractor is more. Proof suite: every generated level validates, is solved by its solver, is shortcut-free; an INDEPENDENT
// checker (its own coordinate geometry, none of the law's helpers) agrees with every solve; each mapped mal-rule lands on its
// own misconception with its own visible signature; main's condition (a misplaced protractor read "correctly" is vertex-off,
// never right) is pinned; random acts never solve a level the checker refuses; evidence and the facts row carry the
// placement; the coverage entries serve; the generator's speed bar is CPU time (tests/_cpu-ms.mjs), never the wall clock.
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { konLogic } from "../src/play/families/kon/kon.logic.ts";
import { BW, BH, PR, PD, ARM, TOL_PX, PRINT_EVERY, SIZE_PRINT_EVERY, asPlaced, centreRingShown, placeEvidence, vertexOffPose, goodPose, placement, sizeFigs, markFor, joinAFirst } from "../src/play/families/kon/kon.place.ts";
import { pickLevels, env, proveLevel } from "../src/play/core/pick.ts";
import { CHANCE_WEIGHT, GAME_WEIGHT, playFactsRow } from "../shared/play.ts";
import { gradeActs } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { seamLead } from "../server/play/routes.js";
import WORDS from "../data/play/engine-words.json" with { type: "json" };
const word = (lang, key, vars = {}) => (WORDS.words[key]?.[lang] ?? "").replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
import coverage from "../data/play/coverage.json" with { type: "json" };
import { cpuNow } from "./_cpu-ms.mjs";

const MIS = {
  measure: { "wrong-scale": "k-ws", "vertex-off": "k-vo" },
  // join-wrong-end is graded at chance weight (judging round 2, law 3: a pick between two buttons): konLogic.chancePicks
  draw: { "wrong-scale": "k-ws", "vertex-off": "k-vo", "join-wrong-end": "k-je" },
  // size names no mix-up (main 2026-11-11): the kit's tool-size belief is about one angle's READING under two tools
  size: {},
};
const SHOWN = { "vertex-off": "centre_off", "wrong-scale": "other_scale", "join-wrong-end": "far_end" };
const req = (goal, seed, fade = 1, misMap = MIS[goal]) => ({ family: "kon", mode: "place", goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade, mis: {}, misMap, grammar: { tol: 3, tolPx: TOL_PX }, recent: [], seed });
const run = (level, acts) => { let s = konLogic.init(level); const ms = []; const refused = []; acts.forEach((a, i) => { const r = konLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const levels = (goal, fades = [1, 2, 3], seeds = [1, 7, 42, 99]) => fades.flatMap((f) => seeds.flatMap((sd) => konLogic.generate(req(goal, sd, f)).map((c) => konLogic.validate(c.level))));

// ── the independent checker: plain coordinates (y up), no law code
const RAD = (d) => (d * Math.PI) / 180;
const DEG = (r) => (r * 180) / Math.PI;
const unit = (d) => [Math.cos(RAD(d)), Math.sin(RAD(d))];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
/** the unsigned angle between two directions, 0 … 180 */
const between = (a, b) => DEG(Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (Math.hypot(...a) * Math.hypot(...b))))));
/** the figure: O, the arms as unit vectors */
function figure(p) {
  const O = [p.vx, p.vy], a = unit(p.start);
  if (p.goal !== "measure") return { O, arms: [a] };
  return { O, arms: [a, unit(p.start + (p.mirror ? -p.theta : p.theta))] };
}
/** a protractor at centre C turned to rot: its base direction, its half-disc normal; is it on the angle? */
function indepPlaced(p, pose) {
  const { O, arms } = figure(p), base = unit(pose.rot), n = unit(pose.rot + 90);
  const centreOk = Math.hypot(pose.x - O[0], pose.y - O[1]) <= p.tolPx;
  // the base LINE against an arm: the smaller of the two angles the line makes with it
  const on = arms.map((a, k) => ({ k, off: Math.min(between(base, a), 180 - between(base, a)) })).filter((x) => x.off <= 3 + 1e-9);
  // measure: the other arm must point into the half-disc (positive along the normal)
  const ok = on.some(({ k }) => arms.length === 1 || dot(arms[1 - k], n) > Math.sin(RAD(2)) - 1e-9);
  return centreOk && ok;
}
/** where OB crosses a protractor's rim, read on the scale whose 0 is on OA: the angle at C from the base end lying on OA */
function indepReading(p, pose) {
  const { O, arms } = figure(p), u = arms[1], C = [pose.x, pose.y];
  const d = [O[0] - C[0], O[1] - C[1]], b = dot(d, u), c = dot(d, d) - PR * PR, disc = b * b - c;
  if (disc < 0) return null;
  const t = -b + Math.sqrt(disc), X = [O[0] + t * u[0], O[1] + t * u[1]];
  // the base end on OA's side: the base direction (or its opposite) nearer OA
  const base = unit(pose.rot), end = dot(base, arms[0]) >= 0 ? base : [-base[0], -base[1]];
  return between(end, [X[0] - C[0], X[1] - C[1]]);
}
/** draw: the angle at O between OA and the drawn arm (joined at O) */
function indepMade(p, pose, mark) {
  const { O, arms } = figure(p), D = [pose.x + PR * Math.cos(RAD(pose.rot + mark)), pose.y + PR * Math.sin(RAD(pose.rot + mark))];
  return between(arms[0], [D[0] - O[0], D[1] - O[1]]);
}
/** the last pose / read / mark the acts left (replayed by hand: undo pops one) */
function lastState(level, acts) {
  const stack = [{ pose: { x: level.params.x0, y: level.params.y0, rot: level.params.r0 }, locked: false, mark: null }];
  for (const a of acts) {
    const top = stack[stack.length - 1];
    if (a.kind === "undo") { if (stack.length > 1) stack.pop(); continue; }
    if (a.kind === "move" && !top.locked) stack.push({ ...top, pose: { ...top.pose, x: Math.round(a.x * 2) / 2, y: Math.round(a.y * 2) / 2 } });
    if (a.kind === "spin" && !top.locked) stack.push({ ...top, pose: { ...top.pose, rot: ((Math.round(a.deg) % 360) + 360) % 360 } });
    if (a.kind === "lock" && !top.locked) stack.push({ ...top, locked: true, mark: null });
    if (a.kind === "free" && top.locked) stack.push({ ...top, locked: false, mark: null });
    if (a.kind === "mark" && top.locked && Number.isInteger(a.r) && a.r >= 0 && a.r <= 180) stack.push({ ...top, mark: a.r });
    // a read / join that the law takes is a step undo can take back too
    if (a.kind === "read" && top.locked && Number.isInteger(a.n) && a.n >= 0 && a.n <= 180) stack.push({ ...top });
    if (a.kind === "join" && top.locked && top.mark !== null && (a.end === "v" || a.end === "e")) stack.push({ ...top });
  }
  return stack[stack.length - 1];
}

for (const goal of ["measure", "draw", "size"]) {
  test(`kon/place/${goal}: every generated level validates, solves, is shortcut-free; the independent checker agrees; each mal-rule shows its own signature`, () => {
    let n = 0; const mals = {}, sigs = {};
    for (const level of levels(goal)) {
      assert.ok(level, "validates");
      assert.equal(level.mode, "place");
      n++;
      const sol = konLogic.solve(level), r = run(level, sol);
      assert.ok(r.s.done && r.ms.some((m) => m.kind === "solved"), `${level.levelId} solves`);
      assert.equal(konLogic.shortcut(level), null, `${level.levelId} has a shortcut`);
      if (goal === "size") {
        const want = level.params.thA === level.params.thB ? "same" : level.params.thA > level.params.thB ? "a" : "b";
        assert.equal(sol[0].which, want);
      } else {
        const last = lastState(level, sol);
        assert.ok(indepPlaced(level.params, last.pose), `${level.levelId}: the checker says the solver's protractor is off`);
        if (goal === "measure") assert.ok(Math.abs(indepReading(level.params, last.pose) - sol.at(-1).n) <= 2, `${level.levelId}: reading`);
        else assert.ok(Math.abs(indepMade(level.params, last.pose, last.mark) - level.params.theta) <= 3, `${level.levelId}: made`);
      }
      // a chosen-at-random first tap on a one-pick goal enters at the chance weight; the others at the game weight
      assert.equal(konLogic.grade(level, env(sol)).evidence[0].weight, goal === "size" ? CHANCE_WEIGHT : GAME_WEIGHT);
      for (const mal of Object.keys(MIS[goal])) {
        const acts = konLogic.malActs(level, mal);
        if (!acts) continue;
        mals[mal] = (mals[mal] ?? 0) + 1;
        const m = run(level, acts);
        assert.ok(!m.s.done, `${level.levelId} ${mal} must not solve`);
        const named = m.ms.filter((x) => x.kind === "misconception_consequence");
        assert.equal(named.length, 1, `${level.levelId} ${mal}`);
        assert.equal(named[0].misconceptionId, mal);
        assert.equal(named[0].facts.shown, SHOWN[mal], `${mal} signature`);
        (sigs[mal] ??= new Set()).add(named[0].facts.shown);
        const g = konLogic.grade(level, env(acts), { final: true });
        // (gate 2, law 3 read per session: every kon/place mix-up is kept at chance weight as chanceMis from one level and
        // named by the server on a repeat: tests/r8-games-kon-place-gate2.test.mjs)
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, undefined);
        assert.equal(g.evidence[0].chanceMis, MIS[goal][mal]); assert.equal(g.evidence[0].weight, CHANCE_WEIGHT);
        if (goal !== "size") {
          const last = lastState(level, acts);
          assert.equal(indepPlaced(level.params, last.pose), mal !== "vertex-off", `${mal}: the checker's placement`);
        }
      }
    }
    assert.ok(n >= 20, `only ${n} levels`);
    for (const mal of Object.keys(MIS[goal])) assert.ok(mals[mal] > 0, `${mal} never applied`);
    // every mapped mal-rule's signature is its own
    const all = Object.values(sigs).map((s) => [...s].join());
    assert.equal(new Set(all).size, all.length);
  });
}

test("main's condition: a misplaced protractor read CORRECTLY (the number it shows as placed) is vertex-off, never right", () => {
  let checked = 0;
  for (const goal of ["measure", "draw"]) for (const level of levels(goal)) {
    const p = level.params, vo = vertexOffPose(p);
    // the bottom edge on O: the centre is PD from the vertex, along the half-disc's normal
    assert.ok(Math.abs(Math.hypot(vo.x - p.vx, vo.y - p.vy) - PD) < 0.6, `${level.levelId} depth`);
    assert.equal(placement(p, vo).ok, false);
    const head = [{ kind: "move", x: vo.x, y: vo.y }, { kind: "spin", deg: vo.rot }, { kind: "lock" }];
    let acts;
    if (goal === "measure") {
      // what the misplaced protractor shows, worked out by the independent checker, read exactly
      const shows = Math.round(indepReading(p, vo));
      assert.ok(Math.abs(shows - Math.round(asPlaced(p, vo).value)) <= 1, `${level.levelId}: the law's as-placed reading`);
      assert.ok(Math.abs(shows - p.theta) >= 3, `${level.levelId}: the misplaced reading must differ visibly`);
      acts = [...head, { kind: "read", n: shows }];
    } else acts = [...head, { kind: "mark", r: p.theta }, { kind: "join", end: "v" }];
    const r = run(level, acts);
    assert.ok(!r.s.done, `${level.levelId}: a misplaced protractor solved`);
    const last = r.ms.at(-1);
    assert.equal(last.kind, "misconception_consequence");
    assert.equal(last.misconceptionId, "vertex-off");
    assert.equal(last.facts.placed, "off");
    const g = konLogic.grade(level, env(acts), { final: true });
    assert.equal(g.verdict, "not_yet");
    assert.equal(g.evidence[0].outcome, "incorrect");
    // (gate 2 per session: a pick from one level, named by the server on a second)
    assert.equal(g.evidence[0].misconceptionId, undefined); assert.equal(g.evidence[0].chanceMis, "k-vo");
    // and with vertex-off NOT mapped, the same acts are still not right (a refusal, no belief named)
    const bare = { ...level, mal: {} };
    const rb = run(bare, acts);
    assert.ok(!rb.s.done);
    assert.equal(konLogic.grade(bare, env(acts), { final: true }).evidence[0].outcome, "incorrect");
    // the same reading off a protractor placed right IS graded right only when it is what the scale shows there
    checked++;
  }
  assert.ok(checked >= 40, `${checked} levels`);
});

test("kon/place: ≥ 3000 random acts; a solve is always a placement the checker accepts and a reading / mark it agrees with; the law never throws", () => {
  let seed = 23, acts = 0, solved = 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
  for (const goal of ["measure", "draw"]) for (const level of levels(goal, [1, 2], [3, 5, 8]).slice(0, 30)) {
    const sol = konLogic.solve(level), p = level.params;
    for (let rep = 0; rep < 4; rep++) {
      const list = [];
      let s = konLogic.init(level);
      for (let i = 0; i < 30 && !s.done; i++) {
        const r = rnd();
        // near the solution half the time (an off-by-a-few placement or reading), anywhere otherwise
        const near = rnd() < 0.5;
        const a = r < 0.25 ? { kind: "move", x: near ? p.vx + (rnd() - 0.5) * 30 : rnd() * BW, y: near ? p.vy + (rnd() - 0.5) * 30 : rnd() * BH }
          : r < 0.45 ? { kind: "spin", deg: near ? sol[1].deg + Math.round((rnd() - 0.5) * 12) + (rnd() < 0.2 ? 180 : 0) : rnd() * 360 }
          : r < 0.55 ? { kind: "lock" } : r < 0.6 ? { kind: "free" } : r < 0.65 ? { kind: "undo" }
          : goal === "measure" ? (r < 0.85 ? { kind: "read", n: near ? p.theta + Math.round((rnd() - 0.5) * 10) : Math.floor(rnd() * 181), ...(rnd() < 0.2 ? { correct: true } : {}) } : sol[Math.floor(rnd() * sol.length)])
          : r < 0.8 ? { kind: "mark", r: near ? p.theta + Math.round((rnd() - 0.5) * 10) : Math.floor(rnd() * 181) } : r < 0.92 ? { kind: "join", end: rnd() < 0.7 ? "v" : "e" } : sol[Math.floor(rnd() * sol.length)];
        list.push(a);
        s = konLogic.apply(level, s, a, i + 1).state;
        acts++;
      }
      if (!konLogic.goalMet(level, s)) continue;
      solved++;
      // the loop stops at the solving act, so the acts so far leave the protractor where it was when she solved
      const last = lastState(level, list);
      assert.ok(indepPlaced(p, last.pose), `${level.levelId}: solved with the protractor off (${JSON.stringify(last.pose)})`);
    }
  }
  assert.ok(acts >= 3000, `only ${acts} acts`);
  assert.ok(solved > 0, "the battery never solved a level");
});

test("kon/place: acts out of turn are refused; the protractor is frozen while locked; tampered params are refused", () => {
  const level = levels("measure", [1], [5])[0];
  let s = konLogic.init(level);
  assert.equal(konLogic.apply(level, s, { kind: "read", n: 40 }, 1).refused, "lock_first");
  assert.equal(konLogic.apply(level, s, { kind: "free" }, 1).refused, "not_locked");
  assert.equal(konLogic.apply(level, s, { kind: "move", x: 9999, y: 1 }, 1).refused, "bad_move");
  assert.equal(konLogic.apply(level, s, { kind: "mark", r: 10 }, 1).refused, "unknown_act");
  s = konLogic.apply(level, s, { kind: "lock" }, 1).state;
  assert.equal(konLogic.apply(level, s, { kind: "move", x: 10, y: 10 }, 2).refused, "locked");
  assert.equal(konLogic.apply(level, s, { kind: "spin", deg: 10 }, 2).refused, "locked");
  assert.equal(konLogic.apply(level, s, { kind: "read", n: 200 }, 2).refused, "bad_read");
  // the 1° snap is the law's: a spin to 10.4° is 10°
  const s2 = konLogic.apply(level, konLogic.init(level), { kind: "spin", deg: 10.4 }, 1).state;
  assert.equal(s2.pl.pose.rot, 10);
  const dl = levels("draw", [1], [5])[0];
  let d = konLogic.apply(dl, konLogic.init(dl), { kind: "lock" }, 1).state;
  assert.equal(konLogic.apply(dl, d, { kind: "join", end: "v" }, 2).refused, "mark_first");
  d = konLogic.apply(dl, d, { kind: "mark", r: 40 }, 2).state;
  assert.equal(konLogic.apply(dl, d, { kind: "join", end: "x" }, 3).refused, "bad_join");
  const base = { v: "play@1", levelId: "x", family: "kon", mode: "place", topicId: "t", skillId: "t-s1", fade: 1, targets: [], mal: {}, slip: null, seed: 1 };
  for (const params of [
    { goal: "measure", start: 0, theta: 200, vx: 150, vy: 200, tolPx: 8, x0: 150, y0: 34, r0: 0, tol: 3 },
    { goal: "measure", start: 0, theta: 40, vx: 150, vy: 200, tolPx: 12, x0: 150, y0: 34, r0: 0, tol: 3 },   // tolPx ≥ PD / 2: vertex-off would pass
    { goal: "draw", start: 0, theta: 40.5, vx: 150, vy: 200, tolPx: 8, x0: 150, y0: 34, r0: 0, tol: 3 },
    { goal: "draw", start: 0, theta: 40, vx: 900, vy: 200, tolPx: 8, x0: 150, y0: 34, r0: 0, tol: 3 },
    { goal: "size", start: 0, thA: 40, thB: 400, tol: 3 },
  ]) assert.equal(konLogic.validate({ ...base, goal: params.goal, params }), null, JSON.stringify(params));
});

test("kon/place/size: neither the bigger tool, nor 'always the same', nor 'always the smaller tool' passes every served level", () => {
  const ls = levels("size");
  const big = (p) => (p.bigA ? "a" : "b"), small = (p) => (p.bigA ? "b" : "a");
  const pass = (pick) => ls.every((l) => run(l, [{ kind: "pick", which: pick(l.params) }]).s.done);
  assert.equal(pass(big), false); assert.equal(pass(() => "same"), false); assert.equal(pass(small), false);
  // judging round 2: any of the three answers can be the key, and the bigger tool's angle can be the bigger one
  const keys = ls.map((l) => konLogic.solve(l)[0].which);
  for (const k of ["a", "b", "same"]) assert.ok(keys.filter((x) => x === k).length >= ls.length / 6, `key ${k}: ${keys.filter((x) => x === k).length} of ${ls.length}`);
  assert.ok(ls.some((l) => run(l, [{ kind: "pick", which: big(l.params) }]).s.done && konLogic.solve(l)[0].which !== "same"), "the bigger tool's angle is sometimes the answer");
  // the figures: two protractors, one big, one small, both on the board
  for (const l of ls) {
    const f = sizeFigs(l.params);
    assert.notEqual(f[0].rad, f[1].rad);
    for (const x of f) assert.ok(x.v[1] + x.rad + 18 <= BH && x.v[0] - x.rad - 18 >= 0, l.levelId);
  }
});

test("kon/place evidence: the placement at her first decision and her reading ride the grade's facts, and the facts row says placed=ok|off", () => {
  const level = levels("measure", [1], [7])[0], p = level.params;
  // a slightly-off but acceptable placement (centre 5 px off, base 2° off) read as it shows
  const g0 = goodPose(p), pose = { x: g0.x + 3, y: g0.y + 4, rot: g0.rot + 2 };
  const shows = Math.round(asPlaced(p, pose).value);
  const acts = [{ kind: "move", ...pose }, { kind: "spin", deg: pose.rot }, { kind: "lock" }, { kind: "read", n: shows }];
  const r = run(level, acts);
  assert.ok(r.s.done, "read as placed, within tolerance, is right");
  const ev = placeEvidence(r.s.pl);
  assert.deepEqual(ev, { placed: { centreErrPx: 5, baseErrDeg: 2, ok: true }, read: shows });
  const g = gradeActs(level, env(acts), { final: true });
  assert.equal(g.grade.facts.placed, "ok"); assert.equal(g.grade.facts.read, shows); assert.equal(g.grade.facts.centre_px, 5); assert.equal(g.grade.facts.base_deg, 2);
  // the server's facts row for the lesson: the lead carries placed=
  const seam = { facts: { ...g.grade.facts, verdict: g.grade.verdict } };
  const row = playFactsRow({ game: "kon/place", ...seamLead(seam, g.trail, {}, null), ...seam.facts });
  assert.match(row, /(^| )placed=ok( |$)/);
  // vertex-off: placed=off, and the first decision's placement stays the evidence after she fixes it and solves
  const vo = vertexOffPose(p);
  const wrong = [{ kind: "move", x: vo.x, y: vo.y }, { kind: "spin", deg: vo.rot }, { kind: "lock" }, { kind: "read", n: Math.round(asPlaced(p, vo).value) }];
  const fixed = [...wrong, { kind: "free" }, ...konLogic.solve(level)];
  const gw = gradeActs(level, env(fixed), { final: true });
  assert.equal(gw.grade.verdict, "solved");
  assert.equal(gw.grade.evidence[0].chanceMis, "k-vo", "her first decision's placement stays the evidence (a pick: gate 2)");
  assert.equal(gw.grade.facts.placed, "off");
  const rowW = playFactsRow({ game: "kon/place", ...seamLead({ facts: { ...gw.grade.facts, verdict: "solved" } }, gw.trail, {}, null), verdict: "solved", ...gw.grade.facts });
  assert.match(rowW, /(^| )placed=off( |$)/);
  // (one level's pick is not in the trail; the server adds it when a second level names it)
  assert.equal(gw.trail.firstTry, false); assert.deepEqual(gw.trail.mal, []);
});

test("kon/place: the reading she measures is never said first; draw and size give nothing away; no goal line states the answer or the rule", () => {
  const m = levels("measure", [1], [3])[0];
  assert.deepEqual(hiddenOf(m), [m.params.theta]);
  assert.deepEqual(hiddenOf(levels("draw", [1], [3])[0]), []);
  for (const lang of ["hinglish", "en", "hi"]) {
    const lines = [word(lang, "kon.goal.measure"), word(lang, "kon.goal.draw", { a: "40°" }), word(lang, "kon.goal.size"), word(lang, "kon.lock"), word(lang, "kon.free"), word(lang, "kon.this"), word(lang, "kon.join", { p: "O" }), word(lang, "kon.same")];
    for (const l of lines) {
      assert.ok(l.length > 0, lang);
      // never where to put it (centre, vertex, base, corner, line up) and never a number word: numbers are digits ("do" in "Rakh do" is the verb)
      assert.doesNotMatch(l, /centre|center|vertex|kendra|केंद्र|शीर्ष|base|aadhar|आधार|corner|kona par|line up|\b(one|two|ten|forty|ek|teen|das)\b/i, `${lang}: ${l}`);
    }
    if (lang === "hi") for (const l of lines) assert.match(l, /[ऀ-ॿ]|^∠/, l);
  }
});

test("kon/place: every coverage entry serves a level as the play server would, with its kit misconceptions mapped", async () => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  const mine = coverage.entries.filter((e) => e.family === "kon" && e.mode === "place");
  assert.deepEqual(mine.map((e) => e.goal).sort(), ["draw", "measure", "size"]);
  assert.equal(coverage.entries.some((e) => e.family === "kon" && e.mode === "set"), false, "kon/set's entry is replaced");
  const want = { draw: ["vertex-off", "wrong-scale", "join-wrong-end"], measure: ["vertex-off", "wrong-scale"], size: [] };
  for (const entry of mine) {
    assert.equal(entry.topicId, "c6-maths-ch02-t03");
    assert.deepEqual(Object.keys(entry.misMap).sort(), want[entry.goal].sort());
    for (const [mal, id] of Object.entries(entry.misMap)) assert.equal(id, `c6-maths-ch02-t03-m-${mal}`);
    for (let n = 0; n < 4; n++) {
      const key = entryKey(entry);
      const s = { childId: `t-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
        mis: {}, pL: undefined, n: 0, seed: seedOf(`t-${n}`, key, 0), door: "garam", recent: [], hist: null };
      const lv = currentLevel(s, entry);
      assert.ok(lv, `${entry.goal} served nothing`);
      assert.equal(lv.mode, "place"); assert.equal(lv.params.goal, entry.goal);
      if (entry.goal !== "size") assert.ok(lv.proof.discriminates.length >= 1, `${lv.levelId} tells a belief apart`);
    }
  }
});

test("kon/place: the picker's work per level is within its bar (p95 ≤ 50 ms of CPU time, not the wall clock)", () => {
  const cpu = [];
  for (const goal of ["measure", "draw", "size"]) for (let k = 0; k < 15; k++) {
    const t0 = cpuNow();
    const r = pickLevels(konLogic, req(goal, 500 + k, 1 + (k % 3)));
    cpu.push(cpuNow() - t0);
    assert.ok(r?.garam, `${goal} ${k}`);
  }
  cpu.sort((a, b) => a - b);
  const p95 = cpu[Math.floor(cpu.length * 0.95)];
  assert.ok(p95 <= 50, `p95 ${p95.toFixed(1)} ms CPU`);
});

test("kon/place board: the protractor is ≥ 200 px wide at a 360 px phone's play box (1 board px ≥ 1 CSS px)", () => {
  // the p360 play box the stage contract gives (forge3 certs/box-contract.json) holds the board at ≥ 1 px per board px
  assert.ok(2 * PR >= 200);
  assert.ok(BW <= 320, `board ${BW} wide`);
  assert.ok(ARM > PR + PD, "the arms reach past the rim so a reading can be taken");
});

test("kon/place (main 2026-11-11): no key sits on a printed number at fades 1 and 2, and the scale settings print differently", () => {
  // what each fade prints: "10" every 20°, "30" every 30°, "landmarks" 0 / 90 / 180 (both scales: 180 − a printed value is printed)
  assert.deepEqual(PRINT_EVERY, { "10": 20, "30": 30, landmarks: 90 });
  assert.equal(new Set(Object.values(PRINT_EVERY)).size, 3, "every scale setting looks different on screen");
  let n = 0;
  for (const goal of ["measure", "draw", "size"]) for (const level of levels(goal, [1, 2, 3], [1, 7, 42, 99, 123])) {
    const p = level.params, every = (goal === "size" ? SIZE_PRINT_EVERY : PRINT_EVERY)[p.scale];
    assert.equal(p.scale, level.fade === 1 ? "10" : level.fade === 2 ? "30" : "landmarks");
    const keys = goal === "size" ? [p.thA, p.thB] : [p.theta];
    for (const k of keys) { assert.notEqual(k % every, 0, `${level.levelId}: key ${k}° is printed (every ${every}°)`); assert.notEqual((180 - k) % every, 0); }
    n++;
  }
  assert.ok(n >= 60, `${n} levels`);
});

test("kon/place: tool-size is not claimed by size; a wrong pick plays out her own pick (never the readings) with no belief named", () => {
  for (const level of levels("size", [1, 2], [1, 7])) {
    assert.equal(konLogic.malActs({ ...level, mal: { "tool-size": "k-ts" } }, "tool-size"), null);
    for (const wrong of ["a", "b", "same"].filter((w) => !run(level, [{ kind: "pick", which: w }]).s.done)) {
      const m = run({ ...level, mal: { "tool-size": "k-ts" } }, [{ kind: "pick", which: wrong }]).ms.at(-1);
      assert.equal(m.kind, "law_refused"); assert.equal(m.facts.shown, "her_pick"); assert.equal(m.misconceptionId, undefined);
    }
  }
  // both protractors print the same numbers at a fade (the view reads one setting for both)
  assert.deepEqual(SIZE_PRINT_EVERY, { "10": 30, "30": 30, landmarks: 90 });
  const src = readFileSync(new URL("../src/play/families/kon/kon.place.view.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /rad0 >= 90 \|\| a % 60/, "the small protractor prints fewer numbers");
});

test("judging round 2 (law 3): join-wrong-end is graded at chance weight, never a named mix-up from one join; wrong-scale is told apart only where the outer scale is the wrong one", () => {
  let joins = 0, mirror = 0, flat = 0;
  for (const level of levels("draw", [1, 2, 3])) {
    const acts = konLogic.malActs({ ...level, mal: { ...level.mal, "join-wrong-end": "k-je" } }, "join-wrong-end");
    if (acts) {
      joins++;
      const r = run({ ...level, mal: { ...level.mal, "join-wrong-end": "k-je" } }, acts), m = r.ms.at(-1);
      assert.equal(m.kind, "misconception_consequence"); assert.equal(m.misconceptionId, "join-wrong-end"); assert.equal(m.facts.sign, undefined, "gate 2: no sign fact from one press"); assert.equal(m.facts.shown, "far_end");
      const g = konLogic.grade({ ...level, mal: { ...level.mal, "join-wrong-end": "k-je" } }, env(acts), { final: true });
      assert.equal(g.evidence[0].misconceptionId, undefined, "nothing on her record from one join");
      assert.equal(g.evidence[0].chanceMis, "k-je"); assert.equal(g.evidence[0].weight, CHANCE_WEIGHT);
      // a wrong dot joined to A is no sign
      const p = level.params, g0 = goodPose(p), off = run(level, [...acts.slice(0, 3), { kind: "mark", r: markFor(p, g0, (p.theta + 30) % 180) }, { kind: "join", end: "e" }]).ms.at(-1);
      assert.equal(off.facts.sign, undefined);
    }
  }
  for (const goal of ["measure", "draw"]) for (const level0 of levels(goal, [1, 2, 3])) {
    const level = { ...level0, proof: { ...level0.proof, ...proveLevel(konLogic, level0) } }, ws = konLogic.malActs(level, "wrong-scale");
    if (level.params.mirror) { mirror++; if (ws) assert.equal(konLogic.grade(level, env(konLogic.solve(level))).evidence[0].discriminates, "k-ws", `${level.levelId}: a first-try solve is scale evidence where the outer scale is wrong`); }
    else { flat++; assert.equal(ws, null, `${level.levelId}: the outer scale is right here, so the scale is not told apart`); assert.notEqual(konLogic.grade(level, env(konLogic.solve(level))).evidence[0].discriminates, "k-ws"); }
    // she can still be named wrong-scale where she types the other scale's number (a constructed act)
    if (!level.params.mirror) {
      const p = level.params, g = goodPose(p), t = p.theta;
      if (Math.abs(180 - 2 * t) > 4) {
        const acts = [{ kind: "move", x: g.x, y: g.y }, { kind: "spin", deg: g.rot }, { kind: "lock" }, ...(goal === "measure" ? [{ kind: "read", n: 180 - t }] : [{ kind: "mark", r: markFor(p, g, 180 - t) }, { kind: "join", end: "v" }])];
        assert.equal(run(level, acts).ms.at(-1).misconceptionId, "wrong-scale");
      }
    }
  }
  assert.ok(joins >= 20, `${joins}`);
  // the two orientations are served about equally
  assert.ok(mirror >= 0.35 * (mirror + flat) && flat >= 0.35 * (mirror + flat), `mirror ${mirror} / flat ${flat}`);
  // the join buttons' order varies by level
  const seeds = Array.from({ length: 200 }, (_, i) => i * 7919 + 13), first = seeds.filter(joinAFirst).length;
  assert.ok(first > 70 && first < 130, `A first on ${first} of 200`);
});

test("kon/place: the centre ring (vertex-off's signature) never shows before her first decision, nor for any other off placement", () => {
  let vo = 0, other = 0;
  for (const goal of ["measure", "draw"]) for (const level of levels(goal, [1, 2], [1, 7]).slice(0, 12)) {
    const p = level.params, q = vertexOffPose(p), g = goodPose(p);
    const head = (pose) => [{ kind: "move", x: pose.x, y: pose.y }, { kind: "spin", deg: pose.rot }, { kind: "lock" }];
    const decide = goal === "measure" ? [{ kind: "read", n: Math.round(asPlaced(p, q).value) }] : [{ kind: "mark", r: 60 }, { kind: "join", end: "v" }];
    // locked off the bottom-edge way, before any decision: no ring, whatever the view's play-out flag says
    const pre = run(level, head(q)).s;
    assert.equal(centreRingShown(p, pre, true), false, `${level.levelId}: ring before a decision`);
    if (goal === "draw") assert.equal(centreRingShown(p, run(level, [...head(q), { kind: "mark", r: 60 }]).s, true), false);
    // committed: the ring, only while the play-out runs
    const post = run(level, [...head(q), ...decide]).s;
    assert.equal(centreRingShown(p, post, true), true, `${level.levelId}: vertex-off committed`); vo++;
    assert.equal(centreRingShown(p, post, false), false);
    // another off placement (the centre 16 px along the arm, not the bottom edge) committed: no ring
    const [c, s] = [Math.cos((g.rot * Math.PI) / 180), Math.sin((g.rot * Math.PI) / 180)], off = { x: g.x + 16 * c, y: g.y + 16 * s, rot: g.rot };
    const o = run(level, [...head(off), ...(goal === "measure" ? [{ kind: "read", n: 50 }] : [{ kind: "mark", r: 60 }, { kind: "join", end: "v" }])]).s;
    assert.equal(placement(p, o.pl.pose).ok, false);
    assert.equal(centreRingShown(p, o, true), false, `${level.levelId}: ring for a plain off placement`); other++;
    // and a good placement never rings
    assert.equal(centreRingShown(p, run(level, [...head(g), ...decide]).s, true), false);
  }
  assert.ok(vo >= 10 && other >= 10);
});

test("kon/place: the centre tolerance is a finger's (≥ 10 board px), and still keeps the bottom-edge placement out", () => {
  assert.ok(TOL_PX >= 10, `${TOL_PX}`);
  assert.ok(TOL_PX < PD / 2, "vertex-off (PD off) is never a placement, and the two zones never touch");
});

test("kon/place: every accessible label is in the lesson's language (all three), with no number word", () => {
  const keys = ["kon.aria.acw", "kon.aria.cw", "kon.aria.dotAcw", "kon.aria.dotCw", "kon.aria.left", "kon.aria.right", "kon.aria.up", "kon.aria.down"];
  for (const k of keys) {
    const t = WORDS.words[k];
    assert.ok(t && t.hinglish && t.en && t.hi, k);
    assert.match(t.hi, /[ऀ-ॿ]/, `${k} hi`);
    assert.notEqual(t.hinglish, t.en, `${k}: the Hinglish label is not the English one`);
    for (const l of [t.hinglish, t.en, t.hi]) assert.doesNotMatch(l, /\d|\b(one|two|ek|do|teen)\b|एक|दो/i, `${k}: ${l}`);
  }
  // the pad's delete key, in all three languages
  const del = WORDS.words["kon.aria.del"];
  assert.ok(del?.hinglish && del.en && del.hi && del.hinglish !== del.en);
  // and the view reads them from the words (no English literal left in its controls)
  const src = readFileSync(new URL("../src/play/families/kon/kon.place.view.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /aria: "/, "an aria label written as a literal");
});

test("centre-on-arm (Learning's split of vertex-off): the centre mark on an arm's end, or the corner on O, is named only where the level maps it; vertex-off keeps the bottom edge", async () => {
  const { isCentreOnArm, centreOnArmPose, isVertexOff } = await import("../src/play/families/kon/kon.place.ts");
  let n = 0;
  for (const goal of ["measure", "draw"]) for (const level0 of levels(goal, [1, 2, 3])) {
    const level = { ...level0, mal: { ...level0.mal, "centre-on-arm": "k-coa" } }, p = level.params;
    const acts = konLogic.malActs(level, "centre-on-arm");
    assert.ok(acts, `${level.levelId}: centre-on-arm acts`);
    const q = centreOnArmPose(p);
    assert.ok(isCentreOnArm(p, q) && !isVertexOff(p, q) && !placement(p, q).ok);
    assert.ok(!isCentreOnArm(p, goodPose(p)) && !isCentreOnArm(p, vertexOffPose(p)), "the two placements stay apart");
    const r = run(level, acts), m = r.ms.at(-1);
    assert.equal(m.kind, "misconception_consequence"); assert.equal(m.misconceptionId, "centre-on-arm"); assert.equal(m.facts.shown, "centre_on_arm");
    assert.equal(konLogic.grade(level, env(acts), { final: true }).evidence[0].chanceMis, "k-coa", "a pick from one level (gate 2 per session)");
    // the play-out shows where her centre is (the ring on O and the join to her centre) only where the level names it
    assert.equal(centreRingShown(p, r.s, true, level.mal), true);
    assert.equal(centreRingShown(p, run(level0, acts).s, true, level0.mal), false);
    // unmapped (the rule today): an ordinary refusal, nothing on her record
    assert.equal(run(level0, acts).ms.at(-1).misconceptionId, undefined);
    // the corner on O with the base along OA is the same belief (the kit's second sign)
    const g = goodPose(p), b = [Math.cos((g.rot * Math.PI) / 180), Math.sin((g.rot * Math.PI) / 180)], nn = [-b[1], b[0]];
    const corner = { x: p.vx - PR * b[0] + PD * nn[0], y: p.vy - PR * b[1] + PD * nn[1], rot: g.rot };
    assert.ok(isCentreOnArm(p, corner), `${level.levelId}: corner on O`);
    n++;
  }
  assert.ok(n >= 40, `${n}`);
});

test("judging round 3 (ruling 1): her number is graded only on a placed protractor: on an off placement, whatever she types, the decision and its play-out are the same", async () => {
  const { centreOnArmPose } = await import("../src/play/families/kon/kon.place.ts");
  let n = 0;
  for (const level0 of levels("measure", [1, 2, 3])) {
    const level = { ...level0, mal: { ...level0.mal, "centre-on-arm": "k-coa" } }, p = level.params;
    for (const q of [vertexOffPose(p), centreOnArmPose(p), { x: p.vx + 30, y: p.vy + 5, rot: goodPose(p).rot }]) {
      const head = [{ kind: "move", x: q.x, y: q.y }, { kind: "spin", deg: q.rot }, { kind: "lock" }];
      const ap = asPlaced(p, q);
      const reads = [p.theta, 180 - p.theta, ...(ap ? [Math.round(ap.value)] : []), 7, 123];
      const outs = reads.map((nn) => { const m = run(level, [...head, { kind: "read", n: nn }]).ms.at(-1); return `${m.kind}|${m.misconceptionId ?? ""}|${m.facts.shown ?? ""}|${m.facts.why ?? ""}`; });
      assert.equal(new Set(outs).size, 1, `${level.levelId} ${JSON.stringify(q)}: ${outs.join(" · ")}`);
      assert.ok(!/solved|wrong-scale/.test(outs[0]), outs[0]);
      n++;
    }
  }
  assert.ok(n >= 60, `${n}`);
  // the view: on an off placement no arm is drawn from her centre, and her chip takes no meaning colour (drawRunLines
  // returns before the arm when the placement is off; the chip's role is the mix-up colour only on a placed protractor).
  // The browser layout check (tests/r8-games-kon-layout.test.mjs) asserts the same on the drawn screens
  const src = readFileSync(new URL("../src/play/families/kon/kon.place.view.ts", import.meta.url), "utf8");
  assert.match(src, /if \(!pl\.ok\) return;\s*\n\s*\/\/ her number, on the scale/);
  assert.match(src, /placement\(p, P0\.pose\)\.ok \? ROLE\.mixup : undefined/);
});

test("judging round 3 (rulings 5, 6): four one-pixel position nudges beside the turn arrows; 'kinare par'; size's end line says what she found", () => {
  assert.equal(word("hinglish", "kon.goal.draw.mark", { a: "130°" }), "Kinare par 130° ka bindu lagao, phir jodo");
  for (const lang of ["hinglish", "en", "hi"]) {
    assert.match(word(lang, "kon.end.size.more", { n: "∠Q", k: 1 }), /∠Q .*: 1$/);
    assert.match(word(lang, "kon.end.size.same", { k: 2 }), /∠P .*∠Q .*: 2$/);
    // "jaanch" written the same way in every kon/place end line (lowercase, after the dot)
    for (const k of ["kon.end.read", "kon.end.draw", "kon.end.size.more", "kon.end.size.same"]) assert.doesNotMatch(word(lang, k), /Jaanch|Checks/, `${lang} ${k}`);
  }
  // a nudge is the law's own move act by one board px, from where the protractor lies
  const level = konLogic.validate(konLogic.generate(req("measure", 7))[0].level);
  let s = konLogic.init(level);
  const { x, y } = s.pl?.pose ?? { x: level.params.x0, y: level.params.y0 };
  s = konLogic.apply(level, s, { kind: "move", x: x + 1, y }, 1).state;
  assert.deepEqual([s.pl.pose.x, s.pl.pose.y], [x + 1, y]);
  const src = readFileSync(new URL("../src/play/families/kon/kon.place.view.ts", import.meta.url), "utf8");
  for (const [id, dx, dy] of [["move-left", -1, 0], ["move-up", 0, 1], ["move-down", 0, -1], ["move-right", 1, 0]]) assert.match(src, new RegExp(`nudge\\("${id}", "kon\\.aria\\.\\w+", "[←↑↓→]", ${dx}, ${dy}\\)`), id);
});

// ───────────────────────────── gate 1 (RULINGS-2026-11-11-night, kon/place) ─────────────────────────────
// The real view, headless (server/forge3/qa/laws.mjs mounts it on a recording context), in the world boxes the browser
// measures for measure and draw (tests/r8-games-kon-layout.test.mjs WORLD), on every generated level of the goal.
const GATE_WORLD = [{ tag: "360x640", W: 360, H: 287 }, { tag: "1366x768", W: 1005, H: 768 }];
const GATE_SEEDS = [1, 7, 42, 99, 123, 2026];
const boardOf = (W, H) => { const s = Math.min(W / BW, H / BH); return { s, ox: (W - BW * s) / 2, oy: (H - BH * s) / 2 }; };
const at = (q) => [{ kind: "move", x: q.x, y: q.y }, { kind: "spin", deg: q.rot }, { kind: "lock" }];
/** the scale numbers the view drew this frame (the only texts on a halo), each with its figures' box */
const drawnNumbers = (m) => m.api.P.audit.texts.filter((t) => t.halo && /^\d{1,3}$/.test(t.s)).map((t) => ({ s: t.s, x: t.x - t.w / 2, y: t.y - (t.px * 0.74) / 2, w: t.w, h: t.px * 0.74 }));
/** the frame once the play-out has run (its beats land before 1.4 s) */
const settled = (m) => { m.api.t += 3; return m.frame(); };
/** how many numbers the view lays out for a pose before the board's edge takes any (the headless 0.56 em the mount measures) */
async function laidOut(p, q, W, H) {
  const { scaleLabels, scaleOmitFor } = await import("../src/play/families/kon/kon.scale.ts");
  const R = PR * boardOf(W, H).s, every = PRINT_EVERY[p.scale], measure = (t, px) => t.length * px * 0.56;
  return scaleLabels({ rot: q.rot, R, rad0: PR, every, fs: 14, measure, omit: scaleOmitFor([{ R, rad0: PR }], every, 14, measure, q.rot)[0] }).length;
}
const distToBox = (p, b) => Math.hypot(Math.max(b.x - p[0], 0, p[0] - b.x - b.w), Math.max(b.y - p[1], 0, p[1] - b.y - b.h));

test("gate 1, ruling 1: a scale number not wholly on the board is not drawn (every generated level, every pose, 360 and 1366)", async () => {
  const { _mount } = await import("../server/forge3/qa/laws.mjs");
  const { centreOnArmPose } = await import("../src/play/families/kon/kon.place.ts");
  const faults = [];
  let dropped = 0, screens = 0;
  for (const goal of ["measure", "draw"]) for (const level of levels(goal, [1, 2, 3], GATE_SEEDS)) {
    const p = level.params;
    for (const { tag, W, H } of GATE_WORLD) {
      for (const [k, q] of Object.entries({ rest: null, placed: goodPose(p), "vertex-off": vertexOffPose(p), "centre-on-arm": centreOnArmPose(p) })) {
        const m = await _mount(level, { W, H, young: false });
        if (q) for (const a of at(q)) m.ctl.dispatch(a);
        m.frame();
        screens++;
        const N = drawnNumbers(m);
        for (const n of N) if (n.x < 0 || n.y < 0 || n.x + n.w > W || n.y + n.h > H) faults.push(`${tag} ${level.levelId} ${k}: "${n.s}" cut by the board's edge`);
        // what the edge took, it took by ticks: never one scale alone (judging round 3, ruling 3)
        const count = new Map();
        for (const n of N) count.set(n.s, (count.get(n.s) ?? 0) + 1);
        for (const [v, c] of count) if (v !== "90" && c !== (count.get(String(180 - Number(v))) ?? 0)) faults.push(`${tag} ${level.levelId} ${k}: "${v}" on one scale alone`);
        if (N.length < (await laidOut(p, m.ctl.state.pl.pose, W, H))) dropped++;
      }
    }
  }
  assert.ok(screens >= 400, `${screens} screens`);
  assert.ok(dropped > 0, "some centre-on-arm placement runs off the board (the ruling's case)");
  assert.deepEqual(faults.slice(0, 30), [], `${faults.length} faults`);
});

test("gate 1 (minor): the resting protractor is wholly on the board, its numbers all drawn (every generated level, 360 and 1366)", async () => {
  const { _mount } = await import("../server/forge3/qa/laws.mjs");
  const { protractorLines } = await import("../src/play/families/kon/kon.scale.ts");
  const { initPlace } = await import("../src/play/families/kon/kon.place.ts");
  const faults = [];
  let n = 0;
  for (const goal of ["measure", "draw"]) for (const level of levels(goal, [1, 2, 3], GATE_SEEDS)) {
    const p = level.params, q = initPlace(p).pose;
    for (const { tag, W, H } of GATE_WORLD) {
      const { s, ox, oy } = boardOf(W, H), S = (x, y) => [ox + x * s, oy + (BH - y) * s];
      const board = { x: ox, y: oy, w: BW * s, h: BH * s };
      // every line of the protractor (rim, strip, base, ticks) at least 4 px inside the board (its stroke and more)
      const [cx, cy] = S(q.x, q.y);
      for (const L of protractorLines(cx, cy, PR * s, PD * s, q.rot, PR)) for (const [x, y] of [L.a, L.b]) {
        const room = Math.min(x - board.x, board.x + board.w - x, y - board.y, board.y + board.h - y);
        if (room < 4) { faults.push(`${tag} ${level.levelId}: the resting protractor's ${L.kind} ${room.toFixed(1)} px from the board's edge`); break; }
      }
      // its numbers: every one drawn, and inside the board
      const m = await _mount(level, { W, H, young: false });
      m.frame();
      n++;
      const N = drawnNumbers(m);
      const want = await laidOut(p, q, W, H);
      if (N.length !== want) faults.push(`${tag} ${level.levelId}: ${N.length} of its ${want} numbers drawn at rest`);
      for (const b of N) if (b.x < board.x || b.y < board.y || b.x + b.w > board.x + board.w || b.y + b.h > board.y + board.h) faults.push(`${tag} ${level.levelId}: the resting "${b.s}" off the board`);
    }
  }
  assert.ok(n >= 200, `${n}`);
  assert.deepEqual(faults.slice(0, 30), [], `${faults.length} faults`);
});

test("gate 1, ruling 2: measure's wrong-scale arm stops inside the inner number ring; after two placed misses no arm (every generated level, 360 and 1366)", async () => {
  const { _mount } = await import("../server/forge3/qa/laws.mjs");
  const faults = [];
  let n = 0;
  for (const level of levels("measure", [1, 2, 3], GATE_SEEDS)) {
    const acts = konLogic.malActs(level, "wrong-scale"), p = level.params;
    if (!acts) continue;
    for (const { tag, W, H } of GATE_WORLD) {
      const { s, ox, oy } = boardOf(W, H), g = goodPose(p), C = [ox + g.x * s, oy + (BH - g.y) * s];
      const m = await _mount(level, { W, H, young: false });
      for (const a of acts) m.ctl.dispatch(a);
      settled(m);
      n++;
      assert.equal(m.ctl.state.pl.placedMisses, 1);
      // her arm: an arm drawn from the protractor's centre after OA and OB (the first two arms, also from O here)
      const armsFrom = () => m.api.P.audit.segs.filter((x) => x.kind === "arm").slice(2).filter((x) => Math.hypot(x.x0 - C[0], x.y0 - C[1]) < 1);
      const hers = armsFrom();
      if (hers.length !== 1) { faults.push(`${tag} ${level.levelId}: ${hers.length} arms from her centre after the first miss`); continue; }
      const end = [hers[0].x1, hers[0].y1], N = drawnNumbers(m);
      // its end stands nearer the centre than every number's box it points at (within 12° of its heading: inside the inner
      // ring there), and no number lies on it
      const reach = Math.hypot(end[0] - C[0], end[1] - C[1]), heading = Math.atan2(C[1] - end[1], end[0] - C[0]);
      for (const b of N) {
        const bearing = Math.atan2(C[1] - (b.y + b.h / 2), b.x + b.w / 2 - C[0]), off = Math.abs(((bearing - heading + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
        if (off < (12 * Math.PI) / 180 && distToBox(C, b) <= reach) faults.push(`${tag} ${level.levelId}: her arm (${reach.toFixed(0)} px) reaches the ring of "${b.s}" (${distToBox(C, b).toFixed(0)} px)`);
        for (let t = 0; t <= 1; t += 0.02) if (distToBox([C[0] + (end[0] - C[0]) * t, C[1] + (end[1] - C[1]) * t], b) < 2) { faults.push(`${tag} ${level.levelId}: her arm on "${b.s}"`); break; }
      }
      // a second miss on the placed protractor (a number off both scales): her chip stays, her arm is no longer drawn
      const other = (180 - p.theta + 17) % 180;
      m.ctl.dispatch({ kind: "read", n: Math.abs(other - p.theta) > 6 ? other : (other + 20) % 180 });
      settled(m);
      assert.equal(m.ctl.state.pl.placedMisses, 2);
      if (armsFrom().length) faults.push(`${tag} ${level.levelId}: her arm still drawn after two placed misses`);
      if (!m.api.P.audit.marks.some((x) => x.kind === "chip")) faults.push(`${tag} ${level.levelId}: her chip gone after the second miss`);
      // undo brings the first miss's screen back (the count is the law's state)
      m.ctl.dispatch({ kind: "undo" });
      assert.equal(m.ctl.state.pl.placedMisses, 1);
    }
  }
  assert.ok(n >= 20, `${n} wrong-scale screens`);
  assert.deepEqual(faults.slice(0, 30), [], `${faults.length} faults`);
});

/** a 2D context that records each path's arcs and whether it was filled or stroked */
function arcCtx() {
  const out = [], texts = [];
  let arcs = [];
  const t = { font: "10px x", fillStyle: "", strokeStyle: "", globalAlpha: 1, lineWidth: 1, textAlign: "center", textBaseline: "middle", lineCap: "", lineJoin: "", globalCompositeOperation: "source-over", shadowBlur: 0, shadowColor: "", lineDashOffset: 0, filter: "none", imageSmoothingEnabled: true };
  const ctx = new Proxy(t, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === "beginPath") return () => { arcs = []; };
      if (k === "arc") return (x, y, r) => { arcs.push({ x, y, r }); };
      if (k === "fillText") return (s) => { texts.push({ s: String(s), font: o.font }); };
      if (k === "fill" || k === "stroke") return () => { for (const a of arcs) out.push({ ...a, op: k }); };
      if (k === "measureText") return (s) => ({ width: [...String(s)].length * Number(/(\d+)px/.exec(o.font)?.[1] ?? 16) * 0.56, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 });
      if (k === "getLineDash") return () => [];
      if (k === "isPointInPath" || k === "isPointInStroke") return () => false;
      if (k === "getTransform") return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      return () => ({ addColorStop() {} });
    },
    set(o, k, v) { o[k] = v; return true; },
  });
  return { ctx, out, texts };
}

test("gate 1, ruling 3 and the rim dot: draw's miss chip carries no number; the dot is a hollow ring (every generated level, 360 and 1366)", async () => {
  const { _mount } = await import("../server/forge3/qa/laws.mjs");
  const { rimPoint } = await import("../src/play/families/kon/kon.place.ts");
  const faults = [];
  let chips = 0, dots = 0;
  for (const level0 of levels("draw", [1, 2, 3], GATE_SEEDS)) {
    const level = { ...level0, mal: { ...level0.mal, "centre-on-arm": "k-coa" } }, p = level.params, g = goodPose(p);
    // every miss the view plays out: each mal-rule, and a mark off both scales joined to O
    const misses = [...["wrong-scale", "vertex-off", "centre-on-arm", "join-wrong-end"].map((x) => konLogic.malActs(level, x)).filter(Boolean),
      [...at(g), { kind: "mark", r: (markFor(p, g, p.theta) + 23) % 180 }, { kind: "join", end: "v" }]];
    for (const { tag, W, H } of GATE_WORLD) {
      for (const acts of misses) {
        const m = await _mount(level, { W, H, young: false });
        for (const a of acts) m.ctl.dispatch(a);
        if (m.ctl.state.done) continue;
        settled(m);
        chips++;
        // the chip names the corner (∠O, ∠A) and nothing else; no text on the board but the scale's own numbers holds a digit
        if (!m.api.P.audit.marks.some((x) => x.kind === "chip")) faults.push(`${tag} ${level.levelId}: no miss chip`);
        // gate 1, by the main loop's look: the chip's letter is set in the face the point letters use (in the mono face O
        // read like a zero)
        const T = arcCtx();
        m.view.draw(T.ctx);
        const face = (f) => f.replace(/^\s*\d+\s+[\d.]+px\s+/, ""), named = T.texts.filter((x) => /^∠[OA]$/.test(x.s)), lets = T.texts.filter((x) => /^[OA]$/.test(x.s));
        if (!named.length || !lets.length) faults.push(`${tag} ${level.levelId}: no ∠ chip or no letter drawn`);
        for (const x of named) if (!lets.every((l) => face(l.font) === face(x.font))) faults.push(`${tag} ${level.levelId}: "${x.s}" in ${face(x.font)}, the letters in ${face(lets[0]?.font ?? "")}`);
        for (const t of m.api.P.audit.texts) if (!t.halo && /\d/.test(t.s)) faults.push(`${tag} ${level.levelId}: "${t.s}" on the board after a miss`);
      }
      // the rim dot, before she joins: a ring (stroked, never filled), so the tick under it shows through
      const m = await _mount(level, { W, H, young: false });
      for (const a of [...at(g), { kind: "mark", r: markFor(p, g, p.theta) }]) m.ctl.dispatch(a);
      const { s, ox, oy } = boardOf(W, H), D = rimPoint(g, markFor(p, g, p.theta)), X = ox + D[0] * s, Y = oy + (BH - D[1]) * s;
      const { ctx, out } = arcCtx();
      m.view.draw(ctx);
      const here = out.filter((a) => Math.hypot(a.x - X, a.y - Y) < 0.5 && Math.abs(a.r - 6) < 0.01);
      dots++;
      if (!here.some((a) => a.op === "stroke")) faults.push(`${tag} ${level.levelId}: no ring at the dot`);
      if (here.some((a) => a.op === "fill")) faults.push(`${tag} ${level.levelId}: the dot is filled`);
    }
  }
  assert.ok(chips >= 100 && dots >= 40, `${chips} miss screens, ${dots} dots`);
  assert.deepEqual(faults.slice(0, 30), [], `${faults.length} faults`);
});
