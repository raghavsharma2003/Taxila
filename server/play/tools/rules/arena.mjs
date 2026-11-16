// Play coverage rules for ITEM-ARENA (round 4 G1): generated, not authored. A topic is admitted when the arena bank
// (data/arena/index.json, built from VERIFIED kit items by tools/build-arena.mjs) holds at least MIN_CHALLENGES challenges
// for it; ACTS are the topic's skills that have at least one challenge. The arena is the broad net: rules/index.mjs puts
// it after every law family, so a skill a law family admits stays with that family. Never-gamified topics never enter.
import { readFileSync } from "node:fs";
import { R } from "./rule.mjs";
import { EXCLUDED } from "./never.mjs";

export const family = "arena";
const INDEX = JSON.parse(readFileSync(new URL("../../../../data/arena/index.json", import.meta.url), "utf8"));
const topics = Object.entries(INDEX.topics).filter(([id, t]) => t.eligible && !EXCLUDED.some((e) => id.startsWith(e.prefix))).sort(([a], [b]) => (a < b ? -1 : 1));

export const RULES = topics.map(([id, t]) => R(id, "arena", "pick", "pick", {}, { bank: t.file }));
export const ACTS = Object.fromEntries(topics.map(([id, t]) => [`${id}|pick`, Object.keys(t.skills).sort().map((sk) => sk.slice(id.length + 1))]));
