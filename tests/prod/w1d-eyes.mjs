// W1-D acceptance: eyes (BUILD-PLAN W1-D item 2). Health split, a forced 500 on the test-only route, the client error
// beacon from a real page, and (remote targets, with TAXILA_LA_WORKSPACE + the Azure SP in env) both lines arriving
// in Log Analytics within 5 min, scrubbed, and the 5xx alert's FIRED state read back from Azure Monitor (the email
// itself still lands in the owner's inbox; the fired alert is what sends it). A render crash on a route (a lazy page
// chunk that throws) must reach the beacon as kind `react` (React 19 onCaughtError, src/main.tsx).
// Needs TAXILA_OPS_KEY (the operator key, .env.local; deploy-azure.mjs stores it on the app) for the forced 500.
// The alert read-back polls up to 10 min: run with `run.mjs --timeout 900` against Azure.
import { withTestAccount, apiClient, launch, ok, warn, done, isLocal, BASE, waitFor } from "./lib.mjs";

const anon = apiClient();
const h = await anon("GET", "/api/health");
ok(h.ok === true && !("dbMs" in h), `GET /api/health is shallow (revision ${h.revision}, sha ${h.sha})`);
const r = await anon("GET", "/api/health?ready=1", undefined, [200, 503]);
ok(r.status === 200 && r.db === "ok", `readiness checks the database (${r.status} db=${r.db}, ${r.ms} ms)`);
const unauth = await anon("GET", "/api/test/boom", undefined, [401, 403]);
ok(unauth.status === 401, `the forced-500 route refuses an anonymous caller (${unauth.status})`);
const OPS = process.env.TAXILA_OPS_KEY;
if (!OPS) ok(false, "TAXILA_OPS_KEY is set (the forced 500 needs the operator key)");

let boomAt = null;
await withTestAccount(async ({ api }) => {
  const nokey = await api("GET", "/api/test/boom", undefined, [403, 429, 500]);
  ok(nokey.status === 403, `a test account WITHOUT the operator key is refused (${nokey.status})`);
  if (!OPS) return;
  boomAt = new Date();
  const b = await api("GET", "/api/test/boom", undefined, [500, 429], { "x-taxila-ops": OPS });
  ok(b.status === 500 && b.error === "internal error", `a test account with the operator key gets the forced 500 (${b.status}, body says only "${b.error}")`);
}, { tag: "w1d-eyes", controls: null });

// the beacon, from a real page: an uncaught error in the app posts one report
const { browser, page } = await launch();
let beaconAt = null;
try {
  await page.goto(BASE + "/", { waitUntil: "load", timeout: 60_000 });
  const req = page.waitForRequest((q) => q.url().endsWith("/api/client-error") && q.method() === "POST", { timeout: 15_000 }).catch(() => null);
  beaconAt = new Date();
  await page.evaluate(() => setTimeout(() => { throw new TypeError("w1d beacon probe 'with a quoted span' 12345"); }, 0));
  const sent = await req;
  ok(!!sent, "an uncaught page error sends POST /api/client-error");
  if (sent) {
    const raw = sent.postDataBuffer()?.toString() || sent.postData() || "";
    if (raw) {
      const body = JSON.parse(raw);
      ok(body.name === "TypeError" && body.kind === "error", `beacon body: ${body.kind} ${body.name} on ${body.path}`);
    } else ok(false, "the beacon request carried a body");
    const res = await sent.response();
    ok(res?.status() === 204, `beacon answered ${res?.status()}`);
  }
} finally { await browser.close(); }

// a render crash: the /promises page chunk throws on load, React Router's errorElement catches it, and React 19's
// onCaughtError (src/main.tsx) posts a `react` beacon. Without that hook the route error never reached the beacon.
const crash = await launch();
let crashAt = null;
try {
  await crash.page.route(/\/assets\/Public-[\w-]+\.js(\?|$)/, (route) => route.fulfill({ status: 200, contentType: "text/javascript",
    body: 'throw new TypeError("w1d render crash probe");' }));
  const req = crash.page.waitForRequest((q) => q.url().endsWith("/api/client-error") && q.method() === "POST" && /"kind":"react"/.test(q.postData() || ""), { timeout: 30_000 }).catch(() => null);
  crashAt = new Date();
  await crash.page.goto(BASE + "/promises", { waitUntil: "load", timeout: 60_000 });
  const sent = await req;
  ok(!!sent, "a render crash on a route (lazy chunk throws, errorElement shown) sends a `react` beacon");
  if (sent) {
    const body = JSON.parse(sent.postData() || "{}");
    ok(body.kind === "react" && body.path === "/promises", `react beacon: ${body.name} on ${body.path}`);
    ok((await sent.response())?.status() === 204, "react beacon answered 204");
  }
} finally { await crash.browser.close(); }

// Log Analytics: the 500 and the beacon land within 5 min (remote targets only)
const ws = process.env.TAXILA_LA_WORKSPACE;
if (isLocal) warn("local target: Log Analytics checks run only against Azure");
else if (!ws) warn("TAXILA_LA_WORKSPACE not set: Log Analytics arrival not checked");
else {
  const { laQuery, loadEnv } = await import("../../infra/azure.mjs");
  loadEnv();
  const since = (d) => d.toISOString();
  const five = await waitFor(async () => (await laQuery(ws, `ContainerAppConsoleLogs_CL | where TimeGenerated > datetime(${since(boomAt)}) | where Log_s has '"kind":"access"' and Log_s has 'GET /api/test/boom' and Log_s has '"status":500' | take 1`, "PT30M")).length > 0, { everyMs: 15_000, maxMs: 300_000 });
  ok(!!five, `the forced 500 is in Log Analytics (found ${Math.round((Date.now() - boomAt.getTime()) / 1000)} s after the request; polled every 15 s)`);
  // the probe's OWN row (its message's unquoted words), and it must have lost the quoted span and the number
  const row = await waitFor(async () => (await laQuery(ws, `ContainerAppConsoleLogs_CL | where TimeGenerated > datetime(${since(beaconAt)}) | where Log_s has '"kind":"client_error"' and Log_s has 'w1d beacon probe' | project Log_s | take 1`, "PT30M"))[0], { everyMs: 15_000, maxMs: 180_000 });
  ok(!!row, "the thrown client error is a beacon row in Log Analytics (matched by the probe's own message)");
  if (row) {
    const raw = Object.values(row).find((v) => typeof v === "string" && v.includes("client_error")) || "";
    const line = (() => { try { return JSON.parse(raw.slice(raw.indexOf("{"))); } catch { return null; } })();
    ok(line?.name === "TypeError" && line?.type === "error", `the row is the probe's: ${line?.type} ${line?.name}`);
    ok(!raw.includes("quoted span") && !raw.includes("12345"), "the row is scrubbed (no quoted span, no 3+ digit number)");
  }
  const react = await waitFor(async () => (await laQuery(ws, `ContainerAppConsoleLogs_CL | where TimeGenerated > datetime(${since(crashAt)}) | where Log_s has '"kind":"client_error"' and Log_s has '"type":"react"' and Log_s has 'w1d render crash probe' | take 1`, "PT30M")).length > 0, { everyMs: 15_000, maxMs: 180_000 });
  ok(!!react, "the render crash is a `react` beacon row in Log Analytics");
  // the 5xx alert FIRED (which is what emails the owner): Azure Monitor's alert instances for the rule since the 500
  if (boomAt) {
    const { arm, SUB_PATH, RG_PATH } = await import("../../infra/azure.mjs");
    const rule = `${RG_PATH()}/providers/Microsoft.Insights/scheduledQueryRules/taxila-web-5xx`;
    const fired = await waitFor(async () => {
      const r = await arm("GET", `${SUB_PATH()}/providers/Microsoft.AlertsManagement/alerts?api-version=2019-05-05-preview&timeRange=1h&alertRule=${encodeURIComponent(rule)}`);
      return (r.value || []).find((a) => Date.parse(a.properties?.essentials?.startDateTime || 0) >= boomAt.getTime() - 60_000);
    }, { everyMs: 30_000, maxMs: 600_000 });
    ok(!!fired, `the 5xx alert fired after the forced 500 (${fired ? `${fired.properties.essentials.monitorCondition} at ${fired.properties.essentials.startDateTime}` : "no alert instance in 10 min"}); its action group emails the owner`);
  }
}
done();
