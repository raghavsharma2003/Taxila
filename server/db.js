// Two drivers behind one interface:
// - long-lived host (Azure Container Apps, DB_DRIVER=pg): a persistent pg Pool — one TLS handshake per pooled
//   connection instead of one HTTPS request per query (Neon HTTP measured ~230 ms/query from eastus2).
// - serverless / sandbox (default): Neon SQL-over-HTTP (the inherited api/_db.js pattern; works through HTTPS proxies).
import { neon } from "@neondatabase/serverless";

let _query;
async function driver() {
  if (_query) return _query;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (process.env.DB_DRIVER === "pg") {
    const { default: pg } = await import("pg");
    // node-postgres does not implement channel_binding; TLS is still enforced (sslmode=require + verify)
    const pool = new pg.Pool({ connectionString: url.replace(/[?&]channel_binding=require/, (m) => (m[0] === "?" ? "?" : "")),
      max: Number(process.env.DB_POOL_MAX || 10), idleTimeoutMillis: 60_000, ssl: { rejectUnauthorized: true } });
    pool.on("error", (e) => console.error("pg pool error", e.message));
    _query = async (text, params) => (await pool.query(text, params)).rows;
  } else {
    const sql = neon(url);
    _query = (text, params) => sql.query(text, params);
  }
  return _query;
}
/** Parameterised query → rows. */
export const q = async (text, params = []) => (await driver())(text, params);
/** First row or null. */
export const one = async (text, params = []) => (await q(text, params))[0] ?? null;
