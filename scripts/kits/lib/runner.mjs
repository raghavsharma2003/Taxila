// The one runner for Learning's spend-gated kit workflows (round 7 F; docs/design/round7/learning/KIT-WORKFLOW.md).
//
//   node scripts/kits/run.mjs <workflow> [--run] [--cap N] [--only <prefix>] [--out <dir>]
//
// - Default is a DRY RUN: it builds the plan from the repo's own data, prints the jobs, the exact Azure call count and the
//   cost estimate, and calls nothing. `--run` is required to spend (and needs AZURE_OPENAI_* via --env-file=.env.local).
// - `--cap N` is a hard ceiling on Azure calls for this run (default: the workflow's own cap). The runner stops at the
//   cap and reports; it never loops on failures (azure-lite retries a call at most 4 times on 429/5xx/bad JSON).
// - Resumable: every finished job is appended to <out>/ledger.jsonl; a re-run skips it.
// - Azure only AUTHORS. Checking is Claude's (owner 2026-10-27: judges and evaluation use Claude): the run writes
//   <out>/verify-packet.jsonl (each item WITHOUT its key) for the in-session blind solve, and <out>/keys.jsonl. Nothing is
//   written to data/kits; a run's items reach data/kits only after the in-session blind solve agreed (the merge script was one-off and is gone).
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** $ per 1M tokens [in, out]: Azure Direct, as in evals/content-level-v2/lib/azure-lite.mjs PRICES. */
export const MODEL = "taxila-gpt6";
export const PRICE = [2.0, 10.0];

export class CapReached extends Error {}

/** PURE. CLI → options. */
export function parseArgs(argv) {
  const get = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const cap = get("--cap");
  return { name: argv.find((a) => !a.startsWith("--") && !/^\d+$/.test(a) && a !== get("--only") && a !== get("--out")) ?? null,
    run: argv.includes("--run"), cap: cap == null ? null : Number(cap), only: get("--only"), out: get("--out") };
}

/** PURE. A plan's totals: calls by stage and the estimate from each job's token guess. */
export function totals(jobs) {
  const byStage = {};
  let calls = 0, cost = 0;
  for (const j of jobs) {
    byStage[j.stage] = (byStage[j.stage] ?? 0) + 1;
    calls++;
    cost += ((j.estIn ?? 3000) * PRICE[0] + (j.estOut ?? 1500) * PRICE[1]) / 1e6;
  }
  return { calls, byStage, cost: Math.round(cost * 100) / 100 };
}

/** The ids of jobs already done in this output directory. */
export function doneIds(out) {
  const f = join(out, "ledger.jsonl");
  if (!existsSync(f)) return new Set();
  return new Set(readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l).id; } catch { return null; } }).filter(Boolean));
}

/**
 * Run a workflow definition: { name, cap, plan(opts) → jobs, system, user(job) → string, collect(job, json) → items[] }.
 * Each job: { id, stage, estIn?, estOut?, ... }. Items: { id, prompt..., answer, acceptable?, ... } written to the packet.
 */
export async function runWorkflow(wf, opts, { chat } = {}) {
  const jobs = await wf.plan(opts);
  const t = totals(jobs);
  const cap = opts.cap ?? wf.cap;
  const out = opts.out ?? join("evals", "kit-runs", wf.name);
  console.log(`${wf.name}: ${jobs.length} jobs, ${t.calls} Azure calls (${Object.entries(t.byStage).map(([k, v]) => `${k} ${v}`).join(", ")}), ≈ $${t.cost}; cap ${cap}`);
  if (!opts.run) {
    for (const j of jobs.slice(0, 8)) console.log(`  ${j.stage} ${j.id}`);
    if (jobs.length > 8) console.log(`  … ${jobs.length - 8} more`);
    console.log("dry run: nothing called. Add --run (with --env-file=.env.local) to spend.");
    return { dry: true, ...t, cap };
  }
  mkdirSync(out, { recursive: true });
  const call = chat ?? (await import("../../../evals/content-level-v2/lib/azure-lite.mjs")).chatJSON;
  const done = doneIds(out);
  let used = 0, items = 0, spent = 0;
  for (const j of jobs) {
    if (done.has(j.id)) continue;
    if (used >= cap) { console.log(`cap ${cap} reached: stopping; re-run to continue (finished jobs are skipped)`); break; }
    used++;
    let res;
    try { res = await call(MODEL, wf.system, wf.user(j), { maxTokens: j.maxTokens ?? 6000, tag: `${wf.name}:${j.id}` }); }
    catch (e) { appendFileSync(join(out, "errors.jsonl"), JSON.stringify({ id: j.id, error: String(e?.message ?? e).slice(0, 300) }) + "\n"); continue; }
    spent += res.cost ?? 0;
    const got = wf.collect(j, res.json) ?? [];
    for (const it of got) {
      const { answer, acceptable, ...shown } = it;
      appendFileSync(join(out, "verify-packet.jsonl"), JSON.stringify(shown) + "\n");
      appendFileSync(join(out, "keys.jsonl"), JSON.stringify({ id: it.id, answer, acceptable: acceptable ?? [] }) + "\n");
    }
    items += got.length;
    appendFileSync(join(out, "ledger.jsonl"), JSON.stringify({ id: j.id, items: got.length, cost: res.cost ?? 0, at: new Date().toISOString() }) + "\n");
  }
  writeFileSync(join(out, "summary.json"), JSON.stringify({ workflow: wf.name, calls: used, items, cost: Math.round(spent * 100) / 100, at: new Date().toISOString() }, null, 1));
  console.log(`${wf.name}: ${used} calls, ${items} items to verify, $${spent.toFixed(2)}. Next: the in-session blind solve of ${out}/verify-packet.jsonl`);
  return { dry: false, calls: used, items, cost: spent };
}
