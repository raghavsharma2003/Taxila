// Screenshots of /dev/avatar (dev server: `npx vite --port 5199`). Usage:
//   node evals/avatar/screenshots.mjs <base> <outDir/> '[{"name","url","w","h","click"?,"full"?}]'
import { chromium } from "playwright";
const OUT = process.argv[3] || "./";
const base = process.argv[2] || "http://localhost:5199";
const list = JSON.parse(process.argv[4]);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const s of list) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto(base + s.url);
  await page.waitForTimeout(s.wait ?? 2500);
  if (s.click) { await page.click(s.click); await page.waitForTimeout(1500); }
  await page.screenshot({ path: OUT + s.name + ".png", fullPage: !!s.full });
  const av = await page.evaluate(() => window.__avatar?.last ?? null);
  console.log(s.name, JSON.stringify(av?.ready ?? null), errs.slice(0, 3));
  await page.close();
}
await browser.close();
