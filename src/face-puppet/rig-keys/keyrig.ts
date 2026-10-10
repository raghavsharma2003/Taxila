// lamp2 KeyRig: the painted-key puppet. Implements the driver's RigLike (driver.ts: clock + frame(bs, head, gaze, lean,
// breath)) plus the surface the stage reads from a rig (R.dpr, view, reduced, life.reduced, mouth, stats, warm, dispose),
// so PuppetDriver drives it unchanged. Canvas 2D, no WebGL: per frame it draws two rigid layers and at most five
// painted patches (brows, eyes, two mouths in a crossfade). No mesh, no warp.
// Quality and cost: every layer is resampled ONCE per canvas size into a cache at device resolution (high-quality
// downscale; the 80 px speech row draws 1/7-scale bitmaps, never a 900 px image per frame), so a frame is a handful of
// near-1:1 bilinear blits. Patches are cached on the head layer's own pixel grid (their sub-pixel offset baked in), so a
// key registers with the face it sits on exactly, whatever the head's motion.
import { BrowKeys, EyeKeys, HeadMotion, MOTION, MouthKeys, type BrowKey, type EyeKey, type MouthKey, type Pose, type Swap } from "./schedule.ts";

type Rect = [number, number, number, number];
export interface KeyGeom {
  rev: string;
  size: [number, number];
  clear: [number, number, number];
  rects: { body: Rect; head: Rect };
  keys: Record<string, { region: string; rect: Rect }>;
  views: Record<string, [number, number, number, number]>;
  pivot: [number, number];
  hem: number;
}
export type Source = CanvasImageSource & { width: number; height: number };

export interface KeyRigOptions {
  dpr?: number;
  view?: number[];
  clear?: [number, number, number];
  reducedMotion?: boolean;
  seed?: number;
}

type Ctx = CanvasRenderingContext2D;
interface Cached { c: HTMLCanvasElement | OffscreenCanvas; ox: number; oy: number }

const mkCanvas = (w: number, h: number): HTMLCanvasElement | OffscreenCanvas => {
  if (typeof OffscreenCanvas === "function") return new OffscreenCanvas(Math.max(1, w), Math.max(1, h));
  const c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h); return c;
};

export class KeyRig {
  static async load(canvas: HTMLCanvasElement, base: string, opts: KeyRigOptions = {}): Promise<KeyRig> {
    const geom = (await (await fetch(`${base}geom.json`)).json()) as KeyGeom;
    const names = ["body", "head", ...Object.keys(geom.keys)];
    const imgs: Record<string, Source> = {};
    await Promise.all(names.map(async (n) => {
      const r = await fetch(`${base}${n}.webp`);
      if (!r.ok) throw new Error(`lamp2 pack: ${n}.webp ${r.status}`);
      imgs[n] = await createImageBitmap(await r.blob());
    }));
    return new KeyRig(canvas, geom, imgs, opts);
  }

  readonly geom: KeyGeom;
  readonly R: { canvas: HTMLCanvasElement; dpr: number; draws: number; tris: number; gl: null };
  clock: number | null = null;
  lastT = 0;
  reduced: boolean;
  view: number[];
  life: { reduced: boolean; still?: boolean };
  /** For the stage's mouthProbe and the evals: the key the eye sees most of, and the seal gap (0 when sealed). */
  mouth: { name: string; row: string; p: { g: number } } = { name: "rest", row: "keys", p: { g: 0 } };
  eyesShown: Swap<EyeKey> = { a: "open", b: "open", k: 1 };
  mouthShown: Swap<MouthKey> = { a: "rest", b: "rest", k: 1 };
  browsShown: Swap<BrowKey> = { a: "neutral", b: "neutral", k: 1 };
  pose: Pose = { rot: 0, sway: 0, nod: 0, breath: 0, lean: 0 };
  /** The safety turn (calm_steady): the host sets it from PuppetDriver.inSafety every frame. The closed mouth is then
   *  the calm neutral key and the brows stay neutral; speech keys are unchanged (none of them smiles). */
  calm = false;
  readonly mouthKeys = new MouthKeys();
  readonly eyeKeys: EyeKeys;
  readonly browKeys = new BrowKeys();
  private motion = new HeadMotion();
  private ctx: Ctx;
  private imgs: Record<string, Source>;
  private clear: string;
  private cache: Record<string, Cached> = {};
  private cacheKey = "";
  private scale = 1;
  private origin = [0, 0];
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, geom: KeyGeom, imgs: Record<string, Source>, opts: KeyRigOptions = {}) {
    this.geom = geom;
    this.imgs = imgs;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("no 2d context");
    this.ctx = ctx;
    this.R = { canvas, dpr: opts.dpr ?? 1, draws: 0, tris: 0, gl: null };
    this.view = opts.view ?? geom.views.medium;
    this.reduced = !!opts.reducedMotion;
    this.life = { reduced: this.reduced };
    const c = opts.clear ?? geom.clear;
    this.clear = `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
    this.eyeKeys = new EyeKeys(opts.seed ?? 11);
  }

  /** Canvas size from its CSS box x dpr; rebuilds the layer caches when the size or the framing changes. */
  private layout(): void {
    const cv = this.R.canvas;
    const cw = Math.max(1, Math.round((cv.clientWidth || cv.width / this.R.dpr) * this.R.dpr));
    const ch = Math.max(1, Math.round((cv.clientHeight || cv.height / this.R.dpr) * this.R.dpr));
    if (cv.width !== cw) cv.width = cw;
    if (cv.height !== ch) cv.height = ch;
    const v = this.view, vh = v[3] ?? v[2];
    const s = Math.min(cw / v[2], ch / vh);
    // contain-centred framing, as the r8 / lamp1 runtime fits a 4-element view
    this.origin = [v[0] + (v[2] - cw / s) / 2, v[1] + (vh - ch / s) / 2];
    this.scale = s;
    const key = `${cw}x${ch}|${v.join(",")}`;
    if (key !== this.cacheKey) { this.cacheKey = key; this.build(); }
  }

  /** Resample every layer once at device scale. Patches are drawn into the head layer's device grid. */
  private build(): void {
    const s = this.scale, g = this.geom;
    const put = (name: string, rect: Rect, gridX: number, gridY: number) => {
      const img = this.imgs[name];
      if (!img) return;
      // device-space position of the rect's corner relative to the grid origin
      const fx = (rect[0] - gridX) * s, fy = (rect[1] - gridY) * s;
      const ox = Math.floor(fx), oy = Math.floor(fy);
      const w = Math.ceil((rect[2] - rect[0]) * s + (fx - ox)) + 1, h = Math.ceil((rect[3] - rect[1]) * s + (fy - oy)) + 1;
      const c = mkCanvas(w, h);
      const x = c.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
      x.imageSmoothingEnabled = true;
      x.imageSmoothingQuality = "high";
      x.drawImage(img, fx - ox, fy - oy, (rect[2] - rect[0]) * s, (rect[3] - rect[1]) * s);
      this.cache[name] = { c, ox, oy };
    };
    this.cache = {};
    put("body", g.rects.body, 0, 0);
    // the head grid: the head rect's own corner (keys are placed on it)
    const hx = g.rects.head[0], hy = g.rects.head[1];
    put("head", g.rects.head, hx, hy);
    for (const [k, v] of Object.entries(g.keys)) put(k, v.rect, hx, hy);
  }

  apply(bs: Record<string, number>, head: number[], gaze: number[], lean: number, breath: number): void {
    const t = this.clock ?? performance.now() / 1000;
    this.lastT = t;
    const tMs = t * 1000;
    const calm = this.calm;
    this.mouthShown = this.mouthKeys.step(tMs, { bs, calm });
    const speaking = this.mouthKeys.last !== "rest" && this.mouthKeys.last !== "calm" && this.mouthKeys.last !== "smile";
    this.eyesShown = this.eyeKeys.step(tMs, { gaze, speaking, reduced: this.reduced });
    this.browsShown = this.browKeys.step(tMs, bs, calm, this.eyesShown.b === "lookUp");
    this.pose = this.motion.step(tMs, head, lean, breath, this.reduced || this.life.reduced);
    const m = this.mouthShown;
    this.mouth.name = m.k >= 0.5 ? m.b : m.a;
    this.mouth.p.g = this.mouth.name === "mbp" ? 0 : this.mouthKeys.openness(tMs) * 10;
  }

  render(): void {
    if (this.disposed) return;
    this.layout();
    const ctx = this.ctx, s = this.scale, g = this.geom, p = this.pose;
    let draws = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.clear;
    ctx.fillRect(0, 0, this.R.canvas.width, this.R.canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low";
    // figure transform: native px -> device px, with the sway and the lean (scale about the hem centre)
    const [ox0, oy0] = this.origin;
    const lean = 1 + 0.006 * p.lean;
    const cx = g.pivot[0], hem = g.hem;
    const fig = (extraY = 0) => {
      ctx.setTransform(s, 0, 0, s, (-ox0 + p.sway) * s, (-oy0) * s);
      ctx.translate(cx, hem); ctx.scale(lean, lean); ctx.translate(-cx, -hem + extraY);
    };
    // body: breathing is a vertical scale about the hem (the shoulders rise a fraction of a pixel)
    fig();
    const by = 1 + p.breath * MOTION.breathScale;
    ctx.translate(0, hem); ctx.scale(1, by); ctx.translate(0, -hem);
    const B = this.cache.body;
    if (B) { ctx.drawImage(B.c, B.ox / s, B.oy / s, B.c.width / s, B.c.height / s); draws++; }
    // head: rides the breath at the neck, nods a few px, rolls about the neck pivot
    const neckRise = (hem - g.pivot[1]) * p.breath * MOTION.breathScale;
    fig(-neckRise + p.nod);
    ctx.translate(g.pivot[0], g.pivot[1]); ctx.rotate((p.rot * Math.PI) / 180); ctx.translate(-g.pivot[0], -g.pivot[1]);
    const hx = g.rects.head[0], hy = g.rects.head[1];
    const blit = (name: string, alpha = 1) => {
      const C = this.cache[name];
      if (!C || alpha <= 0.001) return;
      ctx.globalAlpha = alpha;
      ctx.drawImage(C.c, hx + C.ox / s, hy + C.oy / s, C.c.width / s, C.c.height / s);
      draws++;
    };
    blit("head");
    const pair = <K extends string>(sw: Swap<K>, none: K) => {
      if (sw.k >= 1 || sw.a === sw.b) { if (sw.b !== none) blit(sw.b); return; }
      if (sw.a !== none) blit(sw.a);
      if (sw.b !== none) blit(sw.b, sw.k);
    };
    const fadeOut = <K extends string>(sw: Swap<K>, none: K) => sw.k < 1 && sw.b === none && sw.a !== none;
    for (const [sw, none] of [[this.browsShown, "neutral"], [this.eyesShown, "open"], [this.mouthShown, "rest"]] as Array<[Swap<string>, string]>) {
      // fading from a key back to the front: the old key fades OUT over the front
      if (fadeOut(sw, none)) blit(sw.a, 1 - sw.k);
      else pair(sw, none);
    }
    ctx.globalAlpha = 1;
    this.R.draws = draws;
  }

  frame(bs: Record<string, number>, head: number[], gaze: number[], lean: number, breath: number): void {
    this.apply(bs, head, gaze, lean, breath);
    this.render();
  }

  /** Build the caches and draw once (the stage's warm-up). */
  warm(): void { this.layout(); this.render(); }
  resetPhysics(): void { /* no physics: held cels */ }
  stats(): { triangles: number; meshes: number } { return { triangles: 0, meshes: this.R.draws }; }
  dispose(): void { this.disposed = true; this.cache = {}; for (const v of Object.values(this.imgs)) (v as ImageBitmap).close?.(); }
}

