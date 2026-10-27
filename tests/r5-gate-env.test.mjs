// round 5 (14.3, main): the gate's commands run in CI's environment. The deploy scripts load .env.local, so npm test used to
// inherit production's DATABASE_URL and wrote every stubbed model call into the production trace (rj-r143-gate-wrote-prod-trace).
import { test } from "node:test";
import assert from "node:assert/strict";
import { gateEnv } from "../infra/gate.mjs";

test("gateEnv: no database URL reaches the gate's commands; CI is set; everything else passes through", () => {
  const env = gateEnv({ DATABASE_URL: "postgresql://prod.example.invalid/db", DATABASE_URL_DIRECT: "postgresql://prod-direct.example.invalid/db",
    TAXILA_DB: "test", CONDUCTOR_TEST_DATABASE_URL: "postgresql://test.example.invalid/db", AZURE_OPENAI_ENDPOINT: "https://x.example.invalid", PATH: "/bin" });
  assert.equal(env.DATABASE_URL, "");
  assert.equal(env.DATABASE_URL_DIRECT, "");
  assert.equal(env.TAXILA_DB, "");
  assert.equal(env.CI, "1");
  assert.equal(env.CONDUCTOR_TEST_DATABASE_URL, "postgresql://test.example.invalid/db", "the DB suites keep the TEST branch");
  assert.equal(env.PATH, "/bin");
});
