import fs from "node:fs"; import path from "node:path";
import { POINT_DIAG } from "/home/user/Taxila/server/director/say.js";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let lines = 0, hit = 0, moved = 0;
for (const f of walk(root)) for (const t of JSON.parse(fs.readFileSync(f, "utf8")).turns ?? []) {
  if (!t.teacher) continue; lines++;
  if (!POINT_DIAG.test(t.teacher)) continue; hit++;
  const s = t.screen ?? {};
  if (!(s.whiteboard || s.module || s.studio)) { moved++; console.log(path.basename(f), t.n, t.teacher.slice(0, 120)); }
}
console.log(JSON.stringify({ lines, pointingDiagram: hit, movedEmptyStage: moved }));
