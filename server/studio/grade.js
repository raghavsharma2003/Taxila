// The Studio grader in the lesson (LIVE-STUDIO D3, D12, §3.10; BUILD-PLAN W2-H #1, #3). ONE grader for the gate and the
// lesson: a session is server/studio/qa/graders.js `graderFor(archetype, FULL params)` — exactly the function the gate
// plays a build against — held per (lesson, piece) in memory. The frame's (or the skeleton's) answer is only the child's
// claimed value; the host grades it against kit truth and the verdict goes back to the frame. A `correct` field sent by
// a frame is never read (AT-10, AT-11).
//
// Evidence: an item's episode closes on the host's first correct grade; ONE kt_evidence event per item episode
// (via 'studio', ×0.75 in learner/kt/bktr.js SOURCE_WEIGHT), graded "code", carrying how many wrong tries came before
// (the adapter's open-item outcome: C0 first try … C4). Wrong answers alone are no event (the hint ladder rule of
// learner/live.js answerEvents). Ids are deterministic per (lesson, piece, item), so a resend is a no-op.
import { archetype } from "./archetypes/index.js";
import { graderFor } from "./qa/graders.js";
import { fromLegacyEvidence } from "../learner/kt/adapter.js";

export const GRADER_VERSION = "studio-grade@1";
/** Answers arrive from an untrusted frame: bound the JSON before it reaches a grader. */
export const MAX_ANSWER_BYTES = 512;

/**
 * A grading session for one piece. Never throws on a malformed answer (it is simply wrong).
 * @param {string} archetypeId @param {object} params FULL params (hostOnly truth included; never sent to the client)
 */
export function createGradeSession(archetypeId, params) {
  const a = archetype(archetypeId);
  let g = graderFor(a, params);
  const wrongs = new Map();
  let complete = false, answers = 0;
  return {
    archetype: a.id,
    /** @returns {{ correct: boolean, itemId: string, complete: boolean, triesBefore: number, closedItem: boolean }} */
    grade(value) {
      answers++;
      let v = value;
      try {
        const s = JSON.stringify(v === undefined ? null : v);
        v = s && s.length <= MAX_ANSWER_BYTES ? JSON.parse(s) : null;
      } catch { v = null; }
      let r;
      try { r = g(v); } catch { r = { correct: false, itemId: "?", complete }; }
      const itemId = String(r.itemId ?? "q").slice(0, 24);
      const before = wrongs.get(itemId) ?? 0;
      if (!r.correct) wrongs.set(itemId, before + 1);
      complete = !!r.complete;
      return { correct: !!r.correct, itemId, complete, triesBefore: before, closedItem: !!r.correct };
    },
    /** "Show me again": a fresh grader (the activity restarts; wrong counts restart too). */
    reset() { g = graderFor(a, params); wrongs.clear(); complete = false; },
    get complete() { return complete; },
    get answers() { return answers; },
  };
}

/**
 * The kt_evidence event for an item whose episode the host just closed (a correct grade), or null.
 * @param {{ lessonId: string, startedAt: any, now: number, intentId: string, archetypeId: string, skillId: string,
 *   itemId: string, triesBefore: number, topicType?: string, kitVerified?: boolean, misconceptionId?: string|null }} c
 */
export function studioEvidenceEvent(c) {
  if (!c.skillId) return null;
  const id = `${c.lessonId}:studio:${c.intentId}:${c.itemId}`.slice(0, 200);
  const at = new Date(c.now).toISOString();
  const ev = fromLegacyEvidence(
    { skillId: c.skillId, itemId: `studio:${c.archetypeId}:${c.itemId}`, probe: "studio", outcome: "correct", hintsUsed: 0, ...(c.misconceptionId ? { misconceptionId: c.misconceptionId } : {}) },
    { id, sessionId: c.lessonId, sessionStartAt: new Date(c.startedAt ?? c.now).toISOString(), at, episodeId: `${c.lessonId}:studio:${c.intentId}:${c.itemId}`,
      grader: "code", graderVersion: GRADER_VERSION, triesBefore: c.triesBefore, ...(c.topicType ? { topicType: c.topicType } : {}),
      ...(c.kitVerified === false ? { kitVerified: false } : {}) });
  return ev ? { ...ev, target: c.skillId, via: "studio" } : null;
}

/**
 * Write one host-graded Studio event: fold it onto the child's current learner state and commit the kt_evidence row and
 * the caches in ONE transaction under the child's advisory lock and legal-mode guard (the same contract as the turn's
 * writer and comprehension/later.js writeCorrection). Idempotent by event id. Never throws (a failed write is logged and
 * reported false: evidence is never worth a broken activity).
 * @returns {Promise<{ written: boolean, why?: string }>}
 */
export async function writeStudioEvidence(child, ev) {
  if (!ev) return { written: false, why: "no_event" };
  try {
    const [{ tx }, { loadLive, commitLive, LIVE_FOLD_CTX }, { fuseEvidence, beliefFor }, W, { canWrite }, { facetStmts }] = await Promise.all([
      import("../db.js"), import("../learner/live.js"), import("../comprehension/index.js"), import("../learner/writer.js"), import("../learner/mode.js"), import("../comprehension/store.js")]);
    if (!canWrite(child, "kt")) return { written: false, why: "mode" };
    const live = await loadLive(child);
    if (live.state.ledger.seen[ev.id] !== undefined || live.state.comp?.seen?.[ev.id]) return { written: false, why: "duplicate" };
    const after = fuseEvidence(live.state, [ev], LIVE_FOLD_CTX);
    const stmts = W.ledgerStmts(child, live.state.ledger, after.ledger, [ev]);
    const moved = Object.keys(after.comp.skills).filter((id) => JSON.stringify(live.state.comp.skills[id]) !== JSON.stringify(after.comp.skills[id])).sort();
    const facet = facetStmts(child, moved.map((id) => beliefFor(id, { ...after, now: Date.now() })));
    const all = [W.lockStmt(child.id), W.modeGuardStmt(child.id, child.legal_mode), ...stmts, ...facet];
    const out = await tx(all.map(({ layer: _l, rows: _r, ...x }) => x));
    const seqs = stmts.map((st, i) => (/^with ins as \(insert into kt_evidence/.test(st.text) ? out[i + 2]?.[0]?.seq ?? null : undefined)).filter((x) => x !== undefined);
    commitLive(child, live.maxSeq, after, seqs);
    return { written: seqs.some((s) => s != null) };
  } catch (e) {
    console.warn("[studio] evidence write failed:", String(e?.message ?? e).slice(0, 120));
    return { written: false, why: "error" };
  }
}
