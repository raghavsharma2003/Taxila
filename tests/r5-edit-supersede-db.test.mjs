// Spawns tests/r5-edit-supersede-db.run.mjs in its own process (its own server/db.js driver pointed at the Neon TEST branch).
// The child skips itself when CONDUCTOR_TEST_DATABASE_URL is unset or is the production endpoint; this wrapper then
// reports SKIPPED (never a pass that tested nothing) and otherwise demands at least one passing route test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

test("r5 edit supersede (child process, Neon test branch)", { timeout: 200_000 }, (t) => {
  const file = fileURLToPath(new URL("./r5-edit-supersede-db.run.mjs", import.meta.url));
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  // r5 QA D24 defers a page-hide end by TAXILA_PAGEHIDE_GRACE_MS (120 s by default; QA's tests/e2e/qa-reload.mjs covers the
  // deferred end). This suite's late-answer and late-disclosure checks are about a lesson the page-hide CLOSED, so it runs
  // with the immediate end (0), the path the deferred timer runs when the grace is over.
  const r = spawnSync(process.execPath, [file], { env: { ...env, NODE_USE_ENV_PROXY: env.NODE_USE_ENV_PROXY ?? "1", TAXILA_PAGEHIDE_GRACE_MS: env.TAXILA_PAGEHIDE_GRACE_MS ?? "0" }, encoding: "utf8", timeout: 190_000 });
  const out = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, out.slice(-3000));
  assert.match(out, /# fail 0/);
  const skipped = out.match(/# SKIP ([^\n]*)/);
  if (/# pass 0\b/.test(out)) return t.skip(`not run: ${skipped?.[1]?.trim() || "the route suite skipped itself"}`);
  assert.match(out, /# pass [1-9]/);
});
