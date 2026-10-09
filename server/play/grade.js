// The server's grade of a play level (DESIGN.md §8): the raw acts are sanitised (claim keys stripped, shapes checked),
// replayed through the family's pure law on the level the server regenerated itself, and graded. The client's own
// verdict is never read: a model never grades, and neither does the device.
import { logicFor } from "../../src/play/families/index.ts";
import { replayAll } from "../../src/play/core/replay.ts";
import { sanitizeActs, playFactsRow } from "../../shared/play.ts";

export const MAX_ACTS = 400;

/** → { grade, moments, solved, facts } for the acts so far (final = the level is being closed). */
export function gradeActs(level, rawActs, { final = false } = {}) {
  const logic = logicFor(level.family, level.mode);
  if (!logic) return null;
  const v = logic.validate(level);
  if (!v) return null;
  const acts = sanitizeActs(rawActs).slice(0, MAX_ACTS);
  const r = replayAll(logic, v, acts);
  const solved = logic.goalMet(v, r.state);
  const grade = solved || final ? logic.grade(v, acts) : null;
  return { grade, moments: r.moments, solved, acts: acts.length, facts: logic.facts(v, r.state), factsRow: playFactsRow(logic.facts(v, r.state)) };
}

/**
 * Legacy lesson evidence rows from a play grade (what the lesson turn folds; server/learner/live.js reads source "game"
 * and tempers it ×0.5 in kt/bktr.js). One level = one item episode.
 */
export function lessonEvidence(grade, level) {
  if (!grade?.evidence?.length) return [];
  return grade.evidence.map((e) => ({
    skillId: e.skillId, outcome: e.outcome, ...(e.misconceptionId ? { misconceptionId: e.misconceptionId } : {}),
    ...(e.discriminates ? { discriminates: e.discriminates } : {}), source: "game", itemId: `play:${level.levelId}`, probe: "P10", hintsUsed: 0, weight: e.weight,
  }));
}
