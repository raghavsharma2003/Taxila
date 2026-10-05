// Required answer parts per kit item (VALUES-100 V1.1 "multi-part keys are graded partial"). A kit key often carries a
// reason or an example the question never asked for, so "is this key multi-part?" cannot be read off the key's commas:
// owner-truth patch 04's multiPartKey called 97% (169/174) of two-rater-agreed SINGLE-part keys multi-part
// (evals/grading-truth/data/parts-labels.json, 2026-10-05). The answer is data, authored once per item and adjudicated:
//   { "<itemId>": { "parts": ["…", "…"], "acceptable": { "<entry>": "complete" | "partial" | "wrong" } } }
// built by evals/grading-truth/label-parts.mjs (two raters from different model families; only agreed labels) plus a
// human pass on every disagreement. An item with no row keeps today's behaviour (single-part, acceptable = complete).
import { readFileSync, existsSync } from "node:fs";

let cache = null;
const FILE = () => process.env.TAXILA_PARTS_FILE || new URL("../../data/kits-parts.json", import.meta.url).pathname;
function load() {
  if (cache) return cache;
  const f = FILE();
  try { cache = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).items ?? {} : {}; } catch { cache = {}; }
  return cache;
}
/** @returns {{ parts?: string[], acceptable?: Record<string, "complete"|"partial"|"wrong"> } | null} */
export const partsOf = (itemId) => (itemId ? load()[itemId] ?? null : null);
/** Tests only. */
export const resetPartsCache = () => { cache = null; };
