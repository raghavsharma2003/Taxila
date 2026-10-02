// tts-segment-probe.mjs — per-sentence TTS for narration-synced animation (2026-10-02).
// Q: if each narration segment is synthesised separately (no word timestamps needed), what is latency per
// segment and how stable is the speaking rate (chars/s) — i.e. can a planner pre-allocate segment seconds?
// Usage: node --env-file=.env.local docs/research/factory/tts-segment-probe.mjs
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const MODEL = process.env.DEPLOY_TTS || "gpt-4o-mini-tts";
const OUT = "/tmp/tts-seg"; fs.mkdirSync(OUT, { recursive: true });
const SEG = [
  "Dekho, yeh roti hai. Ek poori roti.",
  "Ab hum isse chaar barabar hisson mein kaatenge.",
  "Teen hisson ko rang do. Teen bata chaar, yaani three-quarters.",
  "Upar wala number batata hai kitne hisse rang kiye.",
  "Neeche wala number batata hai kul kitne barabar hisse hain.",
  "Yaad rakho, hisse barabar hone chahiye, warna yeh fraction nahi.",
];
const rows = [];
for (const [i, text] of SEG.entries()) {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/audio/speech`, { method: "POST", headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice: "coral", input: text, response_format: "wav", instructions: "Warm Indian primary-school teacher speaking Hinglish, calm and clear, natural pace." }) });
  const ms = Date.now() - t0;
  if (!r.ok) { rows.push({ i, http: r.status, err: (await r.text()).slice(0, 200) }); continue; }
  const f = path.join(OUT, `s${i}.wav`); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
  rows.push({ i, chars: text.length, ms, audio_s: +dur.toFixed(2), chars_per_s: +(text.length / dur).toFixed(1) });
}
const cps = rows.filter((r) => r.chars_per_s).map((r) => r.chars_per_s);
const mean = cps.reduce((a, b) => a + b, 0) / cps.length; const sd = Math.sqrt(cps.reduce((a, b) => a + (b - mean) ** 2, 0) / cps.length);
const res = { date: "2026-10-02", model: MODEL, voice: "coral", rows, cps_mean: +mean.toFixed(1), cps_sd: +sd.toFixed(1) };
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "tts-segment-probe-2026-10-02.json"), JSON.stringify(res, null, 2));
