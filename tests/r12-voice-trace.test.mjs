// r12 flight recorder, T-voice (src/voice/trace.ts): the voice events WITH reasons, the tier rules, and "the recorder never
// changes a lesson". The cascade-link suites are re-run under a broken recorder and a tier-1 recorder that fails the run if
// a single blob or audio byte leaves the device (the public promise "Audio of your child's voice is never stored").
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resetVoiceTraceState, noteDuplexResolved, micModeWhy, SttTracer, unsureTokens, meanConfidence, setVoiceTraceSink, vt, VoiceLinkTrace, traceMicMode, fit, MAX_DATA_CHARS } from "../src/voice/trace.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function capture(full = false) {
  resetVoiceTraceState(); // the suite may share this module with other files: start each test from a fresh page
  const events = [];
  const blobs = [];
  setVoiceTraceSink({ emit: (kind, data, opts) => events.push({ kind, data, tier: opts?.tier ?? 1 }), full: () => full, blob: (kind, blob, data) => blobs.push({ kind, blob, data }) });
  return { events, blobs, of: (k) => events.filter((e) => e.kind === k) };
}

test("mic.mode: the owner's phone (class 9, loudspeaker, duplex shadow) is tap, and every gate that held is named", () => {
  const w = micModeWhy({ older: true, wanted: "tap", headset: false, echoDemoted: false, duplex: "shadow", duplexLive: false, transport: "webrtc", pushToTalk: true });
  assert.equal(w.mode, "tap");
  assert.deepEqual(w.reasons, ["talk_pref_tap", "no_headset_detected", "echo_probe_not_built", "duplex_shadow_only"]);
});

test("mic.mode: a live duplex engine is hands-free with no headset (useDesk: openMic = ctx.openMic || duplexLive)", () => {
  const w = micModeWhy({ older: true, wanted: "tap", headset: false, echoDemoted: false, duplex: "on", duplexLive: true, transport: "webrtc", pushToTalk: false });
  assert.equal(w.mode, "duplex");
  assert.deepEqual(w.reasons, []);
});

test("mic.mode: a duplex fallback and a lost transcription call are reasons", () => {
  const w = micModeWhy({ older: true, wanted: "open", headset: true, echoDemoted: false, duplex: "on", duplexLive: false, duplexFallback: "no_frames", transport: "recording", pushToTalk: true });
  assert.equal(w.mode, "tap");
  assert.ok(w.reasons.includes("transcription_call_unavailable"));
  assert.ok(w.reasons.includes("duplex_fallback:no_frames"));
  assert.ok(w.reasons.includes("duplex_not_live"));
});

test("traceMicMode records once per change", () => {
  const c = capture();
  const i = { older: true, wanted: "tap", headset: false, echoDemoted: false, duplexLive: false, transport: "webrtc", pushToTalk: true };
  traceMicMode(i);
  traceMicMode(i);
  traceMicMode({ ...i, duplexLive: true, pushToTalk: false });
  const modes = c.of("mic.mode");
  assert.equal(modes.length, 2);
  assert.equal(modes[0].data.mode, "tap");
  assert.equal(modes[1].data.mode, "duplex");
  setVoiceTraceSink(null);
});

test("mic.mode carries the resolved duplex mode when it arrives after the lesson's first mode (shadow, not off)", () => {
  const c = capture();
  traceMicMode({ older: true, wanted: "tap", headset: false, echoDemoted: false, duplexLive: false, transport: "webrtc", pushToTalk: true, ui: "t2" });
  assert.ok(c.of("mic.mode").at(-1).data.reasons.includes("duplex_not_resolved_yet"));
  noteDuplexResolved("shadow", "server_shadow");
  const last = c.of("mic.mode").at(-1).data;
  assert.ok(last.reasons.includes("duplex_shadow_only"));
  assert.equal(last.duplexSource, "server_shadow");
  setVoiceTraceSink(null);
});

test("asr: vad start/end, throttled partials, a final with confidence, the least-sure tokens and ms from end of speech", () => {
  const c = capture();
  let now = 1000;
  const st = new SttTracer(() => now);
  st.config = { model: "gpt-live-transcribe", language: "hi" };
  st.handle({ type: "input_audio_buffer.speech_started", item_id: "i1", audio_start_ms: 500 });
  now = 1100; st.handle({ type: "conversation.item.input_audio_transcription.delta", item_id: "i1", delta: "clear the " });
  now = 1200; st.handle({ type: "conversation.item.input_audio_transcription.delta", item_id: "i1", delta: "recording " });
  now = 1900; st.handle({ type: "input_audio_buffer.speech_stopped", item_id: "i1", audio_end_ms: 1400 });
  now = 2300;
  st.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "i1", transcript: "clear the recording rules",
    logprobs: [{ token: "clear", logprob: -0.01 }, { token: " the", logprob: -0.02 }, { token: " recording", logprob: Math.log(0.31) }, { token: " rules", logprob: -0.05 }] });
  assert.equal(c.of("vad.start")[0].data.source, "server");
  assert.equal(c.of("vad.end")[0].data.speechMs, 900);
  // 1100 sent, 1200 throttled, then flushed before the final
  assert.equal(c.of("asr.partial").length, 2);
  assert.equal(c.of("asr.partial")[1].data.text, "clear the recording ");
  const f = c.of("asr.final")[0].data;
  assert.equal(f.text, "clear the recording rules");
  assert.equal(f.msFromSpeechEnd, 400);
  assert.equal(f.msFromSpeechStart, 1300);
  assert.equal(f.language, "hi");
  assert.deepEqual(f.unsure, [{ word: " recording", p: 0.31 }]);
  assert.ok(f.confidence > 0.7 && f.confidence < 0.8);
  assert.deepEqual(f.alternatives, []);
  setVoiceTraceSink(null);
});

test("asr: a failed transcription is a final with failed: true", () => {
  const c = capture();
  const st = new SttTracer(() => 5);
  st.handle({ type: "conversation.item.input_audio_transcription.failed", item_id: "x", error: { message: "boom" } });
  assert.equal(c.of("asr.final")[0].data.failed, true);
  setVoiceTraceSink(null);
});

test("helpers: unsure tokens and mean confidence", () => {
  assert.deepEqual(unsureTokens([{ token: "a", logprob: 0 }, { token: "b", logprob: Math.log(0.2) }]), [{ word: "b", p: 0.2 }]);
  assert.equal(meanConfidence(undefined), null);
});

test("tts: request → start → end (played fully), a stop is an interrupt with what was left unplayed, a failure is tts.error", async () => {
  const c = capture();
  let now = 0;
  const vl = new VoiceLinkTrace({ lessonId: "L1", lane: "cascade", now: () => now });
  const pb = (status, startAt) => ({ started: startAt === null ? Promise.reject(new Error("no audio")) : Promise.resolve(startAt), ended: Promise.resolve(status), remainingS: () => 1.25 });
  now = 100;
  const a = pb("completed", 400);
  a.started.catch(() => {});
  vl.replyRequested("r1", "Namaste!", 1, a);
  await new Promise((r) => setTimeout(r, 5));
  vl.replyRequested("r2", "Doosra", 2, pb("stopped", 900));
  vl.replyStopped("r2", "cancelled", true);
  const f = pb("failed", null);
  f.started.catch(() => {});
  vl.replyRequested("r3", "Teesra", 3, f);
  await new Promise((r) => setTimeout(r, 5));
  assert.deepEqual(c.of("tts.request").map((e) => e.data.text), ["Namaste!", "Doosra", "Teesra"]);
  assert.equal(c.of("tts.start")[0].data.msFromRequest, 300);
  const ends = c.of("tts.end");
  assert.equal(ends.find((e) => e.data.replyId === "r1").data.playedFully, true);
  const cut = ends.find((e) => e.data.replyId === "r2").data;
  assert.equal(cut.playedFully, false);
  assert.equal(cut.msUnplayed, 1250);
  assert.equal(c.of("tts.interrupt")[0].data.byChild, true);
  assert.equal(c.of("tts.error")[0].data.error, "no_audio");
  setVoiceTraceSink(null);
});

test("tier 1: no clip recorder, no blob, no audio in any event; tier 2 records from the stream it is GIVEN (no getUserMedia)", () => {
  const made = [];
  let gum = 0;
  const saved = { MediaRecorder: globalThis.MediaRecorder, navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator") };
  globalThis.MediaRecorder = class {
    static isTypeSupported() { return true; }
    constructor(stream) { this.stream = stream; this.state = "inactive"; this.mimeType = "audio/webm"; made.push(this); }
    start() { this.state = "recording"; }
    stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob([new Uint8Array(10)]) }); this.onstop?.(); }
  };
  Object.defineProperty(globalThis, "navigator", { value: { mediaDevices: { getUserMedia: async () => { gum++; return {}; } } }, configurable: true });
  const stream = { getAudioTracks: () => [{ label: "Default", getSettings: () => ({ echoCancellation: true }) }] };
  try {
    const t1 = capture(false);
    const a = new VoiceLinkTrace({ lessonId: "L1", lane: "cascade" });
    a.micOpen(stream, null);
    a.tap("start");
    a.tap("end");
    a.sttEvent({ type: "input_audio_buffer.speech_started", item_id: "i" });
    a.sttEvent({ type: "input_audio_buffer.speech_stopped", item_id: "i" });
    assert.equal(made.length, 0, "tier 1 never constructs a clip recorder");
    assert.equal(t1.blobs.length, 0, "tier 1 never hands over a blob");
    assert.ok(t1.events.every((e) => !Object.values(e.data).some((v) => v instanceof Blob || ArrayBuffer.isView(v))));
    assert.equal(t1.of("mic.state")[0].data.echoCancellation, true);

    const t2 = capture(true);
    const b = new VoiceLinkTrace({ lessonId: "L1", lane: "cascade" });
    b.micOpen(stream, null);
    b.tap("start");
    b.tap("end");
    assert.equal(made.length, 1);
    assert.equal(made[0].stream, stream, "the clip is recorded from the link's own mic stream");
    assert.equal(t2.blobs.length, 1);
    assert.equal(t2.blobs[0].kind, "audio.mic.chunk");
    assert.equal(gum, 0, "never a second getUserMedia");
  } finally {
    globalThis.MediaRecorder = saved.MediaRecorder;
    if (saved.navigator) Object.defineProperty(globalThis, "navigator", saved.navigator);
    else delete globalThis.navigator;
    setVoiceTraceSink(null);
  }
});

test("data fits the 8 KB event limit (shared/trace.ts): long text is cut, never dropped silently", () => {
  const c = capture();
  vt("tts.request", { replyId: "r", text: "x".repeat(20000), seq: 1 });
  const d = c.of("tts.request")[0].data;
  assert.ok(JSON.stringify(d).length <= MAX_DATA_CHARS);
  assert.equal(d.truncated, true);
  assert.equal(d.seq, 1);
  assert.equal(fit({ a: 1 }).a, 1);
  setVoiceTraceSink(null);
});

test("no voice event uses a key shared/trace.ts masks (token, key, …): the evidence would be erased", () => {
  const c = capture();
  const st = new SttTracer(() => 1);
  st.handle({ type: "conversation.item.input_audio_transcription.completed", item_id: "a", transcript: "x", logprobs: [{ token: "x", logprob: -2 }] });
  const MASKED = new Set(["password", "pin", "email", "phone", "otp", "token", "secret", "apikey", "api_key", "key", "authorization", "cookie"]);
  const keys = (v, out = []) => { if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { out.push(k.toLowerCase()); keys(x, out); } return out; };
  assert.deepEqual(keys(c.events.map((e) => e.data)).filter((k) => MASKED.has(k)), []);
  setVoiceTraceSink(null);
});

test("the recorder never throws into a lesson: a sink that throws everywhere is swallowed", () => {
  setVoiceTraceSink({ emit() { throw new Error("x"); }, full() { throw new Error("y"); }, blob() { throw new Error("z"); } });
  assert.doesNotThrow(() => {
    vt("mic.state", { state: "open" });
    const vl = new VoiceLinkTrace({ lessonId: "L", lane: "cascade" });
    vl.micOpen({ getAudioTracks: () => [] }, null);
    vl.sttEvent({ type: "conversation.item.input_audio_transcription.completed", item_id: "a", transcript: "x" });
    vl.localVad("onset", true);
    vl.bargein("local_duck");
    vl.close();
    traceMicMode({ older: false, wanted: "tap", headset: false, echoDemoted: false });
  });
  setVoiceTraceSink(null);
});

/** The parent runner's NODE_TEST_CONTEXT would make the child report to it instead of running the file. */
function childEnv(mode) {
  const env = { ...process.env, R12_TRACE: mode };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

// The cascade lane's own suites, unchanged, under (a) a recorder that throws on every call and (b) a tier-1 recorder that
// fails the run if one blob or audio byte is handed over. Identical pass = the recorder changed nothing.
for (const mode of ["throw", "tier1"]) {
  for (const file of ["tests/voice-cascade.test.mjs", "tests/p1-duplex-live.test.mjs"]) {
    test(`${file} passes unchanged under a ${mode} recorder`, () => {
      const r = spawnSync(process.execPath, ["--import", "./tests/fixtures/r12-trace-sink.mjs", "--test", file], { cwd: ROOT, env: childEnv(mode), encoding: "utf8", timeout: 240000 });
      assert.match(r.stdout, /# pass [1-9]\d*/, `${file} under ${mode} ran no tests`);
      assert.match(r.stdout, /# fail 0/);
      assert.equal(r.status, 0, `${file} under ${mode}:\n${(r.stdout + r.stderr).split("\n").filter((l) => /not ok|VIOLATION|Error/.test(l)).slice(0, 20).join("\n")}`);
      if (mode === "tier1") assert.match(r.stdout + r.stderr, /r12-trace-sink tier1: [1-9]\d* events, 0 blobs/);
    });
  }
}
