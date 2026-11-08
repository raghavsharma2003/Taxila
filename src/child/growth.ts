// "Then and now" (r7 app-notebook-log growth page, main 2026-11-08): what became pakka, next to where it started. PURE.
// Built only from what the child app already reads, with no new server work:
//   now   the map's secureSince (migration 046: when the map first saw the skill secure)
//   then  the first Notebook lesson on that skill's topic, before it became pakka (its boards replay); "with a hint" when
//         that lesson's own summary card says so (never "wrong": a first meeting is not a mistake)
//   help  the made-for pieces on that topic built before it became pakka
// Never a count, a score or a streak: one entry per skill, newest pakka first.

export interface GrowthSkill { skillId: string; title: string; label?: string; topicId: string; state: string; secureSince?: string | null }
export interface GrowthPage { lessonId: string; topicId?: string | null; at: number; topic: string; boards?: number; hint?: boolean }
export interface GrowthMade { id: string; title: string; topicId: string | null; at: string }
export interface GrowthEntry { skillId: string; title: string; nowAt: number; then: GrowthPage | null; helped: GrowthMade[] }

export const GROWTH_MAX = 12;

export function growthEntries(skills: GrowthSkill[], pages: GrowthPage[], made: GrowthMade[], max = GROWTH_MAX): GrowthEntry[] {
  const out: GrowthEntry[] = [];
  const seen = new Set<string>();
  for (const s of skills) {
    if (s.state !== "secure" || seen.has(s.skillId)) continue;
    const nowAt = Date.parse(String(s.secureSince ?? ""));
    if (!Number.isFinite(nowAt)) continue; // secure before 046: when is unknown, so no "then and now"
    seen.add(s.skillId);
    const then = pages.filter((p) => p.topicId && p.topicId === s.topicId && p.at > 0 && p.at <= nowAt).sort((a, b) => a.at - b.at)[0] ?? null;
    const helped = made.filter((m) => m.topicId && m.topicId === s.topicId && Date.parse(m.at) <= nowAt).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(0, 2);
    out.push({ skillId: s.skillId, title: s.label || s.title, nowAt, then, helped });
  }
  return out.sort((a, b) => b.nowAt - a.nowAt).slice(0, max);
}

/** PURE. "3 Nov": a day the child recognises (no year, no time). */
export const dayOf = (ms: number): string => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
