// Apply db/migrations/*.sql in order, once each. Usage: node scripts/migrate.mjs (reads DATABASE_URL).
import { neon } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const sql = neon(url);
await sql.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
const done = new Set((await sql.query("select name from schema_migrations")).map((r) => r.name));
for (const f of readdirSync(join(ROOT, "db/migrations")).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(f)) continue;
  const body = readFileSync(join(ROOT, "db/migrations", f), "utf8");
  // neon HTTP runs one statement per call; split on ; at line end outside of $$ blocks (we don't use $$).
  const stmts = body.split(/;\s*$/m).map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
  for (const s of stmts) await sql.query(s);
  await sql.query("insert into schema_migrations(name) values ($1)", [f]);
  console.log("applied", f, `(${stmts.length} statements)`);
}
const tables = await sql.query("select table_name from information_schema.tables where table_schema='public' order by 1");
console.log("tables:", tables.map((t) => t.table_name).join(", "));
