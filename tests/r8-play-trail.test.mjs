// Round 8 Play P3: the trail (how a level went, from the server's own replay), signed WITH the evidence rows; home play
// signed for the child (source "home", no lesson) and folded at /act through the learner's mapping (kt/home.js
// homePlayEvent; TAXILA_HOME_PLAY_FOLD on unless off): game / chance weight, never unaided, never the delayed check, the
// per-skill per-day volume bound, and an afternoon of one game never certifies a skill.
// Pure functions + the real families; no DB.
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildTrail, cleanTrail, TRAIL_KEYS, TRAIL_MAX_MAL, TRAIL_V } from "../server/play/trail.js";
import { gradeActs, lessonEvidence, minActsOf } from "../server/play/grade.js";
import { entryFor, entryKey, currentLevel, seedOf, coverage } from "../server/play/levels.js";
import { signEvidence, verifyEvidence, playKtEvents, signHomeEvidence, verifyHomeEvidence, homeRows, EV_KIND, HOME_KIND } from "../server/play/evidence.js";
import { homeKtEvents, homeFoldOn, foldHomeLevel, priorHomeLevels, HOME_DAILY_CAP, HOME_FOLD_FLAG } from "../server/play/home.js";
import { signSession } from "../server/play/session.js";
import { routes, playDeps } from "../server/play/routes.js";
import { LOGIC } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";
import { sanitizeActs, CHANCE_WEIGHT, GAME_WEIGHT } from "../shared/play.ts";
import { temper } from "../server/learner/kt/bktr.js";
import { fold, newLedger, dayOf, HOME_DAY_LOG_CAP } from "../server/learner/kt/ledger.js";

const SKILL = "c5-maths-ch02-t01-s2";   // nishana/place: a number-line fraction, three mapped mal-rules
const entry = entryFor({ skillId: SKILL });
const logic = LOGIC[`${entry.family}/${entry.mode}`];
const sess = (over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: SKILL, lessonId: null, classLevel: 5, fade: 1, lang: "hinglish", mis: {}, pL: 0.6, secure: false, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });
const level = currentLevel(sess(), entry);
const sol = logic.solve(level);
const malRule = Object.keys(level.mal).find((m) => logic.malActs(level, m));
const malActs = logic.malActs(level, malRule);

test("P3 trail: a clean first-try win — fixed shape, no misses, acts = the solver's minimum", () => {
  const g = gradeActs(level, env(sol), { final: true });
  const t = g.trail;
  assert.deepEqual(Object.keys(t), TRAIL_KEYS);
  assert.deepEqual(t, { v: TRAIL_V, levelId: level.levelId, skillId: SKILL, game: `${level.family}/${level.mode}`, fade: level.fade, solved: true, firstTry: true,
    misses: 0, refused: 0, mal: [], undos: 0, hints: 0, acts: sol.length, minActs: level.proof.minActs, extra: 0 });
  assert.equal(level.proof.minActs, sol.length);
  assert.equal(minActsOf({ ...level, proof: { ...level.proof, minActs: undefined } }), sol.length, "the solver's own minimum when the proof has none");
  assert.ok(!JSON.stringify(t).includes("c1"), "child-free");
});

test("P3 trail: a miss matching a mal-rule, then a win — one miss, the rule and its kit misconception, not first try", () => {
  assert.ok(malRule && malActs, "a committable mal-rule");
  const g = gradeActs(level, env([...malActs, ...sol]), { final: true });
  assert.equal(g.grade.verdict, "solved");
  assert.deepEqual(g.trail.mal, [{ rule: malRule, mis: level.mal[malRule] }]);
  assert.match(level.mal[malRule], /^c5-maths-ch02-t01-m-/);
  assert.equal(g.trail.misses, 1); assert.equal(g.trail.firstTry, false); assert.equal(g.trail.solved, true);
  assert.equal(g.trail.acts, malActs.length + sol.length); assert.equal(g.trail.extra, malActs.length);
  // every mapped mal-rule then a win: each is named once, first seen first, capped at TRAIL_MAX_MAL
  const all = Object.keys(level.mal).map((m) => logic.malActs(level, m)).filter(Boolean).flat();
  const ga = gradeActs(level, env([...all, ...sol]), { final: true });
  assert.deepEqual(ga.trail.mal.map((m) => m.rule), Object.keys(level.mal).filter((m) => logic.malActs(level, m)).slice(0, TRAIL_MAX_MAL));
  // the miss alone, closed unsolved: solved false, extra null, every act counted
  const miss = gradeActs(level, env(malActs), { final: true });
  assert.equal(miss.trail.solved, false); assert.equal(miss.trail.extra, null); assert.equal(miss.trail.acts, malActs.length); assert.equal(miss.trail.misses, 1);
});

test("P3 trail: undos are counted; acts past the win are not; the device's impasse flag is never read", () => {
  const g = gradeActs(level, env([sol[0], { kind: "undo" }, sol[0], { kind: "undo" }, ...sol]), { final: true });
  assert.equal(g.trail.undos, 2); assert.equal(g.trail.acts, 4 + sol.length); assert.equal(g.trail.extra, 4);
  assert.equal(g.trail.firstTry, true, "an undo is not a miss (P2's first-try rule)");
  const past = gradeActs(level, env([...sol, { kind: "undo" }, { kind: "undo" }]), { final: true });
  assert.equal(past.trail.undos, 0); assert.equal(past.trail.acts, sol.length);
  // claim keys the device might add ride nowhere (sanitizeActs strips them before the replay the trail reads)
  const claim = env(sol).map((e) => ({ ...e, act: { ...e.act, correct: true, hint: 3 } }));
  assert.deepEqual(gradeActs(level, claim, { final: true }).trail, gradeActs(level, env(sol), { final: true }).trail);
});

test("P3 certification: the trail changes no level and no grade (every coverage entry, solver's solution and a mal-rule miss)", () => {
  let n = 0;
  for (const e of coverage().entries) {
    const s = { childId: "c1", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade: 1, lang: "hinglish", mis: {}, n: 0, seed: seedOf("c1", entryKey(e), 0), door: "garam", recent: [], hist: null };
    const lv = currentLevel(s, e);
    if (!lv) continue;
    const lg = LOGIC[`${lv.family}/${lv.mode}`], v = lg.validate(lv), s0 = lg.solve(lv);
    if (!s0) continue;
    for (const acts of [s0, [...(Object.keys(lv.mal).map((m) => lg.malActs(lv, m)).find(Boolean) ?? []), ...s0]]) {
      const g = gradeActs(lv, env(acts), { final: true });
      assert.deepEqual(g.grade, lg.grade(v, sanitizeActs(env(acts))), `${lv.levelId}: the grade is the family's own`);
      assert.deepEqual(Object.keys(g.trail), TRAIL_KEYS);
      assert.deepEqual(cleanTrail(g.trail), g.trail, `${lv.levelId}: a built trail survives its own reader unchanged`);
      assert.ok(JSON.stringify(g.trail).length < 700, `${lv.levelId}: small`);
    }
    assert.equal(gradeActs(lv, env(s0), { final: true }).trail.extra, 0, `${lv.levelId}: the solver's solution is the minimum`);
    n++;
  }
  assert.ok(n >= 40, `${n} coverage entries`);
});

test("P3 trail: the reader bounds what it hands on", () => {
  assert.equal(cleanTrail(null), null); assert.equal(cleanTrail({ v: 99 }), null);
  const big = cleanTrail({ v: 1, levelId: "x".repeat(500), mal: Array.from({ length: 20 }, (_, i) => ({ rule: `r${i}`, mis: "m".repeat(200) })), misses: 1e9, acts: -5, fade: 7, extra: "?", solved: "yes" });
  assert.equal(big.levelId.length, 120); assert.equal(big.mal.length, TRAIL_MAX_MAL); assert.equal(big.mal[0].mis.length, 64);
  assert.equal(big.misses, 999); assert.equal(big.acts, 0); assert.equal(big.fade, 1); assert.equal(big.extra, 0); assert.equal(big.solved, false);
  assert.deepEqual(buildTrail(level, [], { moments: [] }, { grade: null }).acts, 0);
});

// ───────────────────────────── signing ─────────────────────────────

const key = randomBytes(32), opts = { key };
const rowsOf = (acts) => { const g = gradeActs(level, env(acts), { final: true }); return { g, rows: lessonEvidence(g.grade, level) }; };

test("P3 signing: the trail is signed WITH the rows; tampering fails; a pre-P3 token (no trail) still verifies and folds the same", () => {
  const { g, rows } = rowsOf([...malActs, ...sol]);
  const tok = signEvidence({ childId: "c1", lessonId: "les1", levelId: level.levelId, rows, trail: g.trail }, opts);
  const v = verifyEvidence(tok, { childId: "c1", lessonId: "les1" }, opts);
  assert.deepEqual(v.trail, g.trail); assert.equal(v.rows.length, 1); assert.equal(v.rows[0].misconceptionId, level.mal[malRule]);
  // a trail edited on the device breaks the signature
  const [p, mac] = tok.split(".");
  const body = JSON.parse(Buffer.from(p, "base64url").toString());
  body.trail.misses = 0; body.trail.firstTry = true;
  assert.equal(verifyEvidence(`${Buffer.from(JSON.stringify(body)).toString("base64url")}.${mac}`, { childId: "c1", lessonId: "les1" }, opts), null);
  // the exact pre-P3 payload shape
  const old = signSession({ k: EV_KIND, childId: "c1", lessonId: "les1", levelId: level.levelId, rows }, opts);
  const vo = verifyEvidence(old, { childId: "c1", lessonId: "les1" }, opts);
  assert.deepEqual(vo.rows, v.rows); assert.equal(vo.trail, null);
  // the fold: the trail rides on the event as metadata only; everything else is identical to the old token's event
  const now = Date.now(), c = { childId: "c1", lessonId: "les1", startedAt: now, now, childSeq: 3 };
  const withT = playKtEvents({ ...c, tokens: [tok] }, opts).events, without = playKtEvents({ ...c, tokens: [old] }, opts).events;
  assert.equal(withT.length, 1); assert.deepEqual(withT[0].playTrail, g.trail);
  const { playTrail, ...rest } = withT[0];
  assert.deepEqual(rest, without[0]); assert.ok(!("playTrail" in without[0]));
  assert.equal(temper(withT[0]), temper(without[0]));
});

test("P3 home signing: source \"home\", no lessonId, its own kind — never accepted by the lesson path", () => {
  const { g, rows } = rowsOf(sol);
  const tok = signHomeEvidence({ childId: "c1", levelId: level.levelId, rows, trail: g.trail }, opts);
  const v = verifyHomeEvidence(tok, { childId: "c1" }, opts);
  assert.ok(v.rows.length && v.rows.every((r) => r.source === "home")); assert.deepEqual(v.trail, g.trail);
  assert.deepEqual(v.rows, homeRows(rows)); assert.deepEqual(homeRows(rows).map(({ source, ...r }) => r), rows.map(({ source, ...r }) => r), "the same rows but for source");
  const body = JSON.parse(Buffer.from(tok.split(".")[0], "base64url").toString());
  assert.equal(body.k, HOME_KIND); assert.ok(!("lessonId" in body)); assert.equal(body.childId, "c1");
  assert.equal(verifyHomeEvidence(tok, { childId: "c2" }, opts), null, "another child");
  for (const lessonId of ["les1", "undefined", "null", ""]) assert.equal(verifyEvidence(tok, { childId: "c1", lessonId }, opts), null, `lesson ${lessonId}`);
  const pe = playKtEvents({ tokens: [tok], childId: "c1", lessonId: "les1", startedAt: Date.now(), now: Date.now(), childSeq: 1 }, opts);
  assert.equal(pe.events.length, 0); assert.equal(pe.rejected, 1);
  // and a lesson token is never a home token
  assert.equal(verifyHomeEvidence(signEvidence({ childId: "c1", lessonId: "les1", levelId: level.levelId, rows }, opts), { childId: "c1" }, opts), null);
});

const fakeRes = () => { const r = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { r.headers[k] = v; }, end(x) { r.body = x ? JSON.parse(x) : null; } }; return r; };
const CHILD = "00000000-0000-4000-8000-000000000003";
async function playOnce(lessonId, actsOf) {
  const st = fakeRes();
  await routes["POST /api/play/start"]({}, st, { childId: CHILD, skillId: SKILL, ...(lessonId ? { lessonId } : {}) });
  assert.equal(st.statusCode, 200);
  const lv = st.body.level, lg = LOGIC[`${lv.family}/${lv.mode}`];
  const a = fakeRes();
  await routes["POST /api/play/act"]({}, a, { sessionId: st.body.sessionId, levelId: lv.levelId, acts: env(actsOf(lv, lg)), final: true });
  assert.equal(a.statusCode, 200);
  return { lv, body: a.body };
}

test("P3 routes: /act returns the trail; a lesson gets an evidenceToken carrying it, home play a homeToken (and no lesson token)", async () => {
  const saved = { ...playDeps };
  try {
    playDeps.requireChild = async (_req, id) => ({ guardian: { id: "g" }, child: { id, class_level: 5, first_name: "Riya", language_pref: "hinglish" } });
    playDeps.q = async () => [];
    const written = [];
    playDeps.writeHome = async (_child, evs) => { written.push(...evs); return { written: true, n: evs.length }; };
    const home = await playOnce(null, (lv, lg) => lg.solve(lv));
    assert.equal(written.length, 1, "the home level folded at /act (decision A)"); assert.equal(written[0].target, SKILL); assert.match(written[0].id, /^home:/);
    assert.equal(home.body.trail.solved, true); assert.equal(home.body.trail.firstTry, true); assert.equal(home.body.trail.levelId, home.lv.levelId);
    assert.ok(!("evidenceToken" in home.body)); assert.ok(typeof home.body.homeToken === "string");
    const hv = verifyHomeEvidence(home.body.homeToken, { childId: CHILD });
    assert.deepEqual(hv.trail, home.body.trail); assert.ok(hv.rows.every((r) => r.source === "home"));
    assert.deepEqual(home.body.evidence.map((r) => r.source), ["game"], "the display rows are unchanged");
    const LES = "11111111-1111-4111-8111-111111111111";
    const les = await playOnce(LES, (lv, lg) => [...(Object.keys(lv.mal).map((m) => lg.malActs(lv, m)).find(Boolean) ?? []), ...lg.solve(lv)]);
    assert.ok(!("homeToken" in les.body)); assert.equal(written.length, 1, "a lesson level never folds as home play");
    const lv = verifyEvidence(les.body.evidenceToken, { childId: CHILD, lessonId: LES });
    assert.deepEqual(lv.trail, les.body.trail); assert.equal(lv.trail.misses, 1); assert.equal(lv.trail.firstTry, false);
    // mid-level posts carry no trail and no token
    const st = fakeRes();
    await routes["POST /api/play/start"]({}, st, { childId: CHILD, skillId: SKILL });
    const mid = fakeRes();
    await routes["POST /api/play/act"]({}, mid, { sessionId: st.body.sessionId, levelId: st.body.level.levelId, acts: env(logic.solve(st.body.level).slice(0, 1)) });
    assert.ok(!("trail" in mid.body) && !("homeToken" in mid.body) && !("grade" in mid.body));
  } finally { Object.assign(playDeps, saved); }
});


// ───────────────────────────── the home fold (round 8 follow-up A: live, through the learner's mapping) ─────────────────────────────

const ON = { [HOME_FOLD_FLAG]: "on" };
const SK = "c6-maths-ch05-t04-s1";
const H = 3600_000, DAY = 24 * H;
const T0 = Date.UTC(2026, 9, 1, 4, 30);   // 10:00 IST
const row = (outcome = "correct", weight = GAME_WEIGHT, skillId = SK) => ({ skillId, outcome, source: "game", itemId: "play:x", probe: "P10", hintsUsed: 0, weight });
const homeTok = (levelId, rows, now, trail) => signHomeEvidence({ childId: "c1", levelId, rows, ...(trail ? { trail } : {}) }, { key, now });
const trailOf = (o = {}) => ({ v: TRAIL_V, levelId: "L", skillId: SK, game: "kila/lcm", fade: 1, solved: true, firstTry: true, misses: 0, refused: 0, mal: [], undos: 0, hints: 0, acts: 3, minActs: 3, extra: 0, ...o });

test("A home fold: ON by default (off only when set off / 0 / false / no); the one production caller is /api/play/act", () => {
  assert.equal(homeFoldOn({}), true); assert.equal(homeFoldOn(ON), true);
  for (const v of ["off", "0", "false", "no", " OFF "]) assert.equal(homeFoldOn({ [HOME_FOLD_FLAG]: v }), false, v);
  const now = T0;
  const r = homeKtEvents({ tokens: [homeTok("L1", [row()], now)], childId: "c1", now, env: { [HOME_FOLD_FLAG]: "off" } }, { key, now });
  assert.equal(r.off, true); assert.equal(r.events.length, 0);
  assert.equal(homeKtEvents({ tokens: [homeTok("L1", [row()], now)], childId: "c1", now, env: {} }, { key, now }).events.length, 1);
  const callers = [];
  const walk = (d) => { for (const f of readdirSync(d, { withFileTypes: true })) { const p = join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(m?js|ts)$/.test(f.name) && p !== join("server", "play", "home.js") && /\bfoldHomeLevel\b|\bhomeKtEvents\b/.test(readFileSync(p, "utf8"))) callers.push(p); } };
  walk("server");
  assert.deepEqual(callers, [join("server", "play", "routes.js")]);
});

test("A home fold: each verified level is the learner's homePlayEvent — the trail sets the outcome, the row the chance weight", () => {
  const now = T0;
  const r = homeKtEvents({ tokens: [
    homeTok("La", [row("correct", GAME_WEIGHT)], now, trailOf({ levelId: "La" })),
    homeTok("Lb", [row("correct", CHANCE_WEIGHT)], now, trailOf({ levelId: "Lb" })),
    homeTok("Lc", [row("correct", GAME_WEIGHT)], now, trailOf({ levelId: "Lc", firstTry: false, misses: 2, mal: [{ rule: "product", mis: "c6-m-x" }] })),
    homeTok("Ld", [row("correct", 1)], now),
    homeTok("Le", [row("incorrect", GAME_WEIGHT)], now, trailOf({ levelId: "Le", solved: false, firstTry: false, misses: 1, extra: null })),
  ], childId: "c1", now, env: ON }, { key, now });
  assert.equal(r.events.length, 4); assert.equal(r.dropped, 1, "a row of any other weight is dropped");
  const day = dayOf(now);
  const [a, , c, e] = r.events;
  assert.equal(a.id, `home:c1:${day}:La:0`); assert.equal(a.sessionId, `home:c1:${day}`); assert.equal(a.graderVersion, "home-play-v1");
  assert.equal(a.outcome, 0, "a clean first-try win is C0");
  assert.equal(c.outcome, 1, "a win after misses is a later try"); assert.equal(c.misconceptionId, "c6-m-x", "the kit mis of the mal-rule her miss matched");
  assert.notEqual(e.outcome, 0); assert.equal(e.target, SK);
  assert.deepEqual(r.events.map((x) => temper(x)), [GAME_WEIGHT, CHANCE_WEIGHT, GAME_WEIGHT, GAME_WEIGHT]);
  for (const x of r.events) { assert.equal(x.via, "game"); assert.match(x.episodeId, /^home:/); assert.equal(x.grader, "code"); assert.ok(x.playTrail); }
  // a lesson token is refused here; a token of another child too
  const lesson = signEvidence({ childId: "c1", lessonId: "les1", levelId: "Lf", rows: [row()] }, { key, now });
  assert.equal(homeKtEvents({ tokens: [lesson], childId: "c1", now, env: ON }, { key, now }).rejected, 1);
  assert.equal(homeKtEvents({ tokens: [homeTok("Lg", [row()], now)], childId: "c2", now, env: ON }, { key, now }).rejected, 1);
});

const L0 = () => newLedger({ childId: "c", classLevel: 6 });
let seq = 0;
const seqd = (evs) => evs.map((e) => ({ ...e, seq: ++seq }));
function lessonSession(sid, t, specs) {
  const startAt = new Date(t).toISOString();
  return specs.map((o) => ({ id: `${sid}-${++seq}`, seq, sessionId: sid, sessionStartAt: startAt, at: startAt, episodeId: `${sid}-ep${seq}`,
    skillIds: [SK], itemKey: `k${seq}`, cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T1", ...o }));
}

test("A home fold: an afternoon of one game (30 clean first-try home levels of one skill, one IST day) never makes it learned, mastered or unaided", () => {
  const now = T0 + 4 * H;   // 14:00 IST
  const toks = Array.from({ length: 30 }, (_, i) => homeTok(`Af${i}`, [row()], now - (30 - i) * 5 * 60_000, trailOf({ levelId: `Af${i}` })));
  // as /act folds them: one level at a time, each with the levels already folded that day as prior
  let L = L0();
  const prior = [];
  let folded = 0;
  for (const t of toks) {
    const r = homeKtEvents({ tokens: [t], childId: "c1", now, env: ON, prior }, { key, now });
    for (const e of r.events) prior.push({ skillId: e.target, at: e.at, levelId: e.episodeId.split(":").at(-1) });
    folded += r.events.length;
    L = fold(L, seqd(r.events));
  }
  assert.equal(folded, HOME_DAILY_CAP, "the volume bound: the rest are not written");
  const sk = L.skills[SK];
  assert.equal(sk.flags.unaided, false); assert.equal(sk.flags.delayed, false);
  assert.ok(!["learned_today", "mastered", "durable"].includes(sk.display), sk.display);
  // the ledger's own rule is what bounds it: ±ln 3 of evidence and one learning step that day
  assert.ok(Math.abs(L.homeBudget[SK].sum) <= HOME_DAY_LOG_CAP + 1e-9);
  const p0 = sk.prior?.pL0 ?? 0.4;
  const o = (p0 / (1 - p0)) * Math.exp(HOME_DAY_LOG_CAP), pc = o / (1 + o);
  assert.ok(sk.pL <= pc + (1 - pc) * 0.3 + 1e-9, `pL ${sk.pL.toFixed(3)} from ${p0}`);
});

test("A home fold rules 2 and 3: home levels never set unaided; a home win days later is never the delayed check and never spends it", () => {
  let L = L0();
  for (let d = 0; d < 3; d++) {
    const now = T0 + d * DAY;
    const r = homeKtEvents({ tokens: [1, 2, 3].map((i) => homeTok(`L${d}-${i}`, [row()], now)), childId: "c1", now, env: ON }, { key, now });
    assert.equal(r.events.length, 3);
    const before = L.skills[SK]?.pL ?? 0;
    L = fold(L, seqd(r.events));
    assert.ok(L.skills[SK].pL > before, "a home win moves pL");
  }
  assert.equal(L.skills[SK].flags.unaided, false); assert.equal(L.skills[SK].display, "practising");
  const L1 = fold(L0(), lessonSession("A", T0, [{}, {}, {}, {}, { cls: "probe.why", outcome: 0, grader: "llm" }, {}]));
  assert.equal(L1.skills[SK].display, "learned_today");
  const now = T0 + 2 * DAY;
  const r = homeKtEvents({ tokens: [homeTok("Lh", [row()], now)], childId: "c1", now, env: ON }, { key, now });
  const afterHome = fold(L1, seqd(r.events));
  assert.equal(afterHome.skills[SK].flags.delayed, false); assert.equal(afterHome.skills[SK].display, "learned_today");
  const afterItem = fold(afterHome, lessonSession("B", now, [{}]));
  assert.equal(afterItem.skills[SK].flags.delayed, true, "the check was not spent by the home level"); assert.equal(afterItem.skills[SK].display, "mastered");
  const m = homeKtEvents({ tokens: [homeTok("Lm", [row("incorrect")], now)], childId: "c1", now, env: ON }, { key, now });
  const afterMiss = fold(L1, seqd(m.events));
  assert.equal(afterMiss.skills[SK].delayedMisses, 0); assert.equal(afterMiss.skills[SK].refresh, false);
});

test("A home fold volume bound: HOME_DAILY_CAP levels per skill per learning day (IST), prior folds included; a level folds once a day", () => {
  assert.equal(HOME_DAILY_CAP, 24);
  const now = T0, o = { key, now };
  const many = Array.from({ length: 12 }, (_, i) => homeTok(`C${i}`, [row()], now));
  // 20 already folded today → 4 more; yesterday's do not count; a level already folded today is not folded again
  const today = new Date(now - 2 * H).toISOString(), yesterday = new Date(now - DAY).toISOString();
  const prior = [...Array.from({ length: 19 }, (_, i) => ({ skillId: SK, at: today, levelId: `X${i}` })), { skillId: SK, at: today, levelId: "C0" }, { skillId: SK, at: yesterday }, { skillId: SK, at: yesterday }];
  const p = homeKtEvents({ tokens: many, childId: "c1", now, env: ON, prior }, o);
  assert.equal(p.events.length, 4); assert.equal(p.events[0].episodeId, `home:c1:${dayOf(now)}:C1`); assert.ok(p.capped >= 1);
  // another skill has its own bound
  const other = homeKtEvents({ tokens: [homeTok("D1", [row("correct", GAME_WEIGHT, "c6-maths-ch05-t04-s2")], now)], childId: "c1", now, env: ON, prior }, o);
  assert.equal(other.events.length, 1);
  // the learning day is IST: 23:00 IST and 01:00 IST the next day are two days
  const late = Date.UTC(2026, 9, 1, 17, 30), early = late + 2 * H;
  const full = Array.from({ length: HOME_DAILY_CAP }, () => ({ skillId: SK, at: new Date(late).toISOString() }));
  assert.equal(homeKtEvents({ tokens: [homeTok("E1", [row()], early)], childId: "c1", now: early, env: ON, prior: full }, { key, now: early }).events.length, 1);
  assert.equal(homeKtEvents({ tokens: [homeTok("E2", [row()], late)], childId: "c1", now: late, env: ON, prior: full }, { key, now: late }).events.length, 0);
});

test("A home fold at /act: prior read back from kt_evidence (no home table), written through the route's writer seam", async () => {
  const now = Date.now();
  const day = dayOf(now);
  const seen = [];
  const q = async (sql, params) => { seen.push([sql, params]); return [{ episode_id: `home:c1:${day}:Lp`, target: SK, skill_ids: [SK], occurred_at: new Date(now - 60_000).toISOString() }]; };
  const pr = await priorHomeLevels("c1", day, q);
  assert.deepEqual(pr, [{ skillId: SK, at: new Date(now - 60_000).toISOString(), levelId: "Lp" }]);
  assert.match(seen[0][0], /from kt_evidence/); assert.equal(seen[0][1][1], `home:c1:${day}`);
  const got = [];
  const write = async (_c, evs) => { got.push(...evs); return { written: true, n: evs.length }; };
  // the route's token is signed with the process key (no opts)
  const tok = signHomeEvidence({ childId: "c1", levelId: "Lq", rows: [row()] }, { now });
  const r = await foldHomeLevel({ child: { id: "c1" }, token: tok, q, write, now, env: ON });
  assert.equal(r.off, false); assert.equal(r.folded, 1); assert.equal(got.length, 1); assert.equal(got[0].episodeId, `home:c1:${day}:Lq`);
  // the level already folded today (read back) is not folded again
  const again = await foldHomeLevel({ child: { id: "c1" }, token: signHomeEvidence({ childId: "c1", levelId: "Lp", rows: [row()] }, { now }), q, write, now, env: ON });
  assert.equal(again.folded, 0); assert.equal(got.length, 1);
  assert.equal((await foldHomeLevel({ child: { id: "c1" }, token: tok, q, write, now, env: { [HOME_FOLD_FLAG]: "off" } })).off, true);
  assert.equal((await priorHomeLevels("c1", day, async () => { throw new Error("no db"); })).length, 0, "a failed read is no prior");
});
