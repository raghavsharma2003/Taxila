// Frame-rate proxy bench (PLAN §10 B1 step 1): realtime demo in headless Chromium with CDP CPU throttling.
// SwiftShader renders WebGL on the CPU, so the GPU cost lands on the throttled CPU too: a pessimistic proxy, NOT the
// Mali-G52 measurement the PLAN requires before anyone says "60 fps on a cheap Android".
//   node scripts/character/puppet2d/P/fps.mjs [rate=4] [seconds=20] [dpr=1] [gpu=swiftshader|default]
import { serve, open } from "./shoot.mjs";
const rate = +(process.argv[2] || 4), secs = +(process.argv[3] || 20), dpr = +(process.argv[4] || 1);
const srv = await serve();
const { browser, page } = await open(srv, "", { viewport: { width: +(process.env.VW || 720), height: 900 }, deviceScaleFactor: dpr });
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate });
await page.evaluate(() => { const s = window.P2D.stats; s.intervals.length = 0; s.work.length = 0; });
await page.waitForTimeout(secs * 1000);
const r = await page.evaluate(() => {
  const s = window.P2D.stats;
  const q = (a, p) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
  const iv = s.intervals.slice(5), w = s.work.slice(5);
  return { frames: iv.length, fpsP50: 1000 / q(iv, 0.5), intervalP95: q(iv, 0.95), workP50: q(w, 0.5), workP95: q(w, 0.95), stats: window.P2D.rig.stats(), ua: navigator.userAgent, renderer: (() => { const gl = document.createElement("canvas").getContext("webgl2"); const e = gl.getExtension("WEBGL_debug_renderer_info"); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?"; })() };
});
console.log(JSON.stringify({ rate, secs, dpr, ...r }, null, 1));
await browser.close();
srv.close();
