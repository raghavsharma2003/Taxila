// Yantra · code-drawn textures (no image files, no network). Every random number is cosmetic (core.cosmeticRandom, seeded
// by the level) so a screenshot is reproducible; nothing here reads the law.
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { css, shade, type ThemePack } from "./palette.ts";

type Rnd = () => number;
const canvas = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return { c, g: c.getContext("2d") as CanvasRenderingContext2D }; };
const tex = (c: HTMLCanvasElement, repeat = false): Texture => {
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = RepeatWrapping; t.wrapT = RepeatWrapping; }
  return t;
};
function speckle(g: CanvasRenderingContext2D, w: number, h: number, rnd: Rnd, n: number, cols: number[], a: number, size = 1.6): void {
  for (let i = 0; i < n; i++) { g.fillStyle = css(cols[i % cols.length], a * (0.4 + rnd() * 0.6)); const s = size * (0.5 + rnd()); g.fillRect(rnd() * w, rnd() * h, s, s); }
}

/** The table top (repeats once per 4 cells). */
export function tableTexture(T: ThemePack, rnd: Rnd): Texture {
  const S = 256, { c, g } = canvas(S, S), t = T.table;
  g.fillStyle = css(t.base); g.fillRect(0, 0, S, S);
  if (t.kind === "planks") {
    for (let i = 0; i < 4; i++) {
      const y = i * 64;
      g.fillStyle = css(i % 2 ? t.base : shade(t.base, 0.94)); g.fillRect(0, y, S, 64);
      for (let k = 0; k < 18; k++) { g.strokeStyle = css(k % 3 ? t.dark : t.light, 0.35); g.lineWidth = 1 + rnd() * 1.4; g.beginPath(); const yy = y + 4 + rnd() * 56; g.moveTo(0, yy); g.bezierCurveTo(S * 0.3, yy + (rnd() - 0.5) * 8, S * 0.7, yy + (rnd() - 0.5) * 8, S, yy); g.stroke(); }
      g.fillStyle = css(shade(t.dark, 0.7), 0.8); g.fillRect(0, y, S, 2);
      if (i % 2) { g.fillRect(S * 0.55, y, 2, 64); }
    }
  } else if (t.kind === "concrete") {
    speckle(g, S, S, rnd, 2600, [t.dark, t.light, shade(t.base, 0.8)], 0.55, 2.2);
    g.strokeStyle = css(shade(t.dark, 0.75), 0.6); g.lineWidth = 2; g.strokeRect(1, 1, S - 2, S - 2);
  } else {
    // laminate: an even sheet with a fine fleck (no tile-sized blotches)
    speckle(g, S, S, rnd, 1800, [t.dark, t.light], 0.3, 1.1);
  }
  return tex(c, true);
}

/** One board tile's face (each tile is an instance; its colour jitters per instance). */
export function tileTexture(T: ThemePack, rnd: Rnd): Texture {
  const S = 128, { c, g } = canvas(S, S), t = T.tile;
  g.fillStyle = css(t.grout); g.fillRect(0, 0, S, S);
  const m = t.kind === "mat" ? 0 : 5;
  g.fillStyle = "#ffffff"; g.fillRect(m, m, S - 2 * m, S - 2 * m);       // tinted by the instance colour (white = the face)
  if (t.kind === "ceramic") { const grd = g.createLinearGradient(0, 0, S, S); grd.addColorStop(0, "rgba(255,255,255,0.0)"); grd.addColorStop(1, "rgba(120,135,150,0.12)"); g.fillStyle = grd; g.fillRect(m, m, S - 2 * m, S - 2 * m); }
  if (t.kind === "paver") speckle(g, S, S, rnd, 500, [0x000000, 0xffffff], 0.08, 2.5);
  if (t.kind === "mat") {
    // a cutting mat: thin grid lines every quarter, a bolder line on the cell edge
    g.strokeStyle = "rgba(255,255,255,0.22)"; g.lineWidth = 1;
    for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(k * S / 4, 0); g.lineTo(k * S / 4, S); g.moveTo(0, k * S / 4); g.lineTo(S, k * S / 4); g.stroke(); }
    g.strokeStyle = css(t.grout, 0.9); g.lineWidth = 3; g.strokeRect(1.5, 1.5, S - 3, S - 3);
  }
  return tex(c);
}

/** The blocks' sides: glazed ceramic, bricks, or end-grain wood. */
export function blockTexture(T: ThemePack, rnd: Rnd): Texture {
  const S = 128, { c, g } = canvas(S, S), b = T.block;
  g.fillStyle = css(b.face); g.fillRect(0, 0, S, S);
  if (b.kind === "brick") {
    for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) {
      const x = k * 64 + (r % 2 ? 32 : 0), y = r * 32;
      g.fillStyle = css(shade(b.face, 0.86 + rnd() * 0.24)); g.fillRect(x + 2, y + 2, 60, 28);
    }
    g.fillStyle = css(b.light, 0.9);
    for (let r = 0; r <= 4; r++) g.fillRect(0, r * 32 - 1, S, 3);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) g.fillRect(k * 64 + (r % 2 ? 32 : 0) - 1, r * 32, 3, 32);
    speckle(g, S, S, rnd, 300, [0x000000], 0.12, 2);
  } else if (b.kind === "wood") {
    for (let k = 0; k < 22; k++) { g.strokeStyle = css(k % 2 ? b.dark : b.light, 0.45); g.lineWidth = 1 + rnd() * 2; g.beginPath(); const x = rnd() * S; g.moveTo(x, 0); g.bezierCurveTo(x + (rnd() - 0.5) * 20, S * 0.4, x + (rnd() - 0.5) * 20, S * 0.6, x + (rnd() - 0.5) * 10, S); g.stroke(); }
    g.strokeStyle = css(b.dark, 0.9); g.lineWidth = 4; g.strokeRect(2, 2, S - 4, S - 4);
  } else {
    const grd = g.createLinearGradient(0, 0, 0, S); grd.addColorStop(0, css(b.light)); grd.addColorStop(1, css(b.dark));
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, 0, S, 10);
    g.strokeStyle = css(shade(b.dark, 0.8), 0.9); g.lineWidth = 3; g.strokeRect(1.5, 1.5, S - 3, S - 3);
  }
  return tex(c);
}

/** The photocell drum's side: a grid of dark blue cells with bright bus lines. */
export function cellTexture(T: ThemePack): Texture {
  const W = 256, H = 64, { c, g } = canvas(W, H), p = T.panel;
  g.fillStyle = css(shade(p.cell, 0.7)); g.fillRect(0, 0, W, H);
  for (let k = 0; k < 16; k++) for (let r = 0; r < 4; r++) {
    const x = k * 16, y = r * 16, grd = g.createLinearGradient(x, y, x + 16, y + 16);
    grd.addColorStop(0, css(shade(p.cell, 1.25))); grd.addColorStop(1, css(p.cell));
    g.fillStyle = grd; g.fillRect(x + 1, y + 1, 14, 14);
  }
  g.fillStyle = "rgba(220,230,255,0.35)"; for (let r = 0; r < 4; r++) g.fillRect(0, r * 16 + 7, W, 1);
  return tex(c, true);
}

/** A mirror's glass: a silvered face with a soft diagonal sheen and a bright edge (reads as a mirror from any side). */
export function glassTexture(tint: number): Texture {
  const W = 128, H = 80, { c, g } = canvas(W, H);
  const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, css(shade(tint, 1.18))); grd.addColorStop(0.5, css(tint)); grd.addColorStop(1, css(shade(tint, 0.78)));
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.moveTo(W * 0.18, 0); g.lineTo(W * 0.34, 0); g.lineTo(W * 0.16, H); g.lineTo(0, H); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,0.3)"; g.beginPath(); g.moveTo(W * 0.42, 0); g.lineTo(W * 0.48, 0); g.lineTo(W * 0.3, H); g.lineTo(W * 0.24, H); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  return tex(c);
}

/** A soft round spot (flares, sparks' glow, contact shadows). */
export function spotTexture(inner: string, outer: string): Texture {
  const S = 128, { c, g } = canvas(S, S), grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, inner); grd.addColorStop(0.25, inner); grd.addColorStop(1, outer);
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  const t = new CanvasTexture(c); return t;
}

/** A four-point star (a bounce's flare). */
export function flareTexture(): Texture {
  const S = 128, { c, g } = canvas(S, S), m = S / 2;
  const grd = g.createRadialGradient(m, m, 0, m, m, m); grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.18, "rgba(255,255,255,0.85)"); grd.addColorStop(0.5, "rgba(255,255,255,0.18)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  g.fillStyle = "rgba(255,255,255,0.75)";
  for (const [w, h] of [[S, 3], [3, S]]) { const lg = g.createLinearGradient(0, 0, w > h ? S : 0, w > h ? 0 : S); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(0.5, "rgba(255,255,255,0.9)"); lg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = lg; g.fillRect(m - w / 2, m - h / 2, w, h); }
  return new CanvasTexture(c);
}

/** The selected mirror's turn ring: a circle with two arrowheads (drag round to turn), in the "your move" hue. */
export function turnRingTexture(you: number): Texture {
  const S = 256, { c, g } = canvas(S, S), m = S / 2, R = S * 0.42;
  g.strokeStyle = css(you, 0.95); g.lineWidth = 9; g.lineCap = "round";
  const arc = (a0: number, a1: number) => { g.beginPath(); g.arc(m, m, R, a0, a1); g.stroke(); };
  arc(0.25, Math.PI - 0.25); arc(Math.PI + 0.25, 2 * Math.PI - 0.25);
  const head = (a: number, dir: 1 | -1) => {
    const x = m + Math.cos(a) * R, y = m + Math.sin(a) * R, tx = -Math.sin(a) * dir, ty = Math.cos(a) * dir, nx = Math.cos(a), ny = Math.sin(a);
    g.fillStyle = css(you, 0.95); g.beginPath(); g.moveTo(x + tx * 22, y + ty * 22); g.lineTo(x + nx * 15 - tx * 4, y + ny * 15 - ty * 4); g.lineTo(x - nx * 15 - tx * 4, y - ny * 15 - ty * 4); g.closePath(); g.fill();
  };
  head(Math.PI - 0.25, 1); head(2 * Math.PI - 0.25, 1);
  return tex(c);
}

/** The background (screen space): the theme's sky, and what stands on its horizon at `hy` (0..1 from the top). */
export function backdropTexture(T: ThemePack, w: number, h: number, hy: number, rnd: Rnd): Texture {
  const W = Math.max(64, Math.round(w / 2)), H = Math.max(64, Math.round(h / 2)), { c, g } = canvas(W, H), Y = Math.max(0.08, Math.min(0.9, hy)) * H;
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, css(T.sky[0])); grd.addColorStop(Math.max(0.05, Y / H * 0.85), css(T.sky[1])); grd.addColorStop(Math.min(1, Y / H), css(T.sky[2])); grd.addColorStop(1, css(shade(T.sky[2], 0.8)));
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  if (T.backdrop === "skyline") {
    // the sun low on the horizon, then the city in silhouette with a few lit windows
    const sg = g.createRadialGradient(W * 0.72, Y, 0, W * 0.72, Y, H * 0.22); sg.addColorStop(0, "rgba(255,226,160,0.95)"); sg.addColorStop(0.18, "rgba(255,190,120,0.65)"); sg.addColorStop(1, "rgba(255,150,110,0)");
    g.fillStyle = sg; g.fillRect(0, 0, W, H);
    for (let layer = 0; layer < 2; layer++) {
      g.fillStyle = layer ? "#2a2034" : "#4a3550";
      let x = -4;
      while (x < W) {
        const bw = 10 + rnd() * 26, bh = (layer ? 10 : 18) + rnd() * (layer ? 26 : 30);
        g.fillRect(x, Y - bh, bw, bh + 2);
        if (layer) for (let k = 0; k < 4; k++) if (rnd() < 0.5) { g.fillStyle = "rgba(255,214,140,0.85)"; g.fillRect(x + 2 + rnd() * (bw - 5), Y - bh + 3 + rnd() * (bh - 6), 2, 2); g.fillStyle = "#2a2034"; }
        if (layer && rnd() < 0.18) { g.fillRect(x + bw * 0.3, Y - bh - 9, bw * 0.4, 9); }            // a water tank
        x += bw - 1;
      }
    }
    g.fillStyle = "#231a2c"; g.fillRect(0, Y, W, H - Y);
  } else if (T.backdrop === "shelves") {
    // a lab wall: tiled to the horizon, a shelf of glassware above
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1;
    for (let y = Y; y > 0; y -= 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const sy = Y * 0.42;
    g.fillStyle = "rgba(60,74,88,0.55)"; g.fillRect(0, sy, W, 4);
    let x = 8;
    while (x < W - 8) {
      const kind = Math.floor(rnd() * 3), bw = 8 + rnd() * 10, bh = 10 + rnd() * 16;
      g.fillStyle = kind === 0 ? "rgba(120,160,190,0.5)" : kind === 1 ? "rgba(140,150,165,0.45)" : "rgba(170,180,192,0.55)";
      if (kind === 0) { g.beginPath(); g.moveTo(x, sy); g.lineTo(x + bw, sy); g.lineTo(x + bw * 0.62, sy - bh * 0.6); g.lineTo(x + bw * 0.62, sy - bh); g.lineTo(x + bw * 0.38, sy - bh); g.lineTo(x + bw * 0.38, sy - bh * 0.6); g.closePath(); g.fill(); }
      else g.fillRect(x, sy - bh, bw, bh);
      x += bw + 4 + rnd() * 14;
    }
    g.fillStyle = "rgba(70,84,98,0.35)"; g.fillRect(0, Y - 3, W, 3);
  } else {
    // a pegboard: rows of holes, two tools hung on it
    g.fillStyle = "rgba(0,0,0,0.28)";
    for (let y = 8; y < Y - 4; y += 10) for (let x = 6 + ((y / 10) % 2) * 5; x < W; x += 10) { g.beginPath(); g.arc(x, y, 1.3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = "rgba(20,14,10,0.55)"; g.lineWidth = 4; g.lineCap = "round";
    const tx = W * 0.18, ty = Y * 0.35; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx, ty + Y * 0.3); g.stroke();
    g.beginPath(); g.arc(W * 0.82, Y * 0.42, Math.min(14, Y * 0.12), 0, Math.PI * 2); g.stroke();
  }
  return tex(c);
}
