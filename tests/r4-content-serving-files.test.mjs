// Round 4 content (the 0c90ebb rollback, 2026-10-10): nothing the SERVING path reaches may read a file the production image
// does not hold. The image holds server/, shared/, data/, src/, dist/ (Dockerfile) and the worker image server/, shared/,
// data/, db/migrations/; docs/, evals/, tests/, context/, scripts/ are never there (.dockerignore / not copied).
// The tray gate read docs/design/round4/build/box-contract.json and every Studio slot failed on taxila.dev.
//
// The serving path = every module reachable from server/serve.mjs and server/worker.mjs through static imports and
// literal dynamic import("…") calls. For each: (1) no import resolves outside the image's directories; (2) no literal path
// built with path.join / path.resolve / new URL names a docs, evals, tests, context or scripts directory. Offline tools
// (certify-tray.js, report evals) are fine as long as the server never imports them.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHIPPED = ["server", "shared", "data", "src", "dist", "node_modules", "db"];
const NEVER = ["docs", "evals", "tests", "context", "scripts"];
const ENTRIES = ["server/serve.mjs", "server/worker.mjs"];

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
function importsOf(file) {
  const src = stripComments(fs.readFileSync(file, "utf8"));
  const out = [];
  for (const m of src.matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?\sfrom\s*["']([^"']+)["']/g)) out.push(m[1]);
  for (const m of src.matchAll(/(?:^|\n)\s*import\s*["']([^"']+)["']/g)) out.push(m[1]);
  for (const m of src.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) out.push(m[1]);
  return out.filter((s) => s.startsWith("."));
}
function resolveImport(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, `${base}.js`, `${base}.mjs`, `${base}.ts`, `${base}.tsx`, path.join(base, "index.js")]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return base;
}
function servingGraph() {
  const seen = new Map();   // file → importer
  const todo = ENTRIES.map((e) => [path.join(ROOT, e), null]);
  while (todo.length) {
    const [f, by] = todo.pop();
    if (seen.has(f)) continue;
    seen.set(f, by);
    if (!fs.existsSync(f) || !/\.(m?js|tsx?)$/.test(f)) continue;
    for (const spec of importsOf(f)) todo.push([resolveImport(f, spec), f]);
  }
  return seen;
}
const rel = (f) => path.relative(ROOT, f);

describe("r4 content: the serving path reads only what the production image holds", () => {
  const graph = servingGraph();
  it("the graph is the real one (the tray gate, the seam and the router are in it)", () => {
    const files = [...graph.keys()].map(rel);
    for (const f of ["server/forge3/tray-gate.js", "server/studio/seam.js", "server/router.js"]) assert.ok(files.includes(f), `${f} reachable`);
  });
  it("no module on the serving path is imported from outside the image's directories", () => {
    const bad = [...graph].filter(([f]) => !SHIPPED.includes(rel(f).split(path.sep)[0])).map(([f, by]) => `${rel(f)} (imported by ${by ? rel(by) : "entry"})`);
    assert.deepEqual(bad, []);
  });
  it("no module on the serving path builds a path into docs/, evals/, tests/, context/ or scripts/", () => {
    const bad = [];
    const dirRe = new RegExp(`["'\`](?:\\.\\.?/)*(?:${NEVER.join("|")})(?:/|["'\`])`);
    for (const f of graph.keys()) {
      if (!fs.existsSync(f) || !/\.(m?js|tsx?)$/.test(f)) continue;
      const src = stripComments(fs.readFileSync(f, "utf8"));
      for (const m of src.matchAll(/(?:path\.(?:join|resolve)|join|resolve|new URL)\(([^)]*)\)/g)) if (dirRe.test(m[1])) bad.push(`${rel(f)}: ${m[0].slice(0, 120)}`);
    }
    assert.deepEqual(bad, []);
  });
  it("the guard is not blind: the pre-fix tray gate line would be caught", () => {
    const line = 'export const CONTRACT_FILE = path.join(ROOT, "docs", "design", "round4", "build", "box-contract.json");';
    const dirRe = new RegExp(`["'\`](?:\\.\\.?/)*(?:${NEVER.join("|")})(?:/|["'\`])`);
    const m = line.match(/path\.join\(([^)]*)\)/);
    assert.ok(m && dirRe.test(m[1]));
  });
});
