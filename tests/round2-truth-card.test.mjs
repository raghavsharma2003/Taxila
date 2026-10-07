// round2 truth (patch 07; VALUES-100 V1.5 "every claim links to the exact moments (answers, delayed checks)"): the
// session-open delayed check / review (C31: the first item answer on a learned skill in a session >= 20 h after its
// anchor) is a reason on the parent card even when only K moved. Item events carry no shapeId on the live path
// (learner/live.js attaches one to why events only), so the rule reads held state, and the events below carry none. A +1 day review never
// certifies (V1.3), so D does not move, and before 07 the card stayed byte-identical after it (w1c-three-day, local and
// prod: "the parent card changes after the delayed check alone": none). Real fold, no DB.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { fuseEvidence, newLearnerState, beliefFor } from "../server/comprehension/index.js";
import { conceptCard } from "../server/comprehension/report/howweknow.js";

const SK = "c5-maths-ch01-t01-s1", H = 3600_000;
const T0 = Date.UTC(2026, 9, 1, 4, 30);
let n = 0;
const ev = (sid, t, itemKey, o = {}) => ({ id: `${sid}-${++n}`, seq: n, sessionId: sid, sessionStartAt: new Date(t).toISOString(), at: new Date(t).toISOString(),
  episodeId: `${sid}-ep${n}`, skillIds: [SK], target: SK, itemKey, cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o });
const P = "c5-maths-ch01-t01-";
const day0 = () => [ev("A", T0, P + "i01"), ev("A", T0, P + "i02"), ev("A", T0, P + "i04"), ev("A", T0, P + "i01"),
  ev("A", T0, P + "i04", { cls: "probe.why", grader: "llm" }), ev("A", T0, P + "i02")];

describe("round2 truth: the delayed check is on the parent card", () => {
  test("a right +1 day review adds a reason (K only, never D) and a 'used it again days later' chip", () => {
    const s0 = fuseEvidence(newLearnerState({ childId: "c", classLevel: 5 }), day0());
    const b0 = beliefFor(SK, { ...s0, now: new Date(T0 + 2 * H).toISOString() });
    assert.equal(s0.ledger.skills[SK].display, "learned_today");
    const s1 = fuseEvidence(s0, [ev("B", T0 + 21 * H, P + "i01")]);
    assert.equal(s1.ledger.skills[SK].flags.delayed, false, "a +1 day review never certifies (V1.3)");
    const r = s1.comp.skills[SK].reasons.at(-1);
    assert.equal(r.shapeId, "C31");
    assert.ok(!r.moved.includes("D"), `moved ${r.moved}`);
    const b1 = beliefFor(SK, { ...s1, now: new Date(T0 + 22 * H).toISOString() });
    const c0 = conceptCard(b0, { concept: "big numbers", now: new Date(T0 + 2 * H).toISOString() });
    const c1 = conceptCard(b1, { concept: "big numbers", now: new Date(T0 + 22 * H).toISOString() });
    assert.notDeepEqual(c1.chips, c0.chips);
    assert.match(c1.chips.at(-1), /used it again days later · on their own · exact answer/);
  });

  test("once per skill per session; a missed check shows as 'still working on it'", () => {
    const s0 = fuseEvidence(newLearnerState({ childId: "c", classLevel: 5 }), day0());
    const n0 = s0.comp.skills[SK].reasons.length;
    const s1 = fuseEvidence(s0, [ev("B", T0 + 21 * H, P + "i01", { outcome: 4 }), ev("B", T0 + 21 * H, P + "i02")]);
    const added = s1.comp.skills[SK].reasons.slice(n0);
    assert.equal(added.filter((r) => r.recheck).length, 1, "one recheck reason in the session");
    const b1 = beliefFor(SK, { ...s1, now: new Date(T0 + 22 * H).toISOString() });
    const card = conceptCard(b1, { concept: "big numbers", now: new Date(T0 + 22 * H).toISOString() });
    assert.ok(card.chips.some((c) => /used it again days later \(still working on it\)/.test(c)), card.chips.join(" | "));
  });

  test("an answer in the SAME session as the anchor, or before 20 h, is not a recheck", () => {
    const s0 = fuseEvidence(newLearnerState({ childId: "c", classLevel: 5 }), day0());
    const n0 = s0.comp.skills[SK].reasons.length;
    const same = fuseEvidence(s0, [ev("A", T0, P + "i02")]);
    assert.equal(same.comp.skills[SK].reasons.length, n0);
    const early = fuseEvidence(s0, [ev("C", T0 + 10 * H, P + "i02")]);
    assert.equal(early.comp.skills[SK].reasons.filter((r) => r.recheck).length, 0);
  });

  test("on a skill that is not learned yet, an answer that moves only K adds no reason (unchanged)", () => {
    const s0 = fuseEvidence(newLearnerState({ childId: "c", classLevel: 5 }), [ev("A", T0, P + "i01", { outcome: 4 })]);
    const before = s0.comp.skills[SK].reasons.length;
    const s1 = fuseEvidence(s0, [ev("B", T0 + 21 * H, P + "i02", { outcome: 4 })]);
    assert.equal(s1.comp.skills[SK].reasons.length, before);
  });
});
