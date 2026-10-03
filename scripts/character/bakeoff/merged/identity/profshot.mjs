// Neutral profile render of a look (the profile camera, yaw +90: nose to the image's right) plus the camera numbers
// profilefit.py needs: the eye centre's image row and pixels per metre at the head's midsagittal plane.
//   node profshot.mjs --look teal --out dir
import fs from "node:fs";
import path from "node:path";
import { openHarness } from "../harness.mjs";
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const look = opt("--look", "teal"), out = opt("--out");
fs.mkdirSync(out, { recursive: true });
const hx = await openHarness({ w: 600, h: 750 });
try {
  await hx.page.evaluate((l) => TX.load(l, "H"), look);
  const info = await hx.page.evaluate(() => {
    TX.frame("profile", 90); TX.pose({ bs: {} }); TX.render();
    const T = TX.THREE, rig = TX.rig, c = TX.cameraInfo();
    const cam = new T.PerspectiveCamera(); // reconstruct from cameraInfo
    cam.position.fromArray(c.pos); cam.quaternion.fromArray(c.quat); cam.fov = c.fov; cam.aspect = c.aspect; cam.near = 0.05; cam.far = 20;
    cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    const pivot = rig.root.parent;
    const proj = (v) => { const w = v.clone(); pivot.localToWorld(w); const d = w.distanceTo(cam.position); w.project(cam); return { x: (w.x * 0.5 + 0.5) * c.W, y: (1 - (w.y * 0.5 + 0.5)) * c.H, d }; };
    const e = rig.landmarks.eyeL.clone().add(rig.landmarks.eyeR).multiplyScalar(0.5);
    const pe = proj(e);
    const pe2 = proj(e.clone().add(new T.Vector3(0, -0.05, 0)));       // 5 cm below the eyes, same plane
    return { eyeRow: pe.y, eyeWorldY: e.y, pxPerM: (pe2.y - pe.y) / 0.05, camDist: pe.d, W: c.W, H: c.H };
  });
  await hx.shot(path.join(out, `${look}_profile.png`));
  fs.writeFileSync(path.join(out, `${look}_profile.json`), JSON.stringify(info, null, 1));
  console.log(JSON.stringify(info));
} finally { if (hx.errors.length) console.log(hx.errors.slice(0, 5).join("\n")); await hx.close(); }
