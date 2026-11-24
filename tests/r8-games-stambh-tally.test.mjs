// Round 8 · stambh/tally (c4-maths-ch14-t01 s1, tallies drawn in fives). The proof suite the other families have:
//   - every generated level (both goals, every fade, many seeds) validates, is solved by its solver with no refusal, and is
//     shortcut-free (none of the idea-free ways through passes: the standing lines alone, the groups, every stroke
//     standing with a true table, every stroke across, the bundles read as four);
//   - goal met ⇔ an independent oracle (the tally written as text, read with a regular expression, never the law's
//     helpers), over ≥ 2000 random acts per goal; the law never throws;
//   - tally-four lands on its own misconception with its own signature (read: 4 × bundles + singles, gap = bundles;
//     keep: no line across, totals short by the groups of five) and no other wrong answer is named tally-four;
//   - tampered params are refused; a verdict field in an act never decides; the first check decides the evidence;
//   - the server serves a proven level for every coverage entry at every fade, the solver's acts grade solved, the mal
//     acts fold the kit id, and the PLAY facts row carries bundles=n; the picto entry of the topic still serves;
//   - ten bundles fit a 360 px row; the generator and the picker are fast in CPU time (tests/_cpu-ms.mjs);
//   - every word the view shows exists in all three languages; no clock, randomness or colour literal in the law or view.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tallyLogic as L, TALLY_MAL, TALLY_CONTEXTS, tallyFlow, tallyOf, groupsOf, four, idleWays } from "../src/play/families/stambh/tally.logic.ts";
import { stambhLogic } from "../src/play/families/stambh/stambh.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, MODES, playFactsRow, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { cpuNow } from "./_cpu-ms.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const MIS = { "tally-four": "k-tally-four" };
const req = (goal, seed, o = {}) => ({ family: "stambh", mode: "tally", goal, topicId: "t", skillId: "t-s1", classLevel: 4, fade: 1, mis: {}, misMap: MIS, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const levels = (goal, seeds = [1, 7, 42, 99, 123, 512]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(goal, seed, { fade }))) out.push(L.validate(c.level));
  return out;
};
/** the oracle: a row as text ("|" standing, "/" across) is a tally of k when it is k strokes in bundles "||||/" then up to
 *  four "|"; the level is met when every row is that tally of its count (keep) and every total is the count */
const text = (marks) => marks.map((m) => (m ? "/" : "|")).join("");
const isTallyOf = (t, k) => /^(\|\|\|\|\/)*\|{0,4}$/.test(t) && t.length === k;
const oracle = (level, s) => level.params.counts.every((c, r) => s.totals[r] === c && (level.params.goal === "read" || isTallyOf(text(s.marks[r]), c)));

for (const goal of ["keep", "read"]) {
  test(`stambh/tally/${goal}: every level validates, solves cleanly, is shortcut-free; tally-four lands on its own misconception`, () => {
    const all = levels(goal);
    assert.ok(all.length >= 60, `${all.length} levels`);
    for (const level of all) {
      assert.ok(level, "validates");
      assert.equal(level.mode, "tally"); assert.equal(level.params.goal, goal);
      assert.equal(L.shortcut(level), null, `${level.levelId} shortcut`);
      const sol = run(level, L.solve(level));
      assert.ok(sol.s.done && sol.ms.some((m) => m.kind === "solved"), `${level.levelId} solves`);
      assert.deepEqual(sol.refused, [], `${level.levelId} solver refused`);
      assert.ok(oracle(level, sol.s), "the oracle agrees with the solve");
      for (const way of idleWays(level.params)) assert.ok(!run(level, way).s.done, `${level.levelId}: an idea-free way passed`);
      for (const mal of TALLY_MAL) {
        const acts = L.malActs(level, mal);
        assert.ok(acts, `${level.levelId}: every served level shows ${mal}`);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"]);
        assert.ok(!r.s.done);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1); assert.equal(mc[0].misconceptionId, mal);
        const g = L.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, "k-tally-four");
        assert.equal(g.facts.mal, "tally-four");
      }
    }
  });
}

test("stambh/tally: tally-four's signature is the belief, and no other wrong answer is named tally-four", () => {
  for (const level of levels("read")) {
    const n = level.params.counts[0], b = Math.floor(n / 5), s = n % 5;
    const r = run(level, L.malActs(level, "tally-four"));
    assert.equal(r.s.totals[0], 4 * b + s, "read: each bundle read as its four standing lines");
    const mc = r.ms.find((m) => m.kind === "misconception_consequence");
    assert.equal(mc.facts.gap, b, "the gap on the number line is the number of bundles");
    assert.equal(mc.facts.bundles, b);
    assert.equal(n - Number(mc.facts.answer), b);
    // every other answer 0..60: never tally-four
    for (let a = 0; a <= 60; a++) {
      if (a === 4 * b + s || a === n) continue;
      const o = run(level, [{ kind: "total", row: 0, n: a }, { kind: "check" }]);
      assert.ok(!o.ms.some((m) => m.kind === "misconception_consequence"), `${n}: ${a} named a mix-up`);
      assert.equal(o.ms.at(-1).kind, Math.abs(a - n) === 1 ? "near_miss" : "law_refused");
    }
  }
  for (const level of levels("keep")) {
    const p = level.params, r = run(level, L.malActs(level, "tally-four"));
    p.counts.forEach((c, k) => {
      assert.ok(r.s.marks[k].every((m) => !m), "keep: no line across anywhere");
      assert.equal(r.s.marks[k].length, c, "one stroke per thing");
      assert.equal(r.s.totals[k], c - Math.floor(c / 5), "each total short by its groups of five");
      assert.equal(groupsOf(r.s.marks[k]).filter((g) => g.kind === "five").length, Math.floor(c / 5), "the commit pass rings each group of five");
    });
    const mc = r.ms.find((m) => m.kind === "misconception_consequence");
    assert.equal(mc.facts.crossesMissing, p.counts.reduce((a, c) => a + Math.floor(c / 5), 0));
    assert.equal(mc.facts.bundles, 0);
    // near the belief but not it: the strokes right and the totals short, or no cross and the totals right → not named
    const right = L.solve(level).filter((a) => a.kind === "mark");
    const short = [...right, ...p.counts.map((c, k) => ({ kind: "total", row: k, n: four(c) })), { kind: "check" }];
    const standTrue = [...right.map((a) => ({ ...a, across: false })), ...p.counts.map((c, k) => ({ kind: "total", row: k, n: c })), { kind: "check" }];
    for (const acts of [short, standTrue]) assert.ok(!run(level, acts).ms.some((m) => m.kind === "misconception_consequence"), level.levelId);
    const nb = run(level, standTrue).ms.at(-1);
    assert.equal(nb.facts.why, "not_bundled");
  }
});

test("stambh/tally: the law's rules (every stroke legal; groups by five at the check; the scene first; the totals; undo)", () => {
  const level = levels("keep", [3])[0], p = level.params;
  let s = L.init(level);
  const ap = (a) => { const r = L.apply(level, s, a, 1); if (!r.refused) s = r.state; return r.refused; };
  assert.equal(ap({ kind: "check" }), "scene_first");
  assert.equal(ap({ kind: "total", row: 0, n: 3 }), "scene_first");
  assert.equal(ap({ kind: "mark", row: 9 }), "bad_row");
  assert.equal(ap({ kind: "mark", row: 0, across: true }), undefined, "a line across with nothing under it is a legal mark");
  assert.equal(s.marks[0].length, 1); assert.equal(s.at, 1);
  assert.equal(ap({ kind: "undo" }), undefined); assert.equal(s.marks[0].length, 0); assert.equal(s.at, 0);
  for (let i = 0; i < p.seq.length; i++) assert.equal(ap({ kind: "mark", row: 0 }), undefined);
  assert.equal(ap({ kind: "mark", row: 0 }), "none_left");
  assert.equal(ap({ kind: "check" }), "fill_first");
  assert.equal(ap({ kind: "total", row: 0, n: 100 }), "bad_number");
  assert.equal(ap({ kind: "total", row: 0, n: 2.5 }), "bad_number");
  assert.equal(ap({ kind: "total", row: 0, n: 7 }), undefined);
  assert.equal(ap({ kind: "total", row: 0, n: null }), undefined); assert.equal(s.totals[0], null);
  // the server's sanitiser drops a null: a cleared cell arrives with n absent and still clears
  const [sanitized] = sanitizeActs([{ seq: 1, t: 0, act: { kind: "total", row: 0, n: null } }]);
  assert.equal(ap({ kind: "total", row: 0, n: 7 }), undefined);
  assert.equal(ap(sanitized.act), undefined); assert.equal(s.totals[0], null);
  // the groups: four standing and one across = a bundle; five standing = no bundle; a line across after two = no bundle
  assert.deepEqual(groupsOf([false, false, false, false, true, false, false]).map((g) => g.kind), ["bundle", "open"]);
  assert.deepEqual(groupsOf(Array(7).fill(false)).map((g) => g.kind), ["five", "open"]);
  assert.deepEqual(groupsOf([false, false, true, false]).map((g) => g.kind), ["short", "open"]);
  assert.deepEqual(groupsOf(tallyOf(12)).map((g) => g.kind), ["bundle", "bundle", "open"]);
  const read = levels("read", [3])[0];
  assert.equal(L.apply(read, L.init(read), { kind: "mark", row: 0 }, 1).refused, "given");
  assert.deepEqual(hiddenOf(read), [read.params.counts[0]], "the teacher never says the count first");
  assert.deepEqual(hiddenOf(level), [...new Set(p.counts)]);
});

test("stambh/tally: tampered params are refused", () => {
  const k = levels("keep", [6])[0], r = levels("read", [6])[0];
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [k, { counts: k.params.counts.map((c) => c + 1) }], [k, { seq: [...k.params.seq, 0] }], [k, { seq: k.params.seq.map(() => 9) }], [k, { ctx: "casino" }],
    [k, { cats: k.params.cats.map(() => "car") }], [k, { goal: "win" }], [k, { counts: k.params.counts.map(() => 2), seq: k.params.cats.flatMap((_, i) => [i, i]) }],
    [k, { cats: [k.params.cats[0]], counts: [k.params.counts[0]], seq: k.params.seq.filter((x) => x === 0) }],
    [r, { counts: [3] }], [r, { counts: [99] }], [r, { counts: [7.5] }], [r, { seq: [0] }], [r, { cats: ["car", "bus"], counts: [6, 6] }],
  ]) assert.equal(L.validate(bad(lv, patch)), null, JSON.stringify(patch).slice(0, 80));
  assert.equal(L.validate({ ...k, mode: "bars" }), null);
  assert.equal(L.validate({ ...k, params: null }), null);
});

test("stambh/tally: a verdict field in an act never decides; the first check decides the evidence; grade replays", () => {
  for (const level of [levels("read", [4])[0], levels("keep", [4])[0]]) {
    const forged = L.grade(level, env([{ kind: "check", solved: true, verdict: "solved" }, { kind: "total", row: 0, n: 1, correct: true }]));
    assert.notEqual(forged.verdict, "solved");
    const ok = L.grade(level, env(L.solve(level)));
    assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
    const wrong = [...L.malActs(level, "tally-four"), { kind: "undo" }, ...L.solve(level).filter((a) => a.kind === "total" || a.kind === "check")];
    const g = L.grade(level, env(wrong));
    assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, "k-tally-four");
    assert.deepEqual(L.grade(level, env(wrong)), g);
  }
});

for (const goal of ["keep", "read"]) {
  test(`stambh/tally/${goal}: ≥ 2000 random acts; a check is solved ⇔ the oracle; never throws; generator work bounded (counted)`, () => {
    let seed = 11, acts = 0, solved = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const counts = [];
    for (let g = 0; g < 30; g++) {
      const cands = L.generate(req(goal, 300 + g, { fade: 1 + (g % 3) }));
      counts.push(cands.length);
      for (const c of cands.slice(0, 3)) {
        const level = L.validate(c.level), sol = L.solve(level), rows = level.params.cats.length;
        let s = L.init(level), k = 0;
        const pursue = rnd() < 0.5;
        for (let i = 0; i < 120 && !s.done; i++) {
          const r = rnd(), row = Math.floor(rnd() * (rows + 1));
          const a = pursue ? (r < 0.75 && k < sol.length ? sol[k++] : r < 0.88 ? { kind: "mark", row, across: rnd() < 0.3 } : { kind: "check", solved: true })
            : r < 0.45 ? { kind: "mark", row, across: rnd() < 0.25 } : r < 0.7 ? { kind: "total", row, n: rnd() < 0.1 ? null : Math.floor(rnd() * 30) } : r < 0.85 ? { kind: "check" } : { kind: "undo" };
          const before = s, out = L.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "check" && !["scene_first", "fill_first", "level_over"].includes(out.refused)) assert.equal(out.state.done, oracle(level, before), `${level.levelId}: law and oracle disagree`);
          s = out.state;
        }
        if (L.goalMet(level, s)) { solved++; assert.ok(oracle(level, s)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(solved > 0);
    assert.ok(Math.max(...counts) <= 48, `${Math.max(...counts)} candidates per call (measured 2026-11-11: 16; bound is 3x)`);
  });
}

test("stambh/tally: ten bundles (and four) fit a 360 px row; the flow never leaves its box", () => {
  // the read row at the 360 phone's play box (324 px world, 16 px margins) and the keep row's tally box at 360
  for (const [width, height] of [[292, 96], [168, 40], [140, 52], [700, 220]]) {
    for (const n of [1, 5, 9, 23, 50, 54]) for (const grouped of [false, true]) {
      const marks = tallyOf(n), f = tallyFlow(marks, width, height, grouped);
      assert.equal(f.stand.length + f.across.length, n);
      assert.ok(f.right <= width + 0.01, `${n} at ${width}: right ${f.right}`);
      assert.ok(f.lines * f.lineH <= height + 0.01, `${n} at ${width}x${height}: ${f.lines} lines of ${f.lineH}`);
      for (const a of f.across) assert.ok(a.x0 >= 0 && a.x1 <= width);
    }
  }
  const ten = tallyFlow(tallyOf(50), 292, 96, false);
  assert.ok(ten.sp >= 5 && ten.sh >= 16, `ten bundles at 360: spacing ${ten.sp}, height ${ten.sh}`);
  // five standing lines without a cross, as she drew them, still fit
  const five = tallyFlow(Array(14).fill(false), 168, 40, true);
  assert.equal(five.stand.length, 14);
});

test("stambh/tally: the generator and the picker are fast (CPU time, p95 ≤ 50 ms)", () => {
  const gen = [], pick = [];
  for (const goal of ["keep", "read"]) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 8; seed++) {
    let t0 = cpuNow(); L.generate(req(goal, seed * 31, { fade })); gen.push(cpuNow() - t0);
    t0 = cpuNow(); pickLevels(L, req(goal, seed * 31, { fade })); pick.push(cpuNow() - t0);
  }
  for (const [name, xs] of [["generate", gen], ["pick", pick]]) { xs.sort((a, b) => a - b); const p95 = xs[Math.floor(xs.length * 0.95)]; assert.ok(p95 <= 50, `${name} p95 ${p95.toFixed(1)} ms`); }
});

test("stambh/tally: registered (MODES, logic, view, a verb that never chooses); the words in three languages; no clock, randomness or colour literal", () => {
  assert.deepEqual([...MODES.stambh], ["bars", "picto", "tally"]);
  assert.equal(LOGIC["stambh/tally"], L);
  assert.equal(LOGIC["stambh/picto"], stambhLogic);
  const v = playActOf("stambh", "tally");
  assert.ok(v && v.hi && v.en && v.act !== "choose");
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8");
  assert.match(views, /"stambh\/tally": makeTallyView/);
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/stambh/tally.view.ts`, "utf8");
  const used = [...view.matchAll(/"(stambh\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = Object.keys(TALLY_CONTEXTS).map((c) => `stambh.ctx.${c}`).concat(Object.values(TALLY_CONTEXTS).flat().map((c) => `stambh.cat.${c}`));
  assert.ok(used.length >= 4);
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  // the words never state the rule, the answer or where a stroke goes (no five, no "across" / "standing" instruction)
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(words[k][l], /\d|\bfive\b|paanch|पाँच|\bacross\b|\bcross\b|khadi|tirchi|bundle/i, `${k} ${l}`);
  const src = readFileSync(`${ROOT}src/play/families/stambh/tally.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  // the view draws no string but words, her own numbers and the "0" of the number line
  const literals = [...view.replace(/\/\/.*$/gm, "").matchAll(/P\.(?:text|textFit|chip)\(c, ("[^"]*")/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(literals)].sort(), ['"0"', '"="'].sort());
});

// the play server: both tally entries serve a proven level at every fade, through the same picker a lesson uses
const TE = () => coverage().entries.filter((e) => e.family === "stambh" && e.mode === "tally");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("stambh/tally coverage: keep and read on c4-maths-ch14-t01 s1, mapped to the kit's tally-four; picto keeps s2 / s3", () => {
  const es = TE();
  assert.deepEqual(es.map((e) => `${e.topicId}|${e.goal}|${e.skillIds.join(",")}`), ["c4-maths-ch14-t01|keep|c4-maths-ch14-t01-s1", "c4-maths-ch14-t01|read|c4-maths-ch14-t01-s1"]);
  for (const e of es) assert.deepEqual(e.misMap, { "tally-four": "c4-maths-ch14-t01-m-tally-four" });
  assert.ok(hasPlay("c4-maths-ch14-t01-s1"));
  assert.equal(entryFor({ skillId: "c4-maths-ch14-t01-s1" }).mode, "tally");
  for (const sk of ["s2", "s3"]) assert.equal(entryFor({ skillId: `c4-maths-ch14-t01-${sk}` }).mode, "picto");
  assert.equal(entryFor({ topicId: "c4-maths-ch14-t01" }).mode, "picto", "the topic's first entry is still the pictograph");
  const picto = coverage().entries.find((e) => e.topicId === "c4-maths-ch14-t01" && e.mode === "picto");
  const lv = currentLevel(sessionOf(picto), picto);
  assert.ok(lv && stambhLogic.validate(lv), "the picto entry still serves");
});

for (const e of TE()) for (const fade of [1, 2, 3]) {
  test(`stambh/tally server ${e.goal} fade ${fade}: a proven level; solve grades solved; tally-four folds its kit id; the facts row says bundles`, () => {
    const seen = new Set();
    for (const child of ["c1", "c2", "c3", "c4"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const level = levelsFor(s, e)?.garam;
      assert.ok(level, "no level");
      seen.add(level.levelId);
      assert.equal(level.mode, "tally"); assert.equal(level.goal, e.goal); assert.equal(level.params.labels, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      assert.deepEqual(level.proof.discriminates, ["c4-maths-ch14-t01-m-tally-four"]);
      const g = gradeActs(level, env(L.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.equal(rows[0].skillId, "c4-maths-ch14-t01-s1");
      const row = playFactsRow({ game: "stambh/tally", verdict: g.grade.verdict, first_try: 1, misses: 0, chose: "pick_fit", next: "fade_up", ...g.grade.facts });
      const want = e.goal === "read" ? Math.floor(level.params.counts[0] / 5) : level.params.counts.reduce((a, c) => a + Math.floor(c / 5), 0);
      assert.match(row, new RegExp(`(^| )bundles=${want}( |$)`), row);
      const mg = gradeActs(level, env(L.malActs(level, "tally-four")), { final: true });
      assert.equal(mg.grade.evidence[0].misconceptionId, "c4-maths-ch14-t01-m-tally-four");
      const mrow = playFactsRow({ game: "stambh/tally", verdict: mg.grade.verdict, first_try: 0, misses: 1, chose: "pick_fit", next: "fade_up", ...mg.grade.facts });
      assert.match(mrow, / mal=tally-four/, mrow);
      if (e.goal === "keep") assert.match(mrow, / crossesMissing=\d+/, mrow);
      assert.match(mrow, / answer=[\d,]+/, mrow);
    }
    assert.ok(seen.size >= 2, `${seen.size} distinct levels over 4 children`);
  });
}
