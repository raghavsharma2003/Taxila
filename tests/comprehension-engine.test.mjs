// Comprehension engine: facet fusion, the state ladder and the CE invariants (COMPREHENSION-ENGINE.md §2, §9 CEI1-CEI6).
import { test } from "node:test";
import assert from "node:assert/strict";
import { newLearnerState, fuseEvidence, stateDigest, compDigest } from "../server/comprehension/fuse.js";
import { beliefFor, ladder } from "../server/comprehension/state.js";
import { facetWeight, applyFacetEvent, newFacet } from "../server/comprehension/facets.js";
import { lintShapes, SHAPES } from "../server/comprehension/probes/shapes.js";
import { gatedEmission } from "../server/learner/kt/bktr.js";
import { EMISSIONS, OUTCOMES } from "../server/learner/kt/outcomes.js";
import { readFileSync } from "fs";

const SK = "c5-maths-ch01-t01-s1";
const T0 = "2026-10-01T05:00:00.000Z", T1 = "2026-10-02T06:00:00.000Z", T9 = "2026-10-10T06:00:00.000Z";
let n = 0;
const ev = (o = {}) => ({ id: `e${++n}`, seq: n, sessionId: "s1", sessionStartAt: T0, at: T0, episodeId: `ep${n}`, skillIds: [SK], itemKey: "k",
  cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o });
const fresh = () => newLearnerState({ childId: "c", classLevel: 5 });
const run = (evs) => evs.reduce((s, e) => fuseEvidence(s, [e]), fresh());
const b = (s, now = T0) => beliefFor(SK, { ...s, now });

function understanderLog() {
  return [ev({ teach: true }), ev(), ev(), ev({ cls: "probe.why", outcome: 0, grader: "llm", spanOk: true, shapeId: "C03" }),
    ev({ cls: "probe.errorspot", outcome: 0, shapeId: "C07" }), ev({ cls: "probe.transfer.near", outcome: 0, shapeId: "C20" }),
    ev({ sessionId: "s2", sessionStartAt: T1, at: T1, shapeId: "C31", via: "callback" }),
    ev({ sessionId: "s2", sessionStartAt: T1, at: T1, cls: "probe.transfer.far", outcome: 0, shapeId: "C18" })];
}

test("shape registry: 36 shapes, each names a kit input, a closed class and an operator", () => {
  assert.equal(SHAPES.length, 36);
  assert.deepEqual(lintShapes(), []);
});

test("worked trajectory (spec §2.6): the understander reaches understood only after a delayed check + far transfer", () => {
  const s = run(understanderLog());
  const x = b(s, T1);
  assert.equal(x.state, "understood");
  assert.ok(Math.abs(x.U - 0.795) < 0.01, `U ${x.U}`);
  assert.ok(Math.abs(x.T - 0.920) < 0.01, `T ${x.T}`);
});

test("the correct-answer trap stays shallow where a K-only rule would certify", () => {
  const s = run([ev({ teach: true }), ev(), ev(), ev(), ev({ cls: "probe.why", outcome: 2, grader: "llm" }),
    ev({ cls: "probe.predict", outcome: 1 }), ev({ sessionId: "s2", sessionStartAt: T1, at: T1 })]);
  const x = b(s, T1);
  assert.ok(x.pL > 0.95, "K is high");
  assert.equal(x.state, "shallow");
  assert.ok(x.U < 0.1);
});

test("replay = online fold under any arrival order, re-delivery included (TP1-TP2 with comp)", () => {
  const log = understanderLog();
  const online = run(log);
  const shuffled = fuseEvidence(fresh(), [...log].reverse());
  const redelivered = fuseEvidence(fuseEvidence(fresh(), log.slice(0, 5)), log);
  assert.equal(stateDigest(shuffled), stateDigest(online));
  assert.equal(stateDigest(redelivered), stateDigest(online));
});

test("E2: a dropped event (safety, low ASR, contaminated, NA) changes no byte of U, T or K", () => {
  const base = understanderLog().slice(0, 4);
  const s0 = run(base);
  for (const extra of [{ safetyFired: true }, { asrConf: 0.3 }, { contaminated: true }, { cls: "item.open", outcome: 6 }]) {
    const s1 = fuseEvidence(s0, [ev({ cls: "probe.why", outcome: 0, grader: "llm", spanOk: true, ...extra })]);
    assert.equal(compDigest(s1.comp), compDigest(s0.comp), JSON.stringify(extra));
  }
});

test("CEI4: no positive U/T update from a coincident correct, a partial, or a span-less LLM positive", () => {
  for (const o of [{ cls: "probe.predict", outcome: 0, coincident: true }, { cls: "probe.why", outcome: 1, grader: "llm" },
    { cls: "probe.teachback", outcome: 1, grader: "llm" }, { cls: "probe.why", outcome: 0, grader: "llm", spanOk: false }]) {
    assert.equal(facetWeight(ev(o)), 0, JSON.stringify(o));
  }
  // a coincident WRONG answer still updates
  assert.ok(facetWeight(ev({ cls: "probe.predict", outcome: 1, coincident: true })) > 0);
});

test("LR(best) ≥ 1 for every facet class at every retrievability (symmetric gate)", () => {
  for (const cls of ["probe.why", "probe.teachback", "probe.errorspot", "probe.predict", "probe.transfer.near", "probe.transfer.far"]) {
    for (const R of [0, 0.3, 0.7, 1]) {
      for (const grader of ["code", "llm"]) {
        const { kR, u } = gatedEmission({ cls, outcome: 0, grader }, R);
        assert.ok(kR / u >= 1 - 1e-12, `${cls} ${grader} R=${R}`);
      }
    }
  }
});

test("session cap ±log 20: one session can move U from 0.2 to at most ~0.83", () => {
  let f = newFacet(0.2);
  for (let i = 0; i < 12; i++) f = applyFacetEvent(f, ev({ cls: i % 2 ? "probe.errorspot" : "probe.why", outcome: 0, spanOk: true }), 1);
  assert.ok(f.p <= 0.84, `U ${f.p}`);
});

test("E4 / CEI3: game-only evidence can never certify understood", () => {
  const evs = [ev({ teach: true }), ev(), ev()];
  for (let i = 0; i < 10; i++) evs.push(ev({ cls: "probe.predict", outcome: 0, via: "game", shapeId: "C35" }));
  for (let i = 0; i < 4; i++) evs.push(ev({ cls: "probe.transfer.far", outcome: 0, via: "game" }));
  evs.push(ev({ sessionId: "s2", sessionStartAt: T1, at: T1 }));
  for (let i = 0; i < 10; i++) evs.push(ev({ sessionId: "s2", sessionStartAt: T1, at: T1, cls: "probe.predict", outcome: 0, via: "game" }));
  for (let i = 0; i < 4; i++) evs.push(ev({ sessionId: "s2", sessionStartAt: T1, at: T1, cls: "probe.transfer.far", outcome: 0, via: "game" }));
  const x = b(run(evs), T1);
  assert.notEqual(x.state, "understood");
  assert.notEqual(x.state, "durable");
});

test("CEI2: the ladder never sits above the ledger display", () => {
  for (const display of ["unseen", "introduced", "practising", "learned_today"]) {
    const { state } = ladder({ display, pL: 0.99, recent: [1, 1, 1], delayedMisses: 0, U: 0.99, T: 0.99, nonGameU: true, nonGameT: true, mStar: 0, verified: false, longDelayPos: true });
    assert.ok(state !== "understood" && state !== "durable", display);
  }
  const { state } = ladder({ display: "mastered", pL: 0.99, recent: [1, 1, 1], delayedMisses: 0, U: 0.99, T: 0.99, nonGameU: true, nonGameT: true, mStar: 0, verified: false, longDelayPos: true });
  assert.equal(state, "understood", "durable needs the ledger's durable");
});

test("CEI6: absence never lowers a state (reading the same fold later can only raise refresh)", () => {
  const s = run(understanderLog());
  const now = b(s, T1), later = b(s, T9), muchLater = b(s, "2027-03-01T06:00:00.000Z");
  const order = ["not_yet", "shallow", "fragile", "understood", "durable"];
  assert.ok(order.indexOf(later.state) >= order.indexOf(now.state));
  assert.ok(order.indexOf(muchLater.state) >= order.indexOf(now.state));
  assert.equal(muchLater.refresh, true);
});

test("CEI1 / CE-M7: permuting voice, vibe and timing fields leaves the fold byte-identical", () => {
  const log = understanderLog();
  const noisy = log.map((e, i) => ({ ...e, at: new Date(new Date(e.at).getTime() + i * 7919).toISOString(), onsetMs: 300 + i * 97, pauseZ: (i % 3) - 1,
    f0Slope: i * 0.1, vibe: { humour: i % 2 ? "light" : "off" }, engagement: i % 2 ? "strained" : "ok", followUpProbe: !!(i % 2) }));
  assert.equal(stateDigest(run(noisy)), stateDigest(run(log)));
});

test("misconception: p ≥ 0.85 verified by a second family → not_yet; one family alone stays shallow (checking)", () => {
  const mis = "c5-maths-ch01-t01-m-zero-placeholder";
  const base = [ev({ teach: true }), ev(), ev(), ev({ cls: "probe.why", outcome: 0, grader: "llm", spanOk: true })];
  const one = run([...base, ev({ cls: "item.mcq3", outcome: 1, misconceptionId: mis, shapeId: "C11" }), ev({ cls: "item.mcq3", outcome: 1, misconceptionId: mis, shapeId: "C11" })]);
  const xb = b(one);
  assert.equal(xb.misconception.verified, false);
  const two = run([...base, ev({ cls: "item.mcq3", outcome: 1, misconceptionId: mis, shapeId: "C11" }), ev({ cls: "probe.predict", outcome: 1, misconceptionId: mis, shapeId: "C16" })]);
  const x = b(two);
  assert.equal(x.misconception.verified, true);
  assert.ok(x.misconception.mStar >= 0.85);
  assert.equal(x.state, "not_yet");
});

test("teaching transition lifts a low facet by ≤ 0.10 per episode and never certifies", () => {
  const s = run([ev({ teach: true }), ev(), ev({ cls: "probe.why", outcome: 2, grader: "llm" }), ev({ teach: true }), ev({ teach: true, episodeId: "same" }), ev({ teach: true, episodeId: "same" })]);
  const c = s.comp.skills[SK];
  assert.ok(c.U.p < 0.4);
  for (const g of Object.values(c.U.teachGain)) assert.ok(g <= 0.10 + 1e-12);
});

test("NM-3 schema scan: no latency, pause, prosody, affect, mood, engagement, trust, vibe or free-text column in 007", () => {
  const sql = readFileSync(new URL("../db/migrations/007_comprehension.sql", import.meta.url), "utf8").replace(/--.*$/gm, "");
  const cols = [...sql.matchAll(/^\s+([a-z_]+)\s+(?:text|uuid|int|bigint|double|boolean|jsonb|timestamptz|smallint)/gm)].map((m) => m[1]);
  assert.ok(cols.length > 30);
  const BANNED = /latency|pause|prosody|affect|mood|engag|trust|vibe|emotion|asr_conf|timing|onset|dwell|note|transcript|free_text|said_text/;
  assert.deepEqual(cols.filter((c) => BANNED.test(c)), []);
  assert.ok(!/arm_posteriors \([^;]*child_id/s.test(sql), "arm_posteriors carries no child id");
});

test("every outcome of every facet class has an emission (no silent NA inside the fold)", () => {
  for (const cls of ["probe.why", "probe.teachback", "probe.errorspot", "probe.predict", "probe.transfer.near", "probe.transfer.far"]) {
    assert.equal(EMISSIONS[cls].k.length, OUTCOMES[cls].length);
  }
});
