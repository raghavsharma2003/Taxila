// RELATIONAL-OS R0 against a REAL Neon database (018_relational.sql applied): AT-U1 on the database — after every lesson
// end, replay(rel_event rows) equals the rel_bond cache byte for byte (stage, stage_since, sessions, days, address,
// teacher-owned stance, milestones, event_seq); the first end creates the row (UPSERT, never UPDATE-only); a repair at the
// next lesson closes the open teacher-owned stance; AT-U6 the M1 → M0 ratchet leaves zero relational rows; erasure cascades.
//
// TEST DATABASE ONLY: reads TEST_DATABASE_URL (env, else .env.local) — a Neon BRANCH — never DATABASE_URL (production).
// Skips without it, or when 018 is not applied there.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { neon, neonConfig } from "@neondatabase/serverless";
import { relLessonEndStmts } from "../server/relational/writers.js";
import { replay, rowToBond, eventRow, canon } from "../server/relational/bond.js";
import { ratchetPlan, CHILD_TABLES_SQL } from "../server/learner/writer.js";

const envFile = new URL("../.env.local", import.meta.url);
const URL_ = process.env.TEST_DATABASE_URL
  || (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith("TEST_DATABASE_URL=")) || "").slice(18).replace(/^"(.*)"$/, "$1") : "");
const sql = URL_ ? neon(URL_) : null;
const run = (stmts) => sql.transaction((t) => stmts.map((s) => t.query(s.text, s.params)));
const nativeFetch = globalThis.__taxilaNativeFetch ?? globalThis.fetch;
let prevFetchFn, ready = false;

describe("relational writers on Neon", { skip: !sql && "no TEST_DATABASE_URL (a Neon branch; never production)", concurrency: false, timeout: 180_000 }, () => {
  let guardian, kid;
  const lessons = [];
  before(async () => {
    prevFetchFn = neonConfig.fetchFunction;
    neonConfig.fetchFunction = nativeFetch;
    ready = await Promise.race([sql.query("select to_regclass('public.rel_bond') is not null as ok").then((r) => !!r[0]?.ok, () => false), new Promise((r) => setTimeout(() => r(false), 45_000))]);
    if (!ready) return;
    guardian = (await sql.query("insert into guardian (email, pw_hash, name) values ($1, 'x', 'relational-test') returning id", [`relational-test+${randomUUID()}@test.invalid`]))[0].id;
    kid = (await sql.query("insert into child (guardian_id, first_name, class_level, teacher_id) values ($1, 'Test', 5, 'asha') returning id, legal_mode, class_level, teacher_id", [guardian]))[0];
    for (let i = 0; i < 3; i++) lessons.push((await sql.query("insert into lesson (child_id, topic_id) values ($1, 'c5-maths-ch02-t02') returning id", [kid.id]))[0].id);
  });
  after(async () => {
    try {
      if (guardian) await sql.query("delete from guardian where id = $1", [guardian]);
      if (kid) {
        const [r] = await sql.query("select (select count(*) from rel_bond where child_id = $1) + (select count(*) from rel_event where child_id = $1) + (select count(*) from relational_note where child_id = $1) as n", [kid.id]);
        assert.equal(Number(r.n), 0, "erasing the child cascades every relational row");
      }
    } finally { neonConfig.fetchFunction = prevFetchFn; }
  });

  const check = async () => {
    const events = (await sql.query("select id, dim, body, at from rel_event where child_id = $1 and agent_id = 'asha' order by id", [kid.id])).map(eventRow);
    const [row] = await sql.query("select * from rel_bond where child_id = $1 and agent_id = 'asha'", [kid.id]);
    assert.equal(JSON.stringify(canon(rowToBond(row))), JSON.stringify(canon(replay(events))), "replay(rel_event) = rel_bond");
    return { row: rowToBond(row), events };
  };

  test("AT-U1 on the database: three lesson ends, each followed by replay = cache; S0 completes on the first end", async (t) => {
    if (!ready) return t.skip("018 not applied on the test branch");
    // lesson 1: a warmth boundary note and a teacher-owned event she did NOT own in the moment (it stays open)
    await run(relLessonEndStmts(kid, { agentId: "asha", lessonId: lessons[0], lastTurn: 9, stageFrom: "meeting", stageTo: "meeting",
      teacherEvents: [{ kind: "unheard", owned: false, turn: 4 }], notes: [{ kind: "boundary_warmth", slots: { move: "warm_boundary" }, turn: 3 }] }));
    let { row, events } = await check();
    assert.equal(row.stage, "first_sessions");
    assert.equal(row.sessions, 1);
    assert.equal(row.distinctDays, 1);
    assert.ok(row.teacherOpen, "the unowned slip is open");
    const openId = row.teacherOpen.eventId;
    assert.equal(events.find((e) => e.dim === "teacher_owned").id, Number(openId));
    // lesson 2: she owns it at the OPEN (a repair event), the child confers a short name
    await run(relLessonEndStmts(kid, { agentId: "asha", lessonId: lessons[1], lastTurn: 7, stageFrom: "first_sessions", stageTo: "first_sessions",
      repairs: [{ eventId: openId, turn: 1 }], address: [{ kind: "call_me", name: "Ricky", turn: 2 }] }));
    ({ row } = await check());
    assert.equal(row.teacherOpen, null, "the repair closed it");
    assert.equal(row.sessions, 2);
    assert.equal(row.distinctDays, 1, "same India day");
    assert.deepEqual(row.address, { childCallsTeacher: null, teacherCallsChild: "Ricky" });
    // lesson 3: a milestone, the stage crossing the record earned, a retraction of the name
    await run(relLessonEndStmts(kid, { agentId: "asha", lessonId: lessons[2], lastTurn: 12, stageFrom: "first_sessions", stageTo: "regular",
      milestones: [{ id: "first_unaided:c5-maths-ch02-s1", turn: 8 }], address: [{ kind: "call_me_retract", turn: 5 }] }));
    ({ row } = await check());
    assert.equal(row.stage, "regular");
    assert.deepEqual(row.milestones, ["first_unaided:c5-maths-ch02-s1"]);
    assert.equal(row.address, null, "a retraction applies at once (AT-U3)");
    const notes = await sql.query("select kind, slots from relational_note where child_id = $1", [kid.id]);
    assert.deepEqual(notes.map((n) => n.kind), ["boundary_warmth"]);
    assert.deepEqual(Object.keys(notes[0].slots).sort(), ["move", "turn"], "closed slots only, never the child's words");
  });

  test("a stage event that is not higher is a no-op in both the SQL and the fold (stages never regress)", async (t) => {
    if (!ready) return t.skip("018 not applied on the test branch");
    const l4 = (await sql.query("insert into lesson (child_id, topic_id) values ($1, 'c5-maths-ch02-t02') returning id", [kid.id]))[0].id;
    await run(relLessonEndStmts(kid, { agentId: "asha", lessonId: l4, lastTurn: 3, stageFrom: "regular", stageTo: "first_sessions" }));
    const { row } = await check();
    assert.equal(row.stage, "regular");
    assert.equal(row.sessions, 4);
  });

  test("AT-U6: the M1 → M0 ratchet (planned from the live schema) leaves zero relational rows", async (t) => {
    if (!ready) return t.skip("018 not applied on the test branch");
    const live = (await sql.query(CHILD_TABLES_SQL)).map((r) => r.table_name);
    let plan;
    try { plan = ratchetPlan(kid, "M0", live, { actor: "test", reason: "relational ratchet test" }); }
    catch (e) { if (/unclassified child_id tables/.test(e.message)) return t.skip(`another stream's table is unclassified on the test branch: ${e.message}`); throw e; }
    await run(plan);
    const [r] = await sql.query(`select (select count(*) from rel_bond where child_id = $1) + (select count(*) from rel_event where child_id = $1)
      + (select count(*) from relational_note where child_id = $1) + (select count(*) from rel_overlay_window where child_id = $1) as n`, [kid.id]);
    assert.equal(Number(r.n), 0);
  });
});
