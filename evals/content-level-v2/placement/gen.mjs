// RS-6 F2 pre-work: grade-anchored placement item bank, classes 3-8, maths + EVS (3-5) + science (6-8).
// Writes data/placement/c{C}-{subject}.json. Every item is code-gradable (numeric or 4-option choice) because placement
// evidence enters θ only when code-graded (ability.js TH1), and a model never grades a child.
//
//   node --env-file=.env.local evals/content-level-v2/placement/gen.mjs [--only c4-maths]
// Afterwards: placement/solve.mjs (blind solve, other family) and judge.mjs placement gpt6|deepseek (grade anchor check).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { chatJSON, pool } from "../lib/azure-lite.mjs";
import { curriculum, scopeBlock } from "../lib/scope.mjs";

const MODEL = "taxila-gpt6";
const DIR = new URL("../../../data/placement/", import.meta.url);
const ONLY = (() => { const i = process.argv.indexOf("--only"); return i > 0 ? process.argv[i + 1] : null; })();
const BINS = [3, 4, 5, 6, 7, 8].map((c) => [c, "maths"]).concat([3, 4, 5].map((c) => [c, "evs"]), [6, 7, 8].map((c) => [c, "science"]));
// Bands on the GE scale (class C runs from GE C-1 to C). `foundation` only in class 3 maths and EVS: the back-chain floor.
const BANDS = { early: { off: -0.8, say: "the START of class C: ideas from the first third of the class-C book, one step" },
  mid: { off: -0.5, say: "the MIDDLE of class C: ideas from the middle of the book, one or two steps" },
  late: { off: -0.2, say: "the END of class C: ideas from the last third of the book, two linked steps or bigger numbers" },
  foundation: { off: -1.5, say: "class C-1 level (one class below): the foundation a class-C child must already have" } };

const SYSTEM = `You write placement questions for an Indian AI tutor (NCERT 2025-26). A placement round finds where a 9-15 year old
actually is, so each question must sit at a stated grade level and be gradable by code.
Write exactly 12 questions for the band described. Rules:
- format "numeric": the answer is one number (integer, decimal or fraction like 3/4), with "unit" if any. Or format "mcq":
  exactly 4 options, exactly one correct, the 3 wrong options are the answers of real misconceptions.
- Maths: mostly numeric. EVS and science: mcq.
- <= 35 words, text only (no picture needed), self-contained, unambiguous, one correct answer.
- Spread across the different chapters and strands of the band; never two questions on the same idea.
- Register for 9-15 year olds: real situations (sport, money in rupees, phones, travel, cooking, school, nature, news).
  No baby characters or cartoon framing. Indian names, rupees, metric units, lakh grouping.
- The demand must match the band: a child of the band's level gets it right about 7 times in 10; a child one full class
  below mostly cannot.
- prompt_hi: the same question in natural Hinglish (Roman script).
- topicRef: the id of the curriculum topic it tests, from the list given.
Reply as JSON: {"items":[{"format":"numeric|mcq","prompt_en":"...","prompt_hi":"...","answer":"...","unit":"...","options":["A","B","C","D"],
"topicRef":"...","demand":"recall|apply|reason|transfer","grade":<your class estimate, decimals allowed>}]}
For mcq, "answer" is the exact text of the correct option. Omit "options" for numeric.`;

const read = (f) => JSON.parse(readFileSync(f, "utf8"));
let cost = 0;
const jobs = [];
for (const [c, s] of BINS) {
  if (ONLY && ONLY !== `c${c}-${s}`) continue;
  const f = new URL(`c${c}-${s}.json`, DIR);
  const have = existsSync(f) ? read(f) : { class: c, subject: s, version: 1, generator: MODEL, date: "2026-10-04", items: [] };
  for (const band of ["early", "mid", "late", ...(c === 3 ? ["foundation"] : [])]) {
    if (have.items.some((i) => i.band === band)) continue;
    jobs.push({ c, s, band, f, have });
  }
}
await pool(jobs, 6, async ({ c, s, band, f, have }) => {
  const level = band === "foundation" ? c - 1 : c;
  const cur = curriculum(level, s) ?? curriculum(c, s);
  const topics = (cur?.chapters ?? []).flatMap((ch) => ch.topics.map((t) => `${t.id}: ch${ch.number} ${t.title}`));
  const user = `Class C = ${c}. Subject: ${s}. Band: ${BANDS[band].say}.\nNCERT scope:\n${scopeBlock(c, s)}\n\nCurriculum topics for topicRef (class ${level}):\n${topics.join("\n")}`;
  const { json, cost: k } = await chatJSON(MODEL, SYSTEM, user, { maxTokens: 9000, effort: "low", tag: `placement:c${c}-${s}:${band}` });
  cost += k;
  const items = (json.items || []).slice(0, 12).map((it, n) => ({
    id: `pl-c${c}-${s}-${band[0]}${String(n + 1).padStart(2, "0")}`, band, ge: +(c + BANDS[band].off).toFixed(2), geSource: "band",
    strand: `${c <= 5 && s !== "maths" ? "evs" : s}:core`, format: it.format === "mcq" ? "mcq" : "numeric",
    prompt_en: String(it.prompt_en || "").trim(), prompt_hi: String(it.prompt_hi || "").trim(), answer: String(it.answer ?? "").trim(),
    ...(it.unit ? { unit: String(it.unit) } : {}),
    ...(it.format === "mcq" && Array.isArray(it.options) ? { options: it.options.map((o) => ({ text: String(o), correct: String(o).trim() === String(it.answer).trim() })) } : {}),
    topicRef: it.topicRef, demand: it.demand, genGrade: Number(it.grade) || null,
  })).filter((it) => it.prompt_en && it.answer && (it.format !== "mcq" || (it.options?.length === 4 && it.options.filter((o) => o.correct).length === 1)));
  have.items = have.items.filter((i) => i.band !== band).concat(items);
  writeFileSync(f, JSON.stringify(have, null, 1));
  process.stdout.write(".");
});
console.log(`\nplacement: ${jobs.length} bands; $${cost.toFixed(3)}`);
