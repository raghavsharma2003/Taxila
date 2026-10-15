// duplex bake-off 2026-10, arms (a) and (b): OUR cascade and OUR duplex engine on the assembled bake-off audio
// (assemble.mjs), with the REAL production transcriber (taxila-live-transcribe, eastus2) streamed at real time.
//   (a) cascade: the production transcription session (server VAD 900 ms, sttSession) decides: its speech_started pauses
//       her (cascadeLink onServerSpeechStart), its commit ends the child's turn. The device's local-energy pause is not
//       modelled (it only adds yields), so (a)'s false-yield counts are a lower bound.
//   (b) duplex engine: src/duplex DuplexLive on the device frames of the same audio + the live transcriber with the duplex
//       session shape (server VAD 1,500 ms backstop), via evals/duplex-real/lib.mjs runSession (open loop: her audio is not
//       cut when the engine yields; the decision is scored).
// Variants: clean (AEC residue -30 dB) and phone (raw speaker echo, no AEC; assemble.mjs).
//
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/duplex-2026-10/arms-ours.mjs --bake <dir> --arm cascade|duplex --variant clean|phone [--conc 6] [--only id,..]
import fs from "node:fs";
import path from "node:path";
import { ROOT, framesOf, runSession, to24k, s16, pool, loadEnv } from "../duplex-real/lib.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), ARM = arg("--arm"), VAR = arg("--variant", "clean"), CONC = Number(arg("--conc", 6));
const ONLY = arg("--only") ? new Set(arg("--only").split(",")) : null;
const SR = 16000, HOP = 320;
loadEnv();

const readS16 = (f) => { const b = fs.readFileSync(f); const x = new Float32Array(b.length / 2); for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768; return x; };

/** (a) the production cascade transcription session, real time; returns its events on the stream clock. */
async function runCascade(x) {
  const { sttSession } = await import(ROOT + "server/voice/stt.js");
  const { endpoint } = await import(ROOT + "server/azure.js");
  const base = sttSession({ ageBand: "10-15" });
  const session = { ...base, audio: { input: { ...base.audio.input, format: { type: "audio/pcm", rate: 24000 } } } };
  const url = `${endpoint("TRANSCRIBE").replace(/^https/, "wss")}/realtime?intent=transcription`;
  const ws = new WebSocket(url, { headers: { "api-key": process.env.AZURE_OPENAI_API_KEY } });
  const ev = [];
  const t0 = { v: 0 };
  await new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error("open timeout")), 20000);
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session }));
    ws.onerror = () => reject(new Error("socket error"));
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === "session.updated" || e.type === "transcription_session.updated") { clearTimeout(to); resolve(); }
      else if (e.type === "error") { clearTimeout(to); reject(new Error(String(e.error?.message ?? "error").slice(0, 120))); }
    };
  });
  ws.onmessage = (m) => { const e = JSON.parse(m.data); ev.push({ t: performance.now() - t0.v, type: e.type, item: e.item_id, text: e.transcript ?? e.delta ?? null, a0: e.audio_start_ms ?? null, a1: e.audio_end_ms ?? null }); };
  t0.v = performance.now();
  for (let i = 0; i < x.length; i += HOP) {
    const due = t0.v + (i / SR) * 1000;
    const w = due - performance.now();
    if (w > 2) await new Promise((r) => setTimeout(r, w));
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: s16(to24k(x.subarray(i, i + HOP))).toString("base64") }));
  }
  await new Promise((r) => setTimeout(r, 3500)); // late finals
  try { ws.close(); } catch { /* closed */ }
  return ev;
}

async function one(id) {
  const meta = JSON.parse(fs.readFileSync(path.join(BAKE, `${id}.json`), "utf8"));
  const x = readS16(path.join(BAKE, `${id}.${VAR}.s16`));
  const t0 = Date.now();
  if (ARM === "cascade") {
    const ev = await runCascade(x);
    return { id, arm: ARM, variant: VAR, events: ev, ms: Date.now() - t0 };
  }
  const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
  const herX = readS16(path.join(BAKE, `${id}.her.s16`));
  // her playback level per stream frame (the device knows what it played): -inf outside her line
  const nF = Math.floor(x.length / HOP), outDb = new Array(nF).fill(-120);
  const o = Math.round((meta.herAtMs * SR) / 1000);
  for (let f = 0; f < nF; f++) { let s = 0; for (let k = 0; k < HOP; k++) { const j = f * HOP + k - o; const v = j >= 0 && j < herX.length ? herX[j] : 0; s += v * v; } outDb[f] = 10 * Math.log10(s / HOP + 1e-12); }
  const fr = framesOf(x);
  const her = [{ start: meta.gold.herSpan.start, end: meta.gold.herSpan.end, text: meta.herText, outDb, ui: meta.ctx ? { exchange: meta.ctx.exchange, expected: meta.ctx.expected } : {} }];
  const r = await runSession({ id: `bake-${id}-${VAR}`, x, frames: fr, her, stt: { lane: "D4" }, band: "B2", DuplexLive, floorDb: null });
  return { id, arm: ARM, variant: VAR, acts: r.acts, phases: r.phases, logs: r.logs.filter((l) => l[1] === "YIELD" || l[1] === "SPEAK" || l[1] === "HUSH"), stt: r.sttLog.map((s) => ({ t: s.t, type: s.raw.type, item: s.raw.item_id, text: s.raw.transcript ?? s.raw.delta ?? null })), errors: r.errors, ms: Date.now() - t0 };
}

const idx = JSON.parse(fs.readFileSync(path.join(BAKE, "index.json"), "utf8")).filter((r) => !ONLY || ONLY.has(r.id));
const outDir = path.join(BAKE, "runs");
fs.mkdirSync(outDir, { recursive: true });
let done = 0;
await pool(idx.map((r) => async () => {
  const file = path.join(outDir, `${ARM}.${VAR}.${r.id}.json`);
  if (fs.existsSync(file)) { done++; return; }
  try { fs.writeFileSync(file, JSON.stringify(await one(r.id))); } catch (e) { console.warn(r.id, String(e.message).slice(0, 160)); }
  if (++done % 10 === 0) console.log(`${ARM}/${VAR} ${done}/${idx.length}`);
}), CONC);
console.log(`${ARM}/${VAR} done ${done}/${idx.length}`);
