// Home play → one KT event per level (round 8; learner-evidence.md item 7). Games signs a level's result from the home with
// its process trail; this is the ONE mapping from that trail to evidence, so the ledger's rule lives in one place:
//   - the trail sets the OUTCOME, not a weight: a clean first-try win is C0; misses before the win make it a later try
//     (C1); hints are rungs (one → C2, two or three → C3, four → C4); a level given up is C4. A mal-rule a miss matched rides
//     on the event as its misconception (a hit), as on a lesson's closing event. Undos and steps against the solver's minimum
//     are not knowledge evidence and do not change it.
//   - the WEIGHT is the game's (×0.5, bktr.js SOURCE_WEIGHT.home) and, for a goal one tap can win by chance, the chance weight
//     (controllerEasy, ×0.5 more), as in a lesson's games.
//   - the ledger (kt/ledger.js) never counts it as "unaided", never lets it be or spend the delayed check, caps its evidence
//     per skill per learning day (HOME_DAY_LOG_CAP) and gives it at most one learning step a day.
// Ids start "home:" (kt_evidence.via has no "home"; the id is what a replay reads, bktr.js isHomePlay).
import { openOutcome } from "./adapter.js";
import { outcomeIndex } from "./outcomes.js";

/**
 * @param {{ childId: string, day: string, levelId: string, skillId: string, at: string, n?: number, won: boolean,
 *   misses?: number, hints?: number, malRules?: string[], chance?: boolean, topicType?: string }} r  day: the learning day
 * @returns {import("../../../shared/learner").EvidenceEvent}
 */
export function homePlayEvent(r) {
  const misses = Math.max(0, Number(r.misses) || 0), hints = Math.max(0, Number(r.hints) || 0);
  const name = openOutcome({ correct: !!r.won, triesBefore: misses, rungs: hints, episodeEnded: true });
  const mis = (r.malRules ?? []).filter(Boolean).at(-1);
  const sessionId = `home:${r.childId}:${r.day}`;
  return {
    id: `${sessionId}:${r.levelId}:${r.n ?? 0}`, sessionId, sessionStartAt: new Date(`${r.day}T00:00:00Z`).toISOString(), at: r.at,
    episodeId: `${sessionId}:${r.levelId}`, skillIds: [r.skillId], target: r.skillId, itemKey: `play:${r.levelId}`,
    cls: "item.open", outcome: outcomeIndex("item.open", name), grader: "code", graderVersion: "home-play-v1", topicType: r.topicType ?? "T3",
    via: "game", ...(r.chance ? { controllerEasy: true } : {}), ...(mis ? { misconceptionId: mis } : {}),
  };
}
