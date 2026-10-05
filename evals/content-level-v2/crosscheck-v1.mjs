// Independent cross-check of the served-new result with the v1 instrument (CONTENT-LEVEL §1): v1's rubric, verbatim, on
// v1's model (taxila-brain). The v2 raters both CALIBRATED the re-levelled items and MEASURED served-new, so their 19% -> 3%
// is partly by construction; v1's judge took no part in selection. Old kit items reuse v1's own grades
// (evals/content-level/out/judge-gpt5.json covers all 5,076 class 4-7 items); only new items are judged here.
//   node --env-file=.env.local evals/content-level-v2/crosscheck-v1.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { chatJSON, pool } from "./lib/azure-lite.mjs";
import { getTopic } from "../../server/content/curriculum.js";
import { pct } from "./lib/stats.mjs";

// Copied verbatim from evals/content-level/judge.mjs (that file runs on import); the hash below pins it.
const RUBRIC = `You are an experienced CBSE school teacher and NCERT item writer. For each item, estimate the school class
(1-10) at which a typical CBSE student would find this exact question appropriately demanding: the class whose NCERT exercises ask
questions of this cognitive demand (number size, steps, abstraction, vocabulary, reasoning). Judge the QUESTION as posed, not the
chapter title: a class-7 chapter can contain a question a class-2 child could answer.
Then give a verdict relative to the item's stated class C:
- "too_easy": a typical student of class C-2 or below could answer it without being taught this chapter (everyday fact, single
  recall, tiny numbers, picture-book vocabulary), or it is below what NCERT class C exercises ask.
- "right": demand matches NCERT class C (a gentle first step of a class-C idea is still "right" only if it needs the class-C concept).
- "too_hard": demand clearly beyond class C (C+2 or above) or needs concepts not yet taught by class C.
Reply as JSON: {"r":[{"id":"...","grade":<1-10>,"verdict":"too_easy|right|too_hard","why":"<= 12 words"}]} in input order.`;
const V1_SRC = readFileSync(new URL("../content-level/judge.mjs", import.meta.url), "utf8");
if (!V1_SRC.includes(RUBRIC)) throw new Error("v1 RUBRIC drifted from evals/content-level/judge.mjs");

const OUT = new URL("./out/", import.meta.url);
const v1 = JSON.parse(readFileSync(new URL("../content-level/out/judge-gpt5.json", import.meta.url), "utf8"));
const outFile = new URL("crosscheck-v1.json", OUT);
const mine = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : {};
const grade = (id) => v1[id] ?? mine[id];

const rows = { old: JSON.parse(readFileSync(new URL("served-old.json", OUT), "utf8")), new: JSON.parse(readFileSync(new URL("served-new.json", OUT), "utf8")) };
const todo = rows.new.filter((r) => r.pos <= 2 && !grade(r.id));
const fmt = (r) => { const t = getTopic(r.topicId); return { id: r.id, class: r.class, subject: r.subject, book: t.book, chapter: t.chapter.title, topic: t.title, outcome: t.outcomes[0] || "", question: r.prompt, key: String(r.answer).slice(0, 160) }; };
const batches = []; for (let i = 0; i < todo.length; i += 20) batches.push(todo.slice(i, i + 20));
let cost = 0;
await pool(batches, 4, async (b) => {
  const { json, cost: c } = await chatJSON("taxila-brain", RUBRIC, JSON.stringify(b.map(fmt)), { maxTokens: 8000, effort: undefined, tag: "crosscheck-v1" });
  cost += c;
  for (const x of json.r || []) if (b.some((y) => y.id === x.id)) mine[x.id] = { grade: x.grade, verdict: x.verdict, why: x.why };
  writeFileSync(outFile, JSON.stringify(mine, null, 1));
  process.stdout.write(".");
});
const table = [];
for (const which of ["old", "new"]) for (const pos of [1, 2]) for (const c of [4, 5, 6, 7, "all"]) {
  const xs = rows[which].filter((r) => r.pos === pos && (c === "all" || r.class === c) && !r.diagnostic && grade(r.id));
  const strict = xs.filter((r) => grade(r.id).grade <= r.class - 2).length;
  const easy = xs.filter((r) => grade(r.id).verdict === "too_easy").length;
  table.push({ which, pos, class: c, n: xs.length, strict, tooEasyVerdict: easy, meanGrade: +(xs.reduce((s, r) => s + grade(r.id).grade, 0) / (xs.length || 1)).toFixed(2) });
}
writeFileSync(new URL("crosscheck-v1-table.json", OUT), JSON.stringify({ rubricSha: createHash("sha256").update(RUBRIC).digest("hex").slice(0, 16), table, note: "diagnostic pseudo-items excluded (v1 graded kit items only)" }, null, 1));
console.log(`\nv1 judge (taxila-brain, v1 rubric), queue items (diagnostics excluded); this run $${cost.toFixed(3)}`);
console.log("| queue | pos | class | n | grade <= C-2 | verdict too_easy | mean grade |");
for (const r of table) console.log(`| ${r.which} | ${r.pos} | ${r.class} | ${r.n} | ${pct(r.strict, r.n)} | ${pct(r.tooEasyVerdict, r.n)} | ${r.meanGrade} |`);
