// The law-family backlog, from the DATA that server/play/tools/law-backlog.mjs writes docs/design/round7/games/law-backlog.md
// from (data/play/coverage.json + the class 4-7 curriculum), so a games test asserts "this topic left the backlog" on the
// data the gate owns and not on the text of a living doc. Same rule as the tool: a topic is listed when ITEM-ARENA is its only
// game or it has none.
import { readFileSync, readdirSync } from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;
export function backlogTopics() {
  const cov = JSON.parse(readFileSync(`${ROOT}data/play/coverage.json`, "utf8"));
  const cur = [];
  for (const f of readdirSync(`${ROOT}data/curriculum`)) if (/^c[4-7]-(maths|science|evs)\.json$/.test(f)) {
    for (const ch of JSON.parse(readFileSync(`${ROOT}data/curriculum/${f}`, "utf8")).chapters ?? []) for (const t of ch.topics ?? []) cur.push(t.id);
  }
  const law = new Set(cov.entries.filter((e) => e.family !== "arena").map((e) => e.topicId));
  const arena = new Set(cov.arenaOnly ?? []);
  return cur.filter((id) => arena.has(id) || !law.has(id)).sort();
}
/** The listed topics whose id matches `rx` (a RegExp, or a topic id string). */
export const backlogged = (rx) => backlogTopics().filter((id) => (typeof rx === "string" ? id === rx : rx.test(id)));
