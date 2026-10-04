// Realtime soak (BUILD-PLAN W2-D #1; smooth-reliability G7): N parallel realtime "lessons" for M minutes on the live
// deployment, the way the product mints them (server/routes/lesson.js realtimeSession → server/voice/realtimeSession.js
// shapeSession: truncation retention_ratio, the pace knob's VAD silence). Each lesson sends one child turn every
// TURN_S seconds and records, per response: request → first audio delta (a "silence" is > 5 s, or a failure),
// failures by code (inference_rate_limit_exceeded = the quota), usage, and every rate_limits.updated.
//
// Method notes (say them with the numbers): the child turn is TEXT (conversation.item.create input_text), not audio,
// so input tokens are lower than a spoken lesson's; set SOAK_WAV=<24 kHz mono PCM16 wav> to append that audio as the
// child turn instead. The acceptance run is from the Azure probe fleet in Central India (BUILD-PLAN §1.7); a sandbox
// run is a quota measurement, not a latency one.
//
//   set -a; . ./.env.local; set +a
//   NODE_USE_ENV_PROXY=1 WS_FROM=<dir with node_modules/ws>/ node evals/realtime-soak.mjs \
//     [--lessons 4] [--minutes 20] [--turn-s 15] [--model taxila-realtime] [--no-truncation] [--out file.json]
import fs from "node:fs";
import { createRequire } from "node:module";
import { realtimeSession } from "../server/routes/lesson.js";
import { realtimeSeam } from "../server/voice/realtimeSession.js";

const require = createRequire(process.env.WS_FROM ? `${process.env.WS_FROM.replace(/\/?$/, "/")}x.js` : import.meta.url);
const WebSocket = require("ws");

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const LESSONS = +arg("lessons", 4);
const MINUTES = +arg("minutes", 20);
const TURN_S = +arg("turn-s", 15);
const MODEL = arg("model", process.env.DEPLOY_REALTIME || "taxila-realtime");
const TRUNCATION = !process.argv.includes("--no-truncation");
const OUT = arg("out", null);
const SILENCE_MS = 5000;
const HOST = new URL(process.env.AZURE_OPENAI_ENDPOINT).host;
const KEY = process.env.AZURE_OPENAI_API_KEY;

// A lesson-sized instruction (G7 measured the real one at 4,137 characters, ~1.2k tokens).
const INSTR = [
  "You are Asha, an AI teacher for a 10-year-old in class 5, on a live voice call. You are an AI; never say otherwise.",
  "Language: mirror the child; Hinglish by default (Hindi grammar, English maths words).",
  "Topic: comparing fractions with unlike denominators. Skills: equivalent fractions, common denominators, comparing.",
  "Misconceptions to watch: bigger denominator means bigger fraction; comparing numerators only.",
  ...Array.from({ length: 24 }, (_, i) => `Kit note ${i + 1}: item ${i + 1} asks the child to compare two fractions such as ${i + 2}/${i + 4} and ${i + 1}/${i + 3}; key: use a common denominator.`),
  "If the child mentions harm or danger: stop teaching, stay calm, give Childline 1098 and Tele-MANAS 14416, tell a trusted adult.",
  "LAST AND MOST IMPORTANT, turn shape: max 25 words per turn. One idea. Then stop and let the child talk.",
].join("\n");
const CHILD = ["teen bata chaar bada hai kya?", "mujhe nahi pata", "do bata teen", "kyunki neeche wala number bada hai", "achha samajh gaya", "phir se batao", "chaar bata chhe", "same hai dono?"];
const wavPcm = process.env.SOAK_WAV ? fs.readFileSync(process.env.SOAK_WAV).subarray(44) : null;

function session() {
  const base = realtimeSession({ instructions: INSTR, voice: "marin" });
  const shaped = realtimeSeam.shapeSession({ ...base, model: MODEL }, { kind: "lesson", pace: { waitNudgeSec: 8, endpointSilenceMs: 900 } });
  if (!TRUNCATION) delete shaped.truncation;
  // A soak drives turns itself: no server VAD responses.
  shaped.audio = { ...shaped.audio, input: { ...shaped.audio.input, turn_detection: null } };
  return shaped;
}

function lesson(idx, until) {
  return new Promise((resolve) => {
    const rec = { lesson: idx, responses: [], rateLimits: [], errors: [], opened: false };
    const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${MODEL}`, { headers: { "api-key": KEY } });
    let turn = 0, sentAt = 0, firstAudio = null, timer = null, waiting = false;
    const finish = () => { clearTimeout(timer); try { ws.close(); } catch {} resolve(rec); };
    const next = () => {
      if (Date.now() >= until) return finish();
      turn++;
      const text = CHILD[(turn + idx) % CHILD.length];
      if (wavPcm) {
        for (let o = 0; o < wavPcm.length; o += 9600) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: wavPcm.subarray(o, o + 9600).toString("base64") }));
        ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      } else {
        ws.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } }));
      }
      ws.send(JSON.stringify({ type: "response.create" }));
      sentAt = performance.now();
      firstAudio = null;
      waiting = true;
    };
    ws.on("open", () => {
      rec.opened = true;
      ws.send(JSON.stringify({ type: "session.update", session: session() }));
    });
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "session.updated" && turn === 0) next();
      else if ((ev.type === "response.output_audio.delta" || ev.type === "response.audio.delta") && firstAudio === null) firstAudio = Math.round(performance.now() - sentAt);
      else if (ev.type === "rate_limits.updated") rec.rateLimits.push({ at: Date.now(), limits: ev.rate_limits });
      else if (ev.type === "response.done") {
        const r = ev.response ?? {};
        const code = r.status_details?.error?.code ?? null;
        rec.responses.push({ turn, status: r.status, code, firstAudioMs: firstAudio, totalMs: Math.round(performance.now() - sentAt), usage: r.usage ?? null });
        waiting = false;
        timer = setTimeout(next, Math.max(0, TURN_S * 1000 - (performance.now() - sentAt)));
      } else if (ev.type === "error") {
        rec.errors.push({ at: Date.now(), code: ev.error?.code, message: String(ev.error?.message ?? "").slice(0, 160) });
        if (waiting && /rate_limit/.test(String(ev.error?.code))) { waiting = false; timer = setTimeout(next, TURN_S * 1000); }
      }
    });
    ws.on("error", (e) => { rec.errors.push({ at: Date.now(), code: "ws", message: String(e).slice(0, 160) }); finish(); });
    ws.on("unexpected-response", (_q, r) => { rec.errors.push({ at: Date.now(), code: `http_${r.statusCode}` }); finish(); });
    ws.on("close", () => finish());
  });
}

const until = Date.now() + MINUTES * 60_000;
const t0 = Date.now();
const runs = await Promise.all(Array.from({ length: LESSONS }, (_, i) => new Promise((r) => setTimeout(r, i * 1500)).then(() => lesson(i, until))));
const all = runs.flatMap((r) => r.responses);
const failed = all.filter((r) => r.status !== "completed");
const silences = all.filter((r) => r.status !== "completed" || r.firstAudioMs === null || r.firstAudioMs > SILENCE_MS);
const fa = all.map((r) => r.firstAudioMs).filter((v) => v !== null).sort((a, b) => a - b);
const pct = (p) => (fa.length ? fa[Math.min(fa.length - 1, Math.floor((p / 100) * fa.length))] : null);
const minTokens = Math.min(...runs.flatMap((r) => r.rateLimits.flatMap((x) => (x.limits ?? []).filter((l) => l.name === "tokens").map((l) => l.remaining))), Infinity);
const summary = {
  date: new Date().toISOString().slice(0, 10), model: MODEL, lessons: LESSONS, minutes: MINUTES, turnS: TURN_S, truncation: TRUNCATION,
  input: wavPcm ? "audio (SOAK_WAV)" : "text child turns", from: process.env.SOAK_FROM || "sandbox (US) → eastus2",
  responses: all.length, failed: failed.length, failedByCode: failed.reduce((m, r) => ((m[r.code ?? r.status] = (m[r.code ?? r.status] ?? 0) + 1), m), {}),
  silencesOver5s: silences.length, firstAudioMs: { p50: pct(50), p90: pct(90), max: fa.at(-1) ?? null },
  minTokensRemaining: Number.isFinite(minTokens) ? minTokens : null, wsErrors: runs.reduce((n, r) => n + r.errors.length, 0),
  sessionsOpened: runs.filter((r) => r.opened).length, wallS: Math.round((Date.now() - t0) / 1000),
  inputTokensLastTurn: runs.map((r) => r.responses.at(-1)?.usage?.input_tokens ?? null),
};
console.log(JSON.stringify(summary, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ summary, runs }, null, 1));
process.exit(0);
