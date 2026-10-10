// r4-latency: on TAP-TO-TALK (push-to-talk: no server VAD, the device commits on the child's Done tap), does
// gpt-live-transcribe stream the words BEFORE the commit? If yes, the device prefetch can fire at the Done tap
// (src/lesson/cascadeLink.ts talkEnd) instead of waiting for the final transcript. Streams a synthetic child clip in
// real time to the transcription socket with turn_detection null, commits DONE_MS after the clip's speech end (the
// child's tap), and records each event's time relative to that speech end. Synthetic child speech; US container.
//   node --env-file=.env.local evals/latency/ptt-deltas.mjs [--n 8] [--done 700]
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { sttSession } from "../../server/voice/stt.js";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", 8)), DONE_MS = Number(arg("--done", 700));
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), KEY = process.env.AZURE_OPENAI_API_KEY;
const SR = 24000, BPS = SR * 2, CHUNK_MS = 40;
const LINES = ["Mujhe lagta hai dice ke chhe faces hain.", "Woh line edge hai, kinara.", "Cube ke aath corners hote hain.", "Mujhe nahi pata, ek baar aur batao na.",
  "Baarah edges aur aath corners.", "Haan didi, samajh gaya.", "Paanch faces, ek square aur chaar triangle.", "Kyunki maine har taraf gina."];
const WD = fs.mkdtempSync(path.join(os.tmpdir(), "ptt-"));
async function clip(text) {
  const r = await fetch(`${E}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice: "coral", input: text, instructions: "Voice of a shy 9-year-old Indian child answering a teacher in class. Natural, a little hesitant, Indian accent, not theatrical.", response_format: "pcm" }) });
  if (!r.ok) throw new Error(`tts ${r.status}`);
  const a = path.join(WD, "a.pcm"), b = path.join(WD, "b.pcm");
  fs.writeFileSync(a, Buffer.from(await r.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a, "-af", `asetrate=${SR * 1.2},aresample=${SR},atempo=0.8333`, "-f", "s16le", "-ar", String(SR), "-ac", "1", b]);
  return fs.readFileSync(b);
}
const speechEnd = (pcm) => { for (let i = (pcm.length >> 1) - 1; i >= 0; i--) if (Math.abs(pcm.readInt16LE(i * 2)) > 327) return (i / SR) * 1000; return 0; };
const session = sttSession({ ageBand: "6-9", model: process.env.TAXILA_STT_MODEL || "taxila-live-transcribe" });
session.audio.input.turn_detection = null; // push-to-talk: the device commits
const rows = [];
for (let k = 0; k < N; k++) {
  const pcm = await clip(LINES[k % LINES.length]);
  const ws = new WebSocket(`${E.replace(/^https/, "wss")}/realtime?intent=transcription`, { headers: { "api-key": KEY } });
  const ev = [];
  let t0 = 0;
  await new Promise((res, rej) => {
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { ...session, audio: { input: { ...session.audio.input, format: { type: "audio/pcm", rate: SR } } } } }));
    ws.onerror = () => rej(new Error("ws"));
    ws.onmessage = (m) => { const e = JSON.parse(m.data); if (e.type === "session.updated") res(); if (t0) ev.push({ type: e.type, at: performance.now() - t0, delta: e.delta, transcript: e.transcript }); };
  });
  const all = Buffer.concat([Buffer.alloc(BPS / 2), pcm, Buffer.alloc(Math.round((BPS * (DONE_MS + 200)) / 1000))]);
  const end = 500 + speechEnd(pcm);
  t0 = performance.now();
  await new Promise((done) => {
    let pos = 0, n = 0;
    const step = (BPS * CHUNK_MS) / 1000;
    const tick = () => {
      const now = performance.now() - t0;
      if (now >= end + DONE_MS) { ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); return done(); }
      if (pos < all.length) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: all.subarray(pos, pos + step).toString("base64") }));
      pos += step; n++;
      setTimeout(tick, Math.max(0, n * CHUNK_MS - (performance.now() - t0)));
    };
    tick();
  });
  const commitAt = performance.now() - t0;
  await new Promise((r) => { const t = setInterval(() => { if (ev.some((e) => /transcription\.(completed|failed)/.test(e.type)) || performance.now() - t0 > end + 8000) { clearInterval(t); r(); } }, 50); });
  ws.close();
  const deltas = ev.filter((e) => /transcription\.delta/.test(e.type));
  const fin = ev.find((e) => /transcription\.completed/.test(e.type));
  const joined = deltas.map((d) => d.delta).join("").trim();
  rows.push({ line: LINES[k % LINES.length], commit: Math.round(commitAt - end), deltasBeforeCommit: deltas.filter((d) => d.at < commitAt).length, deltas: deltas.length,
    firstDelta: deltas[0] ? Math.round(deltas[0].at - end) : null, lastDelta: deltas.at(-1) ? Math.round(deltas.at(-1).at - end) : null,
    final: fin ? Math.round(fin.at - end) : null, deltaEqualsFinal: !!fin && joined === String(fin.transcript ?? "").trim() });
  console.log(JSON.stringify(rows.at(-1)));
}
fs.rmSync(WD, { recursive: true, force: true });
const med = (k) => { const v = rows.map((r) => r[k]).filter(Number.isFinite).sort((a, b) => a - b); return v[v.length >> 1]; };
console.log(`n=${rows.length} (ms after speech end; Done tap at +${DONE_MS}): first delta p50 ${med("firstDelta")}, last delta p50 ${med("lastDelta")}, final p50 ${med("final")}, deltas before commit ${rows.filter((r) => r.deltasBeforeCommit > 0).length}/${rows.length}, deltas = final ${rows.filter((r) => r.deltaEqualsFinal).length}/${rows.length}`);
process.exit(0);
