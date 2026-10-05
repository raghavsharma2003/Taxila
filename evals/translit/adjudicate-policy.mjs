// adjudicate-policy.mjs — the adjudication pass over data/disagreements.json, written as code so it is reproducible.
// Done 2026-10-05 by the RS-7 agent after reading all 286 distinct disagreement types (word × label pair):
//   - gpt-6.1-sol says Hindi, DeepSeek says keep  → gpt-6.1-sol (every such word is Hindi: ab, aap, tukde, namaste...).
//   - gpt-6.1-sol says keep, DeepSeek says Devanagari → keep. DeepSeek's side was a name (कबीर, आरव), a TRANSLATION of an
//     English word (number→संख्या, curd→दही, lesson→पाठ) or an English loan in Devanagari (गैप्स): none is a Hindi word
//     the speaker said. One exception: "mast" (मस्त, Hindi slang) → DeepSeek.
//   - both Devanagari, different spellings → gpt-6.1-sol (DeepSeek's variants were mostly the wrong word: दीजिए for
//     dekhiye, निकलने for nikalne, रीहना, तुकड़े).
//   node evals/translit/adjudicate-policy.mjs && node evals/translit/adjudicate.mjs
import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const dis = JSON.parse(fs.readFileSync(path.join(HERE, "data/disagreements.json"), "utf8"));
const adjPath = path.join(HERE, "data/adjudicated.json");
const adj = fs.existsSync(adjPath) ? JSON.parse(fs.readFileSync(adjPath, "utf8")) : {};
const B_WINS = new Set(["mast"]);
for (const d of dis) adj[d.key] = B_WINS.has(d.w.toLowerCase()) ? d.b : d.a;
fs.writeFileSync(adjPath, JSON.stringify(adj, null, 0));
console.log("adjudicated", Object.keys(adj).length);
