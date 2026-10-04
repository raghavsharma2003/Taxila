// Conductor hooks into the lesson and consent writes (BUILD-PLAN §2 seam, filled by W1-D §3 item 4). OWNED BY W1-D.
//
// Each hook is PURE and SYNCHRONOUS: it returns the statements ({ text, params }) to append to the caller's EXISTING
// transaction, so a Conductor event (ingestStmt, server/conductor/index.js) lands atomically with the lesson row, the
// lesson's end record or the consent row that caused it, or not at all (X29: the ingest locks child_seq LAST, after the
// caller's own rows, which is the global lock order). Contract:
//   - return only statements that are safe to run inside the caller's transaction (no network, no await);
//   - each appended statement goes AFTER the caller's own statements, and the caller's row-count checks ignore them;
//   - never throw: a bad id or an unknown purpose logs and returns [] (the child's lesson must still land);
//   - the inline step() runs AFTER commit, never inside a hook: scheduleKick() defers one kick() past the caller's
//     commit (a timer, so it carries the request's AsyncLocalStorage, i.e. a test account's shifted clock). A kick that
//     beats the commit finds nothing to fold and returns; the worker's dirty-set loop folds within ~2 s either way.
//     lesson.js is a hot file (W1-A), so the post-commit call site is this timer rather than a line after the tx.
import { ingestStmt, kick } from "./index.js";
import { PURPOSES } from "./events.js";
import { ulid } from "./ids.js";
import { learningDay } from "./clock.js";
import { ROUTINE_DEFAULT } from "./config.js";

/** @typedef {{ text: string, params?: unknown[] }} Stmt */
/** @typedef {{ id: string, class_level?: number, legal_mode?: string }} HookChild */

/** lesson start purpose → lesson.started kind (events.js). A doubt ("Ask") is homework help. */
const KIND_OF = { lesson: "live", practice: "practice", doubt: "homework" };
/** lesson mode → the voice lane it holds (text = typed, the cheapest lane: "tap"). */
const LANE_OF = { voice: "realtime", cascade: "cascade", text: "tap" };
/** lesson end trigger → lesson.ended reason: a page-hide close is a child who left; a client end is a finished lesson. */
const REASON_OF = { pagehide: "child_left", client: "completed" };

const iso = (now) => new Date(typeof now === "number" ? now : now instanceof Date ? now.getTime() : Date.now()).toISOString();

/**
 * Inline step after commit (conductor-hosting-lanes: "one inline step() after each ingest"). On by default in
 * production (NODE_ENV=production, i.e. the taxila-web image); CONDUCTOR_INLINE=on|off overrides. Off elsewhere so a
 * unit test that runs a route against a fake database never opens a Conductor pool.
 */
const KICK_DELAY_MS = Number(process.env.CONDUCTOR_KICK_DELAY_MS || 400);
export const inlineEnabled = () => (process.env.CONDUCTOR_INLINE ? process.env.CONDUCTOR_INLINE === "on" : process.env.NODE_ENV === "production");
export function scheduleKick(childId) {
  if (!inlineEnabled() || !childId) return;
  const t = setTimeout(() => { kick(childId).catch(() => {}); }, KICK_DELAY_MS);
  t.unref?.();
}

/** ingestStmt that never throws (logs the refusal instead): a hook must not break the write it rides on. */
function safeIngest(childId, event, opts = {}) {
  if (!childId) { console.warn(`[conductor] hook ${event.type} not ingested: no child id`); return []; }
  try {
    const { text, params } = ingestStmt(childId, event, opts);
    return [{ text, params }];
  } catch (e) {
    console.warn(`[conductor] hook ${event.type} not ingested for ${String(childId).slice(0, 8)}: ${String(e?.message ?? e).slice(0, 200)}`);
    return [];
  }
}

/**
 * A lesson row is created (POST /api/lesson/start, inside the lesson-insert transaction) → app.opened (once per
 * learning day) + lesson.started.
 *
 * Why app.opened here: nothing in the product calls planToday() yet (the home screen reads day_plan but never opens
 * the actor; server/routes/child.js is outside W1-D's paths, open item `home-calls-plan-today`). Without an
 * app.opened the actor never arms its day_start / night wakeups (decide.js "app.opened" → armAhead), so no night fold,
 * no report.daily, no letter. A lesson start is proof the app was open; the key `app.opened:lesson:d<day>` makes it
 * once per learning day (IST default; the fold uses the child's own tz), and a real planToday() later is a distinct key.
 * @param {{ child: HookChild, lessonId: string, topicId: string, purpose: "lesson"|"practice"|"doubt", mode: "voice"|"text"|"cascade", now: number }} e
 * @returns {Stmt[]}
 */
export function onLessonStart(e) {
  const at = iso(e.now);
  const day = learningDay(new Date(at), ROUTINE_DEFAULT.tz);
  const out = [
    ...safeIngest(e.child?.id, { type: "app.opened", device: "web", replicaId: "lesson", bootId: `d${day}` }, { occurredAt: at }),
    ...safeIngest(e.child?.id, { type: "lesson.started", lessonId: e.lessonId, topicId: e.topicId,
      kind: KIND_OF[e.purpose] ?? "live", lanes: [LANE_OF[e.mode] ?? "tap"] }, { occurredAt: at }),
  ];
  if (out.length) scheduleKick(e.child?.id);
  return out;
}

/**
 * A turn committed (POST /api/lesson/turn, inside runTurnTx). No event: the catalogue carries the Director's BOUNDARY
 * facts only (CONDUCTOR.md §2.2, "Director (boundary facts only)"); a per-turn event would add a child_seq lock and a
 * fold to every turn for nothing the day plan reads. The lesson's end (onLessonEnd), or the clock's stale-lesson close
 * (decide.js LESSON_STALE_MS) when the client vanished, is what the Conductor folds.
 * @param {{ child: HookChild, lessonId: string, turn: number, move: string, end: boolean, late: boolean, now: number }} _e
 * @returns {Stmt[]}
 */
export function onTurnCommit(_e) { return []; }

/**
 * A lesson ended (POST /api/lesson/end, inside the summary/parent-note/memory transaction) → lesson.ended. minutes > 0
 * marks the learning day active, which is what makes the night fold ask for that day's report.daily.
 * @param {{ child: HookChild, lessonId: string, topicId: string, endedBy: "pagehide"|"client", turns: number, startedAt: string|Date|null, now: number }} e
 * @returns {Stmt[]}
 */
export function onLessonEnd(e) {
  const end = typeof e.now === "number" ? e.now : Date.now();
  const start = e.startedAt ? new Date(e.startedAt).getTime() : NaN;
  const minutes = Number.isFinite(start) ? Math.min(240, Math.max(0, Math.round(((end - start) / 60_000) * 10) / 10)) : 0;
  const out = safeIngest(e.child?.id, { type: "lesson.ended", lessonId: e.lessonId, reason: REASON_OF[e.endedBy] ?? "completed",
    // a lesson with turns counts as at least a tenth of a minute (a fast test lesson is still an active day)
    minutes: e.turns > 0 ? Math.max(0.1, minutes) : minutes }, { occurredAt: iso(end) });
  if (out.length) scheduleKick(e.child?.id);
  return out;
}

/**
 * Consent rows were written (POST /api/consent, account.js setConsent) → parent.consent_changed per Conductor purpose.
 * consentVersion is a ULID minted for THIS write (index.js call-site note): the consent version string is the same for
 * every write, so a revoke → grant → revoke must not dedupe its second revoke. childId null (guardian-wide) emits
 * nothing here: one statement would lock several children's child_seq rows (X29 allows only fire_wakeups that), and
 * syncParentFacts, run by every planToday, ingests the missing fact keyed by the consent row before any plan is read.
 * @param {{ guardianId: string, childId: string|null, grants: Record<string, boolean>, version: string, now: number }} e
 * @returns {Stmt[]}
 */
export function onConsentChange(e) {
  if (!e.childId) return [];
  const write = ulid(typeof e.now === "number" ? e.now : Date.now());
  const out = Object.entries(e.grants ?? {}).filter(([p]) => PURPOSES.includes(p))
    .flatMap(([purpose, granted]) => safeIngest(e.childId, { type: "parent.consent_changed", purpose, granted: !!granted, consentVersion: `w${write}` },
      { occurredAt: iso(e.now) }));
  if (out.length) scheduleKick(e.childId);
  return out;
}
