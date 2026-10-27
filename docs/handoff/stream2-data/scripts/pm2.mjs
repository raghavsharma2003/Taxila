import { getKit } from "/home/user/Taxila/server/content/index.js";
import { planModule } from "/home/user/Taxila/server/director/modules.js";
for (const topic of ["c6-maths-ch06-t01","c5-maths-ch01-t01"]) {
  const kit = await getKit(topic, { generate: false });
  const tally = {};
  for (const item of kit.items) for (const lc of [[], ["worked example: x"]]) {
    const s = { module: null, turn: 3, ctx: { sessionId: "L1", classLevel: 6 }, failedEngines: [], lastContent: lc, openItemId: item.id, asking: item.id };
    const cmds = planModule(s, { kit, item, move: { kind: "reteach", visual: "game", request: "visual", itemId: item.id }, lang: "hinglish", band: "B3" });
    const k = cmds.map(c => `${c.op}:${c.engine ?? c.module?.engine}:${(c.params ?? c.module?.params)?.mode}`).join(",") || "none";
    tally[k] = (tally[k] ?? 0) + 1;
  }
  console.log(topic, kit.items.length, JSON.stringify(tally));
}
