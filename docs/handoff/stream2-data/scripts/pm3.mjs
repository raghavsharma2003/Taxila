import { getKit } from "/home/user/Taxila/server/content/index.js";
import { planModule } from "/home/user/Taxila/server/director/modules.js";
for (const topic of ["c6-maths-ch06-t01","c5-maths-ch01-t01","c6-science-ch01-t01"]) {
  const kit = await getKit(topic, { generate: false });
  const s = { module: null, turn: 3, ctx: { sessionId: "L1", classLevel: 6 }, failedEngines: [], lastContent: [] };
  // turn 2: explain with no item; turn 3: reteach visual with no item
  const c2 = planModule(s, { kit, item: null, move: { kind: "explain" }, lang: "hinglish", band: "B3" });
  s.turn = 4;
  const c3 = planModule(s, { kit, item: null, move: { kind: "reteach", visual: "game", request: "visual" }, lang: "hinglish", band: "B3" });
  const f = (cmds) => cmds.map(c => `${c.op}:${c.engine ?? c.module?.engine ?? ""}:${(c.params ?? c.module?.params)?.mode ?? ""}`).join(",") || "none";
  console.log(topic, "explain:", f(c2), "| ask:", f(c3));
}
