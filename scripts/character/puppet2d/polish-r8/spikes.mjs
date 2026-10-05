// r5: where do the p95 frames come from? realtime under CPU throttle; prints work vs rig split of the slowest frames
import { serve, open } from "./shoot.mjs";
const rate = +(process.argv[2] || 4), secs = +(process.argv[3] || 15), q = process.argv[4] || "";
const srv = await serve();
const { browser, page } = await open(srv, q, { viewport: { width: 720, height: 900 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate });
await page.evaluate(() => { const s = window.P2D.stats; s.intervals.length = 0; s.work.length = 0; s.rig.length = 0; });
await page.waitForTimeout(secs * 1000);
const r = await page.evaluate(() => {
  const s = window.P2D.stats, w = s.work.slice(5), g = s.rig.slice(5);
  const q = (a, p) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
  const idx = w.map((v, i) => i).sort((a, b) => w[b] - w[a]).slice(0, 12);
  return { n: w.length, workP50: q(w, 0.5), workP95: q(w, 0.95), rigP50: q(g, 0.5), rigP95: q(g, 0.95), nonRigP95: q(w.map((v, i) => v - g[i]), 0.95), slow: idx.map((i) => [i, +w[i].toFixed(1), +g[i].toFixed(1)]) };
});
console.log(JSON.stringify(r));
await browser.close(); srv.close();
