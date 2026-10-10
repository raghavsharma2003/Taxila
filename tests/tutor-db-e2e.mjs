// The tutor routes (server/routes/tutor.js) end to end against a REAL Neon database with migration 008 applied.
// NEVER production: runs only against CONDUCTOR_TEST_DATABASE_URL (a dedicated Neon test branch) and refuses when
// its host is the DATABASE_URL (production) host. Not part of `npm test` (it rewires DATABASE_URL for the process).
//   node tests/tutor-db-e2e.mjs
// Checks (round 4, ONE teacher): the offer is [asha]; parked tutors (uma, arjun) refused; a pick of Asha over an old Arjun
// row with its tutor_switch row; 409 while a lesson is live; a B1 switch needs the Parent corner once a PIN exists;
// erasure cascades the log.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { Readable } from "stream";

const envFile = new URL("../.env.local", import.meta.url);
const fromEnv = (n) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(n + "=")) || "").slice(n.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnv("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnv("DATABASE_URL");
if (!TEST) { console.log("SKIP: CONDUCTOR_TEST_DATABASE_URL not set"); process.exit(0); }
// a stream session's .env.local points DATABASE_URL at its own test branch too (TAXILA_DB=test): equality is then not prod
if ((process.env.TAXILA_DB || fromEnv("TAXILA_DB")) !== "test" && PROD && hostOf(TEST) === hostOf(PROD)) { console.error("REFUSING: the test URL is the production endpoint"); process.exit(1); }
process.env.DATABASE_URL = TEST;
delete process.env.DB_DRIVER;

const { q, one } = await import("../server/db.js");
const { handle } = await import("../server/router.js");
const { routes } = await import("../server/routes/tutor.js");
const { register } = await import("../server/router.js");
const { createSession, hashPassword } = await import("../server/auth.js");
register(routes);

function call(method, url, body, cookie) {
  const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
  Object.assign(req, { method, url, headers: { cookie, "content-type": "application/json", "user-agent": "tutor-e2e" } });
  return new Promise((resolve) => {
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, writeHead(s, h) { this.statusCode = s; Object.assign(this.headers, h || {}); return this; },
      end(b) { resolve({ status: this.statusCode, body: b ? JSON.parse(String(b)) : null }); } };
    void handle(req, res);
  });
}

const run = randomUUID().slice(0, 8);
const g = await one("insert into guardian(email, pw_hash, name) values ($1, 'x', 'tutor-e2e') returning id", [`tutor-e2e+${run}@test.invalid`]);
const results = [];
const ok = (name) => { results.push(name); console.log("ok -", name); };
try {
  const fake = { headers: {}, setHeader(k, v) { this.headers[k] = v; } };
  await createSession(fake, g.id, "tutor-e2e");
  const cookie = String(fake.headers["set-cookie"]).split(";")[0];
  // ONE teacher (dc-r4-single-teacher-asha): a class 8 row from before round 4 stores the old default Arjun
  const kid8 = (await one("insert into child(guardian_id, first_name, class_level, teacher_id) values ($1,'E2E8',8,'arjun') returning id", [g.id])).id;
  const kid2 = (await one("insert into child(guardian_id, first_name, class_level, teacher_id) values ($1,'E2E2',2,'asha') returning id", [g.id])).id;

  const l8 = await call("GET", `/api/tutors?childId=${kid8}`, null, cookie);
  assert.equal(l8.status, 200);
  assert.equal(l8.body.chosen, false);
  assert.deepEqual([l8.body.mode, l8.body.tutors, l8.body.name], ["single", ["asha"], "Asha"]);
  ok(`GET offer class 8: mode=${l8.body.mode} tutors=${l8.body.tutors.join(",")} (the one teacher)`);

  for (const parked of ["uma", "arjun"]) {
    const r = await call("POST", "/api/tutors/choose", { childId: kid8, tutorId: parked, source: "child" }, cookie);
    assert.equal(r.status, 403, `${parked}: ${JSON.stringify(r.body)}`);
  }
  assert.equal((await one("select teacher_id from child where id = $1", [kid8])).teacher_id, "arjun", "nothing written");
  ok("POST uma / arjun (parked) → 403, nothing written");

  const pick = await call("POST", "/api/tutors/choose", { childId: kid8, tutorId: "asha", source: "child", shown: ["asha"], msToChoose: 4200 }, cookie);
  assert.equal(pick.status, 200, JSON.stringify(pick.body));
  const row = await one("select teacher_id, tutor_chosen_at from child where id = $1", [kid8]);
  assert.equal(row.teacher_id, "asha");
  assert.ok(row.tutor_chosen_at);
  const sw = await one("select from_id, to_id, source, shown, ms_to_choose from tutor_switch where child_id = $1", [kid8]);
  assert.deepEqual([sw.from_id, sw.to_id, sw.source, sw.ms_to_choose], ["arjun", "asha", "child", 4200]);
  ok("a pick of Asha stored: child.teacher_id + tutor_chosen_at + one tutor_switch row (from_id = the old Arjun row)");

  // a live lesson (open, recent) → 409
  const lid = randomUUID();
  await q("insert into lesson(id, child_id, topic_id, kind, state) values ($1,$2,'t','live','{}')", [lid, kid8]);
  const busy = await call("POST", "/api/tutors/choose", { childId: kid8, tutorId: "asha", source: "child" }, cookie);
  assert.equal(busy.status, 409);
  const live = await call("GET", `/api/tutors?childId=${kid8}`, null, cookie);
  assert.equal(live.body.live, true);
  await q("update lesson set started_at = now() - interval '61 minutes' where id = $1", [lid]);
  assert.equal((await call("POST", "/api/tutors/choose", { childId: kid8, tutorId: "asha", source: "child" }, cookie)).status, 409);
  await q("update lesson set started_at = now() - interval '7 hours' where id = $1", [lid]);
  assert.equal((await call("GET", `/api/tutors?childId=${kid8}`, null, cookie)).body.live, false);
  await q("update lesson set ended_at = now() where id = $1", [lid]);
  ok("409 while a lesson is live, also after a 61-minute pause; an open row idle 7 h is abandoned; GET reports live");

  const n0 = (await one("select count(*)::int as n from tutor_switch where child_id = $1", [kid8])).n;
  const re = await call("POST", "/api/tutors/choose", { childId: kid8, tutorId: "asha", source: "child" }, cookie);
  assert.equal(re.status, 200);
  const last = await one("select from_id, to_id from tutor_switch where child_id = $1 order by at desc, id desc limit 1", [kid8]);
  assert.equal((await one("select count(*)::int as n from tutor_switch where child_id = $1", [kid8])).n, n0 + 1);
  assert.deepEqual([last.from_id, last.to_id], ["asha", "asha"]);
  ok("single-statement pick: exactly one log row per pick; from_id records the previous teacher");

  // B1 (class 2): a re-pick of the same teacher is not a switch; a class 1-2 row a parent had set to Arjun moving to Asha IS
  // a switch, and once a PIN exists it needs the Parent corner
  const first2 = await call("POST", "/api/tutors/choose", { childId: kid2, tutorId: "asha", source: "child_random" }, cookie);
  assert.equal(first2.status, 200, JSON.stringify(first2.body));
  await q("insert into guardian_pin(guardian_id, pin_hash) values ($1, $2)", [g.id, hashPassword("1234")]);
  const again = await call("POST", "/api/tutors/choose", { childId: kid2, tutorId: "asha", source: "child" }, cookie);
  assert.equal(again.status, 200, "re-choosing the same tutor is not a switch");
  ok("B1: first pick (child_random) without unlock; same-tutor re-pick allowed with a PIN set");
  await q("update child set teacher_id = 'arjun' where id = $1", [kid2]);
  const sw2 = await call("POST", "/api/tutors/choose", { childId: kid2, tutorId: "asha", source: "child" }, cookie);
  assert.ok(sw2.status >= 400 && sw2.status < 500 && sw2.status !== 409, `B1 switch without the corner must be refused, got ${sw2.status}`);
  assert.equal((await one("select teacher_id from child where id = $1", [kid2])).teacher_id, "arjun");
  ok(`B1 switch arjun → asha with a PIN set and the corner locked → ${sw2.status} (unchanged; Asha teaches anyway)`);

  // foreign child → 403
  const other = await call("GET", `/api/tutors?childId=${randomUUID()}`, null, cookie);
  assert.equal(other.status, 403);
  ok("another family's child → 403");

  await q("delete from child where id = $1", [kid8]);
  const left = await one("select count(*)::int as n from tutor_switch where child_id = $1", [kid8]);
  assert.equal(left.n, 0);
  ok("erasing the child cascades tutor_switch");
} finally {
  await q("delete from guardian where id = $1", [g.id]);
}
console.log(`\n${results.length} checks passed (${new Date().toISOString()}, test branch host ${hostOf(TEST).split(".")[0]})`);
