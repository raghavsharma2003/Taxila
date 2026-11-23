// to-brain 049 B6 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md, carried from 047): the predicates B6 adds, each pinned
// on its director32 rows (tests/r8-director32-049-b6.test.mjs, replayed with that run's own script snapshot) before it reads the dry matrix.
//   dekhoOver   "Dekho," more than three times in a lesson, or twice within four of her turns
const DEKHO = /(?<![\p{L}])Dekho,/gu;
/** "Dekho," said in a row's text. */
const dekhoIn = (r) => (String(r?.text ?? "").match(DEKHO) ?? []).length;

export const D33_PREDICATES = {
  /** B6: "Dekho," at most three times a lesson, and never within four of her turns (director32: 8 to 10 in every steady lesson). Gated. */
  dekhoOver(L, r, i) {
    if (r.who !== "teacher" || !dekhoIn(r)) return null;
    const hers = (L.rows ?? []).slice(0, i).filter((x) => x.who === "teacher");
    const before = hers.reduce((a, x) => a + dekhoIn(x), 0);
    if (before + dekhoIn(r) > 3) return `"Dekho," the ${before + dekhoIn(r)}th time in the lesson`;
    if (dekhoIn(r) > 1) return `"Dekho," twice in one turn`;
    const k = hers.slice(-4).reverse().findIndex((x) => dekhoIn(x));
    return k >= 0 ? `"Dekho," again ${k + 1} of her turns after the last` : null;
  },
};
