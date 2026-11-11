// Round 7 F (App's app-world-hangar-depth): the Hangar cosmetics a child equipped, synced across devices (046 child_equip).
// Values are catalog item ids (data/kaksha/catalog.json, App's) of the slot's kind; a slot the catalog has no items for yet
// (emote) takes a short slug, which the client validates against its own list.
import { readFileSync } from "node:fs";

export const EQUIP_SLOTS = Object.freeze(["hull", "trail", "board", "rim", "emote"]);
const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
let CATALOG = null;
const catalog = () => (CATALOG ??= (() => {
  try { return JSON.parse(readFileSync(new URL("../../data/kaksha/catalog.json", import.meta.url), "utf8")).items ?? []; } catch { return []; }
})());

/** PURE (given the catalog). → { equipped } or { error } */
export function validateEquip(equipped, items = catalog()) {
  if (!equipped || typeof equipped !== "object" || Array.isArray(equipped)) return { error: "equipped must be an object" };
  const out = {};
  for (const [slot, id] of Object.entries(equipped)) {
    if (!EQUIP_SLOTS.includes(slot)) return { error: `unknown slot ${slot}` };
    if (id === null) continue;                                  // null clears a slot
    if (typeof id !== "string" || !SLUG.test(id)) return { error: `bad item id for ${slot}` };
    const ofKind = items.filter((i) => i.kind === slot);
    if (ofKind.length && !ofKind.some((i) => i.id === id)) return { error: `${id} is not a ${slot} in the catalog` };
    out[slot] = id;
  }
  return { equipped: out };
}
