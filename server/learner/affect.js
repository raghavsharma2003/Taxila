// Affect from DIALOGUE only (learning-science rule 9): counters over what the child says and does,
// never acoustic emotion recognition, never a stored emotion label. The counters live in the lesson
// state (deleted with it) and drive cheap reversible moves: a hint, a smaller step, a choice, a break.

const DONT_KNOW = /(pata\s*nahi+n?|nahi+n?\s*pata|maa?lo+o?m\s*nahi+n?|nahi+n?\s*aata|don'?t\s*know|dunno|no\s*idea|\bidk\b|not\s*sure|पता\s*नहीं|नहीं\s*पता|मालूम\s*नहीं|नहीं\s*आता)/i;
const JUST_TELL = /(just\s*tell|tell\s*me\s*the\s*answer|(answer|jawa+b|uttar)\s*(batao|bata\s*do|bolo|de\s*do)|(aap|tum|didi|bhaiya|sir)\s*(hi\s*)?bata\s*do|bas\s*bata\s*do|जवाब\s*बता|बता\s*दो)/i;
const MINIMAL = /^(h+m+|u+m+|u+h+|o+k+(a+y+)?|ha+n?|ji+|achh?a+|thee?k\s*hai|thik|yes|no|nahi+n?|hmm+)[\s.!?…]*$/i;

/** Rapid answers closer together than this on the same item read as guessing, not thinking. */
const RAPID_MS = 5000;
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

export const initialAffect = () => ({ dontKnowStreak: 0, minimalStreak: 0, justTellMe: 0, recent: [] });

/**
 * @param {ReturnType<typeof initialAffect>} prev
 * @param {{ read: ReturnType<typeof readUtterance>, outcome?: string, itemId?: string, at: number }} turn
 */
export function nextAffect(prev, { read, outcome, itemId, at }) {
  const recent = outcome && outcome !== "no_evidence" ? [...prev.recent, { itemId, outcome, at }].slice(-WINDOW) : prev.recent;
  return {
    dontKnowStreak: read.dontKnow ? prev.dontKnowStreak + 1 : 0,
    minimalStreak: read.minimal ? prev.minimalStreak + 1 : 0,
    justTellMe: Math.min(WINDOW, prev.justTellMe + (read.asksForAnswer ? 1 : 0)),
    recent,
  };
}

/** P20: unresolved confusion turning into frustration — time to offer a break or an easier step. */
export function frustrationLoop(a) {
  return a.dontKnowStreak >= 3 || a.minimalStreak >= 4;
}

/** P22: "just tell me" more than once, or three wrong answers on one item each within seconds. */
export function gaming(a) {
  if (a.justTellMe >= 2) return true;
  const r = a.recent;
  for (let i = 2; i < r.length; i++) {
    const run = [r[i - 2], r[i - 1], r[i]];
    if (run.every((x) => x.itemId === run[0].itemId && x.outcome !== "correct")
      && run[1].at - run[0].at < RAPID_MS && run[2].at - run[1].at < RAPID_MS) return true;
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
