// Whole-project audit 2026-11-09, voice area (docs/design/round7/audit/voice.md): one test per client-side fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PcmStreamPlayer, PCM_RATE } from "../src/lesson/ttsStream.ts";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** A fake AudioContext on the real clock: a source "ends" after its buffer's duration. */
class RealClockAudioContext {
  constructor() { this.t0 = performance.now(); this.destination = { connect() {}, disconnect() {} }; }
  get currentTime() { return (performance.now() - this.t0) / 1000; }
  createGain() { return { connect() {}, disconnect() {}, gain: { value: 1, cancelScheduledValues() {}, setTargetAtTime(v) { this.value = v; } } }; }
  createBuffer(_ch, length, rate) { const data = new Float32Array(length); return { duration: length / rate, length, getChannelData: () => data }; }
  createBufferSource() {
    const ctx = this;
    const s = { connect() {}, disconnect() {} };
    s.start = (at) => { s.timer = setTimeout(() => s.onended?.(), Math.max(0, (at - ctx.currentTime) * 1000) + s.buffer.duration * 1000); };
    s.stop = () => clearTimeout(s.timer);
    return s;
  }
}
const pcmBytes = (seconds) => new Uint8Array(Math.round(seconds * PCM_RATE) * 2).fill(1);

test("V-02: a stream that delivers some audio and then nothing (no close, no error) ends the line after the stall time", async () => {
  const ctx = new RealClockAudioContext();
  const player = new PcmStreamPlayer(ctx, ctx.destination);
  player.stallMs = 80;
  let ended = null;
  const pb = player.play(async () => new ReadableStream({ start(c) { c.enqueue(pcmBytes(0.05)); } }));
  pb.ended.then((s) => { ended = s; });
  await pb.started;
  await wait(400);
  assert.equal(ended, "completed");
  assert.equal(player.playing, false);
});

test("V-02: a paused line is not ended by the stall timer; a slow but live stream is not either", async () => {
  const ctx = new RealClockAudioContext();
  const player = new PcmStreamPlayer(ctx, ctx.destination);
  player.stallMs = 80;
  let ctl, ended = null;
  const pb = player.play(async () => new ReadableStream({ start(c) { ctl = c; c.enqueue(pcmBytes(0.05)); } }));
  pb.ended.then((s) => { ended = s; });
  await pb.started;
  pb.pause();
  await wait(300);
  assert.equal(ended, null);
  pb.resume();
  for (let i = 0; i < 5; i++) { await wait(50); ctl.enqueue(pcmBytes(0.03)); }
  assert.equal(ended, null);
  ctl.close();
  await wait(200);
  assert.equal(ended, "completed");
});

// ── V-06: the governor's committed-phase expiry ──
import { Governor } from "../src/duplex/governor.ts";
import { NEUTRAL_CONTEXT } from "../src/duplex/host.ts";
const FLAGS = { shadow: false, semantic: false, trained: false, cutIn: false, audioBackchannel: false, lexicalBackchannel: false };
/** A neutral engine tick (the shape tests/duplex-runtime.test.mjs uses), merged with `over`. */
function tick(over = {}) {
  const base = {
    contract: "cce/2026-10-04", t: 5000, cause: "timer", phase: "child_turn", phaseSince: 1000,
    child: { voicing: false, voicedProb: 0, silenceRunMs: 400, voicedRunMs: 500, turnVoicedMs: 800, pausesThisTurn: 0, firstOnsetAt: 1200, lastOnsetAt: 1200, lastOffsetAt: 4600,
      prosody: { f0Hz: null, f0SlopeStPerS: null, f0RelRange: null, energyDb: -58, energySlopeDbPerS: null, finalLengthening: null, speechRateSylPerS: null }, targetSpeaker: null },
    transcript: { text: "बारह", stablePrefix: "बारह", stability: 1, isFinal: true, words: null, coverageEndMs: 4600, unseenVoicedMs: 0, source: "sim", lagMsEstimate: 300, textHash: "h1", echoRemovedTokens: 0, updatedAt: 4800 },
    markers: { cue: "value", lexP: 0.95, form: "complete", values: ["12"], lastValueAgeMs: 400, holdRequest: false, fillerTail: false, openTail: false, projection: false, wordSearch: false,
      repairOpen: false, repaired: false, yieldTag: false, idk: false, asks: false, questionComplete: false, stopRequest: false, repeatRequest: false, codeSwitchAtEdge: false, offTaskMs: 0 },
    her: { speaking: false, utteranceId: null, playedMs: 0, totalMs: null, heardUpTo: null, atClauseBoundary: false, lastAct: "asked_closed", handedOverAt: 1000, recentWords: [], outputLevelDb: null },
    context: { ...NEUTRAL_CONTEXT, exchange: "closed_answer", expected: { form: "integer", slots: 1 }, questionType: "recall", itemId: "it1" },
    pace: { sessions: 0, holdPauseMs: null, answerGapMs: null, speechRateSylPerS: null, fillerRatePerMin: null, source: "band_default", strain: false },
    screen: { events: [], busy: false, lastEventAt: null }, overlap: null,
    safety: { distress: false, kind: null, firstAt: null, checkedThroughMs: 4600, source: null },
    estimates: { semantic: null, acoustic: null }, last: null, lastActs: {},
  };
  const merge = (a, b) => { for (const [k, v] of Object.entries(b)) a[k] = v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" ? merge({ ...a[k] }, v) : v; return a; };
  return merge(base, over);
}
const stub = (d) => ({ id: { id: "stub", stage: "A", version: "t" }, contract: "cce/2026-10-04", reset() {}, tick: () => ({ confidence: 0.9, pComplete: 0.95, pHoldWanted: 0.05, reasons: [], engine: { id: "stub", stage: "A", version: "t" }, ...d }) });

test("V-06: when her reply never sounds, the floor returns with a FRESH turn (the committed words are not committed again)", () => {
  const g = new Governor({ flags: FLAGS });
  g.phase = "committed"; g.phaseSince = 1000;
  const out = g.decide(tick({ t: 7500, phase: "committed", phaseSince: 1000 }), stub({ action: "HOLD", detail: { action: "HOLD", reason: "uncertain" } }));
  assert.equal(out.phase, "child_turn");
  assert.ok(out.events.some((e) => e.kind === "turn_begin" && e.carryFrom === null), JSON.stringify(out.events));
});

// ── V-07: words with no device onset (a whisper: loud frames, no pitch) still end the turn ──
import { EngineHost } from "../src/duplex/host.ts";
test("V-07: a whispered answer (no pitched frame) that the ear heard is committed, not vetoed for good", () => {
  const cmds = [];
  const host = new EngineHost({ session: { lessonId: "L", band: "B3", startedAt: 0, flags: FLAGS }, source: "nemotron", supportsCommit: false, emit: (c) => cmds.push(c) });
  let t = 0, nextTimer = 100;
  const LOUD = Math.pow(10, -24 / 20), QUIET = Math.pow(10, -58 / 20);
  const step = (rms, f0) => { host.frame(t, rms, f0); if (t >= nextTimer) { host.timer(t); nextTimer += 100; } t += 20; };
  for (const end = t + 600; t < end;) step(QUIET, null);
  host.context({ ...NEUTRAL_CONTEXT, exchange: "closed_answer", expected: { form: "integer", slots: 1 }, questionType: "recall", itemId: "it1" }, t, { handsOver: true });
  const start = t;
  for (const end = t + 500; t < end;) step(LOUD, null); // voice with no pitch
  host.stt({ type: "final", itemId: "i1", text: "बारह", t, audioStartMs: start, words: [{ w: "बारह", startMs: start, endMs: t }] });
  for (const end = t + 4000; t < end;) step(QUIET, null);
  const speaks = cmds.filter((c) => c.to === "voice" && c.op === "speak");
  assert.equal(speaks.length, 1, JSON.stringify(cmds.filter((c) => c.to === "log").slice(-3)));
});

import { CascadeDuplex } from "../src/duplex/cascadeDuplex.ts";
test("V-07: mic frames that stop AFTER the start step the engine aside (a running check, not one at 3 s)", async () => {
  const timers = [];
  const fallbacks = [];
  const sink = {
    audio: () => ({ ctx: {}, stream: {}, herOutput: {} }), herSounding: () => false, setServerVad() {}, duck() {}, pause: () => true, resume() {}, stop() {},
    sttCommit() {}, emitChild() {}, micGate() {}, onState: () => {},
    restoreVad() {},
  };
  let live = null;
  const d = new CascadeDuplex(sink, { mode: "on", lane: "d4", startTap: async (x) => { live = x.live; return () => {}; }, setTimeout: (fn, ms) => timers.push({ fn, ms }), onState: (s) => { if (s.fallback) fallbacks.push(s.fallback); } });
  try {
  await d.start();
  // frames flow for the first window
  for (let i = 0; i < 10; i++) live.frame?.(i * 20, 0.001, null);
  timers.shift().fn();
  assert.equal(d.live.stats.frames > 0, true);
  assert.equal(d.fallbackReason, null, "frames came: still live");
  // then they stop: the next check steps aside
  const next = timers.find((x) => x.ms === 3000);
  assert.ok(next, "the check runs again");
  next.fn();
  assert.equal(d.fallbackReason, "no_frames");
  } finally { d.close(); }
});

// ── V-13 / V-14: the bridge's speech stream carries the player's clause sink; the typed lane gets the stream ──
import { UiBridge } from "../src/lesson/uiBridge.ts";
import { FRAMES_ACCEPT } from "../src/lesson/ttsStream.ts";
const frameOf = (type, payload) => {
  const body = type === 0 ? payload : new TextEncoder().encode(JSON.stringify(payload));
  const out = new Uint8Array(4 + body.length);
  out[0] = type; out[1] = (body.length >> 16) & 255; out[2] = (body.length >> 8) & 255; out[3] = body.length & 255;
  out.set(body, 4);
  return out;
};
test("V-13: the bridge's cachingStream hands the clause sink to the speech fetch (clause onsets reach the player)", async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = async () => new Response(new ReadableStream({ start(c) {
    c.enqueue(frameOf(1, { t: "clause", clause: 0, part: 0, atSample: 0, atMs: 0 }));
    c.enqueue(frameOf(0, new Uint8Array(480)));
    c.close();
  } }), { status: 200, headers: { "content-type": FRAMES_ACCEPT } });
  try {
    const b = new UiBridge();
    const got = [];
    const body = await b["cachingStream"]({ lessonId: "00000000-0000-0000-0000-0000000000aa", seq: 3, text: "Namaste" }, new AbortController().signal, { clause: (e) => got.push(e), visemes: () => {} });
    const r = body.getReader();
    while (!(await r.read()).done) { /* drain */ }
    assert.equal(got.length, 1, "the clause onset reached the sink");
    b.dispose();
  } finally { globalThis.fetch = saved; }
});

test("V-14: the typed lane's TextLink streams through the bridge (pause holds her voice; the replay buffer fills)", async () => {
  const b = new UiBridge();
  const link = b["deps"].createLink("text", { lessonId: "L", levels: { mic: { attach() {} }, teacher: { attach() {} } } });
  assert.equal(link.stream, b["cachingStream"]);
  b.dispose();
});

// ── V-11: the hands-free wrapper forwards her pitch; V-22: the thinking-pause cue is not subscribed ──
import { DuplexLive } from "../src/duplex/live.ts";
import { readFileSync } from "node:fs";
test("V-11: CascadeDuplex's frame wrapper passes herF0 (the D5 'not her pitch' echo guard) to the engine", () => {
  const orig = DuplexLive.prototype.frame;
  const seen = [];
  DuplexLive.prototype.frame = function (...a) { seen.push(a); };
  try {
    const sink = { audio: () => null, herSounding: () => false, setServerVad() {}, duck() {}, pause: () => true, resume() {}, stop() {}, sttCommit() {}, emitChild() {}, micGate() {}, restoreVad() {} };
    const d = new CascadeDuplex(sink, { mode: "on", lane: "d5", setTimeout: () => 0 });
    d.live.frame(100, 0.01, 220, -30, 210);
    assert.equal(seen.at(-1)[4], 210);
    d.close();
  } finally { DuplexLive.prototype.frame = orig; }
});
test("V-22: the live mic tap does not subscribe the engine to the thinking-pause cue (shadow until a children's pilot)", () => {
  const src = readFileSync(new URL("../src/duplex/liveTap.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /onThinkingPause|import\([^)]*holdBus/);
});

// ── V-10: once her reply to a commit has played, a later revoke never merges the next answer into it ──
test("V-10: an answer equal to the previous one, after a revoke with no turn in flight, is posted (not merged away)", () => {
  const commits = [];
  const port = { duck() {}, pause: () => true, resume() {}, stop() {}, commit: (t) => commits.push(t), sttCommit() {}, dropReply() {}, fallback() {}, state() {}, micGate() {} };
  let clock = 1000;
  const live = new DuplexLive({ lessonId: "t", port, now: () => clock, setInterval: () => 1, clearInterval: () => {}, band: "B2" });
  live.start();
  const speak = (t, text) => ({ to: "voice", op: "speak", t, reason: "turn_end", firstSound: "prompt", verdictNotBefore: null, text, textHash: "h", uptake: null, turnSeq: 1 });
  live["handle"](speak(clock, "हाँ"));
  live.herStart("Achha, toh shuru karein?");
  clock += 3000;
  live.herEnd();
  clock += 9000;
  live["handle"]({ to: "think", op: "revoke", t: clock });
  live["handle"](speak(clock + 500, "हाँ"));
  assert.equal(commits.length, 2);
  assert.equal(commits[1].revokeOf, undefined, JSON.stringify(commits[1]));
  live.stop?.();
});

// ── V-08 / V-09: the governor's hold offer with no carried onset; a verdict reply that started is not revoked ──
import { HOLD } from "../src/duplex/config.ts";
test("V-08: after a granted hold with no onset this turn, the hold offer is not vetoed (silence = time since the hold)", () => {
  const g = new Governor({ flags: FLAGS });
  g.phase = "hold_requested"; g.phaseSince = 1000; g["holdGrantedHash"] = "h1"; // "रुको" granted the hold
  const t = 1000 + HOLD.offerMs + 200;
  const out = g.decide(tick({ t, phase: "hold_requested", phaseSince: 1000, child: { silenceRunMs: null, firstOnsetAt: null, voicing: false }, markers: { holdRequest: true } }),
    stub({ action: "CUT_IN", detail: { action: "CUT_IN", reason: "hold_offer" } }));
  assert.equal(out.decision.action, "CUT_IN", JSON.stringify(out.decision.reasons));
});
test("V-09: a child sound four seconds into her reply to a number answer does not revoke it (her start is the verdict)", () => {
  const g = new Governor({ flags: FLAGS });
  g.phase = "child_turn"; g.phaseSince = 1000;
  g.decide(tick({ t: 5000 }), stub({ action: "SPEAK", detail: { action: "SPEAK", reason: "turn_end", firstSound: "uptake", verdictNotBefore: 5300 } }));
  assert.equal(g.phase, "committed");
  g.observe({ kind: "her_start", t: 5400, utteranceId: "u1" });
  const ev = g.observe({ kind: "child_onset", t: 9400, at: 9400 });
  assert.equal(g["pendingRevoke"], false);
  assert.ok(!ev.some((e) => e.kind === "revoke"));
});
