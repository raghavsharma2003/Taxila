// r7 stream E: scripts/live-checks.mjs (the post-deploy checks main runs after a deploy) stays safe to run against
// production: test accounts only, deleted in a finally; and the Desk's QA page log is written only when asked for.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("the script parses, and touches only a @taxila.test guardian it creates and deletes in a finally", () => {
  execFileSync(process.execPath, ["--check", new URL("../scripts/live-checks.mjs", import.meta.url).pathname]);
  const s = read("scripts/live-checks.mjs");
  assert.match(s, /const email = `live-\$\{st\}\$\{rnd\}@taxila\.test`/);
  assert.doesNotMatch(s, /@(?!taxila\.test)[a-z0-9-]+\.[a-z]{2,}/i, "no other address anywhere");
  assert.match(s, /\} finally \{\s*await cleanUp\(\)/);
  assert.match(s, /parent\("DELETE", "\/api\/account", \{ password, confirm: true \}\)/);
  for (const k of ["pairing", "placement", "email", "timing"]) assert.match(s, new RegExp(`if \\(want\\("${k}"\\)\\)`), k);
  assert.match(s, /process\.exit\(fails \? 1 : 0\)/);
});

test("the Desk's QA page log is written only with localStorage tx.qa = \"1\"", () => {
  const b = read("src/child/lesson/boardPage.ts");
  assert.match(b, /if \(typeof window === "undefined" \|\| localStorage\.getItem\("tx\.qa"\) !== "1"\) return;/);
});
