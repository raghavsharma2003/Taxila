import fs from "node:fs"; import path from "node:path";
import { syncedWithLine } from "/home/user/Taxila/server/studio/request.js";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let mounts = 0, unsynced = 0; const by = {}; const ex = [];
for (const f of walk(root)) {
  const run = path.basename(path.dirname(path.dirname(f)));
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const t of r.turns ?? []) {
    for (const c of t.moduleCommands ?? []) {
      if (c.op !== "mount" || c.engine !== "explainer@1" || !c.params?.script || !t.teacher) continue;
      mounts++;
      const ok = syncedWithLine(c.params.script, t.teacher);
      const kind = typeof t.move === "string" ? t.move : t.move?.kind;
      by[run] ??= [0, 0]; by[run][0]++;
      if (!ok) { unsynced++; by[run][1]++; if (ex.length < 12) ex.push({ run: run.slice(0, 20), n: t.n, kind, req: t.move?.request ?? null, texts: (c.params.script.ops ?? []).filter((o) => o.text).map((o) => o.text).join(" | ").slice(0, 80), line: t.teacher.slice(0, 100) }); }
    }
  }
}
console.log(JSON.stringify({ rungMounts: mounts, sharesNothingWithHerLine: unsynced }), JSON.stringify(by));
for (const e of ex) console.log(JSON.stringify(e));
