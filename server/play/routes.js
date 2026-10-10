// /api/play/* (GRAMMAR.md §5). Registered by docs/design/round3/play/patches/01-play-routes.diff (server/index.js is a
// shared hot file). Every route authenticates the child against the signed-in guardian (requireChild), regenerates the
// level the session token points at, and re-grades the RAW acts (server/play/grade.js): the client's verdict is never read.
// No model call on any of these paths; quotas cannot 429 them.
//
//   POST /api/play/start   { childId, skillId? | topicId?, goal?, lessonId?, lang?, art?, fade? } → session, level, art, bank, world
//   POST /api/play/act     { sessionId, levelId, acts, final?, impasse? } → moments, reaction, grade?, doors?, seam?
//   POST /api/play/next    { sessionId, door } → session, level, art, bank
//   POST /api/play/level   { sessionId } → session, level, art           (the Studio renderer's mount)
//   GET  /api/play/world?childId= → { classLevel, families }
//   GET  /api/play/admit?skillId= → { play: boolean, family, mode }   (the Director's admission check)
//   POST /api/play/dress   { sessionId } → { dress, source, ms }  (round 4: the ONE model call on the play path; enums only,
//                          validated field by field, 1.9 s deadline, base dress otherwise; server/play/dress.js)
import { readJson, send, HttpError } from "../http.js";
import { requireChild } from "../auth.js";
import { signSession, verifySession } from "./session.js";
import { artFor, coverage, currentLevel, entryByKey, entryFor, nextBody } from "./levels.js";
import { startSession } from "./start.js";
import { gradeActs, lessonEvidence } from "./grade.js";
import { reactionFor } from "./react.js";
import { mapStateFrom, worldFamily, FAMILIES } from "./world.js";
import { signEvidence, signSeam } from "./evidence.js";
import { playFactsRow } from "../../shared/play.ts";
import { baseSpec, dressSpecFor, withVerb } from "./dress.js";
import { engineFor } from "../../src/play/engines/registry.ts";

const bad = (msg) => new HttpError(400, msg);
const dbq = async (...a) => (await import("../db.js")).q(...a);

function sessionOut(s) { return signSession(s); }
function doorsFor(s, entry, lang) {
  const hint = (d) => (lang === "en" ? (d === "garam" ? "one more like this" : "a bit harder") : lang === "hi" ? (d === "garam" ? "इसी तरह का एक और" : "थोड़ा मुश्किल") : d === "garam" ? "isi tarah ka ek aur" : "thoda mushkil");
  const garam = currentLevel(nextBody(s, entry, "garam"), entry);
  if (!garam) return [];
  const t = nextBody(s, entry, "teekha"), teekha = currentLevel(t, entry);
  // a teekha that is the same level as garam is no choice (the fade could not go up): one door
  return [{ door: "garam", level: garam, hint: hint("garam") }, ...(teekha && (teekha.levelId !== garam.levelId || teekha.fade !== garam.fade) ? [{ door: "teekha", level: { ...teekha, door: "teekha" }, hint: hint("teekha") }] : [])];
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
    const { child } = await requireChild(req, b.childId);
    const r = await startSession(child, { skillId: b.skillId, topicId: b.topicId, goal: b.goal, lessonId: b.lessonId, lang: b.lang, art: b.art, fade: b.fade }, dbq);
    if (!r) return send(res, 404, { error: "no_play_for_skill" });
    // the world is drawn from the child's own ledger (the same truth the Garden/Sky map reads); a failed read draws every
    // station "ahead" rather than inventing a state (and never blocks the game)
    let mapState = () => ({ shape: "not_started", recheck: false });
    // the world's ledger read and the parent's verb read run together
    const [truth, vChild] = await Promise.all([
      import("../reports/truth.js").then(async (m) => ({ m, t: await m.loadTruth(child) })).catch(() => null),
      withVerb(child, dbq),
    ]);
    if (truth) try { mapState = mapStateFrom(truth.t, truth.m.MAP_SHAPE); } catch { /* ahead */ }
    const world = worldFamily({ family: r.entry.family, classLevel: r.session.classLevel, mapState, hereTopic: r.entry.topicId });
    send(res, 200, { sessionId: r.sessionId, level: r.level, art: r.art, bank: [], world, dress: baseSpec(r.session, r.level, vChild)?.spec ?? null });
  },

  /** the level a session token points at (the Studio renderer mounts a PlayArtifact from its sessionId) */
  "POST /api/play/level": async (req, res, body) => {
    const b = body && typeof body === "object" ? body : await readJson(req);   // the router already read the body
    const s = verifySession(b?.sessionId);
    if (!s) throw bad("bad_session");
    const { child } = await requireChild(req, s.childId);
    const entry = entryByKey(s.key);
    if (!entry) throw bad("stale_session");
    const level = currentLevel(s, entry);
    if (!level) return send(res, 409, { error: "no_level" });
    send(res, 200, { sessionId: b.sessionId, level, art: artFor(s, entry), dress: baseSpec(s, level, await withVerb(child, dbq))?.spec ?? null });
  },

  "POST /api/play/act": async (req, res, body) => {
    const b = body && typeof body === "object" ? body : await readJson(req);   // the router already read the body
    const s = verifySession(b?.sessionId);
    if (!s) throw bad("bad_session");
    await requireChild(req, s.childId);
    const entry = entryByKey(s.key);
    if (!entry) throw bad("stale_session");
    const level = currentLevel(s, entry);
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
    const evidenceToken = ended && s.lessonId && rows.length ? signEvidence({ childId: s.childId, lessonId: s.lessonId, levelId: level.levelId, rows }) : undefined;
    const seam = seamOf(g.grade, level, fresh, !!b.impasse);
    const seamToken = seam && s.lessonId ? signSeam({ childId: s.childId, lessonId: s.lessonId, kind: seam.kind, row: playFactsRow({ game: `${level.family}/${level.mode}`, ...seam.facts }) }) : undefined;
    // the belief this level's first decision showed is the next level's focus (the current level's inputs never change)
    const seen = ended ? rows.find((r) => r.misconceptionId)?.misconceptionId ?? null : null;
    const s2 = { ...s, hist: history, ...(seen ? { nextFocus: seen } : {}) };
    const out = { levelId: level.levelId, moments: fresh, reaction, ...(seamToken ? { seamToken } : {}), ...(ended ? { grade: g.grade, doors: doorsFor(s2, entry, s.lang), evidence: rows, ...(evidenceToken ? { evidenceToken } : {}) } : {}),
      seam, sessionId: sessionOut(s2) };
    send(res, 200, out);
  },

  "POST /api/play/next": async (req, res, body) => {
    const b = body && typeof body === "object" ? body : await readJson(req);   // the router already read the body
    const s = verifySession(b?.sessionId);
    if (!s) throw bad("bad_session");
    const { child } = await requireChild(req, s.childId);
    const entry = entryByKey(s.key);
    if (!entry) throw bad("stale_session");
    const door = b.door === "teekha" ? "teekha" : "garam";
    const next = nextBody(s, entry, door);
    delete next.up;
    const level = currentLevel(next, entry);
    if (!level) return send(res, 409, { error: "no_level" });
    const art = artFor(next, entry);
    next.lastArt = art.art;
    send(res, 200, { sessionId: sessionOut(next), level, art, bank: [], dress: baseSpec(next, level, await withVerb(child, dbq))?.spec ?? null });
  },

  "POST /api/play/dress": async (req, res, body) => {
    const b = body && typeof body === "object" ? body : await readJson(req);   // the router already read the body
    const s = verifySession(b?.sessionId);
    if (!s) throw bad("bad_session");
    const { child } = await requireChild(req, s.childId);
    const entry = entryByKey(s.key);
    if (!entry) throw bad("stale_session");
    const level = currentLevel(s, entry);
    if (!level) return send(res, 409, { error: "no_level" });
    const r = await dressSpecFor({ s, level, child: await withVerb(child, dbq), topicTitle: entry.title, childMusicOn: b.music === "on" });
    if (!r) return send(res, 404, { error: "no_engine" });
    send(res, 200, { dress: r.spec, source: r.source, ms: r.ms });
  },

  "GET /api/play/world": async (req, res) => {
    const u = new URL(req.url, "http://x");
    const childId = u.searchParams.get("childId");
    if (!childId) throw bad("childId required");
    const { child } = await requireChild(req, childId);
    const { loadTruth, MAP_SHAPE } = await import("../reports/truth.js");
    const classLevel = Number(child.class_level ?? child.classLevel ?? 6) || 6;
    const truth = await loadTruth(child);
    const mapState = mapStateFrom(truth, MAP_SHAPE);
    send(res, 200, { classLevel, families: FAMILIES.map((family) => worldFamily({ family, classLevel, mapState, hereTopic: u.searchParams.get("topicId") })) });
  },

  "GET /api/play/admit": async (req, res) => {
    const u = new URL(req.url, "http://x");
    const e = entryFor({ skillId: u.searchParams.get("skillId"), topicId: u.searchParams.get("topicId") });
    send(res, 200, e ? { play: true, family: e.family, mode: e.mode, goal: e.goal, topicId: e.topicId } : { play: false });
  },
};
export { coverage };
