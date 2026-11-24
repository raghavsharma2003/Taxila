// Audit 2026-11-09, voice (docs/design/round7/audit/voice.md): the small fixes. Each test fails on int/r6 at 21a.
//   V-11 the engine's frame wrapper forwards her output's pitch (the D5 pre-duck never fires on her own echo)
//   V-12 the D5 upgrade admits a paired child device
//   V-15 an outbox edit / kick acts on the live lesson's record, never on an older lesson's being resent
//   V-16 an edit that lands after the server answered is not reported as sent and leaves no ghost record
//   V-24 a short utterance with a steep pitch slope keeps its voice features
//   V-28 the uptake prelude has no pitch attribute
//   V-32 shadow telemetry reads the engine's reason out of `speak:<reason>:<firstSound>`
//   V-35 a device forced to shadow stays shadow when the server's answer is unknown
// No network, no database. Globals are swapped inside a test and restored (tests/test-isolation.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { CascadeDuplex } from "../src/duplex/cascadeDuplex.ts";
import { DuplexLive } from "../src/duplex/live.ts";
import { handleD5Upgrade } from "../server/duplex/d5route.js";
import { Outbox, MemoryOutboxStore } from "../src/lesson/outbox.ts";
import { UtteranceTracker } from "../src/voice/tracker.ts";
import { validateUtterance } from "../server/voice/features.js";
import { preludeRender } from "../server/voice/expressive/render.js";
import { ShadowTelemetry } from "../src/duplex/shadowTelemetry.ts";
import { resolveDuplexMode, resetDuplexFlagCache, DUPLEX_KEY } from "../src/duplex/flags.ts";

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

test("V-11 CascadeDuplex: her own echo at her own pitch never pre-ducks her on D5", async () => {
  let clock = 0, tapLive = null, timer = null;
  const ducks = [];
  const surface = { lessonId: "t", audio: () => ({ ctx: {}, stream: {}, herOutput: null }), herSounding: () => true, duck: (l) => ducks.push(l), pause: () => true, resume() {}, stop() {}, emitChild() {}, sttCommit() {}, setServerVad() {}, onState() {} };
  const d = new CascadeDuplex(surface, { mode: "on", lane: "d5", preDuck: true, now: () => clock, setTimeout: () => 0, setInterval: (fn) => { timer = fn; return 1; }, clearInterval() {}, shadowSink: null, startTap: async ({ live }) => { tapLive = live; return () => {}; } });
  await d.start();
  d.replyAudible("Dekho, jab hum do sankhyaon ko jodte hain to pehle ikai ke ank jodte hain, phir dahai ke ank.");
  // the echo-only frames of tests/r5-duplex.test.mjs, fed the way the shared tap feeds them: five arguments
  for (; clock < 3000; clock += 20) { tapLive.frame(clock, 0.1, clock % 200 < 100 ? 210 : 420, -20, 210); if (clock % 100 === 80) timer?.(); }
  assert.equal(d.live.d5.preDucks, 0, "before the fix the wrapper dropped herF0 and she was ducked once");
  d.close();
});

test("V-12 handleD5Upgrade: a paired child device (tx_child only) is not refused for scope", async () => {
  const env = { TAXILA_VOICELIVE_ENDPOINT: "https://example-resource.cognitiveservices.azure.com", TAXILA_VOICELIVE_KEY: "k" };
  const lessonId = "00000000-0000-0000-0000-0000000000aa";
  const req = { method: "GET", url: `/api/duplex/voicelive?lessonId=${lessonId}`, headers: { cookie: "tx_child=d.devicetoken", host: "taxila.dev", origin: "https://taxila.dev", upgrade: "websocket", connection: "Upgrade", "sec-websocket-version": "13", "sec-websocket-key": Buffer.alloc(16).toString("base64") } };
  let wrote = "", scopeSeen = null;
  const socket = { destroyed: false, writable: true, write: (s) => { wrote += s; }, end: (s) => { wrote += s ?? ""; }, destroy() { this.destroyed = true; }, on() {} };
  // the child check stands in for requireChild: it records whether the request carried the scope mark the real one needs
  const child = async (r) => { scopeSeen = r[Symbol.for("taxila.childScope")] === true; throw Object.assign(new Error("stop here"), { status: 401 }); };
  await handleD5Upgrade(req, socket, Buffer.alloc(0), { env, authorize: { lookupLesson: async () => ({ id: lessonId, child_id: "c1", ended_at: null }), child } });
  assert.equal(scopeSeen, true, "before the fix the upgrade reached requireChild with no scope mark: 403 for every paired device");
});

test("V-15 Outbox: an edit and a kick act on the live lesson's record while another lesson's is being resent", async () => {
  const store = new MemoryOutboxStore(true);
  await store.put({ key: "A:3", lessonId: "A", turnSeq: 3, req: { lessonId: "A", childText: "old answer in A", turnSeq: 3 }, at: 1, attempts: 4, status: "failed" });
  const ob = new Outbox({ store });
  const wire = [];
  let releaseB = () => {};
  const hang = (name) => (req, sig) => new Promise((res, rej) => { wire.push([name, req.childText, !!req.edited]); if (name === "B") releaseB = res; else setTimeout(() => res({}), 60); sig.addEventListener("abort", () => rej(sig.reason)); });
  const pB = ob.send({ lessonId: "B", childText: "paanch" }, hang("B"));
  await tick();
  const pA = ob.resend("A:3", "A", hang("A")); // flushOthers reaching lesson A's held answer afterwards
  await tick();
  assert.equal(await ob.edit("paanch nahi, pachaas", "B"), true);
  await tick();
  assert.deepEqual(wire.filter((w) => w[2]), [["B", "paanch nahi, pachaas", true]], "the fix goes to lesson B (before: written into lesson A's answer)");
  assert.ok(!wire.some((w) => w[0] === "A" && w[1] !== "old answer in A"), "lesson A's answer is untouched");
  assert.equal(ob.kick("C"), false, "nothing of lesson C is in flight");
  releaseB({});
  await Promise.allSettled([pA, pB]);
});

test("V-16 Outbox: an edit after the server answered returns false and leaves nothing held", async () => {
  const base = new MemoryOutboxStore(true);
  let open = () => {};
  const gate = new Promise((r) => (open = r));
  const store = { durable: true, put: (r) => base.put(r), claim: (r, f) => base.claim(r, f), list: (l) => base.list(l), all: () => base.all(), delete: async (k) => { await base.delete(k); await gate; } };
  const ob = new Outbox({ store });
  const wire = [];
  const p = ob.send({ lessonId: "L", childText: "teen" }, async (req) => { wire.push(req.childText); return { ok: 1 }; });
  await tick();
  const edited = await ob.edit("teen nahi, tees", "L");
  open();
  await p;
  await tick();
  assert.equal(edited, false, "the turn already landed: the fix must go as a new answer (before: true, and nothing was sent)");
  assert.deepEqual(await ob.pending("L"), [], "no ghost record");
  assert.deepEqual(wire, ["teen"]);
});

test("V-24 voice features: a 120 ms 'haan' with a steep pitch slope is accepted", () => {
  const T0 = 1_760_000_000_000;
  const tr = new UtteranceTracker();
  tr.addFrames([300, 300, 300, 520, 520, 520].map((f0, i) => ({ t: T0 + i * 20, rmsDb: -20, f0, speech: true })));
  tr.speechStart(T0);
  tr.speechEnd(T0 + 120);
  const u = JSON.parse(JSON.stringify(tr.finalize({ text: "haan" }, T0 + 600)));
  assert.ok(Math.abs(u.features.f0SlopeStPerS) > 100, "the client really sends a slope past the old bound");
  assert.doesNotThrow(() => validateUtterance(u));
});

test("V-28 preludeRender: the uptake prelude carries no pitch attribute", () => {
  const out = preludeRender("62", { engine: "dhd", dhd: { voice: "hi-IN-Diya:DragonHDLatestNeural", lang: "hi-IN", baseRate: 0 }, spoken: {} });
  assert.equal(out.engine, "dhd");
  assert.doesNotMatch(out.ssml, / pitch="/, out.ssml);
});

test("V-32 ShadowTelemetry: a turn's reason is read from the engine's detail", () => {
  const tel = new ShadowTelemetry({ mode: "on", band: null, lane: "live_transcribe" });
  tel.row({ t: 1000, action: "SPEAK", reasons: [], detail: "speak:turn_end:reply" });
  assert.equal(tel.turn?.reason, "turn_end", "before the fix: null (the whole detail string was compared)");
});

test("V-35 resolveDuplexMode: a device key of shadow stays shadow when the server cannot be read", async () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const mem = new Map([[DUPLEX_KEY, "shadow"]]);
  Object.defineProperty(globalThis, "localStorage", { configurable: true, writable: true, value: { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) } });
  try {
    resetDuplexFlagCache();
    const failing = async () => { throw new Error("offline"); };
    assert.equal(await resolveDuplexMode(failing), "shadow", "before the fix: on");
  } finally {
    resetDuplexFlagCache();
    if (saved) Object.defineProperty(globalThis, "localStorage", saved); else delete globalThis.localStorage;
  }
});

// ───────────── V-04, on the engine: why a stop by hand is reported as ENDED ─────────────

/** A half-duplex (D4) engine under a fake clock: her line is cut by a tap at 2 s, then the child answers. */
function tapStopRun(tell) {
  let now = 1_000_000;
  const timers = [];
  const run = (to) => { for (;;) { timers.sort((a, b) => a.at - b.at); const x = timers[0]; if (!x || x.at > to) break; now = x.at; x.at += x.every; x.fn(); } now = to; };
  const commits = [];
  const port = { duck() {}, pause: () => true, resume() {}, stop() {}, commit: (t) => commits.push(t.text), sttCommit() {}, dropReply() {}, fallback() {}, state() {}, micGate() {} };
  const live = new DuplexLive({ lessonId: "L1", port, now: () => now, setInterval: (fn, ms) => { timers.push({ at: now + ms, every: ms, fn }); return timers.length; }, clearInterval() {}, halfDuplex: true });
  const LOUD = 10 ** (-24 / 20), QUIET = 10 ** (-60 / 20), ECHO = 10 ** (-52 / 20);
  const pending = [];
  let herOn = false;
  const frame = (loud) => { while (pending.length && pending[0][0] <= now) live.stt(pending.shift()[1]); live.frame(now, loud ? LOUD : herOn ? ECHO : QUIET, loud ? 240 : null, herOn ? -22 : null); };
  const quiet = (ms) => { const end = now + ms; while (now < end) { frame(false); run(now + 20); } };
  const say = (text, ms) => {
    const id = "item_1", start = now;
    pending.push([start + 10, { type: "input_audio_buffer.speech_started", item_id: id, audio_start_ms: start - 1_000_000 }]);
    while (now < start + ms) { frame(true); run(now + 20); }
    pending.push([start + ms + 500, { type: "input_audio_buffer.speech_stopped", item_id: id, audio_end_ms: start + ms - 1_000_000 }]);
    pending.push([start + ms + 600, { type: "conversation.item.input_audio_transcription.delta", item_id: id, delta: text }]);
    pending.push([start + ms + 700, { type: "conversation.item.input_audio_transcription.completed", item_id: id, transcript: text }]);
  };
  live.start();
  quiet(800);
  live.setUi({ beat: "practice", answerForm: "number", handover: "answer" });
  herOn = true;
  live.herStart("Chalo batao, saat aur paanch kitne hote hain?");
  quiet(1200);
  herOn = false; // the tap: her audio is cut
  tell(live);
  quiet(3000);
  say("बारह", 500);
  quiet(6000);
  live.close?.();
  return commits;
}

test("V-04 engine: after a tap cuts her line, the child's answer is committed only when the engine hears the line ENDED", () => {
  assert.deepEqual(tapStopRun((live) => live.herEnd()), ["बारह"], "ended: the floor is the child's and the answer is committed");
  assert.deepEqual(tapStopRun((live) => live.herStopped()), [], "stopped alone: she keeps her turn, the answer is never committed (so the link reports a stop by hand as ended)");
});
