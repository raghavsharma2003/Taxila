// Emotions (TEACHER-VISUAL §6), owner states (§7.2), viseme folding for B+ (lipMatrix) and the wrinkle drivers (§9).
// Pure data + pure functions: the avatar workstream can copy this file into src/avatar unchanged.

/** §6: ARKit deltas at intensity 1, head [pitch(+ chin down), yaw(+ her left), roll] degrees, gaze contact 0..1.
 *  Iteration 2 (art-director review item 10): the face deltas are §6's; what changed is the HEAD and GAZE signature,
 *  because at small size children read affect from the head first. Deviations from §6, stated: encouraging leans
 *  0.6 (was 0.3) with a 4 deg nod pose (was 2) and a lower-lid raise; listening tilts 6 deg (was 4) with the lower lids
 *  raised (eyeSquint 0.08); concerned adds browDown 0.1 (was 0.06) so the worry knot corrective fires, chin 2 deg
 *  down; curious lifts the chin 2 deg and turns 3 deg. */
// procedural-v3 (CHARACTER-PIPELINE §10.1): every emotion carries its OWN signature that survives a still frame, built on
// the v3 face units (keys.py expression_correctives_v3). Deviations from TEACHER-VISUAL §6 amplitudes, stated: the §6
// rows were each ~0.5x too small to read on this face (37% vision self-check); the register rules hold (no sad, no
// fear, no glamour; concern stays warm). Signatures:
//   warm        closed-mouth Duchenne: smile + cheek raise + lower-lid crinkle, soft 4 deg tilt
//   encouraging raised brows + pressed-lip smile ("you can do it"), a nod pose (chin down 5 deg) + lean in. NOT legible
//               to the judge: 0/6 on every one of 17 tried variants (always read as warm); kept as the most honest design
//   curious     inner brows up, eyes a little wide, lips softly pursed, a 9 deg tilt with the chin up
//   thinking    (unchanged: 100% in iteration 2) gaze averted up and to the side, pressed mouth to one side
//   listening   no smile: an attentive squint, the head turned and tilted (ear to the child), gaze held, lean in
//   concerned   the oblique brow (inner up + knit), lips pressed, a slight downturn, tilt + chin down; warmth kept
//   delighted   OPEN-mouth Duchenne: jaw 0.32, upper teeth showing (upperUp 0.7), big cheek raise, crinkled eyes, head back
//   playful     a lopsided smile pulled to one side, the opposite brow raised, a half-wink, a sideways tilt + glance
//   surprised   brows high, eyes wide, jaw dropped with a soft O, head back
// merged (bake-off VERDICT): six presets changed on the merged face. listening (pose), playful and delighted for a stated
// defect; curious, thinking and listening (face) for legibility, chosen against judge A only (an overfit risk, stated):
//   listening  faces the camera (yaw 0, gaze held) with a 12 deg tilt (was 7, see below): v3's 10 deg turn let the judge read the
//              turn, not the face (VERDICT "cheats");
//   playful    the half-wink (eyeBlinkLeft 0.22) is gone: a partial blink over the squint showed a lid artefact; the
//              wink is carried by the squint and the cheek instead;
//   curious    raised OUTER brows (left higher), eyes wide, lips just parted in a soft 'oh', a 6 deg tilt and a small
//              turn: the inner-brow raise and the pucker read as concerned / playful on this face (judge A screen, n=6)
//   thinking   v3's averted gaze kept (up and to the side), chin up 6 deg, a symmetric brow knit with the inner brows up,
//              the lips pressed firmly with the lower lip pushed up; no head roll and no one-sided mouth pull (both read as
//              a smirk / playful: 0/10 for the one-sided design vs 10/10, judge A, n = 10)
//   warm       the 4 deg head roll removed (8/10 -> 10/10 warm, the roll pulled it toward playful; judge A, n = 10)
//   listening  the resting smile cancelled (it read as warm: 11/12 under judge C): a light concentration knit, the
//              lips pressed, the gaze held on the child, chin down 5 deg, a 12 deg head tilt and a full lean in; yaw 0
//   (these three were chosen with judge A only, n = 5-6 per variant; judge B never saw a candidate)
//   delighted  a believable open smile: jaw 0.32 -> 0.2, lower lip barely down (0.25 -> 0.08), upper lip up 0.55, so the
//              upper teeth show and the lower row and the mouth's back stay hidden (the grimace, VERDICT).
// merged iteration 3 (art-director review items 8-9; chosen against judge A only, n = 8-10 per variant, so A is NOT
// independent on these; judge C (held-out prompt) and B score the final set):
//   warm       Duchenne: a SMALLER smile (0.5 -> 0.28) with the cheeks and lower lids carrying it (cheekSquint 0.65,
//              eyeSquint 0.33), a little upper lip (0.12) and stretch (0.1) so the mouth widens instead of curling into a
//              U; 8/8 (a 0.42 smile with no tilt read playful 0/8)
//   encouraging the same Duchenne base with raised brows, judged on its nod clip
//   curious    no pout and no smile (every smile read warm/playful): both brows up, the left higher, eyes wide, lips just
//              parted, a 12 deg tilt, a small turn, gaze a touch up, full lean; 8/10 (iteration 2's pout 0/8 here)
//   thinking   iteration 2's averted gaze with a light pucker and pressed lips ("hmm"), chin up only 4 deg (was 7: the
//              under-chin), no lid squint (with the upward gaze it read sleepy), 8/8 with the squint
//   listening  no smile (a smile read warm), the inner brows up, the left brow a little higher, eyes slightly wide, lips
//              lightly pressed, 11 deg tilt, facing the camera (yaw 2), full lean; on a still it sits at 5/10, so it is
//              judged on its "mm-hm" nod clip (CLIPS.listening), like encouraging (proposed decision, context inbox)
//   delighted  a wider, flatter open smile: smile 0.45 (was 0.85), upper lip 0.55, stretch 0.25, cheeks 0.9, lids 0.42,
//              jaw 0.26: 7/8, no U-shaped grimace
export const EMOTIONS = {
  warm: { bs: { mouthSmileLeft: 0.28, mouthSmileRight: 0.28, cheekSquintLeft: 0.65, cheekSquintRight: 0.65, eyeSquintLeft: 0.33, eyeSquintRight: 0.33, mouthUpperUpLeft: 0.12, mouthUpperUpRight: 0.12, mouthStretchLeft: 0.1, mouthStretchRight: 0.1, browInnerUp: 0.08 }, head: [1, 0, 0], env: [600, 1500, 900] },
  encouraging: { bs: { mouthSmileLeft: 0.22, mouthSmileRight: 0.22, cheekSquintLeft: 0.5, cheekSquintRight: 0.5, eyeSquintLeft: 0.15, eyeSquintRight: 0.15, mouthUpperUpLeft: 0.1, mouthUpperUpRight: 0.1, mouthStretchLeft: 0.12, mouthStretchRight: 0.12, browInnerUp: 0.55, browOuterUpLeft: 0.55, browOuterUpRight: 0.55, eyeWideLeft: 0.12, eyeWideRight: 0.12 }, head: [3, 0, 0], lean: 0.5, env: [400, 1200, 800] },
  curious: { bs: { browOuterUpLeft: 0.85, browOuterUpRight: 0.65, browInnerUp: 0.2, eyeWideLeft: 0.45, eyeWideRight: 0.45, jawOpen: 0.05, mouthUpperUpLeft: 0.06, mouthUpperUpRight: 0.06 }, head: [-4, 8, 12], gaze: [-4, 5], lean: 1.0, env: [350, 1800, 700] },
  thinking: { bs: { browDownLeft: 0.22, browDownRight: 0.22, browInnerUp: 0.3, mouthShrugLower: 0.2, mouthPucker: 0.25, mouthPressLeft: 0.3, mouthPressRight: 0.3 }, head: [-4, -6, 0], gaze: [-16, 22], env: [300, 3500, 300] },
  listening: { bs: { browOuterUpLeft: 0.4, browOuterUpRight: 0.1, browInnerUp: 0.25, eyeWideLeft: 0.15, eyeWideRight: 0.1, mouthPressLeft: 0.12, mouthPressRight: 0.12 }, head: [0, 2, 11], gaze: [-1, 1], lean: 1.0, env: [120, 0, 280] },
  concerned: { bs: { browInnerUp: 0.9, browDownLeft: 0.25, browDownRight: 0.25, mouthPressLeft: 0.2, mouthPressRight: 0.2, mouthFrownLeft: 0.25, mouthFrownRight: 0.25, mouthPucker: 0.1, eyeWideLeft: 0.08, eyeWideRight: 0.08 }, head: [7, 0, 9], gaze: [0, -2], lean: 0.6, env: [700, 2500, 1200] },
  delighted: { bs: { mouthSmileLeft: 0.45, mouthSmileRight: 0.45, jawOpen: 0.26, mouthUpperUpLeft: 0.55, mouthUpperUpRight: 0.55, mouthLowerDownLeft: 0.18, mouthLowerDownRight: 0.18, mouthStretchLeft: 0.25, mouthStretchRight: 0.25, cheekSquintLeft: 0.9, cheekSquintRight: 0.9, eyeSquintLeft: 0.42, eyeSquintRight: 0.42, browOuterUpLeft: 0.25, browOuterUpRight: 0.25, browInnerUp: 0.12 }, head: [-6, 0, 3], flush: 0.04, env: [350, 1200, 900] },
  playful: { bs: { mouthSmileLeft: 0.6, mouthSmileRight: 0.12, mouthLeft: 0.15, cheekSquintLeft: 0.55, eyeSquintLeft: 0.5, browOuterUpRight: 0.6, browInnerUp: 0.1, browDownLeft: 0.15, mouthDimpleLeft: 0.2 }, head: [1, 5, 9], gaze: [8, 2], env: [300, 1000, 600] },
  surprised: { bs: { browInnerUp: 0.75, browOuterUpLeft: 0.75, browOuterUpRight: 0.75, eyeWideLeft: 0.6, eyeWideRight: 0.6, jawOpen: 0.3, mouthFunnel: 0.18, mouthSmileLeft: 0.1, mouthSmileRight: 0.1 }, head: [-5, 0, 0], env: [120, 400, 500] },
};
/** merged: emotions judged on MOTION (the logged decision `encouraging-judged-on-motion`: ~29 still designs scored 0
 *  on two faces). A clip is the emotion's still pose plus head keyframes over `durationS` (linear between keys, degrees
 *  added to the pose's head [pitch + chin down, yaw, roll]) and optional per-key blendshape boosts. The renderer samples
 *  6 frames for the judge's strip and 25 fps for the MP4. The runtime plays the same keys as a gesture. */
export const CLIPS = {
  // merged iteration 3: bigger, quicker "haan, haan!" nods (11-12 deg) with the mouth opening on each (a spoken "yes"),
  // the brows lifting and the lean growing: 5/8 with iteration 2's softer clip under judge A (read as warm)
  encouraging: { durationS: 2.0, keys: [
    { t: 0.0, head: [0, 0, 0] },
    { t: 0.28, head: [11, 0, 2], bs: { jawOpen: 0.16, mouthUpperUpLeft: 0.1, mouthUpperUpRight: 0.1, browOuterUpLeft: 0.2, browOuterUpRight: 0.2, browInnerUp: 0.15 } },
    { t: 0.55, head: [-3, 0, 1], bs: { browOuterUpLeft: 0.1, browOuterUpRight: 0.1 } },
    { t: 0.85, head: [12, 0, 3], bs: { jawOpen: 0.18, mouthUpperUpLeft: 0.12, mouthUpperUpRight: 0.12, browOuterUpLeft: 0.25, browOuterUpRight: 0.25, browInnerUp: 0.2, mouthSmileLeft: 0.08, mouthSmileRight: 0.08 } },
    { t: 1.15, head: [-3, 0, 2], bs: { browOuterUpLeft: 0.15, browOuterUpRight: 0.15 } },
    { t: 1.5, head: [9, 0, 2], bs: { jawOpen: 0.12, browOuterUpLeft: 0.2, browOuterUpRight: 0.2, mouthSmileLeft: 0.12, mouthSmileRight: 0.12 } },
    { t: 2.0, head: [1, 0, 2], bs: { mouthSmileLeft: 0.12, mouthSmileRight: 0.12, browOuterUpLeft: 0.15, browOuterUpRight: 0.15 } }] },
};
// merged iteration 3: listening's "mm-hm": two slow, small nods (4-5 deg) while the face holds the listening pose, the
// brows lifting a touch on each nod and the lips pressing as if to say "mm". Proposed decision (context inbox):
// listening, like encouraging, is a motion emotion; on a still it sits between warm and concerned (5/10 at best).
CLIPS.listening = { durationS: 2.0, keys: [
  { t: 0.0, head: [0, 0, 0] },
  { t: 0.45, head: [5, 0, 1], bs: { browInnerUp: 0.08, mouthPressLeft: 0.12, mouthPressRight: 0.12 } },
  { t: 0.85, head: [0, 0, 1] },
  { t: 1.3, head: [5, 0, 2], bs: { browInnerUp: 0.08, mouthPressLeft: 0.12, mouthPressRight: 0.12 } },
  { t: 2.0, head: [1, 0, 2] }] };
export function clipPose(name, t, asym) {
  const c = CLIPS[name], base = emotionPose(name, 1, asym);
  const k = c.keys; let i = 0;
  while (i < k.length - 2 && t > k[i + 1].t) i++;
  const a = k[i], b = k[i + 1], u = Math.max(0, Math.min(1, (t - a.t) / Math.max(1e-6, b.t - a.t)));
  const lerp = (x, y) => x + (y - x) * u;
  const head = base.head.map((h, j) => h + lerp(a.head[j], b.head[j]));
  const bs = { ...base.bs };
  for (const key of new Set([...Object.keys(a.bs || {}), ...Object.keys(b.bs || {})])) bs[key] = (bs[key] || 0) + lerp((a.bs || {})[key] || 0, (b.bs || {})[key] || 0);
  return { ...base, bs, head };
}
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
    // merged: nasolabial share halved (1.2 -> 0.6): at full drive the map drew a thin dark line at the smile corner
    B: [c(g("mouthSmileLeft") * 0.6 + g("noseSneerLeft")), c(g("mouthSmileRight") * 0.6 + g("noseSneerRight")),
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
