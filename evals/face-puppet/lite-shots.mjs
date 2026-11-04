// Round 7: frames of the light mouth on the lite path (/dev/desk?live=1, no ?puppet flag, SwiftShader → the static gate),
// sampled while she speaks.  node evals/face-puppet/lite-shots.mjs <distDir> <outDir>
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const ROOT = new URL("../..", import.meta.url).pathname;
const [dist, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const PORT = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 150)); }
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.route("**/api/face/config*", (r) => r.fulfill({ json: { puppet2d: true, look: "r8" } }));
await page.goto(`http://127.0.0.1:${PORT}/dev/desk?live=1&band=b3&face=live`);
await page.waitForSelector('[data-floor="speaking"]', { timeout: 60000 });
const keys = [];
for (let i = 0; i < 12; i++) {
  const el = await page.$("[data-face]");
  await el.screenshot({ path: `${out}/lite-${String(i).padStart(2, "0")}.png` });
  keys.push(await page.evaluate(() => [...document.querySelectorAll('[data-lite="mouth"] img')].findIndex((i) => i.style.opacity === "1")));
  await page.waitForTimeout(140);
}
console.log("shown key index per frame (-1 = closed):", keys.join(" "));
await b.close(); srv.kill();
