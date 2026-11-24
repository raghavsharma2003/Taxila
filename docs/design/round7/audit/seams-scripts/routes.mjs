// Seams sweep 1: every server route against every client call.
// Run: DATABASE_URL= node docs/design/round7/audit/seams-scripts/routes.mjs [--json]
// Reads server/index.js to find the route modules, imports each, and records which module defines each "METHOD /path"
// (a key defined twice is a collision: the later spread wins). Then greps src/, public/, server/ (server-to-self calls),
// scripts/ and tests/ for "/api/..." literals and template strings, and matches them against the table.
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { pathToFileURL } from "url";

const ROOT = new URL("../../../../../", import.meta.url).pathname;
const idx = readFileSync(join(ROOT, "server/index.js"), "utf8");
const mods = [...idx.matchAll(/import \{ (\w+)(?: as (\w+))? \} from "(\.\/[^"]+)"/g)].map((m) => ({ exp: m[1], alias: m[2] || m[1], file: m[3] }));
const order = (idx.match(/register\(\{([^}]+)\}\)/)?.[1] ?? "").split(",").map((s) => s.replace(/\.\.\./, "").trim()).filter(Boolean);
const table = new Map(); // key -> [module…]
const add = (key, src) => { if (!table.has(key)) table.set(key, []); table.get(key).push(src); };
// router.js's own table
for (const m of readFileSync(join(ROOT, "server/router.js"), "utf8").matchAll(/"((?:GET|POST|PATCH|PUT|DELETE) \/api\/[^"]+)":/g)) add(m[1], "server/router.js");
const loaded = {};
for (const m of mods) {
  try { const mod = await import(pathToFileURL(join(ROOT, "server", m.file))); loaded[m.alias] = { file: `server/${m.file.slice(2)}`, routes: mod[m.exp] }; }
  catch (e) { console.error("import failed", m.file, e.message); }
}
for (const a of order) if (loaded[a]) for (const k of Object.keys(loaded[a].routes || {})) add(k, loaded[a].file);
if (loaded.pair) for (const k of Object.keys(loaded.pair.routes || {})) add(k, loaded.pair.file);

const walk = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (f === "node_modules" || f.startsWith(".")) continue; const s = statSync(p); if (s.isDirectory()) walk(p, out); else if (/\.(m?js|tsx?|html)$/.test(f)) out.push(p); } return out; };
const callers = new Map(); // normalised path -> [file:line]
for (const dir of ["src", "public", "server", "scripts", "tests", "shared", "api", "evals"]) {
  let files = []; try { files = walk(join(ROOT, dir)); } catch { continue; }
  for (const f of files) {
    if (f.includes("/public/assets/") || f.endsWith(".min.js")) continue;
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((ln, i) => {
      for (const m of ln.matchAll(/["'`](\/api\/[A-Za-z0-9_\-/${}.:?=&]*)/g)) {
        let p = m[1].split("?")[0].replace(/\$\{[^}]*\}/g, ":x").replace(/\/+$/, "");
        if (!p || p === "/api") continue;
        const k = p; if (!callers.has(k)) callers.set(k, []); callers.get(k).push(`${relative(ROOT, f)}:${i + 1}`);
      }
    });
  }
}
const paths = new Map(); for (const k of table.keys()) { const p = k.split(" ")[1]; if (!paths.has(p)) paths.set(p, []); paths.get(p).push(k); }
const matchesRoute = (p) => paths.has(p) || [...paths.keys()].some((r) => p.endsWith(":x") && r.startsWith(p.slice(0, -2)));
const out = { collisions: [], deadRoutes: [], missing: [] };
for (const [k, srcs] of table) if (srcs.length > 1) out.collisions.push({ key: k, modules: srcs });
for (const [p, keys] of paths) {
  const refs = (callers.get(p) || []).concat([...callers.entries()].filter(([c]) => c !== p && c.endsWith(":x") && p.startsWith(c.slice(0, -2))).flatMap(([, v]) => v));
  const live = refs.filter((r) => /^(src|public|api)\//.test(r));
  const other = refs.filter((r) => !/^(src|public|api)\//.test(r) && !r.startsWith(table.get(keys[0])[0]));
  if (!live.length) out.deadRoutes.push({ keys, defined: table.get(keys[0]), nonClientRefs: other.slice(0, 6), nonClientCount: other.length });
}
for (const [p, refs] of callers) {
  const live = refs.filter((r) => /^(src|public)\//.test(r));
  if (live.length && !matchesRoute(p)) out.missing.push({ path: p, refs: live.slice(0, 6) });
}
out.total = table.size;
if (process.argv.includes("--keys")) { console.log(JSON.stringify([...table.keys()])); process.exit(0); }
if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 1));
else {
  console.log(`routes registered: ${table.size}`);
  console.log(`\n== collisions (${out.collisions.length})`); for (const c of out.collisions) console.log(c.key, c.modules.join(" , "));
  console.log(`\n== routes no client file (src/, public/) names (${out.deadRoutes.length})`); for (const d of out.deadRoutes) console.log(d.keys.join(" | "), " <-", d.defined.join(","), " other refs:", d.nonClientCount, d.nonClientRefs.slice(0, 3).join(" "));
  console.log(`\n== client paths with no route (${out.missing.length})`); for (const m of out.missing) console.log(m.path, " <-", m.refs.join(" "));
}
process.exit(0);
