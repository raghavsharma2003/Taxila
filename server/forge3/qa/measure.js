// forge3 visual QA: what the child's screen actually shows, measured in the page (CSS px). Runs INSIDE Chromium
// (page.evaluate(measureStage)): it must stay self-contained (no imports, no closures over module scope).
//
// The region is the Studio box ([data-testid="studio-box"]) when a Studio piece is on the tray, else the tray itself.
// Text is measured from the DOM and SVG as RENDERED (font size times the on-screen scale of a transformed SVG / scaled
// stage), never from the script's declared sizes; clipping is the text's own client rects against the region (a word cut
// at the box edge is "outside"); overlap is between the rects of two different text runs; the drawn content's bounding
// box (SVG shapes and text, canvas non-ground pixels) gives the composition fill. Canvas engines draw their words as
// pixels, so their floors come from the host's own design-unit minimums scaled to the canvas (the driver adds those).

/**
 * Installed BEFORE the page's scripts (page / context addInitScript): records every fillText on a canvas with its rendered
 * box in CSS px (font size × the canvas transform × the canvas's CSS scale), so text drawn as pixels (play pieces, Studio v2
 * engines) is measured like DOM text: size, clipping, overlap. A frame starts when a canvas is cleared or painted over
 * (≥ 90% of it) and only the canvas's latest frame counts. Self-contained (it is serialised into the page). Round 3 forge:
 * without it the QA passed a play number line whose tick labels were drawn on top of each other (after-run, 360 x 800).
 */
export function canvasTextProbe() {
  if (window.__forge3Canvas) return;
  const P = CanvasRenderingContext2D.prototype;
  // per canvas: only its CURRENT frame's text runs (bounded), so a 60 fps engine never grows memory (a first version kept
  // every run and crashed the judge page in the round 3 re-certification)
  const st = { byCanvas: new Map() };
  window.__forge3Canvas = st;
  const cur = (cv) => {
    let e = st.byCanvas.get(cv);
    if (!e) {
      // canvases a piece has unmounted are dropped (each judged piece mounts new ones)
      if (st.byCanvas.size > 24) for (const k of st.byCanvas.keys()) if (!k.isConnected) st.byCanvas.delete(k);
      e = { frame: 0, recs: [] }; st.byCanvas.set(cv, e);
    }
    return e;
  };
  const covers = (ctx, w, h) => {
    try { const m = ctx.getTransform(); return Math.abs(w * m.a) * Math.abs(h * m.d) >= 0.9 * ctx.canvas.width * ctx.canvas.height; } catch { return false; }
  };
  const bump = (cv) => { const e = cur(cv); e.frame++; e.recs = []; };
  for (const name of ["clearRect", "fillRect"]) {
    const o = P[name];
    P[name] = function (x, y, w, h) { if (covers(this, w, h)) bump(this.canvas); return o.apply(this, arguments); };
  }
  const di = P.drawImage;
  P.drawImage = function (img, ...a) {
    const w = a.length === 4 ? a[2] : a.length === 8 ? a[6] : img?.width, h = a.length === 4 ? a[3] : a.length === 8 ? a[7] : img?.height;
    if (w && h && covers(this, w, h)) bump(this.canvas);
    return di.call(this, img, ...a);
  };
  const ft = P.fillText;
  P.fillText = function (text, x, y) {
    try {
      const cv = this.canvas;
      if (cv && cv.isConnected) {
        const e = cur(cv);
        if (e.recs.length >= 400) e.recs = e.recs.slice(-200);
        const m = this.getTransform();
        const fs = parseFloat((/(\d+(?:\.\d+)?)px/.exec(this.font) ?? [0, "10"])[1]);
        const w = this.measureText(String(text)).width;
        const al = this.textAlign, bl = this.textBaseline;
        const x0 = al === "center" ? x - w / 2 : al === "right" || al === "end" ? x - w : x;
        const y0 = bl === "middle" ? y - fs / 2 : bl === "top" || bl === "hanging" ? y : bl === "bottom" || bl === "ideographic" ? y - fs : y - fs * 0.8;
        const pts = [[x0, y0], [x0 + w, y0], [x0, y0 + fs], [x0 + w, y0 + fs]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
        const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
        // canvas pixels; mapped to CSS px when measured (the canvas may move or resize between frames)
        e.recs.push({ t: String(text).slice(0, 80), fs: fs * Math.hypot(m.a, m.b), x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), alpha: this.globalAlpha });
      }
    } catch { /* never break the page */ }
    return ft.apply(this, arguments);
  };
}

/** @returns {object} metrics */
export function measureStage() {
  const R = (r) => ({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
  // visible to the child: a box, not hidden, and an EFFECTIVE opacity (the product over its ancestors) above 5%. The
  // element's own opacity alone was not enough: on the live lesson page a board fading out (or a hidden earlier piece)
  // sits under a transparent ancestor, and its words were measured as overlapping the board on screen (round 3 forge:
  // Q3.apart on 8/12 taxila.dev boards that the same boards rendered alone never showed)
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return false;
    let o = 1;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.visibility === "hidden" || s.display === "none" || s.contentVisibility === "hidden") return false;
      o *= Number(s.opacity);
      if (o <= 0.05) return false;
    }
    // a screen-reader-only run (1 x 1 px, clipped) is not on the screen
    return !(r.width <= 2 && r.height <= 2);
  };
  const inside = (a, b, tol = 1) => a.x >= b.x - tol && a.y >= b.y - tol && a.x + a.w <= b.x + b.w + tol && a.y + a.h <= b.y + b.h + tol;
  // the on-screen scale of an HTML element: the product of its ancestors' transforms and zoom (not rect / offsetWidth,
  // whose integer rounding read a 16 px word as 15.7 px)
  const scaleOf = (el) => {
    let k = 1;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.transform && s.transform !== "none") { try { const m = new DOMMatrixReadOnly(s.transform); k *= Math.hypot(m.a, m.b) || 1; } catch { /* unparsable: ignore */ } }
      const z = parseFloat(s.zoom); if (Number.isFinite(z) && z > 0 && z !== 1) k *= z;
    }
    return k;
  };
  const out = { vw: innerWidth, vh: innerHeight, tray: null, box: null, kind: null, phase: null, canvas: null, svg: null, texts: [], targets: [], overlaps: [], duplicates: 0, content: null, errors: [] };
  const tray = document.querySelector('[data-testid="tray"]');
  if (tray && vis(tray)) out.tray = R(tray.getBoundingClientRect());
  const stage = document.querySelector('[data-testid="studio-stage"]');
  const boxEl = document.querySelector('[data-testid="studio-box"]');
  if (stage) { out.kind = stage.getAttribute("data-kind"); out.phase = stage.getAttribute("data-phase"); out.legible = stage.getAttribute("data-legible"); out.framed = stage.getAttribute("data-framed") === "1"; }
  const root = boxEl && vis(boxEl) ? boxEl : tray;
  if (!root) return out;
  const region = R(root.getBoundingClientRect());
  out.box = region;

  // ── canvas (Studio v2 engines): size, backing store, and how much is not the ground (blank check) ──
  const cv = [...root.querySelectorAll("canvas")].filter(vis).sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (cv) {
    const cr = R(cv.getBoundingClientRect());
    let ink = null;
    try {
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const W = cv.width, H = cv.height, step = Math.max(1, Math.floor(Math.min(W, H) / 60));
        const d = ctx.getImageData(0, 0, W, H).data;
        const at = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
        const g = at(2, 2);
        let n = 0, diff = 0, minX = W, minY = H, maxX = 0, maxY = 0;
        for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
          const p = at(x, y); n++;
          if (Math.abs(p[0] - g[0]) + Math.abs(p[1] - g[1]) + Math.abs(p[2] - g[2]) > 48) { diff++; if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
        }
        ink = { share: n ? diff / n : 0, bbox: diff ? [minX / W, minY / H, maxX / W, maxY / H] : null };
      }
    } catch { ink = null; }
    out.canvas = { ...cr, backing: [cv.width, cv.height], ink };
  }

  // ── SVG (whiteboards, skeletons): drawn elements and their union box ──
  const svg = [...root.querySelectorAll("svg")].filter(vis).sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  let ux = Infinity, uy = Infinity, ux2 = -Infinity, uy2 = -Infinity, drawn = 0;
  const grow = (r) => { if (r.width <= 0 && r.height <= 0) return; ux = Math.min(ux, r.left); uy = Math.min(uy, r.top); ux2 = Math.max(ux2, r.right); uy2 = Math.max(uy2, r.bottom); };
  if (svg) {
    const vb = svg.viewBox?.baseVal;
    out.svg = { ...R(svg.getBoundingClientRect()), viewBox: vb && vb.width ? [vb.width, vb.height] : null };
    // a whiteboard draws each op in a <g data-op>; its ground rect and grid paper are outside them and are not content
    const opsOnly = !!svg.querySelector("[data-op]");
    for (const el of svg.querySelectorAll("path, line, polyline, polygon, circle, ellipse, rect, text")) {
      if (!vis(el)) continue;
      if (opsOnly && !el.closest("[data-op]")) continue;
      const tag = el.tagName.toLowerCase();
      // a full-board ground rect is not content
      const r = el.getBoundingClientRect();
      if (tag === "rect" && r.width >= region.w * 0.97 && r.height >= region.h * 0.97) continue;
      const s = getComputedStyle(el);
      if (tag !== "text" && (s.stroke === "none" || !s.stroke) && (s.fill === "none" || s.fill === "transparent" || s.fill === "rgba(0, 0, 0, 0)")) continue;
      drawn++;
      grow(r);
      // a shape cut by the box edge (drawn past the board): part of the picture is missing
      if (tag !== "text" && (r.left < region.x - 2 || r.top < region.y - 2 || r.right > region.x + region.w + 2 || r.bottom > region.y + region.h + 2)) out.shapesCut = (out.shapesCut ?? 0) + 1;
    }
  }

  // ── occlusion: a DOM text run whose middle lies under another painted element (a pill, a card) is hidden from the
  //    child even when no two text rects overlap. Chrome with pointer-events:none is made hit-testable for this
  //    measurement only (an injected style, removed below).
  const peStyle = document.createElement("style");
  peStyle.textContent = '[data-testid="studio-box"] *, [data-testid="tray"] * { pointer-events: auto !important; }';
  document.head.appendChild(peStyle);
  const effOpacity = (el) => { let o = 1; for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const s = getComputedStyle(a); if (s.visibility === "hidden" || s.display === "none") return 0; o *= Number(s.opacity); } return o; };
  const paints = (h) => {
    if (/^(CANVAS|IMG|VIDEO|svg)$/i.test(h.tagName)) return true;
    const s = getComputedStyle(h);
    const bg = s.backgroundColor.match(/[\d.]+/g);
    const bgOn = bg ? (bg.length < 4 ? true : Number(bg[3]) > 0.05) && s.backgroundColor !== "transparent" : false;
    return bgOn || s.backgroundImage !== "none" || (s.backdropFilter && s.backdropFilter !== "none") || [...h.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
  };
  // → false | "chrome" (the stage's own corner control) | true (another painted element)
  const coveredAt = (el, x, y) => {
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
    for (const h of document.elementsFromPoint(x, y)) {
      if (h === el || el.contains(h) || h.contains(el)) return false;
      if (effOpacity(h) > 0.05 && paints(h)) return h.closest?.(".st-ctrl, .st-menu") ? "chrome" : true;
    }
    return false;
  };

  // ── text runs (DOM and SVG): rendered px, clipping, ellipsis ──
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.replace(/\s+/g, " ").trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || seen.has(el) || !vis(el) || el.closest("script,style")) continue;
    seen.add(el);
    const rng = document.createRange(); rng.selectNodeContents(n);
    const rects = [...rng.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) continue;
    const u = rects.reduce((a, r) => ({ x: Math.min(a.x, r.left), y: Math.min(a.y, r.top), x2: Math.max(a.x2, r.right), y2: Math.max(a.y2, r.bottom) }), { x: 1e9, y: 1e9, x2: -1e9, y2: -1e9 });
    const rr = { x: Math.round(u.x), y: Math.round(u.y), w: Math.round(u.x2 - u.x), h: Math.round(u.y2 - u.y) };
    const cs = getComputedStyle(el);
    let px = parseFloat(cs.fontSize) || 0;
    if (el instanceof SVGElement) {
      const m = el.getScreenCTM?.();
      if (m) px *= Math.hypot(m.a, m.b);
    } else px *= scaleOf(el);
    const ellipsis = el instanceof HTMLElement && /hidden|clip/.test(cs.overflow + cs.overflowX + cs.overflowY) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2);
    // the stage's own chrome (the corner menu) is not the piece
    const chrome = !!el.closest(".st-ctrl, .st-chip");
    let covered = false;
    if (!(el instanceof SVGElement)) {
      const my = rr.y + rr.h / 2;
      const hits = [0.15, 0.5, 0.85].map((f) => coveredAt(el, rr.x + rr.w * f, my));
      // the stage's own control over ANY part of a word hides it; anything else must cover most of it
      covered = hits.includes("chrome") || hits.filter(Boolean).length >= 2;
    }
    out.texts.push({ t: t.slice(0, 80), px: Math.round(px * 10) / 10, ...rr, outside: !inside(rr, region), ellipsis, chrome, svg: el instanceof SVGElement, ...(covered ? { covered } : {}) });
    if (!chrome) grow({ left: rr.x, top: rr.y, right: rr.x + rr.w, bottom: rr.y + rr.h, width: rr.w, height: rr.h });
  }
  peStyle.remove();
  // ── text drawn on a canvas (canvasTextProbe): the latest frame of each canvas inside the region, at ≥ 50% opacity ──
  const ct = window.__forge3Canvas;
  if (ct && ct.byCanvas) {
    for (const [cv, e] of ct.byCanvas) {
      if (!cv.isConnected || !root.contains(cv) || !vis(cv)) continue;
      const r = cv.getBoundingClientRect();
      const sx = r.width / (cv.width || 1), sy = r.height / (cv.height || 1);
      for (const q of e.recs) {
        if ((q.alpha ?? 1) < 0.5 || !String(q.t).trim()) continue;
        const rr = { x: Math.round(r.left + q.x * sx), y: Math.round(r.top + q.y * sy), w: Math.round(q.w * sx), h: Math.round(q.h * sy) };
        out.texts.push({ t: q.t, px: Math.round(q.fs * sx * 10) / 10, ...rr, outside: !inside(rr, region), ellipsis: false, chrome: false, svg: false, canvas: true });
        grow({ left: rr.x, top: rr.y, right: rr.x + rr.w, bottom: rr.y + rr.h, width: rr.w, height: rr.h });
      }
    }
    out.canvasText = out.texts.filter((x) => x.canvas).length;
  }
  // overlap between two different text runs (≥ 20% of the smaller run's area). A run's client rect is its LINE box (glyph
  // ascent + descent + leading); the inked glyphs sit in roughly its middle 70%, so two stacked lines of one label touch
  // without overlapping: each rect is trimmed 15% top and bottom before comparing.
  const T = out.texts.filter((x) => !x.chrome).map((x) => ({ ...x, y: x.y + x.h * 0.15, h: x.h * 0.7 }));
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i], b = T[j];
    const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const small = Math.min(a.w * a.h, b.w * b.h);
    // the SAME words drawn twice on the same spot (a continue board that re-draws its earlier board's ops) look like one
    // run to the child: counted as a duplicate draw (soft), never as an overlap
    if (small > 0 && a.t === b.t && ix * iy >= 0.9 * Math.max(a.w * a.h, b.w * b.h)) { out.duplicates = (out.duplicates ?? 0) + 1; continue; }
    // a word being WRITTEN (the whiteboard's handwriting reveal draws the partial run over its own final run: "togeth" on
    // "together") is one run to the child: measured live on taxila.dev and locally, every live-page Q3 was this pattern
    if (small > 0 && (a.t.startsWith(b.t) || b.t.startsWith(a.t)) && ix * iy >= 0.9 * small) { out.writing = (out.writing ?? 0) + 1; continue; }
    if (small > 0 && ix * iy >= 0.2 * small) out.overlaps.push({ a: a.t.slice(0, 30), b: b.t.slice(0, 30), share: Math.round((ix * iy / small) * 100) / 100 });
  }
  for (const el of root.querySelectorAll("button, [role=button], a[href], input, [data-tap], [draggable=true]")) {
    if (!vis(el) || el.closest(".st-ctrl")) continue;
    const r = R(el.getBoundingClientRect());
    out.targets.push({ label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40), w: r.w, h: r.h, outside: !inside(r, region) });
  }
  if (Number.isFinite(ux)) {
    const cx = Math.max(region.x, ux), cy = Math.max(region.y, uy), cx2 = Math.min(region.x + region.w, ux2), cy2 = Math.min(region.y + region.h, uy2);
    out.content = { x: Math.round(cx), y: Math.round(cy), w: Math.round(Math.max(0, cx2 - cx)), h: Math.round(Math.max(0, cy2 - cy)), drawn };
  } else if (out.canvas?.ink?.bbox) {
    const [a, b, c, d] = out.canvas.ink.bbox;
    out.content = { x: Math.round(out.canvas.x + a * out.canvas.w), y: Math.round(out.canvas.y + b * out.canvas.h), w: Math.round((c - a) * out.canvas.w), h: Math.round((d - b) * out.canvas.h), drawn: 0 };
  }
  return out;
}

/**
 * A whole document as the child sees it in its frame (a module engine's sandboxed iframe): text runs at their rendered px
 * (a transformed / fitted engine included), targets, and whether anything lies past the frame's viewport where the child
 * cannot reach it (cut off) or only by scrolling. Runs inside the frame (Playwright frame.evaluate). Self-contained.
 */
export function measureDocument() {
  const vw = innerWidth, vh = innerHeight;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return false;
    let o = 1;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const s = getComputedStyle(a); if (s.visibility === "hidden" || s.display === "none") return false; o *= Number(s.opacity); if (o <= 0.05) return false; }
    return true;
  };
  const scaleOf = (el) => {
    let k = 1;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.transform && s.transform !== "none") { try { const m = new DOMMatrixReadOnly(s.transform); k *= Math.hypot(m.a, m.b) || 1; } catch { /* unparsable: ignore */ } }
      const z = parseFloat(s.zoom); if (Number.isFinite(z) && z > 0 && z !== 1) k *= z;
    }
    return k;
  };
  const out = { vw, vh, texts: [], targets: [], cut: 0, scrollable: false, fit: null };
  const de = document.documentElement, body = document.body;
  const bs = getComputedStyle(body), hs = getComputedStyle(de);
  out.scrollable = (/(auto|scroll)/.test(bs.overflowY) && body.scrollHeight > body.clientHeight + 2) || (/(auto|scroll)/.test(hs.overflowY) && de.scrollHeight > vh + 2) || (hs.overflowY === "visible" && bs.overflowY === "visible" && de.scrollHeight > vh + 2);
  out.fit = document.getElementById("root")?.dataset?.fit ?? null;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.replace(/\s+/g, " ").trim();
    const el = n.parentElement;
    if (!t || !el || seen.has(el) || !vis(el) || el.closest("script,style")) continue;
    seen.add(el);
    const rng = document.createRange(); rng.selectNodeContents(n);
    const rs = [...rng.getClientRects()].filter((r) => r.width > 0);
    if (!rs.length) continue;
    const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top)), x2 = Math.max(...rs.map((r) => r.right)), y2 = Math.max(...rs.map((r) => r.bottom));
    let px = parseFloat(getComputedStyle(el).fontSize) || 0;
    if (el instanceof SVGElement) { const m = el.getScreenCTM?.(); if (m) px *= Math.hypot(m.a, m.b); }
    else px *= scaleOf(el);
    const outside = x < -1 || y < -1 || x2 > vw + 1 || y2 > vh + 1;
    if (outside) out.cut++;
    out.texts.push({ t: t.slice(0, 60), px: Math.round(px * 10) / 10, outside });
  }
  for (const el of document.querySelectorAll("button, [role=button], input, [data-tap]")) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    const outside = r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1;
    if (outside) out.cut++;
    out.targets.push({ label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), outside });
  }
  return out;
}
