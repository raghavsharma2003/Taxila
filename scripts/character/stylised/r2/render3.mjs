// three.js evidence renders for style C (TaxilaToon, headless Chromium on SwiftShader). Run from the repo root:
//   node scripts/character/stylised/r2/render3.mjs <glb> <outdir> [--size 1024] [--tier H] [view ...] [pose:<name> ...]
// view = front | q3L | q3R | profile | back | face | close | eyes | mouth | bust ; pose names come from poses.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const size = +opt("--size", "1024");
const tier = opt("--tier", "H");
const [glb, out, ...items] = argv;
fs.mkdirSync(out, { recursive: true });
const POSES = JSON.parse(fs.readFileSync(path.join(HERE, "poses.json"), "utf8"));

process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const server = await createServer({ root: process.cwd(), configFile: false, logLevel: "error",
  server: { port: 5395, strictPort: false, host: "127.0.0.1", fs: { strict: false } }, optimizeDeps: { noDiscovery: true, include: [] } });
await server.listen();
const url = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: size, height: size } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`${url}/scripts/character/stylised/r2/viewer/index.html?w=${size}&h=${size}`);
await page.waitForFunction(() => window.TX_READY === true, null, { timeout: 120000 });
const glbUrl = "/@fs" + path.resolve(glb);
const info = await page.evaluate(([u, t]) => TX.load(u, t), [glbUrl, tier]);
console.log(JSON.stringify(info));
const canvas = await page.$("canvas");
if (process.env.WIRE) await page.evaluate(() => TX.wire(true));
for (const it of items.length ? items : ["front"]) {
  let file;
  if (it.startsWith("pose:")) {
    const name = it.slice(5), pz = POSES[name];
    await page.evaluate((p) => { TX.pose({ bs: p.bs || {}, gaze: p.gaze || [0, 0], head: p.head || [0, 0, 0] }); TX.view(p.view || p.frame || "face", p.yaw); TX.render(); }, pz);
    file = path.join(out, `pose_${name}.png`);
  } else {
    await page.evaluate((v) => { TX.pose({}); TX.view(v); TX.render(); }, it);
    file = path.join(out, `${it}.png`);
  }
  await canvas.screenshot({ path: file });
}
if (errors.length) console.log("ERRORS", JSON.stringify(errors.slice(0, 8)));
await browser.close(); await server.close();
