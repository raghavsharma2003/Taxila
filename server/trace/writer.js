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

const state = { buf: [], seq: 0, dropped: 0, reported: 0, timer: null, flushing: null, failures: 0, written: 0, insert: null, off: null };

export const traceOff = () => (state.off ?? (process.env.TAXILA_TRACE === "off"));

/** Tests only: replace the insert (rows → Promise), turn the recorder on/off, read the counters. */
export function _setTraceDeps({ insert, off } = {}) {
  if (insert !== undefined) state.insert = insert;
  if (off !== undefined) state.off = off;
  return state;
}
export function _resetTrace() { state.buf = []; state.dropped = 0; state.reported = 0; state.written = 0; state.failures = 0; }
export const traceStats = () => ({ buffered: state.buf.length, dropped: state.dropped, written: state.written, failures: state.failures });

/**
 * Record one server (or worker) event. Synchronous, never throws, never awaits.
 * @param {string} kind  dot-namespaced (shared/trace.ts TRACE_KINDS.server, or a new one)
 * @param {Record<string, unknown>} data  masked and fitted to 8 KB here
 * @param {{ tier?: 1|2, src?: "server"|"worker", sid?: string, cid?: string, gid?: string, turn?: number, rid?: string, t?: number }} [o]
 *   tier 2 events are kept only when the request's account is on TAXILA_TRACE_FULL_FOR (or o.force2)
 */
export function record(kind, data, o = {}) {
  try {
    if (traceOff()) return;
    const c = traceCtx() ?? {};
    const tier = o.tier === 2 ? 2 : 1;
    if (tier === 2 && (o.accountTier ?? c.tier ?? 1) < 2) return; // tier-2 detail only for the owner cohort
    if (state.buf.length >= MAX_BUFFER) { state.dropped++; return; }
    const { data: d } = fit(data);
    state.buf.push({
      v: 1, sid: String(o.sid ?? c.sid ?? c.pid ?? "server").slice(0, 80), pid: o.pid ?? c.pid ?? null,
      cid: isUuid(o.cid ?? c.cid) ? (o.cid ?? c.cid) : null, gid: isUuid(o.gid ?? c.gid) ? (o.gid ?? c.gid) : null,
      src: o.src === "worker" ? "worker" : "server", seq: ++state.seq, t: o.t ?? Date.now(), kind: String(kind).slice(0, 80),
      turn: Number.isInteger(o.turn ?? c.turn) ? (o.turn ?? c.turn) : null, rid: o.rid ?? c.rid ?? null, tier, data: d,
    });
    schedule();
  } catch { /* the recorder never breaks a lesson */ }
}

function schedule() {
  if (state.timer) return;
  state.timer = setTimeout(() => { state.timer = null; void flushTrace(); }, state.buf.length >= ROWS_PER_INSERT ? 0 : FLUSH_MS);
  state.timer.unref?.();
}

/** The default insert: one statement per chunk, rows as one jsonb parameter. Shared with POST /api/trace/batch. */
export async function insertTraceRows(rows) {
  if (!rows.length) return 0;
  const { q } = await import("../db.js");
  await q(`insert into trace_event (sid, pid, cid, gid, src, seq, t, kind, turn, rid, tier, data)
    select x.sid, x.pid, x.cid, x.gid, x.src, x.seq, to_timestamp(x.t / 1000.0), x.kind, x.turn, x.rid, x.tier, x.data
    from jsonb_to_recordset($1::jsonb) as x(sid text, pid text, cid uuid, gid uuid, src text, seq int, t double precision,
      kind text, turn int, rid text, tier smallint, data jsonb)`, [JSON.stringify(rows)]);
  return rows.length;
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
        try { n += await (state.insert ?? insertTraceRows)(chunk); state.written += chunk.length; }
        catch (e) {
          state.failures++; state.dropped += chunk.length;
          if (state.failures <= 3 || state.failures % 50 === 0) console.warn(`[trace] write failed (${chunk.length} events dropped):`, String(e?.message ?? e).slice(0, 160));
          break;
        }
      }
    } catch { /* never throws */ }
    finally { state.flushing = null; if (state.buf.length) schedule(); }
    return n;
  })();
  return state.flushing;
}
