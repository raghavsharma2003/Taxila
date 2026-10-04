// live-validate.mjs — duplex prototype, measurement M-D2 (2026-10-04): the floor manager on REAL streaming STT.
//
// Question: does the simulator's STT model (streams.mjs) behave like the production live transcriber, and how does the
// floor manager behave when it is driven by real partials, real finals and features computed from real audio?
// Also answers D7 for D4: does taxila-live-transcribe honour a CLIENT input_audio_buffer.commit while server VAD is on
// (silence 1500 ms as a backstop), and how fast does the final come back?
//
// Method:
//   - a subset of evals/duplex/scenarios.mjs; each segment synthesised with gpt-4o-mini-tts (child-instructed, x1.2 pitch:
//     the cascade-latency recipe), trimmed, assembled with the scripted pauses (filled with -58 dBFS noise), cached outside
//     the repo; real-time streaming (20 ms chunks) over the realtime transcription WebSocket (same session shape as
//     server/voice/stt.js sttSession, PCM 24 kHz) to taxila-live-transcribe (eastus2) from this US container;
//   - arm BASE: today's config (server VAD 900 ms, no client commit): speech_stopped and completed times;
//   - arm DUPLEX: server VAD 1500 ms backstop + server/duplex FloorManager running LIVE on 20 ms frames computed from the
//     same PCM (RMS + the shipped YIN) and on the real deltas/completions; its stt_commit actions are sent as
//     input_audio_buffer.commit;
//   - every event is logged with its arrival time on the audio clock (ms since the first audio chunk was sent).
// Limits: synthetic TTS child voices (no real children, E1 pending); one pass; US container -> eastus2 RTT ~51 ms (an India
// phone adds ~200 ms RTT); the teacher's own audio is not played (echo-free); partial timing depends on Azure load.
// Spend: ~60 short TTS clips + 2 x n x ~10 s of transcription: well under USD 1.
//   NODE_USE_ENV_PROXY=1 node evals/duplex/live-validate.mjs [--only a01,b01] [--conc 4] [--tag v2]
// v1 (2026-10-04) ran the pre-replay floor policy; v2 the policy after the M-D2 replay fixes (open-tail cap, G5 floor,
// hold-request spellings, probe-then-decide). Both keep their own result file.
import fs from "node:fs";
import path from "node:path";
import { loadEnv, ROOT, RESULTS, SR, childClip, noise, withNoise, pcmFrames, q, mean, r0 } from "./lib.mjs";
import { SCENARIOS } from "./scenarios.mjs";
loadEnv();
await import(ROOT + "server/net.js");
const { endpoint } = await import(ROOT + "server/azure.js");
const { sttSession } = await import(ROOT + "server/voice/stt.js");
const { FloorManager } = await import(ROOT + "server/duplex/floorManager.js");
const { normText } = await import(ROOT + "server/duplex/understand.js");

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
export const LIVE_SET = ["a01", "a03", "a04", "a07", "a11", "b01", "b03", "b06", "b07", "c01", "c03", "c06", "c08", "d01", "d02", "d06", "d11",
  "e01", "e03", "f01", "f03", "f06", "g01", "h01", "h04", "j01", "j03", "j06"];
const ONLY = arg("--only") ? arg("--only").split(",") : LIVE_SET;
const CONC = Number(arg("--conc", 4));
const KEY = process.env.AZURE_OPENAI_API_KEY;
const TTS = { endpoint: endpoint("TTS"), key: KEY, deployment: process.env.DEPLOY_TTS || "gpt-4o-mini-tts" };
const STT_E = endpoint("TRANSCRIBE");
const MODEL = "taxila-live-transcribe";
const LEAD_MS = 600, TAIL_MS = 4500, CHUNK_MS = 20;

async function buildAudio(sc, idx) {
  const voice = idx % 2 ? "sage" : "coral";
  const parts = [], segs = [];
  let pos = LEAD_MS, ttsNew = 0;
  parts.push(noise(LEAD_MS, idx + 1));
  for (const [si, [text, pause]] of sc.segs.entries()) {
    const c = await childClip(text, voice, TTS);
    if (!c.cached) ttsNew++;
    const ms = Math.round((c.pcm.length / 2 / SR) * 1000);
    parts.push(withNoise(c.pcm, idx * 10 + si));
    segs.push({ start: pos, end: pos + ms, text, pause });
    pos += ms;
    if (pause) { parts.push(noise(pause, idx * 100 + si)); pos += pause; }
  }
  parts.push(noise(TAIL_MS, idx + 7));
  const pcm = Buffer.concat(parts);
  return { pcm, segs, trueEnd: segs[segs.length - 1].end, voice, ttsNew, durMs: Math.round((pcm.length / 2 / SR) * 1000) };
}

function openSocket(silenceMs) {
  const base = sttSession({ ageBand: "10-15", model: MODEL });
  const session = { ...base, audio: { input: { ...base.audio.input, format: { type: "audio/pcm", rate: SR },
    turn_detection: { ...base.audio.input.turn_detection, silence_duration_ms: silenceMs } } } };
  const ws = new WebSocket(`${STT_E.replace(/^https/, "wss")}/realtime?intent=transcription`, { headers: { "api-key": KEY } });
  const listeners = new Set();
  const ready = new Promise((resolve) => {
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session }));
    ws.onerror = (e) => resolve({ ok: false, error: `ws error ${e?.message ?? ""}` });
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === "session.updated") resolve({ ok: true });
      if (e.type === "error" && !listeners.size) resolve({ ok: false, error: JSON.stringify(e.error).slice(0, 300) });
      for (const fn of listeners) fn(e);
    };
  });
  return { ws, ready, on: (fn) => listeners.add(fn) };
}

/** One scenario, one arm, streamed in real time. */
async function runOne(sc, audio, arm) {
  const s = openSocket(arm === "BASE" ? 900 : 1500);
  const ok = await s.ready;
  if (!ok.ok) return { arm, error: ok.error };
  const frames = await pcmFrames(audio.pcm);
  const fm = arm === "DUPLEX" ? new FloorManager({}) : null;
  const log = { events: [], actions: [], commitsSent: [] };
  const itemText = new Map();
  let t0 = 0;
  const now = () => Math.round(performance.now() - t0);
  const feed = (ev) => { if (!fm) return; for (const a of fm.step(ev)) onAction(a); };
  const onAction = (a) => {
    log.actions.push({ ...a, at: now() });
    if (a.do === "stt_commit") { s.ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); log.commitsSent.push({ t: now(), why: a.why }); }
  };
  s.on((e) => {
    const t = now();
    const id = e.item_id ?? e.item?.id ?? null;
    if (e.type === "conversation.item.input_audio_transcription.delta") {
      const txt = (itemText.get(id) ?? "") + (e.delta ?? "");
      itemText.set(id, txt);
      log.events.push({ t, type: "partial", itemId: id, text: txt });
      feed({ type: "partial", t, itemId: id, text: txt });
    } else if (e.type === "conversation.item.input_audio_transcription.completed") {
      itemText.set(id, e.transcript ?? "");
      log.events.push({ t, type: "final", itemId: id, text: e.transcript ?? "" });
      feed({ type: "final", t, itemId: id, text: e.transcript ?? "" });
    } else if (e.type === "input_audio_buffer.speech_started" || e.type === "input_audio_buffer.speech_stopped" || e.type === "input_audio_buffer.committed") {
      log.events.push({ t, type: e.type.split(".").pop(), itemId: id, audioMs: e.audio_start_ms ?? e.audio_end_ms ?? null });
    } else if (e.type === "error") log.events.push({ t, type: "error", error: JSON.stringify(e.error).slice(0, 200) });
  });
  if (fm) {
    if (sc.teacher) fm.step({ type: "teacher_start", t: 0, reply: { text: sc.teacher.text, msPerChar: 70, askedYesNo: !!sc.teacher.askedYesNo }, ctx: sc.ctx });
    else fm.step({ type: "handover", t: 0, ctx: sc.ctx });
  }
  const step = (SR * 2 * CHUNK_MS) / 1000;
  t0 = performance.now();
  let fi = 0;
  for (let pos = 0, n = 0; pos < audio.pcm.length; pos += step, n++) {
    s.ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: audio.pcm.subarray(pos, pos + step).toString("base64") }));
    const audioMs = (n + 1) * CHUNK_MS;
    while (fi < frames.length && frames[fi].t + 20 <= audioMs) { feed({ type: "frame", t: frames[fi].t + 20, rms: frames[fi].rms, f0: frames[fi].f0 }); fi++; }
    const wait = t0 + audioMs - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
  await new Promise((r) => setTimeout(r, 2500));
  s.ws.close();
  return { arm, ...log, fmLog: fm ? fm.log : null };
}

// ── run ──
const set = SCENARIOS.filter((s) => ONLY.includes(s.id));
const audios = new Map();
let ttsNew = 0;
for (const [i, sc] of set.entries()) { const a = await buildAudio(sc, i); audios.set(sc.id, a); ttsNew += a.ttsNew; }
console.log(`audio ready: ${set.length} scenarios (${ttsNew} new TTS clips)`);
const runs = [];
const jobs = set.flatMap((sc) => ["BASE", "DUPLEX"].map((arm) => ({ sc, arm })));
let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < jobs.length) {
    const { sc, arm } = jobs[next++];
    const a = audios.get(sc.id);
    const r = await runOne(sc, a, arm);
    runs.push({ id: sc.id, cat: sc.cat, expect: sc.truth.expect, segs: a.segs, trueEnd: a.trueEnd, durMs: a.durMs, ...r });
    const commit = (r.actions || []).find((x) => x.do === "commit");
    console.log(`${sc.id} ${arm}: events ${r.events?.length ?? 0}${r.error ? ` ERROR ${r.error}` : ""}${commit ? ` commit@${commit.t} (end ${a.trueEnd}) ${commit.why}` : ""}`);
  }
}));

// ── analysis ──
const tok = (t) => normText(t).split(" ").filter(Boolean);
const summary = { firstDeltaAfterOnset: [], deltaLag: [], finalAfterVad: [], finalAfterClientCommit: [], clientCommitErrors: 0, clientCommits: 0,
  completenessAtCand: [], base: [], duplex: [] };
for (const r of runs.filter((x) => !x.error)) {
  const onset = r.segs[0].start;
  const firstDelta = r.events.find((e) => e.type === "partial");
  if (firstDelta && r.arm === "BASE") summary.firstDeltaAfterOnset.push(firstDelta.t - onset);
  // delta lag: audio position implied by the partial's token share of its item's final, vs arrival time (BASE arm, single-item spans)
  if (r.arm === "BASE") {
    const finals = r.events.filter((e) => e.type === "final");
    const stops = r.events.filter((e) => e.type === "speech_stopped");
    const starts = r.events.filter((e) => e.type === "speech_started");
    for (const f of finals) {
      const N = tok(f.text).length; const st = starts.find((x) => x.itemId === f.itemId); const sp = stops.find((x) => x.itemId === f.itemId);
      if (!N || !st || !sp || st.audioMs === null || sp.audioMs === null) continue;
      for (const p of r.events.filter((e) => e.type === "partial" && e.itemId === f.itemId)) {
        const c = Math.min(N, tok(p.text).length);
        summary.deltaLag.push(p.t - (st.audioMs + ((sp.audioMs - st.audioMs) * c) / N));
      }
      summary.finalAfterVad.push(f.t - sp.t);
    }
    // completeness of the visible text at the 500 ms candidate after the true end
    const cand = r.trueEnd + 500;
    const vis = new Map();
    for (const e of r.events) if ((e.type === "partial" || e.type === "final") && e.t <= cand) vis.set(e.itemId, e.text);
    const visTok = tok([...vis.values()].join(" ")).length;
    const allTok = tok(finals.map((f) => f.text).join(" ")).length;
    if (allTok) summary.completenessAtCand.push(visTok / allTok);
    const lastStop = stops.filter((x) => x.t > r.trueEnd - 200)[0] ?? stops.at(-1);
    const lastFinal = finals.at(-1);
    summary.base.push({ id: r.id, cat: r.cat, trueEnd: r.trueEnd, stops: stops.map((x) => x.t - r.trueEnd), vadStop: lastStop ? lastStop.t - r.trueEnd : null,
      finalAt: lastFinal ? lastFinal.t - r.trueEnd : null, nFinals: finals.length, text: finals.map((f) => f.text).join(" | ") });
  } else {
    const sent = r.commitsSent;
    summary.clientCommits += sent.length;
    summary.clientCommitErrors += r.events.filter((e) => e.type === "error").length;
    for (const c of sent) {
      const fin = r.events.find((e) => e.type === "final" && e.t >= c.t);
      const committed = r.events.find((e) => e.type === "committed" && e.t >= c.t);
      if (fin && committed && fin.t - c.t < 3000) summary.finalAfterClientCommit.push(fin.t - c.t);
    }
    const commits = r.actions.filter((a) => a.do === "commit");
    const revokes = r.actions.filter((a) => a.do === "revoke");
    const safety = r.actions.find((a) => a.do === "safety_attend");
    summary.duplex.push({ id: r.id, cat: r.cat, expect: r.expect, trueEnd: r.trueEnd, commits: commits.map((c) => ({ t: c.t - r.trueEnd, why: c.why, text: c.text })),
      revokes: revokes.length, safetyAt: safety ? safety.t : null, nods: r.actions.filter((a) => a.do === "nod").length,
      errors: r.events.filter((e) => e.type === "error").map((e) => e.error), finals: r.events.filter((e) => e.type === "final").map((e) => e.text).join(" | ") });
  }
}
const stat = (a) => ({ n: a.length, p10: r0(q(a, 0.1)), p50: r0(q(a, 0.5)), p90: r0(q(a, 0.9)), mean: r0(mean(a)) });
const result = {
  id: "M-D2", date: new Date().toISOString().slice(0, 10), model: MODEL,
  method: "scenarios subset, gpt-4o-mini-tts child clips x1.2 pitch, real-time 20 ms streaming to the realtime transcription socket (US container -> eastus2); BASE = server VAD 900 ms; DUPLEX = server VAD 1500 ms + live FloorManager with client commits",
  n: set.length,
  calibration: { firstDeltaAfterOnsetMs: stat(summary.firstDeltaAfterOnset), deltaLagMs: stat(summary.deltaLag), finalAfterVadMs: stat(summary.finalAfterVad),
    finalAfterClientCommitMs: stat(summary.finalAfterClientCommit), clientCommits: summary.clientCommits, socketErrors: summary.clientCommitErrors,
    textCompletenessAtCandidate: { ...stat(summary.completenessAtCand.map((x) => Math.round(x * 100))), unit: "% of final tokens visible at true end + 500 ms" } },
  base: summary.base, duplex: summary.duplex, runs,
};
fs.mkdirSync(RESULTS, { recursive: true });
const TAG = arg("--tag", "");
const out = path.join(RESULTS, `live-validate-${result.date}${TAG ? `-${TAG}` : ""}.json`);
fs.writeFileSync(out, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result.calibration, null, 1));
console.log(`→ ${path.relative(ROOT, out)}`);
process.exit(0);
