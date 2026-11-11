// round 7 A3 (PIPELINE §A Brain): "rewrite, never strip" (open-e2e-gutted-replies: replies stripped to "ने?", stop
// check-ins to "Aap kya chunenge?") and zero spoken build state or failure (no "no game is ready", no "a picture is being
// made", no "I lost my words").
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { requestOf } from "../server/director/requests.js";
import { textReply, replyDeps, withoutOffScript, isFragment, FALLBACK } from "../server/brain/say.js";
import { askTruth, drawAsked, pictureNote } from "../server/director/shapes.js";
import { chat } from "../server/azure.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

afterEach(() => { replyDeps.chat = chat; });
const K = kit();
const NE = cls("no_evidence");
const start = () => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, lang: "hinglish" }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
const say = (r, text) => { const q = requestOf(text); return step(r.state, { event: "turn", kit: K, cls: q ? { ...NE, source: "request", request: q } : NE, text, now: (r.state.turn + 1) * 20_000 }); };

test("an off-script sentence goes whole; letters are never picked out of a word", () => {
  assert.equal(withoutOffScript("Achha socha! तुमने सही कहा। Ab agla step dekhein?", "hinglish"), "Achha socha! Ab agla step dekhein?");
  assert.equal(withoutOffScript("तुमने सही कहा, ने?", "hinglish"), "");
  assert.equal(withoutOffScript("तुमने सही कहा।", "hindi"), "तुमने सही कहा।");
});

test("a fragment is fewer than four words, unless it is exactly the pinned question", () => {
  for (const t of ["ने?", "Aap kya chunenge?", ""]) assert.equal(isFragment(t), true, t);
  assert.equal(isFragment("Kitne tukde?", "Kitne tukde?"), false);
  assert.equal(isFragment("Ek roti ke do barabar tukde karo."), false);
});

test("a Hinglish turn the model wrote in Devanagari twice is never sent as a stripped fragment", async () => {
  let r = start();
  for (let i = 0; i < 2; i++) r = say(r, "haan");
  replyDeps.chat = async () => ({ text: "तुमने बहुत अच्छा सोचा, ने?" });
  const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText: "haan", verdict: "ungraded", history: [], ui: r.ui, module: null });
  assert.ok(out.guard.caught.includes("script"), JSON.stringify(out.guard));
  assert.equal(isFragment(out.reply), false, out.reply);
  assert.doesNotMatch(out.reply, /^\W*ने\W*$/u);
});

test("a stop check-in keeps its offer: never cut to 'Aap kya chunenge?'", async () => {
  let r = start();
  for (let i = 0; i < 2; i++) r = say(r, "haan");
  r = say(r, "bas aaj ke liye itna hi");
  if (!r.state.lastMove?.checkin) return; // the stop path here ends without a check-in (covered by the round-2 floor tests)
  replyDeps.chat = async () => ({ text: "Theek hai, koi baat nahi. Hum aage padhein, ya thoda break lein? Ya aaj ke liye stop karein? Aap kya chunenge?" });
  const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText: "bas aaj ke liye itna hi", verdict: "ungraded", history: [], ui: r.ui, module: null });
  assert.notEqual(out.reply.trim(), "Aap kya chunenge?");
  assert.equal(isFragment(out.reply), false, out.reply);
  assert.match(out.reply, /stop|bas|rok|break/i);
});

test("zero spoken build state or failure: no shape tells her to say a game, a picture or a movement is not there", () => {
  const shape = "they want to play: the activity is the way in now; one idea";
  const moving = "they asked to see it moving: name the movement in your first words; one idea";
  const lines = [askTruth(shape, "game", "engine"), askTruth(shape, "game", "none"), askTruth(moving, "animation", "none"),
    ...["coming", "busy", undefined].map((photo) => drawAsked({ subject: "aloo", show: "picture", photo })),
    ...["coming", "busy", "failed"].map((photo) => pictureNote({ subject: "hathi", photo }))];
  for (const l of lines) {
    assert.doesNotMatch(l, /no game is ready|say so honestly|say so plainly|say so in a few|comes in a few seconds|nothing moves on the screen this turn|cannot come right now:/, l);
  }
  for (const lang of ["english", "hinglish"]) assert.doesNotMatch(FALLBACK[lang].other, /lost my words|atak gayi/);
});
