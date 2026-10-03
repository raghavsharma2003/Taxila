// FPS and draw calls per tier in headless Chromium. SOFTWARE GL (ANGLE SwiftShader on the container's CPU): these are
// relative CPU-rasteriser numbers, not phone numbers (TEACHER-VISUAL §3 method; the device lab, E-T2, is still owed).
// Each tier runs at its own runtime knobs: H 0.49 Mpx + MSAA, B+ 0.22 Mpx + MSAA, B-lite 0.14 Mpx without MSAA.
// n = 3 reps x 90 uncapped frames, animated (jaw, smile, blinks, head, gaze), each frame followed by a 1-px readPixels.
//   node scripts/character/measure.mjs [--looks teal,slate,plum] [--out docs/design/teacher/bakeoff/procedural-v3/renders/measure-<date>.json]
import fs from "node:fs";
import os from "node:os";
import { openHarness } from "./harness.mjs";
import { g9Gate } from "./g9.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const LOOKS = opt("--looks", "teal,slate,plum").split(",");
const OUT = opt("--out", `docs/design/teacher/bakeoff/procedural-v3/renders/measure-${new Date().toISOString().slice(0, 10)}.json`);
const ARMS = [
  { tier: "H", w: 540, h: 900, msaa: 1 },
  { tier: "Bplus", w: 360, h: 610, msaa: 1 },
  { tier: "Blite", w: 360, h: 400, msaa: 0 },
];
const res = { method: "headless Chromium, ANGLE SwiftShader (software WebGL2), " + os.cpus().length + " vCPU; 3 reps x 90 uncapped animated frames + 1-px readPixels each; ms/frame p50",
  date: new Date().toISOString(), loadavgStart: os.loadavg(), rows: [] };
for (const look of LOOKS) {
  for (const a of ARMS) {
    const hx = await openHarness({ w: a.w, h: a.h, msaa: a.msaa });
    try {
      const st = await hx.page.evaluate(([l, t]) => TX.load(l, t), [look, a.tier]);
      await hx.page.evaluate(() => { TX.frame("bust", 0); TX.measure(10); });
      const reps = [];
      for (let r = 0; r < 3; r++) reps.push(await hx.page.evaluate(() => TX.measure(90)));
      const p50s = reps.map((x) => +x.p50.toFixed(1));
      const med = [...p50s].sort((x, y) => x - y)[1];
      const row = { look, tier: a.tier, canvas: `${a.w}x${a.h}`, mpx: +(a.w * a.h / 1e6).toFixed(3), msaa: !!a.msaa,
        draws: reps[0].calls, triangles: reps[0].triangles, morphTargets: st.morphTargets, loadMs: Math.round(st.loadMs),
        msP50reps: p50s, fpsUncapped: +(1000 / med).toFixed(1), gpu: reps[0].gpu };
      res.rows.push(row);
      console.log(`[measure] ${look} ${a.tier} ${row.canvas} draws=${row.draws} tris=${row.triangles} p50=${p50s.join("/")} ms -> ${row.fpsUncapped} fps (software GL)`);
    } finally { await hx.close(); }
  }
}
// G9 rendered-skin gate + mouth-interior luma (g9.mjs): fails loudly, and is written next to the FPS rows
res.g9 = {};
{
  const hx = await openHarness({ w: 600, h: 750 });
  try {
    for (const look of LOOKS) {
      const g = await g9Gate(look, hx);
      res.g9[look] = g;
      console.log(`[measure] G9 ${look} MST ${g.mst}: rendered L*${g.rendered.L} C*${g.rendered.C} vs L*${g.target.L} C*${g.target.C} (dL ${g.dL}, dC ${g.dC}) -> ${g.pass ? "PASS" : "FAIL"}; teeth L* p90 ${g.teethLp90AtJaw03} -> ${g.teethPass ? "PASS" : "FAIL"}`);
    }
  } finally { await hx.close(); }
}
res.loadavgEnd = os.loadavg();
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(`wrote ${OUT}`);
