// Conversation mix and child talk share (BUILD-PLAN W2-C #5; steal 10; TEACHER-BRAIN §10 "talk share" budget).
//
// Each CHILD turn is labelled in code from what the Director already knows about it (the classification, its flags,
// the move it answered, the child's words): attempt · explain · ask-answer · ask-check · idk · off-task · help · unclear.
// Aggregated per lesson in the lesson state (`s.talk`, persisted with the lesson row = the live telemetry), and over a
// transcript by talkReport() for director-sim and any report job. childTalkShare = child words / all words. A persona
// or model change that cuts the median share by more than TALK_SHARE_DROP_MAX (relative) is blocked (talkGate).
// Labels are a monitor, never evidence and never a trait: nothing here reaches KT, a belief or a verdict.

export const MIX_LABELS = Object.freeze(["attempt", "explain", "ask_answer", "ask_check", "idk", "off_task", "help", "unclear"]);
/** steal 10: a release that cuts child talk share by more than this (relative to the baseline) is blocked. */
export const TALK_SHARE_DROP_MAX = 0.10;
/** TEACHER-BRAIN §10 budget table: the child's share target (a monitor, not a hard cap). */
export const TALK_SHARE_TARGET = 0.35;

export const wordCount = (t) => String(t ?? "").trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const QUESTION = /[?？]|\b(kya|kaise|kyun|kyon|kyu|kab|kahan|kaun|why|how|what|which|when|where|is it|can i|does)\b|क्या|कैसे|क्यों/i;

/**
 * One child turn's mix label.
 * @param {{ cls?: any, text?: string, explaining?: boolean }} t  explaining: the turn answered a why / teach-back
 */
export function mixLabel({ cls, text = "", explaining = false }) {
  if (cls?.help) return "help";
  const f = cls?.flags ?? {};
  if (f.asksForAnswer) return "ask_answer";
  if (f.dontKnow) return "idk";
  if (f.offTopic) return "off_task";
  const graded = ["correct", "incorrect", "partial", "misconception"].includes(cls?.outcome);
  if (explaining && wordCount(text) >= 3) return "explain";
  if (graded && cls?.reason) return "explain";
  if (graded) return "attempt";
  if (wordCount(text) && QUESTION.test(text)) return "ask_check";
  return "unclear";
}

export const newTalk = () => ({ childWords: 0, childTurns: 0, mix: {} });

/** Fold one child turn into the lesson's talk counters (pure). */
export function noteChildTurn(talk, { cls, text, explaining }) {
  const t = talk ?? newTalk();
  const label = mixLabel({ cls, text, explaining });
  return { childWords: t.childWords + wordCount(text), childTurns: t.childTurns + 1, mix: { ...t.mix, [label]: (t.mix[label] ?? 0) + 1 } };
}

/**
 * The lesson's talk report from its turns ({ speaker: "child" | "teacher", text, meta? }), for director-sim and the
 * telemetry line at lesson end. Child turns that were client actions (meta.help / chip-only) carry no words.
 * @returns {{ childWords: number, teacherWords: number, childTalkShare: number | null, childTurns: number, teacherTurns: number,
 *   wordsPerTeacherTurn: number | null }}
 */
export function talkReport(turns) {
  let childWords = 0, teacherWords = 0, childTurns = 0, teacherTurns = 0;
  for (const t of turns ?? []) {
    if (t?.speaker === "child") { childWords += wordCount(t.text); childTurns += 1; }
    else if (t?.speaker === "teacher") { teacherWords += wordCount(t.text); teacherTurns += 1; }
  }
  const all = childWords + teacherWords;
  return { childWords, teacherWords, childTalkShare: all ? Math.round((childWords / all) * 1000) / 1000 : null,
    childTurns, teacherTurns, wordsPerTeacherTurn: teacherTurns ? Math.round((teacherWords / teacherTurns) * 10) / 10 : null };
}

const median = (xs) => {
  const v = xs.filter((x) => typeof x === "number" && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/**
 * The release gate: candidate lessons' median childTalkShare against the baseline's. Blocks when it falls by more than
 * TALK_SHARE_DROP_MAX of the baseline (relative). Too few lessons on either side → not decided (null), never a pass.
 * @param {number[]} baseline @param {number[]} candidate @param {{ minN?: number }} [o]
 * @returns {{ pass: boolean | null, baseline: number | null, candidate: number | null, drop: number | null, n: [number, number] }}
 */
export function talkGate(baseline, candidate, { minN = 3 } = {}) {
  const b = median(baseline), c = median(candidate);
  const n = [baseline.filter(Number.isFinite).length, candidate.filter(Number.isFinite).length];
  if (b == null || c == null || n[0] < minN || n[1] < minN || b <= 0) return { pass: null, baseline: b, candidate: c, drop: null, n };
  const drop = Math.round(((b - c) / b) * 1000) / 1000;
  return { pass: drop <= TALK_SHARE_DROP_MAX, baseline: b, candidate: c, drop, n };
}
