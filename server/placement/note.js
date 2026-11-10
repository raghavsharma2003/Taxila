// The parent's placement note (round 7 F cold start, main 2026-11-07 (c)): per subject, where Taxila will begin and
// what that was made from. Structured and checked like every parent line (server/reports): each line is a registered
// SHAPE (templates.js "place.*") on typed slots, gated by reports/gate.js lineViolations (banned and locked words, digits
// only from slots, the template exactly), and every claim is re-derived independently by checkPlacementNote from the
// stored answers before it is shown. A claim that fails its check is dropped, never shown. PURE.
import { renderShape } from "../reports/templates.js";
import { lineViolations } from "../reports/gate.js";
import { LANGS } from "../reports/config.js";
import { schoolStartIndex } from "../content/next-topic.js";
import { topicSequence, getTopic } from "../content/curriculum.js";
import { coldStartResult, geOf } from "./coldstart.js";

/** A placement gap at least this big (expected − start, GE) adds "starts a little before the class's chapter" (R9's line). */
export const EASIER_GAP = 0.5;

/** PURE. The topic a subject begins at: the same rule and precedence as topic choice (school chapter, then startGE). */
export function startTopicOf({ classLevel, subject, startGE, schoolChapter, date }) {
  const order = topicSequence(classLevel, subject);
  if (!order.length) return null;
  const i = schoolStartIndex(order, getTopic, { classLevel, chapter: schoolChapter, startGE, date });
  const t = getTopic(order[i]);
  return t ? { id: t.id, title: t.title } : null;
}

/**
 * PURE. The note's claims for a child's onboarding results, in display order per subject:
 * place.start, place.easier (when the gap is ≥ EASIER_GAP), the answers used (parent, then child), and one
 * place.firstweek at the end.
 * @param {{ child: { first_name: string, class_level: number, school_chapter?: Record<string, number> }, results: Record<string, any>, date?: Date|string }} a
 */
export function placementClaims({ child, results, date = new Date() }) {
  const out = [];
  const name = child.first_name;
  for (const [subject, r] of Object.entries(results ?? {}).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (r?.source !== "onboarding") continue;
    const topic = startTopicOf({ classLevel: child.class_level, subject, startGE: r.startGE, schoolChapter: child.school_chapter?.[subject], date });
    if (!topic) continue;
    out.push({ id: `place:${subject}:start`, shapeId: "place.start", subject, slots: { name, subject, skill: topic.title }, topicId: topic.id });
    if (Number(r.expected) - geOf(r.startGE) >= EASIER_GAP) out.push({ id: `place:${subject}:easier`, shapeId: "place.easier", subject, slots: { subject } });
    if (r.answers?.parentView) out.push({ id: `place:${subject}:parent`, shapeId: `place.parent_${r.answers.parentView}`, subject, slots: { subject } });
    if (r.answers?.childPick) out.push({ id: `place:${subject}:child`, shapeId: `place.child_${r.answers.childPick}`, subject, slots: { name, subject } });
  }
  if (out.length) out.push({ id: "place:firstweek", shapeId: "place.firstweek", subject: null, slots: {} });
  return out;
}

/**
 * PURE. Independent re-derivation of every claim from the stored answers (child.onboarding_answers) and the round's
 * date: the cold-start result is recomputed and must equal the stored one (startGE, answers); the start topic is
 * recomputed with topic choice's rule; each slot must match; each rendered line must pass the gate in every language.
 * @returns {{ id: string, ok: boolean, why: string[] }[]}
 */
export function checkPlacementNote(claims, { child, results, answers = {}, date = new Date() }) {
  return claims.map((c) => {
    const why = [];
    if (c.shapeId !== "place.firstweek") {
      const r = results?.[c.subject];
      if (r?.source !== "onboarding") why.push("no onboarding result for the subject");
      else {
        const re = coldStartResult({ subject: c.subject, classLevel: child.class_level, parentView: answers.parentView?.[c.subject],
          childPick: answers.childPicks?.[c.subject], date: r.at ?? date });
        if (!re) why.push("answers make no estimate");
        else {
          if ((re.startGE ?? null) !== (Number.isFinite(geOf(r.startGE)) ? geOf(r.startGE) : null)) why.push(`startGE ${r.startGE} ≠ ${re.startGE} from the answers`);
          if (JSON.stringify(re.answers) !== JSON.stringify(r.answers ?? {})) why.push("stored answers ≠ the child's answers");
        }
        if (c.shapeId === "place.start") {
          const t = startTopicOf({ classLevel: child.class_level, subject: c.subject, startGE: r.startGE, schoolChapter: child.school_chapter?.[c.subject], date });
          if (!t || t.title !== c.slots.skill || t.id !== c.topicId) why.push("start topic ≠ topic choice's start");
        }
        if (c.shapeId === "place.easier" && !(Number(r.expected) - geOf(r.startGE) >= EASIER_GAP)) why.push("no gap for the easier line");
        if (c.shapeId.startsWith("place.parent_") && c.shapeId !== `place.parent_${answers.parentView?.[c.subject]}`) why.push("parent line ≠ the parent's answer");
        if (c.shapeId.startsWith("place.child_") && c.shapeId !== `place.child_${answers.childPicks?.[c.subject]}`) why.push("child line ≠ the child's pick");
      }
      if (c.slots.subject !== c.subject) why.push("subject slot");
      if ("name" in c.slots && c.slots.name !== child.first_name) why.push("name slot");
    } else if (!claims.some((x) => x.shapeId === "place.start")) why.push("first-week line with no start line");
    for (const lang of LANGS) {
      let text;
      try { text = renderShape(c.shapeId, lang, c.slots); } catch (e) { why.push(`render ${lang}: ${e.message}`); continue; }
      for (const v of lineViolations(text, { shapeId: c.shapeId, slots: c.slots, lang, firstName: child.first_name })) why.push(`${lang} ${v.rule}${v.detail ? ` ${v.detail}` : ""}`);
    }
    return { id: c.id, ok: !why.length, why };
  });
}

/**
 * PURE. The note as served: only claims that passed their check, rendered in every language.
 * @returns {{ lines: Record<string, { id: string, shapeId: string, subject: string|null, text: string }[]>, checked: { total: number, shown: number, dropped: string[] } }}
 */
export function placementNote({ child, results, answers, date = new Date() }) {
  const claims = placementClaims({ child, results, date });
  const verdicts = checkPlacementNote(claims, { child, results, answers, date });
  const okIds = new Set(verdicts.filter((v) => v.ok).map((v) => v.id));
  // a subject whose start line failed shows nothing for that subject; the first-week line needs a shown start line
  const startOk = new Set(claims.filter((c) => c.shapeId === "place.start" && okIds.has(c.id)).map((c) => c.subject));
  const shown = claims.filter((c) => okIds.has(c.id) && (c.subject ? startOk.has(c.subject) : startOk.size > 0));
  const lines = Object.fromEntries(LANGS.map((L) => [L, shown.map((c) => ({ id: c.id, shapeId: c.shapeId, subject: c.subject, text: renderShape(c.shapeId, L, c.slots) }))]));
  return { lines, checked: { total: claims.length, shown: shown.length, dropped: verdicts.filter((v) => !v.ok).map((v) => `${v.id}: ${v.why.join("; ")}`) } };
}
