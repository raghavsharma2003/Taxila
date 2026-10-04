// Smoke test: one minimal call per candidate. Records status, latency, served model, usage, short output. Never prints keys.
// Run: NODE_USE_ENV_PROXY=1 node --env-file=../../../.env.local smoke.mjs [regex]
import { readFileSync, writeFileSync } from "node:fs";
const E = process.env; const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const BASE = (E.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "").replace(/\/openai\/v1$/, ""); const KEY = E.AZURE_OPENAI_API_KEY;
const CI = E.AZURE_AI_CENTRALINDIA_ENDPOINT.replace(/\/+$/, ""), CIK = E.AZURE_AI_CENTRALINDIA_KEY;
const SI = E.AZURE_AI_SOUTHINDIA_ENDPOINT.replace(/\/+$/, ""), SIK = E.AZURE_AI_SOUTHINDIA_KEY;
const WAV = readFileSync("results/smoke/d01.wav"), PCM24 = readFileSync("results/smoke/d01.pcm");
const results = []; const t0 = () => performance.now();
async function rec(name, fn) {
  if (only && !only.test(name)) return; const t = t0();
  try { const r = await fn(); results.push({ name, ms: Math.round(t0() - t), ...r }); }
  catch (e) { results.push({ name, ms: Math.round(t0() - t), ok: false, err: String(e?.message || e).slice(0, 300) }); }
  const x = results.at(-1); console.log(name.padEnd(34), x.ok ? "OK " : "ERR", String(x.ms).padStart(6) + "ms", (x.out || x.err || "").toString().replace(/\s+/g, " ").slice(0, 140));
}
const PROMPT = [{ role: "system", content: "You are a warm Hinglish teacher for a 9-year-old. Reply in at most 15 words." }, { role: "user", content: "Didi, 3/4 bada hai ya 2/3?" }];
async function chat(dep, extra = {}) {
  const r = await fetch(`${BASE}/openai/v1/chat/completions`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: dep, messages: PROMPT, max_completion_tokens: 400, ...extra }) });
  const j = await r.json(); if (!r.ok) return { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 300) };
  return { ok: true, http: r.status, served: j.model, usage: j.usage, finish: j.choices?.[0]?.finish_reason, out: j.choices?.[0]?.message?.content };
}
for (const d of ["taxila-gpt6-luna", "taxila-gpt6"]) await rec(d, () => chat(d, { reasoning_effort: "none" }));
for (const d of ["taxila-gpt61-sol", "taxila-gpt6-astra"]) await rec(d, () => chat(d, { reasoning_effort: "low" }));
for (const d of ["taxila-ds41", "taxila-ds4f-0731", "taxila-mistral-m35", "taxila-grok46"]) await rec(d, () => chat(d));
for (const d of ["taxila-kimi26", "taxila-kimi-code"]) await rec(d, () => chat(d, { max_completion_tokens: 3000 }));
async function emb(dep, extra = {}) {
  const r = await fetch(`${BASE}/openai/v1/embeddings`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify({ model: dep, input: ["teen bata chaar", "three quarters"], ...extra }) });
  const j = await r.json(); if (!r.ok) return { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 300) };
  const [a, b] = j.data.map((x) => x.embedding); const cos = a.reduce((s, v, i) => s + v * b[i], 0) / Math.hypot(...a) / Math.hypot(...b);
  return { ok: true, http: r.status, served: j.model, usage: j.usage, out: `dim=${a.length} cos=${cos.toFixed(3)}` };
}
await rec("taxila-embed-3l", () => emb("taxila-embed-3l"));
await rec("taxila-cohere-embed4", () => emb("taxila-cohere-embed4"));
await rec("measure-cohere-embed5-pro", async () => { const a = await emb("measure-cohere-embed5-pro"); if (a.ok) return a;
  const r = await fetch(`${BASE.replace(".openai.azure.com", ".services.ai.azure.com")}/models/embeddings?api-version=2024-05-01-preview`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify({ model: "measure-cohere-embed5-pro", input: ["teen bata chaar", "three quarters"] }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) return { ok: false, http: r.status, err: "v1: " + a.err.slice(0, 120) + " | models: " + JSON.stringify(j).slice(0, 200) };
  const [x, y] = j.data.map((d) => d.embedding); const cos = x.reduce((s, v, i) => s + v * y[i], 0) / Math.hypot(...x) / Math.hypot(...y); return { ok: true, http: r.status, usage: j.usage, out: `models route dim=${x.length} cos=${cos.toFixed(3)}` }; });
async function img(base, key, dep, extra = {}) {
  const r = await fetch(`${base}/openai/v1/images/generations`, { method: "POST", headers: { "api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ model: dep, prompt: "A simple flat illustration of a pizza cut into 4 equal slices, 3 slices shaded orange, white background, no text", n: 1, size: "1024x1024", ...extra }) });
  const j = await r.json(); if (!r.ok) return { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 300) };
  const b64 = j.data?.[0]?.b64_json; if (b64) writeFileSync(`results/smoke/${dep}.png`, Buffer.from(b64, "base64"));
  return { ok: !!b64, http: r.status, usage: j.usage, out: b64 ? `png ${Math.round(b64.length * 0.75 / 1024)} KB` : JSON.stringify(j).slice(0, 200) };
}
await rec("taxila-image25-flare", () => img(BASE, KEY, "taxila-image25-flare", { quality: "low" }));
await rec("taxila-image25-sunburst", () => img(BASE, KEY, "taxila-image25-sunburst", { quality: "low" }));
await rec("taxila-mai-image26", async () => {
  let r = await img(SI, SIK, "taxila-mai-image26"); if (r.ok) return r;
  const res = await fetch(`${SI}/mai/v1/images/generations`, { method: "POST", headers: { "api-key": SIK, "content-type": "application/json" },
    body: JSON.stringify({ model: "taxila-mai-image26", prompt: "A simple flat illustration of a pizza cut into 4 equal slices, 3 shaded orange, white background, no text", width: 1024, height: 1024 }) });
  const j = await res.json(); if (!res.ok) return { ok: false, http: res.status, err: "openai-path: " + r.err + " | mai-path: " + JSON.stringify(j).slice(0, 200) };
  const b64 = j.data?.[0]?.b64_json; if (b64) writeFileSync("results/smoke/taxila-mai-image26.png", Buffer.from(b64, "base64"));
  return { ok: !!b64, http: res.status, out: "mai path " + (b64 ? "png" : JSON.stringify(j).slice(0, 150)) };
});
await rec("taxila-ocr4", async () => {
  const jpg = readFileSync("../../../docs/research/models/image-bench/classroom-gpt-image-2.jpg").toString("base64");
  const r = await fetch(`${BASE.replace(".openai.azure.com", ".services.ai.azure.com")}/providers/mistral/azure/ocr`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: "taxila-ocr4", document: { type: "image_url", image_url: `data:image/jpeg;base64,${jpg}` } }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) return { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 300) };
  return { ok: true, http: r.status, served: j.model, usage: j.usage_info, out: (j.pages?.[0]?.markdown || "").slice(0, 120) };
});
async function oaiTx(dep) {
  const fd = new FormData(); fd.append("file", new Blob([WAV], { type: "audio/wav" }), "a.wav"); fd.append("model", dep);
  const r = await fetch(`${BASE}/openai/deployments/${dep}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  const j = await r.json().catch(() => ({})); if (!r.ok) return { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 300) };
  return { ok: true, http: r.status, usage: j.usage, out: j.text };
}
await rec("taxila-gpt-transcribe", () => oaiTx("taxila-gpt-transcribe"));
// realtime transcription session (same shape as docs/research/voice/v2/stt/probe.mjs live())
const rtTx = (host, key, model, path = "/openai/v1/realtime?intent=transcription") => new Promise((resolve) => {
  const CH = 24000 * 2 * 0.04; let off = 0, text = "", started = false;
  const ws = new WebSocket(`wss://${host}${path}`, { headers: { "api-key": key } });
  const done = (o) => { try { ws.close(); } catch {} resolve(o); }; const timer = setTimeout(() => done({ ok: false, err: "timeout; partial=" + text }), 30000);
  ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { type: "transcription", audio: { input: { format: { type: "audio/pcm", rate: 24000 }, transcription: { model }, turn_detection: null } } } }));
  ws.onmessage = (ev) => { const e = JSON.parse(ev.data);
    if (e.type === "session.updated" && !started) { started = true; const iv = setInterval(() => { if (off >= PCM24.length) { clearInterval(iv); ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); return; } ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: PCM24.subarray(off, off + CH).toString("base64") })); off += CH; }, 40); }
    else if (e.type === "conversation.item.input_audio_transcription.delta") text += e.delta;
    else if (e.type === "conversation.item.input_audio_transcription.completed") { clearTimeout(timer); done({ ok: true, out: e.transcript ?? text }); }
    else if (e.type === "error") { clearTimeout(timer); done({ ok: false, err: JSON.stringify(e.error).slice(0, 250) }); } };
  ws.onerror = (e) => { clearTimeout(timer); done({ ok: false, err: "ws error " + (e?.message || "") }); };
});
await rec("taxila-rt-whisper", () => rtTx(new URL(BASE).host, KEY, "taxila-rt-whisper"));
await rec("taxila-live-transcribe", () => rtTx(new URL(BASE).host, KEY, "taxila-live-transcribe"));
await rec("taxila-mai-tx2-stream (rt path)", () => rtTx(new URL(SI).host, SIK, "taxila-mai-tx2-stream"));
async function fastTx(base, key, def) {
  const fd = new FormData(); fd.append("audio", new Blob([WAV], { type: "audio/wav" }), "a.wav"); fd.append("definition", JSON.stringify(def));
  const r = await fetch(`${base}/speechtotext/transcriptions:transcribe?api-version=2025-10-15`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key }, body: fd });
  const j = await r.json().catch(() => ({})); if (!r.ok) return { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 300) };
  return { ok: true, http: r.status, out: (j.combinedPhrases || []).map((p) => p.text).join(" "), durMs: j.durationMilliseconds };
}
for (const [tag, base, key] of [["centralindia", CI, CIK], ["southindia", SI, SIK], ["eastus2", BASE.replace(".openai.azure.com", ".cognitiveservices.azure.com"), KEY]]) {
  for (const m of ["MAI-Transcribe-2", "MAI-Transcribe-1.5"]) await rec(`${m} @${tag}`, () => fastTx(base, key, { enhancedMode: { enabled: true, model: m } }));
}
await rec("fast-transcription hi-IN @centralindia", () => fastTx(CI, CIK, { locales: ["hi-IN", "en-IN"] }));
// TTS: DragonHD + MAI-Voice in centralindia
await rec("voices/list @centralindia", async () => {
  const r = await fetch(`https://centralindia.tts.speech.microsoft.com/cognitiveservices/voices/list`, { headers: { "Ocp-Apim-Subscription-Key": CIK } });
  const j = await r.json(); if (!r.ok) return { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 200) };
  const names = j.map((v) => v.ShortName); const dragon = names.filter((n) => /DragonHD/.test(n) && /^(en-IN|hi-IN)/.test(n)); const mai = names.filter((n) => /MAI-Voice/.test(n) && /^(en-IN|hi-IN)/.test(n));
  writeFileSync("results/smoke/voices-centralindia.json", JSON.stringify({ total: names.length, dragonIN: dragon, maiIN: mai, allDragon: names.filter((n) => /DragonHD/.test(n)).length }, null, 1));
  return { ok: true, out: `total=${names.length} DragonHD(en/hi-IN)=${dragon.length}: ${dragon.slice(0, 6).join(",")} | MAI-Voice(en/hi-IN)=${mai.length}` };
});
async function tts(region, key, voice, file) {
  const lang = voice.slice(0, 5);
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}">Shabaash! Teen bata chaar sahi hai.</voice></speak>`;
  const t = t0(); const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "content-type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "user-agent": "taxila-refresh-smoke" }, body: ssml });
  if (!r.ok) return { ok: false, http: r.status, err: (await r.text()).slice(0, 200) };
  const reader = r.body.getReader(); const first = await reader.read(); const ttfb = Math.round(t0() - t); const chunks = [first.value]; for (;;) { const c = await reader.read(); if (c.done) break; chunks.push(c.value); }
  writeFileSync(`results/smoke/${file}.mp3`, Buffer.concat(chunks.map((c) => Buffer.from(c)))); return { ok: true, http: r.status, ttfbMs: ttfb, out: `ttfb ${ttfb} ms` };
}
await rec("tts en-IN-Diya DragonHD @centralindia", () => tts("centralindia", CIK, "en-IN-Diya:DragonHDLatestNeural", "diya-dragonhd-ci"));
await rec("tts hi-IN-Arjun MAI-Voice-2.1 @centralindia", () => tts("centralindia", CIK, "hi-IN-Arjun:MAI-Voice-2.1", "arjun-mai21-ci"));
const prev = (() => { try { return JSON.parse(readFileSync("results/smoke-2026-10-04.json", "utf8")); } catch { return []; } })();
const merged = [...prev.filter((p) => !results.some((r) => r.name === p.name)), ...results.map((r) => ({ ...r, at: new Date().toISOString() }))];
writeFileSync("results/smoke-2026-10-04.json", JSON.stringify(merged, null, 1));
