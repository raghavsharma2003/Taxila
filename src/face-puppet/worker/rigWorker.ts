// The puppet's rig, off the main thread (round 7 face-puppet-raster-cost-main-thread, part 2). The stage keeps the
// driver on the main thread (audio tap, bus, cues and gaze need the page) and sends each frame's blendshapes here; this
// worker owns the OffscreenCanvas and runs the SAME rig code the main-thread path runs (the judged mesh runtime for r8,
// the painted-key rig for lamp2): load, warm-up, apply + render. So a rig frame (tens of ms on a software rasteriser)
// never holds the page's main thread, and the child's turn POST is never queued behind a frame.
// Protocol (./remoteRig.ts is the main-thread side):
//   in  { t: "init", canvas, kind: "mesh"|"keys", base, opts, css: [w, h] }   → out { t: "ready", warmFrameMs, path } | { t: "error", message }
//   in  { t: "frame", clock, bs, head, gaze, lean, breath, dpr, calm, reduced }  → out { t: "drawn", rigMs, gap, name }
//   in  { t: "size", css: [w, h] } · { t: "view", view } · { t: "dispose" }
//   out { t: "lost" } when the GL context is lost (the stage then holds her still)

// The runtimes read the canvas's CSS box (clientWidth / clientHeight) and make one small 2D canvas with
// document.createElement; an OffscreenCanvas has neither, so the worker supplies both (the box comes from the stage).
const g = globalThis as unknown as { document?: unknown; window?: unknown };
g.document ??= { createElement: (tag: string) => (tag === "canvas" ? new OffscreenCanvas(1, 1) : null) };
g.window ??= globalThis;

type Rig = {
  clock: number | null;
  frame(bs: Record<string, number>, head: number[], gaze: number[], lean: number, breath: number): void;
  R: { dpr: number };
  view: number[];
  reduced: boolean;
  life: { reduced: boolean };
  calm?: boolean;
  dispose(): void;
  solver?: { p?: { g?: number } };
  mouth?: { name: string; p?: { g: number } };
};

let rig: Rig | null = null;
let canvas: OffscreenCanvas | null = null;
let css: [number, number] = [1, 1];

const post = (m: unknown) => (self as unknown as { postMessage(m: unknown): void }).postMessage(m);

function boxed(c: OffscreenCanvas): void {
  Object.defineProperty(c, "clientWidth", { get: () => css[0], configurable: true });
  Object.defineProperty(c, "clientHeight", { get: () => css[1], configurable: true });
}

async function init(m: { canvas: OffscreenCanvas; kind: "mesh" | "keys"; base: string; opts: Record<string, unknown>; css: [number, number] }) {
  canvas = m.canvas;
  css = m.css;
  boxed(canvas);
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); post({ t: "lost" }); });
  if (m.kind === "keys") {
    const { KeyRig } = await import("../rig-keys/keyrig.ts");
    const r = await KeyRig.load(canvas as unknown as HTMLCanvasElement, m.base, m.opts);
    r.warm();
    rig = r as unknown as Rig;
    post({ t: "ready", warmFrameMs: NaN, path: "worker-keys" });
    return;
  }
  const { loadRigChunked } = await import("../loader.ts");
  const res = await loadRigChunked(canvas as unknown as HTMLCanvasElement, m.base, m.opts as never);
  rig = res.rig as unknown as Rig;
  post({ t: "ready", warmFrameMs: res.warmFrameMs, path: `worker-${res.path}` });
}

self.onmessage = (ev: MessageEvent) => {
  const m = ev.data as { t: string } & Record<string, unknown>;
  try {
    if (m.t === "init") {
      init(m as never).catch((e: unknown) => post({ t: "error", message: String((e as Error)?.message ?? e).slice(0, 200) }));
    } else if (m.t === "frame" && rig) {
      const t0 = performance.now();
      rig.R.dpr = m.dpr as number;
      if (rig.reduced !== m.reduced) { rig.reduced = !!m.reduced; rig.life.reduced = !!m.reduced; }
      if ("calm" in rig) rig.calm = !!m.calm;
      rig.clock = m.clock as number;
      rig.frame(m.bs as Record<string, number>, m.head as number[], m.gaze as number[], m.lean as number, m.breath as number);
      post({ t: "drawn", rigMs: performance.now() - t0, gap: rig.solver?.p?.g ?? rig.mouth?.p?.g ?? 0, name: rig.mouth?.name ?? "" });
    } else if (m.t === "size") {
      css = m.css as [number, number];
    } else if (m.t === "view" && rig) {
      rig.view = m.view as number[];
    } else if (m.t === "dispose") {
      rig?.dispose();
      rig = null;
      (self as unknown as { close(): void }).close();
    }
  } catch (e) {
    post({ t: "error", message: String((e as Error)?.message ?? e).slice(0, 200) });
  }
};
