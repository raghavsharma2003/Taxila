// Which topic to teach next: the first topic of the child's class (curriculum order) that is not yet
// learned, back-chained TaRL-style to a prerequisite when the evidence says the foundation is weak.
// "learned" (every skill at least learned_today) counts as done for placement: those skills come back
// through warm-up retrieval on the spacing schedule rather than as a fresh lesson.
import { q } from "../db.js";
import { getTopic, topicSequence, SUBJECT_ORDER } from "./curriculum.js";
import { getKit, topicOf } from "./index.js";

const LEARNED = new Set(["learned_today", "mastered", "due"]);
const DONE = new Set(["learned", "mastered"]);
/** A skill with this many attempts and pKnown below WEAK_P is evidence of a weak foundation. */
const WEAK_ATTEMPTS = 3;
const WEAK_P = 0.4;
const MAX_BACKCHAIN = 3;

/**
 * @param {{ status: string, pKnown: number, attempts: number }[]} states  skill states of one topic
 * @param {number} [skillCount]  how many skills the topic's kit has (unknown → only the rows decide)
 * @returns {"unseen"|"in_progress"|"weak"|"learned"|"mastered"}
 */
export function topicStatus(states, skillCount = 0) {
  if (!states.length) return "unseen";
  const complete = states.length >= skillCount;
  if (complete && states.every((s) => s.status === "mastered")) return "mastered";
  if (complete && states.every((s) => LEARNED.has(s.status))) return "learned";
  if (states.some((s) => s.attempts >= WEAK_ATTEMPTS && s.pKnown < WEAK_P)) return "weak";
  return "in_progress";
}

/**
 * Pure placement: first not-done topic in `order` (from `start`, wrapping), then back-chain. A weak prerequisite is always taught
 * first; when the candidate itself is weak, an unseen or unfinished prerequisite is taught first too
 * (struggling at grade level is the signal to go down a level).
 * @param {string[]} order
 * @param {(id: string) => string} statusOf
 * @param {(id: string) => string[]} prereqsOf
 * @param {{ start?: number }} [opts]  index in `order` of the school's current chapter (schoolStartIndex)
 */
export function pickTopic(order, statusOf, prereqsOf, { start = 0 } = {}) {
  // F0.4: start where the school is. Topics from `start` on come first; the earlier ones (taught at school already)
  // come after them, and are reached sooner only through back-chaining on evidence.
  const s0 = Math.max(0, Math.min(start, order.length));
  const rotated = s0 ? [...order.slice(s0), ...order.slice(0, s0)] : order;
  const first = rotated.find((id) => !DONE.has(statusOf(id)));
  if (!first) return null;
  const seen = new Set();
  const chain = (id, depth) => {
    seen.add(id);
    if (depth >= MAX_BACKCHAIN) return id;
    const weakHere = statusOf(id) === "weak";
    for (const p of prereqsOf(id)) {
      if (seen.has(p)) continue;
      const st = statusOf(p);
      if (st === "weak" || (weakHere && (st === "unseen" || st === "in_progress"))) return chain(p, depth + 1);
    }
    return id;
  };
  return chain(first, 0);
}

/** Flag `content.f0` (shared with director/items.js): on unless TAXILA_CONTENT_F0=off. */
const contentF0 = () => process.env.TAXILA_CONTENT_F0 !== "off";
/** CBSE year: April start, about ten teaching months. 0 = start of the year, 1 = end. */
export function schoolYearFraction(date = new Date()) {
  const d = new Date(date);
  return Math.max(0, Math.min(1, (((d.getUTCMonth() - 3 + 12) % 12) + d.getUTCDate() / 31) / 10));
}
/** Chapters behind the calendar estimate we start, so a child is never started past where the class really is. */
const CALENDAR_LAG = 0.8;
/**
 * Index in `order` to start topic choice (CONTENT-LEVEL F0.4, RS-6), from the best evidence available:
 *   1. `chapter`: the school's current chapter, asked of the parent at onboarding and changeable by the child;
 *   2. `startGE`: a placement result (server/placement result().startGE), mapped with ability.js skillGE's convention
 *      GE = C-1 + (chapter-1)/10; below the class means chapter 1 (back-chaining does the rest);
 *   3. the calendar: CALENDAR_LAG x the year fraction of the book's chapters (4 Oct, a 14-chapter book: chapter 7).
 * @param {string[]} order  topic ids of one class x subject in teaching order
 * @param {(id: string) => { chapter: { number: number } } | null} topicOf
 * @param {{ classLevel: number, chapter?: number, startGE?: number, date?: Date|string }} o
 */
export function schoolStartIndex(order, topicOf, { classLevel, chapter, startGE, date = new Date() }) {
  const chapters = [...new Set(order.map((id) => topicOf(id)?.chapter?.number).filter(Number.isFinite))].sort((a, b) => a - b);
  if (!chapters.length) return 0;
  let ch;
  if (Number.isFinite(chapter)) ch = chapter;
  else if (Number.isFinite(startGE)) ch = Math.floor((startGE - (classLevel - 1)) * 10) + 1;
  else ch = Math.floor(CALENDAR_LAG * schoolYearFraction(date) * chapters.length) + 1;
  ch = Math.max(chapters[0], Math.min(chapters[chapters.length - 1], ch));
  const i = order.findIndex((id) => (topicOf(id)?.chapter?.number ?? 0) >= ch);
  return i < 0 ? 0 : i;
}

/**
 * @param {{ id: string, class_level: number, school_chapter?: Record<string, number> }} child  child row
 *   (`school_chapter` arrives with the RS-2/RS-6 onboarding question; absent, the calendar estimate is used)
 * @param {{ subject?: string, chapter?: Record<string, number>, startGE?: Record<string, number>, date?: Date|string }} [opts]
 * @returns {Promise<import("./curriculum.js").Topic | null>}
 */
export async function nextTopicFor(child, { subject, chapter, startGE, date } = {}) {
  const rows = await q("select skill_id, p_known, status, attempts from skill_state where child_id = $1", [child.id]);
  const byTopic = new Map();
  for (const r of rows) {
    const tid = topicOf(r.skill_id);
    if (!tid) continue;
    if (!byTopic.has(tid)) byTopic.set(tid, []);
    byTopic.get(tid).push({ status: r.status, pKnown: r.p_known, attempts: r.attempts });
  }
  const skillCounts = new Map();
  for (const tid of byTopic.keys()) skillCounts.set(tid, (await getKit(tid, { generate: false }))?.skills.length ?? 0);
  const statusOf = (tid) => topicStatus(byTopic.get(tid) ?? [], skillCounts.get(tid));
  // Prerequisite ids can point outside the seed; only known topics are candidates.
  const prereqsOf = (tid) => (getTopic(tid)?.prerequisites ?? []).filter((p) => getTopic(p));
  for (const subj of subject ? [subject] : SUBJECT_ORDER) {
    const order = topicSequence(child.class_level, subj);
    const start = contentF0() && order.length
      ? schoolStartIndex(order, getTopic, { classLevel: child.class_level, chapter: chapter?.[subj] ?? child.school_chapter?.[subj], startGE: startGE?.[subj], date })
      : 0;
    const id = order.length ? pickTopic(order, statusOf, prereqsOf, { start }) : null;
    if (id) return getTopic(id);
  }
  return null;
}
