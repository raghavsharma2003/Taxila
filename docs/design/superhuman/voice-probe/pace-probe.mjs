// pace-probe.mjs — does en-IN DragonHD honour <prosody rate>, the [slow]/[fast] style markers, or only <break>?
// (Learn's HD SSML table says <prosody> is unsupported on DragonHD; voice-choice-v2 assumed a slowed rate.)
// Measures speech-only duration (edge silence trimmed by ffmpeg) for one Hinglish line, n=3 per condition.
// Run: set -a; . .env.local; set +a; cd docs/design/superhuman/voice-probe; NODE_USE_ENV_PROXY=1 node pace-probe.mjs
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const KEY = process.env.AZURE_OPENAI_API_KEY, REGION = process.env.SPEECH_REGION || "eastus2";
const LINE = "अच्छा, यहाँ थोड़ा रुकते हैं। तीन बटा चार में हम चार में से तीन हिस्से लेते हैं, यानी लगभग पूरा pizza।";
const lt = (s) => s.replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।.\-]*[ऀ-ॿ।!?]?/g, (m) => { const c = m.replace(/\s+$/, ""); return `<lang xml:lang="hi-IN">${c}</lang>` + m.slice(c.length); });
const sp = (v, inner) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="${v}">${inner}</voice></speak>`;
const COND = {
  plain: (t) => lt(t),
  "prosody-20": (t) => `<prosody rate="-20%">${lt(t)}</prosody>`,
  "prosody+20": (t) => `<prosody rate="+20%">${lt(t)}</prosody>`,
  "marker-slow": (t) => `[slow] ${lt(t)}`,
  "marker-fast": (t) => `[fast] ${lt(t)}`,
  "marker-calm": (t) => `[calm] ${lt(t)}`,
};
fs.mkdirSync("pace", { recursive: true });
const out = {};
for (const voice of ["en-IN-Diya:DragonHDLatestNeural", "en-IN-Arjun:DragonHDLatestNeural"]) for (const [c, f] of Object.entries(COND)) for (let i = 0; i < 3; i++) {
  const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-pace-probe" }, body: sp(voice, f(LINE)) });
  const k = `${voice.split(":")[0]}|${c}`; out[k] ??= [];
  if (!r.ok) { out[k].push({ err: r.status }); console.log(k, i, "HTTP", r.status); continue; }
  const file = `pace/${voice.split(":")[0]}-${c}-${i}.wav`; fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  const trimmed = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-f", "s16le", "-"], { maxBuffer: 64 << 20 });
  const dur = +(trimmed.length / 48000).toFixed(2); out[k].push({ dur }); console.log(k, i, dur);
}
const summary = Object.fromEntries(Object.entries(out).map(([k, a]) => { const d = a.filter((x) => x.dur).map((x) => x.dur); return [k, { n: d.length, mean: +(d.reduce((s, x) => s + x, 0) / (d.length || 1)).toFixed(2), min: Math.min(...d), max: Math.max(...d), errors: a.length - d.length }]; }));
fs.writeFileSync("pace-results.json", JSON.stringify({ when: new Date().toISOString(), line: LINE, summary, raw: out }, null, 1));
console.table(summary);
