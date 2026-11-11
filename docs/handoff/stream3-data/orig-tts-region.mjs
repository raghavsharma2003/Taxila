// Round 2, stream latency: Diya (en-IN-Diya:DragonHDLatestNeural) first audio byte over the production websocket client
// (server/voice/azureTtsWs.js dhdStreamWs, visemes on, the part-0 shape) from THIS host, per Speech region, warm socket,
// alternating regions per line so drift hits both arms equally. Answers: is the speech resource's region a first-sound
// lever for a server in eastus2 (prod) — and what does a cold socket cost.
//
//   ./envrun.sh node evals/latency/tts-region.mjs [--n 12] [--regions sin,eastus2] [--out file.json]
//
// Regions: "sin" = AZURE_SPEECH_REGION_SIN / _KEY_SIN (the resource prod's eastus2 app uses today: deploy-azure.mjs);
// "eastus2" = the eastus2 AIServices account (AZURE_OPENAI_ENDPOINT's key) if it serves Speech. Keys are never printed.
// Labelled: from the sandbox (US, through the agent proxy), NOT from the eastus2 container or India.
import fs from "fs";

const ROOT = new URL("../..", import.meta.url).pathname;
for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", 12));
const OUT = arg("--out");
const REGIONS = arg("--regions", "sin,eastus2").split(",");
const envFor = (r) => (r === "sin" ? { AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION_SIN, AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY_SIN }
  : r === "eastus2" ? { AZURE_SPEECH_REGION: "eastus2", AZURE_SPEECH_KEY: process.env.AZURE_OPENAI_API_KEY }
    : { AZURE_SPEECH_REGION: r, AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY });
const { dhdStreamWs } = await import("../../server/voice/azureTtsWs.js");
const LINES = ["Bilkul sahi, Aarav! Cube ke chhe faces hote hain.", "Achha, ek baar phir dekho: edge woh line hai jahan do faces milte hain.", "Baarah edges, haan.",
  "Koi baat nahi, chalo saath mein ginte hain.", "Ab batao, ek dice ke kitne corners hote hain?", "Hmm, sochne do."];
const ssml = (t) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="en-IN-Diya:DragonHDLatestNeural">${t}</voice></speak>`;
const lead = [], audible = [];
const res = Object.fromEntries(REGIONS.map((r) => [r, { cold: null, warm: [], errors: [] }]));
async function once(r, text) {
  const env = { ...process.env, ...envFor(r) };
  const t0 = performance.now();
  const out = await dhdStreamWs(ssml(text), { env, headerTimeoutMs: 6000 });
  const first = Math.round(performance.now() - t0);
  // the first AUDIBLE sample (> -40 dBFS): the engine's leading silence is trimmed before it is sent (routes/voice.js edgeTrim)
  let audibleAt = null, bytes = 0;
  for await (const c of out.chunks) {
    if (audibleAt === null) {
      for (let i = 0; i + 1 < c.length; i += 2) if (Math.abs(c.readInt16LE(i)) > 328) { audibleAt = Math.round(performance.now() - t0); lead.push(Math.round(((bytes + i) / 2 / 24000) * 1000)); break; }
    }
    bytes += c.length;
  }
  audible.push(audibleAt);
  return first;
}
for (const r of REGIONS) {
  try { res[r].cold = await once(r, LINES[0]); } catch (e) { res[r].errors.push(String(e.message).slice(0, 120)); }
}
for (let i = 0; i < N; i++) {
  for (const r of (i % 2 ? [...REGIONS].reverse() : REGIONS)) {
    if (res[r].errors.length > 2) continue;
    try { res[r].warm.push(await once(r, LINES[i % LINES.length])); } catch (e) { res[r].errors.push(String(e.message).slice(0, 120)); }
  }
}
const q = (v, p) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))] : null; };
const summary = Object.fromEntries(Object.entries(res).map(([r, x]) => [r, { coldFirstByteMs: x.cold, n: x.warm.length, p50: q(x.warm, 0.5), p90: q(x.warm, 0.9), min: q(x.warm, 0), max: q(x.warm, 1), errors: x.errors }]));
summary.leadingSilenceMs = { p50: q(lead, 0.5), p90: q(lead, 0.9), n: lead.length };
console.log(JSON.stringify(summary, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ method: { date: new Date().toISOString(), from: "sandbox (US) via agent proxy", voice: "en-IN-Diya:DragonHDLatestNeural", visemes: true, n: N }, summary, raw: res }, null, 1));
process.exit(0);
