// Run by tests/r4-conversation-session-db.test.mjs in its OWN process (TAXILA_SESSION_FIRST=on). The real API in-process and a
// REAL Neon database, the TEST branch only (CONDUCTOR_TEST_DATABASE_URL; skips otherwise and refuses the production endpoint).
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { existsSync, readFileSync } from "fs";
import { createHash, randomUUID } from "crypto";

const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnvFile("DATABASE_URL");
const SKIP = !TEST ? "CONDUCTOR_TEST_DATABASE_URL not set" : PROD && hostOf(TEST) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
const RUN = randomUUID().slice(0, 8);

describe("session-first start (test branch)", { skip: SKIP, concurrency: false, timeout: 180_000 }, () => {
  let server, base, q, one, guardian, kid, token;
  const call = async (path, { method = "GET", body } = {}) => {
    const r = await fetch(base + path, { method, headers: { cookie: `tx_session=${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  before(async () => {
    process.env.DATABASE_URL = TEST;
    ({ q, one } = await import("../server/db.js"));
    const { handle } = await import("../server/index.js");
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    await q("delete from guardian where email like 'r4-session+%@test.invalid' and created_at < now() - interval '1 hour'");
    guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'r4-session') returning id", [`r4-session+${RUN}@test.invalid`])).id;
    token = randomUUID() + randomUUID();
    await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(token).digest("hex"), guardian]);
    kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Kabir', 6, 'hinglish', 'asha') returning id", [guardian])).id;
    await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, 'core_tutoring', 't', true, 't')", [guardian]);
    await q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 60, '00:00', '23:59')
      on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 60`, [kid]);
  });
  after(async () => {
    if (guardian) await q("delete from guardian where id = $1", [guardian]);
    server?.close();
  });

  test("purpose 'session': the lesson opens on the intake beat (no item, no stage), its state holds the session", async () => {
    const r = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice", purpose: "session" } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const row = await one("select state from lesson where id = $1", [r.body.lessonId]);
    assert.equal(row.state.lastMove.kind, "intake");
    assert.equal(row.state.intake.stage, "open");
    assert.ok(row.state.session && Array.isArray(row.state.session.segments) && row.state.session.segments.length === 0);
    assert.equal(row.state.lastMove.itemId, undefined);
    assert.deepEqual(r.body.moduleCommands ?? [], []);
    await q("update lesson set ended_at = coalesce(ended_at, now()) where id = $1", [r.body.lessonId]);
  });

  test("purpose 'lesson' (and 'session' with the flag off) start exactly as before: no intake", async () => {
    const r = await call("/api/lesson/start", { method: "POST", body: { childId: kid, mode: "voice", purpose: "lesson" } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const row = await one("select state from lesson where id = $1", [r.body.lessonId]);
    assert.notEqual(row.state.lastMove.kind, "intake");
    assert.equal(row.state.intake, undefined);
    await q("update lesson set ended_at = coalesce(ended_at, now()) where id = $1", [r.body.lessonId]);
  });
});
