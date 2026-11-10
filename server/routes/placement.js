// The placement round API (RS-6 F2, docs/design/reset/prework/rs6/patches/03; round 7 F item 6). Registered through
// server/routes/child.js's route table (a child-facing API; no edit to the route registry). Needs migration 036.
// The child never sees this as a test: the lesson-1 warm-up renders each item as a game-like round (Brain's start hook).
//
//   POST /api/placement/start  { childId, subject? }                    → { placementId, item } | { skip: true }
//   POST /api/placement/answer { childId, placementId, itemId, response, ms? } → { done: false, item } | { done: true, summary }
//   GET  /api/placement/result?childId=                                → { results: { [subject]: PlacementSummary } }
//   POST /api/placement/onboarding { childId, parentView?, childPicks? } → { note }   (round 7 F cold start, no quiz)
//   GET  /api/placement/note?childId=                                  → { note }   (checked placement note, 3 languages)
//
// Review 2026-10-05 (zero visible failure): classes outside the bank (1-2) get { skip: true }, a malformed placementId is a
// 404 not a Postgres 500, and a stale itemId is a 409 carrying the current item so the client re-renders instead of showing
// an error. A retried answer to the item just graded is idempotent (placement/session.js).
import { send, bad, notFound, HttpError } from "../http.js";
import { requireChild } from "../auth.js";
import { q, one } from "../db.js";
import { startPlacement, answerPlacement, publicItem, loadBank, poolFor } from "../placement/index.js";
import { summaryOf, placementResultsOf } from "../placement/store.js";
import { coldStartResult, PARENT_VIEWS, CHILD_PICKS } from "../placement/coldstart.js";
import { placementNote } from "../placement/note.js";
import { topicSequence } from "../content/curriculum.js";
import { writePlacementPrior } from "../placement/kt.js";

const SUBJECTS = new Set(["maths", "evs", "science"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const query = (req) => new URL(req.url || "/", "http://x").searchParams;

/** PURE. The subject a class places in: maths, else the class's science-like subject (EVS to class 5, science from 6). */
export const placementSubjectFor = (subject, classLevel) => {
  const s = SUBJECTS.has(subject) ? subject : "maths";
  if (s === "maths") return s;
  return Number(classLevel) <= 5 ? "evs" : "science";
};

async function start(req, res, body) {
  const { child } = await requireChild(req, body?.childId);
  const classLevel = Number(child.class_level);
  const subject = placementSubjectFor(body?.subject, classLevel);
  if (!(classLevel >= 3 && classLevel <= 9) || !poolFor(subject, classLevel).length) return send(res, 200, { skip: true });
  const { state, item } = startPlacement({ classLevel, subject });
  const row = await one("insert into placement (child_id, subject, state) values ($1, $2, $3) returning id", [child.id, subject, JSON.stringify(state)]);
  send(res, 200, { placementId: row.id, item });
}

async function answer(req, res, body) {
  const { child } = await requireChild(req, body?.childId);
  if (!UUID.test(String(body.placementId ?? ""))) throw notFound("no open placement");
  const row = await one("select id, state from placement where id = $1 and child_id = $2 and completed_at is null", [body.placementId, child.id]);
  if (!row) throw notFound("no open placement");
  if (!body.itemId) throw bad("itemId required");
  let out;
  try {
    out = answerPlacement(row.state, { itemId: String(body.itemId), response: body.response, ms: body.ms });
  } catch (e) {
    if (e?.code !== "PLACEMENT_STALE") throw e;
    const cur = row.state?.current ? publicItem(loadBank().find((it) => it.id === row.state.current), row.state.seed) : null;
    throw new HttpError(409, "stale item", { item: cur });
  }
  const { state, item, result, repeat } = out;
  if (repeat) return send(res, 200, { done: false, item });
  await q("update placement set state = $2, result = $3, completed_at = case when $3::jsonb is null then null else now() end where id = $1",
    [row.id, JSON.stringify(state), result ? JSON.stringify(result) : null]);
  // round 7 F: the finished round seeds the KT θ prior (one kt_evidence row per strand, via 'placement'; never throws)
  if (result) await writePlacementPrior(child, { placementId: row.id, completedAt: new Date(), result });
  // Never the verdict for a single item: placement must not feel like a test (RS-6 step 6).
  send(res, 200, result ? { done: true, summary: summaryOf(result, child.class_level, state.subject) } : { done: false, item });
}

/** GET /api/placement/result?childId= → { results: { [subject]: summaryOf } } (the parent's "where your child is starting"). */
async function results(req, res) {
  const { child } = await requireChild(req, query(req).get("childId"));
  const all = await placementResultsOf(child.id);
  send(res, 200, { results: Object.fromEntries(Object.entries(all).map(([s, r]) => [s, summaryOf(r, child.class_level, s)])) });
}

/** Subjects a cold start covers for a class: those with a curriculum for it. */
export const COLD_SUBJECTS = Object.freeze(["maths", "evs", "science", "english", "hindi", "sst"]);
export const coldSubjectsFor = (classLevel) => COLD_SUBJECTS.filter((s) => topicSequence(Number(classLevel), s).length > 0);

/**
 * PURE. Merge a request's answers into the stored ones: only known subjects for the class and known values; "unsure"
 * clears a parent view, an absent subject keeps what was stored.
 */
export function mergeAnswers(stored, body, classLevel) {
  const subjects = new Set(coldSubjectsFor(classLevel));
  const out = { parentView: { ...(stored?.parentView ?? {}) }, childPicks: { ...(stored?.childPicks ?? {}) } };
  for (const [s, v] of Object.entries(body?.parentView ?? {})) {
    if (!subjects.has(s) || !PARENT_VIEWS.includes(v)) continue;
    if (v === "unsure") delete out.parentView[s]; else out.parentView[s] = v;
  }
  for (const [s, v] of Object.entries(body?.childPicks ?? {})) if (subjects.has(s) && CHILD_PICKS.includes(v)) out.childPicks[s] = v;
  return out;
}

async function noteFor(child) {
  const [results, row] = await Promise.all([placementResultsOf(child.id), one("select onboarding_answers from child where id = $1", [child.id])]);
  return placementNote({ child, results, answers: row?.onboarding_answers ?? {} });
}

/**
 * POST /api/placement/onboarding: store the parent's view and/or the child's quick picks, then (re)make each answered
 * subject's cold-start estimate as a placement row (source 'onboarding'). A subject that already has a placement round
 * of its own (the CAT) keeps it. The θ prior site is written once per subject (the first onboarding row): a later
 * change of answer moves where topic choice starts, never adds a second site to the ledger.
 */
async function onboarding(req, res, body) {
  const { guardian, child } = await requireChild(req, body?.childId);
  const row = await one("select onboarding_answers from child where id = $1", [child.id]);
  // A paired child device sends the child's own picks only: the parent's view is the parent's (audit PLAT-07).
  const answers = mergeAnswers(row?.onboarding_answers, guardian.deviceChildId ? { childPicks: body?.childPicks } : body, child.class_level);
  await q("update child set onboarding_answers = $2 where id = $1", [child.id, JSON.stringify(answers)]);
  const existing = await q(`select distinct on (subject) subject, result->>'source' as source from placement
      where child_id = $1 and completed_at is not null and result is not null order by subject, completed_at desc`, [child.id]);
  const had = new Map(existing.map((r) => [r.subject, r.source ?? "cat"]));
  for (const subject of coldSubjectsFor(child.class_level)) {
    if (had.get(subject) && had.get(subject) !== "onboarding") continue;
    const result = coldStartResult({ subject, classLevel: Number(child.class_level), parentView: answers.parentView[subject], childPick: answers.childPicks[subject] });
    if (!result) continue;
    const ins = await one("insert into placement (child_id, subject, state, result, completed_at) values ($1, $2, $3, $4, now()) returning id, completed_at",
      [child.id, subject, JSON.stringify({ source: "onboarding" }), JSON.stringify(result)]);
    if (!had.has(subject)) await writePlacementPrior(child, { placementId: ins.id, completedAt: ins.completed_at, result });
  }
  send(res, 200, { note: await noteFor(child) });
}

/** GET /api/placement/note?childId= → { note: { lines: { en, hinglish, hi }, checked } } (only lines that passed). */
async function note(req, res) {
  const { child } = await requireChild(req, query(req).get("childId"));
  send(res, 200, { note: await noteFor(child) });
}

export const routes = {
  "POST /api/placement/onboarding": onboarding,
  "GET /api/placement/note": note,
  "POST /api/placement/start": start,
  "POST /api/placement/answer": answer,
  "GET /api/placement/result": results,
};
