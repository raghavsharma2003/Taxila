// to-brain 054 A, main's second ruling fix 5 (the as-heard reader's harness finding, evals/ only): the rule-based child hears a question in
// any of its authored forms. dry steering c6-ch07-t01 32 to 48: after a park the step was asked in its help wording and re-asked with the
// short ask, and the harness counted a step or card as asked only when her words matched its own prompt — the child said "haan" seven times.
// A question asked in its `reask`, its `simpler`, its Hindi form or its help wording is a question to the child, and so is the short ask or
// the invitation that asks again for the question on the table. The walk is not read or changed: this decides only what the child hears.
import { atQuestionOf, endsOnShortAsk, endsOnYourTurn } from "../../server/director/question-run.js";

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const qKey = (t) => low(t).replace(/\{\w+\}/g, " ").replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);
const formsOf = (x) => (Array.isArray(x) ? x.flatMap(formsOf) : x && typeof x === "object" ? [x.hi, x.en] : [x]).filter((y) => typeof y === "string" && y.trim());
/** The authored fields of a question that ask it: its prompt, reask, Hindi form, simpler and help wording. */
export const ASK_FIELDS = Object.freeze(["prompt", "reask", "hindi", "simpler", "hint", "hints"]);
const at = (script, path) => { try { return String(path).split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => o?.[/^\d+$/.test(k) ? Number(k) : k], script); } catch { return null; } };

/** Every authored form of the question whose prompt is `prompt` (its script object's ASK_FIELDS, hi and en): string[] (the prompt alone where
 *  the script writes no object for it). */
export function questionForms(script, prompt) {
  const path = script && prompt ? atQuestionOf(script, prompt) : null;
  const o = path && path !== "?short" ? at(script, path) : null;
  // (an asked worked step's help wording is written on the step beside its ask: steps[n].simpler)
  const up = path && /\.ask$/.test(path) ? at(script, path.replace(/\.ask$/, "")) : null;
  const own = [o, up].filter((x) => x && typeof x === "object").flatMap((x) => ASK_FIELDS.flatMap((f) => formsOf(x[f])));
  return [...new Set([prompt, ...own].filter((x) => typeof x === "string" && x.trim()))];
}
/** Whether her line asks the question whose prompt is `prompt`: it says one of the question's authored forms (whole, or ending on its last
 *  sentence), ends on the script's form of that question (question-run.js atQuestionOf), or ends on a short ask or an invitation — which ask
 *  again for the question on the table. */
export function askedIn(script, line, prompt) {
  const t = qKey(line);
  if (!t || !prompt) return false;
  const lastT = qKey(sentencesOf(line).at(-1) ?? "");
  for (const f of questionForms(script, prompt)) {
    const k = qKey(f);
    if (k && t.includes(k.slice(0, 40))) return true;
    const lf = qKey(sentencesOf(f).at(-1) ?? "");
    if (lf && lf.split(" ").length >= 3 && lastT === lf) return true;
  }
  if (script) {
    const p = atQuestionOf(script, prompt), q = atQuestionOf(script, line);
    if (p && p !== "?short" && q === p) return true;
    if (endsOnShortAsk(script, line) || endsOnYourTurn(script, line)) return true;
  }
  return false;
}
