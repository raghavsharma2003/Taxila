#!/usr/bin/env node
// r4-khand · the Khand certificate harness (C4 fit, C10 frame rate, cold load, shots and video). Playwright with the
// preinstalled Chromium, headless, SwiftShader (software GL). EVERY number it prints is a local headless PROXY, never a
// phone: the GPU work is done by the CPU here, so frame rates measure SwiftShader as much as the game.
//
//   PLAY_PUBLIC=public PLAY_OUT=<dir> npx vite build --config src/play/dev/vite.play.config.mjs   (the play dev harness)
//   node tests/prod/r4-khand-shots.mjs --dir <dir> [--shots] [--fps] [--load] [--video] [--out docs/design/round4/build/khand]
//
// --shots  every mode × 360×800 / 412×915 / 1366×768: a mid-build state (and at 360 a mistake and a solved state); the DOM
//          floor audit on each (0 horizontal overflow, text ≥ 14 px / 16 px for classes 4-5, numerals ≥ 18 px, targets
//          ≥ 44 px, 0 clipped goal lines or button labels, 0 page errors)
// --fps    4x CPU throttle, the camera orbiting (every frame renders), 10 s per viewport; then 10 s of an edit every 250 ms
//          (the re-mesh path): frame p50 / p95 on the main thread, mesh ms in the worker
// --load   cold load to the first rendered world frame, cache off, 4x CPU, three network profiles, brotli
// --video  a short webm of a scripted build at each viewport
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, statSync, readdirSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { brotliCompressSync, constants as Z } from "node:zlib";

const arg = (k, d = null) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);
const DIR = resolve(arg("dir", "/tmp/khand-devbuild")), OUT = resolve(arg("out", "docs/design/round4/build/khand"));
const EXE = process.env.KHAND_CHROME ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const ONLY = arg("only");
mkdirSync(join(OUT, "shots"), { recursive: true }); mkdirSync(join(OUT, "video"), { recursive: true }); mkdirSync(join(OUT, "results"), { recursive: true });

// ── a static server with brotli (what a CDN serves), so the cold load moves real compressed bytes
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".json": "application/json", ".webp": "image/webp", ".png": "image/png" };
const cache = new Map();
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname), f = join(DIR, path);
  if (!f.startsWith(DIR) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const type = TYPES[extname(f)] ?? "application/octet-stream", raw = readFileSync(f);
  const br = /text|javascript|json|svg/.test(type) && /\bbr\b/.test(req.headers["accept-encoding"] ?? "");
  let body = raw;
  if (br) { body = cache.get(f) ?? brotliCompressSync(raw, { params: { [Z.BROTLI_PARAM_QUALITY]: 11 } }); cache.set(f, body); }
  res.writeHead(200, { "content-type": type, ...(br ? { "content-encoding": "br" } : {}), "cache-control": "no-store" });
  res.end(body);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}/src/play/dev/index.html`;

const VIEWPORTS = [{ id: "p360", w: 360, h: 800 }, { id: "p412", w: 412, h: 915 }, { id: "l1366", w: 1366, h: 768 }];
const MODES = [
  { id: "views-build3", q: "mode=views&goal=build3&class=4&fade=1&seed=3" },
  { id: "views-same", q: "mode=views&goal=same&class=4&fade=1&seed=5&grammar=%7B%22views%22%3A%5B%22front%22%5D%7D" },
  { id: "array-fill", q: "mode=array&goal=fill&class=4&fade=1&seed=3" },
  { id: "array-fill-f3", q: "mode=array&goal=fill&class=4&fade=3&seed=4" },
  { id: "array-turn", q: "mode=array&goal=turn&class=4&fade=2&seed=3" },
  { id: "floor-area", q: "mode=floor&goal=area&class=5&fade=1&seed=3" },
  { id: "floor-perimeter", q: "mode=floor&goal=perimeter&class=5&fade=2&seed=3" },
  { id: "floor-max", q: "mode=floor&goal=max&class=6&fade=2&seed=4" },
  { id: "floor-min", q: "mode=floor&goal=min&class=5&fade=1&seed=4" },
  { id: "powers-square", q: "mode=powers&goal=square&class=6&fade=2&seed=3" },
  { id: "powers-cube", q: "mode=powers&goal=cube&class=6&fade=1&seed=3" },
  { id: "mirror-x", q: "mode=mirror&goal=complete&class=4&fade=1&seed=3&grammar=%7B%22axes%22%3A%5B%22x%22%5D%7D" },
  { id: "mirror-z", q: "mode=mirror&goal=complete&class=6&fade=2&seed=4&grammar=%7B%22axes%22%3A%5B%22z%22%5D%7D" },
].filter((m) => !ONLY || m.id.startsWith(ONLY));
const ARTS = ["kagaz", "blueprint", "chalk", "raat"];

const AUDIT = `(() => {
  const root = document.querySelector('[data-testid=play-stage]'); if (!root) return { error: 'no stage' };
  const young = root.dataset.young === '1', out = { overflowX: document.documentElement.scrollWidth > innerWidth + 1, texts: [], small: [], smallNum: [], targets: [], tinyTargets: [], clipped: [] };
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  for (const el of root.querySelectorAll('*')) {
    if (!vis(el)) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
    if (own) {
      const px = parseFloat(getComputedStyle(el).fontSize); out.texts.push(px);
      if (px < (young ? 16 : 14)) out.small.push(own.slice(0, 30) + ' ' + px);
      if (/^\\d+$/.test(own) && px < 18 && !el.closest('button')) out.smallNum.push(own + ' ' + px);
    }
  }
  for (const b of root.querySelectorAll('button, .kh-stick')) {
    if (!vis(b)) continue;
    const r = b.getBoundingClientRect(); out.targets.push([Math.round(r.width), Math.round(r.height)]);
    if (r.width < 44 || r.height < 44) out.tinyTargets.push((b.textContent || b.getAttribute('aria-label') || '').trim() + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    if (b.scrollWidth > b.clientWidth + 1) out.clipped.push('button:' + b.textContent.trim());
  }
  const g = root.querySelector('[data-testid=play-goal]'); if (g && g.scrollHeight > g.clientHeight + 1) out.clipped.push('goal:' + g.textContent.slice(0, 40));
  const w = root.querySelector('[data-testid=play-world]').getBoundingClientRect();
  for (const l of root.querySelectorAll('.kh-label')) { if (!vis(l)) continue; const r = l.getBoundingClientRect(); if (r.left < w.left - 1 || r.right > w.right + 1 || r.top < w.top - 1 || r.bottom > w.bottom + 1) out.clipped.push('label:' + l.textContent); }
  out.world = [Math.round(w.width), Math.round(w.height)];
  out.minText = Math.min(...out.texts); delete out.texts; out.nTargets = out.targets.length; delete out.targets;
  return out;
})()`;

async function open(browser, vp, q, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message ?? e).slice(0, 160)));
  page.on("console", (m) => { if (m.type() === "error" && !/GL Driver|favicon|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 160)); });
  const twin = /[?&]tier=2d\b/.test(`&${q}`);
  await page.goto(`${BASE}?family=nazariya&lang=${extra.lang ?? "hinglish"}&${twin ? "" : "tier=3d&"}${q}`);
  if (twin) await page.waitForSelector("[data-testid=play-controls] button", { timeout: 60000 });
  else await page.waitForFunction(() => window.__khand && window.__khand.info().draws > 0, null, { timeout: 60000 });
  await page.waitForTimeout(600);
  return { ctx, page, errors };
}
const solveSteps = (page, frac) => page.evaluate((frac) => { const s = window.__play.solve(); const n = frac >= 1 ? s.length : Math.max(1, Math.floor(s.length * frac)); for (const a of s.slice(0, n)) window.__play.dispatch(a); return n; }, frac);
const mistake = (page) => page.evaluate(() => { for (const id of Object.keys(window.__playLevel.mal)) { const a = window.__play.malActs(id); if (a) { for (const x of a) window.__play.dispatch(x); return id; } } return null; });

const results = { at: new Date().toISOString(), method: "Playwright headless Chromium (SwiftShader software GL), local brotli static server; PROXY numbers, not a phone", shots: [], fps: [], edits: [], load: [] };
const browser = await chromium.launch({ executablePath: EXE, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

if (flag("shots")) {
  let k = 0;
  for (const m of MODES) for (const vp of VIEWPORTS) {
    const art = ARTS[k++ % ARTS.length];
    const states = vp.id === "p360" ? ["mid", "mistake", "solved", "twin"] : ["mid", "twin"];
    for (const st of states) {
      // "twin": the 2D board twin the host mounts when the 3D engine cannot run (tier 2d: SwiftShader without the override)
      const { ctx, page, errors } = await open(browser, vp, `${m.q}&art=${art}${st === "twin" ? "&tier=2d" : ""}`);
      let note = "";
      if (st === "mid" || st === "twin") await solveSteps(page, 0.6);
      if (st === "mistake") note = (await mistake(page)) ?? "none";
      if (st === "solved") await solveSteps(page, 1);
      await page.evaluate(() => window.__khand?.setTool && null);
      await page.waitForTimeout(900);
      const audit = await page.evaluate(AUDIT);
      const file = `shots/${m.id}-${vp.id}-${st}.jpg`;
      await page.screenshot({ path: join(OUT, file), type: "jpeg", quality: 72 });
      const row = { mode: m.id, vp: vp.id, state: st, art, mal: note || undefined, file, errors, ...audit };
      results.shots.push(row);
      const bad = audit.overflowX || audit.small.length || audit.tinyTargets.length || audit.clipped.length || audit.smallNum.length || errors.length;
      console.log(`${bad ? "FAIL" : "ok  "} ${m.id} ${vp.id} ${st} ${art} world=${audit.world} minText=${audit.minText}${bad ? " " + JSON.stringify({ o: audit.overflowX, s: audit.small, n: audit.smallNum, t: audit.tinyTargets, c: audit.clipped, e: errors }) : ""}`);
      await ctx.close();
    }
  }
}

async function throttled(page, rate = 4) { const cdp = await page.context().newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate }); return cdp; }
if (flag("fps")) {
  for (const vp of VIEWPORTS) for (const m of MODES.filter((x) => ["views-build3", "powers-cube", "floor-area"].includes(x.id))) {
    const { ctx, page } = await open(browser, vp, m.q);
    await solveSteps(page, 0.7);
    await throttled(page, 4);
    await page.evaluate(() => window.__khand.continuous(true));
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.__khand.perf(true));
    await page.waitForTimeout(10000);
    const perf = await page.evaluate(() => ({ ...window.__khand.perf(), info: window.__khand.info() }));
    results.fps.push({ vp: vp.id, mode: m.id, throttle: 4, fps: perf.fps, p50: perf.p50, p95: perf.p95, drawP50: perf.drawP50, drawP95: perf.drawP95, dpr: perf.dpr, dprSteps: perf.dprSteps, draws: perf.info.draws, tris: perf.info.tris });
    console.log(`fps ${vp.id} ${m.id}: ${perf.fps} (p50 ${perf.p50} / p95 ${perf.p95} ms; render ${perf.drawP50}/${perf.drawP95} ms) dpr ${perf.dpr} ${JSON.stringify(perf.dprSteps)} draws ${perf.info.draws} tris ${perf.info.tris}`);
    // the edit path: a block on, a block off, every 250 ms, camera still; mesh in the worker
    await page.evaluate(() => { window.__khand.continuous(false); window.__khand.perf(true); window.__khand.mesher.timings.mesh.length = 0; window.__khand.mesher.timings.trip.length = 0; window.__khand.mesher.timings.where.length = 0; });
    await page.evaluate(async () => {
      const L = window.__playLevel, p = L.params, open = []; for (let i = 0; i < p.w * p.d; i++) if (!p.lock[i]) open.push(i);
      for (let k = 0; k < 40; k++) { const i = open[(k * 7) % open.length], x = i % p.w, z = Math.floor(i / p.w); window.__play.dispatch(k % 2 ? { kind: "remove", x, z } : { kind: "place", x, z }); await new Promise((r) => setTimeout(r, 250)); }
    });
    await page.waitForTimeout(500);
    const ed = await page.evaluate(() => { const t = window.__khand.mesher.timings, q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(f * s.length))].toFixed(2) : null; }; const pf = window.__khand.perf(); return { n: t.mesh.length, where: [...new Set(t.where)], meshP50: q(t.mesh, 0.5), meshP95: q(t.mesh, 0.95), tripP50: q(t.trip, 0.5), tripP95: q(t.trip, 0.95), frameP50: pf.p50, frameP95: pf.p95, renderP95: pf.drawP95 }; });
    results.edits.push({ vp: vp.id, mode: m.id, throttle: 4, ...ed });
    console.log(`edits ${vp.id} ${m.id}: n=${ed.n} where=${ed.where} mesh ${ed.meshP50}/${ed.meshP95} ms (worker), round trip ${ed.tripP50}/${ed.tripP95} ms, main frame ${ed.frameP50}/${ed.frameP95} ms`);
    await ctx.close();
  }
}

if (flag("load")) {
  const PROFILES = [{ id: "10mbps-60ms", down: 10e6 / 8, lat: 60 }, { id: "3mbps-150ms", down: 3e6 / 8, lat: 150 }, { id: "1.2mbps-300ms", down: 1.2e6 / 8, lat: 300 }];
  for (const pr of PROFILES) for (let run = 0; run < 3; run++) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } }), page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable"); await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: pr.lat, downloadThroughput: pr.down, uploadThroughput: pr.down / 2 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    let bytes = 0; cdp.on("Network.loadingFinished", (e) => { bytes += e.encodedDataLength; });
    const t0 = Date.now();
    await page.goto(`${BASE}?family=nazariya&tier=3d&mode=views&goal=build3&class=4&fade=1&seed=3`);
    await page.waitForFunction(() => performance.getEntriesByName("khand-first-frame").length > 0, null, { timeout: 120000 });
    const ff = await page.evaluate(() => performance.getEntriesByName("khand-first-frame")[0].startTime);
    results.load.push({ profile: pr.id, run, firstFrameMs: Math.round(ff), wallMs: Date.now() - t0, kb: Math.round(bytes / 1024) });
    console.log(`load ${pr.id} #${run}: first world frame ${Math.round(ff)} ms, ${Math.round(bytes / 1024)} KB`);
    await ctx.close();
  }
}

if (flag("video")) {
  for (const vp of VIEWPORTS) {
    const dir = join(OUT, "video", `tmp-${vp.id}`); mkdirSync(dir, { recursive: true });
    const { ctx, page } = await open(browser, vp, "mode=views&goal=build3&class=4&fade=1&seed=3&art=kagaz", { recordVideo: { dir, size: { width: vp.w, height: vp.h } } });
    await page.evaluate(() => window.__khand.continuous(true));
    await page.waitForTimeout(1500);
    const sol = await page.evaluate(() => window.__play.solve());
    // a mistake first (the footprint flat), its check, then undo and the real build, block by block, then the views
    await page.evaluate(() => { const a = window.__play.malActs("top-flat"); if (a) for (const x of a) window.__play.dispatch(x); });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { for (let i = 0; i < 12; i++) window.__play.dispatch({ kind: "undo" }); });
    await page.evaluate(() => window.__khand.continuous(false));
    for (const a of sol) { await page.evaluate((a) => window.__play.dispatch(a), a); await page.waitForTimeout(a.kind === "check" ? 1400 : 220); }
    await page.evaluate(() => window.__khand.setSnap("front")); await page.waitForTimeout(1100);
    await page.evaluate(() => window.__khand.setSnap("side")); await page.waitForTimeout(1100);
    await page.evaluate(() => window.__khand.setSnap(null)); await page.waitForTimeout(900);
    const v = page.video(); await ctx.close();
    const src = await v.path(), dst = join(OUT, "video", `khand-views-${vp.id}.webm`);
    renameSync(src, dst);
    console.log(`video ${dst} ${Math.round(statSync(dst).size / 1024)} KB`);
  }
}

await browser.close(); server.close();
const name = `results/run-${[flag("shots") && "shots", flag("fps") && "fps", flag("load") && "load", flag("video") && "video"].filter(Boolean).join("-")}.json`;
writeFileSync(join(OUT, name), JSON.stringify(results, null, 1));
const fails = results.shots.filter((r) => r.overflowX || r.small.length || r.tinyTargets.length || r.clipped.length || r.smallNum.length || r.errors.length);
console.log(`\nshots ${results.shots.length}, failing the floor audit ${fails.length}; wrote ${name}`);
process.exit(fails.length ? 1 : 0);
