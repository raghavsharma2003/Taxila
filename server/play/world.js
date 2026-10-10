// The play world (DESIGN.md §6): a PURE view of the learner ledger. Stations are the coverage topics of a family near the
// child's class; a station's ink comes ONLY from its skills' map states (server/reports/truth.js MAP_SHAPE): pencil = got
// it today, ink = secure (right again on another day, without help), hatched = practising, ahead = not started. Routes
// are real prerequisite edges (the curriculum's topic prerequisites, the kits' skill prereqSkillIds), each with its
// citation. No counts, no clock, no locks: absence never changes a drawn state (tests/play-world.test.mjs).
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { inkOf } from "../../shared/play.ts";
import { coverage } from "./levels.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
let EDGES = null;
/** topicId → { prereqTopics: string[], skills: { id, prereqSkillIds }[] } for classes 3-8 maths/science/evs. */
export function edges() {
  if (EDGES) return EDGES;
  EDGES = new Map();
  const scope = /^c[3-8]-(maths|science|evs)\.json$/;
  for (const f of readdirSync(join(ROOT, "data/curriculum"))) if (scope.test(f)) {
    const c = JSON.parse(readFileSync(join(ROOT, "data/curriculum", f), "utf8"));
    for (const ch of c.chapters ?? []) for (const t of ch.topics ?? []) EDGES.set(t.id, { prereqTopics: t.prerequisites ?? [], skills: [] });
  }
  for (const f of readdirSync(join(ROOT, "data/kits"))) if (scope.test(f)) {
    for (const t of JSON.parse(readFileSync(join(ROOT, "data/kits", f), "utf8")).topics ?? []) {
      const e = EDGES.get(t.topicId) ?? { prereqTopics: [], skills: [] };
      e.skills = (t.skills ?? []).map((s) => ({ id: s.id, prereqSkillIds: s.prereqSkillIds ?? [] }));
      EDGES.set(t.topicId, e);
    }
  }
  return EDGES;
}
export const FAMILIES = ["todo-jodo", "taraazu", "nishana", "kyun-lab", "nazariya"];

/**
 * PURE. The family's world for a child.
 * @param {{ family: string, classLevel: number, mapState: (skillId: string) => { shape: string, recheck: boolean }, hereTopic?: string|null }} o
 */
export function worldFamily(o, cov = coverage(), E = edges()) {
  const near = (k) => k >= Math.max(4, o.classLevel - 1) && k <= Math.min(7, o.classLevel + 1);
  const seen = new Map();
  for (const e of cov.entries) if (e.family === o.family && near(e.classLevel) && !seen.has(e.topicId)) seen.set(e.topicId, e);
  const stations = [...seen.values()].map((e) => {
    const st = e.skillIds.map((id) => o.mapState(id));
    return { topicId: e.topicId, title: e.title, skillIds: e.skillIds, state: inkOf(st.map((s) => s.shape)), recheck: st.some((s) => s.recheck), here: e.topicId === o.hereTopic, mode: e.mode };
  });
  const ids = new Set(stations.map((s) => s.topicId)), routes = [], key = new Set();
  for (const to of ids) {
    const e = E.get(to); if (!e) continue;
    for (const from of e.prereqTopics) if (ids.has(from) && from !== to && !key.has(`${from}>${to}`)) { key.add(`${from}>${to}`); routes.push({ from, to, cite: "curriculum", edge: `${to}←${from}` }); }
    for (const sk of e.skills) for (const pre of sk.prereqSkillIds) {
      const from = pre.replace(/-s\d+$/, "");
      if (ids.has(from) && from !== to && !key.has(`${from}>${to}`)) { key.add(`${from}>${to}`); routes.push({ from, to, cite: "kit", edge: `${sk.id}←${pre}` }); }
    }
  }
  return { family: o.family, stations, routes };
}

/** The four MAP_SHAPE states from a loadTruth() reader. */
export function mapStateFrom(truth, MAP_SHAPE) {
  return (skillId) => { const s = truth.state(skillId); return { shape: MAP_SHAPE[s.key] ?? "not_started", recheck: !!s.recheck }; };
}
