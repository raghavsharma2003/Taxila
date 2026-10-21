// Deep-kind audit (2026-10-15, docs/research/kits/DEEP-KIND-AUDIT.md): a deep-tagged kit item marked `deep: false` keeps its
// kind, key, classifier target and pose, but its answer is plain evidence: item.open (no U / T facet, no generative pass) and
// never the deep right answer agent.js earnedRead needs. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeKit } from "../server/content/kits.js";
import { evidenceFrom } from "../server/director/state.js";
import { probeFor, evidenceProbeFor, plainEvidence } from "../server/director/items.js";
import { answerEvents } from "../server/learner/live.js";
import { earnedRead, applyAgentTurn } from "../server/agent/agent.js";
import { offeredItems } from "../server/agent/prompt.js";
import { posteriorOf, evidenceRead } from "../server/agent/read.js";
import { targetFor } from "../server/director/classify.js";
import { RAW_KIT, CTX, cls } from "./fixtures/kit.mjs";

const kitWith = (marks) => { const raw = structuredClone(RAW_KIT); for (const it of raw.items) if (it.id in marks) it.deep = marks[it.id]; return normalizeKit(raw, { topicId: raw.topicId, verified: true }); };
const S = (activeItemId, over = {}) => ({ phase: "practice", activeItemId, hintLevel: 0, skills: {}, ctx: { ...CTX }, ...over });

test("the loader keeps deep: false and nothing else; kind, key and target are untouched", () => {
  const K = kitWith({ i6: false, i4: "no", i5: true });
  const i6 = K.items.find((i) => i.id === "i6");
  assert.equal(i6.deep, false); assert.equal(i6.kind, "error_spot"); assert.equal(i6.answer, "1/3 is bigger");
  assert.equal(K.items.find((i) => i.id === "i4").deep, undefined, "a non-false value is dropped");
  assert.equal(K.items.find((i) => i.id === "i5").deep, undefined);
  const plain = kitWith({}), t0 = targetFor(S("i5"), plain, plain.items.find((i) => i.id === "i5"));
  const K5 = kitWith({ i5: false }), t1 = targetFor(S("i5"), K5, K5.items.find((i) => i.id === "i5"));
  assert.deepEqual({ ...t1, item: undefined }, { ...t0, item: undefined }, "the classifier target (open grading of a why) is unchanged");
  assert.equal(probeFor(i6), "P6", "what is ASKED (the pose's probe) is unchanged");
  assert.equal(evidenceProbeFor(i6), "P15"); assert.ok(plainEvidence(i6));
});

test("evidence: a deep: false error_spot / why answer is P15; the unmarked one keeps its probe; no volunteered why on a why item", () => {
  const K0 = kitWith({}), K1 = kitWith({ i6: false, i5: false });
  assert.equal(evidenceFrom(S("i6"), cls("correct"), K0)[0].probe, "P6");
  assert.equal(evidenceFrom(S("i6"), cls("correct"), K1)[0].probe, "P15");
  const withReason = { ...cls("correct"), reason: "right" };
  assert.deepEqual(evidenceFrom(S("i5"), withReason, K0).map((e) => e.probe), ["P2"]);
  assert.deepEqual(evidenceFrom(S("i5"), withReason, K1).map((e) => e.probe), ["P15"], "the why item's answer is its reason: not a second probe.why");
  assert.deepEqual(evidenceFrom(S("i6"), withReason, K1).map((e) => e.probe), ["P15", "P2"], "a reason volunteered on another kind still counts");
  assert.deepEqual(evidenceFrom(S("i6", { pendingWhy: "i6" }), cls("correct"), K1).map((e) => e.probe), ["P2"], "the teacher's own why follow-up stays a why");
});

test("the KT event: item.open by the ladder, not probe.errorspot / probe.why (U facet, generative pass)", () => {
  for (const [K, want] of [[kitWith({}), "probe.errorspot"], [kitWith({ i6: false }), "item.open"]]) {
    const item = K.items.find((i) => i.id === "i6");
    const s = S("i6");
    const evidence = evidenceFrom(s, cls("correct"), K);
    const a = answerEvents({ lessonId: "11111111-1111-1111-1111-111111111111", startedAt: 0, now: 1000, childSeq: 1, evidence, cls: { ...cls("correct"), source: "exact" }, prev: s, kit: K, activeItem: item });
    assert.equal(a.events[0].cls, want);
  }
  const K5 = kitWith({ i5: false }), s5 = S("i5");
  const a5 = answerEvents({ lessonId: "11111111-1111-1111-1111-111111111111", startedAt: 0, now: 1000, childSeq: 1, evidence: evidenceFrom(s5, cls("correct"), K5), cls: { ...cls("correct"), source: "exact" }, prev: s5, kit: K5, activeItem: K5.items.find((i) => i.id === "i5") });
  assert.equal(a5.deferred.length, 0); assert.equal(a5.events[0].cls, "item.open");
});

test("agent lane: a plain right answer on a deep-tagged item is not the deep evidence understood needs", () => {
  const C = (item, kind = "practice", g = "correct", plain) => ({ item, kind, g, ...(plain ? { plain: true } : {}) });
  // the evidence read (read.js): a plain-marked error_spot weighs exactly as a practice item
  assert.deepEqual(posteriorOf([C("i6", "error_spot", "correct", true)]), posteriorOf([C("i1")]));
  assert.notDeepEqual(posteriorOf([C("i6", "error_spot")]), posteriorOf([C("i1")]));
  // one practice right + one error_spot right clears the 0.8 bar; the same answers with the error_spot marked plain do not
  assert.equal(evidenceRead([C("i7"), C("i6", "error_spot")], { bar: 0.8 }), "understood");
  assert.equal(evidenceRead([C("i7"), C("i6", "error_spot", "correct", true)], { bar: 0.8 }), "partly");
  // the earned rule (no graded answer yet / the model's claim): a plain entry is not the deep right answer
  assert.equal(earnedRead("understood", [C("i1"), C("i6", "error_spot")]), "understood");
  assert.equal(earnedRead("understood", [C("i1"), C("i6", "error_spot", "correct", true)]), "partly");
  // applyAgentTurn records the mark on the graded entry, so every reader of `graded` sees it
  const K = kitWith({ i6: false }), card = K.items.find((i) => i.id === "i6");
  const mk = () => ({ phase: "practice", ctx: { ...CTX, classLevel: 4 }, itemsDone: [], skipped: [], agent: { learner: { [card.skillId]: { graded: [{ item: "i7", kind: "practice", g: "correct" }] } } } });
  const out = { say: "Shabash.", intent: "practice", item: null, read: null, usage: { usd: 0, tokens: 0 }, ms: 1, notes: [] };
  const n1 = mk(); applyAgentTurn(n1, out, { kit: K, childText: "1/3", cls: cls("correct"), card, lessonId: "L1" });
  assert.equal(n1.agent.learner[card.skillId].graded.at(-1).plain, true);
  assert.equal(n1.agent.learner[card.skillId].read, "partly");
  assert.equal(n1.agent.learner[card.skillId].depth, "untested", "right only on plain evidence: untested, as for plain items");
  const K0 = kitWith({}), card0 = K0.items.find((i) => i.id === "i6");
  const n0 = mk(); applyAgentTurn(n0, out, { kit: K0, childText: "1/3", cls: cls("correct"), card: card0, lessonId: "L1" });
  assert.equal(n0.agent.learner[card0.skillId].read, "understood", "unmarked: the deep item still counts as deep");
});

test("offered items: a skill that needs deep evidence is not narrowed to a deep: false item", () => {
  const K = kitWith({ i3: false, i4: false, i6: false });
  const st = { turn: 3, phase: "practice", ctx: { ...CTX, classLevel: 4 }, itemsDone: ["i7"], skipped: [], agent: { skill: "c4-maths-ch05-t01-s2", learner: { "c4-maths-ch05-t01-s2": { graded: [{ item: "i7", kind: "practice", g: "correct" }] } } } };
  const s2 = offeredItems(st, K, 20).filter((i) => i.skillId === "c4-maths-ch05-t01-s2").map((i) => i.id);
  assert.deepEqual(s2, ["i5"], "only the real deep item (the why) while it is left");
  const K2 = kitWith({ i3: false, i4: false, i5: false, i6: false });
  const s2b = offeredItems(st, K2, 20).filter((i) => i.skillId === "c4-maths-ch05-t01-s2").map((i) => i.id).sort();
  assert.deepEqual(s2b, ["i3", "i4", "i5", "i6"], "no real deep item left: nothing is narrowed");
});
