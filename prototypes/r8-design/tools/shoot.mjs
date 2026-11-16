// Screenshots every screen of both directions at phone 360x740 (@2x) and desktop 1366x768 (@1x), and audits each:
// horizontal scroll, text under 14 px, running text under 16 px, touch targets under 44 px.
// Run: node prototypes/r8-design/tools/shoot.mjs [a-paper|b-night] [screen]
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const req = createRequire(import.meta.url);
let pw; try { pw = req("playwright"); } catch { pw = req(execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dirs = (process.argv[2] ? [process.argv[2]] : ["a-paper", "b-night"]);
const screens = process.argv[3] ? [process.argv[3]] : ["home", "lesson-board", "lesson-turn", "lesson-worked", "game", "parent", "onboarding", "offline"];
const vps = [
  { tag: "p360", width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { tag: "d1366", width: 1366, height: 768, deviceScaleFactor: 1 },
];
fs.mkdirSync(path.join(root, "shots"), { recursive: true });
const browser = await chromium.launch();
const report = [];
for (const dir of dirs) for (const vp of vps) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  const page = await ctx.newPage();
  for (const s of screens) {
    await page.goto(pathToFileURL(path.join(root, dir, s + ".html")).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2600);
    const audit = await page.evaluate(() => {
      const out = { hscroll: document.documentElement.scrollWidth > window.innerWidth + 0.5, scrollH: document.documentElement.scrollHeight, small: [], body: [], targets: [], missing: document.querySelectorAll('[data-c]').length && [...document.querySelectorAll('[data-c]')].filter(e => e.textContent.startsWith('[missing')).map(e => e.dataset.c) };
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.closest(".sr"); };
      for (const el of document.querySelectorAll("body *:not(svg):not(svg *)")) {
        const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (!own || !vis(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 14) out.small.push(el.tagName + "." + el.className + " " + fs);
        if (el.matches("p, li p, .caption, .lead") && fs < 16) out.body.push(el.className + " " + fs);
      }
      for (const el of document.querySelectorAll("a, button, label.opt, summary, .lang label")) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.height < 43.5 || r.width < 43.5) out.targets.push((el.textContent.trim().slice(0, 20) || el.getAttribute("aria-label")) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      // anything that overflows the viewport horizontally
      out.wide = [...document.querySelectorAll("body *")].filter(e => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 1 && vis(e) && !e.closest(".steer") && !e.closest("svg"); }).slice(0, 5).map(e => e.tagName + "." + (e.className.baseVal ?? e.className));
      return out;
    });
    const file = `${dir[0]}-${s}-${vp.tag}.png`;
    await page.screenshot({ path: path.join(root, "shots", file) });
    if (audit.scrollH > vp.height + 2) await page.screenshot({ path: path.join(root, "shots", file.replace(".png", "-full.png")), fullPage: true });
    report.push({ file, ...audit });
  }
  await ctx.close();
}
await browser.close();
for (const r of report) {
  const issues = [r.hscroll && "HSCROLL", r.small.length && "small:" + r.small.join("|"), r.body.length && "body<16:" + r.body.join("|"), r.targets.length && "targets:" + r.targets.join("|"), r.wide.length && "wide:" + r.wide.join("|"), r.missing.length && "missing:" + r.missing].filter(Boolean);
  console.log(r.file.padEnd(34), r.scrollH, issues.length ? issues.join("  ") : "ok");
}
