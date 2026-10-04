// latency.mjs — first-byte latency, STREAMING raw PCM (riff output buffers the whole clip: ttfb≈total, measured
// 2026-10-04), n per arm, expressive markup on vs off. US sandbox -> eastus2: an upper bound for Central India.
import fs from "node:fs";
const KEY = process.env.AZURE_OPENAI_API_KEY, OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const N = +(process.env.N || 20);
const S1 = "अरे! पहली बार में ही? तुमने ऊपर और नीचे दोनों को चार से divide किया।";
const sp = (loc, v, inner) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${loc}"><voice name="${v}">${inner}</voice></speak>`;
const lt = (s) => s.replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।.\-]*[ऀ-ॿ।!?]?/g, (m) => { const c = m.replace(/\s+$/, ""); return `<lang xml:lang="hi-IN">${c}</lang>` + m.slice(c.length); });
const ARMS = {
  "dhd-diya-plain": () => az(sp("en-IN", "en-IN-Diya:DragonHDLatestNeural", lt(S1))),
  "dhd-diya-expr": () => az(sp("en-IN", "en-IN-Diya:DragonHDLatestNeural", `[surprised] ${lt("अरे! पहली बार में ही?")} <break time="350ms"/> [excited] ${lt("तुमने ऊपर और नीचे दोनों को चार से divide किया।")}`)),
  "omni-diya-plain": () => az(sp("hi-IN", "hi-IN-Diya:DragonHDOmniLatestNeural", S1)),
  "omni-diya-expr": () => az(sp("hi-IN", "hi-IN-Diya:DragonHDOmniLatestNeural", `[laughter] [surprised] अरे! पहली बार में ही? [excited] तुमने ऊपर और नीचे दोनों को चार से divide किया।`)),
  "mai-priyaF-expr": () => az(sp("hi-IN", "hi-IN-Priya:MAI-Voice-2.1-Flash", `<mstts:express-as style="surprised">अरे! पहली बार में ही?</mstts:express-as><break time="350ms"/><mstts:express-as style="joyful">तुमने ऊपर और नीचे दोनों को चार से divide किया।</mstts:express-as>`)),
  "4omtts-marin-expr": () => tts(S1, "marin", "Accent: native Indian. Feeling: surprised then delighted. Pace: conversational."),
};
async function first(url, opts) {
  const t0 = performance.now(); const r = await fetch(url, opts); if (!r.ok) return { err: r.status };
  const rd = r.body.getReader(); let ttfb = null, bytes = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; if (ttfb === null && value.length) ttfb = performance.now() - t0; bytes += value.length; }
  return { ttfb: Math.round(ttfb), total: Math.round(performance.now() - t0), audio_s: +(bytes / 48000).toFixed(2) };
}
const az = (ssml) => first(`https://eastus2.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm", "User-Agent": "taxila" }, body: ssml });
const tts = (input, voice, instructions) => first(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify({ model: "gpt-4o-mini-tts", voice, input, instructions, response_format: "pcm", stream_format: "audio" }) });
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const out = {};
for (let i = 0; i < N; i++) for (const [k, f] of Object.entries(ARMS)) { const r = await f(); (out[k] ??= []).push(r); await new Promise((s) => setTimeout(s, 300)); }
const sum = {};
for (const [k, rs] of Object.entries(out)) { const ok = rs.filter((r) => !r.err); const t = ok.map((r) => r.ttfb);
  sum[k] = { n: ok.length, errors: rs.length - ok.length, ttfb_p50: q(t, 0.5), ttfb_p90: q(t, 0.9), ttfb_max: Math.max(...t), total_p50: q(ok.map((r) => r.total), 0.5), audio_s_p50: q(ok.map((r) => r.audio_s), 0.5) };
  console.log(k, JSON.stringify(sum[k])); }
fs.writeFileSync("latency.json", JSON.stringify({ when: new Date().toISOString(), from: "US sandbox -> eastus2", summary: sum, raw: out }, null, 1));
