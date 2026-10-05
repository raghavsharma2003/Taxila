// The admissibility table Stagecraft plans over (STAGECRAFT.md §2.2 "Admissibility runs before anything is scored").
// Pure data + pure functions: the conductor never imports a .ts file, so the host builds the catalog once from
// shared/studio-spec.ts ENGINE_SPECS (RS-4 engines: topics, misconceptions, classes) and the Wave 2 live archetypes
// (server/studio/routes.json `live`), and passes it in SchedulerConfig.catalog.
//
// An RS-4 archetype is admissible for a family when the family's topic is in `outcomes.topics` and, for a contrast, the
// misconception is in `outcomes.misconceptions`. A Wave 2 archetype is admissible for the live rung only when the
// caller lists it for the topic (seam.js aboutTopic + chooseArchetype decide that in production). A family with no
// admissible archetype gets the board rung only, and the board is a real artifact.

const ENGINE_KIND = { game: "game", simulation: "simulation", explainer: "animation" };

/**
 * @param {Record<string, { kind: string, subject: string, outcomes: { classes: number[], topics: string[], misconceptions: string[] } }>} engineSpecs
 * @param {{ w2Topics?: Record<string, string[]>, w2Kinds?: Record<string, string>, w2Live?: Record<string, boolean>, library?: string[] }} [o]
 */
export function buildCatalog(engineSpecs, o = {}) {
  const rs4 = {};
  for (const [id, d] of Object.entries(engineSpecs ?? {})) {
    rs4[id] = { kind: ENGINE_KIND[d.kind] ?? d.kind, subject: d.subject, classes: [...(d.outcomes?.classes ?? [])],
      topics: [...(d.outcomes?.topics ?? [])], misconceptions: [...(d.outcomes?.misconceptions ?? [])] };
  }
  return { rs4, w2Topics: { ...(o.w2Topics ?? {}) }, w2Kinds: { ...(o.w2Kinds ?? {}) }, w2Live: { ...(o.w2Live ?? {}) }, library: [...(o.library ?? [])] };
}

/**
 * Ranked admissible RS-4 archetypes for a target. Deterministic: kind order first (the need's preference), then a
 * misconception match, then the id. `requireMisconception` keeps only archetypes that carry that misconception (a
 * contrast the engine can prove).
 * @returns {{ archetype: string, kind: string }[]}
 */
export function admissible(catalog, { topicId, misconceptionId = null, kinds = [], exclude = [], requireMisconception = false }) {
  const out = [];
  for (const [id, a] of Object.entries(catalog?.rs4 ?? {})) {
    if (exclude.includes(id)) continue;
    if (!a.topics.includes(topicId)) continue;
    const misMatch = !!misconceptionId && a.misconceptions.includes(misconceptionId);
    if (requireMisconception && !misMatch) continue;
    const k = kinds.indexOf(a.kind);
    out.push({ archetype: id, kind: a.kind, rank: (k < 0 ? 50 : k * 2) - (misMatch ? 1 : 0) });
  }
  return out.sort((x, y) => x.rank - y.rank || (x.archetype < y.archetype ? -1 : 1)).map(({ archetype, kind }) => ({ archetype, kind }));
}

/** The Wave 2 archetypes the live rung may race for this topic (live-buildable only). */
export function liveArchetypes(catalog, topicId, kinds = []) {
  const ids = (catalog?.w2Topics?.[topicId] ?? []).filter((id) => catalog.w2Live?.[id] !== false);
  return ids.map((id) => ({ archetype: id, kind: catalog.w2Kinds?.[id] ?? "game" }))
    .sort((a, b) => ((kinds.indexOf(a.kind) + 99) % 100) - ((kinds.indexOf(b.kind) + 99) % 100) || (a.archetype < b.archetype ? -1 : 1));
}

export const hasLibrary = (catalog, archetype) => !!catalog?.library?.includes(archetype);
