// The child brief the teacher sees: telegraphic rows, never sentences she could read out, never an
// ability label, never an internal id (a key read aloud is gibberish). Rendered ≤ BRIEF_TOKEN_CAP.

import { canWrite, DEFAULT_MODE } from "./mode.js";

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

// ───────────── CHILD-BRIEF v2 (LEARNER-MODEL §9.1) ─────────────
// Telegraphic `KEY value · value` rows rendered by code from layer views. No first person, no sentences
// she could read out, no ability labels, no internal ids, no day counts / levels / GE numbers / gaps /
// percentages. A row that fails a check is DROPPED, never rewritten; rows are then dropped by priority
// (lower first) until the brief fits BRIEF_TOKEN_CAP, and the never-drop rows alone over the cap THROW.

/**
 * Devanagari (and Roman) ability words that are labels only when they point at the child: a kit story's
 * "गधा" (a donkey) passes, "तुम गधे हो" does not (floor 4: child-referent patterns only).
 */
const DEV_LABELS = ["कमज़ोर", "कमजोर", "होशियार", "बुद्धू", "नालायक", "गधा", "गधे", "मंदबुद्धि", "आलसी", "निकम्म", "तेज़ दिमाग", "तेज दिमाग", "निर्भर", "सहारे"];
const ROMAN_CHILD_LABELS = ["nirbhar", "sahare", "dependent", "lazy", "weak", "slow", "kamzor", "kamjor", "personality", "learning style", "introvert", "extrovert", "shy", "anxious"];
const CHILD_REF = ["tum", "tu", "aap", "you", "your", "child", "bachch\\w*", "beta", "beti", "she", "he", "her", "his",
  "तुम", "तू", "आप", "बच्चा", "बच्ची", "बच्चे", "बेटा", "बेटी", "वह", "वो", "उसका", "उसकी"];
const near = (labels) => new RegExp(`(^|[\\s,.;:])(${CHILD_REF.join("|")})[\\s,]+(\\S+[\\s,]+){0,2}(${labels.join("|")})|(${labels.join("|")})\\S*[\\s,]+(hai|ho|हो|है|hain|हैं)([\\s.,!?।]|$)`, "iu");
const CHILD_LABEL_RE = near([...DEV_LABELS, ...ROMAN_CHILD_LABELS, ...ABILITY_LABELS]);
/** A label aimed at the child (Roman or Devanagari, the full ability lexicon, child-referent patterns only). */
export const labelsChild = (s) => CHILD_LABEL_RE.test(String(s));
/** Numbers the brief must never carry: day counts, levels, GE, gaps, percentages. */
const FORBIDDEN_NUMBERS = /(\d\s*%|percent|\bGE\b|\blevel\s*\d|\b\d+\s*(days?|din|दिन)\b|\bclass(es)?\s*gap|\bgap\b|\bbehind\b|\bpeeche\b)/i;

/**
 * The checks for text the CODE built (keys, closed values, numbers it chose): the full ability lexicon, id
 * shapes and forbidden numbers. Content-sourced text (curriculum titles, kit beliefs) is checked with
 * contentProblem instead: "Natural indicators", "Percentage of a quantity" and "weak acid" are titles, not
 * labels (floor 4: child-referent patterns only).
 */
export function rowProblem(text) {
  if (hasAbilityLabel(text) || labelsChild(text)) return "label";
  if (ID_SHAPED.test(text)) return "id";
  if (FORBIDDEN_NUMBERS.test(text)) return "number";
  return null;
}
/** An internal id inside content: hyphen/dot segments with a digit somewhere ("c4-maths-ch05-t01"), so
 * "think-of-a-number" (a title) passes. */
const CONTENT_ID = /\b(?=[a-z0-9.-]*\d)[a-z]+\d*(?:[-.][a-z0-9]+){2,}\b/i;
/** Numbers no content may carry into the brief (units only: "Percentage of a quantity" is a title). */
const CONTENT_NUMBERS = /(\d\s*%|\blevel\s*\d|\b\d+\s*(days?|din|दिन)\b|\bclass(es)?\s*gap)/i;
/** Content-sourced text: a label aimed at the child, a leaked id, or a day count / level / percentage. */
export function contentProblem(text) {
  if (labelsChild(text)) return "label";
  if (CONTENT_ID.test(text)) return "id";
  if (CONTENT_NUMBERS.test(text)) return "number";
  return null;
}

/** Marks a slot value as content-sourced (checked by contentProblem, not rowProblem). */
const content = (v, prefix = "") => (v == null || v === "" ? null : { content: String(v), prefix });

/** Row spec: key, budget (tokens) and drop priority (lower drops first; null never), §9.1 table. */
export const BRIEF_ROWS = Object.freeze([
  { key: "CHILD", budget: 30, drop: null }, { key: "LANG", budget: 25, drop: null }, { key: "READ", budget: 15, drop: null },
  { key: "ACCOM", budget: 15, drop: null }, { key: "TODAY", budget: 25, drop: null }, { key: "SKILLS solid", budget: 40, drop: 6 },
  { key: "SKILLS learning", budget: 45, drop: 7 }, { key: "PREREQ", budget: 20, drop: 8 }, { key: "WATCH", budget: 50, drop: 9 },
  { key: "REVIEW", budget: 35, drop: 5 }, { key: "NEED", budget: 40, drop: 4 }, { key: "GOAL", budget: 20, drop: 3 },
  { key: "INTEREST", budget: 15, drop: 2 }, { key: "SUPPORT", budget: 30, drop: null }, { key: "NOTEBOOK", budget: 120, drop: 1 },
  { key: "SESSION", budget: 15, drop: null },
]);
const SPEC = Object.fromEntries(BRIEF_ROWS.map((r) => [r.key, r]));

/**
 * Build one row. `fixed` values always render; `items` (a list) are cleaned one by one and trimmed from
 * the END until the row fits its budget. A value wrapped by content() is content-sourced and gets only the
 * child-referent label check; everything else is code-built and gets the full rowProblem check. Items are
 * content unless `kind` is "code" or "memory" (memory text is ABOUT the child, so the full lexicon applies).
 * Returns null when the source is empty or a droppable row fails a check; a NEVER-DROP row that fails one
 * throws (a missing TODAY row is a silent hole in the teacher's brief, never an acceptable drop).
 */
function row(key, fixed, items = null, { tail = [], maxWords = MAX_ROW_WORDS, kind = "content" } = {}) {
  const spec = SPEC[key];
  const fail = (why) => {
    if (spec.drop === null) throw new Error(`CHILD-BRIEF ${key}: never-drop row failed its ${why} check`);
    return null;
  };
  const present = fixed.filter((v) => v !== null && v !== undefined && v !== "");
  const codeVals = present.map((v) => (typeof v === "object" ? v.prefix : String(v))).filter(Boolean);
  const contentVals = present.filter((v) => typeof v === "object").map((v) => v.content);
  let list = null;
  if (items) {
    const check = kind === "content" ? (i) => !contentProblem(i) : (i) => !rowProblem(i);
    list = items.map((r) => String(r || "").trim()).filter((r) => r && r.split(/\s+/).length <= maxWords && check(r));
    if (!list.length) return null;
  }
  if (!items && !present.length) return null;
  const vals = present.map((v) => (typeof v !== "object" ? String(v) : v.prefix ? `${v.prefix} ${v.content}` : v.content));
  const render = () => `${key} ${[...vals, ...(list ?? []), ...tail].join(" · ")}`;
  while (list && list.length > 1 && estimateTokens(render()) > spec.budget) list = list.slice(0, -1);
  const text = render();
  if (estimateTokens(text) > spec.budget) return fail("budget");
  const codePart = [key, ...codeVals, ...tail, ...(kind === "content" ? [] : list ?? [])].join(" · ");
  if (rowProblem(codePart) || contentVals.some(contentProblem)) return fail("label/id/number");
  return { key, text, drop: spec.drop };
}

const FADE_WORDS = { 5: "model", 4: "share", 3: "guide", 2: "on-call", 1: "solo", 0: "own" };

/**
 * INTEREST is tier B (LEARNER-MODEL §9.1: absent in M1 unless P3): rendered only when the view's mode
 * permits the mem_B layer. A view without a mode is the launch default (M1, no P3): no interests.
 * @param {import("../../shared/learner").BriefView} v
 */
const interestsAllowed = (v) => v.interestSource === "parent"
  // the parent's onboarding picks, read at lesson start only under the memory consent (PTM `cares`: parent tiles are M1)
  || canWrite({ legal_mode: v.mode?.legalMode ?? DEFAULT_MODE, consent: v.mode?.consent ?? {} }, "mem_B");

/**
 * The rows, in §9.1 order, from a BriefView (shared/learner.ts). Pure.
 * @param {import("../../shared/learner").BriefView} v
 */
export function childBriefRows(v) {
  const c = v.child;
  const a = v.address;
  const b4 = c.band4;
  const rows = [
    row("CHILD", [content(c.firstName), `class ${c.classLevel}`, b4, a && `calls you ${a.childCallsTeacher}`,
      a && `call ${a.teacherCallsChild === "name+beta" ? "name or beta" : "name"}`, `sessions ${c.sessions ?? 0}`]),
    v.lang && row("LANG", [`matrix ${v.lang.matrix}`, `english ${v.lang.enInsertion}`, v.lang.terms === "en_labels" ? "terms english" : "terms school-medium", "reply in child mix"]),
    v.read && row("READ", [`support ${v.read.support}`, `prompts aloud ${v.read.aloud ? "yes" : "no"}`]),
    v.accommodations?.length ? row("ACCOM", [], v.accommodations.map((x) => x.replace(/_/g, " ")), { kind: "code" }) : null,
    v.today && row("TODAY", [content(v.today.title), v.today.foundation != null ? `foundation ${v.today.foundation} school ${v.today.school}` : null]),
    v.skills?.solid?.length ? row("SKILLS solid", [], v.skills.solid.map((s) => (s.refresh ? `${s.title} (refresh)` : s.title))) : null,
    v.skills?.learning?.length ? row("SKILLS learning", [], v.skills.learning.map((s) => `${s.title} (entry ${s.entry === "worked_step" ? "worked step" : "hint first"})`)) : null,
    v.prereq ? row("PREREQ", [], [v.prereq.title]) : null,
    v.watch?.length ? row("WATCH", [], v.watch.slice(0, 2).map((w) => `${w.belief}${w.seen ? ` · seen ${w.seen}` : ""}`), { tail: ["verify before naming"], maxWords: 28 }) : null,
    v.review?.length ? row("REVIEW", [], v.review.slice(0, 4), { tail: ["no warning"] }) : null,
    v.need && (v.need.chapter || v.need.window) ? row("NEED", [content(v.need.chapter, "school"),
      v.need.window && `window ${v.need.window.kind} ${v.need.window.bucket.replace(/_/g, " ")}`, v.need.scope && `scope ${v.need.scope}`]) : null,
    v.goal ? row("GOAL", [], [v.goal]) : null,
    v.interests?.length && interestsAllowed(v) ? row("INTEREST", [], v.interests.slice(0, 2), { kind: "memory" }) : null,
    v.support && row("SUPPORT", [FADE_WORDS[v.support.fade] ?? null, v.support.fade <= 2 ? "silent until asked" : null,
      v.support.soloRounds != null ? `solo rounds ${v.support.soloRounds}` : null, v.support.nudgeSec != null ? `nudge ${v.support.nudgeSec} s` : null]),
    v.notebook && (v.notebook.opener || v.notebook.items?.length) ? row("NOTEBOOK", [],
      [...(v.notebook.opener ? [`opener: ${v.notebook.opener}`] : []), ...(v.notebook.items ?? []).slice(0, 2)], { tail: ["one callback at most"], maxWords: 20, kind: "memory" }) : null,
    row("SESSION", [v.session?.capMin != null ? `cap ${v.session.capMin} min` : null, "stop on exit intent", v.session?.schoolMode ? "school mode" : null]),
  ];
  return rows.filter(Boolean);
}

/** Drop rows by priority (lowest first) until the brief fits; throws if the never-drop rows alone do not. */
export function fitByDropOrder(rows, cap = BRIEF_TOKEN_CAP, header = "CHILD-BRIEF") {
  let kept = rows.slice();
  const size = (rs) => estimateTokens([header, ...rs.map((r) => r.text)].join("\n"));
  while (size(kept) > cap) {
    const droppable = kept.filter((r) => r.drop != null);
    if (!droppable.length) throw new Error(`CHILD-BRIEF: never-drop rows alone are ${size(kept)} tokens > cap ${cap}`);
    const victim = droppable.reduce((m, r) => (r.drop < m.drop ? r : m));
    kept = kept.filter((r) => r !== victim);
  }
  return kept;
}

/**
 * The v2 rows as compile() parts (W2-C #1): the header, then each row with its drop priority, so the compiler's own
 * section cap and budget shed them in the §9.1 order. Rows are pre-fitted to `cap` (never-drop rows over it throw).
 * @returns {{ text: string, drop: number | null, id?: string }[]}
 */
export function childBriefParts(v, cap = BRIEF_TOKEN_CAP) {
  return [{ text: "CHILD-BRIEF", drop: null }, ...fitByDropOrder(childBriefRows(v), cap).map((r) => ({ id: r.key, text: r.text, drop: r.drop }))];
}

/** The rendered CHILD-BRIEF block (≤ BRIEF_TOKEN_CAP by construction). */
export function renderChildBrief(v, cap = BRIEF_TOKEN_CAP) {
  return ["CHILD-BRIEF", ...fitByDropOrder(childBriefRows(v), cap).map((r) => r.text)].join("\n");
}

/**
 * Skill rows of the brief from KT reads (ledger.readSkill at `now`): solid = learned and retention ≥ 0.8
 * (≤ 3, refresh marked); learning = today's skills not solid (≤ 3) with the entry support by pL band;
 * prereq = the weakest prerequisite when its pL < 0.5; review = due skills (2-4 titles).
 * @param {{ states: Record<string, any>, titleOf: (id: string) => string | undefined, today: string[], prereqs?: string[], due?: string[] }} a
 */
export function briefSkills({ states, titleOf, today, prereqs = [], due = [] }) {
  const LEARNED = new Set(["learned_today", "mastered", "durable"]);
  const solidStates = Object.values(states).filter((s) => s && LEARNED.has(s.display) && s.retention >= 0.8)
    .sort((a, b) => b.retention - a.retention || (a.skillId < b.skillId ? -1 : 1));
  const solidIds = new Set(solidStates.map((s) => s.skillId));
  const solid = solidStates.slice(0, 3).map((s) => ({ title: titleOf(s.skillId), refresh: !!s.refresh })).filter((s) => s.title);
  const learning = today.filter((id) => !solidIds.has(id)).slice(0, 3)
    .map((id) => ({ title: titleOf(id), entry: (states[id]?.pL ?? 0) < 0.35 ? "worked_step" : "hint_first" })).filter((s) => s.title);
  const weak = prereqs.map((id) => states[id]).filter((s) => s && s.pL < 0.5).sort((a, b) => a.pL - b.pL || (a.skillId < b.skillId ? -1 : 1))[0];
  const review = due.map(titleOf).filter(Boolean).slice(0, 4);
  return { solid, learning, prereq: weak && titleOf(weak.skillId) ? { title: titleOf(weak.skillId) } : null, review };
}
