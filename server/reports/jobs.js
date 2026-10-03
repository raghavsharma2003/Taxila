// The Conductor's end-of-day report jobs (CONDUCTOR.md §7.3, §8.2; kinds registered in server/conductor/config.js,
// enqueued by decide.js foldNight). Idempotent three ways: the job's (kind, idem_key) is unique, a stored report for
// (child, cadence, period, render_version) short-circuits before any model call, and the insert is on-conflict-no-op.
// Budgeted: the Lane B call is checked against job.budget_micro_usd − spent_micro_usd BEFORE it is made, and every
// call's cost is added to spent_micro_usd (fenced by attempt). runJob() has already re-checked consent at claim.
import { FinalJobError, registerHandler } from "../conductor/jobs.js";
import { q } from "../conductor/pg.js";
import { DAY_RE, WEEK_RE } from "./facts.js";
import { ReportGateError, generateReport } from "./index.js";

export class JobCancelled extends Error { constructor() { super("cancel requested"); this.code = "cancelled"; } }

/**
 * @param {any} job the claimed job row
 * @param {{ heartbeat: () => Promise<{ alive: boolean, cancelRequested: boolean }> }} ctx
 * @param {'daily'|'weekly'} cadence
 * @param {{ db?: { q: Function }, llm?: any, k7?: boolean, lookup?: any }} [deps] tests inject these
 */
export async function runReportJob(job, ctx, cadence, deps = {}) {
  const period = cadence === "daily" ? job.input?.day : job.input?.isoWeek;
  if (!(cadence === "daily" ? DAY_RE : WEEK_RE).test(String(period ?? ""))) throw new FinalJobError(`report job ${job.id}: bad period ${period}`);
  const db = deps.db ?? { q };
  const budget = Math.max(0, Number(job.budget_micro_usd ?? 0) - Number(job.spent_micro_usd ?? 0));
  let out;
  try {
    out = await generateReport(job.child_id, { cadence, period }, {
      db, llm: deps.llm, k7: deps.k7, lookup: deps.lookup, budgetMicroUsd: budget,
      beforeCall: async () => { const hb = await ctx.heartbeat(); if (!hb.alive || hb.cancelRequested) throw new JobCancelled(); },
      onSpend: (micro) => db.q("update job set spent_micro_usd = spent_micro_usd + $3 where id = $1 and attempts = $2", [job.id, job.attempts, Math.ceil(micro)]),
    });
  } catch (e) {
    // The gate is deterministic on the same snapshot: a retry would fail the same way and pay the writer again.
    // Final (→ dead + job.failed{final}), audited with rule names only (never line text, which can carry child data).
    if (!(e instanceof ReportGateError)) throw e;
    const rules = [...new Set((e.violations || []).map((v) => `${v.lang ?? ""}:${v.rule}`))].slice(0, 20);
    await db.q("insert into audit (guardian_id, action, detail) values (null, 'parent_report.gate_failed', $1)",
      [{ jobId: String(job.id), kind: job.kind, childId: job.child_id, period, rules }]).catch(() => {});
    throw new FinalJobError(`report gate: ${rules.join(", ")}`);
  }
  if (out.skipped) return `skipped:${out.skipped}`;
  return `parent_report:${out.id}${out.created ? "" : ":existing"}`;
}

registerHandler("report.daily", (job, ctx) => runReportJob(job, ctx, "daily"));
registerHandler("parent.letter", (job, ctx) => runReportJob(job, ctx, "weekly"));
