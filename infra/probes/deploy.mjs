// Deploy / run the probe fleet (BUILD-PLAN W1-D item 5) as ACA jobs in Central India and eastus2.
//   node infra/probes/deploy.mjs            build the image, ensure the Central India environment, the private `probes`
//                                           container and both scheduled jobs (nightly 03:10 UTC = 08:40 IST)
//   node infra/probes/deploy.mjs --run [ci|eus2|all]   start an execution now, wait, print the region's last-run.json
//   flags: --base URL (default production) · --skip-build (reuse the last image tag in node_modules/.cache)
// The jobs are NEW resources; taxila-web is only read (its ACR credentials and environment id).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { ROOT, acrBuild, arm, loadEnv, sleep, until } from "../azure.mjs";
import { PROD_BASE } from "../../tests/prod/lib.mjs";

loadEnv();
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const API = "api-version=2024-03-01";
const BASE = opt("--base", PROD_BASE);
const CACHE = ROOT + "node_modules/.cache/taxila-probe-image";
const REGIONS = {
  ci: { job: "taxila-probe-ci", env: "taxila-probes-ci", location: "centralindia", region: "central-india" },
  eus2: { job: "taxila-probe-eus2", env: "taxila-env", location: "eastus2", region: "eastus2" },
};
const SA = process.env.AZURE_STORAGE_ACCOUNT || "taxilaforge";

async function blobGet(path) {
  const { createHmac } = await import("crypto");
  const account = SA, key = process.env.AZURE_STORAGE_KEY, container = "probes";
  const headers = { "x-ms-date": new Date().toUTCString(), "x-ms-version": "2021-08-06" };
  const xms = Object.keys(headers).sort().map((h) => `${h}:${headers[h]}`).join("\n");
  const sts = ["GET", "", "", "", "", "", "", "", "", "", "", "", xms, `/${account}/${container}/${path}`].join("\n");
  const sig = createHmac("sha256", Buffer.from(key, "base64")).update(sts, "utf8").digest("base64");
  const r = await fetch(`https://${account}.blob.core.windows.net/${container}/${path}`, { headers: { ...headers, authorization: `SharedKey ${account}:${sig}` } });
  return r.ok ? r.json() : null;
}

async function run(which) {
  const keys = which === "all" ? Object.keys(REGIONS) : [which];
  await Promise.all(keys.map(async (k) => {
    const R = REGIONS[k];
    const ex = await arm("POST", `/providers/Microsoft.App/jobs/${R.job}/start?${API}`, {});
    const name = ex.name || ex.id?.split("/").pop();
    console.log(`${R.job}: execution ${name} started`);
    const st = await until(async () => {
      const e = await arm("GET", `/providers/Microsoft.App/jobs/${R.job}/executions/${name}?${API}`, undefined, { allow404: true });
      const s = e?.properties?.status;
      return ["Succeeded", "Failed", "Stopped", "Degraded"].includes(s) ? s : null;
    }, { everyMs: 10_000, maxMs: 1_200_000, what: `${R.job} ${name}` });
    const res = await blobGet(`${R.region}/last-run.json`);
    console.log(`${R.job}: ${st}\n${JSON.stringify(res, null, 1)}`);
  }));
}

async function deploy() {
  const web = await arm("GET", `/providers/Microsoft.App/containerApps/taxila-web?${API}`);
  const webSecrets = (await arm("POST", `/providers/Microsoft.App/containerApps/taxila-web/listSecrets?${API}`)).value || [];
  const registries = web.properties.configuration.registries;
  const secrets = registries.filter((r) => r.passwordSecretRef).map((r) => ({ name: r.passwordSecretRef, value: webSecrets.find((s) => s.name === r.passwordSecretRef)?.value }));
  secrets.push({ name: "storage-key", value: process.env.AZURE_STORAGE_KEY });
  if (secrets.some((s) => !s.value)) throw new Error("missing a secret value (ACR password or AZURE_STORAGE_KEY)");

  let tag = existsSync(CACHE) && argv.includes("--skip-build") ? readFileSync(CACHE, "utf8").trim() : null;
  if (!tag) {
    tag = `p${Date.now().toString(36)}`;
    console.log(`building taxila-probe:${tag}…`);
    await acrBuild({ images: [`taxila-probe:${tag}`, "taxila-probe:latest"], dockerfile: "infra/probes/Dockerfile", dir: ROOT,
      files: ["infra/azure.mjs", "infra/probes/Dockerfile", "infra/probes/probe.mjs", "infra/probes/child-answer.wav", "infra/probes/make-wav.mjs", "tests/prod/lib.mjs", "tests/prod/w1d-eyes.mjs", "tests/prod/w1a-text-voice.mjs"] });
    mkdirSync(ROOT + "node_modules/.cache", { recursive: true });
    writeFileSync(CACHE, tag);
  }
  // the private results container (never the public `forge` one)
  await arm("PUT", `/providers/Microsoft.Storage/storageAccounts/${SA}/blobServices/default/containers/probes?api-version=2023-01-01`, { properties: { publicAccess: "None" } });

  // Central India environment (consumption), logs to the same workspace as taxila-env
  const ci = REGIONS.ci;
  let env = await arm("GET", `/providers/Microsoft.App/managedEnvironments/${ci.env}?${API}`, undefined, { allow404: true });
  if (!env) {
    const la = (await arm("GET", `/providers/Microsoft.App/managedEnvironments/taxila-env?${API}`)).properties.appLogsConfiguration;
    const wsKey = la?.logAnalyticsConfiguration?.customerId
      ? (await arm("POST", `/providers/Microsoft.OperationalInsights/workspaces/taxila-logs/sharedKeys?api-version=2020-08-01`)).primarySharedKey : null;
    console.log(`creating environment ${ci.env} in ${ci.location}…`);
    await arm("PUT", `/providers/Microsoft.App/managedEnvironments/${ci.env}?${API}`, { location: ci.location, properties: {
      workloadProfiles: [{ name: "Consumption", workloadProfileType: "Consumption" }],
      ...(wsKey ? { appLogsConfiguration: { destination: "log-analytics", logAnalyticsConfiguration: { customerId: la.logAnalyticsConfiguration.customerId, sharedKey: wsKey } } } : {}) } });
    env = await until(async () => { const e = await arm("GET", `/providers/Microsoft.App/managedEnvironments/${ci.env}?${API}`); return e.properties.provisioningState === "Succeeded" && e; },
      { everyMs: 10_000, maxMs: 900_000, what: `${ci.env} provisioned` });
  }
  const envIds = { ci: env.id, eus2: web.properties.managedEnvironmentId };
  for (const [k, R] of Object.entries(REGIONS)) {
    await arm("PUT", `/providers/Microsoft.App/jobs/${R.job}?${API}`, { location: R.location, properties: { environmentId: envIds[k],
      configuration: { triggerType: "Schedule", replicaTimeout: 1200, replicaRetryLimit: 0, registries, secrets,
        scheduleTriggerConfig: { cronExpression: "10 3 * * *", parallelism: 1, replicaCompletionCount: 1 } },
      template: { containers: [{ name: "probe", image: `taxilacr.azurecr.io/taxila-probe:${tag}`, resources: { cpu: 1, memory: "2Gi" },
        env: [{ name: "TAXILA_BASE", value: BASE }, { name: "PROBE_REGION", value: R.region }, { name: "AZURE_STORAGE_ACCOUNT", value: SA },
          { name: "AZURE_STORAGE_KEY", secretRef: "storage-key" }, { name: "TAXILA_PROBE", value: "1" }] }] } } });
    console.log(`job ${R.job} (${R.location}) → taxila-probe:${tag}, nightly 03:10 UTC, base ${BASE}`);
  }
}

/**
 * --adhoc "node tests/prod/w1d-eyes.mjs" [--base URL]: run one command once from eastus2 in the probe image (a Manual
 * job, taxila-probe-adhoc), print its console lines from Log Analytics. For acceptance checks the sandbox's HTTP proxy
 * distorts (keepalive/beacon requests, UDP).
 */
async function adhoc(cmd) {
  const tag = readFileSync(CACHE, "utf8").trim();
  const web = await arm("GET", `/providers/Microsoft.App/containerApps/taxila-web?${API}`);
  const webSecrets = (await arm("POST", `/providers/Microsoft.App/containerApps/taxila-web/listSecrets?${API}`)).value || [];
  const registries = web.properties.configuration.registries;
  const secrets = registries.filter((r) => r.passwordSecretRef).map((r) => ({ name: r.passwordSecretRef, value: webSecrets.find((s) => s.name === r.passwordSecretRef)?.value }));
  await arm("PUT", `/providers/Microsoft.App/jobs/taxila-probe-adhoc?${API}`, { location: "eastus2", properties: { environmentId: web.properties.managedEnvironmentId,
    configuration: { triggerType: "Manual", replicaTimeout: 900, replicaRetryLimit: 0, registries, secrets, manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 } },
    template: { containers: [{ name: "adhoc", image: `taxilacr.azurecr.io/taxila-probe:${tag}`, command: ["sh", "-c", cmd], resources: { cpu: 1, memory: "2Gi" },
      env: [{ name: "TAXILA_BASE", value: BASE }] }] } } });
  const ex = await arm("POST", `/providers/Microsoft.App/jobs/taxila-probe-adhoc/start?${API}`, {});
  const name = ex.name || ex.id.split("/").pop();
  const st = await until(async () => { const e = await arm("GET", `/providers/Microsoft.App/jobs/taxila-probe-adhoc/executions/${name}?${API}`, undefined, { allow404: true });
    const s = e?.properties?.status; return ["Succeeded", "Failed", "Stopped", "Degraded"].includes(s) ? s : null; }, { everyMs: 10_000, maxMs: 900_000, what: name });
  console.log(`taxila-probe-adhoc ${name}: ${st} (console lines: Log Analytics, ContainerAppConsoleLogs_CL where ContainerJobName_s == "taxila-probe-adhoc")`);
}

if (argv.includes("--adhoc")) await adhoc(opt("--adhoc"));
else if (argv.includes("--run")) await run(opt("--run", "all"));
else await deploy();
void sleep;
