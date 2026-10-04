// M4 check: share of frames inside aligned bilabial (p/b/m) segments where the lips are closed (gap <= 1.5 px).
import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 360, height: 416 } });
await p.goto("file://" + path.resolve("art/character/puppet2d/V/demo.html") + "?rec=1&dpr=1");
await p.waitForFunction(() => window.DEMO_READY, null, { timeout: 120000 });
const r = await p.evaluate(() => {
  let inPP = 0, closed = 0;
  for (let i = 0; i <= 18 * 60; i++) {
    const t = i / 60;
    window.DEMO.step(t, 1 / 60);
    const bs = window.DEMO.rig.state.bs, ms = window.DEMO.rig.ms;
    if ((bs.viseme_PP || 0) >= 0.5) { inPP++; const gap = 50 * ms.open + 6 * ms.lowerDown + 4 * ms.open + 6 * ms.upperUp; if (gap <= 1.5) closed++; }
  }
  return { framesInBilabial: inPP, closed, share: closed / inPP };
});
console.log(JSON.stringify(r));
fs.writeFileSync("art/character/puppet2d/V/evidence/bilabial.json", JSON.stringify({ ...r, method: "demo script lines 1+2 at 60 fps, frames with viseme_PP >= 0.5, closed = solver gap <= 1.5 px", date: new Date().toISOString() }));
await b.close();
