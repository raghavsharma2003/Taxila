// Gate: every db/migrations/*.sql is recorded in the database's schema_migrations. Code that depends on an
// unapplied migration (commit.js writing notification.cls / correlation_id before 004_conductor_notification
// ran) fails here instead of in production. Read-only (one select). Skips without a reachable DATABASE_URL.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import { neon, neonConfig } from "@neondatabase/serverless";
import { migrationFiles, unappliedMigrations } from "../server/conductor/migrations.js";

const envFile = new URL("../.env.local", import.meta.url);
const URL_ = process.env.DATABASE_URL
  || (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL=")) || "").slice(13).replace(/^"(.*)"$/, "$1") : "");
const sql = URL_ ? neon(URL_) : null;
// other files stub fetch while their tests run (and they run while this file is imported): pin Neon's HTTP calls
// to the real fetch tests/index.js stashed before any test file loaded
const nativeFetch = globalThis.__taxilaNativeFetch ?? globalThis.fetch;
let prevFetchFn, reachable = false;

describe("migrations applied", { skip: !sql && "no DATABASE_URL", concurrency: false, timeout: 90_000 }, () => {
  before(async () => {
    prevFetchFn = neonConfig.fetchFunction; neonConfig.fetchFunction = nativeFetch;
    reachable = await Promise.race([sql.query("select 1").then(() => true, (e) => (console.error("[migrations-applied] probe:", e?.message?.slice(0, 160)), false)), new Promise((r) => setTimeout(() => r(false), 60_000))]);
  });
  after(() => { neonConfig.fetchFunction = prevFetchFn; });

  test("every db/migrations file is in schema_migrations", async (t) => {
    if (!reachable) return t.skip("database unreachable");
    assert.ok(migrationFiles().length >= 7);
    const missing = await unappliedMigrations((text) => sql.query(text));
    assert.deepEqual(missing, [], `apply with node --env-file=.env.local scripts/migrate.mjs: ${missing.join(", ")}`);
  });
});
