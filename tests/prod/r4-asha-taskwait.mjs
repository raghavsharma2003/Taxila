// Round 4 stream 5 (open-r4lat-puppet-delays-turn-post): how long the PAGE'S TASK QUEUE waits behind the puppet face.
// The turn POST (src/lesson/runtime.ts runTurn) runs after a chain of macrotasks (the outbox's IndexedDB reserve + write,
// then fetch): each one waits for whatever task holds the main thread, and a puppet frame is one such task. This probe
// measures that wait directly on the lesson Desk, puppet on vs off, without models, Azure or a database:
//   task     setTimeout(0) → callback (ms), 40 samples spaced 37 ms (unsynchronised with the frame clock)
//   idb      the outbox's shape: open → 2 sequential readwrite transactions (reserve, write) → done (ms), 12 samples
//   turn     the runtime's own sequence: the child_final page event (`taxila:play-heard`, dispatched by
//            src/lesson/runtime.ts just before it queues the turn) → the outbox's IndexedDB reserve + write → fetch()
//            called (ms, final → POST), 12 samples ~0.9 s apart
//   longtask PerformanceObserver long tasks over the run (count, total, max), and the page's rAF rate
// Production build WITH dev routes (the /dev/desk fixtures), every /api/* mocked in the page, Playwright Chromium headless
// (software GL, no GPU: not a phone). Optional --cpu N applies a CDP CPU throttle (a low-end phone proxy).
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r4-asha-taskwait.mjs [--dist <dir>] [--cpu 4] [--look r8|lamp2]
//     [--fixtures your_turn,speaking] [--out <file.json>]
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn, execFileSync } from "child_process";
import { chromium } from "playwright";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const CPU = Number(arg("--cpu", "1"));
const LOOK = arg("--look", "r8");
const FIXTURES = arg("--fixtures", "your_turn,speaking").split(",");
const OUT = arg("--out", null);

let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-r4-asha-taskwait-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_DEV_ROUTES: "1" } });
}
const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 150));
}

const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1); };
const sum = (a) => ({ n: a.length, p50: q(a, 0.5), p90: q(a, 0.9), max: a.length ? +Math.max(...a).toFixed(1) : null });

async function measure(browser, { fixture, puppet }) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.route("**/api/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    const body = p === "/api/face/config" ? { puppet2d: true, visemes: true, rev: "r8", look: LOOK, ...(LOOK === "lamp2" ? { cohort: "owner" } : {}) } : { error: "unmocked" };
    return route.fulfill({ status: p === "/api/face/config" ? 200 : 404, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.addInitScript(() => {
    window.__long = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: "longtask", buffered: true }); } catch { /* no longtask */ }
  });
  if (CPU > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }); }
  await page.goto(`${BASE}/dev/desk?fixture=${fixture}&band=b3&face=live&puppet=${puppet ? 1 : 0}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000); // the stage loads, warms and reveals
  const r = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    window.__long.length = 0;
    const live = document.querySelectorAll(".fp-host canvas").length;
    const task = [];
    for (let i = 0; i < 40; i++) { await sleep(37); const t0 = performance.now(); await new Promise((r) => setTimeout(r, 0)); task.push(performance.now() - t0); }
    const idb = [];
    const open = () => new Promise((res, rej) => { const o = indexedDB.open("taskwait-probe", 1); o.onupgradeneeded = () => o.result.createObjectStore("t"); o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error); });
    const put = (db, k) => new Promise((res, rej) => { const tx = db.transaction("t", "readwrite"); tx.objectStore("t").put({ k, at: Date.now() }, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    for (let i = 0; i < 12; i++) { await sleep(53); const t0 = performance.now(); const db = await open(); await put(db, `r${i}`); await put(db, `w${i}`); db.close(); idb.push(performance.now() - t0); }
    // final → POST, the runtime's shape (one DB open per page, as the outbox keeps it)
    const turn = [];
    const tdb = await open();
    for (let i = 0; i < 12; i++) {
      await sleep(700 + (i * 97) % 300);
      const t0 = performance.now();
      window.dispatchEvent(new CustomEvent("taxila:play-heard", { detail: { text: "probe" } }));
      await put(tdb, `reserve${i}`);
      await put(tdb, `turn${i}`);
      turn.push(performance.now() - t0);
      void fetch("/api/lesson/turn-probe", { method: "POST", body: "{}" }).catch(() => {});
    }
    tdb.close();
    // frames drawn over 2 s (rAF count on this page: the stage's own loop shares the frame clock)
    let frames = 0; const t0 = performance.now(); await new Promise((r) => { const f = () => { frames++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    return { live, task, idb, turn, longs: [...window.__long], rafPerSec: frames / ((performance.now() - t0) / 1000) };
  });
  await ctx.close();
  return { fixture, puppet, live: r.live, task: sum(r.task), idb: sum(r.idb), turn: sum(r.turn), longtask: { n: r.longs.length, total: Math.round(r.longs.reduce((a, b) => a + b, 0)), max: r.longs.length ? Math.round(Math.max(...r.longs)) : 0 }, rafPerSec: +r.rafPerSec.toFixed(1) };
}

const browser = await chromium.launch();
const rows = [];
try {
  for (const fixture of FIXTURES) for (const puppet of [false, true]) {
    const row = await measure(browser, { fixture, puppet });
    rows.push(row);
    console.log(JSON.stringify(row));
  }
} finally {
  await browser.close();
  srv.kill();
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), cpu: CPU, look: LOOK, method: "tests/prod/r4-asha-taskwait.mjs (headless Chromium, software GL, not a phone)", rows }, null, 1));
