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
const PENDING = { todo: "the held script-card help change waits on a Brain change" };
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
