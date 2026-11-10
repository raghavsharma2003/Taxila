// Round 8 Play P2: adapt between levels (never inside one). A miss that matched a mal-rule makes the next level test that
// belief at the same band; a clean first-try win steps the band up from HER pL; the fade comes from her ledger row for the
// skill (the request's fade is only the fallback). Each step carries a because { choice, fact, source } on the signed
// session, returned with the next level (/next, the doors, /level). Pure functions + the real families; no DB.
import test from "node:test";
import assert from "node:assert/strict";
import { adaptAfter, fadeFromHistory, liftedPL, settleBecause, LIFT_STEP, MAX_LIFT } from "../server/play/choose.js";
import { entryFor, entryKey, currentLevel, nextBody, afterLevelBody, genRequest, seedOf, beliefOf } from "../server/play/levels.js";
import { startSession } from "../server/play/start.js";
import { gradeActs } from "../server/play/grade.js";
import { signSession, verifySession } from "../server/play/session.js";
import { routes, playDeps } from "../server/play/routes.js";
import { LOGIC } from "../src/play/families/index.ts";
import { env, DEFAULT_PL } from "../src/play/core/pick.ts";

const SKILL = "c5-maths-ch02-t01-s2";
const entry = entryFor({ skillId: SKILL });
const logic = LOGIC[`${entry.family}/${entry.mode}`];
const sess = (over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: SKILL, lessonId: null, classLevel: 5, fade: 1, lang: "hinglish", mis: {}, pL: 0.6, secure: false, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

/** a session whose level shows a mapped mal-rule, and the acts that commit it */
function malCase() {
  for (let k = 0; k < 40; k++) {
    const s = sess({ seed: seedOf("c1", entryKey(entry), k) });
    const level = currentLevel(s, entry);
    for (const mal of Object.keys(level.mal ?? {})) {
      const acts = logic.malActs(level, mal);
      if (!acts) continue;
      const g = gradeActs(level, env(acts), { final: true });
      if (g?.grade?.evidence?.[0]?.misconceptionId) return { s, level, g, kit: g.grade.evidence[0].misconceptionId };
    }
  }
  return null;
}

test("P2 pure: adaptAfter — mal-rule miss → focus, same band; clean first try → one step up; else nothing", () => {
  const level = { levelId: "L1" };
  const miss = adaptAfter({ grade: { verdict: "not_yet", clean: false, evidence: [{ outcome: "incorrect", misconceptionId: "m-x" }] }, level, s: { pL: 0.6 }, beliefOf: () => "Thinks X" });
  assert.equal(miss.focus, "m-x"); assert.equal(miss.lift, undefined);
  assert.deepEqual(miss.because, { choice: "next level tests that mix-up, same difficulty", fact: "missed just now with: Thinks X", source: "play_grade", mis: "m-x" });
  const win = adaptAfter({ grade: { verdict: "solved", clean: true, evidence: [{ outcome: "correct" }] }, level, s: { pL: 0.6 } });
  assert.equal(win.lift, 1); assert.equal(win.because.source, "play_grade"); assert.match(win.because.fact, /P\(skill\) 0\.60 to 0\.70/);
  assert.equal(adaptAfter({ grade: { verdict: "solved", clean: true, evidence: [{ outcome: "correct" }] }, level, s: { pL: 0.6, lift: MAX_LIFT } }), null);
  assert.equal(adaptAfter({ grade: { verdict: "solved", clean: true, evidence: [{ outcome: "partial" }] }, level, s: {} }), null, "a win after a near miss is not a first-try win");
  assert.equal(adaptAfter({ grade: { verdict: "solved", clean: false, evidence: [{ outcome: "correct" }] }, level, s: {} }), null);
  assert.equal(adaptAfter({ grade: { verdict: "ungraded", evidence: [] }, level, s: {} }), null);
  // the lift starts from HER pL, else the class default
  assert.equal(liftedPL({ pL: 0.6, lift: 1 }), 0.7); assert.equal(liftedPL({ lift: 1 }), +(DEFAULT_PL + LIFT_STEP).toFixed(3));
  assert.equal(liftedPL({ pL: 0.6 }), 0.6); assert.equal(liftedPL({}), undefined);
  // a mix-up claim stays only when the level served tells it apart
  assert.equal(settleBecause(miss.because, { proof: { discriminates: [] } }), null);
  assert.deepEqual(settleBecause(miss.because, { proof: { discriminates: ["m-x"] } }), { choice: miss.because.choice, fact: miss.because.fact, source: "play_grade" });
});

test("P2 pure: fades from her ledger row; the request's fade only when there is no history", () => {
  assert.deepEqual(fadeFromHistory(null, 2), { fade: 2, because: null });
  assert.deepEqual(fadeFromHistory({ pL: 0.9, n: 0 }, 1), { fade: 1, because: null });
  assert.equal(fadeFromHistory({ pL: 0.5, display: "mastered", n: 6 }, 1).fade, 3);
  assert.equal(fadeFromHistory({ pL: 0.5, run: 3, n: 6 }, 1).fade, 3);
  assert.equal(fadeFromHistory({ pL: 0.72, run: 0, n: 4, recent: [1, 1] }, 1).fade, 2);
  assert.equal(fadeFromHistory({ pL: 0.5, run: 1, n: 4, recent: [0, 1] }, 1).fade, 2);
  const back = fadeFromHistory({ pL: 0.8, run: 0, n: 4, recent: [1, 0] }, 3);
  assert.equal(back.fade, 1); assert.deepEqual(back.because, { choice: "fade 1 (more help)", fact: "her last answer on this skill was a miss", source: "kt_skill_state" });
  assert.equal(fadeFromHistory({ pL: 0.4, run: 0, n: 2, recent: [0] }, 1).because, null, "same as the fallback = no because");
});

test("P2: a mal-rule miss → the next level tests that belief at the same band, with a because; reproducible from the token", () => {
  const c = malCase();
  assert.ok(c, "a level with a committable mal-rule");
  const s2 = afterLevelBody(c.s, { grade: c.g.grade, level: c.level, history: null });
  assert.equal(currentLevel(s2, entry).levelId, c.level.levelId, "nothing inside the level changes");
  const next = nextBody(s2, entry, "garam");
  const lv = currentLevel(next, entry);
  assert.equal(next.focus, c.kit);
  assert.equal(genRequest(next, entry).pL, genRequest(c.s, entry).pL, "same band");
  assert.ok(lv.proof.discriminates.includes(c.kit), `the next level tells ${c.kit} apart (${lv.proof.discriminates})`);
  assert.deepEqual(next.because, [{ choice: "next level tests that mix-up, same difficulty", fact: `missed just now with: ${beliefOf(c.kit)}`, source: "play_grade" }]);
  // no claim survives on a level that cannot show the belief (settleBecause)
  const blind = nextBody({ ...s2, nextBecause: { ...s2.nextBecause, mis: "not-a-real-belief" } }, entry, "garam");
  assert.ok(!("because" in blind));
  const back = verifySession(signSession(next));
  assert.equal(currentLevel(back, entry).levelId, lv.levelId);
  assert.deepEqual(back.because, next.because);
  // the level after that one carries no stale because
  assert.ok(!("because" in nextBody(next, entry, "garam")));
});

test("P2: a clean first-try win → the next level is asked for one band step above her pL", () => {
  const s = sess();
  const level = currentLevel(s, entry);
  const g = gradeActs(level, env(logic.solve(level)), { final: true });
  assert.equal(g.grade.verdict, "solved"); assert.ok(g.grade.clean);
  const s2 = afterLevelBody(s, { grade: g.grade, level, history: null });
  assert.equal(currentLevel(s2, entry).levelId, level.levelId, "the current level is regenerated unchanged");
  const next = nextBody(s2, entry, "garam");
  assert.equal(next.lift, 1);
  assert.equal(genRequest(next, entry).pL, 0.7);
  assert.equal(next.because[0].choice, "next level a step harder"); assert.equal(next.because[0].source, "play_grade");
  // the step persists (the band stays raised) but the because explains only the level right after the win
  const after = nextBody(next, entry, "garam");
  assert.equal(after.lift, 1); assert.ok(!("because" in after));
});

test("P2: startSession takes the fade from her ledger row (kt_skill_state) and says why", async () => {
  const q = (row) => async (sql) => (/from kt_skill_state/.test(sql) ? [row] : []);
  const r = await startSession({ id: "c1", class_level: 5 }, { skillId: SKILL, fade: 1 }, q({ p_l: 0.9, display: "mastered", n: 8, run: 3, recent: [1, 1, 1] }));
  assert.equal(r.session.fade, 3); assert.equal(r.level.fade, 3);
  assert.deepEqual(r.because, [{ choice: "fade 3 (less help)", fact: "ledger: mastered", source: "kt_skill_state" }]);
  const none = await startSession({ id: "c1", class_level: 5 }, { skillId: SKILL, fade: 2 }, q(undefined));
  assert.equal(none.session.fade, 2); assert.deepEqual(none.because, []);
});

const fakeRes = () => { const r = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { r.headers[k] = v; }, end(x) { r.body = x ? JSON.parse(x) : null; } }; return r; };
const CHILD = "00000000-0000-4000-8000-000000000002";

test("P2 routes: /act after a clean first-try win → doors carry the step's because; /next returns it with the level", async () => {
  const saved = { ...playDeps };
  try {
    playDeps.requireChild = async (_req, id) => ({ guardian: { id: "g" }, child: { id, class_level: 5, first_name: "Riya", language_pref: "hinglish" } });
    playDeps.q = async (sql) => (/from kt_skill_state/.test(sql) ? [{ p_l: 0.6, display: "practising", n: 0, run: 0, recent: [] }] : []);
    const st = fakeRes();
    await routes["POST /api/play/start"]({}, st, { childId: CHILD, skillId: SKILL });
    assert.equal(st.statusCode, 200); assert.ok(!("because" in st.body));
    const level = st.body.level;
    const a = fakeRes();
    await routes["POST /api/play/act"]({}, a, { sessionId: st.body.sessionId, levelId: level.levelId, acts: env(LOGIC[`${level.family}/${level.mode}`].solve(level)), final: true });
    assert.equal(a.statusCode, 200); assert.equal(a.body.grade.verdict, "solved");
    assert.equal(a.body.doors[0].because?.[0]?.choice, "next level a step harder");
    const n = fakeRes();
    await routes["POST /api/play/next"]({}, n, { sessionId: a.body.sessionId, door: "garam" });
    assert.equal(n.statusCode, 200);
    assert.equal(n.body.level.levelId, a.body.doors[0].level.levelId, "the door preview is the level served");
    assert.equal(n.body.because[0].choice, "next level a step harder");
    const l = fakeRes();
    await routes["POST /api/play/level"]({}, l, { sessionId: n.body.sessionId });
    assert.deepEqual(l.body.because, n.body.because);
  } finally { Object.assign(playDeps, saved); }
});
