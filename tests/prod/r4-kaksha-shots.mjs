// Kaksha rendered-page harness (BUILD-SPEC §11.1): shots + an in-page lint of every Kaksha state on the dev fixture page,
// at 360x800, 412x915 and 1366x768, night and dawn. Not part of `npm test` (it needs a browser and a vite dev server).
//   node tests/prod/r4-kaksha-shots.mjs            starts `vite` on :5199 itself, writes
//   docs/design/round4/build/kaksha/shots/*.webp and docs/design/round4/build/kaksha/lint.json; exit 1 on any finding.
// The in-page checks are the U1 lint (docs/design/round4/app/_src/lint.mjs): text >= 14 px, Devanagari >= 16 px,
// targets >= 44 px, no horizontal overflow, WCAG contrast against the composited background (gradients by every stop).
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { inPage, startVite } from "./r4-kaksha-inpage.mjs";
import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT = path.join(ROOT, "docs/design/round4/build/kaksha/shots");
const PORT = 5199;
const BASE = `http://localhost:${PORT}/src/ui-v3/kaksha/dev/index.html`;
const STATES = [
  ["home", "screen=home&state=start"], ["home-done", "screen=home&state=done"], ["home-resting", "screen=home&state=resting"],
  ["world", "screen=world"], ["world-yesterday", "screen=world&when=yesterday"], ["world-empty", "screen=world&world=empty"],
  ["world-settlement", "screen=world&view=settlement"], ["hangar", "screen=hangar"],
];
const VIEWS = [[360, 800], [412, 915], [1366, 768]];
const THEMES = ["night", "dawn"];

fs.mkdirSync(OUT, { recursive: true });
const stopVite = await startVite(ROOT, PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium" });
const report = []; const tot = { small: 0, deva: 0, targets: 0, contrast: 0, overflow: 0, unresolved: 0, texts: 0, pages: 0, errors: 0 };
try {
  for (const [w, h] of VIEWS) for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
    const p = await ctx.newPage();
    const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
    for (const [name, qs] of STATES) {
      await p.goto(`${BASE}?${qs}&theme=${theme}`);
      if (qs.includes("view=settlement")) await p.getByRole("radio", { name: "Settlement" }).click();
      await p.waitForTimeout(1800);
      const r = await p.evaluate(inPage);
      tot.pages++; tot.texts += r.texts; tot.overflow += r.overflow > 0 ? 1 : 0; tot.unresolved += r.unresolved;
      for (const k of ["small", "deva", "targets", "contrast"]) tot[k] += r[k].length;
      report.push({ view: `${w}x${h}`, theme, state: name, ...r });
      if (theme === "night" || w === 360) {
        const png = path.join(OUT, `${name}-${theme}__${w}x${h}.png`);
        await p.screenshot({ path: png });
        execFileSync("python3", ["-c", `from PIL import Image;Image.open('${png}').save('${png.replace(".png", ".webp")}','WEBP',quality=80,method=6)`]);
        fs.rmSync(png);
      }
    }
    tot.errors += errs.length; if (errs.length) console.log(`${w} ${theme} page errors:`, errs.slice(0, 3));
    await ctx.close();
  }
} finally { await browser.close(); stopVite(); }
fs.writeFileSync(path.join(ROOT, "docs/design/round4/build/kaksha/lint.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), method: "Playwright Chromium on the dev fixture page; 8 states x 3 viewports x 2 themes", totals: tot, pages: report }, null, 1));
console.log(JSON.stringify(tot));
const findings = tot.small + tot.deva + tot.targets + tot.contrast + tot.overflow;
process.exit(findings ? 1 : 0);
