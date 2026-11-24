// Round 7, M3 credit unlock: infra/m3/plan.js (pure), the copies inside the two self-contained in-job scripts
// (infra/m3/keeper-job.mjs, infra/m3/verify-job.mjs) checked against it on fixtures, and both jobs' main() end to end
// against a fake Azure (tests/fixtures/m3-fake-azure.mjs: blob store with ETags and leases, chat, TTS, Cost Management).
// No network, no Azure. The M4 break tests (two runners, leases, the closed loop, the VM's local fallback) are in
// tests/m4-break.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as P from "../infra/m3/plan.js";
import { CHAT } from "../server/cost/prices.js";
import { fakeAzure, runKeeper as run } from "./fixtures/m3-fake-azure.mjs";

// the jobs read their env at load AND at run time: set it before importing them (M3_ROLE stays unset, so their main does
// not run) and keep it for this file's tests. Only M3_* names: no other suite reads them, so sharing npm test's one
// process with them is safe (tests/test-isolation.test.mjs requires the marker below for a module-level env write).
Object.assign(process.env, { M3_STORAGE_ACCOUNT: "acct", M3_STORAGE_KEY: Buffer.from("k".repeat(32)).toString("base64"), M3_CONTAINER: "m3-ledger", M3_BACKOFF_MS: "1" });   // one-process-safe: M3_* names only, read by no other suite
delete process.env.M3_ROLE;   // one-process-safe: M3_* names only, read by no other suite
const K = await import("../infra/m3/keeper-job.mjs");
const V = await import("../infra/m3/verify-job.mjs");

const SERVICES = ["Azure Container Apps", "Azure Database for PostgreSQL", "Container Registry", "Foundry Models", "Foundry Tools", "Storage", "Virtual Machines", "Log Analytics"];
/** {date: {service: usd}} from..to; `f(date, service)` → usd or undefined (no row). */
function mkDaily(from, to, f) {
  const out = {};
  for (const d of P.dayList(from, to)) for (const s of SERVICES) { const v = f(d, s); if (v !== undefined) (out[d] ||= {})[s] = v; }
  return out;
}
const healthy = (d, s) => ({ "Azure Container Apps": 1.6, "Azure Database for PostgreSQL": 6.3, "Container Registry": 1.67, "Foundry Models": 1.36, "Foundry Tools": 1.36, Storage: 1.27, "Log Analytics": 0.2 })[s];
const PF = P.activePortfolio({ vm: false });

test("prices: every hard-coded row names its meter, region and the filter that found it; the arithmetic the plan rests on", () => {
  for (const [k, p] of Object.entries(P.PRICES)) {
    assert.match(p.meterId, /^[0-9a-f-]{36}$/, k);
    assert.ok(p.region && p.usd > 0 && p.unit && p.found && p.service, k);
  }
  assert.ok(P.PRICES["acr:Premium"].usd >= 1.25 && P.PRICES["acr:Standard"].usd < 1, "Premium holds $1/day, Standard does not");
  // the keeper's model prices are the repo's price book (server/cost/prices.js) for the same deployments
  for (const dep of ["taxila-fast", "taxila-brain"]) for (const k of ["in", "cached", "out"]) assert.equal(P.MODEL_PRICES[dep][k], CHAT[dep][k], `${dep}.${k}`);
  assert.equal(P.usdPerHourToDay(0.0556), 1.3344);
  assert.equal(P.usdPerMonthToDay(64 * 0.131), 0.2756);
  assert.deepEqual(P.vmDailyUsd(), { compute: 1.3344, disk: 0.0868 });
  assert.ok(P.vmDailyUsd().compute >= P.MIN_FIXED_USD_PER_DAY);
  assert.equal(P.vmDailyUsd("Standard_B2s"), null, "no unverified size");
});

test("pg downsize: B2s is the smallest Burstable that holds $1.25/day with 64 GB; B1ms, a non-Burstable and an unknown SKU are refused", () => {
  assert.equal(P.pgDailyUsd("Standard_D2ds_v5"), 6.2996);
  assert.deepEqual(P.pgDownsizeCheck("Standard_B2s"), { ok: true, usd: 2.6276, reason: "" });
  const b1 = P.pgDownsizeCheck("Standard_B1ms");
  assert.equal(b1.ok, false); assert.equal(b1.usd, 0.8636); assert.match(b1.reason, /below \$1\.25/);
  assert.match(P.pgDownsizeCheck("Standard_D2ds_v5").reason, /GeneralPurpose, not a downsize/);
  assert.match(P.pgDownsizeCheck("Standard_B1s").reason, /no verified retail price/);
  assert.equal(P.pgDownsizeCheck("Standard_B1ms", 400).ok, true, "storage counts: a big disk lifts B1ms over the bar");
});

test("portfolio: 9 candidates (M4: 7 required + 2 spare); the classifier maps Cost Management ServiceNames and flags a collapse", () => {
  assert.equal(P.PORTFOLIO.length, 9);
  assert.equal(new Set(P.PORTFOLIO.map((p) => p.id)).size, 9);
  assert.deepEqual(P.activePortfolio().map((p) => p.id), ["aca", "pg", "acr", "models", "tools", "storage"]);
  assert.equal(P.activePortfolio({ vm: true }).length, 7);
  assert.deepEqual(P.activePortfolio({ vm: true, lb: true, vnet: true }).map((p) => p.id), ["aca", "pg", "acr", "models", "tools", "storage", "vm", "lb", "vnet"]);
  assert.deepEqual(P.activePortfolio({ lb: "yes" }).map((p) => p.id).includes("lb"), false, "only a real true switches an optional one on");
  for (const p of P.PORTFOLIO) assert.ok(p.usdPerDay >= 1.25 || p.id === "aca", `${p.id} planned at $${p.usdPerDay}`);
  const c = P.classify({ "Azure Container Apps": 1.6, "Azure Database for PostgreSQL": 6, "Container Registry": 1.67, "Foundry Models": 1.4, "Foundry Tools": 1.4,
    Storage: 1.3, "Virtual Machines": 1.33, "Log Analytics": 0.2, Bandwidth: 0.01 });
  assert.deepEqual(c.byId, { aca: 1.6, pg: 6, acr: 1.67, models: 1.4, tools: 1.4, storage: 1.3, vm: 1.33 });
  assert.deepEqual(Object.keys(c.unmatched).sort(), ["Bandwidth", "Log Analytics"]);
  assert.deepEqual(P.classify({ "Load Balancer": 1.92, "Virtual Network": 1.56 }).byId, { lb: 1.92, vnet: 1.56 });
  // the legacy name for both AI meters lands on tools only, so models reads $0 and the verifier alerts
  const legacy = P.classify({ "Cognitive Services": 2.8 });
  assert.deepEqual(legacy.byId, { tools: 2.8 });
});

test("Cost Management rows: CostUSD preferred; INR converted at the fx rate; UsageDate as yyyymmdd; pages summed", () => {
  const pages = [
    { columns: [{ name: "Cost" }, { name: "CostUSD" }, { name: "UsageDate" }, { name: "ServiceName" }, { name: "Currency" }],
      rows: [[150, 1.56, 20261104, "Azure Container Apps", "INR"], [602, 6.27, 20261104, "Azure Database for PostgreSQL", "INR"]] },
    { columns: [{ name: "Cost" }, { name: "CostUSD" }, { name: "UsageDate" }, { name: "ServiceName" }, { name: "Currency" }],
      rows: [[10, 0.1, 20261104, "Azure Container Apps", "INR"]] },
  ];
  const a = P.parseCostRows(pages);
  assert.deepEqual(a.daily, { "2026-11-04": { "Azure Container Apps": 1.66, "Azure Database for PostgreSQL": 6.27 } });
  assert.equal(a.source, "CostUSD"); assert.equal(a.currency, "INR");
  const b = P.parseCostRows([{ columns: [{ name: "Cost" }, { name: "UsageDate" }, { name: "ServiceName" }, { name: "Currency" }], rows: [[192, 20261104, "Storage", "INR"]] }]);
  assert.deepEqual(b.daily, { "2026-11-04": { Storage: 2 } });
  assert.match(b.source, /96 INR\/USD/);
  const c = P.parseCostRows([{ columns: [{ name: "Cost" }, { name: "UsageDate" }, { name: "ServiceName" }, { name: "Currency" }], rows: [[1.2, "2026-11-04T00:00:00", "Storage", "USD"]] }]);
  assert.deepEqual(c.daily, { "2026-11-04": { Storage: 1.2 } });
  assert.throws(() => P.parseCostRows([{ columns: [{ name: "Cost" }, { name: "UsageDate" }, { name: "ServiceName" }, { name: "Currency" }], rows: [[1, 20261104, "x", "EUR"]] }]), /no fx rate for EUR/);
  const body = P.costQueryBody("2026-09-01", "2026-11-05");
  assert.equal(body.type, "ActualCost"); assert.equal(body.dataset.granularity, "Daily");
  assert.deepEqual(body.dataset.grouping, [{ type: "Dimension", name: "ServiceName" }]);
  assert.equal(P.costQueryBody("2026-09-01", "2026-11-05", { usd: false }).dataset.aggregation.totalCostUSD, undefined);
});

test("streak: consecutive closed days with one set of >= 5 services >= $1; open days ignored; a gap or a dip resets it", () => {
  const asOf = "2026-11-20";
  const daily = mkDaily("2026-10-01", asOf, (d, s) => (d < "2026-11-01" ? (s === "Azure Container Apps" || s === "Azure Database for PostgreSQL" ? 3 : 0.1) : healthy(d, s)));
  const r = P.computeStreak(daily, { asOf, portfolio: PF });
  assert.equal(r.lastClosed, "2026-11-18");
  assert.deepEqual(r.streak, { days: 18, start: "2026-11-01", set: ["Azure Container Apps", "Azure Database for PostgreSQL", "Container Registry", "Foundry Models", "Foundry Tools", "Storage"],
    remaining: 42, completes: "2026-12-30", windowBound: false });
  assert.deepEqual(r.loose, { days: 18, start: "2026-11-01" });
  assert.equal(r.days.find((x) => x.date === "2026-11-05").n, 6);
  assert.deepEqual(r.under.filter((u) => u.date >= "2026-11-01"), []);
  // one day where two services dipped: only 4 left → the clock restarts after it
  const dip = mkDaily("2026-11-01", asOf, (d, s) => (d === "2026-11-10" && (s === "Storage" || s === "Foundry Tools") ? 0.4 : healthy(d, s)));
  const r2 = P.computeStreak(dip, { asOf, portfolio: PF });
  assert.equal(r2.streak.start, "2026-11-11"); assert.equal(r2.streak.days, 8);
  assert.deepEqual(r2.under.filter((u) => u.date === "2026-11-10").map((u) => u.id).sort(), ["storage", "tools"]);
  // a day with no rows at all (Cost Management gap) counts as $0
  const gap = mkDaily("2026-11-01", asOf, (d, s) => (d === "2026-11-12" ? undefined : healthy(d, s)));
  assert.equal(P.computeStreak(gap, { asOf, from: "2026-11-01", portfolio: PF }).streak.start, "2026-11-13");
  // a ROTATING set: every day 5 services, but never the same 5 for long → loose counts it, strict does not
  const rot = mkDaily("2026-11-01", asOf, (d, s) => { const i = SERVICES.indexOf(s), k = Number(d.slice(8)) % 2; return i < 4 || i === 4 + k ? 2 : 0.5; });
  const r3 = P.computeStreak(rot, { asOf, portfolio: PF });
  assert.equal(r3.loose.days, 18); assert.equal(r3.streak.days, 1);
  // the run reaches the window's first day → windowBound (may be longer than the window shows)
  assert.equal(P.computeStreak(daily, { asOf, from: "2026-11-05", portfolio: PF }).streak.windowBound, true);
  assert.equal(P.computeStreak({}, { asOf }).streak.days, 0);
});

test("streak reset: a new start is a reset unless the old run only slid out of the query window", () => {
  assert.equal(P.streakReset(null, { days: 3, start: "2026-11-02" }), false);
  assert.equal(P.streakReset({ streak: { days: 0 } }, { days: 0 }), false);
  assert.equal(P.streakReset({ streak: { days: 9, start: "2026-11-01" } }, { days: 10, start: "2026-11-01" }), false);
  assert.equal(P.streakReset({ streak: { days: 9, start: "2026-11-01" } }, { days: 0, start: null }), true);
  assert.equal(P.streakReset({ streak: { days: 9, start: "2026-11-01" } }, { days: 2, start: "2026-11-09" }), true);
  assert.equal(P.streakReset({ streak: { days: 64, start: "2026-09-01" } }, { days: 64, start: "2026-09-02", windowBound: true }), false);
});

test("top-up arithmetic: reaches the target, never passes the cap, counts pending and blind spend, stops after M3_UNTIL", () => {
  const lane = { id: "models", targetUsd: 1.35, capUsd: 2, unitUsd: 0.005, maxUnitUsd: 0.0073 };
  const when = { date: "2026-11-05", until: "2027-01-31" };
  assert.equal(P.unitsToBuy(null, lane, when), 270);
  assert.equal(P.unitsToBuy({ lanes: { models: { usd: 1.0 } } }, lane, when), 70);
  assert.equal(P.unitsToBuy({ lanes: { models: { usd: 1.0, pendingUsd: 0.3 } } }, lane, when), 10);
  assert.equal(P.unitsToBuy({ lanes: { models: { usd: 1.35 } } }, lane, when), 0);
  assert.equal(P.unitsToBuy({ lanes: { models: { usd: 0.5, blindUsd: 1.0 } } }, lane, when), 0);
  // the cap binds on the worst case: $1.99 spent, one more worst-case unit would pass $2
  assert.equal(P.unitsToBuy({ lanes: { models: { usd: 1.30 } } }, { ...lane, capUsd: 1.305 }, when), 0);
  assert.equal(P.unitsToBuy({ lanes: { models: { usd: 1.30 } } }, { ...lane, capUsd: 1.31 }, when), 1);
  assert.equal(P.unitsToBuy(null, { id: "s", targetUsd: 1.25, capUsd: 2, unitUsd: 0.000005 }, when), 250_000);
  assert.equal(P.unitsToBuy(null, lane, { date: "2027-02-01", until: "2027-01-31" }), 0);
  assert.equal(P.unitsToBuy(null, lane, { date: "2026-11-05", until: "" }), 0);
  assert.equal(P.unitsToBuy({ lanes: { models: { usd: "x", pendingUsd: -4 } } }, lane, when), 270, "garbage counts as 0, never negative");
  // M4 run modes: only the VM, only in its last slot, spends without the shared ledger; a corrupt ledger never spends
  const modes = ["ok", "absent", "held", "corrupt", "unreachable", "auth"];
  assert.deepEqual(modes.map((s) => P.runMode(s, { runner: "aca", hour: 23 })), ["topup", "topup", "wait", "skip", "skip", "skip"]);
  assert.deepEqual(modes.map((s) => P.runMode(s, { runner: "vm", hour: 21 })), ["topup", "topup", "wait", "skip", "skip", "skip"]);
  assert.deepEqual(modes.map((s) => P.runMode(s, { runner: "vm", hour: 22 })), ["topup", "topup", "wait", "skip", "local", "local"]);
  assert.equal(P.minutesToMidnight("2026-11-05T23:40:00Z"), 20); assert.equal(P.minutesToMidnight("2026-11-05T00:00:00Z"), 1440);
  // orphans: a dead run's write-ahead stays counted under the next lease holder; offline spend folds in once, by max
  const o = P.adoptOrphans({ lanes: { models: { usd: 1, pendingUsd: 0.05, orphanUsd: 0.01 } } });
  assert.deepEqual(o.lanes.models, { usd: 1, pendingUsd: 0, orphanUsd: 0.06 });
  assert.equal(P.laneSpent(o, "models"), 1.06); assert.equal(P.laneReported(o, "models"), 1, "an orphan is a bound, not a spend");
  const off = { lanes: { tts: { usd: 1.3, pendingUsd: 0.05, seenUsd: 0.2 } } };
  assert.equal(P.offlineSpent(off, "tts"), 1.35, "seenUsd is the shared ledger's, never the VM's own");
  const f1 = P.foldOffline({ lanes: { tts: { usd: 0.1 } } }, off);
  assert.equal(f1.lanes.tts.offlineUsd, 1.35); assert.equal(P.foldOffline(f1, off).lanes.tts.offlineUsd, 1.35, "idempotent");
  assert.equal(P.laneReported(f1, "tts"), 1.45); assert.equal(P.laneSpent({ lanes: { x: { seenUsd: 0.5, usd: 0.2 } } }, "x"), 0.7);
  assert.equal(P.chatUsd({ in: 1080, cached: 1000, out: 4000 }, P.MODEL_PRICES["taxila-fast"]), 0.004836);
  assert.equal(P.chatUsd({}, P.MODEL_PRICES["taxila-fast"]), 0);
  const m = P.mergeBlind({ v: 1, lanes: { tts: { usd: 0.2, pendingUsd: 0 } } }, { lanes: { tts: { usd: 1.35 }, models: { usd: 1.0, pendingUsd: 0.01 } } });
  assert.equal(P.laneSpent(m, "tts"), 1.55); assert.equal(P.laneSpent(m, "models"), 1.01);
  assert.deepEqual(P.ledgerShort(null), { missing: true, short: [] });
  assert.deepEqual(P.ledgerRuns({ runs: [{ slot: "am" }, { runner: "vm", alerts: [{ reason: "auth-failed", lane: "tts", endpoint: "primary" }, { reason: "auth-failed", lane: "tts", endpoint: "primary" }] }] }),
    { runners: ["aca", "vm"], alerts: [{ runner: "vm", reason: "auth-failed", lane: "tts", endpoint: "primary" }] }, "a v1 run was the ACA job; alerts deduplicated");
  assert.deepEqual(P.ledgerShort({ lanes: { models: { usd: 1.36 }, tts: { usd: 1.0, pendingUsd: 0.5 }, storage: { usd: 1.25 } } }),
    { missing: false, short: [{ lane: "tts", usd: 1, target: 1.35 }] }, "pending is a bound, not a spend");
});

test("verify verdict: floor, service count, ledger, reset; nothing before M3_SINCE, nothing after M3_UNTIL", () => {
  const today = "2026-11-20";
  const daily = mkDaily("2026-10-01", today, (d, s) => (d < "2026-11-06" ? (s.startsWith("Azure") ? 3 : 0.1) : s === "Storage" && d === "2026-11-15" ? 1.05 : healthy(d, s)));
  const result = P.computeStreak(daily, { asOf: today, from: "2026-10-01", portfolio: PF });
  const okLedger = { missing: false, short: [] };
  const v = P.verifyAlerts({ result, ledger: okLedger, prev: null, today, since: "2026-11-06", portfolio: PF });
  assert.deepEqual(v.reasons.map((r) => r.reason), ["portfolio-under-floor"]);
  assert.deepEqual(v.reasons[0].detail.days, [{ date: "2026-11-15", id: "storage", usd: 1.05 }]);
  const v2 = P.verifyAlerts({ result, ledger: okLedger, prev: null, today, since: "2026-11-01", portfolio: PF });
  assert.deepEqual(v2.reasons.map((r) => r.reason), ["services-below-min", "portfolio-under-floor"]);
  assert.deepEqual(v2.reasons[0].detail.days, [{ date: "2026-11-05", services: 2 }], "only the pre-keeper day is short of 6");
  const v3 = P.verifyAlerts({ result, ledger: { missing: true, short: [] }, prev: { streak: { days: 30, start: "2026-10-10" } }, today, since: "2026-11-06", portfolio: PF });
  assert.deepEqual(v3.reasons.map((r) => r.reason), ["portfolio-under-floor", "ledger-missing", "streak-reset"]);
  assert.deepEqual(P.verifyAlerts({ result, ledger: { missing: true, short: [] }, today, since: "2026-11-25", portfolio: PF }).reasons, [], "the keeper is not due yet");
  const late = P.verifyAlerts({ result, ledger: { missing: true, short: [] }, today: "2027-02-01", since: "2026-11-06", until: "2027-01-31", portfolio: PF });
  assert.equal(late.ok, true); assert.match(late.notes[0], /past M3_UNTIL/);
  const empty = P.verifyAlerts({ result: P.computeStreak({}, { asOf: today }), ledger: null, today, since: "2026-11-25", portfolio: PF });
  assert.equal(empty.ok, true); assert.match(empty.notes[0], /no closed day on or after/);
});

test("Shared Key string-to-sign: the documented layout for a List Blobs GET and a conditional PUT", () => {
  const date = "Thu, 05 Nov 2026 03:17:00 GMT";
  const get = P.sharedKeyStringToSign({ method: "GET", account: "acct", path: "/m3", query: { restype: "container", comp: "list", prefix: "ops/none/", maxresults: "1" },
    headers: { "x-ms-version": "2023-11-03", "x-ms-date": date } });
  assert.equal(get, `GET\n\n\n\n\n\n\n\n\n\n\n\nx-ms-date:${date}\nx-ms-version:2023-11-03\n/acct/m3\ncomp:list\nmaxresults:1\nprefix:ops/none/\nrestype:container`);
  const put = P.sharedKeyStringToSign({ method: "PUT", account: "acct", path: "/m3/ledger/2026-11-05.json",
    headers: { "Content-Type": "application/json", "content-length": "17", "If-Match": '"0x8D"', "x-ms-blob-type": "BlockBlob", "x-ms-date": date, "x-ms-version": "2023-11-03" } });
  assert.equal(put, `PUT\n\n\n17\n\napplication/json\n\n\n"0x8D"\n\n\n\nx-ms-blob-type:BlockBlob\nx-ms-date:${date}\nx-ms-version:2023-11-03\n/acct/m3/ledger/2026-11-05.json`);
  assert.match(P.sharedKeyStringToSign({ method: "GET", account: "a", path: "/c/b", headers: { "content-length": "0" } }), /^GET\n\n\n\n/, "a zero length signs as empty");
});

test("the in-job copies agree with plan.js on fixtures (keeper and verifier are self-contained)", () => {
  const verbatim = ["laneSpent", "mergeBlind", "adoptOrphans", "offlineSpent", "foldOffline", "unitsToBuy", "runMode", "laneTargets", "minutesToMidnight", "chatUsd", "sharedKeyStringToSign"];
  for (const f of verbatim) assert.equal(K[f].toString(), P[f].toString(), `keeper ${f}`);
  for (const f of ["mergeBlind", "laneReported", "streakReset", "sharedKeyStringToSign", "costQueryBody", "dayList", "parseCostRows", "ledgerRuns", "projectBalance"]) assert.equal(V[f].toString(), P[f].toString(), `verifier ${f}`);
  // behaviour on fixtures for the copies whose defaults differ
  const ledgers = [null, { lanes: {} }, { lanes: { models: { usd: 1, pendingUsd: 0.2, blindUsd: 0.1 } } }, { lanes: { models: { usd: 1.35 } } }];
  const lanes = [{ id: "models", targetUsd: 1.35, capUsd: 2, unitUsd: 0.005, maxUnitUsd: 0.0073 }, { id: "models", targetUsd: 1.35, capUsd: 1.36, unitUsd: 0.01 }];
  for (const l of ledgers) for (const ln of lanes) for (const when of [{ date: "2026-11-05", until: "2027-01-31" }, { date: "2027-03-01", until: "2027-01-31" }])
    assert.equal(K.unitsToBuy(l, ln, when), P.unitsToBuy(l, ln, when));
  const asOf = "2026-11-20";
  const fixtures = [
    mkDaily("2026-10-01", asOf, healthy),
    mkDaily("2026-10-01", asOf, (d, s) => (d === "2026-11-10" && s === "Storage" ? 0.4 : healthy(d, s))),
    mkDaily("2026-11-01", asOf, (d, s) => { const i = SERVICES.indexOf(s), k = Number(d.slice(8)) % 2; return i < 4 || i === 4 + k ? 2 : 0.5; }),
    mkDaily("2026-11-01", asOf, (d, s) => (d === "2026-11-12" ? undefined : healthy(d, s))),
    {},
  ];
  const portfolio = PF.map((p) => ({ id: p.id, match: p.match }));   // as the CLI passes it in M3_PORTFOLIO_JSON
  for (const daily of fixtures) for (const from of [null, "2026-10-15"]) {
    const a = P.computeStreak(daily, { asOf, from, portfolio }), b = V.computeStreak(daily, { asOf, from, portfolio });
    assert.deepEqual(b, a);
    for (const d of Object.keys(daily)) assert.deepEqual(V.classify(daily[d], portfolio), P.classify(daily[d], portfolio));
    for (const ledger of [null, { missing: true, short: [] }, { missing: false, short: [{ lane: "tts", usd: 1, target: 1.35 }] }])
      for (const prev of [null, { streak: { days: 5, start: "2026-11-02" } }])
        for (const since of [null, "2026-11-06"])
          assert.deepEqual(V.verifyAlerts({ result: b, ledger, prev, today: asOf, since, portfolio }), P.verifyAlerts({ result: a, ledger, prev, today: asOf, since, portfolio }));
    // the M4 options, every one switched on, on the same fixtures
    const runs = { runners: ["aca"], alerts: [{ runner: "vm", reason: "auth-failed", lane: "tts" }] };
    for (const m4 of [{ floorAlert: false, minServices: 8, runs, runners: { expected: ["aca", "vm"], since: "2026-11-02" }, burstUsd: 10, runway: { projectedUsd: 100 } },
      { floorAlert: true, runs: { runners: ["aca", "vm"], alerts: [] }, runners: { expected: ["aca", "vm"] }, burstUsd: 60, burstDays: 5, runway: { projectedUsd: 900 } }]) {
      const o = { ledger: { missing: false, short: [] }, prev: null, today: asOf, since: "2026-11-06", portfolio, ...m4 };
      assert.deepEqual(V.verifyAlerts({ result: b, ...o }), P.verifyAlerts({ result: a, ...o }));
    }
  }
  const lanesT = { models: { targetUsd: 1.35 }, tts: { targetUsd: 1.35 }, storage: { targetUsd: 1.25 } };
  for (const l of [null, ...ledgers.slice(1)]) assert.deepEqual(V.ledgerShort(l, lanesT), P.ledgerShort(l, lanesT));
  for (const d of ["2026-11-05", "2026-12-31", "2027-02-28"]) for (const k of [-66, -1, 0, 1, 59]) assert.equal(V.addDays(d, k), P.addDays(d, k));
});

// ───────────────────────────── the jobs end to end, against a fake Azure ─────────────────────────────

const runKeeper = (az, at, env) => run(K, az, at, env);
const D = "2026-11-05", AM = `${D}T03:17:05Z`, PM = `${D}T15:17:05Z`;

test("keeper: the day's first run spends each lane to its target under its cap; a later run spends nothing more; after M3_UNTIL nothing", async () => {
  const az = fakeAzure();
  const am = await runKeeper(az, AM);
  assert.equal(am.code, 0); assert.equal(am.lines.at(-1), "M3-RUN-OK");
  const s = az.spent();
  for (const [id, real] of [["models", s.models], ["tts", s.tts], ["storage", s.storage]]) {
    const l = am.lane(id);
    assert.ok(l.ok && l.after >= 1.25 && l.after <= 2, `${id} ${l.after}`);
    assert.ok(Math.abs(real - l.after) < 1e-3, `${id}: the ledger is what the APIs reported (${real} vs ${l.after})`);
  }
  const led = az.ledger(D);
  assert.equal(led.date, D); assert.equal(led.v, 2); assert.equal(led.runs.length, 1); assert.equal(led.runs[0].runner, "aca"); assert.equal(led.lanes.models.pendingUsd, 0);
  assert.deepEqual(Object.keys(led.targets).sort(), ["models", "storage", "tts"]);
  assert.equal(az.lease(`ledger/${D}.json`), null, "the lease is released at the end");
  assert.ok(!JSON.stringify(az.blobs.get(`ledger/${D}.json`).body).includes("secret"), "no key in the ledger");
  const before = { ...az.calls };
  const pm = await runKeeper(az, PM);
  assert.equal(pm.code, 0);
  assert.deepEqual([az.calls.chat, az.calls.tts, az.calls.list], [before.chat, before.tts, before.list], "a later run only tops up what is missing");
  assert.equal(pm.lane("models").spent, 0); assert.equal(az.ledger(D).runs.length, 2);
  const late = await runKeeper(az, "2027-02-01T03:17:00Z");
  assert.equal(late.code, 0); assert.match(late.lines[0], /^M3-UNTIL-PASSED /);
  assert.equal(az.calls.chat, before.chat);
  for (const l of [...am.lines, ...pm.lines]) assert.ok(!/secret|SharedKey|api-key/i.test(l), `no credential in a log line: ${l.slice(0, 80)}`);
});

test("keeper: an unreadable ledger → the ACA runner spends nothing (M3-ALERT, exit 1); once it reads, one run spends the day", async () => {
  let broken = true;
  const az = fakeAzure({ failGet: (n) => broken && n === `ledger/${D}.json` });
  const am = await runKeeper(az, AM);
  assert.equal(am.code, 1, "the job retry may try again");
  assert.equal(am.alerts[0].reason, "ledger-unreadable"); assert.equal(am.alerts[0].action, "nothing spent without the shared ledger");
  assert.deepEqual([az.calls.chat, az.calls.tts, az.calls.list], [0, 0, 0]);
  const again = await runKeeper(az, AM);   // a retry or a manual re-run
  assert.equal(again.code, 1);
  assert.deepEqual([az.calls.chat, az.calls.tts, az.calls.list], [0, 0, 0]);
  broken = false;
  const pm = await runKeeper(az, PM);
  assert.equal(pm.code, 0);
  const s = az.spent();
  assert.ok(s.models >= 1.35 && s.models <= 2 && s.tts >= 1.35 && s.tts <= 2 && s.storage >= 1.25 - 1e-6 && s.storage <= 2, JSON.stringify(s));
});

test("keeper: a failing primary deployment falls back; a lost write never lets the next run spend twice", async () => {
  const az = fakeAzure({ chat: (b) => (b.model === "dep-fast" ? { status: 400 } : { prompt_tokens: 80, completion_tokens: 3000 }) });
  const r = await runKeeper(az, AM);
  assert.equal(r.code, 0);
  assert.ok(r.lines.some((l) => l.startsWith("M3-FALLBACK ") && l.includes('"to":"fallback"')));
  assert.ok(r.lane("models").via.fallback >= 1.35 && r.lane("models").after <= 2);
  // the ledger write after the 3rd models batch fails (content PUTs: create, then before/after each batch → the 7th)
  let n = 0;
  const az2 = fakeAzure({ failPut: (name) => name === `ledger/${D}.json` && ++n === 7 });
  const a = await runKeeper(az2, AM);
  assert.equal(a.code, 1, "a short lane exits non-zero so the job retry fires");
  assert.match(a.lane("models").err, /ledger write failed after a batch/);
  const b = await runKeeper(az2, AM);
  assert.equal(b.code, 0);
  const real = az2.spent().models;
  assert.ok(real <= 2, `never past the cap: ${real}`);
  assert.ok(real >= 1.35 - 6 * 0.00726, `short by at most the lost batch's worst case: ${real}`);
});

/** A fake ARM + Cost Management + blob store for the verifier. */
function fakeArm(daily, { blobs = new Map(), cm = 200 } = {}) {
  const puts = [];
  const rows = Object.entries(daily).flatMap(([d, svc]) => Object.entries(svc).map(([s, v]) => [Math.round(v * 96 * 100) / 100, v, Number(d.replace(/-/g, "")), s, "INR"]));
  const cols = [{ name: "Cost" }, { name: "CostUSD" }, { name: "UsageDate" }, { name: "ServiceName" }, { name: "Currency" }];
  const fetch = async (url, init = {}) => {
    const u = new URL(url), method = init.method || "GET";
    if (u.hostname === "login.microsoftonline.com") return Response.json({ access_token: "tok", expires_in: 3600 });
    if (u.hostname === "management.azure.com") {
      if (u.pathname.endsWith("/Microsoft.CostManagement/query")) {
        if (cm !== 200) return Response.json({ error: { code: "Denied" } }, { status: cm });
        const page = u.searchParams.get("page");
        const half = Math.ceil(rows.length / 2);
        return Response.json({ properties: { columns: cols, rows: page ? rows.slice(half) : rows.slice(0, half),
          nextLink: page ? null : `https://management.azure.com${u.pathname}?api-version=2023-11-01&page=2` } });
      }
      return Response.json({ error: { code: "NotSupported" } }, { status: 400 });   // balances / credits / billing accounts
    }
    if (u.hostname === "acct.blob.core.windows.net") {
      const name = u.pathname.replace(/^\/m3-ledger\//, "");
      if (method === "PUT") { puts.push(name); blobs.set(name, { body: Buffer.from(init.body).toString() }); return new Response("", { status: 201 }); }
      const b = blobs.get(name);
      return b ? new Response(b.body, { status: 200 }) : new Response("", { status: 404 });
    }
    throw new Error(`unexpected fetch ${url}`);
  };
  return { fetch, puts, blobs };
}
async function runVerify(az, at, env = {}) {
  Object.assign(process.env, { AZURE_TENANT_ID: "t", AZURE_SUBSCRIPTION_ID: "s", M3_SP_CLIENT_ID: "c", M3_SP_SECRET: "sp-secret", M3_SINCE: "2026-11-06", M3_UNTIL: "2027-01-31",
    M3_PORTFOLIO_JSON: JSON.stringify(PF.map((p) => ({ id: p.id, match: p.match }))), M3_LANES_JSON: JSON.stringify({ models: { targetUsd: 1.35 }, tts: { targetUsd: 1.35 }, storage: { targetUsd: 1.25 } }), ...env });
  const lines = [], log = console.log, f = globalThis.fetch;
  console.log = (s) => lines.push(String(s));
  globalThis.fetch = az.fetch;
  try { return { code: await V.main(new Date(at)), lines }; } finally { console.log = log; globalThis.fetch = f; }
}

test("verifier: healthy → M3-OK with the clock and a written report; a dip, a missing ledger and a failed query alert", async () => {
  const today = "2026-11-20";
  const goodLedger = JSON.stringify({ v: 1, date: "2026-11-19", lanes: { models: { usd: 1.36 }, tts: { usd: 1.35 }, storage: { usd: 1.25 } } });
  const daily = mkDaily("2026-09-16", today, (d, s) => (d < "2026-11-06" ? (s.startsWith("Azure") ? 3 : 0.1) : healthy(d, s)));
  const az = fakeArm(daily, { blobs: new Map([["ledger/2026-11-19.json", { body: goodLedger }]]) });
  const ok = await runVerify(az, `${today}T06:41:00Z`);
  assert.equal(ok.code, 0);
  assert.equal(ok.lines.length, 1); assert.match(ok.lines[0], /^M3-OK /);
  const sum = JSON.parse(ok.lines[0].slice(6));
  assert.equal(sum.streak, 13); assert.equal(sum.start, "2026-11-06"); assert.equal(sum.completes, "2027-01-04"); assert.equal(sum.credit, "unsupported");
  assert.deepEqual(az.puts, [`report/${today}.json`]);
  const rep = JSON.parse(az.blobs.get(`report/${today}.json`).body);
  assert.equal(rep.source, "CostUSD"); assert.equal(rep.credits.supported, false); assert.equal(rep.ok, true);
  // next day: one service dipped on a closed day → 5 left (below the 6 we keep), the clock still runs
  const dip1 = mkDaily("2026-09-16", "2026-11-21", (d, s) => (d < "2026-11-06" ? (s.startsWith("Azure") ? 3 : 0.1) : s === "Storage" && d === "2026-11-19" ? 0.6 : healthy(d, s)));
  const one = await runVerify(fakeArm(dip1, { blobs: new Map([[`report/${today}.json`, { body: JSON.stringify(rep) }], ["ledger/2026-11-20.json", { body: goodLedger.replace("11-19", "11-20") }]]) }), "2026-11-21T06:41:00Z");
  assert.deepEqual(one.lines.map((l) => JSON.parse(l.replace(/^M3-ALERT /, "")).reason), ["services-below-min", "portfolio-under-floor"]);
  assert.equal(JSON.parse(one.lines[0].replace(/^M3-ALERT /, "")).streak, 14, "5 services still held: the clock did not reset");
  // two dipped (4 left): the clock restarted; the ledger is gone too
  const bad = mkDaily("2026-09-16", "2026-11-21", (d, s) => (d < "2026-11-06" ? (s.startsWith("Azure") ? 3 : 0.1) : (s === "Storage" || s === "Foundry Tools") && d === "2026-11-19" ? 0.6 : healthy(d, s)));
  const az2 = fakeArm(bad, { blobs: new Map([[`report/${today}.json`, { body: JSON.stringify(rep) }]]) });
  const alert = await runVerify(az2, "2026-11-21T06:41:00Z");
  assert.equal(alert.code, 0);
  assert.deepEqual(alert.lines.map((l) => JSON.parse(l.replace(/^M3-ALERT /, "")).reason), ["services-below-min", "portfolio-under-floor", "ledger-missing", "streak-reset"]);
  assert.ok(alert.lines.every((l) => l.startsWith("M3-ALERT ") && !l.includes("sp-secret")));
  const dead = await runVerify(fakeArm(daily, { cm: 403 }), `${today}T06:41:00Z`);
  assert.equal(dead.code, 1); assert.match(dead.lines[0], /^M3-ALERT .*cost-query-failed/);
});

test("m3.mjs plan runs without Azure and prints the 60-day totals", () => {
  const out = execFileSync(process.execPath, [new URL("../scripts/m3.mjs", import.meta.url).pathname, "plan"], { env: { PATH: process.env.PATH }, encoding: "utf8" });
  assert.match(out, /6 services: \$13\.5\/day, \$812\.\d over 60 days/);
  assert.match(out, /qualify by 2027-01-04, so the clock must start by 2026-11-06/);
});

// ── platform review follow-ups (2026-11-05): the silent rule's arming, the optional email receiver ──
test("silentQuery: reports healthy (n = 1) until armed-at + 26 h; armed-at must be an ISO UTC second; armedNow matches it", () => {
  const q = P.silentQuery("2026-11-05T14:40:05Z");
  assert.match(q, /^let armed = datetime\(2026-11-05T14:40:05Z\); /);
  assert.match(q, /summarize n = count\(\) \| extend n = iff\(now\(\) < armed \+ 26h, 1, n\)$/);
  assert.equal(P.silentQuery("2026-11-05T14:40:05Z"), q, "same armed-at → same query (stable spec hash on re-apply)");
  for (const bad of ["", "2026-11-05", "2026-11-05T14:40:05.123Z", "now()"]) assert.throws(() => P.silentQuery(bad), /ISO UTC second/);
  assert.match(P.armedNow(new Date("2026-11-05T14:40:05.678Z")), /^2026-11-05T14:40:05Z$/);
});

test("actionGroupBody: the Owner role always; an email receiver only from M3_ALERT_EMAIL; matching is exact on the email set", () => {
  const OWNER = "8e3af657-a8ff-443c-a75c-2fe8c4bcb635";
  const plain = P.actionGroupBody({ ownerRole: OWNER });
  assert.deepEqual(plain.properties.emailReceivers, []);
  assert.equal(plain.properties.armRoleReceivers[0].roleId, OWNER);
  assert.ok(plain.properties.groupShortName.length <= 12);
  const withMail = P.actionGroupBody({ ownerRole: OWNER, email: " owner@example.test " });
  assert.deepEqual(withMail.properties.emailReceivers, [{ name: "m3-alert-email", emailAddress: "owner@example.test", useCommonAlertSchema: true }]);
  assert.throws(() => P.actionGroupBody({ ownerRole: OWNER, email: "not-an-address" }), /not an email/);
  const live = (emails, enabled = true) => ({ properties: { enabled, armRoleReceivers: [{ roleId: OWNER }], emailReceivers: emails.map((e) => ({ emailAddress: e })) } });
  assert.equal(P.actionGroupMatches(live([]), plain), true);
  assert.equal(P.actionGroupMatches(live([]), withMail), false, "adding the email re-PUTs");
  assert.equal(P.actionGroupMatches(live(["OWNER@example.test"]), withMail), true);
  assert.equal(P.actionGroupMatches(live(["owner@example.test"]), plain), false, "removing it re-PUTs too");
  assert.equal(P.actionGroupMatches(live([], false), plain), false);
  assert.equal(P.actionGroupMatches(null, plain), false);
});

test("the ledger container's name is a legal blob container name (3-63 chars: lowercase, digits, single hyphens)", () => {
  // 2026-11-06: the first live dry run failed with OutOfRangeInput because the container was "m3" (2 chars); the fake
  // Azure above never checked the name. Both job scripts and scripts/m3.mjs must agree on the default.
  const legal = /^(?=.{3,63}$)[a-z0-9]+(-[a-z0-9]+)*$/;
  for (const f of ["../infra/m3/keeper-job.mjs", "../infra/m3/verify-job.mjs", "../scripts/m3.mjs"]) {
    const src = readFileSync(new URL(f, import.meta.url), "utf8");
    const m = src.match(/M3_CONTAINER \|\| "([^"]+)"/) || src.match(/container: "([^"]+)"/);
    assert.ok(m, `${f}: default container name found`);
    assert.match(m[1], legal, `${f}: ${m[1]}`);
    assert.equal(m[1], "m3-ledger", `${f}: all three agree`);
  }
});
