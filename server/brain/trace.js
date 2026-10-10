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
 * One brain_trace row (016). `arb` is kernel.arbitrate's result. Idempotent per (lesson, turn). `ids` (the 016 columns
 * item_id / misconception_id, kit ids only) are written only when the database has them (`withIds`: columnReady), so a
 * database on the first 016 never fails the turn's transaction.
 * @param {{ lessonId: string, turn: number, lane: string, move: string, beat?: string|null, inputsHash: string,
 *   proposals: any[], arb: { accepted: any[], rejected: { p: any, why: string }[] }, reasons?: string[], serverMs?: number|null,
 *   kernelUs?: number|null, legalMode: string, itemId?: string|null, misconceptionId?: string|null, withIds?: boolean }} t
 */
export function brainTraceStmt(t) {
  const reasons = knownReasons([...(t.reasons ?? []), ...t.arb.accepted.flatMap((p) => p.reason ?? []), ...t.arb.rejected.map((r) => r.why)]);
  const params = [t.lessonId, t.turn, t.lane, t.move, t.beat ?? null, t.inputsHash, JSON.stringify(t.proposals.map(PROPOSAL_KEYS)),
    JSON.stringify(t.arb.accepted.map(PROPOSAL_KEYS)), JSON.stringify(t.arb.rejected.map((r) => ({ source: r.p.source, kind: r.p.kind, why: r.why }))),
    reasons, t.serverMs == null ? null : Math.round(t.serverMs), t.kernelUs == null ? null : Math.round(t.kernelUs), t.legalMode];
  if (t.withIds) {
    const id = (v) => (typeof v === "string" && v.length && v.length <= 120 ? v : null);
    return {
      text: `insert into brain_trace (lesson_id, turn, lane, move, beat, inputs_hash, proposals, accepted, rejected, reasons, server_ms, kernel_us, legal_mode_at_write, item_id, misconception_id)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) on conflict (lesson_id, turn) do nothing returning id`,
      params: [...params, id(t.itemId), id(t.misconceptionId)],
    };
  }
  return {
    text: `insert into brain_trace (lesson_id, turn, lane, move, beat, inputs_hash, proposals, accepted, rejected, reasons, server_ms, kernel_us, legal_mode_at_write)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict (lesson_id, turn) do nothing returning id`,
    params,
  };
}

/**
 * The comprehension trail of a turn as closed codes (owner priority 1; reasons.js families cls / cls_source / verdict /
 * guard): what the classifier read, where the label came from (the model, the fallback deployment, an outage, the bytes),
 * the verdict the child was shown, and what the reply guard did to her words. PURE.
 * @param {{ cls: any, classified: boolean, help?: boolean, uiVerdict?: string|null, guard?: { caught?: string[], replaced?: boolean, rewritten?: boolean, repaired?: boolean } | null }} x
 */
export function comprehensionReasons({ cls, classified, help = false, uiVerdict = null, guard = null }) {
  const BYTES = new Set(["exact", "lexical", "echo", "empty", "chip", "predicate", "module", "asr", "content_filter", "error", "help", "relational", "speculative"]);
  const out = [];
  if (cls) {
    out.push(`cls.${cls.outcome ?? "none"}`);
    const src = cls.source === "model" ? (cls.fallback ? "fallback" : "model") : BYTES.has(cls.source) ? cls.source : "bytes";
    out.push(`cls_source.${src}`);
  } else out.push("cls.none", `cls_source.${help ? "help" : classified ? "none" : "module"}`);
  out.push(`verdict.${uiVerdict ?? "ungraded"}`);
  // round 4 (patch 13, SHADOW): what the item-context set-aside would have done with a predicate hit (classify.js)
  const sa = cls?.setAsideWould;
  if (sa && typeof sa.why === "string") {
    out.push(sa.aside ? "safety_setaside_would.item_context" : `safety_setaside_not.${sa.why}`);
    if (["item_context", "novel", "rest_fires"].includes(sa.why)) {
      const n = Number(sa.novel) || 0, m = Number(sa.masked) || 0;
      out.push(`setaside_novel.${n > 2 ? "over" : `n${n}`}`, `setaside_masked.${m >= 5 ? "n5plus" : `n${m}`}`);
    }
  }
  if (guard) {
    for (const k of ["replaced", "rewritten", "repaired"]) if (guard[k]) out.push(`guard.${k}`);
    for (const c of guard.caught ?? []) out.push(`guard.${c}`);
  }
  return out;
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
/**
 * Whether a column exists (the 016 fixer columns item_id / misconception_id on a database that ran the first 016).
 * Probed once per process like tableReady; a failed probe answers false and is retried.
 * @returns {Promise<boolean>}
 */
export function columnReady(table, column, q) {
  const k = `${table}.${column}`;
  if (!ready.has(k)) {
    ready.set(k, Promise.resolve().then(() => q("select count(*)::int as n from information_schema.columns where table_name = $1 and column_name = $2", [table, column]))
      .then((rows) => Number(rows?.[0]?.n) > 0, () => { ready.delete(k); return false; }));
  }
  return ready.get(k);
}
/** Tests: forget the probes. */
export const __resetTables = () => ready.clear();
