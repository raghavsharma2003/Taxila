// Answer leaks the lexical key match could not see (evals/director-sim.mjs, review of ws2-director):
// a comparison answered in other words at hint rung 2, and an explain turn that stated the key of the
// question posed next — which was then scored as an unaided correct answer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { revealsAnswer, diagnosticItem, findItem } from "../server/director/items.js";
import { initLessonState, step, upcomingItem, evidenceFrom } from "../server/director/state.js";
import { normalizeKit, ACCEPTABLE_MAX } from "../server/content/kits.js";
import { kit, RAW_KIT, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const DIAG = diagnosticItem(K, K.misconceptions[0], 1);
const I3 = K.items.find((i) => i.id === "i3"); // "Kaun bada hai, 1/2 ya 1/3?" key 1/2

test("a comparison stated in other words is a leak; posing or nudging it is not", () => {
  for (const item of [DIAG, I3]) {
    assert.equal(revealsAnswer("same roti bars dekho: 2 tukdon wali bar ka har tukda, 3 tukdon wali bar se bada hai. Ab kaun bada?", item), true);
    assert.equal(revealsAnswer("3 wala tukda chhota hota hai.", item), true, "the wrong choice named smaller says the answer too");
    assert.equal(revealsAnswer("Kaun bada hai: 1/2 ya 1/3?", item), false);
    assert.equal(revealsAnswer("Dono rotis same size. Ek ko 2 mein kaato, ek ko 3 mein. Kaunsa tukda bada hoga?", item), false);
    assert.equal(revealsAnswer("Achha try! Ek baar aur socho.", item), false);
    // Measured false leaks (evals/director-sim.mjs): an affirmation, and a size word about something else.
    assert.equal(revealsAnswer("Sahi, 15 ko 3 equal groups mein baantkar tumne one-third ko 5 bataya.", item), false);
    assert.equal(revealsAnswer("Yahan ek chhoti galti: roti 2 nahi, 4 equal tukdon mein hai.", item), false);
  }
});

test("the next question is known before it is posed, and a key stated early spoils its evidence", () => {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  while (!["explain", "worked_example"].includes(r.move.kind)) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (r.state.turn + 1) * 20_000 });
  const ahead = upcomingItem(r.state, K);
  assert.ok(ahead, "a teaching turn has a question coming");
  // Walk to the moment that item is posed.
  let s = r.state;
  while (s.activeItemId !== ahead.id) s = step(s, { event: "turn", kit: K, cls: cls("no_evidence"), now: (s.turn + 1) * 20_000 }).state;
  const fair = evidenceFrom(s, cls("correct"), K);
  assert.equal(fair[0].hintsUsed, 0);
  const spoiled = evidenceFrom({ ...s, spoiled: [ahead.id] }, cls("correct"), K);
  assert.equal(spoiled[0].hintsUsed, 4, "an answer the teacher already said is worth nothing");
  assert.ok(findItem(s, K, ahead.id));
});

test("normalizeKit caps an item's accepted forms (they are pinned beside the key, unsheddable)", () => {
  const raw = structuredClone(RAW_KIT);
  raw.items[0].acceptable = Array.from({ length: 40 }, (_, i) => `form ${i}`).concat(["x".repeat(200), "form 1"]);
  const k = normalizeKit(raw, { topicId: raw.topicId, verified: true });
  const acc = k.items.find((i) => i.id === raw.items[0].id).acceptable;
  assert.equal(acc.length, ACCEPTABLE_MAX);
  assert.equal(new Set(acc).size, acc.length);
  assert.ok(acc.every((a) => a.length <= 60));
});
