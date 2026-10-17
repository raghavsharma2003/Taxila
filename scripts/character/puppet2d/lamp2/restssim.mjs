// Rest gate: the live KeyRig's rest frame (every weight 0, t = 0.5 s: before the first blink, 1:1 native px, view = the
// rig-space crop 162,0 700x700) rendered in headless Chromium, saved for restssim.py.
//   node restssim.mjs <out.png>
import fs from "node:fs";
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell" });
const pg = await b.newPage({ viewport: { width: 760, height: 760 }, deviceScaleFactor: 1 });
await pg.goto("file:///home/user/Taxila/art/character/puppet2d/lamp2/demo.html?capture=1&only=none");
await pg.waitForFunction(() => window.TxPuppet && window.PACK, null, { timeout: 60000 });
const url = await pg.evaluate(async () => {
  const P = window.PACK, imgs = {};
  await Promise.all(Object.entries(P.imgs).map(async ([n, u]) => { const im = new Image(); im.src = u; await im.decode(); imgs[n] = im; }));
  const cv = document.createElement("canvas"); cv.style.cssText = "width:700px;height:700px;position:fixed;left:0;top:0"; document.body.appendChild(cv);
  const rig = new window.TxPuppet.KeyRig(cv, P.geom, imgs, { view: [162, 0, 700, 700], dpr: 1 });
  rig.clock = 0.5; rig.frame({}, [0, 0, 0], [0, 0], 0, 0);
  return cv.toDataURL("image/png");
});
fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
await b.close();
