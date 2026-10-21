// census 14.5 (F1, topic not followed). Production traces (Director lane): a child asked three times for another topic and
// got the same offer of ways into today's idea each time (3437b744, e6392332); a topic ask the classifier also read as a
// stop got the stop check-in instead (6c45a7ea t12). Now an explicit topic ask is never met with the stop check-in, and a
// "something else" asked again within a few turns offers real topics of the child's class as buttons. Pure.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const NE = cls("no_evidence");
const ask = (extraFlags = {}) => ({ outcome: "no_evidence", confidence: 1, source: "model", request: { type: "change_topic", whole: true },
  flags: { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false, ...extraFlags } });
function toPractice() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, NE);
  return r;
}
const SAVED = { ...process.env };
describe("census F1: topic asks", () => {
  afterEach(() => { for (const k of ["TAXILA_P5", "TAXILA_P5_STEER"]) { if (k in SAVED) process.env[k] = SAVED[k]; else delete process.env[k]; } });

  test("a topic ask the classifier also read as a stop is the topic ask, never the stop check-in", () => {
    const r = turn(toPractice(), ask({ wantsToStop: true }), { text: "kuch aur padhte hain" });
    assert.notEqual(r.move.checkin, "stop");
    assert.equal(r.move.request, "change_topic");
    // a goodbye still ends
    const bye = turn(toPractice(), { ...ask({ wantsToStop: true }), request: { type: "goodbye", whole: true } }, { text: "bye didi" });
    assert.ok(bye.end || bye.move.kind === "wrap" || bye.move.checkin === "stop");
  });

  test("asked again within a few turns: real topics of the class, as buttons; the first ask keeps the ways in", () => {
    const first = turn(toPractice(), ask(), { text: "kuch aur padhte hain" });
    assert.ok(!(first.ui.chips ?? []).some((c) => String(c.id).startsWith("switch:")), "the first ask keeps today's ways in");
    const second = turn(first, ask(), { text: "nahi, kuch aur padhte hain na" });
    const sw = (second.ui.chips ?? []).filter((c) => String(c.id).startsWith("switch:"));
    assert.ok(sw.length >= 1, `chips: ${JSON.stringify(second.ui.chips)}`);
    assert.ok(sw.every((c) => c.id !== `switch:${K.topicId}`), "never today's topic");
    assert.ok((second.ui.chips ?? []).some((c) => c.id === "stop:continue"));
    assert.match(second.move.shape, /asked again for something else/);
  });
});

// census 14.5 (F1, 2790c473: "leave school talk, I want progressions" kept the planned topic): the intake reads a wish to
// study ("X padhna hai", Roman and Devanagari) and finds the topic for a loanword the recogniser wrote in Devanagari
import { intakeParse } from "../server/director/session/intake.js";
import { intakeCandidates } from "../server/director/session/candidates.js";
const topOf = (t, cl) => { const f = intakeParse(t); const c = intakeCandidates(f, t, { classLevel: cl }); return { kind: f.kind, top: c.top?.topicId ?? null }; };
test("the intake reads 'X padhna hai' as a wish and finds X, in Roman and in Devanagari", () => {
  assert.deepEqual(topOf("school ki baat chhodo, mujhe progression padhna hai", 9), { kind: "want", top: "c9-maths-ch08-t02" });
  assert.deepEqual(topOf("स्कूल की बात छोड़ो, मुझे प्रोग्रेशन पढ़ना है", 9), { kind: "want", top: "c9-maths-ch08-t02" });
  assert.deepEqual(topOf("मुझे जियोमेट्रिक प्रोग्रेशन पढ़ना है", 9), { kind: "want", top: "c9-maths-ch08-t03" });
  assert.equal(topOf("मुझे सिमेट्री पढ़नी है", 6).top, "c6-maths-ch09-t01");
});
test("a Hindi function word never matches a Hindi chapter title; a Hindi word is never a loanword ('sakti' is not 'society')", () => {
  assert.equal(topOf("मुझे पौधों के बारे में पढ़ना है", 5).top, null);
  assert.equal(topOf("पता नहीं… मुझे नहीं आता ये", 7).top, null);
  assert.equal(topOf("तो 10 cm की जीवा नहीं हो सकती", 9).top, null);
  // a real Hindi title still meets its own words
  assert.equal(topOf("हार की जीत पढ़नी है", 6).top, "c6-hindi-ch04-t01");
});

// with 14.4's check-in (state.js decide): a stop read in words on an open check-in is released into the lesson's own stop
// handling; a topic ask that was also read as a stop is then the topic ask, after the one warm line, with no stop offer
test("a topic ask read as a stop on an open check-in: released, the one warm line, then the topic ask (no second offer)", () => {
  const b = cls("no_evidence");
  const fresh = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 }).state;
  const at = (st, text, c) => step(st, { event: "turn", kit: K, cls: c, text, now: 20_000 });
  const open = at(fresh, "sab bekaar lagta hai", { ...b, source: "model", flags: { ...b.flags, distress: true, distressKind: "model", distressAbout: "sad_or_lonely" } }).state;
  assert.equal(open.safeguard?.tier, "check");
  const r = at(open, "kuch aur padhte hain", { ...b, request: { type: "change_topic", whole: true }, flags: { ...b.flags, wantsToStop: true } });
  assert.equal(r.state.safeguard, null);
  assert.equal(r.move.request, "change_topic");
  assert.notEqual(r.move.checkin, "stop");
  assert.ok(!(r.ui?.chips ?? []).some((c) => c.id === "stop:end"), JSON.stringify(r.ui?.chips));
  assert.equal((r.move.shape.match(/tell you or a grown-up they trust/g) ?? []).length, 1);
});
