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
