import { openHarness } from "./harness.mjs";
const hx = await openHarness({ w: 900, h: 1100 });
await hx.page.evaluate(() => TX.load("teal", "H"));
for (const [nm, vis] of [["real", ["face"]], ["all", null]]) for (const y of [0, 30]) {
  await hx.page.evaluate(([y, vis]) => { for (const [n, o] of Object.entries(TX.rig.meshes)) o.visible = !vis || vis.includes(n); TX.frame("face", y); TX.pose({ bs: {} }); TX.render(); }, [y, vis]);
  await hx.shot(`/tmp/claude-0/char/bakeoff-merged/uv_${nm}_${y}.png`);
}
await hx.close();
