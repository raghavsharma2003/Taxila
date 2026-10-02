// probe.mjs — E0: synthetic ASR instrument probe for Indian-child Hindi/English/Hinglish (2026-10-02).
//
// What it can and cannot say. The "children" are gpt-4o-mini-tts voices told to sound like a shy
// 9-year-old, then (arm `child`) pitch+formant-shifted up 20% to approximate a shorter vocal tract, then
// (arm `noisy`) mixed with TV-like Hindi babble at 10 dB SNR. That is NOT child speech: no child
// mispronunciation, no developmental phonology, no real disfluency timing. What it CAN measure is the
// instrument: which script each engine writes, whether it translates English NCERT terms, whether keyword
// biasing helps or inserts never-spoken terms, whether it hallucinates on silence, whether its
// confidence separates good from bad transcripts, and latency. E1 (real children) answers the rest.
//
//   set -a; . /home/user/Taxila/.env.local; set +a
//   node probe.mjs gen   <workdir>   # TTS + transforms (wav in workdir, opus copies in ./audio)
//   node probe.mjs run   <workdir>   # every engine config on every clip → <workdir>/rows.jsonl (resumable)
//   node probe.mjs score <workdir>   # → ./e0-results-2026-10-02.json + console tables
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
import { STIMULI, SPOKEN, NONSPEECH, KEYWORDS, DECOYS, ASR_PROMPT } from "./stimuli.mjs";
import { scoreOne, decoyHits, auroc } from "./score.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const [cmd, WD = "/tmp/asr-e0"] = process.argv.slice(2);
const KEY = process.env.AZURE_OPENAI_API_KEY;
const BASE = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "").replace(/\/openai\/v1$/, "");
const SPEECH = BASE.replace(".openai.azure.com", ".cognitiveservices.azure.com");
const WSHOST = new URL(BASE || "https://x").host;
const SR = 24000;
const VOICES = ["coral", "sage"];
const XFS = ["clean", "child", "noisy"];
const CHILD_INSTR = "Voice of a shy 9-year-old Indian child answering a teacher in class. Natural, a little hesitant, Indian accent, not theatrical.";

const wavOf = (pcm) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };
const i16 = (buf) => { if (buf.byteOffset % 2) buf = Buffer.from(buf); return new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1); };
const rms = (a) => { let s = 0, n = 0; for (const v of a) if (Math.abs(v) > 200) { s += v * v; n++; } return Math.sqrt(s / (n || 1)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retry(fn, tries = 5) {
  for (let i = 0; ; i++) { try { return await fn(); } catch (e) { if (i >= tries - 1) throw e; await sleep(1500 * 2 ** i); } }
}
async function tts(text, voice, instructions) {
  return retry(async () => {
    const r = await fetch(`${BASE}/openai/v1/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input: text, instructions, response_format: "pcm" }) });
    if (!r.ok) throw new Error(`tts ${r.status} ${await r.text()}`);
    return Buffer.from(await r.arrayBuffer());
  });
}
const pad = (pcm, preMs = 300, postMs = 600) => Buffer.concat([Buffer.alloc(SR * 2 * preMs / 1000), pcm, Buffer.alloc(SR * 2 * postMs / 1000)]);
function ffmpegPcm(inPcm, af) {
  const a = path.join(WD, "_in.pcm"), b = path.join(WD, "_out.pcm"); fs.writeFileSync(a, inPcm);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a, "-af", af, "-f", "s16le", "-ar", String(SR), "-ac", "1", b]);
  return fs.readFileSync(b);
}
const childShift = (pcm) => ffmpegPcm(pcm, `asetrate=${SR * 1.2},aresample=${SR},atempo=${(1 / 1.2).toFixed(4)}`);
function mixAt(speech, noise, snrDb, offset = 0) {
  const s = i16(speech), n = i16(noise), g = rms(s) / (rms(n) * 10 ** (snrDb / 20)); const out = new Int16Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = Math.max(-32768, Math.min(32767, Math.round(s[i] + g * n[(i + offset) % n.length])));
  return Buffer.from(out.buffer);
}
function opus(pcm, file) { const a = path.join(WD, "_o.pcm"); fs.writeFileSync(a, pcm); execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a, "-c:a", "libopus", "-b:a", "24k", file]); }

async function gen() {
  fs.mkdirSync(WD, { recursive: true }); const AUD = path.join(HERE, "audio"); fs.mkdirSync(AUD, { recursive: true });
  // Babble: two adult voices reading TV-news-like Hindi, summed (a TV on in the next room).
  const news = ["आज दिल्ली में मौसम साफ़ रहेगा, शाम को हल्की बारिश की संभावना है। बाज़ार में सब्ज़ियों के दाम थोड़े बढ़े हैं और ट्रैफ़िक पुलिस ने नए नियम लागू किए हैं।",
    "क्रिकेट मैच में भारत ने शानदार शुरुआत की, पहले दस ओवर में साठ रन बने। अब देखते हैं विज्ञापन के बाद आगे क्या होता है, हमारे साथ बने रहिए।"];
  const b1 = await tts(news[0], "onyx", "Fast TV news anchor, Hindi."), b2 = await tts(news[1], "ash", "Excited TV sports commentator, Hindi.");
  const L = Math.min(b1.length, b2.length) & ~1; const babble = Buffer.from(Int16Array.from(i16(b1.subarray(0, L)), (v, i) => (v + i16(b2)[i]) >> 1).buffer);
  fs.writeFileSync(path.join(WD, "babble.pcm"), babble);
  const items = [];
  for (const s of STIMULI) for (const v of VOICES) {
    const raw = pad(await tts(SPOKEN[s.id] || s.ref, v, CHILD_INSTR));
    const child = childShift(raw);
    const noisy = mixAt(child, babble, 10, (items.length * 7919) % 100000);
    for (const [xf, pcm] of Object.entries({ clean: raw, child, noisy })) {
      fs.writeFileSync(path.join(WD, `${s.id}-${v}-${xf}.pcm`), pcm); items.push(`${s.id}-${v}-${xf}`);
      if (xf !== "clean") opus(pcm, path.join(AUD, `${s.id}-${v}-${xf}.ogg`));
    }
    process.stdout.write(".");
  }
  // Non-speech: 3 s near-silence (±2 LSB dither), 4 s babble alone (noisy-arm level), 4 s pink noise.
  const sil = Buffer.from(Int16Array.from({ length: SR * 3 }, () => Math.round((Math.random() - 0.5) * 4)).buffer);
  const bab = Buffer.from(Int16Array.from({ length: SR * 4 }, (_, i) => Math.round(i16(babble)[(i + SR) % (babble.length >> 1)] * 0.3)).buffer);
  let b0 = 0, bb1 = 0, bb2 = 0; const pink = Buffer.from(Int16Array.from({ length: SR * 4 }, () => { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; bb1 = 0.963 * bb1 + w * 0.2965164; bb2 = 0.57 * bb2 + w * 1.0526913; return Math.round((b0 + bb1 + bb2 + w * 0.1848) * 1500); }).buffer);
  for (const [id, pcm] of Object.entries({ "n01-silence": sil, "n02-babble": bab, "n03-pink": pink })) { fs.writeFileSync(path.join(WD, `${id}-none-none.pcm`), pcm); opus(pcm, path.join(AUD, `${id}.ogg`)); }
  console.log(`\n${items.length} speech clips + 3 non-speech in ${WD}`);
}

// ---------------- engines (all Azure first-party, on the Taxila Foundry resource, eastus2) -------------
const meanLp = (lps) => lps?.length ? +(lps.reduce((a, t) => a + t.logprob, 0) / lps.length).toFixed(4) : null;
const minLp = (lps) => lps?.length ? +Math.min(...lps.map((t) => t.logprob)).toFixed(4) : null;
function oaiCfg(dep, opts) {
  return async (wav) => {
    const fd = new FormData(); fd.append("file", new Blob([wav], { type: "audio/wav" }), "a.wav"); fd.append("response_format", "json"); fd.append("include[]", "logprobs");
    if (opts.language) fd.append("language", opts.language); if (opts.prompt) fd.append("prompt", opts.prompt);
    const r = await fetch(`${BASE}/openai/deployments/${dep}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
    if (r.status === 429 || r.status >= 500) throw new Error(`retry ${r.status}`);
    const j = await r.json(); if (!r.ok) return { text: "", err: `${r.status} ${JSON.stringify(j).slice(0, 200)}` };
    return { text: j.text || "", conf: meanLp(j.logprobs), confMin: minLp(j.logprobs) };
  };
}
function fastCfg(def) {
  return async (wav) => {
    const fd = new FormData(); fd.append("audio", new Blob([wav], { type: "audio/wav" }), "a.wav"); fd.append("definition", JSON.stringify(def));
    const r = await fetch(`${SPEECH}/speechtotext/transcriptions:transcribe?api-version=2025-10-15`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": KEY }, body: fd });
    if (r.status === 429 || r.status >= 500) throw new Error(`retry ${r.status}`);
    const j = await r.json(); if (!r.ok) return { text: "", err: `${r.status} ${JSON.stringify(j).slice(0, 200)}` };
    const ph = j.phrases || []; const d = ph.reduce((a, p) => a + (p.durationMilliseconds || 1), 0) || 1;
    return { text: (j.combinedPhrases || []).map((p) => p.text).join(" "), conf: ph.length ? +(ph.reduce((a, p) => a + (p.confidence ?? 0) * (p.durationMilliseconds || 1), 0) / d).toFixed(4) : null, locales: [...new Set(ph.map((p) => p.locale))] };
  };
}
function liveCfg(tx) { // gpt-live-transcribe: realtime transcription session, audio paced at real time (40 ms chunks)
  return (wav) => new Promise((resolve) => {
    const pcm = wav.subarray(44); const CH = SR * 2 * 0.04; let off = 0, lastSent = 0, firstDelta = null, t0 = 0, text = "";
    const ws = new WebSocket(`wss://${WSHOST}/openai/v1/realtime?intent=transcription`, { headers: { "api-key": KEY } });
    const done = (o) => { try { ws.close(); } catch {} resolve(o); };
    const timer = setTimeout(() => done({ text, err: "timeout" }), 60000);
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === "session.updated" && !t0) {
        t0 = performance.now();
        const iv = setInterval(() => {
          if (off >= pcm.length) { clearInterval(iv); lastSent = performance.now(); ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); return; }
          ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.subarray(off, off + CH).toString("base64") })); off += CH;
        }, 40);
      } else if (e.type === "conversation.item.input_audio_transcription.delta") { if (firstDelta === null) firstDelta = Math.round(performance.now() - t0); text += e.delta; }
      else if (e.type === "conversation.item.input_audio_transcription.completed") { clearTimeout(timer); done({ text: e.transcript ?? text, finalLagMs: Math.round(performance.now() - lastSent), firstDeltaMs: firstDelta, audioMs: Math.round(pcm.length / 48) }); }
      else if (e.type === "error") { clearTimeout(timer); done({ text, err: JSON.stringify(e.error).slice(0, 200) }); }
    };
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { type: "transcription", audio: { input: { format: { type: "audio/pcm", rate: SR }, transcription: { model: "taxila-live-transcribe", ...tx }, turn_detection: null } } } }));
    ws.onerror = () => {};
  });
}
const PROMPT = ASR_PROMPT, KW = [...KEYWORDS, ...DECOYS];
// Context with NO vocabulary in it: who is speaking and the script convention only.
const SCRIPT_PROMPT = "A child aged 8 to 12 in India answers a teacher aloud in Hindi, English, or a Hindi-English mix. Write Hindi words in Devanagari and English words in Latin script, exactly as spoken.";
export const CONFIGS = {
  "A0 4o-tx(03-20) nohint": oaiCfg("taxila-transcribe", {}),
  "A1 4o-tx(03-20) hi": oaiCfg("taxila-transcribe", { language: "hi" }),
  "A2 4o-tx(03-20) hi+prompt": oaiCfg("taxila-transcribe", { language: "hi", prompt: PROMPT }),
  "B0 4o-mini-tx(12-15) nohint": oaiCfg("gpt-4o-mini-transcribe", {}),
  "B1 4o-mini-tx(12-15) hi": oaiCfg("gpt-4o-mini-transcribe", { language: "hi" }),
  "B2 4o-mini-tx(12-15) hi+prompt": oaiCfg("gpt-4o-mini-transcribe", { language: "hi", prompt: PROMPT }),
  "C0 azure-fast hi-IN": fastCfg({ locales: ["hi-IN"] }),
  "C1 azure-fast hi-IN+en-IN": fastCfg({ locales: ["hi-IN", "en-IN"] }),
  "C2 azure-fast hi-IN+phrases": fastCfg({ locales: ["hi-IN"], phraseList: { phrases: KW } }),
  "D0 live-tx nohint": liveCfg({}),
  "D1 live-tx hi,en+kw+prompt": liveCfg({ languages: ["hi", "en"], keywords: KW, prompt: PROMPT }),
  // Ablation (added 2026-10-02 after the first score): which part of D1/A2 does the work, and does a
  // prompt WITHOUT a term list keep the gain while dropping the recite-the-list failure on non-speech?
  "A3 4o-tx(03-20) hi+scriptprompt": oaiCfg("taxila-transcribe", { language: "hi", prompt: SCRIPT_PROMPT }),
  "D2 live-tx kw only": liveCfg({ keywords: KW }),
  "D3 live-tx scriptprompt only": liveCfg({ prompt: SCRIPT_PROMPT }),
  "D4 live-tx kw+scriptprompt": liveCfg({ keywords: KW, prompt: SCRIPT_PROMPT }),
};
const LIVE_XF = new Set(["child"]); // realtime-paced sessions are slow: run them on the child arm only

async function pool(jobs, n) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < jobs.length) await jobs[i++](); })); }
async function run() {
  const out = path.join(WD, "rows.jsonl"); const have = new Set(fs.existsSync(out) ? fs.readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => { const r = JSON.parse(l); return r.clip + "|" + r.cfg; }) : []);
  const clips = fs.readdirSync(WD).filter((f) => /^[a-z]\d\d.*\.pcm$/.test(f)).map((f) => f.replace(/\.pcm$/, ""));
  const http = [], live = [];
  for (const clip of clips) for (const [cfg, fn] of Object.entries(CONFIGS)) {
    if (have.has(clip + "|" + cfg)) continue; const xf = clip.split("-").pop(); const isLive = cfg.startsWith("D");
    if (isLive && !(LIVE_XF.has(xf) || xf === "none")) continue;
    const job = async () => {
      const wav = wavOf(fs.readFileSync(path.join(WD, clip + ".pcm"))); const t = performance.now(); let res;
      try { res = await retry(() => fn(wav), 5); } catch (e) { res = { text: "", err: String(e.message || e) }; }
      fs.appendFileSync(out, JSON.stringify({ clip, cfg, ms: Math.round(performance.now() - t), ...res }) + "\n"); process.stdout.write(res.err ? "x" : ".");
    };
    (isLive ? live : http).push(job);
  }
  console.log(`${http.length} http + ${live.length} live jobs`);
  await Promise.all([pool(http, 8), pool(live, 4)]); console.log("\ndone");
}

function score() {
  const rows = fs.readFileSync(path.join(WD, "rows.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const S = Object.fromEntries(STIMULI.map((s) => [s.id, s]));
  const scored = rows.map((r) => {
    const [id, voice, xf] = r.clip.split("-"); const isNon = id.startsWith("n");
    const base = { ...r, id, voice, xf: isNon ? "nonspeech" : xf, cat: isNon ? "nonspeech" : S[id].cat };
    if (isNon) return { ...base, halluc: (r.text || "").replace(/[^\p{L}\p{N}]/gu, "").length > 0 };
    return { ...base, ...scoreOne(S[id], r.text), decoys: decoyHits(DECOYS, r.text) };
  });
  const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
  const mean = (a) => { const b = a.filter((x) => x != null); return b.length ? +(b.reduce((x, y) => x + y, 0) / b.length).toFixed(3) : null; };
  const agg = {};
  for (const cfg of Object.keys(CONFIGS)) for (const xf of [...XFS, "nonspeech"]) {
    const g = scored.filter((r) => r.cfg === cfg && r.xf === xf); if (!g.length) continue;
    if (xf === "nonspeech") { agg[`${cfg} | nonspeech`] = { n: g.length, halluc: g.filter((r) => r.halluc).length, texts: g.map((r) => `${r.id}: ${r.text}`) }; continue; }
    const ok = g.filter((r) => !r.err); const ans = ok.filter((r) => r.answer !== null);
    const bad = ok.map((r) => r.keyRecall < 1 || r.skelCER > 0.25);
    const engEnglishTerms = ok.flatMap((r) => S[r.id].keys.filter((k) => /^[a-z ]+$/.test(k)).map((k) => ({ r, k })));
    agg[`${cfg} | ${xf}`] = {
      n: g.length, errs: g.length - ok.length,
      skelCER: mean(ok.map((r) => r.skelCER)), rawWER: mean(ok.map((r) => r.rawWER)),
      keyRecall: mean(ok.map((r) => r.keyRecall)), keyRawRecall: mean(ok.map((r) => r.keyRawRecall)),
      answerAcc: ans.length ? `${ans.filter((r) => r.answer).length}/${ans.length}` : null,
      shortKeyRecall: mean(ok.filter((r) => r.cat === "short").map((r) => r.keyRecall)),
      wrongScriptClips: ok.filter((r) => r.script.wrongScript).length,
      englishTermsInLatin: engEnglishTerms.length ? +(engEnglishTerms.filter(({ r, k }) => (" " + r.text.toLowerCase().replace(/[^\p{L}\p{M}\s]/gu, " ") + " ").includes(" " + k + " ")).length / engEnglishTerms.length).toFixed(3) : null,
      latinShare: mean(ok.map((r) => r.script.latin)),
      decoyInsertions: ok.reduce((a, r) => a + r.decoys.length, 0),
      confAUROC_bad: ok[0]?.conf != null ? auroc(ok.map((r) => -(r.conf ?? 0)), bad) : null, // higher = lower confidence; 1.0 = confidence perfectly flags bad transcripts
      nBad: bad.filter(Boolean).length,
      msMedian: med(g.map((r) => r.ms)), finalLagMedian: med(g.map((r) => r.finalLagMs)), firstDeltaMedian: med(g.map((r) => r.firstDeltaMs)),
    };
  }
  const outFile = path.join(HERE, "e0-results-2026-10-02.json");
  fs.writeFileSync(outFile, JSON.stringify({ method: { date: "2026-10-02", from: "US cloud build container → eastus2 Foundry resource", stimuli: STIMULI.length, voices: VOICES, transforms: { clean: "gpt-4o-mini-tts child-instructed, 300/600 ms pad", child: "clean, pitch+formant ×1.2 (asetrate/atempo), duration kept", noisy: "child + 2-voice Hindi TV babble at 10 dB SNR" }, nonspeech: NONSPEECH, prompt: ASR_PROMPT, keywords: KEYWORDS, decoys: DECOYS, note: "SYNTHETIC speech. Instrument behaviour only; says nothing about real children's WER." }, agg, rows: scored }, null, 1));
  console.log(JSON.stringify(agg, null, 0).replace(/},"/g, "},\n\""));
  console.log("→", outFile);
}

if (cmd === "gen") await gen(); else if (cmd === "run") await run(); else if (cmd === "score") score(); else console.log("usage: node probe.mjs gen|run|score <workdir>");
