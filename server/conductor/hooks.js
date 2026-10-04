// Conductor hooks into the lesson and consent writes (BUILD-PLAN §2, W1 seam commit). OWNED BY W1-D.
//
// Each hook is PURE and SYNCHRONOUS: it returns the statements ({ text, params }) to append to the caller's EXISTING
// transaction, so a Conductor event (ingestStmt, server/conductor/index.js) lands atomically with the lesson row, the
// turn or the consent row that caused it — or not at all. The W0 seam commit placed the call sites; every hook returns
// [] until W1-D fills it, so the seam commit changed no behaviour. Contract for the filler:
//   - return only statements that are safe to run inside the caller's transaction (no network, no await);
//   - each appended statement goes AFTER the caller's own statements, and the caller's row-count checks ignore them;
//   - never throw for a child with no conductor_state (the caller's lesson must still land);
//   - an inline step() or kick() belongs AFTER commit, never inside these hooks.

/** @typedef {{ text: string, params?: unknown[] }} Stmt */
/** @typedef {{ id: string, class_level?: number, legal_mode?: string }} HookChild */

/**
 * A lesson row is created (POST /api/lesson/start, inside the lesson-insert transaction).
 * @param {{ child: HookChild, lessonId: string, topicId: string, purpose: "lesson"|"practice"|"doubt", mode: "voice"|"text"|"cascade", now: number }} _e
 * @returns {Stmt[]}
 */
export function onLessonStart(_e) { return []; }

/**
 * A turn committed (POST /api/lesson/turn, inside runTurnTx after the guard, turns, incidents and learner writes).
 * `late`: the answer came in after a page-hide close.
 * @param {{ child: HookChild, lessonId: string, turn: number, move: string, end: boolean, late: boolean, now: number }} _e
 * @returns {Stmt[]}
 */
export function onTurnCommit(_e) { return []; }

/**
 * A lesson ended (POST /api/lesson/end, inside the summary/parent-note/memory transaction, after the end claim).
 * @param {{ child: HookChild, lessonId: string, topicId: string, endedBy: "pagehide"|"client", turns: number, startedAt: string|Date|null, now: number }} _e
 * @returns {Stmt[]}
 */
export function onLessonEnd(_e) { return []; }

/**
 * Consent rows were written (POST consent, server/routes/account.js setConsent). childId null = guardian-wide.
 * The caller runs the returned statements in one transaction right after the consent rows (setConsent writes its
 * rows one statement at a time today; W1-D may fold them into one transaction with these).
 * @param {{ guardianId: string, childId: string|null, grants: Record<string, boolean>, version: string, now: number }} _e
 * @returns {Stmt[]}
 */
export function onConsentChange(_e) { return []; }
