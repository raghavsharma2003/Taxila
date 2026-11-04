// Round 7, stream G (platform-gate-speed follow-up, main 2026-11-04): `npm test` (tests/index.js) imports every suite into
// ONE process, while the CI shards (scripts/test-shard.mjs) run each suite in its OWN process. A suite that writes
// process.env or a global at MODULE level therefore changes every other suite under npm test and nothing in CI, so the
// two gates can disagree (integration 3, int/r6 5a5b2f45: 4 Brain tests red under npm test, green in the shards, because
// 8 older files set TAXILA_R7_PARK_TOPIC / _BYE_CHECKIN = "off" at the top). In one process a restore in after() does
// not help either: node:test runs a file's tests while later files are still being imported.
//
// The rule: tests/*.test.mjs never write process.env or globalThis at module level (column 0). Set what a test needs
// inside the test / before() and restore it after, or pass an env object to the code under test. A line that truly must
// run at import and is harmless to every other suite carries `// one-process-safe: <why>` on the same line.
//
// RATCHET: KNOWN_DEBT lists the offenders present when this check landed. They do not fail the check; any NEW offender
// does. Fixing one needs no edit here (a fixed entry is just no longer found), and the list is pruned at the next pass.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";

const DIR = new URL("./", import.meta.url).pathname;

/** Module-level writes to process.env or globalThis in one suite's source → ["NAME", …]. PURE. */
export function moduleLevelWrites(src) {
  const out = [];
  for (const line of String(src).split("\n")) {
    if (/\/\/\s*one-process-safe:/.test(line)) continue;
    let m = /^process\.env\.([A-Za-z0-9_]+)\s*(?:\?\?|\|\||&&)?=(?!=)/.exec(line) ?? /^delete process\.env\.([A-Za-z0-9_]+)/.exec(line);
    if (m) { out.push(`env.${m[1]}`); continue; }
    if (/^Object\.assign\(\s*process\.env\b/.test(line)) { out.push("env.*"); continue; }
    m = /^globalThis\.([A-Za-z0-9_$]+)\s*(?:\?\?|\|\||&&)?=(?!=)/.exec(line);
    if (m) out.push(`globalThis.${m[1]}`);
  }
  return [...new Set(out)];
}

// present at int/r6 07185e93 (2026-11-04, after integration 3b: Brain, Forge, Studio, Games and Face moved theirs into
// hooks). Do not add to this list: fix the new suite instead.
const KNOWN_DEBT = new Set([
  "p2-face-flag.test.mjs globalThis.localStorage",
  "r4-asha-blink.test.mjs globalThis.performance",
]);

test("moduleLevelWrites: column-0 env and global writes only; indented, compared or marked lines are fine", () => {
  const src = [
    'process.env.TAXILA_X = "off";',
    "process.env.A ||= 'x';",
    "delete process.env.B;",
    "Object.assign(process.env, { C: '1' });",
    "globalThis.fetch = async () => {};",
    "globalThis.__taxilaNativeFetch ??= globalThis.fetch;   // one-process-safe: the stash every DB suite reads",
    "if (process.env.D === 'x') {}",
    "process.env.E == null;",
    "  process.env.F = 'inside a test';",
    "const x = process.env.G;",
  ].join("\n");
  assert.deepEqual(moduleLevelWrites(src), ["env.TAXILA_X", "env.A", "env.B", "env.*", "globalThis.fetch"]);
});

test("no suite writes process.env or globalThis at module level (npm test runs them all in ONE process)", () => {
  const found = [];
  for (const f of readdirSync(DIR).filter((n) => n.endsWith(".test.mjs")).sort()) {
    for (const w of moduleLevelWrites(readFileSync(DIR + f, "utf8"))) found.push(`${f} ${w}`);
  }
  const fresh = found.filter((k) => !KNOWN_DEBT.has(k));
  assert.deepEqual(fresh, [], "new module-level writes: they leak into every other suite under `npm test` but not into the CI shards. "
    + "Set the value inside the test (before/after) or pass an env object; see the header of tests/test-isolation.test.mjs");
});
