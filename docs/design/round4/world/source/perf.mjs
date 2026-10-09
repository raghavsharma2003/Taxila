// A rough performance probe (NOT a phone): headless Chromium, SwiftShader (software WebGL), CPU throttled 4x via CDP,
// 360x800 at DPR 2. Frame intervals from requestAnimationFrame while each screen does its heaviest thing.
import { browser, page, URL0 } from "./shoot.mjs";
import { writeFileSync } from "node:fs";
const b = await browser();
const vp = { id: "360x800", w: 360, h: 800, dpr: 2 };
const res = {};
const probe = (ms) => new Promise((done) => { const iv = []; let last = performance.now(); const t0 = last; const f = (now) => { iv.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(f); else { iv.sort((a, b) => a - b); const q = (p) => +iv[Math.min(iv.length - 1, Math.floor(p * iv.length))].toFixed(1); done({ frames: iv.length, p50: q(0.5), p95: q(0.95), max: +iv[iv.length - 1].toFixed(1) }); } }; requestAnimationFrame(f); });
for (const throttle of [1, 4, 1, 4, 1, 4]) {
  const p = await page(b, vp);
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  const t0 = Date.now();
  await p.goto(URL0 + "#lesson");
  await p.waitForFunction(() => window.TX && document.querySelector(".screen.on"), null, { timeout: 60000 });
  const boot = Date.now() - t0;
  await p.waitForTimeout(2500);
  const lesson = await p.evaluate(probe, 3000);              // the live face talking + board drawing
  await p.evaluate(() => TX.go("game")); await p.waitForTimeout(1500);
  const gameP = p.evaluate(probe, 2500);
  for (const d of [8, 3]) { await p.click(`#gChisel button[data-d="${d}"]`).catch(() => {}); await p.waitForTimeout(500); }
  const game = await gameP;                                   // splits: springs, particles, shake
  await p.evaluate(() => TX.go("map")); await p.waitForTimeout(1800);
  const mapP = p.evaluate(probe, 2500);
  await p.mouse.move(180, 500); await p.mouse.down();
  for (let i = 0; i < 40; i++) { await p.mouse.move(180 + Math.sin(i / 4) * 40, 500 - i * 9); await p.waitForTimeout(25); }
  await p.mouse.up();
  const map = await mapP;                                      // panning the SVG valley
  (res[`cpu${throttle}x`] ||= []).push({ bootMs: boot, lesson, game, map });
  console.log(throttle + "x", JSON.stringify({ bootMs: boot, lesson, game, map }));
  await p.context().close();
}
writeFileSync(new URL("./shots/perf.json", import.meta.url).pathname, JSON.stringify({ date: "2026-10-09", method: "headless Chromium 1194 (Playwright 1.63), SwiftShader WebGL, CDP CPU throttle, 360x800 DPR 2, rAF intervals in ms; n = 1 run per cell. Not a phone.", ...res }, null, 1));
await b.close();
