// Low-end / patchy-network probe (2026-10-02): what the degraded voice rungs cost in bytes and time.
// Measures, from wherever it runs (record the location in the results):
//   A. gpt-4o-mini-tts: first byte, wall, bytes and kbps per response_format (opus / aac / mp3 / pcm)
//      for one fixed teacher-length turn (~25 words). This is the cascade / walkie-talkie rung's
//      downlink cost and its data-saver choice.
//   B. gpt-4o-transcribe: latency and upload bytes for a ~4 s synthetic child clip sent as Ogg-Opus vs WAV.
//      This is the push-to-talk store-and-forward rung's uplink cost.
//   C. taxila-fast (text) streaming: time to first token and to the first sentence end, the middle of the
//      cascade.
// Usage: set -a; . ./.env.local; set +a; node docs/research/design/low-end-cascade-probe.mjs [n]
// Output: docs/research/design/low-end-cascade-probe-2026-10-02.json (no audio is kept).
import fs from "fs";
import { execFileSync } from "child_process";
import os from "os";
import path from "path";

const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, ""); // …/openai/v1
const TTS = process.env.DEPLOY_TTS || "gpt-4o-mini-tts";
const STT = process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe";
const FAST = process.env.DEPLOY_FAST || "taxila-fast";
const N = +(process.argv[2] || 4);
const ONLY = process.env.ONLY || ""; // "fast" re-runs part C only and merges into the existing JSON
const EFFORT = process.env.EFFORT || "none";
if (!KEY || !OAI) { console.error("env not loaded"); process.exit(1); }
const now = () => performance.now();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lowend-"));
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };

// Stimuli are measurement inputs, not prompt text.
const TEACHER_TURN = "Accha, dekho. Teen chauthai matlab ek roti ke chaar barabar tukde, aur unme se teen tumhare paas. Ab batao, do tihai bada hai ya chhota?";
const CHILD_TURN = "Didi mujhe lagta hai do tihai bada hai kyunki do chhota number hai";

async function tts(format, voice = "marin", input = TEACHER_TURN, instructions) {
  const body = { model: TTS, voice, input, response_format: format };
  if (instructions) body.instructions = instructions;
  const t0 = now();
  const r = await fetch(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) return { err: `HTTP ${r.status} ${(await r.text()).slice(0, 160)}` };
  const reader = r.body.getReader(); const chunks = []; let ttfb = null;
  for (;;) { const { done, value } = await reader.read(); if (done) break; if (ttfb === null) ttfb = now() - t0; chunks.push(Buffer.from(value)); }
  return { buf: Buffer.concat(chunks), ttfb, wall: now() - t0 };
}
function durationOf(buf, ext) {
  if (ext === "pcm") return buf.length / 48000; // 24 kHz s16le mono
  const f = path.join(tmp, `a.${ext}`); fs.writeFileSync(f, buf);
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();
  return +out;
}

const OUT = new URL("./low-end-cascade-probe-2026-10-02.json", import.meta.url);
const results = ONLY && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : { date: new Date().toISOString(), host: "cloud build container (US); add India<->eastus2 RTT for real users", n: N, tts: {}, stt: {}, fast: {} };

// A. TTS formats
if (!ONLY) for (const fmt of ["opus", "aac", "mp3", "pcm"]) {
  const rows = [];
  for (let i = 0; i < N; i++) {
    const r = await tts(fmt);
    if (r.err) { rows.push({ err: r.err }); continue; }
    const ext = fmt === "aac" ? "aac" : fmt === "opus" ? "ogg" : fmt;
    const dur = durationOf(r.buf, ext);
    rows.push({ ttfb: Math.round(r.ttfb), wall: Math.round(r.wall), bytes: r.buf.length, dur: +dur.toFixed(2), kbps: +((r.buf.length * 8) / dur / 1000).toFixed(1) });
  }
  const ok = rows.filter((x) => !x.err);
  results.tts[fmt] = { rows, median: ok.length ? { ttfb: med(ok.map((x) => x.ttfb)), wall: med(ok.map((x) => x.wall)), bytes: med(ok.map((x) => x.bytes)), kbps: med(ok.map((x) => x.kbps)), dur: med(ok.map((x) => x.dur)) } : null };
  console.log("tts", fmt, JSON.stringify(results.tts[fmt].median), rows.filter((x) => x.err).map((x) => x.err));
}

// B. STT upload formats: one synthetic child clip, re-encoded locally so both arms carry identical speech.
if (!ONLY) {
const child = await tts("pcm", "coral", CHILD_TURN, "Voice: a shy nine-year-old Indian child, slightly hesitant, speaking Hindi.");
if (child.err) { console.error(child.err); process.exit(1); }
const pcmF = path.join(tmp, "child.pcm"); fs.writeFileSync(pcmF, child.buf);
const wavF = path.join(tmp, "child16k.wav"); const oggF = path.join(tmp, "child.ogg");
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", pcmF, "-ar", "16000", wavF]);
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", pcmF, "-c:a", "libopus", "-b:a", "16k", "-application", "voip", oggF]);
results.stt.clipSeconds = +(child.buf.length / 48000).toFixed(2);
for (const [arm, f, type] of [["wav16k", wavF, "audio/wav"], ["ogg-opus-16k", oggF, "audio/ogg"]]) {
  const buf = fs.readFileSync(f); const rows = [];
  for (let i = 0; i < N; i++) {
    const fd = new FormData(); fd.append("file", new Blob([buf], { type }), path.basename(f));
    const base = OAI.replace(/\/openai\/v1$/, "");
    const t0 = now();
    const r = await fetch(`${base}/openai/deployments/${STT}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
    const wall = now() - t0;
    if (!r.ok) { rows.push({ err: `HTTP ${r.status} ${(await r.text()).slice(0, 160)}` }); continue; }
    const j = await r.json();
    rows.push({ wall: Math.round(wall), text: (j.text || "").slice(0, 120) });
  }
  const ok = rows.filter((x) => !x.err);
  results.stt[arm] = { uploadBytes: buf.length, rows, medianWall: med(ok.map((x) => x.wall)) };
  console.log("stt", arm, buf.length, "bytes", results.stt[arm].medianWall, "ms", ok[0]?.text, rows.filter((x) => x.err).map((x) => x.err));
}
}

// C. Text model streaming: first token and first sentence end.
if (!ONLY || ONLY === "fast") {
  const rows = [];
  for (let i = 0; i < N; i++) {
    const body = { model: FAST, stream: true, max_completion_tokens: 600, reasoning_effort: EFFORT, messages: [
      { role: "system", content: "Hinglish primary-school teacher on a voice call with a 9-year-old. Reply in at most 25 words, one idea, end with a question." },
      { role: "user", content: CHILD_TURN } ] };
    const t0 = now();
    const r = await fetch(`${OAI}/chat/completions`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { rows.push({ err: `HTTP ${r.status} ${(await r.text()).slice(0, 160)}` }); continue; }
    const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "", text = "", first = null, sentence = null;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true });
      let k; while ((k = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, k).trim(); buf = buf.slice(k + 1);
        if (!line.startsWith("data:") || line.includes("[DONE]")) continue;
        try { const d = JSON.parse(line.slice(5)).choices?.[0]?.delta?.content; if (d) { if (first === null) first = now() - t0; text += d; if (sentence === null && /[.?!।]/.test(text)) sentence = now() - t0; } } catch {}
      }
    }
    rows.push({ firstToken: Math.round(first ?? -1), firstSentence: Math.round(sentence ?? -1), wall: Math.round(now() - t0), words: text.trim().split(/\s+/).length });
  }
  const ok = rows.filter((x) => !x.err);
  results.fast = { reasoning_effort: EFFORT, rows, median: { firstToken: med(ok.map((x) => x.firstToken)), firstSentence: med(ok.map((x) => x.firstSentence)), wall: med(ok.map((x) => x.wall)) } };
  console.log("fast", JSON.stringify(results.fast.median), rows.filter((x) => x.err).map((x) => x.err));
}

// D. Server-side re-encode of the TTS turn for the data-saver downlink (libopus VBR, voip mode).
if (!ONLY || ONLY === "transcode") {
  const r = await tts("pcm");
  if (!r.err) {
    const pcmF = path.join(tmp, "turn.pcm"); fs.writeFileSync(pcmF, r.buf);
    const dur = r.buf.length / 48000; const rows = [];
    for (const kb of [12, 16, 20, 24, 32]) {
      const o = path.join(tmp, `t${kb}.ogg`); const t0 = now();
      execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", pcmF, "-c:a", "libopus", "-b:a", `${kb}k`, "-application", "voip", "-frame_duration", "60", o]);
      const bytes = fs.statSync(o).size;
      rows.push({ target_kbps: kb, bytes, kbps: +((bytes * 8) / dur / 1000).toFixed(1), encode_ms: Math.round(now() - t0) });
    }
    results.transcode = { seconds: +dur.toFixed(2), encoder: "ffmpeg libopus voip 60 ms frames, 4-vCPU build container, encode_ms includes ffmpeg process start", rows };
    console.log("transcode", JSON.stringify(rows));
  }
}

fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
fs.rmSync(tmp, { recursive: true, force: true });
console.log("wrote low-end-cascade-probe-2026-10-02.json");
