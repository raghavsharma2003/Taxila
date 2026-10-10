// Debrief data (BUILD-SPEC §3.5), pure. "Now secure" is the ledger's own truth read twice through GET /api/child/map:
// the map fetched when the lesson opened, diffed against the map fetched when it ended (the v1 client diff; K-P5's
// `secure_since` replaces it). A skill counts only if it was NOT secure at the start and IS secure at the end, so
// today's first success (got_it) never shows here: secure needs the delayed re-check. "Opened" is what those skills
// open in the World and the Hangar (world.ts over data/kaksha/catalog.json): the same function the World draws with.
// No clock and no randomness (tests/r4-kaksha-economy.test.mjs and tests/r4-kaksha-desk.test.mjs check).
import { secureSet, world, type Catalog, type WorldSkill } from "../world.ts";

export interface MapLike { hidden?: boolean; skills: ReadonlyArray<WorldSkill> }

export interface DebriefSecure { skillId: string; title: string; subject: string; structure: string | null; items: string[] }

export interface DebriefData {
  /** null: the map is private (learning_profile consent off) or a read failed: the section is not shown at all. */
  nowSecure: DebriefSecure[] | null;
}

/** Skills secure at the end that were not secure at the start. Either read missing or hidden → null (unknown, not none). */
export function nowSecure(before: MapLike | null, after: MapLike | null, cat: Catalog): DebriefSecure[] | null {
  if (!before || !after || before.hidden || after.hidden) return null;
  // A skill becomes secure only after an earlier session put it on the map, so an empty "before" is a failed read,
  // never a child with nothing: unknown, so nothing is claimed (0 false "secure", BUILD-SPEC §11.4).
  if (before.skills.length === 0) return null;
  const was = secureSet(before.skills);
  const w = world(after.skills, cat, was);
  const out: DebriefSecure[] = [];
  const seen = new Set<string>();
  for (const k of after.skills) {
    if (k.state !== "secure" || was.has(k.skillId) || seen.has(k.skillId)) continue;
    seen.add(k.skillId);
    const st = w.structures.find((s) => s.skillId === k.skillId);
    out.push({
      skillId: k.skillId, title: k.title, subject: k.subject,
      structure: st ? st.label : null,
      // newly opened items whose opener is this skill (world() names the first secure skill that matches)
      items: w.items.filter((i) => i.isNew && i.by === k.title).map((i) => i.label),
    });
  }
  return out;
}

/**
 * Her closing line for the Debrief, or "" when her last line is not a closing (audit B05, 2026-10-10: a lesson the child
 * ended early showed her open fill-in prompt "Khaali jagah bhariye: 'Of' means __: 3/5 × 2/3." as the summary's lead).
 * Not a closing when it is a question (ends "?"), carries a fill-in blank ("__"), or is the question still on the card
 * (her last ask: the same words, either way round). PURE; her words are never rewritten, only kept or dropped.
 */
export function closingLine(caption: string, ask: string | null | undefined): string {
  const last = String(caption ?? "").replace(/\s+/g, " ").trim();
  if (!last) return "";
  if (/[?？]\s*["'”’)]*$/.test(last) || /_{2,}/.test(last)) return "";
  const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const a = norm(String(ask ?? "")), c = norm(last);
  if (a && c && (c.includes(a) || a.includes(c) || (a.length >= 24 && c.includes(a.slice(-24))))) return "";
  return last;
}
