// Records the lesson's motion (webm) and a frame sequence, plus a short game-juice clip.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("/home/user/Taxila/node_modules/playwright/index.mjs");
import { execFileSync } from "child_process";
import fs from "fs";
const D = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-kinetic";
const OUT = process.argv[2]; fs.mkdirSync(OUT + "/frames", { recursive: true }); fs.mkdirSync(D + "/vid", { recursive: true });
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const cache = new Map();
const route = async (r) => { const u = r.request().url(); if (!cache.has(u)) cache.set(u, execFileSync("curl", ["-sS", "--fail", "-A", UA, u])); await r.fulfill({ status: 200, body: cache.get(u), contentType: u.includes("googleapis") ? "text/css" : "font/woff2" }); };
const b = await chromium.launch();
// 1) webm of the lesson at 412x915
{
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, recordVideo: { dir: D + "/vid", size: { width: 412, height: 915 } } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, route);
  const p = await ctx.newPage(); await p.goto("file://" + D + "/preview.html#home"); await p.waitForTimeout(1400);
  await p.click(".ticket .slab"); // the real transition: home -> lesson
  await p.waitForSelector("[data-demo=yes]", { timeout: 30000 }); await p.waitForTimeout(1200);
  await p.click("[data-demo=yes]");
  await p.waitForSelector("#rail .slab", { timeout: 40000 }); await p.waitForTimeout(1200);
  await p.click("#rail .slab"); await p.waitForTimeout(1500);
  const tap = async (n) => { await p.evaluate((n) => { const el = [...document.querySelectorAll("#gameSlot .nd")].find((x) => x.textContent.trim() === String(n) && !x.classList.contains("spent")); el && el.click(); }, n); await p.waitForTimeout(450); };
  await tap(84); await p.click("[data-div='5']"); await p.waitForTimeout(1200);
  await p.click("[data-div='2']"); await p.waitForTimeout(1100); await tap(42); await p.click("[data-div='6']"); await p.waitForTimeout(1100);
  await tap(6); await p.click("[data-div='2']"); await p.waitForTimeout(1200); await p.click("#gDone"); await p.waitForTimeout(2600);
  const v = p.video(); await ctx.close(); fs.copyFileSync(await v.path(), OUT + "/lesson-to-game-412x915.webm");
}
// 2) frame sequence of the lesson at 360x800 (every 450 ms from the start of the lesson)
{
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 } }); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, route);
  const p = await ctx.newPage(); await p.goto("file://" + D + "/preview.html#lesson"); await p.waitForTimeout(600);
  await p.click("#lReplay");
  for (let i = 0; i < 40; i++) {
    await p.screenshot({ path: `${OUT}/frames/lesson-360-${String(i).padStart(2, "0")}.png` });
    if (i === 30) { const d = await p.$("[data-demo=yes]"); if (d) await d.click(); }
    await p.waitForTimeout(450);
  }
  await ctx.close();
}
await b.close(); console.log("done");
