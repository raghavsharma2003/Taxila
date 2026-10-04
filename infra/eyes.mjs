// Eyes on Azure (BUILD-PLAN W1-D item 2; smooth audit G2): one Log Analytics workspace for the Container Apps
// environments, a daily ingestion cap, an action group that emails the owner, and the alert rules. Idempotent (PUTs).
//
//   node infra/eyes.mjs            create / update everything, print the workspace id for TAXILA_LA_WORKSPACE
//   node infra/eyes.mjs --check    read back: workspace, env attachment, action group, every rule and its state
//   node infra/eyes.mjs --test-email  fire the action group's test notification (the owner gets one email)
//
// Alerts (all email the owner, O3 = the guardian email on the subscription):
//   web-5xx            any 5xx and > 1% of API requests over 5 min      (access-log lines, server/router.js)
//   turn-p90           p90 of POST /api/lesson/turn > 3 s over 15 min (≥ 5 turns)
//   worker-liveness    no "worker heartbeat" line from taxila-worker for 15 min (enabled once the worker exists)
//   replica-restarts   RestartCount > 0 on taxila-web / taxila-worker (metric alert)
//   job-failures       a failed execution of any ACA job (forge-g2-runner, the Conductor canary/nightly, the probes)
// Cost: the workspace is PerGB2018 with a 1 GB/day cap and 30-day retention [U: ~0.1 GB/day at owner-testing scale].
import { arm, loadEnv } from "./azure.mjs";

loadEnv();
const LOC = "eastus2";
const WS = "taxila-logs", AG = "taxila-owner";
const OWNER_EMAIL = process.env.TAXILA_OWNER_EMAIL || "compliance@carbonsettle.com";
const ENVS = ["taxila-env", "taxila-forge-untrusted"];
const WS_PATH = `/providers/Microsoft.OperationalInsights/workspaces/${WS}`;
const AG_PATH = `/providers/Microsoft.Insights/actionGroups/${AG}`;
const SQR = (name) => `/providers/Microsoft.Insights/scheduledQueryRules/${name}?api-version=2023-03-15-preview`;
const MA = (name) => `/providers/Microsoft.Insights/metricAlerts/${name}?api-version=2018-03-01`;

/** KQL over the access-log lines (one JSON object per line on stdout; ContainerAppConsoleLogs_CL.Log_s). */
const ACCESS = `ContainerAppConsoleLogs_CL | where ContainerAppName_s == "taxila-web" and Log_s startswith '{"kind":"access"' | extend j = parse_json(Log_s)`;
export const RULES = {
  "taxila-web-5xx": { sev: 1, every: "PT5M", window: "PT5M", desc: "Taxila web: 5xx responses above 1% of API requests (any 5xx at owner-testing traffic)",
    query: `${ACCESS} | summarize total = count(), errors = countif(toint(j.status) >= 500) | where errors >= 1 and errors * 100.0 / total > 1 | project errors, total`, op: "GreaterThan", threshold: 0 },
  "taxila-turn-p90": { sev: 2, every: "PT5M", window: "PT15M", desc: "Taxila web: lesson turn p90 above 3 s",
    query: `${ACCESS} | where tostring(j.route) == "POST /api/lesson/turn" | summarize n = count(), p90 = percentile(toint(j.ms), 90) | where n >= 5 and p90 > 3000 | project p90, n`, op: "GreaterThan", threshold: 0 },
  "taxila-worker-liveness": { sev: 1, every: "PT5M", window: "PT15M", desc: "Taxila worker: no heartbeat for 15 minutes (the Conductor's background host is down)",
    query: `ContainerAppConsoleLogs_CL | where ContainerAppName_s == "taxila-worker" and Log_s has "worker heartbeat" | summarize n = count()`, op: "LessThan", threshold: 1, metric: "n",
    enabled: () => process.env.TAXILA_WORKER_LIVE === "1" },
  "taxila-job-failures": { sev: 2, every: "PT5M", window: "PT10M", desc: "Taxila: an Azure Container Apps job execution failed (Forge G2 runner, Conductor canary/nightly, probe fleet)",
    query: `ContainerAppSystemLogs_CL | where isnotempty(JobName_s) and (Reason_s in~ ("BackoffLimitExceeded", "DeadlineExceeded", "ProcessExited") or Log_s has_any ("execution failed", "Job failed", "exit code 1", "Error")) | where Reason_s !in~ ("Started", "Pulled", "Pulling", "Created", "SuccessfulCreate", "Completed") | summarize n = count() by JobName_s | where n > 0`, op: "GreaterThan", threshold: 0 },
};

async function workspace() {
  const ws = await arm("PUT", `${WS_PATH}?api-version=2022-10-01`, { location: LOC,
    properties: { sku: { name: "PerGB2018" }, retentionInDays: 30, workspaceCapping: { dailyQuotaGb: 1 }, features: { enableLogAccessUsingOnlyResourcePermissions: true } } });
  const keys = await arm("POST", `${WS_PATH}/sharedKeys?api-version=2020-08-01`);
  return { id: ws.id, customerId: ws.properties.customerId, key: keys.primarySharedKey };
}

async function attach(ws) {
  for (const env of ENVS) {
    const p = `/providers/Microsoft.App/managedEnvironments/${env}?api-version=2024-03-01`;
    const cur = await arm("GET", p);
    if (cur.properties.appLogsConfiguration?.logAnalyticsConfiguration?.customerId === ws.customerId) { console.log(`  ${env}: already attached`); continue; }
    await arm("PATCH", p, { properties: { appLogsConfiguration: { destination: "log-analytics", logAnalyticsConfiguration: { customerId: ws.customerId, sharedKey: ws.key } } } });
    console.log(`  ${env}: logs → ${WS}`);
  }
}

async function actionGroup() {
  return arm("PUT", `${AG_PATH}?api-version=2023-01-01`, { location: "Global",
    properties: { groupShortName: "taxila", enabled: true, emailReceivers: [{ name: "owner", emailAddress: OWNER_EMAIL, useCommonAlertSchema: true }] } });
}

const failed = [];
async function rules(ws, ag) {
  for (const [name, r] of Object.entries(RULES)) {
    const enabled = r.enabled ? r.enabled() : true;
    // a rule whose table has no rows yet is refused ("failed to resolve"); it is created on the next run, once logs flow
    await arm("PUT", SQR(name), { location: LOC, kind: "LogAlert", properties: {
      displayName: name, description: r.desc, severity: r.sev, enabled, scopes: [ws.id], evaluationFrequency: r.every, windowSize: r.window,
      criteria: { allOf: [{ query: r.query, timeAggregation: r.metric ? "Total" : "Count", ...(r.metric ? { metricMeasureColumn: r.metric } : {}),
        operator: r.op, threshold: r.threshold, failingPeriods: { numberOfEvaluationPeriods: 1, minFailingPeriodsToAlert: 1 } }] },
      autoMitigate: true, actions: { actionGroups: [ag.id] } } }).then(
      () => console.log(`  rule ${name}: ${enabled ? "enabled" : "DISABLED (enable with TAXILA_WORKER_LIVE=1 once the worker runs)"}`),
      (e) => { failed.push(name); console.log(`  rule ${name}: NOT CREATED (${e.message.slice(0, 200)})`); });
  }
  // replica restarts: a platform metric, one rule per existing app (a metric alert scope must exist)
  const apps = [];
  for (const a of ["taxila-web", "taxila-worker"]) {
    const app = await arm("GET", `/providers/Microsoft.App/containerApps/${a}?api-version=2024-03-01`, undefined, { allow404: true });
    if (app) apps.push(app.id);
  }
  await arm("PUT", MA("taxila-replica-restarts"), { location: "global", properties: {
    description: "Taxila: a container replica restarted (crash, OOM, failed liveness probe)", severity: 2, enabled: true, scopes: apps,
    evaluationFrequency: "PT5M", windowSize: "PT5M", targetResourceType: "Microsoft.App/containerApps", targetResourceRegion: LOC,
    criteria: { "odata.type": "Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria",
      allOf: [{ criterionType: "StaticThresholdCriterion", name: "restarts", metricName: "RestartCount", metricNamespace: "Microsoft.App/containerApps",
        operator: "GreaterThan", threshold: 0, timeAggregation: "Total" }] },
    autoMitigate: true, actions: [{ actionGroupId: ag.id }] } });
  console.log(`  metric alert taxila-replica-restarts on ${apps.map((x) => x.split("/").pop()).join(", ")}`);
}

async function check() {
  const ws = await arm("GET", `${WS_PATH}?api-version=2022-10-01`, undefined, { allow404: true });
  console.log(`workspace ${WS}: ${ws ? `${ws.properties.customerId} cap ${ws.properties.workspaceCapping?.dailyQuotaGb} GB/day, retention ${ws.properties.retentionInDays} d` : "MISSING"}`);
  for (const env of ENVS) {
    const e = await arm("GET", `/providers/Microsoft.App/managedEnvironments/${env}?api-version=2024-03-01`);
    console.log(`env ${env}: logs ${e.properties.appLogsConfiguration?.destination || "nowhere"} ${e.properties.appLogsConfiguration?.logAnalyticsConfiguration?.customerId === ws?.properties.customerId ? "(this workspace)" : ""}`);
  }
  const ag = await arm("GET", `${AG_PATH}?api-version=2023-01-01`, undefined, { allow404: true });
  console.log(`action group ${AG}: ${ag ? ag.properties.emailReceivers.map((r) => `${r.name} ${r.status || ""}`).join(", ") : "MISSING"}`);
  for (const name of Object.keys(RULES)) {
    const r = await arm("GET", SQR(name), undefined, { allow404: true });
    console.log(`rule ${name}: ${r ? (r.properties.enabled ? "enabled" : "disabled") : "MISSING"}`);
  }
  const m = await arm("GET", MA("taxila-replica-restarts"), undefined, { allow404: true });
  console.log(`metric alert taxila-replica-restarts: ${m ? `${m.properties.enabled ? "enabled" : "disabled"} on ${m.properties.scopes.length} app(s)` : "MISSING"}`);
}

if (process.argv.includes("--check")) await check();
else if (process.argv.includes("--test-email")) {
  const ag = await arm("GET", `${AG_PATH}?api-version=2023-01-01`);
  const r = await arm("POST", `${AG_PATH}/createNotifications?api-version=2023-01-01`, { alertType: "budget",
    emailReceivers: ag.properties.emailReceivers.map((e) => ({ name: e.name, emailAddress: e.emailAddress, useCommonAlertSchema: true })) }, { raw: true });
  console.log(`test notification requested: ${r.status}`);
} else {
  console.log(`workspace ${WS} (${LOC}, cap 1 GB/day)…`);
  const ws = await workspace();
  console.log(`  customerId ${ws.customerId}  (export TAXILA_LA_WORKSPACE=${ws.customerId})`);
  console.log("attaching environments…");
  await attach(ws);
  console.log(`action group ${AG} → owner email…`);
  const ag = await actionGroup();
  console.log("alert rules…");
  await rules(ws, ag);
  console.log(failed.length ? `done, ${failed.length} rule(s) to retry once logs flow: ${failed.join(", ")}` : "done. Read back: node infra/eyes.mjs --check");
  process.exitCode = failed.length ? 2 : 0;
}
