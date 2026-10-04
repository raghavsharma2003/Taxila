// Concurrency check for ROUTER-CHANGES A3 (2026-10-04): taxila-live-transcribe is a capacity-10 deployment on a
// subscription-pooled quota of 10 (docs/ops/INDIA-MOVE.md §2.1), against 100 for taxila-transcribe. Opens K
// transcription sessions AT ONCE with the exact sttSession() config, streams one synthetic child clip into each at
// real time, and counts sessions that were refused, errored, or never produced a completed transcript.
// A rate-limited live STT session is a child nobody hears, so this is the number the switch must not break.
//   NODE_USE_ENV_PROXY=1 node evals/model-refresh-2026-10-04/router-shipnow/stt-live-concurrency.mjs [--k 4,8,12] [--model taxila-live-transcribe] [--out f.json]
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
const { sttSession } = await import(ROOT + "server/voice/stt.js");
const { endpoint } = await import(ROOT + "server/azure.js");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const KS = arg("--k", "4,8,12").split(",").map(Number);
const MODEL = arg("--model", "taxila-live-transcribe");
const OUT = arg("--out");
const E = endpoint("TRANSCRIBE"), KEY = process.env.AZURE_OPENAI_API_KEY;
const SR = 24000, BPS = SR * 2, CHUNK_MS = 40;
const WD = fs.mkdtempSync(path.join(os.tmpdir(), "stt-conc-"));

const r = await fetch(`${endpoint("TTS")}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
  body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice: "coral", input: "मुझे लगता है छह faces हैं", instructions: "Voice of a shy 9-year-old Indian child answering a teacher.", response_format: "pcm" }) });
fs.writeFileSync(path.join(WD, "a.pcm"), Buffer.from(await r.arrayBuffer()));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", path.join(WD, "a.pcm"),
  "-af", `asetrate=${SR * 1.2},aresample=${SR},atempo=${(1 / 1.2).toFixed(4)}`, "-f", "s16le", "-ar", String(SR), "-ac", "1", path.join(WD, "b.pcm")]);
const pcm = Buffer.concat([Buffer.alloc(BPS / 2), fs.readFileSync(path.join(WD, "b.pcm")), Buffer.alloc(BPS * 3)]);

function one() {
  const session = sttSession({ ageBand: "6-9", model: MODEL });
  return new Promise((resolve) => {
    const o = { updated: false, completed: false, errors: [] };
    const ws = new WebSocket(`${E.replace(/^https/, "wss")}/realtime?intent=transcription`, { headers: { "api-key": KEY } });
    const done = () => { clearTimeout(timer); try { ws.close(); } catch {} resolve(o); };
    const timer = setTimeout(done, 30_000);
    ws.onerror = (e) => { o.errors.push(`ws ${e?.message ?? "error"}`); done(); };
    ws.onclose = (e) => { if (!o.completed) o.errors.push(`closed ${e.code} ${String(e.reason).slice(0, 120)}`); done(); };
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { ...session, audio: { input: { ...session.audio.input, format: { type: "audio/pcm", rate: SR } } } } }));
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === "error") o.errors.push(JSON.stringify(e.error).slice(0, 200));
      if (e.type === "conversation.item.input_audio_transcription.failed") o.errors.push(`failed ${JSON.stringify(e.error ?? {}).slice(0, 200)}`);
      if (e.type === "conversation.item.input_audio_transcription.completed") { o.completed = true; o.text = e.transcript; done(); }
      if (e.type === "session.updated" && !o.updated) {
        o.updated = true;
        const t0 = performance.now(); let pos = 0, n = 0; const step = (BPS * CHUNK_MS) / 1000;
        const tick = () => { if (pos >= pcm.length || ws.readyState !== 1) return; ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.subarray(pos, pos + step).toString("base64") })); pos += step; n++; setTimeout(tick, Math.max(0, t0 + n * CHUNK_MS - performance.now())); };
        tick();
      }
    };
  });
}

const res = { date: new Date().toISOString().slice(0, 10), model: MODEL, method: "K simultaneous WebSocket transcription sessions (sttSession config), one ~3 s synthetic child clip each at real time, server VAD; US container -> eastus2", runs: [] };
for (const k of KS) {
  const rows = await Promise.all(Array.from({ length: k }, one));
  const run = { k, completed: rows.filter((x) => x.completed).length, refused: rows.filter((x) => !x.updated).length, errors: [...new Set(rows.flatMap((x) => x.errors))].slice(0, 5) };
  res.runs.push(run);
  console.log(`K=${k}: completed ${run.completed}/${k}, never got session.updated ${run.refused}${run.errors.length ? `, errors ${JSON.stringify(run.errors)}` : ""}`);
  await new Promise((r) => setTimeout(r, 5000));
}
fs.rmSync(WD, { recursive: true, force: true });
if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
process.exit(0);
