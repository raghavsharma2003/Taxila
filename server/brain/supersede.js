// Round 5 truth bar (main 2026-10-15, dc-r143-edit-full-undo): an edited re-send of a child turn (same turnSeq,
// edited: true) that arrives AFTER that turn landed, while it is still the lesson's latest, SUPERSEDES it — the child's
// own correction ("दो बटा दो … नहीं, एक बटा दो") reached the server only after the engine had committed the abandoned
// value (src/duplex: a fast reply lands the turn before the correction; evals/duplex-2026-10/stretch-repair.mjs).
//
//   lesson_undo    one row per lesson: the state BEFORE its latest committed turn, written in that turn's transaction
//   the edit       restores that state, plans the turn on the EDITED words against the learner ledger folded WITHOUT the
//                  original's kt events, and writes its caches as a diff against the CURRENT cached fold (which still has
//                  them), so every skill / misconception / facet the original moved is rewritten
//   the original   its kt_evidence, evidence and brain_trace rows MOVE to the *_superseded archives in the same
//                  transaction (never deleted; no live reader can resurrect them); its turn rows stay, labelled
//
// A later turn already landed → no re-grade (the edit came too late to be the turn): the landed response is replayed and
// the trace row says turn.edit_missed. A second edit of the same turn → replayed (idempotent).
import { q as dbq } from "../db.js";
import { fuseEvidence, newLearnerState } from "../comprehension/index.js";
import { eventFromRow } from "../learner/model.js";
import { LIVE_FOLD_CTX } from "../learner/live.js";

/** The edit may supersede: `turnSeq` is the lesson's latest landed turn and it was not itself an edit. Pure. */
export function supersedable(state, turnSeq) {
  if (turnSeq == null || state?.lastAck?.turnSeq !== turnSeq) return false;
  const ack = (state.acks ?? []).find((a) => a.turnSeq === turnSeq);
  return !!ack && !ack.edited;
}

/** The edit came after a LATER turn landed: too late to be the turn (traced, never re-graded). Pure. */
export const editMissed = (state, turnSeq) =>
  turnSeq != null && (state?.acks ?? []).some((a) => a.turnSeq === turnSeq) && state?.lastAck?.turnSeq !== turnSeq;

/**
 * The state the edit is planned from: the snapshot taken before the superseded turn, keeping the counters that must only
 * grow (the turn-row seq: the original's rows stay in place, so the edit's rows take the next seqs). Pure.
 */
export function restoredState(prev, current) {
  const s = structuredClone(prev);
  delete s.supersede;
  s.seq = Math.max(Number(s.seq) || 0, Number(current?.seq) || 0);
  return s;
}

/** The ledger + facets folded from every live kt_evidence row EXCEPT the superseded turn's (in memory: they move in the tx). */
export async function liveWithout(child, ktIds, { q = dbq } = {}) {
  const rows = await q("select * from kt_evidence where child_id = $1 and not (id = any($2::text[])) order by seq", [String(child.id), ktIds]);
  const state = rows.length ? fuseEvidence(newLearnerState({ childId: String(child.id), classLevel: child.class_level }), rows.map(eventFromRow), LIVE_FOLD_CTX)
    : newLearnerState({ childId: String(child.id), classLevel: child.class_level });
  const max = await q("select coalesce(max(seq), 0) as m from kt_evidence where child_id = $1", [String(child.id)]);
  return { state, maxSeq: Number(max[0]?.m ?? 0) };
}

/** The supersession key every archived row carries. */
export const supersededBy = (lessonId, turnSeq) => `${lessonId}:${turnSeq}`;

/** The snapshot for this committed turn (session layer: lesson state, not learner data). */
export function undoStmt({ lessonId, turnSeq, turn, prev, ids }) {
  const p = structuredClone(prev);
  delete p.supersede;
  return {
    text: `insert into lesson_undo (lesson_id, turn_seq, turn, prev, ids, at) values ($1,$2,$3,$4,$5, now())
           on conflict (lesson_id) do update set turn_seq = excluded.turn_seq, turn = excluded.turn, prev = excluded.prev, ids = excluded.ids, at = excluded.at
           returning lesson_id`,
    params: [lessonId, turnSeq, turn, p, ids],
  };
}

/**
 * The superseded turn's rows, moved / labelled, for the edit's ONE transaction (before its own writes). `ids` is the
 * lesson_undo row's: { kt: kt_evidence ids, rows: the turn rows' seqs }.
 */
export function supersedeStmts({ childId, lessonId, turnSeq, turn, ids }) {
  const by = supersededBy(lessonId, turnSeq);
  const kt = (ids?.kt ?? []).map(String), rows = (ids?.rows ?? []).map(Number);
  return [
    { text: `with moved as (delete from kt_evidence where child_id = $1 and id = any($2::text[]) returning *)
             insert into kt_evidence_superseded select moved.*, $3::text, now() from moved`, params: [childId, kt, by], layer: "kt" },
    { text: `with moved as (delete from evidence where lesson_id = $1 and turn_id in (select id from turn where lesson_id = $1 and seq = any($2::int[])) returning *)
             insert into evidence_superseded select moved.*, $3::text, now() from moved`, params: [lessonId, rows, by], layer: "kt" },
    // the legacy counts table: recounted from the live verdict log, never decremented by hand
    { text: `update misconception_state m set evidence_count = (select count(*) from evidence e where e.child_id = m.child_id and e.misconception_id = m.misconception_id)
             where m.child_id = $1 and m.misconception_id in (select misconception_id from evidence_superseded where superseded_by = $2 and misconception_id is not null)`,
      params: [childId, by], layer: "mis" },
    { text: `with moved as (delete from brain_trace where lesson_id = $1 and turn = $2 returning *)
             insert into brain_trace_superseded select moved.*, $3::text, now() from moved`, params: [lessonId, turn, by] },
    { text: `update turn set meta = meta || jsonb_build_object('superseded', $3::text) where lesson_id = $1 and seq = any($2::int[])`, params: [lessonId, rows, by] },
  ];
}

/**
 * Cache rows only the superseded turn created (a skill / misconception first seen there): absent from the fold without
 * it, so they are removed (caches are derived; the evidence itself is archived). Pure.
 */
export function orphanCacheStmts(childId, cached, after) {
  const out = [];
  for (const id of Object.keys(cached?.ledger?.skills ?? {}).sort()) {
    if (after?.ledger?.skills?.[id]) continue;
    out.push({ text: "delete from kt_skill_state where child_id = $1 and skill_id = $2", params: [childId, id], layer: "kt" });
    out.push({ text: "delete from skill_state where child_id = $1 and skill_id = $2", params: [childId, id], layer: "kt" });
    out.push({ text: "delete from comp_facet_state where child_id = $1 and skill_id = $2", params: [childId, id], layer: "kt" });
  }
  for (const id of Object.keys(cached?.ledger?.mis ?? {}).sort()) {
    if (after?.ledger?.mis?.[id]) continue;
    out.push({ text: "delete from kt_misconception where child_id = $1 and misconception_id = $2", params: [childId, id], layer: "mis" });
  }
  return out;
}
