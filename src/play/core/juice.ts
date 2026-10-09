// Game feel for play (DESIGN.md §4 rule J1): every effect is CAUSED by the child's act or the law's answer to it, and is
// proportional to it (Kao et al. CHI 2024: success-dependent feedback helps; amplification for its own sake hurts agency).
// Limits are enforced here, not left to each view: hit-stop ≤ 80 ms, shake ≤ 6 px, celebration ≤ 800 ms, ≤ 90 particles.
// Reduced motion: tweens jump to their end, no particles, no shake.

export type Ease = (t: number) => number;
export const ease = {
  linear: (t: number) => t,
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t: number) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  /** the child's own drop / release only (DESIGN-V3 spring rule) */
  spring: (t: number) => 1 - Math.cos(t * Math.PI * 2.4) * Math.exp(-6 * t),
};

interface Tween { o: Record<string, number>; from: Record<string, number>; to: Record<string, number>; t: number; dur: number; delay: number; ease: Ease; done?: () => void }
export class Tweens {
  private list: Tween[] = [];
  reduced = false;
  add(o: Record<string, number>, to: Record<string, number>, opts: { dur?: number; delay?: number; ease?: Ease; done?: () => void } = {}): void {
    for (const tw of this.list) for (const k of Object.keys(to)) if (tw.o === o && k in tw.to) delete tw.to[k];
    if (this.reduced) { Object.assign(o, to); opts.done?.(); return; }
    const from: Record<string, number> = {};
    for (const k of Object.keys(to)) from[k] = o[k] ?? 0;
    this.list.push({ o, from, to: { ...to }, t: 0, dur: Math.max(0.001, opts.dur ?? 0.24), delay: opts.delay ?? 0, ease: opts.ease ?? ease.out, done: opts.done });
  }
  get busy(): boolean { return this.list.length > 0; }
  step(dt: number): void {
    const keep: Tween[] = [];
    for (const tw of this.list) {
      if (tw.delay > 0) { tw.delay -= dt; keep.push(tw); continue; }
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = tw.ease(tw.t);
      for (const k of Object.keys(tw.to)) tw.o[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
      if (tw.t < 1) keep.push(tw); else tw.done?.();
    }
    this.list = keep;
  }
}

export interface Particle { x: number; y: number; vx: number; vy: number; life: number; age: number; size: number; color: string; kind: "dot" | "flake" | "dust" | "spark"; rot: number; vr: number }
export class Juice {
  particles: Particle[] = [];
  shakeT = 0; shakeA = 0; ox = 0; oy = 0;
  flashA = 0; flashColor = "#fff";
  hitstop = 0;
  reduced = false;
  private seed = 1;
  private rnd(): number { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  /** a burst at (x, y): the count scales with the size of the event, capped */
  burst(x: number, y: number, o: { n?: number; color: string; speed?: number; life?: number; size?: number; kind?: Particle["kind"]; up?: number }): void {
    if (this.reduced) return;
    const n = Math.min(o.n ?? 14, 40);
    for (let i = 0; i < n && this.particles.length < 90; i++) {
      const a = this.rnd() * Math.PI * 2, s = (o.speed ?? 160) * (0.4 + this.rnd() * 0.8);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up ?? 40), life: (o.life ?? 0.6) * (0.7 + this.rnd() * 0.5), age: 0,
        size: (o.size ?? 4) * (0.6 + this.rnd() * 0.8), color: o.color, kind: o.kind ?? "dot", rot: this.rnd() * 6, vr: (this.rnd() - 0.5) * 8 });
    }
  }
  shake(px: number, dur = 0.16): void { if (this.reduced) return; this.shakeA = Math.min(6, Math.max(this.shakeA, px)); this.shakeT = Math.max(this.shakeT, dur); }
  flash(color: string, a = 0.12): void { if (this.reduced) return; this.flashColor = color; this.flashA = Math.min(0.2, a); }
  stop(ms: number): void { if (!this.reduced) this.hitstop = Math.max(this.hitstop, Math.min(ms, 80) / 1000); }
  get busy(): boolean { return this.particles.length > 0 || this.shakeT > 0 || this.flashA > 0.005; }
  step(dt: number): void {
    for (const p of this.particles) {
      p.age += dt; p.vy += (p.kind === "flake" ? 120 : p.kind === "dust" ? 30 : 380) * dt;
      const drag = p.kind === "flake" ? 0.9 : 0.98;
      p.vx *= Math.pow(drag, dt * 60); p.vy *= Math.pow(drag, dt * 60);
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    if (this.shakeT > 0) { this.shakeT -= dt; const k = Math.max(0, this.shakeT) / 0.16; this.ox = (this.rnd() - 0.5) * 2 * this.shakeA * k; this.oy = (this.rnd() - 0.5) * 2 * this.shakeA * k; if (this.shakeT <= 0) { this.ox = this.oy = 0; this.shakeA = 0; } }
    this.flashA *= Math.pow(0.001, dt);
  }
  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (const p of this.particles) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      if (p.kind === "flake") { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size); ctx.restore(); }
      else if (p.kind === "spark") { ctx.fillRect(p.x - p.size * 0.3, p.y - p.size, p.size * 0.6, p.size * 2); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.kind === "dust" ? 1.4 : 1) * (0.5 + 0.5 * k), 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (this.flashA > 0.005) { ctx.globalAlpha = this.flashA; ctx.fillStyle = this.flashColor; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  }
}

/** A critically damped spring for positions the child drags (snaps without wobble unless released into a drop). */
export function springTo(cur: number, vel: number, target: number, dt: number, k = 260, d = 2 * Math.sqrt(260)): [number, number] {
  const a = -k * (cur - target) - d * vel;
  const v = vel + a * dt;
  return [cur + v * dt, v];
}
