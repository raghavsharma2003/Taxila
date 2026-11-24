// to-brain 052, the engine builder's parts (docs/patches/to-brain/052-d34-merged-tree-one-count-ladder-after-own-reason.md): the predicates
// it adds or re-reads, registered in dry-predicates.mjs after d34a and d34b (tests/r8-d34-052e.test.mjs).
//   helpLadder  A1 re-reads help-predicates.mjs's H4 predicate (that file is left as it is): after the card's named wrong answer the own
//               reason is the first rung of a miss's help, before the card's own simpler — "simpler unsaid, whyAlt said instead" is that
//               rung said in its place, and the simpler said with the own reason unsaid is the fault. Every other reading is H4's.
import { HELP_PREDICATES, helpTurnOf, ownReasonDue } from "./help-predicates.mjs";
import { helpPart, at, sentencesOf, normSentence, sameSentence } from "../../server/director/help.js";

const H4 = HELP_PREDICATES.helpLadder;
/** The sentences of a script value (string, or { hi, en }), normalised. */
const sentsOf = (v) => (typeof v === "string" ? [v] : [v?.hi, v?.en]).filter(Boolean).flatMap(sentencesOf).map(normSentence).filter(Boolean);
/** Every normalised sentence of her turns before row i. */
const saidBefore = (L, i) => L.rows.slice(0, i).filter((x) => x.who === "teacher").flatMap((x) => sentencesOf(x.text).map(normSentence));

export const D34C_PREDICATES = {
  /** A1 (gated, as H4 was). */
  helpLadder(L, r, i, ctx) {
    const f = H4(L, r, i, ctx);
    const h = helpTurnOf(L, r, i, ctx);
    if (!h || h.request !== "hint" || h.keyed || h.closed) return f;
    const part = helpPart(ctx.script, h.part);
    if (!part || at(ctx.script, `${part.path}.whyAltAsHelp`) !== true || !ownReasonDue(L, i, ctx, h.part)) return f;
    const wa = sentsOf(at(ctx.script, `${part.path}.whyAlt`)), simp = sentsOf(at(ctx.script, `${part.path}.simpler`));
    if (!wa.length) return f;
    const said = saidBefore(L, i);
    const T = sentencesOf(r.text).map(normSentence);
    const has = (ks, set) => ks.some((k) => set.some((x) => sameSentence(k, x)));
    // (spent when every sentence of one of its forms was said — the Hinglish, or the English)
    const v = at(ctx.script, `${part.path}.whyAlt`);
    const waSaid = (typeof v === "string" ? [v] : [v?.hi, v?.en]).filter(Boolean).some((t) => { const ks = sentsOf(t); return ks.length && ks.every((k) => said.some((x) => sameSentence(k, x))); });
    if (!waSaid && !has(wa, T) && has(simp, T)) return `whyAlt unsaid on ${h.part}, simpler said instead (the own reason first after the named answer)`;
    if (f && /^(?:ask\.)?simpler unsaid on .*, whyAlt said instead$/.test(f) && !waSaid && has(wa, T)) return null;
    return f;
  },
};
