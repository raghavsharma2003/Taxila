// Backups (BUILD-PLAN W1-D item 3; smooth audit G3). Idempotent.
//   node infra/backups.mjs           Blob: 7-day blob soft-delete + 7-day container soft-delete on taxilaforge
//   node infra/backups.mjs --check   read back the Blob policy
// Neon (project taxila-us / royal-fire-14595065) is configured through the Neon API, not ARM: 7-day history (PITR),
// a daily snapshot schedule, `main` protected, compute suspend off on main. Those settings and the timed restore drill
// are recorded in context/inbox/w1-d.json (measurement `restore-drill-*`), and `--neon-check` reads them back when
// NEON_API_KEY is set. 7 days matches the parent promise "backups expire within 7 days" (decision dek-in-pitr-database,
// server/routes/account.js BACKUP_DAYS).
import { arm, loadEnv } from "./azure.mjs";

loadEnv();
const SA = process.env.AZURE_STORAGE_ACCOUNT || "taxilaforge";
const P = `/providers/Microsoft.Storage/storageAccounts/${SA}/blobServices/default?api-version=2023-01-01`;
const DAYS = 7;

if (process.argv.includes("--neon-check")) {
  const key = process.env.NEON_API_KEY;
  if (!key) { console.log("NEON_API_KEY not set (the Neon settings were applied through the Neon MCP connector)"); process.exit(0); }
  const pid = process.env.NEON_PROJECT_ID || "royal-fire-14595065";
  const j = await (await fetch(`https://console.neon.tech/api/v2/projects/${pid}`, { headers: { authorization: `Bearer ${key}` } })).json();
  console.log(`neon ${pid}: history_retention_seconds=${j.project?.history_retention_seconds}`);
} else if (process.argv.includes("--check")) {
  const b = await arm("GET", P);
  console.log(`${SA}: blob soft-delete ${JSON.stringify(b.properties.deleteRetentionPolicy)}, container soft-delete ${JSON.stringify(b.properties.containerDeleteRetentionPolicy)}`);
} else {
  const cur = await arm("GET", P);
  await arm("PUT", P, { properties: { ...cur.properties,
    deleteRetentionPolicy: { enabled: true, days: DAYS, allowPermanentDelete: false },
    containerDeleteRetentionPolicy: { enabled: true, days: DAYS } } });
  const b = await arm("GET", P);
  console.log(`${SA}: blob soft-delete ${b.properties.deleteRetentionPolicy.enabled} (${b.properties.deleteRetentionPolicy.days} d), container soft-delete ${b.properties.containerDeleteRetentionPolicy.enabled} (${b.properties.containerDeleteRetentionPolicy.days} d)`);
}
