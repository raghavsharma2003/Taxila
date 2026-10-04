// HV-15: the per-voice base <prosody rate> that gives 11-13 spoken chars/s on en-IN DragonHD (HUMAN-VOICE §4.2, B1).
// Renders 10 Hinglish teacher lines (Roman script, as the reply guard writes them, numbers normalised by speakable())
// through the PRODUCTION compiler (compile/dhd.js plainSsml) and client (azureTts.js) at a sweep of rates, measures the
// speech-only duration (edges trimmed at -45 dBFS, 10 ms frames) and reports chars/s per voice × rate, n = 10 lines.
// Run: set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 AZURE_SPEECH_REGION=$AZURE_SPEECH_REGION_SIN \
//      AZURE_SPEECH_KEY=$AZURE_SPEECH_KEY_SIN node evals/tts-pace.mjs [--rates=-15,-20,-25,-30]
// Spend: 2 voices × 4 rates × 10 lines × ~110 chars ≈ 9k HD chars (≈ USD 0.20).
import fs from "node:fs";
import { dhdStream } from "../server/voice/azureTts.js";
import { plainSsml } from "../server/voice/expressive/compile/dhd.js";
import { speakable } from "../server/voice/spoken.js";
import { VOICE_TABLE } from "../server/voice/voices.js";

export const LINES = [
  "Chalo, aaj hum fractions dekhte hain. Ek pizza ko 4 barabar hisson mein kaatte hain.",
  "Achha, toh 27 aur 35 jodne ke liye pehle tens jodo: 20 aur 30, matlab 50.",
  "Bahut badhiya socha! Tumne pehle 30 banaya, phir baaki jod diya.",
  "Yahan thoda rukte hain. Agar 3 tukde kha liye, toh kitne bache?",
  "Paudhe apni jadon se paani peete hain, aur patton se dhoop lete hain.",
  "Dekho, ek rectangle ki lambai 8 centimetre aur chaudai 5 centimetre hai.",
  "Kya tum bata sakte ho ki 7 guna 6 kitna hota hai? Aaram se socho.",
  "Pata hai, suraj ki roshni humein aath minute mein pahunchti hai!",
  "Theek hai, ek baar phir se dekhte hain. Is baar hum chhote steps lenge.",
  "Aaj tumne bahut mehnat ki. Kal hum isi se aage badhenge, theek hai?",
];
const RATES = (process.argv.find((a) => a.startsWith("--rates="))?.slice(8) ?? "-15,-20,-25,-30").split(",").map(Number);
const VOICES = ["asha", "arjun"].map((id) => ({ id, voice: VOICE_TABLE[id].dhd }));

/** Speech-only seconds of PCM s16le 24 kHz (first to last 10 ms frame above -45 dBFS RMS). */
export function speechSeconds(buf) {
  const n = buf.length >> 1, F = 240, th = 32768 * 10 ** (-45 / 20);
  let first = -1, last = -1;
  for (let f = 0; f + F <= n; f += F) {
    let sum = 0;
    for (let i = f; i < f + F; i++) { const v = buf.readInt16LE(i * 2); sum += v * v; }
    if (Math.sqrt(sum / F) >= th) { if (first < 0) first = f; last = f + F; }
  }
  return first < 0 ? 0 : (last - first) / 24000;
}

async function render(ssml) {
  const t0 = performance.now();
  const { chunks } = await dhdStream(ssml, { headerTimeoutMs: 20_000, timeoutMs: 30_000 });
  let ttfb = 0;
  const all = [];
  for await (const c of chunks) { if (!ttfb) ttfb = performance.now() - t0; all.push(Buffer.from(c)); }
  return { pcm: Buffer.concat(all), ttfb };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = [];
  for (const v of VOICES) for (const rate of RATES) {
    const cps = [];
    for (const line of LINES) {
      const spoken = speakable(line, { mode: "hinglish" });
      const { pcm, ttfb } = await render(plainSsml(line, { voice: v.voice, baseRate: rate }, { mode: "hinglish" }));
      const s = speechSeconds(pcm);
      cps.push(spoken.length / s);
      rows.push({ voice: v.id, rate, chars: spoken.length, seconds: +s.toFixed(3), cps: +(spoken.length / s).toFixed(2), ttfbMs: Math.round(ttfb) });
    }
    cps.sort((a, b) => a - b);
    const mean = cps.reduce((a, b) => a + b, 0) / cps.length;
    console.log(`${v.id} rate ${rate}%: mean ${mean.toFixed(2)} chars/s, median ${cps[5].toFixed(2)}, range ${cps[0].toFixed(2)}-${cps.at(-1).toFixed(2)} (n=${cps.length})`);
  }
  fs.writeFileSync(new URL("./out/tts-pace.json", import.meta.url), JSON.stringify({ at: new Date().toISOString(), region: process.env.AZURE_SPEECH_REGION, rows }, null, 1));
}
