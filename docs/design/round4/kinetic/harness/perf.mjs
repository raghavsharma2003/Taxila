// Frame pacing under 4x CPU throttle (CDP), 360x800, headless Chromium (software GL): indicative only.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("/home/user/Taxila/node_modules/playwright/index.mjs");
import { execFileSync } from "child_process";
const D = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-kinetic";
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const cache = new Map();
const route = async (r) => { const u = r.request().url(); if (!cache.has(u)) cache.set(u, execFileSync("curl", ["-sS", "--fail", "-A", UA, u])); await r.fulfill({ status: 200, body: cache.get(u), contentType: u.includes("googleapis") ? "text/css" : "font/woff2" }); };
const b = await chromium.launch();
const results = {};
for (const rate of [1, 4]) {
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 }); await ctx.route(/fonts\./, route);
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await p.goto("file://" + D + "/preview.html#home"); await p.waitForTimeout(1500);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  const probe = async (label, fn, ms) => {
    await p.evaluate(() => { window.__f = []; window.__lt = []; let last = performance.now(); const tick = (t) => { window.__f.push(t - last); last = t; window.__raf = requestAnimationFrame(tick); }; window.__raf = requestAnimationFrame(tick); try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({ type: "longtask", buffered: false }); } catch (e) {} });
    await fn(); await p.waitForTimeout(ms);
    const r = await p.evaluate(() => { cancelAnimationFrame(window.__raf); const f = window.__f.slice(2).sort((a, b) => a - b); const q = (x) => f[Math.min(f.length - 1, Math.floor(f.length * x))]; return { frames: f.length, p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), over50ms: f.filter((x) => x > 50).length, longTasks: window.__lt.length, longestTask: Math.round(Math.max(0, ...window.__lt)) }; });
    results[`${label} @${rate}x`] = r;
  };
  await probe("home->lesson transition + first 8 s of lesson", () => p.click(".ticket .slab"), 8000);
  await p.evaluate(() => window.taal.go("game")); await p.waitForTimeout(800);
  await probe("game: select 84, split by 2, split 42 by 6", async () => { const tap = (n) => p.evaluate((n) => { const el = [...document.querySelectorAll("#gameSlot .nd")].find((x) => x.textContent.trim() === String(n) && !x.classList.contains("spent")); el && el.click(); }, n); await tap(84); await p.click("[data-div='2']"); await p.waitForTimeout(700); await tap(42); await p.click("[data-div='6']"); }, 2500);
  await ctx.close();
}
await b.close(); console.log(JSON.stringify(results, null, 1));
