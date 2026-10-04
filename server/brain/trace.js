// The Brain's record of every turn and every chosen option (TEACHER-BRAIN TB12, §4 BrainTrace / DecisionRecord;
// db/migrations/016_brain.sql). Pure statement builders: the turn puts them INSIDE its one transaction, so a trace row
// exists exactly when the turn it explains committed. Codes and digests only: never the child's words, never a model's
// prose, never an affect or engagement label (NM-3).
import { createHash } from "node:crypto";
import { knownReasons } from "./reasons.js";

/** sha256 (hex, 16 chars) of a JSON value: the replay key of the plan's inputs (never words). */
export const digest = (v) => createHash("sha256").update(JSON.stringify(v ?? null)).digest("hex").slice(0, 16);

const PROPOSAL_KEYS = (p) => ({ source: p.source, kind: p.kind, priority: p.priority, ...(p.mandatory ? { mandatory: true } : {}),
  reason: knownReasons(p.reason) });

/**
 * The plan's inputs as a digest: what the kernel saw, never what the child said.
 * @param {{ prev: any, cls: any, move: any, itemId?: string|null, kitHash?: string|null, lane: string }} x
 */
export function inputsHashOf({ prev, cls, move, itemId = null, kitHash = null, lane }) {
  return digest([prev?.turn ?? 0, prev?.phase ?? null, prev?.hintLevel ?? 0, prev?.activeItemId ?? null, prev?.pendingWhy ?? null,
    cls ? [cls.outcome, cls.source, cls.misconceptionId ?? null, Object.entries(cls.flags ?? {}).filter(([, v]) => v === true).map(([k]) => k).sort()] : null,
    move?.kind ?? null, itemId, kitHash, lane]);
}

/**
 * One brain_trace row (016). `arb` is kernel.arbitrate's result. Idempotent per (lesson, turn).
 * @param {{ lessonId: string, turn: number, lane: string, move: string, beat?: string|null, inputsHash: string,
 *   proposals: any[], arb: { accepted: any[], rejected: { p: any, why: string }[] }, reasons?: string[], serverMs?: number|null,
 *   kernelUs?: number|null, legalMode: string }} t
 */
export function brainTraceStmt(t) {
  const reasons = knownReasons([...(t.reasons ?? []), ...t.arb.accepted.flatMap((p) => p.reason ?? []), ...t.arb.rejected.map((r) => r.why)]);
  return {
    text: `insert into brain_trace (lesson_id, turn, lane, move, beat, inputs_hash, proposals, accepted, rejected, reasons, server_ms, kernel_us, legal_mode_at_write)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict (lesson_id, turn) do nothing returning id`,
    params: [t.lessonId, t.turn, t.lane, t.move, t.beat ?? null, t.inputsHash, JSON.stringify(t.proposals.map(PROPOSAL_KEYS)),
      JSON.stringify(t.arb.accepted.map(PROPOSAL_KEYS)), JSON.stringify(t.arb.rejected.map((r) => ({ source: r.p.source, kind: r.p.kind, why: r.why }))),
      reasons, t.serverMs == null ? null : Math.round(t.serverMs), t.kernelUs == null ? null : Math.round(t.kernelUs), t.legalMode],
  };
}

/**
 * One decision_record row (016): a decision point that chose between acceptable options, with how it chose and, when the
 * chooser knows it, the propensity (RESEARCH-PROGRAM §4.3; TEACHER-BRAIN TB7). `randomised` is false for a deterministic
 * rule (e.g. the kit primary arm on a first re-teach).
 * @param {{ lessonId: string, turn: number, pointId: string, options: string[], chosen: string, chosenBy: string, randomised: boolean,
 *   propensity?: number|null, seedRef?: string|null, available?: boolean, reasons?: string[], legalMode: string }} d
 */
export function decisionRecordStmt(d) {
  return {
    text: `insert into decision_record (lesson_id, turn, point_id, options, chosen, chosen_by, randomised, propensity, seed_ref, available, reasons, legal_mode_at_write)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
    params: [d.lessonId, d.turn, d.pointId, JSON.stringify(d.options ?? []), d.chosen, d.chosenBy, !!d.randomised, d.propensity ?? null, d.seedRef ?? null,
      d.available ?? true, knownReasons(d.reasons ?? []), d.legalMode],
  };
}

/** The re-teach arm this turn chose (director/state.js lastReteach) as a decision record, or null. RT-ARM (§11.1). */
export function reteachDecisionOf(next, { lessonId, legalMode }) {
  const d = next?.lastReteach;
  if (!d || d.turn !== next.turn || d.move !== "reteach" || !d.armId) return null;
  const randomised = d.chosenBy === "thompson" || d.chosenBy === "explore";
  return decisionRecordStmt({ lessonId, turn: next.turn, pointId: "RT-ARM", options: Array.isArray(d.offerPick) && d.offerPick.length ? d.offerPick : [d.armId],
    chosen: d.armId, chosenBy: String(d.chosenBy ?? "unknown"), randomised, propensity: null,
    seedRef: randomised ? `${next.seed ?? ""}:reteach:${d.skillId ?? ""}` : null, reasons: ["move.reteach"], legalMode });
}

/**
 * Whether a 016 table exists in this database: a turn never writes into a table the deploy has not migrated yet (that
 * would fail the whole turn's transaction). Probed once per process (the turn starts the probe beside its kit read); a
 * failed probe answers false and is retried by the next turn.
 * @returns {Promise<boolean>}
 */
const ready = new Map();
export function tableReady(name, q) {
  if (!ready.has(name)) {
    ready.set(name, Promise.resolve().then(() => q("select to_regclass($1) is not null as ok", [name]))
      .then((rows) => !!rows?.[0]?.ok, () => { ready.delete(name); return false; }));
  }
  return ready.get(name);
}
/** Tests: forget the probes. */
export const __resetTables = () => ready.clear();
