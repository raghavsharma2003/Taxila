// "Is every migration in the repo applied to this database?" (review conductor-m0: 004_conductor_notification
// sat unapplied in production while commit.js already wrote its columns). Used by the worker at boot (refuses to
// start on a schema older than its code) and by tests/migrations-applied.test.mjs (fails the gate).
import { readdirSync } from "fs";

const DIR = new URL("../../db/migrations/", import.meta.url);

/** Every db/migrations/*.sql file name, in the order scripts/migrate.mjs applies them. */
export const migrationFiles = () => readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();

/**
 * @param {(text: string, params?: unknown[]) => Promise<Array<{ name: string }>>} query
 * @returns {Promise<string[]>} files not recorded in schema_migrations (all of them if the table is missing)
 */
export async function unappliedMigrations(query) {
  const have = await query("select name from schema_migrations").then((rows) => new Set(rows.map((r) => r.name)), () => new Set());
  return migrationFiles().filter((f) => !have.has(f));
}
