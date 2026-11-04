// The face's weak-device path (round 7 face-puppet-raster-cost-main-thread). Two pure decisions and one tiny driver:
//   liteGate()     the static gate: a device that cannot raster the mesh rig cheaply (no WebGL2, a software rasteriser /
//                  failIfMajorPerformanceCaveat, a known-bad GPU: src/avatar/tier.ts staticTier → D) never builds the live
//                  stage. It shows her rest still with the LIGHT MOUTH instead. The probe (two throwaway WebGL contexts) runs
//                  once per page, and only when a live stage is about to be built (never on the cold path).
//   liteKey()      the light mouth's key for a meter level: closed / ee / half / oh / open (the r8 pack's lite/ sprites,
//                  rendered from the live rig by evals/face-puppet/mouth-sprites.mjs), held ≥ LITE_HOLD_MS so it never flickers.
//   armLive()      when the live stage may load: at her first audio (status "speaking"), or outside a lesson (no status)
//                  once the page is idle, or LIVE_ARM_FALLBACK_MS after mount. Until then the still + light mouth carry her:
//                  the stage chunk, the pack decode and the warm-up never compete with Start → her first sound.
// The light mouth costs one img opacity swap per key change at ≤ 15 Hz: no canvas, no GL, no per-frame JS on the
// main thread beyond reading the meter.
import { detectStaticFacts, staticTier, type StaticFacts } from "../avatar/tier.ts";
import type { FloorStatus } from "../avatar/behaviour.ts";
import { lookPack, type PuppetLook } from "./assets.ts";
import { puppetForcedOn } from "./flag.ts";

/** Looks that ship a lite mouth pack (public/face-puppet/<look>/lite/). lamp2 is a Canvas 2D key rig already. */
export const LITE_LOOKS: readonly PuppetLook[] = ["r8"];
export const liteBase = (look: PuppetLook) => `${lookPack(look).base}lite/`;
export type LiteKeyName = "closed" | "ee" | "half" | "oh" | "open";
export const LITE_KEYS: readonly LiteKeyName[] = ["closed", "ee", "half", "oh", "open"];
/** The light mouth's tick (ms): 15 Hz, the rate a painted mouth reads as speech ("on fours" at 60). */
export const LITE_TICK_MS = 66;
/** A key stays up at least this long (ms) before the next replaces it. */
export const LITE_HOLD_MS = 90;
/** The live stage arms by this long after mount (ms) even if she has not spoken (a text lesson, a quiet screen). */
export const LIVE_ARM_FALLBACK_MS = 6000;

let facts: StaticFacts | null = null;
/** Tests: the device facts the gate reads (null = probe the browser). */
export function setLiteFactsForTests(f: StaticFacts | null): void {
  facts = f;
}

export interface LiteDecision { lite: boolean; why: string }

/** The static gate for a look on this device. A key rig (Canvas 2D, a few drawImage calls) is never gated. */
export function liteGate(look: PuppetLook): LiteDecision {
  if (lookPack(look).rig === "keys") return { lite: false, why: "key rig" };
  if (puppetForcedOn()) return { lite: false, why: "forced on (?puppet=1)" };
  facts ??= detectStaticFacts();
  const t = staticTier({ ...facts, voiceOnly: false, battery: null });
  return t.tier === "D" || t.tier === "E" ? { lite: true, why: t.why.join("; ") } : { lite: false, why: t.why.join("; ") };
}

/** Whether the live stage may load now. `sinceMountMs` is the time since the face mounted; `idle` means the page has had
 *  an idle callback since mount. */
export function armLive(o: { status: FloorStatus | null; spokeYet: boolean; sinceMountMs: number; idle: boolean }): boolean {
  if (o.spokeYet || o.status === "speaking") return true;
  if (o.status === null && o.idle) return true;
  return o.sinceMountMs >= LIVE_ARM_FALLBACK_MS;
}

/** The lite mouth state machine: a smoothed meter level → a key, with a minimum hold. Pure (the clock is passed in). */
export class LiteMouth {
  key: LiteKeyName = "closed";
  private since = -1e9;
  private lv = 0;
  private syl = 0;
  private wasOpen = false;
  step(level: number, speaking: boolean, nowMs: number): LiteKeyName {
    // fast attack, slower release: a syllable opens at once and closes over ~2 ticks
    this.lv = level > this.lv ? level : this.lv * 0.55 + level * 0.45;
    const l = speaking ? this.lv : 0;
    let want: LiteKeyName;
    if (l < 0.14) want = "closed";
    else if (l < 0.3) want = "ee";
    else if (l < 0.48) want = "half";
    else {
      // each new open syllable alternates its vowel shape, so a long line does not read as one jaw flapping
      if (!this.wasOpen) this.syl++;
      want = this.syl % 3 === 2 ? "oh" : "open";
    }
    this.wasOpen = l >= 0.48;
    if (want === this.key) return this.key;
    // closing for a word gap or a seal is never held back; any other change waits out the hold
    if (want !== "closed" && nowMs - this.since < LITE_HOLD_MS) return this.key;
    this.key = want;
    this.since = nowMs;
    return want;
  }
}

/** Where the lite sprite sits over a framing's poster, as percentages of the poster box (the poster paints at
 *  width 100%, height auto, from the top: its box is view width × (1024 - view y0) in rest space). */
export function liteBox(rect: readonly [number, number, number, number], view: readonly [number, number, number]) {
  const [x0, y0, x1, y1] = rect;
  const [vx, vy, vw] = view;
  const h = 1024 - vy;
  return { aspect: `${vw} / ${h}`, left: ((x0 - vx) / vw) * 100, top: ((y0 - vy) / h) * 100, width: ((x1 - x0) / vw) * 100, height: ((y1 - y0) / h) * 100 };
}
