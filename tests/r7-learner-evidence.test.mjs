// Round 8 groundwork (main, 2026-11-10): the learner model's facts the Director-side reader will trust, verified from code.
// The learner-evidence report (round 7 audit) answers six questions; each section here is one of them. Pure, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ktEvidenceStmt } from "../server/learner/writer.js";
import { fold, newLedger, PARAMS_VERSION } from "../server/learner/kt/ledger.js";
import * as LIVE from "../server/learner/live.js";
const { answerEvents, closeEvents, snapshotFromKt, isLearnedChecked } = LIVE;
const cardHelp = LIVE.cardHelp ?? (() => 0);
// 2b-2d need the held script-card help change (learner-evidence report, question 2: it fails three Brain replay predicates)
// (live since Brain v6.10: the script-card help change landed with the walk rule — a card answered right is not posed again this lesson)
const PENDING = {};
import { fuseEvidence, newLearnerState } from "../server/comprehension/fuse.js";
import { lessonDecisions } from "../server/conductor/planner.js";
import { decisionsFromState } from "../server/conductor/slot.js";

const S = "c5-maths-ch02-t01-s1", H = 3600_000, T0 = Date.UTC(2026, 10, 2, 11, 0);
let n = 0;
const ev = (sid, t, o = {}) => ({ id: `${sid}:${++n}:0`, seq: n, sessionId: sid, sessionStartAt: new Date(t).toISOString(), at: new Date(t + n * 1000).toISOString(),
  episodeId: `${sid}-ep${n}`, skillIds: [S], target: S, itemKey: `k${n}`, cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o });
const learn = (sid, t) => [ev(sid, t), ev(sid, t), ev(sid, t, { cls: "probe.why", grader: "llm", spanOk: true }), ev(sid, t)];

test("1. kt_evidence rows are stamped with the ledger's own params version (was a hard-coded kt-r2)", () => {
  const st = ktEvidenceStmt({ id: "c1", legal_mode: "M1" }, ev("L", T0));
  assert.ok(st.params.includes(PARAMS_VERSION), `params_version ${PARAMS_VERSION} written`);
  assert.ok(!st.params.includes("kt-r2-2026-10-07"));
});

// 2. script cards: help on the card this lesson makes a later right answer assisted (kept across episodes in kt.ep)
const card = { id: "script:c5-maths-ch02-t01-s1:ask:e1", skillId: S, answer: "3/4" };
const kit = { topicType: "T3", verified: true };
const CLS = (outcome) => ({ outcome, confidence: 1, source: "number", flags: {} });
const answer = (prevKt, outcome = "correct") => answerEvents({ lessonId: "L1", startedAt: 0, now: 1000, childSeq: 5, cls: CLS(outcome), prev: { activeItemId: card.id, kt: prevKt },
  kit, activeItem: card, evidence: [{ skillId: S, itemId: card.id, probe: "P15", outcome, hintsUsed: 0, weight: 1 }] });
const outcomeOf = (r) => r.events[0]?.outcome;

test("2a. no help: a first right answer on a script card is C0 (unaided)", () => assert.equal(outcomeOf(answer(undefined)), 0));

test("2b. her authored simpler said on the card → the next right answer is assisted (C2), not unaided", PENDING, () => {
  const after = closeEvents({ lessonId: "L1", startedAt: 0, now: 1000, childSeq: 4, cls: CLS("no_evidence"), kit, activeItem: card,
    next: { activeItemId: card.id, hintLevel: 0, lastMove: { kind: "explain", simpler: "Teen hisse, char mein se" } } }, { k: 0, ep: null, events: [] });
  assert.equal(cardHelp(after.ep, card.id), 1);
  assert.equal(outcomeOf(answer({ ep: after.ep })), 2);
});

test("2c. a miss on the card closes it (C4, as a kit item's leave); when it comes back, a right answer is assisted (C2)", PENDING, () => {
  const miss = answer(undefined, "incorrect");
  const closed = closeEvents({ lessonId: "L1", startedAt: 0, now: 1000, childSeq: 5, cls: CLS("incorrect"), kit, activeItem: card,
    next: { activeItemId: "script:other", hintLevel: 0, lastMove: { kind: "reteach" } } }, { k: miss.k, ep: miss.ep, events: [] });
  assert.equal(closed.events[0].outcome, 4, "the leave is C4");
  // (the then-card came in between, as on the walk: the episode open is the then-card's, the help list carries over)
  assert.equal(outcomeOf(answer({ ep: { ...closed.ep, itemId: "script:other" } })), 2);
});

test("2d. its key said at a give-up → a later right answer weighs as a kit item's leave (C4)", PENDING, () => {
  const gave = closeEvents({ lessonId: "L1", startedAt: 0, now: 1000, childSeq: 6, cls: CLS("incorrect"), kit, activeItem: card,
    next: { activeItemId: "script:next", hintLevel: 0, lastMove: { kind: "practice", gave: { answer: "3/4", why: "" } } } }, { k: 0, ep: null, events: [] });
  assert.equal(cardHelp(gave.ep, card.id), 4);
  assert.equal(outcomeOf(answer({ ep: gave.ep })), 4);
});

test("3. a learned skill opened at its check card: a delayed check only from 2 learning days on and on a new item; never a second 'learned'", () => {
  n = 0;
  const L1 = fold(newLedger({ childId: "c", classLevel: 5 }), learn("A", T0));
  const before = L1.skills[S];
  assert.equal(before.display, "learned_today");
  const sameDay = fold(L1, [ev("B", T0 + 2 * H)]).skills[S];
  assert.equal(sameDay.learnedAt, before.learnedAt, "not learned twice");
  assert.equal(sameDay.flags.delayed, false);
  const nextDay = fold(L1, [ev("C", T0 + 26 * H)]).skills[S];
  assert.equal(nextDay.flags.delayed, false, "one learning day later is a review, not the check");
  const repeat = fold(L1, [ev("D", T0 + 72 * H, { itemKey: "k1" })]).skills[S];
  assert.equal(repeat.flags.delayed, false, "the same card again is a recall of that card, not the check");
  const check = fold(L1, [ev("D", T0 + 72 * H)]).skills[S];
  assert.equal(check.flags.delayed, true);
  assert.equal(check.display, "mastered");
  const miss = fold(L1, [ev("D", T0 + 72 * H, { outcome: 4 })]).skills[S];
  assert.equal(miss.delayedMisses, 1, "a miss is counted (two demote)");
});

test("4. a skill cleared only in games changes what the next lesson reads (pKnown up; never learned or checked by games alone)", () => {
  n = 0;
  const game = Array.from({ length: 6 }, (_, i) => ev("G", T0, { id: `G:${i + 1}:play:0`, itemKey: `play:lvl${i}`, episodeId: `G:play:lvl${i}`, via: "game" }));
  const s0 = newLearnerState({ childId: "c", classLevel: 5 });
  const s1 = fuseEvidence(s0, game);
  const snap = snapshotFromKt(s1.ledger.skills[S], T0 + 24 * H);
  assert.ok(snap.pKnown > (s1.ledger.skills[S].prior?.pL0 ?? 0.4), `pKnown ${snap.pKnown}`);
  assert.equal(snap.attempts > 0, true);
  assert.equal(s1.ledger.skills[S].flags.unaided, false, "a game answer is never 'unaided' for learned");
  assert.equal(snap.learnedChecked, false);
});

test("5. at a start with no plan, the same decisions as the plan's lesson slot on the same inputs", () => {
  const wheel = [{ skillId: "c7-maths-ch05-t01-s1", topicId: "c7-maths-ch05-t01", opp: 11, prereq: { topicId: "c6-maths-ch02-t01", pL: 0.3, depth: 1 } }];
  const st = { counters: { lastActiveDay: "2026-09-28" }, adapt: { successFirstNext: true, prereqChecked: {} },
    school: { testWindows: [{ subject: "maths", from: "2026-10-01", to: "2026-10-06", chapters: ["5"] }] } };
  const view = { "kt.wheelSpin": { value: wheel, stale: false }, "learner.placementGap": { value: { maths: 2 }, stale: false }, "learner.firstWeek": { value: {}, stale: false } };
  const atStart = decisionsFromState(st, view, { day: "2026-10-05", subject: "maths" });
  const planned = lessonDecisions({ adapt: { gapDays: 7, successFirst: true, prereqChecked: [] }, view, testWindow: st.school.testWindows[0], subject: "maths", learningDay: "2026-10-05" });
  for (const k of ["opener", "successFirst", "newSkillBudget", "prereqCheck", "foundationShare"]) assert.deepEqual(atStart[k], planned[k], k);
  assert.equal(atStart.opener, "reanchor_light");
  assert.equal(atStart.newSkillBudget, 0, "the test is under 2 days away");
  assert.deepEqual(atStart.prereqCheck, { skillId: wheel[0].skillId, forTopicId: wheel[0].topicId, prereqTopicId: "c6-maths-ch02-t01" });
  // no Conductor state at all: plain defaults
  const none = decisionsFromState(null, {}, { day: "2026-10-05", subject: "maths" });
  assert.deepEqual([none.opener, none.successFirst, none.newSkillBudget, none.prereqCheck], ["standard_retrieval", false, 1, null]);
});

test("6. the lesson's skills snapshot says, per skill, whether it is learned and its delayed check passed", () => {
  n = 0;
  const L1 = fold(newLedger({ childId: "c", classLevel: 5 }), learn("A", T0));
  assert.equal(snapshotFromKt(L1.skills[S], T0 + H).learnedChecked, false);
  const L2 = fold(L1, [ev("D", T0 + 72 * H)]);
  assert.equal(snapshotFromKt(L2.skills[S], T0 + 73 * H).learnedChecked, true);
  assert.equal(isLearnedChecked(undefined), false);
});

// 7. home play (round 8): the trail sets the outcome; the game weight; never unaided; never the check; capped per day
test("7. home play: an afternoon of one game moves a skill a little, never certifies it, and leaves the delayed check for the lesson", async () => {
  const { homePlayEvent } = await import("../server/learner/kt/home.js");
  const { HOME_DAY_LOG_CAP } = await import("../server/learner/kt/ledger.js");
  const clean = (i) => homePlayEvent({ childId: "c", day: "2026-11-03", levelId: `lvl${i}`, skillId: S, at: new Date(T0 + 24 * H + i * 60_000).toISOString(), n: i, won: true });
  assert.equal(clean(0).outcome, 0, "a clean first-try win is C0");
  assert.equal(homePlayEvent({ childId: "c", day: "2026-11-03", levelId: "x", skillId: S, at: "2026-11-03T00:00:00Z", won: true, misses: 3, malRules: ["m1"] }).outcome, 1, "a win after misses is a later try (C1)");
  assert.equal(homePlayEvent({ childId: "c", day: "2026-11-03", levelId: "x", skillId: S, at: "2026-11-03T00:00:00Z", won: true, misses: 3, malRules: ["m1"] }).misconceptionId, "m1");
  assert.equal(homePlayEvent({ childId: "c", day: "2026-11-03", levelId: "x", skillId: S, at: "2026-11-03T00:00:00Z", won: true, hints: 1 }).outcome, 2);
  n = 0;
  const L1 = fold(newLedger({ childId: "c", classLevel: 5 }), learn("A", T0));
  const pl0 = L1.skills[S].pL;
  const forty = Array.from({ length: 40 }, (_, i) => ({ ...clean(i), seq: 100 + i }));
  const L2 = fold(fold(newLedger({ childId: "c", classLevel: 5 }), []), forty);
  const sk = L2.skills[S];
  assert.equal(sk.flags.unaided, false, "never unaided");
  assert.ok(sk.display !== "learned_today" && sk.display !== "mastered", sk.display);
  // the cap: 40 wins move the estimate by at most one learning step and a 3× likelihood ratio from its prior
  const prior = sk.prior?.pL0 ?? 0.4;
  const maxP = (() => { const o = prior / (1 - prior) * Math.exp(HOME_DAY_LOG_CAP); const p = o / (1 + o); return p + (1 - p) * 0.2; })();
  assert.ok(sk.pL <= maxP + 1e-9, `40 home wins took pL from ${prior.toFixed(3)} to ${sk.pL.toFixed(3)} (cap ${maxP.toFixed(3)})`);
  // a learned skill: home play on day+3 never spends the check; the lesson's new item that day still is the check
  const L3 = fold(L1, [{ ...homePlayEvent({ childId: "c", day: "2026-11-05", levelId: "z", skillId: S, at: new Date(T0 + 72 * H).toISOString(), won: true }), seq: 200 }]);
  assert.equal(L3.skills[S].flags.delayed, false);
  const L4 = fold(L3, [{ ...ev("D", T0 + 73 * H), seq: 201 }]);
  assert.equal(L4.skills[S].flags.delayed, true, "the lesson's check still counts");
  assert.ok(pl0 > 0);
});

// 8. round-8 ruling: a lesson the reader opened "compressed" at a learned skill's first check card (shapeId "recheck")
test("8. a compressed opener: a right answer is a re-check (never a second 'learned'); a miss sends the skill back to practising", async () => {
  const { RECHECK } = await import("../server/learner/kt/ledger.js");
  n = 0;
  const L1 = fold(newLedger({ childId: "c", classLevel: 5 }), learn("A", T0));
  const learnedAt = L1.skills[S].learnedAt;
  // right, on a new card, 2 learning days on: the delayed check passes, as without the marker
  const pass = fold(L1, [ev("D", T0 + 72 * H, { shapeId: RECHECK })]).skills[S];
  assert.equal(pass.flags.delayed, true);
  assert.equal(pass.display, "mastered");
  assert.equal(pass.learnedAt, learnedAt, "not learned a second time");
  // right, the next day (not yet the check): a review; no fresh "unaided" day is recorded
  const review = fold(L1, [ev("C", T0 + 26 * H, { shapeId: RECHECK })]).skills[S];
  assert.equal(review.display, "learned_today");
  assert.notEqual(review.aDay, "2026-11-03", "no second unaided-on-first-exposure day");
  // one miss: back to practising, the delayed flag cleared (without the marker one delayed miss only counts)
  const L2 = fold(L1, [ev("D", T0 + 72 * H)]);
  assert.equal(L2.skills[S].flags.delayed, true);
  const miss = fold(L2, [ev("E", T0 + 150 * H, { shapeId: RECHECK, outcome: 4 })]).skills[S];
  assert.equal(miss.display, "practising");
  assert.equal(miss.flags.delayed, false);
  assert.equal(miss.learnedAt, null);
  // the full unit walked after it can earn learned_today again in the same lesson
  const relearn = fold(L2, [ev("E", T0 + 150 * H, { shapeId: RECHECK, outcome: 4 }), ...learn("E", T0 + 150 * H)]).skills[S];
  assert.equal(relearn.display, "learned_today");
  // the reader only marks the card: live.js carries `recheck: true` on the card to the event's marker
  const card8 = { id: "script:c5-maths-ch02-t01-s1:c2", skillId: S, answer: "3/4", recheck: true };
  const r = answerEvents({ lessonId: "L8", startedAt: 0, now: 1000, childSeq: 5, cls: CLS("correct"), prev: { activeItemId: card8.id }, kit,
    activeItem: card8, evidence: [{ skillId: S, itemId: card8.id, probe: "P15", outcome: "correct", hintsUsed: 0, weight: 1 }] });
  assert.equal(r.events[0].shapeId, RECHECK);
});

// 9. round-8 ruling: a probe card posed first because of an open mix-up (needsVerify)
test("9. a right answer on a probe card whose targets include the open mix-up is discriminating evidence against it", () => {
  const probe = { id: "script:c5-maths-ch02-t01-s1:c2", skillId: S, answer: "3/4", probeFor: "mis-b",
    scriptCheck: { targets: ["mis-a", "mis-b"] } };
  const r = answerEvents({ lessonId: "L9", startedAt: 0, now: 1000, childSeq: 5, cls: CLS("correct"), prev: { activeItemId: probe.id }, kit,
    activeItem: probe, evidence: [{ skillId: S, itemId: probe.id, probe: "P15", outcome: "correct", hintsUsed: 0, weight: 1 }] });
  assert.equal(r.events[0].discriminates, "mis-b", "the mix-up it was posed for, not the list's first");
  const ask = { ...probe, probeFor: undefined, scriptCheck: undefined, scriptAsk: { targets: "mis-a" } };
  const r2 = answerEvents({ lessonId: "L9", startedAt: 0, now: 1000, childSeq: 6, cls: CLS("correct"), prev: { activeItemId: ask.id }, kit,
    activeItem: ask, evidence: [{ skillId: S, itemId: ask.id, probe: "P15", outcome: "correct", hintsUsed: 0, weight: 1 }] });
  assert.equal(r2.events[0].discriminates, "mis-a", "an explain beat's card that names its mix-up");
  // in the ledger: three hits make it needsVerify; the probe's right answer lowers it
  n = 0;
  const hits = [0, 1, 2].map(() => ev("A", T0, { outcome: 4, misconceptionId: "mis-b" }));
  const L1 = fold(newLedger({ childId: "c", classLevel: 5 }), hits);
  const [before] = LIVE.misconceptionRowsOf(L1);
  assert.equal(before.needsVerify, true);
  const L2 = fold(L1, [ev("B", T0 + 24 * H, { discriminates: "mis-b" })]);
  assert.ok(LIVE.misconceptionRowsOf(L2)[0].p < before.p, "evidence against the mix-up");
});

// 10. what the round-8 reader reads at a lesson start
test("10. reader inputs: delayedPassed, mix-up rows, the brief without a plan (R1 apart from R15), last active day and consent", async () => {
  const { briefShapeOf, startFactsOf } = await import("../server/conductor/slot.js");
  n = 0;
  const L1 = fold(newLedger({ childId: "c", classLevel: 5 }), learn("A", T0));
  assert.equal(snapshotFromKt(L1.skills[S], T0 + H).delayedPassed, false);
  assert.equal(snapshotFromKt(fold(L1, [ev("D", T0 + 72 * H)]).skills[S], T0 + 73 * H).delayedPassed, true);
  // mix-ups as rows
  const L2 = fold(L1, [ev("B", T0 + H, { outcome: 4, misconceptionId: "mis-a" })]);
  const rows = LIVE.misconceptionRowsOf(L2);
  assert.deepEqual(Object.keys(rows[0]).sort(), ["hits", "id", "needsVerify", "p"]);
  assert.equal(rows[0].id, "mis-a");
  assert.deepEqual(LIVE.misconceptionRowsOf(undefined), []);
  // the brief: R1 (last lesson ended hard) and R15 (first week) told apart
  const hard = briefShapeOf(decisionsFromState({ adapt: { successFirstNext: true } }, {}, { day: "2026-10-05", subject: "maths" }));
  assert.deepEqual(Object.keys(hard).sort(), ["adaptTrace", "newSkillBudget", "opener", "prereqCheck", "successFirst"]);
  assert.equal(hard.successFirst, true);
  assert.ok(hard.adaptTrace.includes("R1") && !hard.adaptTrace.includes("R15"), hard.adaptTrace.join());
  const week = briefShapeOf(decisionsFromState(null, { "learner.firstWeek": { value: { maths: { lessons: 0 } }, stale: false } }, { day: "2026-10-05", subject: "maths" }));
  assert.equal(week.successFirst, true);
  assert.equal(week.newSkillBudget, 0);
  assert.ok(week.adaptTrace.includes("R15") && !week.adaptTrace.includes("R1"), week.adaptTrace.join());
  // last active day and the remember-what-she-likes consent
  const q = async (sql) => sql.includes("conductor_state") ? [{ day: "2026-11-08" }] : sql.includes("from lesson") ? [{ started_at: "2026-11-01T10:00:00Z" }] : [];
  const f = await startFactsOf({ id: "c", guardian_id: "g" }, { q, hasConsent: async (g, c, k) => g === "g" && c === "c" && k === "memory" });
  assert.deepEqual(f, { lastActiveDay: "2026-11-08", rememberLikes: true });
  const q2 = async (sql) => sql.includes("from lesson") ? [{ started_at: "2026-11-01T20:00:00Z" }] : [];
  const f2 = await startFactsOf({ id: "c", guardian_id: "g" }, { q: q2, hasConsent: async () => false });
  assert.equal(f2.rememberLikes, false);
  assert.match(f2.lastActiveDay, /^2026-11-0[12]$/);
});
