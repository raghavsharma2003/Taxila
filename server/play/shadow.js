// Gate 2, dc-r8-gate2-shadow S1 (docs/design/round8/games-judging/RULINGS-2026-11-16-gate2-second-reading.md): naming runs
// in shadow. In a mode under shared/play.ts NAMING_SHADOW, at each level's end, the naming rules as built (the grade's own
// naming, and nameOnRepeat over the session's sightings: H1 to H7, the discriminating level, the computed default) are run
// on the level's UNSTRIPPED grade against the session's shadow memory, and what they decide is `wouldName`:
//
//   null                 the rules would name nothing on this level
//   { mis, rule, by, sightings, levels }
//     mis        the kit misconception they would name
//     rule       the family's mal-rule id for it on this level
//     by         "repeat" (a pick seen on enough levels: nameOnRepeat) or "act" (the grade names it from her act at once)
//     sightings  how many sightings the naming rests on (this level's included)
//     levels     their level ids, oldest first, this level last
//
// It is written to the level's trail and its trace (server/play/routes.js) and nowhere else: the teacher's facts row, the
// seam, the evidence rows and tokens and so the learner model keep NAMING_OFF's and H5's (an ordinary miss at GAME_WEIGHT).
// The shadow memory (`shadow` on the session body) is the chance memory naming would keep (afterLevelBody), with each
// sighting's level id; nextBody never reads it, so no level is steered by it and nothing she sees changes. Pure.
import { namingShadow } from "../../shared/play.ts";
import { afterLevelBody, nameOnRepeat } from "./levels.js";
import { lessonEvidence } from "./grade.js";

/**
 * → { wouldName, shadow } for a level that ended (`rawGrade`: gradeActs' grade BEFORE withNaming), or null when the mode is
 * not in shadow. `shadow` is the session's next shadow memory.
 */
export function shadowOf(rawGrade, s, level) {
  if (!rawGrade || !level || !namingShadow(level.family, level.mode)) return null;
  const memory = Array.isArray(s?.shadow) ? s.shadow : [];
  const ss = { ...s, chance: memory };
  const why = [];
  const rows = nameOnRepeat(lessonEvidence(rawGrade, level), ss, level, why);
  const hit = rows.find((r) => r?.misconceptionId) ?? null;
  let wouldName = null;
  if (hit) {
    const mis = hit.misconceptionId, by = hit.named === "repeat" ? "repeat" : "act";
    const rule = Object.keys(level.mal ?? {}).find((k) => level.mal[k] === mis) ?? null;
    const prior = by === "repeat" ? (why.find((w) => w.kit === mis)?.counted ?? []) : [];
    wouldName = { mis, rule, by, sightings: prior.length + 1, levels: [...prior.map((x) => x?.levelId ?? null), level.levelId] };
  }
  // the chance memory naming would keep, from the same unstripped grade (only the sighting it adds is read here)
  const after = afterLevelBody(ss, { grade: rawGrade, level });
  const next = Array.isArray(after.chance) && after.chance !== memory
    ? after.chance.map((x, i, a) => (i === a.length - 1 ? { ...x, levelId: level.levelId } : x)) : memory;
  return { wouldName, shadow: next };
}
