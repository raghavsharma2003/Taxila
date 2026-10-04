// A throwaway copy of taxila-web for exercising scripts/deploy-azure.mjs (canary, traffic, --rollback) without touching
// production: same environment and image, the Neon TEST branch as its database, single revision mode, own FQDN.
//   node infra/scratch-web.mjs --create [--image-tag aa263ce]   |   node infra/scratch-web.mjs --delete
import { arm, loadEnv, until } from "./azure.mjs";

loadEnv();
const API = "api-version=2024-03-01", NAME = process.argv.includes("--name") ? process.argv[process.argv.indexOf("--name") + 1] : "taxila-gatetest";
const P = `/providers/Microsoft.App/containerApps/${NAME}?${API}`;
if (NAME === "taxila-web") throw new Error("never taxila-web");
if (process.argv.includes("--delete")) {
  await arm("DELETE", P).catch((e) => console.log(e.message));
  console.log(`deleted ${NAME}`);
} else {
  const tagI = process.argv.indexOf("--image-tag");
  const web = await arm("GET", `/providers/Microsoft.App/containerApps/taxila-web?${API}`);
  const sec = (await arm("POST", `/providers/Microsoft.App/containerApps/taxila-web/listSecrets?${API}`)).value;
  const secrets = sec.map(({ name, value }) => ({ name, value: name === "database-url" ? process.env.CONDUCTOR_TEST_DATABASE_URL : value }));
  const tpl = JSON.parse(JSON.stringify(web.properties.template));
  if (tagI > 0) tpl.containers[0].image = `taxilacr.azurecr.io/taxila-web:${process.argv[tagI + 1]}`;
  tpl.revisionSuffix = `g${Date.now().toString(36).slice(-6)}`;
  tpl.scale = { minReplicas: 1, maxReplicas: 1, rules: [] };
  const c = web.properties.configuration;
  await arm("PUT", P, { location: web.location, properties: { managedEnvironmentId: web.properties.managedEnvironmentId,
    configuration: { activeRevisionsMode: "Single", registries: c.registries, secrets, ingress: { external: true, targetPort: 8080, transport: "Auto", traffic: [{ weight: 100, latestRevision: true }] } },
    template: tpl } });
  const a = await until(async () => { const x = await arm("GET", P); return x.properties.provisioningState === "Succeeded" && x; }, { everyMs: 6000, maxMs: 600_000, what: NAME });
  console.log(`${NAME}: https://${a.properties.configuration.ingress.fqdn} (revision ${a.properties.latestReadyRevisionName})`);
}
