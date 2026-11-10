// Round 8 Play P1: choose the game from what she holds. One pure picker (server/play/choose.js chooseEntry) over every
// coverage entry admitting the skill; the default (nothing known) is the first entry with NO because; an active belief
// serves the family whose garam level tells it apart, with a because naming the kit's belief; pL fit and novelty break
// near-ties; the because rides the signed session and the routes. No DB, no network, no model.
import test from "node:test";
import assert from "node:assert/strict";
import { chooseEntry, activeBelief, knowsAnything, MARGIN } from "../server/play/choose.js";
import { coverage, entriesFor, entryFor, entryKey, currentLevel, beliefOf } from "../server/play/levels.js";
import { startSession } from "../server/play/start.js";
import { signSession, verifySession } from "../server/play/session.js";
import { routes, playDeps } from "../server/play/routes.js";

const logit = (p) => Math.log(p / (1 - p));
const lv = (id, disc, p = 0.75, sig = id) => ({ levelId: id, sig, proof: { discriminates: disc, pFirstTry: p } });
const E = (family, mode, misMap = {}) => ({ topicId: "t1", family, mode, goal: mode, skillIds: ["s1"], skillId: "s1", misMap });
const kon = E("kon", "turn", { cw: "m-cw" }), arena = E("arena", "pick"), kila = E("kila", "lcm", { fm: "m-fm" });
const stubLevels = (table) => {
  const calls = [];
  const levelOf = (e, focus) => { calls.push([e.family, focus]); return table(e, focus); };
  return { levelOf, calls };
};

test("P1 pure: nothing known (no mis above prior, no focus, no pL) → the first entry, no because, no level generated", () => {
  const { levelOf, calls } = stubLevels(() => lv("x", []));
  for (const inputs of [{}, { mis: {} }, { mis: { "m-fm": 0.15 } }, { mis: { "m-other": 0.9 } }]) {
    const r = chooseEntry({ entries: [arena, kila, kon], inputs, levelOf });
    assert.equal(r.entry, arena); assert.equal(r.because, null); assert.equal(r.focus, null);
  }
  assert.equal(calls.length, 0);
  assert.equal(knowsAnything({ mis: { "m-fm": 0.15 } }, [kila]), false);
  assert.equal(chooseEntry({ entries: [], inputs: {}, levelOf }), null);
});

test("P1 pure: an active belief serves the family whose garam level discriminates it FIRST, with the kit's fact", () => {
  const { levelOf } = stubLevels((e, focus) => (e === kila && focus === "m-fm" ? lv("k1", ["m-fm"]) : e === kila ? lv("k0", []) : lv(`${e.family}0`, [])));
  const r = chooseEntry({ entries: [arena, kon, kila], inputs: { mis: { "m-fm": 0.62 } }, levelOf, beliefOf: (id) => (id === "m-fm" ? "Confuses factors with multiples" : id) });
  assert.equal(r.entry, kila); assert.equal(r.focus, "m-fm");
  assert.deepEqual(r.because, { choice: "kila/lcm first", fact: "open mix-up: Confuses factors with multiples, 0.62", source: "kt_misconception" });
  // the lesson's own focus (no posterior needed) names its table
  const f = chooseEntry({ entries: [arena, kila], inputs: { focus: "m-fm", focusSource: "reteach_attempts" }, levelOf, beliefOf: () => "Confuses factors with multiples" });
  assert.equal(f.entry, kila); assert.equal(f.because.source, "reteach_attempts"); assert.match(f.because.fact, /^seen in this lesson: Confuses/);
  // below 0.5 is not active: the first entry stays unless information alone carries it past the margin
  assert.equal(activeBelief({ mis: { "m-fm": 0.45 } }, [kila]), null);
  // a single entry: the belief still becomes the level's focus, and the because says so when the level changed
  const one = chooseEntry({ entries: [kila], inputs: { mis: { "m-fm": 0.7 } }, levelOf, beliefOf: () => "B" });
  assert.equal(one.entry, kila); assert.equal(one.focus, "m-fm"); assert.equal(one.because.fact, "open mix-up: B, 0.70");
});

test("P1 pure: the first entry wins when it already serves the belief (no because when the level is today's)", () => {
  const { levelOf } = stubLevels((e) => (e === kon ? lv("kon1", ["m-cw"]) : lv("a0", [])));
  const r = chooseEntry({ entries: [kon, arena], inputs: { focus: "m-cw" }, levelOf });
  assert.equal(r.entry, kon); assert.equal(r.because, null);
});

test("P1 pure: pL fit ranks families by how close their best level sits to the band; within the margin the first stays", () => {
  const a = E("aa", "x"), b = E("bb", "y");
  const far = stubLevels((e) => (e === a ? lv("a", [], 0.96) : lv("b", [], 0.77)));
  const r = chooseEntry({ entries: [a, b], inputs: { pL: 0.9 }, levelOf: far.levelOf });
  assert.equal(r.entry, b); assert.equal(r.because.source, "kt_skill_state"); assert.match(r.because.fact, /^P\(skill\) 0\.90: first try 0\.77 here vs 0\.96 in aa\/x/);
  const near = stubLevels((e) => (e === a ? lv("a", [], 0.75 + MARGIN / 2) : lv("b", [], 0.75)));
  const n = chooseEntry({ entries: [a, b], inputs: { pL: 0.9 }, levelOf: near.levelOf });
  assert.equal(n.entry, a); assert.equal(n.because, null);
});

test("P1 pure: novelty moves off the family she just played when an equally good one exists (never when nothing is known)", () => {
  const a = E("aa", "x"), b = E("bb", "y");
  const { levelOf } = stubLevels((e) => lv(e.family, [], 0.75));
  const r = chooseEntry({ entries: [a, b], inputs: { pL: 0.7 }, levelOf, recent: { families: ["aa/x"] } });
  assert.equal(r.entry, b); assert.deepEqual(r.because, { choice: "bb/y first", fact: "just played aa/x", source: "lesson_shown" });
  assert.equal(chooseEntry({ entries: [a, b], inputs: {}, levelOf, recent: { families: ["aa/x"] } }).entry, a);
  // a level signature she just played counts too
  const s = chooseEntry({ entries: [a, b], inputs: { pL: 0.7 }, levelOf, recent: { sigs: ["aa"] } });
  assert.equal(s.entry, b);
});

const SKILL = "c6-maths-ch05-t01-s3", MIS = "c6-maths-ch05-t01-m-factor-multiple";
const qOf = (rows) => async (sql) => (/from kt_misconception/.test(sql) ? rows.mis ?? [] : /from kt_skill_state/.test(sql) ? rows.sk ?? [] : /from kt_evidence/.test(sql) ? rows.ev ?? [] : []);

test("P1 real coverage: an open factor/multiple mix-up serves kila/lcm first (the first entry is todo-jodo/atoms)", async () => {
  const es = entriesFor({ skillId: SKILL });
  assert.deepEqual(es.map((e) => `${e.family}/${e.mode}`), ["todo-jodo/atoms", "kila/lcm"]);
  assert.equal(es[0], entryFor({ skillId: SKILL }));
  const r = await startSession({ id: "c1", class_level: 6 }, { skillId: SKILL }, qOf({ mis: [{ misconception_id: MIS, logit: logit(0.62) }] }));
  assert.equal(r.entry.family, "kila");
  assert.ok(r.level.proof.discriminates.includes(MIS), "the FIRST level (garam) tells the belief apart");
  assert.equal(r.session.focus, MIS);
  assert.deepEqual(r.because, [{ choice: "kila/lcm first", fact: `open mix-up: ${beliefOf(MIS)}, 0.62`, source: "kt_misconception" }]);
  assert.equal(beliefOf(MIS), "Confuses factors with multiples");
  // reproducible: the signed body regenerates the very level
  const back = verifySession(r.sessionId);
  assert.deepEqual(back.because, r.because);
  assert.equal(currentLevel(back, coverage().entries.find((e) => entryKey(e) === back.key)).levelId, r.level.levelId);
});

test("P1 default unchanged: with nothing known every multi-game skill serves its first entry's level, no because in the body", async () => {
  const skills = Object.keys(coverage().skills).filter((s) => entriesFor({ skillId: s }).length > 1).slice(0, 40);
  assert.ok(skills.length >= 20);
  for (const skillId of skills) {
    const first = entryFor({ skillId });
    const r = await startSession({ id: "c9", class_level: first.classLevel }, { skillId });
    if (!r) continue;
    assert.equal(r.entry, first, skillId);
    assert.deepEqual(r.because, []); assert.ok(!("because" in r.session), skillId);
    // the session body is today's shape
    assert.deepEqual(Object.keys(r.session), ["childId", "key", "skillId", "lessonId", "classLevel", "fade", "lang", "childArt", "lastArt", "mis", "pL", "secure", "n", "seed", "door", "recent", "hist"]);
  }
});

test("P1 session: the because survives sign/verify and a tampered body is refused", () => {
  const body = { childId: "c1", key: "k", because: [{ choice: "kila/lcm first", fact: "open mix-up: X, 0.62", source: "kt_misconception" }] };
  const tok = signSession(body);
  assert.deepEqual(verifySession(tok).because, body.because);
  const [p, mac] = tok.split(".");
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, "base64url").toString()), because: [] })).toString("base64url");
  assert.equal(verifySession(`${forged}.${mac}`), null);
});

const fakeRes = () => { const r = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { r.headers[k] = v; }, end(s) { r.body = s ? JSON.parse(s) : null; } }; return r; };
const CHILD = "00000000-0000-4000-8000-000000000001";

test("P1 routes: /start returns the because, /level returns it from the token, the default returns none", async () => {
  const saved = { ...playDeps };
  try {
    playDeps.requireChild = async (_req, id) => ({ guardian: { id: "g" }, child: { id, class_level: 6, first_name: "Riya", language_pref: "hinglish" } });
    playDeps.q = qOf({ mis: [{ misconception_id: MIS, logit: logit(0.62) }] });
    const res = fakeRes();
    await routes["POST /api/play/start"]({}, res, { childId: CHILD, skillId: SKILL });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.level.family, "kila");
    assert.equal(res.body.because[0].source, "kt_misconception"); assert.match(res.body.because[0].fact, /Confuses factors with multiples/);
    const lres = fakeRes();
    await routes["POST /api/play/level"]({}, lres, { sessionId: res.body.sessionId });
    assert.deepEqual(lres.body.because, res.body.because); assert.equal(lres.body.level.levelId, res.body.level.levelId);
    playDeps.q = qOf({});
    const d = fakeRes();
    await routes["POST /api/play/start"]({}, d, { childId: CHILD, skillId: SKILL });
    assert.equal(d.body.level.family, "todo-jodo"); assert.ok(!("because" in d.body));
  } finally { Object.assign(playDeps, saved); }
});
