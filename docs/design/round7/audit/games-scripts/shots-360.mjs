// Games audit: what a child sees at 360x640. Mounts every coverage family/mode/goal in the play dev harness (same generator and
// picker as the server, 2D renderer) and measures: sideways overflow, touch targets under 44 px, readable text under 14 px (16 for
// class 4-5), controls cut off by the screen edge. Needs the dev harness up:
//   npx vite --config src/play/dev/vite.play.config.mjs --port 5199 --host 127.0.0.1 &
//   node docs/design/round7/audit/games-scripts/shots-360.mjs [--json out.json] [--shots dir] [family ...]
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const args = process.argv.slice(2); const opt = (k) => { const i = args.indexOf(k); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const jsonOut = opt("--json"), shotDir = opt("--shots"); if (shotDir) mkdirSync(shotDir, { recursive: true });
const cov = JSON.parse(readFileSync(new URL("../../../../../data/play/coverage.json", import.meta.url), "utf8"));
const seen = new Set(), list = [];
for (const e of cov.entries) { const k = `${e.family}/${e.mode}/${e.goal}`; if (e.family === "arena" && list.some((x) => x.family === "arena")) continue; if (seen.has(k)) continue; if (args.length && !args.includes(e.family)) continue; seen.add(k); list.push(e); }
const browser = await chromium.launch();
const out = [];
for (const e of list) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (x) => errs.push(String(x.message).slice(0, 120)));
  const q = new URLSearchParams({ family: e.family, mode: e.mode, goal: e.goal, class: String(e.classLevel), topic: e.topicId, skill: e.skillId, engine: "2d", lang: "hinglish", fade: "1", grammar: JSON.stringify(e.grammar ?? {}) });
  const row = { key: `${e.topicId}|${e.family}/${e.mode}|${e.goal}`, classLevel: e.classLevel };
  try {
    await page.goto(`http://127.0.0.1:5199/src/play/dev/index.html?${q}`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(1800);
    const m = await page.evaluate((young) => {
      const vw = window.innerWidth, vh = window.innerHeight; const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
      const label = (el) => (el.getAttribute("aria-label") || el.textContent || el.getAttribute("data-testid") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 28);
      const sel = 'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [data-hit], [onclick]';
      const small = [], clipped = []; let controls = 0;
      const cand = new Set(document.querySelectorAll(sel)); for (const el of document.querySelectorAll("body *")) { if (cand.has(el) || !vis(el)) continue; const cs = getComputedStyle(el); if (cs.cursor === "pointer" && (!el.parentElement || getComputedStyle(el.parentElement).cursor !== "pointer")) cand.add(el); }
      for (const el of cand) { if (!vis(el)) continue; controls++; const r = el.getBoundingClientRect(); if (Math.min(r.width, r.height) < 43.5) small.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`); if (r.right > vw + 2 || r.left < -2) clipped.push(`${label(el)} ${Math.round(r.left)}..${Math.round(r.right)}`); }
      const tiny = []; const floor = young ? 16 : 14;
      for (const el of document.querySelectorAll("body *")) {
        if (!vis(el)) continue; const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length > 1).map((n) => n.textContent.trim()).join(" "); if (!own) continue;
        const r = el.getBoundingClientRect(); const isSvg = el instanceof SVGElement; const px = isSvg ? r.height / 1.15 : parseFloat(getComputedStyle(el).fontSize);
        if (px < floor - 0.5) tiny.push(`${own.slice(0, 22)} ${px.toFixed(1)}px`);
      }
      return { vw, overflowX: document.documentElement.scrollWidth - vw, controls, small, clipped, tiny, scrollH: document.documentElement.scrollHeight - vh, textLen: document.body.innerText.length };
    }, e.classLevel <= 5);
    Object.assign(row, m);
    if (shotDir && (m.clipped.length || m.overflowX > 2 || m.small.length > 3)) await page.screenshot({ path: `${shotDir}/${e.family}-${e.mode}-${e.goal}.png` });
  } catch (x) { row.error = String(x.message).slice(0, 140); }
  row.errs = errs; out.push(row); await ctx.close();
}
await browser.close();
const bad = out.filter((r) => r.error || r.overflowX > 2 || r.clipped?.length || r.small?.length || r.tiny?.length);
console.log(`mounted ${out.length} family/mode/goal combos at 360x640; with something to report: ${bad.length}`);
console.log(`errors ${out.filter((r) => r.error).length}  overflowX ${out.filter((r) => r.overflowX > 2).length}  clipped ${out.filter((r) => r.clipped?.length).length}  small-target ${out.filter((r) => r.small?.length).length}  tiny-text ${out.filter((r) => r.tiny?.length).length}  blank(no controls) ${out.filter((r) => r.controls === 0).length}`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(out, null, 1));
