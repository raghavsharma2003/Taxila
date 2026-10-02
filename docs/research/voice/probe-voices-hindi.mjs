// probe-voices-hindi.mjs — objective gates for the Hindi/Hinglish teacher-voice blind test (2026-10-02).
//
// What it measures (per arm x stimulus): time to first audio, synthesis wall time, audio duration,
// and a key-term ASR round-trip through taxila-transcribe (gpt-4o-transcribe) as an INTELLIGIBILITY
// PROXY. It does NOT measure humanness, warmth or accent identity: those are ear-only axes
// (companion-tech.md §2.3, `azure-tts` rejection: metrics won 15/15 and lost by ear).
//
// Lanes:
//   tts:<voice>          gpt-4o-mini-tts REST /audio/speech (cascade lane)
//   az:<voice>           Azure Speech REST (Neural, DragonHD, MAI-Voice-2.1[-Flash]) (cascade lane)
//   rt:<voice>           gpt-realtime-2.1 native voice over the Azure OpenAI realtime WS (S2S lane)
//   vl:<model>|<voice>   Voice Live WS: gpt-realtime-2.1 / azure-realtime with an Azure voice (S2S lane)
//
// Run (from a dir that has `ws` installed):
//   set -a; . /home/user/Taxila/.env.local; set +a
//   NODE_USE_ENV_PROXY=1 WS_FROM=$PWD/ node probe-voices-hindi.mjs <outdir> [arm,arm,...]
// Stimuli are TTS test inputs, not teacher prompt text. Nothing here is fed to the production prompt.
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
const require = createRequire(process.env.WS_FROM || import.meta.url);
const WebSocket = require("ws");

const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "");      // …/openai/v1
const HOST = new URL(OAI).host;                                                     // …openai.azure.com
const FOUNDRY = new URL(process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT).host;           // …services.ai.azure.com
const SPEECH_REGION = process.env.SPEECH_REGION || "eastus2";
const OUT = process.argv[2] || "./voice-probe-out";
mkdirSync(OUT, { recursive: true });

// Five K-9 teacher-register stimuli, one per script condition (Gurukul bake-off lesson: script is a
// first-class variable). `keys` are bilingual spellings the ASR may return for each key term.
const STIM = [
  { id: "s1-deva", lang: "hi-IN", text: "अच्छा, अब ध्यान से सुनो। जब हम किसी चीज़ को बराबर हिस्सों में बाँटते हैं, तो हर हिस्सा एक भिन्न कहलाता है।",
    keys: [["ध्यान"], ["बराबर"], ["हिस्सों", "हिस्से"], ["भिन्न"], ["कहलाता"]] },
  { id: "s2-roman", lang: "hi-IN", text: "Theek hai, toh denominator humein batata hai ki pizza ke kitne barabar tukde hain. Ab tum batao, kitne tukde khaaye?",
    keys: [["denominator", "डिनॉमिनेटर", "डेनोमिनेटर", "डिनोमिनेटर", "डीनॉमिनेटर", "डेनॉमिनेटर"], ["pizza", "पिज़्ज़ा", "पिज्जा", "पिज़ा", "पिजा"], ["barabar", "बराबर"], ["tukde", "टुकड़े", "टुकडे"], ["khaaye", "khaye", "खाए", "खाये"]] },
  { id: "s3-mixed", lang: "hi-IN", text: "बहुत बढ़िया! Photosynthesis में पौधे sunlight, पानी और carbon dioxide से अपना खाना बनाते हैं।",
    keys: [["photosynthesis", "फोटोसिंथेसिस", "फ़ोटोसिंथेसिस"], ["sunlight", "सनलाइट"], ["पानी", "pani", "paani"], ["carbon", "कार्बन"], ["dioxide", "डाइऑक्साइड", "डाईऑक्साइड", "डायोक्साइड", "डायऑक्साइड", "डाइआक्साइड"]] },
  { id: "s4-numerals", lang: "hi-IN", text: "Rectangle का area होता है length गुणा breadth, यानी 12 cm गुणा 5 cm बराबर 60 square cm।",
    keys: [["rectangle", "रेक्टेंगल", "रेक्टैंगल"], ["12", "बारह", "twelve"], ["5", "पाँच", "पांच", "five"], ["60", "साठ", "sixty"], ["square", "स्क्वायर", "स्क्वेयर", "स्क्वैर", "sq"]] },
  { id: "s5-english", lang: "en-IN", text: "Good try! Let's check it once more. Which one is bigger, three by four or two by three?",
    keys: [["good"], ["check"], ["bigger"], ["three", "3"], ["two", "2"]] },
];

// Accent/register SHAPE for the steerable lanes (gpt-4o-mini-tts instructions, realtime instructions).
// A description of a voice, never a line she could say.
const ACCENT_NOTE = [
  "Voice: a North Indian woman in her late twenties who teaches primary school; Hindi is her first language.",
  "Accent: Indian throughout. Hindi words with native pronunciation: retroflex t/d, aspirated kh/gh/th/dh, nasal vowels kept.",
  "English technical words said the way an Indian teacher says them in a Hindi sentence, not American or British.",
  "Delivery: warm, patient, unhurried, smiling; mid pitch; conversational, not an announcer.",
].join("\n");

const now = () => performance.now();
const pcmToWav = (pcm, rate = 24000) => {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
};
const wavDur = (wav) => (wav.length - 44) / 48000;

async function streamFetch(url, opts) {
  const t0 = now(); const r = await fetch(url, opts);
  if (!r.ok) return { err: `HTTP ${r.status} ${(await r.text()).slice(0, 200)}` };
  const reader = r.body.getReader(); const chunks = []; let ttfa = null;
  for (;;) { const { done, value } = await reader.read(); if (done) break; if (ttfa === null) ttfa = now() - t0; chunks.push(Buffer.from(value)); }
  return { buf: Buffer.concat(chunks), ttfa, wall: now() - t0 };
}

async function laneTTS(voice, s, withNote = true) {
  const body = { model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input: s.text, response_format: "pcm" };
  if (withNote) body.instructions = ACCENT_NOTE;
  const r = await streamFetch(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.err ? r : { ...r, wav: pcmToWav(r.buf) };
}

async function laneAz(voice, s) {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${s.lang}"><voice name="${voice}">${s.text}</voice></speak>`;
  const r = await streamFetch(`https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-voice-probe" }, body: ssml });
  return r.err ? r : { ...r, wav: r.buf };
}

// Realtime lanes: one WS session per voice, one response per stimulus (text-in -> audio-out, verbatim read).
const READER = `${ACCENT_NOTE}\n\nThis is a voice evaluation. When the user sends text, say exactly that text aloud, word for word, in the same language mix. Add nothing, omit nothing, no greeting, no comment.`;
function laneWS({ url, headers, sessionMsg, stims, gapMs }) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url, { headers }); const res = []; let i = -1, t0 = 0, ttfa = null, pcm = [], tx = "", started = false;
    const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ res, err: "timeout" }); }, 60000 + stims.length * 30000);
    const next = async () => {
      i++; if (i >= stims.length) { clearTimeout(timer); ws.close(); return resolve({ res }); }
      if (i > 0 && gapMs) await new Promise((r) => setTimeout(r, gapMs));
      ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: stims[i].text }] } }));
      t0 = now(); ttfa = null; pcm = []; tx = "";
      ws.send(JSON.stringify({ type: "response.create" }));
    };
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if ((ev.type === "session.created") && !started) { ws.send(JSON.stringify(sessionMsg)); }
      else if (ev.type === "session.updated" && !started) { started = true; res.sessionEcho = JSON.stringify(ev.session?.voice ?? ev.session?.audio?.output?.voice ?? null); next(); }
      else if (ev.type === "response.output_audio.delta" || ev.type === "response.audio.delta") { if (ttfa === null) ttfa = now() - t0; pcm.push(Buffer.from(ev.delta, "base64")); }
      else if (ev.type === "response.output_audio_transcript.delta" || ev.type === "response.audio_transcript.delta" || ev.type === "response.text.delta" || ev.type === "response.output_text.delta") tx += ev.delta;
      else if (ev.type === "response.done") {
        const wav = pcmToWav(Buffer.concat(pcm));
        res.push({ stim: stims[i].id, ttfa, wall: now() - t0, wav, said: tx.trim(), status: ev.response?.status, usage: ev.response?.usage });
        next();
      } else if (ev.type === "error") { res.push({ stim: stims[i]?.id, err: JSON.stringify(ev.error).slice(0, 300) }); if (!started) { clearTimeout(timer); ws.close(); resolve({ res, err: "session error" }); } }
    });
    ws.on("error", (e) => { clearTimeout(timer); resolve({ res, err: String(e).slice(0, 200) }); });
    ws.on("unexpected-response", (_q, r) => { let b = ""; r.on("data", (d) => (b += d)); r.on("end", () => { clearTimeout(timer); resolve({ res, err: `HTTP ${r.statusCode} ${b.slice(0, 200)}` }); }); });
  });
}
const laneRT = (voice) => laneWS({
  url: `wss://${HOST}/openai/v1/realtime?model=${process.env.DEPLOY_REALTIME || "taxila-realtime"}`, headers: { "api-key": KEY }, gapMs: 6500, stims: STIM,
  sessionMsg: { type: "session.update", session: { type: "realtime", instructions: READER, output_modalities: ["audio"], audio: { output: { voice } } } },
});
const laneVL = (model, voice) => laneWS({
  url: `wss://${FOUNDRY}/voice-live/realtime?api-version=2026-04-10&model=${model}`, headers: { "api-key": KEY }, gapMs: 1500, stims: STIM,
  sessionMsg: { type: "session.update", session: { instructions: READER, modalities: ["text", "audio"], turn_detection: { type: "server_vad", create_response: false },
    // azure-realtime → its native voices; a bare OpenAI voice name (no locale dash) → type "openai",
    // which isolates Voice Live's own overhead against the direct lane; otherwise an Azure TTS voice.
    voice: model === "azure-realtime" ? { type: "azure-realtime-native", name: voice }
         : /^[a-z]+$/.test(voice) ? { type: "openai", name: voice } : { type: "azure-standard", name: voice } } },
});

// GPT-Live-1 (full duplex, `/openai/v1/live/sessions`). The model is clocked by input audio: with no
// input frames, commentary is acknowledged but never spoken (measured 2026-10-02), so 40 ms silence frames
// are streamed throughout. Each stimulus goes in as `session.commentary.append` ("say aloud, may
// paraphrase"); its clip ends after 1.5 s without an audio delta.
function laneGL(voice) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${HOST}/openai/v1/live/sessions`, { headers: { "api-key": KEY } });
    const res = []; let i = -1, t0 = 0, ttfa = null, pcm = [], tx = "", lastAudio = 0, pump, watch;
    const finish = (err) => { clearInterval(pump); clearInterval(watch); try { ws.send(JSON.stringify({ type: "session.close" })); } catch {} setTimeout(() => { try { ws.close(); } catch {} resolve({ res, err }); }, 1500); };
    const next = () => {
      if (i >= 0) res.push({ stim: STIM[i].id, ttfa, wall: lastAudio - t0, wav: pcmToWav(Buffer.concat(pcm)), said: tx.trim() });
      i++; if (i >= STIM.length) return finish();
      t0 = now(); ttfa = null; pcm = []; tx = ""; lastAudio = 0;
      ws.send(JSON.stringify({ type: "session.commentary.append", delegation_id: null, content: STIM[i].text }));
    };
    ws.on("open", () => ws.send(JSON.stringify({ type: "session.start", session: { model: process.env.DEPLOY_LIVE || "taxila-live", instructions: READER, audio: { output: { voice } } } })));
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "session.started") {
        res.sessionEcho = JSON.stringify(ev.session?.audio?.output?.voice ?? null);
        const sil = Buffer.alloc(1920).toString("base64");
        pump = setInterval(() => { try { ws.send(JSON.stringify({ type: "session.input_audio.append", audio: sil })); } catch {} }, 40);
        watch = setInterval(() => { const t = now(); if (i >= 0 && ((lastAudio && t - lastAudio > 1500) || t - t0 > 25000)) next(); }, 100);
        next();
      } else if (ev.type === "session.output_audio.delta") { if (ttfa === null) ttfa = now() - t0; lastAudio = now(); pcm.push(Buffer.from(ev.delta, "base64")); }
      else if (ev.type === "session.output_transcript.delta") tx += ev.delta;
      else if (ev.type === "error" && i < 0) finish(JSON.stringify(ev.error).slice(0, 200));
    });
    ws.on("error", (e) => finish(String(e).slice(0, 200)));
    ws.on("unexpected-response", (_q, r) => { let b = ""; r.on("data", (d) => (b += d)); r.on("end", () => resolve({ res, err: `HTTP ${r.statusCode} ${b.slice(0, 200)}` })); });
  });
}

// ASR round-trip (intelligibility proxy): fraction of key terms recovered in any accepted spelling.
async function asr(wav) {
  const fd = new FormData();
  fd.append("file", new Blob([wav], { type: "audio/wav" }), "a.wav");
  // The /openai/v1 surface 404s (DeploymentNotFound) for transcriptions on this resource as of
  // 2026-10-02; the legacy deployments route works. TTS and realtime work on /openai/v1.
  const base = OAI.replace(/\/openai\/v1$/, "");
  const r = await fetch(`${base}/openai/deployments/${process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe"}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  if (!r.ok) return { err: `HTTP ${r.status}` };
  return { text: (await r.json()).text || "" };
}
const norm = (t) => t.toLowerCase().normalize("NFC").replace(/[़]/g, "").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ");
const keyRecall = (s, text) => { const t = norm(text); return s.keys.filter((alts) => alts.some((a) => t.includes(norm(a)))).length / s.keys.length; };

const DEFAULT_ARMS = [
  ...["marin", "cedar", "coral", "shimmer", "sage", "ballad", "verse", "ash", "alloy", "echo"].map((v) => `tts:${v}`),
  "tts0:marin", "tts0:coral",
  ...["hi-IN-SwaraNeural", "hi-IN-AartiNeural", "hi-IN-KavyaNeural", "hi-IN-AnanyaNeural", "hi-IN-MadhurNeural", "en-IN-AartiIndicNeural", "en-IN-NeerjaIndicNeural",
      "en-IN-Meera:DragonHDLatestNeural", "en-IN-Diya:DragonHDLatestNeural", "en-IN-Aarti:DragonHDLatestNeural", "hi-IN-Diya:DragonLatestNeural",
      "hi-IN-Kavya:MAI-Voice-2.1-Flash", "hi-IN-Priya:MAI-Voice-2.1-Flash", "hi-IN-Harper:MAI-Voice-2.1-Flash", "hi-IN-Dhruv:MAI-Voice-2.1-Flash", "hi-IN-Kavya:MAI-Voice-2.1"].map((v) => `az:${v}`),
  ...["marin", "cedar", "coral", "shimmer", "sage", "ballad", "verse", "ash", "alloy", "echo"].map((v) => `rt:${v}`),
  "vl:azure-realtime|diya", "vl:azure-realtime|meera", "vl:azure-realtime|aarti",
  "vl:gpt-realtime-2.1|hi-IN-Kavya:MAI-Voice-2.1-Flash", "vl:gpt-realtime-2.1|en-IN-Meera:DragonHDLatestNeural",
];
const arms = process.argv[3] ? process.argv[3].split(",") : DEFAULT_ARMS;
const rows = [];
for (const arm of arms) {
  const [lane, ...rest] = arm.split(":"); const voice = rest.join(":");
  let results = [];
  if (lane === "tts" || lane === "tts0" || lane === "az") {
    for (const s of STIM) {
      const r = lane === "az" ? await laneAz(voice, s) : await laneTTS(voice, s, lane === "tts");
      results.push(r.err ? { stim: s.id, err: r.err } : { stim: s.id, ...r });
    }
  } else if (lane === "rt" || lane === "vl" || lane === "gl") {
    const [m, v] = lane === "vl" ? voice.split("|") : [null, voice];
    const r = lane === "rt" ? await laneRT(v) : lane === "gl" ? await laneGL(v) : await laneVL(m, v);
    results = r.res; if (r.err) results.push({ err: r.err });
    if (r.res.sessionEcho) console.log(`  [${arm}] session voice echo: ${r.res.sessionEcho}`);
  }
  for (const r of results) {
    if (r.err) { rows.push({ arm, stim: r.stim, err: r.err }); console.log(`${arm} ${r.stim ?? ""} ERR ${r.err}`); continue; }
    const s = STIM.find((x) => x.id === r.stim); const dur = wavDur(r.wav);
    const f = `${OUT}/${arm.replace(/[:|]/g, "_")}__${r.stim}.wav`; writeFileSync(f, r.wav);
    const a = dur > 0.2 ? await asr(r.wav) : { text: "" };
    const row = { arm, stim: r.stim, ttfa_ms: Math.round(r.ttfa ?? -1), wall_ms: Math.round(r.wall), audio_s: +dur.toFixed(2),
      key_recall: a.err ? null : +keyRecall(s, a.text).toFixed(2), asr: a.text ?? a.err, said: r.said, status: r.status };
    rows.push(row);
    console.log(`${arm} ${r.stim} ttfa=${row.ttfa_ms} wall=${row.wall_ms} dur=${row.audio_s}s recall=${row.key_recall} :: ${(row.asr || "").slice(0, 90)}`);
  }
}
writeFileSync(`${OUT}/results.json`, JSON.stringify(rows, null, 1));
console.log(`\nwrote ${rows.length} rows to ${OUT}/results.json`);
