// Viseme scheduling on the player's clock. Each TTS part arrives with `playAt` (performance.now() ms of its first
// sample, from the PCM player) and its Azure viseme + word events (ms from that sample). At render time the driver asks
// for the mouth weights at now: the part that is sounding is found and sampled with the judged coarticulation
// (visemes.ts weightsAt). Pure apart from the clock value passed in; no DOM.
//
// Timing correction: Diya's DragonHD viseme offsets run LATE against her own audio by a measured, stable amount
// (evals/face-puppet/lipsync-offset.mjs, 24 lines; see EVENT_LEAD_MS). The face is shifted earlier by that amount, so the
// mouth leads or meets the sound (people tolerate a late sound far better than a late mouth: ITU-R BT.1359 detectability
// is about 45 ms of sound-first vs 125 ms of sound-late).
import { resolveVisemes, weightsAt, type TimedViseme } from "./visemes.ts";
import type { VisemeEvent, WordEvent } from "./bus.ts";

/**
 * ms subtracted from every Azure viseme offset before display. Measured 2026-10-05 on Diya DragonHD @ -35 %: her viseme
 * track sits a median 50 ms (IQR 45-65, range 25-105, n = 21 Roman lines) LATER than a wav2vec2 forced alignment of the
 * very same audio scored by the same estimator (evals/face-puppet/lipsync-offset.mjs E3), while her word boundaries sit
 * on the alignment (median +6 ms, n = 285 words). The forced-alignment timing is the one the judged clips (r7 4.0, r8
 * 4.1) were driven by, so the shift makes the in-app mouth match the judged one. docs/design/values/v4/REPORT.md §2.
 */
export const EVENT_LEAD_MS = 50;

interface Part { part: number; reqId?: string; playAt: number; end: number; track: TimedViseme[]; cursor: number; rawV: VisemeEvent[]; rawW: WordEvent[]; text?: string }

/** Batches of one part whose playAt differ by less than this are the SAME timeline (the player's clock conversion jitters by
 *  a few ms per batch; on the product path batches of one part were measured 0.1-8 ms apart, ship5 p2-face). A real
 *  re-anchor (an underrun gap, a resume) is announced by a cut first, which clears the parts. */
export const MERGE_TOLERANCE_MS = 40;

export class VisemeScheduler {
  private parts: Part[] = [];
  /** Word batches that arrived before any viseme of their part (merged when the visemes come). */
  private orphanWords = new Map<string, WordEvent[]>();
  lead = EVENT_LEAD_MS;
  /** Events received / parts dropped as stale (for the stage stats). */
  received = 0;
  stale = 0;

  push(part: number, playAt: number, visemes: readonly VisemeEvent[], words: readonly WordEvent[] = [], nowMs = performance.now(), text?: string, reqId?: string): void {
    // a part's events stream in as Azure synthesises it: later batches for the same part MERGE (deduped by offset) onto the
    // FIRST batch's timeline. Ship5 p2-face, measured on the product path: keyed on playAt alone (|d| < 5 ms), one part's
    // 9 batches split into 4-6 separate tracks, and each track's 200 ms tail hid the next batch's first visemes.
    const same = this.parts.find((p) => p.part === part && p.reqId === reqId && Math.abs(p.playAt - playAt) < MERGE_TOLERANCE_MS);
    const key = `${reqId ?? ""}|${part}`;
    if (!visemes.length) {
      // a words-only batch (Azure sends word boundaries in their own metadata messages): merge, never drop
      if (!words.length) return;
      if (!same) { this.orphanWords.set(key, [...(this.orphanWords.get(key) ?? []), ...words]); return; }
    }
    const orphans = this.orphanWords.get(key);
    if (orphans) this.orphanWords.delete(key);
    const rawV = same ? [...same.rawV, ...visemes] : [...visemes];
    const rawW = [...(same ? same.rawW : []), ...(orphans ?? []), ...words];
    rawV.sort((a, b) => a.ms - b.ms);
    rawW.sort((a, b) => a.ms - b.ms);
    const dv = rawV.filter((v, i) => i === 0 || v.ms !== rawV[i - 1].ms || v.id !== rawV[i - 1].id);
    const dw = rawW.filter((w, i) => i === 0 || w.ms !== rawW[i - 1].ms);
    const at = same ? same.playAt : playAt;
    const track = resolveVisemes(dv, dw, text ?? same?.text);
    const end = at + track[track.length - 1].ms + 200;
    if (end < nowMs) { this.stale++; return; } // the part already finished sounding (a late event): never replay it
    this.received++;
    if (same) Object.assign(same, { end, track, rawV: dv, rawW: dw, text: text ?? same.text });
    else this.parts.push({ part, reqId, playAt: at, end, track, cursor: 0, rawV: dv, rawW: dw, text });
    this.parts.sort((a, b) => a.playAt - b.playAt);
  }

  /** Her audio stopped (barge-in yield, a cut reply): drop everything that would still move the mouth. */
  cut(): void {
    this.parts = [];
    this.orphanWords.clear();
  }

  /**
   * Fill `out` with the viseme + tongue weights (and a viseme-derived jawOpen) at `nowMs`. Returns false when no part is
   * sounding (out is then empty), so the caller falls back to the audio lip driver.
   */
  at(nowMs: number, out: Record<string, number>): boolean {
    while (this.parts.length && this.parts[0].end < nowMs) this.parts.shift();
    // the LATEST part that has begun (its 80 ms lead-in included): a part's 200 ms closing tail never hides the next part's
    // opening viseme when the pause between them is short
    let p: Part | undefined;
    for (const x of this.parts) if (nowMs >= x.playAt - 80 && nowMs <= x.end) p = x;
    if (!p) { for (const k in out) delete out[k]; return false; }
    const ms = nowMs - p.playAt + this.lead;
    p.cursor = weightsAt(p.track, ms, out, 0);
    return true;
  }

  get active(): number {
    return this.parts.length;
  }
}
