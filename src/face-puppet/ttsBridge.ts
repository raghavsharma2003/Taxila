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

/**
 * performance.now() ms at which this part's first synthesised sample sounds, from the player's anchor: reply sample
 * `fromSample` is scheduled at AudioContext time `startAt`. Output latency (the device buffer between scheduling and the
 * speaker) is added: the face must move with the sound the child HEARS (measured scheduling error on Chromium with it:
 * median +5.7 ms, p95 +9.7 ms, evals/face-puppet/out/lipsync-inapp.json).
 */
export function visemePlayAt(f: Pick<TtsVisemeFrame, "atSample" | "leadMs">, fromSample: number, startAt: number, ctx: Pick<BaseAudioContext, "currentTime"> & { outputLatency?: number; baseLatency?: number }, nowMs = performance.now()): number {
  const outLat = (ctx.outputLatency || ctx.baseLatency || 0) * 1000;
  return nowMs + (startAt - ctx.currentTime) * 1000 + ((f.atSample - fromSample) / PCM_RATE) * 1000 + outLat - (f.leadMs ?? 0);
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
