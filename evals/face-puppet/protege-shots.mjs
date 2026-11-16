// Round 7 face-teachback-protege-staging: the lesson <Teacher> with the young teach-back protégé, three moods, three
// creatures (/dev/avatar?protege=…, vite dev server). Also counts the "protege" gaze cues while she listens.
//   node evals/face-puppet/protege-shots.mjs <baseUrl> <outDir>
import { chromium } from "playwright";
import fs from "node:fs";
const [base = "http://127.0.0.1:5173", out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const rows = [];
for (const child of ["a", "b", "c"]) for (const mood of ["neutral", "happy", "puzzled"]) {
  const p = await b.newPage({ viewport: { width: Number(process.env.VW || 600), height: 520 }, deviceScaleFactor: 1 });
  await p.route("**/api/face/config*", (r) => r.fulfill({ json: { puppet2d: true, look: "r8" } }));
  await p.goto(`${base}/dev/avatar?protege=${mood}&child=${child}&status=listening&class=2&puppet=1`);
  await p.waitForTimeout(4500);
  const kind = await p.evaluate(() => document.querySelector("[data-protege]")?.getAttribute("data-protege"));
  await (await p.$('[data-testid="stage"]')).screenshot({ path: `${out}/${kind}-${mood}.png` });
  rows.push({ child, mood, kind });
  await p.close();
}
await b.close();
fs.writeFileSync(`${out}/rows.json`, JSON.stringify(rows));
console.log(JSON.stringify(rows));
