import { getKit } from "/home/user/Taxila/server/content/index.js";
import { planModule } from "/home/user/Taxila/server/director/modules.js";
for (const topic of ["c6-maths-ch06-t01","c5-maths-ch01-t01","c6-science-ch01-t01","c7-science-ch01-t01","c6-sst-ch01-t01"]) {
  const kit = await getKit(topic, { generate: false });
  for (const kind of ["reteach","explain"]) {
  const s = { module: null, turn: 3, ctx: { sessionId: "L1", classLevel: 6 }, failedEngines: [], lastContent: [] };
  const item = kit.items?.[0];
  const cmds = planModule(s, { kit, item, move: { kind, visual: "game", request: "visual" }, lang: "hinglish", band: "B3" });
  console.log(topic, kind, kit.title, "|", JSON.stringify(cmds.map(c => ({ op: c.op, engine: c.engine ?? c.module?.engine, mode: (c.params ?? c.module?.params)?.mode }))), JSON.stringify(s.mountRefusals ?? []).slice(0,200));
  }
}
