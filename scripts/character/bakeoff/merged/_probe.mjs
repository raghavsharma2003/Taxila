import { openHarness } from "./harness.mjs";
const hx = await openHarness({ w: 400, h: 500 });
await hx.page.evaluate(() => TX.load("teal", "H"));
const poses = JSON.parse(process.argv[2]);
for (const [name, bs] of Object.entries(poses)) {
  const r = await hx.page.evaluate((bs) => {
    TX.frame("face", 0); TX.pose({ bs }); TX.render();
    const m = TX.rig.meshes.face, g = m.geometry, P = g.attributes.position, R = g.attributes._region;
    const MA = g.morphAttributes.position, inf = m.morphTargetInfluences, rel = g.morphTargetsRelative;
    m.updateMatrixWorld(); const e = m.matrixWorld.elements;
    const out = []; const n = P.count;
    const act = inf.map((w, i) => [w, i]).filter(([w]) => Math.abs(w) > 1e-4);
    const W = (x, y, z) => [e[0]*x+e[4]*y+e[8]*z+e[12], e[1]*x+e[5]*y+e[9]*z+e[13], e[2]*x+e[6]*y+e[10]*z+e[14]];
    const pts = [];
    for (let i = 0; i < n; i++) {
      let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      for (const [w, k] of act) { x += w * MA[k].getX(i); y += w * MA[k].getY(i); z += w * MA[k].getZ(i); }
      const q = W(x, y, z), reg = Math.round(R ? R.getX(i) : 0);
      if (Math.abs(q[0]) > 0.004) continue;
      pts.push([i, reg, +q[1].toFixed(5), +q[2].toFixed(5)]);
    }
    return pts;

  }, bs);
  (await import("node:fs")).writeFileSync(`/tmp/claude-0/char/bakeoff-merged/probe_${name}.json`, JSON.stringify(r));
}
await hx.close();
