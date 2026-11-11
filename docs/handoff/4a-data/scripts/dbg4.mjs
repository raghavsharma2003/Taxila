import fs from "node:fs"; import path from "node:path";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor } from "/home/user/Taxila/server/director/classify.js";
import { completeForms, reasonHead, supports, assertionOf } from "/home/user/Taxila/server/grading/corroborate.js";
console.info = () => {};
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
walk("/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad/sl3/evals");
const want = [/^Neutralisation! The base/, /^Arre, you said it first/, /छन-छन\.\.\. पर मुझे/, /^Common salt and water/];
for (const f of files) { const j = JSON.parse(fs.readFileSync(f, "utf8")); for (const t of j.turns ?? []) { const s = t.child?.sent; const id = t.reasons?.item?.id; if (!s || !id || !want.some((w) => w.test(s))) continue;
  const tp = id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)?.[0]; if (!tp) continue; const kit = kitFromFile(getTopic(tp)); const item = kit.items.find((i) => i.id === id);
  const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: id }, kit, item);
  console.log("TEXT:", s); console.log("  FORMS:", JSON.stringify(completeForms(target))); console.log("  HEAD:", JSON.stringify(reasonHead(s)?.head)); } }
