// A2 onsetContentMs (SIGNALS-SPEC §2.2): the onset to the first CONTENT syllable. A1 (onsetMs) starts the clock at the
// first speech frame, so an "ummm…" that opens the answer reads as a fast onset; A2 adds the leading filled segment: the
// leading voiced runs that are long and flat (A7's definition, ≥ 300 ms and < 1 semitone p10-p90) plus the silence
// after each, up to the first non-flat voiced run. Pure; reads the dsp.ts frame track.
import { FLAT_RUN_MS, FLAT_RUN_ST, HOP_MS, type Frame } from "../voice/dsp.ts";
import { region, runSemitones, spreadSt, voicedRuns } from "./frames.ts";

/** Milliseconds of leading filled (flat voiced) speech before the first content syllable; 0 when the answer opens on content. */
export function leadingFilledMs(frames: Frame[], hopMs = HOP_MS): number {
  const r = region(frames, hopMs);
  if (!r) return 0;
  const runs = voicedRuns(r, 60, hopMs);
  if (!runs.length) return 0;
  const need = Math.ceil(FLAT_RUN_MS / hopMs);
  let leadEnd = -1;
  for (const run of runs) {
    const long = run[1] - run[0] + 1 >= need;
    const flat = long && spreadSt(runSemitones(r, run)) < FLAT_RUN_ST;
    if (!flat) return leadEnd < 0 ? 0 : run[0] * hopMs;            // region index 0 = speech start
    leadEnd = run[1];
  }
  // Every voiced run was flat: the whole turn was a filled pause.
  return r.length * hopMs;
}

/** A2 = A1 + the leading filled segment, capped at onset + duration. undefined without an onset (barge-in, no teacher end). */
export function onsetContentMs(onsetMs: number | undefined, frames: Frame[], durationMs: number, hopMs = HOP_MS): number | undefined {
  if (onsetMs == null || !Number.isFinite(onsetMs)) return undefined;
  const lead = leadingFilledMs(frames, hopMs);
  return Math.round(Math.min(onsetMs + lead, onsetMs + durationMs));
}
