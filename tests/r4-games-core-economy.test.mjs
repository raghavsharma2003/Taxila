// The logic-level economy lint (round 4, G1; CORE-API §11; dc-r4-gamification-b, FEASIBILITY §6). The NEVER MANIPULATE
// ban was enforced on copy only (r4p-economy-ban-copy-only); this enforces it on game LOGIC, static and runtime, over every
// engine module (src/play/engines/**) and every family law:
//   1. no persisted counters: no web storage / cookies outside the G5 whitelist (the child's music preference);
//   2. no wall-clock reads in progress code (the core's frame clock is cosmetic and is never a grade or progress input);
//   3. no timer that can end or penalise a level: engines may not schedule an act or a progress write; the only timers
//      are the audio sequencer's; "brisk" pace exists only behind `secure`;
//   4. no RNG after generation: no Math.random in engines (cosmetics use core.cosmeticRandom) or in laws (seeded only);
//   5. every state change traced: the progress store refuses a write without a cause (runtime half, browser test
//      tests/r4-games-core-engine.test.mjs replays real levels and checks the trace);
//   6. no economy words in engine copy (points, coins, streak, lives, reward, leaderboard, …).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels, env } from "../src/play/core/pick.ts";
import { replayAll } from "../src/play/core/replay.ts";
import { Progress } from "../src/play/engines/core3d/progress.ts";
import { COPY } from "../src/play/copy.ts";
import { dressFor } from "../src/play/engines/core3d/api.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const ENGINES = walk(join(ROOT, "src/play/engines")).filter((f) => /\.(ts|tsx)$/.test(f));
const LAWS = walk(join(ROOT, "src/play/families")).filter((f) => /\.logic\.ts$|labs\.ts$/.test(f));
const rel = (f) => relative(ROOT, f);
/** code without comments (a rule named in a comment is documentation, not a use) */
const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((l) => l.replace(/\/\/.*$/, ""));
const hits = (files, re, allow = () => false) => files.flatMap((f) => code(f).flatMap((l, i) => (re.test(l) && !allow(rel(f), l) ? [`${rel(f)}:${i + 1}: ${l.trim().slice(0, 100)}`] : [])));

test("economy lint · the lint sees the engines (not vacuous)", () => {
  assert.ok(ENGINES.some((f) => f.includes("/core3d/stage3d.ts")), "core3d stage");
  assert.ok(ENGINES.some((f) => f.includes("/antariksh/index.ts")), "antariksh engine");
  assert.ok(LAWS.some((f) => f.endsWith("nishana/line.logic.ts")));
});

test("economy lint 1 · no persisted counters: web storage only in core3d/host.ts and only for the music preference (G5)", () => {
  const bad = hits(ENGINES, /\b(localStorage|sessionStorage|indexedDB|document\.cookie|caches\.open)\b/, (f, l) => f === "src/play/engines/core3d/host.ts" && /MUSIC_KEY/.test(l));
  assert.deepEqual(bad, []);
  assert.match(readFileSync(join(ROOT, "src/play/engines/core3d/host.ts"), "utf8"), /MUSIC_KEY = "taxila\.play\.music"/);
});

test("economy lint 2 · no wall clock in progress code (only the stage's frame timing and perf read-out may read it)", () => {
  const bad = hits([...ENGINES, ...LAWS], /\b(Date\.now|new Date\b|performance\.now)/, (f) => f === "src/play/engines/core3d/stage3d.ts");
  assert.deepEqual(bad, []);
});

test("economy lint 3 · no timer that can end or penalise a level: no setTimeout / setInterval in engines but the audio sequencer", () => {
  const bad = hits([...ENGINES, ...LAWS], /\b(setTimeout|setInterval|requestIdleCallback)\b/, (f) => f === "src/play/engines/core3d/audio.ts");
  assert.deepEqual(bad, []);
  // the audio timer only schedules notes: it never touches an act or the progress store
  const audio = readFileSync(join(ROOT, "src/play/engines/core3d/audio.ts"), "utf8");
  assert.doesNotMatch(audio, /dispatch|progress|\.ctl\b/);
  // "brisk" pace exists in an engine only behind the ledger's `secure` (dressFor also downgrades it; tested below)
  for (const f of ENGINES.filter((x) => x.includes("/antariksh/"))) for (const l of code(f)) if (/"brisk"/.test(l)) assert.match(l, /secure/, `${rel(f)}: brisk without secure: ${l.trim()}`);
  const d = dressFor({ engine: "antariksh", base: { theme: "laal-grah", wrapper: "mine-sweep", music: "calm", pace: "brisk", teacherMove: "notice", lang: "en" }, delta: { pace: "brisk" }, classLevel: 7, secure: false, childMusicOn: false, lessonLang: "en", verb: "fire" });
  assert.equal(d.dress.pace, "steady");
});

test("economy lint 4 · no RNG after generation: no Math.random / crypto randomness in engines or laws", () => {
  const bad = hits([...ENGINES, ...LAWS], /\bMath\.random\b|getRandomValues|randomUUID/);
  assert.deepEqual(bad, []);
});

test("economy lint 5 · the progress store refuses an untraced write and keeps the trace", () => {
  const p = new Progress();
  assert.throws(() => p.set("cur", 1, undefined));
  p.set("cur", 0, { level: "start" }); p.set("cur", 1, { act: 3 }); p.set("cleared0", true, { moment: "solved", seq: 4 });
  assert.deepEqual(p.trace().map((t) => t.cause), ["level:start", "act:3", "moment:solved@4"]);
  // every progress write in the engines names a cause literal
  for (const f of ENGINES) for (const [i, l] of code(f).entries()) if (/progress\.set\(/.test(l)) assert.match(l, /\{\s*(act|moment|level)\s*:/, `${rel(f)}:${i + 1} untraced progress write`);
});

test("economy lint 6 · no economy words in engine copy or engine string literals", () => {
  const WORDS = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  const bad = [];
  for (const [k, line] of Object.entries(COPY)) if (k.startsWith("ant.") || k.startsWith("music.")) for (const v of Object.values(line)) if (WORDS.test(v)) bad.push(`${k}: ${v}`);
  for (const f of ENGINES) for (const [i, l] of code(f).entries()) for (const m of l.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) if (m[2].length >= 3 && WORDS.test(m[2])) bad.push(`${rel(f)}:${i + 1}: ${m[2]}`);
  assert.deepEqual(bad, []);
});

// runtime: the laws Antariksh renders are clock-free, RNG-free and time-blind (t is never an input)
test("economy lint runtime · Nishana levels grade the same with the clock and Math.random booby-trapped and t scrambled", () => {
  const cov = JSON.parse(readFileSync(join(ROOT, "data/play/coverage.json"), "utf8"));
  let checked = 0;
  for (const e of cov.entries.filter((x) => x.family === "nishana")) {
    const logic = LOGIC[`${e.family}/${e.mode}`];
    for (const seed of [1, 7, 42]) {
      const r = pickLevels(logic, { family: e.family, mode: e.mode, topicId: e.topicId, skillId: e.skillId, classLevel: e.classLevel, fade: 1, goal: e.goal, mis: {}, misMap: e.misMap, grammar: e.grammar, recent: [], seed });
      assert.ok(r, `${e.topicId} ${e.goal} seed ${seed}: a level`);
      const level = r.garam;
      const runs = [logic.solve(level), ...logic.malRules.map((m) => logic.malActs(level, m)).filter(Boolean), [{ kind: "commit" }, { kind: "place", which: 9, x: 1 }, { kind: "round", to: -1 }, { kind: "order", first: 7 }]];
      for (const acts of runs) {
        const base = logic.grade(level, env(acts));
        const scrambled = env(acts).map((a, i) => ({ ...a, t: (i * 7919) % 100000 }));
        const [rnd, now, pnow] = [Math.random, Date.now, performance.now];
        Math.random = () => { throw new Error("Math.random in a law"); }; Date.now = () => { throw new Error("Date.now in a law"); }; performance.now = () => { throw new Error("performance.now in a law"); };
        let g2, rep;
        try { g2 = logic.grade(level, scrambled); rep = replayAll(logic, level, scrambled); } finally { Math.random = rnd; Date.now = now; performance.now = pnow; }
        assert.deepEqual({ ...g2, moments: g2.moments.length }, { ...base, moments: base.moments.length }, `${level.levelId}: grade depends on t or the clock`);
        assert.equal(rep.moments.length, base.moments.length);
        checked++;
      }
    }
  }
  assert.ok(checked >= 100, `checked ${checked}`);
});
