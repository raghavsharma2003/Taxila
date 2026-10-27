import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic, topicIdByPrefix } from "/home/user/Taxila/server/content/curriculum.js";
import { fadeItem } from "/home/user/Taxila/server/director/fading.js";
import { targetFor, classifyFast } from "/home/user/Taxila/server/director/classify.js";
import fs from "node:fs"; import path from "node:path";
const SP = process.argv[2];
const find = (name) => { const out = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(name) && out.push(p); } }; walk(SP + "/sl3/evals"); walk(SP + "/dg/evals"); return out[0]; };
for (const [file, n] of [["p23-c5-maths-anxious--agent_gpt6--text.json", 11], ["p55-c1-maths-shy--director--text.json", 5]]) {
  const rec = JSON.parse(fs.readFileSync(find(file), "utf8"));
  const prev = rec.turns.find((t) => t.n === n - 1), t = rec.turns.find((x) => x.n === n);
  const itemId = prev.ui.ask.itemId;
  const tid = rec.topicId ?? rec.meta?.topicId ?? topicIdByPrefix(itemId) ?? rec.card?.topicId;
  const K = kitFromFile(getTopic(tid));
  const item = itemId.startsWith("fade:") ? fadeItem(K, {}) : K.items.find((i) => i.id === itemId);
  const target = targetFor({ fadeItem: item }, K, item);
  const r = classifyFast({ target, childText: t.child.sent, typed: true, heard: t.teacher ? prev.teacher : "" });
  console.log(file, tid, itemId, "key", JSON.stringify(target.key), "→", r.result ? `${r.result.outcome}/${r.result.source}` : `null ${Object.keys(r).filter((k) => !["flags", "text", "result"].includes(k)).join(",")}`, "| heard:", String(prev.teacher).slice(-120));
}
