// Yantra · the art pack (WebGL materials and the code-drawn textures, never CSS chrome). Numbers, as three.js takes them.
// Three themes dress the same optics bench; the learning objects keep one meaning in every theme:
//   the beam  = the law's trace (its own hue per theme, chosen to stand off the table and never the "your move" hue);
//   you       = the selected mirror's turn ring (the play art's reserved "your move" lime);
//   good      = the panel lit by a hit;   look = the spark where a miss ends (never red, never a cross).
// The scenery (table, tiles, blocks, sky) stays muted so nothing competes with the beam.
export type YantraTheme = "lab" | "rooftop" | "bench";
export const YANTRA_THEMES: readonly YantraTheme[] = ["lab", "rooftop", "bench"];

export interface ThemePack {
  /** the background, painted top → horizon → bottom (a screen-space canvas) */
  sky: [number, number, number];
  /** what stands on the horizon: a lab wall with shelves, a city skyline at dusk, a pegboard */
  backdrop: "shelves" | "skyline" | "pegboard";
  table: { base: number; dark: number; light: number; kind: "laminate" | "concrete" | "planks"; edge: number };
  tile: { face: number; grout: number; jitter: number; kind: "ceramic" | "paver" | "mat" };
  block: { face: number; dark: number; light: number; kind: "ceramic" | "brick" | "wood" };
  /** lamp body, its metal trim and its lens */
  lamp: { body: number; trim: number; lens: number };
  /** the photocell drum (cells and frame), the fan */
  panel: { cell: number; frame: number; fan: number; ring: number };
  mirror: { frame: number; glass: number; foot: number };
  /** the beam: a hot core and its glow ("add" glows on a dark bench; "normal" keeps a light bench from washing it out) */
  beam: { core: number; glow: number; blend: "add" | "normal" };
  light: { key: number; keyI: number; hemiSky: number; hemiGround: number; hemiI: number; keyDir: [number, number, number]; pool: number };
  you: number; good: number; look: number;
  /** the circuit kit and the pendulum stand (r7: the same bench wears all three laws) */
  kit: {
    /** the parts' base boards, the brass of the screw posts, a wire's insulation and the current's moving beads */
    plate: number; brass: number; wire: number; current: number;
    /** the cell's body and its printed band; the bulb's glass and its light; the switch's lever and knob */
    cell: number; band: number; glass: number; glow: number; lever: number; knob: number;
    /** the stray parts: a steel clip, a rubber eraser */
    steel: number; rubber: number;
    /** the pendulum: the stand, its rod, the thread, the scale and its ticks */
    stand: number; rod: number; thread: number; ruler: number; tick: number;
    /** the beat: the mela drum's shell and skin, the bell; the flash when the bob comes back to its side */
    drum: number; skin: number; bell: number; flash: number;
  };
  labels: { ink: number; you: number; good: number; look: number; q1: number; q2: number; pill: number; pillAlpha: number };
}

export const THEMES: Record<YantraTheme, ThemePack> = {
  // a school physics lab: a dark resin bench top, white ceramic tiles on it, a red laser
  lab: {
    sky: [0xd9e2ea, 0xbfccd8, 0x8d9cab], backdrop: "shelves",
    table: { base: 0x39424d, dark: 0x2f3741, light: 0x4a5461, kind: "laminate", edge: 0x1f252c },
    tile: { face: 0xf4f6f7, grout: 0xa9b4be, jitter: 0.025, kind: "ceramic" },
    block: { face: 0x6d8296, dark: 0x566a7e, light: 0x8ea2b6, kind: "ceramic" },
    lamp: { body: 0x2b3440, trim: 0xb9c3cc, lens: 0xff4d6a },
    panel: { cell: 0x1d3f7a, frame: 0x8d99a6, fan: 0x2f5da8, ring: 0x2f5da8 },
    mirror: { frame: 0x37414d, glass: 0xd6eef7, foot: 0x2a313a },
    beam: { core: 0xff1f45, glow: 0xff3355, blend: "normal" },
    light: { key: 0xffffff, keyI: 1.55, hemiSky: 0xeaf3ff, hemiGround: 0x7d8792, hemiI: 1.25, keyDir: [-3, 9, 5], pool: 0.3 },
    you: 0x5b7a00, good: 0x1f9d5b, look: 0xb86e00,
    kit: { plate: 0xe8edf1, brass: 0xc9a23a, wire: 0xd8402c, current: 0xffb300, cell: 0x2f5da8, band: 0xe8c547, glass: 0xdfeff7, glow: 0xffd257, lever: 0x9aa6b2, knob: 0xd8402c,
      steel: 0xc3cad2, rubber: 0xf08aa0, stand: 0x2b3440, rod: 0xb9c3cc, thread: 0xf4f1e8, ruler: 0xf1e3c2, tick: 0x3a3226, drum: 0xa8452c, skin: 0xf0e2c4, bell: 0xc9a23a, flash: 0x2f9de0 },
    labels: { ink: 0x16202a, you: 0x3f5a00, good: 0x146c3e, look: 0x8a5200, q1: 0x9a5b00, q2: 0x2f5da8, pill: 0xffffff, pillAlpha: 0.86 },
  },
  // a roof at dusk: a concrete slab, terracotta pavers, brick blocks; the beam is warm sunlight from a torch
  rooftop: {
    sky: [0x2a2a5c, 0x8a4a7a, 0xf29a5a], backdrop: "skyline",
    table: { base: 0x8d8790, dark: 0x77717b, light: 0xa39da6, kind: "concrete", edge: 0x4a4550 },
    tile: { face: 0xc98a62, grout: 0x6e5a5c, jitter: 0.05, kind: "paver" },
    block: { face: 0x9c4a36, dark: 0x7a3626, light: 0xc9a48c, kind: "brick" },
    lamp: { body: 0x2e2a36, trim: 0xd6b26a, lens: 0xffe08a },
    panel: { cell: 0x1b2f63, frame: 0xb8bcc6, fan: 0xf1ede6, ring: 0xffd27a },
    mirror: { frame: 0x2e2a36, glass: 0xe6e2f2, foot: 0x221f29 },
    beam: { core: 0xfffbe6, glow: 0xffc21a, blend: "add" },
    light: { key: 0xffc79a, keyI: 1.7, hemiSky: 0xb9a4d8, hemiGround: 0x4a3a40, hemiI: 1.15, keyDir: [6, 5, 3], pool: 0.3 },
    you: 0xcbff4d, good: 0x74e8bd, look: 0xffb547,
    kit: { plate: 0xe2d3bf, brass: 0xd6b26a, wire: 0x2f6fd0, current: 0xfff27a, cell: 0x2e2a36, band: 0xffc21a, glass: 0xf1ecf7, glow: 0xffd77a, lever: 0xb8bcc6, knob: 0xc9583a,
      steel: 0xd4d8de, rubber: 0x6fb3e8, stand: 0x2e2a36, rod: 0xb8bcc6, thread: 0xfff4ea, ruler: 0xe9d4a8, tick: 0x2e2420, drum: 0xb5482e, skin: 0xf3e6c8, bell: 0xd6b26a, flash: 0x9fd8ff },
    labels: { ink: 0xfff4ea, you: 0xcbff4d, good: 0x9dffd0, look: 0xffd27a, q1: 0xffd27a, q2: 0x9fd8ff, pill: 0x1a1426, pillAlpha: 0.74 },
  },
  // a maker's workbench: oiled planks, a green cutting mat, wooden blocks, a red-orange laser
  bench: {
    sky: [0x2a2420, 0x3a312a, 0x4a3e33], backdrop: "pegboard",
    table: { base: 0xa8743f, dark: 0x8c5f33, light: 0xbf8a52, kind: "planks", edge: 0x5a3b20 },
    tile: { face: 0x2f6b55, grout: 0x8fc4ad, jitter: 0.03, kind: "mat" },
    block: { face: 0xc79a5e, dark: 0xa87d45, light: 0xdcb57c, kind: "wood" },
    lamp: { body: 0xd8d2c4, trim: 0x3a3a3a, lens: 0xff7a2a },
    panel: { cell: 0x1d3466, frame: 0x3a3a3a, fan: 0xe8c547, ring: 0xffd27a },
    mirror: { frame: 0x6b4a2b, glass: 0xdcebf0, foot: 0x4a3320 },
    beam: { core: 0xffd2b0, glow: 0xff5a1f, blend: "add" },
    light: { key: 0xfff0d8, keyI: 1.6, hemiSky: 0xffe2c0, hemiGround: 0x3a2a1c, hemiI: 1.1, keyDir: [-4, 8, 4], pool: 0.32 },
    you: 0xcbff4d, good: 0x74e8bd, look: 0xffb547,
    kit: { plate: 0x2f6b55, brass: 0xe0b44a, wire: 0xe0452a, current: 0xfff0a0, cell: 0x1d3466, band: 0xe8c547, glass: 0xe8f2f4, glow: 0xffcf6a, lever: 0x9a9a9a, knob: 0xe0452a,
      steel: 0xd0d4d8, rubber: 0xf2a0b4, stand: 0x3a3a3a, rod: 0xd8d2c4, thread: 0xfff6ea, ruler: 0xe8c98e, tick: 0x2a1d10, drum: 0x9c3b22, skin: 0xf3e3c0, bell: 0xe0b44a, flash: 0x9fd8ff },
    labels: { ink: 0xfff6ea, you: 0xcbff4d, good: 0x9dffd0, look: 0xffd27a, q1: 0xffd27a, q2: 0x9fd8ff, pill: 0x1c1510, pillAlpha: 0.76 },
  },
};

/** the four bobs (20, 50, 100, 200 g): wood, aluminium, brass, iron, each a size its mass would give (theme-free: a material
 *  keeps its look in every theme, so a bigger, heavier bob is the same bob wherever it hangs) */
export const BOB_LOOK: Record<number, { color: number; shine: number; r: number }> = {
  20: { color: 0xc08a4f, shine: 12, r: 0.24 }, 50: { color: 0xcfd5dc, shine: 90, r: 0.31 },
  100: { color: 0xd4a537, shine: 110, r: 0.39 }, 200: { color: 0x4d535c, shine: 60, r: 0.49 },
};

export const themeOf = (t: string): YantraTheme => ((YANTRA_THEMES as readonly string[]).includes(t) ? (t as YantraTheme) : "lab");
export const css = (n: number, a = 1) => `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
/** n scaled toward black (k < 1) or white (k > 1) */
export const shade = (n: number, k: number): number => {
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k <= 1 ? c * k : c + (255 - c) * (k - 1))));
  return (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255);
};
