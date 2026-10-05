// VALUES-100 V1 ("learnt" = correct later, in a new form, without help) and W1-C (tests/prod/w1c-three-day.mjs): when a
// delayed check is due, it LEADS the next lesson, before any teaching. Wave 2 added W2-C's guidance ladder (worked
// example → backward-faded step, faded step, first-step probe) to the front of the teach plan; this pins that none of
// those paths pre-empts the C31 opener, whatever the guidance level.
//
// It also pins the scripted child of tests/prod/_w1c.mjs to the product's faded step: the 2026-10-05 Wave 2 regression
// (w1c-three-day 22/22 → 16/22) was that child answering "pata nahi" to `fade:<i>` (not a kit item, so it had no key),
// spending 8 of 18 day-0 turns on hints and breaks, never reaching learned_today, so no delayed check was due at +1 day.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeKit } from "../server/content/kits.js";
import { initLessonState, step } from "../server/director/state.js";
import { fadeItem } from "../server/director/fading.js";
import { fadeItemOf, replyFor } from "./prod/_w1c.mjs";

const raw = JSON.parse(readFileSync(new URL("../data/kits/c5-maths.json", import.meta.url), "utf8"));
const kitAt = (i) => normalizeKit(raw.topics[i], { topicId: raw.topics[i].topicId, verified: true });
const kit0 = kitAt(0), kit1 = kitAt(1); // c5-maths-ch01-t01 (yesterday), c5-maths-ch01-t02 (today)
const NOF = { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false };
const right = { outcome: "correct", confidence: 1, source: "exact", flags: NOF };
const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Bittu", what: "a puppy" }, ageBand: "10-15", lang: "english",
  interests: [], firstMeeting: false, hasCallback: false, topicTitle: "Today", classLevel: 5, address: "tum" };

/** Yesterday's skill as lesson.js warmupItemsFor snapshots it: a retrieval item on the due skill, carried with its kit facts. */
function warmupFor(kit) {
  const sk = kit.skills[0].id;
  const it = kit.items.filter((i) => i.skillId === sk && ["retrieval", "practice", "near_transfer"].includes(i.kind))
    .sort((a, b) => (b.kind === "retrieval") - (a.kind === "retrieval") || a.difficulty - b.difficulty)[0];
  return { ...it, kind: "retrieval", topicId: kit.topicId, topicType: kit.topicType, kitVerified: true, expectations: kit.expectations, misconceptions: [] };
}

/** Start today's lesson with yesterday's skill due, under a given guidance record; return the moves until the warm-up is done. */
function open({ skills = {}, history = {}, stuck = {} } = {}) {
  const w = warmupFor(kit0);
  const s0 = initLessonState({ topicId: kit1.topicId, kit: kit1, skills, history, stuck, warmupItems: [w], openers: [w.skillId], ctx: { ...ctx, sessionId: "t" }, seed: 7, now: 0 });
  const r0 = step(s0, { event: "start", kit: kit1, now: 0 });
  return { w, s0, r0 };
}

const LEVELS = {
  worked: {},                                                                                   // never seen: worked example then the faded step
  faded: { history: { [kit1.skills[0].id]: ["correct", "incorrect"] } },                        // mixed record: the faded step first
  probe: { skills: { [kit1.skills[0].id]: { pKnown: 0.5, status: "practising", attempts: 0, correctUnaided: 0, generativePass: false } } },
  attempt: { history: { [kit1.skills[0].id]: ["correct", "correct", "correct"] } },
};

for (const [level, rec] of Object.entries(LEVELS)) {
  test(`a due delayed check leads the next lesson before any teaching (guidance ${level})`, () => {
    const { w, s0, r0 } = open(rec);
    assert.equal(s0.guidance.level, level, "the record routes to the guidance level under test");
    if (level === "worked" || level === "faded") assert.ok(s0.fadeItem, "today's kit has a faded step, so the W2-C path is really exercised");
    assert.equal(s0.phase, "warmup");
    // the opening turn poses YESTERDAY's item, as the C31 delayed check, before hook / explain / worked example / fade
    assert.equal(r0.move.kind, "greet");
    assert.equal(r0.move.itemId, w.id, "the opener asks yesterday's item");
    assert.equal(r0.state.activeItemId, w.id);
    assert.equal(r0.state.pendingProbe?.shapeId, "C31");
    assert.equal(r0.state.pendingProbe?.reason, "delayed_check");
    assert.ok(!r0.state.probeSess.pending.some((t) => t.reason === "delayed_check" && t.skillId === w.skillId), "asking it clears the trigger");
    assert.equal(r0.state.teachIdx, 0, "nothing of today's teach plan has been spent");
    // answered right: only now does today's teaching start
    const r1 = step(r0.state, { event: "turn", kit: kit1, cls: right, text: String(w.answer), answer: String(w.answer), typed: true, now: 20_000 });
    assert.ok(r1.state.itemsDone.includes(w.id));
    assert.notEqual(r1.state.phase, "warmup");
    assert.ok(!["greet", "retrieval"].includes(r1.move.kind), `today's lesson follows (${r1.move.kind})`);
  });
}

test("an Ask's question still comes first (the child's own words), and its delayed check is not lost: the trigger stays pending", () => {
  const w = warmupFor(kit0);
  const s0 = initLessonState({ topicId: kit1.topicId, kit: kit1, warmupItems: [w], openers: [w.skillId], ctx: { ...ctx, purpose: "doubt", askText: "lakh kya hai?" }, seed: 7, now: 0 });
  assert.equal(s0.phase, "teach");
  assert.ok(s0.probeSess.pending.some((t) => t.reason === "delayed_check" && t.skillId === w.skillId));
});

test("the w1c scripted child fills W2-C's faded step with the product's own key (every class 4-7 maths kit)", () => {
  let n = 0;
  for (const file of ["c4-maths.json", "c5-maths.json", "c6-maths.json", "c7-maths.json"]) {
    const d = JSON.parse(readFileSync(new URL(`../data/kits/${file}`, import.meta.url), "utf8"));
    for (const t of d.topics) {
      const f = fadeItem(normalizeKit(t, { topicId: t.topicId, verified: true }));
      if (!f) continue;
      n++;
      const mine = fadeItemOf(f.id, t.topicId);
      assert.ok(mine && (mine.answer === f.answer || f.acceptable.includes(mine.answer)), `${t.topicId} ${f.id}: scripted ${mine?.answer} vs key ${f.answer}`);
      // and replyFor (explain:false, the shallow day-0 child) answers it rather than shrugging
      const rep = replyFor({ ask: { text: f.prompt_en, itemId: f.id } }, t.topicId, { explain: false });
      assert.equal(rep.text, mine.answer);
    }
  }
  assert.ok(n > 50, `${n} faded steps checked`);
});
