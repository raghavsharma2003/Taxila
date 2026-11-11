// Pure layout and wording helpers of the ext engines: no canvas, no host, no class syntax, so node tests import them
// directly (tests/studio-v2.test.mjs). The engines (sieve.ts, picto.ts) draw with what these return.
import { fits, sieveStream, type SvRoundT } from "../../../../shared/studio-spec-ext/sieve.ts";
import { GEO_COLS } from "../../../../shared/studio-spec-ext/geo.ts";

/** geo-forge's pin-board origin and pitch (world units) and its rightmost pin column's centre. */
export const GEO_OX = 190, GEO_S = 50, GEO_GRID_X1 = GEO_OX + (GEO_COLS - 1) * GEO_S;
export type Btn = { x: number; y: number; w: number; h: number };
/** geo-forge's UNDO / CHECK stack right of the pin-board, each button as tall as its label's lines (judges, regeneration
 *  round 2, 2026-11-11: the two-line "Check karo" overflowed a 70-tall button's top and bottom border at l1366, and the
 *  buttons' edge at 812 sat on the rightmost pin column at 800). `nUndo`/`nCheck` are the labels' line counts and `lh`
 *  their line height, both at the drawn size. Wide enough for CHECK at the young floor; 22 clear of the last column. */
export function geoButtons(nUndo: number, nCheck: number, lh: number): { UNDO: Btn; CHECK: Btn } {
  const x = GEO_GRID_X1 + 22, w = 178, pad = 22;
  const UNDO = { x, y: 300, w, h: Math.max(62, Math.ceil(nUndo * lh + pad)) };
  const CHECK = { x, y: UNDO.y + UNDO.h + 18, w, h: Math.max(70, Math.ceil(nCheck * lh + pad)) };
  return { UNDO, CHECK };
}

/** a rule phrase + its number(s) in the phrase's own word order (judges, 2026-11-11: "ke guna 6" is broken Hindi). A Hindi
 *  postposition phrase ("ke guna", "ke factors", "se vibhajya", Devanagari के/का/की/से/को) takes the number first: "6 ke guna";
 *  an English phrase ending in of/by/with/to keeps it after: "multiples of 6"; otherwise the spec's lang decides. */
export function placeNumber(phrase: string, nums: string, lang?: string): string {
  const p = phrase.trim();
  if (!p) return nums;
  const hindiLead = /^(ke|ka|ki|se|ko|me|mein|par)\b/i.test(p) || /^(के|का|की|से|को|में|पर)(\s|$)/.test(p);
  const englishTail = /\b(of|by|with|to)$/i.test(p);
  const numFirst = hindiLead || (!englishTail && (lang === "hi" || lang === "hinglish"));
  return numFirst ? `${nums} ${p}` : `${p} ${nums}`;
}
export function sieveRuleLabel(T: Record<string, string>, r: Pick<SvRoundT, "rule" | "a" | "b">, lang?: string): string {
  const one = (k: string) => placeNumber(T[k] ?? k, String(r.a), lang), two = (k: string) => placeNumber(T[k] ?? k, `${r.a} ${T.and ?? "and"} ${r.b}`, lang);
  switch (r.rule) {
    case "multiple": return one("multipleOf");
    case "common": return two("commonOf");
    case "factor": return one("factorOf");
    case "cfactor": return two("cfactorOf");
    case "divisible": return one("divisibleBy");
    case "coprime": return one("coprimeWith");
    default: return r.a != null && (r.rule === "prime" || r.rule === "composite") ? placeNumber(T[r.rule] ?? r.rule, String(r.a), lang) : T[r.rule] ?? r.rule;
  }
}
/** the round's "right picks" total: how many of its numbers fit the rule (judges: "SAHI CHUNAV 0/12" in a factors-of-12
 *  round with 12 cards, but only 6 of them are factors) */
export function sieveHitTotal(r: SvRoundT, stream = sieveStream(r)): number { return stream.filter((n) => fits(r, n)).length; }
const gcd2 = (a: number, b: number): number => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a; };
/** the value axis of a bar chart: a gridline at every value a bar can take (`step` divides every count and the axis start,
 *  at least 1), labels on a "nice" multiple of it so they sit a young label apart (judges, 2026-11-11: ticks 0, 4, 8, 12, 16
 *  under bars of 13, 7 and 10, so the claims could not be read exactly off the chart). */
export function valueAxis(values: number[], axisStart: number, max: number, pxPerUnit: number, minLabelPx = 46): { step: number; labelStep: number } {
  const step = Math.max(1, [axisStart, ...values].reduce((g, v) => gcd2(g, v), 0));
  let labelStep = step;
  for (const m of [1, 2, 4, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000]) { labelStep = step * m; if (labelStep * pxPerUnit >= minLabelPx) break; }
  if (labelStep > max - axisStart && max > axisStart) labelStep = Math.max(step, max - axisStart);
  return { step, labelStep };
}
