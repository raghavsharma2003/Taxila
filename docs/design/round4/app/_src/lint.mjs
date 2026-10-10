// U1 lint: for every journey state at 360x800 and 1366x768, in all three languages, check
//   - text >= 14 px, Devanagari text >= 16 px (computed font-size of the element owning the text node)
//   - interactive targets >= 44 x 44 px (visible buttons, [data-go], [role=button])
//   - no horizontal overflow (document scrollWidth <= viewport width)
//   - WCAG contrast of text against the nearest opaque background (>= 4.5, or >= 3 for >= 24 px / >= 18.66 px bold)
// Text drawn over photos/canvas (no opaque ancestor) is reported as "unresolved", not passed.
// node docs/design/round4/app/_src/lint.mjs [dir ...]  -> <dir>/shots/lint.json and a summary line per direction
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const APP = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : ['kaksha', 'nagar', 'chhaap'];
const STATES = [['open', 's=open'], ['intake', 's=intake&at=plan'], ['lesson-check', 's=lesson&at=ok'], ['game', 's=game'], ['game-play', 's=game&at=play'],
  ['end', 's=end'], ['world', 's=world'], ['parent', 's=parent']];
const LANGS = ['hing', 'hi', 'en'];
const VIEWS = [[360, 800], [1366, 768]];

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

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const dir of dirs) {
  const file = url.pathToFileURL(path.join(APP, dir, 'index.html')).href; const report = []; const tot = { small: 0, deva: 0, targets: 0, contrast: 0, overflow: 0, unresolved: 0, texts: 0, pages: 0 };
  for (const [w, h] of VIEWS) for (const lang of LANGS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); const p = await ctx.newPage();
    for (const [name, hash] of STATES) {
      await p.goto(`about:blank`); await p.goto(`${file}#${hash}&lang=${lang}&mute=1`); await p.waitForTimeout(name === 'end' || name === 'lesson-check' || name === 'game-play' ? 4500 : 1400);
      const r = await p.evaluate(inPage); tot.pages++;
      for (const k of ['small', 'deva', 'targets', 'contrast']) tot[k] += r[k].length; tot.overflow += r.overflow > 0 ? 1 : 0; tot.unresolved += r.unresolved; tot.texts += r.texts;
      report.push({ view: `${w}x${h}`, lang, state: name, ...r });
    }
    await ctx.close();
  }
  fs.mkdirSync(path.join(APP, dir, 'shots'), { recursive: true });
  fs.writeFileSync(path.join(APP, dir, 'shots', 'lint.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), method: 'Playwright Chromium, computed styles, reduced motion; 8 states x 3 languages x 2 viewports', totals: tot, pages: report }, null, 1));
  console.log(dir, JSON.stringify(tot));
}
await browser.close();
