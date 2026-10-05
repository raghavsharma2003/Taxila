// "Made for you" / "Made for {child}" (STUDENT-FLOW §9.3, §12.1; BUILD-PLAN W2-A #9): the pieces Studio revealed to
// THIS child, read from W2-H's studio_mount feed (017_studio.sql: studio_mount(lesson_id, intent_id, build_sha, kind,
// topic_id, misconception_id, facts, revealed_at, outcome jsonb, hidden); the child is lesson.child_id) + studio_build(build_sha, plan jsonb, record jsonb)). Read-only and defensive:
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
  const topicId = str(plan.topicId) ?? str(r.topic_id);
  const topicTitle = topicId ? getTopic(topicId)?.title ?? null : null;
  // a skeleton piece has no build row: its image alt, else the topic it was made in, names it (never model prose)
  const art = r.facts?.artifact ?? null;
  const title = str(rec.title) ?? str(plan.title) ?? str(art?.alt) ?? topicTitle;
  if (!kind || !title || !r.revealed_at) return null;
  // 017: outcome is jsonb ({answers, complete, last, result?}); only an explicit result is a claim about the child
  const o = r.outcome;
  const outcome = typeof o === "string" ? str(o) : o && typeof o === "object" ? str(o.result) : null;
  return {
    id: String(r.intent_id ?? r.build_sha), kind, title: title.slice(0, 60), topicTitle,
    at: new Date(r.revealed_at).toISOString(), still: str(rec.still) ?? str(rec.stillUrl),
    because: belief ? `You thought ${belief.replace(/[.]+$/, "")}` : null,
    result: outcome === "unaided" || outcome === "on_own" ? "on_own" : outcome === "hinted" || outcome === "with_hint" ? "with_hint" : null,
  };
}

/**
 * The child's revealed pieces, newest first. `since`: only pieces revealed at/after this instant (today's shelf).
 * 017's studio_mount has no child_id (016's rule: erasure cascades from `lesson`), so the child is lesson.child_id.
 * Whiteboard explanations and pieces the child hid ("Not this one") are not shelf pieces.
 * @returns {Promise<import("../../shared/contracts").MadeForItem[]>}
 */
export async function madeForOf(childId, { since = null, limit = 6, q = dbq } = {}) {
  let rows;
  try {
    rows = await q(`select m.intent_id, m.build_sha, m.revealed_at, m.outcome, m.lesson_id, m.kind, m.topic_id, m.misconception_id, m.facts,
             b.plan, b.record
        from studio_mount m join lesson l on l.id = m.lesson_id left join studio_build b on b.build_sha = m.build_sha
       where l.child_id = $1 and m.revealed_at is not null and not m.hidden and m.source <> 'whiteboard'
         and ($2::timestamptz is null or m.revealed_at >= $2)
       order by m.revealed_at desc limit $3`, [childId, since, limit]);
  } catch (e) {
    if (MISSING.has(e?.code)) return [];
    console.warn(`[made-for] feed unavailable: ${e?.code ?? ""} ${e?.message ?? e}`);
    return [];
  }
  const out = [];
  for (const r of rows) {
    const mid = str(r.misconception_id) ?? str(r.plan?.misconceptionId);
    let belief = null;
    if (mid) { try { belief = (await misconceptionById(mid))?.belief ?? null; } catch { belief = null; } }
    const it = madeForItem(r, belief);
    if (it) out.push(it);
  }
  return out;
}
