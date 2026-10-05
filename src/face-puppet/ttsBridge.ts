// The PCM player → puppet seam (patch 02 calls these from src/lesson/ttsStream.ts). The server frames Diya's viseme
// batches next to the audio (patch 01): {t: "visemes", part, atSample, leadMs, v: [[ms, id]], w?: [[ms, durMs, text]],
// text?}, where `atSample` is the part's first sample in the reply (the same anchor as its clause event), `leadMs` the
// audio edgeTrim dropped before it, and every ms is from the part's first SYNTHESISED sample. The player knows when a
// reply sample sounds; it calls visemePlayAt() for that anchor and puppetVisemes() emits on the bus.
import { puppetBus } from "./bus.ts";

export const PCM_RATE = 24_000;

export interface TtsVisemeFrame {
  t: "visemes";
  part: number;
  atSample: number;
  leadMs?: number;
  v: Array<[number, number]>;
  w?: Array<[number, number, string]>;
  text?: string;
}

export const isVisemeFrame = (d: unknown): d is TtsVisemeFrame =>
  !!d && typeof d === "object" && (d as { t?: unknown }).t === "visemes" && Array.isArray((d as { v?: unknown }).v) && Number.isFinite((d as { atSample?: unknown }).atSample);

type OutCtx = Pick<BaseAudioContext, "currentTime"> & { outputLatency?: number; baseLatency?: number; getOutputTimestamp?: () => { contextTime?: number; performanceTime?: number } };

/**
 * performance.now() ms at which AudioContext time `ctxTime` SOUNDS at the output (the face must move with the sound the
 * child hears). Prefers getOutputTimestamp() (the browser's own output-clock estimate: contextTime is being played at
 * performanceTime), which is smooth; falls back to currentTime + outputLatency, which steps by the audio callback size
 * (~10 ms on desktop Linux, 20-40 ms on Android). Ship5 p2-face: computed ONCE per player anchor (anchorPerfTime + the
 * caller's cache), because recomputing it per batch put the batches of one part up to 8 ms apart on the product path and
 * the scheduler split them into separate tracks.
 */
export function anchorPerfTime(ctxTime: number, ctx: OutCtx, nowMs = performance.now()): number {
  const ts = ctx.getOutputTimestamp?.();
  if (ts && ts.contextTime && ts.performanceTime && ts.performanceTime <= nowMs + 50 && nowMs - ts.performanceTime < 1000) {
    return ts.performanceTime + (ctxTime - ts.contextTime) * 1000;
  }
  const outLat = (ctx.outputLatency || ctx.baseLatency || 0) * 1000;
  return nowMs + (ctxTime - ctx.currentTime) * 1000 + outLat;
}

/** playAt of a framed part from its anchor: the anchor's sample `fromSample` sounds at performance time `anchorPerf`. */
export const partPlayAt = (f: Pick<TtsVisemeFrame, "atSample" | "leadMs">, fromSample: number, anchorPerf: number): number =>
  anchorPerf + ((f.atSample - fromSample) / PCM_RATE) * 1000 - (f.leadMs ?? 0);

/** One-shot form (tests, the harness): the part's playAt with the anchor converted now. */
export function visemePlayAt(f: Pick<TtsVisemeFrame, "atSample" | "leadMs">, fromSample: number, startAt: number, ctx: OutCtx, nowMs = performance.now()): number {
  return partPlayAt(f, fromSample, anchorPerfTime(startAt, ctx, nowMs));
}

/** Emit one framed batch on the puppet bus (the scheduler merges batches of the same part). */
export function puppetVisemes(f: TtsVisemeFrame, playAt: number, reqId?: string): void {
  puppetBus.emit({
    kind: "visemes", part: f.part, playAt, reqId, text: f.text,
    visemes: f.v.map(([ms, id]) => ({ ms, id })),
    words: f.w?.map(([ms, durMs, text]) => ({ ms, durMs, text })),
  });
}

/** Her playback stopped or paused: the mouth closes now (a resume re-sends what is left with the new timing). */
export function puppetCut(): void {
  puppetBus.emit({ kind: "cut", at: performance.now() });
}
