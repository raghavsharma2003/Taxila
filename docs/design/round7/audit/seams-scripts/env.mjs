// Seams sweep 2: every environment variable the code reads, where it is set, and a hint of its default.
// Run: node docs/design/round7/audit/seams-scripts/env.mjs [--json] [--only-unset]
// Reads: process.env.X, process.env["X"], env.X / env["X"] (functions that take env = process.env), import.meta.env.X,
// and string literals passed to the common flag helpers (flagOn("X"), envFlag("X"), …).
// Set in: Dockerfile*, infra/**, scripts/deploy-*.mjs, scripts/release*.mjs, scripts/handoff/keys.json, .github/workflows,
// vite.config.ts, tests (marked separately: a test setting a name does not set it in production).
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
const ROOT = new URL("../../../../../", import.meta.url).pathname;
const walk = (d, out = []) => { if (!existsSync(d)) return out; for (const f of readdirSync(d)) { const p = join(d, f); if (f === "node_modules" || f === "dist") continue; const s = statSync(p); if (s.isDirectory()) walk(p, out); else if (/\.(m?js|tsx?|cjs|json|ya?ml|sh|bicep|py)$|^Dockerfile/.test(f)) out.push(p); } return out; };
const reads = new Map();
const note = (name, where, line) => { if (!/^[A-Z][A-Z0-9_]{2,}$/.test(name)) return; if (!reads.has(name)) reads.set(name, { reads: [], defaults: new Set(), set: [], testSet: [] }); const r = reads.get(name); r.reads.push(where); const d = line.match(new RegExp(`${name}\\b["'\\]]*\\s*(\\?\\?|\\|\\|)\\s*("[^"]*"|'[^']*'|[\\w.]+)`)); if (d) r.defaults.add(d[2]); const c = line.match(new RegExp(`${name}\\b["'\\]]*\\s*(===|!==|==|!=)\\s*("[^"]*"|'[^']*')`)); if (c) r.defaults.add(`${c[1]}${c[2]}`); };
const SRC = ["server", "src", "shared", "api", "scripts", "infra", "vite.config.ts"];
for (const d of SRC) {
  const files = d.endsWith(".ts") ? [join(ROOT, d)] : walk(join(ROOT, d));
  for (const f of files) {
    if (!/\.(m?js|tsx?|cjs)$/.test(f)) continue;
    const rel = relative(ROOT, f);
    readFileSync(f, "utf8").split("\n").forEach((ln, i) => {
      for (const m of ln.matchAll(/(?:process\.env|import\.meta\.env|\benv)(?:\.([A-Z][A-Z0-9_]+)|\[["']([A-Z][A-Z0-9_]+)["']\])/g)) note(m[1] || m[2], `${rel}:${i + 1}`, ln);
      for (const m of ln.matchAll(/\b(?:flagOn|envFlag|envOn|envBool|envNum|envInt|flag|readFlag|onFor|cohort|envList|num|bool)\(\s*["']([A-Z][A-Z0-9_]{3,})["']/g)) note(m[1], `${rel}:${i + 1}`, ln);
    });
  }
}
// where names are set
const SETTERS = [...walk(join(ROOT, "infra")), ...walk(join(ROOT, ".github")), join(ROOT, "Dockerfile"), join(ROOT, "Dockerfile.worker"), join(ROOT, "vite.config.ts"), join(ROOT, "scripts/handoff/keys.json"),
  ...readdirSync(join(ROOT, "scripts")).filter((f) => /^(deploy|release|region)/.test(f)).map((f) => join(ROOT, "scripts", f)).filter((p) => statSync(p).isFile()), ...walk(join(ROOT, "scripts/region"))].filter(existsSync);
const setterText = SETTERS.map((p) => [relative(ROOT, p), readFileSync(p, "utf8")]);
const testText = walk(join(ROOT, "tests")).map((p) => [relative(ROOT, p), readFileSync(p, "utf8")]);
for (const [name, r] of reads) {
  for (const [p, t] of setterText) if (new RegExp(`\\b${name}\\b`).test(t)) r.set.push(p);
  for (const [p, t] of testText) if (new RegExp(`\\b${name}\\b`).test(t)) r.testSet.push(p);
}
const rows = [...reads].map(([name, r]) => ({ name, nReads: r.reads.length, first: r.reads[0], readers: [...new Set(r.reads.map((x) => x.split(":")[0]))].length, defaults: [...r.defaults], setIn: [...new Set(r.set)].filter((s) => !r.reads.some((x) => x.startsWith(s + ":"))), inTests: r.testSet.length }))
  .sort((a, b) => a.name.localeCompare(b.name));
const only = process.argv.includes("--only-unset");
if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 1));
else for (const r of rows) if (!only || !r.setIn.length) console.log(`${r.name.padEnd(40)} reads=${String(r.nReads).padEnd(3)} first=${r.first.padEnd(48)} default=${r.defaults.join(" ").slice(0, 60).padEnd(20)} set=${r.setIn.join(",").slice(0, 80) || "-"} tests=${r.inTests}`);
console.error(`\n${rows.length} names read; ${rows.filter((r) => !r.setIn.length).length} set in no deploy/infra/CI/Docker file`);
