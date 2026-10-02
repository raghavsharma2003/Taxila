// Cascade-lane latency: child stops speaking → first teacher audio byte, broken down by stage, against the
// REAL local API (in-process, Neon + Azure) — not part of `npm test`, it costs a few cents:
//
//   NODE_USE_ENV_PROXY=1 node evals/cascade-latency.mjs [--turns 6] [--class 4] [--out results.json]
//
// Per turn:
//   1. a synthetic child utterance (gpt-4o-mini-tts told to sound like a shy 9-year-old, then pitch/formant
//      shifted ×1.2 with ffmpeg — the asr-e0 recipe) is streamed in real time (40 ms chunks) into the SAME
//      transcription session config POST /api/voice/stt-token mints (server VAD 0.6 / 900 ms, near_field,
//      logprobs). The browser carries it over WebRTC; this eval uses the WebSocket transport to the same
//      Azure session type, so network-to-Azure is the eval host's, not a child's phone in India;
//   2. the final transcript → POST /api/lesson/turn (the Director + teacher reply, as the runtime sends it) in a
//      lesson started as mode "cascade" — spoken turns, ASR-gated, exactly the shipped lane's server path;
//   3. the reply's stored seq → POST /api/voice/tts-stream, timed to the first PCM byte.
// Stages (ms): endpoint = true speech end → server VAD speech_stopped; stt = → transcript completed;
// director = → /turn response; tts = → first audio byte; total = speech end → first audio byte;
// sound = total + the player's START_LEAD_S (60 ms) + a NOMINAL 50 ms device output latency (not measured:
// CascadeLink.timings from a device run is the real number).
// Speech end is the last sample above -40 dBFS in the clip, placed on the wall clock by the real-time pacing.
// After the run the child turn rows are read back: every spoken turn must carry asr_conf and meta.typed=false.
// SYNTHETIC speech: measures the pipeline, not real children. Caveats: WebSocket (not WebRTC) transcription
// transport; the API runs in-process on the eval host (Neon over HTTP from the sandbox, not the Azure region);
// loopback to tts-stream (no mobile link). TAXILA_SPECULATE=0 measures without speculative replies.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = new URL("..", import.meta.url).pathname;
for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const TURNS = Number(arg("--turns", 6));
const CLASS = Number(arg("--class", 4));
const OUT = arg("--out");

const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const KEY = process.env.AZURE_OPENAI_API_KEY;
const SR = 24000, BPS = SR * 2, CHUNK_MS = 40;
/** src/lesson/ttsStream.ts START_LEAD_S, plus a nominal device output latency (assumed, not measured). */
const START_LEAD_MS = 60, OUTPUT_LATENCY_MS = 50;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WD = fs.mkdtempSync(path.join(os.tmpdir(), "cascade-lat-"));

// Child lines: varied lengths, Hinglish, some answers, one hesitation. Inputs to the TTS, never to a prompt.
const LINES = [
  "Haan didi, main ready hoon.",
  "Mujhe lagta hai teen chauthai bada hai.",
  "Kyunki usme zyada hissa hai... shayad.",
  "Mujhe nahi pata, ek baar aur batao na.",
  "Do tihai matlab teen mein se do hisse.",
  "Achha, toh chaar hisse karne padenge?",
  "Haan, samajh gaya.",
  "Pizza ke aath slice hote hain, toh char slice aadha hai.",
];
const CHILD_VOICE = "Voice of a shy 9-year-old Indian child answering a teacher in class. Natural, a little hesitant, Indian accent, not theatrical.";

async function childClip(text, voice) {
  const r = await fetch(`${E}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input: text, instructions: CHILD_VOICE, response_format: "pcm" }) });
  if (!r.ok) throw new Error(`child tts ${r.status}`);
  const raw = Buffer.from(await r.arrayBuffer());
  const a = path.join(WD, "in.pcm"), b = path.join(WD, "out.pcm");
  fs.writeFileSync(a, raw);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a,
    "-af", `asetrate=${SR * 1.2},aresample=${SR},atempo=${(1 / 1.2).toFixed(4)}`, "-f", "s16le", "-ar", String(SR), "-ac", "1", b]);
  return fs.readFileSync(b);
}
/** ms offset of the last sample above -40 dBFS (the true end of speech in the clip). */
function speechEndMs(pcm) {
  const thr = 32768 * 0.01;
  for (let i = (pcm.length >> 1) - 1; i >= 0; i--) if (Math.abs(pcm.readInt16LE(i * 2)) > thr) return (i / SR) * 1000;
  return 0;
}

// ───────────── API in-process ─────────────
const { handle } = await import("../server/index.js");
const server = http.createServer(handle);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
let cookie = "";
async function api(method, p, body, expect = [200, 201]) {
  const res = await fetch(base + p, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const j = await res.json().catch(() => ({}));
  if (!expect.includes(res.status)) throw new Error(`${method} ${p} → ${res.status} ${JSON.stringify(j)}`);
  return j;
}

// ───────────── transcription session (WebSocket transport, same session config) ─────────────
function sttSocket(session) {
  const ws = new WebSocket(`${E.replace(/^https/, "wss")}/realtime?intent=transcription`, { headers: { "api-key": KEY } });
  const listeners = new Set();
  const ready = new Promise((resolve, reject) => {
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { ...session, audio: { input: { ...session.audio.input, format: { type: "audio/pcm", rate: SR } } } } }));
    ws.onerror = (e) => reject(new Error(`ws error ${e?.message ?? ""}`));
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === "session.updated") resolve();
      if (e.type === "error") console.log("  stt error:", JSON.stringify(e.error).slice(0, 200));
      for (const fn of listeners) fn(e, performance.now());
    };
  });
  return { ws, ready, on: (fn) => (listeners.add(fn), () => listeners.delete(fn)) };
}

/**
 * Stream one utterance in real time; resolve once the audio (with its 3 s tail) is sent and every committed
 * segment is transcribed. A clip the server VAD split into several segments (a mid-utterance pause) is joined;
 * the stage times use the LAST segment, because that is when the runtime would send the turn that ends it.
 */
function speak(stt, pcm) {
  const lead = Buffer.alloc(BPS / 2), tail = Buffer.alloc(BPS * 3);
  const all = Buffer.concat([lead, pcm, tail]);
  const endInAll = 500 + speechEndMs(pcm);
  return new Promise((resolve, reject) => {
    const out = { segments: 0 };
    const committed = [], texts = new Map(), confs = [];
    const timeout = setTimeout(() => { off(); reject(new Error("transcripts incomplete after 25 s")); }, 25_000);
    // Done when the segment that ended AFTER the true end of speech (the last one) and every earlier one are
    // transcribed; the remaining silent tail keeps streaming, as a live mic would.
    const check = () => {
      if (out.vadAt === undefined || out.vadAt < out.speechEndAt || !committed.length || committed.some((id) => !texts.has(id))) return;
      clearTimeout(timeout);
      off();
      out.segments = committed.length;
      out.text = committed.map((id) => texts.get(id)).filter(Boolean).join(" ");
      out.conf = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : undefined;
      resolve(out);
    };
    const off = stt.on((e, at) => {
      if (e.type === "input_audio_buffer.speech_stopped") out.vadAt = at;
      if (e.type === "input_audio_buffer.committed") committed.push(e.item_id);
      if (e.type === "conversation.item.input_audio_transcription.completed" || e.type === "conversation.item.input_audio_transcription.failed") {
        out.finalAt = at;
        texts.set(e.item_id, String(e.transcript || "").trim());
        const lps = (e.logprobs || []).map((l) => l.logprob).filter((v) => typeof v === "number");
        if (lps.length) confs.push(Math.exp(lps.reduce((a, b) => a + b, 0) / lps.length));
        check();
      }
    });
    const t0 = performance.now();
    out.speechEndAt = t0 + endInAll;
    let pos = 0, n = 0;
    const step = (BPS * CHUNK_MS) / 1000;
    const tick = () => {
      if (pos >= all.length) return;
      stt.ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: all.subarray(pos, pos + step).toString("base64") }));
      pos += step;
      n++;
      // Paced against the start time, so drift does not accumulate.
      setTimeout(tick, Math.max(0, t0 + n * CHUNK_MS - performance.now()));
    };
    tick();
  });
}

async function firstByte(lessonId, seq) {
  const t0 = performance.now();
  const res = await fetch(base + "/api/voice/tts-stream", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ lessonId, seq }) });
  if (!res.ok) throw new Error(`tts-stream ${res.status} ${await res.text()}`);
  const reader = res.body.getReader();
  let first = 0, bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!first) first = performance.now();
    bytes += value.length;
  }
  return { firstAt: first, t0, bytes, audioMs: Math.round(bytes / (BPS / 1000)), totalMs: Math.round(performance.now() - t0),
    serverFirstMs: Number(res.headers.get("x-tts-first-ms")), serverSetupMs: Number(res.headers.get("x-tts-setup-ms")), sentences: Number(res.headers.get("x-tts-sentences")), cache: res.headers.get("x-tts-cache") };
}

const rows = [];
let child, lessonId;
const stored = [];
try {
  const st = Date.now();
  await api("POST", "/api/auth/signup", { email: `lat+${st}@taxila.test`, password: `lat-pw-${st}`, name: "Latency", isGuardianAdult: true });
  ({ child } = await api("POST", "/api/children", { firstName: "Aarav", classLevel: CLASS, languagePref: "hinglish", interests: ["cricket"] }));
  await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "cascade" });
  lessonId = s.lessonId;
  console.log(`lesson ${s.lessonId} topic=${s.topic.id} teacher=${s.teacher.id}/${s.teacher.voice} db=${process.env.DB_DRIVER || "neon-http"}`);
  const opening = await firstByte(s.lessonId, s.teacherOpeningSeq);
  console.log(`opening: first byte ${Math.round(opening.firstAt - opening.t0)} ms (server ${opening.serverFirstMs}), ${opening.sentences} sentences, ${opening.audioMs} ms audio`);
  const tok = await api("POST", "/api/voice/stt-token", { lessonId: s.lessonId });
  console.log(`stt-token: ${tok.token.startsWith("ek_") ? "ek_…" : "?"} model=${tok.session.audio.input.transcription.model} vad=${JSON.stringify(tok.session.audio.input.turn_detection)}`);
  console.log("generating synthetic child clips…");
  const clips = [];
  for (let i = 0; i < TURNS; i++) clips.push(await childClip(LINES[i % LINES.length], i % 2 ? "sage" : "coral"));
  const stt = sttSocket(tok.session);
  await stt.ready;
  for (let i = 0; i < TURNS; i++) {
    const heard = await speak(stt, clips[i]);
    const tTurn = performance.now();
    const r = await api("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText: heard.text, ...(heard.conf !== undefined ? { asrConfidence: heard.conf } : {}) });
    const replyAt = performance.now();
    if (!r.teacherReplySeq) { console.log(`  turn ${i + 1}: no reply (${r.move?.kind})`); continue; }
    const tts = await firstByte(s.lessonId, r.teacherReplySeq);
    const row = {
      said: LINES[i % LINES.length], heard: heard.text, conf: heard.conf === undefined ? null : +heard.conf.toFixed(3), move: r.move?.kind,
      reply: r.teacherReply,
      endpoint: Math.round(heard.vadAt - heard.speechEndAt), stt: Math.round(heard.finalAt - heard.vadAt),
      director: Math.round(replyAt - tTurn), tts: Math.round(tts.firstAt - replyAt), total: Math.round(tts.firstAt - heard.speechEndAt),
      sound: Math.round(tts.firstAt - heard.speechEndAt) + START_LEAD_MS + OUTPUT_LATENCY_MS,
      speculation: r.debug?.speculation ? (r.debug.speculation.hit ? "hit" : "miss") : "none", specDiffers: r.debug?.speculation?.differs,
      flags: r.debug?.classification?.flags ? Object.entries(r.debug.classification.flags).filter(([, v]) => v === true).map(([k]) => k).join(",") : "", cls: r.debug?.classification ? `${r.debug.classification.outcome}/${r.debug.classification.source}` : null,
      ttsServerFirst: tts.serverFirstMs, ttsServerSetup: tts.serverSetupMs, segments: heard.segments, sentences: tts.sentences, cache: tts.cache, replyAudioMs: tts.audioMs,
      directorServer: r.debug?.ms, directorTimings: r.debug?.timings?.map((t) => `${t.kind}:${t.ms}`).join(" "),
    };
    rows.push(row);
    console.log(`  turn ${i + 1}: endpoint ${row.endpoint} · stt ${row.stt} · director ${row.director} · tts ${row.tts} = ${row.total} ms  [${row.move}] "${row.heard}" (conf ${row.conf}) → "${row.reply}"`);
    console.log(`           cls ${row.cls} · flags [${row.flags}] · speculation ${row.speculation}${row.specDiffers ? ` (${row.specDiffers.join(" | ")})` : ""} · director calls: ${row.directorTimings ?? "?"} · tts server: setup ${row.ttsServerSetup} first ${row.ttsServerFirst} (${row.sentences} sentences, cache ${row.cache}) · vad segments ${row.segments}`);
    if (r.end) break;
  }
  stt.ws.close();
  // The lane fix, checked on the real rows: spoken cascade turns are stored as spoken.
  const { q } = await import("../server/db.js");
  stored.push(...await q("select seq, asr_conf, meta from turn where lesson_id = $1 and speaker = 'child' order by seq", [lessonId]));
} finally {
  if (child) await api("DELETE", "/api/children", { childId: child.id }).catch((e) => console.log(`could not delete the test child: ${e.message}`));
  server.close();
  fs.rmSync(WD, { recursive: true, force: true });
}

const stat = (k) => {
  const v = rows.map((r) => r[k]).filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const q = (p) => v[Math.min(v.length - 1, Math.floor(p * (v.length - 1) + 0.5))];
  return { n: v.length, median: q(0.5), p90: q(0.9), min: v[0], max: v.at(-1) };
};
const summary = Object.fromEntries(["endpoint", "stt", "director", "tts", "total", "sound"].map((k) => [k, stat(k)]));
console.log("\nstage      n  median   p90   min   max  (ms)");
for (const [k, s] of Object.entries(summary)) if (s) console.log(`${k.padEnd(9)} ${String(s.n).padStart(2)} ${String(s.median).padStart(7)} ${String(s.p90).padStart(5)} ${String(s.min).padStart(5)} ${String(s.max).padStart(5)}`);
const within = rows.filter((r) => r.total <= 2000).length;
console.log(`budget ≤ 2000 ms (first byte): ${within}/${rows.length} turns`);
const spec = rows.filter((r) => r.speculation !== "none");
console.log(`speculative replies: ${spec.filter((r) => r.speculation === "hit").length}/${spec.length} hit (TAXILA_SPECULATE=${process.env.TAXILA_SPECULATE ?? "3 (default)"})`);
const spoken = stored.filter((t) => t.meta?.typed === false && typeof t.asr_conf === "number");
console.log(`stored child turns spoken (asr_conf set, typed:false): ${spoken.length}/${stored.length}`);
summary.storedSpoken = { spoken: spoken.length, of: stored.length };
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ method: { date: new Date().toISOString().slice(0, 10), turns: rows.length, classLevel: CLASS, from: os.hostname(), note: `synthetic child speech; WebSocket transcription transport; in-process API (Neon HTTP from the eval host); lesson mode cascade; sound = first byte + ${START_LEAD_MS} ms lead + ${OUTPUT_LATENCY_MS} ms nominal output latency; TAXILA_SPECULATE=${process.env.TAXILA_SPECULATE ?? "3"}` }, summary, rows }, null, 1));
process.exit(rows.length && spoken.length === stored.length ? 0 : 1);
