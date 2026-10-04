// W1-D acceptance: eyes (BUILD-PLAN W1-D item 2). Health split, a forced 500 on the test-only route, the client error
// beacon from a real page, and (remote targets, with TAXILA_LA_WORKSPACE + the Azure SP in env) both lines arriving
// in Log Analytics within 5 min. The alert email itself is checked by a human in the owner's inbox (the alert rule
// is read back by infra/eyes.mjs --check).
import { withTestAccount, apiClient, launch, ok, warn, done, isLocal, BASE, waitFor } from "./lib.mjs";

const anon = apiClient();
const h = await anon("GET", "/api/health");
ok(h.ok === true && !("dbMs" in h), `GET /api/health is shallow (revision ${h.revision}, sha ${h.sha})`);
const r = await anon("GET", "/api/health?ready=1", undefined, [200, 503]);
ok(r.status === 200 && r.db === "ok", `readiness checks the database (${r.status} db=${r.db}, ${r.ms} ms)`);
const unauth = await anon("GET", "/api/test/boom", undefined, [401, 403]);
ok(unauth.status === 401, `the forced-500 route refuses an anonymous caller (${unauth.status})`);

let boomAt = null;
await withTestAccount(async ({ api }) => {
  boomAt = new Date();
  const b = await api("GET", "/api/test/boom", undefined, [500]);
  ok(b.status === 500 && b.error === "internal error", `a test account gets the forced 500 (body says only "${b.error}")`);
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
  const beacon = await waitFor(async () => (await laQuery(ws, `ContainerAppConsoleLogs_CL | where TimeGenerated > datetime(${since(beaconAt)}) | where Log_s has '"kind":"client_error"' | take 1`, "PT30M")).length > 0, { everyMs: 15_000, maxMs: 120_000 });
  ok(!!beacon, "the thrown client error is a beacon row in Log Analytics");
}
done();
