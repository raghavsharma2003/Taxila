// A cheap check for state leaking between test files (round 7 audit, tests-evals TE-14). `npm run test:all` runs every suite
// in its OWN process, so a module-level or global write that breaks a LATER file in the same process can never show there; the
// single-process `DATABASE_URL= npm test` shows it but takes 30+ minutes (cut off by container restarts three times since
// integration 20). This runs the unit suites in N processes, several files each (node's test isolation off), N at a time:
// the same leak detector over smaller neighbourhoods, in roughly 1/N of the time. Which files share a process is decided by
// --seed (default: today's date), so over many gates every pair of files meets; a failure prints the seed to repeat it.
//   node scripts/test-leak-check.mjs [--procs 4] [--seed 20261110] [--list]
import { spawn } from "child_process";
import { readdirSync, readFileSync } from "fs";
import { availableParallelism } from "os";
import { groupOf, planShards } from "./test-shard-core.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const procs = Math.max(1, Number(opt("--procs", Math.min(4, availableParallelism()))));
const seed = Number(opt("--seed", new Date().toISOString().slice(0, 10).replaceAll("-", "")));
let weights = {};
try { weights = JSON.parse(readFileSync(ROOT + "tests/shard-weights.json", "utf8")).seconds ?? {}; } catch { /* unweighted */ }

let s = seed >>> 0;
const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const files = readdirSync(ROOT + "tests").filter((n) => n.endsWith(".test.mjs")).sort()
  .filter((n) => groupOf(n, readFileSync(ROOT + "tests/" + n, "utf8")) === "unit");
const jittered = Object.fromEntries(files.map((f) => [f, (Number(weights[f]) || 1) * (0.5 + rnd())]));
const shards = planShards(files, jittered, procs);
if (argv.includes("--list")) { shards.forEach((g, i) => console.log(`process ${i + 1}: ${g.length} files`)); process.exit(0); }

console.log(`leak check: ${files.length} unit suites in ${procs} processes, seed ${seed}`);
const t0 = Date.now();
const results = await Promise.all(shards.map((g, i) => new Promise((resolve) => {
  const out = [];
  const p = spawn(process.execPath, ["--test", "--experimental-test-isolation=none", ...g.map((f) => "tests/" + f)], { cwd: ROOT, env: { ...process.env, DATABASE_URL: "" } });
  p.stdout.on("data", (d) => out.push(d)); p.stderr.on("data", (d) => out.push(d));
  p.on("close", (code) => { console.log(`process ${i + 1}: ${code === 0 ? "ok" : "FAILED"} (${g.length} files, ${Math.round((Date.now() - t0) / 1000)} s)`); resolve({ code, g, text: Buffer.concat(out).toString() }); });
})));
const bad = results.filter((r) => r.code !== 0);
for (const r of bad) console.log(`\n--- failing process (${r.g.length} files) ---\n${r.text.split("\n").filter((l) => /^not ok|^# (fail|tests)|^\s+(error|failureType|location):/.test(l)).slice(0, 60).join("\n")}`);
console.log(`\nleak check: ${bad.length ? `${bad.length} of ${procs} processes FAILED (repeat with --seed ${seed})` : "clean"}; wall ${Math.round((Date.now() - t0) / 1000)} s`);
process.exit(bad.length ? 1 : 0);
