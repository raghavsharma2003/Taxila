// probe.mjs — model-refresh 2026-10-04, speech-to-text lane.
// Reuses the stt-hinglish v2 corpus and scorer (docs/research/voice/v2/stt/): 30 child-answer utterances x
// 2 TTS families x 3 acoustic arms = 180 speech clips, plus non-speech clips (3 original + 9 new here, n=12).
// SYNTHETIC speech: measures the instrument, NOT real children. E1 (real children) is the gate.
//
//   set -a; . /home/user/Taxila/.env.local; set +a; export NODE_USE_ENV_PROXY=1
//   SPEECH_SDK=<path to microsoft.cognitiveservices.speech.sdk.js>
//   node probe.mjs nonspeech|smoke|run|rtt|score <workdir>
// <workdir> must hold the v2 clip PCM (<id>.pcm 24 kHz, <id>.16k.pcm) and meta.json (from v2 `probe.mjs gen`).
// Keys are read from the environment only and are never written to any output.
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process"; import { createRequire } from "node:module";
import { STIMULI, KEYWORDS, DECOYS, SCRIPT_PROMPT } from "../../../docs/research/voice/v2/stt/stimuli.mjs";
import { scoreOne, decoyHits } from "../../../docs/research/voice/v2/stt/score.mjs";
import { numSeq2 } from "./score2.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const [cmd, WD = "/tmp/stt-refresh"] = process.argv.slice(2);
const E = process.env;
const KEY = E.AZURE_OPENAI_API_KEY;
const BASE = (E.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "").replace(/\/openai\/v1$/, "");
const SPEECH_EUS2 = BASE.replace(".openai.azure.com", ".cognitiveservices.azure.com");
const CI = (E.AZURE_AI_CENTRALINDIA_ENDPOINT || "").replace(/\/+$/, ""), CIK = E.AZURE_AI_CENTRALINDIA_KEY;
const SI = (E.AZURE_AI_SOUTHINDIA_ENDPOINT || "").replace(/\/+$/, ""), SIK = E.AZURE_AI_SOUTHINDIA_KEY;
const SR = 24000;
const ARMS = ["clean", "white", "pink"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function retry(fn, tries = 5) { for (let i = 0; ; i++) { try { return await fn(); } catch (e) { if (i >= tries - 1) throw e; await sleep(1500 * 2 ** i); } } }
const wavOf = (pcm, sr = SR) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };

// ---------- 9 extra non-speech clips (v2 had n=3; review R7.1: 0/3 bounds nothing) ----------
function nonspeech() {
  const meta = JSON.parse(fs.readFileSync(path.join(WD, "meta.json"), "utf8"));
  let pS = [0, 0, 0], br = 0;
  const white = () => Math.random() * 2 - 1;
  const pink = () => { const w = white(); pS = [0.99765 * pS[0] + w * 0.099046, 0.963 * pS[1] + w * 0.2965164, 0.57 * pS[2] + w * 1.0526913]; return (pS[0] + pS[1] + pS[2] + w * 0.1848) / 4; };
  const brown = () => { br = Math.max(-1, Math.min(1, br + white() * 0.02)); return br; };
  const gen = (sec, f) => Buffer.from(Int16Array.from({ length: SR * sec }, (_, i) => Math.max(-32768, Math.min(32767, Math.round(f(i))))).buffer);
  const clips = {
    "n04-N-zeros": gen(2, () => 0),
    "n05-N-silence5s": gen(5, () => (Math.random() - 0.5) * 4),
    "n06-N-whitelow": gen(4, () => white() * 300),
    "n07-N-whitehigh": gen(4, () => white() * 3000),
    "n08-N-pinklow": gen(4, () => pink() * 1200),
    "n09-N-pinkhigh": gen(4, () => pink() * 10000),
    "n10-N-brown": gen(4, () => brown() * 4000),
    "n11-N-hum": gen(4, (i) => 1500 * Math.sin(2 * Math.PI * 50 * i / SR) + 600 * Math.sin(2 * Math.PI * 150 * i / SR) + white() * 100),
    // pink noise amplitude-modulated at 4 Hz (syllable rate): the most speech-like non-speech
    "n12-N-modpink": gen(4, (i) => pink() * 8000 * (0.55 + 0.45 * Math.sin(2 * Math.PI * 4 * i / SR))),
  };
  for (const [id, pcm] of Object.entries(clips)) {
    fs.writeFileSync(path.join(WD, id + ".pcm"), pcm);
    const a = path.join(WD, "_i.pcm"), b = path.join(WD, id + ".16k.pcm"); fs.writeFileSync(a, pcm);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", a, "-f", "s16le", "-ar", "16000", "-ac", "1", b]);
    meta[id] = { onMs: 0, endMs: Math.round(pcm.length / 48), durMs: Math.round(pcm.length / 48) };
  }
  fs.writeFileSync(path.join(WD, "meta.json"), JSON.stringify(meta, null, 1));
  console.log(Object.keys(meta).length, "clips");
}

// ---------- engines ----------
const meanLp = (l) => l?.length ? +(l.reduce((a, t) => a + t.logprob, 0) / l.length).toFixed(4) : null;
const oai = (dep, o = {}) => async ({ wav }) => {
  const fd = new FormData(); fd.append("file", new Blob([wav], { type: "audio/wav" }), "a.wav"); fd.append("response_format", "json"); if (o.logprobs !== false) fd.append("include[]", "logprobs");
  if (o.language) fd.append("language", o.language); if (o.prompt) fd.append("prompt", o.prompt);
  const t = performance.now();
  const r = await fetch(`${BASE}/openai/deployments/${dep}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  if (r.status === 429 || r.status >= 500) throw new Error(`retry ${r.status}`);
  const j = await r.json(); if (!r.ok) return { text: "", err: `${r.status} ${JSON.stringify(j).slice(0, 200)}` };
  return { text: j.text || "", conf: meanLp(j.logprobs), reqMs: Math.round(performance.now() - t) };
};
// Azure Speech Fast Transcription API (also the MAI-Transcribe route: definition.enhancedMode)
const fast = (base, key, def) => async ({ wav }) => {
  const fd = new FormData(); fd.append("audio", new Blob([wav], { type: "audio/wav" }), "a.wav"); fd.append("definition", JSON.stringify(def)); const t = performance.now();
  const r = await fetch(`${base}/speechtotext/transcriptions:transcribe?api-version=2025-10-15`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key }, body: fd });
  if (r.status === 429 || r.status >= 500) throw new Error(`retry ${r.status}`);
  const j = await r.json().catch(() => ({})); if (!r.ok) return { text: "", err: `${r.status} ${JSON.stringify(j).slice(0, 200)}` };
  return { text: (j.combinedPhrases || []).map((p) => p.text).join(" "), reqMs: Math.round(performance.now() - t), locales: [...new Set((j.phrases || []).map((p) => p.locale).filter(Boolean))] };
};
// OpenAI realtime transcription socket: 40 ms chunks paced at real time, commit at clip end (as v2 live())
const live = (host, key, model, tx = {}) => ({ pcm, m }) => new Promise((resolve) => {
  const CH = SR * 2 * 0.04; let off = 0, t0 = 0, tCommit = 0, firstDelta = null, text = "";
  const ws = new WebSocket(`wss://${host}/openai/v1/realtime?intent=transcription`, { headers: { "api-key": key } });
  const done = (o) => { try { ws.close(); } catch {} resolve(o); }; const timer = setTimeout(() => done({ text, err: "timeout" }), 60000);
  ws.onmessage = (ev) => {
    const e = JSON.parse(ev.data);
    if (e.type === "session.updated" && !t0) {
      t0 = performance.now();
      const iv = setInterval(() => { if (off >= pcm.length) { clearInterval(iv); tCommit = performance.now(); ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); return; } ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.subarray(off, off + CH).toString("base64") })); off += CH; }, 40);
    } else if (e.type === "conversation.item.input_audio_transcription.delta") { if (firstDelta === null) firstDelta = performance.now() - t0; text += e.delta || ""; }
    else if (e.type === "conversation.item.input_audio_transcription.completed") { clearTimeout(timer); const now = performance.now(), tf = now - t0; done({ text: e.transcript ?? text, firstPartialMs: firstDelta === null ? null : Math.round(firstDelta - m.onMs), finalAfterEndMs: Math.round(tf - m.endMs), afterCommitMs: Math.round(now - tCommit) }); }
    else if (e.type === "conversation.item.input_audio_transcription.failed") { clearTimeout(timer); done({ text, err: "failed " + JSON.stringify(e.error || {}).slice(0, 200) }); }
    else if (e.type === "error") { clearTimeout(timer); done({ text, err: JSON.stringify(e.error).slice(0, 200) }); }
  };
  ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { type: "transcription", audio: { input: { format: { type: "audio/pcm", rate: SR }, transcription: { model, ...tx }, turn_detection: null } } } }));
  ws.onerror = () => {};
});
let SDK = null;
const loadSdk = () => SDK ??= createRequire(import.meta.url)(E.SPEECH_SDK || "microsoft-cognitiveservices-speech-sdk");
const azrt = (o) => ({ pcm16, m }) => new Promise((resolve) => {
  const sdk = loadSdk(); const cfg = sdk.SpeechConfig.fromSubscription(KEY, "eastus2");
  const px = E.HTTPS_PROXY && new URL(E.HTTPS_PROXY); if (px) cfg.setProxy(px.hostname, +px.port);
  cfg.outputFormat = sdk.OutputFormat.Detailed;
  const push = sdk.AudioInputStream.createPushStream(sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)); const ac = sdk.AudioConfig.fromStreamInput(push);
  cfg.setProperty(sdk.PropertyId.SpeechServiceConnection_LanguageIdMode, "Continuous");
  const rec = sdk.SpeechRecognizer.FromConfig(cfg, sdk.AutoDetectSourceLanguageConfig.fromLanguages(o.lid), ac);
  if (o.phrases) { const pl = sdk.PhraseListGrammar.fromRecognizer(rec); for (const p of o.phrases) pl.addPhrase(p); }
  let t0 = 0, firstPartial = null, lastFinal = null; const segs = [];
  const finish = (err) => { clearTimeout(timer); try { rec.close(); } catch {} resolve({ text: segs.join(" "), err, firstPartialMs: firstPartial === null ? null : Math.round(firstPartial - m.onMs), finalAfterEndMs: lastFinal === null ? null : Math.round(lastFinal - m.endMs) }); };
  const timer = setTimeout(() => finish("timeout"), 60000);
  rec.recognizing = (_s, e) => { if (firstPartial === null && e.result.text) firstPartial = performance.now() - t0; };
  rec.recognized = (_s, e) => { if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) { segs.push(e.result.text); lastFinal = performance.now() - t0; } };
  rec.canceled = (_s, e) => { if (e.reason === sdk.CancellationReason.Error) finish(String(e.errorDetails).slice(0, 200)); };
  rec.sessionStopped = () => finish();
  rec.sessionStarted = () => {
    t0 = performance.now(); let off = 0; const CH = 16000 * 2 * 0.04;
    const iv = setInterval(() => { if (off >= pcm16.length) { clearInterval(iv); push.close(); return; } push.write(pcm16.buffer.slice(pcm16.byteOffset + off, pcm16.byteOffset + Math.min(off + CH, pcm16.length))); off += CH; }, 40);
  };
  rec.startContinuousRecognitionAsync(() => {}, (err) => finish(String(err)));
});

const KW = [...KEYWORDS, ...DECOYS];
const EH = new URL(BASE || "https://x").host, SH = new URL(SI || "https://x").host;
const LT = E.REFRESH_LIVE_TX || "taxila-live-transcribe", RW = E.REFRESH_DEPLOY_RT_WHISPER || "taxila-rt-whisper";
const MS = E.REFRESH_DEPLOY_MAI_TX2_STREAM || "taxila-mai-tx2-stream", GT = E.REFRESH_DEPLOY_GPT_TRANSCRIBE || "taxila-gpt-transcribe";
const mai = (model, extra = {}) => fast(CI, CIK, { enhancedMode: { enabled: true, model, ...(extra.mo ? { modelOptions: extra.mo } : {}) }, ...(extra.phrases ? { phraseList: { phrases: extra.phrases } } : {}), ...(extra.locales ? { locales: extra.locales } : {}) });
export const CONFIGS = {
  // current production lane + its ablations (v2 review R7.5)
  "D4 live-tx kw+prompt (CURRENT)": live(EH, KEY, LT, { keywords: KW, prompt: SCRIPT_PROMPT }),
  "D1 live-tx kw only": live(EH, KEY, LT, { keywords: KW }),
  "D2 live-tx prompt only": live(EH, KEY, LT, { prompt: SCRIPT_PROMPT }),
  "D0 live-tx nohint": live(EH, KEY, LT),
  // newer OpenAI-family deployments
  "W0 rt-whisper nohint": live(EH, KEY, RW),
  "W1 rt-whisper language=hi (prompt+keywords refused)": live(EH, KEY, RW, { language: "hi" }),
  "G0 gpt-transcribe nohint": oai(GT),
  "G3 gpt-transcribe hi+prompt": oai(GT, { language: "hi", prompt: SCRIPT_PROMPT }),
  // older gpt-4o family (excluded since v2; re-measured for drift)
  "A0 gpt-4o-transcribe nohint": oai("taxila-transcribe"),
  "A3 gpt-4o-transcribe hi+prompt": oai("taxila-transcribe", { language: "hi", prompt: SCRIPT_PROMPT }),
  "B0 gpt-4o-mini-transcribe nohint": oai("gpt-4o-mini-transcribe"),
  "B3 gpt-4o-mini-transcribe hi+prompt": oai("gpt-4o-mini-transcribe", { language: "hi", prompt: SCRIPT_PROMPT }),
  // MAI family (Central India batch; South India streaming)
  "X2 MAI-Transcribe-2": mai("MAI-Transcribe-2"),
  "X2k MAI-Transcribe-2 +phraseList": mai("MAI-Transcribe-2", { phrases: KW }),
  "X15 MAI-Transcribe-1.5": mai("MAI-Transcribe-1.5"),
  "X15k MAI-Transcribe-1.5 +phraseList": mai("MAI-Transcribe-1.5", { phrases: KW }),
  "S0 MAI-Tx-2-Streaming nohint": live(SH, SIK, MS),
  "S1 MAI-Tx-2-Streaming language=hi (prompt+keywords refused)": live(SH, SIK, MS, { language: "hi" }),
  // Azure Speech classic
  "C1 azure-fast hi-IN+en-IN": fast(SPEECH_EUS2, KEY, { locales: ["hi-IN", "en-IN"] }),
  "R4 azure-rt LID(hi,en)+phrases": azrt({ lid: ["hi-IN", "en-IN"], phrases: KW }),
};
const kind = (cfg) => /^(D|W|S)/.test(cfg) ? "live" : /^R/.test(cfg) ? "az" : /^X/.test(cfg) ? "mai" : "http";

async function pool(jobs, n) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < jobs.length) await jobs[i++](); })); }
function load(f) { return fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []; }
async function runJobs(clips, cfgs, out) {
  const meta = JSON.parse(fs.readFileSync(path.join(WD, "meta.json"), "utf8"));
  const have = new Set(load(out).filter((r) => !r.err).map((r) => r.clip + "|" + r.cfg));
  const q = { http: [], live: [], az: [], mai: [] };
  for (const clip of clips) for (const cfg of cfgs) {
    if (have.has(clip + "|" + cfg)) continue; const fn = CONFIGS[cfg];
    q[kind(cfg)].push(async () => {
      const pcm = fs.readFileSync(path.join(WD, clip + ".pcm")), pcm16 = fs.readFileSync(path.join(WD, clip + ".16k.pcm")); const t = performance.now(); let res;
      try { res = await retry(() => fn({ pcm, pcm16, wav: wavOf(pcm), m: meta[clip] }), 4); } catch (e) { res = { text: "", err: String(e.message || e) }; }
      fs.appendFileSync(out, JSON.stringify({ clip, cfg, at: new Date().toISOString(), ms: Math.round(performance.now() - t), ...res }) + "\n"); process.stdout.write(res.err ? "x" : ".");
    });
  }
  console.log(Object.entries(q).map(([k, v]) => `${k}:${v.length}`).join(" "));
  await Promise.all([pool(q.http, 6), pool(q.live, 4), pool(q.az, 8), pool(q.mai, 4)]); console.log("\ndone");
}

async function rtt() { // network RTT from this container to each host (unauthenticated GET; time to response headers)
  const hosts = { eastus2: new URL(BASE).host, centralindia: new URL(CI).host, southindia: new URL(SI).host };
  const res = {};
  for (const [k, h] of Object.entries(hosts)) {
    const t = []; for (let i = 0; i < 21; i++) { const s = performance.now(); try { const r = await fetch(`https://${h}/`, { method: "GET" }); await r.arrayBuffer(); } catch {} t.push(performance.now() - s); }
    t.shift(); t.sort((a, b) => a - b); res[k] = { n: t.length, p50: Math.round(t[10]), min: Math.round(t[0]), p90: Math.round(t[17]) };
  }
  fs.writeFileSync(path.join(HERE, "results", "rtt-2026-10-04.json"), JSON.stringify({ date: "2026-10-04", method: "21 sequential GET https://<host>/ from the US cloud container via the agent proxy; first dropped; time to full response (includes proxy hop and TLS reuse)", res }, null, 1));
  console.log(res);
}

function score() {
  const meta = JSON.parse(fs.readFileSync(path.join(WD, "meta.json"), "utf8"));
  const raw = load(path.join(WD, "rows.jsonl"));
  const last = new Map(); for (const r of raw) { const k = r.clip + "|" + r.cfg; if (!last.has(k) || last.get(k).err) last.set(k, r); }
  const S = Object.fromEntries(STIMULI.map((s) => [s.id, s]));
  const rows = [...last.values()].filter((r) => meta[r.clip]).map((r) => {
    const [id, src, arm] = r.clip.split("-"); const base = { ...r, id, src, arm, cat: id.startsWith("n") ? "nonspeech" : S[id].cat };
    if (id.startsWith("n")) return { ...base, halluc: (r.text || "").replace(/[^\p{L}\p{N}]/gu, "").length > 0 };
    // batch engines: final text = client endpoint hangover (the 600 ms trailing pad the live arms also send) + request time
    const finalAfterEndMs = r.finalAfterEndMs ?? (r.reqMs != null ? 600 + r.reqMs : null);
    return { ...base, finalAfterEndMs, ...scoreOne(S[id], r.text || ""), numSeq2OK: numSeq2(S[id].ref, r.text || ""), decoys: decoyHits(DECOYS, r.text) };
  });
  fs.writeFileSync(path.join(HERE, "results", "rows-2026-10-04.json"), JSON.stringify(rows.map(({ script, ...r }) => ({ ...r, wrongScript: script?.wrongScript ?? null })), null, 0));
  console.log("rows", rows.length);
}

if (cmd === "nonspeech") nonspeech();
else if (cmd === "smoke") { const cfgs = Object.keys(CONFIGS).filter((c) => !E.ONLY || new RegExp(E.ONLY).test(c)); await runJobs(["m07-G-clean", "d01-Z-clean", "n01-N-silence"], cfgs, path.join(WD, "smoke.jsonl")); for (const r of load(path.join(WD, "smoke.jsonl"))) console.log(r.cfg.padEnd(40), r.clip.padEnd(15), r.err ? "ERR " + r.err : JSON.stringify(r.text).slice(0, 90), r.reqMs ?? r.finalAfterEndMs ?? ""); }
else if (cmd === "run") { const meta = JSON.parse(fs.readFileSync(path.join(WD, "meta.json"), "utf8")); const cfgs = Object.keys(CONFIGS).filter((c) => !E.ONLY || new RegExp(E.ONLY).test(c)); await runJobs(Object.keys(meta), cfgs, path.join(WD, "rows.jsonl")); }
else if (cmd === "rtt") await rtt();
else if (cmd === "score") score();
else console.log("usage: node probe.mjs nonspeech|smoke|run|rtt|score <workdir>");
