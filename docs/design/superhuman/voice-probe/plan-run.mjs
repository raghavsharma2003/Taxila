import { plan } from "./planner.mjs"; import { LINES } from "./lines.mjs"; import fs from "node:fs";
const N = +(process.env.N || 3); const out = {};
for (const l of LINES) { out[l.id] = [];
  for (let i = 0; i < N; i++) { const r = await plan(l); out[l.id].push(r);
    console.log(l.id, i, r.ms + "ms", r.plan ? "OK" : "REJECT", JSON.stringify(r.violations), r.plan ? r.plan.segments.map(s => `${s.nonverbal_before !== "none" ? "<" + s.nonverbal_before + ">" : ""}${s.pause_before_ms ? "{" + s.pause_before_ms + "}" : ""}[${s.emotion}/${s.pace}] ${s.text}`).join(" | ") : JSON.stringify(r.raw || r.error).slice(0, 300)); } }
fs.writeFileSync("plans.json", JSON.stringify(out, null, 1));
