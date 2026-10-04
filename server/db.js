// Two drivers behind one interface:
// - long-lived host (Azure Container Apps, DB_DRIVER=pg): a persistent pg Pool — one TLS handshake per pooled
//   connection instead of one HTTPS request per query (Neon HTTP measured ~230 ms/query from eastus2).
// - serverless / sandbox (default): Neon SQL-over-HTTP (the inherited api/_db.js pattern; works through HTTPS proxies).
import { neon } from "@neondatabase/serverless";

let _driver;
/**
 * Idle pooled connections live 10 min (smooth G10: at 60 s the first turn after a child paused a minute paid a new TLS
 * handshake to Neon, 101 ms vs 7 ms warm). Neon's own idle limit is far longer; the pool is per replica, max 10.
 */
const IDLE_MS = Number(process.env.DB_POOL_IDLE_MS || 600_000);
/**
 * THE one place a server process resolves its database (BUILD-PLAN W1-D item 3). server/db.js, the Conductor pool
 * (conductor/pg.js), the worker and the ops jobs all call this, so one knob moves all of them together:
 *   TAXILA_DB=test   the Neon TEST branch (CONDUCTOR_TEST_DATABASE_URL, else TEST_DATABASE_URL), whatever
 *                    DATABASE_URL / DATABASE_URL_DIRECT say. Throws if no test url is set: never falls back to prod.
 *   otherwise        DATABASE_URL (direct: DATABASE_URL_DIRECT first). Production never sets TAXILA_DB.
 * Before this, only db.js honoured TAXILA_DB, so a process with TAXILA_DB=test wrote lessons to the test branch while
 * its Conductor read and stepped production (W1-D fixer review).
 * @param {NodeJS.ProcessEnv} [env] @param {{ direct?: boolean }} [o]
 */
export function dbUrl(env = process.env, { direct = false } = {}) {
  if (env.TAXILA_DB === "test") {
    const u = env.CONDUCTOR_TEST_DATABASE_URL || env.TEST_DATABASE_URL;
    if (!u) throw new Error("TAXILA_DB=test but no CONDUCTOR_TEST_DATABASE_URL / TEST_DATABASE_URL is set");
    return u;
  }
  if (env.TAXILA_DB && env.TAXILA_DB !== "prod") throw new Error(`TAXILA_DB=${env.TAXILA_DB}: expected test or prod`);
  return (direct && env.DATABASE_URL_DIRECT) || env.DATABASE_URL;
}
async function driver() {
  if (_driver) return _driver;
  const url = dbUrl();
  if (!url) throw new Error("DATABASE_URL not set");
  if (process.env.DB_DRIVER === "pg") {
    const { default: pg } = await import("pg");
    // node-postgres does not implement channel_binding; TLS is still enforced (sslmode=require + verify)
    const pool = new pg.Pool({ connectionString: url.replace(/[?&]channel_binding=require/, (m) => (m[0] === "?" ? "?" : "")),
      max: Number(process.env.DB_POOL_MAX || 10), idleTimeoutMillis: IDLE_MS,
      // TCP keepalive under the idle window: Azure's outbound SNAT drops an idle flow after ~4 min [V Azure LB docs],
      // which would turn a 10-min idle connection into a hung first query instead of a warm one.
      keepAlive: true, keepAliveInitialDelayMillis: 30_000, ssl: { rejectUnauthorized: true } });
    pool.on("error", (e) => console.error("pg pool error", e.message));
    _driver = {
      query: async (text, params) => (await pool.query(text, params)).rows,
      tx: async (stmts) => {
        const c = await pool.connect();
        try {
          await c.query("begin");
          const out = [];
          for (const s of stmts) out.push((await c.query(s.text, s.params)).rows);
          await c.query("commit");
          return out;
        } catch (e) {
          await c.query("rollback").catch(() => {});
          throw e;
        } finally {
          c.release();
        }
      },
    };
  } else {
    const sql = neon(url);
    _driver = {
      query: (text, params) => sql.query(text, params),
      tx: (stmts) => sql.transaction((txn) => stmts.map((s) => txn.query(s.text, s.params))),
    };
  }
  return _driver;
}
/** Parameterised query → rows. */
export const q = async (text, params = []) => (await driver()).query(text, params);
/** First row or null. */
export const one = async (text, params = []) => (await q(text, params))[0] ?? null;
/**
 * Run statements ({ text, params }) as ONE non-interactive transaction → rows per statement. Any error rolls
 * every statement back. Non-interactive (Neon HTTP cannot hold a transaction open across round trips), so a
 * statement cannot read an earlier one's result in JS: use subqueries, or a guard statement that raises
 * (see guardStmt) to abort the whole batch.
 */
export const tx = async (stmts) => (stmts.length ? (await driver()).tx(stmts) : []);
/** Postgres division_by_zero: what a guard statement raises when the row it guards was not there. */
export const GUARD_FAILED = "22012";
/**
 * A statement that aborts its transaction unless `text` (a data-modifying statement with RETURNING) touched
 * at least one row: `select 1 / count(*)` over it raises division_by_zero (GUARD_FAILED) on zero rows.
 */
export const guardStmt = (text, params) => ({ text: `with g as (${text}) select 1 / count(*) as ok from g`, params });
