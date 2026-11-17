// dc-r8-director26 (docs/patches/to-brain/040): the walk and the line on the director26 rows, walked live on today's scripts (the run's
// child lines replayed through the real turn path; the model never called).
import { test } from "node:test";
import assert from "node:assert/strict";
import { textReply, replyDeps, FALLBACK } from "../server/brain/say.js";
import { chat, chatStream } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { replay } from "./fixtures/replay.mjs";

const RUN = "2026-11-17-director26";
const noModel = async () => { throw new Error("the model was called"); };
async function lineAt(persona, T, row1, { model = noModel } = {}) {
  const { kit, plans } = await replay(RUN, persona, T, row1);
  const p = plans.at(-1);
  const st = { ...p.state, recent: [...(p.state.recent ?? [])] };
  replyDeps.chat = model; replyDeps.chatStream = model;
  try {
    return { p, st, out: await textReply({ instructions: instructionsFor(st, kit), state: st, kit, childText: p.child, history: [], ui: p.p.r.ui, module: null }) };
  } finally { replyDeps.chat = chat; replyDeps.chatStream = chatStream; }
}

test("B2: 'bas aaj ke liye itna hi' (c4 stuck 68) gets the authored stop line, with no model call", async () => {
  // (the model, if asked, writes director26's menu: it must not be asked, and its words must not be said)
  let called = 0;
  const menu = async () => { called++; return { text: "Riya, theek hai—tum rukna chahti ho. Buttons mein chuno: aage badhein, thodi der pause lein, ya aaj ke liye padhai rok dein?" }; };
  const { st, out } = await lineAt("stuck", "c4-maths-ch05-t01", 69, { model: menu });
  assert.equal(called, 0, "no model call on the stop turn");
  assert.equal(st.lastMove?.checkin, "stop", "the walk's stop check-in");
  assert.equal(out.reply, FALLBACK.hinglish.checkinStop);
  assert.doesNotMatch(out.reply, /button/i);
});

test("N1: a clarify at the opening's check-in (c5-t02 steering 4) is one authored word, the first point and its check-in — no model call", async () => {
  let called = 0;
  const draft = async () => { called++; return { text: "Koi baat nahi. Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. 1/4 ka 4 batata hai ki patti ke 4 barabar hisse hain. Neeche wali patti bhi utni hi lambi hai. Kya tum bata sakti ho?" }; };
  const { st, out } = await lineAt("steering", "c5-maths-ch02-t02", 5, { model: draft });
  assert.equal(called, 0, "no model call");
  assert.equal(st.lastMove.hookHelp, "clarify");
  const parts = (out.guard.parts?.list ?? []).map((p) => p.part);
  assert.deepEqual(parts.slice(0, 2), ["aside", "body"], "a word to her, then the point");
  assert.ok(out.reply.includes(String(st.lastMove.point).trim()), "the point whole");
  assert.match(out.reply, /\?\s*$/, "ends on a question");
});

test("N1: a give-up at the hook's check-in (c6 steady 4) opens on a word to her, then the point and its card", async () => {
  const { out } = await lineAt("steady", "c6-maths-ch06-t01", 5);
  assert.equal(out.guard.parts.list[0].part, "aside");
  assert.equal(out.guard.parts.list.at(-1).part, "card");
});

test("N1: 'pata nahi, aap batao' at the check-in on the last card's why (c5-t01 steady 128) gets the why's other wording or the go-on line", async () => {
  const { plans } = await replay(RUN, "steady", "c5-maths-ch02-t01", 129);
  const m = plans.at(-1).p.r.state.lastMove;
  assert.ok(m.help?.keyed, "help on the card just keyed");
  assert.ok(m.help.rung === "whyAlt" || m.help.joint === "afterKeyGoOn", JSON.stringify(m.help));
  assert.notEqual(m.kind, "teachback", "not straight to the closing question");
});

test("N1: 'mujhe nahi pata' on a point whose wordings are spent (c5-t02 stuck 28) gets a word before the card", async () => {
  const { plans } = await replay(RUN, "stuck", "c5-maths-ch02-t02", 29);
  const m = plans.at(-1).p.r.state.lastMove;
  assert.equal(m.help?.card, "ask");
  assert.equal(m.help?.joint, "helpToCard");
  assert.ok(String(m.simpler ?? "").trim().length > 0, "the word is said");
});
