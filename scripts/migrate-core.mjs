// Round 7, stream G (platform-migrate-tooling): the logic of scripts/migrate.mjs, kept free of process state so it can be
// tested without a database. The CLI (scripts/migrate.mjs) wires it to a real client.
//   - the TARGET: TAXILA_DB=test by default (server/db.js dbUrl), production only with --prod (open-migrate-default-test-branch:
//     the old script read DATABASE_URL, i.e. production, whenever it ran);
//   - each migration file runs in ONE transaction together with its schema_migrations row, so a file is applied whole or
//     not at all (the old script ran statement by statement: a failure mid-file left it half-applied and unrecorded);
//   - statements are split with dollar-quote, string and comment awareness ($$ ... $$ function bodies are one statement).
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { dbUrl } from "../server/db.js";

/**
 * Split a SQL file into statements on top-level semicolons: never inside '...' / "..." strings, $tag$ ... $tag$ bodies,
 * -- line comments or /* block *\/ comments. Comment-only fragments are dropped. PURE.
 * @param {string} body @returns {string[]}
 */
export function splitSql(body) {
  const s = String(body ?? "");
  const out = [];
  let cur = "", i = 0;
  const push = () => { const t = cur.replace(/^(\s*--[^\n]*\n?|\s+)+/, "").trim(); if (t && !/^(--[^\n]*\s*)+$/.test(t)) out.push(t); cur = ""; };
  while (i < s.length) {
    const c = s[i], two = s.slice(i, i + 2);
    if (two === "--") { const e = s.indexOf("\n", i); const end = e < 0 ? s.length : e + 1; cur += s.slice(i, end); i = end; continue; }
    if (two === "/*") { const e = s.indexOf("*/", i + 2); const end = e < 0 ? s.length : e + 2; cur += s.slice(i, end); i = end; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1;
      for (; j < s.length; j++) { if (s[j] === c) { if (s[j + 1] === c) { j++; continue; } break; } }
      cur += s.slice(i, j + 1); i = j + 1; continue;
    }
    if (c === "$") {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(s.slice(i));
      if (m) {
        const tag = m[0], e = s.indexOf(tag, i + tag.length);
        const end = e < 0 ? s.length : e + tag.length;
        cur += s.slice(i, end); i = end; continue;
      }
    }
    if (c === ";") { push(); i++; continue; }
    cur += c; i++;
  }
  push();
  return out;
}

/** The migration files of a directory, in apply order (name order). */
export function migrationFiles(dir) {
  return readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((name) => ({ name, body: readFileSync(join(dir, name), "utf8") }));
}

const hostOf = (u) => { try { return new URL(u).host; } catch { return ""; } };

/**
 * Which database this run writes to. Default: the TEST branch (TAXILA_DB=test semantics of server/db.js dbUrl). Production
 * only with `prod: true`, and then never from a TAXILA_DB=test environment (the two would disagree about the target).
 * @param {{ env?: NodeJS.ProcessEnv, prod?: boolean }} [o]
 * @returns {{ url: string, label: "test" | "prod", host: string }}
 */
export function resolveTarget({ env = process.env, prod = false } = {}) {
  if (prod) {
    if (env.TAXILA_DB === "test") throw new Error("--prod with TAXILA_DB=test: pick one target");
    const url = env.DATABASE_URL_DIRECT || env.DATABASE_URL;
    if (!url) throw new Error("--prod: DATABASE_URL (or DATABASE_URL_DIRECT) is not set");
    return { url, label: "prod", host: hostOf(url) };
  }
  const tdb = env.TAXILA_DB ?? "test";
  if (tdb === "prod") throw new Error("TAXILA_DB=prod: production needs --prod on the command line, not an environment default");
  const url = dbUrl({ ...env, TAXILA_DB: "test" }, { direct: true });
  return { url, label: "test", host: hostOf(url) };
}

/**
 * Apply the pending migrations. `client` = { query(text, params) → rows, tx(stmts) } where tx runs [{ text, params }] in ONE
 * transaction (all or nothing). Dry run: reads only (a missing schema_migrations table = everything pending).
 * @param {{ client: { query: Function, tx: Function }, files: { name: string, body: string }[], dryRun?: boolean,
 *   log?: (s: string) => void }} o
 * @returns {Promise<{ applied: string[], pending: string[], statements: Record<string, number> }>}
 */
export async function migrate({ client, files, dryRun = false, log = () => {} }) {
  let done = new Set();
  const has = await client.query("select to_regclass('public.schema_migrations') as t");
  if (has?.[0]?.t) done = new Set((await client.query("select name from schema_migrations")).map((r) => r.name));
  else if (!dryRun) await client.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
  const pending = files.filter((f) => !done.has(f.name));
  const statements = Object.fromEntries(pending.map((f) => [f.name, splitSql(f.body).length]));
  if (dryRun) { for (const f of pending) log(`pending ${f.name} (${statements[f.name]} statements)`); return { applied: [], pending: pending.map((f) => f.name), statements }; }
  const applied = [];
  for (const f of pending) {
    const stmts = splitSql(f.body).map((text) => ({ text, params: [] }));
    try { await client.tx([...stmts, { text: "insert into schema_migrations(name) values ($1)", params: [f.name] }]); }
    catch (e) { throw Object.assign(new Error(`${f.name}: ${e.message} (rolled back; nothing of this file was applied)`), { file: f.name, cause: e }); }
    applied.push(f.name);
    log(`applied ${f.name} (${stmts.length} statements, one transaction)`);
  }
  return { applied, pending: pending.map((f) => f.name), statements };
}

/**
 * A Neon backup branch of the target's branch before a production migration (needs NEON_API_KEY + NEON_PROJECT_ID; a live
 * check). The endpoint id is the first label of the host (ep-...; a "-pooler" suffix is dropped).
 * @param {{ apiKey: string, projectId: string, host: string, name: string, fetch?: typeof fetch }} o
 * @returns {Promise<{ branchId: string, parentId: string, name: string }>}
 */
export async function neonBackupBranch({ apiKey, projectId, host, name, fetch: f = fetch }) {
  const ep = String(host).split(".")[0].replace(/-pooler$/, "");
  if (!/^ep-/.test(ep)) throw new Error(`not a Neon endpoint host: ${ep}`);
  const H = { authorization: `Bearer ${apiKey}`, accept: "application/json", "content-type": "application/json" };
  const base = `https://console.neon.tech/api/v2/projects/${encodeURIComponent(projectId)}`;
  const r1 = await f(`${base}/endpoints/${ep}`, { headers: H });
  if (!r1.ok) throw new Error(`neon endpoint ${ep}: HTTP ${r1.status}`);
  const parentId = (await r1.json())?.endpoint?.branch_id;
  if (!parentId) throw new Error(`neon endpoint ${ep}: no branch_id`);
  const r2 = await f(`${base}/branches`, { method: "POST", headers: H, body: JSON.stringify({ branch: { parent_id: parentId, name } }) });
  if (!r2.ok) throw new Error(`neon backup branch: HTTP ${r2.status}`);
  const branchId = (await r2.json())?.branch?.id;
  return { branchId, parentId, name };
}
