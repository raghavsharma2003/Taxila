// A16 (q only; added by the signals build): an ASR-independent speaking-rate proxy — syllable nuclei per second of speech,
// counted as voiced energy peaks (after de Jong & Wempe 2009, Praat syllable nuclei: intensity peaks that are voiced and
// stand out from their surroundings). The server divides the ASR's words/s by it: a ratio far outside what words and
// syllables allow is a likely mishearing (the live lane has no ASR confidence, SIGNALS-SPEC §2.6). Never a state.
import { HOP_MS, type Frame } from "../voice/dsp.ts";
import { region } from "./frames.ts";

/** Minimum peak prominence above the deepest dip on either side (dB) and minimum spacing between nuclei (ms). [U] */
export const NUCLEUS_PROMINENCE_DB = 2;
export const NUCLEUS_MIN_GAP_MS = 100;

/** Voiced energy peaks per second of speech frames; undefined below 300 ms of speech. */
export function nucleiPerSec(frames: Frame[], hopMs = HOP_MS): number | undefined {
  const r = region(frames, hopMs);
  if (!r) return undefined;
  const speechFrames = r.filter((f) => f.speech).length;
  const speechSec = (speechFrames * hopMs) / 1000;
  if (speechSec < 0.3) return undefined;
  // 3-frame moving average of rmsDb (60 ms) suppresses frame jitter without merging syllables (≥ 120 ms apart).
  const db = r.map((_, i) => {
    let s = 0, n = 0;
    for (let k = Math.max(0, i - 1); k <= Math.min(r.length - 1, i + 1); k++) { s += r[k].rmsDb; n++; }
    return s / n;
  });
  const win = Math.max(2, Math.round(NUCLEUS_MIN_GAP_MS / hopMs));
  const gap = Math.ceil(NUCLEUS_MIN_GAP_MS / hopMs);
  let count = 0, last = -Infinity;
  for (let i = 1; i < r.length - 1; i++) {
    if (!r[i].speech || r[i].f0 == null) continue;
    if (!(db[i] >= db[i - 1] && db[i] > db[i + 1])) continue;
    let leftMin = db[i], rightMin = db[i];
    for (let k = i - 1; k >= Math.max(0, i - win * 2); k--) { leftMin = Math.min(leftMin, db[k]); if (db[k] > db[i]) break; }
    for (let k = i + 1; k <= Math.min(r.length - 1, i + win * 2); k++) { rightMin = Math.min(rightMin, db[k]); if (db[k] > db[i]) break; }
    const prom = db[i] - Math.max(leftMin, rightMin);
    if (prom < NUCLEUS_PROMINENCE_DB || i - last < gap) continue;
    count++;
    last = i;
  }
  return count / speechSec;
}
