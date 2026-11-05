// Round 7 M5a: the scene PROPS, code-drawn actors in local units (origin at the prop's centre unless noted). Filled
// shapes in colour tokens (shared/scene.js COLOURS), friendly and flat, readable at 360 px. A prop is never text that
// states a fact: values on screen are captions and labels written by the scene's builder from kit truth.
const C = (c, r, fill, extra = {}) => ({ shape: "circle", c, r, fill, ...extra });
const E = (c, rx, ry, fill, extra = {}) => ({ shape: "ellipse", c, rx, ry, fill, ...extra });
const R = (at, w, h, fill, extra = {}) => ({ shape: "rect", at, w, h, fill, ...extra });
const P = (points, fill, extra = {}) => ({ shape: "poly", points, fill, ...extra });
const L = (from, to, stroke, sw = 3) => ({ shape: "line", from, to, stroke, sw });
const S = (c, r, from, to, fill, extra = {}) => ({ shape: "sector", c, r, from, to, fill, ...extra });

const ray = (n, r0, r1) => Array.from({ length: n }, (_, i) => { const a = (i * 2 * Math.PI) / n; return L([Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1], "sun", 3); });

const LIB = {
  sun: () => [...ray(10, 26, 36), C([0, 0], 22, "sun")],
  cloud: () => [E([0, 4], 34, 16, "cloud"), C([-14, -4], 14, "cloud"), C([8, -10], 17, "cloud"), C([24, 0], 12, "cloud")],
  raincloud: () => [E([0, 4], 34, 16, "soft"), C([-14, -4], 14, "soft"), C([8, -10], 17, "soft"), C([24, 0], 12, "soft")],
  drop: () => [P([[0, -10], [6, 0], [5, 5], [0, 8], [-5, 5], [-6, 0]], "water")],
  vapour: () => [{ shape: "path", d: "M -6 8 C -12 2 0 -2 -6 -8 M 6 8 C 0 2 12 -2 6 -8", stroke: "soft", sw: 3 }],
  sea: () => [R([0, 0], 200, 46, "sea")],
  mountain: () => [P([[0, 80], [60, 0], [120, 80]], "land"), P([[45, 20], [60, 0], [75, 20]], "ice")],
  ground: () => [R([0, 0], 400, 40, "land")],
  earth: () => [C([0, 0], 46, "sea"), P([[-30, -20], [-6, -34], [8, -10], [-12, 6], [-28, 0]], "leaf"), P([[10, 12], [32, 4], [30, 26], [14, 32]], "leaf"), S([0, 0], 46, 90, 270, "shadow", { opacity: 0.55 })],
  earthLit: () => [C([0, 0], 46, "sea"), P([[-30, -20], [-6, -34], [8, -10], [-12, 6], [-28, 0]], "leaf"), P([[10, 12], [32, 4], [30, 26], [14, 32]], "leaf")],
  nightHalf: () => [S([0, 0], 47, 90, 270, "shadow", { opacity: 0.55 })],
  person: () => [C([0, -14], 5, "mark"), L([0, -9], [0, 2], "mark", 3), L([-5, -4], [5, -4], "mark", 2.5)],
  moon: () => [C([0, 0], 18, "moon")],
  star: () => [P([[0, -6], [1.8, -1.8], [6, -1.8], [2.6, 1], [3.8, 5.6], [0, 3], [-3.8, 5.6], [-2.6, 1], [-6, -1.8], [-1.8, -1.8]], "sun")],
  seed: () => [E([0, 0], 9, 6, "wood")],
  sprout: () => [L([0, 0], [0, -26], "stem", 4), E([-8, -26], 8, 4, "leaf", { rot: -30 }), E([8, -30], 8, 4, "leaf", { rot: 30 })],
  plant: () => [L([0, 0], [0, -60], "stem", 5), E([-14, -30], 14, 6, "leaf"), E([14, -44], 14, 6, "leaf"), E([-12, -58], 12, 5, "leaf"), C([0, -66], 8, "fire")],
  root: () => [{ shape: "path", d: "M 0 0 C -4 10 -12 14 -16 24 M 0 0 C 2 12 0 18 2 28 M 0 0 C 6 8 12 14 16 22", stroke: "wood", sw: 2.5 }],
  leaf: () => [E([0, 0], 40, 18, "leaf"), L([-36, 0], [36, 0], "stem", 2)],
  grass: () => [P([[-14, 10], [-8, -12], [-4, 10]], "leaf"), P([[-4, 10], [2, -16], [6, 10]], "leaf"), P([[6, 10], [12, -10], [16, 10]], "leaf")],
  deer: () => [E([0, 0], 22, 12, "wood"), C([24, -12], 8, "wood"), L([-14, 8], [-14, 26], "wood", 4), L([12, 8], [12, 26], "wood", 4), L([26, -20], [32, -30], "wood", 2), L([22, -20], [18, -30], "wood", 2)],
  lion: () => [C([22, -8], 14, "fire"), C([22, -8], 9, "sun"), E([0, 2], 24, 12, "sun"), L([-14, 10], [-14, 28], "sun", 5), L([12, 10], [12, 28], "sun", 5)],
  ice: () => [R([-16, -16], 32, 32, "ice", { round: 4 })],
  water: () => [E([0, 0], 22, 8, "water")],
  flame: () => [P([[0, -22], [10, -4], [7, 8], [0, 12], [-7, 8], [-10, -4]], "fire"), P([[0, -8], [4, 2], [0, 8], [-4, 2]], "sun")],
  beaker: () => [P([[-24, -30], [-24, 30], [24, 30], [24, -30]], undefined, { stroke: "ink", sw: 3, closed: false })],
  battery: () => [R([-26, -12], 52, 24, "metal", { round: 3 }), R([26, -5], 6, 10, "metal"), R([-26, -12], 18, 24, "fire", { round: 3 })],
  bulbOff: () => [C([0, -10], 14, "white", { stroke: "ink", sw: 2 }), R([-7, 2], 14, 10, "metal")],
  bulbOn: () => [...ray(8, 18, 26), C([0, -10], 14, "sun", { stroke: "ink", sw: 2 }), R([-7, 2], 14, 10, "metal")],
  electron: () => [C([0, 0], 4, "accent")],
  magnet: () => [R([-30, -10], 30, 20, "fire"), R([0, -10], 30, 20, "accent")],
  pin: () => [L([-8, 0], [8, 0], "metal", 2.5)],
  heart: () => [C([-8, -4], 10, "blood"), C([8, -4], 10, "blood"), P([[-17, 0], [17, 0], [0, 20]], "blood")],
  cell: () => [C([0, 0], 5, "blood")],
  torch: () => [R([-20, -8], 30, 16, "metal", { round: 3 }), P([[10, -12], [18, -16], [18, 16], [10, 12]], "metal")],
  beam: () => [P([[0, -10], [120, -50], [120, 50], [0, 10]], "sun", { opacity: 0.35 })],
  box: () => [R([-14, -30], 28, 60, "wood")],
  shadow: () => [R([0, -30], 60, 60, "shadow", { opacity: 0.6 })],
  drum: () => [E([0, -14], 26, 8, "fire"), R([-26, -14], 52, 28, "fire"), E([0, 14], 26, 8, "fire")],
  wave: () => [{ shape: "path", d: "M 0 -18 C 8 -8 8 8 0 18", stroke: "accent", sw: 3 }],
  ear: () => [E([0, 0], 10, 16, "food"), E([2, 0], 4, 8, "crust")],
  roti: () => [C([0, 0], 70, "food", { stroke: "crust", sw: 3 })],
  slice4: () => [S([0, 0], 70, -90, 0, "food", { stroke: "crust", sw: 3 })],
  laddoo: () => [C([0, 0], 9, "sun", { stroke: "fire", sw: 1.5 })],
  plate: () => [E([0, 0], 40, 12, "white", { stroke: "soft", sw: 2 })],
  stick: () => [R([-2, -24], 4, 48, "wood")],
  bundle: () => [...Array.from({ length: 10 }, (_, i) => R([-18 + i * 4, -24], 3, 48, "wood")), R([-20, -4], 42, 8, "fire")],
  tile: () => [R([0, 0], 30, 30, "accent", { stroke: "white", sw: 2 })],
  ant: () => [C([-6, 0], 4, "ink"), C([0, 0], 5, "ink"), C([7, 0], 4, "ink")],
  lift: () => [R([-18, -22], 36, 44, "metal", { stroke: "ink", sw: 2 }), L([0, -22], [0, 22], "ink", 1.5)],
  clockFace: () => [C([0, 0], 70, "white", { stroke: "ink", sw: 4 }), ...Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return L([Math.sin(a) * 58, -Math.cos(a) * 58], [Math.sin(a) * 66, -Math.cos(a) * 66], "ink", i % 3 ? 2 : 4); })],
  handLong: () => [L([0, 0], [0, -58], "ink", 4)],
  handShort: () => [L([0, 0], [0, -38], "mark", 6)],
  hub: () => [C([0, 0], 5, "ink")],
  wingL: () => [P([[0, 0], [-60, -50], [-70, 10], [-30, 40]], "accent", { stroke: "ink", sw: 2 }), C([-40, -10], 8, "sun")],
  wingR: () => [P([[0, 0], [60, -50], [70, 10], [30, 40]], "accent", { stroke: "ink", sw: 2 }), C([40, -10], 8, "sun")],
  body: () => [E([0, 0], 6, 40, "ink")],
  bar: () => [R([-18, -100], 36, 100, "accent")],
  chair: () => [R([-10, -10], 20, 20, "wood", { round: 2 })],
  coin: () => [C([0, 0], 12, "sun", { stroke: "fire", sw: 2 })],
  arrow: () => [L([-30, 0], [24, 0], "mark", 4), P([[24, -8], [36, 0], [24, 8]], "mark")],
  co2: () => [C([0, 0], 7, "soft"), C([-10, 0], 5, "fire"), C([10, 0], 5, "fire")],
  o2: () => [C([-5, 0], 6, "accent"), C([5, 0], 6, "accent")],
  pizza: () => [C([0, 0], 70, "crust"), C([0, 0], 62, "fire"), C([-20, -20], 8, "blood"), C([22, -8], 8, "blood"), C([-6, 28], 8, "blood")],
};
export const PROPS = Object.freeze(Object.keys(LIB));
/** A prop's parts (a fresh copy each time). */
export function propParts(id) { const f = LIB[id]; return f ? f() : []; }
