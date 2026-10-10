// How many kit items would the planner mount with a config the frame refuses? (before = HEAD planEngine without the check)
import { readFileSync, readdirSync } from "node:fs";
const root = process.argv[2] ?? "/home/user/Taxila";
const { planEngine, validModes } = await import(root + "/shared/engine-catalog.js");
const { engineConfigError } = await import("/home/user/Taxila/server/director/engine-check.js");
const TOPIC_MAP = JSON.parse(readFileSync(root + "/shared/engine-topic-map.json", "utf8"));
const { normalizeKit } = await import(root + "/server/content/kits.js");
let n = 0, planned = 0, bad = 0; const byEngine = {}; const ex = [];
for (const f of readdirSync(root + "/data/kits").filter((x) => /^c\d-.*\.json$/.test(x))) {
  for (const raw of JSON.parse(readFileSync(root + "/data/kits/" + f, "utf8")).topics) {
    let kit; try { kit = normalizeKit(raw, { topicId: raw.topicId, verified: true }); } catch { continue; }
    for (const item of kit.items) {
      n++;
      for (const mode of ["show", "predict"]) {
        const plan = planEngine({ kit, item, lang: "hinglish", mode, topicMap: TOPIC_MAP });
        if (!plan) continue;
        planned++;
        const err = engineConfigError(plan.engine, validModes(plan.engine, plan.params));
        if (err) { bad++; byEngine[plan.engine] = (byEngine[plan.engine] ?? 0) + 1; if (ex.length < 6) ex.push(`${item.id} ${plan.engine}: ${err} | ${item.prompt_en.slice(0, 70)}`); }
      }
    }
  }
}
console.log(JSON.stringify({ root, items: n, plans: planned, refusedByFrame: bad, byEngine }, null, 1)); for (const e of ex) console.log(e);
