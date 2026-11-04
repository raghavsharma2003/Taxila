// Round 7 E6 · yantra/circuit (wire a cell, a bulb and a switch; RUN). Pure law checks: every generated level is solved by
// its solver and is shortcut-free; goal met ⇔ an INDEPENDENT closed-loop oracle written here (a graph search over the
// board, sharing no helper with the law) over thousands of random wire / cut / toggle / run acts; each mal-rule's acts land
// on its OWN misconception moment (never solved, never another mal-rule's); tampered params are refused; a verdict field
// in an act never decides; the generator is fast; and every coverage entry serves a proven level via currentLevel.
import { test } from "node:test";
import assert from "node:assert/strict";
import { circuitLogic as L, CIRCUIT_MAL, currentLoop } from "../src/play/families/yantra/circuit.logic.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { coverage, currentLevel, entryKey, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { GAME_WEIGHT, sanitizeActs } from "../shared/play.ts";

const ALL = Object.fromEntries(CIRCUIT_MAL.map((m) => [m, `k-${m}`]));
const req = (goal, seed, o = {}) => ({ family: "yantra", mode: "circuit", goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const levels = (goal, seeds = [1, 7, 42, 99], fades = [1, 2, 3]) => seeds.flatMap((seed) => fades.flatMap((fade) => L.generate(req(goal, seed, { fade })).map((c) => ({ c, level: L.validate(c.level) }))));

// ── the oracle: written from the physics, not from the law. Terminals are nodes; a wire, a closed switch and a metal clip
// are conductors (no load); the bulb's filament is the load; the eraser is not a conductor. The bulb glows iff there is a
// path + … → one bulb terminal and the other bulb terminal … → − through conductors only, and no conductor-only path from
// + to − (a short). A switch controls the bulb iff with the switch's blade removed the bulb no longer glows. "After the
// bulb" = with the blade removed, + still reaches the bulb.
function oracle(p, wires, closed) {
  const kinds = p.parts.map((x) => x.kind);
  const edges = wires.map((k) => k.split("|"));
  const conductors = (blade) => [...edges, ...(kinds.includes("switch") && blade ? [["s1", "s2"]] : []), ...(kinds.includes("clip") ? [["x1", "x2"]] : [])];
  const reach = (from, es) => { const seen = new Set([from]), stack = [from]; while (stack.length) { const u = stack.pop(); for (const [a, b] of es) for (const [x, y] of [[a, b], [b, a]]) if (x === u && !seen.has(y)) { seen.add(y); stack.push(y); } } return seen; };
  const lights = (es) => { const plus = reach("c+", es), minus = reach("c-", es); if (plus.has("c-")) return false; return (plus.has("b1") && minus.has("b2")) || (plus.has("b2") && minus.has("b1")); };
  const es = conductors(closed);
  if (!lights(es)) return false;
  if (p.goal === "switch") {
    const open = conductors(false);
    if (lights(open)) return false;
    if (p.at === "after") { const plus = reach("c+", open); if (!(plus.has("b1") || plus.has("b2"))) return false; }
  }
  return true;
}

for (const goal of ["light", "switch"]) {
  test(`yantra/circuit/${goal}: every level valid, solvable, shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set();
    let n = 0;
    for (const { c, level } of levels(goal)) {
      assert.ok(level, c.signature);
      assert.equal(level.params.goal, goal);
      assert.equal(L.shortcut(level), null, `${c.signature} shortcut`);
      const sol = run(level, L.solve(level));
      assert.ok(sol.s.done && sol.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(sol.refused, [], `${c.signature} solver refused`);
      assert.ok(oracle(level.params, sol.s.wires, sol.s.sw), `${c.signature}: the oracle agrees with the solve`);
      // every blind move: wire every terminal to every other, close the switch, run → never glows
      const p = level.params, ts = p.parts.flatMap((x) => ({ cell: ["c+", "c-"], bulb: ["b1", "b2"], switch: ["s1", "s2"] }[x.kind] ?? ["x1", "x2"]));
      const all = []; for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) all.push({ kind: "wire", a: ts[i], b: ts[j] });
      const blind = run(level, [...all, ...(goal === "switch" ? [{ kind: "toggle", id: "s" }] : []), { kind: "run" }]);
      assert.ok(!blind.s.done, `${c.signature}: wiring everything passed`);
      for (const mal of CIRCUIT_MAL) {
        const acts = L.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.ok(!r.s.done, `${c.signature} ${mal} must not solve`);
        assert.ok(!oracle(level.params, r.s.wires, r.s.sw), `${c.signature} ${mal}: the oracle says dark too`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal, `${c.signature} ${mal} named as ${mc[0].misconceptionId}`);
        const g = L.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
      n++;
    }
    assert.ok(n > 100, `${n} levels`);
    const expect = goal === "light" ? ["one-wire", "both-terminals-clash"] : ["one-wire", "both-terminals-clash", "switch-before-only", "switch-source"];
    for (const m of expect) assert.ok(seen.has(m), `${goal}: mal-rule ${m} never discriminated`);
  });
}

test("yantra/circuit: the mal-rules' outcomes are the law's (clash is a short; switch-before-only only where after is asked)", () => {
  const lv = levels("light", [3], [1]).find((x) => !x.level.params.pre.length).level;
  const clash = run(lv, L.malActs(lv, "both-terminals-clash"));
  assert.equal(clash.ms.find((m) => m.kind === "misconception_consequence").facts.why, "short");
  assert.equal(run(lv, L.malActs(lv, "one-wire")).ms.find((m) => m.kind === "misconception_consequence").facts.why, "open_loop");
  for (const { level } of levels("switch", [3, 4], [1])) assert.equal(L.malActs(level, "switch-before-only"), null, "fade 1 allows the switch anywhere");
  for (const { level } of levels("switch", [3, 4], [2, 3])) {
    assert.equal(level.params.at, "after");
    // the switch before the bulb works as a switch, but the level asked for after: refused with the belief named
    const r = run(level, L.malActs(level, "switch-before-only"));
    assert.equal(r.ms.at(-1).facts.why, "switch_before");
    // the switch left out of the loop never passes; an open switch on a good loop is a near miss
    const out = run(level, [{ kind: "wire", a: "c+", b: "b1" }, { kind: "wire", a: "b2", b: "c-" }, { kind: "toggle", id: "s" }, { kind: "run" }]);
    assert.equal(out.ms.at(-1).facts.why, "not_controlled");
    const nm = run(level, [{ kind: "wire", a: "c+", b: "b1" }, { kind: "wire", a: "b2", b: "s1" }, { kind: "wire", a: "s2", b: "c-" }, { kind: "run" }]);
    assert.equal(nm.ms.at(-1).kind, "near_miss"); assert.equal(nm.ms.at(-1).facts.why, "switch_open");
  }
});

test("yantra/circuit: the current loop runs + → bulb → −, one way (the view's dots never thin after the bulb)", () => {
  for (const { level } of levels("switch", [5], [1, 2])) {
    const s = run(level, L.solve(level)).s, loop = currentLoop(level.params, s.wires, s.sw);
    assert.equal(loop[0], "c+"); assert.equal(loop.at(-1), "c-");
    const bi = loop.findIndex((t) => t[0] === "b");
    assert.ok(bi > 0 && loop[bi + 1][0] === "b", "the loop passes through the bulb once");
    assert.equal(new Set(loop).size, loop.length, "a simple loop");
  }
  const lv = levels("light", [5], [1])[0].level;
  assert.equal(currentLoop(lv.params, [], false), null);
});

test("yantra/circuit: tampered params are refused", () => {
  const light = levels("light", [6], [1])[0].level, sw = levels("switch", [6], [2])[0].level;
  assert.ok(L.validate(light)); assert.ok(L.validate(sw));
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  const cell = light.params.parts.find((x) => x.kind === "cell");
  for (const [lv, patch] of [
    [light, { goal: "win" }], [light, { ctx: "casino" }], [light, { parts: light.params.parts.filter((x) => x.kind !== "cell") }],
    [light, { parts: [...light.params.parts, { kind: "lamp", slot: 5, flip: false }] }],
    [light, { parts: [...light.params.parts.filter((x) => x.kind !== "switch"), { kind: "switch", slot: 5, flip: false }] }],
    [light, { parts: light.params.parts.map((x) => (x === cell ? { ...x, slot: 9 } : x)) }],
    [light, { parts: light.params.parts.map((x) => ({ ...x, slot: 0 })) }],
    [light, { parts: [...light.params.parts, { ...cell }] }],
    [light, { pre: [["c+", "zz"]] }], [light, { pre: [["c+", "c+"]] }], [light, { pre: [["c+", "b1"], ["b1", "c+"]] }],
    [light, { pre: [["c+", "b1"], ["b2", "c-"]] }],   // starts solved
    [light, { pre: "c+|b1" }],
    [sw, { parts: sw.params.parts.filter((x) => x.kind !== "switch") }], [sw, { at: "sideways" }],
  ]) assert.equal(L.validate(bad(lv, patch)), null, JSON.stringify(patch).slice(0, 90));
  assert.equal(L.validate({ ...light, mode: "beam" }), null);
  assert.equal(L.validate({ ...light, params: null }), null);
  // acts on terminals the board does not have are refused, never a crash
  const s = L.init(light);
  for (const a of [{ kind: "wire", a: "c+", b: "s1" }, { kind: "wire", a: "q", b: "c-" }, { kind: "wire", a: "c+", b: "c+" }, { kind: "unwire", a: "c+", b: "b1" }, { kind: "toggle", id: "s" }, { kind: "run" }, { kind: "fly" }])
    assert.ok(L.apply(light, s, a, 1).refused, JSON.stringify(a));
});

test("yantra/circuit: a verdict field in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = levels("light", [4], [1]).find((x) => !x.level.params.pre.length).level;
  const raw = env([{ kind: "wire", a: "c+", b: "b1", correct: true }, { kind: "run", solved: true, verdict: "solved" }]);
  const forged = L.grade(level, sanitizeActs(raw));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  assert.notEqual(L.grade(level, raw).verdict, "solved", "even unsanitised, a claim is not an input");
  const ok = L.grade(level, env(L.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "wire", a: "c+", b: "b1" }, { kind: "run" }, ...L.solve(level).filter((a) => !(a.kind === "wire" && a.a === "b1" && a.b === "c+"))];
  const g = L.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(L.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per goal: never throws; at every run, solved ⇔ the oracle on the board as it stood
for (const goal of ["light", "switch"]) {
  test(`yantra/circuit/${goal}: ≥ 3000 random acts; goal met ⇔ the independent oracle; never throws; generator p95 ≤ 60 ms`, () => {
    let seed = 11, acts = 0, solved = 0, runs = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let g = 0; g < 40; g++) {
      let best = Infinity, picked = null;
      // best of 3 (the picker is deterministic; a neighbour's load spike on a shared runner is not its cost)
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); picked = pickLevels(L, req(goal, 200 + g, { fade: 1 + (g % 3) })); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      const cands = L.generate(req(goal, 200 + g, { fade: 1 + (g % 3) })).slice(0, 5).map((c) => L.validate(c.level));
      for (const level of [picked.garam, ...cands]) {
        const ts = level.params.parts.flatMap((x) => ({ cell: ["c+", "c-"], bulb: ["b1", "b2"], switch: ["s1", "s2"] }[x.kind] ?? ["x1", "x2"]));
        const sol = L.solve(level);
        let s = L.init(level), k = 0;
        const pursue = rnd() < 0.35;
        for (let i = 0; i < 80 && !s.done; i++) {
          const r = rnd(), t = () => ts[Math.floor(rnd() * ts.length)];
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.45 ? { kind: "wire", a: t(), b: t(), ...(rnd() < 0.2 ? { correct: true } : {}) } : r < 0.6 ? { kind: "unwire", a: t(), b: t() }
            : r < 0.75 ? { kind: "toggle", id: rnd() < 0.9 ? "s" : "q" } : r < 0.92 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s, out = L.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "run" && before.wires.length) {
            runs++;
            assert.equal(out.state.done, oracle(level.params, before.wires, before.sw), `${level.levelId}: law and oracle disagree on ${before.wires} sw=${before.sw}`);
          }
          s = out.state;
        }
        if (L.goalMet(level, s)) { solved++; assert.ok(oracle(level.params, s.wires, s.sw)); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 3000, `only ${acts} acts`);
    assert.ok(runs >= 300, `only ${runs} runs`);
    assert.ok(solved > 10, `the battery solved only ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 60, `picker p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

// the play server: every yantra/circuit coverage entry serves a proven level at every fade via currentLevel
const MINE = () => coverage().entries.filter((e) => e.family === "yantra" && e.mode === "circuit");
test("yantra/circuit coverage: the two authored entries, mapped to real kit misconceptions, admitted by skill", () => {
  assert.deepEqual(MINE().map((e) => `${e.topicId}|${e.goal}|${e.skillIds.join(",")}|${JSON.stringify(e.misMap)}`), [
    `c7-science-ch03-t01|light|c7-science-ch03-t01-s2,c7-science-ch03-t01-s3|${JSON.stringify({ "one-wire": "c7-science-ch03-t01-m1", "both-terminals-clash": "c7-science-ch03-t01-m3" })}`,
    `c7-science-ch03-t02|switch|c7-science-ch03-t02-s3,c7-science-ch03-t02-s4|${JSON.stringify({ "switch-before-only": "c7-science-ch03-t02-m2", "switch-source": "c7-science-ch03-t02-m1" })}`,
  ]);
  for (const e of MINE()) for (const sk of e.skillIds) { assert.ok(hasPlay(sk)); assert.equal(entryFor({ skillId: sk }).family, "yantra"); }
});
for (const e of MINE()) for (const fade of [1, 2, 3]) {
  test(`yantra/circuit server ${e.topicId} ${e.goal} fade ${fade}: currentLevel serves a proven level; solve grades solved; mal-rules fold their kit id`, () => {
    for (let n = 0; n < 3; n++) {
      const key = entryKey(e);
      const s = { childId: `t-${n}`, key, skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
        mis: {}, pL: undefined, n: 0, seed: seedOf(`t-${n}`, key, 0), door: "garam", recent: [], hist: null };
      const level = currentLevel(s, e);
      assert.ok(level, "no level");
      assert.equal(level.family, "yantra"); assert.equal(level.mode, "circuit"); assert.equal(level.params.goal, e.goal);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      assert.ok(level.proof.discriminates.length >= 1, "the level discriminates a kit misconception");
      const g = gradeActs(level, env(L.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && L.malActs(level, m));
        const mg = gradeActs(level, env(L.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
    }
  });
}

test("yantra/circuit: the switch-source wiring (bulb + closed switch, no cell) is answered as a missing cell, not a switch fault", async () => {
  const { circuitLogic } = await import("../src/play/families/yantra/circuit.logic.ts");
  let checked = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) for (const c of circuitLogic.generate({ family: "yantra", mode: "circuit", goal: "switch", topicId: "t", skillId: "t-s1", classLevel: 7, fade: 2, mis: {}, misMap: { "switch-source": "k" }, grammar: {}, recent: [], seed })) {
    const lv = circuitLogic.validate(c.level), acts = circuitLogic.malActs(lv, "switch-source");
    if (!acts) continue;
    let s = circuitLogic.init(lv); const ms = [];
    acts.forEach((a, i) => { const r = circuitLogic.apply(lv, s, a, i + 1); s = r.state; ms.push(...r.moments); });
    const m = ms.find((x) => x.kind === "misconception_consequence");
    assert.equal(m?.facts?.why, "no_cell");
    checked++;
  }
  assert.ok(checked > 0);
});
