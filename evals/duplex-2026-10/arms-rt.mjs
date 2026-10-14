// duplex bake-off 2026-10, arms (c) and (d): a speech-to-speech service closed-loop on the bake-off scenarios.
//   (c) voicelive  Azure AI Voice Live (centralindia), model gpt-realtime-2.1: server echo cancellation, deep noise
//                  suppression, azure_semantic_vad_multilingual (Hindi listed), input transcription azure-speech
//                  hi-IN + en-IN, an Azure hi-IN DragonHD voice.
//       voicelive-noaec  the same with no echo cancellation and no noise suppression (what the service features buy).
//   (d) realtime   Azure OpenAI gpt-realtime alone (our DEPLOY_REALTIME deployment), semantic_vad, its own voice.
// One WebSocket session per scenario, paced at real time on a simulated phone:
//   1. the service SPEAKS her line (an out-of-band response with "say exactly"); its audio plays out at real time from its
//      first delta;
//   2. the mic = the child-only track, placed against HER ACTUAL playback the way TaxilaFDB places it against her line
//      (after her: gapMs after her playback ends; during her: at the same fraction of her line), plus
//        phone: her played audio through the phone-speaker path (assemble.mjs speakerPath) at COUPLING_DB, no device AEC;
//        clean: her played audio as AEC residue (-30 dB, 40 ms), as the device AEC would leave it;
//   3. like a real client, playback STOPS at input_audio_buffer.speech_started (that is the barge-in) and the service's
//      own interrupt_response cancels its response;
//   4. everything the server says is logged on the session clock: VAD edges, transcripts, response.created, first audio
//      delta, response.done (status, usage).
// Scored by score.mjs against the gold placed on the same clock. Simulated: TTS children, a modelled speaker. Not a phone.
//
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/duplex-2026-10/arms-rt.mjs --bake <dir> --arm voicelive|voicelive-noaec|realtime --variant phone|clean [--conc 3] [--only ..]
import fs from "node:fs";
import path from "node:path";
import { speakerPath, COUPLING_DB } from "./assemble.mjs";
import { ROOT, pool, loadEnv } from "../duplex-real/lib.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), ARM = arg("--arm"), VAR = arg("--variant", "phone"), CONC = Number(arg("--conc", 3));
const ONLY = arg("--only") ? new Set(arg("--only").split(",")) : null;
loadEnv();
const IN_SR = 24000, CH_SR = 16000, TICK = 20;
const dbToLin = (db) => Math.pow(10, db / 20);
const readS16 = (f) => { const b = fs.readFileSync(f); const x = new Float32Array(b.length / 2); for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768; return x; };
const up = (x) => { const n = Math.floor((x.length * IN_SR) / CH_SR), o = new Float32Array(n); for (let i = 0; i < n; i++) { const p = (i * CH_SR) / IN_SR, k = Math.floor(p), f = p - k; o[i] = (x[k] ?? 0) * (1 - f) + (x[k + 1] ?? x[k] ?? 0) * f; } return o; };
const s16b64 = (x) => { const b = Buffer.alloc(x.length * 2); for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), i * 2); return b.toString("base64"); };
const fromB64 = (s) => { const b = Buffer.from(s, "base64"); const x = new Float32Array(b.length / 2); for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768; return x; };

const PERSONA = "You are Asha, a warm AI teacher for an Indian school child (class 4-6). Speak natural Hinglish (Hindi and English mixed), short sentences, one question at a time. Never pretend to be human.";

async function config() {
  if (ARM.startsWith("voicelive")) {
    const host = new URL(process.env.AZURE_AI_CENTRALINDIA_ENDPOINT).host;
    const aec = ARM === "voicelive";
    return {
      url: `wss://${host}/voice-live/realtime?api-version=2026-04-10&model=${process.env.VL_MODEL || "gpt-realtime-2.1"}`,
      headers: { "api-key": process.env.AZURE_AI_CENTRALINDIA_KEY },
      session: {
        instructions: PERSONA, modalities: ["text", "audio"],
        turn_detection: { type: "azure_semantic_vad_multilingual", silence_duration_ms: 500, remove_filler_words: true, create_response: true, interrupt_response: true },
        ...(aec ? { input_audio_noise_reduction: { type: "azure_deep_noise_suppression" }, input_audio_echo_cancellation: { type: "server_echo_cancellation" } } : {}),
        input_audio_transcription: { model: "azure-speech", language: "hi-IN,en-IN" },
        voice: { type: "azure-standard", name: "hi-in-diya:DragonHDOmniIndicNeural" },
      },
      model: process.env.VL_MODEL || "gpt-realtime-2.1", region: "centralindia",
    };
  }
  const { endpoint } = await import(ROOT + "server/azure.js");
  const dep = process.env.DEPLOY_REALTIME || "taxila-realtime";
  return {
    url: `${endpoint("REALTIME").replace(/^https/, "wss")}/realtime?model=${encodeURIComponent(dep)}`,
    headers: { "api-key": process.env.AZURE_OPENAI_API_KEY },
    session: {
      type: "realtime", instructions: PERSONA, output_modalities: ["audio"],
      audio: {
        input: { format: { type: "audio/pcm", rate: 24000 }, transcription: { model: process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe" }, turn_detection: { type: "semantic_vad", eagerness: "auto", create_response: true, interrupt_response: true } },
        output: { format: { type: "audio/pcm", rate: 24000 }, voice: "marin" },
      },
    },
    model: dep, region: "eastus2",
  };
}

async function one(id, cfg) {
  const meta = JSON.parse(fs.readFileSync(path.join(BAKE, `${id}.json`), "utf8"));
  const child = up(readS16(path.join(BAKE, `${id}.child.s16`)));
  const g = meta.gold;
  // the child's span in the child track (ms), and where it must sit relative to HER line
  const cStart = g.childOnset ?? null;
  const goldHer = g.herSpan;
  const ws = new WebSocket(cfg.url, { headers: cfg.headers });
  const ev = [];
  let t0 = 0;
  const now = () => performance.now() - t0;
  await new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error("open timeout")), 25000);
    ws.onerror = (e) => { clearTimeout(to); reject(new Error(`socket error ${e?.message ?? ""}`)); };
    ws.onclose = (e) => { clearTimeout(to); reject(new Error(`closed ${e.code} ${String(e.reason).slice(0, 120)}`)); };
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === "session.created") ws.send(JSON.stringify({ type: "session.update", session: cfg.session }));
      else if (e.type === "session.updated") { clearTimeout(to); resolve(); }
      else if (e.type === "error") { clearTimeout(to); reject(new Error(String(e.error?.message ?? "error").slice(0, 200))); }
    };
  });
  // playback state (her audio, as the phone plays it)
  const play = { buf: [], len: 0, startAt: null, stoppedAt: null, endAt: null, resp: 0 };
  let herDone = false, childAt = null, herPlayedMs = null;
  const log = (type, extra = {}) => ev.push({ t: Math.round(now()), type, ...extra });
  ws.onclose = () => log("closed");
  ws.onmessage = (m) => {
    const e = JSON.parse(m.data);
    const ty = e.type;
    if (/audio\.delta$/.test(ty)) {
      const x = fromB64(e.delta);
      if (play.resp === 0) { play.buf.push(x); play.len += x.length; if (play.startAt === null) { play.startAt = now(); log("her.first_audio"); } }
      else { if (!ev.some((q) => q.type === "reply.first_audio" && q.resp === play.resp)) log("reply.first_audio", { resp: play.resp }); }
      return;
    }
    if (ty === "response.created") { log("response.created", { resp: play.resp }); return; }
    if (ty === "response.done") {
      log("response.done", { resp: play.resp, status: e.response?.status, reason: e.response?.status_details?.reason ?? null, usage: e.response?.usage ?? null });
      if (play.resp === 0) { herDone = true; play.endAt = play.startAt !== null ? play.startAt + (play.len / IN_SR) * 1000 : now(); }
      play.resp++;
      return;
    }
    if (ty === "input_audio_buffer.speech_started") {
      log("speech_started", { a0: e.audio_start_ms ?? null });
      // a real client stops her playback on the server's speech start (barge-in)
      if (play.startAt !== null && play.stoppedAt === null && now() < (play.endAt ?? Infinity)) { play.stoppedAt = now(); log("her.stopped"); }
      return;
    }
    if (ty === "input_audio_buffer.speech_stopped") { log("speech_stopped", { a1: e.audio_end_ms ?? null }); return; }
    if (ty === "input_audio_buffer.committed") { log("committed"); return; }
    if (/input_audio_transcription\.completed$/.test(ty)) { log("transcript", { text: e.transcript ?? "" }); return; }
    if (/input_audio_transcription\.failed$/.test(ty)) { log("transcript_failed"); return; }
    if (/audio_transcript\.done$/.test(ty)) { log("her_text", { resp: play.resp, text: e.transcript ?? "" }); return; }
    if (ty === "error") log("error", { msg: String(e.error?.message ?? "").slice(0, 160), code: e.error?.code ?? null });
  };
  t0 = performance.now();
  // 1. she speaks her line (out of band: no user turn in the conversation)
  ws.send(JSON.stringify({ type: "response.create", response: { instructions: `Say exactly this line in a warm teacher voice, nothing else: "${meta.herText}"` } }));
  // 2. the mic, paced at real time; the child is placed once her playback timeline is known
  const tickN = Math.round((IN_SR * TICK) / 1000);
  const echoOut = []; // her played samples (playback clock), for the echo path
  let micPos = 0; // samples sent
  const maxMs = 45000;
  const echoGain = VAR === "phone" ? dbToLin(COUPLING_DB) : dbToLin(-30);
  let echoBuf = null, echoBuiltLen = -1;
  for (;;) {
    const tNow = now();
    if (tNow > maxMs) { log("timeout"); break; }
    // place the child against her actual playback
    if (childAt === null && play.startAt !== null) {
      const herGoldDur = goldHer.end - goldHer.start;
      if (meta.child && meta.child.start.mode !== "after_her") {
        const frac = (cStart - goldHer.start) / herGoldDur;
        const herDurNow = play.endAt !== null ? play.endAt - play.startAt : null;
        if (herDurNow !== null) childAt = play.startAt + frac * herDurNow - cStart; // child track ms 0 maps to this session ms
      } else if (meta.child && herDone && play.endAt !== null) {
        const herPlayEnd = play.stoppedAt ?? play.endAt;
        childAt = herPlayEnd + meta.child.start.gapMs - cStart;
      }
      if (!meta.child && herDone) childAt = Infinity;
    }
    if (childAt !== null && herPlayedMs === null && herDone) herPlayedMs = (play.stoppedAt ?? play.endAt) - play.startAt;
    // build the mic block for [micPos, micPos + tickN)
    const block = new Float32Array(tickN);
    const blockMs = (micPos / IN_SR) * 1000;
    if (childAt !== null && Number.isFinite(childAt)) {
      const off = Math.round(((blockMs - childAt) * IN_SR) / 1000);
      for (let k = 0; k < tickN; k++) { const j = off + k; if (j >= 0 && j < child.length) block[k] += child[j]; }
    }
    if (play.startAt !== null && play.len > 0) {
      if (echoBuiltLen !== play.len) {
        const all = new Float32Array(play.len); let o = 0; for (const b of play.buf) { all.set(b, o); o += b.length; }
        // only what actually played (stopped at barge-in), then the speaker path (16 kHz model applied at 24 kHz: same shape)
        echoBuf = VAR === "phone" ? speakerPath(all, { delayMs: 60 * 2 / 3, tailMs: 120 * 2 / 3 }) : all; echoBuiltLen = play.len;
      }
      const stopSample = play.stoppedAt !== null ? Math.round(((play.stoppedAt - play.startAt) * IN_SR) / 1000) : Infinity;
      const off = Math.round(((blockMs - play.startAt - (VAR === "clean" ? 40 : 0)) * IN_SR) / 1000);
      for (let k = 0; k < tickN; k++) { const j = off + k; if (j >= 0 && j < echoBuf.length && j < stopSample + (VAR === "phone" ? 2000 : 0)) block[k] += echoBuf[j] * echoGain; }
    }
    // a little mic noise floor
    for (let k = 0; k < tickN; k++) block[k] += (Math.random() - 0.5) * 0.002;
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: s16b64(block) }));
    micPos += tickN;
    // end: child done (+4 s for the reply) or no child and her line over (+3 s)
    const childEndMs = childAt !== null && Number.isFinite(childAt) && g.trueEnd ? childAt + g.trueEnd : null;
    if (herDone && ((childEndMs !== null && blockMs > childEndMs + 6000) || (!meta.child && play.endAt !== null && blockMs > play.endAt + 3000))) break;
    const due = t0 + ((micPos / IN_SR) * 1000);
    const w = due - performance.now();
    if (w > 1) await new Promise((r) => setTimeout(r, w));
  }
  await new Promise((r) => setTimeout(r, 1500));
  try { ws.close(); } catch { /* closed */ }
  return { id, arm: ARM, variant: VAR, model: cfg.model, region: cfg.region, childAt: Number.isFinite(childAt) ? childAt : null, her: { startAt: play.startAt, endAt: play.endAt, stoppedAt: play.stoppedAt, playedMs: herPlayedMs }, events: ev };
}

const cfg = await config();
const idx = JSON.parse(fs.readFileSync(path.join(BAKE, "index.json"), "utf8")).filter((r) => !ONLY || ONLY.has(r.id));
const outDir = path.join(BAKE, "runs");
fs.mkdirSync(outDir, { recursive: true });
let done = 0, failed = 0;
await pool(idx.map((r) => async () => {
  const file = path.join(outDir, `${ARM}.${VAR}.${r.id}.json`);
  if (fs.existsSync(file)) { done++; return; }
  for (let attempt = 0; attempt < 3; attempt++) {
    try { fs.writeFileSync(file, JSON.stringify(await one(r.id, cfg))); break; } catch (e) { console.warn(r.id, attempt, String(e.message).slice(0, 200)); if (attempt === 2) failed++; await new Promise((q) => setTimeout(q, 4000 * (attempt + 1))); }
  }
  if (++done % 10 === 0) console.log(`${ARM}/${VAR} ${done}/${idx.length}`);
}), CONC);
console.log(`${ARM}/${VAR} done ${done}/${idx.length}, failed ${failed}`);
