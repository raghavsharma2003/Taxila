// Drawing kit: glow sprites (no shadowBlur in the hot loop), text with the stage-contract minimum recorded, icons
// for verdicts (tick = got it, magnifier = look again; never a red cross — DESIGN-V3 §3.1).
import { C, FONT, MIN, MIN_YOUNG, type FontKey } from "./tokens.ts";
import { hexA } from "./math.ts";
import { withAlpha } from "../../theme/palette.ts";

export type Ctx = CanvasRenderingContext2D;
const glowCache = new Map<string, HTMLCanvasElement>();
export function glow(color: string, radius: number, soft?: number): HTMLCanvasElement {
  const key = color + "|" + radius + "|" + (soft ?? "");
  let c = glowCache.get(key);
  if (c) return c;
  const s = Math.max(2, Math.ceil(radius * 2));
  c = document.createElement("canvas"); c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2), k = soft == null ? 0.35 : soft;
  grd.addColorStop(0, hexA(color, 1)); grd.addColorStop(k, hexA(color, 0.45)); grd.addColorStop(1, hexA(color, 0));
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  glowCache.set(key, c);
  return c;
}
export interface TextOpts { size?: number; font?: FontKey; weight?: number; color?: string; align?: CanvasTextAlign; baseline?: CanvasTextBaseline; track?: number; glow?: string; alpha?: number; decor?: boolean; maxWidth?: number }
export interface TooSmall { str: string; size: number }
/** A text drawer bound to one host, so undersized labels are recorded per artifact (QB-A9). */
export interface SafeHit { str: string; zone: "label" | "pip"; box: [number, number, number, number] }
/** World-space safe zones (DESIGN-V3 §6.3): nothing labelled or interactive may sit in them. */
const ZONES: { zone: "label" | "pip"; x0: number; y0: number; x1: number; y1: number }[] = [{ zone: "label", x0: 0, y0: 0, x1: 180, y1: 75 }, { zone: "pip", x0: 837.5, y0: 0, x1: 1000, y1: 162.5 }];
export interface MakeTextOpts { young?: () => boolean }
/** Lines a run wraps to when it is still wider than `maxWidth` at its floor (more than this: the last line is cut). */
const MAX_WRAP = 3;
export function makeText(tooSmall: TooSmall[], safeHits: SafeHit[] = [], worldScale: () => number = () => 1, mo: MakeTextOpts = {}) {
  const young = mo.young ?? (() => false);
  const setFont = (ctx: Ctx, o: TextOpts, size: number) => {
    ctx.font = `${o.weight ?? 600} ${size}px ${FONT[o.font ?? "ui"]}`;
    if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = (o.track ?? 0) + "px";
  };
  const reset = (ctx: Ctx) => { if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "0px"; };
  /** world units per unit of the CURRENT transform (an engine may draw inside its own scale, a camera zoom, a pop) */
  const unitScale = (ctx: Ctx): number => {
    try { const m = ctx.getTransform(), k = worldScale() || 1, s = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / k; return s > 0.05 && Number.isFinite(s) ? s : 1; } catch { return 1; }
  };
  /** The size a run is drawn at: never below the young floor (in world units, whatever the transform). */
  const sizeOf = (ctx: Ctx, o: TextOpts): number => {
    const size = o.size ?? MIN.label;
    return young() ? Math.max(size, MIN_YOUNG.label / unitScale(ctx)) : size;
  };
  function one(ctx: Ctx, s: string, x: number, y: number, size: number, o: TextOpts): void {
    if (o.glow) { ctx.save(); ctx.globalAlpha *= 0.55; ctx.shadowColor = o.glow; ctx.shadowBlur = size * 0.5; ctx.fillStyle = o.color ?? C.ink; ctx.fillText(s, x, y); ctx.restore(); }
    ctx.fillStyle = o.color ?? C.ink;
    ctx.fillText(s, x, y);
    if (!o.decor && safeHits.length < 200 && ctx.globalAlpha > 0.05) {
      const w = ctx.measureText(s).width, al = ctx.textAlign, bl = ctx.textBaseline;
      const lx = al === "center" ? x - w / 2 : al === "right" || al === "end" ? x - w : x;
      const ty = bl === "middle" ? y - size * 0.4 : bl === "top" || bl === "hanging" ? y : y - size * 0.78;
      const m = ctx.getTransform(), k = worldScale() || 1;
      const pts = [[lx, ty], [lx + w, ty], [lx, ty + size * 0.85], [lx + w, ty + size * 0.85]].map(([px, py]) => [(m.a * px + m.c * py + m.e) / k, (m.b * px + m.d * py + m.f) / k]);
      const bx0 = Math.min(...pts.map((p) => p[0])), bx1 = Math.max(...pts.map((p) => p[0])), by0 = Math.min(...pts.map((p) => p[1])), by1 = Math.max(...pts.map((p) => p[1]));
      for (const z of ZONES) if (bx1 > z.x0 + 1 && bx0 < z.x1 - 1 && by1 > z.y0 + 1 && by0 < z.y1 - 1) safeHits.push({ str: s.slice(0, 20), zone: z.zone, box: [Math.round(bx0), Math.round(by0), Math.round(bx1), Math.round(by1)] });
    }
  }
  /** Greedy word wrap at the CURRENT font (a single word wider than the width keeps its own line, whole). */
  const wrapAt = (ctx: Ctx, s: string, maxW: number): string[] => {
    const lines: string[] = []; let cur = "";
    for (const w of s.split(/\s+/).filter(Boolean)) { const t = cur ? cur + " " + w : w; if (!cur || ctx.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = w; } }
    if (cur) lines.push(cur);
    return lines.length ? lines : [s];
  };
  /**
   * Draw one run. A run wider than `maxWidth` first shrinks toward its floor (the young floor, else the 38-unit label
   * minimum; never below either), then wraps to at most 3 lines centred on the anchor; only a run that still does not fit
   * in 3 lines is cut with "…" (round 7 readability: "RELE…", "start again" and cut instructions were seen at 1366).
   */
  function text(ctx: Ctx, str: string, x: number, y: number, o: TextOpts = {}): void {
    let size = sizeOf(ctx, o);
    if (size < MIN.label - 0.01 && !o.decor && tooSmall.length < 200) tooSmall.push({ str: String(str).slice(0, 20), size });
    setFont(ctx, o, size);
    ctx.textAlign = o.align ?? "left"; ctx.textBaseline = o.baseline ?? "alphabetic";
    let lines = [String(str)];
    if (o.maxWidth && o.maxWidth > 0 && ctx.measureText(lines[0]).width > o.maxWidth) {
      const e = unitScale(ctx), floor = Math.min(size, (young() ? MIN_YOUNG.label : MIN.label) / e);
      for (let i = 0; i < 4 && size > floor + 0.01; i++) {
        const w = ctx.measureText(lines[0]).width; if (w <= o.maxWidth) break;
        size = Math.max(floor, size * (o.maxWidth / w) * 0.99); setFont(ctx, o, size);
      }
      if (ctx.measureText(lines[0]).width > o.maxWidth) {
        lines = wrapAt(ctx, lines[0], o.maxWidth);
        if (lines.length > MAX_WRAP) { lines = lines.slice(0, MAX_WRAP); let l = lines[MAX_WRAP - 1]; while (l.length > 1 && ctx.measureText(l + "…").width > o.maxWidth) l = l.slice(0, -1); lines[MAX_WRAP - 1] = l + "…"; }
      }
    }
    const a0 = ctx.globalAlpha;
    if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    const lh = size * 1.12;
    lines.forEach((ln, i) => one(ctx, ln, x, y + (i - (lines.length - 1) / 2) * lh, size, o));
    ctx.globalAlpha = a0;
    reset(ctx);
  }
  function measure(ctx: Ctx, str: string, o: TextOpts = {}): number { setFont(ctx, o, sizeOf(ctx, o)); const w = ctx.measureText(String(str)).width; reset(ctx); return w; }
  /** the label floor in world units for this child (43 for classes 4-5, else 38) */
  const minLabel = (): number => (young() ? MIN_YOUNG.label : MIN.label);
  return { text, measure, minLabel };
}
export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function tick(ctx: Ctx, x: number, y: number, col: string = C.mint, s = 1): void {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 6 * s; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x - 12 * s, y); ctx.lineTo(x - 3 * s, y + 10 * s); ctx.lineTo(x + 14 * s, y - 10 * s); ctx.stroke(); ctx.restore();
}
export function magnifier(ctx: Ctx, x: number, y: number, col: string = C.amber, s = 1): void {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5 * s; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(x - 3 * s, y - 3 * s, 11 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 5 * s, y + 5 * s); ctx.lineTo(x + 15 * s, y + 15 * s); ctx.stroke(); ctx.restore();
}
/** A glass card in world units (end-of-wave cards, final cards). */
export function card(ctx: Ctx, x: number, y: number, w: number, h: number, a = 1, scrim = true): void {
  ctx.save(); ctx.globalAlpha *= a;
  if (scrim) { ctx.fillStyle = withAlpha(C.bg, .55); ctx.fillRect(0, 0, 1000, 625); }
  ctx.fillStyle = withAlpha(C.bg2, .95); roundRect(ctx, x, y, w, h, 28); ctx.fill();
  ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = withAlpha(C.hi, .035); roundRect(ctx, x + 2, y + 2, w - 4, 3, 2); ctx.fill();
  ctx.restore();
}
/** Additive blit of a glow sprite centred at (x, y). */
export function bloom(ctx: Ctx, color: string, x: number, y: number, r: number, a: number, soft?: number): void {
  if (a <= 0.002) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha *= a;
  ctx.drawImage(glow(color, 64, soft), x - r, y - r, r * 2, r * 2); ctx.restore();
}
