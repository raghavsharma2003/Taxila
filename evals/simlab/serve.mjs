// Sim lab: the REAL production server (server/serve.mjs) with .env.local loaded, on the Neon TEST branch.
//   NODE_USE_ENV_PROXY=1 PORT=8791 [TAXILA_TEACHER=agent] node evals/simlab/serve.mjs
// SIMLAB_SERVER_ROOT=<another checkout> serves that tree's server (a branch head under test) with this .env.local.
// Refuses to start unless DATABASE_URL is the test branch host named in SIMLAB_DB_HOST (default ep-winter-tooth).
import { readFileSync } from "fs";
const ROOT = new URL("../..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const host = process.env.SIMLAB_DB_HOST || "ep-winter-tooth";
if (!String(process.env.DATABASE_URL).includes(host)) { console.error(`simlab: DATABASE_URL is not the test branch (${host}); refusing`); process.exit(2); }
process.env.PORT ||= "8791";
process.env.TAXILA_DEBUG ||= "1";
await import(process.env.SIMLAB_SERVER_ROOT ? `${process.env.SIMLAB_SERVER_ROOT.replace(/\/$/, "")}/server/serve.mjs` : "../../server/serve.mjs");
