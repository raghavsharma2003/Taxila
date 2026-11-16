import fs from "node:fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor, classifyFast } from "/home/user/Taxila/server/director/classify.js";
import { corroborate, completeForms, reasonHead } from "/home/user/Taxila/server/grading/corroborate.js";
import { plainNumberKey } from "/home/user/Taxila/server/grading/spoken-number.js";
console.info = () => {};
const src = [...JSON.parse(fs.readFileSync("after-agent_gpt6.json")), ...JSON.parse(fs.readFileSync("after-director.json"))];
const kits = {}; const kitOf = (id) => { const tp = id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)[0]; return (kits[tp] ??= kitFromFile(getTopic(tp))); };
const reasonsOf = {}; for (const x of src) { const h = reasonHead(x.text); if (h) (reasonsOf[x.id] ??= []).push(h.rest); }
const GENERIC = ["kyunki maine dhyan se dekha", "because I checked it on the board", "isliye toh yeh hi hoga", "क्योंकि मैंने गिनकर देखा", "taaki sab theek rahe", "kyunki didi ne pehle bataya tha"];
const ids = [...new Set(src.map((x) => x.id))];
const grade = (target, text) => {
  const fast = classifyFast({ target, childText: text, typed: true });
  if (fast.result) return { path: fast.result.source, outcome: fast.result.outcome };
  const r = corroborate({ target, text, result: { outcome: "correct", confidence: 0.9, source: "model", flags: {} } });
  return { path: "model:" + (r.corroboration ?? ""), outcome: r.outcome };
};
const wrongSet = [], contraSet = [];
for (const id of ids) {
  const kit = kitOf(id), item = kit.items.find((i) => i.id === id);
  if (["why", "teachback"].includes(item.kind)) continue;
  const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: id }, kit, item);
  const forms = completeForms(target); const head = [...forms].sort((a, b) => a.length - b.length)[0];
  const kv = plainNumberKey(target.key);
  const others = kit.items.filter((i) => i.id !== id && i.answer && String(i.answer) !== String(item.answer)).map((i) => String(i.answer).split(/[.;]/)[0].slice(0, 40));
  const wrongs = kv != null ? [kv + 1, kv > 1 ? kv - 1 : kv + 2, kv * 10, kv + 10].map(String) : others.slice(0, 4);
  const reasons = [...(reasonsOf[id] ?? []).slice(0, 2), ...GENERIC.slice(0, 2)];
  for (const w of wrongs) for (const r of reasons.slice(0, 3)) wrongSet.push({ id, text: `${w}, ${r}`, target, kit });
  const w = wrongs[0];
  const r0 = reasons[0];
  for (const t of [`${head}, ${r0}... nahi nahi, ${w}`, `${head} ya ${w}, ${r0}`, ...(/^(?:no|nahi|nahin|नहीं)\b/i.test(head) ? [] : [`${head} nahi, ${r0}`]), `${head}, ${r0}, toh answer ${w} hai`, `${head}, ${r0}. wait, ${w}`, `${head}, ${r0}, par shayad ${w} hoga`])
    contraSet.push({ id, text: t, target, kit });
}

export const sets = { "wrong head + reason": wrongSet.filter((_, i) => i % 3 === 0), "right head + contradicting reason": contraSet.filter((_, i) => i % 3 === 0) };
