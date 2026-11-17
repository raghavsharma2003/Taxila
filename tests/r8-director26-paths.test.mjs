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

test("J1: the go-on line is not said where the back-to joint follows (the seam pass drops it)", async () => {
  const { seamPass } = await import("../server/brain/seams.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const kit = kitFromFile(getTopic("c6-maths-ch06-t01"));
  const go = "Koi baat nahi, parimap ke aise sawaal aage phir aayenge; abhi aage badhte hain.";
  const list = [{ part: "close", text: go }, { part: "body", text: "Kinaare par ek baar dhaaga lapetna hai." }, { part: "card", text: "Kitna dhaaga lagega?" }];
  const r = seamPass(list, { kit, state: { ctx: { lang: "hinglish" } }, lang: "hinglish", info: { returnCard: true, helpJoint: { kind: "afterKeyGoOn", form: go, by: "authored" } } });
  const text = r.list.map((p) => p.text).join(" ");
  assert.ok(!text.includes("abhi aage badhte hain"), text);
  assert.ok(!r.seams.some((x) => x.joint === "afterKeyGoOn") || !r.seams.some((x) => x.joint === "backTo"), JSON.stringify(r.seams));
});

test("J1: a worked step whose ladder is empty (c6 stuck 44) goes on to the next step with no go-on promise", async () => {
  const { plans } = await replay(RUN, "stuck", "c6-maths-ch06-t01", 45);
  const m = plans.at(-1).p.r.state.lastMove;
  assert.equal(m.help?.card, "goOn");
  assert.ok(!m.help?.joint, "no joint: the next step opens on its own frame");
  assert.ok(!(m.sayFirst ?? []).some((x) => /phir aay|dobara/i.test(x)), "no promise");
});

test("J1: a right verdict into the worked problem (c6 steady 16) takes beforeWorked (code's form while the script has none)", async () => {
  const { out } = await lineAt("steady", "c6-maths-ch06-t01", 17, { model: async () => ({ text: "Sahi jawab." }) });
  const s = (out.guard.seams ?? []).find((x) => x.joint === "beforeWorked");
  assert.ok(s, JSON.stringify(out.guard.seams));
  assert.ok(out.reply.indexOf(s.form) < out.reply.indexOf("Phoolon"), out.reply);
});
