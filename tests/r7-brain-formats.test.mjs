// round 7 (Learning patch 008): the explain format is chosen once per skill per lesson by the population allocator, seeded by
// `${sessionId}:${skillId}`, and logged once as an explain_format decision_record whose options carry what the night join reads.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { allocateFormat, eligibleFormats } from "../server/learner/formats.js";
import { formatDecisionOf } from "../server/brain/trace.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const toExplain = (ctx) => {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", sessionId: "L-1", ...ctx }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 6 && r.move.kind !== "explain"; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: (i + 1) * 20_000 });
  return r;
};

test("the explain uses the allocator's pick (seeded by lesson and skill), logged once with the join's options", () => {
  const eligible = eligibleFormats(K);
  const r = toExplain({ formatsEligible: eligible, formatPosteriors: {}, formatBand: "B3" });
  assert.equal(r.move.kind, "explain");
  const want = allocateFormat(eligible, {}, { seed: `L-1:${r.move.skillId}` });
  assert.equal(r.move.format, want.format);
  const st = formatDecisionOf(r.state, { lessonId: "L-1", legalMode: "M1" });
  assert.ok(st, "a decision record on the explain turn");
  const options = JSON.parse(st.params[3]);
  assert.deepEqual(Object.keys(options).sort(), ["band", "eligible", "skillId", "topicType"]);
  assert.equal(options.skillId, r.move.skillId);
  assert.equal(st.params[2], "explain_format");
  assert.equal(st.params[6], true, "randomised");
  // the next turn writes no second record for the same skill
  const next = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "achha", now: 999_000 });
  assert.equal(formatDecisionOf(next.state, { lessonId: "L-1", legalMode: "M1" }), null);
});

test("a start with no eligible list: the kit primary, no decision record", () => {
  const r = toExplain({});
  assert.equal(r.move.format, K.formats.primary);
  assert.equal(formatDecisionOf(r.state, { lessonId: "L-1", legalMode: "M1" }), null);
});
