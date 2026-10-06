// Round 2, stream latency (no network, no database): the perceive stage the turn and the turn prefetch share
// (server/latency/perceive.js), the adopt rule (identical inputs only), the note-parallel reply, the prefetch store's TTL
// and rate limit, and the device half (src/latency/prefetch.ts: when the stable partial is sent).
// Hooks live inside describe blocks (npm test runs every file in one process).
import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { perceive, fingerprint, clsInputs, adoptPrefetch, putPrefetch, allowPrefetch, isNonAnswer, PREFETCH_TTL_MS, PREFETCH_PER_MIN, __test } from "../server/latency/perceive.js";
import { TurnPrefetcher } from "../src/latency/prefetch.ts";

const flush = () => new Promise((r) => setImmediate(r));
const deferred = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, res, rej }; };

/** Fake deps that record calls; classify / note / reply resolve when the test says so. */
function fakeDeps({ fast = { result: null, flags: { offTopic: false } }, conv2 = "on" } = {}) {
  const calls = { classify: 0, note: 0, speculate: 0, plan: 0, reply: 0 };
  const cls = deferred(), note = deferred();
  const d = {
    classifyFast: () => structuredClone(fast),
    classify: () => { calls.classify++; return cls.p; },
    understand: () => { calls.note++; return note.p; },
    speculate: (state, target, flags, ctx) => { calls.speculate++; return [Promise.resolve({ key: "spec:no_evidence", trace: [], result: Promise.resolve({ reply: "spec", guard: { caught: [] } }) })]; },
    planTurn: async (state, c) => { calls.plan++; return { r: { hold: false, state: { recent: [], key: `plan:${c.outcome}:${c.flags?.offTopic ? "off" : "on"}` }, ui: {} }, instructions: "I" }; },
    replyKey: (next) => next.key,
    textReply: async () => { calls.reply++; return { reply: "parallel", guard: { caught: [] } }; },
    conv2Mode: () => conv2,
    now: () => 1234,
  };
  return { d, calls, cls, note };
}
const input = (over = {}) => ({ classified: true, clsArgs: { target: { mode: "item", key: "8" }, childText: "aath", heard: "kitne?", lang: "hinglish", typed: false, classLevel: 4, trace: [] },
  state: {}, target: { mode: "item" }, planCtx: { kit: {} }, said: "aath", historyOf: (n) => n.recent, textLane: true, late: false, help: null, childText: "aath",
  noteArgs: { said: "aath" }, ...over });

describe("perceive (the turn's perceive stage)", () => {
  test("mirrors the turn: specs and the note only when the bytes decided nothing; one clock", async () => {
    const { d, calls } = fakeDeps();
    const P = perceive(d, input());
    assert.equal(P.now, 1234);
    assert.equal(calls.classify, 1);
    assert.equal(calls.note, 1);
    assert.equal(calls.speculate, 1);
    assert.equal(P.specs.length, 1);
    const decided = fakeDeps({ fast: { result: { outcome: "correct" }, flags: {} } });
    const Q = perceive(decided.d, input());
    assert.equal(decided.calls.note, 0, "a byte-decided turn never asks the note");
    assert.equal(Q.specs.length, 0);
    assert.equal(decided.calls.classify, 1, "classify still runs (its model distress read)");
  });

  test("the note is skipped on a typed lane, a late turn, a help request, a low-ASR turn, and when CONV2 is off", () => {
    for (const [over, deps] of [[{ late: true }, {}], [{ help: "hint" }, {}], [{}, { conv2: "off" }], [{}, { fast: { result: null, lowAsr: true, flags: {} } }], [{ noteArgs: null }, {}]]) {
      const { d, calls } = fakeDeps(deps);
      perceive(d, input(over));
      assert.equal(calls.note, 0, JSON.stringify(over) + JSON.stringify(deps));
    }
  });

  test("note-parallel: a non-answer with the note still out writes the no-note reply at once", async () => {
    const { d, calls, cls } = fakeDeps();
    const P = perceive(d, input());
    cls.res({ outcome: "no_evidence", flags: { offTopic: true } });
    assert.equal(await P.noteParallel, "launched");
    assert.equal(calls.reply, 1);
    assert.equal(P.specs.length, 2, "the no-note reply joins the specs pickSpeculation reads");
    const s = await P.specs[1];
    assert.equal(s.key, "plan:no_evidence:off");
    assert.equal((await s.result).reply, "parallel");
  });

  test("note-parallel never runs for an answer, a request, distress, or when the note is already in", async () => {
    for (const c of [{ outcome: "correct", flags: {} }, { outcome: "no_evidence", request: { type: "repeat" }, flags: {} }, { outcome: "no_evidence", flags: { distress: true } }]) {
      const { d, calls, cls } = fakeDeps();
      const P = perceive(d, input());
      cls.res(c);
      assert.equal(await P.noteParallel, null, JSON.stringify(c));
      assert.equal(calls.reply, 0);
    }
    const { d, calls, cls, note } = fakeDeps();
    const P = perceive(d, input());
    note.res({ intent: "dont_know" });
    await flush();
    cls.res({ outcome: "no_evidence", flags: {} });
    assert.equal(await P.noteParallel, null, "the note is in: the turn plans on it directly");
    assert.equal(calls.reply, 0);
  });

  test("note-parallel does not write a second reply for a key a spec already covers", async () => {
    const { d, calls, cls } = fakeDeps();
    d.planTurn = async () => ({ r: { hold: false, state: { recent: [], key: "spec:no_evidence" }, ui: {} }, instructions: "I" });
    const P = perceive(d, input());
    cls.res({ outcome: "no_evidence", flags: {} });
    assert.equal(await P.noteParallel, "dup");
    assert.equal(calls.reply, 0);
  });

  test("isNonAnswer", () => {
    assert.equal(isNonAnswer({ outcome: "no_evidence", flags: {} }), true);
    assert.equal(isNonAnswer({ outcome: "no_evidence", help: "hint", flags: {} }), false);
    assert.equal(isNonAnswer({ outcome: "incorrect", flags: {} }), false);
    assert.equal(isNonAnswer(null), false);
  });
});

describe("the prefetch store and the adopt rule", () => {
  beforeEach(() => __test.clear());
  const args = { target: { mode: "item", key: "8" }, childText: "aath", heard: "kitne?", lang: "hinglish", typed: false, classLevel: 4, asrConfidence: undefined, trace: [] };
  const state = { turn: 3, recent: [{ who: "teacher", text: "kitne?" }] };

  test("the fingerprint ignores the trace and the ASR confidence, and moves with the words, the state and the barge-in", () => {
    const fp = fingerprint({ lessonId: "L", state, clsArgs: args });
    assert.equal(fingerprint({ lessonId: "L", state, clsArgs: { ...args, asrConfidence: 0.93, trace: [{ x: 1 }] } }), fp);
    assert.notEqual(fingerprint({ lessonId: "L", state, clsArgs: { ...args, childText: "aath." } }), fp, "one character");
    assert.notEqual(fingerprint({ lessonId: "L", state: { ...state, turn: 4 }, clsArgs: args }), fp, "a committed turn");
    assert.notEqual(fingerprint({ lessonId: "L", state, clsArgs: { ...args, heard: "aur?" } }), fp);
    assert.notEqual(fingerprint({ lessonId: "L", state, clsArgs: args, bargeIn: true }), fp);
    assert.notEqual(fingerprint({ lessonId: "M", state, clsArgs: args }), fp);
    assert.equal(clsInputs(args).length, 8);
  });

  test("adopt only on the same fingerprint AND the same classifyFast result (the real ASR confidence); once", () => {
    const fast = { result: null, flags: {} };
    const fp = fingerprint({ lessonId: "L", state, clsArgs: args });
    putPrefetch("L", { fp, P: { fast, clsP: Promise.resolve(null) }, trace: [] }, 1000);
    assert.equal(adoptPrefetch("L", { fp: "other", fast }, 1100), null, "another fingerprint");
    const got = adoptPrefetch("L", { fp, fast }, 1500);
    assert.ok(got?.prefetch?.adopted);
    assert.equal(got.prefetch.aheadMs, 500);
    assert.equal(adoptPrefetch("L", { fp, fast }, 1600), null, "consumed");
    putPrefetch("L", { fp, P: { fast, clsP: Promise.resolve(null) }, trace: [] }, 1000);
    assert.equal(adoptPrefetch("L", { fp, fast: { result: null, flags: {}, lowAsr: true } }, 1100), null, "a low-confidence final decides differently");
  });

  test("an entry older than the TTL is never adopted", () => {
    const fast = { result: null, flags: {} };
    putPrefetch("L", { fp: "f", P: { fast }, trace: [] }, 0);
    assert.equal(adoptPrefetch("L", { fp: "f", fast }, PREFETCH_TTL_MS + 1), null);
  });

  test("the newest prefetch of a lesson replaces the older one", () => {
    const fast = { result: null, flags: {} };
    putPrefetch("L", { fp: "a", P: { fast }, trace: [] }, 0);
    putPrefetch("L", { fp: "b", P: { fast }, trace: [] }, 10);
    assert.equal(adoptPrefetch("L", { fp: "a", fast }, 20), null);
    assert.ok(adoptPrefetch("L", { fp: "b", fast }, 20));
  });

  test("rate limit per lesson per rolling minute", () => {
    for (let i = 0; i < PREFETCH_PER_MIN; i++) assert.equal(allowPrefetch("L", 1000 + i), true);
    assert.equal(allowPrefetch("L", 2000), false);
    assert.equal(allowPrefetch("M", 2000), true, "another lesson");
    assert.equal(allowPrefetch("L", 62_000), true, "a minute later");
  });
});

describe("TurnPrefetcher (the device rule)", () => {
  function rig(opts = {}) {
    const timers = [];
    const posts = [];
    const p = new TurnPrefetcher({ lessonId: "L", post: async (b) => { posts.push(b); }, setTimer: (fn, ms) => { const t = { fn, ms, live: true }; timers.push(t); return t; },
      clearTimer: (t) => { t.live = false; }, ...opts });
    const fire = () => { for (const t of timers.splice(0)) if (t.live) t.fn(); };
    return { p, posts, fire, timers };
  }

  test("sends the stable partial once the child is quiet and the deltas stopped", () => {
    const { p, posts, fire } = rig();
    p.onPartial("i1", "Baarah edges");
    fire();
    assert.equal(posts.length, 0, "still speaking: nothing");
    p.onPartial("i1", "Baarah edges aur aath corners.");
    p.onQuiet();
    fire();
    assert.deepEqual(posts, [{ lessonId: "L", text: "Baarah edges aur aath corners." }]);
  });

  test("speech again cancels; the same text is never sent twice; at most maxPerItem per item; final resets", () => {
    const { p, posts, fire } = rig({ maxPerItem: 2 });
    p.onPartial("i1", "Chhe");
    p.onQuiet();
    p.onSpeech();
    fire();
    assert.equal(posts.length, 0, "the child went on");
    p.onQuiet();
    fire();
    assert.equal(posts.length, 1);
    p.onQuiet();
    fire();
    assert.equal(posts.length, 1, "same text");
    p.onPartial("i1", "Chhe faces");
    fire();
    p.onPartial("i1", "Chhe faces hain");
    fire();
    assert.equal(posts.length, 2, "capped at 2");
    p.onFinal();
    p.onPartial("i2", "Haan");
    p.onQuiet();
    fire();
    assert.equal(posts.length, 3, "a new item starts over");
  });

  test("carries the barge-in bit; disabled sends nothing", () => {
    const { p, posts, fire } = rig();
    p.setInterrupted(true);
    p.onPartial("i1", "ruko");
    p.onQuiet();
    fire();
    assert.equal(posts[0].teacherInterrupted, true);
    const off = rig({ enabled: false });
    off.p.onPartial("i1", "aath");
    off.p.onQuiet();
    off.fire();
    assert.equal(off.posts.length, 0);
  });
});

describe("the SHADOW ack (server/latency/ack.js)", async () => {
  const { ackOf, answerTokenOf } = await import("../server/latency/ack.js");
  const base = { turn: 5, predicateDistress: false };
  const graded = (outcome, flags = {}) => ({ outcome, flags, source: "model" });

  test("the child's answer token: the last number (digits or a number word)", () => {
    assert.equal(answerTokenOf("Mujhe lagta hai dice ke chhe faces hain."), "chhe");
    assert.equal(answerTokenOf("Baarah edges aur aath corners."), "aath");
    assert.equal(answerTokenOf("12 hai"), "12");
    assert.equal(answerTokenOf(""), null);
  });

  test("an echo only on a graded answer, the same for right and wrong (never a verdict)", () => {
    const right = ackOf({ ...base, text: "chhe faces", cls: graded("correct") });
    const wrong = ackOf({ ...base, text: "teen faces", cls: graded("incorrect") });
    assert.equal(right.kind, "echo");
    assert.equal(wrong.kind, "echo");
    assert.deepEqual(Object.keys(right).sort(), Object.keys(wrong).sort(), "no field carries the verdict");
    assert.equal(ackOf({ ...base, text: "mujhe nahi pata", cls: graded("no_evidence") }).none, "not_an_answer");
  });

  test("never on a safety turn: predicate, model read, open safeguard, filter block, duplex partial hit", () => {
    const t = "chhe";
    assert.equal(ackOf({ ...base, text: t, cls: graded("correct"), predicateDistress: true }).none, "safety");
    assert.equal(ackOf({ ...base, text: t, cls: graded("correct", { distress: true }) }).none, "safety");
    assert.equal(ackOf({ ...base, text: t, cls: graded("correct"), safeguardOpen: true }).none, "safety");
    assert.equal(ackOf({ ...base, text: t, cls: { ...graded("no_evidence"), source: "content_filter" } }).none, "safety");
    assert.equal(ackOf({ ...base, text: t, cls: graded("correct"), pendingSafety: true }).none, "safety");
    assert.equal(ackOf({ ...base, text: t, cls: null }).none, "unclassified", "no classify result: no ack");
  });

  test("never on a goodbye, never two turns running, never a name or a word outside the closed class", () => {
    assert.equal(ackOf({ ...base, text: "chhe, bye", cls: graded("correct", { wantsToStop: true }) }).none, "leaving");
    assert.equal(ackOf({ ...base, text: "chhe", cls: graded("correct"), lastAckTurn: 4 }).none, "consecutive");
    assert.equal(ackOf({ ...base, text: "chhe", cls: graded("correct"), lastAckTurn: 3 }).kind, "echo");
    assert.equal(ackOf({ ...base, text: "chhe", cls: graded("correct"), lastAckTurn: 5 }).kind, "echo", "a re-sent prefetch of the same turn decides again");
    assert.equal(ackOf({ ...base, text: "Aarav", cls: graded("incorrect"), names: ["Aarav"] }).none, "token_screen");
    assert.equal(ackOf({ ...base, text: "bewakoof", cls: graded("incorrect") }).none, "token_screen");
  });
});
