// round3 truth: the bare-wrong-number floor (patch 01, director/classify.js) may only ever turn a model ABSTENTION on a
// reply that is only a number into "incorrect". This proves, over every kit item in classes 1-9 whose key the ORACLE reads
// as a plain value, and every surface form the oracle writes for that value, that classifyFast never marks a RIGHT form
// as a bare wrong number (no false fail is possible by construction), and reports how many WRONG forms it does mark
// (the floor's coverage). Deterministic; no network.
//   node evals/grading-truth/round3/floor-safety.mjs --root <tree with patch 01> [--classes 1-9]
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import * as O from "../lib/oracle.mjs";
const HERE = new URL(".", import.meta.url).pathname, MAIN = resolve(HERE, "../../..");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = resolve(arg("--root", MAIN));
const [LO, HI] = (arg("--classes", "1-9").match(/^(\d)-(\d)$/) ?? [null, "1", "9"]).slice(1).map(Number);
const CL = await import(pathToFileURL(join(ROOT, "server/director/classify.js")).href);
const { getKit } = await import(pathToFileURL(join(ROOT, "server/content/index.js")).href);
const UNIT_RE = /\s*(?:cm|mm|km|m|kg|g|mg|ml|l|litres?|liters?|metres?|meters?|grams?|minutes?|mins?|hours?|hrs?|seconds?|days?|years?|rupees?|°c|°|degrees?|units?|paise)\.?$/i;
const oracleKey = (a) => O.keyValue(String(a ?? "").trim().replace(/^(?:₹|rs\.?)\s*/i, "").replace(UNIT_RE, "").trim());
const r = O.rng(7);
let items = 0, rightForms = 0, rightMarked = [], wrongForms = 0, wrongMarked = 0, wrongBare = 0;
for (const f of readdirSync(join(MAIN, "data/kits")).filter((x) => { const m = /^c(\d)-.*\.json$/.exec(x); return m && +m[1] >= LO && +m[1] <= HI; }).sort()) {
  for (const t of JSON.parse(readFileSync(join(MAIN, "data/kits", f), "utf8")).topics) {
    const kit = await getKit(t.topicId, { generate: false });
    if (!kit) continue;
    for (const item of kit.items.filter((i) => !["why", "teachback"].includes(i.kind))) {
      const q = oracleKey(item.answer);
      if (!q) continue;
      const target = CL.targetFor({ phase: "practice", hintLevel: 0 }, kit, { ...item, misconceptions: kit.misconceptions });
      if (target.mode !== "item") continue;
      items++;
      const forms = q.d === 1 ? O.intForms(q.n) : [...(O.isTerminating(q) ? O.decForms(q) : []), ...O.fracForms(q)];
      const run = (text) => CL.classifyFast({ target, childText: text, heard: item.prompt_en ?? "", asrConfidence: 0.92, typed: true, classLevel: 6, trace: [], lang: "english" });
      for (const fm of forms) {
        rightForms++;
        const out = run(fm.text);
        if (out.bareWrongNumber) rightMarked.push({ itemId: item.id, key: item.answer, form: fm.text, kind: fm.kind });
      }
      for (let k = 0; k < 3; k++) {
        const w = q.d === 1 ? O.Q(O.nearMiss(r, q.n).v) : O.nearMissFrac(r, q).v;
        if (O.qEq(w, q)) continue;
        const text = O.qStr(w);
        wrongForms++;
        if (CL.BARE_NUMBER?.test(text)) wrongBare++;
        if (run(text).bareWrongNumber) wrongMarked++;
      }
    }
  }
}
console.log(JSON.stringify({ root: ROOT, classes: [LO, HI], items, rightForms, rightFormsMarkedBareWrong: rightMarked.length, wrongForms, wrongBare, wrongMarked }));
for (const x of rightMarked.slice(0, 20)) console.log("  RIGHT FORM MARKED", JSON.stringify(x));
process.exitCode = rightMarked.length ? 1 : 0;
