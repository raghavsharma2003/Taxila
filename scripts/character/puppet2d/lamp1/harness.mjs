// Headless rig harness: renders the lamp1 pack (or any pack dir) with the bundled rig in Chromium, for a list of poses,
// and writes PNGs. A pose is { name, bs, head:[p,y,r], gaze:[yaw,pitch], lean, breath, view, w, h, t }.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node harness.mjs <packDir> <poses.json> <outDir> [--bundle <puppet.js>]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
const [packDir, posesFile, outDir] = process.argv.slice(2);
const SCR = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha";
const bundle = process.argv.includes("--bundle") ? process.argv[process.argv.indexOf("--bundle") + 1] : `${SCR}/demo-build/puppet.js`;
fs.mkdirSync(outDir, { recursive: true });
const geom = JSON.parse(fs.readFileSync(`${packDir}/geom.json`, "utf8"));
const imgs = {};
for (const n of Object.keys(geom.rects).filter((n) => n !== "bg").concat(["interior"])) imgs[n] = "data:image/webp;base64," + fs.readFileSync(`${packDir}/${n}.webp`).toString("base64");
const poses = JSON.parse(fs.readFileSync(posesFile, "utf8"));
const html = `<!doctype html><html><body style="margin:0;background:#888"><canvas id="c" style="display:block"></canvas>
<script>${fs.readFileSync(bundle, "utf8")}</script>
<script>
window.PACK = ${JSON.stringify({ geom, imgs })};
window.setup = async () => {
  const imgs = {};
  await Promise.all(Object.entries(PACK.imgs).map(async ([n, u]) => { const im = new Image(); im.src = u; await im.decode(); imgs[n] = im; }));
  window.IMGS = imgs;
};
window.renderPose = (p) => {
  const cv = document.getElementById("c");
  cv.style.width = p.w + "px"; cv.style.height = p.h + "px";
  if (!window.rig || window.rigKey !== JSON.stringify([p.w, p.h])) {
    window.rig = new TxPuppet.Puppet2DRig(cv, PACK.geom, null, IMGS, { ext: "webp", dpr: 1, view: p.view, preserve: true, reducedMotion: false });
    window.rigKey = JSON.stringify([p.w, p.h]);
  }
  const rig = window.rig;
  rig.view = p.view;
  rig.resetPhysics && rig.resetPhysics();
  if (rig.life) rig.life.still = !!p.still;
  // settle springs and smoothers: 40 frames at 60 fps on a fixed clock
  for (let i = 0; i < (p.settle ?? 40); i++) { rig.clock = (p.t ?? 10) + i / 60; rig.frame(p.bs || {}, p.head || [0, 0, 0], p.gaze || [0, 0], p.lean || 0, p.breath || 0); }
  return cv.toDataURL("image/png");
};
</script></body></html>`;
const page0 = `${SCR}/harness-${process.pid}.html`;
fs.writeFileSync(page0, html);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const pg = await b.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 1 });
const errs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(m.text()); });
await pg.goto("file://" + page0);
await pg.evaluate(() => window.setup());
for (const p of poses) {
  const url = await pg.evaluate((p) => window.renderPose(p), p);
  fs.writeFileSync(path.join(outDir, `${p.name}.png`), Buffer.from(url.split(",")[1], "base64"));
}
if (errs.length) console.log("page errors:", errs.slice(0, 5));
console.log("rendered", poses.length);
await b.close();
fs.rmSync(page0);
