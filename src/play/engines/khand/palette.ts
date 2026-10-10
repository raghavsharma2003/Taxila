// Khand · world colours (WebGL materials and the code-drawn block atlas, never CSS chrome). Numbers, as three.js takes
// them. The learning objects (the child's blocks, targets, the glow on a mismatch, the fence) take their hues from the
// play art tokens (src/play/core/styles.ts ART) so every Taxila game says "your move", "goal met" and "look again" in
// the same colours; the scenery here is kept muted and never sits on a learning object.
export interface SkyPalette { top: number; horizon: number; fog: number; sun: number; hemiSky: number; hemiGround: number }
export const SKY: Record<"day" | "dusk" | "night", SkyPalette> = {
  day: { top: 0x4f8fd6, horizon: 0xcfe6f2, fog: 0xcfe6f2, sun: 0xfff3dc, hemiSky: 0xd9ecff, hemiGround: 0x6b7a4a },
  dusk: { top: 0x3c4f8c, horizon: 0xf2c49b, fog: 0xe9c3a3, sun: 0xffd9a8, hemiSky: 0xf4d6c0, hemiGround: 0x5a5440 },
  night: { top: 0x0d1630, horizon: 0x2a3a66, fog: 0x22305a, sun: 0xb8c8ff, hemiSky: 0x56648c, hemiGround: 0x1a1d24 },
};
/** Atlas pixel colours per tile: [base, dark, light] (r, g, b packed). */
export const TILE_RGB: Record<string, [number, number, number]> = {
  grassTop: [0x6fae4a, 0x5a9a3c, 0x86c25c],
  dirt: [0x8a6440, 0x76553a, 0x9c7550],
  paving: [0xb9b3a6, 0x9f998c, 0xcfc9bc],
  stoneTop: [0x9aa0a6, 0x828a90, 0xb1b6bb],
  stoneSide: [0x8e949a, 0x767c82, 0xa6abb0],
  brick: [0xb5523b, 0x8f3f2e, 0xd7cbb6],
  sandTop: [0xe2c48a, 0xceae74, 0xf0d7a4],
  sandSide: [0xd8b678, 0xbf9c60, 0xe8cc94],
  woodTop: [0xb8874f, 0x8c633a, 0xcfa06a],
  woodSide: [0xa8743f, 0x7d5530, 0xbf8a52],
  jade: [0x3fa58a, 0x2f8a72, 0x63c2a6],
  givenTop: [0x7c8fc4, 0x6476ab, 0x98a9d6],
  givenSide: [0x6f82b8, 0x56689e, 0x8c9dcc],
  pad: [0xcdb991, 0xb8a47c, 0xe0cfa8],
  leaf: [0x4f8f3a, 0x3f7a2e, 0x6aa84e],
};
export const rgbStr = (n: number) => `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
