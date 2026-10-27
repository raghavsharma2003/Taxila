import fs from "node:fs";
import { planEngine, ENGINES } from "/home/user/Taxila/shared/engine-catalog.js";
const TOPIC_MAP = JSON.parse(fs.readFileSync("shared/engine-topic-map.json", "utf8"));
const ids = process.argv.slice(2);
for (const id of ids) {
  const c = id.match(/^c(\d+)/)[1];
  const kit = JSON.parse(fs.readFileSync(`data/kits/c${c}-maths.json`, "utf8")).topics.find((t) => t.topicId === id);
  const res = [];
  for (const item of [null, ...(kit.items ?? []).slice(0, 6)]) {
    const p = planEngine({ kit, item, lang: "hinglish", mode: "show", representation: "diagram", topicMap: TOPIC_MAP });
    res.push((item?.id?.slice(-3) ?? "none") + ":" + (p ? p.engine + (p.bindItem ? "B" : "u") : "-"));
  }
  console.log(id, TOPIC_MAP[id], "| we:", String(kit.workedExample?.problem ?? "").slice(0, 60), "|", res.join(" "));
}
