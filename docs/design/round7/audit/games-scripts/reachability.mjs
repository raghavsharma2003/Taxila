// Games audit: registered but unreachable. Which family/mode pairs have a law but no coverage entry (no topic can start them),
// which have a view registered but no logic or the reverse, which engines render a family/mode no topic reaches.
//   node docs/design/round7/audit/games-scripts/reachability.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { LOGIC } from "../../../../../src/play/families/index.ts";
import { MODES, FAMILIES } from "../../../../../shared/play.ts";
import { ENGINE_ENTRIES } from "../../../../../src/play/engines/registry.ts";
import { coverage } from "../../../../../server/play/levels.js";
const R = (p) => readFileSync(new URL(`../../../../../${p}`, import.meta.url), "utf8");
const cov = coverage();
const used = new Map(); for (const e of cov.entries) { const k = `${e.family}/${e.mode}`; used.set(k, (used.get(k) ?? 0) + 1); }
const goalsUsed = new Map(); for (const e of cov.entries) { const k = `${e.family}/${e.mode}`; (goalsUsed.get(k) ?? goalsUsed.set(k, new Set()).get(k)).add(e.goal); }
const declared = []; for (const f of FAMILIES) for (const m of MODES[f]) declared.push(`${f}/${m}`);
console.log("declared modes:", declared.length, " logic keys:", Object.keys(LOGIC).length, " coverage family/modes:", used.size);
console.log("declared, no logic:", declared.filter((k) => !LOGIC[k]));
console.log("logic, not declared in MODES:", Object.keys(LOGIC).filter((k) => !declared.includes(k)));
console.log("logic with NO coverage entry (no topic starts it):", Object.keys(LOGIC).filter((k) => !used.has(k)));
console.log("coverage entries with no logic:", [...used.keys()].filter((k) => !LOGIC[k]));
// goals each logic can generate vs goals any entry uses
// views: families/views.ts registry
const views = R("src/play/families/views.ts");
const viewKeys = [...views.matchAll(/"([a-z\-]+\/[a-z]+)"/g)].map((m) => m[1]);
console.log("view keys:", new Set(viewKeys).size, " logic with no view key:", Object.keys(LOGIC).filter((k) => !viewKeys.includes(k) && !views.includes(k.split("/")[0])));
// engines
for (const e of ENGINE_ENTRIES) for (const r of e.renders) { const k = `${r.family}/${r.mode}`; if (!used.has(k)) console.log(`engine ${e.id} renders ${k} that no topic reaches`); }
// engine-catalog / topic map
const topicMap = JSON.parse(R("shared/engine-topic-map.json"));
const topics = new Set(); for (const d of ["data/curriculum"]) for (const f of readdirSync(new URL(`../../../../../${d}`, import.meta.url))) { try { for (const m of R(`${d}/${f}`).matchAll(/"(c\d-[a-z]+-ch\d+-t\d+)"/g)) topics.add(m[1]); } catch { /* dir */ } }
console.log("engine-topic-map keys:", Object.keys(topicMap).length, "curriculum topic ids seen:", topics.size);
