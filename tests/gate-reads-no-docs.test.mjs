// The gate must not depend on docs/: a doc edit, a moved patch or a deleted research folder must never fail a code gate.
// Whatever a test needs lives in tests/fixtures/ (moved there 2026-11-10, with a one-line pointer left at the old path where
// a doc cites it); a patch file is never asserted on, the code it became is. Two suites stay on the list because they ASSERT
// that serving code never builds a path into docs/ (they name it in a string, they do not read it).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const TESTS = new URL("./", import.meta.url).pathname;
const NAMES_DOCS_ON_PURPOSE = new Set(["r4-content-packaged.test.mjs", "r4-content-serving-files.test.mjs", "gate-reads-no-docs.test.mjs"]);
const DOCS_PATH = /\.\.\/docs\/|\.\.\/\.\.\/docs\/|["'`]docs\/|ROOT ?\+ ?["'`]docs|["'`]docs["'`]\s*,|\bat\(["'`]docs|\bsrc\(["'`]docs|\bread\(["'`]docs/;

function walk(d, out = []) {
  for (const n of readdirSync(d)) {
    const p = join(d, n), st = statSync(p);
    if (st.isDirectory()) { if (n !== "prod" && n !== "e2e") walk(p, out); } // tests/prod and tests/e2e are hand-run harnesses, never the gate
    else if (/\.(mjs|js|ts)$/.test(n) && (/\.test\.mjs$/.test(n) || /\/(fixtures|support)\//.test(p) || n.startsWith("_"))) out.push(p); // the gate: suites + what they load (hand-run e2e-*.mjs scripts are not the gate)
  }
  return out;
}

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
