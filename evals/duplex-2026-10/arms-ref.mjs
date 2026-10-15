// duplex bake-off 2026-10, arm (e) voicelive-ref: Azure Voice Live as the FRONT END of OUR cascade, never the speaker.
// Live-Reference AEC (api 2026-07-15): the client sends interleaved stereo PCM16, channel 0 = the mic, channel 1 = what the
// phone ACTUALLY played (here: OUR DragonHD line, assemble.mjs `<id>.her.s16` at her stream position). Voice Live does the
// echo cancellation, deep noise suppression, azure_semantic_vad_multilingual (Hindi listed) and hi-IN / en-IN transcription.
// create_response false: Voice Live never answers. Our Director writes, our TTS speaks, our safety predicate gates every
// word before it is heard. A speech_started is the barge-in signal our link would act on; a commit is the end of turn.
// Open loop on the assembled audio (like arms-ours.mjs): mic = `<id>.phone.s16` (raw speaker echo, no device AEC) or
// `<id>.clean.s16`. Real time.
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/duplex-2026-10/arms-ref.mjs --bake <dir> --variant phone [--model gpt-4.1-mini] [--conc 4] [--keep-fillers] [--only id,..] [--asr-model azure-speech|gpt-4o-transcribe|...] [--asr-lang hi-IN,en-IN|hi-IN|none] [--region centralindia|southindia]
import fs from "node:fs";
import path from "node:path";
import { pool, loadEnv } from "../duplex-real/lib.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), VAR = arg("--variant", "phone"), CONC = Number(arg("--conc", 4)), MODEL = arg("--model", "gpt-4.1-mini");
const ONLY = arg("--only") ? new Set(arg("--only").split(",")) : null;
const FILLER = !process.argv.includes("--keep-fillers"); // --keep-fillers: remove_filler_words false (does it drop a lone "हाँ"?)
const VADX = arg("--vad") ? JSON.parse(arg("--vad")) : null; // extra turn_detection keys, e.g. '{"threshold":0.3}'
const ARM = arg("--arm-name", FILLER ? "voicelive-ref" : "voicelive-ref-kf");
loadEnv();
const SR = 16000, HOP = 320;
const readS16 = (f) => { const b = fs.readFileSync(f); const x = new Int16Array(b.length / 2); for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2); return x; };

async function one(id) {
  const meta = JSON.parse(fs.readFileSync(path.join(BAKE, `${id}.json`), "utf8"));
  const mic = readS16(path.join(BAKE, `${id}.${VAR}.s16`));
  const her = readS16(path.join(BAKE, `${id}.her.s16`));
  const herOff = Math.round((meta.herAtMs * SR) / 1000);
  // round 5: --region southindia (MAI-Transcribe-2-Streaming is offered in Voice Live there, not in centralindia)
  const R = arg("--region", "centralindia").toUpperCase();
  const host = new URL(process.env[`AZURE_AI_${R}_ENDPOINT`]).host;
  const ws = new WebSocket(`wss://${host}/voice-live/realtime?api-version=2026-07-15&model=${encodeURIComponent(MODEL)}`, { headers: { "api-key": process.env[`AZURE_AI_${R}_KEY`] } });
  const ev = [];
  let t0 = 0;
  await new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error("open timeout")), 25000);
    ws.onerror = () => { clearTimeout(to); reject(new Error("socket error")); };
    ws.onclose = (e) => { clearTimeout(to); reject(new Error(`closed ${e.code} ${String(e.reason).slice(0, 160)}`)); };
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === "session.created") ws.send(JSON.stringify({ type: "session.update", session: {
        modalities: ["text", "audio"], instructions: "Listen only.", voice: { type: "azure-standard", name: "hi-in-diya:DragonHDOmniIndicNeural" }, // server AEC needs the audio modality; create_response false keeps it silent
        input_audio_format: "pcm16", input_audio_sampling_rate: 16000,
        input_audio_echo_cancellation: { type: "server_echo_cancellation", reference_source: "client", channels: 2 },
        input_audio_noise_reduction: { type: "azure_deep_noise_suppression" },
        input_audio_transcription: { model: arg("--asr-model", "azure-speech"), ...(arg("--asr-lang", "hi-IN,en-IN") === "none" ? {} : { language: arg("--asr-lang", "hi-IN,en-IN") }) },
        turn_detection: { type: "azure_semantic_vad_multilingual", silence_duration_ms: 500, create_response: false, interrupt_response: false, remove_filler_words: FILLER, languages: ["hi", "en"], ...VADX },
      } }));
      else if (e.type === "session.updated") { clearTimeout(to); resolve(); }
      else if (e.type === "error") { clearTimeout(to); reject(new Error(String(e.error?.message ?? "error").slice(0, 240))); }
    };
  });
  ws.onclose = () => {};
  ws.onmessage = (m) => {
    const e = JSON.parse(m.data);
    if (/delta$/.test(e.type)) return;
    ev.push({ t: Math.round(performance.now() - t0), type: e.type, text: e.transcript ?? null, a0: e.audio_start_ms ?? null, a1: e.audio_end_ms ?? null, err: e.type === "error" ? String(e.error?.message ?? "").slice(0, 160) : undefined });
  };
  t0 = performance.now();
  const total = mic.length + Math.round(1.5 * SR);
  for (let i = 0; i < total; i += HOP) {
    const due = t0 + (i / SR) * 1000;
    const w = due - performance.now();
    if (w > 2) await new Promise((r) => setTimeout(r, w));
    const b = Buffer.alloc(HOP * 4);
    for (let k = 0; k < HOP; k++) {
      const j = i + k;
      b.writeInt16LE(j < mic.length ? mic[j] : 0, k * 4);
      const h = j - herOff;
      b.writeInt16LE(h >= 0 && h < her.length ? her[h] : 0, k * 4 + 2);
    }
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: b.toString("base64") }));
  }
  await new Promise((r) => setTimeout(r, 3000));
  try { ws.close(); } catch { /* closed */ }
  return { id, arm: ARM, variant: VAR, model: MODEL, events: ev };
}

const idx = JSON.parse(fs.readFileSync(path.join(BAKE, "index.json"), "utf8")).filter((r) => !ONLY || ONLY.has(r.id));
const outDir = path.join(BAKE, "runs");
fs.mkdirSync(outDir, { recursive: true });
let done = 0, failed = 0;
await pool(idx.map((r) => async () => {
  const file = path.join(outDir, `${ARM}.${VAR}.${r.id}.json`);
  if (fs.existsSync(file)) { done++; return; }
  for (let attempt = 0; attempt < 3; attempt++) {
    try { fs.writeFileSync(file, JSON.stringify(await one(r.id))); break; } catch (e) { console.warn(r.id, attempt, String(e.message).slice(0, 240)); if (attempt === 2) failed++; await new Promise((q) => setTimeout(q, 4000 * (attempt + 1))); }
  }
  if (++done % 10 === 0) console.log(`${ARM}/${VAR} ${done}/${idx.length}`);
}), CONC);
console.log(`${ARM}/${VAR} done ${done}/${idx.length}, failed ${failed}`);
