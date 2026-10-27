// Run by tests/r5-carried-checkin-db.test.mjs in its OWN process, against the real API in-process and a REAL Neon database:
// the TEST branch only (CONDUCTOR_TEST_DATABASE_URL; skips otherwise and refuses the production endpoint). Voice lane
// starts and empty / chip turns only, so no model call is made.
//   (1) a safeguarding incident in the last hours: the next start opens on the check-in (safeguard move in the lesson state,
//       helplines on the board, carry-on / stop chips, the Help sheet's lead), and the carry-on chip returns to the lesson;
//   (2) no incident, or one older than the window: the ordinary opening.
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
const TEST_ENV = (process.env.TAXILA_DB || fromEnvFile("TAXILA_DB")) === "test";
const SKIP = !TEST ? "CONDUCTOR_TEST_DATABASE_URL not set" : !TEST_ENV && PROD && hostOf(TEST) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
const RUN = randomUUID().slice(0, 8);

describe("check-in after a recent safeguarding incident (test branch)", { skip: SKIP, concurrency: false, timeout: 180_000 }, () => {
  let server, base, q, one, guardian, token;
  const call = async (path, { method = "GET", body } = {}) => {
    const r = await fetch(base + path, { method, headers: { cookie: `tx_session=${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const consent = (purpose) => q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [guardian, purpose]);
  const newChild = async (name) => {
    const id = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, $2, 4, 'hinglish', 'asha') returning id", [guardian, name])).id;
    await q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')
      on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 45`, [id]);
    return id;
  };
  const incident = (kid, family, hoursAgo) => q(`insert into incident(child_id, lesson_id, kind, severity, detail, at) values ($1, null, 'safeguarding', 'high', $2, now() - make_interval(hours => $3::int))`,
    [kid, { source: "predicate", family, at: "test" }, hoursAgo]);
  const start = (kid) => call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice", purpose: "practice" } });
  const stateOf = async (lid) => (await one("select state from lesson where id = $1", [lid])).state;

  before(async () => {
    process.env.DATABASE_URL = TEST;
    ({ q, one } = await import("../server/db.js"));
    const { handle } = await import("../server/index.js");
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    await q("delete from guardian where email like 'carried+%@test.invalid' and created_at < now() - interval '1 hour'");
    guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'carried') returning id", [`carried+${RUN}@test.invalid`])).id;
    const t = randomUUID() + randomUUID();
    await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(t).digest("hex"), guardian]);
    token = t;
    for (const p of ["core_tutoring", "memory", "learning_profile"]) await consent(p);
  });
  after(async () => {
    if (guardian) await q("delete from guardian where id = $1", [guardian]);
    server?.close();
  });

  test("an incident 3 hours ago: the start checks in; the carry-on chip returns to the lesson", async () => {
    const kid = await newChild("Meera");
    await incident(kid, "abuse", 3);
    const s = await start(kid);
    assert.equal(s.status, 201, JSON.stringify(s.body));
    assert.match(JSON.stringify(s.body.ui.whiteboard), /1098/);
    assert.match(JSON.stringify(s.body.ui.whiteboard), /14416/);
    assert.deepEqual((s.body.ui.chips ?? []).map((c) => c.id), ["safe:continue", "safe:stop"]);
    assert.equal(s.body.helpLead, "helpline", "after an abuse incident the helpline leads (the grown-up nearby may be who it was about)");
    // the voice lane is told the check-in, helplines included (spelled for speech: "one zero nine eight")
    assert.match(s.body.instructions ?? "", /fresh start soon after a hard moment/);
    assert.match(s.body.instructions ?? "", /one zero nine eight/);
    assert.match(s.body.instructions ?? "", /one four four one six/);
    const st = await stateOf(s.body.lessonId);
    assert.equal(st.safeguard?.carried, true);
    assert.equal(st.lastMove?.kind, "safeguard");
    const back = await call("/api/lesson/turn", { method: "POST", body: { lessonId: s.body.lessonId, childText: "", typed: true, chipId: "safe:continue", turnSeq: 1 } });
    assert.equal(back.status, 200, JSON.stringify(back.body));
    assert.notEqual(back.body.move.kind, "safeguard");
    assert.equal((await stateOf(s.body.lessonId)).safeguard, null);
    assert.equal((await q("select 1 from incident where child_id = $1", [kid])).length, 1, "the check-in writes no incident of its own");
    await call("/api/lesson/end", { method: "POST", body: { lessonId: s.body.lessonId } });
    // once per incident: the next lesson the same day opens as usual; a NEW incident checks in again
    const again = await start(kid);
    assert.equal(again.status, 201, JSON.stringify(again.body));
    assert.ok(!(await stateOf(again.body.lessonId)).safeguard, "already checked in for this incident");
    assert.ok(!again.body.helpLead);
    await call("/api/lesson/end", { method: "POST", body: { lessonId: again.body.lessonId } });
    await incident(kid, "self_harm", 0);
    const fresh = await start(kid);
    assert.equal((await stateOf(fresh.body.lessonId)).safeguard?.carried, true, "a new incident: a new check-in");
    assert.equal(fresh.body.helpLead, "grownup");
    await call("/api/lesson/end", { method: "POST", body: { lessonId: fresh.body.lessonId } });
  });

  test("no incident, or one older than the window (30 h): the ordinary opening", async () => {
    for (const hours of [null, 30]) {
      const kid = await newChild(hours ? "Asha" : "Neel");
      if (hours) await incident(kid, "self_harm", hours);
      const s = await start(kid);
      assert.equal(s.status, 201, JSON.stringify(s.body));
      assert.ok(!(await stateOf(s.body.lessonId)).safeguard, `hours ${hours}`);
      assert.ok(!s.body.helpLead);
      await call("/api/lesson/end", { method: "POST", body: { lessonId: s.body.lessonId } });
    }
  });

  // r5 QA D37 (14.3): the home never offers Continue for a lesson the server will not resume (an open safeguarding episode)
  test("a lesson parked inside an open safeguarding episode is not offered as Continue; the same lesson without one is", async () => {
    for (const open of [true, false]) {
      const kid = await newChild(open ? "Ira" : "Dev");
      const lid = (await one(`insert into lesson (child_id, topic_id, state) values ($1, 'c4-maths-ch05-t01', $2) returning id`,
        [kid, { mode: "cascade", turn: 2, safeguard: open ? { calm: 0, asked: false, kind: "self_harm" } : null }])).id;
      await q(`insert into turn (lesson_id, seq, speaker, text) values ($1, 1, 'teacher', 'hello'), ($1, 2, 'child', 'haan')`, [lid]);
      const plan = await call(`/api/child/plan?childId=${kid}`);
      assert.equal(plan.status, 200, JSON.stringify(plan.body));
      if (open) assert.notEqual(plan.body.state, "resume", "an open episode: the server refuses the resume, so the home must not offer it");
      else assert.equal(plan.body.state, "resume", "control: the same lesson with no episode is resumable");
      await q("update lesson set ended_at = now() where id = $1", [lid]);
    }
  });
});
