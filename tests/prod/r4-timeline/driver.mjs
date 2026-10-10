// r3-review: an interactive browser driver for an end-to-end experience review of the integrated tree on a LOCAL
// production build (node server/serve.mjs, NODE_ENV=production, Neon TEST). Not taxila.dev, not a child.
// A tiny HTTP command server (127.0.0.1:5199) holds Playwright sessions; the reviewer drives them one command at a time.
// Voice: the child's microphone is a synthetic stream (a speech clip, played for as long as the
// utterance would take); the transcription call (WebRTC to Azure, impossible from this sandbox) is a fake that sends the
// events gpt-live-transcribe sends, with the words the reviewer gives it and a FIXED finalisation delay (750 ms after a
// commit: measured commit->final p50 753 ms for taxila-live-transcribe, measurements.md 2026-10-04). Everything else is
// the product: the cascade link, the duplex engine, the turn, the ack, the TTS stream, the Desk.
import http from "node:http";
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { measureStage, measureDocument, canvasTextProbe } from "../../../server/forge3/qa/measure.js";
import { judgeView, judgeFrame } from "../../../server/forge3/qa/checks.js";

const BASE = process.env.TAXILA_BASE || "http://127.0.0.1:5190";
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../..");
const SHOTS = process.env.RV_SHOTS || join(ROOT, "docs/design/round4/build/latency/timeline-shots");
mkdirSync(SHOTS, { recursive: true });
// speech.wav is NOT committed (provenance of the round-3 clip unknown): synthesise it, see README.md.
const SPEECH_FILE = process.env.RV_SPEECH || join(HERE, "speech.wav");
let SPEECH; try { SPEECH = readFileSync(SPEECH_FILE); } catch { throw new Error("r4-timeline: no speech clip at " + SPEECH_FILE + " (see README.md)"); }
const ASR_FINAL_MS = Number(process.env.RV_ASR_FINAL_MS || 750);
const VIEWS = { phone360: { width: 360, height: 800, mobile: true }, phone412: { width: 412, height: 915, mobile: true }, laptop1366: { width: 1366, height: 768, mobile: false } };

process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("playwright");
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });

const INIT = ({ asrFinalMs }) => {
  if (window.top !== window) return;
  const T = () => performance.now();
  const R = (window.__rv = { audio: [], net: [], stt: [], says: [], client: [], errs: [], msgs: [] });
  window.addEventListener("message", (e) => { try { const d = typeof e.data === "string" ? e.data : JSON.stringify(e.data); if (!/viseme|level|frame_tick/.test(d)) { R.msgs.push({ t: T(), d: String(d).slice(0, 300) }); if (R.msgs.length > 300) R.msgs.splice(0, 100); } } catch { /* */ } });
  // her sound: every buffer source the page starts (ours are marked __fake)
  const oStart = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when = 0, ...rest) {
    try {
      if (!this.__fake) {
        const lead = Math.max(0, (when || 0) - this.context.currentTime);
        R.audio.push({ t: T() + lead * 1000, dur: this.buffer ? this.buffer.duration : null });
      }
    } catch { /* */ }
    return oStart.call(this, when, ...rest);
  };
  const oPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { try { R.audio.push({ t: T(), dur: this.duration || null, media: (this.currentSrc || "").slice(0, 80) }); } catch { /* */ } return oPlay.apply(this, arguments); };
  // network timeline (page clock)
  const of = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    const rec = /\/api\//.test(url) ? { path: url.replace(location.origin, "").split("?")[0], t0: T(), method: init?.method || "GET" } : null;
    if (rec && /lesson\/turn|turn-ack|turn-prefetch|tts-stream/.test(rec.path)) { try { rec.body = typeof init?.body === "string" ? init.body.slice(0, 400) : null; } catch { /* */ } }
    if (rec) { R.net.push(rec); if (R.net.length > 600) R.net.splice(0, 100); }
    try {
      const res = await of.apply(this, arguments);
      if (rec) { rec.t1 = T(); rec.status = res.status; }
      if (rec && /stt-token$/.test(rec.path)) res.clone().json().then((j) => window.__rvInitTd?.(j.__td ?? j.session?.audio?.input?.turn_detection ?? null)).catch(() => {});
      return res;
    } catch (e) { if (rec) { rec.t1 = T(); rec.err = String(e).slice(0, 120); } throw e; }
  };
  // the child's microphone: a synthetic stream
  const mctx = new AudioContext({ sampleRate: 48000 });
  const master = mctx.createGain();
  master.gain.value = 1;
  let speech = null;
  of("/__rv/speech.wav").then((r) => r.arrayBuffer()).then((a) => mctx.decodeAudioData(a)).then((b) => { speech = b; }).catch((e) => R.errs.push("speech " + e));
  // a faint room-noise floor so the stream is live
  try {
    const nb = mctx.createBuffer(1, 48000, 48000), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.0008;
    const ns = mctx.createBufferSource(); ns.__fake = true; ns.buffer = nb; ns.loop = true; ns.connect(master); ns.start();
  } catch { /* */ }
  const speak = (ms) => {
    if (!speech) return;
    let t = mctx.currentTime + 0.01;
    const end = t + ms / 1000;
    while (t < end - 0.05) {
      const s = mctx.createBufferSource(); s.__fake = true; s.buffer = speech; s.connect(master);
      const dur = Math.min(speech.duration, end - t);
      s.start(t, 0, dur); t += dur + 0.06;
    }
  };
  const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async (c) => {
    if (c && c.audio && !c.video) { await mctx.resume().catch(() => {}); const d = mctx.createMediaStreamDestination(); master.connect(d); R.stt.push({ t: T(), ev: "gum" }); return d.stream; }
    return gum(c);
  };
  // the fake transcription call
  const S = { dc: null, td: undefined, n: 0, pending: null };
  const emit = (e) => { R.stt.push({ t: T(), ev: e.type, item: e.item_id, text: e.transcript ?? e.delta }); try { S.dc?.onmessage?.({ data: JSON.stringify(e) }); } catch (err) { R.errs.push("emit " + err); } };
  const finish = (why) => {
    const p = S.pending;
    if (!p || p.done) return;
    p.done = true;
    const now = T();
    let text = p.text;
    if (now < p.end - 50) { const k = Math.max(1, Math.round(p.words.length * Math.max(0, (now - p.t0) / (p.end - p.t0)))); text = p.words.slice(0, k).join(" "); p.cut = text; }
    emit({ type: "input_audio_buffer.committed", item_id: p.id });
    p.commitAt = now; p.why = why;
    setTimeout(() => { emit({ type: "conversation.item.input_audio_transcription.completed", item_id: p.id, transcript: text }); p.finalAt = T(); }, asrFinalMs);
  };
  const onClient = (m) => {
    R.client.push({ t: T(), type: m.type, td: m.session?.audio?.input?.turn_detection ?? (m.session ? null : undefined) });
    if (m.type === "session.update" && m.session?.audio?.input && "turn_detection" in m.session.audio.input) S.td = m.session.audio.input.turn_detection;
    if (m.type === "input_audio_buffer.commit") finish("client_commit");
    if (m.type === "input_audio_buffer.clear" && S.pending && !S.pending.done) { S.pending.cleared = T(); }
  };
  window.RTCPeerConnection = class {
    constructor() { this.connectionState = "new"; this.iceConnectionState = "new"; }
    addTrack() { return {}; }
    getSenders() { return []; }
    createDataChannel() { const dc = { readyState: "connecting", send: (m) => { try { onClient(JSON.parse(m)); } catch { /* */ } }, close() { this.readyState = "closed"; } }; this.dc = dc; S.dc = dc; return dc; }
    async createOffer() { return { type: "offer", sdp: "v=0" }; }
    async setLocalDescription(d) { this.localDescription = d ?? { type: "offer", sdp: "v=0" }; }
    async setRemoteDescription() { setTimeout(() => { this.dc.readyState = "open"; this.connectionState = "connected"; this.onconnectionstatechange?.(); this.dc.onopen?.(); R.stt.push({ t: T(), ev: "dc_open" }); }, 30); }
    close() { this.connectionState = "closed"; }
    addEventListener() {}
    removeEventListener() {}
  };
  window.__rvInitTd = (td) => { if (S.td === undefined) S.td = td; };
  /** The child says `text` (synthetic voice for the utterance's length; the transcription events follow the session's mode). */
  window.__say = (text, o = {}) => {
    const words = String(text).split(/\s+/).filter(Boolean);
    const ms = o.ms ?? Math.max(900, Math.round(words.length * 380));
    const id = `it${++S.n}`, t0 = T();
    speak(ms);
    const p = { id, text, words, t0, end: t0 + ms, done: false };
    S.pending = p;
    R.says.push(p);
    const vad = S.td && S.td.type === "server_vad";
    p.mode = vad ? "vad" : "ptt";
    if (vad) setTimeout(() => emit({ type: "input_audio_buffer.speech_started", item_id: id, audio_start_ms: Math.round(t0) }), 150);
    words.forEach((w, i) => setTimeout(() => { if (!p.done || (p.finalAt === undefined)) emit({ type: "conversation.item.input_audio_transcription.delta", item_id: id, delta: (i ? " " : "") + w }); }, 450 + Math.round((ms * (i + 1)) / words.length)));
    if (vad) {
      const sil = Number(S.td.silence_duration_ms) || 900;
      setTimeout(() => { if (p.done) return; emit({ type: "input_audio_buffer.speech_stopped", item_id: id }); p.vadStopAt = T(); finish("server_vad"); }, ms + sil);
    }
    return { id, ms, mode: p.mode, td: S.td };
  };
  window.addEventListener("error", (e) => R.errs.push(String(e.message).slice(0, 200)));
};

const sessions = new Map();
const log = (sid, row) => appendFileSync(join(HERE, "run", `${sid}.jsonl`), JSON.stringify({ at: new Date().toISOString(), ...row }) + "\n");

async function open({ sid, cookie, url, view = "phone360", tokenPassThrough = true }) {
  const v = VIEWS[view];
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.mobile ? 2 : 1, hasTouch: v.mobile, isMobile: false });
  await ctx.addInitScript(canvasTextProbe);
  await ctx.addInitScript(INIT, { asrFinalMs: ASR_FINAL_MS });
  if (cookie) { const i = cookie.indexOf("="); await ctx.addCookies([{ name: cookie.slice(0, i), value: cookie.slice(i + 1), url: BASE }]); }
  await ctx.route("**/__rv/speech.wav", (r) => r.fulfill({ status: 200, contentType: "audio/wav", body: SPEECH }));
  // the real token route (the server's real session config), pointed at the fake call
  await ctx.route("**/api/voice/stt-token", async (r) => {
    try {
      const res = await r.fetch();
      const j = await res.json();
      const td = j?.session?.audio?.input?.turn_detection ?? null;
      return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...j, token: "ek_fake", base: "https://stt.invalid/openai/v1", __td: td }) });
    } catch (e) { return r.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: String(e) }) }); }
  });
  await ctx.route("https://stt.invalid/**", (r) => r.fulfill({ status: 201, contentType: "application/sdp", body: "v=0 answer" }));
  const page = await ctx.newPage();
  const s = { sid, ctx, page, view, turns: [], errors: [], console: [], last: null, play: [] };
  sessions.set(sid, s);
  page.on("pageerror", (e) => { s.errors.push(String(e.message).slice(0, 300)); log(sid, { pageerror: String(e.message).slice(0, 300) }); });
  page.on("console", (m) => { const t = m.text(); if (m.type() !== "debug") { s.console.push(`${m.type()}: ${t.slice(0, 240)}`); if (s.console.length > 300) s.console.splice(0, 50); } });
  page.on("response", async (r) => {
    const u = r.url();
    if (/\/api\/voice\/stt-token/.test(u)) return;
    if (!/\/api\/(lesson\/(start|turn|end)|play\/|studio\/|lesson\/turn-ack|child\/plan)/.test(u)) return;
    let j = null;
    try { j = await r.json(); } catch { /* not json / 204 */ }
    const path = u.replace(BASE, "").split("?")[0];
    const req = r.request();
    let body = null; try { body = JSON.parse(req.postData() ?? "null"); } catch { /* */ }
    if (j && j.instructions) delete j.instructions;
    const row = { path, status: r.status(), req: body && { childText: body.childText, typed: body.typed, chipId: body.chipId, moduleEvents: body.moduleEvents?.length ?? undefined, duplex: body.duplex ? Object.keys(body.duplex) : undefined }, res: j };
    if (/lesson\/(start|turn)$/.test(path) && j) { s.last = j; s.turns.push({ at: Date.now(), path, child: body?.childText ?? null, reply: j.teacherReply ?? j.teacherOpening ?? null, ask: j.ui?.ask?.text ?? null, itemId: j.ui?.ask?.itemId ?? null, tray: j.ui?.tray?.kind ?? j.ui?.tray ?? null, slot: j.ui?.studioSlot?.artifact?.kind ?? null, verdict: j.ui?.verdict ?? null, end: j.end ?? j.ended ?? null, status: r.status() }); }
    log(sid, row);
  });
  if (url) await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  return { ok: true, view };
}

const DOM = () => {
  const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05; };
  const q = (s) => document.querySelector(s);
  const txt = (s) => { const e = q(s); return e && vis(e) ? e.innerText.replace(/\s+/g, " ").trim().slice(0, 400) : null; };
  const box = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const buttons = [...document.querySelectorAll("button, [role=button], a[href]")].filter(vis).slice(0, 60).map((b) => {
    const cs = getComputedStyle(b);
    return { t: (b.innerText || b.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 60), id: b.getAttribute("data-testid") || undefined, box: box(b), fs: parseFloat(cs.fontSize), dis: b.disabled || undefined };
  });
  const mic = q('[data-testid="mic"]');
  const tray = q('[data-testid="tray"]');
  const stage = q('[data-testid="studio-stage"]');
  const frames = [...document.querySelectorAll("iframe")].filter(vis).map((f) => ({ box: box(f), src: (f.getAttribute("src") || "").slice(0, 80), sandbox: f.getAttribute("sandbox") }));
  const canv = [...document.querySelectorAll("canvas")].filter(vis).map((c) => ({ box: box(c), id: c.getAttribute("data-testid") || c.className || undefined }));
  // smallest visible text (DOM)
  let minFs = 99, minWhat = null;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode; if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (!el || !vis(el)) continue;
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < minFs) { minFs = fs; minWhat = n.textContent.trim().slice(0, 40); }
  }
  const off = [...document.querySelectorAll("button, [data-testid]")].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).slice(0, 8).map((e) => (e.getAttribute("data-testid") || e.innerText || "").slice(0, 30));
  return {
    url: location.pathname + location.search,
    vw: [innerWidth, innerHeight],
    caption: txt('[data-testid="caption"]'), question: txt('[data-testid="question-card"]'), status: txt('[data-testid="status"]'), phase: txt('[data-testid="phase-line"]'),
    stateWord: txt('[data-testid="state-word"]'),
    mic: mic && vis(mic) ? { floor: mic.getAttribute("data-floor"), on: mic.getAttribute("aria-pressed"), dis: mic.disabled, word: mic.innerText.trim() } : null,
    input: !!(q('[data-testid="child-input"]') && vis(q('[data-testid="child-input"]'))),
    tray: tray ? { kind: tray.getAttribute("data-kind"), text: tray.innerText.replace(/\s+/g, " ").trim().slice(0, 300), box: box(tray) } : null,
    stage: stage ? { kind: stage.getAttribute("data-kind"), legible: stage.getAttribute("data-legible"), box: box(stage) } : null,
    play: !!q('[data-testid="play-studio"]'), playGoal: txt('[data-testid="play-goal"]'), playCaption: txt('[data-testid="play-caption"]'), playControls: txt('[data-testid="play-controls"]'),
    sheet: [...document.querySelectorAll('[data-testid$="-sheet"], [role=dialog]')].filter(vis).map((e) => (e.getAttribute("data-testid") || "dialog") + ": " + e.innerText.replace(/\s+/g, " ").slice(0, 200)),
    frames, canvases: canv, buttons, minFs, minWhat, offscreen: off,
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    tapToHear: !!(q('[data-testid="tap-to-hear"]') && vis(q('[data-testid="tap-to-hear"]'))),
    bodyText: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 600),
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function state(s, { full = false } = {}) {
  const d = await s.page.evaluate(DOM).catch((e) => ({ err: String(e).slice(0, 200) }));
  const rv = await s.page.evaluate(() => { const R = window.__rv; return R ? { audioN: R.audio.length, lastAudio: R.audio.at(-1) ?? null, errs: R.errs.slice(-5), now: performance.now() } : null; }).catch(() => null);
  const last = s.last ? { reply: s.last.teacherReply ?? s.last.teacherOpening, ask: s.last.ui?.ask ?? null, tray: s.last.ui?.tray ?? null, slot: s.last.ui?.studioSlot ?? null, verdict: s.last.ui?.verdict ?? null, move: s.last.move?.kind ?? null, end: s.last.end ?? null, moduleCommands: s.last.moduleCommands ? (Array.isArray(s.last.moduleCommands) ? s.last.moduleCommands.length : 1) : 0 } : null;
  return { dom: d, rv, last: full ? last : last && { reply: last.reply, ask: last.ask?.text ?? null, askKind: last.ask?.kind ?? null, itemId: last.ask?.itemId ?? null, trayKind: last.tray?.kind ?? null, slotKind: last.slot?.artifact?.kind ?? last.slot?.kind ?? null, move: last.move, verdict: last.verdict, end: last.end }, errors: s.errors.slice(-5), turns: s.turns.length };
}

async function waitTurn(s, before, ms = 45_000) {
  const t = Date.now();
  while (s.turns.length === before && Date.now() - t < ms) await sleep(200);
  return s.turns.length > before;
}

/** After a turn: wait for her sound to start (or give up), then compute the gaps on the page clock. */
async function timeline(s, since) {
  return s.page.evaluate((since) => {
    const R = window.__rv;
    const say = R.says.filter((p) => p.t0 >= since).at(-1) ?? null;
    const end = say ? say.end : since;
    const net = R.net.filter((n) => n.t0 >= since - 50);
    const turn = net.find((n) => /\/api\/lesson\/turn$/.test(n.path));
    const ack = net.find((n) => /turn-ack$/.test(n.path));
    const pre = net.filter((n) => /turn-prefetch$/.test(n.path));
    const tts = net.filter((n) => /tts-stream$/.test(n.path));
    const audio = R.audio.filter((a) => a.t >= end - 5);
    const first = audio[0] ?? null;
    const afterTts = turn?.t1 ? audio.find((a) => a.t >= turn.t1) : null;
    const commits = R.client.filter((c) => c.t >= since && c.type === "input_audio_buffer.commit");
    const r = (x) => (x == null ? null : Math.round(x));
    return {
      said: say?.text ?? null, sent: turn?.body ? (turn.body.match(/"childText":"((?:[^"\\]|\\.)*)"/)?.[1] ?? null) : null, mode: say?.mode ?? null, speechMs: say ? r(say.end - say.t0) : null, cut: say?.cut ?? null, commitWhy: say?.why ?? null,
      endToCommit: say?.commitAt ? r(say.commitAt - end) : null, endToFinal: say?.finalAt ? r(say.finalAt - end) : null,
      endToTurnPost: turn ? r(turn.t0 - end) : null, turnMs: turn?.t1 ? r(turn.t1 - turn.t0) : null, turnStatus: turn?.status ?? null,
      ackStatus: ack?.status ?? null, endToAck: ack?.t1 ? r(ack.t1 - end) : null, prefetch: pre.map((p) => p.status),
      ttsN: tts.length, endToTts: tts[0] ? r(tts[0].t0 - end) : null,
      endToFirstSound: first ? r(first.t - end) : null, endToReplySound: afterTts ? r(afterTts.t - end) : null,
      clientCommits: commits.length,
    };
  }, since);
}

async function tapIfVisible(page, sel) { const l = page.locator(sel).first(); if (await l.isVisible().catch(() => false)) { await l.click({ timeout: 5000 }).catch(() => {}); return true; } return false; }

async function say(s, { text, wait = true, politeMs = 20_000, doneAfterMs = null, barge = false }) {
  const p = s.page;
  let since = await p.evaluate(() => performance.now());
  // tap-to-talk when the Desk shows the talk button (hands-free: no button)
  const micSel = '[data-testid="mic"]';
  let tapped = false;
  // a polite child waits until her voice has finished (hands-free has no talk button to tell it)
  if (!barge) {
    const t0 = Date.now();
    while (Date.now() - t0 < politeMs) {
      const quiet = await p.evaluate(() => { const R = window.__rv; const end = Math.max(0, ...R.audio.map((a) => a.t + (a.dur ?? 0) * 1000)); return performance.now() > end + 400; }).catch(() => true);
      if (quiet) break;
      await sleep(200);
    }
  }
  since = await p.evaluate(() => performance.now());
  if (await p.locator(micSel).isVisible().catch(() => false)) {
    if (!barge) { const t0 = Date.now(); while (Date.now() - t0 < politeMs) { const f = await p.locator(micSel).getAttribute("data-floor").catch(() => null); if (f === "your_turn" || f === "idle" || f === null) break; await sleep(250); } }
    const on = await p.locator(micSel).getAttribute("aria-pressed").catch(() => null);
    if (on !== "true") { await p.locator(micSel).click({ timeout: 5000 }).catch(() => {}); tapped = true; await sleep(250); }
  }
  const before = s.turns.length;
  const info = await p.evaluate((t) => window.__say(t), text);
  let doneTapped = false;
  if (tapped) {
    // a child who waits for the auto-end; Done after doneAfterMs (if given) or 4 s past the end of speech
    const lim = info.ms + (doneAfterMs ?? 4000);
    const t0 = Date.now();
    while (Date.now() - t0 < lim) {
      const committed = await p.evaluate((id) => !!window.__rv.says.find((x) => x.id === id)?.commitAt, info.id);
      if (committed) break;
      await sleep(100);
    }
    const committed = await p.evaluate((id) => !!window.__rv.says.find((x) => x.id === id)?.commitAt, info.id);
    if (!committed) { await p.locator(micSel).click({ timeout: 5000 }).catch(() => {}); doneTapped = true; }
  }
  if (!wait) return { info, tapped };
  const got = await waitTurn(s, before);
  // her sound: up to 15 s after the turn answer
  const t0 = Date.now();
  while (Date.now() - t0 < 15_000) {
    const tl = await timeline(s, since);
    if (tl.endToReplySound != null) break;
    await sleep(250);
  }
  await sleep(400);
  const tl = await timeline(s, since);
  const st = await state(s);
  const row = { op: "say", text, tapped, doneTapped, got, tl, last: st.last };
  log(s.sid, row);
  return { ...row, dom: { caption: st.dom.caption, question: st.dom.question, tray: st.dom.tray?.kind, trayText: st.dom.tray?.text?.slice(0, 160), stage: st.dom.stage, play: st.dom.play, playGoal: st.dom.playGoal, mic: st.dom.mic, sheet: st.dom.sheet } };
}

async function type(s, { text }) {
  const p = s.page;
  const since = await p.evaluate(() => performance.now());
  const input = p.locator('[data-testid="child-input"]');
  if (!(await input.isVisible().catch(() => false))) { await tapIfVisible(p, '[data-testid="type"]'); await sleep(600); }
  await input.waitFor({ state: "visible", timeout: 20_000 });
  await p.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 30_000 }).catch(() => {});
  const before = s.turns.length;
  const t = await p.evaluate(() => performance.now());
  await input.fill(text);
  await input.press("Enter");
  await p.evaluate((t) => window.__rv.says.push({ id: "typed", text: "(typed)", t0: t, end: performance.now(), mode: "typed" }), t);
  const got = await waitTurn(s, before);
  const t0 = Date.now();
  while (Date.now() - t0 < 12_000) { const tl = await timeline(s, since); if (tl.endToReplySound != null) break; await sleep(250); }
  const tl = await timeline(s, since);
  const st = await state(s);
  const row = { op: "type", text, got, tl, last: st.last };
  log(s.sid, row);
  return { ...row, dom: { caption: st.dom.caption, question: st.dom.question, tray: st.dom.tray?.kind, trayText: st.dom.tray?.text?.slice(0, 160), stage: st.dom.stage, play: st.dom.play, playGoal: st.dom.playGoal } };
}

async function shot(s, { name, views = null }) {
  const p = s.page;
  const out = [];
  const list = views === "all" ? Object.keys(VIEWS) : views ?? [s.view];
  for (const vid of list) {
    const v = VIEWS[vid];
    if (vid !== s.view) { await p.setViewportSize({ width: v.width, height: v.height }); await sleep(1600); }
    const m = await p.evaluate(measureStage).catch(() => null);
    const shown = await p.evaluate(() => ({ tray: document.querySelector('[data-testid="tray"]')?.getAttribute("data-kind") ?? null, stage: document.querySelector('[data-testid="studio-stage"]')?.getAttribute("data-kind") ?? null })).catch(() => ({}));
    let verdict = null;
    if (shown.tray === "module") {
      let fr = null, area = 0;
      for (const f of p.frames()) { if (f === p.mainFrame()) continue; const b = await (await f.frameElement().catch(() => null))?.boundingBox().catch(() => null); if (b && b.width * b.height > area) { area = b.width * b.height; fr = f; } }
      const d = fr ? await fr.evaluate(measureDocument).catch(() => null) : null;
      const j = judgeFrame(d ?? {}); verdict = { pass: j.pass, fails: j.fails, minPx: j.stats?.minPx ?? null, frame: true };
    } else if (m?.tray) { const j = judgeView(m, { artifactKind: shown.stage ?? undefined }); verdict = { pass: j.pass, fails: j.fails, minPx: j.stats?.minPx ?? null }; }
    const file = join(SHOTS, `${name}-${vid}.png`);
    await p.screenshot({ path: file, scale: "css" }).catch((e) => s.errors.push(`shot ${e.message}`));
    const d = await p.evaluate(DOM).catch(() => ({}));
    out.push({ view: vid, file, shown, verdict, minFs: d.minFs, minWhat: d.minWhat, overflowX: d.overflowX, offscreen: d.offscreen });
  }
  if (list.some((x) => x !== s.view)) { const v = VIEWS[s.view]; await p.setViewportSize({ width: v.width, height: v.height }); await sleep(800); }
  log(s.sid, { op: "shot", name, out });
  return out;
}

async function handle(c) {
  const s = c.sid ? sessions.get(c.sid) : null;
  switch (c.op) {
    case "open": return open(c);
    case "goto": await s.page.goto(BASE + c.url, { waitUntil: "domcontentloaded", timeout: 60_000 }); return { ok: true };
    case "state": return state(s, c);
    case "say": return say(s, c);
    case "type": return type(s, c);
    case "shot": return shot(s, c);
    case "wait": await sleep(c.ms ?? 1000); return state(s);
    case "click": {
      if (c.sel) await s.page.locator(c.sel).first().click({ timeout: c.timeout ?? 8000, force: !!c.force });
      else if (c.text) await s.page.getByText(c.text, { exact: !!c.exact }).first().click({ timeout: c.timeout ?? 8000 });
      else if (c.role) await s.page.getByRole(c.role, { name: c.name }).first().click({ timeout: c.timeout ?? 8000 });
      else await s.page.mouse.click(c.x, c.y);
      await sleep(c.after ?? 1200);
      return state(s);
    }
    case "tap": { await s.page.touchscreen.tap(c.x, c.y); await sleep(c.after ?? 1200); return state(s); }
    case "drag": {
      const m = s.page.mouse; await m.move(c.x1, c.y1); await m.down(); const n = c.steps ?? 12;
      for (let i = 1; i <= n; i++) { await m.move(c.x1 + ((c.x2 - c.x1) * i) / n, c.y1 + ((c.y2 - c.y1) * i) / n); await sleep(30); }
      await m.up(); await sleep(c.after ?? 1200); return state(s);
    }
    case "eval": return s.page.evaluate(c.js);
    case "frames": {
      const out = [];
      for (const f of s.page.frames()) { if (f === s.page.mainFrame()) continue; const t = await f.evaluate(() => document.body?.innerText?.replace(/\s+/g, " ").slice(0, 500)).catch((e) => "ERR " + e.message); out.push({ url: f.url().slice(0, 100), text: t }); }
      return out;
    }
    case "frameClick": {
      const fr = s.page.frames().filter((f) => f !== s.page.mainFrame());
      const f = fr[c.i ?? fr.length - 1];
      if (c.text) await f.getByText(c.text, { exact: !!c.exact }).first().click({ timeout: 6000 }); else await f.locator(c.sel).first().click({ timeout: 6000 });
      await sleep(c.after ?? 1200); return state(s);
    }
    case "turns": return s.turns.slice(c.from ?? -10);
    case "msgs": return s.page.evaluate(() => window.__rv.msgs.slice(-60));
    case "timeline": return s.page.evaluate(() => ({ says: window.__rv.says, net: window.__rv.net.slice(-40), audio: window.__rv.audio.slice(-30), stt: window.__rv.stt.slice(-40), client: window.__rv.client.slice(-20), now: performance.now() }));
    case "console": return s.console.slice(c.from ?? -30);
    case "viewport": { const v = VIEWS[c.view]; s.view = c.view; await s.page.setViewportSize({ width: v.width, height: v.height }); await sleep(1000); return state(s); }
    case "close": await s.ctx.close().catch(() => {}); sessions.delete(c.sid); return { ok: true };
    case "list": return [...sessions.keys()];
    case "quit": setTimeout(() => process.exit(0), 200); await browser.close().catch(() => {}); return { ok: true };
    default: throw new Error("unknown op " + c.op);
  }
}

http.createServer(async (req, res) => {
  let b = "";
  req.on("data", (d) => (b += d));
  req.on("end", async () => {
    let out;
    try { out = await handle(JSON.parse(b || "{}")); } catch (e) { out = { error: String(e?.message ?? e).slice(0, 600) }; }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(out, null, 1));
  });
}).listen(5199, "127.0.0.1", () => console.log("driver on :5199"));
