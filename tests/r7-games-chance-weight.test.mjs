// Games audit GAMES-03: one-decision goals (galti-pakdo pakdo, hissa grid/shift, nazariya tri/more, kon zone/kind), where a
// lucky first tap lands the single pick 14 to 41 % of the time, grade a correct outcome at the chance-adjusted weight (the
// arena's: GAME_WEIGHT × the controllerEasy temper 0.5 = 0.25). One mechanism: FamilyLogic.oneDecision, read in gradeLevel
// where the evidence weight is set, and the server's signed row weight read in playKtEvents. A miss keeps GAME_WEIGHT; every
// other goal of the same families is untouched. Pure (no DB).
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { CHANCE_WEIGHT, GAME_WEIGHT } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { playKtEvents, signEvidence } from "../server/play/evidence.js";
import { temper } from "../server/learner/kt/bktr.js";

const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const ONE = { "galti-pakdo": ["pakdo"], hissa: ["shift"], nazariya: ["more"], kon: ["kind", "turn", "corr", "alt"] };
const FAMS = Object.keys(ONE);
const sessionOf = (e, child, fade) => ({ childId: child, key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf(child, entryKey(e), 0), door: "garam", recent: [], hist: null });
/** a wrong decision on a one-decision level: a mal-rule's acts when the level has one, else the family's own wrong pick */
function wrongActs(level, logic) {
  for (const m of logic.malRules) { const a = logic.malActs(level, m); if (a?.length) return a; }
  const p = level.params;
  if (level.goal === "pakdo") { const sol = logic.solve(level), at = sol.find((a) => a.kind === "flag")?.line ?? 0; return [{ kind: "flag", line: at === 1 ? 2 : 1 }]; }
  if (level.goal === "shift") return [...Array.from({ length: Math.abs(p.c) }, () => ({ kind: "slide", by: p.c > 0 ? -1 : 1 })), { kind: "run" }];
  if (level.goal === "kind") return [{ kind: "turn", deg: p.start }, { kind: "commit" }];
  // kon turn and cross (main 2026-11-10): the dial a quarter turn off the answer
  if (["turn", "corr", "alt"].includes(level.goal)) { const d = logic.solve(level).find((a) => a.kind === "turn")?.deg ?? 0; return [{ kind: "turn", deg: (d + 90) % 360 }, { kind: "commit" }]; }
  if (level.goal === "more") return [{ kind: "apex", x: p.tri.x0, z: p.tri.zb - 1 }, { kind: "check" }];
  return null;
}

test("chance weight: the constant is the arena's (GAME_WEIGHT × the controllerEasy temper), and exactly these goals are one-decision (kon turn and cross added 2026-11-10)", () => {
  assert.equal(CHANCE_WEIGHT, GAME_WEIGHT * 0.5);
  assert.equal(temper({ via: "game", controllerEasy: true }), CHANCE_WEIGHT, "the arena's own path");
  const marked = [...new Set(Object.values(LOGIC))].filter((l) => l.oneDecision?.length).map((l) => `${l.family}:${l.oneDecision.join(",")}`).sort();
  assert.deepEqual(marked, ["galti-pakdo:pakdo", "hissa:shift", "kon:kind,turn,corr,alt", "nazariya:more"]);
});

for (const fam of FAMS) {
  test(`chance weight ${fam}: a one-decision goal's correct enters at CHANCE_WEIGHT, its miss at GAME_WEIGHT; the family's other goals keep GAME_WEIGHT`, () => {
    let one = 0, other = 0, misses = 0;
    for (const e of coverage().entries.filter((x) => x.family === fam)) for (const fade of [1, 2, 3]) for (const child of ["c1", "c2"]) {
      const level = currentLevel(sessionOf(e, child, fade), e), logic = LOGIC[`${level.family}/${level.mode}`];
      const sol = logic.solve(level);
      if (!sol) continue;
      const g = gradeActs(level, env(sol), { final: true });
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct", level.levelId);
      if (ONE[fam].includes(level.goal)) {
        one++;
        assert.equal(rows[0].weight, CHANCE_WEIGHT, `${level.levelId} correct at the chance weight`);
        const w = wrongActs(level, logic);
        assert.ok(w, `${level.levelId}: a wrong pick`);
        const wg = gradeActs(level, env(w), { final: true });
        assert.notEqual(wg.grade.verdict, "solved", level.levelId);
        assert.ok(["incorrect", "partial"].includes(wg.grade.evidence[0]?.outcome), `${level.levelId} ${wg.grade.evidence[0]?.outcome}`);
        assert.equal(wg.grade.evidence[0].weight, GAME_WEIGHT, `${level.levelId}: a miss is not luck`);
        misses++;
        // a recovery after the miss still solves, and its evidence is the miss's, at the game weight
        const back = gradeActs(level, env([...w, ...sol]), { final: true });
        if (back.grade.verdict === "solved") assert.equal(back.grade.evidence[0].weight, GAME_WEIGHT);
      } else { other++; assert.equal(rows[0].weight, GAME_WEIGHT, `${level.levelId} keeps the game weight`); }
    }
    assert.ok(one >= 6 && misses === one, `${fam}: ${one} one-decision levels, ${misses} misses`);
    assert.ok(other >= 6, `${fam}: ${other} other levels`);
  });
}

test("chance weight into the learner model: a CHANCE_WEIGHT row folds as controllerEasy (temper 0.25), a GAME_WEIGHT row does not (0.5)", () => {
  const key = randomBytes(32), opts = { key }, now = Date.now();
  const row = (outcome, weight) => ({ skillId: "c7-maths-ch15-t03-s2", outcome, source: "game", itemId: "play:L", probe: "P10", hintsUsed: 0, weight });
  const fold = (levelId, r) => playKtEvents({ tokens: [signEvidence({ childId: "c1", lessonId: "les1", levelId, rows: [r] }, opts)], childId: "c1", lessonId: "les1", startedAt: now, now, childSeq: 1 }, opts).events[0];
  const lucky = fold("galti-x", row("correct", CHANCE_WEIGHT)), plain = fold("galti-y", row("correct", GAME_WEIGHT)), miss = fold("galti-z", row("incorrect", GAME_WEIGHT));
  assert.equal(lucky.controllerEasy, true); assert.equal(temper(lucky), CHANCE_WEIGHT);
  assert.ok(!plain.controllerEasy); assert.equal(temper(plain), GAME_WEIGHT);
  assert.ok(!miss.controllerEasy); assert.equal(temper(miss), GAME_WEIGHT);
  // the arena keeps its own path (every outcome, recognition form)
  const arena = fold("arena-1", row("incorrect", GAME_WEIGHT));
  assert.equal(arena.controllerEasy, true); assert.equal(arena.form, "recognise"); assert.equal(temper(arena), CHANCE_WEIGHT);
});
