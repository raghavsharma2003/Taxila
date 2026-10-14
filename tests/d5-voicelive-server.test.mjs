// D5 (2026-10-11): the server half of lane D5 — server/ws.js (a minimal RFC 6455 server), server/duplex/voicelive.js (the
// Voice Live relay: session, allowlists both ways, batching, key handling), server/duplex/config.js (the cohort's lane) and
// server/duplex/d5route.js (who may open the stream). No network: transports and the database are injected.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";

import { acceptKey, acceptWebSocket, encodeFrame, FrameReader, upgradeProblem } from "../server/ws.js";
import {
  VoiceLiveRelay, voiceLiveConfig, voiceLiveUrl, voiceLiveSession, toClientEvent, fromClientText,
  D5_FRAME_BYTES, D5_FRAMES_PER_APPEND, D5_SILENCE_MAX_MS, D5_SILENCE_MIN_MS,
} from "../server/duplex/voicelive.js";
import { cohortLane, modeFor } from "../server/duplex/config.js";
import { authorizeD5, handleD5Upgrade, allowD5, D5_OPENS_PER_MINUTE } from "../server/duplex/d5route.js";

const ENV = { AZURE_AI_CENTRALINDIA_ENDPOINT: "https://vl.example.cognitiveservices.azure.com/", AZURE_AI_CENTRALINDIA_KEY: "sekrit-key-123" };
const sha = (s) => createHash("sha256").update(s).digest("hex");

/** A client frame as a browser sends it: masked. */
function clientFrame(opcode, payload, { fin = true, mask = true } = {}) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const n = body.length;
  const head = n < 126 ? Buffer.from([(fin ? 0x80 : 0) | opcode, (mask ? 0x80 : 0) | n]) : Buffer.concat([Buffer.from([(fin ? 0x80 : 0) | opcode, (mask ? 0x80 : 0) | 126]), Buffer.from([n >> 8, n & 255])]);
  if (!mask) return Buffer.concat([head, body]);
  const k = Buffer.from([1, 2, 3, 4]);
  const m = Buffer.alloc(n);
  for (let i = 0; i < n; i++) m[i] = body[i] ^ k[i & 3];
  return Buffer.concat([head, k, m]);
}

class FakeSocket extends EventEmitter {
  constructor() { super(); this.out = []; this.destroyed = false; this.ended = false; }
  write(b) { this.out.push(Buffer.isBuffer(b) ? b : Buffer.from(b)); return true; }
  end(b) { if (b) this.out.push(b); this.ended = true; }
  destroy() { this.destroyed = true; }
  setNoDelay() {}
  get text() { return Buffer.concat(this.out).toString("latin1"); }
}

const upgradeReq = (extra = {}) => ({ method: "GET", url: "/api/duplex/voicelive?lessonId=00000000-0000-0000-0000-000000000001", headers: { upgrade: "websocket", connection: "Upgrade", "sec-websocket-version": "13", "sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==", host: "taxila.dev", ...extra } });

// ───────────────────────────── server/ws.js ─────────────────────────────

test("ws: the RFC 6455 accept key, upgrade checks, frame encode/decode", () => {
  assert.equal(acceptKey("dGhlIHNhbXBsZSBub25jZQ=="), "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=");
  assert.equal(upgradeProblem(upgradeReq()), null);
  assert.equal(upgradeProblem(upgradeReq({ upgrade: "h2c" })), "upgrade");
  assert.equal(upgradeProblem(upgradeReq({ "sec-websocket-version": "8" })), "version");
  assert.equal(upgradeProblem(upgradeReq({ "sec-websocket-key": "short" })), "key");
  const r = new FrameReader();
  const big = Buffer.alloc(300, 7);
  const { frames, error } = r.push(Buffer.concat([clientFrame(1, "hi"), clientFrame(2, big)]));
  assert.equal(error, null);
  assert.deepEqual(frames.map((f) => [f.opcode, f.payload.length]), [[1, 2], [2, 300]]);
  assert.equal(frames[0].payload.toString(), "hi");
  assert.equal(new FrameReader().push(clientFrame(1, "x", { mask: false })).error, "unmasked");
  assert.equal(new FrameReader({ maxPayload: 100 }).push(clientFrame(2, big)).error, "too_big");
  // split across chunks
  const whole = clientFrame(1, "split me");
  const r2 = new FrameReader();
  assert.equal(r2.push(whole.subarray(0, 5)).frames.length, 0);
  assert.equal(r2.push(whole.subarray(5)).frames[0].payload.toString(), "split me");
  assert.equal(encodeFrame(1, "ok").toString("latin1"), "\x81\x02ok");
  assert.equal(encodeFrame(2, Buffer.alloc(200)).readUInt16BE(2), 200);
});

test("ws: accept → 101, messages (text, binary, fragmented), ping → pong, close", () => {
  const sock = new FakeSocket();
  const ws = acceptWebSocket(upgradeReq(), sock, Buffer.alloc(0));
  assert.match(sock.text, /^HTTP\/1\.1 101 Switching Protocols\r\n/);
  assert.match(sock.text, /Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK\+xOo=/);
  const got = [];
  ws.on("message", (d, bin) => got.push([bin, bin ? d.length : d]));
  sock.emit("data", clientFrame(1, '{"type":"commit"}'));
  sock.emit("data", clientFrame(2, Buffer.alloc(D5_FRAME_BYTES)));
  sock.emit("data", Buffer.concat([clientFrame(1, "ab", { fin: false }), clientFrame(0, "cd")]));
  assert.deepEqual(got, [[false, '{"type":"commit"}'], [true, D5_FRAME_BYTES], [false, "abcd"]]);
  sock.out = [];
  sock.emit("data", clientFrame(9, "p"));
  assert.equal(sock.out[0][0], 0x8a); // pong
  assert.equal(ws.send("x"), true);
  let closed = null;
  ws.on("close", (c) => { closed = c; });
  sock.emit("data", clientFrame(8, Buffer.from([0x03, 0xe8])));
  assert.equal(closed, 1000);
  assert.equal(ws.open, false);
  assert.equal(ws.send("late"), false);
});

// ───────────────────────────── voicelive.js ─────────────────────────────

test("voicelive: config from the env (own vars first), null when absent; the url never carries the key", () => {
  assert.equal(voiceLiveConfig({}), null);
  assert.equal(voiceLiveConfig({ AZURE_AI_CENTRALINDIA_ENDPOINT: "https://x.example/" }), null);
  const c = voiceLiveConfig(ENV);
  assert.equal(c.host, "vl.example.cognitiveservices.azure.com");
  assert.equal(c.apiVersion, "2026-07-15");
  assert.equal(voiceLiveConfig({ ...ENV, TAXILA_VOICELIVE_ENDPOINT: "https://own.example/", TAXILA_VOICELIVE_KEY: "k2" }).host, "own.example");
  const url = voiceLiveUrl(c);
  assert.match(url, /^wss:\/\/vl\.example\.cognitiveservices\.azure\.com\/voice-live\/realtime\?api-version=2026-07-15&model=gpt-4\.1-mini$/);
  assert.ok(!url.includes("sekrit"));
});

test("voicelive: the session is an ear only (reference AEC on 2 channels, DNS, hi+en VAD, no responses)", () => {
  const s = voiceLiveSession();
  assert.deepEqual(s.input_audio_echo_cancellation, { type: "server_echo_cancellation", reference_source: "client", channels: 2 });
  assert.deepEqual(s.input_audio_noise_reduction, { type: "azure_deep_noise_suppression" });
  assert.equal(s.input_audio_sampling_rate, 16000);
  assert.deepEqual(s.input_audio_transcription, { model: "azure-speech", language: "hi-IN,en-IN" });
  assert.equal(s.turn_detection.type, "azure_semantic_vad_multilingual");
  assert.equal(s.turn_detection.create_response, false);
  assert.equal(s.turn_detection.interrupt_response, false);
  assert.deepEqual(s.turn_detection.languages, ["hi", "en"]);
  assert.deepEqual(s.modalities, ["text", "audio"]); // server AEC refuses text-only
});

test("voicelive: only VAD, transcription, session status and errors reach the browser (allowlist, sanitised)", () => {
  assert.equal(toClientEvent({ type: "response.audio.delta", delta: "AAAA" }), null);
  assert.equal(toClientEvent({ type: "response.created" }), null);
  assert.equal(toClientEvent({ type: "conversation.item.created", item: { content: [] } }), null);
  assert.deepEqual(toClientEvent({ type: "input_audio_buffer.speech_started", item_id: "i1", audio_start_ms: 4960, extra: "x" }), { type: "input_audio_buffer.speech_started", item_id: "i1", audio_start_ms: 4960 });
  assert.deepEqual(toClientEvent({ type: "conversation.item.input_audio_transcription.completed", item_id: "i1", transcript: "ठीक है।", junk: 1 }), { type: "conversation.item.input_audio_transcription.completed", item_id: "i1", transcript: "ठीक है।" });
  const st = toClientEvent({ type: "session.updated", session: { instructions: "secret prompt", input_audio_echo_cancellation: { type: "server_echo_cancellation", reference_source: "client", channels: 2 }, input_audio_noise_reduction: { type: "azure_deep_noise_suppression" }, turn_detection: { type: "azure_semantic_vad_multilingual", silence_duration_ms: 500 }, input_audio_transcription: { model: "azure-speech", language: "hi-IN,en-IN" }, input_audio_sampling_rate: 16000 } });
  assert.deepEqual(st, { type: "d5.session", phase: "updated", aec: { type: "server_echo_cancellation", reference: "client", channels: 2 }, dns: "azure_deep_noise_suppression", vad: { type: "azure_semantic_vad_multilingual", silenceMs: 500 }, asr: { model: "azure-speech", language: "hi-IN,en-IN" }, rate: 16000 });
  assert.ok(!JSON.stringify(st).includes("secret prompt"));
  // Voice Live's "nothing to commit" reads as the D4 code the engine already handles
  assert.deepEqual(toClientEvent({ type: "error", error: { message: "Error committing input audio buffer: buffer too small." } }).error.code, "input_audio_buffer_commit_empty");
});

test("voicelive: the browser can commit and set the VAD silence (clamped), nothing else", () => {
  assert.deepEqual(fromClientText('{"type":"commit"}'), { type: "input_audio_buffer.commit" });
  assert.equal(fromClientText('{"type":"vad","silenceMs":50}').session.turn_detection.silence_duration_ms, D5_SILENCE_MIN_MS);
  assert.equal(fromClientText('{"type":"vad","silenceMs":99999}').session.turn_detection.silence_duration_ms, D5_SILENCE_MAX_MS);
  assert.equal(fromClientText('{"type":"vad","silenceMs":1500}').session.turn_detection.create_response, false);
  assert.equal(fromClientText('{"type":"response.create"}'), null);
  assert.equal(fromClientText('{"type":"session.update","session":{"instructions":"say hi"}}'), null);
  assert.equal(fromClientText("not json"), null);
});

function fakeRelay(opts = {}) {
  const toClient = [], toUp = [];
  let closed = null, ended = null;
  const up = { send: (m) => toUp.push(JSON.parse(m)), close: () => { up.closed = true; } };
  const timers = [];
  const relay = new VoiceLiveRelay({
    cfg: voiceLiveConfig(ENV),
    client: { send: (t) => toClient.push(JSON.parse(t)), close: (c, r) => { closed = [c, r]; } },
    openUpstream: (url, headers) => { up.url = url; up.headers = headers; return up; },
    setTimer: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    clearTimer: () => {},
    onEnd: (s) => { ended = s; },
    ...opts,
  });
  return { relay, up, toClient, toUp, timers, closed: () => closed, ended: () => ended };
}

test("voicelive relay: the key only in the upstream header; session.update on created; audio held until configured, then batched", () => {
  const f = fakeRelay();
  assert.equal(f.up.headers["api-key"], "sekrit-key-123");
  assert.ok(!f.up.url.includes("sekrit"));
  // audio before the session is configured is held (it would be read as mono 24 kHz)
  f.relay.clientBinary(Buffer.alloc(D5_FRAME_BYTES * 3 + 7)); // 3 whole frames + a partial tail (dropped)
  assert.equal(f.toUp.length, 0);
  f.up.onmessage({ data: JSON.stringify({ type: "session.created", session: {} }) });
  assert.equal(f.toUp[0].type, "session.update");
  assert.equal(f.toUp[0].session.input_audio_echo_cancellation.reference_source, "client");
  f.up.onmessage({ data: JSON.stringify({ type: "session.updated", session: { input_audio_echo_cancellation: { type: "server_echo_cancellation", reference_source: "client", channels: 2 } } }) });
  const appends = f.toUp.filter((m) => m.type === "input_audio_buffer.append");
  assert.equal(appends.length, 1, "3 frames → one append of 2 now, 1 pending");
  assert.equal(Buffer.from(appends[0].audio, "base64").length, D5_FRAME_BYTES * D5_FRAMES_PER_APPEND);
  f.relay.clientBinary(Buffer.alloc(D5_FRAME_BYTES));
  assert.equal(f.toUp.filter((m) => m.type === "input_audio_buffer.append").length, 2);
  assert.equal(f.relay.stats.framesIn, 4);
  // events down: allowlisted, never the key
  f.up.onmessage({ data: JSON.stringify({ type: "response.created" }) });
  f.up.onmessage({ data: JSON.stringify({ type: "input_audio_buffer.speech_started", item_id: "a", audio_start_ms: 100 }) });
  assert.deepEqual(f.toClient.map((e) => [e.type, e.phase ?? null]), [["d5.session", "created"], ["d5.session", "updated"], ["input_audio_buffer.speech_started", null]]);
  assert.ok(!JSON.stringify(f.toClient).includes("sekrit"));
  // client ops
  f.relay.clientText('{"type":"commit"}');
  f.relay.clientText('{"type":"response.create"}');
  assert.equal(f.toUp.at(-1).type, "input_audio_buffer.commit");
  assert.equal(f.relay.stats.dropped, 2, "the partial tail and the refused op");
});

test("voicelive relay: upstream close / the session cap end both sides once, with numbers only", () => {
  const f = fakeRelay();
  assert.equal(f.timers[0].ms, 90 * 60_000);
  f.up.onclose();
  assert.deepEqual(f.closed(), [1011, "upstream_closed"]);
  assert.equal(f.toClient.at(-1).type, "d5.closed");
  assert.equal(f.ended().reason, "upstream_closed");
  f.relay.end(1000, "again");
  assert.equal(f.ended().reason, "upstream_closed", "idempotent");
  const g = fakeRelay();
  g.timers[0].fn();
  assert.deepEqual(g.closed(), [1000, "max_session"]);
  assert.equal(g.up.closed, true);
});

// ───────────────────────────── config.js: the cohort's lane ─────────────────────────────

test("config: the cohort gets lane d5 only when asked for AND Voice Live is configured; nobody else ever does", async () => {
  assert.equal(cohortLane({}), "d4");
  assert.equal(cohortLane({ TAXILA_DUPLEX_LANE: "d5" }), "d4", "no Voice Live config → D4");
  assert.equal(cohortLane({ TAXILA_DUPLEX_LANE: "d5", ...ENV }), "d5");
  const owner = { email: "Owner@Example.com" };
  const env = { TAXILA_DUPLEX: "shadow", TAXILA_DUPLEX_LIVE_FOR: sha("owner@example.com"), TAXILA_DUPLEX_LANE: "d5", ...ENV };
  const req = { headers: { cookie: "tx_session=abc" } };
  assert.deepEqual(await modeFor(req, { env, lookup: async () => owner }), { duplex: "on", cohort: "owner", lane: "d5" });
  assert.deepEqual(await modeFor(req, { env: { ...env, TAXILA_DUPLEX_LANE: "" }, lookup: async () => owner }), { duplex: "on", cohort: "owner" });
  assert.deepEqual(await modeFor(req, { env, lookup: async () => ({ email: "someone@else.com" }) }), { duplex: "shadow" });
  assert.deepEqual(await modeFor({ headers: {} }, { env, lookup: async () => owner }), { duplex: "shadow" });
  assert.deepEqual(await modeFor(req, { env: { ...env, TAXILA_DUPLEX: "off" }, lookup: async () => owner }), { duplex: "off" }, "the kill switch wins");
});

// ───────────────────────────── d5route.js ─────────────────────────────

const LESSON = "00000000-0000-0000-0000-000000000001";
const deps = (over = {}) => ({
  env: ENV,
  lookupLesson: async () => ({ id: LESSON, child_id: "c1", ended_at: null }),
  child: async () => ({ guardian: { id: "g1", email: "o@x" }, child: { id: "c1" } }),
  consent: async () => true,
  mode: async () => ({ duplex: "on", cohort: "owner", lane: "d5" }),
  ...over,
});
const status = (p) => p.then(() => 200, (e) => e.status);

test("d5route: the stt-token gates plus the cohort lane", async () => {
  const req = upgradeReq();
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps() })), 200);
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps({ env: {} }) })), 503);
  assert.equal(await status(authorizeD5(req, { lessonId: "nope", ...deps() })), 400);
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps({ lookupLesson: async () => null }) })), 404);
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps({ lookupLesson: async () => ({ id: LESSON, child_id: "c1", ended_at: new Date() }) }) })), 409);
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps({ consent: async () => false }) })), 403);
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps({ mode: async () => ({ duplex: "on", cohort: "owner" }) }) })), 403);
  const unauth = Object.assign(new Error("not signed in"), { status: 401 });
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps({ child: async () => { throw unauth; } }) })), 401);
});

test("d5route: refuses bad upgrades and other origins before any lookup; opens the relay when allowed", async () => {
  const s1 = new FakeSocket();
  await handleD5Upgrade(upgradeReq({ "sec-websocket-version": "8" }), s1, Buffer.alloc(0), { env: ENV });
  assert.match(s1.text, /^HTTP\/1\.1 400/);
  assert.ok(s1.destroyed);
  const s2 = new FakeSocket();
  await handleD5Upgrade(upgradeReq({ origin: "https://evil.example" }), s2, Buffer.alloc(0), { env: ENV });
  assert.match(s2.text, /^HTTP\/1\.1 403/);
  const s3 = new FakeSocket();
  const { env: _e, ...authorize } = deps();
  const up = { send() {}, close() {} };
  const relay = await handleD5Upgrade(upgradeReq({ origin: "https://taxila.dev" }), s3, Buffer.alloc(0), { env: ENV, authorize, openUpstream: () => up });
  assert.match(s3.text, /^HTTP\/1\.1 101/);
  assert.ok(relay instanceof VoiceLiveRelay);
  relay.end(1000, "test");
  const s4 = new FakeSocket();
  await handleD5Upgrade(upgradeReq(), s4, Buffer.alloc(0), { env: ENV, authorize: { ...authorize, consent: async () => false } });
  assert.match(s4.text, /^HTTP\/1\.1 403/);
});

test("d5route: a per-guardian open rate", () => {
  const t = 1_000_000;
  for (let i = 0; i < D5_OPENS_PER_MINUTE; i++) assert.equal(allowD5("rate-g", t + i), true);
  assert.equal(allowD5("rate-g", t + 100), false);
  assert.equal(allowD5("rate-g", t + 61_000), true, "a minute later");
});

// ───────────────────────────── integration: a real socket, a real client ─────────────────────────────

test("integration: a real HTTP upgrade, Node's own WebSocket client, the relay to a fake Voice Live and back", async () => {
  const http = await import("node:http");
  const upstream = { sent: [] };
  const openUpstream = () => {
    const up = { readyState: 1, send: (m) => upstream.sent.push(JSON.parse(m)), close: () => { up.readyState = 3; } };
    upstream.ws = up;
    // Voice Live's handshake: created → (our session.update) → updated
    setTimeout(() => up.onmessage({ data: JSON.stringify({ type: "session.created", session: {} }) }), 5);
    setTimeout(() => up.onmessage({ data: JSON.stringify({ type: "session.updated", session: { input_audio_echo_cancellation: { type: "server_echo_cancellation", reference_source: "client", channels: 2 }, input_audio_noise_reduction: { type: "azure_deep_noise_suppression" } } }) }), 15);
    return up;
  };
  const { env: _e, ...authorize } = deps();
  const server = http.createServer((_q, s) => { s.statusCode = 404; s.end(); });
  server.on("upgrade", (req, socket, head) => { void handleD5Upgrade(req, socket, head, { env: ENV, authorize, openUpstream }); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  try {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/api/duplex/voicelive?lessonId=${LESSON}`);
    ws.binaryType = "arraybuffer";
    const got = [];
    await new Promise((resolve, reject) => {
      const to = setTimeout(() => reject(new Error("no session")), 3000);
      ws.onmessage = (m) => { const e = JSON.parse(m.data); got.push(e); if (e.type === "d5.session" && e.phase === "updated") { clearTimeout(to); resolve(); } };
      ws.onerror = () => { clearTimeout(to); reject(new Error("socket error")); };
    });
    assert.equal(got.at(-1).aec.reference, "client");
    // 3 stereo frames (one oversized message, then a small one) and a commit
    ws.send(new Uint8Array(D5_FRAME_BYTES * 2));
    ws.send(new Uint8Array(D5_FRAME_BYTES));
    ws.send(JSON.stringify({ type: "commit" }));
    ws.send(JSON.stringify({ type: "response.create" }));
    await sleep(50);
    const appends = upstream.sent.filter((m) => m.type === "input_audio_buffer.append");
    assert.equal(appends.length, 1);
    assert.equal(Buffer.from(appends[0].audio, "base64").length, D5_FRAME_BYTES * 2);
    assert.equal(upstream.sent.filter((m) => m.type === "input_audio_buffer.commit").length, 1);
    assert.equal(upstream.sent.filter((m) => m.type === "response.create").length, 0);
    // events down
    upstream.ws.onmessage({ data: JSON.stringify({ type: "input_audio_buffer.speech_started", item_id: "i9", audio_start_ms: 40 }) });
    upstream.ws.onmessage({ data: JSON.stringify({ type: "response.audio.delta", delta: "AAAA" }) });
    upstream.ws.onmessage({ data: JSON.stringify({ type: "conversation.item.input_audio_transcription.completed", item_id: "i9", transcript: "छप्पन" }) });
    await sleep(50);
    const types = got.map((e) => e.type);
    assert.ok(types.includes("input_audio_buffer.speech_started"));
    assert.ok(types.includes("conversation.item.input_audio_transcription.completed"));
    assert.ok(!types.includes("response.audio.delta"));
    // the browser leaves: the upstream closes
    const closed = new Promise((r) => { ws.onclose = r; });
    ws.close();
    await closed;
    await sleep(30);
    assert.equal(upstream.ws.readyState, 3);
  } finally { server.close(); }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
