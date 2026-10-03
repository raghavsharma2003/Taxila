// FaceCompositor (AVATAR.md §4.5): the ONE place where every priority rule between the layers lives.
//   final = clamp01(rest + behaviour + lip), where
//   - the lip layer owns jawOpen and the mouth-shape keys; nothing attenuates jawOpen;
//   - mouthClose ≤ jawOpen every frame; jawOpen ≤ jawCeiling;
//   - while the lips are near-closed, only mouthSmile* is scaled down (to × 0.4); cheek and eye squint untouched;
//   - per-frame |Δ| ≤ 0.06 on every key except blinks and lip keys (anti-snap);
//   - weights < 0.01 → 0 (the shader skips zero influences).
export const LIP_KEYS = new Set([
  "jawOpen", "mouthClose", "mouthFunnel", "mouthPucker", "mouthStretchLeft", "mouthStretchRight",
  "mouthRollLower", "mouthRollUpper", "mouthUpperUpLeft", "mouthUpperUpRight", "mouthLowerDownLeft", "mouthLowerDownRight", "tongueOut",
]);
export const BLINK_KEYS = new Set(["eyeBlinkLeft", "eyeBlinkRight"]);
export const MAX_DELTA = 0.06;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export class Compositor {
  private prev: Record<string, number> = {};
  private closure = 0;
  private readonly jawCeiling: number;
  constructor(jawCeiling = 0.85) {
    this.jawCeiling = jawCeiling;
  }

  reset(): void {
    this.prev = {};
    this.closure = 0;
  }

  /** `dt` seconds since the last frame (for the closure factor's attack/release). */
  compose(behaviour: Record<string, number>, lip: Record<string, number>, dt: number): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(behaviour)) if (!LIP_KEYS.has(k)) out[k] = v;
    for (const [k, v] of Object.entries(lip)) out[k] = (out[k] ?? 0) + v;
    const jaw = Math.min(clamp01(out.jawOpen ?? 0), this.jawCeiling);
    out.jawOpen = jaw;
    out.mouthClose = Math.min(clamp01(out.mouthClose ?? 0), jaw);
    // Closure factor, smoothed (≥ 60 ms attack, ≥ 120 ms release): lips near-closed while she is talking.
    const closing = lip.jawOpen !== undefined && jaw < 0.04 && (lip.mouthClose ?? 0) > 0 ? 1 : 0;
    const tau = closing > this.closure ? 0.06 : 0.12;
    this.closure += (1 - Math.exp(-dt / tau)) * (closing - this.closure);
    const smileScale = 1 - 0.6 * this.closure;
    for (const k of ["mouthSmileLeft", "mouthSmileRight"]) if (out[k] !== undefined) out[k] *= smileScale;
    for (const k of Object.keys(out)) {
      let v = clamp01(out[k]);
      if (!LIP_KEYS.has(k) && !BLINK_KEYS.has(k)) {
        const p = this.prev[k] ?? 0;
        v = Math.max(p - MAX_DELTA, Math.min(p + MAX_DELTA, v));
      }
      out[k] = v < 0.01 ? 0 : v;
    }
    // A key that vanished from both layers still decays under the delta cap instead of snapping to zero.
    for (const [k, p] of Object.entries(this.prev)) {
      if (out[k] === undefined && !LIP_KEYS.has(k) && !BLINK_KEYS.has(k) && p > 0) {
        const v = Math.max(0, p - MAX_DELTA);
        if (v >= 0.01) out[k] = v;
      }
    }
    this.prev = out;
    return out;
  }
}
