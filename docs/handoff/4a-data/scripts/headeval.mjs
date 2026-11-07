import fs from "fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor, classify } from "/home/user/Taxila/server/director/classify.js";
import { supports, completeForms, assertionOf } from "/home/user/Taxila/server/grading/corroborate.js";
import { numberPhrases } from "/home/user/Taxila/server/grading/spoken-number.js";
console.info = () => {};
const D = process.argv[2] + "/records/";
const OUT = process.argv[3];
const done = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : {};
const cases = [];
for (const f of fs.readdirSync(D)) { const r = JSON.parse(fs.readFileSync(D + f)); const arm = f.includes("--director--") ? "director" : "agent";
  for (const t of r.turns) if (t.decided) cases.push({ id: `${f}#${t.n}`, arm, item: t.reasons?.item?.id ?? t.decided.itemId, outcome: t.decided.outcome, text: String(t.child?.say ?? "") }); }
const kits = {};
const kitOf = (id) => { const topic = (id.match(/^(c\d-[a-z]+-ch\d+-t\d+)/) ?? [])[1]; if (!topic) return null; return (kits[topic] ??= (() => { const tp = getTopic(topic); return tp ? kitFromFile(tp) : null; })()); };
const todo = cases.filter((c) => !done[c.id]);
let i = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (i < todo.length) { const c = todo[i++];
  const kit = kitOf(c.item); const it = kit?.items.find((x) => x.id === c.item);
  if (!it) { done[c.id] = { ...c, skip: true }; continue; }
  const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: it.id }, kit, it);
  const r = await classify({ target, childText: c.text, asrConfidence: 1, typed: true, lang: "hinglish", kit }).catch(() => null);
  done[c.id] = { ...c, out: r?.outcome ?? "err", corr: r?.corroboration ?? null };
  if (Object.keys(done).length % 50 === 0) fs.writeFileSync(OUT, JSON.stringify(done)); } }));
fs.writeFileSync(OUT, JSON.stringify(done));
console.log("classified", Object.keys(done).length);
