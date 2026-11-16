// Round 7 face (every look): does her live face survive a GL context loss, as on a phone switching apps? The main-thread
// rig rebuilds once on the restored context (stage.ts onRestored); round 7 gives the worker rig the same (rigWorker.ts).
// /dev/desk?live=1 (scripted lesson), the live puppet forced on, SwiftShader. Per arm (worker / main thread): wait for her
// live face, force a loss (WEBGL_lose_context via stage.debugLoseContext, restored after RESTORE_MS), and record whether
// she comes back live and how long it took (loss → the next reveal); then a SECOND loss, which must hold her own still
// (the one-rebuild rule). The poster is under the canvas throughout, so the slot is never empty.
//   node evals/face-puppet/context-loss.mjs [--dist <dir>] [--out <file.json>] [--n 3]
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("--out", null);
const N = Number(arg("--n", "3"));
const RESTORE_MS = 400;
let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-r7-face-ctx-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_DEV_ROUTES: "1" } });
}
const PORT = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 150)); }

async function one(browser, arm) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  await ctx.route("**/api/face/config*", (r) => r.fulfill({ json: { puppet2d: true, visemes: true, rev: "r8", look: "r8" } }));
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)));
  await page.goto(`${BASE}/dev/desk?live=1&band=b3&face=live&facerig=1&puppet=1&rigworker=${arm === "worker" ? 1 : 0}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__puppet?.isRevealed, null, { timeout: 60_000 });
  await page.waitForTimeout(1500);
  const path0 = await page.evaluate(() => (window.__puppet.log.find((e) => e.type === "loaded") ?? {}).path ?? null);
  const loss = async () => page.evaluate(async (restoreMs) => {
    const s = window.__puppet, host = document.querySelector("[data-face]");
    const n0 = s.log.length, t0 = performance.now();
    s.debugLoseContext(restoreMs);
    // up to 6 s: back live (a reveal after the loss), or a fallback
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 50));
      const after = s.log.slice(n0);
      const fb = after.find((e) => e.type === "fallback");
      if (fb) return { back: false, fallback: fb.reason, ms: Math.round(performance.now() - t0), phase: host?.getAttribute("data-phase"), lost: after.some((e) => e.type === "contextlost") };
      if (after.some((e) => e.type === "reveal") && s.isRevealed) return { back: true, ms: Math.round(performance.now() - t0), phase: host?.getAttribute("data-phase"), lost: after.some((e) => e.type === "contextlost") };
    }
    return { back: false, timeout: true, phase: host?.getAttribute("data-phase") };
  }, RESTORE_MS);
  const first = await loss();
  await page.waitForTimeout(800);
  const second = await loss();
  await page.waitForTimeout(500);
  const end = await page.evaluate(() => ({ phase: document.querySelector("[data-face]")?.getAttribute("data-phase"), poster: !!document.querySelector("[data-face] img")?.complete }));
  await ctx.close();
  return { arm, path: path0, first, second, end, errors };
}

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const runs = [];
try {
  for (let i = 0; i < N; i++) for (const arm of ["worker", "main"]) {
    const r = await one(browser, arm);
    runs.push(r);
    console.log(JSON.stringify(r));
  }
} finally {
  await browser.close();
  srv.kill();
}
const arm = (a) => {
  const rs = runs.filter((r) => r.arm === a);
  const ms = rs.filter((r) => r.first.back).map((r) => r.first.ms).sort((x, y) => x - y);
  return { n: rs.length, paths: [...new Set(rs.map((r) => r.path))], firstLossBackLive: rs.filter((r) => r.first.back).length, backMsP50: ms[Math.floor(ms.length / 2)] ?? null, backMsMax: ms.at(-1) ?? null,
    secondLossHeldStill: rs.filter((r) => !r.second.back && r.end.phase === "held" && r.end.poster).length, pageErrors: rs.reduce((a, r) => a + r.errors.length, 0) };
};
const result = { at: new Date().toISOString(), restoreMs: RESTORE_MS, gl: "swiftshader", arms: { worker: arm("worker"), main: arm("main") }, runs };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result.arms, null, 1));
