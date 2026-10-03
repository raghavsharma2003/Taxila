// The claim gate G-PARENT-1 on the client (PRODUCT-DESIGN-V2 §6.5.1, §13.1 "src/parent/claims.ts", audit #20).
// PURE. The server picks the headline (server/routes/parent.js homeHeadline) and sends, with each claim, the evidence
// rows it rests on and the same ledger state the "How do we know?" sheet shows. This file re-checks every claim it is
// sent with the same written rule and drops any claim the rows do not support, so the headline can never contradict
// the evidence one tap below. tests/ui-v2-claims.test.mjs runs both sides over 3,000 simulated ledgers.
//
// The rule:
// - "{child} can now {skill}" needs the ledger at Got it or Secure AND its newest counted row "Right · On their own".
// - "Still practising: {skill}" needs the ledger at Practising AND at least 2 attempts in the last 14 days that were
//   not right-on-their-own. A lone "Right · On their own" can never produce it.
// - With fewer than 3 counted rows in total the block reads "Too early to say" (the server decides that count).

export const CLAIM_WINDOW_DAYS = 14;
export const PRACTISING_MIN = 2;
export const TOO_EARLY_ROWS = 3;

export interface ClaimRow { at: string; outcome: "correct" | "incorrect" | "partial" | "misconception" | "no_evidence" | string; hintsUsed?: number | null; hints_used?: number | null }
export type ClaimKind = "can_now" | "practising";

const hints = (r: ClaimRow) => Number(r.hintsUsed ?? r.hints_used ?? 0);
export const unaidedRight = (r: ClaimRow) => r.outcome === "correct" && !(hints(r) > 0);

export function evidenceTally(rows: ClaimRow[], now = new Date()) {
  const since = now.getTime() - CLAIM_WINDOW_DAYS * 86400_000;
  const counted = rows.filter((r) => r.outcome !== "no_evidence");
  const ordered = [...counted].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return {
    counted: counted.length,
    unaided: counted.filter(unaidedRight).length,
    notUnaidedRecent: counted.filter((r) => !unaidedRight(r) && new Date(r.at).getTime() >= since).length,
    latestUnaided: ordered[0] ? unaidedRight(ordered[0]) : false,
  };
}

/** May this headline word stand on this ledger state and these rows? */
export function claimHolds(kind: ClaimKind, state: { level: number }, rows: ClaimRow[], now = new Date()): boolean {
  const t = evidenceTally(rows, now);
  if (kind === "can_now") return state.level >= 2 && t.unaided >= 1 && t.latestUnaided;
  if (kind === "practising") return state.level === 1 && t.notUnaidedRecent >= PRACTISING_MIN;
  return false;
}

export type HeadlineKind = "none" | "first" | "too_early" | "claims" | "quiet" | "no_week" | "held";
export interface ClaimIn { skillId: string; level: number; rows: ClaimRow[] }
export interface HeadlineIn<C extends ClaimIn> { kind: HeadlineKind; canNow: C | null; practising: C | null }

/**
 * The headline as the screen may render it: every claim the rows do not support is removed, and a "claims" block left
 * with nothing becomes "quiet" (never an empty card, never an unsupported sentence).
 */
export function gateHeadline<C extends ClaimIn>(h: HeadlineIn<C>, now = new Date()): HeadlineIn<C> & { dropped: string[] } {
  const dropped: string[] = [];
  const keep = (c: C | null, kind: ClaimKind) => {
    if (!c) return null;
    if (claimHolds(kind, c, c.rows, now)) return c;
    dropped.push(`${kind}:${c.skillId}`);
    return null;
  };
  const canNow = keep(h.canNow, "can_now");
  const practising = h.kind === "first" ? (h.practising ? (dropped.push(`practising:${h.practising.skillId}`), null) : null) : keep(h.practising, "practising");
  const kind: HeadlineKind = h.kind === "claims" && !canNow && !practising ? "quiet" : h.kind;
  return { kind, canNow, practising, dropped };
}
