// round 7 (Learning patch 006): the lesson start reads the Conductor's lesson slot. planPrior takes the slot's opener,
// success-first and budget (unchanged) plus R5's prerequisite check and R9's foundation share; decideSegment opens on the
// prerequisite first when the segment teaches its topic; the Director wraps at the next natural stop once the brief's wrapAt
// has passed, and never runs past hardStopAt. PURE.
import { test } from "node:test";
import assert from "node:assert/strict";
import { planPrior } from "../server/director/session/prior.js";
import { decideSegment } from "../server/director/session/decide.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const plan = (lesson) => ({ slots: [{ kind: "live_lesson", ...lesson }] });

test("planPrior: the slot's opener, success-first and budget; the prerequisite check and foundation share (capped at .6)", () => {
  const p = planPrior(plan({ opener: "re_anchor", successFirst: true, pace: { newSkillBudget: 0 },
    prereqCheck: { skillId: "s1", forTopicId: "c6-maths-ch07-t01", prereqTopicId: "c5-maths-ch04-t01" }, foundationShare: 0.9 }), {});
  assert.equal(p.opener, "re_anchor");
  assert.equal(p.successFirst, true);
  assert.equal(p.newSkillBudget, 0);
  assert.equal(p.foundationShare, 0.6);
  // a prerequisite outside the graph is dropped, never a dangling foundation
  const q = planPrior(plan({ prereqCheck: { skillId: "s1", forTopicId: "x", prereqTopicId: "c99-nope" } }), {});
  assert.equal(q.prereqCheck, null);
  // no plan: today's defaults exactly
  const d = planPrior(null, {});
  assert.deepEqual([d.opener, d.successFirst, d.newSkillBudget, d.prereqCheck, d.foundationShare], ["standard_retrieval", false, 1, null, null]);
});

test("decideSegment: a segment that teaches the checked topic opens on its prerequisite first; another topic is untouched", () => {
  const topic = "c6-maths-ch01-t01", pre = "c5-maths-ch01-t01";
  const prior = { levelPathTopic: topic, prereqCheck: { skillId: "s", forTopicId: topic, prereqTopicId: pre } };
  const d = decideSegment({ prior });
  assert.equal(d.mode, "foundation_first");
  assert.equal(d.foundation, pre);
  assert.ok(d.why.some((w) => w.code === "prereq_check"));
  const other = decideSegment({ prior: { ...prior, prereqCheck: { ...prior.prereqCheck, forTopicId: "c6-maths-ch02-t01" } } });
  assert.equal(other.mode, "teach");
});

const K = kit();
const NE = cls("no_evidence");
const start = (lessonBrief) => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, ...(lessonBrief ? { lessonBrief } : {}) }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
const turn = (r, c, now) => step(r.state, { event: "turn", kit: K, cls: c, now });

test("hardStopAt passed: the next turn wraps; no brief: the lesson goes on", () => {
  const brief = { wrapAt: new Date(10 * 60_000).toISOString(), hardStopAt: new Date(15 * 60_000).toISOString() };
  const r = turn(start(brief), NE, 16 * 60_000);
  assert.equal(r.move.kind, "wrap");
  const free = turn(start(null), NE, 16 * 60_000);
  assert.notEqual(free.move.kind, "wrap");
});

test("wrapAt passed: practice ends at the next natural stop (after an item), never mid-question", () => {
  const brief = { wrapAt: new Date(60_000).toISOString(), hardStopAt: new Date(60 * 60_000).toISOString() };
  let r = start(brief), t = 0;
  while (r.state.phase !== "practice" && t < 40) r = turn(r, NE, ++t * 1000);
  assert.equal(r.state.phase, "practice");
  const asked = r.move.itemId;
  r = turn(r, cls("correct"), 2 * 60_000);
  assert.notEqual(r.state.phase, "practice", `still practising after wrapAt: ${r.move.kind} ${asked}`);
});

// integration 4 (main): with server/conductor/slot.js on this base, the start's read is a real plan, and planPrior reads the
// slot's knobs from it (the bug was a plan with no slots, so planPrior always fell back to its defaults)
import { lessonBriefFor } from "../server/conductor/slot.js";
test("lessonBriefFor on this base: a non-null plan and brief, and planPrior takes the slot's knobs from that plan", async () => {
  const pre = "c5-maths-ch01-t01", topic = "c6-maths-ch01-t01";
  const day = { band: "B3", slots: [{ kind: "live_lesson", id: "slot-1", subject: "maths", targetMin: 20, window: ["16:00", "21:00"],
    opener: "reanchor_light", successFirst: true, pace: { newSkillBudget: 0 }, prereqCheck: { skillId: "s1", forTopicId: topic, prereqTopicId: pre },
    foundationShare: 0.5 }] };
  const q = async (t) => (/child_routine/.test(t) ? [{ tz: "Asia/Kolkata" }] : /day_plan/.test(t) ? [{ version: 1, plan: day }] : []);
  const r = await lessonBriefFor("child-1", { now: new Date("2026-10-05T10:50:00Z"), q });
  assert.ok(r && r.plan && r.brief, "non-null plan and brief");
  // audit LEARN-01: no hard stop unless the family's limits are on; the wrap is never past one when there is
  assert.ok(r.brief.hardStopAt === null || Date.parse(r.brief.wrapAt) <= Date.parse(r.brief.hardStopAt));
  const p = planPrior(r.plan, {});
  assert.deepEqual([p.opener, p.successFirst, p.newSkillBudget, p.foundationShare], ["reanchor_light", true, 0, 0.5]);
  assert.equal(p.prereqCheck?.prereqTopicId, pre);
});
