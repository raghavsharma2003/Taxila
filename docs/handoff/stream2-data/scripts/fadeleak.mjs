import fs from "node:fs"; import path from "node:path";
import * as N from "/home/user/Taxila/server/director/fading.js";
import * as O from "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/fading-old.mjs";
import { revealsAnswer } from "/home/user/Taxila/server/director/items.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import * as C from "/home/user/Taxila/server/content/curriculum.js";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let lines = 0, moved = 0; const ex = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const top = C.getTopic(r.start?.topic?.id); if (!top) continue; const kit = kitFromFile(top); if (!kit?.workedExample) continue;
  let open = null;
  for (const t of r.turns ?? []) {
    const id = t.ui?.ask?.itemId; if (id) open = id;
    if (!t.teacher || !String(open ?? "").startsWith("fade:")) continue;
    const i = Number(open.slice(5));
    const a = O.fadeItem(kit, { index: i }), b = N.fadeItem(kit, { index: i }); if (!a || !b) continue;
    lines++;
    const x = revealsAnswer(t.teacher, a), y = revealsAnswer(t.teacher, b);
    if (x !== y) { moved++; ex.push(`${x}->${y} key=${a.answer} | ${t.teacher.slice(0, 120)}`); }
  }
}
console.log(JSON.stringify({ fadeTurnLines: lines, moved })); for (const e of ex) console.log(e);
