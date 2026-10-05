// In-memory stand-in for server/db.js (replay harness only; see loader.mjs). It answers the reads the turn route makes
// from one in-memory lesson row and records every transaction, statement by statement, for the golden file.
export const GUARD_FAILED = "22012";
export const guardStmt = (text, params) => ({ text: `with g as (${text}) select 1 / count(*) as ok from g`, params });
export const dbUrl = () => "postgres://replay.invalid/replay";
export const pgPoolConfig = () => ({});

/** The harness owns this object: lessons by id, child, guardian, and the recorded transactions. */
export const DB = globalThis.__replayDb ??= { lessons: new Map(), child: null, guardian: null, txs: [], ktSeq: 0, tableExists: new Set() };

const clone = (x) => JSON.parse(JSON.stringify(x));

export async function q(text, params = []) {
  const t = String(text);
  if (/to_jsonb\(c\) as child_row/.test(t)) {
    const l = DB.lessons.get(params[0]);
    if (!l) return [];
    return [{ ...clone(l), child_row: clone(DB.child), guardian_row: clone(DB.guardian), core_ok: true }];
  }
  if (/^select ended_at, state from lesson/.test(t) || /^select \* from lesson where id/.test(t)) {
    const l = DB.lessons.get(params[0]);
    return l ? [clone(l)] : [];
  }
  if (/to_regclass/.test(t)) return [{ ok: DB.tableExists.has(String(params[0] ?? "")) }];
  if (/information_schema\.columns/.test(t)) return [{ n: DB.tableExists.has(`${params[0]}.${params[1]}`) ? 1 : 0 }];
  return [];
}
export const one = async (text, params = []) => (await q(text, params))[0] ?? null;

export async function tx(stmts) {
  if (!stmts.length) return [];
  DB.txs.push(stmts.map((s) => ({ text: s.text, params: clone(s.params ?? []) })));
  const out = [];
  for (const s of stmts) {
    const t = String(s.text);
    const m = /update lesson set state = \$2 where id = \$1 and (ended_at is null|ended_at is not null)/.exec(t);
    if (m && /with g as/.test(t)) {
      const l = DB.lessons.get(s.params[0]);
      const ok = l && (m[1] === "ended_at is null" ? !l.ended_at : !!l.ended_at) && Number(l.state?.turn) === Number(s.params[2]);
      if (!ok) { const e = new Error("guard failed"); e.code = GUARD_FAILED; throw e; }
      l.state = clone(s.params[1]);
      out.push([{ ok: 1 }]);
    } else if (/^insert into turn\(/.test(t)) {
      const rows = [];
      for (let i = 0; i < s.params.length; i += 6) rows.push({ seq: s.params[i + 1] });
      out.push(rows);
    } else if (/^with ins as \(insert into kt_evidence/.test(t)) {
      out.push([{ seq: ++DB.ktSeq }]);
    } else {
      out.push([{ id: 1 }]);
    }
  }
  return out;
}
