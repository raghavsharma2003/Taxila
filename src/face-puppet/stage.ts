// PuppetStage: the imperative host for the 2D puppet (the 2D twin of src/avatar/three/stage3d.ts). It owns the canvas,
// the WebGL2 rig, the frame loop and every failure path; React only mounts and unmounts it (PuppetFace.tsx).
//
// Frame loop: rAF, 60 fps target. Each frame = tap read → PuppetDriver (lip, floor, acting) → rig deform + draw.
// Governor (low CPU on cheap phones): the frame's JS work (driver + rig) is tracked over a rolling 2 s window; if its p95
// exceeds the budget the stage steps down, in order: DPR → 1.5 → 1, then a 30 fps cap; if a 30 fps / DPR 1 frame still
// cannot fit, the stage reports `fallback: slow` and the host shows the fallback face. It never steps back up within a
// page (no oscillation). Hidden tab: rAF stops, nothing runs.
// Failures → `fallback` events (the host decides the face): no WebGL2, asset load error, load timeout (8 s), a second
// context loss, the governor floor. A first context loss shows the poster and rebuilds once on restore.
// Audio floor: nothing here touches playback; the tap is analysis-only (src/avatar/tap.ts).
import { Puppet2DRig } from "./runtime/rig.js";
import { PuppetDriver } from "./driver.ts";
import { puppetBus } from "./bus.ts";
import { PUPPET_BASE, PUPPET_CLEAR, PUPPET_VIEW } from "./assets.ts";
import { TeacherTap, type TapSource } from "../avatar/tap.ts";
import { faceCues, faceAffectOf, gazeAngles, gazeElement, type FaceCue } from "../avatar/faceCues.ts";
import type { FloorStatus } from "../avatar/behaviour.ts";

export type PuppetStageEvent =
  | { type: "loaded"; ms: number }
  | { type: "reveal"; ms: number }
  | { type: "fallback"; reason: string }
  | { type: "contextlost" }
  | { type: "governor"; step: string; workP95: number }
  | { type: "stats"; fpsP50: number; intervalP95: number; workP95: number; rigP95: number; dpr: number; fpsCap: number; draws: number; tris: number; lipSource: string };

export interface PuppetStageOptions {
  band: string;
  sources: TapSource[];
  framing?: "medium" | "close";
  reducedMotion?: boolean;
  gentle?: boolean;
  seed?: number;
  /** Base URL of the pack (default the shipped rev). */
  base?: string;
  /** Budget for the frame's JS work at p95 (ms). 8 ms leaves half a 60 fps frame for the GPU and the page. */
  budgetMs?: number;
  loadTimeoutMs?: number;
  onEvent?: (e: PuppetStageEvent) => void;
}

const pct = (a: number[], q: number) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

export class PuppetStage {
  readonly canvas: HTMLCanvasElement;
  readonly driver: PuppetDriver;
  private host: HTMLElement;
  private o: PuppetStageOptions;
  private rig: Puppet2DRig | null = null;
  private tap: TeacherTap;
  private raf = 0;
  private running = false;
  private disposed = false;
  private status: FloorStatus | null = null;
  private childLevel = 0;
  private dpr: number;
  private fpsCap = 60;
  private lastDraw = 0;
  private lastNow = 0;
  private work: number[] = [];
  private rigMs: number[] = [];
  private intervals: number[] = [];
  private frames = 0;
  private revealed = false;
  private losses = 0;
  private lastStep = 0;
  private lipSource = "none";
  private offs: Array<() => void> = [];
  private timers = new Set<number>();
  private t0 = performance.now();

  constructor(host: HTMLElement, o: PuppetStageOptions) {
    this.host = host;
    this.o = o;
    this.dpr = Math.min(2, typeof devicePixelRatio === "number" ? devicePixelRatio : 1);
    this.driver = new PuppetDriver({ band: o.band, seed: o.seed, reducedMotion: o.reducedMotion, gentle: o.gentle });
    this.tap = new TeacherTap(o.sources);
    const c = document.createElement("canvas");
    c.className = "fp-canvas";
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 220ms ease-out;display:block";
    this.canvas = c;
    c.addEventListener("webglcontextlost", this.onLost, false);
    c.addEventListener("webglcontextrestored", this.onRestored, false);
  }

  private emit(e: PuppetStageEvent): void {
    try {
      this.o.onEvent?.(e);
    } catch {
      /* a host callback must never break the face */
    }
  }

  /** Load the pack and the rig; resolves when the first frame can draw. Rejects → the host falls back. */
  async init(): Promise<void> {
    const t0 = performance.now();
    if (typeof WebGL2RenderingContext === "undefined") throw new Error("no WebGL2");
    this.host.appendChild(this.canvas);
    const view = [...PUPPET_VIEW[this.o.framing ?? "medium"]] as [number, number, number];
    const load = Puppet2DRig.load(this.canvas, this.o.base ?? PUPPET_BASE, { ext: "webp", dpr: this.dpr, view, clear: PUPPET_CLEAR, reducedMotion: this.o.reducedMotion });
    const timeout = new Promise<never>((_, rej) => { const id = window.setTimeout(() => rej(new Error("puppet load timeout")), this.o.loadTimeoutMs ?? 8000); this.timers.add(id); });
    const rig = await Promise.race([load, timeout]);
    if (this.disposed) { rig.dispose(); return; }
    rig.warm();
    this.rig = rig;
    this.emit({ type: "loaded", ms: Math.round(performance.now() - t0) });
    this.subscribe();
  }

  private subscribe(): void {
    this.offs.push(puppetBus.on((e) => {
      const now = performance.now();
      if (e.kind === "visemes") this.driver.visemes.push(e.part, e.playAt, e.visemes, e.words ?? [], now);
      else if (e.kind === "cut") this.driver.cut();
      else if (e.kind === "duplex") {
        const c = e.cue;
        if (c.kind === "pose") this.driver.pose(c.pose, now);
        else if (c.kind === "nod") this.driver.nodCue(c.peakDeg, now);
        // "clip" cues are audio (the mm bank): the face does not invent a mouth for a sound it was not given
      }
    }));
    this.offs.push(faceCues.on((cue: FaceCue) => this.onCue(cue)));
  }

  private onCue(cue: FaceCue): void {
    const now = performance.now();
    if (cue.kind === "affect") {
      const a = faceAffectOf(cue.display, this.o.band);
      if (a) this.driver.affect(a.emotion, a.intensity, now);
    } else if (cue.kind === "gaze") {
      if (cue.target === "child") return;
      const el = gazeElement(cue.target, document);
      if (!el) return;
      const a = this.host.getBoundingClientRect(), b = el.getBoundingClientRect();
      if (!a.width || !b.width) return;
      const [yaw, pitch] = gazeAngles({ x: a.left, y: a.top, w: a.width, h: a.height }, { x: b.left, y: b.top, w: b.width, h: b.height });
      this.driver.lookAt(yaw, pitch, cue.holdMs / 1000, cue.reason);
    } else if (cue.kind === "voice") {
      const kind = cue.event.kind;
      const id = window.setTimeout(() => { this.timers.delete(id); this.driver.voiceEvent(kind); }, Math.max(0, Math.min(10_000, cue.event.atMs)));
      this.timers.add(id);
    }
  }

  set(p: { status?: FloorStatus | null; reducedMotion?: boolean; gentle?: boolean; childLevel?: number }): void {
    if (p.status !== undefined) this.status = p.status;
    if (p.childLevel !== undefined) this.childLevel = p.childLevel;
    if (p.reducedMotion !== undefined || p.gentle !== undefined) {
      this.driver.setMotion({ reduced: p.reducedMotion, gentle: p.gentle });
      if (this.rig && p.reducedMotion !== undefined) { this.rig.reduced = p.reducedMotion; this.rig.life.reduced = p.reducedMotion; }
    }
  }

  start(): void {
    if (this.running || this.disposed) return;
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.tick(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** One frame (public for the deterministic evals: tick(now) with a scripted clock). */
  tick(now: number): void {
    const rig = this.rig;
    if (!rig || this.disposed) return;
    if (this.lastNow) this.intervals.push(now - this.lastNow);
    this.lastNow = now;
    if (this.fpsCap < 60 && now - this.lastDraw < 1000 / this.fpsCap - 2) return;
    this.lastDraw = now;
    const w0 = performance.now();
    const tap = this.tap.read();
    rig.R.dpr = this.dpr;
    const r0 = performance.now();
    const f = this.driver.frame({ nowMs: now, tap, status: this.status, childLevel: this.childLevel }, rig);
    const rigMs = performance.now() - r0 - f.workMs;
    const work = performance.now() - w0;
    this.lipSource = f.lipSource;
    this.work.push(work);
    this.rigMs.push(rigMs);
    if (this.work.length > 120) { this.work.shift(); this.rigMs.shift(); }
    if (this.intervals.length > 120) this.intervals.shift();
    this.frames++;
    // reveal in her silence (never cross-fade a face in mid-word), or after 2.5 s regardless
    if (!this.revealed && this.frames > 2 && (f.state !== "speaking" || now - this.t0 > 2500)) {
      this.revealed = true;
      this.canvas.style.opacity = "1";
      this.emit({ type: "reveal", ms: Math.round(now - this.t0) });
    }
    if (this.frames % 60 === 0) {
      this.govern(now);
      const st = rig.stats();
      this.emit({ type: "stats", fpsP50: 1000 / Math.max(1, pct(this.intervals, 0.5)), intervalP95: pct(this.intervals, 0.95), workP95: pct(this.work, 0.95), rigP95: pct(this.rigMs, 0.95), dpr: this.dpr, fpsCap: this.fpsCap, draws: st.meshes, tris: st.triangles, lipSource: this.lipSource });
    }
  }

  private govern(now: number): void {
    if (this.work.length < 90 || now - this.lastStep < 2000) return;
    const budget = this.o.budgetMs ?? 8;
    const p95 = pct(this.work, 0.95);
    if (p95 <= budget * (this.fpsCap < 60 ? 2 : 1)) return;
    this.lastStep = now;
    this.work.length = 0;
    this.rigMs.length = 0;
    let step: string;
    if (this.dpr > 1.5) { this.dpr = 1.5; step = "dpr 1.5"; }
    else if (this.dpr > 1) { this.dpr = 1; step = "dpr 1"; }
    else if (this.fpsCap > 30) { this.fpsCap = 30; step = "30 fps"; }
    else { step = "floor"; this.emit({ type: "governor", step, workP95: p95 }); this.emit({ type: "fallback", reason: `slow: work p95 ${p95.toFixed(1)} ms at 30 fps, dpr 1` }); this.stop(); return; }
    this.emit({ type: "governor", step, workP95: p95 });
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.losses++;
    this.stop();
    this.canvas.style.opacity = "0";
    this.revealed = false;
    this.emit({ type: "contextlost" });
    if (this.losses > 1) this.emit({ type: "fallback", reason: "webgl context lost twice" });
    else {
      // the restore may never come (the GPU process died): give it 3 s, then fall back
      const id = window.setTimeout(() => { this.timers.delete(id); if (!this.running && !this.disposed) this.emit({ type: "fallback", reason: "webgl context not restored" }); }, 3000);
      this.timers.add(id);
    }
  };

  private onRestored = () => {
    if (this.disposed || this.losses > 1) return;
    // every GL object died with the context: rebuild the rig (the pack is in the HTTP cache)
    this.rig = null;
    const view = [...PUPPET_VIEW[this.o.framing ?? "medium"]] as [number, number, number];
    Puppet2DRig.load(this.canvas, this.o.base ?? PUPPET_BASE, { ext: "webp", dpr: this.dpr, view, clear: PUPPET_CLEAR, reducedMotion: this.o.reducedMotion })
      .then((rig) => { if (this.disposed) return rig.dispose(); rig.warm(); this.rig = rig; this.t0 = performance.now(); this.frames = 0; this.start(); })
      .catch((err: unknown) => this.emit({ type: "fallback", reason: `rebuild after context loss failed: ${String(err).slice(0, 120)}` }));
  };

  /** Stats for the evals and the owner's ?facerig read-out. */
  snapshot() {
    const st = this.rig?.stats() ?? { triangles: 0, meshes: 0 };
    return { frames: this.frames, fpsP50: 1000 / Math.max(1, pct(this.intervals, 0.5)), intervalP95: pct(this.intervals, 0.95), workP50: pct(this.work, 0.5), workP95: pct(this.work, 0.95), rigP95: pct(this.rigMs, 0.95), dpr: this.dpr, fpsCap: this.fpsCap, draws: st.meshes, tris: st.triangles, lipSource: this.lipSource, revealed: this.revealed, state: this.driver.policy.faceState };
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    for (const off of this.offs) off();
    this.offs = [];
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.clear();
    this.tap.dispose();
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    this.rig?.dispose();
    this.rig = null;
    this.canvas.remove();
  }
}
