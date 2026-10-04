// render.mjs — renders the 5 stimulus lines on every arm, PLAIN vs EXPRESSIVE (HUMAN-VOICE.md §9 measurement).
//   plain      = the line as written, the engine's default delivery (accent note only where the engine needs one)
//   expressive = planner.mjs plan (plans.json run 0) compiled for the engine, + same-persona clip splice for DragonHD
// Output: wav/<arm>__<line>__<cond>.wav (scratch, gitignored by size) + timings.json. Splice + metrics: splice.py.
// Run: set -a; . .env.local; set +a; cd docs/design/superhuman/voice-probe
//      NODE_USE_ENV_PROXY=1 WS_FROM=<dir with ws>/ node render.mjs [bank|render] [armRegex]
import fs from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { LINES } from "./lines.mjs";
import { compileDragonHD, compileOmni, compileMAI, compileMiniTTS, compileRealtime } from "./planner.mjs";
const require = createRequire(process.env.WS_FROM || import.meta.url);
const WebSocket = require("ws");
const KEY = process.env.AZURE_OPENAI_API_KEY, OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), HOST = new URL(OAI).host;
const REGION = process.env.SPEECH_REGION || "eastus2";
const MODE = process.argv[2] || "render", FILTER = process.argv[3] ? new RegExp(process.argv[3]) : null;
fs.mkdirSync("wav", { recursive: true }); fs.mkdirSync("bank", { recursive: true });
const PLANS = JSON.parse(fs.readFileSync("plans.json", "utf8"));
const planFor = (id) => PLANS[id].find((r) => r.plan).plan;
const VOICES = JSON.parse(fs.readFileSync(process.env.VOICES_JSON, "utf8"));
const styleList = (n) => VOICES.find((v) => v.ShortName === n)?.StyleList || [];

const ACCENT = "Accent: native Indian throughout. Hindi words with native Hindi pronunciation; English words the way an Indian teacher says them inside a Hindi sentence. Speaking to one child aged about 9, warm and unhurried, never theatrical.";
const wavHdr = (pcm, rate = 24000) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };
const pcmOfWav = (b) => b.subarray(44);
const silence = (ms) => Buffer.alloc(Math.round(24 * ms) * 2);

async function timed(url, opts) {
  for (let a = 0; a < 3; a++) {
    try {
      const t0 = performance.now(); const r = await fetch(url, opts);
      if (!r.ok) { const e = `HTTP ${r.status} ${(await r.text()).slice(0, 160)}`; if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 2500 * (a + 1))); continue; } return { err: e }; }
      const rd = r.body.getReader(); const ch = []; let ttfb = null;
      for (;;) { const { done, value } = await rd.read(); if (done) break; if (ttfb === null) ttfb = performance.now() - t0; ch.push(Buffer.from(value)); }
      return { buf: Buffer.concat(ch), ttfb: Math.round(ttfb), total: Math.round(performance.now() - t0) };
    } catch (e) { if (a === 2) return { err: "EXC " + e.message }; await new Promise((s) => setTimeout(s, 2500)); }
  }
  return { err: "retries" };
}
const azure = (ssml) => timed(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
  headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-human-voice" }, body: ssml });
const miniTTS = (input, voice, instructions) => timed(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input, response_format: "pcm", ...(instructions ? { instructions } : {}) }) });

const READER = `This is a voice rendering task. When the user sends text, say exactly that text aloud, word for word, in the same language mix. Add nothing, omit nothing, no greeting, no comment.`;
function realtime(voice, text, note) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${process.env.DEPLOY_REALTIME || "taxila-realtime"}`, { headers: { "api-key": KEY } });
    let pcm = [], tx = "", t0 = 0, ttfb = null, started = false;
    const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ err: "timeout" }); }, 60000);
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "session.created") ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions: `${note}\n\n${READER}`, output_modalities: ["audio"], audio: { output: { voice } } } }));
      else if (ev.type === "session.updated" && !started) { started = true; ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } })); t0 = performance.now(); ws.send(JSON.stringify({ type: "response.create" })); }
      else if (ev.type === "response.output_audio.delta") { if (ttfb === null) ttfb = Math.round(performance.now() - t0); pcm.push(Buffer.from(ev.delta, "base64")); }
      else if (ev.type === "response.output_audio_transcript.delta") tx += ev.delta;
      else if (ev.type === "response.done") { clearTimeout(timer); ws.close(); resolve({ buf: wavHdr(Buffer.concat(pcm)), ttfb, total: Math.round(performance.now() - t0), said: tx }); }
      else if (ev.type === "error") { clearTimeout(timer); ws.close(); resolve({ err: JSON.stringify(ev.error).slice(0, 200) }); }
    });
    ws.on("error", (e) => { clearTimeout(timer); resolve({ err: String(e) }); });
  });
}

// ───── clip bank: same-persona non-verbals rendered OFFLINE from the persona's Omni model (tags render there) ─────
const BANK_SRC = { diya: "hi-IN-Diya:DragonHDOmniLatestNeural", arjun: "en-IN-Arjun:DragonHDOmniLatestNeural" };
const BANK_ITEMS = { breath: "[breathing]", laugh: "[laughter]", chuckle: "[laughter] हाँ", hum: "हम्म...", sigh_relief: "[sighing]" };
if (MODE === "bank") {
  for (const [p, voice] of Object.entries(BANK_SRC)) for (const [k, t] of Object.entries(BANK_ITEMS)) for (let i = 0; i < 3; i++) {
    const r = await azure(`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hi-IN"><voice name="${voice}">${t}</voice></speak>`);
    if (r.err) { console.log(p, k, i, r.err); continue; }
    fs.writeFileSync(`bank/${p}-${k}-${i}.wav`, r.buf); console.log(p, k, i, r.ttfb, ((r.buf.length - 44) / 48000).toFixed(2));
  }
  process.exit(0);
}

// ───── arms ─────
const ARMS = {
  "4omtts-marin": async (l, cond) => {
    if (cond === "plain") return { ...(await miniTTS(l.text, "marin", ACCENT)), wrapPcm: true };
    const parts = compileMiniTTS(planFor(l.id), ACCENT); const bufs = []; let first = null, total = 0;
    for (const p of parts) { const r = await miniTTS(p.input, "marin", p.instructions); if (r.err) return r; if (first === null) first = r.ttfb; total += r.total; bufs.push(silence(p.pause_before_ms), r.buf); }
    return { buf: wavHdr(Buffer.concat(bufs)), ttfb: first, total, segs: parts.length };
  },
  "dhd-diya": (l, cond) => dhd("en-IN-Diya:DragonHDLatestNeural", "diya", l, cond),
  "dhd-arjun": (l, cond) => dhd("en-IN-Arjun:DragonHDLatestNeural", "arjun", l, cond),
  "omni-diya": (l, cond) => {
    const v = "hi-IN-Diya:DragonHDOmniLatestNeural";
    if (cond === "plain") return azure(`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hi-IN"><voice name="${v}">${l.text}</voice></speak>`);
    const c = compileOmni(planFor(l.id), v); return azure(c.ssml).then((r) => ({ ...r, ssml: c.ssml }));
  },
  "mai-priyaF": (l, cond) => {
    const v = "hi-IN-Priya:MAI-Voice-2.1-Flash";
    if (cond === "plain") return azure(`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hi-IN"><voice name="${v}">${l.text}</voice></speak>`);
    const c = compileMAI(planFor(l.id), v, styleList(v)); return azure(c.ssml).then((r) => ({ ...r, ssml: c.ssml }));
  },
  "rt-marin": (l, cond) => {
    if (cond === "plain") return realtime("marin", l.text, ACCENT);
    const c = compileRealtime(planFor(l.id), ACCENT); return realtime("marin", c.text, c.note).then((r) => ({ ...r, note: c.note }));
  },
};
const bankMs = (p) => { const out = {}; for (const k of Object.keys(BANK_ITEMS)) { const f = `bank/${p}-${k}-0.trim.wav`; if (fs.existsSync(f)) out[k] = Math.round((fs.statSync(f).size - 44) / 48); } return out; };
async function dhd(voice, persona, l, cond) {
  if (cond === "plain") return azure(`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN"><voice name="${voice}">${l.text.replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।.\-]*[ऀ-ॿ।!?]?/g, (m) => { const c = m.replace(/\s+$/, ""); return `<lang xml:lang="hi-IN">${c}</lang>` + m.slice(c.length); })}</voice></speak>`);
  const c = compileDragonHD(planFor(l.id), voice, { clipMs: bankMs(persona) });
  const r = await azure(c.ssml); return { ...r, ssml: c.ssml, gaps: c.gaps, persona };
}

const T = fs.existsSync("timings.json") ? JSON.parse(fs.readFileSync("timings.json", "utf8")) : {};
for (const [arm, fn] of Object.entries(ARMS)) {
  if (FILTER && !FILTER.test(arm)) continue;
  for (const l of LINES) for (const cond of ["plain", "expressive"]) {
    const id = `${arm}__${l.id}__${cond}`;
    const r = await fn(l, cond);
    if (r.err) { console.log(id, r.err); T[id] = { err: r.err }; continue; }
    const buf = r.wrapPcm ? wavHdr(r.buf) : r.buf;
    fs.writeFileSync(`wav/${id}.wav`, buf);
    T[id] = { ttfb: r.ttfb, total: r.total, dur: +((buf.length - 44) / 48000).toFixed(2), segs: r.segs, gaps: r.gaps, persona: r.persona, ssml: r.ssml, note: r.note, said: r.said };
    console.log(id, `ttfb=${r.ttfb} total=${r.total} dur=${T[id].dur}`, r.gaps ? JSON.stringify(r.gaps) : "", r.said ? `said=${r.said.slice(0, 80)}` : "");
    fs.writeFileSync("timings.json", JSON.stringify(T, null, 1));
  }
}
