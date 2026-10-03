// Parent reports against a REAL Neon database: the TEST branch only (CONDUCTOR_TEST_DATABASE_URL, never the production
// endpoint; skips otherwise, and skips while sql/009_parent_report.sql is not applied there). Seeds one child's day,
// generates the daily note (Lane B stubbed), stores it once (idempotent), has the independent checker re-derive every
// claim from the cited rows, and checks the job handler's budget accounting on a real job row.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { Pool } from "@neondatabase/serverless";
import { generateReport, kitLookup, findReport } from "../server/reports/index.js";
import { checkReport } from "../server/reports/check.js";
import { runReportJob } from "../server/reports/jobs.js";
import { concepts } from "../evals/comprehension-sim/world.mjs";

const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const URL_ = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnvFile("DATABASE_URL");
const SKIP = !URL_ ? "CONDUCTOR_TEST_DATABASE_URL not set" : PROD && hostOf(URL_) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
const RUN = randomUUID().slice(0, 8);
const [A, B] = concepts();

describe("parent reports on Neon (test branch)", { skip: SKIP, concurrency: false, timeout: 180_000 }, () => {
  let pool, db, guardian, kid, ready = false;
  const at = (day, min) => new Date(Date.parse(`${day}T11:30:00.000Z`) + min * 60_000).toISOString();
  before(async () => {
    pool = new Pool({ connectionString: URL_, max: 3 });
    db = { q: async (text, params) => (await pool.query(text, params)).rows };
    ready = !!(await db.q("select to_regclass('parent_report') as t"))[0]?.t;
    if (!ready) return;
    await db.q("delete from guardian where email like 'reports-test+%@test.invalid' and created_at < now() - interval '1 hour'");
    guardian = (await db.q("insert into guardian (email, pw_hash, name) values ($1, 'x', 'reports-test') returning id", [`reports-test+${RUN}@test.invalid`]))[0].id;
    kid = (await db.q("insert into child (guardian_id, first_name, class_level, language_pref) values ($1, 'Tara', 5, 'hindi') returning id", [guardian]))[0].id;
    await db.q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, 'core_tutoring', 't', true, 't')", [guardian]);
    const l1 = (await db.q("insert into lesson (child_id, topic_id, started_at, ended_at) values ($1, $2, $3, $4) returning id", [kid, A.topicId, at("2026-09-14", 0), at("2026-09-14", 20)]))[0].id;
    const l2 = (await db.q("insert into lesson (child_id, topic_id, started_at, ended_at) values ($1, $2, $3, $4) returning id", [kid, A.topicId, at("2026-09-15", 0), at("2026-09-15", 31)]))[0].id;
    const rows = [
      [l1, "2026-09-14", 1, A.skillId, "teach", -1, true, null, null], [l1, "2026-09-14", 2, A.skillId, "item.open", 0, false, null, null],
      [l2, "2026-09-15", 1, A.skillId, "item.open", 0, false, null, null], [l2, "2026-09-15", 2, A.skillId, "item.open", 2, false, null, null],
      [l2, "2026-09-15", 3, A.skillId, "probe.teachback", 0, false, null, null],
      [l2, "2026-09-15", 4, B.skillId, "item.open", 4, false, B.misconceptions[0].id, B.misconceptions[0].id],
      [l2, "2026-09-15", 5, B.skillId, "item.open", 4, false, B.misconceptions[0].id, B.misconceptions[0].id],
      [l2, "2026-09-15", 6, B.skillId, "item.open", 0, false, null, B.misconceptions[0].id],
    ];
    for (const [i, [lid, day, min, sk, cls, o, teach, mis, disc]] of rows.entries()) {
      await db.q(`insert into kt_evidence (id, child_id, session_id, session_start_at, episode_id, occurred_at, skill_ids, cls, outcome, grader, grader_version, item_key,
          teach, misconception_id, discriminates, params_version, legal_mode_at_write) values ($1,$2,$3,$4,$5,$6,$7::text[],$8,$9,'code','t',$10,$11,$12,$13,'t','M1')`,
      [`rt-${RUN}-${i}`, kid, String(lid), at(day, 0), `ep${i}`, at(day, min), [sk], cls, o, teach ? "" : `k${i}`, teach, mis, disc]);
    }
    for (const [sk, display] of [[A.skillId, "learned_today"], [B.skillId, "practising"]]) {
      await db.q(`insert into kt_skill_state (child_id, skill_id, params_version, p_l, retention, n, flags, display, refresh, next_review_at, extra, legal_mode_at_write, updated_at)
        values ($1, $2, 't', 0.5, 1, 3, '{}', $3, false, $4, '{}', 'M1', now())`, [kid, sk, display, display === "practising" ? null : at("2026-09-18", 0)]);
    }
  });
  after(async () => {
    if (guardian) await db.q("delete from guardian where id = $1", [guardian]);
    if (kid) assert.equal(Number((await db.q("select count(*) as n from parent_report where child_id = $1", [kid]))[0].n), 0, "erasure cascades to parent_report");
    await pool?.end();
  });

  test("daily note: generated, stored once, every claim re-derived by the independent checker", async (t) => {
    if (!ready) return t.skip("parent_report is not migrated on the test branch (server/reports/sql/009_parent_report.sql)");
    let calls = 0;
    const llm = { chat: async (_dep, msgs) => { calls++; const segs = JSON.parse(msgs[1].content).segments; return { json: { order: segs.map((x) => ({ kind: "segment", id: x.id })) }, usage: { prompt_tokens: 800, completion_tokens: 120 } }; } };
    const out = await generateReport(kid, { cadence: "daily", period: "2026-09-15" }, { db, llm });
    assert.ok(out.created && out.id);
    const first = calls;
    assert.ok(first >= 1);
    const again = await generateReport(kid, { cadence: "daily", period: "2026-09-15" }, { db, llm });
    assert.equal(again.id, out.id); assert.equal(again.existing, true); assert.equal(calls, first, "a stored report is never re-paid for");
    const row = await findReport(db, kid, "daily", "2026-09-15");
    assert.ok(["A", "B"].includes(row.meta.laneB.lane));
    const shapes = row.claims.map((c) => c.shapeId);
    assert.deepEqual(shapes, ["header.daily", "st.delayed", "row.work", "tricky.mixup_next"]);
    assert.ok(row.renders.hi.lines.some((l) => /दिन बाद फिर आया/.test(l.text)));
    assert.ok(!Object.values(row.renders).some((R) => R.lines.some((l) => /\bagain\b|दिन बाद भी|din baad bhi/.test(l.text))), "no 'right again' claim");
    const c = await checkReport(db, row, kitLookup);
    assert.equal(c.supported, c.total, JSON.stringify(c.claims.filter((x) => !x.ok)));
    assert.equal(c.lines.mapped, c.lines.total);
    // a claim pointed at another child's row is unsupported
    const other = (await db.q("select id from kt_evidence where child_id <> $1 limit 1", [kid]))[0];
    if (other) {
      const bad = { ...row, claims: row.claims.map((x) => (x.shapeId === "row.work" ? { ...x, factIds: [...x.factIds.slice(1), `kt_evidence:${other.id}`] } : x)) };
      assert.ok(!(await checkReport(db, bad, kitLookup)).claims.find((x) => x.shapeId === "row.work").ok);
    }
  });

  test("job handler: spend is added to the real job row, fenced by attempt; a quiet day is skipped, not failed", async (t) => {
    if (!ready) return t.skip("parent_report not migrated on the test branch");
    const job = (await db.q(`insert into job (kind, child_id, idem_key, input, lane, status, attempts, budget_micro_usd, correlation_id)
      values ('report.daily', $1, $2, $3, 'fast', 'running', 1, 20000, 'reports-test') returning *`, [kid, `report.daily:${kid}:2026-09-14:${RUN}`, { day: "2026-09-14" }]))[0];
    const llm = { chat: async (_d, msgs) => ({ json: { order: JSON.parse(msgs[1].content).segments.map((x) => ({ kind: "segment", id: x.id })) }, usage: { prompt_tokens: 1000, completion_tokens: 100 } }) };
    const ref = await runReportJob(job, { heartbeat: async () => ({ alive: true, cancelRequested: false }) }, "daily", { db, llm });
    assert.match(ref, /^parent_report:\d+$/);
    assert.equal(Number((await db.q("select spent_micro_usd from job where id = $1", [job.id]))[0].spent_micro_usd), 1000 * 4 + 100 * 20);
    const quiet = await runReportJob({ ...job, input: { day: "2026-09-16" } }, { heartbeat: async () => ({ alive: true, cancelRequested: false }) }, "daily", { db, llm });
    assert.equal(quiet, "skipped:no_activity");
  });
});
