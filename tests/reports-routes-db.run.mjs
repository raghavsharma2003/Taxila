// Run by tests/reports-routes-db.test.mjs in its OWN process (npm test imports every *.test.mjs into one process,
// where server/db.js's cached driver and other files' fetch stubs are shared: this file points DATABASE_URL at the
// test branch, which must never leak into, or be overridden by, another suite).
// Parent report ROUTES under a Conductor safety hold, against the real API in-process and a REAL Neon database: the
// TEST branch only (CONDUCTOR_TEST_DATABASE_URL; skips otherwise, refuses the production endpoint, and skips while
// db/migrations/010_parent_report.sql is not applied there). Review finding: the hold was enforced only on the job path, so
// GET /api/parent/report still computed a live preview and stored scripts stayed playable during a safety incident.
// Decision reports-safety-hold-read-side: during a hold → no preview, no Listen, no note stored after the hold began;
// notes stored before it stay readable as text.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { existsSync, readFileSync } from "fs";
import { createHash, randomUUID } from "crypto";

const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnvFile("DATABASE_URL");
const SKIP = !TEST ? "CONDUCTOR_TEST_DATABASE_URL not set" : PROD && hostOf(TEST) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
const RUN = randomUUID().slice(0, 8);

describe("parent report routes during a safety hold (test branch)", { skip: SKIP, concurrency: false, timeout: 180_000 }, () => {
  let server, base, q, one, gen, guardian, kid, token, ready = false, before1, after1, day1, day2, today;
  const call = async (path) => {
    const r = await fetch(base + path, { headers: { cookie: `tx_session=${token}` } });
    const ct = r.headers.get("content-type") || "";
    return { status: r.status, body: ct.includes("json") ? await r.json() : null };
  };
  before(async () => {
    process.env.DATABASE_URL = TEST;                       // server/db.js reads it lazily: this process talks to the test branch only
    ({ q, one } = await import("../server/db.js"));
    ready = !!(await one("select to_regclass('parent_report') as t"))?.t;
    if (!ready) return;
    const { handle } = await import("../server/index.js");
    ({ generateReport: gen } = await import("../server/reports/index.js"));
    const { learningDay } = await import("../server/conductor/clock.js");
    const { addDays } = await import("../server/conductor/clock.js");
    const { concepts } = await import("../evals/comprehension-sim/world.mjs");
    const [A] = concepts();
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    await q("delete from guardian where email like 'reports-route+%@test.invalid' and created_at < now() - interval '1 hour'");
    guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'reports-route') returning id", [`reports-route+${RUN}@test.invalid`])).id;
    await q("insert into guardian_pin (guardian_id, pin_hash) values ($1, 'x')", [guardian]);
    token = randomUUID() + randomUUID();
    await q("insert into auth_session (token_hash, guardian_id, expires_at, parent_unlocked_until) values ($1, $2, now() + interval '1 day', now() + interval '30 minutes')",
      [createHash("sha256").update(token).digest("hex"), guardian]);
    kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref) values ($1, 'Isha', 5, 'english') returning id", [guardian])).id;
    await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, 'core_tutoring', 't', true, 't')", [guardian]);
    today = learningDay(new Date(), "Asia/Kolkata");
    day1 = addDays(today, -1); day2 = addDays(today, -2);
    // one ended lesson with three practice rows on each of today, day-1 and day-2 (12:00 IST, inside the learning day)
    let i = 0;
    for (const d of [today, day1, day2]) {
      const st = new Date(`${d}T06:30:00.000Z`);
      const l = (await one("insert into lesson (child_id, topic_id, started_at, ended_at) values ($1, $2, $3, $4) returning id", [kid, A.topicId, st.toISOString(), new Date(st.getTime() + 20 * 60_000).toISOString()])).id;
      for (const o of [0, 2, 0]) {
        i++;
        await q(`insert into kt_evidence (id, child_id, session_id, session_start_at, episode_id, occurred_at, skill_ids, cls, outcome, grader, grader_version, item_key,
            teach, params_version, legal_mode_at_write) values ($1,$2,$3,$4,$5,$6,$7::text[],'item.open',$8,'code','t',$9,false,'t','M1')`,
        [`rr-${RUN}-${i}`, kid, String(l), st.toISOString(), `ep${i}`, new Date(st.getTime() + i * 60_000).toISOString(), [A.skillId], o, `k${i}`]);
      }
    }
    before1 = await gen(kid, { cadence: "daily", period: day1 }, { db: { q }, llm: null });
  });
  after(async () => {
    if (guardian) await q("delete from guardian where id = $1", [guardian]);
    server?.close();
  });

  test("no hold: today's preview is shown", async (t) => {
    if (!ready) return t.skip("parent_report is not migrated on the test branch");
    const r = await call(`/api/parent/report?childId=${kid}&cadence=daily`);
    assert.equal(r.status, 200);
    assert.ok(r.body.report?.preview, JSON.stringify(r.body).slice(0, 200));
    const list = await call(`/api/parent/reports?childId=${kid}`);
    assert.equal(list.body.held, false);
    assert.ok(list.body.reports.some((x) => x.id === before1.id));
  });

  test("hold: no preview, no Listen, no note stored after the hold began; an earlier note stays readable as text", async (t) => {
    if (!ready) return t.skip("parent_report is not migrated on the test branch");
    const since = new Date().toISOString();
    await q(`insert into conductor_state (child_id, state_v, mode, state) values ($1, 1, 'safety_hold', $2)
      on conflict (child_id) do update set mode = 'safety_hold', state = excluded.state`, [kid, { mode: "safety_hold", modeSince: since, hold: { incidentId: "inc-1", level: "high" } }]);
    await new Promise((r) => setTimeout(r, 50));
    after1 = await gen(kid, { cadence: "daily", period: day2 }, { db: { q }, llm: null });   // e.g. a job that was already running
    assert.ok(after1.created);
    const pv = await call(`/api/parent/report?childId=${kid}&cadence=daily`);
    assert.equal(pv.status, 200);
    assert.equal(pv.body.report, null);
    assert.equal(pv.body.held, true);
    const wk = await call(`/api/parent/report?childId=${kid}&cadence=weekly`);
    assert.equal(wk.body.report, null);
    const list = await call(`/api/parent/reports?childId=${kid}`);
    assert.equal(list.body.held, true);
    assert.ok(list.body.reports.some((x) => x.id === before1.id), "a note from before the hold stays listed");
    assert.ok(!list.body.reports.some((x) => x.id === after1.id), "a note stored after the hold began is not listed");
    const old = await call(`/api/parent/report?childId=${kid}&id=${before1.id}`);
    assert.equal(old.status, 200);
    assert.equal(old.body.report.held, true);
    for (const R of Object.values(old.body.report.renders)) assert.equal(R.voice, null, "no spoken script during a hold");
    assert.equal((await call(`/api/parent/report?childId=${kid}&id=${after1.id}`)).status, 404);
    const speak = await call(`/api/parent/speak?what=report&childId=${kid}&id=${before1.id}&lang=en`);
    assert.equal(speak.status, 409, "no Listen during a hold");
    const claimId = old.body.report.claims[0].id;
    assert.equal((await call(`/api/parent/report/evidence?childId=${kid}&claimId=${encodeURIComponent(claimId)}&cadence=daily&period=${today}`)).status, 404, "no live preview evidence");
    const ev = await call(`/api/parent/report/evidence?childId=${kid}&claimId=${encodeURIComponent(claimId)}&id=${before1.id}`);
    assert.equal(ev.status, 200);
    assert.equal(ev.body.claim.rule, undefined, "the internal rule string never reaches the client");
    assert.ok(ev.body.claim.how?.en && ev.body.claim.how?.hi && ev.body.claim.how?.hinglish);
    assert.equal(ev.body.memories, undefined);
    // the hold clears → the preview is back
    await q("update conductor_state set mode = 'free' where child_id = $1", [kid]);
    assert.ok((await call(`/api/parent/report?childId=${kid}&cadence=daily`)).body.report?.preview);
  });
});
