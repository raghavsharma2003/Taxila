// Migration 007_comprehension.sql against the REAL Neon database: the store's statements land, the M0 mode refuses
// writes, and erasing the child cascades every comprehension row (arm_posteriors has no child id by construction).
// One throwaway guardian + child. Skips without a reachable DATABASE_URL (read from .env.local, process.env untouched).
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { neon, neonConfig } from "@neondatabase/serverless";
import { COMP_TABLES, facetStmts, probeLogStmt, gradeAuditStmt, reteachStmt, weaveStmts, armPosteriorStmt, ratchetStmts } from "../server/comprehension/store.js";
import { newLearnerState, fuseEvidence } from "../server/comprehension/fuse.js";
import { beliefFor } from "../server/comprehension/state.js";
import { enqueue } from "../server/comprehension/weave.js";

const envFile = new URL("../.env.local", import.meta.url);
// A dedicated Neon test branch only (TEST_DATABASE_URL, else the Conductor's test branch): never production.
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const URL_ = process.env.TEST_DATABASE_URL || fromEnvFile("TEST_DATABASE_URL") || process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const sql = URL_ ? neon(URL_) : null;
const nativeFetch = globalThis.__taxilaNativeFetch ?? globalThis.fetch;   // tests/index.js stashes the real one before any file loads
let prevFetchFn, reachable = false;

describe("comprehension store on Neon", { skip: !sql && "no TEST_DATABASE_URL (a Neon branch; never production)", concurrency: false, timeout: 60_000 }, () => {
  let guardian, kid;
  const run = (stmts) => sql.transaction((t) => stmts.map((s) => t.query(s.text, s.params)));
  before(async () => {
    prevFetchFn = neonConfig.fetchFunction; neonConfig.fetchFunction = nativeFetch;
    reachable = await Promise.race([sql.query("select 1 from comp_facet_state limit 1").then(() => true, () => false), new Promise((r) => setTimeout(() => r(false), 45_000))]);
    if (!reachable) return;
    guardian = (await sql.query("insert into guardian (email, pw_hash, name) values ($1, 'x', 'comp-test') returning id", [`comp-test+${randomUUID()}@test.invalid`]))[0].id;
    kid = (await sql.query("insert into child (guardian_id, first_name, class_level) values ($1, 'Test', 5) returning id, legal_mode", [guardian]))[0];
  });
  after(async () => {
    try {
      if (guardian) await sql.query("delete from guardian where id = $1", [guardian]);
      if (kid) {
        const counts = await Promise.all(COMP_TABLES.map((t) => sql.query(`select count(*)::int as n from ${t} where child_id = $1`, [kid.id])));
        assert.deepEqual(counts.map((r) => r[0].n), COMP_TABLES.map(() => 0), "erasure cascades every comprehension row");
      }
    } finally { neonConfig.fetchFunction = prevFetchFn; }
  });

  test("facet state, probe log, grade audit, re-teach, weave and posteriors land; M0 refuses", async (t) => {
    if (!reachable) return t.skip("database not reachable");
    const T0 = "2026-10-01T05:00:00.000Z", SK = "c5-maths-ch01-t01-s1";
    const evs = [{ teach: true }, {}, {}, { cls: "probe.why", outcome: 0, grader: "llm", spanOk: true, shapeId: "C03" }]
      .map((o, i) => ({ id: `d${i}`, seq: i + 1, sessionId: "s1", sessionStartAt: T0, at: T0, episodeId: `ep${i}`, skillIds: [SK], itemKey: "k", cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o }));
    const s = fuseEvidence(newLearnerState({ childId: kid.id, classLevel: 5 }), evs);
    const b = beliefFor(SK, { ...s, now: T0 });
    await run([
      ...facetStmts(kid, [b]),
      probeLogStmt(kid, "s1", { skillId: SK, shapeId: "C03", facet: "U", mandatory: true, reason: "verify_first_correct", testWeight: 0.25 }, "d3"),
      gradeAuditStmt(kid, { session_id: "s1", skill_id: SK, shape_id: "C03", op: "R-EXP", grader_version: "v", model: "m", target_id: "e1", label: "present", span: "zero rakhta hai", span_ok: true, lang: "hi-Latn+en", ms: 800 }, { keepSpan: true }),
      gradeAuditStmt(kid, { session_id: "s1", skill_id: SK, shape_id: "C03", op: "R-EXP", grader_version: "v", model: "m", target_id: "e2", label: "present", span: "no consent words", span_ok: true, lang: "en", ms: 800 }),
      reteachStmt(kid, "s1", { skillId: SK, misId: null, armId: "gen:pictorial", repClass: "pictorial", representation: "diagram", trigger: "u_low_after_practice", move: "reteach", chosenBy: "thompson" }),
      ...weaveStmts(kid, enqueue([], { childId: kid.id, skillId: SK, anchorAt: T0, hostCandidates: ["h"] })),
      armPosteriorStmt(`test-arm-${randomUUID()}`, "maths:T3:B3:en", 0.6),
    ]);
    const [row] = await sql.query("select state, u_p from comp_facet_state where child_id = $1 and skill_id = $2", [kid.id, SK]);
    assert.equal(row.state, b.state);
    assert.ok(Math.abs(row.u_p - b.U) < 1e-12, "double precision round-trips the fold");
    const spans = await sql.query("select target_id, span from grade_audit where child_id = $1 order by target_id", [kid.id]);
    assert.deepEqual(spans.map((x) => [x.target_id, x.span]), [["e1", "zero rakhta hai"], ["e2", null]], "the child's words persist only with transcripts_retention consent");
    const [w] = await sql.query("select status, host_candidates from weave_queue where child_id = $1", [kid.id]);
    assert.deepEqual([w.status, w.host_candidates], ["queued", ["h"]]);
    // re-running the facet upsert is idempotent
    await run(facetStmts(kid, [b]));
    assert.throws(() => facetStmts({ ...kid, legal_mode: "M0" }, [b]), /forbids/);
    await run(ratchetStmts(kid.id));
    const [n] = await sql.query("select count(*)::int as n from probe_log where child_id = $1", [kid.id]);
    assert.equal(n.n, 0, "M0 ratchet deletes comprehension rows");
    await sql.query("delete from arm_posteriors where arm_id like 'test-arm-%'");
  });
});
