// Measurement harness for the Antariksh Nishana prototype (FEASIBILITY.md §5). PROXY ONLY: headless Chromium on a shared
// x86 container, software GL (SwiftShader), CPU throttled by CDP. It is not a phone and its GPU is not a Mali or an Adreno.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node docs/research/round4/games/proto/measure/run.mjs [fps|load|shots|video|all]
// Writes results/*.json and shots/* next to this folder. Never runs `playwright install`.
import http from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join, extname, dirname, resolve } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { loadavg } from "node:os";
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";

const HERE = dirname(fileURLToPath(import.meta.url)), PROTO = resolve(HERE, ".."), REPO = resolve(PROTO, "../../../../..");
const OUT = join(PROTO, "results"), SHOTS = join(PROTO, "shots"); mkdirSync(OUT, { recursive: true }); mkdirSync(SHOTS, { recursive: true });
const MODE = process.argv[2] ?? "all";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".woff2": "font/woff2", ".css": "text/css" };
const cache = new Map();
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.startsWith("/fonts/")) p = "/public" + p;
  if (p.startsWith("/cdn/three/")) p = "/node_modules/three/build/" + p.slice(11);     // same bytes as the pinned CDN file (0.180.0)
  const f = resolve(join(REPO, p));
  if (!f.startsWith(REPO) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  const type = TYPES[extname(f)] ?? "application/octet-stream", ae = String(req.headers["accept-encoding"] ?? "");
  let body = readFileSync(f), enc = null;
  if (/text|javascript|json/.test(type) && body.length > 1024) {
    enc = ae.includes("br") ? "br" : ae.includes("gzip") ? "gzip" : null;
    if (enc) { const k = f + enc; if (!cache.has(k)) cache.set(k, enc === "br" ? brotliCompressSync(body) : gzipSync(body)); body = cache.get(k); }
  }
  res.writeHead(200, { "content-type": type, "cache-control": "no-store", ...(enc ? { "content-encoding": enc } : {}) }); res.end(body);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const PAGE = `${BASE}/docs/research/round4/games/proto/index.html`;
const browser = await chromium.launch({ headless: true, args: ["--enable-precise-memory-info", "--ignore-gpu-blocklist"] });

/** page whose import map points at the local server (so CDP network throttling applies to three.js too) */
async function open(ctx, query, { throttle = 1, net = null } = {}) {
  const page = await ctx.newPage();
  await page.route(/index\.html/, async (route) => {
    const r = await route.fetch(); let html = await r.text();
    html = html.replace("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js", `${BASE}/cdn/three/three.module.min.js`);
    await route.fulfill({ response: r, body: html, headers: { ...r.headers(), "content-encoding": "identity", "content-length": String(Buffer.byteLength(html)) } });
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");
  if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  if (net) { await cdp.send("Network.enable"); await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: net.rtt, downloadThroughput: net.down * 125000, uploadThroughput: net.up * 125000 }); }
  const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${PAGE}?${query}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.__firstFrameMs !== undefined, null, { timeout: 120000 });
  return { page, cdp, errors };
}
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
async function heap(cdp) { const m = await cdp.send("Performance.getMetrics"); const g = (n) => m.metrics.find((x) => x.name === n)?.value ?? null; return { jsHeapUsedMB: +(g("JSHeapUsedSize") / 1048576).toFixed(1), jsHeapTotalMB: +(g("JSHeapTotalSize") / 1048576).toFixed(1), nodes: g("Nodes") }; }
async function textAudit(page) {
  return page.evaluate(() => { let min = 99, minHi = 99, n = 0;
    for (const el of document.querySelectorAll("#app *")) { if (!el.childNodes.length) continue; const own = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()); if (!own) continue;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (cs.display === "none" || +cs.opacity === 0 || r.width === 0 || el.closest("#debug")) continue;
      const fs = parseFloat(cs.fontSize); n++; min = Math.min(min, fs); if (/[ऀ-ॿ]/.test(el.textContent)) minHi = Math.min(minHi, fs); }
    const b = document.querySelector("#fire").getBoundingClientRect(); return { textNodes: n, minFontPx: min, minDevanagariPx: minHi === 99 ? null : minHi, fireBtn: [Math.round(b.width), Math.round(b.height)], hOverflow: document.documentElement.scrollWidth > innerWidth }; });
}

const results = { when: new Date().toISOString(), host: "shared 4-core x86 container, headless Chromium (SwiftShader software GL)", proxy: true, runs: [] };

async function fpsRun(label, { w = 360, h = 800, scale = 2, throttle = 4, query = "bot=1&dpr=1.5", warm = 3000, ms = 12000 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, isMobile: w < 500, hasTouch: w < 500 });
  const { page, cdp, errors } = await open(ctx, query, { throttle });
  await page.waitForTimeout(warm); await page.evaluate(() => window.__perf(true));
  await page.waitForTimeout(ms);
  const perf = await page.evaluate(() => window.__perf()), mem = await heap(cdp), audit = await textAudit(page);
  const levels = await page.evaluate(() => window.__levels.map((l) => ({ level: l.level, acts: l.acts, shown: l.shown })));
  await ctx.close();
  const row = { label, viewport: [w, h], deviceScaleFactor: scale, cpuThrottle: throttle, query, measureMs: ms, ...perf, ...mem, audit, errors: errors.slice(0, 5), loadavg1: +loadavg()[0].toFixed(2) };
  results.runs.push(row); console.log(label, JSON.stringify({ fps: perf.fpsMedian, p95: perf.frameP95, work: perf.workP50, calls: perf.calls, tris: perf.triangles, heap: mem.jsHeapUsedMB, dpr: perf.dpr, steps: perf.dprSteps, levels: perf.levels, errors: errors.length, load: +loadavg()[0].toFixed(2) }));
  return { row, levels };
}

if (MODE === "smoke") {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const { page, errors } = await open(ctx, process.argv[3] ?? "bot=mis&debug&dpr=1.5");
  await page.waitForTimeout(Number(process.argv[4] ?? 9000));
  console.log(JSON.stringify(await page.evaluate(() => ({ perf: window.__perf(), spec: window.__spec, ev: window.__evidence, first: window.__firstFrameMs, levels: window.__levels.map((l) => l.shown) })), null, 0));
  await page.screenshot({ path: join(OUT, "_smoke.jpg"), type: "jpeg", quality: 70 });
  console.log("errors", errors); await ctx.close();
}
if (MODE === "fps" || MODE === "all") {
  const replay = [];
  for (let i = 0; i < 3; i++) { const { levels } = await fpsRun(`tierC-proxy dpr1.5 x4 #${i + 1}`); replay.push(...levels.filter((l) => l.shown.every(Boolean))); }
  for (let i = 0; i < 3; i++) await fpsRun(`pessimistic dpr2 x4 #${i + 1}`, { query: "bot=1&dpr=2" });
  await fpsRun("governor (DSF 2, no dpr lock) x4", { query: "bot=1" });
  await fpsRun("reference dpr1.5 x1", { throttle: 1 });
  await fpsRun("misconception bot dpr1.5 x4", { query: "bot=mis&dpr=1.5&skill=s2&mis=count-marks&fade=2" });
  await fpsRun("phone 412x915 dpr1.5 x4", { w: 412, h: 915, query: "bot=1&dpr=1.5&theme=laal-grah" });
  await fpsRun("laptop 1366x768 dpr1 x4", { w: 1366, h: 768, scale: 1, query: "bot=1&dpr=1&theme=hara-toofan&lang=en" });
  writeFileSync(join(OUT, "replay-acts.json"), JSON.stringify({ levels: replay }, null, 0));
  const t = results.runs.filter((r) => r.label.startsWith("tierC")), p = results.runs.filter((r) => r.label.startsWith("pessimistic"));
  results.summary = { tierC_fps_median_of_3: median(t.map((r) => r.fpsMedian)), tierC_p95_ms_median: median(t.map((r) => r.frameP95)), dpr2_fps_median_of_3: median(p.map((r) => r.fpsMedian)), dpr2_p95_ms_median: median(p.map((r) => r.frameP95)) };
  writeFileSync(join(OUT, "fps.json"), JSON.stringify(results, null, 1));
}

if (MODE === "rerun") {
  // each contended configuration next to the baseline, back to back, so a comparison holds under the same contention
  const pairs = [["misconception bot", { query: "bot=mis&dpr=1.5&skill=s2&mis=count-marks&fade=2" }], ["phone 412x915", { w: 412, h: 915, query: "bot=1&dpr=1.5&theme=laal-grah" }], ["laptop 1366x768 dpr1", { w: 1366, h: 768, scale: 1, query: "bot=1&dpr=1&theme=hara-toofan&lang=en" }]];
  for (const [label, o] of pairs) { await fpsRun(`rerun baseline (before ${label}) dpr1.5 x4`, { ms: 8000 }); await fpsRun(`rerun ${label} x4`, { ...o, ms: 8000 }); }
  writeFileSync(join(OUT, "rerun.json"), JSON.stringify(results, null, 1));
}
if (MODE === "replay") {
  // act logs from the misconception bot on every skill x belief pair the law can show, for test-law.mjs's server-replay check
  const all = [];
  for (const q of ["skill=s1&mis=whole-number-bias&fade=1", "skill=s2&mis=count-marks&fade=2", "skill=s3&mis=all-less-than-one&fade=2", "skill=s1&mis=count-marks&fade=2", "skill=s3&mis=all-less-than-one&fade=3"]) {
    const { levels } = await fpsRun(`replay capture ${q}`, { query: `bot=mis&dpr=0.75&${q}`, throttle: 1, warm: 500, ms: 14000 });
    all.push(...levels.filter((l) => l.shown.every(Boolean)));
  }
  writeFileSync(join(OUT, "replay-acts-mis.json"), JSON.stringify({ levels: all }));
  console.log("replay levels", all.length, "graded with a misconception", all.filter((l) => l.shown.some((s) => s[1])).length);
}
if (MODE === "sweep") {
  // what bounds the proxy: if fps rises as DPR (fill) falls while JS work stays flat, the proxy is SwiftShader fill-bound
  for (const d of [0.5, 0.75, 1, 1.5, 2]) await fpsRun(`sweep dpr${d} x4`, { query: `bot=1&dpr=${d}`, ms: 8000 });
  for (const d of [0.5, 1.5]) await fpsRun(`sweep dpr${d} x1`, { query: `bot=1&dpr=${d}`, throttle: 1, ms: 8000 });
  await fpsRun("sweep dpr1.5 x6", { query: "bot=1&dpr=1.5", throttle: 6, ms: 8000 });
  writeFileSync(join(OUT, "sweep.json"), JSON.stringify(results, null, 1));
}
if (MODE === "load" || MODE === "all") {
  // cold loads, cache disabled, compressed like a CDN; network profiles are assumptions, labelled as such in FEASIBILITY.md
  const nets = [{ name: "4G typical (10 Mbps, 60 ms RTT)", down: 10, up: 3, rtt: 60 }, { name: "4G congested (3 Mbps, 150 ms RTT)", down: 3, up: 1, rtt: 150 }, { name: "3G-like (1.2 Mbps, 300 ms RTT)", down: 1.2, up: 0.5, rtt: 300 }];
  const load = [];
  for (const net of nets) for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    let bytes = 0; ctx.on("response", async (r) => { try { const h = await r.allHeaders(); bytes += Number(h["content-length"] ?? 0); } catch {} });
    const t0 = Date.now(); const { page } = await open(ctx, "dpr=1.5", { throttle: 4, net });
    const ff = await page.evaluate(() => window.__firstFrameMs); const tr = await page.evaluate(() => performance.getEntriesByType("resource").reduce((s, e) => s + (e.transferSize || 0), 0) + (performance.getEntriesByType("navigation")[0]?.transferSize || 0));
    await ctx.close(); load.push({ net: net.name, run: i + 1, firstFrameMs: ff, wallMs: Date.now() - t0, transferKB: +(tr / 1024).toFixed(1) });
    console.log("load", net.name, ff, "ms", (tr / 1024).toFixed(0), "KB");
  }
  writeFileSync(join(OUT, "load.json"), JSON.stringify({ when: new Date().toISOString(), proxy: true, cpuThrottle: 4, note: "first frame = performance.now() at the first rAF after the level is composed and shaders compiled; cache disabled; brotli from a local server; three.js 0.180.0 served from node_modules (byte-identical to the pinned CDN file)", load }, null, 1));
}

async function shot(name, query, { w = 360, h = 800, scale = 2, until = null, wait = 600, quality = 78 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, isMobile: w < 500, hasTouch: w < 500 });
  const { page, errors } = await open(ctx, query);
  if (until) await page.waitForFunction(until, null, { timeout: 60000 });
  await page.waitForTimeout(wait);
  const f = join(SHOTS, `${name}.jpg`); await page.screenshot({ path: f, type: "jpeg", quality });
  const audit = await textAudit(page); await ctx.close();
  console.log("shot", name, (statSync(f).size / 1024).toFixed(0), "KB", JSON.stringify(audit), errors.length ? errors : "");
  return { name, query, viewport: [w, h], audit, errors, kb: +(statSync(f).size / 1024).toFixed(0) };
}
if (MODE === "shots" || MODE === "all") {
  const s = [];
  s.push(await shot("01-aim-360", "skill=s2&mis=count-marks&fade=2&dpr=2", { wait: 1500 }));
  s.push(await shot("02-mistake-countmarks-360", "bot=mis&skill=s2&mis=count-marks&fade=2&dpr=2", { until: () => window.__perf().phase === "reveal", wait: 350 }));
  s.push(await shot("03-hit-360", "bot=1&skill=s1&mis=whole-number-bias&fade=1&dpr=2", { until: () => window.__perf().phase === "reveal", wait: 120 }));
  s.push(await shot("04-doors-360", "bot=1&skill=s3&mis=all-less-than-one&fade=1&dpr=2&theme=laal-grah", { until: () => window.__perf().phase === "doors", wait: 700 }));
  s.push(await shot("05-warp-360", "bot=1&skill=s1&fade=1&dpr=2&theme=hara-toofan", { until: () => window.__perf().phase === "warp", wait: 500 }));
  s.push(await shot("06-hindi-mistake-360", "bot=mis&skill=s3&mis=all-less-than-one&fade=2&lang=hi&dpr=2", { until: () => window.__perf().phase === "reveal", wait: 350 }));
  s.push(await shot("07-phone-412", "skill=s3&fade=2&dpr=2&theme=laal-grah&lang=en", { w: 412, h: 915, wait: 1500 }));
  s.push(await shot("08-laptop-1366", "bot=mis&skill=s2&mis=count-marks&fade=2&dpr=1&theme=hara-toofan&lang=en", { w: 1366, h: 768, scale: 1, until: () => window.__perf().phase === "reveal", wait: 350 }));
  writeFileSync(join(OUT, "shots.json"), JSON.stringify({ when: new Date().toISOString(), shots: s }, null, 1));
}
if (MODE === "video" || MODE === "all") {
  const dir = join(OUT, "_vid"); rmSync(dir, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, recordVideo: { dir, size: { width: 360, height: 800 } } });
  const { page } = await open(ctx, "bot=mis&skill=s2&mis=count-marks&fade=2&dpr=1.5&music=drive");
  await page.waitForTimeout(13000); await ctx.close();
  const f = readdirSync(dir).find((x) => x.endsWith(".webm")); renameSync(join(dir, f), join(SHOTS, "play-360.webm")); rmSync(dir, { recursive: true, force: true });
  console.log("video", (statSync(join(SHOTS, "play-360.webm")).size / 1024).toFixed(0), "KB (unthrottled CPU; recording itself costs frames)");
}
if (MODE === "voxel" || MODE === "all") {
  const vrows = [];
  for (const [label, query, throttle] of [["voxel 6x6 chunks dpr1.5 x4", "view=6&dpr=1.5", 4], ["voxel 6x6 + edits every 250 ms x4", "view=6&dpr=1.5&edits", 4], ["voxel 4x4 chunks dpr1.5 x4", "view=4&dpr=1.5", 4], ["voxel 6x6 dpr1.5 x1", "view=6&dpr=1.5", 1]]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.route(/voxel\/index\.html/, async (route) => { const r = await route.fetch(); const html = (await r.text()).replace("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js", `${BASE}/cdn/three/three.module.min.js`); await route.fulfill({ response: r, body: html, headers: { ...r.headers(), "content-encoding": "identity", "content-length": String(Buffer.byteLength(html)) } }); });
    const cdp = await ctx.newCDPSession(page); if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
    await page.goto(`${BASE}/docs/research/round4/games/proto/voxel/index.html?${query}`); await page.waitForFunction(() => window.__vox, null, { timeout: 120000 });
    await page.waitForTimeout(3000); await page.evaluate(() => window.__vox(true)); await page.waitForTimeout(10000);
    const r = await page.evaluate(() => window.__vox()); if (label.includes("edits")) await page.screenshot({ path: join(SHOTS, "09-voxel-360.jpg"), type: "jpeg", quality: 70 });
    await ctx.close(); vrows.push({ label, throttle, ...r }); console.log(label, JSON.stringify(r));
  }
  writeFileSync(join(OUT, "voxel.json"), JSON.stringify({ when: new Date().toISOString(), proxy: true, method: "naive face-culled meshing per 16 x H x 16 chunk, one draw per chunk, Lambert vertex colours, orbiting camera, 360x800, SwiftShader", rows: vrows }, null, 1));
}
await browser.close(); server.close();
