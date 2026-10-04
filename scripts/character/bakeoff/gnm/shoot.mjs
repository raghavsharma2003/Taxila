// gnm: neutral renders of a row's teal head at given yaws + the 3D surface point under each MediaPipe landmark pixel
// (TX.pick, rest pose). Used (a) on procedural-v3's GLB, for the v3 <-> GNM correspondence that carries v3's key shapes
// to GNM as solve targets, and (b) on the gnm GLB, for the likeness metric.
//   node shoot.mjs --row procedural-v3 --yaws 0,20 --out dir [--pick lm.json]   (lm.json keys: <row>_yaw<deg>)
import fs from "node:fs";
import path from "node:path";
import { openHarness } from "./harness.mjs";
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const frameName = opt("--frame", "face");
const lookId = opt("--look", "teal");
const row = opt("--row", "gnm"), out = opt("--out"), yaws = opt("--yaws", "0").split(",").map(Number), tier = opt("--tier", "H");
fs.mkdirSync(out, { recursive: true });
const tag = row.replace(/[^a-zA-Z0-9-]/g, "_");
const hx = await openHarness({ w: 600, h: 750 });
try {
  await hx.page.evaluate(([l, t, r]) => TX.load(l, t, r), [lookId, tier, row]);
  const info = {};
  for (const y of yaws) {
    await hx.page.evaluate(([yy, f]) => { TX.frame(f, yy); TX.pose({ bs: {} }); TX.render(); }, [y, frameName]);
    await hx.shot(path.join(out, `${tag}_yaw${y}.png`));
    info[`yaw${y}`] = await hx.page.evaluate(() => TX.cameraInfo());
  }
  const pick = opt("--pick");
  if (pick) {
    const lm = JSON.parse(fs.readFileSync(pick));
    const res = {};
    for (const [k, v] of Object.entries(lm)) {
      if (!v || !k.startsWith(tag)) continue;
      const y = +k.match(/yaw(-?\d+)/)[1];
      await hx.page.evaluate(([yy, f]) => TX.frame(f, yy), [y, frameName]);
      res[k] = await hx.page.evaluate((p) => TX.pick(p), v.lm.map((q) => [q[0], q[1]]));
    }
    fs.writeFileSync(path.join(out, `${tag}_pick.json`), JSON.stringify(res));
  }
  fs.writeFileSync(path.join(out, `${tag}_camera.json`), JSON.stringify(info, null, 1));
} finally { if (hx.errors.length) console.log(hx.errors.slice(0, 5).join("\n")); await hx.close(); }
