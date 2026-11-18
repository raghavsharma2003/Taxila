// dc-r8-director31 (docs/patches/to-brain/047): the predicates Brain 047 adds, each written from the order's law and pinned non-zero on its
// director31 rows (tests/r8-director31-047.test.mjs, replayed with the run's own script snapshot) before it is trusted to read 0 on the dry
// matrix.
//   falseReturn   R1: a back-to joint before a card whose walk item was never said before

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();

/** R1: whether an earlier teacher row said this row's card — the same walk item, its card's words in that row's text. */
function cardSaidEarlier(L, r, i) {
  const id = String(r?.check?.itemId ?? "");
  if (!id) return null;
  const head = low(r.card).slice(0, 30);
  return (L.rows ?? []).slice(0, i).some((x) => x.who === "teacher" && String(x.check?.itemId ?? "") === id && (!head || low(x.text).includes(head) || low(x.text).includes(low(x.card).slice(0, 30))));
}

export const D31_PREDICATES = {
  /** Brain 047 R1: "back to the earlier question" is said by the card's identity — never before a card whose walk item no turn before said
   *  (director31 c4-ch01-t02 steady 34, 72, 102; stuck 48; offtopic 30; steering 32). Gated. */
  falseReturn(L, r, i) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => ["backTo", "afterKeyReturn"].includes(x.joint))) return null;
    const said = cardSaidEarlier(L, r, i);
    return said === false ? `a back-to joint before a card never asked (${String(r.check?.itemId ?? "").split(":").slice(-2).join(":")})` : null;
  },
};
