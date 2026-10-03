// Spawns tests/reports-routes-db.run.mjs in a child process (its own server/db.js driver, pointed at the TEST branch,
// and no fetch stubs from other suites). The child skips itself when CONDUCTOR_TEST_DATABASE_URL is unset or is the
// production endpoint, or when parent_report is not migrated there.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

test("parent report routes during a safety hold (child process, Neon test branch)", { timeout: 200_000 }, () => {
  const file = fileURLToPath(new URL("./reports-routes-db.run.mjs", import.meta.url));
  // NODE_TEST_CONTEXT would make the child talk the runner's binary protocol instead of printing TAP
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const r = spawnSync(process.execPath, [file], { env: { ...env, NODE_USE_ENV_PROXY: env.NODE_USE_ENV_PROXY ?? "1" }, encoding: "utf8", timeout: 190_000 });
  const out = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, out.slice(-3000));
  assert.match(out, /# fail 0/);
});
