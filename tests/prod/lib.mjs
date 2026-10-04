// Production acceptance harness (BUILD-PLAN §1.7). SKELETON from the W0 seam commit; W1-D owns and grows it, every
// stream adds one file per workstream as tests/prod/w<wave><stream>-<name>.mjs (e.g. w1a-practice-ask.mjs).
//
// The flow is scripts/prod-smoke.mjs's: signup (an @taxila.test guardian) → child → consent → open the hours → the
// test body → DELETE /api/account in a `finally`, pass or fail. A test file is a plain node script:
//
//   import { withTestAccount, ok, done } from "./lib.mjs";
//   await withTestAccount(async ({ api, child }) => {
//     const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
//     ok(!!s.lessonId, "lesson starts");
//   });
//   done();
//
// Base URL: TAXILA_BASE (run.mjs sets it from --base), else the production URL. Run under NODE_USE_ENV_PROXY=1 so
// fetch goes through the sandbox proxy. Timing gates run ONLY from the Azure probe fleet with no route interception
// (b4-rejected-perf-with-route-interception); from the sandbox these tests are correctness checks.
// File names must not match node --test's patterns (*.test.mjs, test-*.mjs): `npm test` must never hit production.

export const PROD_BASE = "https://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io";
export const BASE = (process.env.TAXILA_BASE || PROD_BASE).replace(/\/+$/, "");
export const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);

// ───────────────────────────── results ─────────────────────────────

const results = [];
/** Record one check. Never throws: a failed check marks the run failed (exit code 1) and the test carries on. */
export function ok(cond, msg) {
  results.push({ pass: !!cond, msg });
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) process.exitCode = 1;
  return !!cond;
}
/** A note for a human (never a failure). */
export const warn = (msg) => console.log(`WARN ${msg}`);
/** Print the tally; call at the end of a test file. */
export function done() {
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed${failed ? `, ${failed} FAILED` : ""} (${BASE})`);
  if (!results.length) process.exitCode = 1; // a test that checked nothing did not pass
}

// ───────────────────────────── API client ─────────────────────────────

/**
 * A cookie-holding JSON client for one account. `api(method, path, body, expect)` throws on a status outside
 * `expect` (the error carries .status and .body) and returns the parsed body plus { status, ms }.
 */
export function apiClient(base = BASE) {
  let cookie = "";
  async function api(method, path, body, expect = [200, 201]) {
    const t = performance.now();
    const res = await fetch(base + path, {
      method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const j = await res.json().catch(() => ({}));
    const ms = Math.round(performance.now() - t);
    if (!expect.includes(res.status)) {
      const err = new Error(`${method} ${path} → ${res.status} ${JSON.stringify(j).slice(0, 300)}`);
      Object.assign(err, { status: res.status, body: j });
      throw err;
    }
    return { status: res.status, ms, ...j };
  }
  api.cookie = () => cookie;
  return api;
}

// ───────────────────────────── test accounts ─────────────────────────────

/**
 * Leftover @taxila.test guardians (BUILD-PLAN §1.7: counted before and after). Needs a DB url for the target
 * (TAXILA_DB_URL; the API has no such count); null when none is configured.
 */
export async function countTestGuardians() {
  const url = process.env.TAXILA_DB_URL;
  if (!url) return null;
  const { neon } = await import("@neondatabase/serverless");
  const rows = await neon(url).query("select count(*)::int as n from guardian where email like '%@taxila.test'");
  return rows[0]?.n ?? null;
}

/**
 * A read query against the target's database (TAXILA_DB_URL: the Neon test branch for a local run, prod for the main
 * loop's run). null when no url is configured: a test then skips its DB checks with a WARN, never a false PASS.
 * @returns {Promise<any[] | null>}
 */
export async function dbq(text, params = []) {
  const url = process.env.TAXILA_DB_URL;
  if (!url) return null;
  const { neon } = await import("@neondatabase/serverless");
  return neon(url).query(text, params);
}

/** Poll fn() every `everyMs` until it returns a truthy value (→ that value) or `maxMs` passes (→ null). */
export async function waitFor(fn, { everyMs = 3000, maxMs = 120_000 } = {}) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > maxMs) return null;
    await new Promise((r) => setTimeout(r, everyMs));
  }
}

/**
 * Run `fn` with a fresh test account, and delete the account afterwards, pass or fail.
 * @param {(ctx: { api: ReturnType<typeof apiClient>, child: any, email: string, password: string }) => Promise<void>} fn
 * @param {{ child?: object, grants?: Record<string, boolean>, controls?: object | null, tag?: string }} [opts]
 *   child: POST /api/children body overrides (default class 5, Hinglish); grants: consents (default all three);
 *   controls: POST /api/parent/controls overrides (default the whole day open; null skips the call).
 */
export async function withTestAccount(fn, opts = {}) {
  const api = apiClient();
  const st = Date.now(), rnd = Math.random().toString(36).slice(2, 8);
  const email = `prod-${opts.tag ?? "w"}+${st}${rnd}@taxila.test`, password = `prod-pw-${st}-${rnd}`;
  const before = await countTestGuardians().catch(() => null);
  let signedUp = false;
  try {
    await api("POST", "/api/auth/signup", { email, password, name: "Prod Test", isGuardianAdult: true });
    signedUp = true;
    const { child } = await api("POST", "/api/children", { firstName: "Riya", classLevel: 5, languagePref: "hinglish", interests: ["cricket"], ...(opts.child ?? {}) });
    await api("POST", "/api/consent", { childId: child.id, grants: opts.grants ?? { core_tutoring: true, learning_profile: true, memory: true } });
    // Lessons start only inside the child's hours (07:00-21:00 IST by default): open the day so a test runs at any time.
    if (opts.controls !== null) await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120, ...(opts.controls ?? {}) });
    await fn({ api, child, email, password });
  } catch (e) {
    ok(false, `test threw: ${e?.message ?? e}`);
  } finally {
    if (signedUp) {
      await api("DELETE", "/api/account", { password, confirm: true }).then(
        () => console.log("cleanup: account deleted"),
        (e) => ok(false, `cleanup: could not delete the test account ${email}: ${e.message}`));
    }
    const after = await countTestGuardians().catch(() => null);
    if (before != null && after != null) ok(after <= before, `leftover @taxila.test guardians ${before} → ${after}`);
  }
}

/** POST /api/lesson/start, then one child turn per line (stops at end); returns { start, turns, end }. */
export async function runLesson(api, childId, { mode = "text", lines = [], purpose, end = true, typed = mode === "text" } = {}) {
  const start = await api("POST", "/api/lesson/start", { childId, mode, ...(purpose ? { purpose } : {}) });
  const turns = [];
  let seq = 0;
  for (const childText of lines) {
    const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText, asrConfidence: 0.95, typed, turnSeq: ++seq });
    turns.push(r);
    if (r.end) break;
  }
  const ended = end ? await api("POST", "/api/lesson/end", { lessonId: start.lessonId }) : null;
  return { start, turns, end: ended };
}

// ───────────────────────────── browser ─────────────────────────────

/**
 * Chromium the way every prod test launches it: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers, the sandbox proxy for a
 * remote base, ignoreHTTPSErrors. Returns { browser, context, page }; close with `browser.close()` in a finally.
 * @param {{ viewport?: { width: number, height: number }, cookieFrom?: ReturnType<typeof apiClient>, launch?: object }} [opts]
 *   cookieFrom: an apiClient whose session cookie the page should carry (signed in as that test guardian).
 */
export async function launch(opts = {}) {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const { chromium } = await import("playwright");
  const proxy = !isLocal && process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ ...(proxy ? { proxy } : {}), ...(opts.launch ?? {}) });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: opts.viewport ?? { width: 360, height: 640 } });
  const c = opts.cookieFrom?.cookie();
  if (c) {
    const i = c.indexOf("=");
    await context.addCookies([{ name: c.slice(0, i), value: c.slice(i + 1), url: BASE }]);
  }
  const page = await context.newPage();
  return { browser, context, page };
}
