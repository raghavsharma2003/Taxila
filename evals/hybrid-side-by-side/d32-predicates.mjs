// dc-r8-director32 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md): the predicates Brain 049 adds, each written from the
// order's law and pinned non-zero on its director32 rows (tests/r8-director32-049.test.mjs, replayed with that run's own script snapshot)
// before it is trusted to read 0 on the dry matrix.
//   pictureKey          B2: a picture request answered by a key
//   pictureGoneBeforeAsk B2: a page change between a picture's first word and the turn's question
//   pictureNoLine       B2 (pictureSame's "none" path): a picture request with nothing drawn, at a script with joints.noPicture, and none
//                       of its forms said

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const qKey = (t) => low(t).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);

/** Whether a row is the turn answering a picture request (the walk's column, or a picture held). */
const pictureAsked = (r) => r?.who === "teacher" && (r.cell?.column === "picture" || !!r.held?.picture);
/** Whether a row says a key: a key seam, or a close part on its page. */
const saysKey = (r) => (r?.seams ?? []).some((x) => x.right === "key") || (r?.pageParts ?? []).some((p) => p.part === "close");
/** The char where a row's closing question starts (its last sentence ending "?"), or -1. */
function questionAt(r) {
  const t = String(r?.text ?? "").replace(/\s+/g, " ").trim();
  const q = sentencesOf(t).at(-1) ?? "";
  return /[?？]\s*$/.test(q) ? t.lastIndexOf(q) : -1;
}

export const D32_PREDICATES = {
  /** Brain 049 B2: a picture request is never answered by a key — with nothing left to draw it gets the noPicture line, the card's unsaid hint
   *  if one is left, and the card's question (director32 steering 16 in c5-t01, c5-t02, c6: "Is sawaal ka jawab 1/11 hai…"). Gated. */
  pictureKey(L, r) {
    return pictureAsked(r) && saysKey(r) ? `a picture request answered by a key (cell.picture ${r.cell?.picture ?? "?"})` : null;
  },
  /** Brain 049 B2: a picture drawn at a request stays up until the question it was asked at has been said — no page after the picture's first
   *  page and before the turn's end (director32 c6-ch07 steady 18: the scale replaced by the compare board at char 94; stuck 18 at 85). Gated. */
  pictureGoneBeforeAsk(L, r) {
    if (!pictureAsked(r) || !["pictureBoard", "view"].includes(String(r.cell?.picture ?? ""))) return null;
    const pages = r.held?.pages ?? [];
    if (pages.length < 2 || r.held?.layout?.split || pages.some((g) => g.beside)) return null;
    const q = questionAt(r);
    if (q < 0) return null;
    const first = pages[0];
    const gone = pages.slice(1).find((g) => (g.from ?? 0) <= q + 1 && g.template !== first.template);
    return gone ? `the picture (${first.template}) gave way to ${gone.template} at char ${gone.from}, before the question at ${q}` : null;
  },
  /** Brain 049 B2 (pictureSame's "none" path): a picture request with nothing drawn says the script's noPicture line — read only where the
   *  script has `joints.noPicture` (until it does, the line is not said). Gated. */
  pictureNoLine(L, r, i, ctx) {
    if (!pictureAsked(r) || !["hint", "none"].includes(String(r.cell?.picture ?? ""))) return null;
    const forms = (ctx?.script?.joints?.noPicture ?? []).flatMap((f) => [f?.hi ?? (typeof f === "string" ? f : null), f?.en]).filter(Boolean).map(qKey);
    if (!forms.length) return null;
    const t = qKey(r.text);
    return forms.some((f) => f && t.includes(f)) ? null : `nothing drawn (${r.cell.picture}) and no noPicture line said`;
  },
};
