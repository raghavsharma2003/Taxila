// Cascade voice lane (no network, no database): sentence splitting, the STT session shape, the TTS style and
// cache key, the sentence prefetch pipeline + short-phrase cache, PCM decoding, the local VAD, the
// transcription-event mapping, and CascadeLink end to end against fake browser audio — teacher speech, a
// barge-in that stops her synchronously, the push-to-talk recording fallback when WebRTC cannot come up, and
// the runtime turning a spoken final into one Director turn that carries its ASR confidence.
import { test } from "node:test";
import assert from "node:assert/strict";

import { splitSentences, MIN_CHARS, MAX_CHARS } from "../server/voice/sentences.js";
import { sttSession, sttPrompt, turnDetection, ageBandOf, SILENCE_MS } from "../server/voice/stt.js";
import { speechStyle, cacheKey, cacheable, speakChunk, setCacheStore, Prefetch, STYLE_VERSION } from "../server/voice/speech.js";
import { Pcm16Decoder, PcmStreamPlayer, resumePoint } from "../src/lesson/ttsStream.ts";
import { EnergyVad } from "../src/lesson/vad.ts";
import { CascadeLink, TranscriptionProtocol, confidenceFromLogprobs, isBackchannel, isEcho, skeleton } from "../src/lesson/cascadeLink.ts";
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { LevelMeter } from "../src/lesson/level.ts";

const flush = () => new Promise((r) => setImmediate(r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────────── sentences ─────────────

test("splitSentences: ends on . ! ? । and keeps every word in order", () => {
  const text = "Achha! Bahut badhiya, Aarav. Ab batao: teen chauthai aur do tihai mein kaun bada hai? Ek roti ke chaar hisse socho। Shabash!";
  const parts = splitSentences(text);
  assert.equal(parts.join(" "), text);
  assert.ok(parts.length >= 3, JSON.stringify(parts));
  assert.ok(parts.every((p, i) => p.length >= MIN_CHARS || i === parts.length - 1 || parts.length === 1));
});

test("splitSentences: short pieces ride with a neighbour; decimals and abbreviations are not ends", () => {
  assert.deepEqual(splitSentences("Haan! Bilkul sahi jawab hai, Aarav."), ["Haan! Bilkul sahi jawab hai, Aarav."]);
  assert.deepEqual(splitSentences("Rs. 5 ka sikka aur 3.5 kilo aam hai. Ab Dr. Rao kya kahenge?"), ["Rs. 5 ka sikka aur 3.5 kilo aam hai.", "Ab Dr. Rao kya kahenge?"]);
  assert.deepEqual(splitSentences("  "), []);
  const long = Array.from({ length: 60 }, (_, i) => `shabd${i}`).join(", ");
  const parts = splitSentences(long);
  assert.ok(parts.length > 1 && parts.every((p) => p.length <= MAX_CHARS), "a run-on is cut at clause boundaries");
  assert.equal(parts.join(" "), long);
});

// ───────────── STT session ─────────────

test("sttSession: a transcription session with the decided child VAD, logprobs and a vocabulary-free prompt", () => {
  const s = sttSession({ ageBand: "6-9", model: "taxila-transcribe" });
  assert.equal(s.type, "transcription");
  assert.deepEqual(s.include, ["item.input_audio_transcription.logprobs"]);
  assert.deepEqual(s.audio.input.noise_reduction, { type: "near_field" });
  assert.deepEqual(s.audio.input.turn_detection, { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: 900 });
  assert.equal(s.audio.input.transcription.model, "taxila-transcribe");
  // asr-kids-hinglish §3.4: who speaks + script convention only — no lesson terms in a free-text ASR prompt.
  for (const band of ["6-9", "10-15"]) assert.doesNotMatch(sttPrompt(band), /fraction|photosynthesis|terms|topic|NCERT/i);
  assert.equal(turnDetection("10-15").silence_duration_ms, SILENCE_MS["10-15"]);
  assert.equal(ageBandOf({ state: { ctx: { ageBand: "10-15" } } }, { class_level: 2 }), "10-15");
  assert.equal(ageBandOf({ state: {} }, { class_level: 3 }), "6-9");
});

// ───────────── TTS style + cache key ─────────────

test("speechStyle: delivery notes only (no identity claim), versioned, and switchable off", () => {
  const s = speechStyle({ id: "asha" }, "marin");
  assert.equal(s.voice, "marin");
  assert.equal(s.version, STYLE_VERSION);
  assert.match(s.instructions, /accent/);
  assert.doesNotMatch(s.instructions, /\b(woman|man|girl|boy|years? old|aged|lives|family|human|real)\b/i);
  process.env.TAXILA_TTS_STYLE = "0";
  try {
    assert.deepEqual(speechStyle({ id: "asha" }, "marin"), { voice: "marin", instructions: "", version: "none" });
  } finally {
    delete process.env.TAXILA_TTS_STYLE;
  }
  const k = (o) => cacheKey({ voice: "marin", version: "s1", text: "Shabash!", model: "gpt-4o-mini-tts", ...o });
  assert.equal(k({}), k({ text: "  Shabash! " }));
  assert.notEqual(k({}), k({ voice: "cedar" }));
  assert.notEqual(k({}), k({ version: "s2" }));
  assert.notEqual(k({}), k({ model: "other-tts" }));
  assert.ok(cacheable("Chalo, ek aur karte hain.") && !cacheable("x".repeat(80)));
});

// ───────────── prefetch pipeline + cache (fetch stubbed) ─────────────

function stubSpeechFetch() {
  const calls = [];
  const orig = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    const bytes = new TextEncoder().encode(`<${body.input}>`);
    return new Response(new ReadableStream({
      async start(c) {
        c.enqueue(bytes.subarray(0, 3));
        await sleep(5);
        c.enqueue(bytes.subarray(3));
        c.close();
      },
    }), { status: 200, headers: { "content-type": "audio/pcm" } });
  };
  return { calls, restore: () => { globalThis.fetch = orig; } };
}

test("speakChunk: streams from the TTS model, caches short phrases, and serves a repeat from memory", async () => {
  process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.invalid/openai/v1";
  process.env.AZURE_OPENAI_API_KEY ||= "test-key";
  const db = new Map();
  setCacheStore({ get: async (k) => db.get(k) ?? null, put: async (k, v) => { db.set(k, v); } });
  const f = stubSpeechFetch();
  const read = async (job) => { const out = []; for await (const c of job.read()) out.push(Buffer.from(c)); return Buffer.concat(out).toString(); };
  try {
    const style = { voice: "marin", instructions: "accent: Indian", version: "t1" };
    assert.equal(await read(speakChunk("Shabash!", style)), "<Shabash!>");
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].response_format, "pcm");
    assert.equal(f.calls[0].instructions, "accent: Indian");
    await flush();
    assert.equal(db.size, 1, "a short phrase is written through to asset_cache");
    const again = speakChunk("Shabash!", style);
    assert.equal(await read(again), "<Shabash!>");
    assert.equal(again.cached, true);
    assert.equal(f.calls.length, 1, "the repeat never reached the model");
    const long = "Ab hum dekhte hain ki teen chauthai aur do tihai mein kaun bada hai.";
    await read(speakChunk(long, style));
    await flush();
    assert.equal(db.size, 1, "long chunks are not cached");
  } finally {
    f.restore();
    setCacheStore({ get: async () => null, put: async () => {} });
  }
});

test("Prefetch: buffers ahead and yields pieces in order, then rethrows a source error", async () => {
  const p = new Prefetch(async () => (async function* () { yield new Uint8Array([1]); await sleep(5); yield new Uint8Array([2, 3]); })());
  await sleep(15);
  assert.equal(p.done, true, "generated while nobody was reading");
  const got = [];
  for await (const c of p.read()) got.push(...c);
  assert.deepEqual(got, [1, 2, 3]);
  const bad = new Prefetch(async () => { throw new Error("boom"); });
  await assert.rejects(async () => { for await (const _ of bad.read()); }, /boom/);
});

// ───────────── PCM + VAD ─────────────

test("Pcm16Decoder: little-endian s16 → float, carrying a split sample across chunks", () => {
  const d = new Pcm16Decoder();
  const a = d.push(new Uint8Array([0x00, 0x40, 0xff])); // 0x4000 = 0.5, then half of 0x7fff
  assert.deepEqual([...a], [0.5]);
  const b = d.push(new Uint8Array([0x7f, 0x00, 0x80]));
  assert.equal(b.length, 2);
  assert.ok(Math.abs(b[0] - 32767 / 32768) < 1e-9);
  assert.equal(b[1], -1);
});

test("EnergyVad: onset after sustained energy above the floor, offset after a quiet hangover; a click is ignored", () => {
  const v = new EnergyVad({ onsetMs: 60, offsetMs: 200 });
  const run = (rms, n) => { const out = []; for (let i = 0; i < n; i++) { const e = v.push(rms, 20); if (e) out.push(e); } return out; };
  assert.deepEqual(run(0.001, 50), []); // -60 dB room
  assert.deepEqual(run(0.2, 2), []); // a 40 ms click
  assert.deepEqual(run(0.001, 5), []);
  assert.deepEqual(run(0.1, 10), ["onset", "sustain"]);
  assert.deepEqual(run(0.001, 20), ["offset"]);
});

test("EnergyVad (defaults, 20 ms frames): duck at ≤100 ms of voice, pause at ≤140 ms — the <150 ms barge-in budget", () => {
  const v = new EnergyVad();
  for (let i = 0; i < 50; i++) v.push(0.001, 20); // a -60 dBFS room
  const edges = [];
  for (let t = 20; t <= 400; t += 20) { const e = v.push(0.05, 20); if (e) edges.push([e, t]); } // -26 dBFS voice
  const at = (k) => edges.find(([e]) => e === k)?.[1];
  assert.ok(at("onset") <= 100, JSON.stringify(edges));
  assert.ok(at("sustain") <= 140, JSON.stringify(edges));
  // A 100 ms cough ducks her but never reaches "sustain" (no pause).
  const w = new EnergyVad();
  for (let i = 0; i < 50; i++) w.push(0.001, 20);
  const cough = [];
  for (let i = 0; i < 5; i++) { const e = w.push(0.2, 20); if (e) cough.push(e); }
  for (let i = 0; i < 30; i++) { const e = w.push(0.001, 20); if (e) cough.push(e); }
  assert.deepEqual(cough, ["onset", "offset"]);
});

// ───────────── transcription protocol ─────────────

test("TranscriptionProtocol: VAD edges, partials, a final with confidence, an empty final, a failure", () => {
  const events = [];
  let barge = 0;
  let t = 100;
  const p = new TranscriptionProtocol({ emit: (e) => events.push(e), onSpeechStart: () => barge++, now: () => (t += 10) });
  p.handle({ type: "input_audio_buffer.speech_started", item_id: "i1" });
  p.handle({ type: "conversation.item.input_audio_transcription.delta", item_id: "i1", delta: "teen " });
  p.handle({ type: "conversation.item.input_audio_transcription.delta", item_id: "i1", delta: "chauthai" });
  p.handle({ type: "input_audio_buffer.speech_stopped", item_id: "i1" });
  p.handle({ type: "input_audio_buffer.committed", item_id: "i1" });
  p.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "i1", transcript: " teen chauthai ", logprobs: [{ logprob: Math.log(0.9) }, { logprob: Math.log(0.9) }] });
  assert.equal(barge, 1);
  assert.deepEqual(events.map((e) => e.type), ["child_speech_start", "child_partial", "child_partial", "child_speech_end", "child_final"]);
  assert.equal(events[2].text, "teen chauthai");
  const fin = events.at(-1);
  assert.equal(fin.text, "teen chauthai");
  assert.equal(fin.typed, false);
  assert.equal(fin.startedAt, 110, "dated from speech_started");
  assert.ok(Math.abs(fin.asrConfidence - 0.9) < 1e-9);
  events.length = 0;
  p.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "i2", transcript: "" });
  p.handle({ type: "conversation.item.input_audio_transcription.failed", item_id: "i3" });
  assert.deepEqual(events.map((e) => e.type), ["child_silent", "child_final"]);
  assert.equal(events[1].text, "");
  assert.equal(events[1].asrConfidence, 0);
  assert.equal(confidenceFromLogprobs([]), undefined);
});

// ───────────── CascadeLink against fake browser audio ─────────────

class FakeParam {
  constructor(v) { this.value = v; }
  cancelScheduledValues() {}
  setTargetAtTime(v) { this.value = v; }
}
class FakeNode {
  constructor(ctx) { this.ctx = ctx; }
  connect() {}
  disconnect() {}
}
class FakeAudioContext {
  static micLevel = 0;
  constructor() {
    this.t0 = performance.now();
    this.destination = new FakeNode(this);
    this.sources = [];
    FakeAudioContext.last = this;
  }
  get currentTime() { return (performance.now() - this.t0) / 1000; }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
  createGain() { const n = new FakeNode(this); n.gain = new FakeParam(1); return n; }
  createAnalyser() { const n = new FakeNode(this); n.fftSize = 1024; n.getFloatTimeDomainData = (b) => b.fill(FakeAudioContext.micLevel); return n; }
  createMediaStreamSource() { return new FakeNode(this); }
  createBuffer(_ch, length, rate) { const data = new Float32Array(length); return { duration: length / rate, getChannelData: () => data }; }
  createBufferSource() {
    const ctx = this;
    const s = new FakeNode(this);
    s.start = (at) => {
      s.startedAt = at;
      s.timer = setTimeout(() => { s.done = true; s.onended?.(); }, Math.max(0, (at - ctx.currentTime) * 1000) + (s.buffer.duration * 1000));
    };
    s.stop = () => { clearTimeout(s.timer); s.stopped = true; };
    this.sources.push(s);
    return s;
  }
}

/**
 * rtc: "fail" (no WebRTC), "open" (the call comes up and its data channel opens), "hang" (UDP blocked, no
 * TURN: the channel never opens). mic: "ok" | "denied".
 */
function installBrowserFakes({ rtc = "fail", mic = "ok" } = {}) {
  const saved = {};
  const set = (k, v) => { saved[k] = Object.getOwnPropertyDescriptor(globalThis, k); Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); };
  const track = { enabled: true, stop() { this.stopped = true; } };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  FakeAudioContext.micLevel = 0;
  set("navigator", { mediaDevices: { getUserMedia: async () => {
    if (mic === "denied") throw Object.assign(new Error("Permission denied"), { name: "NotAllowedError" });
    return stream;
  } } });
  set("AudioContext", FakeAudioContext);
  const pcs = [];
  set("RTCPeerConnection", class {
    constructor() {
      if (rtc === "fail") throw new Error("no WebRTC here");
      this.connectionState = "new";
      pcs.push(this);
    }
    addTrack() {}
    createDataChannel() {
      this.dc = { readyState: "connecting", sent: [], send(m) { this.sent.push(JSON.parse(m)); }, close() { this.readyState = "closed"; } };
      return this.dc;
    }
    async createOffer() { return { type: "offer", sdp: "v=0" }; }
    async setLocalDescription(d) { this.localDescription = d; }
    async setRemoteDescription() {
      if (rtc !== "open") return;
      setTimeout(() => { this.dc.readyState = "open"; this.connectionState = "connected"; this.dc.onopen?.(); }, 1);
    }
    setState(st) { this.connectionState = st; this.onconnectionstatechange?.(); }
    close() { this.closed = true; }
  });
  const origFetch = globalThis.fetch;
  set("fetch", async (url, init) => (String(url).endsWith("/realtime/calls") ? new Response("v=0 answer", { status: 201 }) : origFetch(url, init)));
  const recorded = [];
  set("MediaRecorder", class {
    static isTypeSupported(m) { return m === "audio/webm;codecs=opus"; }
    constructor(_s, o) { this.mimeType = o?.mimeType ?? ""; this.state = "inactive"; recorded.push(this); }
    start() { this.state = "recording"; }
    stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob([new Uint8Array(4000)], { type: this.mimeType }) }); this.onstop?.(); }
  });
  return { track, recorded, pcs, restore() { for (const [k, d] of Object.entries(saved)) d ? Object.defineProperty(globalThis, k, d) : delete globalThis[k]; } };
}

/** `chunks` × 0.25 s of PCM (default 1 s), the first after `delayMs`. */
function pcmStream(delayMs = 5, chunks = 4) {
  return async (_req, signal) => new ReadableStream({
    async start(c) {
      for (let i = 0; i < chunks; i++) {
        await sleep(i ? 2 : delayMs);
        if (signal.aborted) return c.close();
        c.enqueue(new Uint8Array(12_000));
      }
      c.close();
    },
  });
}

test("CascadeLink: WebRTC unavailable → push-to-talk recording; a recorded turn becomes a spoken final", async () => {
  const env = installBrowserFakes();
  const levels = { mic: new LevelMeter(), teacher: new LevelMeter() };
  const transports = [];
  const clips = [];
  const link = new CascadeLink({
    lessonId: "L1", levels, speech: pcmStream(),
    fetchToken: async () => ({ token: "ek_x", expiresAt: 0, base: "https://x.invalid/openai/v1", session: {} }),
    transcribe: async (_id, clip) => { clips.push(clip); return { text: "teen chauthai", asrConfidence: 0.8 }; },
    onTransport: (t) => transports.push(t),
  });
  const events = [];
  link.on((e) => events.push(e));
  try {
    await link.connect();
    await flush(); // the transcription call comes up (here: fails) in the background, after connect resolves
    assert.equal(link.transport, "recording");
    assert.deepEqual(transports, ["recording"]);
    assert.ok(events.some((e) => e.type === "error" && e.code === "stt_fallback_ptt" && !e.fatal));
    assert.deepEqual(events.filter((e) => e.type === "connection").map((e) => e.state), ["connecting", "connected"]);
    assert.ok(events.findIndex((e) => e.type === "connection" && e.state === "connected") < events.findIndex((e) => e.code === "stt_fallback_ptt"),
      "connected before the call's fate is known");
    // The local VAD does not gate the upload (a soft child may never clear it): it is only counted.
    link.talkStart();
    await sleep(260);
    link.talkEnd();
    await sleep(PTT_WAIT);
    const fin = events.find((e) => e.type === "child_final");
    assert.ok(fin, JSON.stringify(events.map((e) => e.type)));
    assert.equal(fin.text, "teen chauthai");
    assert.equal(fin.typed, false);
    assert.equal(fin.asrConfidence, 0.8);
    assert.equal(clips[0].type, "audio/webm;codecs=opus");
    assert.equal(link.bargeStats.pttUnheard, 1, "uploaded although the local VAD heard nothing");
    // An accidental tap (released within MIN_CLIP_MS) is not uploaded.
    events.length = 0;
    link.talkStart();
    link.talkEnd();
    await sleep(PTT_WAIT);
    assert.deepEqual(events.map((e) => e.type), ["child_speech_start", "child_speech_end", "child_silent"]);
    assert.equal(clips.length, 1);
  } finally {
    link.close();
    env.restore();
  }
});
const PTT_WAIT = 380;

test("CascadeLink: speaks a stored reply as streamed PCM, and a barge-in stops every scheduled chunk at once", async () => {
  const env = installBrowserFakes();
  const levels = { mic: new LevelMeter(), teacher: new LevelMeter() };
  const reqs = [];
  const speech = pcmStream(5);
  const link = new CascadeLink({ lessonId: "L1", levels, speech: (req, s) => { reqs.push(req); return speech(req, s); }, transcribe: async () => ({ text: "" }) });
  const events = [];
  link.on((e) => events.push(e));
  try {
    await link.connect();
    await flush();
    events.length = 0;
    link.promptTeacher({ text: "Achha! Ab batao, kaun bada hai?", seq: 7 });
    assert.deepEqual(reqs, [{ lessonId: "L1", seq: 7 }], "speaks the stored turn by seq, never free text");
    await sleep(40);
    assert.deepEqual(events.map((e) => e.type), ["response_start", "teacher_delta", "teacher_done", "teacher_audio_start"]);
    const ctx = FakeAudioContext.last;
    assert.equal(ctx.sources.length, 4);
    // Barge-in through the transcription protocol (what speech_started does on the data channel): she is
    // silenced at once (paused, the reply kept)…
    const t0 = performance.now();
    link.protocol.handle({ type: "input_audio_buffer.speech_started", item_id: "c1" });
    const stopMs = performance.now() - t0;
    assert.ok(stopMs < 150, `stopped in ${stopMs.toFixed(1)} ms`);
    assert.ok(ctx.sources.every((s) => s.stopped || s.done), "every scheduled chunk stopped");
    assert.deepEqual(events.slice(4).map((e) => e.type), ["teacher_audio_end", "child_speech_start"]);
    // …and a real answer stops her for good, before the child's turn goes out.
    link.protocol.handle({ type: "input_audio_buffer.speech_stopped", item_id: "c1" });
    link.protocol.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "do tihai bada hai", logprobs: [{ logprob: -0.05 }] });
    assert.deepEqual(events.slice(6).map((e) => e.type), ["child_speech_end", "teacher_interrupted", "response_done", "child_final"]);
    assert.equal(events.find((e) => e.type === "response_done").status, "cancelled");
    assert.equal(link.bargeStats.confirmed, 1);
    // A reply that plays to the end completes.
    events.length = 0;
    link.promptTeacher({ text: "Shabash!", seq: 8 });
    await sleep(1200);
    assert.deepEqual(events.map((e) => e.type), ["response_start", "teacher_delta", "teacher_done", "teacher_audio_start", "teacher_audio_end", "response_done"]);
    assert.equal(events.at(-1).status, "completed");
  } finally {
    link.close();
    env.restore();
  }
});

test("PcmStreamPlayer: a stream that fails before any audio ends 'failed'", async () => {
  const ctx = new FakeAudioContext();
  const player = new PcmStreamPlayer(ctx, ctx.destination);
  const pb = player.play(async () => { throw new Error("502"); });
  assert.equal(await pb.ended, "failed");
  await assert.rejects(pb.started);
  assert.equal(player.playing, false);
});

test("runtime + CascadeLink: a spoken final becomes one Director turn with its ASR confidence; the reply is spoken by seq", async () => {
  const env = installBrowserFakes();
  const reqs = [];
  const speech = pcmStream(2);
  const turns = [];
  const starts = [];
  const linkCtx = [];
  const api = {
    start: async (req) => (starts.push(req), { lessonId: "L1", topic: { id: "t", title: "T", chapter: "1" }, teacher: { id: "asha", name: "Asha", voice: "marin" }, moduleCommands: [], ui: {}, teacherOpening: "Namaste!", teacherOpeningSeq: 1 }),
    turn: async (req) => { turns.push(req); return { move: { kind: "probe", shape: "x" }, moduleCommands: [], ui: {}, teacherReply: "Achha, kyun?", teacherReplySeq: 3 }; },
    end: async () => ({}),
    realtimeToken: async () => { throw new Error("not used"); },
  };
  let link;
  // Unref'd timers: the runtime's 20 s end-drain race must not hold the test process open.
  const timers = { setTimeout: (fn, ms) => { const t = setTimeout(fn, ms); t.unref(); return t; }, clearTimeout: (t) => clearTimeout(t) };
  const rt = new LessonRuntime({ api, timers, createLink: (_m, ctx) => (linkCtx.push({ mode: _m, cascade: ctx.cascade }), link = new CascadeLink({ lessonId: ctx.lessonId, levels: ctx.levels, fetchToken: async () => { throw new Error("no STT in tests"); }, speech: (r, s) => { reqs.push(r.seq); return speech(r, s); }, transcribe: async () => ({ text: "" }) })) });
  try {
    await rt.start("child-1", "cascade");
    // The server is told "cascade" (spoken, ASR-gated turns); the link is a text-lane link.
    assert.equal(starts[0].mode, "cascade");
    assert.deepEqual(linkCtx, [{ mode: "text", cascade: true }]);
    assert.equal(rt.state.mode, "text");
    await sleep(30);
    assert.equal(rt.state.status, "speaking");
    // The child talks over the opening (barge-in), then finishes a turn.
    link.protocol.handle({ type: "input_audio_buffer.speech_started", item_id: "c1" });
    assert.equal(rt.state.status, "listening");
    link.protocol.handle({ type: "input_audio_buffer.speech_stopped", item_id: "c1" });
    assert.equal(rt.state.status, "thinking");
    link.protocol.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "teen chauthai", logprobs: [{ logprob: -0.1 }] });
    await sleep(30);
    assert.equal(turns.length, 1);
    assert.equal(turns[0].childText, "teen chauthai");
    assert.ok(Math.abs(turns[0].asrConfidence - Math.exp(-0.1)) < 1e-9);
    assert.equal(turns[0].typed, undefined, "a spoken turn is not marked typed");
    assert.equal(turns[0].teacherInterrupted, true, "the cut-off opening is reported");
    assert.deepEqual(reqs, [1, 3]);
    assert.equal(rt.state.status, "speaking");
    const caps = rt.state.captions.map((c) => [c.who, c.text, !!c.interrupted]);
    assert.deepEqual(caps, [["teacher", "Namaste!", true], ["child", "teen chauthai", false], ["teacher", "Achha, kyun?", false]]);
  } finally {
    await rt.end();
    env.restore();
  }
});

// ───────────── connect, mic, ICE ─────────────

const TOKEN = async () => ({ token: "ek_x", expiresAt: 0, base: "https://x.invalid/openai/v1", session: { audio: { input: { turn_detection: { type: "server_vad" } } } } });
const levels = () => ({ mic: new LevelMeter(), teacher: new LevelMeter() });

test("CascadeLink: a call that never connects (UDP blocked, no TURN) does not hold connect(); the opening plays at once", async () => {
  const env = installBrowserFakes({ rtc: "hang" });
  const transports = [];
  const link = new CascadeLink({ lessonId: "L1", levels: levels(), speech: pcmStream(5), fetchToken: TOKEN, transcribe: async () => ({ text: "" }), onTransport: (t) => transports.push(t) });
  const events = [];
  link.on((e) => events.push(e));
  try {
    const t0 = performance.now();
    await link.connect();
    const connectMs = performance.now() - t0;
    assert.ok(connectMs < 100, `connect took ${connectMs.toFixed(0)} ms`);
    assert.equal(link.listening, false, "the call is still coming up");
    link.promptTeacher({ text: "Namaste! Aaj hum bhinn padhenge.", seq: 1 });
    await sleep(40);
    const firstAudio = events.find((e) => e.type === "teacher_audio_start");
    assert.ok(firstAudio, "her opening sounds while the call is still connecting");
    console.log(`fallback path: start → connect ${connectMs.toFixed(1)} ms, → first opening audio < 40 ms more (fake audio, 5 ms TTS)`);
    assert.deepEqual(transports, []);
  } finally {
    link.close();
    env.restore();
  }
});

test("CascadeLink: ICE 'disconnected' for 3 s counts as lost (reconnect), and a call that comes up reports webrtc", async () => {
  const env = installBrowserFakes({ rtc: "open" });
  const transports = [];
  let tokens = 0;
  const link = new CascadeLink({ lessonId: "L1", levels: levels(), speech: pcmStream(5), fetchToken: async () => (tokens++, TOKEN()), transcribe: async () => ({ text: "" }), onTransport: (t) => transports.push(t) });
  try {
    await link.connect();
    await sleep(20);
    assert.equal(link.listening, true);
    assert.deepEqual(transports, ["webrtc"]);
    env.pcs[0].setState("disconnected");
    await sleep(2_900);
    assert.equal(tokens, 1, "a short blip is not a loss");
    await sleep(700); // 3 s mark + the first reconnect backoff (500 ms)
    assert.equal(tokens, 2, "reconnected after 'disconnected' outlasted 3 s");
    assert.equal(env.pcs[0].closed, true);
    await sleep(20);
    assert.equal(link.listening, true);
  } finally {
    link.close();
    env.restore();
  }
});

test("CascadeLink: microphone denied → typed lesson, her voice still plays", async () => {
  const env = installBrowserFakes({ mic: "denied" });
  const transports = [];
  const link = new CascadeLink({ lessonId: "L1", levels: levels(), speech: pcmStream(5), fetchToken: TOKEN, transcribe: async () => ({ text: "" }), onTransport: (t) => transports.push(t) });
  const events = [];
  link.on((e) => events.push(e));
  try {
    await link.connect();
    assert.equal(link.transport, "typed");
    assert.deepEqual(transports, ["typed"]);
    const err = events.find((e) => e.type === "error");
    assert.equal(err.code, "mic_unavailable");
    assert.equal(err.fatal, false);
    assert.match(err.message, /not allowed/);
    assert.equal(events.at(-1).type, "connection");
    link.setPushToTalk(true);
    link.talkStart(); // no-ops without a mic
    link.promptTeacher({ text: "Achha, batao.", seq: 2 });
    await sleep(40);
    assert.ok(events.some((e) => e.type === "teacher_audio_start"));
    link.sendChild("teen chauthai");
    const fin = events.find((e) => e.type === "child_final");
    assert.equal(fin.typed, true);
  } finally {
    link.close();
    env.restore();
  }
});

// ───────────── barge-in: pause, decide, resume ─────────────

async function speakingLink(opts = {}) {
  const env = installBrowserFakes({ rtc: opts.rtc ?? "fail" });
  // 3 s of her voice: enough left after a cut for a backchannel to resume her.
  const link = new CascadeLink({ lessonId: "L1", levels: levels(), speech: pcmStream(5, 12), fetchToken: TOKEN, transcribe: async () => ({ text: "" }), ...opts.link });
  const events = [];
  link.on((e) => events.push(e));
  await link.connect();
  await sleep(20);
  events.length = 0;
  link.promptTeacher({ text: opts.text ?? "Dekho, ek roti ke chaar barabar hisse karo. Har hissa ek chauthai hai. Ab batao, teen hisse kitne hue?", seq: 5 });
  await sleep(40);
  assert.ok(events.some((e) => e.type === "teacher_audio_start"));
  events.length = 0;
  return { env, link, events, ctx: FakeAudioContext.last };
}

test("barge-in: speech_started then an EMPTY transcript → she resumes from where she was cut and finishes", async () => {
  const { env, link, events, ctx } = await speakingLink();
  try {
    await sleep(200);
    const before = ctx.sources.length;
    link.protocol.handle({ type: "input_audio_buffer.speech_started", item_id: "c1" });
    assert.ok(ctx.sources.every((s) => s.stopped || s.done), "silenced at once");
    link.protocol.handle({ type: "input_audio_buffer.speech_stopped", item_id: "c1" });
    link.protocol.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "" });
    await flush();
    assert.ok(ctx.sources.length > before, "the rest of the reply was rescheduled");
    const resumed = ctx.sources.at(-1);
    // Cut ~0.2 s into her audio (after the start lead); resumed a little before that.
    assert.ok(resumed.buffer.duration > 2.7 && resumed.buffer.duration <= 3, `resumed with ${resumed.buffer.duration.toFixed(2)} s left (a little before the cut)`);
    await sleep(3_100);
    assert.deepEqual(events.map((e) => e.type), ["teacher_audio_end", "child_speech_start", "child_speech_end", "child_silent", "teacher_audio_start", "teacher_audio_end", "response_done"]);
    assert.equal(events.at(-1).status, "completed");
    assert.ok(!events.some((e) => e.type === "teacher_interrupted" || e.type === "child_final"), "no turn, no interruption");
    assert.equal(link.bargeStats.resumedSilent, 1);
  } finally {
    link.close();
    env.restore();
  }
});

test("barge-in: a lone 'hmm' resumes her; her own echo resumes her; a real answer stops her", async () => {
  {
    const { env, link, events } = await speakingLink();
    try {
      link.protocol.handle({ type: "input_audio_buffer.speech_started", item_id: "c1" });
      link.protocol.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "हम्म", logprobs: [{ logprob: -0.1 }] });
      await flush();
      assert.ok(events.some((e) => e.type === "teacher_audio_start"), "resumed");
      assert.ok(!events.some((e) => e.type === "child_final"));
      assert.equal(link.bargeStats.resumedBackchannel, 1);
    } finally { link.close(); env.restore(); }
  }
  {
    const { env, link, events } = await speakingLink();
    try {
      link.protocol.handle({ type: "input_audio_buffer.speech_started", item_id: "c1" });
      link.protocol.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "एक रोटी के चार बराबर हिस्से करो" });
      await flush();
      assert.ok(events.some((e) => e.type === "teacher_audio_start"), "her own voice in Devanagari is recognised as echo");
      assert.equal(link.bargeStats.resumedEcho, 1);
    } finally { link.close(); env.restore(); }
  }
  {
    const { env, link, events } = await speakingLink();
    try {
      link.protocol.handle({ type: "input_audio_buffer.speech_started", item_id: "c1" });
      link.protocol.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "teen chauthai", logprobs: [{ logprob: -0.1 }] });
      assert.deepEqual(events.map((e) => e.type), ["teacher_audio_end", "child_speech_start", "teacher_interrupted", "response_done", "child_final"]);
    } finally { link.close(); env.restore(); }
  }
});

test("barge-in verdicts: backchannels, echo across scripts, and answers", () => {
  assert.ok(isBackchannel("hmm") && isBackchannel("haan ji") && isBackchannel("हाँ") && isBackchannel("") && isBackchannel("teen", 0.3));
  assert.ok(!isBackchannel("teen") && !isBackchannel("teen chauthai") && !isBackchannel("haan teen hai"));
  assert.equal(skeleton("chauthai"), skeleton("चौथाई"));
  assert.equal(skeleton("roti"), skeleton("रोटी"));
  assert.equal(skeleton("cube"), skeleton("क्यूब"));
  const said = "Dekho, ek roti ke chaar barabar hisse karo. Har hissa ek chauthai hai.";
  assert.ok(isEcho("ek roti ke chaar barabar hisse", said));
  assert.ok(isEcho("एक रोटी के चार बराबर हिस्से", said));
  assert.ok(!isEcho("ek chauthai", said), "a short repeat is an answer, not echo");
  assert.ok(!isEcho("mujhe lagta hai teen hisse", said));
});

test("barge-in: a reply cut while still LOADING is marked interrupted (the server must not think it was heard)", async () => {
  const env = installBrowserFakes();
  const link = new CascadeLink({ lessonId: "L1", levels: levels(), speech: pcmStream(200), fetchToken: TOKEN, transcribe: async () => ({ text: "" }) });
  const events = [];
  link.on((e) => events.push(e));
  try {
    await link.connect();
    await flush();
    events.length = 0;
    link.promptTeacher({ text: "Achha, ab agla sawaal.", seq: 9 });
    link.sendChild("ruko didi"); // typing over her before a sample played
    assert.deepEqual(events.map((e) => e.type), ["response_start", "teacher_delta", "teacher_done", "teacher_interrupted", "response_done", "child_final"]);
    events.length = 0;
    link.promptTeacher({ text: "Theek hai.", seq: 10 });
    link.protocol.handle({ type: "input_audio_buffer.speech_started", item_id: "c2" });
    link.protocol.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "c2", transcript: "mujhe samajh nahi aaya" });
    assert.ok(events.some((e) => e.type === "teacher_interrupted"), "spoken over while loading");
  } finally {
    link.close();
    env.restore();
  }
});

test("barge-in, hands-free: the local VAD ducks her within ~150 ms of voice and pauses her; unconfirmed, she resumes", async () => {
  const { env, link, events, ctx } = await speakingLink({ rtc: "open" });
  try {
    assert.equal(link.listening, true);
    const gain = () => ctx.sources[0] && link.player.output.gain.value;
    const t0 = performance.now();
    FakeAudioContext.micLevel = 0.1; // the child starts talking (−20 dBFS over a silent room)
    let duckAt = null, pauseAt = null;
    while (performance.now() - t0 < 400 && pauseAt === null) {
      await sleep(5);
      if (duckAt === null && gain() < 0.5) duckAt = performance.now() - t0;
      if (events.some((e) => e.type === "teacher_audio_end")) pauseAt = performance.now() - t0;
    }
    FakeAudioContext.micLevel = 0;
    console.log(`local barge-in (20 ms polling, fake audio): duck ${duckAt?.toFixed(0)} ms, pause ${pauseAt?.toFixed(0)} ms after voice onset`);
    assert.ok(duckAt !== null && duckAt < 150, `duck at ${duckAt} ms`);
    assert.ok(pauseAt !== null && pauseAt < 200, `pause at ${pauseAt} ms`);
    assert.equal(link.bargeStats.localPauses, 1);
    // The server never confirms (it was the TV): she resumes after DUCK_RELEASE_MS.
    await sleep(800);
    assert.ok(events.filter((e) => e.type === "teacher_audio_start").length === 1, "resumed");
    assert.equal(link.bargeStats.localUnconfirmed, 1);
    assert.ok(!events.some((e) => e.type === "teacher_interrupted"));
  } finally {
    link.close();
    env.restore();
  }
});

test("resumePoint: backs up to the last gap between words, else 0.3 s", () => {
  const rate = 1000;
  const x = new Float32Array(3000).fill(0.3);
  x.fill(0, 1500, 1600); // a 100 ms gap
  const p = resumePoint(x, 2200, rate);
  assert.ok(p >= 1540 && p <= 1600, String(p));
  assert.equal(resumePoint(new Float32Array(3000).fill(0.3), 2200, rate), 1900);
});
