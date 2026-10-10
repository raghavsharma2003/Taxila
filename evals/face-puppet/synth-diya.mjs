// Synthesise the V4 battery with Diya (en-IN-Diya:DragonHDLatestNeural, base rate -35%, the production SSML from
// server/voice/expressive/compile/dhd.js plainSsml) over the Azure websocket, keeping her viseme + word-boundary events.
//   node --env-file=.env.local evals/face-puppet/synth-diya.mjs [--force] [--rate N] [--out <dir under out/>]
//   (--rate 0 --out diya-r0: the production rate since the owner's 2026-10-05 ear check; the committed set is -35)
// Writes evals/face-puppet/out/diya/NN.pcm (s16le 24 kHz mono) and NN.json ({text, ssml, visemes, words, ttfbMs, ms}).
// Also times 5 REST vs 5 websocket first-byte latencies on the same line (the server patch must not cost first sound).
import fs from "node:fs";
import { synthWs } from "./azure-ws.mjs";
import { plainSsml } from "../../server/voice/expressive/compile/dhd.js";
import { LINES } from "./lines.mjs";

const region = process.env.AZURE_SPEECH_REGION || process.env.AZURE_SPEECH_REGION_SIN;
const key = process.env.AZURE_SPEECH_KEY || process.env.AZURE_SPEECH_KEY_SIN;
if (!region || !key) throw new Error("no Azure Speech config");
const argOf = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const OUT = new URL(`./out/${argOf("--out", "diya")}/`, import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const V = { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: Number(argOf("--rate", -35)) };
const force = process.argv.includes("--force");
let chars = 0;
for (let i = 0; i < LINES.length; i++) {
  const id = String(i).padStart(2, "0");
  if (!force && fs.existsSync(`${OUT}${id}.json`)) continue;
  const ssml = plainSsml(LINES[i], V);
  const r = await synthWs(ssml, { region, key });
  chars += LINES[i].length;
  fs.writeFileSync(`${OUT}${id}.pcm`, r.pcm);
  fs.writeFileSync(`${OUT}${id}.json`, JSON.stringify({ text: LINES[i], voice: V.voice, rate: V.baseRate, ssml, visemes: r.visemes, words: r.words, ttfbMs: Math.round(r.ttfbMs), ms: r.pcm.length / 48 }, null, 1));
  console.log(id, `${(r.pcm.length / 48 / 1000).toFixed(2)} s`, `${r.visemes.length} visemes`, `${r.words.length} words`, `ttfb ${r.ttfbMs.toFixed(0)} ms`);
}
// first-byte comparison, same line, alternating (REST = what production uses today)
if (process.argv.includes("--ttfb")) {
  const ssml = plainSsml(LINES[0], V);
  const rest = [], ws = [];
  for (let k = 0; k < 5; k++) {
    const t0 = performance.now();
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm", "User-Agent": "taxila-eval" }, body: ssml });
    const rd = res.body.getReader();
    await rd.read();
    rest.push(performance.now() - t0);
    await rd.cancel();
    const r = await synthWs(ssml, { region, key });
    ws.push(r.ttfbMs);
    chars += 2 * LINES[0].length;
  }
  const med = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];
  const res = { date: new Date().toISOString().slice(0, 10), region, n: 5, restMs: rest.map(Math.round), wsMs: ws.map(Math.round), restMedian: Math.round(med(rest)), wsMedian: Math.round(med(ws)), note: "from the eval container through the agent proxy; each ws call opens a NEW TLS+ws connection (worst case: production would keep one warm socket per region)" };
  fs.writeFileSync(new URL("./out/ttfb.json", import.meta.url), JSON.stringify(res, null, 1));
  console.log(res);
}
console.log("chars synthesised", chars);
