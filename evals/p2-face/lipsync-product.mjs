// Lip-sync and first draw ON THE PRODUCT PATH (ship5 p2-face). Not a harness: a real lesson page served by a real server
// (patches 01 + 02 applied), Diya synthesised live by Azure over the websocket, her viseme frames framed by the real
// /api/voice/tts-stream route, played by the real src/lesson/ttsStream.ts PcmStreamPlayer, drawn by the real puppet stage.
//   TAXILA_BASE=http://localhost:PORT node evals/p2-face/lipsync-product.mjs [--turns 3] [--throttle 4] [--tag name]
// What is recorded in the page (nothing in the product is changed for it; ?facerig=1 exposes the stage and the bus):
//   - every AudioBufferSourceNode.start(): its samples and `when`, i.e. exactly what the player scheduled;
//   - getOutputTimestamp() pairs each frame: AudioContext time -> performance.now() of the sound at the output;
//   - per animation frame: the lip gap the rig drew (rest-space px), the lip source (visemes / tap / level), the floor state;
//   - the puppet bus (viseme batches with playAt), the stage's event log (loaded, firstDraw, reveal + why, stall).
// Then, offline: the scheduled audio is laid on the performance clock and its log-energy envelope (10 ms windows, 5 ms
// hop) is cross-correlated with the drawn gap per reply (+ = the mouth is later than the sound). This is the SAME estimator
// as evals/face-puppet/lipsync-inapp.mjs (the harness's median +25 ms on the 24 judged lines, which sat -35 ms from the
// forced-alignment timing the judged clips used), so the two numbers compare like for like.
// Honest limits: headless Chromium on SwiftShader in a shared container (not a phone, no real speaker: the output clock
// is the browser's own estimate); the envelope-vs-gap correlation is weak per line (harness median r ~0.45).
import fs from "node:fs";
import { withTestAccount, launch, ok, warn, done, BASE } from "../../tests/prod/lib.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const TURNS = +arg("turns", "3");
const THROTTLE = +arg("throttle", "0");
const TAG = arg("tag", THROTTLE ? `throttle${THROTTLE}x` : "base");
const OUT = new URL("./out/", import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const REPLIES = ["haan, ready", "pata nahi, thoda samjhao", "achha, aur batao", "ek example do"];

const INIT = () => {
  const W = (window.__rec = { audio: [], ts: [], frames: [], bus: [], lt: [], ctx: null });
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) W.lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: "longtask", buffered: true }); } catch {}
  const start0 = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when = 0, offset = 0, duration) {
    try {
      const b = this.buffer;
      if (b && b.length) {
        W.ctx = this.context;
        const ch = b.getChannelData(0);
        const s = Math.max(0, Math.floor(offset * b.sampleRate));
        const n = duration !== undefined ? Math.min(ch.length - s, Math.floor(duration * b.sampleRate)) : ch.length - s;
        const i16 = new Int16Array(n);
        for (let i = 0; i < n; i++) i16[i] = Math.max(-32768, Math.min(32767, Math.round(ch[s + i] * 32767)));
        let bin = ""; const u8 = new Uint8Array(i16.buffer);
        for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
        W.audio.push({ when: when || this.context.currentTime, rate: b.sampleRate, at: performance.now(), loop: !!this.loop, n, ctxRate: this.context.sampleRate, pcm: btoa(bin) });
      }
    } catch (e) { W.err = String(e); }
    return start0.call(this, when, offset, duration);
  };
  const stop0 = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.stop = function (when) { try { W.audio.push({ stop: true, when: when ?? this.context.currentTime, at: performance.now() }); } catch {} return stop0.call(this, when); };
  let hooked = false;
  const loop = () => {
    const now = performance.now();
    const P = window.__puppet;
    if (P) {
      const m = P.mouthProbe();
      if (m) W.frames.push([Math.round(now * 10) / 10, Math.round(m.gap * 100) / 100, m.lip, m.state, m.revealed ? 1 : 0]);
    }
    if (!hooked && window.__puppetBus) { hooked = true; window.__puppetBus.on((e) => { if (e.kind === "visemes") W.bus.push({ at: performance.now(), part: e.part, playAt: e.playAt, n: e.visemes.length, words: e.words?.length ?? 0, v: e.visemes.map((x) => [x.ms, x.id]) }); else W.bus.push({ at: performance.now(), kind: e.kind }); }); }
    if (W.ctx && W.ctx.getOutputTimestamp) { const t = W.ctx.getOutputTimestamp(); if (t.contextTime && t.performanceTime) W.ts.push([t.contextTime, t.performanceTime]); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function pearson(a, b, lag) { let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0; for (let i = 0; i < a.length; i++) { const j = i + lag; if (j < 0 || j >= b.length || Number.isNaN(b[j]) || Number.isNaN(a[i])) continue; const x = a[i], y = b[j]; n++; sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; } if (n < 40) return -2; const c = sab / n - (sa / n) * (sb / n); return c / Math.sqrt((saa / n - (sa / n) ** 2) * (sbb / n - (sb / n) ** 2) + 1e-12); }

/** Lay the scheduled audio on the performance clock and cross-correlate its envelope with the drawn gap, per reply. */
export function analyse(rec) {
  const offs = rec.ts.map(([c, p]) => p - c * 1000);
  const off = q(offs, 0.5);
  const HOP = 5;
  // the scheduled samples on a 5 ms grid of the performance clock: each source's samples at perf = when*1000 + off
  const starts = rec.audio.filter((a) => !a.stop && a.rate === 24000).map((a) => {
    const b = Buffer.from(a.pcm, "base64"); const s = new Int16Array(b.buffer, b.byteOffset, b.length >> 1);
    return { t0: a.when * 1000 + off, rate: a.rate, s };
  });
  if (!starts.length || off == null) return { error: "no audio scheduled" };
  const T0 = Math.min(...starts.map((x) => x.t0)), T1 = Math.max(...starts.map((x) => x.t0 + (x.s.length / x.rate) * 1000));
  const n = Math.ceil((T1 - T0) / HOP) + 1;
  const e = new Float64Array(n), cnt = new Float64Array(n);
  for (const x of starts) for (let i = 0; i < x.s.length; i++) { const k = Math.floor((x.t0 + (i / x.rate) * 1000 - T0) / HOP); if (k >= 0 && k < n) { e[k] += (x.s[i] / 32768) ** 2; cnt[k]++; } }
  // 10 ms windows (2 hops), log energy; no audio scheduled = silence (-90 dB)
  const env = new Float64Array(n);
  for (let k = 0; k < n; k++) { const E = e[k] + (k + 1 < n ? e[k + 1] : 0), C = cnt[k] + (k + 1 < n ? cnt[k + 1] : 0); env[k] = C ? 10 * Math.log10(E / C + 1e-9) : -90; }
  // the drawn gap on the same grid (a frame is on screen until the next)
  const fr = rec.frames;
  const gap = new Float64Array(n).fill(NaN), lipAt = new Array(n).fill(null);
  let j = 0;
  for (let k = 0; k < n; k++) { const t = T0 + k * HOP; while (j + 1 < fr.length && fr[j + 1][0] <= t) j++; if (fr[j] && fr[j][0] <= t && (j + 1 >= fr.length || t - fr[j][0] < 250)) { gap[k] = fr[j][1]; lipAt[k] = fr[j][2]; } }
  // replies = runs of scheduled audio separated by >= 1.5 s of nothing
  const voiced = env.map((v) => v > -60);
  const segs = [];
  let s0 = -1, last = -1e9;
  for (let k = 0; k < n; k++) if (voiced[k]) { if (s0 < 0 || k - last > 300) { if (s0 >= 0) segs.push([s0, last]); s0 = k; } last = k; }
  if (s0 >= 0) segs.push([s0, last]);
  const rows = [];
  for (const [a, b] of segs) {
    if ((b - a) * HOP < 600) continue;
    const E = Array.from(env.slice(Math.max(0, a - 20), b + 20)), G = Array.from(gap.slice(Math.max(0, a - 20), b + 20));
    let best = -2, lag = 0;
    for (let l = -60; l <= 60; l++) { const r = pearson(E, G, l); if (r > best) { best = r; lag = l; } }
    const lips = lipAt.slice(a, b).filter((x, i) => voiced[a + i] && x);
    rows.push({ startMs: Math.round(T0 + a * HOP), secs: +(((b - a) * HOP) / 1000).toFixed(2), gapLagMs: lag * HOP, r: +best.toFixed(3), framesCovered: +(G.filter((x) => !Number.isNaN(x)).length / G.length).toFixed(2), visemeShare: lips.length ? +(lips.filter((x) => x === "visemes").length / lips.length).toFixed(3) : null });
  }
  // (A bilabial-closure metric was tried here and dropped: DragonHD's slow-rate speech does not dip the 10 ms envelope at
  // p/b/m reliably, so "min envelope" was not the closure; logged as rj-p2f-envelope-closure-metric.)
  const closure = {};
  // her first sound vs the face: was the live face revealed when her voice started, and how long after?
  const firstSound = T0 + (voiced.indexOf(true)) * HOP;
  const frameGapsSpeaking = [];
  for (let i = 1; i < fr.length; i++) if (fr[i][3] === "speaking") frameGapsSpeaking.push(fr[i][0] - fr[i - 1][0]);
  Object.defineProperty(closure, "grid", { enumerable: false, value: { T0, HOP, env: Array.from(env, (v) => Math.round(v * 10) / 10), gap: Array.from(gap, (v) => (Number.isNaN(v) ? null : Math.round(v * 100) / 100)) } });
  // per reply: its samples (24 kHz, silence where nothing was scheduled), the drawn gap and the envelope on the grid, for
  // the forced-alignment pass (ctc-product.py) and the paired score (score-product.mjs)
  const segments = segs.filter(([a, b]) => (b - a) * HOP >= 600).map(([a, b]) => {
    const t0 = T0 + a * HOP, t1 = T0 + (b + 1) * HOP;
    const pcm = new Int16Array(Math.ceil(((t1 - t0) / 1000) * 24000));
    for (const x of starts) { const off0 = Math.round(((x.t0 - t0) / 1000) * 24000); for (let i = 0; i < x.s.length; i++) { const j = off0 + i; if (j >= 0 && j < pcm.length) pcm[j] = x.s[i]; } }
    return { t0, pcm, gap: Array.from(gap.slice(a, b + 1), (v) => (Number.isNaN(v) ? null : v)) };
  });
  Object.defineProperty(closure, "segments", { enumerable: false, value: segments });
  return { outputOffsetMs: Math.round(off), firstSoundAt: Math.round(firstSound), replies: rows, closure, rafGapSpeakingP95: q(frameGapsSpeaking, 0.95), rafGapSpeakingMax: frameGapsSpeaking.length ? Math.max(...frameGapsSpeaking) : null };
}

const ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"];
let result = null;
await withTestAccount(async ({ api, child }) => {
  const h = await launch({ cookieFrom: api, viewport: THROTTLE ? { width: 360, height: 640 } : { width: 412, height: 860 }, launch: { args: ARGS } });
  try {
    await h.context.addInitScript(INIT);
    if (THROTTLE) { const cdp = await h.context.newCDPSession(h.page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE }); }
    const errors = [];
    h.page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
    // the reply texts (text lane: teacherOpening / teacherReply by seq) and the order she spoke them in (tts-stream seq)
    const texts = new Map(), spoken = [];
    h.page.on("response", async (r) => {
      const path = new URL(r.url()).pathname;
      if (!/\/api\/lesson\/(start|turn)$/.test(path)) return;
      const j = await r.json().catch(() => null);
      if (j?.teacherOpeningSeq != null) texts.set(j.teacherOpeningSeq, j.teacherOpening);
      if (j?.teacherReplySeq != null) texts.set(j.teacherReplySeq, j.teacherReply);
    });
    h.page.on("request", (r) => { if (/\/api\/voice\/tts-stream$/.test(r.url())) { try { spoken.push(JSON.parse(r.postData() || "{}").seq); } catch {} } });
    const t0 = Date.now();
    await h.page.goto(`${BASE}/c/${child.id}/lesson/new?mode=text&facerig=1`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await h.page.waitForFunction(() => !!window.__puppet || !!document.querySelector("[data-face]:not([data-face='puppet2d'])"), null, { timeout: 60_000 }).catch(() => {});
    const tap = h.page.getByText(/Tap to hear/);
    if (await tap.count()) await tap.first().click().catch(() => {});
    const speaking = () => h.page.evaluate(() => window.__rec.frames.slice(-8).some((f) => f[3] === "speaking"));
    const waitQuiet = async (maxMs) => { const t = Date.now(); let quietFor = 0; while (Date.now() - t < maxMs) { await h.page.waitForTimeout(500); if (await speaking()) quietFor = 0; else if ((quietFor += 500) >= 2500 && Date.now() - t > 4000) return; } };
    await waitQuiet(45_000);
    // the child's turns: type a reply when the dock has a text box, else tap the help tiles that make her speak
    // (class 3 text mode shows picture tiles, no box): "Show me how" (an explanation), "Hear it again" (a replay; on the
    // server it is a cache hit, so its visemes come from the marks cache), "Show me choices"
    const TILES = [/Show me how/, /Hear it again/, /Show me choices/, /Hear again/];
    for (let i = 0; i < TURNS; i++) {
      const box = h.page.locator("input.dk-input");
      if (await box.count()) {
        await box.first().fill(REPLIES[i % REPLIES.length]);
        await box.first().press("Enter");
      } else {
        let clicked = false;
        for (const re of [...TILES.slice(i % TILES.length), ...TILES]) { const b = h.page.getByRole("button", { name: re }); if (await b.count()) { await b.first().click().catch(() => {}); clicked = true; break; } }
        if (!clicked) { warn(`turn ${i + 1}: nothing to answer with`); break; }
      }
      await waitQuiet(60_000);
    }
    const rec = await h.page.evaluate(() => ({ ...window.__rec, ctx: null, log: window.__puppet?.log ?? [], snap: window.__puppet?.snapshot?.() ?? null, face: document.querySelector("[data-face]")?.getAttribute("data-face"), label: document.querySelector("[data-face]")?.getAttribute("aria-label") }));
    const a = analyse(rec);
    const firstDraw = rec.log.find((e) => e.type === "firstDraw"), reveal = rec.log.find((e) => e.type === "reveal");
    result = {
      date: new Date().toISOString(), loadavg1m: (await import("node:os")).loadavg()[0], base: BASE, tag: TAG, throttle: THROTTLE || 1, viewport: THROTTLE ? "360x640 dpr 1 (CPU-throttled desktop Chromium; NOT a phone)" : "412x860 dpr 1",
      method: "real lesson page (?mode=text), real server route + Azure websocket synthesis, real ttsStream player, real puppet stage; Chromium headless SwiftShader",
      face: rec.face, label: rec.label, pageErrors: errors, wallMs: Date.now() - t0,
      firstDrawMs: firstDraw?.ms ?? null, reveal: reveal ? { ms: reveal.ms, why: reveal.why } : null, revealedBeforeFirstSound: reveal ? reveal.at <= a.firstSoundAt : null,
      stalls: rec.log.filter((e) => e.type === "stall"), longTasks: rec.lt.length, longTaskMaxMs: rec.lt.length ? Math.max(...rec.lt.map((x) => x[1])) : 0,
      busBatches: rec.bus.filter((b) => b.n).length, busVisemes: rec.bus.reduce((s, b) => s + (b.n || 0), 0), busWords: rec.bus.reduce((s, b) => s + (b.words || 0), 0), cuts: rec.bus.filter((b) => b.kind === "cut").length,
      snapshot: rec.snap, ...a,
    };
    const segDir = `${OUT}product/`;
    fs.mkdirSync(segDir, { recursive: true });
    (a.closure?.segments ?? []).forEach((sg, k) => {
      const seq = spoken[k];
      fs.writeFileSync(`${segDir}${TAG}-${k}.pcm`, Buffer.from(sg.pcm.buffer));
      fs.writeFileSync(`${segDir}${TAG}-${k}.json`, JSON.stringify({ tag: TAG, k, seq: seq ?? null, text: seq != null ? texts.get(seq) ?? null : null, t0: sg.t0, hopMs: 5, gap: sg.gap }));
    });
    fs.writeFileSync(`${OUT}lipsync-product-${TAG}-raw.json`, JSON.stringify({ frames: rec.frames, bus: rec.bus, log: rec.log, ts: rec.ts.length, grid: a.closure?.grid, audio: rec.audio.map(({ pcm, ...m }, i) => (process.env.P2F_SAVE_PCM && i < 3 ? { ...m, pcm } : m)) }));
  } finally { await h.browser.close(); }
}, { child: { classLevel: 3 }, tag: "p2face" });

if (result) {
  fs.writeFileSync(`${OUT}lipsync-product-${TAG}.json`, JSON.stringify(result, null, 1));
  console.log(JSON.stringify({ ...result, closure: { ...result.closure, all: undefined }, replies: result.replies?.map((r) => `${r.secs}s lag ${r.gapLagMs} r ${r.r} vis ${r.visemeShare}`) }, null, 1));
  ok(result.face === "puppet2d", "the lesson face is the puppet");
  ok(/AI teacher/.test(result.label ?? ""), "the AI disclosure is on the face host");
  ok((result.replies?.length ?? 0) > 0, "her replies were scheduled and recorded");
}
done();
