// The probe fleet (BUILD-PLAN W1-D item 5): what the sandbox cannot measure, measured from Azure regions with real UDP.
// Runs as an ACA job in Central India (an Indian vantage point) and eastus2 (next to the app), nightly and on demand.
//
//   node infra/probes/probe.mjs [--base URL] [--region NAME] [--n 5] [--no-upload]
//
// Legs (each self-cleaning: every test account is deleted in a finally, tests/prod/lib.mjs):
//   rtt        GET /api/health ×20: p50 / p90 time to response (the India ↔ eastus2 round trip plus a trivial handler)
//   pages      cold-cache page loads, NO route interception (b4-rejected-perf-with-route-interception): FCP / LCP of /,
//              /start, /who, /promises at 360×740 DPR 2, n=3 each
//   realtime   a REALTIME WebRTC lesson: lesson/start (voice) → /api/realtime/token → RTCPeerConnection + "oai-events"
//              data channel to Azure, mic = Chromium's fake device playing child-answer.wav (a child-like Hinglish answer,
//              "...answer baarah hai. Twelve!"): ICE connected, first teacher audio, the answer transcribed, and that
//              transcript sent to /api/lesson/turn exactly as the client does → the turn advances
//   cascade    the default voice lane's three hops from this region, n=--n: /api/voice/transcribe (the same WAV) →
//              /api/lesson/turn → /api/voice/tts-stream first byte; composite = their sum (+ endpoint silence, not here)
// Output: one JSON line (kind "probe_result") on stdout → Log Analytics, and the JSON to the PRIVATE blob container
// `probes` (<region>/<iso>.json + <region>/latest.json). Regression: a leg failing, or rtt/cascade p50 more than 50%
// over the previous run's, prints PROBE REGRESSION and exits 1 (the job-failures alert emails the owner).
import { readFileSync } from "fs";
import { createHmac } from "crypto";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
if (opt("--base", null)) process.env.TAXILA_BASE = opt("--base");
const REGION = opt("--region", process.env.PROBE_REGION || "local");
const N = Number(opt("--n", "5"));
const WAV = new URL("./child-answer.wav", import.meta.url).pathname;
const { BASE, apiClient, withTestAccount, launch } = await import("../../tests/prod/lib.mjs");

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : null; };
const out = { kind: "probe_result", region: REGION, base: BASE, at: new Date().toISOString(), legs: {}, ok: true };
const fail = (leg, why) => { out.legs[leg] = { ...(out.legs[leg] || {}), ok: false, error: String(why).slice(0, 300) }; out.ok = false; console.error(`[probe] ${leg}: ${why}`); };
const log = (s) => console.error(`[probe ${REGION}] ${s}`);

// ───────────── rtt ─────────────
async function rtt() {
  const ms = [];
  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    const r = await fetch(`${BASE}/api/health`, { cache: "no-store" });
    await r.arrayBuffer();
    ms.push(Math.round(performance.now() - t0));
  }
  out.legs.rtt = { ok: true, n: ms.length, first: ms[0], p50: pct(ms.slice(1), 0.5), p90: pct(ms.slice(1), 0.9) };
  log(`rtt p50 ${out.legs.rtt.p50} ms (first ${ms[0]} ms incl. TLS)`);
}

// ───────────── pages ─────────────
async function pages() {
  const rows = [];
  for (const path of ["/", "/start", "/who", "/promises"]) {
    for (let i = 0; i < 3; i++) {
      const { browser, page } = await launch({ viewport: { width: 360, height: 740 } });
      try {
        await page.addInitScript(() => {
          window.__lcp = 0; window.__fcp = 0;
          new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__fcp = e.startTime; }).observe({ type: "paint", buffered: true });
        });
        const t0 = Date.now();
        await page.goto(BASE + path, { waitUntil: "load", timeout: 60_000 });
        await page.waitForTimeout(1500);
        const m = await page.evaluate(() => ({ fcp: Math.round(window.__fcp), lcp: Math.round(window.__lcp), ttfb: Math.round(performance.getEntriesByType("navigation")[0]?.responseStart ?? 0) }));
        rows.push({ path, ...m, load: Date.now() - t0 });
      } finally { await browser.close(); }
    }
  }
  const by = {};
  for (const r of rows) (by[r.path] ||= []).push(r);
  out.legs.pages = { ok: true, n: rows.length, pages: Object.fromEntries(Object.entries(by).map(([p, rs]) => [p, { fcp: pct(rs.map((r) => r.fcp), 0.5), lcp: pct(rs.map((r) => r.lcp), 0.5), ttfb: pct(rs.map((r) => r.ttfb), 0.5) }])) };
  log(`pages ${JSON.stringify(out.legs.pages.pages)}`);
}

// ───────────── realtime WebRTC lesson ─────────────
async function realtime() {
  await withTestAccount(async ({ api, child }) => {
    const start = await api("POST", "/api/lesson/start", { childId: child.id, mode: "voice" });
    const tok = await api("POST", "/api/realtime/token", { lessonId: start.lessonId });
    const { browser, page } = await launch({ launch: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${WAV}`, "--autoplay-policy=no-user-gesture-required"] }, cookieFrom: api });
    try {
      await page.context().grantPermissions(["microphone"]);
      await page.goto(BASE + "/promises", { waitUntil: "domcontentloaded" });
      const r = await page.evaluate(async ({ token, base }) => {
        const t0 = performance.now(), at = () => Math.round(performance.now() - t0);
        const res = { ice: null, iceMs: null, channelMs: null, firstAudioMs: null, transcripts: [], teacher: "", errors: [] };
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        const pc = new RTCPeerConnection();
        for (const t of mic.getAudioTracks()) pc.addTrack(t, mic);
        pc.oniceconnectionstatechange = () => { res.ice = pc.iceConnectionState; if (/connected|completed/.test(pc.iceConnectionState) && res.iceMs == null) res.iceMs = at(); };
        pc.ontrack = (e) => { const a = new Audio(); a.srcObject = e.streams[0]; a.play().catch(() => {}); };
        const dc = pc.createDataChannel("oai-events");
        dc.onmessage = (m) => {
          let e; try { e = JSON.parse(m.data); } catch { return; }
          if ((e.type === "output_audio_buffer.started" || e.type === "response.output_audio.delta") && res.firstAudioMs == null) res.firstAudioMs = at();
          if (e.type === "response.output_audio_transcript.delta") res.teacher += e.delta || "";
          if (e.type === "conversation.item.input_audio_transcription.completed") res.transcripts.push({ ms: at(), text: e.transcript });
          if (e.type === "error") res.errors.push(e.error?.message || "error");
        };
        dc.onopen = () => { res.channelMs = at(); dc.send(JSON.stringify({ type: "response.create" })); };
        await pc.setLocalDescription(await pc.createOffer());
        const sdp = await fetch(`${base.replace(/\/+$/, "")}/realtime/calls`, { method: "POST", body: pc.localDescription.sdp, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/sdp" } });
        if (!sdp.ok) { res.errors.push(`sdp ${sdp.status}`); return res; }
        await pc.setRemoteDescription({ type: "answer", sdp: await sdp.text() });
        // the file loops: 8 s silence, the answer, 10 s silence; wait for a transcript containing the answer
        for (let i = 0; i < 90 && !res.transcripts.some((t) => /12|baa?rah?|twelve|बारह|बारा/i.test(t.text)); i++) await new Promise((r) => setTimeout(r, 500));
        const stats = await pc.getStats();
        stats.forEach((s) => { if (s.type === "inbound-rtp" && s.kind === "audio") res.audioBytes = s.bytesReceived; if (s.type === "candidate-pair" && s.nominated && s.state === "succeeded") res.rttMs = Math.round((s.currentRoundTripTime || 0) * 1000); });
        pc.close(); mic.getTracks().forEach((t) => t.stop());
        return res;
      }, { token: tok.token, base: tok.base });
      const heard = r.transcripts.find((t) => /12|baa?rah?|twelve|बारह|बारा/i.test(t.text));
      let turn = null;
      if (heard) {
        turn = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText: heard.text, asrConfidence: 0.9, typed: false, teacherText: r.teacher.slice(0, 2000) || undefined, turnSeq: 1 });
      }
      out.legs.realtime = { ok: !!(/connected|completed/.test(r.ice || "") || r.iceMs) && r.firstAudioMs != null && !!heard && !!turn?.move?.kind,
        iceMs: r.iceMs, channelMs: r.channelMs, firstAudioMs: r.firstAudioMs, audioBytes: r.audioBytes ?? null, mediaRttMs: r.rttMs ?? null,
        transcript: heard?.text ?? r.transcripts.map((t) => t.text).join(" | ").slice(0, 200), transcriptMs: heard?.ms ?? null,
        turnMove: turn?.move?.kind ?? null, turnMs: turn?.ms ?? null, errors: r.errors.slice(0, 5) };
      if (!out.legs.realtime.ok) { out.ok = false; log(`realtime FAILED ${JSON.stringify(out.legs.realtime)}`); }
      else log(`realtime ok: ICE ${r.iceMs} ms, first audio ${r.firstAudioMs} ms, heard "${heard.text}", turn → ${turn.move.kind} (${turn.ms} ms)`);
      await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
    } finally { await browser.close(); }
  }, { tag: `probe-${REGION}` });
}

// ───────────── cascade hops ─────────────
async function cascade() {
  const wav = readFileSync(WAV).toString("base64");
  const rows = [];
  await withTestAccount(async ({ api, child }) => {
    const start = await api("POST", "/api/lesson/start", { childId: child.id, mode: "cascade" });
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      const tr = await api("POST", "/api/voice/transcribe", { lessonId: start.lessonId, audio: wav, mime: "audio/wav" });
      const tTr = performance.now() - t0;
      const turn = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText: tr.text || "baarah", asrConfidence: tr.asrConfidence ?? 0.9, typed: false, turnSeq: i + 1 });
      const tTurn = turn.ms;
      let ttfb = null;
      if (turn.teacherReplySeq) {
        const t1 = performance.now();
        const res = await fetch(`${BASE}/api/voice/tts-stream`, { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie() }, body: JSON.stringify({ lessonId: start.lessonId, seq: turn.teacherReplySeq }) });
        const reader = res.body?.getReader();
        if (reader) { await reader.read(); ttfb = Math.round(performance.now() - t1); for (;;) { const { done } = await reader.read(); if (done) break; } }
      }
      rows.push({ transcribe: Math.round(tTr), turn: tTurn, tts: ttfb, text: tr.text });
      if (turn.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
  }, { tag: `probe-${REGION}` });
  const comp = rows.filter((r) => r.tts != null).map((r) => r.transcribe + r.turn + r.tts);
  out.legs.cascade = { ok: rows.length > 0 && comp.length > 0, n: rows.length, transcribeP50: pct(rows.map((r) => r.transcribe), 0.5), turnP50: pct(rows.map((r) => r.turn), 0.5),
    ttsFirstByteP50: pct(rows.filter((r) => r.tts != null).map((r) => r.tts), 0.5), compositeP50: pct(comp, 0.5), compositeP90: pct(comp, 0.9), heard: rows[0]?.text ?? null };
  log(`cascade composite p50 ${out.legs.cascade.compositeP50} ms (transcribe ${out.legs.cascade.transcribeP50} + turn ${out.legs.cascade.turnP50} + tts ${out.legs.cascade.ttsFirstByteP50}), heard "${rows[0]?.text}"`);
}

// ───────────── results to Blob (private container `probes`) ─────────────
const VERSION = "2021-08-06";
async function blob(method, path, body) {
  const account = process.env.AZURE_STORAGE_ACCOUNT, key = process.env.AZURE_STORAGE_KEY, container = process.env.PROBE_CONTAINER || "probes";
  if (!account || !key) return null;
  const buf = body ? Buffer.from(body) : null;
  const headers = { "x-ms-date": new Date().toUTCString(), "x-ms-version": VERSION, ...(buf ? { "content-length": String(buf.length), "content-type": "application/json", "x-ms-blob-type": "BlockBlob" } : {}) };
  const xms = Object.keys(headers).filter((h) => h.startsWith("x-ms-")).sort().map((h) => `${h}:${headers[h]}`).join("\n");
  const sts = [method, "", "", buf ? String(buf.length) : "", "", buf ? "application/json" : "", "", "", "", "", "", "", xms, `/${account}/${container}/${path}`].join("\n");
  const sig = createHmac("sha256", Buffer.from(key, "base64")).update(sts, "utf8").digest("base64");
  const r = await fetch(`https://${account}.blob.core.windows.net/${container}/${path}`, { method, headers: { ...headers, authorization: `SharedKey ${account}:${sig}` }, body: buf ?? undefined });
  return r;
}

for (const [name, fn] of [["rtt", rtt], ["pages", pages], ["realtime", realtime], ["cascade", cascade]]) {
  if (argv.includes(`--skip-${name}`)) continue;
  try { await fn(); } catch (e) { fail(name, e?.message ?? e); }
}

// regression against the previous run of this region
let prev = null;
try { const r = await blob("GET", `${REGION}/latest.json`); if (r?.ok) prev = await r.json(); } catch { /* first run */ }
const worse = (a, b) => a != null && b != null && b > 0 && a > b * 1.5;
const reg = [];
if (prev) {
  if (worse(out.legs.rtt?.p50, prev.legs?.rtt?.p50)) reg.push(`rtt p50 ${prev.legs.rtt.p50} → ${out.legs.rtt.p50} ms`);
  if (worse(out.legs.cascade?.compositeP50, prev.legs?.cascade?.compositeP50)) reg.push(`cascade p50 ${prev.legs.cascade.compositeP50} → ${out.legs.cascade.compositeP50} ms`);
}
out.regressions = reg;
if (!argv.includes("--no-upload")) {
  const body = JSON.stringify(out, null, 1);
  const a = await blob("PUT", `${REGION}/${out.at.replace(/[:.]/g, "-")}.json`, body).catch((e) => ({ status: String(e.message) }));
  await blob("PUT", `${REGION}/last-run.json`, body).catch(() => {});
  if (out.ok) await blob("PUT", `${REGION}/latest.json`, body).catch(() => {});
  log(`results → blob probes/${REGION}/ (${a?.status ?? "no storage key"})`);
}
process.stdout.write(JSON.stringify(out) + "\n");
if (!out.ok || reg.length) { console.error(`[probe] PROBE REGRESSION ${REGION}: ${[...Object.entries(out.legs).filter(([, l]) => !l.ok).map(([k]) => `${k} failed`), ...reg].join("; ")}`); process.exit(1); }
