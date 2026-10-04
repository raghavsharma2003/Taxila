// CLI for the @taxila.test account sweep (BUILD-PLAN W1-D item 6). The sweep itself is server/conductor/sweep.js (the
// nightly ACA job runs it from the worker image: `node server/conductor/ops.mjs --nightly`).
//
//   node scripts/sweep-test-accounts.mjs [--db test|prod] [--older-than-min 60] [--limit 500] [--apply]
//
// Default is a DRY RUN on the TEST branch (prints what would go). --apply deletes. --db prod targets production.
import { loadEnv } from "../infra/azure.mjs";
import { sweepTestAccounts } from "../server/conductor/sweep.js";

export { sweepTestAccounts };

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  const db = opt("--db", "test");
  const url = db === "prod" ? process.env.DATABASE_URL : (process.env.CONDUCTOR_TEST_DATABASE_URL || process.env.TEST_DATABASE_URL);
  if (!url) throw new Error(`no database url for --db ${db}`);
  const r = await sweepTestAccounts({ url, olderThanMin: Number(opt("--older-than-min", "60")), limit: Number(opt("--limit", "500")), apply: argv.includes("--apply") });
  process.exitCode = r.failed ? 1 : 0;
}
