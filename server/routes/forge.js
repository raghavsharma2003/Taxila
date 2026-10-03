// /api/forge/* — the Forge G1 surface (FACTORY.md §2.6). The child is identified by the guardian session
// (requireChild), never by the body alone; the GradeTable never leaves the server (classify re-grades from it).
import { requireChild } from "../auth.js";
import { bad, need, send, HttpError } from "../http.js";
import { one } from "../db.js";
import { requestFill, prefetchLessonFills, DEFAULT_NEED_BY_MS } from "../forge/index.js";
import { getTopic } from "../content/index.js";
import { randomUUID } from "crypto";

const MOVES = new Set(["practice", "probe", "retrieval", "remediate", "homework", "show_module", "reteach", "explain", "worked_example", "hint"]);

/**
 * The lesson these calls serve: REQUIRED, owned by this child, still open, and on the requested topic. Without this,
 * any guardian session could pull the mount command (which for a scene fill carries the probe key and traps) for
 * any item of any topic, and fan prefetch cost across thousands of topics.
 */
async function lessonOf(lessonId, childId, topicId) {
  const row = await one("select id, topic_id, ended_at from lesson where id = $1 and child_id = $2", [lessonId, childId]).catch(() => null);
  if (!row) throw bad("lesson not found for this child");
  if (row.ended_at) throw bad("lesson has ended");
  if (row.topic_id !== topicId) throw bad("topic does not match the lesson");
  return row;
}

/** Per-child sliding-window limits (memory, per process): requests 30/min; prefetch 3/min and once per lesson. */
const LIMITS = { requests: { n: 30, ms: 60_000 }, prefetch: { n: 3, ms: 60_000 } };
const hits = new Map();
const prefetched = new Map();
export function _limitsClear() { hits.clear(); prefetched.clear(); }
export function limit(childId, route, now = Date.now()) {
  const { n, ms } = LIMITS[route];
  const k = `${route}:${childId}`;
  const list = (hits.get(k) || []).filter((t) => now - t < ms);
  if (list.length >= n) throw new HttpError(429, "too many forge requests; wait a minute");
  list.push(now); hits.set(k, list);
  if (hits.size > 20_000) hits.delete(hits.keys().next().value);
}

/** The client-safe view of a fill: what to mount and why; no grade table, no misconception map, no binding. A scene
 *  command necessarily carries its probe (the frame gives feedback on commit), exactly as a bars command carries its
 *  target: the client is never the grader (gradeEvent re-grades from the server-side binding). */
export function publicFill(r, requestId) {
  return {
    requestId, status: r.status, tier: r.tier ?? null, renderer: r.renderer ?? null, template: r.template ?? null,
    command: r.command ?? null, ui: r.ui ?? {}, plan: r.plan ?? null, cached: r.cached ?? null, timings: r.timings,
  };
}

export const routes = {
  /** POST { childId, topicId, itemId, lessonId, move?, needByMs? } → { requestId, status, command?, plan, ui } */
  "POST /api/forge/requests": async (req, res, body) => {
    const { childId, topicId, itemId, lessonId } = need(body, "childId", "topicId", "itemId", "lessonId");
    const { child } = await requireChild(req, childId);
    if (!getTopic(topicId)) throw bad("unknown topic");
    const move = body.move ?? "practice";
    if (!MOVES.has(move)) throw bad("unknown move");
    limit(child.id, "requests");
    const lesson = await lessonOf(lessonId, child.id, topicId);
    const needByMs = Number.isFinite(body.needByMs) ? body.needByMs : DEFAULT_NEED_BY_MS;
    const r = await requestFill({ lessonId: lesson.id, childId: child.id, topicId, itemId, move, needByMs });
    send(res, 200, publicFill(r, randomUUID()));
  },
  /** POST { childId, topicId, lessonId } → 202 (fills build in the background); 200 with the list on ?wait=1 outside
   *  production only. Once per lesson. */
  "POST /api/forge/prefetch": async (req, res, body) => {
    const { childId, topicId, lessonId } = need(body, "childId", "topicId", "lessonId");
    const { child } = await requireChild(req, childId);
    if (!getTopic(topicId)) throw bad("unknown topic");
    limit(child.id, "prefetch");
    const lesson = await lessonOf(lessonId, child.id, topicId);
    if (prefetched.has(lesson.id)) return send(res, 202, { accepted: true, already: true });
    prefetched.set(lesson.id, Date.now()); if (prefetched.size > 20_000) prefetched.delete(prefetched.keys().next().value);
    const job = prefetchLessonFills({ lessonId: lesson.id, childId: child.id, topicId });
    if ((req.url || "").includes("wait=1") && process.env.NODE_ENV !== "production") return send(res, 200, { items: await job });
    job.catch((e) => console.warn("[forge] prefetch failed:", String(e.message).slice(0, 160)));
    send(res, 202, { accepted: true });
  },
};
