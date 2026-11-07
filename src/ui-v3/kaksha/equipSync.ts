// The equip set on the server (r7 app-world-hangar-depth): kept apart from memory.ts, which stays device-local and isolated
// from the world and the lesson (tests/r4-kaksha-economy E6). Equipping still never gates or changes anything a child can
// win or lose; this only carries the choice to another device.
import { equipKey } from "./memory.ts";

// r7 app-world-hangar-depth: the server's equip set (Learning's GET/PUT /api/child/equip, table child_equip, migration
// 046), so a child's choices follow them to another device. The device copy above stays the offline fallback.
const SLOTS = ["hull", "trail", "board", "rim", "emote"] as const;
const EMOTE_SLUG = /^[a-z0-9-]{1,40}$/;

/** Read the server's set; when it answers with one, it wins and is kept on the device. null: no route / offline. */
export async function syncEquipped(cid: string): Promise<Record<string, string> | null> {
  try {
    const r = await fetch(`/api/child/equip?childId=${encodeURIComponent(cid)}`, { credentials: "same-origin" });
    if (!r.ok) return null;
    const j = (await r.json()) as { equipped?: Record<string, unknown> };
    const eq: Record<string, string> = {};
    for (const s of SLOTS) { const v = j.equipped?.[s]; if (typeof v === "string" && v) eq[s] = v; }
    if (!Object.keys(eq).length) return null; // nothing on the server yet: the device's choice stands
    try { localStorage.setItem(equipKey(cid), JSON.stringify(eq)); } catch { /* storage blocked */ }
    return eq;
  } catch {
    return null;
  }
}

/** Write the whole set to the server (a PUT replaces it). Fire and forget: the device copy is already written. */
export async function pushEquipped(cid: string, equipped: Record<string, string>): Promise<boolean> {
  const body: Record<string, string | null> = {};
  for (const s of SLOTS) {
    const v = equipped[s];
    body[s] = v && (s !== "emote" || EMOTE_SLUG.test(v)) ? v : null;
  }
  try {
    const r = await fetch("/api/child/equip", { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: cid, equipped: body }) });
    return r.ok;
  } catch {
    return false;
  }
}
