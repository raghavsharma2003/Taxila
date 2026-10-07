// duplex-real (round 2): engine fixes found on REAL speech through the REAL STT (evals/duplex-real; docs/design/round2/duplex-real/CRITERIA.md).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TurnTranscript } from "../server/duplex/fanin.js";
import { understand } from "../server/duplex/understand.js";
import { CascadeDuplex } from "../src/duplex/cascadeDuplex.ts";

describe("duplex-real: fan-in coverage for items with no reported audio start (MAI streaming, D4 commit items)", () => {
  it("a final whose item has no audio start answers the oldest commit sent before it arrived (was: dropped as stale)", () => {
    const f = new TurnTranscript({ source: "mai_stream" });
    f.begin(1000);
    f.commitSent(2011); // the probe at 150 ms of silence
    f.push({ type: "final", itemId: "i1", text: "हाँ जी, बिल्कुल लगा दीजिए।", t: 2431 });
    const v = f.view(2500, () => 0);
    assert.equal(v.coverageEndMs, 2011, "coverage is the probe time, not arrival - lag");
  });
  it("a final with a reported audio start still takes the commit at or after that start (M-D7 b04 FIFO unchanged)", () => {
    const f = new TurnTranscript({ source: "live_transcribe" });
    f.begin(0);
    f.commitSent(2400);
    f.commitSent(3300);
    f.push({ type: "final", itemId: "a", text: "हम्म सात आठ", t: 2900, audioStartMs: 1000 });
    assert.equal(f.view(3000, () => 0).coverageEndMs, 2400);
  });
  it("commitEmpty forgets the newest pending commit, so the next final is not credited with audio it never covered", () => {
    const f = new TurnTranscript({ source: "mai_stream" });
    f.begin(0);
    f.commitSent(1000);
    f.commitSent(1500);
    f.commitEmpty();
    f.push({ type: "final", itemId: "x", text: "सात", t: 1700 });
    assert.equal(f.view(1800, () => 0).coverageEndMs, 1000);
    f.push({ type: "final", itemId: "y", text: "आठ", t: 1900 });
    assert.notEqual(f.view(2000, () => 0).coverageEndMs, 1500, "the refused commit is gone");
  });
});

describe("duplex-real: copula projection (a head noun + है with no complement yet)", () => {
  for (const t of ["मेरा फोन नंबर है", "और मेरा फोन नंबर है।", "answer है", "मेरा जवाब है", "बात ये है", "mera answer hai"]) {
    it(`"${t}" projects its complement`, () => assert.equal(understand(t).lex.cue, "projection"));
  }
  for (const t of ["मेरा नाम रिया है।", "मेरा answer बारह है", "उसका पता है?", "नमस्ते।", "हाँ जी, बिल्कुल लगा दीजिए।"]) {
    it(`"${t}" does not`, () => assert.notEqual(understand(t).lex.cue, "projection"));
  }
});

describe("duplex-real: an empty micro-commit is not the child", () => {
  const mk = (mode) => {
    let liveRef = null;
    const silent = [];
    const surface = { lessonId: "L", audio: () => ({ ctx: {}, stream: {}, herOutput: null }), herSounding: () => false, duck() {}, pause: () => true, resume() {}, stop() {},
      emitChild: (e) => silent.push(e), sttCommit() {}, setServerVad() {} };
    const d = new CascadeDuplex(surface, { mode, now: () => 0, setTimeout: () => 0, setInterval: () => 1, clearInterval: () => {}, startTap: async ({ live }) => { liveRef = live; return () => {}; }, shadowSink: null });
    return { d, live: () => liveRef };
  };
  it("while the engine decides, input_audio_buffer_commit_empty is consumed (the link must not emit child_silent / resume her)", async () => {
    const { d } = mk("on");
    await d.start();
    assert.equal(d.onServerError("input_audio_buffer_commit_empty", "buffer too small"), true);
  });
  it("in shadow (the shipped path owns the call) it is left to the link, as before", async () => {
    const { d } = mk("shadow");
    await d.start();
    assert.equal(d.onServerError("input_audio_buffer_commit_empty", "buffer too small"), false);
  });
});

// ── the open-turn wait and the yes/no elaboration ──
import { NEUTRAL_CONTEXT } from "../src/duplex/host.ts";
import { estimate } from "../src/duplex/engineRules.ts";
import { OPEN_TURN_WAIT } from "../src/duplex/config.ts";

const FLAGS = { shadow: false, semantic: false, trained: false, cutIn: false, audioBackchannel: false, lexicalBackchannel: false };
function tick(over = {}) {
  const base = {
    contract: "cce/2026-10-04", t: 5000, cause: "timer", phase: "child_turn", phaseSince: 1000,
    child: { voicing: false, voicedProb: 0, silenceRunMs: 400, voicedRunMs: 500, turnVoicedMs: 800, pausesThisTurn: 0, firstOnsetAt: 1200, lastOnsetAt: 1200, lastOffsetAt: 4600,
      prosody: { f0Hz: null, f0SlopeStPerS: null, f0RelRange: null, energyDb: -58, energySlopeDbPerS: null, finalLengthening: null, speechRateSylPerS: null }, targetSpeaker: null },
    transcript: { text: "मुझे लगता है ये ठीक है", stablePrefix: "", stability: 1, isFinal: true, words: null, coverageEndMs: 4600, unseenVoicedMs: 0, source: "sim", lagMsEstimate: 300, textHash: "h1", echoRemovedTokens: 0, updatedAt: 4800 },
    markers: { cue: "plain", lexP: 0.9, form: "none", values: [], lastValueAgeMs: null, holdRequest: false, fillerTail: false, openTail: false, projection: false, wordSearch: false,
      repairOpen: false, repaired: false, yieldTag: false, idk: false, asks: false, questionComplete: false, stopRequest: false, repeatRequest: false, codeSwitchAtEdge: false, offTaskMs: 0 },
    her: { speaking: false, utteranceId: null, playedMs: 0, totalMs: null, heardUpTo: null, atClauseBoundary: false, lastAct: "statement", handedOverAt: 1000, recentWords: [], outputLevelDb: null },
    context: { ...NEUTRAL_CONTEXT, exchange: "free" },
    pace: { sessions: 0, holdPauseMs: null, answerGapMs: null, speechRateSylPerS: null, fillerRatePerMin: null, source: "band_default", strain: false },
    screen: { events: [], busy: false, lastEventAt: null }, overlap: null,
    safety: { distress: false, kind: null, firstAt: null, checkedThroughMs: 4600, source: null },
    estimates: { semantic: null, acoustic: null }, last: null, lastActs: {},
  };
  const merge = (a, b) => { for (const [k, v] of Object.entries(b)) a[k] = v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" ? merge({ ...a[k] }, v) : v; return a; };
  return merge(base, over);
}
const stub = (d) => ({ id: { id: "stub", stage: "A", version: "t" }, contract: "cce/2026-10-04", reset() {}, tick: () => ({ confidence: 0.9, pComplete: 0.95, pHoldWanted: 0.05, reasons: [], engine: { id: "stub", stage: "A", version: "t" }, ...d }) });
// (A G7 change that armed the revoke on an open reply until the overlap read as a barge-in was tried and REVERTED: on AMI
// real speech it kept 4 more continuers of 195 but stopped 2 fewer barge-ins of 51 and moved her stop p50 180 -> 320 ms;
// context/inbox/duplex-real.json rj-dxr-armed-revoke.)
describe("duplex-real: open-turn wait and the yes/no elaboration", () => {
  it("OPEN_TURN_WAIT holds 1,100 ms outside closed answers (chosen on TRAIN)", () => {
    assert.deepEqual({ ...OPEN_TURN_WAIT }, { prosodyFinal: 1100, neutral: 1100, prosodyContinue: 1100 });
  });
  it("after a yes/no question, a bare 'हाँ जी' is a closed answer; 'हाँ जी, मेरा नाम रिया है और …' is read as a free turn", () => {
    const yn = { ...NEUTRAL_CONTEXT, exchange: "closed_answer", expected: { form: "yes_no", slots: 1 } };
    assert.equal(estimate(tick({ context: yn, transcript: { text: "हाँ जी" } })).exchange, "closed_answer");
    assert.equal(estimate(tick({ context: yn, transcript: { text: "हाँ जी, मेरा नाम रिया है और" } })).exchange, "free");
  });
});
