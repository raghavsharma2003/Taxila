// The KT placement prior (round 7 F; main 2026-11-04, option (a)): a finished placement round is ONE kt_evidence row per
// strand (via 'placement', 039), so a replay of kt_evidence reproduces the prior exactly and no per-child fold ctx exists.
//
// What the row is, and is not:
//   - It only SEEDS θ: the ledger (kt/ledger.js) records the site and folds it into the subject's epoch base the next
//     time that epoch is created or opened (ability.js placementSites). It never creates a skill state, never touches the
//     facets (comprehension/fuse.js), never moves pL, and never counts as practised, mastered or a graded answer.
//   - Every kt_evidence reader that counts or claims skips it by ONE predicate: isPlacementRow (JS rows and events) or
//     NOT_PLACEMENT (its SQL form). tests/r7-learning-placement-prior.test.mjs fails if a reader of kt_evidence neither
//     uses it nor is listed there with the reason it needs none.
//   - Its weight is bounded: the site is a likelihood N(mu, sd²) with sd floored at PLACEMENT_SITE_SD_MIN (1.0 GE), i.e.
//     precision ≤ 1, about one class prior's worth (a class-5 prior is sd ≈ 1.3). Measured in the real fold (class 5,
//     placement mu 2.0, then class-level item.open answers): after 2 correct answers θ is 1.3 GE past the site, after 4
//     1.8 GE past it; wrong answers agree with it. context/inbox/r7-learning-5.json (dc-r7-placement-prior) has the table
//     and the reversal condition.
export const PLACEMENT_VIA = "placement";
export const PLACEMENT_SITE_SD_MIN = 1.0;

/** THE predicate: a kt_evidence row (db shape) or an EvidenceEvent that is a placement site, not evidence of learning. */
export const isPlacementRow = (r) => r?.via === PLACEMENT_VIA;
/** Its SQL form, for a statement over kt_evidence (unaliased or with the alias given). */
export const notPlacement = (alias = "") => `${alias ? `${alias}.` : ""}via is distinct from '${PLACEMENT_VIA}'`;
export const NOT_PLACEMENT = notPlacement();

const fmt = (x) => String(Math.round(Number(x) * 100) / 100);

/**
 * PURE. The kt_evidence events for a finished placement round: one per strand in result.placement (cat.js result), each
 * carrying its site in item_key ("site|<strand>|<mu>|<sd>") so the row alone replays it. [] when there is no site.
 * @param {{ placementId: string, completedAt: string|Date, result: { placement?: Record<string, { mu: number, sd: number }> } }} a
 */
export function placementEvents({ placementId, completedAt, result }) {
  const at = new Date(completedAt).toISOString();
  const sid = `placement:${placementId}`;
  return Object.entries(result?.placement ?? {})
    .filter(([s, p]) => /^[a-z]+:[a-z0-9_]+$/.test(s) && Number.isFinite(Number(p?.mu)) && Number.isFinite(Number(p?.sd)) && Number(p.sd) > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([strand, p]) => ({
      id: `${sid}:${strand}`, sessionId: sid, episodeId: sid, sessionStartAt: at, at,
      skillIds: [strand], cls: "placement", outcome: 0, grader: "code", graderVersion: "cat-1",
      itemKey: `site|${strand}|${fmt(p.mu)}|${fmt(p.sd)}`, via: PLACEMENT_VIA,
    }));
}

/** PURE. A placement event's site, sd floored (the bounded weight), or null for anything malformed. */
export function siteOf(ev) {
  const m = /^site\|([a-z]+):([a-z0-9_]+)\|(-?\d+(?:\.\d+)?)\|(\d+(?:\.\d+)?)$/.exec(String(ev?.itemKey ?? ""));
  if (!m) return null;
  return { subject: m[1], strand: `${m[1]}:${m[2]}`, mu: Number(m[3]), sd: Math.max(PLACEMENT_SITE_SD_MIN, Number(m[4])) };
}
