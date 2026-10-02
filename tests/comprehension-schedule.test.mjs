// Probe scheduler, test-load budget and weave queue (COMPREHENSION-ENGINE.md §3; B-ENG BE1/BE2, CEI5, CEI7, CEI8).
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextProbe, noteOutcome, markAsked, openSession, eig } from "../server/comprehension/schedule.js";
import { newProbeSession, recordTurn, sessionWeight, windowWeight, lexiconHit } from "../server/comprehension/budget.js";
import { BAND_BUDGET } from "../server/comprehension/params.js";
import { enqueue, onTopicPlanned, expire, planChecks, wovenEvent } from "../server/comprehension/weave.js";
import { shapeById } from "../server/comprehension/probes/shapes.js";

const KIT = ["expectations", "misconceptions", "characterView", "myth", "diagnostic", "items", "counterfactual", "solver", "instances", "interestContexts", "representations", "weaveHosts"];
const belief = (o = {}) => ({ skillId: "s1", state: "shallow", display: "practising", pL: 0.9, retention: 0.9, U: 0.2, T: 0.2, open: ["U", "T"], misconception: { mStar: 0, verified: false }, ...o });
const skills = (o) => ({ s1: { belief: belief(o), topicType: "T3", kitInputs: KIT } });
function warm(band = "B3", turns = 4) {
  let s = newProbeSession({ sessionId: "x", band, targets: ["s1"] });
  for (let i = 0; i < turns; i++) s = recordTurn(s, { kind: "teach", skillId: "s1" });
  return s;
}

test("no optional probe in the first 3 child turns, never two probe turns in a row", () => {
  let s = newProbeSession({ sessionId: "x", band: "B3", targets: ["s1"] });
  s = recordTurn(s, { kind: "teach" });
  assert.equal(nextProbe(skills(), s), null);
  s = warm();
  const p = nextProbe(skills(), s);
  assert.ok(p && !p.mandatory);
  s = recordTurn(markAsked(s, p, belief()), { kind: "probe", ...p, weight: p.testWeight });
  assert.equal(nextProbe(skills(), s), null, "back-to-back");
});

test("planted-error shapes never before learned_today; novices get only A, D16, G, I", () => {
  const s = warm();
  for (const display of ["introduced", "practising"]) {
    for (let i = 0; i < 20; i++) {
      const p = nextProbe(skills({ display }), { ...s, opp: i });
      if (!p) continue;
      assert.ok(!shapeById(p.shapeId).planted, `${display} got ${p.shapeId}`);
      if (display === "introduced") assert.ok(shapeById(p.shapeId).novice, `novice got ${p.shapeId}`);
    }
  }
});

test("the session and per-10-turn caps hold for every band, however many turns the scheduler is asked", () => {
  for (const band of ["B1", "B2", "B3", "B4"]) {
    let s = warm(band);
    let b = belief({ display: "learned_today" });
    for (let t = 0; t < 80; t++) {
      const p = nextProbe({ s1: { belief: b, topicType: "T3", kitInputs: KIT }, s2: { belief: { ...b, skillId: "s2" }, topicType: "T3", kitInputs: KIT } }, s);
      if (p) { s = recordTurn(markAsked(s, p, b), { kind: "probe", ...p, weight: p.testWeight }); }
      else s = recordTurn(s, { kind: "teach" });
      assert.ok(windowWeight(s, 10) <= BAND_BUDGET[band].window10 + 1e-9, `${band} window`);
    }
    assert.ok(sessionWeight(s) <= BAND_BUDGET[band].session + 1e-9, `${band} session`);
  }
});

test("≤ 2 U probes per concept per session, from different families; B1 ≤ 1", () => {
  for (const band of ["B1", "B3"]) {
    let s = warm(band);
    const fams = [];
    for (let t = 0; t < 40; t++) {
      const p = nextProbe(skills({ display: "learned_today" }), s);
      if (p && p.facet === "U") fams.push(p.family);
      s = p ? recordTurn(markAsked(s, p, belief()), { kind: "probe", ...p, weight: p.testWeight }) : recordTurn(s, { kind: "teach" });
    }
    assert.ok(fams.length <= (band === "B1" ? 1 : 2), `${band} ${fams}`);
    assert.equal(new Set(fams).size, fams.length);
  }
});

test("stop rule: a facet reading high is not probed; a low one gets exactly one probe per session", () => {
  let s = warm();
  const hi = nextProbe(skills({ U: 0.8, T: 0.75 }), s);
  assert.equal(hi, null);
  let asked = 0;
  for (let t = 0; t < 30; t++) {
    const p = nextProbe(skills({ U: 0.05, T: 0.9 }), s);
    if (p) { asked++; s = recordTurn(markAsked(s, p, belief({ U: 0.05 })), { kind: "probe", ...p, weight: p.testWeight }); }
    else s = recordTurn(s, { kind: "teach" });
  }
  assert.equal(asked, 1);
});

test("BE2: strain defers optional probes but never a mandatory one", () => {
  let s = warm();
  s = noteOutcome(s, { cls: "item.open", outcome: 0, skillIds: ["s1"] }, belief({ display: "practising" }));
  const strained = { ...s, engagement: "strained" };
  const m = nextProbe(skills(), strained);
  assert.ok(m?.mandatory && m.reason === "verify_first_correct");
  const after = recordTurn(markAsked(strained, m, belief()), { kind: "probe", ...m, weight: m.testWeight });
  const next = recordTurn(after, { kind: "teach" });
  assert.equal(nextProbe(skills(), next), null, "optional probes deferred under strain");
});

test("mandatory order: delayed check > misconception verify > coincident why > first-correct why; verify avoids the detector family", () => {
  let s = openSession(warm(), ["s1"]);
  s = noteOutcome(s, { cls: "item.mcq3", outcome: 1, skillIds: ["s1"], misconceptionId: "m1", shapeId: "C11" }, belief({ display: "learned_today", misconception: { mStar: 0.75, verified: false, mId: "m1" } }));
  const sk = { s1: { belief: belief({ display: "learned_today" }), topicType: "T3", kitInputs: KIT, delayDays: 1 } };
  const a = nextProbe(sk, s);
  assert.equal(a.reason, "delayed_check");
  s = recordTurn(markAsked(s, a, belief()), { kind: "probe", ...a, weight: a.testWeight });
  s = recordTurn(s, { kind: "teach" });
  const v = nextProbe(sk, s);
  assert.equal(v.reason, "verify_misconception");
  assert.notEqual(v.family, "B");
});

test("voice followUpProbe can only move an eligible probe one slot earlier, never add one beyond the caps", () => {
  let s = warm();
  const p = nextProbe(skills(), s);
  s = recordTurn(markAsked(s, p, belief()), { kind: "probe", ...p, weight: p.testWeight });
  s = recordTurn(s, { kind: "item", skillId: "s1" });
  assert.equal(nextProbe(skills(), s), null, "gap of 2 not met");
  const early = nextProbe(skills(), s, { currentSkill: "s1", voice: { followUpProbe: true } });
  assert.ok(early, "voice moved it one slot earlier");
  // at the cap, voice adds nothing
  const full = { ...s, weights: [...s.weights, ...Array(40).fill(0)], band: "B1", childTurns: 60 };
  full.weights = Array(60).fill(0.1);
  assert.equal(nextProbe(skills(), full, { currentSkill: "s1", voice: { followUpProbe: true } }), null);
});

test("EIG is positive for an open facet and vanishes as the facet saturates; code-graded beats LLM", () => {
  assert.ok(eig(0.5, "probe.errorspot", "code") > eig(0.5, "probe.why", "llm"));
  assert.ok(eig(0.5, "probe.why", "llm") > eig(0.99, "probe.why", "llm"));
});

test("CEI7: test lexicon is caught in EN, Roman Hindi and Devanagari, with word boundaries", () => {
  for (const s of ["Samjha?", "did you understand this", "quick quiz time", "ek test karte hain", "यह परीक्षा है"]) assert.ok(lexiconHit(s), s);
  for (const s of ["the latest contest", "attest", "Let's predict what happens"]) assert.equal(lexiconHit(s), null, s);
});

test("weave: hosted only 2-3 topics later and ≥ 20 h after the anchor; one sub-step per topic; expiry → callback opener", () => {
  let q = enqueue([], { childId: "c", skillId: "a", anchorAt: "2026-10-01T05:00:00Z", hostCandidates: ["h1", "h2"] });
  q = enqueue(q, { childId: "c", skillId: "b", anchorAt: "2026-10-01T05:00:00Z", hostCandidates: ["h2"] });
  q = enqueue(q, { childId: "c", skillId: "a", anchorAt: "2026-10-01T05:00:00Z", hostCandidates: ["h1"] });
  assert.equal(q.length, 2, "idempotent while open");
  let r = onTopicPlanned(q, ["h2"], "2026-10-01T09:00:00Z");
  assert.equal(r.hosted.length, 0, "1 topic later");
  r = onTopicPlanned(r.q, ["h2"], "2026-10-01T10:00:00Z");
  assert.equal(r.hosted.length, 0, "< 20 h");
  r = onTopicPlanned(r.q, ["h2"], "2026-10-02T06:00:00Z");
  assert.equal(r.hosted.length, 1, "one per topic");
  const late = expire(r.q, "2026-10-09T06:00:00Z");
  const plan = planChecks({ q: late, due: [], now: "2026-10-09T06:00:00Z", openers: 3 });
  assert.equal(plan.openers.length, 1);
});

test("CEI5: a woven sub-step emits exactly one event on the earlier skill (item.open or transfer.near, never both)", () => {
  const base = { id: "w1", sessionId: "s", episodeId: "e", at: "2026-10-02T06:00:00Z", itemKey: "k", graderVersion: "g" };
  const a = wovenEvent(base, { skillId: "a", host: "h", correct: true });
  const b = wovenEvent(base, { skillId: "a", host: "h", hostNovel: true, correct: false });
  assert.deepEqual([a.cls, b.cls], ["item.open", "probe.transfer.near"]);
  assert.deepEqual(a.skillIds, ["a"]);
  assert.equal(a.via, "weave");
});
