// The child brief the teacher sees: telegraphic rows, never sentences she could read out, never an
// ability label, never an internal id (a key read aloud is gibberish). Rendered ≤ BRIEF_TOKEN_CAP.

export const BRIEF_TOKEN_CAP = 600;
export const estimateTokens = (s) => Math.ceil(String(s).length / 3.5);

/** Gurukul's ability-label fence, plus Hindi/Hinglish equivalents (harvest gurukul §4.10). */
export const ABILITY_LABELS = [
  "brilliant", "genius", "gifted", "talented", "talent", "natural", "prodigy", "topper", "smart", "clever",
  "bright", "sharp", "intelligent", "dull", "slow", "weak", "strong", "average", "hopeless", "stupid", "dumb",
  "careless", "sloppy", "lazy", "undisciplined", "rank", "percentile",
  "kamzor", "tez", "hoshiyar", "hoshiar", "nalayak", "buddhu", "budhu", "gadha", "dimaag", "dimag", "kaabil",
];
const LABEL_RE = new RegExp(`\\b(${ABILITY_LABELS.join("|")})\\w*\\b`, "i");
const ID_SHAPED = /\b[a-z]+\d*(?:[-.][a-z0-9]+){2,}\b/i;
const MAX_ROW_WORDS = 14;

export const hasAbilityLabel = (s) => LABEL_RE.test(String(s));

/**
 * A row that labels an ability, leaks an id or runs long is DROPPED, never rewritten. Kit content (a
 * misconception's belief) may run longer than a memory fact, so the word cap is per call.
 */
export function cleanRows(rows, maxWords = MAX_ROW_WORDS) {
  return (rows || []).map((r) => String(r || "").trim())
    .filter((r) => r && !hasAbilityLabel(r) && !ID_SHAPED.test(r) && r.split(/\s+/).length <= maxWords);
}

/**
 * Brief rows with drop priorities for the compiler (lower drops first; null = never dropped).
 * @param {import("../../shared/contracts").ChildBrief} b
 * @returns {{ id: string, text: string, drop: number|null }[]}
 */
export function briefRows(b) {
  const rows = [
    { id: "who", text: `- ${b.firstName} · class ${b.classLevel} · age band ${b.ageBand} · prefers ${b.languagePref}`, drop: null },
    { id: "rel", text: `- relationship: ${b.relationshipStage.replace(/_/g, " ")}`, drop: 5 },
    { id: "vibe", text: `- vibe: pace ${b.vibe.pace} · ${b.vibe.verbosity} answers · humour ${b.vibe.humour}`, drop: 4 },
  ];
  const list = (id, label, items, drop) => {
    const clean = cleanRows(items);
    if (clean.length) rows.push({ id, text: `- ${label}: ${clean.join("; ")}`, drop });
  };
  list("mis", "watch for (seen before)", b.activeMisconceptions, 6);
  list("int", "interests (for examples)", b.interests, 3);
  list("wins", "recent wins", b.recentWins, 2);
  list("mem", "callbacks (one at most, only if it fits)", b.memoryCallbacks, 1);
  return rows;
}

export function renderBrief(b) {
  return ["CHILD", ...briefRows(b).map((r) => r.text)].join("\n");
}

/** Trim list fields from the end until the rendered brief fits the cap. */
export function fitBrief(b, cap = BRIEF_TOKEN_CAP) {
  const out = structuredClone(b);
  const order = ["memoryCallbacks", "recentWins", "interests", "activeMisconceptions"];
  while (estimateTokens(renderBrief(out)) > cap) {
    const field = order.find((f) => out[f].length);
    if (!field) break;
    out[field].pop();
  }
  return out;
}
