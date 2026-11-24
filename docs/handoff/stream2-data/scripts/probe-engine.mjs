import fs from "node:fs";
import { planModule } from "../../../../../home/user/Taxila/server/director/modules.js";
const TOPIC_MAP = JSON.parse(fs.readFileSync("shared/engine-topic-map.json", "utf8"));
const out = { mounted: 0, rung: 0, none: 0, byEngine: {} , samples: [] };
for (let c = 4; c <= 9; c++) {
  const kits = JSON.parse(fs.readFileSync(`data/kits/c${c}-maths.json`, "utf8")).topics;
  for (const kit of kits) {
    const eng = TOPIC_MAP[kit.topicId]; if (!eng) continue;
    const item = kit.items?.[0] ?? null;
    for (const kind of ["explain"]) {
      const s = { module: null, turn: 3, ctx: { sessionId: "probe-" + kit.topicId }, failedEngines: [], lastContent: [] };
      let cmds = [];
      try { cmds = planModule(s, { kit, item, move: { kind, visual: "game" }, lang: "hinglish", band: "B3" }); } catch (e) { cmds = []; }
      const m = cmds.find((x) => x.op === "mount");
      const k = !m ? "none" : m.engine === "explainer@1" ? "rung" : "mounted";
      out[k]++; (out.byEngine[eng] ??= { mounted: 0, rung: 0, none: 0 })[k]++;
      if (k !== "mounted" && out.samples.length < 8) out.samples.push(kit.topicId + " " + eng + " " + k);
    }
  }
}
console.log(JSON.stringify(out, null, 1));
