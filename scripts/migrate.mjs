// Apply db/migrations/*.sql in order, once each, each file in ONE transaction (round 7, platform-migrate-tooling; the logic
// is scripts/migrate-core.mjs).
//
//   node scripts/migrate.mjs                 the TEST branch (TAXILA_DB=test semantics; the default)
//   node scripts/migrate.mjs --dry-run       list what is pending, write nothing
//   node scripts/migrate.mjs --prod --backup NAME | --no-backup
//                                            production (DATABASE_URL_DIRECT, else DATABASE_URL). A Neon target gets a
//                                            backup branch NAME first (NEON_API_KEY + NEON_PROJECT_ID); --no-backup says
//                                            the caller took one (scripts/release.mjs) or accepts none, on the record
//   node scripts/migrate.mjs --sha REV ...     apply the db/migrations of commit REV (scripts/release.mjs), not the working tree
//   node scripts/migrate.mjs --job --prod --backup NAME | --no-backup
//                                            a database reachable only inside the ACA VNet (Azure PG): runs the apply in a
//                                            one-off ACA job (scripts/region/db-copy.mjs --apply-migrations); with
//                                            --dry-run prints that job's plan only
//
// Driver: Neon hosts go over Neon's HTTP transaction API (the sandbox cannot reach 5432); any other host, or DB_DRIVER=pg,
// uses the pg driver with server/db.js's TLS-enforcing pool config. Never prints a connection string.
import { execFileSync, spawnSync } from "child_process";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { ROOT, loadEnv } from "../infra/azure.mjs";
import { pgPoolConfig } from "../server/db.js";
import { migrate, migrationFiles, neonBackupBranch, resolveTarget } from "./migrate-core.mjs";
import { migrateJobRefusal } from "./deploy-core.mjs";

loadEnv();
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const PROD = flag("--prod"), DRY = flag("--dry-run"), JOB = flag("--job");

if (JOB) {
  const no = migrateJobRefusal({ prod: PROD, dry: DRY, backup: opt("--backup"), noBackup: flag("--no-backup") });
  if (no) { console.error(`migrate: ${no}`); process.exit(2); }
  // the in-VNet path: the job reads schema_migrations and applies what is missing, inside the database's network
  const args = ["scripts/region/db-copy.mjs", "--apply-migrations", ...(DRY ? ["--dry-run"] : []), ...(opt("--target") ? ["--target", opt("--target")] : []), ...(opt("--sha") ? ["--sha", opt("--sha")] : [])];
  console.log(`migrate --job: node ${args.join(" ")}`);
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit", env: process.env });
  process.exit(r.status ?? 1);
}

/** db/migrations/*.sql as committed at `rev` (name order), read with git, never the working tree. */
function filesAt(rev) {
  const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 });
  const sha = git("rev-parse", "--verify", `${rev}^{commit}`).trim();
  return git("ls-tree", "--name-only", sha, "db/migrations/").split("\n").filter((f) => f.endsWith(".sql")).sort()
    .map((f) => ({ name: f.split("/").pop(), body: git("show", `${sha}:${f}`) }));
}

let target;
try { target = resolveTarget({ prod: PROD }); } catch (e) { console.error(`migrate: ${e.message}`); process.exit(2); }
if (PROD && !DRY && !flag("--no-backup") && !opt("--backup")) {
  console.error("--prod writes production: pass --backup NAME (a Neon backup branch is taken first) or --no-backup (one was taken by the caller)");
  process.exit(2);
}
const neonHost = /\.neon\.tech$/.test(target.host) && process.env.DB_DRIVER !== "pg";
console.log(`migrate: target ${target.label} (${target.host}), driver ${neonHost ? "neon-http" : "pg"}${DRY ? ", dry run" : ""}`);

let client, end = async () => {}, connect = async () => {};
if (neonHost) {
  const sql = neon(target.url);
  client = { query: (text, params = []) => sql.query(text, params), tx: (stmts) => sql.transaction(stmts.map((s) => sql.query(s.text, s.params ?? []))) };
} else {
  const c = new pg.Client(pgPoolConfig(target.url));
  connect = () => c.connect();
  end = () => c.end().catch(() => {});
  client = {
    query: async (text, params = []) => (await c.query(text, params)).rows,
    tx: async (stmts) => {
      await c.query("begin");
      try { for (const s of stmts) await c.query(s.text, s.params ?? []); await c.query("commit"); }
      catch (e) { await c.query("rollback").catch(() => {}); throw e; }
    },
  };
}

try {
  await connect();
  if (PROD && !DRY && opt("--backup")) {
    if (!neonHost) throw new Error("--backup takes a Neon branch; for Azure PG take a server backup (portal / az) and pass --no-backup");
    const { NEON_API_KEY, NEON_PROJECT_ID } = process.env;
    if (!NEON_API_KEY || !NEON_PROJECT_ID) throw new Error("--backup needs NEON_API_KEY and NEON_PROJECT_ID");
    const b = await neonBackupBranch({ apiKey: NEON_API_KEY, projectId: NEON_PROJECT_ID, host: target.host, name: opt("--backup") });
    console.log(`backup branch ${b.name} (${b.branchId}) from ${b.parentId}`);
  }
  const r = await migrate({ client, files: opt("--sha") ? filesAt(opt("--sha")) : migrationFiles(ROOT + "db/migrations"), dryRun: DRY, log: (s) => console.log(s) });
  console.log(DRY ? `${r.pending.length} pending` : `${r.applied.length} applied, ${r.pending.length - r.applied.length} left`);
} catch (e) {
  console.error(`migrate failed: ${e.message}`);
  process.exitCode = 1;
} finally { await end(); }
