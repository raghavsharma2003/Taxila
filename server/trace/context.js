// Release 12 flight recorder (docs/design/round4/build/r12/TRACKING-BRIEF.md): the per-request trace context.
// The router opens one store per /api request (rid, sid from the lesson id when the body names one). Auth fills the
// guardian, child and tier as it resolves them (server/auth.js requireGuardian / requireChild, brain/turn.js
// loadTurnContext), so cid and gid always come from the session, never from the client. Every server event recorded
// inside the request inherits them. Outside a request (the worker, timers) there is no store: events carry what the
// caller passes.
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { tierForEmail } from "./tier.js";

const als = new AsyncLocalStorage();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === "string" && UUID.test(v);

/** A request id as the client sent it (X-Taxila-Rid), else a fresh one. Short and printable only. */
export const ridOf = (req) => {
  const h = String(req?.headers?.["x-taxila-rid"] ?? "");
  return /^[\w.:-]{6,64}$/.test(h) ? h : randomUUID();
};

/** Run `fn` inside a fresh trace store. */
export function runTrace(store, fn) {
  return als.run(store, fn);
}
/** The current store (or null outside a request). Never throws. */
export function traceCtx() {
  try { return als.getStore() ?? null; } catch { return null; }
}
/** Merge facts into the current store (no-op outside a request). Never throws. */
export function traceSet(patch) {
  try {
    const s = als.getStore();
    if (!s || !patch) return;
    for (const [k, v] of Object.entries(patch)) if (v !== undefined && v !== null) s[k] = v;
  } catch { /* the recorder never breaks a request */ }
}
/** Auth resolved a guardian (and maybe a child): fill gid / cid / tier. Never throws. */
export function traceIdentify({ guardian, child } = {}) {
  try {
    const s = als.getStore();
    if (!s) return;
    if (guardian?.id) { s.gid = guardian.id; if (guardian.email) s.tier = tierForEmail(guardian.email); }
    if (child?.id) s.cid = child.id;
  } catch { /* never breaks a request */ }
}
/** Name the lesson this request belongs to (it becomes the trace session). */
export function traceLesson(lessonId, turn) {
  try {
    const s = als.getStore();
    if (!s) return;
    if (isUuid(lessonId)) s.sid = lessonId;
    if (Number.isInteger(turn)) s.turn = turn;
  } catch { /* never breaks a request */ }
}
