// r8: where do the interior features land on a turn? Projects rest points through the live rig at yaw +-20 (and 12).
//   node scripts/character/puppet2d/polish-r8/probe-turn.mjs
import { serve, open } from "./shoot.mjs";
const srv = await serve();
const { browser, page } = await open(srv, "capture=1&px=720");
const out = await page.evaluate(() => {
  const P = window.P2D, r = P.rig, res = { keyDeg: r.g.yawKeys.keyDeg };
  const pts = { farOutlineR: [738, 560], farOutlineL: [322, 560], noseTip: [530, 540], nostrilL: [505, 548], nostrilR: [556, 548], bindi: [528, 392], mouthC: [530, 606], mouthL: [466, 600], mouthR: [596, 600], eyeLin: [470, 470], eyeLout: [380, 470], eyeRin: [590, 470], eyeRout: [680, 470], chin: [530, 715] };
  for (const yaw of [-20, -12, 12, 20]) {
    P.pose({ bs: {}, head: [0, yaw, 0] });
    const row = {};
    for (const [k, [x, y]] of Object.entries(pts)) { const p = r.project(x, y, 0); row[k] = [+(p[0] - x).toFixed(1), +(p[1] - y).toFixed(1)]; }
    row.eyeFix = r.eyeFix;
    res[yaw] = row;
  }
  return res;
});
console.log(JSON.stringify(out, null, 1));
await browser.close(); srv.close();
