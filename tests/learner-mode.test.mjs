// The single privacy-mode setting gating every learner write (LEARNER-MODEL §4, §12; decision
// learner-legal-mode-ratchet): no write path for a forbidden layer, down-only ratchet, M0 deletes every
// learner row (every child_id table classified), and the NM-3 schema scan of every migration.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "fs";
import { WRITES, LAYERS, LAYER_TABLES, M0_HISTORY_TABLES, KEPT_TABLES, classifyChildTable, assertWritable, canWrite, legalModeOf, isRatchetDown, tablesForbiddenIn } from "../server/learner/mode.js";
import * as W from "../server/learner/writer.js";
import { fold, newLedger } from "../server/learner/kt/ledger.js";
import { currentTheta } from "../server/learner/kt/ability.js";
import { makeLog } from "../server/learner/kt/gen.js";

const SQL = readFileSync(new URL("../db/migrations/005_learner.sql", import.meta.url), "utf8");
const child = (legal_mode, consent = {}) => ({ id: "00000000-0000-0000-0000-000000000001", legal_mode, consent });
const sk = { skillId: "s", pKnown: 0.5, status: "practising", attempts: 1, correctUnaided: 0, generativePass: false, delayedPass: false, lastSeen: "2026-10-01T00:00:00Z" };

test("mode table: M0 ⊂ M1 ⊂ M2 ⊂ M3; eta is M2+, interest/pz_child M3 only; affect is no layer at all", () => {
  for (const [lo, hi] of [["M0", "M1"], ["M1", "M2"], ["M2", "M3"]]) for (const l of WRITES[lo]) assert.ok(WRITES[hi].has(l), `${l} ${lo}→${hi}`);
  assert.equal(canWrite(child("M1"), "kt"), true);
  assert.equal(canWrite(child("M0"), "kt"), false);
  assert.equal(canWrite(child("M1"), "eta"), false);
  assert.equal(canWrite(child("M2"), "eta"), true);
  assert.equal(canWrite(child("M2"), "interest"), false);
  assert.equal(canWrite(child("M3"), "pz_child"), true);
  for (const banned of ["affect", "engagement", "trust", "timing", "vibe_score"]) assert.ok(!LAYERS.includes(banned), banned);
  assert.throws(() => canWrite(child("M1"), "affect"), /unknown learner layer/);
  assert.equal(legalModeOf({}), "M1", "launch default");
  assert.throws(() => legalModeOf({ legal_mode: "M9" }));
});

test("assertWritable throws (never warns); mem_B needs P3; research needs P4 and is never M0", () => {
  assert.throws(() => assertWritable(child("M0"), "kt"), /legal_mode M0 forbids kt/);
  assert.throws(() => assertWritable(child("M2"), "mem_B"), /P3 consent required/);
  assert.doesNotThrow(() => assertWritable(child("M2", { P3: true }), "mem_B"));
  assert.throws(() => assertWritable(child("M1"), "research"), /P4/);
  assert.doesNotThrow(() => assertWritable(child("M1", { P4: true }), "research"));
  assert.throws(() => assertWritable(child("M0", { P4: true }), "research"), /M0/);
});

test("the writer refuses every forbidden layer: an M0 child has no KT, misconception or ability write path", () => {
  const m0 = child("M0");
  assert.throws(() => W.skillStateStmt(m0.id, sk, m0), /M0 forbids kt/);
  assert.throws(() => W.evidenceStmt(m0.id, "l", { skillId: "s", probe: "P15", outcome: "correct", hintsUsed: 0, weight: 1 }, null, m0), /M0/);
  assert.throws(() => W.misconceptionFlagStmt(m0.id, "m", m0), /M0 forbids mis/);
  assert.throws(() => W.misconceptionResolveStmt(m0.id, "m", m0), /M0/);
  const L = fold(newLedger({ childId: m0.id, classLevel: 5 }), makeLog(3));
  const sk0 = Object.values(L.skills)[0];
  assert.throws(() => W.ktSkillStateStmt(m0, sk0), /M0/);
  assert.throws(() => W.ktMisconceptionStmt(m0, { misconceptionId: "m", logit: 0, hits: 1 }), /M0/);
  const [subject, ep] = Object.entries(L.ability)[0];
  assert.throws(() => W.ktAbilityStmts(m0, subject, ep, currentTheta(ep)), /M0/);
  assert.deepEqual(W.ledgerStmts(m0, newLedger({ childId: m0.id, classLevel: 5 }), L, makeLog(3)), []);
});

test("legacy builders take the child row last; a bare id or a row without its mode is refused (no M1 assumption)", () => {
  const c = child("M1");
  const s = W.skillStateStmt(c.id, sk, c);
  assert.match(s.text, /insert into skill_state/);
  assert.equal(s.params[0], c.id);
  assert.equal(s.layer, "kt");
  assert.match(W.misconceptionFlagStmt(c.id, "m", c).text, /misconception_state/);
  assert.throws(() => W.skillStateStmt("cid", sk), /child row/);
  assert.throws(() => W.skillStateStmt(c.id, sk, c.id), /child row/, "a bare id string never means M1");
  assert.throws(() => W.misconceptionFlagStmt(c.id, "m", { id: c.id }), /no legal_mode/);
  assert.throws(() => W.evidenceStmt("other", "l", {}, null, c), /≠ child row/);
});

test("memory, format trials and the session count go through the writer's gates", () => {
  const m1 = child("M1"), m0 = child("M0"), m2p3 = child("M2", { P3: true }), m3 = child("M3", { P3: true });
  assert.equal(W.memoryStmt(m1, { kind: "win", text: "fixed the fraction wall", sourceTurn: 7 }).layer, "mem_A");
  assert.throws(() => W.memoryStmt(m1, { kind: "interest", text: "cricket", sourceTurn: 7 }), /M1 forbids mem_B/);
  assert.throws(() => W.memoryStmt(child("M2"), { kind: "preference", text: "x", sourceTurn: 7 }), /P3/);
  assert.equal(W.memoryStmt(m2p3, { kind: "interest", text: "cricket", sourceTurn: 7 }).layer, "mem_B");
  for (const k of ["joke", "life_event", "person"]) assert.throws(() => W.memoryStmt(m3, { kind: k, text: "x", sourceTurn: 7 }), /tier C/);
  assert.throws(() => W.memoryStmt(m0, { kind: "win", text: "x", sourceTurn: 7 }), /M0/);
  assert.throws(() => W.memoryStmt(m1, { kind: "win", text: "x" }), /cited source turn/);
  assert.equal(W.canWriteMemory(m1, "win"), true);
  assert.equal(W.canWriteMemory(m1, "interest"), false);
  assert.equal(W.canWriteMemory(m3, "joke"), false);
  const ft = { skillId: "s", topicType: "T1", format: "F1", immediate: 1 };
  assert.throws(() => W.formatTrialStmt(m1, ft), /M1 forbids pz_child/);
  assert.throws(() => W.formatTrialStmt(m2p3, ft), /M2 forbids pz_child/);
  assert.equal(W.formatTrialStmt(m3, ft).layer, "pz_child");
  const rel = W.relSessionStmt(m1);
  assert.match(rel.text, /insert into rel_state/);
  assert.doesNotMatch(rel.text, /trust/, "trust is never persisted (NM-3)");
  assert.throws(() => W.relSessionStmt(m0), /M0/);
});

test("ledgerStmts stages new events + changed rows only, never an ASR-dropped or safety event", () => {
  const c = child("M1");
  const log = makeLog(11, { sessions: 2 });
  const before = newLedger({ childId: c.id, classLevel: 5 });
  const after = fold(before, log);
  const stmts = W.ledgerStmts(c, before, after, log, { currentTheta });
  const evRows = stmts.filter((s) => /insert into kt_evidence/.test(s.text));
  const droppedNever = log.filter((e) => e.safetyFired || (e.asrConf != null && e.asrConf < 0.5));
  assert.equal(evRows.length, log.length - droppedNever.length);
  for (const s of stmts) assert.ok(/returning/.test(s.text), "every write returns a row");
  assert.equal(stmts.filter((s) => /kt_skill_state/.test(s.text)).length, Object.keys(after.skills).length);
  assert.deepEqual(W.ledgerStmts(c, after, after, []), [], "nothing changed → nothing staged");
  assert.throws(() => W.ktEvidenceStmt(c, { ...log[0], asrConf: 0.1 }), /never written/);
  // M1 never writes the M2+ learning-speed layer: no statement touches kt_child
  assert.ok(!stmts.some((s) => /kt_child/.test(s.text)));
});

test("ratchet: only down, audited, guarded on the current mode; M0 deletes every learner table", () => {
  assert.throws(() => W.ratchetStmts(child("M1"), "M2"), /only ratchets down/);
  assert.deepEqual(W.ratchetStmts(child("M1"), "M1"), []);
  assert.equal(isRatchetDown("M3", "M0"), true);
  const stmts = W.ratchetStmts(child("M1"), "M0", { actor: "parent", reason: "consent P2 withdrawn" });
  assert.match(stmts[0].text, /pg_advisory_xact_lock/, "the ratchet takes the same lock as every turn write");
  assert.deepEqual(stmts[0].params, W.lockStmt(child("M1").id).params);
  assert.match(stmts[1].text, /update child set legal_mode = \$2 where id = \$1 and legal_mode = \$3/);
  assert.match(stmts[2].text, /learner_mode_audit/);
  const deleted = stmts.slice(3).map((s) => /delete from (\w+)/.exec(s.text)[1]).sort();
  const all = [...new Set([...Object.values(LAYER_TABLES).flat(), ...M0_HISTORY_TABLES])].sort();
  assert.deepEqual(deleted, all, "M0 keeps no learner row");
  // every child-keyed table in EVERY migration is classified: deleted on M0, or kept with a reason
  const childTables = migrationTables().filter((t) => /\bchild_id\b/.test(t.body)).map((t) => t.name);
  assert.ok(childTables.length >= 30, `${childTables.length} child tables seen`);
  const unclassified = childTables.filter((t) => !classifyChildTable(t));
  assert.deepEqual(unclassified, [], "classify every new child_id table in server/learner/mode.js");
  for (const t of childTables.filter((t) => classifyChildTable(t) !== "kept")) assert.ok(deleted.includes(t), `${t} survives M0`);
  for (const t of Object.keys(KEPT_TABLES)) assert.ok(childTables.includes(t), `kept table ${t} exists`);
  for (const t of ["rel_state", "voice_baseline", "voice_feature", "brief_snapshot", "student_event", "lesson"]) assert.ok(deleted.includes(t), t);
  // M2 → M1 drops the M2-only learning speed
  assert.ok(tablesForbiddenIn("M1").includes("kt_child"));
  assert.ok(!tablesForbiddenIn("M1").includes("kt_skill_state"));
});

/** Every `create table` (body by paren matching, so a last line without "\n);" is still seen) and every
 * `alter table … add column` across db/migrations, minus columns a later `drop column` removed. */
function migrationTables() {
  const dir = new URL("../db/migrations/", import.meta.url);
  const tables = new Map();
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".sql")).sort()) {
    const sql = readFileSync(new URL(f, dir), "utf8").replace(/--.*$/gm, "");
    for (const m of sql.matchAll(/create table (?:if not exists )?(\w+)\s*\(/g)) {
      let depth = 1, i = m.index + m[0].length;
      for (; i < sql.length && depth; i++) depth += sql[i] === "(" ? 1 : sql[i] === ")" ? -1 : 0;
      tables.set(m[1], { name: m[1], file: f, body: sql.slice(m.index + m[0].length, i - 1), added: [] });
    }
    for (const m of sql.matchAll(/alter table (\w+) add column (?:if not exists )?(\w+)\s+([a-z ]+)/g)) tables.get(m[1])?.added.push(`${m[2]} ${m[3]}`);
    for (const m of sql.matchAll(/alter table (\w+) drop column (?:if exists )?(\w+)/g)) {
      const t = tables.get(m[1]);
      if (t) { t.body = t.body.replace(new RegExp(`^\\s*${m[2]}\\s.*$`, "m"), ""); t.added = t.added.filter((a) => !a.startsWith(`${m[2]} `)); }
    }
  }
  return [...tables.values()];
}
const columnsOf = (t) => [...[...t.body.matchAll(/^\s*([a-z_0-9]+)\s+(text|bigint|bigserial|uuid|int|smallint|boolean|double precision|jsonb|timestamptz|real|date)/gm)].map((m) => m[1]),
  ...t.added.map((a) => a.split(" ")[0])];

/**
 * NM-3 violations that exist in older migrations, each with its status. The scan fails on anything NOT
 * listed, and on a listed entry that no longer exists (so the list cannot rot). These are OPEN: the owner
 * decides between dropping the columns and an M3-only table split (context/decisions.md
 * learner-nm3-legacy-columns).
 */
const NM3_KNOWN = Object.freeze({
  "rel_event.note": "001; free-text about the child; never written by any route; deleted on M0",
  "turn.asr_conf": "001; transcript table (no child_id, cascades from lesson on M0)",
  "lesson.parent_note": "001; the parent's lesson note; deleted on M0 with the lesson",
  "voice_feature.asr_conf": "006 voice-features-longitudinal; deleted on M0",
  "voice_feature.barge_in": "006 voice-features-longitudinal; deleted on M0",
});

test("NM-3 schema scan over EVERY migration: no latency, pause, prosody, affect, mood, engagement, trust, vibe or free-text column", () => {
  const tables = migrationTables();
  const cols = tables.flatMap((t) => columnsOf(t).map((c) => `${t.name}.${c}`));
  assert.ok(cols.length > 200, `the scan sees the columns (${cols.length})`);
  assert.ok(tables.some((t) => t.name === "voice_baseline") && tables.some((t) => t.name === "child_controls"), "tables whose body ends without a newline are seen");
  const BANNED = /latency|pause|prosody|affect|mood|engag|trust|vibe|emotion|asr_conf|timing|onset|dwell|note|transcript|free_text|said_text|barge/;
  const hits = cols.filter((c) => BANNED.test(c.split(".")[1]));
  assert.deepEqual(hits.filter((c) => !NM3_KNOWN[c]), [], "a new NM-3 column (or list it in NM3_KNOWN with its decision)");
  assert.deepEqual(Object.keys(NM3_KNOWN).filter((c) => !hits.includes(c)), [], "a fixed NM-3 entry must leave NM3_KNOWN");
  // voice_baseline holds per-child prosody/timing statistics by FEATURE NAME (rows, not columns): it is
  // deleted on M0 and listed for the same owner decision.
  assert.equal(classifyChildTable("voice_baseline"), "m0_delete");
  for (const t of ["kt_evidence", "kt_skill_state", "kt_misconception", "kt_ability", "kt_ability_epoch", "kt_child"]) {
    const body = new RegExp(`create table if not exists ${t} \\(([\\s\\S]*?)\\n\\);`).exec(SQL)[1];
    assert.match(body, /references child\(id\) on delete cascade/, `${t} cascades on erasure`);
    assert.match(body, /legal_mode_at_write/, `${t} records its mode`);
  }
  assert.match(SQL, /alter table child add column if not exists legal_mode text not null default 'M1'/);
});

test("ratchetPlan checks the LIVE schema: an unclassified child_id table refuses the ratchet; missing tables are skipped", () => {
  const c = child("M1");
  assert.throws(() => W.ratchetPlan(c, "M0", ["kt_evidence", "new_child_table"]), /unclassified child_id tables new_child_table/);
  const plan = W.ratchetPlan(c, "M0", ["kt_evidence", "consent", "lesson"]);
  assert.deepEqual(plan.slice(3).map((s) => /delete from (\w+)/.exec(s.text)[1]), ["kt_evidence", "lesson"], "consent is kept; absent tables are not touched");
});

test("commit re-checks the mode inside the transaction, after the lock (a turn staged as M1 cannot land after a ratchet)", async () => {
  const g = W.modeGuardStmt("cid", "M1");
  assert.match(g.text, /select 1 \/ count\(\*\) as ok from child where id = \$1 and legal_mode = \$2/);
  assert.deepEqual(g.params, ["cid", "M1"]);
  await assert.rejects(W.commit("cid", [W.relSessionStmt(child("M1"))]), /child row/);
});
