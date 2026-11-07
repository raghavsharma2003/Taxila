// READ-ONLY on TEST: worked_example teacher lines that hand the child a sum, split by whether the child's line before was a
// don't-know (code read: classifyFast flags). Counts only; the url is never printed; child words never printed.
if (!process.env.TEST_DATABASE_URL) throw new Error("no TEST url");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = ""; process.env.TAXILA_DB = ""; delete process.env.CONDUCTOR_TEST_DATABASE_URL;
const { q } = await import("/home/user/Taxila/server/db.js");
const { asksToCompute } = await import("/home/user/Taxila/server/brain/say.js");
const { sentences } = await import("/home/user/Taxila/server/conversation/guards.js");
const rows = await q(`select lesson_id, seq, speaker, text, meta->>'move' as move from turn where speaker in ('child','teacher') order by lesson_id, seq`);
const DK = /(?<![\p{L}])(?:pata\s+nahi|pata\s+nahin|nahi\s+pata|samajh\s+nahi|i\s+don'?t\s+know|don'?t\s+know|no\s+idea|nahi\s+aata)(?![\p{L}])/iu;
let prev = null; const c = { worked: 0, workedQuiz: 0, afterDk: 0, afterDkQuiz: 0 };
for (const r of rows) {
  if (r.speaker === "child") { prev = r; continue; }
  if (r.move !== "worked_example") continue;
  c.worked++; const quiz = sentences(r.text).some(asksToCompute); if (quiz) c.workedQuiz++;
  if (prev && prev.lesson_id === r.lesson_id && DK.test(prev.text ?? "")) { c.afterDk++; if (quiz) c.afterDkQuiz++; }
}
console.log(c); process.exit(0);
