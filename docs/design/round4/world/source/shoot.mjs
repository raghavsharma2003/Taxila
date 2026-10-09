// Playwright proof: every screen at 360x800, 412x915, 1366x768; overflow / text-size / tap-target checks.
// Google Fonts are fetched by Node through the sandbox proxy with real TLS verification (NODE_EXTRA_CA_CERTS) and
// handed to Chromium via page.route — Chromium never sees an untrusted certificate, nothing is ignored.
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const W = new URL(".", import.meta.url).pathname;
const SRC = process.env.SRC || "/home/user/Taxila/docs/design/round4/world/index.html";
const OUT = process.env.OUT || W + "shots";
mkdirSync(OUT, { recursive: true });
writeFileSync(W + "wrap.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>${readFileSync(SRC, "utf8")}</body></html>`);
const URL0 = "file://" + W + "wrap.html";
const cache = new Map();
async function fontRoute(route) {
  const url = route.request().url();
  try {
    if (!cache.has(url)) {
      const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36" } });
      cache.set(url, { status: r.status, body: Buffer.from(await r.arrayBuffer()), ct: r.headers.get("content-type") || "" });
    }
    const c = cache.get(url);
    await route.fulfill({ status: c.status, body: c.body, headers: { "content-type": c.ct, "access-control-allow-origin": "*" } });
  } catch (e) { console.log("font fetch failed", url, e.message); await route.abort(); }
}
export async function browser() {
  return chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
}
export async function page(b, vp, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr || 1, hasTouch: vp.w < 900, isMobile: vp.w < 900, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, fontRoute);
  p.on("pageerror", (e) => console.log("PAGEERROR", vp.id, e.message));
  p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console", vp.id, m.text().slice(0, 200)); });
  return p;
}
export const measure = () => {
  const vw = innerWidth, vh = innerHeight, bad = { overflowX: [], small: [], targets: [] };
  const vis = (el) => { const s = getComputedStyle(el); if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw; };
  const scr = document.querySelector(".screen.on");
  if (document.documentElement.scrollWidth > vw + 1) bad.overflowX.push("document " + document.documentElement.scrollWidth);
  for (const el of scr.querySelectorAll("*")) {
    if (!vis(el)) continue;
    let anc = el, hiddenAnc = false; while (anc && anc !== scr) { const s = getComputedStyle(anc); if (+s.opacity === 0 || s.visibility === "hidden") { hiddenAnc = true; break; } anc = anc.parentElement; }
    if (hiddenAnc) continue;
    const r = el.getBoundingClientRect();
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (own && r.right > vw + 1 && !el.closest(".mp-view") && !el.closest(".placename")) bad.overflowX.push(el.className + ":" + el.textContent.trim().slice(0, 30));
    if (own && el.closest("svg") == null) { const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 14) bad.small.push(fs + "px " + el.textContent.trim().slice(0, 30)); }
    if ((el.tagName === "BUTTON" || el.getAttribute("role") === "button" || el.tagName === "INPUT" || el.tagName === "SUMMARY") && !el.closest(".mp-view")) { if (r.width < 43.5 || r.height < 43.5) bad.targets.push(`${Math.round(r.width)}x${Math.round(r.height)} ${el.id || el.className} ${el.textContent.trim().slice(0, 20)}`); }
  }
  for (const t of scr.querySelectorAll("svg text")) { if (!vis(t)) continue; const r = t.getBoundingClientRect(); const fs = r.height / 1.25; if (fs < 13 && !t.closest(".mp-view")) bad.small.push("svg " + fs.toFixed(1) + " " + t.textContent.slice(0, 20)); }
  return bad;
};
export const VPS = [{ id: "360x800", w: 360, h: 800, dpr: 2 }, { id: "412x915", w: 412, h: 915, dpr: 2 }, { id: "1366x768", w: 1366, h: 768, dpr: 1 }];
export { URL0, fontRoute as fontRouteExport };

if (process.argv[1] && process.argv[1].endsWith("shoot.mjs")) {
  const only = process.argv[2] ? process.argv[2].split(",") : ["hello", "pick", "home", "lesson", "game", "map", "parent"];
  const b = await browser();
  const report = {};
  for (const vp of VPS) {
    const p = await page(b, vp);
    for (const s of only) {
      const hash = s === "pick" ? "hello&pick" : s;
      await p.goto("about:blank"); await p.goto(URL0 + "#" + hash);
      await p.waitForTimeout(s === "lesson" ? 9000 : 3600);
      if (s === "pick") { await p.waitForFunction(() => { const b = document.querySelector('[data-step="b"]'); return b && !b.hidden; }, null, { timeout: 30000 }); await p.waitForTimeout(1800); }
      await p.evaluate(() => document.fonts.ready);
      const m = await p.evaluate(measure);
      report[`${s}@${vp.id}`] = m;
      await p.screenshot({ path: `${OUT}/${s}-${vp.id}.png` });
      console.log(s, vp.id, JSON.stringify(m).slice(0, 300));
    }
    await p.context().close();
  }
  writeFileSync(OUT + "/report.json", JSON.stringify(report, null, 1));
  await b.close();
}
