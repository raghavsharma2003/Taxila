// The Teacher Brain's kernel (TEACHER-BRAIN TB1, TB5, §10; BUILD-PLAN W2-E BR0/BR1). Components never call each other:
// each returns typed PROPOSALS (shared/brain.ts Proposal) and the kernel arbitrates them per turn by a strict authority
// order and shared budgets. PURE and deterministic: no clock, no randomness, no I/O; equal inputs give a byte-equal
// result (G-KERNEL-PURE), ties are broken by a fixed order, never by chance.
//
// Authority (§10.1, reconciled with RELATIONAL-OS §2; a higher source's veto cannot be outbid):
//    0 safety and the relational floor   1 the child's goodbye (RELEASE)   2 consent   3 parent controls   4 policy caps
//    5 cost governor   6 plan   7 teacher-owned repair   8 Director pedagogy   9 comprehension probes   10 rapport
//   11 vibe   12 Studio novelty
// A proposal's rank is read from its priority (priority = 100 − 10 × rank + urgency 0-9; director/proposal.js uses the
// same rule), so every proposer states its authority the same way.

/** @typedef {import("../../shared/brain").Proposal} Proposal */

export const AUTHORITY = Object.freeze({ safety: 0, release: 1, consent: 2, parent: 3, caps: 4, governor: 5, plan: 6, repair: 7, director: 8,
  comprehension: 9, rapport: 10, vibe: 11, studio: 12 });
export const MAX_RANK = 12;
/** Priority for an authority rank plus an urgency 0-9 (higher wins inside a rank). */
export const priorityOf = (rank, urgency = 0) => 100 - 10 * rank + Math.max(0, Math.min(9, Math.floor(urgency)));
/** The authority rank a proposal carries (0 = highest). */
export const rankOf = (p) => Math.max(0, Math.min(MAX_RANK, Math.ceil((100 - Number(p?.priority ?? 0)) / 10)));

/**
 * Per-turn budgets (§10.2). attention: new things on screen this turn (1); testWeight: probe weight this turn; novelty:
 * new formats this turn; usd: spend this turn; latencyMs: added critical-path latency. Mandatory proposals are never
 * refused for budget (a mandatory probe takes its cheapest shape upstream).
 */
export const DEFAULT_BUDGETS = Object.freeze({ attention: 1, testWeight: 2.5, novelty: 2, usd: 0.6, latencyMs: 150 });
const BUDGET_KEYS = /** @type {const} */ (["attention", "testWeight", "novelty", "usd", "latencyMs"]);
const BUDGET_REASON = { attention: "attention", testWeight: "test", novelty: "novelty", usd: "usd", latencyMs: "latency" };
const SOURCE_ORDER = ["safety", "consent", "conductor", "governor", "relational", "director", "comprehension", "vibe", "studio"];

/** Moves after which nothing new may be revealed (the exchange is closing or held for care). */
const CLOSING = new Set(["wrap", "safeguard", "break"]);
/** Correction moves: no rapport callback rides on them, no humour in a re-teach (§10.3). */
const CORRECTING = new Set(["reteach", "hint", "repair"]);

const moveKindOf = (p) => (p?.kind === "move" ? p.payload?.move?.kind ?? null : null);

/**
 * Does an accepted proposal `v` veto `p`? Vetoes act only DOWNWARD (on a lower authority). `vetoes` entries:
 *   "*"             every lower proposal;
 *   "<source>"      every lower proposal from that source;
 *   "kind:<kind>"   every lower proposal of that kind.
 */
function vetoes(v, p) {
  if (!Array.isArray(v.vetoes) || !v.vetoes.length || rankOf(v) >= rankOf(p)) return false;
  return v.vetoes.some((x) => x === "*" || x === p.source || x === `kind:${p.kind}`);
}

/** The conflict table (§10.3): a rule id when `p` cannot join the accepted plan, else null. */
function conflictOf(accepted, p) {
  const move = accepted.find((a) => a.kind === "move");
  const kind = moveKindOf(move);
  if (p.kind === "move" && move) return "one_move";
  if (p.kind === "probe" && (accepted.some((a) => a.kind === "probe") || move?.payload?.asks)) return "one_question";
  if (p.source === "studio" && (p.kind === "reveal" || p.kind === "ask_whiteboard") && kind && CLOSING.has(kind)) return "reveal_on_closing_move";
  if (p.source === "relational" && (p.kind === "callback" || p.kind === "notice") && kind && CORRECTING.has(kind)) return "callback_in_correction";
  if (p.kind === "humour" && kind === "reteach") return "humour_in_reteach";
  if (accepted.some((a) => a.source === p.source && a.kind === p.kind && JSON.stringify(a.payload) === JSON.stringify(p.payload))) return "duplicate";
  return null;
}

/** Deterministic order: authority, mandatory first, urgency, then a fixed source order, kind, reason codes, input order. */
function order(a, b) {
  return rankOf(a.p) - rankOf(b.p) || Number(!!b.p.mandatory) - Number(!!a.p.mandatory) || Number(b.p.priority) - Number(a.p.priority)
    || SOURCE_ORDER.indexOf(a.p.source) - SOURCE_ORDER.indexOf(b.p.source) || String(a.p.kind).localeCompare(String(b.p.kind))
    || JSON.stringify(a.p.reason ?? []).localeCompare(JSON.stringify(b.p.reason ?? [])) || a.i - b.i;
}

/**
 * Arbitrate one turn's proposals (§10.3). PURE.
 * @param {Proposal[]} proposals
 * @param {Partial<typeof DEFAULT_BUDGETS>} [budgets]
 * @returns {{ accepted: Proposal[], rejected: { p: Proposal, why: string }[], spent: Record<string, number>, move: Proposal | null }}
 */
export function arbitrate(proposals, budgets = DEFAULT_BUDGETS) {
  const cap = { ...DEFAULT_BUDGETS, ...budgets };
  const spent = Object.fromEntries(BUDGET_KEYS.map((k) => [k, 0]));
  const accepted = [], rejected = [];
  const list = (proposals ?? []).filter((p) => p && typeof p === "object").map((p, i) => ({ p, i })).sort(order);
  for (const { p } of list) {
    const vetoer = accepted.find((v) => vetoes(v, p));
    if (vetoer) { rejected.push({ p, why: `vetoed_by.${vetoer.source}` }); continue; }
    const c = p.costs ?? {};
    if (!p.mandatory) {
      const over = BUDGET_KEYS.find((k) => (Number(c[k]) || 0) > 0 && spent[k] + (Number(c[k]) || 0) > cap[k] + 1e-9);
      if (over) { rejected.push({ p, why: `over_budget.${BUDGET_REASON[over]}` }); continue; }
    }
    const conflict = conflictOf(accepted, p);
    if (conflict) { rejected.push({ p, why: `conflict.${conflict}` }); continue; }
    accepted.push(p);
    for (const k of BUDGET_KEYS) spent[k] += Number(c[k]) || 0;
  }
  return { accepted, rejected, spent, move: accepted.find((a) => a.kind === "move") ?? null };
}

/** A proposal skeleton with zero costs (proposers fill what they spend). */
export function proposal(source, kind, rank, { payload = null, urgency = 0, costs = {}, mandatory = false, reason = [], vetoes: v } = {}) {
  return {
    source, kind, payload, priority: priorityOf(rank, urgency),
    costs: { latencyMs: 0, attention: 0, testWeight: 0, novelty: 0, usd: 0, ...costs },
    ...(mandatory ? { mandatory: true } : {}), reason, ...(v?.length ? { vetoes: v } : {}),
  };
}
