// Release 11 · stream 2: the public site before / after, from a REAL production build (vite build output served with the
// SPA fallback; no API needed: the public pages call none for a visitor who is not signed in), at 360x800, 412x915 and
// 1366x768. Per page it measures, in the page: horizontal overflow, the smallest visible text (CSS px), the smallest tap
// target among links and buttons, whether the AI wording and both helpline numbers are on the page, and lime elements
// in the first viewport (K's one-volt law, after only). Writes webp sheets and a JSON of the measurements.
//   node tests/prod/r11-site-sheets.mjs --dist <dir> --label before|after [--out docs/design/round4/build/r11/stream2]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const DIST = path.resolve(arg("dist", "dist"));
const LABEL = arg("label", "after");
const OUT = path.resolve(arg("out", "docs/design/round4/build/r11/stream2"));
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR ?? "/tmp", `r11-${LABEL}-`));
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (u.startsWith("/api/")) { res.writeHead(401, { "content-type": "application/json" }); res.end("{}"); return; }
  let f = path.join(DIST, u);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, "index.html");
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] ?? "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const PAGES = [["landing", "/"], ["promises", "/promises"], ["privacy", "/privacy"], ["help", "/help"], ["leaving", "/leaving?to=https%3A%2F%2Fncert.nic.in"], ["notfound", "/no-such-page"]];
const SIZES = [[360, 800], [412, 915], [1366, 768]];
const browser = await chromium.launch();
const rows = [];
try {
  for (const [w, h] of SIZES) for (const [name, url] of PAGES) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.goto(base + url, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !e.closest("[hidden],[aria-hidden='true'] .kx-cta-sweep"); };
      const texts = [...document.querySelectorAll("body *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && vis(e) && !e.closest(".sv-skip,.skip"));
      const minText = Math.min(...texts.map((e) => parseFloat(getComputedStyle(e).fontSize)));
      const small = texts.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => `${e.className || e.tagName}:${e.textContent.trim().slice(0, 20)}`).slice(0, 5);
      const targets = [...document.querySelectorAll("a[href], button")].filter((e) => vis(e) && !e.closest(".sv-skip,.skip") && !e.closest("p,li:not(.sv-chip)") || (e.matches("a[href],button") && vis(e) && e.closest("nav,header,footer,.sv-helplines,.sv-hero-actions,.sv-actions,.sv-faq")));
      const tiny = [...new Set(targets)].filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 && !e.closest(".sv-skip,.skip"); }).map((e) => `${e.className || e.tagName}:${e.textContent.trim().slice(0, 18)} ${Math.round(e.getBoundingClientRect().height)}px`).slice(0, 6);
      const body = document.body.innerText;
      const lime = getComputedStyle(document.querySelector(".kx") ?? document.body).getPropertyValue("--k-move").trim();
      const limeInView = lime ? [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || !vis(e)) return false; const cs = getComputedStyle(e); return cs.backgroundColor.replace(/\s/g, "") !== "rgba(0,0,0,0)" && cs.backgroundImage.includes("gradient") && e.classList.contains("kx-cta") || false; }).length : null;
      return { overflowX: document.documentElement.scrollWidth - innerWidth, minText, small, tinyTargets: tiny, ai: /\bAI\b/.test(body), childline: /1098/.test(body), telemanas: /14416/.test(body), limeCtasInView: limeInView, height: document.documentElement.scrollHeight };
    });
    const vp = path.join(TMP, `${name}-${w}-vp.png`), full = path.join(TMP, `${name}-${w}-full.png`);
    await page.screenshot({ path: vp });
    await page.screenshot({ path: full, fullPage: true });
    rows.push({ label: LABEL, page: name, size: `${w}x${h}`, ...m });
    console.log(`${LABEL} ${name} ${w}x${h}: overflowX ${m.overflowX}, min text ${m.minText}px, small targets ${m.tinyTargets.length}, AI ${m.ai}, 1098 ${m.childline}, 14416 ${m.telemanas}`);
    await page.close();
  }
} finally { await browser.close(); server.close(); }
// sheets: per size, every page's first viewport side by side; and the landing's full page as its own long strip
execFileSync("python3", ["-c", `
import sys, json, os
from PIL import Image
tmp, out, label = sys.argv[1], sys.argv[2], sys.argv[3]
pages = ["landing","promises","privacy","help","leaving","notfound"]
for w,h in [(360,800),(412,915),(1366,768)]:
    ims = [Image.open(f"{tmp}/{p}-{w}-vp.png").convert("RGB") for p in pages]
    if w > 800:
        cols, s = 3, 0.5
    else:
        cols, s = 6, 0.75
    tw, th = int(w*s), int(h*s)
    rows = (len(ims)+cols-1)//cols
    sheet = Image.new("RGB", (tw*cols + 8*(cols-1), th*rows + 8*(rows-1)), (20,20,20))
    for i,im in enumerate(ims):
        sheet.paste(im.resize((tw,th), Image.LANCZOS), ((i%cols)*(tw+8), (i//cols)*(th+8)))
    sheet.save(f"{out}/{label}-pages-{w}x{h}.webp", "WEBP", quality=72, method=6)
    full = Image.open(f"{tmp}/landing-{w}-full.png").convert("RGB")
    if full.height > 16000: full = full.crop((0,0,full.width,16000))
    full.save(f"{out}/{label}-landing-full-{w}x{h}.webp", "WEBP", quality=70, method=6)
`, TMP, OUT, LABEL], { stdio: "inherit" });
fs.writeFileSync(path.join(OUT, `${LABEL}-site-measure.json`), JSON.stringify({ at: new Date().toISOString(), dist: path.relative(process.cwd(), DIST) || DIST, rows }, null, 1));
const bad = rows.filter((r) => r.overflowX > 0 || r.minText < 14 || !r.childline || !r.telemanas);
console.log(`${rows.length} views, ${bad.length} below a floor`);
