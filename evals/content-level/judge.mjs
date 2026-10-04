// Blind grade-level judge for evals/content-level/out/samples.json (CONTENT-LEVEL.md, 2026-10-04).
// The judge sees class, subject, NCERT book, chapter, topic outcome and the item (prompt + key). It does NOT see
// the kit's difficulty label, queue position, or the other rater's verdict. Rubric fixed before any output was read.
//
// Run: node --env-file=.env.local evals/content-level/judge.mjs [bank|served|all]
// Never logs the key. Payloads are curriculum items (no child data).
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const OUT = new URL("./out/", import.meta.url);
const which = process.argv[2] || "all";
const S = JSON.parse(readFileSync(new URL("samples.json", OUT), "utf8"));
const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
const key = process.env.AZURE_OPENAI_API_KEY;
const model = process.env.DEPLOY_BRAIN || "taxila-brain";
if (!endpoint || !key) throw new Error("AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY missing (run with --env-file=.env.local)");

export const RUBRIC = `You are an experienced CBSE school teacher and NCERT item writer. For each item, estimate the school class
(1-10) at which a typical CBSE student would find this exact question appropriately demanding: the class whose NCERT exercises ask
questions of this cognitive demand (number size, steps, abstraction, vocabulary, reasoning). Judge the QUESTION as posed, not the
chapter title: a class-7 chapter can contain a question a class-2 child could answer.
Then give a verdict relative to the item's stated class C:
- "too_easy": a typical student of class C-2 or below could answer it without being taught this chapter (everyday fact, single
  recall, tiny numbers, picture-book vocabulary), or it is below what NCERT class C exercises ask.
- "right": demand matches NCERT class C (a gentle first step of a class-C idea is still "right" only if it needs the class-C concept).
- "too_hard": demand clearly beyond class C (C+2 or above) or needs concepts not yet taught by class C.
Reply as JSON: {"r":[{"id":"...","grade":<1-10>,"verdict":"too_easy|right|too_hard","why":"<= 12 words"}]} in input order.`;

const fmt = (r) => ({ id: r.id, class: r.class, subject: r.subject, book: r.book, chapter: r.chapter, topic: r.topic,
  outcome: (r.outcomes || [])[0] || "", question: r.prompt, key: String(r.answer).slice(0, 160) });

async function call(batch) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: "POST", headers: { "content-type": "application/json", "api-key": key },
      body: JSON.stringify({ model, response_format: { type: "json_object" }, max_completion_tokens: 8000,
        messages: [{ role: "system", content: RUBRIC }, { role: "user", content: JSON.stringify(batch.map(fmt)) }] }),
    });
    if (res.ok) {
      const j = await res.json();
      try { return { r: JSON.parse(j.choices[0].message.content).r, usage: j.usage }; } catch { /* retry */ }
    } else if (res.status !== 429 && res.status < 500) { throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); }
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
  throw new Error("judge failed 3x");
}

const outFile = new URL("judge-gpt5.json", OUT);
const done = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : {};
const FULL = which === "full" ? JSON.parse(readFileSync(new URL("full.json", OUT), "utf8")) : [];
const todo = (which === "full" ? FULL : [...(which !== "served" ? S.bank : []), ...(which !== "bank" ? S.served : [])]).filter((r, i, a) => !done[r.id] && a.findIndex((x) => x.id === r.id) === i);
const B = 20, CONC = 4;
let tokens = { in: 0, out: 0 };
const batches = []; for (let i = 0; i < todo.length; i += B) batches.push(todo.slice(i, i + B));
let next = 0;
async function worker() {
  while (next < batches.length) {
    const b = batches[next++];
    const { r, usage } = await call(b);
    tokens.in += usage?.prompt_tokens ?? 0; tokens.out += usage?.completion_tokens ?? 0;
    for (const x of r || []) if (b.some((y) => y.id === x.id)) done[x.id] = { grade: x.grade, verdict: x.verdict, why: x.why };
    writeFileSync(outFile, JSON.stringify(done, null, 1));
    process.stdout.write(".");
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
console.log(`\njudged ${Object.keys(done).length} items; tokens in ${tokens.in} out ${tokens.out} (model ${model})`);
