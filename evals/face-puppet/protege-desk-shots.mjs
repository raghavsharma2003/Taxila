// Round 7 face-teachback-protege-staging in the REAL Kaksha lesson stage: App's teach-back desk fixtures
// (src/ui-v3/kaksha/dev/desk.html?class=1&fixture=teachback[-correct|-not_yet]) on a dev server of a tree with App
// patch 005 applied to StageBody (faceAt "stage" only).  node evals/face-puppet/protege-desk-shots.mjs <baseUrl> <outDir>
import { chromium } from "playwright";
import fs from "node:fs";
const [base, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const rows = [];
for (const fx of ["teachback", "teachback-correct", "teachback-not_yet"]) for (const vp of [{ w: 360, h: 800 }, { w: 1280, h: 800 }]) {
  const p = await b.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  await p.goto(`${base}/src/ui-v3/kaksha/dev/desk.html?class=1&fixture=${fx}&face=live`);
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => {
    const e = document.querySelector("[data-protege]"), f = document.querySelector('[data-testid="stage-face"]');
    const a = e?.getBoundingClientRect(), fr = f?.getBoundingClientRect();
    return { protege: e?.getAttribute("data-protege") ?? null, mood: e?.getAttribute("data-mood") ?? null, faceAt: f?.className ?? null,
      box: a ? [Math.round(a.x), Math.round(a.y), Math.round(a.width), Math.round(a.height)] : null, face: fr ? [Math.round(fr.x), Math.round(fr.y), Math.round(fr.width), Math.round(fr.height)] : null };
  });
  await p.screenshot({ path: `${out}/${fx}-${vp.w}.png` });
  rows.push({ fx, vw: vp.w, ...r });
  await p.close();
}
await b.close();
fs.writeFileSync(`${out}/rows.json`, JSON.stringify(rows, null, 1));
console.log(JSON.stringify(rows));
