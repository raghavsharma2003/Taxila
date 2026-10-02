// probe.mjs — stt-hinglish v2 (2026-10-02): which Azure-billed STT should hear an Indian child?
// SYNTHETIC speech: measures the instrument (accuracy on child-shaped TTS, script behaviour, numbers,
// streaming latency, hallucination on non-speech), NOT real children's WER. E1 (real children) is the gate.
//
// Two TTS families so no engine gets a home-family advantage unnoticed:
//   G = gpt-4o-mini-tts told to sound like a 9-year-old Indian child (coral/sage alternate)
//   Z = Azure Speech neural (hi-IN / en-IN Ananya & Rehaan alternate), prosody pitch +25%, rate +12%
// Three acoustic arms: clean, white noise @10 dB SNR, pink noise @10 dB SNR. Plus 3 non-speech clips.
//
//   set -a; . /home/user/Taxila/.env.local; set +a; export NODE_USE_ENV_PROXY=1
//   SPEECH_SDK=/path/to/node_modules/microsoft-cognitiveservices-speech-sdk/distrib/lib/microsoft.cognitiveservices.speech.sdk.js
//   node probe.mjs gen|run|score <workdir>
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process"; import { createRequire } from "node:module";
import { STIMULI, SPOKEN, KEYWORDS, DECOYS, SCRIPT_PROMPT } from "./stimuli.mjs";
import { scoreOne, decoyHits } from "./score.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const [cmd, WD = "/tmp/stt-v2"] = process.argv.slice(2);
const KEY = process.env.AZURE_OPENAI_API_KEY;
const BASE = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "").replace(/\/openai\/v1$/, "");
const SPEECH = BASE.replace(".openai.azure.com", ".cognitiveservices.azure.com");
const REGION = "eastus2", WSHOST = new URL(BASE || "https://x").host, SR = 24000;
const CHILD_INSTR = "Voice of a 9-year-old Indian child answering a teacher, speaking Hindi and English the way Indian kids mix them. Natural, a little hesitant, child-like pitch, Indian accent, not theatrical.";
const ARMS = ["clean", "white", "pink"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function retry(fn, tries = 5) { for (let i = 0; ; i++) { try { return await fn(); } catch (e) { if (i >= tries - 1) throw e; await sleep(1500 * 2 ** i); } } }
const i16 = (b) => { if (b.byteOffset % 2) b = Buffer.from(b); return new Int16Array(b.buffer, b.byteOffset, b.length >> 1); };
const wavOf = (pcm, sr = SR) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };
const pad = (pcm, pre = 300, post = 600) => Buffer.concat([Buffer.alloc(SR * 2 * pre / 1000), pcm, Buffer.alloc(SR * 2 * post / 1000)]);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function ff(inPcm, args, inSr = SR, outSr = SR) { const a = path.join(WD, "_i.pcm"), b = path.join(WD, "_o.pcm"); fs.writeFileSync(a, inPcm); execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(inSr), "-ac", "1", "-i", a, ...args, "-f", "s16le", "-ar", String(outSr), "-ac", "1", b]); return fs.readFileSync(b); }
function opus(pcm, file) { const a = path.join(WD, "_x.pcm"); fs.writeFileSync(a, pcm); execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a, "-c:a", "libopus", "-b:a", "20k", file]); }
const activeRms = (a) => { let s = 0, n = 0; for (const v of a) if (Math.abs(v) > 300) { s += v * v; n++; } return Math.sqrt(s / (n || 1)); };
function speechSpan(pcm) { // onset/end (ms) from 20 ms frame energy on the CLEAN clip
  const a = i16(pcm), F = SR / 50, th = activeRms(a) * 0.1; let on = null, end = 0;
  for (let f = 0; f * F < a.length; f++) { let s = 0; for (let i = f * F; i < Math.min(a.length, (f + 1) * F); i++) s += a[i] * a[i]; if (Math.sqrt(s / F) > th) { if (on === null) on = f * 20; end = (f + 1) * 20; } }
  return { onMs: on ?? 0, endMs: end };
}
let pS = [0, 0, 0];
const noise = (kind) => { const w = Math.random() * 2 - 1; if (kind === "white") return w; pS = [0.99765 * pS[0] + w * 0.099046, 0.963 * pS[1] + w * 0.2965164, 0.57 * pS[2] + w * 1.0526913]; return (pS[0] + pS[1] + pS[2] + w * 0.1848) / 4; };
function mix(pcm, kind, snr = 10) {
  const s = i16(pcm), n = Float64Array.from({ length: s.length }, () => noise(kind));
  const nr = Math.sqrt(n.reduce((a, v) => a + v * v, 0) / n.length), g = activeRms(s) / (nr * 10 ** (snr / 20));
  return Buffer.from(Int16Array.from(s, (v, i) => Math.max(-32768, Math.min(32767, Math.round(v + g * n[i])))).buffer);
}

async function ttsG(text, voice) {
  return retry(async () => { const r = await fetch(`${BASE}/openai/v1/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input: text, instructions: CHILD_INSTR, response_format: "pcm" }) }); if (!r.ok) throw new Error(`tts ${r.status} ${await r.text()}`); return Buffer.from(await r.arrayBuffer()); });
}
async function ttsZ(text, voice) {
  const lang = voice.slice(0, 5);
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}"><prosody pitch="+25%" rate="+12%">${esc(text)}</prosody></voice></speak>`;
  return retry(async () => { const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": KEY, "content-type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm", "user-agent": "taxila-stt-probe" }, body: ssml }); if (!r.ok) throw new Error(`az tts ${r.status} ${await r.text()}`); return Buffer.from(await r.arrayBuffer()); });
}
// trim TTS leading/trailing silence so every clip has exactly 300 ms before and 600 ms after speech
const trim = (pcm) => { const { onMs, endMs } = speechSpan(pcm); return pcm.subarray(Math.max(0, (onMs - 40) * 48) & ~1, Math.min(pcm.length, (endMs + 60) * 48) & ~1); };

async function gen() {
  fs.mkdirSync(WD, { recursive: true }); const AUD = path.join(HERE, "audio"); fs.mkdirSync(AUD, { recursive: true }); const meta = {};
  for (const [k, s] of STIMULI.entries()) {
    const text = SPOKEN[s.id] || s.ref;
    const zv = (s.cat === "english" ? "en-IN-" : "hi-IN-") + (k % 2 ? "RehaanNeural" : "AnanyaNeural");
    for (const [src, raw] of [["G", await ttsG(text, k % 2 ? "sage" : "coral")], ["Z", await ttsZ(text, zv)]]) {
      const clean = pad(trim(raw)); const span = speechSpan(clean);
      for (const arm of ARMS) {
        const pcm = arm === "clean" ? clean : mix(clean, arm); const id = `${s.id}-${src}-${arm}`;
        fs.writeFileSync(path.join(WD, id + ".pcm"), pcm); fs.writeFileSync(path.join(WD, id + ".16k.pcm"), ff(pcm, [], SR, 16000));
        opus(pcm, path.join(AUD, id + ".ogg")); meta[id] = { ...span, durMs: Math.round(pcm.length / 48), voice: src === "G" ? (k % 2 ? "sage" : "coral") : zv };
      }
    }
    process.stdout.write(".");
  }
  // non-speech: 3 s dithered silence, 4 s white, 4 s pink (at the noisy-arm level of a typical clip)
  const L = SR * 4, lvl = 600;
  const sil = Buffer.from(Int16Array.from({ length: SR * 3 }, () => Math.round((Math.random() - 0.5) * 4)).buffer);
  const wn = Buffer.from(Int16Array.from({ length: L }, () => Math.round(noise("white") * lvl * 1.7)).buffer);
  const pn = Buffer.from(Int16Array.from({ length: L }, () => Math.round(noise("pink") * lvl * 6)).buffer);
  for (const [id, pcm] of Object.entries({ "n01-N-silence": sil, "n02-N-white": wn, "n03-N-pink": pn })) {
    fs.writeFileSync(path.join(WD, id + ".pcm"), pcm); fs.writeFileSync(path.join(WD, id + ".16k.pcm"), ff(pcm, [], SR, 16000)); opus(pcm, path.join(AUD, id + ".ogg"));
    meta[id] = { onMs: 0, endMs: Math.round(pcm.length / 48), durMs: Math.round(pcm.length / 48) };
  }
  fs.writeFileSync(path.join(WD, "meta.json"), JSON.stringify(meta, null, 1)); fs.copyFileSync(path.join(WD, "meta.json"), path.join(HERE, "clips-meta.json"));
  console.log(`\n${Object.keys(meta).length} clips`);
}

// ---------------- engines (all Azure-billed, Taxila Foundry/AIServices resource, eastus2) ----------------
const meanLp = (l) => l?.length ? +(l.reduce((a, t) => a + t.logprob, 0) / l.length).toFixed(4) : null;
const oai = (dep, o = {}) => async ({ wav }) => {
  const fd = new FormData(); fd.append("file", new Blob([wav], { type: "audio/wav" }), "a.wav"); fd.append("response_format", "json"); fd.append("include[]", "logprobs");
  if (o.language) fd.append("language", o.language); if (o.prompt) fd.append("prompt", o.prompt);
  const t = performance.now();
  const r = await fetch(`${BASE}/openai/deployments/${dep}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  if (r.status === 429 || r.status >= 500) throw new Error(`retry ${r.status}`);
  const j = await r.json(); if (!r.ok) return { text: "", err: `${r.status} ${JSON.stringify(j).slice(0, 200)}` };
  return { text: j.text || "", conf: meanLp(j.logprobs), reqMs: Math.round(performance.now() - t) };
};
const fast = (def) => async ({ wav }) => {
  const fd = new FormData(); fd.append("audio", new Blob([wav], { type: "audio/wav" }), "a.wav"); fd.append("definition", JSON.stringify(def)); const t = performance.now();
  const r = await fetch(`${SPEECH}/speechtotext/transcriptions:transcribe?api-version=2025-10-15`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": KEY }, body: fd });
  if (r.status === 429 || r.status >= 500) throw new Error(`retry ${r.status}`);
  const j = await r.json(); if (!r.ok) return { text: "", err: `${r.status} ${JSON.stringify(j).slice(0, 200)}` };
  return { text: (j.combinedPhrases || []).map((p) => p.text).join(" "), reqMs: Math.round(performance.now() - t) };
};
// gpt-live-transcribe: realtime transcription session, 40 ms chunks paced at real time, commit at clip end
const live = (tx) => ({ pcm, m }) => new Promise((resolve) => {
  const CH = SR * 2 * 0.04; let off = 0, t0 = 0, firstDelta = null, text = "";
  const ws = new WebSocket(`wss://${WSHOST}/openai/v1/realtime?intent=transcription`, { headers: { "api-key": KEY } });
  const done = (o) => { try { ws.close(); } catch {} resolve(o); }; const timer = setTimeout(() => done({ text, err: "timeout" }), 60000);
  ws.onmessage = (ev) => {
    const e = JSON.parse(ev.data);
    if (e.type === "session.updated" && !t0) {
      t0 = performance.now();
      const iv = setInterval(() => { if (off >= pcm.length) { clearInterval(iv); ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); return; } ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.subarray(off, off + CH).toString("base64") })); off += CH; }, 40);
    } else if (e.type === "conversation.item.input_audio_transcription.delta") { if (firstDelta === null) firstDelta = performance.now() - t0; text += e.delta; }
    else if (e.type === "conversation.item.input_audio_transcription.completed") { clearTimeout(timer); const tf = performance.now() - t0; done({ text: e.transcript ?? text, firstPartialMs: firstDelta === null ? null : Math.round(firstDelta - m.onMs), finalAfterEndMs: Math.round(tf - m.endMs), finalAfterAudioMs: Math.round(tf - m.durMs) }); }
    else if (e.type === "error") { clearTimeout(timer); done({ text, err: JSON.stringify(e.error).slice(0, 200) }); }
  };
  ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { type: "transcription", audio: { input: { format: { type: "audio/pcm", rate: SR }, transcription: { model: "taxila-live-transcribe", ...tx }, turn_detection: null } } } }));
  ws.onerror = () => {};
});
// Azure Speech real-time (Speech SDK, websocket), 16 kHz, 40 ms chunks paced at real time
let SDK = null;
const loadSdk = () => SDK ??= createRequire(import.meta.url)(process.env.SPEECH_SDK || "microsoft-cognitiveservices-speech-sdk");
const azrt = (o) => ({ pcm16, m }) => new Promise((resolve) => {
  const sdk = loadSdk(); const cfg = sdk.SpeechConfig.fromSubscription(KEY, REGION);
  const px = process.env.HTTPS_PROXY && new URL(process.env.HTTPS_PROXY); if (px) cfg.setProxy(px.hostname, +px.port);
  cfg.outputFormat = sdk.OutputFormat.Detailed;
  const push = sdk.AudioInputStream.createPushStream(sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)); const ac = sdk.AudioConfig.fromStreamInput(push);
  let rec;
  if (o.lid) { cfg.setProperty(sdk.PropertyId.SpeechServiceConnection_LanguageIdMode, "Continuous"); rec = sdk.SpeechRecognizer.FromConfig(cfg, sdk.AutoDetectSourceLanguageConfig.fromLanguages(o.lid), ac); }
  else { cfg.speechRecognitionLanguage = o.lang; rec = new sdk.SpeechRecognizer(cfg, ac); }
  if (o.phrases) { const pl = sdk.PhraseListGrammar.fromRecognizer(rec); for (const p of o.phrases) pl.addPhrase(p); }
  let t0 = 0, firstPartial = null, lastFinal = null; const segs = [], confs = [], langs = [];
  const finish = (err) => { clearTimeout(timer); try { rec.close(); } catch {} resolve({ text: segs.join(" "), err, conf: confs.length ? +(confs.reduce((a, b) => a + b, 0) / confs.length).toFixed(4) : null, langs: [...new Set(langs)],
    firstPartialMs: firstPartial === null ? null : Math.round(firstPartial - m.onMs), finalAfterEndMs: lastFinal === null ? null : Math.round(lastFinal - m.endMs) }); };
  const timer = setTimeout(() => finish("timeout"), 60000);
  rec.recognizing = (_s, e) => { if (firstPartial === null && e.result.text) firstPartial = performance.now() - t0; };
  rec.recognized = (_s, e) => { if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) { segs.push(e.result.text); lastFinal = performance.now() - t0;
    try { const j = JSON.parse(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)); if (j.NBest?.[0]?.Confidence != null) confs.push(j.NBest[0].Confidence); if (j.PrimaryLanguage?.Language) langs.push(j.PrimaryLanguage.Language); } catch {} } };
  rec.canceled = (_s, e) => { if (e.reason === sdk.CancellationReason.Error) finish(String(e.errorDetails).slice(0, 200)); };
  rec.sessionStopped = () => finish();
  rec.sessionStarted = () => {
    t0 = performance.now(); let off = 0; const CH = 16000 * 2 * 0.04;
    const iv = setInterval(() => { if (off >= pcm16.length) { clearInterval(iv); push.close(); return; } push.write(pcm16.buffer.slice(pcm16.byteOffset + off, pcm16.byteOffset + Math.min(off + CH, pcm16.length))); off += CH; }, 40);
  };
  rec.startContinuousRecognitionAsync(() => {}, (err) => finish(String(err)));
});

const KW = [...KEYWORDS, ...DECOYS];
export const CONFIGS = {
  "A0 gpt-4o-transcribe nohint": oai("taxila-transcribe"),
  "A3 gpt-4o-transcribe hi+scriptprompt": oai("taxila-transcribe", { language: "hi", prompt: SCRIPT_PROMPT }),
  "B0 gpt-4o-mini-transcribe nohint": oai("gpt-4o-mini-transcribe"),
  "B3 gpt-4o-mini-transcribe hi+scriptprompt": oai("gpt-4o-mini-transcribe", { language: "hi", prompt: SCRIPT_PROMPT }),
  "C1 azure-fast hi-IN+en-IN": fast({ locales: ["hi-IN", "en-IN"] }),
  "D0 live-transcribe nohint": live({}),
  "D4 live-transcribe kw+scriptprompt": live({ keywords: KW, prompt: SCRIPT_PROMPT }),
  "R1 azure-rt hi-IN": azrt({ lang: "hi-IN" }),
  "R2 azure-rt hi-IN+phrases": azrt({ lang: "hi-IN", phrases: KW }),
  "R3 azure-rt en-IN+phrases": azrt({ lang: "en-IN", phrases: KW }),
  "R4 azure-rt LID(hi,en)+phrases": azrt({ lid: ["hi-IN", "en-IN"], phrases: KW }),
};
const STREAM = (c) => /^[DR]/.test(c);

async function pool(jobs, n) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < jobs.length) await jobs[i++](); })); }
async function run() {
  const meta = JSON.parse(fs.readFileSync(path.join(WD, "meta.json"), "utf8")); const out = path.join(WD, "rows.jsonl");
  const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
  const have = new Set(fs.existsSync(out) ? fs.readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => { const r = JSON.parse(l); return r.err ? "" : r.clip + "|" + r.cfg; }) : []);
  const q = { http: [], live: [], az: [] };
  for (const clip of Object.keys(meta)) for (const [cfg, fn] of Object.entries(CONFIGS)) {
    if (have.has(clip + "|" + cfg) || (only && !only.test(cfg))) continue;
    const job = async () => {
      const pcm = fs.readFileSync(path.join(WD, clip + ".pcm")), pcm16 = fs.readFileSync(path.join(WD, clip + ".16k.pcm")); const t = performance.now(); let res;
      try { res = await retry(() => fn({ pcm, pcm16, wav: wavOf(pcm), m: meta[clip] }), 4); } catch (e) { res = { text: "", err: String(e.message || e) }; }
      fs.appendFileSync(out, JSON.stringify({ clip, cfg, ms: Math.round(performance.now() - t), ...res }) + "\n"); process.stdout.write(res.err ? "x" : ".");
    };
    (cfg[0] === "D" ? q.live : cfg[0] === "R" ? q.az : q.http).push(job);
  }
  console.log(`${q.http.length} http, ${q.live.length} live, ${q.az.length} azure-rt jobs`);
  await Promise.all([pool(q.http, 8), pool(q.live, 5), pool(q.az, 10)]); console.log("\ndone");
}

function score() {
  const meta = JSON.parse(fs.readFileSync(path.join(WD, "meta.json"), "utf8"));
  const raw = fs.readFileSync(path.join(WD, "rows.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const last = new Map(); for (const r of raw) { const k = r.clip + "|" + r.cfg; if (!last.has(k) || last.get(k).err) last.set(k, r); } // keep a successful retry
  const S = Object.fromEntries(STIMULI.map((s) => [s.id, s]));
  const rows = [...last.values()].map((r) => {
    const [id, src, arm] = r.clip.split("-"); const base = { ...r, id, src, arm, cat: id.startsWith("n") ? "nonspeech" : S[id].cat };
    if (id.startsWith("n")) return { ...base, halluc: (r.text || "").replace(/[^\p{L}\p{N}]/gu, "").length > 0 };
    return { ...base, ...scoreOne(S[id], r.text || ""), decoys: decoyHits(DECOYS, r.text) };
  });
  const mean = (a) => { const b = a.filter((x) => x != null && !Number.isNaN(x)); return b.length ? +(b.reduce((x, y) => x + y, 0) / b.length).toFixed(3) : null; };
  const pct = (a, p) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(p * b.length))] : null; };
  const frac = (a) => { const b = a.filter((x) => x !== null && x !== undefined); return b.length ? `${b.filter(Boolean).length}/${b.length}` : null; };
  const cell = (g) => { const ok = g.filter((r) => !r.err); return {
    n: g.length, errs: g.length - ok.length, werRaw: mean(ok.map((r) => r.werRaw)), werNorm: mean(ok.map((r) => r.werNorm)), cerNorm: mean(ok.map((r) => r.cerNorm)),
    keyRecall: mean(ok.map((r) => r.keyRecall)), keyRawRecall: mean(ok.map((r) => r.keyRawRecall)), numSeq: frac(ok.map((r) => r.numSeqOK)), answers: frac(ok.map((r) => r.answer)),
    fillerKept: frac(ok.map((r) => r.fillerKept)), wrongScript: ok.filter((r) => r.script.wrongScript).length, latin: mean(ok.map((r) => r.script.latin)),
    decoys: ok.reduce((a, r) => a + r.decoys.length, 0), reqMsP50: pct(ok.map((r) => r.reqMs), 0.5), reqMsP90: pct(ok.map((r) => r.reqMs), 0.9),
    firstPartialP50: pct(ok.map((r) => r.firstPartialMs), 0.5), finalAfterEndP50: pct(ok.map((r) => r.finalAfterEndMs), 0.5), finalAfterEndP90: pct(ok.map((r) => r.finalAfterEndMs), 0.9) }; };
  const agg = { byArm: {}, bySrc: {}, byCat: {}, overall: {}, nonspeech: {} };
  for (const cfg of Object.keys(CONFIGS)) {
    const R = rows.filter((r) => r.cfg === cfg); const sp = R.filter((r) => r.cat !== "nonspeech");
    agg.overall[cfg] = cell(sp);
    for (const arm of ARMS) agg.byArm[`${cfg} | ${arm}`] = cell(sp.filter((r) => r.arm === arm));
    for (const src of ["G", "Z"]) agg.bySrc[`${cfg} | ${src}`] = cell(sp.filter((r) => r.src === src));
    for (const cat of ["hinglish", "hindi", "english", "hesitant"]) agg.byCat[`${cfg} | ${cat}`] = cell(sp.filter((r) => r.cat === cat));
    const ns = R.filter((r) => r.cat === "nonspeech"); agg.nonspeech[cfg] = { n: ns.length, halluc: ns.filter((r) => r.halluc).length, texts: ns.filter((r) => r.halluc).map((r) => `${r.arm}: ${r.text}`.slice(0, 160)) };
  }
  const outFile = path.join(HERE, "results-2026-10-02.json");
  fs.writeFileSync(outFile, JSON.stringify({ method: { date: "2026-10-02", from: "US cloud container → eastus2 AIServices resource", stimuli: STIMULI.length, sources: { G: "gpt-4o-mini-tts child-instructed (coral/sage)", Z: "Azure Speech neural hi-IN/en-IN Ananya/Rehaan, prosody pitch +25% rate +12%" }, arms: { clean: "300 ms pre / 600 ms post pad", white: "white noise 10 dB SNR (vs active-speech RMS)", pink: "pink noise 10 dB SNR" }, keywords: KEYWORDS, decoys: DECOYS, scriptPrompt: SCRIPT_PROMPT, note: "SYNTHETIC speech. Instrument behaviour only." }, agg, rows }, null, 1));
  const show = (o) => { for (const [k, v] of Object.entries(o)) console.log(k.padEnd(52), JSON.stringify(v)); };
  console.log("== overall"); show(agg.overall); console.log("== by arm"); show(agg.byArm); console.log("== by source"); show(agg.bySrc); console.log("== by cat"); show(agg.byCat); console.log("== nonspeech"); show(agg.nonspeech);
}

if (cmd === "gen") await gen(); else if (cmd === "run") await run(); else if (cmd === "score") score(); else console.log("usage: node probe.mjs gen|run|score <workdir>");
