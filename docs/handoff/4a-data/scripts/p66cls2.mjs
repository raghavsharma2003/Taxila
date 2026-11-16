import { kitFromFile } from "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad/r2/server/content/kits.js";
import { getTopic } from "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad/r2/server/content/curriculum.js";
import { classify, classifyFast, targetFor } from "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad/r2/server/director/classify.js";
const K = kitFromFile(getTopic("c3-evs-ch07-t02"));
const cases = [["i13", "Taaki dhool aur machchar andar na jaayein. Aur kitanu bhi. Warna paani ganda ho jaata hai."],
  ["i02", "Brushing mein toh tap band karna. Aur nahate time bucket use karna, shower nahi."],
  ["i02", "Tap band karo jab brush karo, aur nahane ke liye bucket use karo, shower se nahi... jaldi khatam karo nahana."],
  ["i01", "Safe rakhne ke liye... paani ko dhakkan se band karna aur thande jagah par rakhna."]];
for (const [id, text] of cases) {
  const item = K.items.find((x) => x.id.endsWith("-" + id));
  console.log(id, "key:", JSON.stringify(item.answer).slice(0, 120), "| acceptable:", JSON.stringify(item.acceptable ?? []).slice(0, 160));
  const target = targetFor({}, K, item);
  const f = classifyFast({ target, childText: text, typed: true, heard: item.prompt_en });
  console.log("   fast:", f.result ? `${f.result.outcome}/${f.result.source}` : "→ model", Object.keys(f).filter((k) => !["flags", "text", "result"].includes(k)).join(","));
  const trace = [];
  const r = await classify({ target, childText: text, typed: true, heard: item.prompt_en, classLevel: 3, trace });
  console.log("   classify:", r.outcome, r.source, JSON.stringify({ covered: r.covered, missing: r.missing, veto: r.veto ?? r.vetoed ?? r.why }).slice(0, 200));
  console.log("   trace:", JSON.stringify(trace.map((t) => t.k ?? t.kind ?? t.code ?? t).slice(0, 12)).slice(0, 300));
}
process.exit(0);
