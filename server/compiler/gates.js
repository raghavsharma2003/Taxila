// The gate kernel (harvest port task 2; source `src/engine/clock.ts@vy` MINOR_HARD_GATES / gatesFor / saferTier).
// The source's DEFAULT was adult: an `unverified` user got romance: true and engagementMechanics: true, so a
// child who never proved an age got the adult product. Taxila inverts it structurally — there is NO adult
// branch to fall into: every tier, including "adult", "verified_adult", unknown, null and garbage, gets the
// same frozen minor gates. A guardian's adult attestation is about the PARENT surfaces, never the child lane.
//
// Consumers: director/safety.js neverRuleHits (which NEVER families apply — all of them, always) and
// compile.js (asserts the floor it compiles is the minor floor). Ratchet: restrict-only; nothing can widen.

/** Every NEVER family is on for a minor; these are compile.js FLOOR_FIX keys (director/safety.js NEVER_FAMILIES). */
export const MINOR_GATES = Object.freeze({
  tier: "minor",
  romance: false,              // no romance, crush, flirting, looks talk
  companionRegister: false,    // no friend-replacement, exclusivity, missing, waiting
  engagementMechanics: false,  // no streaks, guilt, come-back pressure, FOMO hooks (NEVER MANIPULATE)
  personalDataAsks: false,     // never asks for name, address, school, phone, photos, passwords, location
  claimsHumanity: false,       // never denies being an AI; no invented body, family, home, past or feelings
  helplines: true,             // Childline 1098 + Tele-MANAS 14416 in every floor, exact
  neverRules: Object.freeze(["ai_denial", "helpline", "romance", "exclusivity", "personal_data", "guilt", "shaming", "ability", "feelings"]),
});

/**
 * The gates for a tier. There is one answer: the minor gates. The parameter exists so a caller that passes an
 * age claim ("adult", "unverified", a verified-age flag) is visibly ignored rather than silently honoured.
 * @param {unknown} [_tier]
 */
export const gatesFor = (_tier) => MINOR_GATES;

/** Restrict-only ratchet between two gate sets: any false wins, the union of never-rules wins. Never widens. */
export function saferGates(a = MINOR_GATES, b = MINOR_GATES) {
  const out = {};
  for (const k of Object.keys(MINOR_GATES)) {
    if (k === "tier") out[k] = "minor";
    else if (k === "neverRules") out[k] = Object.freeze([...new Set([...MINOR_GATES.neverRules, ...(a?.neverRules ?? []), ...(b?.neverRules ?? [])])]);
    else if (k === "helplines") out[k] = true;
    else out[k] = false;  // every permission in a minor gate set is off, whatever either side claims
  }
  return Object.freeze(out);
}

/** Throws unless `g` is exactly as strict as the minor gates (compile() calls this on what it compiles for). */
export function assertMinorGates(g) {
  for (const [k, v] of Object.entries(MINOR_GATES)) {
    const same = Array.isArray(v) ? v.every((x) => g?.[k]?.includes(x)) : g?.[k] === v;
    if (!same) throw new Error(`gates: ${k} is not the minor gate (${JSON.stringify(g?.[k])}); there is no adult branch`);
  }
  return g;
}
