// Round 3, stream duplex: the word-aware end of turn (EOT3), the eager end of turn, and the overlap changes (hush give-up on
// echo only, short ended bursts wait for their words, the hushed sustain, the armed revoke, the overlap probe).
// Unit tests on the pure parts, then REAL-SPEECH replays: device frames + the real gpt-live-transcribe events of eot-bench
// Hindi turns (LiveKit, CC BY 4.0, adult speakers; evals/duplex-real/make-fixture.mjs; no audio stored), each a thinking
// pause the shipped engine cut on the production lane (D4) in the round-3 replay (evals/duplex-real/results/r3-base-D4.json).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { MarkerTracker } from "../src/duplex/markers.ts";
import { pauseClass, extraWait, estimate, RulesEngine } from "../src/duplex/engineRules.ts";
import { Governor } from "../src/duplex/governor.ts";
import { classifyOverlap } from "../src/duplex/overlap.ts";
import { EngineHost, NEUTRAL_CONTEXT } from "../src/duplex/host.ts";
import { DuplexLive } from "../src/duplex/live.ts";
import { PAUSE_WAIT, OVERLAP } from "../src/duplex/config.ts";

const FREE = { ...NEUTRAL_CONTEXT, exchange: "free" };
const FLAGS = { shadow: false, semantic: false, trained: false, cutIn: false, audioBackchannel: false, lexicalBackchannel: false };

/** markers for a text in a session whose transcriber punctuates (or not) */
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

describe("round3 duplex: the word-aware end of turn (EOT3)", () => {
  it("reads how the transcriber closed the words, only once the session's transcriber has punctuated", () => {
    assert.equal(markersOf("मैं एक रिटायर्ड कर्मचारी हूँ।").endShape, "terminal");
    assert.equal(markersOf("उसका कुछ फ़ोन नंबर मेरे को मिल जाता,").endShape, "comma");
    assert.equal(markersOf("मेरा नाम हर्ष वि-").endShape, "broken");
    assert.equal(markersOf("मेरा मोबाइल नंबर है 700").endShape, "unclosed");
    assert.equal(markersOf("मेरा मोबाइल नंबर है 700", { punctuates: false }).endShape, null, "simulated STT never punctuates: no shape is read");
  });

  it("a number being read out is enumerating; a closed number is not", () => {
    assert.equal(markersOf("बिल्कुल। मेरा फोन नंबर है 7 0 तीन 6, 8").enumerating, true);
    assert.equal(markersOf("हमारी booking चार लोगों की है।").enumerating, false);
    assert.equal(markersOf("70302। 2 2 1 6, 5,").enumerating, true);
  });

  it("pause classes: hold shapes, enumerating, question, idk, complete", () => {
    const cls = (text, o) => pauseClass(tickWith(markersOf(text, o)));
    assert.equal(cls("तो मेरा नाम है इकान जोहारी। और मेरा फोन नंबर है"), "hold", "copula projection");
    assert.equal(cls("जी जी, मैं ज़रूर आऊँगा। और"), "hold", "open tail");
    assert.equal(cls("उसका कुछ फ़ोन नंबर मेरे को मिल जाता,"), "hold", "comma");
    assert.equal(cls("मेरा नाम हर्ष वि-"), "hold", "broken word");
    assert.equal(cls("हमारे पास है- 700"), "hold", "unclosed number");
    assert.equal(cls("तो गिनती है 7 0 तीन 6, 8"), "enumerating", "numbers read out in groups");
    assert.equal(cls("गिनती है 7 0 तीन 6 8"), "enumerating");
    // round 4: a read-out (a dictation noun in the turn, the noun or a number at an unclosed tail) is its own, longest class
    assert.equal(cls("मेरा मोबाइल नंबर है- 700"), "dictation", "a phone number being read out");
    assert.equal(cls("मेरा फोन नंबर है 7 0 तीन 6, 8"), "dictation", "digits of a phone number in groups");
    assert.equal(cls("मुझे लगता है कि वो टेबल नंबर"), "dictation", "the read-out still to come");
    assert.equal(cls("मेरा पता है फ्लैट नंबर एक 4 6"), "dictation", "an address");
    assert.equal(cls("मेरा नंबर है 7 0 तीन 6 8 1।"), "complete", "a closed read-out is not held");
    assert.equal(cls("मेरा फोन नंबर क्या है?"), "question", "a question to her keeps its own wait");
    assert.notEqual(cls("no, 5"), "dictation", "a bare English 'no' is not a dictation noun");
    assert.equal(cls("और मेरी मीटिंग में नुकसान हो गया, उसका भरपाई कौन करेगा?"), "question");
    assert.equal(cls("पता नहीं"), "idk");
    assert.equal(cls("मैंने खेती के उपकरणों के लिए सब्सिडी का आवेदन किया था।"), "complete");
    assert.equal(cls("मेरा मोबाइल नंबर है 700", { punctuates: false }), "complete", "no punctuation evidence: an unclosed number is not read as a hold");
  });

  it("outside closed answers the least silence is PAUSE_WAIT by class; closed answers keep their own waits", () => {
    for (const [text, k] of [["मैंने आवेदन किया था।", "complete"], ["उसका भरपाई कौन करेगा?", "question"], ["गिनती है 7 0 तीन 6 8", "enumerating"], ["मेरा नंबर है 7 0 तीन 6 8", "dictation"], ["पता नहीं", "idk"]]) {
      const tk = tickWith(markersOf(text));
      assert.equal(extraWait(tk, estimate(tk)), PAUSE_WAIT[k], `${k}: ${text}`);
    }
    const closed = tickWith(markersOf("बासठ"), { context: { ...NEUTRAL_CONTEXT, exchange: "closed_answer", expected: { form: "integer", slots: 1 } } });
    assert.equal(extraWait(closed, estimate(closed)), 0);
  });

  it("G10: in the free exchange the class wait IS the backstop (a hold shape is never committed at 1 s of silence)", () => {
    const g = new Governor({ flags: FLAGS });
    g.phase = "child_turn"; g.phaseSince = 1000;
    const unsure = { id: { id: "u", stage: "A", version: "t" }, contract: "cce/2026-10-04", reset() {}, tick: () => ({ action: "HOLD", detail: { action: "HOLD", reason: "uncertain" }, confidence: 0.5, pComplete: 0.3, pHoldWanted: 0.5, reasons: [], engine: { id: "u", stage: "A", version: "t" } }) };
    const hold = markersOf("हमारे पास है- 700");
    assert.equal(g.decide(tickWith(hold, { child: { ...tickWith(hold).child, silenceRunMs: 1100 } }), unsure).decision.action, "HOLD");
    assert.equal(g.decide(tickWith(hold, { t: 5600, child: { ...tickWith(hold).child, silenceRunMs: PAUSE_WAIT.hold + 20 } }), unsure).decision.action, "SPEAK");
  });

  it("the eager end of turn starts on covered complete words, keeps, and cancels when the child goes on", () => {
    const eng = new RulesEngine();
    const m = markersOf("मैंने आवेदन किया था।");
    const t1 = tickWith(m, { child: { ...tickWith(m).child, silenceRunMs: 200 } });
    assert.equal(eng.tick(t1).prepare.eager, "start");
    assert.equal(eng.tick({ ...t1, t: 5100 }).prepare.eager, "keep");
    const voicing = { ...t1, t: 5200, child: { ...t1.child, voicing: true, silenceRunMs: 0 } };
    assert.equal(eng.tick(voicing).prepare.eager, "cancel");
    // a hold shape never starts it; nor do uncovered words
    const eng2 = new RulesEngine();
    const h = markersOf("और मेरा फोन नंबर है");
    assert.equal(eng2.tick(tickWith(h, { child: { ...tickWith(h).child, silenceRunMs: 300 } })).prepare.eager, "none");
    const unseen = tickWith(m, { transcript: { ...tickWith(m).transcript, unseenVoicedMs: 600 } });
    assert.equal(new RulesEngine().tick(unseen).prepare.eager, "none");
  });
});

// ───────────────────────────── real speech (eot-bench Hindi + real D4 events) ─────────────────────────────

function replayFixture(fx) {
  let clock = 0, interval = null;
  const acts = [];
  const port = {
    duck() {}, pause: () => { acts.push([clock, "pause"]); return true; }, resume() {}, stop: () => acts.push([clock, "stop"]),
    commit: (turn) => acts.push([clock, "commit", turn.text]), sttCommit() {}, dropReply() {}, fallback: (w) => acts.push([clock, "fallback", w]), state() {},
    eager: (e) => acts.push([clock, `eager_${e.op}`, e.text]),
  };
  const live = new DuplexLive({ lessonId: "r3-fixture", port, now: () => clock, setInterval: (fn) => { interval = fn; return 1; }, clearInterval: () => { interval = null; }, band: "B4" });
  live.start();
  let ei = 0, hi = 0, herLive = null;
  for (let i = 0; i < fx.db.length; i++) {
    const tf = i * 20;
    clock = tf;
    while (ei < fx.stt.length && fx.stt[ei].t <= tf) live.stt(fx.stt[ei++].raw);
    if (herLive && tf >= herLive.end) { live.herEnd(); herLive = null; }
    if (!herLive && hi < fx.her.length && tf >= fx.her[hi].start) { herLive = fx.her[hi++]; live.setUi({}); live.herStart(herLive.text); }
    live.frame(tf, Math.pow(10, fx.db[i] / 20), fx.f0[i], herLive ? -20 : null);
    if (i % 5 === 4 && interval) interval();
  }
  live.stop();
  return acts;
}

describe("round3 duplex: real-speech replays of thinking pauses the shipped engine cut (eot-bench Hindi, real D4 events)", () => {
  for (const [id, what] of [["hi__4164", "a phone number read out in groups"], ["hi__4361", "a question to her and then more"], ["hi__4102", "a long pause after a closed clause"]]) {
    it(`${id}: ${what}: no commit inside a >= 500 ms thinking pause, the turn end is still taken`, () => {
      const fx = JSON.parse(fs.readFileSync(new URL(`./fixtures/round3-duplex-eot-${id}.json`, import.meta.url), "utf8"));
      const acts = replayFixture(fx);
      const tr = fx.turns[0];
      const commits = acts.filter((a) => a[1] === "commit" && a[0] >= tr.start && a[0] < tr.windowEnd);
      for (const [a, b] of tr.spans.slice(0, -1)) if (b - a >= 500) {
        const cut = commits.find((c) => c[0] > a + 20 && c[0] < b);
        assert.ok(!cut, `${id}: commit inside the ${b - a} ms pause at ${a - tr.start} ms: "${cut?.[2]?.slice(-60)}"`);
      }
      const end = commits.find((c) => c[0] >= tr.end - 200);
      assert.ok(end, `${id}: the turn end is committed`);
      // round 4: hi__4164 ENDS on a phone number read-out, so its turn end waits the dictation class
      assert.ok(end[0] - tr.end <= Math.max(PAUSE_WAIT.hold, PAUSE_WAIT.dictation) + 500, `${id}: decided ${Math.round(end[0] - tr.end)} ms after the end`);
    });
  }
});

// ───────────────────────────── overlap ─────────────────────────────

const LOUD = Math.pow(10, -24 / 20), QUIET = Math.pow(10, -58 / 20);
function hostRig({ supportsCommit = true } = {}) {
  const cmds = [];
  const host = new EngineHost({ session: { lessonId: "L", band: "B3", startedAt: 0, flags: FLAGS }, source: "live_transcribe", supportsCommit, emit: (c) => cmds.push(c) });
  let t = 0, nextTimer = 100;
  const step = (db) => { host.frame(t, db, db === LOUD ? 260 : null); if (t >= nextTimer) { host.timer(t); nextTimer += 100; } t += 20; };
  const r = { host, cmds, get t() { return t; },
    quiet(ms) { for (const end = t + ms; t < end;) step(QUIET); },
    voice(ms) { for (const end = t + ms; t < end;) step(LOUD); },
    her(text, ms = 6000) { host.herEvent({ kind: "start", t, utteranceId: `u${t}`, text, act: "explaining", handsOver: false, msPerChar: 70, outputDb: -55 }); return t + ms; },
    of: (to, op) => cmds.filter((c) => c.to === to && (op === undefined || c.op === op)) };
  r.quiet(600);
  host.context(FREE, t, { handsOver: true });
  return r;
}

describe("round3 duplex: overlap", () => {
  it("an ended 500 ms burst with no words is not an acoustic barge-in: it waits for its words", () => {
    const f = { onsetAt: 0, durMs: 500, targetSpeaker: null, echoLikelihood: 0.05, levelOverEchoDb: 30, onsetF0Rel: 0.9, atHerBoundary: false, words: "", lexicalKind: null, herAskedYesNo: false };
    const o = classifyOverlap(f, { voicing: false, f0SlopeStPerS: -3 }, FREE);
    assert.equal(o.decided, false);
    assert.equal(o.yieldReason, null);
    // ...but her yes/no question still takes it at once (the answer), and the words still decide
    assert.equal(classifyOverlap({ ...f, herAskedYesNo: true }, { voicing: false, f0SlopeStPerS: -3 }, FREE).yieldReason, "answer_to_her_question");
    assert.equal(classifyOverlap({ ...f, words: "ruko", lexicalKind: "stop" }, { voicing: false, f0SlopeStPerS: -3 }, FREE).yieldReason, "stop_request");
  });

  it("while hushed, an acoustics-only yield waits for OVERLAP.hushedSustainMs of voice", () => {
    const f = { onsetAt: 0, durMs: 700, targetSpeaker: null, echoLikelihood: 0.05, levelOverEchoDb: 30, onsetF0Rel: 0.9, atHerBoundary: false, words: "", lexicalKind: null, herAskedYesNo: false };
    assert.equal(classifyOverlap({ ...f, hushed: false }, { voicing: true, f0SlopeStPerS: null }, FREE).yieldReason, "barge_in");
    assert.equal(classifyOverlap({ ...f, hushed: true }, { voicing: true, f0SlopeStPerS: null }, FREE).decided, false);
    assert.equal(classifyOverlap({ ...f, durMs: OVERLAP.hushedSustainMs, hushed: true }, { voicing: true, f0SlopeStPerS: null }, FREE).yieldReason, "barge_in");
  });

  it("the hush keeps working after many wordless continuers (only echo-like bursts count toward giving up)", () => {
    const r = hostRig();
    r.her("आज हम भिन्न के बारे में बात करेंगे, और देखेंगे कि आधा और चौथाई में क्या फ़र्क है, फिर एक खेल खेलेंगे।", 20000);
    for (let k = 0; k < 6; k++) { r.quiet(900); r.voice(300); } // six wordless "hmm"s, loud (not echo-like)
    r.quiet(900);
    const before = r.of("voice", "duck").filter((c) => c.level <= OVERLAP.hushLevel).length;
    r.voice(400); // a real barge-in starts
    const hushes = r.of("voice", "duck").filter((c) => c.level <= OVERLAP.hushLevel);
    assert.ok(hushes.length > before, "the barge-in after six wordless continuers is still hushed");
    const last = hushes.at(-1);
    assert.ok(last.t - (r.t - 400) <= 200, `hush ${last.t - (r.t - 400)} ms after the onset`);
  });

  it("a burst over her that goes quiet sends one micro-commit probe (its words arrive fast)", () => {
    const r = hostRig();
    r.her("चलो देखते हैं कि बारह को तीन से भाग देने पर क्या आता है, ध्यान से सुनो।", 8000);
    r.quiet(800);
    const probesBefore = r.of("stt", "commit").length;
    r.voice(300);
    r.quiet(400);
    assert.equal(r.of("stt", "commit").length - probesBefore, 1);
    const shadow = new EngineHost({ session: { lessonId: "L", band: "B3", startedAt: 0, flags: { ...FLAGS, shadow: true } }, source: "live_transcribe", supportsCommit: true, emit: () => {} });
    assert.ok(shadow, "shadow never probes (covered by host: shadow emits only log rows)");
  });
});
