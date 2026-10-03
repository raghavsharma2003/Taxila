// gnm: quick stills from the evidence viewer.  node peek.mjs <outPrefix> "frame:yaw:kind:name" ...  (kind e = emotion, s = state, b = blendshapes "k=v,k=v")
import { openHarness } from "./harness.mjs";
const [out, ...poses] = process.argv.slice(2);
const hx = await openHarness({ w: 600, h: 750 });
try {
  const st = await hx.page.evaluate(() => TX.load("teal", "H"));
  console.log(JSON.stringify(st));
  let i = 0;
  for (const p of poses) {
    const [frame, yaw, kind, name] = p.split(":");
    await hx.page.evaluate(([f, y, k, n]) => { TX.frame(f, +y); TX.pose(k === "e" ? TX.emotion(n, 1) : k === "s" ? TX.state(n) : { bs: n ? Object.fromEntries(n.split(",").map((x) => { const [a, b] = x.split("="); return [a, +(b ?? 1)]; })) : {} }); TX.render(); }, [frame, yaw, kind, name]);
    await hx.shot(`${out}_${i++}.png`);
  }
} finally { if (hx.errors.length) console.log(hx.errors.slice(0, 8).join("\n")); await hx.close(); }
