// Regenerates shared/engine-topic-map.json: curriculum topic id → the built engine the content research
// mapped as that topic's primary engine (docs/research/content/{maths,science}-engine-map.json, after the
// CONTENT-ENGINE §2.2 merges). The Director's planner falls back to it when no kit engineHint resolves.
// Usage: node scripts/engine-topic-map.mjs
import { readFileSync, writeFileSync } from "fs";
import { ENGINES } from "../shared/engine-catalog.js";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => JSON.parse(readFileSync(root + p, "utf8"));
const MERGE = { "measure-lab": "measure", "heat-flow": "particles", "number-grid": "patterns", symmetry: "shape-lab", chance: "data-graphs", "algebra-moves": "symbol-lab", "rule-lab": "symbol-lab" };
const out = {};
const m = read("docs/research/content/maths-engine-map.json");
for (const [tid, v] of Object.entries(m.topics)) {
  const id = `${MERGE[v.primary] ?? v.primary}@1`;
  if (ENGINES[id]) out[tid] = id;
}
const s = read("docs/research/content/science-engine-map.json");
for (const t of s.topics) {
  if (t.format !== "engine") continue;
  const base = t.engine.split("@")[0];
  const id = `${MERGE[base] ?? base}@1`;
  if (ENGINES[id]) out[t.id] = id;
}
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(root + "shared/engine-topic-map.json", JSON.stringify(sorted, null, 0).replace(/,"/g, ',\n"') + "\n");
console.log(`engine-topic-map.json: ${Object.keys(sorted).length} topics`);
