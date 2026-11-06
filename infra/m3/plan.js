// Milestone 3/4 credit unlock (round 7, M3 + M4; owner page docs/design/round7/M3.md): the PURE half. No I/O.
//
// Microsoft for Startups Milestone 3 ($25,000 + a 2-year extension) needs >= 5 Azure workloads, each >= $1 of spend
// EVERY day, for 60 continuous days (RULE below, read from the Learn page on 2026-11-05); Milestone 4 ($50,000) is the
// same rule with 7. We count a workload as one Cost Management ServiceName: the page does not say how Microsoft counts,
// ServiceName is our proxy.
//
// This file holds: the service portfolio (9 candidates: M4's 7 + 2 spare), every hard-coded retail price with the
// Retail Prices API filter that found it, the classification of Cost Management rows, the streak (the 60-day clock),
// the keeper's top-up, lease and closed-loop arithmetic, and the verifier's alert rules. scripts/m3.mjs imports it;
// infra/m3/vm.js holds the pure network / VM-runner / lock builders. The two in-job scripts (infra/m3/keeper-job.mjs,
// infra/m3/verify-job.mjs) run inline in a stock node image (and, for the keeper, as a file on taxila-m3-vm) and cannot
// import the repo, so they carry copies of the pieces they need; tests/m3-plan.test.mjs checks every copy against this
// file on fixtures.

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
  // M4 hardening (owner, 2026-11-06): Vyakti's GPU jobs share this credit, so a burst day is news; the credit must last
  // to the end of the 60 days plus the closing lag
  burstUsd: 60,       // a closed day whose WHOLE-subscription ActualCost passes this alerts
  burstDays: 2,       // ... looked for in the last 2 closed days (a burst is news once, not for 14 days)
  runwayMinInr: 15_000, // alert when the projected balance at M3_SINCE + runwayDays is under this (owner, 2026-11-06)
  runwayDays: 66,
  runwayAvgDays: 7,   // the projection's burn rate: the mean of the last 7 closed days, whole subscription
  secretWarnDays: 21, // alert once the service principal's secret expires within 21 days
});

/**
 * The credit as the owner read it (2026-11-06): the MCA billing profile showed ₹230,490.71 (authoritative, and the
 * conservative figure; the Startups dashboard said $4,770 of $5,000, expiring 2027-04-04). Billing currency is INR. The
 * deploy principal's secret expires 2027-03-30, after M3_UNTIL. apply passes these unless M3_BALANCE_INR /
 * M3_BALANCE_AT / M3_SP_SECRET_EXPIRES override them.
 */
export const CREDIT = Object.freeze({ balanceInr: 230_490.71, at: "2026-11-06", source: "MCA billing profile (owner, 2026-11-06 IST)", spSecretExpires: "2027-03-30" });
/** If Microsoft counts the 180 days from the sponsorship's start (2026-07-08), day 60 is due by 2027-01-04, so day 1 had to be 2026-11-06. status and the verifier report whether it counted. */
export const DAY1_CANDIDATE = "2026-11-06";

/**
 * The two milestones the verifier can hold (owner, 2026-11-06: M4). required = the rule's workload count; minServices =
 * the alert line (one spare kept); floorAlert = does a single portfolio service under the floor e-mail (M3: yes; M4: no,
 * it prints M3-WARN, because with 9 candidates and 7 required, 8 still >= $1 is "OK" by the owner's spec).
 */
export const MILESTONES = Object.freeze({
  m3: Object.freeze({ id: "m3", grantUsd: 25_000, required: 5, minServices: 6, floorAlert: true }),
  m4: Object.freeze({ id: "m4", grantUsd: 50_000, required: 7, minServices: 8, floorAlert: false }),
});

/**
 * The keeper's schedule and its safety knobs (M4 hardening, 2026-11-06). Two runners share one ledger: the ACA job
 * (eastus2) every 3 hours at :17, and taxila-m3-vm (centralindia) every 3 hours at :47 past 01, 04, ... (90 minutes
 * later). A blob lease on the day's ledger lets one spend at a time.
 */
export const KEEPER = Object.freeze({
  acaCron: "17 */3 * * *",
  vmOnCalendar: "*-*-* 01/3:47:00 UTC",
  verifyCron: "41 6,18 * * *",
  leaseSec: 60,          // the blob lease; renewed every leaseRenewMs while a run spends
  leaseRenewMs: 20_000,
  dayGuardMin: 20,       // no new batch in the last 20 minutes of a UTC day (its usage would land on the next day)
  localFallbackHour: 22, // the VM spends without the shared ledger only in its last slot (22:47) — see runMode
  raiseFloorUsd: 1.20,   // closed loop: a lane's service billed under this on the last closed day → raise today's target
  raiseMaxUsd: 2.50,     // ... to at most this
  raiseHeadroomUsd: 0.15, // ... and that day's cap becomes target + this (one batch's worst case: TTS 8 x $0.0135), so
                          // a raised lane can reach its target; the worst a raised lane can spend is $2.65
});

export const RETAIL_API = "https://prices.azure.com/api/retail/prices";
export const PRICES_CHECKED = "2026-11-06";   // every row re-read by meter id with `m3.mjs prices`: 26/26 unchanged (the M3 rows were first read 2026-11-05)
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
  // ── M4 (read 2026-11-06) ──
  // Standard LB meters are GLOBAL rows: `serviceName eq 'Load Balancer' and armRegionName eq 'centralindia'` returns
  // nothing. Cost Management agrees: capp-svc-lb (2 rules) billed 24 "Included" hours = $0.60 on each of 2026-10-30..11-05.
  "lb:included": { service: "Load Balancer", region: "Global", usd: 0.025, unit: "1 Hour", meterId: "27827eb0-7f60-4928-940b-f5fe15e7a4cb",
    meterName: "Standard Included LB Rules and Outbound Rules", found: "serviceName eq 'Load Balancer' and armRegionName eq 'Global' and skuName eq 'Standard' and priceType eq 'Consumption'" },
  "lb:overage": { service: "Load Balancer", region: "Global", usd: 0.01, unit: "1/Hour", meterId: "c36503b7-0df1-4de0-af90-ea407086432c",
    meterName: "Standard Overage LB Rules and Outbound Rules", found: "serviceName eq 'Load Balancer' and armRegionName eq 'Global' and skuName eq 'Standard' and priceType eq 'Consumption'" },
  // Cost Management agrees: Vyakti's 2 IPs billed 48 IP-hours = $0.24/day (2026-10-30..11-05)
  "pip:standard": { service: "Virtual Network", region: "centralindia", usd: 0.005, unit: "1 Hour", meterId: "9c150bf9-2bad-430e-a53c-c213804f49ef",
    productName: "IP Addresses", meterName: "Standard IPv4 Static Public IP", found: "serviceName eq 'Virtual Network' and armRegionName eq 'centralindia'" },
  // the keeper's third models fallback (taxila-ai-southindia/taxila-fast-bg = gpt-5.6-luna): the same list price as eastus2
  "lunaSin:in": { service: "Foundry Models", region: "southindia", usd: 0.2, unit: "1M", meterId: "a05ffb45-17d1-5a56-a43e-f8af27b7e7e5",
    meterName: "5.6 luna ShortCo Inp Std Gl 1M Tokens", found: "armRegionName eq 'southindia' and contains(meterName,'5.6 luna')" },
  "lunaSin:cached": { service: "Foundry Models", region: "southindia", usd: 0.02, unit: "1M", meterId: "5489ae4f-17c9-5271-931c-da4e2289dffc",
    meterName: "5.6 luna ShortCo Cd Inp Std Gl 1M Tokens", found: "armRegionName eq 'southindia' and contains(meterName,'5.6 luna')" },
  "lunaSin:out": { service: "Foundry Models", region: "southindia", usd: 1.2, unit: "1M", meterId: "d01c83fd-4a6c-5c28-b962-9e3de99eb4cd",
    meterName: "5.6 luna ShortCo Opt Std Gl 1M Tokens", found: "armRegionName eq 'southindia' and contains(meterName,'5.6 luna')" },
  // the keeper's TTS fallback region (taxila-ai-swc): the same S1 neural meter; southindia sells no neural TTS row (0 rows)
  "tts:neural-swc": { service: "Foundry Tools", region: "swedencentral", usd: 15, unit: "1M", meterId: "0f98e708-a16c-407b-8089-a0ed9e14ab49",
    meterName: "S1 Neural Text To Speech Characters", found: "meterId eq '0f98e708-a16c-407b-8089-a0ed9e14ab49' (34 regions; not southindia)" },
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

/**
 * Verified GlobalStandard prices by (model, region), for the third models fallback on a Taxila-owned account
 * (taxila-ai-*). Only rows read from the Retail Prices API; a deployment whose (model, region) is not here is never used.
 */
export const MODEL_PRICES_BY_REGION = Object.freeze({
  "gpt-5.6-luna@eastus2": { in: PRICES["luna:in"].usd, cached: PRICES["luna:cached"].usd, out: PRICES["luna:out"].usd },
  "gpt-5.6-sol@eastus2": { in: PRICES["sol:in"].usd, cached: PRICES["sol:cached"].usd, out: PRICES["sol:out"].usd },
  "gpt-5.6-luna@southindia": { in: PRICES["lunaSin:in"].usd, cached: PRICES["lunaSin:cached"].usd, out: PRICES["lunaSin:out"].usd },
});

/**
 * The third models fallback: from `accounts` ([{name, location, deployments: [{name, format, model, sku, state, chat}]}])
 * pick a chat deployment on a taxila-ai-* account whose (model, region) has a verified price. Background twins (*-bg)
 * first (they exist so background spend does not queue behind live traffic), then the cheaper model. null = none. PURE.
 */
export function pickModelsFallback2(accounts, { exclude = [] } = {}) {
  const c = [];
  for (const a of accounts || []) {
    if (!/^taxila-ai-/.test(a.name)) continue;
    for (const d of a.deployments || []) {
      const price = MODEL_PRICES_BY_REGION[`${d.model}@${a.location}`];
      if (!price || !d.chat || d.state !== "Succeeded" || d.format !== "OpenAI" || exclude.includes(`${a.name}/${d.name}`)) continue;
      c.push({ account: a.name, region: a.location, deployment: d.name, model: d.model, price, rank: [/-bg$/.test(d.name) ? 0 : 1, price.out] });
    }
  }
  c.sort((x, y) => x.rank[0] - y.rank[0] || x.rank[1] - y.rank[1] || (x.account + x.deployment).localeCompare(y.account + y.deployment));
  if (!c.length) return null;
  const { rank, ...best } = c[0];
  return { ...best, endpoint: `https://${best.account}.openai.azure.com/openai/v1` };
}

/** The two spare services' resources (owner-approved 2026-11-06), both in taxila-m3-rg next to the VM. */
export const LB = Object.freeze({ name: "taxila-m3-lb", rg: VM.rg, region: VM.region, subnet: "lb", subnetPrefix: "10.73.0.64/27", rules: 8, firstPort: 10001,
  probePort: 22 });
export const PIPS = Object.freeze({ prefix: "taxila-m3-pip-", count: 11, rg: VM.rg, region: VM.region, onNic: 1 });
/** $/day of a Standard LB with `rules` load-balancing rules: the first 5 at one flat rate, each extra one on top. */
export function lbDailyUsd(rules = LB.rules) {
  if (!(rules > 0)) return 0;
  return r4((PRICES["lb:included"].usd + Math.max(0, rules - 5) * PRICES["lb:overage"].usd) * 24);
}
/** $/day of `n` Standard static IPv4 public IPs (billed per IP-hour whether or not attached: see the M4 assumptions). */
export const pipsDailyUsd = (n = PIPS.count) => r4(n * PRICES["pip:standard"].usd * 24);

/** Node on taxila-m3-vm (the second keeper runner): the official tarball, pinned by sha256 (nodejs.org SHASUMS256.txt, 2026-11-06). */
export const NODE = Object.freeze({ version: "v22.23.4", file: "node-v22.23.4-linux-x64.tar.gz",
  sha256: "b8492284c76a54baf58d61668dd0e41ee0fc98adabf9503d30f05d08f55b4406" });

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
    how: "taxila-m3-vm (D2as_v5, taxila-m3-rg, no inbound rule, no auto-shutdown; also the keeper's second runner)", usdPerDay: vmDailyUsd().compute, basis: "retail D2as_v5 Linux" },
  { id: "lb", serviceName: "Load Balancer", match: ["^load balancer$"], kept: "fixed", optional: "lb",
    how: "taxila-m3-lb: Standard internal LB, 8 TCP rules, taxila-m3-vm's NIC in its pool (alone >= $1.25; taxila-sin-env's LB adds $0.60)", usdPerDay: lbDailyUsd(), basis: "retail Standard: 5 included + 3 overage rules" },
  { id: "vnet", serviceName: "Virtual Network", match: ["^virtual network$"], kept: "fixed", optional: "pips",
    how: "11 Standard static IPv4 public IPs in taxila-m3-rg, one on the VM's NIC (its outbound); alone >= $1.25 (Vyakti's 2 add $0.24)", usdPerDay: pipsDailyUsd(), basis: "retail Standard IPv4 Static Public IP" },
]);

/** The portfolio entries the verifier holds to the floor: each optional one only when it exists (or is being created). */
export const activePortfolio = ({ vm = false, lb = false, vnet = false } = {}) => PORTFOLIO.filter((p) => !p.optional || ({ vm, lb, vnet })[p.id] === true);

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
  const daily = {}, billing = {};
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
      const c = Number(row[iCost]);
      if (iCost >= 0 && Number.isFinite(c)) billing[date] = r4((billing[date] || 0) + c);
    }
  }
  return { daily, currency, source, billing };
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
    const total = r4(Object.values(s).reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0));
    return { date, n: qualifying.length, qualifying, portfolio: classify(s, portfolio).byId, total };
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
 * The ledger: one blob per UTC day, m3-ledger/ledger/YYYY-MM-DD.json, written only under a blob lease (M4):
 *   { v: 2, date, lanes: { models|tts|storage: { usd, pendingUsd, orphanUsd?, offlineUsd?, blindUsd?, calls, units, via,
 *     viaCalls } }, targets: { lane: {target, cap, raise?} }, runs: [{ id, runner, mode, at, end, ok, lanes, alerts }] }
 * usd = spend the APIs reported; pendingUsd = the worst case of a batch written BEFORE it runs (write-ahead: a crash or a
 * failed write after the batch can only make the next run spend less, never twice); orphanUsd = pending left by a run
 * that died (the next lease holder adopts it: still counted, never resolved); offlineUsd = what taxila-m3-vm spent in
 * its local fallback while the shared ledger was out of reach (folded in when it is back); blindUsd = the v1 keeper's
 * blind spend (the sibling blob ledger/YYYY-MM-DD.blind.json, merged in by mergeBlind; v2 never writes one).
 * seenUsd exists only in the VM's local offline ledger: what the shared ledger showed at the VM's last sight of it.
 */
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
/** What the lane has spent today, counted conservatively (reported + pending + orphans + offline + blind + seen). */
export function laneSpent(ledger, id) {
  const l = ledger?.lanes?.[id];
  if (!l) return 0;
  return r4(Math.max(0, num(l.usd)) + Math.max(0, num(l.pendingUsd)) + Math.max(0, num(l.blindUsd)) + Math.max(0, num(l.orphanUsd))
    + Math.max(0, num(l.offlineUsd)) + Math.max(0, num(l.seenUsd)));
}
/** What the lane is known to have spent (reported + blind + offline; pending and orphans are bounds, not spend). The verifier reads this. */
export function laneReported(ledger, id) {
  const l = ledger?.lanes?.[id];
  return l ? r4(Math.max(0, num(l.usd)) + Math.max(0, num(l.blindUsd)) + Math.max(0, num(l.offlineUsd))) : 0;
}
/**
 * A new lease holder's view: every lane's pendingUsd belongs to a run that is gone (it held the lease, and now we do),
 * so it moves to orphanUsd, still counted by laneSpent. Without this the next write-ahead would overwrite it.
 */
export function adoptOrphans(ledger) {
  const out = JSON.parse(JSON.stringify(ledger || { v: 2, lanes: {}, runs: [] }));
  out.lanes ||= {};
  for (const l of Object.values(out.lanes)) {
    const p = Math.max(0, num(l.pendingUsd));
    if (p > 0) { l.orphanUsd = r4(Math.max(0, num(l.orphanUsd)) + p); l.pendingUsd = 0; }
  }
  return out;
}
/** What the VM's local offline ledger holds as its own spend for a lane (never seenUsd: that is the shared ledger's). */
export function offlineSpent(off, id) {
  const l = off?.lanes?.[id];
  return l ? r4(Math.max(0, num(l.usd)) + Math.max(0, num(l.pendingUsd)) + Math.max(0, num(l.orphanUsd))) : 0;
}
/** Fold the VM's offline spend into the shared ledger: offlineUsd = the larger of what is there and the local total (idempotent). */
export function foldOffline(ledger, off) {
  const out = JSON.parse(JSON.stringify(ledger || { v: 2, lanes: {}, runs: [] }));
  out.lanes ||= {};
  for (const id of Object.keys(off?.lanes || {})) {
    const v = offlineSpent(off, id);
    if (v > 0) (out.lanes[id] ||= { usd: 0, pendingUsd: 0 }).offlineUsd = r4(Math.max(num(out.lanes[id].offlineUsd), v));
  }
  return out;
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

/** Minutes left in the UTC day of `d` (a Date or ISO string). The keeper starts no batch when fewer than KEEPER.dayGuardMin remain. */
export const minutesToMidnight = (d) => (86_400_000 - (new Date(d).getTime() % 86_400_000)) / 60_000;
/**
 * What a run does given the shared ledger's state (M4: two runners, a lease, 16 runs a day):
 *   ok | absent → "topup" (the first run of the day spends to target, later runs only what is missing)
 *   held        → "wait"  (another runner holds the lease and is spending; this run does nothing)
 *   corrupt     → "skip"  (it exists, so something may have been spent: never guess; M3-ALERT)
 *   unreachable | auth → "local" for the VM runner in its last slot of the day (hour >= fallbackHour), else "skip".
 * Why only the VM, and only late: the ACA runner never spends without a write-ahead to the shared ledger, so if the
 * ledger is really down nobody else has spent since the VM last saw it, and the VM's local spend (counted against that
 * last sight) is the day's only spend. The one double-spend left is a one-sided partition (the VM cannot reach the
 * ledger while ACA can) lasting to 22:47: bounded by each lane's target, alerted (runner-missing), see M3.md §9.
 */
export function runMode(state, { runner = "aca", hour = 0, fallbackHour = 22 } = {}) {
  if (state === "ok" || state === "absent") return "topup";
  if (state === "held") return "wait";
  if ((state === "unreachable" || state === "auth") && runner === "vm" && hour >= fallbackHour) return "local";
  return "skip";
}

/**
 * Closed-loop targets (M4): today's {target, cap} per lane. A lane whose Cost Management service billed under
 * `floorUsd` on the latest report's last closed day (on or after `since`) is raised by target/actual — so the next bill
 * lands back on the planned target, not just the floor — capped at `maxUsd`; the cap rises to target + `headroomUsd`
 * (never below the base cap), because the keeper never lets a batch's worst case pass the cap and so could not reach a
 * target equal to it.
 * `prev` = the targets already recorded in today's ledger: a day's raise never drops, so every run of a day agrees.
 * `service` maps a lane to its portfolio id in the report. PURE.
 * @param {{ base: Record<string, {targetUsd: number, capUsd: number}>, report?: object|null, prev?: object|null, since?: string|null,
 *   floorUsd?: number, maxUsd?: number, service?: Record<string, string> }} o
 */
export function laneTargets({ base, report = null, prev = null, since = null, floorUsd = 1.2, maxUsd = 2.5, headroomUsd = 0.15, service = { models: "models", tts: "tools", storage: "storage" } }) {
  const out = {};
  const day = (report?.days || []).find((d) => d.date === report.lastClosed) || null;
  const usable = !!day && (!since || day.date >= since);
  for (const [id, b] of Object.entries(base || {})) {
    let target = num(b.targetUsd), cap = num(b.capUsd), raise = null;
    const actual = usable && service[id] ? Math.max(0, num(day.portfolio?.[service[id]])) : null;
    if (actual != null && actual < floorUsd) {
      const to = Math.min(maxUsd, Math.max(target, actual > 0 ? (target * target) / actual : maxUsd));
      raise = { from: target, to: Math.round(to * 100) / 100, actual, day: day.date, report: report.date || null,
        why: `${service[id]} billed $${actual} on ${day.date}, under $${floorUsd}: target x ${(target / Math.max(actual, 1e-9)).toFixed(2)}, capped at $${maxUsd}` };
      target = raise.to;
      cap = Math.max(cap, Math.round((target + headroomUsd) * 100) / 100);
    }
    const p = prev?.[id];
    if (p && num(p.target) > target) { target = num(p.target); cap = Math.max(cap, num(p.cap)); raise = p.raise || raise; }
    out[id] = { target, cap, ...(raise ? { raise } : {}) };
  }
  return out;
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
/**
 * Yesterday's ledger runs: which runners wrote to it (a v1 run has no runner: it was the ACA job), and every alert a
 * run recorded (the VM's M3-ALERT lines go to its journal, not to Log Analytics, so the verifier re-raises them).
 */
export function ledgerRuns(ledger) {
  const runs = Array.isArray(ledger?.runs) ? ledger.runs : [];
  const runners = [...new Set(runs.map((r) => r?.runner || "aca"))].sort();
  const seen = new Set(), alerts = [];
  for (const r of runs) for (const a of Array.isArray(r?.alerts) ? r.alerts : []) {
    const k = `${r.runner || "aca"}|${a.reason}|${a.lane || ""}|${a.endpoint || ""}`;
    if (!seen.has(k)) { seen.add(k); alerts.push({ runner: r.runner || "aca", ...a }); }
  }
  return { runners, alerts };
}

/**
 * The credit runway: the balance projected to `endDate` from an owner-entered balance on `balanceAt` (the start of that
 * day: the conservative reading), minus every closed day's whole-subscription spend from then on as Cost Management
 * reports it, minus the mean of the last `avgDays` closed days for every day after (open days and the future). One
 * currency throughout: the verifier passes INR (the billing currency) for both the balance and the days. PURE.
 * @param {{ balance: number, balanceAt: string, endDate: string, days: {date: string, total: number}[], lastClosed: string, avgDays?: number }} o
 */
export function projectBalance({ balance, balanceAt, endDate, days, lastClosed, avgDays = 7 }) {
  const closed = (days || []).filter((d) => d.date <= lastClosed);
  const recent = closed.slice(-avgDays);
  const avg = recent.length ? recent.reduce((s, d) => s + num(d.total), 0) / recent.length : 0;
  const byDate = Object.fromEntries(closed.map((d) => [d.date, num(d.total)]));
  let known = 0, estimated = 0, knownDays = 0, estDays = 0;
  for (let d = balanceAt; d <= endDate; d = addDays(d, 1)) {
    if (d <= lastClosed && d in byDate) { known += byDate[d]; knownDays++; } else { estimated += avg; estDays++; }
  }
  return { projected: r4(num(balance) - known - estimated), endDate, avgPerDay: r4(avg), known: r4(known), knownDays, estimated: r4(estimated), estDays };
}

// ───────────────────────────── the verifier's verdict ─────────────────────────────

/**
 * Every reason to alert, from a computeStreak result, yesterday's ledger check and the previous report. Days before
 * `since` (the keeper's first full day) never alert; after `until` nothing alerts.
 * M4 additions (all optional, so the M3 call is unchanged): floorAlert=false turns a portfolio service under the floor
 * into a warning (M3-WARN, no e-mail); runs = ledgerRuns(yesterday) with runners = {expected, since} → runner-missing,
 * and the runs' recorded auth failures → keeper-auth-failed; burstUsd/burstDays → burst (whole-subscription ActualCost
 * of a recent closed day); runway = projectBalance(...) with runwayMin (same currency) → runway-low; secretExpires
 * (YYYY-MM-DD) within secretWarnDays → sp-secret-expiring, checked even after `until` (the principal outlives the clock).
 * @returns {{ ok: boolean, reasons: {reason: string, detail: any}[], warnings: {reason: string, detail: any}[], notes: string[] }}
 */
export function verifyAlerts({ result, ledger, prev, today, since = null, until = null, portfolio = PORTFOLIO,
  minServices = ALERT.minServices, floor = ALERT.portfolioFloorUsd, alertDays = ALERT.alertWindowDays, floorAlert = true,
  runs = null, runners = null, burstUsd = null, burstDays = ALERT.burstDays, runway = null, runwayMin = ALERT.runwayMinInr,
  secretExpires = null, secretWarnDays = ALERT.secretWarnDays } = {}) {
  const reasons = [], warnings = [], notes = [];
  if (secretExpires && today >= addDays(secretExpires, -secretWarnDays)) {
    reasons.push({ reason: "sp-secret-expiring", detail: { expires: secretExpires, daysLeft: Math.round((Date.parse(`${secretExpires}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000) } });
  }
  if (until && today > until) return { ok: reasons.length === 0, reasons, warnings, notes: [`past M3_UNTIL ${until}: not alerting on the clock`] };
  const lo = addDays(result.lastClosed, -(alertDays - 1));
  const window = result.days.filter((d) => d.date >= lo && (!since || d.date >= since));
  if (!window.length) notes.push(since ? `no closed day on or after ${since} yet` : "no closed day in the window");
  const few = window.filter((d) => d.n < minServices).map((d) => ({ date: d.date, services: d.n }));
  if (few.length) reasons.push({ reason: "services-below-min", detail: { min: minServices, days: few } });
  const low = [];
  for (const d of window) for (const p of portfolio) { const v = d.portfolio[p.id] || 0; if (v < floor) low.push({ date: d.date, id: p.id, usd: v }); }
  if (low.length) (floorAlert ? reasons : warnings).push({ reason: "portfolio-under-floor", detail: { floor, days: low } });
  const yday = addDays(today, -1);
  if (ledger && (!since || yday >= since)) {
    if (ledger.missing) reasons.push({ reason: "ledger-missing", detail: { date: yday } });
    else if (ledger.short.length) reasons.push({ reason: "ledger-short", detail: { date: yday, lanes: ledger.short } });
  }
  if (runs && (!since || yday >= since)) {
    if (runners?.expected?.length && (!runners.since || yday >= runners.since)) {
      const gone = runners.expected.filter((r) => !runs.runners.includes(r));
      if (gone.length) reasons.push({ reason: "runner-missing", detail: { date: yday, runners: gone, seen: runs.runners } });
    }
    const auth = runs.alerts.filter((a) => a.reason === "auth-failed");
    if (auth.length) reasons.push({ reason: "keeper-auth-failed", detail: { date: yday, alerts: auth } });
  }
  if (burstUsd != null) {
    const hot = result.days.filter((d) => d.date > addDays(result.lastClosed, -burstDays) && d.total > burstUsd).map((d) => ({ date: d.date, usd: d.total }));
    if (hot.length) reasons.push({ reason: "burst", detail: { overUsd: burstUsd, days: hot } });
  }
  if (runway && runway.projected < runwayMin) reasons.push({ reason: "runway-low", detail: { min: runwayMin, ...runway } });
  if (streakReset(prev, result.streak)) reasons.push({ reason: "streak-reset", detail: { was: prev.streak, now: result.streak } });
  return { ok: reasons.length === 0, reasons, warnings, notes };
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
export function dailyPlan({ vm = false, lb = false, vnet = false, pgSku = PG_NOW.sku, acaUsd = PORTFOLIO[0].usdPerDay, jobsUsd = 0.06 } = {}) {
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
    ...(lb ? [{ id: "lb", usd: lbDailyUsd(), add: lbDailyUsd() }] : []),
    ...(vnet ? [{ id: "vnet", usd: pipsDailyUsd(), add: pipsDailyUsd() }] : []),
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

// ── alerts (round 7 platform review, 2026-11-05) ──

/**
 * The "verifier silent" rule's query, armed at `armedAt` (ISO). Before armed-at + 26 h it reports n = 1 (healthy): the
 * verifier has not had a day to log its first M3-OK yet, so the owner never gets a false alarm on day one. `apply` stores
 * armed-at in the rule's `m3-armed-at` tag and reuses it on every re-apply, so the query (and its spec hash) stay stable.
 * PURE. @param {string} armedAt
 */
export function silentQuery(armedAt) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(String(armedAt))) throw new Error(`m3-armed-at must be an ISO UTC second, got ${armedAt}`);
  return `let armed = datetime(${armedAt}); ContainerAppConsoleLogs_CL | where TimeGenerated > ago(26h) | where ContainerJobName_s == "m3-verify" and Log_s startswith "M3-OK" | summarize n = count() | extend n = iff(now() < armed + 26h, 1, n)`;
}

/** An ISO UTC second for "now" (the armed-at format). PURE given the clock. */
export const armedNow = (d = new Date()) => d.toISOString().slice(0, 19) + "Z";

/** M3_ALERT_EMAIL → the distinct addresses, in order (comma- or semicolon-separated; case-insensitive duplicates dropped). PURE. */
export function alertEmails(raw) {
  const out = [], seen = new Set();
  for (const e of String(raw || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean)) {
    if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(e)) throw new Error("M3_ALERT_EMAIL holds an entry that is not an email address");
    if (!seen.has(e.toLowerCase())) { seen.add(e.toLowerCase()); out.push(e); }
  }
  return out;
}

/**
 * The action group: whoever holds Owner on the subscription (directly assigned), plus one email receiver per address
 * in M3_ALERT_EMAIL (comma-separated) for owners who hold Owner through a group (armRoleReceivers reach direct
 * assignments only). The first receiver keeps the M3 name "m3-alert-email" (so a one-address group is unchanged);
 * the rest are m3-alert-email-2, -3, ... The addresses come from the environment at apply time, never from code. PURE.
 * @param {{ ownerRole: string, email?: string, tags?: object }} o
 */
export function actionGroupBody({ ownerRole, email = "", tags = {} }) {
  const list = alertEmails(email);
  return { location: "Global", tags, properties: { groupShortName: "m3owner", enabled: true,
    armRoleReceivers: [{ name: "subscription-owner", roleId: ownerRole, useCommonAlertSchema: true }],
    emailReceivers: list.map((e, i) => ({ name: i ? `m3-alert-email-${i + 1}` : "m3-alert-email", emailAddress: e, useCommonAlertSchema: true })) } };
}

/** Does a live action group already match the desired one (enabled, the Owner receiver, exactly the desired SET of emails)? PURE. */
export function actionGroupMatches(live, want) {
  const emails = (g) => [...new Set((g?.properties?.emailReceivers || []).map((r) => String(r.emailAddress).trim().toLowerCase()))].sort().join(",");
  return !!live?.properties?.enabled
    && (live.properties.armRoleReceivers || []).some((r) => r.roleId === want.properties.armRoleReceivers[0].roleId)
    && emails(live) === emails(want);
}
