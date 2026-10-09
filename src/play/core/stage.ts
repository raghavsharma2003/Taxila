// The play stage runtime (DESIGN.md §7): one canvas at the world box's REAL size (1 layout px = 1 CSS px; the backing store
// at the device pixel ratio), a guarded loop, pointer input in CSS px, the juice and sound systems, adaptive resolution and
// the audit the shot harness reads. A view lays itself out for the box it is given; nothing is drawn in a fixed world and
// scaled down (the 181 × 113 px defect, live-tech §1.1).
//
// What the stage guarantees whatever a view does:
//   - a throwing frame is skipped; 3 errors inside 1 s stop the view and call onFail (the host shows the board twin);
//   - the frame is only redrawn when something changed or is animating (idle frames cost a rAF tick);
//   - if the median drawn frame is slower than 52 fps over ~1.5 s the backing store steps down 2 → 1.5 → 1.25 → 1;
//   - every text and touch target drawn this frame is in `audit` (min sizes are checked against it, not assumed).
import type { ArtId, ArtTokens } from "../../../shared/play.ts";
import { Juice, Tweens } from "./juice.ts";
import { sound, type SoundEvent } from "./sound.ts";
import { ART, newAudit, Painter, type Audit } from "./styles.ts";

export type PointerKind = "down" | "move" | "up" | "cancel";
export interface ViewApi {
  readonly w: number; readonly h: number; readonly dpr: number; readonly t: number;
  readonly P: Painter; readonly art: ArtTokens; readonly tw: Tweens; readonly fx: Juice;
  readonly reduced: boolean; readonly young: boolean;
  sfx(ev: SoundEvent, n?: number): void;
  /** register a touch target for this frame (it is also the hit area: what is measured is what is touched) */
  target(id: string, x: number, y: number, w: number, h: number): void;
  hit(x: number, y: number): string | null;
  invalidate(): void;
  /** a cached static layer for this box size (grounds, grids) */
  layer(key: string, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void): HTMLCanvasElement;
}
export interface View {
  layout(w: number, h: number): void;
  update(dt: number): void;
  draw(c: CanvasRenderingContext2D): void;
  pointer(kind: PointerKind, x: number, y: number): void;
  busy?(): boolean;
  /** a held finger moves something in this view (a drag): the stage then redraws every frame while it is down. A view
   *  without drags leaves it out and is redrawn only when it invalidates (a held, still finger costs nothing). */
  dragging?(): boolean;
  /** the regions that changed this frame, when the view knows only part of it moves (null = the whole box). The stage clips
   *  the repaint to them; touch targets and audited texts are still registered for the whole view (the view draws all of
   *  it, clipped), so hit-testing and the floor audit are unchanged. */
  dirty?(): { x: number; y: number; w: number; h: number }[] | null;
  dispose?(): void;
}
export interface PerfSummary { n: number; drawn: number; fps: number; p50: number; p95: number; over20: number; over33: number; dpr: number; dprSteps: number[]; /** ms spent in the stage's draw section per drawn frame (main thread, this device) */ drawP50: number; drawP95: number }
export interface StageHandle {
  readonly canvas: HTMLCanvasElement;
  readonly audit: Audit;
  perf(reset?: boolean): PerfSummary;
  setArt(art: ArtId): void;
  resize(): void;
  invalidate(): void;
  dispose(): void;
}
export interface StageOpts { art: ArtId; young: boolean; reducedMotion?: boolean; dpr?: number; onFail?: (why: string) => void; sound?: boolean }

export function mountStage(host: HTMLElement, make: (api: ViewApi) => View, opts: StageOpts): StageHandle {
  const canvas = document.createElement("canvas");
  canvas.className = "pl-canvas";
  canvas.setAttribute("role", "application");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block";
  host.appendChild(canvas);
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const reduced = opts.reducedMotion ?? (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  let art = ART[opts.art];
  const audit = newAudit(opts.art, opts.young);
  let P = new Painter(art, audit, opts.young);
  const tw = new Tweens(); tw.reduced = reduced;
  const fx = new Juice(); fx.reduced = reduced;
  if (opts.sound === false) sound.setMuted(true);
  const maxDpr = opts.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
  let dpr = maxDpr, w = 1, h = 1, t = 0, dirty = true, disposed = false, full = true;
  const dprSteps: number[] = [];
  let targets: { id: string; x: number; y: number; w: number; h: number }[] = [];
  let lastTargets: typeof targets = [];
  const layers = new Map<string, HTMLCanvasElement>();
  const api: ViewApi = {
    get w() { return w; }, get h() { return h; }, get dpr() { return dpr; }, get t() { return t; },
    get P() { return P; }, get art() { return art; }, tw, fx, reduced, young: opts.young,
    sfx: (ev, n) => sound.play(art, ev, n ?? 0),
    target(id, x, y, tw2, th) { targets.push({ id, x, y, w: tw2, h: th }); },
    hit(x, y) { for (let i = lastTargets.length - 1; i >= 0; i--) { const r = lastTargets[i]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.id; } return null; },
    invalidate() { dirty = true; full = true; },
    layer(key, paint) {
      const k = `${key}@${art.id}@${w}x${h}@${dpr}`;
      let c = layers.get(k);
      if (!c) {
        for (const kk of [...layers.keys()]) if (kk.startsWith(key + "@")) layers.delete(kk);
        c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
        const g = c.getContext("2d")!; g.setTransform(dpr, 0, 0, dpr, 0, 0);
        try { paint(g, w, h); } catch { /* an empty layer, never a throw into the loop */ }
        layers.set(k, c);
      }
      return c;
    },
  };
  const view = make(api);

  function resize(): void {
    const r = host.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
    audit.box = { w, h };
    try { view.layout(w, h); } catch (e) { onError(e); }
    dirty = true; full = true;
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(host);

  // ── pointer: one active pointer (the child's finger)
  let active: number | null = null;
  const pos = (e: PointerEvent): [number, number] => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  // a move repaints only when the view is dragging something (a still view under a moving finger costs nothing); a view
  // that changes on a move without a drag calls api.invalidate() itself
  const fire = (k: PointerKind, e: PointerEvent) => { try { const [x, y] = pos(e); view.pointer(k, x, y); } catch (er) { onError(er); } if (k !== "move" || (view.dragging?.() ?? false)) { dirty = true; full = true; } };
  const down = (e: PointerEvent) => { if (active !== null) return; active = e.pointerId; try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic */ } sound.unlock(); fire("down", e); e.preventDefault(); };
  const move = (e: PointerEvent) => { if (active !== null && e.pointerId !== active) return; fire("move", e); };
  const up = (e: PointerEvent) => { if (e.pointerId !== active) return; fire("up", e); active = null; };
  const cancel = (e: PointerEvent) => { if (e.pointerId !== active) return; fire("cancel", e); active = null; };
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", cancel);

  // ── loop
  let raf = 0, last = performance.now(), errs: number[] = [], failed = false;
  const frames: number[] = [], drawnMs: number[] = [];
  let slow: number[] = [], drawnCount = 0;
  function onError(e: unknown): void {
    const now = performance.now(); errs = errs.filter((x) => now - x < 1000); errs.push(now);
    if (typeof console !== "undefined") console.warn("[play] frame error", String((e as Error)?.message ?? e).slice(0, 160));
    if (errs.length >= 3 && !failed) { failed = true; opts.onFail?.("frame_errors"); }
  }
  function frame(now: number): void {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const raw = now - last; last = now;
    frames.push(raw); if (frames.length > 20000) frames.splice(0, 10000);
    if (failed) return;
    let dt = Math.min(raw / 1000, 1 / 30);
    if (fx.hitstop > 0) { fx.hitstop -= dt; dt = 0; }
    t += dt;
    try { tw.step(dt); fx.step(dt); view.update(dt); } catch (e) { onError(e); }
    const busy = tw.busy || fx.busy || (view.busy?.() ?? false) || (active !== null && (view.dragging?.() ?? false));
    if (!dirty && !busy) return;
    dirty = false;
    const t0 = performance.now();
    try {
      targets = []; audit.texts = []; audit.clipped = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      // a partial repaint (the view says only these regions move, and no shake / flash / particles are live)
      const rects = !full && !fx.busy && fx.ox === 0 && fx.oy === 0 ? (view.dirty?.() ?? null) : null;
      full = false;
      ctx.save();
      if (rects?.length) { ctx.beginPath(); for (const r of rects) ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); }
      ctx.drawImage(api.layer("ground", (g, gw, gh) => P.paintGround(g, gw, gh)), 0, 0, w, h);
      ctx.save(); ctx.translate(fx.ox, fx.oy);
      view.draw(ctx);
      ctx.restore();
      fx.draw(ctx, w, h);
      ctx.restore();
      lastTargets = targets; audit.targets = targets; audit.frame++;
      drawnCount++;
    } catch (e) { onError(e); }
    const ms = performance.now() - t0;
    drawnMs.push(ms);
    slow.push(raw);
    if (slow.length >= 90) {
      const s = [...slow].sort((a, b) => a - b), med = s[s.length >> 1];
      if (med > 19.2 && dpr > 1.01 && opts.dpr == null) { const next = dpr > 1.6 ? 1.5 : dpr > 1.3 ? 1.25 : 1; dprSteps.push(next); dpr = next; resize(); }
      slow = [];
    }
  }
  resize();
  raf = requestAnimationFrame(frame);
  const onVis = () => { last = performance.now(); dirty = true; full = true; };
  document.addEventListener("visibilitychange", onVis);

  const handle: StageHandle = {
    canvas, audit,
    perf(reset = false) {
      const f = frames.slice(10), s = [...f].sort((a, b) => a - b), pct = (q: number) => (s.length ? +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2) : 0);
      const total = f.reduce((a, b) => a + b, 0);
      const dm = [...drawnMs].sort((a, b) => a - b), dq = (q: number) => (dm.length ? +dm[Math.min(dm.length - 1, Math.floor(q * dm.length))].toFixed(2) : 0);
      const out = { drawP50: dq(0.5), drawP95: dq(0.95), n: f.length, drawn: drawnCount, fps: total ? +((1000 * f.length) / total).toFixed(1) : 0, p50: pct(0.5), p95: pct(0.95), over20: f.length ? +((100 * f.filter((x) => x > 20).length) / f.length).toFixed(1) : 0, over33: f.length ? +((100 * f.filter((x) => x > 33.4).length) / f.length).toFixed(1) : 0, dpr, dprSteps: [...dprSteps] };
      if (reset) { frames.length = 0; drawnCount = 0; drawnMs.length = 0; }
      return out;
    },
    setArt(id) { art = ART[id]; audit.art = id; P = new Painter(art, audit, opts.young); layers.clear(); dirty = true; full = true; },
    resize, invalidate() { dirty = true; full = true; },
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(raf); ro?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      try { view.dispose?.(); } catch { /* gone */ }
      canvas.remove();
    },
  };
  return handle;
}
