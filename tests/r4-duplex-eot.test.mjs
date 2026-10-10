// Round 4, stream duplex: the dictation pause class (a number / address / id being read out waits PAUSE_WAIT.dictation) and
// the R1-qualified eager hint for stream 3 (eagerDecideAt / eagerClass). Pure unit tests; the real-speech numbers are in
// docs/design/round4/build/duplex/RESULTS.md (eot-bench Hindi replays, evals/duplex-r4).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { MarkerTracker } from "../src/duplex/markers.ts";
import { pauseClass, RulesEngine } from "../src/duplex/engineRules.ts";
import { NEUTRAL_CONTEXT } from "../src/duplex/host.ts";
import { PAUSE_WAIT } from "../src/duplex/config.ts";

const FREE = { ...NEUTRAL_CONTEXT, exchange: "free" };
function markersOf(text, { punctuates = true } = {}) {
  const m = new MarkerTracker();
  if (punctuates) m.read("नमस्ते।", FREE, 0, null, null, false);
  return m.read(text, FREE, 100, null, null, false).markers;
}
function tickWith(markers, over = {}) {
  return {
    contract: "cce/2026-10-04", t: 5000, cause: "timer", phase: "child_turn", phaseSince: 1000,
    child: { voicing: false, voicedProb: 0, silenceRunMs: 400, voicedRunMs: 900, turnVoicedMs: 3000, pausesThisTurn: 0, firstOnsetAt: 1200, lastOnsetAt: 1200, lastOffsetAt: 4600,
      prosody: { f0Hz: null, f0SlopeStPerS: null, f0RelRange: null, energyDb: -58, energySlopeDbPerS: null, finalLengthening: null, speechRateSylPerS: null }, targetSpeaker: null },
    transcript: { text: "x", stablePrefix: "x", stability: 1, isFinal: true, words: null, coverageEndMs: 4600, unseenVoicedMs: 0, source: "live_transcribe", lagMsEstimate: 300, textHash: "h1", echoRemovedTokens: 0, updatedAt: 4800 },
    markers,
    her: { speaking: false, utteranceId: null, playedMs: 0, totalMs: null, heardUpTo: null, atClauseBoundary: false, lastAct: "explaining", handedOverAt: 1000, recentWords: [], outputLevelDb: null },
    context: FREE,
    pace: { sessions: 0, holdPauseMs: null, answerGapMs: null, speechRateSylPerS: null, fillerRatePerMin: null, source: "band_default", strain: false },
    screen: { events: [], busy: false, lastEventAt: null }, overlap: null,
    safety: { distress: false, kind: null, firstAt: null, checkedThroughMs: 4600, source: null },
    estimates: { semantic: null, acoustic: null }, last: null, lastActs: {}, ...over,
  };
}

describe("r4 duplex: the dictation pause class", () => {
  it("a read-out (a dictation noun, the noun or a number at an unclosed tail) waits longest", () => {
    assert.ok(PAUSE_WAIT.dictation > PAUSE_WAIT.hold);
    for (const t of ["मेरा मोबाइल नंबर है सात सौ", "मुझे लगता है कि वो टेबल नंबर", "मेरा पता है फ्लैट नंबर एक 4 6", "my phone number is 98", "pin code 110"]) {
      assert.equal(markersOf(t).dictating, true, t);
      assert.equal(pauseClass(tickWith(markersOf(t))), "dictation", t);
    }
  });
  it("not a read-out: a closed one, no dictation noun, no tail value, a simulated (unpunctuated) lane, a bare 'no'", () => {
    for (const t of ["मेरा नंबर है 7 0 तीन 6 8 1।", "मैंने 5 आम खाए", "मेरा फोन नंबर मेरे को मिल जाता,", "no 5"]) assert.notEqual(pauseClass(tickWith(markersOf(t))), "dictation", t);
    assert.equal(markersOf("मेरा नंबर है 7 0", { punctuates: false }).dictating, false, "no punctuation evidence");
  });
  it("a finished question and 'pata nahi' keep their own waits", () => {
    assert.equal(pauseClass(tickWith(markersOf("आपका फोन नंबर क्या है?"))), "question");
    assert.equal(pauseClass(tickWith(markersOf("पता नहीं"))), "idk");
  });
});

describe("r4 duplex: the R1-qualified eager hint for stream 3", () => {
  it("a live eager start carries its class and the time the R1-qualified decision lands", () => {
    const eng = new RulesEngine();
    const m = markersOf("मैंने आवेदन किया था।");
    const p = eng.tick(tickWith(m, { child: { ...tickWith(m).child, silenceRunMs: 200 } })).prepare;
    assert.equal(p.eager, "start");
    assert.equal(p.eagerClass, "complete");
    assert.equal(p.eagerDecideAt, 4600 + PAUSE_WAIT.complete);
  });
  it("a read-out never starts the eager turn and carries no decision time", () => {
    const eng = new RulesEngine();
    const m = markersOf("मेरा मोबाइल नंबर है सात सौ");
    const p = eng.tick(tickWith(m, { child: { ...tickWith(m).child, silenceRunMs: 200 } })).prepare;
    assert.notEqual(p.eager, "start");
    assert.equal(p.eagerDecideAt, null);
  });
  it("never under distress", () => {
    const eng = new RulesEngine();
    const m = markersOf("मैंने आवेदन किया था।");
    const p = eng.tick(tickWith(m, { child: { ...tickWith(m).child, silenceRunMs: 200 }, safety: { distress: true, kind: "fear", firstAt: 4000, checkedThroughMs: 4600, source: "partial" } })).prepare;
    assert.notEqual(p.eager, "start");
    assert.equal(p.eagerDecideAt, null);
  });
});
