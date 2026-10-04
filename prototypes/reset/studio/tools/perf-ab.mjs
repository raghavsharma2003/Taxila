// Interleaved A/B frame-time measurement (STUDIO-V2 §14 M3). The host is shared with other agents, so absolute
// numbers drift with load; A and B alternate run by run so the drift hits both arms equally.
//   node prototypes/reset/studio/tools/perf-ab.mjs [pairs=3] [rate=4]
// Profile: 915x412 CSS px landscape, DPR pinned at 2 (?dpr=2 disables adaptive resolution so arms are comparable),
// CDP CPU throttle `rate`, 3 s warm-up then 12 s sampled from the page's own rAF trace (window.__studioPerf).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../../../../node_modules/playwright/index.mjs";
import { serve } from "./serve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const PAIRS = +(process.argv[2] || 3), RATE = +(process.argv[3] || 4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARMS = [
  { key: "moon-layers", url: "03-moon-phases/?autoplay=1&t=40&sound=off&dpr=2" },
  { key: "moon-live", url: "03-moon-phases/?autoplay=1&t=40&sound=off&dpr=2&layers=0" },
  { key: "landfall", url: "01-landfall/?seed=7&sound=off&dpr=2" },
  { key: "circuit", url: "02-circuit-lab/?seed=7&sound=off&dpr=2" },
];
const { server, port } = await serve(0);
const browser = await chromium.launch();
const rows = [];
for (let p = 0; p < PAIRS; p++) {
  for (const arm of ARMS) {
    const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: RATE });
    await page.goto(`http://127.0.0.1:${port}/studio/${arm.url}`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === "1", null, { timeout: 30000 });
    await sleep(3000);
    const i0 = await page.evaluate(() => window.__studioPerf.frames.length);
    const load0 = os.loadavg()[0];
    await sleep(12000);
    const sum = await page.evaluate((i) => window.__studioPerf.summary(i), i0);
    rows.push({ pair: p, arm: arm.key, load1: +((load0 + os.loadavg()[0]) / 2).toFixed(1), ...sum });
    console.log(JSON.stringify(rows.at(-1)));
    await ctx.close();
  }
}
await browser.close(); server.close();
const by = {};
for (const r of rows) (by[r.arm] ||= []).push(r);
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const summary = Object.fromEntries(Object.entries(by).map(([k, v]) => [k, { n: v.length, fpsMedian: med(v.map((r) => r.fps)), p95Median: med(v.map((r) => r.p95)), over20Median: med(v.map((r) => r.over20ms)) }]));
console.log(JSON.stringify(summary, null, 1));
fs.writeFileSync(path.resolve(here, "../recordings/perf-ab.json"), JSON.stringify({ date: new Date().toISOString(), cpus: os.cpus().length, rate: RATE, pairs: PAIRS, method: "interleaved arms, 915x412 @2.625 DSF, ?dpr=2 pinned, CDP CPU throttle, 3 s warm-up + 12 s rAF sample; headless Chromium software raster on a shared 4-core host", summary, rows }, null, 1));
