// Neon over HTTP (one round trip per query, no pool) — the inherited api/_db.js pattern.
import { neon } from "@neondatabase/serverless";

let _sql;
export function sql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}
/** Parameterised query → rows. */
export const q = (text, params = []) => sql().query(text, params);
/** First row or null. */
export const one = async (text, params = []) => (await q(text, params))[0] ?? null;
