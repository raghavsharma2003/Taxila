// The play style interface (DESIGN.md §4, GRAMMAR.md §8). Family views NEVER pick a colour or a stroke: they ask the
// painter for a ground, a body of a role, a stroke, a label, a tick or a magnifier, and the art direction decides how it
// looks. Four directions: Kagaz (paper-cut), Chalk (slate), Blueprint (drafting sheet), Raat (night lab).
//
// Rules held here (and tested): status by SHAPE (tick for a met goal, magnifier for "look again"; never a red cross);
// the "your move" hue is reserved; text is never drawn below FLOORS.text (16 px for class 4-5 labels); every text and
// every touch target drawn is recorded in the audit so the shot harness can prove the floors at the real box.
import { FLOORS, type ArtId, type ArtTokens } from "../../../shared/play.ts";

const FONTS = {
  display: '"Bricolage Grotesque", "Atkinson Hyperlegible Next", system-ui, sans-serif',
  ui: '"Atkinson Hyperlegible Next", system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, monospace',
  deva: '"Mukta", "Atkinson Hyperlegible Next", sans-serif',
};
export const ART: Record<ArtId, ArtTokens> = {
  kagaz: {
    id: "kagaz", dark: false, ground: "#F3EADB", ground2: "#EADFCB", panel: "#FBF6EC", panelEdge: "#D9C9AE",
    ink: "#2B2118", ink2: "#5A4B3C", ink3: "#7A6A58",
    q1: "#D9921A", q2: "#2F5DA8", q3: "#B4532E", q4: "#46803A",
    good: "#22794D", look: "#9A5B00", you: "#5B7A00", shadow: "rgba(70,48,20,0.22)", jitter: 0.25,
    font: FONTS, sound: "paper",
  },
  chalk: {
    id: "chalk", dark: true, ground: "#1E2A26", ground2: "#26342F", panel: "rgba(255,255,255,0.05)", panelEdge: "rgba(237,239,230,0.55)",
    ink: "#EEF0E7", ink2: "#C4CABD", ink3: "#A3AA9C",
    q1: "#F2D27A", q2: "#8EC9F0", q3: "#F2A7B8", q4: "#86D9AE",
    good: "#8BE0B3", look: "#F5B465", you: "#CBFF4D", shadow: "rgba(0,0,0,0.25)", jitter: 1,
    font: FONTS, sound: "chalk",
  },
  blueprint: {
    id: "blueprint", dark: true, ground: "#0F2E57", ground2: "#13386A", panel: "rgba(143,211,255,0.10)", panelEdge: "#8FD3FF",
    ink: "#EAF5FF", ink2: "#B9D8F2", ink3: "#93BCE0",
    q1: "#FFD166", q2: "#7FE3FF", q3: "#FFA08A", q4: "#C5B4FF",
    good: "#74E8BD", look: "#FFB547", you: "#CBFF4D", shadow: "rgba(0,8,24,0.35)", jitter: 0,
    font: FONTS, sound: "blip",
  },
  raat: {
    id: "raat", dark: true, ground: "#0A0C12", ground2: "#141826", panel: "rgba(255,255,255,0.05)", panelEdge: "rgba(255,255,255,0.18)",
    ink: "#F2F4F8", ink2: "#A9B0C0", ink3: "#9AA2B4",
    q1: "#8B98FF", q2: "#2FD3C7", q3: "#FFD27A", q4: "#FF8A7A",
    good: "#3DDC97", look: "#FFB547", you: "#CBFF4D", shadow: "rgba(0,0,0,0.4)", jitter: 0,
    font: FONTS, sound: "glass",
  },
};
export type Role = "q1" | "q2" | "q3" | "q4" | "panel" | "ink" | "ink2" | "ink3" | "good" | "look" | "you" | "ground2";
/**
 * Physical materials a lab draws (the colour IS the condition or the outcome: a black can, rust, iodine blue-black).
 * Families never write a colour literal (tests/play-style-lint.test.mjs); they ask for a material and the direction tunes
 * it (dark grounds get lifted tints so a black can still reads as black-on-slate by its outline and sheen).
 */
export type Material = "water" | "ice" | "rust" | "wood" | "iron" | "steel" | "clay" | "soil" | "cotton" | "roti" | "mould" | "leaf" | "leafPale"
  | "starch" | "nostarch" | "black" | "white" | "red" | "blue" | "copper" | "aluminium" | "brass" | "plastic" | "wool" | "glow" | "paper"
  | "seed" | "sprout" | "oil" | "paint" | "graphite" | "rubber" | "salt" | "magnetN" | "magnetS" | "sun" | "frost" | "shadow";
const MAT_LIGHT: Record<Material, string> = {
  water: "#5E9FD6", ice: "#CFE9F7", rust: "#A4471F", wood: "#B27A45", iron: "#5D6168", steel: "#9AA3AD", clay: "#B9734E", soil: "#7A5233",
  cotton: "#FBF9F4", roti: "#D8A45E", mould: "#6F8F5A", leaf: "#3F8A3A", leafPale: "#E8EDCF", starch: "#1F2240", nostarch: "#C99A2E",
  black: "#1B1B1B", white: "#F6F6F2", red: "#C8402F", blue: "#2F5DA8", copper: "#B8652F", aluminium: "#C9CED3", brass: "#C9A13B", plastic: "#E2574C",
  wool: "#C65B7C", glow: "#FFD34D", paper: "#EFE7D6", seed: "#B9A06A", sprout: "#4F9A3E", oil: "#D8B23A", paint: "#3F6FB5", graphite: "#3B3D42",
  rubber: "#5A4A3F", salt: "#F1F1EE", magnetN: "#C8402F", magnetS: "#2F5DA8", sun: "#F2B21B", frost: "#BFE3F5", shadow: "#2A2420",
};
const MAT_DARK: Record<Material, string> = {
  ...MAT_LIGHT,
  water: "#6FB6F0", rust: "#D06A3C", wood: "#C99260", iron: "#8C939C", steel: "#B8C1CB", soil: "#9A6E48", roti: "#E2B470", mould: "#8DB178",
  leaf: "#5BB255", starch: "#3A3F7A", black: "#2A2A2E", copper: "#D98A4E", graphite: "#62666E", rubber: "#7D6A5C", shadow: "#05070B",
};
export type BodyState = "idle" | "hover" | "selected" | "good" | "look" | "dim" | "ghost";
export const roleColor = (a: ArtTokens, r: Role): string => (r === "panel" ? a.panel : (a as unknown as Record<string, string>)[r] ?? a.ink);

// ───────────────────────────── the audit (read by the shot harness) ─────────────────────────────

export interface AuditText { s: string; px: number; x: number; y: number; w: number; align: CanvasTextAlign }
export interface AuditTarget { id: string; x: number; y: number; w: number; h: number }
export interface Audit { frame: number; texts: AuditText[]; targets: AuditTarget[]; box: { w: number; h: number }; art: ArtId; young: boolean; /** labels that could not fit their box even wrapped at the floor (drawn with an ellipsis): must be 0 */ clipped: number }
export function newAudit(art: ArtId, young: boolean): Audit { return { frame: 0, texts: [], targets: [], box: { w: 0, h: 0 }, art, young, clipped: 0 }; }

// ───────────────────────────── the painter ─────────────────────────────

const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath(); c.moveTo(x + q, y); c.arcTo(x + w, y, x + w, y + h, q); c.arcTo(x + w, y + h, x, y + h, q); c.arcTo(x, y + h, x, y, q); c.arcTo(x, y, x + w, y, q); c.closePath();
};
function hash(n: number): number { let x = (n | 0) * 374761393; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; }

export class Painter {
  art: ArtTokens; audit: Audit; young: boolean;
  constructor(art: ArtTokens, audit: Audit, young: boolean) { this.art = art; this.audit = audit; this.young = young; }
  get minText(): number { return this.young ? FLOORS.textYoung : FLOORS.text; }
  color(r: Role): string { return roleColor(this.art, r); }
  /** A physical material's colour in this direction. */
  material(m: Material): string { return (this.art.id === "kagaz" ? MAT_LIGHT : MAT_DARK)[m]; }
  /** A veil of the ground over a region (the loupe's lens, a cupboard's dark, a card behind text). */
  veil(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number, o: { r?: number; dark?: boolean } = {}): void {
    c.save(); c.globalAlpha = alpha;
    c.fillStyle = o.dark ? "#06080C" : this.art.dark ? "#0A0C12" : "#FFFCF5";
    rr(c, x, y, w, h, o.r ?? 0); c.fill(); c.restore();
  }
  /** The fine inner-line colour drawn ON a body (the ten lines of a rod, the hundred grid of a flat). */
  innerLine(): string { return this.art.dark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)"; }
  /** A filled shape in a material, outlined so it reads on every ground (paths are built by the caller). */
  fillPath(c: CanvasRenderingContext2D, build: (c: CanvasRenderingContext2D) => void, m: Material, o: { alpha?: number; outline?: Role | null; width?: number } = {}): void {
    c.save(); c.globalAlpha = o.alpha ?? 1; c.beginPath(); build(c); c.fillStyle = this.material(m); c.fill();
    if (o.outline !== null) { c.globalAlpha = Math.min(1, (o.alpha ?? 1) * 0.9); c.strokeStyle = this.color(o.outline ?? "ink3"); c.lineWidth = o.width ?? 1.5; c.stroke(); }
    c.restore();
  }

  /** The stage ground, painted once into a layer per size (the caller caches it). */
  paintGround(g: CanvasRenderingContext2D, w: number, h: number): void {
    const a = this.art;
    if (a.id === "kagaz") {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#F6EEE1"); gr.addColorStop(1, a.ground2);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // paper grain: sparse fibres and specks (seeded, painted once)
      for (let i = 0; i < Math.min(900, (w * h) / 300); i++) {
        const x = hash(i * 7 + 1) * w, y = hash(i * 13 + 5) * h, l = 2 + hash(i * 3) * 6;
        g.strokeStyle = hash(i) > 0.5 ? "rgba(120,90,50,0.06)" : "rgba(255,255,255,0.35)"; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * Math.cos(i), y + l * Math.sin(i)); g.stroke();
      }
      const v = g.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(90,60,20,0.10)"); g.fillStyle = v; g.fillRect(0, 0, w, h);
    } else if (a.id === "chalk") {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#22302B"); gr.addColorStop(1, "#1A2420");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // old chalk ghosts: faint smudges and erased strokes
      for (let i = 0; i < 26; i++) {
        const x = hash(i * 11) * w, y = hash(i * 17 + 3) * h, r = 30 + hash(i * 5) * 90;
        const sm = g.createRadialGradient(x, y, 0, x, y, r); sm.addColorStop(0, "rgba(230,235,225,0.035)"); sm.addColorStop(1, "rgba(230,235,225,0)");
        g.fillStyle = sm; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < Math.min(1600, (w * h) / 180); i++) { g.fillStyle = `rgba(240,240,230,${0.02 + hash(i * 9) * 0.04})`; g.fillRect(hash(i * 31) * w, hash(i * 37 + 2) * h, 1.2, 1.2); }
    } else if (a.id === "blueprint") {
      g.fillStyle = a.ground; g.fillRect(0, 0, w, h);
      const minor = 12, major = minor * 5;
      g.lineWidth = 1;
      for (let x = 0.5; x < w; x += minor) { g.strokeStyle = Math.round((x - 0.5) / minor) % 5 === 0 ? "rgba(143,211,255,0.16)" : "rgba(143,211,255,0.06)"; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0.5; y < h; y += minor) { g.strokeStyle = Math.round((y - 0.5) / minor) % 5 === 0 ? "rgba(143,211,255,0.16)" : "rgba(143,211,255,0.06)"; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      void major;
      const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.8);
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,10,30,0.35)"); g.fillStyle = v; g.fillRect(0, 0, w, h);
    } else {
      const gr = g.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h / 2, Math.max(w, h) * 0.8);
      gr.addColorStop(0, "#161B2A"); gr.addColorStop(1, a.ground); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < Math.min(500, (w * h) / 500); i++) { g.fillStyle = `rgba(255,255,255,${0.012 + hash(i * 7) * 0.02})`; g.fillRect(hash(i * 41) * w, hash(i * 43 + 1) * h, 1, 1); }
    }
  }

  /** A body of a role: a block, a bar, a pan, a set-up card. `lift` raises it (drag / selected). */
  body(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: { role: Role; r?: number; lift?: number; state?: BodyState; seed?: number; fill?: number }): void {
    const a = this.art, r = o.r ?? Math.min(12, h * 0.25), lift = o.lift ?? 0, st = o.state ?? "idle";
    const col = this.color(o.role), alpha = st === "dim" ? 0.45 : st === "ghost" ? 0.35 : 1;
    c.save(); c.globalAlpha = alpha;
    if (a.id === "kagaz") {
      // paper-cut: a darker cut layer offset below, the sheet, a highlight on the top edge
      c.fillStyle = a.shadow; rr(c, x + 1, y + 3 + lift * 0.6, w, h, r); c.fill();
      c.fillStyle = shade(col, KAGAZ_EDGE); rr(c, x, y + 1.5, w, h, r); c.fill();
      c.fillStyle = col; rr(c, x, y - lift * 0.4, w, h, r); c.fill();
      c.strokeStyle = "rgba(255,255,255,0.45)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + r, y - lift * 0.4 + 1.5); c.lineTo(x + w - r, y - lift * 0.4 + 1.5); c.stroke();
    } else if (a.id === "chalk") {
      c.fillStyle = o.role === "panel" ? "rgba(255,255,255,0.04)" : withAlpha(col, 0.16); rr(c, x, y, w, h, r); c.fill();
      // hatch fill clipped to the body (a panel is an empty slate: outline only)
      // hatch fill from a cached pattern tile (stroking every hatch line per body per frame cost ~15 fps at 4× CPU throttle)
      // small bodies get a denser solid wash instead (a pattern fill per small body is the costliest op in software raster)
      if (o.role !== "panel") { if (w * h > 5200) { const pat = this.hatch(c, col); if (pat) { c.fillStyle = pat; rr(c, x, y, w, h, r); c.fill(); } } else { c.fillStyle = withAlpha(col, 0.2); rr(c, x, y, w, h, r); c.fill(); } }
      this.chalkRect(c, x, y, w, h, r, o.role === "panel" ? a.panelEdge : col, o.seed ?? 1);
    } else if (a.id === "blueprint") {
      c.fillStyle = o.role === "panel" ? "rgba(143,211,255,0.06)" : withAlpha(col, 0.18); rr(c, x, y, w, h, Math.min(r, 6)); c.fill();
      c.strokeStyle = o.role === "panel" ? a.panelEdge : col; c.lineWidth = o.role === "panel" ? 1.25 : 2; rr(c, x, y, w, h, Math.min(r, 6)); c.stroke();
      c.strokeStyle = withAlpha(col, 0.6); c.lineWidth = 1; const t = 6;
      for (const [px, py, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]] as const) { c.beginPath(); c.moveTo(px - dx * t, py); c.lineTo(px + dx * t, py); c.moveTo(px, py - dy * t); c.lineTo(px, py + dy * t); c.stroke(); }
    } else {
      if (o.role === "panel") { c.fillStyle = "rgba(255,255,255,0.035)"; rr(c, x, y, w, h, r); c.fill(); c.strokeStyle = a.panelEdge; c.lineWidth = 1.5; rr(c, x, y, w, h, r); c.stroke(); }
      else {
        const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, withAlpha(col, 0.34)); g.addColorStop(1, withAlpha(col, 0.16));
        c.fillStyle = g; rr(c, x, y - lift * 0.4, w, h, r); c.fill();
        c.strokeStyle = withAlpha(col, 0.35); c.lineWidth = 6; rr(c, x, y - lift * 0.4, w, h, r); c.stroke();
        c.strokeStyle = col; c.lineWidth = 2; rr(c, x, y - lift * 0.4, w, h, r); c.stroke();
      }
    }
    if (o.fill !== undefined && o.fill > 0) { c.globalAlpha = alpha; c.fillStyle = withAlpha(col, a.dark ? 0.55 : 0.85); rr(c, x + 3, y + h * (1 - o.fill) + 3 - lift * 0.4, w - 6, h * o.fill - 6, Math.max(2, r - 3)); c.fill(); }
    if (st === "selected" || st === "hover") { c.globalAlpha = 1; c.strokeStyle = st === "selected" ? a.you : withAlpha(a.ink, 0.5); c.lineWidth = st === "selected" ? 3.5 : 2; c.setLineDash(st === "hover" ? [5, 5] : []); rr(c, x - 4, y - 4 - lift * 0.4, w + 8, h + 8, r + 4); c.stroke(); c.setLineDash([]); }
    if (st === "good") { c.globalAlpha = 1; c.strokeStyle = a.good; c.lineWidth = 3; rr(c, x - 3, y - 3, w + 6, h + 6, r + 3); c.stroke(); }
    if (st === "look") { c.globalAlpha = 1; c.strokeStyle = a.look; c.lineWidth = 3; c.setLineDash([6, 5]); rr(c, x - 3, y - 3, w + 6, h + 6, r + 3); c.stroke(); c.setLineDash([]); }
    c.restore();
  }
  private pats = new Map<string, CanvasPattern | null>();
  /** A 7 px diagonal hatch tile in `col` (one per colour, reused every frame). */
  private hatch(c: CanvasRenderingContext2D, col: string): CanvasPattern | null {
    let p = this.pats.get(col);
    if (p !== undefined) return p;
    p = null;
    try {
      const t = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(14, 14) : Object.assign(document.createElement("canvas"), { width: 14, height: 14 });
      const g = t.getContext("2d") as CanvasRenderingContext2D | null;
      if (g) {
        g.strokeStyle = withAlpha(col, 0.42); g.lineWidth = 1.6;
        g.beginPath(); for (const k of [-14, -7, 0, 7, 14]) { g.moveTo(k, 14); g.lineTo(k + 14, 0); } g.stroke();
        p = c.createPattern(t as CanvasImageSource, "repeat");
      }
    } catch { p = null; }
    this.pats.set(col, p);
    return p;
  }
  private chalkRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, col: string, seed: number): void {
    c.strokeStyle = col; c.lineCap = "round";
    // one jittered pass (the second, fainter pass doubled the path cost of every chalk body for little visible gain)
    const a0 = c.globalAlpha || 1;
    for (let pass = 0; pass < 1; pass++) {
      c.lineWidth = 2.4; c.globalAlpha = 0.9 * a0;
      const j = (k: number) => (hash(seed * 31 + k * 7 + pass * 101) - 0.5) * 2.2;
      c.beginPath(); c.moveTo(x + r + j(1), y + j(2)); c.lineTo(x + w - r + j(3), y + j(4)); c.quadraticCurveTo(x + w + j(5), y + j(6), x + w + j(7), y + r);
      c.lineTo(x + w + j(8), y + h - r); c.quadraticCurveTo(x + w + j(9), y + h + j(10), x + w - r, y + h + j(11)); c.lineTo(x + r + j(12), y + h + j(13));
      c.quadraticCurveTo(x + j(14), y + h + j(15), x + j(16), y + h - r); c.lineTo(x + j(17), y + r + j(18)); c.quadraticCurveTo(x + j(19), y + j(20), x + r + j(1), y + j(2)); c.stroke();
    }
    c.globalAlpha = 1;
  }

  /** A stroke along points: chalk jitters it, blueprint plots it, kagaz and raat draw it clean. */
  stroke(c: CanvasRenderingContext2D, pts: [number, number][], o: { role: Role; width?: number; dash?: number[]; closed?: boolean; alpha?: number; seed?: number }): void {
    if (pts.length < 2) return;
    const a = this.art, col = this.color(o.role);
    c.save(); c.globalAlpha = o.alpha ?? 1; c.strokeStyle = col; c.lineWidth = o.width ?? 2.5; c.lineCap = "round"; c.lineJoin = "round"; c.setLineDash(o.dash ?? []);
    const passes = a.id === "chalk" && (o.width ?? 2.5) >= 3 ? 2 : 1;
    for (let p = 0; p < passes; p++) {
      if (p) { c.globalAlpha = (o.alpha ?? 1) * 0.5; c.lineWidth = (o.width ?? 2.5) * 0.5; }
      c.beginPath();
      pts.forEach(([x, y], i) => { const jx = a.jitter ? (hash((o.seed ?? 3) * 17 + i * 5 + p) - 0.5) * a.jitter * 1.6 : 0, jy = a.jitter ? (hash((o.seed ?? 3) * 29 + i * 11 + p) - 0.5) * a.jitter * 1.6 : 0; if (i) c.lineTo(x + jx, y + jy); else c.moveTo(x + jx, y + jy); });
      if (o.closed) c.closePath();
      c.stroke();
    }
    if (a.id === "raat") { c.globalAlpha = (o.alpha ?? 1) * 0.25; c.lineWidth = (o.width ?? 2.5) * 3; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (o.closed) c.closePath(); c.stroke(); }
    c.restore();
  }
  circle(c: CanvasRenderingContext2D, x: number, y: number, r: number, o: { role: Role; fill?: boolean; width?: number; alpha?: number }): void {
    const col = this.color(o.role);
    c.save(); c.globalAlpha = o.alpha ?? 1;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    if (o.fill) { c.fillStyle = this.art.id === "chalk" ? withAlpha(col, 0.6) : col; c.fill(); }
    c.strokeStyle = col; c.lineWidth = o.width ?? 2; c.stroke();
    c.restore();
  }

  /** The label colour with the most contrast on a body of `role` (text drawn ON a block, a bag, a pod). */
  labelOn(role: Role): string { return labelOn(this.art, role); }
  /** Text, never below the floor; recorded in the audit with its rendered size and box. Returns the width.
   *  `on`: the role of the body the text sits on (the label colour is then chosen for contrast, overriding `role`). */
  text(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: { size: number; role?: Role; on?: Role; weight?: number; font?: "display" | "ui" | "mono"; align?: CanvasTextAlign; baseline?: CanvasTextBaseline; maxW?: number; alpha?: number }): number {
    const px = Math.max(o.size, this.minText);
    const fam = /[ऀ-ॿ]/.test(s) ? this.art.font.deva : this.art.font[o.font ?? "ui"];
    c.save();
    c.font = `${o.weight ?? 600} ${px}px ${fam}`; c.textAlign = o.align ?? "center"; c.textBaseline = o.baseline ?? "middle";
    c.fillStyle = o.on ? labelOn(this.art, o.on) : this.color(o.role ?? "ink"); c.globalAlpha = o.alpha ?? 1;
    let w = c.measureText(s).width;
    let fit = px;
    if (o.maxW && w > o.maxW) { fit = Math.max(this.minText, Math.floor((px * o.maxW) / w)); c.font = `${o.weight ?? 600} ${fit}px ${fam}`; w = c.measureText(s).width; }
    if (this.art.id === "raat" && (o.role === "q1" || o.role === "q2" || o.role === "good")) { c.globalAlpha = (o.alpha ?? 1) * 0.35; c.fillText(s, x, y + 1); c.globalAlpha = o.alpha ?? 1; }
    c.fillText(s, x, y);
    c.restore();
    if ((o.alpha ?? 1) > 0.4) this.audit.texts.push({ s: s.slice(0, 24), px: fit, x, y, w, align: o.align ?? "center" });
    return w;
  }
  /**
   * A label inside a box (a chip, a column cell): one line at `size` if it fits, else one line shrunk toward the floor,
   * else two lines at the floor (split at the best space), else an ellipsis (counted in audit.clipped, which the shot
   * harness fails on). Never draws below the floor and never spills out of its box. Returns the lines drawn.
   */
  textFit(c: CanvasRenderingContext2D, s: string, x: number, y: number, maxW: number, maxH: number, o: { size: number; role?: Role; on?: Role; weight?: number; font?: "display" | "ui" | "mono"; align?: CanvasTextAlign }): number {
    const floor = this.minText, fam = /[ऀ-ॿ]/.test(s) ? this.art.font.deva : this.art.font[o.font ?? "ui"], wt = o.weight ?? 600;
    const meas = (t: string, px: number) => { c.save(); c.font = `${wt} ${px}px ${fam}`; const m = c.measureText(t).width; c.restore(); return m; };
    const size = Math.max(o.size, floor);
    if (meas(s, size) <= maxW) { this.text(c, s, x, y, { ...o, size }); return 1; }
    const shrunk = Math.max(floor, Math.floor((size * maxW) / meas(s, size)));
    if (meas(s, shrunk) <= maxW) { this.text(c, s, x, y, { ...o, size: shrunk }); return 1; }
    const lh = floor * 1.18, words = s.split(" ");
    if (words.length > 1 && maxH >= lh * 2) {
      let best: [string, string] | null = null, bestW = Infinity;
      for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(" "), b = words.slice(i).join(" "), w = Math.max(meas(a, floor), meas(b, floor)); if (w < bestW) { bestW = w; best = [a, b]; } }
      if (best && bestW <= maxW) { this.text(c, best[0], x, y - lh / 2, { ...o, size: floor }); this.text(c, best[1], x, y + lh / 2, { ...o, size: floor }); return 2; }
    }
    let t = s; while (t.length > 1 && meas(`${t}…`, floor) > maxW) t = t.slice(0, -1);
    this.audit.clipped++;
    this.text(c, `${t}…`, x, y, { ...o, size: floor });
    return 1;
  }
  /** A readout pill (values on the world, e.g. "4 × 9"). */
  chip(c: CanvasRenderingContext2D, s: string, cx: number, cy: number, o: { size?: number; role?: Role; font?: "ui" | "mono" | "display" } = {}): { w: number; h: number } {
    const size = Math.max(o.size ?? 16, this.minText), padX = size * 0.6, h = size * 1.8;
    c.save(); c.font = `700 ${size}px ${this.art.font[o.font ?? "mono"]}`; const tw = c.measureText(s).width; c.restore();
    const w = tw + padX * 2, a = this.art;
    c.save();
    c.fillStyle = a.dark ? "rgba(8,10,16,0.78)" : "rgba(255,252,245,0.94)"; rr(c, cx - w / 2, cy - h / 2, w, h, h / 2); c.fill();
    c.strokeStyle = o.role ? this.color(o.role) : a.panelEdge; c.lineWidth = 1.5; rr(c, cx - w / 2, cy - h / 2, w, h, h / 2); c.stroke();
    c.restore();
    this.text(c, s, cx, cy + 0.5, { size, role: o.role ?? "ink", weight: 700, font: o.font ?? "mono" });
    return { w, h };
  }
  /** A tick (goal met): the only "right" mark there is, and it sits on the work. */
  tick(c: CanvasRenderingContext2D, x: number, y: number, s: number, k = 1): void {
    c.save(); c.strokeStyle = this.art.good; c.lineWidth = Math.max(3, s * 0.16); c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); const p1 = [x - s * 0.4, y], p2 = [x - s * 0.1, y + s * 0.3], p3 = [x + s * 0.45, y - s * 0.35];
    c.moveTo(p1[0], p1[1]);
    if (k < 0.5) c.lineTo(p1[0] + (p2[0] - p1[0]) * k * 2, p1[1] + (p2[1] - p1[1]) * k * 2);
    else { c.lineTo(p2[0], p2[1]); c.lineTo(p2[0] + (p3[0] - p2[0]) * (k - 0.5) * 2, p2[1] + (p3[1] - p2[1]) * (k - 0.5) * 2); }
    c.stroke(); c.restore();
  }
  /** A magnifier ("look again"): never a cross, never red. */
  magnifier(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    c.save(); c.strokeStyle = this.art.look; c.lineWidth = Math.max(2.5, s * 0.12); c.lineCap = "round";
    c.beginPath(); c.arc(x - s * 0.1, y - s * 0.1, s * 0.3, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.12, y + s * 0.12); c.lineTo(x + s * 0.4, y + s * 0.4); c.stroke(); c.restore();
  }
  /** The teacher's ghost hand (a soft round cursor with a ring), for her demonstrated move. */
  hand(c: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number, press = 0): void {
    if (alpha <= 0.01) return;
    c.save(); c.globalAlpha = alpha;
    c.fillStyle = this.art.dark ? "rgba(255,255,255,0.18)" : "rgba(63,79,216,0.14)"; c.beginPath(); c.arc(x, y, s * (1 - press * 0.15), 0, Math.PI * 2); c.fill();
    c.strokeStyle = this.art.dark ? "rgba(255,255,255,0.8)" : "#3F4FD8"; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, s * 0.55 * (1 - press * 0.2), 0, Math.PI * 2); c.stroke();
    c.restore();
  }
  particleColor(r: Role): string { return this.color(r); }
}

/** The kagaz cut layer under every body (its edge carries the ≥ 3:1 boundary against the paper; tests/play-react). */
export const KAGAZ_EDGE = -0.22;
/** The colour that bounds a body against the ground (kagaz: the cut layer; the others: the outline stroke). */
export function edgeOf(a: ArtTokens, role: Role): string { const col = roleColor(a, role); return a.id === "kagaz" ? shade(col, KAGAZ_EDGE) : col; }
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), ch = (n: number, s: number) => (n >> s) & 255;
  return `#${[16, 8, 0].map((s) => Math.round(ch(pa, s) * t + ch(pb, s) * (1 - t)).toString(16).padStart(2, "0")).join("")}`;
}
/** The effective fill of a body over the ground (dark directions draw bodies translucent). */
export function bodyFill(a: ArtTokens, role: Role): string {
  const col = roleColor(a, role);
  if (!col.startsWith("#")) return a.ground;
  return a.id === "kagaz" ? col : mix(col, a.ground, a.id === "raat" ? 0.26 : a.id === "blueprint" ? 0.18 : 0.16);
}
/** The label colour (ink, near-white or near-black) with the most contrast on a body of `role`. */
export function labelOn(a: ArtTokens, role: Role): string {
  const bg = bodyFill(a, role);
  return [a.ink, "#FFFFFF", "#17120C"].reduce((best, c) => (contrast(c, bg) > contrast(best, bg) ? c : best), a.ink);
}

export function withAlpha(hex: string, a: number): string {
  if (hex.startsWith("rgba")) return hex.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3,${a})`);
  const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex;
  const n = parseInt(m[1], 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export function shade(hex: string, k: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex;
  const n = parseInt(m[1], 16), f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `#${[f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
/** WCAG relative-luminance contrast between two #rrggbb colours (the token tests use it). */
export function contrast(a: string, b: string): number {
  const L = (hex: string) => { const n = parseInt(hex.slice(1), 16); const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]; };
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05);
}
export { rr as roundRect };
