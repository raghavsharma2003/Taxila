// The ONE "latest consent per purpose" query (ensureActor, syncParentFacts, job claim and handlers). Two rows
// with the same created_at are ordered by id, so every reader agrees on which row is current; two readers that
// disagreed made the next planToday emit a spurious parent.consent_changed (review conductor-m0).
import { PURPOSES } from "./events.js";

/** $1 guardian_id, $2 child_id, $3 purposes → rows { id, purpose, granted } (one per purpose). */
export const LATEST_CONSENT_SQL = `select distinct on (purpose) id, purpose, granted from consent
  where guardian_id = $1 and (child_id = $2 or child_id is null) and purpose = any($3)
  order by purpose, created_at desc, id desc`;

/** @param {{ q: (text: string, params?: unknown[]) => Promise<any[]> }} db */
export const latestConsent = (db, guardianId, childId, purposes = PURPOSES) => db.q(LATEST_CONSENT_SQL, [guardianId, childId, purposes]);

/** SQL fragment: is purpose `p` currently granted for job alias `j` (child_id, guardian via child)? Same order. */
export const consentGrantedSql = (jobAlias, purposeExpr) => `coalesce((select k.granted from consent k join child c on c.id = ${jobAlias}.child_id
    where k.guardian_id = c.guardian_id and (k.child_id = c.id or k.child_id is null) and k.purpose = ${purposeExpr}
    order by k.created_at desc, k.id desc limit 1), false)`;
