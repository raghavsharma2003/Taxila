// The lesson's G1 fills, readable SYNCHRONOUSLY by the Director (W1-B #5).
//
// director/state.js step() is pure and synchronous, and routes/lesson.js (a hot file other streams own) awaits nothing
// of Forge's on the turn path. So the turn path reads fills from here: a per-lesson table that the lesson-start
// prefetch (seam.js prefetchLessonFills, fire-and-forget after the lesson row lands) fills, and that a turn-path miss
// warms in the background with requestFill({ needByMs: TURN_NEED_BY_MS }) for the NEXT time that item is posed.
// The fallback ladder (live-content audit): bound engine plan → G1 fill from here → unbound engine show → board/voice.
//
// This module imports nothing heavy (no db, no model): the Director imports it, and Director tests must stay pure.
// Without a registered warmer (tests, evals) a miss is just a miss. Process memory only: a turn served by a replica
// that did not run the prefetch (scale-out, restart, deploy) misses once and warms itself, because the live server
// registers the warmer at import (seam.js), not on a lesson start (W1-D's session affinity keeps that rare).

const TTL_MS = 3 * 3600_000;
const MAX_LESSONS = 2000;
const MAX_PER_LESSON = 64;
/** lessonId → { at, childId, fills: Map<itemId, fill>, inflight: Set<itemId> } */
const lessons = new Map();
/** (ctx) => Promise<G1FillResult>; registered by server/forge/seam.js (the live server), null in pure tests. */
let warmer = null;

export const setFillWarmer = (fn) => { warmer = typeof fn === "function" ? fn : null; };
export const hasFillWarmer = () => warmer !== null;
export const _lessonFillsClear = () => lessons.clear();

function entry(lessonId, create) {
  if (!lessonId) return null;
  let e = lessons.get(lessonId);
  if (e && Date.now() - e.at > TTL_MS) { lessons.delete(lessonId); e = undefined; }
  if (!e && create) {
    e = { at: Date.now(), childId: null, fills: new Map(), inflight: new Set() };
    lessons.set(lessonId, e);
    if (lessons.size > MAX_LESSONS) lessons.delete(lessons.keys().next().value);
  }
  return e ?? null;
}

/** The lesson's child (for gap demand, hashed by cache.js): known on the replica that ran the start. */
export function noteLessonChild(lessonId, childId) {
  const e = entry(lessonId, true);
  if (e && childId) e.childId = childId;
}

/**
 * Keep a READY fill for this lesson's item. Only what the Director needs is kept: the mount command and the server-side
 * grade table (binding, key, distractors, misconception map), which never leaves the server.
 * @param {string} lessonId @param {string} itemId @param {any} r  a G1FillResult
 */
export function rememberLessonFill(lessonId, itemId, r) {
  if (!r || r.status !== "ready" || !r.command || r.command.op !== "mount" || !r.grade?.binding || !itemId) return false;
  const e = entry(lessonId, true);
  if (!e) return false;
  if (e.fills.size >= MAX_PER_LESSON && !e.fills.has(itemId)) e.fills.delete(e.fills.keys().next().value);
  e.fills.set(itemId, { command: structuredClone(r.command), grade: structuredClone(r.grade), fillKey: r.fillKey ?? null,
    renderer: r.renderer ?? r.command.engine, template: r.template ?? null });
  return true;
}

/**
 * The ready fill for this lesson's item, or null. Synchronous and side-effect free (a copy: the Director stores it in
 * the lesson state, which it mutates).
 * @returns {{ command: any, grade: any, fillKey: string | null, renderer: string, template: string | null } | null}
 */
export function peekLessonFill(lessonId, itemId) {
  const f = entry(lessonId, false)?.fills.get(itemId);
  return f ? structuredClone(f) : null;
}

/**
 * A turn-path miss: ask Forge for this item in the background (requestFill with the turn budget; a cold miss ships
 * the code pick and records demand as a forge_gap row when nothing can mount), so the item is warm the next time it
 * is posed. Never awaited, never throws, at most one request in flight per (lesson, item); a no-op without a warmer.
 * @param {{ lessonId: string, itemId: string, kit: any, item: any, move: string, learner?: any }} ctx
 */
export function wantLessonFill(ctx) {
  if (!warmer || !ctx?.lessonId || !ctx.item?.id) return;
  const e = entry(ctx.lessonId, true);
  if (!e || e.fills.has(ctx.item.id) || e.inflight.has(ctx.item.id)) return;
  e.inflight.add(ctx.item.id);
  Promise.resolve()
    .then(() => warmer({ ...ctx, childId: e.childId }))
    .then((r) => { rememberLessonFill(ctx.lessonId, ctx.item.id, r); })
    .catch((err) => console.warn("[forge] turn warm failed:", String(err?.message ?? err).slice(0, 120)))
    .finally(() => e.inflight.delete(ctx.item.id));
}

/** Tests: wait for every in-flight warm of a lesson. */
export async function _settleLesson(lessonId, maxMs = 5000) {
  const t0 = Date.now();
  while ((entry(lessonId, false)?.inflight.size ?? 0) > 0 && Date.now() - t0 < maxMs) await new Promise((r) => setTimeout(r, 10));
}
