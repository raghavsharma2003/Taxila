// Kaksha rendered-page harness (BUILD-SPEC §11.1): shots + an in-page lint of every Kaksha state on the dev fixture page,
// at 360x800, 412x915 and 1366x768, night and dawn. Not part of `npm test` (it needs a browser and a vite dev server).
//   node tests/prod/r4-kaksha-shots.mjs            starts `vite` on :5199 itself, writes
//   docs/design/round4/build/kaksha/shots/*.webp and docs/design/round4/build/kaksha/lint.json; exit 1 on any finding.
// The in-page checks are the U1 lint (docs/design/round4/app/_src/lint.mjs): text >= 14 px, Devanagari >= 16 px,
// targets >= 44 px, no horizontal overflow, WCAG contrast against the composited background (gradients by every stop).
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
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

function inPage() {
  const DEVA = /[ऀ-ॿ]/;
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  function bgOf(el) { // composite translucent layers down to the first opaque one; gradients/images -> unresolved
    const stack = []; let n = el;
    while (n && n.nodeType === 1) { const cs = getComputedStyle(n); if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/radial-gradient\(rgba\(18, 18, 18|radial-gradient\(rgba\(18,18,18/.test(cs.backgroundImage)) {
        const cols = (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(parse); if (cs.backgroundImage.includes('url(') || !cols.length) return null;
        // a gradient: composite every stop over what lies beneath it, then the translucent layers above; check every stop
        const under = n.parentElement ? bgOf(n.parentElement) : { solid: { r: 255, g: 255, b: 255, a: 1 } };
        const bases = under.solid ? [under.solid] : under.grad;
        const grad = []; for (const c of cols) for (const u of bases) { let x = c.a < 1 ? blend(c, u) : c; for (let i = stack.length - 1; i >= 0; i--) x = blend(stack[i], x); grad.push(x); }
        return { grad }; }
      const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 0.99) break; } n = n.parentElement; }
    if (!n || n.nodeType !== 1) { const b = parse(getComputedStyle(document.body).backgroundColor); stack.push(b && b.a ? b : { r: 255, g: 255, b: 255, a: 1 }); }
    let base = stack.pop(); while (stack.length) base = blend(stack.pop(), base); return { solid: base };
  }
  const out = { small: [], deva: [], targets: [], contrast: [], unresolved: 0, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), texts: 0 };
  const seen = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) {
    const t = tw.currentNode; const s = t.textContent.trim(); if (!s) continue; const el = t.parentElement; if (!el || seen.has(el)) continue;
    if (el.closest('svg') && !el.closest('text')) continue; if (el.closest('script,style,[hidden],.pending')) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; if (r.bottom < 0 || r.top > innerHeight * 3) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    let o = el, hid = false; while (o) { const c = getComputedStyle(o); if (c.display === 'none' || +c.opacity === 0) { hid = true; break; } o = o.parentElement; } if (hid) continue;
    seen.add(el); out.texts++;
    let fs = parseFloat(cs.fontSize); if (el.closest('svg')) { const svg = el.closest('svg'); const vb = svg.viewBox.baseVal; const k = vb && vb.width ? Math.min(svg.getBoundingClientRect().width / vb.width, svg.getBoundingClientRect().height / vb.height) : 1; fs *= k; }
    const tag = `${el.tagName.toLowerCase()}.${(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || ''} "${s.slice(0, 40)}"`;
    if (fs < 13.95) out.small.push(`${tag} ${fs.toFixed(1)}px`);
    if (DEVA.test(s) && fs < 15.95) out.deva.push(`${tag} ${fs.toFixed(1)}px`);
    if (el.closest('svg')) continue; // board text: colours checked by design tokens, bg is the board fill
    const fg = parse(cs.color); if (!fg) continue; const bg = bgOf(el); const big = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700); const need = big ? 3 : 4.5;
    if (!bg) { out.unresolved++; continue; }
    const worst = bg.solid ? ratio(blend(fg, bg.solid), bg.solid) : Math.min(...bg.grad.map((g) => ratio(blend(fg, g), g)));
    if (worst < need) out.contrast.push(`${tag} ${worst.toFixed(2)} < ${need}`);
  }
  for (const b of document.querySelectorAll('button,[data-go],[role=button],a[href]')) {
    if (b.closest('[hidden],.pending')) continue; const r = b.getBoundingClientRect(); if (!r.width || !r.height) continue;
    let o = b, hid = false; while (o) { const c = getComputedStyle(o); if (c.display === 'none' || c.visibility === 'hidden') { hid = true; break; } o = o.parentElement; } if (hid) continue;
    if (r.width < 43.5 || r.height < 43.5) out.targets.push(`${b.tagName.toLowerCase()}.${b.className} "${(b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${r.width.toFixed(0)}x${r.height.toFixed(0)}`);
  }
  return out;
}

fs.mkdirSync(OUT, { recursive: true });
const vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], detached: true });
const stopVite = () => { try { process.kill(-vite.pid, "SIGTERM"); } catch { /* already gone */ } };
await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("vite did not start")), 60000); vite.stdout.on("data", (d) => { if (String(d).includes("Local")) { clearTimeout(t); res(); } }); });
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
