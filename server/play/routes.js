// /api/play/* (GRAMMAR.md §5). Registered by docs/design/round3/play/patches/01-play-routes.diff (server/index.js is a
// shared hot file). Every route authenticates the child against the signed-in guardian (requireChild), regenerates the
// level the session token points at, and re-grades the RAW acts (server/play/grade.js): the client's verdict is never read.
// No model call on any of these paths; quotas cannot 429 them.
//
//   POST /api/play/start   { childId, skillId? | topicId?, goal?, lessonId?, lang?, art?, fade?, fadeFrom?, prev? } → session, level, art, bank, world, because?, why?
//   (follow-up C: fadeFrom "director" — honoured only inside a lesson — makes the request's fade win over her history;
//   follow-up F: prev = her previous play session token, verified, as the picker's novelty input; round 8 H: why = the
//   child's "why this game" line { text, speak, reason } when the level's because is one she is told about)
//   (because?: round 8, [{ choice, fact, source }] for a game / level / fade chosen from what the learner model holds; absent
//   when the choice is the default. It also rides the signed session body, so /level and the parent page read the same.)
//   POST /api/play/act     { sessionId, levelId, acts, final?, impasse? } → moments, reaction, grade?, doors?, seam?
//   (round 8 P3, when the level ends: trail (server/play/trail.js), and evidenceToken (lesson) or homeToken (home play))
//   POST /api/play/next    { sessionId, door } → session, level, art, bank, because?, why?, and on a family switch (follow-up B)
//                          world + switched { from, to } (the client remounts the new family's world)
//   POST /api/play/level   { sessionId } → session, level, art           (the Studio renderer's mount)
//   POST /api/play/dress   { sessionId } → { dress, source, ms }  (round 4: the ONE model call on the play path; enums only,
//                          validated field by field, 1.9 s deadline, base dress otherwise; server/play/dress.js)
// (audit GAMES-04: GET /api/play/world, /admit and /builds had no caller: the world comes back inside /start, the
// Director admits through hasPlay directly, and no screen ever listed the saved Khand builds; the routes and the
// play_build write are gone. The table, db/migrations/026, is platform's to drop.)
import { readJson, send, HttpError } from "../http.js";
import { requireChild } from "../auth.js";
import { signSession, verifySession } from "./session.js";
import { afterLevelBody, artFor, coverage, currentLevel, entryByKey, entryOfBody, nextBody, play3dOff } from "./levels.js";
import { recentFromPrev, startSession } from "./start.js";
import { gradeActs, lessonEvidence } from "./grade.js";
import { reactionFor } from "./react.js";
import { mapStateFrom, worldFamily } from "./world.js";
import { signEvidence, signHomeEvidence, signSeam } from "./evidence.js";
import { playFactsRow } from "../../shared/play.ts";
import { baseSpec, dressSpecFor, withVerb } from "./dress.js";
import { engineFor } from "../../src/play/engines/registry.ts";
import { record as traceRecord } from "../trace/writer.js";
import { foldHomeLevel, writeHomeEvents } from "./home.js";

const bad = (msg) => new HttpError(400, msg);
/** Test seam (round 8): the child check and the db query the routes use; tests swap them inside a test and restore. */
export const playDeps = { requireChild, q: async (...a) => (await import("../db.js")).q(...a), writeHome: writeHomeEvents };
const dbq = (...a) => playDeps.q(...a);

function sessionOut(s) { return signSession(s); }
/** round 8 P1/P2: the why of the current level's choice ({ choice, fact, source }[]), only when it departs from the default */
export const becauseOut = (s) => ({ ...(Array.isArray(s?.because) && s.because.length ? { because: s.because } : {}), ...(s?.why?.text ? { why: s.why } : {}) });
/** The family's world map for this child, from her own ledger (a failed read draws every station "ahead"). */
async function worldFor(child, entry, classLevel) {
  let mapState = () => ({ shape: "not_started", recheck: false });
  const truth = await import("../reports/truth.js").then(async (m) => ({ m, t: await m.loadTruth(child, { q: dbq }) })).catch(() => null);
  if (truth) try { mapState = mapStateFrom(truth.t, truth.m.MAP_SHAPE); } catch { /* ahead */ }
  return worldFamily({ family: entry.family, classLevel, mapState, hereTopic: entry.topicId });
}
/** The level behind a door's body (after a family switch the body points at the new entry). */
function doorLevel(body, played, name) {
  const entry = entryOfBody(body, played);
  return currentLevel(body, entry, name);
}
function doorsFor(s, entry, lang, name = "") {
  const hint = (d) => (lang === "en" ? (d === "garam" ? "one more like this" : "a bit harder") : lang === "hi" ? (d === "garam" ? "इसी तरह का एक और" : "थोड़ा मुश्किल") : d === "garam" ? "isi tarah ka ek aur" : "thoda mushkil");
  const g = nextBody(s, entry, "garam"), garam = doorLevel(g, entry, name);
  if (!garam) return [];
  const t = nextBody(s, entry, "teekha"), teekha = doorLevel(t, entry, name);
  // a teekha that is the same level as garam is no choice (the fade could not go up): one door. Each door carries the
  // round 8 because of the level behind it (the same record /next returns with that level)
  return [{ door: "garam", level: garam, hint: hint("garam"), ...becauseOut(g) }, ...(teekha && (teekha.levelId !== garam.levelId || teekha.fade !== garam.fade) ? [{ door: "teekha", level: { ...teekha, door: "teekha" }, hint: hint("teekha"), ...becauseOut(t) }] : [])];
}
/** round 8 F: the level_end row's lead pairs: verdict, the trail summary, this level's because kind, the next level's step. */
export function seamLead(seam, trail, s, s2) {
  const kind = (b) => (typeof b?.kind === "string" ? b.kind.replace(/^play\./, "") : null);
  const chose = kind((s?.because ?? [])[0]);
  const next = kind(s2?.nextSwitch ?? s2?.nextBecause);
  return { ...(seam.facts?.verdict ? { verdict: seam.facts.verdict } : {}),
    ...(trail ? { first_try: trail.firstTry ? 1 : 0, misses: trail.misses, ...(trail.extra !== null && trail.extra !== undefined ? { extra: trail.extra } : {}) } : {}),
    ...(chose ? { chose } : {}), ...(next ? { next } : {}),
    // r8 kon/place: whether her protractor sat right at her first decision, so the teacher can name it without guessing
    ...(seam.facts?.placed === "ok" || seam.facts?.placed === "off" ? { placed: seam.facts.placed } : {}) };
}
function seamOf(grade, level, moments, impasse) {
  if (impasse) return { kind: "impasse", facts: grade?.facts ?? {} };
  if (grade) return { kind: "level_end", facts: { ...grade.facts, verdict: grade.verdict }, bareItem: level.fade === 3 && grade.verdict === "solved" ? { skillId: level.skillId } : null };
  const mis = moments.find((m) => m.kind === "misconception_consequence");
  if (mis) return { kind: "misconception", facts: { ...mis.facts, misconception: level.mal[mis.misconceptionId] ?? "" } };
  if (moments.some((m) => m.kind === "prediction_violated")) return { kind: "prediction", facts: moments.find((m) => m.kind === "prediction_violated").facts };
  return null;
}

export const routes = {
  "POST /api/play/start": async (req, res, body) => {
    const b = body && typeof body === "object" ? body : await readJson(req);   // the router already read the body
    if (!b?.childId) throw bad("childId required");
    const { child } = await playDeps.requireChild(req, b.childId);
    // follow-up C: a deliberate fade is the Director's (inside a lesson only: from the home it would be a device claim);
    // follow-up F: what she just played, from her previous session token (verified, hers)
    const recent = recentFromPrev(b.prev, child.id);
    const r = await startSession(child, { skillId: b.skillId, topicId: b.topicId, goal: b.goal, lessonId: b.lessonId, lang: b.lang, art: b.art, fade: b.fade,
      ...(b.fadeFrom === "director" && b.lessonId ? { fadeFrom: "director" } : {}), ...(recent ? { recent } : {}) }, dbq);
    if (!r) return send(res, 404, { error: "no_play_for_skill" });
    // the world is drawn from the child's own ledger (the same truth the Garden/Sky map reads); a failed read draws every
    // station "ahead" rather than inventing a state (and never blocks the game). The world's ledger read and the parent's
    // verb read run together
    const [world, vChild] = await Promise.all([worldFor(child, r.entry, r.session.classLevel), withVerb(child, dbq)]);
    // release 12 flight recorder: the game mounted (inside a lesson, on the lesson's timeline)
    traceRecord("play.mount", { family: r.entry.family, mode: r.level?.mode ?? null, levelId: r.level?.levelId ?? null, skillId: b.skillId ?? null, topicId: r.entry.topicId ?? b.topicId ?? null,
      goal: b.goal ?? null, art: r.art?.art ?? r.art ?? null, lessonId: b.lessonId ?? null, ...(r.because?.length ? { because: r.because } : {}) }, { ...(typeof b.lessonId === "string" && b.lessonId.length === 36 ? { sid: b.lessonId } : {}) });
    send(res, 200, { sessionId: r.sessionId, level: r.level, art: r.art, bank: [], world, dress: baseSpec(r.session, r.level, vChild)?.spec ?? null, ...becauseOut(r.session), ...(play3dOff() ? { render: "2d" } : {}) });
  },

  /** the level a session token points at (the Studio renderer mounts a PlayArtifact from its sessionId) */
  "POST /api/play/level": async (req, res, body) => {
    const b = body && typeof body === "object" ? body : await readJson(req);   // the router already read the body
    const s = verifySession(b?.sessionId);
    if (!s) throw bad("bad_session");
    const { child } = await playDeps.requireChild(req, s.childId);
    const entry = entryByKey(s.key);
    if (!entry) throw bad("stale_session");
    const level = currentLevel(s, entry, child?.first_name);
    if (!level) return send(res, 409, { error: "no_level" });
    send(res, 200, { sessionId: b.sessionId, level, art: artFor(s, entry), dress: baseSpec(s, level, await withVerb(child, dbq))?.spec ?? null, ...becauseOut(s), ...(play3dOff() ? { render: "2d" } : {}) });
  },

  "POST /api/play/act": async (req, res, body) => {
    const b = body && typeof body === "object" ? body : await readJson(req);   // the router already read the body
    const s = verifySession(b?.sessionId);
    if (!s) throw bad("bad_session");
    const { child } = await playDeps.requireChild(req, s.childId);
    const entry = entryByKey(s.key);
    if (!entry) throw bad("stale_session");
    const level = currentLevel(s, entry, child?.first_name);
    if (!level || level.levelId !== b.levelId) return send(res, 409, { error: "level_mismatch" });
    const g = gradeActs(level, b.acts ?? [], { final: !!b.final });
    if (!g) throw bad("bad_level");
    // only the moments of the newest act decide her line (the client posts after every act)
    const lastSeq = Math.max(0, ...g.moments.map((m) => m.seq));
    const fresh = g.moments.filter((m) => m.seq === lastSeq);
    if (b.impasse) fresh.push({ kind: "impasse", seq: lastSeq, facts: {} });
    // the engine the child SEES (the device says; it is honoured only if that engine renders this level, and it only picks
    // which authored words describe the screen: it never touches the grade)
    const seenEngine = typeof b.engine === "string" && engineFor(level.family, level.mode, level.goal)?.id === b.engine ? b.engine : null;
    const { reaction, history } = reactionFor(fresh, { lang: s.lang, level, solved: g.solved, engine: seenEngine, history: s.hist ?? undefined, nowS: (Date.now() / 1000) });
    const ended = !!g.grade;
    const rows = ended ? lessonEvidence(g.grade, level) : [];
    // inside a lesson: the server's own rows, signed for this child and lesson (the turn folds only a verified token)
    // round 8 P3: the level's trail (the server's own replay: misses, mal-rules, undos, acts vs the solver's minimum) is
    // signed WITH the rows. From the home (no lessonId) the same rows, as source "home", and the trail are signed for the
    // child alone (homeToken), and (round 8 follow-up A) folded right here into her learner state through the learner's
    // mapping (server/play/home.js foldHomeLevel; TAXILA_HOME_PLAY_FOLD on unless off)
    const trail = ended ? g.trail : null;
    const evidenceToken = ended && s.lessonId && rows.length ? signEvidence({ childId: s.childId, lessonId: s.lessonId, levelId: level.levelId, rows, ...(trail ? { trail } : {}) }) : undefined;
    const homeToken = ended && !s.lessonId && rows.length ? signHomeEvidence({ childId: s.childId, levelId: level.levelId, rows, ...(trail ? { trail } : {}) }) : undefined;
    const home = homeToken ? await foldHomeLevel({ child, token: homeToken, skillOk: (id) => id === entry.skillId || (entry.skillIds ?? []).includes(id), q: dbq, write: playDeps.writeHome }) : null;
    const seam = seamOf(g.grade, level, fresh, !!b.impasse);
    // the belief this level's first decision showed is the next level's focus (the current level's inputs never change);
    // round 8 P2: a clean first-try win steps the next level's band up, and each step's because rides to the next level
    const seen = ended ? rows.find((r) => r.misconceptionId)?.misconceptionId ?? null : null;
    const s2 = afterLevelBody(s, { grade: ended ? g.grade : null, level, history });
    // round 8 F (to-brain 023): a level_end row leads with the trail summary and the because kinds (this level's choice, the
    // next level's step), telegraphic and inside the 12-pair cap; the family's own facts follow
    const seamToken = seam && s.lessonId ? signSeam({ childId: s.childId, lessonId: s.lessonId, kind: seam.kind,
      row: playFactsRow({ game: `${level.family}/${level.mode}`, ...(seam.kind === "level_end" ? seamLead(seam, trail, s, s2) : {}), ...seam.facts }) }) : undefined;
    // release 12 flight recorder: every act's grade moment, and the level's outcome when it ends
    traceRecord(ended ? "play.outcome" : "play.act", { family: level.family, mode: level.mode, levelId: level.levelId, final: !!b.final, impasse: !!b.impasse,
      moments: fresh.map((m) => m.kind), ...(ended ? { verdict: g.grade.verdict ?? null, solved: !!g.solved, evidence: rows.length, misconceptionId: seen, home: !s.lessonId, ...(home ? { homeFolded: home.folded, homeCapped: home.capped } : {}), ...(trail ? { trail } : {}) } : {}),
      reaction: typeof reaction === "string" ? reaction : reaction?.text ?? null, engine: seenEngine }, { ...(typeof s.lessonId === "string" && s.lessonId.length === 36 ? { sid: s.lessonId } : {}) });
    const out = { levelId: level.levelId, moments: fresh, reaction, ...(seamToken ? { seamToken } : {}), ...(ended ? { grade: g.grade, doors: doorsFor(s2, entry, s.lang, child?.first_name), evidence: rows, ...(trail ? { trail } : {}), ...(evidenceToken ? { evidenceToken } : {}), ...(homeToken ? { homeToken } : {}) } : {}),
      seam, sessionId: sessionOut(s2) };
    send(res, 200, out);
  },

  "POST /api/play/next": async (req, res, body) => {
    const b = body && typeof body === "object" ? body : await readJson(req);   // the router already read the body
    const s = verifySession(b?.sessionId);
    if (!s) throw bad("bad_session");
    const { child } = await playDeps.requireChild(req, s.childId);
    const played = entryByKey(s.key);
    if (!played) throw bad("stale_session");
    const door = b.door === "teekha" ? "teekha" : "garam";
    const next = nextBody(s, played, door);
    delete next.up;
    // follow-up B: after a family switch the body points at the new entry; its world comes with it (the client remounts)
    const entry = entryOfBody(next, played);
    const level = currentLevel(next, entry, child?.first_name);
    if (!level) return send(res, 409, { error: "no_level" });
    const art = artFor(next, entry);
    next.lastArt = art.art;
    const switched = entry !== played;
    const [world, vChild] = await Promise.all([switched ? worldFor(child, entry, next.classLevel) : null, withVerb(child, dbq)]);
    const sw = switched ? { from: `${played.family}/${played.mode}`, to: `${entry.family}/${entry.mode}` } : null;
    traceRecord("play.next", { door, levelId: level.levelId, skillId: next.skillId ?? null, ...(sw ? { switched: sw } : {}), ...(next.because ? { because: next.because } : {}) },
      { ...(typeof s.lessonId === "string" && s.lessonId.length === 36 ? { sid: s.lessonId } : {}) });
    send(res, 200, { sessionId: sessionOut(next), level, art, bank: [], dress: baseSpec(next, level, vChild)?.spec ?? null, ...becauseOut(next),
      ...(sw ? { world, switched: sw } : {}), ...(play3dOff() ? { render: "2d" } : {}) });
  },

  "POST /api/play/dress": async (req, res, body) => {
    const b = body && typeof body === "object" ? body : await readJson(req);   // the router already read the body
    const s = verifySession(b?.sessionId);
    if (!s) throw bad("bad_session");
    const { child } = await playDeps.requireChild(req, s.childId);
    const entry = entryByKey(s.key);
    if (!entry) throw bad("stale_session");
    const level = currentLevel(s, entry, child?.first_name);
    if (!level) return send(res, 409, { error: "no_level" });
    const r = await dressSpecFor({ s, level, child: await withVerb(child, dbq), topicTitle: entry.title, childMusicOn: b.music === "on" });
    if (!r) return send(res, 404, { error: "no_engine" });
    send(res, 200, { dress: r.spec, source: r.source, ms: r.ms });
  },
};
export { coverage };
