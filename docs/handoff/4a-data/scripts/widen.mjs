import fs from "node:fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor } from "/home/user/Taxila/server/director/classify.js";
import { reasonHeadSupports, reasonHead } from "/home/user/Taxila/server/grading/corroborate.js";
console.info = () => {};
const kits = {}; const kitOf = (id) => { const tp = id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)[0]; return (kits[tp] ??= kitFromFile(getTopic(tp))); };
for (const f of process.argv.slice(2)) {
  const o = JSON.parse(fs.readFileSync(f)).filter((x) => x.now === "no_evidence");
  let n = 0, would = 0; const ex = [];
  for (const x of o) {
    if (reasonHead(x.text)) continue;
    const m = x.text.search(/(?:^|[^\p{L}])(?:matlab|yaani|yani|jaise|मतलब|यानी|जैसे)(?![\p{L}])/iu);
    if (m <= 0) continue;
    n++;
    const kit = kitOf(x.id), item = kit.items.find((i) => i.id === x.id);
    const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: x.id }, kit, item);
    const swapped = x.text.slice(0, m) + " kyunki" + x.text.slice(m).replace(/^(\s*\S+)/, "");
    const forms = [target.key, ...(target.also ?? [])].filter(Boolean);
    const allowed = []; // reasonHeadSupports re-derives answer numbers; allowed: numbers the check accepts
    const { completeForms, assertionOf } = await import("/home/user/Taxila/server/grading/corroborate.js");
    const { numberPhrases } = await import("/home/user/Taxila/server/grading/spoken-number.js");
    const rawNums = (s) => (String(s ?? "").replace(/(?<=\d),(?=\d)/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
    const al = [target.key, ...(target.also ?? []), item.prompt_en, item.prompt_hi, assertionOf(target)].flatMap((s) => [...(numberPhrases(s) ?? []), ...rawNums(s)]);
    if (reasonHeadSupports(target, swapped, completeForms(target), al, `${item.prompt_en} ${item.prompt_hi}`)) { would++; ex.push(x.text.slice(0, 110)); }
  }
  console.log(f, "no listed marker but matlab/jaise/yaani:", n, "| head would carry a form:", would); for (const e of ex.slice(0, 4)) console.log("    ", e);
}
