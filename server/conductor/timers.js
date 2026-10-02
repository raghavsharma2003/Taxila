// Timers are data (CONDUCTOR.md §3.9). The Conductor commit upserts `wakeup` rows; the ticker (worker leader)
// and piggyback drains fire due rows with fire_wakeups(), which marks a row and ingests its clock.wakeup in one
// statement, so a fired row has exactly one event (I-R2) even when two tickers overlap (SKIP LOCKED + idem key).
import { q } from "./pg.js";

/**
 * Upsert from the commit: a semantic dedupe key moves its row instead of adding one. A row that already fired
 * is re-armed only for a LATER instant (a new occurrence, e.g. the next replan debounce); its idem key then
 * carries the new due time, so it fires once more and only once.
 */
export const upsertWakeupSql = `insert into wakeup (child_id, dedupe, due_at, reason) values ($1, $2, $3, $4)
  on conflict (child_id, dedupe) do update set due_at = excluded.due_at, reason = excluded.reason, fired_at = null
  where wakeup.fired_at is null or excluded.due_at > wakeup.fired_at`;

/**
 * Fire due wakeups in batches of `limit` until a batch comes back short. Each call is its own short
 * transaction, so a deadlock abort (X29's backstop) rolls back at most one batch.
 * @param {{ limit?: number, only?: string[] | null, maxBatches?: number }} o  `only` limits to some children
 * @returns {Promise<Array<{ child_id: string, dedupe: string, seq: string | null }>>}
 */
export async function fireDue({ limit = 500, only = null, maxBatches = 20 } = {}) {
  const fired = [];
  for (let i = 0; i < maxBatches; i++) {
    const rows = await q("select * from fire_wakeups($1, $2)", [limit, only]);
    fired.push(...rows);
    if (rows.length < limit) break;
  }
  return fired;
}
