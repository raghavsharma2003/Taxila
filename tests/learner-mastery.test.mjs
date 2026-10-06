// The ledger state machine: learned_today → mastered → durable (LEARNER-MODEL §6.1 States; PRODUCT-DESIGN
// §6.4.1 produce-form-only (a), same-day (a)+(b), the 20 h delayed check in a different session, demotion).
import { test } from "node:test";
import assert from "node:assert/strict";
import { fold, newLedger, readSkill } from "../server/learner/kt/ledger.js";

const SK = "c4-maths-ch05-t01-s1";
const H = 3600_000, DAY = 24 * H;
const T0 = Date.UTC(2026, 9, 1, 4, 30);   // 10:00 IST
let n = 0;
/** Events of one session starting at `t` (ms). */
function session(sid, t, specs) {
  const startAt = new Date(t).toISOString();
  return specs.map((o) => ({ id: `${sid}-${++n}`, seq: n, sessionId: sid, sessionStartAt: startAt, at: startAt, episodeId: o.episodeId ?? `${sid}-ep${n}`,
    skillIds: [SK], itemKey: "k", cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o }));
}
const C0 = {}, WHY = { cls: "probe.why", outcome: 0, grader: "llm" };
const learnDay = (sid, t) => session(sid, t, [C0, C0, C0, C0, WHY, C0]);
const L0 = () => newLedger({ childId: "c", classLevel: 4 });
const at = (L) => L.skills[SK];

test("(a) must be produce-form: recognition passes alone never reach learned_today", () => {
  const mcq = { cls: "item.mcq3", outcome: 0 };
  const L = fold(L0(), session("s1", T0, [mcq, mcq, mcq, mcq, mcq, mcq, mcq, WHY, WHY]));
  assert.equal(at(L).display, "practising");
  assert.equal(at(L).flags.unaided, false);
  // an open item tagged recognise (a tile answer) does not count either
  const tiles = fold(L0(), session("s1b", T0, [{ form: "recognise" }, { form: "recognise" }, { form: "recognise" }, { form: "recognise" }, WHY]));
  assert.equal(at(tiles).display, "practising");
  assert.equal(at(fold(L0(), learnDay("s1c", T0))).display, "learned_today");
});

test("(a) + (b) must land on the same local day; pL ≥ 0.95 is necessary", () => {
  const day1 = fold(L0(), session("d1", T0, [C0, C0, C0, C0, C0]));
  assert.equal(at(day1).display, "practising", "no generative pass yet");
  const day2 = fold(day1, session("d2", T0 + DAY, [WHY]));
  assert.equal(at(day2).display, "practising", "a why the next day does not pair with yesterday's (a)");
  const day2b = fold(day2, session("d2b", T0 + DAY + 2 * H, [C0, C0]));
  assert.equal(at(day2b).display, "learned_today", "(a) again on the same day as (b)");
  // (a) + (b) + two recent successes, but pL < 0.95: stays practising (the guard is necessary, never sufficient)
  const seeded = fold(L0(), session("seed", T0 - 3 * DAY, [{ outcome: 4 }]));
  seeded.skills[SK].pL = 0.1;
  const llmC0 = { grader: "llm" };
  const low = fold(seeded, session("low", T0, [llmC0, llmC0, WHY]));
  assert.ok(at(low).pL < 0.95, String(at(low).pL));
  assert.equal(at(low).aDay, at(low).bDay);
  assert.equal(at(low).display, "practising");
  // one C0 only: fewer than 2 recent successes
  assert.equal(at(fold(L0(), session("one", T0, [WHY, C0]))).display, "practising");
});

// VALUES-100 V1.3 (V1-10, docs/design/values/v1/patches): "secure" needs a correct delayed check at least 2 LEARNING days
// after the anchor (local IST days, start to start), on an item the skill was never answered on, unaided. These cases were
// rewritten from the 20 h / same-item rule to that one (the README's "rewrite the tests to the V1.3 rule, never roll back").
const D2 = 2 * DAY;
test("mastered needs a produce-form success ≥ 2 learning days after the anchor, on a NEW item, in another session, first attempt, before re-teach", () => {
  const L1 = fold(L0(), learnDay("A", T0));
  assert.equal(at(L1).display, "learned_today");
  const NEW = { itemKey: "k-new" };
  // same session, later: never a delayed check
  assert.equal(at(fold(L1, session("A", T0, [{ ...NEW }]))).display, "learned_today");
  // a different session 10 h later, and 21 h later (the old 20 h rule): too soon
  assert.equal(at(fold(L1, session("B", T0 + 10 * H, [{ ...NEW }]))).display, "learned_today");
  assert.equal(at(fold(L1, session("B2", T0 + 21 * H, [{ ...NEW }]))).display, "learned_today", "one day is not two learning days");
  // 2 days later, but re-taught first
  assert.equal(at(fold(L1, session("C", T0 + D2, [{ teach: true }, { ...NEW }]))).display, "learned_today");
  // 2 days later, first attempt is a tap: a recognition item is never a delayed check
  assert.equal(at(fold(L1, session("D", T0 + D2, [{ cls: "item.mcq3", outcome: 0, ...NEW }, { itemKey: "k-new2" }]))).display, "learned_today");
  // 2 days later, hinted: not a pass
  assert.equal(at(fold(L1, session("E", T0 + D2, [{ outcome: 2, ...NEW }]))).display, "learned_today");
  assert.equal(at(fold(L1, session("E2", T0 + D2, [{ preAttemptHelp: true, ...NEW }]))).display, "learned_today");
  // 2 days later, the SAME item again: a recall of that item, not the skill in a new form
  assert.equal(at(fold(L1, session("E3", T0 + D2, [C0]))).display, "learned_today");
  // 2 days later, first produce attempt C0 on a new item → mastered
  const M = fold(L1, session("F", T0 + D2, [{ ...NEW }]));
  assert.equal(at(M).display, "mastered");
  assert.equal(at(M).flags.delayed, true);
  // a near-transfer pass on a new item also counts as (c)
  assert.equal(at(fold(L1, session("G", T0 + D2, [{ cls: "probe.transfer.near", outcome: 0, grader: "code", ...NEW }]))).display, "mastered");
});

test("a C1/C2 at a delayed check is neither pass nor miss: it re-anchors the 2-day clock", () => {
  const L1 = fold(L0(), learnDay("A", T0));
  const L2 = fold(L1, session("B", T0 + D2, [{ outcome: 1, itemKey: "k2" }]));
  assert.equal(at(L2).display, "learned_today");
  assert.equal(at(L2).delayedMisses, 0);
  assert.equal(at(L2).anchorSession, "B");
  // 2 days after the original anchor but the same day as the new one: not a check
  assert.equal(at(fold(L2, session("C", T0 + D2 + 3 * H, [{ itemKey: "k3" }]))).display, "learned_today");
  assert.equal(at(fold(L2, session("D", T0 + 2 * D2, [{ itemKey: "k3" }]))).display, "mastered");
});

test("one delayed miss sets refresh only; two consecutive misses demote one level, never two", () => {
  let L = fold(L0(), learnDay("A", T0));
  L = fold(L, session("B", T0 + D2, [{ itemKey: "k2" }]));
  assert.equal(at(L).display, "mastered");
  L = fold(L, session("C", T0 + 2 * D2, [{ outcome: 4, itemKey: "k3" }]));
  assert.equal(at(L).display, "mastered");
  assert.equal(at(L).refresh, true);
  // a pass between misses resets the count
  const reset = fold(L, session("C2", T0 + 3 * D2, [{ itemKey: "k4" }]));
  assert.equal(at(reset).refresh, false);
  assert.equal(at(reset).delayedMisses, 0);
  L = fold(L, session("D", T0 + 3 * D2, [{ outcome: 3, itemKey: "k5" }]));
  assert.equal(at(L).display, "learned_today", "two consecutive misses: mastered → learned_today");
  L = fold(L, session("E", T0 + 4 * D2, [{ outcome: 4, itemKey: "k6" }]));
  assert.equal(at(L).display, "learned_today");
  L = fold(L, session("F", T0 + 5 * D2, [{ outcome: 4, itemKey: "k7" }]));
  assert.equal(at(L).display, "practising");
  assert.equal(at(L).aDay, null, "a fresh (a) + (b) day comes first");
});

test("durable: mastered plus unaided delayed successes at ≥ 7 d and ≥ 30 d after learned_today", () => {
  let L = fold(L0(), learnDay("A", T0));
  L = fold(L, session("B", T0 + D2, [{ itemKey: "k2" }]));
  L = fold(L, session("C", T0 + 9 * DAY, [{ itemKey: "k3" }]));
  assert.equal(at(L).display, "mastered");
  assert.equal(at(L).flags.durable7, true);
  L = fold(L, session("D", T0 + 31 * DAY, [{ itemKey: "k4" }]));
  assert.equal(at(L).display, "durable");
});

test("absence never lowers display; it only raises the refresh flag through R", () => {
  let L = fold(L0(), learnDay("A", T0));
  L = fold(L, session("B", T0 + D2, [{ itemKey: "k2" }]));
  const year = readSkill(at(L), new Date(T0 + 365 * DAY).toISOString());
  assert.equal(year.display, "mastered");
  assert.equal(year.refresh, true);
  assert.equal(year.pL, at(L).pL);
});

test("display is monotone over any evidence except the two-miss demotion path", () => {
  let L = fold(L0(), learnDay("A", T0));
  for (let i = 0; i < 20; i++) L = fold(L, session(`w${i}`, T0 + 2 * H + i, [{ outcome: 4 }]));
  assert.equal(at(L).display, "learned_today", "same-day misses are not delayed checks and never demote");
});
