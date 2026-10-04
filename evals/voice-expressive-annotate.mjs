// B7 gate: the LLM annotator's validity (≥ 95% after the code validator) and content preservation (100%) on kit lines,
// on the BACKGROUND lane. n = 40 lines (every row family), taxila-fast effort low unless --deployment / --effort.
// Run: set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 node evals/voice-expressive-annotate.mjs
import fs from "node:fs";
import { annotate, setAnnotationStore, withAnnotation } from "../server/voice/expressive/annotate.js";
import { align, preserved } from "../server/voice/expressive/align.js";
import { kitLines, momentsFor, REPLY_SHAPES } from "./voice-expressive-corpus.mjs";

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const N = Number(arg("n", 40));
setAnnotationStore({ get: async () => null, put: async () => {} });
const all = kitLines();
const lines = [...REPLY_SHAPES.filter((r) => !/1098|14416/.test(r)), ...all.filter((_, i) => i % Math.floor(all.length / N) === 0)].slice(0, N);
const rows = [];
let valid = 0, kept = 0;
for (const [i, line] of lines.entries()) {
  const m = { ...momentsFor(i), safety: false };
  const t0 = performance.now();
  let ann = null, err = null;
  try { ann = await annotate(line, m, { deployment: arg("deployment", undefined), effort: arg("effort", "low") }); } catch (e) { err = e.message; }
  const ms = Math.round(performance.now() - t0);
  if (ann) valid++;
  const plan = ann ? withAnnotation(align(line, m), ann) : null;
  if (plan && preserved(plan, line)) kept++;
  rows.push({ i, ms, valid: !!ann, preserved: plan ? preserved(plan, line) : null, err });
  process.stdout.write(ann ? "." : "x");
}
const lat = rows.map((r) => r.ms).sort((a, b) => a - b);
const out = { at: new Date().toISOString(), n: lines.length, valid, validRate: valid / lines.length, preserved: kept, p50: lat[lat.length >> 1], p90: lat[Math.floor(lat.length * 0.9)], rows };
fs.mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("./out/voice-expressive-annotate.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(`\nvalid ${valid}/${lines.length} (${(100 * valid / lines.length).toFixed(1)}%), preserved ${kept}/${valid}, p50 ${out.p50} ms, p90 ${out.p90} ms`);
process.exitCode = valid / lines.length >= 0.95 && kept === valid ? 0 : 1;
