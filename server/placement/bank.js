// Placement item bank (data/placement/c{C}-{subject}.json), loaded once. Items are grade-anchored on the GE scale of
// server/learner/kt/ability.js (GE 0 = start of class 1; class C runs from GE C-1 to C). An item is usable only when its key
// was blind-solved by another model family and agreed (verified.agrees), or a disagreement was adjudicated with the key
// correct, and the two v2 raters did not put it more than one class away from its anchor (anchorMismatch).
import { readFileSync, readdirSync, existsSync } from "fs";

const DEFAULT_DIR = new URL("../../data/placement/", import.meta.url);
const FILE_RE = /^c(\d+)-(maths|evs|science)\.json$/;
let cache = null;

/**
 * @typedef {{ id: string, class: number, subject: string, strand: string, band: string, ge: number, format: "numeric"|"mcq",
 *   prompt_en: string, prompt_hi: string, answer: string, acceptable?: string[], unit?: string,
 *   options?: { text: string, correct: boolean }[], topicRef?: string, demand?: string }} PlacementItem
 */

export const usable = (it) => !!it && (it.verified?.agrees === true || it.adjudicated?.keyCorrect === true) && !it.anchorMismatch && !it.retired
  && typeof it.ge === "number" && (it.format !== "mcq" || (it.options?.length >= 3 && it.options.filter((o) => o.correct).length === 1));

/** All usable items. `dir` (a file URL or path) is for tests. */
export function loadBank(dir) {
  if (!dir && cache) return cache;
  const base = dir ? (dir instanceof URL ? dir : new URL(`file://${String(dir).replace(/\/?$/, "/")}`)) : DEFAULT_DIR;
  const items = [];
  if (existsSync(base)) {
    for (const f of readdirSync(base).filter((x) => FILE_RE.test(x)).sort()) {
      const d = JSON.parse(readFileSync(new URL(f, base), "utf8"));
      for (const it of d.items ?? []) if (usable(it)) items.push({ ...it, class: d.class, subject: d.subject });
    }
  }
  if (!dir) cache = items;
  return items;
}

/** The strand a child's placement writes: maths:core, evs:core (classes 1-5) or science:core (6+). */
export function strandFor(subject, classLevel) {
  if (subject === "maths") return "maths:core";
  if (subject === "science" || subject === "evs") return classLevel <= 5 ? "evs:core" : "science:core";
  return `${subject}:core`;
}

/**
 * The candidate pool for a child of class C in a subject: the science lineage pools EVS and science (a class-6 child can
 * back-chain into class-5 EVS, a class-5 child can skip ahead into class-6 science). GE window [C-3, C+1.5].
 */
export function poolFor(subject, classLevel, bank = loadBank()) {
  const lineage = subject === "maths" ? ["maths"] : ["evs", "science"];
  return bank.filter((it) => lineage.includes(it.subject) && it.ge >= classLevel - 3 && it.ge <= classLevel + 1.5);
}
