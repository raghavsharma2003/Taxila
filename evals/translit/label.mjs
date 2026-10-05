// label.mjs — gold labels for the translit eval: per word, "=" (keep Latin: an English word as an Indian teacher says it,
// a name, an acronym) or the standard Devanagari spelling of a Hindi word. Two labelers from DIFFERENT families
// (gpt-6.1-sol and DeepSeek-V4-Flash-0731, both Azure Direct, eastus2) label independently; adjudicate.mjs merges.
// A model labels the reference here; it never grades the system (scoring is exact-match code in run.mjs).
//   set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 node evals/translit/label.mjs <gpt61|ds4f> [maxDev]
import fs from "node:fs";
import path from "node:path";
import { words } from "./tokens.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const MODELS = { gpt61: { dep: "taxila-gpt61-sol", effort: "low", max: 6000 }, ds4f: { dep: "taxila-ds4f-0731", max: 6000 } };
const who = process.argv[2]; const M = MODELS[who]; if (!M) throw new Error("model: gpt61|ds4f");
const MAX_DEV = Number(process.argv[3] ?? 700);
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, "data/corpus.json"), "utf8"));
const rows = [...corpus.rows.filter((r) => r.split === "test"), ...corpus.rows.filter((r) => r.split === "dev").slice(0, MAX_DEV)];
const OUT = path.join(HERE, `data/labels-${who}.json`);
const done = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { model: M.dep, labels: {}, usage: { in: 0, out: 0 } };
const save = () => fs.writeFileSync(OUT, JSON.stringify(done, null, 0));

const SYS = `You prepare Hinglish teacher text for a Hindi text-to-speech voice. The text is spoken Hinglish written in Roman script.
For EVERY numbered word, decide how the voice must receive it:
- "=" : keep it in Latin script. Use this for English words (including everyday English words inside a Hindi sentence: water, step, example, picture, fraction, total, ready, okay, sorry), person and place names (Zoya, Bittu, Arjun, Delhi), acronyms (AI, NCERT) and anything that is not Hindi.
- otherwise: the standard Devanagari spelling of the Hindi/Urdu word as a Hindi school textbook would print it (हैं, नहीं, पैंतीस, सोचिए, बताइए, ज़रा, पहले, थोड़ा). Hindi number words always go to Devanagari (ek एक, do दो, teen तीन, paintees पैंतीस, sau सौ, hazaar हज़ार, lakh लाख, aadha आधा, dugna दुगना).
Decide ambiguous spellings from context: "main" मैं vs English main; "do" दो (two) or दो (give) vs English do; "par" पर; "is" इस vs English is; "us" उस; "me"/"mein" में; "the" थे; "to"/"toh" तो; "hi" ही vs English hi; "bas" बस; "hum" हम; "ho" हो; "jab" जब; "more" etc.
Return JSON {"r":[{"id":"<reply id>","t":["...", "...", ...]}]} with exactly one entry per numbered word, in order.`;

function fmt(r) { return `${r.id}: ` + words(r.text).map((x, k) => `${k}:${x.w}`).join(" ") + `\n  (sentence: ${r.text})`; }

async function call(batch) {
  const body = { model: M.dep, messages: [{ role: "system", content: SYS }, { role: "user", content: batch.map(fmt).join("\n") }],
    max_completion_tokens: M.max, response_format: { type: "json_object" } };
  if (M.effort) body.reasoning_effort = M.effort;
  for (let a = 0; a < 4; a++) {
    const res = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "").replace(/\/openai\/v1$/, "")}/openai/v1/chat/completions`, {
      method: "POST", headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.status === 429 || res.status >= 500) { await new Promise((s) => setTimeout(s, 3000 * (a + 1))); continue; }
    const j = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(j).slice(0, 200)}`);
    done.usage.in += j.usage?.prompt_tokens ?? 0; done.usage.out += j.usage?.completion_tokens ?? 0;
    try { return JSON.parse(j.choices[0].message.content).r; } catch { continue; }
  }
  return [];
}

const todo = rows.filter((r) => !done.labels[r.id]);
const B = 8; const batches = [];
for (let i = 0; i < todo.length; i += B) batches.push(todo.slice(i, i + B));
let k = 0;
async function worker() {
  while (k < batches.length) {
    const b = batches[k++];
    try {
      const out = await call(b);
      for (const e of out ?? []) {
        const r = b.find((x) => x.id === e.id); if (!r) continue;
        if (Array.isArray(e.t) && e.t.length === words(r.text).length) done.labels[r.id] = e.t;
      }
    } catch (e) { console.warn("batch failed", e.message); }
    save();
    process.stdout.write(`\r${who} ${Object.keys(done.labels).length}/${rows.length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
save();
console.log(`\n${who} labelled ${Object.keys(done.labels).length}/${rows.length}; tokens in=${done.usage.in} out=${done.usage.out}`);
