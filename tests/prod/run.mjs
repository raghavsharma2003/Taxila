// Run the production acceptance battery (BUILD-PLAN §1.7):
//   NODE_USE_ENV_PROXY=1 node tests/prod/run.mjs --wave N [--base URL] [--only substr] [--timeout SEC]
// Runs every tests/prod/w<wave><stream>-*.mjs with wave ≤ N (regression), one child process each, in name order,
// with TAXILA_BASE set. Exits 1 if any file fails or times out. Each file deletes its own test account in a finally.
import { readdirSync } from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const DIR = dirname(fileURLToPath(import.meta.url));
const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt; };
const wave = Number(arg("wave", "1"));
if (!Number.isInteger(wave) || wave < 0) throw new Error("--wave N (an integer ≥ 0)");
const base = arg("base", process.env.TAXILA_BASE || "");
const only = arg("only", "");
const timeoutSec = Number(arg("timeout", "540"));

const files = readdirSync(DIR)
  .map((f) => ({ f, m: f.match(/^w(\d+)[a-z]*-[\w.-]+\.mjs$/) }))
  .filter(({ m, f }) => m && Number(m[1]) <= wave && (!only || f.includes(only)))
  .map(({ f }) => f).sort();
if (!files.length) { console.log(`no prod tests for wave ≤ ${wave}${only ? ` matching "${only}"` : ""}`); process.exit(0); }

const env = { ...process.env, ...(base ? { TAXILA_BASE: base } : {}) };
const outcome = [];
for (const f of files) {
  const t0 = Date.now();
  console.log(`\n━━ ${f}`);
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, [join(DIR, f)], { env, stdio: "inherit" });
    // A file over its time is stopped (SIGTERM, then SIGKILL); its account may then survive: W1-D's sweeper removes it.
    const kill = setTimeout(() => { p.kill("SIGTERM"); setTimeout(() => p.kill("SIGKILL"), 15_000).unref(); }, timeoutSec * 1000);
    p.on("exit", (c, sig) => { clearTimeout(kill); resolve(sig ? `signal ${sig}` : c); });
  });
  outcome.push({ f, code, s: Math.round((Date.now() - t0) / 1000) });
}
console.log("\n━━ summary");
for (const o of outcome) console.log(`${o.code === 0 ? "PASS" : "FAIL"} ${o.f} (${o.s}s${o.code === 0 ? "" : `, exit ${o.code}`})`);
process.exitCode = outcome.every((o) => o.code === 0) ? 0 : 1;
