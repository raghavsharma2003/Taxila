// The tutor routes in process (server/routes/tutor.js) with a stubbed db + auth: the HTTP layer the pure
// decideChoice tests do not reach — auth is called with the child id, the parent gate fires only where policy says,
// the pick is ONE statement (check + update + log), a statement that returns no row is a 409, and the pinned-teacher
// / class-bound rules of characters/index.js. The real-database run is tests/tutor-db-e2e.mjs (test branch only).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { routes, deps, CHOOSE_SQL, effectivelyChosen, LIVE_HOURS } from "../server/routes/tutor.js";
import { servesClass, teacherFor, teacherForLesson } from "../server/compiler/characters/index.js";
import { TUTORS } from "../shared/tutors.js";
import asha from "../server/compiler/characters/asha.js";
import arjun from "../server/compiler/characters/arjun.js";

const CID = "00000000-0000-4000-8000-0000000000c1";
let calls, child, liveRow, chooseRow, parentGateCalls;
const real = { ...deps };

beforeEach(() => {
  calls = [];
  parentGateCalls = 0;
  liveRow = null;
  child = { id: CID, class_level: 8, teacher_id: "arjun", tutor_chosen_at: null };
  chooseRow = { id: CID, teacher_id: "arjun", tutor_chosen_at: "2026-10-03T00:00:00Z", from_id: "arjun" };
  deps.requireChild = async (_req, id) => {
    calls.push(["auth", id]);
    if (id !== CID) throw Object.assign(new Error("forbidden"), { status: 403 });
    return { child };
  };
  deps.requireParentIfPinSet = async () => {
    parentGateCalls++;
    throw Object.assign(new Error("locked"), { status: 423 });
  };
  deps.one = async (sql, params) => {
    calls.push(["sql", sql, params]);
    if (sql === CHOOSE_SQL) return chooseRow;
    return liveRow;
  };
  delete process.env.TAXILA_TUTOR_OFFER;
});
process.on("exit", () => Object.assign(deps, real));

function res() {
  return { statusCode: 0, headers: {}, body: null, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b ? JSON.parse(b) : null; } };
}
const choose = (body) => { const r = res(); return routes["POST /api/tutors/choose"]({ headers: {} }, r, body).then(() => r); };
const list = (id) => { const r = res(); return routes["GET /api/tutors"]({ url: `/api/tutors?childId=${id}`, headers: {} }, r).then(() => r); };

test("GET: auth on the child id; current may be null; live comes from the open-lesson query", async () => {
  child.teacher_id = null;
  const r = await list(CID);
  assert.equal(r.statusCode, 200);
  assert.deepEqual(calls[0], ["auth", CID]);
  assert.equal(r.body.current, null);
  assert.equal(r.body.live, false);
  liveRow = { "?column?": 1 };
  assert.equal((await list(CID)).body.live, true);
  const liveSql = calls.filter((c) => c[0] === "sql").at(-1)[1];
  assert.match(liveSql, /ended_at is null/);
  assert.match(liveSql, new RegExp(`interval '${LIVE_HOURS} hours'`));
  await assert.rejects(list("not-a-uuid"), (e) => e.status === 400);
});

test("POST: the pick is one statement (live check + update + log) with from_id = the previous teacher", async () => {
  const r = await choose({ childId: CID, tutorId: "arjun", source: "child", shown: ["arjun", "nobody"], msToChoose: 1234.4 });
  assert.equal(r.statusCode, 200);
  const sql = calls.filter((c) => c[0] === "sql" && c[1] === CHOOSE_SQL);
  assert.equal(sql.length, 1, "exactly one write statement");
  assert.match(CHOOSE_SQL, /with live as[\s\S]*update child[\s\S]*not exists \(select 1 from live\)[\s\S]*insert into tutor_switch[\s\S]*from upd/);
  assert.match(CHOOSE_SQL, /old\.teacher_id as from_id/, "from_id is the previous teacher, unconditionally");
  assert.deepEqual(sql[0][2], [CID, "arjun", 1, "child", ["arjun"], 1234]);
  assert.equal(parentGateCalls, 0);
});

test("POST: the statement returning no row (a lesson opened in between) is a 409, not a silent success", async () => {
  chooseRow = null;
  await assert.rejects(choose({ childId: CID, tutorId: "arjun" }), (e) => e.status === 409);
});

test("POST: an open lesson → 409 before any write; a draft or out-of-class tutor → 403", async () => {
  liveRow = { x: 1 };
  await assert.rejects(choose({ childId: CID, tutorId: "arjun" }), (e) => e.status === 409);
  assert.ok(!calls.some((c) => c[1] === CHOOSE_SQL));
  liveRow = null;
  await assert.rejects(choose({ childId: CID, tutorId: "uma" }), (e) => e.status === 403);
  await assert.rejects(choose({ childId: CID, tutorId: "asha" }), (e) => e.status === 403);
});

test("POST B1: a switch goes through the Parent-corner gate; a parent-set non-default teacher counts as chosen", async () => {
  process.env.TAXILA_TUTOR_OFFER = "wide";
  child = { id: CID, class_level: 2, teacher_id: "asha", tutor_chosen_at: null };
  // first pick over the class default: free
  assert.equal((await choose({ childId: CID, tutorId: "arjun" })).statusCode, 200);
  assert.equal(parentGateCalls, 0);
  // the parent had set arjun at onboarding (teacher_id ≠ class default): the child's first pick is a switch
  child = { id: CID, class_level: 2, teacher_id: "arjun", tutor_chosen_at: null };
  assert.equal(effectivelyChosen(child), true);
  calls = [];
  await assert.rejects(choose({ childId: CID, tutorId: "asha" }), (e) => e.status === 423);
  assert.equal(parentGateCalls, 1);
  assert.ok(!calls.some((c) => c[1] === CHOOSE_SQL), "nothing written when the gate refuses");
  // B3 (class 6) switches are free
  child = { id: CID, class_level: 6, teacher_id: "arjun", tutor_chosen_at: "2026-10-01" };
  assert.equal((await choose({ childId: CID, tutorId: "asha" })).statusCode, 200);
  assert.equal(parentGateCalls, 1);
});

test("teacherFor bounds a saved pick by the sheet's classes (or wide); class change / wide-off revert to the default", () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    // sheet mode: the persona sheet's own classes
    assert.equal(teacherFor({ id: "a", class_level: 1, teacher_id: "arjun" }).id, "asha", "Arjun's sheet is classes 5-9");
    assert.equal(teacherFor({ id: "a", class_level: 8, teacher_id: "asha" }).id, "arjun", "Asha's sheet is classes 1-4");
    assert.equal(teacherFor({ id: "a", class_level: 3, teacher_id: "asha" }).id, "asha");
    assert.equal(teacherFor({ id: "a", class_level: 3, teacher_id: null }).id, "asha");
    // wide: AVATAR §5.1 ranges, consistent with what the picker offered
    process.env.TAXILA_TUTOR_OFFER = "wide";
    assert.equal(teacherFor({ id: "a", class_level: 6, teacher_id: "asha" }).id, "asha");
    assert.equal(teacherFor({ id: "a", class_level: 1, teacher_id: "arjun" }).id, "arjun");
    assert.equal(teacherFor({ id: "a", class_level: 7, teacher_id: "asha" }).id, "arjun", "outside Asha's wide range");
    delete process.env.TAXILA_TUTOR_OFFER;
    // wide switched off: the same saved row now serves the sheet range
    assert.equal(teacherFor({ id: "a", class_level: 6, teacher_id: "asha" }).id, "arjun");
  } finally {
    console.warn = warn;
  }
  // the manifest's sheet-mode offer ranges ARE the sheets' classes (one source of truth for register)
  assert.deepEqual(TUTORS.find((t) => t.id === "asha").fit.offerClasses, asha.classes);
  assert.deepEqual(TUTORS.find((t) => t.id === "arjun").fit.offerClasses, arjun.classes);
  assert.equal(servesClass("uma", 8), false, "no sheet, never served");
});

test("teacherForLesson: the lesson's pinned teacher wins over the child's current pick", () => {
  const kid = { id: "a", class_level: 3, teacher_id: "asha" };
  assert.equal(teacherForLesson({ ...kid, teacher_id: "arjun" }, "asha").id, "asha");
  assert.equal(teacherForLesson({ ...kid, teacher_id: "asha" }, "arjun").voice, teacherFor({ id: "b", class_level: 7 }).voice);
  assert.equal(teacherForLesson(kid, null).id, "asha", "a lesson without a pin falls back to teacherFor");
  assert.equal(teacherForLesson(kid, "zed").id, "asha");
});
