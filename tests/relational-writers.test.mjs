// RELATIONAL-OS R0 (BUILD-PLAN W2-I #1): the relational writers and their legal-mode layers. AT-U4 writers throw below
// their mode, AT-U5 no NM-3 column in the 018 tables, AT-U6 the M1 → M0 ratchet deletes every relational row; bodies and
// slots are closed values (never the child's words); one lesson end = events, then one UPSERT, then notes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { relEventStmt, relBondUpsertStmt, relNoteStmt, overlayStmt, relLessonEndStmts, RELATIONAL_TABLES } from "../server/relational/writers.js";
import * as W from "../server/learner/writer.js";
import { canWrite, classifyChildTable, tablesForbiddenIn, LAYER_TABLES } from "../server/learner/mode.js";

const child = (legal_mode) => ({ id: "00000000-0000-0000-0000-0000000000a1", legal_mode, teacher_id: "asha" });
const L = "00000000-0000-0000-0000-0000000000b2";
const base = { agentId: "asha", lessonId: L };

test("mode table: rel_bond is M1+, rel_overlay is M3 only; relational_note is M0 history", () => {
  assert.equal(canWrite(child("M0"), "rel_bond"), false);
  assert.equal(canWrite(child("M1"), "rel_bond"), true);
  assert.equal(canWrite(child("M2"), "rel_overlay"), false);
  assert.equal(canWrite(child("M3"), "rel_overlay"), true);
  assert.equal(classifyChildTable("rel_bond"), "layer");
  assert.equal(classifyChildTable("rel_event"), "layer");
  assert.equal(classifyChildTable("rel_overlay_window"), "layer");
  assert.equal(classifyChildTable("relational_note"), "m0_delete");
  assert.deepEqual(LAYER_TABLES.rel_bond, ["rel_bond", "rel_event"]);
  assert.deepEqual([...RELATIONAL_TABLES].sort(), ["rel_bond", "rel_event", "rel_overlay_window", "relational_note"]);
  assert.equal(W.RELATIONAL_TABLES, RELATIONAL_TABLES, "re-exported through the learner writer (one import point)");
});

test("AT-U4: writers throw below their mode (M0 everything; rel_overlay in M1 and M2)", () => {
  assert.throws(() => relEventStmt(child("M0"), { ...base, dim: "session", turnIdx: [3] }), /M0 forbids rel_bond/);
  assert.throws(() => relBondUpsertStmt(child("M0"), base), /M0 forbids rel_bond/);
  assert.throws(() => relNoteStmt(child("M0"), { ...base, kind: "boundary_warmth" }), /M0/);
  assert.throws(() => overlayStmt(child("M1"), { agentId: "asha", counts: { warmth: 2 } }), /M1 forbids rel_overlay/);
  assert.throws(() => overlayStmt(child("M2"), { agentId: "asha", counts: { warmth: 2 } }), /M2 forbids rel_overlay/);
  assert.equal(overlayStmt(child("M3"), { agentId: "asha", counts: { warmth: 2, junk: "x" } }).layer, "rel_overlay");
  assert.deepEqual(relLessonEndStmts(child("M0"), { ...base, lastTurn: 5 }), [], "an M0 child has no relational write path at all");
  assert.throws(() => relEventStmt({ id: "x" }, { ...base, dim: "session", turnIdx: [1] }), /legal_mode/, "never assumes a mode");
});

test("closed values only: a sentence in a body or slot is refused; dims and kinds are closed sets; every event is cited", () => {
  assert.throws(() => relNoteStmt(child("M1"), { ...base, kind: "boundary_warmth", slots: { said: "aap mummy se bhi achhi ho na didi" } }), /closed value/);
  assert.throws(() => relNoteStmt(child("M1"), { ...base, kind: "free_text" }), /unknown note kind/);
  assert.throws(() => relEventStmt(child("M1"), { ...base, dim: "mood", turnIdx: [1] }), /unknown rel_event dim/);
  assert.throws(() => relEventStmt(child("M1"), { ...base, dim: "milestone", body: { id: "x" }, turnIdx: [] }), /turnIdx/);
  assert.throws(() => relEventStmt(child("M1"), { ...base, dim: "address", body: { kind: "call_me", name: "x; drop table" }, turnIdx: [2] }), /plain short name/);
  assert.throws(() => relEventStmt(child("M1"), { ...base, dim: "teacher_owned", body: { kind: "felt_scolded" }, turnIdx: [2] }), /teacher-owned/,
    "child-affect rupture kinds are session-only (NM-3): they have no write path");
  const e = relEventStmt(child("M1"), { ...base, dim: "milestone", body: { id: "first_unaided:c5-m-1" }, turnIdx: [9, 4, 9] });
  assert.deepEqual(JSON.parse(e.params[3]), { lessonId: L, turnIdx: [4, 9] }, "index-only cite, deduped and sorted");
  for (const s of [e, relNoteStmt(child("M1"), { ...base, kind: "boundary_secret", slots: { move: "warm_boundary" } })]) assert.match(s.text, /returning/);
});

test("one lesson end: session event, stage event, teacher events, the UPSERT, then notes; the UPSERT never UPDATE-only", () => {
  const stmts = relLessonEndStmts(child("M1"), { ...base, lastTurn: 12, stageFrom: "meeting", stageTo: "meeting",
    teacherEvents: [{ kind: "unfair", owned: true, turn: 6 }], notes: [{ kind: "boundary_warmth", slots: { move: "warm_boundary" }, turn: 4 }] });
  const kinds = stmts.map((s) => (/insert into (\w+)/.exec(s.text) ?? [])[1]);
  assert.deepEqual(kinds, ["rel_event", "rel_event", "rel_event", "rel_bond", "relational_note"]);
  assert.equal(stmts[0].params[2], "session");
  assert.equal(JSON.parse(stmts[1].params[4]).to, "first_sessions", "the first lesson end always completes S0");
  assert.match(stmts[3].text, /on conflict \(child_id, agent_id\) do update/);
  assert.match(stmts[3].text, /Asia\/Kolkata/, "the day is the DB's India day, the same expression as the session event's");
  assert.match(stmts[0].text, /Asia\/Kolkata/);
  assert.equal(JSON.parse(stmts[4].params[4]).turn, 4);
  const m3 = relLessonEndStmts(child("M3"), { ...base, lastTurn: 3, overlay: { warmth: 2 } });
  assert.match(m3.at(-1).text, /rel_overlay_window/);
});

/** 018's tables and columns, read like tests/learner-mode.test.mjs reads every migration. */
function tables018() {
  const sql = readFileSync(new URL("../db/migrations/018_relational.sql", import.meta.url), "utf8").replace(/--.*$/gm, "");
  const out = {};
  for (const m of sql.matchAll(/create table if not exists (\w+)\s*\(([\s\S]*?)\n\);/g)) out[m[1]] = [...m[2].matchAll(/^\s*([a-z_0-9]+)\s+(?:text|bigint|bigserial|uuid|int|jsonb|timestamptz|date|text\[\])/gm)].map((x) => x[1]);
  out.rel_event_added = [...sql.matchAll(/alter table rel_event add column if not exists (\w+)/g)].map((x) => x[1]);
  return out;
}

test("AT-U5: no NM-3 column in rel_bond, rel_event, relational_note, rel_overlay_window (no trust, mood, timing, gap or free text)", () => {
  const t = tables018();
  assert.ok(t.rel_bond?.length >= 10 && t.relational_note?.length >= 5 && t.rel_overlay_window?.length >= 3, JSON.stringify(t));
  const BANNED = /trust|closeness|mood|affect|emotion|feel|score|rupture|safe_to_be_wrong|latency|timing|pause|onset|gap|minutes|streak|time_of|hour|note$|text$|said|transcript|free/;
  for (const [table, cols] of Object.entries(t)) for (const c of cols) assert.doesNotMatch(c, BANNED, `${table}.${c}`);
  assert.deepEqual(t.rel_event_added, ["agent_id", "dim", "cite", "body"]);
});

test("AT-U6: the M1 → M0 ratchet deletes rel_bond, rel_event, relational_note and rel_overlay_window", () => {
  const gone = tablesForbiddenIn("M0");
  for (const tname of ["rel_bond", "rel_event", "relational_note", "rel_overlay_window", "rel_state"]) assert.ok(gone.includes(tname), tname);
  assert.ok(tablesForbiddenIn("M2").includes("rel_overlay_window"), "M3 → M2 drops the cross-session overlay");
  assert.ok(!tablesForbiddenIn("M1").includes("rel_bond"));
  const stmts = W.ratchetStmts(child("M1"), "M0", { actor: "parent", reason: "test" });
  const deleted = stmts.map((s) => (/delete from (\w+)/.exec(s.text) ?? [])[1]).filter(Boolean);
  for (const tname of ["rel_bond", "rel_event", "relational_note", "rel_overlay_window"]) assert.ok(deleted.includes(tname), tname);
});
