// The look's rest posters (assets.ts puppetPoster: rest-<framing>.webp): the live KeyRig at rest (t = 0.5 s, before the
// first blink) over the framing's full width and down to the bottom of the art (native y 700), so `width: 100%; height:
// auto` from the top lines up with the canvas pixel for pixel. Views = the patch's LookPack framings (3-element).
//   node poster.mjs
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
const PACK = "/home/user/Taxila/art/character/puppet2d/lamp2";
export const VIEWS = { medium: [203, 0, 618], close: [279, 20.5, 484] };
const b = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell" });
const pg = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
await pg.goto(`file://${PACK}/demo.html?capture=1&only=none`);
await pg.waitForFunction(() => window.TxPuppet && window.PACK, null, { timeout: 60000 });
for (const [name, v] of Object.entries(VIEWS)) {
  const W = 720, H = Math.round(((700 - v[1]) / v[2]) * W);
  const url = await pg.evaluate(async ([v, W, H]) => {
    const P = window.PACK, imgs = {};
    await Promise.all(Object.entries(P.imgs).map(async ([n, u]) => { const im = new Image(); im.src = u; await im.decode(); imgs[n] = im; }));
    const cv = document.createElement("canvas"); cv.style.cssText = `width:${W}px;height:${H}px;position:fixed;left:0;top:0`; document.body.appendChild(cv);
    const rig = new window.TxPuppet.KeyRig(cv, P.geom, imgs, { view: v, dpr: 1 });
    rig.clock = 0.5; rig.frame({}, [0, 0, 0], [0, 0], 0, 0);
    const u = cv.toDataURL("image/png"); cv.remove(); return u;
  }, [v, W, H]);
  const png = `/tmp/claude-0/-home-user-Taxila/4f5bd6cc-5f93-53a8-934d-4a29dc9ad564/scratchpad/l2/rest-${name}.png`;
  fs.writeFileSync(png, Buffer.from(url.split(",")[1], "base64"));
  execFileSync("python3", ["-I", "-c", "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],'WEBP',quality=82,method=6)", png, `${PACK}/rest-${name}.webp`]);
  console.log(name, W, H, fs.statSync(`${PACK}/rest-${name}.webp`).size);
}
await b.close();
