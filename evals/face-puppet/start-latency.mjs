// Round 7 face-puppet-raster-cost-main-thread: does the face slow the lesson's START on a weak phone?
// The REAL lesson runtime on /dev/desk?live=1 (scripted Director + clock link, no models), production build with dev
// routes, headless Chromium with software GL (SwiftShader: the raster cost lands on the CPU, like a low-end phone's
// weak GPU path) and a CDP CPU throttle. Per page: navigation start → the Desk's floor first reads "speaking" (her first
// sound, as the runtime schedules it), and long tasks in the first 6 s. Arms, interleaved: off (?puppet=0, her still),
// live (?puppet=1: forced past the weak-device gate; the rig in its worker), live-main (?rigworker=0: the rig on the main
// thread, the pre-worker path) and auto (no flag: the gate decides; SwiftShader → the lite path). Target (PIPELINE §D): live within ~300 ms of puppet off at p50.
//   node evals/face-puppet/start-latency.mjs [--n 10] [--cpu 6] [--look r8|lamp2] [--dist <dir>] [--out <file.json>]
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", "10"));
const CPU = Number(arg("--cpu", "6"));
const LOOK = arg("--look", "r8");
const OUT = arg("--out", null);
let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-r7-face-start-"));
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
const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]); };
const sum = (a) => ({ n: a.length, p50: q(a, 0.5), p90: q(a, 0.9), max: a.length ? Math.round(Math.max(...a)) : null });

async function one(browser, armName) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.route("**/api/face/config*", (r) => r.fulfill({ json: { puppet2d: true, visemes: true, rev: "r8", look: LOOK, ...(LOOK === "lamp2" ? { cohort: "owner" } : {}) } }));
  await page.addInitScript(() => {
    const w = window;
    w.__r7 = { long: [], speakingAt: null, face: null };
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__r7.long.push([e.startTime, e.duration]); }).observe({ type: "longtask", buffered: true }); } catch { /* none */ }
    new MutationObserver(() => {
      if (w.__r7.speakingAt == null && document.querySelector('[data-floor="speaking"]')) w.__r7.speakingAt = performance.now();
    }).observe(document, { subtree: true, attributes: true, childList: true, attributeFilter: ["data-floor"] });
  });
  const cdp = await ctx.newCDPSession(page);
  if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await page.goto(`${BASE}/dev/desk?live=1&band=b3&face=live&facerig=1${armName === "auto" ? "" : armName === "live-main" ? "&puppet=1&rigworker=0" : `&puppet=${armName === "live" ? 1 : 0}&rigworker=1`}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__r7.speakingAt != null, null, { timeout: 60_000 });
  await page.waitForTimeout(6000);
  const r = await page.evaluate(() => {
    const h = document.querySelector("[data-face]");
    const long = window.__r7.long.filter(([s]) => s < 6000 + window.__r7.speakingAt);
    return { speakingAt: window.__r7.speakingAt, phase: h?.getAttribute("data-phase"), canvas: !!document.querySelector(".fp-host canvas"), lite: !!document.querySelector('[data-lite="mouth"]'),
      longN: long.length, longTotal: long.reduce((a, [, d]) => a + d, 0), longMax: long.reduce((a, [, d]) => Math.max(a, d), 0),
      stage: window.__puppet?.snapshot?.() ?? null, path: (window.__puppet?.log ?? []).find((e) => e.type === "loaded")?.path ?? null };
  });
  await ctx.close();
  return r;
}

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ARMS = ["off", "live", "live-main", "auto"];
const runs = { off: [], live: [], "live-main": [], auto: [] };
try {
  for (let i = 0; i < N; i++) for (let j = 0; j < ARMS.length; j++) {
    const a = ARMS[(i + j) % ARMS.length];
    const r = await one(browser, a);
    runs[a].push(r);
    console.log(JSON.stringify({ i, arm: a, speakingAt: Math.round(r.speakingAt), phase: r.phase, lite: r.lite, path: r.path, longTotal: Math.round(r.longTotal), longMax: Math.round(r.longMax) }));
  }
} finally {
  await browser.close();
  srv.kill();
}
const arm = (rs) => ({ firstSpeaking: sum(rs.map((r) => r.speakingAt)), longTotal: sum(rs.map((r) => r.longTotal)), longMax: sum(rs.map((r) => r.longMax)), phases: [...new Set(rs.map((r) => r.phase))] });
const res = { date: new Date().toISOString(), cpu: CPU, look: LOOK, n: N, method: "evals/face-puppet/start-latency.mjs (headless Chromium, SwiftShader GL, CDP CPU throttle; a weak-phone proxy, not a phone)",
  off: arm(runs.off), live: arm(runs.live), "live-main": arm(runs["live-main"]), auto: arm(runs.auto) };
res.deltaP50 = { live: res.live.firstSpeaking.p50 - res.off.firstSpeaking.p50, "live-main": res["live-main"].firstSpeaking.p50 - res.off.firstSpeaking.p50, auto: res.auto.firstSpeaking.p50 - res.off.firstSpeaking.p50 };
console.log(JSON.stringify(res, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
