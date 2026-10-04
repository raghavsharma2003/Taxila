// Run the five OWNER TEST 2026-10-04 experience acceptance tests (owner items 1-5), one child process each, in order,
// against one base URL; every other flag is passed through (--seed, --judge model, --no-browser, --lanes, …).
//   NODE_USE_ENV_PROXY=1 node tests/prod/_owner-all.mjs [--base https://taxila.dev] [--only 3] [...]
// All five write their transcripts into ONE results dir (evals/owner-truth/results/acceptance-<stamp>/). Exit 1 if any
// test fails. Each test deletes its own @taxila.test account in a finally. (Underscore name: run.mjs's w<wave>-*.mjs
// pattern never picks these up, and node --test never matches them.)
import { readdirSync } from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const DIR = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const only = (() => { const i = argv.indexOf("--only"); return i >= 0 ? argv[i + 1] : null; })();
const pass = argv.filter((a, i) => a !== "--only" && argv[i - 1] !== "--only");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
if (!pass.includes("--out")) pass.push("--out", join(DIR, "..", "..", "evals", "owner-truth", "results", `acceptance-${stamp}`));
const files = readdirSync(DIR).filter((f) => /^owner-\d-[\w-]+\.mjs$/.test(f) && (!only || f.startsWith(`owner-${only}-`))).sort();
const outcome = [];
for (const f of files) {
  const t0 = Date.now();
  console.log(`\n━━ ${f}`);
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, [join(DIR, f), ...pass], { env: process.env, stdio: "inherit" });
    const kill = setTimeout(() => { p.kill("SIGTERM"); setTimeout(() => p.kill("SIGKILL"), 15_000).unref(); }, 45 * 60_000);
    p.on("exit", (c, sig) => { clearTimeout(kill); resolve(sig ? `signal ${sig}` : c); });
  });
  outcome.push({ f, code, s: Math.round((Date.now() - t0) / 1000) });
}
console.log("\n━━ owner acceptance summary");
for (const o of outcome) console.log(`${o.code === 0 ? "PASS" : "FAIL"} ${o.f} (${o.s}s${o.code === 0 ? "" : `, exit ${o.code}`})`);
process.exitCode = outcome.length && outcome.every((o) => o.code === 0) ? 0 : 1;
