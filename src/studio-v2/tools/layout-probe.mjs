// Studio v2 LAYOUT PROBE: plays every engine headless in node and refuses the overlap and cut-off faults judges name in
// screenshots ("words disagree with the picture" is the judge's; this is the geometry). No browser: the engine draws into a
// RECORDING 2D context (every text run and every filled shape, as world-space boxes, in draw order), text is measured with
// the stage faces' real advance widths (tests/fixtures/studio-v2-text-metrics.json, measured in Chromium by
// src/studio-v2/tools/text-metrics.mjs), and the host's DOM chrome (HUD row, task pill, type label, teacher PiP) is laid out
// from host.css at the two judged tray boxes (server/forge3/qa/viewports.js: phone 412 → 380 × 519, laptop 1366 → 752 × 408;
// the stage is the largest 16:10 box inside). Time is virtual (fixed 1/30 s frames, timers on the same clock) and the
// engine's own bot() plays, so a run reaches the cards, reveals and end states a child reaches.
//
// What it refuses (each must persist ≥ PERSIST samples, 0.1 s apart, so a fade, a slide-in or a falling item crossing
// something for a moment is not a fault; a still the judge is shown is):
//   text×text      two different text runs overlapping (≥ 20 % of the smaller, line boxes trimmed 15 % top and bottom)
//   text×card      a text run crossing the edge of a CARD it is not inside (a card is an opaque filled shape holding text)
//   covered        a text run under an opaque shape drawn after it (≥ 15 % of the text; wholly under it counts too)
//   card×card      two cards partly overlapping (neither inside the other)
//   cut            a text run or a card partly outside the 1000 × 625 world (the stage edge cuts it)
//   chrome         a text run or a card under the host's DOM chrome (HUD row, task pill; type label, PiP)
// Only what is on the TOP layer is judged: a full-stage scrim (intro, end card) puts everything drawn before it behind it.
// FX pops and `decor` text (animation, not resting labels) are not judged.
//
//   node src/studio-v2/tools/layout-probe.mjs [archetype…] [--catalogue N] [--json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const W = 1000, H = 625;
export const PERSIST = 5;
/** The judged tray boxes (server/forge3/qa/viewports.js GATE_VIEWPORTS, without the 360 phone). */
/** The judged tray boxes (server/forge3/qa/viewports.js GATE_VIEWPORTS, without the 360 phone, which shows the board twin),
 *  for an older child and for a young one (classes 4-5: the 43-unit text floor, 16 px chrome). */
export const BOXES = [
  { vp: "p412", tray: { w: 380, h: 519 }, young: true },
  { vp: "l1366", tray: { w: 752, h: 408 }, young: false },
  { vp: "l1366y", tray: { w: 752, h: 408 }, young: true },
];

// ── text metrics ────────────────────────────────────────────────────────────────────────────────────────────────────────
const METRICS = JSON.parse(fs.readFileSync(path.join(repo, "tests/fixtures/studio-v2-text-metrics.json"), "utf8")).widths;
const FAMILY = [["Bricolage", "display"], ["Geist Mono", "mono"], ["Atkinson", "ui"]];
function parseFont(font) {
  const m = /^\s*(?:(italic|normal)\s+)?(\d{3}|bold|normal)?\s*([\d.]+)px\s+(.*)$/.exec(font || "") ?? [];
  const w = m[2] === "bold" ? 700 : m[2] === "normal" || !m[2] ? 400 : +m[2];
  const fam = FAMILY.find(([n]) => (m[4] || "").includes(n))?.[1] ?? "ui";
  return { size: m[3] ? +m[3] : 10, weight: Math.min(800, Math.max(400, Math.round(w / 100) * 100)), fam };
}
/** Width of `s` in px at `font` (a CSS font string), letter spacing `ls` px per character. */
export function textWidth(s, font, ls = 0) {
  const f = parseFont(font), tab = METRICS[`${f.fam}:${f.weight}`];
  let w = 0, n = 0;
  for (const ch of String(s)) { n++; const a = tab[ch]; w += a != null ? a : /[ऀ-ॿ]/.test(ch) ? 50 : 60; }
  return (w * f.size) / 100 + ls * n;
}

// ── the recording 2D context ────────────────────────────────────────────────────────────────────────────────────────────
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
/** A gradient remembers its stops' alphas: a fill that fades to nothing (a beam, a glow) is not an opaque shape. */
const grad = () => ({ stops: [], addColorStop(_o, c) { this.stops.push(styleAlpha(c)); } });
class RecCtx {
  constructor(rec) {
    this.rec = rec;   // null: a sink (layers, glow sprites)
    this.canvas = { width: W, height: H };
    this.s = { m: [1, 0, 0, 1, 0, 0], globalAlpha: 1, globalCompositeOperation: "source-over", font: "10px sans-serif", textAlign: "start", textBaseline: "alphabetic", letterSpacing: "0px", clip: null,
      fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, lineCap: "butt", lineJoin: "miter", shadowBlur: 0, shadowColor: "transparent", filter: "none", lineDashOffset: 0, dash: [] };
    this.stack = []; this.path = null; this.flags = null;
    this.imageSmoothingEnabled = true; this.miterLimit = 10; this.shadowOffsetX = 0; this.shadowOffsetY = 0; this.direction = "inherit"; this.fontKerning = "auto";
  }
  // state properties (saved / restored)
  get globalAlpha() { return this.s.globalAlpha; } set globalAlpha(v) { if (Number.isFinite(v) && v >= 0 && v <= 1) this.s.globalAlpha = v; }
  get globalCompositeOperation() { return this.s.globalCompositeOperation; } set globalCompositeOperation(v) { this.s.globalCompositeOperation = v; }
  get font() { return this.s.font; } set font(v) { this.s.font = v; }
  get textAlign() { return this.s.textAlign; } set textAlign(v) { this.s.textAlign = v; }
  get textBaseline() { return this.s.textBaseline; } set textBaseline(v) { this.s.textBaseline = v; }
  get letterSpacing() { return this.s.letterSpacing; } set letterSpacing(v) { this.s.letterSpacing = v; }
  get fillStyle() { return this.s.fillStyle; } set fillStyle(v) { this.s.fillStyle = v; }
  get strokeStyle() { return this.s.strokeStyle; } set strokeStyle(v) { this.s.strokeStyle = v; }
  get lineWidth() { return this.s.lineWidth; } set lineWidth(v) { this.s.lineWidth = v; }
  get lineCap() { return this.s.lineCap; } set lineCap(v) { this.s.lineCap = v; }
  get lineJoin() { return this.s.lineJoin; } set lineJoin(v) { this.s.lineJoin = v; }
  get shadowBlur() { return this.s.shadowBlur; } set shadowBlur(v) { this.s.shadowBlur = v; }
  get shadowColor() { return this.s.shadowColor; } set shadowColor(v) { this.s.shadowColor = v; }
  get filter() { return this.s.filter; } set filter(v) { this.s.filter = v; }
  get lineDashOffset() { return this.s.lineDashOffset; } set lineDashOffset(v) { this.s.lineDashOffset = v; }
  save() { this.stack.push({ ...this.s, dash: [...this.s.dash] }); }
  restore() { if (this.stack.length) this.s = this.stack.pop(); }
  // transform
  setTransform(a, b, c, d, e, f) { if (typeof a === "object" && a) this.s.m = [a.a, a.b, a.c, a.d, a.e, a.f]; else this.s.m = [a, b, c, d, e, f].map((v) => (Number.isFinite(v) ? v : 0)); }
  resetTransform() { this.s.m = [1, 0, 0, 1, 0, 0]; }
  getTransform() { const [a, b, c, d, e, f] = this.s.m; return { a, b, c, d, e, f, m11: a, m12: b, m21: c, m22: d, m41: e, m42: f, is2D: true, isIdentity: a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0 }; }
  transform(a, b, c, d, e, f) { this.s.m = mul(this.s.m, [a, b, c, d, e, f]); }
  translate(x, y) { this.s.m = mul(this.s.m, [1, 0, 0, 1, x, y]); }
  scale(x, y) { this.s.m = mul(this.s.m, [x, 0, 0, y, 0, 0]); }
  rotate(r) { const c = Math.cos(r), s = Math.sin(r); this.s.m = mul(this.s.m, [c, s, -s, c, 0, 0]); }
  pt(x, y) { const m = this.s.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
  // paths: a world-space bounding box, points transformed when they are added (canvas semantics)
  beginPath() { this.path = null; }
  add(x, y) { if (!Number.isFinite(x) || !Number.isFinite(y)) return; const [X, Y] = this.pt(x, y); const p = this.path; if (!p) this.path = [X, Y, X, Y]; else { p[0] = Math.min(p[0], X); p[1] = Math.min(p[1], Y); p[2] = Math.max(p[2], X); p[3] = Math.max(p[3], Y); } }
  moveTo(x, y) { this.add(x, y); } lineTo(x, y) { this.add(x, y); } closePath() {}
  rect(x, y, w, h) { this.add(x, y); this.add(x + w, y); this.add(x, y + h); this.add(x + w, y + h); }
  roundRect(x, y, w, h) { this.rect(x, y, w, h); }
  quadraticCurveTo(cx, cy, x, y) { this.add(cx, cy); this.add(x, y); }
  bezierCurveTo(a, b, c, d, x, y) { this.add(a, b); this.add(c, d); this.add(x, y); }
  arcTo(x1, y1, x2, y2) { this.add(x1, y1); this.add(x2, y2); }
  arc(x, y, r, a0, a1, ccw) { this.ellipse(x, y, r, r, 0, a0, a1, ccw); }
  ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
    rx = Math.abs(rx); ry = Math.abs(ry);
    let span = ccw ? a0 - a1 : a1 - a0; if (!Number.isFinite(span)) return;
    if (span < 0 || span > Math.PI * 2) span = ((span % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) || (Math.abs(a1 - a0) >= Math.PI * 2 ? Math.PI * 2 : 0);
    const n = 24, cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
    for (let i = 0; i <= n; i++) { const a = a0 + (ccw ? -1 : 1) * span * (i / n), ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; this.add(x + ex * cr - ey * sr, y + ex * sr + ey * cr); }
  }
  clip() { if (!this.path) return; const c = this.s.clip, p = this.path; this.s.clip = c ? [Math.max(c[0], p[0]), Math.max(c[1], p[1]), Math.min(c[2], p[2]), Math.min(c[3], p[3])] : [...p]; }
  fill() { if (this.path) this.shape(this.path, this.s.fillStyle); }
  stroke() {}
  fillRect(x, y, w, h) { const keep = this.path; this.path = null; this.rect(x, y, w, h); const b = this.path; this.path = keep; if (b) this.shape(b, this.s.fillStyle); }
  strokeRect() {} clearRect() {}
  shape(b, style) {
    if (!this.rec || !this.rec.on) return;
    const a = this.s.globalAlpha, comp = this.s.globalCompositeOperation;
    if (comp !== "source-over" || a < 0.05) return;
    const box = this.clipped(b); if (!box) return;
    this.rec.shape({ box, alpha: a * styleAlpha(style), raw: b });
  }
  clipped(b) { const c = this.s.clip; if (!c) return [...b]; const r = [Math.max(b[0], c[0]), Math.max(b[1], c[1]), Math.min(b[2], c[2]), Math.min(b[3], c[3])]; return r[2] - r[0] > 0.5 && r[3] - r[1] > 0.5 ? r : null; }
  // text
  measureText(s) { const w = textWidth(s, this.s.font, parseFloat(this.s.letterSpacing) || 0), f = parseFont(this.s.font); return { width: w, actualBoundingBoxAscent: f.size * 0.75, actualBoundingBoxDescent: f.size * 0.2, actualBoundingBoxLeft: 0, actualBoundingBoxRight: w, fontBoundingBoxAscent: f.size * 0.9, fontBoundingBoxDescent: f.size * 0.25 }; }
  fillText(s, x, y, maxW) { this.text(s, x, y, maxW); }
  strokeText(s, x, y, maxW) { this.text(s, x, y, maxW); }
  text(s, x, y, maxW) {
    if (!this.rec || !this.rec.on || this.s.globalAlpha < 0.5 || this.s.globalCompositeOperation !== "source-over") return;
    if (this.flags && (this.flags.decor || this.flags.fx)) return;
    s = String(s); if (!s.trim()) return;
    const f = parseFont(this.s.font); let w = this.measureText(s).width; if (maxW != null && maxW > 0) w = Math.min(w, maxW);
    const al = this.s.textAlign, bl = this.s.textBaseline;
    const lx = al === "center" ? x - w / 2 : al === "right" || al === "end" ? x - w : x;
    const ty = bl === "middle" ? y - f.size * 0.4 : bl === "top" || bl === "hanging" ? y : bl === "bottom" || bl === "ideographic" ? y - f.size * 0.85 : y - f.size * 0.78;
    const pts = [[lx, ty], [lx + w, ty], [lx, ty + f.size * 0.85], [lx + w, ty + f.size * 0.85]].map(([px, py]) => this.pt(px, py));
    const b = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
    const box = this.clipped(b); if (!box) return;
    this.rec.text({ s, box, raw: b });
  }
  // the rest of the 2D API: harmless
  drawImage() {} putImageData() {} getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(4, (w | 0) * (h | 0) * 4)), width: w, height: h }; }
  createImageData(w, h) { return { data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h }; }
  createLinearGradient() { return grad(); } createRadialGradient() { return grad(); } createConicGradient() { return grad(); } createPattern() { return {}; }
  setLineDash(d) { this.s.dash = Array.isArray(d) ? [...d] : []; } getLineDash() { return [...this.s.dash]; }
  isPointInPath() { return false; } isPointInStroke() { return false; }
}
/** The alpha a fill style carries (rgba(…, a) / #rrggbbaa); a gradient or pattern counts as opaque. */
function styleAlpha(st) {
  if (st && Array.isArray(st.stops)) return st.stops.length ? Math.min(...st.stops) : 1;
  if (typeof st !== "string") return 1;
  let m = /rgba?\([^)]*?,\s*([\d.]+)\s*\)/.exec(st); if (m) return +m[1];
  m = /^#[0-9a-f]{6}([0-9a-f]{2})$/i.exec(st); if (m) return parseInt(m[1], 16) / 255;
  if (st === "transparent") return 0;
  return 1;
}
const fakeCanvas = () => ({ width: 300, height: 150, style: {}, getContext: () => new RecCtx(null), toDataURL: () => "", addEventListener() {}, removeEventListener() {} });

// ── the host's DOM chrome as the LESSON stage shows it (src/studio/StudioStage.tsx + studio.css `.st-box`, over host.css) ──
// What the judged render (scripts/approve-check.mjs → server/forge3/qa) shows: the stage box is the tray minus its inset
// (src/studio/stageBox.ts: 2 px on a phone-width tray, else 8), at 16:10. On a phone-width tray (≤ 420 px) the HUD row and
// the task pill sit in the RAIL band above the world (RAIL_PX 112, 124 young), so nothing of the chrome covers the world.
// On a wider tray they sit over the world's top (host.css): the HUD row centred between 19cqw and (26cqh + 1cqw) from the
// right, readouts at a 14 px floor (16 young), score-like readouts (chain, combo, streak, acc, prec, time) left out; the task
// pill below it (12.4cqh) or at the top (2.2cqh), its goal at max(14 px, 1.85cqw). No type label (hidden in the lesson) and
// no teacher PiP (the judged render mounts none). Checked against Chromium's layout of host.css, 2026-11-11.
const clampN = (lo, v, hi) => Math.max(lo, Math.min(hi, v));
const PHONE_TRAY_MAX_W = 420, RAIL_PX = 112, RAIL_PX_YOUNG = 124;
const HIDDEN_HUD = new Set(["chain", "combo", "streak", "acc", "prec", "time"]);
function wrapCount(words, font, maxW) { let n = 0, cur = ""; for (const w of words) { const t = cur ? cur + " " + w : w; if (!cur || textWidth(t, font) <= maxW) cur = t; else { n++; cur = w; } } return n + (cur ? 1 : 0); }
/** The stage's css px width in a tray (src/studio/stageBox.ts boxFor, without a PiP). */
export function stageWidth(tray, young = false) {
  const phone = tray.w <= PHONE_TRAY_MAX_W, inset = phone ? 2 : 8, rail = phone ? (young ? RAIL_PX_YOUNG : RAIL_PX) : 0;
  return Math.min(tray.w - 2 * inset, (tray.h - rail - 2 * inset) * 1.6);
}
/** The chrome over the world at a tray box, in world units: [{ name, box: [x0, y0, x1, y1] }]. */
export function chromeRects(tray, ui, young = false) {
  if (tray.w <= PHONE_TRAY_MAX_W) return [];   // the rail band: above the world
  const Sw = stageWidth(tray, young), cqw = Sw / 100, cqh = Sw / 160, k = Sw / W, floor = young ? 16 : 14;
  const out = [];
  const toW = (x, y, w, h, name) => out.push({ name, box: [x / k, y / k, (x + w) / k, (y + h) / k] });
  const hud = ui.hudOn ? ui.hud.filter((d) => !HIDDEN_HUD.has(d.key)) : [];
  if (hud.length) {
    const f = Math.max(floor, 1.15 * cqw), bf = Math.max(floor, 2.1 * cqw);
    const ws = hud.map((d) => 2 + 1.9 * f + textWidth(String(d.label).toUpperCase(), `600 ${f}px Geist Mono`, 0.07 * f) + 0.55 * f + Math.max(0, textWidth(d.value ?? "", `700 ${bf}px Bricolage`, -0.01 * bf)) + (d.meter ? 0.55 * f + clampN(24, 6 * cqw, 70) : 0));
    const total = ws.reduce((a, b) => a + b, 0) + 0.9 * cqw * (ws.length - 1), l = 19 * cqw, r = Sw - (26 * cqh + cqw);
    let x = (l + r) / 2 - total / 2; const h = 2 + 1.24 * f + bf;
    ws.forEach((w, i) => { toW(x, 2.2 * cqh, w, h, `hud:${hud[i].key}`); x += w + 0.9 * cqw; });
  }
  if (ui.taskOn) {
    const ml = (19 * cqw - 26 * cqh - cqw) / 2, sf = Math.max(floor, 1.15 * cqw), gf = Math.max(floor, 1.85 * cqw);
    const stepW = ui.step ? textWidth(ui.step, `600 ${sf}px Geist Mono`, 0.08 * sf) + 12 : 0;
    const fixed = 2 + 12 + 25 + 12 + stepW + 16.5, goalFont = `600 ${gf}px Atkinson`;
    const avail = Math.min(Sw - 19 * cqw - 26 * cqh - 3 * cqw, Sw / 2 - ml);
    const natural = fixed + textWidth(ui.goal, goalFont), w = Math.min(natural, avail);
    const lines = natural <= avail ? 1 : wrapCount(String(ui.goal).split(/\s+/).filter(Boolean), goalFont, w - fixed);
    const h = 2 + 21 + Math.max(25, lines * gf * 1.25), top = ui.hudOn ? 12.4 * cqh : 2.2 * cqh;
    toW(Sw / 2 + ml - w / 2, top, w, h, "task");
  }
  return out;
}

// ── checks over one sampled frame ───────────────────────────────────────────────────────────────────────────────────────
const area = (b) => Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
const inter = (a, b) => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
const iArea = (a, b) => { const i = inter(a, b); return i[2] > i[0] && i[3] > i[1] ? area(i) : 0; };
const inside = (a, b, tol = 2) => a[0] >= b[0] - tol && a[1] >= b[1] - tol && a[2] <= b[2] + tol && a[3] <= b[3] + tol;
const trim = (b) => { const h = b[3] - b[1]; return [b[0], b[1] + h * 0.15, b[2], b[3] - h * 0.15]; };
const deep = (a, b, d = 2) => { const i = inter(a, b); return i[2] - i[0] > d && i[3] - i[1] > d; };
const short = (s) => String(s).replace(/\s+/g, " ").slice(0, 24);
/** One frame's items (draw order) → fault list [{ kind, a, b }]. PURE. */
export function frameFaults(items, chrome, { touch = false } = {}) {
  // the top layer: everything after the last full-stage scrim
  let from = 0;
  items.forEach((it, i) => { if (it.t === "shape" && it.alpha >= 0.3 && area(it.box) >= 0.9 * W * H) from = i + 1; });
  const top = items.slice(from).map((it, i) => ({ ...it, i }));
  const texts = [], seen = new Set();
  for (const t of top) if (t.t === "text") { const k = t.s + "|" + t.box.map((v) => Math.round(v)).join(","); if (!seen.has(k)) { seen.add(k); texts.push(t); } }
  // opaque shapes: not a sliver, not a backdrop (a band across the whole stage: ground, sea, a strip of sky)
  const solids = top.filter((s) => s.t === "shape" && s.alpha >= 0.5 && s.box[2] - s.box[0] >= 16 && s.box[3] - s.box[1] >= 16 && area(s.box) <= 0.45 * W * H
    && s.raw[2] - s.raw[0] < 0.9 * W && s.raw[3] - s.raw[1] < 0.9 * H);
  // a card: an opaque shape that holds (the centre of) a text run drawn after it
  const cards = solids.filter((s) => texts.some((t) => t.i > s.i && inside(t.box, s.box, 2)));
  const name = (c) => { const ts = texts.filter((t) => t.i > c.i && inside(t.box, c.box, 2)); return `card[${short(ts[0]?.s ?? "")}]`; };
  const out = [];
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j]; if (a.s === b.s && iArea(a.box, b.box) > 0.8 * area(a.box)) continue;   // a glow / outline pass
    const ta = trim(a.box), tb = trim(b.box), sm = Math.min(area(ta), area(tb));
    if (sm > 0 && iArea(ta, tb) >= 0.2 * sm) out.push({ kind: "text×text", a: short(a.s), b: short(b.s), box: inter(a.box, b.box) });
    // (opt-in, regen r3 c5-ch01-t01: a wrapped target's top line sat on the "Lakshya" label above it, a touch the 20 % rule
    // lets through and a judge called unreadable) two runs whose untrimmed boxes meet at all
    else if (touch && a.s !== b.s && iArea(a.box, b.box) > 0) out.push({ kind: "text-touch", a: short(a.s), b: short(b.s), box: inter(a.box, b.box) });
  }
  for (const t of texts) for (const c of cards) {
    if (inside(t.box, c.box, 2) || !deep(t.box, c.box, 4)) continue;
    out.push({ kind: "text×card", a: short(t.s), b: name(c), box: inter(t.box, c.box) });
  }
  for (const t of texts) for (const s of solids) if (s.i > t.i && iArea(t.box, s.box) >= 0.15 * area(t.box) && !texts.some((u) => u.i > s.i && inside(u.box, s.box, 2) && u.s === t.s)) out.push({ kind: "covered", a: short(t.s), b: cards.includes(s) ? name(s) : "shape", box: inter(t.box, s.box) });
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
    const a = cards[i], b = cards[j];
    if (inside(a.box, b.box, 1) || inside(b.box, a.box, 1) || !deep(a.box, b.box, 2)) continue;
    out.push({ kind: "card×card", a: name(a), b: name(b), box: inter(a.box, b.box) });
  }
  const frame = [0, 0, W, H];
  for (const t of texts) if (!inside(t.raw, frame, 2) && iArea(t.raw, frame) > 0) out.push({ kind: "cut", a: short(t.s), b: "frame", box: t.raw.map(Math.round) });
  for (const c of cards) if (!inside(c.raw, frame, 2) && iArea(c.raw, frame) > 0) out.push({ kind: "cut", a: name(c), b: "frame", box: c.raw.map(Math.round) });
  for (const r of chrome) {
    for (const t of texts) if (deep(t.box, r.box, 4)) out.push({ kind: "chrome", a: short(t.s), b: r.name, box: inter(t.box, r.box) });
    for (const c of cards) if (deep(c.box, r.box, 4)) out.push({ kind: "chrome", a: name(c), b: r.name, box: inter(c.box, r.box) });
  }
  return out;
}

// ── the run: one engine, one spec, one tray box ─────────────────────────────────────────────────────────────────────────
let mods = null;
export async function loadModules() {
  if (mods) return mods;
  // ext/kit.ts imports its Devanagari stylesheet: in node a stylesheet is an empty module (process-wide, CSS only)
  register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) { if (url.endsWith(".css")) return { format: "module", source: "export default {};", shortCircuit: true }; return next(url, ctx); }`));
  const [base, ext, specExt, spec, draw, fx, tween, tokens] = await Promise.all([
    import("../engines/index.ts"), import("../engines/ext/index.ts"), import("../../../shared/studio-spec-ext/index.ts"), import("../../../shared/studio-spec.ts"),
    import("../core/draw.ts"), import("../core/fx.ts"), import("../core/tween.ts"), import("../core/tokens.ts"),
  ]);
  mods = { ENGINES: { ...base.ENGINES, ...ext.ENGINES_EXT }, ENGINE_SPECS: spec.ENGINE_SPECS, ENGINE_SPECS_EXT: specExt.ENGINE_SPECS_EXT, validateAny: specExt.validateAny, gradeAny: specExt.gradeAny, makeText: draw.makeText, FX: fx.FX, Tweens: tween.Tweens, MIN: tokens.MIN };
  return mods;
}
export function defaultSpecOf(m, archetype) { return structuredClone((m.ENGINE_SPECS_EXT[archetype] ?? m.ENGINE_SPECS[archetype]).defaultSpec); }
/** Catalogue specs for an archetype (data/studio-catalogue/topics), first `n` by topic id. */
export function catalogueSpecs(archetype, n) {
  const dir = path.join(repo, "data/studio-catalogue/topics"), out = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    if (out.length >= n) break;
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const slot of ["game", "explainer"]) if (j[slot]?.archetype === archetype && j[slot]?.spec && out.length < n) out.push({ id: `${j.topicId}:${slot}`, spec: j[slot].spec });
  }
  return out;
}

function rngOf(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/**
 * Play one engine at one tray box for up to `maxSecs` virtual seconds (or 2 s after done). Returns the persistent faults:
 * [{ kind, a, b, at, frames, box }], plus run facts. Installs fake DOM globals for the duration (restored before it returns);
 * between frames it yields only to MICROtasks, so nothing else in the process runs while they are installed.
 */
export async function probe(archetype, spec, box, { maxSecs = 70, seed = 7, touch = false } = {}) {
  const m = await loadModules();
  const def = m.ENGINES[archetype];
  const v = m.validateAny(archetype, spec);
  const dt = 1 / 30;
  let now = 0;
  // virtual timers
  let timerId = 0; const timers = new Map();
  const vSet = (fn, ms = 0, ...args) => { const id = ++timerId; timers.set(id, { at: now + Math.max(0, +ms || 0) / 1000, fn: () => fn(...args) }); return id; };
  const vClear = (id) => { timers.delete(id); };
  const saved = { document: globalThis.document, window: globalThis.window, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval, rAF: globalThis.requestAnimationFrame };
  const fakeDoc = { createElement: () => fakeCanvas(), fonts: undefined, addEventListener() {}, removeEventListener() {}, hidden: false };
  const fakeWin = { setTimeout: vSet, clearTimeout: vClear, setInterval: () => 0, clearInterval() {}, devicePixelRatio: 1, addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {} };
  const install = () => Object.assign(globalThis, { document: fakeDoc, window: fakeWin, setTimeout: vSet, clearTimeout: vClear, setInterval: fakeWin.setInterval, clearInterval: fakeWin.clearInterval });
  const uninstall = () => Object.assign(globalThis, { document: saved.document, window: saved.window, setTimeout: saved.setTimeout, clearTimeout: saved.clearTimeout, setInterval: saved.setInterval, clearInterval: saved.clearInterval });
  // the recorder
  const rec = { on: false, items: [], shape(x) { this.items.push({ t: "shape", ...x }); }, text(x) { this.items.push({ t: "text", ...x }); } };
  const ctx = new RecCtx(rec);
  const tooSmall = [], safeHits = [];
  const mt = m.makeText(tooSmall, safeHits, () => 1, { young: () => !!box.young });
  const flagged = (flags) => (c, s, x, y, o) => { const prev = c.flags; c.flags = { ...flags, decor: !!o?.decor }; try { mt.text(c, s, x, y, o); } finally { c.flags = prev; } };
  const rnd = rngOf(seed * 7919 + 13);
  const ui = { hud: [], hudOn: false, taskOn: false, step: "", goal: "" };
  const handlers = [], keyHandlers = [];
  let done = false, doneAt = 0, hitstop = 0, errors = [];
  const fxo = new m.FX(false, rnd, flagged({ fx: true }));
  const tw = new m.Tweens();
  const api = {
    archetype, reducedMotion: false, seed, fx: fxo, tw, young: !!box.young, minLabel: mt.minLabel(),
    rnd, text: flagged({}), measure: mt.measure,
    layer(_k, paint) { const c = fakeCanvas(); try { paint(new RecCtx(null)); } catch { /* as the host: an empty layer */ } return c; },
    hitstop(ms) { hitstop = Math.max(hitstop, Math.min(ms, 80) / 1000); },
    onPointer(h) { handlers.push(h); }, onKey(h) { keyHandlers.push(h); },
    hud(defs) { ui.hud = defs.slice(0, 4).map((d) => ({ key: d.key, label: d.label, meter: !!d.meter, value: "" })); return { set(k, val) { const d = ui.hud.find((x) => x.key === k); if (d) d.value = String(val); }, label(k, t) { const d = ui.hud.find((x) => x.key === k); if (d) d.label = t; }, show(on) { ui.hudOn = !!on; } }; },
    task(step, goal) { ui.taskOn = true; ui.step = String(step ?? ""); ui.goal = String(goal ?? ""); },
    caption() {}, progress() {},
    chromeBottom() { return chromeRects(box.tray, ui, box.young).filter((r) => r.name === "task" || r.name.startsWith("hud:")).reduce((b, r) => Math.max(b, r.box[3]), 0); },
    answer(id, value) { return m.gradeAny(archetype, v.spec, id, value); },
    record() {}, resetLog() {}, event() {}, say() {}, done() { if (!done) { done = true; doneAt = now; } }, facts() {}, now: () => now,
  };
  const P = (x, y, down) => ({ x, y, down, type: "mouse", id: 1 });
  const fire = (type, x, y, down) => { for (const h of handlers) { try { h[type]?.(P(x, y, down)); } catch (e) { errors.push(String(e?.message ?? e)); } } };
  // bot: a queue of timed pointer steps
  let steps = [], idleUntil = 0, actions = 0;
  function plan(a) {
    if (!a) { idleUntil = now + 0.15; return; }
    if (a.type === "wait") { idleUntil = now + Math.min(2, (a.ms ?? 200) / 1000); return; }
    actions++;
    let t = now;
    if (a.type === "tap") { steps.push({ at: t, f: () => { fire("move", ...a.at, false); fire("down", ...a.at, true); } }, { at: t + 0.04, f: () => fire("up", ...a.at, false) }); t += 0.04; }
    else if (a.type === "key") { steps.push({ at: t, f: () => { for (const h of keyHandlers) { h(a.key, true); h(a.key, false); } } }); }
    else if (a.type === "drag" || a.type === "path") {
      const pts = a.type === "drag" ? [a.from, a.to] : a.points, ms = (a.ms ?? 400) / 1000;
      steps.push({ at: t, f: () => { fire("move", ...pts[0], false); fire("down", ...pts[0], true); } });
      const segs = Math.max(1, pts.length - 1), n = Math.max(2, Math.round((ms * 60) / segs));
      for (let s = 1; s < pts.length; s++) for (let i = 1; i <= n; i++) {
        const [x0, y0] = pts[s - 1], [x1, y1] = pts[s], q = i / n, e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
        t += ms / (n * segs); const X = x0 + (x1 - x0) * e, Y = y0 + (y1 - y0) * e; steps.push({ at: t, f: () => fire("move", X, Y, true) });
      }
      const [ex, ey] = pts[pts.length - 1]; t += 0.03; steps.push({ at: t, f: () => fire("up", ex, ey, false) });
    }
    idleUntil = t + (a.after ?? 0) / 1000;
  }
  const streak = new Map(), found = new Map(), lastBox = new Map();
  let inst = null, frames = 0;
  install();
  try {
    try { inst = def.create(api, v.spec); } catch (e) { return { faults: [], errors: ["boot: " + (e?.message ?? e)], actions, secs: 0, done }; }
    for (frames = 0; now < maxSecs && !(done && now - doneAt > 2); frames++) {
      await null;   // microtasks only (engines that wait on a promise, e.g. the Devanagari font gate)
      for (const [id, tm] of [...timers]) if (tm.at <= now) { timers.delete(id); try { tm.fn(); } catch (e) { errors.push(String(e?.message ?? e)); } }
      while (steps.length && steps[0].at <= now) { const s = steps.shift(); try { s.f(); } catch (e) { errors.push(String(e?.message ?? e)); } }
      if (!steps.length && now >= idleUntil && inst.bot) { let a = null; try { a = inst.bot(); } catch (e) { errors.push(String(e?.message ?? e)); } plan(a); }
      let d = dt; if (hitstop > 0) { hitstop -= d; d = 0; }
      try { tw.step(d); fxo.update(d); inst.update(d, now); } catch (e) { errors.push(String(e?.message ?? e)); }
      const sample = frames % 3 === 0;
      rec.on = sample; rec.items = [];
      ctx.s.m = [1, 0, 0, 1, 0, 0]; ctx.s.globalAlpha = 1; ctx.s.globalCompositeOperation = "source-over"; ctx.s.clip = null; ctx.stack = []; ctx.path = null;
      try { inst.render(ctx, now); } catch (e) { errors.push(String(e?.message ?? e)); }
      rec.on = false;
      if (sample) {
        const faults = frameFaults(rec.items, chromeRects(box.tray, ui, box.young), { touch }), keys = new Set();
        for (const f of faults) {
          const k = `${f.kind}|${f.a}|${f.b}`; if (keys.has(k)) continue; keys.add(k);
          // a cut must be at REST: a card sliding in or out past the edge is motion, not a still the judge is shown
          const prev = lastBox.get(k); lastBox.set(k, f.box);
          const moved = f.kind === "cut" && prev && f.box.some((v, i) => Math.abs(v - prev[i]) > 3);
          const n = moved ? 1 : (streak.get(k) ?? 0) + 1; streak.set(k, n);
          if (n >= PERSIST && !found.has(k)) found.set(k, { ...f, box: f.box.map((x) => Math.round(x)), at: +now.toFixed(1) });
        }
        for (const k of [...streak.keys()]) if (!keys.has(k)) { streak.delete(k); lastBox.delete(k); }
      }
      now += dt;
      if (errors.length > 50) break;
    }
  } finally { uninstall(); try { inst?.dispose?.(); } catch { /* gone */ } }
  return { faults: [...found.values()], errors: [...new Set(errors)].slice(0, 5), actions, secs: +now.toFixed(1), done, repairs: v.repairs?.length ?? 0, fellBack: !!v.fellBack };
}

// ── the known-failure list (tests/fixtures/studio-v2-layout-known.json) ──────────────────────────────────────────────────
export const KNOWN_FILE = path.join(repo, "tests/fixtures/studio-v2-layout-known.json");
/** A fault's stable key: numbers become "#" (a count or a score in a label must not make a new fault). */
export const faultKey = (f) => `${f.kind}|${f.a}|${f.b}`.replace(/\d+/g, "#");
/** The runs the test makes: every engine's reviewed default spec, and (with `nCat`) its first catalogue specs. */
export function runsOf(m, nCat = 1) {
  const out = [];
  for (const a of Object.keys(m.ENGINES).sort()) for (const s of [{ id: "default", spec: defaultSpecOf(m, a) }, ...catalogueSpecs(a, nCat)]) for (const box of BOXES) out.push({ archetype: a, specId: s.id, spec: s.spec, box });
  return out;
}
export const runId = (r) => `${r.archetype}|${r.specId}|${r.box.vp}`;

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//   --write-known   re-record the known-failure list from this run (every default and first catalogue spec), keeping the
//                   reasons already written; a fixed fault drops out, a new one comes in — review the diff
// ── CLI ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), json = args.includes("--json");
  const ci = args.indexOf("--catalogue"), nCat = ci >= 0 ? +args[ci + 1] : 0;
  const m = await loadModules();
  const only = args.filter((a, i) => !a.startsWith("--") && !(ci >= 0 && i === ci + 1));
  const list = only.length ? only : Object.keys(m.ENGINES).sort();
  const all = [];
  for (const a of list) {
    const specs = [{ id: "default", spec: defaultSpecOf(m, a) }, ...catalogueSpecs(a, nCat)];
    for (const s of specs) for (const box of BOXES) {
      const t0 = Date.now(), r = await probe(a, s.spec, box);
      all.push({ archetype: a, spec: s.id, vp: box.vp, ...r });
      if (!json) {
        console.log(`${a} ${s.id} ${box.vp}: ${r.faults.length} faults, ${r.secs}s virtual, ${r.actions} actions, done=${r.done}, ${Date.now() - t0}ms${r.errors.length ? " ERR " + r.errors.join(" | ") : ""}`);
        for (const f of r.faults) console.log(`   ${f.kind.padEnd(10)} ${JSON.stringify(f.a)} × ${JSON.stringify(f.b)} at ${f.at}s box ${f.box.join(",")}`);
      }
    }
  }
  if (json) console.log(JSON.stringify(all, null, 1));
  if (args.includes("--write-known")) {
    const prev = fs.existsSync(KNOWN_FILE) ? JSON.parse(fs.readFileSync(KNOWN_FILE, "utf8")) : { reasons: {} };
    const faults = {}, counts = {};
    for (const r of all) { const ks = [...new Set(r.faults.map(faultKey))].sort(); if (ks.length) { faults[runId({ archetype: r.archetype, specId: r.spec, box: { vp: r.vp } })] = ks; counts[r.archetype] = (counts[r.archetype] ?? 0) + ks.length; } }
    const reasons = Object.fromEntries(Object.keys(counts).sort().map((a) => [a, prev.reasons?.[a] ?? "TODO: say why this engine's faults are not fixed yet"]));
    fs.writeFileSync(KNOWN_FILE, JSON.stringify({ note: "Known Studio v2 layout faults (tests/studio-v2-layout.test.mjs). Each is a real overlap or cut-off the probe found and nobody has fixed yet; the test fails on any fault NOT listed here and on any listed fault that no longer happens (remove it: node src/studio-v2/tools/layout-probe.mjs --catalogue 1 --write-known). Keys: kind|a|b, numbers as #.", reasons, faults }, null, 1) + "\n");
    console.log(`wrote ${path.relative(repo, KNOWN_FILE)}: ${Object.keys(faults).length} runs with faults, ${Object.values(counts).reduce((x, y) => x + y, 0)} keys`);
  }
}
