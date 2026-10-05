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

interface Part { part: number; playAt: number; end: number; track: TimedViseme[]; cursor: number; rawV: VisemeEvent[]; rawW: WordEvent[]; text?: string }

export class VisemeScheduler {
  private parts: Part[] = [];
  lead = EVENT_LEAD_MS;
  /** Events received / parts dropped as stale (for the stage stats). */
  received = 0;
  stale = 0;

  push(part: number, playAt: number, visemes: readonly VisemeEvent[], words: readonly WordEvent[] = [], nowMs = performance.now(), text?: string): void {
    if (!visemes.length) return;
    // a part's events stream in as Azure synthesises it: later batches for the same part MERGE (deduped by offset)
    const same = this.parts.find((p) => p.part === part && Math.abs(p.playAt - playAt) < 5);
    const rawV = same ? [...same.rawV, ...visemes] : [...visemes];
    const rawW = same ? [...same.rawW, ...words] : [...words];
    rawV.sort((a, b) => a.ms - b.ms);
    const dv = rawV.filter((v, i) => i === 0 || v.ms !== rawV[i - 1].ms || v.id !== rawV[i - 1].id);
    const track = resolveVisemes(dv, rawW, text ?? same?.text);
    const end = playAt + track[track.length - 1].ms + 200;
    if (end < nowMs) { this.stale++; return; } // the part already finished sounding (a late event): never replay it
    this.received++;
    if (same) Object.assign(same, { end, track, rawV: dv, rawW, text: text ?? same.text });
    else this.parts.push({ part, playAt, end, track, cursor: 0, rawV: dv, rawW, text });
    this.parts.sort((a, b) => a.playAt - b.playAt);
  }

  /** Her audio stopped (barge-in yield, a cut reply): drop everything that would still move the mouth. */
  cut(): void {
    this.parts = [];
  }

  /**
   * Fill `out` with the viseme + tongue weights (and a viseme-derived jawOpen) at `nowMs`. Returns false when no part is
   * sounding (out is then empty), so the caller falls back to the audio lip driver.
   */
  at(nowMs: number, out: Record<string, number>): boolean {
    while (this.parts.length && this.parts[0].end < nowMs) this.parts.shift();
    const p = this.parts.find((x) => nowMs >= x.playAt - 80 && nowMs <= x.end);
    if (!p) { for (const k in out) delete out[k]; return false; }
    const ms = nowMs - p.playAt + this.lead;
    p.cursor = weightsAt(p.track, ms, out, 0);
    return true;
  }

  get active(): number {
    return this.parts.length;
  }
}
