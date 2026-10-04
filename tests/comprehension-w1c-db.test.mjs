// W1-C against the REAL Neon test branch (never production): migration 012/013 land, the held-verdict store
// (later.js) writes by event id, claims a fallback under the row lock, applies a late verdict as ONE correction event,
// the re-teach resolution pays arm_posteriors exactly once, and the lesson trigger shifts a test account's clock.
// Runs the code in a CHILD process with DATABASE_URL = the test branch, so this process's database is never touched.
// Skips without TEST_DATABASE_URL / CONDUCTOR_TEST_DATABASE_URL.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import { spawnSync } from "child_process";

const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const URL_ = process.env.TEST_DATABASE_URL || fromEnvFile("TEST_DATABASE_URL") || process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");

const SCRIPT = `
import { randomUUID } from "crypto";
const root = ${JSON.stringify(new URL("../", import.meta.url).href)};
const { q, tx } = await import(root + "server/db.js");
const L = await import(root + "server/comprehension/later.js");
const S = await import(root + "server/comprehension/session.js");
const { outcomeIndex } = await import(root + "server/learner/kt/outcomes.js");
const out = {};
const quiet = console.info; console.info = () => {};
const reach = await Promise.race([q("select 1 from pending_grade limit 1").then(() => true, (e) => e.message), new Promise((r) => setTimeout(() => r("timeout"), 45000))]);
if (reach !== true) { console.log(JSON.stringify({ skip: String(reach) })); process.exit(0); }
const g = (await q("insert into guardian (email, pw_hash, name) values ($1, 'x', 'w1c-db') returning id", ["w1c-db+" + randomUUID() + "@taxila.test"]))[0].id;
try {
  const child = (await q("insert into child (guardian_id, first_name, class_level) values ($1, 'T', 5) returning *", [g]))[0];
  const lesson = (await q("insert into lesson (child_id, topic_id) values ($1, 'c5-maths-ch02-t01') returning id, started_at", [child.id]))[0];
  const SK = "c5-maths-ch02-t01-s1";
  const ev = (k) => ({ id: lesson.id + ":" + k + ":0", sessionId: lesson.id, sessionStartAt: new Date(lesson.started_at).toISOString(), at: new Date().toISOString(),
    episodeId: lesson.id + ":why" + k, skillIds: [SK], target: SK, cls: "probe.why", outcome: outcomeIndex("probe.why", "full"), grader: "llm", graderVersion: "classify-v1", via: "dialogue", itemKey: "w" + k, topicType: "T3" });
  const PRESENT = [{ label: "present", spanOk: true, op: "R-EXP", targetId: SK + ":e1", graderVersion: "g", model: "m", ms: 9, span: "the child's own words" }];
  const slow = (ms) => () => new Promise((r) => setTimeout(() => r(PRESENT[0]), ms));
  const req = { childText: "same roti both pieces", targets: [{ id: SK + ":e1", textEn: "equal parts of one whole" }] };

  // 1. in time: settled, written by event id, span never stored
  const e1 = ev(1);
  L.gradeLater(e1, req, { grade: slow(100) });
  const r1 = await L.settleHeld([e1.id], 600, { log: false });
  await new Promise((r) => setTimeout(r, 1500));
  const row1 = (await q("select results, fallback_at, corrected_at from pending_grade where event_id = $1", [e1.id]))[0];
  out.inTime = { settled: r1.settled, stored: !!row1, span: row1?.results?.[0]?.span ?? null, fallback: row1?.fallback_at ?? null };

  // 2. another replica: the verdict is only in the database (this process never graded it)
  const e2 = ev(2);
  await q("insert into pending_grade (event_id, lesson_id, results, settled_at) values ($1, $2, $3::jsonb, now())", [e2.id, lesson.id, JSON.stringify(PRESENT.map((x) => ({ ...x, span: null })))]);
  const r2 = await L.settleHeld([e2.id], 600, { log: false });
  out.otherReplica = { settled: r2.settled, db: r2.via.db, label: L.settledGrade(e2.id)?.[0]?.label ?? null };

  // 3. late: the turn claims the fallback, the verdict lands after, ONE correction row is written
  const e3 = ev(3);
  const p3 = L.gradeLater(e3, req, { grade: slow(1500) });
  const r3 = await L.settleHeld([e3.id], 50, { log: false });
  await p3; for (let i = 0; i < 60; i++) { const c = await q("select corrected_at from pending_grade where event_id = $1", [e3.id]); if (c[0]?.corrected_at) break; await new Promise((r) => setTimeout(r, 250)); }
  const corr = await q("select id, via, span_ok, cls, grader from kt_evidence where child_id = $1 and id like $2", [child.id, e3.id + "%"]);
  const row3 = (await q("select fallback_at, corrected_at from pending_grade where event_id = $1", [e3.id]))[0];
  out.late = { fallback: r3.fallback.length, rows: corr.map((x) => [x.id.endsWith(":late"), x.via, x.span_ok]), claimed: !!row3?.fallback_at, corrected: !!row3?.corrected_at };

  // 4. re-teach resolution pays the posterior once
  const arm = "test-arm-" + randomUUID();
  const at = (await q("insert into reteach_attempts (child_id, session_id, skill_id, arm_id, rep_class, trigger, chosen_by, legal_mode_at_write) values ($1,$2,$3,$4,'pictorial','u_low_after_practice','thompson','M1') returning id", [child.id, lesson.id, SK, arm]))[0];
  const st = S.resolutionStmt({ id: at.id, armId: arm, outcome: "resolved_delayed", reward: 1, final: true, cluster: "maths:B3" });
  await tx([st]); await tx([st]);
  const post = await q("select a, b, n from arm_posteriors where arm_id = $1", [arm]);
  const rr = (await q("select outcome, reward, rewarded_at is not null as rewarded, cluster from reteach_attempts where id = $1", [at.id]))[0];
  out.posterior = { rows: post.length, a: post[0]?.a, b: post[0]?.b, n: post[0]?.n, row: rr };
  await q("delete from arm_posteriors where arm_id = $1", [arm]);

  // 5. the test clock's lesson trigger
  await q("insert into test_clock (guardian_id, offset_ms) values ($1, 86400000)", [g]);
  const l2 = (await q("insert into lesson (child_id, topic_id) values ($1, 't') returning extract(epoch from (started_at - now())) as ahead", [child.id]))[0];
  out.clock = { aheadH: Math.round(Number(l2.ahead) / 3600) };
} finally {
  await q("delete from guardian where id = $1", [g]);
  out.cleaned = (await q("select count(*)::int as n from pending_grade where lesson_id in (select id from lesson where child_id in (select id from child where guardian_id = $1))", [g]))[0].n === 0;
  console.info = quiet;
}
console.log(JSON.stringify(out));
`;

test("W1-C on the Neon test branch: settle store, late correction, posterior once, clock trigger", { skip: !URL_ && "no TEST_DATABASE_URL (a Neon branch; never production)", timeout: 150_000 }, (t) => {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", SCRIPT], { encoding: "utf8", timeout: 140_000,
    env: { ...process.env, DATABASE_URL: URL_, DB_DRIVER: "" } });
  assert.equal(r.status, 0, r.stderr.slice(-2000));
  const out = JSON.parse(r.stdout.trim().split("\n").at(-1));
  if (out.skip) return t.skip(`test branch unreachable: ${out.skip}`);
  assert.deepEqual(out.inTime, { settled: 1, stored: true, span: null, fallback: null });
  assert.deepEqual(out.otherReplica, { settled: 1, db: 1, label: "present" });
  assert.equal(out.late.fallback, 1);
  assert.ok(out.late.claimed && out.late.corrected, JSON.stringify(out.late));
  assert.deepEqual(out.late.rows, [[true, "late", true]], "exactly one row: the correction (the fallback row itself is the turn's to write)");
  assert.deepEqual([out.posterior.rows, out.posterior.a, out.posterior.b, out.posterior.n], [1, 2, 1, 1], "paid once despite two runs");
  assert.equal(out.posterior.row.outcome, "resolved_delayed"); assert.equal(out.posterior.row.rewarded, true); assert.equal(out.posterior.row.cluster, "maths:B3");
  assert.equal(out.clock.aheadH, 24);
  assert.equal(out.cleaned, true);
});
