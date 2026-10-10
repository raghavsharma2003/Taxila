// round 4 (stream 4A, patch 14): the stall loop owner-2 found on prod-like runs at seeds 7 and 1010 (R5.loop,
// s5-zoya-typed-c5-evs-ch01-t01): "ek min... haan bolo" kept the same faded step on the card for 4 turns. The sequence is
// replayed here through step(): the pose, "sorry kya bola? samajh nahi aaya" (confused), "mummy bula rahi thi, haan"
// (back), "ek min... haan bolo" (a filler with no code reading; the UNDERSTAND note read it as "slower", which the card cap
// exempted). The card must move down the support ladder (choices, a hint rung) or be resolved, never re-posed unchanged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, LIMITS } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { readIntent } from "../server/conversation/lexicon.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const EVS = kitFromFile(getTopic("c5-evs-ch01-t01"));
const NE = cls("no_evidence");
const withReq = (type, src) => ({ ...NE, request: { type, whole: true, src } });
const turn = (r, c, text = "") => step(r.state, { event: "turn", kit: EVS, cls: c, text, typed: true, now: (r.state.turn + 1) * 20_000 });

/** A lesson walked to its first practice question (the faded step on this kit, as in the owner-2 run). */
function toPractice() {
  const s0 = initLessonState({ topicId: EVS.topicId, kit: EVS, ctx: { ...CTX, lang: "hinglish", classLevel: 5, ageBand: "10-15" }, seed: 7, now: 0 });
  let r = step(s0, { event: "start", kit: EVS, now: 0 });
  for (let i = 0; i < 20 && !(r.state.phase === "practice" && r.move.itemId); i++) r = turn(r, NE);
  assert.ok(r.move.itemId, "reached a practice question");
  return r;
}
const askOf = (r) => r.ui?.ask?.text ?? null;

test("'ek min... haan bolo' stays a filler in code (p5-interaction NEG); only a model's guess reads it, and that guess never holds the card", () => {
  assert.equal(readIntent("ek min... haan bolo"), null);
  assert.equal(readIntent("mummy bula rahi thi, haan")?.type, "back");
});

test("the owner-2 stall: the same card is never pinned past the cap, and a back on a held card moves down the support ladder", () => {
  let r = toPractice();
  const item = r.move.itemId;
  const ask0 = askOf(r);
  r = turn(r, withReq("confused", "p5"), "sorry kya bola? samajh nahi aaya");
  r = turn(r, withReq("back", "p5"), "mummy bula rahi thi, haan");
  // the back on a card already held two turns is not the same card again: choices on screen, or a hint rung
  const laddered = (r.ui?.chips?.length ?? 0) > 0 || r.move.kind === "hint" || r.move.itemId !== item;
  assert.ok(laddered, `the back moved down the ladder (kind ${r.move.kind}, chips ${r.ui?.chips?.length ?? 0})`);
  // the model's guess ("slower") on "ek min... haan bolo" never holds the card past the cap
  r = turn(r, withReq("slower", "note"), "ek min... haan bolo");
  assert.ok(!(r.move.itemId === item && askOf(r) === ask0 && (r.state.pinRun ?? 0) > LIMITS.cardMax), `pinned ${r.state.pinRun} turns`);
  assert.ok((r.state.pinItem !== item) || (r.state.pinRun ?? 0) <= LIMITS.cardMax, `card cap held (pin ${r.state.pinItem} × ${r.state.pinRun})`);
});

test("a child's own words to have the question again are still honoured once past the cap (round 3 repeat / clarify)", () => {
  let r = toPractice();
  const item = r.move.itemId;
  r = turn(r, NE, "hmm");
  r = turn(r, NE, "umm");
  r = turn(r, withReq("repeat", "p5"), "phir se bolo");
  assert.equal(r.move.itemId, item, "the repeat they asked for is the same question");
});

test("the teach-back protégé never shares the child's first name (owner-2: Golu was told 'tum Golu ko sikhaoge')", async () => {
  const { protegeNotChild } = await import("../server/director/state.js");
  const golu = protegeNotChild({ firstName: "Golu", protege: { name: "Golu", what: "a pretend baby elephant" } });
  assert.notEqual(golu.protege.name.toLowerCase(), "golu");
  assert.equal(golu.protege.what, "a pretend baby elephant");
  const other = { firstName: "Aarav", protege: { name: "Golu", what: "x" } };
  assert.equal(protegeNotChild(other), other, "unchanged when the names differ");
  const s = initLessonState({ topicId: EVS.topicId, kit: EVS, ctx: { ...CTX, firstName: "bittu", protege: { name: "Bittu", what: "y" } }, seed: 1, now: 0 });
  assert.notEqual(s.ctx.protege.name.toLowerCase(), "bittu");
});

test("bareAck: a bare acknowledgement, never content (lever 5's trigger)", async () => {
  const { bareAck } = await import("../server/conversation/lexicon.js");
  for (const t of ["haan", "ok", "hmm", "achha", "theek hai, aage", "हाँ", "अच्छा", "lol theek hai", "haha ok bhai"]) assert.equal(bareAck(t), true, t);
  for (const t of ["haan ready hoon", "liquid", "haan, evaporation", "pata nahi", "samajh nahi aaya", "ok 4", "ek min... haan bolo"]) assert.equal(bareAck(t), false, t);
});

test("lever 5 (TAXILA_ACK_CLOSE): off by default; on, a bare okay to a teaching question holds the step ONCE, then it advances", async () => {
  const { ackCloseOn } = await import("../server/director/state.js");
  assert.equal(ackCloseOn({}), false, "default off");
  const was = process.env.TAXILA_ACK_CLOSE;
  try {
    const s0 = initLessonState({ topicId: EVS.topicId, kit: EVS, ctx: { ...CTX, lang: "hinglish", classLevel: 5, ageBand: "10-15" }, seed: 7, now: 0 });
    let r = step(s0, { event: "start", kit: EVS, now: 0 });
    r = turn(r, NE, "haan ready hoon");
    assert.equal(r.move.kind, "hook");
    const withAsk = (rr, q) => ({ ...rr, state: { ...rr.state, recent: [...(rr.state.recent ?? []), { who: "teacher", text: q }] } });
    const hookQ = "Kitchen mein garam chai se bhaap uthti hai. Aapke hisaab se woh bhaap thandi hokar kis form mein badlegi?";
    delete process.env.TAXILA_ACK_CLOSE;
    const off = turn(withAsk(r, hookQ), NE, "ok");
    assert.notEqual(off.move.kind, "reteach", "off: the next teach step as before");
    process.env.TAXILA_ACK_CLOSE = "on";
    const held = turn(withAsk(r, hookQ), NE, "ok");
    assert.equal(held.move.kind, "reteach", "on: held");
    assert.equal(held.state.teachIdx, r.state.teachIdx, "the teach step did not advance");
    assert.ok(String(held.move.shape).includes("bhaap thandi"), "her own question is named");
    // a second bare okay on the same step moves on (never a stall)
    const next = turn(withAsk(held, "Toh bhaap thandi hokar paani ban jaati hai. Samajh aaya?"), NE, "haan");
    assert.equal(next.move.kind, off.move.kind, "advances exactly as the off path did");
    // content, not an okay: no hold
    assert.notEqual(turn(withAsk(r, hookQ), NE, "paani ban jayegi").move.kind, "reteach");
  } finally {
    if (was === undefined) delete process.env.TAXILA_ACK_CLOSE; else process.env.TAXILA_ACK_CLOSE = was;
  }
});
