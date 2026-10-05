// Records every Studio v2 engine being played by its bot (real pointer events through the test seam), saves a poster,
// and measures frame times on the mid-phone profile (915×412 @ 2.625, CDP CPU throttle 4×; STUDIO-V2 §14 M3 method).
//   node src/studio-v2/tools/record.mjs [--only <archetype>] [--no-video] [--no-perf] [--video-s 45]
// Writes docs/design/reset/prework/rs4/{recordings/<id>.webm, posters/<id>.jpg, measured.json (merged)}.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { docs, launch, runBot, serve, sleep, stagePainted, waitReady } from "./pw.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const only = opt("--only", null), videoS = +opt("--video-s", 48), perfS = +opt("--perf-s", 12);
const recDir = path.join(docs, "recordings"), posterDir = path.join(docs, "posters");
fs.mkdirSync(recDir, { recursive: true }); fs.mkdirSync(posterDir, { recursive: true });
const measuredFile = path.join(docs, "measured.json");
const measured = fs.existsSync(measuredFile) ? JSON.parse(fs.readFileSync(measuredFile, "utf8")) : { engines: {} };
measured.engines ??= {};

const { server, base } = await serve();
const browser = await launch();
const list = await (async () => { const p = await browser.newPage(); await p.goto(base); const ids = await p.evaluate(() => [...document.querySelectorAll(".card")].map((c) => c.dataset.archetype)); await p.close(); return ids; })();
const ids = only ? list.filter((x) => x === only) : list;
console.log("engines:", ids.join(", "));
const load = () => os.loadavg().map((x) => +x.toFixed(1));

for (const id of ids) {
  const rec = measured.engines[id] ?? {};
  const fileId = id.replace(/[^a-z0-9-]/gi, "_");
  if (!args.includes("--no-video")) {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 640 }, recordVideo: { dir: recDir, size: { width: 1024, height: 640 } } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
    const tNav = Date.now();
    await page.goto(`${base}?engine=${encodeURIComponent(id)}&seed=7`);
    await waitReady(page, 15000);
    const bootMs = await page.evaluate(() => window.__sv2.log.find((m) => m.k === "ready")?.data?.bootMs ?? null);
    const navToReady = Date.now() - tNav;
    let posterTaken = false;
    const t0 = Date.now();
    const res = await runBot(page, {
      maxMs: videoS * 1000,
      until: async () => {
        if (!posterTaken && Date.now() - t0 > videoS * 1000 * 0.42) { posterTaken = true; await page.screenshot({ path: path.join(posterDir, encodeURIComponent(id) + ".jpg"), type: "jpeg", quality: 72, clip: { x: 0, y: 0, width: 1024, height: 640 } }); }
        return page.evaluate(() => window.__sv2.log.some((m) => m.k === "done"));
      },
    });
    await sleep(1500);
    if (!posterTaken) await page.screenshot({ path: path.join(posterDir, encodeURIComponent(id) + ".jpg"), type: "jpeg", quality: 72 });
    const summary = await page.evaluate(() => {
      const h = window.__sv2, log = h.log;
      return { answers: log.filter((m) => m.k === "answer").length, right: log.filter((m) => m.k === "answer" && m.grade?.verdict === "right").length,
        done: log.some((m) => m.k === "done"), rung: h.rung(), tooSmall: h.tooSmall.length, safeHits: h.safeHits.length, safeSample: h.safeHits.slice(0, 3), agreement: h.agreement(), answerBytes: h.maxAnswerBytes(), repairs: h.repairs.length,
        events: [...new Set(log.filter((m) => m.k === "event").map((m) => m.name))] };
    });
    const painted = await stagePainted(page);
    const video = page.video();
    await ctx.close();
    const vpath = await video.path();
    const dest = path.join(recDir, fileId + ".webm");
    fs.renameSync(vpath, dest);
    Object.assign(rec, { bootMs, navToReadyMs: navToReady, run: { ...summary, botActions: res.actions, ms: res.ms, painted: painted.painted, errors }, video: path.relative(docs, dest), videoBytes: fs.statSync(dest).size });
    console.log(id, "video", (fs.statSync(dest).size / 1e6).toFixed(1) + "MB", JSON.stringify(rec.run));
  }
  if (!args.includes("--no-perf")) {
    const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: false });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
    await page.goto(`${base}?engine=${encodeURIComponent(id)}&seed=7&sound=off`);
    await waitReady(page, 20000);
    await runBot(page, { maxMs: 3000 });
    const from = await page.evaluate(() => window.__sv2.perf(0)?.n ?? 0);
    const l0 = load();
    await runBot(page, { maxMs: perfS * 1000 });
    const perf = await page.evaluate((f) => window.__sv2.perf(f), from);
    await ctx.close();
    rec.perf = { ...perf, profile: "915x412@2.625, CPU 4x, headless Chromium software raster", hostLoad: [l0, load()], errors };
    console.log(id, "perf", JSON.stringify({ fps: perf?.fps, p50: perf?.p50, p95: perf?.p95, dpr: perf?.dpr, load: rec.perf.hostLoad }));
  }
  measured.engines[id] = rec;
  measured.date = new Date().toISOString(); measured.host = { cpus: os.cpus().length, chromium: browser.version() };
  fs.writeFileSync(measuredFile, JSON.stringify(measured, null, 1));
}
await browser.close();
server.close();
