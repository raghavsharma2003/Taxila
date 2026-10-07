// duplex-real: the shared harness for running the LIVE duplex bridge (src/duplex/live.ts DuplexLive, the class a lesson
// runs) on REAL recorded speech through the REAL streaming STT lane.
//
// One session = one mic stream (16 kHz s16le) + a schedule of her lines. Two ways to run it:
//   live:   the audio is streamed in REAL TIME (20 ms chunks, 16 → 24 kHz) over the Azure realtime transcription socket
//           with the production session shape; the engine runs on the wall clock beside it, its micro-commit probes go to
//           the socket as input_audio_buffer.commit (exactly what cascadeLink does on the device), and every socket event
//           is logged with its arrival time;
//   replay: a recorded event log is fed back at its recorded times (deterministic; used for before/after on the same
//           STT output). A replay cannot honour probes the engine sends that the recording did not have: reported.
// The device's WebRTC transport, AudioWorklet and an India-to-Azure network path are NOT in this loop (US sandbox →
// eastus2 / southindia over a websocket): labelled in every result.
import fs from "node:fs";
import path from "node:path";
import { yin } from "../../src/voice/dsp.ts";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..") + "/";
export const HOP_MS = 20;
const SR = 16000, HOP = 320, WIN = 640, SR_OUT = 24000;

export function loadEnv() {
  for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

export const q = (arr, p) => { if (!arr.length) return null; const z = [...arr].sort((a, b) => a - b); return Math.round(z[Math.min(z.length - 1, Math.floor((z.length - 1) * p))]); };
export function wilson(k, n) { if (!n) return [0, 0]; const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n)); return [+((c - m) / d).toFixed(3), +((c + m) / d).toFixed(3)]; }
export const rate = (k, n) => ({ k, n, rate: n ? +(k / n).toFixed(3) : null, ci95: wilson(k, n) });

/** s16le buffer → Float32 (-1..1). */
export function f32(buf) { const n = buf.length >> 1, x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = buf.readInt16LE(i * 2) / 32768; return x; }
/** Float32 → s16le buffer. */
export function s16(x) { const b = Buffer.alloc(x.length * 2); for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), i * 2); return b; }

/** Gain that puts the active speech (frames within 30 dB of the 95th percentile) at `target` dBFS (the device AGC's job). */
export function activeGain(x, target = -20) {
  const fr = [];
  for (let i = 0; i + HOP <= x.length; i += HOP) { let s = 0; for (let k = i; k < i + HOP; k++) s += x[k] * x[k]; fr.push(s / HOP); }
  const db = fr.map((p) => 10 * Math.log10(p + 1e-12)).sort((a, b) => a - b);
  const p95 = db[Math.floor(0.95 * (db.length - 1))] ?? -100;
  const act = fr.filter((p) => 10 * Math.log10(p + 1e-12) > p95 - 30);
  const rms = Math.sqrt(act.reduce((a, b) => a + b, 0) / Math.max(1, act.length));
  return Math.pow(10, target / 20) / Math.max(rms, 1e-6);
}

/** The device's 20 ms frames: RMS dB and the shipped YIN f0 (src/voice/dsp.ts), same HOP / WIN / gate as TaxilaFDB and AMI. */
export function framesOf(x) {
  const db = [], f0 = [];
  for (let i = 0; i + HOP <= x.length; i += HOP) {
    let s = 0;
    for (let k = i; k < i + HOP; k++) s += x[k] * x[k];
    const d = 10 * Math.log10(s / HOP + 1e-12);
    let f = null;
    if (d > -45 && i + WIN <= x.length) f = yin(x.subarray(i, i + WIN), SR, 70, 600).f0;
    db.push(+d.toFixed(1));
    f0.push(f ? +f.toFixed(1) : null);
  }
  return { db, f0 };
}

/** Low-level noise bed (the clip's own floor level) so silences are a mic, not digital zero. Deterministic. */
export function noise(n, rmsDb, seed = 1) {
  let s = seed >>> 0 || 1;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const out = new Float32Array(n);
  let b0 = 0, b1 = 0;
  for (let i = 0; i < n; i++) { const w = r() * 2 - 1; b0 = 0.99 * b0 + w * 0.1; b1 = 0.6 * b1 + w * 0.3; out[i] = b0 + b1 + w * 0.2; }
  let e = 0; for (let i = 0; i < n; i++) e += out[i] * out[i];
  const g = Math.pow(10, rmsDb / 20) / Math.sqrt(e / Math.max(1, n) || 1e-12);
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}

/** 16 → 24 kHz linear resample of a Float32 block (the socket takes 24 kHz pcm16). */
export function to24k(x) {
  const n = Math.floor((x.length * SR_OUT) / SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = (i * SR) / SR_OUT, k = Math.floor(p), f = p - k; out[i] = (x[k] ?? 0) * (1 - f) + (x[k + 1] ?? x[k] ?? 0) * f; }
  return out;
}

// ───────────────────────────── the STT lanes ─────────────────────────────

/**
 * Lane socket configs. D4 = production eastus2 (taxila-live-transcribe = gpt-live-transcribe, the sttSession production
 * shape: script prompt, near_field noise reduction, server VAD 1,500 ms as the duplex backstop). MAI = the India lane
 * candidate (taxila-mai-tx2-stream on the South India account; prompt and keywords are refused by that deployment, so
 * language "hi" only; it REFUSES turn_detection ("Turn detection is not supported for this transcription model", probe
 * 2026-10-06), so there is no server VAD backstop: finals come only from client commits, i.e. the engine's probes). Keys are read from env and never printed.
 */
export async function laneSocket(lane) {
  const { sttSession } = await import(ROOT + "server/voice/stt.js");
  const vad = { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: 1500 };
  if (lane === "D4") {
    const { endpoint } = await import(ROOT + "server/azure.js");
    const base = sttSession({ ageBand: "10-15", model: process.env.DUPLEX_REAL_D4 || "taxila-live-transcribe" });
    const session = { ...base, audio: { input: { ...base.audio.input, format: { type: "audio/pcm", rate: SR_OUT }, turn_detection: vad } } };
    return { url: `${endpoint("TRANSCRIBE").replace(/^https/, "wss")}/realtime?intent=transcription`, headers: { "api-key": process.env.AZURE_OPENAI_API_KEY }, session, model: session.audio.input.transcription.model, region: "eastus2" };
  }
  if (lane === "MAI") {
    const host = new URL(process.env.AZURE_AI_SOUTHINDIA_ENDPOINT).host;
    const session = { type: "transcription", audio: { input: { format: { type: "audio/pcm", rate: SR_OUT }, noise_reduction: { type: "near_field" }, transcription: { model: process.env.DUPLEX_REAL_MAI || "taxila-mai-tx2-stream", language: "hi" }, turn_detection: null } } };
    return { url: `wss://${host}/openai/v1/realtime?intent=transcription`, headers: { "api-key": process.env.AZURE_AI_SOUTHINDIA_KEY }, session, model: session.audio.input.transcription.model, region: "southindia" };
  }
  throw new Error(`unknown lane ${lane}`);
}

/** Open a transcription socket; resolves once the session is accepted. Events go to onEvent(rawEvent). */
export async function openStt(lane, onEvent, { retries = 4 } = {}) {
  const cfg = await laneSocket(lane);
  for (let attempt = 0; ; attempt++) {
    const ws = new WebSocket(cfg.url, { headers: cfg.headers });
    const res = await new Promise((resolve) => {
      const to = setTimeout(() => resolve({ ok: false, why: "timeout" }), 20000);
      ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: cfg.session }));
      ws.onerror = () => { clearTimeout(to); resolve({ ok: false, why: "socket error" }); };
      ws.onclose = (e) => { clearTimeout(to); resolve({ ok: false, why: `closed ${e.code}` }); };
      ws.onmessage = (m) => {
        const e = JSON.parse(m.data);
        if (e.type === "session.updated" || e.type === "transcription_session.updated") { clearTimeout(to); resolve({ ok: true }); }
        else if (e.type === "error") { clearTimeout(to); resolve({ ok: false, why: String(e.error?.code ?? e.error?.message ?? "error").slice(0, 120) }); }
      };
    });
    if (res.ok) {
      const errors = [];
      ws.onmessage = (m) => { const e = JSON.parse(m.data); if (e.type === "error") errors.push(String(e.error?.code ?? e.error?.message ?? "").slice(0, 120)); onEvent(e); };
      ws.onclose = () => {};
      return {
        lane, model: cfg.model, region: cfg.region, errors,
        append(f32block) { if (ws.readyState === 1) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: s16(to24k(f32block)).toString("base64") })); },
        commit() { if (ws.readyState === 1) ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); },
        close() { try { ws.close(); } catch { /* closed */ } },
      };
    }
    try { ws.close(); } catch { /* closed */ }
    if (attempt >= retries) throw new Error(`${lane} socket failed: ${res.why}`);
    await new Promise((r) => setTimeout(r, 3000 * 2 ** attempt));
  }
}

// ───────────────────────────── the engine loop ─────────────────────────────

/**
 * Run DuplexLive over one session.
 *   x:      Float32 mic stream at 16 kHz (already gained)
 *   frames: { db[], f0[] } of x (the device features), optional `mask` (Uint8Array: frame → the room floor, see AMI turns)
 *   her:    [{ start, end, text, outDb?: number[] (per-frame output level) }] her lines on the session clock (open loop: a
 *           yield is scored, her audio is not cut; the mic already holds whatever echo the recording has)
 *   stt:    { lane } live, or { replay: events[] } (each { t, raw })
 * Returns { acts: [t, kind, extra][], phases, sttLog: [{t, raw}], stats, logs }.
 */
export async function runSession({ id, x, frames, her = [], stt, band = "B4", mask = null, floorDb = null, log = false, DuplexLive, realtime = true, semantic = null }) {
  const acts = [], phases = [], logs = [], sttLog = [];
  const nFrames = frames.db.length;
  let clock = 0; // ms on the session clock
  let interval = null;
  let socket = null;
  const sim = stt.sim ?? null;
  const port = {
    duck: (lv) => acts.push([clock, "duck", lv]),
    pause: () => { acts.push([clock, "pause"]); return true; },
    resume: () => acts.push([clock, "resume"]),
    stop: () => acts.push([clock, "stop"]),
    commit: (turn) => acts.push([clock, "commit", turn.text, turn.duplex?.engineSummary?.reasons?.[0] ?? null]),
    sttCommit: () => { acts.push([clock, "probe"]); socket?.commit(); sim?.commit(clock); },
    dropReply: () => acts.push([clock, "drop"]),
    fallback: (why) => acts.push([clock, "fallback", why]),
    state: (st) => { if (phases.at(-1)?.[1] !== st.phase) phases.push([clock, st.phase]); },
  };
  // the semantic estimator on the session clock: a cached Azure answer delivered after its own measured latency
  const semPending = [];
  const semFn = semantic ? (req) => new Promise((resolve) => {
    const hit = semantic.lookup(req);
    if (!hit) { semantic.miss?.(req); resolve(null); return; }
    semPending.push({ due: req.t + hit.latMs, resolve, val: { forTextHash: req.textHash, pComplete: hit.pComplete, pHoldWanted: hit.pHoldWanted ?? undefined, asksHer: hit.asksHer ?? undefined, offTask: hit.offTask ?? undefined, deployment: hit.deployment, issuedAt: req.t, arrivedAt: req.t + hit.latMs } });
  }) : undefined;
  const live = new DuplexLive({ lessonId: `real-${id}`, port, ...(semFn ? { semantic: semFn } : {}), now: () => clock, setInterval: (fn) => { interval = fn; return 1; }, clearInterval: () => { interval = null; }, band,
    log: (row) => { if (log || row.action === "YIELD" || row.action === "HUSH" || row.action === "SPEAK") logs.push([row.t, row.action, (row.reasons ?? []).join("+"), row.phase]); } });
  live.start();
  // errors go where CascadeDuplex.onServerError sends them: an empty micro-commit tells the fan-in (when the engine has it)
  const deliver = (raw) => {
    sttLog.push({ t: clock, raw: slim(raw) });
    if (raw.type === "error") { if ((raw.error?.code ?? raw.error) === "input_audio_buffer_commit_empty") live.commitEmpty?.(); return; }
    live.stt(raw);
  };
  let replayIdx = 0;
  const replay = stt.replay ?? (sim ? [] : null);
  const pending = [];
  if (!replay) socket = await openStt(stt.lane, (e) => pending.push(e));
  const simItems = new Map();
  const simRaw = (ev) => {
    // SttSim events → the realtime socket's raw events (the same mapping as evals/p1-duplex/ami.mjs)
    if (ev.type === "partial") {
      const prev = simItems.get(ev.itemId) ?? "";
      if (!simItems.has(ev.itemId)) deliver({ type: "input_audio_buffer.speech_started", item_id: ev.itemId, audio_start_ms: ev.audioStartMs ?? ev.t });
      const delta = ev.text.startsWith(prev) ? ev.text.slice(prev.length) : (prev ? " " : "") + ev.text;
      simItems.set(ev.itemId, ev.text);
      if (delta) deliver({ type: "conversation.item.input_audio_transcription.delta", item_id: ev.itemId, delta });
    } else if (ev.type === "speech_stopped") deliver({ type: "input_audio_buffer.speech_stopped", item_id: ev.itemId, audio_end_ms: ev.t });
    else if (ev.type === "final") {
      if (!simItems.has(ev.itemId)) deliver({ type: "input_audio_buffer.speech_started", item_id: ev.itemId, audio_start_ms: ev.audioStartMs ?? ev.t });
      deliver({ type: "conversation.item.input_audio_transcription.completed", item_id: ev.itemId, transcript: ev.text });
      simItems.delete(ev.itemId);
    }
  };
  const herSorted = [...her].sort((a, b) => a.start - b.start);
  let hi = 0, herLive = null;
  const t0 = performance.now();
  for (let i = 0; i < nFrames; i++) {
    const tf = i * HOP_MS;
    if (!replay && realtime) {
      // pace: this frame's audio is "captured" at tf; wait for the wall clock, then deliver what the socket said meanwhile
      const wait = t0 + tf - performance.now();
      if (wait > 2) await new Promise((r) => setTimeout(r, wait));
    }
    clock = tf;
    if (semPending.length) {
      let fired = false;
      for (let k = semPending.length - 1; k >= 0; k--) if (semPending[k].due <= tf) { semPending[k].resolve(semPending[k].val); semPending.splice(k, 1); fired = true; }
      if (fired) for (let k = 0; k < 4; k++) await null; // let the host's .then apply the estimate on this frame
    }
    if (!replay) {
      socket.append(x.subarray(i * HOP, (i + 1) * HOP));
      while (pending.length) deliver(pending.shift());
    } else if (sim) {
      for (const ev of sim.tick(tf)) simRaw(ev);
    } else {
      while (replayIdx < replay.length && replay[replayIdx].t <= tf) deliver(replay[replayIdx++].raw);
    }
    // her lines
    if (herLive && tf >= herLive.end) { live.herEnd(); herLive = null; }
    if (!herLive && hi < herSorted.length && tf >= herSorted[hi].start) { herLive = herSorted[hi++]; live.setUi(herLive.ui ?? {}); live.herStart(herLive.text); }
    const herOut = herLive ? (herLive.outDb ? (herLive.outDb[i] ?? null) : -20) : null;
    const masked = mask?.[i] === 1;
    const db = masked ? floorDb : frames.db[i];
    live.frame(tf, Math.pow(10, db / 20), masked ? null : frames.f0[i], herOut !== null && herOut > -60 ? herOut : null);
    if (i % 5 === 4 && interval) interval();
  }
  // drain: let late finals arrive (2 s of wall time on a live socket)
  if (!replay) { await new Promise((r) => setTimeout(r, 2000)); while (pending.length) deliver(pending.shift()); }
  live.stop();
  const errors = socket?.errors ?? [];
  socket?.close();
  return { acts, phases, logs, sttLog, errors, stats: { ...live.stats, gaps: undefined, yieldLatency: undefined, hushLatency: undefined }, lane: sim ? "sim" : replay ? "replay" : stt.lane, model: socket?.model ?? null, region: socket?.region ?? null,
    wallLagMs: replay ? null : Math.round(performance.now() - t0 - nFrames * HOP_MS) };
}

/** Keep only what the engine reads (no audio, no logprobs) when logging socket events. */
function slim(e) {
  const o = { type: e.type };
  for (const k of ["item_id", "delta", "transcript", "audio_start_ms", "audio_end_ms", "previous_item_id"]) if (e[k] !== undefined) o[k] = e[k];
  if (e.type === "error") o.error = String(e.error?.code ?? e.error?.message ?? "").slice(0, 120);
  return o;
}

/** Run async jobs with a concurrency cap. */
export async function pool(jobs, conc) {
  const out = new Array(jobs.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(conc, jobs.length) }, async () => {
    while (next < jobs.length) { const i = next++; out[i] = await jobs[i](); }
  }));
  return out;
}
