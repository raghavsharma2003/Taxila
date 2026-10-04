// The session relational state (RELATIONAL-OS §4.2, R1; BUILD-PLAN W2-I #2). PURE fold, in memory, dies with the lesson
// (every legal mode): evidence COUNTS, never an emotion label, never persisted (NM-3). Child-affect ruptures and the
// safe-to-be-wrong reading live here and only here.

const WIN = 6;

/** @returns {import("../../shared/relational").RelSession} */
export function initRelSession() {
  return {
    turn: 0, safeToBeWrong: 0.5,
    climate: { uptakeMisses: 0, withdrawalTurns: 0, selfLabels: 0, contests: 0, warmthOffers: 0, permanenceAsks: 0, secretAsks: 0, contactAsks: 0,
      romance: 0, sharesOpen: 0, tiredSays: 0, stopAsks: 0, nightAsks: 0, lonelySays: 0 },
    childRupture: null, teacherEvents: [], affectTrail: [], callbackUsed: null, noticesUsed: [], jokes: [], inSessionFacts: [],
    overlayMoves: { pointOut: false, callbacksOff: false, reminderDue: false },
    lastStopAsk: null, distressAt: null, checkInAt: null, releasedAt: null, outcomes: [], words: [],
    lastPraiseAt: null, playfulCount: 0, lastErrorAt: null, notes: [], events: [],
  };
}

const NOT_YET = new Set(["incorrect", "misconception", "partial", "dont_know", "idk"]);
const ATTEMPT = new Set(["correct", "incorrect", "misconception", "partial"]);
export const isNotYet = (o) => NOT_YET.has(String(o));
export const isAttempt = (o) => ATTEMPT.has(String(o));

/** The child's median words per turn this session (the withdrawal yardstick); null before 3 turns. */
export function medianWords(words) {
  if ((words?.length ?? 0) < 3) return null;
  const w = [...words].sort((a, b) => a - b);
  return w[Math.floor(w.length / 2)];
}

/**
 * Two consecutive short non-answers (≤ ⅓ of the child's session median words) after at least 4 turns: a withdrawal
 * candidate (gentle concern; a child-affect rupture is only ever a session reading).
 */
export function withdrawing(session, words, outcome) {
  const med = medianWords(session.words);
  if (med == null || med < 3) return false;
  const short = (w) => w <= Math.max(1, Math.floor(med / 3));
  const nonAnswer = (o) => !isAttempt(o);
  const prevWords = session.words.at(-1), prevOutcome = session.outcomes.at(-1);
  return session.words.length >= 4 && short(words) && nonAnswer(outcome) && prevWords != null && short(prevWords) && nonAnswer(prevOutcome);
}

/** Persistence: at least two not-yets in the window and the child attempts again (whatever this attempt's verdict). */
export function persisted(session, outcome) {
  if (!isAttempt(outcome) && outcome !== "attempt") return false;
  const recent = session.outcomes.slice(-3);
  return recent.filter(isNotYet).length >= 2;
}

/**
 * One turn folded in (immutable). The policy reads the PREVIOUS session for its decisions and stores this one.
 * @param {import("../../shared/relational").RelSession} prev
 * @param {import("../../shared/relational").RelSignal[]} signals
 * @param {{ turn: number, outcome?: string|null, words?: number, safety?: boolean }} t
 */
export function nextRelSession(prev, signals, t) {
  // a shallow copy of every field this fold changes (cheaper than structuredClone; the policy never mutates prev)
  const s = { ...prev, climate: { ...prev.climate }, overlayMoves: { ...prev.overlayMoves } };
  const k = new Set((signals ?? []).map((x) => x.kind));
  s.turn = t.turn;
  const c = s.climate;
  if (k.has("warmth_offer")) c.warmthOffers++;
  if (k.has("permanence_ask")) c.permanenceAsks++;
  if (k.has("secret_ask")) c.secretAsks++;
  if (k.has("contact_ask")) c.contactAsks++;
  if (k.has("romance")) c.romance++;
  if (k.has("night_ask")) c.nightAsks++;
  if (k.has("loneliness")) c.lonelySays++;
  if (k.has("self_label")) { c.selfLabels++; s.safeToBeWrong = Math.max(0, s.safeToBeWrong - 0.05); }
  if (k.has("contest")) c.contests++;
  if (k.has("tired")) c.tiredSays++;
  if (k.has("share") || k.has("share_sad")) c.sharesOpen++;
  if (k.has("end_request")) { c.stopAsks++; }
  if (k.has("joke")) s.jokes = [...s.jokes, { turn: t.turn, tag: "joke" }].slice(-5);
  if (k.has("harm") || t.safety) s.distressAt = t.turn;
  const outcome = t.outcome ?? null;
  if (outcome && isAttempt(outcome) && s.outcomes.slice(-3).some(isNotYet)) s.safeToBeWrong = Math.min(1, s.safeToBeWrong + 0.1);
  if (withdrawing(prev, t.words ?? 0, outcome)) c.withdrawalTurns++;
  if (outcome && isNotYet(outcome)) s.lastErrorAt = t.turn;
  if (outcome) s.outcomes = [...s.outcomes, String(outcome)].slice(-WIN);
  if (Number.isFinite(t.words) && t.words > 0) s.words = [...s.words, t.words].slice(-20);
  // L4 in-session overlay (every mode): after two warmth / permanence offers in one lesson, personal callbacks go off for
  // the session, one outward move is due at the close, and the app-voice AI reminder is due at the next natural break.
  if (c.warmthOffers + c.permanenceAsks >= 2) s.overlayMoves = { pointOut: true, callbacksOff: true, reminderDue: true };
  return s;
}
