// The placement round API (RS-6 F2, docs/design/reset/prework/rs6/patches/03; round 7 F item 6). Registered through
// server/routes/child.js's route table (a child-facing API; no edit to the route registry). Needs migration 036.
// The child never sees this as a test: the lesson-1 warm-up renders each item as a game-like round (Brain's start hook).
//
//   POST /api/placement/start  { childId, subject? }                    → { placementId, item } | { skip: true }
//   POST /api/placement/answer { childId, placementId, itemId, response, ms? } → { done: false, item } | { done: true, summary }
//   GET  /api/placement/result?childId=                                → { results: { [subject]: PlacementSummary } }
//
// Review 2026-10-05 (zero visible failure): classes outside the bank (1-2) get { skip: true }, a malformed placementId is a
// 404 not a Postgres 500, and a stale itemId is a 409 carrying the current item so the client re-renders instead of showing
// an error. A retried answer to the item just graded is idempotent (placement/session.js).
import { send, bad, notFound, HttpError } from "../http.js";
import { requireChild } from "../auth.js";
import { q, one } from "../db.js";
import { startPlacement, answerPlacement, publicItem, loadBank, poolFor } from "../placement/index.js";
import { summaryOf, placementResultsOf } from "../placement/store.js";
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

export const routes = {
  "POST /api/placement/start": start,
  "POST /api/placement/answer": answer,
  "GET /api/placement/result": results,
};
