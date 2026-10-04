// Mouth solver (PLAN §6.1): composited HeadRig weights -> ONE continuous mouth state. Pure, no DOM.
// Sources, in order: ARKit lip keys (today's live LipDriver emits only jaw/funnel/pucker/stretch, so the state must
// look right from those alone), viseme_* weights (forced alignment / HeadAudio), the three Hindi tongue keys, and the
// emotion keys (smile/frown/press). ARKit "Left" = her left = SCREEN RIGHT.

/** Canonical state per viseme. Hindi notes: DD carries the dental/alveolar tip-up (t d n l are dental in Hindi, so
 *  the tip sits on the back of the upper teeth); retroflex is signalled by tongueCurl, the lateral by tongueWide. */
export const VISEME_STATE = {
  viseme_sil: {},
  viseme_PP: { open: 0, press: 0.75, rollIn: 0.25 },
  viseme_FF: { open: 0.07, rollIn: 0.55, upperUp: 0.35, teeth: 0.8 },
  viseme_TH: { open: 0.28, tongueOut: 0.55, upperUp: 0.1, teeth: 0.6 },
  viseme_DD: { open: 0.32, wide: 0.15, tipUp: 0.85, teeth: 0.5 },
  viseme_kk: { open: 0.27, wide: 0.2 },
  viseme_CH: { open: 0.14, round: 0.5, upperUp: 0.25, teeth: 0.8 },
  viseme_SS: { open: 0.07, wide: 0.38, smile: 0.08, teeth: 1 },
  viseme_nn: { open: 0.26, tipUp: 0.7 },
  viseme_RR: { open: 0.24, round: 0.28, tipUp: 0.45 },
  viseme_aa: { open: 0.62, lowerDown: 0.25 },
  viseme_E: { open: 0.33, wide: 0.42, upperUp: 0.15, teeth: 0.6 },
  viseme_I: { open: 0.19, wide: 0.5, smile: 0.08, teeth: 0.8 },
  viseme_O: { open: 0.4, round: 0.72 },
  viseme_U: { open: 0.13, round: 0.95 },
};
const FIELDS = ["open", "wide", "round", "press", "upperUp", "lowerDown", "rollIn", "teeth", "tipUp", "curl", "tongueWide", "tongueOut"];
const c01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function mouthState(bs, out = {}) {
  const g = (k) => bs[k] || 0;
  const avg = (k) => (g(k + "Left") + g(k + "Right")) / 2;
  out.open = c01(g("jawOpen") - 0.7 * g("mouthClose"));
  out.wide = c01(avg("mouthStretch") + 0.3 * avg("mouthDimple"));
  out.round = c01(Math.max(g("mouthFunnel"), g("mouthPucker") * 0.95));
  out.press = c01(avg("mouthPress") + g("mouthPress") + 0.6 * g("mouthClose"));
  out.upperUp = c01(avg("mouthUpperUp") + 0.4 * g("mouthShrugUpper"));
  out.lowerDown = c01(avg("mouthLowerDown"));
  out.rollIn = c01((g("mouthRollLower") + g("mouthRollUpper")) / 2);
  out.teeth = 0;
  out.tipUp = c01(g("tongueTipUp"));
  out.curl = c01(g("tongueCurl"));
  out.tongueWide = c01(g("tongueWide"));
  out.tongueOut = c01(g("tongueOut"));
  // visemes: blend toward their canonical states by total viseme weight
  let vs = 0;
  const acc = {};
  for (const k in bs) {
    if (!k.startsWith("viseme_")) continue;
    const w = bs[k];
    if (!(w > 0)) continue;
    const S = VISEME_STATE[k];
    if (!S) continue;
    vs += w;
    for (const f of FIELDS) acc[f] = (acc[f] || 0) + w * (S[f] || 0);
    if (S.smile) acc.smile = (acc.smile || 0) + w * S.smile;
  }
  if (vs > 0.001) {
    const a = Math.min(1, vs);
    for (const f of FIELDS) {
      const v = (acc[f] || 0) / Math.max(1, vs);
      // tongue keys from the tongue channel and from the visemes combine by max (either source may carry them)
      out[f] = f === "tipUp" || f === "curl" || f === "tongueWide" || f === "tongueOut" ? Math.max(out[f], v) : out[f] * (1 - a) + v;
    }
  }
  out.smile = c01(avg("mouthSmile") + g("mouthSmile") + (acc.smile || 0));
  out.frown = c01(avg("mouthFrown"));
  // skew: + = toward screen right. mouthLeft moves the mouth to HER left = screen right.
  out.skew = Math.max(-1, Math.min(1, g("mouthLeft") - g("mouthRight") + 0.6 * (g("mouthSmileLeft") - g("mouthSmileRight"))));
  out.smileL = c01(g("mouthSmileRight") + g("mouthSmile")); // screen-left corner = her right
  out.smileR = c01(g("mouthSmileLeft") + g("mouthSmile"));
  if (vs > 0.001) {
    const vsm = (acc.smile || 0);
    out.smileL = c01(out.smileL + vsm);
    out.smileR = c01(out.smileR + vsm);
  }
  out.cheekPuff = c01(g("cheekPuff"));
  // a closed bilabial must close: press wins over any residual open
  if (out.press > 0.5) out.open *= 1 - (out.press - 0.5) * 2;
  return out;
}
