// Milestone 3 credit unlock: the operator CLI (round 7, M3; owner page docs/design/round7/M3.md; pure half
// infra/m3/plan.js). DRY RUN BY DEFAULT: `apply` prints exactly what it would create or change; `--apply` does it.
// Every step GETs first and PUTs/PATCHes only on a diff. Nothing is ever deleted (owner rule).
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
//   container    a private blob container `m3` in $AZURE_STORAGE_ACCOUNT (the keeper's ledger, the verifier's reports)
//   jobs         ACA jobs m3-keeper (cron "17 3,15 * * *") and m3-verify ("41 6 * * *") in $AZURE_CONTAINERAPPS_ENV:
//                image from taxilacr with taxila-web's registry credential, keys in the job's secret store,
//                replicaRetryLimit 2, 0.5 / 0.25 vCPU
//   actiongroup  m3-owner, whose receiver is the subscription's Owner role (armRoleReceivers; no email hard-coded)
//   alerts       scheduled query rules on the environment's Log Analytics workspace: any M3-ALERT line; no M3-OK in 26 h
// Owner-gated, OFF unless passed (they rent or change things the owner must say yes to):
//   --vm                 taxila-m3-vm, Standard_D2as_v5 Linux in centralindia, NEW resource group taxila-m3-rg, no
//                        public IP, no inbound rule, no auto-shutdown ($1.33/day + its disk under Storage)
//   --pg-downsize SKU    taxila-cin-pg → a Burstable SKU; refuses any SKU whose compute + storage < $1.25/day
// Other flags: --since D (first day the verifier alerts on; default: the job's current value, else tomorrow UTC),
//   --until D (default 2027-01-31; the keeper spends nothing after it), --models-deployment NAME (default $DEPLOY_FAST
//   or taxila-fast), --models-fallback NAME (default $DEPLOY_BRAIN or taxila-brain), --models-price in,cached,out (for a
//   deployment not in plan.js), --vm-size SIZE, --start-now (with --apply: start one keeper run right after the jobs).
//
// Needs (in .env.local or the environment; never printed): AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID,
// AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, AZURE_CONTAINERAPPS_ENV, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
// AZURE_SPEECH_REGION_SIN + AZURE_SPEECH_KEY_SIN and/or AZURE_SPEECH_REGION + AZURE_SPEECH_KEY, AZURE_STORAGE_ACCOUNT
// (+ AZURE_STORAGE_KEY, else read with listKeys). Optional M3_VERIFY_SP_CLIENT_ID / M3_VERIFY_SP_SECRET: a separate
// read-only principal for the verify job (default: the deploy principal). Run under NODE_USE_ENV_PROXY=1 here.
import { readFileSync } from "fs";
import { createHash, createHmac, generateKeyPairSync } from "crypto";
import { SUB_PATH, arm, loadEnv, sleep, until } from "../infra/azure.mjs";
import * as P from "../infra/m3/plan.js";

loadEnv();
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
  sa: E.AZURE_STORAGE_ACCOUNT || "taxilaforge", container: "m3", keeper: "m3-keeper", verify: "m3-verify", ag: "m3-owner",
  pg: E.M3_PG_NAME || P.PG_NOW.name, pgRg: E.M3_PG_RG || P.PG_NOW.rg,
};
const API = { aca: "2024-03-01", acr: "2023-07-01", st: "2023-01-01", insights: "2023-01-01", sqr: "2023-03-15-preview", ws: "2022-10-01",
  pg: "2024-08-01", net: "2023-11-01", vm: "2024-07-01", rg: "2021-04-01" };
const OWNER_ROLE = "8e3af657-a8ff-443c-a75c-2fe8c4bcb635";   // built-in "Owner"
const CRON = { keeper: "17 3,15 * * *", verify: "41 6 * * *" };
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
      j = await fetch(url, { signal: AbortSignal.timeout(30_000) }).then((r) => r.json(), (e) => ({ error: e.message }));
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
    ["7 services (--vm) + PG on B2s", { vm: true, pgSku: "Standard_B2s" }]];
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
  const vmExists = !!(await arm("GET", `${SUB_PATH()}/resourceGroups/${P.VM.rg}/providers/Microsoft.Compute/virtualMachines/${P.VM.name}?api-version=${API.vm}`, undefined, { allow404: true }).catch(() => null));
  const portfolio = P.activePortfolio({ vm: vmExists });
  const res = P.computeStreak(daily, { asOf: t, from, portfolio });
  const show = P.dayList(P.addDays(t, -15), t);
  console.log(`Cost Management, ActualCost by ServiceName, USD (${source}; billed in ${currency}); last ${show.length} days, * = not closed yet:`);
  console.log(`  ${"service".padEnd(34)}${show.map((d) => (d.slice(8) + (d > res.lastClosed ? "*" : " ")).padStart(7)).join("")}`);
  const names = [...new Set(show.flatMap((d) => Object.keys(daily[d] || {})))].sort((a, b) => (daily[res.lastClosed]?.[b] || 0) - (daily[res.lastClosed]?.[a] || 0));
  for (const s of names) {
    const cells = show.map((d) => { const v = daily[d]?.[s]; return (v == null ? "·" : v >= 1 ? v.toFixed(2) : `(${v.toFixed(2)})`).padStart(7); });
    console.log(`  ${s.slice(0, 33).padEnd(34)}${cells.join("")}`);
  }
  console.log(`  ${"services >= $1".padEnd(34)}${show.map((d) => String(Object.values(daily[d] || {}).filter((v) => v >= 1).length).padStart(7)).join("")}`);
  const s = res.streak;
  console.log(`\n60-day clock (strict: one set of >= ${P.RULE.workloads} services each >= $1 every closed day; last closed ${res.lastClosed}):`);
  console.log(s.days ? `  day ${s.days} of ${P.RULE.days}, started ${s.start}, ${s.remaining} to go, completes ${s.completes}; held: ${s.set.join(", ")}`
    : "  not running: no closed day has 5 services each >= $1");
  console.log(`  loose reading (>= 5 services each day, any): ${res.loose.days} day(s)${res.loose.start ? ` since ${res.loose.start}` : ""}`);
  const under = res.under.filter((u) => u.date > P.addDays(res.lastClosed, -7));
  if (under.length) console.log(`  portfolio under $1 in the last 7 closed days: ${under.map((u) => `${u.date} ${u.id} ${usd(u.usd)}`).join("; ")}`);
  try {
    const key = await storageKey();
    for (const name of [`ledger/${P.addDays(t, -1)}.json`, `ledger/${t}.json`, `report/${t}.json`]) {
      const r = await blobSigned("GET", name, key);
      const txt = await r.text();
      if (r.status === 404) { console.log(`  ${N.container}/${name}: none`); continue; }
      const j = JSON.parse(txt);
      if (name.startsWith("ledger")) console.log(`  ${N.container}/${name}: ${Object.entries(j.lanes || {}).map(([k, l]) => `${k} ${usd(P.laneReported(j, k))}`).join(", ")} (${(j.runs || []).length} run(s))`);
      else console.log(`  ${N.container}/${name}: ${j.ok ? "OK" : `ALERT ${j.reasons.map((x) => x.reason).join(", ")}`}; credit ${j.credits?.supported ? j.credits.balance : "unsupported"}`);
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

/** Everything the two jobs need, resolved from the environment (+ ARM when credentials exist). */
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
  let envRes = null, web = null, registries = null, regSecrets = [], current = {};
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
  }
  const curEnv = (j, k) => current[j]?.properties?.template?.containers?.[0]?.env?.find((e) => e.name === k)?.value;
  const since = opt("--since", curEnv(N.verify, "M3_SINCE") || P.addDays(today(), 1));
  const untilD = opt("--until", curEnv(N.keeper, "M3_UNTIL") || DEFAULT_UNTIL);
  const vmOn = flag("--vm") || (CREDS && !!(await arm("GET", `${SUB_PATH()}/resourceGroups/${P.VM.rg}/providers/Microsoft.Compute/virtualMachines/${P.VM.name}?api-version=${API.vm}`, undefined, { allow404: true }).catch(() => null)));
  const storageKeyV = CREDS ? await storageKey() : E.AZURE_STORAGE_KEY;
  return { fast, slow, fastPrice: priceOf(fast, priceArg), slowPrice: P.MODEL_PRICES[slow] || null, speech: uniq, envRes, web, registries, regSecrets, current, since, until: untilD, vmOn, storageKey: storageKeyV };
}

/** The two job bodies. Secret values sit in configuration.secrets; env only references them. */
function jobBodies(x) {
  const plain = (name, value) => ({ name, value: String(value) });
  const ref = (name, secretRef) => ({ name, secretRef });
  const L = P.LANES;
  const [sp1, sp2] = x.speech;
  const keeperSecrets = [{ name: "aoai-key", value: E.AZURE_OPENAI_API_KEY }, { name: "storage-key", value: x.storageKey },
    ...(sp1 ? [{ name: "speech-key", value: sp1[1] }] : []), ...(sp2 ? [{ name: "speech-fb-key", value: sp2[1] }] : []), ...x.regSecrets];
  const keeperEnv = [plain("M3_ROLE", "keeper"), plain("M3_UNTIL", x.until), plain("M3_STORAGE_ACCOUNT", N.sa), ref("M3_STORAGE_KEY", "storage-key"), plain("M3_CONTAINER", N.container),
    ...["models", "tts", "storage"].flatMap((l) => [plain(`M3_${l.toUpperCase()}_TARGET`, L[l].targetUsd), plain(`M3_${l.toUpperCase()}_CAP`, L[l].capUsd)]),
    plain("M3_AOAI_ENDPOINT", E.AZURE_OPENAI_ENDPOINT || ""), ref("M3_AOAI_KEY", "aoai-key"), plain("M3_AOAI_DEPLOYMENT", x.fast),
    plain("M3_AOAI_PRICE_IN", x.fastPrice.in), plain("M3_AOAI_PRICE_CACHED", x.fastPrice.cached), plain("M3_AOAI_PRICE_OUT", x.fastPrice.out),
    ...(x.slowPrice && x.slow !== x.fast ? [plain("M3_AOAI_FALLBACK_DEPLOYMENT", x.slow), plain("M3_AOAI_FALLBACK_PRICE_IN", x.slowPrice.in),
      plain("M3_AOAI_FALLBACK_PRICE_CACHED", x.slowPrice.cached), plain("M3_AOAI_FALLBACK_PRICE_OUT", x.slowPrice.out)] : []),
    ...(sp1 ? [plain("M3_SPEECH_REGION", sp1[0]), ref("M3_SPEECH_KEY", "speech-key")] : []),
    ...(sp2 ? [plain("M3_SPEECH_FALLBACK_REGION", sp2[0]), ref("M3_SPEECH_FALLBACK_KEY", "speech-fb-key")] : []),
    plain("M3_TTS_PRICE_PER_MCHARS", P.PRICES["tts:neural"].usd), plain("M3_STORAGE_OP_USD", P.PRICES["storage:listOp"].usd / 10_000)];
  const portfolio = P.activePortfolio({ vm: x.vmOn }).map((p) => ({ id: p.id, match: p.match }));
  const verifySecrets = [{ name: "sp-secret", value: E.M3_VERIFY_SP_SECRET || E.AZURE_SP_SECRET }, { name: "storage-key", value: x.storageKey }, ...x.regSecrets];
  const verifyEnv = [plain("M3_ROLE", "verify"), plain("AZURE_TENANT_ID", E.AZURE_TENANT_ID || ""), plain("AZURE_SUBSCRIPTION_ID", E.AZURE_SUBSCRIPTION_ID || ""),
    plain("M3_SP_CLIENT_ID", E.M3_VERIFY_SP_CLIENT_ID || E.AZURE_SP_CLIENT_ID || ""), ref("M3_SP_SECRET", "sp-secret"),
    plain("M3_STORAGE_ACCOUNT", N.sa), ref("M3_STORAGE_KEY", "storage-key"), plain("M3_CONTAINER", N.container), plain("M3_SINCE", x.since), plain("M3_UNTIL", x.until),
    plain("M3_PORTFOLIO_JSON", JSON.stringify(portfolio)), plain("M3_LANES_JSON", JSON.stringify(Object.fromEntries(Object.entries(L).map(([k, v]) => [k, { targetUsd: v.targetUsd }])))),
    plain("M3_FX_INR", E.M3_FX_INR || 96), plain("M3_DAYS", P.ALERT.queryDays), plain("M3_ALERT_DAYS", P.ALERT.alertWindowDays), plain("M3_REQUIRED", P.RULE.workloads),
    plain("M3_MIN_SERVICES", P.ALERT.minServices), plain("M3_FLOOR", P.ALERT.portfolioFloorUsd), plain("M3_OPEN_DAYS", P.ALERT.openDays)];
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

async function jobs() {
  const x = await jobInputs();
  const bodies = jobBodies(x);
  const missing = Object.entries(bodies).flatMap(([j, b]) => b.properties.configuration.secrets.filter((s) => !s.value).map((s) => `${j}:${s.name}`));
  if (!x.speech.length) missing.push("speech region/key (AZURE_SPEECH_REGION_SIN + AZURE_SPEECH_KEY_SIN, or AZURE_SPEECH_REGION + AZURE_SPEECH_KEY)");
  if (!E.AZURE_OPENAI_ENDPOINT) missing.push("AZURE_OPENAI_ENDPOINT");
  say("jobs", `models lane: ${x.fast} ($${x.fastPrice.in}/$${x.fastPrice.out} per 1M in/out)${x.slowPrice && x.slow !== x.fast ? `, fallback ${x.slow}` : ""}; ` +
    `speech: ${x.speech.map(([r]) => r).join(" → ") || "NONE"}; storage: ${N.sa}/${N.container}; since ${x.since}, until ${x.until}; portfolio ${P.activePortfolio({ vm: x.vmOn }).map((p) => p.id).join(",")}`);
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
  const who = `armRoleReceivers Owner (${OWNER_ROLE}; direct assignments only)${email ? " + emailReceiver (M3_ALERT_EMAIL)" : " (set M3_ALERT_EMAIL to also reach an Owner held through a group)"}`;
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
      "NIC taxila-m3-nic, private IP only (no public IP)"],
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

async function apply() {
  const ALL = ["guard", "image", "acr", "container", "jobs", "actiongroup", "alerts"];
  const only = opt("--only", null)?.split(",") || ALL;
  const bad = only.filter((s) => !ALL.includes(s));
  if (bad.length) { console.error(`unknown step(s) ${bad.join(", ")}; steps: ${ALL.join(", ")}`); return 2; }
  console.log(`m3 apply: ${DRY ? "DRY RUN (nothing changes; pass --apply)" : "APPLYING"}${CREDS ? "" : " — no Azure credentials: the plan is printed without reading what exists"}`);
  if (!DRY && !CREDS) { console.error("--apply needs AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID"); return 2; }
  let ag = null;
  for (const s of only) {
    if (s === "guard") await guard();
    if (s === "image") await image();
    if (s === "acr") await acr();
    if (s === "container") await container();
    if (s === "jobs") await jobs();
    if (s === "actiongroup") ag = await actiongroup();
    if (s === "alerts") { if (!ag && CREDS) ag = await arm("GET", `/providers/Microsoft.Insights/actionGroups/${N.ag}?api-version=${API.insights}`, undefined, { allow404: true }); await alerts(ag); }
  }
  if (flag("--vm")) await vm(); else say("vm", "skipped (owner-gated: pass --vm)");
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
