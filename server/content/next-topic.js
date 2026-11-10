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
 * Skill ids of a kit that have at least one item to ask. "Learned" needs an unaided correct answer to an item of the
 * skill (learner/kt/ledger.js), so a skill with nothing to ask can be taught but never learned: counting it kept eight
 * topics "in progress" for ever (CD-01). Reading-aloud skills have no item; some English skills lose every item at load.
 * @param {{ skills: { id: string }[], items: { skillId: string }[] } | null} kit
 * @returns {Set<string>}
 */
export function askableSkillIds(kit) {
  const withItem = new Set((kit?.items ?? []).map((i) => i.skillId));
  return new Set((kit?.skills ?? []).map((s) => s.id).filter((id) => withItem.has(id)));
}

/**
 * PURE. The rows that decide a topic and how many skills it has, given the askable skill ids (askableSkillIds), or null
 * when the kit cannot be read (then every row decides and the count is unknown).
 * @param {{ skillId: string }[]} states @param {Set<string> | null} askable
 */
export function decidingStates(states, askable) {
  return askable ? { states: states.filter((s) => askable.has(s.skillId)), count: askable.size } : { states, count: 0 };
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

/**
 * PURE. Test-window revision (round 7 F, learning-test-window-revision; CONDUCTOR §4.4 item 3, DC11): the topic for a
 * lesson inside a school test window whose chapters the parent entered. Only topics of those chapters are candidates.
 * Before the last two days: the first one not done yet (pickTopic, back-chaining inside the chapters), else a review.
 * In the last two days (`review`): never a new topic: a topic already met, weak first, then in progress, then learned
 * (book order inside each); a test chapter the child never met is taught only when nothing in the chapters was met.
 * @returns {{ id: string, mode: "teach" | "review" } | null}
 */
export function revisionPick(order, statusOf, prereqsOf, { chapterOf, chapters, review = false }) {
  const want = new Set(chapters.map(Number));
  const inCh = order.filter((id) => want.has(Number(chapterOf(id))));
  if (!inCh.length) return null;
  const reviewPick = () => {
    for (const st of ["weak", "in_progress", "learned", "mastered"]) {
      const id = inCh.find((t) => statusOf(t) === st);
      if (id) return { id, mode: "review" };
    }
    return null;
  };
  if (review) return reviewPick() ?? { id: inCh[0], mode: "teach" };
  const inSet = new Set(inCh);
  const id = pickTopic(inCh, statusOf, (t) => prereqsOf(t).filter((p) => inSet.has(p)));
  return id ? { id, mode: "teach" } : reviewPick();
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
export async function nextTopicFor(child, { subject, chapter, startGE, date, revise } = {}) {
  const rows = await q("select skill_id, p_known, status, attempts from skill_state where child_id = $1", [child.id]);
  const byTopic = new Map();
  for (const r of rows) {
    const tid = topicOf(r.skill_id);
    if (!tid) continue;
    if (!byTopic.has(tid)) byTopic.set(tid, []);
    byTopic.get(tid).push({ skillId: r.skill_id, status: r.status, pKnown: r.p_known, attempts: r.attempts });
  }
  // in parallel (QA D22: one awaited kit read per topic made the parent's reads slow)
  const tids = [...byTopic.keys()];
  const askable = await Promise.all(tids.map((tid) => getKit(tid, { generate: false }).then(askableSkillIds, () => null)));
  // a topic is decided only on the skills that have something to ask (CD-01); a topic with no readable kit keeps all its rows
  const decided = new Map(tids.map((tid, i) => [tid, decidingStates(byTopic.get(tid), askable[i])]));
  const statusOf = (tid) => { const d = decided.get(tid); return d ? topicStatus(d.states, d.count) : "unseen"; };
  // Prerequisite ids can point outside the seed; only known topics are candidates.
  const prereqsOf = (tid) => (getTopic(tid)?.prerequisites ?? []).filter((p) => getTopic(p));
  // round 7 F: inside a test window with chapters, revise only those (revisionPick); null → the usual choice below
  if (revise?.chapters?.length && subject) {
    const r = revisionPick(topicSequence(child.class_level, subject), statusOf, prereqsOf,
      { chapterOf: (id) => getTopic(id)?.chapter?.number, chapters: revise.chapters, review: !!revise.review });
    if (r) return { ...getTopic(r.id), revision: r.mode };
  }
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
