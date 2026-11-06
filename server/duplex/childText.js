// Round 7, stream B Voice → C1 Studio (M4 speculative build policy): the child's words, in-process, as they arrive.
//
//   onChildText(lessonId, fn) → unsubscribe
//   fn({ lessonId, itemId, seq, text, final, t, at })
//     text   the CUMULATIVE text of the child's current turn, already echo-filtered (her own voice is never in it)
//     final  false for a live partial (D4's deltas, or D5 with a delta-streaming ear), true for the turn's words as sent
//     t      the session clock of the device (ms) when known, else null; at = Date.now() on this server
//     seq    increases per lesson, across partials and finals (a listener can drop anything older than what it has seen)
//
// Sources: POST /api/duplex/child-text (the device posts its partials only with TAXILA_DUPLEX_PARTIAL_POST=on: /api/duplex/config
// tells it) and the turn routes (/api/lesson/turn-audio here; /api/lesson/turn through docs/patches/to-brain), which emit
// the final for EVERY turn, so a listener has one source on every lane (D5's default ear gives one final per turn).
// Safety by predicate: text the shipped scanSafety reads as distress is never handed to a listener (nothing is built from a
// disclosure); the turn route's own safeguarding is unchanged. A listener's error never reaches the lesson.
import { scanSafety } from "../director/safety.js";

/** @type {Map<string, Set<(ev: object) => void>>} */
const subs = new Map();
/** @type {Map<string, number>} */
const seqs = new Map();
const MAX_TEXT = 2000;

/** Subscribe to one lesson's child text. Returns the unsubscribe. */
export function onChildText(lessonId, fn) {
  const id = String(lessonId);
  let set = subs.get(id);
  if (!set) subs.set(id, (set = new Set()));
  set.add(fn);
  return () => {
    set.delete(fn);
    if (!set.size) { subs.delete(id); seqs.delete(id); }
  };
}

/** Does anyone listen to this lesson? (the emitters skip the work when not) */
export const hasChildTextListener = (lessonId) => !!subs.get(String(lessonId))?.size;

/**
 * Hand one piece of child text to the lesson's listeners. Returns the event, or null when nobody listens, the text is
 * empty, or the safety predicate reads distress in it.
 */
export function emitChildText({ lessonId, itemId = null, text, final = false, t = null }) {
  const id = String(lessonId ?? "");
  const set = subs.get(id);
  if (!set?.size) return null;
  const words = String(text ?? "").trim().slice(0, MAX_TEXT);
  if (!words) return null;
  if (scanSafety(words).distress) return null;
  const seq = (seqs.get(id) ?? 0) + 1;
  seqs.set(id, seq);
  const ev = Object.freeze({ lessonId: id, itemId: itemId == null ? null : String(itemId), seq, text: words, final: !!final, t: Number.isFinite(t) ? t : null, at: Date.now() });
  for (const fn of [...set]) {
    try { fn(ev); } catch { /* a listener's bug never reaches the lesson */ }
  }
  return ev;
}

/** The server's switch for device partial posts (default off: only D4 has partials, and each post is a request). */
export const partialPostOn = (env = process.env) => String(env.TAXILA_DUPLEX_PARTIAL_POST ?? "").trim().toLowerCase() === "on";

/** The device posts no faster than this per lesson; a faster post is answered and dropped (the next one carries the text). */
export const CHILD_TEXT_MIN_MS = 300;
const lastPost = new Map();

/**
 * POST /api/duplex/child-text { lessonId, itemId, text, t }: one live partial from the device (D4's deltas, already
 * echo-filtered there: cascadeDuplex's child_partial). Nobody listening → 204 at once, no database read. Otherwise the
 * lesson must be the caller's own child's and not ended. The answer is always empty: the device never waits on it.
 */
export async function childTextRoute(req, body, { lookupLesson, child, now = Date.now } = {}) {
  const lessonId = String(body?.lessonId ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(lessonId) || !hasChildTextListener(lessonId)) return 204;
  const t0 = now();
  if (t0 - (lastPost.get(lessonId) ?? -Infinity) < CHILD_TEXT_MIN_MS) return 204;
  lastPost.set(lessonId, t0);
  if (lastPost.size > 2000) lastPost.delete(lastPost.keys().next().value);
  const lesson = await (lookupLesson ?? (async (id) => (await import("../db.js")).one("select id, child_id, ended_at from lesson where id = $1", [id])))(lessonId);
  if (!lesson || lesson.ended_at) return 204;
  await (child ?? (await import("../auth.js")).requireChild)(req, lesson.child_id); // throws 401/403 for anyone else's
  emitChildText({ lessonId, itemId: body?.itemId ?? null, text: body?.text, final: false, t: Number(body?.t) });
  return 204;
}

/** Tests. */
export function _resetChildText() { subs.clear(); seqs.clear(); lastPost.clear(); }
