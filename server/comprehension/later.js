// Blind closed-label grading OFF the reply path (INTEGRATION.md §8; COMPREHENSION-ENGINE.md §4.2, CE5, E6). A why or
// a teach-back answer moves the Director at once on the classifier's label (the move is not delayed), but its
// EVIDENCE event is held: the blind grader (DeepSeek-V4-Pro → taxila-brain, Azure Direct) runs in the background
// after the turn commits, and the event — with the grader's outcome and the code span check — is folded at the
// start of the NEXT turn. No serial model call is added to any turn.
//
// Held-verdict settle (BUILD-PLAN W1-C #2; comprehension audit G2 — prod settle was 0/5 at a 0 s reply):
//   (a) the next turn waits up to 600 ms for the verdict (session.js awaitSettled → settleHeld);
//   (b) the verdict is written to pending_grade BY EVENT ID the moment it lands, so a turn on any replica reads it;
//   (c) when the turn still folds without it, it CLAIMS the fallback (pending_grade.fallback_at) and the verdict, when
//       it lands, is applied once as a correction event `<id>:late` (via 'late': U/T only, the K step already ran;
//       learner/kt/ledger.js and fuse.js), under the child's advisory lock — replay-safe (a deterministic id, the
//       log is the truth, every replica's cached fold catches up by seq);
//   (d) a settle line is logged per turn and counted (settleStats).
// The row lock on pending_grade orders "verdict landed" against "turn claimed the fallback": exactly one of
// {the turn folds the verdict, the correction is written} happens.
//
// When nothing is written (M0 child, no database), an unsettled event lands with the classifier's outcome and
// spanOk:false: it carries K evidence but no U/T (E6 fails closed).
import { gradeClosed, GRADER_VERSION } from "./grade/closed.js";
import { whyOutcome, teachbackOutcome } from "./grade/ops.js";

const PENDING = new Map();
const TTL_MS = 30 * 60_000;
const MAX_TARGETS = 4;
function sweep(now = Date.now()) {
  if (PENDING.size < 500) return;
  for (const [k, v] of PENDING) if (now - v.at > TTL_MS) PENDING.delete(k);
}

/** The correction's `via` (kt_evidence.via, 012_pending_grade.sql): the ledger skips its K step, the facets apply it. */
export const LATE_VIA = "late";
const LESSON_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The lesson an event id belongs to (`${lessonId}:${seq}:${k}`), or null. */
export const lessonOfEvent = (evId) => { const l = String(evId ?? "").split(":")[0]; return LESSON_ID.test(l) ? l : null; };

// ───────────── persistence (injectable for tests; the default is the app's database) ─────────────

let store = null;
/** Tests: swap the store ({ persist, claim, read, correct }) or restore the database one with null. */
export function _setStore(s) { store = s; }
async function dbStore() {
  if (store) return store;
  const { q } = await import("../db.js");
  return {
    /** The verdict landed: write it; returns { fallback: bool } (the turn already folded without it). M0: nothing. */
    async persist(evId, lessonId, results) {
      const rows = await q(`insert into pending_grade (event_id, lesson_id, results, settled_at)
          select $1, l.id, $3::jsonb, now() from lesson l join child c on c.id = l.child_id
          where l.id = $2 and coalesce(c.legal_mode, 'M1') <> 'M0'
        on conflict (event_id) do update set results = excluded.results, settled_at = excluded.settled_at
        returning fallback_at is not null as fallback, corrected_at is not null as corrected`, [evId, lessonId, JSON.stringify(results)]);
      return { fallback: !!rows[0]?.fallback && !rows[0]?.corrected, written: rows.length > 0 };
    },
    /** The turn folds these without a verdict: claim the fallback; returns the verdicts that landed meanwhile. */
    async claim(ids) {
      const pairs = ids.map((id) => [id, lessonOfEvent(id)]).filter(([, l]) => l);
      if (!pairs.length) return {};
      const rows = await q(`insert into pending_grade (event_id, lesson_id, fallback_at)
          select x.e, x.l::uuid, now() from unnest($1::text[], $2::text[]) as x(e, l)
            join lesson on lesson.id = x.l::uuid join child c on c.id = lesson.child_id where coalesce(c.legal_mode, 'M1') <> 'M0'
        on conflict (event_id) do update set fallback_at = coalesce(pending_grade.fallback_at, excluded.fallback_at)
        returning event_id, results`, [pairs.map((p) => p[0]), pairs.map((p) => p[1])]);
      return Object.fromEntries(rows.filter((r) => r.results != null).map((r) => [r.event_id, r.results]));
    },
    /** Verdicts already written (another replica graded them). */
    async read(ids) {
      if (!ids.length) return {};
      const rows = await q("select event_id, results from pending_grade where event_id = any($1::text[]) and results is not null", [ids]);
      return Object.fromEntries(rows.map((r) => [r.event_id, r.results]));
    },
    /** Write the correction event (kt_evidence + facet cache) under the child's lock; marks the row corrected. */
    async correct(ev, results) { return writeCorrection(ev, results, q); },
  };
}
/** The verdicts as stored: never the child's verbatim span (no transcripts_retention consent is wired). */
const storable = (results) => (results ?? []).map(({ span: _s, ...r }) => ({ ...r, span: null }));

/**
 * Start grading a held event in the background (never awaited by the turn). One R-EXP call per kit target
 * (a why: its key ideas, ≤ 4; a teach-back: each expectation), in parallel. When the verdict lands it is written
 * by event id, and applied as a correction if the turn already folded the event without it.
 * @param {any} ev the held EvidenceEvent (probe.why | probe.teachback)
 * @param {{ childText: string, targets: { id: string, textEn: string }[], echo?: string[], lang?: string }} r
 * @param {{ grade?: typeof gradeClosed }} [o]
 */
export function gradeLater(ev, { childText, targets, echo = [], lang = "en" }, { grade = gradeClosed } = {}) {
  sweep();
  // idempotent per event id: the turn may launch the grade as soon as the plan holds the event (before the reply is
  // written: seam-patches/w1c-lesson-early-grade.patch) and again after its commit; the second call is the first's promise
  const had = PENDING.get(ev.id);
  if (had?.promise && !had.adopted) return had.promise;
  const text = String(childText ?? "").trim();
  const ts = (targets ?? []).filter((t) => t?.id && t?.textEn).slice(0, MAX_TARGETS);
  if (!text || !ts.length) return null;
  const entry = { at: Date.now(), settled: false, results: null, fallback: false };
  entry.promise = Promise.all(ts.map((target) => grade({ op: "R-EXP", childSpan: text, target, lang }, { echo })
    .catch(() => ({ label: "NA", spanOk: false, op: "R-EXP", targetId: target.id, graderVersion: GRADER_VERSION, model: null, ms: 0, span: null }))))
    .then((results) => { entry.results = results; entry.settled = true; return results; });
  PENDING.set(ev.id, entry);
  entry.persisted = entry.promise.then((results) => landed(ev, results)).catch((e) => console.warn("[settle] verdict not stored:", String(e?.message ?? e).slice(0, 160)));
  return entry.promise;
}

async function landed(ev, results) {
  const lessonId = lessonOfEvent(ev.id) ?? ev.sessionId;
  if (!lessonId) return;
  const s = await dbStore();
  const { fallback } = await s.persist(ev.id, lessonId, storable(results));
  if (!fallback) return;
  const fe = finalEvent(ev, results);
  if (!fe.graded) return;                            // no real verdict (every target NA): the fallback stands
  const wrote = await s.correct(ev, results);
  stats.late += wrote ? 1 : 0;
  console.info(`[settle] late verdict applied ev=${ev.id} outcome=${fe.event.outcome} spanOk=${fe.event.spanOk} wrote=${!!wrote}`);
}

/** The verdicts for a held event if they are in (non-blocking), else undefined. A claimed fallback reads undefined. */
export function settledGrade(evId) {
  const e = PENDING.get(evId);
  return e?.settled && !e.fallback ? e.results : undefined;
}
/** Adopt verdicts read from the database (another replica graded them) as settled here. */
function adopt(evId, results) {
  const e = PENDING.get(evId);
  if (e) { e.results = results; e.settled = true; e.fallback = false; return; }
  PENDING.set(evId, { at: Date.now(), settled: true, results, fallback: false, adopted: true, promise: Promise.resolve(results) });
}

// ───────────── the settle (the next turn, and lesson end) ─────────────

const POLL_MS = 100;
const stats = { turns: 0, held: 0, settled: 0, local: 0, db: 0, fallback: 0, late: 0, waitedMs: 0 };
/** Settle counters since process start (the per-turn line is logged; this is for probes and tests). */
export const settleStats = () => ({ ...stats, rate: stats.held ? Math.round((stats.settled / stats.held) * 1000) / 1000 : null });
export const _resetSettleStats = () => { for (const k of Object.keys(stats)) stats[k] = 0; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait at most `maxMs` for the verdicts of held events: in-process ones by their promise, others (another replica
 * graded them, or a restart) from pending_grade. Ids still unsettled at the deadline are CLAIMED as folded without a
 * verdict (so a verdict that lands later becomes a correction, never a double count). Never rejects.
 * @param {string[]} eventIds @param {number} [maxMs] @param {{ log?: boolean, label?: string }} [o]
 * @returns {Promise<{ held: number, settled: number, fallback: string[], waitedMs: number }>}
 */
export async function settleHeld(eventIds, maxMs = 600, { log = true, label = "turn" } = {}) {
  const ids = [...new Set((eventIds ?? []).filter(Boolean))];
  const t0 = Date.now();
  const out = { held: ids.length, settled: 0, fallback: [], waitedMs: 0, via: { local: 0, db: 0 } };
  if (!ids.length) return out;
  const done = (id) => PENDING.get(id)?.settled === true && !PENDING.get(id)?.fallback;
  const deadline = t0 + Math.max(0, maxMs);
  let s = null;
  try { s = await dbStore(); } catch { s = null; }
  const fromDb = new Set();
  for (;;) {
    const open = ids.filter((id) => !done(id));
    if (!open.length) break;
    const remote = open.filter((id) => !PENDING.has(id));
    if (remote.length && s) {
      try { for (const [id, res] of Object.entries(await s.read(remote))) { adopt(id, res); fromDb.add(id); } } catch { /* the deadline still holds */ }
    }
    const left = deadline - Date.now();
    if (left <= 0 || !ids.some((id) => !done(id))) break;
    // wake on the first local verdict, at the deadline, or (when some are graded elsewhere) at the next poll
    const local = ids.filter((id) => !done(id) && PENDING.has(id)).map((id) => PENDING.get(id).promise);
    await Promise.race([sleep(remote.length ? Math.min(left, POLL_MS) : left), ...(local.length ? [Promise.race(local)] : [])]);
  }
  const unsettled = ids.filter((id) => !done(id));
  if (unsettled.length) {
    for (const id of unsettled) { const e = PENDING.get(id); if (e) e.fallback = true; else PENDING.set(id, { at: Date.now(), settled: false, results: null, fallback: true, adopted: true, promise: Promise.resolve(null) }); }
    if (s) {
      try { for (const [id, res] of Object.entries(await s.claim(unsettled))) { adopt(id, res); fromDb.add(id); } } catch (e) { console.warn("[settle] claim failed:", String(e?.message ?? e).slice(0, 160)); }
    }
  }
  out.waitedMs = Date.now() - t0;
  out.fallback = ids.filter((id) => !done(id));
  out.settled = ids.length - out.fallback.length;
  out.via = { db: ids.filter((id) => fromDb.has(id) && done(id)).length, local: out.settled - ids.filter((id) => fromDb.has(id) && done(id)).length };
  stats.turns++; stats.held += out.held; stats.settled += out.settled; stats.local += out.via.local; stats.db += out.via.db;
  stats.fallback += out.fallback.length; stats.waitedMs += out.waitedMs;
  if (log) console.info(`[settle] ${label} lesson=${lessonOfEvent(ids[0]) ?? "?"} held=${out.held} settled=${out.settled} local=${out.via.local} db=${out.via.db} fallback=${out.fallback.length} waited=${out.waitedMs}ms rate=${settleStats().rate}`);
  return out;
}

/** Wait at most `ms` for a held event's verdicts (lesson end): local or from another replica; claims the fallback. */
export async function awaitGrade(evId, ms) {
  await settleHeld([evId], ms, { label: "end" });
  return settledGrade(evId);
}
export const forgetGrade = (evId) => PENDING.delete(evId);

const RANK = { present: 4, partial: 3, contradicted: 2, absent: 1, NA: 0 };

/**
 * The event as it is folded: the blind grader's outcome when it answered, else the classifier's with spanOk:false.
 * A why takes its best-supported idea (present > partial > contradicted > absent); a teach-back the coverage rule
 * (ops.teachbackOutcome). spanOk is true only when every positive label's span was checked in code.
 * @returns {{ event: any, results: any[], graded: boolean }}  graded: the blind verdict decided the event
 */
export function finalEvent(ev, results) {
  const fallback = { event: { ...ev, spanOk: false }, results: results ?? [], graded: false };
  if (!results?.length) return fallback;
  const real = results.filter((r) => r.label && r.label !== "NA");
  if (!real.length) return fallback;
  const base = { ...ev, grader: "llm", graderVersion: GRADER_VERSION };
  if (ev.cls === "probe.why") {
    const best = [...real].sort((a, b) => RANK[b.label] - RANK[a.label] || (a.targetId < b.targetId ? -1 : 1))[0];
    const outcome = whyOutcome(best.label);
    const mis = best.label === "contradicted" && ev.misconceptionId ? { misconceptionId: ev.misconceptionId } : {};
    const { misconceptionId: _m, ...rest } = base;
    return { event: { ...rest, ...mis, outcome, spanOk: best.label === "present" || best.label === "partial" ? best.spanOk === true : false }, results, graded: true };
  }
  if (ev.cls === "probe.teachback") {
    const outcome = teachbackOutcome(real.map((r) => r.label));
    if (outcome == null) return fallback;
    const positives = real.filter((r) => r.label === "present" || r.label === "partial");
    const { misconceptionId: _m, ...rest } = base;
    return { event: { ...rest, outcome, spanOk: positives.length > 0 && positives.every((r) => r.spanOk === true) }, results, graded: true };
  }
  return fallback;
}

/**
 * The correction event for a verdict that landed after its event folded: the verdict's outcome and span check, a
 * deterministic id, via 'late' (U/T only; the ledger already took the K step from the fallback). Null when the
 * verdict carries nothing (every target NA). Pure; exported for tests.
 */
export function lateEvent(ev, results) {
  const fe = finalEvent(ev, results);
  if (!fe.graded) return null;
  const { seq: _s, ...rest } = fe.event;
  return { ...rest, id: `${ev.id}:late`, via: LATE_VIA };
}

/**
 * Write a late correction: fold it onto the child's current state and commit the kt_evidence row, the facet cache
 * and the pending_grade mark in ONE transaction under the child's advisory lock and legal-mode guard (the turn
 * writer's contract). Idempotent: the kt_evidence id is deterministic and the mark is guarded.
 */
async function writeCorrection(ev, results, q) {
  const corr = lateEvent(ev, results);
  if (!corr) return false;
  const [{ tx }, { loadLive, commitLive, LIVE_FOLD_CTX }, { fuseEvidence, beliefFor }, W, { canWrite }, { facetStmts }] = await Promise.all([
    import("../db.js"), import("../learner/live.js"), import("./index.js"), import("../learner/writer.js"), import("../learner/mode.js"), import("./store.js")]);
  const lessonId = lessonOfEvent(ev.id) ?? ev.sessionId;
  const child = (await q("select c.* from lesson l join child c on c.id = l.child_id where l.id = $1", [lessonId]))[0];
  if (!child || !canWrite(child, "kt")) return false;
  const live = await loadLive(child);
  if (live.state.ledger.seen[corr.id] !== undefined || live.state.comp.seen[corr.id]) return false;
  const after = fuseEvidence(live.state, [corr], LIVE_FOLD_CTX);
  const now = Date.now();
  const stmts = W.ledgerStmts(child, live.state.ledger, after.ledger, [corr]);
  const moved = Object.keys(after.comp.skills).filter((id) => JSON.stringify(live.state.comp.skills[id]) !== JSON.stringify(after.comp.skills[id])).sort();
  const facet = facetStmts(child, moved.map((id) => beliefFor(id, { ...after, now })));
  const mark = { text: "update pending_grade set corrected_at = now() where event_id = $1 and corrected_at is null", params: [ev.id] };
  const all = [W.lockStmt(child.id), W.modeGuardStmt(child.id, child.legal_mode), ...stmts, ...facet, mark];
  const out = await tx(all.map(({ layer: _l, rows: _r, ...x }) => x));
  const seqs = stmts.map((st, i) => (/^with ins as \(insert into kt_evidence/.test(st.text) ? out[i + 2]?.[0]?.seq ?? null : undefined)).filter((x) => x !== undefined);
  commitLive(child, live.maxSeq, after, seqs);
  return true;
}
