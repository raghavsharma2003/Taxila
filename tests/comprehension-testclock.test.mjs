// The test clock (BUILD-PLAN W1-C #3; comprehension audit G8): pure offset rules, the per-request Date shift, and
// the offset cache. The global Date patch is exercised in a CHILD process so this suite never installs it in the
// shared `npm test` process.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isTestAccount, nextTestOffset, shiftNow, TEST_CLOCK_MAX_MS } from "../server/conductor/clock.js";
import { offsetForToken, _setTestQuery, currentOffsetMs, clockWired } from "../server/comprehension/testclock.js";

const DAY = 86400_000;

test("only @taxila.test guardians are test accounts", () => {
  assert.equal(isTestAccount("probe+1@taxila.test"), true);
  assert.equal(isTestAccount(" Probe@TAXILA.TEST "), true);
  for (const e of ["parent@gmail.com", "x@taxila.test.evil.com", "taxila.test@gmail.com", "", null, undefined]) assert.equal(isTestAccount(e), false, String(e));
});

test("nextTestOffset: absolute or relative, forward only, at most 60 days", () => {
  assert.equal(nextTestOffset({ offsetDays: 1 }, 0), DAY);
  assert.equal(nextTestOffset({ offsetMs: 5000 }, 0), 5000);
  assert.equal(nextTestOffset({ advanceDays: 2 }, DAY), 3 * DAY);
  assert.equal(nextTestOffset({ advanceMs: 10 }, 5), 15);
  assert.equal(nextTestOffset({ offsetDays: 1 }, DAY), DAY, "setting the same offset again is allowed");
  assert.throws(() => nextTestOffset({ offsetDays: 0 }, DAY), /only runs forward/);
  assert.throws(() => nextTestOffset({ advanceDays: -1 }, 3 * DAY), /only runs forward/);
  assert.throws(() => nextTestOffset({ offsetDays: 61 }, 0), /at most 60 days/);
  assert.throws(() => nextTestOffset({}, 0), /give offsetDays/);
  assert.throws(() => nextTestOffset({ offsetDays: "1" }, 0), /give offsetDays/);
  assert.equal(TEST_CLOCK_MAX_MS, 60 * DAY);
  assert.equal(shiftNow(1000, 0), 1000);
  assert.equal(shiftNow(1000, DAY), 1000 + DAY);
});

test("the migration's offset bound equals TEST_CLOCK_MAX_MS, and the lesson trigger shifts insert and end", () => {
  const sql = readFileSync(new URL("../db/migrations/012_pending_grade.sql", import.meta.url), "utf8");
  assert.match(sql, new RegExp(`offset_ms <= ${TEST_CLOCK_MAX_MS}`));
  assert.match(sql, /before insert on lesson/);
  assert.match(sql, /before update of ended_at on lesson/);
  // migrate.mjs splits on ';' at line end: the function must be ONE statement
  const fn = sql.split(/;\s*$/m).find((s) => /create or replace function test_clock_shift_lesson/.test(s));
  assert.match(fn, /end \$tc\$$/);
});

test("offsetForToken: one cached table for every request, real accounts read 0, a failing table reads 0", async () => {
  let calls = 0;
  _setTestQuery(async () => { calls++; return [{ token_hash: "t-test", offset_ms: String(DAY) }]; });
  assert.equal(await offsetForToken("t-test"), DAY);
  assert.equal(await offsetForToken("t-real"), 0);
  assert.equal(await offsetForToken(null), 0);
  assert.equal(calls, 1, "the cache answers within the refresh window");
  _setTestQuery(async () => { throw new Error('relation "test_clock" does not exist'); });
  const warn = console.warn; console.warn = () => {};
  try { assert.equal(await offsetForToken("t-test"), 0); } finally { console.warn = warn; }
  _setTestQuery(null);
  assert.equal(currentOffsetMs(), 0, "outside a clock context the offset is 0");
  assert.equal(clockWired(), false);
});

test("runWithOffset shifts Date.now and new Date() inside the context only; Dates stay Dates (child process)", () => {
  const src = `
    import { runWithOffset, runRequestClock, currentOffsetMs, realNow } from ${JSON.stringify(new URL("../server/comprehension/testclock.js", import.meta.url).href)};
    import { types } from "node:util";
    const DAY = 86400000, out = {};
    const before = new Date();
    out.outsideBefore = Math.abs(Date.now() - realNow()) < 1000;
    await runWithOffset(DAY, async () => {
      await new Promise((r) => setTimeout(r, 5));                       // survives an await
      out.now = Date.now() - realNow();
      out.newDate = new Date().getTime() - realNow();
      out.withArgs = new Date(0).getTime();
      out.parse = Date.parse("2026-01-01T00:00:00Z");
      out.utc = Date.UTC(2026, 0, 1);
      out.str = typeof Date();
      out.inst = new Date() instanceof Date && before instanceof Date && types.isDate(new Date());
      out.iso = typeof new Date().toISOString();
      out.offset = currentOffsetMs();
    });
    out.outsideAfter = Math.abs(Date.now() - realNow()) < 1000 && Math.abs(new Date().getTime() - realNow()) < 1000;
    out.realAfterPatch = await runWithOffset(0, async () => Math.abs(Date.now() - realNow()) < 1000);
    // the router seam with no cookie runs at real time and reports wired
    out.req = await runRequestClock({ headers: {} }, async () => Math.abs(Date.now() - realNow()) < 1000);
    console.log(JSON.stringify(out));`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", src], { encoding: "utf8", timeout: 30_000 });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout.trim().split("\n").at(-1));
  assert.equal(out.outsideBefore, true);
  assert.ok(Math.abs(out.now - DAY) < 1000, `Date.now shifted (${out.now})`);
  assert.ok(Math.abs(out.newDate - DAY) < 1000, `new Date() shifted (${out.newDate})`);
  assert.equal(out.withArgs, 0, "new Date(x) is untouched");
  assert.equal(out.parse, Date.parse("2026-01-01T00:00:00Z"));
  assert.equal(out.utc, Date.UTC(2026, 0, 1));
  assert.equal(out.str, "string", "Date() without new still returns a string");
  assert.equal(out.inst, true, "instanceof Date and util.types.isDate hold for shifted and real instances");
  assert.equal(out.iso, "string");
  assert.equal(out.offset, DAY);
  assert.equal(out.outsideAfter, true, "the real clock outside the context, after the patch is installed");
  assert.equal(out.realAfterPatch, true);
  assert.equal(out.req, true);
});
