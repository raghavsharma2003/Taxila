// Studio v2 COLOUR TRACE (main 2026-11-11, theme work): plays every engine headless (layout-probe.mjs, its reviewed
// default spec and first catalogue spec, at p412 and l1366) under a theme and hashes every colour it draws with, in
// draw order (layout-probe colourKey: r,g,b,a, plus the alpha and composite at the draw). The night theme's hashes are
// recorded in tests/fixtures/studio-v2-colour-trace.json from the code as it was BEFORE the palette moved: a run whose
// night hash differs has changed a live pixel.
//
//   node src/studio-v2/tools/colour-trace.mjs                 compare night with the fixture
//   node src/studio-v2/tools/colour-trace.mjs --write         (re)record the fixture — only when a night change is MEANT
//   node src/studio-v2/tools/colour-trace.mjs --theme paper   play every run under paper and report errors (no fixture)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOXES, loadModules, probe, runId, runsOf } from "./layout-probe.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const TRACE_FILE = path.join(repo, "tests/fixtures/studio-v2-colour-trace.json");
export const TRACE_BOXES = ["p412", "l1366"];

/** { runId: "hash:n" } for every run under `theme`, plus the runs that threw. */
export async function traceAll(theme = "night") {
  const m = await loadModules();
  const hashes = {}, errors = [];
  for (const run of runsOf(m, 1)) {
    if (!TRACE_BOXES.includes(run.box.vp)) continue;
    const r = await probe(run.archetype, run.spec, run.box, { colours: true, theme });
    hashes[runId(run)] = `${r.colours?.hash}:${r.colours?.n}`;
    if (r.errors.length) errors.push(`${runId(run)}: ${r.errors[0]}`);
  }
  return { hashes, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const theme = process.argv.includes("--theme") ? process.argv[process.argv.indexOf("--theme") + 1] : "night";
  const { hashes, errors } = await traceAll(theme);
  if (errors.length) console.log(`errors under ${theme}:\n` + errors.join("\n"));
  if (process.argv.includes("--write")) {
    if (theme !== "night") throw new Error("only the night trace is recorded");
    fs.writeFileSync(TRACE_FILE, JSON.stringify({ note: "Night colour trace per Studio v2 run (src/studio-v2/tools/colour-trace.mjs). Re-record only when a change to the live night look is meant.", boxes: TRACE_BOXES, hashes }, null, 1) + "\n");
    console.log(`wrote ${Object.keys(hashes).length} runs to ${path.relative(repo, TRACE_FILE)}`);
  } else if (theme === "night") {
    const want = JSON.parse(fs.readFileSync(TRACE_FILE, "utf8")).hashes;
    const diff = Object.keys({ ...want, ...hashes }).filter((k) => want[k] !== hashes[k]);
    console.log(diff.length ? `night changed in ${diff.length} runs:\n${diff.join("\n")}` : `night unchanged: ${Object.keys(hashes).length} runs`);
    process.exitCode = diff.length ? 1 : 0;
  } else console.log(`${theme}: ${Object.keys(hashes).length} runs, ${errors.length} errors`);
}
