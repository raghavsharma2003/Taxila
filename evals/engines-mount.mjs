// engines-v1 mount time in the production frame (dist/, strict meta CSP, HTTP sandbox header, opaque-origin
// iframe): wall clock from the host creating the iframe to the engine's root being visible, per engine, n
// mounts each, in headless Chromium at 360×800, with and without 4× CPU throttling (a rough stand-in for a
// budget phone; NOT the V15 reference-device measurement CONTENT-ENGINE §9 asks for).
// Usage: npx vite build && node evals/engines-mount.mjs [--n 5] [--out evals/results/engines-v1-mount-<date>.json]
import { writeFileSync } from "fs";
import http from "http";
import { createReadStream, statSync } from "fs";
import { extname, join, normalize } from "path";
import { SCENARIOS } from "../tests/fixtures/engine-scenarios.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const N = Number(process.argv[process.argv.indexOf("--n") + 1]) || 5;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const srv = http.createServer((req, res) => {
  const path = decodeURIComponent((req.url || "/").split("?")[0]);
  const file = path === "/tests/fixtures/engine-harness.html" ? join(ROOT, path) : normalize(join(ROOT, "dist", path));
  try { if (!statSync(file).isFile()) throw 0; } catch { res.writeHead(404); return res.end(); }
  const h = { "content-type": TYPES[extname(file)] || "application/octet-stream" };
  if (path.startsWith("/assets/")) h["access-control-allow-origin"] = "*";
  if (path === "/modules.html") h["content-security-policy"] = "sandbox allow-scripts; frame-ancestors 'self'";
  res.writeHead(200, h);
  createReadStream(file).pipe(res);
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${srv.address().port}/`;
const { chromium } = await import("playwright");
const browser = await chromium.launch();
const out = { at: new Date().toISOString(), method: `headless Chromium (dev container), production build, n=${N} mounts per engine per arm; ms from iframe creation to .ek visible`, arms: {} };
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
for (const throttle of [1, 4]) {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.goto(`${base}tests/fixtures/engine-harness.html`);
  const seen = new Set();
  const arm = {};
  for (const sc of SCENARIOS) {
    if (seen.has(sc.engine)) continue;
    seen.add(sc.engine);
    const ms = [];
    for (let i = 0; i < N; i++) {
      const t0 = Date.now();
      await page.evaluate(([e, p, id]) => window.mount(e, p, { moduleId: id }), [sc.engine, sc.params, `m${i}`]);
      const frame = await (await page.waitForSelector(`iframe[src$="#m${i}"]`)).contentFrame();
      await frame.waitForSelector(".ek[data-engine]", { timeout: 20_000 });
      ms.push(Date.now() - t0);
    }
    arm[sc.engine] = { n: N, p50: pct(ms, 50), max: Math.max(...ms), first: ms[0] };
  }
  out.arms[`cpu_x${throttle}`] = arm;
  await page.close();
}
await browser.close();
srv.close();
const i = process.argv.indexOf("--out");
if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(out, null, 1) + "\n");
console.log(JSON.stringify(out, null, 1));
