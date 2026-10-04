// Run by tests/child-routes-db.test.mjs in its OWN process. The child surfaces' server truth (PRODUCT-DESIGN-V2 §6.3.3,
// §3.8; audit #9: both 404 in production), against the real API in-process and a REAL Neon database — the TEST branch
// only (CONDUCTOR_TEST_DATABASE_URL; skips otherwise and refuses the production endpoint). No model call.
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

describe("child routes (test branch)", { skip: SKIP, concurrency: false, timeout: 180_000 }, () => {
  let server, base, q, one, guardian, other, kid, kid3, token, otherToken, topic;
  const call = async (path, { method = "GET", body, tok = token } = {}) => {
    const r = await fetch(base + path, { method, headers: { ...(tok ? { cookie: `tx_session=${tok}` } : {}), ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const session = async (gid) => {
    const t = randomUUID() + randomUUID();
    await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(t).digest("hex"), gid]);
    return t;
  };
  const consent = (gid, purpose, granted) => q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', $3, 't')", [gid, purpose, granted]);
  const hours = (from, to) => q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 30, $2, $3)
    on conflict (child_id) do update set hours_start = excluded.hours_start, hours_end = excluded.hours_end, daily_minutes = 30`, [kid, from, to]);

  before(async () => {
    process.env.DATABASE_URL = TEST;
    ({ q, one } = await import("../server/db.js"));
    const { handle } = await import("../server/index.js");
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    await q("delete from guardian where email like 'child-route+%@test.invalid' and created_at < now() - interval '1 hour'");
    guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'child-route') returning id", [`child-route+${RUN}@test.invalid`])).id;
    other = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'child-route') returning id", [`child-route+${RUN}-b@test.invalid`])).id;
    token = await session(guardian);
    otherToken = await session(other);
    kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Kabir', 8, 'hinglish', 'arjun') returning id", [guardian])).id;
    kid3 = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Riya', 3, 'hinglish', 'asha') returning id", [guardian])).id;
    await consent(guardian, "core_tutoring", true);
    await consent(guardian, "learning_profile", true);
    await hours("00:00", "23:59");
    const { nextTopicFor } = await import("../server/content/next-topic.js");
    topic = await nextTopicFor({ id: kid, class_level: 8 });
  });
  after(async () => {
    if (guardian) await q("delete from guardian where id = any($1::uuid[])", [[guardian, other]]);
    server?.close();
  });

  test("fences: 401 without a session, 403 for another guardian's child", async () => {
    assert.equal((await call(`/api/child/plan?childId=${kid}`, { tok: null })).status, 401);
    assert.equal((await call(`/api/child/plan?childId=${kid}`, { tok: otherToken })).status, 403);
    assert.equal((await call(`/api/child/map?childId=${kid}`, { tok: otherToken })).status, 403);
    assert.equal((await call(`/api/child/plan?childId=not-a-uuid`)).status, 400);
  });

  test("plan: a first-time child gets 'first' with today's topic and the one teacher record", async () => {
    const r = await call(`/api/child/plan?childId=${kid}`);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.state, "first");
    assert.equal(r.body.homeState, "default");
    assert.equal(r.body.topic.id, topic.id);
    assert.ok(r.body.topic.shortTitle.length <= 24);
    assert.equal(r.body.teacher.name, "Arjun");
    assert.equal(r.body.teacher.pronouns.subject, "he");
    assert.deepEqual(r.body.surfaces, { map: true, notebook: true, resume: true });
    const req = await call("/api/lesson/request", { method: "POST", body: { cid: kid } });
    assert.deepEqual(req.body, { granted: true, topicId: topic.id });
  });

  test("plan: an open lesson with a child turn → resume (with its pinned question); none under 'Only this session'", async () => {
    const st = { phase: "practice", minutes: 3, lastUi: { ask: { text: "13 ka square kitna hai?", itemId: "x" } }, ctx: { lang: "hinglish" } };
    const l = (await one("insert into lesson (child_id, topic_id, state) values ($1, $2, $3) returning id", [kid, topic.id, st])).id;
    await q("insert into turn (lesson_id, seq, speaker, text) values ($1, 1, 'teacher', 'Namaste'), ($1, 2, 'child', '169')", [l]);
    let r = await call(`/api/child/plan?childId=${kid}`);
    assert.equal(r.body.state, "resume");
    assert.equal(r.body.plan.openLesson, l);
    assert.equal(r.body.resume.ask, "13 ka square kitna hai?");
    await consent(guardian, "learning_profile", false);
    r = await call(`/api/child/plan?childId=${kid}`);
    assert.equal(r.body.state, "start", "an existing child with no Continue: today's lesson");
    assert.deepEqual(r.body.surfaces, { map: false, notebook: false, resume: false });
    const m = await call(`/api/child/map?childId=${kid}`);
    assert.equal(m.body.hidden, true);
    await consent(guardian, "learning_profile", true);
    await q("update lesson set ended_at = now() - interval '2 days', started_at = now() - interval '2 days' where id = $1", [l]);
  });

  test("plan: a lesson finished today → done, with today's DidCards from the graded turns; the cap → capped", async () => {
    const did = [{ kind: "item", itemId: "a", ask: "13 ka square?", answer: "169", verdict: "correct", withHelp: false, verified: true, seq: 4, turn: 2 }];
    const l = (await one("insert into lesson (child_id, topic_id, state, ended_at) values ($1, $2, $3, now()) returning id", [kid, topic.id, { minutes: 12, did, ctx: { nextTitle: "Square roots" } }])).id;
    let r = await call(`/api/child/plan?childId=${kid}`);
    assert.equal(r.body.state, "done");
    assert.equal(r.body.homeState, "done");
    assert.equal(r.body.today.lessonId, l);
    assert.deepEqual(r.body.today.summary.cards.map((c) => [c.answer, c.tick]), [["169", true]]);
    assert.equal(r.body.today.summary.face, "warm");
    assert.equal((await call("/api/lesson/request", { method: "POST", body: { cid: kid } })).body.granted, false, "never 'one more' after done");
    const s = await call(`/api/lesson/summary?lessonId=${l}`);
    assert.equal(s.status, 200);
    assert.equal(s.body.did.nextTitle, "Square roots");
    assert.equal((await call(`/api/lesson/summary?lessonId=${l}`, { tok: otherToken })).status, 403);
    await q("update lesson set state = jsonb_set(state, '{minutes}', '31') where id = $1", [l]);
    r = await call(`/api/child/plan?childId=${kid}`);
    assert.equal(r.body.state, "capped");
    assert.equal(r.body.capRemaining, 0);
    await q("delete from lesson where id = $1", [l]);
  });

  test("plan: outside the allowed hours → resting, with when lessons open again", async () => {
    const ist = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    const h = (Number(ist.slice(0, 2)) + 2) % 24;
    const from = `${String(h).padStart(2, "0")}:00`, to = `${String(h).padStart(2, "0")}:30`;
    await hours(from, to);
    const r = await call(`/api/child/plan?childId=${kid}`);
    assert.equal(r.body.state, "resting");
    assert.equal(r.body.opensAt, from);
    await hours("00:00", "23:59");
  });

  test("start: POST /api/lesson/start enforces the plan (cap, hours, done); accidental lessons neither count nor linger", async () => {
    const mine = () => q("select id from lesson where child_id = $1 and started_at > now() - interval '1 hour'", [kid]);
    // an accidental lesson today (nothing graded, seconds long) is not "Done for today"
    await one("insert into lesson (child_id, topic_id, state, ended_at) values ($1, $2, $3, now())", [kid, topic.id, { minutes: 0.2, did: [] }]);
    assert.equal((await call(`/api/child/plan?childId=${kid}`)).body.state, "start");
    // a stale open lesson the child never spoke in is closed by the next start, not left open beside it
    const stale = (await one("insert into lesson (child_id, topic_id, state, started_at) values ($1, $2, $3, now() - interval '10 minutes') returning id",
      [kid, topic.id, { minutes: 0, ctx: { lang: "hinglish" } }])).id;
    let r = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice" } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const closed = await one("select ended_at, state from lesson where id = $1", [stale]);
    assert.ok(closed.ended_at, "the zero-turn lesson is closed");
    assert.equal(closed.state.abandoned, true);
    assert.equal((await call(`/api/child/plan?childId=${kid}`)).body.state, "start", "an abandoned lesson is not done either");
    await q("update lesson set ended_at = now() where id = $1", [r.body.lessonId]);
    // done today: no "one more" lesson by a direct call; Practice and Ask still open (§6.3.3 "Practise something")
    const did = [{ kind: "item", itemId: "a", ask: "13 ka square?", answer: "169", verdict: "correct", withHelp: false, verified: true, seq: 4, turn: 2 }];
    const done = (await one("insert into lesson (child_id, topic_id, state, ended_at) values ($1, $2, $3, now()) returning id", [kid, topic.id, { minutes: 12, did }])).id;
    r = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice" } });
    assert.equal(r.status, 409, JSON.stringify(r.body));
    assert.equal(r.body.state, "done");
    r = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice", purpose: "practice" } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    await q("update lesson set ended_at = now() where id = $1", [r.body.lessonId]);
    // the daily cap: nothing starts, practice included
    await q("update lesson set state = jsonb_set(state, '{minutes}', '31') where id = $1", [done]);
    r = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice", purpose: "practice" } });
    assert.equal(r.status, 409);
    assert.equal(r.body.state, "capped");
    assert.equal(r.body.capRemaining, 0);
    await q("delete from lesson where id = $1", [done]);
    // outside the parent's lesson hours: nothing starts
    const ist = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    const h = String((Number(ist.slice(0, 2)) + 2) % 24).padStart(2, "0");
    await hours(`${h}:00`, `${h}:30`);
    r = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice" } });
    assert.equal(r.status, 409);
    assert.equal(r.body.state, "resting");
    assert.equal(r.body.opensAt, `${h}:00`);
    await hours("00:00", "23:59");
    await q("delete from lesson where id = any($1::uuid[])", [(await mine()).map((x) => x.id)]);
  });

  test("map: the class syllabus with the ledger's shapes; Garden for class 3, Sky for class 8", async () => {
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const sk = kitFromFile(getTopic(topic.id)).skills[0];
    await q(`insert into skill_state (child_id, skill_id, p_known, status, attempts, correct_unaided) values ($1, $2, 0.8, 'learned_today', 3, 2)
      on conflict (child_id, skill_id) do update set status = 'learned_today'`, [kid, sk.id]);
    // W2-A one claim source: a state shows only over a scored engine row (kt_evidence), as a real lesson writes both
    await q(`insert into kt_evidence (id, child_id, session_id, session_start_at, episode_id, occurred_at, skill_ids, cls, outcome, grader, grader_version,
        item_key, params_version, legal_mode_at_write) values ($1, $2, 'w2a-fixture', now(), 'w2a-fixture:i1', now(), $3, 'item.open', 0, 'code', 'test', 'i1', 'v1', 'M1')
      on conflict (id) do nothing`, [`w2a-fixture:${kid}:${sk.id}`, kid, [sk.id]]);
    const r = await call(`/api/child/map?childId=${kid}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.mode, "sky");
    assert.equal(r.body.hidden, false);
    assert.equal(r.body.empty, false);
    const row = r.body.skills.find((x) => x.skillId === sk.id);
    assert.deepEqual([row.state, row.status], ["got_it", "learned_today"]);
    assert.ok(r.body.subjects.some((s) => s.chapters.some((c) => c.here)), "your class is here");
    assert.ok(r.body.skills.every((x) => x.skillId && x.title && x.status), "the shape src/child/api.ts normaliseSkills reads");
    const g = await call(`/api/child/map?childId=${kid3}`);
    assert.equal(g.body.mode, "garden");
    assert.equal(g.body.empty, true);
  });

  test("teacher: the server is the one source (child, and class before a child exists)", async () => {
    assert.equal((await call(`/api/child/teacher?childId=${kid3}`)).body.teacher.name, "Asha");
    const c = await call("/api/child/teacher?classLevel=6");
    assert.equal(c.status, 200);
    assert.equal(c.body.teacher.id, "arjun");
    assert.ok(c.body.eligible.every((t) => t.pronouns?.subject));
    assert.equal((await call("/api/child/teacher?classLevel=12")).status, 400);
  });
});
