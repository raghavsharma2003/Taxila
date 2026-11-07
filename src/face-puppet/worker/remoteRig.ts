// The main-thread side of the off-thread rig (./rigWorker.ts). RemoteRig looks like a rig to the stage and the driver
// (clock, frame(), R.dpr, view, reduced, life, calm, stats(), dispose()), but frame() only posts the blendshapes; the
// worker draws. Frames never queue: while one is being drawn, newer frames replace the pending one (latest wins), so a
// slow device drops frames instead of falling behind her voice.
// startWorkerRig() transfers the canvas to the worker. It is used only where workerRigSupported() says the browser can
// draw that rig kind in a worker; any later failure (the worker errors, the context is lost) is reported to the stage,
// which rebuilds a fresh canvas on the main-thread path (no visible change: the still holds the slot meanwhile).

export type RigKind = "mesh" | "keys";

/** Whether this browser can draw a rig kind from a worker: OffscreenCanvas, transferControlToOffscreen, module workers,
 *  and a WebGL2 context on an OffscreenCanvas for the mesh rig (Canvas 2D for the key rig). Probed once per kind. */
const probed = new Map<RigKind, boolean>();
export function workerRigSupported(kind: RigKind): boolean {
  const known = probed.get(kind);
  if (known !== undefined) return known;
  let ok = false;
  try {
    ok = typeof Worker === "function" && typeof OffscreenCanvas === "function"
      && typeof HTMLCanvasElement !== "undefined" && typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function";
    if (ok) {
      const c = new OffscreenCanvas(1, 1);
      const ctx = c.getContext(kind === "mesh" ? "webgl2" : "2d");
      ok = !!ctx;
      if (ctx && kind === "mesh") (ctx as WebGL2RenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    ok = false;
  }
  probed.set(kind, ok);
  return ok;
}
/** Tests / the device flag: forget the probe. */
export function resetWorkerRigProbe(): void {
  probed.clear();
}

type FrameMsg = { t: "frame"; clock: number; bs: Record<string, number>; head: number[]; gaze: number[]; lean: number; breath: number; dpr: number; calm: boolean; reduced: boolean };

export class RemoteRig {
  clock: number | null = null;
  lastT = 0;
  readonly R: { dpr: number; draws: number; tris: number };
  reduced: boolean;
  life: { reduced: boolean };
  calm = false;
  readonly kind: RigKind;
  /** The last drawn frame's mouth state (the stage's mouthProbe) and the rig's own time for it (the governor). */
  mouth = { name: "", p: { g: 0 } };
  rigMs: number[] = [];
  /** Frames sent and frames replaced before the worker took them (latest wins). */
  sent = 0;
  dropped = 0;
  private w: Worker;
  private busy = false;
  private pending: FrameMsg | null = null;
  private _view: number[];
  private onDrawn: (() => void) | null = null;
  private disposed = false;

  constructor(w: Worker, kind: RigKind, o: { dpr: number; view: number[]; reduced: boolean }) {
    this.w = w;
    this.kind = kind;
    this.R = { dpr: o.dpr, draws: 0, tris: 0 };
    this._view = o.view;
    this.reduced = o.reduced;
    this.life = { reduced: o.reduced };
  }

  get view(): number[] { return this._view; }
  set view(v: number[]) { this._view = v; this.w.postMessage({ t: "view", view: v }); }

  /** The CSS box of the canvas (the worker cannot measure it). */
  size(w: number, h: number): void { this.w.postMessage({ t: "size", css: [w, h] }); }

  /** Called by the stage for each drawn frame (firstDraw / reveal bookkeeping happen there). */
  set drawnHook(fn: (() => void) | null) { this.onDrawn = fn; }

  frame(bs: Record<string, number>, head: number[], gaze: number[], lean: number, breath: number): void {
    if (this.disposed) return;
    const m: FrameMsg = { t: "frame", clock: this.clock ?? performance.now() / 1000, bs: { ...bs }, head: [...head], gaze: [...gaze], lean, breath, dpr: this.R.dpr, calm: this.calm, reduced: this.reduced };
    if (this.busy) { if (this.pending) this.dropped++; this.pending = m; return; }
    this.busy = true;
    this.sent++;
    this.w.postMessage(m);
  }

  /** The worker's answer to one frame (`skipped`: it had no rig, e.g. during a context loss: nothing was drawn). */
  drawn(d: { rigMs: number; gap: number; name: string; skipped?: boolean }): void {
    if (!d.skipped) {
      this.rigMs.push(d.rigMs);
      if (this.rigMs.length > 120) this.rigMs.shift();
      this.mouth.name = d.name;
      this.mouth.p.g = d.gap;
      this.onDrawn?.();
    }
    const next = this.pending;
    this.pending = null;
    this.busy = false;
    if (next && !this.disposed) { this.busy = true; this.sent++; this.w.postMessage(next); }
  }

  /** The worker rebuilt the rig on a restored context: its timings start again (the stage re-reveals on them). */
  restored(): void {
    this.rigMs = [];
  }

  /** Evals only: lose the worker's GL context now and restore it after `restoreAfterMs` (WEBGL_lose_context). */
  debugLoseContext(restoreAfterMs: number): void {
    this.w.postMessage({ t: "lose", restoreAfterMs });
  }

  stats(): { triangles: number; meshes: number } { return { triangles: 0, meshes: 0 }; }
  warm(): void { /* warmed in the worker */ }
  resetPhysics(): void { /* the worker's rig owns its physics */ }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    try { this.w.postMessage({ t: "dispose" }); } catch { /* gone */ }
    setTimeout(() => this.w.terminate(), 200);
  }
}

export interface WorkerRigStart { rig: RemoteRig; warmFrameMs: number; path: string }

/**
 * Hand `canvas` to a new rig worker and load the pack there. Resolves when the worker's rig is warm; rejects on a
 * worker error (the canvas is then unusable on the main thread: the caller makes a new one). `onEvent` receives the
 * worker's later messages (drawn frames, context loss, errors).
 */
export function startWorkerRig(canvas: HTMLCanvasElement, kind: RigKind, base: string, opts: Record<string, unknown>, cssBox: [number, number],
  onLater: (m: { t: "lost" } | { t: "restored" } | { t: "error"; message: string }) => void, timeoutMs = 8000): Promise<WorkerRigStart> {
  return new Promise((resolve, reject) => {
    let w: Worker;
    try {
      w = new Worker(new URL("./rigWorker.ts", import.meta.url), { type: "module", name: "taxila-rig" });
    } catch (e) {
      reject(e);
      return;
    }
    let rig: RemoteRig | null = null;
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; w.terminate(); reject(new Error("worker rig load timeout")); } }, timeoutMs);
    w.onmessage = (ev: MessageEvent) => {
      const m = ev.data as { t: string; [k: string]: unknown };
      if (m.t === "drawn") rig?.drawn(m as never);
      else if (m.t === "ready" && !settled) {
        settled = true;
        clearTimeout(timer);
        rig = new RemoteRig(w, kind, { dpr: Number(opts.dpr) || 1, view: (opts.view as number[]) ?? [], reduced: !!opts.reducedMotion });
        resolve({ rig, warmFrameMs: Number(m.warmFrameMs), path: String(m.path) });
      } else if (m.t === "error") {
        if (!settled) { settled = true; clearTimeout(timer); w.terminate(); reject(new Error(String(m.message))); }
        else onLater({ t: "error", message: String(m.message) });
      } else if (m.t === "lost") onLater({ t: "lost" });
      else if (m.t === "restored") { rig?.restored(); onLater({ t: "restored" }); }
    };
    w.onerror = (e) => {
      if (!settled) { settled = true; clearTimeout(timer); w.terminate(); reject(new Error(`worker: ${e.message}`)); }
      else onLater({ t: "error", message: e.message });
    };
    const off = canvas.transferControlToOffscreen();
    w.postMessage({ t: "init", canvas: off, kind, base, opts, css: cssBox }, [off]);
  });
}
