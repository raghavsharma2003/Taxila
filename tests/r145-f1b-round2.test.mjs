// census 14.5 (F1 round 2, production 310b8c82 / 3437b744; main's evidence): departures the Director never registered.
// "Chapter 1 se shuru karo" / "start from chapter 1" and "theory first, in order" were no request at all; a bare "haan" to
// her own single offer ("Kya Chapter 1 se shuru karein?") was graded against the card and the card posed over it. Now a
// chapter ask offers that chapter's first topic, an explain-first ask teaches the idea now (the card waits), and a bare yes
// to ONE offer of hers is the request it names (never a choice, never a lesson question). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { requestOf, offerAgreed } from "../server/director/requests.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c9-maths-ch08-t02"));
const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const say = (r, text) => { const q = requestOf(text); return turn(r, q ? { ...NE, source: "request", request: q } : NE, { text }); };
const start = () => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 9 }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
function toCard() {
  let r = start();
  for (let i = 0; i < 12 && !(r.state.phase === "practice" && r.move.itemId && !r.move.itemId.startsWith("fade:")); i++) r = turn(r, NE);
  assert.ok(r.move.itemId);
  return r;
}

test("a chapter ask names its chapter; an answer that mentions a chapter is no ask", () => {
  for (const [t, n] of [["chapter 1 se start karo", 1], ["Chapter 1 se shuru karte hain", 1], ["start from chapter 1", 1], ["pehla chapter se shuru karo", 1],
    ["chapter 3 padhna hai", 3], ["lesson 4 start karo", 4]]) assert.deepEqual(requestOf(t), { type: "switch", chapter: n, whole: true }, t);
  for (const t of ["chapter 12 mein 5 sawal the", "lesson 2 mein maine 5 likha", "is chapter ka answer 1 hai"]) assert.equal(requestOf(t), null, t);
});

test("a chapter ask offers that chapter's first topic of their class and subject; today's chapter carries on", () => {
  const b = say(toCard(), "chapter 1 se shuru karo");
  assert.equal(b.move.request, "switch");
  assert.ok((b.ui.chips ?? []).some((c) => c.id === "switch:c9-maths-ch01-t01"), JSON.stringify(b.ui.chips));
  const same = say(toCard(), "start from chapter 8");
  assert.match(same.move.shape, /chapter you are already on/);
});

test("explain first: the idea now, the card waits and comes back next; in teaching, no probe or gap is planned", () => {
  for (const t of ["pehle theory batao, order mein", "theory first, in order please", "pehle samjhao", "explain the theory first"]) assert.equal(requestOf(t)?.type, "explain_first", t);
  assert.equal(requestOf("in order to solve it i added"), null);
  const r = toCard();
  const a = say(r, "pehle theory batao");
  assert.equal(a.move.kind, "explain");
  assert.equal(a.move.itemId ?? null, null, "no card this turn");
  assert.equal(turn(a, NE, { text: "achha" }).move.itemId, r.move.itemId, "the card comes back next");
  let t0 = turn(start(), NE);
  const c = say(t0, "pehle samjhao");
  const ahead = c.state.teachPlan.slice(c.state.teachIdx);
  assert.ok(!ahead.includes("fade") && !ahead.includes("first_step"), ahead.join());
  assert.ok(ahead.filter((x) => x === "worked_example").length <= 1, ahead.join());
});

test("a bare yes to her single offer is the request it names; a choice or a lesson question is not", () => {
  assert.deepEqual(offerAgreed("Bahut accha! Kya Chapter 1 se shuru karein?", "haan"), { type: "switch", chapter: 1, whole: true, offer: true });
  assert.equal(offerAgreed("Thoda break lein?", "ok")?.type, "break");
  assert.equal(offerAgreed("Kya hum ek example dekhein?", "yes please")?.type, "example");
  assert.equal(offerAgreed("Shall we look at a picture?", "yes")?.subject, undefined, "her own words are no subject");
  for (const [h, t] of [["Aap continue karenge, short break lenge, ya aaj ke liye stop karenge?", "haan"], ["Melting ghee ka chitra banaiye—kya badla?", "haan"],
    ["Aur ek example?", "haan"], ["Ab batao, 5 aur 3 kitne hue?", "haan"], ["Samajh aaya?", "haan"], ["Kya Chapter 1 se shuru karein?", "haan 8"]]) assert.equal(offerAgreed(h, t), null, h);
});

test("3437b744: 'haan' to her chapter offer with a card on the table is the switch, never graded, the card not re-posed", () => {
  const r = toCard();
  const item = K.items.find((x) => x.id === r.move.itemId);
  const f = classifyFast({ target: targetFor(r.state, K, item), childText: "haan", typed: true, heard: "Bilkul. Kya Chapter 1 se shuru karein?" });
  assert.equal(f.result?.source, "request");
  assert.equal(f.result?.request?.type, "switch");
  const b = turn(r, f.result, { text: "haan" });
  assert.equal(b.move.request, "switch");
  assert.notEqual(b.move.itemId, item.id);
});
