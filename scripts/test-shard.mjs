// Round 7, stream G (platform-gate-speed): run the test suites as weighted shards, so the release gate is a CI matrix of
// short jobs instead of one ~25 min process (where one root-hook timeout fails every suite after it).
//
//   npm run test:shard -- --shard 2/4                 the 2nd of 4 "unit" shards (every suite neither browser nor db)
//   npm run test:shard -- --group browser             the browser suites (Playwright / Chromium), one shard
//   npm run test:shard -- --group db                  the suites that need a test-branch database (they skip without one)
//   npm run test:shard -- --shard 2/4 --list          print the shard's files, run nothing
//   npm run test:shard -- --measure [--out FILE]      run EVERY suite, one process per file, and write measured seconds
//                                                     per file (tests/shard-weights.json) for the planner
//
// Each file runs in its own process (node --test with a file list: process isolation), --concurrency at a time
// (default: the machine's parallelism). `npm test` (tests/index.js, one process) is unchanged and remains the local
// all-in-one run. The planner is PURE and deterministic (scripts/test-shard-core.mjs), so every CI job computes the
// same partition from the same commit, and together the shards cover every suite exactly once (tested).
import { spawnSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { availableParallelism } from "os";
import { GROUPS, groupOf, parseShard, planShards, tapFileDurations } from "./test-shard-core.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const TESTS = ROOT + "tests/";
const WEIGHTS = TESTS + "shard-weights.json";
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };

const files = readdirSync(TESTS).filter((n) => n.endsWith(".test.mjs")).sort();
const groups = Object.fromEntries(GROUPS.map((g) => [g, []]));
for (const f of files) groups[groupOf(f, readFileSync(TESTS + f, "utf8"))].push(f);
const concurrency = Number(opt("--concurrency", Math.max(1, availableParallelism())));

const run = (list, { reporter } = {}) => spawnSync(process.execPath,
  ["--test", `--test-concurrency=${concurrency}`, ...(reporter ? [`--test-reporter=${reporter}`] : []), ...list.map((f) => "tests/" + f)],
  { cwd: ROOT, stdio: reporter ? ["ignore", "pipe", "inherit"] : "inherit", env: process.env, encoding: "utf8", maxBuffer: 1 << 28 });

if (flag("--measure")) {
  const t0 = Date.now();
  const r = run(files, { reporter: "tap" });
  const secs = tapFileDurations(r.stdout || "");
  const failed = Object.entries(secs).filter(([, v]) => !v.ok).map(([k]) => k);
  const out = { at: new Date().toISOString(), method: `node --test, one process per file, concurrency ${concurrency}, ${availableParallelism()} cores; wall ${Math.round((Date.now() - t0) / 1000)} s`,
    seconds: Object.fromEntries(Object.entries(secs).map(([k, v]) => [k, +v.s.toFixed(1)]).sort()) };
  writeFileSync(opt("--out", WEIGHTS), JSON.stringify(out, null, 1) + "\n");
  console.log(`measured ${Object.keys(secs).length} of ${files.length} files in ${out.method}; failed in isolation: [${failed.join(", ")}]`);
  process.exit(r.status ?? 1);
}

let weights = {};
try { weights = JSON.parse(readFileSync(WEIGHTS, "utf8")).seconds ?? {}; } catch { /* no weights yet: every file weighs the same */ }
const group = opt("--group", "unit");
if (!GROUPS.includes(group)) { console.error(`--group: one of ${GROUPS.join(", ")}`); process.exit(2); }
const { i, n } = parseShard(opt("--shard", "1/1"));
const shard = planShards(groups[group], weights, n)[i - 1];
const est = shard.reduce((s, f) => s + (weights[f] ?? 0), 0);
console.log(`test-shard: ${group} ${i}/${n}: ${shard.length} of ${groups[group].length} files (${files.length} in all), ~${Math.round(est)} s measured serial, concurrency ${concurrency}`);
if (flag("--list")) { console.log(shard.join("\n")); process.exit(0); }
if (!shard.length) process.exit(0);
process.exit(run(shard).status ?? 1);
