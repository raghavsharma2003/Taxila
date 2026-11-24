// Reads over finished placement rounds (migration 036): the summary a parent sees and the start GE topic choice uses.
import { q } from "../db.js";
import { startChapter } from "./cat.js";
import { refinedStart, geOf } from "./coldstart.js";
import { topicSequence, getTopic } from "../content/curriculum.js";

/**
 * PURE. What a parent (and the start of topic choice) reads from a finished round: the level word, the start GE and the
 * chapter of the child's own class book it maps to (cat.js startChapter), with that chapter's title.
 * `source` is "onboarding" for a cold-start estimate (coldstart.js; no level word: its `level` is undefined) and "round"
 * for a placement round.
 * @returns {{ subject: string, level: "behind"|"on_track"|"ahead"|undefined, startGE: number, skipAhead: boolean, chapter: { number: number, title: string } | null, source: "onboarding"|"round" }}
 */
export function summaryOf(result, classLevel, subject) {
  const chapters = [];
  for (const id of topicSequence(classLevel, subject)) {
    const t = getTopic(id);
    if (t && !chapters.some((c) => c.number === t.chapter.number)) chapters.push({ number: t.chapter.number, title: t.chapter.title });
  }
  const n = chapters.length ? startChapter(result.startGE, classLevel, chapters.length) : null;
  return { subject, level: result.level, startGE: result.startGE, skipAhead: !!result.skipAhead, chapter: n ? chapters[n - 1] : null,
    source: result.source === "onboarding" ? "onboarding" : "round" };
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
export const startGEOf = (results) => Object.fromEntries(Object.entries(results ?? {}).filter(([, r]) => Number.isFinite(geOf(r?.startGE))).map(([s, r]) => [s, geOf(r.startGE)]));

/**
 * PURE. { [subject]: grade levels below the class's expected level } for subjects placed below it (conductor R9's
 * foundation share), to .5. A result without its `expected` (an older round) or at/above expected is left out.
 */
export const placementGapOf = (results) => Object.fromEntries(Object.entries(results ?? {})
  .map(([s, r]) => [s, Number(r?.expected) - geOf(r?.startGE)])
  .filter(([, g]) => Number.isFinite(g) && g >= 0.5)
  .map(([s, g]) => [s, Math.round(g * 2) / 2])
  .sort(([a], [b]) => (a < b ? -1 : 1)));

/**
 * Round 7 F cold start: the child's live θ per subject strand from the kt_ability cache ({ [subject]: { mu, sd, n_obs } },
 * strands "<subject>:core"). Defensive: any read error is {} (refinement then keeps the placement's own start).
 */
export async function abilityOf(childId, { q_ = q } = {}) {
  try {
    const rows = await q_("select strand, mu, sd, n_obs from kt_ability where child_id = $1 and strand like '%:core'", [childId]);
    return Object.fromEntries(rows.map((r) => [String(r.strand).split(":")[0], { mu: Number(r.mu), sd: Number(r.sd), n_obs: Number(r.n_obs) }]));
  } catch { return {}; }
}

/**
 * PURE. Covert refinement (coldstart.js refinedStart): each placement result with its startGE replaced by the settled
 * live θ's start, when θ has settled. startGEOf and placementGapOf then read the refined value, so topic choice and the
 * conductor's foundation share follow the child's answers in lessons without another round. A result whose θ has not
 * settled is returned unchanged.
 */
export function refinedResultsOf(results, thetas) {
  return Object.fromEntries(Object.entries(results ?? {}).map(([s, r]) => {
    const st = refinedStart(r, thetas?.[s]);
    return [s, st?.from === "theta" ? { ...r, startGE: st.startGE, refined: true } : r];
  }));
}

/** The child's placement results, refined by live θ (topic choice and the conductor read this). */
export async function liveResultsOf(childId, { q_ = q } = {}) {
  const [results, thetas] = await Promise.all([placementResultsOf(childId, { q_ }), abilityOf(childId, { q_ })]);
  return refinedResultsOf(results, thetas);
}
