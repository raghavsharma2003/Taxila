// r7 kon2 (lines and angles): kon's line goals. lines/parallel and lines/perp (turn line 2 on squared paper), cross/corr and
// cross/alt (a transversal: open ∠2 so canal 2 runs parallel to canal 1) and ends/ends (segment / ray / line by where the
// stops sit). Pure law checks; an INDEPENDENT checker that does its own coordinate geometry (direction vectors, cross and
// dot products, a 2×2 solve for the crossing) and never calls the law's helpers; each mal-rule landing on its own
// misconception; generator p95; every new coverage entry served as the play server would; and every EARLIER kon level
// pinned (the same generator output and the same served levelIds as before this change).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { konLogic } from "../src/play/families/kon/kon.logic.ts";
import coverage from "../data/play/coverage.json" with { type: "json" };

const MODE = { parallel: "lines", perp: "lines", corr: "cross", alt: "cross", ends: "ends" };
const MIS = {
  parallel: { "not-meet-on-page": "m-nm" }, perp: { "perp-upright": "m-pu" }, corr: { "corr-position": "m-cp" },
  alt: { "same-side-equal": "m-se", "alt-same-side": "m-as" }, ends: { "ray-two-ends": "m-r2", "ray-order": "m-ro", "line-ends": "m-le" },
};
const req = (goal, seed, fade = 1, grammar = {}) => ({ family: "kon", mode: MODE[goal], goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade, mis: {}, misMap: MIS[goal], grammar, recent: [], seed });
const run = (level, acts) => { let s = konLogic.init(level); const ms = []; acts.forEach((a, i) => { const r = konLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); }); return { s, ms }; };

// ── the independent checker: plain coordinates, no law code
const R = (d) => (d * Math.PI) / 180;
const vec = (d) => [Math.cos(R(d)), Math.sin(R(d))];
const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = (a) => Math.hypot(a[0], a[1]);
/** the unsigned angle between two rays given as vectors, degrees */
const between = (a, b) => (Math.acos(Math.max(-1, Math.min(1, dot2(a, b) / (len(a) * len(b))))) * 180) / Math.PI;
/** where line (p + s·a) meets line (q + t·b), or null when parallel */
function meet(p, a, q, b) { const den = cross2(a, b); if (Math.abs(den) < 1e-12) return null; const s = cross2([q[0] - p[0], q[1] - p[1]], b) / den; return [p[0] + a[0] * s, p[1] + a[1] * s]; }
/** does the child's committed state solve the level? (coordinate geometry; tolerance as an angle between the lines) */
function indepSolved(p, heading, stops) {
  if (p.goal === "parallel" || p.goal === "perp") {
    const l1 = [p.dx, p.dy], l2 = vec(heading), sinA = Math.abs(cross2(l1, l2)) / len(l1), cosA = Math.abs(dot2(l1, l2)) / len(l1);
    return p.goal === "parallel" ? sinA <= Math.sin(R(p.tol)) + 1e-9 : cosA <= Math.sin(R(p.tol)) + 1e-9;
  }
  if (p.goal === "corr" || p.goal === "alt") {
    // canal 1 runs along lam through X1; canal 2 at the child's heading through X2: parallel means no crossing to within tol
    const c1 = vec(p.lam), c2 = vec(heading);
    return Math.abs(cross2(c1, c2)) <= Math.sin(R(p.tol)) + 1e-9;
  }
  // ends: count the stopped ends, then read the figure's name off them
  const X = p.x, Y = p.y, kind = (stops.lo >= 0) + (stops.hi >= 0);
  if (p.fig === "line") return kind === 0;
  if (p.fig === "seg") return kind === 2 && new Set([stops.lo, stops.hi]).size === 2 && [stops.lo, stops.hi].includes(X) && [stops.lo, stops.hi].includes(Y);
  if (kind !== 1) return false;
  const start = stops.lo >= 0 ? stops.lo : stops.hi, openRight = stops.hi < 0;
  return start === X && (openRight ? Y > X : Y < X);
}
/** the cross board in coordinates: X2 at the origin, X1 up the road; ∠1 and the reading ∠2 needs, from rays alone */
function crossGeometry(p) {
  const up = vec(p.start), down = [-up[0], -up[1]], c = vec(p.lam), cm = [-c[0], -c[1]];
  const t1 = p.t1 === "up" ? up : down, l1 = p.l1 === 1 ? c : cm, t2 = p.t2 === "up" ? up : down, l2 = p.l2 === 1 ? c : cm;
  const a1 = between(t1, l1);
  // equal when ∠2 is at the same corner (corresponding) or at the opposite corner across both lines (alternate); otherwise
  // the two make a straight angle
  const equal = (p.t2 === p.t1) === (p.l2 === p.l1);
  return { a1, need: equal ? a1 : 180 - a1, readAt: (h) => between(t2, vec(h)) };
}
const PAGE = 5;

for (const goal of Object.keys(MODE)) {
  test(`kon/${MODE[goal]}/${goal}: every generated level validates, is solved by its solver, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    let n = 0; const mals = {};
    for (const fade of [1, 2, 3]) for (const seed of [1, 7, 42, 99]) for (const c of konLogic.generate(req(goal, seed, fade))) {
      const level = konLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, MODE[goal]);
      n++;
      const solved = run(level, konLogic.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.ok(indepSolved(level.params, solved.s.heading, solved.s.stops), `${c.signature}: the independent check disagrees with the solver`);
      assert.equal(konLogic.shortcut(level), null, `${c.signature} has a shortcut`);
      for (const mal of Object.keys(MIS[goal])) {
        const acts = konLogic.malActs(level, mal);
        if (!acts) continue;
        mals[mal] = (mals[mal] ?? 0) + 1;
        const r = run(level, acts);
        assert.ok(!r.s.done, `${c.signature} ${mal} must not solve`);
        assert.ok(!indepSolved(level.params, r.s.heading, r.s.stops), `${c.signature} ${mal}: independently it solves`);
        const named = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(named.length, 1, `${c.signature} ${mal}`);
        assert.equal(named[0].misconceptionId, mal, `${c.signature} ${mal} named ${named[0].misconceptionId}`);
      }
    }
    assert.ok(n >= 20, `only ${n} levels`);
    for (const mal of Object.keys(MIS[goal])) assert.ok(mals[mal] > 0, `${mal} never applied`);
  });
}

test("kon/lines: line 1 sits on the squared paper's grid, never flat or upright; a parallel P is off line 1; the not-meet-on-page line misses the page and still meets line 1", () => {
  for (const seed of [3, 5, 8]) for (const goal of ["parallel", "perp"]) for (const c of konLogic.generate(req(goal, seed))) {
    const p = konLogic.validate(c.level).params, tilt = (Math.atan2(p.dy, p.dx) * 180) / Math.PI;
    const off = Math.min(...[0, 90, 180, -90, -180].map((l) => Math.abs(tilt - l)));
    assert.ok(off >= 18, `${c.signature} tilt ${tilt}`);
    if (goal === "perp") { assert.deepEqual([p.px, p.py], [0, 0]); continue; }
    assert.notEqual(cross2([p.dx, p.dy], [p.px, p.py]), 0, `${c.signature} P on line 1`);
    // the solver's line through P also passes through the grid point P + (dx, dy): counting squares draws it
    const h = konLogic.solve(konLogic.validate(c.level))[0].deg;
    assert.ok(Math.abs(cross2(vec(h), [p.dx, p.dy])) < 1e-9);
    const mh = konLogic.malActs(konLogic.validate(c.level), "not-meet-on-page")[0].deg;
    const m = meet([0, 0], [p.dx, p.dy], [p.px, p.py], vec(mh));
    assert.ok(m, "the mal line is not parallel");
    assert.ok(Math.abs(m[0]) > PAGE || Math.abs(m[1]) > PAGE, `${c.signature}: the mal line meets line 1 ON the page at ${m}`);
  }
});

test("kon/lines/perp: the upright line is perpendicular only to a flat line 1, never to the tilted ones served", () => {
  for (const c of konLogic.generate(req("perp", 11))) {
    const p = konLogic.validate(c.level).params;
    assert.ok(Math.abs(dot2([p.dx, p.dy], [0, 1])) / len([p.dx, p.dy]) > Math.sin(R(p.tol)), c.signature);
  }
});

test("kon/cross: ∠1's number is the drawn angle; the solver's canal 2 makes ∠2 read what the relation needs (equal, or 180° − ∠1)", () => {
  let equal = 0, straight = 0;
  for (const goal of ["corr", "alt"]) for (const seed of [2, 4, 6, 8]) for (const c of konLogic.generate(req(goal, seed))) {
    const level = konLogic.validate(c.level), p = level.params, G = crossGeometry(p);
    assert.ok(Math.abs(G.a1 - p.given) < 1e-6, `${c.signature} ∠1 ${G.a1} vs ${p.given}`);
    assert.ok(Math.abs(G.a1 - 90) >= 12, c.signature);
    const h = konLogic.solve(level)[0].deg;
    assert.ok(Math.abs(G.readAt(h) - G.need) < 1e-6, `${c.signature}: ∠2 reads ${G.readAt(h)}, needs ${G.need}`);
    if (Math.abs(G.need - p.given) < 1e-6) equal++; else straight++;
    if (goal === "alt") { assert.equal(p.t1, "down"); assert.equal(p.t2, "up"); }   // both angles between the canals
  }
  assert.ok(equal > 5 && straight > 5, `equal ${equal}, straight ${straight}: copying ∠1 must not always pass`);
});

test("kon/ends: tampered params are refused (a repeated letter, a figure named by one point, an unknown figure); a stop act off the track is refused", () => {
  const base = { v: "play@1", levelId: "x", family: "kon", mode: "ends", goal: "ends", topicId: "t", skillId: "t-s1", fade: 1, targets: [], mal: {}, slip: null, seed: 1 };
  for (const params of [
    { goal: "ends", start: 0, names: "AAB", fig: "ray", x: 0, y: 1, tol: 1 },
    { goal: "ends", start: 0, names: "ABC", fig: "seg", x: 1, y: 1, tol: 1 },
    { goal: "ends", start: 0, names: "ABC", fig: "curve", x: 0, y: 1, tol: 1 },
    { goal: "parallel", dx: 2, dy: 1, px: 4, py: 2, tol: 2 },
    { goal: "perp", dx: 2, dy: 1, px: 1, py: 0, tol: 3 },
    { goal: "alt", start: 60, lam: 0, t1: "up", l1: 1, t2: "up", l2: 1, given: 60, tol: 3 },
    { goal: "corr", start: 60, lam: 0, t1: "up", l1: 1, t2: "up", l2: 1, given: 61, tol: 3 },
  ]) assert.equal(konLogic.validate({ ...base, mode: MODE[params.goal], params }), null, JSON.stringify(params));
  const level = konLogic.validate({ ...base, params: { goal: "ends", start: 10, names: "PQR", fig: "ray", x: 1, y: 2, tol: 1 } });
  assert.ok(level);
  let s = konLogic.init(level);
  assert.equal(konLogic.apply(level, s, { kind: "stop", side: "lo", at: 3 }, 1).refused, "bad_stop");
  assert.equal(konLogic.apply(level, s, { kind: "commit" }, 1).refused, "stops_first");
  s = konLogic.apply(level, s, { kind: "stop", side: "hi", at: 0 }, 1).state;
  assert.equal(konLogic.apply(level, s, { kind: "stop", side: "lo", at: 2 }, 2).refused, "stops_cross");
  // ray QR: the stop on Q, R's side open
  const r = run(level, [{ kind: "stop", side: "lo", at: 1 }, { kind: "stop", side: "hi", at: -1 }, { kind: "commit" }]);
  assert.ok(r.s.done);
});

test("kon line goals: a verdict field in an act never decides; only the first commit's landing does", () => {
  const level = konLogic.validate(konLogic.generate(req("alt", 4))[0].level);
  const wrong = konLogic.malActs(level, "same-side-equal") ?? konLogic.malActs(level, "alt-same-side");
  const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, act }));
  const g = konLogic.grade(level, env([{ ...wrong[0], correct: true }, { kind: "commit", solved: true }]));
  assert.notEqual(g.evidence[0]?.outcome, "correct");
  assert.equal(konLogic.grade(level, env(konLogic.solve(level))).evidence[0]?.outcome, "correct");
});

for (const goal of Object.keys(MODE)) {
  test(`kon/${goal}: ≥ 2000 random acts; goal met ⇒ the independent check agrees; the law never throws; generator work bounded (counted, not timed)`, () => {
    let seed = 17, acts = 0, solved = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const candCounts = []; // candidates per generate: a count, not a clock (tests/_work.mjs)
    for (let k = 0; k < 40; k++) {
      const cands = konLogic.generate(req(goal, 200 + k, 1 + (k % 3)));
      candCounts.push(cands.length);
      for (const c of cands.slice(0, 5)) {
        const level = konLogic.validate(c.level), sol = konLogic.solve(level);
        let s = konLogic.init(level), last = null;
        for (let i = 0; i < 25 && !s.done; i++) {
          const r = rnd();
          let a;
          if (goal === "ends") a = r < 0.6 ? { kind: "stop", side: rnd() < 0.5 ? "lo" : "hi", at: Math.floor(rnd() * (level.params.names.length + 3)) - 2, ...(rnd() < 0.2 ? { correct: true } : {}) }
            : r < 0.7 ? sol[Math.floor(rnd() * 2)] : r < 0.9 ? { kind: "commit", ...(rnd() < 0.2 ? { solved: true } : {}) } : { kind: "undo" };
          else a = r < 0.55 ? { kind: "turn", deg: r < 0.2 ? sol[0].deg + (rnd() - 0.5) * 2 * level.params.tol + (rnd() < 0.5 ? 180 : 0) : rnd() * 720 - 360 }
            : r < 0.85 ? { kind: "commit", ...(rnd() < 0.2 ? { solved: true } : {}) } : { kind: "undo" };
          const out = konLogic.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "commit") last = { heading: s.heading, stops: s.stops };
          s = out.state;
        }
        if (konLogic.goalMet(level, s)) { solved++; assert.ok(indepSolved(level.params, last.heading, last.stops), `${level.levelId}: the law says solved at ${JSON.stringify(last)}`); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(solved > 0, "the battery never solved a level");
    assert.ok(Math.max(...candCounts) <= 90, `${Math.max(...candCounts)} candidates per call (measured 2026-11-10: 30; bound is 3x)`);
  });
}

test("kon: every r7 kon2 coverage entry serves a level as the play server would, with its kit misconceptions mapped", async () => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  const mine = coverage.entries.filter((e) => e.family === "kon" && ["lines", "cross", "ends"].includes(e.mode));
  assert.deepEqual([...new Set(mine.map((e) => e.topicId))].sort(), ["c6-maths-ch02-t01", "c7-maths-ch05-t02", "c7-maths-ch05-t03"]);
  for (const entry of mine) {
    for (const id of Object.values(entry.misMap)) assert.ok(id.startsWith(`${entry.topicId}-m-`), id);
    for (let n = 0; n < 4; n++) {
      const key = entryKey(entry);
      const s = { childId: `t-${n}`, key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
        mis: {}, pL: undefined, n: 0, seed: seedOf(`t-${n}`, key, 0), door: "garam", recent: [], hist: null };
      const lv = currentLevel(s, entry);
      assert.ok(lv, `${entry.topicId} ${entry.mode}/${entry.goal} served nothing`);
      assert.equal(lv.mode, entry.mode);
      assert.equal(lv.params.goal, entry.goal);
    }
  }
});

// ── earlier kon levels are unchanged: generator output hashes and served levelIds recorded before the r7 kon2 change
const OLD_MODE = { turn: "turn", set: "set", kind: "zone", match: "zone", linear: "pair", tri: "close", iso: "close" };
const PINNED = {"turn|1|1":"9c06bd234033b7fd","turn|1|7":"e8385b6369d78b68","turn|1|42":"36db7d2dafe3e0a9","turn|2|1":"d059173541a94b20","turn|2|7":"f3881995f90cc97e","turn|2|42":"d43dc6990b3b8980","turn|3|1":"822f14e68f82b790","turn|3|7":"15f2a92eac425fc6","turn|3|42":"2103ba19cb2999f1","set|1|1":"8755d3f17a0edb2b","set|1|7":"d9a66252f5e71e7c","set|1|42":"ab5dc79494977af6","set|2|1":"960ab3e3e86e53dc","set|2|7":"1698f4d916222c0a","set|2|42":"55baa0f1f8fe4d59","set|3|1":"fe4aead6e9e44618","set|3|7":"bbb0bec378db6959","set|3|42":"a0e8fe1bb5102298","kind|1|1":"140c58a0c7b03fa9","kind|1|7":"8e867d32ecbac6a0","kind|1|42":"ebd7fcedab563dc8","kind|2|1":"604d9c37e12592b8","kind|2|7":"835c43f4629a58f3","kind|2|42":"13125d8146a5af9b","kind|3|1":"4e4ff17b0d255eb1","kind|3|7":"509e071d535d0aee","kind|3|42":"9f4ac2ddcc507af2","match|1|1":"bd5bdf27915764ad","match|1|7":"b2ce0c53bc50470b","match|1|42":"a81cc8d5abaa0df1","match|2|1":"e2714cad15c7bc35","match|2|7":"108e316406fbe106","match|2|42":"62d9da97b51c68d7","match|3|1":"cf067e4c3e3aeee4","match|3|7":"1700e110429e29c0","match|3|42":"2b144480db649ef8","linear|1|1":"5111abe3a95dc731","linear|1|7":"f75e15aac65e5c21","linear|1|42":"aba1402fb0bc7cbc","linear|2|1":"a54bf19ea6a16156","linear|2|7":"e73a9ee19b21e128","linear|2|42":"ec67752dea14ad15","linear|3|1":"0e8aa4e048a28443","linear|3|7":"457ac1f42c22b9a0","linear|3|42":"f6499e49e5729db7","tri|1|1":"8f2a0e7a9d89999d","tri|1|7":"cbd0845df8bf8db3","tri|1|42":"c3f2cb025f43ec3c","tri|2|1":"f46a3eb9b624ffe2","tri|2|7":"14d2f9043c9a748d","tri|2|42":"344cd59eedfd9eef","tri|3|1":"76169db2774da0e7","tri|3|7":"ad63d26cbf952aea","tri|3|42":"2b95b4c29304ac86","iso|1|1":"15302ba3f15b842b","iso|1|7":"4034a40cb0d1b2d1","iso|1|42":"4b26a3b821c35e75","iso|2|1":"b5967b146e8ac551","iso|2|7":"00b4cb856232fe15","iso|2|42":"b8a43d3b113198df","iso|3|1":"ab2bdf07224479a1","iso|3|7":"c28d3098f9407659","iso|3|42":"c8721d7cad36baad"};
const SERVED = [["c5-maths-ch03-t01","turn","turn","kon-turn:270:1acw-653885954"],["c6-maths-ch02-t03","set","set","kon-set:140m-129791175"],["c4-maths-ch01-t02","zone","kind","kon-kind:right:15-544924074"],["c4-maths-ch01-t02","zone","match","kon-match:145:330:150-234603691"],["c5-maths-ch03-t02","zone","kind","kon-kind:right:120-53322944"],["c6-maths-ch02-t04","zone","kind","kon-kind:right:120-235402786"],["c6-maths-ch02-t02","zone","match","kon-match:55:240:60-999627863"],["c7-maths-ch05-t01","pair","linear","kon-linear:50-592247203"],["c7-maths-ch07-t03","close","tri","kon-tri::105:25-72155403"],["c7-maths-ch09-t03","close","iso","kon-iso:base:30:-400213788"]];

test("kon: every earlier goal generates exactly what it generated before r7 kon2", () => {
  for (const [k, hash] of Object.entries(PINNED)) {
    const [goal, fade, seed] = k.split("|");
    const c = konLogic.generate({ family: "kon", mode: OLD_MODE[goal], goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: Number(fade), mis: {}, misMap: { "wrong-pair": "x" },
      grammar: goal === "kind" ? { kinds: ["acute", "right", "obtuse", "straight", "reflex"] } : {}, recent: [], seed: Number(seed) });
    assert.equal(createHash("sha256").update(JSON.stringify(c)).digest("hex").slice(0, 16), hash, k);
  }
});

test("kon: every earlier coverage entry still serves the same levelId", async () => {
  const { currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  for (const [topicId, mode, goal, levelId] of SERVED) {
    const entry = coverage.entries.find((e) => e.family === "kon" && e.topicId === topicId && e.mode === mode && e.goal === goal);
    assert.ok(entry, `${topicId} ${mode}/${goal}`);
    const key = entryKey(entry);
    const s = { childId: "pin", key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null, mis: {}, pL: undefined, n: 0, seed: seedOf("pin", key, 0), door: "garam", recent: [], hist: null };
    assert.equal(currentLevel(s, entry).levelId, levelId);
  }
});

// Seen in a real browser (r7, 360 px): the cross run's "off by" chip never appeared, because busy() stopped redrawing at
// 1.6 s and the chip only drew after 1.6 s. Every timed beat of the lines / cross / ends run must land inside the window
// that keeps the stage drawing.
test("kon lines view: the run keeps drawing until its last timed beat has landed", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/play/families/kon/kon.lines.view.ts", import.meta.url), "utf8");
  const end = Number(src.match(/const RUN_END = ([0-9.]+)/)?.[1]);
  assert.ok(end > 0, "RUN_END is declared");
  assert.match(src, /api\.t - truthAt < RUN_END/, "busy() uses RUN_END");
  const beats = [
    ...[...src.matchAll(/api\.t - truthAt > ([0-9.]+)/g)].map((m) => Number(m[1])),
    ...[...src.matchAll(/\(api\.t - truthAt - ([0-9.]+)\) \/ ([0-9.]+)/g)].map((m) => Number(m[1]) + Number(m[2])),
  ];
  assert.ok(beats.length >= 3, `found the run's timed beats (${beats.length})`);
  for (const b of beats) assert.ok(b < end, `a beat at ${b} s lands after the stage stops drawing at ${end} s`);
});
