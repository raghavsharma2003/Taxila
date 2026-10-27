import fs from "node:fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { fadeItem } from "/home/user/Taxila/server/director/fading.js";
import { targetFor, classifyFast } from "/home/user/Taxila/server/director/classify.js";
const j = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/c1-maths.json", "utf8"));
const hits = j.topics.filter((k) => JSON.stringify(k?.workedExample ?? "").includes("7 − 2") || JSON.stringify(k?.workedExample ?? "").includes("7 - 2"));
for (const h of hits) {
  const K = kitFromFile(getTopic(h.topicId));
  const f = fadeItem(K, {});
  console.log(h.topicId, JSON.stringify(K.workedExample.steps), "fade", f?.id, JSON.stringify(f?.answer ?? f?.key));
  const target = targetFor({ fadeItem: f }, K, f);
  console.log("  target", JSON.stringify({ key: target.key, also: target.also, mode: target.mode }));
  const heard = "Pehle poore kites gino, phir do kites hatao; bachi kites ko gino. Ab aage kya karenge? Write it: 7 − 2 = ___.";
  for (const t of ["5", "5 kites", "paanch", "4"]) { const r = classifyFast({ target, childText: t, typed: true, heard }); console.log("   ", t, "→", r.result ? `${r.result.outcome}/${r.result.source}` : `null ${Object.keys(r).filter((k) => !["flags", "text", "result"].includes(k)).join(",")}`); }
}
