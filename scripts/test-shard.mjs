// Round 7, stream G (platform-gate-speed): run the test suites as weighted shards, so the release gate is a CI matrix of
// short jobs instead of one ~25 min process (where one root-hook timeout fails every suite after it).
//
//   npm run test:shard -- --shard 2/4                 the 2nd of 4 "unit" shards (every suite neither browser nor db)
//   npm run test:shard -- --group browser             the browser suites (Playwright / Chromium), one shard
//   npm run test:shard -- --group db                  the suites that need a test-branch database (they skip without one)
//   npm run test:shard -- --shard 2/4 --list          print the shard's files, run nothing
//   npm run test:all                                  THE COMMIT GATE (CLAUDE.md): every suite, one process each, 4-way
//   npm run test:shard -- --measure [--out FILE]      run EVERY suite, one process per file, and write measured seconds
//                                                     per file (tests/shard-weights.json) for the planner
//
// Each file runs in its own process (node --test with a file list: process isolation), --concurrency at a time
// (default: the machine's parallelism). `npm test` (tests/index.js, one process) is unchanged and remains the local
// all-in-one run. The planner is PURE and deterministic (scripts/test-shard-core.mjs), so every CI job computes the
// same partition from the same commit, and together the shards cover every suite exactly once (tested).
import { spawn, spawnSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { availableParallelism } from "os";
import { GROUPS, groupOf, parseShard, planShards } from "./test-shard-core.mjs";

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

const run = (list) => spawnSync(process.execPath, ["--test", `--test-concurrency=${concurrency}`, ...list.map((f) => "tests/" + f)],
  { cwd: ROOT, stdio: "inherit", env: process.env });

if (flag("--measure") || flag("--all")) {
  // every suite in its own `node --test <file>` process, `concurrency` at a time. --all is the commit gate
  // (`npm run test:all`, CLAUDE.md): it prints each failing suite's output and the totals, and exits 1 on any failure.
  // --measure also writes each suite's wall seconds to tests/shard-weights.json for the shard planner (node 22's
  // isolated runner flattens files into one TAP stream, so per-file durations are not in its output).
  const ALL = flag("--all");
  const t0 = Date.now(), seconds = {}, failed = [], totals = { tests: 0, pass: 0, fail: 0, skipped: 0, todo: 0 };
  const queue = [...files];
  const worker = async () => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      const s0 = Date.now();
      const { code, out } = await new Promise((res) => {
        const ch = spawn(process.execPath, ["--test", "tests/" + f], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: process.env });
        const chunks = [];
        ch.stdout.on("data", (d) => chunks.push(d)); ch.stderr.on("data", (d) => chunks.push(d));
        ch.on("close", (c, sig) => res({ code: c ?? sig, out: Buffer.concat(chunks).toString("utf8") }));
      });
      seconds[f] = +((Date.now() - s0) / 1000).toFixed(1);
      for (const k of Object.keys(totals)) { const m = new RegExp(`^# ${k} (\\d+)$`, "m").exec(out); if (m) totals[k] += Number(m[1]); }
      if (code !== 0) {
        failed.push(f);
        if (ALL) console.log(`\n✗ ${f} (exit ${code}, ${seconds[f]} s)\n${out.split("\n").filter((l) => /^not ok|^\s+(error|expected|actual|location):|^# (pass|fail)/.test(l)).slice(0, 40).join("\n")}`);
      } else if (ALL) process.stdout.write(".");
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  const wall = Math.round((Date.now() - t0) / 1000);
  const method = `one node --test process per file, ${concurrency} at a time, ${availableParallelism()} cores; wall ${wall} s`;
  if (flag("--measure")) {
    writeFileSync(opt("--out", WEIGHTS), JSON.stringify({ at: new Date().toISOString(), method, seconds: Object.fromEntries(Object.entries(seconds).sort(([a], [b]) => (a < b ? -1 : 1))) }, null, 1) + "\n");
    console.log(`measured ${Object.keys(seconds).length} files: ${method}`);
  }
  console.log(`\n${ALL ? "test:all" : "measure"}: ${files.length} suites, ${method}; tests ${totals.tests}, pass ${totals.pass}, fail ${totals.fail}, skipped ${totals.skipped}, todo ${totals.todo}`);
  console.log(failed.length ? `FAILED suites (${failed.length}): ${failed.join(", ")}` : "all suites passed");
  process.exit(failed.length ? 1 : 0);
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
