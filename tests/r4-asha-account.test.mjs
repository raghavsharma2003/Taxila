// Round 4 stream 5, patch 02 (server/routes/account.js): the child row as the client sees it carries the SERVED teacher
// (dc-r4-single-teacher-asha), so no client surface ever draws a parked look for a row that still stores one. The
// DB-backed half (create / PATCH refuse a teacher who does not serve the class; /api/me) is in
// tests/lesson-safety-naming-db.run.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clientChild } from "../server/routes/account.js";

test("clientChild: teacher_id is the teacher who speaks (Asha for every class); a name given to another look is not sent", () => {
  for (let cls = 1; cls <= 9; cls++) for (const saved of [null, "asha", "arjun", "uma"]) {
    const c = clientChild({ id: `c${cls}`, first_name: "Riya", class_level: cls, teacher_id: saved, teacher_name: null });
    assert.equal(c.teacher_id, "asha", `class ${cls}, stored ${saved}`);
    assert.equal(c.teacher_name, null);
  }
  assert.equal(clientChild({ id: "a", first_name: "Riya", class_level: 3, teacher_id: "asha", teacher_name: "Meenu" }).teacher_name, "Meenu", "her name, honoured");
  assert.equal(clientChild({ id: "b", first_name: "Riya", class_level: 7, teacher_id: "arjun", teacher_name: "Ravi" }).teacher_name, null, "his name stays with him");
  assert.equal(clientChild({ id: "c", first_name: "Riya", class_level: 7, teacher_id: "asha", teacher_name: "Asha" }).teacher_name, null, "her own name is no custom name");
  assert.equal(clientChild(null), null);
  // the rollback: the client is told who actually teaches again
  process.env.TAXILA_SINGLE_TEACHER = "off";
  try {
    assert.equal(clientChild({ id: "d", first_name: "Riya", class_level: 7, teacher_id: null }).teacher_id, "arjun");
  } finally {
    delete process.env.TAXILA_SINGLE_TEACHER;
  }
});

test("create and PATCH only write a teacher who serves the class; every write path returns the client view", () => {
  const src = readFileSync(new URL("../server/routes/account.js", import.meta.url), "utf8");
  const create = src.slice(src.indexOf("export async function createChild"), src.indexOf("export async function updateChild"));
  const update = src.slice(src.indexOf("export async function updateChild"), src.indexOf("/**", src.indexOf("export async function updateChild")));
  assert.match(create, /singleTeacher\(\) \? SINGLE_TEACHER_ID/);
  for (const fn of [create, update]) {
    assert.match(fn, /!servesClass\(body\.teacherId, /, "a teacherId that does not serve the class is refused");
    assert.doesNotMatch(fn, /send\(res, 20[01], \{ child(: c)? \}\)/, "never the raw row");
  }
});
