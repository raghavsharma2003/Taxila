// r4-latency: DragonHD first audio byte by speech region, warm websocket (one warmed socket per region, alternating), FROM
// THIS HOST. Labels: the host is a US cloud container, so every region here is far; production speaks from an India
// container to centralindia. n lines × regions, interleaved. Never prints a key.
//   node --env-file=.env.local evals/latency/dhd-ttfb-region.mjs [--n 8]
import { dhdStreamWs, prewarmDhdWs } from "../../server/voice/azureTtsWs.js";
const n = Number(process.argv[process.argv.indexOf("--n") + 1] || 8);
const E = process.env;
const regions = [
  ["sin", { AZURE_SPEECH_REGION: E.AZURE_SPEECH_REGION_SIN, AZURE_SPEECH_KEY: E.AZURE_SPEECH_KEY_SIN }],
  ["centralindia", { AZURE_SPEECH_REGION: E.AZURE_AI_CENTRALINDIA_REGION, AZURE_SPEECH_KEY: E.AZURE_AI_CENTRALINDIA_KEY }],
].filter(([, env]) => env.AZURE_SPEECH_REGION && env.AZURE_SPEECH_KEY);
const LINES = ["Bilkul sahi, cube ke chhe faces hote hain.", "Achha, ek baar phir se gin ke dekho.", "Do faces jahan milte hain, use edge kehte hain.",
  "Shabash, ab batao, corner kitne hain?", "Koi baat nahi, hum saath mein dekhte hain.", "Dabbe ki flat side ko face kehte hain."];
const ssml = (t) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN"><voice name="en-IN-Diya:DragonHDLatestNeural">${t}</voice></speak>`;
const out = Object.fromEntries(regions.map(([r]) => [r, []]));
for (const [, env] of regions) await prewarmDhdWs(env);
for (let i = 0; i < n; i++) {
  for (const [r, env] of regions) {
    const t0 = performance.now();
    try {
      const s = await dhdStreamWs(ssml(LINES[i % LINES.length]), { env });
      out[r].push(Math.round(performance.now() - t0));
      for await (const _ of s.chunks) { /* drain */ }
    } catch (e) { console.log(r, "error", String(e?.message ?? e).slice(0, 80)); }
  }
}
const q = (v, p) => { const s = [...v].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
for (const [r, v] of Object.entries(out)) console.log(`${r.padEnd(14)} n=${v.length} p50 ${q(v, 0.5)} p90 ${q(v, 0.9)} min ${Math.min(...v)} max ${Math.max(...v)}  (warm ws, first audio byte, from a US container)`);
process.exit(0);
