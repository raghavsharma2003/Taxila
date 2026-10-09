// ship5 p1-duplex: the hands-free duplex lesson mode end to end on the device side, with no browser and no network.
// DuplexLive (src/duplex/live.ts) is driven exactly as the cascade link drives it: 20 ms mic frames (linear RMS + f0) with her
// output level, realtime TRANSCRIPTION events in the wire format (item_id, delta, transcript), her reply start / end / stop,
// and the 100 ms timer; its port records what the link would do. CascadeDuplex (src/duplex/cascadeDuplex.ts) is the link
// glue: captions folded per turn, the quota fallback, the no-frames watchdog, revoked replies dropped. flags.ts and the
// server kill switch (server/duplex/config.js) close the loop. Synthetic signals: these prove behaviour, not rates.
import { test } from "node:test";
import assert from "node:assert/strict";

import { DuplexLive, EchoCoupling, TranscriptionTap, contextFromUi, herActOf, isQuotaError, numberFormOf, handsOverOf } from "../src/duplex/live.ts";
import { CascadeDuplex, DUPLEX_SERVER_VAD_MS, NO_FRAMES_MS } from "../src/duplex/cascadeDuplex.ts";
import { resolveDuplexMode, resetDuplexFlagCache, DUPLEX_KEY } from "../src/duplex/flags.ts";
import { duplexMode, duplexConfigRoutes } from "../server/duplex/config.js";
import { OVERLAP } from "../src/duplex/config.ts";

// ───────────────────────────── a fake clock + port ─────────────────────────────

const LOUD = Math.pow(10, -24 / 20); // the child at the mic
const QUIET = Math.pow(10, -60 / 20); // the room
const ECHO = Math.pow(10, -52 / 20); // her voice leaking back through the AEC (≈ -30 dB under her -22 dBFS output)

function clock() {
  let now = 1_000_000;
  const timers = [];
  let seq = 0;
  return {
    now: () => now,
    set: (v) => { now = v; },
    setTimeout: (fn, ms) => { const h = ++seq; timers.push({ h, at: now + ms, fn, every: 0 }); return h; },
    setInterval: (fn, ms) => { const h = ++seq; timers.push({ h, at: now + ms, fn, every: ms }); return h; },
    clearInterval: (h) => { const i = timers.findIndex((x) => x.h === h); if (i >= 0) timers.splice(i, 1); },
    /** advance to `to`, firing due timers in order */
    run(to) {
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const x = timers[0];
        if (!x || x.at > to) break;
        now = x.at;
        if (x.every) x.at += x.every; else timers.shift();
        x.fn();
      }
      now = to;
    },
  };
}

function fakePort() {
  const log = [];
  return {
    log,
    gain: 1,
    paused: false,
    stopped: 0,
    commits: [],
    duck(level) { this.gain = level; log.push(["duck", level]); },
    pause() { this.paused = true; log.push(["pause"]); return true; },
    resume() { this.paused = false; log.push(["resume"]); },
    stop() { this.stopped++; log.push(["stop"]); },
    commit(turn) { this.commits.push(turn); log.push(["commit", turn.text]); },
    sttCommit() { log.push(["sttCommit"]); },
    dropReply(id) { log.push(["drop", id]); },
    fallback(reason) { log.push(["fallback", reason]); },
    state() {},
  };
}

/**
 * A DuplexLive rig on the production lane (live_transcribe). `say(text, ms)` voices the child for `ms` and schedules the
 * transcription of it the way gpt-live-transcribe delivers it: a delta ~600 ms after the audio, the final ~500 ms after the
 * item's end. `her(text)` starts her reply; frames then carry her output level and her echo under the AEC.
 */
function rig({ ui = { answerForm: "number" }, herLine = "अच्छा बताओ, सात और पाँच कितने होते हैं?" } = {}) {
  const c = clock();
  const port = fakePort();
  const live = new DuplexLive({ lessonId: "L1", port, now: c.now, setInterval: c.setInterval, clearInterval: c.clearInterval });
  const pending = []; // [at, rawEvent]
  let item = 0;
  let herOn = false;
  const frame = (loud) => {
    const t = c.now();
    while (pending.length && pending[0][0] <= t) live.stt(pending.shift()[1]);
    const rms = loud ? LOUD : herOn ? ECHO : QUIET;
    live.frame(t, rms, loud ? 260 : null, herOn ? -22 : null);
  };
  const r = {
    c, port, live,
    /** play `ms` of the room (and her echo, if she is talking) */
    quiet(ms) { const end = c.now() + ms; while (c.now() < end) { frame(false); c.run(c.now() + 20); } },
    /** the child voices for `ms` and the STT later transcribes it as `text` (one item) */
    say(text, ms, { deltaLag = 600, finalLag = 500 } = {}) {
      const id = `item_${++item}`;
      const start = c.now();
      pending.push([start + 10, { type: "input_audio_buffer.speech_started", item_id: id, audio_start_ms: start - 1_000_000 }]);
      const end = start + ms;
      while (c.now() < end) { frame(true); c.run(c.now() + 20); }
      const toks = text.split(/\s+/);
      toks.forEach((w, i) => pending.push([start + ((i + 1) * ms) / toks.length + deltaLag, { type: "conversation.item.input_audio_transcription.delta", item_id: id, delta: (i ? " " : "") + w }]));
      pending.push([end + finalLag, { type: "conversation.item.input_audio_transcription.completed", item_id: id, transcript: text }]);
      pending.sort((a, b) => a[0] - b[0]);
      return id;
    },
    her(text = herLine) { live.setUi(ui); herOn = true; live.herStart(text); },
    herEnd() { herOn = false; live.herEnd(); },
    herOff() { herOn = false; },
    commits: () => port.commits,
  };
  live.start();
  r.quiet(800); // the room's floor is learned
  return r;
}

// ───────────────────────────── behaviour ─────────────────────────────

test("hands-free: a finished answer after her question is committed by the engine (no button, no final-as-turn)", () => {
  const r = rig();
  r.her();
  r.quiet(2500);
  r.herEnd();
  r.quiet(700);
  r.say("बारह", 450);
  const endAt = r.c.now();
  r.quiet(3000);
  const commits = r.commits();
  assert.equal(commits.length, 1, `one committed turn, got ${JSON.stringify(r.port.log)}`);
  assert.match(commits[0].text, /बारह/);
  assert.ok(commits[0].duplex.transcriptHash, "the turn carries the engine's transcript hash");
  assert.equal(commits[0].duplex.safetyPending, null);
  const gap = r.live.stats.gaps[0];
  assert.ok(gap !== undefined && gap <= 2500, `decision gap ${gap} ms after the child's last voiced frame (backstop bound)`);
  assert.ok(r.live.stats.commits === 1 && r.live.stats.frames > 100);
  void endAt;
});

test("a thinking pause inside an answer is not cut off; the turn is committed once, after the answer", () => {
  const r = rig({ ui: { beat: "explain" }, herLine: "अच्छा, तुम बताओ कि भिन्न में नीचे वाला नंबर क्या बताता है?" });
  r.her(); r.quiet(2500); r.herEnd(); r.quiet(500);
  r.say("मतलब नीचे वाला जो है ना वो", 1500);
  r.quiet(1200); // a thinking pause mid-explanation (an open tail: "वो")
  const before = r.commits().length;
  r.say("कितने हिस्से हैं वो बताता है", 1600);
  r.quiet(4000);
  assert.equal(before, 0, `no commit inside the thinking pause: ${JSON.stringify(r.port.log)}`);
  assert.equal(r.commits().length, 1);
  assert.match(r.commits()[0].text, /हिस्से/);
});

test("barge-in: sustained child speech over her hushes her within ~200 ms and then stops or pauses her", () => {
  const r = rig({ ui: { beat: "explain" }, herLine: "तो देखो, जब हम pizza को चार बराबर हिस्सों में काटते हैं, तो हर हिस्सा एक चौथाई होता है, और दो हिस्से मिलकर आधा बनाते हैं।" });
  r.her();
  r.quiet(1500);
  const onset = r.c.now();
  r.say("रुको रुको मुझे समझ नहीं आया दीदी", 1800);
  r.quiet(1500);
  const hush = r.port.log.find((x) => x[0] === "duck" && x[1] <= OVERLAP.hushLevel);
  assert.ok(hush, `hushed: ${JSON.stringify(r.port.log)}`);
  assert.ok(r.live.stats.hushLatency[0] <= 200, `hush ${r.live.stats.hushLatency[0]} ms after the overlap onset`);
  assert.ok(r.port.paused || r.port.stopped > 0, "she yielded (paused or stopped)");
  assert.ok(r.live.stats.yields >= 1);
  void onset;
});

test("a continuer ('हम्म') over her does not stop her: no pause, no stop, her gain comes back", () => {
  const r = rig({ ui: { beat: "explain" }, herLine: "तो देखो, जब हम pizza को चार बराबर हिस्सों में काटते हैं, तो हर हिस्सा एक चौथाई होता है, और दो हिस्से मिलकर आधा बनाते हैं।" });
  r.her();
  r.quiet(1500);
  r.say("हम्म", 320);
  r.quiet(2500);
  assert.equal(r.port.stopped, 0, `not stopped: ${JSON.stringify(r.port.log)}`);
  assert.equal(r.port.paused, false, "not left paused");
  assert.equal(r.commits().length, 0, "a continuer is not a turn");
  assert.equal(r.port.gain, 1, "her level restored");
});

test("'haan / acchha' continuers over her keep her talking (several in one line)", () => {
  const r = rig({ ui: { beat: "explain" }, herLine: "तो देखो, जब हम pizza को चार बराबर हिस्सों में काटते हैं, तो हर हिस्सा एक चौथाई होता है, और दो हिस्से मिलकर आधा बनाते हैं, और फिर हम तीन हिस्से लेते हैं।" });
  r.her();
  r.quiet(1200); r.say("अच्छा", 380); r.quiet(1500); r.say("हाँ", 300); r.quiet(2000);
  assert.equal(r.port.stopped, 0, JSON.stringify(r.port.log));
  assert.equal(r.port.paused, false);
  assert.equal(r.commits().length, 0);
});

test("shadow mode computes and never actuates", () => {
  const c = clock();
  const port = fakePort();
  const live = new DuplexLive({ lessonId: "L", port, mode: "shadow", now: c.now, setInterval: c.setInterval, clearInterval: c.clearInterval });
  live.start();
  for (let i = 0; i < 40; i++) { live.frame(c.now(), QUIET, null, null); c.run(c.now() + 20); }
  live.herStart("तो देखो, एक चौथाई का मतलब है चार में से एक हिस्सा।");
  for (let i = 0; i < 80; i++) { live.frame(c.now(), LOUD, 250, -22); c.run(c.now() + 20); }
  assert.ok(live.stats.frames > 100);
  assert.deepEqual(port.log.filter((x) => x[0] !== "duck" || true).filter((x) => ["pause", "stop", "commit", "duck", "sttCommit"].includes(x[0])), []);
});

test("an engine fault degrades to the shipped path (port.fallback) and never throws to the link", () => {
  const c = clock();
  const port = fakePort();
  const live = new DuplexLive({ lessonId: "L", port, now: c.now, setInterval: c.setInterval, clearInterval: c.clearInterval });
  live.start();
  // a corrupt event shape must not throw; a host that throws is caught and degrades
  live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: 7, transcript: null });
  live.host.frame = () => { throw new Error("boom"); };
  assert.doesNotThrow(() => live.frame(c.now(), LOUD, 200, null));
  assert.equal(live.fallenBack, "engine_error");
  assert.deepEqual(port.log.at(-1), ["fallback", "engine_error"]);
  assert.equal(live.live, false);
});

// ───────────────────────────── pure helpers ─────────────────────────────

test("context from the Director's ui: the FORM of the answer, never the key", () => {
  assert.equal(contextFromUi({ answerForm: "number" }, "सात आठे कितने होते हैं?").exchange, "closed_answer");
  assert.equal(contextFromUi({ answerForm: "number" }, "तीन बटा चार में कितने हिस्से?").expected.form, "fraction");
  assert.equal(numberFormOf("कितने सेंटीमीटर लंबा है?"), "number_unit");
  assert.equal(herActOf("क्या ये सही है?", {}), "asked_yes_no");
  assert.equal(herActOf("तो देखो, आधा मतलब दो में से एक।", {}), "explaining");
  assert.equal(contextFromUi({ beat: "explain" }, "क्यों?").exchange, "open_explanation");
  assert.equal(handsOverOf("ठीक है, अगला।", { handover: "chain" }), false);
  assert.equal(handsOverOf("बताओ?", {}), true);
});

test("quota / capacity errors are recognised; ordinary errors are not", () => {
  assert.equal(isQuotaError("rate_limit_exceeded"), true);
  assert.equal(isQuotaError(undefined, "Too Many Requests (429)"), true);
  assert.equal(isQuotaError("server_busy"), true);
  assert.equal(isQuotaError("input_audio_buffer_commit_empty"), false);
  assert.equal(isQuotaError("invalid_request_error", "bad audio format"), false);
});

test("echo coupling learns the AEC residue from frames where only she sounds", () => {
  const e = new EchoCoupling();
  assert.equal(e.db, -30); // prior
  for (let i = 0; i < 100; i++) e.push(-52, -22);
  assert.ok(Math.abs(e.db - -30) < 0.5);
  for (let i = 0; i < 250; i++) e.push(-62, -22);
  assert.ok(Math.abs(e.db - -40) < 0.5, `coupling ${e.db}`);
});

test("transcription tap: deltas, finals and speech edges on the client clock, never later than spoken", () => {
  const tap = new TranscriptionTap();
  const s = tap.map({ type: "input_audio_buffer.speech_started", item_id: "a", audio_start_ms: 1000 }, 51_300);
  assert.equal(s.type, "speech_started");
  const d = tap.map({ type: "conversation.item.input_audio_transcription.delta", item_id: "a", delta: "बा" }, 52_000);
  assert.equal(d.delta, true);
  assert.equal(d.audioStartMs, s.audioStartMs);
  tap.map({ type: "input_audio_buffer.speech_stopped", item_id: "a", audio_end_ms: 1800 }, 52_200);
  const f = tap.map({ type: "conversation.item.input_audio_transcription.completed", item_id: "a", transcript: "बारह" }, 52_600);
  assert.equal(f.type, "final");
  assert.ok(f.audioEndMs <= 52_200);
  assert.equal(tap.map({ type: "session.updated" }, 1), null);
});

// ───────────────────────────── CascadeDuplex (the link glue) ─────────────────────────────

function surface() {
  const s = {
    lessonId: "L9", events: [], vad: [], states: [], gain: [], paused: 0, stopped: 0, resumed: 0, commits: 0,
    audio: () => ({ ctx: {}, stream: {}, herOutput: null }),
    herSounding: () => false,
    duck(l) { s.gain.push(l); },
    pause() { s.paused++; return true; },
    resume() { s.resumed++; },
    stop() { s.stopped++; },
    emitChild(e) { s.events.push(e); },
    sttCommit() { s.commits++; },
    setServerVad(ms) { s.vad.push(ms); },
    onState(st) { s.states.push(st); },
  };
  return s;
}

test("CascadeDuplex: starts on the shared tap with the 1,500 ms server-VAD backstop, folds captions, commits with the duplex summary", async () => {
  const c = clock();
  const s = surface();
  let feed = null;
  const d = new CascadeDuplex(s, { mode: "on", now: c.now, setTimeout: c.setTimeout, setInterval: c.setInterval, clearInterval: c.clearInterval,
    startTap: async ({ live }) => { feed = live; return () => { feed = null; }; } });
  assert.equal(await d.start(), true);
  assert.deepEqual(s.vad, [DUPLEX_SERVER_VAD_MS]);
  assert.equal(d.deciding, true);
  // two STT items inside one turn → one caption id
  assert.equal(d.onSttEvent({ type: "conversation.item.input_audio_transcription.delta", item_id: "i1", delta: "हम्म" }), true);
  assert.equal(d.onSttEvent({ type: "conversation.item.input_audio_transcription.completed", item_id: "i1", transcript: "हम्म।" }), true);
  assert.equal(d.onSttEvent({ type: "conversation.item.input_audio_transcription.delta", item_id: "i2", delta: "बारह" }), true);
  assert.equal(d.onSttEvent({ type: "input_audio_buffer.speech_started", item_id: "i3" }), false, "speech edges stay the link's");
  const caps = s.events.filter((e) => e.type === "child_partial");
  assert.ok(caps.every((e) => e.itemId === "i1"));
  assert.equal(caps.at(-1).text, "हम्म। बारह");
  // a commit from the engine → child_final with the duplex summary, on the first item's caption
  d.live.o.port.commit({ turnId: 1, text: "हम्म। बारह", startedAt: 5, duplex: { transcriptHash: "abc", safetyPending: null } });
  const fin = s.events.at(-1);
  assert.equal(fin.type, "child_final");
  assert.equal(fin.itemId, "i1");
  assert.equal(fin.duplex.transcriptHash, "abc");
  assert.ok(feed, "frames feed from the tap");
  d.close();
  assert.equal(feed, null, "the tap lease is released on close");
});

test("CascadeDuplex: an STT quota error steps aside for today's path (VAD restored, state says fallback, finals go back to the link)", async () => {
  const c = clock();
  const s = surface();
  const d = new CascadeDuplex(s, { mode: "on", now: c.now, setTimeout: c.setTimeout, setInterval: c.setInterval, clearInterval: c.clearInterval, startTap: async () => () => {} });
  await d.start();
  for (let i = 0; i < 10; i++) { d.live.frame(c.now(), QUIET, null, null); c.run(c.now() + 20); }
  assert.equal(d.onServerError("invalid_value", "audio format"), false, "an ordinary error is the link's");
  assert.equal(d.onServerError("rate_limit_exceeded", "Rate limit reached"), true);
  assert.equal(d.deciding, false);
  assert.equal(d.fallback, "stt_rate_limited");
  assert.deepEqual(s.vad, [DUPLEX_SERVER_VAD_MS, null], "the token's own turn detection is restored");
  assert.equal(s.states.at(-1).fallback, "stt_rate_limited");
  assert.equal(s.states.at(-1).live, false);
  assert.equal(s.gain.at(-1), 1, "her gain restored");
  assert.equal(d.onSttEvent({ type: "conversation.item.input_audio_transcription.completed", item_id: "x", transcript: "बारह" }), false, "finals are turns again");
});

test("CascadeDuplex: a tap that never delivers frames falls back after the watchdog; a tap that fails falls back at once", async () => {
  const c = clock();
  const s = surface();
  const d = new CascadeDuplex(s, { mode: "on", now: c.now, setTimeout: c.setTimeout, setInterval: c.setInterval, clearInterval: c.clearInterval, startTap: async () => () => {} });
  await d.start();
  c.run(c.now() + NO_FRAMES_MS + 50);
  assert.equal(d.fallback, "no_frames");
  const s2 = surface();
  const d2 = new CascadeDuplex(s2, { mode: "on", now: c.now, setTimeout: c.setTimeout, setInterval: c.setInterval, clearInterval: c.clearInterval, startTap: async () => { throw new Error("no AudioWorklet"); } });
  assert.equal(await d2.start(), false);
  assert.equal(d2.fallback, "no_frames");
  assert.deepEqual(s2.vad, [], "the backstop VAD was never sent");
});

test("CascadeDuplex: a reply to a revoked commit is dropped once; shadow never consumes events or drops replies", async () => {
  const c = clock();
  const s = surface();
  const d = new CascadeDuplex(s, { mode: "on", now: c.now, setTimeout: c.setTimeout, setInterval: c.setInterval, clearInterval: c.clearInterval, startTap: async () => () => {} });
  await d.start();
  d.live.o.port.dropReply(1);
  assert.equal(d.shouldDropReply(), true);
  assert.equal(d.shouldDropReply(), false, "only the one reply");
  d.live.o.port.dropReply(2);
  c.run(c.now() + 9000);
  assert.equal(d.shouldDropReply(), false, "a stale revoke does not drop a later reply");
  const sh = new CascadeDuplex(surface(), { mode: "shadow", now: c.now, setTimeout: c.setTimeout, setInterval: c.setInterval, clearInterval: c.clearInterval, startTap: async () => () => {} });
  await sh.start();
  assert.equal(sh.deciding, false);
  assert.equal(sh.onSttEvent({ type: "conversation.item.input_audio_transcription.completed", item_id: "x", transcript: "बारह" }), false);
  assert.equal(sh.shouldDropReply(), false);
});

test("CascadeDuplex: her pause / stop reach the host as 'stopped' at the word boundary", async () => {
  const c = clock();
  const s = surface();
  const d = new CascadeDuplex(s, { mode: "on", now: c.now, setTimeout: c.setTimeout, setInterval: c.setInterval, clearInterval: c.clearInterval, startTap: async () => () => {} });
  await d.start();
  let stopped = 0;
  d.live.herStopped = () => { stopped++; };
  assert.equal(d.live.o.port.pause(), true);
  c.run(c.now() + 60);
  d.live.o.port.stop();
  c.run(c.now() + 60);
  assert.equal(s.paused, 1);
  assert.equal(s.stopped, 1);
  assert.equal(stopped, 2);
});

// ───────────────────────────── the switch ─────────────────────────────

test("kill switch: server env → /api/duplex/config; device override beats it; an unreadable switch runs shadow", async () => {
  assert.equal(duplexMode({}), "on");
  assert.equal(duplexMode({ TAXILA_DUPLEX: "0" }), "off");
  assert.equal(duplexMode({ TAXILA_DUPLEX: "off" }), "off");
  assert.equal(duplexMode({ TAXILA_DUPLEX: "shadow" }), "shadow");
  assert.equal(duplexMode({ TAXILA_DUPLEX: "1" }), "on");
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
  const prev = process.env.TAXILA_DUPLEX;
  process.env.TAXILA_DUPLEX = "0";
  await duplexConfigRoutes["GET /api/duplex/config"]({}, res);
  if (prev === undefined) delete process.env.TAXILA_DUPLEX; else process.env.TAXILA_DUPLEX = prev;
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { duplex: "off" });
  assert.equal(res.headers["cache-control"], "no-store");

  const store = new Map();
  const had = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } });
  try {
    const srv = (mode, ok = true) => async () => ({ ok, json: async () => ({ duplex: mode }) });
    resetDuplexFlagCache();
    assert.equal(await resolveDuplexMode(srv("on")), "on");
    resetDuplexFlagCache();
    assert.equal(await resolveDuplexMode(srv("off")), "off", "the server kill switch turns it off");
    resetDuplexFlagCache();
    assert.equal(await resolveDuplexMode(srv("shadow")), "shadow");
    resetDuplexFlagCache();
    // round 3 (duplex): production is shadow; a switch that cannot be read never turns the unproven floor on for a child
    assert.equal(await resolveDuplexMode(async () => { throw new Error("offline"); }), "shadow", "an unreadable switch runs shadow");
    resetDuplexFlagCache();
    assert.equal(await resolveDuplexMode(srv(null, false)), "shadow", "a missing route runs shadow");
    store.set(DUPLEX_KEY, "0");
    resetDuplexFlagCache();
    assert.equal(await resolveDuplexMode(srv("on")), "off", "a device forced off always wins");
    store.set(DUPLEX_KEY, "1");
    resetDuplexFlagCache();
    assert.equal(await resolveDuplexMode(srv("shadow")), "on", "a device forced on is not overridden");
  } finally {
    if (had) Object.defineProperty(globalThis, "localStorage", had); else delete globalThis.localStorage;
    resetDuplexFlagCache();
  }
});
