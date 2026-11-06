// Milestone 3/4 credit unlock: the operator CLI (round 7, M3 + M4 hardening; owner page docs/design/round7/M3.md;
// pure halves infra/m3/plan.js and infra/m3/vm.js). DRY RUN BY DEFAULT: `apply` prints exactly what it would create or
// change; `--apply` does it. Every step GETs first and PUTs/PATCHes only on a diff. Nothing is ever deleted (owner rule).
//
//   node scripts/m3.mjs plan                     the daily and 60-day cost table, credit runway (pure; no Azure)
//   node scripts/m3.mjs prices                   re-read every hard-coded price from the Retail Prices API (public, no
//                                                auth); exit 1 on drift
//   node scripts/m3.mjs status [--days 66]       Cost Management by service, the 60-day clock, yesterday's keeper ledger,
//                                                the credit balance if readable (read-only)
//   node scripts/m3.mjs apply [--only s1,s2] [--apply] [flags]
//
// apply steps, in order (all by default; --only picks some):
//   guard        taxila-web keeps minReplicas >= 1 (read-only: scripts/deploy-azure.mjs owns the app)
//   image        ACR importImage docker.io/library/node:22-slim → taxilacr m3/node:22-slim (daily runs never touch Docker
//                Hub; NoForce, so a present tag is kept; --refresh-image re-imports)
//   acr          taxilacr SKU → Premium ($1.67/day; Standard is $0.67, too low)
//   container    a private blob container `m3-ledger` in $AZURE_STORAGE_ACCOUNT (the keeper's ledger, the verifier's reports)
//   vm           (only with --vm) taxila-m3-vm, Standard_D2as_v5 Linux in centralindia, resource group taxila-m3-rg, no
//                inbound rule, no auto-shutdown ($1.33/day + its disk under Storage)
//   jobs         ACA jobs m3-keeper (cron "17 */3 * * *") and m3-verify ("41 6,18 * * *", --milestone m4 by default:
//                7 required, alert under 8) in $AZURE_CONTAINERAPPS_ENV: image from taxilacr with taxila-web's registry
//                credential, keys in the job's secret store, replicaRetryLimit 2, 0.5 / 0.25 vCPU
//   actiongroup  m3-owner: the subscription's Owner role + one email receiver per M3_ALERT_EMAIL address (comma-separated)
//   alerts       scheduled query rules on the environment's Log Analytics workspace: any M3-ALERT line; no M3-OK in 26 h
//   pips         (M4) 11 Standard static IPv4 public IPs in taxila-m3-rg ($1.32/day on Virtual Network); pip-01 on the
//                VM's NIC gives it outbound; refuses unless taxila-m3-nsg denies internet inbound
//   lb           (M4) taxila-m3-lb: Standard internal LB on subnet `lb`, 8 TCP rules ($1.32/day on Load Balancer), the
//                VM's NIC in its pool
//   runner       (M4) the keeper's second runner on taxila-m3-vm over Run Command (no SSH): Node (sha256-pinned), the
//                keeper, a systemd timer at :47 past 01, 04, ... UTC, its env in a root-only file
//   locks        (M4) CanNotDelete locks on taxila-m3-rg, taxilacr, taxilaforge, taxila-cin-pg, taxila-env and the Speech
//                account; when the principal may not (Contributor), the exact portal / Cloud Shell steps for the owner
// Owner-gated, OFF unless passed:
//   --vm                 create or check taxila-m3-vm (the vm step above)
//   --pg-downsize SKU    taxila-cin-pg → a Burstable SKU; refuses any SKU whose compute + storage < $1.25/day
// Other flags: --since D (first day the verifier alerts on; default: the job's current value, else tomorrow UTC),
//   --until D (default 2027-01-31; the keeper spends nothing after it), --milestone m3|m4 (default m4), --models-deployment
//   NAME (default $DEPLOY_FAST or taxila-fast), --models-fallback NAME (default $DEPLOY_BRAIN or taxila-brain),
//   --models-fallback2 ACCOUNT/DEPLOYMENT|none (default: discovered on taxila-ai-*), --speech-fallback ACCOUNT|none
//   (default: a taxila-ai-* account in another priced TTS region), --models-price in,cached,out (for a deployment not in
//   plan.js), --vm-size SIZE, --start-now (with --apply: start one keeper run right after the jobs).
//
// Needs (in .env.local or the environment; never printed): AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID,
// AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, AZURE_CONTAINERAPPS_ENV, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
// AZURE_SPEECH_REGION_SIN + AZURE_SPEECH_KEY_SIN and/or AZURE_SPEECH_REGION + AZURE_SPEECH_KEY, AZURE_STORAGE_ACCOUNT
// (+ AZURE_STORAGE_KEY, else read with listKeys). Optional: M3_VERIFY_SP_CLIENT_ID / M3_VERIFY_SP_SECRET (a separate
// read-only principal for the verify job), M3_ALERT_EMAIL (comma-separated), M3_BALANCE_INR + M3_BALANCE_AT (the credit
// balance in the billing currency and the day it was read, for the verifier's runway alert; default the owner's
// 2026-11-06 reading, plan.js CREDIT), M3_SP_SECRET_EXPIRES (default 2027-03-30). Run under NODE_USE_ENV_PROXY=1 here.
import { readFileSync } from "fs";
import { gzipSync } from "zlib";
import { createHash, createHmac, generateKeyPairSync } from "crypto";
import { RG_PATH, SUB_PATH, arm, loadEnv, sleep, until } from "../infra/azure.mjs";
import * as P from "../infra/m3/plan.js";
import * as V from "../infra/m3/vm.js";

if (!process.env.M3_NO_DOTENV) loadEnv();   // tests run the CLI hermetically (M3_NO_DOTENV=1)
const argv = process.argv.slice(2);
const CMD = argv[0];
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const E = process.env;
const DRY = !flag("--apply");
const CREDS = ["AZURE_SP_CLIENT_ID", "AZURE_SP_SECRET", "AZURE_TENANT_ID", "AZURE_SUBSCRIPTION_ID"].every((k) => E[k]);
const today = () => new Date().toISOString().slice(0, 10);
const usd = (x) => (x == null ? "-" : `${x < 0 ? "-" : ""}$${Math.abs(Number(x)).toFixed(Math.abs(x) < 10 ? 2 : 1)}`);

const N = {
  web: "taxila-web", env: E.AZURE_CONTAINERAPPS_ENV || "taxila-env", registry: "taxilacr", image: "m3/node:22-slim", source: "library/node:22-slim",
  sa: E.AZURE_STORAGE_ACCOUNT || "taxilaforge", container: "m3-ledger", keeper: "m3-keeper", verify: "m3-verify", ag: "m3-owner",
  pg: E.M3_PG_NAME || P.PG_NOW.name, pgRg: E.M3_PG_RG || P.PG_NOW.rg,
};
const API = { aca: "2024-03-01", acr: "2023-07-01", st: "2023-01-01", insights: "2023-01-01", sqr: "2023-03-15-preview", ws: "2022-10-01",
  pg: "2024-08-01", net: "2023-11-01", vm: "2024-07-01", rg: "2021-04-01", cog: "2024-10-01", locks: "2020-05-01", perms: "2022-04-01" };
const OWNER_ROLE = "8e3af657-a8ff-443c-a75c-2fe8c4bcb635";   // built-in "Owner"
const CRON = { keeper: P.KEEPER.acaCron, verify: P.KEEPER.verifyCron };
const MILESTONE = P.MILESTONES[opt("--milestone", "m4")];
if (!MILESTONE) { console.error("--milestone: m3 or m4"); process.exit(2); }
const DEFAULT_UNTIL = "2027-01-31";
const TAGS = { project: "taxila", purpose: "m3-credit-unlock" };
const sha = (s) => createHash("sha256").update(s).digest("hex");

const say = (step, msg) => console.log(`[${step}] ${msg}`);
/** In a dry run, say what would happen; with --apply, say it and do it. */
async function act(step, what, fn) {
  if (DRY) { say(step, `WOULD ${what}`); return null; }
  say(step, what);
  return fn();
}

// ───────────────────────────── retail prices (public) ─────────────────────────────

async function retail(filter) {
  const items = [];
  let url = `${P.RETAIL_API}?$filter=${encodeURIComponent(filter)}`;
  for (let i = 0; url && i < 20; i++) {
    let j = null;
    for (let k = 0; k < 4 && !j?.Items; k++) {   // the public API throttles bursts (429) and drops the odd connection
      if (k) await sleep(3000 * k);
      // a throttled reply (429) is plain text: its parse error must reach the retry, not escape it (2026-11-06)
      j = await fetch(url, { signal: AbortSignal.timeout(30_000) }).then((r) => r.json().catch(() => ({ error: `http ${r.status}` })), (e) => ({ error: e.message }));
    }
    if (!j.Items) throw new Error(`retail prices: ${JSON.stringify(j).slice(0, 200)}`);
    items.push(...j.Items);
    url = j.NextPageLink;
  }
  return items;
}
/** The live retail price of a PRICES row (by meter id + region; tier 0 of a tiered meter). */
async function livePrice(key) {
  const p = P.PRICES[key];
  const items = (await retail(`meterId eq '${p.meterId}' and armRegionName eq '${p.region}' and priceType eq 'Consumption'`))
    .filter((i) => (!p.productName || i.productName === p.productName) && (!p.meterName || i.meterName === p.meterName) && !(i.tierMinimumUnits > 0));
  return items.length ? items[0].retailPrice : null;
}

async function prices() {
  let drift = 0;
  console.log(`hard-coded prices (infra/m3/plan.js, checked ${P.PRICES_CHECKED}) vs the Retail Prices API now:`);
  for (const [key, p] of Object.entries(P.PRICES)) {
    const live = await livePrice(key).catch((e) => `error ${e.message.slice(0, 60)}`);
    const ok = live === p.usd;
    if (!ok) drift++;
    console.log(`  ${ok ? "ok   " : "DRIFT"} ${key.padEnd(22)} ${String(p.usd).padStart(8)} → ${String(live).padStart(8)}  ${p.unit.padEnd(11)} ${p.service} · ${p.region}`);
  }
  console.log(drift ? `${drift} price(s) moved: update infra/m3/plan.js (and the keeper's env via apply)` : "all prices unchanged");
  return drift ? 1 : 0;
}

// ───────────────────────────── plan (pure) ─────────────────────────────

function plan() {
  const label = Object.fromEntries(P.PORTFOLIO.map((p) => [p.id, p.serviceName]));
  const combos = [["6 services", { vm: false }], ["6 services + PG on B2s", { vm: false, pgSku: "Standard_B2s" }], ["7 services (--vm)", { vm: true }],
    ["7 services (--vm) + PG on B2s", { vm: true, pgSku: "Standard_B2s" }],
    ["9 services (M4: --vm, lb, pips) + PG on B2s", { vm: true, lb: true, vnet: true, pgSku: "Standard_B2s" }]];
  for (const [name, o] of combos) {
    const d = P.dailyPlan(o);
    console.log(`\n${name}: ${usd(d.total)}/day, ${usd(d.total60)} over 60 days; M3 adds ${usd(d.added)}/day (${usd(d.added60)} over 60 days)`);
    for (const r of d.rows) console.log(`  ${label[r.id].padEnd(32)} ${usd(r.usd).padStart(7)}/day  (${r.add >= 0 ? "+" : ""}${usd(r.add)} vs today)`);
  }
  // HANDOFF.md §6: ~$2,200 left on 2026-10-24, ~$17/day fixed across the subscription's projects
  const fixed = Number(opt("--fixed", 17)), bal = Number(opt("--balance", 2200)), at = opt("--balance-on", "2026-10-24"), start = opt("--start", "2026-11-07");
  const atStart = bal - fixed * P.daysBetween(at, start);
  const completes = P.addDays(start, P.RULE.days - 1);
  console.log(`\ncredit: ~$${bal} on ${at} at ~$${fixed}/day fixed → ~$${atStart.toFixed(0)} on ${start}; a clock starting ${start} completes ${completes}. No burst testing assumed:`);
  for (const [name, o] of combos) {
    const d = P.dailyPlan(o), r = P.runway({ balanceUsd: atStart, fromDate: start, perDayUsd: fixed + d.added });
    const left = atStart - (fixed + d.added) * P.RULE.days;
    console.log(`  ${name.padEnd(30)} $${(fixed + d.added).toFixed(2)}/day → ~$${left.toFixed(0)} left after 60 days; runs out ${r.date}`);
  }
  const dl = P.m3Deadline("2026-07-08");
  console.log(`\nif business verification was 2026-07-08 (the sponsorship start): qualify by ${dl.deadline}, so the clock must start by ${dl.latestClockStart}`);
  return 0;
}

// ───────────────────────────── Cost Management ─────────────────────────────

async function costDaily(from, to) {
  for (const withUsd of [true, false]) {
    try {
      const pages = [];
      let path = `${SUB_PATH()}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;
      for (let i = 0; path && i < 20; i++) {
        let r;
        for (let k = 0; ; k++) {   // Cost Management throttles hard (429); arm() does not repeat a POST that is not a list*
          try { r = await arm("POST", path, P.costQueryBody(from, to, { usd: withUsd })); break; }
          catch (e) { if (e.status !== 429 || k >= 3) throw e; await sleep(30_000 * (k + 1)); }
        }
        pages.push(r.properties || {});
        path = r.properties?.nextLink ? r.properties.nextLink.replace("https://management.azure.com", "") : null;
      }
      return P.parseCostRows(pages, { fx: { INR: Number(E.M3_FX_INR) || 96 } });
    } catch (e) {
      if (!(withUsd && e.status === 400)) throw e;
    }
  }
}

function blobSigned(method, name, key) {
  const path = `/${N.container}/${name}`;
  const h = { "x-ms-date": new Date().toUTCString(), "x-ms-version": "2023-11-03" };
  const sts = P.sharedKeyStringToSign({ method, account: N.sa, path, headers: h });
  h.authorization = `SharedKey ${N.sa}:${createHmac("sha256", Buffer.from(key, "base64")).update(sts, "utf8").digest("base64")}`;
  return fetch(`https://${N.sa}.blob.core.windows.net${path}`, { method, headers: h, signal: AbortSignal.timeout(30_000) });
}
async function storageKey() {
  if (E.AZURE_STORAGE_KEY) return E.AZURE_STORAGE_KEY;
  const k = await arm("POST", `/providers/Microsoft.Storage/storageAccounts/${N.sa}/listKeys?api-version=${API.st}`);
  return k.keys?.[0]?.value;
}

async function status() {
  if (!CREDS) { console.error("status needs AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID"); return 2; }
  const days = Number(opt("--days", P.ALERT.queryDays)), t = today(), from = P.addDays(t, -(days - 1));
  const { daily, currency, source } = await costDaily(from, t);
  const ids = V.m4Ids(SUB_PATH());
  const exists = async (id, v) => !!(await arm("GET", `${id}?api-version=${v}`, undefined, { allow404: true }).catch(() => null));
  const portfolio = P.activePortfolio({ vm: await exists(ids.vm, API.vm), lb: await exists(ids.lb, API.net), vnet: await exists(ids.pip(1), API.net) });
  const res = P.computeStreak(daily, { asOf: t, from, portfolio, required: MILESTONE.required });
  const m3 = MILESTONE.required > 5 ? P.computeStreak(daily, { asOf: t, from, portfolio, required: 5 }).streak : null;
  const show = P.dayList(P.addDays(t, -15), t);
  console.log(`Cost Management, ActualCost by ServiceName, USD (${source}; billed in ${currency}); last ${show.length} days, * = not closed yet:`);
  console.log(`  ${"service".padEnd(34)}${show.map((d) => (d.slice(8) + (d > res.lastClosed ? "*" : " ")).padStart(7)).join("")}`);
  const names = [...new Set(show.flatMap((d) => Object.keys(daily[d] || {})))].sort((a, b) => (daily[res.lastClosed]?.[b] || 0) - (daily[res.lastClosed]?.[a] || 0));
  for (const s of names) {
    const cells = show.map((d) => { const v = daily[d]?.[s]; return (v == null ? "·" : v >= 1 ? v.toFixed(2) : `(${v.toFixed(2)})`).padStart(7); });
    console.log(`  ${s.slice(0, 33).padEnd(34)}${cells.join("")}`);
  }
  console.log(`  ${"services >= $1".padEnd(34)}${show.map((d) => String(Object.values(daily[d] || {}).filter((v) => v >= 1).length).padStart(7)).join("")}`);
  console.log(`  ${"whole subscription".padEnd(34)}${show.map((d) => Object.values(daily[d] || {}).reduce((a, v) => a + v, 0).toFixed(1).padStart(7)).join("")}`);
  const s = res.streak;
  console.log(`\n60-day clock, ${MILESTONE.id.toUpperCase()} (strict: one set of >= ${MILESTONE.required} services each >= $1 every closed day; last closed ${res.lastClosed}):`);
  console.log(s.days ? `  day ${s.days} of ${P.RULE.days}, started ${s.start} (the earliest qualifying day of the current run; M3_SINCE only gates alerts), ${s.remaining} to go, completes ${s.completes}; held: ${s.set.join(", ")}`
    : `  not running: no closed day has ${MILESTONE.required} services each >= $1`);
  const d1 = opt("--day1", P.DAY1_CANDIDATE), d1Row = res.days.find((d) => d.date === d1);
  console.log(`  day-1 candidate ${d1}: ${!d1Row ? (d1 > res.lastClosed ? "not closed yet" : "outside the window") : `${d1Row.n} services >= $1 (${d1Row.qualifying.join(", ")}); ` +
    `${s.start && s.start <= d1 ? "IN the current run" : "not in the current run"}${m3 ? `; M3 reading ${m3.start && m3.start <= d1 ? "includes it" : "does not include it"}` : ""}`}`);
  if (m3) console.log(`  M3 reading (>= 5): ${m3.days ? `day ${m3.days}, started ${m3.start}, completes ${m3.completes}` : "not running"}`);
  console.log(`  loose reading (>= ${MILESTONE.required} services each day, any): ${res.loose.days} day(s)${res.loose.start ? ` since ${res.loose.start}` : ""}`);
  const under = res.under.filter((u) => u.date > P.addDays(res.lastClosed, -7));
  if (under.length) console.log(`  portfolio under $1 in the last 7 closed days: ${under.map((u) => `${u.date} ${u.id} ${usd(u.usd)}`).join("; ")}`);
  try {
    const key = await storageKey();
    for (const name of [`ledger/${P.addDays(t, -1)}.json`, `ledger/${t}.json`, `report/${t}.json`]) {
      const r = await blobSigned("GET", name, key);
      const txt = await r.text();
      if (r.status === 404) { console.log(`  ${N.container}/${name}: none`); continue; }
      const j = JSON.parse(txt);
      if (name.startsWith("ledger")) {
        const r = P.ledgerRuns(j);
        console.log(`  ${N.container}/${name}: ${Object.entries(j.lanes || {}).map(([k, l]) => `${k} ${usd(P.laneReported(j, k))}${j.targets?.[k]?.raise ? ` (raised to ${usd(j.targets[k].target)})` : ""}`).join(", ")} ` +
          `(${(j.runs || []).length} run(s) by ${r.runners.join("+") || "-"}${r.alerts.length ? `; alerts ${r.alerts.map((a) => `${a.runner}:${a.reason}:${a.lane || ""}`).join(", ")}` : ""})`);
      } else console.log(`  ${N.container}/${name}: ${j.ok ? "OK" : `ALERT ${j.reasons.map((x) => x.reason).join(", ")}`}${j.warnings?.length ? `; WARN ${j.warnings.map((x) => x.reason).join(", ")}` : ""}; ` +
        `credit ${j.credits?.supported ? j.credits.balance : "unsupported"}${j.runway ? `; runway ${j.runway.currency || ""} ${j.runway.projected ?? j.runway.projectedUsd} at ${j.runway.endDate}` : ""}`);
    }
  } catch (e) { console.log(`  ledger/report: not readable (${e.message.slice(0, 120)})`); }
  for (const [what, path] of [["Consumption balances", `${SUB_PATH()}/providers/Microsoft.Consumption/balances?api-version=2024-08-01`],
    ["Consumption credits", `${SUB_PATH()}/providers/Microsoft.Consumption/credits/balanceSummary?api-version=2024-08-01`]]) {
    const r = await arm("GET", path).then((b) => b, (e) => ({ error: e.status }));
    console.log(`  credit balance via ${what}: ${r.error ? `unsupported (${r.error})` : JSON.stringify(r.properties?.balanceSummary?.currentBalance ?? r.properties?.endingBalance ?? null)}`);
  }
  console.log("  the authoritative balance: https://www.microsoftazuresponsorships.com/balance; milestone: the Founders Hub portal");
  return 0;
}

// ───────────────────────────── apply steps ─────────────────────────────

async function guard() {
  if (!CREDS) return say("guard", `WOULD read ${N.web} and require template.scale.minReplicas >= 1 (no credentials: not read)`);
  const app = await arm("GET", `/providers/Microsoft.App/containerApps/${N.web}?api-version=${API.aca}`);
  const min = app.properties.template?.scale?.minReplicas ?? 0;
  say("guard", min >= 1 ? `ok: ${N.web} minReplicas ${min} (Container Apps bills all day)`
    : `WARNING: ${N.web} minReplicas ${min}: Container Apps may fall under $1 on a quiet day. Redeploy with scripts/deploy-azure.mjs (it pins min 1); this CLI does not change the app`);
}

async function image() {
  const body = { source: { registryUri: "docker.io", sourceImage: N.source }, targetTags: [N.image], mode: flag("--refresh-image") ? "Force" : "NoForce" };
  await act("image", `import docker.io/${N.source} into ${N.registry} as ${N.image} (mode ${body.mode}: a present tag is ${body.mode === "Force" ? "replaced" : "kept"})`, async () => {
    const r = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${N.registry}/importImage?api-version=${API.acr}`, body, { raw: true })
      .catch((e) => (/exist/i.test(e.message) ? { exists: true } : Promise.reject(e)));
    if (r.exists) return say("image", `${N.image} already present`);
    const op = r.headers.get("azure-asyncoperation") || r.headers.get("location");
    if (!op) return say("image", "import accepted");
    const st = await until(async () => {
      const s = await arm("GET", op.replace("https://management.azure.com", ""), undefined, { raw: true });
      const v = s.body?.status || (s.status === 200 || s.status === 204 ? "Succeeded" : "");
      return /^(Succeeded|Failed|Canceled)$/.test(v) && { status: v, error: s.body?.error };
    }, { everyMs: 5000, maxMs: 600_000, what: "image import" });
    if (st.status === "Succeeded") return say("image", `${N.image} imported`);
    if (/exist/i.test(JSON.stringify(st.error || ""))) return say("image", `${N.image} already present`);
    throw new Error(`image import ${st.status}: ${JSON.stringify(st.error || {}).slice(0, 300)}`);
  });
}

async function acr() {
  const path = `/providers/Microsoft.ContainerRegistry/registries/${N.registry}?api-version=${API.acr}`;
  if (CREDS) {
    const r = await arm("GET", path);
    if (r.sku?.name === "Premium") return say("acr", `ok: ${N.registry} is Premium`);
    say("acr", `${N.registry} is ${r.sku?.name}`);
  }
  await act("acr", `PATCH ${N.registry} sku → Premium ($${P.PRICES["acr:Premium"].usd}/day, retail ${P.PRICES_CHECKED})`, async () => {
    await arm("PATCH", path, { sku: { name: "Premium" } });
    await until(async () => { const r = await arm("GET", path); return r.sku?.name === "Premium" && r.properties.provisioningState === "Succeeded"; }, { everyMs: 5000, maxMs: 600_000, what: "ACR Premium" });
    say("acr", `${N.registry} is Premium`);
  });
}

async function container() {
  const sa = `/providers/Microsoft.Storage/storageAccounts/${N.sa}`;
  if (CREDS) {
    const a = await arm("GET", `${sa}?api-version=${API.st}`);
    const shape = `${a.kind} ${a.sku?.name} ${a.properties?.accessTier || "?"} ${a.location}`;
    const priced = a.kind === "StorageV2" && a.sku?.name === "Standard_LRS" && (a.properties?.accessTier || "Hot") === "Hot" && a.location === P.PRICES["storage:listOp"].region;
    say("container", `${N.sa}: ${shape}${priced ? " (the list-op price in plan.js applies)" : " — WARNING: plan.js prices Standard_LRS Hot eastus2 list ops; re-check M3_STORAGE_OP_USD"}`);
    const c = await arm("GET", `${sa}/blobServices/default/containers/${N.container}?api-version=${API.st}`, undefined, { allow404: true });
    if (c) return say("container", `ok: ${N.sa}/${N.container} exists (public access ${c.properties?.publicAccess || "None"})`);
  }
  await act("container", `create private container ${N.sa}/${N.container}`, () => arm("PUT", `${sa}/blobServices/default/containers/${N.container}?api-version=${API.st}`, { properties: { publicAccess: "None" } }));
}

/** taxila-ai-* accounts in this subscription and their deployments (read-only GETs). */
async function aiAccounts() {
  const all = [];
  let path = `${SUB_PATH()}/providers/Microsoft.CognitiveServices/accounts?api-version=${API.cog}`;
  for (let i = 0; path && i < 10; i++) { const r = await arm("GET", path); all.push(...(r.value || [])); path = r.nextLink ? r.nextLink.replace("https://management.azure.com", "") : null; }
  const out = [];
  for (const a of all.filter((x) => /^taxila-ai-/.test(x.name))) {
    const d = (await arm("GET", `${a.id}/deployments?api-version=${API.cog}`).catch(() => ({ value: [] }))).value || [];
    out.push({ name: a.name, id: a.id, location: a.location, kind: a.kind, deployments: d.map((x) => ({ name: x.name, format: x.properties?.model?.format,
      model: x.properties?.model?.name, state: x.properties?.provisioningState, chat: x.properties?.capabilities?.chatCompletion === "true" })) });
  }
  return out;
}
const accountKey = async (a) => (await arm("POST", `${a.id}/listKeys?api-version=${API.cog}`)).key1;
/** TTS regions with a verified S1 neural price row in plan.js. */
const TTS_PRICED = Object.fromEntries(Object.entries(P.PRICES).filter(([k]) => k.startsWith("tts:neural")).map(([k, p]) => [p.region, k]));

/** The credit balance and the principal's secret expiry the verifier checks: the environment's, else the owner's 2026-11-06 reading. */
function credit() {
  const inr = E.M3_BALANCE_INR !== undefined && E.M3_BALANCE_INR !== "" ? Number(E.M3_BALANCE_INR) : P.CREDIT.balanceInr;
  const at = E.M3_BALANCE_AT || P.CREDIT.at, secretExpires = E.M3_SP_SECRET_EXPIRES || P.CREDIT.spSecretExpires;
  if (!Number.isFinite(inr) || !/^\d{4}-\d{2}-\d{2}$/.test(at) || !/^\d{4}-\d{2}-\d{2}$/.test(secretExpires)) throw new Error("M3_BALANCE_INR / M3_BALANCE_AT / M3_SP_SECRET_EXPIRES: a number and YYYY-MM-DD dates");
  return { inr, at, secretExpires, from: E.M3_BALANCE_INR ? "M3_BALANCE_INR" : P.CREDIT.source };
}

/** Everything the two jobs (and the VM runner) need, resolved from the environment (+ ARM when credentials exist). */
async function jobInputs() {
  const fast = opt("--models-deployment", E.DEPLOY_FAST || "taxila-fast"), slow = opt("--models-fallback", E.DEPLOY_BRAIN || "taxila-brain");
  const priceArg = opt("--models-price", null);
  const priceOf = (dep, arg) => {
    if (arg) { const [i, c, o] = arg.split(",").map(Number); return { in: i, cached: c, out: o }; }
    const p = P.MODEL_PRICES[dep];
    if (!p) throw new Error(`no verified price for deployment ${dep}: pass --models-price in,cached,out ($ per 1M tokens)`);
    return p;
  };
  const speech = [[E.AZURE_SPEECH_REGION_SIN, E.AZURE_SPEECH_KEY_SIN], [E.AZURE_SPEECH_REGION, E.AZURE_SPEECH_KEY]].filter(([r, k]) => r && k);
  const uniq = speech.filter(([r], i) => speech.findIndex(([x]) => x === r) === i);
  let envRes = null, web = null, registries = null, regSecrets = [], current = {}, fb2 = null, fb2Note = "not looked up (no credentials)", spNote = null, ai = [];
  if (CREDS) {
    envRes = await arm("GET", `/providers/Microsoft.App/managedEnvironments/${N.env}?api-version=${API.aca}`);
    web = await arm("GET", `/providers/Microsoft.App/containerApps/${N.web}?api-version=${API.aca}`);
    const reg = (web.properties.configuration.registries || []).find((r) => r.server === `${N.registry}.azurecr.io`);
    if (reg?.passwordSecretRef) {
      const sec = (await arm("POST", `/providers/Microsoft.App/containerApps/${N.web}/listSecrets?api-version=${API.aca}`)).value || [];
      const v = sec.find((s) => s.name === reg.passwordSecretRef)?.value;
      if (!v) throw new Error(`${N.web}'s registry secret ${reg.passwordSecretRef} not readable`);
      registries = [{ server: reg.server, username: reg.username, passwordSecretRef: "acr-password" }];
      regSecrets = [{ name: "acr-password", value: v }];
    } else {
      const c = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${N.registry}/listCredentials?api-version=${API.acr}`);
      registries = [{ server: `${N.registry}.azurecr.io`, username: c.username, passwordSecretRef: "acr-password" }];
      regSecrets = [{ name: "acr-password", value: c.passwords?.[0]?.value }];
    }
    for (const j of [N.keeper, N.verify]) {
      const x = await arm("GET", `/providers/Microsoft.App/jobs/${j}?api-version=${API.aca}`, undefined, { allow404: true });
      if (x) current[j] = x;
    }
    // (e) the third models fallback: a chat deployment on a Taxila-owned account (taxila-ai-*) with a verified price
    ai = await aiAccounts();
    const want2 = opt("--models-fallback2", E.M3_MODELS_FALLBACK2 || "auto");
    if (want2 === "none") fb2Note = "off (--models-fallback2 none)";
    else {
      const pick = want2 === "auto" ? P.pickModelsFallback2(ai)
        : P.pickModelsFallback2(ai.filter((a) => a.name === want2.split("/")[0]).map((a) => ({ ...a, deployments: a.deployments.filter((d) => d.name === want2.split("/")[1]) })));
      if (!pick) fb2Note = `none: no chat deployment with a verified price on ${ai.map((a) => a.name).join(", ") || "any taxila-ai-* account"}`;
      else {
        const acct = ai.find((a) => a.name === pick.account);
        fb2 = { ...pick, key: await accountKey(acct) };
        fb2Note = `${pick.account}/${pick.deployment} (${pick.model}, ${pick.region}, $${pick.price.in}/$${pick.price.out} per 1M in/out)`;
      }
    }
    // a TTS fallback in another priced region on a taxila-ai-* account, when .env.local names only one Speech region
    const wantSp = opt("--speech-fallback", E.M3_SPEECH_FALLBACK || "auto");
    if (uniq.length === 1 && wantSp !== "none") {
      const cand = ai.filter((a) => (wantSp === "auto" || a.name === wantSp) && a.location !== uniq[0][0] && TTS_PRICED[a.location] && /^(AIServices|SpeechServices|CognitiveServices)$/.test(a.kind));
      if (cand[0]) { uniq.push([cand[0].location, await accountKey(cand[0])]); spNote = `${cand[0].name} (${cand[0].location}, ${TTS_PRICED[cand[0].location]})`; }
      else spNote = "none: no taxila-ai-* account in another region with a verified TTS price";
    }
  }
  const curEnv = (j, k) => current[j]?.properties?.template?.containers?.[0]?.env?.find((e) => e.name === k)?.value;
  const since = opt("--since", curEnv(N.verify, "M3_SINCE") || P.addDays(today(), 1));
  const untilD = opt("--until", curEnv(N.keeper, "M3_UNTIL") || DEFAULT_UNTIL);
  const exists = async (id, v) => (CREDS ? !!(await arm("GET", `${id}?api-version=${v}`, undefined, { allow404: true }).catch(() => null)) : false);
  const ids = V.m4Ids(SUB_PATH());
  const vmOn = flag("--vm") || await exists(ids.vm, API.vm);
  // lb / vnet join the verifier's portfolio once they exist, or when this apply creates them
  const lbOn = STEPS.includes("lb") || await exists(ids.lb, API.net);
  const vnetOn = STEPS.includes("pips") || await exists(ids.pip(1), API.net);
  const runCmd = CREDS ? await arm("GET", `${ids.runCmd}?api-version=${API.vm}&$expand=instanceView`, undefined, { allow404: true }).catch(() => null) : null;
  const runnerOn = STEPS.includes("runner") || runCmd?.properties?.instanceView?.executionState === "Succeeded";
  const runnersSince = curEnv(N.verify, "M3_RUNNERS_SINCE") || P.addDays(today(), 1);
  const storageKeyV = CREDS ? await storageKey() : E.AZURE_STORAGE_KEY;
  return { fast, slow, fastPrice: priceOf(fast, priceArg), slowPrice: P.MODEL_PRICES[slow] || null, fb2, fb2Note, spNote, speech: uniq, envRes, web, registries, regSecrets, current,
    since, until: untilD, vmOn, lbOn, vnetOn, runnerOn, runnersSince, storageKey: storageKeyV };
}

/**
 * The keeper's env as {name, value, secret?} (secret = the ACA secret-store name; the VM gets the value in its root-only
 * env file instead). One list, so the two runners can never drift apart.
 */
function keeperEnvSpec(x, runner) {
  const L = P.LANES, K = P.KEEPER, [sp1, sp2] = x.speech, e = [];
  const add = (name, value, secret = null) => e.push({ name, value: value == null ? "" : String(value), secret });
  add("M3_ROLE", "keeper"); add("M3_RUNNER", runner); add("M3_SINCE", x.since); add("M3_UNTIL", x.until);
  add("M3_STORAGE_ACCOUNT", N.sa); add("M3_STORAGE_KEY", x.storageKey, "storage-key"); add("M3_CONTAINER", N.container);
  for (const l of ["models", "tts", "storage"]) { add(`M3_${l.toUpperCase()}_TARGET`, L[l].targetUsd); add(`M3_${l.toUpperCase()}_CAP`, L[l].capUsd); }
  add("M3_RAISE_FLOOR", K.raiseFloorUsd); add("M3_RAISE_MAX", K.raiseMaxUsd); add("M3_RAISE_HEADROOM", K.raiseHeadroomUsd); add("M3_LEASE_SEC", K.leaseSec); add("M3_LEASE_RENEW_MS", K.leaseRenewMs);
  add("M3_DAY_GUARD_MIN", K.dayGuardMin);
  add("M3_AOAI_ENDPOINT", E.AZURE_OPENAI_ENDPOINT || ""); add("M3_AOAI_KEY", E.AZURE_OPENAI_API_KEY, "aoai-key"); add("M3_AOAI_DEPLOYMENT", x.fast);
  add("M3_AOAI_PRICE_IN", x.fastPrice.in); add("M3_AOAI_PRICE_CACHED", x.fastPrice.cached); add("M3_AOAI_PRICE_OUT", x.fastPrice.out);
  if (x.slowPrice && x.slow !== x.fast) {
    add("M3_AOAI_FALLBACK_DEPLOYMENT", x.slow); add("M3_AOAI_FALLBACK_PRICE_IN", x.slowPrice.in); add("M3_AOAI_FALLBACK_PRICE_CACHED", x.slowPrice.cached); add("M3_AOAI_FALLBACK_PRICE_OUT", x.slowPrice.out);
  }
  if (x.fb2) {
    add("M3_AOAI_FALLBACK2_ENDPOINT", x.fb2.endpoint); add("M3_AOAI_FALLBACK2_KEY", x.fb2.key, "aoai-fb2-key"); add("M3_AOAI_FALLBACK2_DEPLOYMENT", x.fb2.deployment);
    add("M3_AOAI_FALLBACK2_PRICE_IN", x.fb2.price.in); add("M3_AOAI_FALLBACK2_PRICE_CACHED", x.fb2.price.cached); add("M3_AOAI_FALLBACK2_PRICE_OUT", x.fb2.price.out);
  }
  if (sp1) { add("M3_SPEECH_REGION", sp1[0]); add("M3_SPEECH_KEY", sp1[1], "speech-key"); }
  if (sp2) { add("M3_SPEECH_FALLBACK_REGION", sp2[0]); add("M3_SPEECH_FALLBACK_KEY", sp2[1], "speech-fb-key"); }
  add("M3_TTS_PRICE_PER_MCHARS", P.PRICES["tts:neural"].usd); add("M3_STORAGE_OP_USD", P.PRICES["storage:listOp"].usd / 10_000);
  if (runner === "vm") { add("M3_LOCAL_DIR", "/var/lib/m3"); add("M3_LOCAL_FALLBACK_HOUR", K.localFallbackHour); }
  return e;
}

/** The two job bodies. Secret values sit in configuration.secrets; env only references them. */
function jobBodies(x) {
  const plain = (name, value) => ({ name, value: String(value) });
  const ref = (name, secretRef) => ({ name, secretRef });
  const L = P.LANES, A = P.ALERT, M = MILESTONE;
  const spec = keeperEnvSpec(x, "aca");
  const keeperSecrets = [...spec.filter((v) => v.secret).map((v) => ({ name: v.secret, value: v.value })), ...x.regSecrets];
  const keeperEnv = spec.map((v) => (v.secret ? ref(v.name, v.secret) : plain(v.name, v.value)));
  const portfolio = P.activePortfolio({ vm: x.vmOn, lb: x.lbOn, vnet: x.vnetOn }).map((p) => ({ id: p.id, match: p.match }));
  const verifySecrets = [{ name: "sp-secret", value: E.M3_VERIFY_SP_SECRET || E.AZURE_SP_SECRET }, { name: "storage-key", value: x.storageKey }, ...x.regSecrets];
  const C = credit();
  const verifyEnv = [plain("M3_ROLE", "verify"), plain("AZURE_TENANT_ID", E.AZURE_TENANT_ID || ""), plain("AZURE_SUBSCRIPTION_ID", E.AZURE_SUBSCRIPTION_ID || ""),
    plain("M3_SP_CLIENT_ID", E.M3_VERIFY_SP_CLIENT_ID || E.AZURE_SP_CLIENT_ID || ""), ref("M3_SP_SECRET", "sp-secret"),
    plain("M3_STORAGE_ACCOUNT", N.sa), ref("M3_STORAGE_KEY", "storage-key"), plain("M3_CONTAINER", N.container), plain("M3_SINCE", x.since), plain("M3_UNTIL", x.until),
    plain("M3_PORTFOLIO_JSON", JSON.stringify(portfolio)), plain("M3_LANES_JSON", JSON.stringify(Object.fromEntries(Object.entries(L).map(([k, v]) => [k, { targetUsd: v.targetUsd }])))),
    plain("M3_FX_INR", E.M3_FX_INR || 96), plain("M3_DAYS", A.queryDays), plain("M3_ALERT_DAYS", A.alertWindowDays), plain("M3_REQUIRED", M.required),
    plain("M3_MIN_SERVICES", M.minServices), plain("M3_FLOOR", A.portfolioFloorUsd), plain("M3_FLOOR_ALERT", M.floorAlert ? 1 : 0), plain("M3_OPEN_DAYS", A.openDays),
    plain("M3_RUNNERS", x.runnerOn ? "aca,vm" : "aca"), plain("M3_RUNNERS_SINCE", x.runnersSince),
    plain("M3_BURST_USD", A.burstUsd), plain("M3_BURST_DAYS", A.burstDays), plain("M3_RUNWAY_DAYS", A.runwayDays), plain("M3_RUNWAY_AVG_DAYS", A.runwayAvgDays),
    plain("M3_RUNWAY_MIN_INR", A.runwayMinInr), plain("M3_BALANCE_INR", C.inr), plain("M3_BALANCE_AT", C.at),
    plain("M3_SP_SECRET_EXPIRES", C.secretExpires), plain("M3_SECRET_WARN_DAYS", A.secretWarnDays), plain("M3_DAY1", P.DAY1_CANDIDATE)];
  const wp = (x.envRes?.properties?.workloadProfiles || []).length ? { workloadProfileName: "Consumption" } : {};
  const body = (job, cron, timeout, cpu, memory, secrets, env, file) => {
    const script = readFileSync(new URL(`../infra/m3/${file}`, import.meta.url), "utf8");
    // the script rides as ONE container arg: Linux caps a single argv string at 128 KiB (MAX_ARG_STRLEN), and ACA documents
    // no larger limit. Fail at plan time, not at the job's first start, if it ever grows near that.
    if (Buffer.byteLength(script) > 96 * 1024) throw new Error(`infra/m3/${file} is ${Buffer.byteLength(script)} bytes: over the 96 KiB budget for a single container arg`);
    const b = { location: x.envRes?.location || "<the environment's location>", tags: { ...TAGS },
      properties: { environmentId: x.envRes?.id || `<${N.env} id>`, ...wp,
        configuration: { triggerType: "Schedule", replicaTimeout: timeout, replicaRetryLimit: 2,
          scheduleTriggerConfig: { cronExpression: cron, parallelism: 1, replicaCompletionCount: 1 },
          secrets, registries: x.registries || [{ server: `${N.registry}.azurecr.io`, username: "<from taxila-web>", passwordSecretRef: "acr-password" }] },
        template: { containers: [{ name: job, image: `${N.registry}.azurecr.io/${N.image}`, command: ["node", "--input-type=module", "-e"], args: [script],
          resources: { cpu, memory }, env }] } } };
    b.tags["m3-spec"] = sha(JSON.stringify(b)).slice(0, 16);   // covers the secret values too, so a rotated key re-PUTs
    return b;
  };
  return {
    [N.keeper]: body(N.keeper, CRON.keeper, 10_800, 0.5, "1Gi", keeperSecrets, keeperEnv, "keeper-job.mjs"),
    [N.verify]: body(N.verify, CRON.verify, 1_200, 0.25, "0.5Gi", verifySecrets, verifyEnv, "verify-job.mjs"),
  };
}

/** The comparable, non-secret shape of a job (desired body or GET result). */
function jobView(j) {
  const c = j?.properties?.template?.containers?.[0] || {}, cfg = j?.properties?.configuration || {};
  return { image: c.image, cron: cfg.scheduleTriggerConfig?.cronExpression, timeout: cfg.replicaTimeout, retry: cfg.replicaRetryLimit,
    cpu: Number(c.resources?.cpu), memory: c.resources?.memory, script: c.args?.[0] ? sha(c.args[0]).slice(0, 12) : null,
    env: (c.env || []).map((e) => `${e.name}=${e.secretRef ? `secret:${e.secretRef}` : e.value}`).sort().join("\n"),
    secrets: (cfg.secrets || []).map((s) => s.name).sort().join(","), registries: (cfg.registries || []).map((r) => r.server).join(","), spec: j?.tags?.["m3-spec"] || null };
}

let INPUTS = null;
/** jobInputs once per run (jobs and runner share it: one keeper env for both runners). */
const inputs = async () => (INPUTS ||= await jobInputs());

async function jobs() {
  const x = await inputs();
  const bodies = jobBodies(x);
  const missing = Object.entries(bodies).flatMap(([j, b]) => b.properties.configuration.secrets.filter((s) => !s.value).map((s) => `${j}:${s.name}`));
  if (!x.speech.length) missing.push("speech region/key (AZURE_SPEECH_REGION_SIN + AZURE_SPEECH_KEY_SIN, or AZURE_SPEECH_REGION + AZURE_SPEECH_KEY)");
  if (!E.AZURE_OPENAI_ENDPOINT) missing.push("AZURE_OPENAI_ENDPOINT");
  say("jobs", `models lane: ${x.fast} ($${x.fastPrice.in}/$${x.fastPrice.out} per 1M in/out)${x.slowPrice && x.slow !== x.fast ? ` → fallback ${x.slow}` : ""} → fallback2 ${x.fb2Note}; ` +
    `speech: ${x.speech.map(([r]) => r).join(" → ") || "NONE"}${x.spNote ? ` (fallback: ${x.spNote})` : ""}; storage: ${N.sa}/${N.container}; since ${x.since}, until ${x.until}`);
  say("jobs", `milestone ${MILESTONE.id}: ${MILESTONE.required} required, alert under ${MILESTONE.minServices}, a single service under the floor ${MILESTONE.floorAlert ? "alerts" : "warns"}; ` +
    `portfolio ${P.activePortfolio({ vm: x.vmOn, lb: x.lbOn, vnet: x.vnetOn }).map((p) => p.id).join(",")}; runners ${x.runnerOn ? `aca,vm (both expected from ${x.runnersSince})` : "aca"}; ` +
    `keeper "${CRON.keeper}", verify "${CRON.verify}"; runway from ₹${credit().inr} on ${credit().at} (${credit().from}), alert under ₹${P.ALERT.runwayMinInr} at M3_SINCE + ${P.ALERT.runwayDays} days; ` +
    `principal secret expires ${credit().secretExpires} (alert ${P.ALERT.secretWarnDays} days before)`);
  if (missing.length) {
    say("jobs", `${DRY ? "WOULD STOP" : "STOP"}: missing ${missing.join(", ")}`);
    if (!DRY) throw new Error(`missing inputs: ${missing.join(", ")}`);
  }
  for (const [name, b] of Object.entries(bodies)) {
    const want = jobView(b), have = x.current[name] ? jobView(x.current[name]) : null;
    const changed = have ? Object.keys(want).filter((k) => want[k] !== have[k]) : null;
    if (have && !changed.length && x.current[name].properties.provisioningState === "Succeeded") { say("jobs", `ok: ${name} unchanged (spec ${want.spec})`); continue; }
    if (DRY) {   // the exact body, compactly; secret values and ids never printed
      const cfg = b.properties.configuration, c = b.properties.template.containers[0];
      const idish = (k, v) => (/(TENANT|SUBSCRIPTION|CLIENT)_ID$/.test(k) && v ? `${v.slice(0, 4)}…` : v);
      console.log(`  ${name}: ${b.location} · env ${b.properties.environmentId.split("/").pop()} · ${cfg.triggerType} "${cfg.scheduleTriggerConfig.cronExpression}" UTC · ` +
        `replicaTimeout ${cfg.replicaTimeout} s · replicaRetryLimit ${cfg.replicaRetryLimit} · ${c.resources.cpu} vCPU / ${c.resources.memory}`);
      console.log(`    image ${c.image} via ${cfg.registries.map((r) => `${r.server} (${r.username}, secret ${r.passwordSecretRef})`).join(", ")}`);
      console.log(`    command ${c.command.join(" ")} <infra/m3/${name === N.keeper ? "keeper" : "verify"}-job.mjs, ${c.args[0].length} bytes, sha256 ${want.script}>`);
      console.log(`    secrets (job secret store): ${cfg.secrets.map((s) => `${s.name}=${s.value ? "<set>" : "<MISSING>"}`).join(", ")}`);
      for (const e of c.env) console.log(`    env ${e.name}=${e.secretRef ? `secretRef:${e.secretRef}` : idish(e.name, e.value)}`);
      console.log(`    tags ${JSON.stringify(b.tags)}`);
    }
    if (missing.length) continue;
    await act("jobs", `${have ? `update ${name} (changed: ${changed.join(", ")})` : `create ${name}`} cron "${want.cron}"`, async () => {
      await arm("PUT", `/providers/Microsoft.App/jobs/${name}?api-version=${API.aca}`, b);
      await until(async () => { const j = await arm("GET", `/providers/Microsoft.App/jobs/${name}?api-version=${API.aca}`); if (j.properties.provisioningState === "Failed") throw new Error(`${name} provisioning failed`); return j.properties.provisioningState === "Succeeded"; },
        { everyMs: 4000, maxMs: 300_000, what: `${name} provisioned` });
      say("jobs", `${name} ready`);
    });
  }
  if (flag("--start-now")) await act("jobs", `start one ${N.keeper} execution now`, async () => {
    const ex = await arm("POST", `/providers/Microsoft.App/jobs/${N.keeper}/start?api-version=${API.aca}`, {});
    say("jobs", `execution ${ex.name || ex.id?.split("/").pop()} started; its M3 lines land in Log Analytics in a few minutes`);
  });
  return x;
}

async function actiongroup() {
  const path = `/providers/Microsoft.Insights/actionGroups/${N.ag}?api-version=${API.insights}`;
  const email = String(E.M3_ALERT_EMAIL || "").trim();
  const body = P.actionGroupBody({ ownerRole: OWNER_ROLE, email, tags: TAGS });
  const k = body.properties.emailReceivers.length;
  const who = `armRoleReceivers Owner (${OWNER_ROLE}; direct assignments only)${k ? ` + ${k} emailReceiver(s) from M3_ALERT_EMAIL` : " (set M3_ALERT_EMAIL, comma-separated, to also reach an Owner held through a group)"}`;
  if (CREDS) {
    const g = await arm("GET", path, undefined, { allow404: true });
    if (P.actionGroupMatches(g, body)) { say("actiongroup", `ok: ${N.ag} → ${who}`); return g; }
  }
  return act("actiongroup", `PUT ${N.ag}: ${who}`, () => arm("PUT", path, body));
}

const RULES = {
  "m3-alert-lines": { sev: 1, every: "PT1H", window: "PT2H", mute: "PT6H",
    desc: "M3 credit unlock: m3-keeper or m3-verify printed M3-ALERT (a service under its floor, a short or missing keeper ledger, a streak reset, a broken ledger, a failed cost query). The line says which; docs/design/round7/M3.md",
    query: 'ContainerAppConsoleLogs_CL | where ContainerJobName_s in ("m3-keeper", "m3-verify") and Log_s startswith "M3-ALERT" | project TimeGenerated, ContainerJobName_s, Log_s',
    agg: "Count", op: "GreaterThan", threshold: 0 },
  "m3-verify-silent": { sev: 1, every: "PT1H", window: "P2D", mute: "PT12H",
    desc: "M3 credit unlock: no M3-OK from m3-verify in 26 h (the verifier is dead, or the portfolio has not been healthy for a day)",
    query: (armedAt) => P.silentQuery(armedAt), armed: true,   // silent until armed-at + 26 h (no first-day false alarm)
    agg: "Total", metric: "n", op: "LessThan", threshold: 1 },
};
async function alerts(ag) {
  let ws = null;
  if (CREDS) {
    const env = await arm("GET", `/providers/Microsoft.App/managedEnvironments/${N.env}?api-version=${API.aca}`);
    const cid = env.properties.appLogsConfiguration?.logAnalyticsConfiguration?.customerId;
    const list = (await arm("GET", `${SUB_PATH()}/providers/Microsoft.OperationalInsights/workspaces?api-version=${API.ws}`)).value || [];
    ws = list.find((w) => w.properties?.customerId === cid);
    if (!ws) throw new Error(`no Log Analytics workspace with customerId of ${N.env}'s logs`);
  }
  for (const [name, r] of Object.entries(RULES)) {
    const path = `/providers/Microsoft.Insights/scheduledQueryRules/${name}?api-version=${API.sqr}`;
    const cur = CREDS ? await arm("GET", path, undefined, { allow404: true }) : null;
    // armed-at: kept from the live rule's tag on every re-apply (stable query, stable spec hash); set once on first create
    const armedAt = r.armed ? (cur?.tags?.["m3-armed-at"] || P.armedNow()) : null;
    const query = typeof r.query === "function" ? r.query(armedAt) : r.query;
    const body = { location: ws?.location || "<workspace location>", kind: "LogAlert", tags: { ...TAGS, ...(armedAt ? { "m3-armed-at": armedAt } : {}) }, properties: { displayName: name, description: r.desc, severity: r.sev, enabled: true,
      scopes: [ws?.id || "<workspace id>"], evaluationFrequency: r.every, windowSize: r.window, muteActionsDuration: r.mute, autoMitigate: false,
      criteria: { allOf: [{ query, timeAggregation: r.agg, ...(r.metric ? { metricMeasureColumn: r.metric } : {}), operator: r.op, threshold: r.threshold,
        failingPeriods: { numberOfEvaluationPeriods: 1, minFailingPeriodsToAlert: 1 } }] },
      actions: { actionGroups: [ag?.id || `<${N.ag} id>`] } } };
    // the whole desired rule (severity, frequency, window, mute, criteria, scope, action group) as a tag, like the jobs'
    // m3-spec: any change re-PUTs it; comparing only the query and window left a changed threshold or severity un-applied
    body.tags["m3-spec"] = sha(JSON.stringify(body)).slice(0, 16);
    if (cur && cur.properties.enabled && cur.tags?.["m3-spec"] === body.tags["m3-spec"]) { say("alerts", `ok: ${name}`); continue; }
    await act("alerts", `PUT rule ${name} (every ${r.every}, window ${r.window}${armedAt ? `, armed ${armedAt}` : ""}): ${query}`, () => arm("PUT", path, body));
  }
}

// ── owner-gated ──

async function vm() {
  const size = opt("--vm-size", P.VM.size);
  const d = P.vmDailyUsd(size);
  if (!d) throw new Error(`--vm-size ${size}: no verified price in plan.js`);
  if (d.compute < P.MIN_FIXED_USD_PER_DAY) throw new Error(`${size} costs $${d.compute}/day, below $${P.MIN_FIXED_USD_PER_DAY}`);
  const live = await livePrice(`vm:${size}`).catch(() => null);
  if (live == null || live * 24 < P.MIN_FIXED_USD_PER_DAY) throw new Error(`${size}: live retail price ${live} $/h is not >= $${P.MIN_FIXED_USD_PER_DAY}/day; refusing`);
  say("vm", `${size} ${P.VM.region}: $${live}/h live = $${(live * 24).toFixed(3)}/day (+ disk $${d.disk}/day under Storage)`);
  const RG = `${SUB_PATH()}/resourceGroups/${P.VM.rg}`, loc = P.VM.region;
  const ids = { nsg: `${RG}/providers/Microsoft.Network/networkSecurityGroups/taxila-m3-nsg`, vnet: `${RG}/providers/Microsoft.Network/virtualNetworks/taxila-m3-vnet`,
    nic: `${RG}/providers/Microsoft.Network/networkInterfaces/taxila-m3-nic`, vm: `${RG}/providers/Microsoft.Compute/virtualMachines/${P.VM.name}` };
  const get = (p, v) => (CREDS ? arm("GET", `${p}?api-version=${v}`, undefined, { allow404: true }) : Promise.resolve(null));
  if (CREDS) {
    const usages = (await arm("GET", `${SUB_PATH()}/providers/Microsoft.Compute/locations/${loc}/usages?api-version=${API.vm}`)).value || [];
    const fam = usages.find((u) => u.name?.value === "standardDASv5Family"), all = usages.find((u) => u.name?.value === "cores");
    for (const u of [fam, all].filter(Boolean)) say("vm", `quota ${u.name.value}: ${u.currentValue}/${u.limit} vCPU used`);
    if (fam && fam.currentValue + 2 > fam.limit) throw new Error(`no DASv5 quota in ${loc} for 2 vCPU: request a quota increase first`);
  }
  const steps = [
    [RG, API.rg, { location: loc, tags: TAGS }, `resource group ${P.VM.rg} (${loc})`],
    [ids.nsg, API.net, { location: loc, tags: TAGS, properties: { securityRules: [] } }, "NSG taxila-m3-nsg with NO custom rules (Azure's defaults deny inbound from the internet)"],
    [ids.vnet, API.net, { location: loc, tags: TAGS, properties: { addressSpace: { addressPrefixes: ["10.73.0.0/24"] },
      subnets: [{ name: "default", properties: { addressPrefix: "10.73.0.0/26", networkSecurityGroup: { id: ids.nsg }, defaultOutboundAccess: false } }] } },
      "VNet taxila-m3-vnet 10.73.0.0/24 (private subnet: no default outbound access)"],
    [ids.nic, API.net, { location: loc, tags: TAGS, properties: { networkSecurityGroup: { id: ids.nsg },
      ipConfigurations: [{ name: "ipconfig1", properties: { subnet: { id: `${ids.vnet}/subnets/default` }, privateIPAllocationMethod: "Dynamic" } }] } },
      "NIC taxila-m3-nic (created private; the pips step adds its one public IP, the lb step its pool)"],
  ];
  for (const [path, v, body, what] of steps) {
    if (await get(path, v)) { say("vm", `ok: ${what.split(" (")[0]} exists`); continue; }
    await act("vm", `create ${what}`, async () => { await arm("PUT", `${path}?api-version=${v}`, body); await until(async () => { const r = await arm("GET", `${path}?api-version=${v}`); return !r.properties?.provisioningState || r.properties.provisioningState === "Succeeded"; }, { everyMs: 4000, maxMs: 300_000, what }); });
  }
  const cur = await get(ids.vm, API.vm);
  if (cur) {
    const iv = await arm("GET", `${ids.vm}/instanceView?api-version=${API.vm}`);
    const power = (iv.statuses || []).find((s) => s.code?.startsWith("PowerState/"))?.code || "unknown";
    say("vm", `ok: ${P.VM.name} exists (${cur.properties.hardwareProfile?.vmSize}, ${power})`);
    if (!/running/.test(power)) await act("vm", `start ${P.VM.name} (it only bills, and only counts, while running)`, () => arm("POST", `${ids.vm}/start?api-version=${API.vm}`));
    return;
  }
  const { publicKey } = generateKeyPairSync("rsa", { modulusLength: 3072 });   // the private half is never written anywhere
  const body = { location: loc, tags: TAGS, properties: { hardwareProfile: { vmSize: size },
    storageProfile: { imageReference: P.VM.image, osDisk: { name: "taxila-m3-osdisk", createOption: "FromImage", diskSizeGB: 30, deleteOption: "Detach", managedDisk: { storageAccountType: "StandardSSD_LRS" } } },
    osProfile: { computerName: "taxila-m3", adminUsername: "m3", linuxConfiguration: { disablePasswordAuthentication: true, provisionVMAgent: true,
      ssh: { publicKeys: [{ path: "/home/m3/.ssh/authorized_keys", keyData: P.opensshRsaPublicKey(publicKey.export({ format: "jwk" })) }] } } },
    securityProfile: { securityType: "TrustedLaunch", uefiSettings: { secureBootEnabled: true, vTpmEnabled: true } },
    networkProfile: { networkInterfaces: [{ id: ids.nic, properties: { primary: true, deleteOption: "Detach" } }] },
    diagnosticsProfile: { bootDiagnostics: { enabled: true } } } };
  await act("vm", `create ${P.VM.name}: ${size}, Ubuntu 24.04, StandardSSD_LRS 30 GB, SSH key only (private half discarded: nobody logs in), no public IP, no auto-shutdown schedule`, async () => {
    await arm("PUT", `${ids.vm}?api-version=${API.vm}`, body);
    await until(async () => { const r = await arm("GET", `${ids.vm}?api-version=${API.vm}`); if (r.properties.provisioningState === "Failed") throw new Error("VM provisioning failed"); return r.properties.provisioningState === "Succeeded"; },
      { everyMs: 10_000, maxMs: 900_000, what: `${P.VM.name} provisioned` });
    say("vm", `${P.VM.name} running`);
  });
}

// ── M4: two spare services and the keeper's second runner, all in taxila-m3-rg (owner-approved 2026-11-06) ──

const short = (id) => String(id).split("/").slice(-2).join("/");
const getRes = (id, v) => (CREDS ? arm("GET", `${id}?api-version=${v}`, undefined, { allow404: true }) : Promise.resolve(null));
async function putAndWait(id, v, body, what) {
  await arm("PUT", `${id}?api-version=${v}`, body);
  await until(async () => {
    const r = await arm("GET", `${id}?api-version=${v}`);
    if (r.properties?.provisioningState === "Failed") throw new Error(`${what} provisioning failed`);
    return !r.properties?.provisioningState || r.properties.provisioningState === "Succeeded";
  }, { everyMs: 4000, maxMs: 600_000, what });
}
/** pips / lb / runner sit on taxila-m3-vm: → the VM, or null in a plan without it (apply refuses). */
async function needVm(step) {
  const v = await getRes(V.m4Ids(SUB_PATH()).vm, API.vm);
  if (v) return v;
  if (DRY || !CREDS) { say(step, `NOTE: ${P.VM.name} ${CREDS ? "does not exist" : "not read (no credentials)"}; the plan assumes it (apply --vm creates it first)`); return null; }
  throw new Error(`${step}: ${P.VM.name} does not exist; run apply --vm first`);
}
/** Re-read the live retail price before renting anything; refuse below $1.25/day (as the vm step does). */
async function livePerDay(step, keys, perDay, label, planned) {
  const live = {};
  for (const k of keys) live[k] = await livePrice(k).catch(() => null);
  if (keys.some((k) => live[k] == null)) throw new Error(`${step}: live retail price of ${keys.join(", ")} not readable; refusing`);
  const day = perDay(live);
  if (day < P.MIN_FIXED_USD_PER_DAY) throw new Error(`${step}: ${label} is $${day.toFixed(3)}/day at live prices, below $${P.MIN_FIXED_USD_PER_DAY}; refusing`);
  say(step, `${label}: ${keys.map((k) => `${k} $${live[k]}/${P.PRICES[k].unit.replace(/^1 ?\/?/, "")} (${P.PRICES[k].region})`).join(" + ")} → $${day.toFixed(3)}/day live (plan.js $${planned})`);
}

async function pips() {
  const ids = V.m4Ids(SUB_PATH());
  await livePerDay("pips", ["pip:standard"], (l) => l["pip:standard"] * 24 * P.PIPS.count, `${P.PIPS.count} Standard static IPv4 public IPs`, P.pipsDailyUsd());
  await needVm("pips");
  // the NSG must keep the internet out BEFORE a public IP goes on the NIC
  const nsg = await getRes(ids.nsg, API.net);
  if (nsg) {
    const c = V.nsgDeniesInternetInbound(nsg);
    if (!c.ok) throw new Error(`pips: taxila-m3-nsg does not deny internet inbound (${c.why}); refusing to attach a public IP`);
    say("pips", `ok: taxila-m3-nsg denies internet inbound (${c.why}); it guards both the NIC and the subnet`);
  } else say("pips", `NOTE: taxila-m3-nsg ${CREDS ? "missing" : "not read"}; apply --vm creates it with no custom rules, and this step re-checks it`);
  for (let i = 1; i <= P.PIPS.count; i++) {
    const id = ids.pip(i), name = V.pipName(i), cur = await getRes(id, API.net);
    if (cur) {
      if (!V.pipOk(cur)) throw new Error(`pips: ${name} exists but is not Standard / static / IPv4 (${cur.sku?.name} ${cur.properties?.publicIPAllocationMethod})`);
      say("pips", `ok: ${name} ${cur.properties.ipAddress || ""} ${cur.properties.ipConfiguration ? `on ${short(cur.properties.ipConfiguration.id.split("/ipConfigurations/")[0])}` : "(unattached)"}`);
      continue;
    }
    await act("pips", `create ${name}: Standard static IPv4, ${P.PIPS.region}, $${(P.PRICES["pip:standard"].usd * 24).toFixed(2)}/day${i === P.PIPS.onNic ? " (goes on taxila-m3-nic)" : " (unattached)"}`,
      () => putAndWait(id, API.net, V.pipBody({ tags: TAGS }), name));
  }
  const nic = await getRes(ids.nic, API.net);
  if (!nic) return say("pips", `WOULD attach ${V.pipName(P.PIPS.onNic)} to taxila-m3-nic once it exists`);
  const { changed, body } = V.nicWith(nic, { publicIpId: ids.pip(P.PIPS.onNic) });
  if (!changed.length) return say("pips", `ok: taxila-m3-nic holds ${V.pipName(P.PIPS.onNic)} (the VM's outbound)`);
  await act("pips", `update taxila-m3-nic: ${changed.join("; ")}: the VM's outbound (its subnet has no default outbound); inbound from the internet stays denied`,
    () => putAndWait(ids.nic, API.net, body, "taxila-m3-nic"));
}

async function lb() {
  const ids = V.m4Ids(SUB_PATH());
  await livePerDay("lb", ["lb:included", "lb:overage"], (l) => (l["lb:included"] + Math.max(0, P.LB.rules - 5) * l["lb:overage"]) * 24,
    `taxila-m3-lb with ${P.LB.rules} rules (5 included + ${P.LB.rules - 5} overage)`, P.lbDailyUsd());
  await needVm("lb");
  const sn = await getRes(ids.subnetLb, API.net);
  if (sn) say("lb", `ok: subnet taxila-m3-vnet/${P.LB.subnet} ${sn.properties?.addressPrefix}`);
  else await act("lb", `create subnet taxila-m3-vnet/${P.LB.subnet} ${P.LB.subnetPrefix} (no default outbound, taxila-m3-nsg; the default subnet is untouched)`,
    () => putAndWait(ids.subnetLb, API.net, V.lbSubnetBody(ids), `subnet ${P.LB.subnet}`));
  const want = V.lbBody(ids, { tags: TAGS }), cur = await getRes(ids.lb, API.net);
  const wv = V.lbView(want), hv = cur ? V.lbView(cur) : null;
  const diff = hv ? Object.keys(wv).filter((k) => wv[k] !== hv[k]) : null;
  if (hv && !diff.length) say("lb", `ok: ${P.LB.name} ${hv.sku}, ${V.lbRuleCount(cur)} billed rules, frontend ${hv.frontends}, pool ${hv.pools}, probe ${hv.probes}`);
  else {
    if (DRY) console.log(`  ${P.LB.name}: ${want.sku.name} internal, ${P.LB.region}; frontend ${wv.frontends} (private, dynamic); pool ${wv.pools}; probe ${wv.probes} every 15 s; rules ${wv.rules}`);
    await act("lb", `${cur ? `update ${P.LB.name} (changed: ${diff.join(", ")})` : `create ${P.LB.name}`}: Standard internal, ${P.LB.rules} TCP rules, $${P.lbDailyUsd()}/day`,
      () => putAndWait(ids.lb, API.net, want, P.LB.name));
  }
  const nic = await getRes(ids.nic, API.net);
  if (!nic) return say("lb", `WOULD put taxila-m3-nic in ${P.LB.name}/be once it exists`);
  const { changed, body } = V.nicWith(nic, { poolId: ids.lbPool });
  if (!changed.length) return say("lb", `ok: taxila-m3-nic is in ${P.LB.name}/be (the rules have a real backend)`);
  await act("lb", `update taxila-m3-nic: ${changed.join("; ")}: the rules get a real backend, so an empty-pool billing rule cannot matter`,
    () => putAndWait(ids.nic, API.net, body, "taxila-m3-nic"));
}

/** The hosts the VM runner calls, for its install-time reachability check (no credentials sent). */
function runnerHosts(x) {
  const h = new Set([`https://${N.sa}.blob.core.windows.net/`, "https://nodejs.org/"]);
  for (const u of [E.AZURE_OPENAI_ENDPOINT, x.fb2?.endpoint]) if (u) h.add(`https://${new URL(u).host}/`);
  for (const [r] of x.speech) h.add(`https://${r}.tts.speech.microsoft.com/`);
  return [...h];
}
async function runner() {
  const ids = V.m4Ids(SUB_PATH());
  const vmr = await needVm("runner");
  if (vmr) {
    const iv = await arm("GET", `${ids.vm}/instanceView?api-version=${API.vm}`);
    const power = (iv.statuses || []).find((s) => s.code?.startsWith("PowerState/"))?.code || "unknown", agent = iv.vmAgent?.statuses?.[0]?.displayStatus || "unknown";
    say("runner", `${P.VM.name}: ${power}, VM agent ${agent} ${iv.vmAgent?.vmAgentVersion || ""}`.trim());
    if (!/running/.test(power) || agent !== "Ready") { if (DRY) say("runner", "NOTE: Run Command needs the VM running with a Ready agent"); else throw new Error("runner: the VM is not running with a Ready agent"); }
    const nic = await getRes(ids.nic, API.net);
    const pip = (nic?.properties?.ipConfigurations || []).find((c) => c.properties?.publicIPAddress)?.properties.publicIPAddress.id;
    if (!pip) { if (DRY) say("runner", `NOTE: taxila-m3-nic has no public IP yet: the pips step (run before this one) gives the VM the outbound the install needs`); else throw new Error("runner: taxila-m3-nic has no public IP (no outbound): run the pips step first"); }
  }
  const x = await inputs();
  const pairs = keeperEnvSpec(x, "vm").map((v) => [v.name, v.value]);
  const unset = pairs.filter(([k, v]) => !v && /KEY$|ENDPOINT$|ACCOUNT$/.test(k)).map(([k]) => k);
  const envText = V.envFileText(pairs);
  const src = readFileSync(new URL("../infra/m3/keeper-job.mjs", import.meta.url));
  const keeperSha = createHash("sha256").update(src).digest("hex");
  const script = V.runnerScript({ keeperGzB64: gzipSync(src, { level: 9 }).toString("base64"), keeperSha, hosts: runnerHosts(x) });
  const spec = sha(`${script}\n${envText}`).slice(0, 16);   // covers the secret values too (a rotated key re-runs), never shows them
  const cur = await getRes(ids.runCmd, `${API.vm}&$expand=instanceView`);
  const iv = cur?.properties?.instanceView;
  const tail = (s) => String(s || "").split("\n").filter((l) => /^M3-RUNNER/.test(l)).map((l) => V.scrubLine(l));
  if (cur && cur.tags?.["m3-spec"] === spec && iv?.executionState === "Succeeded" && iv.exitCode === 0) {
    say("runner", `ok: ${V.RUNCMD} on ${P.VM.name} unchanged (spec ${spec}), last run ${iv.endTime || "?"}`);
    for (const l of tail(iv.output)) console.log(`  ${l}`);
    return;
  }
  const { service, timer } = V.runnerUnits();
  console.log(`  ${V.RUNCMD}: managed Run Command on ${P.VM.name} (${P.VM.region}), script ${Buffer.byteLength(script)} bytes sha256 ${sha(script).slice(0, 12)}, timeout 1500 s; ` +
    `${cur ? `replaces the last one (${iv?.executionState || "?"}, exit ${iv?.exitCode ?? "?"}, spec ${cur.tags?.["m3-spec"] || "-"} → ${spec})` : "first install"}`);
  console.log(`    node ${P.NODE.version} from nodejs.org/dist (${P.NODE.file}, sha256 ${P.NODE.sha256.slice(0, 16)}…, checked before unpacking) → /opt/m3/node`);
  console.log(`    keeper infra/m3/keeper-job.mjs (${src.length} bytes, sha256 ${keeperSha.slice(0, 12)}, gzip+base64 inline) → /opt/m3/keeper-job.mjs`);
  console.log(`    /etc/m3/keeper.env (root 0600, via the protectedParameter M3_ENV_B64; a GET never returns it): ` +
    pairs.map(([k, v]) => `${k}=${/KEY$/.test(k) ? (v ? "<set>" : "<MISSING>") : v}`).join(" "));
  console.log(`    m3-keeper.service: ${service.split("\n").filter((l) => /^(ExecStart|EnvironmentFile|DynamicUser|StateDirectory|TimeoutStartSec)=/.test(l)).join(", ")}`);
  console.log(`    m3-keeper.timer: ${timer.split("\n").filter((l) => /^(OnCalendar|Persistent)=/.test(l)).join(", ")} (the ACA job runs "${CRON.keeper}")`);
  console.log(`    reachability check after install (no credentials sent): ${runnerHosts(x).join(" ")}`);
  if (unset.length) { say("runner", `${DRY ? "WOULD STOP" : "STOP"}: unset ${unset.join(", ")}`); if (!DRY) throw new Error(`runner: unset ${unset.join(", ")}`); return; }
  const body = { location: P.VM.region, tags: { ...TAGS, "m3-spec": spec }, properties: { source: { script }, asyncExecution: false, timeoutInSeconds: 1500,
    treatFailureAsDeploymentFailure: false, protectedParameters: [{ name: "M3_ENV_B64", value: Buffer.from(envText).toString("base64") }] } };
  await act("runner", `${cur ? "re-run" : "create"} Run Command ${V.RUNCMD} on ${P.VM.name}: install Node ${P.NODE.version}, the keeper and its timer (every 3 h at :47 past 01, 04, ... UTC)`, async () => {
    await arm("PUT", `${ids.runCmd}?api-version=${API.vm}`, body);
    const done = await until(async () => {
      const r = await arm("GET", `${ids.runCmd}?api-version=${API.vm}&$expand=instanceView`);
      const s = r.properties?.instanceView?.executionState;
      return /^(Succeeded|Failed|TimedOut|Canceled)$/.test(s || "") && r.properties.instanceView;
    }, { everyMs: 10_000, maxMs: 1_800_000, what: `${V.RUNCMD} finished` });
    for (const l of tail(done.output)) console.log(`  ${l}`);
    if (done.executionState !== "Succeeded" || done.exitCode !== 0) throw new Error(`runner: ${done.executionState}, exit ${done.exitCode}: ${V.scrubLine(String(done.error || "").split("\n").slice(-6).join(" | "))}`);
    say("runner", `${P.VM.name} runs the keeper every 3 hours; it shares the ledger lease with ${N.keeper}`);
  });
}

/** The lock targets: what the 60 days stand on. NOT raghavsharma1729-compan-resource (another project's deployments). */
async function lockTargets() {
  const rgId = (rg) => `${SUB_PATH()}/resourceGroups/${rg}`, rg = process.env.AZURE_RESOURCE_GROUP || "rg-raghavsharma1729-7190";
  const res = (name, resRg, type, why) => ({ kind: "res", name, rg: resRg, type, id: `${rgId(resRg)}/providers/${type}/${name}`, why });
  const t = [{ kind: "rg", name: P.VM.rg, rg: P.VM.rg, id: rgId(P.VM.rg), why: "the VM, its disk, NIC, VNet, NSG, the LB and the 11 public IPs" },
    res(N.registry, rg, "Microsoft.ContainerRegistry/registries", "Container Registry and the jobs' image"),
    res(N.sa, rg, "Microsoft.Storage/storageAccounts", "the ledger, the reports, the storage lane"),
    res(N.pg, N.pgRg, "Microsoft.DBforPostgreSQL/flexibleServers", "PostgreSQL"),
    res(N.env, rg, "Microsoft.App/managedEnvironments", "the environment the jobs and taxila-web run in"),
    res(N.keeper, rg, "Microsoft.App/jobs", "the keeper's ACA runner"), res(N.verify, rg, "Microsoft.App/jobs", "the verifier"),
    res(N.ag, rg, "microsoft.insights/actionGroups", "who gets the alerts"),
    ...Object.keys(RULES).map((r) => res(r, rg, "microsoft.insights/scheduledQueryRules", "an alert rule"))];
  // the Speech account: the one whose key is the keeper's primary speech key (compared in memory, never printed)
  let speech = null;
  const key = E.AZURE_SPEECH_KEY_SIN || E.AZURE_SPEECH_KEY, region = E.AZURE_SPEECH_KEY_SIN ? E.AZURE_SPEECH_REGION_SIN : E.AZURE_SPEECH_REGION;
  if (CREDS && key) {
    for (const a of (await aiAccounts()).filter((a) => a.location === region)) {
      const k = await arm("POST", `${a.id}/listKeys?api-version=${API.cog}`).catch(() => ({}));
      if ([k.key1, k.key2].includes(key)) { speech = res(a.name, a.id.split("/")[4], "Microsoft.CognitiveServices/accounts", `the Speech key's account (${a.location}; ${a.deployments.length} model deployments)`); break; }
    }
  }
  t.push(speech || { kind: "res", name: "<the Speech account behind AZURE_SPEECH_KEY_SIN>", rg, type: "Microsoft.CognitiveServices/accounts", id: null, why: "not identified" });
  return t;
}
async function locks() {
  const ACTION = "Microsoft.Authorization/locks/write";
  for (const t of await lockTargets()) {
    const label = t.kind === "rg" ? `resource group ${t.name}` : `${t.name} (${t.type.split("/").pop()})`;
    if (!t.id || !CREDS) { say("locks", `${label}: not read (${t.id ? "no credentials" : t.why}); owner step:`); for (const l of V.lockSteps(t)) console.log(`    ${l}`); continue; }
    const have = (await arm("GET", `${t.id}/providers/Microsoft.Authorization/locks?api-version=${API.locks}`, undefined, { allow404: true }).catch((e) => ({ err: e.status })));
    if (have?.err || have === null) { say("locks", `${label}: locks not readable (${have?.err || 404})`); continue; }
    if (V.lockCovered(have.value, t.id)) { say("locks", `ok: ${label} has a delete lock`); continue; }
    const perms = (await arm("GET", `${t.id}/providers/Microsoft.Authorization/permissions?api-version=${API.perms}`).catch(() => ({ value: [] }))).value || [];
    if (V.canDo(perms, ACTION)) {
      await act("locks", `create CanNotDelete lock ${V.LOCK_NAME} on ${label} (${t.why})`,
        () => arm("PUT", `${t.id}/providers/Microsoft.Authorization/locks/${V.LOCK_NAME}?api-version=${API.locks}`, { properties: { level: "CanNotDelete", notes: "M3/M4 credit unlock: do not delete (docs/design/round7/M3.md)" } }));
      continue;
    }
    say("locks", `OWNER STEP: ${label} has no delete lock, and this principal may not create one (${ACTION} is not allowed: Contributor excludes Microsoft.Authorization/*/Write). Protects ${t.why}:`);
    for (const l of V.lockSteps(t)) console.log(`    ${l}`);
  }
  say("locks", `everything inside ${P.VM.rg} (VM, disk, NIC, VNet, subnets, NSG, ${P.LB.name}, the ${P.PIPS.count} public IPs, the Run Command) is covered by the resource group's lock`);
  say("locks", "NOT locked, on purpose: raghavsharma1729-compan-resource (a delete lock there would block another project's model-deployment deletes)");
}

async function pgDownsize(sku) {
  const path = `${SUB_PATH()}/resourceGroups/${N.pgRg}/providers/Microsoft.DBforPostgreSQL/flexibleServers/${N.pg}?api-version=${API.pg}`;
  let gb = P.PG_NOW.storageGb, cur = null;
  if (CREDS) { cur = await arm("GET", path); gb = cur.properties.storage?.storageSizeGB ?? gb; }
  const chk = P.pgDownsizeCheck(sku, gb);
  if (!chk.ok) throw new Error(`--pg-downsize refused: ${chk.reason}`);
  const live = await livePrice(`pg:${sku}`).catch(() => null), liveSt = await livePrice("pg:storage").catch(() => null);
  if (live == null || liveSt == null) throw new Error(`--pg-downsize ${sku}: live retail price not readable; refusing`);
  const liveDay = live * 24 + (gb * liveSt * 24) / P.HOURS_PER_MONTH;
  if (liveDay < P.MIN_FIXED_USD_PER_DAY) throw new Error(`--pg-downsize refused: ${sku} is $${liveDay.toFixed(3)}/day live, below $${P.MIN_FIXED_USD_PER_DAY}`);
  say("pg", `${sku}: $${live}/h + ${gb} GB x $${liveSt}/GB-month = $${liveDay.toFixed(3)}/day live (table $${chk.usd}); today ${cur?.sku?.name || P.PG_NOW.sku} $${P.pgDailyUsd(cur?.sku?.name || P.PG_NOW.sku, gb) ?? "?"}/day`);
  if (cur) {
    if (cur.sku?.name === sku) return say("pg", `ok: ${N.pg} is already ${sku}`);
    const ha = cur.properties.highAvailability?.mode;
    if (ha && ha !== "Disabled") throw new Error(`${N.pg} has high availability ${ha}; Burstable does not support it (turn HA off first, by hand)`);
  }
  await act("pg", `PATCH ${N.pg} sku → ${sku} (Burstable); the server restarts once (it holds an unused copy, nothing reads it)`, async () => {
    await arm("PATCH", path, { sku: { name: sku, tier: "Burstable" } });
    await until(async () => { const s = await arm("GET", path); return s.sku?.name === sku && s.properties.state === "Ready" && s; }, { everyMs: 15_000, maxMs: 1_800_000, what: `${N.pg} on ${sku}` });
    say("pg", `${N.pg} is ${sku}, Ready`);
  });
}

let STEPS = [];
async function apply() {
  const ALL = ["guard", "image", "acr", "container", "vm", "jobs", "actiongroup", "alerts", "pips", "lb", "runner", "locks"];
  const only = opt("--only", null)?.split(",") || ALL;
  if (flag("--vm") && !only.includes("vm")) only.push("vm");   // --vm always runs (or re-checks) the VM, before the steps that sit on it
  const bad = only.filter((s) => !ALL.includes(s));
  if (bad.length) { console.error(`unknown step(s) ${bad.join(", ")}; steps: ${ALL.join(", ")}`); return 2; }
  STEPS = ALL.filter((s) => only.includes(s));   // always in ALL's order: the NIC gets its public IP before the runner needs outbound
  console.log(`m3 apply: ${DRY ? "DRY RUN (nothing changes; pass --apply)" : "APPLYING"} [${STEPS.join(", ")}]${CREDS ? "" : " — no Azure credentials: the plan is printed without reading what exists"}`);
  if (!DRY && !CREDS) { console.error("--apply needs AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID"); return 2; }
  let ag = null;
  for (const s of STEPS) {
    if (s === "guard") await guard();
    if (s === "image") await image();
    if (s === "acr") await acr();
    if (s === "container") await container();
    if (s === "vm") { if (flag("--vm")) await vm(); else say("vm", "skipped (owner-gated: pass --vm)"); }
    if (s === "jobs") await jobs();
    if (s === "actiongroup") ag = await actiongroup();
    if (s === "alerts") { if (!ag && CREDS) ag = await arm("GET", `/providers/Microsoft.Insights/actionGroups/${N.ag}?api-version=${API.insights}`, undefined, { allow404: true }); await alerts(ag); }
    if (s === "pips") await pips();
    if (s === "lb") await lb();
    if (s === "runner") await runner();
    if (s === "locks") await locks();
  }
  const pgSku = opt("--pg-downsize", null);
  if (pgSku) await pgDownsize(pgSku); else say("pg", "skipped (owner-gated: pass --pg-downsize Standard_B2s)");
  console.log(DRY ? "dry run done: nothing changed" : "done. Read back: node scripts/m3.mjs status");
  return 0;
}

const CMDS = { plan, prices, status, apply };
if (!CMDS[CMD]) {
  console.error("usage: node scripts/m3.mjs plan | prices | status [--days N] | apply [--only steps] [--apply] [--vm] [--pg-downsize SKU] [--since D] [--until D] [--start-now]");
  process.exit(2);
}
try { process.exitCode = await CMDS[CMD](); }
catch (e) { console.error(`m3 ${CMD}: ${e.message}`); process.exitCode = 1; }
