// Round 7 F item 1: subject rotation (server/conductor/rotation.js) and its use in reports/truth.js subjectsToday.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rankSubjects, timetableToday, normaliseSubject, rotationSubjects } from "../server/conductor/rotation.js";
import { subjectsToday, classSubjectsOf } from "../server/reports/truth.js";

const C6 = ["maths", "science", "english", "hindi", "sst"];
const C4 = ["maths", "evs", "english", "hindi"];

test("normaliseSubject: aliases and science ↔ evs by class", () => {
  assert.equal(normaliseSubject("Math", C6), "maths");
  assert.equal(normaliseSubject("science", C4), "evs");
  assert.equal(normaliseSubject("EVS", C6), "science");
  assert.equal(normaliseSubject("Social Science", C6), "sst");
  assert.equal(normaliseSubject("गणित", C4), "maths");
  assert.equal(normaliseSubject("sst", C4), null);
  assert.equal(normaliseSubject("music", C6), null);
});

test("timetableToday: the parent's row wins over the intake's", () => {
  const rows = [{ weekday: 1, source: "intake", subjects: ["hindi"] }, { weekday: 1, source: "parent", subjects: ["Maths", "science"] }, { weekday: 2, source: "intake", subjects: ["english"] }];
  assert.deepEqual(timetableToday(rows, 1, C6), { subjects: ["maths", "science"], source: "parent" });
  assert.deepEqual(timetableToday(rows, 2, C6), { subjects: ["english"], source: "intake" });
  assert.deepEqual(timetableToday(rows, 3, C6), { subjects: [], source: null });
});

test("no timetable, nothing taught: the class's first subject; then least-recently-taught rotates", () => {
  assert.equal(rankSubjects({ classSubjects: C6 }).subject, "maths");
  const r = rankSubjects({ classSubjects: C6, lastTaught: { maths: "2026-11-03" } });
  assert.equal(r.subject, "science");
  assert.equal(r.why, "rotation");
  const r2 = rankSubjects({ classSubjects: C6, lastTaught: { maths: "2026-11-03", science: "2026-11-04", english: "2026-11-01", hindi: "2026-11-02", sst: "2026-10-30" } });
  assert.deepEqual(r2.subjects, ["sst", "english", "hindi", "maths", "science"]);
});

test("three days of a timetable: maths, then science, then English", () => {
  const days = [["maths"], ["science"], ["english"]];
  const got = days.map((tt) => rankSubjects({ classSubjects: C6, timetable: tt, timetableSource: "parent", lastTaught: { maths: "2026-11-01" } }));
  assert.deepEqual(got.map((g) => g.subject), ["maths", "science", "english"]);
  assert.ok(got.every((g) => g.why === "timetable"));
});

test("priority: test window inside the timetable lifts; outside it the timetable wins; no timetable → test window", () => {
  assert.equal(rankSubjects({ classSubjects: C6, timetable: ["maths", "science"], testWindow: { subject: "science" } }).why, "test_window");
  const out = rankSubjects({ classSubjects: C6, timetable: ["maths"], testWindow: { subject: "science" } });
  assert.deepEqual([out.subject, out.why], ["maths", "timetable"]);
  assert.equal(rankSubjects({ classSubjects: C6, testWindow: { subject: "sst" } }).subject, "sst");
});

test("due reviews come before plain rotation; a subject taught today drops to the end", () => {
  const r = rankSubjects({ classSubjects: C6, dueSubjects: ["english"], lastTaught: { english: "2026-11-03" } });
  assert.deepEqual([r.subject, r.why], ["english", "due_review"]);
  const t = rankSubjects({ classSubjects: C6, timetable: ["maths", "science"], taughtToday: ["maths"] });
  assert.deepEqual(t.subjects, ["science", "maths"]);
  const i = rankSubjects({ classSubjects: C6, timetable: ["hindi"], timetableSource: "intake" });
  assert.equal(i.why, "intake_timetable");
});

test("rotationSubjects narrows by TAXILA_ROTATION_SUBJECTS", () => {
  const prev = process.env.TAXILA_ROTATION_SUBJECTS;
  process.env.TAXILA_ROTATION_SUBJECTS = "maths,science";
  try { assert.deepEqual(rotationSubjects(C6), ["maths", "science"]); } finally {
    if (prev === undefined) delete process.env.TAXILA_ROTATION_SUBJECTS; else process.env.TAXILA_ROTATION_SUBJECTS = prev;
  }
  assert.deepEqual(classSubjectsOf(4), ["maths", "evs", "english", "hindi"]);
  assert.deepEqual(classSubjectsOf(6), ["maths", "science", "english", "hindi", "sst"]);
});

test("subjectsToday over stubbed reads: timetable for the weekday, lessons before today rotate", async () => {
  const now = new Date("2026-11-04T12:00:00Z"); // Wednesday in IST (learning day 2026-11-04, weekday 3)
  const q = async (sql, params) => {
    if (sql.includes("child_routine")) return [{ tz: "Asia/Kolkata" }];
    if (sql.includes("child_timetable")) return params[1] === 3 ? [{ weekday: 3, source: "parent", subjects: ["English", "maths"] }] : [];
    if (sql.includes("from lesson")) return [{ subject: "english", last_at: "2026-11-03T12:00:00Z" }, { subject: "maths", last_at: "2026-10-30T12:00:00Z" }];
    if (sql.includes("skill_state")) return [];
    return [];
  };
  const r = await subjectsToday({ id: "c1", class_level: 6 }, { now, q });
  assert.equal(r.weekday, 3);
  assert.deepEqual(r.subjects, ["maths", "english"]);
  assert.equal(r.why, "timetable");
  // a missing 034 table reads as no timetable
  const q2 = async (sql, params) => (sql.includes("child_timetable") ? Promise.reject(Object.assign(new Error("no table"), { code: "42P01" })) : q(sql, params));
  const r2 = await subjectsToday({ id: "c1", class_level: 6 }, { now, q: q2 });
  assert.equal(r2.subject, "science");
});

test("planner slotSubject: test window inside the timetable, else the rotation's first pick", async () => {
  const { slotSubject } = await import("../server/conductor/planner.js");
  assert.equal(slotSubject({ testWindows: [], subjects: null }), null);
  assert.deepEqual(slotSubject({ testWindows: [], subjects: { subjects: ["science", "maths"], why: "timetable", timetable: ["science"] } }), { subject: "science", why: "timetable" });
  assert.deepEqual(slotSubject({ testWindows: [{ subject: "maths" }], subjects: { subjects: ["science"], why: "timetable", timetable: ["science"] } }), { subject: "science", why: "timetable" });
  assert.deepEqual(slotSubject({ testWindows: [{ subject: "maths" }], subjects: { subjects: ["science"], why: "rotation", timetable: [] } }), { subject: "maths", why: "test_window" });
});
