// c2 iteration probe: render named poses at a camera. node probe.mjs <out> <json [[name, frame, yaw, bs], ...]> [tier]
import fs from "node:fs";
import path from "node:path";
import { openHarness } from "./harness.mjs";
const [out, spec, tier = "H"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const hx = await openHarness({ w: 600, h: 750 });
try {
  await hx.page.evaluate((t) => TX.load("c2", t), tier);
  for (const [n, fr, yaw, bs, emo, hide] of JSON.parse(spec)) {
    await hx.page.evaluate(([fr, yaw, bs, emo, hide]) => { for (const [k, m] of Object.entries(TX.rig.meshes)) m.visible = !(hide || []).includes(k); TX.frame(fr, yaw); const p = emo ? TX.emotion(emo, 1) : { bs: {} }; Object.assign(p.bs, bs); TX.pose(p); TX.render(); }, [fr, yaw, bs, emo, hide]);
    await hx.shot(path.join(out, `${n}.png`));
  }
} finally { if (hx.errors.length) console.log(hx.errors.slice(0, 8).join("\n")); await hx.close(); }
