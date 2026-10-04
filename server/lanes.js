// Quota lanes (BUILD-PLAN §1.3 rev 2, superhuman-quota-isolation; TEACHER-BRAIN §5.4 L5). OWNED BY W2-E.
// W2 seam commit: hot and background model calls must never share a quota pool. Every model call is tagged
// `quotaLane: "hot" | "background"` (server/azure.js passes it here; the option is named quotaLane because azure.js's
// `lane` option already selects the ENDPOINT lane: CHAT / TTS / realtime):
//   - hot: reply, classify, distress, realtime;
//   - background: Studio plan and build, memory consolidation, the voice annotator, parent texts, the router bench.
// Background calls go to their own deployments (O13); until those exist, a token bucket caps background calls at 30%
// of any shared deployment's TPM. Contract, binding on the owner:
//   - admit() is synchronous and returns undefined to go now, or a Promise to await first (a background call waiting
//     for its bucket). A hot call is never delayed by a background one;
//   - settle() records what the call used (usage, status: a 429 feeds the bucket); never throws.
//
// Until W2-E fills it: admit → undefined (every call goes at once, exactly as today), settle → nothing.

/** @typedef {import("../shared/brain").QuotaLane} QuotaLane */

export const QUOTA_LANES = Object.freeze(["hot", "background"]);

/**
 * @param {{ quotaLane?: QuotaLane, deployment: string, kind: string, estTokens?: number }} _call
 * @returns {Promise<void> | undefined}
 */
export function admit(_call) { return undefined; }

/**
 * @param {{ quotaLane?: QuotaLane, deployment: string, kind: string, status: number | string, usage?: { in?: number, out?: number } }} _done
 */
export function settle(_done) {}
