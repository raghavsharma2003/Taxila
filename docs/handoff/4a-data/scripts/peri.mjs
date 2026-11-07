import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { fadeItem } from "/home/user/Taxila/server/director/fading.js";
import { classifyFast, targetFor } from "/home/user/Taxila/server/director/classify.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import fs from "node:fs";
const j = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/c6-maths.json", "utf8"));
const tid = j.topics.find((k) => JSON.stringify(k?.workedExample ?? "").includes("Rani runs 3 rounds")).topicId;
console.log("topic", tid);
const kit = kitFromFile(getTopic(tid));
for (const band of [undefined, "low", "mid", "high"]) {
  const f = fadeItem(kit, { band });
  if (!f) continue;
  const s = { fadeItem: f, kitItems: [], items: [] };
  const item = f;
  const target = targetFor({ fadeItem: f }, kit, item);
  console.log(band, f.id, JSON.stringify({ key: target.key, mode: target.mode, also: target.also }));
  for (const t of ["130 metre", "130 m", "130", "160 metre", "160 m", "160", "160 meter"]) {
    const r = classifyFast({ target, childText: t, typed: true });
    console.log("   ", t.padEnd(12), r.result ? `${r.result.outcome}/${r.result.source}` : `null ${JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !["flags", "text", "result"].includes(k))))}`);
  }
}
