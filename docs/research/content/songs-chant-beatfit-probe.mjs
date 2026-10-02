// songs-chant-beatfit-probe.mjs — does Azure Speech hit a beat grid exactly?
// Tests <mstts:audioduration> (total duration of a <voice> element) and per-letter <break> for varnamala.
// At 96 BPM one beat = 625 ms; a table line is given 2 beats (1.25 s) or 4 beats (2.5 s).
// Run: set -a; . /home/user/Taxila/.env.local; set +a; NODE_USE_ENV_PROXY=1 node songs-chant-beatfit-probe.mjs
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.AZURE_OPENAI_API_KEY, REGION = process.env.SPEECH_REGION || "eastus2";
const OUT = "./songs-chant-beatfit-2026-10-02"; mkdirSync(OUT, { recursive: true });
const OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const CASES = [];
for (const [id, text] of [["t2-1", "दो एकम दो"], ["t2-2", "दो दूनी चार"], ["t2-3", "दो तिया छह"], ["t2-7", "दो सत्ते चौदह"], ["t2-10", "दो दहाम बीस"]])
  for (const target of [1.25, 2.5]) CASES.push({ id, target, inner: `<mstts:audioduration value="${target * 1000}ms"/>${text}` });
// varnamala: one letter per beat via breaks (letter audio + break ≈ 625 ms is NOT guaranteed; measured below)
CASES.push({ id: "vm-break", target: null, inner: "क<break time=\"400ms\"/>ख<break time=\"400ms\"/>ग<break time=\"400ms\"/>घ<break time=\"400ms\"/>ङ" });
CASES.push({ id: "vm-comma", target: null, inner: "क, ख, ग, घ, ङ" });
CASES.push({ id: "vm-dur", target: 3.125, inner: "<mstts:audioduration value=\"3125ms\"/>क, ख, ग, घ, ङ" });
const rows = [];
for (const c of CASES) {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="hi-IN"><voice name="hi-IN-SwaraNeural">${c.inner}</voice></speak>`;
  const t0 = performance.now();
  const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-beatfit" }, body: ssml });
  if (!r.ok) { rows.push({ ...c, err: `HTTP ${r.status}` }); continue; }
  const buf = Buffer.from(await r.arrayBuffer()); const ms = Math.round(performance.now() - t0);
  writeFileSync(`${OUT}/${c.id}_${c.target ?? "na"}.wav`, buf);
  const pcm = buf.subarray(44); const n = pcm.length >> 1; const fileS = n / 24000;
  // speech span: first/last 10 ms frame above 5% of peak RMS
  const hop = 240, rms = []; for (let i = 0; i + hop <= n; i += hop) { let s = 0; for (let j = 0; j < hop; j++) { const v = pcm.readInt16LE((i + j) * 2) / 32768; s += v * v; } rms.push(Math.sqrt(s / hop)); }
  const pk = Math.max(...rms), a = rms.findIndex((v) => v > pk * 0.05), b = rms.length - 1 - [...rms].reverse().findIndex((v) => v > pk * 0.05);
  // onsets: rises above 20% of peak after ≥60 ms below 10% (rough syllable-group onset count)
  const onsets = []; let quiet = 6; rms.forEach((v, i) => { if (v < pk * 0.1) quiet++; else { if (v > pk * 0.2 && quiet >= 6) onsets.push(+(i * 0.01).toFixed(2)); quiet = 0; } });
  const fd = new FormData(); fd.append("file", new Blob([buf], { type: "audio/wav" }), "a.wav"); fd.append("language", "hi");
  const tr = await fetch(`${OAI.replace(/\/openai\/v1$/, "")}/openai/deployments/taxila-transcribe/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  const row = { id: c.id, target: c.target, latencyMs: ms, fileS: +fileS.toFixed(3), speechS: +(((b - a) + 1) * 0.01).toFixed(2), leadS: +(a * 0.01).toFixed(2), onsets, asr: tr.ok ? (await tr.json()).text : `HTTP ${tr.status}` };
  rows.push(row); console.log(JSON.stringify(row));
}
writeFileSync("./songs-chant-beatfit-2026-10-02.json", JSON.stringify({ date: "2026-10-02", voice: "hi-IN-SwaraNeural", bpm: 96, rows }, null, 1));
