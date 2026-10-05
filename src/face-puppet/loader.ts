// Loading the judged rig without freezing the page (ship5 p2-face). Measured on the product path (evals/p2-face, CDP CPU
// profile of the real lesson page at 4x throttle): Puppet2DRig.load + warm() ran as ONE main-thread task of ~1 s
// (texture uploads from <img> ~1/3, the 24 warm frames ~2/3, then gl.finish()), right as the lesson started; at 1x it was
// 0.2-0.45 s. The stage's second frame then came ~0.9-1.4 s after its first on the throttled profile.
// This loader does the same work in slices:
//   - the layers decode off the main thread as ImageBitmaps (premultiplied, the same pixels the runtime asks WebGL for
//     with UNPACK_PREMULTIPLY_ALPHA; WebGL ignores that flag for ImageBitmap sources, so the bitmap carries it);
//   - the rig is built by the judged constructor itself (unchanged runtime: same geometry, same textures);
//   - the warm-up poses run a few frames per task, yielding between, and one final rig.warm(1) restores the state exactly
//     as warm() leaves it (clock, physics, lip solver, life) and pays the single gl.finish() when the GPU queue is short.
// Anything missing (no createImageBitmap, a decode failure) falls back to Puppet2DRig.load + warm(), the judged path.
import { Puppet2DRig, type RigLoadOptions } from "./runtime/rig.js";

/** The warm-up poses of rig.js warm() (r5 fps): every shader program and the viseme / tongue / lid-key paths. */
const WARM_POSES: Array<Record<string, number>> = [
  { viseme_aa: 1, jawOpen: 0.6 }, { viseme_nn: 1, tongueTipUp: 0.9, jawOpen: 0.3 }, { viseme_CH: 1, jawOpen: 0.25 },
  { viseme_FF: 1 }, { viseme_PP: 1 }, { viseme_O: 1, jawOpen: 0.4 }, { tongueCurl: 0.9, viseme_DD: 1 },
  { eyeBlinkLeft: 0.5, eyeBlinkRight: 0.5 }, { eyeBlinkLeft: 1, eyeBlinkRight: 1 }, { eyeBlinkRight: 1, cheekSquintRight: 0.8, mouthSmileRight: 0.8 },
  { eyeWideLeft: 0.9, eyeWideRight: 0.9, jawOpen: 0.42 }, { mouthSmileLeft: 1, mouthSmileRight: 1, jawOpen: 0.34, cheekSquintLeft: 0.7, cheekSquintRight: 0.7 },
];
/** Main-thread budget per slice (ms): under the 50 ms long-task line even on a 4x-throttled profile. */
export const SLICE_MS = 8;

export const yieldToPage = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

export interface ChunkedLoadResult {
  rig: Puppet2DRig; path: "bitmap" | "image"; slices: number; longestSliceMs: number;
  /** Median ms of the LAST 12 warm frames (first-use / JIT costs are in the first 12): this device's rig cost per frame
   *  at its DPR, measured before the face is shown. NaN on the judged path. */
  warmFrameMs: number;
}

/** The layer names the runtime's load() fetches (rig.js: every rect but the backdrop, plus the mouth interior). */
export const layerNames = (geom: { rects: Record<string, unknown> }): string[] => Object.keys(geom.rects).filter((n) => n !== "bg").concat(["interior"]);

export async function loadRigChunked(canvas: HTMLCanvasElement, base: string, opts: RigLoadOptions, o: { signal?: { aborted: boolean }; yieldFn?: () => Promise<void> } = {}): Promise<ChunkedLoadResult> {
  const yieldFn = o.yieldFn ?? yieldToPage;
  let slices = 0, longest = 0;
  const slice = async (fn: () => void) => { const t = performance.now(); fn(); const d = performance.now() - t; longest = Math.max(longest, d); slices++; await yieldFn(); };
  if (typeof createImageBitmap !== "function") {
    const rig = await Puppet2DRig.load(canvas, base, opts);
    await slice(() => rig.warm());
    return { rig, path: "image", slices, longestSliceMs: longest, warmFrameMs: NaN };
  }
  const geom = await fetch(base + "geom.json").then((r) => { if (!r.ok) throw new Error(`geom.json ${r.status}`); return r.json(); });
  const names = layerNames(geom);
  const bitmaps: Record<string, ImageBitmap> = {};
  await Promise.all(names.map(async (n) => {
    const r = await fetch(`${base}${n}.${opts.ext || "png"}`);
    if (!r.ok) throw new Error(`${n} ${r.status}`);
    bitmaps[n] = await createImageBitmap(await r.blob(), { premultiplyAlpha: "premultiply", colorSpaceConversion: "default" });
  }));
  if (o.signal?.aborted) { for (const b of Object.values(bitmaps)) b.close(); throw new Error("aborted"); }
  let rig!: Puppet2DRig;
  // the judged constructor: geometry, meshes and 29 texture uploads (cheap from a decoded bitmap)
  await slice(() => { rig = new (Puppet2DRig as unknown as new (c: HTMLCanvasElement, g: unknown, m: null, i: Record<string, ImageBitmap>, op: RigLoadOptions) => Puppet2DRig)(canvas, geom, null, bitmaps, opts); });
  for (const b of Object.values(bitmaps)) b.close(); // uploaded; a context restore reloads the pack (stage.ts onRestored)
  // the warm-up poses, a few frames per task (rig.js warm(): 24 frames over these 12 poses)
  const saveClock = rig.clock, saveT = rig.lastT;
  const frameMs: number[] = [];
  let i = 0;
  while (i < 24) {
    if (o.signal?.aborted) { rig.dispose(); throw new Error("aborted"); }
    await slice(() => {
      const t0 = performance.now();
      do {
        const f0 = performance.now();
        rig.clock = 5000 + i / 60;
        rig.frame(WARM_POSES[i % WARM_POSES.length], [3 * Math.sin(i), 8 * Math.sin(i * 0.7), 4 * Math.cos(i)], [5 * Math.sin(i), 3 * Math.cos(i)], 0, Math.sin(i));
        frameMs.push(performance.now() - f0);
        i++;
      } while (i < 24 && performance.now() - t0 < SLICE_MS);
    });
  }
  // one more judged warm frame: with the pre-warm clock put back first, it restores clock, lastT, physics, lip solver and
  // life exactly as warm() leaves them, and pays the one gl.finish()
  // (the per-frame state is reset first, as warm() resets it after its frames: warm(1)'s clock restarts at 5000 s, and the
  // lip solver and life keep their own last time, which must never run backwards)
  await slice(() => {
    const r = rig as unknown as { solver: object; life: object; prevAnchor: unknown; reduced: boolean; resetPhysics(): void };
    rig.clock = saveClock; rig.lastT = saveT;
    r.resetPhysics();
    r.solver = new (r.solver.constructor as new () => object)();
    r.life = new (r.life.constructor as new (o: { reduced: boolean }) => object)({ reduced: r.reduced });
    r.prevAnchor = null;
    rig.warm(1);
  });
  const late = frameMs.slice(12).sort((a, b) => a - b);
  return { rig, path: "bitmap", slices, longestSliceMs: longest, warmFrameMs: late.length ? late[late.length >> 1] : NaN };
}
