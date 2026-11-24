// Round 7, M4 hardening (2026-11-06): break tests for the "without fail" keeper and verifier. Two runners (the ACA job and
// taxila-m3-vm) share one ledger under a blob lease; the closed loop raises a lane's target; the VM spends from a local
// mirror when the shared ledger is out of reach; the verifier holds M4 (7 required, alert under 8), the INR runway, the
// burst alarm, runner coverage and the secret's expiry. Everything runs against fakes (tests/fixtures/m3-fake-azure.mjs,
// tests/fixtures/m3-fake-arm.mjs): no network, no Azure, deterministic. The CLI dry runs run in a child process.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as P from "../infra/m3/plan.js";
import * as VM from "../infra/m3/vm.js";
import { fakeAzure, runKeeper as run } from "./fixtures/m3-fake-azure.mjs";

// the in-job scripts read some env at load: the same M3_* values tests/m3-plan.test.mjs sets (one module instance serves
// both files under the one-process `npm test`)
Object.assign(process.env, { M3_STORAGE_ACCOUNT: "acct", M3_STORAGE_KEY: Buffer.from("k".repeat(32)).toString("base64"), M3_CONTAINER: "m3-ledger", M3_BACKOFF_MS: "1" });   // one-process-safe: M3_* names only, read by no other suite
delete process.env.M3_ROLE;   // one-process-safe: M3_* names only, read by no other suite
const K = await import("../infra/m3/keeper-job.mjs");
const V = await import("../infra/m3/verify-job.mjs");

const D = "2026-11-07", L = `ledger/${D}.json`;
const at = (t, d = D) => `${d}T${t}Z`;
const keeper = (az, iso, env = {}) => run(K, az, iso, env);
const FB2 = { M3_AOAI_FALLBACK2_ENDPOINT: "https://fb2.openai.azure.com/openai/v1", M3_AOAI_FALLBACK2_KEY: "fb2-secret", M3_AOAI_FALLBACK2_DEPLOYMENT: "dep-fb2",
  M3_AOAI_FALLBACK2_PRICE_IN: "0.2", M3_AOAI_FALLBACK2_PRICE_CACHED: "0.02", M3_AOAI_FALLBACK2_PRICE_OUT: "1.2" };
const MODELS_BATCH_WORST = 6 * (300 * 0.2 + 6000 * 1.2) / 1e6;   // 6 calls at max_completion_tokens: the most one lost batch can hide
const inRange = (v, lo, hi, what) => assert.ok(v >= lo - 1e-9 && v <= hi + 1e-9, `${what}: ${v} not in [${lo}, ${hi}]`);
const targetsMet = (s, what, caps = { models: 2, tts: 2, storage: 2 }) => {
  inRange(s.models, 1.35, caps.models, `${what} models`); inRange(s.tts, 1.35, caps.tts, `${what} tts`); inRange(s.storage, 1.25, caps.storage, `${what} storage`);
};
const localDir = () => mkdtempSync(join(tmpdir(), "m3-local-"));

// ───────────────────────────── keeper breaks ─────────────────────────────

test("break: a run dies mid-lane after a batch it paid for; a retry inside the lease waits; the next slot adopts its write-ahead and finishes under the cap", async () => {
  let crashed = false;
  // content PUTs to the ledger: create, then before / after each batch → #7 is the write after the 3rd models batch
  const az = fakeAzure({ down: () => crashed, failPut: (name, n) => { if (name === L && n === 7) { crashed = true; return true; } return false; } });
  const a = await keeper(az, at("00:17:05"), { M3_RUNNER: "aca" });
  assert.equal(a.code, 1);
  assert.match(a.lane("models").err, /ledger write failed after a batch/);
  assert.deepEqual([az.calls.tts, az.calls.list], [0, 0], "a dead run spends nothing more: no lane got past its write-ahead");
  const paid = az.spent().models;
  inRange(paid, 3 * 6 * 0.004816, 3 * 6 * 0.004816, "three batches were paid");
  assert.ok(az.lease(L)?.until > az.now(), "the dead run never released its lease");
  crashed = false;
  const b = await keeper(az, at("00:17:35"), { M3_RUNNER: "aca" });   // the job's retry, 30 s later: the lease still holds
  assert.equal(b.code, 0); assert.ok(b.lines.some((l) => /another runner holds the day's ledger lease/.test(l)));
  assert.equal(az.spent().models, paid, "the retry spent nothing");
  const c = await keeper(az, at("01:47:05"), { M3_RUNNER: "vm" });   // the VM's slot: the lease has long expired
  assert.equal(c.code, 0); assert.ok(c.lines.includes("M3-RUN-OK"));
  const led = az.ledger(D);
  inRange(led.lanes.models.orphanUsd, MODELS_BATCH_WORST, MODELS_BATCH_WORST + 2e-4, "the dead run's write-ahead is adopted as an orphan, still counted");
  const s = az.spent();
  inRange(s.models, 1.35 - MODELS_BATCH_WORST, 2, "models: short by at most the lost batch's worst case, never past the cap");
  inRange(s.tts, 1.35, 2, "tts"); inRange(s.storage, 1.25, 2, "storage");
  assert.deepEqual(led.runs.map((r) => [r.runner, !!r.end]), [["aca", false], ["vm", true]], "the dead run's entry stays, unfinished");
});

test("break: two runners at once (the VM's timer fires mid ACA batch) — only the lease holder spends; the other does nothing", async () => {
  const az = fakeAzure(), T = at("03:17:05");
  let pB = null, codeB = null;
  const inner = az.fetch;
  az.fetch = async (url, init) => {
    if (!pB && String(url).includes("/chat/completions")) {
      process.env.M3_RUNNER = "vm";
      pB = K.main(new Date(T));   // reads M3_RUNNER before its first await
      process.env.M3_RUNNER = "aca";
      codeB = await pB;
    }
    return inner(url, init);
  };
  const a = await keeper(az, T, { M3_RUNNER: "aca" });
  assert.equal(a.code, 0); assert.equal(codeB, 0);
  const waited = a.lines.map((l) => (l.startsWith("M3 ") ? JSON.parse(l.slice(3)) : null)).find((x) => x?.mode === "wait");
  assert.equal(waited?.runner, "vm", "the VM run found the lease held and did nothing");
  targetsMet(az.spent(), "one spender");
  assert.deepEqual(az.ledger(D).runs.map((r) => r.runner), ["aca"]);
  const calls = { ...az.calls };
  const late = await keeper(az, at("04:47:05"), { M3_RUNNER: "vm" });   // the VM's next slot: everything is at target
  assert.equal(late.code, 0);
  assert.deepEqual([az.calls.chat, az.calls.tts, az.calls.list], [calls.chat, calls.tts, calls.list]);
  assert.deepEqual(az.ledger(D).runs.map((r) => r.runner), ["aca", "vm"]);
});

test("break: every ACA run of the day fails (its region cannot reach the ledger); the VM runner alone reaches every target", async () => {
  let who = "aca";
  const az = fakeAzure({ down: () => who === "aca" });
  const out = [];
  for (const [t, w] of [["00:17:05", "aca"], ["01:47:05", "vm"], ["03:17:05", "aca"], ["04:47:05", "vm"], ["21:17:05", "aca"], ["22:47:05", "vm"]]) {
    who = w;
    out.push([w, await keeper(az, at(t), { M3_RUNNER: w })]);
  }
  for (const [w, r] of out.filter(([w]) => w === "aca")) { assert.equal(r.code, 1, w); assert.equal(r.alerts[0].reason, "ledger-unreadable"); }
  assert.ok(out[1][1].lines.includes("M3-RUN-OK"));
  targetsMet(az.spent(), "the VM alone");
  const led = az.ledger(D);
  assert.deepEqual(V.ledgerRuns(led).runners, ["vm"], "the verifier sees only the VM ran (runner-missing aca)");
  assert.equal(V.verifyAlerts({ result: V.computeStreak({}, { asOf: "2026-11-08" }), ledger: V.ledgerShort(led, P.LANES), runs: V.ledgerRuns(led),
    runners: { expected: ["aca", "vm"] }, today: "2026-11-08" }).reasons.map((r) => r.reason).join(), "runner-missing");
});

test("break: eastus2 is down all day (ledger, primary models account) — the VM's 22:47 local fallback spends once, on fallback2; the next day folds it in", async () => {
  const dir = localDir();
  let eus2 = true;
  const az = fakeAzure({ down: () => eus2, chat: (b, u) => (eus2 && u.hostname === "example.openai.azure.com" ? { status: 503 } : { prompt_tokens: 80, completion_tokens: 4000 }) });
  const env = (w) => ({ ...FB2, M3_RUNNER: w, M3_LOCAL_DIR: w === "vm" ? dir : undefined });
  try {
    for (const [t, w] of [["00:17:05", "aca"], ["01:47:05", "vm"], ["21:17:05", "aca"]]) {
      const r = await keeper(az, at(t), env(w));
      assert.equal(r.code, 1); assert.equal(r.alerts.at(-1).reason, "ledger-unreadable", `${w} ${t}: nothing spent without the shared ledger before 22:00`);
    }
    assert.equal(az.calls.chat + az.calls.tts, 0);
    const local = await keeper(az, at("22:47:05"), env("vm"));
    assert.equal(local.code, 1, "the storage lane cannot spend while the storage account is down");
    assert.ok(local.alerts.some((a) => a.reason === "ledger-unreachable" && /vm local fallback/.test(a.action)));
    assert.ok(local.lane("models").ok && local.lane("tts").ok && !local.lane("storage").ok);
    assert.ok(local.lines.some((l) => l.startsWith("M3-FALLBACK ") && l.includes('"to":"fallback2"')));
    inRange(az.byDep["dep-fb2"], 1.35, 2, "models via the southindia twin");
    const once = az.spent();
    const again = await keeper(az, at("23:05:05"), env("vm"));   // a manual re-run the same night
    assert.equal(again.lane("models").spent, 0); assert.equal(again.lane("tts").spent, 0);
    assert.deepEqual([az.spent().models, az.spent().tts], [once.models, once.tts], "the offline ledger stops a second local spend");
    assert.ok(existsSync(join(dir, `offline-${D}.json`)));
    eus2 = false;   // the next day: the region is back
    const next = await keeper(az, at("01:47:05", "2026-11-08"), env("vm"));
    assert.equal(next.code, 0);
    assert.ok(next.lines.some((l) => l.startsWith("M3-FOLD ") && l.includes(D)));
    const led = az.ledger(D);
    inRange(led.lanes.models.offlineUsd, once.models - 1e-3, 2, "yesterday's offline models spend is in yesterday's shared ledger");
    inRange(led.lanes.tts.offlineUsd, once.tts - 1e-3, 2, "tts too");
    assert.deepEqual(P.ledgerShort(led).short.map((x) => x.lane), ["storage"], "the verifier sees exactly what was lost");
    targetsMet({ models: az.spent().models - once.models, tts: az.spent().tts - once.tts, storage: az.spent().storage }, "2026-11-08 on its own ledger");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("break: 404 / 429 storms on the primary models deployment — the fallback chain still reaches the target, under the cap", async () => {
  const n = {};
  const az = fakeAzure({ chat: (b) => { n[b.model] = (n[b.model] || 0) + 1; return b.model === "dep-fast" ? { status: 404 } : b.model === "dep-fb" ? { status: 429 } : { prompt_tokens: 80, completion_tokens: 4000 }; } });
  const r = await keeper(az, at("03:17:05"), FB2);
  assert.equal(r.code, 0);
  assert.equal(n["dep-fast"], 6, "a 404 (the deployment is gone) moves on after ONE batch, not three");
  assert.deepEqual(r.alerts.map((a) => [a.reason, a.lane, a.endpoint, a.status]), [["deployment-missing", "models", "primary", 404]]);
  const to = r.lines.filter((l) => l.startsWith("M3-FALLBACK ")).map((l) => JSON.parse(l.slice(12)).to);
  assert.deepEqual(to, ["fallback", "fallback2"]);
  assert.equal(az.byDep["dep-fast"], undefined); assert.equal(az.byDep["dep-fb"], undefined, "throttled and missing calls bill nothing");
  inRange(r.lane("models").via.fallback2, 1.35, 2, "fallback2 carried the lane");
  inRange(az.spent().models, 1.35, 2, "models");
  // a 429 storm alone: three failed batches, then the next endpoint; no alert (a throttle is not a broken key)
  const az2 = fakeAzure({ chat: (b) => (b.model === "dep-fast" ? { status: 429 } : { prompt_tokens: 80, completion_tokens: 3000 }) });
  const r2 = await keeper(az2, at("03:17:05"), FB2);
  assert.equal(r2.code, 0); assert.deepEqual(r2.alerts, []);
  inRange(r2.lane("models").via.fallback, 1.35, 2, "fallback (taxila-brain) carried it");
});

test("break: a 401 on the primary Speech key prints an immediate M3-ALERT naming the lane, and the second region carries TTS", async () => {
  const az = fakeAzure({ tts: (region) => (region === "centralindia" ? 401 : null) });
  const r = await keeper(az, at("03:17:05"), { M3_RUNNER: "vm", M3_SPEECH_FALLBACK_REGION: "swedencentral", M3_SPEECH_FALLBACK_KEY: "speech-fb-secret" });
  assert.equal(r.code, 0);
  const i = r.lines.findIndex((l) => l.startsWith("M3-ALERT ")), j = r.lines.findIndex((l) => l.startsWith("M3 ") && l.includes('"lane":"tts"'));
  assert.ok(i >= 0 && i < j, "the alert comes before the lane finishes");
  assert.deepEqual(r.alerts.map((a) => [a.reason, a.lane, a.endpoint, a.status, a.runner]), [["auth-failed", "tts", "primary", 401, "vm"]]);
  inRange(r.lane("tts").via.fallback, 1.35, 2, "swedencentral");
  assert.deepEqual(P.ledgerRuns(az.ledger(D)).alerts.map((a) => [a.runner, a.reason, a.lane]), [["vm", "auth-failed", "tts"]], "recorded for the verifier");
  // the ledger itself refused (a rotated storage key): the lane is named "ledger"
  const az2 = fakeAzure({ failGet: (name) => (name === L ? 403 : false) });
  const r2 = await keeper(az2, at("03:17:05"));
  assert.equal(r2.code, 1);
  assert.deepEqual(r2.alerts.map((a) => [a.reason, a.lane || a.state]), [["auth-failed", "ledger"], ["ledger-unreadable", "auth"]]);
});

test("break: a corrupt or unreadable ledger never double-spends (ACA, the VM, its local fallback, a re-run)", async () => {
  const dir = localDir();
  try {
    // corrupt after the day was spent: nobody spends, not even the VM's late local fallback
    const az = fakeAzure();
    await keeper(az, at("00:17:05"));
    const spent = az.spent();
    for (const bad of ['{"v":2,"date":"2026-11-0', JSON.stringify({ v: 2, date: "2026-11-06", lanes: {} })]) {
      az.put(L, bad);
      const a = await keeper(az, at("03:17:05"));
      const v = await keeper(az, at("22:47:05"), { M3_RUNNER: "vm", M3_LOCAL_DIR: dir });
      for (const r of [a, v]) { assert.equal(r.code, 1); assert.equal(r.alerts.at(-1).reason, "ledger-corrupt"); }
    }
    assert.deepEqual(az.spent(), spent);
    // unreachable after the VM has SEEN the spend: its 22:47 local fallback buys nothing
    let out = false;
    const az2 = fakeAzure({ down: () => out });
    await keeper(az2, at("00:17:05"));
    await keeper(az2, at("01:47:05"), { M3_RUNNER: "vm", M3_LOCAL_DIR: dir });   // tops up nothing, mirrors the ledger
    const seen = az2.spent(), calls = { ...az2.calls };
    out = true;
    assert.equal((await keeper(az2, at("03:17:05"))).code, 1);
    const late = await keeper(az2, at("22:47:05"), { M3_RUNNER: "vm", M3_LOCAL_DIR: dir });
    assert.equal(late.code, 0, "every lane is at target by the mirror");
    assert.ok(late.alerts.some((a) => a.reason === "ledger-unreachable"));
    assert.deepEqual([az2.calls.chat, az2.calls.tts, az2.calls.list], [calls.chat, calls.tts, calls.list]);
    assert.deepEqual(az2.spent(), seen);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("closed loop: a lane billed under $1.20 on the last closed day is raised by target/actual, capped at $2.50; the raise is recorded and never drops", async () => {
  const base = Object.fromEntries(Object.entries(P.LANES).map(([k, v]) => [k, { targetUsd: v.targetUsd, capUsd: v.capUsd }]));
  const rep = (p, lastClosed = "2026-11-05") => ({ date: D, lastClosed, days: [{ date: lastClosed, portfolio: p }] });
  const t = P.laneTargets({ base, report: rep({ models: 1.0, tools: 0, storage: 1.3 }) });
  assert.deepEqual([t.models.target, t.models.cap, t.tts.target, t.tts.cap, t.storage.target, t.storage.cap], [1.82, 2, 2.5, 2.65, 1.25, 2]);
  assert.match(t.models.raise.why, /models billed \$1 on 2026-11-05, under \$1\.2: target x 1\.35, capped at \$2\.5/);
  assert.equal(t.storage.raise, undefined);
  assert.equal(P.laneTargets({ base, report: rep({ models: 1.19, tools: 1.2, storage: 0.5 }) }).models.target, 1.53);
  assert.equal(P.laneTargets({ base, report: rep({ models: 1.19, tools: 1.2, storage: 0.5 }) }).tts.raise, undefined, "$1.20 is not under $1.20");
  assert.equal(P.laneTargets({ base, report: rep({ models: 1.19, tools: 1.2, storage: 0.5 }) }).storage.target, 2.5, "1.25 x 1.25 / 0.5 = 3.13 → capped");
  assert.equal(P.laneTargets({ base, report: rep({ models: 0.2 }), since: "2026-11-06" }).models.target, 1.35, "a day before M3_SINCE (the keeper's first full day) never raises");
  assert.deepEqual(P.laneTargets({ base, report: null }).models, { target: 1.35, cap: 2 });
  assert.equal(P.laneTargets({ base, report: rep({ models: 1.5, tools: 1.5, storage: 1.5 }), prev: t }).tts.target, 2.5, "a healthier report later the same day does not lower it");
  // end to end: the report blob the verifier wrote → today's ledger targets → the spend
  const az = fakeAzure();
  az.put(`report/${D}.json`, rep({ models: 1.0, tools: 0, storage: 1.3 }));
  const r = await keeper(az, at("00:17:05"));
  assert.equal(r.code, 0);
  assert.deepEqual(r.lines.filter((l) => l.startsWith("M3-RAISE ")).map((l) => JSON.parse(l.slice(9))).map((x) => [x.lane, x.to, x.cap]), [["models", 1.82, 2], ["tts", 2.5, 2.65]]);
  const led = az.ledger(D);
  assert.equal(led.targets.tts.raise.actual, 0); assert.equal(led.targets.tts.raise.day, "2026-11-05");
  const s = az.spent();
  inRange(s.models, 1.82, 2, "models raised"); inRange(s.tts, 2.5, 2.65, "tts raised, under its day cap"); inRange(s.storage, 1.25, 2, "storage as planned");
  az.put(`report/${D}.json`, rep({ models: 1.5, tools: 1.5, storage: 1.5 }));   // the 18:41 report says all is well now
  const later = await keeper(az, at("15:17:05"));
  assert.equal(later.lane("tts").target, 2.5); assert.equal(later.lane("tts").spent, 0);
});

test("break: the 23:59 / 00:01 UTC boundary — no batch in a day's last 20 minutes, a run that crosses into it stops, the new day starts clean", async () => {
  const az = fakeAzure();
  const late = await keeper(az, at("23:45:00"));
  assert.equal(late.code, 0); assert.match(late.lines[0], /day-end guard/);
  assert.equal(az.blobs.size, 0, "it does not even create the day's ledger");
  // starts 1 ms before the guard; its own reads take >= 5 ms, so the guard catches it before the first batch
  const az2 = fakeAzure({ slow: (u) => (u.pathname.includes("/report/") ? 5 : 0) });
  const mid = await keeper(az2, "2026-11-07T23:39:59.999Z");
  assert.equal(mid.code, 1);
  for (const id of ["models", "tts", "storage"]) assert.match(mid.lane(id).err, /day-end guard \(20 min\)/, id);
  assert.deepEqual([az2.calls.chat, az2.calls.tts, az2.calls.list], [0, 0, 0]);
  const before = az2.blobs.get(L).body;
  const next = await keeper(az2, at("00:01:00", "2026-11-08"));
  assert.equal(next.code, 0);
  assert.equal(az2.blobs.get(L).body, before, "the old day's ledger is untouched");
  assert.equal(az2.ledger("2026-11-08").date, "2026-11-08");
  targetsMet(az2.spent(), "the new day");
});

test("break: after M3_UNTIL nothing is spent, by either runner, even in the VM's local-fallback hour with the ledger down", async () => {
  const dir = localDir();
  try {
    const az = fakeAzure({ down: () => true });
    for (const [w, iso] of [["aca", "2027-02-01T00:17:05Z"], ["vm", "2027-02-01T22:47:05Z"]]) {
      const r = await keeper(az, iso, { M3_RUNNER: w, M3_LOCAL_DIR: w === "vm" ? dir : undefined });
      assert.equal(r.code, 0); assert.match(r.lines[0], /^M3-UNTIL-PASSED /); assert.equal(r.lines.length, 1);
    }
    assert.deepEqual(Object.values(az.calls), [0, 0, 0, 0, 0, 0, 0], "no request of any kind");
    const last = fakeAzure();
    assert.equal((await keeper(last, "2027-01-31T00:17:05Z")).code, 0, "M3_UNTIL itself is still a spending day");
    targetsMet(last.spent(), "2027-01-31");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ───────────────────────────── verifier (M4) ─────────────────────────────

const S9 = ["Azure Container Apps", "Azure Database for PostgreSQL", "Container Registry", "Foundry Models", "Foundry Tools", "Storage", "Virtual Machines", "Load Balancer", "Virtual Network", "Log Analytics"];
const H9 = { "Azure Container Apps": 1.6, "Azure Database for PostgreSQL": 2.63, "Container Registry": 1.67, "Foundry Models": 1.36, "Foundry Tools": 1.36, Storage: 1.27,
  "Virtual Machines": 2.66, "Load Balancer": 1.92, "Virtual Network": 1.56, "Log Analytics": 0.2 };
const PF9 = P.activePortfolio({ vm: true, lb: true, vnet: true }).map((p) => ({ id: p.id, match: p.match }));
/** 66 days to `today`: before 2026-11-06 only Container Apps and PostgreSQL hold $1; from it all 9; `f` overrides. */
function days9(today, f = () => undefined) {
  const out = {};
  for (const d of P.dayList(P.addDays(today, -65), today)) for (const s of S9) {
    const o = f(d, s);
    out[d] ||= {};
    out[d][s] = o !== undefined ? o : d < "2026-11-06" ? (s.startsWith("Azure") ? 3 : 0.1) : H9[s];
  }
  return out;
}
/** Cost Management (two pages, Cost in INR + CostUSD) + a blob store for the verifier. */
function fakeCost(daily, { blobs = new Map(), cm = 200 } = {}) {
  const rows = Object.entries(daily).flatMap(([d, svc]) => Object.entries(svc).map(([s, v]) => [Math.round(v * 96 * 100) / 100, v, Number(d.replace(/-/g, "")), s, "INR"]));
  const cols = ["Cost", "CostUSD", "UsageDate", "ServiceName", "Currency"].map((name) => ({ name }));
  const fetch = async (url, init = {}) => {
    const u = new URL(url);
    if (u.hostname === "login.microsoftonline.com") return Response.json({ access_token: "tok", expires_in: 3600 });
    if (u.hostname === "management.azure.com") {
      if (!u.pathname.endsWith("/Microsoft.CostManagement/query")) return Response.json({ error: { code: "NotSupported" } }, { status: 400 });
      if (cm !== 200) return Response.json({ error: { code: "Denied" } }, { status: cm });
      const page = u.searchParams.get("page"), half = Math.ceil(rows.length / 2);
      return Response.json({ properties: { columns: cols, rows: page ? rows.slice(half) : rows.slice(0, half), nextLink: page ? null : `https://management.azure.com${u.pathname}?api-version=2023-11-01&page=2` } });
    }
    if (u.hostname === "acct.blob.core.windows.net") {
      const name = u.pathname.replace(/^\/m3-ledger\//, "");
      if ((init.method || "GET") === "PUT") { blobs.set(name, { body: Buffer.from(init.body).toString() }); return new Response("", { status: 201 }); }
      const b = blobs.get(name);
      return b ? new Response(b.body, { status: 200 }) : new Response("", { status: 404 });
    }
    throw new Error(`unexpected fetch ${url}`);
  };
  return { fetch, blobs };
}
const goodLedger = (d, runs = [{ runner: "aca" }, { runner: "vm" }]) => ({ body: JSON.stringify({ v: 2, date: d, lanes: { models: { usd: 1.36 }, tts: { usd: 1.35 }, storage: { usd: 1.25 } }, runs }) });
const M4ENV = { AZURE_TENANT_ID: "t", AZURE_SUBSCRIPTION_ID: "s", M3_SP_CLIENT_ID: "c", M3_SP_SECRET: "sp-secret", M3_SINCE: "2026-11-07", M3_UNTIL: "2027-01-31",
  M3_PORTFOLIO_JSON: JSON.stringify(PF9), M3_LANES_JSON: JSON.stringify({ models: { targetUsd: 1.35 }, tts: { targetUsd: 1.35 }, storage: { targetUsd: 1.25 } }),
  M3_REQUIRED: "7", M3_MIN_SERVICES: "8", M3_FLOOR_ALERT: "0", M3_BURST_USD: "60", M3_BURST_DAYS: "2", M3_DAY1: "2026-11-06" };
async function verify(az, iso, env = {}) {
  const set = { ...M4ENV, ...env };
  const saved = Object.fromEntries(Object.keys(set).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(set)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  const lines = [], log = console.log, f = globalThis.fetch;
  console.log = (s) => lines.push(String(s));
  globalThis.fetch = az.fetch;
  try {
    const code = await V.main(new Date(iso));
    const tagged = (t) => lines.filter((l) => l.startsWith(`${t} `)).map((l) => JSON.parse(l.slice(t.length + 1)));
    return { code, lines, ok: tagged("M3-OK")[0] || null, warn: tagged("M3-WARN"), alert: tagged("M3-ALERT") };
  } finally {
    console.log = log; globalThis.fetch = f;
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
}
const T25 = "2026-11-25", Y = "2026-11-24";

test("verify (M4): 9 services → OK; 8 → OK with a warning; 7 → ALERT (fewer than 8) while the 7-service clock keeps running", async () => {
  const blobs = () => new Map([[`ledger/${Y}.json`, goodLedger(Y)]]);
  const nine = await verify(fakeCost(days9(T25), { blobs: blobs() }), `${T25}T06:41:00Z`);
  assert.equal(nine.code, 0); assert.ok(nine.ok); assert.deepEqual([nine.warn, nine.alert], [[], []]);
  assert.equal(nine.ok.required, 7); assert.equal(nine.ok.servicesLastClosed, 9);
  assert.equal(nine.ok.start, "2026-11-06", "the clock counts from the EARLIEST qualifying day, before M3_SINCE");
  assert.equal(nine.ok.streak, 18); assert.equal(nine.ok.m3Streak, 18);
  assert.deepEqual(nine.ok.day1, { date: "2026-11-06", services: 9, inRun: true, m3InRun: true });
  const eight = await verify(fakeCost(days9(T25, (d, s) => (s === "Load Balancer" && d >= "2026-11-20" ? 0.6 : undefined)), { blobs: blobs() }), `${T25}T06:41:00Z`);
  assert.ok(eight.ok, "8 is OK"); assert.deepEqual(eight.alert, []);
  assert.deepEqual(eight.warn.map((w) => w.reason), ["portfolio-under-floor"]);
  assert.deepEqual([...new Set(eight.warn[0].detail.days.map((x) => x.id))], ["lb"]);
  assert.equal(eight.ok.streak, 18, "a spare dropping does not touch the 7-service clock");
  const seven = await verify(fakeCost(days9(T25, (d, s) => ((s === "Load Balancer" || s === "Virtual Network") && d >= "2026-11-20" ? 0.3 : undefined)), { blobs: blobs() }), `${T25}T06:41:00Z`);
  assert.equal(seven.ok, null);
  assert.deepEqual(seven.alert.map((a) => a.reason), ["services-below-min"]);
  assert.deepEqual(seven.alert[0].detail.days.map((x) => x.services), [7, 7, 7, 7]);
  assert.equal(seven.alert[0].streak, 18, "7 still qualify: the clock runs, but no spare is left");
});

test("verify (M4): a dip under 7 resets the clock and alerts; a report made under M3 (5) never counts as a reset", async () => {
  const blobs = (prev) => new Map([[`ledger/${Y}.json`, goodLedger(Y)], [`report/${P.addDays(T25, -1)}.json`, { body: JSON.stringify(prev) }]]);
  const dip = days9(T25, (d, s) => (d === "2026-11-22" && ["Load Balancer", "Virtual Network", "Storage"].includes(s) ? 0.5 : undefined));
  const r = await verify(fakeCost(dip, { blobs: blobs({ required: 7, streak: { days: 17, start: "2026-11-06" } }) }), `${T25}T06:41:00Z`);
  assert.deepEqual(r.alert.map((a) => a.reason), ["services-below-min", "streak-reset"]);
  assert.equal(r.alert[1].start, "2026-11-23"); assert.equal(r.alert[1].streak, 1);
  const m3prev = await verify(fakeCost(days9(T25), { blobs: blobs({ streak: { days: 40, start: "2026-10-01" } }) }), `${T25}T06:41:00Z`);
  assert.ok(m3prev.ok, "an M3-era report (no `required`, 5 services) has another streak: not a reset");
});

test("verify (M4): the INR runway alarm, the $60 burst alarm, a failed cost query", async () => {
  const blobs = () => new Map([[`ledger/${Y}.json`, goodLedger(Y)]]);
  const fine = await verify(fakeCost(days9(T25), { blobs: blobs() }), `${T25}T06:41:00Z`, { M3_BALANCE_INR: "230490.71", M3_BALANCE_AT: "2026-11-06" });
  assert.ok(fine.ok); assert.ok(fine.ok.runwayInr > 15_000 && fine.ok.runwayInr < 230_490, String(fine.ok.runwayInr)); assert.equal(fine.ok.runwayAt, "2027-01-12");
  const low = await verify(fakeCost(days9(T25), { blobs: blobs() }), `${T25}T06:41:00Z`, { M3_BALANCE_INR: "120000", M3_BALANCE_AT: "2026-11-06" });
  assert.deepEqual(low.alert.map((a) => a.reason), ["runway-low"]);
  const rw = low.alert[0].detail;
  assert.equal(rw.currency, "INR"); assert.equal(rw.min, 15_000); assert.equal(rw.knownDays + rw.estDays, 68);
  const inrDay = Object.values(H9).reduce((a, v) => a + Math.round(v * 96 * 100) / 100, 0);   // the fake's Cost column, INR
  inRange(rw.avgPerDay, inrDay - 0.01, inrDay + 0.01, "the burn is each day's Cost in INR");
  inRange(rw.projected, 120_000 - 68 * inrDay - 1, 120_000 - 68 * inrDay + 1, "balance - 68 days");
  const burst = await verify(fakeCost(days9(T25, (d, s) => (d === "2026-11-23" && s === "Virtual Machines" ? 70 : undefined)), { blobs: blobs() }), `${T25}T06:41:00Z`);
  assert.deepEqual(burst.alert.map((a) => a.reason), ["burst"]);
  assert.deepEqual(burst.alert[0].detail.days.map((x) => x.date), ["2026-11-23"]);
  const old = await verify(fakeCost(days9(T25, (d, s) => (d === "2026-11-18" && s === "Virtual Machines" ? 70 : undefined)), { blobs: blobs() }), `${T25}T06:41:00Z`);
  assert.ok(old.ok, "a burst 5 closed days back is old news");
  const dead = await verify(fakeCost(days9(T25), { cm: 429 }), `${T25}T06:41:00Z`);
  assert.equal(dead.code, 1); assert.equal(dead.alert[0].reason, "cost-query-failed");
});

test("verify (M4): a runner missing from yesterday's ledger and a keeper 401 it recorded both alert; the secret's expiry alerts 21 days ahead, even after M3_UNTIL", async () => {
  const runs = [{ runner: "aca", alerts: [{ reason: "auth-failed", lane: "tts", endpoint: "primary", status: 401 }] }];
  const r = await verify(fakeCost(days9(T25), { blobs: new Map([[`ledger/${Y}.json`, goodLedger(Y, runs)]]) }), `${T25}T06:41:00Z`, { M3_RUNNERS: "aca,vm", M3_RUNNERS_SINCE: "2026-11-20" });
  assert.deepEqual(r.alert.map((a) => a.reason), ["runner-missing", "keeper-auth-failed"]);
  assert.deepEqual(r.alert[0].detail.runners, ["vm"]);
  assert.deepEqual(r.alert[1].detail.alerts.map((a) => [a.runner, a.lane, a.status]), [["aca", "tts", 401]]);
  const notYet = await verify(fakeCost(days9(T25), { blobs: new Map([[`ledger/${Y}.json`, goodLedger(Y, [{ runner: "aca" }])]]) }), `${T25}T06:41:00Z`, { M3_RUNNERS: "aca,vm", M3_RUNNERS_SINCE: "2026-11-25" });
  assert.ok(notYet.ok, "no runner alert before both are due");
  const march = (d) => verify(fakeCost(days9(d)), `${d}T06:41:00Z`, { M3_SP_SECRET_EXPIRES: "2027-03-30" });
  const in20 = await march("2027-03-10");
  assert.deepEqual(in20.alert.map((a) => [a.reason, a.detail.daysLeft]), [["sp-secret-expiring", 20]]);
  assert.ok((await march("2027-03-08")).ok, "22 days ahead: quiet");
});

// ───────────────────────────── pure: prices, network, locks, runner, e-mail ─────────────────────────────

test("prices and arithmetic for the two spares: 8 LB rules and 11 IPs are $1.32/day each; the 5-rule and 2-IP lines match Cost Management's actuals", () => {
  for (const k of ["lb:included", "lb:overage", "pip:standard", "lunaSin:in", "lunaSin:cached", "lunaSin:out", "tts:neural-swc"]) assert.match(P.PRICES[k].meterId, /^[0-9a-f-]{36}$/, k);
  assert.equal(P.lbDailyUsd(8), 1.32); assert.equal(P.lbDailyUsd(5), 0.6); assert.equal(P.lbDailyUsd(2), 0.6, "capp-svc-lb: 2 rules billed $0.60/day"); assert.equal(P.lbDailyUsd(0), 0);
  assert.equal(P.pipsDailyUsd(11), 1.32); assert.equal(P.pipsDailyUsd(2), 0.24, "Vyakti's 2 IPs billed $0.24/day");
  assert.ok(P.lbDailyUsd() >= P.MIN_FIXED_USD_PER_DAY && P.pipsDailyUsd() >= P.MIN_FIXED_USD_PER_DAY, "each spare holds $1.25 by itself");
  const d = P.dailyPlan({ vm: true, lb: true, vnet: true, pgSku: "Standard_B2s" });
  assert.equal(d.services, 9); assert.equal(d.rows.find((r) => r.id === "lb").usd, 1.32);
  const pr = P.projectBalance({ balance: 1000, balanceAt: "2026-11-01", endDate: "2026-11-10", days: [{ date: "2026-11-01", total: 10 }, { date: "2026-11-02", total: 30 }], lastClosed: "2026-11-02", avgDays: 7 });
  assert.deepEqual(pr, { projected: 1000 - 40 - 8 * 20, endDate: "2026-11-10", avgPerDay: 20, known: 40, knownDays: 2, estimated: 160, estDays: 8 });
});

test("the third models fallback: a priced chat deployment on a taxila-ai-* account, background twins first; none → null", () => {
  const acct = (name, location, deps) => ({ name, location, deployments: deps.map(([n, model, chat = true]) => ({ name: n, format: "OpenAI", model, state: "Succeeded", chat })) });
  const live = [acct("taxila-ai-uaen", "uaenorth", [["taxila-image", "gpt-image-2", false]]),
    acct("taxila-ai-southindia", "southindia", [["taxila-brain", "gpt-5.6-sol"], ["taxila-fast", "gpt-5.6-luna"], ["taxila-fast-bg", "gpt-5.6-luna"]]),
    acct("raghavsharma1729-compan-resource", "eastus2", [["taxila-fast-bg", "gpt-5.6-luna"]])];
  const p = P.pickModelsFallback2(live);
  assert.deepEqual([p.account, p.deployment, p.model, p.endpoint, p.price.out], ["taxila-ai-southindia", "taxila-fast-bg", "gpt-5.6-luna", "https://taxila-ai-southindia.openai.azure.com/openai/v1", 1.2]);
  assert.equal(P.pickModelsFallback2(live, { exclude: ["taxila-ai-southindia/taxila-fast-bg"] }).deployment, "taxila-fast", "then the cheaper model");
  assert.equal(P.pickModelsFallback2([acct("taxila-ai-swc", "swedencentral", [["x", "gpt-5.6-luna"]])]), null, "no verified price in that region");
  assert.equal(P.pickModelsFallback2([live[0]]), null);
});

test("network builders: the NSG check, the NIC edits, the LB body, permissions and locks", () => {
  const rule = (name, access, src, direction = "Inbound") => ({ name, properties: { direction, access, sourceAddressPrefix: src } });
  const defaults = [rule("AllowVnetInBound", "Allow", "VirtualNetwork"), rule("AllowAzureLoadBalancerInBound", "Allow", "AzureLoadBalancer"), rule("DenyAllInBound", "Deny", "*"), rule("AllowInternetOutBound", "Allow", "*", "Outbound")];
  assert.equal(VM.nsgDeniesInternetInbound({ properties: { securityRules: [], defaultSecurityRules: defaults } }).ok, true);
  assert.match(VM.nsgDeniesInternetInbound({ properties: { securityRules: [rule("ssh", "Allow", "Internet")], defaultSecurityRules: defaults } }).why, /ssh/);
  assert.equal(VM.nsgDeniesInternetInbound({ properties: { securityRules: [rule("x", "Allow", "0.0.0.0/0")], defaultSecurityRules: defaults } }).ok, false);
  assert.equal(VM.nsgDeniesInternetInbound({ properties: { securityRules: [], defaultSecurityRules: defaults.slice(0, 2) } }).ok, false, "no DenyAllInBound");
  const ids = VM.m4Ids("/subscriptions/x");
  const nic = { properties: { ipConfigurations: [{ name: "ipconfig1", properties: { primary: true, subnet: { id: ids.subnetDefault } } }] } };
  const a = VM.nicWith(nic, { publicIpId: ids.pip(1) });
  assert.deepEqual(a.changed, ["ipconfig1: + public IP taxila-m3-pip-01"]);
  assert.equal(nic.properties.ipConfigurations[0].properties.publicIPAddress, undefined, "the GET result is not mutated");
  const b = VM.nicWith(a.body, { publicIpId: ids.pip(1), poolId: ids.lbPool });
  assert.deepEqual(b.changed, ["ipconfig1: + backend pool taxila-m3-lb/backendAddressPools/be"]);
  assert.deepEqual(VM.nicWith(b.body, { publicIpId: ids.pip(1), poolId: ids.lbPool }).changed, [], "idempotent");
  assert.throws(() => VM.nicWith(a.body, { publicIpId: ids.pip(2) }), /already holds another public IP/);
  const lb = VM.lbBody(ids);
  assert.equal(lb.properties.loadBalancingRules.length, 8); assert.equal(VM.lbRuleCount(lb), 8);
  assert.equal(new Set(lb.properties.loadBalancingRules.map((r) => r.properties.backendPort)).size, 8, "non-floating rules may not share a backend port");
  assert.equal(lb.properties.frontendIPConfigurations[0].properties.publicIPAddress, undefined, "internal: no public frontend");
  assert.deepEqual(VM.lbView(lb), VM.lbView(JSON.parse(JSON.stringify(lb))));
  const contributor = [{ actions: ["*"], notActions: ["Microsoft.Authorization/*/Delete", "Microsoft.Authorization/*/Write", "Microsoft.Authorization/elevateAccess/Action"] }];
  assert.equal(VM.canDo(contributor, "Microsoft.Authorization/locks/write"), false);
  assert.equal(VM.canDo(contributor, "Microsoft.Network/loadBalancers/write"), true);
  assert.equal(VM.canDo([...contributor, { actions: ["*/read", "Microsoft.Authorization/*"], notActions: [] }], "Microsoft.Authorization/locks/write"), true, "User Access Administrator");
  const rg = "/subscriptions/x/resourceGroups/rg";
  const lock = (scope, level = "CanNotDelete") => ({ id: `${scope}/providers/Microsoft.Authorization/locks/${VM.LOCK_NAME}`, properties: { level } });
  assert.equal(VM.lockCovered([lock(rg)], `${rg}/providers/Microsoft.ContainerRegistry/registries/taxilacr`), true, "a resource group lock covers its resources");
  assert.equal(VM.lockCovered([lock(`${rg}/providers/Microsoft.ContainerRegistry/registries/taxilacr`)], `${rg}/providers/Microsoft.ContainerRegistry/registries/taxilacr2`), false, "no prefix trap");
  assert.equal(VM.lockCovered([lock(rg, "NotSpecified")], rg), false);
  assert.equal(VM.LOCK_NAME, "m3-credit-do-not-delete", "the owner's lock name");
  assert.match(VM.lockSteps({ kind: "rg", name: "taxila-m3-rg", rg: "taxila-m3-rg" })[1], /az lock create --name m3-credit-do-not-delete --lock-type CanNotDelete --resource-group taxila-m3-rg /);
});

test("the VM runner: a sha256-checked Node, the keeper by its sha, a root-only env file from a protectedParameter, a timer 90 minutes after the ACA cron", () => {
  assert.throws(() => VM.envFileText([["M3_X", 'a"b']]), /mangle/); assert.throws(() => VM.envFileText([["M3_X", "a b"]]), /mangle/);
  assert.equal(VM.envFileText([["M3_A", "https://x.y/z"], ["M3_B", "abc+/="]]), "M3_A=https://x.y/z\nM3_B=abc+/=\n");
  const s = VM.runnerScript({ keeperGzB64: "H4sI".padEnd(300, "A"), keeperSha: "f".repeat(64), hosts: ["https://acct.blob.core.windows.net/"] });
  assert.match(s, /^#!\/bin\/bash\n/); assert.match(s, /set -euo pipefail/);
  assert.match(s, new RegExp(`echo "${P.NODE.sha256}  \\$tmp/node.tgz" \\| sha256sum -c --quiet -`));
  assert.match(s, /echo "f{64}  \/opt\/m3\/keeper-job.mjs.new" \| sha256sum -c --quiet -/);
  assert.match(s, /\( umask 077; printf '%s' "\$ENV_B64" \| base64 -d > \/etc\/m3\/keeper.env.new \)/);
  assert.match(s, /chmod 600 \/etc\/m3\/keeper.env.new/);
  assert.doesNotMatch(s, /set -x|echo "\$ENV_B64"|cat \/etc\/m3\/keeper.env/, "the env never reaches the output");
  assert.match(s, /OnCalendar=\*-\*-\* 01\/3:47:00 UTC/); assert.match(s, /Persistent=true/); assert.match(s, /DynamicUser=yes/);
  assert.throws(() => VM.runnerScript({ keeperGzB64: "x", keeperSha: "f", hosts: ["https://a.b/?sig=1"] }), /self-check host/);
  // ACA "17 */3": 00:17, 03:17, ...; the timer: 01:47, 04:47, ... → every VM run is 90 minutes after an ACA run
  const aca = Array.from({ length: 8 }, (_, i) => i * 180 + 17), vm = Array.from({ length: 8 }, (_, i) => 60 + i * 180 + 47);
  assert.deepEqual(vm.map((m, i) => m - aca[i]), Array(8).fill(90));
  assert.equal(P.KEEPER.acaCron, "17 */3 * * *"); assert.equal(P.KEEPER.verifyCron, "41 6,18 * * *");
});

test("alert e-mail: M3_ALERT_EMAIL takes a comma-separated list, one receiver each; matching compares the whole set", () => {
  const OWNER = "8e3af657-a8ff-443c-a75c-2fe8c4bcb635";
  const two = P.actionGroupBody({ ownerRole: OWNER, email: " a@example.test, b@example.test ;A@EXAMPLE.test" });
  assert.deepEqual(two.properties.emailReceivers.map((r) => [r.name, r.emailAddress]), [["m3-alert-email", "a@example.test"], ["m3-alert-email-2", "b@example.test"]]);
  const live = (emails) => ({ properties: { enabled: true, armRoleReceivers: [{ roleId: OWNER }], emailReceivers: emails.map((e) => ({ emailAddress: e })) } });
  assert.equal(P.actionGroupMatches(live(["B@example.test", "a@example.test"]), two), true, "order and case do not matter");
  assert.equal(P.actionGroupMatches(live(["a@example.test"]), two), false, "a missing address re-PUTs");
  assert.equal(P.actionGroupMatches(live(["a@example.test", "b@example.test", "c@example.test"]), two), false, "an extra one too");
  assert.equal(P.actionGroupBody({ ownerRole: OWNER, email: "a@example.test" }).properties.emailReceivers[0].name, "m3-alert-email", "one address: the M3 group is unchanged");
  assert.throws(() => P.actionGroupBody({ ownerRole: OWNER, email: "a@example.test, nope" }), /not an email/);
});

// ───────────────────────────── the CLI's dry run, against a fake ARM ─────────────────────────────

const CLI = new URL("../scripts/m3.mjs", import.meta.url).pathname, FAKE_ARM = new URL("./fixtures/m3-fake-arm.mjs", import.meta.url).href;
const SECRETS = { AZURE_SP_SECRET: "fake-sp-secret-0001", AZURE_OPENAI_API_KEY: "fake-aoai-secret-0002", AZURE_SPEECH_KEY_SIN: "fake-speech-secret-0003", AZURE_STORAGE_KEY: Buffer.from("fake-storage-secret-0004").toString("base64") };
function dryRun(scenario, steps = "pips,lb,runner,locks") {
  const env = { PATH: process.env.PATH, M3_NO_DOTENV: "1", M3_FAKE_ARM: scenario, AZURE_SP_CLIENT_ID: "client", AZURE_TENANT_ID: "tenant", AZURE_SUBSCRIPTION_ID: "00000000-0000-0000-0000-000000000000",
    AZURE_RESOURCE_GROUP: "rg-raghavsharma1729-7190", AZURE_CONTAINERAPPS_ENV: "taxila-env", AZURE_OPENAI_ENDPOINT: "https://fake-aoai.openai.azure.com/openai/v1",
    AZURE_SPEECH_REGION_SIN: "centralindia", AZURE_STORAGE_ACCOUNT: "taxilaforge", ...SECRETS };
  const r = spawnSync(process.execPath, ["--import", FAKE_ARM, CLI, "apply", "--vm", "--only", steps], { env, encoding: "utf8", timeout: 120_000 });
  const out = `${r.stdout}${r.stderr}`;
  for (const [k, v] of Object.entries(SECRETS)) assert.ok(!out.includes(v), `${scenario}: ${k} printed`);
  assert.ok(!out.includes("fake-southindia-key") && !out.includes("fake-taxila-ai-") && !out.includes("fake-acr-password"), `${scenario}: a listKeys / listSecrets value printed`);
  return { code: r.status, out };
}

test("apply --vm --only pips,lb,runner,locks (dry run, fresh): creates 11 IPs, the LB and its subnet, the runner; owner steps for locks; no write, no secret", () => {
  const { code, out } = dryRun("fresh");
  assert.equal(code, 0, out.slice(-2000));
  assert.match(out, /^m3 apply: DRY RUN .*\[vm, pips, lb, runner, locks\]/m);
  assert.match(out, /\[pips\] 11 Standard static IPv4 public IPs: pip:standard \$0\.005\/Hour \(centralindia\) → \$1\.320\/day live/);
  assert.match(out, /\[pips\] ok: taxila-m3-nsg denies internet inbound/);
  assert.equal((out.match(/\[pips\] WOULD create taxila-m3-pip-\d\d/g) || []).length, 11);
  assert.match(out, /WOULD create taxila-m3-pip-01: .*\(goes on taxila-m3-nic\)/);
  assert.match(out, /\[pips\] WOULD update taxila-m3-nic: ipconfig1: \+ public IP taxila-m3-pip-01/);
  assert.match(out, /\[lb\] taxila-m3-lb with 8 rules \(5 included \+ 3 overage\): lb:included \$0\.025\/Hour \(Global\) \+ lb:overage \$0\.01\/Hour \(Global\) → \$1\.320\/day live/);
  assert.match(out, /\[lb\] WOULD create subnet taxila-m3-vnet\/lb 10\.73\.0\.64\/27/);
  assert.match(out, /rules Tcp:10001>10001,.*Tcp:10008>10008/);
  assert.match(out, /\[lb\] WOULD update taxila-m3-nic: ipconfig1: \+ backend pool taxila-m3-lb\/backendAddressPools\/be/);
  assert.match(out, /\[runner\] NOTE: taxila-m3-nic has no public IP yet/);
  assert.match(out, /M3_AOAI_FALLBACK2_DEPLOYMENT=taxila-fast-bg/); assert.match(out, /M3_SPEECH_FALLBACK_REGION=swedencentral/);
  assert.match(out, /M3_AOAI_KEY=<set>/); assert.match(out, /M3_RUNNER=vm/); assert.match(out, /M3_LOCAL_DIR=\/var\/lib\/m3/);
  assert.match(out, /m3-keeper\.timer: OnCalendar=\*-\*-\* 01\/3:47:00 UTC, Persistent=true/);
  assert.match(out, /\[runner\] WOULD create Run Command m3-runner on taxila-m3-vm/);
  assert.equal((out.match(/\[locks\] OWNER STEP: /g) || []).length, 11, "taxila-m3-rg, taxilacr, taxilaforge, taxila-cin-pg, taxila-env, 2 jobs, the action group, 2 rules, the Speech account");
  assert.match(out, /OWNER STEP: taxila-ai-centralindia \(accounts\)/);
  assert.match(out, /Cloud Shell: az lock create --name m3-credit-do-not-delete --lock-type CanNotDelete --resource-group taxila-m3-rg /);
  assert.match(out, /NOT locked, on purpose: raghavsharma1729-compan-resource/);
  assert.match(out, /^dry run done: nothing changed$/m);
});

test("apply dry run (done): every step reads ok; (rights): missing locks would be created; (open NSG): pips refuses before any public IP", () => {
  const done = dryRun("done");
  assert.equal(done.code, 0, done.out.slice(-2000));
  assert.doesNotMatch(done.out, /\[(pips|lb|locks)\] WOULD/);
  assert.match(done.out, /\[pips\] ok: taxila-m3-nic holds taxila-m3-pip-01/);
  assert.match(done.out, /\[lb\] ok: taxila-m3-lb Standard, 8 billed rules, frontend fe@lb, pool be, probe Tcp:22/);
  assert.match(done.out, /\[lb\] ok: taxila-m3-nic is in taxila-m3-lb\/be/);
  assert.equal((done.out.match(/\[locks\] ok: /g) || []).length, 11);
  const rights = dryRun("rights", "locks");
  assert.equal(rights.code, 0);
  assert.equal((rights.out.match(/\[locks\] WOULD create CanNotDelete lock m3-credit-do-not-delete on /g) || []).length, 11);
  const open = dryRun("open-nsg", "pips");
  assert.equal(open.code, 1);
  assert.match(open.out, /taxila-m3-nsg does not deny internet inbound \(custom inbound rule\(s\) open to the internet: ssh-anywhere\); refusing to attach a public IP/);
  assert.doesNotMatch(open.out, /WOULD create taxila-m3-pip/);
});

test("m3.mjs plan prints the 9-service M4 line; the keeper and verifier scripts stay under the 96 KiB container-arg budget", () => {
  const out = execFileSync(process.execPath, [CLI, "plan"], { env: { PATH: process.env.PATH, M3_NO_DOTENV: "1" }, encoding: "utf8" });
  assert.match(out, /9 services \(M4: --vm, lb, pips\) \+ PG on B2s: \$13\.9\/day/);
  for (const f of ["keeper-job.mjs", "verify-job.mjs"]) assert.ok(readFileSync(new URL(`../infra/m3/${f}`, import.meta.url)).length < 96 * 1024, f);
});
