// SignalSession (shared/signals.ts): the per-lesson counters behind the derived states. Lives in lesson.state.sig, holds
// counts, hashes and z summaries only (no text, no state names), and is cleared at lesson end (G-SIG-NM3, §8.2 step 12).
// Text and interaction baselines are SESSION-ONLY by decision `sig-text-baselines-session-only`: nothing here survives
// the lesson, in any legal mode.
import { ANCHOR_FEATURES, ANCHOR_MIN, ANCHOR_N } from "./priors.js";

export const newSignalSession = () => ({
  v: 1,
  answerWords: [],
  anchor: null,
  anchorN: 0,
  anchorBuf: {},
  item: { id: null, impasse: 0, attempts: [], clarified: false, notYet: 0 },
  turnsSinceVerify: 99,
  consolidated: {},
  graded: [],
  gradedFirst: [],
  gradedN: 0,
  skillLast: {},
  rel: { initiative: 0, deepQuestions: 0, alignmentSum: 0, alignmentN: 0, shares: 0, retries: 0, jokes: 0 },
  breakOffered: false,
  pendingE: {},
  driftBuf: [],
  driftHigh: 0,
  nonAnswers: [],
  lowWords: 0,
  answerAsks: [],
  childTurns: 0,
  langCounts: { hi: 0, hinglish: 0, en: 0 },
  safetyHold: 0,
});

/** A structurally valid session, or a fresh one (state from an older build, or tampered, never throws downstream). */
export function coerceSession(s) {
  if (!s || typeof s !== "object" || s.v !== 1 || !Array.isArray(s.answerWords) || !s.item || typeof s.item !== "object" || !Array.isArray(s.item.attempts) || !s.rel) return newSignalSession();
  return { ...newSignalSession(), ...s };
}

export const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * §2.5.4 session anchor: the median of the first ANCHOR_N reliable answer turns' z, per feature. Kept only when all have
 * one sign and |median| ≥ ANCHOR_MIN (an off day: mic, room, Bluetooth, a cold); else 0. A route/device change resets it.
 * @returns {{ anchor: Record<string, number> | null, anchorN: number, anchorBuf: Record<string, number[]> }}
 */
export function foldAnchor(sess, z, reliable, reset) {
  let { anchor, anchorN, anchorBuf } = sess;
  if (reset) { anchor = null; anchorN = 0; anchorBuf = {}; }
  if (!reliable || anchor || !z) return { anchor, anchorN, anchorBuf };
  const buf = { ...anchorBuf };
  for (const k of ANCHOR_FEATURES) if (typeof z[k] === "number" && Number.isFinite(z[k])) buf[k] = [...(buf[k] ?? []), z[k]].slice(0, ANCHOR_N);
  anchorN += 1;
  if (anchorN < ANCHOR_N) return { anchor: null, anchorN, anchorBuf: buf };
  const out = {};
  for (const k of ANCHOR_FEATURES) {
    const xs = buf[k] ?? [];
    if (xs.length < ANCHOR_N) { out[k] = 0; continue; }
    const m = median(xs);
    const oneSign = xs.every((x) => x > 0) || xs.every((x) => x < 0);
    out[k] = oneSign && Math.abs(m) >= ANCHOR_MIN ? m : 0;
  }
  return { anchor: out, anchorN, anchorBuf: {} };
}
