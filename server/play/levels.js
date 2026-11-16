// Server-side level picking (DESIGN.md §3, §9): the coverage entry for the skill/topic, the learner inputs, the pure
// picker shared with the client. No model is called on the play path (the latency table in DESIGN.md §9).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { logicFor } from "../../src/play/families/index.ts";
import { pickLevels } from "../../src/play/core/pick.ts";
import { GAME_WEIGHT, discriminatingPair, factsUntilNamed, pickArt, sameSighting } from "../../shared/play.ts";
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
    // gate 2 (dc-r8-gate2-discriminating-level): the level's place in the session (kon/place's level mix by the fourth), and
    // the base directions of the placement sightings this session remembered when the level was chosen (nextBody: the body
    // keeps them, so the level a body points at never changes after its own acts)
    ...(Number.isInteger(s.n) ? { n: s.n } : {}),
    ...(Array.isArray(s.bases) && s.bases.length ? { bases: s.bases } : {}),
    // gate 2 (note 004, answer 1): what of each sighting's level steers the next (kon/place wrong-scale: the side it opens to)
    ...(Array.isArray(s.steers) && s.steers.length ? { steers: s.steers } : {}),
  };
}
/**
 * Gate 2 (answer 1): the base directions of the placement sightings in a session's chance memory ({ mis, base } for each
 * sighting whose act carries a base: FamilyLogic.sightingOf), by which the next level is steered. Pure.
 */
export function basesOf(chance) {
  return (Array.isArray(chance) ? chance : []).filter((x) => x?.act && typeof x.act === "object" && Number.isFinite(x.act.base)).map((x) => ({ mis: x.mis, base: x.act.base }));
}
/**
 * Gate 2 (note 004, answer 1): what of each sighting's level steers the next ({ mis, ...steer } for each sighting in a
 * session's chance memory that kept one: FamilyLogic.steerOf), oldest first. Pure.
 */
export function steersOf(chance) {
  return (Array.isArray(chance) ? chance : []).filter((x) => x?.steer && typeof x.steer === "object").map((x) => ({ ...x.steer, mis: x.mis }));
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
  // gate 2 (answer 1): the placement sightings so far steer the next level (genRequest's bases), fixed with the level
  const bases = n < NAMING_LEVELS ? basesOf(s.chance) : [];
  if (bases.length) body.bases = bases; else delete body.bases;
  const steers = n < NAMING_LEVELS ? steersOf(s.chance) : [];
  if (steers.length) body.steers = steers; else delete body.steers;
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
  // round 8 law 3: a mix-up seen from one pick is remembered (not named) with the surface it was seen on; the next level
  // aims at it, so a second sighting on another surface can name it (nameOnRepeat)
  const pickRow = (grade.evidence ?? []).find((r) => r.chanceMis && !r.misconceptionId) ?? null;
  const pick = pickRow?.chanceMis ?? null;
  // (dc-r8-gate2-shadow S3: a sighting on a level where a habit gives the mix-up's act is not remembered; the next level
  // still aims at the mix-up)
  if (pick && !sightingCounts(level, pick, s)) { if (!seen) s2.nextFocus = pick; }
  else if (pick) {
    // gate 2: a sighting no single ordinary slip could have made is kept as firm (the family's firmSighting)
    const firm = firmOf(level, pick);
    // the computed default's k on this level rides with the sighting (a family spec needs none: namingSpec)
    const k = defaultK(level, pick);
    // gate 2 (note 004, answer 1): what of this level steers the next (the family's steerOf)
    const steer = steerOfLevel(level, pick);
    s2.chance = [...(Array.isArray(s.chance) ? s.chance : []), { mis: pick, surface: surfaceOf(level), ...(firm ? { firm: true } : {}), ...(k !== null ? { k: Number.isFinite(k) ? k : 0 } : {}), ...(pickRow.chanceAct !== undefined ? { act: pickRow.chanceAct } : {}), ...(steer ? { steer } : {}) }].slice(-CHANCE_MEMORY);
    if (!seen) s2.nextFocus = pick;
  }
  const step = adaptAfter({ grade, level, s, beliefOf });
  if (typeof step?.lift === "number") s2.nextLift = step.lift;
  if (step?.because) s2.nextBecause = step.because;
  // follow-up B: the focus changed to a mix-up another game tells apart better → that game next (once a session)
  const sw = seen ? switchAfter({ ...s, ...(typeof s2.nextLift === "number" ? { nextLift: s2.nextLift } : {}) }, entryByKey(s.key), seen) : null;
  if (sw) { s2.nextKey = sw.key; s2.nextSwitch = sw.because; }
  return s2;
}
const surfaceHash = (s) => {
  let h = 2166136261;
  for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
};
/**
 * round 8 law 3: what a level shows (the family's surfaceOf, else its params), as a short key. A family that gives parts
 * (an array: gate 2, stambh/tally read's bundles and loose lines) gets one key per part. Pure.
 */
export function surfaceOf(level) {
  let k = null;
  try { k = logicFor(level.family, level.mode)?.surfaceOf?.(level) ?? null; } catch { k = null; }
  const fm = `${level?.family}/${level?.mode}`;
  if (Array.isArray(k) && k.length && k.every((x) => typeof x === "string" && x)) return k.map((x, i) => surfaceHash(`${fm}|${i}|${x}`));
  const str = typeof k === "string" && k ? k : JSON.stringify(level?.params ?? null);
  return surfaceHash(`${fm}|${str}`);
}
/**
 * Two surfaces differ: keys, when they are not the same; parts, only when EVERY part differs (gate 2: tally read's
 * second level must change both its bundles and its loose lines). A key and parts never count as different.
 */
export function surfacesDiffer(a, b) {
  if (typeof a === "string" && typeof b === "string") return a !== b;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.length) return a.every((x, i) => x !== b[i]);
  return false;
}
/** the picks a session remembers (gate 2: kon/place's join needs three before the fourth) */
export const CHANCE_MEMORY = 6;
/**
 * Gate 2, the per-session reading of law 3 (RULINGS-2026-11-15, "To Games, 2026-11-16"): what must be rare is a child named
 * a mix-up she does not hold over one sitting. A session has no end of its own (/api/play/next can always be asked again,
 * and every act signs the token afresh), so the session figure needs a count of levels: every pick (a family's gate-2
 * spec, FamilyLogic.chanceRepeat, or the computed default, namingSpec) is named only on the session's first NAMING_LEVELS
 * levels (its body's n, 0-based, set by the server). Every figure is proved over this many levels (the gate-2 tests,
 * tests/r8-picks-default.test.mjs); later levels of the session still grade right or wrong, and name no pick. The ruling's
 * unit is the child's day (per child, per mode, per day); the count is still the session's (the gap: each gate-2 PACKET.md).
 */
export const NAMING_LEVELS = 4;
const differOn = (a, b, apart) => (!apart ? surfacesDiffer(a, b)
  : Array.isArray(a) && Array.isArray(b) && a.length === b.length && apart.every((i) => typeof a[i] === "string" && a[i] !== b[i]));
/** a sighting as remembered: its surface (a key or parts) and whether it is firm; a bare surface is not firm */
const sighting = (x) => (x && typeof x === "object" && !Array.isArray(x) && "surface" in x ? { surface: x.surface, firm: !!x.firm } : { surface: x, firm: false });
/**
 * Gate 2: are the sightings enough to name a pick's mix-up? `prior` are the sightings before (surfaces, or { surface, firm }),
 * `here` this level's. With no spec: one prior on a surface that differs (nameOnRepeat always passes one: namingSpec). With a
 * spec: `sightings` levels in all (this one included) whose surfaces
 * differ two by two on the `apart` parts (every part when absent), and, with `cover`, not all the same on that part; with
 * `firm`, that many are enough when one of them is firm (a sighting no single ordinary slip makes: the family's
 * firmSighting). Pure.
 */
export function repeatMet(prior, here, spec = null) {
  const need = Math.max(2, Number(spec?.sightings) || 2), apart = spec?.apart ?? null, cover = spec?.cover;
  const needFirm = Math.max(2, Math.min(need, Number(spec?.firm) || need));
  const all = prior.map(sighting), h = sighting(here);
  const part = (x) => (Array.isArray(x) ? x[cover] : x);
  const enough = (chosen) => {
    const set = [...chosen, h];
    // (dc-r8-gate2-discriminating-level: a spec with needFirm is never met without a firm sighting among them)
    if (spec?.needFirm && !set.some((x) => x.firm)) return false;
    if (set.length < (set.some((x) => x.firm) ? needFirm : need)) return false;
    return cover === undefined || new Set(set.map((x) => part(x.surface))).size > 1;
  };
  const pick = (from, chosen) => {
    if (enough(chosen)) return true;
    if (chosen.length >= need - 1) return false;
    for (let i = from; i < all.length; i++) {
      const c = all[i];
      if ([...chosen, h].every((x) => differOn(x.surface, c.surface, apart)) && pick(i + 1, [...chosen, c])) return true;
    }
    return false;
  };
  return pick(0, []);
}
/** the family's mal-rule id for a kit misconception on this level */
const ruleOf = (level, kit) => Object.keys(level?.mal ?? {}).find((k) => level.mal[k] === kit) ?? null;
/** gate 2: the family's spec for a pick (chanceRepeat, by goal and mal-rule), or null */
export function repeatSpec(level, kit) {
  const rule = ruleOf(level, kit);
  try { return rule ? logicFor(level.family, level.mode)?.chanceRepeat?.[`${level.goal}:${rule}`] ?? null : null; } catch { return null; }
}
/**
 * The default for every other pick (RULINGS-2026-11-15, "the per-session reading" 2): a pick whose blind chance on a level
 * is p is named on the k-th sighting, k the smallest for which the chance of k or more in NAMING_LEVELS levels is under
 * LAW3_LINE (never fewer than 2: law 3 names nothing from one pick). 1/2 and 1/3 give 4, 1/4 to 1/7 give 3, 1/8 and below
 * give 2; a pick likelier than about 0.56 is never named (Infinity). A family's chanceRepeat overrides it.
 */
export const LAW3_LINE = 0.1;
/** P(k or more of n levels land), each at chance p (binomial) */
export function atLeastOf(n, p, k) {
  let total = 0, c = 1;
  for (let j = 0; j <= n; j++) { if (j >= k) total += c * p ** j * (1 - p) ** (n - j); c = (c * (n - j)) / (j + 1); }
  return total;
}
export function defaultSightings(p, n = NAMING_LEVELS) {
  for (let k = 2; k <= n; k++) if (atLeastOf(n, p, k) < LAW3_LINE) return k;
  return Infinity;
}
/** a pick whose options could not be read is taken at the worst a pick among a few can be (one in two) */
export const UNREAD_PICK = 1 / 2;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const tryOr = (f, d = null) => { try { return f(); } catch { return d; } };
/**
 * The options of the pick that shows mal-rule `rule` on this level: act sequences, one per option, the same lead-in and the
 * same acts after. The family's own pickOptions when it has one (FamilyLogic.pickOptions); otherwise read from the family's
 * own acts for the level: where the mix-up's acts (malActs) first part from the solve, the options are its act, what the
 * solve and every other mal-rule's acts do at that point after the same lead-in, and its act with the value the solve picks
 * there. That is a FLOOR on the options (a wrong option no rule spells out is not seen), so the chance it gives is never
 * below the pick's true one. null: the level has no such pick. Pure.
 */
export function pickOptions(level, rule, logic = tryOr(() => logicFor(level.family, level.mode))) {
  if (!logic || !rule) return null;
  if (typeof logic.pickOptions === "function") { const o = tryOr(() => logic.pickOptions(level, rule)); return Array.isArray(o) && o.length ? o : null; }
  const acts = tryOr(() => logic.malActs(level, rule));
  if (!Array.isArray(acts) || !acts.length) return null;
  const sol = tryOr(() => logic.solve(level)) ?? [];
  const seqs = [sol, ...(logic.malRules ?? []).filter((r) => r !== rule).map((r) => tryOr(() => logic.malActs(level, r)))].filter((x) => Array.isArray(x) && x.length);
  let i = acts.findIndex((a, k) => !same(a, sol[k]));
  if (i < 0) i = acts.length - 1;
  const lead = acts.slice(0, i), here = acts[i], opts = [here];
  const add = (a) => { if (a && typeof a === "object" && !opts.some((o) => same(o, a))) opts.push(a); };
  for (const s of seqs) if (s.length > i && lead.every((a, k) => same(a, s[k]))) add(s[i]);
  // the same act with the solve's choice in it (the fields where the two differ), when the solve makes that act here
  const r = sol[i];
  if (r && r.kind === here.kind) {
    const diff = Object.keys(here).filter((f) => f !== "kind" && f in r && !same(here[f], r[f]));
    if (diff.length) add({ ...here, ...Object.fromEntries(diff.map((f) => [f, r[f]])) });
  }
  return opts.map((a) => [...lead, a, ...acts.slice(i + 1)]);
}
/** does this act sequence show the kit mix-up on the level (the grade's first decision: chanceMis or misconceptionId)? */
function shows(logic, level, acts, kit) {
  const g = tryOr(() => logic.grade(level, acts.map((act, i) => ({ seq: i + 1, t: i, via: "touch", act }))));
  const r = g?.evidence?.[0];
  return !!r && (r.chanceMis === kit || r.misconceptionId === kit);
}
/**
 * The blind chance of a pick on this level: the share of its options (pickOptions) that show the mix-up, replayed through
 * the family's own grade. → { p, options } or null (no pick here, or none of its options shows it). Pure.
 */
export function blindChance(level, kit) {
  const rule = ruleOf(level, kit), logic = tryOr(() => logicFor(level.family, level.mode));
  const opts = rule && logic ? pickOptions(level, rule, logic) : null;
  if (!opts) return null;
  const hits = opts.filter((acts) => shows(logic, level, acts, kit)).length;
  // every option showing it means the split read is not where she picks: unread (UNREAD_PICK)
  return hits && hits < opts.length ? { p: hits / opts.length, options: opts.length } : null;
}
/** gate 2, the default: the sightings a pick needs on this level's blind chance (defaultSightings), or null with a family spec */
export function defaultK(level, kit) {
  if (repeatSpec(level, kit)) return null;
  const b = blindChance(level, kit);
  return defaultSightings(b ? b.p : UNREAD_PICK);
}
/**
 * gate 2: the sightings a pick needs (the family's chanceRepeat spec, else the computed default). The default is the most
 * that this level or any remembered sighting of the same mix-up calls for (`prior`: the session's chance memory, each with
 * the k of its own level; 0 is never), so a level where a guess is likelier never lets the pick through on fewer sightings.
 */
export function namingSpec(level, kit, prior = []) {
  const own = repeatSpec(level, kit);
  if (own) return own;
  const ks = [defaultK(level, kit), ...prior.filter((x) => x?.mis === kit).map((x) => (x?.k === 0 ? Infinity : x?.k))].filter((k) => k === Infinity || (Number.isInteger(k) && k >= 2));
  return { sightings: Math.max(...ks), byDefault: true };
}
/** gate 2 (note 004, answer 1): what of this level a sighting of the pick keeps to steer the next (FamilyLogic.steerOf) */
function steerOfLevel(level, kit) {
  const rule = ruleOf(level, kit);
  try { const v = rule ? logicFor(level.family, level.mode)?.steerOf?.(level, rule) : null; return v && typeof v === "object" ? v : null; } catch { return null; }
}
/**
 * gate 2 (dc-r8-gate2-shadow S3): may this level's sighting of the pick count at all (FamilyLogic.sightingCounts, with the
 * session's served levels: `s.recent`, the last the level before this one)? A family that says no for a level where some
 * habit that is not the mix-up gives its act: the sighting is neither remembered (afterLevelBody) nor counted (nameOnRepeat).
 */
export function sightingCounts(level, kit, s) {
  const rule = ruleOf(level, kit);
  try { const f = rule ? logicFor(level.family, level.mode)?.sightingCounts : null; return !f || f(level, rule, { recent: Array.isArray(s?.recent) ? s.recent : [] }) !== false; } catch { return true; }
}
/** gate 2: is this level's sighting of the pick firm (no single ordinary slip makes it: FamilyLogic.firmSighting)? */
function firmOf(level, kit) {
  const rule = ruleOf(level, kit);
  try { return !!rule && !!logicFor(level.family, level.mode)?.firmSighting?.(level, rule); } catch { return false; }
}
/**
 * Round 8 law 3 (dc-r8-game-modes-three-laws): a mix-up from one pick among a few is not kept from that pick
 * (gradeLevel reports it as `chanceMis` at chance weight). It is named here when the session saw it from as many picks as
 * its blind chance calls for (namingSpec: the family's chanceRepeat, else the computed default), on levels whose surfaces
 * differ, within the session's first NAMING_LEVELS levels: the row then carries misconceptionId at the game weight. Pure.
 */
/**
 * Gate 2, H1 (dc-r8-gate2-habit-children): two sightings are two different acts. Of a pick's sightings in order (each with
 * what she did, `act`: FamilyLogic.sightingOf), only those whose act differs from EVERY earlier one count; a sighting with
 * no act (a family that gives none) always counts. → the sightings that count. Pure.
 */
export function distinctSightings(list) {
  const out = [];
  list.forEach((x, i) => {
    const a = x && typeof x === "object" ? x.act : undefined;
    if (a === undefined || a === null || !list.slice(0, i).some((y) => sameSighting(a, y?.act))) out.push(x);
  });
  return out;
}
export function nameOnRepeat(rows, s, level, why = null) {
  // gate 2, H5: in a mode under shared/play.ts FACTS_UNTIL_NAMED, a miss weighs GAME_WEIGHT whatever its form (a pick's miss
  // was CHANCE_WEIGHT, so its weight alone told the mix-up's form from any other miss); named rows are GAME_WEIGHT already
  const out = nameOnRepeatRows(rows, s, level, why);
  return factsUntilNamed(level?.family, level?.mode) ? out.map((r) => (r && r.outcome !== "correct" && r.weight !== GAME_WEIGHT ? { ...r, weight: GAME_WEIGHT } : r)) : out;
}
/** `why` (optional, dc-r8-gate2-shadow S1): each mix-up named here is pushed as { kit, counted }, the earlier sightings
 *  its naming rests on (server/play/shadow.js reads it) */
function nameOnRepeatRows(rows, s, level, why = null) {
  const prior = Array.isArray(s?.chance) ? s.chance : [];
  const here = prior.length ? surfaceOf(level) : null;
  // a row not named here leaves without its chanceMis: nothing about a mix-up from one pick reaches the lesson (evening
  // ruling kon/name 3); the session remembers it from the grade (afterLevelBody), not from these rows. What she did at the
  // pick (chanceAct, H1) never leaves the play server, named or not
  const bare = (r) => { if (!r || !("chanceAct" in r)) return r; const { chanceAct: _a, ...rest } = r; return rest; };
  const unnamed = (r) => { const { chanceMis: _c, chanceAct: _a, ...rest } = r; return rest; };
  // gate 2: every pick needs the sightings its blind chance calls for (the family's chanceRepeat, by goal and mal-rule, else
  // the computed default: namingSpec), and is named only on the session's first NAMING_LEVELS levels (the count its figure
  // is proved over)
  if (!((Number(s?.n) || 0) < NAMING_LEVELS)) return rows.map((r) => (!r?.chanceMis || r.misconceptionId ? bare(r) : unnamed(r)));
  const named = (kit, act) => {
    const mine = prior.filter((p) => p?.mis === kit);
    if (!mine.length) return false;
    // dc-r8-gate2-shadow S3: a sighting on a level where a habit that is not the mix-up gives its act does not count
    if (!sightingCounts(level, kit, s)) return false;
    // H1: this sighting counts only when what she did differs from every earlier sighting's act, and of the earlier ones
    // only those that differed from every one before them count
    if (act !== undefined && act !== null && mine.some((p) => sameSighting(act, p?.act))) return false;
    // dc-r8-gate2-discriminating-level (answer 1): of those, a placement counts with this one only on a level that tells the
    // held placement from a fixed finger (shared/play.ts discriminatingPair: base directions 45° or more apart, the same
    // offset in the protractor's frame, another on the board); a key counts as before
    const counted = distinctSightings(mine).filter((p) => discriminatingPair(act, p?.act));
    if (!counted.length) return false;
    const met = repeatMet(counted, { surface: here, firm: firmOf(level, kit) }, namingSpec(level, kit, prior));
    if (met && Array.isArray(why)) why.push({ kit, counted });
    return met;
  };
  return rows.map((r) => (!r?.chanceMis || r.misconceptionId ? bare(r)
    : named(r.chanceMis, r.chanceAct) ? { ...bare(r), misconceptionId: r.chanceMis, weight: GAME_WEIGHT, named: "repeat" } : unnamed(r)));
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
