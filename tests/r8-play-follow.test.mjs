// Round 8 Play follow-ups B-D, F (main, 2026-11-10): a family switch mid-session (once, only when the focus changes to a
// mix-up another game tells apart better by the margin); a deliberate Director fade beats the history fade; a non-clean level
// after a lift steps the band back down; /start reads what she just played from her previous session token. Pure functions
// + the real families and coverage; the routes with their test seams. No DB, no network, no model.
import test from "node:test";
import assert from "node:assert/strict";
import { adaptAfter, fadeFor, fadeFromHistory, liftedPL, settleBecause, LIFT_STEP } from "../server/play/choose.js";
import { afterLevelBody, beliefOf, currentLevel, entriesFor, entryByKey, entryFor, entryKey, nextBody, seedOf, switchAfter } from "../server/play/levels.js";
import { startSession, recentFromPrev } from "../server/play/start.js";
import { gradeActs } from "../server/play/grade.js";
import { signSession, verifySession } from "../server/play/session.js";
import { signEvidence } from "../server/play/evidence.js";
import { routes, playDeps } from "../server/play/routes.js";
import { LOGIC } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";

const logit = (p) => Math.log(p / (1 - p));
const SKILL = "c6-maths-ch05-t01-s3", MIS = "c6-maths-ch05-t01-m-factor-multiple", PRODUCT = "c6-maths-ch05-t01-m-common-product";
const qOf = (rows) => async (sql) => (/from kt_misconception/.test(sql) ? rows.mis ?? [] : /from kt_skill_state/.test(sql) ? rows.sk ?? [] : /from kt_evidence/.test(sql) ? rows.ev ?? [] : []);
const fakeRes = () => { const r = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { r.headers[k] = v; }, end(x) { r.body = x ? JSON.parse(x) : null; } }; return r; };
const CHILD = "00000000-0000-4000-8000-000000000008";

// ───────────── D: step down ─────────────

test("D pure: a non-clean level after a lift steps the band back down one step (never below the unlifted band), with a because", () => {
  const level = { levelId: "L1" };
  const near = { verdict: "solved", clean: false, evidence: [{ outcome: "partial" }] };
  const lost = { verdict: "not_yet", clean: false, evidence: [{ outcome: "incorrect" }] };
  const d1 = adaptAfter({ grade: near, level, s: { pL: 0.6, lift: 2 } });
  assert.equal(d1.lift, 1); assert.equal(d1.because.kind, "play.step_down"); assert.equal(d1.because.source, "play_grade"); assert.equal(d1.because.choice, "next level a step easier");
  assert.match(d1.because.fact, /P\(skill\) 0\.80 back to 0\.70/);
  const d0 = adaptAfter({ grade: lost, level, s: { pL: 0.6, lift: 1 } });
  assert.equal(d0.lift, 0); assert.match(d0.because.fact, /not solved/);
  assert.equal(adaptAfter({ grade: lost, level, s: { pL: 0.6, lift: 0 } }), null, "never below the unlifted band");
  assert.equal(adaptAfter({ grade: near, level, s: { pL: 0.6 } }), null);
  // a mal-rule miss after a lift: that belief next, one step easier
  const mal = adaptAfter({ grade: { verdict: "not_yet", clean: false, evidence: [{ outcome: "incorrect", misconceptionId: "m-x" }] }, level, s: { pL: 0.6, lift: 1 }, beliefOf: () => "Thinks X" });
  assert.equal(mal.focus, "m-x"); assert.equal(mal.lift, 0); assert.equal(mal.because.choice, "next level tests that mix-up, a step easier"); assert.equal(mal.because.kind, "play.mixup_focus");
  // symmetric: up then down returns to her own band
  const up = adaptAfter({ grade: { verdict: "solved", clean: true, evidence: [{ outcome: "correct" }] }, level, s: { pL: 0.6 } });
  assert.equal(up.lift, 1); assert.equal(up.because.kind, "play.step_up");
  assert.equal(liftedPL({ pL: 0.6, lift: adaptAfter({ grade: near, level, s: { pL: 0.6, lift: up.lift } }).lift }), 0.6);
});

test("D: a step down to lift 0 is the unlifted band in the next body (the old lift is not kept)", () => {
  const e = entryFor({ skillId: "c5-maths-ch02-t01-s2" });
  const s = { childId: "c1", key: entryKey(e), skillId: "c5-maths-ch02-t01-s2", lessonId: null, classLevel: 5, fade: 1, lang: "hinglish", mis: {}, pL: 0.6, secure: false, n: 1, seed: seedOf("c1", entryKey(e), 1), door: "garam", recent: [], hist: null, lift: 1 };
  const level = currentLevel(s, e);
  const after = afterLevelBody(s, { grade: { verdict: "not_yet", clean: false, evidence: [{ outcome: "incorrect" }] }, level });
  assert.equal(after.nextLift, 0);
  const next = nextBody(after, e, "garam");
  assert.ok(!("lift" in next)); assert.equal(liftedPL(next), 0.6);
  assert.equal(next.because[0].kind, "play.step_down");
});

// ───────────── C: a deliberate Director fade ─────────────

test("C pure: a deliberate Director fade beats the history fade, and the because says so", () => {
  const hist = { pL: 0.5, display: "mastered", n: 6 };
  assert.equal(fadeFromHistory(hist, 2).fade, 3);
  assert.deepEqual(fadeFor(hist, 2, "director"), { fade: 2, because: { choice: "fade 2", fact: "the lesson asked for fade 2", source: "director", kind: "play.fade_director" } });
  assert.deepEqual(fadeFor(hist, 3, "director"), { fade: 3, because: null }, "no because when her history says the same");
  assert.deepEqual(fadeFor(hist, 2, null), fadeFromHistory(hist, 2), "an unmarked fade is only the fallback");
  assert.deepEqual(fadeFor(null, 2, "director"), { fade: 2, because: null });
});

test("C: startSession and /start — fadeFrom director wins inside a lesson; from the home it is a device claim and is ignored", async () => {
  const sk = [{ p_l: 0.9, display: "mastered", n: 9, run: 4, recent: [1, 1, 1] }];
  const r = await startSession({ id: "c1", class_level: 6 }, { skillId: SKILL, fade: 1, fadeFrom: "director", lessonId: "les" }, qOf({ sk }));
  assert.equal(r.session.fade, 1);
  assert.deepEqual(r.because.find((b) => b.source === "director"), { choice: "fade 1", fact: "the lesson asked for fade 1", source: "director", kind: "play.fade_director" });
  const h = await startSession({ id: "c1", class_level: 6 }, { skillId: SKILL, fade: 1 }, qOf({ sk }));
  assert.equal(h.session.fade, 3);
  const saved = { ...playDeps };
  try {
    playDeps.requireChild = async (_req, id) => ({ guardian: { id: "g" }, child: { id, class_level: 6, first_name: "Riya", language_pref: "hinglish" } });
    playDeps.q = qOf({ sk });
    const LES = "11111111-1111-4111-8111-111111111111";
    const a = fakeRes(); await routes["POST /api/play/start"]({}, a, { childId: CHILD, skillId: SKILL, fade: 2, fadeFrom: "director", lessonId: LES });
    assert.equal(a.body.level.fade, 2); assert.ok(a.body.because.some((b) => b.source === "director"));
    const b = fakeRes(); await routes["POST /api/play/start"]({}, b, { childId: CHILD, skillId: SKILL, fade: 2, fadeFrom: "director" });
    assert.equal(b.body.level.fade, 3); assert.ok(!(b.body.because ?? []).some((x) => x.source === "director"));
  } finally { Object.assign(playDeps, saved); }
});

// ───────────── B: family switch mid-session ─────────────

/** a kila session (the factor/multiple mix-up open), the level, and the acts that commit the "product" mal-rule */
async function kilaCase() {
  const r = await startSession({ id: "c1", class_level: 6 }, { skillId: SKILL }, qOf({ mis: [{ misconception_id: MIS, logit: logit(0.62) }] }));
  assert.equal(r.entry.family, "kila");
  const logic = LOGIC[`${r.level.family}/${r.level.mode}`];
  const rule = Object.entries(r.level.mal).find(([, k]) => k === PRODUCT)?.[0];
  assert.ok(rule, "the kila level maps the common-product mix-up");
  const acts = logic.malActs(r.level, rule);
  assert.ok(acts, "and the mal-rule is committable");
  const g = gradeActs(r.level, env(acts), { final: true });
  assert.equal(g.grade.evidence[0].misconceptionId, PRODUCT);
  return { ...r, g };
}

test("B: the focus changes to a mix-up atoms tells apart and kila does not → the next level switches to todo-jodo/atoms, with a because", async () => {
  const { session: s, level, g, entry } = await kilaCase();
  const s2 = afterLevelBody(s, { grade: g.grade, level });
  assert.equal(s2.nextKey, entryKey(entriesFor({ skillId: SKILL })[0]));
  assert.deepEqual(s2.nextSwitch, { choice: "switch to todo-jodo/atoms", fact: beliefOf(PRODUCT), source: "play_grade", kind: "play.switch", when: "now", mis: PRODUCT });
  const next = nextBody(s2, entry, "garam");
  const to = entryByKey(next.key);
  assert.equal(to.family, "todo-jodo");
  const lv = currentLevel(next, to);
  assert.equal(lv.family, "todo-jodo"); assert.ok(lv.proof.discriminates.includes(PRODUCT));
  assert.deepEqual(next.switched, { from: s.key, n: 1 });
  assert.equal(next.because[0].kind, "play.switch"); assert.equal(next.because[0].choice, "switch to todo-jodo/atoms");
  assert.ok(!("nextKey" in next) && !("nextSwitch" in next));
  // the switched body regenerates the same level from its token
  assert.equal(currentLevel(verifySession(signSession(next)), to).levelId, lv.levelId);
  // at most once a session: a later focus change never switches again
  assert.equal(switchAfter(next, to, MIS), null);
  // and never when the focus does not change, or the current game already tells it apart
  assert.equal(switchAfter({ ...s, focus: PRODUCT }, entry, PRODUCT), null);
  assert.equal(switchAfter(s, entry, MIS), null);
});

test("B routes: /act's doors show the new family; /next returns it with its world and the switch; /level and /act follow the new key", async () => {
  const saved = { ...playDeps };
  try {
    playDeps.requireChild = async (_req, id) => ({ guardian: { id: "g" }, child: { id, class_level: 6, first_name: "Riya", language_pref: "hinglish" } });
    playDeps.q = qOf({ mis: [{ misconception_id: MIS, logit: logit(0.62) }] });
    playDeps.writeHome = async () => ({ written: false });
    // a child whose first kila level lets the "product" mal-rule be committed, and whose next kila level would not tell it
    // apart (the levels are seeded by the child id; for some children kila's next level does, and then nothing switches)
    let a = null;
    for (let i = 0; i < 40 && !a; i++) {
      const st = fakeRes(); await routes["POST /api/play/start"]({}, st, { childId: `00000000-0000-4000-8000-${String(100 + i).padStart(12, "0")}`, skillId: SKILL });
      const lv = st.body.level;
      assert.equal(lv.family, "kila");
      const rule = Object.entries(lv.mal).find(([, k]) => k === PRODUCT)?.[0];
      const acts = rule ? LOGIC[`${lv.family}/${lv.mode}`].malActs(lv, rule) : null;
      if (!acts) continue;
      const r = fakeRes(); await routes["POST /api/play/act"]({}, r, { sessionId: st.body.sessionId, levelId: lv.levelId, acts: env(acts), final: true });
      assert.equal(r.statusCode, 200);
      if (r.body.doors[0].level.family === "kila") { assert.ok(r.body.doors[0].level.proof.discriminates.includes(PRODUCT), "no switch only when kila tells it apart"); continue; }
      a = r;
    }
    assert.ok(a, "a session that switches");
    assert.equal(a.body.doors[0].level.family, "todo-jodo");
    assert.equal(a.body.doors[0].because[0].kind, "play.switch");
    const n = fakeRes(); await routes["POST /api/play/next"]({}, n, { sessionId: a.body.sessionId, door: "garam" });
    assert.equal(n.statusCode, 200);
    assert.equal(n.body.level.family, "todo-jodo"); assert.equal(n.body.level.levelId, a.body.doors[0].level.levelId);
    assert.deepEqual(n.body.switched, { from: "kila/lcm", to: "todo-jodo/atoms" });
    assert.ok("world" in n.body); assert.equal(n.body.world?.family ?? "todo-jodo", "todo-jodo");
    assert.ok(n.body.art?.art);
    const l = fakeRes(); await routes["POST /api/play/level"]({}, l, { sessionId: n.body.sessionId });
    assert.equal(l.body.level.levelId, n.body.level.levelId);
    const solve = LOGIC[`${n.body.level.family}/${n.body.level.mode}`].solve(n.body.level);
    const a2 = fakeRes(); await routes["POST /api/play/act"]({}, a2, { sessionId: n.body.sessionId, levelId: n.body.level.levelId, acts: env(solve), final: true });
    assert.equal(a2.statusCode, 200); assert.equal(a2.body.grade.verdict, "solved");
    const n2 = fakeRes(); await routes["POST /api/play/next"]({}, n2, { sessionId: a2.body.sessionId, door: "garam" });
    assert.equal(n2.body.level.family, "todo-jodo"); assert.ok(!("switched" in n2.body), "the switch is used once");
  } finally { Object.assign(playDeps, saved); }
});

// ───────────── F (server half): what she just played, from her previous session token ─────────────

test("F: /start reads her previous session token (verified, hers) as the picker's novelty input; anything else is ignored", async () => {
  const r = await startSession({ id: "c1", class_level: 6 }, { skillId: SKILL }, qOf({}));
  const rec = recentFromPrev(r.sessionId, "c1");
  assert.deepEqual(rec.families, [`${r.entry.family}/${r.entry.mode}`]); assert.deepEqual(rec.keys, [entryKey(r.entry)]);
  assert.ok(rec.sigs.includes(r.level.sig ?? r.level.levelId)); assert.equal(rec.source, "play_session");
  assert.equal(recentFromPrev(r.sessionId, "c2"), null, "another child's token");
  assert.equal(recentFromPrev("x.y", "c1"), null);
  assert.equal(recentFromPrev(signEvidence({ childId: "c1", lessonId: "l", levelId: "x", rows: [] }), "c1"), null, "an evidence token is not a session");
  // with her pL known and the first game just played, novelty can move her to the other one, and the because says why
  const sk = [{ p_l: 0.6, display: "practising", n: 3, run: 0, recent: [0, 1, 1] }];
  const again = await startSession({ id: "c1", class_level: 6 }, { skillId: SKILL, recent: rec }, qOf({ sk }));
  const nov = again.because.find((b) => b.kind === "play.pick_novelty");
  if (nov) { assert.equal(nov.source, "play_session"); assert.notEqual(again.entry.family, r.entry.family); }
});

test("because records keep their kind through settle; a mix-up claim still needs a level that tells it apart (a switch does not)", () => {
  const p = { choice: "c", fact: "f", source: "play_grade", kind: "play.mixup_focus", when: "now", mis: "m" };
  assert.equal(settleBecause(p, { proof: { discriminates: [] } }), null);
  assert.deepEqual(settleBecause(p, { proof: { discriminates: ["m"] } }), p);
  assert.deepEqual(settleBecause({ ...p, kind: "play.switch" }, { proof: { discriminates: [] } }), { ...p, kind: "play.switch" });
  assert.equal(LIFT_STEP, 0.1);
});
