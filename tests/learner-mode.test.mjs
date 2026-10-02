// The single privacy-mode setting gating every learner write (LEARNER-MODEL §4, §12; decision
// learner-legal-mode-ratchet): no write path for a forbidden layer, down-only ratchet, M0 deletes every
// learner row, and the NM-3 schema scan of the 005 migration.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { WRITES, LAYERS, LAYER_TABLES, assertWritable, canWrite, legalModeOf, isRatchetDown, tablesForbiddenIn } from "../server/learner/mode.js";
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

test("legacy builders keep their signatures and default to M1 (the live route's calls are unchanged)", () => {
  const s = W.skillStateStmt("cid", sk);
  assert.match(s.text, /insert into skill_state/);
  assert.equal(s.params[0], "cid");
  assert.equal(s.layer, "kt");
  assert.match(W.misconceptionFlagStmt("cid", "m").text, /misconception_state/);
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
  assert.match(stmts[0].text, /update child set legal_mode = \$2 where id = \$1 and legal_mode = \$3/);
  assert.match(stmts[1].text, /learner_mode_audit/);
  const deleted = stmts.slice(2).map((s) => /delete from (\w+)/.exec(s.text)[1]).sort();
  const all = [...new Set(Object.values(LAYER_TABLES).flat())].sort();
  assert.deepEqual(deleted, all, "M0 keeps no learner row");
  // every child-keyed table created by 005 (except the audit) is covered by some layer
  const created = [...SQL.matchAll(/create table if not exists (\w+) \(([\s\S]*?)\n\);/g)].filter(([, , body]) => /child_id/.test(body)).map(([, t]) => t);
  for (const t of created.filter((t) => t !== "learner_mode_audit")) assert.ok(all.includes(t), `${t} has no layer`);
  // M2 → M1 drops the M2-only learning speed
  assert.ok(tablesForbiddenIn("M1").includes("kt_child"));
  assert.ok(!tablesForbiddenIn("M1").includes("kt_skill_state"));
});

test("NM-3 schema scan: no latency, pause, prosody, affect, mood, engagement, trust, vibe or free-text column in 005", () => {
  const cols = [...SQL.matchAll(/^\s+([a-z_0-9]+)\s+(text|bigint|uuid|int|smallint|boolean|double precision|jsonb|timestamptz|real)/gm)].map((m) => m[1]);
  assert.ok(cols.length > 50, "the scan sees the columns");
  const BANNED = /latency|pause|prosody|affect|mood|engag|trust|vibe|emotion|asr_conf|timing|onset|dwell|note|transcript|free_text|said_text/;
  assert.deepEqual(cols.filter((c) => BANNED.test(c)), []);
  for (const t of ["kt_evidence", "kt_skill_state", "kt_misconception", "kt_ability", "kt_ability_epoch", "kt_child"]) {
    const body = new RegExp(`create table if not exists ${t} \\(([\\s\\S]*?)\\n\\);`).exec(SQL)[1];
    assert.match(body, /references child\(id\) on delete cascade/, `${t} cascades on erasure`);
    assert.match(body, /legal_mode_at_write/, `${t} records its mode`);
  }
  assert.match(SQL, /alter table child add column if not exists legal_mode text not null default 'M1'/);
});
