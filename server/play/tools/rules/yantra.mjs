// Play coverage rules for the yantra family (round 7 E6, science puzzle-physics). Each mode's lane authors its own file in
// rules/yantra/<mode>.mjs (exporting RULES and ACTS); this loader merges them, alphabetically, so lanes never edit one file.
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "yantra");
const mods = [];
for (const f of readdirSync(DIR).filter((x) => x.endsWith(".mjs")).sort()) mods.push(await import(pathToFileURL(join(DIR, f)).href));

export const family = "yantra";
export const RULES = mods.flatMap((m) => m.RULES ?? []);
export const ACTS = Object.assign({}, ...mods.map((m) => m.ACTS ?? {}));
