// Comprehension persistence (migration 007_comprehension.sql): statement builders only ({ text, params }), so the
// caller runs them inside the learner writer's transaction under the same advisory lock. Every child-linked write
// is gated by the legal mode (layer `kt`: facets are academic record derived from answers, same floor as KT, M1).
import { assertWritable, legalModeOf } from "../learner/mode.js";
import { COMP_PARAMS_VERSION } from "./params.js";

/** Child-linked comprehension tables (the M0 ratchet must delete these; INTEGRATION.md asks mode.js to list them under `kt`). */
export const COMP_TABLES = Object.freeze(["comp_facet_state", "probe_log", "grade_audit", "reteach_attempts", "rep_fluency", "weave_queue"]);

const gate = (child) => { assertWritable(child, "kt"); return legalModeOf(child); };

/** Upsert the cached facet fold for each belief (beliefFor output). */
export function facetStmts(child, beliefs) {
  const mode = gate(child);
  return beliefs.filter(Boolean).map((b) => ({
    text: `insert into comp_facet_state (child_id, skill_id, params_version, u_p, t_p, facets, state, reasons, updated_at, legal_mode_at_write)
      values ($1,$2,$3,$4,$5,$6,$7,$8,now(),$9)
      on conflict (child_id, skill_id) do update set params_version=excluded.params_version, u_p=excluded.u_p, t_p=excluded.t_p, facets=excluded.facets,
        state=excluded.state, reasons=excluded.reasons, updated_at=now(), legal_mode_at_write=excluded.legal_mode_at_write`,
    params: [child.id, b.skillId, COMP_PARAMS_VERSION, b.U, b.T, JSON.stringify(b.facets), b.state, JSON.stringify(b.reasons), mode],
  }));
}

/** One asked probe (ProbePlan) → probe_log. */
export const probeLogStmt = (child, sessionId, plan, evidenceId = null) => ({
  text: `insert into probe_log (child_id, session_id, skill_id, shape_id, facet, mandatory, reason, test_weight, evidence_id, legal_mode_at_write)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
  params: [child.id, sessionId, plan.skillId, plan.shapeId, plan.facet, !!plan.mandatory, plan.reason, plan.testWeight, evidenceId, gate(child)],
});

/**
 * One closed-label verdict (closed.js auditRow) → grade_audit. The verbatim span is written only with
 * `keepSpan: true` (the guardian's `transcripts_retention` consent); otherwise it is nulled HERE as well as in
 * auditRow, so a caller that builds its own row cannot persist the child's words by accident.
 */
export function gradeAuditStmt(child, row, { keepSpan = false } = {}) {
  const mode = gate(child);
  if (keepSpan !== true) row = { ...row, span: null };
  return {
    text: `insert into grade_audit (child_id, session_id, skill_id, shape_id, op, grader_version, model, target_id, label, span, span_ok, lang, ms, legal_mode_at_write)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    params: [child.id, row.session_id, row.skill_id, row.shape_id, row.op, row.grader_version, row.model, row.target_id, row.label, row.span, row.span_ok, row.lang, row.ms, mode],
  };
}

/** A re-teach decision (selectReteach output with move 'reteach' | 'recap'). */
export function reteachStmt(child, sessionId, d) {
  const mode = gate(child);
  return {
    text: `insert into reteach_attempts (child_id, session_id, skill_id, misconception_id, arm_id, rep_class, representation_id, trigger, chosen_by, legal_mode_at_write)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
    params: [child.id, sessionId, d.skillId, d.misId, d.armId, d.repClass, d.representation ?? null, d.trigger, d.move === "recap" ? "recap" : d.chosenBy, mode],
  };
}
export const reteachOutcomeStmt = (id, outcome, reward) => ({ text: "update reteach_attempts set outcome=$2, reward=$3, resolved_at=now() where id=$1", params: [id, outcome, reward] });

/** Replace the child's open weave entries with the reducer's queue (queued/hosted rows only; done/expired are history). */
export function weaveStmts(child, q) {
  const mode = gate(child);
  const open = q.filter((e) => e.status === "queued" || e.status === "hosted");
  return [
    { text: "update weave_queue set status='done' where child_id=$1 and status in ('queued','hosted') and not (skill_id = any($2))", params: [child.id, open.map((e) => e.skillId)] },
    ...open.map((e) => ({
      text: `insert into weave_queue (child_id, skill_id, kind, anchor_at, earliest_at, due_at, topics_since, host_candidates, host, status, legal_mode_at_write)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        on conflict (child_id, skill_id, kind) where status in ('queued','hosted') do update set topics_since=excluded.topics_since, host=excluded.host, status=excluded.status`,
      params: [child.id, e.skillId, e.kind, e.anchorAt, e.earliestAt, e.dueAt, e.topicsSince, e.hostCandidates, e.host ?? null, e.status, mode],
    })),
  ];
}

/** Population posterior update (no child id). */
export const armPosteriorStmt = (armId, cluster, reward) => ({
  text: `insert into arm_posteriors (arm_id, cluster, a, b, n) values ($1,$2,1+$3::double precision,2-$3::double precision,1)
    on conflict (arm_id, cluster) do update set a=arm_posteriors.a+$3::double precision, b=arm_posteriors.b+(1-$3::double precision), n=arm_posteriors.n+1, updated_at=now()`,
  params: [armId, cluster, reward],
});

/** M0 ratchet: every comprehension row of the child goes. */
export const ratchetStmts = (childId) => COMP_TABLES.map((t) => ({ text: `delete from ${t} where child_id = $1`, params: [childId] }));
