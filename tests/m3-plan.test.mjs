// Round 7, M3 credit unlock: infra/m3/plan.js (pure), the copies inside the two self-contained in-job scripts
// (infra/m3/keeper-job.mjs, infra/m3/verify-job.mjs) checked against it on fixtures, and both jobs' main() end to end
// against a fake Azure (blob store with ETags, chat, TTS, Cost Management). No network, no Azure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import * as P from "../infra/m3/plan.js";
import { CHAT } from "../server/cost/prices.js";

// the jobs read their env at load AND at run time: set it before importing them (M3_ROLE stays unset, so their main does
// not run) and keep it for this file's tests. Only M3_* names: no other suite reads them, so sharing npm test's one
// process with them is safe (tests/test-isolation.test.mjs requires the marker below for a module-level env write).
Object.assign(process.env, { M3_STORAGE_ACCOUNT: "acct", M3_STORAGE_KEY: Buffer.from("k".repeat(32)).toString("base64"), M3_CONTAINER: "m3", M3_BACKOFF_MS: "1" });   // one-process-safe: M3_* names only, read by no other suite
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

test("portfolio: 7 candidates, 5 required + 2 spare; the classifier maps Cost Management ServiceNames and flags a collapse", () => {
  assert.equal(P.PORTFOLIO.length, 7);
  assert.equal(new Set(P.PORTFOLIO.map((p) => p.id)).size, 7);
  assert.deepEqual(P.activePortfolio().map((p) => p.id), ["aca", "pg", "acr", "models", "tools", "storage"]);
  assert.equal(P.activePortfolio({ vm: true }).length, 7);
  for (const p of P.PORTFOLIO) assert.ok(p.usdPerDay >= 1.25 || p.id === "aca", `${p.id} planned at $${p.usdPerDay}`);
  const c = P.classify({ "Azure Container Apps": 1.6, "Azure Database for PostgreSQL": 6, "Container Registry": 1.67, "Foundry Models": 1.4, "Foundry Tools": 1.4,
    Storage: 1.3, "Virtual Machines": 1.33, "Log Analytics": 0.2, Bandwidth: 0.01 });
  assert.deepEqual(c.byId, { aca: 1.6, pg: 6, acr: 1.67, models: 1.4, tools: 1.4, storage: 1.3, vm: 1.33 });
  assert.deepEqual(Object.keys(c.unmatched).sort(), ["Bandwidth", "Log Analytics"]);
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
  assert.equal(P.slotOf("2026-11-05T03:17:00Z"), "am"); assert.equal(P.slotOf("2026-11-05T15:17:00Z"), "pm");
  assert.deepEqual(["ok", "absent", "broken"].flatMap((s) => ["am", "pm"].map((t) => P.runMode(s, t))), ["topup", "topup", "topup", "topup", "blind", "skip"]);
  assert.equal(P.chatUsd({ in: 1080, cached: 1000, out: 4000 }, P.MODEL_PRICES["taxila-fast"]), 0.004836);
  assert.equal(P.chatUsd({}, P.MODEL_PRICES["taxila-fast"]), 0);
  const m = P.mergeBlind({ v: 1, lanes: { tts: { usd: 0.2, pendingUsd: 0 } } }, { lanes: { tts: { usd: 1.35 }, models: { usd: 1.0, pendingUsd: 0.01 } } });
  assert.equal(P.laneSpent(m, "tts"), 1.55); assert.equal(P.laneSpent(m, "models"), 1.01);
  assert.deepEqual(P.ledgerShort(null), { missing: true, short: [] });
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
  const verbatim = ["laneSpent", "mergeBlind", "unitsToBuy", "runMode", "chatUsd", "sharedKeyStringToSign"];
  for (const f of verbatim) assert.equal(K[f].toString(), P[f].toString(), `keeper ${f}`);
  for (const f of ["mergeBlind", "laneReported", "streakReset", "sharedKeyStringToSign", "costQueryBody", "dayList", "parseCostRows"]) assert.equal(V[f].toString(), P[f].toString(), `verifier ${f}`);
  // behaviour on fixtures for the copies whose defaults differ
  const ledgers = [null, { lanes: {} }, { lanes: { models: { usd: 1, pendingUsd: 0.2, blindUsd: 0.1 } } }, { lanes: { models: { usd: 1.35 } } }];
  const lanes = [{ id: "models", targetUsd: 1.35, capUsd: 2, unitUsd: 0.005, maxUnitUsd: 0.0073 }, { id: "models", targetUsd: 1.35, capUsd: 1.36, unitUsd: 0.01 }];
  for (const l of ledgers) for (const ln of lanes) for (const when of [{ date: "2026-11-05", until: "2027-01-31" }, { date: "2027-03-01", until: "2027-01-31" }])
    assert.equal(K.unitsToBuy(l, ln, when), P.unitsToBuy(l, ln, when));
  for (const d of ["2026-11-05T00:00:00Z", "2026-11-05T11:59:59Z", "2026-11-05T12:00:00Z", "2026-11-05T23:59:59Z"]) assert.equal(K.slotOf(d), P.slotOf(d));
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
  }
  const lanesT = { models: { targetUsd: 1.35 }, tts: { targetUsd: 1.35 }, storage: { targetUsd: 1.25 } };
  for (const l of [null, ...ledgers.slice(1)]) assert.deepEqual(V.ledgerShort(l, lanesT), P.ledgerShort(l, lanesT));
  for (const d of ["2026-11-05", "2026-12-31", "2027-02-28"]) for (const k of [-66, -1, 0, 1, 59]) assert.equal(V.addDays(d, k), P.addDays(d, k));
});

// ───────────────────────────── the jobs end to end, against a fake Azure ─────────────────────────────

/** A fake Azure: a blob store with ETags and conditional writes, chat, TTS and List Blobs, each counted. */
function fakeAzure({ failGet = () => false, failPut = () => false, chat = () => ({ prompt_tokens: 80, completion_tokens: 4000 }) } = {}) {
  const blobs = new Map(), calls = { chat: 0, chatOk: 0, tts: 0, list: 0, put: 0 };
  let etagN = 0, spent = { models: 0, tts: 0, storage: 0 };
  const fetch = async (url, init = {}) => {
    const u = new URL(url), method = init.method || "GET";
    const h = Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    if (u.hostname === "acct.blob.core.windows.net") {
      assert.match(h.authorization, /^SharedKey acct:[A-Za-z0-9+/]+=*$/);
      if (u.searchParams.get("comp") === "list") { calls.list++; spent.storage += 0.0001; return new Response("<EnumerationResults/>", { status: 200 }); }
      const name = decodeURIComponent(u.pathname.replace(/^\/m3\//, ""));
      if (method === "GET") {
        if (failGet(name)) return new Response("", { status: 500 });
        const b = blobs.get(name);
        return b ? new Response(b.body, { status: 200, headers: { etag: b.etag } }) : new Response("", { status: 404 });
      }
      calls.put++;
      if (failPut(name, calls.put)) return new Response("", { status: 500 });
      const cur = blobs.get(name);
      if (h["if-none-match"] === "*" && cur) return new Response("", { status: 409 });
      if (h["if-match"] && cur?.etag !== h["if-match"]) return new Response("", { status: 412 });
      const etag = `"0x${++etagN}"`;
      blobs.set(name, { body: Buffer.from(init.body).toString(), etag });
      return new Response("", { status: 201, headers: { etag } });
    }
    if (u.pathname.endsWith("/chat/completions")) {
      calls.chat++;
      assert.equal(h["api-key"], "aoai-secret");
      const r = chat(JSON.parse(init.body));
      if (r.status) return new Response(JSON.stringify({ error: { code: "x" } }), { status: r.status });
      calls.chatOk++;
      const p = JSON.parse(init.body).model === "dep-fb" ? { in: 4, cached: 0.4, out: 20 } : { in: 0.2, cached: 0.02, out: 1.2 };
      spent.models += (r.prompt_tokens * p.in + r.completion_tokens * p.out) / 1e6;
      return Response.json({ choices: [{ message: { content: "…" } }], usage: { ...r, prompt_tokens_details: { cached_tokens: 0 } } });
    }
    if (u.hostname.endsWith(".tts.speech.microsoft.com")) {
      calls.tts++;
      const text = String(init.body).replace(/<[^>]+>/g, "");
      spent.tts += ([...text].length * 15) / 1e6;
      return new Response(new Uint8Array(64), { status: 200 });
    }
    throw new Error(`unexpected fetch ${u.host}${u.pathname}`);
  };
  return { fetch, blobs, calls, spent: () => spent, ledger: (d) => JSON.parse(blobs.get(`ledger/${d}.json`)?.body || "null") };
}
const KEEPER_ENV = { M3_UNTIL: "2027-01-31", M3_MODELS_TARGET: "1.35", M3_MODELS_CAP: "2", M3_TTS_TARGET: "1.35", M3_TTS_CAP: "2", M3_STORAGE_TARGET: "1.25", M3_STORAGE_CAP: "2",
  M3_AOAI_ENDPOINT: "https://example.openai.azure.com/openai/v1", M3_AOAI_KEY: "aoai-secret", M3_AOAI_DEPLOYMENT: "dep-fast", M3_AOAI_PRICE_IN: "0.2", M3_AOAI_PRICE_CACHED: "0.02", M3_AOAI_PRICE_OUT: "1.2",
  M3_AOAI_FALLBACK_DEPLOYMENT: "dep-fb", M3_AOAI_FALLBACK_PRICE_IN: "4", M3_AOAI_FALLBACK_PRICE_CACHED: "0.4", M3_AOAI_FALLBACK_PRICE_OUT: "20",
  M3_SPEECH_REGION: "centralindia", M3_SPEECH_KEY: "speech-secret", M3_TTS_PRICE_PER_MCHARS: "15", M3_STORAGE_OP_USD: "0.0001", M3_STORAGE_BATCH: "2000" };
async function runKeeper(az, at) {
  Object.assign(process.env, KEEPER_ENV);
  const lines = [], log = console.log, f = globalThis.fetch;
  console.log = (s) => lines.push(String(s));
  globalThis.fetch = az.fetch;
  try { const code = await K.main(new Date(at)); return { code, lines, lane: (id) => lines.filter((l) => l.startsWith("M3 ")).map((l) => JSON.parse(l.slice(3))).find((x) => x.lane === id) }; }
  finally { console.log = log; globalThis.fetch = f; }
}
const D = "2026-11-05", AM = `${D}T03:17:05Z`, PM = `${D}T15:17:05Z`;

test("keeper: the am run spends each lane to its target under its cap; the pm run spends nothing more; after M3_UNTIL nothing", async () => {
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
  assert.equal(led.date, D); assert.equal(led.runs.length, 1); assert.equal(led.lanes.models.pendingUsd, 0);
  assert.ok(!JSON.stringify(az.blobs.get(`ledger/${D}.json`).body).includes("secret"), "no key in the ledger");
  const before = { ...az.calls };
  const pm = await runKeeper(az, PM);
  assert.equal(pm.code, 0);
  assert.deepEqual([az.calls.chat, az.calls.tts, az.calls.list], [before.chat, before.tts, before.list], "the pm run only tops up what is missing");
  assert.equal(pm.lane("models").spent, 0); assert.equal(az.ledger(D).runs.length, 2);
  const late = await runKeeper(az, "2027-02-01T03:17:00Z");
  assert.equal(late.code, 0); assert.match(late.lines[0], /^M3-UNTIL-PASSED /);
  assert.equal(az.calls.chat, before.chat);
  for (const l of [...am.lines, ...pm.lines]) assert.ok(!/secret|SharedKey|api-key/i.test(l), `no credential in a log line: ${l.slice(0, 80)}`);
});

test("keeper: an unreadable ledger → the am run spends each target once (a retry cannot repeat it), the pm run skips", async () => {
  let broken = true;
  const az = fakeAzure({ failGet: (n) => broken && n === `ledger/${D}.json` });
  const am = await runKeeper(az, AM);
  assert.equal(am.code, 0, "never retried");
  assert.match(am.lines[0], /^M3-ALERT .*ledger-unreadable/);
  const once = { ...az.calls }, s1 = az.spent();
  assert.ok(s1.models >= 1.35 && s1.models <= 2 && s1.tts >= 1.35 && s1.storage >= 1.25 - 1e-6, JSON.stringify(s1));
  const again = await runKeeper(az, AM);   // a manual re-run or a retry
  assert.equal(again.code, 0);
  assert.deepEqual([az.calls.chat, az.calls.tts, az.calls.list], [once.chat, once.tts, once.list], "the blind spend is claimed once per day");
  const pm = await runKeeper(az, PM);
  assert.equal(pm.code, 1); assert.match(pm.lines[0], /^M3-ALERT .*pm run skipped/);
  assert.deepEqual([az.calls.chat, az.calls.tts, az.calls.list], [once.chat, once.tts, once.list]);
  broken = false;   // the ledger reads again: the blind blob is folded in, nothing is bought twice
  const pm2 = await runKeeper(az, PM);
  assert.equal(pm2.code, 0);
  assert.deepEqual([az.calls.chat, az.calls.tts, az.calls.list], [once.chat, once.tts, once.list]);
});

test("keeper: a failing primary deployment falls back; a lost write never lets the next run spend twice", async () => {
  const az = fakeAzure({ chat: (b) => (b.model === "dep-fast" ? { status: 400 } : { prompt_tokens: 80, completion_tokens: 3000 }) });
  const r = await runKeeper(az, AM);
  assert.equal(r.code, 0);
  assert.ok(r.lines.some((l) => l.startsWith("M3-FALLBACK ") && l.includes('"to":"fallback"')));
  assert.ok(r.lane("models").via.fallback >= 1.35 && r.lane("models").after <= 2);
  // the ledger write after the 3rd models batch fails: that batch's worst case stays counted, the retry tops up the rest
  let n = 0;
  const az2 = fakeAzure({ failPut: (name) => name === `ledger/${D}.json` && ++n === 6 });
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
      const name = u.pathname.replace(/^\/m3\//, "");
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
