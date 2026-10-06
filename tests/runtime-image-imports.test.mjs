// The production image (Dockerfile, runtime stage) copies only some top-level dirs. A server import that reaches a
// path the stage does not copy works in every local test and crashes the container at start (2026-10-06: recheck.js
// imported src/…logic.ts, the canary went Failed/Unhealthy). Every static relative import under server/ and shared/
// must resolve inside a copied dir.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const runtime = readFileSync(join(ROOT, "Dockerfile"), "utf8").split(/^FROM /m).at(-1);
const copied = new Set([...runtime.matchAll(/^COPY (?!--from)(\S+) \.\/\S+/gm)].map((m) => m[1].replace(/\/$/, "")));
copied.add("dist"); copied.add("node_modules"); copied.add("package.json");

function* files(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (n === "node_modules" || n === "eval") continue; // server/**/eval/* are offline tools, never loaded by serve.mjs
    if (statSync(p).isDirectory()) yield* files(p); else if (/\.(m?js|ts)$/.test(n)) yield p;
  }
}

test("every relative import under server/ and shared/ resolves inside a dir the runtime image copies", () => {
  const bad = [];
  for (const top of ["server", "shared"]) for (const f of files(join(ROOT, top))) {
    const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const m of src.matchAll(/(?:^|\s)(?:import|export)\s[^'"`]*?from\s*["'](\.{1,2}\/[^"']+)["']|import\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/gm)) {
      const spec = m[1] ?? m[2];
      const target = resolve(dirname(f), spec);
      const rootDir = relative(ROOT, target).split(sep)[0];
      if (!copied.has(rootDir)) bad.push(`${relative(ROOT, f)} -> ${spec} (${rootDir}/ is not copied)`);
      else if (!existsSync(target)) bad.push(`${relative(ROOT, f)} -> ${spec} (missing)`);
    }
  }
  assert.deepEqual(bad, []);
});
