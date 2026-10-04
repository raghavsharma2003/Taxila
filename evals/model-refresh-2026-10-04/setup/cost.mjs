// Cost Management: actual billed meters on the Foundry account (proves Direct vs Fireworks by what was charged), and spend for this workflow.
// Usage: node cost.mjs [fromISO] [toISO]
import { writeFileSync } from "node:fs";
import { arm, SUB } from "./arm.mjs";
const from = process.argv[2] || "2026-09-15T00:00:00Z", to = process.argv[3] || "2026-10-04T23:59:59Z";
const body = { type: "ActualCost", timeframe: "Custom", timePeriod: { from, to },
  dataset: { granularity: "None", aggregation: { cost: { name: "Cost", function: "Sum" } },
    grouping: [{ type: "Dimension", name: "ResourceId" }, { type: "Dimension", name: "MeterCategory" }, { type: "Dimension", name: "MeterSubCategory" }, { type: "Dimension", name: "Meter" }] } };
const r = await arm("POST", `/subscriptions/${SUB}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`, body);
console.log("status", r.status, r.status !== 200 ? JSON.stringify(r.body).slice(0, 400) : "");
const cols = (r.body.properties?.columns || []).map((c) => c.name); const rows = r.body.properties?.rows || [];
const out = rows.map((x) => Object.fromEntries(cols.map((c, i) => [c, x[i]])));
writeFileSync(`results/cost-${from.slice(0, 10)}_${to.slice(0, 10)}.json`, JSON.stringify(out, null, 1));
const tot = out.reduce((a, x) => a + x.Cost, 0); console.log("rows", out.length, "total", tot.toFixed(2), out[0]?.Currency);
for (const x of out.filter((x) => /fireworks|deepseek|kimi|moonshot|ds|MAI|speech/i.test(`${x.MeterSubCategory} ${x.Meter}`)).sort((a, b) => b.Cost - a.Cost).slice(0, 40))
  console.log(x.Cost.toFixed(3).padStart(9), "|", x.MeterCategory, "|", x.MeterSubCategory, "|", x.Meter, "|", (x.ResourceId || "").split("/").pop());
