// Shared gate helpers: element boxes, real pointer taps at element centres, visible text, the words check, layout,
// label anchoring and the no-hint style signature. Ported from the probe gate (evals/live-studio/qa.mjs) and made
// archetype-generic.

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Visible boxes of every element matching `sel`, with their data-* attributes. */
export async function boxes(page, sel) {
  return page.$$eval(sel, (els) => els.map((e) => {
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    let hidden = false; for (let p = e; p && p.nodeType === 1; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === "none" || s.visibility === "hidden" || +s.opacity < 0.05) { hidden = true; break; } }
    // a vertical / horizontal SVG line has a zero-width box (its stroke is not in the box): it is still visible
    return { x: r.x, y: r.y, w: r.width, h: r.height, vis: (r.width > 0 || r.height > 0) && !hidden && cs.visibility !== "hidden",
      attrs: Object.fromEntries([...e.attributes].filter((a) => a.name.startsWith("data-")).map((a) => [a.name, a.value])),
      text: (e.textContent || "").trim().slice(0, 80) };
  }));
}
export const visible = async (page, sel) => (await boxes(page, sel)).filter((b) => b.vis);
export const centre = (b) => [b.x + b.w / 2, b.y + b.h / 2];

/**
 * A real pointer tap at the centre of the idx-th visible element matching sel (or the one whose `attr` = value).
 * The point must hit that element or a descendant (elementFromPoint), else the tap is reported as blocked.
 * @returns {Promise<boolean>}
 */
export async function tap(page, sel, { idx = 0, attr, value, wait = 140 } = {}) {
  const bs = await visible(page, sel);
  const b = attr ? bs.find((x) => x.attrs[attr] === String(value)) : bs[idx];
  if (!b) return false;
  const k = bs.indexOf(b);
  // the centre when it hits the element (or a descendant), else the first point of a 7x7 grid that does: a wedge's
  // bounding-box centre can lie in its neighbour, and a child's finger lands on what it sees
  const pt = await page.evaluate(({ sel, k }) => {
    const els = [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    const e = els[k]; if (!e) return null;
    const r = e.getBoundingClientRect();
    const hits = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); };
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    if (hits(cx, cy)) return [cx, cy];
    for (let i = 1; i < 8; i++) for (let j = 1; j < 8; j++) { const x = r.x + (r.width * i) / 8, y = r.y + (r.height * j) / 8; if (hits(x, y)) return [x, y]; }
    return null;
  }, { sel, k }).catch(() => null);
  const [x, y] = pt ?? centre(b);
  await page.mouse.click(x, y);
  await sleep(wait);
  return true;
}

/** Targets no finger can reach (no point of the box hits the element), and HTML targets overlapping one another. */
export async function targetReach(page, sel) {
  return page.evaluate((sel) => {
    const els = [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity >= 0.05; });
    const name = (e) => [...e.attributes].filter((a) => a.name.startsWith("data-")).map((a) => `${a.name}=${a.value}`).join(" ").slice(0, 40);
    const unreachable = [];
    for (const e of els) {
      const r = e.getBoundingClientRect();
      let ok = false;
      for (let i = 1; i < 8 && !ok; i++) for (let j = 1; j < 8 && !ok; j++) { const t = document.elementFromPoint(r.x + (r.width * i) / 8, r.y + (r.height * j) / 8); ok = !!t && (t === e || e.contains(t)); }
      if (!ok) unreachable.push(name(e));
    }
    const html = els.filter((e) => !(e instanceof SVGElement) && !els.some((o) => o !== e && o.contains(e)));
    const overlapping = [];
    for (let i = 0; i < html.length; i++) for (let j = i + 1; j < html.length; j++) {
      const a = html[i].getBoundingClientRect(), b = html[j].getBoundingClientRect();
      const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      if (ix * iy > 0.1 * Math.min(a.width * a.height, b.width * b.height)) overlapping.push(`${name(html[i])} ~ ${name(html[j])}`);
    }
    return { unreachable, overlapping };
  }, sel);
}

/** Visible text strings (HTML text nodes + SVG text), for the words-only-from-the-table check. */
export async function visibleTexts(page) {
  return page.evaluate(() => {
    const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      const s = n.nodeValue.trim(); if (!s) continue; const p = n.parentElement; if (!p || /^(SCRIPT|STYLE)$/.test(p.tagName)) continue;
      let hid = false; for (let q = p; q && q.nodeType === 1; q = q.parentElement) { const cs = getComputedStyle(q); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.05) { hid = true; break; } }
      const r = p.getBoundingClientRect();
      if (hid || r.width === 0) continue;
      out.push(s);
    }
    // pseudo-element content is text too (::before / ::after)
    for (const e of document.body.querySelectorAll("*")) for (const ps of ["::before", "::after"]) {
      const c = getComputedStyle(e, ps).content; if (c && c !== "none" && c !== "normal" && /^["'].*["']$/.test(c) && c.length > 2) out.push(c.slice(1, -1));
    }
    return out;
  });
}

/** Text left after removing every table value and every number: any 2+ letter word left is a stray word (G3). */
export function strayWords(texts, strings) {
  const vals = Object.values(strings).filter(Boolean).sort((a, b) => b.length - a.length);
  const stray = [];
  for (const t of texts) {
    let r = t; for (const v of vals) r = r.split(v).join(" ");
    r = r.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");
    if (/\p{L}{2,}/u.test(r)) stray.push(t.slice(0, 60));
  }
  return stray;
}

/**
 * Content extent beyond the design box: any visible CONTENT element (it carries text, a data-* seam attribute, or is
 * interactive) whose box leaves the stage. Purely decorative shapes (no text, no seam, not interactive: a corner blob,
 * a sun bleeding off the edge) may bleed: the stage clips them, and a clipped decoration is a design choice, while a
 * clipped word, target or truth shape is a defect. Scroll extents count either way.
 */
export async function overflow(page, stage) {
  return page.evaluate(({ W, H }) => {
    let right = 0, bottom = 0, left = 0, top = 0;
    const offenders = [];
    const content = (e) => [...e.attributes].some((a) => a.name.startsWith("data-")) || /^(BUTTON|INPUT|SELECT|TEXTAREA|A|LABEL)$/.test(e.tagName)
      || [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()) || e.tagName === "text" || e.tagName === "tspan";
    for (const e of document.body.querySelectorAll("*")) {
      const r = e.getBoundingClientRect(); if (!r.width && !r.height) continue;
      const cs = getComputedStyle(e); if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < 0.05) continue;
      if (/^(SCRIPT|STYLE)$/.test(e.tagName) || !content(e)) continue;
      const dr = r.right - W, db = r.bottom - H, dl = -r.left, dt = -r.top;
      if (Math.max(dr, db, dl, dt) > 1) offenders.push(((e.id ? "#" + e.id : e.tagName.toLowerCase()) + " " + [...e.attributes].filter((a) => a.name.startsWith("data-")).map((a) => a.name + "=" + a.value).join(" ")).slice(0, 50));
      right = Math.max(right, dr); bottom = Math.max(bottom, db); left = Math.max(left, dl); top = Math.max(top, dt);
    }
    const sw = document.documentElement.scrollWidth - W, sh = document.documentElement.scrollHeight - H;
    return { right: Math.round(right), bottom: Math.round(bottom), left: Math.round(left), top: Math.round(top), scrollX: sw, scrollY: sh, offenders: offenders.slice(0, 3) };
  }, { W: stage.w, H: stage.h });
}

/** Pairs of boxes overlapping by more than `share` of the smaller one. */
export function overlaps(bs, key, share = 0.15) {
  const out = [];
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const a = bs[i], b = bs[j];
    const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    if (ix * iy > share * Math.min(a.w * a.h, b.w * b.h)) out.push(`${a.attrs[key]}~${b.attrs[key]}`);
  }
  return out;
}
/** Distance from a point to a box (0 inside). */
export const distToBox = (p, b) => Math.hypot(Math.max(b.x - p[0], 0, p[0] - (b.x + b.w)), Math.max(b.y - p[1], 0, p[1] - (b.y + b.h)));
/** Gap between two boxes (0 when they touch or overlap). */
export const boxGap = (a, b) => Math.hypot(Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w)), Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h)));

/** A style signature per element (what a hint would change): fill, stroke, colours, opacity, outline, filter, scale. */
export async function styleSignatures(page, sel) {
  return page.$$eval(sel, (els) => els.map((e) => {
    // transform is left out: an idle pulse or bob shared by every option is not a hint, and its phase differs per element
    const cs = getComputedStyle(e);
    return [cs.fill, cs.stroke, cs.backgroundColor, cs.color, (+cs.opacity).toFixed(1), cs.outlineStyle, cs.filter, cs.boxShadow, cs.fontWeight].join("|");
  }));
}
