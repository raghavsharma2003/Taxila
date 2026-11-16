// dc-r8-game-gate-play-then-evidence (main's night rulings, 2026-11-11): a mode shown on gate 1 (play) alone runs with
// naming OFF. It records right or wrong, first try and the checks, and names no mix-up to the learner model or the
// teacher. One flag (shared/play.ts NAMING_OFF), applied once where the act route grades (server/play/grade.js
// withNaming). Played here on every served level of each naming-off mode, through every mal-rule's acts and the solver's:
// nothing that leaves the server names a mix-up, and right/wrong, first try and checks survive. A naming-on mode is
// returned unchanged. Pure (no DB).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NAMING_OFF, NAMING_FACT_KEYS, namingOn, GAME_WEIGHT } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";
import { gradeActs, lessonEvidence, withNaming } from "../server/play/grade.js";

const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const sessionOf = (e, child, fade) => ({ childId: child, key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf(child, entryKey(e), 0), door: "garam", recent: [], hist: null });
const NAMES = ["misconceptionId", "chanceMis", "discriminates"];

test("naming off: exactly the three gate-1 modes, and every other mode names as before", () => {
  assert.deepEqual([...NAMING_OFF].sort(), ["kon/name", "kon/place", "stambh/tally"]);
  for (const k of Object.keys(LOGIC)) { const [f, m] = k.split("/"); assert.equal(namingOn(f, m), !NAMING_OFF.has(k), k); }
});

for (const key of NAMING_OFF) {
  test(`naming off ${key}: no mix-up leaves the server on any served level (rows, trail, facts); right/wrong, first try and checks stay`, () => {
    const [fam, mode] = key.split("/");
    let levels = 0, malPlays = 0, namedBefore = 0;
    for (const e of coverage().entries.filter((x) => x.family === fam && x.mode === mode)) for (const fade of [1, 2, 3]) for (const child of ["c1", "c2"]) {
      const level = currentLevel(sessionOf(e, child, fade), e), logic = LOGIC[key];
      if (!level) continue;
      levels++;
      const sol = logic.solve(level) ?? [];
      const plays = [["solve", sol], ...logic.malRules.map((m) => [m, logic.malActs(level, m)]).filter(([, a]) => a?.length).map(([m, a]) => [m, [...a, ...sol]]),
        ...logic.malRules.map((m) => [`${m}-only`, logic.malActs(level, m)]).filter(([, a]) => a?.length),
        // (kon/name say, H3 and dc-r8-gate2-shadow S3: a sighting is her name confirmed by a name built after the miss; the
        // same name pressed again no longer confirms it)
        ...(key === "kon/name" && level.params?.goal === "say" ? logic.malRules.map((m) => [`${m}-confirmed`, logic.malActs(level, m)]).filter(([, a]) => a?.length).map(([m, a]) => [m, [...a, { kind: "clear" }, ...a, { kind: "clear" }, ...sol]]) : [])];
      for (const [name, acts] of plays) {
        const raw = gradeActs(level, env(acts), { final: true });
        if (!raw?.grade) continue;
        if (name !== "solve") malPlays++;
        if (raw.grade.evidence.some((r) => r.misconceptionId || r.chanceMis) || raw.trail?.mal?.length) namedBefore++;
        const g = withNaming(level, raw);
        const where = `${level.levelId} ${name}`;
        for (const r of [...g.grade.evidence, ...lessonEvidence(g.grade, level)]) for (const n of NAMES) assert.equal(r[n], undefined, `${where}: ${n} on a row`);
        assert.deepEqual(g.trail?.mal ?? [], [], `${where}: a mal-rule in the trail`);
        for (const f of [g.facts, g.grade.facts]) for (const k of NAMING_FACT_KEYS) assert.equal(f?.[k], undefined, `${where}: facts.${k}`);
        for (const k of NAMING_FACT_KEYS) assert.doesNotMatch(g.factsRow ?? "", new RegExp(`(^| )${k}=`), `${where}: ${k} in the facts row`);
        // what stays: the verdict and outcome, first try (clean), the checks
        assert.equal(g.grade.verdict, raw.grade.verdict, where);
        assert.equal(g.grade.clean, raw.grade.clean, where);
        assert.deepEqual(g.grade.evidence.map((r) => r.outcome), raw.grade.evidence.map((r) => r.outcome), where);
        assert.equal(g.trail?.firstTry, raw.trail?.firstTry, where);
        assert.equal(g.facts?.checks, raw.facts?.checks, where);
        // a miss that named a mix-up weighs as any miss
        g.grade.evidence.forEach((r, i) => { const o = raw.grade.evidence[i]; if ((o.misconceptionId || o.chanceMis) && o.outcome !== "correct") assert.equal(r.weight, GAME_WEIGHT, where); });
      }
    }
    assert.ok(levels >= 6, `${key}: ${levels} levels`);
    assert.ok(malPlays > 0 && namedBefore > 0, `${key}: the check saw mix-ups to strip (${malPlays} plays, ${namedBefore} named before the flag)`);
  });
}

test("naming on: a mode outside the set is returned as graded", () => {
  let n = 0;
  for (const e of coverage().entries.filter((x) => !NAMING_OFF.has(`${x.family}/${x.mode}`)).slice(0, 40)) {
    const level = currentLevel(sessionOf(e, "c1", 1), e), logic = LOGIC[`${e.family}/${e.mode}`];
    if (!level || !logic?.malRules?.length) continue;
    const a = logic.malActs(level, logic.malRules[0]);
    if (!a?.length) continue;
    const raw = gradeActs(level, env(a), { final: true });
    if (!raw) continue;
    assert.equal(withNaming(level, raw), raw, level.levelId);
    n++;
  }
  assert.ok(n >= 5, `${n} naming-on levels`);
});

test("naming off is applied where the act route grades, and the misconception seam checks it", () => {
  const src = readFileSync(new URL("../server/play/routes.js", import.meta.url), "utf8");
  // (dc-r8-gate2-shadow S1: the unstripped grade is kept as `raw` for the shadow run, server/play/shadow.js; what leaves is g)
  assert.match(src, /const raw = gradeActs\(level, b\.acts \?\? \[\], \{ final: !!b\.final \}\);\n\s*const g = withNaming\(level, raw\);/);
  assert.match(src, /if \(mis && !namingOn\(level\.family, level\.mode\)\) return null;/);
});
