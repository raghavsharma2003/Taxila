// The v2 duplex runtime (docs/research/duplex/ARCHITECTURE.md v2; INTEGRATION.md): the device-side engine host, the
// governor, stage A, the overlap classifier, the face cues, the engine adapter (stage A now, a trained ONNX model later), and
// the server slice (partials fan-in, echo subtraction, sticky safety on partials, speculation, build intents, routes).
// Node strips the TS types on import. No network, no model, no key.
import { test } from "node:test";
import assert from "node:assert/strict";

import { EngineHost, NEUTRAL_CONTEXT, uptakeOf, estimateWords, clauseEnds } from "../src/duplex/host.ts";
import { Governor, silencePolicy } from "../src/duplex/governor.ts";
import { RulesEngine, estimate, EXPLAIN_SENTENCE_CAP } from "../src/duplex/engineRules.ts";
import { classifyOverlap } from "../src/duplex/overlap.ts";
import { faceCue, shippedFloor, phasePose } from "../src/duplex/face.ts";
import { createEngine, TrainedEngine, loadOnnxFloorModel } from "../src/duplex/adapter.ts";
import { FEATURE_NAMES, FEATURE_SPEC, packFeatures } from "../src/duplex/features.ts";
import { CONTEXT, VERDICT, OVERLAP, FIRST_TEXT_P90 } from "../src/duplex/config.ts";
import { TurnTranscript } from "../server/duplex/fanin.js";
import { EchoSubtractor } from "../server/duplex/echo.js";
import { PartialSafety } from "../server/duplex/partialSafety.js";
import { Speculator } from "../server/duplex/speculator.js";
import { BuildIntents } from "../server/duplex/buildIntent.js";
import { DuplexSlice } from "../server/duplex/slice.js";
import { createDuplexRoutes } from "../server/duplex/routes.js";

// ───────────────────────────── helpers ─────────────────────────────

const LOUD = Math.pow(10, -24 / 20); // child speech at the mic (-24 dBFS)
const QUIET = Math.pow(10, -58 / 20); // the room
const FLAGS = { shadow: false, semantic: false, trained: false, cutIn: false, audioBackchannel: false, lexicalBackchannel: false };
const CLOSED_INT = { ...NEUTRAL_CONTEXT, exchange: "closed_answer", expected: { form: "integer", slots: 1 }, questionType: "recall", itemId: "it1" };

/** A host on a word-timed source (exact coverage), its commands, and a clock that plays frames + timer ticks. */
function rig({ ctx = CLOSED_INT, flags = {}, engine, scan, source = "nemotron", supportsCommit = false } = {}) {
  const cmds = [];
  const host = new EngineHost({ session: { lessonId: "L", band: "B3", startedAt: 0, flags: { ...FLAGS, ...flags } }, source, supportsCommit, emit: (c) => cmds.push(c), engine, scan });
  let t = 0;
  let nextTimer = 100;
  const step = (loud) => {
    host.frame(t, loud ? LOUD : QUIET, loud ? 280 : null);
    if (t >= nextTimer) { host.timer(t); nextTimer += 100; }
    t += 20;
  };
  const r = {
    host, cmds,
    get t() { return t; },
    /** ms of room noise */
    quiet(ms) { for (const end = t + ms; t < end;) step(false); },
    /** ms of child voice */
    voice(ms) { for (const end = t + ms; t < end;) step(true); },
    /** a word-timed partial / final covering [start, end] */
    words(type, itemId, text, start, end) {
      const toks = text.split(/\s+/);
      const per = (end - start) / toks.length;
      host.stt({ type, itemId, text, t, audioStartMs: start, words: toks.map((w, i) => ({ w, startMs: start + i * per, endMs: start + (i + 1) * per })) });
    },
    speaks: () => cmds.filter((c) => c.to === "voice" && (c.op === "speak" || c.op === "cut_in")),
    of: (to, op) => cmds.filter((c) => c.to === to && (op === undefined || c.op === op)),
  };
  r.quiet(600); // the VAD learns the room
  host.context(ctx, t, { handsOver: true });
  return r;
}

/** A neutral tick for unit-testing the governor / engines directly. */
function tick(over = {}) {
  const base = {
    contract: "cce/2026-10-04", t: 5000, cause: "timer", phase: "child_turn", phaseSince: 1000,
    child: { voicing: false, voicedProb: 0, silenceRunMs: 400, voicedRunMs: 500, turnVoicedMs: 800, pausesThisTurn: 0, firstOnsetAt: 1200, lastOnsetAt: 1200, lastOffsetAt: 4600,
      prosody: { f0Hz: null, f0SlopeStPerS: null, f0RelRange: null, energyDb: -58, energySlopeDbPerS: null, finalLengthening: null, speechRateSylPerS: null }, targetSpeaker: null },
    transcript: { text: "बासठ", stablePrefix: "बासठ", stability: 1, isFinal: true, words: null, coverageEndMs: 4600, unseenVoicedMs: 0, source: "sim", lagMsEstimate: 300, textHash: "h1", echoRemovedTokens: 0, updatedAt: 4800 },
    markers: { cue: "value", lexP: 0.95, form: "complete", values: ["62"], lastValueAgeMs: 400, holdRequest: false, fillerTail: false, openTail: false, projection: false, wordSearch: false,
      repairOpen: false, repaired: false, yieldTag: false, idk: false, asks: false, questionComplete: false, stopRequest: false, repeatRequest: false, codeSwitchAtEdge: false, offTaskMs: 0 },
    her: { speaking: false, utteranceId: null, playedMs: 0, totalMs: null, heardUpTo: null, atClauseBoundary: false, lastAct: "asked_closed", handedOverAt: 1000, recentWords: [], outputLevelDb: null },
    context: CLOSED_INT,
    pace: { sessions: 0, holdPauseMs: null, answerGapMs: null, speechRateSylPerS: null, fillerRatePerMin: null, source: "band_default", strain: false },
    screen: { events: [], busy: false, lastEventAt: null }, overlap: null,
    safety: { distress: false, kind: null, firstAt: null, checkedThroughMs: 4600, source: null },
    estimates: { semantic: null, acoustic: null }, last: null, lastActs: {},
  };
  const merge = (a, b) => { for (const [k, v] of Object.entries(b)) a[k] = v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" ? merge({ ...a[k] }, v) : v; return a; };
  return merge(base, over);
}
const stub = (d) => ({ id: { id: "stub", stage: "A", version: "t" }, contract: "cce/2026-10-04", reset() {}, tick: () => ({ confidence: 0.9, pComplete: 0.95, pHoldWanted: 0.05, reasons: [], engine: { id: "stub", stage: "A", version: "t" }, ...d }) });
const SPEAK = { action: "SPEAK", detail: { action: "SPEAK", reason: "turn_end", firstSound: "uptake", verdictNotBefore: null } };
const gov = (o = {}) => { const g = new Governor({ flags: { ...FLAGS, ...(o.flags || {}) }, mode: o.mode }); g.phase = o.phase ?? "child_turn"; g.phaseSince = 1000; return g; };

// ───────────────────────────── hands-free host ─────────────────────────────

test("host is hands-free: no press / release / talk-button API anywhere on the engine host", () => {
  const names = Object.getOwnPropertyNames(EngineHost.prototype).join(" ");
  assert.doesNotMatch(names, /press|release|pushToTalk|ptt|talkButton|startTalking|stopTalking/i);
  for (const m of ["frame", "stt", "herEvent", "screen", "context", "estimate", "timer"]) assert.equal(typeof EngineHost.prototype[m], "function", m);
});

test("a complete closed answer whose words cover the audio is answered with no silence wait (continuous, not silence-gated)", () => {
  const r = rig();
  r.voice(400); // "बासठ"
  const end = r.t;
  r.words("final", "i1", "बासठ", end - 400, end);
  r.quiet(400);
  const s = r.speaks();
  assert.equal(s.length, 1, "one SPEAK");
  assert.equal(s[0].reason, "turn_end");
  assert.equal(s[0].firstSound, "uptake");
  assert.equal(s[0].uptake, "बासठ");
  // well under today's 900 ms and the 640 ms tuned-silence bar; the frame hangover (100 ms) is the only acoustic wait
  assert.ok(s[0].t - end < 400, `gap ${s[0].t - end} ms`);
  // fast mouth, late verdict: the verdict gate is the value's end + VERDICT.delayMs
  assert.equal(s[0].verdictNotBefore, end + VERDICT.delayMs);
});

test("the lexical horizon holds the floor while the child's newest audio has no words yet", () => {
  const r = rig();
  r.voice(500);
  const end = r.t;
  // the words so far cover only the first 250 ms of the child's 500 ms of voice
  r.host.stt({ type: "partial", itemId: "i1", text: "बारह", t: r.t, audioStartMs: end - 500, words: [{ w: "बारह", startMs: end - 500, endMs: end - 250 }] });
  r.quiet(900);
  assert.equal(r.speaks().length, 0, "no SPEAK on a stale prefix");
  assert.ok(r.of("log").some((c) => c.row.detail === "hold:lexical_horizon"), "held by the horizon");
  r.words("final", "i1", "बारह", end - 500, end);
  r.quiet(300);
  assert.equal(r.speaks().length, 1, "covered → answered at once");
});

test("a hold request ('एक मिनट') grants a hold; the answer after it ends the hold and is answered", () => {
  const r = rig();
  r.voice(500);
  r.words("final", "i1", "एक मिनट", r.t - 500, r.t);
  r.quiet(3000);
  assert.equal(r.host.phase, "hold_requested");
  assert.equal(r.speaks().length, 0, "nothing said during the hold");
  r.voice(400);
  r.words("final", "i2", "बारह", r.t - 400, r.t);
  r.quiet(900); // a first value after a pause waits ~600 ms (M-B1: hesitant first values were wrong 21/21)
  const s = r.speaks();
  assert.equal(s.length, 1);
  assert.match(s[0].text, /बारह/);
  assert.equal(s[0].uptake, "बारह", "the hold words are not part of the answer");
});

test("a stale hold-request prefix never re-grants a hold after the child resumed (M-D7 h01 regression)", () => {
  const r = rig();
  r.voice(500);
  r.words("final", "i1", "एक मिनट", r.t - 500, r.t);
  r.quiet(2000);
  r.voice(400); // the answer, words not landed yet
  r.quiet(300);
  assert.notEqual(r.host.phase, "hold_requested", "no re-grant on the old words");
  r.words("final", "i2", "हाँ बारह", r.t - 700, r.t - 300);
  r.quiet(600);
  assert.equal(r.speaks().length, 1);
});

test("a distress partial is sticky: quarantine + safety attend at once, only the safeguard speaks, never over the child", () => {
  const r = rig({ ctx: { ...NEUTRAL_CONTEXT, exchange: "open_explanation" } });
  r.voice(900);
  r.words("partial", "i1", "मुझे मर जाना है", r.t - 900, r.t);
  assert.equal(r.of("think", "quarantine").length, 1);
  assert.equal(r.of("safety", "attend").length, 1);
  r.voice(300); // still talking: no sound from her
  assert.equal(r.speaks().length, 0);
  r.words("final", "i1", "मुझे मन नहीं है", r.t - 1200, r.t); // a clean revision never un-trips it
  r.quiet(1800);
  const s = r.speaks();
  assert.equal(s.length, 1);
  assert.equal(s[0].reason, "safeguard");
  assert.equal(r.host.governor.phase === "committed" || r.host.governor.phase === "safety_attend", true);
});

test("barge-in: a sustained child voice over her yields (resumable); a short burst at her clause boundary keeps talking", () => {
  const r = rig({ ctx: { ...NEUTRAL_CONTEXT, exchange: "open_explanation" } });
  const text = "तो देखो, जब हम pizza को चार बराबर हिस्सों में काटते हैं, तो हर हिस्सा एक चौथाई होता है।";
  r.host.herEvent({ kind: "start", t: r.t, utteranceId: "u1", text, act: "explaining", handsOver: false, msPerChar: 70 });
  r.quiet(1000);
  r.voice(700); // sustained
  const y = r.of("voice", "yield");
  assert.equal(y.length, 1);
  assert.equal(y[0].reason, "barge_in");
  assert.equal(y[0].resumable, true);
  assert.ok(r.of("voice", "duck").length >= 1, "the reflex duck came first");
});

test("her own words in the child's transcript are subtracted before markers, safety or drafts see them", () => {
  const r = rig({ ctx: { ...NEUTRAL_CONTEXT, exchange: "open_explanation" } });
  const text = "अब हम एक नया सवाल देखते हैं";
  r.host.herEvent({ kind: "start", t: r.t, utteranceId: "u1", text, act: "explaining", handsOver: false, msPerChar: 70 });
  r.quiet(1500);
  r.host.stt({ type: "partial", itemId: "e1", text: "एक नया सवाल देखते", t: r.t, audioStartMs: r.t - 1200 });
  const tk = r.host.buildTick("timer", r.t);
  assert.equal(tk.transcript.text, "", "echo removed");
  assert.ok(tk.transcript.echoRemovedTokens >= 4);
});

test("her uptake re-voices the child's words: never subtracted from the child's correction (M-D7 c01)", () => {
  const r = rig({ source: "mai_stream" });
  r.voice(500);
  r.host.stt({ type: "final", itemId: "i1", text: "तीन बटा आठ", t: r.t, audioStartMs: r.t - 500, audioEndMs: r.t });
  r.quiet(500);
  const s = r.speaks();
  assert.equal(s.length, 1);
  assert.equal(s[0].uptake, "तीन बटा आठ");
  r.host.herEvent({ kind: "start", t: r.t, utteranceId: "reply", text: "तीन बटा आठ, अच्छा तो देखते हैं", act: "asked_open", handsOver: true, msPerChar: 70 });
  r.quiet(300);
  r.voice(900); // "नहीं नहीं, तीन बटा चार" over her uptake: a revoke, the fragments merge
  r.host.stt({ type: "partial", itemId: "i2", text: "नहीं नहीं तीन बटा चार", t: r.t + 200, audioStartMs: r.t - 900 });
  const tk = r.host.buildTick("timer", r.t + 200);
  assert.match(tk.transcript.text, /तीन बटा चार/, "the correction keeps its 'तीन बटा'");
  assert.ok(r.of("voice", "yield").some((c) => c.reason === "revoke"));
});

test("shadow mode computes every tick but emits only log rows", () => {
  const r = rig({ flags: { shadow: true } });
  r.voice(400);
  r.words("final", "i1", "बासठ", r.t - 400, r.t);
  r.quiet(500);
  assert.ok(r.cmds.length > 0);
  assert.ok(r.cmds.every((c) => c.to === "log"), "logs only");
  assert.ok(r.cmds.some((c) => c.row.action === "SPEAK"), "the decision is still logged");
  for (const c of r.cmds) assert.equal(JSON.stringify(c.row).includes("बासठ"), false, "no child words in a log row");
});

test("WT1: after her question and before any child speech only the face nudge, then the verbal ladder, may act", () => {
  const r = rig();
  r.quiet(4100);
  assert.equal(r.speaks().length, 0);
  assert.ok(r.of("face").some((c) => c.cue.kind === "pose" && c.cue.pose === "your_turn"));
  r.quiet(3000);
  const s = r.speaks();
  assert.equal(s.length, 1);
  assert.equal(s[0].reason, "wt1_nudge");
});

test("the micro-commit probe fires at a child micro-pause on a commit-capable source, once per voiced run", () => {
  const r = rig({ source: "mai_stream", supportsCommit: true });
  r.voice(500);
  r.quiet(400);
  r.voice(300);
  r.quiet(400);
  assert.equal(r.of("stt", "commit").length, 2);
});

test("an engine fault falls back to stage A rules, then to the patient silence policy (fail patient)", () => {
  const boom = { id: { id: "boom", stage: "B", version: "x" }, contract: "cce/2026-10-04", reset() {}, tick() { throw new Error("onnx died"); } };
  const r = rig({ engine: boom });
  r.voice(400);
  r.words("final", "i1", "बासठ", r.t - 400, r.t);
  r.quiet(1200);
  assert.ok(r.of("log").some((c) => c.row.action === "fallback:rules"));
  assert.equal(r.speaks().length, 1, "rules still answered");
  const g = gov();
  const out = g.decide(tick(), boom);
  assert.equal(out.events.find((e) => e.kind === "fallback")?.to, "silence");
  assert.deepEqual(silencePolicy(tick({ child: { silenceRunMs: 950 } })).action, "SPEAK");
});

// ───────────────────────────── governor vetoes ─────────────────────────────

test("G1 safety: distress while her audio plays yields at once; on the child's floor only HOLD / calm / the safeguard", () => {
  const g = gov({ phase: "her_turn" });
  const d = g.decide(tick({ phase: "her_turn", safety: { distress: true, kind: "self_harm" } }), stub({ action: "KEEP_TALKING" })).decision;
  assert.equal(d.action, "YIELD");
  assert.equal(g.phase, "safety_attend");
  const g2 = gov();
  const d2 = g2.decide(tick({ child: { voicing: true, silenceRunMs: 0 }, safety: { distress: true, kind: "fear" } }), stub(SPEAK)).decision;
  assert.equal(d2.action, "REACT");
  assert.equal(d2.detail.kind, "calm_attend");
  assert.equal(d2.proposed, "SPEAK");
});

test("G2 barrier: no audio act before the predicate has seen text covering the audio", () => {
  const d = gov().decide(tick({ safety: { checkedThroughMs: 3000 } }), stub(SPEAK)).decision;
  assert.equal(d.action, "HOLD");
  assert.equal(d.reasons[0], "veto_safety_unchecked");
});

test("G5 horizon: SPEAK is vetoed while unseen child voice exceeds 120 ms (unless a fresh acoustic estimate vouches)", () => {
  assert.equal(gov().decide(tick({ transcript: { unseenVoicedMs: 400 } }), stub(SPEAK)).decision.reasons[0], "veto_horizon");
  const vouched = tick({ transcript: { unseenVoicedMs: 400 }, estimates: { acoustic: { atMs: 4950, pComplete: 0.9, model: "m", computeMs: 3 } } });
  assert.equal(gov().decide(vouched, stub(SPEAK)).decision.action, "SPEAK");
});

test("G6 closed CUT_IN list: an unlisted reason, the flag off, or child voice → vetoed; the hold offer is policy", () => {
  const cut = (reason) => stub({ action: "CUT_IN", detail: { action: "CUT_IN", reason } });
  assert.equal(gov().decide(tick(), cut("bored")).decision.action, "HOLD");
  const qs = tick({ markers: { asks: true, questionComplete: true } });
  assert.equal(gov().decide(qs, cut("question_to_her")).decision.action, "HOLD", "flag off");
  assert.equal(gov({ flags: { cutIn: true } }).decide(qs, cut("question_to_her")).decision.action, "CUT_IN");
  const g = gov({ phase: "hold_requested" });
  g.phaseSince = 0;
  const offer = g.decide(tick({ phase: "hold_requested", child: { silenceRunMs: 15500 }, markers: { holdRequest: true } }), cut("hold_offer")).decision;
  assert.equal(offer.action, "CUT_IN");
});

test("G7 revoke: a child onset after SPEAK and before her verdict word yields and merges (fast mouth, late verdict)", () => {
  const g = gov();
  g.decide(tick(), stub({ ...SPEAK, detail: { ...SPEAK.detail, verdictNotBefore: 6000 } }));
  assert.equal(g.phase, "committed");
  g.observe({ kind: "her_start", t: 5300, utteranceId: "r1" });
  const ev = g.observe({ kind: "child_onset", t: 5500, at: 5480 });
  assert.equal(ev.length, 0);
  const out = g.decide(tick({ t: 5520, phase: "her_turn", child: { voicing: true, silenceRunMs: 0 } }), stub({ action: "KEEP_TALKING" }));
  assert.equal(out.decision.action, "YIELD");
  assert.equal(out.decision.detail.reason, "revoke");
  assert.ok(out.events.some((e) => e.kind === "revoke"));
  // after the verdict word played, an onset is an overlap, not a revoke
  const g2 = gov();
  g2.decide(tick(), stub({ ...SPEAK, detail: { ...SPEAK.detail, verdictNotBefore: 6000 } }));
  g2.observe({ kind: "her_start", t: 5300, utteranceId: "r1" });
  g2.observe({ kind: "her_verdict", t: 6100 });
  g2.observe({ kind: "child_onset", t: 6300, at: 6280 });
  assert.equal(g2.phase, "overlap");
});

test("G7 stamp: a closed-answer SPEAK carries verdictNotBefore = last value end + VERDICT.delayMs", () => {
  const d = gov().decide(tick({ markers: { lastValueAgeMs: 300 } }), stub(SPEAK)).decision;
  assert.equal(d.detail.verdictNotBefore, 5000 - 300 + VERDICT.delayMs);
});

test("G8: no backchannel inside a closed answer; nods rate-limited; 'haan' only in chit-chat behind its flag", () => {
  const nod = stub({ action: "BACKCHANNEL", detail: { action: "BACKCHANNEL", kind: "nod" } });
  assert.equal(gov().decide(tick(), nod).decision.action, "HOLD");
  const open = { context: { ...NEUTRAL_CONTEXT, exchange: "open_explanation" } };
  const g = gov();
  assert.equal(g.decide(tick(open), nod).decision.action, "BACKCHANNEL");
  assert.equal(g.decide(tick({ ...open, t: 6000 }), nod).decision.action, "HOLD", "rate limit");
  const haan = stub({ action: "BACKCHANNEL", detail: { action: "BACKCHANNEL", kind: "haan" } });
  assert.equal(gov().decide(tick(open), haan).decision.reasons[0], "veto_lexical_backchannel");
});

test("G9: before the child speaks after her question, a SPEAK that is not the WT1 ladder is vetoed", () => {
  const g = gov({ phase: "handover" });
  const d = g.decide(tick({ phase: "handover", child: { firstOnsetAt: null, silenceRunMs: null }, transcript: { text: "", coverageEndMs: null } }), stub(SPEAK)).decision;
  assert.equal(d.reasons[0], "veto_wt1_protected");
});

test("G10 backstop: the engine stays unsure → silence decides only as a last resort, stretched while the child holds", () => {
  const unsure = stub({ action: "HOLD", detail: { action: "HOLD", reason: "uncertain" }, pComplete: 0.5, pHoldWanted: 0.3 });
  const bs = CONTEXT.closed_answer.backstopMs(600, 1600, true);
  assert.equal(gov().decide(tick({ child: { silenceRunMs: bs - 50 } }), unsure).decision.action, "HOLD");
  assert.equal(gov().decide(tick({ child: { silenceRunMs: bs + 20 } }), unsure).decision.detail.reason, "backstop_silence");
  const filler = tick({ child: { silenceRunMs: bs + 20 }, markers: { fillerTail: true } });
  assert.equal(gov().decide(filler, unsure).decision.action, "HOLD", "stretched by a filler tail");
});

test("G11 + resume: a resumable yield whose words read as a continuer resumes her from heardUpTo", () => {
  const g = gov({ phase: "overlap" });
  g.decide(tick({ phase: "overlap", child: { voicing: true, silenceRunMs: 0 } }), stub({ action: "YIELD", detail: { action: "YIELD", reason: "barge_in", atWordBoundary: true, resumable: true } }));
  assert.equal(g.phase, "child_turn");
  const out = g.decide(tick({ t: 5400, transcript: { text: "हम्म" }, child: { silenceRunMs: 300 } }), stub({ action: "HOLD", detail: { action: "HOLD", reason: "uncertain" } }));
  assert.ok(out.events.some((e) => e.kind === "resume"));
  assert.equal(out.decision.action, "KEEP_TALKING");
  assert.equal(g.phase, "her_turn");
});

test("a resumable yield with no words yet waits for the source's first-text latency before resuming (M-D7 i08)", () => {
  const g = gov({ phase: "overlap" });
  g.observe({ kind: "her_start", t: 0, utteranceId: "u" });
  g.phase = "her_turn";
  g.observe({ kind: "child_onset", t: 2000, at: 2000 });
  g.decide(tick({ t: 2300, phase: "overlap", child: { voicing: true, silenceRunMs: 0 } }), stub({ action: "YIELD", detail: { action: "YIELD", reason: "barge_in", atWordBoundary: true, resumable: true } }));
  const quiet = (t) => tick({ t, transcript: { text: "", source: "live_transcribe", coverageEndMs: null }, child: { silenceRunMs: t - 2300, turnVoicedMs: 300 } });
  const h = stub({ action: "HOLD", detail: { action: "HOLD", reason: "uncertain" } });
  assert.equal(g.decide(quiet(3900), h).events.some((e) => e.kind === "resume"), false, "1.6 s is too early for D4");
  assert.ok(g.decide(quiet(2000 + FIRST_TEXT_P90.live_transcribe + 320), h).events.some((e) => e.kind === "resume"));
});

test("baseline governor mode keeps only safety + phase legality (baselines are measured as they are)", () => {
  const g = gov({ mode: "baseline" });
  const d = g.decide(tick({ transcript: { unseenVoicedMs: 900 } }), stub(SPEAK)).decision;
  assert.equal(d.action, "SPEAK", "no horizon veto in baseline mode");
});

// ───────────────────────────── stage A ─────────────────────────────

test("stage A: a finished sentence inside a teach-back is capped below speakPc without a semantic read", () => {
  const t = tick({ context: { ...NEUTRAL_CONTEXT, exchange: "open_explanation" }, transcript: { text: "triangle के तीन sides होते हैं" },
    markers: { cue: "verb_final", lexP: 0.9, form: "not_applicable", values: [] }, child: { silenceRunMs: 900 } });
  const e = estimate(t);
  assert.ok(e.pComplete <= EXPLAIN_SENTENCE_CAP + 1e-9);
  assert.ok(e.pComplete < CONTEXT.open_explanation.speakPc);
  // a fresh semantic estimate on the same text lifts the cap
  const sem = estimate({ ...t, estimates: { semantic: { forTextHash: "h1", pComplete: 0.97, deployment: "fast", issuedAt: 4000, arrivedAt: 4900 }, acoustic: null } });
  assert.ok(sem.pComplete > e.pComplete);
});

test("stage A: a repair marker after the value holds; a complete question to her is fast", () => {
  const rep = estimate(tick({ markers: { repairOpen: true } }));
  const ok = estimate(tick());
  assert.ok(rep.pComplete < ok.pComplete && rep.pHoldWanted > ok.pHoldWanted);
  const q = estimate(tick({ context: { ...NEUTRAL_CONTEXT, exchange: "open_explanation" }, transcript: { text: "matlab?" },
    markers: { cue: "open", lexP: 0.85, form: "not_applicable", values: [], asks: true, questionComplete: true }, child: { silenceRunMs: 300 } }));
  assert.equal(q.exchange, "question_to_her");
  assert.ok(q.pComplete >= CONTEXT.question_to_her.speakPc);
});

test("stage A prepare: draft at projected pC >= 0.5, warm at >= 0.8, cancel after < 0.35 for 300 ms", () => {
  const eng = new RulesEngine({ supportsProbe: false });
  eng.reset({});
  const d1 = eng.tick(tick({ child: { voicing: true, silenceRunMs: 0 } }));
  assert.equal(d1.prepare.draft, "start");
  assert.equal(d1.prepare.warmTts, "start");
  const low = (t) => tick({ t, transcript: { text: "उम्म", textHash: "h2" }, markers: { cue: "filler", lexP: 0.05, form: "none", values: [], fillerTail: true }, child: { silenceRunMs: 100 } });
  eng.tick(low(5100));
  assert.equal(eng.tick(low(5450)).prepare.draft, "cancel");
});

// ───────────────────────────── overlap + face ─────────────────────────────

test("overlap classifier: echo keeps talking; a voice after her yes/no question yields as an answer; a short boundary burst is a continuer", () => {
  const f = { onsetAt: 1000, durMs: 300, targetSpeaker: null, echoLikelihood: 0.05, levelOverEchoDb: null, onsetF0Rel: null, atHerBoundary: false, words: "", lexicalKind: null, herAskedYesNo: false };
  assert.equal(classifyOverlap({ ...f, echoLikelihood: 0.8 }, { voicing: true, f0SlopeStPerS: null }, NEUTRAL_CONTEXT).keepReason, "echo");
  assert.equal(classifyOverlap({ ...f, herAskedYesNo: true }, { voicing: true, f0SlopeStPerS: null }, NEUTRAL_CONTEXT).yieldReason, "answer_to_her_question");
  const c = classifyOverlap({ ...f, atHerBoundary: true, durMs: 260 }, { voicing: false, f0SlopeStPerS: -3 }, NEUTRAL_CONTEXT);
  assert.equal(c.cls, "continuer");
  // still voicing at 300 ms mid-clause: undecided (stay ducked) under the default; the eager ablation yields
  assert.equal(classifyOverlap(f, { voicing: true, f0SlopeStPerS: null }, NEUTRAL_CONTEXT).decided, false);
  const prev = OVERLAP.earlyVoicedZ;
  OVERLAP.earlyVoicedZ = 1.0;
  try { assert.equal(classifyOverlap(f, { voicing: true, f0SlopeStPerS: null }, NEUTRAL_CONTEXT).yieldReason, "barge_in"); } finally { OVERLAP.earlyVoicedZ = prev; }
  // words confirm later: a number over her number question folds in
  const fold = classifyOverlap({ ...f, words: "बारह", lexicalKind: "continuer" }, { voicing: false, f0SlopeStPerS: null }, CLOSED_INT);
  assert.equal(fold.yieldReason, "fold_in");
});

test("face: floor behaviours only — calm in safety, content-blind nods, the shipped floor mapping", () => {
  const react = (kind) => ({ action: "REACT", detail: { action: "REACT", kind }, confidence: 1, pComplete: 0, pHoldWanted: 0, reasons: [], engine: { id: "x", stage: "A", version: "1" } });
  assert.deepEqual(faceCue(react("listen_lean"), "safety_attend"), { kind: "pose", pose: "calm_steady", why: "safety_attend" });
  assert.deepEqual(faceCue({ ...react("x"), action: "BACKCHANNEL", detail: { action: "BACKCHANNEL", kind: "nod" } }, "child_turn"), { kind: "nod", peakDeg: 4 });
  assert.equal(shippedFloor("handover"), "your_turn");
  assert.equal(phasePose("committed").pose, "thinking");
});

// ───────────────────────────── adapter: stage A now, ONNX later ─────────────────────────────

test("adapter: stage A by default; the trained engine only with the flag AND a model; spec mismatch refused", async () => {
  assert.ok(createEngine({ flags: { trained: false } }) instanceof RulesEngine);
  const model = { id: "cce-b", version: "0.1", featureSpec: FEATURE_SPEC, audioMs: 0, run: async () => ({ pComplete: 0.97, pHoldWanted: 0.02, overlap: { barge_in: 0.1 } }) };
  assert.ok(createEngine({ flags: { trained: false }, model }) instanceof RulesEngine);
  const eng = createEngine({ flags: { trained: true }, model });
  assert.ok(eng instanceof TrainedEngine);
  assert.throws(() => new TrainedEngine({ ...model, featureSpec: "cce-features/0" }), /feature spec/);
  eng.reset({});
  const t0 = tick();
  const stale = eng.tick(t0);
  assert.equal(stale.reasons[0], "fallback_rules", "no inference yet → stage A");
  await eng.infer(t0);
  const fresh = eng.tick({ ...t0, t: t0.t + 50 });
  assert.equal(fresh.pComplete, 0.97);
  assert.equal(fresh.engine.stage, "B");
  // a features-only model (audioMs 0) never vouches for unseen audio (TaxilaFDB 2026-10-04); one that hears audio does
  assert.equal(eng.latestAcoustic(), null, "features-only: no G5 vouching");
  const heard = new TrainedEngine({ ...model, audioMs: 8000 });
  heard.reset({});
  await heard.infer(t0);
  assert.equal(heard.latestAcoustic().pComplete, 0.97, "an audio model vouches for the unseen tail through G5");
  assert.equal(eng.tick({ ...t0, t: t0.t + 2000 }).reasons[0], "fallback_rules", "stale again → stage A");
});

test("adapter: the ONNX loader feeds [1, F] features and maps the heads (onnxruntime injected)", async () => {
  let fed = null;
  const ort = {
    Tensor: class { constructor(type, data, dims) { Object.assign(this, { type, data, dims }); } },
    InferenceSession: { create: async () => ({ run: async (feeds) => { fed = feeds; return { p_complete: { data: [0.8] }, p_hold: { data: [0.1] }, overlap: { data: [0.1, 0.7, 0.05, 0.05, 0.05, 0.05] } }; } }) },
  };
  const m = await loadOnnxFloorModel(new Uint8Array(4), ort, { id: "m", version: "1", featureSpec: FEATURE_SPEC, audioMs: 0 });
  const out = await m.run(packFeatures(tick()), null);
  assert.deepEqual(fed.features.dims, [1, FEATURE_NAMES.length]);
  assert.equal(out.overlap.barge_in, 0.7);
  await assert.rejects(loadOnnxFloorModel(new Uint8Array(4), ort, { id: "m", version: "1", featureSpec: "old", audioMs: 0 }), /feature spec/);
});

test("features: one fixed layout, numbers only, length = names", () => {
  const v = packFeatures(tick());
  assert.equal(v.length, FEATURE_NAMES.length);
  assert.ok(Array.from(v).every(Number.isFinite));
});

// ───────────────────────────── server slice ─────────────────────────────

test("fan-in: commits are answered in order — a second probe never lends its time to the first final (M-D7 b04)", () => {
  const f = new TurnTranscript({ source: "mai_stream" });
  f.begin(0);
  f.push({ type: "partial", itemId: "a", text: "सात आठ", t: 1500, audioStartMs: 500 });
  f.commitSent(2400);
  f.commitSent(3300);
  f.push({ type: "final", itemId: "a", text: "सात आठ", t: 3320, audioStartMs: 500 });
  assert.equal(f.view(3320).coverageEndMs, 2400);
  f.push({ type: "final", itemId: "b", text: "छप्पन", t: 3450, audioStartMs: 2700 });
  assert.equal(f.view(3450).coverageEndMs, 3300);
  assert.equal(f.view(3450).text, "सात आठ छप्पन");
});

test("fan-in: epochs drop the last turn's late final; a carried overlap folds in and counts as unseen until words land", () => {
  const f = new TurnTranscript({ source: "live_transcribe" });
  f.begin(0);
  f.push({ type: "partial", itemId: "old", text: "पुराना", t: 900, audioStartMs: 100 });
  f.begin(2000, { carryFrom: 1500 });
  f.push({ type: "final", itemId: "old", text: "पुराना", t: 2100, audioStartMs: 100 });
  assert.equal(f.view(2100).text, "");
  let asked = null;
  f.view(2200, (from) => { asked = from; return 300; });
  assert.equal(asked, 1500, "unseen voice counted from the carried onset");
  f.push({ type: "partial", itemId: "carry", text: "बारह", t: 3300, audioStartMs: 1520 });
  assert.equal(f.view(3300).text, "बारह");
});

test("echo subtraction removes a run of her words and keeps a single-word answer that repeats one of hers", () => {
  const e = new EchoSubtractor();
  e.heardText("u1", "हर हिस्सा एक चौथाई होता है", 0, 70);
  assert.deepEqual(e.subtract("हिस्सा एक चौथाई", 1500), { text: "", removed: 3 });
  assert.equal(e.subtract("चौथाई", 3000).text, "चौथाई", "a lone repeat of her word, not fresh echo, is a turn");
  assert.equal(new EchoSubtractor().subtract("हाँ", 100).text, "हाँ");
  const yn = new EchoSubtractor();
  yn.heardText("u2", "दोनों हिस्से बराबर हैं?", 0, 70);
  assert.equal(yn.subtract("हाँ", 1700).text, "हाँ", "a yes over her yes/no question is never her 'हैं' (skeleton collision)");
  e.stopAt("u1", 300);
  assert.equal(e.subtract("चौथाई होता है", 2500).removed, 0, "words after her stop were never audible");
});

test("sticky safety on partials: a clean revision never un-trips; checkedThroughMs tracks coverage", () => {
  const s = new PartialSafety();
  s.begin(0);
  assert.equal(s.check("मुझे मर जाना है", 1200, 1300).tripped, true);
  const r = s.check("मुझे मन नहीं है", 1500, 1600);
  assert.equal(r.distress, true);
  assert.equal(r.tripped, false);
  assert.equal(r.checkedThroughMs, 1500);
  s.begin(2000, { carry: true });
  assert.equal(s.state().distress, true, "carried until the safeguard is spoken");
});

test("speculator: draft by hint, promoted on text identity; warm uptake promoted on hash; safety quarantines all", () => {
  const launched = [];
  const launchDraft = (job, now) => { launched.push(job); return { readyAt: now + 500, usage: { in: 10, out: 5 }, abort: () => ({ in: 10, out: 0 }) }; };
  const warmed = [];
  const sp = new Speculator({ launchDraft, launchWarm: (job, now) => { warmed.push(job); return { readyAt: now + 200, abort: () => 0 }; } });
  sp.onHandover(0, { itemId: "it" });
  sp.onPrepare(1000, { draft: "start", warmTts: "start", textHash: "h" }, { text: "बासठ", uptake: "बासठ" });
  assert.equal(launched.length, 1);
  assert.equal(warmed.length, 1);
  sp.onPrepare(1100, { draft: "keep", warmTts: "keep", textHash: "h" }, { text: "बासठ", uptake: "बासठ" });
  assert.equal(launched.length, 1, "same key: no relaunch");
  const out = sp.onSpeak(1700, { text: "बासठ", textHash: "h" });
  assert.equal(out.phase, "candidate");
  assert.equal(out.warm.text, "बासठ");
  const sp2 = new Speculator({ launchDraft, launchWarm: () => ({ abort: () => 0 }) });
  sp2.onHandover(0, {});
  sp2.onSafety(10);
  sp2.onPrepare(20, { draft: "start", warmTts: "start", textHash: "x" }, { text: "कुछ", uptake: "कुछ" });
  const o2 = sp2.onSpeak(30, { text: "कुछ", textHash: "x" });
  assert.equal(o2.phase, "commit");
  assert.equal(o2.warm, null);
});

test("build intents from partials: a kit misconception value prefetches once; a distress turn launches nothing", () => {
  const jobs = [];
  const b = new BuildIntents({ launch: (j) => { jobs.push(j); return { kind: "whiteboard" }; } });
  b.begin(1);
  const ctx = { itemId: "it", misconceptionValues: ["3/8"], answerForm: "number" };
  assert.equal(b.fromPartial("तीन बटा आठ", ctx, 10).kind, "misconception");
  assert.equal(b.fromPartial("तीन बटा आठ", ctx, 20), null, "deduped");
  assert.equal(jobs[0].prefetchOnly, true);
  assert.equal(b.drainAtPhase("child_turn").length, 0, "never revealed on the child's floor");
  assert.equal(b.drainAtPhase("handover").length, 1, "revealed at a turn boundary");
  b.begin(2);
  b.fromPartial("मुझे मर जाना है", ctx, 30);
  assert.equal(b.fromScreen({ kind: "aid_request" }, 40), null);
});

test("the server slice: hashes and flags in the turn summary, never the child's words; revoke supersedes the planned row", () => {
  const sl = new DuplexSlice({ lessonId: "L", source: "mai_stream", launchDraft: (j, now) => ({ readyAt: now + 10, usage: { in: 1, out: 1 }, abort: () => ({ in: 1, out: 0 }) }) });
  sl.handover({ t: 0, itemId: "it" });
  sl.herUtterance({ utteranceId: "u", text: "सात आठे कितने होते हैं", startedAt: -2000 });
  const p = sl.partial({ type: "partial", itemId: "a", text: "छप्पन", t: 900, audioStartMs: 300 });
  assert.equal(p.safety.distress, false);
  sl.prepare(950, { draft: "start", warmTts: "none", textHash: p.textHash }, { text: "छप्पन" });
  sl.speak(1000, { text: "छप्पन", textHash: p.textHash });
  assert.ok(sl.genId);
  sl.revoke(1100);
  const s = sl.turnSummary();
  assert.equal(s.superseded.length, 1);
  assert.equal(JSON.stringify(s).includes("छप्पन"), false);
  const d = sl.partial({ type: "final", itemId: "a", text: "मुझे खुद को चोट लगानी है", t: 1500, audioStartMs: 300 });
  assert.equal(d.safety.distress, true);
  assert.equal(sl.turnSummary().safetyPending.kind !== undefined, true);
});

test("routes: authorize first, batched partials return flags only, prepare and speak round-trip", async () => {
  const calls = [];
  const routes = createDuplexRoutes({ authorize: async (_req, lessonId) => { calls.push(lessonId); if (lessonId === "bad") throw Object.assign(new Error("no"), { status: 403 }); return { lessonId }; }, now: () => 1 });
  const res = () => { const r = { headers: {}, statusCode: 0, body: "", setHeader(k, v) { r.headers[k] = v; }, end(b) { r.body = b; } }; return r; };
  let r = res();
  await routes["POST /api/duplex/handover"]({}, r, { lessonId: "L", t: 0, itemId: "it" });
  assert.equal(r.statusCode, 200);
  r = res();
  await routes["POST /api/duplex/partial"]({}, r, { lessonId: "L", events: [{ type: "commit", t: 100 }, { type: "partial", itemId: "a", text: "बासठ", t: 200, audioStartMs: 0 }] });
  const body = JSON.parse(r.body);
  assert.deepEqual(body.safety, { distress: false, kind: null });
  assert.equal(r.body.includes("बासठ"), false);
  await assert.rejects(routes["POST /api/duplex/partial"]({}, res(), { lessonId: "bad", events: [] }), /no/);
  await assert.rejects(routes["POST /api/duplex/handover"]({}, res(), { t: 0 }), /lessonId is required/);
});

test("host helpers: uptake is the child's own last value; word timing estimate; clause boundaries", () => {
  assert.equal(uptakeOf("उम्म, तीन बटा चार"), "तीन बटा चार");
  assert.equal(uptakeOf("पता नहीं"), null);
  const w = estimateWords("एक, दो", 1000, 70);
  assert.equal(w.length, 2);
  assert.deepEqual(clauseEnds("एक, दो", w), [w[0].endMs]);
});
