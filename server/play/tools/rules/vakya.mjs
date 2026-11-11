// Play coverage rules for VAKYA (round 7, English / Hindi grammar): generated, not authored, like ITEM-ARENA's. A topic is
// admitted when the vakya bank (data/play/vakya/index.json, built from VERIFIED kit items by tools/build-vakya.mjs) holds at
// least MIN_ITEMS sentence trains for it; ACTS are the topic's grammar skills that have at least one train; the misMap is
// the bank's own (each mal-rule type → the kit misconception whose wrong train it is, first item wins). Vakya is a law
// family, so it sits before the arena net and takes the grammar skills it admits. Never-gamified topics never enter.
import { readFileSync } from "node:fs";
import { R } from "./rule.mjs";
import { EXCLUDED } from "./never.mjs";

export const family = "vakya";
const INDEX = JSON.parse(readFileSync(new URL("../../../../data/play/vakya/index.json", import.meta.url), "utf8"));
const topics = Object.entries(INDEX.topics).filter(([id, t]) => t.eligible && !EXCLUDED.some((e) => id.startsWith(e.prefix))).sort(([a], [b]) => (a < b ? -1 : 1));
const slug = (id, kit) => (kit.startsWith(`${id}-m-`) ? kit.slice(id.length + 3) : kit);

export const RULES = topics.map(([id, t]) => R(id, "vakya", "rail", "build", Object.fromEntries(Object.entries(t.misMap).map(([mal, kit]) => [mal, slug(id, kit)])), { bank: t.file }, ["kagaz", "chalk", "blueprint", "raat"]));
export const ACTS = Object.fromEntries(topics.map(([id, t]) => [`${id}|build`, Object.keys(t.skills).sort().map((sk) => sk.slice(id.length + 1))]));
