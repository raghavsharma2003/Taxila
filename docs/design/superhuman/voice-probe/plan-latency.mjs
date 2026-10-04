// plan-latency.mjs — can the LLM delivery planner sit on the live path? latency + validity per (model, effort), n=2 x 5 lines.
import { plan } from "./planner.mjs"; import { LINES } from "./lines.mjs"; import fs from "node:fs";
const ARMS = [["taxila-fast", "none"], ["taxila-fast", "minimal"], ["grok-4-1-fast-non-reasoning", null]];
const out = {};
for (const [model, effort] of ARMS) { const k = `${model}|${effort}`; out[k] = [];
  for (let rep = 0; rep < 2; rep++) for (const l of LINES) { const r = await plan(l, { model, effort: effort || undefined });
    out[k].push({ line: l.id, ms: r.ms, ok: !!r.plan, v: r.violations, err: r.error }); console.log(k, l.id, r.ms, r.plan ? "OK" : "REJECT", JSON.stringify(r.violations || r.error).slice(0, 120)); } }
const sum = Object.fromEntries(Object.entries(out).map(([k, a]) => { const ms = a.map((x) => x.ms).sort((x, y) => x - y); return [k, { n: a.length, valid: a.filter((x) => x.ok).length, p50: ms[Math.floor(ms.length / 2)], p90: ms[Math.floor(ms.length * 0.9)] }]; }));
fs.writeFileSync("plan-latency.json", JSON.stringify({ when: new Date().toISOString(), from: "US sandbox -> eastus2", summary: sum, raw: out }, null, 1)); console.table(sum);
