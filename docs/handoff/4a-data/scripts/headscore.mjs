import fs from "fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor } from "/home/user/Taxila/server/director/classify.js";
import { supports, completeForms, assertionOf } from "/home/user/Taxila/server/grading/corroborate.js";
import { numberPhrases } from "/home/user/Taxila/server/grading/spoken-number.js";
const done = JSON.parse(fs.readFileSync(process.argv[2]));
const nums = (s) => numberPhrases(s, { split: true }) ?? [];
const rawNums = (s) => [...String(s ?? "").matchAll(/\d+(?:\.\d+)?/g)].map((m) => +m[0]);
// the answer head: up to the first explanation marker, or the first sentence
const MARK = /(?:^|[^\p{L}])(?:kyunki|kyonki|kyuki|because|cause|coz|matlab|yaani|yani|jaise|like|since|so|toh\s+isliye|isliye|kyu\s*ki|क्योंकि|मतलब|जैसे|यानी|इसलिए)(?![\p{L}])/iu;
export const headOf = (t) => { const s = String(t ?? ""); const m = s.search(MARK); const cut = m > 0 ? s.slice(0, m) : s; const first = cut.split(/(?<=[.!?।])\s+/)[0]; return first.trim(); };
const kits = {};
const kitOf = (id) => { const topic = (id.match(/^(c\d-[a-z]+-ch\d+-t\d+)/) ?? [])[1]; if (!topic) return null; return (kits[topic] ??= (() => { const tp = getTopic(topic); return tp ? kitFromFile(tp) : null; })()); };
const tab = {}; const flips = [];
for (const c of Object.values(done)) { if (c.skip || c.out === "err") continue;
  const truth = c.outcome === "right" ? "right" : "notright";
  const before = c.out === "correct" ? "credit" : ["incorrect", "misconception", "partial"].includes(c.out) ? "nocredit" : "lost";
  let after = before;
  if (c.out === "no_evidence" && String(c.corr ?? "").startsWith("unsupported_credit")) {
    const kit = kitOf(c.item); const it = kit.items.find((x) => x.id === c.item);
    const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: it.id }, kit, it);
    const forms = completeForms(target);
    const allowed = [target.key, ...(target.also ?? []), ...(target.options ?? []).map((x) => x?.text), it.prompt_en, it.prompt_hi, assertionOf(target)].flatMap((s) => [...nums(s), ...rawNums(s)]);
    const head = headOf(c.text);
    if (head && head !== c.text.trim() && forms.map((f) => supports(f, head, allowed, forms, `${it.prompt_en ?? ""} ${it.prompt_hi ?? ""}`)).some((r) => r.ok)) { after = "credit"; flips.push({ truth, head, text: c.text.slice(0, 100), key: it.answer }); }
  }
  for (const [k, v] of [["before", before], ["after", after]]) { const key = `${c.arm} ${k}`; tab[key] ??= {}; tab[key][`${truth}→${v}`] = (tab[key][`${truth}→${v}`] ?? 0) + 1; }
}
console.log(tab);
console.log("flips", flips.length, "of which notright", flips.filter((f) => f.truth === "notright").length);
for (const f of flips.filter((f) => f.truth === "notright")) console.log("FALSE", JSON.stringify(f));
for (const f of flips.filter((f) => f.truth === "right").slice(0, 8)) console.log("ok", JSON.stringify(f));
