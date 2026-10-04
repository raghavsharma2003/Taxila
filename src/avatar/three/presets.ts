// Pure rig maths, ported from scripts/character/bakeoff/merged/viewer/{presets,rig}.js: the B+ viseme fold, the
// correctives (product of parents: glTF has no drivers), lid-follow, the jaw ceiling and the wrinkle-map drivers.
// No three.js, so tests drive it frame by frame. The emotion / state presets are NOT here: they are per face
// (decision teacher-presets-per-face) and live in each look's runtime.json.

/** B+ / B-lite have no viseme morphs: each viseme folds into ARKit mouth keys (the per-character lipMatrix seed).
 *  A look's runtime.json visemeFold.map overrides this default. */
export const VISEME_TO_ARKIT: Record<string, Record<string, number>> = {
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

/** A viseme's jaw-equivalent opening, for the mouth-interior light when a tier HAS viseme morphs (they open the
 *  mouth by their own deltas, not through jawOpen, so the interior read every viseme as closed). */
export const VISEME_OPEN: [string, number][] = Object.entries({
  viseme_aa: 0.55, viseme_O: 0.42, viseme_E: 0.32, viseme_I: 0.26, viseme_U: 0.22, viseme_CH: 0.22, viseme_kk: 0.26, viseme_DD: 0.22,
  viseme_TH: 0.22, viseme_RR: 0.22, viseme_nn: 0.16, viseme_SS: 0.14, viseme_FF: 0.14,
});

/** Correctives: weight = product of the parents (glTF has no drivers; CHARACTER-PIPELINE §5.2). */
export function correctiveParents(name: string): [string, string] | null {
  const m = name.match(/^(.*?)(Left|Right)?$/);
  if (!m) return null;
  const base = m[1], side = m[2] || "";
  const T: Record<string, [string, string]> = {
    jawOpen_mouthClose: ["jawOpen", "mouthClose"], jawOpen_mouthSmile: ["jawOpen", `mouthSmile${side}`],
    eyeBlink_eyeLookDown: [`eyeBlink${side}`, `eyeLookDown${side}`], eyeBlink_eyeSquint: [`eyeBlink${side}`, `eyeSquint${side}`],
    mouthFunnel_jawOpen: ["mouthFunnel", "jawOpen"], browInnerUp_browDown: ["browInnerUp", `browDown${side}`],
    cheekSquint_eyeBlink: [`cheekSquint${side}`, `eyeBlink${side}`],
  };
  return T[base] ?? null;
}

/** Wrinkle-map region weights from the FINAL weights (so speech-driven smiles crease too).
 *  maskA = forehead, glabella, crowL, crowR; maskB = nasoL, nasoR, chin, neck. */
export function wrinkleWeights(w: Record<string, number>): { A: number[]; B: number[]; stretch: number } {
  const g = (k: string) => w[k] || 0;
  const c = (x: number) => Math.max(0, Math.min(1, x));
  return {
    A: [c(g("browInnerUp") * 0.9 + (g("browOuterUpLeft") + g("browOuterUpRight")) * 0.5),
      c((g("browDownLeft") + g("browDownRight")) * 1.2 + g("browInnerUp") * 0.35 * Math.min(1, (g("browDownLeft") + g("browDownRight")) * 4)),
      c(g("cheekSquintLeft") * 1.4 + g("eyeSquintLeft") * 0.8 + g("mouthSmileLeft") * 0.4),
      c(g("cheekSquintRight") * 1.4 + g("eyeSquintRight") * 0.8 + g("mouthSmileRight") * 0.4)],
    B: [c(g("mouthSmileLeft") * 0.6 + g("noseSneerLeft")), c(g("mouthSmileRight") * 0.6 + g("noseSneerRight")),
      c(g("mouthShrugLower") * 1.2 + (g("mouthPressLeft") + g("mouthPressRight")) * 0.8 + g("mouthRollLower") * 0.5), 0],
    stretch: c(g("jawOpen") * 0.6 + (g("browOuterUpLeft") + g("browOuterUpRight")) * 0.125),
  };
}

export interface FinalOptions {
  /** The tier carries viseme_* morphs (H): visemes pass through; otherwise they fold into ARKit keys. */
  hasVisemes: boolean;
  fold?: Record<string, Record<string, number>>;
  /** runtime.json calibration gains (empty since iteration 2). */
  calibration?: Record<string, number>;
  jawCeiling?: number;
  /** [name, [parentA, parentB]] for the corrective morphs present on this face. */
  correctives?: [string, [string, string]][];
}

/**
 * One frame's final morph weights: viseme fold → lid follow (upper lid tracks gaze pitch at 0.5 via eyeLook*) →
 * calibration → clamp 0..1 → jaw ceiling → correctives as products of the clamped parents. Writes into `out`.
 */
export function finalWeights(bs: Record<string, number>, gaze: [number, number], o: FinalOptions, out: Record<string, number> = {}): Record<string, number> {
  for (const k in out) delete out[k];
  const fold = o.fold ?? VISEME_TO_ARKIT;
  for (const k in bs) {
    const v = bs[k];
    if (k.startsWith("viseme_") && !o.hasVisemes) {
      const f = fold[k];
      if (f) for (const a in f) out[a] = (out[a] || 0) + f[a] * v;
    } else out[k] = (out[k] || 0) + v;
  }
  const up = Math.max(0, gaze[1]) / 25, dn = Math.max(0, -gaze[1]) / 25;
  for (const S of ["Left", "Right"]) {
    out[`eyeLookUp${S}`] = (out[`eyeLookUp${S}`] || 0) + up * 0.5;
    out[`eyeLookDown${S}`] = (out[`eyeLookDown${S}`] || 0) + dn * 0.5;
  }
  if (o.calibration) for (const k in o.calibration) if (out[k]) out[k] *= o.calibration[k];
  for (const k in out) out[k] = Math.max(0, Math.min(1, out[k]));
  if (out.jawOpen) out.jawOpen = Math.min(out.jawOpen, o.jawCeiling ?? 1);
  for (const [k, p] of o.correctives ?? []) out[k] = (out[p[0]] || 0) * (out[p[1]] || 0);
  return out;
}

/** The mouth-interior opening for the skin shader: jawOpen, or the largest viseme opening on a viseme tier. */
export function mouthOpening(final: Record<string, number>, hasVisemes: boolean): number {
  let open = final.jawOpen || 0;
  if (hasVisemes) for (const [k, g] of VISEME_OPEN) if (final[k]) open = Math.max(open, final[k] * g);
  return open;
}

/** The eye shader's upper-lid position per eye: rest lid + blink − wide + squint + look-down share. */
export function lidClose(final: Record<string, number>, restLid: number, S: "Left" | "Right"): number {
  return Math.max(0, Math.min(1, restLid + (1 - restLid) * (final[`eyeBlink${S}`] || 0) - 0.35 * (final[`eyeWide${S}`] || 0)
    + 0.25 * (final[`eyeSquint${S}`] || 0) + 0.3 * (final[`eyeLookDown${S}`] || 0) - 0.3 * (final[`eyeLookUp${S}`] || 0)));
}
