// round 7 (App patch 008): the child's "What {T} remembers" routes sit beside the parent's, and the forgotten note goes through
// the relational writer (legal_mode M0 writes none). Pure (route table and writer only; the DB paths run in the db shard).
import { test } from "node:test";
import assert from "node:assert/strict";
import { routes } from "../server/relational/routes.js";
import { relNoteStmt } from "../server/relational/writers.js";

test("the child memory routes exist next to the parent's", () => {
  for (const k of ["GET /api/child/memory", "DELETE /api/child/memory", "GET /api/parent/memory", "DELETE /api/parent/memory"]) assert.equal(typeof routes[k], "function", k);
});
test("a forgotten note: written for a child above M0, refused for M0 (the child route then writes none)", () => {
  const st = relNoteStmt({ id: "c1", legal_mode: "M1" }, { agentId: "asha", lessonId: null, kind: "memory_forgotten", slots: {} });
  assert.match(st.text, /insert into relational_note/);
  assert.throws(() => relNoteStmt({ id: "c1", legal_mode: "M0" }, { agentId: "asha", lessonId: null, kind: "memory_forgotten", slots: {} }));
});
