// gen-listening-samples.mjs — blinded listening samples for the teacher-voice ear test (2026-10-02).
//
// TEST STIMULI ONLY. The PASSAGES below are listening material for a blind ear panel. They are written
// as one real lesson's moves (OPEN with callback; FRAME + EXPLAIN + CHOICE-question) so that a listener
// judges a voice on teacher-shaped speech. They must NEVER be copied into a teacher prompt, a kit, or a
// few-shot block: sentence-shaped text in a prompt gets recited (companion-tech.md `recited-prompt`).
//
// Phases:
//   gen   — synthesise every arm, write samples/raw/<code>.<ext>, write samples/KEY.json (unblinded)
//   post  — duration/loudness, blinded listening copies samples/<code>.mp3 (trimmed, loudness-matched,
//           one format), catch trials (degraded controls + hidden repeats), ASR round-trip, manifest
// Run:
//   set -a; . /home/user/Taxila/.env.local; set +a
//   NODE_USE_ENV_PROXY=1 WS_FROM=<dir with ws@8>/ node gen-listening-samples.mjs samples gen
//   NODE_USE_ENV_PROXY=1 node gen-listening-samples.mjs samples post
// Never prints the key.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";

const OUT = path.resolve(process.argv[2] || "samples");
const PHASE = process.argv[3] || "all";
const RAW = path.join(OUT, "raw");
const KEYF = path.join(OUT, "KEY.json");
fs.mkdirSync(RAW, { recursive: true });

const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "");
const HOST = OAI ? new URL(OAI).host : "";
const TTS = process.env.DEPLOY_TTS || "gpt-4o-mini-tts";
const RT = process.env.DEPLOY_REALTIME || "taxila-realtime";
const TR = process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => performance.now();

// ---------------------------------------------------------------------------------------------
// STIMULI (listening material, not prompt text). Child: Riya, class 4 (P1/P2), class 3 (P3).
// keys = content words for the ASR round-trip, with the spellings an ASR may return in either script.
export const PASSAGES = {
  P1: { label: "Greeting + memory callback (Hinglish, Roman script)", lang: "hinglish", script: "roman",
    text: "Hello Riya! Kaisi ho aaj? Arre haan, pichhli baar tumne bataya tha na ki Sunday ko nani aane wali hain... aur ki nani ke haath ke aloo parathe duniya mein sabse best hote hain. Toh? Aayi nani? Parathe mile?",
    keys: [["riya", "रिया"], ["pichhli", "pichli", "पिछली"], ["sunday", "संडे"], ["nani", "नानी"], ["aloo", "alu", "आलू"], ["parathe", "parathas", "पराठे", "परांठे"], ["duniya", "दुनिया"]] },
  P1m: { label: "Greeting + memory callback (Hinglish, mixed script)", lang: "hinglish", script: "mixed", base: "P1",
    text: "Hello Riya! कैसी हो आज? अरे हाँ, पिछली बार तुमने बताया था ना कि Sunday को नानी आने वाली हैं... और कि नानी के हाथ के आलू पराठे दुनिया में सबसे best होते हैं। तो? आई नानी? पराठे मिले?",
    keys: null },
  P2: { label: "Equivalent fractions with a pizza (Hinglish, Roman script)", lang: "hinglish", script: "roman",
    text: "Achha, ek pizza socho. Usko do barabar hisson mein kaata, aur tumne ek hissa liya... yaani half, one by two. Ab wahi pizza chaar barabar slices mein kaato. Half pizza ke liye ab kitne slices lene padenge? Do, hai na? Toh one by two aur two by four dikhte alag hain, par pizza utna hi milta hai. Inhe kehte hain equivalent fractions. Achha, ek baat batao... agar pizza aath slices mein kata ho, toh half ke liye kitne slices logi?",
    keys: [["pizza", "पिज़्ज़ा", "पिज्जा", "पिज़ा"], ["barabar", "बराबर"], ["half", "हाफ"], ["slices", "slice", "स्लाइस", "स्लाइसेस"], ["equivalent", "इक्विवेलेंट", "इक्वीवेलेंट", "इक्विवैलेंट"], ["fractions", "fraction", "फ्रैक्शंस", "फ्रैक्शन्स", "फ्रेक्शन"], ["aath", "आठ", "8", "eight"], ["chaar", "char", "चार", "4", "four"]] },
  P2m: { label: "Equivalent fractions with a pizza (Hinglish, mixed script)", lang: "hinglish", script: "mixed", base: "P2",
    text: "अच्छा, एक pizza सोचो। उसको दो बराबर हिस्सों में काटा, और तुमने एक हिस्सा लिया... यानी half, one by two. अब वही pizza चार बराबर slices में काटो। Half pizza के लिए अब कितने slices लेने पड़ेंगे? दो, है ना? तो one by two और two by four दिखते अलग हैं, पर pizza उतना ही मिलता है। इन्हें कहते हैं equivalent fractions. अच्छा, एक बात बताओ... अगर pizza आठ slices में कटा हो, तो half के लिए कितने slices लोगी?",
    keys: null },
  P3: { label: "Equivalent fractions with a pizza (pure Hindi, Devanagari, class 3)", lang: "hindi", script: "devanagari",
    text: "अच्छा, एक पिज़्ज़ा सोचो। उसे दो बराबर टुकड़ों में काटा, और तुमने एक टुकड़ा लिया... यानी आधा पिज़्ज़ा। अब वही पिज़्ज़ा चार बराबर टुकड़ों में काटो। आधे पिज़्ज़ा के लिए अब कितने टुकड़े लेने होंगे? दो, है ना? तो एक बटा दो और दो बटा चार देखने में अलग हैं, पर पिज़्ज़ा उतना ही मिलता है। इन्हें तुल्य भिन्न कहते हैं। अच्छा, एक बात बताओ... अगर पिज़्ज़ा आठ टुकड़ों में कटा हो, तो आधे के लिए कितने टुकड़े लोगी?",
    keys: [["पिज़्ज़ा", "पिज्जा", "पिज़ा", "pizza"], ["बराबर"], ["टुकड़ों", "टुकड़े", "टुकडों", "टुकडे"], ["आधा", "आधे"], ["बटा"], ["तुल्य"], ["भिन्न"], ["आठ", "8"]] },
};
PASSAGES.P1m.keys = PASSAGES.P1.keys;
PASSAGES.P2m.keys = PASSAGES.P2.keys;

// A DESCRIPTION of a voice for the steerable engines. Not a line she could say.
export const VOICE_NOTE = [
  "Voice: a warm young Indian woman in her mid-twenties, a primary-school teacher from North India. Hindi is her first language; her English is natural Indian English.",
  "Accent: Indian throughout, never American, British or global-neutral. Hindi words with native pronunciation: retroflex t and d, aspirated kh gh th dh bh, nasal vowels kept, soft dental t and d. English words inside a Hindi sentence said the way an Indian teacher says them.",
  "Audience: one child of eight or nine sitting beside her; a real one-to-one conversation, not a class, not a recording.",
  "Tone: warm, smiling, patient, gently playful; real interest when she asks something.",
  "Pacing: unhurried and conversational; small natural pauses at commas and at '...'; questions rise and leave room for an answer.",
  "Avoid: announcer, news-reader, audiobook narrator, cartoon or sing-song kids-TV delivery.",
].join("\n");
// Realtime only: the read-verbatim rule goes LAST (position is mechanism).
const READER_LAST = "Task, last and most important: this is a voice recording session. Each user message is a script. Say the script aloud exactly, word for word, in its own language mix. Add nothing, drop nothing, no greeting, no comment, no reply to what it says.";

const TTS_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"];
const RT_VOICES = ["marin", "cedar", "coral", "shimmer"];
const ARMS = [];
for (const p of ["P1", "P2", "P3"]) for (const v of TTS_VOICES) ARMS.push({ engine: "gpt-4o-mini-tts", voice: v, passage: p, instructions: "voice-note" });
for (const p of ["P1m", "P2m"]) for (const v of ["marin", "coral", "shimmer", "sage"]) ARMS.push({ engine: "gpt-4o-mini-tts", voice: v, passage: p, instructions: "voice-note" });
for (const v of ["marin", "coral"]) ARMS.push({ engine: "gpt-4o-mini-tts", voice: v, passage: "P2", instructions: "none" }); // instruction-off control
for (const v of RT_VOICES) for (const p of ["P1", "P2", "P3"]) ARMS.push({ engine: "gpt-realtime-2.1", deployment: RT, voice: v, passage: p, instructions: "voice-note+reader" });

// Pre-registered realtime fidelity rule (fixed before generation): keep the FIRST take whose own
// output transcript matches the script at token similarity >= 0.80; otherwise retry, max 3 takes.
// This guards "did it read the script", never "did it sound nicer" (Gurukul: never regenerate for a nicer sample).
const FIDELITY_MIN = 0.8, MAX_TAKES = 3;

// Blind codes: random, not derived from arm/item/counter/hash (earbench: all of those leak).
const ALPHA = "ACDEFHJKLMNPQRTUVWXY3479";
const used = new Set();
function code() { for (;;) { let c = ""; for (let i = 0; i < 4; i++) c += ALPHA[crypto.randomInt(ALPHA.length)]; if (!used.has(c)) { used.add(c); return c; } } }

const norm = (t) => t.toLowerCase().normalize("NFC").replace(/़/g, "").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
function tokSim(a, b) { // 2*LCS / (|a|+|b|) over normalised tokens
  const x = norm(a), y = norm(b); if (!x.length || !y.length) return 0;
  const dp = Array.from({ length: x.length + 1 }, () => new Uint16Array(y.length + 1));
  for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) dp[i][j] = x[i - 1] === y[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return +(2 * dp[x.length][y.length] / (x.length + y.length)).toFixed(3);
}
const keyRecall = (keys, text) => { const t = " " + norm(text).join(" ") + " "; const hit = keys.map((alts) => alts.some((a) => t.includes(" " + norm(a).join(" ")) || t.includes(norm(a).join(" ")))); return { recall: +(hit.filter(Boolean).length / keys.length).toFixed(2), missed: keys.filter((_, i) => !hit[i]).map((k) => k[0]) }; };

function pcmToWav(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// ---------------------------------------------------------------------------------------------
async function ttsOnce(arm) {
  const body = { model: TTS, voice: arm.voice, input: PASSAGES[arm.passage].text, response_format: "mp3" };
  if (arm.instructions !== "none") body.instructions = VOICE_NOTE;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const t0 = now();
    let r;
    try { r = await fetch(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
    catch (e) { if (attempt < 4) { await sleep(3000 * attempt); continue; } return { err: `fetch ${String(e).slice(0, 160)}` }; }
    if (r.status === 429 || r.status >= 500) { const ra = +r.headers.get("retry-after") || 5 * attempt; await r.text(); if (attempt < 4) { await sleep(ra * 1000); continue; } }
    if (!r.ok) { const t = await r.text(); let msg = t; try { const j = JSON.parse(t); msg = j.error?.message || t; } catch {} return { err: `HTTP ${r.status}: ${msg.slice(0, 300)}`, http: r.status }; }
    const reader = r.body.getReader(); const chunks = []; let ttfb = null;
    for (;;) { const { done, value } = await reader.read(); if (done) break; if (ttfb === null) ttfb = now() - t0; chunks.push(Buffer.from(value)); }
    return { buf: Buffer.concat(chunks), ttfb_ms: Math.round(ttfb), wall_ms: Math.round(now() - t0), attempts: attempt, content_type: r.headers.get("content-type") };
  }
}

function rtOnce(arm) {
  const require = createRequire(process.env.WS_FROM || import.meta.url);
  const WebSocket = require("ws");
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${arm.deployment}`, { headers: { "api-key": KEY } });
    let t0 = 0, ttfa = null, tx = "", pcm = [], echo = null, done = false;
    const finish = (x) => { if (done) return; done = true; clearTimeout(timer); try { ws.close(); } catch {} resolve(x); };
    const timer = setTimeout(() => finish({ err: "timeout 90s" }), 90000);
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "session.created") {
        ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions: `${VOICE_NOTE}\n\n${READER_LAST}`, output_modalities: ["audio"],
          audio: { input: { turn_detection: null }, output: { voice: arm.voice, format: { type: "audio/pcm", rate: 24000 } } } } }));
      } else if (ev.type === "session.updated" && t0 === 0) {
        echo = ev.session?.audio?.output?.voice ?? null;
        ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: PASSAGES[arm.passage].text }] } }));
        t0 = now();
        ws.send(JSON.stringify({ type: "response.create" }));
      } else if (ev.type === "response.output_audio.delta") { if (ttfa === null) ttfa = now() - t0; pcm.push(Buffer.from(ev.delta, "base64")); }
      else if (ev.type === "response.output_audio_transcript.delta") tx += ev.delta;
      else if (ev.type === "response.done") {
        finish({ pcm: Buffer.concat(pcm), ttfa_ms: ttfa === null ? null : Math.round(ttfa), wall_ms: Math.round(now() - t0), transcript: tx.trim(),
          status: ev.response?.status, status_details: ev.response?.status_details ?? null, usage: ev.response?.usage ?? null, voice_echo: echo });
      } else if (ev.type === "error") finish({ err: `ws error: ${JSON.stringify(ev.error).slice(0, 300)}`, voice_echo: echo });
    });
    ws.on("error", (e) => finish({ err: String(e).slice(0, 200) }));
    ws.on("unexpected-response", (_q, r) => { let b = ""; r.on("data", (d) => (b += d)); r.on("end", () => finish({ err: `HTTP ${r.statusCode} ${b.slice(0, 200)}` })); });
  });
}

async function gen() {
  if (fs.existsSync(KEYF)) { console.error(`${KEYF} exists; refusing to regenerate (never regenerate for a nicer sample). Delete it deliberately to rerun.`); process.exit(2); }
  const key = { schema: "taxila-listening-key/v1", created: new Date().toISOString(), sealed_note: "UNBLINDING FILE. Never give to listeners.", voice_note: VOICE_NOTE, reader_rule_realtime: READER_LAST,
    fidelity_rule: { min_token_similarity: FIDELITY_MIN, max_takes: MAX_TAKES }, passages: PASSAGES, clips: {}, errors: [], takes_discarded: [] };
  const save = () => fs.writeFileSync(KEYF, JSON.stringify(key, null, 1));
  const only = process.env.ARM_FILTER ? new RegExp(process.env.ARM_FILTER) : null; // smoke tests only
  for (const arm of ARMS) {
    const tag = `${arm.engine}|${arm.voice}|${arm.passage}|${arm.instructions}`;
    if (only && !only.test(tag)) continue;
    if (arm.engine === "gpt-4o-mini-tts") {
      const r = await ttsOnce(arm);
      if (r.err) { key.errors.push({ ...arm, error: r.err }); console.log(`ERR ${tag} :: ${r.err}`); save(); await sleep(400); continue; }
      const c = code(); const file = `raw/${c}.mp3`; fs.writeFileSync(path.join(OUT, file), r.buf);
      key.clips[c] = { kind: "arm", ...arm, raw_file: file, bytes: r.buf.length, ttfb_ms: r.ttfb_ms, wall_ms: r.wall_ms, http_attempts: r.attempts, content_type: r.content_type };
      console.log(`ok  ${tag} -> ${c} ${r.buf.length}B ttfb=${r.ttfb_ms} wall=${r.wall_ms}`);
      save(); await sleep(400);
    } else {
      let kept = null;
      for (let take = 1; take <= MAX_TAKES && !kept; take++) {
        const r = await rtOnce(arm);
        if (r.err) { key.errors.push({ ...arm, take, error: r.err, voice_echo: r.voice_echo ?? null }); console.log(`ERR ${tag} take${take} :: ${r.err}`); save(); await sleep(7000); if (/HTTP 4\d\d|invalid|not supported/i.test(r.err)) break; continue; }
        const sim = tokSim(r.transcript, PASSAGES[arm.passage].text);
        const meta = { take, ttfa_ms: r.ttfa_ms, wall_ms: r.wall_ms, audio_s: +(r.pcm.length / 48000).toFixed(2), transcript: r.transcript, script_similarity: sim, status: r.status, usage: r.usage, voice_echo: r.voice_echo };
        if (sim >= FIDELITY_MIN && r.pcm.length > 48000) {
          const c = code(); const file = `raw/${c}.wav`; const wav = pcmToWav(r.pcm); fs.writeFileSync(path.join(OUT, file), wav);
          key.clips[c] = { kind: "arm", ...arm, raw_file: file, bytes: wav.length, ...meta };
          kept = c; console.log(`ok  ${tag} take${take} -> ${c} sim=${sim} ttfa=${r.ttfa_ms} audio=${meta.audio_s}s voice_echo=${r.voice_echo}`);
        } else { key.takes_discarded.push({ ...arm, ...meta, reason: `similarity ${sim} < ${FIDELITY_MIN} or audio < 1 s` }); console.log(`DISCARD ${tag} take${take} sim=${sim} :: ${r.transcript.slice(0, 100)}`); }
        save(); await sleep(7000); // stay under the deployment's 10 RPM
      }
      if (!kept) key.errors.push({ ...arm, error: `no take passed fidelity in ${MAX_TAKES}` });
    }
  }
  save(); console.log(`gen done: ${Object.keys(key.clips).length} clips, ${key.errors.length} errors, ${key.takes_discarded.length} discarded takes`);
}

// ---------------------------------------------------------------------------------------------
const ff = (args) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", ...args], { encoding: "utf8", maxBuffer: 64 << 20 }); if (r.status !== 0) throw new Error(r.stderr.slice(-800)); return r.stderr; };
const dur = (f) => +(+execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).trim()).toFixed(2);
const LN = "I=-20:TP=-2:LRA=11";
let KBPS = process.env.LISTEN_KBPS || "64";
function measure(f) { const e = ff(["-i", f, "-af", `loudnorm=${LN}:print_format=json`, "-f", "null", "-"]); return JSON.parse(e.slice(e.lastIndexOf("{"), e.lastIndexOf("}") + 1)); }
const TRIM = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse";
// Listening copy: trim edge silence, loudness-match (linear, two-pass), uniform 150 ms lead / 400 ms tail, one codec.
function listenCopy(src, dst, extra = "") {
  const tmp = dst + ".trim.wav";
  ff(["-y", "-i", src, "-af", TRIM + (extra ? "," + extra : ""), "-ar", "24000", "-ac", "1", tmp]);
  const m = measure(tmp);
  ff(["-y", "-i", tmp, "-af", `loudnorm=${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,adelay=150:all=1,apad=pad_dur=0.4`,
    "-ar", "24000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", `${KBPS}k`, dst]);
  const trimmed_s = dur(tmp); fs.unlinkSync(tmp);
  const after = measure(dst);
  return { trimmed_speech_s: trimmed_s, listen_lufs: +after.input_i, listen_tp: +after.input_tp, loudnorm_type: m.normalization_type ?? null };
}

async function asr(file) {
  const fd = new FormData();
  fd.append("file", new Blob([fs.readFileSync(file)], { type: file.endsWith(".wav") ? "audio/wav" : "audio/mpeg" }), path.basename(file));
  const base = OAI.replace(/\/openai\/v1$/, ""); // /openai/v1 transcriptions 404 on this resource (probe-voices-hindi.mjs note)
  for (let a = 1; a <= 3; a++) {
    const r = await fetch(`${base}/openai/deployments/${TR}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
    if (r.status === 429 && a < 3) { await sleep(5000 * a); continue; }
    if (!r.ok) return { err: `HTTP ${r.status}` };
    return { text: (await r.json()).text || "" };
  }
}

async function post() {
  const key = JSON.parse(fs.readFileSync(KEYF, "utf8"));
  for (const c of Object.keys(key.clips)) used.add(c);
  const arms = Object.entries(key.clips).filter(([, v]) => v.kind === "arm");
  for (const [c, v] of arms) {
    const src = path.join(OUT, v.raw_file);
    const m = measure(src);
    v.raw_duration_s = dur(src); v.raw_lufs = +m.input_i; v.raw_tp = +m.input_tp;
    Object.assign(v, listenCopy(src, path.join(OUT, `${c}.mp3`)));
    v.listen_file = `${c}.mp3`;
    const words = norm(v.transcript || PASSAGES[v.passage].text).length;
    v.words_per_s = +(words / v.trimmed_speech_s).toFixed(2);
    console.log(`post ${c} ${v.engine}/${v.voice}/${v.passage} raw=${v.raw_duration_s}s ${v.raw_lufs}LUFS -> ${v.listen_lufs}LUFS ${v.trimmed_speech_s}s ${v.words_per_s} w/s`);
  }
  // ASR round-trip on the RAW file (intelligibility proxy only; an LLM ASR autocorrects from context).
  for (const [c, v] of arms) {
    const a = await asr(path.join(OUT, v.raw_file));
    if (a.err) { v.asr = { err: a.err }; console.log(`asr ${c} ERR ${a.err}`); continue; }
    v.asr = { text: a.text, script_similarity: tokSim(a.text, PASSAGES[v.passage].text), ...keyRecall(PASSAGES[v.passage].keys, a.text) };
    console.log(`asr ${c} recall=${v.asr.recall} sim=${v.asr.script_similarity} missed=${v.asr.missed.join(",")}`);
    await sleep(300);
  }
  // Catch trials (hidden among the arms). Chosen at random among eligible clips, recorded in the key.
  const pick = (pred) => { const xs = arms.filter(([, v]) => pred(v)); return xs.length ? xs[crypto.randomInt(xs.length)] : null; };
  const catches = [];
  const dP2 = pick((v) => v.passage === "P2" && v.engine === "gpt-4o-mini-tts" && v.instructions === "voice-note");
  const dP3 = pick((v) => v.passage === "P3" && v.engine === "gpt-realtime-2.1");
  for (const [src, label] of [[dP2, "degraded-control"], [dP3, "degraded-control"]]) {
    if (!src) continue; const c = code();
    const meta = listenCopy(path.join(OUT, src[1].raw_file), path.join(OUT, `${c}.mp3`), "highpass=f=450,lowpass=f=2600,aresample=8000,acrusher=bits=5:mode=log:mix=0.55,aresample=24000");
    key.clips[c] = { kind: label, source_code: src[0], passage: src[1].passage, engine: src[1].engine, voice: src[1].voice, listen_file: `${c}.mp3`, ...meta,
      expect: "clarity and real-teacher ratings well below the same listener's rating of the source clip" };
    catches.push(c);
  }
  const rP1 = pick((v) => v.passage === "P1" && v.engine === "gpt-realtime-2.1");
  const rP2 = pick((v) => v.passage === "P2" && v.engine === "gpt-4o-mini-tts" && v.instructions === "voice-note" && v.voice !== dP2?.[1].voice);
  for (const src of [rP1, rP2]) {
    if (!src) continue; const c = code();
    fs.copyFileSync(path.join(OUT, src[1].listen_file), path.join(OUT, `${c}.mp3`));
    key.clips[c] = { kind: "hidden-repeat", source_code: src[0], passage: src[1].passage, engine: src[1].engine, voice: src[1].voice, listen_file: `${c}.mp3`,
      expect: "within 1 point of the same listener's ratings of the source clip on every axis" };
    catches.push(c);
  }
  // Manifest for the page: codes and passage block only. Base order shuffled; the page reshuffles per listener.
  const blockOf = (p) => (p.startsWith("P1") ? "A" : p.startsWith("P2") ? "B" : "C");
  const manifest = Object.entries(key.clips).map(([c, v]) => ({ code: c, block: blockOf(v.passage) }));
  for (let i = manifest.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [manifest[i], manifest[j]] = [manifest[j], manifest[i]]; }
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
  // Size cap (task: all audio < 40 MB). If over, archive the realtime WAV originals as FLAC: lossless, and
  // verified bit-exact by hashing the decoded PCM16 against the WAV's PCM payload before the WAV is removed.
  const audioBytes = () => [...fs.readdirSync(OUT).filter((f) => /\.(mp3|wav|flac)$/.test(f)).map((f) => path.join(OUT, f)), ...fs.readdirSync(RAW).map((f) => path.join(RAW, f))].reduce((s, f) => s + fs.statSync(f).size, 0);
  const pcmSha = (f) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-i", f, "-f", "s16le", "-ac", "1", "-ar", "24000", "-"], { maxBuffer: 256 << 20 }); return crypto.createHash("sha256").update(r.stdout).digest("hex"); };
  let total = audioBytes(); const archived = [];
  if (total > 39.5e6) {
    for (const [c, v] of Object.entries(key.clips)) {
      if (!v.raw_file?.endsWith(".wav")) continue;
      const wavF = path.join(OUT, v.raw_file), flacF = wavF.replace(/\.wav$/, ".flac");
      const want = crypto.createHash("sha256").update(fs.readFileSync(wavF).subarray(44)).digest("hex");
      ff(["-y", "-i", wavF, "-c:a", "flac", "-compression_level", "8", flacF]);
      const got = pcmSha(flacF);
      if (got !== want) { fs.unlinkSync(flacF); console.log(`flac ${c} MISMATCH, keeping wav`); continue; }
      fs.unlinkSync(wavF); v.raw_file = v.raw_file.replace(/\.wav$/, ".flac"); v.raw_pcm16_sha256 = want; v.raw_archive = "FLAC of the WAV-wrapped PCM16 24 kHz; decoded PCM verified bit-exact (sha256)"; archived.push(c);
    }
    total = audioBytes();
  }
  console.log(`total audio ${(total / 1e6).toFixed(2)} MB${archived.length ? ` after FLAC-archiving ${archived.length} realtime originals` : ""}`);
  key.post = { total_audio_bytes: total, flac_archived: archived, at: new Date().toISOString(), loudness_target: LN, listen_codec: `mp3 libmp3lame ${KBPS} kbps mono 24 kHz`, edge_trim: "-50 dBFS", pads_ms: { lead: 150, tail: 400 }, catches };
  fs.writeFileSync(KEYF, JSON.stringify(key, null, 1));
  console.log(`post done: ${manifest.length} listening clips (${catches.length} catch)`);
}

if (PHASE === "gen" || PHASE === "all") await gen();
if (PHASE === "post" || PHASE === "all") await post();
