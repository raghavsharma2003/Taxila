// Run by tests/p3-voicesig-sweep-db.test.mjs in its OWN process (DATABASE_URL points at the Neon TEST branch, which must
// never leak into another suite). ship5 p3-voicesig: the stored answering-pace rows on real Postgres (migration 021):
//   1. endSave writes rows only under a current voice_pace_memory grant; startRows reads them back;
//   2. the consent sweep (server/voicesig/lesson.js SWEEP_SQL, run by the worker's ticker leader, patch 11) deletes a
//      subject whose LATEST consent row is a withdrawal (guardian-wide or child-specific), keeps a granted one, and the
//      delete cascades to voicesig.baseline;
//   3. deleting the child cascades through voicesig.subject (erasure needs no subject key).
// Skips when CONDUCTOR_TEST_DATABASE_URL is unset, refuses the production endpoint, skips when 021 is not migrated.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import { randomBytes, randomUUID } from "crypto";

const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnvFile("DATABASE_URL");
const SKIP = !TEST ? "CONDUCTOR_TEST_DATABASE_URL not set" : PROD && hostOf(TEST) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
const RUN = randomUUID().slice(0, 8);
const KEY = randomBytes(32).toString("hex");

describe("voicesig stored baselines + consent sweep (test branch)", { skip: SKIP, concurrency: false, timeout: 120_000 }, () => {
  let q, one, vs, hasConsent, g1, g2, kidA, kidB, kidC, migrated = true;
  const env = { VOICESIG_SUBJECT_KEY: KEY };
  const consent = (gid, childId, granted) =>
    q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, $2, 'voice_pace_memory', 't', $3, 't')", [gid, childId, granted]);
  const vsb = () => ({ persisted: true, rows: { "answer|hinglish|word|onsetMs": { n: 9, nTotal: 9, mean: 1200, m2: 40000 }, "answer|hinglish|word|pauseFrac": { n: 9, nTotal: 9, mean: 0.1, m2: 0.02 } } });
  const subjects = (ids) => q("select child_id from voicesig.subject where child_id = any($1::uuid[]) order by child_id", [ids]).then((r) => r.map((x) => x.child_id));

  before(async () => {
    process.env.DATABASE_URL = TEST;
    ({ q, one } = await import("../server/db.js"));
    ({ hasConsent } = await import("../server/auth.js"));
    vs = await import("../server/voicesig/lesson.js");
    migrated = !!(await one("select 1 as ok from schema_migrations where name = '021_voicesig.sql'").catch(() => null));
    if (!migrated) return;
    await q("delete from guardian where email like 'p3vs-sweep+%@test.invalid' and created_at < now() - interval '1 hour'");
    g1 = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'p3vs') returning id", [`p3vs-sweep+${RUN}@test.invalid`])).id;
    g2 = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'p3vs') returning id", [`p3vs-sweep+${RUN}-b@test.invalid`])).id;
    const kid = (gid, name) => one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, $2, 5, 'hinglish', 'asha') returning id", [gid, name]).then((r) => r.id);
    kidA = await kid(g1, "Aarav"); kidB = await kid(g1, "Bela"); kidC = await kid(g2, "Chetan");
  });
  after(async () => {
    if (g1) await q("delete from guardian where id = any($1::uuid[])", [[g1, g2]]);
  });

  test("endSave writes only under a current grant; startRows reads the rows back", async (t) => {
    if (!migrated) return t.skip("021_voicesig.sql not applied on the test branch");
    const d = (childId, guardianId) => ({ q, hasConsent, guardianId, childId, classLevel: 5, env });
    assert.equal(await vs.endSave({ ...d(kidA, g1), vsb: vsb() }), 0, "no grant → nothing written");
    await consent(g1, null, true); // guardian-wide grant (A and B)
    await consent(g2, kidC, true); // child-specific grant (C)
    assert.equal(await vs.endSave({ ...d(kidA, g1), vsb: vsb() }), 2);
    assert.equal(await vs.endSave({ ...d(kidB, g1), vsb: vsb() }), 2);
    assert.equal(await vs.endSave({ ...d(kidC, g2), vsb: vsb() }), 2);
    const back = await vs.startRows({ ...d(kidA, g1) });
    assert.equal(back.persisted, true);
    assert.equal(back.rows["answer|hinglish|word|onsetMs"].n, 9);
    assert.deepEqual(await subjects([kidA, kidB, kidC]), [kidA, kidB, kidC].sort());
  });

  test("sweep: a granted subject stays; the latest row decides; a child-specific withdrawal removes only that child", async (t) => {
    if (!migrated) return t.skip("021_voicesig.sql not applied on the test branch");
    assert.ok((await vs.sweep(q)) >= 0, "the sweep ran");
    assert.deepEqual(await subjects([kidA, kidB, kidC]), [kidA, kidB, kidC].sort(), "every subject still holds a grant");
    await consent(g1, kidB, false); // B withdrawn (child-specific row, newer than the guardian-wide grant)
    const n = await vs.sweep(q);
    assert.ok(n >= 1);
    assert.deepEqual(await subjects([kidA, kidB, kidC]), [kidA, kidC].sort(), "only B went");
    const left = await one("select count(*)::int as n from voicesig.baseline b join voicesig.subject s using (subject) where s.child_id = $1", [kidA]);
    assert.equal(left.n, 2, "A's rows untouched");
  });

  test("sweep: a guardian-wide withdrawal removes every child of that guardian; the cascade empties voicesig.baseline", async (t) => {
    if (!migrated) return t.skip("021_voicesig.sql not applied on the test branch");
    const before = await one("select count(*)::int as n from voicesig.baseline");
    await consent(g1, null, false);
    await vs.sweep(q);
    assert.deepEqual(await subjects([kidA, kidB, kidC]), [kidC]);
    const after = await one("select count(*)::int as n from voicesig.baseline");
    assert.ok(after.n <= before.n - 2, `baseline rows cascaded (${before.n} → ${after.n})`);
  });

  test("erasure: deleting the child cascades through voicesig.subject without the subject key", async (t) => {
    if (!migrated) return t.skip("021_voicesig.sql not applied on the test branch");
    await q("delete from child where id = $1", [kidC]);
    assert.deepEqual(await subjects([kidC]), []);
  });

  test("sweep never throws: a failing database returns -1", async () => {
    assert.equal(await vs.sweep(async () => { throw new Error("boom"); }), -1);
  });
});
