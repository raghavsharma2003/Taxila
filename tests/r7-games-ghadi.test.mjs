// r7 Games, Ghadi · time and clocks (a geared clock set by hand, bus trips wound on / back, a trip ticket, a race podium, a
// calendar flag; nothing ever runs on a clock). Pure law checks: every generated level validates, its solver solves it, no
// idea-free set-up wins (shortcut null); an INDEPENDENT checker (its own clock of hour / minute / half that is wound one
// minute at a time with its own carries, its own day hops and race sort; none of the law's helpers) agrees with the law
// over random play; each mal-rule's acts land on its OWN misconception moment; tampered params are refused; a claim in an
// act never decides; the generator is fast; and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ghadiLogic, GHADI_MAL, malSetup } from "../src/play/families/ghadi/ghadi.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const ALL = Object.fromEntries(GHADI_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "ghadi", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 4, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = ghadiLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = ghadiLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["set", "hands", { noon: 0.25 }],
  ["run", "arrive", { says: ["hm", "min"] }],
  ["run", "arrive", { says: ["dec", "quarter", "threeq"] }],
  ["run", "leave", { says: ["hm", "min"] }],
  ["run", "trip", {}],
  ["race", "podium", { fmts: [["s", "ms"]] }],
  ["race", "podium", { fmts: [["s"], ["d1", "d2"], ["s", "ms"]] }],
  ["calendar", "days", {}],
];
const EXPECT = (goal, g) => ({ hands: ["minute-number", "hour-next", "noon-am"], arrive: g.says?.includes("hm") ? ["no-carry"] : ["decimal-hours", "quarter-25"],
  leave: ["base-hundred"], trip: ["base-ten"], podium: g.fmts?.length > 1 ? ["bigger-faster", "longer-decimal", "minute-hundred"] : ["bigger-faster", "minute-hundred"], days: ["count-start"] })[goal];
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of ghadiLogic.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (plain clock arithmetic, none of the law's code) ─────────────────────────────
/** minutes since midnight → { h: 1..12, m, pm } */
const fromMins = (x) => { const h24 = Math.floor(x / 60); return { h: h24 % 12 === 0 ? 12 : h24 % 12, m: x % 60, pm: h24 >= 12 }; };
const same = (a, b) => a.h === b.h && a.m === b.m && a.pm === b.pm;
/** one minute on / back, with the carries a real clock makes (12:00 is where a.m. and p.m. change) */
function tick(c, dir) {
  let { h, m, pm } = c;
  if (dir > 0) { m++; if (m === 60) { m = 0; h++; if (h === 12) pm = !pm; if (h === 13) h = 1; } }
  else { m--; if (m < 0) { m = 59; h--; if (h === 11) pm = !pm; if (h === 0) h = 12; } }
  return { h, m, pm };
}
const wound = (c, by) => { let x = c; for (let i = 0; i < Math.abs(by); i++) x = tick(x, Math.sign(by)); return x; };
/** the checker's own copy of the set-up, fed every act the law accepted (undo pops its own stack) */
function checker(p) {
  const st = { clock: fromMins(p.start), th: 0, tm: 0, order: p.runners.map(() => -1), pick: 0 }, stack = [];
  return {
    st,
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push(JSON.parse(JSON.stringify(st)));
      if (a.kind === "wind") st.clock = wound(st.clock, a.by);
      if (a.kind === "hour") st.clock = { ...st.clock, h: a.h === 0 ? 12 : a.h };
      if (a.kind === "half") st.clock = { ...st.clock, pm: a.pm };
      if (a.kind === "ticket") { st.th = a.h; st.tm = a.m; }
      if (a.kind === "pick") st.pick = a.day;
      if (a.kind === "put") { const from = st.order.indexOf(a.lane); if (from >= 0) st.order[from] = st.order[a.at]; st.order[a.at] = a.lane; }
    },
  };
}
/** does this set-up meet the board? read from the params' plain meaning */
function verdict(p, st) {
  if (p.goal === "hands") return same(st.clock, fromMins(p.at));
  if (p.goal === "arrive") return same(st.clock, wound(fromMins(p.at), p.dur));
  if (p.goal === "leave") return same(wound(st.clock, p.dur), fromMins(p.at));
  if (p.goal === "trip") return same(wound(fromMins(p.at), st.th * 60 + st.tm), fromMins(p.to)) && st.th * 60 + st.tm < 720;
  if (p.goal === "days") { let d = p.today; for (let i = 0; i < p.ahead; i++) d++; return st.pick === d; }
  const fastest = p.runners.map((r, i) => [r.cs, i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  return st.order.join() === fastest.join();
}
const replayCheck = (level, acts) => { const k = checker(level.params); let s = ghadiLogic.init(level); for (const a of acts) { const r = ghadiLogic.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return { s, ok: verdict(level.params, k.st) }; };

test("ghadi: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("ghadi"));
  assert.deepEqual([...MODES.ghadi], ["set", "run", "race", "calendar"]);
  assert.ok(FAMILY_ARTS.ghadi.length === 4);
  for (const m of MODES.ghadi) {
    assert.equal(LOGIC[`ghadi/${m}`], ghadiLogic);
    const v = playActOf("ghadi", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

for (const [mode, goal, grammar] of CASES) {
  test(`ghadi/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = ghadiLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(ghadiLogic.shortcut(level), null, `${c.signature} shortcut`);
      const sol = ghadiLogic.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol).ok, `${c.signature}: the checker disagrees with the solver`);
      for (const mal of GHADI_MAL) {
        const acts = ghadiLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts).ok, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = ghadiLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of EXPECT(goal, grammar)) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("ghadi: mal-rule signatures are the beliefs (minute hand on the number, the next hour, noon as a.m., no carry, 1.5 h as 1 h 50, a quarter as 25, borrowing 100, plain subtraction, the podium beliefs, today counted)", () => {
  const mins = (t) => t % 60, hr = (t) => Math.floor(t / 60) % 12;
  for (const c of levelsOf("set", "hands", { noon: 0.25 })) {
    const p = ghadiLogic.validate(c.level).params;
    const mn = malSetup(p, "minute-number");
    if (mn) { assert.ok([5, 10].includes(mins(p.at))); assert.equal(mins(mn.t), mins(p.at) * 5); assert.equal(hr(mn.t), hr(p.at)); }
    const hn = malSetup(p, "hour-next");
    if (hn) { assert.ok(mins(p.at) >= 35); assert.equal(hn.t, p.at + 60); }
    const na = malSetup(p, "noon-am");
    if (na) { assert.equal(hr(p.at), 0); assert.equal(na.t, (p.at + 720) % 1440); }
  }
  for (const c of levelsOf("run", "arrive", { says: ["hm", "min"] })) {
    const p = ghadiLogic.validate(c.level).params, nc = malSetup(p, "no-carry");
    if (!nc) continue;
    const H = p.say === "min" ? 0 : Math.floor(p.dur / 60), M = p.say === "min" ? p.dur : p.dur % 60;
    assert.equal(Math.floor(nc.t / 60), Math.floor(p.at / 60) + H, `${c.signature}: the hour moves only by the written hours`);
    assert.equal(nc.t % 60, (p.at % 60 + M) % 60);
  }
  for (const c of levelsOf("run", "arrive", { says: ["dec", "quarter", "threeq"] })) {
    const p = ghadiLogic.validate(c.level).params;
    const dh = malSetup(p, "decimal-hours"); if (dh) assert.equal(dh.t - p.at, Math.floor(p.dur / 60) * 60 + 50);
    const q = malSetup(p, "quarter-25"); if (q) assert.equal(q.t - p.at, p.dur === 15 ? 25 : 75);
  }
  for (const c of levelsOf("run", "leave", { says: ["hm", "min"] })) {
    const p = ghadiLogic.validate(c.level).params, bh = malSetup(p, "base-hundred");
    if (!bh) continue;
    // 10:00 − 45 min = 1000 − 45 = 955 → 9:55
    const h12 = Math.floor(p.at / 60) % 12 || 12, H = p.say === "min" ? 0 : Math.floor(p.dur / 60), M = p.say === "min" ? p.dur : p.dur % 60;
    const x = h12 * 100 + (p.at % 60) - (H * 100 + M);
    assert.equal(bh.t % 60, x % 100); assert.equal(Math.floor(bh.t / 60) % 12 || 12, Math.floor(x / 100));
  }
  for (const c of levelsOf("run", "trip", {})) {
    const p = ghadiLogic.validate(c.level).params, bt = malSetup(p, "base-ten");
    if (!bt) continue;
    const n = (t) => (Math.floor(t / 60) % 12 || 12) * 100 + (t % 60), x = n(p.to) - n(p.at);
    assert.deepEqual([bt.th, bt.tm], [Math.floor(x / 100), x % 100]);
  }
  for (const c of levelsOf("race", "podium", { fmts: [["s"], ["d1", "d2"], ["s", "ms"]] })) {
    const p = ghadiLogic.validate(c.level).params, bf = malSetup(p, "bigger-faster");
    assert.deepEqual(bf.order.map((l) => p.runners[l].cs), p.runners.map((r) => r.cs).sort((a, b) => b - a));
    const mh = malSetup(p, "minute-hundred");
    if (mh) assert.ok(p.runners.some((r) => r.fmt === "ms"));
    const ld = malSetup(p, "longer-decimal");
    if (ld) assert.ok(p.runners.some((r) => r.fmt === "d2") && p.runners.some((r) => r.fmt === "d1"));
  }
  for (const c of levelsOf("calendar", "days", {})) {
    const p = ghadiLogic.validate(c.level).params;
    assert.equal(malSetup(p, "count-start").pick, p.today + p.ahead - 1);
  }
});

test("ghadi: no idea-free set-up wins (the clock as it starts, its half flipped, the lanes as they stand or reversed, today)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const level = ghadiLogic.validate(c.level), p = level.params;
    if (["hands", "arrive", "leave"].includes(goal)) {
      assert.ok(!replayCheck(level, [{ kind: "run" }]).ok, `${c.signature}: the clock as it starts wins`);
      assert.ok(!replayCheck(level, [{ kind: "half", pm: p.start < 720 }, { kind: "run" }]).ok, `${c.signature}: flipping a.m. / p.m. wins`);
    }
    if (goal === "podium") {
      const lanes = p.runners.map((_, i) => i);
      assert.ok(!replayCheck(level, [...lanes.map((lane, at) => ({ kind: "put", lane, at })), { kind: "run" }]).ok, `${c.signature}: lane order wins`);
    }
    if (goal === "days") assert.ok(!replayCheck(level, [{ kind: "pick", day: p.today }, { kind: "run" }]).ok);
  }
});

test("ghadi: the law's rules (a geared clock: the hour moves with the minute hand and 12 turns a.m. into p.m.; run needs a set-up; a change starts a fresh run)", () => {
  const hands = ghadiLogic.validate(ghadiLogic.generate(req("set", "hands", 11, { grammar: { noon: 0 } }))[0].level);
  let s = ghadiLogic.init(hands);
  const ap = (lv, a) => { const r = ghadiLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  // from 11:50 a.m., ten minutes on is 12:00 p.m.; back twenty is 11:30 a.m.
  assert.equal(ap(hands, { kind: "half", pm: false }), undefined);
  assert.equal(ap(hands, { kind: "hour", h: 11 }), undefined);
  assert.equal(ap(hands, { kind: "wind", by: 50 - (s.t % 60) }), undefined);
  assert.equal(s.t, 11 * 60 + 50);
  ap(hands, { kind: "wind", by: 10 }); assert.equal(s.t, 720, "12:00 p.m.: the hour moved on and the day strip turned");
  ap(hands, { kind: "wind", by: -30 }); assert.equal(s.t, 11 * 60 + 30);
  ap(hands, { kind: "wind", by: 1440 }); assert.equal(s.t, 11 * 60 + 30, "a whole day round");
  ap(hands, { kind: "hour", h: 0 }); assert.equal(s.t, 30, "the 12 o'clock hour on the a.m. half is just past midnight");
  for (const bad of [{ kind: "wind", by: 0 }, { kind: "wind", by: 2.5 }, { kind: "wind", by: 2000 }, { kind: "hour", h: 12 }, { kind: "half", pm: "yes" }]) assert.equal(ap(hands, bad), "bad_turn");
  assert.equal(ap(hands, { kind: "ticket", h: 1, m: 0 }), "no_ticket");
  assert.equal(ap(hands, { kind: "pick", day: 3 }), "no_calendar");
  assert.equal(ap(hands, { kind: "put", lane: 0, at: 0 }), "no_podium");
  ap(hands, { kind: "run" });
  assert.ok(s.ended && !s.done);
  assert.equal(ap(hands, { kind: "run" }), "change_first");
  ap(hands, { kind: "wind", by: 5 });
  assert.ok(!s.ended, "a change starts a fresh run");
  const trip = ghadiLogic.validate(ghadiLogic.generate(req("run", "trip", 4))[0].level);
  s = ghadiLogic.init(trip);
  assert.equal(ap(trip, { kind: "run" }), "ticket_first");
  assert.equal(ap(trip, { kind: "wind", by: 5 }), "no_clock");
  assert.equal(ap(trip, { kind: "ticket", h: 13, m: 0 }), "bad_ticket");
  const pod = ghadiLogic.validate(ghadiLogic.generate(req("race", "podium", 4, { grammar: { fmts: [["s"]] } }))[0].level);
  s = ghadiLogic.init(pod);
  assert.equal(ap(pod, { kind: "run" }), "podium_first");
  ap(pod, { kind: "put", lane: 0, at: 0 }); ap(pod, { kind: "put", lane: 1, at: 0 });
  assert.equal(s.order[0], 1, "a runner put on a taken step takes it"); assert.equal(s.order.indexOf(0), -1, "the runner there goes back to its lane when it came from it");
  ap(pod, { kind: "put", lane: 0, at: 1 }); ap(pod, { kind: "put", lane: 0, at: 0 });
  assert.deepEqual(s.order.slice(0, 2), [0, 1], "two runners on the podium swap");
  assert.equal(ap(pod, { kind: "put", lane: 0, at: 0 }), "same_step");
  const days = ghadiLogic.validate(ghadiLogic.generate(req("calendar", "days", 4))[0].level);
  s = ghadiLogic.init(days);
  assert.equal(ap(days, { kind: "run" }), "flag_first");
  assert.equal(ap(days, { kind: "pick", day: 0 }), "off_month");
  assert.equal(ap(days, { kind: "pick", day: days.params.days + 1 }), "off_month");
  ap(days, { kind: "pick", day: days.params.today + days.params.ahead });
  assert.equal(ap(days, { kind: "run" }), undefined); assert.ok(s.done);
  assert.deepEqual(hiddenOf(days), [String(days.params.today + days.params.ahead)], "the teacher never says the fair's date");
});

test("ghadi: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}) => ghadiLogic.generate(req(mode, goal, 6, { grammar }))[0].level;
  const hands = g("set", "hands"), arrive = g("run", "arrive", { says: ["hm"] }), leave = g("run", "leave", { says: ["min"] }), trip = g("run", "trip"), pod = g("race", "podium", { fmts: [["s", "ms"]] }), days = g("calendar", "days");
  for (const lv of [hands, arrive, leave, trip, pod, days]) assert.ok(ghadiLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [hands, { at: hands.params.at + 1 }], [hands, { start: hands.params.at }], [hands, { at: 1440 }], [hands, { face: 4 }], [hands, { goal: "trip" }], [hands, { dur: 30 }], [hands, { runners: [{ cs: 1500, fmt: "s" }] }],
    [arrive, { start: arrive.params.at + 5 }], [arrive, { dur: 120 }], [arrive, { dur: 7 }], [arrive, { say: "dec" }], [arrive, { at: 1435 }], [arrive, { say: "x" }],
    [leave, { dur: 200 }], [leave, { at: 30, start: 30 }],
    [trip, { to: trip.params.at }], [trip, { to: trip.params.at + 120 }], [trip, { to: trip.params.at + 13 * 60 + 5 }], [trip, { dur: 5 }],
    [pod, { runners: pod.params.runners.slice(0, 2) }], [pod, { runners: [...pod.params.runners.slice(1), pod.params.runners[1]] }], [pod, { runners: pod.params.runners.map((r) => ({ ...r, cs: r.cs + 1 })) }], [pod, { runners: [...pod.params.runners].sort((a, b) => a.cs - b.cs) }], [pod, { today: 3 }],
    [days, { ahead: 2 }], [days, { today: days.params.days }], [days, { days: 35 }], [days, { first: 7 }], [days, { weeks: true, ahead: 7 }], [days, { at: 5 }],
  ]) assert.equal(ghadiLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch).slice(0, 80)}`);
  assert.equal(ghadiLogic.validate({ ...hands, mode: "run" }), null, "a goal belongs to its mode");
  assert.equal(ghadiLogic.validate({ ...hands, params: null }), null);
});

test("ghadi: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = ghadiLogic.validate(ghadiLogic.generate(req("run", "trip", 4))[0].level);
  const forged = ghadiLogic.grade(level, sanitizeActs(env([{ kind: "ticket", h: 0, m: 5, correct: true }, { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = ghadiLogic.grade(level, env(ghadiLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "ticket", h: 0, m: 5 }, { kind: "run" }, ...ghadiLogic.solve(level)];
  const g = ghadiLogic.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(ghadiLogic.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per case: the law never throws; whenever a run ends the law's verdict equals the checker's on the
// checker's OWN copy of the set-up (fed every act the law accepted); the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`ghadi/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws; generator p95 ≤ 50 ms`, () => {
    let seed = 17, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let gi = 0; gi < 40; gi++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = performance.now(); cands = ghadiLogic.generate(req(mode, goal, 100 + gi, { grammar, fade: 1 + (gi % 3) })); best = Math.min(best, performance.now() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 4)) {
        const level = ghadiLogic.validate(c.level), p = level.params, sol = ghadiLogic.solve(level), n = p.runners.length;
        let s = ghadiLogic.init(level), k = 0;
        const chk = checker(p), pursue = rnd() < 0.4;
        for (let i = 0; i < 60 && !s.done; i++) {
          const r = rnd(), x = rnd();
          const a = pursue && r < 0.6 && k < sol.length ? sol[k++]
            : r < 0.2 ? { kind: "wind", by: Math.round((x - 0.5) * 200) || 5, ...(rnd() < 0.2 ? { correct: true } : {}) } : r < 0.3 ? { kind: "hour", h: Math.floor(x * 12) } : r < 0.37 ? { kind: "half", pm: x < 0.5 }
            : r < 0.47 ? { kind: "ticket", h: Math.floor(x * 4), m: 5 * Math.floor(rnd() * 24) } : r < 0.57 ? { kind: "put", lane: Math.floor(x * Math.max(1, n)), at: Math.floor(rnd() * Math.max(1, n)) }
            : r < 0.65 ? { kind: "pick", day: 1 + Math.floor(x * 31) } : r < 0.88 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = ghadiLogic.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, verdict(p, chk.st), `${level.levelId}: law and checker disagree (${JSON.stringify(chk.st)})`);
          }
          s = out.state;
        }
        if (ghadiLogic.goalMet(level, s)) { solved++; assert.ok(verdict(p, chk.st)); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

test("ghadi: every word the view shows exists in all three languages; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/ghadi/ghadi.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(ghadi\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = ["ghadi.goal.hands", "ghadi.goal.arrive", "ghadi.goal.leave", "ghadi.goal.trip", "ghadi.goal.podium", "ghadi.goal.days", "ghadi.goal.week1", "ghadi.goal.week2", "ghadi.ring", "ghadi.hop", "ghadi.go",
    "ghadi.am", "ghadi.pm", "ghadi.leaves", "ghadi.arrives", ...[0, 1, 2, 3, 4, 5, 6].map((d) => `ghadi.wd${d}`)];
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/ghadi/ghadi.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every ghadi coverage entry serves a proven level at every fade (levelsFor and currentLevel); the
// solver's acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const GE = () => coverage().entries.filter((e) => e.family === "ghadi");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("ghadi coverage: the eight authored entries, mapped to real kit misconceptions; the four time topics are ghadi's now", () => {
  assert.deepEqual(GE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c4-maths-ch12-t01|set|hands", "c4-maths-ch12-t02|run|arrive", "c4-maths-ch12-t02|run|trip", "c4-maths-ch12-t02|calendar|days",
    "c5-maths-ch12-t01|run|arrive", "c5-maths-ch12-t01|run|leave", "c5-maths-ch12-t01|race|podium", "c5-maths-ch12-t02|race|podium"]);
  for (const e of GE()) { assert.ok(Object.keys(e.misMap).length >= 1, e.topicId); for (const kit of Object.values(e.misMap)) assert.ok(kit.startsWith(`${e.topicId}-m-`), kit); }
  for (const sk of ["c4-maths-ch12-t01-s1", "c4-maths-ch12-t01-s2", "c4-maths-ch12-t01-s3", "c4-maths-ch12-t02-s1", "c4-maths-ch12-t02-s2", "c4-maths-ch12-t02-s3",
    "c5-maths-ch12-t01-s1", "c5-maths-ch12-t01-s2", "c5-maths-ch12-t01-s3", "c5-maths-ch12-t02-s1", "c5-maths-ch12-t02-s3"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "ghadi", sk);
  }
});

for (const e of GE()) for (const fade of [1, 2, 3]) {
  test(`ghadi server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "ghadi" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.face, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(ghadiLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && ghadiLogic.malActs(level, m));
        const mg = gradeActs(level, env(ghadiLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}
