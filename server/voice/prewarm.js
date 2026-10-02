// Cascade lane: the teacher's reply starts speaking on the SERVER the moment the Director has guarded it, not
// after the client has read the /turn response and asked /api/voice/tts-stream for it. /turn calls prewarm()
// with the final, guarded text (every byte guard — answer leak, drift, script, length — has already run on it:
// nothing unguarded is ever sent to the speech model), concurrently with the turn's transaction; tts-stream
// then takes the in-flight sentences instead of starting them, and skips its own database read.
//
// Measured why (evals/cascade-latency.mjs, 2026-10-02): the turn's transaction (60-400 ms to Neon from the
// sandbox), the client round trip and tts-stream's one auth+turn query (50-490 ms) all sat in series before
// the speech model was even asked; its first byte is ~260-420 ms.
//
// Rules:
// - Only what /turn itself stored is prewarmed, keyed by (lesson, seq) and bound to the session token hash
//   /turn authenticated (loadTurnContext checked it seconds earlier): tts-stream hands the audio only to the
//   same session, and anything else falls back to the full checks. Per process: another replica just misses.
// - A turn whose transaction fails (409, a lost race) drops its entry; nothing is spoken for an unstored line.
// - An entry nobody takes within TTL_MS is aborted (the client went away, a barge-in), so it cannot pile up.
// TAXILA_TTS_PREWARM=0 turns it off (tts-stream then behaves exactly as before).
import { speakChunk } from "./speech.js";
import { splitSentences } from "./sentences.js";

export const TTL_MS = 30_000;
/** Sentences started at once: the first, and the one after it (tts-stream's LOOKAHEAD). */
export const LOOKAHEAD = 1;
const MAX_ENTRIES = 500;
const entries = new Map(); // `${lessonId}:${seq}` → entry

export const prewarmEnabled = () => process.env.TAXILA_TTS_PREWARM !== "0";
const keyOf = (lessonId, seq) => `${lessonId}:${seq}`;

/**
 * Start speaking a stored-to-be teacher turn. `style` is speechStyle()'s result for the lesson's teacher.
 * @returns {boolean} whether an entry was created
 */
export function prewarm({ lessonId, seq, text, tokenHash, guardianId, style }) {
  if (!prewarmEnabled() || !tokenHash || !text?.trim()) return false;
  const key = keyOf(lessonId, seq);
  drop(lessonId, seq);
  while (entries.size >= MAX_ENTRIES) dropKey(entries.keys().next().value);
  const parts = splitSentences(text);
  if (!parts.length) return false;
  const abort = new AbortController();
  const jobs = [];
  const entry = {
    lessonId, seq, text: text.trim(), tokenHash, guardianId, style, parts, jobs, abort, at: performance.now(),
    startUpTo(i) { while (jobs.length <= Math.min(i, parts.length - 1)) jobs.push(speakChunk(parts[jobs.length], style, abort.signal)); },
    timer: setTimeout(() => dropKey(key), TTL_MS),
  };
  entry.timer.unref?.();
  entry.startUpTo(LOOKAHEAD);
  entries.set(key, entry);
  return true;
}

/** The prewarmed entry for (lesson, seq) if the SAME session asks for it (removed from the map), else null. */
export function take(lessonId, seq, tokenHash) {
  const key = keyOf(lessonId, seq);
  const e = entries.get(key);
  if (!e || !tokenHash || e.tokenHash !== tokenHash) return null;
  entries.delete(key);
  clearTimeout(e.timer);
  return e;
}

/** Abort and forget (lesson, seq): its turn was not stored. */
export function drop(lessonId, seq) { dropKey(keyOf(lessonId, seq)); }
function dropKey(key) {
  const e = entries.get(key);
  if (!e) return;
  entries.delete(key);
  clearTimeout(e.timer);
  e.abort.abort();
}

/** Tests only. */
export const __test = { entries, clear: () => { for (const k of [...entries.keys()]) dropKey(k); } };
