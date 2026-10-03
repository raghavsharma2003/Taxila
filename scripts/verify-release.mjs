// One command that decides whether a build is shippable (port of html-portfolio scripts/verify-release.mjs;
// harvest port task 1). "Verified" means this list, run in this order, with EVERY failure printed together
// rather than the run stopping at the first one. The verdict is the exit code — never read it from the tail
// of a pipe (`| tail` returns tail's status, which is how a red build reads green).
//
//   node scripts/verify-release.mjs                    → static gates
//   node scripts/verify-release.mjs --live <base-url>  → also probe production (costs a few cents of Azure AI)
//   node scripts/verify-release.mjs --only a,b         → just the named gates (by id; for iterating, not release)
//
// Skips are red: a test that skips is a check that did not run, and a skipped gate that looks like a passed
// gate is how a guard goes dead unnoticed. The only skips allowed are the named ones in KNOWN_SKIPS, each with
// the reason it cannot run here; an unknown skip fails the release.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const run = promisify(execFile);
const ROOT = new URL("..", import.meta.url).pathname;
const args = process.argv.slice(2);
const liveAt = args.includes("--live") ? args[args.indexOf("--live") + 1] : null;
const only = args.includes("--only") ? new Set(args[args.indexOf("--only") + 1].split(",")) : null;

/** Named, reasoned skips npm test may report. Anything else that skips fails the release. */
export const KNOWN_SKIPS = [
  [/learner writer on Neon # SKIP no TEST_DATABASE_URL/, "learner DB suite needs TEST_DATABASE_URL (a Neon branch)"],
  [/^ok \d+ - browser: .* # SKIP set VOICE_BROWSER=1/, "Chromium voice-feature suite is opt-in (VOICE_BROWSER=1)"],
];

/**
 * The gates, in order. vite build runs before npm test because tests/engines-browser reads dist/.
 * Each: [id, title, cmd, args, opts]. Exported so tests/verify-release.test.mjs can check the list itself.
 */
export const GATES = [
  ["typecheck", "tsc -b (vite exits 0 with type errors)", "npx", ["tsc", "-b"]],
  ["prompt-budget", "worst-case compiles fit; the gate throws, never truncates", "node", ["scripts/check-prompt-budget.mjs"]],
  ["kit-budget", "every kit item compiles on every lane, language, band", "node", ["--test", "tests/kit-budget.test.mjs"]],
  ["persona-invariants", "floor invariants on every character × lane, with negative controls", "node", ["evals/persona-invariants.mjs"]],
  ["never-rules", "teacher-output NEVER predicate: red-team table + coded corpus", "node", ["evals/never-rules.mjs"]],
  ["pii", "scrubPii: refuting shapes, Devanagari, answers untouched", "node", ["evals/pii.mjs"]],
  ["spoken", "spoken renderer keeps content (mustSay control)", "node", ["evals/spoken-preserve.mjs"]],
  ["context", "context graph validates", "node", ["scripts/context.mjs", "--check"]],
  ["web-build", "vite build", "npx", ["vite", "build"]],
  ["npm-test", "npm test (node:test over tests/)", "npm", ["test"], { tap: true }],
];

const results = [];
const openTodos = [];
const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ok  " : "FAIL  "}${name.padEnd(20)} ${detail ?? ""}`);
};
const tailOf = (s, n = 15) => String(s).trim().split("\n").slice(-n).join("\n      ");

/**
 * npm test's TAP: count and name every skip (an unknown one is red) and every TODO. A TODO is not red — it marks
 * a guard whose producer is another workstream's file — but it is always printed and counted in the verdict
 * line, so a green release can never hide an unwired guard (2026-10-03 review: the lesson.js floorViolations
 * TODO was invisible in "all 10 gates passed").
 */
export function tapVerdict(out) {
  const tests = /^# tests (\d+)/m.exec(out)?.[1], pass = /^# pass (\d+)/m.exec(out)?.[1], failN = /^# fail (\d+)/m.exec(out)?.[1];
  const skips = out.split("\n").filter((l) => /^\s*ok \d+ - .*# SKIP/.test(l)).map((l) => l.trim());
  const unknown = skips.filter((l) => !KNOWN_SKIPS.some(([re]) => re.test(l)));
  const todos = out.split("\n").filter((l) => /^\s*(?:not )?ok \d+ - .*# TODO/.test(l)).map((l) => l.trim());
  const fails = out.split("\n").filter((l) => /^not ok \d+/.test(l) && !/# TODO/.test(l));
  return { tests: +tests, pass: +pass, fail: +failN, skips, unknown, todos, fails };
}

async function gate([id, title, cmd, cmdArgs, opts = {}]) {
  if (only && !only.has(id)) return;
  const t0 = Date.now();
  try {
    const { stdout, stderr } = await run(cmd, cmdArgs, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: "0" } });
    const ms = `${((Date.now() - t0) / 1000).toFixed(1)}s`;
    if (opts.tap) {
      const v = tapVerdict(stdout + stderr);
      for (const s of v.skips) console.log(`      skip: ${s.replace(/^ok \d+ - /, "")}${v.unknown.includes(s) ? "   ← UNKNOWN SKIP" : ""}`);
      for (const t of v.todos) console.log(`      todo: ${t.replace(/^(?:not )?ok \d+ - /, "")}`);
      openTodos.push(...v.todos.map((t) => t.replace(/^(?:not )?ok \d+ - /, "")));
      const ok = v.fail === 0 && v.unknown.length === 0 && v.tests > 0;
      return record(id, ok, `${ms} · ${v.pass}/${v.tests} pass · ${v.skips.length} skipped (${v.skips.length - v.unknown.length} known) · ${v.todos.length} TODO${v.unknown.length ? ` · ${v.unknown.length} UNKNOWN skip(s) count as red` : ""}`);
    }
    const summary = String(stdout).trim().split("\n").filter((l) => /PASS$|PASS:|PASS |all |worst|ALL /.test(l)).slice(-1)[0] ?? "";
    record(id, true, `${ms}${summary ? ` · ${summary.trim().slice(0, 90)}` : ""}`);
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
    if (opts.tap) {
      const v = tapVerdict(out);
      for (const t of v.todos) console.log(`      todo: ${t.replace(/^(?:not )?ok \d+ - /, "")}`);
      for (const f of v.fails.slice(0, 15)) console.log(`      ${f}`);
      return record(id, false, `${v.fail} failing of ${v.tests}\n      ${tailOf(out.split("\n").filter((l) => !/^\s*(ok|#)/.test(l)).join("\n"), 12)}`);
    }
    record(id, false, `exit ${e.code ?? "?"}${e.signal ? ` (${e.signal})` : ""}\n      ${tailOf(out)}`);
  }
}

async function main() {
if (args.includes("--live") && !/^https?:\/\//.test(liveAt ?? "")) { console.error("--live needs a base url"); process.exit(2); }
console.log(`── static gates (${GATES.length}) ──`);
for (const g of GATES) await gate(g);

if (liveAt) {
  const base = liveAt.replace(/\/$/, "");
  console.log(`\n── live gates against ${base} ──`);
  // Network from this container needs the proxy env; the children get it whatever the parent was started with.
  const env = { ...process.env, NODE_USE_ENV_PROXY: "1" };
  const live = async (id, cmdArgs) => {
    if (only && !only.has(id)) return;
    const t0 = Date.now();
    try {
      const { stdout } = await run("node", cmdArgs, { cwd: ROOT, env, maxBuffer: 64 * 1024 * 1024, timeout: 240_000 });
      for (const l of stdout.split("\n").filter((x) => /^(PASS|FAIL|WARN)/.test(x))) console.log(`      ${l}`);
      record(id, true, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } catch (e) {
      for (const l of String(e.stdout ?? "").split("\n").filter((x) => /^(PASS|FAIL|WARN)/.test(x))) console.log(`      ${l}`);
      record(id, false, `exit ${e.code ?? "?"}\n      ${tailOf(`${e.stdout ?? ""}${e.stderr ?? ""}`, 10)}`);
    }
  };
  await live("live-probes", ["scripts/live-probes.mjs", base]);
  await live("prod-smoke", ["scripts/prod-smoke.mjs", base, "text"]);
}

const failed = results.filter((r) => !r.ok);
console.log(failed.length
  ? `\n${failed.length} of ${results.length} gates FAILED — not shippable:\n${failed.map((f) => `  - ${f.name}`).join("\n")}`
  : `\nall ${results.length} gates passed${only ? ` (--only ${[...only].join(",")}: NOT a release verdict)` : liveAt ? " (static + live)" : " (static; production not probed — pass --live <base-url>)"}`);
if (openTodos.length) console.log(`${openTodos.length} TODO(s) open (not red, not done):\n${openTodos.map((t) => `  - ${t}`).join("\n")}`);
process.exitCode = failed.length ? 1 : 0;
}

// Importable (tests read GATES / KNOWN_SKIPS / tapVerdict); runs only as the entry point.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
