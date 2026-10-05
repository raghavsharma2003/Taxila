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

import { INIT, analyse, q } from "./recorder.mjs";

const ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"];
let result = null;
await withTestAccount(async ({ api, child }) => {
  // --throttle N: a budget-phone PROFILE on desktop Chromium (360x780 CSS px at DPR 2, touch, CPU throttled N x by CDP).
  // Not a phone: CDP throttles the renderer's main thread only, and SwiftShader rasterises on the host CPU in the GPU
  // process, unthrottled; the GPU side of a Mali-G52 is not modelled at all.
  const h = THROTTLE ? await (async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ args: ARGS });
    const context = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true });
    const c = api.cookie(); const i = c.indexOf("=");
    await context.addCookies([{ name: c.slice(0, i), value: c.slice(i + 1), url: BASE }]);
    return { browser, context, page: await context.newPage() };
  })() : await launch({ cookieFrom: api, viewport: { width: 412, height: 860 }, launch: { args: ARGS } });
  const fpsSamples = [];
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
    await h.page.goto(`${BASE}/c/${child.id}/lesson/new?mode=text&facerig=1${process.env.P2F_PUPPET_OFF ? "&puppet=0" : ""}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await h.page.waitForFunction(() => !!window.__puppet || !!document.querySelector("[data-face]:not([data-face='puppet2d'])"), null, { timeout: 60_000 }).catch(() => {});
    const tap = h.page.getByText(/Tap to hear/);
    if (await tap.count()) await tap.first().click().catch(() => {});
    const speaking = async () => {
      // speaking = the puppet says so, or her scheduled TTS audio has not finished (the ?puppet=0 control arm has no puppet)
      const r = await h.page.evaluate(() => { const W = window.__rec; const audioOn = !!W.ctx && W.audio.some((a) => !a.stop && a.rate === 24000 && a.when + a.n / a.rate > W.ctx.currentTime - 0.3); return { s: audioOn || W.frames.slice(-8).some((f) => f[3] === "speaking"), snap: window.__puppet?.snapshot?.() ?? null }; });
      if (r.snap) fpsSamples.push({ ...r.snap, speaking: r.s });
      return r.s;
    };
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
    const rec = await h.page.evaluate(() => ({ ...window.__rec, ctx: null, rafGaps: window.__rec.rafGaps, log: window.__puppet?.log ?? [], snap: window.__puppet?.snapshot?.() ?? null, face: document.querySelector("[data-face]")?.getAttribute("data-face"), label: document.querySelector("[data-face]")?.getAttribute("aria-label") }));
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
      fps: (() => {
        const sp = fpsSamples.filter((x) => x.speaking && x.frames > 60), idle = fpsSamples.filter((x) => !x.speaking && x.frames > 60);
        return { n: fpsSamples.length, speakingFpsP50: q(sp.map((x) => x.fpsP50), 0.5), idleFpsP50: q(idle.map((x) => x.fpsP50), 0.5), workP95Median: q(fpsSamples.map((x) => x.workP95), 0.5), workP95Max: fpsSamples.length ? Math.max(...fpsSamples.map((x) => x.workP95)) : null, finalDpr: rec.snap?.dpr, finalFpsCap: rec.snap?.fpsCap, governor: rec.log.filter((e) => e.type === "governor" || e.type === "fallback") };
      })(),
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
