// d31 (main's brief, item 5): an eval-only way to walk a topic whose script is staged (data/lesson-scripts-staged), for the dry matrix.
// The server never reads that folder for a lesson: server/director/script.js scriptFor reads data/lesson-scripts (or the folder an
// explicit TAXILA_R7_SCRIPT_DIR names), so a staged script is never served to a child. This module is imported by the harness alone and
// hands a staged script to the walk the way a test does — setScriptForTest, in this process only — for a topic that has no pilot script.
// The harness turns it on with --staged; without it a staged topic walks as the server would (no script).
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setScriptForTest } from "../../server/director/script.js";

const ROOT = new URL("../..", import.meta.url).pathname;
export const PILOT_DIR = join(ROOT, "data/lesson-scripts");
export const STAGED_DIR = join(ROOT, "data/lesson-scripts-staged");

/** The topics of a list whose script is staged: no pilot script, a staged one. */
export function stagedTopicsOf(topics) {
  return [...new Set(topics)].filter((t) => !existsSync(join(PILOT_DIR, `${t}.json`)) && existsSync(join(STAGED_DIR, `${t}.json`)));
}
/** Hands each staged topic's script to the walk in this process (setScriptForTest). → the topics loaded. */
export function useStaged(topics) {
  const out = stagedTopicsOf(topics);
  for (const t of out) setScriptForTest(t, JSON.parse(readFileSync(join(STAGED_DIR, `${t}.json`), "utf8")));
  return out;
}
/** Writes the staged scripts walked into the run's own snapshot folder (<run dir>/scripts), which check-run.mjs and counts.mjs read. */
export function snapshotStaged(dir, topics) {
  if (!topics.length) return;
  mkdirSync(join(dir, "scripts"), { recursive: true });
  for (const t of topics) writeFileSync(join(dir, "scripts", `${t}.json`), readFileSync(join(STAGED_DIR, `${t}.json`), "utf8"));
}
