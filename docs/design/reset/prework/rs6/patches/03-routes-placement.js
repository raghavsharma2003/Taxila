// PROPOSED NEW FILE: server/routes/placement.js (RS-6 F2). Register in server/router.js next to the other route tables
// (`import * as placement from "./routes/placement.js"` and spread `placement.routes`). Needs migration 04.
// The child never sees this as a test: the client renders each item inside the Studio placement round (RS-4 engine).
import { readJson, send, bad, notFound, HttpError } from "../http.js";
import { requireChild } from "../auth.js";
import { q, one } from "../db.js";
import { startPlacement, answerPlacement, publicItem, loadBank } from "../placement/index.js";

const SUBJECTS = new Set(["maths", "evs", "science"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Review 2026-10-05 (zero visible failure): classes outside the bank (1-2) get { skip: true } (onboarding goes on without a
// round), a malformed placementId is a 404 not a Postgres 500, and a stale itemId is a 409 carrying the current item so the
// client re-renders instead of showing an error. A retried answer to the item just graded is idempotent (session.js).

async function start(req, res) {
  const body = await readJson(req);
  const { child } = await requireChild(req, body.childId);
  const subject = SUBJECTS.has(body.subject) ? body.subject : "maths";
  const classLevel = Number(child.class_level);
  if (!(classLevel >= 3 && classLevel <= 9)) return send(res, 200, { skip: true });
  const { state, item } = startPlacement({ classLevel, subject });
  const row = await one(
    "insert into placement (child_id, subject, state) values ($1, $2, $3) returning id",
    [child.id, subject, JSON.stringify(state)]);
  send(res, 200, { placementId: row.id, item });
}

async function answer(req, res) {
  const body = await readJson(req);
  const { child } = await requireChild(req, body.childId);
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
  // Never the verdict for a single item: placement must not feel like a test (RS-6 step 6). The round's own feedback
  // (Studio engine) is effort-shaped, not right/wrong.
  send(res, 200, result ? { done: true, summary: { level: result.level, skipAhead: result.skipAhead } } : { done: false, item });
}

export const routes = {
  "POST /api/placement/start": start,
  "POST /api/placement/answer": answer,
};
