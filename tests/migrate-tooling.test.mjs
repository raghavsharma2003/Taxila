// Round 7, stream G (platform-migrate-tooling): scripts/migrate-core.mjs without a database or the network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { migrate, migrationFiles, neonBackupBranch, resolveTarget, splitSql } from "../scripts/migrate-core.mjs";

const MIG_DIR = new URL("../db/migrations/", import.meta.url).pathname;

// ───────────── splitSql ─────────────
test("splitSql: top-level semicolons only; strings, quoted names, $$ and $tag$ bodies, comments stay whole", () => {
  const sql = `-- header; with a semicolon
create table a (x text default 'a;b', "we;ird" int);
/* block; comment */ insert into a(x) values ('it''s; fine');
create function f() returns int language plpgsql as $$ begin perform 1; return 2; end $$;
create function g() returns text language sql as $body$ select ';' $body$;
-- trailing comment only`;
  const s = splitSql(sql);
  assert.equal(s.length, 4);
  assert.match(s[0], /^create table a \(x text default 'a;b', "we;ird" int\)$/);
  assert.match(s[1], /values \('it''s; fine'\)$/);
  assert.match(s[2], /\$\$ begin perform 1; return 2; end \$\$$/);
  assert.match(s[3], /\$body\$ select ';' \$body\$$/);
});

test("splitSql: empty and comment-only input yields no statements; a missing final semicolon still counts", () => {
  assert.deepEqual(splitSql(""), []);
  assert.deepEqual(splitSql("-- only\n-- comments\n"), []);
  assert.deepEqual(splitSql("select 1;\n;\n select 2"), ["select 1", "select 2"]);
});

test("splitSql: every shipped migration splits into $$-balanced statements, 004_conductor keeps its 4 functions", () => {
  const files = migrationFiles(MIG_DIR);
  assert.ok(files.length >= 30);
  assert.deepEqual(files.map((f) => f.name), [...files.map((f) => f.name)].sort(), "apply order = name order");
  for (const f of files) {
    const stmts = splitSql(f.body);
    assert.ok(stmts.length > 0, f.name);
    for (const s of stmts) assert.equal((s.match(/\$\$/g) || []).length % 2, 0, `${f.name}: unbalanced $$ in ${s.slice(0, 60)}`);
  }
  const c = splitSql(files.find((f) => f.name === "004_conductor.sql").body);
  assert.equal(c.filter((s) => /^create or replace function/i.test(s)).length, 4);
});

// ───────────── resolveTarget ─────────────
const ENV = { DATABASE_URL: "postgres://u:p@prod-host.example/db", TEST_DATABASE_URL: "postgres://u:p@test-host.example/db" };

test("resolveTarget: the default is the TEST database, even with no TAXILA_DB and a prod DATABASE_URL", () => {
  const t = resolveTarget({ env: { ...ENV } });
  assert.equal(t.label, "test");
  assert.equal(t.host, "test-host.example");
  assert.equal(resolveTarget({ env: { ...ENV, CONDUCTOR_TEST_DATABASE_URL: "postgres://u:p@cond.example/db" } }).host, "cond.example");
  assert.throws(() => resolveTarget({ env: { DATABASE_URL: ENV.DATABASE_URL } }), /no CONDUCTOR_TEST_DATABASE_URL/, "never falls back to prod");
});

test("resolveTarget: production only with --prod; TAXILA_DB=prod alone is refused, --prod with TAXILA_DB=test too", () => {
  assert.throws(() => resolveTarget({ env: { ...ENV, TAXILA_DB: "prod" } }), /needs --prod/);
  assert.throws(() => resolveTarget({ env: { ...ENV, TAXILA_DB: "test" }, prod: true }), /pick one/);
  const p = resolveTarget({ env: { ...ENV, DATABASE_URL_DIRECT: "postgres://u:p@prod-direct.example/db" }, prod: true });
  assert.deepEqual([p.label, p.host], ["prod", "prod-direct.example"]);
  assert.throws(() => resolveTarget({ env: {}, prod: true }), /not set/);
});

// ───────────── migrate (fake client) ─────────────
function fakeClient({ applied = [], hasTable = true, failOn = null } = {}) {
  const db = { table: hasTable, rows: new Set(applied), created: [], txs: [], writes: 0 };
  return {
    db,
    async query(text) {
      if (/to_regclass/.test(text)) return [{ t: db.table ? "schema_migrations" : null }];
      if (/^select name from schema_migrations/.test(text)) return [...db.rows].map((name) => ({ name }));
      if (/^create table if not exists schema_migrations/.test(text)) { db.table = true; db.writes++; return []; }
      throw new Error(`unexpected query ${text}`);
    },
    async tx(stmts) {
      db.txs.push(stmts);
      if (failOn && stmts.some((s) => s.text.includes(failOn))) throw new Error("boom");   // the whole tx rolls back
      const ins = stmts.at(-1);
      assert.match(ins.text, /^insert into schema_migrations/);
      db.rows.add(ins.params[0]); db.writes++;
      for (const s of stmts.slice(0, -1)) db.created.push(s.text);
    },
  };
}
const FILES = [
  { name: "001_a.sql", body: "create table a (x int);\ncreate index on a(x);" },
  { name: "002_b.sql", body: "create table b (y int);\nalter table b add column z int;\nselect boom;" },
  { name: "003_c.sql", body: "create table c (z int);" },
];

test("migrate: one transaction per pending file, its schema_migrations row inside it; applied files are skipped", async () => {
  const c = fakeClient({ applied: ["001_a.sql"] });
  const r = await migrate({ client: c, files: FILES });
  assert.deepEqual(r.applied, ["002_b.sql", "003_c.sql"]);
  assert.equal(c.db.txs.length, 2);
  assert.deepEqual(c.db.txs[0].map((s) => s.text.split(" ").slice(0, 2).join(" ")), ["create table", "alter table", "select boom", "insert into"]);
  assert.deepEqual(c.db.txs[0].at(-1).params, ["002_b.sql"]);
  assert.deepEqual(r.statements, { "002_b.sql": 3, "003_c.sql": 1 });
});

test("migrate: a failing file is rolled back whole, unrecorded, and stops the run (later files untouched)", async () => {
  const c = fakeClient({ failOn: "select boom" });
  await assert.rejects(migrate({ client: c, files: FILES }), (e) => e.file === "002_b.sql" && /rolled back; nothing of this file/.test(e.message));
  assert.deepEqual([...c.db.rows], ["001_a.sql"]);
  assert.ok(!c.db.created.some((t) => /table b|table c/.test(t)), "nothing of 002 or 003 applied");
});

test("migrate: a lower-numbered file added after higher ones were applied is still applied (a set, never 'max so far')", async () => {
  // round 7: Platform's 041 lands after Learning's 044-047 are already in production
  const c = fakeClient({ applied: ["001_a.sql", "003_c.sql"] });
  const r = await migrate({ client: c, files: FILES });
  assert.deepEqual(r.applied, ["002_b.sql"]);
  assert.deepEqual(c.db.txs[0].at(-1).params, ["002_b.sql"]);
});

test("migrate: dry run reads only; a missing schema_migrations table means everything is pending and is not created", async () => {
  const c = fakeClient({ hasTable: false });
  const logs = [];
  const r = await migrate({ client: c, files: FILES, dryRun: true, log: (s) => logs.push(s) });
  assert.deepEqual(r.pending, FILES.map((f) => f.name));
  assert.deepEqual(r.applied, []);
  assert.equal(c.db.writes, 0);
  assert.equal(c.db.txs.length, 0);
  assert.equal(logs.length, 3);
  const live = fakeClient({ hasTable: false });
  await migrate({ client: live, files: FILES.slice(0, 1) });
  assert.equal(live.db.table, true, "a real run creates the table");
});

// ───────────── neonBackupBranch (stub fetch) ─────────────
test("neonBackupBranch: endpoint → branch id → a child branch named as asked; the pooler suffix is dropped", async () => {
  const calls = [];
  const f = async (url, init = {}) => {
    calls.push({ url, method: init.method ?? "GET", body: init.body, auth: init.headers?.authorization });
    if (url.endsWith("/endpoints/ep-cool-sun-123")) return new Response(JSON.stringify({ endpoint: { branch_id: "br-main" } }));
    if (url.endsWith("/branches")) return new Response(JSON.stringify({ branch: { id: "br-backup" } }));
    return new Response("{}", { status: 404 });
  };
  const b = await neonBackupBranch({ apiKey: "k", projectId: "proj-1", host: "ep-cool-sun-123-pooler.region.aws.neon.tech", name: "pre-040", fetch: f });
  assert.deepEqual(b, { branchId: "br-backup", parentId: "br-main", name: "pre-040" });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /projects\/proj-1\/endpoints\/ep-cool-sun-123$/);
  assert.equal(calls[1].method, "POST");
  assert.deepEqual(JSON.parse(calls[1].body), { branch: { parent_id: "br-main", name: "pre-040" } });
  assert.equal(calls[0].auth, "Bearer k");
});

test("neonBackupBranch: a non-Neon host and HTTP errors fail before anything is created", async () => {
  await assert.rejects(neonBackupBranch({ apiKey: "k", projectId: "p", host: "taxila-cin-pg.postgres.database.azure.com", name: "x", fetch: async () => { throw new Error("no call expected"); } }), /not a Neon endpoint/);
  let posts = 0;
  await assert.rejects(neonBackupBranch({ apiKey: "k", projectId: "p", host: "ep-a-1.neon.tech", name: "x", fetch: async (u, i) => { if (i?.method === "POST") posts++; return new Response("{}", { status: 401 }); } }), /HTTP 401/);
  assert.equal(posts, 0);
});
