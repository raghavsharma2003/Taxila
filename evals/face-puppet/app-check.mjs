// The patched app (patch 03 applied in a scratch copy, served by vite dev) with the lesson Desk dev fixture: does the
// lesson tile show the 2D puppet, live, with the AI disclosure?  node evals/face-puppet/app-check.mjs <baseUrl> <outPrefix>
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:5299";
const out = process.argv[3] || "evals/face-puppet/out/app";
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const res = {};
for (const [name, q] of [["desk-live-b2", "face=live&band=b2&fixture=speaking"], ["desk-plate-b2", "band=b2&fixture=your_turn"], ["desk-live-b3-arjun", "face=live&band=b3&fixture=speaking"]]) {
  const p = await b.newPage({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`${base}/dev/desk?${q}`, { waitUntil: "load" });
  await p.waitForTimeout(9000);
  const info = await p.evaluate(() => {
    const h = document.querySelector("[data-face='puppet2d']");
    return { puppet: !!h, phase: h?.getAttribute("data-phase") ?? null, label: h?.getAttribute("aria-label") ?? null, canvas: !!document.querySelector(".fp-canvas"), tutorFace: !!document.querySelector(".tx-tutorface"), aiLabel: document.querySelector("[data-ai-label]")?.textContent ?? null };
  });
  await p.screenshot({ path: `${out}-${name}.png` });
  res[name] = { ...info, errors: errs.slice(0, 3) };
  await p.close();
}
console.log(JSON.stringify(res, null, 1));
await b.close();
