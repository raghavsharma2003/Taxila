// G1-spoken-notation probe, 2026-10-02.
// Engines: RT = taxila-realtime (gpt-realtime-2.1, lane A, voice marin, audio out + its own transcript)
//          TTS = gpt-4o-mini-tts (narration twin, voice marin)
// Arms:    W = item posed as WRITTEN in the kit (notation inline); P = item posed PRE-RENDERED (the `spoken` field)
// Modes:   en / hl / hi (see items.mjs)
// Every audio is back-transcribed by taxila-transcribe (gpt-4o-transcribe) with a script-convention-only prompt
// (no vocabulary list; ASR recitation law). Scoring is score.mjs.
// Run: set -a; . /home/user/Taxila/.env.local; set +a; node probe.mjs [engine=rt|tts|all] [limit]
// Never prints the key.
import fs from "fs";
import { ITEMS } from "./items.mjs";

const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
const BASE = OAI.replace(/\/openai\/v1$/, "");
const HOST = new URL(OAI).host;
const TR = process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe";
const ENGINE = process.argv[2] || "all";
const LIMIT = +(process.argv[3] || 999);
const DIR = new URL("./", import.meta.url);
const OUT = new URL("./raw.json", DIR);
const CLIPS = new URL("./clips/", DIR); fs.mkdirSync(CLIPS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Minimal lane-A context: shapes and notes only, matching VOICE-TEACHER §2 order (character → lesson → language → last).
const LANG = {
  en: "LANGUAGE: English mode. The child studies in an English-medium school. Speak English only.",
  hl: "LANGUAGE: Hinglish mode. The child studies in an English-medium school. Hindi grammar and everyday words; maths and science words and numbers in English as the school uses them.",
  hi: "LANGUAGE: Hindi mode. The child studies in a Hindi-medium school (NCERT Hindi books). Speak Hindi; use the Hindi-medium textbook terms.",
};
const instr = (mode, itemText) => [
  "You are Asha, a warm AI teacher on a live voice call with one child in class 6 (NCERT).",
  `LESSON NOW: practice phase. Pose the item below to the child now, exactly as the kit gives it (kit content is the one thing you say as given). Do not answer it.\nITEM: ${itemText}`,
  LANG[mode],
  "LAST: one short lead-in at most, then pose the item, then stop and wait.",
].join("\n");
const CHILD = { en: "Okay, next one.", hl: "Haan didi, agla.", hi: "हाँ दीदी, अगला।" };
const TTS_NOTE = {
  en: "A warm Indian school teacher speaking clear Indian English to a child.",
  hl: "A warm Indian school teacher speaking natural Hinglish to a child, Hindi frame with English school words.",
  hi: "A warm Indian school teacher speaking clear Hindi to a child.",
};
const ASR_PROMPT = { en: "Verbatim transcript. Write every number, symbol and unit as the spoken words, never as digits or symbols.",
  hl: "Verbatim transcript in Latin script. Write every number, symbol and unit as the spoken words, never as digits or symbols.",
  hi: "Verbatim transcript in Devanagari. Write every number, symbol and unit as the spoken words, never as digits or symbols." };

const wav = (pcm) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };

async function asr(pcm, mode) {
  for (let a = 1; a <= 4; a++) {
    const fd = new FormData();
    fd.append("file", new Blob([wav(pcm)], { type: "audio/wav" }), "a.wav");
    fd.append("language", mode === "en" ? "en" : "hi");
    fd.append("prompt", ASR_PROMPT[mode]);
    const r = await fetch(`${BASE}/openai/deployments/${TR}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
    if (r.status === 429) { await sleep(4000 * a); continue; }
    if (!r.ok) return `ERR HTTP ${r.status}`;
    return (await r.json()).text || "";
  }
  return "ERR 429";
}

async function tts(text, mode) {
  for (let a = 1; a <= 4; a++) {
    const r = await fetch(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice: "marin", input: text, instructions: TTS_NOTE[mode], response_format: "pcm" }) });
    if (r.status === 429) { await sleep(5000 * a); continue; }
    if (!r.ok) throw new Error(`tts HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
    return Buffer.from(await r.arrayBuffer());
  }
  throw new Error("tts 429");
}

// One realtime session per job; a single response (fresh context, so no convention carry-over between items).
function rt(mode, itemText) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${process.env.RT_MODEL || "taxila-realtime"}`, { headers: { "api-key": KEY } });
    let text = "", chunks = [], done = false, sent = false;
    const finish = (err) => { if (done) return; done = true; try { ws.close(); } catch {} resolve({ err, text: text.trim(), pcm: Buffer.concat(chunks) }); };
    const timer = setTimeout(() => finish("timeout"), 60_000);
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions: instr(mode, itemText), output_modalities: ["audio"],
      audio: { input: { format: { type: "audio/pcm", rate: 24000 }, turn_detection: null }, output: { voice: "marin" } } } }));
    ws.onmessage = (m) => {
      const ev = JSON.parse(String(m.data));
      if (ev.type === "session.updated" && !sent) { sent = true;
        ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: CHILD[mode] }] } }));
        ws.send(JSON.stringify({ type: "response.create" })); }
      else if (ev.type === "response.output_audio.delta") chunks.push(Buffer.from(ev.delta, "base64"));
      else if (ev.type === "response.output_audio_transcript.delta") text += ev.delta;
      else if (ev.type === "response.done") { clearTimeout(timer); finish(ev.response?.status === "completed" ? null : `status ${ev.response?.status}`); }
      else if (ev.type === "error") { clearTimeout(timer); finish(JSON.stringify(ev.error).slice(0, 200)); }
    };
    ws.onerror = (e) => { clearTimeout(timer); finish(String(e?.message || "ws error")); };
  });
}

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { rows: [] };
const have = new Set(prev.rows.filter((r) => !r.err).map((r) => `${r.engine}|${r.arm}|${r.mode}|${r.id}`));
const rows = prev.rows.filter((r) => !r.err);
const save = () => fs.writeFileSync(OUT, JSON.stringify({ date: "2026-10-02", rt: "taxila-realtime (gpt-realtime-2.1) marin", tts: "gpt-4o-mini-tts marin", asr: TR,
  instr_template: instr("hl", "<ITEM>"), lang: LANG, tts_note: TTS_NOTE, asr_prompt: ASR_PROMPT, rows }, null, 1));

const jobs = [];
for (const engine of ENGINE === "all" ? ["rt", "tts"] : [ENGINE])
  for (const it of ITEMS.slice(0, LIMIT)) for (const mode of ["en", "hl", "hi"]) for (const arm of ["W", "P"])
    if (!have.has(`${engine}|${arm}|${mode}|${it.id}`)) jobs.push({ engine, arm, mode, it });
console.log(`${jobs.length} jobs`);

const starts = []; let k = 0;
async function worker(engine) {
  for (;;) {
    const idx = jobs.findIndex((j, i) => i >= 0 && j.engine === engine && !j.taken);
    if (idx < 0) return; const j = jobs[idx]; j.taken = true;
    const input = j.it[j.arm === "W" ? "w" : "s"][j.mode];
    let row = { engine: j.engine, arm: j.arm, mode: j.mode, id: j.it.id, cls: j.it.cls, input };
    try {
      let pcm;
      if (j.engine === "rt") {
        for (;;) { const now = Date.now(); while (starts.length && now - starts[0] > 61_000) starts.shift(); if (starts.length < 8) break; await sleep(1500); }
        starts.push(Date.now());
        let r = await rt(j.mode, input);
        if (r.err) { await sleep(8000); starts.push(Date.now()); r = await rt(j.mode, input); }
        if (r.err) throw new Error(r.err);
        row.model_text = r.text; pcm = r.pcm;
      } else pcm = await tts(input, j.mode);
      row.audio_s = +(pcm.length / 48000).toFixed(2);
      const f = `${j.engine}-${j.arm}-${j.mode}-${j.it.id}.wav`;
      fs.writeFileSync(new URL(f, CLIPS), wav(pcm)); row.clip = `clips/${f}`;
      row.asr = await asr(pcm, j.mode);
    } catch (e) { row.err = String(e.message || e); }
    rows.push(row); save();
    console.log(`${row.engine} ${row.arm} ${row.mode} ${row.id.padEnd(4)} ${row.err ? "ERR " + row.err : `${row.audio_s}s | ${(row.model_text ?? "").slice(0, 70)} || ${row.asr.slice(0, 70)}`}`);
  }
}
const ws = [];
if (ENGINE !== "tts") ws.push(worker("rt"), worker("rt"), worker("rt"));
if (ENGINE !== "rt") ws.push(worker("tts"), worker("tts"));
await Promise.all(ws);
save();
console.log(`done: ${rows.length} rows, ${rows.filter((r) => r.err).length} errors`);
