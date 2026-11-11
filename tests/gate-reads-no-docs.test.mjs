// The gate must not depend on docs/: a doc edit, a moved patch or a deleted research folder must never fail a code gate.
// Whatever a test needs lives in tests/fixtures/ (moved there 2026-11-10, with a one-line pointer left at the old path where
// a doc cites it); a patch file is never asserted on, the code it became is. Two suites stay on the list because they ASSERT
// that serving code never builds a path into docs/ (they name it in a string, they do not read it).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const TESTS = new URL("./", import.meta.url).pathname;
// r7-audit-docs.test.mjs is the one suite whose subject IS the docs: it checks that the entry pages (HANDOFF, CLAUDE.md, the
// round-7 pages, OWNERSHIP) agree with the repo, so it has to read them (main, integration 22).
const NAMES_DOCS_ON_PURPOSE = new Set(["r4-content-packaged.test.mjs", "r4-content-serving-files.test.mjs", "gate-reads-no-docs.test.mjs", "r7-audit-docs.test.mjs"]);
const DOCS_PATH = /\.\.\/docs\/|\.\.\/\.\.\/docs\/|["'`]docs\/|ROOT ?\+ ?["'`]docs|["'`]docs["'`]\s*,|\bat\(["'`]docs|\bsrc\(["'`]docs|\bread\(["'`]docs/;

function walk(d, out = []) {
  for (const n of readdirSync(d)) {
    const p = join(d, n), st = statSync(p);
    if (st.isDirectory()) { if (n !== "prod" && n !== "e2e") walk(p, out); } // tests/prod and tests/e2e are hand-run harnesses, never the gate
    else if (/\.(mjs|js|ts)$/.test(n) && (/\.test\.mjs$/.test(n) || /\/(fixtures|support)\//.test(p) || n.startsWith("_"))) out.push(p); // the gate: suites + what they load (hand-run e2e-*.mjs scripts are not the gate)
  }
  return out;
}

// A patch file is never the subject of a gate test: not read, not `git apply --check`ed (main, integration 22: the path and the
// apply call can sit on different lines, so this looks at the whole file, not line by line).
const PATCH_APPLY = /docs\/patches|\bgit\b[\s\S]{0,200}["'`]apply["'`]|\bexecFileSync\([^)]*["'`]apply["'`]/;
const APPLIES_PATCHES_ON_PURPOSE = new Set([]);

test("no gate test applies or asserts on a patch file", () => {
  const hits = [];
  for (const f of walk(TESTS)) {
    const name = f.split("/").pop();
    if (NAMES_DOCS_ON_PURPOSE.has(name) || APPLIES_PATCHES_ON_PURPOSE.has(name)) continue;
    const body = readFileSync(f, "utf8").split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    if (PATCH_APPLY.test(body)) hits.push(f.slice(TESTS.length));
  }
  assert.deepEqual(hits, [], "assert on the code the patch became; a patch file is not gate material");
});

// Result folders of finished experiments are evidence, not gate material: what a test needs is copied into tests/fixtures/eval-results/
// (TE-06), so a results folder can be moved or deleted without failing the gate. (Eval CODE under evals/ may still be imported.)
const EVAL_RESULTS = /evals\/[\w.-]+\/(results|out)\/|evals\/results\//;
test("no gate test reads an evals/*/results (or out) folder", () => {
  const hits = [];
  for (const f of walk(TESTS)) {
    if (/gate-reads-no-docs\.test\.mjs$/.test(f)) continue;
    readFileSync(f, "utf8").split("\n").forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      if (EVAL_RESULTS.test(line.replace(/\s\/\/.*$/, ""))) hits.push(`${f.slice(TESTS.length)}:${i + 1}: ${line.trim().slice(0, 110)}`);
    });
  }
  assert.deepEqual(hits, [], "copy what the test reads into tests/fixtures/eval-results/");
});

test("no gate test or fixture reads from docs/", () => {
  const hits = [];
  for (const f of walk(TESTS)) {
    if (NAMES_DOCS_ON_PURPOSE.has(f.split("/").pop())) continue;
    readFileSync(f, "utf8").split("\n").forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      const code = line.replace(/\s\/\/.*$/, "");
      if (DOCS_PATH.test(code)) hits.push(`${f.slice(TESTS.length)}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  assert.deepEqual(hits, [], "move what the test reads into tests/fixtures/, or assert on the code instead of a patch or doc");
});
