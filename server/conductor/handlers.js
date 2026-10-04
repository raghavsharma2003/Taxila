// Job handlers the worker runs (CONDUCTOR.md §8.2). The parent-report kinds (report.daily, parent.letter) register
// themselves in server/reports/jobs.js, imported here so the worker's one handlers import loads them all.
import { registerHandler } from "./jobs.js";
import "../reports/jobs.js";
import "../forge/g2/conductor-job.js";   // forge.g2.nightly (Forge G2 end-of-day delivery / build request)
import { one } from "./pg.js";

/**
 * forge.g2.nightly stays PAUSED (BUILD-PLAN W1-D item 4) until W3-D delivers next-day Forge to children: the night
 * fold still enqueues one per active day (decide.js, unchanged, so replay is unchanged), and this handler completes it
 * at once with no build and no model call, so no money is spent on builds nobody can receive. FORGE_G2_NIGHTLY=on
 * restores the real handler (server/forge/g2/conductor-job.js) without a code change.
 */
export const forgeNightlyLive = () => process.env.FORGE_G2_NIGHTLY === "on";
if (!forgeNightlyLive()) registerHandler("forge.g2.nightly", async () => "paused:w1-d");

/**
 * memory.consolidate:{lessonId}. Today /api/lesson/end writes the lesson's cited memories inline, so this job
 * is the seam (and the queue's end-to-end proof): it re-checks the memory consent at claim time (§8.2: "P3
 * re-checked at claim + steps") and completes. Moving consolidation here is a lesson.js change, not a
 * Conductor one.
 */
registerHandler("memory.consolidate", async (job) => {
  const r = await one(`select l.ended_at is not null as ended,
      (select granted from consent k where k.guardian_id = c.guardian_id and (k.child_id = c.id or k.child_id is null)
        and k.purpose = 'memory' order by k.created_at desc, k.id desc limit 1) as memory_ok
    from lesson l join child c on c.id = l.child_id where l.id::text = $1 and l.child_id = $2`, [job.input?.lessonId ?? "", job.child_id]);
  if (!r) return "skipped:no_lesson";
  if (!r.memory_ok) return "skipped:consent";
  return r.ended ? "inline:lesson_end" : "skipped:not_ended";
});
