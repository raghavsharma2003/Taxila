// Juice, on the learning act only (QB-G4): pooled particles, shockwave rings, rising popups, screen shake, screen
// flash (mint/amber tint, never red). Reduced motion drops particles and shake; the game stays playable.
import { C, W, H, MIN, SAFE } from "./tokens.ts";
import { ease, hexA, lerp } from "./math.ts";
import { glow, type Ctx, type TextOpts } from "./draw.ts";

interface P { x: number; y: number; vx: number; vy: number; life: number; t: number; size: number; color: string; g: number; drag: number; shard: boolean; rot: number; vr: number; floor?: number }
interface R { x: number; y: number; r0: number; r1: number; life: number; t: number; w: number; color: string }
interface T { text: string; x: number; y: number; t: number; life: number; color: string; size: number; rise: number }
export interface BurstOpts { n?: number; angle?: number; spread?: number; speed?: number; life?: number; size?: number; color?: string; gravity?: number; drag?: number; shard?: boolean; floor?: number }
export class FX {
  private P: P[] = []; private R: R[] = []; private T: T[] = [];
  shakeAmp = 0; private shakeT = 0; private shakeDur = 0; ox = 0; oy = 0; flashA = 0; flashColor: string = C.mint;
  private reduced: boolean; private rnd: () => number; private text: (ctx: Ctx, s: string, x: number, y: number, o?: TextOpts) => void;
  constructor(reduced: boolean, rnd: () => number, text: (ctx: Ctx, s: string, x: number, y: number, o?: TextOpts) => void) { this.reduced = reduced; this.rnd = rnd; this.text = text; }
  burst(x: number, y: number, o: BurstOpts = {}): void {
    if (this.reduced) return;
    const n = o.n ?? 16;
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + (this.rnd() - 0.5) * (o.spread ?? Math.PI * 2) : this.rnd() * Math.PI * 2;
      const sp = (o.speed ?? 300) * (0.35 + this.rnd() * 0.75);
      this.P.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: (o.life ?? 0.7) * (0.6 + this.rnd() * 0.6), t: 0, size: (o.size ?? 10) * (0.6 + this.rnd() * 0.8),
        color: o.color ?? C.ion, g: o.gravity ?? 0, drag: o.drag ?? 2.2, shard: !!o.shard, rot: this.rnd() * 6, vr: (this.rnd() - 0.5) * 14, floor: o.floor });
    }
    if (this.P.length > 420) this.P.splice(0, this.P.length - 420);
  }
  ring(x: number, y: number, o: { r0?: number; r1?: number; life?: number; width?: number; color?: string } = {}): void {
    this.R.push({ x, y, r0: o.r0 ?? 6, r1: o.r1 ?? 90, life: o.life ?? 0.5, t: 0, w: o.width ?? 6, color: o.color ?? C.ion });
  }
  pop(text: string, x: number, y: number, o: { life?: number; color?: string; size?: number; rise?: number } = {}): void {
    const size = Math.max(MIN.label, o.size ?? 44), rise = o.rise ?? 70, half = (size * 0.62 * text.length) / 2 + 8;
    // keep the whole rise clear of the safe zones (DESIGN-V3 §6.3): type label top-left 180×75, teacher PiP top-right 162.5²
    const cx = Math.min(W - half - 8, Math.max(half + 8, x));
    let top = y - rise - size * 0.6;
    if (cx + half > SAFE.pip.x && top < SAFE.pip.y + SAFE.pip.h + 6) top = SAFE.pip.y + SAFE.pip.h + 6;
    if (cx - half < SAFE.label.x + SAFE.label.w && top < SAFE.label.y + SAFE.label.h + 6) top = SAFE.label.y + SAFE.label.h + 6;
    this.T.push({ text, x: cx, y: top + rise + size * 0.6, t: 0, life: o.life ?? 0.9, color: o.color ?? C.ink, size, rise });
  }
  shake(amp: number, dur = 0.25): void { if (this.reduced) return; this.shakeAmp = Math.max(this.shakeAmp, Math.min(6, amp)); this.shakeDur = dur; this.shakeT = dur; }
  flash(color: string, a = 0.18): void { this.flashColor = color; this.flashA = Math.max(this.flashA, a); }
  update(dt: number): void {
    for (let i = this.P.length - 1; i >= 0; i--) {
      const p = this.P[i]; p.t += dt;
      if (p.t >= p.life) { this.P.splice(i, 1); continue; }
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vy = p.vy * d + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.floor != null && p.y > p.floor) { p.y = p.floor; p.vy *= -0.38; p.vx *= 0.7; p.vr *= 0.6; }
    }
    for (let i = this.R.length - 1; i >= 0; i--) { this.R[i].t += dt; if (this.R[i].t >= this.R[i].life) this.R.splice(i, 1); }
    for (let i = this.T.length - 1; i >= 0; i--) { this.T[i].t += dt; if (this.T[i].t >= this.T[i].life) this.T.splice(i, 1); }
    if (this.shakeT > 0) { this.shakeT -= dt; const k = Math.max(0, this.shakeT / this.shakeDur); this.ox = (this.rnd() * 2 - 1) * this.shakeAmp * k; this.oy = (this.rnd() * 2 - 1) * this.shakeAmp * k; }
    else { this.ox = this.oy = 0; this.shakeAmp = 0; }
    this.flashA = Math.max(0, this.flashA - dt * 0.9);
  }
  drawWorld(ctx: Ctx): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.P) {
      const k = 1 - p.t / p.life;
      if (p.shard) {
        ctx.save(); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = Math.min(1, k * 1.4);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.moveTo(-p.size * 0.6, -p.size * 0.3); ctx.lineTo(p.size * 0.7, -p.size * 0.1); ctx.lineTo(-p.size * 0.1, p.size * 0.55); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else { const s = p.size * (0.5 + k * 0.8); ctx.globalAlpha = k; ctx.drawImage(glow(p.color, 24), p.x - s, p.y - s, s * 2, s * 2); }
    }
    ctx.globalCompositeOperation = "source-over";
    for (const r of this.R) {
      const k = r.t / r.life, e = ease.outCubic(k);
      ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = r.color; ctx.lineWidth = Math.max(MIN.stroke * 0.5, r.w * (1 - k));
      ctx.beginPath(); ctx.arc(r.x, r.y, lerp(r.r0, r.r1, e), 0, Math.PI * 2); ctx.stroke();
    }
    for (const t of this.T) {
      const k = t.t / t.life, y = t.y - t.rise * ease.outCubic(k), sc = k < 0.15 ? ease.outBack(k / 0.15) : 1;
      ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      this.text(ctx, t.text, t.x, y, { size: t.size * sc, font: "display", weight: 700, color: t.color, align: "center", baseline: "middle", glow: t.color, decor: sc < 1 });   // the pop-in overshoot is animation, not a resting label
    }
    ctx.restore();
  }
  drawScreen(ctx: Ctx): void {
    if (this.flashA <= 0.002) return;
    ctx.save();
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
    g.addColorStop(0, hexA(this.flashColor, 0)); g.addColorStop(1, hexA(this.flashColor, this.flashA));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  get count(): number { return this.P.length; }
}
