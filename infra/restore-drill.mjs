// The restore drill (BUILD-PLAN W1-D item 3): prove a Neon branch made from production can serve the app.
//   1) make the branch (Neon console / API / MCP create_branch, from main at a timestamp or HEAD);
//   2) node infra/restore-drill.mjs <branch-url>   compares row counts of the key tables against DATABASE_URL (prod),
//      boots server/serve.mjs on the branch, and checks /api/health?ready=1 answers db=ok; prints every step's time;
//   3) to actually fail over: set taxila-web's database-url secret to the branch URL in scripts/deploy-azure.mjs's
//      deploy (or the portal), deploy, and keep the branch protected.
// Read-only on both databases.
import { spawn } from "child_process";
import { loadEnv, ROOT } from "./azure.mjs";

loadEnv();
const branchUrl = process.argv[2];
if (!branchUrl) throw new Error("usage: node infra/restore-drill.mjs <branch-postgres-url>");
const t0 = Date.now();
const mark = (s) => console.log(`[+${((Date.now() - t0) / 1000).toFixed(1)} s] ${s}`);
const { neon } = await import("@neondatabase/serverless");
const TABLES = ["guardian", "child", "lesson", "turn", "kt_evidence", "consent", "schema_migrations"];
const count = async (url) => Object.fromEntries(await Promise.all(TABLES.map(async (t) => [t, (await neon(url).query(`select count(*)::int n from ${t}`))[0].n])));
const [a, b] = await Promise.all([count(process.env.DATABASE_URL), count(branchUrl)]);
const diff = TABLES.filter((t) => a[t] !== b[t]);
mark(`row counts prod vs branch: ${TABLES.map((t) => `${t} ${a[t]}/${b[t]}`).join(", ")}${diff.length ? ` (differ: ${diff.join(", ")}: writes since the branch point)` : " (identical)"}`);
const port = 5000 + Math.floor(Math.random() * 900);
const srv = spawn(process.execPath, [ROOT + "server/serve.mjs"], { env: { ...process.env, DATABASE_URL: branchUrl, PORT: String(port), TAXILA_DIST: ROOT + "dist" }, stdio: "ignore" });
try {
  let h = null;
  for (let i = 0; i < 60 && !(h?.db === "ok"); i++) {
    await new Promise((r) => setTimeout(r, 500));
    h = await fetch(`http://127.0.0.1:${port}/api/health?ready=1`).then((r) => r.json()).catch(() => null);
  }
  mark(`server on the branch: ready=${h?.db ?? "no answer"}`);
  const g = await fetch(`http://127.0.0.1:${port}/api/me`).then((r) => r.status).catch(() => 0);
  mark(`GET /api/me → ${g} (401 = the app reads the restored auth tables)`);
  process.exitCode = h?.db === "ok" ? 0 : 1;
} finally { srv.kill(); }
