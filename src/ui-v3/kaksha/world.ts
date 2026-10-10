// The Kaksha world as a PURE function of the ledger (BUILD-SPEC §4, dc-r4-gamification-b option B).
//   world(skills, catalog, before) → rings of stations, city lights, settlement structures and Hangar items.
// Laws this module keeps (tests/r4-kaksha-economy.test.mjs proves them over random maps):
//   - a station, a structure and an opened item exist IF AND ONLY IF a matching skill is `secure` in GET /api/child/map;
//   - monotonic: securing more never removes anything; nothing here reads a clock, so nothing decays or punishes absence;
//   - deterministic: angles and lights are seeded by skill id only (no Math.random); settlement slots follow the order
//     skills became secure (`since`, append-only), falling back to the seed until the server sends it;
//   - no counts: the model exposes no "n of m" and no totals the screens could print.
// Erasable TypeScript only (node --test imports this file directly).

export type MapStateLite = "not_started" | "practising" | "got_it" | "secure";

/** The fields of ChildMapSkill (shared/contracts.ts) the world reads. */
export interface WorldSkill {
  skillId: string;
  title: string;
  subject: string;
  chapter?: string;
  label?: string;
  topicId?: string;
  state: MapStateLite;
}

export interface CatalogStructure { kind: string; label: string; why: string; match: string }
export interface CatalogItem { id: string; kind: string; label: string; hue: string; opensWith: string; match: string }
export interface Catalog {
  version: number;
  structures: CatalogStructure[];
  defaults: Record<string, string>;
  items: CatalogItem[];
}

export interface Station { skillId: string; title: string; ring: number; angle: number; isNew: boolean }
export interface Mover { skillId: string; ring: number; angle: number }
export interface Ring { subject: string; index: number; stations: Station[]; movers: Mover[] }
export interface Structure { skillId: string; kind: string; label: string; why: string; title: string; slot: number; x: number; y: number; isNew: boolean }
export interface HangarItem { id: string; kind: string; label: string; hue: string; opensWith: string; open: boolean; isNew: boolean; by: string | null }
export interface World {
  /** Rings in a fixed subject order (only subjects the child has any skill in). */
  rings: Ring[];
  /** City lights on the planet's night side: seeds only (a light per seed), never printed as a number. */
  lights: Array<{ seed: number; isNew: boolean }>;
  structures: Structure[];
  items: HangarItem[];
  /** Whether anything is secure at all (the empty world shows the planet and the Hangar only). */
  any: boolean;
}

export const SUBJECT_ORDER = ["maths", "science", "evs", "english", "hindi", "social", "sst"];
export const LIGHTS_PER_STATION = 9;
/** Settlement grid (fixed slot order: the settlement never rearranges). */
export const GRID = 5;

/** FNV-1a 32-bit hash of a string → [0, 1). Deterministic seed per skill id. */
export function seedOf(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 4294967296;
}

const norm = (s: string) => s.toLowerCase();
const subjectKey = (s: string) => {
  const n = norm(s);
  if (n.startsWith("math")) return "maths";
  if (n.startsWith("sci")) return "science";
  if (n.startsWith("evs") || n.includes("environment")) return "evs";
  if (n.startsWith("eng")) return "english";
  if (n.startsWith("hin")) return "hindi";
  if (n.startsWith("soc") || n === "sst") return "social";
  return n;
};
const hay = (k: WorldSkill) => norm(`${k.subject} ${k.chapter ?? ""} ${k.title} ${k.label ?? ""}`);
const matches = (pattern: string, k: WorldSkill) => new RegExp(pattern, "i").test(hay(k));

export function structureFor(k: WorldSkill, cat: Catalog): CatalogStructure {
  const hit = cat.structures.find((s) => matches(s.match, k));
  if (hit) return hit;
  const kind = cat.defaults[subjectKey(k.subject)] ?? "pavilion";
  return cat.structures.find((s) => s.kind === kind) ?? { kind, label: kind, why: "", match: "" };
}

/**
 * Build the world. `before` is the set of skill ids that were already secure on the previous view (the "Yesterday"
 * world): anything secure now and not in `before` is marked isNew (the dock / rise animation). Pass `before =
 * undefined` to mark nothing new. The function never reads a clock.
 */
export function world(skills: ReadonlyArray<WorldSkill>, cat: Catalog, before?: ReadonlySet<string>, since?: Readonly<Record<string, string>>): World {
  // de-duplicate by skill id (the map can list a skill under two chapters); the strongest state wins
  const strength: Record<MapStateLite, number> = { not_started: 0, practising: 1, got_it: 2, secure: 3 };
  const by = new Map<string, WorldSkill>();
  for (const k of skills) {
    const prev = by.get(k.skillId);
    if (!prev || strength[k.state] > strength[prev.state]) by.set(k.skillId, k);
  }
  const all = [...by.values()].sort((a, b) => (a.skillId < b.skillId ? -1 : a.skillId > b.skillId ? 1 : 0));
  const secure = all.filter((k) => k.state === "secure");
  const isNew = (id: string) => !!before && !before.has(id);

  const subjects = [...new Set(all.map((k) => subjectKey(k.subject)))].sort((a, b) => {
    const ia = SUBJECT_ORDER.indexOf(a), ib = SUBJECT_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a < b ? -1 : 1);
  });
  const rings: Ring[] = subjects.map((subject, index) => ({
    subject,
    index,
    stations: secure.filter((k) => subjectKey(k.subject) === subject).map((k) => ({ skillId: k.skillId, title: k.title, ring: index, angle: seedOf(k.skillId) * Math.PI * 2, isNew: isNew(k.skillId) })),
    movers: all.filter((k) => subjectKey(k.subject) === subject && k.state === "got_it").map((k) => ({ skillId: k.skillId, ring: index, angle: seedOf(`${k.skillId}#m`) * Math.PI * 2 })),
  }));

  const lights: World["lights"] = [];
  for (const k of secure) for (let i = 0; i < LIGHTS_PER_STATION; i++) lights.push({ seed: seedOf(`${k.skillId}#${i}`), isNew: isNew(k.skillId) });

  // settlement: slots in a fixed spiral order, filled in the order skills became secure. With `since` (the server's
  // secure_since per skill, BUILD-SPEC K-P5) that order is append-only: a new structure takes the next free slot and no
  // existing one ever moves. Without it (today's /api/child/map), the order falls back to each skill's seed, which is
  // stable for a given secure set but may insert. Comparing the given strings is not reading a clock.
  const order = secure.slice().sort((a, b) => {
    const sa = since?.[a.skillId], sb = since?.[b.skillId];
    if (sa && sb && sa !== sb) return sa < sb ? -1 : 1;
    if (sa && !sb) return -1;
    if (sb && !sa) return 1;
    return seedOf(a.skillId) - seedOf(b.skillId);
  });
  const slots = spiral(GRID);
  const structures: Structure[] = order.slice(0, slots.length).map((k, i) => {
    const s = structureFor(k, cat);
    return { skillId: k.skillId, kind: s.kind, label: s.label, why: s.why, title: k.title, slot: i, x: slots[i][0], y: slots[i][1], isNew: isNew(k.skillId) };
  });

  const items: HangarItem[] = cat.items.map((it) => {
    const opener = secure.find((k) => matches(it.match, k)) ?? null;
    const openedBefore = !!opener && !!before && secure.some((k) => matches(it.match, k) && before.has(k.skillId));
    return { id: it.id, kind: it.kind, label: it.label, hue: it.hue, opensWith: it.opensWith, open: !!opener, isNew: !!opener && !!before && !openedBefore, by: opener ? opener.title : null };
  });

  return { rings, lights, structures, items, any: secure.length > 0 };
}

/** Grid cells from the centre outwards (a fixed order). */
export function spiral(n: number): Array<[number, number]> {
  const c = (n - 1) / 2;
  const cells: Array<[number, number]> = [];
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) cells.push([x, y]);
  return cells.sort((a, b) => Math.hypot(a[0] - c, a[1] - c) - Math.hypot(b[0] - c, b[1] - c) || a[0] - b[0] || a[1] - b[1]);
}

/** The set of secure skill ids (what a "Yesterday" snapshot stores). */
export function secureSet(skills: ReadonlyArray<WorldSkill>): Set<string> {
  return new Set(skills.filter((k) => k.state === "secure").map((k) => k.skillId));
}
