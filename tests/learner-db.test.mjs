// The writer against the REAL Neon database (migration 005_learner.sql applied): a folded ledger's
// statements land in one transaction under the advisory lock, kt_evidence replays to the same ledger
// bytes (event-sourced restore = online fold), the M0 ratchet leaves zero learner rows, and erasing the
// child cascades. One throwaway guardian + child; every row cascades on its delete. Skips without a
// reachable DATABASE_URL (read from .env.local without touching process.env).
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { fold, newLedger, canonical } from "../server/learner/kt/ledger.js";
import { currentTheta } from "../server/learner/kt/ability.js";
import { makeLog } from "../server/learner/kt/gen.js";
import { ledgerStmts, lockStmt, ratchetStmts } from "../server/learner/writer.js";
import { eventFromRow } from "../server/learner/model.js";

const envFile = new URL("../.env.local", import.meta.url);
const URL_ = process.env.DATABASE_URL
  || (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL=")) || "").slice(13).replace(/^"(.*)"$/, "$1") : "");
const sql = URL_ ? neon(URL_) : null;
const run = (stmts) => sql.transaction((t) => stmts.map((s) => t.query(s.text, s.params)));
// Probed inside before(), never at import: other files' tests mock global fetch while they run, and an
// import-time query would land in their counters.
let reachable = false;

describe("learner writer on Neon", { skip: !sql && "no DATABASE_URL", concurrency: false, timeout: 120_000 }, () => {
  let guardian, kid;
  before(async () => {
    console.error("[learner-db] fetch native:", String(globalThis.fetch).includes("fetchImpl"));
    reachable = await Promise.race([sql.query("select 1 from kt_evidence limit 1").then(() => true, () => false), new Promise((r) => setTimeout(() => r(false), 15_000))]);
    if (!reachable) return;
    guardian = (await sql.query("insert into guardian (email, pw_hash, name) values ($1, 'x', 'learner-test') returning id", [`learner-test+${randomUUID()}@test.invalid`]))[0].id;
    kid = (await sql.query("insert into child (guardian_id, first_name, class_level) values ($1, 'Test', 5) returning id, legal_mode, class_level", [guardian]))[0];
  });
  after(async () => {
    if (guardian) await sql.query("delete from guardian where id = $1", [guardian]);
    if (kid) {
      const [r] = await sql.query(`select (select count(*) from kt_evidence where child_id = $1) + (select count(*) from kt_skill_state where child_id = $1)
        + (select count(*) from kt_misconception where child_id = $1) + (select count(*) from kt_ability where child_id = $1)
        + (select count(*) from kt_ability_epoch where child_id = $1) as n`, [kid.id]);
      assert.equal(Number(r.n), 0, "erasing the child cascades every learner row");
    }
  });

  test("new children default to M1; staged statements commit; kt_evidence replays to identical bytes", async (t) => {
    if (!reachable) return t.skip("database not reachable");
    assert.equal(kid.legal_mode, "M1");
    const log = makeLog(9, { sessions: 3 }).map(({ seq, ...e }) => ({ ...e, id: `${kid.id}:${e.id}` }));
    const before0 = newLedger({ childId: kid.id, classLevel: 5 });
    // online: one turn at a time, each a transaction under the lock; seq comes from the database
    let L = before0;
    for (let i = 0; i < log.length; i += 7) {
      const batch = log.slice(i, i + 7);
      const next = fold(L, batch);
      const stmts = ledgerStmts(kid, L, next, batch, { currentTheta });
      const out = await run([lockStmt(kid.id), ...stmts]);
      out.slice(1).forEach((rows, k) => { if (/^\s*insert/.test(stmts[k].text)) assert.ok(rows.length <= 1, "one row per write"); });
      L = next;
    }
    const rows = await sql.query("select * from kt_evidence where child_id = $1 order by seq", [kid.id]);
    const replayed = fold(before0, rows.map(eventFromRow));
    // prior.seq is where a prior was materialised: null online (seq is assigned by the database), the db seq on replay
    const noSeq = (sk) => Object.fromEntries(Object.entries(sk).map(([k, v]) => [k, { ...v, prior: { ...v.prior, seq: null } }]));
    const strip = (x) => canonical({ skills: noSeq(x.skills), mis: x.mis, theta: Object.fromEntries(Object.entries(x.ability).map(([s, e]) => [s, currentTheta(e)])) });
    assert.equal(strip(replayed), strip(L), "restore by replay = the online fold");
    const [st] = await sql.query("select count(*)::int as n, min(legal_mode_at_write) as m from kt_skill_state where child_id = $1", [kid.id]);
    assert.equal(st.n, Object.keys(L.skills).length);
    assert.equal(st.m, "M1");
    const [ab] = await sql.query("select m, s from kt_ability_epoch where child_id = $1 order by subject limit 1", [kid.id]);
    const ep = Object.entries(L.ability).sort()[0][1];
    assert.deepEqual(ab.m, ep.base.m, "double precision round-trips the base byte for byte");
  });

  test("ratchet M1 → M0 in one transaction: zero learner rows remain, audit row written, mode moved", async (t) => {
    if (!reachable) return t.skip("database not reachable");
    await run(ratchetStmts(kid, "M0", { actor: "test", reason: "narrow-mode fallback" }));
    const [r] = await sql.query(`select (select count(*) from kt_evidence where child_id = $1) + (select count(*) from kt_skill_state where child_id = $1)
      + (select count(*) from kt_misconception where child_id = $1) + (select count(*) from kt_ability where child_id = $1)
      + (select count(*) from kt_ability_epoch where child_id = $1) + (select count(*) from skill_state where child_id = $1)
      + (select count(*) from evidence where child_id = $1) as n, (select legal_mode from child where id = $1) as mode,
      (select count(*) from learner_mode_audit where child_id = $1 and to_mode = 'M0') as audits`, [kid.id]);
    assert.equal(Number(r.n), 0);
    assert.equal(r.mode, "M0");
    assert.equal(Number(r.audits), 1);
    // the stale M1 context loses: the guard requires the current mode
    await assert.rejects(run(ratchetStmts({ ...kid, legal_mode: "M1" }, "M0")), /division by zero/);
    await sql.query("delete from learner_mode_audit where child_id = $1", [kid.id]);
  });
});
