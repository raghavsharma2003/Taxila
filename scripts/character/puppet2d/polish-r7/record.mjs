// Realtime Playwright screen recording of the demo (recordVideo), e.g. the talking scene onward.
//   node scripts/character/puppet2d/polish-r7/record.mjs <startSeconds> <seconds> <out.webm>
import fs from "node:fs";
import { serve } from "./shoot.mjs";
import { chromium } from "playwright";
const [start = "5", secs = "14", out = "art/character/puppet2d/polish-r7/clip-realtime-playwright.webm"] = process.argv.slice(2);
const srv = await serve();
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 720, height: 760 }, recordVideo: { dir: "art/character/puppet2d/polish-r7/work/video", size: { width: 720, height: 760 } } });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${srv.address().port}/demo.html?start=${start}`);
await page.waitForFunction(() => window.P2D && window.P2D.ready);
await page.waitForTimeout(+secs * 1000);
const st = await page.evaluate(() => { const iv = window.P2D.stats.intervals.slice(5).sort((a, b) => a - b); return { frames: iv.length, fpsP50: 1000 / iv[Math.floor(iv.length / 2)] }; });
const v = page.video();
await ctx.close();
fs.copyFileSync(await v.path(), out);
console.log("recorded", out, JSON.stringify(st));
await browser.close();
srv.close();
