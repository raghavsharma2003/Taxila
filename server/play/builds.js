// r4-khand: the child's Khand builds as artefacts (db/migrations/026_r4khand_play_build.sql). The server saves a build only
// from ITS OWN replay of the child's raw acts on a level it regenerated, and only when its own grade says solved; the device
// never sends a build. One row per (child, level): a replayed post saves nothing new. Reading is the child's own (and the
// parent's, through the same requireChild guard). No counts are kept or shown: a gallery, not a tally.
import { logicFor } from "../../src/play/families/index.ts";
import { replayAll } from "../../src/play/core/replay.ts";
import { sanitizeActs } from "../../shared/play.ts";

/** The end state of a solved Nazariya level from the raw acts, or null (another family, not solved, a bad level). */
export function buildOf(level, rawActs) {
  if (level?.family !== "nazariya") return null;
  const logic = logicFor(level.family, level.mode), v = logic?.validate(level);
  if (!v) return null;
  const r = replayAll(logic, v, sanitizeActs(rawActs));
  if (!logic.goalMet(v, r.state)) return null;
  return { levelId: v.levelId, topicId: v.topicId, skillId: v.skillId, mode: v.mode, goal: v.goal, w: v.params.w, d: v.params.d, heights: r.state.h, base: v.params.base };
}
/** Save a solved build (idempotent). Never throws: a failed save never blocks play. */
export async function saveBuild(q, childId, level, rawActs) {
  const b = buildOf(level, rawActs);
  if (!b) return false;
  try {
    await q("insert into play_build (child_id, level_id, topic_id, skill_id, mode, goal, w, d, heights, base) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::smallint[],$10::smallint[]) on conflict (child_id, level_id) do nothing",
      [childId, b.levelId, b.topicId, b.skillId, b.mode, b.goal, b.w, b.d, b.heights, b.base]);
    return true;
  } catch { return false; }
}
/** The child's builds, newest first. */
export async function listBuilds(q, childId, limit = 24) {
  const rows = await q("select level_id, topic_id, skill_id, mode, goal, w, d, heights, base, created_at from play_build where child_id = $1 order by created_at desc limit $2", [childId, Math.max(1, Math.min(60, limit))]);
  return rows.map((r) => ({ levelId: r.level_id, topicId: r.topic_id, skillId: r.skill_id, mode: r.mode, goal: r.goal, w: Number(r.w), d: Number(r.d), heights: (r.heights ?? []).map(Number), base: (r.base ?? []).map(Number), at: r.created_at }));
}
