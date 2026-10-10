// Run from the repo root: node docs/research/round4/tutor/school-today-probe.mjs (TUTOR-MODEL.md §2.3; 2026-10-10 result: matchTopic 7/12 right, 2 wrong, 3 miss; findTopic 0/12).
// Probe: how today's lexical routers map a child's "what happened at school today" answer onto the syllabus.
// Read-only: imports the repo's pure matchers, no DB, no network. Labels written BEFORE running (gold = acceptable topic ids
// or chapter prefixes; null = no syllabus topic should be claimed).
import { matchTopic } from "../../../../server/lesson/purpose.js";
import { findTopic, getTopic } from "../../../../server/content/curriculum.js";

const cases = [
  // [class, utterance, acceptable prefixes (topic or chapter ids), note]
  [6, "aaj fractions padhaya, ma'am ne equivalent fractions kiya", ["c6-maths-ch07"], "fractions chapter, equivalent topic"],
  [5, "aaj school mein equivalent fractions padhe", ["c5-maths"], "c5 equivalent fractions"],
  [6, "science mein aaj food ke components padhaye", ["c6-science-ch03"], "components of food"],
  [4, "aaj maths mein kuch nahi hua, bas test tha", [null], "no topic: a test"],
  [7, "sir ne integers ka chapter shuru kiya, negative numbers", ["c7-maths"], "integers c7"],
  [6, "hindi mein kavita padhi", ["c6-hindi"], "a poem in Hindi class, which one unknown"],
  [5, "aaj kuch khaas nahi, ma'am ne copy check ki", [null], "nothing taught"],
  [6, "angles padhaye, acute obtuse wale", ["c6-maths-ch02"], "lines and angles"],
  [7, "photosynthesis padha science mein", ["c7-science"], "nutrition in plants"],
  [8, "aaj history mein mughal empire padhaya", ["c8-sst", "c7-sst"], "SST history"],
  [4, "table of 7 yaad karna hai kal test hai", ["c4-maths", "c3-maths"], "multiplication tables + a test tomorrow"],
  [6, "mujhe dinosaurs ke baare mein jaanna hai", [null], "outside the graph"],
];

let right = 0, wrong = 0, miss = 0;
for (const [cls, text, gold, note] of cases) {
  const m = matchTopic(text, cls);
  const f = findTopic(text, cls);
  const pick = m?.topicId ?? null;
  const ok = gold.includes(null) ? pick === null : !!pick && gold.some((g) => g && pick.startsWith(g));
  if (ok) right++; else if (pick === null) miss++; else wrong++;
  console.log(`${ok ? "OK  " : pick === null ? "MISS" : "WRONG"} c${cls} | ${text}\n      matchTopic=${pick} (${pick ? getTopic(pick)?.title : "-"}) score=${m?.score ?? "-"} | findTopic=${f?.id ?? null} | gold=${gold.join(",")} | ${note}`);
}
console.log(`\nmatchTopic: right ${right}/${cases.length}, wrong ${wrong}, miss ${miss}`);
