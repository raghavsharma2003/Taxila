// Whole-project audit 2026-11-09, platform (PLAT-05, PLAT-11): the limit on wrong tries at an emailed sign-in code.
// PLAT-05: verifyCode counted tries, compared the code, THEN wrote the try, so N parallel requests all read "under 5"
// and every one of them got to compare a guess. PLAT-11: a new code reset the count while older codes stayed live.
// No database: a fake one behind the module's `deps` seam, which yields between statements the way a real round trip
// does, so parallel requests interleave.
import { test } from "node:test";
import assert from "node:assert/strict";

const S = await import("../server/signin/code.js");

function fakeDb() {
  const st = { attempts: 0, compares: 0, spends: 0, inserts: 0 };
  const tick = () => new Promise((r) => setImmediate(r));
  const run = async (sql) => {
    await tick();
    if (/from guardian/.test(sql)) return [{ id: "g1", email: "ops@taxila.test", name: "A" }];
    if (/select max\(created_at\)/.test(sql)) return [{ at: new Date(0) }];
    if (/insert into audit\(guardian_id, action\) values \(\$1, 'code_attempt'\)/.test(sql)) { st.attempts++; return []; }
    if (/select count\(\*\)::int as n from audit/.test(sql)) return [{ n: st.attempts }];
    if (/select count\(\*\)::int as n from password_reset/.test(sql)) return [{ n: 0 }];
    if (/where token_hash = \$1 and guardian_id = \$2/.test(sql)) { st.compares++; return []; }
    if (/update password_reset set used_at = now\(\) where guardian_id = \$1 and token_hash like 'code:%'/.test(sql)) { st.spends++; return []; }
    if (/insert into password_reset/.test(sql)) { st.inserts++; return []; }
    return [];
  };
  return { st, deps: { q: run, one: async (s, p) => (await run(s, p))[0] ?? null, tx: async () => [] } };
}

const withDeps = async (d, fn) => {
  const prev = { ...S.deps };
  Object.assign(S.deps, d);
  try { return await fn(); } finally { Object.assign(S.deps, prev); }
};
const res = () => ({ setHeader() {}, end() {}, statusCode: 0 });

test("PLAT-05: of 20 parallel wrong guesses, at most CODE_TRIES reach the code compare; the rest answer code.tries", async () => {
  const { st, deps } = fakeDb();
  const outs = await withDeps(deps, () => Promise.all(Array.from({ length: 20 }, (_, i) =>
    S.verifyCode({ headers: { "x-forwarded-for": `198.51.100.${i}` }, socket: {} }, res(), { email: "a@b.in", code: String(100000 + i) })
      .then(() => "ok", (e) => e.body?.code ?? e.extra?.code ?? e.details?.code ?? e.status))));
  assert.ok(st.compares <= S.CODE_TRIES, `${st.compares} guesses compared (limit ${S.CODE_TRIES})`);
  assert.equal(outs.filter((o) => o === "ok").length, 0);
  assert.equal(st.attempts, 20, "every request recorded its try first");
});

test("PLAT-05: one at a time, the sixth try is refused and spends the code", async () => {
  const { st, deps } = fakeDb();
  const seen = [];
  await withDeps(deps, async () => {
    for (let i = 0; i < 6; i++) {
      await S.verifyCode({ headers: { "x-forwarded-for": `203.0.113.${i}` }, socket: {} }, res(), { email: "a@b.in", code: "111111" })
        .catch((e) => seen.push(e.status));
    }
  });
  assert.deepEqual(seen, [400, 400, 400, 400, 400, 429]);
  assert.equal(st.compares, 5);
  assert.equal(st.spends, 1);
});

test("PLAT-11: a new code spends every older open code before it is stored", async () => {
  const { st, deps } = fakeDb();
  const prev = { ops: process.env.TAXILA_OPS_KEY, cs: process.env.ACS_CONNECTION_STRING, s: process.env.ACS_SENDER };
  const order = [];
  const spy = { q: async (sql, p) => { order.push(/update password_reset/.test(sql) ? "spend" : /insert into password_reset/.test(sql) ? "insert" : "other"); return deps.q(sql, p); } };
  try {
    process.env.TAXILA_OPS_KEY = "k"; process.env.ACS_CONNECTION_STRING = "x"; process.env.ACS_SENDER = "y";
    await withDeps({ ...deps, ...spy, one: async (s, p) => (await spy.q(s, p))[0] ?? null }, () =>
      S.sendCode({ headers: { "x-taxila-ops": "k", "x-forwarded-for": "192.0.2.1" }, socket: {} }, res(), { email: "a@b.in" }));
  } finally {
    for (const [k, v] of [["TAXILA_OPS_KEY", prev.ops], ["ACS_CONNECTION_STRING", prev.cs], ["ACS_SENDER", prev.s]]) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  }
  assert.equal(st.spends, 1);
  assert.equal(st.inserts, 1);
  assert.ok(order.indexOf("spend") < order.indexOf("insert"), "spent before the new code is stored");
});
