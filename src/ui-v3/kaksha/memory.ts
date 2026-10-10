// Per-child device memory for the Kaksha World (BUILD-SPEC §4.1, §4.3). Two small things, both keyed by the child id:
//   - the "Yesterday" snapshot: the secure set as of the previous day this child opened the World, so "Today" can
//     mark what became secure since (the dock / rise animation). Until the server sends secure_since (K-P5) this is the
//     only way to know; it is a display aid, never truth (truth is GET /api/child/map).
//   - the equipped Hangar items (identity, not reward). v1 is this device; a server pref lands before 100% (K-O answers).
// Storage failures are silent: the World still draws from the map, with nothing marked new and nothing equipped.
const snapKey = (cid: string) => `kx.world.${cid}.seen`;
const equipKey = (cid: string) => `kx.hangar.${cid}.equipped`;

interface Snap { day: string; ids: string[]; prev: string[] }

/** Today's local day (YYYY-MM-DD). The only clock read in the World, used to roll the snapshot, never to decay. */
export function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The set that was secure before today's first view (null: first ever view, nothing marked new). Rolls the snapshot. */
export function rollSnapshot(cid: string, secureNow: ReadonlySet<string>, day = localDay()): Set<string> | null {
  try {
    const raw = localStorage.getItem(snapKey(cid));
    const snap: Snap | null = raw ? JSON.parse(raw) : null;
    if (!snap) {
      localStorage.setItem(snapKey(cid), JSON.stringify({ day, ids: [...secureNow], prev: [...secureNow] } satisfies Snap));
      return null;
    }
    if (snap.day !== day) {
      const next: Snap = { day, ids: [...secureNow], prev: snap.ids };
      localStorage.setItem(snapKey(cid), JSON.stringify(next));
      return new Set(next.prev);
    }
    // same day: keep the morning's baseline; remember today's set (monotonic union, a secure skill is never dropped)
    const ids = [...new Set([...snap.ids, ...secureNow])];
    localStorage.setItem(snapKey(cid), JSON.stringify({ ...snap, ids } satisfies Snap));
    return new Set(snap.prev);
  } catch {
    return null;
  }
}

export function readEquipped(cid: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(equipKey(cid));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Equip an OPEN item in its slot (hull / trail / board / rim). Equipping never gates a lesson or a game. */
export function writeEquipped(cid: string, slot: string, itemId: string): Record<string, string> {
  const next = { ...readEquipped(cid), [slot]: itemId };
  try {
    localStorage.setItem(equipKey(cid), JSON.stringify(next));
  } catch {
    /* storage blocked: the choice lasts this view only */
  }
  return next;
}
