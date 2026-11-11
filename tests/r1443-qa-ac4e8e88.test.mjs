// 14.4.3, QA on ac4e8e88 (main's message of 2026-10-22):
//  1. 905a3e50 / b28d919f: "ek example se samjhao" while the idea was taught got a park of her own (6 m by 4 m) and "Total
//     kitna?". An example asked for with no card on the table is now the kit's worked example, whole and shown (stuck), and
//     on a worked-example move a number that is not the kit example's (or worked out from two of its numbers) is "invented".
//  2. 6f1323e8: a right "160" to her own sum got "160 ko ek baar dobara check kijiye": doubt on a right answer is a deny.
//  4. f76aacd1: class 5 "geometry padhao" → "press the Geometry button" beside the only chip "Start Triangles and polygons":
//     the switch offer names what they asked for as the topic found, and the button by its own words.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { requestOf } from "../server/director/requests.js";
import { praiseProblem } from "../server/director/say.js";
import { selfPosedVerdict } from "../server/brain/arith.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { textReply, replyDeps, foreignNumbers } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { CTX, cls } from "./fixtures/kit.mjs";

afterEach(() => { replyDeps.chat = chat; });
const NE = cls("no_evidence");
const say = (K, r, text) => { const q = requestOf(text); return step(r.state, { event: "turn", kit: K, cls: q ? { ...NE, source: "request", request: q } : NE, text, now: (r.state.turn + 1) * 20_000 }); };
const start = (K, cl, seed = 2) => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: cl }, seed, now: 0 }), { event: "start", kit: K, now: 0 });
const RANI = kitFromFile(getTopic("c6-maths-ch06-t01"));
const OWN_PARK = "Ek park socho jo 6 m lamba aur 4 m chauda hai. Uske chaaron sides jodo: 6 plus 4 plus 6 plus 4. Total kitna?";

test("1. an example asked for is the kit's worked example, whole, shown (a reteach: the teach step does not advance)", () => {
  for (const seed of [1, 2, 3]) {
    const r = say(RANI, start(RANI, 6, seed), "samajh nahi aaya, ek example se samjhao");
    assert.equal(r.move.kind, "reteach", `seed ${seed}`);
    assert.equal(r.move.stuck, true);
    assert.match(r.move.shape, /the worked example in LESSON NOW is it.*never one of your own/);
    const content = r.state.lastContent.join(" ");
    assert.ok(content.includes(RANI.workedExample.problem) && RANI.workedExample.steps.every((x) => content.includes(x)), content);
  }
});

test("1. invented numbers on a worked move: 6 m by 4 m is caught, the kit's own (and worked-out) numbers are not", () => {
  assert.deepEqual(foreignNumbers("Ek park socho jo 6 m lamba aur 4 m chauda hai.", { kit: RANI }), ["4"]);
  assert.deepEqual(foreignNumbers("Rani ka park 50 m lamba, 30 m chauda: 50 + 30 = 80, do baar 160 m. 3 round matlab 480 m.", { kit: RANI }), []);
  assert.deepEqual(foreignNumbers("3D shapes yaad hain? 2nd round mein bhi 160 m.", { kit: RANI }), []);
});

test("1. QA's line on the kit-example move ships with neither the invented park nor the sum for them", async () => {
  const r = say(RANI, start(RANI, 6), "samajh nahi aaya, ek example se samjhao");
  replyDeps.chat = async () => ({ text: OWN_PARK });
  const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: RANI, childText: "samajh nahi aaya, ek example se samjhao", verdict: "ungraded", history: [], ui: r.ui, module: null });
  assert.ok(out.guard.caught.includes("invented") && out.guard.caught.includes("quiz"), JSON.stringify(out.guard));
  assert.doesNotMatch(out.reply, /\b6 m\b|\b4 m\b|Total kitna/);
});

test("2. doubt on a right answer is a deny; her own sum answered '160' or '160?' is read right", () => {
  for (const t of ["Haan, 160 m. 160 ko ek baar dobara check kijiye.", "160? Pakka?", "Are you sure about 160?"]) assert.equal(praiseProblem(t, "correct"), "contradicts", t);
  for (const t of ["Bilkul, 160 m! Ab 3 rounds ke liye kya karenge?", "Ab hum ek baar check karte hain ki aage kya hai."]) assert.equal(praiseProblem(t, "correct"), null, t);
  // after a wrong answer, asking them to check again is a fair nudge
  assert.notEqual(praiseProblem("150 ko ek baar dobara check kijiye.", "not_yet"), "contradicts");
  for (const x of ["nahi nahi, 160", "160?", "160 hai?"]) assert.equal(selfPosedVerdict("Ek round ka perimeter: 2 × 80 = ___?", x), "correct", x);
});

test("2. 6f1323e8's reply to a right '160' to her own sum: the doubt never ships", async () => {
  let r = start(RANI, 6);
  for (let i = 0; i < 12 && !r.move.itemId; i++) r = say(RANI, r, "haan");
  replyDeps.chat = async () => ({ text: "Achha socha. 160 ko ek baar dobara check kijiye. Chaliye agla sawaal dekhte hain." });
  const out = await textReply({ instructions: "x", state: { ...r.state, priorItemId: null }, kit: RANI, childText: "nahi nahi, 160", verdict: "attempt",
    history: [{ who: "teacher", text: "Ek round ka perimeter: 2 × 80 = ___?" }], ui: r.ui, module: null });
  assert.ok(out.guard.caught.includes("deny"), JSON.stringify(out.guard));
});

test("4. class 5 'geometry padhao': the offer names the topic found and the button by its own words", () => {
  const K = kitFromFile(getTopic("c5-maths-ch01-t01"));
  let r = start(K, 5);
  for (let i = 0; i < 12 && !r.move.itemId; i++) r = say(K, r, "haan");
  const s = say(K, r, "geometry padhao");
  const chip = (s.ui.chips ?? []).find((c) => String(c.id).startsWith("switch:"));
  assert.equal(chip?.id, "switch:c5-maths-ch07-t01", JSON.stringify(s.ui.chips));
  assert.match(s.move.shape, new RegExp(`they asked for geometry: the topic of their class for it is`));
  assert.ok(s.move.shape.includes(`the button that says "${chip.label}"`), s.move.shape);
  assert.match(s.move.shape, /never name a button by any other words/);
});
