// Screenshot the comparison page and check the page contract at 360x800, 412x915 and 1366x768:
// no sideways scroll, no text under 14 px, no tap target under 44 px.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node shoot.mjs <outdir> [--full]
import fs from "node:fs";
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
// the page is a fragment (the publisher wraps it in a document skeleton), so shoot it inside the same kind of wrapper
const HERE = new URL(".", import.meta.url).pathname;
fs.writeFileSync(HERE + "wrap.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${fs.readFileSync("/home/user/Taxila/docs/design/round4/face/index.html", "utf8")}</body></html>`);
const page = "file://" + HERE + "wrap.html";
// Google Fonts fetched by Node through the sandbox proxy (real TLS, NODE_EXTRA_CA_CERTS) and handed to Chromium
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
  pg.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await pg.goto(page, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(600);
  const chk = await pg.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const overflowX = document.documentElement.scrollWidth - vw;
    const small = [], wide = [], taps = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      if (r.right > vw + 1 && getComputedStyle(el).position !== "fixed") wide.push(el.tagName + "." + el.className + " " + Math.round(r.right));
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (hasText) { const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 14) small.push(el.tagName + "." + el.className + " " + fs + "px: " + el.textContent.trim().slice(0, 30)); }
      if (el.matches("a, button")) { if (r.height < 44 || r.width < 44) taps.push(el.tagName + "." + el.className + " " + Math.round(r.width) + "x" + Math.round(r.height)); }
    }
    const fonts = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
    return { vw, overflowX, wideEls: wide.slice(0, 10), smallText: small.slice(0, 10), smallTaps: taps.slice(0, 10), fontsLoaded: [...new Set(fonts)] };
  });
  report[`${w}x${h}`] = chk;
  await pg.screenshot({ path: `${out}/page-${w}x${h}.png`, fullPage: false });
  if (process.argv.includes("--full")) await pg.screenshot({ path: `${out}/page-${w}x${h}-full.png`, fullPage: true });
  // each family section at this viewport
  const secs = await pg.$$("section.fam");
  for (const s of secs) { const id = await s.getAttribute("id"); await s.screenshot({ path: `${out}/${id}-${w}x${h}.png` }); }
  // tap a frame (speaking) in the first family and shoot the slots, to prove the switch works
  if (w === 360) {
    const btn = await pg.$("#f-stylised .fr[data-fr=speak]"); if (btn) { await btn.click(); await pg.waitForTimeout(200); const sl = await pg.$("#f-stylised .slots"); await sl.screenshot({ path: `${out}/tap-speaking-slots-360.png` }); }
  }
  await ctx.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await b.close();
