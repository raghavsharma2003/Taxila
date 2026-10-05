// Shared craft for the extension engines (VALUES-100 V3): one look across 20+ engines, so every new piece reads as the
// same product as the RS-4 sixteen. Text wrap that respects the 38-unit label floor, glass tiles, the backdrop, the
// Devanagari font gate, seeded shuffles, a critically damped spring, and the round flow (boot → intro → play →
// reveal → end card → final) most games share.
import "./deva.css";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, rng } from "../../core/math.ts";
import { roundRect, type Ctx, type TextOpts } from "../../core/draw.ts";
import type { EngineApi } from "../../core/types.ts";
import type { Accent } from "../../../../shared/studio-spec-ext/scene.ts";

export const ACC: Record<Accent, string> = { ion: C.ion, sci: C.sci, mint: C.mint, amber: C.amber, sun: C.sun, volt: C.volt };
export const SUBJECT_ACCENT: Record<string, string> = { maths: C.ion, science: C.sci, evs: C.mint, english: "#FF8FB1", hindi: "#FFB547", sst: "#C9A7FF" };
export const LABEL = 38;

/** Greedy word wrap at the stage's label floor; long single words are kept whole (the caller's lint catches them). */
export function wrap(api: EngineApi, ctx: Ctx, s: string, maxW: number, o: TextOpts = {}, maxLines = 3): string[] {
  const words = String(s).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (!cur || api.measure(ctx, t, o) <= maxW) cur = t; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); keep[maxLines - 1] = keep[maxLines - 1] + "…"; return keep; }
  return lines;
}
/** Draw wrapped text centred on (x, y) (block centred vertically). Returns the block height. */
export function textBlock(api: EngineApi, ctx: Ctx, s: string, x: number, y: number, maxW: number, o: TextOpts = {}, maxLines = 3, lh = 1.18): number {
  const size = o.size ?? LABEL;
  const lines = wrap(api, ctx, s, maxW, { ...o, size }, maxLines);
  const h = lines.length * size * lh;
  lines.forEach((ln, i) => api.text(ctx, ln, x, y - h / 2 + size * lh * (i + 0.5), { baseline: "middle", align: "center", maxWidth: maxW + 4, ...o, size }));
  return h;
}
/** A glass tile (world units) with an accent edge; `glowA` adds the active halo. */
export function tile(ctx: Ctx, x: number, y: number, w: number, h: number, o: { accent?: string; fill?: string; edge?: number; r?: number; glowA?: number; alpha?: number } = {}): void {
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  if (o.glowA && o.glowA > 0.01) { ctx.save(); ctx.globalAlpha *= o.glowA; ctx.shadowColor = o.accent ?? C.ion; ctx.shadowBlur = 26; ctx.fillStyle = "rgba(0,0,0,.01)"; roundRect(ctx, x, y, w, h, o.r ?? 18); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = o.fill ?? "rgba(22,26,36,.92)"; roundRect(ctx, x, y, w, h, o.r ?? 18); ctx.fill();
  ctx.strokeStyle = o.accent ? hexA(o.accent, 0.85) : C.line2; ctx.lineWidth = o.edge ?? 3; ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.04)"; roundRect(ctx, x + 3, y + 3, w - 6, 4, 2); ctx.fill();
  ctx.restore();
}
/** Deep backdrop: radial gradient + a faint engineering grid + vignette, tinted by the accent. Paint into api.layer. */
export function backdrop(g: Ctx, accent: string, seed = 3, stars = 0): void {
  const gr = g.createRadialGradient(W * 0.5, H * 0.42, 40, W * 0.5, H * 0.5, W * 0.78);
  gr.addColorStop(0, "#151A28"); gr.addColorStop(0.55, "#0D111B"); gr.addColorStop(1, "#06070B");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = hexA(accent, 0.05); g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.028)"; g.lineWidth = 1;
  for (let x = 0; x <= W; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y <= H; y += 50) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  if (stars) { const r = rng(seed); for (let i = 0; i < stars; i++) { g.globalAlpha = 0.15 + r() * 0.45; g.fillStyle = "#C9D2F2"; g.fillRect(r() * W, r() * H, 1.6, 1.6); } g.globalAlpha = 1; }
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.55)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
}
/** Slow drifting dust motes (pure function of t). */
export function dust(ctx: Ctx, t: number, n = 36, color = "#C9D2F2", seed = 11): void {
  const r = rng(seed);
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, y0 = r() * H, sp = 6 + r() * 14, ph = r() * 6.28, s = 1 + r() * 1.8;
    const x = (x0 + t * sp) % W, y = y0 + Math.sin(t * 0.4 + ph) * 10;
    ctx.globalAlpha = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(t * 0.7 + ph));
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}
/** Devanagari font gate: resolves when the Mukta face (under the stage families) is ready, max 1.5 s. */
export function devaReady(): Promise<void> {
  try {
    const f = document.fonts;
    if (!f) return Promise.resolve();
    return Promise.race([
      Promise.all([f.load(`600 40px "Atkinson Hyperlegible Next"`, "अआक"), f.load(`800 40px "Bricolage Grotesque"`, "अआक"), f.load(`600 40px "Geist Mono"`, "अआक")]).then(() => undefined),
      new Promise<void>((res) => setTimeout(res, 1500)),
    ]).catch(() => undefined);
  } catch { return Promise.resolve(); }
}
export const hasDeva = (s: string) => /[ऀ-ॿ]/.test(s);
export function shuffled<T>(a: T[], seed: number): T[] { const r = rng(seed * 97 + 13), out = [...a]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }
/** Critically damped spring toward a target (frame-rate independent). */
export function spring(cur: { v: number; x: number }, target: number, k: number, dt: number): void {
  const c = 2 * Math.sqrt(k);
  cur.v += (k * (target - cur.x) - c * cur.v) * dt; cur.x += cur.v * dt;
}
export function inRect(p: { x: number; y: number }, x: number, y: number, w: number, h: number, pad = 0): boolean { return p.x >= x - pad && p.x <= x + w + pad && p.y >= y - pad && p.y <= y + h + pad; }
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);
/** Volt "your move" ring around a rectangle. */
export function voltBox(ctx: Ctx, x: number, y: number, w: number, h: number, now: number, r = 18): void {
  const p = 0.5 + 0.5 * Math.sin(now * 4);
  ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.globalAlpha = 0.5 + 0.5 * p;
  roundRect(ctx, x - 5 - 3 * p, y - 5 - 3 * p, w + 10 + 6 * p, h + 10 + 6 * p, r + 4); ctx.stroke(); ctx.restore();
}
/** Indian digit grouping for display. */
export function fmtNum(v: number, decimals = 0): string {
  if (!Number.isFinite(v)) return "0";
  const neg = v < 0, a = Math.abs(v), int = Math.trunc(a), frac = decimals ? (a - int).toFixed(decimals).slice(1) : "";
  const s = String(int); let out = s;
  if (s.length > 3) { const last3 = s.slice(-3), head = s.slice(0, -3); out = head.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3; }
  return (neg ? "−" : "") + out + frac;
}
export { clamp, hexA };

/** The round flow shared by most games. Engines call `tick(dt)` and read `state`; cards are drawn by the engine. */
export class RoundFlow {
  state: "boot" | "intro" | "play" | "reveal" | "end" | "final" = "boot";
  stateT = 0; introA = 0; endA = 0; finalA = 0; round = -1;
  constructor(private api: EngineApi, private rounds: number, private hooks: { onRound(k: number): void; onEnd?(k: number): void; onFinal(): void }) {}
  go(s: RoundFlow["state"]): void { this.state = s; this.stateT = 0; }
  startRound(k: number): void {
    this.round = k; this.go("intro"); this.introA = 0;
    this.api.tw.add(this as RoundFlow, { introA: 1 }, { dur: 0.45 });
    this.hooks.onRound(k);
  }
  /** call when the round's play is over */
  endRound(): void {
    if (this.state === "end" || this.state === "final") return;
    this.go("end"); this.endA = 0;
    this.api.tw.add(this as RoundFlow, { endA: 1 }, { dur: 0.45 }); this.api.tw.add(this as RoundFlow, { endA: 0 }, { dur: 0.35, delay: 2.4 });
    this.hooks.onEnd?.(this.round);
  }
  tick(dt: number, introSecs = 1.7): void {
    this.stateT += dt;
    if (this.state === "boot" && this.stateT > 0.45) this.startRound(0);
    else if (this.state === "intro" && this.stateT > introSecs) { this.api.tw.add(this as RoundFlow, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); this.go("play"); }
    else if (this.state === "end" && this.stateT > 3.0) {
      if (this.round + 1 < this.rounds) this.startRound(this.round + 1);
      else { this.go("final"); this.finalA = 0; this.api.tw.add(this as RoundFlow, { finalA: 1 }, { dur: 0.6 }); this.hooks.onFinal(); }
    }
  }
}
export const clampX = (x: number, w = 0) => clamp(x, 70 + w / 2, W - 70 - w / 2);
