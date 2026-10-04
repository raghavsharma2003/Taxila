// Records the three Studio exemplars (Playwright video) and measures frame times on a mid-phone profile.
//
//   node prototypes/reset/studio/tools/record.mjs                 # record all three + perf
//   node prototypes/reset/studio/tools/record.mjs --only landfall # one exemplar
//   node prototypes/reset/studio/tools/record.mjs --perf-only
//
// Every interaction is a REAL pointer event at the stage (page.mouse), driven by a bot that reads the artifact's
// test seam (window.__studio.seam), the same pattern as the LIVE-STUDIO G5 play-truth gate. Local files only: no
// network (the sandbox proxy breaks Chromium, docs/ops/W1-PROD-RESULTS-2026-10-04.md; nothing here needs it).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { chromium } from "../../../../node_modules/playwright/index.mjs";
import { serve } from "./serve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../recordings");
fs.mkdirSync(outDir, { recursive: true });
const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const perfOnly = args.includes("--perf-only");
const noPerf = args.includes("--no-perf");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

async function stageMapper(page) {
  const box = await page.locator("#stage").boundingBox();
  return { box, px: (x, y) => [box.x + (x / 1000) * box.width, box.y + (y / 625) * box.height] };
}
async function glide(page, from, to, ms) {            // human-ish pointer path with easing
  const n = Math.max(4, Math.round(ms / 16));
  for (let i = 1; i <= n; i++) {
    const t = i / n, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.mouse.move(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e);
    await sleep(ms / n);
  }
  return to;
}

/* ---------------------------------------------------------------- scenario: Landfall (maths action game) */
export async function playLandfall(page, { maxMs = 120000 } = {}) {
  const { px } = await stageMapper(page);
  const r = rng(11);
  // scripted human errors (the rest is a skilled player with ~9 world-unit noise): two misreads in a row in wave 2
  // trigger the adaptive scaffold; 5/4 read as "just past 1" shows the past-one misconception feedback.
  const misread = { "2:5/8": -88, "2:1/8": 70, "4:5/4": -92 };
  let cur = px(230, 560);
  await page.mouse.move(...cur);
  await page.mouse.down();
  const plan = new Map();
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await page.evaluate(() => window.__studio.seam && window.__studio.seam());
    if (!s) { await sleep(100); continue; }
    if (s.state === "final") { await sleep(4500); break; }
    const diving = s.pods.some((p) => p.phase === "dive");      // hold still while a pod is landing
    const pods = s.pods.filter((p) => p.phase === "fall").sort((a, b) => a.eta - b.eta);
    if (pods.length && !diving) {
      const p = pods[0];
      if (!plan.has(p.id)) {
        const key = `${s.wave}:${p.label}`;
        const err = misread[key] != null ? misread[key] : gauss(r) * 8;
        plan.set(p.id, { x: p.trueX + err, at: Date.now() + 240 + r() * 160 });
      }
      const pl = plan.get(p.id);
      if (Date.now() >= pl.at) {
        const to = px(pl.x, 560);
        if (Math.abs(to[0] - cur[0]) > 2) cur = await glide(page, cur, to, 120 + Math.min(200, Math.abs(to[0] - cur[0]) * 0.4));
      }
    }
    await sleep(25);
  }
  await page.mouse.up();
}

/* ---------------------------------------------------------------- scenario: Circuit Lab (science simulation) */
export async function playCircuit(page, { maxMs = 100000 } = {}) {
  const { px } = await stageMapper(page);
  const seam = () => page.evaluate(() => window.__studio.seam && window.__studio.seam());
  const waitFor = async (pred, ms = 15000) => { const t = Date.now(); while (Date.now() - t < ms) { const s = await seam(); if (s && pred(s)) return s; await sleep(120); } return seam(); };
  let cur = px(500, 600);
  await page.mouse.move(...cur);
  const drag = async (from, to, ms = 650) => {
    cur = await glide(page, cur, from, 380);
    await page.mouse.down(); await sleep(90);
    cur = await glide(page, cur, to, ms);
    await sleep(80); await page.mouse.up(); await sleep(250);
  };
  const tap = async (pt) => { cur = await glide(page, cur, pt, 380); await page.mouse.down(); await sleep(90); await page.mouse.up(); await sleep(250); };
  let s = await waitFor((x) => x.ready, 8000);
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    s = await seam();
    if (!s) { await sleep(150); continue; }
    if (s.state === "final") { await sleep(5000); break; }
    const act = s.next;            // the seam names the next scripted action the lesson expects (test builds only)
    if (!act) { await sleep(200); continue; }
    if (act.type === "drag") await drag(px(...act.from), px(...act.to), act.ms || 700);
    else if (act.type === "tap") await tap(px(...act.at));
    else if (act.type === "wait") await sleep(act.ms || 600);
    await sleep(act.after || 700);
  }
}

/* ---------------------------------------------------------------- scenario: Moon phases (cinematic animation) */
export async function playMoon(page, { maxMs = 120000 } = {}) {
  const { px } = await stageMapper(page);
  const seam = () => page.evaluate(() => window.__studio.seam && window.__studio.seam());
  let cur = px(960, 600);
  await page.mouse.move(...cur);
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await seam();
    if (s && s.state === "interactive" && s.moon) {
      // the child drags the Moon round its orbit: from where it is to the first-quarter position, then on to full
      for (const target of s.dragTargets || []) {
        const from = px(s.moon.x, s.moon.y);
        cur = await glide(page, cur, from, 500);
        await page.mouse.down();
        const pts = target.path;
        for (const p of pts) cur = await glide(page, cur, px(p[0], p[1]), 90);
        await sleep(120);
        await page.mouse.up();
        await sleep(target.hold || 2200);
        const s2 = await seam();
        Object.assign(s, s2);
      }
      await sleep(3500);
      break;
    }
    if (s && s.state === "final") { await sleep(3000); break; }
    await sleep(250);
  }
}

const SCENES = [
  { key: "landfall", rel: "01-landfall/", q: "", play: playLandfall, recMs: 120000 },
  { key: "circuit", rel: "02-circuit-lab/", q: "", play: playCircuit, recMs: 110000 },
  { key: "moon", rel: "03-moon-phases/", q: "&autoplay=1", perfQ: "&autoplay=1&t=40", play: playMoon, recMs: 150000 },
];

async function record(browser, base, sc) {
  const tmp = path.join(outDir, ".tmp-" + sc.key);
  fs.rmSync(tmp, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: 1280, height: 800 } } });
  const page = await ctx.newPage();
  const videoT0 = Date.now();                       // Playwright starts the screencast when the page is created
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const t0 = Date.now();
  await page.goto(`${base}/studio/${sc.rel}?seed=7${sc.q || ""}`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === "1", null, { timeout: 15000 });
  const readyAt = Date.now() - t0;
  await sc.play(page, { maxMs: sc.recMs });
  const log = await page.evaluate(() => window.__studioLog);
  const perf = await page.evaluate(() => window.__studioPerf.summary());
  const small = await page.evaluate(() => window.TaxStudio.tooSmall.length);
  const video = page.video();
  await ctx.close();
  const src = await video.path();
  const dst = path.join(outDir, `${sc.key}.webm`);
  fs.renameSync(src, dst);
  fs.rmSync(tmp, { recursive: true, force: true });
  let narrated = null;
  const says = log.filter((m) => m.k === "event" && m.name === "say");
  if (says.length) narrated = muxNarration(dst, says.map((m) => ({ id: m.data.id, offMs: m.data.epochMs - videoT0 })));
  return { key: sc.key, narrated, video: path.relative(path.resolve(here, ".."), dst), readyAtMs: readyAt, errors, undersizedLabels: small, perfDesktopUnthrottled: perf,
    events: summarize(log) };
}

// Playwright video has no audio track: lay the narration clips at the exact moments the page started them.
function muxNarration(webm, says) {
  const dir = path.resolve(here, "../03-moon-phases");
  const out = webm.replace(/\.webm$/, "-narrated.mp4");
  const inputs = ["-i", webm];
  const filters = [];
  says.forEach((s, i) => { inputs.push("-i", path.join(dir, "audio", `${s.id}.mp3`)); filters.push(`[${i + 1}:a]adelay=${Math.max(0, Math.round(s.offMs))}|${Math.max(0, Math.round(s.offMs))}[a${i}]`); });
  const mix = `${filters.join(";")};${says.map((_, i) => `[a${i}]`).join("")}amix=inputs=${says.length}:normalize=0[aout]`;
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", mix, "-map", "0:v", "-map", "[aout]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-shortest", out], { encoding: "utf8" });
  return r.status === 0 ? { file: path.relative(path.resolve(here, ".."), out), clips: says.length, offsetsMs: says.map((s) => [s.id, Math.round(s.offMs)]) } : { error: (r.stderr || "").slice(0, 400) };
}

function summarize(log) {
  const c = {};
  for (const m of log) { const k = m.k === "event" ? "event:" + m.name : m.k; c[k] = (c[k] || 0) + 1; }
  const done = log.find((m) => m.k === "done");
  return { counts: c, done: done ? done.summary : null };
}

async function perfRun(browser, base, sc, rate) {
  // Mid-phone proxy: 915 x 412 landscape CSS px at DPR 2.625 (Pixel-7-class screen), CPU throttled via CDP.
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  await page.goto(`${base}/studio/${sc.rel}?seed=7&sound=off${sc.perfQ || sc.q || ""}`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === "1", null, { timeout: 30000 });
  const playP = sc.play(page, { maxMs: 26000 }).catch(() => {});
  await sleep(4000);
  const startIdx = await page.evaluate(() => window.__studioPerf.frames.length);
  await sleep(20000);
  const summary = await page.evaluate((i) => window.__studioPerf.summary(i), startIdx);
  const errors = [];
  await Promise.race([playP, sleep(500)]);
  await ctx.close();
  return { key: sc.key, rate, viewport: "915x412@2.625", ...summary, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { server, port } = await serve(0);
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const results = { date: new Date().toISOString(), host: { cpus: (await import("node:os")).cpus().length, chromium: browser.version() }, recordings: [], perf: [] };
  for (const sc of SCENES) {
    if (only && sc.key !== only) continue;
    if (!perfOnly) { console.log("recording", sc.key); results.recordings.push(await record(browser, base, sc)); console.log(JSON.stringify(results.recordings.at(-1).events)); }
    if (!noPerf) for (const rate of [4, 6]) { console.log("perf", sc.key, rate + "x"); results.perf.push(await perfRun(browser, base, sc, rate)); console.log(JSON.stringify(results.perf.at(-1))); }
  }
  await browser.close();
  server.close();
  const outFile = path.join(outDir, `run-${only || "all"}${perfOnly ? "-perf" : ""}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log("wrote", outFile);
}
