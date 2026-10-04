// Zero-visible-failure check for engine + generated spec (STUDIO-V2 §8).
//   node prototypes/reset/studio/tools/spec-fuzz.mjs [n-per-exemplar]
// For each exemplar, serves the page with a MUTATED spec (what a bad model output looks like: dropped fields, wrong
// types, out-of-range numbers, unequal "equal" pairs, unknown verbs/predicates, markup in strings, truncated JSON,
// empty object) and checks what the child would see: no page error, the artifact paints a non-blank stage within
// 3 s, Studio.ready fires, and the engine reports what it repaired. Also runs the moon terminator exactness check.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../../../../node_modules/playwright/index.mjs";
import { serve } from "./serve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const N = +(process.argv[2] || 30);
let seed = 20261004;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

const JUNK = [null, -1, 0, 1e9, "", "<script>alert(1)</script>", "{{x}}", [], {}, true, "NaN", "9/0", "1 5/4", "13/14", "-3/4", "abc", "x".repeat(300)];
function mutate(spec, key) {
  const s = JSON.parse(JSON.stringify(spec));
  const ops = [];
  const n = 1 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const kind = pick(["junkLeaf", "dropKey", "junkLeaf", "arrayChaos", "strings", "wholesale"]);
    if (kind === "wholesale") { const w = pick(["{}", "[]", "truncated", "null-fields"]); ops.push("wholesale:" + w); if (w === "{}") return { text: "{}", ops }; if (w === "[]") return { text: "[]", ops }; if (w === "truncated") { const t = JSON.stringify(spec); return { text: t.slice(0, Math.floor(t.length * (0.2 + rnd() * 0.6))), ops }; } for (const k of Object.keys(s)) s[k] = null; continue; }
    // walk to a random leaf/container
    let node = s, parent = null, pkey = null, depth = 0;
    while (node && typeof node === "object" && depth < 6 && rnd() < 0.8) {
      const keys = Object.keys(node); if (!keys.length) break;
      pkey = pick(keys); parent = node; node = node[pkey]; depth++;
    }
    if (!parent) continue;
    if (kind === "junkLeaf") { parent[pkey] = pick(JUNK); ops.push(`junk:${pkey}`); }
    else if (kind === "dropKey") { delete parent[pkey]; ops.push(`drop:${pkey}`); }
    else if (kind === "arrayChaos" && Array.isArray(node)) { node.push(pick(JUNK)); if (node.length > 1) node.splice(Math.floor(rnd() * node.length), 1); node.reverse(); ops.push(`array:${pkey}`); }
    else if (kind === "strings" && s.strings) { const k = pick(Object.keys(s.strings)); s.strings[k] = pick(["<b>hi</b>", "x".repeat(120), "{name}", 42]); ops.push(`string:${k}`); }
  }
  // archetype-specific semantic poison
  if (key === "landfall" && Array.isArray(s.waves) && s.waves[0] && rnd() < 0.5) { s.waves[0].items = [["1/2", "2/3"], "5/4", "7/0"]; ops.push("semantic:unequal-pair+out-of-range+div0"); }
  if (key === "circuit" && Array.isArray(s.steps) && s.steps[0] && rnd() < 0.5) { s.steps[0].check = { glowsGreen: true }; s.steps[0].preset = [{ at: "9,9-1,1", put: "reactor" }]; ops.push("semantic:unknown-predicate+bad-edge"); }
  if (key === "moon" && Array.isArray(s.beats) && s.beats[3] && rnd() < 0.5) { s.beats[3].cues = [{ at: "s9", do: "explode", target: "sun" }, { at: 0, do: "orbit", to: "far" }]; ops.push("semantic:unknown-verb+nan-angle"); }
  return { text: JSON.stringify(s), ops };
}

const EX = [
  { key: "landfall", rel: "01-landfall/", q: "" },
  { key: "circuit", rel: "02-circuit-lab/", q: "" },
  { key: "moon", rel: "03-moon-phases/", q: "&autoplay=1&t=30" },
];
const { server, port } = await serve(0);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();
const results = { date: new Date().toISOString(), nPerExemplar: N, method: "route-served HTML with the #spec JSON replaced by a mutation; checks: pageerror/console error, Studio.ready <= 3 s, non-blank canvas (luma stdev of a 64x40 downsample > 6), engine repair report", exemplars: {} };
for (const ex of EX) {
  const html = fs.readFileSync(path.join(root, ex.rel, "index.html"), "utf8");
  const m = html.match(/<script type="application\/json" id="spec">([\s\S]*?)<\/script>/);
  const spec = JSON.parse(m[1]);
  const rows = [];
  for (let i = 0; i < N; i++) {
    const mut = i === 0 ? { text: m[1], ops: ["control:unmutated"] } : mutate(spec, ex.key);
    const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
    const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    page.on("console", (c) => { if (c.type() === "error") errs.push(c.text()); });
    // match the page URL by pathname (the query string carries ?seed=); every other request passes through
    let served = false;
    await page.route((u) => u.pathname === `/studio/${ex.rel}`, (route) => { served = true; return route.fulfill({ contentType: "text/html", body: html.replace(m[1], () => mut.text) }); });
    await page.goto(`${base}/studio/${ex.rel}?seed=${i}${ex.q}`);
    let ready = false;
    try { await page.waitForFunction(() => document.documentElement.dataset.ready === "1", null, { timeout: 3000 }); ready = true; } catch (e) { /* recorded below */ }
    await page.waitForTimeout(1600);
    const probe = await page.evaluate(() => {
      const c = document.querySelector("#stage canvas");
      const t = document.createElement("canvas"); t.width = 64; t.height = 40;
      const g = t.getContext("2d"); g.drawImage(c, 0, 0, 64, 40);
      const d = g.getImageData(0, 0, 64, 40).data; let s = 0, s2 = 0, n = 0;
      for (let k = 0; k < d.length; k += 4) { const y = 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]; s += y; s2 += y * y; n++; }
      const mean = s / n;
      const seam = window.__studio && window.__studio.seam ? window.__studio.seam() : null;
      const rep = (window.__studioLog || []).find((x) => x.k === "event" && x.name === "spec_repaired");
      const unp = (window.__studioLog || []).some((x) => x.k === "event" && x.name === "spec_unparseable");
      return { stdev: Math.sqrt(Math.max(0, s2 / n - mean * mean)), repairs: rep ? rep.data.repairs.length : 0, fallback: rep ? rep.data.repairs.includes("fallback-default") : false, unparseable: unp, state: seam && (seam.state || seam.step) };
    });
    if (!served) throw new Error("mutated page was not served: the fuzz would test the control page");
    const visibleFailure = errs.length > 0 || !ready || probe.stdev <= 6;
    rows.push({ i, ops: mut.ops, ready, errs: errs.slice(0, 2), stdev: +probe.stdev.toFixed(1), repairs: probe.repairs, fallback: probe.fallback, unparseable: probe.unparseable, state: probe.state, visibleFailure });
    await page.close();
  }
  const vf = rows.filter((r) => r.visibleFailure).length;
  results.exemplars[ex.key] = { n: rows.length, visibleFailures: vf, repaired: rows.filter((r) => r.repairs > 0).length, defaultFallbacks: rows.filter((r) => r.fallback).length, unparseable: rows.filter((r) => r.unparseable).length, rows };
  console.log(ex.key, `visible failures ${vf}/${rows.length}`, `repaired ${results.exemplars[ex.key].repaired}`, `default-fallback ${results.exemplars[ex.key].defaultFallbacks}`);
}

// Terminator exactness (animation G6): rendered lit fraction of the phase disc vs (1 - cos E) / 2, E = 0..360 step 7.5
{
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  await page.goto(`${base}/studio/03-moon-phases/?autoplay=1&sound=off`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === "1");
  const tf = await page.evaluate(() => {
    const out = [];
    for (let E = 0; E <= 360; E += 7.5) out.push({ E, ...window.__moonTest.pixelCheck(E) });
    return out;
  });
  // (a) pixel agreement with the exact terminator; (b) lit fraction vs the analytic (1 - cos E)/2 of the full disc
  // (the probe region is the r=97 core, so (b) carries a small geometric bias; (a) is the exact test);
  // (c) side: waxing (0 < E < 180) lit on the right, as seen from the northern hemisphere (India)
  const fracErr = tf.map((r) => Math.abs(r.f - (1 - Math.cos(r.E * Math.PI / 180)) / 2));
  const sideRows = tf.filter((r) => (r.E >= 15 && r.E <= 135) || (r.E >= 225 && r.E <= 345));   // near-full gibbous discs are nearly symmetric by design
  const sideOk = sideRows.every((r) => (r.E < 180 ? r.side === "right" : r.side === "left"));
  results.terminator = { n: tf.length, maxPixelDisagree: Math.max(...tf.map((r) => r.disagree)), maxAbsFracErrVsAnalytic: +Math.max(...fracErr).toFixed(4), meanAbsFracErrVsAnalytic: +(fracErr.reduce((x, y) => x + y, 0) / fracErr.length).toFixed(4), maxAbsFracErrVsExactMask: +Math.max(...tf.map((r) => Math.abs(r.f - r.fExpected))).toFixed(4), sideRows: sideRows.length, waxingLitOnRight: sideOk, sideFailures: sideRows.filter((r) => (r.E < 180 ? r.side !== "right" : r.side !== "left")).map((r) => [r.E, r.side]), method: "offscreen 220 px canvas, R=100 disc, pixels inside r=97 classified lit if luma > 128, compared to the exact projected-hemisphere mask (pixels within 1.5 px of the terminator or centre line excluded); E = 0..360 step 7.5" };
  console.log("terminator", JSON.stringify(results.terminator));
  await page.close();
}
await browser.close(); server.close();
fs.writeFileSync(path.join(root, "recordings", "spec-fuzz.json"), JSON.stringify(results, null, 1));
console.log("wrote recordings/spec-fuzz.json");
