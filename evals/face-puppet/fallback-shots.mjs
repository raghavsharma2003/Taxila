// Round 7 face-r8-fallback-swaps-person evidence: the lesson's face (<LessonFace>, /dev/avatar?via=lesson) under every
// forced failure, one screenshot each, so the owner can see she is the same person on every path.
//   node evals/face-puppet/fallback-shots.mjs <baseUrl> <outDir> [label]
// baseUrl: a vite dev server (dev routes on). Scenarios: live · puppet off on the device (?puppet=0) · no WebGL2 ·
// the server's kill switch (TAXILA_FACE_PUPPET2D=0) · the pack fails to load (timeout / 404).
import { chromium } from "playwright";
import fs from "node:fs";

const [base = "http://127.0.0.1:5173", out = "evals/face-puppet/out/r7-fallback", label = "after"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const NO_WEBGL2 = () => {
  delete window.WebGL2RenderingContext;
  const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (k, ...a) { return /webgl/.test(String(k)) ? null : get.call(this, k, ...a); };
};
const SCEN = [
  { id: "1-live", q: "" },
  { id: "2-puppet-off", q: "&puppet=0" },
  { id: "3-no-webgl2", q: "", init: NO_WEBGL2 },
  { id: "4-kill-switch", q: "", kill: true },
  { id: "5-pack-fails", q: "", breakPack: true },
];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const rows = [];
for (const s of SCEN) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 560 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  if (s.init) await page.addInitScript(s.init);
  await page.route("**/api/face/config*", (r) => r.fulfill({ json: { puppet2d: !s.kill, look: "r8" } }));
  if (s.breakPack) await page.route("**/face-puppet/r8/geom.json", (r) => r.abort());
  await page.goto(`${base}/dev/avatar?via=lesson&tutor=asha&class=6&status=your_turn${s.q}`);
  await page.waitForTimeout(6000);
  const info = await page.evaluate(() => {
    const h = document.querySelector("[data-face]");
    return { face: h?.getAttribute("data-face") ?? null, phase: h?.getAttribute("data-phase") ?? null, look: h?.getAttribute("data-look") ?? null,
      canvas: !!document.querySelector("[data-face] canvas"), plate: !!document.querySelector(".tf-plate, [data-face='plate'], svg.plate2d") };
  });
  const el = (await page.$("[data-face]")) ?? page;
  await el.screenshot({ path: `${out}/${label}-${s.id}.png` });
  rows.push({ scenario: s.id, ...info });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/${label}.json`, JSON.stringify(rows, null, 2));
console.table(rows);
