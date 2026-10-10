// fps gate (r8: >= 50 fps at 4x CPU throttle on the smallest slot): demo.html in capture mode with ONLY the given slot
// (default the 80 px speech-row circle), the real-time scene loop (rAF, her line playing from 1.5 s), CDP
// Emulation.setCPUThrottlingRate. HEADLESS Chromium with SwiftShader GL (software rendering: the GPU work also lands on
// the throttled CPU), so this is a pessimistic proxy for a phone, not a phone measurement.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node fps.mjs <out.json> [slot=row] [vp=360] [secs=10] [dpr=2]
import fs from "node:fs";
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
const [out, slot = "row", vp = "360", secs = "10", dpr = "2"] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const res = { date: new Date().toISOString(), method: "demo.html?capture=1&only=<slot>, rAF loop with the scene from 1.5 s, CDP CPU throttle, headless Chromium + SwiftShader (software GL)", slot, vp, dpr: +dpr, runs: [] };
for (const rate of [1, 4]) {
  const pg = await b.newPage({ viewport: { width: Number(vp), height: 400 }, deviceScaleFactor: 1 });
  const cdp = await pg.context().newCDPSession(pg);
  await pg.goto(`file:///home/user/Taxila/art/character/puppet2d/lamp1/demo.html?capture=1&vp=${vp}&only=${slot}&dpr=${dpr}`);
  await pg.waitForFunction(() => window.cap && window.cap.ready, null, { timeout: 60000 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  await pg.evaluate(() => window.cap.fps(2, 0.5));   // warm-up (shader compile, JIT)
  const r = await pg.evaluate(([s]) => window.cap.fps(s, 1.5), [Number(secs)]);
  res.runs.push({ rate, ...r, canvasPx: await pg.evaluate(() => { const c = document.querySelector("canvas"); return [c.width, c.height]; }) });
  console.log(`rate ${rate}x: ${r.fps.toFixed(1)} fps (p50 ${r.p50.toFixed(1)} ms, p95 ${r.p95.toFixed(1)} ms, max ${r.max.toFixed(1)} ms, ${r.frames} frames / ${r.secs.toFixed(1)} s)`);
  await pg.close();
}
await b.close();
fs.writeFileSync(out, JSON.stringify(res, null, 1));
