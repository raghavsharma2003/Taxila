// knows.js (round 8, dc-r8-one-reader-with-because): K1-K8 from concrete simulated child states, and the predicate that a
// walk never departs from the script without a because record.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  planFor, compressOf, beatsFor, afterCompressCheck, firstCardOf, easiestUnseen, ladderFor, checkOrderOf, checksOf, remedyNow,
  prereqCheckOf, slotFor, hookOf, topicFor, defaultWalk, expectedWalk, assertWalkExplained, NEAR, checkCardId, askCardId, defaultBeats,
} from "../server/director/knows.js";
import { TILE_IDS, INTEREST_IDS } from "../shared/interests.js";
import { scriptCheckItem, scriptAskItem } from "../server/director/script.js";
import { script, kit, SKILL_A as A, SKILL_B as B, MIS_X, MIS_Y, MIS_Z, TOPIC } from "./fixtures/knows/mini.mjs";

const NOW = Date.parse("2026-11-10T10:00:00+05:30");
const skA = script.skills[0], skB = script.skills[1];
const learned = (extra = {}) => ({ status: "mastered", delayedPassed: true, ...extra });

test("card ids are the walk's own (script.js scriptCheckItem / scriptAskItem)", () => {
  assert.equal(checkCardId(A, "c1"), scriptCheckItem(A, skA.checks[0]).id);
  assert.equal(askCardId(A, "e1"), scriptAskItem(A, "e1", skA.explain[0].ask).id);
});

test("no history: the script's default, empty because", () => {
  const p = planFor({ script, kit, now: NOW });
  assert.deepEqual(p, { topicId: TOPIC, allKnown: false, opener: "standard_retrieval", hookSlot: null, compress: [], firstCard: null, checkOrder: {}, ladderOrder: {}, prereqCheck: null, because: [] });
  assert.deepEqual(beatsFor(p, skA, { hook: true }), defaultBeats(skA, { hook: true }));
  assert.deepEqual(ladderFor(p, skA), [`${TOPIC}-i03`, `${TOPIC}-i01`]);
});

test("K1: learned with a passed delayed check opens at the first check; others are walked in full", () => {
  for (const status of ["learned_today", "mastered", "durable", "due"]) assert.deepEqual(compressOf({ script, kit, skills: { [A]: { status, delayedPassed: true } } }).compress, [A], status);
  assert.deepEqual(compressOf({ script, kit, skills: { [A]: { status: "mastered", delayedPassed: false } } }).compress, [], "no delayed pass");
  assert.deepEqual(compressOf({ script, kit, skills: { [A]: { status: "practising", delayedPassed: true } } }).compress, [], "not learned");
  assert.deepEqual(compressOf({ script, kit, skills: { [A]: { status: "mastered" } } }).compress, [], "delayed check unknown");
  const p = planFor({ script, kit, skills: { [A]: learned() }, now: NOW });
  assert.deepEqual(beatsFor(p, skA, { hook: true }), ["check:c1"]);
  assert.deepEqual(beatsFor(p, skB), defaultBeats(skB));
  const r = p.because.find((b) => b.choice === "compress");
  assert.equal(r.on, A); assert.equal(r.fact.kind, "learned_delayed_check"); assert.equal(r.fact.firstCheck, "c1");
});

test("K1: a right answer moves on; a miss returns to the full unit and the fallback is recorded", () => {
  const p = planFor({ script, kit, skills: { [A]: learned() }, now: NOW });
  assert.deepEqual(afterCompressCheck(p, skA, "right"), { done: true, beats: [], because: null });
  for (const v of ["wrong", "stuck"]) {
    const r = afterCompressCheck(p, skA, v);
    assert.equal(r.done, false);
    assert.deepEqual(r.beats, ["explain:e1", "explain:e2", "worked", "check:c2"]);
    assert.equal(r.because.choice, "compress_fallback"); assert.equal(r.because.fact.cardId, checkCardId(A, "c1")); assert.equal(r.because.fact.verdict, v);
  }
  assert.deepEqual(afterCompressCheck(p, skB, "wrong"), { done: false, beats: [], because: null }, "not compressed: no fallback");
});

test("K2: after a lesson that closed badly, the easiest unseen card of a met skill comes first and ladders go easiest first", () => {
  const brief = { successFirst: true, adaptTrace: ["R1"], opener: "standard_retrieval" };
  const p = planFor({ script, kit, skills: { [A]: { status: "practising" } }, brief, now: NOW });
  assert.equal(p.firstCard, `${TOPIC}-i02`); // difficulty 1, skill A; not the teach-back i07 or the diagnostic i08
  const r = p.because.find((b) => b.choice === "firstCard");
  assert.equal(r.fact.kind, "closed_badly"); assert.match(r.source, /R1/);
  assert.deepEqual(p.ladderOrder[B], [`${TOPIC}-i04`, `${TOPIC}-i05`, `${TOPIC}-i06`]);
  assert.equal(p.ladderOrder[A], undefined, "already easiest first: unchanged");
  assert.deepEqual(p.because.filter((b) => b.choice === "ladderOrder").map((b) => b.on), [B]);
});

test("K2: first week (R15) is named as such; answered items are skipped; a child who met nothing gets no first card", () => {
  const brief = { successFirst: true, adaptTrace: ["R15"] };
  const p = planFor({ script, kit, skills: { [A]: { status: "introduced" } }, history: { [A]: [`${TOPIC}-i02`] }, brief, now: NOW });
  assert.equal(p.firstCard, `${TOPIC}-i03`);
  assert.equal(p.because.find((b) => b.choice === "firstCard").fact.kind, "first_week");
  const none = planFor({ script, kit, skills: {}, brief, now: NOW });
  assert.equal(none.firstCard, null);
  assert.ok(none.because.every((b) => b.choice === "ladderOrder"));
  assert.equal(easiestUnseen({ script, kit, skills: { [A]: { status: "unseen" } } }), null);
});

test("K2: a compressed skill's ladder is not reordered (no record for a ladder never walked)", () => {
  const p = planFor({ script, kit, skills: { [B]: learned(), [A]: { status: "practising" } }, brief: { successFirst: true, adaptTrace: ["R1"] }, now: NOW });
  assert.equal(p.ladderOrder[B], undefined);
  assert.ok(!p.because.some((b) => b.choice === "ladderOrder" && b.on === B));
});

test("K3: her open ledger mix-up's check is asked first among the skill's checks; remediation is untouched", () => {
  const mixups = [{ id: MIS_Y, p: 0.82, needsVerify: true, hits: 3 }];
  const { checkOrder, because } = checkOrderOf({ script, kit, mixups });
  assert.deepEqual(checkOrder, { [A]: ["c2", "c1"] });
  assert.deepEqual(because.map((b) => [b.choice, b.on, b.fact.kind, b.fact.misconceptionId, b.source]), [["checkOrder", A, "open_mixup", MIS_Y, "ledger"]]);
  const p = planFor({ script, kit, mixups, now: NOW });
  assert.deepEqual(beatsFor(p, skA), ["explain:e1", "explain:e2", "worked", "check:c2", "check:c1"]);
  assert.deepEqual(checksOf(p, skA).map((c) => c.id), ["c2", "c1"]);
  assert.deepEqual(checkOrderOf({ script, kit, mixups: [{ id: MIS_X, p: 0.9, needsVerify: true }] }).checkOrder, {}, "the first check already asks about it");
  assert.deepEqual(checkOrderOf({ script, kit, mixups: [{ id: MIS_Y, p: 0.5, needsVerify: false }] }).checkOrder, {}, "not open enough");
  assert.deepEqual(checkOrderOf({ script, kit, mixups: [{ id: "elsewhere-m", p: 0.9, needsVerify: true }] }).checkOrder, {}, "no check asks about it here");
  // a compressed skill opens at the reordered first check, and its fallback leaves that one out
  const pc = planFor({ script, kit, skills: { [A]: learned() }, mixups, now: NOW });
  assert.deepEqual(beatsFor(pc, skA), ["check:c2"]);
  assert.deepEqual(afterCompressCheck(pc, skA, "wrong").beats, ["explain:e1", "explain:e2", "worked", "check:c1"]);
});

test("K3: at the turn the classifier's mix-up comes first, else the card's authored target (the ledger never remediates)", () => {
  const card = scriptCheckItem(A, skA.checks[0]);
  const plan = planFor({ script, kit, mixups: [{ id: MIS_Y, p: 0.82, needsVerify: true }], now: NOW });
  const c = remedyNow(plan, card, { misconceptionId: MIS_Y }, skA);
  assert.equal(c.targets, MIS_Y); assert.equal(c.because.fact.kind, "classified_mixup");
  assert.deepEqual(remedyNow(plan, card, { misconceptionId: MIS_X }, skA), { targets: MIS_X, because: null }, "the card's own mix-up: the default");
  assert.deepEqual(remedyNow(plan, card, null, skA), { targets: MIS_X, because: null }, "an open ledger mix-up does not change the remediation");
  assert.deepEqual(remedyNow(null, card, { misconceptionId: MIS_Z }, skA), { targets: MIS_X, because: null }, "a mix-up this skill cannot remediate");
});

test("K1: every skill compressed → allKnown with a record (the caller decides what fills the lesson)", () => {
  const p = planFor({ script, kit, skills: { [A]: learned(), [B]: learned() }, now: NOW });
  assert.equal(p.allKnown, true);
  assert.deepEqual(p.because.filter((b) => b.choice === "allKnown").map((b) => [b.on, b.fact.kind, b.fact.skillIds]), [[TOPIC, "all_learned_delayed_check", [A, B]]]);
  assert.equal(planFor({ script, kit, skills: { [A]: learned() }, now: NOW }).allKnown, false);
});

test("K4: a wheel-spinning skill gets its prerequisite checked in the warm-up", () => {
  const brief = { prereqCheck: { skillId: A, forTopicId: TOPIC, prereqTopicId: "c8-test-ch02-t01" } };
  const r = prereqCheckOf({ brief });
  assert.deepEqual(r.prereqCheck, { skillId: A, topicId: "c8-test-ch02-t01" });
  assert.equal(r.because[0].fact.kind, "wheel_spin"); assert.match(r.because[0].source, /R5/);
  assert.deepEqual(prereqCheckOf({ brief: { prereqCheck: { skillId: A } } }), { prereqCheck: null, because: [] });
  assert.deepEqual(prereqCheckOf({ brief: null }), { prereqCheck: null, because: [] });
});

test("K5: no new skill before a test or in week one: a topic she has met instead", () => {
  const candidates = [{ topicId: "t-new", status: "unseen", rank: 0 }, { topicId: "t-met", status: "in_progress", rank: 1 }];
  const r = topicFor({ candidates, brief: { newSkillBudget: 0, adaptTrace: ["R15"] } });
  assert.equal(r.topicId, "t-met"); assert.equal(r.mode, "review");
  assert.deepEqual(r.because.map((b) => [b.choice, b.on, b.fact.kind, b.fact.insteadOf]), [["revision", "t-met", "first_week", "t-new"]]);
  assert.equal(topicFor({ candidates, brief: { newSkillBudget: 0, adaptTrace: [] } }).because[0].fact.kind, "test_soon");
  assert.deepEqual(topicFor({ candidates, brief: { newSkillBudget: 1 } }), { topicId: "t-new", mode: "teach", because: [] });
  const onlyNew = topicFor({ candidates: [candidates[0]], brief: { newSkillBudget: 0 } });
  assert.deepEqual(onlyNew, { topicId: "t-new", mode: "teach", because: [] }, "nothing met: teach, no record");
  assert.deepEqual(topicFor({ candidates: [] }), { topicId: null, mode: "teach", because: [] });
});

test("K6: every onboarding tile resolves to a hook slot in each pilot script; exact before near; consent off ignores interests", () => {
  for (const t of ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"]) {
    const sc = JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${t}.json`, import.meta.url), "utf8"));
    const k = { skills: sc.skills.map((x) => ({ id: x.skillId })) };
    for (const id of TILE_IDS) {
      const h = hookOf({ script: sc, kit: k, interests: [id], memory: { likes: true } });
      assert.ok(h.hookSlot, `${t}: ${id} has no slot`);
      const f = h.because[0].fact;
      if (f.via === "near") assert.equal(f.path, `${id} → ${f.slotInterest}`); else assert.equal(f.slotInterest, id);
    }
  }
  for (const id of Object.keys(NEAR)) { assert.ok(INTEREST_IDS.includes(id), id); for (const n of NEAR[id]) assert.ok(INTEREST_IDS.includes(n), `${id} → ${n}`); }
  assert.deepEqual(slotFor(skA, ["Cricket"]), { slot: skA.hook.interestSlots[0], index: 0, interest: "cricket", via: "exact" });
  assert.equal(slotFor(skA, ["trains"]).index, 1); assert.equal(slotFor(skA, ["trains"]).via, "near");
  assert.equal(slotFor(skA, ["building", "cricket"]).interest, "cricket", "an exact slot for any interest beats a near one");
  assert.equal(slotFor(skA, ["building"]).index, 2);
  assert.equal(slotFor(skA, ["cooking"]).index, 2, "cooking → nature (none) → drawing");
  assert.equal(slotFor(skA, []), null);
  const h = hookOf({ script, kit, interests: ["trains"], memory: { likes: true } });
  assert.deepEqual(h.hookSlot, { skillId: A, index: 1, interest: "vehicles" });
  assert.deepEqual(h.because[0].fact, { kind: "interest", interest: "trains", slotInterest: "vehicles", via: "near", index: 1, path: "trains → vehicles" });
  assert.deepEqual(hookOf({ script, kit, interests: ["trains"], memory: { likes: false } }), { hookSlot: null, because: [] });
});

test("K7: after a gap of 7+ days one easier card opens the warm-up; the brief's opener wins over the memory gap", () => {
  const skills = { [A]: { status: "practising" } };
  const gap = firstCardOf({ script, kit, skills, memory: { lastActiveDay: "2026-11-02" }, now: NOW });
  assert.equal(gap.opener, "reanchor_light"); assert.equal(gap.firstCard, `${TOPIC}-i02`);
  assert.deepEqual(gap.because.map((b) => [b.choice, b.fact.kind, b.fact.days]), [["opener", "gap", 8]]);
  assert.deepEqual(gap.ladderOrder, {}, "a gap alone does not reorder ladders");
  assert.equal(firstCardOf({ script, kit, skills, memory: { lastActiveDay: "2026-11-07" }, now: NOW }).firstCard, null);
  assert.equal(firstCardOf({ script, kit, skills, brief: { opener: "standard_retrieval" }, memory: { lastActiveDay: "2026-10-01" }, now: NOW }).firstCard, null);
  assert.equal(firstCardOf({ script, kit, skills, brief: { opener: "reanchor_light" }, now: NOW }).because[0].source, "brief.opener (R8: counters.lastActiveDay)");
  const both = firstCardOf({ script, kit, skills, brief: { opener: "reanchor_light", successFirst: true, adaptTrace: ["R1"] }, now: NOW });
  assert.deepEqual(both.because.filter((b) => b.on === both.firstCard).map((b) => b.choice).sort(), ["firstCard", "opener"]);
});

test("K8: among equally ranked topics, a scripted one first", () => {
  const candidates = [{ topicId: "t1", status: "unseen", rank: 0 }, { topicId: "t2", status: "unseen", rank: 0 }, { topicId: "t3", status: "unseen", rank: 1 }];
  const r = topicFor({ candidates, scripted: ["t2", "t3"] });
  assert.equal(r.topicId, "t2"); assert.deepEqual(r.because.map((b) => [b.choice, b.fact.insteadOf]), [["topic", "t1"]]);
  assert.deepEqual(topicFor({ candidates, scripted: ["t1"] }).because, [], "the default is scripted already");
  assert.equal(topicFor({ candidates, scripted: ["t3"] }).topicId, "t1", "a less due scripted topic does not jump the queue");
});

// ───────────── B: the predicate ─────────────
const beats = (keys) => keys.map((k) => { const [skillId, beat] = k.split("|"); return { kind: "beat", skillId, beat }; });

test("B: the default walk passes with no because; a prefix (the clock ran out) and a re-posed card pass", () => {
  const def = defaultWalk(script, kit);
  assert.deepEqual(def.slice(0, 3), [`${A}|hook`, `${A}|explain:e1`, `${A}|explain:e2`]);
  assert.deepEqual(def.slice(-3), [`${B}|ladder:${TOPIC}-i06`, `${B}|ladder:${TOPIC}-i04`, `${B}|ladder:${TOPIC}-i05`]);
  assert.ok(assertWalkExplained({ script, kit, events: beats(def) }));
  assert.ok(assertWalkExplained({ script, kit, events: beats(def.slice(0, 5)) }));
  const repose = [...beats(def.slice(0, 4)), { kind: "remedy", cardId: askCardId(A, "e2"), targets: MIS_Y, authored: MIS_Y }, ...beats([def[2]]), ...beats(def.slice(4))];
  assert.ok(assertWalkExplained({ script, kit, events: repose }));
  assert.ok(assertWalkExplained({ script, kit, events: [{ kind: "warmup", itemId: "x" }, { kind: "hook", skillId: A, index: 0 }, ...beats(def)] }));
});

test("B: each departure with no because throws; the matching record lets it pass", () => {
  const def = defaultWalk(script, kit);
  const swapped = [def[0], def[2], def[1], ...def.slice(3)];
  assert.throws(() => assertWalkExplained({ script, kit, events: beats(swapped) }), /departs from the script/);
  // K1: skill A opened at its check
  const compressed = [`${A}|check:c1`, ...def.filter((k) => k.startsWith(B))];
  assert.throws(() => assertWalkExplained({ script, kit, events: beats(compressed) }), /expects .*hook/);
  const p = planFor({ script, kit, skills: { [A]: learned() }, now: NOW });
  assert.ok(assertWalkExplained({ script, kit, because: p.because, events: beats(compressed) }));
  // K1's fallback needs its own record
  const fallback = [`${A}|check:c1`, `${A}|explain:e1`, `${A}|explain:e2`, `${A}|worked`, `${A}|check:c2`, ...def.filter((k) => k.startsWith(B))];
  assert.throws(() => assertWalkExplained({ script, kit, because: p.because, events: beats(fallback) }));
  assert.ok(assertWalkExplained({ script, kit, because: [...p.because, afterCompressCheck(p, skA, "wrong").because], events: beats(fallback) }));
  // K2's ladder order
  const lo = [...def.slice(0, -3), `${B}|ladder:${TOPIC}-i04`, `${B}|ladder:${TOPIC}-i05`, `${B}|ladder:${TOPIC}-i06`];
  assert.throws(() => assertWalkExplained({ script, kit, events: beats(lo) }));
  const p2 = planFor({ script, kit, brief: { successFirst: true, adaptTrace: ["R1"] }, now: NOW });
  assert.ok(assertWalkExplained({ script, kit, because: p2.because, events: beats(lo) }));
  assert.deepEqual(expectedWalk(script, kit, p2.because).slice(-3), lo.slice(-3));
});

test("B: a first card, a prerequisite check, a hook slot and a remediation each need their record", () => {
  const def = beats(defaultWalk(script, kit));
  const cases = [
    [{ kind: "first", itemId: `${TOPIC}-i02` }, { choice: "firstCard", on: `${TOPIC}-i02` }],
    [{ kind: "first", itemId: `${TOPIC}-i02` }, { choice: "opener", on: `${TOPIC}-i02` }],
    [{ kind: "prereq", topicId: "c8-x" }, { choice: "prereqCheck", on: "c8-x" }],
    [{ kind: "hook", skillId: A, index: 2 }, { choice: "hookSlot", on: A }],
    [{ kind: "remedy", cardId: checkCardId(A, "c1"), targets: MIS_Y, authored: MIS_X }, { choice: "remedy", on: checkCardId(A, "c1") }],
  ];
  for (const [ev, b] of cases) {
    assert.throws(() => assertWalkExplained({ script, kit, events: [ev, ...def] }), new RegExp(""), JSON.stringify(ev));
    assert.throws(() => assertWalkExplained({ script, kit, because: [{ ...b, on: "something-else" }], events: [ev, ...def] }), undefined, "a record on another target does not count");
    assert.ok(assertWalkExplained({ script, kit, because: [b], events: [ev, ...def] }));
  }
  assert.ok(assertWalkExplained({ script, kit, events: [{ kind: "hook", skillId: A, index: 0 }, ...def] }), "slot 0 is the default");
});

test("B: her open mix-up's check asked first needs its checkOrder record", () => {
  const def = defaultWalk(script, kit);
  const swapped = def.map((k) => (k === `${A}|check:c1` ? `${A}|check:c2` : k === `${A}|check:c2` ? `${A}|check:c1` : k));
  assert.throws(() => assertWalkExplained({ script, kit, events: beats(swapped) }));
  const p = planFor({ script, kit, mixups: [{ id: MIS_Y, p: 0.82, needsVerify: true }], now: NOW });
  assert.ok(assertWalkExplained({ script, kit, because: p.because, events: beats(swapped) }));
});

test("B: a ladder card already posed first in the warm-up is not a skip", () => {
  const def = defaultWalk(script, kit);
  const first = `${TOPIC}-i04`;
  const ev = [{ kind: "first", itemId: first }, ...beats(def.filter((k) => !k.endsWith(first)))];
  assert.ok(assertWalkExplained({ script, kit, because: [{ choice: "firstCard", on: first }], events: ev }));
});
