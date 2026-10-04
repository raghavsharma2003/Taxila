// Daily cost per meter on the Foundry account, for meters matching a regex (default: DeepSeek/Kimi/Fireworks).
import { writeFileSync } from "node:fs";
import { arm, SUB } from "./arm.mjs";
const re = new RegExp(process.argv[2] || "Deepseek|Kimi|Fireworks|MAI", "i");
const body = { type: "ActualCost", timeframe: "Custom", timePeriod: { from: "2026-09-20T00:00:00Z", to: "2026-10-04T23:59:59Z" },
  dataset: { granularity: "Daily", aggregation: { cost: { name: "Cost", function: "Sum" }, qty: { name: "UsageQuantity", function: "Sum" } },
    grouping: [{ type: "Dimension", name: "MeterSubCategory" }, { type: "Dimension", name: "Meter" }, { type: "Dimension", name: "ResourceId" }] } };
const r = await arm("POST", `/subscriptions/${SUB}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`, body);
const cols = (r.body.properties?.columns || []).map((c) => c.name); const rows = (r.body.properties?.rows || []).map((x) => Object.fromEntries(cols.map((c, i) => [c, x[i]])));
if (r.status!==200) console.log(JSON.stringify(r.body).slice(0,400)); console.log("status", r.status, "rows", rows.length, cols.join(","));
const f = rows.filter((x) => re.test(`${x.MeterSubCategory} ${x.Meter}`));
writeFileSync("results/cost-daily-models.json", JSON.stringify(f, null, 1));
for (const x of f.sort((a, b) => (a.Meter + a.UsageDate).localeCompare(b.Meter + b.UsageDate))) console.log(x.UsageDate, "|", x.MeterSubCategory, "|", x.Meter, "|", x.MeterId, "| qty", x.UsageQuantity?.toFixed?.(4), "| INR", x.Cost.toFixed(3));
