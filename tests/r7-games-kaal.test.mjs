// Round 7 · the kaal law (Kaal-nadi, the river of time; the first SST law family). The event years are the kits' own
// (build-kaal --check: every year appears in the kit text it cites); every generated level is solved by its solver and is
// shortcut-free; goal met ⇔ an independent year oracle over thousands of random acts (no year 0: 1 BCE to 1 CE is 1 year);
// each mal-rule's acts land on its OWN misconception moment; tampered params are refused; a claim field in an act never
// decides; the generator's p95 stays fast; and every coverage entry serves a proven level through the play server.
import words from "../data/play/engine-words.json" with { type: "json" };
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { kaalLogic, KAAL_MAL, kaalHelpers as H, malYear, kaalHidden, landmarks } from "../src/play/families/kaal/kaal.logic.ts";
import { coverage, entryFor, entryKey, currentLevel, levelsFor, seedOf, hasPlay, kaalEvents } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { check, EVENTS } from "../server/play/tools/build-kaal.mjs";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT } from "../shared/play.ts";
import { cpuNow } from "./_cpu-ms.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ALL = Object.fromEntries(KAAL_MAL.map((m) => [m, `k-${m}`]));
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = kaalLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = kaalLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
/** the request the play server would make for a topic (its events attached as grammar.events) */
const req = (topicId, mode, goal, seed, o = {}) => ({ family: "kaal", mode, goal, topicId, skillId: `${topicId}-s1`, classLevel: Number(topicId[1]), fade: 1, mis: {}, misMap: ALL,
  grammar: { ...(o.grammar ?? {}), events: kaalEvents(topicId) }, recent: [], seed, ...o, ...(o.grammar ? { grammar: { ...o.grammar, events: kaalEvents(topicId) } } : {}) });
const CASES = [
  ["c6-sst-ch04-t01", "place", "place", { free: true }],
  ["c6-sst-ch04-t01", "place", "century", { free: true }],
  ["c6-sst-ch04-t01", "order", "order", {}],
  ["c7-sst-ch04-t01", "place", "place", {}],
  ["c7-sst-ch04-t01", "order", "order", {}],
  ["c7-sst-ch05-t01", "place", "place", {}],
  ["c7-sst-ch05-t01", "order", "order", {}],
  ["c7-sst-ch07-t01", "place", "place", {}],
  ["c7-sst-ch15-t01", "place", "century", {}],
  ["c7-sst-ch13-t01", "place", "place", {}],
];

// ── the independent oracle (no law helper): years between two real years, a year's century
const apart = (a, b) => (Math.sign(a) === Math.sign(b) ? Math.abs(a - b) : Math.abs(a - b) - 1);
const centuryO = (y) => (y > 0 ? Math.floor((y - 1) / 100) + 1 : -(Math.floor((-y - 1) / 100) + 1));
const oracle = (p, stone, y) => (p.goal === "century" ? centuryO(y) === centuryO(stone.year) : apart(y, stone.year) <= p.tol);

test("kaal events: build-kaal --check passes; every year is literally in the kit text it cites; a wrong year is caught", () => {
  const r = spawnSync(process.execPath, ["server/play/tools/build-kaal.mjs", "--check"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const { problems, per } = check();
  assert.deepEqual(problems, []);
  assert.deepEqual(per, { "c6-sst-ch04-t01": 7, "c7-sst-ch04-t01": 5, "c7-sst-ch05-t01": 5, "c7-sst-ch07-t01": 5, "c7-sst-ch15-t01": 5, "c7-sst-ch13-t01": 4 });
  const bad = EVENTS.map((e) => (e.id === "c7-ashoka" ? { ...e, year: -269 } : e.id === "c7-mahajanapadas" ? { ...e, year: 600 } : e));
  const pr = check(bad).problems;
  assert.ok(pr.some((x) => x.startsWith("c7-ashoka: year -269 is not in")), pr.join("\n"));
  assert.ok(pr.some((x) => x.startsWith("c7-mahajanapadas: year 600 is not in")), "600 CE is not 600 BCE");
  assert.ok(check(EVENTS.map((e) => (e.id === "c7-bindusara" ? { ...e, year: 0 } : e))).problems.some((x) => /no year 0/.test(x)));
  // the client never loads the file: the logic never imports it
  for (const f of ["src/play/families/kaal/kaal.logic.ts", "src/play/families/kaal/kaal.view.ts"]) {
    const code = spawnSync("cat", [f], { cwd: ROOT, encoding: "utf8" }).stdout;
    assert.doesNotMatch(code, /^\s*import[^\n]*(events\.json|levels\.js|node:fs)/m, f);
  }
});

test("kaal river arithmetic: there is no year 0 (1 BCE → 1 CE is 1 year); x ↔ year; centuries", () => {
  assert.equal(H.yearsApart(-1, 1), 1);
  assert.equal(H.yearsApart(-500, -200), 300);
  assert.equal(H.yearsApart(-600, 1950), 2549);   // the c7-ch04 worked example's "about 2,550"
  assert.equal(H.yearsApart(-2600, 2026), 4625);  // c6 i05: "4,625, because there is no year 0"
  for (let x = -60; x <= 60; x += 0.25) { const y = H.yearAt(x); assert.notEqual(y, 0, `x ${x}`); }
  for (const y of [-3000, -101, -100, -2, -1, 1, 2, 100, 101, 1857]) { assert.equal(H.yearAt(H.xOf(y)), y); assert.equal(H.centuryOf(y), centuryO(y)); }
  assert.equal(H.centuryOf(1857), 19); assert.equal(H.centuryOf(1900), 19); assert.equal(H.centuryOf(1901), 20); assert.equal(H.centuryOf(-550), -6);
  for (let k = 0; k < 4000; k++) { const a = ((k * 7919) % 6001) - 3000 || 1, b = ((k * 104729) % 6001) - 3000 || -1; assert.equal(H.yearsApart(a, b), apart(a, b)); }
  assert.equal(H.yearText(-268, "en", { circa: true }), "c. 268 BCE");
  assert.equal(H.yearText(1857, "hinglish"), "1857 CE");
  // Hindi year words live in data/play/engine-words.json (kaal.era.*), rendered by the view
  assert.equal(words.words["kaal.era.bce"].hi, "ई.पू."); assert.equal(words.words["kaal.era.ce"].hi, "ई.");
  assert.equal(H.yearText(1965, "en", { decade: true }), "1960s");
  assert.equal(H.ordinal(19, "en"), "19th"); assert.equal(H.ordinal(21, "en"), "21st"); assert.equal(H.ordinal(12, "en"), "12th"); assert.equal(words.words["kaal.ord.n"].hi, "{n}वीं");
});

for (const [topicId, mode, goal, grammar] of CASES) {
  test(`kaal ${topicId} ${mode}/${goal}: every candidate validates, is solved, is shortcut-free; each mal-rule lands on its own moment`, () => {
    let n = 0;
    const seen = new Set();
    for (const seed of [1, 7, 42, 99]) for (const fade of [1, 2, 3]) for (const c of kaalLogic.generate(req(topicId, mode, goal, seed, { fade, grammar }))) {
      const level = kaalLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal); assert.equal(level.params.labels, fade);
      n++;
      assert.equal(kaalLogic.shortcut(level), null, `${c.signature} shortcut`);
      const solved = run(level, kaalLogic.solve(level));
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      // no stone sits on a landmark: a labelled tick, an end, the middle, the boundary
      for (const st of level.params.stones) for (const y of landmarks(level.params)) if (H.inLine(level.params, y)) assert.ok(!oracle(level.params, st, y), `${c.signature}: ${st.year} at landmark ${y}`);
      for (const mal of KAAL_MAL) {
        const acts = kaalLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.equal(r.refused.at(-1), "missed", `${c.signature} ${mal}: placed legally, then missed`);
        assert.ok(!r.s.done, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal, `${c.signature} ${mal} named as ${mc[0].misconceptionId}`);
        const g = kaalLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    assert.ok(n >= 12, `only ${n} levels`);
    const expect = goal === "century" ? ["century-first-digits"] : topicId === "c6-sst-ch04-t01" && goal === "place" ? ["bce-counts-up", "year-zero"] : topicId.match(/ch0[45]|c6/) ? ["bce-counts-up"] : [];
    for (const m of expect) assert.ok(seen.has(m), `${topicId} ${goal}: mal-rule ${m} never discriminated`);
  });
}

test("kaal mal-rule signatures: BCE mirrored (order reversed), a century from its first digits, a year 0 counted", () => {
  const stone = (year) => ({ id: `year:${year}`, year, circa: false, decade: false, label: null });
  const p = { goal: "place", lo: -600, hi: 400, step: 100, minor: 20, labels: 3, stones: [], tol: 20, text: "year" };
  // on a river from 600 BCE the mirror puts 500 BCE near where 100 BCE belongs, and 100 BCE near 500 BCE: reversed
  assert.equal(malYear(p, stone(-500), "bce-counts-up"), -101);
  assert.equal(malYear(p, stone(-100), "bce-counts-up"), -501);
  for (let a = -590; a < -10; a += 37) for (let b = a + 60; b < -10; b += 41) {
    const ma = malYear(p, stone(a), "bce-counts-up"), mb = malYear(p, stone(b), "bce-counts-up");
    if (ma !== null && mb !== null) assert.ok(H.xOf(ma) > H.xOf(mb), `${a} ${b}: the earlier BCE year lands later`);
  }
  assert.equal(malYear(p, stone(300), "bce-counts-up"), null, "a CE year says nothing");
  assert.equal(malYear(p, stone(-300), "bce-counts-up"), null, "the mirror's middle lands on the truth");
  const c = { ...p, goal: "century", lo: 1500, hi: 2000, minor: 0, tol: 10 };
  assert.equal(H.centuryOf(malYear(c, stone(1857), "century-first-digits")), 18);
  assert.equal(malYear(c, stone(1900), "century-first-digits"), null, "1900 is in the 19th by both rules");
  const c7 = { ...c, lo: 400, hi: 900 };
  assert.equal(H.centuryOf(malYear(c7, stone(634), "century-first-digits")), 6, "Harsha's 7th century read as the 6th");
  const cb = { ...c, lo: -800, hi: -300 };
  assert.equal(H.centuryOf(malYear(cb, stone(-550), "century-first-digits")), -5);
  const z = { goal: "place", lo: -20, hi: 20, step: 5, minor: 1, labels: 3, stones: [], tol: 0, text: "year" };
  assert.equal(malYear(z, stone(5), "year-zero"), 6);
  assert.equal(malYear(z, stone(-3), "year-zero"), -4);
  assert.equal(malYear({ ...z, lo: -100, hi: 100, tol: 4 }, stone(5), "year-zero"), null, "one year off is inside a 4-year tolerance");
  assert.equal(malYear(p, stone(-500), "century-first-digits"), null, "a century belief never fires on a place goal");
});

test("kaal law: year 0 is refused, the river's ends hold, one stone at a time in order, undo", () => {
  const lv = kaalLogic.validate(kaalLogic.generate(req("c7-sst-ch04-t01", "order", "order", 3))[0].level);
  let s = kaalLogic.init(lv);
  const ap = (a) => { const r = kaalLogic.apply(lv, s, a, 1); if (!r.refused) s = r.state; return r; };
  assert.equal(ap({ kind: "check" }).refused, "place_first");
  const z = ap({ kind: "place", which: 0, year: 0 });
  assert.equal(z.refused, "no_year_zero"); assert.ok(z.moments.some((m) => m.kind === "law_refused" && m.facts.why === "no_year_zero"));
  assert.equal(ap({ kind: "place", which: 0, year: lv.params.hi + 50 }).refused, "off_river");
  assert.equal(ap({ kind: "place", which: 1, year: lv.params.stones[1].year }).refused, "one_at_a_time");
  assert.equal(ap({ kind: "place", which: 0, year: 1.5 }).refused, "bad_place");
  assert.equal(ap({ kind: "place", which: 0, year: lv.params.stones[0].year }).refused, undefined);
  const r = ap({ kind: "check" });
  assert.ok(r.moments.some((m) => m.kind === "progress"));
  assert.equal(s.landed[0], true);
  assert.equal(ap({ kind: "place", which: 0, year: lv.params.stones[0].year }).refused, "landed");
  s = kaalLogic.apply(lv, s, { kind: "undo" }, 9).state;
  assert.equal(s.landed[0], false, "undo lifts the landing");
});

test("kaal: tampered params are refused (a year that is not the data file's, a forged name, the river's own tolerance)", () => {
  const lv = kaalLogic.generate(req("c7-sst-ch05-t01", "place", "place", 5))[0].level;
  const ord = kaalLogic.generate(req("c7-sst-ch04-t01", "order", "order", 5))[0].level;
  const free = kaalLogic.generate(req("c6-sst-ch04-t01", "place", "place", 5, { grammar: { free: true } })).map((c) => c.level).find((l) => l.params.stones[0].id.startsWith("year:"));
  assert.ok(kaalLogic.validate(lv) && kaalLogic.validate(ord) && kaalLogic.validate(free));
  const P = (l, patch) => ({ ...l, params: { ...l.params, ...patch } });
  const S = (l, patch, i = 0) => P(l, { stones: l.params.stones.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const st = lv.params.stones[0];
  for (const [l, bad, why] of [
    [lv, S(lv, { year: st.year + 1 }), "a year one off the verified file"],
    [lv, S(lv, { label: { ...st.label, en: "Ashoka wins everything" } }), "a forged event name"],
    [lv, S(lv, { circa: !st.circa }), "circa flipped"],
    [lv, S(lv, { id: "c7-made-up" }), "an event not in the file"],
    [lv, S(lv, { year: 0 }), "year 0"],
    [lv, P(lv, { tol: lv.params.tol + 50 }), "a wider tolerance"],
    [lv, P(lv, { minor: 3 }), "minor ticks not the river's"],
    [lv, P(lv, { step: 7 }), "a step not on the list"],
    [lv, P(lv, { lo: lv.params.lo + 1 }), "an end off the grid"],
    [lv, P(lv, { goal: "order" }), "goal / mode mismatch"],
    [lv, P(lv, { stones: [] }), "no stone"],
    [ord, P(ord, { stones: ord.params.stones.slice(0, 2) }), "order with two stones"],
    [ord, S(ord, { year: ord.params.stones[1].year, id: ord.params.stones[1].id }), "a duplicate stone"],
    [free, S(free, { year: free.params.stones[0].year - 10 }), "a bare year that is not its own id"],
    [free, S(free, { circa: true }), "a bare year made circa"],
    [lv, { ...lv, mode: "hop" }, "a foreign mode"],
    [lv, { ...lv, params: null }, "no params"],
  ]) assert.equal(kaalLogic.validate(bad), null, why);
  // a stone moved off the river
  assert.equal(kaalLogic.validate(P(lv, { hi: lv.params.lo + lv.params.step * 3, tol: undefined })), null);
});

test("kaal: a claim field in an act never decides; the first check decides the evidence; grade replays", () => {
  const level = kaalLogic.validate(kaalLogic.generate(req("c7-sst-ch05-t01", "place", "place", 4))[0].level);
  const p = level.params, far = H.yearAt(p.lo + 1e-6) === p.stones[0].year ? H.yearAt(p.hi - 1e-6) : H.yearAt(p.lo + 1e-6);
  const forged = kaalLogic.grade(level, env([{ kind: "place", which: 0, year: far, correct: true }, { kind: "check", solved: true, verdict: "solved" }]));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = kaalLogic.grade(level, env(kaalLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "place", which: 0, year: far }, { kind: "check" }, ...kaalLogic.solve(level)];
  const g = kaalLogic.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.notEqual(g.evidence[0].outcome, "correct");
  assert.deepEqual(kaalLogic.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per goal: the law never throws; a check lands a stone ⇔ the oracle; goal met ⇔ every stone landed by
// the oracle; generator p95 ≤ 50 ms (best of 3)
for (const [topicId, mode, goal, grammar] of [CASES[0], CASES[1], CASES[4], CASES[6]]) {
  test(`kaal ${topicId} ${goal}: ≥ 2000 random acts; landed ⇔ the year oracle; never throws; generator p95 ≤ 50 ms`, () => {
    let seed = 11, acts = 0, solved = 0, checks = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    for (let g = 0; g < 60; g++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = cpuNow(); cands = kaalLogic.generate(req(topicId, mode, goal, 200 + g, { grammar, fade: 1 + (g % 3) })); best = Math.min(best, cpuNow() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 8)) {
        const level = kaalLogic.validate(c.level), p = level.params, sol = kaalLogic.solve(level);
        let s = kaalLogic.init(level), k = 0;
        const pursue = rnd() < 0.5;
        for (let i = 0; i < 80 && !s.done; i++) {
          const r = rnd(), which = H.currentStone(p, s);
          // pursue: the solver's acts with junk and near-truth drops between; else random years on (and off) the river
          const truthNear = p.stones[Math.min(which, p.stones.length - 1)].year + Math.round((rnd() - 0.5) * 4 * (p.tol + 1));
          const y = r < 0.05 ? 0 : pursue && r < 0.5 && k < sol.length ? null : r < 0.75 ? (truthNear === 0 ? 1 : truthNear) : H.yearAt(p.lo - 5 + rnd() * (p.hi - p.lo + 10));
          const a = y === null ? sol[k++] : rnd() < 0.55 ? { kind: "place", which: rnd() < 0.9 ? which : 0, year: y, ...(rnd() < 0.2 ? { correct: true } : {}) } : rnd() < 0.85 ? { kind: "check", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = kaalLogic.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "check" && out.refused !== "place_first" && !before.done) {
            checks++;
            const kk = H.currentStone(p, before), mark = before.marks[kk];
            assert.equal(out.state.landed[kk], oracle(p, p.stones[kk], mark), `${level.levelId}: law and oracle disagree on ${mark} for ${p.stones[kk].year}`);
          }
          if (a.kind === "place" && a.year === 0) assert.equal(out.refused, "no_year_zero");
          s = out.state;
        }
        const allByOracle = p.stones.every((st, i) => s.landed[i] && oracle(p, st, s.marks[i]));
        assert.equal(kaalLogic.goalMet(level, s), allByOracle);
        if (kaalLogic.goalMet(level, s)) solved++;
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(checks > 200 && solved > 0, `checks ${checks}, solved ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

// the play server: every kaal coverage entry serves a proven level at every fade; the solver grades solved through the
// server; a claim never solves; a discriminated mal-rule folds its kit id; the teacher never says the year
const KE = () => coverage().entries.filter((e) => e.family === "kaal");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, classLevel: entry.classLevel, fade: 1, lang: "hinglish", mis: {}, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], ...over });

test("kaal coverage: the authored entries, mapped to real kit misconceptions, admitted by skill; a verb for every mode", () => {
  assert.deepEqual(KE().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${Object.entries(e.misMap).map(([a, b]) => `${a}>${b}`).join(",")}`), [
    "c6-sst-ch04-t01|place|place|bce-counts-up>c6-sst-ch04-t01-m1",
    "c6-sst-ch04-t01|place|century|century-first-digits>c6-sst-ch04-t01-m2",
    "c6-sst-ch04-t01|order|order|bce-counts-up>c6-sst-ch04-t01-m1",
    "c7-sst-ch04-t01|place|place|bce-counts-up>c7-sst-ch04-t01-m1",
    "c7-sst-ch04-t01|order|order|bce-counts-up>c7-sst-ch04-t01-m1",
    "c7-sst-ch05-t01|place|place|bce-counts-up>c7-sst-ch05-t01-m2",
    "c7-sst-ch05-t01|order|order|bce-counts-up>c7-sst-ch05-t01-m2",
    "c7-sst-ch07-t01|place|place|",
    "c7-sst-ch15-t01|place|century|century-first-digits>c7-sst-ch15-t01-m3",
    "c7-sst-ch15-t01|place|place|",
    "c7-sst-ch13-t01|place|place|",
  ]);
  for (const e of KE()) {
    assert.equal(e.subject, "sst");
    for (const sk of e.skillIds) { assert.ok(hasPlay(sk)); assert.equal(entryFor({ skillId: sk }).family, "kaal", sk); }
  }
  for (const m of ["place", "order"]) { const a = playActOf("kaal", m); assert.ok(a && a.act === "place" && !/chun/.test(a.hi), m); }
  assert.equal(coverage().counts.byFamily.kaal, 6);
  // kaal's six, plus naksha's c6-sst-ch01-t01 (latitude / longitude and the map scale)
  assert.deepEqual(coverage().counts.bySubjectAll.sst, { topics: 65, covered: 7 });
});

for (const e of KE()) for (const fade of [1, 2, 3]) {
  test(`kaal server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const level = currentLevel(s, e);
      assert.ok(level, `${child}: no level`);
      assert.equal(level.family, "kaal"); assert.equal(level.mode, e.mode); assert.equal(level.params.goal, e.goal); assert.equal(level.params.labels, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      assert.ok(kaalLogic.validate(level), "the served level validates against the registered events");
      // the stones are the topic's verified events (or, at class 6, bare years)
      const ids = new Set(kaalEvents(e.topicId).map((x) => x.id));
      for (const st of level.params.stones) assert.ok(ids.has(st.id) || (e.topicId.startsWith("c6-") && st.id === `year:${st.year}`), st.id);
      if (e.classLevel >= 7) assert.equal(level.params.text, "event");
      const hidden = hiddenOf(level);
      for (const st of level.params.stones) assert.ok(hidden.includes(Math.abs(st.year)), "the year is never said before it is placed");
      assert.deepEqual(hidden, kaalHidden(level));
      const g = gradeActs(level, env(kaalLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "check", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && kaalLogic.malActs(level, m));
        const mg = gradeActs(level, env(kaalLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
    }
  });
}

test("kaal: the mapped mal-rules discriminate on served levels (over children and fades)", () => {
  const seen = {};
  for (const e of KE()) for (const fade of [1, 2, 3]) for (let c = 0; c < 6; c++) {
    const r = levelsFor(sessionOf(e, { fade, childId: `d${c}`, seed: seedOf(`d${c}`, entryKey(e), 0) }), e);
    for (const id of r.garam.proof.discriminates) seen[id] = (seen[id] ?? 0) + 1;
  }
  for (const id of ["c6-sst-ch04-t01-m1", "c6-sst-ch04-t01-m2", "c7-sst-ch04-t01-m1", "c7-sst-ch05-t01-m2", "c7-sst-ch15-t01-m3"]) assert.ok(seen[id] > 0, `${id} never discriminated on a served level`);
});
