// Release 11 · stream 2: the landing's Largest Contentful Paint on a mid phone, before / after, from a production build
// served locally: 412x915 at DPR 2.6, CPU slowed 4x and a 1.6 Mbps / 150 ms network (Chrome DevTools emulation). n runs
// per build, cold cache each run; median and max. LAB numbers on this container, not field data.
//   node tests/prod/r11-site-lcp.mjs --dist <dir> --label before|after [--n 5]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const DIST = path.resolve(arg("dist", "dist")), LABEL = arg("label", "after"), N = Number(arg("n", 5));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".json": "application/json", ".webp": "image/webp", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (u.startsWith("/api/")) { res.writeHead(401); res.end("{}"); return; }
  let f = path.join(DIST, u);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, "index.html");
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] ?? "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const out = [];
try {
  for (let i = 0; i < N; i++) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => { window.__lcp = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: e.startTime, el: e.element?.tagName + "." + (e.element?.className ?? ""), url: e.url }); }).observe({ type: "largest-contentful-paint", buffered: true }); });
    await page.goto(base, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(1500);
    const lcp = await page.evaluate(() => window.__lcp.at(-1));
    const bytes = await page.evaluate(() => performance.getEntriesByType("resource").reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0) + (performance.getEntriesByType("navigation")[0]?.encodedBodySize ?? 0));
    out.push({ lcpMs: Math.round(lcp?.t ?? -1), el: lcp?.el, url: lcp?.url?.replace(base, "/"), kb: Math.round(bytes / 1024) });
    await ctx.close();
  }
} finally { await browser.close(); server.close(); }
const ms = out.map((o) => o.lcpMs).sort((a, b) => a - b);
console.log(JSON.stringify({ label: LABEL, n: N, medianMs: ms[Math.floor(N / 2)], maxMs: ms.at(-1), runs: out }, null, 1));
