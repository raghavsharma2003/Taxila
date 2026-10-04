// Drawing kit: glow sprites (no shadowBlur in the hot loop), text with the stage-contract minimum recorded, icons
// for verdicts (tick = got it, magnifier = look again; never a red cross — DESIGN-V3 §3.1).
import { C, FONT, MIN, type FontKey } from "./tokens.ts";
import { hexA } from "./math.ts";

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
export function makeText(tooSmall: TooSmall[], safeHits: SafeHit[] = [], worldScale: () => number = () => 1) {
  const setFont = (ctx: Ctx, o: TextOpts) => {
    ctx.font = `${o.weight ?? 600} ${o.size ?? MIN.label}px ${FONT[o.font ?? "ui"]}`;
    if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = (o.track ?? 0) + "px";
  };
  const reset = (ctx: Ctx) => { if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "0px"; };
  function text(ctx: Ctx, str: string, x: number, y: number, o: TextOpts = {}): void {
    const size = o.size ?? MIN.label;
    if (size < MIN.label - 0.01 && !o.decor && tooSmall.length < 200) tooSmall.push({ str: String(str).slice(0, 20), size });
    setFont(ctx, o);
    ctx.textAlign = o.align ?? "left"; ctx.textBaseline = o.baseline ?? "alphabetic";
    let s = String(str);
    if (o.maxWidth && ctx.measureText(s).width > o.maxWidth) { while (s.length > 1 && ctx.measureText(s + "…").width > o.maxWidth) s = s.slice(0, -1); s += "…"; }
    const a0 = ctx.globalAlpha;
    if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
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
    ctx.globalAlpha = a0;
    reset(ctx);
  }
  function measure(ctx: Ctx, str: string, o: TextOpts = {}): number { setFont(ctx, o); const w = ctx.measureText(String(str)).width; reset(ctx); return w; }
  return { text, measure };
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
  if (scrim) { ctx.fillStyle = "rgba(10,12,18,.55)"; ctx.fillRect(0, 0, 1000, 625); }
  ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, x, y, w, h, 28); ctx.fill();
  ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.035)"; roundRect(ctx, x + 2, y + 2, w - 4, 3, 2); ctx.fill();
  ctx.restore();
}
/** Additive blit of a glow sprite centred at (x, y). */
export function bloom(ctx: Ctx, color: string, x: number, y: number, r: number, a: number, soft?: number): void {
  if (a <= 0.002) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha *= a;
  ctx.drawImage(glow(color, 64, soft), x - r, y - r, r * 2, r * 2); ctx.restore();
}
