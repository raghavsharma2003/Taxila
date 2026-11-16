// Before/after table for two replay.mjs runs: per pilot topic and child, each skill's prior → end estimate and display,
// answers (right/total), and whether the weak-foundation rule fires.
//   node evals/learner-pilot-replay/analyze.mjs <before.json> <after.json>
import { readFileSync } from "node:fs";
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, "utf8")));
const key = (r) => `${r.topic}|${r.child}|${r.skill}`;
const B = new Map(b.rows.map((r) => [key(r), r]));
console.log("| topic | child | skill | prior | before: end, display | after: end, display | answers (right/all) before → after | weak before → after |");
console.log("|---|---|---|---|---|---|---|---|");
for (const r of a.rows) {
  const s = B.get(key(r));
  if (!s) continue;
  console.log(`| ${r.topic} | ${r.child} | ${r.skill} | ${r.prior} | ${r.end}, ${r.display} | ${s.end}, ${s.display} | ${r.right}/${r.answers} → ${s.right}/${s.answers} | ${r.weak ? "yes" : "no"} → ${s.weak ? "yes" : "no"} |`);
}
