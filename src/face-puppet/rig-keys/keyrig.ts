// lamp2 KeyRig: the painted-key puppet. Implements the driver's RigLike (driver.ts: clock + frame(bs, head, gaze, lean,
// breath)) plus the surface the stage reads from a rig (R.dpr, view, reduced, life.reduced, mouth, stats, warm, dispose),
// so PuppetDriver drives it unchanged. Canvas 2D, no WebGL: per frame it draws two rigid layers and at most five
// painted patches (brows, eyes, two mouths in a crossfade). No mesh, no warp.
// Route (b), round 7 (opt-in: KeyRigOptions.jaw, the device's ?jaw=1): a 2.5D cut-out JAW layer. The face is composed in
// its own head-space buffer; the lower lip and chin (a feathered jaw-shaped region under the lip line) are lifted out and
// translated DOWN by the continuous viseme jaw (rigid translation, never a warp), and the opened gap is filled with the
// mouth interior. The painted keys still give every mouth SHAPE; the jaw gives the continuous OPENING, which the
// stepped keys alone could not time (lip spread 67% → 100% of lines within ±50 ms in route-b/battery.mjs). On a seal the
// jaw closes with the mbp key.
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
  /** Route (b): the 2.5D jaw layer (see the header). */
  jaw?: boolean;
}

/** Route (b) jaw tuning, in the pack's native px. */
export const JAW = { maxDropPx: 7, regionRx: 92, regionRy: 64, regionDy: 30, featherPx: 14, normJaw: 0.62 };

/** The jaw layer's drop for a frame: the continuous viseme jaw, closed with the mbp key on a seal. Pure (unit-tested). */
export function jawDrop(bs: Record<string, number>, mouth: Swap<MouthKey>, maxPx = JAW.maxDropPx): number {
  const j = Math.min(1, Math.max(0, (bs.jawOpen ?? 0) / JAW.normJaw));
  const seal = (mouth.b === "mbp" ? mouth.k : 0) + (mouth.a === "mbp" ? 1 - mouth.k : 0);
  return j * (1 - Math.min(1, seal)) * maxPx;
}

type Ctx = CanvasRenderingContext2D;
interface Cached { c: HTMLCanvasElement | OffscreenCanvas; ox: number; oy: number }

const mkCanvas = (w: number, h: number): HTMLCanvasElement | OffscreenCanvas => {
  if (typeof OffscreenCanvas === "function") return new OffscreenCanvas(Math.max(1, w), Math.max(1, h));
  const c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h); return c;
};

export class KeyRig {
  static async load(canvas: HTMLCanvasElement, base: string, opts: KeyRigOptions = {}): Promise<KeyRig> {
    // (opts.jaw: route (b)'s jaw layer)
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
  pose: Pose = { rot: 0, sway: 0, nod: 0, breath: 0, lean: 0, drift: 0 };
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
  private jawOn: boolean;
  /** Route (b): the current jaw drop (native px), the composed face, the lifted jaw piece and its feathered mask. */
  jaw = 0;
  private faceBuf: HTMLCanvasElement | OffscreenCanvas | null = null;
  private jawBuf: HTMLCanvasElement | OffscreenCanvas | null = null;
  private jawMask: HTMLCanvasElement | OffscreenCanvas | null = null;
  private lipLine = 0;
  private interior = "rgb(70,28,24)";

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
    this.jawOn = !!opts.jaw;
    if (this.jawOn) this.measureMouth();
  }

  /** Route (b): the lip line (the darkest row down the mouth's centre column of the rest face) and the interior colour
   *  (the darkest pixel of the open aa key), read once from the pack's own pixels. */
  private measureMouth(): void {
    const g = this.geom, mr = g.keys.aa?.rect ?? g.keys.mbp?.rect;
    if (!mr) { this.jawOn = false; return; }
    const head = this.imgs.head, aa = this.imgs.aa;
    const [hx, hy] = g.rects.head;
    try {
      const cx = Math.round((mr[0] + mr[2]) / 2);
      const c = mkCanvas(head.width, head.height);
      const x = c.getContext("2d") as CanvasRenderingContext2D;
      x.drawImage(head, 0, 0);
      const col = x.getImageData(cx - hx, mr[1] - hy, 1, mr[3] - mr[1]).data;
      let best = 1e9, by = 0;
      for (let i = 0; i < col.length / 4; i++) { const l = col[4 * i] + col[4 * i + 1] + col[4 * i + 2]; if (l < best) { best = l; by = i; } }
      this.lipLine = mr[1] + by;
      if (aa) {
        const a = mkCanvas(aa.width, aa.height);
        const y = a.getContext("2d") as CanvasRenderingContext2D;
        y.drawImage(aa, 0, 0);
        const d = y.getImageData(0, 0, aa.width, aa.height).data;
        let dk = 1e9, rgb = [70, 28, 24];
        for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; const l = d[i] + d[i + 1] + d[i + 2]; if (l < dk) { dk = l; rgb = [d[i], d[i + 1], d[i + 2]]; } }
        this.interior = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      }
    } catch {
      this.lipLine = Math.round((mr[1] + mr[3]) / 2);
    }
  }

  /** Canvas size from its CSS box x dpr; rebuilds the layer caches when the size or the framing changes. */
  private layout(): void {
    const cv = this.R.canvas;
    const cw = Math.max(1, Math.round((cv.clientWidth || cv.width / this.R.dpr) * this.R.dpr));
    const ch = Math.max(1, Math.round((cv.clientHeight || cv.height / this.R.dpr) * this.R.dpr));
    if (cv.width !== cw) cv.width = cw;
    if (cv.height !== ch) cv.height = ch;
    const v = this.view;
    if (v.length >= 4) {
      // a 4-element view [x0, y0, w, h]: contain-centred, as the r8 / lamp1 runtime fits one
      const s = Math.min(cw / v[2], ch / v[3]);
      this.origin = [v[0] + (v[2] - cw / s) / 2, v[1] + (v[3] - ch / s) / 2];
      this.scale = s;
    } else {
      // a 3-element view [x0, y0, width] (the product's LookPack framings): the width fills the canvas from the top-left
      this.origin = [v[0], v[1]];
      this.scale = cw / v[2];
    }
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
    if (this.jawOn) {
      // the composed-face buffer and the jaw mask, on the head layer's device grid
      const H = this.cache.head;
      if (!H) return;
      this.faceBuf = mkCanvas(H.c.width, H.c.height);
      this.jawBuf = mkCanvas(H.c.width, H.c.height);
      const m = mkCanvas(H.c.width, H.c.height);
      const mx = m.getContext("2d") as CanvasRenderingContext2D;
      const mr = g.keys.aa?.rect ?? g.keys.mbp.rect;
      const cx = ((mr[0] + mr[2]) / 2 - hx) * s, ly = (this.lipLine - hy) * s;
      // a jaw-shaped ellipse below the lip line, feathered: the lower lip, the chin and a little cheek
      mx.filter = `blur(${(JAW.featherPx * s) / 2}px)`;
      mx.fillStyle = "#fff";
      mx.beginPath();
      mx.ellipse(cx, ly + JAW.regionDy * s, JAW.regionRx * s, JAW.regionRy * s, 0, 0, Math.PI * 2);
      mx.fill();
      mx.filter = "none";
      mx.globalCompositeOperation = "destination-out";
      mx.fillRect(0, 0, m.width, Math.max(0, ly - 1)); // nothing above the lip line moves
      this.jawMask = m;
    }
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
    this.pose = this.motion.step(tMs, head, lean, breath, this.reduced || this.life.reduced, gaze);
    const m = this.mouthShown;
    this.mouth.name = m.k >= 0.5 ? m.b : m.a;
    this.mouth.p.g = this.mouth.name === "mbp" ? 0 : this.mouthKeys.openness(tMs) * 10;
    if (this.jawOn) {
      this.jaw = this.reduced ? 0.6 * jawDrop(bs, m) : jawDrop(bs, m);
      if (this.mouth.name !== "mbp") this.mouth.p.g += this.jaw * 2;
    }
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
    // v3 K3: the body carries 40% of a nod (K2: a head-only nod read as "the face and jaw stretch" over a still neck)
    const fig = (extraY = 0) => {
      ctx.setTransform(s, 0, 0, s, (-ox0 + p.sway + p.drift) * s, (-oy0 + 0.4 * p.nod + 0.3 * p.drift) * s);
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
    fig(-neckRise + 0.6 * p.nod);
    ctx.translate(g.pivot[0], g.pivot[1]); ctx.rotate((p.rot * Math.PI) / 180); ctx.translate(-g.pivot[0], -g.pivot[1]);
    const hx = g.rects.head[0], hy = g.rects.head[1];
    // route (b): compose the face (head + keys) in head-grid device px first, then move the jaw, then draw it once
    const fb = this.jawOn && this.faceBuf ? (this.faceBuf.getContext("2d") as CanvasRenderingContext2D) : null;
    if (fb) { fb.setTransform(1, 0, 0, 1, 0, 0); fb.globalAlpha = 1; fb.clearRect(0, 0, this.faceBuf!.width, this.faceBuf!.height); }
    const blit = (name: string, alpha = 1) => {
      const C = this.cache[name];
      if (!C || alpha <= 0.001) return;
      if (fb) { fb.globalAlpha = alpha; fb.drawImage(C.c, C.ox, C.oy); draws++; return; }
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
    if (fb) {
      const d = this.jaw * s; // device px
      if (d > 0.25 && this.jawBuf && this.jawMask) {
        const jb = this.jawBuf.getContext("2d") as CanvasRenderingContext2D;
        jb.setTransform(1, 0, 0, 1, 0, 0);
        jb.globalCompositeOperation = "copy";
        jb.globalAlpha = 1;
        jb.drawImage(this.faceBuf!, 0, 0);
        jb.globalCompositeOperation = "destination-in";
        jb.drawImage(this.jawMask, 0, 0);
        jb.globalCompositeOperation = "source-over";
        // the opened gap: the mouth interior, a lens as wide as the mouth's opening, from the lip line down by the drop
        const mr = g.keys.aa?.rect ?? g.keys.mbp.rect;
        const cx = ((mr[0] + mr[2]) / 2 - hx) * s, ly = (this.lipLine - hy) * s, half = ((mr[2] - mr[0]) / 2) * 0.62 * s;
        // soft-edged (a hard dark band read as a slit drawn on the lips, judge pass 1 of the round 7 sheet)
        fb.globalAlpha = 0.9;
        fb.filter = `blur(${Math.max(0.5, 0.9 * s)}px)`;
        fb.fillStyle = this.interior;
        fb.beginPath();
        fb.ellipse(cx, ly + d / 2, half * 0.92, d / 2 + 0.5 * s, 0, 0, Math.PI * 2);
        fb.fill();
        fb.filter = "none";
        fb.globalAlpha = 1;
        fb.drawImage(this.jawBuf, 0, d);
        draws += 2;
      }
      ctx.globalAlpha = 1;
      ctx.drawImage(this.faceBuf!, hx, hy, this.faceBuf!.width / s, this.faceBuf!.height / s);
      draws++;
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

