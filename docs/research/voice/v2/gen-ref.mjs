#!/usr/bin/env node
// REFERENCE (NOT FOR PRODUCTION) voice samples via OpenRouter — experiments only.
// Production voice must be Azure-billed (azure-only-compute / azure-billed-open-models). These clips exist only
// to answer "how far is the best non-Azure Hinglish voice from what Azure gives us?".
// Usage: set -a; . .env.local; set +a; NODE_USE_ENV_PROXY=1 node docs/research/voice/v2/gen-ref.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { PASSAGES } from "./passages-ref.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, "samples");
const RAW = process.env.REF_RAW_DIR || path.join(HERE, ".raw-ref"); // raw originals stay out of the repo
const KEYF = path.join(OUT, "KEY-ref.json");
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(RAW, { recursive: true });
const OR = process.env.OPENROUTER_API_KEY;
const AZ = process.env.AZURE_OPENAI_API_KEY;
const AZB = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "").replace(/\/openai\/v1$/, "");
const TR = process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Director's note: TTS stimulus steering for the Gemini TTS family (no separate instructions field on OpenRouter).
// Checked per clip by ASR that it was not read aloud.
// Gemini 3.x TTS reads a flat "Read this as ...:" prefix ALOUD (measured: 2/3 clips recited it, as Devanagari
// transliteration). The structured audio-profile / director's-notes / transcript format was not recited (n=1 smoke).
// Every clip is still ASR-checked for note words in both scripts.
const PROFILE = (accent) => (text) => `# AUDIO PROFILE: Ms. Ananya, primary-school teacher
## THE SCENE: a quiet afternoon tutoring session; she sits beside one nine-year-old child.
### DIRECTOR'S NOTES
Style: warm, smiling, patient, gently playful.
Accent: ${accent}
Pacing: conversational, unhurried, small pauses at commas.
#### TRANSCRIPT
${text}`;
const NOTE = PROFILE("native North Indian Hindi speaker (Delhi); Hinglish with natural Indian English.");
const NOTE_NEG = PROFILE("General American; a US news anchor who learned Hindi as an adult, strong American accent on every word."); // negative control
const NOTE_WORDS = ["teacher", "profile", "scene", "director", "transcript", "accent", "pacing", "style", "ananya", "american", "anchor", "टीचर", "प्रोफाइल", "प्रोफ़ाइल", "सीन", "डायरेक्टर", "ट्रांसक्रिप्ट", "एक्सेंट", "पेसिंग", "स्टाइल", "अनन्या", "अमेरिकन", "ऑडियो"];

const ALL = Object.keys(PASSAGES);
const ARMS = [
  ...["Sulafat", "Despina", "Aoede", "Kore", "Leda", "Achernar", "Vindemiatrix"].map((v) => ({ engine: "gemini-3.8-flash-tts", model: "google/gemini-3.8-flash-tts", voice: v, note: NOTE, pcm: true })),
  { engine: "gemini-3.8-flash-tts", model: "google/gemini-3.8-flash-tts", voice: "Sulafat", note: null, pcm: true, arm: "no-note" },
  ...["Sulafat", "Kore"].map((v) => ({ engine: "gemini-3.1-flash-tts-preview", model: "google/gemini-3.1-flash-tts-preview", voice: v, note: NOTE, pcm: true })),
  { engine: "gemini-3.8-flash-lite-tts", model: "google/gemini-3.8-flash-lite-tts", voice: "Sulafat", note: NOTE, pcm: true },
  { engine: "grok-voice-tts-1.0", model: "x-ai/grok-voice-tts-1.0", voice: "ara" },
  { engine: "grok-voice-tts-1.0", model: "x-ai/grok-voice-tts-1.0", voice: "eve" },
  { engine: "fish-s2.1-pro", model: "fish-audio/s2.1-pro", voice: null },
  { engine: "seed-audio-1.0", model: "bytedance-seed/seed-audio-1-0", voice: null },
  { engine: "kokoro-82m (open weights)", model: "hexgrad/kokoro-82m", voice: "hf_alpha" },
  { engine: "minimax-speech-2.8-hd", model: "minimax/speech-2.8-hd", voice: "English_Kind-heartedGirl" },
  { engine: "gemini-3.8-flash-tts", model: "google/gemini-3.8-flash-tts", voice: "Kore", note: NOTE_NEG, pcm: true, arm: "NEGATIVE-CONTROL-american-anchor" },
];

const norm = (t) => t.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
const code = (used) => { let c; do { c = Array.from(crypto.randomBytes(4)).map((b) => "ACDEFHJKMNPQRTUVWXY34679"[b % 24]).join(""); } while (used.has(c)); used.add(c); return c; };

async function tts(arm, text) {
  const input = arm.note ? arm.note(text) : text;
  const body = { model: arm.model, input, response_format: arm.pcm ? "pcm" : "mp3", ...(arm.voice ? { voice: arm.voice } : {}) };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const t0 = performance.now();
    const r = await fetch("https://openrouter.ai/api/v1/audio/speech", { method: "POST", headers: { Authorization: `Bearer ${OR}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const buf = Buffer.from(await r.arrayBuffer());
    const ms = Math.round(performance.now() - t0);
    if (r.ok && buf.length > 2000) return { buf, ms, ctype: r.headers.get("content-type"), gen: r.headers.get("x-generation-id") };
    console.log(`  retry ${attempt} ${arm.model} ${r.status} ${buf.toString("utf8", 0, 200)}`);
    await sleep(3000 * attempt);
  }
  throw new Error("tts failed");
}

async function transcribe(file) {
  const fd = new FormData();
  fd.append("file", new Blob([fs.readFileSync(file)]), path.basename(file));
  fd.append("model", TR);
  for (let a = 0; a < 3; a++) {
    const r = await fetch(`${AZB}/openai/deployments/${TR}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": AZ }, body: fd });
    if (r.ok) return (await r.json()).text || "";
    await sleep(2000);
  }
  return null;
}

const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();

const key = fs.existsSync(KEYF) ? JSON.parse(fs.readFileSync(KEYF, "utf8")) : {
  schema: "taxila-ref-key/v1", created: new Date().toISOString(),
  flag: "reference-not-for-production",
  sealed_note: "UNBLINDING FILE for ref-*.mp3. Never give to listeners. Every entry here is reference-not-for-production (OpenRouter, non-Azure billing).",
  director_note: NOTE("<passage>"), negative_control_note: NOTE_NEG("<passage>"),
  processing: "edge-trim (silenceremove -50 dB), 150 ms lead / 400 ms tail, two-pass loudnorm linear to -24 LUFS / -1 dBTP, mp3 64 kbps mono 24 kHz",
  clips: {},
};
const used = new Set(Object.keys(key.clips));
const done = new Set(Object.values(key.clips).filter((c) => !c.failed).map((c) => c.task_id));
const TASKS = ARMS.flatMap((arm) => ALL.map((p) => ({ arm, p, id: `${arm.model}|${arm.voice}|${arm.arm || ""}|${p}` }))).filter((t) => !done.has(t.id));
let next = 0;
async function worker() { while (next < TASKS.length) { const { arm, p, id } = TASKS[next++]; await one(arm, p, id); } }
async function one(arm, p, id) {
  {
    const P = PASSAGES[p];
    const text = P.text;
    let rec = null;
    for (let take = 1; take <= 3 && !rec; take++) {
      try {
        const r = await tts(arm, text);
        const tag = crypto.createHash("sha1").update(id + take).digest("hex").slice(0, 10);
        const rawExt = arm.pcm ? "wav" : "mp3";
        const raw = path.join(RAW, `${tag}.${rawExt}`);
        if (arm.pcm) { fs.writeFileSync(raw + ".pcm", r.buf); ff(["-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw + ".pcm", raw]); fs.unlinkSync(raw + ".pcm"); }
        else fs.writeFileSync(raw, r.buf);
        const asr = await transcribe(raw);
        const t = asr ? norm(asr) : [];
        const leaked = NOTE_WORDS.filter((w) => t.includes(w) && !norm(text).includes(w));
        if (leaked.length) console.log(`  note-words ${id}: ${leaked}`);
        const rawDur = dur(raw);
        if (leaked.length >= 1 || rawDur < 1.5) { console.log(`DISCARD ${id} take${take} leaked=${leaked} dur=${rawDur}`); continue; }
        rec = { take, raw, ms: r.ms, gen: r.gen, ctype: r.ctype, asr, leaked, rawDur };
      } catch (e) { console.log(`ERR ${id} take${take} ${e.message}`); }
    }
    if (!rec) { key.clips["FAIL-" + crypto.randomBytes(3).toString("hex")] = { model: arm.model, voice: arm.voice, arm: arm.arm || null, passage: p, failed: true, task_id: id }; return; }
    const c = code(used);
    const out = path.join(OUT, `ref-${c}.mp3`);
    const trimmed = path.join(RAW, `${c}.trim.wav`);
    ff(["-i", rec.raw, "-af", "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,adelay=150,apad=pad_dur=0.4", "-ar", "24000", "-ac", "1", trimmed]);
    let meas = null; try { const s = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${trimmed}" -af loudnorm=I=-24:TP=-1:LRA=20:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p'`]).toString(); meas = JSON.parse(s); } catch {}
    const ln = meas ? `loudnorm=I=-24:TP=-1:LRA=20:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true` : "loudnorm=I=-24:TP=-1:LRA=20";
    ff(["-i", trimmed, "-af", ln, "-ar", "24000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", out]);
    key.clips[c] = { flag: "reference-not-for-production", provider: "openrouter", engine: arm.engine, model: arm.model, voice: arm.voice, arm: arm.arm || "director-note", passage: p, task_id: id,
      director_note: arm.note ? (arm.note === NOTE ? "NOTE" : "NOTE_NEG") : null, take: rec.take, wall_ms: rec.ms, generation_id: rec.gen, content_type: rec.ctype,
      raw_duration_s: +rec.rawDur.toFixed(2), duration_s: +dur(out).toFixed(2), input_lufs: meas ? +meas.input_i : null, asr_transcript: rec.asr, note_words_heard: rec.leaked,
      is_negative_control: (arm.arm || "").startsWith("NEGATIVE") };
    fs.writeFileSync(KEYF, JSON.stringify(key, null, 1));
    console.log(`OK ${c} ${arm.engine} ${arm.voice} ${arm.arm || ""} ${p} ${rec.ms}ms ${key.clips[c].duration_s}s`);
  }
}
await Promise.all([1, 2, 3, 4].map(worker));
console.log("done", Object.keys(key.clips).length);
