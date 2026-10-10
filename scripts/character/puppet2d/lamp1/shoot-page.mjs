// Screenshot a round-4 Asha page fragment and check the page contract at 360x800, 412x915 and 1366x768: no sideways
// scroll, no text under 14 px, no tap target under 44 px (a, button, summary). Adapted from face/source/shoot.mjs.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_USE_ENV_PROXY=1 node shoot-page.mjs <page.html> <outdir> [--full] [--tap <selector>]
import fs from "node:fs";
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
const [src, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const SCR = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha";
const wrap = `${SCR}/wrap-${Date.now()}.html`;
fs.writeFileSync(wrap, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${fs.readFileSync(src, "utf8")}</body></html>`);
const tapSel = process.argv.includes("--tap") ? process.argv[process.argv.indexOf("--tap") + 1] : null;
const cache = new Map();
async function fontRoute(route) {
  const url = route.request().url();
  try {
    if (!cache.has(url)) { const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36" } }); cache.set(url, { status: r.status, body: Buffer.from(await r.arrayBuffer()), ct: r.headers.get("content-type") || "" }); }
    const c = cache.get(url); await route.fulfill({ status: c.status, body: c.body, headers: { "content-type": c.ct, "access-control-allow-origin": "*" } });
  } catch (e) { console.log("font fetch failed", url, e.message); await route.abort(); }
}
const b = await chromium.launch();
const report = {};
for (const [w, h] of [[360, 800], [412, 915], [1366, 768]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 900, hasTouch: w < 900 });
  const pg = await ctx.newPage();
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, fontRoute);
  const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
  await pg.goto("file://" + wrap, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(600);
  if (tapSel) { const el = await pg.$(tapSel); if (el) { await el.click(); await pg.waitForTimeout(250); } }
  const chk = await pg.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const overflowX = document.documentElement.scrollWidth - vw;
    const small = [], wide = [], taps = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      let inScroll = false; for (let p = el.parentElement; p; p = p.parentElement) if (getComputedStyle(p).overflowX === "auto") { inScroll = true; break; }
      if (!inScroll && r.right > vw + 1 && getComputedStyle(el).position !== "fixed") wide.push(el.tagName + "." + el.className + " " + Math.round(r.right));
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (hasText && el.closest("svg") === null) { const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 14) small.push(el.tagName + "." + el.className + " " + fs + "px: " + el.textContent.trim().slice(0, 30)); }
      if (el.matches("a, button, summary")) { if (r.height < 44 || r.width < 44) taps.push(el.tagName + "." + el.className + " " + Math.round(r.width) + "x" + Math.round(r.height)); }
    }
    const fonts = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
    return { vw, overflowX, wideEls: wide.slice(0, 10), smallText: small.slice(0, 10), smallTaps: taps.slice(0, 10), fontsLoaded: [...new Set(fonts)] };
  });
  chk.pageErrors = errs;
  report[`${w}x${h}`] = chk;
  await pg.screenshot({ path: `${out}/page-${w}x${h}.png`, fullPage: false });
  if (process.argv.includes("--full")) await pg.screenshot({ path: `${out}/page-${w}x${h}-full.png`, fullPage: true });
  await ctx.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(report, null, 1));
fs.rmSync(wrap);
console.log(JSON.stringify(report, null, 1));
await b.close();
