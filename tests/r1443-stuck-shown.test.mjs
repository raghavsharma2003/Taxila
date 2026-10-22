// 14.4.3 (main's 14.4.2 release replay on c5a55681, r2 t3): "samajh nahi aaya, ek example se samjhao" → "pata nahi" →
// "pata nahi", and the worked example then said "Pehle 50 plus 30 kijiye, milta hai 80. Ab doosri same jodi bhi 80 hai—total
// kitna?": the sum handed back to a child who had said twice they did not know. The Director's shape already said "show"
// (fe59b5f1); the reply guard's hand-back check read a showing turn as "flat" and its rewrite asked the sum. Now a worked
// part shown to a stuck child carries move.stuck, needs no hand-back, and a sentence that asks them to compute is a "quiz".
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { requestOf } from "../server/director/requests.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { textReply, replyDeps, asksToCompute } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const NE = cls("no_evidence");
const say = (r, text) => {
  const q = requestOf(text);
  const c = q ? { ...NE, source: "request", request: q } : /pata nahi/.test(text) ? { ...NE, flags: { ...NE.flags, dontKnow: true } } : NE;
  return step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 });
};
const replay = (seed) => {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed, now: 0 }), { event: "start", kit: K, now: 0 });
  for (const t of ["samajh nahi aaya, ek example se samjhao", "pata nahi", "pata nahi"]) r = say(r, t);
  // since 14.4.3's QA fix the example itself is the kit's worked example (a shown reteach), so the worked step comes a
  // turn later: one more don't-know reaches it
  for (let i = 0; i < 3 && r.move.kind !== "worked_example"; i++) r = say(r, "pata nahi");
  return r;
};
const R2 = "Pehle 50 plus 30 kijiye, milta hai 80. Ab doosri same jodi bhi 80 hai—total kitna?";
afterEach(() => { replyDeps.chat = chat; });

test("main's lines: the worked part after two don't-knows is shown, and the move says so (move.stuck)", () => {
  for (const seed of [1, 2, 3]) {
    const r = replay(seed);
    assert.equal(r.move.kind, "worked_example", `seed ${seed}`);
    assert.equal(r.move.stuck, true);
    assert.match(r.move.shape, /show this part's steps yourself/);
  }
});

test("a sentence that hands them a sum is a quiz; showing a result or inviting the next step is not", () => {
  for (const t of ["Ab doosri same jodi bhi 80 hai—total kitna?", "Pehle 50 plus 30 kijiye.", "How far does she run in all?"]) assert.equal(asksToCompute(t), true, t);
  for (const t of ["Pehle 50 plus 30 kijiye, milta hai 80.", "Agla step dekhein?", "3 rounds = 3 × 160 = 480 m.", "Ek round 160 m hai."]) assert.equal(asksToCompute(t), false, t);
});

test("r2 t3's reply never ships its 'total kitna?' on the stuck part; a showing turn is not 'flat'", async () => {
  const r = replay(2);
  replyDeps.chat = async () => ({ text: R2 });
  const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "pata nahi", verdict: "ungraded", history: [], ui: r.ui, module: null });
  assert.ok(out.guard.caught.includes("quiz"), JSON.stringify(out.guard));
  assert.ok(!asksToCompute(out.reply.split(/(?<=[.!?।])\s+/).at(-1)), out.reply);
  assert.doesNotMatch(out.reply, /total kitna/);
  replyDeps.chat = async () => ({ text: "Pehle 50 aur 30 jodte hain: 80. Do baar 80 matlab 160 m, ek round. Agla step saath mein dekhte hain." });
  const shown = await textReply({ instructions: "x", state: r.state, kit: K, childText: "pata nahi", verdict: "ungraded", history: [], ui: r.ui, module: null });
  assert.ok(!shown.guard.caught.includes("flat") && !shown.guard.caught.includes("quiz"), JSON.stringify(shown.guard));
});

test("an engaged child's worked part still hands the next step back (no quiz guard there)", async () => {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed: 2, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 12 && r.move.kind !== "worked_example"; i++) r = say(r, "haan");
  assert.equal(r.move.kind, "worked_example");
  assert.ok(!r.move.stuck);
  replyDeps.chat = async () => ({ text: R2 });
  const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "haan", verdict: "ungraded", history: [], ui: r.ui, module: null });
  assert.ok(!out.guard.caught.includes("quiz"), JSON.stringify(out.guard));
});
