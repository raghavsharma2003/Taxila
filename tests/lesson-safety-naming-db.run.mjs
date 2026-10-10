// Run by tests/lesson-safety-naming-db.test.mjs in its OWN process, against the real API in-process and a REAL Neon
// database — the TEST branch only (CONDUCTOR_TEST_DATABASE_URL; skips otherwise and refuses the production endpoint).
// No model call: the lessons run on the voice lane (the client writes the teacher's words) and every child turn is
// decided by the bytes (an empty typed turn), so no classifier, reply or grader call is made.
//   (1) the child names the teacher: the code predicate, the gentle 422, the stored name and its history, /api/me;
//   (2) the name flows into the persona and is PINNED for the open lesson (a rename lands on the next one, which
//       re-introduces her under the new name);
//   (3) the voice transcript floor: correction + a floor_violation incident with family names only;
//   (4) dedupe on (lessonId, turnSeq), an edit replacing an attempt in flight, late answers after a page-hide end;
//   (5) the parent's view, change and reset; /api/me's effective name; a PATCH teacher switch resets the name;
//   (6) a late disclosure gets the helpline line; a resend after a normal end is refused; the name route's rate limit.
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

describe("lesson safety + teacher naming (test branch)", { skip: SKIP, concurrency: false, timeout: 240_000 }, () => {
  let server, base, q, one, guardian, kid, token, lessonId;
  const call = async (path, { method = "GET", body, tok = token, type = "application/json" } = {}) => {
    const r = await fetch(base + path, { method, headers: { ...(tok ? { cookie: `tx_session=${tok}` } : {}), ...(body ? { "content-type": type } : {}) },
      body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const session = async (gid) => {
    const t = randomUUID() + randomUUID();
    await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(t).digest("hex"), gid]);
    return t;
  };
  const consent = (gid, purpose, granted) => q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', $3, 't')", [gid, purpose, granted]);
  const turnRows = async (lid) => Number((await one("select count(*)::int as n from turn where lesson_id = $1", [lid])).n);
  /** A voice-lane turn the bytes decide (empty typed): no model call. */
  const voiceTurn = (extra = {}) => call("/api/lesson/turn", { method: "POST", body: { lessonId, childText: "", typed: true, ...extra } });

  before(async () => {
    process.env.DATABASE_URL = TEST;
    ({ q, one } = await import("../server/db.js"));
    const { handle } = await import("../server/index.js");
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    await q("delete from guardian where email like 'lsn-name+%@test.invalid' and created_at < now() - interval '1 hour'");
    guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'lsn-name') returning id", [`lsn-name+${RUN}@test.invalid`])).id;
    token = await session(guardian);
    kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Riya', 3, 'hinglish', 'asha') returning id", [guardian])).id;
    await consent(guardian, "core_tutoring", true);
    await consent(guardian, "memory", true);
    await consent(guardian, "learning_profile", true);
    await q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')
      on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 45`, [kid]);
  });
  after(async () => {
    if (guardian) await q("delete from guardian where id = $1", [guardian]);
    server?.close();
  });

  test("naming: the code predicate refuses gently (reason + suggestions, never the name echoed); a good name is stored with its history", async () => {
    let r = await call(`/api/tutors?childId=${kid}`);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.name, "Asha");
    assert.deepEqual(r.body.suggestions, ["Asha", "Arjun", "Uma"]);
    for (const [name, reason] of [["Jaanu", "not_allowed"], ["Riya", "own_name"], ["Virat Kohli", "public_figure"], ["Asha2", "shape"], ["Best Friend", "not_allowed"]]) {
      r = await call("/api/tutors/name", { method: "POST", body: { childId: kid, name } });
      assert.equal(r.status, 422, name);
      assert.equal(r.body.reason, reason, name);
      assert.ok(r.body.suggestions.length >= 2, name);
      assert.ok(!JSON.stringify(r.body).includes(name), `no echo of ${name}`);
    }
    assert.equal((await one("select count(*)::int as n from teacher_name_history where child_id = $1", [kid])).n, 0, "a refused name never reaches a row");
    r = await call("/api/tutors/name", { method: "POST", body: { childId: kid, name: "  miss   meenu " } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.name, "Miss Meenu");
    assert.equal(r.body.teacher.name, "Miss Meenu");
    assert.equal(r.body.teacher.characterName, "Asha");
    assert.equal(r.body.teacher.role, "AI teacher");
    const row = await one("select teacher_name from child where id = $1", [kid]);
    assert.equal(row.teacher_name, "Miss Meenu");
    const h = await q("select name, source, character_id from teacher_name_history where child_id = $1", [kid]);
    assert.deepEqual(h.map((x) => [x.name, x.source, x.character_id]), [["Miss Meenu", "child", "asha"]]);
    const me = await call("/api/me");
    assert.equal(me.body.children.find((c) => c.id === kid).teacher_name, "Miss Meenu");
    // the DB shape check holds even for a write that skipped the predicate
    await assert.rejects(q("update child set teacher_name = '<b>x</b>' where id = $1", [kid]));
  });

  test("the name reaches the persona and is pinned for the open lesson; the floor on the voice transcript leaves a correction and an incident", async () => {
    let r = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice", purpose: "practice" } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    lessonId = r.body.lessonId;
    assert.equal(r.body.teacher.name, "Miss Meenu");
    assert.match(r.body.instructions, /WHO YOU ARE: Miss Meenu — the child calls you Miss Meenu\n/);
    const st = (await one("select state from lesson where id = $1", [lessonId])).state;
    assert.equal(st.ctx.teacherName, "Miss Meenu");
    // a rename during the lesson is allowed and lands on the NEXT lesson
    assert.equal((await call("/api/tutors/name", { method: "POST", body: { childId: kid, name: "Tara" } })).status, 200);
    // the voice transcript denied being an AI: correction for the next compile, an incident with family names only
    r = await voiceTurn({ turnSeq: 1, teacherText: "Main ek real insaan hoon, AI nahi. Chalo shuru karein?" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.match(r.body.instructions, /WHO YOU ARE: Miss Meenu/, "pinned: the rename did not reach the open lesson");
    const st2 = (await one("select state from lesson where id = $1", [lessonId])).state;
    assert.deepEqual(st2.correction, ["ai_denial"]);
    const t = await one("select meta from turn where lesson_id = $1 and speaker = 'teacher' order by seq desc limit 1", [lessonId]);
    assert.deepEqual(t.meta.floor, ["ai_denial"]);
    const inc = await q("select kind, severity, detail from incident where lesson_id = $1", [lessonId]);
    assert.equal(inc.length, 1);
    assert.equal(inc[0].kind, "floor_violation");
    assert.deepEqual(inc[0].detail.families, ["ai_denial"]);
    assert.ok(inc[0].detail.turnId, "keyed to the stored teacher row");
    assert.ok(!JSON.stringify(inc[0].detail).includes("insaan"), "never the words");
    // a lesser family stays on the turn row only
    r = await voiceTurn({ turnSeq: 2, teacherText: "Tum bahut slow ho, phir se socho?" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal((await q("select 1 from incident where lesson_id = $1", [lessonId])).length, 1);
  });

  test("dedupe: a resend of a landed turnSeq replays its response and stores nothing; an edit replaces an attempt in flight", async () => {
    const before = await turnRows(lessonId);
    let r = await voiceTurn({ turnSeq: 2, teacherText: "Tum bahut slow ho, phir se socho?", retried: true });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.duplicate, true);
    assert.ok(r.body.instructions, "the voice lane's replay carries the current instructions");
    assert.equal(await turnRows(lessonId), before, "nothing stored twice");
    // an edit arrives while the first attempt is still in flight: simulated by the mark the edit writes first
    await q("update lesson set state = jsonb_set(state, '{supersede}', '3'::jsonb) where id = $1", [lessonId]);
    r = await voiceTurn({ turnSeq: 3 });
    assert.equal(r.status, 409);
    assert.match(r.body.error, /replaced by an edit/);
    assert.equal(await turnRows(lessonId), before, "the replaced attempt left nothing");
    r = await voiceTurn({ turnSeq: 3, edited: true, retried: true, childText: "", typed: true });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(!r.body.duplicate);
    const child = await one("select meta from turn where lesson_id = $1 and speaker = 'child' order by seq desc limit 1", [lessonId]);
    assert.deepEqual([child.meta.turnSeq, child.meta.edited, child.meta.retried], [3, true, true]);
    assert.equal((await one("select state->'supersede' as s from lesson where id = $1", [lessonId])).s, null, "the mark is gone once the edit landed");
    // an edit that arrives after its turn landed: the landed response, flagged; nothing stored
    const n = await turnRows(lessonId);
    r = await voiceTurn({ turnSeq: 3, edited: true });
    assert.deepEqual([r.status, r.body.duplicate, r.body.editLanded], [200, true, true]);
    assert.equal(await turnRows(lessonId), n);
    // an edit of a turn that never landed and has no attempt in flight is just that turn
    r = await voiceTurn({ turnSeq: 4, edited: true });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(!r.body.duplicate);
  });

  test("late answers: a page-hide end (text/plain beacon) still takes the held answers; a Finish end does not", async () => {
    let r = await call("/api/lesson/end", { method: "POST", body: { lessonId }, type: "text/plain;charset=UTF-8" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal((await one("select state->>'endedBy' as by from lesson where id = $1", [lessonId])).by, "pagehide");
    const n = await turnRows(lessonId);
    r = await voiceTurn({ turnSeq: 5, retried: true });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual([r.body.late, r.body.end], [true, true]);
    assert.ok(!r.body.instructions, "a closed lesson gets no new instructions");
    assert.equal(await turnRows(lessonId), n + 1, "the child row only: no reply is written");
    const row = await one("select meta from turn where lesson_id = $1 and speaker = 'child' order by seq desc limit 1", [lessonId]);
    assert.equal(row.meta.late, true);
    assert.ok((await one("select ended_at from lesson where id = $1", [lessonId])).ended_at, "the lesson stays closed");
    assert.equal((await voiceTurn({ turnSeq: 5 })).body.duplicate, true, "dedupe holds on the closed lesson too");
    // a held DISCLOSURE that lands late still gets the safeguarding line with both helplines (stored as her turn) and a
    // safeguard move, so the client raises the Help sheet; the incident is written; the lesson stays closed
    r = await voiceTurn({ turnSeq: 6, retried: true, childText: "I want to die" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual([r.body.late, r.body.end, r.body.move.kind], [true, true, "safeguard"]);
    assert.match(r.body.teacherReply, /1098/);
    assert.match(r.body.teacherReply, /14416/);
    assert.ok(Number.isInteger(r.body.teacherReplySeq));
    const said = await one("select text, meta from turn where lesson_id = $1 and speaker = 'teacher' order by seq desc limit 1", [lessonId]);
    assert.equal(said.text, r.body.teacherReply);
    assert.equal(said.meta.late, true);
    assert.equal((await q("select 1 from incident where lesson_id = $1 and kind = 'safeguarding'", [lessonId])).length, 1);
    assert.ok((await one("select ended_at from lesson where id = $1", [lessonId])).ended_at, "still closed");
    assert.equal((await voiceTurn({})).status, 409, "no outbox key, no late answer");
    // a lesson ended by Finish (a JSON end) refuses
    const s = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice", purpose: "practice" } });
    assert.equal(s.status, 201, JSON.stringify(s.body));
    assert.equal(s.body.teacher.name, "Tara", "the rename landed on the next lesson");
    const st = (await one("select state from lesson where id = $1", [s.body.lessonId])).state;
    assert.equal(st.ctx.renamed, true, "she re-introduces herself under the new name");
    const landed = await call("/api/lesson/turn", { method: "POST", body: { lessonId: s.body.lessonId, childText: "", typed: true, turnSeq: 1 } });
    assert.equal(landed.status, 200, JSON.stringify(landed.body));
    assert.equal((await call("/api/lesson/end", { method: "POST", body: { lessonId: s.body.lessonId } })).status, 200);
    const late = await call("/api/lesson/turn", { method: "POST", body: { lessonId: s.body.lessonId, childText: "", typed: true, turnSeq: 2 } });
    assert.equal(late.status, 409);
    // a resend of a turn that DID land, after a normal end: refused, never her words or fresh instructions back
    const resend = await call("/api/lesson/turn", { method: "POST", body: { lessonId: s.body.lessonId, childText: "", typed: true, turnSeq: 1, retried: true } });
    assert.equal(resend.status, 409, JSON.stringify(resend.body));
    assert.ok(!resend.body?.instructions);
  });

  test("parent: views the name and its history, and resets it (the next lesson uses the look's own name)", async () => {
    let r = await call(`/api/tutors/name?childId=${kid}`);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual([r.body.name, r.body.characterName, r.body.custom], ["Tara", "Asha", true]);
    assert.deepEqual(r.body.history.map((h) => h.name), ["Tara", "Miss Meenu"]);
    r = await call("/api/tutors/name", { method: "POST", body: { childId: kid, name: null, source: "parent" } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual([r.body.name, r.body.custom], ["Asha", false]);
    assert.equal((await one("select teacher_name from child where id = $1", [kid])).teacher_name, null);
    r = await call(`/api/tutors/name?childId=${kid}`);
    assert.deepEqual(r.body.history.map((h) => [h.name, h.source]), [[null, "parent"], ["Tara", "child"], ["Miss Meenu", "child"]]);
    assert.deepEqual([r.body.characterId, r.body.band], ["asha", "b2"], "the parent's Change opens the same naming step");
    // the parent can also SET a name (decision child-names-teacher: "can change or reset"), through the same predicate
    r = await call("/api/tutors/name", { method: "POST", body: { childId: kid, name: "Mybaby", source: "parent" } });
    assert.equal(r.status, 422);
    r = await call("/api/tutors/name", { method: "POST", body: { childId: kid, name: "Meenu", source: "parent" } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal((await one("select source from teacher_name_history where child_id = $1 order by at desc limit 1", [kid])).source, "parent");
  });

  test("one name everywhere: /api/me sends the EFFECTIVE name (a stored name that no longer passes is null)", async () => {
    // a stored name a later denylist entry refuses (written past the predicate, as an old row would be)
    await q("update child set teacher_name = 'Mybaby' where id = $1", [kid]);
    let me = await call("/api/me");
    assert.equal(me.body.children.find((c) => c.id === kid).teacher_name, null);
    const r = await call(`/api/tutors/name?childId=${kid}`);
    assert.deepEqual([r.body.name, r.body.retired], ["Asha", true]);
    await q("update child set teacher_name = 'Meenu' where id = $1", [kid]);
    me = await call("/api/me");
    assert.equal(me.body.children.find((c) => c.id === kid).teacher_name, "Meenu");
  });

  test("PATCH /api/children teacherId: only a teacher who serves the class (Asha); moving a pre-round-4 Arjun row to Asha resets the name with a 'switch' row", async () => {
    const n = (await one("select count(*)::int as n from teacher_name_history where child_id = $1", [kid])).n;
    let r = await call("/api/children", { method: "PATCH", body: { childId: kid, languagePref: "hinglish" } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.child.teacher_name, "Meenu", "no switch, no reset");
    // ONE teacher (dc-r4-single-teacher-asha): a parked look is never written, by any path
    for (const id of ["arjun", "uma", "nobody"]) {
      r = await call("/api/children", { method: "PATCH", body: { childId: kid, teacherId: id } });
      assert.equal(r.status, 400, `${id}: ${JSON.stringify(r.body)}`);
    }
    assert.deepEqual(Object.values(await one("select teacher_id, teacher_name from child where id = $1", [kid])), ["asha", "Meenu"], "nothing written");
    // a row from before round 4 that stored Arjun (and a name given to him): /api/me sends the served teacher, Asha, under her own name
    await q("update child set teacher_id = 'arjun', teacher_name = 'Ravi' where id = $1", [kid]);
    const me = await call("/api/me");
    const row = me.body.children.find((c) => c.id === kid);
    assert.deepEqual([row.teacher_id, row.teacher_name], ["asha", null], "the client gets the teacher who speaks, never a parked id");
    r = await call("/api/children", { method: "PATCH", body: { childId: kid, teacherId: "asha" } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual([r.body.child.teacher_id, r.body.child.teacher_name], ["asha", null]);
    const h = await q("select name, source, character_id from teacher_name_history where child_id = $1 order by at desc", [kid]);
    assert.equal(h.length, n + 1);
    assert.deepEqual([h[0].name, h[0].source, h[0].character_id], [null, "switch", "asha"]);
    await call("/api/children", { method: "PATCH", body: { childId: kid, teacherId: "asha" } });
    assert.equal((await q("select 1 from teacher_name_history where child_id = $1", [kid])).length, n + 1, "no switch: no history row");
  });

  test("POST /api/tutors/name is rate limited per child (a script cannot walk the denylist)", async () => {
    let last;
    for (let i = 0; i < 25 && last !== 429; i++) {
      last = (await call("/api/tutors/name", { method: "POST", body: { childId: kid, name: i % 2 ? "Jaanu" : "Tara" } })).status;
    }
    assert.equal(last, 429);
  });
});
