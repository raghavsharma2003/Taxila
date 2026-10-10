// The per-family rule files (S0.3), in a FIXED order: the order of RULES is the order of coverage entries, and the first
// entry for a skill or topic wins admission (levels.js entryFor). The four round-3 families come first in their original
// order, so data/play/coverage.json is byte-identical to the pre-split build. A lane adds a family by dropping
// `rules/<family>.mjs` beside these (exporting `family`, `RULES`, `ACTS`, optional `check(rule, problems)`); it is picked
// up after the fixed ones, alphabetically, with no edit to this file or to build-coverage.mjs.
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXED = ["todo-jodo", "taraazu", "nishana", "kyun-lab"];
const SKIP = new Set(["index.mjs", "rule.mjs"]);
const extra = readdirSync(HERE).filter((f) => f.endsWith(".mjs") && !SKIP.has(f) && !FIXED.includes(f.slice(0, -4))).map((f) => f.slice(0, -4)).sort();

/** [{ family, RULES, ACTS, check? }] in admission order. */
export const FAMILY_RULES = [];
for (const id of [...FIXED, ...extra]) {
  const m = await import(pathToFileURL(join(HERE, `${id}.mjs`)).href);
  if (m.family !== id || !Array.isArray(m.RULES) || !m.ACTS || typeof m.ACTS !== "object") throw new Error(`rules/${id}.mjs: must export family "${id}", RULES[] and ACTS{}`);
  FAMILY_RULES.push(m);
}
export const RULES = FAMILY_RULES.flatMap((m) => m.RULES);
export const ACTS = Object.assign({}, ...FAMILY_RULES.map((m) => m.ACTS));
/** family id → its own check (family-specific validation; e.g. kyun-lab's labs). */
export const CHECKS = Object.fromEntries(FAMILY_RULES.filter((m) => typeof m.check === "function").map((m) => [m.family, m.check]));
