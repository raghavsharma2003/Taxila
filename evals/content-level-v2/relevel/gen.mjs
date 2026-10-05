// RS-6 F1 pre-work: re-levelled openers + a harder path for every class 4-7 topic, and hint fixes for items whose blind
// solver said a rung 1-3 hint gives the answer. Writes data/kits-relevel/c{C}-{subject}.json (an OVERLAY, never data/kits).
//
//   node --env-file=.env.local evals/content-level-v2/relevel/gen.mjs [--only c4-maths] [--limit N] [--topics id,id]
//
// Generator: taxila-gpt6 (gpt-6-sol), effort low. Keys are blind-solved afterwards by another family (solve.mjs), and
// the grade is set by two raters with rubric v2 (judge.mjs relevel), so nothing here is trusted on the generator's word.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { getTopic, topicSequence } from "../../../server/content/curriculum.js";
import { kitFromFile } from "../../../server/content/kits.js";
import { buildPracticeQueue, findItem } from "../../../server/director/items.js";
import { chatJSON, pool } from "../lib/azure-lite.mjs";
import { hintLeakNote } from "../lib/leaks.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ONLY = arg("--only"), LIMIT = Number(arg("--limit")) || Infinity, TOPICS = arg("--topics")?.split(","), REPAIR = process.argv.includes("--repair"), REPAIR_HARDER = process.argv.includes("--repair-harder");
const MODEL = "taxila-gpt6";
const DIR = new URL("../../../data/kits-relevel/", import.meta.url);
const SUBJECTS = { 4: ["maths", "evs", "english", "hindi"], 5: ["maths", "evs", "english", "hindi"],
  6: ["maths", "science", "sst", "english", "hindi"], 7: ["maths", "science", "sst", "english", "hindi"] };

export const SYSTEM = `You write practice questions for an Indian AI tutor (CBSE/NCERT 2025-26 books). Learners are 9-15 years old.
You get one topic of class C and the questions the tutor currently opens it with. Those openers are too easy: many are
questions a child two classes younger could answer. Write replacements and a harder path.

Write:
- openers: exactly 2 questions. Each is a gentle FIRST step that still needs the class-C idea of this topic (a class C-2
  child must NOT be able to answer it from everyday knowledge). Opener 1 on the first skill, opener 2 on the first or
  second skill. The two openers must use different situations/objects from each other and from the current openers.
- harder: exactly 3 questions forming a harder path: end-of-class-C demand or a stretch into early class C+1
  (two linked steps, a why, an unfamiliar setting, or bigger numbers). Cover different skills; include the LAST skill.
- hintFixes: for each item listed under "leakyHints", 4 new hints for that same question.

Every question:
- Is answerable by speech or a short typed answer, and gradable against your key: a number with unit, a word or short
  phrase, or a choice between named options stated in the question. A "why" is allowed in harder only, with the key idea
  as the answer.
- At most 45 words. Self-contained: any data or short passage it needs is inside the question.
- Register for 9-15 year olds: real situations they care about (cricket and kabaddi scores, phone data, metro and train
  timetables, cooking, money in rupees, school events, science in the news, games). No baby characters, no pretend
  animals talking, no "little friend", no cartoon framing.
- Indian conventions: rupees, lakh/crore grouping, metric units, Indian names and places.
- prompt_hi: the same question as an Indian teacher would say it in natural Hinglish (Roman script). For a Hindi-subject
  topic, write prompt_en in English and prompt_hi in Devanagari Hindi; the key in the language the question asks for.
- hints: 4 short teacher nudges, each <= 14 words: 1 a nudge question, 2 point at the idea that unlocks it, 3 a fill-in
  with the key step left blank, 4 the answer with a one-line reason. Hints 1-3 must NOT contain the answer or any
  accepted form of it, and must not make it obvious (no "1 to 6 each on a face" for "how many faces").
- acceptable: other correct forms of the key (spoken number words in English and Hindi/Hinglish, units omitted, etc.).
- grade: your estimate of the class (decimals allowed) whose NCERT exercises match the demand.
- demand: recall | apply | reason | transfer. kind: practice | near_transfer | far_transfer | predict | contrast | why.

Reply as JSON:
{"openers":[{"skillId":"...","kind":"...","demand":"...","grade":n,"prompt_en":"...","prompt_hi":"...","answer":"...","acceptable":["..."],"hints":["","","",""]}],
 "harder":[ same shape ], "hintFixes":[{"id":"...","hints":["","","",""]}]${""}}`;

const REPAIR_SYSTEM = SYSTEM.split("Write:\n")[0] + `Write exactly 3 questions as "items": typical exercises from the class-C NCERT 2025-26 book for this topic, at the
MIDDLE of class C. A reviewer will rate each question by the class whose NCERT exercises match its demand (number size,
steps, abstraction, vocabulary, reasoning), WITHOUT being told the chapter; anything a child two classes younger could
answer from everyday knowledge is rejected. So each question must need the class-C idea itself, not just a familiar
setting. Do not repeat "alreadyWritten". Cover the first skills of the topic.
` + SYSTEM.slice(SYSTEM.indexOf("Every question:")).replace(/Reply as JSON:[\s\S]*$/, `Reply as JSON: {"items":[{"skillId":"...","kind":"...","demand":"...","grade":n,"prompt_en":"...","prompt_hi":"...","answer":"...","acceptable":["..."],"hints":["","","",""]}]}`);

const DICE_EXTRA = `This topic's diagnostic is also being rewritten. Add "diagnostic": {"prompt_en","prompt_hi","options":[{"text","correct"}]}
with 3 options: a class-4 hidden-face question (for example a cuboid net or the faces you cannot see on a stacked box),
exactly one correct, one option carrying the "counts only the visible faces" belief.`;

function topicInput(topic, kit) {
  const s0 = { itemsDone: [], skipped: [], skills: {}, seed: 20261004, ctx: {} };
  const head = buildPracticeQueue(kit).slice(0, 3).map((id) => findItem(s0, kit, id)).filter(Boolean);
  const leaky = kit.items.filter(hintLeakNote).map((i) => ({ id: i.id, question: i.prompt_en, answer: i.answer, oldHints: i.hints }));
  const sample = kit.items.find((i) => i.kind === "practice" && i.difficulty >= 3) ?? kit.items[0];
  return {
    class: topic.classLevel, subject: topic.subject, book: topic.book, chapter: `${topic.chapter.number}. ${topic.chapter.title}`,
    topic: topic.title, outcomes: topic.outcomes, skills: kit.skills.map((s) => ({ id: s.id, title: s.title })),
    currentOpeners: head.map((i) => ({ id: i.id, question: i.prompt_en, answer: i.answer })),
    otherQuestions: kit.items.filter((i) => !head.some((h) => h.id === i.id)).slice(0, 14).map((i) => i.prompt_en.slice(0, 90)),
    formatExample: { prompt_en: sample.prompt_en, prompt_hi: sample.prompt_hi, answer: sample.answer, acceptable: sample.acceptable, hints: sample.hints },
    leakyHints: leaky,
  };
}

const LANG_EXTRA = (s) => (s === "english" || s === "hindi")
  ? `Language topic: the chapter is a text in the class-C ${s} book; you do not have the text. Write questions that stand alone
at class-C language demand: grammar in context, word meaning from a sentence you give, inference from a short passage you
write (<= 35 words) on the chapter's theme, sentence transformation, register and format. Never spelling of everyday words,
rhymes for their own sake, or picture vocabulary.` : "";

const files = new Map();
const fileFor = (c, s) => {
  const k = `c${c}-${s}`;
  if (!files.has(k)) {
    const f = new URL(`${k}.json`, DIR);
    files.set(k, existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : { class: c, subject: s, version: 1, generator: MODEL, date: "2026-10-04", topics: [] });
  }
  return files.get(k);
};
const save = (c, s) => writeFileSync(new URL(`c${c}-${s}.json`, DIR), JSON.stringify(fileFor(c, s), null, 1));

const jobs = [];
for (const c of [4, 5, 6, 7]) for (const s of SUBJECTS[c]) {
  if (ONLY && ONLY !== `c${c}-${s}`) continue;
  for (const tid of topicSequence(c, s)) {
    if (TOPICS && !TOPICS.includes(tid)) continue;
    const existing = fileFor(c, s).topics.find((t) => t.topicId === tid);
    if (existing && !REPAIR && !REPAIR_HARDER) continue;
    if (REPAIR && (!existing || existing.ongrade?.length)) continue;
    if (REPAIR_HARDER && (!existing || existing.harder.length > 3)) continue;
    const topic = getTopic(tid); const kit = kitFromFile(topic);
    if (kit) jobs.push({ c, s, topic, kit });
  }
}
const todo = jobs.slice(0, LIMIT);
let cost = 0, fails = 0;
await pool(todo, 8, async ({ c, s, topic, kit }) => {
  const input = topicInput(topic, kit);
  if (REPAIR) return repair({ c, s, topic, kit, input });
  if (REPAIR_HARDER) return repairHarder({ c, s, topic, kit, input });
  const isDice = topic.id === "c4-maths-ch01-t01";
  const sys = SYSTEM + (LANG_EXTRA(s) ? "\n\n" + LANG_EXTRA(s) : "") + (isDice ? "\n\n" + DICE_EXTRA : "");
  let out;
  try { out = await chatJSON(MODEL, sys, JSON.stringify(input), { maxTokens: 9000, effort: "low", tag: `relevel:${topic.id}` }); }
  catch (e) { fails++; console.warn(`\n${topic.id}: ${e.message}`); return; }
  cost += out.cost;
  const j = out.json;
  const skillIds = new Set(kit.skills.map((x) => x.id));
  const fix = (it, role, n) => ({
    id: `${topic.id}-rl-${role === "opener" ? "o" : "h"}${n + 1}`, role, skillId: skillIds.has(it.skillId) ? it.skillId : kit.skills[role === "opener" ? 0 : Math.min(n, kit.skills.length - 1)].id,
    kind: ["practice", "near_transfer", "far_transfer", "predict", "contrast", "why"].includes(it.kind) ? it.kind : "practice",
    demand: it.demand, genGrade: Number(it.grade) || null,
    prompt_en: String(it.prompt_en || "").trim(), prompt_hi: String(it.prompt_hi || "").trim(), answer: String(it.answer || "").trim(),
    acceptable: Array.isArray(it.acceptable) ? it.acceptable.map(String) : [], hints: Array.isArray(it.hints) ? it.hints.map(String).slice(0, 4) : [],
  });
  const rec = {
    topicId: topic.id, replacesOpeners: input.currentOpeners.map((o) => o.id),
    openers: (j.openers || []).slice(0, 2).map((it, n) => fix(it, "opener", n)),
    harder: (j.harder || []).slice(0, 3).map((it, n) => fix(it, "harder", n)),
    hintFixes: (j.hintFixes || []).filter((h) => input.leakyHints.some((l) => l.id === h.id) && Array.isArray(h.hints) && h.hints.length === 4),
    ...(isDice && j.diagnostic ? { diagnosticRewrite: { misconceptionId: "c4-maths-ch01-t01-m-visible-only", ...j.diagnostic } } : {}),
    ...(isDice ? { drop: ["c4-maths-ch01-t01-i01"] } : {}),
  };
  if (topic.id === "c6-maths-ch09-t01") rec.drop = ["c6-maths-ch09-t01-i01", "c6-maths-ch09-t01-i12"];
  const f = fileFor(c, s);
  f.topics = f.topics.filter((t) => t.topicId !== topic.id).concat(rec);
  f.topics.sort((a, b) => getTopic(a.topicId).order - getTopic(b.topicId).order);
  save(c, s);
  process.stdout.write(".");
});
console.log(`\nrelevel${REPAIR ? " repair" : ""}: ${todo.length - fails}/${todo.length} topics; $${cost.toFixed(3)}`);

// Repair pass (2026-10-04): the raters graded the "gentle first step" openers LOWER than the old openers in 5 of 6
// subjects (rejected rj-rs6-gentle-opener-prompt), so topics left with < 2 on-grade items get 3 items written as plain
// mid-year class-C exercises, with the rater's own definition in the prompt.
// Harder repair (2026-10-04): topics whose 3 harder items were all rejected (solver disagreement or rated too easy) get 3
// more, written against the rater's definition of end-of-class-C demand. Ids -rl-h4..h6.
async function repairHarder({ c, s, topic, kit, input }) {
  const sys = REPAIR_SYSTEM.replace("at the\nMIDDLE of class C", "at the\nEND of class C or a stretch into early class C+1 (two linked steps, a why, or an unfamiliar setting)").replace("Cover the first skills of the topic.", "Cover the later skills of the topic.") + (LANG_EXTRA(s) ? "\n\n" + LANG_EXTRA(s) : "");
  const all = fileFor(c, s).topics.find((t) => t.topicId === topic.id);
  const prior = [...all.openers, ...(all.ongrade || []), ...all.harder].map((i) => i.prompt_en.slice(0, 90));
  let out;
  try { out = await chatJSON(MODEL, sys, JSON.stringify({ ...input, alreadyWritten: prior }), { maxTokens: 9000, effort: "low", tag: `relevel-repair-harder:${topic.id}` }); }
  catch (e) { fails++; console.warn(`\n${topic.id}: ${e.message}`); return; }
  cost += out.cost;
  const skillIds = new Set(kit.skills.map((x) => x.id));
  all.harder.push(...(out.json.items || []).slice(0, 3).map((it, n) => ({
    id: `${topic.id}-rl-h${n + 4}`, role: "harder", skillId: skillIds.has(it.skillId) ? it.skillId : kit.skills[Math.max(0, kit.skills.length - 1 - n)].id,
    kind: ["practice", "near_transfer", "far_transfer", "predict", "contrast", "why"].includes(it.kind) ? it.kind : "near_transfer",
    demand: it.demand, genGrade: Number(it.grade) || null,
    prompt_en: String(it.prompt_en || "").trim(), prompt_hi: String(it.prompt_hi || "").trim(), answer: String(it.answer || "").trim(),
    acceptable: Array.isArray(it.acceptable) ? it.acceptable.map(String) : [], hints: Array.isArray(it.hints) ? it.hints.map(String).slice(0, 4) : [],
  })));
  save(c, s);
  process.stdout.write("h");
}

async function repair({ c, s, topic, kit, input }) {
  const sys = REPAIR_SYSTEM + (LANG_EXTRA(s) ? "\n\n" + LANG_EXTRA(s) : "");
  const all = fileFor(c, s).topics.find((t) => t.topicId === topic.id);
  const prior = [...all.openers, ...all.harder].map((i) => i.prompt_en.slice(0, 90));
  let out;
  try { out = await chatJSON(MODEL, sys, JSON.stringify({ ...input, alreadyWritten: prior }), { maxTokens: 9000, effort: "low", tag: `relevel-repair:${topic.id}` }); }
  catch (e) { fails++; console.warn(`\n${topic.id}: ${e.message}`); return; }
  cost += out.cost;
  const skillIds = new Set(kit.skills.map((x) => x.id));
  all.ongrade = (out.json.items || []).slice(0, 3).map((it, n) => ({
    id: `${topic.id}-rl-g${n + 1}`, role: "ongrade", skillId: skillIds.has(it.skillId) ? it.skillId : kit.skills[Math.min(n, kit.skills.length - 1)].id,
    kind: ["practice", "near_transfer", "far_transfer", "predict", "contrast", "why"].includes(it.kind) ? it.kind : "practice",
    demand: it.demand, genGrade: Number(it.grade) || null,
    prompt_en: String(it.prompt_en || "").trim(), prompt_hi: String(it.prompt_hi || "").trim(), answer: String(it.answer || "").trim(),
    acceptable: Array.isArray(it.acceptable) ? it.acceptable.map(String) : [], hints: Array.isArray(it.hints) ? it.hints.map(String).slice(0, 4) : [],
  }));
  save(c, s);
  process.stdout.write("r");
}
