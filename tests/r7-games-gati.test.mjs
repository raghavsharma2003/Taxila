// r7 Games, Gati: motion for classes 6 and 7 (a reference point, the types of motion, more than one at once; comparing
// speeds, speed = distance ÷ time, km/h to m/s; uniform and non-uniform from chalk marks). Nothing ever runs on a clock: time
// moves one interval per tap of the child. Pure law checks: every generated level validates, solves, and no idea-free set-up
// wins; an INDEPENDENT checker (its own story table; a thing's type read from its sampled path alone: does it go along a
// line, wind all the way round, or turn back; the kit's own 1000 m ÷ 3600 s) agrees with the law over random play; each
// mal-rule's acts land on its OWN misconception moment and fold the topic's kit id; every fact-number is in the topic kit;
// tampered params are refused; a claim never decides; first levels differ across children; the generator and picker are
// fast (CPU); and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  gatiLogic as L, GATI_MAL, GATI_MODES, GOALS_OF, MAL_OF, KMH_TO_MS, msOf, TYPES, PRAKAAR, DOGATI, PERIOD, prakaarAt, dogatiAt, STORY_THINGS, RIDES, FIXED, KIT_THINGS, tMaxOf, tNeedOf, UNITS,
  ghostOf, namesShown, sameTimeMarks, posOf, fasterOf, fartherOf,
} from "../src/play/families/gati/gati.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { counted } from "./_work.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const KIT = Object.fromEntries(["c6-science", "c7-science"].flatMap((f) => JSON.parse(readFileSync(`${ROOT}data/kits/${f}.json`, "utf8")).topics).map((t) => [t.topicId, t]));
const ALL = Object.fromEntries(GATI_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "gati", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = Object.entries(GOALS_OF).flatMap(([mode, goals]) => goals.map((goal) => [mode, goal]));
const levelsOf = (mode, goal, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { fade }))) out.push(c);
  return out;
};
const expect = (id) => KIT[id].expectations.join(" ");

// ───────────────────────────── THE INDEPENDENT CHECKER (none of the law's helpers but the motion itself) ─────────────────────────────
/** the checker's own story table: what each thing rides, and whether that vehicle moves */
const VEHICLE = { passenger: "train", seat: "train", platform: "ground", sign: "ground", man: "ground", rider: "bus", boy: "bus", aman: "ground", tree: "ground", stop: "ground", mytrain: "ground", other: "train2" };
const MOVES = { train: true, bus: true, train2: true, ground: false };
const restCheck = (target, ref) => VEHICLE[target] === VEHICLE[ref] || (!MOVES[VEHICLE[target]] && !MOVES[VEHICLE[ref]]);
/** a path's motion types, read from the sampled path alone: along a line without turning back (linear), all the way round a
 *  centre (circular), turning back on itself (oscillatory) */
function typesOfPath(at, centre) {
  const pts = []; for (let t = 0; t <= 24; t += 0.02) pts.push(at(t));
  const steps = pts.slice(1).map((q, i) => [q[0] - pts[i][0], q[1] - pts[i][1]]).filter(([x, y]) => Math.hypot(x, y) > 1e-7);
  const out = new Set();
  if (!steps.length) return out;
  let back = false; for (let i = 1; i < steps.length; i++) if (steps[i][0] * steps[i - 1][0] + steps[i][1] * steps[i - 1][1] < 0) back = true;
  let wind = 0; for (let i = 1; i < pts.length; i++) { const a0 = Math.atan2(pts[i - 1][1] - centre[1], pts[i - 1][0] - centre[0]), a1 = Math.atan2(pts[i][1] - centre[1], pts[i][0] - centre[0]); let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; wind += d; }
  const [p0, pn] = [pts[0], pts[pts.length - 1]], L0 = Math.hypot(pn[0] - p0[0], pn[1] - p0[1]);
  const line = L0 > 0.1 && pts.every((q) => Math.abs((q[0] - p0[0]) * (pn[1] - p0[1]) - (q[1] - p0[1]) * (pn[0] - p0[0])) / L0 < 1e-6);
  if (line && !back) out.add(0);
  if (Math.abs(wind) >= 2 * Math.PI - 0.05) out.add(1);
  if (back) out.add(2);
  return out;
}
/** the checker's verdict on a do-gati thing: linear if its base moves over the ground; circular if its point winds round the
 *  base (from the ground or riding along); oscillatory if, riding along, the point turns back on itself */
function dogatiTypes(th, ph) {
  const out = new Set();
  const base0 = (t) => dogatiAt(th, ph, t, 0).base, b0 = base0(0), b1 = base0(10);
  if (Math.hypot(b1[0] - b0[0], b1[1] - b0[1]) > 0.1) out.add(0);
  const rel = (f) => (t) => { const a = dogatiAt(th, ph, t, f); return [a.pt[0] - a.base[0], a.pt[1] - a.base[1]]; };
  for (const f of [0, 1]) if (typesOfPath(rel(f), [0, 0]).has(1)) out.add(1);
  if (typesOfPath(rel(1), [0, 0]).has(2)) out.add(2);
  return out;
}
/** the kit's own conversion, read from its text: 1 km/h = 1000 m ÷ 3600 s */
const kitConv = (() => { const m = expect("c7-science-ch08-t02").match(/1 km\/h = (\d+) m ÷ (\d+) s/); return { m: Number(m[1]), s: Number(m[2]) }; })();
/** the checker's verdict on a set-up (its own copy, fed every act the law accepted) */
function verdict(p, st) {
  switch (p.goal) {
    case "sandarbh": return p.refs.every((r, i) => st.place[i] === (restCheck(p.target, r) ? 0 : 1));
    case "prakaar": return p.things.every((th, i) => { const ts = typesOfPath((t) => prakaarAt(th, p.phase[i], t), [0, 0]); return ts.size === 1 && ts.has(st.place[i]); });
    case "do-gati": return p.things.every((th, i) => { const ts = dogatiTypes(th, (p.phase[i] * Math.PI) / 6); return [0, 1, 2].every((ty) => ts.has(ty) === !!(st.tags[i] & (1 << ty))); });
    case "aage": { const after1 = p.movers.map((m) => m.v * Math.min(1, m.T)); return after1[st.pick] > after1[1 - st.pick]; }
    case "nikaalo": return st.at * p.legs.length === p.legs.reduce((a, b) => a + b, 0);
    case "badlo": return st.at * kitConv.s === p.kmh * kitConv.m;
    case "ek-saa": return p.movers.every((m, i) => st.place[i] === (new Set(m.gaps).size === 1 ? 0 : 1));
  }
}
function checker(p) {
  const n = p.goal === "sandarbh" ? p.refs.length : p.things?.length ?? p.movers?.length ?? 0;
  const st = { place: Array(n).fill(-1), tags: Array(n).fill(0), pick: -1, at: 0 }, stack = [];
  return {
    st,
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push({ ...st, place: [...st.place], tags: [...st.tags] });
      if (a.kind === "put") st.place[a.lane] = a.at;
      if (a.kind === "tag") st.tags[a.lane] ^= 1 << a.at;
      if (a.kind === "pick") st.pick = a.lane;
      if (a.kind === "mark") st.at = a.at;
    },
  };
}
const replayCheck = (level, acts) => { const k = checker(level.params); let s = L.init(level); for (const a of acts) { const r = L.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return verdict(level.params, k.st); };

test("gati: registered as a family (FAMILIES, MODES, arts, logic, views, verbs that never choose)", () => {
  assert.ok(FAMILIES.includes("gati"));
  assert.deepEqual([...MODES.gati], ["drishti", "raftaar", "nishaan"]);
  assert.deepEqual([...GATI_MODES], [...MODES.gati]);
  assert.ok(FAMILY_ARTS.gati.length >= 2);
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8");
  const data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).gati;
  for (const m of MODES.gati) {
    assert.equal(LOGIC[`gati/${m}`], L);
    assert.match(views, new RegExp(`"gati/${m}": makeGatiView`));
    const v = playActOf("gati", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
    assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json gati/${m}`);
  }
});

test("gati: every fact-number and named fact the law uses is the topic kit's own", () => {
  const t02 = expect("c7-science-ch08-t02"), t03 = expect("c6-science-ch05-t03"), u03 = expect("c7-science-ch08-t03");
  // 1 km/h = 1000 m ÷ 3600 s = 5/18 m/s; for example, 36 km/h = 10 m/s
  assert.match(t02, /1 km\/h = 1000 m ÷ 3600 s = 5\/18 m\/s/);
  assert.deepEqual([KMH_TO_MS.num, KMH_TO_MS.den], [5, 18]);
  assert.match(t02, /36 km\/h = 10 m\/s/); assert.equal(msOf(36), 10);
  assert.equal(KMH_TO_MS.num / KMH_TO_MS.den, kitConv.m / kitConv.s, "5/18 is 1000 ÷ 3600");
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
  for (const l of ["hinglish", "en", "hi"]) assert.ok(t02.includes(words["gati.kit.convert"][l]), "the conversion shown is the kit's sentence");
  // every number in any gati word is a slot or the kit's
  for (const [k, v] of Object.entries(words)) if (k.startsWith("gati.")) for (const l of ["hinglish", "en", "hi"]) for (const n of v[l].replace(/\{\w+\}/g, "").match(/\d+(\/\d+)?/g) ?? []) assert.ok(n === "1" || t02.includes(n), `${k} ${l}: ${n} is not the kit's`);
  // the units the speeds are given in: the kit's m/s and km/h (and its own "metres per minute" item)
  assert.match(t02, /metres per second \(m\/s\)/); assert.match(t02, /kilometres per hour \(km\/h\)/);
  assert.match(JSON.stringify(KIT["c7-science-ch08-t02"]), /m per minute/);
  assert.deepEqual(Object.values(UNITS).map((u) => u.v), ["km/h", "m/s", "m/min"]);
  // speed = distance ÷ time; average speed = total distance ÷ total time
  assert.match(t02, /Speed = distance ÷ time/); assert.match(t02, /average speed = total distance ÷ total time/);
  // the three types the kit names, and the things it gives as their examples
  for (const [i, ty] of TYPES.entries()) assert.match(t03, new RegExp(`${ty[0].toUpperCase()}${ty.slice(1)} motion`), ty), assert.equal(i, TYPES.indexOf(ty));
  const K03 = JSON.stringify(KIT["c6-science-ch05-t03"]).toLowerCase();
  const SAY = { train: /a train on a straight track/, drop: /a ball dropped straight down/, slide: /straight slide/, wheel: /giant wheel/, fan: /fan blade/, clock: /clock'?s hand/, swing: /a swing/, pendulum: /pendulum/, boat: /boat ride that swings/, string: /plucked (sitar )?string/ };
  for (const th of Object.keys(PRAKAAR)) assert.match(K03, SAY[th], th);
  assert.match(K03, /linear motion is along a straight line \(a train on a straight track, a ball dropped straight down\)/);
  assert.match(K03, /circular motion is along a circular path \(a seat on a giant wheel, the tip of a fan blade\)/);
  assert.match(K03, /oscillatory motion is to and fro about a central position \(a swing, a pendulum, a plucked string\)/);
  assert.match(K03, /a rolling bicycle wheel turns round while the bicycle moves straight ahead/);
  assert.match(K03, /horses go round \(circular\) and up and down \(oscillatory\)/);
  assert.deepEqual([...DOGATI.bicycle], [0, 1]); assert.deepEqual([...DOGATI.horse], [1, 2]);
  assert.match(K03, /passenger is at rest relative to the train seat but moving relative to the platform/);
  assert.match(K03, /bus stop/); assert.match(K03, /aman/); assert.match(K03, /train on the next track starts moving/);
  // the things look 1's sandarbh scenes use: each is named in the kit's own scenes
  const SCENE = { passenger: /passenger/, seat: /train seat/, platform: /platform/, sign: /a signboard/, rider: /sits in a moving bus/, boy: /the boy sitting next to/, aman: /aman stands at the bus stop/, stop: /bus stop/, tree: /a tree beside the road/, mytrain: /you sit in a train standing still at the platform/, other: /the train on the next track/ };
  assert.deepEqual(Object.keys(SCENE).sort(), [...KIT_THINGS].sort());
  for (const [t, re] of Object.entries(SCENE)) assert.match(K03, re, t);
  // uniform: equal distances in equal intervals of time
  assert.match(u03, /covering equal distances in equal intervals of time/); assert.match(u03, /unequal distances in equal intervals of time/);
});

for (const [mode, goal] of CASES) {
  test(`gati ${mode}/${goal}: every level validates, solves, is shortcut-free, and the checker agrees; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal);
    assert.ok(cands.length >= 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = L.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(L.shortcut(level), null, `${c.signature} shortcut`);
      const sol = L.solve(level), solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol), `${c.signature}: the checker disagrees with the solver`);
      // the clock moves only on a tick: the solver's ticks are the only clock change
      assert.equal(solved.s.t, sol.filter((a) => a.kind === "tick").length);
      for (const mal of GATI_MAL) {
        const acts = L.malActs(level, mal);
        if (!MAL_OF[goal].includes(mal)) { assert.equal(acts, null, `${goal} has no ${mal}`); continue; }
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts), `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`); assert.equal(mc[0].misconceptionId, mal);
        const g = L.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal((g.evidence[0].misconceptionId ?? g.evidence[0].chanceMis), `k-${mal}`);
      }
    }
    for (const m of MAL_OF[goal]) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("gati laws: each prakaar and do-gati thing's motion, read from its path alone, is the type the kit gives it", () => {
  for (const th of Object.keys(PRAKAAR)) for (let ph = 0; ph < 12; ph += 5) {
    const ts = typesOfPath((t) => prakaarAt(th, PERIOD[th] ? ph % PERIOD[th] : 0, t), [0, 0]);
    assert.deepEqual([...ts], [PRAKAAR[th]], `${th} phase ${ph}: ${[...ts]}`);
  }
  for (const th of Object.keys(DOGATI)) for (const ph of [0, 1.3, 4]) assert.deepEqual([...dogatiTypes(th, ph)].sort(), [...DOGATI[th]].sort(), th);
  // stepped only part of the way, a swing's arc and a wheel's arc both look like arcs (where the curved-is-circular belief
  // lives); stepped on, the swing turns back and the wheel goes all the way round
  const part = (th, upto) => { const pts = []; for (let t = 0; t <= upto; t += 0.05) pts.push(prakaarAt(th, 0, t)); return pts; };
  const turnsBack = (pts) => pts.slice(2).some((q, i) => (q[0] - pts[i + 1][0]) * (pts[i + 1][0] - pts[i][0]) + (q[1] - pts[i + 1][1]) * (pts[i + 1][1] - pts[i][1]) < 0);
  assert.ok(!turnsBack(part("swing", 3.9)) && turnsBack(part("swing", 8)));
  assert.ok(!turnsBack(part("wheel", 12)));
  // the sandarbh story table: the checker's own vehicles agree with the law's rides
  for (const [story, things] of Object.entries(STORY_THINGS)) for (const a of things) for (const b of things) {
    const law = (RIDES[a] < 0 ? 0 : story === "twin" ? [0, 1][RIDES[a]] : 1) === (RIDES[b] < 0 ? 0 : story === "twin" ? [0, 1][RIDES[b]] : 1);
    assert.equal(law, restCheck(a, b), `${story} ${a} from ${b}`);
  }
});

test("gati: the law's rules (the clock steps only when tapped and stops at its end; run needs the clock stepped, each reference watched, every lane set)", () => {
  const g = (mode, goal, seed = 6, fade = 1) => L.validate(L.generate(req(mode, goal, seed, { fade }))[0].level);
  let s;
  const ap = (lv, a) => { const r = L.apply(lv, s, a, 1); s = r.state; return r.refused; };
  const sd = g("drishti", "sandarbh"); s = L.init(sd);
  assert.equal(s.t, 0);
  sd.params.refs.forEach((_, i) => ap(sd, { kind: "put", lane: i, at: i % 2 }));
  assert.equal(ap(sd, { kind: "run" }), "step_first");
  ap(sd, { kind: "tick" }); ap(sd, { kind: "tick" });
  assert.equal(ap(sd, { kind: "run" }), "watch_each", "every reference watched from with the clock stepped");
  assert.equal(ap(sd, { kind: "view", ref: 0 }), "same_view");
  assert.equal(ap(sd, { kind: "view", ref: 9 }), "bad_view");
  for (let k = 0; k < 4; k++) ap(sd, { kind: "tick" });
  assert.equal(ap(sd, { kind: "tick" }), "clock_end");
  assert.equal(s.t, tMaxOf(sd.params));
  ap(sd, { kind: "undo" }); assert.equal(s.t, tMaxOf(sd.params) - 1, "undo takes the clock back one step");
  assert.equal(ap(sd, { kind: "mark", at: 3 }), "no_counter");
  assert.equal(ap(sd, { kind: "tag", lane: 0, at: 1 }), "no_tags");
  const ni = g("raftaar", "nikaalo"); s = L.init(ni);
  ap(ni, { kind: "mark", at: 40 });
  assert.equal(ap(ni, { kind: "run" }), "step_all_first", "the whole trip watched before the speed is set");
  for (let k = 0; k < ni.params.legs.length; k++) ap(ni, { kind: "tick" });
  assert.equal(ap(ni, { kind: "tick" }), "clock_end");
  assert.equal(ap(ni, { kind: "mark", at: 1000 }), "off_counter");
  assert.equal(ap(ni, { kind: "put", lane: 0, at: 0 }), "no_bins");
  const ag = g("raftaar", "aage"); s = L.init(ag);
  assert.equal(ap(ag, { kind: "chalk", lane: 0 }), "step_first", "no mark before the clock moves");
  ap(ag, { kind: "tick" });
  assert.equal(ap(ag, { kind: "run" }), "mark_same_time_first");
  assert.equal(ap(ag, { kind: "pick", lane: 2 }), "bad_lane");
  ap(ag, { kind: "chalk", lane: 0 }); ap(ag, { kind: "chalk", lane: 1 });
  assert.equal(ap(ag, { kind: "run" }), "pick_first");
  assert.equal(ap(ag, { kind: "chalk", lane: 3 }), "bad_lane");
  assert.equal(ap(ag, { kind: "chalk", lane: 0 }), "same_chalk");
  assert.equal(ap(sd, { kind: "chalk", lane: 0 }), "no_chalk");
  const dg = g("drishti", "do-gati"); s = L.init(dg);
  for (let k = 0; k < tNeedOf(dg.params); k++) ap(dg, { kind: "tick" });
  ap(dg, { kind: "tag", lane: 0, at: 1 });
  assert.equal(ap(dg, { kind: "run" }), "tag_all_first");
  ap(dg, { kind: "tag", lane: 0, at: 1 }); assert.equal(s.tags[0], 0, "a type button toggles");
  const ek = g("nishaan", "ek-saa"); s = L.init(ek);
  ek.params.movers.forEach((_, i) => ap(ek, { kind: "put", lane: i, at: 0 }));
  assert.equal(ap(ek, { kind: "run" }), "step_all_first", "every mark dropped before deciding");
  assert.equal(ap(ek, { kind: "put", lane: 0, at: 0 }), "same_slot");
  assert.equal(ap(ek, { kind: "put", lane: 0, at: 2 }), "bad_slot");
  // the hidden values: the speed a trip makes, the m/s; never said first
  const bd = g("raftaar", "badlo");
  assert.deepEqual(hiddenOf(bd), [String(msOf(bd.params.kmh))]);
  assert.deepEqual(hiddenOf(ni), [String(ni.params.legs.reduce((a, b) => a + b, 0) / ni.params.legs.length)]);
  assert.deepEqual(hiddenOf(sd), []);
});

// ───────────────────────────── r7 quiz fixes (the lead, 2026-11-09): the skill is the mechanic ─────────────────────────────
const NAMES = [...Object.keys(PRAKAAR)];
test("gati prakaar: before Check no look shows a thing or its name; only the light's trail is evidence", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
  const view = readFileSync(`${ROOT}src/play/families/gati/gati.view.ts`, "utf8");
  const draw = view.slice(view.indexOf("function drawPrakaar"), view.indexOf("function thingSketch"));
  // the drawing and the name are both behind one gate, and that gate is the child's Check (never the look)
  assert.doesNotMatch(draw, /look === 1/);
  assert.match(draw, /const reveal = namesShown\(s\)/);
  assert.equal((draw.match(/if \(reveal\)/g) ?? []).length, 2, "the sketch and the name, each behind the gate");
  let n1 = 0;
  for (const c of levelsOf("drishti", "prakaar")) {
    const level = L.validate(c.level), sol = L.solve(level), run1 = sol.indexOf(sol.find((a) => a.kind === "run"));
    if (level.params.look === 1) n1++;
    let s = L.init(level);
    for (const a of sol.slice(0, run1)) {
      s = L.apply(level, s, a, 1).state;
      assert.equal(namesShown(s), false, `${c.signature}: hidden before Check`);
      // what the teacher and the board are told carries no thing's name either
      const told = JSON.stringify([L.facts(level, s), L.board(level, s)]).toLowerCase();
      for (const th of NAMES) for (const l of ["en", "hinglish"]) { const nm = words[`gati.thing.${th}`][l].toLowerCase().replace(/^(a|the) /, ""); assert.ok(!new RegExp(`\\b${nm}\\b`).test(told), `${c.signature}: ${nm} told before Check`); }
    }
    s = L.apply(level, s, sol[run1], 1).state;
    assert.equal(namesShown(s), true, "revealed once checked");
  }
  assert.ok(n1 >= 10, `look-1 levels ${n1}`);
});

test("gati sandarbh: three reference cards at every look (a blind guess right 1 in 6); look 1 uses only the kit's own scenes", () => {
  const stories = new Set();
  for (const c of levelsOf("drishti", "sandarbh")) {
    const p = L.validate(c.level).params;
    assert.ok(p.refs.length >= 3, `${c.signature}: ${p.refs.length} cards`);
    // the patterns a blind guesser could tap that the level does not refuse outright: never more than 1 in 6 right
    const legal = 2 ** p.refs.length - 2;
    assert.ok(1 / legal <= 1 / 6);
    if (p.look === 1) {
      stories.add(p.story);
      assert.notEqual(p.story, "twin");
      for (const x of [p.target, ...p.refs]) assert.ok(KIT_THINGS.includes(x), `${c.signature}: ${x} is not in the kit's scenes`);
    }
  }
  assert.deepEqual([...stories].sort(), ["bus", "train"]);
  // a level-1 card that is not the kit's, or two cards, is refused
  const lv = L.generate(req("drishti", "sandarbh", 6, { fade: 1 })).find((c) => c.level.params.story === "train").level;
  assert.equal(L.validate({ ...lv, params: { ...lv.params, refs: [...lv.params.refs.slice(0, 2), "man"].filter((x, i, a) => a.indexOf(x) === i) } }), null);
  assert.equal(L.validate({ ...lv, params: { ...lv.params, refs: lv.params.refs.slice(0, 2) } }), null);
});

test("gati aage: the flag is refused until both runners are marked for the SAME time; a mark is where the runner was then", () => {
  let n = 0;
  for (const c of levelsOf("raftaar", "aage")) {
    const level = L.validate(c.level), p = level.params, Tmin = Math.min(...p.movers.map((m) => m.T)), fast = fasterOf(p);
    let s = L.init(level);
    const ap = (a) => { const r = L.apply(level, s, a, 1); s = r.state; return r.refused; };
    ap({ kind: "tick" });
    assert.equal(ap({ kind: "pick", lane: fast }), "mark_same_time_first", "no marks: no flag");
    ap({ kind: "chalk", lane: 0 });
    assert.equal(ap({ kind: "pick", lane: fast }), "mark_same_time_first", "one mark: no flag");
    if (Tmin >= 2) {
      // marks for different times: no flag
      ap({ kind: "tick" }); ap({ kind: "chalk", lane: 1 });
      assert.deepEqual(s.chalk, [1, 2]); assert.equal(sameTimeMarks(s), false);
      assert.equal(ap({ kind: "pick", lane: fast }), "mark_same_time_first");
      ap({ kind: "chalk", lane: 0 });
    } else ap({ kind: "chalk", lane: 1 });
    // the same time: the flag is taken, and the faster one IS ahead at its mark
    assert.equal(sameTimeMarks(s), true);
    assert.ok(posOf(p.movers[fast], s.chalk[fast]) > posOf(p.movers[1 - fast], s.chalk[1 - fast]), `${c.signature}: ahead at the same time`);
    assert.equal(ap({ kind: "pick", lane: fast }), undefined);
    // a mover whose trip is over takes no mark (where it stopped says nothing about this time)
    while (s.t <= Tmin) ap({ kind: "tick" });
    const done = p.movers.findIndex((m) => m.T < s.t);
    assert.equal(ap({ kind: "chalk", lane: done }), "trip_over");
    // the farther-faster belief (the kit's ch08-t02 m1) is still served: marks placed, the totals then read instead
    const mal = L.malActs(level, "farther-faster");
    if (fartherOf(p) >= 0) {
      assert.ok(mal, c.signature); n++;
      const k = mal.findIndex((a) => a.kind === "pick");
      assert.ok(sameTimeMarks(run(level, mal.slice(0, k)).s), "the mal child marked the same time too");
    }
  }
  assert.ok(n >= 20, `farther-faster levels ${n}`);
  // the coverage rule still maps it to the kit's m1
  assert.deepEqual(GE().find((e) => e.goal === "aage").misMap, { "farther-faster": "c7-science-ch08-t02-m1" });
});

test("gati badlo and nikaalo: after Check a ghost at the typed speed for the same time lands ON the real mark exactly when the number is right", () => {
  for (const goal of ["badlo", "nikaalo"]) for (const c of levelsOf("raftaar", goal)) {
    const level = L.validate(c.level), p = level.params, sol = L.solve(level), right = sol.find((a) => a.kind === "mark").at;
    const before = run(level, sol.slice(0, -1)).s;
    assert.equal(ghostOf(p, before), null, "no ghost before Check");
    const tries = [right, right + 1, Math.max(1, right - 1), ...(goal === "badlo" ? [p.kmh] : [])].filter((x) => x <= (goal === "badlo" ? 99 : 999));
    for (const mal of goal === "nikaalo" ? ["speed-distance", "multiply"] : []) { const a = L.malActs(level, mal); if (a) tries.push(a.find((x) => x.kind === "mark").at); }
    for (const at of new Set(tries)) {
      const acts = [...sol.filter((a) => a.kind !== "mark" && a.kind !== "run"), { kind: "mark", at }, { kind: "run" }], s = run(level, acts).s;
      const g = ghostOf(p, s);
      assert.ok(g, `${c.signature} ${at}: a ghost after Check`);
      assert.equal(g.t, goal === "nikaalo" ? p.legs.length : s.t, "the same time as the real mover");
      assert.equal(g.d, at * g.t, "it drives at the typed speed");
      assert.equal(g.real, goal === "nikaalo" ? p.legs.reduce((x, y) => x + y, 0) : msOf(p.kmh) * s.t, "the real mark");
      assert.equal(g.d === g.real, s.done, `${c.signature} ${at}: lands on the real mark ⇔ right`);
      // the track holds both (the view scales to g.max; nothing is clipped at the end, the multiply case included)
      assert.ok(g.max >= g.d && g.max >= g.real);
    }
  }
  const view = readFileSync(`${ROOT}src/play/families/gati/gati.view.ts`, "utf8");
  assert.doesNotMatch(view, /Math\.min\(X\(/, "no ghost clipped at the track's end");
  assert.equal((view.match(/ghostOf\(p, s\)/g) ?? []).length, 2, "both views draw the law's ghost");
});

test("gati: tampered params are refused", () => {
  const g = (mode, goal, fade = 2) => L.generate(req(mode, goal, 6, { fade }))[0].level;
  const sd = g("drishti", "sandarbh"), pk = g("drishti", "prakaar"), dg = g("drishti", "do-gati"), ag = g("raftaar", "aage"), ni = g("raftaar", "nikaalo"), ni3 = g("raftaar", "nikaalo", 3), bd = g("raftaar", "badlo"), ek = g("nishaan", "ek-saa");
  for (const lv of [sd, pk, dg, ag, ni, ni3, bd, ek]) assert.ok(L.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  const restRefs = (lv) => lv.params.refs.filter((r) => L.validate(bad(lv, { refs: [r] })) === null);
  void restRefs;
  for (const [lv, patch] of [
    [sd, { v: 60 }], [sd, { target: "sign" }], [sd, { target: "pole" }], [sd, { target: "seat" }], [sd, { refs: sd.params.refs.slice(0, 2) }], [sd, { refs: [sd.params.refs[0]] }], [sd, { refs: [...sd.params.refs, sd.params.refs[0]] }], [sd, { story: "ship" }], [sd, { refs: [sd.params.target, sd.params.refs[1]] }],
    [pk, { things: ["train", "slide", "drop"] }], [pk, { things: ["wheel", "fan", "clock"] }], [pk, { things: ["train", "wheel", "string"] }], [pk, { phase: [0, 0] }], [pk, { things: ["train", "train", "swing"] }],
    [dg, { things: ["fan", "swing", "train"] }], [dg, { things: ["bicycle", "horse"] }], [dg, { things: ["bicycle", "rocket"] }],
    [ag, { movers: ag.params.movers.map((m) => ({ ...m, T: 9 })) }], [ag, { movers: [ag.params.movers[0], ag.params.movers[0]] }], [ag, { units: "kmph" }],
    [ag, { movers: [{ ...ag.params.movers[0], v: 100, T: 4 }, { ...ag.params.movers[1], v: 10, T: 2 }] }],
    [ni, { legs: [30, 40] }], [ni, { legs: [7, 8, 8] }], [ni3, { legs: [40, 40, 40] }], [ni, { legs: [500, 500, 500] }],
    [bd, { kmh: 40 }], [bd, { kmh: 162 }], [bd, { who: "rocket" }],
    [ek, { dt: 3 }], [ek, { movers: ek.params.movers.map((m) => ({ ...m, gaps: [3, 3, 3, 3].slice(0, m.gaps.length) })) }], [ek, { movers: ek.params.movers.slice(0, 2) }],
    [sd, { extra: 1 }], [ek, { look: 4 }], [sd, { goal: "prakaar" }],
  ]) assert.equal(L.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  assert.equal(L.validate({ ...sd, mode: "raftaar" }), null, "a goal belongs to its mode");
  assert.equal(L.validate({ ...sd, params: null }), null);
});

test("gati: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = L.validate(L.generate(req("raftaar", "badlo", 4))[0].level), ms = msOf(level.params.kmh);
  const forged = L.grade(level, sanitizeActs(env([{ kind: "tick" }, { kind: "mark", at: ms + 1, correct: true }, { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved"); assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = L.grade(level, env(L.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "tick" }, { kind: "mark", at: ms + 2 }, { kind: "run" }, { kind: "mark", at: ms }, { kind: "run" }];
  const g = L.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(L.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per goal: the law never throws; whenever a run ends the law's verdict equals the checker's on its OWN
// copy of the set-up (fed every act the law accepted)
for (const [mode, goal] of CASES) {
  test(`gati ${mode}/${goal}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws`, () => {
    let seed = 29, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    for (let gi = 0; gi < 30; gi++) {
      for (const c of L.generate(req(mode, goal, 300 + gi, { fade: 1 + (gi % 3) })).slice(0, 3)) {
        const level = L.validate(c.level), p = level.params, sol = L.solve(level);
        let s = L.init(level), k = 0;
        const chk = checker(p), pursue = rnd() < 0.5, lanes = p.refs?.length ?? p.things?.length ?? p.movers?.length ?? 1;
        for (let i = 0; i < 80 && !s.done; i++) {
          const r = rnd(), pickK = ["tick", "view", "put", "tag", "pick", "mark", "chalk"][Math.floor(rnd() * 7)];
          const near = sol.find((a) => a.kind === "mark")?.at ?? 5;
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.12 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : r < 0.18 ? { kind: "undo" }
            : pickK === "tick" ? { kind: "tick" } : pickK === "view" ? { kind: "view", ref: Math.floor(rnd() * 4) }
            : pickK === "put" ? { kind: "put", lane: Math.floor(rnd() * (lanes + 1)), at: Math.floor(rnd() * 3) }
            : pickK === "tag" ? { kind: "tag", lane: Math.floor(rnd() * lanes), at: Math.floor(rnd() * 3) }
            : pickK === "pick" ? { kind: "pick", lane: Math.floor(rnd() * 2) }
            : pickK === "chalk" ? { kind: "chalk", lane: Math.floor(rnd() * 2) }
            : { kind: "mark", at: rnd() < 0.6 ? Math.max(1, near + Math.round((rnd() - 0.5) * 4)) : 1 + Math.floor(rnd() * 200), ...(rnd() < 0.2 ? { correct: true } : {}) };
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

test("gati: the generator's and the picker's work is bounded (counted, not timed)", () => {
  // measured 2026-11-10 over every case below: at most 24 candidates and 1316 calls into the family logic per pick; bounds are 3x above that. A count is the same on every machine; a
  // 50 ms p95 read 5 ms idle and 110 ms under the gate's load (tests/_work.mjs).
  const gen = [], calls = [], considered = [], counter = counted(L);
  for (const [mode, goal] of CASES) for (const fade of [1, 3]) for (let seed = 1; seed <= 6; seed++) {
    gen.push(L.generate(req(mode, goal, seed * 31, { fade })).length);
    counter.reset(); const picked = pickLevels(counter.logic, req(mode, goal, seed * 31, { fade })); assert.ok(picked); calls.push(counter.calls()); considered.push(picked.considered);
  }
  assert.ok(Math.max(...gen) <= 72, `generate made ${Math.max(...gen)} candidates`);
  assert.ok(Math.max(...considered) <= 72, `pick considered ${Math.max(...considered)}`);
  assert.ok(Math.max(...calls) <= 4000, `pick made ${Math.max(...calls)} calls into the family logic`);
});

test("gati: every word the view shows exists in all three languages and none is an economy word; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/gati/gati.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(gati\.[a-zA-Z0-9.-]+)"/g)].map((m) => m[1]);
  const things = [...new Set([...Object.values(STORY_THINGS).flat(), ...Object.keys(PRAKAAR), ...Object.keys(DOGATI).map((t) => (t === "train" ? "toytrain" : t))])];
  const extra = [...CASES.map(([, g]) => `gati.goal.${g}`), ...CASES.filter(([, g]) => g !== "nikaalo" && g !== "badlo").map(([, g]) => `gati.solved.${g}`), "gati.solved.nikaalo", "gati.solved.average", "gati.solved.badlo",
    ...things.map((t) => `gati.thing.${t}`), ...[0, 1, 2].flatMap((t) => [`gati.type.${t}`, `gati.type.${t}.sub`]), "gati.view.0", "gati.view.1",
    ...["bus", "car", "train", "scooter", "toycar", "robot", "runner", "cycle", "metro", "marble", "auto"].map((x) => `gati.who.${x}`), ...["h", "s", "min", "pal"].map((u) => `gati.tick.${u}`)];
  assert.ok(used.length >= 15);
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) { assert.ok(words[k]?.[l], `${k} ${l}`); assert.doesNotMatch(words[k][l], ECON, k); }
  const logic = readFileSync(`${ROOT}src/play/families/gati/gati.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|performance\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every gati coverage entry serves a proven level at every fade; the solver's acts grade solved through the
// server; a claim never solves; a mal-rule the level discriminates folds its kit id
const GE = () => coverage().entries.filter((e) => e.family === "gati");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("gati coverage: the seven authored entries, mapped to the topics' verified kit misconceptions; the three topics have a law game", () => {
  assert.deepEqual(GE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c6-science-ch05-t03|drishti|sandarbh", "c6-science-ch05-t03|drishti|prakaar", "c6-science-ch05-t03|drishti|do-gati",
    "c7-science-ch08-t02|raftaar|aage", "c7-science-ch08-t02|raftaar|nikaalo", "c7-science-ch08-t02|raftaar|badlo", "c7-science-ch08-t03|nishaan|ek-saa"]);
  for (const e of GE()) for (const [mal, kit] of Object.entries(e.misMap)) {
    assert.ok(MAL_OF[e.goal].includes(mal), `${e.goal} ${mal}`);
    assert.ok(KIT[e.topicId].misconceptions.some((m) => m.id === kit), `${kit} is the kit's`);
  }
  const mapped = new Set(GE().flatMap((e) => Object.values(e.misMap)));
  for (const t of ["c6-science-ch05-t03", "c7-science-ch08-t02", "c7-science-ch08-t03"]) for (const m of ["m1", "m2", "m3"]) assert.ok(mapped.has(`${t}-${m}`), `${t}-${m} mapped`);
  // the mal-rule ↔ kit id pairs, exactly
  const pairs = Object.fromEntries(GE().flatMap((e) => Object.entries(e.misMap).map(([m, k]) => [m, k.slice(e.topicId.length + 1)])));
  assert.deepEqual(pairs, { "no-reference": "m1", "curve-circular": "m2", "one-type": "m3", "farther-faster": "m1", "speed-distance": "m2", multiply: "m3", "keeps-moving": "m1", "same-totals": "m2", "uniform-slow": "m3" });
  for (const sk of ["c6-science-ch05-t03-s1", "c6-science-ch05-t03-s2", "c6-science-ch05-t03-s3", "c7-science-ch08-t02-s1", "c7-science-ch08-t02-s2", "c7-science-ch08-t02-s3", "c7-science-ch08-t02-s4", "c7-science-ch08-t03-s1", "c7-science-ch08-t03-s2"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "gati", sk);
  }
  const cov = coverage();
  for (const t of ["c6-science-ch05-t03", "c7-science-ch08-t02", "c7-science-ch08-t03"]) assert.ok(!cov.arenaOnly.includes(t));
  assert.equal(cov.counts.arenaOnlyClass4to7, 0);
  // FIXED things are never the watched one
  for (const t of FIXED) assert.ok(Object.values(STORY_THINGS).flat().includes(t));
});

for (const e of GE()) for (const fade of [1, 2, 3]) {
  test(`gati server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "gati" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
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
        assert.equal((mg.grade.evidence[0].misconceptionId ?? mg.grade.evidence[0].chanceMis), kitId);
      }
      assert.ok(Array.isArray(hiddenOf(level)));
    }
  });
}

// the picker is deterministic (base − 2.2·|p − band|), so without the seeded difficulty nudge one level would be every child's
// first level of a goal
test("gati: the first level served differs across children (variety across seeds)", () => {
  const FLOOR = { sandarbh: 6, prakaar: 12, "do-gati": 8, aage: 10, nikaalo: 8, badlo: 4, "ek-saa": 12 };
  for (const e of GE()) for (const fade of [1, 3]) {
    const sigs = new Set();
    for (let c = 0; c < 20; c++) { const child = `var-${c}`; sigs.add(currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e).sig); }
    assert.ok(sigs.size >= FLOOR[e.goal], `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children (floor ${FLOOR[e.goal]})`);
  }
  // every sandarbh story is served somewhere at look 3; both aage kinds (farther-and-slower, the same distance)
  const sd = GE().find((x) => x.goal === "sandarbh"), stories = new Set();
  for (let c = 0; c < 40; c++) stories.add(currentLevel(sessionOf(sd, { childId: `k-${c}`, fade: 3, seed: seedOf(`k-${c}`, entryKey(sd), 0) }), sd).params.story);
  assert.deepEqual([...stories].sort(), ["bus", "train", "twin"]);
});
