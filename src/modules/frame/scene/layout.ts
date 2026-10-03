// scene@1 layout for the frame: a port of the validator's layout pass (genui-scene-dsl.mjs: measure /
// layout / positions / textBox, BANDS, STAGES, COLORS, DPU), so a scene lands where the validator measured it
// when it checked hit sizes, overlaps and the stage bounds.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { evalSrc, type Env } from "./expr.ts";

export type SNode = Record<string, any>;
export type Scene = Record<string, any>;
export interface Box { x: number; y: number; w: number; h: number }
export interface Instance { id: string; of: string; item: SNode; box: Box }

export const DPU = 0.3;
export const BANDS: Record<string, { hit: number; tile: number; gap: number; choices: number; keypad: boolean; type: Record<string, [number, number]> }> = {
  B1: { hit: 64, tile: 112, gap: 16, choices: 2, keypad: false, type: { label: [20, 22], caption: [22, 24], title: [28, 30], numeral: [34, 36] } },
  B2: { hit: 64, tile: 96, gap: 16, choices: 3, keypad: false, type: { label: [18, 20], caption: [20, 22], title: [26, 28], numeral: [32, 34] } },
  B3: { hit: 48, tile: 64, gap: 8, choices: 4, keypad: true, type: { label: [16, 18], caption: [18, 20], title: [24, 26], numeral: [30, 32] } },
  B4: { hit: 48, tile: 64, gap: 8, choices: 4, keypad: true, type: { label: [15, 17], caption: [16, 18], title: [22, 24], numeral: [28, 30] } },
};
export const STAGES: Record<string, number> = { "4:3": 750, "1:1": 1000, "3:4": 1333 };
export const COLORS: Record<string, string | null> = {
  none: null, bg: "#FFF8EE", surface: "#FFFFFF", ink: "#1F1A14", ink2: "#5A5148", line: "#8C8478", done: "#1F7A4D",
  c1: "#FAD4C0", c2: "#CDE7B0", c3: "#BFDDF5", c4: "#F7E3A1", c5: "#E2CCF2", c6: "#E4DED3",
  c1d: "#B4532A", c2d: "#3F7A1E", c3d: "#1F5F99", c4d: "#8A6A00", c5d: "#6B3FA0", c6d: "#5A5148",
  water: "#7FB8E6", leaf: "#6DB35A", soil: "#A47551", sun: "#F5C542", sky: "#CFE8FA", fire: "#E8743B",
  ice: "#E3F4FB", metal: "#9AA3AF", wood: "#B98A5E",
};

const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const visibleChars = (s: string) => [...s].filter((ch) => !/[ऀ-ःऺ-ॏ॑-ॗॢॣ]/.test(ch)).length;
export function textSize(size: string, band: string, deva = false): number {
  return BANDS[band].type[size][deva ? 1 : 0] / DPU;
}
export function textBox(str: string, size: string, band: string, wrapW?: number) {
  const deva = isDevanagari(str);
  const em = textSize(size, band, deva);
  const adv = em * (deva ? 0.62 : 0.55);
  const full = visibleChars(str) * adv;
  const lh = em * (deva ? 1.6 : 1.35);
  if (!wrapW || full <= wrapW) return { w: full, h: lh, lines: 1, em, lh, adv };
  const lines = Math.ceil(full / (wrapW * 0.92));
  return { w: wrapW, h: lines * lh, lines, em, lh, adv };
}

export const num = (v: unknown, env: Env, dflt = 0): number =>
  v === undefined ? dflt : typeof v === "number" ? v : Number(evalSrc((v as { $: string }).$, env));

/** The l10n string the child reads: init lang english → en, hindi → hi, hinglish → hi_latn ?? en. */
export function pick(l: { en: string; hi: string; hi_latn?: string } | undefined, lang: string): string {
  if (!l) return "";
  return lang === "hindi" ? l.hi : lang === "hinglish" ? (l.hi_latn ?? l.en) : l.en;
}
/** The validator measures text in scene.meta.lang; layout must use the same string to agree with it. */
function metaText(n: SNode, scene: Scene): string {
  const t = n.text.fmt ?? n.text;
  const lang = scene.meta.lang;
  return lang === "en" ? t.en : lang === "hi" ? t.hi : (t.hi_latn ?? t.en);
}

export function measure(n: SNode, scene: Scene, env: Env, band: string): { w: number; h: number } {
  const B = BANDS[band];
  switch (n.kind) {
    case "rect": case "sprite": case "image": return { w: num(n.w, env), h: num(n.h, env) };
    case "circle": case "wedge": { const r = num(n.r, env); return { w: 2 * r, h: 2 * r }; }
    case "ellipse": return { w: 2 * num(n.rx, env), h: 2 * num(n.ry, env) };
    case "zone": return { w: n.w, h: n.h };
    case "text": return textBox(metaText(n, scene).replace(/\{[a-z0-9_]+\}/g, "0000"), n.size, band, n.w);
    case "math": return { w: n.tex.length * textSize(n.size, band) * 0.45, h: textSize(n.size, band) * 1.4 };
    case "axis": return n.orient === "h" ? { w: n.len, h: 90 } : { w: 90, h: n.len };
    case "slider": { const t = B.hit / DPU; return n.orient === "h" ? { w: n.len, h: t } : { w: t, h: n.len }; }
    case "stepper": { const t = B.hit / DPU; return { w: 3 * t, h: t }; }
    case "toggle": { const t = B.hit / DPU; return { w: 2 * t, h: t }; }
    case "button": { const t = B.hit / DPU; const tb = textBox(n.label.en, "label", band); return { w: Math.max(t * 1.5, tb.w + 60), h: t }; }
    case "keypad": { const t = B.hit / DPU; return { w: 3 * t + 2 * 20, h: 4 * t + 3 * 20 }; }
    case "choice": {
      const t = B.tile / DPU; const g = B.gap / DPU; const nI = n.options.length;
      const cols = n.layout === "grid" ? 2 : n.layout === "row" ? nI : 1; const rows = Math.ceil(nI / cols);
      return { w: cols * t + (cols - 1) * g, h: rows * t + (rows - 1) * g };
    }
    case "order": {
      const g = B.gap / DPU; const nI = n.items.length; const hh = B.hit / DPU;
      return n.orient === "column" ? { w: 760, h: nI * hh + (nI - 1) * g } : { w: nI * (B.tile / DPU) + (nI - 1) * g, h: B.tile / DPU };
    }
    default: return { w: 0, h: 0 };
  }
}

export function positions(L: SNode, sizes: { w: number; h: number }[], gap: number): [number, number][] {
  const n = sizes.length;
  if (!n) return [];
  if (L.type === "row" || L.type === "column") {
    const main = L.type === "row" ? "w" : "h";
    const total = sizes.reduce((a, s) => a + s[main], 0) + gap * (n - 1);
    let cur = -total / 2;
    return sizes.map((s) => { const c = cur + s[main] / 2; cur += s[main] + gap; return L.type === "row" ? [c, 0] : [0, c]; });
  }
  if (L.type === "grid") {
    const cols = L.cols ?? Math.ceil(Math.sqrt(n)); const rows = Math.ceil(n / cols);
    const cw = Math.max(...sizes.map((s) => s.w)), chh = Math.max(...sizes.map((s) => s.h));
    return sizes.map((_, i) => [((i % cols) - (cols - 1) / 2) * (cw + gap), (Math.floor(i / cols) - (rows - 1) / 2) * (chh + gap)]);
  }
  if (L.type === "circle") { const r = L.r ?? 200; return sizes.map((_, i) => [r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2), r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)]); }
  if (L.type === "scatter") {
    let s = (L.seed ?? 7) >>> 0;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const w = L.w ?? 600, h = L.h ?? 300; const out: [number, number][] = [];
    for (const sz of sizes) {
      let best: [number, number] | null = null;
      for (let t = 0; t < 60; t++) {
        const p: [number, number] = [(rnd() - 0.5) * (w - sz.w), (rnd() - 0.5) * (h - sz.h)];
        if (out.every((q, j) => Math.abs(q[0] - p[0]) > (sz.w + sizes[j].w) / 2 + 4 || Math.abs(q[1] - p[1]) > (sz.h + sizes[j].h) / 2 + 4)) { best = p; break; }
        best ??= p;
      }
      out.push(best!);
    }
    return out;
  }
  return sizes.map(() => [0, 0]);
}

function union(bs: Box[]): Box | null {
  if (!bs.length) return null;
  const x0 = Math.min(...bs.map((b) => b.x - b.w / 2)), x1 = Math.max(...bs.map((b) => b.x + b.w / 2));
  const y0 = Math.min(...bs.map((b) => b.y - b.h / 2)), y1 = Math.max(...bs.map((b) => b.y + b.h / 2));
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

export function layout(scene: Scene, env: Env) {
  const band = scene.meta.band;
  const W = 1000, H = STAGES[scene.stage.aspect] ?? 750;
  const kids = new Map<string, SNode[]>();
  for (const n of scene.nodes) { const p = n.parent ?? "root"; if (!kids.has(p)) kids.set(p, []); kids.get(p)!.push(n); }
  const boxes = new Map<string, Box>();
  /** Where each node was placed (its centre; for line/poly, the origin its points are relative to). */
  const anchors = new Map<string, [number, number]>();
  const instances: Instance[] = [];
  const repeatItemSize = (it: SNode) => (it.kind === "circle" ? { w: 2 * (it.r ?? 20), h: 2 * (it.r ?? 20) } : { w: it.w ?? 60, h: it.h ?? 60 });
  function groupSize(g: SNode): { w: number; h: number } {
    if (g.kind === "repeat") {
      const c = Math.round(num(g.count, env)); const s = repeatItemSize(g.item);
      return union(positions(g.layout, Array(Math.max(0, c)).fill(s), g.layout.gap ?? 12).map((p) => ({ x: p[0], y: p[1], w: s.w, h: s.h }))) ?? { w: 0, h: 0 };
    }
    const ch = kids.get(g.id) ?? []; const L = g.layout ?? { type: "free" };
    const sizes = ch.map((c) => (c.kind === "group" || c.kind === "repeat" ? groupSize(c) : measure(c, scene, env, band)));
    const pts = positions(L, sizes, L.gap ?? 20);
    return union(pts.map((p, i) => ({ x: p[0] + (L.type === "free" ? num(ch[i].x, env) : 0), y: p[1] + (L.type === "free" ? num(ch[i].y, env) : 0), w: sizes[i].w, h: sizes[i].h }))) ?? { w: 0, h: 0 };
  }
  function place(n: SNode, cx: number, cy: number) {
    anchors.set(n.id, [cx, cy]);
    if (n.kind === "group") {
      const ch = kids.get(n.id) ?? []; const L = n.layout ?? { type: "free" }; const gap = L.gap ?? 20;
      const sizes = ch.map((c) => (c.kind === "group" || c.kind === "repeat" ? groupSize(c) : measure(c, scene, env, band)));
      positions(L, sizes, gap).forEach((pt, i) => { const c = ch[i]; const fx = L.type === "free" ? num(c.x, env) : 0, fy = L.type === "free" ? num(c.y, env) : 0; place(c, cx + pt[0] + fx, cy + pt[1] + fy); });
      boxes.set(n.id, union(ch.map((c) => boxes.get(c.id)).filter((b): b is Box => !!b)) ?? { x: cx, y: cy, w: 0, h: 0 });
      return;
    }
    if (n.kind === "repeat") {
      const count = Math.round(num(n.count, env)); const s = repeatItemSize(n.item); const sizes = Array.from({ length: Math.max(0, count) }, () => s);
      positions(n.layout, sizes, n.layout.gap ?? 12).forEach((pt, i) => instances.push({ id: `${n.id}_${i}`, of: n.id, item: n.item, box: { x: cx + pt[0], y: cy + pt[1], w: s.w, h: s.h } }));
      boxes.set(n.id, union(instances.filter((q) => q.of === n.id).map((q) => q.box)) ?? { x: cx, y: cy, w: 0, h: 0 });
      return;
    }
    if (n.kind === "line" || n.kind === "poly") {
      const xs = n.pts.map((q: number[]) => q[0] + cx), ys = n.pts.map((q: number[]) => q[1] + cy);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      boxes.set(n.id, { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 });
      return;
    }
    if (n.kind === "connector") return;
    const m = measure(n, scene, env, band); const sc = num(n.scale, env, 1);
    boxes.set(n.id, { x: cx, y: cy, w: m.w * sc, h: m.h * sc });
  }
  for (const n of kids.get("root") ?? []) { const lp = n.kind === "line" || n.kind === "poly"; place(n, num(n.x, env, lp ? 0 : W / 2), num(n.y, env, lp ? 0 : H / 2)); }
  return { boxes, anchors, instances, W, H };
}
