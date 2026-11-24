// round 7 (App patch 008): the child's "What {T} remembers" routes sit beside the parent's, and the forgotten note goes through
// the relational writer (legal_mode M0 writes none). Pure (route table and writer only; the DB paths run in the db shard).
import { test } from "node:test";
import assert from "node:assert/strict";
import { routes, CHILD_EMOTES } from "../server/relational/routes.js";
import { relNoteStmt } from "../server/relational/writers.js";

test("the child memory routes exist next to the parent's", () => {
  for (const k of ["GET /api/child/memory", "DELETE /api/child/memory", "GET /api/parent/memory", "DELETE /api/parent/memory"]) assert.equal(typeof routes[k], "function", k);
});
test("a forgotten note: written for a child above M0, refused for M0 (the child route then writes none)", () => {
  const st = relNoteStmt({ id: "c1", legal_mode: "M1" }, { agentId: "asha", lessonId: null, kind: "memory_forgotten", slots: {} });
  assert.match(st.text, /insert into relational_note/);
  assert.throws(() => relNoteStmt({ id: "c1", legal_mode: "M0" }, { agentId: "asha", lessonId: null, kind: "memory_forgotten", slots: {} }));
});

test("the Debrief emote: a closed set, its route, and a note kind the relational writer admits (M0: none)", () => {
  assert.deepEqual([...CHILD_EMOTES], ["wave", "thanks", "fun"]);
  assert.equal(typeof routes["POST /api/child/emote"], "function");
  const st = relNoteStmt({ id: "c1", legal_mode: "M1" }, { agentId: "asha", lessonId: "00000000-0000-4000-8000-000000000001", kind: "child_emote", slots: { emote: "wave" } });
  assert.equal(st.params[3], "child_emote");
  assert.equal(JSON.parse(st.params[4]).emote, "wave");
  assert.throws(() => relNoteStmt({ id: "c1", legal_mode: "M0" }, { agentId: "asha", lessonId: null, kind: "child_emote", slots: { emote: "wave" } }));
});
test("migration 031: relational_note.kind admits exactly the writer's kinds (child_emote added, none lost)", async () => {
  const { readFileSync } = await import("node:fs");
  const { REL_NOTE_KINDS } = await import("../server/relational/writers.js");
  const sql = readFileSync(new URL("../db/migrations/031_relational_child_emote.sql", import.meta.url), "utf8").replace(/--.*$/gm, "");
  const list = [...(sql.match(/check \(kind in \(([^)]*)\)\)/)?.[1] ?? "").matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...list].sort(), [...REL_NOTE_KINDS].sort());
});
