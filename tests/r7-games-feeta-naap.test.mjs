// r7 Games, Feeta · naap: science measuring for class 6 (a thread along a curve and a map road; thermometers given their
// jobs, a lab thermometer read in warm water, children's clinical thermometers read in tenths; an eraser measured from a full
// mark with the eye above, foot-rulers along whole metres; things on a warmth shelf checked by a thermometer). Nothing ever
// runs on a clock. Pure law checks: every generated level validates, solves, and no idea-free set-up wins; an INDEPENDENT
// checker (its own geometry: the arc sampled through the circle of its three points; ranges and temperatures read out of the
// kit's own expectation text; foot-rulers laid one at a time) agrees with the law over random play; each mal-rule's acts
// land on its OWN misconception moment and fold the topic's kit id; every number the law uses is in the topic kit; tampered
// params are refused; a claim never decides; first levels differ across children; the generator and picker are fast (CPU);
// and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { naapLogic as L, NAAP_MAL, NAAP_MODES, MAL_OF, GOALS_OF, JOBS, CLINICAL, LAB, FEVER_TEMPS, FOOT, ITEMS, curveLen, pieceLen, laidLen, outOf, edgeOf, want, OFF } from "../src/play/families/feeta/naap.logic.ts";
import { feetaLogic } from "../src/play/families/feeta/feeta.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, MODES, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { cpuNow } from "./_cpu-ms.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const KIT = Object.fromEntries(JSON.parse(readFileSync(`${ROOT}data/kits/c6-science.json`, "utf8")).topics.map((t) => [t.topicId, t]));
const ALL = Object.fromEntries(NAAP_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "feeta", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [["thread", "curve", {}], ["thread", "map", { scales: [10, 20] }], ["thermo", "jobs", {}], ["thermo", "read", {}], ["thermo", "fever", {}], ["scale", "ruler", {}], ["scale", "foot", {}], ["touch", "feel", { kinds: ["room", "chai", "bowls"] }]];
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (none of the law's helpers) ─────────────────────────────
const expect = (id) => KIT[id].expectations.join(" ");
/** the kit's own numbers, read out of its expectation text (if the kit changes, these tests say so) */
const kitNum = {
  clinical: (() => { const m = expect("c6-science-ch07-t02").match(/about (\d+) °C to (\d+) °C/); return [Number(m[1]), Number(m[2])]; })(),
  lab: (() => { const m = expect("c6-science-ch07-t02").match(/usually ([−-]\d+) °C to (\d+) °C/); return [Number(m[1].replace("−", "-")), Number(m[2])]; })(),
};
/** an arc through P, its apex (the chord's midpoint pushed out by the sagitta along the left normal) and Q: the circle of the
 *  three points, sampled finely */
function arcSampled(P, Q, s) {
  if (!s) return Math.hypot(Q[0] - P[0], Q[1] - P[1]);
  const c = Math.hypot(Q[0] - P[0], Q[1] - P[1]), mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2, A = [mx - ((Q[1] - P[1]) / c) * s, my + ((Q[0] - P[0]) / c) * s];
  const d = 2 * (P[0] * (A[1] - Q[1]) + A[0] * (Q[1] - P[1]) + Q[0] * (P[1] - A[1]));
  const ux = ((P[0] ** 2 + P[1] ** 2) * (A[1] - Q[1]) + (A[0] ** 2 + A[1] ** 2) * (Q[1] - P[1]) + (Q[0] ** 2 + Q[1] ** 2) * (P[1] - A[1])) / d;
  const uy = ((P[0] ** 2 + P[1] ** 2) * (Q[0] - A[0]) + (A[0] ** 2 + A[1] ** 2) * (P[0] - Q[0]) + (Q[0] ** 2 + Q[1] ** 2) * (A[0] - P[0])) / d;
  const r = Math.hypot(P[0] - ux, P[1] - uy), ang = (X) => Math.atan2(X[1] - uy, X[0] - ux);
  // the sweep from P to Q that passes the apex
  const norm = (x) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const a0 = ang(P), toQ = norm(ang(Q) - a0), toA = norm(ang(A) - a0), sweep = toA < toQ ? toQ : toQ - 2 * Math.PI;
  let len = 0, prev = P;
  for (let i = 1; i <= 4000; i++) { const t = a0 + (sweep * i) / 4000, X = [ux + r * Math.cos(t), uy + r * Math.sin(t)]; len += Math.hypot(X[0] - prev[0], X[1] - prev[1]); prev = X; }
  return len;
}
const curveSampled = (p) => p.bend.reduce((t, b, i) => t + arcSampled(p.pts[i], p.pts[i + 1], b), 0);
/** the checker's own copy of the set-up, fed every act the law accepted (undo pops its own stack) */
function checker(p) {
  const n = p.goal === "jobs" ? p.jobs.length : p.goal === "fever" ? p.temps.length : p.goal === "feel" ? p.items.length : 0;
  const st = { tool: -1, pins: new Set(), lifted: false, lifts: 0, at: 0, place: Array(n).fill(-1), dipped: false, ever: false, start: null, eye: p.goal === "ruler" ? p.eye0 : 0 }, stack = [];
  const copy = () => ({ ...st, pins: new Set(st.pins), place: [...st.place] });
  return {
    st,
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push(copy());
      if (a.kind === "tool") { st.tool = a.t; st.pins = new Set(); }
      if (a.kind === "pin") st.pins.has(a.i) ? st.pins.delete(a.i) : st.pins.add(a.i);
      if (a.kind === "lift") { st.lifted = !st.lifted; if (st.lifted) st.lifts++; st.at = 0; }
      if (a.kind === "dip") { st.dipped = !st.dipped; st.ever = true; }
      if (a.kind === "slide") st.start = a.at;
      if (a.kind === "eye") st.eye = a.at;
      if (a.kind === "mark") st.at = a.at;
      if (a.kind === "put") st.place[a.lane] = a.at;
    },
  };
}
const WELL = [368, 370, 372];   // the kit's 36.8 and 37.2 feel well; about 37
const ORDER = { steelSpoon: 0, woodSpoon: 0, handle: 0, door: 0, bucket: 0, chai: 1, cold: 0, mid: 1, warm: 2 };
/** does this set-up meet the task? read from the params' plain meaning */
function verdict(p, st) {
  switch (p.goal) {
    case "curve": case "map": {
      const all = st.pins.size === p.pts.length, cm = Math.round(curveSampled(p) / 10);
      return st.tool === 0 && all && st.lifted && st.at === (p.goal === "map" ? cm * p.perCm : cm);
    }
    case "read": return st.dipped && st.at === p.T;
    case "ruler": return st.start !== null && st.start >= p.first && st.eye === 0 && st.at === p.len;
    case "foot": { let laid = 0, n = 0; while (laid + 30 <= p.L) { laid += 30; n++; } return st.at === n; }
    case "jobs": return p.jobs.every((j, i) => { const t = { body: 37, boil: 100, chai: 80, fridge: 5, tap: 26 }[j]; const [lo, hi] = st.place[i] === 0 ? kitNum.clinical : kitNum.lab; return st.place[i] >= 0 && t >= lo && t <= hi && (j === "body") === (st.place[i] === 0); });
    case "fever": return p.temps.every((t, i) => st.place[i] === (WELL.includes(t) ? 0 : 1));
    case "feel": return st.place.every((x) => x >= 0) && p.items.every((a, i) => p.items.every((b, j) => Math.sign(st.place[i] - st.place[j]) === Math.sign(ORDER[a] - ORDER[b])));
  }
}
const replayCheck = (level, acts) => { const k = checker(level.params); let s = L.init(level); for (const a of acts) { const r = L.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return { s, ok: verdict(level.params, k.st) }; };

test("naap: registered as feeta modes (MODES, logic, views, a verb that never chooses)", () => {
  assert.deepEqual([...MODES.feeta], ["measure", "fence", "trip", "compare", "thread", "thermo", "scale", "touch"]);
  assert.deepEqual([...NAAP_MODES], ["thread", "thermo", "scale", "touch"]);
  for (const m of NAAP_MODES) {
    assert.equal(LOGIC[`feeta/${m}`], L);
    const v = playActOf("feeta", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
  for (const m of ["measure", "fence", "trip", "compare"]) assert.equal(LOGIC[`feeta/${m}`], feetaLogic);
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8");
  for (const m of NAAP_MODES) assert.match(views, new RegExp(`"feeta/${m}": makeNaapView`));
  const data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).feeta;
  for (const m of MODES.feeta) assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json feeta/${m}`);
});

test("naap: every number the law uses is the topic kit's own", () => {
  assert.deepEqual([CLINICAL.lo, CLINICAL.hi], kitNum.clinical);
  assert.deepEqual([LAB.lo, LAB.hi], kitNum.lab);
  const t02 = JSON.stringify(KIT["c6-science-ch07-t02"]), t01 = JSON.stringify(KIT["c6-science-ch07-t01"]), l01 = JSON.stringify(KIT["c6-science-ch05-t01"]), l02 = JSON.stringify(KIT["c6-science-ch05-t02"]);
  assert.match(expect("c6-science-ch07-t02"), /about 37 °C/); assert.equal(JOBS.body, 37);
  assert.match(t02, /100 °C/); assert.equal(JOBS.boil, 100);
  assert.match(t02, /chai at ~80/); assert.equal(JOBS.chai, 80);
  assert.match(t02, /about 5 °C/); assert.equal(JOBS.fridge, 5);
  assert.match(t02, /so 26 °C/); assert.equal(JOBS.tap, 26);
  assert.match(t02, /36\.8 °C/); assert.match(t02, /37\.2 °C/); assert.match(t02, /38\.5 °C\), which is a fever/);
  assert.deepEqual([...FEVER_TEMPS], [368, 370, 372, 385]);
  assert.match(expect("c6-science-ch07-t02"), /0\.1 °C on a clinical thermometer and 1 °C on a lab thermometer/);
  assert.match(l01, /three 30 cm rulers/); assert.match(l01, /1 foot is about 30 cm/); assert.equal(FOOT, 30);
  assert.match(expect("c6-science-ch05-t02"), /1 cm = 10 km/); assert.match(l02, /1 cm = 20 km/);
  assert.match(expect("c6-science-ch07-t01"), /steel spoon and a wooden spoon are at the same temperature/);
  assert.match(expect("c6-science-ch07-t01"), /bucket of warm water has more heat than a cup of hot chai, but a lower temperature/);
  assert.match(t01, /almirah handle/); assert.match(t01, /lukewarm water feels warm/);
  for (const [id, it] of Object.entries(ITEMS)) assert.ok(id in ORDER && ORDER[id] === it.rank, id);
});

for (const [mode, goal, grammar] of CASES) {
  test(`naap ${mode}/${goal}: every level validates, solves, is shortcut-free, and the checker agrees; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length >= 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = L.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(L.shortcut(level), null, `${c.signature} shortcut`);
      const sol = L.solve(level), solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol).ok, `${c.signature}: the checker disagrees with the solver`);
      for (const mal of NAAP_MAL) {
        const acts = L.malActs(level, mal);
        if (!MAL_OF[goal].includes(mal)) { assert.equal(acts, null, `${goal} has no ${mal}`); continue; }
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts).ok, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`); assert.equal(mc[0].misconceptionId, mal);
        const g = L.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of MAL_OF[goal]) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("naap laws: the curve is longer than its chord; the law's arc length is the checker's; a thread pressed short of a bend runs straight; the band reads short", () => {
  for (const goal of ["curve", "map"]) for (const c of levelsOf("thread", goal, {}, [5, 11])) {
    const p = L.validate(c.level).params, n = p.pts.length - 1;
    assert.ok(Math.abs(curveLen(p) - curveSampled(p)) < 0.05, `${c.signature}: law ${curveLen(p)} vs sampled ${curveSampled(p)}`);
    const chord = Math.hypot(p.pts[n][0] - p.pts[0][0], p.pts[n][1] - p.pts[0][1]);
    assert.ok(curveLen(p) > chord + 15, "a curved path between two points is longer than the straight line (kit)");
    assert.ok(Math.abs(curveLen(p) / 10 - Math.round(curveLen(p) / 10)) < 0.05, "a whole number of cm");
    for (let i = 0; i < n; i++) if (p.bend[i]) assert.ok(pieceLen(p, i) > Math.hypot(p.pts[i + 1][0] - p.pts[i][0], p.pts[i + 1][1] - p.pts[i][1])), "an arc beats its chord";
    // skipping a bend's point can only shorten what the thread measures
    const all = p.pts.map((_, i) => i);
    for (let i = 1; i < n; i++) assert.ok(laidLen(p, 0, all.filter((x) => x !== i)) < laidLen(p, 0, all));
    assert.equal(laidLen(p, 2, all.slice(0, 2)), Math.hypot(p.pts[1][0] - p.pts[0][0], p.pts[1][1] - p.pts[0][1]), "a ruler lies straight");
    const lv = L.validate(c.level), band = L.malActs(lv, "band"), r = run(lv, band);
    assert.ok(r.s.at < want(p), "the shrunk band reads short (the kit: usually too short once it relaxes)");
    // and lifted again it reads differently (the kit: different readings each time)
    let s = r.s; for (const a of [{ kind: "lift" }, { kind: "lift" }]) s = L.apply(lv, s, a, 99).state;
    const shown = (st) => L.facts(lv, st).on_scale;
    assert.notEqual(shown(s), shown(r.s));
  }
});

test("naap laws: a thermometer shows only its range; out of the water the column leaves the water's reading; fever only at 38.5 °C; the eraser from its edge reads short; foot-rulers fit floor(L / 30)", () => {
  for (const c of levelsOf("thermo", "read", {}, [2, 9])) { const p = L.validate(c.level).params; assert.notEqual(outOf(p), p.T); assert.ok(outOf(p) < p.T && outOf(p) > p.lo); }
  for (const c of levelsOf("scale", "ruler", {}, [2, 9])) {
    const lv = L.validate(c.level), p = lv.params, m = L.malActs(lv, "edge-start");
    assert.equal(edgeOf(p), p.first ? p.first - 1 : -1);
    if (m) assert.equal(m.find((a) => a.kind === "mark").at, edgeOf(p) + p.len, "the end mark read from the ruler's edge");
    const se = L.malActs(lv, "side-eye"); if (se) assert.equal(Math.abs(se.find((a) => a.kind === "mark").at - p.len), 1, "from the side, one mark away");
  }
  for (const L0 of [100, 150, 200, 250, 300]) { let laid = 0, n = 0; while (laid + FOOT <= L0) { laid += FOOT; n++; } assert.equal(want({ goal: "foot", look: 1, L: L0 }), n); }
  assert.equal(want({ goal: "foot", look: 1, L: 100 }), 3, "a metre is three foot-rulers and a little extra (kit)");
});

test("naap: the law's rules (a tool before points, a ruler rests on two, straighten before reading, dip before writing, the eraser placed, everyone on a bench)", () => {
  const g = (mode, goal, grammar = {}, seed = 6) => L.validate(L.generate(req(mode, goal, seed, { grammar }))[0].level);
  let s;
  const ap = (lv, a) => { const r = L.apply(lv, s, a, 1); s = r.state; return r.refused; };
  const cur = g("thread", "curve"); s = L.init(cur);
  assert.equal(ap(cur, { kind: "pin", i: 0 }), "tool_first");
  assert.equal(ap(cur, { kind: "lift" }), "press_first");
  assert.equal(ap(cur, { kind: "run" }), "lift_first");
  ap(cur, { kind: "tool", t: 2 }); ap(cur, { kind: "pin", i: 0 }); ap(cur, { kind: "pin", i: 1 });
  assert.equal(ap(cur, { kind: "pin", i: 2 }), "ruler_straight");
  assert.equal(ap(cur, { kind: "mark", at: 5 }), "lift_first");
  ap(cur, { kind: "lift" }); assert.ok(s.lifted);
  assert.equal(ap(cur, { kind: "pin", i: 2 }), "lay_again_first");
  assert.equal(ap(cur, { kind: "tool", t: 0 }), "lay_again_first");
  assert.equal(ap(cur, { kind: "mark", at: 23 }), "off_counter");
  assert.equal(ap(cur, { kind: "dip" }), "no_liquid");
  assert.equal(ap(cur, { kind: "put", lane: 0, at: 0 }), "no_bins");
  const rd = g("thermo", "read"); s = L.init(rd);
  ap(rd, { kind: "mark", at: rd.params.T });
  assert.equal(ap(rd, { kind: "run" }), "dip_first");
  ap(rd, { kind: "dip" }); assert.equal(ap(rd, { kind: "run" }), undefined); assert.ok(s.done);
  const ru = g("scale", "ruler"); s = L.init(ru);
  ap(ru, { kind: "mark", at: ru.params.len });
  assert.equal(ap(ru, { kind: "run" }), "place_first");
  assert.equal(ap(ru, { kind: "slide", at: edgeOf(ru.params) - 1 }), "off_ruler");
  assert.equal(ap(ru, { kind: "eye", at: 2 }), "bad_eye");
  ap(ru, { kind: "slide", at: ru.params.first });
  assert.equal(ap(ru, { kind: "run" }), "missed", "the eye starts to one side");
  ap(ru, { kind: "eye", at: 0 }); assert.equal(ap(ru, { kind: "run" }), undefined); assert.ok(s.done);
  const fv = g("thermo", "fever"); s = L.init(fv);
  ap(fv, { kind: "put", lane: 0, at: 1 });
  assert.equal(ap(fv, { kind: "run" }), "place_all_first");
  assert.equal(ap(fv, { kind: "put", lane: 0, at: 1 }), "same_slot");
  assert.equal(ap(fv, { kind: "put", lane: 0, at: 2 }), "bad_slot");
  ap(fv, { kind: "undo" }); assert.equal(s.place[0], -1, "undo takes back the last change");
  assert.deepEqual(hiddenOf(cur), [String(want(cur.params))], "the teacher never says the curve's length");
  assert.deepEqual(hiddenOf(rd), [String(rd.params.T)]);
  assert.ok(hiddenOf(fv).length >= 2);
});

test("naap: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}, fade = 2) => L.generate(req(mode, goal, 6, { grammar, fade }))[0].level;
  const cur = g("thread", "curve"), map = g("thread", "map"), jobs = g("thermo", "jobs"), rd = g("thermo", "read"), fv = g("thermo", "fever"), ru = g("scale", "ruler"), ru3 = g("scale", "ruler", {}, 3), ft = g("scale", "foot"), fe = g("touch", "feel");
  for (const lv of [cur, map, jobs, rd, fv, ru, ru3, ft, fe]) assert.ok(L.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  const P = cur.params;
  for (const [lv, patch] of [
    [cur, { bend: P.bend.map(() => 5) }], [cur, { bend: P.bend.map((b) => (b ? b : 3)) }], [cur, { pts: P.pts.map(([x, y]) => [x * 1.1, y]) }], [cur, { pts: [[0, 0], [1, 1], [2, 2], [3, 3]] }],
    [cur, { perCm: 10 }], [cur, { max: 30 }], [cur, { look: 4 }], [cur, { T: 30 }], [cur, { goal: "map" }], [map, { perCm: 15 }], [map, { perCm: 0 }],
    [jobs, { jobs: ["boil", "chai", "tap"] }], [jobs, { jobs: ["body", "body", "body", "tap"] }], [jobs, { jobs: ["body", "tap", "tap"] }], [jobs, { jobs: ["body", "lava", "tap"] }],
    [rd, { T: 40 }], [rd, { T: 60 }], [rd, { lo: rd.params.lo + 5 }], [rd, { lo: rd.params.T }],
    [fv, { temps: [370, 368, 372] }], [fv, { temps: [385, 385, 385] }], [fv, { temps: [371, 385, 370] }],
    [ru, { first: 2 }], [ru3, { first: 0 }], [ru3, { first: 5 }], [ru, { eye0: 0 }], [ru, { len: 2 }], [ru, { len: 16 }],
    [ft, { L: 120 }], [ft, { L: 350 }],
    [fe, { kind: "chai", items: ["chai", "steelSpoon"] }], [fe, { kind: "room", items: ["steelSpoon", "handle"] }], [fe, { kind: "bowls", items: ["cold", "warm"] }], [fe, { extra: 1 }],
  ]) assert.equal(L.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  assert.equal(L.validate({ ...cur, mode: "thermo" }), null, "a goal belongs to its mode");
  assert.equal(L.validate({ ...cur, params: null }), null);
});

test("naap: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = L.validate(L.generate(req("thermo", "read", 4))[0].level);
  const forged = L.grade(level, sanitizeActs(env([{ kind: "mark", at: 5, correct: true }, { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved"); assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = L.grade(level, env(L.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "dip" }, { kind: "mark", at: level.params.T + 5 }, { kind: "run" }, { kind: "mark", at: level.params.T }, { kind: "run" }];
  const g = L.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(L.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per goal: the law never throws; whenever a run ends the law's verdict equals the checker's on the
// checker's OWN copy of the set-up (fed every act the law accepted)
for (const [mode, goal, grammar] of CASES) {
  test(`naap ${mode}/${goal}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws`, () => {
    let seed = 23, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const KINDS = { curve: ["tool", "pin", "lift", "mark"], map: ["tool", "pin", "lift", "mark"], read: ["dip", "mark"], ruler: ["slide", "eye", "mark"], foot: ["mark"], jobs: ["put"], fever: ["put"], feel: ["put"] }[goal];
    for (let gi = 0; gi < 30; gi++) {
      for (const c of L.generate(req(mode, goal, 200 + gi, { grammar, fade: 1 + (gi % 3) })).slice(0, 3)) {
        const level = L.validate(c.level), p = level.params, sol = L.solve(level);
        let s = L.init(level), k = 0;
        const chk = checker(p), pursue = rnd() < 0.5;
        for (let i = 0; i < 70 && !s.done; i++) {
          const r = rnd(), kind = KINDS[Math.floor(rnd() * KINDS.length)];
          const near = sol.find((a) => a.kind === "mark")?.at ?? 1;
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.15 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : r < 0.22 ? { kind: "undo" }
            : kind === "tool" ? { kind, t: Math.floor(rnd() * 3) } : kind === "pin" ? { kind, i: Math.floor(rnd() * (p.pts?.length ?? 4)) }
            : kind === "mark" ? { kind, at: rnd() < 0.6 ? near + Math.round((rnd() - 0.5) * 4) : Math.floor(rnd() * 30), ...(rnd() < 0.2 ? { correct: true } : {}) }
            : kind === "slide" ? { kind, at: Math.floor(rnd() * 14) - 1 } : kind === "eye" ? { kind, at: Math.floor(rnd() * 3) - 1 }
            : kind === "put" ? { kind, lane: Math.floor(rnd() * 4), at: Math.floor(rnd() * 4) } : { kind };
          const before = s, out = L.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) { judged++; assert.equal(out.state.done, verdict(p, chk.st), `${level.levelId}: law and checker disagree`); }
          s = out.state;
        }
        if (L.goalMet(level, s)) { solved++; assert.ok(verdict(p, chk.st)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
  });
}

test("naap: the generator and the picker are fast (CPU time, p95 ≤ 50 ms)", () => {
  const gen = [], pick = [];
  for (const [mode, goal, grammar] of CASES) for (const fade of [1, 3]) for (let seed = 1; seed <= 6; seed++) {
    let t0 = cpuNow(); L.generate(req(mode, goal, seed * 31, { grammar, fade })); gen.push(cpuNow() - t0);
    t0 = cpuNow(); pickLevels(L, req(mode, goal, seed * 31, { grammar, fade })); pick.push(cpuNow() - t0);
  }
  for (const [name, xs] of [["generate", gen], ["pick", pick]]) { xs.sort((a, b) => a - b); const p95 = xs[Math.floor(xs.length * 0.95)]; assert.ok(p95 <= 50, `${name} p95 ${p95.toFixed(1)} ms`); }
});

test("naap: every word the view shows exists in all three languages and none is an economy word; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/feeta/naap.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(feeta\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = [...Object.values(GOALS_OF).flat().map((g) => `feeta.goal.${g}`), ...["thread", "band", "ruler"].map((t) => `feeta.tool.${t}`), ...Object.keys(JOBS).map((j) => `feeta.job.${j}`), ...Object.keys(ITEMS).map((i) => `feeta.item.${i}`),
    ...["cold", "lesscold", "hot", "warm", "both"].map((f) => `feeta.feels.${f}`), "feeta.done", "feeta.write", "feeta.dipall", "feeta.check", "feeta.lay", "feeta.thermo", "feeta.again"];
  assert.ok(used.length >= 15);
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) { assert.ok(words[k]?.[l], `${k} ${l}`); assert.doesNotMatch(words[k][l], ECON, k); }
  const logic = readFileSync(`${ROOT}src/play/families/feeta/naap.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|performance\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every naap coverage entry serves a proven level at every fade; the solver's acts grade solved through the
// server; a claim never solves; a mal-rule the level discriminates folds its kit id
const NE = () => coverage().entries.filter((e) => e.family === "feeta" && NAAP_MODES.includes(e.mode));
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("naap coverage: the eight authored entries, mapped to the topics' verified kit misconceptions; the two quiz-only topics are no longer arena-only", () => {
  assert.deepEqual(NE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c6-science-ch05-t02|thread|curve", "c6-science-ch05-t02|thread|map", "c6-science-ch07-t02|thermo|jobs", "c6-science-ch07-t02|thermo|read", "c6-science-ch07-t02|thermo|fever",
    "c6-science-ch05-t01|scale|ruler", "c6-science-ch05-t01|scale|foot", "c6-science-ch07-t01|touch|feel"]);
  for (const e of NE()) {
    assert.ok(Object.keys(e.misMap).length >= 1, e.topicId);
    for (const [mal, kit] of Object.entries(e.misMap)) {
      assert.ok(MAL_OF[e.goal].includes(mal), `${e.goal} ${mal}`);
      assert.ok(KIT[e.topicId].misconceptions.some((m) => m.id === kit), `${kit} is the kit's`);
    }
  }
  const mapped = new Set(NE().flatMap((e) => Object.values(e.misMap)));
  for (const t of ["c6-science-ch05-t01", "c6-science-ch05-t02", "c6-science-ch07-t01", "c6-science-ch07-t02"]) for (const m of ["m1", "m2", "m3"]) assert.ok(mapped.has(`${t}-${m}`), `${t}-${m} mapped`);
  for (const sk of ["c6-science-ch05-t02-s1", "c6-science-ch05-t02-s3", "c6-science-ch07-t02-s1", "c6-science-ch07-t02-s2", "c6-science-ch07-t02-s3", "c6-science-ch05-t01-s1", "c6-science-ch05-t01-s2", "c6-science-ch07-t01-s1", "c6-science-ch07-t01-s3"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "feeta", sk);
  }
  const cov = coverage();
  assert.ok(!cov.arenaOnly.includes("c6-science-ch05-t02") && !cov.arenaOnly.includes("c6-science-ch07-t02"));
  assert.equal(cov.counts.arenaOnlyClass4to7, 0);
});

for (const e of NE()) for (const fade of [1, 2, 3]) {
  test(`naap server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "feeta" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.look, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(L.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && L.malActs(level, m));
        const mg = gradeActs(level, env(L.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      assert.ok(Array.isArray(hiddenOf(level)));
    }
  });
}

// r7 (main, 2026-11-08): the picker is deterministic (base − 2.2·|p − band|), so without the seeded difficulty nudge one
// level would be every child's first level of a goal
test("naap: the first level served differs across children", () => {
  const FLOOR = { curve: 15, map: 15, jobs: 10, read: 8, fever: 8, ruler: 10, foot: 3, feel: 5 };
  for (const e of NE()) for (const fade of [1, 3]) {
    const sigs = new Set();
    for (let c = 0; c < 20; c++) { const child = `var-${c}`; sigs.add(currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e).sig); }
    assert.ok(sigs.size >= FLOOR[e.goal], `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children (floor ${FLOOR[e.goal]})`);
  }
  // every room / chai / bowls story is served somewhere
  const e = NE().find((x) => x.goal === "feel"), kinds = new Set();
  for (let c = 0; c < 40; c++) kinds.add(currentLevel(sessionOf(e, { childId: `k-${c}`, seed: seedOf(`k-${c}`, entryKey(e), 0) }), e).params.kind);
  assert.deepEqual([...kinds].sort(), ["bowls", "chai", "room"]);
});

test("naap: the eraser's start positions and a tool's points come back as they were set (no hidden state beyond the set-up)", () => {
  const lv = L.validate(L.generate(req("scale", "ruler", 3))[0].level);
  assert.equal(L.init(lv).start, OFF);
  assert.equal(L.init(lv).eye, lv.params.eye0);
});
