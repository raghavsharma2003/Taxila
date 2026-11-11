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
// KNOWN_DEBT was a ratchet for the offenders present when this check landed (21 on 2026-11-04); all are fixed, and it
// stays empty.
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

// Empty since int/r6 6c3c3c95 (integration 4, 2026-11-04): every suite sets its env and globals inside hooks. Keep it
// empty: fix a new suite instead of listing it.
const KNOWN_DEBT = new Set([]);

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

// ── Round 8, integration 28: two more leak shapes the leak check (scripts/test-leak-check.mjs) found, now caught statically ──
//
// (1) KILL SWITCHES. A test that ASSIGNS a Director/Brain/Studio/Loop kill switch (TAXILA_R7_*, TAXILA_R8_*, TAXILA_P5_*,
//     STUDIO_*, TAXILA_HOME_*) changes what every later file in the same process runs, unless the file puts it back. Evidence of
//     a restore, any one of: a `delete process.env.X` in the file, a read of `process.env.X` that is not an assignment (the save),
//     a `{ ...process.env }` snapshot, or the name in a list that a dynamic `process.env[k] =` / `delete process.env[k]` walks.
//     (Module-level writes are the other test above; this one is about writes inside tests and hooks.)
//
// (2) THE SCRIPT CACHE. server/director/script.js's scriptFor reads each topic's real lesson script ONCE per process and keeps
//     it (keyed by topic id). A file that walks the REAL kits through the Director or the compiler (it lists data/kits/ and calls
//     initLessonState / step / compile) fills that cache with real scripts; a later file that drives a mini-kit on the same topic
//     id then walks the real script instead of its own items (kit-budget-c4 → learner-live, p5-interaction-director,
//     r7-brain-methods, int/r6 integration 28). A file-level after() runs only when EVERY file is done, so the file must end
//     with a test that calls setScriptForTest() (no arguments: clears the cache).
const KILL_SWITCH = /^(TAXILA_(R7|R8|P5)_|STUDIO_|TAXILA_HOME_)/;

/** Kill-switch names a suite assigns with no restore evidence in the same source → ["NAME", …]. PURE. */
export function unrestoredKillSwitches(src) {
  src = String(src);
  const assigned = new Set();
  for (const m of src.matchAll(/(?<![\w.])process\.env\.([A-Z][A-Z0-9_]*)\s*(?:\?\?|\|\||&&)?=(?!=)|process\.env\[(["'`])([A-Z][A-Z0-9_]*)\2\]\s*=(?!=)/g)) {
    const n = m[1] ?? m[3];
    if (KILL_SWITCH.test(n)) assigned.add(n);
  }
  if (!assigned.size) return [];
  if (/\{\s*\.\.\.process\.env\s*\}|Object\.assign\(\s*\{\}\s*,\s*process\.env\s*\)/.test(src)) return [];
  const dynamic = /process\.env\[\s*[A-Za-z_$][\w$]*\s*\]\s*=(?!=)|delete process\.env\[/.test(src);
  return [...assigned].filter((n) => {
    const deleted = new RegExp(`delete process\\.env\\.${n}\\b`).test(src);
    const read = new RegExp(`(?<!delete\\s)process\\.env\\.${n}\\b(?!\\s*(?:\\?\\?|\\|\\||&&)?=(?!=))`).test(src);
    const listed = dynamic && new RegExp(`["'\`]${n}["'\`]|\\b${n}\\s*:`).test(src);
    return !(deleted || read || listed);
  });
}

/** True when the suite (plus the one-level fixtures it imports, passed as `fixtures`) walks every real kit through the Director
 *  or compiler and has no setScriptForTest() call to clear the script cache after. PURE. */
export function leavesScriptCache(src, fixtures = "") {
  const all = `${src}\n${fixtures}`;
  const walksRealKits = /readdirSync\([^)]*kits/.test(all) && /\b(initLessonState|compileWithReport|compile)\(/.test(all);
  return walksRealKits && !/setScriptForTest\(\s*\)/.test(all);
}

test("unrestoredKillSwitches / leavesScriptCache: the leak shapes, and the restores that are fine", () => {
  const set = 'process.env.TAXILA_R8_KNOWS = "off";';
  assert.deepEqual(unrestoredKillSwitches(`test("x", () => { ${set} assert.ok(1); });`), ["TAXILA_R8_KNOWS"]);
  assert.deepEqual(unrestoredKillSwitches(`test("x", () => { process.env.STUDIO_PHONE_PLAY = "1"; });`), ["STUDIO_PHONE_PLAY"]);
  assert.deepEqual(unrestoredKillSwitches(`${set}\nafterEach(() => { delete process.env.TAXILA_R8_KNOWS; });`), [], "a delete restores");
  assert.deepEqual(unrestoredKillSwitches(`const s = process.env.TAXILA_R8_KNOWS; ${set}\nafter(() => { process.env.TAXILA_R8_KNOWS = s; });`), [], "a saved read restores");
  assert.deepEqual(unrestoredKillSwitches(`const K = ["TAXILA_R7_SCRIPT"]; process.env.TAXILA_R7_SCRIPT = "off"; for (const k of K) delete process.env[k];`), [], "a list walked by a dynamic restore");
  assert.deepEqual(unrestoredKillSwitches(`const SAVED = { ...process.env }; ${set}`), [], "a whole-env snapshot");
  assert.deepEqual(unrestoredKillSwitches(`process.env.M3_RUNNER = "vm"; if (process.env.TAXILA_R8_KNOWS === "off") {}`), [], "other names, and comparisons, are not this rule");
  assert.equal(leavesScriptCache('readdirSync(new URL("data/kits/", ROOT)); initLessonState({});'), true);
  assert.equal(leavesScriptCache('readdirSync(new URL("data/kits/", ROOT)); initLessonState({}); test("c", () => { setScriptForTest(); });'), false);
  assert.equal(leavesScriptCache('setScriptForTest("t", {}); readdirSync(new URL("data/kits/", ROOT)); initLessonState({});'), true, "setting a script is not clearing the cache");
  assert.equal(leavesScriptCache('initLessonState({})'), false, "a mini-kit suite never lists data/kits");
});

test("no suite assigns a kill switch without restoring it; none leaves the real-script cache filled", () => {
  const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return ""; } };
  const env = [], cache = [];
  for (const f of readdirSync(DIR).filter((n) => n.endsWith(".test.mjs")).sort()) {
    const src = readFileSync(DIR + f, "utf8");
    for (const n of unrestoredKillSwitches(src)) env.push(`${f} ${n}`);
    const fixtures = [...src.matchAll(/from\s+["']\.\/fixtures\/([\w.-]+)["']/g)].map((m) => read(`${DIR}fixtures/${m[1]}`)).join("\n");
    if (leavesScriptCache(src, fixtures)) cache.push(f);
  }
  assert.deepEqual(env, [], "these suites assign a kill switch and never put it back (delete it in an afterEach/finally, or save and restore it): "
    + "it decides which code path every later suite in the same process runs");
  assert.deepEqual(cache, [], "these suites walk the real kits through the Director or compiler and never clear server/director/script.js's per-topic "
    + "script cache: end the file with test(\"cleanup\", () => { setScriptForTest(); }) (see tests/director-mounts.test.mjs)");
});
