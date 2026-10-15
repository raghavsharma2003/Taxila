// round 5 (14.3, QA pass 12 D38): an English lesson has no address, but she mirrors a child who types Hinglish, and those
// lines came out in tum forms for a class 6 child whose parent set aap (TEST: 365 of 1569 English-lesson teacher lines
// carried tum marks). The lesson carries ctx.mixAddress (the parent's setting, else the class default); the reply guard
// holds a code-switched line to aap with the closed tum → aap lexicon and NO model call; a tum mixAddress is never enforced.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { codeSwitchAddress, registerBroken } from "../server/director/register.js";
import { __test as L, replyDeps } from "../server/routes/lesson.js";
import { kit, CTX } from "./fixtures/kit.mjs";

const K = kit();
const withReplies = async (texts, fn) => {
  let i = 0; const was = replyDeps.chat;
  replyDeps.chat = async () => ({ text: texts[Math.min(i++, texts.length - 1)] });
  try { const out = await fn(); return { out, calls: i }; } finally { replyDeps.chat = was; }
};
const englishLesson = (mixAddress) => {
  const r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, lang: "english", address: null, ...(mixAddress ? { mixAddress } : {}) }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
  return r;
};

test("codeSwitchAddress: the parent's setting, else the class default", () => {
  assert.equal(codeSwitchAddress({ classLevel: 6 }), "aap");
  assert.equal(codeSwitchAddress({ classLevel: 3 }), "tum");
  assert.equal(codeSwitchAddress({ classLevel: 3, parent: "aap" }), "aap");
  assert.equal(codeSwitchAddress({ classLevel: 8, parent: "tum" }), "tum");
});

test("an English lesson with mixAddress aap: a code-switched tum line becomes aap, with one model call (no rewrite)", async () => {
  const r = englishLesson("aap");
  const line = "Bilkul, Kabir—tumne khud perimeter ka meaning bata diya. Tum batao, fence ke liye kya measure karenge?";
  const { out, calls } = await withReplies([line], () => L.textReply({ instructions: "x", state: r.state, kit: K, childText: "maine khud bata diya", verdict: "ungraded", ui: r.ui, module: null }));
  assert.ok(!registerBroken(out.reply, "aap"), out.reply);
  assert.match(out.reply, /aapne|Aap bataiye/);
  assert.equal(calls, 1, "the closed lexicon fixes it: no rewrite call");
});

test("no mixAddress, or a tum one: the line is left as it is (no enforcement, no extra call)", async () => {
  for (const mix of [null, "tum"]) {
    const r = englishLesson(mix);
    const line = "Bilkul, tumne khud perimeter ka meaning bata diya. Fence ke liye kya measure karenge?";
    const { out, calls } = await withReplies([line], () => L.textReply({ instructions: "x", state: r.state, kit: K, childText: "maine khud bata diya", verdict: "ungraded", ui: r.ui, module: null }));
    assert.match(out.reply, /tumne/, String(mix));
    assert.equal(calls, 1, String(mix));
  }
});
