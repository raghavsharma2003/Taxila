// Run by tests/r5-edit-supersede-db.test.mjs in its OWN process, against the real API in-process and a REAL Neon database
// — the TEST branch only (CONDUCTOR_TEST_DATABASE_URL; skips otherwise and refuses the production endpoint). No model call:
// every Azure endpoint is removed from the environment, the lessons run on the voice lane (the client writes her words)
// and every child turn is a number answer to a posed kit item, decided in code (classifyFast: exact / number).
// Round 5 truth bar (main 2026-10-15, server/brain/supersede.js): an edited re-send of the lesson's latest landed turn
// supersedes it — one grade, the edit's, on the ORIGINAL item; the original's evidence moved to the archives; the cached
// fold equals a fresh fold of the live ledger; a verdict for a superseded event is dropped; an edit after a later turn
// landed is missed (no re-grade, traced); a second edit is a replay.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { existsSync, readFileSync } from "fs";
import { createHash, randomUUID } from "crypto";

for (const k of Object.keys(process.env)) if (/^AZURE_|ENDPOINT$|_KEY$/.test(k)) delete process.env[k];
const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnvFile("DATABASE_URL");
const TEST_ENV = (process.env.TAXILA_DB || fromEnvFile("TAXILA_DB")) === "test";
const SKIP = !TEST ? "CONDUCTOR_TEST_DATABASE_URL not set" : !TEST_ENV && PROD && hostOf(TEST) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
const RUN = randomUUID().slice(0, 8);
const TOPIC = "c3-maths-ch08-t01";

describe("r5 edit supersede (test branch)", { skip: SKIP, concurrency: false, timeout: 240_000 }, () => {
  let server, base, q, one, guardian, token, kit, promptFor, loadLedger, evictLive;
  const call = async (path, body) => {
    const r = await fetch(base + path, { method: body ? "POST" : "GET", headers: { cookie: `tx_session=${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const newChild = async () => (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1,'Riya',3,'hinglish','asha') returning id", [guardian])).id;
  const item = (id) => kit.items.find((i) => i.id === id);
  /** A voice lesson with `itemId` posed (the Director's own probe state), and a turn helper that answers it. */
  const lesson = async (kid, itemId) => {
    const s = await call("/api/lesson/start", { childId: kid, mode: "voice", purpose: "practice" });
    assert.equal(s.status, 201, JSON.stringify(s.body));
    const lessonId = s.body.lessonId;
    const pose = (id) => q("update lesson set state = state || jsonb_build_object('activeItemId', $2::text, 'hintLevel', 0, 'phase', 'practice') - 'pendingWhy' where id = $1", [lessonId, id]);
    await pose(itemId);
    const turn = (childText, extra = {}) => call("/api/lesson/turn", { lessonId, childText, typed: true, teacherText: promptFor(item(extra.ask ?? itemId), "hinglish"), ...extra });
    return { lessonId, pose, turn };
  };
  const live = async (kid) => q("select id, cls, outcome, item_key from kt_evidence where child_id = $1 order by seq", [kid]);
  const verdicts = async (kid) => (await q("select item_id, outcome from evidence where child_id = $1 order by id", [kid])).map((r) => `${r.item_id}:${r.outcome}`);
  const archived = async (kid) => (await q("select item_id, outcome from evidence_superseded where child_id = $1 order by id", [kid])).map((r) => `${r.item_id}:${r.outcome}`);
  /** The cached fold (kt_skill_state) equals a fresh fold of the live ledger, skill by skill. */
  const foldAgrees = async (kid) => {
    evictLive(kid);
    const fresh = await loadLedger({ id: kid, class_level: 3 });
    const cached = await q("select skill_id, p_l, n from kt_skill_state where child_id = $1 order by skill_id", [kid]);
    const want = Object.keys(fresh.skills).sort();
    assert.deepEqual(cached.map((r) => r.skill_id), want, "the cached skills are the fold's skills");
    for (const r of cached) {
      assert.equal(Number(r.n), fresh.skills[r.skill_id].n, `${r.skill_id} n`);
      assert.ok(Math.abs(Number(r.p_l) - fresh.skills[r.skill_id].pL) < 1e-9, `${r.skill_id} p_l ${r.p_l} vs ${fresh.skills[r.skill_id].pL}`);
    }
  };

  before(async () => {
    process.env.DATABASE_URL = TEST;
    ({ q, one } = await import("../server/db.js"));
    const { handle } = await import("../server/index.js");
    ({ promptFor } = await import("../server/director/items.js"));
    ({ loadLedger } = await import("../server/learner/model.js"));
    ({ evictLive } = await import("../server/learner/live.js"));
    const { kitFor } = await import("../server/brain/rows.js");
    kit = await kitFor(TOPIC, {});
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    await q("delete from guardian where email like 'r5-sup+%@test.invalid' and created_at < now() - interval '1 hour'");
    guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'r5-sup') returning id", [`r5-sup+${RUN}@test.invalid`])).id;
    const t = randomUUID() + randomUUID();
    await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(t).digest("hex"), guardian]);
    token = t;
    for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [guardian, p]);
  });
  after(async () => {
    if (guardian) await q("delete from guardian where id = $1", [guardian]);
    server?.close();
  });
  const controls = (kid) => q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')
      on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 45`, [kid]);

  test("landed then edit → one grade, the edit's; the original's evidence moved, its row labelled; the cached fold = a fresh fold", async () => {
    const kid = await newChild(); await controls(kid);
    const L = await lesson(kid, "c3-maths-ch08-t01-i02"); // key 4
    let r = await L.turn("5", { turnSeq: 1 });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(await verdicts(kid), ["c3-maths-ch08-t01-i02:incorrect"]);
    const undo = await one("select turn_seq, turn from lesson_undo where lesson_id = $1", [L.lessonId]);
    assert.deepEqual([undo.turn_seq, undo.turn], [1, 1], "the snapshot of the landed turn");
    r = await L.turn("4", { turnSeq: 1, edited: true, retried: true });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(!r.body.duplicate, "graded, not replayed");
    assert.deepEqual(await verdicts(kid), ["c3-maths-ch08-t01-i02:correct"], "one grade: the edit's");
    assert.deepEqual(await archived(kid), ["c3-maths-ch08-t01-i02:incorrect"], "the original's verdict moved, never deleted");
    const kt = await live(kid);
    assert.equal(kt.length, 1);
    assert.equal(kt[0].outcome, 0, "first-try correct: the abandoned attempt is not in the episode");
    const rows = await q("select speaker, text, meta->>'superseded' as sup from turn where lesson_id = $1 and speaker = 'child' order by seq", [L.lessonId]);
    assert.deepEqual(rows.map((x) => [x.text, !!x.sup]), [["5", true], ["4", false]], "the transcript keeps what was said, labelled");
    const st = (await one("select state from lesson where id = $1", [L.lessonId])).state;
    assert.equal(st.turn, 1, "the edit IS turn 1");
    const tr = await q("select reasons from brain_trace where lesson_id = $1 and turn = 1", [L.lessonId]);
    assert.ok(tr[0].reasons.includes("turn.superseded_edit"));
    assert.equal((await one("select count(*)::int as n from brain_trace_superseded where lesson_id = $1", [L.lessonId])).n, 1);
    await foldAgrees(kid);
  });

  test("right → wrong: the correction is graded on the ORIGINAL item (not the one the Director moved to); the fold agrees; a second edit is a replay", async () => {
    const kid = await newChild(); await controls(kid);
    const L = await lesson(kid, "c3-maths-ch08-t01-i02");
    let r = await L.turn("4", { turnSeq: 1 });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const ktRight = await live(kid);
    assert.equal(ktRight.length, 1, "the right answer closed the episode");
    r = await L.turn("5", { turnSeq: 1, edited: true, retried: true });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(await verdicts(kid), ["c3-maths-ch08-t01-i02:incorrect"], "graded on the original item");
    assert.deepEqual(await archived(kid), ["c3-maths-ch08-t01-i02:correct"]);
    assert.equal((await q("select 1 from kt_evidence where id = $1", [ktRight[0].id])).length, 0, "the right answer's kt event left the live ledger");
    assert.equal((await q("select 1 from kt_evidence_superseded where id = $1", [ktRight[0].id])).length, 1, "…into the archive");
    await foldAgrees(kid);
    // the same edit again: a replay (idempotent), nothing written
    const before2 = [await verdicts(kid), (await live(kid)).length];
    r = await L.turn("5", { turnSeq: 1, edited: true, retried: true });
    assert.equal(r.status, 200);
    assert.deepEqual([r.body.duplicate, r.body.editLanded], [true, true]);
    assert.deepEqual([await verdicts(kid), (await live(kid)).length], before2);
  });

  test("a blind verdict for a superseded event is dropped (no late correction resurrects it)", async () => {
    const kid = await newChild(); await controls(kid);
    const L = await lesson(kid, "c3-maths-ch08-t01-i02");
    await L.turn("4", { turnSeq: 1 });
    const [orig] = await live(kid);
    await L.turn("5", { turnSeq: 1, edited: true, retried: true });
    const row = await one("select * from kt_evidence_superseded where id = $1", [orig.id]);
    const { eventFromRow } = await import("../server/learner/model.js");
    const ev = { ...eventFromRow(row), cls: "probe.why" };
    await q("insert into pending_grade (event_id, lesson_id, fallback_at) values ($1, $2, now()) on conflict (event_id) do update set fallback_at = now()", [ev.id, L.lessonId]);
    const { gradeLater } = await import("../server/comprehension/later.js");
    const grade = async () => ({ label: "present", spanOk: true });
    await gradeLater(ev, { childText: "x", targets: [{ id: "t1", textEn: "x" }] }, { grade });
    await new Promise((r) => setTimeout(r, 1500));
    assert.equal((await q("select 1 from kt_evidence where child_id = $1 and id like $2", [kid, `${orig.id}:late%`])).length, 0, "no correction for a superseded event");
    // control: the same verdict for a LIVE event is applied as a correction (the child then answers right: an event)
    await L.turn("4", { turnSeq: 2 });
    const [cur] = await live(kid);
    assert.ok(cur, "a live event to correct");
    const evLive = { ...eventFromRow(await one("select * from kt_evidence where id = $1", [cur.id])), cls: "probe.why" };
    await q("insert into pending_grade (event_id, lesson_id, fallback_at) values ($1, $2, now()) on conflict (event_id) do update set fallback_at = now()", [evLive.id, L.lessonId]);
    await gradeLater(evLive, { childText: "y", targets: [{ id: "t1", textEn: "y" }] }, { grade });
    await new Promise((r) => setTimeout(r, 1500));
    assert.equal((await q("select 1 from kt_evidence where child_id = $1 and id like $2", [kid, `${cur.id}:late%`])).length, 1, "control: a live event's verdict is applied");
  });

  test("re-fold property: after EVERY edit in a run of turns, the cached folds equal a fresh fold of the live kt_evidence", async () => {
    const kid = await newChild(); await controls(kid);
    const L = await lesson(kid, "c3-maths-ch08-t01-i02");
    const steps = [["c3-maths-ch08-t01-i02", "5", "4"], ["c3-maths-ch08-t01-i08", "2", "3"], ["c3-maths-ch08-t01-i13", "1", "2"]];
    let seq = 0;
    for (const [itemId, said, edit] of steps) {
      await L.pose(itemId);
      seq += 1;
      let r = await L.turn(said, { turnSeq: seq, ask: itemId });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      r = await L.turn(edit, { turnSeq: seq, edited: true, retried: true, ask: itemId });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.ok(!r.body.duplicate, `step ${seq} was re-graded`);
      await foldAgrees(kid);
    }
    assert.equal((await archived(kid)).length, 3, "every original verdict archived");
  });

  test("an edit after a LATER turn landed is missed: no re-grade, the response replayed, the trace says so", async () => {
    const kid = await newChild(); await controls(kid);
    const L = await lesson(kid, "c3-maths-ch08-t01-i02");
    await L.turn("5", { turnSeq: 1 });
    await L.pose("c3-maths-ch08-t01-i08"); // key 2
    let r = await L.turn("2", { turnSeq: 2, ask: "c3-maths-ch08-t01-i08" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const before3 = [await verdicts(kid), await archived(kid)];
    r = await L.turn("4", { turnSeq: 1, edited: true, retried: true });
    assert.equal(r.status, 200);
    assert.deepEqual([r.body.duplicate, r.body.editLanded], [true, true]);
    assert.deepEqual([await verdicts(kid), await archived(kid)], before3, "nothing re-graded, nothing moved");
    await new Promise((res) => setTimeout(res, 500));
    const st = (await one("select state from lesson where id = $1", [L.lessonId])).state;
    const tr = await one("select reasons from brain_trace where lesson_id = $1 and turn = $2", [L.lessonId, st.turn]);
    assert.ok(tr.reasons.includes("turn.edit_missed"), JSON.stringify(tr.reasons));
  });
});
