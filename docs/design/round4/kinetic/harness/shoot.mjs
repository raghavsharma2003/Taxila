// Screenshot + layout checks for the Taal prototype.
// node shoot.mjs [outDir] [--sizes 360x800,412x915,1366x768] [--screens hello,home,...] [--quick]
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("/home/user/Taxila/node_modules/playwright/index.mjs");
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
// Google Fonts are fetched by curl (TLS verified against the proxy CA bundle) and handed to the page:
// headless Chromium here has no NSS trust for the proxy CA, and verification is never disabled.
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const fontCache = new Map();
async function fontRoute(route) {
  const u = route.request().url();
  try {
    if (!fontCache.has(u)) fontCache.set(u, execFileSync("curl", ["-sS", "--fail", "-A", UA, u], { maxBuffer: 1 << 26 }));
    const ct = u.includes("googleapis") ? "text/css; charset=utf-8" : "font/woff2";
    await route.fulfill({ status: 200, body: fontCache.get(u), contentType: ct, headers: { "access-control-allow-origin": "*" } });
  } catch (e) { await route.abort(); }
}
const D = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-kinetic";
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const out = args[0] && !args[0].startsWith("--") ? args[0] : path.join(D, "shots-dev");
fs.mkdirSync(out, { recursive: true });
const sizes = arg("sizes", "360x800,412x915,1366x768").split(",").map((s) => s.split("x").map(Number));
const screens = arg("screens", "hello,hello-b,home,lesson,game,map,parent").split(",");
const url = "file://" + path.join(D, "preview.html");
const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
const report = [];

// in-page audit: horizontal overflow, small text, small targets, clipped elements
function audit() {
  const scr = document.querySelector(".scr.on"); const dev = document.querySelector("#device").getBoundingClientRect();
  const vis = (el) => { const s = getComputedStyle(el); if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const inH = (el) => !!el.closest("[data-hscroll]");
  const offscreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom < dev.top || r.top > dev.bottom || r.right < dev.left || r.left > dev.right; };
  const small = [], tiny = [], clip = [];
  const walker = document.createTreeWalker(scr, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement; if (seen.has(el)) continue; seen.add(el);
    if (!vis(el) || el.closest("[aria-hidden=true]") || el.closest(".ghostnum") || offscreen(el) || el.closest("[inert]")) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 14) small.push(`${fs}px "${t.textContent.trim().slice(0, 30)}"`);
    const r = el.getBoundingClientRect(); if (!inH(el) && (r.right > dev.right + 1 || r.left < dev.left - 1)) clip.push(`"${t.textContent.trim().slice(0, 30)}" x ${Math.round(r.left - dev.left)}..${Math.round(r.right - dev.left)}`);
  }
  // SVG text inside the metro map
  scr.querySelectorAll("svg text").forEach((tx) => { const fs = parseFloat(getComputedStyle(tx).fontSize) * (tx.ownerSVGElement.getBoundingClientRect().width / (tx.ownerSVGElement.viewBox.baseVal.width || 1)); if (fs < 13.9) small.push(`svg ${fs.toFixed(1)}px "${tx.textContent.slice(0, 20)}"`); });
  scr.querySelectorAll("button,a,input,[role=button],[role=radio],[tabindex='0']").forEach((b) => {
    if (!vis(b) || b.closest("[inert]") || offscreen(b)) return; const r = b.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) tiny.push(`${Math.round(r.width)}x${Math.round(r.height)} ${b.tagName} "${(b.getAttribute("aria-label") || b.textContent).trim().slice(0, 24)}"`);
  });
  const hs = document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1;
  return { hscroll: hs, small: [...new Set(small)].slice(0, 12), tiny: [...new Set(tiny)].slice(0, 12), clip: [...new Set(clip)].slice(0, 12) };
}

for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 800 ? 2 : 1, hasTouch: w < 800 });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, fontRoute);
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(url); await page.waitForTimeout(1500);
  await page.evaluate(() => document.fonts.ready);
  const fl = await page.evaluate(async () => { await document.fonts.load("800 40px 'Anek Devanagari'"); await document.fonts.load("700 30px Eczar"); return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family); });
  if (!fl.length) report.push({ size: `${w}x${h}`, errors: ["FONTS NOT LOADED"] });
  for (const s of screens) {
    const base = s.split("-")[0];
    const hi = s.endsWith("-hi"); await page.evaluate((hi) => { window.taal.setLang(hi ? "hi" : "hinglish"); }, hi);
    await page.evaluate((b) => window.taal.go(b), base);
    if (base === "parent") await page.evaluate((hi) => { const b = document.querySelector(`[data-plang="${hi ? "hi" : "en"}"]`); b && b.click(); }, hi);
    if (s === "hello-b") { await page.evaluate(() => window.taal.helloStep("b")); }
    if (s === "hello") { await page.evaluate(() => window.taal.helloStep("a")); }
    if (base === "lesson") { const st = s.split("-")[1]; await page.evaluate((st) => window.taal.lessonAt(st), st && st !== "hi" ? st : "ask"); await page.waitForTimeout(2600); }
    else if (base === "game") { await page.evaluate((st) => window.taal.gameDemo(st === "solved" ? { n: 84, moves: [[84, 2], [42, 2], [21, 3]], done: true } : { n: 84, moves: [[84, 4], [21, 3]] }), s.split("-")[1] || "mid"); await page.waitForTimeout(s === "game-solved" ? 6000 : 3400); if (s === "game-mid") { /* select a block to show the pad live */ } }
    else await page.waitForTimeout(1900);
    let a = await page.evaluate(audit);
    if (process.argv.includes("--deep")) { // scroll every scrollable screen to audit below the fold too
      const n = await page.evaluate(() => { const sc = document.querySelector(".scr.on .scroll"); return sc ? Math.ceil(sc.scrollHeight / sc.clientHeight) : 0; });
      for (let k = 1; k < n; k++) { await page.evaluate((k) => { const sc = document.querySelector(".scr.on .scroll"); sc.scrollTop = k * sc.clientHeight * 0.9; }, k); await page.waitForTimeout(150); const b2 = await page.evaluate(audit); for (const key of ["small", "tiny", "clip"]) a[key] = [...new Set([...a[key], ...b2[key]])]; a.hscroll = a.hscroll || b2.hscroll; }
      await page.evaluate(() => { const sc = document.querySelector(".scr.on .scroll"); if (sc) sc.scrollTop = 0; });
    }
    const file = path.join(out, `${s}__${w}x${h}.png`);
    await page.screenshot({ path: file });
    report.push({ size: `${w}x${h}`, screen: s, ...a });
  }
  if (errs.length) report.push({ size: `${w}x${h}`, errors: [...new Set(errs)].slice(0, 10) });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify(report, null, 1));
for (const r of report) {
  if (r.errors) { console.log(r.size, "ERRORS", r.errors); continue; }
  const bad = [r.hscroll ? "HSCROLL" : "", r.small.length ? "small:" + r.small.join(" | ") : "", r.tiny.length ? "tiny:" + r.tiny.join(" | ") : "", r.clip.length ? "clip:" + r.clip.join(" | ") : ""].filter(Boolean).join("  ");
  console.log(r.size.padEnd(9), r.screen.padEnd(12), bad || "ok");
}
