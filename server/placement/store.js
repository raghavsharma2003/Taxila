// Reads over finished placement rounds (migration 036): the summary a parent sees and the start GE topic choice uses.
import { q } from "../db.js";
import { startChapter } from "./cat.js";
import { topicSequence, getTopic } from "../content/curriculum.js";

/**
 * PURE. What a parent (and the start of topic choice) reads from a finished round: the level word, the start GE and the
 * chapter of the child's own class book it maps to (cat.js startChapter), with that chapter's title.
 * @returns {{ subject: string, level: "behind"|"on_track"|"ahead", startGE: number, skipAhead: boolean, chapter: { number: number, title: string } | null }}
 */
export function summaryOf(result, classLevel, subject) {
  const chapters = [];
  for (const id of topicSequence(classLevel, subject)) {
    const t = getTopic(id);
    if (t && !chapters.some((c) => c.number === t.chapter.number)) chapters.push({ number: t.chapter.number, title: t.chapter.title });
  }
  const n = chapters.length ? startChapter(result.startGE, classLevel, chapters.length) : null;
  return { subject, level: result.level, startGE: result.startGE, skipAhead: !!result.skipAhead, chapter: n ? chapters[n - 1] : null };
}

/**
 * The child's latest finished placement per subject, as { [subject]: result }. Defensive: no table (036 not applied) or
 * any read error is {} (topic choice falls back to the school's chapter, then the calendar).
 */
export async function placementResultsOf(childId, { q_ = q } = {}) {
  try {
    const rows = await q_(`select distinct on (subject) subject, result from placement
        where child_id = $1 and completed_at is not null and result is not null order by subject, completed_at desc`, [childId]);
    return Object.fromEntries(rows.map((r) => [r.subject, r.result]));
  } catch { return {}; }
}


/** PURE. { [subject]: startGE } from placementResultsOf (content/next-topic.js nextTopicFor's `startGE`). */
export const startGEOf = (results) => Object.fromEntries(Object.entries(results ?? {}).filter(([, r]) => Number.isFinite(Number(r?.startGE))).map(([s, r]) => [s, Number(r.startGE)]));

/**
 * PURE. { [subject]: grade levels below the class's expected level } for subjects placed below it (conductor R9's
 * foundation share), to .5. A result without its `expected` (an older round) or at/above expected is left out.
 */
export const placementGapOf = (results) => Object.fromEntries(Object.entries(results ?? {})
  .map(([s, r]) => [s, Number(r?.expected) - Number(r?.startGE)])
  .filter(([, g]) => Number.isFinite(g) && g >= 0.5)
  .map(([s, g]) => [s, Math.round(g * 2) / 2])
  .sort(([a], [b]) => (a < b ? -1 : 1)));
