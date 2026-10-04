// Stills of the arm V puppet (headless Chromium, SwiftShader GL). From the repo root:
//   node scripts/character/puppet2d/V/shot.mjs <outdir> <name>=<poseJSON> ...     (pose = {bs, head, gaze, lean, breath})
//   node scripts/character/puppet2d/V/shot.mjs <outdir> --poses scripts/character/puppet2d/V/poses.json [names...]
import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const out = argv.shift();
fs.mkdirSync(out, { recursive: true });
let items = [];
const pi = argv.indexOf("--poses");
if (pi >= 0) {
  const P = JSON.parse(fs.readFileSync(argv[pi + 1], "utf8"));
  const names = argv.slice(pi + 2);
  items = (names.length ? names : Object.keys(P).filter((k) => !k.startsWith("_"))).map((n) => [n, P[n]]);
} else items = argv.map((a) => { const i = a.indexOf("="); return [a.slice(0, i), JSON.parse(a.slice(i + 1))]; });
const size = +(process.env.SIZE || 1024);
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const server = await createServer({ root: process.cwd(), configFile: false, logLevel: "error", server: { port: 5411, strictPort: false, host: "127.0.0.1" }, optimizeDeps: { noDiscovery: true, include: [] } });
await server.listen();
const url = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: size, height: size } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`${url}/scripts/character/puppet2d/V/viewer/index.html?s=${size}`);
await page.waitForFunction(() => window.PV_READY === true || window.__err, null, { timeout: 60000 }).catch(() => {});
const canvas = await page.$("canvas");
for (const [name, pose] of items) {
  const st = await page.evaluate((p) => window.PV.pose(p), { settle: 1, ...pose });
  await canvas.screenshot({ path: path.join(out, `${name}.png`) });
  console.log(name, JSON.stringify(st));
}
if (errors.length) console.log("ERRORS", JSON.stringify(errors.slice(0, 8)));
await browser.close();
await server.close();
