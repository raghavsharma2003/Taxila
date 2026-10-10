import path from "node:path";
const ROOT = process.cwd();
const { createServer } = await import("vite");
const vite = await createServer({ root: ROOT, configFile: path.join(ROOT, "vite.config.ts"), logLevel: "error", server: { port: 0, host: "127.0.0.1", hmr: false } });
await vite.listen();
const base = vite.resolvedUrls.local[0].replace(/\/$/, "");
const { FIXTURES } = { FIXTURES: process.argv[2].split(",") };
const { chromium } = await import("playwright");
const b = await chromium.launch();
for (const f of FIXTURES) for (const band of ["b3", "b2"]) for (const [w, h] of [[360, 800], [412, 915], [1366, 768]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(`${base}/dev/desk?fixture=${f}&band=${band}&theme=light&motion=reduce`);
  await p.waitForSelector('[data-testid="answer-dock"], .dk-dock', { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => [...document.querySelectorAll('[data-testid="mode-line"], .dk-state, .dk-dock-head *')].filter((e) => (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) && getComputedStyle(e).overflow !== "visible").map((e) => `${e.className}: "${e.textContent}" w ${e.scrollWidth}>${e.clientWidth} h ${e.scrollHeight}>${e.clientHeight}`));
  if (r.length) console.log(f, band, w, JSON.stringify(r));
  if (process.env.SHOT && w === 360) await p.screenshot({ path: `${process.env.SHOT}/dock-${f}-${band}-360.png` });
  await p.close();
}
await b.close(); await vite.close();
