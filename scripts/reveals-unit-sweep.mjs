// 14.4 (main): items.js revealsAnswer over sim-lab records (adult-run simulated lessons, no child): each teacher line against
// the kit item open on that turn (ui.ask.itemId). Writes the verdicts so a change can be compared: node scripts/reveals-unit-sweep.mjs <records-root> <out.json>
import fs from "node:fs";
import path from "node:path";
import { revealsAnswer } from "../server/director/items.js";

const [root, out] = process.argv.slice(2);
const kits = new Map();
const itemOf = (id) => {
  const m = /^(c\d+)-([a-z]+)-/.exec(id ?? "");
  if (!m) return null;
  const f = `data/kits/${m[1]}-${m[2]}.json`;
  if (!kits.has(f)) kits.set(f, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null);
  for (const t of kits.get(f)?.topics ?? []) { const it = (t.items ?? []).find((i) => i.id === id); if (it) return it; }
  return null;
};
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const rows = [];
let lines = 0, withItem = 0;
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  let open = null;
  for (const t of r.turns ?? []) {
    const id = t.ui?.ask?.itemId;
    if (id && !String(id).startsWith("fade:")) open = id;
    if (!t.teacher) continue;
    lines++;
    const item = itemOf(open);
    if (!item) continue;
    withItem++;
    rows.push({ lesson: path.basename(f), turn: t.n, itemId: item.id, key: item.answer, leak: revealsAnswer(t.teacher, item), line: t.teacher });
  }
}
fs.writeFileSync(out, JSON.stringify({ lines, withItem, leaks: rows.filter((x) => x.leak).length, rows }, null, 0));
console.log(JSON.stringify({ lines, withItem, leaks: rows.filter((x) => x.leak).length }));
