// Seams sweep 3: the import graph of server/, src/, shared/, api/ (product code), with every other tree counted as an
// importer: scripts/, tests/, evals/, infra/, docs/ (gate tests import code from docs/).
// Entry points: server/serve.mjs, server/worker.mjs, api/[...route].js, index.html, modules.html, Dockerfiles' CMD, package.json
// scripts, .github/workflows and infra/** commands. Static imports, `export … from`, literal dynamic import(), `new Worker(new URL(…))`,
// `new URL("…", import.meta.url)` and import.meta.glob patterns are followed.
// Run: node docs/design/round7/audit/seams-scripts/imports.mjs [--json]
// Prints, for product files: (a) unreachable from any product entry and imported by nothing, (b) unreachable from product
// entries but imported by tests/scripts/evals only (the "test-only" files), each with its importers.
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, dirname, resolve } from "path";
const ROOT = resolve(new URL("../../../../../", import.meta.url).pathname);
const SKIP = new Set(["node_modules", "dist", ".git"]);
const walk = (d, out = []) => { if (!existsSync(d)) return out; for (const f of readdirSync(d)) { if (SKIP.has(f)) continue; const p = join(d, f); const s = statSync(p); if (s.isDirectory()) walk(p, out); else if (/\.(m?js|tsx?|cjs|html)$/.test(f) && !/\.d\.ts$/.test(f)) out.push(p); } return out; };
const PRODUCT = ["server", "src", "shared", "api"];
const OTHER = ["scripts", "tests", "evals", "infra", "docs", "public", "prototypes"];
const files = [...PRODUCT, ...OTHER].flatMap((d) => walk(join(ROOT, d))).concat([join(ROOT, "index.html"), join(ROOT, "modules.html"), join(ROOT, "vite.config.ts")].filter(existsSync));
const fileSet = new Set(files);
const EXT = ["", ".ts", ".tsx", ".js", ".mjs", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.mjs"];
const resolveSpec = (from, spec) => {
  if (!spec.startsWith(".") && !spec.startsWith("/")) return null;
  const base = spec.startsWith("/") ? join(ROOT, spec) : resolve(dirname(from), spec);
  for (const e of EXT) { const p = base + e; if (fileSet.has(p)) return p; }
  // .js specifier that points at a .ts file
  const ts = base.replace(/\.js$/, ".ts"); if (fileSet.has(ts)) return ts;
  const tsx = base.replace(/\.js$/, ".tsx"); if (fileSet.has(tsx)) return tsx;
  return null;
};
const edges = new Map(); // file -> Set(file)
const globs = [];
for (const f of files) {
  const t = readFileSync(f, "utf8"); const out = new Set();
  const specs = [
    ...[...t.matchAll(/(?:^|[\s;])(?:import|export)\s+(?:[\w*{}\s,$]+?\s+from\s+)?["']([^"']+)["']/gm)].map((m) => m[1]),
    ...[...t.matchAll(/import\(\s*["'`]([^"'`$]+)["'`]\s*\)/g)].map((m) => m[1]),
    ...[...t.matchAll(/new URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url/g)].map((m) => m[1]),
    ...[...t.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]),
  ];
  for (const s of specs) { const p = resolveSpec(f, s.replace(/\?[\w&=]+$/, "")); if (p) out.add(p); }
  for (const m of t.matchAll(/import\.meta\.glob(?:<[^(]*>)?\(\s*\[?\s*["']([^"']+)["']/g)) globs.push({ from: f, pat: m[1] });
  // template dynamic imports: import(`./engines/${x}.ts`) → every file in that directory
  for (const m of t.matchAll(/import\(\s*`(\.[^`$]*)\$\{[^`]*`\s*\)/g)) { const dir = resolve(dirname(f), m[1].replace(/[^/]*$/, "")); for (const g of files) if (g.startsWith(dir + "/")) out.add(g); }
  edges.set(f, out);
}
for (const g of globs) { const re = new RegExp("^" + resolve(dirname(g.from), g.pat.replace(/\*\*\//g, "§").replace(/\*/g, "¤")).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/§/g, "(?:.*/)?").replace(/¤/g, "[^/]*") + "$"); for (const f of files) if (re.test(f)) edges.get(g.from).add(f); }
// entries
const entries = new Set(["server/serve.mjs", "server/worker.mjs", "api/[...route].js", "index.html", "modules.html", "vite.config.ts"].map((p) => join(ROOT, p)).filter(existsSync));
const cmdText = [readFileSync(join(ROOT, "package.json"), "utf8"), ...["Dockerfile", "Dockerfile.worker"].map((p) => readFileSync(join(ROOT, p), "utf8")), ...walk(join(ROOT, ".github")).map((p) => readFileSync(p, "utf8")),
  // jobs and images started by infra/ and the deploy scripts: "node server/x.mjs" style command lines only
  ...[...walk(join(ROOT, "infra")), ...readdirSync(join(ROOT, "scripts")).filter((f) => /^(deploy|release|m3|forge-g2-deploy)/.test(f)).map((f) => join(ROOT, "scripts", f))].map((p) => (readFileSync(p, "utf8").match(/node["',\s\]]+[\w./-]+\.m?js/g) || []).join("\n")),
  ...walk(join(ROOT, "infra")).filter((p) => /Dockerfile/.test(p)).map((p) => readFileSync(p, "utf8"))].join("\n");
for (const f of files) { const r = relative(ROOT, f); if (PRODUCT.some((d) => r.startsWith(d + "/")) && cmdText.includes(r)) entries.add(f); }
// vite rollup inputs (html files listed in vite.config.ts)
for (const m of readFileSync(join(ROOT, "vite.config.ts"), "utf8").matchAll(/["']([\w./-]+\.html)["']/g)) { const p = join(ROOT, m[1]); if (existsSync(p)) entries.add(p); }
const reach = (starts) => { const seen = new Set(); const st = [...starts]; while (st.length) { const f = st.pop(); if (seen.has(f)) continue; seen.add(f); for (const n of edges.get(f) ?? []) st.push(n); } return seen; };
const live = reach(entries);
const importers = new Map(); for (const [f, outs] of edges) for (const o of outs) { if (!importers.has(o)) importers.set(o, new Set()); importers.get(o).add(f); }
const rel = (f) => relative(ROOT, f);
const isProduct = (f) => PRODUCT.some((d) => rel(f).startsWith(d + "/"));
const unreached = files.filter((f) => isProduct(f) && !live.has(f) && !/\.html$/.test(f));
const orphan = [], testOnly = [];
for (const f of unreached) {
  const imps = [...(importers.get(f) ?? [])].map(rel);
  const nonDead = imps.filter((i) => !unreached.includes(join(ROOT, i)));
  if (!imps.length) orphan.push({ file: rel(f) });
  else testOnly.push({ file: rel(f), importers: imps });
}
const out = { entries: [...entries].map(rel), productFiles: files.filter(isProduct).length, live: [...live].filter(isProduct).length, orphan, testOnly };
if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 1));
else {
  console.log(`product files ${out.productFiles}; reachable from an entry ${out.live}; not reachable ${unreached.length}`);
  console.log(`\n== imported by nothing at all (${orphan.length})`); for (const o of orphan) console.log(o.file);
  console.log(`\n== not reachable from the product; imported only by tests/scripts/evals/docs or by other unreachable files (${testOnly.length})`);
  for (const o of testOnly) console.log(o.file, "  <-", o.importers.slice(0, 4).join(" "), o.importers.length > 4 ? `(+${o.importers.length - 4})` : "");
}
