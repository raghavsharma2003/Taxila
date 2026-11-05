// Milestone 3 credit unlock (round 7, M3; owner page docs/design/round7/M3.md): the PURE half. No I/O.
//
// Microsoft for Startups Milestone 3 ($25,000 + a 2-year extension) needs >= 5 Azure workloads, each >= $1 of spend
// EVERY day, for 60 continuous days (RULE below, read from the Learn page on 2026-11-05). We count a workload as one
// Cost Management ServiceName: the page does not say how Microsoft counts, ServiceName is our proxy.
//
// This file holds: the service portfolio (7 candidates, 2 spare), every hard-coded retail price with the Retail
// Prices API filter that found it, the classification of Cost Management rows, the streak (the 60-day clock), the
// keeper's top-up arithmetic and the verifier's alert rules. scripts/m3.mjs imports it. The two in-job scripts
// (infra/m3/keeper-job.mjs, infra/m3/verify-job.mjs) run inline in a stock node image and cannot import the repo, so
// they carry copies of the pieces they need; tests/m3-plan.test.mjs checks every copy against this file on fixtures.

/** The rule, as read. */
export const RULE = Object.freeze({
  url: "https://learn.microsoft.com/en-us/startups/standard-benefits/unlock-more-benefits",
  readOn: "2026-11-05",
  pageDate: "2026-11-03",
  grantUsd: 25_000,
  workloads: 5,
  usdPerDay: 1.0,
  days: 60,
  // Milestone 2 text on the same page: "If you don't qualify for Milestone 3 ... within 180 days of Business
  // Verification, the sponsorship is cancelled and the subscription is converted to pay-as-you-go."
  qualifyWithinDaysOfVerification: 180,
  // Milestone 4 ($50,000) is the same rule with 7 workloads; "you don't need to progress through milestones sequentially".
  milestone4Workloads: 7,
});

/** What the verifier alerts on (owner's spec): one spare service, a 10% floor on each portfolio service. */
export const ALERT = Object.freeze({
  minServices: 6,
  portfolioFloorUsd: 1.10,
  openDays: 2,        // today and yesterday are not closed in Cost Management (8-24 h lag, re-rating)
  alertWindowDays: 14,
  queryDays: 66,      // 60 + the 2 open days + slack, so the streak never has to be chained across reports
});

export const RETAIL_API = "https://prices.azure.com/api/retail/prices";
export const PRICES_CHECKED = "2026-11-05";
/** Azure prorates monthly prices over 730 hours. */
export const HOURS_PER_MONTH = 730;

/**
 * Every price hard-coded here: USD retail pay-as-you-go, read from the Retail Prices API on PRICES_CHECKED (n = 1 read
 * per row). `meterId` + `region` re-find the row (`node scripts/m3.mjs prices` does, and fails on drift); `found` is the
 * $filter that discovered it; productName / meterName narrow rows that share a meter id.
 */
export const PRICES = Object.freeze({
  "acr:Premium": { service: "Container Registry", region: "eastus2", usd: 1.6666, unit: "1/Day", meterId: "2f8e1105-47d0-4105-a934-b2175c766a71",
    meterName: "Premium Registry Unit", found: "serviceName eq 'Container Registry' and armRegionName eq 'eastus2'" },
  "acr:Standard": { service: "Container Registry", region: "eastus2", usd: 0.6666, unit: "1/Day", meterId: "984c39d8-2499-4233-8a97-fb002a809f8f",
    meterName: "Standard Registry Unit", found: "serviceName eq 'Container Registry' and armRegionName eq 'eastus2'" },
  "acr:Basic": { service: "Container Registry", region: "eastus2", usd: 0.1666, unit: "1/Day", meterId: "5c9e7a65-5784-494c-9718-7749d4075dd9",
    meterName: "Basic Registry Unit", found: "serviceName eq 'Container Registry' and armRegionName eq 'eastus2'" },
  "pg:storage": { service: "Azure Database for PostgreSQL", region: "centralindia", usd: 0.131, unit: "1 GB/Month", meterId: "94cadb5b-aa3f-5e96-a8db-7a4778b11616",
    meterName: "Storage Data Stored", found: "serviceName eq 'Azure Database for PostgreSQL' and armRegionName eq 'centralindia' and contains(meterName,'Storage')" },
  "pg:Standard_B1ms": { service: "Azure Database for PostgreSQL", region: "centralindia", usd: 0.0245, unit: "1 Hour", meterId: "27c18f86-1cc2-552e-b6b9-657d170d563d",
    meterName: "B1MS", found: "serviceName eq 'Azure Database for PostgreSQL' and armRegionName eq 'centralindia' and contains(productName,'Flexible Server Burstable BS Series')" },
  "pg:Standard_B2s": { service: "Azure Database for PostgreSQL", region: "centralindia", usd: 0.098, unit: "1 Hour", meterId: "3e7d2ab5-6a87-50b5-b6b9-6486bd6dc651",
    meterName: "B2S", found: "serviceName eq 'Azure Database for PostgreSQL' and armRegionName eq 'centralindia' and contains(productName,'Flexible Server Burstable BS Series')" },
  "pg:Standard_B2ms": { service: "Azure Database for PostgreSQL", region: "centralindia", usd: 0.196, unit: "1 Hour", meterId: "b8e6dba9-5690-517f-b355-c74f35839ceb",
    meterName: "B2ms vCore", found: "serviceName eq 'Azure Database for PostgreSQL' and armRegionName eq 'centralindia' and contains(productName,'Flexible Server Burstable BS Series')" },
  "pg:Standard_B4ms": { service: "Azure Database for PostgreSQL", region: "centralindia", usd: 0.392, unit: "1 Hour", meterId: "50007352-8747-51bc-9ee4-1d34d4ce95fd",
    meterName: "B4ms vCore", found: "serviceName eq 'Azure Database for PostgreSQL' and armRegionName eq 'centralindia' and contains(productName,'Flexible Server Burstable BS Series')" },
  "pg:Standard_D2ds_v5": { service: "Azure Database for PostgreSQL", region: "centralindia", usd: 0.251, unit: "1 Hour", meterId: "fdd9e8a2-a25b-5e98-a10b-96073029307b",
    meterName: "vCore", found: "serviceName eq 'Azure Database for PostgreSQL' and armRegionName eq 'centralindia' and contains(productName,'Ddsv5') and skuName eq '2 vCore'" },
  "vm:Standard_D2as_v5": { service: "Virtual Machines", region: "centralindia", usd: 0.0556, unit: "1 Hour", meterId: "70be92d6-4fad-569d-8eb6-87cf609ea508",
    productName: "Virtual Machines Dasv5 Series", found: "serviceName eq 'Virtual Machines' and armRegionName eq 'centralindia' and priceType eq 'Consumption' (all pages; Linux = productName without 'Windows')" },
  "disk:E4": { service: "Storage", region: "centralindia", usd: 2.64, unit: "1/Month", meterId: "5909273e-c5d4-41c8-afba-506e73d33ece",
    meterName: "E4 LRS Disk", found: "serviceName eq 'Storage' and armRegionName eq 'centralindia' and skuName eq 'E4 LRS' and productName eq 'Standard SSD Managed Disks'" },
  "storage:listOp": { service: "Storage", region: "eastus2", usd: 0.05, unit: "10K", meterId: "3d7aa86c-0e9d-4139-b59f-cc5bad92b873",
    productName: "General Block Blob v2", meterName: "LRS List and Create Container Operations",
    found: "serviceName eq 'Storage' and armRegionName eq 'eastus2' and productName eq 'General Block Blob v2' and skuName eq 'Hot LRS'" },
  "tts:neural": { service: "Foundry Tools", region: "centralindia", usd: 15, unit: "1M", meterId: "0f98e708-a16c-407b-8089-a0ed9e14ab49",
    meterName: "S1 Neural Text To Speech Characters", found: "armRegionName eq 'centralindia' and contains(meterName,'Text To Speech')" },
  "luna:in": { service: "Foundry Models", region: "eastus2", usd: 0.2, unit: "1M", meterId: "1e606a78-a5c9-5eaf-8d82-4144957c289d",
    meterName: "5.6 luna ShortCo Inp Std Gl 1M Tokens", found: "armRegionName eq 'eastus2' and contains(meterName,'5.6')" },
  "luna:cached": { service: "Foundry Models", region: "eastus2", usd: 0.02, unit: "1M", meterId: "97d64f6e-0ace-5c93-80b2-815c38b4cfaf",
    meterName: "5.6 luna ShortCo Cd Inp Std Gl 1M Tokens", found: "armRegionName eq 'eastus2' and contains(meterName,'5.6')" },
  "luna:out": { service: "Foundry Models", region: "eastus2", usd: 1.2, unit: "1M", meterId: "0edf673f-01f3-55db-b300-3aaf436652c8",
    meterName: "5.6 luna ShortCo Opt Std Gl 1M Tokens", found: "armRegionName eq 'eastus2' and contains(meterName,'5.6')" },
  "sol:in": { service: "Foundry Models", region: "eastus2", usd: 4, unit: "1M", meterId: "f7d036c6-c2e3-5149-8ca2-7d46907199f9",
    meterName: "5.6 sol ShortCo Inp Std Gl 1M Tokens", found: "armRegionName eq 'eastus2' and contains(meterName,'5.6')" },
  "sol:cached": { service: "Foundry Models", region: "eastus2", usd: 0.4, unit: "1M", meterId: "dbcc6baf-2efc-51d1-832c-796753ab55e6",
    meterName: "5.6 sol ShortCo Cd Inp Std Gl 1M Tokens", found: "armRegionName eq 'eastus2' and contains(meterName,'5.6')" },
  "sol:out": { service: "Foundry Models", region: "eastus2", usd: 20, unit: "1M", meterId: "3b6e8e21-73bd-5697-badb-6b5618843d60",
    meterName: "5.6 sol ShortCo Opt Std Gl 1M Tokens", found: "armRegionName eq 'eastus2' and contains(meterName,'5.6')" },
});

/** Burstable SKUs the downsize may pick, and the current one (for the saving). */
export const PG_SKUS = Object.freeze({
  Standard_B1ms: { tier: "Burstable", price: "pg:Standard_B1ms" },
  Standard_B2s: { tier: "Burstable", price: "pg:Standard_B2s" },
  Standard_B2ms: { tier: "Burstable", price: "pg:Standard_B2ms" },
  Standard_B4ms: { tier: "Burstable", price: "pg:Standard_B4ms" },
  Standard_D2ds_v5: { tier: "GeneralPurpose", price: "pg:Standard_D2ds_v5" },
});
export const PG_NOW = Object.freeze({ sku: "Standard_D2ds_v5", storageGb: 64, name: "taxila-cin-pg", rg: "taxila-sin" });
/** Below this a downsize, or the VM, would not hold its service above $1 with margin. */
export const MIN_FIXED_USD_PER_DAY = 1.25;

/**
 * The VM: the cheapest x64 Linux size in centralindia at >= $1.25/day that needs no NVMe image or preview family.
 * Near misses from the same read: D2als_v6 $0.052/h = $1.248/day (just under), F1ads_v7 $0.0554/h (NVMe-only family).
 */
export const VM = Object.freeze({ size: "Standard_D2as_v5", region: "centralindia", rg: "taxila-m3-rg", name: "taxila-m3-vm", disk: "disk:E4",
  image: { publisher: "Canonical", offer: "ubuntu-24_04-lts", sku: "server", version: "latest" } });

/** $ per 1M tokens, by deployment (server/azure.js DEPLOY.fast = taxila-fast = gpt-5.6-luna, DEPLOY.brain = taxila-brain = gpt-5.6-sol). */
export const MODEL_PRICES = Object.freeze({
  "taxila-fast": { model: "gpt-5.6-luna GlobalStandard", in: PRICES["luna:in"].usd, cached: PRICES["luna:cached"].usd, out: PRICES["luna:out"].usd },
  "taxila-brain": { model: "gpt-5.6-sol GlobalStandard", in: PRICES["sol:in"].usd, cached: PRICES["sol:cached"].usd, out: PRICES["sol:out"].usd },
});

/** The keeper's three lanes: what each spends per day, and the hard cap it never passes. */
export const LANES = Object.freeze({
  models: { service: "models", targetUsd: 1.35, capUsd: 2.0 },
  tts: { service: "tools", targetUsd: 1.35, capUsd: 2.0 },
  storage: { service: "storage", targetUsd: 1.25, capUsd: 2.0 },
});

const r4 = (x) => Math.round(x * 1e4) / 1e4;
export const usdPerHourToDay = (h) => r4(h * 24);
export const usdPerMonthToDay = (m) => r4((m * 24) / HOURS_PER_MONTH);

/** $/day of the PostgreSQL server: compute at `sku` plus its provisioned storage. null for an unknown SKU. */
export function pgDailyUsd(sku, storageGb = PG_NOW.storageGb) {
  const p = PG_SKUS[sku] && PRICES[PG_SKUS[sku].price];
  if (!p) return null;
  return r4(p.usd * 24 + usdPerMonthToDay(storageGb * PRICES["pg:storage"].usd));
}
/** May `--pg-downsize sku` run? Refuses an unknown SKU, a non-Burstable one, and any below $1.25/day. */
export function pgDownsizeCheck(sku, storageGb = PG_NOW.storageGb, { min = MIN_FIXED_USD_PER_DAY } = {}) {
  const usd = pgDailyUsd(sku, storageGb);
  if (usd == null) return { ok: false, usd: null, reason: `${sku}: no verified retail price (known: ${Object.keys(PG_SKUS).join(", ")})` };
  if (PG_SKUS[sku].tier !== "Burstable") return { ok: false, usd, reason: `${sku} is ${PG_SKUS[sku].tier}, not a downsize` };
  if (usd < min) return { ok: false, usd, reason: `${sku} costs $${usd.toFixed(3)}/day with ${storageGb} GB storage, below $${min.toFixed(2)}` };
  return { ok: true, usd, reason: "" };
}
/** $/day of the VM: compute + its OS disk (the disk bills under Storage, not Virtual Machines). */
export function vmDailyUsd(size = VM.size) {
  const p = PRICES[`vm:${size}`];
  if (!p) return null;
  return { compute: usdPerHourToDay(p.usd), disk: usdPerMonthToDay(PRICES[VM.disk].usd) };
}

/**
 * The portfolio: 7 candidates for the 5 required. `match` = case-insensitive regex sources against the Cost
 * Management ServiceName (strings, so the CLI can pass them to the verify job as JSON). `kept`: fixed = a resource
 * that bills all day by existing; job = the keeper spends it daily.
 */
export const PORTFOLIO = Object.freeze([
  { id: "aca", serviceName: "Azure Container Apps", match: ["^azure container apps$"], kept: "fixed",
    how: "taxila-web runs 24 h (guard: minReplicas >= 1); the m3 jobs add a little", usdPerDay: 1.56, basis: "measured ₹150/day (ms-azure-spend-2026-10-24) at ₹96/$" },
  { id: "pg", serviceName: "Azure Database for PostgreSQL", match: ["^azure database for postgresql"], kept: "fixed",
    how: "taxila-cin-pg runs 24 h; --pg-downsize Standard_B2s cuts it", usdPerDay: pgDailyUsd(PG_NOW.sku), basis: "retail D2ds_v5 + 64 GB" },
  { id: "acr", serviceName: "Container Registry", match: ["^container registry$"], kept: "fixed",
    how: "taxilacr on Premium (Standard is $0.67/day, too low)", usdPerDay: PRICES["acr:Premium"].usd, basis: "retail Premium Registry Unit" },
  { id: "models", serviceName: "Foundry Models", match: ["^foundry models$", "^azure openai"], kept: "job", lane: "models",
    how: "m3-keeper: chat tokens on DEPLOY_FAST (taxila-fast), spend from returned usage", usdPerDay: LANES.models.targetUsd, basis: "keeper target" },
  { id: "tools", serviceName: "Foundry Tools", match: ["^foundry tools$", "^cognitive services$", "^azure ai services$"], kept: "job", lane: "tts",
    how: "m3-keeper: Speech neural TTS over REST, spend = characters x price", usdPerDay: LANES.tts.targetUsd, basis: "keeper target" },
  { id: "storage", serviceName: "Storage", match: ["^storage$"], kept: "job", lane: "storage",
    how: "m3-keeper: List Blobs calls on taxilaforge (list class), spend = operations x price", usdPerDay: LANES.storage.targetUsd, basis: "keeper target" },
  { id: "vm", serviceName: "Virtual Machines", match: ["^virtual machines$"], kept: "fixed", optional: "--vm",
    how: "taxila-m3-vm (D2as_v5, taxila-m3-rg, no public IP, no inbound rule, no auto-shutdown)", usdPerDay: vmDailyUsd().compute, basis: "retail D2as_v5 Linux" },
]);

/** The portfolio entries the verifier holds to the floor: the optional VM only when it exists. */
export const activePortfolio = ({ vm = false } = {}) => PORTFOLIO.filter((p) => !p.optional || (p.id === "vm" && vm));

// ───────────────────────────── dates (UTC, YYYY-MM-DD) ─────────────────────────────

export const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
export function dayList(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

// ───────────────────────────── Cost Management ─────────────────────────────

/** The query body: ActualCost, Daily, grouped by ServiceName, from..to inclusive. `usd` asks for the CostUSD column too. */
export function costQueryBody(from, to, { usd = true } = {}) {
  return { type: "ActualCost", timeframe: "Custom", timePeriod: { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` },
    dataset: { granularity: "Daily",
      aggregation: { totalCost: { name: "Cost", function: "Sum" }, ...(usd ? { totalCostUSD: { name: "CostUSD", function: "Sum" } } : {}) },
      grouping: [{ type: "Dimension", name: "ServiceName" }] } };
}

/**
 * Query result pages ({columns, rows}[]) → { daily: {date: {ServiceName: usd}}, currency, source }. Prefers the
 * CostUSD column; otherwise Cost in USD as is, or Cost / fx[currency] (₹96/$ measured 2026-10-24: ₹2,68,400 = $2,797).
 */
export function parseCostRows(pages, { fx = { INR: 96 } } = {}) {
  const daily = {};
  let currency = null, source = null;
  for (const pg of pages) {
    const cols = (pg.columns || []).map((c) => String(c.name).toLowerCase());
    const at = (re) => cols.findIndex((c) => re.test(c));
    const iUsd = at(/^(costusd|totalcostusd|pretaxcostusd)$/), iCost = at(/^(cost|totalcost|pretaxcost)$/);
    const iDate = at(/^usagedate$/), iSvc = at(/^servicename$/), iCur = at(/^(currency|billingcurrency)$/);
    for (const row of pg.rows || []) {
      const raw = String(row[iDate]);
      const date = /^\d{8}$/.test(raw) ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw.slice(0, 10);
      const cur = iCur >= 0 ? String(row[iCur] || "USD").toUpperCase() : "USD";
      currency = currency || cur;
      let usd;
      if (iUsd >= 0 && row[iUsd] != null) { usd = Number(row[iUsd]); source = "CostUSD"; }
      else if (cur === "USD") { usd = Number(row[iCost]); source = source || "Cost (USD)"; }
      else {
        if (!fx[cur]) throw new Error(`no USD column and no fx rate for ${cur}`);
        usd = Number(row[iCost]) / fx[cur]; source = source || `Cost / ${fx[cur]} ${cur}/USD`;
      }
      const svc = String(row[iSvc] ?? "") || "(none)";
      (daily[date] ||= {})[svc] = r4((daily[date][svc] || 0) + (Number.isFinite(usd) ? usd : 0));
    }
  }
  return { daily, currency, source };
}

/** One day's {ServiceName: usd} → per portfolio id (first matching entry wins) + what matched nothing. */
export function classify(day, portfolio = PORTFOLIO) {
  const byId = {}, names = {}, unmatched = {};
  const res = portfolio.map((p) => ({ id: p.id, re: p.match.map((s) => new RegExp(s, "i")) }));
  for (const [svc, usd] of Object.entries(day || {})) {
    const hit = res.find((p) => p.re.some((re) => re.test(svc)));
    if (!hit) { unmatched[svc] = usd; continue; }
    byId[hit.id] = r4((byId[hit.id] || 0) + usd);
    (names[hit.id] ||= []).push(svc);
  }
  return { byId, names, unmatched };
}

/**
 * The 60-day clock from per-day per-service USD. Days after asOf - openDays are not closed and are ignored.
 * streak (strict reading of the rule): the run of consecutive closed days, ending on the last closed day, over which ONE
 * set of >= `required` services stayed >= `threshold` on every day ("every workload must stay above $1 for all 60
 * days"). loose: >= `required` services each day, any services. A day with no rows counts as $0 for everything.
 * @returns {{ lastClosed: string, days: {date: string, n: number, qualifying: string[], portfolio: object}[],
 *   streak: {days: number, start: string|null, set: string[], remaining: number, completes: string|null, windowBound: boolean},
 *   loose: {days: number, start: string|null}, under: {date: string, id: string, usd: number}[] }}
 */
export function computeStreak(daily, { asOf, from = null, required = RULE.workloads, threshold = RULE.usdPerDay, openDays = ALERT.openDays,
  goal = RULE.days, portfolio = PORTFOLIO } = {}) {
  const lastClosed = addDays(asOf, -openDays);
  const first = from || Object.keys(daily).sort()[0] || null;
  const empty = { lastClosed, days: [], streak: { days: 0, start: null, set: [], remaining: goal, completes: null, windowBound: false }, loose: { days: 0, start: null }, under: [] };
  if (!first || first > lastClosed) return empty;
  const days = dayList(first, lastClosed).map((date) => {
    const s = daily[date] || {};
    const qualifying = Object.keys(s).filter((k) => s[k] >= threshold).sort();
    return { date, n: qualifying.length, qualifying, portfolio: classify(s, portfolio).byId };
  });
  let set = null, start = null, count = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const q = new Set(days[i].qualifying);
    const next = set ? [...set].filter((x) => q.has(x)) : [...q];
    if (next.length < required) break;
    set = new Set(next); start = days[i].date; count++;
  }
  let lstart = null, lcount = 0;
  for (let i = days.length - 1; i >= 0 && days[i].n >= required; i--) { lstart = days[i].date; lcount++; }
  const under = [];
  for (const d of days) for (const p of portfolio) if ((d.portfolio[p.id] || 0) < threshold) under.push({ date: d.date, id: p.id, usd: d.portfolio[p.id] || 0 });
  return { lastClosed, days,
    streak: { days: count, start, set: set ? [...set].sort() : [], remaining: Math.max(0, goal - count), completes: start ? addDays(start, goal - 1) : null,
      windowBound: count > 0 && start === days[0].date },
    loose: { days: lcount, start: lstart }, under };
}

/** Did the clock restart since the previous report? A run that only lost its oldest days to the query window did not. */
export function streakReset(prev, cur) {
  const p = prev?.streak;
  if (!p || !(p.days > 0)) return false;
  if (!cur || !(cur.days > 0)) return true;
  if (cur.start === p.start) return false;
  return !(cur.windowBound && p.start < cur.start);
}

// ───────────────────────────── the keeper's ledger ─────────────────────────────

/**
 * The ledger: one blob per UTC day, m3/ledger/YYYY-MM-DD.json:
 *   { v: 1, date, lanes: { models|tts|storage: { usd, pendingUsd, blindUsd?, calls, units: {...}, via: {...} } }, runs: [...] }
 * usd = spend the APIs reported; pendingUsd = the worst case of a batch written BEFORE it runs (write-ahead: a crash or a
 * failed write after the batch can only make the next run spend less, never twice); blindUsd = what a run spent while
 * the ledger was unreadable (from the sibling blob m3/ledger/YYYY-MM-DD.blind.json, merged in by mergeBlind).
 */
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
/** What the lane has spent today, counted conservatively (reported + pending + blind). */
export function laneSpent(ledger, id) {
  const l = ledger?.lanes?.[id];
  if (!l) return 0;
  return r4(Math.max(0, num(l.usd)) + Math.max(0, num(l.pendingUsd)) + Math.max(0, num(l.blindUsd)));
}
/** What the lane is known to have spent (reported + blind; pending is a bound, not a spend). The verifier reads this. */
export function laneReported(ledger, id) {
  const l = ledger?.lanes?.[id];
  return l ? r4(Math.max(0, num(l.usd)) + Math.max(0, num(l.blindUsd))) : 0;
}
/** Fold the blind blob's per-lane usd into the ledger as blindUsd. */
export function mergeBlind(ledger, blind) {
  const out = JSON.parse(JSON.stringify(ledger || { v: 1, lanes: {}, runs: [] }));
  out.lanes ||= {};
  for (const [id, l] of Object.entries(blind?.lanes || {})) (out.lanes[id] ||= { usd: 0, pendingUsd: 0 }).blindUsd = r4(num(l.usd) + num(l.pendingUsd));
  return out;
}

/**
 * The top-up: how many more units this lane buys today. `unitUsd` = the expected cost of one unit, `maxUnitUsd` its
 * worst case (a chat call at max_completion_tokens). Buys enough to reach the target, never so many that the worst
 * case passes the cap, and nothing once `date` is past `until`.
 * @param {object|null} ledger @param {{id: string, targetUsd: number, capUsd: number, unitUsd: number, maxUnitUsd?: number}} lane
 * @param {{date: string, until: string}} when
 */
export function unitsToBuy(ledger, lane, { date, until }) {
  if (!date || !until || date > until) return 0;
  if (!(lane.unitUsd > 0)) return 0;
  const spent = laneSpent(ledger, lane.id);
  if (spent >= lane.targetUsd - 1e-9) return 0;
  const want = Math.ceil((lane.targetUsd - spent) / lane.unitUsd - 1e-9);
  const room = Math.floor((lane.capUsd - spent) / (lane.maxUnitUsd ?? lane.unitUsd) + 1e-9);
  return Math.max(0, Math.min(want, room));
}

/** am = the 03:17 UTC run, pm = the 15:17 run. */
export const slotOf = (d) => (new Date(d).getUTCHours() < 12 ? "am" : "pm");
/**
 * What a run does given the ledger's state: readable or absent → top up what is missing; unreadable → the am run
 * spends each lane's target once without it (so a storage fault cannot zero the day), the pm run skips (so it cannot
 * spend twice).
 */
export function runMode(state, slot) {
  if (state === "ok" || state === "absent") return "topup";
  return slot === "am" ? "blind" : "skip";
}

/** $ of one chat call's reported usage ({in, cached, out} tokens) at `p` ($ per 1M). */
export function chatUsd(u, p) {
  const cached = Math.max(0, num(u?.cached));
  return Math.round(((Math.max(0, num(u?.in) - cached) * p.in + cached * p.cached + Math.max(0, num(u?.out)) * p.out) / 1e6) * 1e8) / 1e8;
}

/** Yesterday's ledger against the lane targets: missing, or the lanes that ended short. */
export function ledgerShort(ledger, lanes = LANES) {
  if (!ledger) return { missing: true, short: [] };
  const short = [];
  for (const [id, l] of Object.entries(lanes)) {
    const v = laneReported(ledger, id);
    if (v < l.targetUsd - 0.005) short.push({ lane: id, usd: v, target: l.targetUsd });
  }
  return { missing: false, short };
}

// ───────────────────────────── the verifier's verdict ─────────────────────────────

/**
 * Every reason to alert, from a computeStreak result, yesterday's ledger check and the previous report. Days before
 * `since` (the keeper's first full day) never alert; after `until` nothing alerts.
 * @returns {{ ok: boolean, reasons: {reason: string, detail: any}[], notes: string[] }}
 */
export function verifyAlerts({ result, ledger, prev, today, since = null, until = null, portfolio = PORTFOLIO,
  minServices = ALERT.minServices, floor = ALERT.portfolioFloorUsd, alertDays = ALERT.alertWindowDays } = {}) {
  const reasons = [], notes = [];
  if (until && today > until) return { ok: true, reasons, notes: [`past M3_UNTIL ${until}: not alerting`] };
  const lo = addDays(result.lastClosed, -(alertDays - 1));
  const window = result.days.filter((d) => d.date >= lo && (!since || d.date >= since));
  if (!window.length) notes.push(since ? `no closed day on or after ${since} yet` : "no closed day in the window");
  const few = window.filter((d) => d.n < minServices).map((d) => ({ date: d.date, services: d.n }));
  if (few.length) reasons.push({ reason: "services-below-min", detail: { min: minServices, days: few } });
  const low = [];
  for (const d of window) for (const p of portfolio) { const v = d.portfolio[p.id] || 0; if (v < floor) low.push({ date: d.date, id: p.id, usd: v }); }
  if (low.length) reasons.push({ reason: "portfolio-under-floor", detail: { floor, days: low } });
  const yday = addDays(today, -1);
  if (ledger && (!since || yday >= since)) {
    if (ledger.missing) reasons.push({ reason: "ledger-missing", detail: { date: yday } });
    else if (ledger.short.length) reasons.push({ reason: "ledger-short", detail: { date: yday, lanes: ledger.short } });
  }
  if (streakReset(prev, result.streak)) reasons.push({ reason: "streak-reset", detail: { was: prev.streak, now: result.streak } });
  return { ok: reasons.length === 0, reasons, notes };
}

// ───────────────────────────── Blob Shared Key (raw REST) ─────────────────────────────

/**
 * The Shared Key string-to-sign for a Blob request (version 2015-02-21+: an empty Content-Length for a zero body).
 * `path` = "/container[/blob]" as sent; `query` values unencoded. Sign it with HMAC-SHA256(base64-decoded key).
 */
export function sharedKeyStringToSign({ method, account, path, query = {}, headers = {} }) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()]));
  const len = h["content-length"] && h["content-length"] !== "0" ? h["content-length"] : "";
  const std = [method.toUpperCase(), h["content-encoding"] || "", h["content-language"] || "", len, h["content-md5"] || "", h["content-type"] || "",
    h.date || "", h["if-modified-since"] || "", h["if-match"] || "", h["if-none-match"] || "", h["if-unmodified-since"] || "", h.range || ""];
  const xms = Object.keys(h).filter((k) => k.startsWith("x-ms-")).sort().map((k) => `${k}:${h[k]}\n`).join("");
  const q = Object.keys(query).map((k) => [k.toLowerCase(), String(query[k])]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `\n${k}:${v}`).join("");
  return `${std.join("\n")}\n${xms}/${account}${path}${q}`;
}

// ───────────────────────────── money ─────────────────────────────

/**
 * The daily cost table: each service's $/day, the M3 total, and what M3 adds to today's bill. `acaUsd` = the measured
 * taxila-web day; `jobsUsd` = the two jobs' own Container Apps compute (keeper ~1 h at 0.5 vCPU/1 GiB + verify).
 */
export function dailyPlan({ vm = false, pgSku = PG_NOW.sku, acaUsd = PORTFOLIO[0].usdPerDay, jobsUsd = 0.06 } = {}) {
  const pgNow = pgDailyUsd(PG_NOW.sku), pg = pgDailyUsd(pgSku);
  const v = vmDailyUsd();
  const rows = [
    { id: "aca", usd: r4(acaUsd + jobsUsd), add: jobsUsd },
    { id: "pg", usd: pg, add: r4(pg - pgNow) },
    { id: "acr", usd: PRICES["acr:Premium"].usd, add: r4(PRICES["acr:Premium"].usd - PRICES["acr:Basic"].usd) },
    { id: "models", usd: LANES.models.targetUsd, add: LANES.models.targetUsd },
    { id: "tools", usd: LANES.tts.targetUsd, add: LANES.tts.targetUsd },
    { id: "storage", usd: r4(LANES.storage.targetUsd + (vm ? v.disk : 0)), add: r4(LANES.storage.targetUsd + (vm ? v.disk : 0)) },
    ...(vm ? [{ id: "vm", usd: v.compute, add: v.compute }] : []),
  ];
  const total = r4(rows.reduce((s, r) => s + r.usd, 0)), added = r4(rows.reduce((s, r) => s + r.add, 0));
  return { rows, total, added, total60: r4(total * RULE.days), added60: r4(added * RULE.days), services: rows.length };
}

/** When does a balance run out at `perDayUsd`? */
export function runway({ balanceUsd, fromDate, perDayUsd }) {
  const days = Math.floor(balanceUsd / perDayUsd);
  return { days, date: addDays(fromDate, days) };
}

/** The Milestone 2 clause: qualify within 180 days of business verification → the latest day the 60-day clock may start. */
export function m3Deadline(verifiedOn) {
  const deadline = addDays(verifiedOn, RULE.qualifyWithinDaysOfVerification);
  return { deadline, latestClockStart: addDays(deadline, -(RULE.days - 1)) };
}

/** An OpenSSH "ssh-rsa" public key line from an RSA public JWK (for the VM; its private half is never kept). */
export function opensshRsaPublicKey(jwk, comment = "m3-no-login") {
  const b = (s) => Buffer.from(s, "base64url");
  const mpint = (buf) => (buf[0] & 0x80 ? Buffer.concat([Buffer.from([0]), buf]) : buf);
  const str = (buf) => { const l = Buffer.alloc(4); l.writeUInt32BE(buf.length); return Buffer.concat([l, buf]); };
  return `ssh-rsa ${Buffer.concat([str(Buffer.from("ssh-rsa")), str(mpint(b(jwk.e))), str(mpint(b(jwk.n)))]).toString("base64")} ${comment}`;
}
