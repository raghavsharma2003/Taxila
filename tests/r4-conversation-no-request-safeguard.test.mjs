// Round 4, stream 4A: a request alone never becomes a safeguard (main session, 2026-10-10: in stream 5's owner-4 run on a
// local prod build, the typed line "explain it differently" was answered with the safeguard move and the helplines; on base
// the same line got a reteach). Reproduction on the live models, n = 20 per line, 5 lines (that line, "samjhao alag tarike
// se", "phir se samjhao", "explain again", "I don't get it, explain differently"): the classifier's distress read 0/100,
// the UNDERSTAND note 0/96 (4 unavailable), the fallback deployment as the distress reader 0/100. So the words alone do not
// make it; this file pins the code side: with no distress flag (predicate, model read, note, content filter, duplex
// partial, the relational third-party floor) and no safeguard already held, NO request type and NO note intent other than
// distress ever plans the safeguard move. Pure: no model, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { applyNote, requestFromNote } from "../server/conversation/policy.js";
import { findItem } from "../server/director/items.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const NE = cls("no_evidence");
const LINES = ["explain it differently", "samjhao alag tarike se", "phir se samjhao", "explain again", "I don't get it, explain differently",
  "example do", "story ki tarah batao", "slowly please", "Hindi mein samjhao", "English mein batao please", "aur batao", "harder wala do",
  "diagram dikhao", "game khelte hain", "skip karo", "ye mujhe aata hai aage chalo", "mujhse nahi hoga ye", "thak gaya hoon", "boring hai"];

function lessonAt(phase) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 5, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 30 && (phase === "practice" ? r.state.phase !== "practice" || !r.move.itemId : r.state.phase !== phase); i++) {
    r = step(r.state, { event: "turn", kit: K, cls: NE, now: (r.state.turn + 1) * 20_000 });
  }
  return r;
}

test("no request said in words plans the safeguard move when nothing flagged distress (teach and practice)", () => {
  for (const phase of ["teach", "practice"]) {
    const r0 = lessonAt(phase);
    assert.equal(r0.state.safeguard, null, "nothing held before the line");
    for (const text of LINES) {
      const target = targetFor(r0.state, K, findItem(r0.state, K, r0.state.activeItemId));
      const fast = classifyFast({ target, childText: text, typed: true });
      const c = fast.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: fast.flags, request: fast.request };
      assert.equal(c.flags.distress, false, `${phase} "${text}": the code floor is quiet`);
      const r = step(r0.state, { event: "turn", kit: K, cls: c, text, now: (r0.state.turn + 1) * 20_000 });
      assert.notEqual(r.move.kind, "safeguard", `${phase} "${text}" (request ${c.request?.type ?? "-"}) planned a safeguard`);
      assert.equal(r.state.safeguard, null, `${phase} "${text}": no safeguard held after it`);
    }
  }
});

test("no UNDERSTAND note intent but distress raises the distress flag; its request never plans a safeguard", () => {
  const INTENTS = ["explain_differently", "example", "story", "visual_request", "game_request", "animation_request", "slower", "skip_ahead",
    "harder", "easier", "repeat", "change_topic", "skip_item", "joke", "small_talk", "identity", "personal_share", "meta_feedback",
    "method_instruction", "boredom", "frustration", "break_request", "thinking_aloud", "noise", "end_request", "leaving"];
  const r0 = lessonAt("practice");
  for (const intent of INTENTS) {
    const note = { intent, also: [], distress: false, inBounds: true, topic: "x", confidence: 0.9 };
    const out = applyNote({ ...NE, flags: { ...NE.flags } }, note);
    assert.equal(!!out.flags.distress, false, intent);
    const req = requestFromNote(note);
    const c = { ...out, ...(req ? { request: req } : {}) };
    const r = step(r0.state, { event: "turn", kit: K, cls: c, text: "x", now: (r0.state.turn + 1) * 20_000 });
    assert.notEqual(r.move.kind, "safeguard", `note intent ${intent} planned a safeguard`);
  }
  // the floor still holds: the note's distress, or a distress flag, is a safeguard
  const sg = applyNote({ ...NE, flags: { ...NE.flags } }, { intent: "explain_differently", also: [], distress: true, inBounds: true, confidence: 0.9 });
  assert.equal(sg.flags.distress, true);
  assert.equal(step(r0.state, { event: "turn", kit: K, cls: sg, text: "x", now: (r0.state.turn + 1) * 20_000 }).move.kind, "safeguard");
});
