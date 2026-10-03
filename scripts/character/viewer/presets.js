// Emotions (TEACHER-VISUAL §6), owner states (§7.2), viseme folding for B+ (lipMatrix) and the wrinkle drivers (§9).
// Pure data + pure functions: the avatar workstream can copy this file into src/avatar unchanged.

/** §6: ARKit deltas at intensity 1, head [pitch(+ chin down), yaw(+ her left), roll] degrees, gaze contact 0..1.
 *  Iteration 2 (art-director review item 10): the face deltas are §6's; what changed is the HEAD and GAZE signature,
 *  because at small size children read affect from the head first. Deviations from §6, stated: encouraging leans
 *  0.6 (was 0.3) with a 4 deg nod pose (was 2) and a lower-lid raise; listening tilts 6 deg (was 4) with the lower lids
 *  raised (eyeSquint 0.08); concerned adds browDown 0.1 (was 0.06) so the worry knot corrective fires, chin 2 deg
 *  down; curious lifts the chin 2 deg and turns 3 deg. */
export const EMOTIONS = {
  warm: { bs: { mouthSmileLeft: 0.3, mouthSmileRight: 0.3, cheekSquintLeft: 0.18, cheekSquintRight: 0.18, eyeSquintLeft: 0.12, eyeSquintRight: 0.12, mouthDimpleLeft: 0.05, mouthDimpleRight: 0.05 }, head: [0, 0, 2], env: [600, 1500, 900] },
  encouraging: { bs: { mouthSmileLeft: 0.22, mouthSmileRight: 0.22, browInnerUp: 0.12, mouthPressLeft: 0.05, mouthPressRight: 0.05, cheekSquintLeft: 0.1, cheekSquintRight: 0.1, eyeSquintLeft: 0.06, eyeSquintRight: 0.06 }, head: [4, 0, 0], lean: 0.6, env: [400, 1200, 800] },
  curious: { bs: { browInnerUp: 0.28, browOuterUpLeft: 0.22, browOuterUpRight: 0.22, eyeWideLeft: 0.06, eyeWideRight: 0.06, mouthSmileLeft: 0.08, mouthSmileRight: 0.08 }, head: [-2, 3, 6], env: [350, 1800, 700] },
  thinking: { bs: { browDownLeft: 0.06, browDownRight: 0.06, browInnerUp: 0.06, mouthPressLeft: 0.08, mouthPressRight: 0.08, mouthLeft: 0.04 }, head: [-2, -3, 0], gaze: [-14, 12], env: [300, 3500, 300] },
  listening: { bs: { browInnerUp: 0.08, mouthSmileLeft: 0.06, mouthSmileRight: 0.06, eyeSquintLeft: 0.08, eyeSquintRight: 0.08 }, head: [1, 0, 6], lean: 0.15, env: [120, 0, 280] },
  concerned: { bs: { browInnerUp: 0.3, browDownLeft: 0.1, browDownRight: 0.1, mouthPressLeft: 0.12, mouthPressRight: 0.12, mouthSmileLeft: 0.05, mouthSmileRight: 0.05 }, head: [2, 0, 5], env: [700, 2500, 1200] },
  delighted: { bs: { mouthSmileLeft: 0.55, mouthSmileRight: 0.55, cheekSquintLeft: 0.35, cheekSquintRight: 0.35, eyeSquintLeft: 0.22, eyeSquintRight: 0.22, browOuterUpLeft: 0.25, browOuterUpRight: 0.25, eyeWideLeft: 0.08, eyeWideRight: 0.08, jawOpen: 0.08 }, head: [-3, 0, 0], flush: 0.04, env: [350, 1200, 900] },
  playful: { bs: { mouthSmileLeft: 0.35, mouthSmileRight: 0.2, browOuterUpLeft: 0.3, eyeSquintRight: 0.1, cheekSquintLeft: 0.12 }, head: [0, 4, 8], gaze: [8, 0], env: [300, 1000, 600] },
  surprised: { bs: { browInnerUp: 0.4, browOuterUpLeft: 0.45, browOuterUpRight: 0.45, eyeWideLeft: 0.35, eyeWideRight: 0.35, jawOpen: 0.15 }, head: [-3, 0, 0], env: [120, 400, 500] },
};
export const EMOTION_ORDER = ["warm", "encouraging", "curious", "thinking", "listening", "concerned", "delighted", "playful", "surprised"];

/** §7.2: the seven owner states as floor x affect, posed at a representative instant. */
export const STATES = {
  idle: { affect: ["warm", 0.4], head: [1, 2, 1], gaze: [4, -2], breath: 0.4 },
  speaking: { affect: ["warm", 0.7], viseme: ["viseme_aa", 0.55], extra: { browInnerUp: 0.12, browOuterUpLeft: 0.1, browOuterUpRight: 0.1 }, head: [-1, 0, 0], breath: 0.7 },
  your_turn: { affect: ["warm", 0.5], extra: { browInnerUp: 0.08, browOuterUpLeft: 0.14, browOuterUpRight: 0.14 }, head: [-3, 0, 2], lean: 1, gaze: [0, 0] },
  listening: { affect: ["listening", 1], head: [1, 0, 6], lean: 0.25, gaze: [0, 0] },
  thinking: { affect: ["thinking", 1], head: [-2, -4, 0], gaze: [-14, 13] },
  celebrating: { affect: ["delighted", 1], head: [-3, 0, 0] },
  concerned: { affect: ["concerned", 1], head: [1, 0, 5], gaze: [0, -2] },
};
export const STATE_ORDER = ["idle", "listening", "thinking", "speaking", "your_turn", "celebrating", "concerned"];

/** B+ has no viseme morphs: each viseme folds into ARKit mouth keys (the per-character lipMatrix seed). */
export const VISEME_TO_ARKIT = {
  viseme_sil: {},
  viseme_PP: { mouthClose: 0.35, jawOpen: 0.1, mouthPressLeft: 0.5, mouthPressRight: 0.5, mouthRollLower: 0.2, mouthRollUpper: 0.15 },
  viseme_FF: { jawOpen: 0.12, mouthRollLower: 0.55, mouthUpperUpLeft: 0.25, mouthUpperUpRight: 0.25, mouthPressLeft: 0.1, mouthPressRight: 0.1 },
  viseme_TH: { jawOpen: 0.18, tongueOut: 0.35, mouthUpperUpLeft: 0.1, mouthUpperUpRight: 0.1 },
  viseme_DD: { jawOpen: 0.22, mouthStretchLeft: 0.15, mouthStretchRight: 0.15, mouthUpperUpLeft: 0.1, mouthUpperUpRight: 0.1, tongueTipUp: 0.6 },
  viseme_kk: { jawOpen: 0.26, mouthStretchLeft: 0.2, mouthStretchRight: 0.2 },
  viseme_CH: { jawOpen: 0.15, mouthFunnel: 0.45, mouthPucker: 0.2, mouthUpperUpLeft: 0.2, mouthUpperUpRight: 0.2 },
  viseme_SS: { jawOpen: 0.08, mouthStretchLeft: 0.35, mouthStretchRight: 0.35, mouthSmileLeft: 0.15, mouthSmileRight: 0.15 },
  viseme_nn: { jawOpen: 0.16, mouthStretchLeft: 0.1, mouthStretchRight: 0.1, tongueTipUp: 0.4 },
  viseme_RR: { jawOpen: 0.18, mouthFunnel: 0.3, mouthPucker: 0.25 },
  viseme_aa: { jawOpen: 0.6, mouthLowerDownLeft: 0.2, mouthLowerDownRight: 0.2 },
  viseme_E: { jawOpen: 0.35, mouthStretchLeft: 0.35, mouthStretchRight: 0.35, mouthUpperUpLeft: 0.15, mouthUpperUpRight: 0.15 },
  viseme_I: { jawOpen: 0.2, mouthStretchLeft: 0.45, mouthStretchRight: 0.45, mouthSmileLeft: 0.15, mouthSmileRight: 0.15 },
  viseme_O: { jawOpen: 0.38, mouthFunnel: 0.55, mouthPucker: 0.2 },
  viseme_U: { jawOpen: 0.15, mouthPucker: 0.75, mouthFunnel: 0.25 },
};
export const VISEME_ORDER = Object.keys(VISEME_TO_ARKIT);

/** Correctives: weight = product of the parents (glTF has no drivers; §5.2). */
export function correctiveParents(name) {
  const m = name.match(/^(.*?)(Left|Right)?$/);
  const base = m[1], side = m[2] || "";
  const T = {
    jawOpen_mouthClose: ["jawOpen", "mouthClose"], jawOpen_mouthSmile: ["jawOpen", `mouthSmile${side}`],
    eyeBlink_eyeLookDown: [`eyeBlink${side}`, `eyeLookDown${side}`], eyeBlink_eyeSquint: [`eyeBlink${side}`, `eyeSquint${side}`],
    mouthFunnel_jawOpen: ["mouthFunnel", "jawOpen"], browInnerUp_browDown: ["browInnerUp", `browDown${side}`],
    cheekSquint_eyeBlink: [`cheekSquint${side}`, `eyeBlink${side}`],
  };
  return T[base] || null;
}

/** §9: wrinkle-map region weights from the FINAL weights (so speech-driven smiles crease too).
 *  maskA = forehead, glabella, crowL, crowR; maskB = nasoL, nasoR, chin, neck. */
export function wrinkleWeights(w) {
  const g = (k) => w[k] || 0;
  const c = (x) => Math.max(0, Math.min(1, x));
  return {
    A: [c(g("browInnerUp") * 0.9 + (g("browOuterUpLeft") + g("browOuterUpRight")) * 0.5),
      c((g("browDownLeft") + g("browDownRight")) * 1.2 + g("browInnerUp") * 0.35 * Math.min(1, (g("browDownLeft") + g("browDownRight")) * 4)),
      c(g("cheekSquintLeft") * 1.4 + g("eyeSquintLeft") * 0.8 + g("mouthSmileLeft") * 0.4),
      c(g("cheekSquintRight") * 1.4 + g("eyeSquintRight") * 0.8 + g("mouthSmileRight") * 0.4)],
    B: [c(g("mouthSmileLeft") * 1.2 + g("noseSneerLeft")), c(g("mouthSmileRight") * 1.2 + g("noseSneerRight")),
      c(g("mouthShrugLower") * 1.2 + (g("mouthPressLeft") + g("mouthPressRight")) * 0.8 + g("mouthRollLower") * 0.5), 0],
    // forehead share of the stretch map halved (0.25 -> 0.125): forehead lines on the 24-year-old (review item 5)
    stretch: c(g("jawOpen") * 0.6 + (g("browOuterUpLeft") + g("browOuterUpRight")) * 0.125),
  };
}

/** Compose an emotion at intensity i (with the look's seeded asymmetry) into ARKit weights. */
export function emotionPose(name, i = 1, asym = { smile: 0, brow: 0, squint: 0 }) {
  const e = EMOTIONS[name];
  const bs = {};
  for (const [k, v] of Object.entries(e.bs)) {
    let a = 1;
    if (/Left$/.test(k)) a = 1 + (k.startsWith("mouthSmile") ? asym.smile : k.startsWith("brow") ? asym.brow : asym.squint || 0);
    if (/Right$/.test(k)) a = 1 - (k.startsWith("mouthSmile") ? asym.smile : k.startsWith("brow") ? asym.brow : asym.squint || 0);
    bs[k] = v * i * a;
  }
  return { bs, head: e.head.map((x) => x * i), gaze: e.gaze ? e.gaze.map((x) => x * i) : [0, 0], lean: (e.lean || 0) * i, flush: (e.flush || 0) * i };
}
