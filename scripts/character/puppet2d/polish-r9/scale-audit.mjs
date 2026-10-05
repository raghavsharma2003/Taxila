// r8 feature-scale lock audit (judge r7 fix 5): eye-white OPENING area x the head scale (lean) per expression take,
// relative to rest. Gate: <= 1.03 except surprise.   node scripts/character/puppet2d/polish-r9/scale-audit.mjs
import fs from "node:fs";
import { serve, open } from "./shoot.mjs";
const srv = await serve();
const { browser, page } = await open(srv, "capture=1&px=720");
const out = await page.evaluate(() => {
  const P = window.P2D, r = P.rig, res = {};
  const area = () => { let a = 0, a0 = 0; for (const k of ["L", "R"]) { const E = r.eyes[k]; for (let i = 0; i < E.top.length; i++) { a += Math.max(0, E.bot[i] - E.top[i]); a0 += E.e.bot[i] - E.e.top[i]; } } return a / a0; };
  P.pose({ bs: { mouthSmileLeft: 0.05, mouthSmileRight: 0.05 } });
  const restA = area(), restS = r.st.leanS;
  for (const [name, V] of Object.entries(P.VARIANTS)) for (let v = 0; v < V.length; v++) {
    P.pose({ expr: name, variant: v, bs: { mouthSmileLeft: 0.05, mouthSmileRight: 0.05 } });
    const a = area() / restA, s = r.st.leanS / restS;
    res[`${name}_${v}`] = { opening: +a.toFixed(3), scale: +s.toFixed(4), whites: +(a * s * s).toFixed(3) };
  }
  return res;
});
let fail = 0;
for (const [k, v] of Object.entries(out)) { v.pass = k.startsWith("surprise") || v.whites <= 1.03; if (!v.pass) fail++; }
console.log(JSON.stringify(out, null, 0).replace(/\},/g, "},\n"));
console.log("fail", fail);
fs.writeFileSync("art/character/puppet2d/polish-r9/work/scale-audit.json", JSON.stringify({ out, fail }, null, 1));
await browser.close(); srv.close();
