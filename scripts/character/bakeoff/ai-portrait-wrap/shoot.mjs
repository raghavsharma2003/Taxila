// Neutral renders of a look (rest pose, no keys) from the face camera at given yaws, plus a pick of 3D surface points
// under given pixels. Used for (a) the correspondence of MediaPipe landmarks to OUR mesh and (b) the likeness metric.
//   node shoot.mjs --look _base --yaws 0,20 --out dir [--pick lm.json]
import fs from "node:fs";
import path from "node:path";
import { openHarness } from "./fork/harness.mjs";
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const look = opt("--look", "_base"), out = opt("--out"), yaws = opt("--yaws", "0").split(",").map(Number), tier = opt("--tier", "H");
const smile = +opt("--smile", "0");
fs.mkdirSync(out, { recursive: true });
const hx = await openHarness({ w: 600, h: 750 });
try {
  await hx.page.evaluate(([l, t]) => TX.load(l, t), [look, tier]);
  const info = {};
  for (const y of yaws) {
    await hx.page.evaluate(([yy, s]) => { TX.frame("face", yy); TX.pose({ bs: s ? { mouthSmileLeft: s, mouthSmileRight: s, cheekSquintLeft: s * 0.5, cheekSquintRight: s * 0.5 } : {} }); TX.render(); }, [y, smile]);
    const f = path.join(out, `${look}_yaw${y}${smile ? "_smile" : ""}.png`);
    await hx.shot(f);
    info[`yaw${y}`] = await hx.page.evaluate(() => TX.cameraInfo());
  }
  const pick = opt("--pick");
  if (pick) {
    const lm = JSON.parse(fs.readFileSync(pick));
    const res = {};
    for (const [k, v] of Object.entries(lm)) {
      if (!v) continue;
      const y = +k.match(/yaw(-?\d+)/)[1];
      await hx.page.evaluate((yy) => TX.frame("face", yy), y);
      res[k] = await hx.page.evaluate((p) => TX.pick(p), v.lm.map((q) => [q[0], q[1]]));
    }
    fs.writeFileSync(path.join(out, `${look}_pick.json`), JSON.stringify(res));
  }
  fs.writeFileSync(path.join(out, `${look}_camera.json`), JSON.stringify(info, null, 1));
} finally { if (hx.errors.length) console.log(hx.errors.slice(0, 5).join("\n")); await hx.close(); }
