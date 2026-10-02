// The Conductor substrate against a REAL Neon database (migration 004_conductor.sql applied): idempotent and
// concurrent ingest, exactly-once timers, job locking and fencing, the step lease, has_more and replay.
//
// NEVER the production branch. Runs only when CONDUCTOR_TEST_DATABASE_URL points at a DEDICATED Neon branch
// (create one with Neon branching, e.g. `conductor-test`, and reset it from its parent between runs when it
// drifts); skips when that is unset, and refuses (skips loudly) when its host is the production endpoint
// (DATABASE_URL / .env.local). A production worker would otherwise race these tests (its ticker is not narrowed
// to the test children, its claim loop is not narrowed to test.echo) and production would process test rows.
// Every idem key, lessonId and job key is salted with a per-run id so two concurrent runs never collide, and
// before() sweeps test guardians left by a killed run (after() is skipped on SIGINT / timeout).
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";

const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const URL_ = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnvFile("DATABASE_URL");
const SKIP = !URL_ ? "CONDUCTOR_TEST_DATABASE_URL not set (a dedicated Neon test branch; never production)"
  : PROD && hostOf(URL_) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
if (SKIP && URL_) console.error(`[conductor-db] ${SKIP}`);
const RUN = randomUUID().slice(0, 8);                       // salts every globally-unique key of this run

const C = await import("../server/conductor/index.js");
const { configure, closePool, q, one, withTx } = await import("../server/conductor/pg.js");
const { registerJobKind } = await import("../server/conductor/config.js");
const { upsertWakeupSql } = await import("../server/conductor/timers.js");

describe("conductor on Neon (test branch)", { skip: SKIP, concurrency: false, timeout: 240_000 }, () => {
  let guardian, kid, kid2;
  const LT1 = `LT-${RUN}-1`, LT2 = `LT-${RUN}-2`;
  const echoRuns = [];
  before(async () => {
    await configure({ url: URL_, driver: "neon-ws", max: 8 });
    // orphans of a killed run (its after() never ran): cascades to every conductor row of those children
    await q("delete from guardian where email like 'conductor-test+%@test.invalid' and created_at < now() - interval '1 hour'");
    const g = await one(`insert into guardian (email, pw_hash, name) values ($1, 'x', 'conductor-test') returning id`, [`conductor-test+${randomUUID()}@test.invalid`]);
    guardian = g.id;
    kid = (await one(`insert into child (guardian_id, first_name, class_level) values ($1, 'Test', 4) returning id`, [guardian])).id;
    kid2 = (await one(`insert into child (guardian_id, first_name, class_level) values ($1, 'Test2', 2) returning id`, [guardian])).id;
    for (const p of ["core_tutoring", "memory"]) await q(`insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 'test', true, 'test')`, [guardian, p]);
    registerJobKind("test.echo", { lane: "fast", priority: 2, purpose: null, budgetMicroUsd: 0, maxAttempts: 3, leaseSec: 30, allowedIn: [] });
    C.registerHandler("test.echo", async (job) => { echoRuns.push(job.id); if (job.input.fail) throw new Error("boom"); return `echo:${job.input.n}`; });
  });
  after(async () => {
    if (guardian) await q("delete from guardian where id = $1", [guardian]);   // cascades child → every conductor table
    const left = kid ? await one(`select (select count(*) from student_event where child_id = $1) + (select count(*) from job where child_id = $1)
      + (select count(*) from wakeup where child_id = $1) + (select count(*) from conductor_state where child_id = $1) as n`, [kid]) : { n: 0 };
    assert.equal(Number(left.n), 0, "erasing the child cascades every conductor row");
    await closePool();
  });

  const evCount = async (child, where = "true", params = []) => Number((await one(`select count(*) as n from student_event where child_id = $1 and ${where}`, [child, ...params])).n);

  test("idempotent ingest: the same fact twice is one event; a bad body never reaches the log", async () => {
    const e = { type: "teacher.promise", promiseId: "p-1", what: { kind: "game", ref: "fraction-bars" }, by: "asha" };
    const a = await C.emit(kid, e, { step: false });
    const b = await C.emit(kid, e, { step: false });
    assert.equal(typeof a.seq, "number");
    assert.equal(b.duplicate, true);
    assert.equal(b.seq, null);
    assert.equal(await evCount(kid, "idem_key = 'promise:p-1'"), 1);
    await assert.rejects(C.emit(kid, { type: "teacher.promise", promiseId: "p-2", what: { kind: "game", ref: "x" }, by: "asha", note: "free text" }), C.EventInvalid);
  });

  test("concurrent ingest: 20 distinct facts get contiguous seqs; 10 racing duplicates land once and burn no seq (I-R1)", async () => {
    const before = Number((await one("select last from child_seq where child_id = $1", [kid])).last);
    const res = await Promise.all(Array.from({ length: 20 }, (_, i) => C.emit(kid, { type: "skill.milestone", skillId: `s${i}`, to: "due", evidenceSeq: i }, { step: false })));
    const seqs = res.map((r) => r.seq).sort((x, y) => x - y);
    assert.deepEqual(seqs, Array.from({ length: 20 }, (_, i) => before + 1 + i));
    const dup = await Promise.all(Array.from({ length: 10 }, () => C.emit(kid, { type: "skill.milestone", skillId: "dup", to: "mastered", evidenceSeq: 1 }, { step: false })));
    assert.equal(dup.filter((r) => !r.duplicate).length, 1);
    assert.equal(Number((await one("select last from child_seq where child_id = $1", [kid])).last), before + 21, "no gap from the duplicates");
    const rows = await q("select seq from student_event where child_id = $1 order by seq", [kid]);
    rows.forEach((r, i) => assert.equal(Number(r.seq), i + 1, "seq has no gaps"));
  });

  test("step folds the log: actor created, plan adopted, clock armed, dirty set cleared, lease released", async () => {
    const r = await C.step(kid);
    assert.ok(r.events >= 22, `folded ${r.events}`);
    const st = await one("select * from conductor_state where child_id = $1", [kid]);
    const last = Number((await one("select last, pending_since from child_seq where child_id = $1", [kid])).last);
    assert.equal(Number(st.cursor_seq), last);
    assert.equal(st.lease_token, null);
    assert.equal((await one("select pending_since from child_seq where child_id = $1", [kid])).pending_since, null);
    const plan = await C.planToday(kid, { replicaId: "test" });
    assert.ok(plan, "today's plan exists");
    assert.equal(plan.version, 1);
    assert.ok(Array.isArray(plan.plan.slots));
    const wakes = (await q("select dedupe from wakeup where child_id = $1 and fired_at is null", [kid])).map((w) => w.dedupe);
    assert.ok(wakes.some((d) => d.startsWith("day_start:")), `day_start armed: ${wakes}`);
    assert.ok(wakes.some((d) => d.startsWith("night:")), "night armed");
    const log = await q("select version, from_seq, to_seq, brief_digest from decision_log where child_id = $1 order by version", [kid]);
    assert.equal(Number(log[0].version), 0, "v0 holds the initial state");
    assert.ok(log.slice(1).every((d) => d.brief_digest), "every batch records its view snapshot");
    // a second planToday is idempotent (same boot) and does not re-plan
    const again = await C.planToday(kid, { replicaId: "test" });
    assert.equal(again.version, plan.version);
  });

  test("lesson boundary: started → in_lesson; ended → memory job queued + debounced replan row", async () => {
    await C.emit(kid, { type: "lesson.started", lessonId: LT1, topicId: "c4-maths-fractions", kind: "live", lanes: ["realtime"] }, { step: "await" });
    assert.equal((await one("select mode from conductor_state where child_id = $1", [kid])).mode, "in_lesson");
    await C.emit(kid, { type: "lesson.ended", lessonId: LT1, reason: "completed", minutes: 18, outcomeDigest: { vibeClose: "fine" } }, { step: "await" });
    assert.equal((await one("select mode from conductor_state where child_id = $1", [kid])).mode, "free");
    const job = await one("select status, lane, priority from job where child_id = $1 and kind = 'memory.consolidate' and idem_key = $2", [kid, `memory.consolidate:${LT1}`]);
    assert.equal(job?.status, "queued");
    const w = await one("select due_at from wakeup where child_id = $1 and dedupe like 'replan:%' and fired_at is null", [kid]);
    assert.ok(w && new Date(w.due_at) > new Date(), "replan debounce in the future");
    // a re-sent close is one event and enqueues nothing new
    await C.emit(kid, { type: "lesson.ended", lessonId: LT1, reason: "completed", minutes: 18 }, { step: "await" });
    assert.equal(Number((await one("select count(*) as n from job where child_id = $1 and kind = 'memory.consolidate'", [kid])).n), 1);
  });

  test("exactly-once timers: 5 racing tickers fire a due row once; a later re-arm fires once more (I-R2)", async () => {
    await q(upsertWakeupSql, [kid2, "test:once", new Date(Date.now() - 1000).toISOString(), "dormancy_check"]);
    const runs = await Promise.all(Array.from({ length: 5 }, () => C.fireDue({ limit: 10, only: [kid2] })));
    assert.equal(runs.flat().filter((r) => r.dedupe === "test:once").length, 1, "one ticker won the row");
    assert.equal(await evCount(kid2, "type = 'clock.wakeup' and body->>'wakeupId' = 'test:once'"), 1);
    assert.equal((await C.fireDue({ only: [kid2] })).length, 0, "nothing left to fire");
    // re-arm: same semantic key, a LATER instant → fires exactly once more, with a new idem key
    const fired = (await one("select fired_at from wakeup where child_id = $1 and dedupe = 'test:once'", [kid2])).fired_at;
    await q(upsertWakeupSql, [kid2, "test:once", new Date(new Date(fired).getTime() + 5).toISOString(), "dormancy_check"]);
    await new Promise((r) => setTimeout(r, 50));
    const again = await Promise.all(Array.from({ length: 3 }, () => C.fireDue({ only: [kid2] })));
    assert.equal(again.flat().length, 1);
    assert.equal(await evCount(kid2, "type = 'clock.wakeup' and body->>'wakeupId' = 'test:once'"), 2);
    // re-upserting the SAME (past) instant after it fired does not re-arm
    await q(upsertWakeupSql, [kid2, "test:once", new Date(new Date(fired).getTime() + 5).toISOString(), "dormancy_check"]);
    assert.equal((await C.fireDue({ only: [kid2] })).length, 0);
    // a future row is not fired early
    await q(upsertWakeupSql, [kid2, "test:future", new Date(Date.now() + 3600_000).toISOString(), "dormancy_check"]);
    assert.equal((await C.fireDue({ only: [kid2] })).length, 0);
    // the wakeup event folds through decide like any other
    const r = await C.step(kid2);
    assert.ok(r.events >= 2);
  });

  test("job locking: concurrent claimers get disjoint jobs (SKIP LOCKED); attempts fence zombies; lease expiry re-claims", async () => {
    for (let n = 0; n < 6; n++) await C.enqueueJob(kid, { kind: "test.echo", idemKey: `echo:${RUN}:${n}`, input: { n }, lane: "fast", leaseSec: 30, maxAttempts: 3 });
    assert.equal(await C.enqueueJob(kid, { kind: "test.echo", idemKey: `echo:${RUN}:0`, input: { n: 0 }, lane: "fast" }), null, "duplicate enqueue is a no-op");
    const claims = await Promise.all(Array.from({ length: 4 }, (_, i) => C.claimJobs("fast", { limit: 2, worker: `w${i}`, kinds: ["test.echo"], childIds: [kid] })));
    const ids = claims.flat().map((j) => Number(j.id));
    assert.equal(ids.length, 6, "all six claimed");
    assert.equal(new Set(ids).size, 6, "no job claimed twice");
    const j0 = claims.flat()[0];
    assert.equal(j0.attempts, 1);
    // lease expiry → another worker re-claims with attempts 2; the first attempt is now a zombie
    await q("update job set lease_until = now() - interval '1 second' where id = $1", [j0.id]);
    const [re] = await C.claimJobs("fast", { limit: 1, worker: "w9", kinds: ["test.echo"], childIds: [kid] });
    assert.equal(Number(re.id), Number(j0.id));
    assert.equal(re.attempts, 2);
    assert.equal(await C.completeJob(j0.id, 1, { ok: true, result: "zombie" }), false, "zombie attempt changes nothing");
    assert.equal((await C.heartbeat(j0.id, 1)).alive, false, "zombie heartbeat refused");
    assert.equal(await C.runJob(re), true);
    const done = await one("select status, result_ref from job where id = $1", [re.id]);
    assert.deepEqual(done, { status: "done", result_ref: `echo:${re.input.n}` });
    assert.equal(await evCount(kid, "idem_key = $2", [`job:${re.id}:done`]), 1, "job.done ingested atomically with the finish");
    // finish the rest through runJob
    for (const j of claims.flat().filter((x) => Number(x.id) !== Number(j0.id))) assert.equal(await C.runJob(j), true);
    assert.equal(Number((await one("select count(*) as n from job where child_id = $1 and kind = 'test.echo' and status = 'done'", [kid])).n), 6);
  });

  test("job outcomes: retry with backoff, dead + job.failed after max attempts, cancel_requested → cancelled, erasing fences", async () => {
    const id = await C.enqueueJob(kid, { kind: "test.echo", idemKey: `echo:${RUN}:fail`, input: { fail: true }, lane: "fast", maxAttempts: 2 });
    let [j] = await C.claimJobs("fast", { limit: 1, kinds: ["test.echo"], childIds: [kid] });
    assert.equal(Number(j.id), Number(id));
    await C.runJob(j);
    let row = await one("select status, run_after > now() as later from job where id = $1", [id]);
    assert.deepEqual(row, { status: "retry", later: true });
    await q("update job set run_after = now() where id = $1", [id]);
    [j] = await C.claimJobs("fast", { limit: 1, kinds: ["test.echo"], childIds: [kid] });
    await C.runJob(j);
    row = await one("select status from job where id = $1", [id]);
    assert.equal(row.status, "dead");
    assert.equal(await evCount(kid, "idem_key = $2 and type = 'job.failed'", [`job:${id}:dead`]), 1);
    // cancel_requested while running → cancelled, no event
    const id2 = await C.enqueueJob(kid, { kind: "test.echo", idemKey: `echo:${RUN}:cancel`, input: { n: 7 }, lane: "fast" });
    const [j2] = await C.claimJobs("fast", { limit: 1, kinds: ["test.echo"], childIds: [kid] });
    await q("update job set cancel_requested = true where id = $1", [id2]);
    assert.equal(await C.completeJob(j2.id, j2.attempts, { ok: true, result: "x" }), true);
    assert.equal((await one("select status from job where id = $1", [id2])).status, "cancelled");
    assert.equal(await evCount(kid, "idem_key like $2", [`job:${id2}:%`]), 0);
    // an erasing workspace fences completion
    const id3 = await C.enqueueJob(kid2, { kind: "test.echo", idemKey: `echo:${RUN}:erase`, input: { n: 8 }, lane: "fast" });
    await C.step(kid2);                                       // ensures the workspace row exists
    const [j3] = await C.claimJobs("fast", { limit: 1, kinds: ["test.echo"], childIds: [kid2] });
    await q("update workspace set state = 'erasing' where child_id = $1", [kid2]);
    assert.equal(await C.completeJob(j3.id, j3.attempts, { ok: true, result: "x" }), false);
    assert.equal((await one("select status from job where id = $1", [id3])).status, "cancelled");
    await q("update workspace set state = 'active' where child_id = $1", [kid2]);
  });

  test("the lease is the mutex: racing steps never double-fold; events ingested mid-step are not lost (has_more)", async () => {
    const lastBefore = Number((await one("select last from child_seq where child_id = $1", [kid])).last);
    const emits = Array.from({ length: 12 }, (_, i) => C.emit(kid, { type: "skill.milestone", skillId: `race${i}`, to: "learned_today", evidenceSeq: 100 + i }, { step: false }));
    const steps = Array.from({ length: 4 }, () => C.step(kid));
    const results = await Promise.all([...emits, ...steps]);
    // whatever the interleaving, a final drain leaves nothing unfolded
    for (let i = 0; i < 5; i++) { const r = await C.step(kid); if (!r.events) break; }
    const st = await one("select cursor_seq, version, lease_token from conductor_state where child_id = $1", [kid]);
    const cs = await one("select last, pending_since from child_seq where child_id = $1", [kid]);
    assert.equal(Number(cs.last), lastBefore + 12);
    assert.equal(Number(st.cursor_seq), Number(cs.last), "every event folded");
    assert.equal(cs.pending_since, null, "dirty set cleared");
    assert.equal(st.lease_token, null);
    // no event was folded twice: decision ranges are contiguous and disjoint
    const ranges = await q("select from_seq, to_seq from decision_log where child_id = $1 and version > 0 order by version", [kid]);
    for (let i = 1; i < ranges.length; i++) assert.equal(Number(ranges[i].from_seq), Number(ranges[i - 1].to_seq), "contiguous");
    const stepped = results.slice(12);
    assert.ok(stepped.every((r) => typeof r.events === "number"));
  });

  test("X29 lock order: commit ‖ complete_job ‖ fire_wakeups on one child, 5 rounds, 0 deadlocks", async () => {
    let deadlocks = 0;
    for (let round = 0; round < 5; round++) {
      const jid = await C.enqueueJob(kid2, { kind: "test.echo", idemKey: `echo:${RUN}:lock:${round}`, input: { n: round }, lane: "fast" });
      const [j] = await C.claimJobs("fast", { limit: 1, kinds: ["test.echo"], childIds: [kid2] });
      assert.equal(Number(j.id), Number(jid));
      await q(upsertWakeupSql, [kid2, `test:lock:${round}`, new Date(Date.now() - 1000).toISOString(), "dormancy_check"]);
      await C.emit(kid2, { type: "skill.milestone", skillId: `lock${round}`, to: "due", evidenceSeq: round }, { step: false });
      const settled = await Promise.allSettled([
        C.step(kid2),                                                     // conductor_state → … → child_seq
        C.completeJob(j.id, j.attempts, { ok: true, result: "x" }),       // job → workspace → child_seq
        C.fireDue({ only: [kid2] }),                                      // wakeup → child_seq
        C.emit(kid2, { type: "skill.milestone", skillId: `lock${round}b`, to: "due", evidenceSeq: round }, { step: false }),
      ]);
      for (const s of settled) if (s.status === "rejected") { if (s.reason?.code === "40P01") deadlocks++; else throw s.reason; }
    }
    assert.equal(deadlocks, 0);
    for (let i = 0; i < 5; i++) { const r = await C.step(kid2); if (!r.events) break; }
    const st = await one("select cursor_seq from conductor_state where child_id = $1", [kid2]);
    assert.equal(Number(st.cursor_seq), Number((await one("select last from child_seq where child_id = $1", [kid2])).last));
  });

  test("replay reproduces every batch's commands and the final state, with no write handle (X31)", async () => {
    const r1 = await C.replay(kid);
    assert.deepEqual(r1.mismatches, []);
    const r2 = await C.replay(kid2);
    assert.deepEqual(r2.mismatches, []);
  });

  test("safety incident through the log: hold, the queued memory job cancelled, rest plan", async () => {
    await C.emit(kid, { type: "lesson.ended", lessonId: LT2, reason: "completed", minutes: 3 }, { step: "await" });
    assert.equal((await one("select status from job where child_id = $1 and idem_key = $2", [kid, `memory.consolidate:${LT2}`])).status, "queued");
    await C.emit(kid, { type: "safety.incident", incidentId: "inc-t1", severity: "high", category: "other" }, { step: "await" });
    const st = await one("select mode, plan_version, state from conductor_state where child_id = $1", [kid]);
    assert.equal(st.mode, "safety_hold");
    assert.equal((await one("select status from job where child_id = $1 and idem_key = $2", [kid, `memory.consolidate:${LT2}`])).status, "cancelled");
    const p = await one("select plan from day_plan where child_id = $1 order by day desc, version desc limit 1", [kid]);
    assert.equal(p.plan.mode, "rest_day");
    assert.deepEqual((await C.replay(kid)).mismatches, []);
  });

  test("poison job: a lease that expired on the LAST attempt is declared dead + job.failed, never re-claimed", async () => {
    const id = await C.enqueueJob(kid, { kind: "test.echo", idemKey: `echo:${RUN}:poison`, input: { n: 66 }, lane: "fast", maxAttempts: 1 });
    const [j] = await C.claimJobs("fast", { limit: 1, kinds: ["test.echo"], childIds: [kid] });
    assert.equal(Number(j.id), Number(id));
    await q("update job set lease_until = now() - interval '1 second' where id = $1", [id]);   // the worker died mid-handler
    const orig = console.error; console.error = () => {};
    let again;
    try { again = await C.claimJobs("fast", { limit: 5, kinds: ["test.echo"], childIds: [kid] }); } finally { console.error = orig; }
    assert.ok(!again.some((x) => Number(x.id) === Number(id)), "not re-claimed");
    assert.equal((await one("select status from job where id = $1", [id])).status, "dead");
    assert.equal(await evCount(kid, "idem_key = $2 and type = 'job.failed'", [`job:${id}:dead`]), 1);
  });

  test("replay runs in a read-only transaction and a write-counting shim sees 0 writes (I-R9)", async () => {
    const r = await withTx(async (t) => {
      const shim = C.writeCountingReader(t);
      const out = await C.replay(kid, { reader: shim });
      return { out, writes: shim.writes, reads: shim.reads };
    }, { readOnly: true });
    assert.deepEqual(r.out.mismatches, []);
    assert.equal(r.writes, 0);
    assert.equal(r.reads, 4);
    // negative control: the read-only transaction really refuses writes
    await assert.rejects(withTx((t) => t.q("update conductor_state set updated_at = now() where child_id = $1", [kid]), { readOnly: true }), (e) => e.code === "25006");
  });

  test("syncParentFacts: a revoked consent and a lowered limit written without an event reach the actor once", async () => {
    await q(`insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, $2, 'memory', 'test', false, 'test')`, [guardian, kid2]);
    await q(`insert into child_controls (child_id, daily_minutes) values ($1, 15) on conflict (child_id) do update set daily_minutes = 15, updated_at = now()`, [kid2]);
    const n = await C.syncParentFacts(kid2);
    assert.equal(n, 2, "consent + dailyMinutes");
    assert.equal(await C.syncParentFacts(kid2), 0, "a re-run is a duplicate no-op");
    await C.step(kid2);
    const st = (await one("select state from conductor_state where child_id = $1", [kid2])).state;
    assert.equal(st.consent.memory, false);
    assert.equal(st.limits.dailyMinutes, 15);
    assert.equal(await C.syncParentFacts(kid2), 0, "in line after the fold");
  });
});
