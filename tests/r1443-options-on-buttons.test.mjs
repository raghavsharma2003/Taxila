// 14.4.3 (sim lab 14.4.2 safety run 6da8f599, p30 r3, lesson 87b610b3 #7): her text-lane line read out the card's choices,
// glued: "…ko batao. Bad — earthworms eat the crops' roots It makes no difference — soil is just dirt, worms don't change it
// Good — …". No code path appended them: the compile told her on EVERY lane to "read them plainly", and she listed them
// (12 of 160 option-card turns in the 14.4 sim-lab records, all move=probe on the text lane). On the text lane the choices
// are the buttons: the compile says so, and a line that names two or more of them is the guard "options" (rewrite, then the
// option texts taken out in code). The voice lane still reads them. Never on a safeguard turn.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { compile } from "../server/compiler/compile.js";
import { CHARACTERS } from "../server/compiler/characters/index.js";
import { initLessonState, step } from "../server/director/state.js";
import { diagnosticItem, promptFor } from "../server/director/items.js";
import { askText } from "../server/director/say.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { textReply, replyDeps, optionsNamed, withoutOptions } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kit, CTX, BRIEF, cls } from "./fixtures/kit.mjs";

afterEach(() => { replyDeps.chat = chat; });

const E = kitFromFile(getTopic("c3-evs-ch05-t02"));
const M = E.misconceptions.find((m) => m.id === "c3-evs-ch05-t02-m1");
const LINE = "Chhuo mat, bade ko batao. Bad — earthworms eat the crops' roots It makes no difference — soil is just dirt, worms don't change it Good — earthworms make the soil loose and rich. Ek kisaan ko apne khet mein bahut saare kenchue milte hain. Yeh achhi khabar hai ya buri?";

test("the sim lab's line names all three choices; taking them out leaves her line and the question", () => {
  const item = diagnosticItem(E, M, 3);
  assert.equal(optionsNamed(LINE, item), 3);
  const left = withoutOptions(LINE, item);
  assert.equal(optionsNamed(left, item), 0);
  assert.match(left, /^Chhuo mat, bade ko batao\. .*Yeh achhi khabar hai ya buri\?$/);
  // a bulleted list and an "A ya B" list go the same way; a line naming one choice is not a read-out
  assert.equal(withoutOptions(`- ${item.options[0].text} - ${item.options[1].text} Yeh achhi khabar hai ya buri?`, item), "Yeh achhi khabar hai ya buri?");
  assert.equal(optionsNamed(`Kya "${item.options[0].text}" sahi lagta hai?`, item), 1);
});

test("the compile: on the text lane the choices are the buttons, never listed; the voice lane still reads them", () => {
  const K = kit();
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 5; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (r.state.turn + 1) * 20_000 });
  const item = diagnosticItem(K, K.misconceptions[0], 3);
  const input = { character: CHARACTERS.asha, brief: BRIEF, lessonState: r.state, move: r.move, item, content: [], topic: { title: "Fractions", classLevel: 4, subject: "maths" }, language: "hinglish" };
  const text = compile({ ...input, lane: "text" });
  assert.match(text, /its choices are the buttons \(for checking only; never list or read them in your words\)/);
  assert.doesNotMatch(text, /read them plainly/);
  assert.match(compile({ ...input, lane: "voice" }), /its choices \(content — read them plainly, in this order\)/);
});

test("textReply on the text lane: the sim lab's line ships without the choices, ending on the question", async () => {
  let r = step(initLessonState({ topicId: E.topicId, kit: E, ctx: { ...CTX, classLevel: 3 }, seed: 3, now: 0 }), { event: "start", kit: E, now: 0 });
  const item = diagnosticItem(E, M, r.state.seed);
  const ask = askText(promptFor(item, "hinglish"));
  const state = { ...r.state, mode: "text", lastMove: { ...r.state.lastMove, kind: "probe", itemId: item.id }, activeItemId: item.id, hintLevel: 0 };
  replyDeps.chat = async () => ({ text: LINE });
  const out = await textReply({ instructions: "x", state, kit: E, childText: "haan", verdict: "ungraded", history: [], ui: { ask: { text: ask, itemId: item.id } }, module: null });
  assert.ok(out.guard.caught.includes("options"), JSON.stringify(out.guard));
  assert.equal(optionsNamed(out.reply, item), 0, out.reply);
  assert.ok(out.reply.trim().endsWith(ask), out.reply);
  // the voice lane keeps the read-out
  const voice = await textReply({ instructions: "x", state: { ...state, mode: "voice" }, kit: E, childText: "haan", verdict: "ungraded", history: [], ui: { ask: { text: ask, itemId: item.id } }, module: null });
  assert.ok(!voice.guard.caught.includes("options"), JSON.stringify(voice.guard));
});
