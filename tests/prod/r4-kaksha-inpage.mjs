// The Kaksha in-page lint (U1's docs/design/round4/app/_src/lint.mjs, ported): runs inside the page via page.evaluate.
// text >= 14 px, Devanagari >= 16 px, targets >= 44 px, no horizontal overflow, WCAG contrast against the composited
// background (gradients checked at every stop). Shared by r4-kaksha-shots.mjs (K0 screens) and r4-kaksha-desk-shots.mjs (K1).
import { spawn } from "node:child_process";

export function inPage() {
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
    // a hit area extended by an absolutely positioned ::after with negative insets (the Desk's 32 px "Wait" pill → 48 dp) counts
    const af = getComputedStyle(b, "::after"); const ext = (v) => (af.content !== "none" && af.position === "absolute" && parseFloat(v) < 0 ? -parseFloat(v) : 0);
    const ew = r.width + ext(af.left) + ext(af.right), eh = r.height + ext(af.top) + ext(af.bottom);
    if (ew < 43.5 || eh < 43.5) out.targets.push(`${b.tagName.toLowerCase()}.${b.className} "${(b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${r.width.toFixed(0)}x${r.height.toFixed(0)}`);
  }
  return out;
}

/** Start `vite` on a port (detached: stop() kills the whole process group). */
export async function startVite(root, port) {
  const vite = spawn("npx", ["vite", "--port", String(port), "--strictPort"], { cwd: root, stdio: ["ignore", "pipe", "pipe"], detached: true });
  const stop = () => { try { process.kill(-vite.pid, "SIGTERM"); } catch { /* already gone */ } };
  await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("vite did not start")), 60000); vite.stdout.on("data", (d) => { if (String(d).includes("Local")) { clearTimeout(t); res(); } }); });
  return stop;
}
