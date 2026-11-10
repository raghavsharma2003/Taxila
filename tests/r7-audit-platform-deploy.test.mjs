// Whole-project audit 2026-11-09, platform: the deploy and infra scripts (PLAT-03, 04, 18, 21, 22, 23, 26, 28, 60).
// Nothing here reaches Azure: the decisions live in scripts/deploy-core.mjs and scripts/release-core.mjs (pure).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import * as D from "../scripts/deploy-core.mjs";
import { planRelease, planRollback } from "../scripts/release-core.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const SHA = "23d3d7e0000000000000000000000000000000aa";

test("PLAT-03: after a failed deploy (no `previous` label) rollback refuses instead of picking the revision that just failed", () => {
  // the failed deploy's own PATCH left traffic [{prev, 100, current}]; the failed revision is the newest, deactivated
  const traffic = [{ revisionName: "web--r1", weight: 100, label: "current" }];
  const revisions = [{ name: "web--r0" }, { name: "web--r1" }, { name: "web--r2-failed" }];
  const r = D.rollbackTarget({ traffic, revisions });
  assert.equal(r.current, "web--r1");
  assert.equal(r.previous, null);
  assert.match(r.why, /--to/);
  // the release names the revision it captured
  assert.deepEqual(D.rollbackTarget({ traffic, revisions, to: "web--r0" }), { current: "web--r1", previous: "web--r0" });
  assert.equal(D.rollbackTarget({ traffic, revisions, to: "web--r1" }).previous, null, "never 'roll back' to what serves");
  assert.equal(D.rollbackTarget({ traffic, revisions, to: "web--nope" }).previous, null);
  // the normal case: a good deploy leaves `previous`
  const good = [{ revisionName: "web--r2", weight: 100, label: "current" }, { revisionName: "web--r1", weight: 0, label: "previous" }];
  assert.equal(D.rollbackTarget({ traffic: good, revisions }).previous, "web--r1");
});

test("PLAT-03 and PLAT-28: the release rollback sends the web to the captured revision and the worker without a fresh gate", () => {
  const p = planRollback({ capture: { workerTag: "ac4e8e8", webRevision: "taxila-web--abc" } });
  assert.deepEqual(p[0].argv, ["scripts/deploy-azure.mjs", "--rollback", "--to", "taxila-web--abc"]);
  assert.ok(p[1].argv.includes("--served"));
  assert.equal(D.workerGateNeeded({ prod: true, served: true, imageTag: "ac4e8e8" }), false);
  assert.equal(D.workerGateNeeded({ prod: true }), true);
  assert.equal(D.workerGateNeeded({ prod: false }), false);
  assert.throws(() => D.workerGateNeeded({ prod: true, served: true }), /--image-tag/);
  const src = readFileSync(join(ROOT, "scripts/deploy-azure.mjs"), "utf8");
  assert.doesNotMatch(src, /fallback = revs\.filter/, "the guess is gone from deploy-azure");
  assert.match(src, /rollbackTarget\(/);
});

test("PLAT-22 and PLAT-21: release steps after the freeze step carry --force; --migrate job hands its report to both deploys", () => {
  const p = planRelease({ sha: SHA });
  for (const id of ["web", "worker"]) assert.ok(p.find((s) => s.id === id).argv.includes("--force"), id);
  const j = planRelease({ sha: SHA, migrate: "job" });
  const ev = D.LATEST_EVIDENCE("apply");
  for (const id of ["web", "worker"]) {
    const a = j.find((s) => s.id === id).argv;
    assert.equal(a[a.indexOf("--migrations-evidence") + 1], ev, id);
  }
  assert.ok(j.find((s) => s.id === "migrate").argv.includes("--no-backup"));
  assert.match(readFileSync(join(ROOT, "scripts/region/db-copy.mjs"), "utf8"), /db-copy-\$\{MODE\}-latest\.json/);
});

test("PLAT-21: migrations evidence is checked the same way for both deploys", () => {
  const now = Date.parse("2026-11-10T10:00:00Z");
  const ev = { at: "2026-11-10T09:00:00Z", targetHost: "x.postgres.database.azure.com", ok: true, targetMigrations: ["001_core.sql", "002_b.sql"] };
  assert.deepEqual(D.checkMigrationsEvidence(ev, { host: "x.postgres.database.azure.com", files: ["001_core.sql"], now }), []);
  assert.throws(() => D.checkMigrationsEvidence(ev, { host: "y.postgres.database.azure.com", files: [], now }), /evidence is for/);
  assert.throws(() => D.checkMigrationsEvidence(ev, { host: ev.targetHost, files: ["003_c.sql"], now }), /lacks 003_c\.sql/);
  assert.throws(() => D.checkMigrationsEvidence(ev, { host: ev.targetHost, files: [], now: now + 7 * 3600_000 }), /older than 6 h/);
  assert.throws(() => D.checkMigrationsEvidence({ ...ev, ok: false }, { host: ev.targetHost, files: [], now }), /failed/);
  assert.equal(D.privateDbHost("x.postgres.database.azure.com"), true);
  assert.equal(D.privateDbHost("ep-x.neon.tech"), false);
  assert.match(readFileSync(join(ROOT, "scripts/deploy-worker.mjs"), "utf8"), /checkMigrationsEvidence\(/);
});

test("PLAT-23: deploy-azure refuses a production deploy in the evening freeze, never a rollback", () => {
  const peak = new Date("2026-11-10T13:00:00Z"); // 18:30 IST
  const calm = new Date("2026-11-10T06:00:00Z");
  assert.match(D.webFreezeRefusal({ now: peak }), /freeze/);
  assert.equal(D.webFreezeRefusal({ now: calm }), null);
  assert.equal(D.webFreezeRefusal({ now: peak, rollback: true }), null);
  assert.equal(D.webFreezeRefusal({ now: peak, force: true }), null);
  assert.equal(D.webFreezeRefusal({ now: peak, dry: true }), null);
  assert.equal(D.webFreezeRefusal({ now: peak, app: "taxila-web-si" }), null);
  assert.match(readFileSync(join(ROOT, "scripts/deploy-azure.mjs"), "utf8"), /webFreezeRefusal\(/);
});

test("PLAT-18: migrate --job asks for --prod and a backup decision, like the direct path", () => {
  assert.match(D.migrateJobRefusal({}), /--prod/);
  assert.match(D.migrateJobRefusal({ prod: true }), /--backup/);
  assert.equal(D.migrateJobRefusal({ prod: true, noBackup: true }), null);
  assert.equal(D.migrateJobRefusal({ prod: true, backup: "pre-x" }), null);
  assert.equal(D.migrateJobRefusal({ dry: true }), null);
  assert.match(readFileSync(join(ROOT, "scripts/migrate.mjs"), "utf8"), /migrateJobRefusal\(/);
});

test("PLAT-26: the worker-liveness alert is on whenever taxila-worker exists", () => {
  assert.equal(D.workerAlertOn({ workerExists: true }), true);
  assert.equal(D.workerAlertOn({ workerExists: false, env: {} }), false);
  assert.equal(D.workerAlertOn({ workerExists: false, env: { TAXILA_WORKER_LIVE: "1" } }), true);
  assert.match(readFileSync(join(ROOT, "infra/eyes.mjs"), "utf8"), /workerAlertOn\(/);
});

test("PLAT-60: --from-tree needs a named branch, never an old session branch", () => {
  assert.throws(() => D.fromTreeBranch(null), /--branch/);
  assert.throws(() => D.fromTreeBranch("--jobs"), /--branch/);
  assert.equal(D.fromTreeBranch("int/r6"), "int/r6");
  assert.doesNotMatch(readFileSync(join(ROOT, "scripts/deploy-worker.mjs"), "utf8"), /blissful-mayer/);
});

test("PLAT-04: the nightly job's sweep loads from exactly what Dockerfile.worker copies", { timeout: 60_000 }, () => {
  const df = readFileSync(join(ROOT, "Dockerfile.worker"), "utf8");
  const copied = [...df.matchAll(/^COPY (\S+) \.\/\S+/gm)].map((m) => m[1].replace(/\/$/, ""));
  assert.deepEqual([...copied].sort(), [...D.WORKER_DIRS].sort(), "Dockerfile.worker and deploy-worker's upload list agree");
  for (const f of ["server/worker.mjs", "src/modules/frame/engines/x.logic.ts", "db/migrations/001_core.sql", "package.json"]) assert.ok(D.workerContextFile(f), f);
  assert.ok(!D.workerContextFile("tests/x.test.mjs"));
  // an image-shaped directory: links to the copied dirs only (plus node_modules), loaded with --preserve-symlinks so a
  // relative import that leaves the copied dirs fails as it does in the container
  const dir = mkdtempSync(join(tmpdir(), "worker-image-"));
  try {
    for (const d of [...copied, "node_modules", "package.json"]) {
      mkdirSync(dirname(join(dir, d)), { recursive: true });
      symlinkSync(join(ROOT, d), join(dir, d));
    }
    // ops.mjs --nightly imports the sweep, which imports routes/account.js (sweep.js:23); the worker's own job handlers
    const probe = 'Promise.all(["./server/conductor/sweep.js", "./server/routes/account.js", "./server/conductor/handlers.js"].map((m) => import(m)))' +
      '.then(() => console.log("LOADED"), (e) => { console.log("FAILED " + e.code + " " + e.message); process.exitCode = 1; })';
    const r = spawnSync(process.execPath, ["--preserve-symlinks", "--input-type=module", "-e", probe], { cwd: dir, encoding: "utf8", env: { ...process.env, DATABASE_URL: "" }, timeout: 50_000 });
    assert.match(r.stdout, /LOADED/, r.stdout + r.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("PLAT-27: the handoff key list names every setting the release and the server read that it lacked", () => {
  const keys = JSON.parse(readFileSync(join(ROOT, "scripts/handoff/keys.json"), "utf8"));
  for (const k of ["NEON_API_KEY", "NEON_PROJECT_ID", "DATABASE_URL_DIRECT", "AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION", "TAXILA_D5_TICKET_KEY"]) assert.ok(keys.includes(k), k);
  assert.equal(new Set(keys).size, keys.length, "no name twice");
});

test("PLAT-49: the web image is built with VITE_BUILD_SHA, which the page reads as its build id", async () => {
  const { acrRunBody } = await import("../infra/azure.mjs");
  const b = acrRunBody({ images: ["taxila-web:abc1234"], sourceLocation: "s", dockerfile: "Dockerfile", buildArgs: { VITE_BUILD_SHA: "abc1234" } });
  assert.deepEqual(b.arguments, [{ name: "VITE_BUILD_SHA", value: "abc1234", isSecret: false }]);
  assert.equal("arguments" in acrRunBody({ images: [], sourceLocation: "s", dockerfile: "Dockerfile.worker" }), false, "no args, no field");
  const df = readFileSync(join(ROOT, "Dockerfile"), "utf8");
  const build = df.split(/^FROM /m)[1];
  assert.ok(build.indexOf("ARG VITE_BUILD_SHA") >= 0 && build.indexOf("ARG VITE_BUILD_SHA") < build.indexOf("RUN npm run build"), "ARG before the build");
  assert.match(build, /ENV VITE_BUILD_SHA=\$VITE_BUILD_SHA/);
  for (const f of ["scripts/deploy-azure.mjs", "scripts/release.mjs"]) assert.match(readFileSync(join(ROOT, f), "utf8"), /buildArgs: \{ VITE_BUILD_SHA: /, f);
  assert.match(readFileSync(join(ROOT, "src/main.tsx"), "utf8"), /import\.meta\.env\.VITE_BUILD_SHA/);
});
