// Speech scout 2026-10-04: DragonHD Diya first byte, same container/session as polly.py ttfb, so the two are comparable.
// Same sentence + SSML as voice-probe/latency.mjs (dhd-diya-plain), streamed raw PCM. Floor = issueToken round trip.
// Regions: eastus2 (AOAI key, as latency.mjs) and southindia (AZURE_SPEECH_KEY_SIN) if DragonHD is served there.
import "./env.mjs";
import fs from "node:fs";
const N = +(process.env.N || 20);
const S1 = "अरे! पहली बार में ही? तुमने ऊपर और नीचे दोनों को चार से divide किया।";
const lt = (s) => s.replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।.\-]*[ऀ-ॿ।!?]?/g, (m) => { const c = m.replace(/\s+$/, ""); return `<lang xml:lang="hi-IN">${c}</lang>` + m.slice(c.length); });
const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="en-IN-Diya:DragonHDLatestNeural">${lt(S1)}</voice></speak>`;
const REG = { eastus2: process.env.AZURE_OPENAI_API_KEY, [process.env.AZURE_SPEECH_REGION_SIN || "southindia"]: process.env.AZURE_SPEECH_KEY_SIN };
async function first(reg, key) {
  const t0 = performance.now();
  const r = await fetch(`https://${reg}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm", "User-Agent": "taxila" }, body: ssml });
  if (!r.ok) return { err: r.status, body: (await r.text()).slice(0, 120) };
  const rd = r.body.getReader(); let ttfb = null, bytes = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; if (ttfb === null && value.length) ttfb = performance.now() - t0; bytes += value.length; }
  return { ttfb: Math.round(ttfb), total: Math.round(performance.now() - t0), audio_s: +(bytes / 48000).toFixed(2) };
}
async function floor(reg, key) { const t0 = performance.now(); const r = await fetch(`https://${reg}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "Content-Length": "0" } }); await r.text(); return Math.round(performance.now() - t0); }
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const out = {}, fl = {};
for (const [reg, key] of Object.entries(REG)) { const w = await first(reg, key); console.log("warm", reg, JSON.stringify(w)); if (w.err) { out[reg] = [w]; continue; } await floor(reg, key);
  for (let i = 0; i < N; i++) { (out[reg] ??= []).push(await first(reg, key)); (fl[reg] ??= []).push(await floor(reg, key)); await new Promise((s) => setTimeout(s, 300)); } }
const sum = {};
for (const [k, rs] of Object.entries(out)) { const ok = rs.filter((r) => !r.err); if (!ok.length) { sum[k] = { err: rs[0] }; continue; } const t = ok.map((r) => r.ttfb);
  sum[k] = { n: ok.length, errors: rs.length - ok.length, ttfb_p50: q(t, 0.5), ttfb_p90: q(t, 0.9), ttfb_max: Math.max(...t), total_p50: q(ok.map((r) => r.total), 0.5), floor_p50: fl[k] ? q(fl[k], 0.5) : null, floor_p90: fl[k] ? q(fl[k], 0.9) : null }; console.log(k, JSON.stringify(sum[k])); }
fs.writeFileSync("results/dhd-ttfb.json", JSON.stringify({ date: "2026-10-04", from: "US cloud container (agent proxy)", sentence: S1, summary: sum, raw: out, floor: fl }, null, 1));
