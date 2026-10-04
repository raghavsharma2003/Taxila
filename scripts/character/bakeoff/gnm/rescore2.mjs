// gnm round 2: render explicit preset VARIANTS (a JSON {variant: {emotion, bs, head, gaze, lean}}) at the face camera,
// into <out>/<variant>/<look>/emotions/<emotion>.png (look = argv[4], default teal), for emotion-check.mjs --root (judge A screens, judge C confirms).
//   node rescore2.mjs <variants.json> <outDir>
import fs from "node:fs";
import path from "node:path";
import { openHarness } from "./harness.mjs";
const [vf, out, lk = "teal"] = process.argv.slice(2);
const V = JSON.parse(fs.readFileSync(vf));
const hx = await openHarness({ w: 600, h: 750 });
try {
  await hx.page.evaluate((l) => TX.load(l, "H"), lk);
  for (const [name, p] of Object.entries(V)) {
    const d = path.join(out, name, lk, "emotions");
    fs.mkdirSync(d, { recursive: true });
    await hx.page.evaluate((q) => { TX.frame("face", 0); TX.pose({ bs: q.bs, head: q.head || [0, 0, 0], gaze: q.gaze || [0, 0], lean: q.lean || 0 }); TX.render(); }, p);
    await hx.shot(path.join(d, `${p.emotion}.png`));
  }
} finally { await hx.close(); }
