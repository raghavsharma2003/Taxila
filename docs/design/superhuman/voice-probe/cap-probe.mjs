// cap-probe.mjs — capability probe for the HUMAN-VOICE expressive layer (2026-10-04).
//
// Question per (engine x markup): does the engine ACCEPT the markup (HTTP 200), does it SPEAK the markup as
// words (ASR leak: "laughter", "breathing", "amused", "sighing", "[", stage-direction words), and does the
// audio change (duration delta vs plain)? Whether a laugh/breath is actually AUDIBLE is decided by the
// audio judge (judge.mjs) and by ear (blind page), never by this script.
//
// Run: set -a; . /home/user/Taxila/.env.local; set +a
//      NODE_USE_ENV_PROXY=1 node docs/design/superhuman/voice-probe/cap-probe.mjs
// Stimuli are TEST INPUTS ONLY, never product prompt text.
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "cap"); mkdirSync(OUT, { recursive: true });
const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const REGION = process.env.SPEECH_REGION || "eastus2";

const LINE_HI = "अरे, यह तो बहुत funny था! चलो, अब अगला सवाल देखते हैं।";
const LINE_EN = "Oh, that was really funny! Okay, let us look at the next question.";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const speak = (loc, voice, inner, params) =>
  `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${loc}"><voice name="${voice}"${params ? ` parameters="${params}"` : ""}>${inner}</voice></speak>`;

const V = {
  diya: ["en-IN", "en-IN-Diya:DragonHDLatestNeural"],
  arjun: ["en-IN", "en-IN-Arjun:DragonHDLatestNeural"],
  priyaF: ["hi-IN", "hi-IN-Priya:MAI-Voice-2.1-Flash"],
  priyaHD: ["hi-IN", "hi-IN-Priya:MAI-Voice-2.1"],
  dhruvF: ["hi-IN", "hi-IN-Dhruv:MAI-Voice-2.1-Flash"],
  omniSwara: ["hi-IN", "hi-IN-Swara:DragonHDOmniLatestNeural"],
};
const CASES = [];
for (const [k, [loc, voice]] of Object.entries(V)) {
  const isDHD = /DragonHD/.test(voice);
  for (const [lid, line] of [["hi", LINE_HI], ["en", LINE_EN]]) {
    if (!isDHD && lid === "en") continue;
    CASES.push({ id: `${k}-${lid}-plain`, ssml: speak(loc, voice, esc(line)) });
    CASES.push({ id: `${k}-${lid}-laughter-bracket`, ssml: speak(loc, voice, `[laughter] ${esc(line)}`) });
    CASES.push({ id: `${k}-${lid}-breathing-bracket`, ssml: speak(loc, voice, `${esc(line.split(/[!।]/)[0])}! [breathing] ${esc(line.split(/[!।]/)[1] || "")}`) });
    CASES.push({ id: `${k}-${lid}-sigh-bracket`, ssml: speak(loc, voice, `[sighing] ${esc(line)}`) });
    CASES.push({ id: `${k}-${lid}-style-amused-bracket`, ssml: speak(loc, voice, `[amused] ${esc(line)}`) });
    CASES.push({ id: `${k}-${lid}-style-amused-expressas`, ssml: speak(loc, voice, `<mstts:express-as style="amused">${esc(line)}</mstts:express-as>`) });
    CASES.push({ id: `${k}-${lid}-break700`, ssml: speak(loc, voice, `${esc(line.split(/[!।]/)[0])}! <break time="700ms"/> ${esc(line.split(/[!।]/)[1] || "")}`) });
    if (!isDHD) CASES.push({ id: `${k}-${lid}-style-joyful-expressas`, ssml: speak(loc, voice, `<mstts:express-as style="joyful">${esc(line)}</mstts:express-as>`) });
    if (isDHD) CASES.push({ id: `${k}-${lid}-temp0.9`, ssml: speak(loc, voice, esc(line), "temperature=0.9") });
  }
}
// gpt-4o-mini-tts: no markup; delivery by instructions + spelled laughter.
const TTS = [
  { id: "4omtts-marin-hi-plain", voice: "marin", input: LINE_HI, instructions: "" },
  { id: "4omtts-marin-hi-instr-laugh", voice: "marin", input: LINE_HI, instructions: "Accent: native Indian. Begin with a short, genuine, soft chuckle before the first word, then speak amused and warm; a small breath before the second sentence." },
  { id: "4omtts-marin-hi-spelled-haha", voice: "marin", input: "हाहा... " + LINE_HI, instructions: "Accent: native Indian. The opening haha is a real soft laugh, not a word." },
  { id: "4omtts-marin-hi-bracket", voice: "marin", input: "[laughs softly] " + LINE_HI, instructions: "Accent: native Indian." },
];

const LEAK = /laugh|breath|sigh|amused|bracket|softly|chuckl|हंस|हँस|सांस|साँस|\[|\]/i;
const dur = (f) => +(+execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim()).toFixed(2);
async function asr(file) {
  const fd = new FormData(); fd.append("file", new Blob([await import("node:fs").then((m) => m.readFileSync(file))], { type: "audio/mpeg" }), "a.mp3");
  const base = OAI.replace(/\/openai\/v1$/, "");
  const r = await fetch(`${base}/openai/deployments/${process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe"}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  return r.ok ? (await r.json()).text : `ERR ${r.status}`;
}
async function timed(url, opts) {
  const t0 = performance.now(); const r = await fetch(url, opts);
  if (!r.ok) return { err: `HTTP ${r.status} ${(await r.text()).slice(0, 160)}` };
  const rd = r.body.getReader(); const ch = []; let ttfb = null;
  for (;;) { const { done, value } = await rd.read(); if (done) break; if (ttfb === null) ttfb = performance.now() - t0; ch.push(Buffer.from(value)); }
  return { buf: Buffer.concat(ch), ttfb: Math.round(ttfb), total: Math.round(performance.now() - t0) };
}
const rows = [];
async function run(id, p) {
  let r; for (let i = 0; i < 3; i++) { try { r = await p(); } catch (e) { r = { err: "EXC " + (e.cause?.code || e.message) }; } if (!r.err || !/EXC|HTTP (429|5)/.test(r.err)) break; await new Promise((s) => setTimeout(s, 2500 * (i + 1))); }
  if (r.err || !r.buf.length) { rows.push({ id, err: r.err || "empty audio" }); console.log(id, r.err || "empty"); return; }
  const f = join(OUT, `${id}.mp3`); writeFileSync(f, r.buf);
  const said = await asr(f);
  const row = { id, ttfb: r.ttfb, total: r.total, dur: dur(f), asr: said, leak: LEAK.test(said) };
  rows.push(row); console.log(JSON.stringify(row));
}
for (const c of CASES) await run(c.id, () => timed(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
  headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3", "User-Agent": "taxila-human-voice" }, body: c.ssml }));
for (const t of TTS) await run(t.id, () => timed(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice: t.voice, input: t.input, response_format: "mp3", ...(t.instructions ? { instructions: t.instructions } : {}) }) }));
writeFileSync(join(HERE, "cap-results.json"), JSON.stringify(rows, null, 1));
