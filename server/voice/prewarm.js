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
//
// HUMAN-VOICE B5 (W2-G): /turn passes the DeliveryPlan the expressive seam made from the Brain's Moment. The plan is
// governed and compiled HERE (render.js), where the lesson and the voice are known; each part carries its render
// (DragonHD SSML, or gpt-4o-mini-tts text + instructions), the exact pause before it, and the index of its first
// clause (the clause events of framed TTS v2). `parts` stays the WRITTEN sentences (captions, tests); `renders`,
// `pauses` and `clauses` run beside it. The plan is also remembered per (lesson, seq) for 10 minutes whether or not
// prewarm is on, so the text lane's "Hear" and a tts-stream that missed the prewarm speak the same delivery.
import { speakChunk } from "./speech.js";
import { renderParts } from "./expressive/render.js";

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
export function prewarm({ lessonId, seq, text, tokenHash, guardianId, style, delivery }) {
  if (delivery?.clauses?.length && text?.trim()) rememberDelivery(lessonId, seq, delivery);
  if (!prewarmEnabled() || !tokenHash || !text?.trim()) return false;
  const key = keyOf(lessonId, seq);
  drop(lessonId, seq);
  while (entries.size >= MAX_ENTRIES) dropKey(entries.keys().next().value);
  const r = renderParts({ lessonId, seq, text: text.trim(), style, delivery });
  if (!r.parts.length) return false;
  if (r.plan) rememberDelivery(lessonId, seq, r.plan, true);
  const abort = new AbortController();
  const entry = speakingEntry({ parts: r.parts, prelude: r.prelude, style, abort });
  Object.assign(entry, { lessonId, seq, text: text.trim(), tokenHash, guardianId, style, plan: r.plan, at: performance.now(), timer: setTimeout(() => dropKey(key), TTL_MS) });
  entry.timer.unref?.();
  entry.startUpTo(LOOKAHEAD);
  entries.set(key, entry);
  return true;
}

/**
 * The speaking machinery for rendered parts (shared by prewarm and the tts-stream / turn-audio paths that did not get a
 * prewarm): { parts (written), renders, pauses, clauses, jobs, startUpTo(i), prelude? }. A prelude job starts at once.
 * @param {{ parts: import("./expressive/render.js").Part[], prelude?: import("./expressive/render.js").Part | null, style: any, abort: AbortController }} x
 */
export function speakingEntry({ parts, prelude, style, abort }) {
  const written = parts.map((p) => p.written);
  const renders = parts.map((p) => p.render);
  const jobs = [];
  return {
    parts: written, renders, pauses: parts.map((p) => p.pauseBeforeMs), clauses: parts.map((p, i) => p.clause ?? i), jobs, abort,
    prelude: prelude ? speakChunk(prelude.written, style, abort.signal, prelude.render) : null,
    startUpTo(i) { while (jobs.length <= Math.min(i, written.length - 1)) jobs.push(speakChunk(written[jobs.length], style, abort.signal, renders[jobs.length])); },
  };
}

// ───────────── the plan per (lesson, seq), for "Hear" and a missed prewarm ─────────────
const DELIVERY_TTL_MS = 10 * 60_000, MAX_DELIVERIES = 2000;
const deliveries = new Map(); // key → { plan, at }
function rememberDelivery(lessonId, seq, plan, governed = false) {
  const key = keyOf(lessonId, seq);
  deliveries.delete(key);
  deliveries.set(key, { plan, governed, at: Date.now() });
  while (deliveries.size > MAX_DELIVERIES) deliveries.delete(deliveries.keys().next().value);
}
/**
 * The DeliveryPlan /turn made for (lesson, seq) in this process, or null (another replica, expired, or none made).
 * `governed` = the governor already ran on it (render it with PASSTHROUGH so the turn is not counted twice).
 * @returns {{ plan: any, governed: boolean } | null}
 */
export function deliveryFor(lessonId, seq) {
  const d = deliveries.get(keyOf(lessonId, seq));
  if (!d || Date.now() - d.at > DELIVERY_TTL_MS) return null;
  return { plan: d.plan, governed: d.governed };
}
/** A governor that changes nothing (a plan the process governor already applied). */
export const PASSTHROUGH = { apply: (_id, plan) => plan };

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
export const __test = { entries, deliveries, clear: () => { for (const k of [...entries.keys()]) dropKey(k); deliveries.clear(); } };
