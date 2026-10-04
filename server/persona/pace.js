// Explicit pace requests (BUILD-PLAN W2-C #6, personalisation gap 10, acceptance (d): "dheere" raises waitNudgeSec within
// 2 turns). An explicit request is a preference the child stated, so it applies on the turn it is heard (adapter.js
// personaStep: explicit beats session inference, LM §6.6) instead of waiting for two consistent signals and the
// 10-minute step cadence that inferred knobs obey. Closed phrase lists, whole words; never a trait, never evidence.

const SLOWER = ["dheere", "dhire", "dheeray", "dheeme", "dhime", "dheere dheere", "aaram se", "aram se", "slowly", "slow down", "more slowly",
  "too fast", "speak slow", "bahut tez", "itna tez", "jaldi mat", "ruk ruk ke", "ruk ke bolo", "slower"];
const FASTER = ["faster", "speed up", "jaldi bolo", "tez bolo", "thoda jaldi", "go faster", "too slow"];
const NEG_SLOWER = ["not slowly", "dheere nahi", "dheere mat"];

const has = (t, list) => list.some((w) => new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu").test(t));

/**
 * @param {string} text the child's words this turn
 * @returns {{ explicitSlower: boolean, explicitFaster: boolean }}
 */
export function explicitPace(text) {
  const t = String(text ?? "").toLowerCase();
  const slower = has(t, SLOWER) && !has(t, NEG_SLOWER);
  return { explicitSlower: slower, explicitFaster: !slower && has(t, FASTER) };
}
