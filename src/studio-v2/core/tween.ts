// Per-host tween pool (the prototype's pool was global; two hosts on one page must not share it).
import { clamp, easeOf, lerp, type Ease, type EaseName } from "./math.ts";

interface Tw { target: Record<string, number>; from: Record<string, number>; to: Record<string, number>; dur: number; delay: number; ease: Ease; t: number; started: boolean; dead: boolean; onDone?: () => void; onUpdate?: (e: number) => void }
export interface TweenOpts { dur?: number; delay?: number; ease?: EaseName | Ease; onDone?: () => void; onUpdate?: (e: number) => void }
export class Tweens {
  private list: Tw[] = [];
  add<T extends object>(target: T, props: Partial<Record<keyof T, number>>, o: TweenOpts = {}): void {
    this.list.push({ target: target as unknown as Record<string, number>, from: {}, to: props as Record<string, number>, dur: o.dur ?? 0.3, delay: o.delay ?? 0,
      ease: typeof o.ease === "function" ? o.ease : easeOf(o.ease, "outCubic"), t: 0, started: false, dead: false, onDone: o.onDone, onUpdate: o.onUpdate });
  }
  kill(target: object): void { for (const tw of this.list) if (tw.target === (target as unknown)) tw.dead = true; }
  step(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const tw = this.list[i];
      if (tw.dead) { this.list.splice(i, 1); continue; }
      if (tw.delay > 0) { tw.delay -= dt; continue; }
      if (!tw.started) { for (const k in tw.to) tw.from[k] = tw.target[k] ?? 0; tw.started = true; }
      tw.t += dt;
      const p = tw.dur <= 0 ? 1 : clamp(tw.t / tw.dur, 0, 1), e = tw.ease(p);
      for (const k in tw.to) tw.target[k] = lerp(tw.from[k], tw.to[k], e);
      tw.onUpdate?.(e);
      if (p >= 1) { this.list.splice(i, 1); tw.onDone?.(); }
    }
  }
  get size(): number { return this.list.length; }
  clear(): void { this.list.length = 0; }
}
