// Kit lint over engine hints (W1-B #2). The Director resolves every kit engineHint through ONE resolver
// (shared/engine-catalog.js resolveHint / pickEngine, with the research topic map as the fallback), so a kit hint is
// either an alias of a built engine, or demand for an engine that does not exist yet (a forge_gap row per lesson that
// reaches the kit: server/forge/seam.js unservedHints), never a mount of an id the frame cannot load.
//
// Errors (exit 1):
//   - a hint written as an engine id ("name@N") that is not in ENGINES (a typo mounts nothing; it must say so here);
//   - an alias, or a topic-map entry, that names an engine not in ENGINES (the catalog would plan an unknown id);
//   - the ratchet: more kits with no engine at all than BASELINE_NO_ENGINE (a kit edit that loses its engine, or a
//     new kit without one, must be a decision, not drift). Lower the baseline when coverage grows.
// Report: how many kits resolve by hint (and how many of those only through an alias, the kits the pre-catalog
// picker failed), by the topic map, or not at all, and the unresolved hints ranked by kits (the engine backlog).
// Usage: node scripts/lint-kits.mjs [--json] [--top 15]
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ENGINES, HINT_ALIASES, resolveHint, pickEngine } from "../shared/engine-catalog.js";

const ROOT = new URL("..", import.meta.url);
/** Kits (all classes) with no engine by hint or topic map, measured 2026-10-04 (W1-B). Ratchet: may only go down. */
export const BASELINE_NO_ENGINE = 559;

const engineIdOf = (hint) => {   // the pre-catalog picker (server/director/modules.js engineId): the "before" column
  const base = String(hint).trim().toLowerCase().replace(/@.*$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base}@${String(hint).match(/@(\d+)$/)?.[1] ?? "1"}`;
};

/** @returns {{ kits: number, hints: number, byHint: number, aliasOnly: number, byTopicMap: number, noEngine: number,
 *   firstHintLoads: number, unresolved: [string, number][], errors: string[] }} */
export function lintKits({ root = ROOT } = {}) {
  const topicMap = JSON.parse(readFileSync(new URL("shared/engine-topic-map.json", root), "utf8"));
  const errors = [];
  for (const [alias, a] of Object.entries(HINT_ALIASES)) if (!ENGINES[a.engine]) errors.push(`alias ${alias} → ${a.engine}: not an engine`);
  for (const [topic, e] of Object.entries(topicMap)) if (!ENGINES[e]) errors.push(`topic map ${topic} → ${e}: not an engine`);
  const files = readdirSync(new URL("data/kits/", root)).filter((f) => /^c\d-[a-z]+\.json$/.test(f)).sort();
  let kits = 0, hints = 0, byHint = 0, aliasOnly = 0, byTopicMap = 0, noEngine = 0, firstHintLoads = 0;
  const unresolved = new Map();
  for (const f of files) {
    for (const t of JSON.parse(readFileSync(new URL(`data/kits/${f}`, root), "utf8")).topics ?? []) {
      kits++;
      const hs = t.formats?.engineHints ?? [];
      hints += hs.length;
      for (const h of hs) {
        if (/@\d+$/.test(String(h).trim()) && !ENGINES[String(h).trim().toLowerCase()]) errors.push(`${t.topicId}: hint "${h}" names engine id that is not in ENGINES`);
        if (!resolveHint(h)) unresolved.set(String(h).toLowerCase(), (unresolved.get(String(h).toLowerCase()) ?? 0) + 1);
      }
      const kit = { topicId: t.topicId, formats: { engineHints: hs } };
      const first = hs[0] ? engineIdOf(hs[0]) : null;
      if (first && ENGINES[first]) firstHintLoads++;
      const p = pickEngine(kit, undefined, topicMap);
      if (!p) noEngine++;
      else if (p.via === "hint") { byHint++; if (!(first && ENGINES[first])) aliasOnly++; }
      else byTopicMap++;
    }
  }
  if (noEngine > BASELINE_NO_ENGINE) errors.push(`${noEngine} kits have no engine (baseline ${BASELINE_NO_ENGINE}): map their hints in shared/engine-catalog.js HINT_ALIASES, or lower nothing and log why`);
  return { kits, hints, byHint, aliasOnly, byTopicMap, noEngine, firstHintLoads, unresolved: [...unresolved].sort((a, b) => b[1] - a[1]), errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const top = Number(process.argv[process.argv.indexOf("--top") + 1]) || 15;
  const r = lintKits();
  if (process.argv.includes("--json")) console.log(JSON.stringify({ ...r, unresolved: r.unresolved.slice(0, 200) }, null, 1));
  else {
    console.log(`kits ${r.kits} · hints ${r.hints}`);
    console.log(`engine by hint ${r.byHint} (of which ${r.aliasOnly} only through a catalog alias; the pre-catalog picker loaded ${r.firstHintLoads})`);
    console.log(`engine by topic map ${r.byTopicMap} · no engine ${r.noEngine} (baseline ${BASELINE_NO_ENGINE}): each lesson on one writes a forge_gap row`);
    console.log(`unresolved hints: ${r.unresolved.length} distinct; top ${top}: ${r.unresolved.slice(0, top).map(([h, n]) => `${h} ${n}`).join(", ")}`);
    for (const e of r.errors) console.log(`ERROR ${e}`);
  }
  process.exitCode = r.errors.length ? 1 : 0;
}
