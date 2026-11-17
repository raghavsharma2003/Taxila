// dc-r8-director28, Brain 044 (docs/patches/to-brain/044-fewer-kinds-of-turn.md): fewer kinds of turn, help as a hard precondition, a
// joint keeps what is up. The predicates are written from the order's sentences, not from director28's shapes
// (fd-predicate-must-fail-on-judges-rows); tests/r8-director28-044.test.mjs pins each non-zero on the director28 rows the order lists.
// Merged into dry-predicates.mjs's PREDICATES. Pure.
//
//   pageStart      T4: every page in a turn starts at the first character of the part that owns it. A joint, a lead-in, an opener, a
//                  bridge and a hook own no page — they are said over what is up (nothing, if nothing is up); a part of the record that
//                  is one of them and lists a board drawn in the turn claims a page it does not own
import { pagesOf, isLeadText } from "./d27-predicates.mjs";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}` : JSON.stringify(v ?? null));
const keyOf = (b) => (b && typeof b === "object" && b.template ? canon({ template: b.template, params: b.params ?? {} }) : null);
const sameB = (a, b) => !!keyOf(a) && keyOf(a) === keyOf(b);
const brief = (b) => (b ? `${String(b.template).replace(/@\d+$/, "")}` : "nothing");

/** A turn's parts with their texts, each marked `lead` when it owns no page: a bridge, an aside (her reply, an opener, the switch line),
 *  or words that are all joint, lead-in, hook or bridge sentences (the record has called a lead-in `body`: c6 steady 112). */
export function leadPartsOf(r, script) {
  const t = String(r.text ?? "");
  const pp = r.pageParts ?? [];
  return pp.map((p, n) => {
    const end = pp[n + 1]?.from ?? t.length;
    const text = t.slice(p.from ?? 0, end).trim();
    return { part: p.part, beat: String(p.beat ?? ""), from: p.from ?? 0, end, text, boards: p.boards ?? [], lead: p.part === "bridge" || p.part === "aside" || isLeadText(text, r, script) };
  });
}

export const D29_PREDICATES = {
  /** T4: every page in a turn starts at the first character of the part that owns it. The board carried up from the turn before is no
   *  page of this turn; a page drawn at a lead (a joint, a lead-in, an opener, a bridge, a hook) or at words the record has no part for,
   *  before its owner's first word, is early; a lead that lists a board this turn draws claims a page it does not own. */
  pageStart(L, r, i, ctx) {
    const st = (ctx.o.d29 ??= { at: -1, up: null });
    if (st.at >= i) { st.at = -1; st.up = null; }
    if (r.who !== "teacher") return null;
    const up = st.up;
    const { pages, end } = pagesOf(r, up);
    st.up = end; st.at = i;
    const parts = leadPartsOf(r, ctx.script);
    if (!parts.length) return null;
    for (let k = 0; k < pages.length; k++) {
      const pg = pages[k];
      if (!pg.board || (pg.from === 0 && sameB(pg.board, up))) continue;
      const after = k ? pages[k - 1].from : 0;
      // (the record's bridge part listing the next unit's board — a bridge owns none: Brain 044 T8)
      const claim = parts.find((p) => p.part === "bridge" && p.from >= after && p.boards.some((b) => sameB(b, pg.board)));
      const owner = parts.find((p) => !p.lead && p.from >= after && p.boards.some((b) => sameB(b, pg.board)));
      if (!owner) continue;
      if (claim && claim.from < owner.from) return `the ${claim.part} at ${claim.from} ("${claim.text.slice(0, 30)}") claims the ${brief(pg.board)} page its ${owner.part}@${owner.beat} owns`;
      if (owner.from !== pg.from) return `the ${brief(pg.board)} page drawn at ${pg.from}, not at its ${owner.part}@${owner.beat}'s first word (${owner.from})`;
    }
    return null;
  },
};
