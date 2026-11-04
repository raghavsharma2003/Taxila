// Desk shots (r7 stream E, never shipped): the Kaksha lesson dev page (desk.html, fixture models, no server) at phone and
// laptop sizes. node src/child/dev/desk-shots.mjs --out <dir> [--fixtures your_turn,work-beat] [--sizes 360x800] [--class 6] [--extra "&desk=v2"]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("base", "http://localhost:5173");
const OUT = arg("out", "shots");
const CLS = arg("class", "6");
const EXTRA = arg("extra", "");
const FIX = arg("fixtures", "idle,speaking,your_turn,work-beat,work-board,work-skeleton,work-pad,work-tiles,work-play").split(",");
const SIZES = arg("sizes", "360x800,412x915,1280x800").split(",").map((s) => s.split("x").map(Number));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const [w, h] of SIZES) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  for (const f of FIX) {
    await page.goto(`${BASE}/src/child/dev/desk.html?class=${CLS}&fixture=${f}&face=plate${EXTRA}`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(700);
    const file = join(OUT, `${f}-c${CLS}-${w}x${h}.png`);
    await page.screenshot({ path: file });
    console.log(file, errs.length ? "ERR " + errs.splice(0).join(" | ") : "");
  }
  await page.close();
}
await browser.close();
