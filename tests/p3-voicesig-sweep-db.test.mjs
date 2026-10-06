// Spawns tests/p3-voicesig-sweep-db.run.mjs in a child process (its own server/db.js driver, pointed at the TEST branch).
// The child skips itself when CONDUCTOR_TEST_DATABASE_URL is unset, is the production endpoint, or 021 is not migrated.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

test("voicesig stored baselines + consent sweep (child process, Neon test branch)", { timeout: 160_000 }, () => {
  const file = fileURLToPath(new URL("./p3-voicesig-sweep-db.run.mjs", import.meta.url));
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const r = spawnSync(process.execPath, [file], { env: { ...env, NODE_USE_ENV_PROXY: env.NODE_USE_ENV_PROXY ?? "1" }, encoding: "utf8", timeout: 150_000 });
  const out = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, out.slice(-4000));
  assert.match(out, /# fail 0/);
});
