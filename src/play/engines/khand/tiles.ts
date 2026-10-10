// Khand · block materials and which atlas tile each face shows (shared by the worker and the main thread; pure).
// The atlas (textures.ts) is 4 × 4 tiles drawn in code: no image files, no text.
export const MAT = {
  air: 0,
  grass: 1,      // the plot ground blocks (never built)
  paving: 2,     // scenery: the courtyard round a pit, locked
  stone: 3,      // scenery: the given half of a mirror build, the terms of a sequence
  brick: 4,      // the child's palette ↓
  sandstone: 5,
  wood: 6,
  jade: 7,
  given: 8,      // the filled array beside a turned pit
  leaf: 9,       // scenery: tree tops round the plot
} as const;
export type MatId = (typeof MAT)[keyof typeof MAT];
/** The child's palette: cosmetic only (the law counts blocks, never colours). */
export const PALETTE: { id: MatId; name: string }[] = [
  { id: MAT.brick, name: "Brick" }, { id: MAT.sandstone, name: "Sandstone" }, { id: MAT.wood, name: "Wood" }, { id: MAT.jade, name: "Jade" },
];
/** dir: 0 +x, 1 −x, 2 +y (top), 3 −y, 4 +z, 5 −z */
export function tileOf(mat: number, dir: number): number {
  switch (mat) {
    case MAT.grass: return dir === 2 ? 0 : 1;
    case MAT.paving: return 2;
    case MAT.stone: return dir === 2 ? 3 : 4;
    case MAT.brick: return 5;
    case MAT.sandstone: return dir === 2 ? 6 : 7;
    case MAT.wood: return dir === 2 ? 8 : 9;
    case MAT.jade: return 10;
    case MAT.given: return dir === 2 ? 11 : 12;
    case MAT.leaf: return 14;
    default: return 15;
  }
}
