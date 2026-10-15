// round 5 (stream 4A; owner 2026-10-14, lesson 56d898ce): the duplex silence backstop committed an EMPTY turn and she jumped
// to a new topic ("grams aur kilograms"). Silence never advances anything: not the teaching, not the item, not the
// intake. She asks the same thing again, gently; after three quiet turns she checks they can hear her. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, isSilentTurn } from "../server/director/state.js";
import { sessionStartCtx } from "../server/director/session/start.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const quiet = (r) => turn(r, { ...cls("no_evidence"), source: "empty" }, { text: "" });
const start = () => step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });

test("what counts as silence", () => {
  const E = { cls: { outcome: "no_evidence", source: "empty" } };       // what classify.js decides for an empty turn
  assert.equal(isSilentTurn({ event: "turn", text: "", ...E }), true);
  assert.equal(isSilentTurn({ event: "turn", text: "  ", ...E }), true);
  assert.equal(isSilentTurn({ event: "turn" }), false, "a step with no text at all (tests, replays) is not silence");
  assert.equal(isSilentTurn({ event: "turn", text: "", chipId: "req:visual", ...E }), false, "a chip is not silence");
  assert.equal(isSilentTurn({ event: "turn", text: "", answer: "3", ...E }), false, "an answer on the pad is not silence");
  assert.equal(isSilentTurn({ event: "module", text: "", ...E }), false, "an activity turn is not silence");
  assert.equal(isSilentTurn({ event: "turn", text: "haan" }), false);
});

test("teaching: an empty turn re-says the same step, never the next one", () => {
  let r = turn(start(), NE);                      // the hook
  const before = { teachIdx: r.state.teachIdx, phase: r.state.phase, kind: r.move.kind };
  const q = quiet(r);
  assert.equal(q.state.teachIdx, before.teachIdx, "the teach step does not advance");
  assert.equal(q.state.phase, before.phase);
  assert.equal(q.move.kind, before.kind, "the same kind of move");
  assert.match(q.move.shape, /no new topic/);
  // words after the silence take the lesson on as before
  const on = turn(q, NE, { text: "ok" });
  assert.ok(on.state.teachIdx >= before.teachIdx);
});

test("an item on the table: asked again, no hint spent, no new item", () => {
  let r = start();
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, NE);
  const id = r.move.itemId, hint = r.state.hintLevel;
  const q = quiet(r);
  assert.equal(q.move.itemId, id);
  assert.equal(q.state.hintLevel, hint);
  assert.match(q.move.shape, /no rush/);
});

test("three quiet turns: she checks they can hear her, with choices; nothing new", () => {
  let r = turn(start(), NE);
  r = quiet(r); r = quiet(r);
  const third = quiet(r);
  assert.equal(third.move.kind, "break");
  assert.match(third.move.shape, /can hear you/);
  assert.deepEqual(third.ui.chips.map((c) => c.id), ["stop:continue", "break:rest", "stop:end"]);
});

test("the session-first intake: silence never opens a segment (the 14 Oct jump)", () => {
  const saved = process.env.TAXILA_SESSION_FIRST;
  process.env.TAXILA_SESSION_FIRST = "on";
  try {
    const kit6 = kitFromFile(getTopic("c6-maths-ch07-t01"));
    const session = sessionStartCtx({ purpose: "session", child: { id: "c", class_level: 6, school_chapter: { maths: 7 } }, plan: null, levelPathTopic: kit6.topicId, ledger: { skills: {} }, now: 0 });
    let r = step(initLessonState({ topicId: kit6.topicId, kit: kit6, ctx: { ...CTX, classLevel: 6, session }, seed: 7, now: 0 }), { event: "start", kit: kit6, now: 0 });
    assert.equal(r.move.kind, "intake");
    const stage = r.state.intake?.stage, topic = r.state.topicId;
    for (let i = 0; i < 2; i++) {
      r = step(r.state, { event: "turn", kit: kit6, cls: { ...cls("no_evidence"), source: "empty" }, text: "", now: (i + 1) * 20_000 });
      assert.equal(r.state.intake?.stage, stage, "the intake does not move on silence");
      assert.equal(r.state.topicId, topic, "no new topic");
      assert.notEqual(r.move.kind, "intake_agenda");
    }
  } finally { if (saved == null) delete process.env.TAXILA_SESSION_FIRST; else process.env.TAXILA_SESSION_FIRST = saved; }
});

test("voice lane: she never asks the child to draw (no drawing pad exists); her own drawing is untouched", async () => {
  const { speakNotWrite } = await import("../server/brain/say.js");
  assert.equal(speakNotWrite("Ab tum ek circle draw karo aur use 4 parts mein baanto."), "Ab tum ek circle mann mein socho aur use 4 parts mein baanto.");
  assert.equal(speakNotWrite("Drawing banake dikhao!"), "Bolkar batao!");
  assert.equal(speakNotWrite("Ise बनाकर दिखाओ"), "Ise बोलकर बताओ");
  assert.equal(speakNotWrite("Draw it and show me."), "Picture it and tell me.");
  assert.equal(speakNotWrite("Main board par draw karti hoon."), "Main board par draw karti hoon.");
  assert.equal(speakNotWrite("Theek hai, homework ka question bhejo; hum use step by step karenge."), "Theek hai, homework ka question bolo; hum use step by step karenge.");
  assert.equal(speakNotWrite("अपना सवाल भेजो"), "अपना सवाल बोलो");
});
