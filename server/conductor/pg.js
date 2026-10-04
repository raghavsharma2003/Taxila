// The Conductor's own connection pool. server/db.js's tx() is NON-interactive (Neon HTTP cannot hold a
// transaction across round trips), but the commit (CONDUCTOR.md §3.4, X5) must read results mid-transaction
// (CAS -> has_more), so the Conductor needs an interactive transaction:
//   - DB_DRIVER=pg (Azure Container Apps): node-postgres over TCP, the same driver as server/db.js;
//   - otherwise: @neondatabase/serverless Pool over WebSocket (pg-compatible API, works through HTTPS proxies).
// The worker passes the DIRECT (unpooled) URL: Neon's pooler drops session advisory locks (X1).
import { dbUrl } from "../db.js";

/** @typedef {{ query: (text: string, params?: unknown[]) => Promise<{ rows: any[], rowCount: number }>, release: (e?: unknown) => void }} PgClient */

let cfg = { url: null, driver: null, max: null, statementTimeoutMs: null };
let _pool = null;

/** Point the Conductor at a database (tests, the worker's direct URL). Resets the pool. */
/** statementTimeoutMs: `set statement_timeout` on every new pool connection (the worker, on the DIRECT URL). */
export async function configure({ url, driver, max, statementTimeoutMs } = {}) {
  if (_pool) await closePool();
  cfg = { url: url ?? null, driver: driver ?? null, max: max ?? null, statementTimeoutMs: statementTimeoutMs ?? null };
}
const withTimeout = (pool) => {
  const ms = Math.floor(Number(cfg.statementTimeoutMs) || 0);
  // queued before any caller query on that client, so every statement on it runs under the timeout
  if (ms > 0) pool.on("connect", (c) => { c.query(`set statement_timeout = ${ms}`).catch((e) => console.error("[conductor] statement_timeout", e.message)); });
  return pool;
};

/** The unpooled Neon endpoint for a pooled URL (host `ep-x-pooler.…` → `ep-x.…`). */
export const directUrl = (url) => url.replace(/(ep-[a-z0-9-]+?)-pooler\./, "$1.");

// unconfigured (the web process): the same database server/db.js resolved, TAXILA_DB=test included
const urlNow = () => cfg.url || dbUrl();
const driverNow = () => cfg.driver || (process.env.DB_DRIVER === "pg" ? "pg" : "neon-ws");

async function makePool() {
  const url = urlNow();
  if (!url) throw new Error("DATABASE_URL not set");
  const max = Number(cfg.max || process.env.CONDUCTOR_POOL_MAX || 5);
  if (driverNow() === "pg") {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: url.replace(/[?&]channel_binding=require/, (m) => (m[0] === "?" ? "?" : "")),
      max, idleTimeoutMillis: 60_000, connectionTimeoutMillis: 10_000, ssl: { rejectUnauthorized: true } });
    pool.on("error", (e) => console.error("[conductor] pg pool error", e.message));
    return withTimeout(pool);
  }
  const { Pool } = await import("@neondatabase/serverless");
  const pool = new Pool({ connectionString: url, max, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 15_000 });
  pool.on("error", (e) => console.error("[conductor] neon pool error", e.message));
  return withTimeout(pool);
}

export async function pool() {
  if (!_pool) _pool = makePool().catch((e) => { _pool = null; throw e; });
  return _pool;
}

export async function closePool() {
  const p = _pool; _pool = null;
  if (p) await (await p).end().catch(() => {});
}

/** Parameterised query on the Conductor pool → rows. */
export async function q(text, params = []) { return (await (await pool()).query(text, params)).rows; }
export async function one(text, params = []) { return (await q(text, params))[0] ?? null; }

/**
 * Run fn(t) inside ONE interactive transaction. t.q/t.one read results mid-transaction. Any throw rolls back.
 * readOnly: `begin transaction read only`, so Postgres itself refuses any write (25006) — replay uses it (I-R9).
 * @template T @param {(t: { q: typeof q, one: typeof one }) => Promise<T>} fn @returns {Promise<T>}
 */
export async function withTx(fn, { readOnly = false } = {}) {
  const c = await (await pool()).connect();
  let broken = false;
  try {
    await c.query(readOnly ? "begin transaction read only" : "begin");
    const t = {
      q: async (text, params = []) => (await c.query(text, params)).rows,
      one: async (text, params = []) => (await c.query(text, params)).rows[0] ?? null,
    };
    const out = await fn(t);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback").catch(() => { broken = true; });
    throw e;
  } finally {
    c.release(broken || undefined);
  }
}

/**
 * A dedicated session connection outside the pool (the ticker's advisory lock lives as long as it does).
 * Must be the DIRECT URL in production.
 */
export async function sessionClient(url = urlNow()) {
  if (!url) throw new Error("DATABASE_URL not set");
  if (driverNow() === "pg") {
    const { default: pg } = await import("pg");
    const c = new pg.Client({ connectionString: url.replace(/[?&]channel_binding=require/, (m) => (m[0] === "?" ? "?" : "")),
      ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 10_000 });
    await c.connect();
    return c;
  }
  const { Client } = await import("@neondatabase/serverless");
  const c = new Client({ connectionString: url });
  await c.connect();
  return c;
}

/** Postgres SQLSTATEs the commit retries from a fresh lease read (X29: deadlock is treated like serialization). */
export const RETRYABLE = new Set(["40001", "40P01"]);
