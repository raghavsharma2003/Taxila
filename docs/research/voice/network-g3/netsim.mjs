// G3 network-resilience harness: WebSocket path to Azure realtime (taxila-realtime) through a USER-SPACE
// TCP impairment layer (this kernel has no sch_netem and the sandbox carries no UDP, so tc-netem and the
// WebRTC media path cannot run here). Every byte of the TLS stream passes through two lanes (up/down) that
// add one-way delay + jitter (order preserved, as TCP does), a per-1400-byte-segment loss penalty
// (retransmit stall with head-of-line blocking), and scheduled network outages.
//
// usage: node netsim.mjs <profile> [turns]      profiles: see PROFILES below
import WebSocket from "ws";
import net from "net";
import tls from "tls";
import { Duplex } from "stream";
import fs from "fs";

const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT, HOST = new URL(ENDPOINT).host, KEY = process.env.AZURE_OPENAI_API_KEY;
const MODEL = "taxila-realtime";
const INSTR = fs.readFileSync(new URL("./instructions.txt", import.meta.url), "utf8");
const LINES = JSON.parse(fs.readFileSync(new URL("./clips/lines.json", import.meta.url)));
const CLIPS = LINES.map((_, i) => fs.readFileSync(new URL(`./clips/c${String(i).padStart(2, "0")}.pcm`, import.meta.url)));
const STALL_CLIP = CLIPS.length - 1; // "are you there?" utterance

// ---- profiles (added on top of the container→eastus2 baseline, ~21 ms WS ping RTT) ----
const PROFILES = {
  P0: { rtt: 0, jit: 0, loss: 0 },
  P1: { rtt: 150, jit: 50, loss: 0 },
  P1c: { rtt: 150, jit: 50, loss: 0, clientCreate: true },
  P2: { rtt: 150, jit: 50, loss: 0.02 },
  P3: { rtt: 150, jit: 50, loss: 0.05 },
  P4: { rtt: 260, jit: 50, loss: 0.01 },                 // India mobile → eastus2 estimate (TRAI + RIPE Atlas)
  P5n: { rtt: 150, jit: 50, loss: 0, outage: 5000, mode: "hold", policy: "naive" },
  P5p: { rtt: 150, jit: 50, loss: 0, outage: 5000, mode: "hold", policy: "resume" },
  P6: { rtt: 150, jit: 50, loss: 0, outage: 5000, mode: "blackhole", policy: "reconnect" },
};
const PNAME = process.argv[2] || "P1"; const P = PROFILES[PNAME]; const TURNS = +(process.argv[3] || 12);
const B_LIVE = 300;            // live jitter buffer (ms) used for the playout clock [I]
const STALL_MS = 1500;         // watchdog: no downlink byte for this long while data is expected → stalled [I]
const NOTICE_MS = 3000;        // app-voice notice after this long stalled [I]
const STALE_MS = 2000;         // a stall longer than this makes the unplayed remainder stale → truncate + resume [I]
const PING_MS = 500;
const T0 = performance.now(); const now = () => performance.now() - T0;
const rnd = (a, b) => a + Math.random() * (b - a);
const LOG = []; const log = (type, o = {}) => LOG.push({ t: Math.round(now()), type, ...o });

// ---- network: global outage window + per-connection lanes ----
const NET = { b0: Infinity, b1: -Infinity };
const rto0 = Math.max(200, P.rtt + 21 + 4 * P.jit);       // Linux-like initial RTO [I]
function releaseAfterOutage(dur) { let k = 1; while (rto0 * (2 ** k - 1) < dur) k++; return rto0 * (2 ** k - 1); }
class Lane {
  constructor(conn, dir) { this.conn = conn; this.dir = dir; this.q = []; this.tail = 0; this.timer = null; this.bytes = 0; }
  send(buf, deliver) {
    const t0 = now();
    for (let off = 0; off < buf.length; off += 1400) {
      let d = P.rtt / 2 + rnd(-P.jit / 2, P.jit / 2);
      if (P.loss && Math.random() < P.loss) d += Math.random() < 0.7 ? P.rtt + 21 + P.jit : rto0; // fast-retransmit vs RTO [I]
      const t = Math.max(this.tail, t0 + Math.max(0, d)); this.tail = t;
      this.q.push({ t, seg: buf.subarray(off, off + 1400), deliver });
    }
    this.kick();
  }
  kick() {
    if (this.timer || !this.q.length) return;
    const c = this.conn, n = now();
    if (c.dead) { this.q = []; return; }
    if (n >= NET.b0 && n < c.release) { this.timer = setTimeout(() => { this.timer = null; this.kick(); }, c.release - n); return; }
    while (this.q.length && this.q[0].t <= n) { const x = this.q.shift(); this.bytes += x.seg.length; x.deliver(x.seg); }
    if (this.q.length) this.timer = setTimeout(() => { this.timer = null; this.kick(); }, Math.max(0, this.q[0].t - now()));
  }
}
let CONN_ID = 0;
function impairedConnect() {
  const conn = { id: ++CONN_ID, dead: false, release: -Infinity };
  conn.up = new Lane(conn, "up"); conn.down = new Lane(conn, "down");
  const raw = net.connect(443, HOST);
  const pipe = new Duplex({ read() {}, write(chunk, _e, cb) { conn.up.send(Buffer.from(chunk), (b) => raw.write(b)); cb(); }, final(cb) { cb(); } });
  raw.on("data", (d) => conn.down.send(d, (b) => pipe.push(b)));
  raw.on("end", () => pipe.push(null)); raw.on("error", () => pipe.destroy());
  pipe.on("error", () => {});
  const sock = tls.connect({ socket: pipe, servername: HOST, ALPNProtocols: ["http/1.1"] });
  conn.raw = raw; CONNS.push(conn); return { sock, conn };
}
const CONNS = [];
function startOutage(dur) {
  const b0 = now(); NET.b0 = b0; NET.b1 = b0 + dur;
  for (const c of CONNS) { if (P.mode === "blackhole") c.dead = true; else c.release = b0 + releaseAfterOutage(dur); }
  log("outage_start", { dur, release: P.mode === "hold" ? Math.round(releaseAfterOutage(dur)) : null });
  setTimeout(() => { log("outage_end"); NET.b0 = Infinity; for (const c of CONNS) if (!c.dead) { c.up.kick(); c.down.kick(); } onNetworkBack(); }, dur);
}

// ---- session ----
let ws = null, conn = null, lastDown = 0, pongRtts = [], pingSent = 0;
let expecting = false;              // downlink data expected (between child speech end and response done)
let stalledAt = null, noticeAt = null, stallHandled = false;
const responses = new Map();        // id → {created, arrivals:[{t,ms}], transcript, status, itemId, turn, discarded}
let curTurn = -1, curResp = null;
const turns = [];
let micQueue = [], micHeld = [], micHolding = false; const RING = [];

async function mintKey() {
  const t = now();
  const r = await fetch(`${ENDPOINT}/realtime/client_secrets`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ expires_after: { anchor: "created_at", seconds: 60 }, session: { type: "realtime", model: MODEL } }) });
  const j = await r.json(); log("mint", { ms: Math.round(now() - t) }); return j.value;
}
function sessionCfg() {
  return { type: "realtime", instructions: INSTR, output_modalities: ["audio"],
    audio: { input: { format: { type: "audio/pcm", rate: 24000 }, transcription: { model: "taxila-transcribe" },
      turn_detection: { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: 900, create_response: !P.clientCreate && !RESEED, interrupt_response: true } },
      output: { voice: "marin" } } };
}
function openSession(ek) {
  return new Promise((resolve) => {
    const t = now(); const c = impairedConnect(); conn = c.conn;
    ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${MODEL}`, { headers: ek ? { Authorization: `Bearer ${ek}` } : { "api-key": KEY }, createConnection: () => c.sock });
    const my = ws;
    my.on("open", () => { log("ws_open", { conn: conn.id, ms: Math.round(now() - t) }); my.send(JSON.stringify({ type: "session.update", session: sessionCfg() })); });
    my.on("message", (m) => { if (my !== ws) { log("orphan_event", { conn: c.conn.id }); return; } lastDown = now(); if (stalledAt !== null) recoverNow(); onEvent(JSON.parse(m), resolve, t); });
    my.on("pong", () => { if (my === ws) { lastDown = now(); if (stalledAt !== null) recoverNow(); else pongRtts.push(now() - pingSent); } });
    my.on("close", (code) => log("ws_close", { conn: c.conn.id, code }));
    my.on("error", (e) => log("ws_error", { conn: c.conn.id, e: String(e) }));
  });
}
const send = (o) => { try { ws.send(JSON.stringify(o)); } catch {} };

function onEvent(e, ready, tOpen) {
  switch (e.type) {
    case "session.updated": if (ready) { log("session_ready", { ms: Math.round(now() - tOpen) }); ready(); } break;
    case "input_audio_buffer.speech_started": log("speech_started", { turn: curTurn });
      if (P.policy === "naive" || !P.policy) { // standard WS client: barge-in clears playback
        for (const r of responses.values()) if (!r.done && r.arrivals.length) truncatePlayback(r, "speech_started"); }
      break;
    case "input_audio_buffer.speech_stopped": log("speech_stopped", { turn: curTurn }); expecting = true;
      if (P.clientCreate) send({ type: "response.create" }); break;
    case "conversation.item.input_audio_transcription.completed": log("child_transcript", { text: e.transcript }); break;
    case "response.created": { const r = { id: e.response.id, created: now(), arrivals: [], transcript: "", turn: curTurn, done: false, cut: null };
      responses.set(r.id, r); curResp = r; expecting = true; log("response_created", { id: r.id, turn: curTurn }); break; }
    case "response.output_item.added": { const r = responses.get(e.response_id); if (r && e.item?.type === "message") r.itemId = e.item.id; break; }
    case "response.output_audio.delta": { const r = responses.get(e.response_id); if (!r) break;
      const ms = Buffer.from(e.delta, "base64").length / 48;
      if (r.cut !== null) { r.discardedMs = (r.discardedMs || 0) + ms; break; }
      r.arrivals.push({ t: now(), ms });
      if (r.arrivals.length === 1) log("first_audio", { id: r.id, turn: r.turn });
      break; }
    case "response.output_audio_transcript.delta": { const r = responses.get(e.response_id); if (r) r.transcript += e.delta; break; }
    case "response.done": { const r = responses.get(e.response.id); if (r) { r.done = true; r.status = e.response.status; r.doneT = now(); }
      log("response_done", { id: e.response.id, status: e.response.status, details: e.response.status_details ? JSON.stringify(e.response.status_details).slice(0,300) : null, words: r?.transcript.trim().split(/\s+/).length });
      expecting = [...responses.values()].some((x) => !x.done);
      if (resumeFor && r && r !== resumeFor && r.created > (resumeFor.outageAt ?? 0) && !P.clientCreate) { send({ type: "session.update", session: { type: "realtime", audio: { input: { turn_detection: sessionCfg().audio.input.turn_detection } } } }); log("auto_response_restored"); }
      break; }
    case "error": log("api_error", { e: e.error?.message }); break;
  }
}

// ---- playout model ----
function playout(arr, B, cutAt = Infinity) { // returns {start, gaps:[ms], end, playedAt(t)}
  if (!arr.length) return null;
  const start = arr[0].t + B; let cur = start; const gaps = []; const segs = [];
  for (const a of arr) { if (a.t > cur) { gaps.push(a.t - cur); cur = a.t; } segs.push([cur, cur + a.ms]); cur += a.ms; }
  const playedAt = (t) => segs.reduce((s, [a, b]) => s + Math.max(0, Math.min(b, t, cutAt) - a), 0);
  return { start, gaps, end: Math.min(cur, cutAt), playedAt };
}
function truncatePlayback(r, why) {
  if (r.cut !== null) return; const t = now(); const p = playout(r.arrivals, B_LIVE);
  const played = Math.floor(p ? p.playedAt(t) : 0); r.cut = t; r.playedMs = played;
  if (r.itemId) send({ type: "conversation.item.truncate", item_id: r.itemId, content_index: 0, audio_end_ms: played });
  log("truncate", { id: r.id, why, audio_end_ms: played });
}

// ---- outages (scheduled ~1-2 s into audible playback of the reply) ----
function scheduleOutage(r) { const at = r.arrivals[0].t + rnd(200, 800) - now(); setTimeout(() => { r.outageAt = now(); r.recvAtOutage = r.arrivals.reduce((a, x) => a + x.ms, 0); r.doneAtOutage = r.done; startOutage(P.outage); }, at);
  if (r.turn % 2 === 1) setTimeout(() => { log("child_speaks_in_outage"); micQueue.push(...chunks(CLIPS[STALL_CLIP])); }, at + 1000); }

// watchdog + pings
setInterval(() => {
  if (!ws || ws.readyState !== 1) return;
  const n = now();
  if (expecting && n - lastDown > STALL_MS && stalledAt === null) { stalledAt = n; log("stalled"); if (P.policy && P.policy !== "naive") { micHolding = true; micHeld = RING.filter((x) => x.t >= lastDown).map((x) => x.c); } }
  if (stalledAt !== null && noticeAt === null && n - stalledAt > NOTICE_MS) { noticeAt = n; log("app_voice_notice"); }
}, PING_MS / 5);
setInterval(() => { if (ws && ws.readyState === 1) { pingSent = now(); try { ws.ping(); } catch {} } }, PING_MS);
function recoverNow() { const n = now(); const ms = n - stalledAt; log("unstalled", { stalledMs: Math.round(ms), sinceLastByte: Math.round(ms + STALL_MS) }); stalledAt = null; noticeAt = null; onRecovered(ms); }

let resumeFor = null;
function onRecovered(stalledMs) {
  if (P.policy === "reconnect") return;
  if (P.policy !== "resume") { micHolding = false; return; }
  const r = curResp; micHolding = false;
  if (stalledMs + STALL_MS > STALE_MS && r) {
    send({ type: "session.update", session: { type: "realtime", audio: { input: { turn_detection: { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: 900, create_response: false, interrupt_response: true } } } } });
    send({ type: "response.cancel" }); send({ type: "input_audio_buffer.clear" }); truncatePlayback(r, "stale_after_stall");
    sendHeld(); resume(r);
  } else { for (const c of micHeld) send({ type: "input_audio_buffer.append", audio: c.toString("base64") }); micHeld = []; }
}
function sendHeld() { if (micHeld.length && heldHasSpeech()) { send({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_audio", audio: Buffer.concat(micHeld).toString("base64") }] } }); log("held_audio_item", { ms: micHeld.length * 40 }); } micHeld = []; }
function heldHasSpeech() { const b = Buffer.concat(micHeld); let m = 0; for (let i = 0; i < b.length; i += 2) m = Math.max(m, Math.abs(b.readInt16LE(i))); return m > 1500; }
function resume(r) {
  const note = "NETWORK RESUME: the line dropped while you were speaking and came back. The conversation now holds only what the child actually heard of your last turn. If the child said something meanwhile, answer that first. Otherwise pick up from the last heard point in one short turn: never restart the turn and never repeat what was heard. At most one brief, blame-free acknowledgement.";
  const lines = INSTR.split("\n"); const instr = [...lines.slice(0, -1), note, lines.at(-1)].join("\n");
  resumeFor = r; log("resume_create", { from: r.id }); send({ type: "response.create", response: { instructions: instr } });
}

// reconnect policy (P6): network back → mint fresh key → new connection → re-seed heard-only context → resume
let history = []; // [{role, text}]
async function onNetworkBack() {
  if (P.policy !== "reconnect") return;
  const r = curResp; const tBack = now();
  // audio already received keeps playing locally through the outage; at network-back, whatever is still unplayed is cut
  const p = r && playout(r.arrivals, B_LIVE); const played = p ? Math.floor(p.playedAt(now())) : 0;
  if (r) { r.cut = now(); r.playedMs = played; }
  for (const x of responses.values()) if (!x.done) { x.done = true; x.status = 'lost_with_socket'; }
  const ek = await mintKey(); const old = ws; micHolding = true;
  RESEED = true; await openSession(ek); RESEED = false; try { old.terminate(); } catch {}
  // heard-only text of the interrupted turn: words ∝ heard audio (estimator, [I])
  const recv = r ? r.arrivals.reduce((s, a) => s + a.ms, 0) : 0;
  const words = r ? r.transcript.trim().split(/\s+/) : [];
  const heardWords = r && r.done ? words.slice(0, Math.floor(words.length * played / Math.max(1, recv))) : words.slice(0, Math.floor(played / 1000 * WPS));
  const seed = [...history]; if (r) seed.push({ role: "assistant", text: heardWords.join(" ") + (heardWords.length < words.length ? " —" : "") });
  for (const h of seed) send({ type: "conversation.item.create", item: h.role === "user" ? { type: "message", role: "user", content: [{ type: "input_text", text: h.text }] } : { type: "message", role: "assistant", content: [{ type: "output_text", text: h.text }] } });
  sendHeld();
  log("reseeded", { items: seed.length, heard_words: heardWords.length, of: words.length, ms_since_back: Math.round(now() - tBack) });
  if (r) { r.heardText = heardWords.join(" "); resume(r); }
  stalledAt = null; noticeAt = null; micHolding = false;
}
let RESEED = false;
const WPS = 2.6; // teacher words per second of audio, Taxila timing logs [I]

// ---- mic loop (40 ms chunks, continuous; silence when the child is not talking) ----
const CH = 1920; const SIL = Buffer.alloc(CH);
const chunks = (pcm) => { const a = []; for (let o = 0; o < pcm.length; o += CH) { const c = Buffer.alloc(CH); pcm.copy(c, 0, o, Math.min(o + CH, pcm.length)); a.push(c); } return a; };
let micStart = 0, micN = 0;
function micTick() {
  const due = Math.floor((now() - micStart) / 40);
  while (micN < due) { micN++; const c = micQueue.length ? micQueue.shift() : SIL; if (c.speechEnd) { turns[curTurn].speechEndSent = now(); }
    if (micHolding) { micHeld.push(c); continue; }
    RING.push({ t: now(), c }); if (RING.length > 150) RING.shift();
    if (ws && ws.readyState === 1) send({ type: "input_audio_buffer.append", audio: c.toString("base64") }); }
}
function speechEndOffset(pcm) { let last = 0; for (let i = 0; i < pcm.length; i += 2) if (Math.abs(pcm.readInt16LE(i)) > 600) last = i; return last; }

async function main() {
  await openSession(null); micStart = now(); setInterval(micTick, 10);
  const outageTurns = new Set();
  for (let i = 0; i < TURNS; i++) {
    curTurn = i; const clip = CLIPS[i % (CLIPS.length - 1)]; const cs = chunks(clip);
    const endIdx = Math.floor(speechEndOffset(clip) / CH); cs[endIdx].speechEnd = true;
    turns[i] = { i, text: LINES[i % (CLIPS.length - 1)], start: now() }; log("turn_start", { turn: i });
    micQueue.push(...cs);
    if (P.outage) outageTurns.add(i);
    // wait for a response to this turn, then for its audible end
    const tStart = now(); let r = null;
    while (now() - tStart < 40000) { await sleep(50); r = [...responses.values()].find((x) => x.turn === i && x.arrivals.length); if (r) break; }
    if (r && P.outage) r.outageTurn = true, scheduleOutageIfFirstAlready(r);
    // wait until all responses quiet: no response pending, playout ended, no stall
    const t1 = now();
    while (now() - t1 < 60000) { await sleep(100);
      const pending = [...responses.values()].some((x) => !x.done); const last = [...responses.values()].at(-1);
      const p = last && last.arrivals.length ? playout(last.arrivals, B_LIVE, last.cut ?? Infinity) : null;
      if (!pending && stalledAt === null && (!p || now() > p.end + 600) && now() > NET.b1 + (P.outage ? 3500 : 200) && !resumeBusy()) break; }
    history.push({ role: "user", text: turns[i].text });
    const tr = [...responses.values()].filter((x) => x.turn === i).map((x) => x.cut != null && x.heardText != null ? x.heardText : x.transcript).join(" ");
    history.push({ role: "assistant", text: tr });
  }
  await sleep(1500); report();
}
function resumeBusy() { return resumeFor && ![...responses.values()].some((x) => x.created > (resumeFor.outageAt ?? 0) && x !== resumeFor && x.done); }
function scheduleOutageIfFirstAlready(r) { if (r.arrivals.length && !r.outageScheduled) { r.outageScheduled = true; scheduleOutage(r); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function report() {
  const out = { profile: PNAME, P, B_LIVE, STALL_MS, NOTICE_MS, STALE_MS, date: new Date().toISOString(), pongRtt: pongRtts, turns: [], log: LOG };
  for (const t of turns) {
    const rs = [...responses.values()].filter((x) => x.turn === t.i);
    const first = rs.find((x) => x.arrivals.length);
    const row = { i: t.i, child: t.text, speechEndSent: t.speechEndSent, responses: rs.length,
      statuses: rs.map((x) => x.status), noAudio: rs.filter((x) => !x.arrivals.length).length,
      ttfa: first && t.speechEndSent ? Math.round(first.arrivals[0].t - t.speechEndSent) : null, words: rs.map((x) => x.transcript.trim().split(/\s+/).filter(Boolean).length),
      transcripts: rs.map((x) => x.transcript), heardText: rs.map((x) => x.heardText ?? null), playedMs: rs.map((x) => x.playedMs ?? null),
      discardedMs: rs.map((x) => Math.round(x.discardedMs || 0)), outageAt: rs.map((x) => x.outageAt ?? null), gaps: {} };
    for (const B of [0, 150, 300, 600]) row.gaps[B] = rs.filter((x) => x.arrivals.length).map((x) => { const p = playout(x.arrivals, B, x.cut ?? Infinity); return p.gaps.filter((g) => g >= 1 && p.start + 0 < (x.cut ?? Infinity)).map(Math.round); });
    row.arrivals = rs.map((x) => x.arrivals.map((a) => [Math.round(a.t), Math.round(a.ms)]));
    row.cut = rs.map((x) => x.cut ? Math.round(x.cut) : null); row.created = rs.map((x) => Math.round(x.created));
    out.turns.push(row);
  }
  fs.mkdirSync("results", { recursive: true });
  fs.writeFileSync(`results/${PNAME}.json`, JSON.stringify(out));
  const tt = out.turns.map((r) => r.ttfa).filter((x) => x != null).sort((a, b) => a - b);
  console.log(PNAME, "turns", out.turns.length, "ttfa med", tt[Math.floor(tt.length / 2)], "responses", out.turns.map((r) => r.responses).join(","), "pong med", Math.round(pongRtts.sort((a, b) => a - b)[Math.floor(pongRtts.length / 2)]));
  process.exit(0);
}
main();
