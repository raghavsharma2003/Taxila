// Play coverage rules for the yantra family (round 7 E6, science puzzle-physics). One family, several modes built by
// separate lanes: each mode's rules live in rules/yantra/<mode>.mjs (exporting RULES and ACTS only); this file merges
// them, in file-name order, so rules/index.mjs sees one family file named after the family.
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

export const family = "yantra";
const DIR = join(dirname(fileURLToPath(import.meta.url)), "yantra");
const files = readdirSync(DIR).filter((f) => f.endsWith(".mjs")).sort();
export const RULES = [];
export const ACTS = {};
for (const f of files) {
  const m = await import(pathToFileURL(join(DIR, f)).href);
  if (!Array.isArray(m.RULES) || !m.ACTS || typeof m.ACTS !== "object") throw new Error(`rules/yantra/${f}: must export RULES[] and ACTS{}`);
  RULES.push(...m.RULES);
  Object.assign(ACTS, m.ACTS);
}
