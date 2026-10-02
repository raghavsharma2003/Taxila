// BKT-R update rules (LEARNER-MODEL §6.1 rules 0-9) and the §13 Knowledge-row unit properties.
import { test } from "node:test";
import assert from "node:assert/strict";
import { OUTCOMES, EMISSIONS, recentValue, fsrsGrade, EVIDENCE_CLASSES } from "../server/learner/kt/outcomes.js";
import { gatedEmission, logEvidence, spend, SESSION_LOG_CAP, dropReason, teachStep, TEACH_CAP } from "../server/learner/kt/bktr.js";
import { retrievability, review } from "../server/learner/kt/fsrs.js";
import { fold, newLedger } from "../server/learner/kt/ledger.js";
import { correctedPrior } from "../server/learner/kt/priors.js";

const SK = "c4-maths-ch05-t01-s1";
const T0 = "2026-10-01T05:00:00.000Z";
let n = 0;
const ev = (o = {}) => ({ id: `e${++n}`, seq: n, sessionId: "s1", sessionStartAt: T0, at: T0, episodeId: `ep${n}`, skillIds: [SK],
  itemKey: "k", cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o });
const L0 = () => newLedger({ childId: "c", classLevel: 4 });

test("emissions: every class is a distribution pair; item.open LRs within 1% of the launch table", () => {
  for (const cls of EVIDENCE_CLASSES) {
    const { k, u } = EMISSIONS[cls];
    const emitting = OUTCOMES[cls].filter((o) => o !== "NA").length;
    assert.equal(k.length, emitting, cls);
    assert.ok(Math.abs(k.reduce((a, b) => a + b, 0) - 1) < 1e-9, `${cls} k sums to 1`);
    assert.ok(Math.abs(u.reduce((a, b) => a + b, 0) - 1) < 1e-3, `${cls} u sums to 1`);
  }
  const table = [8.0, 1.0, 0.35, 0.16, 0.05, 0.5];
  const { k, u } = EMISSIONS["item.open"];
  table.forEach((lr, i) => assert.ok(Math.abs(k[i] / u[i] / lr - 1) < 0.01, `item.open LR ${i}`));
  assert.ok(Math.abs(EMISSIONS["item.mcq3"].k[0] / EMISSIONS["item.mcq3"].u[0] - 2.7) < 1e-9);
});

test("every class × outcome has an emission, an FSRS grade (items) and a recent value (items)", () => {
  for (const cls of EVIDENCE_CLASSES) {
    OUTCOMES[cls].forEach((name, o) => {
      if (name === "NA") { assert.equal(dropReason(ev({ cls, outcome: o })), "no_attempt"); return; }
      const g = gatedEmission({ cls, outcome: o, grader: "code" }, 1);
      assert.ok(g.kR > 0 && g.u > 0, `${cls}/${name}`);
      const item = ["item.open", "item.mcq2", "item.mcq3", "item.mcq4", "solo"].includes(cls);
      assert.equal(fsrsGrade(cls, o) !== null, item, `${cls}/${name} grade`);
      assert.equal(recentValue(cls, o) !== null, item, `${cls}/${name} recent`);
    });
  }
});

test("rule 3: LR(C0) ≥ 1 for every R in (0, 1] and every grader; a late failure is weaker evidence", () => {
  for (const grader of ["code", "llm", "human"]) {
    for (let R = 0.01; R <= 1; R += 0.01) {
      const [c0] = logEvidence({ cls: "item.open", outcome: 0, grader }, [0.4], [R]);
      assert.ok(c0 >= 0, `${grader} R=${R}`);
      const [c4] = logEvidence({ cls: "item.open", outcome: 4, grader }, [0.4], [R]);
      const [c4full] = logEvidence({ cls: "item.open", outcome: 4, grader }, [0.4], [1]);
      assert.ok(c4 <= 0 && c4 >= c4full - 1e-12);
    }
  }
  // grader folding shrinks evidence (KT §1.3)
  const [code] = logEvidence({ cls: "probe.why", outcome: 0, grader: "code" }, [0.4], [1]);
  const [llm] = logEvidence({ cls: "probe.why", outcome: 0, grader: "llm" }, [0.4], [1]);
  assert.ok(llm < code && llm > 0);
});

test("rule 0: safety, low ASR, NA, contaminated and para-off events change nothing", () => {
  const before = L0();
  for (const o of [{ safetyFired: true }, { asrConf: 0.2 }, { outcome: 6 }, { contaminated: true }, { cls: "para", outcome: 0 }]) {
    const after = fold(before, [ev(o)]);
    assert.deepEqual(after.skills, {}, JSON.stringify(o));
    assert.deepEqual(after.mis, {});
    assert.deepEqual(after.ability, {});
  }
});

test("rule 5: the j-th event of a class weighs 1/j and the session sum is clamped to ±log 50", () => {
  let b = { sum: 0, byClass: {} };
  const applied = [];
  for (let i = 0; i < 40; i++) { const r = spend(b, "item.open", Math.log(8)); applied.push(r.applied); b = r.budget; }
  assert.ok(Math.abs(applied[1] - Math.log(8) / 2) < 1e-12);
  assert.ok(Math.abs(b.sum - SESSION_LOG_CAP) < 1e-12);
  // in a ledger: 30 C0s in one session never apply more than log 50 of evidence; posterior pre-transition ≤ 0.970 from 0.39
  const odds = 0.39 / 0.61 * 50;
  assert.ok(Math.abs(odds / (1 + odds) - 0.9697) < 1e-3);
  const L = fold(L0(), Array.from({ length: 30 }, (_, i) => ev({ episodeId: "same", id: `b${i}`, seq: 100 + i })));
  assert.ok(Math.abs(L.session.skills[SK].budget.sum - SESSION_LOG_CAP) < 1e-12);
});

test("rule 7: one learning transition per item-episode, not per event", () => {
  const one = fold(L0(), [ev({ id: "x1", seq: 1, episodeId: "E" }), ev({ id: "x2", seq: 2, episodeId: "E", cls: "probe.why", outcome: 1, grader: "llm" })]);
  const two = fold(L0(), [ev({ id: "y1", seq: 1, episodeId: "E" }), ev({ id: "y2", seq: 2, episodeId: "F", cls: "probe.why", outcome: 1, grader: "llm" })]);
  assert.ok(two.skills[SK].pL > one.skills[SK].pL, "a second episode adds a transition");
  assert.deepEqual(one.session.skills[SK].episodes, ["E"]);
});

test("teach-only episodes: transition only, capped at +0.10 per episode", () => {
  assert.ok(Math.abs(teachStep(0.1, 0.5) - 0.2) < 1e-12);
  assert.equal(teachStep(0.1, 0.5, TEACH_CAP), 0.1);
  const L = fold(L0(), [ev({ teach: true, id: "t1", seq: 1, episodeId: "T" }), ev({ teach: true, id: "t2", seq: 2, episodeId: "T" })]);
  const sk = L.skills[SK];
  assert.equal(sk.display, "introduced");
  assert.equal(sk.n, 0);
  assert.ok(sk.pL - sk.prior.pL0 <= TEACH_CAP + 1e-12 && sk.pL > sk.prior.pL0);
});

test("IDK is weak negative evidence, never a failure-sized drop; C4 is", () => {
  const idk = fold(L0(), [ev({ outcome: 5 })]).skills[SK];
  const c4 = fold(L0(), [ev({ outcome: 4 })]).skills[SK];
  assert.ok(idk.pL > c4.pL);
  assert.ok(idk.pL < idk.prior.pL0 + 0.12);
});

test("rule 4 tempering: assisted, gaming and controllerEasy successes count for less", () => {
  const plain = fold(L0(), [ev()]).skills[SK].pL;
  for (const f of [{ assisted: "parent" }, { gamingWindowKt: true }, { controllerEasy: true }, { kitVerified: false }]) {
    assert.ok(fold(L0(), [ev(f)]).skills[SK].pL < plain, JSON.stringify(f));
  }
});

test("conjunctive items: a failure's blame lands on the weaker skill (kt-algorithms §1.5)", () => {
  const [a, b] = logEvidence({ cls: "item.open", outcome: 4, grader: "code" }, [0.9, 0.5], [1, 1]);
  assert.ok(a > b, "the strong skill loses less");
  const post = (p, l) => 1 / (1 + (1 - p) / p * Math.exp(-l));
  assert.ok(Math.abs(post(0.9, a) - 0.825) < 0.01 && Math.abs(post(0.5, b) - 0.127) < 0.01);
});

test("misconception-graded why updates the misconception layer OR the skill, never both", () => {
  const mis = fold(L0(), [ev({ cls: "probe.why", outcome: 3, grader: "llm", misconceptionId: "m1" })]);
  assert.equal(mis.skills[SK].pL, mis.skills[SK].prior.pL0 + (1 - mis.skills[SK].prior.pL0) * 0.12, "only the transition moved pL");
  assert.equal(mis.mis.m1.hits, 1);
  const sk = fold(L0(), [ev({ cls: "probe.why", outcome: 3, grader: "llm", misconceptionId: "m1", misRoute: "skill" })]);
  assert.equal(sk.mis.m1, undefined);
  assert.ok(sk.skills[SK].pL < mis.skills[SK].pL);
});

test("misconceptions: two hits take 0.15 → 0.89; p ≥ .7 needs verify; resolved only with a scheduled check", async () => {
  const { misP, newMisconception, updateMisconception, misconceptionView } = await import("../server/learner/kt/misconception.js");
  let m = newMisconception("m");
  m = updateMisconception(m, "hit", T0);
  m = updateMisconception(m, "hit", T0);
  assert.ok(Math.abs(misP(m) - 0.89) < 0.01);
  assert.equal(misconceptionView({ m })[0].needsVerify, true);
  for (let i = 0; i < 6 && !m.resolvedAt; i++) m = updateMisconception(m, "discriminating_correct", T0);
  assert.ok(m.resolvedAt && m.checkScheduledAt && misP(m) <= 0.2);
  assert.ok(new Date(m.checkScheduledAt) - new Date(T0) >= 20 * 3600_000);
  assert.equal(misconceptionView({ m }).length, 0);
});

test("cold start: pL0 = (P − g)/(1 − g − s), clamped; example 0.7/0.2/0.1 → 0.714", () => {
  assert.ok(Math.abs(correctedPrior(0.7, 0.2, 0.1) - 0.7142857) < 1e-6);
  assert.equal(correctedPrior(0.1, 0.2, 0.1), 0.02);
  assert.equal(correctedPrior(0.99, 0.2, 0.1), 0.85);
  const L = fold(L0(), [ev()]);
  assert.equal(L.skills[SK].prior.source, "theta");
  assert.ok(L.skills[SK].prior.pL0 >= 0.02 && L.skills[SK].prior.pL0 <= 0.85);
});

test("FSRS: retrievability falls with time, never below 0; memory updates once per skill per session", () => {
  const m = review(null, 3, T0);
  assert.equal(retrievability(m, T0), 1);
  const later = retrievability(m, "2026-10-11T05:00:00Z");
  assert.ok(later < 1 && later > 0);
  const L = fold(L0(), [ev({ id: "f1", seq: 1 }), ev({ id: "f2", seq: 2, outcome: 4 })]);
  assert.equal(L.skills[SK].mem.reps, 1, "the second item in the session does not review again");
  // C0 + a passed transfer in the same episode → grade 4 (higher stability than grade 3)
  const g4 = fold(L0(), [ev({ id: "g1", seq: 1, episodeId: "E" }), ev({ id: "g2", seq: 2, episodeId: "E", cls: "probe.transfer.near", outcome: 0 })]);
  assert.ok(g4.skills[SK].mem.S > L.skills[SK].mem.S);
});

test("retention = pL × R, read at any time; absence never lowers display", async () => {
  const { readSkill } = await import("../server/learner/kt/ledger.js");
  const L = fold(L0(), [ev()]);
  const sk = L.skills[SK];
  const far = readSkill(sk, "2027-10-01T00:00:00Z");
  assert.equal(far.display, sk.display);
  assert.equal(far.pL, sk.pL);
  assert.ok(far.retention < sk.retention);
});

test("malformed events throw (never silent evidence)", () => {
  assert.throws(() => fold(L0(), [ev({ skillIds: [] })]));
  assert.throws(() => fold(L0(), [ev({ cls: "item.nope" })]));
  assert.throws(() => fold(L0(), [ev({ outcome: 99 })]));
  const L = fold(L0(), [ev({ id: "late", seq: 50 })]);
  assert.throws(() => fold(L, [ev({ id: "older", seq: 10 })]), /re-fold/);
});
