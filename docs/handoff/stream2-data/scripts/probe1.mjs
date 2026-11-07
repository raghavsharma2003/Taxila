import fs from "node:fs";
import { planModule } from "/home/user/Taxila/server/director/modules.js";
const id = process.argv[2];
const c = id.match(/^c(\d+)/)[1];
const kit = JSON.parse(fs.readFileSync(`data/kits/c${c}-maths.json`, "utf8")).topics.find((t) => t.topicId === id);
for (const item of [kit.items?.[0], null]) {
  const s = { module: null, turn: 3, ctx: { sessionId: "probe-x" }, failedEngines: [], lastContent: [] };
  const cmds = planModule(s, { kit, item, move: { kind: "reteach", visual: "game", representation: "diagram" }, lang: "hinglish", band: "B3" });
  console.log(item?.id ?? "no item", JSON.stringify(cmds.map((x) => ({ op: x.op, engine: x.engine, params: x.params && Object.keys(x.params) }))));
}
