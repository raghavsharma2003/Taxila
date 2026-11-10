// Server-side level picking (DESIGN.md §3, §9): the coverage entry for the skill/topic, the learner inputs, the pure
// picker shared with the client. No model is called on the play path (the latency table in DESIGN.md §9).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { logicFor } from "../../src/play/families/index.ts";
import { pickLevels } from "../../src/play/core/pick.ts";
import { pickArt } from "../../shared/play.ts";
import { registerKaalEvents } from "../../src/play/families/kaal/kaal.logic.ts";
import { fillFriendDeep } from "../director/friend.js";
import { adaptAfter, chooseEntry, liftedPL, settleBecause } from "./choose.js";
import { nextSaid, whyLine } from "./why.js";

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
/** Round 8 P1: EVERY coverage entry admitting the skill (across families and modes), in file order (the first is
 *  entryFor's). A turn with no skill known keeps the topic's one entry (its evidence is on that entry's own skill). */
export function entriesFor({ skillId = null, topicId = null, family = null, goal = null } = {}, cov = coverage()) {
  if (playOff()) return [];
  const ok = (e) => (!family || e.family === family) && (!goal || e.goal === goal);
  if (skillId) return cov.entries.filter((x) => ok(x) && x.skillIds.includes(skillId));
  const e = entryFor({ topicId, family, goal }, cov);
  return e ? [e] : [];
}
/** The kit's belief text for a kit misconception id (data/kits/<class>-<subject>.json), for a `because` fact; the id when
 *  the kit has none. Each kit file is read once, and only when a because needs its text. */
const KIT_BELIEFS = new Map();
export function beliefOf(misId) {
  const m = /^(c\d-[a-z]+)-/.exec(String(misId ?? ""));
  if (!m) return misId ?? null;
  if (!KIT_BELIEFS.has(m[1])) {
    const map = new Map();
    try { for (const t of JSON.parse(readFileSync(join(ROOT, "data/kits", `${m[1]}.json`), "utf8")).topics ?? []) for (const x of t.misconceptions ?? []) if (x?.id && x.belief) map.set(x.id, String(x.belief)); } catch { /* the id stands */ }
    KIT_BELIEFS.set(m[1], map);
  }
  return KIT_BELIEFS.get(m[1]).get(misId) ?? misId;
}
export const entryKey = (e) => `${e.topicId}|${e.family}/${e.mode}|${e.goal}`;
export function entryByKey(key, cov = coverage()) { return cov.entries.find((e) => entryKey(e) === key) ?? null; }
/** Is there a play game for this skill? (the Director's admission check, patched in by docs/design/round3/play/patches) */
export const hasPlay = (skillId, cov = coverage()) => !playOff() && cov.entries.some((e) => e.skillIds.includes(skillId));

/** ITEM-ARENA (r7 revival): data/arena/<bank>.json, built from verified kit items by tools/build-arena.mjs, loaded once per file. */
const BANKS = new Map();
export function arenaItems(bank, topicId) {
  if (!/^c\d-[a-z]+$/.test(String(bank))) return [];
  if (!BANKS.has(bank)) { try { BANKS.set(bank, JSON.parse(readFileSync(join(ROOT, "data/arena", `${bank}.json`), "utf8")).challenges ?? []); } catch { BANKS.set(bank, []); } }
  return BANKS.get(bank).filter((c) => c.topicId === topicId);
}
/** Kaal (r7): data/play/kaal/events.json (the kits' dated events, built and checked by tools/build-kaal.mjs), loaded once.
 *  The file is registered with the kaal law so validate refuses a stone whose year differs from it. */
let KAAL = null;
export function kaalEvents(topicId) {
  if (!KAAL) {
    try { KAAL = JSON.parse(readFileSync(join(ROOT, "data/play/kaal/events.json"), "utf8")).events ?? []; } catch { KAAL = []; }
    registerKaalEvents(KAAL);
  }
  return KAAL.filter((e) => e.topicId === topicId).map(({ id, year, circa, decade, label }) => ({ id, year, circa, ...(decade ? { decade } : {}), label }));
}
kaalEvents("");
/** VAKYA (r7, English / Hindi grammar): data/play/vakya/<bank>.json, built from verified kit items by tools/build-vakya.mjs. */
const VAKYA = new Map();
export function vakyaItems(bank, topicId) {
  if (!/^c\d-(english|hindi)$/.test(String(bank))) return [];
  if (!VAKYA.has(bank)) { try { VAKYA.set(bank, JSON.parse(readFileSync(join(ROOT, "data/play/vakya", `${bank}.json`), "utf8")).items ?? []); } catch { VAKYA.set(bank, []); } }
  return VAKYA.get(bank).filter((c) => c.topicId === topicId);
}
/** The arena's challenges, kaal's events and vakya's sentence trains ride the request (grammar.items / grammar.events); the
 *  client never loads a bank or the events file. */
const grammarOf = (entry) => (entry.family === "arena" && entry.grammar?.bank ? { ...entry.grammar, items: arenaItems(entry.grammar.bank, entry.topicId) }
  : entry.family === "vakya" && entry.grammar?.bank ? { ...entry.grammar, items: vakyaItems(entry.grammar.bank, entry.topicId) }
  : entry.family === "kaal" ? { ...entry.grammar, events: kaalEvents(entry.topicId) } : entry.grammar);
/** The picker's request from a session body (the same body always yields the same levels: the picker is pure). */
export function genRequest(s, entry) {
  return {
    family: entry.family, mode: entry.mode, topicId: entry.topicId, skillId: s.skillId ?? entry.skillId, classLevel: s.classLevel, fade: s.fade,
    goal: entry.goal, mis: s.mis ?? {}, misMap: entry.misMap, grammar: grammarOf(entry), recent: s.recent ?? [], seed: s.seed, harder: !!s.harder,
    // round 8 P2: her pL plus the session's between-level lift (a clean first-try win steps the band up); no lift = s.pL
    ...(typeof liftedPL(s) === "number" ? { pL: liftedPL(s) } : {}),
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
/**
 * The level the child is served (and graded against: every route regenerates it). Kit-derived text (arena challenges,
 * vakya trains) keeps its {friendF}/{friendM}/{friend} slots in the banks; they are filled HERE, at serve time, with a
 * name that is never the child's own (server/director/friend.js) — the builders never fill. The fill touches strings only,
 * so the levelId is the unfilled one and the same for every child.
 */
export function currentLevel(s, entry, childName = "") {
  const r = levelsFor(s, entry);
  if (!r) return null;
  return fillFriendDeep(s.door === "teekha" && r.teekha ? r.teekha : r.garam, childName);
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
  // round 8 P2: the band step the level just played earned (set by /act at its end), and its pending because; follow-up D: a
  // step down to lift 0 is the unlifted band again
  const lift = Number(s.nextLift ?? s.lift) || 0;
  const pending = s.nextBecause ?? null;
  // follow-up B: the family switch /act decided (at most once a session): the next level is the other entry's
  const to = (s.nextKey && entryByKey(s.nextKey)) || entry;
  const key = to === entry ? s.key : entryKey(to);
  const sw = to !== entry ? s.nextSwitch ?? null : null;
  let body = { ...s, key, n, seed: seedOf(s.childId, key, n), door, harder: false, recent, ...(focus ? { focus } : {}) };
  if (lift > 0) body.lift = lift; else delete body.lift;
  if (to !== entry) body.switched = { from: s.key, n };
  delete body.nextFocus; delete body.nextLift; delete body.nextBecause; delete body.nextKey; delete body.nextSwitch;
  delete body.because;   // a because explains ONE level's choice (round 8); the next level carries its own or none
  delete body.why;
  if (door === "teekha") {
    const r = levelsFor(body, to);
    if (r && !r.teekha && (body.fade ?? 1) < 3) body = { ...body, fade: (body.fade ?? 1) + 1, door: "garam", up: true };
  }
  // the step's because is kept only when the level served does what it claims (a mix-up claim needs a level showing it);
  // a switch's because is the switch itself (it happened)
  const level = currentLevel(body, to);
  const b = [sw ? settleBecause(sw, level) : null, pending ? settleBecause(pending, level) : null].filter(Boolean);
  if (b.length) body.because = b;
  return withWhy(body, level);
}

/** The coverage entry a session body points at (after a switch, the new one). */
export const entryOfBody = (s, fallback = null) => entryByKey(s?.key) ?? fallback;

/**
 * Round 8 H: the child's "why this game" line for the level a body serves (server/play/why.js; display only), with the
 * reasons already spoken this session. Mutates and returns the body.
 */
export function withWhy(body, level) {
  delete body.why;
  const w = level ? whyLine(body.because, { lang: body.lang, seed: body.seed, level, said: body.whySaid ?? [] }) : null;
  if (!w) return body;
  body.why = { text: w.text, speak: w.speak, reason: w.reason };
  const said = nextSaid(body.whySaid, w);
  if (said.length) body.whySaid = said;
  return body;
}

/**
 * Follow-up B: a later level may switch family at most once a session, only when the session focus CHANGES to a mix-up
 * another entry admitting the skill discriminates better (chooseEntry's score, by its MARGIN; novelty is not counted).
 * → { key, because } | null. Pure (the picker is pure).
 */
export function switchAfter(s, cur, focus) {
  if (!cur || !focus || s.switched || focus === (s.focus ?? null) || !s.skillId) return null;
  const all = entriesFor({ skillId: s.skillId });
  if (all.length < 2 || !all.includes(cur)) return null;
  const entries = [cur, ...all.filter((e) => e !== cur)];
  const n = (s.n ?? 0) + 1;
  const lift = Number(s.nextLift ?? s.lift) || 0;
  const bodyOf = (e, f) => { const key = entryKey(e); const b = { ...s, key, n, seed: seedOf(s.childId, key, n), door: "garam", harder: false, ...(f ? { focus: f } : {}) }; if (lift > 0) b.lift = lift; else delete b.lift; return b; };
  const levelOf = (e, f) => levelsFor(bodyOf(e, f), e)?.garam ?? null;
  const pL = liftedPL({ ...s, lift });
  const pick = chooseEntry({ entries, inputs: { mis: s.mis ?? {}, ...(typeof pL === "number" ? { pL } : {}), focus, focusSource: "play_grade" }, levelOf, recent: {}, keyOf: entryKey, beliefOf });
  if (!pick || pick.entry === cur) return null;
  if (!(levelOf(pick.entry, focus)?.proof?.discriminates ?? []).includes(focus)) return null;
  return { key: entryKey(pick.entry), because: { choice: `switch to ${pick.entry.family}/${pick.entry.mode}`, fact: beliefOf(focus) ?? focus, source: "play_grade", kind: "play.switch", when: "now", mis: focus } };
}

/**
 * Round 8 P2: the session body after a level's acts (what /api/play/act signs). Between levels only: the CURRENT level's
 * inputs never change (nextFocus / nextLift / nextBecause / nextKey are read by nextBody, never by genRequest).
 */
export function afterLevelBody(s, { grade = null, level = null, history = null } = {}) {
  const s2 = { ...s, hist: history };
  if (!grade || !level) return s2;
  const seen = (grade.evidence ?? []).find((r) => r.misconceptionId)?.misconceptionId ?? null;
  if (seen) s2.nextFocus = seen;
  const step = adaptAfter({ grade, level, s, beliefOf });
  if (typeof step?.lift === "number") s2.nextLift = step.lift;
  if (step?.because) s2.nextBecause = step.because;
  // follow-up B: the focus changed to a mix-up another game tells apart better → that game next (once a session)
  const sw = seen ? switchAfter({ ...s, ...(typeof s2.nextLift === "number" ? { nextLift: s2.nextLift } : {}) }, entryByKey(s.key), seen) : null;
  if (sw) { s2.nextKey = sw.key; s2.nextSwitch = sw.because; }
  return s2;
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
