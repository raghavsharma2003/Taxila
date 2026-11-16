import { getKit } from "/home/user/Taxila/server/content/index.js";
import { planModule, mountRefusals } from "/home/user/Taxila/server/director/modules.js";
const kit = await getKit("c6-maths-ch07-t01", { generate: false });
const t = {};
for (const item of kit.items) for (const kind of ["explain","worked_example","practice","probe","ask"]) {
  const s = { module: null, turn: 3, ctx: { sessionId: "L9", classLevel: 6 }, failedEngines: [], lastContent: [] };
  const cmds = planModule(s, { kit, item, move: { kind, itemId: item.id }, lang: "hinglish", band: "B3" });
  const k = kind + " " + (cmds.filter(c=>c.op==="mount").map(c=>`${c.engine ?? c.module?.engine}:${(c.params ?? c.module?.params)?.mode}:${c.goal ?? c.module?.goal ?? "-"}`).join(",") || "none");
  t[k]=(t[k]??0)+1;
}
console.log(t); const r = mountRefusals(); console.log(r.length, JSON.stringify(r.slice(0,5)));
