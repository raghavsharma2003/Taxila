// Deploy the pushed branch to Azure Container Apps:
//   1) ACR builds the image from the GitHub branch (no local Docker), tagged with the commit sha;
//   2) the Container App `taxila-web` gets a new revision on that tag;
//   3) waits for /api/health on the new revision.
// Needs AZURE_SP_CLIENT_ID / AZURE_SP_SECRET / AZURE_TENANT_ID (+ .env.local). Push before deploying —
// ACR builds what is on GitHub, not your working tree.
import { execSync } from "child_process";
import { readFileSync } from "fs";
const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const { AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID: SUB, AZURE_RESOURCE_GROUP: RGN } = process.env;
if (!AZURE_SP_CLIENT_ID || !AZURE_SP_SECRET || !AZURE_TENANT_ID) throw new Error("set AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID in .env.local");
const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT }).toString().trim();
const sha = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
const remote = execSync(`git ls-remote origin refs/heads/${branch}`, { cwd: ROOT }).toString().slice(0, 7);
if (remote !== sha) throw new Error(`HEAD ${sha} is not pushed (origin has ${remote}) — push first`);

const tok = (await (await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, { method: "POST",
  body: new URLSearchParams({ client_id: AZURE_SP_CLIENT_ID, client_secret: AZURE_SP_SECRET, grant_type: "client_credentials", scope: "https://management.azure.com/.default" }) })).json()).access_token;
const RG = `https://management.azure.com/subscriptions/${SUB}/resourceGroups/${RGN}`;
const arm = async (method, path, body) => {
  const r = await fetch(RG + path, { method, headers: { authorization: `Bearer ${tok}`, "content-type": "application/json", ...(body ? {} : { "content-length": "0" }) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${method} ${path} ${r.status} ${JSON.stringify(j).slice(0, 300)}`); return j;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`building taxila-web:${sha} from ${branch}…`);
const run = await arm("POST", "/providers/Microsoft.ContainerRegistry/registries/taxilacr/scheduleRun?api-version=2019-06-01-preview", {
  type: "DockerBuildRequest", imageNames: [`taxila-web:${sha}`, "taxila-web:latest"], isPushEnabled: true,
  sourceLocation: `https://github.com/raghavsharma2003/Taxila.git#${branch}`, dockerFilePath: "Dockerfile",
  platform: { os: "Linux", architecture: "amd64" }, timeout: 1800 });
const runId = run.properties.runId;
let st;
do { await sleep(10000); st = (await arm("GET", `/providers/Microsoft.ContainerRegistry/registries/taxilacr/runs/${runId}?api-version=2019-06-01-preview`)).properties.status; process.stdout.write(`  ${st}\n`); }
while (["Queued", "Started", "Running"].includes(st));
if (st !== "Succeeded") {
  const { logLink } = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/taxilacr/runs/${runId}/listLogSasUrl?api-version=2019-06-01-preview`);
  console.error((await (await fetch(logLink)).text()).split("\n").slice(-40).join("\n")); process.exit(1);
}
const app = await arm("GET", "/providers/Microsoft.App/containerApps/taxila-web?api-version=2024-03-01");
app.properties.template.containers[0].image = `taxilacr.azurecr.io/taxila-web:${sha}`;
await arm("PATCH", "/providers/Microsoft.App/containerApps/taxila-web?api-version=2024-03-01", { properties: { template: app.properties.template } });
const fqdn = app.properties.configuration.ingress.fqdn;
for (let i = 0; i < 40; i++) {
  await sleep(6000);
  const a = await arm("GET", "/providers/Microsoft.App/containerApps/taxila-web?api-version=2024-03-01");
  if (a.properties.provisioningState === "Succeeded" && a.properties.template.containers[0].image.endsWith(sha)) {
    const h = await fetch(`https://${fqdn}/api/health`).then((r) => r.status).catch(() => 0);
    if (h === 200) { console.log(`live: https://${fqdn}  (image ${sha})`); process.exit(0); }
  }
}
throw new Error("revision did not become healthy in time");
