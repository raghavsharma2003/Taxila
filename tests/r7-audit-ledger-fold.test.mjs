// r7 audit LEARN-25 and LEARN-28 (params kt-r3). 25: fuseEvidence copied the whole ledger per event (quadratic in the
// child's history: 10 s at 8,000 events); it now folds a batch through one copy. 28: a second open lesson reset every
// per-lesson evidence cap of the first; earlier lessons' budgets are now kept by lesson id. Pure, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fold, newLedger, openFold } from "../server/learner/kt/ledger.js";
import { fuseEvidence, newLearnerState } from "../server/comprehension/fuse.js";

const S = "c5-maths-ch02-t01-s1", T0 = Date.UTC(2026, 10, 2, 11, 0);
let n = 0;
const ev = (sid, o = {}) => ({ id: `${sid}:${++n}:0`, seq: n, sessionId: sid, sessionStartAt: new Date(T0).toISOString(), at: new Date(T0 + n * 1000).toISOString(),
  episodeId: `${sid}-ep${n}`, skillIds: [S], target: S, itemKey: `k${n}`, cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o });

test("LEARN-25: fusing 4,000 events is roughly linear (one ledger copy per batch)", () => {
  n = 0;
  const evs = Array.from({ length: 4000 }, (_, i) => ev(`L${Math.floor(i / 40)}`, { outcome: i % 3 ? 0 : 4, skillIds: [`c5-maths-ch02-t01-s${1 + (i % 3)}`], target: `c5-maths-ch02-t01-s${1 + (i % 3)}` }));
  const t = Date.now();
  const out = fuseEvidence(newLearnerState({ childId: "c", classLevel: 5 }), evs);
  const ms = Date.now() - t;
  assert.equal(Object.keys(out.ledger.seen).length, 4000);
  assert.ok(ms < 1500, `4,000 events took ${ms} ms (it was ~2 s before; 8,000 took ~10 s)`);
});

test("LEARN-25: the batch fold equals folding one event at a time, and never mutates its input", () => {
  n = 0;
  const evs = Array.from({ length: 30 }, (_, i) => ev(`L${Math.floor(i / 10)}`, { outcome: i % 4 ? 0 : 4 }));
  const L0 = newLedger({ childId: "c", classLevel: 5 });
  const frozen = JSON.stringify(L0);
  const batch = fold(L0, evs);
  let one = L0; for (const e of evs) one = fold(one, [e]);
  assert.equal(JSON.stringify(batch.skills), JSON.stringify(one.skills));
  assert.equal(JSON.stringify(L0), frozen);
  const f = openFold(L0); f.apply(evs[0]);
  assert.equal(JSON.stringify(L0), frozen, "openFold works on a copy");
});

test("LEARN-28: a second open lesson does not reset the first lesson's budgets", () => {
  n = 0;
  // lesson A: five wrong cards spend A's negative budget; lesson B opens; A's next wrong card must still find A's budget spent
  const a = Array.from({ length: 5 }, () => ev("A", { outcome: 4 }));
  const L1 = fold(newLedger({ childId: "c", classLevel: 5 }), a);
  const spentA = L1.session.skills[S].budget.sum;
  const L2 = fold(L1, [ev("B", { outcome: 0 })]);
  assert.equal(L2.session.sessionId, "B");
  assert.equal(L2.recentSessions.A.skills[S].budget.sum, spentA, "A's budget is kept while B is open");
  const L3 = fold(L2, [ev("A", { outcome: 4 })]);
  assert.equal(L3.session.sessionId, "A");
  assert.ok(L3.session.skills[S].budget.byClass["item.open"] >= 6, "A picks up its own count again (1/j weighting continues)");
});

test("LEARN-29: a right answer after a leak is half evidence on K for choice items and probes too", async () => {
  const { temper } = await import("../server/learner/kt/bktr.js");
  const mcq = { cls: "item.mcq4", outcome: 0, via: "dialogue" };
  assert.equal(temper(mcq), 1);
  assert.equal(temper({ ...mcq, preAttemptHelp: true }), 0.5);
  assert.equal(temper({ cls: "probe.why", outcome: 0, preAttemptHelp: true }), 0.5);
  assert.equal(temper({ ...mcq, outcome: 1, preAttemptHelp: true }), 1, "a wrong answer is not halved");
});

test("LEARN-26: writers outside the turn guard on max(seq) after the lock, retry, and project skill_state", async () => {
  const { readFileSync } = await import("node:fs");
  const W = await import("../server/learner/writer.js");
  const g = W.seqGuardStmt("c1", 41);
  assert.match(g.text, /max\(seq\) from kt_evidence where child_id = \$1\), 0\) = \$2/);
  assert.deepEqual(g.params, ["c1", 41]);
  const before = { skills: { a: { pL: 0.3 }, b: { pL: 0.5 } } }, after = { skills: { a: { pL: 0.4 }, b: { pL: 0.5 } } };
  const st = W.projectionStmts({ id: "c1", legal_mode: "M1" }, before, after, 0, (sk) => ({ skillId: "a", pKnown: sk.pL, status: "practising", attempts: 1, correctUnaided: 0, generativePass: false, delayedPass: false, lastSeen: new Date(0).toISOString() }));
  assert.equal(st.length, 1, "only the changed skill");
  for (const f of ["server/placement/kt.js", "server/comprehension/later.js"]) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
    assert.match(src, /W\.seqGuardStmt\(child\.id, live\.maxSeq\)/, f);
    assert.match(src, /GUARD_FAILED && attempt < W\.FOLD_RETRIES/, f);
    assert.match(src, /W\.projectionStmts\(/, f);
    assert.match(src, /out\[i \+ 3\]/, f);
  }
});
