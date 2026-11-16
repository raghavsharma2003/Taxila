import fs from "node:fs";
import { admitPlay } from "/home/user/Taxila/server/forge3/compose.js";
import { topicGameFor } from "/home/user/Taxila/server/director/modules.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import * as C from "/home/user/Taxila/server/content/curriculum.js";
const ids = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) {
  const k = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8"));
  for (const t of k.topics ?? []) ids.push(t.topicId ?? t.id);
}
let n = 0, play = 0, engine = 0, either = 0;
const bySubj = {};
for (const id of ids) {
  const t = C.getTopic(id); if (!t) continue;
  const kit = kitFromFile(t); if (!kit) continue;
  n++;
  const p = !!admitPlay(null, id), e = topicGameFor({ ctx: { lang: "hinglish", ageBand: "10-12", sessionId: "x" }, failedEngines: [] }, kit, "hinglish", "B3");
  play += p; engine += e; either += p || e;
  const subj = id.split("-")[1]; bySubj[subj] ??= [0, 0]; bySubj[subj][0]++; bySubj[subj][1] += p || e;
}
console.log(JSON.stringify({ topics: n, play, engine, either, none: n - either, bySubj }));
