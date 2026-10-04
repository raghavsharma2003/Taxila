// ROUTER-CHANGES A3a smoke (2026-10-04): can the live STT move from gpt-4o-transcribe to taxila-live-transcribe?
//   1. mint the transcription session the stt-token route mints (server/voice/stt.js sttSession + azure.js
//      mintRealtimeSecret, the same two calls routes/voice.js makes), with model taxila-live-transcribe, and check the
//      session — `include: ["item.input_audio_transcription.logprobs"]` in it — is accepted, both by
//      /realtime/client_secrets and by a session.update on the transcription socket;
//   2. speak 5 synthetic child utterances (gpt-4o-mini-tts child voice, x1.2 pitch: the cascade-latency recipe) in
//      real time over the socket, server VAD as shipped, and record deltas, completed events and logprobs.
// Same model, same order, for the current default (taxila-transcribe = gpt-4o-transcribe) as the control arm.
// Not a gate; it calls Azure (5 TTS + 10 transcriptions, well under $0.05).
//   NODE_USE_ENV_PROXY=1 node evals/model-refresh-2026-10-04/router-shipnow/stt-live-smoke.mjs [--out file.json]
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
const ROOT = new URL("../../../", import.meta.url).pathname;
for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
await import(ROOT + "server/net.js");
const { sttSession, confidenceFromLogprobs } = await import(ROOT + "server/voice/stt.js");
const { mintRealtimeSecret, endpoint } = await import(ROOT + "server/azure.js");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("--out");
const E = endpoint("TRANSCRIBE"), KEY = process.env.AZURE_OPENAI_API_KEY;
const SR = 24000, BPS = SR * 2, CHUNK_MS = 40;
const WD = fs.mkdtempSync(path.join(os.tmpdir(), "stt-smoke-"));
const CHILD_VOICE = "Voice: a shy 9-year-old Indian child answering a teacher, Hindi-English mix, a little hesitant, natural pace.";
const LINES = ["मुझे लगता है छह faces हैं", "Didi, aath corners hote hain na?", "बारह edges और आठ corners", "pata nahi didi, ek baar phir batao", "Cube के सारे faces square होते हैं"];

async function clip(text, voice) {
  const r = await fetch(`${endpoint("TTS")}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input: text, instructions: CHILD_VOICE, response_format: "pcm" }) });
  if (!r.ok) throw new Error(`tts ${r.status}`);
  const a = path.join(WD, "in.pcm"), b = path.join(WD, "out.pcm");
  fs.writeFileSync(a, Buffer.from(await r.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a,
    "-af", `asetrate=${SR * 1.2},aresample=${SR},atempo=${(1 / 1.2).toFixed(4)}`, "-f", "s16le", "-ar", String(SR), "-ac", "1", b]);
  return fs.readFileSync(b);
}

/** One socket per arm; the session sent is exactly sttSession()'s, plus the PCM input format the WebSocket needs. */
function socket(session) {
  const ws = new WebSocket(`${E.replace(/^https/, "wss")}/realtime?intent=transcription`, { headers: { "api-key": KEY } });
  const events = [];
  const listeners = new Set();
  const ready = new Promise((resolve) => {
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { ...session, audio: { input: { ...session.audio.input, format: { type: "audio/pcm", rate: SR } } } } }));
    ws.onerror = (e) => resolve({ ok: false, error: `ws error ${e?.message ?? ""}` });
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      events.push(e.type);
      if (e.type === "session.updated") resolve({ ok: true, include: e.session?.include ?? null, model: e.session?.audio?.input?.transcription?.model ?? null });
      if (e.type === "error") resolve({ ok: false, error: JSON.stringify(e.error).slice(0, 300) });
      for (const fn of listeners) fn(e, performance.now());
    };
  });
  return { ws, ready, events, on: (fn) => (listeners.add(fn), () => listeners.delete(fn)) };
}

function speak(s, pcm) {
  const all = Buffer.concat([Buffer.alloc(BPS / 2), pcm, Buffer.alloc(BPS * 3)]);
  return new Promise((resolve) => {
    const out = { deltas: 0, completed: 0, failed: 0, text: "", logprobs: 0, conf: undefined, errors: [] };
    const confs = [];
    let t0 = 0, stopAt;
    const off = s.on((e, at) => {
      if (e.type === "input_audio_buffer.speech_stopped") stopAt = at;
      if (e.type === "conversation.item.input_audio_transcription.delta") { out.deltas++; if (out.firstDeltaMs === undefined) out.firstDeltaMs = Math.round(at - t0); }
      if (e.type === "conversation.item.input_audio_transcription.completed") {
        out.completed++;
        out.text = `${out.text} ${String(e.transcript || "").trim()}`.trim();
        out.logprobs += Array.isArray(e.logprobs) ? e.logprobs.length : 0;
        const c = confidenceFromLogprobs(e.logprobs);
        if (c !== undefined) confs.push(c);
        if (stopAt !== undefined) out.finalAfterVadMs = Math.round(at - stopAt);
      }
      if (e.type === "conversation.item.input_audio_transcription.failed") out.failed++;
      if (e.type === "error") out.errors.push(JSON.stringify(e.error).slice(0, 200));
    });
    t0 = performance.now();
    let pos = 0, n = 0;
    const step = (BPS * CHUNK_MS) / 1000;
    const tick = () => {
      if (pos >= all.length) { setTimeout(() => { off(); out.conf = confs.length ? +(confs.reduce((a, b) => a + b, 0) / confs.length).toFixed(3) : undefined; resolve(out); }, 4000); return; }
      s.ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: all.subarray(pos, pos + step).toString("base64") }));
      pos += step; n++;
      setTimeout(tick, Math.max(0, t0 + n * CHUNK_MS - performance.now()));
    };
    tick();
  });
}

const clips = [];
for (const [i, l] of LINES.entries()) clips.push(await clip(l, i % 2 ? "sage" : "coral"));
const result = { date: new Date().toISOString().slice(0, 10), method: "sttSession(ageBand 6-9) as routes/voice.js mints it; client_secrets mint + session.update over the WebSocket transcription transport; 5 synthetic child clips (gpt-4o-mini-tts, x1.2 pitch) streamed at real time, server VAD as shipped", arms: {} };
for (const model of ["taxila-live-transcribe", "taxila-transcribe"]) {
  const session = sttSession({ ageBand: "6-9", model });
  const arm = { model, sessionInclude: session.include };
  try { const s = await mintRealtimeSecret(session); arm.mint = { ok: !!s.value, echoedInclude: s.session?.include ?? null }; }
  catch (e) { arm.mint = { ok: false, error: String(e.message).slice(0, 300) }; }
  const s = socket(session);
  arm.sessionUpdate = await s.ready;
  arm.utterances = [];
  if (arm.sessionUpdate.ok) for (const [i, pcm] of clips.entries()) arm.utterances.push({ said: LINES[i], ...(await speak(s, pcm)) });
  s.ws.close();
  result.arms[model] = arm;
  console.log(`\n${model}: mint ${JSON.stringify(arm.mint)} · session.update ${JSON.stringify(arm.sessionUpdate)}`);
  for (const u of arm.utterances) console.log(`  deltas ${u.deltas} completed ${u.completed} failed ${u.failed} logprobs ${u.logprobs} conf ${u.conf} firstDelta ${u.firstDeltaMs} ms final-after-VAD ${u.finalAfterVadMs} ms  "${u.said}" → "${u.text}"${u.errors.length ? ` errors ${u.errors}` : ""}`);
}
fs.rmSync(WD, { recursive: true, force: true });
if (OUT) fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
process.exit(0);
