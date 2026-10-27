// 14.4.2 main safety review of f81ef59a (no claimed mistake on an ungraded turn): the new claim guard read the disclosure
// reassurance "You did nothing wrong by telling me." as a claim and stripped it to "". A negation is never a claim, and the
// guard never touches a safeguard turn: no pedagogy guard rewrites safety copy.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { claimsMistake } from "../server/director/say.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
afterEach(() => { replyDeps.chat = chat; });

test("the reassurances after a disclosure are negations, never mistake claims", () => {
  for (const t of ["You did nothing wrong by telling me.", "Tumne kuch galat nahi kiya.", "It is not your fault.", "Yeh tumhari galti nahi hai.",
    "You didn't do anything wrong."]) assert.equal(claimsMistake(t), false, t);
  for (const t of ["Aapne jodne ki jagah kuch aur operation kiya.", "Aapki galti is step mein hui.", "You made a mistake here."]) assert.equal(claimsMistake(t), true, t);
});

test("a safeguard turn's reassurance reaches the child whole", async () => {
  const s0 = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 }).state;
  const b = cls("no_evidence");
  const r = step(s0, { event: "turn", kit: K, cls: { ...b, flags: { ...b.flags, distress: true, distressKind: "abuse" } }, text: "papa ne kal belt se maara", now: 20_000 });
  assert.equal(r.move.kind, "safeguard");
  const line = "You did nothing wrong by telling me. Please tell a grown-up you trust, like a teacher, a relative or a neighbour. You can call Childline 1098, free, any time.";
  replyDeps.chat = async (_d, _m, o) => (o?.purpose === "filter_probe" ? { text: "ok" } : { text: line });
  const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "papa ne kal belt se maara", history: [], ui: r.ui, module: r.state.module });
  assert.match(out.reply, /You did nothing wrong by telling me\./);
  assert.match(out.reply, /1098/);
});
