// G9 (TEACHER-VISUAL H7): the RENDERED skin must sit inside the look's Monk Skin Tone band, under the shipped shader
// and the stage light rig (shaders.js LIGHTING, Neutral tone mapping, exposure 1). Plus the mouth-interior luma check
// (review item 6: teeth L* <= 80 at jawOpen 0.3).
//
//   node scripts/character/g9.mjs --solve [--looks teal,slate,plum]   # closed loop: render -> measure -> rescale;
//                                                                     # writes skin.albedoGain into the look JSON
//   (gate mode is called from measure.mjs: g9Gate(look))
//
// Method: H tier, 600 x 750 canvas, the "face" camera, emotion `warm` at intensity 1 (the critique's sample), five
// patches (cheek L/R, forehead, jaw L/R) of 9 x 9 px projected from the rig's eye landmarks; per patch the per-channel
// median; patches averaged in linear light; CIE L*a*b* (D65). Bar: |L* - L*_MST| <= 3 and |C* - C*_MST| <= 4.
// Reference hexes: the published Monk Skin Tone scale (skintone.google).
import fs from "node:fs";
import { openHarness } from "./harness.mjs";

export const MST_HEX = { 1: "#f6ede4", 2: "#f3e7db", 3: "#f7ead0", 4: "#eadaba", 5: "#d7bd96", 6: "#a07e56", 7: "#825c43",
  8: "#604134", 9: "#3a312a", 10: "#292420" };
const s2l = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const hex2lin = (h) => [1, 3, 5].map((i) => s2l(parseInt(h.slice(i, i + 2), 16)));
export function lin2lab([r, g, b]) {
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const L = 116 * f(Y) - 16, a = 500 * (f(X) - f(Y)), bb = 200 * (f(Y) - f(Z));
  return { L: +L.toFixed(1), a: +a.toFixed(1), b: +bb.toFixed(1), C: +Math.hypot(a, bb).toFixed(1) };
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

async function sample(P, gain) {
  return P.evaluate((g) => { TX.setAlbedoGain(g); TX.frame("face", 0); TX.pose(TX.emotion("warm", 1)); return TX.samplePatches("skin"); }, gain);
}
function summarise(patches) {
  // a patch whose L* is > 15 from the patches' median is off the skin (background, hair, deep shadow): reported, not used
  const per = {}, acc = [0, 0, 0], lins = {};
  for (const [k, p] of Object.entries(patches)) {
    lins[k] = [0, 1, 2].map((c) => s2l(med(p.px.map((q) => q[c]))));
    per[k] = { at: [p.x, p.y], ...lin2lab(lins[k]) };
  }
  const mL = med(Object.values(per).map((x) => x.L));
  const used = Object.keys(per).filter((k) => Math.abs(per[k].L - mL) <= 15);
  for (const k of Object.keys(per)) per[k].used = used.includes(k);
  for (const k of used) for (let c = 0; c < 3; c++) acc[c] += lins[k][c] / used.length;
  return { per, lin: acc, lab: lin2lab(acc) };
}

export async function g9Gate(look, hx) {
  const L = JSON.parse(fs.readFileSync(`art/character/candidates/c4/looks/${look}.json`));
  const tgtLin = hex2lin(MST_HEX[L.skin.mst]), tgt = lin2lab(tgtLin);
  await hx.page.evaluate((l) => TX.load(l, "H"), look);
  const s = summarise(await sample(hx.page, [1, 1, 1]));
  const dL = +(s.lab.L - tgt.L).toFixed(1), dC = +(s.lab.C - tgt.C).toFixed(1);
  // interior: teeth L* at jawOpen 0.3, mouth camera, 5 x 5 px at the incisor landmark, 90th percentile
  const teeth = await hx.page.evaluate(() => { TX.frame("mouth", 0); TX.pose({ bs: { jawOpen: 0.3 } }); return TX.samplePatches("teeth").teeth; });
  const tL = teeth.px.map((q) => lin2lab(q.map(s2l)).L);
  const teethL = pct(tL, 0.9);
  return { mst: L.skin.mst, target: tgt, rendered: s.lab, patches: s.per, dL, dC, pass: Math.abs(dL) <= 3 && Math.abs(dC) <= 4,
    teethLp90AtJaw03: teethL, teethPass: teethL <= 80 };
}

async function solve(look) {
  const hx = await openHarness({ w: 600, h: 750 });
  try {
    const f = `art/character/candidates/c4/looks/${look}.json`;
    const L = JSON.parse(fs.readFileSync(f));
    const tgtLin = hex2lin(MST_HEX[L.skin.mst]), tgt = lin2lab(tgtLin);
    await hx.page.evaluate((l) => TX.load(l, "H"), look);
    let g = [1, 1, 1], s;
    const trace = [];
    // damped per-channel update (exponent 0.6): an undamped ratio overshot chroma back and forth; the gain kept is the
    // LAST MEASURED one, never an unmeasured extrapolation
    let best = null;
    for (let it = 0; it < 10; it++) {
      s = summarise(await sample(hx.page, g));
      const err = Math.abs(s.lab.L - tgt.L) / 3 + Math.abs(s.lab.C - tgt.C) / 4;
      trace.push({ gain: g.map((x) => +x.toFixed(4)), ...s.lab, err: +err.toFixed(3) });
      if (!best || err < best.err) best = { g: [...g], err };
      if (Math.abs(s.lab.L - tgt.L) < 0.8 && Math.abs(s.lab.C - tgt.C) < 1.2) break;
      g = g.map((x, c) => x * Math.max(0.5, Math.min(2.0, (tgtLin[c] / Math.max(s.lin[c], 1e-5)) ** 0.6)));
    }
    g = best.g;
    const old = L.skin.albedoGain || [1, 1, 1];
    L.skin.albedoGain = old.map((x, c) => +(x * g[c]).toFixed(4));
    fs.writeFileSync(f, JSON.stringify(L, null, 2) + "\n");
    console.log(`[g9] ${look} MST ${L.skin.mst} target L*${tgt.L} C*${tgt.C}; ${trace.map((t) => `L*${t.L} C*${t.C}`).join(" -> ")}; albedoGain ${JSON.stringify(L.skin.albedoGain)}`);
    return { look, target: tgt, trace, albedoGain: L.skin.albedoGain };
  } finally { await hx.close(); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const looks = (argv.includes("--looks") ? argv[argv.indexOf("--looks") + 1] : "teal,slate,plum").split(",");
  if (argv.includes("--solve")) {
    const out = [];
    for (const l of looks) out.push(await solve(l));
    fs.writeFileSync("art/character/candidates/c4/reports/g9-solve.json", JSON.stringify({ date: new Date().toISOString(), runs: out }, null, 1));
  } else {
    const hx = await openHarness({ w: 600, h: 750 });
    try { for (const l of looks) console.log(l, JSON.stringify(await g9Gate(l, hx))); } finally { await hx.close(); }
  }
}
