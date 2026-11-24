// Seams sweep 6: the same job in two places. Lists exported function/const names defined in two or more product files
// (server/, src/, shared/), skipping generic names. Each hit is a lead (two files may name different jobs alike).
// Run: node docs/design/round7/audit/seams-scripts/twins.mjs [minFiles]
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
const ROOT = new URL("../../../../../", import.meta.url).pathname;
const walk = (d, out = []) => { for (const f of readdirSync(d)) { if (f === "node_modules" || f === "dev" || f === "tools") continue; const p = join(d, f); const s = statSync(p); if (s.isDirectory()) walk(p, out); else if (/\.(m?js|tsx?)$/.test(f) && !/\.test\.|\.d\.ts$/.test(f)) out.push(p); } return out; };
const GENERIC = new Set(["routes", "default", "init", "reset", "start", "stop", "run", "main", "handler", "config", "state", "render", "update", "create", "load", "get", "set", "clamp", "sleep", "now", "COPY", "copy", "t", "emit", "send", "read", "write", "close", "open"]);
const defs = new Map();
for (const f of ["server", "src", "shared"].flatMap((d) => walk(join(ROOT, d)))) {
  const t = readFileSync(f, "utf8");
  for (const m of t.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let)\s+([A-Za-z_$][\w$]*)/gm)) {
    if (GENERIC.has(m[1]) || m[1].length < 4) continue;
    if (!defs.has(m[1])) defs.set(m[1], []); defs.get(m[1]).push(relative(ROOT, f));
  }
}
const min = Number(process.argv[2] || 2);
const rows = [...defs].filter(([, fs]) => new Set(fs).size >= min).sort((a, b) => b[1].length - a[1].length);
for (const [n, fs] of rows) console.log(`${n.padEnd(30)} ${fs.join("  ")}`);
console.error(`${rows.length} names defined in ${min}+ files`);
