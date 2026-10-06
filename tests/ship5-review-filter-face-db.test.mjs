// Spawns tests/ship5-review-filter-face-db.run.mjs in its own process (Neon TEST branch, fake Azure). Adversarial review of
// the ship5 integration, 2026-10-06: a content-filter safeguard turn must reach the face as calm_steady.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

test("ship5 review: content-filter safeguard → calm_steady face (child process, Neon test branch)", { timeout: 200_000 }, (t) => {
  const file = fileURLToPath(new URL("./ship5-review-filter-face-db.run.mjs", import.meta.url));
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const r = spawnSync(process.execPath, [file], { env: { ...env, NODE_USE_ENV_PROXY: env.NODE_USE_ENV_PROXY ?? "1" }, encoding: "utf8", timeout: 190_000 });
  const out = `${r.stdout}\n${r.stderr}`;
  if (/# pass 0\b/.test(out) && /# fail 0/.test(out)) return t.skip("the route suite skipped itself (no test branch)");
  assert.equal(r.status, 0, out.split("\n").filter((l) => !l.startsWith("[azure]") && !l.startsWith("# [azure]")).join("\n").slice(-3000));
  assert.match(out, /# fail 0/);
});
