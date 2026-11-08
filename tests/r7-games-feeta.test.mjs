// r7 Games, Feeta · length and distance (a ribbon cut against a ruler that may be broken, a rope cut off a cm tape, a garden
// fenced from a roll, a trip meter set in metres, lengths racked shortest first; nothing ever runs on a clock). Pure law
// checks: every generated level validates, its solver solves it, no idea-free set-up wins (shortcut null); an INDEPENDENT
// checker (plain arithmetic in MILLIMETRES: it walks the ruler's spaces one by one, counts the garden's unit edges square
// by square, turns every written length into mm with its own table; none of the law's helpers) agrees with the law over
// random play; each mal-rule's acts land on its OWN misconception moment; tampered params are refused; a claim in an act
// never decides; the generator is fast; and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { feetaLogic, FEETA_MAL, malSetup, sideLens } from "../src/play/families/feeta/feeta.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { cpuNow } from "./_cpu-ms.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const ALL = Object.fromEntries(FEETA_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "feeta", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 4, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = feetaLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = feetaLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["measure", "ribbon", {}],
  ["measure", "rope", {}],
  ["fence", "fence", { shapes: ["rect", "square", "L"] }],
  ["trip", "odo", {}],
  ["compare", "order", { u: "m", forms: ["big", "small"] }],
  ["compare", "order", { u: "km", forms: ["big", "small", "mixed"] }],
];
const EXPECT = (goal, g) => ({ ribbon: ["end-number", "count-marks"], rope: ["m-is-10"], fence: ["labelled-only", "area", "border-squares"], odo: ["km-100", "concat"],
  order: g.forms?.includes("mixed") ? ["ignore-units", "concat"] : ["ignore-units"] })[goal];
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of feetaLogic.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (millimetres, none of the law's code) ─────────────────────────────
const MM = { cm: 10, m: 1000, km: 1000000 };
/** a written length → mm: the pair "m" is metres + centimetres, "km" kilometres + metres */
const mmOf = (big, small, pair) => (pair === "km" ? big * MM.km + small * MM.m : big * MM.m + small * MM.cm);
/** the instrument's own unit: cm for the ribbon and the rope, m for the fence and the trip */
const instMM = (goal) => (goal === "ribbon" || goal === "rope" ? MM.cm : MM.m);
/** the object on the ruler: walk the spaces from its start mark to its end mark, 1 cm each */
function objectMM(p) { let mm = 0; for (let m = p.a; m < p.b; m++) mm += MM.cm; return mm; }
/** the garden: its squares, then every square's side that has no square beyond it is one metre of fence */
function fenceMM(p) {
  const cells = new Set();
  for (let x = 0; x < p.W; x++) for (let y = 0; y < p.H; y++) if (!(x >= p.W - p.nw && y < p.nh)) cells.add(`${x},${y}`);
  let mm = 0;
  for (const c of cells) { const [x, y] = c.split(",").map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has(`${x + dx},${y + dy}`)) mm += MM.m; }
  return mm;
}
/** the checker's own copy of the set-up, fed every act the law accepted (undo pops its own stack) */
function checker(p) {
  const st = { at: 0, order: p.items.map(() => -1) }, stack = [];
  return {
    st,
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push(JSON.parse(JSON.stringify(st)));
      if (a.kind === "mark") st.at = a.at;
      if (a.kind === "put") { const from = st.order.indexOf(a.lane); if (from >= 0) st.order[from] = st.order[a.at]; st.order[a.at] = a.lane; }
    },
  };
}
/** does this set-up meet the task? read from the params' plain meaning, in mm */
function verdict(p, st) {
  const got = st.at * instMM(p.goal);
  if (p.goal === "ribbon") return got === objectMM(p);
  if (p.goal === "rope" || p.goal === "odo") return got === mmOf(p.big, p.small, p.u);
  if (p.goal === "fence") return got === fenceMM(p);
  const mm = p.items.map((l) => mmOf(l.big, l.small, p.u));
  const shortest = mm.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  return st.order.join() === shortest.join();
}
const replayCheck = (level, acts) => { const k = checker(level.params); let s = feetaLogic.init(level); for (const a of acts) { const r = feetaLogic.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return { s, ok: verdict(level.params, k.st) }; };

test("feeta: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("feeta"));
  assert.deepEqual([...MODES.feeta], ["measure", "fence", "trip", "compare"]);
  assert.ok(FAMILY_ARTS.feeta.length === 4);
  for (const m of MODES.feeta) {
    assert.equal(LOGIC[`feeta/${m}`], feetaLogic);
    const v = playActOf("feeta", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

for (const [mode, goal, grammar] of CASES) {
  test(`feeta/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = feetaLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(feetaLogic.shortcut(level), null, `${c.signature} shortcut`);
      const sol = feetaLogic.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol).ok, `${c.signature}: the checker disagrees with the solver`);
      for (const mal of FEETA_MAL) {
        const acts = feetaLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts).ok, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = feetaLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of EXPECT(goal, grammar)) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("feeta: mal-rule signatures are the beliefs (the end number, the marks, 1 m = 10 cm, 1 km = 100 m, joined numbers, only the labelled sides, the squares inside, the edge squares, bare numbers)", () => {
  for (const c of levelsOf("measure", "ribbon", {})) {
    const p = feetaLogic.validate(c.level).params;
    const en = malSetup(p, "end-number"); if (en) assert.equal(en.at, p.b);
    const cm = malSetup(p, "count-marks"); if (cm) assert.equal(cm.at, p.b - p.a + 1, "one more mark than spaces");
  }
  for (const c of levelsOf("measure", "rope", {})) {
    const p = feetaLogic.validate(c.level).params, m = malSetup(p, "m-is-10");
    if (m) { assert.equal(m.at, p.big * 10 + p.small); assert.ok(p.small >= 10, "below 10 cm it is the joined-digits set-up too: names neither"); }
    assert.equal(malSetup(p, "concat"), null, "a rope's joined digits are never told apart from 1 m = 10 cm");
  }
  for (const c of levelsOf("trip", "odo", {})) {
    const p = feetaLogic.validate(c.level).params;
    const k = malSetup(p, "km-100"); if (k) assert.equal(k.at, p.big * 100 + p.small);
    const j = malSetup(p, "concat"); if (j) { assert.equal(j.at, Number(`${p.big}${p.small}`)); assert.ok(p.small < 10); }
  }
  for (const c of levelsOf("fence", "fence", {})) {
    const p = feetaLogic.validate(c.level).params;
    const a = malSetup(p, "area"); if (a) assert.equal(a.at, p.W * p.H - p.nw * p.nh);
    const b = malSetup(p, "border-squares"); if (b) { assert.ok(p.grid); if (!p.nw) assert.equal(b.at, 2 * (p.W + p.H) - 4, "each corner square once: 4 short"); }
    const l = malSetup(p, "labelled-only"); if (l) assert.ok(p.labels.length && l.at < 2 * (p.W + p.H));
  }
  for (const c of levelsOf("compare", "order", { u: "km", forms: ["big", "small", "mixed"] })) {
    const p = feetaLogic.validate(c.level).params;
    const iu = malSetup(p, "ignore-units");
    if (iu) { assert.ok(p.items.every((l) => !(l.big && l.small))); const n = iu.order.map((i) => p.items[i].big || p.items[i].small); assert.deepEqual(n, [...n].sort((x, y) => x - y)); }
    const cc = malSetup(p, "concat"); if (cc) assert.ok(p.items.some((l) => l.big && l.small));
  }
});

test("feeta: no idea-free set-up wins (the ruler's end number, the big number alone, the labelled sides added, the lanes as they stand or reversed)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const level = feetaLogic.validate(c.level), p = level.params;
    if (goal === "ribbon") { assert.ok(!replayCheck(level, [{ kind: "mark", at: p.b }, { kind: "run" }]).ok); assert.ok(!replayCheck(level, [{ kind: "mark", at: p.max }, { kind: "run" }]).ok); }
    if (goal === "rope" || goal === "odo") for (const at of [p.big, p.small, p.big + p.small]) assert.ok(!replayCheck(level, [{ kind: "mark", at }, { kind: "run" }]).ok, `${c.signature} ${at}`);
    if (goal === "fence") {
      const L = sideLens(p), tries = [p.W * p.H - p.nw * p.nh, p.W + p.H, p.labels.reduce((t, i) => t + L[i], 0)].filter((x) => x > 0);
      for (const at of tries) assert.ok(!replayCheck(level, [{ kind: "mark", at }, { kind: "run" }]).ok, `${c.signature} fence ${at}`);
    }
    if (goal === "order") {
      const lanes = p.items.map((_, i) => i);
      for (const o of [lanes, [...lanes].reverse()]) assert.ok(!replayCheck(level, [...o.map((lane, at) => ({ kind: "put", lane, at })), { kind: "run" }]).ok, `${c.signature}: ${o}`);
    }
  }
});

test("feeta: the law's rules (the instrument stays on its scale; run needs a set-up; a change starts a fresh run; the rack swaps)", () => {
  const rope = feetaLogic.validate(feetaLogic.generate(req("measure", "rope", 11))[0].level);
  let s = feetaLogic.init(rope);
  const ap = (lv, a) => { const r = feetaLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  assert.equal(ap(rope, { kind: "run" }), "mark_first");
  for (const bad of [{ kind: "mark", at: 0 }, { kind: "mark", at: 401 }, { kind: "mark", at: 2.5 }, { kind: "mark", at: "9" + "x" }]) assert.equal(ap(rope, bad), "off_tape");
  assert.equal(ap(rope, { kind: "put", lane: 0, at: 0 }), "no_rack");
  ap(rope, { kind: "mark", at: 7 }); assert.equal(s.at, 7);
  assert.equal(ap(rope, { kind: "mark", at: 7 }), "same_mark");
  ap(rope, { kind: "run" }); assert.ok(s.ended && !s.done);
  assert.equal(ap(rope, { kind: "run" }), "change_first");
  ap(rope, { kind: "undo" }); assert.ok(!s.ended && s.at === 0, "undo takes back the last change (a run is not a change)");
  ap(rope, { kind: "mark", at: rope.params.big * 100 + rope.params.small });
  assert.equal(ap(rope, { kind: "run" }), undefined); assert.ok(s.done);
  assert.equal(ap(rope, { kind: "mark", at: 9 }), "level_over");
  assert.deepEqual(hiddenOf(rope), [String(rope.params.big * 100 + rope.params.small)], "the teacher never says the rope's cm");
  const ord = feetaLogic.validate(feetaLogic.generate(req("compare", "order", 4, { grammar: { u: "m", forms: ["big", "small"] } }))[0].level);
  s = feetaLogic.init(ord);
  assert.equal(ap(ord, { kind: "run" }), "rack_first");
  assert.equal(ap(ord, { kind: "mark", at: 3 }), "no_tape");
  ap(ord, { kind: "put", lane: 0, at: 0 }); ap(ord, { kind: "put", lane: 1, at: 0 });
  assert.equal(s.order[0], 1, "a length put in a taken slot takes it"); assert.equal(s.order.indexOf(0), -1, "the one there goes back to its lane");
  ap(ord, { kind: "put", lane: 0, at: 1 }); ap(ord, { kind: "put", lane: 0, at: 0 });
  assert.deepEqual(s.order.slice(0, 2), [0, 1], "two lengths on the rack swap");
  assert.equal(ap(ord, { kind: "put", lane: 0, at: 0 }), "same_slot");
  assert.equal(ap(ord, { kind: "put", lane: 9, at: 0 }), "bad_slot");
});

test("feeta: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}, fade = 2) => feetaLogic.generate(req(mode, goal, 6, { grammar, fade }))[0].level;
  const rib = g("measure", "ribbon"), rope = g("measure", "rope"), fence = g("fence", "fence", { shapes: ["rect"] }), lf = g("fence", "fence", { shapes: ["L"] }, 3), odo = g("trip", "odo"), ord = g("compare", "order", { u: "km", forms: ["big", "small", "mixed"] });
  for (const lv of [rib, rope, fence, lf, odo, ord]) assert.ok(feetaLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [rib, { from: 0 }], [rib, { a: 0, from: 0 }], [rib, { b: rib.params.a + 2 }], [rib, { b: rib.params.from + 16 }], [rib, { max: 20 }], [rib, { look: 4 }], [rib, { big: 1 }], [rib, { goal: "rope" }],
    [rope, { small: 100 }], [rope, { small: 0 }], [rope, { big: 4 }], [rope, { u: "km" }], [rope, { max: 1000 }], [rope, { items: [{ big: 1, small: 0 }] }],
    [odo, { u: "m" }], [odo, { small: 1000 }], [odo, { big: 5 }], [odo, { W: 3 }],
    [fence, { labels: [] }], [fence, { labels: [0] }], [fence, { labels: [0, 1, 2, 3] }], [fence, { grid: false }], [fence, { W: 11 }], [fence, { nw: 1 }], [fence, { labels: [0, 0] }], [fence, { a: 1 }],
    [lf, { labels: [0, 1] }], [lf, { nw: lf.params.W }], [lf, { grid: true }],
    [ord, { items: ord.params.items.slice(0, 2) }], [ord, { items: [...ord.params.items.slice(1), ord.params.items[1]] }], [ord, { items: [...ord.params.items].sort((x, y) => (x.big * 1000 + x.small) - (y.big * 1000 + y.small)) }],
    [ord, { items: [{ big: 1, small: 1000 }, ...ord.params.items.slice(1)] }], [ord, { u: "" }], [ord, { max: 5 }],
  ]) assert.equal(feetaLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  assert.equal(feetaLogic.validate({ ...rib, mode: "fence" }), null, "a goal belongs to its mode");
  assert.equal(feetaLogic.validate({ ...rib, params: null }), null);
});

test("feeta: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = feetaLogic.validate(feetaLogic.generate(req("trip", "odo", 4))[0].level);
  const forged = feetaLogic.grade(level, sanitizeActs(env([{ kind: "mark", at: 5, correct: true }, { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = feetaLogic.grade(level, env(feetaLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "mark", at: 5 }, { kind: "run" }, ...feetaLogic.solve(level)];
  const g = feetaLogic.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(feetaLogic.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per case: the law never throws; whenever a run ends the law's verdict equals the checker's on the
// checker's OWN copy of the set-up (fed every act the law accepted); the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`feeta/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws; generator p95 ≤ 50 ms`, () => {
    let seed = 17, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let gi = 0; gi < 40; gi++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = cpuNow(); cands = feetaLogic.generate(req(mode, goal, 100 + gi, { grammar, fade: 1 + (gi % 3) })); best = Math.min(best, cpuNow() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 4)) {
        const level = feetaLogic.validate(c.level), p = level.params, sol = feetaLogic.solve(level), n = p.items.length;
        let s = feetaLogic.init(level), k = 0;
        const chk = checker(p), pursue = rnd() < 0.4;
        for (let i = 0; i < 60 && !s.done; i++) {
          const r = rnd(), x = rnd();
          // near the answer half the time, so solves and near misses both happen
          const near = sol[0].kind === "mark" ? sol[0].at + Math.round((rnd() - 0.5) * 6) : 1;
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.25 ? { kind: "mark", at: x < 0.5 ? near : Math.floor(rnd() * (p.max + 2)), ...(rnd() < 0.2 ? { correct: true } : {}) }
            : r < 0.5 ? { kind: "put", lane: Math.floor(x * Math.max(1, n)), at: Math.floor(rnd() * Math.max(1, n)) }
            : r < 0.85 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = feetaLogic.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, verdict(p, chk.st), `${level.levelId}: law and checker disagree (${JSON.stringify(chk.st)})`);
          }
          s = out.state;
        }
        if (feetaLogic.goalMet(level, s)) { solved++; assert.ok(verdict(p, chk.st)); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

test("feeta: every word the view shows exists in all three languages; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/feeta/feeta.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(feeta\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = ["ribbon", "rope", "fence", "odo", "order"].map((g) => `feeta.goal.${g}`).concat(["feeta.cut", "feeta.ride", "feeta.roll", "feeta.rope", "feeta.trip", "feeta.again"]);
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/feeta/feeta.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every feeta coverage entry serves a proven level at every fade (levelsFor and currentLevel); the
// solver's acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const FE = () => coverage().entries.filter((e) => e.family === "feeta");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("feeta coverage: the six authored entries, mapped to real kit misconceptions; the four length topics are feeta's now", () => {
  assert.deepEqual(FE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c4-maths-ch06-t01|measure|ribbon", "c4-maths-ch06-t01|measure|rope", "c4-maths-ch06-t01|compare|order", "c4-maths-ch06-t02|fence|fence",
    "c5-maths-ch05-t01|trip|odo", "c5-maths-ch05-t02|compare|order"]);
  for (const e of FE()) { assert.ok(Object.keys(e.misMap).length >= 1, e.topicId); for (const kit of Object.values(e.misMap)) assert.ok(kit.startsWith(`${e.topicId}-m-`), kit); }
  for (const sk of ["c4-maths-ch06-t01-s1", "c4-maths-ch06-t01-s2", "c4-maths-ch06-t02-s1", "c4-maths-ch06-t02-s2", "c4-maths-ch06-t02-s3",
    "c5-maths-ch05-t01-s1", "c5-maths-ch05-t01-s2", "c5-maths-ch05-t02-s1", "c5-maths-ch05-t02-s2"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "feeta", sk);
  }
});

for (const e of FE()) for (const fade of [1, 2, 3]) {
  test(`feeta server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "feeta" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.look, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(feetaLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && feetaLogic.malActs(level, m));
        const mg = gradeActs(level, env(feetaLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}
