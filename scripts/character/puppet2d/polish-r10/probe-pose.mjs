// r10: pose a preset and print per-eye lid state (mean top offset vs rest, blink) and the composited bs.
import { serve, open } from "./shoot.mjs";
const specs = JSON.parse(process.argv[2]);
const srv = await serve();
const { browser, page } = await open(srv, "capture=1&px=512");
for (const sp of specs) {
  const r = await page.evaluate((sp) => { const P = window.P2D; P.pose(sp); const R = P.rig, o = {};
    for (const s of ["L", "R"]) { const E = R.eyes[s], e = E.e; let dt = 0, db = 0; const n = E.xb - E.xa + 1; for (let i = 0; i < n; i++) { dt += E.top[i] - e.top[i]; db += E.bot[i] - e.bot[i]; } o[s] = { top: +(dt / n).toFixed(2), bot: +(db / n).toFixed(2), blink: +E.blink.toFixed(2) }; }
    o.bs = Object.fromEntries(Object.entries(R.bs).filter(([k, v]) => Math.abs(v) > 0.01).map(([k, v]) => [k, +v.toFixed(2)])); return o; }, sp);
  console.log(JSON.stringify(sp), JSON.stringify(r));
}
await browser.close(); srv.close();
