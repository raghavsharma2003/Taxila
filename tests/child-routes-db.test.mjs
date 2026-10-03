// Spawns tests/child-routes-db.run.mjs in its own process (its own server/db.js driver pointed at the Neon TEST branch).
// The child skips itself when CONDUCTOR_TEST_DATABASE_URL is unset or is the production endpoint.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

test("child plan / map / teacher / summary / request routes (child process, Neon test branch)", { timeout: 200_000 }, () => {
  const file = fileURLToPath(new URL("./child-routes-db.run.mjs", import.meta.url));
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const r = spawnSync(process.execPath, [file], { env: { ...env, NODE_USE_ENV_PROXY: env.NODE_USE_ENV_PROXY ?? "1" }, encoding: "utf8", timeout: 190_000 });
  const out = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, out.slice(-3000));
  assert.match(out, /# fail 0/);
});
