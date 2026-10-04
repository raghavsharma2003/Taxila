// TaxilaFDB L2: validate the L1 simulator on REAL streaming STT (ARCHITECTURE.md v2 §6.4).
//
// A stratified subset of TEST streams is streamed in real time (20 ms chunks, 16 → 24 kHz) over the realtime transcription
// WebSocket to taxila-live-transcribe (= D4, gpt-live-transcribe, eastus2) with the production session shape
// (server/voice/stt.js sttSession; server VAD 1500 ms as a backstop). The REAL runtime runs live on the stream (world.mjs
// with the STT injected): stage A sends its micro-commit probes as input_audio_buffer.commit, exactly as on the device.
// Then the SAME streams run through L1 (SttSim D4 calibrated on M-D2) and the two are compared:
//   (1) STT timing: first partial after child onset, partial lag (word end → its text visible), final after commit;
//   (2) the engine's outcomes: thinking-pause cut-offs, gap after a respond end, missed responds — live vs simulated.
// Nothing is tuned on this run (it is a check of the simulator, on the frozen test split).
// Limits: US sandbox → eastus2 (RTT ~50 ms; an India phone adds ~200 ms); one pass; Azure load varies by hour.
//   NODE_USE_ENV_PROXY=1 node evals/duplex/taxilafdb/live.mjs [--n 48] [--conc 4] [--arm stage-a]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadEnv, ROOT } from "../lib.mjs";
import { listStreams, loadStream, runStream, STREAMS } from "./world.mjs";
import { armSpec } from "./arms.mjs";
import { facts, aggregate, quantile } from "./metrics.mjs";

const DATE = "2026-10-04";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const N = Number(opt("--n", 48)), CONC = Number(opt("--conc", 4)), ARM = opt("--arm", "stage-a");
const SR_OUT = 24000, CHUNK_MS = 20;

loadEnv();
await import(ROOT + "server/net.js");
const { endpoint } = await import(ROOT + "server/azure.js");
const { sttSession } = await import(ROOT + "server/voice/stt.js");
const KEY = process.env.AZURE_OPENAI_API_KEY;
const STT_E = endpoint("TRANSCRIBE");
const MODEL = "taxila-live-transcribe";

/** Stratified subset of test streams (both test voices, both conditions, child-floor families + barge-ins + safety). */
function subset() {
  const want = { F1: 12, F2: 8, F3: 4, F4: 4, F5: 8, F6: 4, F7: 4, F10: 4 };
  const ids = listStreams();
  const out = [];
  for (const [fam, n] of Object.entries(want)) {
    const c = ids.filter((id) => { const m = JSON.parse(fs.readFileSync(path.join(STREAMS, `${id}.json`), "utf8")).meta; return m.split === "test" && m.family === fam; });
    const step = Math.max(1, Math.floor(c.length / n));
    for (let i = 0; i < c.length && out.filter((x) => x.fam === fam).length < n; i += step) out.push({ id: c[i], fam });
  }
  return out.slice(0, N).map((x) => x.id);
}

function pcm24(id) {
  const out = execFileSync("ffmpeg", ["-loglevel", "error", "-f", "s16le", "-ar", "16000", "-ac", "1", "-i", path.join(STREAMS, `${id}.s16`), "-f", "s16le", "-ar", String(SR_OUT), "-ac", "1", "-"], { maxBuffer: 64 << 20 });
  return out;
}

/** A live STT source with the SttSim interface: tick(t) → events that have ARRIVED by stream time t; commit(t). */
async function liveSource(id) {
  const base = sttSession({ ageBand: "10-15", model: MODEL });
  const session = { ...base, audio: { input: { ...base.audio.input, format: { type: "audio/pcm", rate: SR_OUT }, turn_detection: { ...base.audio.input.turn_detection, silence_duration_ms: 1500 } } } };
  const ws = new WebSocket(`${STT_E.replace(/^https/, "wss")}/realtime?intent=transcription`, { headers: { "api-key": KEY } });
  const inbox = [], log = [], itemText = new Map(), itemStart = new Map();
  let t0 = null;
  const now = () => (t0 === null ? 0 : Math.round(performance.now() - t0));
  const ok = await new Promise((resolve) => {
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session }));
    ws.onerror = () => resolve(false);
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === "session.updated") resolve(true);
      if (e.type === "error") { log.push({ t: now(), type: "error", error: JSON.stringify(e.error).slice(0, 200) }); if (t0 === null) resolve(false); }
      const t = now(), item = e.item_id ?? null;
      if (e.type === "input_audio_buffer.speech_started") { itemStart.set(item, e.audio_start_ms ?? null); log.push({ t, type: "speech_started", itemId: item, audioMs: e.audio_start_ms ?? null }); }
      else if (e.type === "input_audio_buffer.speech_stopped") log.push({ t, type: "speech_stopped", itemId: item, audioMs: e.audio_end_ms ?? null });
      else if (e.type === "input_audio_buffer.committed") log.push({ t, type: "committed", itemId: item });
      else if (e.type === "conversation.item.input_audio_transcription.delta") {
        const txt = (itemText.get(item) ?? "") + (e.delta ?? "");
        itemText.set(item, txt);
        const ev = { type: "partial", t, itemId: item, text: txt, audioStartMs: itemStart.get(item) ?? undefined };
        inbox.push(ev); log.push({ ...ev });
      } else if (e.type === "conversation.item.input_audio_transcription.completed") {
        itemText.set(item, e.transcript ?? "");
        const ev = { type: "final", t, itemId: item, text: e.transcript ?? "", audioStartMs: itemStart.get(item) ?? undefined };
        inbox.push(ev); log.push({ ...ev });
      }
    };
    setTimeout(() => resolve(false), 15000);
  });
  if (!ok) throw new Error(`socket failed for ${id}`);
  const pcm = pcm24(id);
  const step = (SR_OUT * 2 * CHUNK_MS) / 1000;
  const commits = [];
  return {
    log, commits,
    /** Called by world.mjs once per 20 ms frame BEFORE the frame is processed: send this chunk in real time. */
    async pace(t, i) {
      if (t0 === null) t0 = performance.now();
      const due = t0 + t;
      const wait = due - performance.now();
      if (wait > 1) await new Promise((r) => setTimeout(r, wait));
      const off = i * step;
      if (off < pcm.length && ws.readyState === 1) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.subarray(off, Math.min(pcm.length, off + step)).toString("base64") }));
    },
    tick(t) {
      const out = [];
      while (inbox.length && inbox[0].t <= t + CHUNK_MS) out.push(inbox.shift());
      return out.map((e) => ({ ...e, t }));
    },
    commit(t) { commits.push(t); if (ws.readyState === 1) ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); return null; },
    async close() { try { ws.close(); } catch { /* closed */ } return { events: log.length, commits: commits.length }; },
  };
}

/** STT timing from a recorded event log against the stream's gold words. */
function timing(log, d) {
  const g = d.gold;
  const out = { firstPartialAfterOnset: null, lag: [], finalAfterCommit: [] };
  if (g.childOnset === null) return out;
  const parts = log.filter((e) => e.type === "partial" && e.t >= g.childOnset);
  if (parts.length) out.firstPartialAfterOnset = parts[0].t - g.childOnset;
  // lag: each child word → the first partial / final whose text has at least that many child tokens after onset
  const words = g.childWords;
  const texts = log.filter((e) => (e.type === "partial" || e.type === "final") && e.t >= g.childOnset);
  let k = 0;
  const seen = new Map();
  for (const e of texts) {
    const n = String(e.text).split(/\s+/).filter(Boolean).length + (seen.get("base") ?? 0);
    while (k < words.length && k < n) { out.lag.push(e.t - words[k].end); k++; }
    if (e.type === "final") seen.set("base", n);
  }
  return out;
}

const ids = subset();
console.log(`L2 live: ${ids.length} test streams × ${ARM} on taxila-live-transcribe, ${CONC} at a time (real time)`);
const live = [];
let next = 0;
const t0 = Date.now();
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < ids.length) {
    const id = ids[next++];
    const d = loadStream(id);
    let src = null;
    try {
      src = await liveSource(id);
      const r = await runStream(d, { ...armSpec(ARM), lane: "D4", sttFactory: async () => src, pace: (t, i) => src.pace(t, i) });
      live.push({ id, f: facts(r), timing: timing(src.log, d), commits: src.commits.length, events: src.log.length, log: src.log });
      process.stdout.write(`${live.length}/${ids.length} ${id} speaks=${r.speaks.length} commits=${src.commits.length}\n`);
    } catch (e) { live.push({ id, error: String(e?.message || e).slice(0, 200) }); }
  }
}));
// the same streams in L1
const sim = [];
for (const id of ids) {
  const d = loadStream(id);
  const r = await runStream(d, { ...armSpec(ARM), lane: "D4" });
  sim.push({ id, f: facts(r) });
}
const okIds = new Set(live.filter((x) => x.f).map((x) => x.id));
const A = (rows) => aggregate(rows.filter((x) => okIds.has(x.id)).map((x) => x.f));
const tl = live.filter((x) => x.timing);
const fp = tl.map((x) => x.timing.firstPartialAfterOnset).filter((v) => v !== null);
const lag = tl.flatMap((x) => x.timing.lag);
const q = (a, p) => (a.length ? Math.round(quantile(a, p)) : null);
const cal = JSON.parse(fs.readFileSync(path.join(ROOT, "evals/duplex/results/live-calibration-2026-10-04.json"), "utf8")).calibration;
const La = A(live), Si = A(sim);
const pick = (a) => ({ M2_thinkingCutoff: a.M2_thinkingCutoff, M2_turnCutoff: a.M2_turnCutoff, M3_gapDecision: a.M3_gapDecision, M3_gapAudible: a.M3_gapAudible, M4_missedRespond: a.M4_missedRespond,
  M7_yieldLatency: a.M7_yieldLatency, M11_verdictOnRepaired: a.M11_verdictOnRepaired, M12_holdViolation: a.M12_holdViolation, M13_nonSafetySpeechAfterDistress: a.M13_nonSafetySpeechAfterDistress, M13_detected: a.M13_detected });
// per-stream agreement on the binary outcomes
const agree = { turnCutoff: [0, 0], missed: [0, 0] };
for (const x of live.filter((y) => y.f)) {
  const s = sim.find((y) => y.id === x.id).f;
  const cut = (f) => f.pauses.some((p) => p.thinking && p.takeover);
  if (x.f.pauses.some((p) => p.thinking)) { agree.turnCutoff[1]++; if (cut(x.f) === cut(s)) agree.turnCutoff[0]++; }
  if (x.f.endClass === "respond") { agree.missed[1]++; if (!!x.f.missed2s === !!s.missed2s) agree.missed[0]++; }
}
const gapPairs = live.filter((x) => x.f && x.f.endClass === "respond" && x.f.gap !== null && !x.f.missed2s).map((x) => { const s = sim.find((y) => y.id === x.id).f; return s.gap !== null && !s.missed2s ? x.f.gap - s.gap : null; }).filter((v) => v !== null);
const out = {
  id: "taxilafdb-live-L2", date: DATE, arm: ARM, stt: `${MODEL} (D4, eastus2) from the US sandbox`, streams: ids.length, ok: okIds.size, errors: live.filter((x) => x.error).map((x) => `${x.id}: ${x.error}`),
  seconds: Math.round((Date.now() - t0) / 1000),
  sttTiming: { live: { firstPartialAfterOnsetMs: { n: fp.length, p50: q(fp, 0.5), p90: q(fp, 0.9) }, partialLagMs: { n: lag.length, p50: q(lag, 0.5), p90: q(lag, 0.9) } },
    simModelD4_M2: { firstPartialAfterOnsetMs: cal.firstDeltaAfterOnsetMs, partialLagMs: cal.deltaLagMs } },
  live: pick(La), sim: pick(Si), agreement: { turnCutoff: agree.turnCutoff, missedRespond: agree.missed, gapLiveMinusSimMs: { n: gapPairs.length, p50: q(gapPairs, 0.5), p10: q(gapPairs, 0.1), p90: q(gapPairs, 0.9) } },
  perStream: live.map((x) => ({ id: x.id, error: x.error, commits: x.commits, events: x.events, gap: x.f?.gap ?? null, simGap: sim.find((y) => y.id === x.id)?.f?.gap ?? null, missed: x.f?.missed2s ?? null, turnCutoff: x.f ? x.f.pauses.some((p) => p.thinking && p.takeover) : null })),
};
fs.writeFileSync(path.join(HERE, "../results", `taxilafdb-live-${DATE}.json`), JSON.stringify(out, null, 1));
fs.mkdirSync("/tmp/taxila-fdb/runs", { recursive: true });
fs.writeFileSync("/tmp/taxila-fdb/runs/live-events.json", JSON.stringify(live.map((x) => ({ id: x.id, log: x.log })), null, 0));
console.log(JSON.stringify({ sttTiming: out.sttTiming, live: { cut: out.live.M2_thinkingCutoff, gap: out.live.M3_gapDecision, missed: out.live.M4_missedRespond }, sim: { cut: out.sim.M2_thinkingCutoff, gap: out.sim.M3_gapDecision, missed: out.sim.M4_missedRespond }, agreement: out.agreement }, null, 1));
process.exit(0);
