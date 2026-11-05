// Round 7 F (App's app-world-hangar-depth, PIPELINE §14 B2-4, K-P5): when a chapter FIRST sealed and a skill FIRST became
// secure, as /api/child/map saw it (046 child_map_mark). Set once, never cleared on a dip, so a chapter that decays and
// re-seals is one moment. Marks true on the child's first map read after 046 are `backfilled`: their time is unknown and
// the map sends null for them (never a made-up "today"). One ('seen', '') row records that first read.
import { q as dbq } from "../db.js";

/** PURE. What the built map says is true now: sealed chapters and secure skills. */
export function marksOf(map) {
  const out = [];
  for (const s of map.subjects ?? []) for (const ch of s.chapters ?? []) if (ch.sealed) out.push({ kind: "chapter_sealed", ref: ch.id });
  for (const sk of map.skills ?? []) if (sk.state === "secure") out.push({ kind: "skill_secure", ref: sk.skillId });
  return out;
}

/** PURE. The map with `sealedAt` on chapters and `secureSince` on skills (ISO string, or null: not yet, or time unknown). */
export function applyMarks(map, rows) {
  const at = new Map(rows.filter((r) => !r.backfilled).map((r) => [`${r.kind}:${r.ref_id}`, new Date(r.first_at).toISOString()]));
  const subjects = (map.subjects ?? []).map((s) => ({ ...s, chapters: s.chapters.map((ch) => {
    const sealedAt = ch.sealed ? at.get(`chapter_sealed:${ch.id}`) ?? null : null;
    return { ...ch, sealedAt, topics: ch.topics.map((t) => ({ ...t, skills: t.skills.map((sk) => ({ ...sk, secureSince: sk.state === "secure" ? at.get(`skill_secure:${sk.skillId}`) ?? null : null })) })) };
  }) }));
  const skills = (map.skills ?? []).map((sk) => ({ ...sk, secureSince: sk.state === "secure" ? at.get(`skill_secure:${sk.skillId}`) ?? null : null }));
  return { ...map, subjects, skills };
}

/**
 * Record the marks that are true now (first time only) and return the map with their times. A mark stays once set: a
 * chapter that dips and re-seals keeps its first time (the `sealed` flag itself still follows the ledger). Defensive: no
 * table or a write error → the map with null times.
 */
export async function syncMarks(childId, map, { q = dbq } = {}) {
  try {
    const now = marksOf(map);
    const rows0 = await q("select kind, ref_id, first_at, backfilled from child_map_mark where child_id = $1", [childId]);
    const firstRead = !rows0.some((r) => r.kind === "seen");
    const have = new Set(rows0.map((r) => `${r.kind}:${r.ref_id}`));
    const fresh = now.filter((m) => !have.has(`${m.kind}:${m.ref}`));
    const ins = [...fresh.map((m) => [m.kind, m.ref, firstRead]), ...(firstRead ? [["seen", "", true]] : [])];
    if (!ins.length) return applyMarks(map, rows0);
    const rows = await q(`insert into child_map_mark (child_id, kind, ref_id, backfilled)
        select $1, k, r, b from unnest($2::text[], $3::text[], $4::boolean[]) as x(k, r, b)
        on conflict (child_id, kind, ref_id) do nothing returning kind, ref_id, first_at, backfilled`,
      [childId, ins.map((x) => x[0]), ins.map((x) => x[1]), ins.map((x) => x[2])]);
    return applyMarks(map, [...rows0, ...rows]);
  } catch { return applyMarks(map, []); }
}
