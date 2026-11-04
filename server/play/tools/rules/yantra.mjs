// Play coverage rules for the yantra family (round 7 E6, science puzzle-physics). One family, several modes built by
// separate lanes, so each mode's RULES and ACTS live in their own file under rules/yantra/<mode>.mjs (exporting RULES and
// ACTS), merged here in alphabetical order of the file names.
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

export const family = "yantra";
const DIR = join(dirname(fileURLToPath(import.meta.url)), "yantra");
const mods = [];
for (const f of readdirSync(DIR).filter((x) => x.endsWith(".mjs")).sort()) mods.push(await import(pathToFileURL(join(DIR, f)).href));
export const RULES = mods.flatMap((m) => m.RULES ?? []);
export const ACTS = Object.assign({}, ...mods.map((m) => m.ACTS ?? {}));
