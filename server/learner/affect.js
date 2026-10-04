// Affect from DIALOGUE only (learning-science rule 9): counters over what the child says and does,
// never acoustic emotion recognition, never a stored emotion label. The counters live in the lesson
// state (deleted with it) and drive cheap reversible moves: a hint, a smaller step, a choice, a break.

const DONT_KNOW = /(pata\s*nahi+n?|nahi+n?\s*pata|maa?lo+o?m\s*nahi+n?|nahi+n?\s*aata|don'?t\s*know|dunno|no\s*idea|\bidk\b|not\s*sure|पता\s*नहीं|नहीं\s*पता|मालूम\s*नहीं|नहीं\s*आता)/i;
const JUST_TELL = /(just\s*tell|tell\s*me\s*the\s*answer|(answer|jawa+b|uttar)\s*(batao|bata\s*do|bolo|de\s*do)|(aap|tum|didi|bhaiya|sir)\s*(hi\s*)?bata\s*do|bas\s*bata\s*do|जवाब\s*बता|बता\s*दो)/i;
const MINIMAL = /^(h+m+|u+m+|u+h+|o+k+(a+y+)?|ha+n?|ji+|achh?a+|thee?k\s*hai|thik|yes|no|nahi+n?|hmm+)[\s.!?…]*$/i;

const WINDOW = 10;

/** Lexical read of one utterance. */
export function readUtterance(text) {
  const t = String(text || "").trim();
  const words = t ? t.split(/\s+/).length : 0;
  return {
    words,
    dontKnow: words > 0 && words <= 8 && DONT_KNOW.test(t),
    asksForAnswer: JUST_TELL.test(t),
    minimal: words > 0 && MINIMAL.test(t),
  };
}

export const initialAffect = () => ({ dontKnowStreak: 0, minimalStreak: 0, asks: [], recent: [] });

/**
 * @param {ReturnType<typeof initialAffect>} prev
 * @param {{ read: ReturnType<typeof readUtterance>, outcome?: string, itemId?: string, answer?: string }} turn
 *   answer: the child's words, normalized — what tells cycling through options from holding one belief
 */
export function nextAffect(prev, { read, outcome, itemId, answer = "" }) {
  const recent = outcome && outcome !== "no_evidence" ? [...prev.recent, { itemId, outcome, answer }].slice(-WINDOW) : prev.recent;
  // W2-E BR2 (TEACHER-BRAIN TB4): the classify signals block's acts, when on (classify.js signalFlags). The child's OWN
  // words saying they are frustrated, or asking for a break, count here; a counter only exists once it is non-zero, so a
  // lesson without signals keeps exactly the state it always had.
  const fw = read.frustrationWords ? (prev.frustrationStreak ?? 0) + 1 : 0;
  return {
    dontKnowStreak: read.dontKnow ? prev.dontKnowStreak + 1 : 0,
    minimalStreak: read.minimal ? prev.minimalStreak + 1 : 0,
    // "just tell me" over the last WINDOW turns only: an early ask must not discount the whole lesson.
    asks: [...prev.asks, !!read.asksForAnswer].slice(-WINDOW),
    recent,
    ...(fw ? { frustrationStreak: fw } : {}),
    ...(read.metaBreak ? { breakAsked: true } : {}),
    // The IDK split (steal 8): "I knew it, I can't recall" wants a recall cue; "never learned it" wants teaching. Read by
    // the Director's hint choice (W2-C); this turn only.
    ...(read.idkCantRecall ? { idk: "cant_recall" } : read.idkNotKnown ? { idk: "not_known" } : {}),
  };
}

/**
 * P20: unresolved confusion turning into frustration — time to offer a break or an easier step. With the signals block on,
 * also two turns of the child's own frustration words in a row, or the child asking for a break.
 */
export function frustrationLoop(a) {
  return a.dontKnowStreak >= 3 || a.minimalStreak >= 4 || (a.frustrationStreak ?? 0) >= 2 || !!a.breakAsked;
}

/**
 * P22: "just tell me" more than once, or three wrong answers on one item that are all DIFFERENT (cycling
 * through options). Repeating one wrong answer is a held belief, not gaming. Speed is deliberately not a
 * signal here: turn timestamps include pipeline latency, and rule 8 forbids reading that as the child —
 * a rapid-guess rule needs a response-onset measure from the client first.
 */
export function gaming(a) {
  if (a.asks.filter(Boolean).length >= 2) return true;
  const r = a.recent;
  for (let i = 2; i < r.length; i++) {
    const run = [r[i - 2], r[i - 1], r[i]];
    if (run.every((x) => x.itemId === run[0].itemId && x.outcome !== "correct") && new Set(run.map((x) => x.answer)).size === 3) return true;
  }
  return false;
}

/** Gaming discounts everything recorded in the window (signal-fusion rule 4). */
export const gamingDiscount = (a) => (gaming(a) ? 0.5 : 1);

/**
 * P21 wheel-spinning: about 10 opportunities on a skill with no 3 correct in a row.
 * @param {string[]} outcomes chronological outcomes for one skill (no_evidence excluded)
 */
export function wheelSpinning(outcomes, window = WINDOW) {
  const last = (outcomes || []).slice(-window);
  if (last.length < window) return false;
  let run = 0;
  for (const o of last) {
    run = o === "correct" ? run + 1 : 0;
    if (run >= 3) return false;
  }
  return true;
}

/**
 * The engagement state for the turn's Moment (TEACHER-BRAIN §4.1 EngagementState; TB6): from the counters above (what
 * the child says and does) and the turn count only, never tone, voice prosody, a camera or timing (ct-no-voice-emotion-
 * inference). Session-only: it is never stored (NM-3).
 * @param {ReturnType<typeof initialAffect> | undefined} a
 * @param {{ turn?: number, stopping?: boolean }} [o]
 * @returns {"warming" | "engaged" | "strained" | "disengaging" | "stopped"}
 */
export function engagementOf(a, { turn = 0, stopping = false } = {}) {
  if (stopping) return "stopped";
  const x = a ?? initialAffect();
  if (frustrationLoop(x)) return "strained";
  if (x.minimalStreak >= 2) return "disengaging";
  if (turn <= 2) return "warming";
  return "engaged";
}
