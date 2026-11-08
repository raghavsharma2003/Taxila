// Run by tests/pair-db.test.mjs in its OWN process. Child device pairing (round 7, stream G) against the real API
// in-process and a REAL Neon database: the TEST branch only (CONDUCTOR_TEST_DATABASE_URL; skips otherwise and refuses the
// production endpoint). Needs migration 041. No model call.
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

describe("child device pairing (test branch)", { skip: SKIP, concurrency: false, timeout: 180_000 }, () => {
  let server, base, q, one, guardian, other, kid, sib, otherKid, parent, otherParent, resetLimits;
  const call = async (path, { method = "GET", body, cookie } = {}) => {
    const r = await fetch(base + path, { method, headers: { ...(cookie ? { cookie } : {}), ...(body ? { "content-type": "application/json" } : {}), "user-agent": "Mozilla/5.0 (Linux; Android 13; SM-X200)" },
      body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null), cookies: r.headers.getSetCookie?.() ?? [] };
  };
  const session = async (gid) => {
    const t = randomUUID() + randomUUID();
    await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(t).digest("hex"), gid]);
    return `tx_session=${t}`;
  };
  const codeFor = async (childId, cookie = parent) => call("/api/pair/code", { method: "POST", body: { childId }, cookie });
  const pair = async (childId) => {
    const c = await codeFor(childId);
    assert.equal(c.status, 200, JSON.stringify(c.body));
    const r = await call("/api/pair/redeem", { method: "POST", body: { code: c.body.code } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const dev = r.cookies.find((s) => s.startsWith("tx_child="));
    return { ...r, cookie: dev.split(";")[0] };
  };

  before(async () => {
    process.env.DATABASE_URL = TEST;
    ({ q, one } = await import("../server/db.js"));
    ({ _resetLimitsForTests: resetLimits } = await import("../server/pair/routes.js"));
    const { handle } = await import("../server/index.js");
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    await q("delete from guardian where email like 'pair+%@test.invalid' and created_at < now() - interval '1 hour'");
    guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'pair') returning id", [`pair+${RUN}@test.invalid`])).id;
    other = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'pair') returning id", [`pair+${RUN}-b@test.invalid`])).id;
    parent = await session(guardian);
    otherParent = await session(other);
    const kidOf = async (g, name) => (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, $2, 4, 'hinglish', 'asha') returning id", [g, name])).id;
    kid = await kidOf(guardian, "Riya");
    sib = await kidOf(guardian, "Kabir");
    otherKid = await kidOf(other, "Meera");
  });
  after(async () => {
    if (guardian) await q("delete from guardian where id = any($1::uuid[])", [[guardian, other]]);
    server?.close();
  });

  test("code: 6 unambiguous characters, 10 minutes; only for the parent's own child; a new code replaces the old", async () => {
    const a = await codeFor(kid);
    assert.equal(a.status, 200);
    assert.match(a.body.code, /^[2-9A-HJ-NP-Z]{6}$/);
    const ttl = (Date.parse(a.body.expiresAt) - Date.now()) / 60_000;
    assert.ok(ttl > 9 && ttl <= 10.1, `ttl ${ttl} min`);
    assert.equal((await codeFor(kid, otherParent)).status, 403, "another guardian's child");
    assert.equal((await codeFor(kid, null)).status, 401);
    const b = await codeFor(kid);
    resetLimits();
    const old = await call("/api/pair/redeem", { method: "POST", body: { code: a.body.code } });
    assert.equal(old.status, 400, "the replaced code is dead");
    assert.equal(old.body.code, "pair.invalid");
    assert.equal((await one("select count(*)::int as n from pair_code where child_id = $1", [kid])).n, 1);
    assert.equal(b.status, 200);
  });

  test("redeem: works once; expired and wrong codes answer the same generic error", async () => {
    resetLimits();
    const c = await codeFor(kid);
    const r = await call("/api/pair/redeem", { method: "POST", body: { code: c.body.code.toLowerCase() } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(r.body, { childId: kid, name: "Riya" });
    assert.ok(r.cookies.some((s) => /^tx_child=d\.[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; SameSite=Lax; Max-Age=15552000/.test(s)), r.cookies.join(" | "));
    assert.ok(r.cookies.some((s) => s.startsWith(`tx_paired=${kid}; Path=/; SameSite=Lax`)));
    const again = await call("/api/pair/redeem", { method: "POST", body: { code: c.body.code } });
    assert.equal(again.status, 400, "single use");
    const e = await codeFor(kid);
    await q("update pair_code set expires_at = now() - interval '1 second' where child_id = $1", [kid]);
    const late = await call("/api/pair/redeem", { method: "POST", body: { code: e.body.code } });
    const wrong = await call("/api/pair/redeem", { method: "POST", body: { code: "ZZZZZZ" } });
    assert.equal(late.status, 400);
    assert.deepEqual(late.body, wrong.body, "expired and wrong look the same");
  });

  test("the device: its own child's routes only; every parent route refused; the parent's own sign-in still works on it", async () => {
    resetLimits();
    const { cookie } = await pair(kid);
    assert.equal((await call(`/api/child/equip?childId=${kid}`, { cookie })).status, 200, "a child route");
    assert.equal((await call(`/api/child/equip?childId=${sib}`, { cookie })).status, 403, "the sibling");
    assert.equal((await call(`/api/child/equip?childId=${otherKid}`, { cookie })).status, 403);
    for (const p of [`/api/parent/overview?childId=${kid}`, `/api/placement/note?childId=${kid}`, "/api/pair/devices"]) {
      const r = await call(p, { cookie });
      assert.equal(r.status, 403, p);
      assert.equal(r.body.code, "scope.child_device", p);
    }
    assert.equal((await codeFor(kid, cookie)).status, 403, "a device cannot mint codes");
    const both = `${cookie}; ${parent}`;
    assert.equal((await call(`/api/child/equip?childId=${sib}`, { cookie: both })).status, 200, "the parent signed in on the device: the parent session");
  });

  test("lesson-id joins: a device gets 403 on a sibling's REAL lesson on every lesson-keyed path (identity is the child id)", async () => {
    resetLimits();
    const { cookie } = await pair(kid);
    const lessonOf = async (c) => (await one("insert into lesson (child_id, topic_id) values ($1, 'pair-test') returning id", [c])).id;
    const sibLesson = await lessonOf(sib), ownLesson = await lessonOf(kid);
    for (const l of [sibLesson, ownLesson]) await q("insert into turn (lesson_id, seq, speaker, text) values ($1, 1, 'teacher', 'namaste')", [l]);
    const cases = [
      ["turn (brain/turn.js loadTurnContext)", "/api/lesson/turn", "POST", { lessonId: sibLesson, text: "hello" }],
      ["tts-stream (voice.js, its one-query join)", "/api/voice/tts-stream", "POST", { lessonId: sibLesson, seq: 1 }],
      ["studio slot (studio.js lessonFor)", `/api/studio/slot?lessonId=${sibLesson}&intentId=i1`, "GET"],
      ["lesson end (lesson.js loadLessonFor → requireChild)", "/api/lesson/end", "POST", { lessonId: sibLesson }],
    ];
    for (const [name, path, method, body] of cases) {
      const r = await call(path, { method, body, cookie });
      assert.equal(r.status, 403, `${name}: ${r.status} ${JSON.stringify(r.body)}`);
    }
    assert.equal((await call(`/api/studio/slot?lessonId=${ownLesson}&intentId=i1`, { cookie })).status, 200, "its own child's lesson");
    assert.equal((await call(`/api/studio/slot?lessonId=${sibLesson}&intentId=i1`, { cookie: parent })).status, 200, "the parent reaches both children's");
  });

  test("boot on a device: this child only, no guardian email or id, no sibling name or id; the parent's boot is unchanged", async () => {
    resetLimits();
    const { cookie } = await pair(kid);
    const r = await call(`/api/child/boot?childId=${kid}`, { cookie });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const { me } = r.body;
    assert.equal(me.scope, "child");
    assert.equal(me.guardian, null);
    assert.deepEqual(me.consents, []);
    assert.deepEqual(me.children.map((c) => [c.id, c.first_name]), [[kid, "Riya"]]);
    assert.ok(!("guardian_id" in me.children[0]), "the child row's guardian_id is not sent");
    const raw = JSON.stringify(r.body);
    for (const leak of [`pair+${RUN}@test.invalid`, guardian, sib, "Kabir"]) assert.ok(!raw.includes(leak), `boot leaks ${leak}`);
    const p = await call(`/api/child/boot?childId=${kid}`, { cookie: parent });
    assert.equal(p.status, 200);
    assert.equal(p.body.me.guardian.email, `pair+${RUN}@test.invalid`, "the parent's boot keeps today's shape");
    assert.deepEqual(p.body.me.children.map((c) => c.first_name).sort(), ["Kabir", "Riya"]);
  });

  test("devices list and unpair: the session ends at once, only the parent can do it", async () => {
    resetLimits();
    const { cookie } = await pair(kid);
    const list = await call(`/api/pair/devices?childId=${kid}`, { cookie: parent });
    assert.equal(list.status, 200);
    const mine = list.body.devices[0];
    assert.deepEqual(Object.keys(mine).sort(), ["childId", "childName", "id", "label", "lastSeenAt", "pairedAt"]);
    assert.equal(mine.childId, kid);
    assert.equal(mine.childName, "Riya");
    assert.equal(mine.label, "Android tablet");
    assert.equal((await call("/api/pair/devices", { cookie: otherParent })).body.devices.length, 0, "another guardian sees none");
    assert.equal((await call(`/api/pair/devices?id=${mine.id}`, { method: "DELETE", cookie: otherParent })).status, 404);
    assert.equal((await call(`/api/child/equip?childId=${kid}`, { cookie })).status, 200);
    const del = await call(`/api/pair/devices?id=${mine.id}`, { method: "DELETE", cookie: parent });
    assert.deepEqual([del.status, del.body], [200, { ok: true }]);
    const after = await call(`/api/child/equip?childId=${kid}`, { cookie });
    assert.equal(after.status, 401, "unpaired: the very next request");
    assert.ok(!(await call(`/api/pair/devices?childId=${kid}`, { cookie: parent })).body.devices.some((d) => d.id === mine.id));
  });
});
