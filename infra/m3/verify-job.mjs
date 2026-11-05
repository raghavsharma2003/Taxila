// Milestone 3 verifier (round 7, M3; docs/design/round7/M3.md): the in-job script of the ACA job `m3-verify`, cron
// "41 6 * * *" UTC, inline in a stock node:22-slim image (`node --input-type=module -e <this file>`). Once a day it:
//   1. gets a service-principal token (client credentials) and asks Cost Management for ActualCost, Daily, by
//      ServiceName, at subscription scope, over the last 66 days (the 60-day clock needs them all; alerts look at 14);
//   2. computes the 60-day clock (strict: one set of >= 5 services each >= $1 every closed day) and the alert reasons:
//      fewer than 6 services >= $1 on a closed day, a portfolio service < $1.10, yesterday's keeper ledger missing or
//      short, the streak reset since the previous report;
//   3. tries the credit balance (Consumption balances / credits; a sponsorship offer usually answers neither, which is
//      reported, not alerted);
//   4. writes m3/report/YYYY-MM-DD.json and prints `M3-OK {summary}` or one `M3-ALERT {reason}` line per reason.
// Azure Monitor alert rules (scripts/m3.mjs apply) fire on M3-ALERT lines and on no M3-OK for 26 h.
//
// SELF-CONTAINED: fetch + node:crypto only. The pure section mirrors infra/m3/plan.js and tests/m3-plan.test.mjs checks
// it does (main runs only with M3_ROLE=verify). Never prints a key, a token or a URL with credentials.
//
// env: M3_ROLE=verify, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID, M3_SP_CLIENT_ID, M3_SP_SECRET, M3_STORAGE_ACCOUNT,
// M3_STORAGE_KEY, M3_CONTAINER (m3), M3_SINCE (first day the keeper is expected to have run; earlier days never alert),
// M3_UNTIL, M3_PORTFOLIO_JSON ([{id, match: [regex source]}]), M3_LANES_JSON ({lane: {targetUsd}}), M3_FX_INR (96),
// M3_DAYS (66), M3_ALERT_DAYS (14), M3_REQUIRED (5), M3_MIN_SERVICES (6), M3_FLOOR (1.10), M3_OPEN_DAYS (2).
import { createHmac } from "node:crypto";

// ───────────────────────────── pure (mirrors infra/m3/plan.js) ─────────────────────────────

const r4 = (x) => Math.round(x * 1e4) / 1e4;
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
export const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
export function dayList(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}
export function costQueryBody(from, to, { usd = true } = {}) {
  return { type: "ActualCost", timeframe: "Custom", timePeriod: { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` },
    dataset: { granularity: "Daily",
      aggregation: { totalCost: { name: "Cost", function: "Sum" }, ...(usd ? { totalCostUSD: { name: "CostUSD", function: "Sum" } } : {}) },
      grouping: [{ type: "Dimension", name: "ServiceName" }] } };
}
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
export function classify(day, portfolio) {
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
export function computeStreak(daily, { asOf, from = null, required = 5, threshold = 1, openDays = 2, goal = 60, portfolio = [] } = {}) {
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
export function streakReset(prev, cur) {
  const p = prev?.streak;
  if (!p || !(p.days > 0)) return false;
  if (!cur || !(cur.days > 0)) return true;
  if (cur.start === p.start) return false;
  return !(cur.windowBound && p.start < cur.start);
}
export function laneReported(ledger, id) {
  const l = ledger?.lanes?.[id];
  return l ? r4(Math.max(0, num(l.usd)) + Math.max(0, num(l.blindUsd))) : 0;
}
export function mergeBlind(ledger, blind) {
  const out = JSON.parse(JSON.stringify(ledger || { v: 1, lanes: {}, runs: [] }));
  out.lanes ||= {};
  for (const [id, l] of Object.entries(blind?.lanes || {})) (out.lanes[id] ||= { usd: 0, pendingUsd: 0 }).blindUsd = r4(num(l.usd) + num(l.pendingUsd));
  return out;
}
export function ledgerShort(ledger, lanes) {
  if (!ledger) return { missing: true, short: [] };
  const short = [];
  for (const [id, l] of Object.entries(lanes)) {
    const v = laneReported(ledger, id);
    if (v < l.targetUsd - 0.005) short.push({ lane: id, usd: v, target: l.targetUsd });
  }
  return { missing: false, short };
}
export function verifyAlerts({ result, ledger, prev, today, since = null, until = null, portfolio = [], minServices = 6, floor = 1.1, alertDays = 14 } = {}) {
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
export const scrub = (s) => String(s ?? "").replace(/\?[^\s"']*/g, "?…").replace(/[A-Za-z0-9+/=_-]{32,}/g, "…").slice(0, 200);

// ───────────────────────────── io ─────────────────────────────

const E = process.env;
const n = (k, d) => (E[k] !== undefined && E[k] !== "" && Number.isFinite(Number(E[k])) ? Number(E[k]) : d);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SA = E.M3_STORAGE_ACCOUNT, CONTAINER = E.M3_CONTAINER || "m3", XV = "2023-11-03";
const ARM = "https://management.azure.com";

function blob(method, name, { body = null, headers = {} } = {}) {
  const path = `/${CONTAINER}/${name}`;
  const buf = body == null ? null : Buffer.from(body);
  const h = { "x-ms-date": new Date().toUTCString(), "x-ms-version": XV, ...headers };
  const sts = sharedKeyStringToSign({ method, account: SA, path, headers: { ...h, ...(buf ? { "content-length": String(buf.length) } : {}) } });
  h.authorization = `SharedKey ${SA}:${createHmac("sha256", Buffer.from(E.M3_STORAGE_KEY || "", "base64")).update(sts, "utf8").digest("base64")}`;
  return fetch(`https://${SA}.blob.core.windows.net${path}`, { method, headers: h, body: buf, signal: AbortSignal.timeout(30_000) });
}
/** → parsed JSON, null when absent, or throws on a read fault. */
async function readJson(name) {
  const r = await blob("GET", name);
  const text = await r.text();
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`read ${name}: http ${r.status}`);
  return JSON.parse(text);
}
async function token() {
  const r = await fetch(`https://login.microsoftonline.com/${E.AZURE_TENANT_ID}/oauth2/v2.0/token`, { method: "POST",
    body: new URLSearchParams({ client_id: E.M3_SP_CLIENT_ID || "", client_secret: E.M3_SP_SECRET || "", grant_type: "client_credentials", scope: `${ARM}/.default` }),
    signal: AbortSignal.timeout(30_000) });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error(`token: http ${r.status} ${j.error || ""}`);
  return j.access_token;
}
async function armCall(tok, method, url, body) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(url.startsWith("https://") ? url : ARM + url, { method, headers: { authorization: `Bearer ${tok}`, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60_000) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return { status: r.status, body: j };
    if ((r.status === 429 || r.status >= 500) && attempt < 4) {
      const ra = Number(r.headers.get("x-ms-ratelimit-microsoft.costmanagement-entity-retry-after")) || Number(r.headers.get("retry-after")) || 20 * (attempt + 1);
      await sleep(Math.min(120, ra) * 1000);
      continue;
    }
    return { status: r.status, body: j, error: `${method} ${String(url).replace(ARM, "").split("?")[0].replace(/\/subscriptions\/[^/]+/, "")} ${r.status} ${scrub(j?.error?.code || j?.error?.message || "")}` };
  }
}
/** Every page of the query (nextLink is POSTed with the same body). Falls back to Cost only if CostUSD is refused. */
async function costPages(tok, from, to) {
  const url = `/subscriptions/${E.AZURE_SUBSCRIPTION_ID}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;
  for (const usd of [true, false]) {
    const body = costQueryBody(from, to, { usd });
    const pages = [];
    let next = url, err = null;
    for (let i = 0; next && i < 20; i++) {
      const r = await armCall(tok, "POST", next, body);
      if (r.error) { err = r; break; }
      pages.push(r.body.properties || {});
      next = r.body.properties?.nextLink || null;
    }
    if (!err) return { pages, usdColumn: usd };
    if (!(usd && err.status === 400)) throw new Error(err.error);
  }
  throw new Error("cost query failed");
}
/** Best effort: the balance APIs answer only some offers (EA balances, MCA credits). Never an alert. */
async function credits(tok) {
  const S = `/subscriptions/${E.AZURE_SUBSCRIPTION_ID}`;
  const tried = [];
  for (const [what, url, pick] of [
    ["Microsoft.Consumption/balances (EA)", `${S}/providers/Microsoft.Consumption/balances?api-version=2024-08-01`,
      (b) => b?.properties?.endingBalance != null && { balance: b.properties.endingBalance, currency: b.properties.currency || null }],
    ["Microsoft.Consumption/credits/balanceSummary (MCA)", `${S}/providers/Microsoft.Consumption/credits/balanceSummary?api-version=2024-08-01`,
      (b) => b?.properties?.balanceSummary?.currentBalance && { balance: b.properties.balanceSummary.currentBalance.value, currency: b.properties.balanceSummary.currentBalance.currency }],
  ]) {
    const r = await armCall(tok, "GET", url).catch((e) => ({ status: 0, error: scrub(e.message) }));
    tried.push({ what, status: r.status });
    const got = !r.error && pick(r.body);
    if (got) return { supported: true, source: what, ...got, tried };
  }
  // billing scope: the first billing account the principal can see (EA → balances, MCA → each profile's credits)
  const accts = await armCall(tok, "GET", "/providers/Microsoft.Billing/billingAccounts?api-version=2024-04-01").catch((e) => ({ status: 0, error: scrub(e.message) }));
  tried.push({ what: "Microsoft.Billing/billingAccounts", status: accts.status });
  const acct = !accts.error && (accts.body.value || [])[0];
  if (acct) {
    const type = acct.properties?.agreementType;
    const urls = type === "EnterpriseAgreement" ? [[`${acct.id}/providers/Microsoft.Consumption/balances?api-version=2024-08-01`, (b) => b?.properties?.endingBalance]]
      : ((await armCall(tok, "GET", `${acct.id}/billingProfiles?api-version=2024-04-01`).catch(() => ({ error: true }))).body?.value || []).slice(0, 2)
        .map((p) => [`${p.id}/providers/Microsoft.Consumption/credits/balanceSummary?api-version=2024-08-01`, (b) => b?.properties?.balanceSummary?.currentBalance?.value]);
    for (const [url, pick] of urls) {
      const r = await armCall(tok, "GET", url).catch((e) => ({ status: 0, error: scrub(e.message) }));
      tried.push({ what: `${type || "billing"} ${url.includes("balanceSummary") ? "credits" : "balances"}`, status: r.status });
      const v = !r.error && pick(r.body);
      if (v != null && v !== false) return { supported: true, source: `billing account (${type})`, balance: v, currency: r.body?.properties?.currency || null, tried };
    }
  }
  return { supported: false, tried, note: "no balance API answers for this offer; read the balance at microsoftazuresponsorships.com (not an alert)" };
}

export async function main(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const portfolio = JSON.parse(E.M3_PORTFOLIO_JSON || "[]"), lanes = JSON.parse(E.M3_LANES_JSON || "{}");
  const days = n("M3_DAYS", 66), from = addDays(today, -(days - 1));
  let tok, cost;
  try { tok = await token(); cost = await costPages(tok, from, today); }
  catch (e) { console.log(`M3-ALERT ${JSON.stringify({ reason: "cost-query-failed", err: scrub(e.message) })}`); return 1; }
  const { daily, currency, source } = parseCostRows(cost.pages, { fx: { INR: n("M3_FX_INR", 96) } });
  const result = computeStreak(daily, { asOf: today, from, required: n("M3_REQUIRED", 5), threshold: 1, openDays: n("M3_OPEN_DAYS", 2), goal: 60, portfolio });
  const yday = addDays(today, -1);
  let ledger = null, ledgerErr = null;
  try {
    const [main_, blind] = [await readJson(`ledger/${yday}.json`), await readJson(`ledger/${yday}.blind.json`)];
    ledger = ledgerShort(main_ || blind ? mergeBlind(main_, blind) : null, lanes);
  } catch (e) { ledgerErr = scrub(e.message); ledger = { missing: true, short: [], err: ledgerErr }; }
  let prev = null;
  for (let k = 1; k <= 3 && !prev; k++) prev = await readJson(`report/${addDays(today, -k)}.json`).catch(() => null);
  const verdict = verifyAlerts({ result, ledger, prev, today, since: E.M3_SINCE || null, until: E.M3_UNTIL || null, portfolio,
    minServices: n("M3_MIN_SERVICES", 6), floor: n("M3_FLOOR", 1.1), alertDays: n("M3_ALERT_DAYS", 14) });
  const bal = await credits(tok).catch((e) => ({ supported: false, note: scrub(e.message) }));
  const last = result.days[result.days.length - 1] || null;
  const summary = { date: today, lastClosed: result.lastClosed, streak: result.streak.days, start: result.streak.start, remaining: result.streak.remaining,
    completes: result.streak.completes, held: result.streak.set, loose: result.loose.days, servicesLastClosed: last?.n ?? null,
    credit: bal.supported ? `${bal.balance} ${bal.currency || ""}`.trim() : "unsupported", notes: verdict.notes };
  const report = { v: 1, at: now.toISOString(), date: today, since: E.M3_SINCE || null, until: E.M3_UNTIL || null, currency, source, usdColumn: cost.usdColumn,
    streak: result.streak, loose: result.loose, lastClosed: result.lastClosed, days: result.days, ledgerYesterday: ledger, credits: bal,
    ok: verdict.ok, reasons: verdict.reasons, notes: verdict.notes };
  const w = await blob("PUT", `report/${today}.json`, { body: JSON.stringify(report), headers: { "content-type": "application/json", "x-ms-blob-type": "BlockBlob" } })
    .then(async (r) => { await r.arrayBuffer().catch(() => {}); return r.status; }, (e) => scrub(e.message));
  if (w !== 201 && w !== 200) verdict.reasons.push({ reason: "report-write-failed", detail: { status: w } });
  if (!verdict.reasons.length) console.log(`M3-OK ${JSON.stringify(summary)}`);
  for (const r of verdict.reasons) console.log(`M3-ALERT ${JSON.stringify({ reason: r.reason, detail: r.detail, streak: summary.streak, start: summary.start })}`.slice(0, 7000));
  return 0;
}

if (process.env.M3_ROLE === "verify") {
  const code = await main().catch((e) => { console.log(`M3-ALERT ${JSON.stringify({ reason: "verifier-crashed", err: scrub(e.message) })}`); return 1; });
  process.exit(code);
}
