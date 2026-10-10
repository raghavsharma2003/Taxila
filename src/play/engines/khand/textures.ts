// Khand · the block atlas, drawn in code at load (4 × 4 tiles of 16 px, nearest filtering: the pixel-block look). No image
// files, no text, nothing to review for words; deterministic (a hash, never a random source), so every child sees the
// same world. Tile ids match tiles.ts tileOf.
import { CanvasTexture, NearestFilter } from "three";
import { rgbStr, TILE_RGB } from "./palette.ts";

export const ATLAS_TILES = 4;
export const TILE_PX = 16;
const hash = (x: number, y: number, k: number) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

type Painter = (px: (x: number, y: number, c: number) => void, k: number) => void;
const speckle = (rgb: [number, number, number], density = 0.35): Painter => (px, k) => {
  for (let y = 0; y < TILE_PX; y++) for (let x = 0; x < TILE_PX; x++) { const r = hash(x, y, k); px(x, y, r < density * 0.5 ? rgb[1] : r > 1 - density * 0.5 ? rgb[2] : rgb[0]); }
};
const TILES: Painter[] = [
  /* 0 grass top */ speckle(TILE_RGB.grassTop, 0.5),
  /* 1 grass side */ (px, k) => { speckle(TILE_RGB.dirt, 0.4)(px, k); for (let x = 0; x < TILE_PX; x++) { const fr = 3 + Math.floor(hash(x, 0, k) * 3); for (let y = 0; y < fr; y++) px(x, y, hash(x, y, k + 1) < 0.3 ? TILE_RGB.grassTop[1] : TILE_RGB.grassTop[0]); } },
  /* 2 paving */ (px, k) => { speckle(TILE_RGB.paving, 0.3)(px, k); for (let i = 0; i < TILE_PX; i++) { px(i, 0, TILE_RGB.paving[1]); px(0, i, TILE_RGB.paving[1]); px(i, 8, TILE_RGB.paving[1]); px(8, i < 8 ? i : 0, TILE_RGB.paving[1]); } },
  /* 3 stone top */ speckle(TILE_RGB.stoneTop, 0.45),
  /* 4 stone side */ (px, k) => { speckle(TILE_RGB.stoneSide, 0.45)(px, k); for (let x = 0; x < TILE_PX; x++) px(x, 15, TILE_RGB.stoneSide[1]); },
  /* 5 brick */ (px) => { for (let y = 0; y < TILE_PX; y++) for (let x = 0; x < TILE_PX; x++) { const row = Math.floor(y / 4), off = row % 2 ? 4 : 0, mortar = y % 4 === 3 || (x + off) % 8 === 7; px(x, y, mortar ? TILE_RGB.brick[2] : hash(x, y, 5) < 0.2 ? TILE_RGB.brick[1] : TILE_RGB.brick[0]); } },
  /* 6 sandstone top */ speckle(TILE_RGB.sandTop, 0.3),
  /* 7 sandstone side */ (px, k) => { speckle(TILE_RGB.sandSide, 0.25)(px, k); for (let x = 0; x < TILE_PX; x++) { px(x, 5, TILE_RGB.sandSide[1]); px(x, 11, TILE_RGB.sandSide[1]); } },
  /* 8 wood top */ (px) => { for (let y = 0; y < TILE_PX; y++) for (let x = 0; x < TILE_PX; x++) { const r = Math.round(Math.hypot(x - 7.5, y - 7.5)); px(x, y, r % 3 === 0 ? TILE_RGB.woodTop[1] : TILE_RGB.woodTop[0]); } },
  /* 9 wood side (planks) */ (px, k) => { for (let y = 0; y < TILE_PX; y++) for (let x = 0; x < TILE_PX; x++) px(x, y, y % 4 === 0 ? TILE_RGB.woodSide[1] : hash(x, y, k) < 0.15 ? TILE_RGB.woodSide[2] : TILE_RGB.woodSide[0]); },
  /* 10 jade */ (px, k) => { speckle(TILE_RGB.jade, 0.3)(px, k); for (let i = 0; i < TILE_PX; i++) { px(i, 0, TILE_RGB.jade[2]); px(0, i, TILE_RGB.jade[2]); px(i, 15, TILE_RGB.jade[1]); px(15, i, TILE_RGB.jade[1]); } },
  /* 11 given top */ (px, k) => { speckle(TILE_RGB.givenTop, 0.25)(px, k); for (let i = 0; i < TILE_PX; i++) { px(i, 0, TILE_RGB.givenTop[2]); px(0, i, TILE_RGB.givenTop[2]); } },
  /* 12 given side */ (px, k) => { speckle(TILE_RGB.givenSide, 0.25)(px, k); for (let i = 0; i < TILE_PX; i++) px(i, 15, TILE_RGB.givenSide[1]); },
  /* 13 build pad (the plot's ground, one cell per tile, edged) */ (px, k) => { speckle(TILE_RGB.pad, 0.3)(px, k); for (let i = 0; i < TILE_PX; i++) { px(i, 0, TILE_RGB.pad[1]); px(0, i, TILE_RGB.pad[1]); } },
  /* 14 leaves */ speckle(TILE_RGB.leaf, 0.6),
  /* 15 snow (the barf theme's ground; also the fallback) */ speckle(TILE_RGB.snow, 0.25),
];

/** The atlas as a three.js texture (or null where no 2D canvas exists). */
export function makeAtlas(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = ATLAS_TILES * TILE_PX, c = document.createElement("canvas");
  c.width = size; c.height = size;
  const g = c.getContext("2d"); if (!g) return null;
  const img = g.createImageData(size, size);
  TILES.forEach((paint, t) => {
    const ox = (t % ATLAS_TILES) * TILE_PX, oy = Math.floor(t / ATLAS_TILES) * TILE_PX;
    paint((x, y, col) => { const i = ((oy + y) * size + ox + x) * 4; img.data[i] = (col >> 16) & 255; img.data[i + 1] = (col >> 8) & 255; img.data[i + 2] = col & 255; img.data[i + 3] = 255; }, t * 97 + 13);
  });
  g.putImageData(img, 0, 0);
  const tex = new CanvasTexture(c);
  tex.magFilter = NearestFilter; tex.minFilter = NearestFilter; tex.generateMipmaps = false;   // sampled raw: the block shader writes these sRGB values straight out
  return tex;
}
export { rgbStr };
