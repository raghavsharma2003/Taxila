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
 * Pure placement: first not-done topic in `order`, then back-chain. A weak prerequisite is always taught
 * first; when the candidate itself is weak, an unseen or unfinished prerequisite is taught first too
 * (struggling at grade level is the signal to go down a level).
 * @param {string[]} order
 * @param {(id: string) => string} statusOf
 * @param {(id: string) => string[]} prereqsOf
 */
export function pickTopic(order, statusOf, prereqsOf) {
  const first = order.find((id) => !DONE.has(statusOf(id)));
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
 * @param {{ id: string, class_level: number }} child  child row
 * @param {{ subject?: string }} [opts]
 * @returns {Promise<import("./curriculum.js").Topic | null>}
 */
export async function nextTopicFor(child, { subject } = {}) {
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
    const id = order.length ? pickTopic(order, statusOf, prereqsOf) : null;
    if (id) return getTopic(id);
  }
  return null;
}
