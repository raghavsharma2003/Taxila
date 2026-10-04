// "Made for you" / "Made for {child}" (STUDENT-FLOW §9.3, §12.1; BUILD-PLAN W2-A #9): the pieces Studio revealed to
// THIS child, read from W2-H's studio_mount feed (LIVE-STUDIO §10: studio_mount(lesson_id, intent_id, build_sha,
// child_id, revealed_at, outcome) + studio_build(build_sha, plan jsonb, record jsonb)). Read-only and defensive:
// until migration 017 is applied (or while the feed has no rows) it returns [] and every surface hides the shelf
// (V2 P6: no empty shelf). "because" comes from the build's misconception id through the kit (the belief text), never
// model prose (§12.1 claims). Never a count, never a "collection".
import { q as dbq } from "../db.js";
import { misconceptionById } from "../content/index.js";
import { getTopic } from "../content/curriculum.js";

const MISSING = new Set(["42P01", "42703"]); // table / column not there yet (017 not applied)
const str = (x) => (typeof x === "string" && x.trim() ? x.trim() : null);

/** PURE. One mount row (+ its build's plan/record) → MadeForItem, or null when it cannot be shown honestly. */
export function madeForItem(r, belief = null) {
  const plan = r.plan ?? {}, rec = r.record ?? {};
  const kind = str(plan.kind) ?? str(rec.kind) ?? str(r.kind);
  const title = str(rec.title) ?? str(plan.title);
  if (!kind || !title || !r.revealed_at) return null;
  const topicId = str(plan.topicId) ?? str(r.topic_id);
  const outcome = str(r.outcome);
  return {
    id: String(r.intent_id ?? r.build_sha), kind, title: title.slice(0, 60), topicTitle: topicId ? getTopic(topicId)?.title ?? null : null,
    at: new Date(r.revealed_at).toISOString(), still: str(rec.still) ?? str(rec.stillUrl),
    because: belief ? `You thought ${belief.replace(/[.]+$/, "")}` : null,
    result: outcome === "unaided" || outcome === "on_own" ? "on_own" : outcome === "hinted" || outcome === "with_hint" ? "with_hint" : null,
  };
}

/**
 * The child's revealed pieces, newest first. `since`: only pieces revealed at/after this instant (today's shelf).
 * @returns {Promise<import("../../shared/contracts").MadeForItem[]>}
 */
export async function madeForOf(childId, { since = null, limit = 6, q = dbq } = {}) {
  let rows;
  try {
    rows = await q(`select m.intent_id, m.build_sha, m.revealed_at, m.outcome, m.lesson_id, b.plan, b.record, l.topic_id
        from studio_mount m left join studio_build b on b.build_sha = m.build_sha left join lesson l on l.id = m.lesson_id
       where m.child_id = $1 and m.revealed_at is not null and ($2::timestamptz is null or m.revealed_at >= $2)
       order by m.revealed_at desc limit $3`, [childId, since, limit]);
  } catch (e) {
    if (MISSING.has(e?.code)) return [];
    console.warn(`[made-for] feed unavailable: ${e?.code ?? ""} ${e?.message ?? e}`);
    return [];
  }
  const out = [];
  for (const r of rows) {
    const mid = str(r.plan?.misconceptionId);
    let belief = null;
    if (mid) { try { belief = (await misconceptionById(mid))?.belief ?? null; } catch { belief = null; } }
    const it = madeForItem(r, belief);
    if (it) out.push(it);
  }
  return out;
}
