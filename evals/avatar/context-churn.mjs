// WebGL context churn in the tutor picker (reviewer finding: dispose() never released the context). Flips the
// selection N times (each flip unmounts one live head and mounts another), then reports the losses the session
// COUNTED (module-global contextLosses: 2 send every later face to tier D), the canvases left in the DOM, and the
// tier a fresh face gets afterwards. Needs a dev server: `npx vite --port 5199`.
//   node evals/avatar/context-churn.mjs [base] [flips] [out.json]
import fs from "node:fs";
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:5199";
const flips = Number(process.argv[3] || 40);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const lost = [];
page.on("console", (m) => { if (/context lost|CONTEXT_LOST|Too many active WebGL/i.test(m.text())) lost.push(m.text().slice(0, 120)); });
await page.goto(`${base}/dev/avatar?view=picker&class=8&face=B`);
await page.waitForSelector('[role="radio"]');
const tiles = await page.$$('[role="radio"]');
const t0 = Date.now();
for (let i = 0; i < flips; i++) {
  await tiles[i % tiles.length].click();
  await page.waitForFunction(() => document.querySelector('[role="radio"][aria-checked="true"] canvas'), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(150);
}
await page.waitForTimeout(1500); // let any async contextlost events land
const r = await page.evaluate(() => ({
  counted: window.__faceContextLosses?.() ?? -1,
  canvases: document.querySelectorAll("canvas").length,
  liveTier: document.querySelector('[role="radio"][aria-checked="true"] .tx-tutorface')?.getAttribute("data-tier") ?? null,
}));
const out = { date: new Date().toISOString().slice(0, 10), flips, ms: Date.now() - t0, ...r, browserWarnings: lost.length, sampleWarning: lost[0] ?? null,
  method: "headless Chromium (Playwright), SwiftShader WebGL2, /dev/avatar picker class 8 (arjun+uma preview), ?face=B forced, click-alternate tiles, 150 ms dwell after the head's canvas mounts" };
console.log(JSON.stringify(out));
if (process.argv[4]) fs.writeFileSync(process.argv[4], JSON.stringify(out, null, 1));
await browser.close();
