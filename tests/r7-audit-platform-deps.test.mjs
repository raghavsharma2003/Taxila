// Whole-project audit 2026-11-10, platform (routed STUDIO-12): both images install with `npm ci --omit=dev`, so every
// package a server file imports must be in package.json `dependencies`. server/studio/fixers.js (and the two QA gates)
// imported rolldown, which was installed only as vite's dev dependency: in the image those imports would throw, and a
// live build would fall back to a skeleton without saying why.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { builtinModules } from "node:module";

const ROOT = new URL("..", import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const deps = new Set(Object.keys(pkg.dependencies ?? {}));
const builtins = new Set(builtinModules);

function* files(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    // server/**/eval/* are offline tools the images never load (as in tests/runtime-image-imports.test.mjs)
    if (n === "node_modules" || n === "eval") continue;
    if (statSync(p).isDirectory()) yield* files(p); else if (/\.(m?js|ts)$/.test(n)) yield p;
  }
}
// Browser QA and build tools: they need a Chromium binary or a bundler run, which neither image has. Their files load
// only on a QA runner with its own install (infra/forge-runner/package.json) or offline, never on a request path.
// Moving them into dependencies would not make them run here, so they are named, not installed.
const RUNNER_ONLY = new Set(["playwright", "playwright-core", "vite", "@vitejs/plugin-react"]);
const pkgName = (spec) => (spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);

test("every package a server or shared file imports is a production dependency", () => {
  const bad = [];
  for (const top of ["server", "shared"]) for (const f of files(join(ROOT, top))) {
    const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const m of src.matchAll(/(?:^|\s)(?:import|export)\s[^'"`]*?from\s*["']([^"'.][^"']*)["']|import\(\s*["']([^"'.][^"']*)["']\s*\)/gm)) {
      const spec = m[1] ?? m[2];
      if (spec.startsWith("node:") || builtins.has(spec) || builtins.has(spec.split("/")[0])) continue;
      if (!deps.has(pkgName(spec)) && !RUNNER_ONLY.has(pkgName(spec))) bad.push(`${f.replace(ROOT, "")} -> ${spec}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("rolldown is a production dependency at the version the lockfile resolves", () => {
  const lock = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));
  const entry = lock.packages["node_modules/rolldown"];
  assert.equal(pkg.dependencies.rolldown, entry.version);
  assert.notEqual(entry.dev, true, "the lockfile installs it with --omit=dev");
});
