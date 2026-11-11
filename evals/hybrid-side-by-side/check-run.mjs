#!/usr/bin/env node
// dc-r8-director20 G3 (main: fault 5 was live on three director20 rows while its dry predicate read 0): the dry predicates run over
// the rows of ANY run directory — a live run too — before judges read it. Exit 1 on any flag of a gated predicate.
//
//   node evals/hybrid-side-by-side/check-run.mjs <run dir> [--json] [--predicate <name>]
//
// A lesson's script is the run's own snapshot (<run dir>/scripts/<topicId>.json) when there is one, else data/lesson-scripts.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PREDICATES, PENDING } from "./dry-predicates.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : null; };

/** Every flag of every lesson in a run directory: [{ lesson, row, predicate, why, text, pending }]. */
export function checkRun(dir) {
  const out = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json") && x !== "meter.json").sort()) {
    const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (!Array.isArray(j.director) || !j.topicId) continue;
    const snap = join(dir, "scripts", `${j.topicId}.json`);
    const path = existsSync(snap) ? snap : join(ROOT, "data/lesson-scripts", `${j.topicId}.json`);
    const script = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
    for (const x of lessonFlags({ rows: j.director, script })) out.push({ lesson: f.replace(/\.json$/, ""), ...x, pending: PENDING.has(x.predicate) });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  if (!dir || dir.startsWith("--")) { console.error("usage: check-run.mjs <run dir> [--json] [--predicate <name>]"); process.exit(2); }
  const only = arg("predicate");
  const flags = checkRun(dir).filter((x) => !only || x.predicate === only);
  const counts = Object.fromEntries(Object.keys(PREDICATES).map((k) => [k, flags.filter((x) => x.predicate === k).length]));
  if (process.argv.includes("--json")) console.log(JSON.stringify({ counts, flags }, null, 1));
  else {
    console.log(JSON.stringify(counts));
    for (const x of flags) console.log(`${x.pending ? "(pending) " : ""}${x.lesson} ${x.row} ${x.predicate}: ${x.why} | ${x.text}`);
  }
  process.exit(flags.some((x) => !x.pending) ? 1 : 0);
}
