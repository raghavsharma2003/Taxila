// Shared in-canvas game chrome so every engine reads as one product: the wave/round intro, the stat card, the
// coach-mark (leaves on first input or after 2.6 s, DESIGN-V3 §6.5), and the "your move" volt ring.
import { C, W, H } from "./tokens.ts";
import { ease } from "./math.ts";
import { card, tick, type Ctx } from "./draw.ts";
import type { EngineApi } from "./types.ts";

export function drawIntro(api: EngineApi, ctx: Ctx, o: { a: number; t: number; kicker: string; title: string; sub?: string; accent?: string }): void {
  if (o.a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = o.a;
  ctx.fillStyle = "rgba(10,12,18,.5)"; ctx.fillRect(0, 0, W, H);
  const sc = 1 + (1 - ease.outCubic(Math.min(1, o.t / 0.5))) * 0.22;
  api.text(ctx, o.kicker.toUpperCase(), 500, 220, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", track: 6 });
  ctx.save(); ctx.translate(500, 300); ctx.scale(sc, sc);
  api.text(ctx, o.title, 0, 0, { font: "display", size: o.title.length > 16 ? 84 : 100, weight: 800, align: "center", baseline: "middle", track: -3, maxWidth: 900 });
  ctx.restore();
  const lw = 260 * ease.outCubic(Math.min(1, o.t / 0.8));
  ctx.strokeStyle = o.accent ?? C.ion; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(500 - lw / 2, 366); ctx.lineTo(500 + lw / 2, 366); ctx.stroke();
  if (o.sub) api.text(ctx, o.sub, 500, 420, { font: "ui", size: 40, weight: 500, color: C.ink2, align: "center", maxWidth: 880 });
  ctx.restore();
}
export function drawStatCard(api: EngineApi, ctx: Ctx, o: { a: number; head: string; color?: string; stats: [string, string][]; foot?: string; footColor?: string; ticked?: boolean }): void {
  if (o.a <= 0.01) return;
  const h = o.foot ? 400 : 300, y = (H - h) / 2 - 10 + (1 - o.a) * 18;
  card(ctx, 100, y, 800, h, o.a);
  ctx.save(); ctx.globalAlpha = o.a;
  const col = o.color ?? C.mint;
  api.text(ctx, o.head.toUpperCase(), 500, y + 66, { font: "mono", size: 38, weight: 600, color: col, align: "center", track: 4, maxWidth: 700 });
  if (o.ticked) tick(ctx, 500 - api.measure(ctx, o.head.toUpperCase(), { font: "mono", size: 38, track: 4 }) / 2 - 34, y + 56, col);
  const n = o.stats.length, span = 640 / Math.max(1, n);
  o.stats.forEach(([v, label], i) => {
    const x = 180 + span * i + span / 2;
    api.text(ctx, v, x, y + 160, { font: "display", size: 60, weight: 800, align: "center", baseline: "middle", maxWidth: span - 10 });
    api.text(ctx, label, x, y + 222, { font: "mono", size: 38, weight: 500, color: C.ink3, align: "center", baseline: "middle", maxWidth: span - 6 });
  });
  if (o.foot) {
    ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(160, y + 268); ctx.lineTo(840, y + 268); ctx.stroke();
    api.text(ctx, o.foot, 500, y + 330, { font: "mono", size: 38, weight: 500, color: o.footColor ?? C.amber, align: "center", baseline: "middle", maxWidth: 760 });
  }
  ctx.restore();
}
/** Coach-mark text near the bottom; caller fades `a` to 0 on first input. */
export function drawCoach(api: EngineApi, ctx: Ctx, text: string, a: number, now: number, y = 600): void {
  if (a <= 0.01) return;
  api.text(ctx, text, 500, y, { font: "mono", size: 38, weight: 500, color: C.ink2, align: "center", alpha: a * (0.65 + 0.35 * Math.sin(now * 4)), maxWidth: 900 });
}
/** The single volt "your move" ring (one volt element per state). */
export function voltRing(ctx: Ctx, x: number, y: number, r: number, now: number, active = false): void {
  const p = 0.5 + 0.5 * Math.sin(now * 4);
  ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.globalAlpha = active ? 1 : 0.55 + 0.45 * p;
  ctx.beginPath(); ctx.arc(x, y, r + (active ? 0 : 6 * p), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
/** A labelled pill in world units (readouts, floating verdict chips). */
export function pill(api: EngineApi, ctx: Ctx, text: string, x: number, y: number, o: { color?: string; fill?: string; size?: number; align?: "center" | "left" } = {}): number {
  const size = o.size ?? 40, w = api.measure(ctx, text, { font: "mono", size, weight: 600 }) + 36, h = size + 22;
  const x0 = o.align === "left" ? x : x - w / 2;
  ctx.save();
  ctx.fillStyle = o.fill ?? "rgba(16,19,27,.88)";
  ctx.beginPath(); ctx.roundRect(x0, y - h / 2, w, h, 14); ctx.fill();
  ctx.strokeStyle = o.color ?? C.line2; ctx.lineWidth = 2; ctx.stroke();
  api.text(ctx, text, x0 + w / 2, y + 2, { font: "mono", size, weight: 600, color: o.color ?? C.ink, align: "center", baseline: "middle" });
  ctx.restore();
  return w;
}
