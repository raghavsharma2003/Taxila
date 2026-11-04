// node scripts/kits/run.mjs <g1|w1a|w1b|w1c|w2|w3|w4|all> [--run] [--cap N] [--only <prefix>] [--out <dir>]
// Dry run by default (exact call count and estimate, nothing called). See scripts/kits/lib/runner.mjs and KIT-WORKFLOW.md.
// W5 (the 'teen' numeral rewrite) is its own script with no model call: scripts/kits/w5-filter-numerals.mjs.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs, runWorkflow, totals } from "./lib/runner.mjs";
import { WORKFLOWS } from "./workflows.mjs";

const opts = parseArgs(process.argv.slice(2));
const names = opts.name === "all" ? Object.keys(WORKFLOWS) : [opts.name];
if (!names[0] || names.some((n) => !WORKFLOWS[n])) {
  console.error(`usage: node scripts/kits/run.mjs <${Object.keys(WORKFLOWS).join("|")}|all> [--run] [--cap N] [--only prefix]`);
  process.exit(2);
}
if (opts.run && names.length > 1) { console.error("--run takes one workflow at a time"); process.exit(2); }
let calls = 0, cost = 0;
for (const n of names) {
  const wf = WORKFLOWS[n];
  if (wf.packets) {
    const packets = wf.packets(opts);
    console.log(`${wf.name}: 0 Azure calls; ${packets.length} rating packets (${packets.reduce((a, p) => a + p.length, 0)} items) for the in-session level rating`);
    if (opts.run) {
      const out = opts.out ?? join("evals", "kit-runs", wf.name);
      mkdirSync(out, { recursive: true });
      packets.forEach((p, i) => writeFileSync(join(out, `packet-${String(i).padStart(4, "0")}.json`), JSON.stringify(p, null, 1)));
      console.log(`wrote ${packets.length} packets to ${out}`);
    }
    continue;
  }
  let r;
  try { r = await runWorkflow(wf, opts); } catch (e) { console.log(`${wf.name}: cannot plan: ${e.message}`); continue; }
  calls += r.calls ?? 0; cost += r.cost ?? 0;
}
if (names.length > 1) console.log(`\nall: ${calls} Azure calls, ≈ $${Math.round(cost * 100) / 100}`);
export { totals };
