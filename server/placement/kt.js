// A finished placement round → its kt_evidence rows (round 7 F; main 2026-11-04 option (a); learner/kt/placement.js).
// The same commit contract as a Studio or late-correction event (studio/grade.js writeStudioEvidence): fold onto the
// child's live state and commit the rows and caches in ONE transaction under the child's advisory lock and legal-mode
// guard, so the cached fold equals a replay. Idempotent by event id. Never throws: a placement whose prior could not be
// written still finishes (topic choice reads placement.result directly).
import { placementEvents } from "../learner/kt/placement.js";

/**
 * @param {{ id: string, class_level: number, legal_mode?: string }} child
 * @param {{ placementId: string, completedAt: string|Date, result: any }} round
 * @returns {Promise<{ written: boolean, why?: string }>}
 */
export async function writePlacementPrior(child, round) {
  const events = placementEvents(round);
  if (!events.length) return { written: false, why: "no_site" };
  try {
    const [{ tx, GUARD_FAILED }, { loadLive, commitLive, LIVE_FOLD_CTX, legacySkillState }, { fuseEvidence }, W, { canWrite }] = await Promise.all([
      import("../db.js"), import("../learner/live.js"), import("../comprehension/index.js"), import("../learner/writer.js"), import("../learner/mode.js")]);
    if (!canWrite(child, "kt")) return { written: false, why: "mode" };
    // fold, then commit only if nothing was written since the fold read (seq guard after the lock); else read and fold again
    for (let attempt = 1; ; attempt++) {
      const live = await loadLive(child);
      const fresh = events.filter((ev) => live.state.ledger.seen[ev.id] === undefined);
      if (!fresh.length) return { written: false, why: "duplicate" };
      const after = fuseEvidence(live.state, fresh, LIVE_FOLD_CTX);
      const stmts = W.ledgerStmts(child, live.state.ledger, after.ledger, fresh);
      const all = [W.lockStmt(child.id), W.modeGuardStmt(child.id, child.legal_mode), W.seqGuardStmt(child.id, live.maxSeq), ...stmts,
        ...W.projectionStmts(child, live.state.ledger, after.ledger, Date.now(), legacySkillState)];
      let out;
      try { out = await tx(all.map(({ layer: _l, rows: _r, ...x }) => x)); } catch (e) {
        if (e?.code === GUARD_FAILED && attempt < W.FOLD_RETRIES) continue;
        throw e;
      }
      const seqs = stmts.map((st, i) => (/^with ins as \(insert into kt_evidence/.test(st.text) ? out[i + 3]?.[0]?.seq ?? null : undefined)).filter((x) => x !== undefined);
      commitLive(child, live.maxSeq, after, seqs);
      return { written: seqs.some((s) => s != null) };
    }
  } catch (e) {
    console.warn("[placement] prior write failed:", String(e?.message ?? e).slice(0, 120));
    return { written: false, why: "error" };
  }
}
