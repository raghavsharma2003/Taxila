// "How {T} teaches {child}" (round 7 F, learning-parent-teaching-page; STUDENT-FLOW §12.1): what the teacher did in the
// child's recent lessons and why, read from brain_trace's CLOSED codes (server/brain/reasons.js) through a FIXED parent
// lexicon. Nothing a model wrote reaches the parent here, and no line says anything about the child's mind, ability or
// style: each line is what the teacher did, with a count, and (for a child's request) what the child asked for.
//
//   whyLines(rows, { name, T })     PURE. One lesson's trace rows → ≤ 4 lines in a fixed priority
//   APPROACH                        fixed copy: the method, the same for every child
//   teachingOf(child, { q })        the page's data: approach, the last 5 counted lessons with their lines, made-for pieces
//   becauseOf(rows, ctx)            PURE. round 8: a lesson's knows.<choice> decision rows → the parent's "because" lines
//                                   (server/director/knows-words.js: what was chosen and the fact behind it, never blame)
import { q as dbq } from "../db.js";
import { getTopic } from "../content/curriculum.js";
import { COUNTED_LESSON_SQL } from "./truth.js";
import { madeForOf } from "./madeFor.js";
import { WAY_LABEL } from "./templates.js";
import { getKit } from "../content/index.js";
import { becauseLines } from "../director/knows-words.js";

const n2 = (n) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);
/** " twice" / " 3 times"; nothing for once (a single move needs no count). */
const cnt = (n) => (n > 1 ? ` ${n2(n)}` : "");

/** request.<type> → what the child asked for, in plain words (only the requests that change how she teaches). */
export const ASKED = Object.freeze({
  slower: "a slower pace", visual: "a picture", example: "another example", story: "a story", easier: "an easier question",
  harder: "a harder question", another: "another question", repeat: "to hear it again", explain_first: "the idea before any question",
  why: "why it works", break: "a break",
});

/**
 * Lines in a FIXED priority (never "what reads best"): the child's own requests first, then the moves that change the
 * teaching. Each entry: the code family it counts and its line.
 */
const MOVES = [
  { code: "move.reteach", line: (n, x) => `${x.T} explained an idea a second way${cnt(n)}${x.mis ? ", after an answer that fitted a common mix-up" : ", after an answer that was not right yet"}.` },
  { code: "move.worked_example", line: (n, x) => `${x.T} showed a worked example first${cnt(n)}.` },
  { code: "move.hint", line: (n, x) => `${x.T} gave a hint before any answer${cnt(n)}.` },
  { code: "move.teachback", line: (n, x) => `${x.T} asked ${x.name} to explain it back${cnt(n)}.` },
  { code: "move.show_module", line: (n, x) => `${x.T} opened something on screen to show the idea${cnt(n)}.` },
  { code: "move.retrieval", line: (n, x) => `${x.T} started with questions from earlier topics${n > 1 ? `, ${n2(n)}` : ""}.` },
  { code: "move.break", line: (n, x) => `${x.T} offered a break${cnt(n)}.` },
];
export const MAX_LINES = 4;

/**
 * PURE. One lesson's brain_trace rows ({ move, reasons, misconception_id }) → its "why" lines.
 * @returns {{ code: string, n: number, text: string }[]}
 */
export function whyLines(rows, { name, T, ways = [] }) {
  const out = [];
  // the child's requests, counted once per turn, in ASKED order
  const asked = new Map();
  for (const r of rows) for (const code of new Set(r.reasons ?? [])) {
    const t = String(code).startsWith("request.") ? code.slice(8) : null;
    if (t && ASKED[t]) asked.set(t, (asked.get(t) ?? 0) + 1);
  }
  for (const t of Object.keys(ASKED)) {
    const n = asked.get(t);
    if (n) out.push({ code: `request.${t}`, n, text: `${name} asked for ${ASKED[t]}${n > 1 ? ` (${n2(n)})` : ""}, and ${T} did that.` });
  }
  // the way she explained each new idea (decision_record explain_format; what Taxila did, never how the child learns)
  const per = new Map();
  for (const w of ways) if (WAY_LABEL[w]) per.set(w, (per.get(w) ?? 0) + 1);
  for (const [w, n] of [...per].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 2)) {
    out.push({ code: `way.${w}`, n, text: `${T} explained ${n > 1 ? `${n} new ideas` : "a new idea"} with ${WAY_LABEL[w].en}.` });
  }
  for (const m of MOVES) {
    const hit = rows.filter((r) => `move.${r.move}` === m.code);
    if (hit.length) out.push({ code: m.code, n: hit.length, text: m.line(hit.length, { name, T, mis: hit.some((r) => r.misconception_id) }) });
  }
  return out.slice(0, MAX_LINES);
}

/**
 * PURE. round 8 (dc-r8-one-reader-with-because): a lesson's decision_record rows with point_id knows.<choice> → plain lines
 * in the parent's language. Titles come from the lesson's kit (skills, misconceptions) and the curriculum (topics).
 * @param {{ point_id: string, options: { on?: string, fact?: object, source?: string } }[]} rows
 */
export function becauseOf(rows, { name, lang, kit = null, seed = 0 }) {
  const recs = (rows ?? []).filter((r) => String(r.point_id ?? "").startsWith("knows.")).map((r) => {
    const o = typeof r.options === "string" ? JSON.parse(r.options) : r.options ?? {};
    return { choice: String(r.point_id).slice(6), on: o.on ?? null, fact: o.fact ?? {}, source: o.source ?? null };
  });
  const skills = Object.fromEntries((kit?.skills ?? []).map((s) => [s.id, s.title]));
  const mixups = Object.fromEntries((kit?.misconceptions ?? []).map((m) => [m.id, { en: m.belief }]));
  const topics = {};
  for (const r of recs) for (const id of [r.on, r.fact?.prereqTopicId, r.fact?.insteadOf]) { const t = id ? getTopic(id) : null; if (t) topics[id] = t.title; }
  return becauseLines(recs, { lang, name, seed, skills, mixups, topics });
}

/** Fixed copy: how the teacher works, the same for every child (no claim about the child). */
export const APPROACH = Object.freeze([
  "Starts each lesson with a few questions from earlier topics, so they stay fresh.",
  "Explains one step at a time, then asks a question before moving on.",
  "When an answer fits a common mix-up, explains the idea another way instead of repeating it.",
  "Gives a hint before an answer, so your child gets the chance to finish it.",
]);

/**
 * The page's data for one child.
 * @param {{ id: string, first_name: string }} child @param {{ T: string, q?: Function }} o
 */
export async function teachingOf(child, { T, q = dbq } = {}) {
  const lessons = await q(`select l.id, l.topic_id, l.started_at from lesson l where l.child_id = $1 and ${COUNTED_LESSON_SQL("l")}
      order by l.started_at desc limit 5`, [child.id]).catch(() => []);
  const ids = lessons.map((l) => String(l.id));
  const trace = ids.length ? await q("select lesson_id, move, reasons, misconception_id from brain_trace where lesson_id = any($1::uuid[]) order by lesson_id, turn",
    [ids]).catch(() => []) : [];
  const ways = ids.length ? await q("select lesson_id, chosen from decision_record where lesson_id = any($1::uuid[]) and point_id = 'explain_format' order by id",
    [ids]).catch(() => []) : [];
  const madeFor = await madeForOf(child.id, { limit: 6, q }).catch(() => []);
  // round 8: what she chose for this child and why (decision_record knows.<choice>, written by brain/turn.js)
  const knows = ids.length ? await q("select lesson_id, point_id, options from decision_record where lesson_id = any($1::uuid[]) and point_id like 'knows.%' order by id",
    [ids]).catch(() => []) : [];
  const kits = new Map(await Promise.all([...new Set(lessons.map((l) => l.topic_id))].map(async (t) => [t, await getKit(t, { generate: false }).catch(() => null)])));
  return {
    approach: APPROACH,
    lessons: lessons.map((l) => ({
      id: String(l.id), topic: getTopic(l.topic_id)?.title ?? null, startedAt: new Date(l.started_at).toISOString(),
      why: whyLines(trace.filter((r) => String(r.lesson_id) === String(l.id)), { name: child.first_name, T,
        ways: ways.filter((w) => String(w.lesson_id) === String(l.id)).map((w) => w.chosen) }),
      because: becauseOf(knows.filter((r) => String(r.lesson_id) === String(l.id)), { name: child.first_name, lang: child.language_pref, kit: kits.get(l.topic_id), seed: String(l.id) }),
    })),
    madeFor,
  };
}
