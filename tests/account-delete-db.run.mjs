// Run by tests/account-delete-db.test.mjs in its OWN process (it points DATABASE_URL at the TEST branch, which must
// never leak into another suite). B3 (PRODUCT-DESIGN-V2 §6.5, B3-A5) against the real API in-process and a REAL Neon
// database: the TEST branch only (CONDUCTOR_TEST_DATABASE_URL; skips when unset, refuses the production endpoint).
//   1. the new parent payloads on real Postgres: overview (the G-PARENT-1 headline, too-early, next lesson, counted
//      lessons), lessons (a 1-minute visit is listed, not counted), the lesson card, progress, the export;
//   2. the claim gate THROUGH the router (fixer: the mocked battery and the pure sim never touched homeData's SQL):
//      headline chip == /api/parent/evidence state for the same skill, for practising AND can_now; can_now falls away
//      when the newest row is a miss; no skill is named with two states on one page (headline vs Try at home);
//   3. the safety alert: a raw safeguarding incident, a safety hold or a held/pending safety notice → alert null; only a
//      notice the protocol RELEASED (outbox row sent) shows the card;
//   4. erasure and safeguarding: deletion (account and one child) is DEFERRED (409 erase_review, nothing deleted, one
//      content-free erase_deferred audit row) while an incident is unhandled, a child is in safety_hold or a safety
//      notice is pending; once handled, the incident row SURVIVES the erasure, detached (child_id null) and stamped;
//   5. account deletion: refused without the confirm step, with a wrong password (nothing deleted), or with the corner
//      locked; then the real thing: 200 + receipt, the guardian, both children and every child row gone, every session
//      gone, and ONE audit row left for the account with no content.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";

const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnvFile("DATABASE_URL");
const SKIP = !TEST ? "CONDUCTOR_TEST_DATABASE_URL not set" : PROD && hostOf(TEST) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
const RUN = randomUUID().slice(0, 8);
const PW = `del-pw-${RUN}-ok`;
const SKILL = "c5-maths-ch01-t01-s1", TOPIC = "c5-maths-ch01-t01";

describe("B3 parent payloads and account deletion (test branch)", { skip: SKIP, concurrency: false, timeout: 240_000 }, () => {
  let server, base, q, one, cookie = "", guardian, kids = [], lessonLong, lessonShort;
  const call = async (method, path, body, ck = cookie) => {
    const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(ck ? { cookie: ck } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const set = r.headers.get("set-cookie");
    if (set && ck === cookie) cookie = set.split(";")[0].endsWith("=") ? "" : set.split(";")[0];
    const ct = r.headers.get("content-type") || "";
    return { status: r.status, body: ct.includes("json") ? await r.json() : null, headers: r.headers };
  };
  before(async () => {
    process.env.DATABASE_URL = TEST;
    ({ q, one } = await import("../server/db.js"));
    const { handle } = await import("../server/index.js");
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    await q("delete from guardian where email like 'b3-del+%@taxila.test' and created_at < now() - interval '1 hour'");
    const s = await call("POST", "/api/auth/signup", { email: `b3-del+${RUN}@taxila.test`, password: PW, name: "B3 Delete", isGuardianAdult: true });
    assert.equal(s.status, 201, JSON.stringify(s.body));
    guardian = s.body.guardian.id;
    for (const [firstName, classLevel] of [["Riya", 5], ["Kabir", 8]]) {
      const c = await call("POST", "/api/children", { firstName, classLevel, board: "cbse" });
      assert.equal(c.status, 201, JSON.stringify(c.body));
      kids.push(c.body.child.id);
    }
    assert.equal((await call("POST", "/api/consent", { childId: null, grants: { core_tutoring: true, learning_profile: true, memory: false } })).status, 200);
    // Riya: one long lesson with three checks of one skill (right on her own, then two misses), one 1-minute visit
    lessonLong = (await one(`insert into lesson (child_id, topic_id, started_at, ended_at, state) values ($1, $2, now() - interval '2 days', now() - interval '2 days' + interval '20 minutes', $3) returning id`,
      [kids[0], TOPIC, { did: [{ kind: "item", itemId: "i1", ask: "Which is bigger, 4,520 or 4,250?", answer: "4,520", verdict: "correct", verified: true, withHelp: false, turn: 1, seq: 3 }], minutes: 20 }])).id;
    lessonShort = (await one(`insert into lesson (child_id, topic_id, started_at, ended_at) values ($1, $2, now() - interval '1 day', now() - interval '1 day' + interval '1 minute') returning id`, [kids[0], TOPIC])).id;
    const t1 = (await one("insert into turn (lesson_id, seq, speaker, text) values ($1, 1, 'child', 'four thousand five hundred twenty is bigger') returning id", [lessonLong])).id;
    for (const [i, o, h] of [[0, "correct", 0], [1, "incorrect", 0], [2, "partial", 1]]) {
      await q("insert into evidence (child_id, lesson_id, skill_id, probe, outcome, hints_used, turn_id, at) values ($1,$2,$3,'P15',$4,$5,$6, now() - interval '2 days' + ($7 || ' minutes')::interval)",
        [kids[0], lessonLong, SKILL, o, h, i === 0 ? t1 : null, String(i)]);
    }
    await q("insert into skill_state (child_id, skill_id, p_known, status, attempts, correct_unaided, last_seen) values ($1, $2, 0.4, 'practising', 3, 1, now() - interval '2 days')", [kids[0], SKILL]);
    // PIN set on the fresh onboarding session leaves the corner LOCKED; unlock it like the parent would
    assert.equal((await call("POST", "/api/parent/pin", { pin: "2580" })).status, 200);
  });
  after(async () => {
    if (guardian) await q("delete from guardian where id = $1", [guardian]).catch(() => {});
    if (guardian) await q("delete from audit where guardian_id = $1", [guardian]).catch(() => {});
    server?.close();
  });

  test("locked corner: account deletion is refused and nothing is touched", async () => {
    const r = await call("DELETE", "/api/account", { password: PW, confirm: true });
    assert.equal(r.status, 403);
    assert.equal(r.body.gate, "locked");
    assert.ok(await one("select 1 from guardian where id = $1", [guardian]));
    assert.equal((await call("POST", "/api/parent/unlock", { pin: "2580" })).status, 200);
  });

  test("overview on real Postgres: the gated headline, counted lessons, next lesson", async () => {
    const r = await call("GET", `/api/parent/overview?childId=${kids[0]}`);
    assert.equal(r.status, 200, JSON.stringify(r.body).slice(0, 300));
    const d = r.body;
    // 1 counted lesson ever (the 1-minute visit is not a lesson) → "first", and never a still-practising claim
    assert.equal(d.headline.kind, "first");
    assert.equal(d.headline.practising, null);
    assert.equal(d.headline.firstTopic.id, TOPIC);
    assert.equal(d.week.lessons, 1, "the 1-minute visit is not counted");
    assert.ok(d.week.minutes >= 20 && d.week.minutes <= 21);
    assert.ok(d.next === null || typeof d.next.state === "string");
    assert.ok(Array.isArray(d.recent) && d.recent.length === 1);
    assert.equal(d.headline.profileKept, true);
    // a second counted lesson with two more misses → the skill now has ≥ 2 non-unaided attempts in 14 days: practising may be said
    const l2 = (await one(`insert into lesson (child_id, topic_id, started_at, ended_at) values ($1, $2, now() - interval '3 hours', now() - interval '2 hours') returning id`, [kids[0], TOPIC])).id;
    await q("insert into evidence (child_id, lesson_id, skill_id, probe, outcome, hints_used) values ($1,$2,$3,'P15','incorrect',0)", [kids[0], l2, SKILL]);
    await q("update skill_state set last_seen = now() where child_id = $1", [kids[0]]);
    const r2 = (await call("GET", `/api/parent/overview?childId=${kids[0]}`)).body;
    assert.equal(r2.headline.kind, "claims");
    assert.equal(r2.headline.practising?.skillId, SKILL);
    assert.equal(r2.headline.practising.key, "practising");
    assert.ok(r2.headline.practising.rows.length >= 4);
    // the sheet shows the same state
    const ev = (await call("GET", `/api/parent/evidence?childId=${kids[0]}&skill=${SKILL}`)).body;
    assert.equal(ev.state.key, r2.headline.practising.key);
    // the read-aloud says the page's sentences
    const sp = await call("GET", `/api/parent/speak?what=home&childId=${kids[0]}`);
    assert.ok([200, 502, 429].includes(sp.status), `speak ${sp.status}`);
  });

  test("lessons, the lesson card, progress", async () => {
    const ls = (await call("GET", `/api/parent/lessons?childId=${kids[0]}`)).body.lessons;
    const short = ls.find((l) => l.id === lessonShort), long = ls.find((l) => l.id === lessonLong);
    assert.equal(short.counted, false); assert.equal(long.counted, true);
    const card = (await call("GET", `/api/parent/lesson?childId=${kids[0]}&lessonId=${lessonLong}`)).body;
    assert.equal(card.did.cards[0].answer, "4,520");
    assert.equal(card.did.cards[0].tick, true);
    assert.equal(card.transcriptPolicy, "on_request", "class 5: the word-for-word conversation is not shown");
    assert.equal(card.transcript, null);
    assert.equal(card.quote, "four thousand five hundred twenty is bigger");
    const pr = (await call("GET", `/api/parent/syllabus?childId=${kids[0]}`)).body;
    assert.ok(pr.header.topics > 10 && typeof pr.header.chaptersStarted === "number" && typeof pr.header.secure === "number");
    assert.equal(pr.profileKept, true);
  });

  test("claim gate through the router: can_now chip == evidence state; a newer miss removes it; one state per skill per page", async () => {
    // Kabir: two counted lessons; skill K at Got it with three rows, newest right on his own
    const K = "c8-maths-ch01-t01-s1";
    const la = (await one(`insert into lesson (child_id, topic_id, started_at, ended_at) values ($1, 'c8-maths-ch01-t01', now() - interval '3 days', now() - interval '3 days' + interval '15 minutes') returning id`, [kids[1]])).id;
    const lb = (await one(`insert into lesson (child_id, topic_id, started_at, ended_at) values ($1, 'c8-maths-ch01-t01', now() - interval '1 day', now() - interval '1 day' + interval '15 minutes') returning id`, [kids[1]])).id;
    for (const [l, o, h, ago] of [[la, "incorrect", 0, "3 days"], [la, "correct", 1, "3 days"], [lb, "correct", 0, "1 day"]]) {
      await q("insert into evidence (child_id, lesson_id, skill_id, probe, outcome, hints_used, at) values ($1,$2,$3,'P15',$4,$5, now() - ($6)::interval + interval '5 minutes')", [kids[1], l, K, o, h, ago]);
    }
    await q("insert into skill_state (child_id, skill_id, p_known, status, attempts, correct_unaided, last_seen) values ($1, $2, 0.9, 'learned_today', 3, 1, now() - interval '1 day')", [kids[1], K]);
    const d = (await call("GET", `/api/parent/overview?childId=${kids[1]}`)).body;
    assert.equal(d.headline.kind, "claims", JSON.stringify(d.headline).slice(0, 300));
    assert.equal(d.headline.canNow?.skillId, K);
    const ev = (await call("GET", `/api/parent/evidence?childId=${kids[1]}&skill=${K}`)).body;
    assert.equal(ev.state.key, d.headline.canNow.key, "the headline chip is the evidence sheet's state");
    assert.equal(ev.state.level, d.headline.canNow.level);
    assert.equal(ev.skill.label, d.headline.canNow.label, "one parent name per skill on the headline and the sheet");
    // one state per skill per page: Try at home never names the headline's can_now skill as "practising"
    for (const o of [d, (await call("GET", `/api/parent/overview?childId=${kids[0]}`)).body]) {
      const named = [o.headline.canNow, o.headline.practising].filter(Boolean);
      if (o.tryAtHome?.skillId) for (const c of named) assert.ok(c.skillId !== o.tryAtHome.skillId || c.kind === "practising", "two states for one skill on the home");
    }
    // a newer miss: the sheet's newest row is "Not yet", so "can now" may not stand over it
    await q("insert into evidence (child_id, lesson_id, skill_id, probe, outcome, hints_used, at) values ($1,$2,$3,'P15','incorrect',0, now() - interval '1 day' + interval '10 minutes')", [kids[1], lb, K]);
    const d2 = (await call("GET", `/api/parent/overview?childId=${kids[1]}`)).body;
    assert.equal(d2.headline.canNow, null, "can_now over a newest 'Not yet' row");
    // Progress groups the checked skills itself now (no overview call), with the sheet's state
    const pr = (await call("GET", `/api/parent/syllabus?childId=${kids[1]}`)).body;
    const sk = pr.subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics.flatMap((t) => t.skills))).find((x) => x.skillId === K);
    assert.equal(sk?.key, ev.state.key);
  });

  test("safety alert: never from a raw incident, a hold or a held notice; only a released notice shows it", async () => {
    const alertNow = async () => (await call("GET", `/api/parent/overview?childId=${kids[0]}`)).body.alert;
    const inc = (await one("insert into incident (child_id, kind, severity, detail) values ($1, 'safeguarding', 'high', $2) returning id", [kids[0], { source: "predicate", family: "abuse" }])).id;
    assert.equal(await alertNow(), null, "a raw incident (familyImplicated unknown) never reaches the family");
    await q("insert into conductor_state (child_id, state_v, mode, state) values ($1, 1, 'safety_hold', $2) on conflict (child_id) do update set mode = 'safety_hold', state = excluded.state",
      [kids[0], { modeSince: new Date().toISOString() }]);
    const held = (await call("GET", `/api/parent/overview?childId=${kids[0]}`)).body;
    assert.equal(held.alert, null, "a safety hold shows nothing");
    assert.equal(held.headline.kind, "held");
    const n = (await one(`insert into notification (child_id, guardian_id, dedupe, cls, intent, status, not_before, not_after, correlation_id)
        values ($1, $2, $3, 'safety', $4, 'blocked', now(), now() + interval '7 days', $3) returning id`, [kids[0], guardian, `S:${inc}`, { class: "safety", incidentId: String(inc) }])).id;
    assert.equal(await alertNow(), null, "a notice held for the human queue shows nothing");
    // (deletion is deferred while any of these is open: checked in the next test, before they are cleared)
    globalThis.__b3 = { inc, n };
  });

  test("erasure waits for safeguarding: deferred while open; the incident outlives the erasure, detached", async () => {
    const { inc, n } = globalThis.__b3;
    const auditN = async () => (await one("select count(*)::int as n from audit where guardian_id = $1 and action = 'erase_deferred'", [guardian])).n;
    const a0 = await auditN();
    const r1 = await call("DELETE", "/api/account", { password: PW, confirm: true });
    assert.equal(r1.status, 409, JSON.stringify(r1.body)); assert.equal(r1.body.code, "erase_review");
    const r1c = await call("DELETE", "/api/children", { childId: kids[0], password: PW });
    assert.equal(r1c.status, 409, JSON.stringify(r1c.body)); assert.equal(r1c.body.code, "erase_review");
    assert.ok(await one("select 1 from guardian where id = $1", [guardian]) && await one("select 1 from child where id = $1", [kids[0]]), "nothing deleted");
    assert.equal(await auditN(), a0 + 2);
    assert.deepEqual(Object.keys((await one("select detail from audit where guardian_id = $1 and action = 'erase_deferred' order by id desc limit 1", [guardian])).detail), ["what"]);
    // each open matter alone defers: hold lifted → still the pending notice + the unhandled incident
    await q("update conductor_state set mode = 'free' where child_id = $1", [kids[0]]);
    assert.equal((await call("DELETE", "/api/account", { password: PW, confirm: true })).status, 409);
    await q("update notification set status = 'sent', sent_at = now() where id = $1", [n]);
    assert.equal((await call("GET", `/api/parent/overview?childId=${kids[0]}`)).body.alert?.at != null, true, "a released notice shows the card");
    assert.equal((await call("DELETE", "/api/account", { password: PW, confirm: true })).status, 409, "the unhandled incident alone defers");
    await q("update incident set handled = true where id = $1", [inc]);
    await q("delete from notification where id = $1", [n]);
  });

  test("download everything: password re-auth, one JSON file, no transcript for class 5", async () => {
    assert.equal((await call("POST", "/api/parent/export", { password: "nope-nope" })).body.code, "password_wrong");
    const r = await call("POST", "/api/parent/export", { password: PW });
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-disposition") || "", /attachment; filename="taxila-export-/);
    assert.equal(r.body.children.length, 2);
    assert.equal(r.body.children[0].lessons[0].conversation, undefined);
    assert.ok(r.body.children[0].evidence.length >= 4);
  });

  test("account deletion: confirm step and password both required; then everything goes, one empty audit row stays", async () => {
    assert.equal((await call("DELETE", "/api/account", { password: PW })).body.code, "confirm_needed");
    const wrong = await call("DELETE", "/api/account", { password: "wrong-password", confirm: true });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.body.code, "password_wrong");
    assert.ok(await one("select 1 from guardian where id = $1", [guardian]), "a wrong password deletes nothing");
    const before = await one(`select (select count(*)::int from lesson where child_id = any($1::uuid[])) as lessons,
        (select count(*)::int from evidence where child_id = any($1::uuid[])) as ev, (select count(*)::int from auth_session where guardian_id = $2) as sessions`, [kids, guardian]);
    assert.ok(before.lessons >= 3 && before.ev >= 4 && before.sessions >= 1);
    const oldCookie = cookie;
    const r = await call("DELETE", "/api/account", { password: PW, confirm: true });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.match(r.body.receipt.code, /^TX-[0-9A-F]{8}$/);
    assert.equal(r.body.receipt.children, 2);
    assert.ok(new Date(r.body.receipt.backupsGoneBy) - new Date(r.body.receipt.at) === 7 * 86400_000);
    assert.match(r.headers.get("set-cookie") || "", /tx_session=;.*Max-Age=0/);
    const gone = await one(`select (select count(*)::int from guardian where id = $2) as g, (select count(*)::int from child where guardian_id = $2) as c,
        (select count(*)::int from lesson where child_id = any($1::uuid[])) as lessons, (select count(*)::int from evidence where child_id = any($1::uuid[])) as ev,
        (select count(*)::int from skill_state where child_id = any($1::uuid[])) as ss, (select count(*)::int from consent where guardian_id = $2) as consent,
        (select count(*)::int from guardian_pin where guardian_id = $2) as pin, (select count(*)::int from auth_session where guardian_id = $2) as sessions`, [kids, guardian]);
    assert.deepEqual(gone, { g: 0, c: 0, lessons: 0, ev: 0, ss: 0, consent: 0, pin: 0, sessions: 0 });
    const audit = await q("select action, detail from audit where guardian_id = $1", [guardian]);
    assert.equal(audit.length, 1, JSON.stringify(audit));
    assert.equal(audit[0].action, "account_erase");
    assert.deepEqual(Object.keys(audit[0].detail), ["receipt"], "the receipt row carries no content");
    assert.equal(audit[0].detail.receipt, r.body.receipt.code);
    assert.equal((await call("GET", "/api/me", null, oldCookie)).status, 401, "the old session is dead");
    // the safeguarding record outlives the erasure, detached and stamped with the receipt (never cascaded away)
    const kept = await one("select child_id, lesson_id, kind, detail from incident where id = $1", [globalThis.__b3.inc]);
    assert.ok(kept, "the incident row was deleted with the account");
    assert.equal(kept.child_id, null); assert.equal(kept.kind, "safeguarding"); assert.equal(kept.detail.erased, r.body.receipt.code);
    await q("delete from incident where id = $1", [globalThis.__b3.inc]);
    // every child-keyed table is empty for these ids (the classified list in server/learner/mode.js, minus KEPT audit)
    const tables = await q(`select table_name from information_schema.columns where column_name = 'child_id' and table_schema = 'public'`);
    for (const { table_name: t } of tables) {
      if (t === "learner_mode_audit") continue;   // KEPT (mode.js); incident rows are kept too, but detached (child_id null)
      const n = await one(`select count(*)::int as n from ${t} where child_id = any($1::uuid[])`, [kids]);
      assert.equal(n.n, 0, `${t} still holds rows`);
    }
  });
});
