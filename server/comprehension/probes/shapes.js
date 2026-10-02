// The probe-shape registry (COMPREHENSION-ENGINE.md §4.1; conversation-probes C01-C36). Pure data in shapes.json:
// each record names one family, the facet(s) it informs, one evidence class from the closed set, one grading
// operator and a test risk. Shapes give STRUCTURE, never lines: the voice model writes the words (inherited law:
// sentence-shaped prompt text gets recited).
import { readFileSync } from "fs";
import { OUTCOMES } from "../../learner/kt/outcomes.js";
import { RISK_WEIGHT } from "../params.js";

const DATA = JSON.parse(readFileSync(new URL("./shapes.json", import.meta.url), "utf8"));
export const SHAPES_VERSION = DATA.version;
/** @type {readonly any[]} */
export const SHAPES = Object.freeze(DATA.shapes.map((s) => Object.freeze(s)));
const BY_ID = new Map(SHAPES.map((s) => [s.id, s]));
export const shapeById = (id) => BY_ID.get(id);
export const familyOf = (id) => BY_ID.get(id)?.family ?? null;

export const OPERATORS = Object.freeze(["R-KEY", "R-OPT", "R-CATCH", "R-EXP", "R-MIS", "R-INST"]);
export const CODE_OPS = Object.freeze(new Set(["R-KEY", "R-OPT", "R-CATCH"]));
/** The operator whose verdict carries the facet evidence (`R-OPT+R-EXP` → the why is LLM-graded). */
export const evidenceOp = (shape) => shape.op.split("+").at(-1);
export const isCodeGraded = (shape) => CODE_OPS.has(evidenceOp(shape));
export const FAMILIES = Object.freeze({ A: "role reversal", B: "evaluate", C: "compare", D: "predict", E: "story", F: "own world", G: "show", H: "delayed", I: "game" });
export const KIT_INPUTS = Object.freeze(["expectations", "misconceptions", "characterView", "myth", "diagnostic", "items", "counterfactual",
  "solver", "instances", "interestContexts", "representations", "weaveHosts"]);

/**
 * Test weight of one probe turn (§3.4): risk weight, × 0.5 when the shape is also a learning move.
 * @param {any} shape
 */
export const testWeight = (shape) => RISK_WEIGHT[shape.testRisk] * (shape.learningMove ? 0.5 : 1);

/** Registry lint (§4.1 eval predicate). Returns a list of problems; [] = clean. */
export function lintShapes(shapes = SHAPES) {
  const out = [];
  const ids = new Set();
  for (const s of shapes) {
    if (ids.has(s.id)) out.push(`${s.id}: duplicate id`);
    ids.add(s.id);
    if (!FAMILIES[s.family]) out.push(`${s.id}: unknown family ${s.family}`);
    if (!OUTCOMES[s.emits]) out.push(`${s.id}: class ${s.emits} not in the closed set`);
    if (s.pre && !OUTCOMES[s.pre]) out.push(`${s.id}: pre class ${s.pre} not in the closed set`);
    for (const op of s.op.split("+")) if (!OPERATORS.includes(op)) out.push(`${s.id}: unknown operator ${op}`);
    if (!s.kitInputs?.length) out.push(`${s.id}: names no kit input`);
    for (const k of s.kitInputs ?? []) if (!KIT_INPUTS.includes(k)) out.push(`${s.id}: unknown kit input ${k}`);
    if (!(s.testRisk in RISK_WEIGHT)) out.push(`${s.id}: unknown testRisk ${s.testRisk}`);
    if (!s.facets?.length) out.push(`${s.id}: names no facet`);
    if (/[.!?]["']?$/.test(s.name) || s.name.split(" ").length > 9) out.push(`${s.id}: name reads like a line, not a shape`);
  }
  return out;
}
