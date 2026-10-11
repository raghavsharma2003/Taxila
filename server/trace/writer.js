// Release 12 flight recorder: the ONE async buffered server writer (TRACKING-BRIEF.md §Transport).
// record() is synchronous and cheap: it masks and fits the event, pushes it on an in-memory buffer and returns. A timer
// flushes the buffer as ONE multi-row insert (jsonb_to_recordset) at most every FLUSH_MS, or sooner when it fills. The
// turn path never awaits the database for the recorder. When the database is slow or down the buffer is capped: events
// over the cap are DROPPED and counted, and the count itself is recorded as `trace.dropped` once the writer can write
// again. A broken recorder never throws into a request: every entry point is wrapped.
// TAXILA_TRACE=off turns the whole recorder off (record() returns at once).
import { fit } from "./mask.js";
import { traceCtx, isUuid } from "./context.js";

const FLUSH_MS = Number(process.env.TAXILA_TRACE_FLUSH_MS) || 1000;
/** Events held in memory at most (per process); over it, new events are dropped and counted. */
export const MAX_BUFFER = Number(process.env.TAXILA_TRACE_MAX_BUFFER) || 5000;
/** Rows per insert statement. */
const ROWS_PER_INSERT = 400;
/** One insert may take this long; past it the chunk counts as dropped and the writer moves on (a hung connection must
 *  never stall the recorder: observed 2026-10-11 on a local production build, every event after one hung insert was lost). */
export const INSERT_DEADLINE_MS = 8000;
const insertDeadline = () => Number(process.env.TAXILA_TRACE_INSERT_MS) || INSERT_DEADLINE_MS;
const withDeadline = (p, ms) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`trace insert timed out after ${ms} ms`)), ms); // ref'd: cleared when the insert settles
  Promise.resolve(p).then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
});

const state = { buf: [], seq: 0, dropped: 0, reported: 0, timer: null, flushing: null, failures: 0, written: 0, insert: null, off: null, badRows: 0, lastLogAt: 0 };

// Under `node --test` (npm test runs every file in one process) the recorder is OFF unless TAXILA_TRACE=on: its background
// flushes would otherwise call the database (fetch) inside unrelated tests that stub fetch or count queries. Tests of the
// recorder turn it on through _setTraceDeps({ off: false }); spawned route runners (no --test flag) record as production does.
const UNDER_TEST = process.execArgv.includes("--test");
export const traceOff = () => (state.off ?? (process.env.TAXILA_TRACE === "off" || (UNDER_TEST && process.env.TAXILA_TRACE !== "on")));

/** Tests only: replace the insert (rows → Promise), turn the recorder on/off, read the counters. */
export function _setTraceDeps({ insert, off } = {}) {
  if (insert !== undefined) state.insert = insert;
  if (off !== undefined) state.off = off;
  return state;
}
export function _resetTrace() {
  if (state.timer) clearTimeout(state.timer);
  Object.assign(state, { buf: [], dropped: 0, reported: 0, written: 0, failures: 0, timer: null, flushing: null, badRows: 0, lastLogAt: 0 });
}
export const traceStats = () => ({ buffered: state.buf.length, dropped: state.dropped, written: state.written, failures: state.failures, badRows: state.badRows });

// release 13.1 (ms-r13-server-rows-lost-live): characters Postgres jsonb refuses (NUL; a lone UTF-16 surrogate, which a cut
// mid-emoji leaves) are replaced before an event is buffered, so one sliced string can never fail an insert
const UNSTORABLE_SRC = "\\u0000|[\\ud800-\\udbff](?![\\udc00-\\udfff])|(?<![\\ud800-\\udbff])[\\udc00-\\udfff]";
const HAS_UNSTORABLE = new RegExp(UNSTORABLE_SRC); // no /g: .test() keeps no lastIndex between strings
const UNSTORABLE = new RegExp(UNSTORABLE_SRC, "g");
export function scrubUnstorable(v, depth = 0) {
  if (typeof v === "string") return HAS_UNSTORABLE.test(v) ? v.replace(UNSTORABLE, "\ufffd") : v;
  if (depth > 10 || v == null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map((x) => scrubUnstorable(x, depth + 1));
  const out = {};
  for (const [k, x] of Object.entries(v)) out[k] = scrubUnstorable(x, depth + 1);
  return out;
}

/**
 * Record one server (or worker) event. Synchronous, never throws, never awaits.
 * @param {string} kind  dot-namespaced (shared/trace.ts TRACE_KINDS.server, or a new one)
 * @param {Record<string, unknown>} data  masked and fitted to 8 KB here
 * @param {{ tier?: 1|2, src?: "server"|"worker", sid?: string, cid?: string, gid?: string, turn?: number, rid?: string, t?: number }} [o]
 *   tier 2 events are kept only when the request's account is on TAXILA_TRACE_FULL_FOR (or o.force2)
 */
export function record(kind, data, o = {}) {
  const p0 = PROFILE ? performance.now() : 0;
  try {
    if (traceOff()) return;
    const c = traceCtx() ?? {};
    const tier = o.tier === 2 ? 2 : 1;
    if (tier === 2 && (o.accountTier ?? c.tier ?? 1) < 2) return; // tier-2 detail only for the owner cohort
    if (state.buf.length >= MAX_BUFFER) { state.dropped++; return; }
    const { data: fitted } = fit(data);
    const d = scrubUnstorable(fitted);
    state.buf.push({
      // no lesson and no page load: the guardian's own stream (signup, consent, /api/me, the parent corner), else "server"
      v: 1, sid: String(o.sid ?? c.sid ?? c.pid ?? (isUuid(o.gid ?? c.gid) ? `g:${o.gid ?? c.gid}` : "server")).slice(0, 80), pid: o.pid ?? c.pid ?? null,
      cid: isUuid(o.cid ?? c.cid) ? (o.cid ?? c.cid) : null, gid: isUuid(o.gid ?? c.gid) ? (o.gid ?? c.gid) : null,
      src: o.src === "worker" ? "worker" : "server", seq: ++state.seq, t: o.t ?? Date.now(), kind: String(kind).slice(0, 80),
      turn: Number.isInteger(o.turn ?? c.turn) ? (o.turn ?? c.turn) : null, rid: o.rid ?? c.rid ?? null, tier, data: d,
    });
    schedule();
  } catch { /* the recorder never breaks a lesson */ }
  finally { if (PROFILE) profileAdd(o.rid ?? traceCtx()?.rid ?? "-", performance.now() - p0, kind === "srv.res" ? data?.route : null); }
}

// ── the budget measurement (TAXILA_TRACE_PROFILE=1): time spent inside record() per request id, and in the flush's
// serialisation (off the request path, but on the same event loop). evals read traceProfile(). Off in production.
const PROFILE = process.env.TAXILA_TRACE_PROFILE === "1";
const prof = { byRid: new Map(), flushMs: 0, flushes: 0 };
function profileAdd(rid, ms, route) {
  const e = prof.byRid.get(rid) ?? { ms: 0, n: 0, route: null };
  e.ms += ms; e.n++; if (route) e.route = route;
  prof.byRid.set(rid, e);
}
export const traceProfile = () => ({ byRid: [...prof.byRid.entries()].map(([rid, e]) => ({ rid, ...e })), flushMs: prof.flushMs, flushes: prof.flushes });

function schedule() {
  if (state.timer) return;
  state.timer = setTimeout(() => { state.timer = null; void flushTrace(); }, state.buf.length >= ROWS_PER_INSERT ? 0 : FLUSH_MS);
  state.timer.unref?.();
}

/** The default insert: one statement per chunk, rows as one jsonb parameter. Shared with POST /api/trace/batch. */
export async function insertTraceRows(rows) {
  if (!rows.length) return 0;
  const { q } = await import("../db.js");
  // Only rows whose child / guardian still exist. A deleted account's last events are still in the buffer when its rows
  // cascade away; inserting them violated trace_event_cid_fkey and dropped the WHOLE chunk, other sessions' events with it
  // (release 12 live: most server chunks lost to the canary's and the batteries' account deletions; ms-r12-trace-fk-poison).
  // Dropping them is also the erasure promise: nothing of a deleted child is written after the delete.
  const r = await q(`insert into trace_event (sid, pid, cid, gid, src, seq, t, kind, turn, rid, tier, data)
    select x.sid, x.pid, x.cid, x.gid, x.src, x.seq, to_timestamp(x.t / 1000.0), x.kind, x.turn, x.rid, x.tier, x.data
    from jsonb_to_recordset($1::jsonb) as x(sid text, pid text, cid uuid, gid uuid, src text, seq int, t double precision,
      kind text, turn int, rid text, tier smallint, data jsonb)
    where (x.cid is null or exists (select 1 from child c where c.id = x.cid))
      and (x.gid is null or exists (select 1 from guardian g where g.id = x.gid))
    returning 1`, [JSON.stringify(rows)]);
  return Array.isArray(r) ? r.length : rows.length;
}

/** A Postgres data / integrity error (SQLSTATE class 22 or 23, or its message), as opposed to the database being away. */
export const isDataError = (e) => /^2[23]/.test(String(e?.code ?? "")) || /invalid input|unicode|surrogate|violates|out of range|malformed|unsupported/i.test(String(e?.message ?? ""));
/** Every failure is logged, at most one line a minute (the first three always), with the error and the chunk's kinds. */
function logFailure(what, e, rows) {
  const now = Date.now();
  if (state.failures > 3 && now - state.lastLogAt < 60_000) return;
  state.lastLogAt = now;
  const kinds = [...new Set(rows.map((r) => r.kind))].slice(0, 12).join(",");
  console.warn(`[trace] ${what}: ${String(e?.code ?? "")} ${String(e?.message ?? e).slice(0, 200)} (kinds ${kinds}; failures ${state.failures}, bad rows ${state.badRows})`);
}
/** Insert `rows`, halving on a data error until the refused rows stand alone; those are dropped and counted. Resolves the rows written. */
async function insertSplit(rows) {
  try {
    const k = await withDeadline((state.insert ?? insertTraceRows)(rows), insertDeadline());
    state.written += rows.length;
    return k;
  } catch (e) {
    if (!isDataError(e)) { state.dropped += rows.length; logFailure(`write failed (${rows.length} events dropped)`, e, rows); return 0; }
    if (rows.length === 1) { state.dropped++; state.badRows++; logFailure("row refused (1 event dropped)", e, rows); return 0; }
    const mid = Math.ceil(rows.length / 2);
    return (await insertSplit(rows.slice(0, mid))) + (await insertSplit(rows.slice(mid)));
  }
}

/**
 * Write what is buffered. Concurrent calls share one in-flight flush. A failed insert drops that chunk (counted), so a
 * dead database cannot grow memory without bound. Resolves with the rows written. Never throws.
 */
export function flushTrace() {
  if (state.flushing) return state.flushing;
  state.flushing = (async () => {
    let n = 0;
    try {
      // the drop counter is itself an event, written once the writer can write again
      if (state.dropped > state.reported) {
        const add = state.dropped - state.reported;
        state.reported = state.dropped;
        state.buf.unshift({ v: 1, sid: "server", pid: null, cid: null, gid: null, src: "server", seq: ++state.seq, t: Date.now(),
          kind: "trace.dropped", turn: null, rid: null, tier: 1, data: { dropped: add, total: state.dropped, buffered: state.buf.length } });
      }
      while (state.buf.length) {
        const chunk = state.buf.splice(0, ROWS_PER_INSERT);
        try {
          const f0 = PROFILE ? performance.now() : 0;
          const p = (state.insert ?? insertTraceRows)(chunk);
          if (PROFILE) { prof.flushMs += performance.now() - f0; prof.flushes++; } // the synchronous part: serialising the chunk
          n += await withDeadline(p, insertDeadline()); state.written += chunk.length;
        }
        catch (e) {
          state.failures++;
          // release 13.1 (ms-r13-server-rows-lost-live): a DATA error (a row Postgres refuses) is one row's fault, never the
          // chunk's: the chunk is split until only the refused rows are left, and those are dropped, counted and named. A
          // connection or timeout error drops the chunk as before (a dead database must not turn into 800 retries).
          if (isDataError(e)) { n += await insertSplit(chunk); continue; }
          state.dropped += chunk.length;
          logFailure(`write failed (${chunk.length} events dropped)`, e, chunk);
          break;
        }
      }
    } catch { /* never throws */ }
    finally { state.flushing = null; if (state.buf.length) schedule(); }
    return n;
  })();
  return state.flushing;
}
