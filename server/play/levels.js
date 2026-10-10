// Server-side level picking (DESIGN.md §3, §9): the coverage entry for the skill/topic, the learner inputs, the pure
// picker shared with the client. No model is called on the play path (the latency table in DESIGN.md §9).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { logicFor } from "../../src/play/families/index.ts";
import { pickLevels } from "../../src/play/core/pick.ts";
import { pickArt } from "../../shared/play.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
let COVERAGE = null;
/** data/play/coverage.json (built by server/play/tools/build-coverage.mjs), loaded once. */
export function coverage() {
  COVERAGE ??= JSON.parse(readFileSync(join(ROOT, "data/play/coverage.json"), "utf8"));
  return COVERAGE;
}
/** Test seam. */
export function setCoverage(c) { COVERAGE = c; }

/**
 * The coverage entry for a request: a skill (the Director's admission) or a topic; `goal` narrows when a topic has several.
 * The first entry in file order wins (RULES order puts the core mechanic of a topic first).
 */
/** The play kill switch (BUILD-PLAN §5 release flags): TAXILA_PLAY=off admits nothing, so no play piece is built anywhere
 *  (asked, at a beat, /api/play/start) and the Director's admission says no; the lesson keeps its board and voice. */
export const playOff = (env = process.env) => env.TAXILA_PLAY === "off";
/** The 3D-only kill switch: TAXILA_PLAY_3D=off serves every level to the round-3 2D view (a rollback of the engines alone). */
export const play3dOff = (env = process.env) => env.TAXILA_PLAY_3D === "off";

export function entryFor({ skillId = null, topicId = null, family = null, goal = null } = {}, cov = coverage()) {
  if (playOff()) return null;
  const ok = (e) => (!family || e.family === family) && (!goal || e.goal === goal);
  // round 3 fix (adversarial B1): admission is by SKILL. A lesson that names its skill gets only a game whose act exercises
  // that skill (coverage ACTS), never the topic's other game: "game khelna hai" in an addition lesson served the
  // subtraction game and its evidence. Only a turn with no skill known (a hook) falls back to the topic, and that game's
  // evidence is on its own skill (startSession: entry.skillId).
  if (skillId) return cov.entries.find((x) => ok(x) && x.skillIds.includes(skillId)) ?? null;
  if (topicId) { const e = cov.entries.find((x) => ok(x) && x.topicId === topicId); if (e) return e; }
  return null;
}
export const entryKey = (e) => `${e.topicId}|${e.family}/${e.mode}|${e.goal}`;
export function entryByKey(key, cov = coverage()) { return cov.entries.find((e) => entryKey(e) === key) ?? null; }
/** Is there a play game for this skill? (the Director's admission check, patched in by docs/design/round3/play/patches) */
export const hasPlay = (skillId, cov = coverage()) => !playOff() && cov.entries.some((e) => e.skillIds.includes(skillId));

/** The picker's request from a session body (the same body always yields the same levels: the picker is pure). */
export function genRequest(s, entry) {
  return {
    family: entry.family, mode: entry.mode, topicId: entry.topicId, skillId: s.skillId ?? entry.skillId, classLevel: s.classLevel, fade: s.fade,
    goal: entry.goal, mis: s.mis ?? {}, misMap: entry.misMap, grammar: entry.grammar, recent: s.recent ?? [], seed: s.seed, harder: !!s.harder,
    ...(typeof s.pL === "number" ? { pL: s.pL } : {}),
    ...(s.focus ? { focus: s.focus } : {}),
  };
}
/** → { garam, teekha, ms, considered, served } or null. */
export function levelsFor(s, entry) {
  const logic = logicFor(entry.family, entry.mode);
  if (!logic) return null;
  return pickLevels(logic, genRequest(s, entry));
}
/** The level a session body points at (its door decides garam / teekha; a teekha body with no harder candidate at its
 *  fade was already moved one fade up by nextBody, so this never silently serves an easier level behind a "harder" door). */
export function currentLevel(s, entry) {
  const r = levelsFor(s, entry);
  if (!r) return null;
  return s.door === "teekha" && r.teekha ? r.teekha : r.garam;
}
/**
 * The session body of the level behind a door (round 4 G1). ONE rule for the door preview (doorsFor) and /api/play/next,
 * so the level a door shows is the level the child gets:
 *   - novelty: the level just played joins `recent` BEFORE the next level is generated (the token then regenerates that
 *     same level from the same body); the picker compares signatures (`level.sig`);
 *   - "teekha" with no harder candidate at this fade moves one fade up (less scaffold) instead of offering nothing.
 */
export function nextBody(s, entry, door) {
  const n = (s.n ?? 0) + 1;
  const played = currentLevel(s, entry);
  const recent = [...(s.recent ?? []), played?.sig ?? played?.levelId].filter(Boolean).slice(-6);
  // the misconception the level just played confirmed (set by /api/play/act at its end) becomes the next level's focus
  const focus = s.nextFocus ?? s.focus ?? null;
  const body = { ...s, n, seed: seedOf(s.childId, s.key, n), door, harder: false, recent, ...(focus ? { focus } : {}) };
  delete body.nextFocus;
  if (door === "teekha") {
    const r = levelsFor(body, entry);
    if (r && !r.teekha && (body.fade ?? 1) < 3) return { ...body, fade: (body.fade ?? 1) + 1, door: "garam", up: true };
  }
  return body;
}
export function artFor(s, entry) {
  return pickArt({ family: entry.family, subject: entry.subject === "maths" ? "maths" : "science", topicId: entry.topicId, classLevel: s.classLevel, topicArts: entry.arts, childArt: s.childArt ?? null, lastArt: s.lastArt ?? null });
}
/** A seed from the child, the entry and a counter (no clock: the same session replays the same levels). */
export function seedOf(childId, key, n = 0) {
  let h = 2166136261;
  for (const ch of `${childId}|${key}|${n}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 1_000_000_007;
}
