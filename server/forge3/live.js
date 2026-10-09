// forge3 live build (round 3, stream forge): the child's interactive ask ("game khelna hai", "animation dikhao",
// "simulation") becomes a PLAY piece in the play stream's grammar (shared/play.ts play@1, docs/design/round3/play/
// GRAMMAR.md) when compose()'s ladder offers one, built in code with no model call:
//
//   ask → compose() (ladder: play → certified library game → keep the engine → board → voice; the visual-QA certificate
//   for the (family, mode, art) at the child's size; the excluded topics) → the play stream's own session start
//   (server/play/start.js: the coverage entry for the skill or topic, the family generator's solver-checked, shortcut-
//   free level, pickArt rotation) → a PlayArtifact for the Studio slot, carrying its BOARD TWIN (the family's board():
//   the same values drawn plainly) so a device whose box cannot lay the level out legibly shows the twin, never a
//   cramped game (src/studio/StudioStage.tsx).
//
// Measured before (docs/design/round3/forge/audit, taxila.dev web 145996f, 2026-10-09): 0/6 game / animation / simulation
// asks got anything the child could do. What this file does NOT do: author a level, a key, a word the child sees, or an
// art direction outside FAMILY_ARTS (GRAMMAR §1); grade (server/play/grade.js does, from raw acts); call a model.
//
// Never throws: a missing play stream, a coverage miss, a generator with no servable level or a DB error answers null
// and the caller keeps its own path (the board, the engine in the tray, voice).
import { compose, noteShown, playCertificates, playPassed } from "./compose.js";
import { topicParts } from "./art.js";

/** Bound on the learner-input read (2 small queries): past it the level is picked with the class defaults. */
export const LEARNER_READ_MS = 350;

let playMods = null;
async function play() {
  if (playMods) return playMods;
  try {
    const [start, fam] = await Promise.all([import("../play/start.js"), import("../../src/play/families/index.ts")]);
    playMods = { startSession: start.startSession, logicFor: fam.logicFor };
  } catch (e) { playMods = { error: String(e?.message ?? e).slice(0, 120) }; }
  return playMods;
}
export const _setPlay = (m) => { playMods = m; };

const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r("timeout"), ms))]);

/** On-screen values of the level as served (the family's own facts()): numbers and short strings only, ≤ 8. */
function factsOfLevel(logic, level) {
  let f = {};
  try { f = logic.facts(level, logic.init(level)) ?? {}; } catch { f = {}; }
  const on = {};
  for (const [k, v] of Object.entries(f)) {
    if (Object.keys(on).length >= 8) break;
    if (typeof v === "number" && Number.isFinite(v)) on[k] = v;
    else if (typeof v === "string" && v.length <= 24 && !/[<>{}\n]/.test(v)) on[k] = v;
  }
  return on;
}
/** The board twin: the family's board() over the level's first state; the shape src/studio/twinBoard.ts draws. */
function twinOfLevel(logic, level) {
  try {
    const b = logic.board(level, logic.init(level));
    if (!b || typeof b.title !== "string" || !Array.isArray(b.lines)) return null;
    return { board: { title: b.title.slice(0, 40), lines: b.lines.map(String).slice(0, 6) } };
  } catch { return null; }
}

/**
 * The live piece for an interactive ask, or null.
 * @param {{ ask: string, lessonId: string, child: { id: string, class_level?: number, language_pref?: string },
 *   skillId?: string|null, topicId?: string|null, vp?: string|null, moduleInTray?: boolean, safety?: boolean,
 *   lesson?: { shown?: object[], lastArt?: string|null }, childArt?: string|null }} m
 * @param {{ q?: Function, coverage?: any, certs?: any, playCerts?: any, now?: () => number }} [deps]
 * @returns {Promise<null | { rung: object, artifact: object, facts: object, boardTwin: object|null, level: object, artPick: object|null, lesson: object, why: string[], ms: number }>}
 */
export async function buildLive(m, deps = {}) {
  const t0 = Date.now();
  if (!m?.child?.id || m.safety) return null;
  const { classLevel } = topicParts(m.topicId);
  const plan = compose({ ask: m.ask, skillId: m.skillId ?? null, topicId: m.topicId ?? null, vp: m.vp ?? null, moduleInTray: !!m.moduleInTray,
    lesson: m.lesson ?? null, childArt: m.childArt ?? null, classLevel: m.child.class_level ?? classLevel ?? 6 },
    { ...(deps.coverage !== undefined ? { coverage: deps.coverage } : {}), ...(deps.certs ? { certs: deps.certs } : {}), ...(deps.playCerts !== undefined ? { playCerts: deps.playCerts } : {}) });
  // the first PLAY rung of the ladder: a library game ranked above it (variety: the same family twice in a row) is
  // Stagecraft's to serve and is not known to be available here (no host on a practice page), and a second "game" ask
  // must never fall to a board for want of it; variety then comes from the next level and the art rotation
  const rung = plan.ladder.find((x) => x.kind === "play") ?? null;
  if (!rung) return null;
  const P = await play();
  if (!P.startSession || !P.logicFor) return null;
  let q = deps.q;
  if (q === undefined) { try { q = (await import("../db.js")).q; } catch { q = undefined; } }
  let s = null;
  try {
    // the learner inputs (open misconceptions, P(skill)) steer the picker; a slow read falls back to the class defaults
    const o = { skillId: m.skillId ?? null, topicId: m.topicId ?? null, goal: rung.goal ?? null, lessonId: m.lessonId, art: m.childArt ?? null, lastArt: m.lesson?.lastArt ?? null };
    let r = await withTimeout(P.startSession(m.child, o, q), LEARNER_READ_MS);
    if (r === "timeout") r = await P.startSession(m.child, o, undefined);
    s = r;
  } catch { s = null; }
  if (!s?.level || !s.sessionId) return null;
  const logic = P.logicFor(s.level.family, s.level.mode);
  if (!logic) return null;
  // the visual-QA certificate for the art the play server picked (server/forge3/certs/play.json, play-cert.js): an art
  // that failed at this size (or at every size when the size is not known) is swapped for one of the family's arts that
  // passed; when none passed, no play piece (the caller's next rung shows). Never judged = allowed (reported in why).
  const table = deps.playCerts !== undefined ? deps.playCerts : playCertificates();
  const band = (m.child.class_level ?? classLevel ?? 6) <= 5 ? 4 : 7;
  const okArt = (a) => playPassed(table, s.level.family, s.level.mode, a, m.vp ?? null, band);
  if (s.art?.art && okArt(s.art.art) === false) {
    const alt = Object.keys(table?.pieces?.[`${s.level.family}/${s.level.mode}`] ?? {}).map((k) => k.split("@")[0]).find((a) => a !== s.art.art && okArt(a) === true);
    if (!alt) { plan.why.push(`play ${s.level.family}/${s.level.mode}: no art passed the visual QA${m.vp ? ` at ${m.vp}` : ""}`); return null; }
    try { const r2 = await P.startSession(m.child, { skillId: m.skillId ?? null, topicId: m.topicId ?? null, goal: rung.goal ?? null, lessonId: m.lessonId, art: alt, lastArt: m.lesson?.lastArt ?? null }, undefined); if (r2?.level) s = r2; } catch { /* keep s */ }
    if (s.art?.art !== alt) return null;
    plan.why.push(`play art ${alt}: the picked art failed the visual QA`);
  } else if (s.art?.art && okArt(s.art.art) == null) plan.why.push(`play ${s.level.family}/${s.level.mode} ${s.art.art}: not yet judged`);
  const art = s.art?.art ?? rung.art ?? null;
  const boardTwin = twinOfLevel(logic, s.level);
  const artifact = {
    kind: "play",
    // play mode lays the world out for the box it is given (play DESIGN §7); this is only the stage's aspect hint
    stage: { w: 360, h: 576 },
    play: { sessionId: s.sessionId, family: s.level.family, mode: s.level.mode, skillId: s.level.skillId, topicId: s.level.topicId, art, levelId: s.level.levelId },
    ...(boardTwin ? { boardTwin } : {}),
  };
  const facts = { kind: "game", archetype: "play@1", onScreen: { game: `${s.level.family}/${s.level.mode}`, ...factsOfLevel(logic, s.level) } };
  // (level and artPick stay on the server: the client fetches the level by its session; the QA harness judges it)
  return { rung: { ...rung, art }, artifact, facts, boardTwin, level: s.level, artPick: s.art ?? null, lesson: noteShown(m.lesson ?? {}, { ...rung, art }), why: plan.why, ms: Date.now() - t0 };
}
