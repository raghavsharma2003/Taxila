// Run by tests/r12-trace-db.test.mjs in its OWN process (no --test flag: the recorder records as in production), against the
// real API in-process and the Neon TEST branch only (CONDUCTOR_TEST_DATABASE_URL; skips otherwise, refuses production).
// No model call: lessons start on the voice lane (purpose practice), as tests/lesson-safety-naming-db.run.mjs does.
//   (1) the server records srv.req / srv.res for a lesson's requests, keyed by the lesson (sid), the child and guardian;
//   (2) POST /api/trace/batch: client events land; cid only for this guardian's own lesson; tier-2 events refused for a
//       tier-1 account; oversized batches 413; secrets masked; GET /api/me says trace.tier;
//   (3) the parent corner's DELETE /api/children deletes the child's trace rows (cid-keyed AND lesson-keyed ones) and their
//       blobs; DELETE /api/account the same for the guardian;
//   (5) scripts/trace.mjs: a child-id prefix pulls EVERY sid of the child (the Desk's page session joined by rid, the
//       guardian stream, lessons), and --replay gathers the session's rrweb chunks from their blobs;
//   (4) retention: tier 1 older than 30 days and tier 2 older than 90 days go (blobs first), younger rows stay.
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
const TEST_ENV = (process.env.TAXILA_DB || fromEnvFile("TAXILA_DB")) === "test";
const SKIP = !TEST ? "CONDUCTOR_TEST_DATABASE_URL not set" : !TEST_ENV && PROD && hostOf(TEST) === hostOf(PROD) ? "CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing" : false;
const RUN = randomUUID().slice(0, 8);
const OWNER = `r12-owner+${RUN}@test.invalid`;
process.env.TAXILA_TRACE_FULL_FOR = OWNER; // the tier-2 cohort for this run: one account
process.env.TAXILA_TRACE = "on";

describe("flight recorder (test branch)", { skip: SKIP, concurrency: false, timeout: 240_000 }, () => {
  let server, base, q, one, writer, blobDeps;
  const deletedBlobs = [];
  const call = async (path, { method = "GET", body, tok, raw } = {}) => {
    const r = await fetch(base + path, { method, headers: { ...(tok ? { cookie: `tx_session=${tok}` } : {}), ...(body ? { "content-type": "application/json" } : {}) },
      body: raw ?? (body ? JSON.stringify(body) : undefined) });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  async function account(email, pw = "pw-12345678") {
    const { hashPassword } = await import("../server/auth.js");
    const g = (await one("insert into guardian (email, pw_hash, name) values ($1, $2, 'r12') returning id", [email, hashPassword(pw)])).id;
    const t = randomUUID() + randomUUID();
    await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(t).digest("hex"), g]);
    for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [g, p]);
    const kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Riya', 4, 'hinglish', 'asha') returning id", [g])).id;
    await q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')
      on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 45`, [kid]);
    return { g, t, kid, pw };
  }
  const rowsOf = (where, params) => q(`select kind, sid, cid, gid, src, tier, data from trace_event where ${where} order by t, seq`, params);

  before(async () => {
    process.env.DATABASE_URL = TEST;
    ({ q, one } = await import("../server/db.js"));
    writer = await import("../server/trace/writer.js");
    blobDeps = await import("../server/trace/blob.js");
    blobDeps._setTraceBlobDeps({ put: async () => {}, del: async (p) => { deletedBlobs.push(p); } });
    const { handle } = await import("../server/index.js");
    server = http.createServer(handle);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    await q("delete from guardian where email like 'r12-%@test.invalid' and created_at < now() - interval '1 hour'");
  });
  after(async () => {
    await q("delete from guardian where email like $1", [`r12-%+${RUN}@test.invalid`]).catch(() => {});
    blobDeps?._setTraceBlobDeps(null);
    server?.close();
  });

  test("a lesson's requests are recorded (srv.req / srv.res) under the lesson, the child and the guardian; /api/me says the tier", async () => {
    const a = await account(`r12-plain+${RUN}@test.invalid`);
    const me = await call("/api/me", { tok: a.t });
    assert.deepEqual(me.body.trace, { tier: 1 });
    const s = await call("/api/lesson/start", { method: "POST", tok: a.t, body: { childId: a.kid, mode: "voice", purpose: "practice" } });
    assert.equal(s.status, 201, JSON.stringify(s.body));
    await call("/api/lesson/turn", { method: "POST", tok: a.t, body: { lessonId: s.body.lessonId, childText: "", typed: true, password: "should-never-be-stored" } });
    await writer.flushTrace();
    const rows = await rowsOf("sid = $1", [s.body.lessonId]);
    const kinds = rows.map((r) => r.kind);
    assert.ok(kinds.includes("srv.res") && kinds.includes("srv.req"), kinds.join(","));
    const start = rows.find((r) => r.kind === "srv.res" && r.data.route === "POST /api/lesson/start");
    assert.ok(start, "the start is keyed by the lesson it created");
    assert.equal(start.cid, a.kid);
    assert.equal(start.gid, a.g);
    const turnReq = rows.find((r) => r.kind === "srv.req" && r.data.route === "POST /api/lesson/turn");
    assert.equal(turnReq.data.body.password, "[masked]");
    const owner = await account(OWNER);
    assert.deepEqual((await call("/api/me", { tok: owner.t })).body.trace, { tier: 2 });
  });

  test("POST /api/trace/batch: client events land; cid only for the guardian's own lesson; tier 2 refused outside the cohort; 413 over 256 KB", async () => {
    const a = await account(`r12-batch+${RUN}@test.invalid`);
    const b = await account(`r12-other+${RUN}@test.invalid`);
    const mine = (await call("/api/lesson/start", { method: "POST", tok: a.t, body: { childId: a.kid, mode: "voice", purpose: "practice" } })).body.lessonId;
    const theirs = (await call("/api/lesson/start", { method: "POST", tok: b.t, body: { childId: b.kid, mode: "voice", purpose: "practice" } })).body.lessonId;
    const pid = `pid-${RUN}-a`;
    const ev = (sid, kind, extra = {}) => ({ v: 1, sid, src: "client", seq: 1, t: Date.now(), kind, tier: 1, data: { label: "Done", pin: "1234" }, ...extra });
    const r = await call("/api/trace/batch", { method: "POST", tok: a.t, body: { v: 1, pid, events: [ev(mine, "ui.tap"), ev(theirs, "ui.tap"), ev(mine, "rrweb.chunk", { tier: 2 }), ev(mine, "x", { src: "server" })] } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(r.body, { accepted: 2, rejected: 2, tier: 1 });
    const own = await rowsOf("sid = $1 and src = 'client'", [mine]);
    assert.equal(own.length, 1);
    assert.equal(own[0].cid, a.kid);
    assert.equal(own[0].gid, a.g);
    assert.equal(own[0].data.pin, "[masked]");
    const other = await rowsOf("sid = $1 and src = 'client'", [theirs]);
    assert.equal(other[0].cid, null, "never the child of a lesson that is not this guardian's");
    // anonymous (a public page): pid only, no cid / gid
    const anon = await call("/api/trace/batch", { method: "POST", body: { v: 1, pid: `pid-${RUN}-anon`, events: [ev(`pid-${RUN}-anon`, "ui.route")] } });
    assert.deepEqual(anon.body, { accepted: 1, rejected: 0, tier: 1 });
    const big = await call("/api/trace/batch", { method: "POST", tok: a.t, body: { v: 1, pid, events: [ev(mine, "ui.tap", { data: { s: "a ".repeat(140_000) } })] } });
    assert.equal(big.status, 413);
    // tier 2: accepted for the cohort account
    const o = await account(OWNER.replace("owner+", "owner2+"));
    process.env.TAXILA_TRACE_FULL_FOR = `${OWNER},${OWNER.replace("owner+", "owner2+")}`;
    const ol = (await call("/api/lesson/start", { method: "POST", tok: o.t, body: { childId: o.kid, mode: "voice", purpose: "practice" } })).body.lessonId;
    const t2 = await call("/api/trace/batch", { method: "POST", tok: o.t, body: { v: 1, pid: `pid-${RUN}-o`, events: [ev(ol, "rrweb.chunk", { tier: 2, data: { blob: { ref: "2026-10-11/x/client-1.json", bytes: 10, type: "application/json" } } })] } });
    assert.deepEqual(t2.body, { accepted: 1, rejected: 0, tier: 2 });
  });

  test("DELETE /api/children: the child's trace rows (cid-keyed and lesson-keyed) and their blobs are gone; another child's stay", async () => {
    const a = await account(`r12-erase+${RUN}@test.invalid`);
    const keep = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Kabir', 4, 'hinglish', 'asha') returning id", [a.g])).id;
    const lesson = (await call("/api/lesson/start", { method: "POST", tok: a.t, body: { childId: a.kid, mode: "voice", purpose: "practice" } })).body.lessonId;
    await writer.flushTrace();
    const { insertTraceRows } = writer;
    const now = Date.now();
    await insertTraceRows([
      { sid: lesson, pid: null, cid: a.kid, gid: a.g, src: "server", seq: 1, t: now, kind: "model.call", turn: 1, rid: null, tier: 2, data: { blob: { ref: `2026-10-11/${lesson}/server-1.json`, bytes: 5, type: "application/json" } } },
      { sid: lesson, pid: null, cid: null, gid: null, src: "server", seq: 2, t: now, kind: "srv.res", turn: null, rid: null, tier: 1, data: { route: "POST /api/voice/tts-stream" } },
      { sid: `other-${RUN}`, pid: null, cid: keep, gid: a.g, src: "server", seq: 3, t: now, kind: "x", turn: null, rid: null, tier: 1, data: {} },
    ]);
    assert.ok((await rowsOf("sid = $1", [lesson])).length >= 2);
    deletedBlobs.length = 0;
    const r = await call("/api/children", { method: "DELETE", tok: a.t, body: { childId: a.kid, password: a.pw } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal((await rowsOf("sid = $1 or cid = $2", [lesson, a.kid])).length, 0, "every row of the erased child, with a cid or only its lesson id");
    assert.deepEqual(deletedBlobs, [`2026-10-11/${lesson}/server-1.json`]);
    assert.equal((await rowsOf("cid = $1", [keep])).length, 1, "the sibling's row stays");
    // and the account: the sibling and the guardian-keyed rows go with it
    const acc = await call("/api/account", { method: "DELETE", tok: a.t, body: { password: a.pw, confirm: true } });
    assert.equal(acc.status, 200, JSON.stringify(acc.body));
    assert.equal((await rowsOf("cid = $1 or gid = $2", [keep, a.g])).length, 0);
    // a late event of the erased account (the DELETE's own srv.res, flushed after the commit) is not written, and it never
    // takes the rest of its chunk down with it (it once broke the foreign key and dropped the whole chunk)
    const late = `late-${RUN}`;
    await writer.insertTraceRows([
      { sid: late, pid: null, cid: null, gid: a.g, src: "server", seq: 1, t: Date.now(), kind: "srv.res", turn: null, rid: null, tier: 1, data: { route: "DELETE /api/account" } },
      { sid: late, pid: null, cid: keep, gid: null, src: "server", seq: 2, t: Date.now(), kind: "x", turn: null, rid: null, tier: 1, data: {} },
      { sid: late, pid: null, cid: null, gid: null, src: "server", seq: 3, t: Date.now(), kind: "kept", turn: null, rid: null, tier: 1, data: {} },
    ]);
    assert.deepEqual((await rowsOf("sid = $1", [late])).map((r) => r.kind), ["kept"]);
    await q("delete from trace_event where sid = $1", [late]);
  });

  test("trace.mjs: a child prefix finds the Desk's page session (rid join) and the guardian stream; --replay gathers its rrweb chunks", async () => {
    const a = await account(`r12-cli+${RUN}@test.invalid`);
    const { insertTraceRows } = writer;
    const now = Date.now(), P = `pg${RUN}desk`, P2 = `pg${RUN}othr`, rid = `rid-${RUN}-desk`, g = `g:${a.g}`;
    const row = (o) => ({ pid: null, cid: null, gid: null, src: "client", seq: 1, turn: null, rid: null, tier: 1, data: {}, ...o });
    await insertTraceRows([
      row({ sid: g, gid: a.g, cid: a.kid, src: "server", seq: 1, t: now - 5000, kind: "srv.req", rid, data: { route: "GET /api/child/desk" } }),
      row({ sid: g, gid: a.g, src: "server", seq: 2, t: now - 6000, kind: "srv.res", data: { route: "GET /api/me", status: 200, ms: 3 } }),
      row({ sid: P, pid: P, seq: 1, t: now - 5100, kind: "net.res", rid, data: { method: "GET", path: "/api/child/desk", status: 200 } }),
      row({ sid: P, pid: P, seq: 2, t: now - 4000, kind: "flag.owner", data: { note: "the desk looks wrong" } }),
      row({ sid: P, pid: P, seq: 3, t: now - 3000, kind: "rrweb.chunk", tier: 2, data: { seq: 2, blob: { ref: `d/${P}/client-2.json`, bytes: 2, type: "application/x-rrweb+json" } } }),
      row({ sid: P, pid: P, seq: 4, t: now - 3500, kind: "rrweb.chunk", tier: 2, data: { seq: 1, blob: { ref: `d/${P}/client-1.json`, bytes: 2, type: "application/x-rrweb+json" } } }),
      row({ sid: P2, pid: P2, seq: 1, t: now - 2000, kind: "ui.tap", rid: `rid-${RUN}-else`, data: { label: "another page" } }),
    ]);
    const { resolve, gatherReplay } = await import("../scripts/trace.mjs");
    const r = await resolve(q, a.kid.slice(0, 13));
    assert.deepEqual(r.cids, [a.kid]);
    assert.ok(r.sids.includes(g), "the guardian stream");
    assert.deepEqual(r.pids, [P], "the Desk's page session, joined by the request id; never another page");
    // the CLI's merged timeline carries the page's flag and the guardian stream
    const { spawnSync } = await import("node:child_process");
    const cli = spawnSync(process.execPath, [new URL("../scripts/trace.mjs", import.meta.url).pathname, "--session", a.kid.slice(0, 13)],
      { env: { ...process.env, DATABASE_URL: TEST, TEST_DATABASE_URL: TEST, CONDUCTOR_TEST_DATABASE_URL: TEST, TAXILA_DB: "test" }, encoding: "utf8", timeout: 60_000 });
    assert.equal(cli.status, 0, cli.stderr);
    assert.match(cli.stdout, /★ \[client\] OWNER FLAG: "the desk looks wrong"/);
    assert.match(cli.stdout, /← GET \/api\/me 200 3ms/);
    assert.doesNotMatch(cli.stdout, /another page|undefined/);
    // --replay's gathering: both chunks, in time order, from their blobs
    const { mkdtempSync, readdirSync, readFileSync: rf, rmSync } = await import("node:fs");
    const dir = mkdtempSync(new URL("../node_modules/.cache-r12-", import.meta.url).pathname);
    try {
      const got = [];
      const blobs = { [`d/${P}/client-1.json`]: [{ type: 4, timestamp: 1, data: { href: "https://taxila.dev/desk", width: 412, height: 915 } }], [`d/${P}/client-2.json`]: [{ type: 3, timestamp: 2, data: {} }] };
      const g2 = await gatherReplay(q, a.kid.slice(0, 13), dir, async (ref) => { got.push(ref); return Buffer.from(JSON.stringify(blobs[ref])); });
      assert.equal(g2.chunks, 2);
      assert.deepEqual(got, [`d/${P}/client-1.json`, `d/${P}/client-2.json`]);
      assert.equal(g2.href, "https://taxila.dev/desk");
      const files = readdirSync(dir).sort();
      assert.equal(files.length, 2);
      assert.equal(JSON.parse(rf(`${dir}/${files[0]}`, "utf8"))[0].type, 4);
    } finally { rmSync(dir, { recursive: true, force: true }); }
    await q("delete from trace_event where sid = any($1::text[])", [[P, P2, g]]);
    await q("delete from guardian where id = $1", [a.g]);
  });

  test("retention: tier 1 after 30 days, tier 2 after 90 days (blobs first); younger rows stay", async () => {
    const { traceRetention } = await import("../server/trace/erase.js");
    const day = 86_400_000, now = Date.now(), sid = `ret-${RUN}`;
    await writer.insertTraceRows([
      { sid, pid: null, cid: null, gid: null, src: "server", seq: 1, t: now - 31 * day, kind: "old1", turn: null, rid: null, tier: 1, data: {} },
      { sid, pid: null, cid: null, gid: null, src: "server", seq: 2, t: now - 29 * day, kind: "young1", turn: null, rid: null, tier: 1, data: {} },
      { sid, pid: null, cid: null, gid: null, src: "server", seq: 3, t: now - 31 * day, kind: "mid2", turn: null, rid: null, tier: 2, data: {} },
      { sid, pid: null, cid: null, gid: null, src: "server", seq: 4, t: now - 91 * day, kind: "old2", turn: null, rid: null, tier: 2, data: { blob: { ref: `old/${sid}/server-4.json`, bytes: 1, type: "x" } } },
    ]);
    deletedBlobs.length = 0;
    const r = await traceRetention();
    assert.ok(r.rows >= 2, JSON.stringify(r));
    const left = (await rowsOf("sid = $1", [sid])).map((x) => x.kind).sort();
    assert.deepEqual(left, ["mid2", "young1"]);
    assert.ok(deletedBlobs.includes(`old/${sid}/server-4.json`));
  });

  test("a chunk holding a deleted child's event still writes everyone else's (no FK poison; ms-r12-trace-fk-poison)", async () => {
    const sid = `fk-${RUN}`, ghost = randomUUID(), ghostG = randomUUID();
    const n = await writer.insertTraceRows([
      { sid, pid: null, cid: null, gid: null, src: "server", seq: 1, t: Date.now(), kind: "keep.a", turn: null, rid: null, tier: 1, data: {} },
      { sid, pid: null, cid: ghost, gid: null, src: "server", seq: 2, t: Date.now(), kind: "ghost.child", turn: null, rid: null, tier: 1, data: {} },
      { sid, pid: null, cid: null, gid: ghostG, src: "server", seq: 3, t: Date.now(), kind: "ghost.guardian", turn: null, rid: null, tier: 1, data: {} },
      { sid, pid: null, cid: null, gid: null, src: "server", seq: 4, t: Date.now(), kind: "keep.b", turn: null, rid: null, tier: 1, data: {} },
    ]);
    assert.equal(n, 2, "only the two rows with no missing child / guardian are written");
    const left = (await rowsOf("sid = $1", [sid])).map((x) => x.kind).sort();
    assert.deepEqual(left, ["keep.a", "keep.b"]);
    await q("delete from trace_event where sid = $1", [sid]);
  });
});
