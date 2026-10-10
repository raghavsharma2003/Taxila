// Round 4, stream 4A: the session-first START through the real route (patch request 02 applied) and a REAL database (the Neon
// TEST branch; tests/r4-conversation-session-db.run.mjs in its own process, TAXILA_SESSION_FIRST=on there). No model call:
// a voice-mode start compiles the intake's opening and stores the state; nothing is spoken. SKIPPED without the TEST URL.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

test("session-first start: the intake beat opens the lesson; a plain start is unchanged (child process, Neon test branch)", { timeout: 200_000 }, (t) => {
  const file = fileURLToPath(new URL("./r4-conversation-session-db.run.mjs", import.meta.url));
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const r = spawnSync(process.execPath, [file], { env: { ...env, TAXILA_SESSION_FIRST: "on", NODE_USE_ENV_PROXY: env.NODE_USE_ENV_PROXY ?? "1" }, encoding: "utf8", timeout: 190_000 });
  const out = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, out.slice(-3000));
  assert.match(out, /# fail 0/);
  const skipped = out.match(/# SKIP ([^\n]*)/);
  if (/# pass 0\b/.test(out)) return t.skip(`not run: ${skipped?.[1]?.trim() || "the route suite skipped itself"}`);
  assert.match(out, /# pass [1-9]/);
});
