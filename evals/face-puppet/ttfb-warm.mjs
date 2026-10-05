// First-audio latency: REST (production today, keep-alive fetch) vs ONE warm websocket reused across syntheses (the
// patch-01 design), alternating on the same 8 battery lines.  node --env-file=.env.local evals/face-puppet/ttfb-warm.mjs
import fs from "node:fs";
import os from "node:os";
import { AzureTtsSocket } from "./azure-ws.mjs";
import { plainSsml } from "../../server/voice/expressive/compile/dhd.js";
import { LINES } from "./lines.mjs";
const region = process.env.AZURE_SPEECH_REGION || process.env.AZURE_SPEECH_REGION_SIN, key = process.env.AZURE_SPEECH_KEY || process.env.AZURE_SPEECH_KEY_SIN;
const V = { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 };
const ws = new AzureTtsSocket({ region, key });
const t0 = performance.now(); await ws.open(); const openMs = performance.now() - t0;
// warm both paths once
await ws.synth(plainSsml("Namaste.", V));
{ const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm" }, body: plainSsml("Namaste.", V) }); await r.arrayBuffer(); }
const rest = [], wsm = [], wsNo = [], wsVis = [], wsWord = [], vis = [];
let chars = 0;
for (let i = 1; i <= 8; i++) {
  const ssml = plainSsml(LINES[i], V); chars += 2 * LINES[i].length;
  const a = performance.now();
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm" }, body: ssml });
  const rd = res.body.getReader(); await rd.read(); rest.push(performance.now() - a); while (!(await rd.read()).done);
  const r = await ws.synth(ssml); wsm.push(r.ttfbMs); vis.push(r.visemes.length);
  const r2 = await ws.synth(ssml, { meta: false }); wsNo.push(r2.ttfbMs); chars += LINES[i].length;
  const r3 = await ws.synth(ssml, { meta: "vis" }); wsVis.push(r3.ttfbMs); chars += LINES[i].length;
  const r4 = await ws.synth(ssml, { meta: "word" }); wsWord.push(r4.ttfbMs); chars += LINES[i].length;
}
ws.close();
const med = (x) => [...x].sort((p, q) => p - q)[x.length >> 1];
const out = { date: new Date().toISOString().slice(0, 10), region, loadavg1m: os.loadavg()[0], n: 8, wsOpenMs: Math.round(openMs), restMs: rest.map(Math.round), warmWsMs: wsm.map(Math.round), restMedian: Math.round(med(rest)), warmWsMedian: Math.round(med(wsm)), warmWsNoMetaMs: wsNo.map(Math.round), warmWsNoMetaMedian: Math.round(med(wsNo)), visemeOnlyMs: wsVis.map(Math.round), visemeOnlyMedian: Math.round(med(wsVis)), wordOnlyMs: wsWord.map(Math.round), wordOnlyMedian: Math.round(med(wsWord)), visemesPerLine: vis, chars, note: "eval container via the agent proxy (not the India lane): compare the two columns, not the absolute values" };
fs.writeFileSync("evals/face-puppet/out/ttfb-warm.json", JSON.stringify(out, null, 1));
console.log(out);
