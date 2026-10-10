// lamp1 (round 4): the per-face constants of the painted-puppet runtime. r8's rig.js, lips.js and gl.js held c-front's
// pixel positions inline (RIG-NOTES §3.1); they now read them from F. The defaults below ARE those inline values, so a pack
// whose geom.json has no "face" block (r8) renders exactly as before. geom.face overrides any key (one face per page:
// this is module state, set by the rig constructor).
//   k  = face scale of skin-motion magnitudes (cheek lift, jaw shape, shoulder breath), c-front = 1
//   ke = eye scale (gaze travel, lid bow, wink arch), kb = brow scale (brow channel ranges), mouth.k = mouth scale
export const CFRONT = {
  px: { cx: 512, cy: 420, rx: 322, ry: 392, A: 205, fcx: 530, fcy: 500, fsx: 128, fsy: 160, B: 95, gain: 1.0, pivot: [530, 728] },
  noseZ: { x: 530, y: 532, s: 24, a: 26 },
  cheekZ: { xs: [452, 608], y: 585, s: 45, a: 8 },
  mid: 530,
  hw: 208,
  sil: { y: [320, 430, 690, 790], chin: [560, 690, 720, 800], chinW: 0.75 },
  feat: { box: [400, 320, 660, 700], nose: [533, 540, 27, 24], noseY: [470, 600], wing: [23, 552, 11, 13], bindi: [526, 354, 20, 18], bindiY: 400, mouth: [530, 40], mouthY: [560, 585, 650, 700] },
  pins: [[364, 384], [684, 368]], pinS: 72,
  cheeks: { L: [455, 585], R: [605, 585], s: 42 },
  wink: { L: [430, 545], R: [632, 545], s: 48 },
  jawBroad: { y: [606, 668], s: 180 },
  narrow: { ax: [40, 170], y: 650, s: 70 },
  body: { cx: 527, hem: 1024, sh: [95, 200], shY: [700, 790, 860, 1010], bw: [800, 1010], rollY: [700, 780], neckY: [772, 700], neckW: [110, 160] },
  anchor: [530, 300, 120],
  bunZ: -45,
  lockBun: { R: [585, 650] },
  shade: { face: { L: [330, 530], R: [530, 730], amt: 0.16 }, hair: { L: [200, 660], R: [400, 820], amt: 0.1 }, tint: [0, 0, 0] },
  noseShade: [532, 528, 508, 1],
  glints: [[315, 565], [748, 541]], glintA: 1,
  k: 1, ke: 1, kb: 1,
  eye: { shade: [0.4, 0.4], round: 6, upK: 1, upLid: 0.02 },
  presets: {},
  mouth: { lineX0: 448, lineStep: 4, line: [585, 584, 584, 587, 589, 592, 594, 596, 597, 599, 600, 601, 602, 603, 604, 604, 605, 605, 606, 606, 606, 606, 606, 605, 605, 604, 603, 602, 601, 600, 598, 597, 596, 594, 592, 589, 587, 584, 580, 576, 576, 575],
    cx: 530, hwL: 69, hwR: 71, tU: 13.5, tL: 21, cy: 606, jaw: [606, 660, 128], k: 1 },
};
const clone = (o) => JSON.parse(JSON.stringify(o));
export const F = clone(CFRONT);
const hooks = [];
export const onFace = (fn) => { hooks.push(fn); };
let ver = 0;
export const faceVersion = () => ver;
/** Reset F to c-front and apply a geom.face block (shallow per top-level key, one level deeper for objects). */
export function setFace(face) {
  const d = clone(CFRONT);
  for (const k of Object.keys(F)) delete F[k];
  Object.assign(F, d);
  if (face) for (const [k, v] of Object.entries(face)) {
    if (v && typeof v === "object" && !Array.isArray(v) && F[k] && typeof F[k] === "object" && !Array.isArray(F[k])) F[k] = { ...F[k], ...clone(v) };
    else F[k] = clone(v);
  }
  ver++;
  for (const fn of hooks) fn(F);
}
