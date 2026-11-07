import fs from "node:fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor } from "/home/user/Taxila/server/director/classify.js";
import { reasonHead, reasonTakesBack, completeForms, supports, assertionOf } from "/home/user/Taxila/server/grading/corroborate.js";
import { numberPhrases } from "/home/user/Taxila/server/grading/spoken-number.js";
console.info = () => {};
const o = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const kits = {}; const kitOf = (id) => { const tp = id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)[0]; return (kits[tp] ??= kitFromFile(getTopic(tp))); };
const rawNums = (s) => (String(s ?? "").replace(/(?<=\d),(?=\d)/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const cat = {}; const ex = {};
for (const x of o.filter((x) => x.now === "no_evidence")) {
  const kit = kitOf(x.id), item = kit.items.find((i) => i.id === x.id);
  const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: x.id }, kit, item);
  const forms = completeForms(target);
  const allowed = [target.key, ...(target.also ?? []), item.prompt_en, item.prompt_hi, assertionOf(target)].flatMap((s) => [...(numberPhrases(s) ?? []), ...rawNums(s)]);
  const prompt = `${item.prompt_en} ${item.prompt_hi}`;
  const h = reasonHead(x.text);
  let c;
  if (["why", "teachback"].includes(item.kind)) c = "why/teachback item (excluded)";
  else if (!h) c = "no reason marker";
  else {
    const sup = forms.map((f) => supports(f, h.head, allowed, forms, prompt));
    const okF = forms.filter((f, i) => sup[i].ok);
    if (!okF.length) c = `head carries no form (${sup.map((s) => s.why).join("/")})`;
    else c = `veto: ${reasonTakesBack(h.rest, h.head, [...forms, assertionOf(target)].flatMap((f) => [...(numberPhrases(f) ?? []), ...rawNums(f)]), new Set())}`;
  }
  cat[c] = (cat[c] ?? 0) + 1; (ex[c] ??= []).push(`${x.f}#${x.n} ${x.kind} key=${x.key.slice(0, 40)} | ${x.text.slice(0, 120)}`);
}
for (const [k, v] of Object.entries(cat).sort((a, b) => b[1] - a[1])) { console.log(String(v).padStart(3), k); for (const e of ex[k].slice(0, 2)) console.log("      ", e); }
